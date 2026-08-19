<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A hexagonal outline that draws itself round and is then rubbed out from the same corner.
	 *
	 * One of the nine stroke-dash loaders; the idiom is `loader-arc-tracer.svelte`'s and this file
	 * follows it: `stroke-dashoffset` is a real CSS property, so the draw is a plain keyframe
	 * with nothing lost.
	 *
	 * `pathLength="1"` IS DELIBERATE. A hand-guessed `stroke-dasharray="120"`
	 * for a polygon that really measures 4·√500 + 40 = 129.44 user units would be
	 * seven percent short — the lit run topping out at 93% and the hexagon never quite closing —
	 * and the number stops meaning anything the moment anyone edits `points`. `pathLength` declares the path
	 * one unit long whatever its geometry, so `stroke-dasharray="1"` is exactly one perimeter of dash
	 * followed by one perimeter of gap and the arithmetic no longer depends on the points.
	 *
	 * What that does NOT change is the shape of the motion, and it should not: with a dash as long as
	 * the whole outline, the lit run still grows from nothing to the full hexagon and shrinks
	 * back — and here it genuinely closes.
	 *
	 * THE LOOP SNAP IS INVISIBLE, which is why `[120, -120]` can be a plain `from`/`to`. The dash
	 * pattern repeats every two units (one unit drawn, one unit of gap), so an offset of −1 paints
	 * precisely what an offset of +1 paints: the jump back at the end of each cycle lands on the same
	 * picture. `linear`, so the segment travels at a constant rate.
	 *
	 * NO `vector-effect="non-scaling-stroke"`, per `ui/circular-progress`'s note in
	 * `circular-progress-range.svelte:25-30`: it is applied in screen space, so at any effective
	 * scale other than 1 the dash pattern stops covering the on-screen path and repeats into a
	 * phantom second segment. Dash arithmetic needs user-space stroking.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	/** The hexagon, drawn twice. */
	const HEXAGON = "25,5 45,15 45,35 25,45 5,35 5,15";
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="hexagon-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn("size-10", className)}
>
	<svg class="size-full" viewBox="0 0 50 50" aria-hidden="true">
		<!--
			The unlit outline the segment travels over: `stroke-zinc-200 dark:stroke-zinc-800` is a
			track, so it takes the `/20` weight rather than a mark's full strength.
		-->
		<polygon points={HEXAGON} class="fill-none stroke-muted-foreground/20" stroke-width="4" />
		<!--
			SVG's own attribute spelling: the presentation attributes go kebab
			(`stroke-width`, `stroke-dasharray`, `stroke-linecap`) and `pathLength` stays camelCase
			because that is what the SVG specification calls it. `path-length` would compile and render
			and do nothing at all.
		-->
		<polygon
			class="segment fill-none stroke-foreground"
			points={HEXAGON}
			stroke-width="4"
			stroke-linecap="round"
			pathLength="1"
			stroke-dasharray="1"
		/>
	</svg>
</div>

<style>
	@keyframes loader-hexagon-spinner-chase {
		from {
			stroke-dashoffset: 1;
		}
		to {
			stroke-dashoffset: -1;
		}
	}

	.segment {
		/* The rest state: three quarters of the outline lit, i.e. the frame this loader would be
		   caught on part-way round. `0` would close the hexagon and read as something finished; `1`
		   would leave an empty box with only the quiet outline in it. */
		stroke-dashoffset: 0.25;

		animation: loader-hexagon-spinner-chase 2s linear infinite;
	}
</style>
