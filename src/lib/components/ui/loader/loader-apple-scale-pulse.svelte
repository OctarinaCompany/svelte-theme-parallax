<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A solid centre dot throwing off two expanding rings.
	 *
	 * THE RINGS ARE A TRACK COLOUR AT DOUBLE THE TRACK WEIGHT, BECAUSE THE ANIMATION SPENDS IT.
	 * An expanding ring is an unlit track by role, which is the token map's
	 * `bg-muted-foreground/20`. That is the right ROW and the wrong ALPHA here, because unlike a
	 * progress track these rings are also fading: the class alpha is multiplied by the keyframes'
	 * opacity, and what a reader sees is the product. At `/20` the product was measured in Chrome on
	 * the gallery's `bg-card` tile — 16 frames over 5.4s — and NO pixel changed by more than 14/255 in
	 * dark or 16/255 in light over a whole run: the tile read as a static dot. `/40`, with the
	 * keyframe fix below, restores the ring — the same probe now sees a swing of 42/255 dark and
	 * 51/255 light, over 8000 of the box's pixels moving by at least 20/255 where none did before. It
	 * is still well under the centre dot's 227/255, so the rings do not swamp the mark they radiate
	 * from — the two changes are separable and both were needed: with the new keyframes but the ink
	 * left at `/20`, the swing measured 23/255 in dark and no pixel moved by 32/255. The dot itself
	 * is `bg-zinc-800 dark:bg-white` and becomes `bg-foreground`.
	 *
	 * SCALE AND OPACITY RUN AS TWO ANIMATIONS ON TWO CURVES, which is the other half of the same
	 * defect. Pairing `scale: 0 → 1` with `opacity: 1 → 0` on one shared curve means
	 * the ring carries all of its ink at scale 0 — where it has NO AREA — and has grown to full size
	 * only once its ink is gone. Every pixel it ever covers is covered at part strength. Writing that
	 * pair literally is why the loader measured static. So the ring is born at 35% of full size, and
	 * the fade holds near full strength through the first half of the run before dropping: the ring
	 * has ink while it has area, which is the picture, rather than the two being in opposition. The
	 * growth keeps its `ease-out`; the fade is linear, because a shared curve is exactly what
	 * tied the two together.
	 *
	 * THE SECOND RING'S DELAY IS SHIFTED BACK ONE WHOLE CYCLE. `delay: 0.5`
	 * written straight into `animation-delay` would park that ring at its
	 * birth size for the first half second, so the loader would emit one ring, pause, and only then
	 * settle into its rhythm. Subtracting the full 1.5s duration makes both delays negative, and a
	 * negative delay seeks the animation backwards: the first painted frame is already the steady
	 * state, with one ring just born and the other well on its way out. (The reduced-motion pose in
	 * the block below deliberately freezes a later instant than that one — see the note there.)
	 *
	 * Neither ramp returns to where it started, so each ends with a hard snap at the loop point —
	 * which is exactly what a ripple is: the ring reaches the edge, vanishes, and a new one starts at
	 * the centre.
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
	data-loader="apple-scale-pulse"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-12 items-center justify-center", className)}
>
	<span class="ripple ripple-1 absolute size-full rounded-full bg-muted-foreground/40"></span>
	<span class="ripple ripple-2 absolute size-full rounded-full bg-muted-foreground/40"></span>
	<span class="z-10 size-3 rounded-full bg-foreground"></span>
</div>

<style>
	/* The growth ramp: up to full size, starting at 35% rather than 0. A ring at scale 0
	   has no area, so the opacity it carries there buys nothing; starting it visible is what lets the
	   ink and the area coincide. */
	@keyframes loader-apple-scale-pulse-grow {
		from {
			transform: scale(0.35);
		}
		to {
			transform: scale(1);
		}
	}

	/* The fade, 1 → 0, held near full for the first half of the run instead of falling
	   from the first frame. The hold is what buys the growth its ink: the ring is still at 85%
	   strength while it crosses the radii where it is widest and most of its pixels are new. */
	@keyframes loader-apple-scale-pulse-fade {
		0% {
			opacity: 1;
		}
		55% {
			opacity: 0.85;
		}
		100% {
			opacity: 0;
		}
	}

	.ripple {
		--duration: 1.5s;

		/* The rest state, per ring, set by the modifier classes below. Never seen while the animations
		   run, because between them they declare both properties at `from` and at `to`. */
		opacity: var(--rest-opacity);
		transform: scale(var(--rest-scale));

		/* Two animations, because the two properties must NOT share a curve — that sharing is what
		   made the ring brightest where it was smallest. `ease-out` — cubic-bezier(0, 0, 0.58, 1) —
		   is written as the bare CSS keyword rather than through a
		   utility, because Tailwind v4 redefines `--ease-out` as a Material curve that is not this
		   one. The fade is `linear` so its own keyframe stops decide its shape.
		   The delay is shifted back one whole cycle: same phase order, no wind-up. */
		animation:
			loader-apple-scale-pulse-grow var(--duration) ease-out infinite,
			loader-apple-scale-pulse-fade var(--duration) linear infinite;
		animation-delay: calc(var(--delay) - var(--duration));
	}

	/* THE FROZEN FRAME IS THE CYCLE AT t = 1s, NOT AT MOUNT. Ring two trails ring one by 0.5s of a
	   1.5s cycle, i.e. by a third of it, so at the mount instant ring one is at phase 0 — its
	   smallest — and the pair reads as one ring and a shadow of one. Advancing the frozen instant by
	   1s puts ring one at phase 2/3 and ring two at phase 1/3: two rings at two radii, BOTH still
	   inked, which is the picture this loader actually is. It is still a real frame of its own
	   animation, just a later one.

	   The numbers are the two ramps above read at those phases. Growth: cubic-bezier(0, 0, 0.58, 1)
	   is at 0.844 by phase 2/3 and 0.488 by phase 1/3, and the ring spans 0.35 to 1, so
	   `0.35 + 0.65 x`. Fade: the linear stops give 0.85 - 0.85 x (p - 0.55) / 0.45 after the hold and
	   1 - 0.15 p / 0.55 inside it. They restate the keyframes; change one, change both. */
	.ripple-1 {
		--delay: 0s;
		--rest-scale: 0.899;
		--rest-opacity: 0.63;
	}

	.ripple-2 {
		--delay: 0.5s;
		--rest-scale: 0.667;
		--rest-opacity: 0.909;
	}
</style>
