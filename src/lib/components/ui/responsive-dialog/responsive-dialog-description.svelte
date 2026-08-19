<script lang="ts" module>
	import type { Dialog as DialogPrimitive } from "bits-ui";

	/**
	 * `vaul-svelte` re-exports `bits-ui`'s `DialogDescriptionProps` verbatim — one type for both
	 * branches.
	 */
	export type ResponsiveDialogDescriptionProps = DialogPrimitive.DescriptionProps;
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
	}: ResponsiveDialogDescriptionProps = $props();

	const state = getResponsiveDialogContext("Description");
</script>

{#if state.variant === "drawer"}
	<Drawer.Description
		bind:ref
		data-slot="responsive-dialog-description"
		data-variant={state.variant}
		class={cn(className)}
		{...restProps}
	/>
{:else}
	<Dialog.Description
		bind:ref
		data-slot="responsive-dialog-description"
		data-variant={state.variant}
		class={cn(className)}
		{...restProps}
	/>
{/if}
