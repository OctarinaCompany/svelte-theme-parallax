<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * An app-icon tile with a progress ring drawing itself inside it.
	 *
	 * ONE OF THE NINE STROKE-DASH LOADERS, and it follows `loader-arc-tracer.svelte` exactly:
	 * `stroke-dashoffset` is a real CSS property, so the draw is a plain keyframe with nothing
	 * lost.
	 *
	 * `pathLength="1"` IS DELIBERATE. A hand-rounded `stroke-dasharray="125"`
	 * for a circle whose real circumference is 2π·20 = 125.66 would be
	 * half a percent short, and the ring would never quite close. `pathLength` tells the browser to treat
	 * the path as one unit long whatever its geometry, so `stroke-dasharray="1"` is exactly one
	 * circumference and the offsets below are fractions rather than hand-computed user units. No
	 * `vector-effect="non-scaling-stroke"` either — `ui/circular-progress` records why in
	 * `circular-progress-range.svelte:25-30`: dash maths needs user-space stroking.
	 *
	 * NOT AN INVERTED CHIP. The tile is `bg-zinc-200 dark:bg-zinc-800` — light
	 * in the light theme, dark in the dark one — so it is an ordinary quiet panel and takes `bg-muted`
	 * rather than the always-dark `bg-foreground` pairing. Everything on it keeps the page-ground
	 * family.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<!--
	`rounded-[12px]` is written as `rounded-xl`, which is exactly 0.75rem — the same twelve pixels, on
	the scale instead of beside it. `overflow-hidden` clips anything the ring puts
	past the tile's rounded corners.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="app-icon-load"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"relative flex size-12 items-center justify-center overflow-hidden rounded-xl bg-muted",
		className,
	)}
>
	<svg class="absolute size-8" viewBox="0 0 50 50" aria-hidden="true">
		<!--
			The unlit ring the arc is drawn over: a track rather than a mark, so it takes the `/20`
			weight — the same one `ui/circular-progress` gives its own track.
		-->
		<circle cx="25" cy="25" r="20" class="fill-none stroke-muted-foreground/20" stroke-width="4" />
		<!--
			SVG attribute spelling: the presentation attributes go kebab
			(`stroke-width`, `stroke-dasharray`), and `pathLength` and `viewBox` stay camelCase because
			that is what the SVG specification calls them. `path-length` would compile, render, and
			silently do nothing.
		-->
		<circle
			class="arc fill-none stroke-foreground"
			cx="25"
			cy="25"
			r="20"
			stroke-width="4"
			pathLength="1"
			stroke-dasharray="1"
		/>
	</svg>
</div>

<style>
	/* The draw, expressed against
	   `pathLength="1"`: a full circumference of offset — nothing drawn — down to none, the ring
	   closed. Two values, so `from`/`to`, and `repeat: Infinity` loops rather than alternating: the
	   completed ring snaps back to empty and fills again, which is what a download progress ring does
	   and not a ping-pong. */
	@keyframes loader-app-icon-load-fill {
		from {
			stroke-dashoffset: 1;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	.arc {
		/* A static quarter-turn back,
		   which starts the fill at twelve o'clock instead of three. `transform-origin` is stated
		   because an SVG element's reference box is `transform-box: view-box`, so the `origin-*`
		   utilities do not mean here what they mean on a `<div>`. This transform is static; the
		   animation below touches only the dash offset, so the two never fight. */
		transform: rotate(-90deg);
		transform-origin: center;

		/* The rest state: three quarters of the ring drawn, i.e. the frame this loader would be caught
		   on part-way through a fill. `0` would leave a closed ring, which reads as a finished
		   download rather than a running one, and `1` would leave an empty tile. */
		stroke-dashoffset: 0.25;

		/* `ease-in-out` is exactly CSS's keyword —
		   cubic-bezier(0.42, 0, 0.58, 1) — and not Tailwind's `--ease-in-out`. */
		animation: loader-app-icon-load-fill 2s ease-in-out infinite;
	}
</style>
