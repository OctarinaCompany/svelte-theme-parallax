<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	export type PromptInputActionAddAttachmentsProps = ComponentProps<typeof DropdownMenu.Item> & {
		/**
		 * The item's text. Ignored when `children` are given.
		 * @default "Add photos or files"
		 */
		label?: string;
	};
</script>

<script lang="ts">
	import ImageIcon from "@lucide/svelte/icons/image";
	import Item from "./prompt-input-action-menu-item.svelte";
	import { getPromptInputContext } from "./prompt-input.svelte.js";

	/**
	 * The one menu item that DOES something: it opens the file dialog of the composer it is inside.
	 *
	 * THE MENU CLOSES, WHERE UPSTREAM KEEPS IT OPEN. Upstream calls `event.preventDefault()` in
	 * `onSelect` before opening the dialog, which in both Radix and Bits UI means "do not close" —
	 * so the menu is still hanging there behind the operating system's file picker, and still there
	 * after a file has been chosen. This part lets the selection close the menu as every other menu
	 * item does. The dialog is opened from INSIDE `onSelect`, which Bits UI calls before it closes
	 * the menu (`bits-ui/dist/bits/menu/menu.svelte.js`, `#handleSelect`), so the click that opened
	 * the picker is still the user gesture the browser requires.
	 *
	 * A caller's own `onSelect` runs first and `event.preventDefault()` in it is the veto: it keeps
	 * the menu open AND skips the dialog, which is what a caller who wants to ask something before
	 * picking files needs.
	 *
	 * The dialog does not open while the composer is `disabled` — `PromptInputAttachmentsState.openFileDialog`
	 * refuses — so an inert composer cannot be talked into a picker whose files it would then throw
	 * away. Pass `disabled` here to grey the item out as well; the root's `disabled` does not reach
	 * the tools, by design.
	 */
	let {
		ref = $bindable(null),
		onSelect,
		label = "Add photos or files",
		children,
		...restProps
	}: PromptInputActionAddAttachmentsProps = $props();

	const input = getPromptInputContext("`<PromptInput.ActionAddAttachments>`");
</script>

<Item
	bind:ref
	{...restProps}
	onSelect={(event) => {
		onSelect?.(event);
		if (event.defaultPrevented) return;
		input.attachments.openFileDialog();
	}}
>
	{#if children}
		{@render children()}
	{:else}
		<ImageIcon aria-hidden="true" />
		{label}
	{/if}
</Item>
