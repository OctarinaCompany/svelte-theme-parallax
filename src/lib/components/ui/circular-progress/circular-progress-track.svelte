<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { SVGAttributes } from "svelte/elements";
	import { getCircularProgressContext } from "./circular-progress.svelte.js";

	/**
	 * `WithElementRef<T, U extends HTMLElement>` cannot express an `SVGCircleElement`, so the ref is
	 * declared locally.
	 */
	export type CircularProgressTrackProps = SVGAttributes<SVGCircleElement> & {
		ref?: SVGCircleElement | null;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CircularProgressTrackProps = $props();

	const state = getCircularProgressContext("CircularProgressTrack");
</script>

<!--
	No vector-effect="non-scaling-stroke" (deliberate divergence from upstream): it renders the
	stroke at width/devicePixelRatio and must match the Range, whose dash math requires
	user-space stroking.
-->
<circle
	bind:this={ref}
	cx={state.center}
	cy={state.center}
	r={state.radius}
	fill="none"
	stroke="currentColor"
	stroke-width={state.thickness}
	stroke-linecap="round"
	data-slot="circular-progress-track"
	data-state={state.state}
	{...restProps}
	class={cn("text-muted-foreground/20", className)}
/>
