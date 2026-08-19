<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { SVGAttributes } from "svelte/elements";
	import { getCircularProgressContext } from "./circular-progress.svelte.js";

	/**
	 * `WithElementRef<T, U extends HTMLElement>` cannot express an `SVGCircleElement`, so the ref is
	 * declared locally.
	 */
	export type CircularProgressRangeProps = SVGAttributes<SVGCircleElement> & {
		ref?: SVGCircleElement | null;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CircularProgressRangeProps = $props();

	const state = getCircularProgressContext("CircularProgressRange");
</script>

<!--
	Deliberate divergence from upstream: no vector-effect="non-scaling-stroke". Browsers apply
	that effect in screen space, so at any effective scale other than 1 (OS display scaling,
	browser zoom) the user-unit stroke-dasharray stops covering the on-screen path and the dash
	pattern repeats, painting a phantom second arc.
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
	stroke-dasharray={state.strokeDasharray}
	stroke-dashoffset={state.strokeDashoffset}
	data-slot="circular-progress-range"
	data-state={state.state}
	data-value={state.value ?? undefined}
	data-min={state.min}
	data-max={state.max}
	{...restProps}
	class={cn("origin-center text-primary transition-all duration-300 ease-in-out", className)}
/>

<style>
	@keyframes spin-around {
		0% {
			transform: rotate(-90deg);
		}
		100% {
			transform: rotate(270deg);
		}
	}

	circle[data-state="indeterminate"] {
		animation: spin-around 0.8s linear infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		circle[data-state="indeterminate"] {
			animation: none;
		}
	}
</style>
