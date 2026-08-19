<script module lang="ts">
	/**
	 * The cycle and stagger: `duration: 1.5` and `delay: i * 0.15`.
	 *
	 * Both are spelled again as literals in the `@keyframes` and `.dot` rules below, because a
	 * `<script module>` const cannot reach a CSS rule. They are two spellings of one fact and nothing
	 * will report it if they drift, so both sites carry a note.
	 */
	const DURATION_S = 1.5;
	const STAGGER_S = 0.15;
	/** The bottom of the `scale` dip, 1 → 0.5 → 1. */
	const SCALE_LOW = 0.5;
	/** The bottom of the `opacity` dip, 1 → 0.3 → 1. */
	const OPACITY_LOW = 0.3;

	const dots = Array.from({ length: 8 }, (_, index) => {
		// The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		// animation but does not choose what it stops on). The block below shifts every dot back one
		// whole cycle, so dot i's phase on the first painted frame is `((-delay) mod D) / D`;
		// evaluating the keyframe triangle there freezes the ring on a real frame of its own
		// animation — a band of small faint dots trailing round from the top — instead of eight
		// identical full-size dots, which would read as a decorative ring of beads rather than as
		// something in progress.
		const phase = ((DURATION_S - index * STAGGER_S) % DURATION_S) / DURATION_S;
		const dip = 1 - 2 * Math.abs(phase - 0.5);

		return {
			index,
			scale: Number((1 - (1 - SCALE_LOW) * dip).toFixed(3)),
			opacity: Number((1 - (1 - OPACITY_LOW) * dip).toFixed(3)),
		};
	});
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Eight dots on a circle, each shrinking and fading in turn so a dip chases its way round.
	 *
	 * THE ROTATION AND THE SCALE ARE TWO DIFFERENT CSS PROPERTIES HERE, and that is deliberate.
	 * CSS has a single `transform` property, so an animation of `transform: scale()` would overwrite
	 * a static `transform: rotate()` outright and all eight dots would pile up at the top. The
	 * individual `rotate` property holds the angle instead — and the order the two apply in cannot
	 * matter, because a UNIFORM scale commutes with a rotation about the same origin, and both are
	 * taken about the shared `origin-[4px_24px]`.
	 *
	 * Decisions worth naming:
	 * - The dots are one semantic token, `bg-foreground`, legible in both themes.
	 * - An unshifted `delay` winds up: a positive `animation-delay` parks an element on its base value
	 *   until it elapses, so the last dot would sit at full size for 1.05s and the ring would visibly
	 *   start on mount. Shifting every delay back one whole cycle keeps the phase ORDER — which is
	 *   the direction the dip travels round the ring — and starts it mid-motion.
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
	data-loader="dots-ring"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-12", className)}
>
	{#each dots as dot (dot.index)}
		<!--
			`origin-[4px_24px]` has no utility of its own and needs none: 4px is the dot's own
			half-width and 24px is the centre of the 48px box, so all eight dots pivot around one
			point. `-ml-1` pulls the dot back by that same half-width so `left-1/2` centres it.
		-->
		<span
			class="dot absolute top-0 left-1/2 -ml-1 size-2 origin-[4px_24px] rounded-full bg-foreground"
			style:--index={dot.index}
			style:--rest-scale={dot.scale}
			style:--rest-opacity={dot.opacity}
		></span>
	{/each}
</div>

<style>
	/* The 1 → low → 1 dip. The two low values are `SCALE_LOW` / `OPACITY_LOW` in the module block,
	   which evaluates this same curve to pick each dot's rest frame; change one, change both.
	   Inside a `<style>` block the bare `ease-in-out` keyword is CSS's own, not Tailwind's. */
	@keyframes loader-dots-ring-pulse {
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
		/* The stagger `delay: i * 0.15`, derived from `--duration` rather than written as `0.15s` so
		   the two cannot drift apart. The whole cycle subtracted below is what removes the
		   wind-up. */
		--stagger: calc(var(--duration) / 10);

		/* Each dot's angle, as the individual `rotate` property so that the animation's `transform`
		   cannot clobber it. */
		rotate: calc(var(--index) * 45deg);

		/* The rest frame, computed per dot in the module block. Never seen while the animation runs,
		   because the keyframes declare both properties at 0% and at 100%. */
		opacity: var(--rest-opacity);
		transform: scale(var(--rest-scale));

		animation: loader-dots-ring-pulse var(--duration) ease-in-out infinite;
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
