<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type StatusMonitorLegendProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	>;
</script>

<script lang="ts">
	import { getStatusMonitorContext } from "./status-monitor.svelte.js";

	/**
	 * The row below the strip, naming its two ends.
	 *
	 * The left label counts the bars that are actually on screen, not the ninety that are held: at a
	 * narrow width the strip shows the newest thirty, and saying "90 days ago" over a bar measured
	 * thirty days ago would be a caption that contradicts the picture.
	 */
	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: StatusMonitorLegendProps = $props();

	const root = getStatusMonitorContext("<StatusMonitor.Legend>");
</script>

<div
	bind:this={ref}
	data-slot="status-monitor-legend"
	class={cn(
		"mx-auto flex w-(--status-monitor-track-width) justify-between text-xs text-muted-foreground",
		className,
	)}
	{...restProps}
>
	<span>{root.slots} {root.unit} ago</span>
	<span>Current</span>
</div>
