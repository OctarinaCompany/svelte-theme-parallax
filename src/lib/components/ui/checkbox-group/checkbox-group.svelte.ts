import { getContext, hasContext, setContext } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

/** Every value `orientation` accepts, in upstream declaration order. */
export const CHECKBOX_GROUP_ORIENTATIONS = ["vertical", "horizontal"] as const;

/** `'vertical' | 'horizontal'` — mirrors the shared-utils reference's `Orientation`. */
export type CheckboxGroupOrientation = (typeof CHECKBOX_GROUP_ORIENTATIONS)[number];

/**
 * What `onValidate` may return. A `string` or `string[]` marks the group invalid and becomes the
 * message; `true`, `null` and `undefined` all clear it.
 */
export type CheckboxGroupValidationResult = string | string[] | true | null | undefined;

/** Upstream `getDataState`. */
export function getDataState(checked: boolean): "checked" | "unchecked" {
	return checked ? "checked" : "unchecked";
}

/** Upstream's `Array.isArray(message) ? message.join(" ") : message`. */
export function toValidationMessage(message: string | string[] | undefined): string | undefined {
	return Array.isArray(message) ? message.join(" ") : message;
}

export type CheckboxGroupRootStateProps = {
	readonly getValue: () => string[];
	readonly setValue: (value: string[]) => void;
	readonly getDefaultValue: () => string[];
	readonly getOnValidate: () => ((value: string[]) => CheckboxGroupValidationResult) | undefined;
	readonly getDisabled: () => boolean;
	readonly getInvalid: () => boolean;
	readonly getReadOnly: () => boolean;
	readonly getRequired: () => boolean;
	readonly getName: () => string | undefined;
	readonly getOrientation: () => CheckboxGroupOrientation;
	readonly getDir: () => Direction;
	/** The one `$props.id()` every part's id is derived from. */
	readonly id: string;
};

/**
 * One instance per `<CheckboxGroup.Root>`, published on context.
 *
 * Replaces upstream's 16-field `CheckboxGroupContextValue` plus its
 * `useControllableState` (107-124). Reactive inputs arrive as getter functions rather than
 * snapshots, and the value is read straight from the root's `$bindable` prop — there is no
 * mirror `$state`, which is what lets an authoritative parent decline a write.
 */
