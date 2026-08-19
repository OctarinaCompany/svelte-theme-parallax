<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef } from "$lib/utils.js";

	export type ResponsiveDialogFooterProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the footer's built-in close button. Dialog mode only — `Drawer.Footer` has none.
		 * @default false
		 */
		showCloseButton?: boolean;
	};
</script>

<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Drawer from "$lib/components/ui/drawer/index.js";
	import { cn } from "$lib/utils.js";

	import { getResponsiveDialogContext } from "./responsive-dialog.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		showCloseButton = false,
		...restProps
	}: ResponsiveDialogFooterProps = $props();

	const state = getResponsiveDialogContext("Footer");
</script>

{#if state.variant === "drawer"}
	<Drawer.Footer
		bind:ref
		data-slot="responsive-dialog-footer"
		data-variant={state.variant}
		class={cn(className)}
		{...restProps}
	>
		{@render children?.()}
	</Drawer.Footer>
{:else}
	<Dialog.Footer
		bind:ref
		data-slot="responsive-dialog-footer"
		data-variant={state.variant}
		class={cn(className)}
		{showCloseButton}
		{...restProps}
	>
		{@render children?.()}
	</Dialog.Footer>
{/if}
