<script lang="ts" module>
	import type { SVGAttributes } from "svelte/elements";

	import { cn } from "$lib/utils.js";

	import { describeAngleArc, getAngleSliderContext } from "./angle-slider.svelte.js";

	/**
	 * `WithElementRef<T, U extends HTMLElement>` cannot express an `SVGSVGElement`, so the ref is
	 * declared locally.
	 */
	export type AngleSliderTrackProps = SVGAttributes<SVGSVGElement> & {
		ref?: SVGSVGElement | null;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: AngleSliderTrackProps = $props();

	const slider = getAngleSliderContext("<AngleSlider.Track>");

	const railPath = $derived(
		describeAngleArc(slider.centre, slider.trackRadius, slider.startAngle, slider.endAngle),
	);
</script>

<svg
	bind:this={ref}
	aria-hidden="true"
	focusable="false"
	data-slot="angle-slider-track"
	data-disabled={slider.disabled ? "" : undefined}
	data-readonly={slider.readOnly ? "" : undefined}
	width={slider.boxSize}
	height={slider.boxSize}
	{...restProps}
	class={cn("absolute inset-0", className)}
>
	{#if slider.isFullCircle}
		<circle
			data-slot="angle-slider-track-rail"
			cx={slider.centre}
			cy={slider.centre}
			r={slider.trackRadius}
			fill="none"
			stroke="currentColor"
			stroke-width={slider.thickness}
			stroke-linecap="round"
			vector-effect="non-scaling-stroke"
			class="stroke-muted"
		/>
	{:else}
		<path
			data-slot="angle-slider-track-rail"
			d={railPath}
			fill="none"
			stroke="currentColor"
			stroke-width={slider.thickness}
			stroke-linecap="round"
			vector-effect="non-scaling-stroke"
			class="stroke-muted"
		/>
	{/if}
	{@render children?.()}
</svg>
