<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A ring of even dashes turning slowly, like a tape measure being wound.
	 *
	 * `pathLength="1"` AND DASH FIGURES THAT ACTUALLY TILE. A hand-written
	 * `stroke-dasharray="8 8"` on a circle of radius 20 — circumference
	 * 2π·20 = 125.664 user units, 125.664 / 16 = 7.854 periods — does not tile:
	 * the last dash before the path's start point is cut short and the ring carries one permanently
	 * wrong-sized gap that rotates with it. Normalising the path to one unit long and asking for
	 * `0.0625 0.0625` gives exactly eight dashes and eight gaps of 7.854 user units each — within a
	 * fifth of a pixel of 8, and evenly spaced all the way round. This is the same
	 * normalisation `loader-arc-tracer.svelte` applies to its hand-rounded dash,
	 * and it is why the ring can change radius without the maths being redone.
	 *
	 * WHAT THE EVEN TILING BUYS. Eight identical dashes make the ring its own rotation every 45°, so
	 * the picture no longer depends on where in the loop you look — including at 0°, which is where
	 * the shared reduced-motion rule freezes it. An untiled ring instead carries one short dash that
	 * travels round with the rotation, and the frozen frame would have shown it.
	 *
	 * The ring is the primary mark — the loader is nothing but this ring —
	 * so `stroke-foreground`, and no track behind it.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="dash-ring"
	{role}
	aria-label={ariaLabel}
	class={cn("size-12", className)}
>
	<svg class="size-full" viewBox="0 0 50 50" aria-hidden="true">
		<circle
			cx="25"
			cy="25"
			r="20"
			class="dashes fill-none stroke-foreground"
			stroke-width="3"
			pathLength="1"
			stroke-dasharray="0.0625 0.0625"
		/>
	</svg>
</div>

<style>
	/* `rotate: 360` over 4s linear. */
	@keyframes loader-dash-ring-turn {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.dashes {
		/* The rest state: the ring as drawn — see the note above on why that is a true frame. */
		transform: rotate(0deg);

		/* This has to be stated: an SVG child's
		   transform reference box is the view-box, so `center` here means the centre of the 50×50
		   viewBox rather than of the circle's own bounding box. Leaving it out would swing the ring
		   around the top-left corner. */
		transform-origin: center;

		animation: loader-dash-ring-turn 4s linear infinite;
	}
</style>
