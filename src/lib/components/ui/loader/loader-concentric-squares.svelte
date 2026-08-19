<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two nested square rings that turn a quarter-turn against each other, one shrinking as the other
	 * swells.
	 *
	 * THE TWO BORDERS ARE MARKS, NOT HAIRLINES. The two `border-2` rings
	 * are opaque ink — they are the whole visible object here, so
	 * they take `border-foreground` and `border-muted-foreground`. `border-border` is reserved for a
	 * hairline written with an alpha suffix, and using it here would leave two rings you cannot see.
	 *
	 * EACH RING IS TWO ELEMENTS BECAUSE ITS TWO RAMPS DO NOT SHARE A STOP SET. The rotation is
	 * `rotate: 0 → 90 → 90` — three values, so 0% / 50% / 100% — and the pulse is `scale: 1 → 1 →
	 * 0.8 → 1` — four values, so 0% / 33.3% / 66.7% / 100%.
	 * Merging them onto CSS's single `transform` would mean sampling each curve at the other's stops,
	 * and the cost is not the invented numbers, it is the easing: `ease-in-out` applies to the
	 * interval between every adjacent pair of keyframes, so an injected stop is a point where the
	 * property momentarily comes to a stop. Merged, this loader would stall three times a cycle —
	 * once mid-rotation and twice mid-scale — instead of sweeping straight through.
	 *
	 * So the rotation lives on an outer wrapper and the scale on the ring inside it, each with the
	 * stops its own array actually names. `loader-spring-hexagon.svelte` merges instead, and is right
	 * to: there the two arrays share one stop set, so merging invents nothing. Nesting is safe here
	 * for the reason that is easy to miss — the scale is UNIFORM, and a uniform scale commutes with a
	 * rotation, so `rotate ∘ scale` on two elements is the same matrix as the single transform Motion
	 * builds. The two animations cannot drift either: same 2s duration, same start, no delay.
	 *
	 * THE 90° IS LOAD-BEARING, the same way `loader-spring-hexagon.svelte`'s 60° is. `repeat:
	 * Infinity` loops rather than alternates, so the last frame snaps back to the first — 90° back to
	 * 0°. A square is its own image under a quarter-turn, so the snap is invisible and the rings look
	 * as though they turn forever in opposite directions.
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
	data-loader="concentric-squares"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-12 items-center justify-center", className)}
>
	<span class="spin spin-cw absolute size-12">
		<span class="pulse pulse-shrink block size-full rounded-sm border-2 border-foreground"></span>
	</span>
	<span class="spin spin-ccw absolute size-6">
		<span class="pulse pulse-swell block size-full rounded-sm border-2 border-muted-foreground"
		></span>
	</span>
</div>

<style>
	/* The quarter-turn: 0 → 90 → 90 (or its negation) over three equal intervals, and
	   the direction is the only thing that differs between the two rings. */
	@keyframes loader-concentric-squares-turn {
		0% {
			transform: rotate(0deg);
		}
		50%,
		100% {
			transform: rotate(var(--turn));
		}
	}

	/* The pulse: `scale` 1 → 1 → 0.8 → 1 (or 1.2 on the inner ring), four equal intervals. The
	   outer ring shrinks while the inner one swells, so the gap between them closes from both sides
	   at once — again, only the middle value differs. */
	@keyframes loader-concentric-squares-pulse {
		0%,
		33.333% {
			transform: scale(1);
		}
		66.667% {
			transform: scale(var(--scale-mid));
		}
		100% {
			transform: scale(1);
		}
	}

	.spin {
		/* Half of the rest state: both rings square-on, which is what this object looks like when
		   nothing is turning. Both keyframe blocks declare their property at 0% and at 100%, so
		   neither rest value shows while the animations run. */
		transform: rotate(0deg);

		/* `ease-in-out` is the CSS keyword, cubic-bezier(0.42, 0, 0.58, 1),
		   NOT Tailwind's `--ease-in-out`. */
		animation: loader-concentric-squares-turn 2s ease-in-out infinite;
	}

	.pulse {
		/* The other half: both rings at their drawn size, concentric. */
		transform: scale(1);

		animation: loader-concentric-squares-pulse 2s ease-in-out infinite;
	}

	/* The per-ring endpoints, as named modifier classes rather than an `:nth-of-type` chain. */
	.spin-cw {
		--turn: 90deg;
	}

	.spin-ccw {
		--turn: -90deg;
	}

	.pulse-shrink {
		--scale-mid: 0.8;
	}

	.pulse-swell {
		--scale-mid: 1.2;
	}
</style>
