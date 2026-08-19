<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two half-rings, one inside the other, turning against each other at the same speed.
	 *
	 * Each ring is a full circle with two adjacent sides made transparent, which leaves a 180° arc —
	 * `border-b-transparent border-r-transparent` on the outer one, `border-t-transparent
	 * border-l-transparent` on the inner. Those are geometry, not colour,
	 * and they are what makes the counter-rotation legible: the two arcs start on opposite sides and
	 * cross twice a turn.
	 *
	 * `border-zinc-800 dark:border-zinc-700` is a solid ink ring — the visible object, not a hairline
	 * — so it takes `border-foreground`; `border-zinc-400` is a quiet mark, `border-muted-foreground`.
	 * The two weights are what keeps the inner arc from reading as part of the outer one.
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

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="twin-orbit"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-12", className)}
>
	<span
		class="arc arc-outer absolute inset-0 rounded-full border-2 border-foreground border-r-transparent border-b-transparent"
	></span>
	<span
		class="arc arc-inner absolute inset-2 rounded-full border-2 border-muted-foreground border-t-transparent border-l-transparent"
	></span>
</div>

<style>
	/* One keyframe pair for both rings; the direction is a custom property, so the inner ring gets
	   its counter-rotation without a second `@keyframes`. A `var()` inside
	   a keyframe is substituted against the animated element, which is what lets two rings share one
	   motion and not its endpoint. */
	@keyframes loader-twin-orbit-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(var(--turn));
		}
	}

	.arc {
		/* The rest state, for `prefers-reduced-motion: reduce` (the shared rule in `src/app.css`
		   stops the animation but does not choose what it stops on). Both rings freeze on the frame
		   the animation starts on, where the two arcs sit on opposite halves of the circle — the pose
		   that reads most obviously as two rings rather than one. Never seen while the animation
		   runs: the keyframes declare `transform` at both ends. */
		transform: rotate(0deg);

		/* Both rings run the same 1.5s cycle; only the sign
		   differs, so the pair is symmetric and never drifts out of phase. */
		animation: loader-twin-orbit-spin 1.5s linear infinite;
	}

	.arc-outer {
		--turn: 360deg;
	}

	.arc-inner {
		--turn: -360deg;
	}
</style>
