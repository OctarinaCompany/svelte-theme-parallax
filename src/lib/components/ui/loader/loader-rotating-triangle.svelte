<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * An outlined triangle turning at a constant rate.
	 *
	 * Decisions worth naming:
	 * - `stroke-zinc-800 dark:stroke-white` is one semantic token, `stroke-foreground`: the light-mode
	 *   shade picks the token and the `dark:` half is dropped, because `--foreground` already carries
	 *   both themes.
	 * - The `<svg>` is wrapped in a `<div>` rather than promoted to the root, so every loader in this
	 *   folder has the same root element, the same `bind:this` type and the same place for the a11y
	 *   attributes.
	 *
	 * `overflow-visible` sits on the `<svg>`, and
	 * it is load-bearing: an `<svg>` clips to its viewport by default, and a 4-unit stroke on a
	 * triangle that reaches y=40 in a 50-unit box crosses the edge at most angles of the turn. The
	 * wrapping `<div>` needs no such class — a block box does not clip.
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
	data-loader="rotating-triangle"
	{role}
	aria-label={ariaLabel}
	class={cn("size-10", className)}
>
	<svg class="size-full overflow-visible" viewBox="0 0 50 50" aria-hidden="true">
		<polygon
			class="triangle fill-none stroke-foreground"
			points="25,5 45,40 5,40"
			stroke-width="4"
			stroke-linejoin="round"
		/>
	</svg>
</div>

<style>
	/* One full turn from 0° across the whole duration. The animation loops, and a
	   full turn ends where it started, so the loop point is invisible. */
	@keyframes loader-rotating-triangle-turn {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.triangle {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on). A triangle has a real resting pose — the
		   one it is drawn in — and freezing it at some arbitrary tilt would read as a broken layout
		   rather than as a paused loader. Never seen while the animation runs, because the keyframes
		   declare `transform` at both ends. */
		transform: rotate(0deg);

		/* Stated rather than left to `origin-center`, because the reference box for an SVG child is
		   `transform-box: view-box`: the centre being read is the viewBox's, not the element's own
		   bounding box. Those differ here — the triangle's box is 40×35 and sits low in the 50×50
		   viewport — so the choice decides whether the shape spins about the frame or wobbles about
		   its own centroid. `center` here means the frame's. */
		transform-origin: center;

		animation: loader-rotating-triangle-turn 2s linear infinite;
	}
</style>
