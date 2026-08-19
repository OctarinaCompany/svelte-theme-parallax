<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * An arc that draws itself around a quiet ring and then erases itself.
	 *
	 * THE REFERENCE FOR THE NINE STROKE-DASH LOADERS (`app-icon-load`, `arc-tracer`, `dash-ring`,
	 * `fade-arc`, `heartbeat`, `hexagon-spinner`, `infinity-path`, `minimal-triangle`, `smooth-ring`).
	 * `stroke-dashoffset` is a real CSS property, so the draw is a plain keyframe with nothing
	 * lost.
	 *
	 * `pathLength="1"` IS DELIBERATE. A hand-rounded `stroke-dasharray="125"`
	 * for a circle whose real circumference is 2π·20 = 125.66 would be
	 * half a percent short, and the ring would never quite close at the top of the cycle. `pathLength`
	 * tells the browser to treat the path as being one unit long whatever its geometry, so
	 * `stroke-dasharray="1"` is exactly one circumference and the offsets below are fractions rather
	 * than hand-computed user units. Change the radius and this loader still works.
	 *
	 * NO `vector-effect="non-scaling-stroke"`, and none should be added. `ui/circular-progress` hit
	 * this first and records it in `circular-progress-range.svelte:25-30`: the effect is applied in
	 * screen space, so at any effective scale other than 1 — OS display scaling, browser zoom — a
	 * dash pattern measured in user units stops covering the on-screen path, repeats, and paints a
	 * phantom second arc. Dash maths needs user-space stroking.
	 *
	 * SVG ATTRIBUTES KEEP THEIR SVG SPELLING. The presentation attributes are kebab
	 * (`stroke-width`, `stroke-dasharray`, `stroke-linecap`); `pathLength` and `viewBox` are camelCase
	 * because that is what the SVG specification calls them.
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
	data-loader="arc-tracer"
	{role}
	aria-label={ariaLabel}
	class={cn("size-10", className)}
>
	<svg class="size-full" viewBox="0 0 50 50" aria-hidden="true">
		<!--
			The unlit ring the arc is traced over: a track rather than a mark, so it takes the `/20`
			weight. The same weight `ui/circular-progress`'s track uses, deliberately.
		-->
		<circle cx="25" cy="25" r="20" class="fill-none stroke-muted-foreground/20" stroke-width="4" />
		<circle
			class="arc fill-none stroke-foreground"
			cx="25"
			cy="25"
			r="20"
			stroke-width="4"
			stroke-linecap="round"
			pathLength="1"
			stroke-dasharray="1"
		/>
	</svg>
</div>

<style>
	/* The draw, over three equal intervals and expressed against
	   `pathLength="1"`: a full circumference of offset in, none, a full circumference out. The dash
	   and the gap are both one circumference, so a positive offset hides the path behind the gap on
	   one side and a negative one hides it on the other — which is what makes the arc appear to be
	   drawn from one end and then rubbed out from the same end. */
	@keyframes loader-arc-tracer-trace {
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

	.arc {
		/* The rest state: three quarters of the ring drawn, i.e. the frame this loader would be
		   caught on part-way through a trace. `0` would leave a closed ring, which reads as a
		   finished thing rather than a waiting one, and `1` would leave an empty box. */
		stroke-dashoffset: 0.25;

		/* `ease-in-out` is exactly CSS's keyword —
		   cubic-bezier(0.42, 0, 0.58, 1) — and not Tailwind's `--ease-in-out`. */
		animation: loader-arc-tracer-trace 2s ease-in-out infinite;
	}
</style>
