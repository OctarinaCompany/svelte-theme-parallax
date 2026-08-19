<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A square that hops off a soft shadow, squashing as it lands.
	 *
	 * Decisions worth naming:
	 * - `bg-zinc-800 dark:bg-white` on the square is the primary mark, `bg-foreground`.
	 * - `bg-zinc-200 dark:bg-zinc-800` on the shadow is not a mark at all — it is the unlit ground the
	 *   mark is read against — so it takes the track weight, `bg-muted-foreground/20`. A shadow
	 *   painted at full ink would compete with the square it belongs to.
	 *
	 * The three keyframe arrays merge into one `transform` per stop. CSS has a single `transform`
	 * property, and running the hop and the squash as separate animations would let them
	 * desynchronise — the square would be stretching on the way down.
	 *
	 * THE EASING IS NOT `ease-in-out`, DELIBERATELY: that curve
	 * is slow off the ground AND slow into the landing — the one
	 * thing a thrown object never does. A hop under gravity leaves fastest and arrives fastest, so
	 * the rise eases OUT and the fall eases IN, which is what `--ease-loader-swing-out` /
	 * `--ease-loader-swing-in` in `src/app.css` are for. A timing function declared inside a keyframe
	 * block governs the interval that STARTS at that keyframe, so one animation can decelerate on the
	 * way up and accelerate on the way down; `loader-newtons-cradle.svelte` is where this folder
	 * works the idiom out. The element-level function is `linear` so that every override is visible.
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
	data-loader="bouncing-square"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex h-12 w-10 items-end justify-center", className)}
>
	<span class="absolute bottom-0 h-1 w-8 rounded-full bg-muted-foreground/20 blur-sm"></span>
	<span class="square size-6 origin-bottom rounded-sm bg-foreground"></span>
</div>

<style>
	/* Three ramps — `y` 0 → -24px → 0, `scaleY` 0.8 → 1.1 → 0.8, `scaleX` 1.2 → 0.9 → 1.2 — over
	   evenly spaced stops whose first and last frames are the same
	   picture. Squat and wide on the ground, tall and narrow at the top of the hop; `origin-bottom`
	   in the markup is what keeps the square's underside on the shadow while it squashes. */
	@keyframes loader-bouncing-square-hop {
		0% {
			transform: translateY(0) scale(1.2, 0.8);
			animation-timing-function: var(--ease-loader-swing-out); /* rising: running out of speed */
		}
		50% {
			transform: translateY(-24px) scale(0.9, 1.1);
			animation-timing-function: var(--ease-loader-swing-in); /* falling: gathering speed */
		}
		100% {
			transform: translateY(0) scale(1.2, 0.8);
		}
	}

	.square {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on). This is the 50% frame verbatim — the
		   square at the top of its hop, stretched, clear of its shadow. Frame 0 would sit it squashed
		   on the ground, which is what this object looks like when it has STOPPED bouncing, and a
		   loader frozen in its resting pose reads as finished rather than as waiting. Never seen
		   while the animation runs, because the keyframes declare `transform` at both ends. */
		transform: translateY(-24px) scale(0.9, 1.1);

		/* `linear` at the element level; both intervals that matter override it from inside the
		   keyframes above. */
		animation: loader-bouncing-square-hop 0.6s linear infinite;
	}
</style>
