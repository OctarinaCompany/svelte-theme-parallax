<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Eight radial bars lengthening and shortening around a circle, like a level meter bent into a
	 * ring.
	 *
	 * THE TRANSFORM ORDER IS DELIBERATE, and it is the one real subtlety here. A scale-first
	 * transform list — `scaleY(1.5) rotate(45deg)` — reads plausible, but in CSS a transform list is
	 * applied outside-in, so that spelling stretches each bar along the PAGE's vertical axis after it
	 * has been rotated — the bars at 0 degrees and 180 degrees grow longer while the ones at 90 and
	 * 270 merely grow fatter, and the diagonals shear. This file writes
	 * `rotate(...) scaleY(...)` so every bar stretches along its own length, which is the picture a
	 * radial level meter is plainly meant to be.
	 *
	 * `origin-[2px_20px]` has no utility of its own and stays as geometry: 2px is the bar's own
	 * half-width and 20px is the centre of the 40px box, so all eight pivot around one point.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	/**
	 * Each bar's index — which drives both its angle and its stagger in `calc()` — and the frame it
	 * is frozen on when motion is reduced.
	 *
	 * The rest scale is not a guess. The stagger `delay: i * 0.15` against a 1.2s cycle
	 * becomes `animation-delay: i*0.15s - 1.2s`, so a bar's phase on the
	 * first painted frame is `(1 - i/8) mod 1`; evaluating the keyframe triangle below (0.5 → 1.5 →
	 * 0.5) at that phase gives the still frame this ring would really be showing — a smooth swell
	 * around the circle rather than eight stubs of one length. The 0.5 and the 1.0 of swing are
	 * the `scaleY` ramp's own 0.5 → 1.5 → 0.5, spelled again in the `@keyframes`; the two have to
	 * agree.
	 */
	const bars = Array.from({ length: 8 }, (_, index) => {
		const phase = (1 - index * 0.125) % 1;

		return { index, scale: 0.5 + 2 * (0.5 - Math.abs(0.5 - phase)) };
	});
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="circular-bars"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-10", className)}
>
	{#each bars as bar (bar.index)}
		<!-- `bg-zinc-800 dark:bg-white` is the primary mark: map on the light-mode shade and drop the
		     `dark:` half, because `--foreground` already carries both themes. -->
		<span
			class="bar absolute top-0 left-4.5 h-3 w-1 origin-[2px_20px] rounded-full bg-foreground"
			style:--index={bar.index}
			style:--rest={bar.scale}
		></span>
	{/each}
</div>

<style>
	/* `scaleY` runs 0.5 → 1.5 → 0.5 over three equal intervals — evenly spaced stops whose first
	   and last values match. The rotation
	   rides along in every stop because CSS has a single `transform` property: leaving it out of the
	   keyframes would unwind each bar to 0 degrees the moment the animation started. `var(--index)`
	   is substituted against the animated element, so one keyframe set serves all eight angles. */
	@keyframes loader-circular-bars-stretch {
		0%,
		100% {
			transform: rotate(calc(var(--index) * 45deg)) scaleY(0.5);
		}
		50% {
			transform: rotate(calc(var(--index) * 45deg)) scaleY(1.5);
		}
	}

	.bar {
		--duration: 1.2s;
		/* The stagger, `delay: i * 0.15`. */
		--stagger: 0.15s;

		/* The rest state, computed per bar in the script above. */
		transform: rotate(calc(var(--index) * 45deg)) scaleY(var(--rest));

		animation: loader-circular-bars-stretch var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle. Phase is periodic in the duration, so the
		   eight bars keep exactly their relationship, while every delay goes
		   negative — a negative delay seeks the animation backwards, so the swell is already
		   travelling round the ring on the first painted frame instead of winding up. Subtracted,
		   not negated: negating would send it round the other way. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
