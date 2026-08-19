<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Four tall bars hinged at the bottom, sweeping side to side like reeds in a current.
	 *
	 * Decisions worth naming:
	 * - The bars are one semantic token, `bg-foreground`, which carries both themes on its own.
	 * - `space-x-1` becomes `flex` + `gap-1`, per `docs/CONVENTIONS.md`.
	 * - An unshifted delay winds up: a positive `animation-delay` would hold every bar bolt upright
	 *   until it elapses, so the row would visibly start leaning over on mount. Every delay is shifted
	 *   back one whole cycle instead — same phase order, so the lean still travels left to right.
	 *
	 * ONE `transform`, NOT TWO ANIMATIONS. The lean and the squash are conceptually separate
	 * motions; CSS has a single `transform` property, so the two merge into one function list
	 * per keyframe stop. Running them as two animations would let them desynchronise, and the second
	 * would simply overwrite the first.
	 *
	 * THE ORDER OF THOSE TWO FUNCTIONS IS A REAL DECISION, and it is not free: a
	 * CSS function list composes right to left. `rotate(…) scaleY(…)` shortens the bar along its own
	 * axis first and then leans the shortened bar, so its `rounded-full` caps stay circular and the
	 * lean is exactly the ±15° the keyframes name. The other order squashes an already-leaning bar
	 * against the row's vertical axis, which shears the caps into ellipses and drags the apparent lean
	 * a few degrees past 15°. Both are defensible readings of the same two numbers; this one keeps the
	 * bar a bar.
	 *
	 * The bars are free to lean out past the root's box — nothing in this folder clips its loader, by
	 * design (`src/app.css` puts the `content-visibility` gate on the gallery tile, not on the
	 * loader, precisely so a port may overflow).
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const bars = Array.from({ length: 4 }, (_, index) => index);
</script>

<!-- `w-fit` because a bare block `<div>` stretches to its container and would leave the row of bars
     pinned to the left of whatever it is dropped into; the height comes from the bars themselves. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="fluid-bars"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit gap-1", className)}
>
	{#each bars as index (index)}
		<span class="bar h-8 w-1.5 origin-bottom rounded-full bg-foreground" style:--index={index}
		></span>
	{/each}
</div>

<style>
	/* `rotate` runs -15° → 15° → -15° as `scaleY` runs 0.8 → 1 → 0.8, both over three equal
	   intervals — evenly spaced stops, and both ramps
	   start and end on the same value, which is why 0% and 100% share a selector. */
	@keyframes loader-fluid-bars-sway {
		0%,
		100% {
			transform: rotate(-15deg) scaleY(0.8);
		}
		50% {
			transform: rotate(15deg) scaleY(1);
		}
	}

	.bar {
		--duration: 1.5s;
		--stagger: 0.1s; /* the stagger `delay: i * 0.1` */

		/* The rest state: both keyframe ramps evaluated at each bar's phase on the first painted
		   frame. With the whole cycle subtracted below that phase is `1 - i * 0.1 / 1.5`, which never
		   passes the peak, so both ramps come out exactly linear — the row freezes as a fan leaning
		   -15°, -11°, -7°, -3° rather than four identical bars. The endpoints are the keyframe's. */
		transform: rotate(calc(-15deg + var(--index) * 4deg)) scaleY(calc(0.8 + var(--index) * 0.0267));

		animation: loader-fluid-bars-sway var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
