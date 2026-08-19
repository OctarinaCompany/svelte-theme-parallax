<script lang="ts" module>
	import type { ComponentProps } from "svelte";

	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Drawer from "$lib/components/ui/drawer/index.js";

	export type ResponsiveDialogOverlayProps = ComponentProps<typeof Dialog.Overlay> &
		ComponentProps<typeof Drawer.Overlay>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { getResponsiveDialogContext } from "./responsive-dialog.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ResponsiveDialogOverlayProps = $props();

	const state = getResponsiveDialogContext("Overlay");
</script>

{#if state.variant === "drawer"}
	<Drawer.Overlay
		bind:ref
		data-slot="responsive-dialog-overlay"
		data-variant={state.variant}
		class={cn(className)}
		{...restProps}
	/>
{:else}
	<Dialog.Overlay
		bind:ref
		data-slot="responsive-dialog-overlay"
		data-variant={state.variant}
		class={cn(className)}
		{...restProps}
	/>
{/if}
