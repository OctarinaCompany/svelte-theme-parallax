<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	/**
	 * `value` is narrowed from the button attribute's `string | string[] | number` to the string
	 * the selection is keyed on; `href`, `type`, `role` and `aria-checked` are the part's own.
	 */
	export type QuestionOptionProps = Omit<
		ButtonProps,
		"value" | "href" | "type" | "role" | "aria-checked"
	> & {
		/** The option's identity in `selectedValues`. Also its label when `children` is omitted. */
		value: string;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import { getFocusIntent, getRovingFocusContext } from "$lib/shared/roving-focus.svelte.js";
	import { getQuestionContext } from "./question.svelte.js";

	/**
	 * One choice. Upstream's `QuestionOption`: a `Button` that is `role="radio"` in `single` mode
	 * and `role="checkbox"` in `multiple`, painted `default` while selected and `outline` while
	 * not, with `h-auto whitespace-normal` so a long label wraps inside the button instead of
	 * stretching the row. Children default to the value.
	 *
	 * Two things are added. The option registers with the row's roving-focus group and, in `single`
	 * mode, takes part in it: `tabindex` is `0` only while it owns the row's tab stop, and the
	 * arrow keys move to the neighbours (see `question-options.svelte` for why not in `multiple`).
	 * And a caller's `onclick` runs FIRST and may `preventDefault()` to veto the toggle — upstream
	 * toggles unconditionally and calls `onClick` after, which leaves a consumer no way to confirm
	 * before a change. The house precedent is `action-bar-item.svelte`.
	 */
	let {
		ref = $bindable(null),
		value,
		variant,
		disabled,
		onclick: onclickProp,
		onfocus: onfocusProp,
		onkeydown: onkeydownProp,
		onmousedown: onmousedownProp,
		class: className,
		children,
		...restProps
	}: QuestionOptionProps = $props();

	const question = getQuestionContext("`<Question.Option>`");
	const group = getRovingFocusContext("<Question.Option>", "<Question.Options>");

	const itemId = $props.id();

	const isSelected = $derived(question.isSelected(value));
	const isDisabled = $derived(question.disabled || (disabled ?? false));
	const isSingle = $derived(question.selectionMode === "single");

	// Registered with a *getter* for `disabled`, so navigation reads it at keydown time and an
	// option that becomes disabled after mounting is skipped without re-registering.
	$effect(() => {
		const element = ref;
		if (!element) return;

		group.register(itemId, element, { getDisabled: () => isDisabled });
		return () => group.unregister(itemId);
	});

	// The radio pattern puts the group's tab stop on the CHECKED radio. The shared group only
	// learns a stop from a focus, so the checked option claims it whenever the SELECTION changes —
	// at mount for a value seeded by the parent, and again for a parent-driven write later — and
	// Tab lands on the answer rather than on the first option or on wherever focus last was.
	//
	// `group.isTabStop` is read UNTRACKED on purpose: the effect must follow the selection, not the
	// tab stop. Tracking it would re-run on every arrow move and yank the stop back to the checked
	// option while focus sits on another one, and, with two selected values left over from a
	// `multiple` -> `single` switch (the mode does not prune), two options would claim it in turns
	// without end. Only the FIRST selected value claims, for the same reason. `onItemFocus` sets
	// the stop without moving focus, so a parent-driven write never steals the reader's caret.
	const isPrimarySelection = $derived(question.selectedValues[0] === value);

	$effect(() => {
		if (!isSingle || !isPrimarySelection) return;
		untrack(() => {
			if (!group.isTabStop(itemId)) group.onItemFocus(itemId);
		});
	});

	// `ButtonProps` handlers are the intersection of the button and anchor DOM signatures, because
	// `Button` renders either element depending on `href`. Widening to their shared supertype here
	// is what lets one implementation satisfy both call signatures (`action-bar-item.svelte`).
	const onclickCaller = $derived(
		onclickProp as unknown as ((event: MouseEvent) => void) | undefined,
	);
	const onfocusCaller = $derived(
		onfocusProp as unknown as ((event: FocusEvent) => void) | undefined,
	);
	const onkeydownCaller = $derived(
		onkeydownProp as unknown as ((event: KeyboardEvent) => void) | undefined,
	);
	const onmousedownCaller = $derived(
		onmousedownProp as unknown as ((event: MouseEvent) => void) | undefined,
	);

	function onclick(event: MouseEvent) {
		onclickCaller?.(event);
		if (event.defaultPrevented) return;
		question.toggle(value);
	}

	function onfocus(event: FocusEvent) {
		onfocusCaller?.(event);
		if (event.defaultPrevented) return;
		group.onItemFocus(itemId);
	}

	function onkeydown(event: KeyboardEvent) {
		onkeydownCaller?.(event);
		if (event.defaultPrevented) return;

		if (event.key === "Tab" && event.shiftKey) {
			group.onItemShiftTab();
			return;
		}

		if (!isSingle || event.target !== event.currentTarget) return;

		// The group resolves the horizontal pair (and Home / End) through the reading direction;
		// the vertical pair is asked for directly, since `dir` never inverts Up / Down. Both axes
		// walk the same document order — see `question-options.svelte` for why neither is enough.
		const intent = group.focusIntentFor(event.key) ?? getFocusIntent(event.key, "vertical");
		if (intent === undefined) return;

		// A held modifier means the reader is driving the browser, not the row: no navigation and,
		// crucially, no `preventDefault()`.
		if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
		event.preventDefault();

		group.navigate(intent, event.currentTarget as HTMLElement);
	}

	function onmousedown(event: MouseEvent) {
		onmousedownCaller?.(event);
		if (event.defaultPrevented) return;

		if (isDisabled) {
			event.preventDefault();
		} else {
			group.onItemFocus(itemId);
		}
	}

	const isTabStop = $derived(group.isTabStop(itemId));
</script>

<Button
	bind:ref
	data-slot="question-option"
	data-selected={isSelected ? "" : undefined}
	type="button"
	role={isSingle ? "radio" : "checkbox"}
	aria-checked={isSelected}
	variant={variant ?? (isSelected ? "default" : "outline")}
	disabled={isDisabled}
	tabindex={isSingle ? (isTabStop ? 0 : -1) : undefined}
	{value}
	{...restProps}
	class={cn("h-auto whitespace-normal", className)}
	{onclick}
	{onfocus}
	{onkeydown}
	{onmousedown}
>
	{#if children}
		{@render children()}
	{:else}
		{value}
	{/if}
</Button>
