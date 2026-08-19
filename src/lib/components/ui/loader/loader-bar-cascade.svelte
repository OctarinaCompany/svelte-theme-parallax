<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Five bars rising and falling one after the other, so the row reads as a wave travelling left to
	 * right.
	 *
	 * THE INDEX DOES BOTH JOBS IN CSS. The stagger `delay: i * 0.1` is a plain
	 * multiple of the index, so it stays in `calc()` beside the constants it belongs to rather than
	 * being computed in the markup — the `loader-classic-spinner.svelte` shape. The same `--index`
	 * also produces the frozen frame each bar shows under reduced motion.
	 *
	 * ANIMATING `height` RATHER THAN `scaleY()` IS THE EXCEPTION, CLAIMED DELIBERATELY. The
	 * bar is 6px wide and `rounded-full`, so its cap radius is 3px — exactly half its width. Under
	 * `scaleY(0.33)` those circular caps flatten into ellipses at the moment the bar is shortest, and
	 * it stops being a rounded bar. That is the first of the three cases the house allows a layout
	 * property for (corners that must stay circular), the same one `loader-waveform-loader.svelte`
	 * claims. Nothing else here moves.
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
	this row of five bars pinned to the left of a centring tile.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="bar-cascade"
	{role}
	aria-label={ariaLabel}
	class={cn("flex h-8 w-fit items-center gap-1", className)}
>
	{#each bars as index (index)}
		<!-- `bg-zinc-800 dark:bg-white` is the primary mark: the light-mode shade picks the token and
		     the `dark:` half is dropped, because `--foreground` already carries both themes. -->
		<span class="bar w-1.5 rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* `height` runs 8px → 24px → 8px over three equal intervals — evenly spaced stops. First and
	   last are the same value, hence the shared selector. Inside a style block the bare
	   `ease-in-out` keyword is CSS's own curve, not Tailwind's variable. */
	@keyframes loader-bar-cascade-rise {
		0%,
		100% {
			height: 8px;
		}
		50% {
			height: 24px;
		}
	}

	.bar {
		--duration: 1s;
		/* The stagger, `delay: i * 0.1`. */
		--stagger: 0.1s;

		/* The rest state: the cascade caught mid-travel, 8 / 11.2 / 14.4 / 17.6 / 20.8px. It is not a
		   decorative guess — with `animation-delay: i*0.1s - 1s` a bar's phase on the first painted
		   frame is `1 - 0.1i`, and the triangle above (8px → 24px → 8px) evaluated there comes out at
		   exactly `8 + 3.2i` px. The 8px and the 3.2px (a fifth of the 16px climb, per 0.1s of the 1s
		   cycle) are two spellings of the same fact as the keyframes; if one changes the other has to.
		   Freezing all five at 8px would leave a flat row of stubs that reads as finished, not busy. */
		height: calc(8px + var(--index) * 3.2px);

		animation: loader-bar-cascade-rise var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle. Phase is periodic in the duration, so moving
		   every bar by the same cycle changes nothing between them — and it makes every delay
		   negative, which seeks the animation backwards so the wave is already running on the first
		   painted frame instead of winding up over the first half second. Subtracted, not negated:
		   negating would put bar i ahead instead of behind, running the wave right to
		   left. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
