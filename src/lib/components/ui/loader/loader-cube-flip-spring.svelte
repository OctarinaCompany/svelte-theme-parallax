<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A rounded tile that flips end over end, then flips sideways.
	 *
	 * ONE SPRING FOR THE WHOLE FOLDER. The motion this wants is a gentle damped spring —
	 * a damped-oscillator solver CSS does not have. At this
	 * bounce it is one visible overshoot and a settle, which is exactly what a cubic-bezier with a
	 * control point above 1 does — so this file uses `--ease-loader-spring` from `src/app.css`, the
	 * same curve `loader-spring-hexagon.svelte` fixed for every spring in the folder. Do not invent a
	 * second one here: a gallery of loaders each bouncing slightly differently reads as broken long
	 * before any one of them reads as wrong.
	 *
	 * THE OVERSHOOT LANDS PER INTERVAL, which is why the three stops are written out rather than
	 * collapsed. A timing function applies between each adjacent pair of keyframes, so the tile
	 * overshoots and settles on the X flip, then again on the Y flip.
	 *
	 * NO `perspective`, NO `transform-style: preserve-3d`. CSS adds neither one
	 * implicitly, so the flip renders deliberately flat — the tile foreshortens to
	 * a line at 90° and comes back. That flatness is the picture, not an omission.
	 *
	 * THE FINAL POSE IS THE FIRST POSE. `repeat: Infinity` loops rather than alternates, so 100%
	 * snaps back to 0%: rotateX(180°) composed with rotateY(180°) is a half-turn in the plane, and a
	 * square tile with four equal corners is its own image under one. The snap is invisible.
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
	data-loader="cube-flip-spring"
	{role}
	aria-label={ariaLabel}
	class={cn("size-8", className)}
>
	<span class="cube block size-full rounded-lg bg-foreground"></span>
</div>

<style>
	/* Two flips — `rotateX` 0 → 180 → 180 and `rotateY` 0 → 0 → 180 — three values each, so three
	   equal intervals, merged onto one `transform`, because CSS has only the one property and
	   two separate animations of it would overwrite each other rather than compose. */
	@keyframes loader-cube-flip-spring-flip {
		0% {
			transform: rotateX(0deg) rotateY(0deg);
		}
		50% {
			transform: rotateX(180deg) rotateY(0deg);
		}
		100% {
			transform: rotateX(180deg) rotateY(180deg);
		}
	}

	.cube {
		/* The rest state: the tile face-on, unflipped. Both rotations are declared at 0% and 100%
		   above, so this value never shows while the animation runs. */
		transform: rotateX(0deg) rotateY(0deg);

		animation: loader-cube-flip-spring-flip 2s var(--ease-loader-spring) infinite;
	}
</style>
