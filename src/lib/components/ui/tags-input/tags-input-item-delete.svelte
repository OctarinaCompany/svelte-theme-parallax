<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	export type TagsInputItemDeleteProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type" | "disabled">,
		HTMLButtonElement
	> & {
		/**
		 * The button's content.
		 *
		 * @default an `X` icon
		 */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import XIcon from "@lucide/svelte/icons/x";

	import { getTagsInputItemContext } from "./tags-input.svelte.js";

	let {
		ref = $bindable(null),
		onclick: onclickProp,
		class: className,
		children,
		...restProps
	}: TagsInputItemDeleteProps = $props();

	const item = getTagsInputItemContext("<TagsInput.ItemDelete>");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		item.remove();
	}
</script>

{#if !item.isEditing}
	<!--
		Never a tab stop — the highlight reaches it, not Tab — and a disabled item disables it for
		real, so it cannot be focused as a dead control.
	-->
	<button
		bind:this={ref}
		type="button"
		tabindex={-1}
		disabled={item.disabled}
		aria-labelledby={item.textId}
		aria-controls={item.id}
		aria-current={item.isHighlighted}
		data-slot="tags-input-item-delete"
		data-state={item.dataState}
		data-disabled={item.disabled ? "" : undefined}
		{...restProps}
		class={cn(
			"size-4 shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 data-disabled:cursor-not-allowed",
			className,
		)}
		{onclick}
	>
		{#if children}
			{@render children()}
		{:else}
			<XIcon class="size-3.5" />
		{/if}
	</button>
{/if}
