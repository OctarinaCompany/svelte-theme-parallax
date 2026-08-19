<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three stacked bars stretching out from a shared left edge, one after the other.
	 *
	 * THE NAME IS A RED HERRING: this loader takes plain `ease-in-out`, NOT the shared spring
	 * curve — `--ease-loader-spring` belongs to the four loaders that really do want a spring, and
	 * borrowing it here would add an overshoot this design never draws.
	 *
	 * Decisions worth naming:
	 * - The bars are one semantic token, `bg-foreground`, which carries both themes on its own.
	 * - An unshifted delay winds up: a positive `animation-delay` would hold each bar at its base
	 *   width until it elapses. Every delay is shifted back one whole cycle instead — same phase
	 *   order, no wind-up, and the sweep still runs top to bottom rather than bottom to top.
	 *
	 * `scaleX` is the right spelling: the bars are `origin-left`, so the transform
	 * is exactly the picture, it is composited rather than laid out, and nothing here needs the
	 * layout-property exemption its siblings in this folder claim.
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

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="spring-bars"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-10 flex-col justify-center gap-2", className)}
>
	{#each bars as index (index)}
		<span class="bar h-1.5 origin-left rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* `scaleX` runs 0.2 → 1 → 0.2 over three equal intervals, its stops evenly spaced. First and last are the same value, which is why they share a
	   selector. */
	@keyframes loader-spring-bars-stretch {
		0%,
		100% {
			transform: scaleX(0.2);
		}
		50% {
			transform: scaleX(1);
		}
	}

	.bar {
		--duration: 1.4s;
		--stagger: 0.15s; /* the stagger `delay: i * 0.15` */

		/* The rest state: the keyframe triangle evaluated at each bar's phase on the first painted
		   frame. With the whole cycle subtracted below that phase is `1 - i * 0.15 / 1.4`, which never
		   passes the peak, so the ramp comes out exactly linear — 0.2, 0.37, 0.54, a staircase rather
		   than three bars of one length. The 0.2 and the 0.8 it spans are the keyframe's two stops. */
		transform: scaleX(calc(0.2 + var(--index) * 0.1714));

		animation: loader-spring-bars-stretch var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
