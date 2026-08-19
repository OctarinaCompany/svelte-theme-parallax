<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three tall bars squeezing and stretching out of step.
	 *
	 * THE SQUEEZE IS `scaleY`. The bar keeps its full 32px height in the layout and is squashed by
	 * a transform, which is the cheap composited spelling — there is no reason here to reach for
	 * the layout-property exception that `loader-waveform-loader.svelte` claims.
	 *
	 * The stagger is `delay: i * 0.2`, a plain multiple of the
	 * index, so it stays in `calc()` next to the constants it belongs to.
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

<!--
	`w-fit` because a bare block `<div>` stretches to its container, which would strand three 6px bars
	against the left edge of a centring tile.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="bouncing-bars"
	{role}
	aria-label={ariaLabel}
	class={cn("flex h-8 w-fit items-center gap-1.5", className)}
>
	{#each bars as index (index)}
		<!-- `bg-zinc-800 dark:bg-white` is the primary mark: map on the light-mode shade, drop the
		     `dark:` half, because `--foreground` already carries both themes. -->
		<span class="bar h-8 w-1.5 rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* `scaleY` runs 0.3 → 1 → 0.3 over three equal intervals — evenly spaced stops whose first
	   and last values match. */
	@keyframes loader-bouncing-bars-squeeze {
		0%,
		100% {
			transform: scaleY(0.3);
		}
		50% {
			transform: scaleY(1);
		}
	}

	.bar {
		--duration: 1s;
		/* The stagger, `delay: i * 0.2`. */
		--stagger: 0.2s;

		/* The rest state: 0.3 / 0.58 / 0.86, the staircase this trio would really be caught on. With
		   `animation-delay: i*0.2s - 1s` a bar's phase on the first painted frame is `1 - 0.2i`, and
		   the keyframe triangle above evaluated there is exactly `0.3 + 0.28i`. The 0.3 is the
		   keyframes' own minimum and the 0.28 is 0.7 of swing spent over each 0.2s of the 1s cycle —
		   two spellings of one fact, and nothing will warn you when they drift. */
		transform: scaleY(calc(0.3 + var(--index) * 0.28));

		animation: loader-bouncing-bars-squeeze var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: no wind-up on mount, and the phase ORDER —
		   which is the direction the squeeze travels along the row — is kept. Negating each delay
		   instead would reverse it. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
