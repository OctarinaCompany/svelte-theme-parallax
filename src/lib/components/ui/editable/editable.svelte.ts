/**
 * Editable travelled with the key-value port and has no gallery page of its own: it is composed by
 * `key-value-key-input` / `key-value-value-input`, and its documented usage lives on the Key value
 * page.
 */

import { getContext, hasContext, setContext, tick } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

/** Which preview interaction enters edit mode. Upstream `EditableContextValue["triggerMode"]`. */
export type EditableTriggerMode = "click" | "dblclick" | "focus";

export type EditableRootStateProps = {
	readonly getValue: () => string;
	/** Writes the root's `$bindable` `value`, then calls `onValueChange` — only on a real change. */
	readonly setValue: (value: string) => void;
	readonly getEditing: () => boolean;
	/** Writes the root's `$bindable` `editing`, then calls `onEditingChange` — only on a real change. */
	readonly setEditing: (editing: boolean) => void;
	readonly getOnEdit: () => (() => void) | undefined;
	readonly getOnSubmit: () => ((value: string) => void) | undefined;
	readonly getOnCancel: () => (() => void) | undefined;
	readonly getOnEnterKeyDown: () => ((event: KeyboardEvent) => void) | undefined;
	readonly getOnEscapeKeyDown: () => ((event: KeyboardEvent) => void) | undefined;
	readonly getTriggerMode: () => EditableTriggerMode;
	readonly getAutosize: () => boolean;
	readonly getMaxLength: () => number | undefined;
	readonly getPlaceholder: () => string | undefined;
	readonly getDisabled: () => boolean;
	readonly getReadOnly: () => boolean;
	readonly getRequired: () => boolean;
	readonly getInvalid: () => boolean;
	readonly getDir: () => Direction;
	/** The one `$props.id()` (or the caller's `id`) every part's id is derived from. */
	readonly id: string;
};

/**
 * One instance per `<Editable.Root>`, published on context.
 *
 * Replaces upstream's hand-rolled `Store` + `useSyncExternalStore` + `EditableContextValue` +
 * the three `useCallback` transitions (`editable.tsx:36-107`, `:240-262`). Svelte's signal graph
 * already gives the per-field granularity the store existed to provide, so `value`
 * and `editing` are read straight from the root's `$bindable` props through getter functions — which
 * is what lets an authoritative parent decline a write.
 */
