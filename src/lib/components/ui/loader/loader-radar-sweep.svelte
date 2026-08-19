<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A radar scope: two faint range rings, a centre pip, and a wedge of light sweeping round.
	 *
	 * THERE IS NO `theme` PROP. This kit themes through the `dark` class on the document, so a prop
	 * that decided light-or-dark would be a second source of truth free to disagree with it. The
	 * sweep is a single token ramp instead, correct in both themes.
	 *
	 * THE SWEEP IS ONE ALPHA RAMP ON `--foreground`: one ink getting brighter towards the leading
	 * edge — a ramp in weight rather than in hue — running 2% through 10% to 45% over the last half
	 * of the turn. Written with `color-mix(in oklab, …)`, which is what Tailwind emits for a `/45`
	 * suffix; a token is a colour value, not a channel triple. The `transparent 50%` stop is where
	 * the wedge ends, and it has to reach nothing.
	 *
	 * ONE HAIRLINE WEIGHT, NOT TWO. The rim and the two range rings are all hairlines on the page
	 * ground and this kit has one hairline token, so all three take `border-border`.
	 * `border-border/50` on the range rings would make them a touch quieter at the cost of giving
	 * this catalog two hairline weights, and a hairline is exactly the thing that should look the
	 * same everywhere.
	 *
	 * The pip is the primary mark at a soft alpha, `bg-foreground/80`.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<!--
	`overflow-hidden` is load-bearing: the sweep is a square conic gradient
	filling the box, and the rounded clip is what turns it into a scope rather than a spinning
	square. The rings and the pip are `absolute` with no offsets — an absolutely positioned child of
	a centring flex container gets the ALIGNED static-position rectangle, so they land concentric
	without an `inset` of their own, the same way `loader-clock-spinner.svelte`'s hands do.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="radar-sweep"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"relative flex size-12 items-center justify-center overflow-hidden rounded-full border border-border",
		className,
	)}
>
	<span class="absolute size-8 rounded-full border border-border"></span>
	<span class="absolute size-4 rounded-full border border-border"></span>
	<span class="absolute size-1.5 rounded-full bg-foreground/80"></span>
	<span class="sweep absolute inset-0"></span>
</div>

<style>
	@keyframes loader-radar-sweep-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.sweep {
		/* The wedge: nothing for the first half of the turn, then the token brightening towards the
		   leading edge. */
		background-image: conic-gradient(
			from 0deg,
			transparent 50%,
			color-mix(in oklab, var(--foreground) 2%, transparent) 65%,
			color-mix(in oklab, var(--foreground) 10%, transparent) 85%,
			color-mix(in oklab, var(--foreground) 45%, transparent) 100%
		);

		/* The rest state, and the only thing visible under `prefers-reduced-motion: reduce` (the
		   shared rule in `src/app.css` stops the animation but does not choose what it stops on). The
		   scope is the same picture at every angle, so this is the frame the animation starts on: the
		   leading edge at twelve o'clock, its wedge trailing back anticlockwise — a radar caught
		   mid-sweep rather than an empty circle. Never seen while the animation runs, because the
		   keyframes declare `transform` at both ends. */
		transform: rotate(0deg);

		animation: loader-radar-sweep-spin 1.8s linear infinite;
	}
</style>
