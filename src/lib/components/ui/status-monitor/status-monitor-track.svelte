<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type StatusMonitorTrackProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	>;
</script>

<script lang="ts">
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";

	import StatusMonitorBar from "./status-monitor-bar.svelte";
	import { getStatusMonitorContext } from "./status-monitor.svelte.js";

	/**
	 * The strip itself: one bar per visible period, oldest on the left.
	 *
	 * The grid is sized from the same two constants the strip's width is computed from — the column
	 * template repeats `--status-monitor-bar-width` and the gutter is `--status-monitor-bar-gap` —
	 * so the header, the legend and the bars can never disagree about where the ends are.
	 *
	 * `<Tooltip.Provider>` wraps the bars here, matching upstream's placement.
	 * `bits-ui` requires a provider ancestor; the app shell already
	 * mounts one, and a nested provider is what keeps a monitor rendered outside that shell working.
	 *
	 * `role="group"` with the monitor's title as its name gives the ninety buttons one announced
	 * container, so a screen reader user is told what they have walked into before walking it.
	 */
	let { ref = $bindable(null), class: className, ...restProps }: StatusMonitorTrackProps = $props();

	const root = getStatusMonitorContext("<StatusMonitor.Track>");
</script>

<Tooltip.Provider>
	<div
		bind:this={ref}
		data-slot="status-monitor-track"
		role="group"
		aria-label={root.title}
		class={cn(
			"mx-auto grid h-8 w-(--status-monitor-track-width) gap-(--status-monitor-bar-gap)",
			className,
		)}
		style="grid-template-columns: repeat({root.slots}, var(--status-monitor-bar-width));"
		{...restProps}
	>
		{#each root.visiblePeriods as period, index (index)}
			<StatusMonitorBar {period} />
		{/each}
	</div>
</Tooltip.Provider>
