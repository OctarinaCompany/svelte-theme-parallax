<script module lang="ts">
	/**
	 * The cycle length: `duration: 1.5`.
	 *
	 * These two constants are also spelled as literals in the `@keyframes` block below, because a
	 * `<script module>` const cannot reach a CSS rule. They are two spellings of one fact and nothing
	 * will report it if they drift, so both sites carry a note.
	 */
	const DURATION_S = 1.5;
	/** The bottom of the `scale` dip, 1 → 0.4 → 1. */
	const SCALE_LOW = 0.4;

	const dots = Array.from({ length: 9 }, (_, index) => {
		// The stagger: `delay: (Math.floor(i / 3) + (i % 3)) * 0.15`. That is
		// row + column, so the dip sweeps the grid diagonally from the top-left cell to the
		// bottom-right one rather than reading left-to-right. Not `i * k`, so it is computed here and
		// handed to CSS finished; the largest value is 0.6s, comfortably inside one cycle.
		const delay = (Math.floor(index / 3) + (index % 3)) * 0.15;

		// The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		// animation but does not choose what it stops on). The block below shifts every dot back one
		// whole cycle, so this dot's phase on the first painted frame is `((-delay) mod D) / D`;
		// evaluating the keyframe triangle there freezes the grid on a real frame of its own
		// animation — a diagonal ramp from a full-size dot to a half-size one — instead of nine
		// identical dots.
		const phase = ((DURATION_S - delay) % DURATION_S) / DURATION_S;
		const dip = 1 - 2 * Math.abs(phase - 0.5);

		return {
			index,
			delay: Number(delay.toFixed(3)),
			scale: Number((1 - (1 - SCALE_LOW) * dip).toFixed(3)),
		};
	});
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A three-by-three grid of dots that shrink and swell in a diagonal wave.
	 *
	 * THE NAME SAYS SPRING; THE CURVE DOES NOT. This file
	 * uses plain `ease-in-out`. `var(--ease-loader-spring)` is
	 * reserved for the four loaders that really do want a spring, and using it here would
	 * add an overshoot this design never draws.
	 *
	 * Otherwise the sibling of `loader-grid-dots.svelte`, which is the same nine-cell diagonal wave
	 * with a different stagger and an opacity ramp on top. Decisions worth naming:
	 * - `bg-zinc-800 dark:bg-white` is one semantic token, `bg-foreground`.
	 * - The delay is shifted back one whole cycle, so the grid starts mid-motion instead of winding
	 *   up over its first 600ms. Shifted, not negated: the phase ORDER is the direction the wave
	 *   travels.
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
	data-loader="spring-dot-matrix"
	{role}
	aria-label={ariaLabel}
	class={cn("grid w-fit grid-cols-3 gap-2.5", className)}
>
	{#each dots as dot (dot.index)}
		<span
			class="dot size-2 rounded-full bg-foreground"
			style:--delay="{dot.delay}s"
			style:--rest-scale={dot.scale}
		></span>
	{/each}
</div>

<style>
	/* The 1 → 0.4 → 1 dip. The low value is `SCALE_LOW` in the module block, which evaluates this
	   same curve to pick each dot's rest frame; change one, change both. */
	@keyframes loader-spring-dot-matrix-pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(0.4);
		}
	}

	.dot {
		--duration: 1.5s;

		/* The rest frame, computed per dot in the module block. Never seen while the animation runs,
		   because the keyframes declare `transform` at both 0% and 100%. */
		transform: scale(var(--rest-scale));

		animation: loader-spring-dot-matrix-pulse var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--delay) - var(--duration));
	}
</style>
