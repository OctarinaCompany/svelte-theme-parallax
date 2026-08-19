<script lang="ts" module>
	import type { Dialog as DialogPrimitive } from "bits-ui";

	/**
	 * `vaul-svelte` re-exports `bits-ui`'s `DialogTriggerProps` verbatim, so one type is valid for
	 * both branches — including the `child` snippet that replaces upstream's `asChild`.
	 */
	export type ResponsiveDialogTriggerProps = DialogPrimitive.TriggerProps;
</script>

<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Drawer from "$lib/components/ui/drawer/index.js";
	import { cn } from "$lib/utils.js";

	import { getResponsiveDialogContext } from "./responsive-dialog.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		type = "button",
		...restProps
	}: ResponsiveDialogTriggerProps = $props();

	const state = getResponsiveDialogContext("Trigger");
</script>

{#if state.variant === "drawer"}
	<Drawer.Trigger
		bind:ref
		data-slot="responsive-dialog-trigger"
		data-variant={state.variant}
		{type}
		class={cn(className)}
		{...restProps}
	/>
{:else}
	<Dialog.Trigger
		bind:ref
		data-slot="responsive-dialog-trigger"
		data-variant={state.variant}
		{type}
		class={cn(className)}
		{...restProps}
	/>
{/if}
