/**
 * Is this control inside a `<form>`, and which one — the reusable primitive behind every hidden
 * input a form component renders. Replaces upstream's `useFormControl` + `useFormReset`,
 * which `bits-ui`'s `HiddenInput` has no equivalent for.
 *
 * Lives in `src/lib/shared/` (registry:lib pattern): first ported for `checkbox-group` and
 * consumed by `tags-input`, `phone-input`, `mention`, `key-value`, `editable`, `number-field`,
 * `listbox` and `color-picker` — kept out of any one component's folder so a registry install of
 * one form component does not drag in another.
 */

export type FormControlStateProps = {
	readonly getElement: () => HTMLElement | null;
};

export class FormControlState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: FormControlStateProps;

	readonly form: HTMLFormElement | null = $derived(
		this.#props.getElement()?.closest("form") ?? null,
	);

	/** `true` before the element mounts, exactly like upstream's hook, so the input renders at once. */
	readonly isFormControl: boolean = $derived(this.#props.getElement() ? this.form !== null : true);

	constructor(props: FormControlStateProps) {
		this.#props = props;
	}
}
