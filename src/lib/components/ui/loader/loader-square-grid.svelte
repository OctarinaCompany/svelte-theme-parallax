<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Four tiles in a two-by-two grid, shrinking and fading one after another.
	 *
	 * The archetype of this folder, so it is written the archetype's way
	 * (`loader-classic-spinner.svelte`): the index travels into CSS as `--index` and does both the
	 * stagger and the frozen ramp in `calc()`, leaving no magic numbers in the markup.
	 *
	 * THE DELAY IS SHIFTED BACK ONE WHOLE CYCLE. `delay: i * 0.2`
	 * against a 1.5s duration, minus 1.5s, so every tile's delay is negative and the grid is already
	 * in its steady state on the first painted frame instead of winding up tile by tile. Subtracted,
	 * not negated: negating would put tile i ahead instead of behind and run the wave
	 * backwards across the grid.
	 *
	 * `w-fit` ON THE ROOT. A bare `grid grid-cols-2 gap-1.5` with no width
	 * would be harmless in a centred demo and is not here: a block-level root stretches to its
	 * container, and a 38px grid pinned to the left of a wide tile looks like a layout bug.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const tiles = Array.from({ length: 4 }, (_, index) => index);
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="square-grid"
	{role}
	aria-label={ariaLabel}
	class={cn("grid w-fit grid-cols-2 gap-1.5", className)}
>
	{#each tiles as index (index)}
		<!-- `bg-zinc-800 dark:bg-white` → `bg-foreground`: four marks, no track. -->
		<span class="tile size-4 rounded-sm bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	@keyframes loader-square-grid-shrink {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(0.5);
			opacity: 0.3;
		}
	}

	.tile {
		--duration: 1.5s;
		--stagger: 0.2s; /* the stagger `delay: i * 0.2` */

		/* The rest state: a static ramp down the four tiles, which is very nearly the frame this grid
		   would really be caught on. With the delays below, tile i sits at phase 0, 0.87, 0.73, 0.60
		   of the cycle on the first painted frame — all on the returning leg — so its true scale runs
		   1, 0.93, 0.73, 0.54 and its opacity 1, 0.90, 0.62, 0.36. Both are close enough to straight
		   lines to be said in `calc()` rather than computed per tile in the `{#each}`, the same trade
		   `loader-classic-spinner.svelte` makes. While the animation runs neither value shows: the
		   keyframes above declare both at each end of the cycle. */
		transform: scale(calc(1 - var(--index) * 0.15));
		opacity: calc(1 - var(--index) * 0.2);

		animation: loader-square-grid-shrink var(--duration) ease-in-out infinite;
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
