<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef } from "$lib/utils.js";

	export type ResponsiveDialogHeaderProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
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
		...restProps
	}: ResponsiveDialogHeaderProps = $props();

	const state = getResponsiveDialogContext("Header");
</script>

{#if state.variant === "drawer"}
	<Drawer.Header
		bind:ref
		data-slot="responsive-dialog-header"
		data-variant={state.variant}
		class={cn(className)}
		{...restProps}
	>
		{@render children?.()}
	</Drawer.Header>
{:else}
	<Dialog.Header
		bind:ref
		data-slot="responsive-dialog-header"
		data-variant={state.variant}
		class={cn(className)}
		{...restProps}
	>
		{@render children?.()}
	</Dialog.Header>
{/if}
