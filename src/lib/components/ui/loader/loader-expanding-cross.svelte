<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A horizontal bar and a vertical one taking turns to stretch across a 32px box.
	 *
	 * TWO KEYFRAMES, NOT ONE PLUS A DELAY — even though this is one shape animated twice.
	 * `scaleX: 0.2 → 1 → 0.2` and `scaleY: 0.2 → 1 → 0.2` are different
	 * axes, so they cannot share a keyframe; the half-cycle offset between them is a
	 * `delay: 0.75` against a 1.5s duration, translated the usual way.
	 *
	 * THE DELAY IS SHIFTED BACK A WHOLE CYCLE: `0.75s − 1.5s = −0.75s`. A positive delay would hold
	 * the vertical bar at its start value for three quarters of a second on mount, so the cross would
	 * visibly wind up; a negative delay seeks the animation backwards instead, and the first painted
	 * frame is already the steady state. Each bar still declares its own rest state below, because
	 * they animate different axes and a rest value names the property it freezes.
	 *
	 * `scaleX`/`scaleY` RATHER THAN `width`/`height` — the cheap
	 * choice: these are composited, a size change is laid out every frame. The bars' round caps do
	 * stretch into ellipses at the extremes — the price of the transform, and a barely visible one
	 * at this size.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="expanding-cross"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-8", className)}
>
	<!--
		`bg-zinc-800 dark:bg-white` → `bg-foreground` on both bars: they are the loader. The negative
		margins are geometry, not spacing — half the bar's own 4px thickness, pulling it back onto the
		centre line it is positioned against.
	-->
	<span class="bar bar-across absolute top-1/2 left-0 -mt-0.5 h-1 w-full rounded-full bg-foreground"
	></span>
	<span class="bar bar-down absolute top-0 left-1/2 -ml-0.5 h-full w-1 rounded-full bg-foreground"
	></span>
</div>

<style>
	/* `[0.2, 1, 0.2]` starts and ends on the same value, so it is a `0%, 100%` / `50%` pair rather
	   than a `from`/`to` snap. */
	@keyframes loader-expanding-cross-stretch-x {
		0%,
		100% {
			transform: scaleX(0.2);
		}
		50% {
			transform: scaleX(1);
		}
	}

	@keyframes loader-expanding-cross-stretch-y {
		0%,
		100% {
			transform: scaleY(0.2);
		}
		50% {
			transform: scaleY(1);
		}
	}

	.bar {
		--duration: 1.5s;

		animation-duration: var(--duration);
		animation-timing-function: ease-in-out; /* the CSS keyword exactly */
		animation-iteration-count: infinite;
	}

	/* THE REST FRAME IS THE QUARTER-CYCLE ONE, AND IT IS THE ONLY FRAME THAT IS A CROSS. The bars are
	   half a cycle apart, so at any instant one is long and the other is the 6.4px stub `scaleX(0.2)`
	   leaves of a 32px bar — measured at 4x in Chrome, the first painted frame is a 4px vertical bar
	   with a nub across it, not a cross, whichever bar gets the long half. A quarter cycle in, both
	   are exactly midway instead: `ease-in-out` is symmetric (cubic-bezier(0.42, 0, 0.58, 1) passes
	   through 0.5, 0.5), so half way along an interval is half the value swing, and `0.2 + 0.8 / 2`
	   is 0.6 on BOTH axes — one bar rising through it, the other falling. That is a real simultaneous
	   frame of this animation, and it draws a plus sign with 19.2px arms. The 0.2 and the 1 it
	   averages are the keyframes' own stops above; change one, change both. */
	.bar-across {
		transform: scaleX(0.6);
		animation-name: loader-expanding-cross-stretch-x;
	}

	.bar-down {
		transform: scaleY(0.6);
		animation-name: loader-expanding-cross-stretch-y;
		/* The stagger `delay: 0.75` less one whole duration: same phase, no wind-up on mount. */
		animation-delay: calc(0.75s - var(--duration));
	}
</style>
