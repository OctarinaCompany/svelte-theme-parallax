<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A triangle outline that draws itself over a quiet one and then rubs itself out.
	 *
	 * ONE OF THE NINE STROKE-DASH LOADERS, and a straight application of the idiom
	 * `loader-arc-tracer.svelte` proves: `stroke-dashoffset` is a real CSS property, so the draw is
	 * a plain keyframe with nothing lost.
	 *
	 * `pathLength="1"` IS DELIBERATE, the same move `loader-arc-tracer.svelte` makes.
	 * A hand-rounded `stroke-dasharray="120"` for a triangle whose real
	 * perimeter is 40 + 2·√(20² + 35²) = 120.62 user units would be half a percent short, and
	 * the outline would never quite close at the top of the cycle. `pathLength` tells the browser to treat
	 * the path as one unit long whatever its geometry, so `stroke-dasharray="1"` is exactly one
	 * perimeter and the offsets below are fractions. Move a vertex and this loader still works.
	 *
	 * NO `vector-effect="non-scaling-stroke"`. `ui/circular-progress` records why in
	 * `circular-progress-range.svelte:25-30`: the effect is applied in screen space, so at any
	 * effective scale other than 1 — OS display scaling, browser zoom — a dash pattern measured in
	 * user units stops covering the on-screen path, repeats, and paints a phantom second outline.
	 *
	 * SVG ATTRIBUTE SPELLING IS SVG'S OWN. `stroke-width` and `stroke-dasharray` are
	 * presentation attributes and go kebab; `pathLength` and `viewBox` stay camelCase because that is
	 * what the specification calls them. `path-length` would compile, render, and silently do
	 * nothing.
	 *
	 * `overflow-visible` IS LOAD-BEARING: the 3px stroke on the
	 * apex at y=5 and on the base at y=40 would otherwise be clipped by the viewport edges.
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
	data-loader="minimal-triangle"
	{role}
	aria-label={ariaLabel}
	class={cn("size-10", className)}
>
	<svg class="size-full overflow-visible" viewBox="0 0 50 50" aria-hidden="true">
		<!--
			The unlit outline the bright one is traced over: a track rather than a mark, so it takes
			the `/20` weight.
		-->
		<polygon
			points="25,5 45,40 5,40"
			class="fill-none stroke-muted-foreground/20"
			stroke-width="3"
		/>
		<polygon
			class="edge fill-none stroke-foreground"
			points="25,5 45,40 5,40"
			stroke-width="3"
			pathLength="1"
			stroke-dasharray="1"
		/>
	</svg>
</div>

<style>
	/* The draw-and-erase, over three equal intervals and expressed against `pathLength="1"`. The
	   dash and the gap are both one perimeter, so a positive offset hides the path behind the gap at
	   one end and a negative one hides it at the other — which is what makes the outline appear to be
	   drawn from a corner and then rubbed out from the same corner. */
	@keyframes loader-minimal-triangle-trace {
		0% {
			stroke-dashoffset: 1;
		}
		50% {
			stroke-dashoffset: 0;
		}
		100% {
			stroke-dashoffset: -1;
		}
	}

	.edge {
		/* The rest state: three quarters of the outline drawn, i.e. the frame this loader would be
		   caught on part-way through a trace. `0` would leave a closed triangle, which reads as a
		   finished thing, and `1` would leave an empty box. */
		stroke-dashoffset: 0.25;

		/* `ease-in-out` is the CSS keyword, cubic-bezier(0.42, 0, 0.58, 1),
		   not Tailwind's `--ease-in-out`. */
		animation: loader-minimal-triangle-trace 2s ease-in-out infinite;
	}
</style>
