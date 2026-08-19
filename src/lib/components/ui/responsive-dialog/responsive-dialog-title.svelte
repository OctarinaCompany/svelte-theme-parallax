<script lang="ts" module>
	import type { Dialog as DialogPrimitive } from "bits-ui";

	/** `vaul-svelte` re-exports `bits-ui`'s `DialogTitleProps` verbatim — one type for both branches. */
	export type ResponsiveDialogTitleProps = DialogPrimitive.TitleProps;
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
	}: ResponsiveDialogTitleProps = $props();

	const state = getResponsiveDialogContext("Title");
</script>

{#if state.variant === "drawer"}
	<Drawer.Title
		bind:ref
		data-slot="responsive-dialog-title"
		data-variant={state.variant}
		class={cn(className)}
		{...restProps}
	/>
{:else}
	<Dialog.Title
		bind:ref
		data-slot="responsive-dialog-title"
		data-variant={state.variant}
		class={cn(className)}
		{...restProps}
	/>
{/if}
