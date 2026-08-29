<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLFormAttributes } from "svelte/elements";
	import type {
		QuestionResponse,
		QuestionSelectionMode,
		QuestionValue,
	} from "./question.svelte.js";

	export type QuestionRootProps = Omit<
		WithElementRef<HTMLFormAttributes, HTMLFormElement>,
		"onsubmit"
	> & {
		/**
		 * What the reader has chosen and typed. Bind it to drive the form from outside or to follow
		 * the reader; every reader-driven change replaces it with a NEW object, never a mutation.
		 * Left unbound and undefined, the form owns its value and starts from `defaultValue`.
		 */
		value?: QuestionValue;
		/** Fired with the next value on every reader-driven change, never for a parent-driven write. */
		onValueChange?: (value: QuestionValue) => void;
		/**
		 * Where an uncontrolled form starts. A SEED for `value`, read once; changing it later leaves
		 * the reader's answer alone.
		 * @default EMPTY_QUESTION_VALUE
		 */
		defaultValue?: QuestionValue;
		/**
		 * Whether the options behave as radios (`single`, at most one selected — and clicking the
		 * selected one clears it) or as checkboxes (`multiple`).
		 * @default "single"
		 */
		selectionMode?: QuestionSelectionMode;
		/**
		 * Make the whole form inert: every option, the input and the submit button disable, and
		 * a submit is ignored.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Called on submit with the response — the selection as is, the text trimmed and dropped
		 * when blank — and the native event, already default-prevented. NOT called while disabled,
		 * nor when nothing is selected and the text is blank. A returned promise is not awaited.
		 */
		onSubmit?: (response: QuestionResponse, event: SubmitEvent) => void | Promise<void>;
	};

	/** Alias of {@link QuestionRootProps}, present for parity with the upstream type name. */
	export type QuestionProps = QuestionRootProps;
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import {
		EMPTY_QUESTION_VALUE,
		QuestionState,
		setQuestionContext,
		toQuestionResponse,
	} from "./question.svelte.js";

	/**
	 * A question the assistant puts to the reader mid-conversation — a prompt, a row of options, an
	 * optional free-text field and a submit button — rendered as a `<form>` so Enter in the input
	 * and a click on the button reach the same handler.
	 *
	 * Ported from Vercel AI Elements' `question.tsx`, keeping its part structure and prop names.
	 *
	 * SIX THINGS DIVERGE FROM UPSTREAM:
	 *
	 * 1. THE GROUND IS `bg-card`, NOT `bg-background`, AND THE STACK IS `flex flex-col gap-4`, NOT
	 *    `space-y-4`. Upstream paints the form in the page colour and relies on the border alone to
	 *    lift it. In this kit a question sits inside a chat column that is itself on
	 *    `bg-background`, where a page-coloured box with a hairline reads as a fieldset rather than
	 *    as the object it is: a card the assistant hands over and waits on. `bg-card` is what every
	 *    other handed-over block here wears (`ui/card`, `ui/alert`'s solid family), and under the
	 *    dark palettes it is the surface the border tokens were tuned against. The cost is
	 *    card-on-card inside a `Card.Content` demo, which the border carries. The spacing swap is
	 *    the house rule (`docs/CONVENTIONS.md` §8: flex + gap-*, never space-*), and it also means a
	 *    hidden part leaves no orphan margin behind.
	 *
	 * 2. THE VALUE IS `$bindable`, NOT A CONTROLLED/UNCONTROLLED PAIR. Upstream's `value ??
	 *    internalValue` dance is React's; Svelte's `bind:value` covers both, with `defaultValue`
	 *    kept as a seed for the unbound case exactly as `ui/code-block` keeps `defaultLanguage`.
	 *
	 * 3. THE SUBMIT GUARD IS STATED ONCE. Upstream tests "an option or non-blank text" in the
	 *    submit handler and again in `QuestionSubmit`; here both read `QuestionState.hasResponse`,
	 *    so the button can never be live while a submit would be ignored, or the reverse.
	 *
	 * 4. THE OPTIONS ROVE IN `single` MODE, AND THE ROW IS NAMED. Upstream's radios are plain
	 *    buttons, each a tab stop, which is the checkbox contract and not the radio one. Here
	 *    `<Question.Options>` puts a `single`-mode row on `$lib/shared/roving-focus.svelte.js` —
	 *    one tab stop, arrows on both axes between options — and leaves a `multiple`-mode row as
	 *    it was, since checkboxes ARE each a tab stop. Upstream's `radiogroup` also has no
	 *    accessible name; here `<Question.Prompt>` publishes its `id` and the row points
	 *    `aria-labelledby` at it.
	 *
	 * 5. THE INPUT HAS A PLACEHOLDER. Upstream's `QuestionInput` renders an unlabelled textarea
	 *    with no placeholder; `<Question.Input>` defaults `placeholder` to "Type your answer…", so
	 *    an empty field states what it is for below a prompt that is about the options. A caller's
	 *    own `placeholder` replaces it.
	 *
	 * 6. A CALLER'S `onclick` ON AN OPTION RUNS FIRST AND MAY VETO. Upstream toggles and then calls
	 *    `onClick`; here `preventDefault()` in the handler skips the toggle, so a consumer can
	 *    confirm before a change (`question-option.svelte`, after `action-bar-item.svelte`).
	 *
	 * The native `onsubmit` is omitted from the props: the form owns it (it must
	 * `preventDefault()` before the guard runs, or a rejected submit would reload the page), and
	 * `onSubmit` is the one hook a consumer needs.
	 */
	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(),
		onValueChange,
		defaultValue,
		selectionMode = "single",
		disabled = false,
		onSubmit,
		children,
		...restProps
	}: QuestionRootProps = $props();

	// The seed, read through `untrack` so it is unambiguously one: nothing here subscribes to
	// `defaultValue`, and a later change to it leaves the reader's answer alone.
	value ??= untrack(() => defaultValue ?? EMPTY_QUESTION_VALUE);

	const state = new QuestionState({
		getValue: () => value ?? EMPTY_QUESTION_VALUE,
		setValue: (next) => {
			value = next;
			onValueChange?.(next);
		},
		getSelectionMode: () => selectionMode,
		getDisabled: () => disabled,
	});

	setQuestionContext(state);

	function onsubmit(event: SubmitEvent) {
		// Always, and first: a `<form>` with no `action` submits to the current URL, and a guard
		// that returns early without this would reload the page on an empty answer.
		event.preventDefault();
		if (state.disabled || !state.hasResponse) return;

		// Not awaited: upstream `await`s, but nothing follows the call, and a consumer that wants to
		// show a pending state owns that state — the form has no `submitting` flag to set.
		void onSubmit?.(toQuestionResponse(state.value), event);
	}
</script>

<!--
	`data-selection-mode` and `data-disabled` publish the state every other component in this kit
	publishes as data attributes; `data-has-response` is what a consumer styles a "ready" outline
	against without reaching into the button.
-->
<form
	bind:this={ref}
	data-slot="question"
	data-selection-mode={state.selectionMode}
	data-disabled={state.disabled ? "" : undefined}
	data-has-response={state.hasResponse ? "" : undefined}
	class={cn("flex flex-col gap-4 rounded-lg border bg-card p-4", className)}
	{onsubmit}
	{...restProps}
>
	{@render children?.()}
</form>
