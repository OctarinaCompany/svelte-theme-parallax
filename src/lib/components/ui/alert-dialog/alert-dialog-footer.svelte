<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef } from "$lib/utils.js";

	export type AlertDialogFooterProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: AlertDialogFooterProps = $props();
</script>

<!-- Upstream `AlertDialogFooter`: the sm content size swaps the
stacked/row button layout for a two-column grid, so Cancel/Action split the width evenly —
the compact "OS prompt" look the small preset is for. -->
<div
	bind:this={ref}
	data-slot="alert-dialog-footer"
	class={cn(
		"flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
