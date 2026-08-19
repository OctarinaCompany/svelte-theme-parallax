<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type TagsInputItemTextProps = WithElementRef<
		HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	> & {
		/**
		 * The tag's visible text.
		 *
		 * @default the item's `displayValue(value)`
		 */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import TagsInputItemEdit from "./tags-input-item-edit.svelte";
	import { getTagsInputItemContext } from "./tags-input.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: TagsInputItemTextProps = $props();

	const item = getTagsInputItemContext("<TagsInput.ItemText>");
	const root = item.root;
</script>

{#if item.isEditing && root.editable && !item.disabled}
	<TagsInputItemEdit />
{:else}
	<span
		bind:this={ref}
		id={item.textId}
		data-slot="tags-input-item-text"
		{...restProps}
		class={cn("truncate", className)}
	>
		{#if children}
			{@render children()}
		{:else}
			{item.displayValue}
		{/if}
	</span>
{/if}
