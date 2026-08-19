<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two dots trading places along a short track and back again.
	 *
	 * THE TWO DOTS ARE DELIBERATELY DIFFERENT WEIGHTS: one is
	 * the primary mark (`bg-foreground`) and the other
	 * the quiet one (`bg-muted-foreground`). Flattening them to one token would
	 * make the swap unreadable — with two identical dots crossing, nothing tells you which ended up
	 * where, and the loader becomes a shuttle rather than a swap.
	 *
	 * THE ENDPOINTS ARE PER DOT, not a shared keyframe plus a half-cycle delay. The two runs are
	 * mirror images, so a negative delay would produce the same crossing — but it would also give
	 * both dots the SAME rest position, and under reduced motion they would freeze stacked on top of
	 * each other in the middle of the track. `loader-liquid-dots.svelte` splits its endpoints for
	 * exactly this reason; this file does the same with one `--to` per side.
	 *
	 * Other divergences: `w-4 h-4` is `size-4`; the 32px travel is `2rem`, the same distance in this
	 * theme's 16px root.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<!-- The 48px × 16px track holds two 16px dots anchored to its ends, so each dot has
     32px to cross to reach the other end — which is exactly the `x` it animates. Both the track and
     the dots are `rem`-based (`w-12` / `size-4`), so the `2rem` endpoints below stay 48 − 16 at any
     root font size, where a literal 32px would not. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="swapping-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex h-4 w-12 items-center", className)}
>
	<span class="dot dot-left absolute left-0 size-4 rounded-full bg-foreground"></span>
	<span class="dot dot-right absolute right-0 size-4 rounded-full bg-muted-foreground"></span>
</div>

<style>
	/* The swap, 0 → ±32px → 0, over two equal intervals. One keyframe serves both dots; the
	   endpoint comes from the element, because `var()` inside `@keyframes` is substituted against the
	   animated element — the mechanism `loader-liquid-dots.svelte` uses for its pair. */
	@keyframes loader-swapping-dots-swap {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(var(--to));
		}
	}

	.dot {
		/* The rest state: each dot parked at its own end of the track. Unlike a spinner, a swap has a
		   real resting pose — the two objects at the positions they started from — so freezing them
		   mid-crossing would read as broken rather than as paused. `loader-newtons-cradle.svelte`
		   makes the same call for its row of four. */
		transform: translateX(0);

		/* `ease-in-out` is the bare CSS keyword, cubic-bezier(0.42, 0, 0.58, 1). */
		animation: loader-swapping-dots-swap 1.5s ease-in-out infinite;
	}

	/* Fixed endpoints, so they live here rather than being passed in from the markup: two named
	   classes cannot be pruned the way an `:nth-of-type` chain might. 2rem is the 32px travel. */
	.dot-left {
		--to: 2rem;
	}

	.dot-right {
		--to: -2rem;
	}
</style>
