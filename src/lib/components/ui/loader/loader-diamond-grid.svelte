<script module lang="ts">
	/**
	 * The cycle and stagger — `duration: 1.5` and
	 * `delay: i * 0.2` — together with the bottom of the `scale` (0.5) and `opacity` (0.3) dips.
	 *
	 * All four are spelled again as literals in the `@keyframes` and `.cell` rules below, because a
	 * `<script module>` const cannot reach a CSS rule. They are two spellings of one fact and nothing
	 * will report it if they drift, so both sites carry a note.
	 */
	const DURATION_S = 1.5;
	const STAGGER_S = 0.2;
	const SCALE_LOW = 0.5;
	const OPACITY_LOW = 0.3;

	/**
	 * The frame each cell is frozen on when motion is reduced.
	 *
	 * Not a decorative guess: the style block shifts every cell back one whole cycle, so cell `i`'s
	 * phase on the first painted frame is `((D - i·stagger) mod D) / D`, and the keyframes draw a
	 * triangle that is 1 at both ends and `*_LOW` in the middle. Evaluating that triangle at that
	 * phase freezes the grid on a real frame of its own animation — a ramp of four sizes reading
	 * around the diamond — rather than on four identical full-size cells.
	 */
	const cells = Array.from({ length: 4 }, (_, index) => {
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
	 * Four rounded cells on a tilted two-by-two grid, dipping in turn.
	 *
	 * Decisions worth naming:
	 * - `bg-zinc-800 dark:bg-white` is one semantic token, `bg-foreground`.
	 * - `w-fit`, because a bare `grid` is block-level and would
	 *   stretch to whatever container this lands in; the four cells would then sit hard left of a
	 *   tile that is centring its contents, and the 45° tilt would swing them further out. The grid
	 *   is 32px across on its own (two 12px cells and an 8px gap), and `w-fit` is what keeps it that.
	 * - An unshifted `delay` winds up: a positive `animation-delay` parks an element on its base value
	 *   until it elapses, so the last cell would sit at full size for 600ms and the diamond would
	 *   visibly start up on mount. Shifting every delay back one whole cycle keeps the phase ORDER —
	 *   which is the direction the dip travels — and starts the grid mid-motion.
	 *
	 * The `rotate-45` sits on the root: it is a static transform that turns a
	 * square grid into a diamond, and it does not affect layout, so the root's own 32px box is
	 * unmoved by it.
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
	data-loader="diamond-grid"
	{role}
	aria-label={ariaLabel}
	class={cn("grid w-fit rotate-45 grid-cols-2 gap-2", className)}
>
	{#each cells as cell (cell.index)}
		<span
			class="cell size-3 rounded-sm bg-foreground"
			style:--index={cell.index}
			style:--rest-scale={cell.scale}
			style:--rest-opacity={cell.opacity}
		></span>
	{/each}
</div>

<style>
	/* The 1 → low → 1 dip. The two low values are `SCALE_LOW` / `OPACITY_LOW` in the module block,
	   which evaluates this same curve to pick each cell's rest frame; change one, change both. */
	@keyframes loader-diamond-grid-dip {
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

	.cell {
		--duration: 1.5s; /* `DURATION_S` in the module block */
		--stagger: 0.2s; /* `STAGGER_S` — the stagger `delay: i * 0.2` */

		/* The rest frame, computed per cell in the module block. Never seen while the animation runs,
		   because the keyframes declare both properties at 0% and at 100%. */
		opacity: var(--rest-opacity);
		transform: scale(var(--rest-scale));

		animation: loader-diamond-grid-dip var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
