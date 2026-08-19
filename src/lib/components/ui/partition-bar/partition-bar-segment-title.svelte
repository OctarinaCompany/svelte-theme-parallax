<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { PARTITION_BAR_SEGMENT_TITLE_CLASSES } from "./partition-bar.svelte.js";

	export type PartitionBarSegmentTitleProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: PartitionBarSegmentTitleProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="partition-bar-segment-title"
	{...restProps}
	class={cn(PARTITION_BAR_SEGMENT_TITLE_CLASSES, className)}
>
	{@render children?.()}
</div>
