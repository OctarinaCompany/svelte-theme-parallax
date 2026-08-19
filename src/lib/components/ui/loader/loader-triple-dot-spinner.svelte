<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three dots on a common hub, turning as one.
	 *
	 * THE ROTATING ELEMENT IS AN INNER WRAPPER, not the root. This folder's root always carries
	 * `bind:this`,
	 * a caller's `class` and the a11y attributes — a caller passing `rotate-45` or a transform of
	 * their own would fight the animation for the one `transform` property. Wrapping keeps the two
	 * apart, and matches the rule this folder applies to `<svg>` roots: wrap, do not promote.
	 *
	 * `animate-spin` IS NOT USED, deliberately, even though the built-in utility is allowed here.
	 * Tailwind's `animate-spin` is fixed at 1s and this turn is 2s, and there is no arbitrary
	 * form of it that would work: `animate-[…]` references an UNHASHED keyframe name and silently
	 * does nothing once Svelte has scoped the block. So the turn is a named keyframe of this
	 * component's own.
	 *
	 * THE DOTS THEMSELVES DO NOT ANIMATE. Each is placed once at 0°, 120° or 240° about the hub
	 * and rides the wrapper. `origin-[4px_20px]` is that hub: 4px is
	 * the dot's own half-width, 20px is the centre of the 40px box.
	 *
	 * Other divergences: `w-10 h-10` is `size-10`, `w-2 h-2` is `size-2`; `bg-zinc-800 dark:bg-white`
	 * is the single token `bg-foreground`.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const dots = [0, 1, 2];
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="triple-dot-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn("size-10", className)}
>
	<div class="hub relative size-full">
		{#each dots as index (index)}
			<!-- `left-1/2 -ml-1` centres an 8px dot on the box's vertical axis:
			     it is geometry, and it survives the dot changing size. -->
			<span
				class="dot absolute top-0 left-1/2 -ml-1 size-2 origin-[4px_20px] rounded-full bg-foreground"
				style:--index={index}
			></span>
		{/each}
	</div>
</div>

<style>
	/* One full turn over 2s, linear — a plain from/to sweep, and 360° and 0° are the same
	   picture, so the
	   loop point is invisible. */
	@keyframes loader-triple-dot-spinner-turn {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.hub {
		/* The rest state: the tripod as drawn, three dots evenly spaced about the hub. A spinner is
		   rotationally symmetric at 120°, so there is no frame that reads as more "caught mid-turn"
		   than any other — every angle is the same picture. The shared rule in `src/app.css` pulses
		   the root, which is what says "still busy". */
		transform: rotate(0deg);

		animation: loader-triple-dot-spinner-turn 2s linear infinite;
	}

	.dot {
		/* Each dot's berth: `rotate(${i * 120}deg)` — static placement
		   about the shared origin, not an animation. The index travels in as a custom property so the
		   markup carries no magic angle. */
		transform: rotate(calc(var(--index) * 120deg));
	}
</style>
