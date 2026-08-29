<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type QuestionOptionsProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { RovingFocusGroupState, setRovingFocusContext } from "$lib/shared/roving-focus.svelte.js";
	import { getQuestionContext, QUESTION_ENTRY_FOCUS } from "./question.svelte.js";

	/**
	 * The row of options. Upstream's `QuestionOptions`: a wrapping flex row that is a
	 * `role="radiogroup"` in `single` mode and a `role="group"` in `multiple` mode.
	 *
	 * THE ROW ROVES IN `single` MODE, which upstream does not do. A radio group is ONE tab stop
	 * with arrows moving between the radios (WAI-ARIA APG, Radio Group pattern); upstream's radios
	 * are plain buttons, each a stop of its own, so a reader tabs through every option to reach the
	 * input. `$lib/shared/roving-focus.svelte.js` fits the shape exactly — a wrapper of `<button>`s
	 * that register themselves — so the row hosts a `RovingFocusGroupState` and `<Question.Option>`
	 * consumes it. What is deliberately NOT taken from the radio pattern is arrow-selects: arrows
	 * only move focus and Space / Enter toggle, because the selected radio can be cleared here
	 * (see `nextSelectedValues`) and a selection that follows focus would make that impossible to
	 * reach from the keyboard.
	 *
	 * In `multiple` mode the group state stays mounted but idle: the row takes no `tabindex`, none
	 * of its focus handlers reach the group, and every option keeps its own tab stop, which is what
	 * a checkbox group is. Keeping one code path rather than two means a mode that changes at
	 * runtime does not remount the options.
	 *
	 * BOTH ARROW AXES WALK THE OPTIONS. The group state is hosted as `horizontal` — that is the axis
	 * `dir="rtl"` inverts — and `<Question.Option>` falls back to the vertical mapping for the keys
	 * the horizontal one does not own, so Left / Up go to the previous option and Right / Down to
	 * the next, in document order, exactly as the APG Radio Group pattern maps them. The row wraps
	 * and its direction is only a class (`flex-col` stacks it), so no single axis is honest for
	 * every layout; accepting both is what makes a stacked row and a wrapped one behave alike.
	 *
	 * The row is NAMED by `<Question.Prompt>`: `aria-labelledby` points at the prompt's `id` while
	 * one is mounted, since both `radiogroup` and `group` need an accessible name and upstream gives
	 * them none. A caller's own `aria-labelledby` or `aria-label` in `restProps` wins.
	 */
	let {
		ref = $bindable(null),
		onfocusin: onfocusinProp,
		onfocusout: onfocusoutProp,
		onmousedown: onmousedownProp,
		class: className,
		children,
		...restProps
	}: QuestionOptionsProps = $props();

	const question = getQuestionContext("`<Question.Options>`");
	const direction = useDirection({ element: () => ref });

	const roving = setRovingFocusContext(
		new RovingFocusGroupState({
			getDir: () => direction.current,
			getOrientation: () => "horizontal",
			getLoop: () => true,
			entryFocusEventName: QUESTION_ENTRY_FOCUS,
		}),
	);

	const isSingle = $derived(question.selectionMode === "single");

	// `focusin` / `focusout` rather than `focus` / `blur`: the group has to see focus leaving an
	// OPTION to clear its tabbing-back-out flag, and only the bubbling pair reaches it.
	function onfocusin(event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onfocusinProp?.(event);
		if (event.defaultPrevented || !isSingle) return;
		roving.onGroupFocusIn(event);
	}

	function onfocusout(event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onfocusoutProp?.(event);
		if (event.defaultPrevented) return;
		roving.onGroupFocusOut();
	}

	// Gated on `single` exactly as `onfocusin` is: the group only clears its click-focus flag at
	// the end of `onGroupFocusIn`, which `multiple` mode never reaches, so an ungated mousedown
	// would leave the flag stuck and the first keyboard entry after a later switch to `single`
	// would be read as a click — focus parked on the row instead of forwarded to an option.
	function onmousedown(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onmousedownProp?.(event);
		if (event.defaultPrevented || !isSingle) return;
		roving.onGroupMouseDown();
	}
</script>

<!--
	`aria-disabled` on the row, not `disabled`: a `<div>` has no disabled attribute, and the
	options carry the real one. The row's own `tabindex` is `0` only in single mode while an
	enabled option exists, so a disabled question never leaves an empty focus stop behind.

	The ignore below is the one `code-block-content.svelte` and `conversation.svelte` carry for the
	same reason: the compiler reads `radiogroup` as a static role, but the row is the group's single
	tab stop (APG Radio Group pattern) and `onfocusin` hands the focus straight on to an option.
-->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={ref}
	data-slot="question-options"
	data-selection-mode={question.selectionMode}
	role={isSingle ? "radiogroup" : "group"}
	aria-labelledby={question.promptId ?? undefined}
	aria-disabled={question.disabled ? true : undefined}
	tabindex={isSingle ? roving.tabIndex : undefined}
	class={cn("flex flex-wrap gap-2 outline-none", className)}
	{onfocusin}
	{onfocusout}
	{onmousedown}
	{...restProps}
>
	{@render children?.()}
</div>