export class EditableRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: EditableRootStateProps;

	/** Upstream's `inputRef` — the focus / select / autosize target. */
	inputElement = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);
	/** The `<Editable.Preview>` element, and the fallback focus-restore target (divergence D-1). */
	previewElement = $state<HTMLElement | null>(null);

	/**
	 * The value edit mode started with, restored by {@linkcode cancel}. Upstream `previousValueRef`.
	 * Deliberately not `$state`: nothing renders it, and a signal here would be a false dependency.
	 */
	#restoreValue: string;
	/** The element that started the current edit, and whether it was an `<Editable.Trigger>` (D-1). */
	#trigger: HTMLElement | null = null;
	#triggerWasTrigger = false;

	readonly value: string = $derived(this.#props.getValue());
	readonly editing: boolean = $derived(this.#props.getEditing());
	readonly triggerMode: EditableTriggerMode = $derived(this.#props.getTriggerMode());
	readonly autosize: boolean = $derived(this.#props.getAutosize());
	readonly maxLength: number | undefined = $derived(this.#props.getMaxLength());
	readonly placeholder: string | undefined = $derived(this.#props.getPlaceholder());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly readOnly: boolean = $derived(this.#props.getReadOnly());
	readonly required: boolean = $derived(this.#props.getRequired());
	readonly invalid: boolean = $derived(this.#props.getInvalid());
	readonly dir: Direction = $derived(this.#props.getDir());

	/** Runs before the preview's built-in `Enter` → edit; `preventDefault()` skips it. */
	readonly onEnterKeyDown: ((event: KeyboardEvent) => void) | undefined = $derived(
		this.#props.getOnEnterKeyDown(),
	);
	/** Runs before the input's built-in `Escape` → cancel; `preventDefault()` skips it. */
	readonly onEscapeKeyDown: ((event: KeyboardEvent) => void) | undefined = $derived(
		this.#props.getOnEscapeKeyDown(),
	);

	/** Always rendered on the root, so every `aria-controls` resolves (divergence D-3). */
	readonly rootId: string = $derived(this.#props.id);
	readonly inputId: string = $derived(`${this.#props.id}-input`);
	readonly labelId: string = $derived(`${this.#props.id}-label`);
	readonly isEmpty: boolean = $derived(this.value === "");

	constructor(props: EditableRootStateProps) {
		this.#props = props;
		this.#restoreValue = props.getValue();
	}

	/**
	 * Upstream `onEdit`, plus the focus-restore bookkeeping D-1 needs.
	 *
	 * @param trigger the element that started the edit; the preview when omitted.
	 */
	edit(trigger?: HTMLElement | null): void {
		if (this.disabled || this.readOnly) return;

		const source = trigger ?? this.previewElement;
		this.#restoreValue = this.value;
		this.#trigger = source;
		this.#triggerWasTrigger = source?.closest('[data-slot="editable-trigger"]') != null;

		this.#props.setEditing(true);
		this.#props.getOnEdit()?.();
	}

	/**
	 * Upstream `onSubmit`. `onSubmit` fires even when the value did not
	 * move, while `onValueChange` does not — the difference the equality guard makes.
	 */
	submit(next: string): void {
		if (this.disabled || this.readOnly) return;

		this.#props.setValue(next);
		this.#props.setEditing(false);
		this.#props.getOnSubmit()?.(next);
	}

	/** Upstream `onCancel`, plus the focus restoration of divergence D-1. */
	cancel(): void {
		if (this.disabled || this.readOnly) return;

		this.#props.setValue(this.#restoreValue);
		this.#props.setEditing(false);
		this.#props.getOnCancel()?.();

		const recorded = this.#trigger;
		const wasTrigger = this.#triggerWasTrigger;
		// The preview has to be back in the DOM before it can take focus, which is one flush away.
		void tick().then(() => this.#restoreFocus(recorded, wasTrigger));
	}

	/** The `oninput` path — upstream `onChange`. */
	setText(next: string): void {
		if (this.disabled || this.readOnly) return;

		this.#props.setValue(next);
	}

	/**
	 * Upstream `onAutosize`, verbatim. The `textarea` branch is kept even
	 * though the default element is an `<input>`, because a consumer can render a textarea through
	 * the `child` snippet.
	 */
	autosizeElement(target: HTMLInputElement | HTMLTextAreaElement): void {
		if (!this.autosize) return;

		if (target instanceof HTMLTextAreaElement) {
			target.style.height = "0";
			target.style.height = `${target.scrollHeight}px`;
		} else {
			target.style.width = "0";
			target.style.width = `${target.scrollWidth + 4}px`;
		}
	}

	/**
	 * Whether a blur should commit — upstream `onBlur`. Focus moving to the
	 * trigger, submit, or cancel button must not commit: those own the resulting state change
	 * themselves — committing first would save the value cancel is about to discard, and would
	 * unmount submit before its own click (and a consumer's `preventDefault` opt-out) can run.
	 */
	isBlurCommitting(related: EventTarget | null): boolean {
		if (!(related instanceof HTMLElement)) return true;

		return (
			related.closest('[data-slot="editable-trigger"]') === null &&
			related.closest('[data-slot="editable-submit"]') === null &&
			related.closest('[data-slot="editable-cancel"]') === null
		);
	}

	/**
	 * Divergence D-1: upstream leaves focus on `<body>` when the input unmounts. The element that
	 * started the edit has itself unmounted by now whenever it was a trigger (its presence rule is
	 * `!editing`), so the remounted one is looked up by the `data-slot` marker — which survives the
	 * `child` snippet — under the root id the root always renders (D-3).
	 */
	#restoreFocus(recorded: HTMLElement | null, wasTrigger: boolean): void {
		if (recorded?.isConnected) {
			recorded.focus();
			return;
		}

		const trigger = wasTrigger
			? document
					.getElementById(this.rootId)
					?.querySelector<HTMLElement>('[data-slot="editable-trigger"]')
			: null;

		(trigger ?? this.previewElement)?.focus();
	}
}

const EDITABLE_CONTEXT_KEY = Symbol("editable");

export function setEditableContext(state: EditableRootState): EditableRootState {
	return setContext(EDITABLE_CONTEXT_KEY, state);
}

/** Read the root's state, throwing when there is no `<Editable.Root>` ancestor. */
export function getEditableContext(consumerName: string): EditableRootState {
	if (!hasContext(EDITABLE_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Editable.Root>\`.`);
	}
	return getContext<EditableRootState>(EDITABLE_CONTEXT_KEY);
}
