<script lang="ts" module>
	import type { Dialog as DialogPrimitive } from "bits-ui";

	/** `vaul-svelte` re-exports `bits-ui`'s `DialogCloseProps` verbatim — one type for both branches. */
	export type ResponsiveDialogCloseProps = DialogPrimitive.CloseProps;
</script>

<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Drawer from "$lib/components/ui/drawer/index.js";
	import { cn } from "$lib/utils.js";

	import { getResponsiveDialogContext } from "./responsive-dialog.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ResponsiveDialogCloseProps = $props();

	const state = getResponsiveDialogContext("Close");
</script>

{#if state.variant === "drawer"}
	<Drawer.Close
		bind:ref
		data-slot="responsive-dialog-close"
		data-variant={state.variant}
		class={cn(className)}
		{...restProps}
	/>
{:else}
	<Dialog.Close
		bind:ref
		data-slot="responsive-dialog-close"
		data-variant={state.variant}
		class={cn(className)}
		{...restProps}
	/>
{/if}
