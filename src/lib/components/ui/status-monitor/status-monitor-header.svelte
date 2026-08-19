<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type StatusMonitorHeaderProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { getStatusMonitorContext } from "./status-monitor.svelte.js";

	/**
	 * The row above the strip: the monitor's heading on the left, the uptime percentage on the right.
	 *
	 * It takes no `children`. Both halves are the root's props, and a header that could be both fed
	 * from context and overridden by a snippet would have two sources for one line of text. To show
	 * something else entirely, leave this part out and write the row.
	 *
	 * It is laid out at the strip's width, not the root's, so "Application Status" starts over the
	 * first bar and the percentage ends over the last one.
	 */
	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: StatusMonitorHeaderProps = $props();

	const root = getStatusMonitorContext("<StatusMonitor.Header>");
</script>

<div
	bind:this={ref}
	data-slot="status-monitor-header"
	class={cn(
		"mx-auto flex w-(--status-monitor-track-width) items-center justify-between text-sm",
		className,
	)}
	{...restProps}
>
	<span class="font-semibold text-foreground">{root.title}</span>
	{#if root.showUptime}
		<span class="font-medium text-muted-foreground">{root.uptime}% uptime</span>
	{/if}
</div>
