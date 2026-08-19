<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type TagsInputItemProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** The value of the item. Identifies the tag, so it must be unique within the list. */
		value: string;
		/**
		 * Whether the item is disabled, independently of the root's `disabled`.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/** Normally a `<TagsInput.ItemText>` and a `<TagsInput.ItemDelete>`. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import {
		getTagsInputContext,
		setTagsInputItemContext,
		TagsInputItemState,
	} from "./tags-input.svelte.js";

	let {
		ref = $bindable(null),
		value,
		disabled = false,
		ondblclick: ondblclickProp,
		onpointerup: onpointerupProp,
		onpointermove: onpointermoveProp,
		onpointerleave: onpointerleaveProp,
		class: className,
		children,
		...restProps
	}: TagsInputItemProps = $props();

	const root = getTagsInputContext("<TagsInput.Item>");

	const itemId = $props.id();

	const item = setTagsInputItemContext(
		new TagsInputItemState({
			root,
			getValue: () => value,
			getDisabled: () => disabled,
			id: itemId,
		}),
	);

	// Replaces upstream's `useItemCollection`: the root needs to know which tag values are disabled so
	// keyboard navigation can skip them, and registering by value survives insertion and removal
	// anywhere in the list. The id feeds the input's `aria-activedescendant` (divergence D-9).
	$effect(() =>
		root.registerItem(
			() => value,
			() => disabled,
			() => itemId,
		),
	);

	/**
	 * `aria-labelledby`, `aria-current` and `aria-disabled` on an element whose implicit role is
	 * `generic` are rejected by Svelte's `a11y_role_supports_aria_props` check when written literally,
	 * and `svelte-ignore` is not an option. Spreading the object emits exactly the same DOM while
	 * staying out of the compiler's static analysis, as `checkbox-group.svelte` already does.
	 */
	const itemAria = $derived({
		// The text span (`item.textId`) unmounts while the edit field is shown, so the idref is
		// dropped rather than left dangling — the same no-dangling-idref rule as divergence D-6.
		"aria-labelledby": item.isEditing ? undefined : item.textId,
		"aria-current": item.isHighlighted,
		"aria-disabled": item.disabled,
	});

	// Each handler runs the caller's first and `preventDefault()` suppresses ours, reproducing
	// upstream's `composeEventHandlers`.
	function ondblclick(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		ondblclickProp?.(event);
		if (event.defaultPrevented) return;

		item.edit();
	}

	/**
	 * Upstream splits selection across `onClick` (touch and pen) and `onPointerUp` (mouse) behind a
	 * remembered `pointerType`. Svelte's pointer events already normalise the three, and a separate
	 * `onclick` would race the root's `onmousedown` focus guard, so one handler covers all of them
	 * (divergence D-8).
	 */
	function onpointerup(event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onpointerupProp?.(event);
		if (event.defaultPrevented) return;

		item.select();
	}

	function onpointermove(event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onpointermoveProp?.(event);
		if (event.defaultPrevented) return;

		// Upstream `onPointerMove`: sliding onto a disabled tag drops the highlight entirely.
		if (item.disabled) root.leaveItem();
	}

	function onpointerleave(event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onpointerleaveProp?.(event);
		if (event.defaultPrevented) return;

		// Upstream `onPointerLeave` keys off `currentTarget === document.activeElement`; the tag is
		// never focused here — the highlight is the equivalent state — and an open edit field owns the
		// interaction until it commits or is dismissed.
		if (item.isHighlighted && !item.isEditing) root.leaveItem();
	}
</script>

<div
	bind:this={ref}
	id={itemId}
	data-slot="tags-input-item"
	{...itemAria}
	data-state={item.dataState}
	data-highlighted={item.isHighlighted ? "" : undefined}
	data-editing={item.isEditing ? "" : undefined}
	data-editable={root.editable ? "" : undefined}
	data-disabled={item.disabled ? "" : undefined}
	{...restProps}
	class={cn(
		"inline-flex max-w-[calc(100%-8px)] items-center gap-1.5 rounded border bg-transparent px-2.5 py-1 text-sm focus:outline-hidden data-editable:select-none data-editing:bg-transparent data-editing:ring-1 data-editing:ring-ring data-disabled:cursor-not-allowed data-disabled:opacity-50 [&:not([data-editing])]:pe-1.5 [&[data-highlighted]:not([data-editing])]:bg-accent [&[data-highlighted]:not([data-editing])]:text-accent-foreground",
		className,
	)}
	{ondblclick}
	{onpointerup}
	{onpointermove}
	{onpointerleave}
>
	{@render children?.()}
</div>
