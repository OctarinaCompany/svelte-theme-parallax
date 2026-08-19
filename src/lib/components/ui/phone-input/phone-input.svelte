<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { Attachment } from "svelte/attachments";
	import type { HTMLAttributes } from "svelte/elements";

	import type { Country } from "./phone-engine.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type PhoneInputChildProps = {
		role: string;
		"data-slot": string;
		"data-disabled": "" | undefined;
		"data-invalid": "" | undefined;
		"data-readonly": "" | undefined;
		id: string;
		class: string;
		// The symbol slot carries the attachment that hands the rendered element back to the root,
		// which is how form detection keeps working in `child` mode: upstream composes its ref through
		// Radix's `Slot`, and an attachment is the Svelte equivalent (mask-input's divergence D-11).
	} & Record<string, unknown> &
		Record<symbol, Attachment<HTMLElement>>;

	export type PhoneInputRootProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * The unique identifier for the phone input component.
		 *
		 * @default $props.id()
		 */
		id?: string;
		/**
		 * The controlled value of the phone input — canonical, so `+` followed by digits only.
		 *
		 * Bindable: `bind:value` lets the component move your state, while the function binding
		 * `bind:value={() => value, (next) => …}` keeps you authoritative — a setter that declines
		 * the write leaves the displayed value exactly where it was.
		 */
		value?: string;
		/**
		 * The default value for uncontrolled usage. Seeded once; `value` wins afterwards.
		 *
		 * @default ""
		 */
		defaultValue?: string;
		/** Callback fired when the value changes, in both controlled and uncontrolled modes. */
		onValueChange?: (value: string) => void;
		/**
		 * The controlled country code (ISO 3166-1 alpha-2).
		 *
		 * Bindable, on the same terms as `value`.
		 */
		country?: string;
		/**
		 * The default country code for uncontrolled usage.
		 *
		 * Upstream's type file documents `"US"`, but its implementation falls back to `""` and its
		 * own demo renders the flag-less swatch; runtime behaviour wins here.
		 *
		 * @default ""
		 */
		defaultCountry?: string;
		/** Callback fired on a manual selection **and** on automatic detection. */
		onCountryChange?: (country: string) => void;
		/**
		 * The list of countries to display.
		 *
		 * @default the 239 built-in entries of `getCountries()`, sorted by display name
		 */
		countries?: Country[];
		/** The name of the phone input for form submission. */
		name?: string;
		/**
		 * Placeholder text shown when the value is empty. Wins over a `placeholder` set on
		 * `<PhoneInput.Field>`.
		 *
		 * @default "Enter phone number"
		 */
		placeholder?: string;
		/**
		 * Whether the phone input is disabled.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether the phone input is read-only. The field stays focusable but never changes.
		 *
		 * @default false
		 */
		readOnly?: boolean;
		/**
		 * Whether the phone input is required.
		 *
		 * @default false
		 */
		required?: boolean;
		/**
		 * Whether the phone input is in an invalid state.
		 *
		 * @default false
		 */
		invalid?: boolean;
		/**
		 * Whether to show the country flag.
		 *
		 * @default true
		 */
		showFlag?: boolean;
		/** The parts — `<PhoneInput.CountrySelect>` and `<PhoneInput.Field>`. */
		children?: Snippet;
		/**
		 * Render the group onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `ref` stays `null`; the props carry an attachment that hands the element back to the
		 * root instead, so spreading them keeps the `<form>` detection behind the hidden input
		 * working exactly as it does on the default `<div>`.
		 */
		child?: Snippet<[{ props: PhoneInputChildProps }]>;
	};

	/** Upstream-parity alias of {@link PhoneInputRootProps}. */
	export type PhoneInputProps = PhoneInputRootProps;
</script>

