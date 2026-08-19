<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * An ECG trace drawing itself across the box and then rubbing itself out.
	 *
	 * One of the stroke-dash family; the idiom is `loader-arc-tracer.svelte`, and the two decisions it
	 * records apply unchanged here — `stroke-dashoffset` is a real CSS property that animates in a
	 * keyframe exactly as Motion animates it, and no `vector-effect="non-scaling-stroke"` is added.
	 *
	 * `pathLength="1"` IS DELIBERATE. A hand-rounded `stroke-dasharray="100"`
	 * for a polyline whose five segments actually measure about 94 user units
	 * only happens to look right at this one viewBox — the dash overshoots
	 * the trace by 6%, so the offsets do not land where they read as landing. `pathLength` tells the
	 * browser to treat
	 * the polyline as one unit long whatever its geometry, so `stroke-dasharray="1"` is exactly one
	 * trace and the offsets below are fractions of it. Move a vertex and this loader still works.
	 *
	 * Other divergences, both deliberate:
	 * - `stroke-zinc-800 dark:stroke-white` is the primary mark, so it is `stroke-foreground`; the
	 *   light-mode shade picks the token and the `dark:` half is dropped.
	 *
	 * There is no unlit track under this one, deliberately: an ECG that shows you
	 * where the beat is going to be is not an ECG.
	 *
	 * SVG ATTRIBUTES KEEP THEIR SVG SPELLING: `stroke-width`, `stroke-linejoin` and
	 * `stroke-linecap` are presentation attributes and go kebab, while `pathLength` and `viewBox` stay
	 * camelCase because that is what the SVG specification calls them. `path-length` would compile and
	 * silently do nothing.
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
	data-loader="heartbeat"
	{role}
	aria-label={ariaLabel}
	class={cn("h-8 w-16", className)}
>
	<!-- `overflow-visible` is load-bearing: an `<svg>` clips
	     to its viewport by default, and the polyline starts at x=0 and ends at x=64, which are the
	     two edges of the 0-64 viewBox. A round cap on a 2-unit stroke reaches half a stroke width
	     past its vertex, so both ends of the trace sit 1 unit outside the viewport and would be
	     sliced flat without this. The interior vertices (y=4 and y=28) are comfortably inside the
	     0-32 range and are not what needs the escape. -->
	<svg class="size-full overflow-visible" viewBox="0 0 64 32" aria-hidden="true">
		<polyline
			class="trace fill-none stroke-foreground"
			points="0,16 16,16 24,4 32,28 40,16 64,16"
			stroke-width="2"
			stroke-linejoin="round"
			stroke-linecap="round"
			pathLength="1"
			stroke-dasharray="1"
		/>
	</svg>
</div>

<style>
	/* The draw, expressed against `pathLength="1"`: one trace of
	   offset in, one out, linearly. The dash and the gap are both one trace long, so the pattern
	   repeats every two traces of offset — and 1 to −1 is exactly two — which means the snap back at
	   the end of each cycle paints the identical picture and cannot be seen. A positive offset hides
	   the line behind the gap from the right, a negative one from the left, which is what makes the
	   trace appear to be drawn and then erased in the same direction. */
	@keyframes loader-heartbeat-trace {
		from {
			stroke-dashoffset: 1;
		}
		to {
			stroke-dashoffset: -1;
		}
	}

	.trace {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on): three quarters of the trace laid down, so
		   the frozen frame includes the spike and still reads as a line being drawn. `0` would leave
		   a complete trace, which reads as a finished thing rather than a waiting one, and `1` would
		   leave an empty box. Never seen while the animation runs, because the keyframes declare
		   `stroke-dashoffset` at both ends. */
		stroke-dashoffset: 0.25;

		animation: loader-heartbeat-trace 2s linear infinite;
	}
</style>
