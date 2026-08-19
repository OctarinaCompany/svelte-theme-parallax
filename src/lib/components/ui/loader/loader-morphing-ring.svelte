<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A bordered square that rounds itself into a circle and back while it turns.
	 *
	 * TWO ANIMATIONS, NOT ONE KEYFRAME SET, because the two channels have different shapes.
	 * The half-turn is a single ramp, i.e. ONE interval across the whole
	 * 2s with `ease-in-out` applied once; the morph — `border-radius` 10% → 50% → 10% — is
	 * TWO intervals with `ease-in-out` applied to each. Merging them into one three-stop set would
	 * ease the rotation twice and leave the square visibly stalling at 90°. A comma-separated pair of
	 * animations on one element keeps each channel's own timing, and the two
	 * cannot desynchronise because they share a duration and a start.
	 *
	 * THE 180° IS LOAD-BEARING. The animation loops rather than
	 * alternates, so the last frame snaps back to the first — 180° back to 0°. A square is unchanged
	 * by a half turn, so the snap is invisible and the shape appears to turn forever one way.
	 * `loader-spring-hexagon.svelte` records the same trick at 60° on a hexagon.
	 *
	 * Decisions worth naming:
	 * - `border-zinc-800 dark:border-zinc-700` is an opaque ink ring at full opacity — the visible
	 *   object of the loader, not a hairline — so it takes `border-foreground`. `border-border` here
	 *   would paint a near-invisible square.
	 * - The animated element is an inner `<span>` rather than the root. A Svelte scoped rule is
	 *   unlayered and so outranks any utility, which would let this file's `transform` and
	 *   `border-radius` silently beat a caller's `class` on the root; `loader-gradient-arc.svelte`
	 *   keeps its painted layer off the root for the same reason.
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
	data-loader="morphing-ring"
	{role}
	aria-label={ariaLabel}
	class={cn("flex size-10 items-center justify-center", className)}
>
	<span class="morph size-full border-[3px] border-foreground"></span>
</div>

<style>
	/* The half-turn: one interval, one easing pass, and a snap home that a square hides. */
	@keyframes loader-morphing-ring-turn {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(180deg);
		}
	}

	/* The morph: `border-radius` 10% → 50% → 10% over two equal intervals. */
	@keyframes loader-morphing-ring-morph {
		0%,
		100% {
			border-radius: 10%;
		}
		50% {
			border-radius: 50%;
		}
	}

	.morph {
		--duration: 2s;

		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on). A quarter of the way through the cycle: a
		   squircle on the tilt, which is a pose neither channel ever rests at and so reads as motion
		   held still. Frame 0 — an upright square with barely-rounded corners — would read as a
		   deliberate static box instead. Never seen while the animation runs, because both keyframe
		   sets declare their property at 0% and at 100%. */
		transform: rotate(45deg);
		border-radius: 30%;

		/* `ease-in-out` is exactly CSS's keyword and not Tailwind's
		   `--ease-in-out`. */
		animation:
			loader-morphing-ring-turn var(--duration) ease-in-out infinite,
			loader-morphing-ring-morph var(--duration) ease-in-out infinite;
	}
</style>
