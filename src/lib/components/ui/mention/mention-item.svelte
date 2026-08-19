<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type MentionItemProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
		/**
		 * The value of the item.
		 *
		 * Cannot be an empty string.
		 */
		value: string;
		/**
		 * The label of the item. By default the value is used as the label.
		 *
		 * Overrides the text spliced into the field when the item is selected.
		 */
		label?: string;
		/**
		 * Whether the item is disabled, independently of the root's `disabled`.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/** The item's rendered content. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";

	import { getMentionContext } from "./mention.svelte.js";

	let {
		ref = $bindable(null),
		value,
		label,
		disabled = false,
		onclick: onclickProp,
		onpointerdown: onpointerdownProp,
		onpointermove: onpointermoveProp,
		class: className,
		children,
		...restProps
	}: MentionItemProps = $props();

	// A one-shot initialisation check, exactly where upstream's layout effect throws, so
	// `expect(() => render(...)).toThrow(...)` works. `untrack` says "read this once" rather than
	// looking like a reactive read that only ever captures the initial value.
	if (untrack(() => value) === "") {
		throw new Error("`<Mention.Item>` value cannot be an empty string.");
	}

	const root = getMentionContext("<Mention.Item>");

	const itemId = $props.id();

	const resolvedLabel = $derived(label ?? value);
	const isDisabled = $derived(disabled || root.disabled);
	const isSelected = $derived(root.isSelected(value));
	const isHighlighted = $derived(root.highlightedItem?.id === itemId);
	const isVisible = $derived(root.isItemVisible(value));

	// The collection holds a snapshot rather than a bag of getters, so re-registering is how a change
	// is published. Registration is deliberately independent of visibility: a filtered-out item
	// renders nothing but stays registered with a `null` element, which is what lets it come back
	// when the search changes.
	$effect(() =>
		root.collection.register({
			element: ref,
			id: itemId,
			value,
			label: resolvedLabel,
			disabled: isDisabled,
		}),
	);

	// Each handler runs the caller's first and `preventDefault()` suppresses ours, reproducing
	// upstream's `composeEventHandlers`.
	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;
		if (isDisabled) return;

		const field = root.inputElement;
		if (!field) return;

		root.selectValue(value, field, field.selectionStart ?? 0);
		field.focus();
	}

	function onpointerdown(event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onpointerdownProp?.(event);
		if (event.defaultPrevented) return;
		if (isDisabled) return;

		const target = event.target;
		if (!(target instanceof HTMLElement)) return;

		// Prevent implicit pointer capture, which would otherwise retarget the whole gesture.
		if (target.hasPointerCapture(event.pointerId)) {
			target.releasePointerCapture(event.pointerId);
		}

		// Keep the item from stealing focus from the field, for both mouse and touch.
		if (event.button === 0 && event.ctrlKey === false) event.preventDefault();
	}

	/**
	 * Divergence from upstream: a `readonly` root makes highlight
	 * movement inert, and the keyboard already honours that (`onInputKeydown` returns early for the
	 * navigation keys), so the pointer must not be the one way back in.
	 */
	function onpointermove(event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onpointermoveProp?.(event);
		if (event.defaultPrevented) return;
		if (isDisabled || root.readonly) return;

		root.highlightedElement = event.currentTarget;
	}
</script>

{#if isVisible}
	<div
		bind:this={ref}
		role="option"
		id={itemId}
		aria-selected={isSelected}
		aria-disabled={isDisabled}
		data-mention-collection-item=""
		data-slot="mention-item"
		data-value={value}
		data-selected={isSelected ? "" : undefined}
		data-highlighted={isHighlighted ? "" : undefined}
		data-disabled={isDisabled ? "" : undefined}
		{...restProps}
		class={cn(
			"relative flex w-full cursor-default flex-col items-start gap-0.5 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
			className,
		)}
		{onclick}
		{onpointerdown}
		{onpointermove}
	>
		{@render children?.()}
	</div>
{/if}
