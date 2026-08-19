<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { SVGAttributes } from "svelte/elements";
	import { getGaugeContext } from "./gauge.svelte.js";

	/**
	 * `WithElementRef<T, U extends HTMLElement>` cannot express an `SVGPathElement`, so the ref is
	 * declared locally.
	 */
	export type GaugeRangeProps = SVGAttributes<SVGPathElement> & {
		ref?: SVGPathElement | null;
	};
</script>

<script lang="ts">
	let { ref = $bindable(null), class: className, ...restProps }: GaugeRangeProps = $props();

	const state = getGaugeContext("GaugeRange");
</script>

<!--
	Deliberate divergence from upstream: no vector-effect="non-scaling-stroke". Browsers apply
	that effect in screen space, so at any effective scale other than 1 (OS display scaling,
	browser zoom) the user-unit stroke-dasharray (= arc length) stops covering the on-screen
	path and the dash pattern repeats, painting a phantom second arc.
-->
<path
	bind:this={ref}
	d={state.arcPath}
	fill="none"
	stroke="currentColor"
	stroke-width={state.thickness}
	stroke-linecap="round"
	stroke-dasharray={state.strokeDasharray}
	stroke-dashoffset={state.strokeDashoffset}
	data-slot="gauge-range"
	data-state={state.state}
	data-value={state.value ?? undefined}
	data-min={state.min}
	data-max={state.max}
	{...restProps}
	class={cn("text-primary transition-[stroke-dashoffset] duration-700 ease-out", className)}
/>
