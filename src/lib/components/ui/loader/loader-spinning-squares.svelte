<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two squares chasing each other around the edge of a 40px box.
	 *
	 * ONE KEYFRAME, TWO TRAVEL DIRECTIONS. The two squares walk the same five-stop path with the
	 * signs flipped — `x: [0, 24, 24, 0, 0]` for the square parked top-left and `x: [0, -24, -24, 0,
	 * 0]` for the one parked bottom-right — so both walk clockwise from
	 * opposite corners. Here that is one keyframe reading a `--travel` custom property, set to `24px`
	 * on one square and `-24px` on the other; `var()` inside `@keyframes` is substituted against the
	 * animated element, so the two share the motion without sharing its endpoints.
	 *
	 * 24px IS NOT ARBITRARY: the box is 40px and each square is 16px, so 24px is exactly the distance
	 * from one corner to the next. Five values with no `times:` means four equal intervals of 25%.
	 *
	 * The two squares therefore rest in DIFFERENT places under reduced motion — each at its own
	 * corner — which is why the sign lives in an endpoint rather than in a half-cycle delay. A
	 * shared rest state plus an offset delay would stack them into one square when the animation
	 * stops (`loader-liquid-dots.svelte` records the same trap).
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
	data-loader="spinning-squares"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-10", className)}
>
	<!-- `bg-zinc-800 dark:bg-white` → `bg-foreground`: the leading square is the primary mark. -->
	<span class="square square-lead absolute top-0 left-0 size-4 rounded-sm bg-foreground"></span>
	<!--
		The second square is `bg-muted-foreground/20`, the unlit-fill
		row, on purpose: this square is the faint one that trails
		the dark one round the box, not a second mark. The `/20` weight is the same one
		`ui/circular-progress`'s track uses.
	-->
	<span
		class="square square-trail absolute right-0 bottom-0 size-4 rounded-sm bg-muted-foreground/20"
	></span>
</div>

<style>
	@keyframes loader-spinning-squares-orbit {
		0% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(var(--travel), 0);
		}
		50% {
			transform: translate(var(--travel), var(--travel));
		}
		75% {
			transform: translate(0, var(--travel));
		}
		100% {
			transform: translate(0, 0);
		}
	}

	.square {
		/* The rest state: each square back in the corner it is positioned at, which is where this
		   path both starts and ends — a real resting pose rather than a frame plucked out of the
		   middle of a walk. */
		transform: translate(0, 0);

		animation: loader-spinning-squares-orbit 2s ease-in-out infinite;
	}

	.square-lead {
		--travel: 24px; /* 40px box − 16px square: one corner to the next */
	}

	.square-trail {
		--travel: -24px; /* the same walk, mirrored, from the opposite corner */
	}
</style>
