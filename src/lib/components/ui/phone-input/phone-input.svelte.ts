import { getUnmaskedValue } from "$lib/components/ui/mask-input/index.js";
import { getContext, hasContext, setContext } from "svelte";

import {
	type Country,
	detectCountryFromNumber,
	formatPhoneNumber,
	normalizePhoneInput,
} from "./phone-engine.js";

export type PhoneInputRootStateProps = {
	readonly getValue: () => string;
	readonly setValue: (value: string) => void;
	readonly getCountry: () => string;
	readonly setCountry: (country: string) => void;
	readonly getCountries: () => Country[];
	readonly getPlaceholder: () => string;
	readonly getDisabled: () => boolean;
	readonly getReadOnly: () => boolean;
	readonly getRequired: () => boolean;
	readonly getInvalid: () => boolean;
	readonly getShowFlag: () => boolean;
	readonly getName: () => string | undefined;
	/** The one `$props.id()` the root element falls back to. */
	readonly id: string;
};

/**
 * One instance per `<PhoneInput.Root>`, published on context.
 *
 * Replaces upstream's hand-rolled `Store` + `useSyncExternalStore` and its second
 * `PhoneInputContext` — both exist only because React has no fine-grained
 * reactivity, and both are provided by the same root and read by the same two parts. Reactive
 * inputs arrive as getter functions rather than snapshots, and the value is read straight from the
 * root's `$bindable` props, which is what lets an authoritative parent decline a write.
 */
export class PhoneInputRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: PhoneInputRootStateProps;

	/** Whether the country dropdown is open. */
	open = $state(false);

	/**
	 * Whether the *raw text the user typed* led with a `+` — not a property of the canonical value,
	 * which always leads with one once it holds a digit. It gates auto-detection.
	 */
	startsWithPlus = $state(false);

	/** The rendered `<input>`, registered by `<PhoneInput.Field>` so a selection can focus it. */
	fieldElement = $state<HTMLInputElement | null>(null);

	/** Set by {@link selectCountry} and consumed once by the popover's `onCloseAutoFocus`. */
	#closedBySelection = false;

	readonly value: string = $derived(this.#props.getValue());
	readonly country: string = $derived(this.#props.getCountry());
	readonly countries: Country[] = $derived(this.#props.getCountries());
	readonly placeholder: string = $derived(this.#props.getPlaceholder());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly readOnly: boolean = $derived(this.#props.getReadOnly());
	readonly required: boolean = $derived(this.#props.getRequired());
	readonly invalid: boolean = $derived(this.#props.getInvalid());
	readonly showFlag: boolean = $derived(this.#props.getShowFlag());
	readonly name: string | undefined = $derived(this.#props.getName());
	readonly id: string = $derived(this.#props.id);

	/** What the field shows; the canonical value is what everyone else sees. */
	readonly displayValue: string = $derived(formatPhoneNumber(this.value, this.countries));

	/** `undefined` when the caller's list has no entry for the selected code. */
	readonly selectedCountry: Country | undefined = $derived(
		this.countries.find((country) => country.code === this.country),
	);

	constructor(props: PhoneInputRootStateProps) {
		this.#props = props;
		this.startsWithPlus = props.getValue().startsWith("+");
	}

	/** Upstream's `onChange` body: a no-op while the field cannot be edited. */
	setValueFromInput(raw: string): void {
		if (this.disabled || this.readOnly) return;

		const normalized = normalizePhoneInput(raw);
		this.startsWithPlus = normalized.startsWithPlus;
		this.#props.setValue(normalized.value);
	}

	/** Upstream's `CommandItem.onSelect`: set the country, close, and hand focus to the field. */
	selectCountry(code: string): void {
		this.#props.setCountry(code);
		// Prefill only when the selection actually landed — an authoritative parent that declines
		// the country write keeps the value where it was too.
		if (this.country === code) this.#prefillDialCode(code);
		this.#closedBySelection = true;
		this.open = false;
	}

	/**
	 * Divergence from upstream, which leaves the value untouched on a manual selection: seed an
	 * empty field with the selected country's dial code, and replace any value whose dial code
	 * differs from the selected country's — dropping its national digits — so a selection across
	 * dial codes sticks. Without the replacement the detection effect would snap the stale value
	 * straight back to its own country, making the selection impossible to keep. A number already
	 * under the selected dial code is kept (e.g. a US number when Canada is picked, both `+1`) —
	 * and there, when the value gates detection on, the detection effect snaps the country back
	 * to the detected one, the upstream parity quirk documented on {@link detectCountry}.
	 * `startsWithPlus` stays as-is: marking the seeded value as typed would let the `+1`
	 * tie-break override an explicit Canada selection with US.
	 */
	#prefillDialCode(code: string): void {
		if (this.disabled || this.readOnly) return;

		const next = this.countries.find((country) => country.code === code);
		if (!next) return;

		const value = this.value;
		if (value === next.dialCode) return;

		// Same dial code as the selection: only the country moved — the number stays.
		const isEmpty = value === "" || value === "+";
		if (!isEmpty && detectCountryFromNumber(value, this.countries)?.dialCode === next.dialCode) {
			return;
		}

		this.#props.setValue(next.dialCode);
	}

	/**
	 * Upstream's detection effect, reproduced verbatim including both of
	 * its quirks: `value.slice(1)` drops the first character even when there is no `+` to drop, and
	 * reading `country` means a manual selection made on a detectable value is snapped back.
	 * The write is guarded by `detected.code !== country`, so the effect that calls
	 * this converges after one pass.
	 */
	detectCountry(): void {
		const value = this.value;
		if (!value) return;

		const digits = getUnmaskedValue({ value: value.slice(1) });
		const shouldDetect = this.startsWithPlus || digits.length >= 10;
		if (!shouldDetect) return;

		const detected = detectCountryFromNumber(value, this.countries);
		if (detected && detected.code !== this.country) {
			this.#props.setCountry(detected.code);
		}
	}

	focusField(): void {
		this.fieldElement?.focus();
	}

	/** Whether the popover that is closing was closed by a selection. Reads once, then resets. */
	consumeSelectionClose(): boolean {
		const closedBySelection = this.#closedBySelection;
		this.#closedBySelection = false;
		return closedBySelection;
	}
}

const PHONE_INPUT_CONTEXT_KEY = Symbol("phone-input");

export function setPhoneInputContext(state: PhoneInputRootState): PhoneInputRootState {
	return setContext(PHONE_INPUT_CONTEXT_KEY, state);
}

/** Read the root's state, throwing when there is no `<PhoneInput.Root>` ancestor. */
export function getPhoneInputContext(consumerName: string): PhoneInputRootState {
	if (!hasContext(PHONE_INPUT_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<PhoneInput.Root>\`.`);
	}
	return getContext<PhoneInputRootState>(PHONE_INPUT_CONTEXT_KEY);
}

/** Whether a `<PhoneInput.Root>` ancestor exists, for callers that would rather branch than throw. */
export function hasPhoneInputContext(): boolean {
	return hasContext(PHONE_INPUT_CONTEXT_KEY);
}
