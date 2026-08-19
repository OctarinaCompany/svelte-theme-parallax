<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Four tiles in a two-by-two block, each rounding into a disc and shrinking a little, one just
	 * behind the next.
	 *
	 * THE INDEXED-STAGGER ARCHETYPE, the same shape as `loader-classic-spinner.svelte`: the index
	 * travels into CSS as `--index` and the delay arithmetic happens in `calc()` beside the keyframes
	 * it belongs to, so the markup carries no magic numbers.
	 *
	 * THE DELAY IS SHIFTED BACK ONE WHOLE CYCLE. `delay: i * 0.1`
	 * written as a positive `animation-delay` would hold each tile at its
	 * start value for up to 300ms, so the block would visibly wind up on mount. Subtracting one full
	 * duration makes every delay negative, and a negative delay seeks the animation backwards: on the
	 * first painted frame all four tiles are already where the steady state would have them.
	 * Subtracted, not negated — negating would put tile i ahead instead of behind, and
	 * the ripple would run the other way across the block.
	 *
	 * THE REST STATE IS COMPUTED, NOT GUESSED. Because the delay is negative, each tile's phase on
	 * that first frame is a real number this file can evaluate, so `rest` below is the keyframe
	 * triangle sampled at exactly that phase. The frozen frame under `prefers-reduced-motion` is
	 * therefore the picture the loader would really be showing — four tiles caught at four slightly
	 * different points of the same morph — rather than four identical squares. The constants 10, 50,
	 * 1 and 0.8 are spelled again in the `@keyframes` block; nothing will tell you
	 * if the two copies drift.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const DURATION_S = 1.5;
	const STAGGER_S = 0.1;

	const tiles = Array.from({ length: 4 }, (_, index) => {
		// With `animation-delay: i * STAGGER_S - DURATION_S`, this is where in the cycle the tile
		// already is on the first painted frame.
		const phase = ((DURATION_S - index * STAGGER_S) % DURATION_S) / DURATION_S;
		// Both ramps run out-and-back over the cycle, so one triangle wave drives both:
		// `border-radius` 10% → 50% → 10% and `scale` 1 → 0.8 → 1.
		const wave = phase < 0.5 ? phase / 0.5 : (1 - phase) / 0.5;

		return {
			index,
			radius: Math.round((10 + 40 * wave) * 100) / 100,
			scale: Math.round((1 - 0.2 * wave) * 1000) / 1000,
		};
	});
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="shape-shift-grid"
	{role}
	aria-label={ariaLabel}
	class={cn("grid size-8 grid-cols-2 gap-1", className)}
>
	{#each tiles as tile (tile.index)}
		<!-- The tiles are the single token `bg-foreground`, which carries both themes. -->
		<span
			class="tile size-full bg-foreground"
			style:--index={tile.index}
			style:--rest-radius="{tile.radius}%"
			style:--rest-scale={tile.scale}
		></span>
	{/each}
</div>

<style>
	/* `border-radius` runs 10% → 50% → 10% as `scale` runs 1 → 0.8 → 1, three values each so
	   three equal intervals, merged onto the same stops. An out-and-back starts and ends on the same
	   value, so the loop point is seamless and there is no snap to keep. The 10/50/1/0.8 here are the
	   same four constants the script samples for the rest state. */
	@keyframes loader-shape-shift-grid-morph {
		0%,
		100% {
			border-radius: 10%;
			transform: scale(1);
		}
		50% {
			border-radius: 50%;
			transform: scale(0.8);
		}
	}

	.tile {
		--duration: 1.5s;
		--stagger: 0.1s; /* the stagger `delay: i * 0.1` */

		/* The rest state, and the only thing visible under reduced motion: this tile's own frame of
		   the morph, computed in the script from the same phase the negative delay produces. */
		border-radius: var(--rest-radius);
		transform: scale(var(--rest-scale));

		/* `ease-in-out` is the CSS keyword, not Tailwind's `--ease-in-out`. */
		animation: loader-shape-shift-grid-morph var(--duration) ease-in-out infinite;
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
