<script lang="ts" module>
	import type { WithoutChildren } from "$lib/utils.js";
	import type { StatusMonitorRootProps } from "./status-monitor.svelte";

	export type StatusMonitorCombinedProps = WithoutChildren<StatusMonitorRootProps>;
</script>

<script lang="ts">
	import Header from "./status-monitor-header.svelte";
	import Legend from "./status-monitor-legend.svelte";
	import Root from "./status-monitor.svelte";
	import Track from "./status-monitor-track.svelte";

	/**
	 * The default arrangement — header, strip, legend — as one tag, the way upstream ships it.
	 *
	 * Same reason `ui/gauge/gauge-combined.svelte` exists: the parts are split so a caller can drop
	 * one, reorder them or put their own markup between them, but the common case should not have to
	 * restate a fixed three-line composition.
	 */
	let { ref = $bindable(null), ...rootProps }: StatusMonitorCombinedProps = $props();
</script>

<Root bind:ref {...rootProps}>
	<Header />
	<Track />
	<Legend />
</Root>
