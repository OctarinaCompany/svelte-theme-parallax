<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type ComboboxItemProps<T = unknown> = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * The item this row stands for — the whole record, not a string. Selecting it commits it
		 * into the root's `value`; `itemToStringValue` decides how it displays and filters.
		 */
		value: T;
		/** Overrides the string form for this row alone. */
		label?: string;
		/**
		 * Whether the item is disabled, independently of the root's `disabled`.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/** The row's rendered content; the selected indicator is appended after it. */
		children?: Snippet;
	};
</script>

<script lang="ts" generics="T = unknown">
	import CheckIcon from "@lucide/svelte/icons/check";

	import { getComboboxContext } from "./combobox.svelte.js";

	/**
	 * One option, check indicator included — upstream renders the
	 * `ItemIndicator` inside every item, `IconPlaceholder` resolved to the `CheckIcon` it renders
	 * at runtime.
	 *
	 * Highlight is not focus: DOM focus stays in the field for the whole interaction, and the
	 * highlighted row is announced through the field's `aria-activedescendant`. That is the APG
	 * combobox pattern, and it is what lets `ArrowDown` move the selection while typing keeps
	 * working. `aria-selected` answers the *selection* question — this is a select-flavoured
	 * listbox, unlike the sibling autocomplete where highlight is all there is.
	 */

	let {
		ref = $bindable(null),
		value,
		label,
		disabled = false,
		class: className,
		onclick: onclickProp,
		onpointerdown: onpointerdownProp,
		onpointermove: onpointermoveProp,
		children,
		...restProps
	}: ComboboxItemProps<T> = $props();

	const root = getComboboxContext("<Combobox.Item>");

	const itemId = $props.id();

	const stringValue = $derived(label ?? root.itemToStringValue(value));
	const isDisabled = $derived(disabled || root.disabled);
	const isSelected = $derived(root.isSelected(value));
	const isHighlighted = $derived(root.highlightedItem?.id === itemId);

	// The collection holds a snapshot rather than a bag of getters, so re-registering is how a
	// change is published — the same contract `<Autocomplete.Item>` uses.
	$effect(() => {
		const element = ref;
		if (!element) return;

		return root.collection.register({
			element,
			id: itemId,
			stringValue,
			item: value,
			disabled: isDisabled,
		});
	});

	// Each handler runs the caller's first and `preventDefault()` suppresses ours.
	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;
		if (isDisabled) return;

		root.selectItem(value);
	}

	function onpointerdown(event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onpointerdownProp?.(event);
		if (event.defaultPrevented) return;
		if (isDisabled) return;

		// Keep the row from taking focus off the field, for both mouse and touch — losing it would
		// dismiss the popup before the click ever lands.
		if (event.button === 0 && !event.ctrlKey) event.preventDefault();
	}

	function onpointermove(event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onpointermoveProp?.(event);
		if (event.defaultPrevented) return;
		if (isDisabled || root.readonly) return;

		root.highlightedElement = event.currentTarget;
	}
</script>

<div
	bind:this={ref}
	role="option"
	id={itemId}
	aria-selected={isSelected}
	aria-disabled={isDisabled}
	data-slot="combobox-item"
	data-value={stringValue}
	data-selected={isSelected ? "" : undefined}
	data-highlighted={isHighlighted ? "" : undefined}
	data-disabled={isDisabled ? "" : undefined}
	{...restProps}
	class={cn(
		"relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden transition-colors select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([role=img]):not([class*='text-'])]:opacity-60",
		className,
	)}
	{onclick}
	{onpointerdown}
	{onpointermove}
>
	{@render children?.()}
	{#if isSelected}
		<!-- Upstream's `ItemIndicator` span: absolute in the reserved end padding. -->
		<span
			data-slot="combobox-item-indicator"
			class="pointer-events-none absolute right-2 flex items-center justify-center"
		>
			<CheckIcon />
		</span>
	{/if}
</div>
