<script module lang="ts">
	/**
	 * The cycle length: `duration: 1.2`.
	 *
	 * `HEIGHT_LOW` / `HEIGHT_HIGH` are the ends of the `height: [8, 24, 8]` ramp, spelled again as
	 * literals in the `@keyframes` block below, which a `<script module>` const cannot reach. Two
	 * spellings of one fact: change one, change both.
	 */
	const DURATION_S = 1.2;
	const HEIGHT_LOW = 8;
	const HEIGHT_HIGH = 24;

	/**
	 * The bars map over `[0, 1, 2, 3, 4, 3, 2, 1, 0]` and drive the delay
	 * off the array's VALUE, not its index — which is what makes the wave symmetric about the middle
	 * bar rather than sweeping from one end to the other.
	 */
	const STEPS = [0, 1, 2, 3, 4, 3, 2, 1, 0];

	const bars = STEPS.map((step, index) => {
		// The stagger: `delay: val * 0.1`. Largest value 0.4s, well inside one
		// cycle. Not `i * k`, so it is computed here and handed to CSS finished.
		const delay = step * 0.1;

		// The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		// animation but does not choose what it stops on). The block below shifts every bar back one
		// whole cycle, so this bar's phase on the first painted frame is `((-delay) mod D) / D`;
		// evaluating the keyframe triangle there freezes an actual symmetric wave — 8, 11, 13, 16,
		// 19, 16, 13, 11, 8 — instead of a flat row of stubs.
		const phase = ((DURATION_S - delay) % DURATION_S) / DURATION_S;
		const rise = 1 - 2 * Math.abs(phase - 0.5);

		return {
			index,
			delay: Number(delay.toFixed(3)),
			height: Number((HEIGHT_LOW + (HEIGHT_HIGH - HEIGHT_LOW) * rise).toFixed(2)),
		};
	});
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Nine rounded bars rising and falling in a wave that is symmetric about the middle one.
	 *
	 * Decisions worth naming:
	 * - The bars are one semantic token, `bg-foreground`, which carries both themes on its own.
	 * - An unshifted `delay` winds up — a positive `animation-delay` holds a bar at its base height
	 *   until it elapses, so the loader would visibly assemble itself on mount. Every delay is
	 *   shifted back one whole cycle instead: same phase relationships, no wind-up.
	 *
	 * WHY THIS ANIMATES `height` AND NOT `scaleY()`. A transform is composited and a layout property
	 * is not, so `transform` is the default everywhere it is a cheaper spelling of the same picture.
	 * Here it is not the same picture: a bar is 6px wide and `rounded-full`, so its 3px radius is
	 * half its smaller dimension, and `scaleY()` would stretch the circular caps into ellipses that
	 * grow more oval the taller the bar gets. `ui/loader/loader-waveform-loader.svelte` animates
	 * height for the same reason. Nine bars is a small enough set for the main-thread cost to stay
	 * invisible, and the gallery tile's `content-visibility` gate in `src/app.css` skips it entirely
	 * when it is off screen.
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

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="symmetric-wave"
	{role}
	aria-label={ariaLabel}
	class={cn("flex h-10 w-fit items-center gap-1.5", className)}
>
	{#each bars as bar (bar.index)}
		<span
			class="bar w-1.5 rounded-full bg-foreground"
			style:--delay="{bar.delay}s"
			style:--rest="{bar.height}px"
		></span>
	{/each}
</div>

<style>
	/* `height` runs 8px → 24px → 8px. The two literals are `HEIGHT_LOW` / `HEIGHT_HIGH` in the
	   module block, which evaluates this same triangle to pick each bar's rest height. */
	@keyframes loader-symmetric-wave-rise {
		0%,
		100% {
			height: 8px;
		}
		50% {
			height: 24px;
		}
	}

	.bar {
		--duration: 1.2s;

		/* The rest frame, computed per bar in the module block. Never seen while the animation runs,
		   because the keyframes declare `height` at 0% and at 100%. */
		height: var(--rest);

		animation: loader-symmetric-wave-rise var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--delay) - var(--duration));
	}
</style>
