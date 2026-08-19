<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A dot falling onto a soft pad and springing back.
	 *
	 * THE SQUASH IS THE POINT, so the non-uniform scale stays non-uniform: `scaleY`
	 * runs to 1.2 and `scaleX` to 0.8 at the bottom of the fall, which stretches the
	 * `rounded-full` dot into an ellipse along its direction of travel. That is the classic
	 * squash-and-stretch read, not the corner distortion the layout-property exemption exists to
	 * avoid — so it stays a `transform`, which is also the cheap composited path.
	 *
	 * ONE `transform`, THREE RAMPS. `y`, `scaleY` and `scaleX` are three conceptually separate
	 * motions on one element; CSS has a single `transform` property, so they merge into one
	 * keyframe per stop. Running them as three animations would let them desynchronise.
	 *
	 * THE EASING IS PER LEG, BECAUSE THE MOTION IS PHYSICAL. One shared curve
	 * applied to both legs of
	 * `y: 0 → 24 → 0` would make the rise back up accelerate too — the dot lingering squashed on the pad
	 * and then whipping into the ceiling. Nothing falls or rebounds like that. A CSS timing function
	 * declared inside a keyframe block governs the interval that STARTS there, so here the fall
	 * takes `cubic-bezier(0.55, 0, 1, 0.45)` — easeInCirc, gravity gathering into the impact —
	 * and the rise takes `--ease-loader-swing-out` from `src/app.css`, the quarter-cosine a rebound
	 * really follows: fast off the pad, coming to rest at the top. `loader-newtons-cradle.svelte` is
	 * the same move on a pendulum, and the element-level function is `linear` there and here so that
	 * every override is visible.
	 *
	 * The pad is an unlit track by role, so it
	 * takes `bg-muted-foreground/20`; the dot is the mark and takes `bg-foreground`.
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
	data-loader="drop-dot"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex h-12 w-6 flex-col items-center", className)}
>
	<span class="drop absolute top-0 z-10 size-2.5 rounded-full bg-foreground"></span>
	<!-- `blur-[1px]` is a filter, not a colour: it softens the pad into a contact
	     shadow rather than a second solid mark. -->
	<span class="absolute bottom-2 h-1 w-4 rounded-full bg-muted-foreground/20 blur-[1px]"></span>
</div>

<style>
	/* Three ramps — `y` 0 → 24px → 0, `scaleY` 1 → 1.2 → 1, `scaleX` 1 → 0.8 → 1 — three values
	   each, equal intervals, so the impact is at 50%. Every ramp starts and ends on the same value, so the
	   loop point is seamless. */
	@keyframes loader-drop-dot-fall {
		0% {
			transform: translateY(0) scale(1, 1);
			animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45); /* falling: easeInCirc */
		}
		50% {
			transform: translateY(24px) scale(0.8, 1.2);
			/* rebounding: off the pad hard, running out of speed at the top */
			animation-timing-function: var(--ease-loader-swing-out);
		}
		100% {
			transform: translateY(0) scale(1, 1);
		}
	}

	.drop {
		/* The rest state, and what reduced motion leaves on screen: the dot down on the pad, stretched
		   by the landing. That is both a real frame of this animation and the pose a falling object
		   actually comes to rest in — freezing it at the top of the box would read as a dot with an
		   unexplained smudge below it. The two numbers restate the 50% keyframe above; change one,
		   change both. */
		transform: translateY(24px) scale(0.8, 1.2);

		/* Overridden at both intervals that matter; see the component comment. */
		animation: loader-drop-dot-fall 1s linear infinite;
	}
</style>
