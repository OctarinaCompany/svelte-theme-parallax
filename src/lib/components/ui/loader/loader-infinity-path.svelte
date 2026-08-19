<script module lang="ts">
	/**
	 * The lemniscate both strokes trace. Written once here because it is drawn on
	 * two elements, and two copies of a curve are two chances for the track and the mark to
	 * disagree.
	 */
	const INFINITY_PATH =
		"M 15 15 C 15 5, 25 5, 30 15 C 35 25, 45 25, 45 15 C 45 5, 35 5, 30 15 C 25 25, 15 25, 15 15";
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A dash chasing itself around a figure of eight.
	 *
	 * One of the stroke-dash family; the idiom is `loader-arc-tracer.svelte`, and the two decisions it
	 * records apply unchanged here — `stroke-dashoffset` is a real CSS property that animates in a
	 * keyframe exactly as Motion animates it, and no `vector-effect="non-scaling-stroke"` is added.
	 *
	 * `pathLength="1"` IS DELIBERATE. A hand-rounded `stroke-dasharray="100"`
	 * for a curve whose real length nobody measured only happens
	 * to look right at this one viewBox. `pathLength` tells the
	 * browser to treat the path as one unit long whatever its geometry, so `stroke-dasharray="1"` is
	 * exactly one lap and the offsets below are fractions of a lap rather than user units. Redraw the
	 * curve and this loader still works.
	 *
	 * Other divergences, all deliberate:
	 * - `stroke-zinc-200 dark:stroke-zinc-800` on the under-path is a track rather than a mark, so it
	 *   takes the `/20` weight — the same weight `ui/circular-progress`'s track uses. The moving
	 *   stroke is `stroke-zinc-800 dark:stroke-white`, the primary mark, so it is `stroke-foreground`.
	 *
	 * SVG ATTRIBUTES KEEP THEIR SVG SPELLING: `stroke-width` and `stroke-linecap` are
	 * presentation attributes and go kebab, while `pathLength` and `viewBox` stay camelCase because
	 * that is what the SVG specification calls them. `path-length` would compile and silently do
	 * nothing.
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
	data-loader="infinity-path"
	{role}
	aria-label={ariaLabel}
	class={cn("h-6 w-12", className)}
>
	<svg class="size-full overflow-visible" viewBox="0 0 60 30" aria-hidden="true">
		<path
			class="fill-none stroke-muted-foreground/20"
			d={INFINITY_PATH}
			stroke-width="4"
			stroke-linecap="round"
		/>
		<path
			class="trace fill-none stroke-foreground"
			d={INFINITY_PATH}
			stroke-width="4"
			stroke-linecap="round"
			pathLength="1"
			stroke-dasharray="1"
		/>
	</svg>
</div>

<style>
	/* The trace, expressed against `pathLength="1"`: one lap of
	   offset in, one lap out, linearly. The dash and the gap are both one lap, so the pattern repeats
	   every two laps of offset — and 1 to −1 is exactly two — which means the snap back at the end of
	   each cycle paints the identical picture and cannot be seen. */
	@keyframes loader-infinity-path-trace {
		from {
			stroke-dashoffset: 1;
		}
		to {
			stroke-dashoffset: -1;
		}
	}

	.trace {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on): three quarters of a lap laid down, the
		   frame this loader would be caught on part-way through a pass. `0` would leave the whole
		   figure inked, which reads as a finished thing rather than a waiting one, and `1` would
		   leave the bare track. Never seen while the animation runs, because the keyframes declare
		   `stroke-dashoffset` at both ends. */
		stroke-dashoffset: 0.25;

		animation: loader-infinity-path-trace 2s linear infinite;
	}
</style>
