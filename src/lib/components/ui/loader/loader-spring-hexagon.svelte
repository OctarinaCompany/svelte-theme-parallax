<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A hexagon that springs a sixth of a turn, swelling as it goes.
	 *
	 * THIS FILE FIXES THE SPRING FOR THE WHOLE FOLDER. The motion these loaders want is a damped
	 * spring — the kind a physics engine produces by running a damped harmonic oscillator every
	 * frame. There is no such thing in CSS, and the four spring loaders — this one,
	 * `cube-flip-spring`, `diamond-rotate-spring`, `haptic-ring` — all want a gentle bounce, which
	 * in every case is a single visible overshoot and settle rather than a train of bounces. One
	 * overshoot is exactly what a cubic-bezier with a control point above 1 does, so one curve
	 * answers all of them, `--ease-loader-spring` in `src/app.css`:
	 * cubic-bezier(0.34, 1.56, 0.64, 1), easings.net's easeOutBack, ~10% past the target and back.
	 *
	 * It is one shared token rather than a value per component because 128 loaders each inventing a
	 * bounce is 128 different springs, and the eye reads inconsistency across a gallery long before
	 * it reads any individual curve.
	 *
	 * THE OVERSHOOT IS PER INTERVAL, which is why the keyframes are written as three stops and not
	 * as one. A timing function is applied between each adjacent pair of keyframes, so 0→50% swells
	 * past 1.15 and settles onto it, and 50→100% dips below 1 and settles onto it — a spring out and
	 * a spring back. Collapsing this into a two-stop animation with `alternate` would put the
	 * overshoot on the wrong side of the swell.
	 *
	 * THE 60° IS LOAD-BEARING. The animation loops rather than
	 * alternates, so the last frame snaps back to the first — 60° back to 0°. On a regular hexagon
	 * those two are the same picture, so the snap is invisible and the shape appears to rotate
	 * forever in one direction. Change the polygon and this loader develops a stutter.
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
	data-loader="spring-hexagon"
	{role}
	aria-label={ariaLabel}
	class={cn("size-10", className)}
>
	<svg class="hexagon size-full" viewBox="0 0 50 50" aria-hidden="true">
		<polygon points="25,5 45,15 45,35 25,45 5,35 5,15" class="fill-foreground" />
	</svg>
</div>

<style>
	@keyframes loader-spring-hexagon-pulse {
		0% {
			transform: rotate(0deg) scale(1);
		}
		50% {
			transform: rotate(60deg) scale(1.15);
		}
		100% {
			transform: rotate(60deg) scale(1);
		}
	}

	.hexagon {
		/* The rest state: the shape as drawn. Nothing to add for reduced motion beyond the shared
		   root pulse in `src/app.css`. */
		transform: rotate(0deg) scale(1);

		/* `transform-origin` is stated rather than left to the initial value because the reference
		   box for an `<svg>` is `transform-box: view-box`, and reading `center` off the 0 0 50 50
		   viewport is a different sentence from reading it off the 40×40 border box — they agree
		   here, and saying which one is meant keeps them agreeing if the viewBox ever changes. */
		transform-origin: center;

		animation: loader-spring-hexagon-pulse 2s var(--ease-loader-spring) infinite;
	}
</style>
