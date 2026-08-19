<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A lit arc that steps a quarter turn at a time around a quiet ring, overshooting each detent.
	 *
	 *
	 * ONE OF THE FOUR SPRINGS, AND IT TAKES THE PORT'S ONE SPRING CURVE.
	 * `type: "spring", bounce: 0.4` is a solver CSS does not have, and at that
	 * bounce it is a single visible overshoot and settle rather than a train of bounces — which is
	 * exactly what a cubic-bezier with a control point above 1 does. So this file uses
	 * `--ease-loader-spring` from `src/app.css`, the same curve `loader-spring-hexagon.svelte`
	 * establishes for the whole port. The overshoot applies per interval, which is why the four
	 * detents are written as four keyframes: each quarter turn springs past its stop and back, and
	 * that is the haptic click the loader is named for.
	 *
	 * The rotation runs 0 → 90 → 180 → 270 → 360, five values at equal
	 * intervals — 0%, 25%, 50%, 75%, 100%. The loop is seamless without any help: 360° and 0° are the
	 * same picture.
	 *
	 * Decisions worth naming:
	 * - `border-zinc-200 dark:border-zinc-800` is the unlit ring the arc steps around — a track, not
	 *   a mark — so it takes the `/20` weight, the same weight `ui/circular-progress`'s track uses.
	 *   `border-t-zinc-800 dark:border-t-white` is the mark: `border-t-foreground`.
	 * - The animated element is an inner `<span>` rather than the root, so this file's `transform`
	 *   cannot silently outrank a caller's `class` on the root (a Svelte scoped rule is unlayered).
	 *   `loader-gradient-arc.svelte` keeps its painted layer off the root for the same reason.
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
	data-loader="haptic-ring"
	{role}
	aria-label={ariaLabel}
	class={cn("flex size-10 items-center justify-center", className)}
>
	<span
		class="halo size-full rounded-full border-[3px] border-muted-foreground/20 border-t-foreground"
	></span>
</div>

<style>
	@keyframes loader-haptic-ring-step {
		0% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(90deg);
		}
		50% {
			transform: rotate(180deg);
		}
		75% {
			transform: rotate(270deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.halo {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on). Deliberately NOT one of the four detents:
		   this loader's whole subject is the step between them, and an arc parked squarely at twelve
		   o'clock reads as a designed static ring, while one sitting between two stops reads as
		   motion held still. Never seen while the animation runs, because the keyframes declare
		   `transform` at both ends. */
		transform: rotate(45deg);

		animation: loader-haptic-ring-step 2s var(--ease-loader-spring) infinite;
	}
</style>
