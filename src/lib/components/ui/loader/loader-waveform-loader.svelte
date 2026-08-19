<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Eight bars rising and falling out of step, like a level meter.
	 *
	 * THE DELAY IS NOT A MULTIPLE OF THE INDEX, which is why it is computed here and passed in rather
	 * than reconstructed in `calc()`. The stagger is `delay: Math.sin(i) * 0.5`
	 * — a value that is negative for half the bars, which is the point:
	 * the row is meant to look sampled rather than swept. `calc()` has no `sin()` worth relying on
	 * here, and eight literal delays in the markup would be eight magic numbers, so the arithmetic
	 * stays in the script and each bar carries its finished value as `--delay`.
	 *
	 * The sign is untouched. The style block subtracts one whole duration from whatever
	 * arrives, which is what makes every bar start in its steady state instead of winding up, and
	 * which preserves the phase ORDER — negating each delay instead would run the wave
	 * backwards along the row.
	 *
	 * ANIMATING `height` RATHER THAN `scaleY()` IS THE EXCEPTION, CLAIMED ON PURPOSE. A bar is 4px
	 * wide and `rounded-full`, so its cap radius is 2px — half its width. Under `scaleY(0.17)` those
	 * circular caps become ellipses a third of a pixel deep and the bar stops being a rounded bar at
	 * exactly the moment it is shortest. That is the first of the three cases `src/app.css` allows a
	 * layout property for (corners that must stay circular), the same one `loader-dynamic-island.svelte`
	 * claims for its pill. Nothing else here animates: no travel, no rotation, no opacity.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	/**
	 * A bar's stagger, and the frame it is frozen on when motion is reduced.
	 *
	 * The rest height is not a guess. With `duration: 1s` and `animation-delay: delay - 1s`, a bar's
	 * phase on the first painted frame is `(-delay) mod 1`, and the keyframes below draw a triangle
	 * that is 4px at both ends and 24px in the middle. Evaluated at that phase, for
	 * `delay = sin(i) × 0.5`, the triangle comes out at exactly `4 + 20 × |sin(i)|` px — so the still
	 * frame reduced motion leaves on screen is the real waveform this loader would be showing, not a
	 * flat row of eight stubs. The two constants are the ends of the `height: [4, 24, 4]` ramp;
	 * they are
	 * spelled again in the `@keyframes` below and the two have to agree.
	 */
	const bars = Array.from({ length: 8 }, (_, index) => {
		const wave = Math.sin(index);

		return {
			index,
			delay: wave * 0.5,
			height: 4 + 20 * Math.abs(wave),
		};
	});
</script>

<!--
	`w-fit` because a bare block `<div>` stretches to its container and would leave the row of bars
	pinned to the left of whatever it is dropped into.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="waveform-loader"
	{role}
	aria-label={ariaLabel}
	class={cn("flex h-8 w-fit items-center gap-0.5", className)}
>
	{#each bars as bar (bar.index)}
		<!-- `bg-zinc-800 dark:bg-white` is the primary mark: the light-mode shade decides the token
		     and the `dark:` half is dropped, because `--foreground` already carries both themes. -->
		<span
			class="bar w-1 rounded-full bg-foreground"
			style:--delay="{bar.delay}s"
			style:--rest="{bar.height}px"
		></span>
	{/each}
</div>

<style>
	/* `height` runs 4 → 24 → 4 over three equal intervals, its stops evenly spaced. First and last are the same value, which is why they share a
	   selector. */
	@keyframes loader-waveform-loader-rise {
		0%,
		100% {
			height: 4px;
		}
		50% {
			height: 24px;
		}
	}

	.bar {
		--duration: 1s;

		/* The rest state, computed per bar in the script above. */
		height: var(--rest);

		animation: loader-waveform-loader-rise var(--duration) ease-in-out infinite;

		/* The stagger delay shifted back one whole cycle. Phase is periodic in the duration, so moving
		   every bar by the same cycle changes nothing between them, and it makes every delay negative
		   — a negative delay seeks the animation backwards, so the row is already in motion on the
		   first painted frame instead of standing still for up to half a second. */
		animation-delay: calc(var(--delay) - var(--duration));
	}
</style>
