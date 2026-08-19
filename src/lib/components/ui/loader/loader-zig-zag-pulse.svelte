<script module lang="ts">
	/**
	 * The cycle, stagger and the bottom of the `opacity: [0.2, 1, 0.2]` dip:
	 * `duration: 1.2` and `delay: i * 0.1`.
	 *
	 * All three are spelled again as literals in the `@keyframes` and `.dot` rules below, because a
	 * `<script module>` const cannot reach a CSS rule. They are two spellings of one fact and nothing
	 * will report it if they drift, so both sites carry a note.
	 */
	const DURATION_S = 1.2;
	const STAGGER_S = 0.1;
	const OPACITY_LOW = 0.2;

	/**
	 * The cells, as a `[column, row]` array — placed by
	 * hand rather than left to the grid's flow, which is what draws the zig-zag: top-left, centre,
	 * top-right, bottom-left, centre again, bottom-right.
	 *
	 * THE CENTRE CELL IS LISTED TWICE, and that is deliberate, not a slip. Two dots
	 * occupy `[1, 1]` at indices 1 and 4, so the middle of the figure carries two pulses 0.3s apart —
	 * a quarter of the 1.2s cycle — and never goes as dim as the corners do. Dropping the duplicate
	 * would also shift every later dot's `delay: i * 0.1` by one step and change the sweep, so it
	 * stays.
	 */
	const positions: Array<[number, number]> = [
		[0, 0],
		[1, 1],
		[2, 0],
		[0, 2],
		[1, 1],
		[2, 2],
	];

	const dots = positions.map(([column, row], index) => {
		// The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		// animation but does not choose what it stops on). The block below shifts every dot back one
		// whole cycle, so dot `i`'s phase on the first painted frame is `((D - i·stagger) mod D) / D`;
		// evaluating the keyframe triangle there freezes the figure on a real frame of its own
		// animation — a ramp along the zig-zag — instead of six identical dots.
		const phase = ((DURATION_S - index * STAGGER_S) % DURATION_S) / DURATION_S;
		const lit = 1 - 2 * Math.abs(phase - 0.5);

		return {
			index,
			column: column + 1,
			row: row + 1,
			opacity: Number((OPACITY_LOW + (1 - OPACITY_LOW) * lit).toFixed(3)),
		};
	});
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Six dots pinned to a zig-zag across a three-by-three grid, brightening in turn.
	 *
	 * Decisions worth naming:
	 * - `bg-zinc-800 dark:bg-white` is one semantic token, `bg-foreground`: the light-mode shade picks
	 *   the token and the `dark:` half is dropped, because `--foreground` already carries both themes.
	 * - An unshifted `delay` winds up: a positive `animation-delay` parks an element on its base value
	 *   until it elapses, so the last dot would sit dim for half a second and the figure would
	 *   visibly start up on mount. Shifting every delay back one whole cycle keeps the phase ORDER —
	 *   which is the direction the brightness travels — and starts it mid-motion.
	 *
	 * The grid placement stays an inline style: the column and the row come from
	 * a data array, so there is no fixed utility class to reach for, and this is geometry rather than
	 * colour.
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
	data-loader="zig-zag-pulse"
	{role}
	aria-label={ariaLabel}
	class={cn("grid size-12 grid-cols-3 gap-2", className)}
>
	{#each dots as dot (dot.index)}
		<span
			class="dot size-2.5 rounded-full bg-foreground"
			style:grid-column={dot.column}
			style:grid-row={dot.row}
			style:--index={dot.index}
			style:--rest-opacity={dot.opacity}
		></span>
	{/each}
</div>

<style>
	/* `opacity` runs 0.2 → 1 → 0.2 over three equal intervals — evenly spaced
	   stops. The 0.2 is `OPACITY_LOW` in the module block, which
	   evaluates this same triangle to pick each dot's rest frame; change one, change both. */
	@keyframes loader-zig-zag-pulse-glow {
		0%,
		100% {
			opacity: 0.2;
		}
		50% {
			opacity: 1;
		}
	}

	.dot {
		--duration: 1.2s; /* `DURATION_S` in the module block */
		--stagger: 0.1s; /* `STAGGER_S` — the stagger `delay: i * 0.1` */

		/* The rest frame, computed per dot in the module block. Never seen while the animation runs,
		   because the keyframes declare `opacity` at both 0% and 100%. */
		opacity: var(--rest-opacity);

		animation: loader-zig-zag-pulse-glow var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
