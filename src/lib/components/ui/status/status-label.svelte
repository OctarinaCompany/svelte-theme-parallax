<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type StatusLabelProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: StatusLabelProps = $props();
</script>

<div bind:this={ref} data-slot="status-label" class={cn("leading-none", className)} {...restProps}>
	{@render children?.()}
</div>
