<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three stacked bars swelling out from the centre line and brightening as they go.
	 *
	 * Decisions worth naming:
	 * - The bars are one semantic token, `bg-foreground`, which carries both themes on its own.
	 * - No `w-full` on the bars: the style block owns `width` here (it is animated,
	 *   and its rest value is a per-bar fraction rather than the full 100%), so a utility saying
	 *   otherwise would be a second spelling that never wins.
	 * - An unshifted delay winds up: a positive `animation-delay` would hold all three bars at their
	 *   base width until it elapses. Every delay is shifted back one whole cycle instead — same phase
	 *   order, so the swell still runs top to bottom.
	 *
	 * WHY THIS ANIMATES `width` AND NOT `scaleX()`. A transform is composited and a layout property
	 * is not, so `transform` is the default wherever it is a cheaper spelling of the same picture.
	 * Here it is not: a bar is 4px tall and `rounded-full`, so its 2px cap radius is half its smaller
	 * dimension, and `scaleX(0.5)` would squash those circular caps into ellipses — the bar would
	 * stop being a rounded bar at exactly the moment it is shortest.
	 * `ui/loader/loader-elastic-bars.svelte` claims the same case on the other axis.
	 *
	 * A consequence worth stating out loud: a Svelte scoped rule is unlayered and Tailwind utilities
	 * live in `@layer utilities`, so the `width` below beats a `w-*` class a caller puts on a bar.
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

	const bars = Array.from({ length: 3 }, (_, index) => index);
</script>

<!-- `w-8` is load-bearing: it is what the bars' percentage widths are measured
     against, and `items-center` is what makes them swell symmetrically instead of off one edge. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="stacked-bar-pulse"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-8 flex-col items-center gap-1", className)}
>
	{#each bars as index (index)}
		<span class="bar h-1 rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* `opacity` runs 0.2 → 1 → 0.2 as `width` runs 50% → 100% → 50%, both over three equal
	   intervals — evenly spaced stops, and both ramps start and
	   end on the same value, which is why 0% and 100% share a selector. */
	@keyframes loader-stacked-bar-pulse-swell {
		0%,
		100% {
			width: 50%;
			opacity: 0.2;
		}
		50% {
			width: 100%;
			opacity: 1;
		}
	}

	.bar {
		--duration: 1.5s;
		--stagger: 0.2s; /* the stagger `delay: i * 0.2` */

		/* The rest state: both keyframe ramps evaluated at each bar's phase on the first painted
		   frame. With the whole cycle subtracted below that phase is `1 - i * 0.2 / 1.5`, which never
		   passes the peak, so both ramps come out exactly linear — the stack freezes as a 50 / 63 / 77
		   percent wedge, fading with it, rather than three identical bars. The endpoints are the
		   keyframe's above and the two have to agree. */
		width: calc(50% + var(--index) * 13.333%);
		opacity: calc(0.2 + var(--index) * 0.2133);

		animation: loader-stacked-bar-pulse-swell var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
