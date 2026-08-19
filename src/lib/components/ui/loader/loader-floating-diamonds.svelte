<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three tilted squares bobbing in sequence.
	 *
	 * THE 45° TILT LIVES IN THE KEYFRAMES, and it has to — but not because the utility would lose.
	 * A `rotate-45` class looks like the obvious home for it.
	 * But Tailwind v4 compiles `rotate-45` to the INDEPENDENT `rotate`
	 * property, not to `transform: rotate(45deg)`, so a `transform` declared in this style block does
	 * not override it — the two compose, and CSS applies `translate`, then `rotate`, then `scale`,
	 * and only then `transform`. Keeping the class would therefore rotate the diamond first and run
	 * the bob's `translateY` inside the tilted frame, sending it up and to the RIGHT along the
	 * diagonal instead of straight up. The bob must happen in the tilted shape's own frame,
	 * so the right spelling is one `transform` with the tilt written last.
	 *
	 * THE DELAY IS SHIFTED BACK ONE WHOLE CYCLE: `i * 0.2 − 1s`. Negative delays seek the
	 * animation backwards, so the three diamonds are already staggered on the first painted frame
	 * rather than starting flat and rippling into place. Subtracted rather than negated, so the wave
	 * still travels left to right.
	 *
	 * `w-fit` so the row is as
	 * wide as its three diamonds instead of as wide as whatever contains it.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const diamonds = Array.from({ length: 3 }, (_, index) => index);
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="floating-diamonds"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit gap-2", className)}
>
	{#each diamonds as index (index)}
		<!-- `bg-zinc-800 dark:bg-white` → `bg-foreground`. -->
		<span class="diamond size-3 rounded-sm bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	@keyframes loader-floating-diamonds-bob {
		0%,
		100% {
			transform: translateY(0) rotate(45deg);
		}
		50% {
			transform: translateY(-10px) rotate(45deg);
		}
	}

	.diamond {
		--duration: 1s;
		--stagger: 0.2s; /* the stagger `delay: i * 0.2` */

		/* The rest state: a rising staircase, which is roughly the frame this row would be caught on.
		   With the delays below the three diamonds sit at phase 0, 0.8 and 0.6 of the cycle, whose
		   true heights are 0, −3.5px and −9.1px; a flat 4.5px step is within a couple of pixels of
		   that and says the same thing — a wave passing along the row — in one `calc()` instead of
		   three hand-evaluated béziers. Freezing all three at 0 would leave a static row of dots. */
		transform: translateY(calc(var(--index) * -4.5px)) rotate(45deg);

		animation: loader-floating-diamonds-bob var(--duration) ease-in-out infinite;
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
