import { getContext, hasContext, setContext } from "svelte";

/**
 * State, context and pure helpers for `ui/question` — the form an assistant hands the reader when
 * it needs an answer before it can continue: a prompt, a row of options, an optional free-text
 * field and a submit button.
 *
 * Ported from Vercel AI Elements' `question.tsx`. The React original keeps its state in a
 * `useState` behind a `QuestionContext` value object; here it is a class published on context, so
 * every part reads the same `$derived` fields and the pure selection arithmetic is exported for
 * tests and for callers that want to drive the value themselves.
 */

/** What the reader has chosen and typed so far. Upstream's `QuestionValue`, verbatim. */
export type QuestionValue = {
	/** The option values currently selected — at most one in `single` mode. */
	readonly selectedValues: readonly string[];
	/** The free-text answer, untrimmed. */
	readonly text: string;
};

/**
 * What `onSubmit` receives. Differs from {@link QuestionValue} in one field: `text` is trimmed and
 * `undefined` when it was blank, so a consumer can test `response.text` without trimming again.
 */
export type QuestionResponse = {
	readonly selectedValues: readonly string[];
	readonly text?: string;
};

/** Every value `selectionMode` accepts. Upstream's `SelectionMode` union, as a tuple. */
export const QUESTION_SELECTION_MODES = ["single", "multiple"] as const;

/** Whether the options behave as radios (`single`) or checkboxes (`multiple`). */
export type QuestionSelectionMode = (typeof QUESTION_SELECTION_MODES)[number];

/**
 * Normalise a possibly untyped runtime value to a known mode. Anything outside
 * {@link QUESTION_SELECTION_MODES} falls back to `"single"`, upstream's default.
 */
export function resolveQuestionSelectionMode(value?: string): QuestionSelectionMode {
	return QUESTION_SELECTION_MODES.includes(value as QuestionSelectionMode)
		? (value as QuestionSelectionMode)
		: "single";
}

/**
 * The value a question starts from when nothing seeds it. Upstream's `EMPTY_VALUE`.
 *
 * FROZEN, because the value contract is "a new object on every change, never a mutation" — every
 * write goes through {@link nextQuestionValue}, and a shared constant that could be pushed into
 * would break the contract silently for every question on the page.
 */
export const EMPTY_QUESTION_VALUE: QuestionValue = Object.freeze({
	selectedValues: Object.freeze([]) as readonly string[],
	text: "",
});

/**
 * The selection after `value` is toggled. Upstream's `getSelectedValues`, verbatim in behaviour:
 *
 * - `single`: the clicked value replaces the selection — and CLICKING THE SELECTED VALUE
 *   DESELECTS IT, leaving nothing chosen. That is what upstream does (`isSelected ? [] :
 *   [optionValue]`), and it is deliberate rather than a radio-group defect: the free-text field
 *   is an answer too, so a reader who picked an option and then decided to type instead needs a
 *   way back to "no option". A `Question` without an input behaves like a radio group that can
 *   be cleared.
 * - `multiple`: membership toggles; order is insertion order, not option order.
 *
 * Pure and non-mutating: the returned array is always a new one.
 */
export function nextSelectedValues(
	current: readonly string[],
	value: string,
	mode: QuestionSelectionMode,
): readonly string[] {
	const isSelected = current.includes(value);
	if (mode === "single") {
		return isSelected ? [] : [value];
	}
	return isSelected ? current.filter((item) => item !== value) : [...current, value];
}

/** A new {@link QuestionValue} with `patch` applied over `current`. Never mutates `current`. */
export function nextQuestionValue(
	current: QuestionValue,
	patch: Partial<QuestionValue>,
): QuestionValue {
	return { selectedValues: current.selectedValues, text: current.text, ...patch };
}

/**
 * Whether `value` carries anything worth submitting: at least one option, or text that is not
 * only whitespace. Upstream's `hasResponse` in `QuestionSubmit` and the guard in `handleSubmit`
 * are the same test written twice; here it is written once.
 */
export function hasQuestionResponse(value: QuestionValue): boolean {
	return value.selectedValues.length > 0 || value.text.trim().length > 0;
}

/**
 * The payload `onSubmit` receives for `value`: the selection as is, the text trimmed and dropped
 * when blank. Upstream builds this inline in `handleSubmit`.
 */
export function toQuestionResponse(value: QuestionValue): QuestionResponse {
	const text = value.text.trim();
	return { selectedValues: value.selectedValues, text: text.length > 0 ? text : undefined };
}

/**
 * Reactive inputs for {@link QuestionState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them.
 */
export type QuestionStateProps = {
	/** The current value — the root's bound `value`. */
	getValue: () => QuestionValue;
	/** Called with the NEXT value on every reader-driven change; the root writes and notifies. */
	setValue: (value: QuestionValue) => void;
	/** Whether the options behave as radios or checkboxes. */
	getSelectionMode: () => QuestionSelectionMode;
	/** Whether the whole form is inert. */
	getDisabled: () => boolean;
};

