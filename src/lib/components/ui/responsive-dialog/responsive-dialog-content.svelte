<script lang="ts" module>
	import type { ComponentProps } from "svelte";

	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Drawer from "$lib/components/ui/drawer/index.js";

	export type ResponsiveDialogContentProps = ComponentProps<typeof Dialog.Content> &
		ComponentProps<typeof Drawer.Content>;

	/** Everything the WAI-ARIA dialog pattern considers a tab stop, in document order. */
	const FOCUSABLE_SELECTOR = [
		"a[href]",
		"button:not([disabled])",
		"input:not([disabled])",
		"select:not([disabled])",
		"textarea:not([disabled])",
		'[tabindex]:not([tabindex="-1"])',
	].join(",");

	/**
	 * Neither primitive treats "mounted while already open" as an open transition, so after a
	 * breakpoint swap `document.activeElement` is `<body>`. Put focus back inside the new content —
	 * on its first focusable descendant, or on the content element itself when it has none.
	 */
	function focusContent(element: HTMLElement): void {
		const target = element.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
		if (target) {
			target.focus();
			return;
		}

		if (!element.hasAttribute("tabindex")) element.tabIndex = -1;
		element.focus();
	}
</script>

<script lang="ts">
	import { untrack } from "svelte";

	import { cn } from "$lib/utils.js";

	import { getResponsiveDialogContext } from "./responsive-dialog.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		showCloseButton = true,
		children,
		...restProps
	}: ResponsiveDialogContentProps = $props();

	const state = getResponsiveDialogContext("Content");

	// Runs once per mounted content element — which is exactly once per breakpoint swap, because the
	// root's `{#if}` destroys one branch and creates the other. `consumeFocusRestore` writes the flag
	// it reads, hence `untrack`.
	$effect(() => {
		const element = ref;
		if (!element) return;
		if (!untrack(() => state.consumeFocusRestore())) return;

		focusContent(element);
	});
</script>

{#if state.variant === "drawer"}
	<Drawer.Content
		bind:ref
		data-slot="responsive-dialog-content"
		data-variant={state.variant}
		class={cn("px-4 pb-4", className)}
		{portalProps}
		{...restProps}
	>
		{@render children?.()}
	</Drawer.Content>
{:else}
	<Dialog.Content
		bind:ref
		data-slot="responsive-dialog-content"
		data-variant={state.variant}
		class={cn(className)}
		{portalProps}
		{showCloseButton}
		{...restProps}
	>
		{@render children?.()}
	</Dialog.Content>
{/if}