<script lang="ts">
	import { FormControlState } from "$lib/shared/form-control.svelte.js";
	import { untrack } from "svelte";
	import { createAttachmentKey } from "svelte/attachments";

	import { DEFAULT_PHONE_PLACEHOLDER, getCountries } from "./phone-engine.js";
	import { PhoneInputRootState, setPhoneInputContext } from "./phone-input.svelte.js";

	let {
		ref = $bindable(null),
		id,
		value = $bindable(),
		defaultValue = "",
		onValueChange,
		country = $bindable(),
		defaultCountry = "",
		onCountryChange,
		countries = getCountries(),
		name,
		placeholder = DEFAULT_PHONE_PLACEHOLDER,
		disabled = false,
		readOnly = false,
		required = false,
		invalid = false,
		showFlag = true,
		class: className,
		children,
		child,
		...restProps
	}: PhoneInputRootProps = $props();

	// Uncontrolled: seed once from the defaults. Controlled: the caller's binding wins, and a binding
	// that declines the write keeps the rendered state where it was. The seed is a one-shot
	// initialisation, so the defaults are read through `untrack` — reading them bare here would
	// capture only their initial value while looking like a reactive read.
	value ??= untrack(() => defaultValue);
	country ??= untrack(() => defaultCountry);

	const uid = $props.id();

	const phoneState = setPhoneInputContext(
		new PhoneInputRootState({
			getValue: () => value ?? "",
			// Upstream's `setState` is `Object.is`-guarded and fires the callback only on an actual
			// change.
			setValue: (next) => {
				if (next === (value ?? "")) return;
				value = next;
				onValueChange?.(next);
			},
			getCountry: () => country ?? "",
			setCountry: (next) => {
				if (next === (country ?? "")) return;
				country = next;
				onCountryChange?.(next);
			},
			getCountries: () => countries,
			getPlaceholder: () => placeholder,
			getDisabled: () => disabled,
			getReadOnly: () => readOnly,
			getRequired: () => required,
			getInvalid: () => invalid,
			getShowFlag: () => showFlag,
			getName: () => name,
			id: uid,
		}),
	);

	// Upstream's detection effect, dependencies and all. It writes the country it
	// also reads, guarded by `detected.code !== country`, so it converges after one pass.
	$effect(() => {
		phoneState.detectCountry();
	});

	/**
	 * The element the group actually rendered onto. `ref` only ever points at the internal `<div>`,
	 * so in `child` mode the attachment below is the only thing that can tell {@link FormControlState}
	 * which element to walk up from — without it `getElement()` stays `null`, `isFormControl` stays
	 * `true` forever, and the hidden input would be rendered outside any `<form>`.
	 */
	let mountedElement = $state<HTMLElement | null>(null);
	const attach = createAttachmentKey();

	function captureElement(element: HTMLElement) {
		mountedElement = element;
		return () => {
			if (mountedElement === element) mountedElement = null;
		};
	}

	const formControl = new FormControlState({ getElement: () => ref ?? mountedElement });

	let formInput = $state<HTMLInputElement | null>(null);

	/**
	 * The last value handed to the form. Deliberately not reactive: Svelte has already written the
	 * `value` attribute by the time the effect runs, so the element itself cannot say whether the
	 * value moved, and a form library listening on the form needs the native event that upstream's
	 * `VisuallyHiddenInput` dispatches through the native setter.
	 */
	let dispatchedValue = untrack(() => phoneState.value);

	$effect(() => {
		const element = formInput;
		const next = phoneState.value;
		if (!element || next === dispatchedValue) return;

		dispatchedValue = next;
		element.value = next;
		element.dispatchEvent(new Event("input", { bubbles: true }));
	});

	// `role`/`data-*`/`id` first and the class last, exactly as upstream orders its JSX: a caller can
	// override the defaults through `restProps` but never the composed class string.
	const rootAttrs = $derived({
		role: "group",
		"data-slot": "phone-input",
		"data-disabled": disabled ? "" : undefined,
		"data-invalid": invalid ? "" : undefined,
		"data-readonly": readOnly ? "" : undefined,
		id: id ?? phoneState.id,
		...restProps,
		[attach]: captureElement,
		class: cn(
			"relative flex h-8 w-full items-center rounded-lg border border-input bg-transparent transition-colors has-[[data-slot=phone-input-field]:focus-visible]:border-ring has-[[data-slot=phone-input-field]:focus-visible]:ring-3 has-[[data-slot=phone-input-field]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:bg-input/30 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 data-disabled:cursor-not-allowed data-disabled:opacity-50",
			className,
		),
	} as PhoneInputChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}

{#if formControl.isFormControl}
	<input
		bind:this={formInput}
		type="hidden"
		data-slot="phone-input-form-input"
		tabindex={-1}
		{name}
		value={phoneState.value}
		{disabled}
		{required}
		readonly={readOnly}
	/>
{/if}
