<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A square that rounds itself into a disc, shrinks, turns, and comes back.
	 *
	 * THREE RAMPS, TWO CSS PROPERTIES. `border-radius`, `rotate` and `scale`
	 * are three conceptually separate motions over one 2s `ease-in-out` cycle;
	 * `rotate` and `scale` merge into the single `transform` each stop can carry, and `border-radius`
	 * stays a property of its own. Three values, no `times:`, so two equal intervals: 0%, 50%, 100%.
	 *
	 * `border-radius` IS THE ANIMATION, so it is animated despite not being a transform. It is a
	 * paint property rather than a layout one — no reflow — and there is no transform that turns a
	 * square into a circle, so the §4.5 "prefer transform" default has nothing to offer here.
	 *
	 * THE LOOP SNAP IS INVISIBLE. `repeat: Infinity` loops rather than alternates, so the 100% frame
	 * jumps back to the 0% one: `rotate(180deg)` → `rotate(0deg)` on a square with equal corners is
	 * the same picture, and the radius and scale are already back where they started.
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
	data-loader="morphing-shape"
	{role}
	aria-label={ariaLabel}
	class={cn("size-10", className)}
>
	<!--
		`bg-zinc-800 dark:bg-white` → `bg-foreground`: map on the light-mode shade, drop the `dark:`
		half, because the token already carries both themes. No `rounded-*` utility — the radius is
		animated, and a class here would be a second spelling of a value the style block owns.
	-->
	<span class="shape block size-full bg-foreground shadow-sm"></span>
</div>

<style>
	@keyframes loader-morphing-shape-morph {
		0% {
			border-radius: 10%;
			transform: rotate(0deg) scale(1);
		}
		50% {
			border-radius: 50%;
			transform: rotate(90deg) scale(0.8);
		}
		100% {
			border-radius: 10%;
			transform: rotate(180deg) scale(1);
		}
	}

	.shape {
		/* The rest state: the shape caught half way through its first morph — a rounded square at 45°,
		   slightly shrunk. These are not decorative numbers. `ease-in-out` is symmetric, so at 25% of
		   the cycle the first interval is exactly half done, which puts the radius half way from 10%
		   to 50%, the rotation half way from 0° to 90°, and the scale half way from 1 to 0.8. Frozen
		   at 0% instead, this loader would be an ordinary square with nothing to say. */
		border-radius: 30%;
		transform: rotate(45deg) scale(0.9);

		animation: loader-morphing-shape-morph 2s ease-in-out infinite;
	}
</style>
