<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * The system spinner: twelve hairline ticks round a 32px box, each fading a twelfth of a cycle
	 * behind the one before it.
	 *
	 * THE SAME ANIMATION AS `loader-classic-spinner.svelte`, AT A DIFFERENT WEIGHT. Both are twelve
	 * ticks on a 1s `opacity: [1, 0.2]` ramp with `delay: i * (1 / 12)`; what differs is the geometry
	 * (2×7px here against 4×8px there) and the ink: this one is the primary mark,
	 * `bg-foreground`, where
	 * `classic-spinner` takes the quiet `bg-muted-foreground`. The pair is
	 * deliberately a crisp spinner and a soft one.
	 *
	 * ONE ELEMENT PER TICK, NOT A WRAPPER PAIR. The obvious construction rotates a
	 * full-size wrapper by `i * 30` degrees and centres a bar at its top edge. But a
	 * wrapper that exists only to establish a pivot is a wrapper a `transform-origin` can replace:
	 * the bar is 2px wide and sits at x = 15px in a 32px box, so pivoting it about (1px, 16px) puts
	 * the centre of the box under the pivot and twelve of them fan out exactly as the
	 * wrappers would. Twelve elements instead of twenty-four, and the same picture.
	 *
	 * THE DELAY IS SHIFTED BACK ONE WHOLE CYCLE. A positive `animation-delay` would hold
	 * the twelfth tick at full opacity for 917ms and the ring would visibly wind up on mount;
	 * subtracting one full duration makes every delay negative, and a negative delay seeks backwards,
	 * so the first painted frame is already the steady state. Subtracted, not negated — negating each
	 * delay would put tick i ahead instead of behind, and the fading band would travel
	 * round the ring the other way.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const ticks = Array.from({ length: 12 }, (_, index) => index);
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="ios-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-8", className)}
>
	{#each ticks as index (index)}
		<span
			class="tick absolute top-0 left-[15px] h-[7px] w-0.5 origin-[1px_16px] rounded-full bg-foreground"
			style:--index={index}
		></span>
	{/each}
</div>

<style>
	/* The fade, 1 → 0.2, looping: the value snaps
	   back to 1 at the end of every cycle rather than easing back, and that sawtooth is what makes
	   a chase read as a chase. `linear`, so the band travels at a constant rate. */
	@keyframes loader-ios-spinner-fade {
		from {
			opacity: 1;
		}
		to {
			opacity: 0.2;
		}
	}

	.tick {
		--duration: 1s;
		/* The stagger `delay: i * (1 / 12)`, derived from `--duration` rather than written as 83.333ms
		   so the two cannot drift apart. The whole cycle subtracted below is
		   what removes the wind-up. */
		--stagger: calc(var(--duration) / 12);

		transform: rotate(calc(var(--index) * 30deg));

		/* The rest state, and the only thing visible under reduced motion: a static ramp from 1 down
		   to 0.27 across the twelve ticks — the mirror image of the frame the animation is actually
		   on, kept because a still picture reads best decaying smoothly head to tail.
		   Freezing them all at full opacity would leave a solid ring reading as a decoration rather
		   than as something in progress. The keyframes above declare opacity at both ends of the
		   cycle, so this value never shows while the animation runs. Same ramp as
		   `loader-classic-spinner.svelte`, and for the same reason. */
		opacity: calc(1 - var(--index) / 15);

		animation: loader-ios-spinner-fade var(--duration) linear infinite;
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
