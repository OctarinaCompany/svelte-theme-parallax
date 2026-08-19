<script lang="ts" module>
	import type { WithoutChildrenOrChild } from "$lib/utils.js";
	import type { CircularProgressRootProps } from "./circular-progress.svelte";

	export type CircularProgressCombinedProps = WithoutChildrenOrChild<CircularProgressRootProps>;
</script>

<script lang="ts">
	import Indicator from "./circular-progress-indicator.svelte";
	import Range from "./circular-progress-range.svelte";
	import Root from "./circular-progress.svelte";
	import Track from "./circular-progress-track.svelte";
	import ValueText from "./circular-progress-value-text.svelte";

	let { ref = $bindable(null), ...rootProps }: CircularProgressCombinedProps = $props();
</script>

<Root bind:ref {...rootProps}>
	<Indicator>
		<Track />
		<Range />
	</Indicator>
	<ValueText />
</Root>
