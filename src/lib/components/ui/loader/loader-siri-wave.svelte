<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Five thin bars swelling in sequence, the shape a voice assistant draws while it listens.
	 *
	 * ANIMATING `height` RATHER THAN `scaleY()` IS THE EXCEPTION, CLAIMED DELIBERATELY.
	 * The bar is 4px wide and `rounded-full`, so its cap radius is 2px —
	 * exactly half its width. Under `scaleY(0.17)` those circular caps become ellipses a third of a
	 * pixel deep and the bar stops being a rounded bar at the moment it is shortest. That is the
	 * first of the three cases the house allows a layout property for, the same one
	 * `loader-waveform-loader.svelte` claims. Nothing else here moves.
	 *
	 * The stagger is `delay: i * 0.1`, a plain multiple of the index, so it stays in
	 * `calc()` beside the constants it belongs to.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const bars = Array.from({ length: 5 }, (_, index) => index);
</script>

<!--
	`w-fit` because a bare block `<div>` stretches to whatever it is dropped into, which would leave
	five 4px bars stranded at the left of a centring tile.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="siri-wave"
	{role}
	aria-label={ariaLabel}
	class={cn("flex h-8 w-fit items-center gap-1", className)}
>
	{#each bars as index (index)}
		<!-- `bg-zinc-800 dark:bg-white` is the primary mark: map on the light-mode shade and drop the
		     `dark:` half, because `--foreground` already carries both themes. -->
		<span class="bar w-1 rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* `height` runs 4px → 24px → 4px over three equal intervals — evenly spaced stops whose
	   first and last values match. */
	@keyframes loader-siri-wave-swell {
		0%,
		100% {
			height: 4px;
		}
		50% {
			height: 24px;
		}
	}

	.bar {
		--duration: 1.2s;
		/* The stagger, `delay: i * 0.1`. */
		--stagger: 0.1s;

		/* The rest state: 4 / 7.3 / 10.7 / 14 / 17.3px, the ramp this row would really be caught on.
		   With `animation-delay: i*0.1s - 1.2s` a bar's phase on the first painted frame is
		   `1 - i/12`, and the triangle above (4px → 24px → 4px) evaluated there is exactly
		   `4px + i × 10px/3`. The 10px/3 is the 40px-per-cycle descent spent over each 0.1s of the
		   1.2s cycle, written as a fraction so it stays exact; it and the 4px are the same fact as
		   the `@keyframes` above and have to move together. Freezing all five at 4px would leave a
		   flat row of stubs that reads as finished rather than busy. */
		height: calc(4px + var(--index) * 10px / 3);

		animation: loader-siri-wave-swell var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: every delay goes negative, so the wave is
		   already travelling on the first painted frame instead of winding up. Subtracted, not
		   negated — negating would run it right to left. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