export class CheckboxGroupRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: CheckboxGroupRootStateProps;

	/** The last non-valid `onValidate` return. Upstream's `validationMessage` `useState` (102-104). */
	validationMessage = $state<string | string[] | undefined>(undefined);

	/** Whether a `<CheckboxGroup.Label>` is currently in the document. */
	#hasLabel = $state(false);
	/** Whether a `<CheckboxGroup.Description>` is currently in the document. */
	#hasDescription = $state(false);
	/** Whether a `<CheckboxGroup.Message>` is currently in the document *with content*. */
	#hasMessage = $state(false);

	readonly value: string[] = $derived(this.#props.getValue());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly readOnly: boolean = $derived(this.#props.getReadOnly());
	readonly required: boolean = $derived(this.#props.getRequired());
	readonly name: string | undefined = $derived(this.#props.getName());
	readonly orientation: CheckboxGroupOrientation = $derived(this.#props.getOrientation());
	readonly dir: Direction = $derived(this.#props.getDir());
	readonly isInvalid: boolean = $derived(
		this.#props.getInvalid() || this.validationMessage !== undefined,
	);

	// Derived, not assigned in the constructor: a `$derived` field that reads another field declared
	// below it would be flagged "used before its initialization" by svelte-check, which cannot see
	// that `$derived` is lazy.
	readonly id: string = $derived(this.#props.id);
	readonly labelId: string = $derived(`${this.#props.id}-label`);
	readonly descriptionId: string = $derived(`${this.#props.id}-description`);
	readonly messageId: string = $derived(`${this.#props.id}-message`);
	readonly listId: string = $derived(`${this.#props.id}-list`);

	readonly labelledBy: string | undefined = $derived(this.#hasLabel ? this.labelId : undefined);
	readonly describedBy: string | undefined = $derived(
		[
			this.#hasDescription ? this.descriptionId : undefined,
			this.isInvalid && this.#hasMessage ? this.messageId : undefined,
		]
			.filter(Boolean)
			.join(" ") || undefined,
	);

	/** `undefined` ⇒ the `<CheckboxGroup.Message>` falls back to its own children. */
	readonly messageContent: string | undefined = $derived(
		toValidationMessage(this.validationMessage),
	);

	/** Whether a `<CheckboxGroup.Label>` is rendered — the description's `aria-describedby` target. */
	get hasLabel(): boolean {
		return this.#hasLabel;
	}

	constructor(props: CheckboxGroupRootStateProps) {
		this.#props = props;
	}

	isChecked(itemValue: string): boolean {
		return this.value.includes(itemValue);
	}

	/**
	 * A group-level `required` is satisfied by *any* checked item, so every item's hidden input stays
	 * required only while nothing is checked.
	 */
	isItemRequired(ownRequired: boolean, checked: boolean): boolean {
		return (this.required && this.value.length === 0) || (ownRequired && !checked);
	}

	/**
	 * Upstream validates inside `useControllableState`'s `onChange` — after the value is committed but
	 * before `onValueChange` — so `validate` runs before `setValue`, whose setter calls
	 * `onValueChange` last. `readOnly` short-circuits before both.
	 */
	setItemChecked(itemValue: string, checked: boolean): void {
		if (this.readOnly) return;

		const next = checked
			? [...this.value, itemValue]
			: this.value.filter((value) => value !== itemValue);

		this.validate(next);
		this.#props.setValue(next);
	}

	validate(next: string[]): void {
		const result = this.#props.getOnValidate()?.(next);
		if (typeof result === "string" || Array.isArray(result)) {
			this.validationMessage = result;
		} else if (result === true || result == null) {
			this.validationMessage = undefined;
		}
	}

	/** Upstream `onReset`. Idempotent, so N items may all call it. */
	reset(): void {
		this.#props.setValue(this.#props.getDefaultValue());
		this.validationMessage = undefined;
	}

	/** Called from `<CheckboxGroup.Label>`'s `$effect`; the returned thunk is its teardown. */
	registerLabel(): () => void {
		this.#hasLabel = true;
		return () => {
			this.#hasLabel = false;
		};
	}

	/** Called from `<CheckboxGroup.Description>`'s `$effect` only while it actually renders. */
	registerDescription(): () => void {
		this.#hasDescription = true;
		return () => {
			this.#hasDescription = false;
		};
	}

	/** Called from `<CheckboxGroup.Message>`'s `$effect` only while it actually renders. */
	registerMessage(): () => void {
		this.#hasMessage = true;
		return () => {
			this.#hasMessage = false;
		};
	}
}

export type CheckboxGroupItemStateProps = {
	readonly root: CheckboxGroupRootState;
	readonly getValue: () => string;
	readonly getDisabled: () => boolean;
	readonly getRequired: () => boolean;
	readonly getName: () => string | undefined;
};

/**
 * One instance per `<CheckboxGroup.Item>`, published on context for the indicator.
 *
 * Upstream `CheckboxGroupItemContext` carried `value`, `checked` and
 * `disabled`; the derivation that produced them lived in the item component. Keeping it here means
 * the hidden input, the button and the indicator all read one source of truth.
 */
export class CheckboxGroupItemState {
	#props!: CheckboxGroupItemStateProps;

	/** The rendered `<button>`, set from the item's `$effect`; feeds {@link FormControlState}. */
	element = $state<HTMLButtonElement | null>(null);

	readonly value: string = $derived(this.#props.getValue());
	readonly checked: boolean = $derived(this.#props.root.isChecked(this.value));
	readonly disabled: boolean = $derived(this.#props.getDisabled() || this.#props.root.disabled);
	readonly required: boolean = $derived(
		this.#props.root.isItemRequired(this.#props.getRequired(), this.checked),
	);
	/** The item's own `name` wins over the group's. */
	readonly name: string | undefined = $derived(this.#props.getName() ?? this.#props.root.name);
	readonly dataState: "checked" | "unchecked" = $derived(getDataState(this.checked));

	get root(): CheckboxGroupRootState {
		return this.#props.root;
	}

	constructor(props: CheckboxGroupItemStateProps) {
		this.#props = props;
	}

	/** No-op while the item is disabled; the root additionally short-circuits while `readOnly`. */
	toggle(): void {
		if (this.disabled) return;
		this.#props.root.setItemChecked(this.value, !this.checked);
	}
}

// The reusable form primitive was born here with this theme and moved to `src/lib/shared/` once
// every subsequent form port needed it too; it now lives there alone so the library has exactly
// one import path for it (import from `$lib/shared/form-control.svelte.js`).

const CHECKBOX_GROUP_CONTEXT_KEY = Symbol("checkbox-group");

export function setCheckboxGroupContext(state: CheckboxGroupRootState): CheckboxGroupRootState {
	return setContext(CHECKBOX_GROUP_CONTEXT_KEY, state);
}

/** Read the group's state, throwing when there is no `<CheckboxGroup.Root>` ancestor. */
export function getCheckboxGroupContext(consumerName: string): CheckboxGroupRootState {
	if (!hasContext(CHECKBOX_GROUP_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<CheckboxGroup.Root>\`.`);
	}
	return getContext<CheckboxGroupRootState>(CHECKBOX_GROUP_CONTEXT_KEY);
}

const CHECKBOX_GROUP_ITEM_CONTEXT_KEY = Symbol("checkbox-group-item");

export function setCheckboxGroupItemContext(state: CheckboxGroupItemState): CheckboxGroupItemState {
	return setContext(CHECKBOX_GROUP_ITEM_CONTEXT_KEY, state);
}

/** Read the item's state, throwing when there is no `<CheckboxGroup.Item>` ancestor. */
export function getCheckboxGroupItemContext(consumerName: string): CheckboxGroupItemState {
	if (!hasContext(CHECKBOX_GROUP_ITEM_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<CheckboxGroup.Item>\`.`);
	}
	return getContext<CheckboxGroupItemState>(CHECKBOX_GROUP_ITEM_CONTEXT_KEY);
}
