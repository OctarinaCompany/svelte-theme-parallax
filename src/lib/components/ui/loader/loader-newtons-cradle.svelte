<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Four balls; the outer two take turns swinging.
	 *
	 * THE EASING IS THE WHOLE TRICK. A naive `ease-in-out` over the whole six-stop
	 * swing makes the ball slow at the top AND
	 * slow at the bottom — the one thing a pendulum never does. A pendulum's small-angle motion is
	 * θ = A·cos(ωt): it starts from rest at the top, is fastest at the bottom, and comes to rest at
	 * the top again. So a fall is a quarter-cosine easing IN and a rise is a quarter-cosine easing
	 * OUT, and those two curves are exactly `--ease-loader-swing-in` / `--ease-loader-swing-out` in
	 * `src/app.css` (easings.net's easeInSine and easeOutSine).
	 *
	 * CSS can say that, where a single `animation-timing-function` cannot: a timing function
	 * declared INSIDE a keyframe block applies to the interval that starts at that keyframe, so one
	 * animation can accelerate on one leg and decelerate on the next. That is the general answer for
	 * every loader in this folder whose motion is physical rather than decorative, and it is why the
	 * element-level function below is `linear` — every interval that matters overrides it.
	 *
	 * The six stops sit at five equal intervals of 20%: the left ball falls over the
	 * first, waits three, and rises over the last; the right ball waits two, rises, falls, and
	 * waits. The two middle balls never move, which is the trick the real toy plays.
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
	data-loader="newtons-cradle"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit items-center justify-center gap-0.5", className)}
>
	<!--
		`w-fit` because the four balls size this loader and a bare block `<div>` would stretch to its
		container, which turns any percentage in a keyframe into a measurement of the container and
		strands the row on the left edge of a left-aligned one. `justify-center` is
		kept: it does nothing while `w-fit` holds, but a caller passing a wider `class` overrides the
		width — `className` is last in `cn()` — and then it is what re-centres the row.
	-->
	<span class="ball ball-left size-3 origin-top rounded-full bg-foreground"></span>
	<span class="size-3 rounded-full bg-foreground"></span>
	<span class="size-3 rounded-full bg-foreground"></span>
	<span class="ball ball-right size-3 origin-top rounded-full bg-foreground"></span>
</div>

<style>
	@keyframes loader-newtons-cradle-left {
		0% {
			transform: rotate(25deg);
			animation-timing-function: var(--ease-loader-swing-in); /* falling: gathering speed */
		}
		20% {
			transform: rotate(0deg);
			animation-timing-function: linear; /* the wait, while the right ball has its turn */
		}
		80% {
			transform: rotate(0deg);
			animation-timing-function: var(--ease-loader-swing-out); /* rising: running out of speed */
		}
		100% {
			transform: rotate(25deg);
		}
	}

	@keyframes loader-newtons-cradle-right {
		0% {
			transform: rotate(0deg);
		}
		40% {
			transform: rotate(0deg);
			animation-timing-function: var(--ease-loader-swing-out); /* kicked out, slowing */
		}
		60% {
			transform: rotate(-25deg);
			animation-timing-function: var(--ease-loader-swing-in); /* falling back */
		}
		80% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(0deg);
		}
	}

	.ball {
		/* The rest state: a straight row of four, which is a cradle at rest — nothing to invent for
		   reduced motion beyond the shared root pulse in `src/app.css`. */
		transform: rotate(0deg);

		/* Overridden at every interval that matters; see the component comment. */
		animation-duration: 1.5s;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}

	.ball-left {
		animation-name: loader-newtons-cradle-left;
	}

	.ball-right {
		animation-name: loader-newtons-cradle-right;
	}
</style>
