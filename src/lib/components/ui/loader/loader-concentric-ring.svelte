<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three broken rings nested inside one another, each turning at its own speed and the middle one
	 * against the other two.
	 *
	 * THE THREE RINGS ARE THREE WEIGHTS, and the token map has a row for each. The outer ring is
	 * solid ink — the primary mark — so it takes
	 * `border-foreground`; the middle one is a quiet mark, `border-muted-foreground`;
	 * the inner one is an unlit ring, `border-muted-foreground/20`. That descending ladder is the
	 * whole design of the loader: three rings of one colour would read as a single thick ring with
	 * gaps in it.
	 *
	 * `border-*-transparent` on each ring is geometry, not colour — it is what cuts the gap that
	 * makes the rotation visible — one gap per ring and
	 * each on a different side.
	 *
	 * The rings are inner elements rather than the root, so a caller's `class` and the a11y
	 * attributes never sit on something that spins.
	 *
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
	The rings are `absolute` inside a centring flex container and carry no offsets of their own: an
	absolutely positioned child's static-position rectangle is the ALIGNED one, so each ring lands
	concentric with the others without a single `inset` or `left`. `loader-clock-spinner.svelte`
	depends on the same behaviour for its hands.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="concentric-ring"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-12 items-center justify-center", className)}
>
	<span
		class="circle circle-outer absolute size-12 rounded-full border-2 border-foreground border-t-transparent"
	></span>
	<span
		class="circle circle-middle absolute size-8 rounded-full border-2 border-muted-foreground border-b-transparent"
	></span>
	<span
		class="circle circle-inner absolute size-4 rounded-full border-2 border-muted-foreground/20 border-l-transparent"
	></span>
</div>

<style>
	/* One keyframe pair for all three rings; the direction is a custom property, so the middle ring
	   gets its counter-rotation without a second `@keyframes`. A
	   `var()` inside a keyframe is substituted against the animated element, which is what lets three
	   rings share one motion and not its endpoint. */
	@keyframes loader-concentric-ring-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(var(--turn));
		}
	}

	.circle {
		/* The rest state, for `prefers-reduced-motion: reduce` (the shared rule in `src/app.css`
		   stops the animation but does not choose what it stops on). Every angle shows the same
		   picture, so this is the frame the animation starts on — and because the three gaps face
		   three different ways, the frozen frame still reads as three separate rings rather than one
		   ring with a notch. Never seen while the animation runs: the keyframes declare `transform`
		   at both ends. */
		transform: rotate(0deg);
		animation: loader-concentric-ring-spin var(--duration) linear infinite;
	}

	/* Three durations and two directions. Named
	   classes rather than an `:nth-of-type` chain, so a reader can see which ring is which. */
	.circle-outer {
		--duration: 2s;
		--turn: 360deg;
	}

	.circle-middle {
		--duration: 1.5s;
		--turn: -360deg;
	}

	.circle-inner {
		--duration: 1s;
		--turn: 360deg;
	}
</style>
