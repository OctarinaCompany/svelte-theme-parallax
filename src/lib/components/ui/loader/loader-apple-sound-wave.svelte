<script module lang="ts">
	/**
	 * The cycle, stagger and height stops: `duration: 1`, `delay: i * 0.1`, and
	 * `height: [4, val * 8, 4]`.
	 *
	 * `HEIGHT_LOW` is spelled again as a literal in the `@keyframes` block below, which a
	 * `<script module>` const cannot reach; the peak reaches the block as `--peak`, because it
	 * differs per bar. Two spellings of one fact: change one, change both.
	 */
	const DURATION_S = 1;
	const STAGGER_S = 0.1;
	const HEIGHT_LOW = 4;
	const HEIGHT_STEP = 8;

	/**
	 * The bars map over `[1, 2, 3, 2, 1]` and multiply each VALUE by 8 to
	 * get that bar's peak — which is what makes the row an arch about the middle bar rather than a
	 * flat five. The index still drives the delay, so the arch also ripples outwards.
	 */
	const STEPS = [1, 2, 3, 2, 1];

	const bars = STEPS.map((step, index) => {
		const peak = step * HEIGHT_STEP;

		/**
		 * The frame reduced motion freezes this bar on. The block below shifts every bar back one
		 * whole cycle, so its phase on the first painted frame is `1 - i * 0.1`; evaluating this
		 * bar's own triangle there gives 4, 6.4, 12, 11.2, 7.2 px — a wave caught in motion rather
		 * than five stubs all sitting at their 4px minimum. Not a `calc()` on the index, because the
		 * peak varies along the row and the product of the two ramps is not linear in either.
		 */
		const phase = ((DURATION_S - index * STAGGER_S) % DURATION_S) / DURATION_S;
		const rise = 1 - 2 * Math.abs(phase - 0.5);

		return {
			index,
			peak,
			height: Number((HEIGHT_LOW + (peak - HEIGHT_LOW) * rise).toFixed(2)),
		};
	});
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Five thin bars rising and falling in an arch, the way a phone draws a voice note.
	 *
	 * Decisions worth naming:
	 * - The bars are one semantic token, `bg-foreground`, which carries both themes on its own.
	 * - `space-x-1` becomes `flex` + `gap-1`, per `docs/CONVENTIONS.md`.
	 * - An unshifted delay winds up: a positive `animation-delay` would hold every bar at 4px until it
	 *   elapses, so the arch would assemble itself on mount. Every delay is shifted back one whole
	 *   cycle instead — same phase order, so the ripple still runs left to right.
	 *
	 * WHY THIS ANIMATES `height` AND NOT `scaleY()`. A transform is composited and a layout property
	 * is not, so `transform` is the default wherever it is a cheaper spelling of the same picture.
	 * Here it is not: a bar is 4px wide and `rounded-full`, so its 2px cap radius is half its smaller
	 * dimension, and at `scaleY(0.17)` those circular caps become ellipses a third of a pixel deep —
	 * the bar stops being a rounded bar at exactly the moment it is shortest.
	 * `ui/loader/loader-waveform-loader.svelte` claims the same case for a bar of the same width.
	 *
	 * A consequence worth stating out loud: a Svelte scoped rule is unlayered and Tailwind utilities
	 * live in `@layer utilities`, so the `height` below beats an `h-*` class a caller puts on a bar.
	 * These bars are not a caller's to resize — the loader has no `size` prop by design
	 * (`./loader.svelte.ts`) — but the rule is silent, so it is written down.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<!-- `h-8` holds the row's box steady while the bars grow inside it; `w-fit`
     because a bare block `<div>` stretches to its container and would leave the row pinned to the
     left of whatever it is dropped into. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="apple-sound-wave"
	{role}
	aria-label={ariaLabel}
	class={cn("flex h-8 w-fit items-center gap-1", className)}
>
	{#each bars as bar (bar.index)}
		<span
			class="bar w-1 rounded-full bg-foreground"
			style:--index={bar.index}
			style:--peak="{bar.peak}px"
			style:--rest="{bar.height}px"
		></span>
	{/each}
</div>

<style>
	/* `height` runs 4 → peak → 4 over three equal intervals — evenly spaced stops. The peak is
	   per bar, so it arrives as `--peak`:
	   `var()` inside a keyframe is substituted against the animated element, which lets five bars
	   share one set of stops without sharing their heights. */
	@keyframes loader-apple-sound-wave-rise {
		0%,
		100% {
			height: 4px;
		}
		50% {
			height: var(--peak);
		}
	}

	.bar {
		--duration: 1s;
		--stagger: 0.1s; /* the stagger `delay: i * 0.1` */

		/* The rest frame, computed per bar in the module block. Never seen while the animation runs,
		   because the keyframes declare `height` at 0% and at 100%. */
		height: var(--rest);

		animation: loader-apple-sound-wave-rise var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