/**
 * One instance per `<Question.Root>`. Published on context; every part reads it.
 *
 * Replaces upstream's `QuestionContextValue` — `disabled`, `selectedValues`, `selectionMode`,
 * `text`, `setText` and `toggleValue` — plus the `hasResponse` test that upstream recomputes in
 * `QuestionSubmit`. Nothing here is stored twice: `selectedValues` and `text` are read off the
 * root's value, so a parent-driven write and a reader-driven one look the same to every part.
 */
export class QuestionState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: QuestionStateProps;

	readonly value: QuestionValue = $derived(this.#props.getValue());
	readonly selectedValues: readonly string[] = $derived(this.value.selectedValues);
	readonly text: string = $derived(this.value.text);
	readonly selectionMode: QuestionSelectionMode = $derived(
		resolveQuestionSelectionMode(this.#props.getSelectionMode()),
	);
	readonly disabled: boolean = $derived(this.#props.getDisabled());

	/** Whether the submit button is live: an option chosen, or text that is not only whitespace. */
	readonly hasResponse: boolean = $derived(hasQuestionResponse(this.value));

	/**
	 * The `id` of the mounted `<Question.Prompt>`, or `null` while there is none. `<Question.Options>`
	 * points its `aria-labelledby` at it, so the `radiogroup` / `group` carries the accessible name
	 * the WAI-ARIA APG Radio Group pattern requires ("has an accessible name provided by either
	 * aria-labelledby or aria-label"). Published only while the prompt is rendered, so a form
	 * without one never leaves a dangling idref behind (`checkbox-group-label.svelte` does the same).
	 */
	promptId: string | null = $state(null);

	constructor(props: QuestionStateProps) {
		this.#props = props;
	}

	/** Whether `value` is among the selected options. */
	isSelected(value: string): boolean {
		return this.selectedValues.includes(value);
	}

	/**
	 * Register (or, with `null`, withdraw) the prompt's `id`. Called by `<Question.Prompt>` from an
	 * effect with a cleanup, never by a consumer; a second prompt overwrites the first, which is
	 * what `aria-labelledby` can express — one idref — and what two prompts deserve.
	 */
	setPromptId(id: string | null): void {
		this.promptId = id;
	}

	/**
	 * Select or deselect an option — see {@link nextSelectedValues} for what that means in each
	 * mode. Ignored while the form is disabled: the buttons are inert anyway, and a programmatic
	 * caller should not be able to change an answer the reader cannot.
	 */
	toggle(value: string): void {
		if (this.disabled) return;
		this.#props.setValue(
			nextQuestionValue(this.value, {
				selectedValues: nextSelectedValues(this.selectedValues, value, this.selectionMode),
			}),
		);
	}

	/** Replace the free-text answer. A write of the same text is not a change and does not notify. */
	setText(text: string): void {
		if (this.disabled || text === this.text) return;
		this.#props.setValue(nextQuestionValue(this.value, { text }));
	}

	/**
	 * The payload a submit would carry, or `undefined` when there is nothing to submit — the root's
	 * submit guard and the button's disabled state are both this one test.
	 */
	response(): QuestionResponse | undefined {
		return this.hasResponse ? toQuestionResponse(this.value) : undefined;
	}
}

const QUESTION_CONTEXT_KEY = Symbol("question");

export function setQuestionContext(state: QuestionState): QuestionState {
	return setContext(QUESTION_CONTEXT_KEY, state);
}

export function hasQuestionContext(): boolean {
	return hasContext(QUESTION_CONTEXT_KEY);
}

export function getQuestionContext(part?: string): QuestionState {
	if (!hasQuestionContext()) {
		throw new Error(`${part ?? "`<Question>` part"} must be used within \`<Question.Root>\`.`);
	}
	return getContext<QuestionState>(QUESTION_CONTEXT_KEY);
}

/** Parity name for upstream's `useQuestion` hook. Delegates to the getter. */
export function useQuestion(): QuestionState {
	return getQuestionContext();
}

/**
 * Name of the cancelable event `<Question.Options>` dispatches on itself when keyboard focus
 * enters the option row in `single` mode, before it forwards focus to an option. `preventDefault()`
 * keeps focus on the row. Same contract as `action-bar`'s `ACTION_BAR_ENTRY_FOCUS`
 * (`"actionbarFocusGroup.onEntryFocus"`, `action-bar.svelte.ts`).
 *
 * The event does NOT bubble — the row passes no `entryFocusEventOptions`, so the group state's
 * default `{ bubbles: false, cancelable: true }` applies — which means a listener has to sit on the
 * `<Question.Options>` element itself (through `bind:ref` and `addEventListener`), not on the form
 * or any ancestor.
 */
export const QUESTION_ENTRY_FOCUS = "question.entryFocus";
