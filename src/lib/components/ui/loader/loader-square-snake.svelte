<script module lang="ts">
	/**
	 * The cycle and the bottom of the `opacity: [0.1, 1, 0.1]` dip: `duration: 1.5`.
	 *
	 * Both are spelled again as literals in the `@keyframes` and `.cell` rules below, because a
	 * `<script module>` const cannot reach a CSS rule. They are two spellings of one fact and nothing
	 * will report it if they drift, so both sites carry a note.
	 */
	const DURATION_S = 1.5;
	const OPACITY_LOW = 0.1;

	/**
	 * The grid, as a coordinate array of `[column, row]` pairs.
	 *
	 * It is written out rather than derived from the index because the delay is a function of the
	 * COORDINATES — `(x + y) * 0.15` — which is what makes the bright band sweep the grid diagonally
	 * from the top-left cell to the bottom-right one instead of reading along the rows. Nine cells
	 * with five distinct sums.
	 */
	const positions: Array<[number, number]> = [
		[0, 0],
		[1, 0],
		[2, 0],
		[0, 1],
		[1, 1],
		[2, 1],
		[0, 2],
		[1, 2],
		[2, 2],
	];

	const cells = positions.map(([x, y], index) => {
		// Not `i * k`, so the arithmetic stays here and CSS receives a finished value. The largest is
		// 0.6s, comfortably inside one cycle.
		const delay = (x + y) * 0.15;

		// The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		// animation but does not choose what it stops on). The block below shifts every cell back one
		// whole cycle, so this cell's phase on the first painted frame is `((D - delay) mod D) / D`;
		// evaluating the keyframe triangle there freezes the grid on a real frame of its own
		// animation — the diagonal band, mid-sweep — instead of nine identical squares.
		const phase = ((DURATION_S - delay) % DURATION_S) / DURATION_S;
		const lit = 1 - 2 * Math.abs(phase - 0.5);

		return {
			index,
			delay: Number(delay.toFixed(3)),
			opacity: Number((OPACITY_LOW + (1 - OPACITY_LOW) * lit).toFixed(3)),
		};
	});
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A three-by-three block of squares lighting up in a diagonal sweep.
	 *
	 * Decisions worth naming:
	 * - `bg-zinc-800 dark:bg-white` is one semantic token, `bg-foreground`: the light-mode shade picks
	 *   the token and the `dark:` half is dropped, because `--foreground` already carries both themes.
	 * - An unshifted `delay` winds up: a positive `animation-delay` parks an element on its base value
	 *   until it elapses, so the bottom-right cell would sit at 0.1 opacity for 600ms and the block
	 *   would visibly start up on mount. Shifting every delay back one whole cycle keeps the phase
	 *   ORDER — which is the direction the band travels — and starts the grid mid-motion.
	 * - `w-full h-full` on each cell is `size-full`, and `role`/`aria-label` carry the loading-a11y pair every loader shares.
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
	data-loader="square-snake"
	{role}
	aria-label={ariaLabel}
	class={cn("grid size-10 grid-cols-3 gap-1", className)}
>
	{#each cells as cell (cell.index)}
		<span
			class="cell size-full rounded-sm bg-foreground"
			style:--delay="{cell.delay}s"
			style:--rest-opacity={cell.opacity}
		></span>
	{/each}
</div>

<style>
	/* `opacity` runs 0.1 → 1 → 0.1 over three equal intervals — evenly spaced
	   stops. The 0.1 is `OPACITY_LOW` in the module block, which
	   evaluates this same triangle to pick each cell's rest frame; change one, change both. */
	@keyframes loader-square-snake-light {
		0%,
		100% {
			opacity: 0.1;
		}
		50% {
			opacity: 1;
		}
	}

	.cell {
		--duration: 1.5s; /* `DURATION_S` in the module block */

		/* The rest frame, computed per cell in the module block. Never seen while the animation runs,
		   because the keyframes declare `opacity` at both 0% and 100%. */
		opacity: var(--rest-opacity);

		animation: loader-square-snake-light var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--delay) - var(--duration));
	}
</style>
