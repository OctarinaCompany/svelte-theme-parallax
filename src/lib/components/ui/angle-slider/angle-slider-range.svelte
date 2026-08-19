<script lang="ts" module>
	import type { SVGAttributes } from "svelte/elements";

	import { cn } from "$lib/utils.js";

	import { describeAngleArc, getAngleSliderContext } from "./angle-slider.svelte.js";

	/**
	 * `WithElementRef<T, U extends HTMLElement>` cannot express an `SVGPathElement`, so the ref is
	 * declared locally.
	 */
	export type AngleSliderRangeProps = SVGAttributes<SVGPathElement> & {
		ref?: SVGPathElement | null;
	};
</script>

<script lang="ts">
	let { ref = $bindable(null), class: className, ...restProps }: AngleSliderRangeProps = $props();

	const slider = getAngleSliderContext("<AngleSlider.Range>");

	const rangeStart = $derived(
		slider.values.length <= 1 ? slider.min : (slider.sorted[0] ?? slider.min),
	);
	const rangeEnd = $derived(
		slider.values.length <= 1
			? (slider.sorted[0] ?? slider.min)
			: (slider.sorted[slider.sorted.length - 1] ?? slider.max),
	);

	// Upstream derives the arc's endpoints from a raw `(value - min) / (max - min)` percentage,
	// skipping the `inverted` branch that `getAngleFromValue` applies to the thumbs — which leaves
	// the arc mirrored against its own thumbs on an inverted dial. Going through the same
	// conversion the thumbs use keeps the two in agreement.
	//
	// The endpoints alone do not pick an arc, though: `inverted` makes the dial angle decrease as
	// the value increases, so `angleFor(rangeStart) > angleFor(rangeEnd)` and a clockwise sweep
	// would cover the *complement* of the selection — 270° of arc for `[90]` on a `0…360` dial.
	// Sweeping anti-clockwise there fills exactly `angleFor(rangeStart) - angleFor(rangeEnd)`
	// degrees and still ends on the thumb; a non-inverted dial keeps upstream's clockwise sweep.
	const path = $derived(
		describeAngleArc(
			slider.centre,
			slider.trackRadius,
			slider.angleFor(rangeStart),
			slider.angleFor(rangeEnd),
			!slider.inverted,
		),
	);
</script>

{#if rangeStart !== rangeEnd}
	<path
		bind:this={ref}
		data-slot="angle-slider-range"
		data-disabled={slider.disabled ? "" : undefined}
		data-readonly={slider.readOnly ? "" : undefined}
		d={path}
		fill="none"
		stroke="currentColor"
		stroke-width={slider.thickness}
		stroke-linecap="round"
		vector-effect="non-scaling-stroke"
		{...restProps}
		class={cn("stroke-primary", className)}
	/>
{/if}
