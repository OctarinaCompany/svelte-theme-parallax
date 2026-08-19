<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A diamond that springs a quarter-turn at a time.
	 *
	 * THE 45° IS THE SHAPE, NOT THE ANIMATION. The static `rotate(45deg)` below
	 * only describes the object at rest — a square stood on its corner — while the keyframes
	 * travel 45 → 135 → 225 → 315. The keyframes carry
	 * their own 45° and take over the moment the animation starts, which is why the rest rule below
	 * repeats it rather than the animation inheriting it.
	 *
	 * FOUR VALUES, FOUR EQUAL INTERVALS — 0%, 33.3%, 66.7%, 100%. No `times:` array in this
	 * transition, so the equal-interval rule applies.
	 *
	 * THE LOOP POINT IS INVISIBLE, and it is worth saying why. The animation loops rather than
	 * alternates, so 315° snaps back to 45° — a quarter-turn, under which a square with four equal
	 * corners is its own image. The diamond therefore appears to keep turning one way forever.
	 *
	 * THE SPRING IS THE PORT'S ONE SPRING. `type: "spring", bounce: 0.4` is a solver CSS has no
	 * equivalent for; at that bounce it is a single overshoot and a settle, so it takes
	 * `--ease-loader-spring` from `src/app.css` like every other spring here — see
	 * `loader-spring-hexagon.svelte`, which fixed the curve for the whole folder. Written as four
	 * stops rather than collapsed, because the overshoot has to land on each quarter-turn.
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
	data-loader="diamond-rotate-spring"
	{role}
	aria-label={ariaLabel}
	class={cn("size-8", className)}
>
	<span class="diamond block size-full origin-center rounded-sm bg-foreground"></span>
</div>

<style>
	@keyframes loader-diamond-rotate-spring-turn {
		0% {
			transform: rotate(45deg);
		}
		33.333% {
			transform: rotate(135deg);
		}
		66.667% {
			transform: rotate(225deg);
		}
		100% {
			transform: rotate(315deg);
		}
	}

	.diamond {
		/* The rest state: the square stood on its corner — the pose the first keyframe also
		   names. */
		transform: rotate(45deg);

		animation: loader-diamond-rotate-spring-turn 2s var(--ease-loader-spring) infinite;
	}
</style>
