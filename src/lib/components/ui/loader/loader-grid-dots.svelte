<script module lang="ts">
	/**
	 * The cycle length: `duration: 1.5`.
	 *
	 * These three constants are also spelled as literals in the `@keyframes` block below, because a
	 * `<script module>` const cannot reach a CSS rule. They are two spellings of one fact and nothing
	 * will report it if they drift, so both sites carry a note.
	 */
	const DURATION_S = 1.5;
	/** The bottom of the `scale` dip, 1 → 0.5 → 1. */
	const SCALE_LOW = 0.5;
	/** The bottom of the `opacity` dip, 1 → 0.3 → 1. */
	const OPACITY_LOW = 0.3;

	const dots = Array.from({ length: 9 }, (_, index) => {
		// The stagger: `delay: (i % 3) * 0.2 + Math.floor(i / 3) * 0.2`. That is
		// column + row, so the dip sweeps the grid diagonally from the top-left cell to the
		// bottom-right one rather than reading left-to-right. Not `i * k`, so it is computed here
		// and handed to CSS finished; the largest value is 0.8s, comfortably inside one cycle.
		const delay = (index % 3) * 0.2 + Math.floor(index / 3) * 0.2;

		// The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		// animation but does not choose what it stops on). The block below shifts every dot back one
		// whole cycle, so this dot's phase on the first painted frame is `((-delay) mod D) / D`;
		// evaluating the keyframe triangle there freezes the grid on a real frame of its own
		// animation — a diagonal ramp of sizes — instead of nine identical full-size dots.
		const phase = ((DURATION_S - delay) % DURATION_S) / DURATION_S;
		const dip = 1 - 2 * Math.abs(phase - 0.5);

		return {
			index,
			delay: Number(delay.toFixed(3)),
			scale: Number((1 - (1 - SCALE_LOW) * dip).toFixed(3)),
			opacity: Number((1 - (1 - OPACITY_LOW) * dip).toFixed(3)),
		};
	});
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A three-by-three grid of dots that shrink and fade in a diagonal wave.
	 *
	 * Decisions worth naming:
	 * - The dots are one semantic token, `bg-foreground` — it carries both
	 *   themes on its own, and `ui/skeleton` / `ui/spinner` set the same precedent for a loader's ink.
	 * - An unshifted `delay` winds up: a positive `animation-delay` parks an element on its base value
	 *   until it elapses, so the bottom-right dot would sit at full size for 800ms and the grid would
	 *   visibly start up on mount. Shifting every delay back one whole cycle keeps the phase ORDER —
	 *   which is the direction the wave travels — and starts the grid mid-motion.
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
	data-loader="grid-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("grid w-fit grid-cols-3 gap-1.5", className)}
>
	{#each dots as dot (dot.index)}
		<span
			class="dot size-2.5 rounded-full bg-foreground"
			style:--delay="{dot.delay}s"
			style:--rest-scale={dot.scale}
			style:--rest-opacity={dot.opacity}
		></span>
	{/each}
</div>

<style>
	/* The 1 → low → 1 dip. The two low values are `SCALE_LOW` / `OPACITY_LOW` in the module block,
	   which evaluates this same curve to pick each dot's rest frame; change one, change both. */
	@keyframes loader-grid-dots-pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.3;
			transform: scale(0.5);
		}
	}

	.dot {
		--duration: 1.5s;

		/* The rest frame, computed per dot in the module block. Never seen while the animation runs,
		   because the keyframes declare both properties at 0% and at 100%. */
		opacity: var(--rest-opacity);
		transform: scale(var(--rest-scale));

		animation: loader-grid-dots-pulse var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--delay) - var(--duration));
	}
</style>
