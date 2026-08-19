<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * The twelve-tick iOS spinner.
	 *
	 * THE ARCHETYPE OF THIS FOLDER, and the file every other array-driven loader copies. Twelve
	 * ticks render from `Array.from({ length: 12 })`, each rotated by `i * 30`
	 * degrees and handed the same 1s opacity ramp with
	 * `delay: i * (1 / 12)`. The index travels into CSS as a
	 * `--index` custom property and does both jobs — the rotation and the phase offset — in `calc()`,
	 * so the markup carries no magic numbers and the timing constants sit next to the keyframes they
	 * belong to.
	 *
	 * THE DELAY IS SHIFTED BACK ONE WHOLE CYCLE. A positive `animation-delay` holds an
	 * element at its start value until the delay elapses, so the twelfth tick would sit at full
	 * opacity for 917ms and the ring would visibly wind up on mount.
	 * Subtracting one full duration makes every delay negative, and a negative
	 * delay seeks the animation backwards, so on the first painted frame tick 11 is already 1/12 of
	 * the way through its cycle: the steady state an unshifted spinner only reaches after one full
	 * turn.
	 *
	 * SUBTRACTED, NOT NEGATED, and the difference is visible. A phase is periodic in the duration,
	 * so moving every tick by the same whole cycle changes nothing between them. Negating each delay
	 * instead would put tick i AHEAD by i/12 instead of BEHIND, which reverses the
	 * direction the fading band travels around the ring — the same spinner, turning the other way.
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

<!--
	`{...restProps}` is spread FIRST, so everything named after it wins — the shape
	`ui/status-monitor`'s bar uses, rather than the data-slot-first order of `ui/shake`. Every loader
	in this folder is written this way, because `data-slot="loader"` is not decoration here: the
	reduced-motion rule in `src/app.css` selects on it, and a caller who happened to pass their own
	`data-slot` would silently switch that off. An accessibility override a prop can clobber is not
	an override. `class`, `role` and `aria-label` are destructured out of props and so can never
	reach `restProps` at all; they sit after it for consistency, not out of necessity.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="classic-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-8", className)}
>
	{#each ticks as index (index)}
		<!--
			The tick is `bg-muted-foreground`, deliberately quiet — zinc-400 on white, for scale, is ~2.6:1 and
			`--muted-foreground` on `--background` is ~2.4:1, so the ported spinner is as soft as the
			one it came from.

			`origin-[2px_16px]` has no utility of its own: 2px is the tick's own half-width and 16px is
			the centre of the 32px box, so the twelve ticks pivot around one point.
		-->
		<span
			class="tick absolute top-0 left-3.5 h-2 w-1 origin-[2px_16px] rounded-full bg-muted-foreground"
			style:--index={index}
		></span>
	{/each}
</div>

<style>
	/* The fade, 1 → 0.2, looping rather than alternating — the value snaps back to 1 at the end
	   of every cycle rather than easing
	   back, which is the sawtooth a chasing spinner needs. */
	@keyframes loader-classic-spinner-fade {
		from {
			opacity: 1;
		}
		to {
			opacity: 0.2;
		}
	}

	.tick {
		--duration: 1s;
		/* The stagger `delay: i * (1 / 12)`, derived from `--duration` rather than written as
		   `83.333ms` so the two cannot drift apart. The whole cycle
		   subtracted below is what removes the wind-up. */
		--stagger: calc(var(--duration) / 12);

		transform: rotate(calc(var(--index) * 30deg));

		/* The rest state, and the only thing visible under reduced motion: a static ramp from 1 down
		   to 0.27 across the twelve ticks. Not the frame the animation is on — that one is dimmest
		   just AFTER the head and brightens round the ring — but its mirror image, kept because a
		   still picture reads best decaying smoothly head to tail. Freezing them all at opacity 1
		   would leave a solid ring that reads as a decoration rather than as something in progress.
		   While the animation runs this value never shows — the keyframes above declare opacity at
		   both ends of the cycle. */
		opacity: calc(1 - var(--index) / 15);

		animation: loader-classic-spinner-fade var(--duration) linear infinite;
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}

	/* The shared `[data-slot="loader"]` rule in `src/app.css` already switches every descendant
	   animation off under `prefers-reduced-motion: reduce` and pulses the root in its place, so
	   there is nothing to repeat here. */
</style>
