<script lang="ts" module>
	import type { WithoutChildrenOrChild } from "$lib/utils.js";
	import type { GaugeRootProps } from "./gauge.svelte";

	export type GaugeCombinedProps = WithoutChildrenOrChild<GaugeRootProps>;
</script>

<script lang="ts">
	import Indicator from "./gauge-indicator.svelte";
	import Range from "./gauge-range.svelte";
	import Root from "./gauge.svelte";
	import Track from "./gauge-track.svelte";
	import ValueText from "./gauge-value-text.svelte";

	let { ref = $bindable(null), ...rootProps }: GaugeCombinedProps = $props();
</script>

<Root bind:ref {...rootProps}>
	<Indicator>
		<Track />
		<Range />
	</Indicator>
	<ValueText />
</Root>
