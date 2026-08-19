<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A single tile walking the corners of a 40px box, turning as it goes.
	 *
	 * THREE RAMPS, ONE `transform`. `x`, `y` and `rotate` are
	 * three conceptually separate motions sharing one 2.5s `ease-in-out` cycle; CSS has a single `transform`, so
	 * they are zipped stop by stop. Five values with no `times:` means four equal intervals of 25%,
	 * one per side of the walk.
	 *
	 * 24px IS THE BOX MINUS THE TILE: 40 − 16, which is exactly the distance from one corner to the
	 * next. The rotation is negative — the tile turns anticlockwise while it walks clockwise, so it
	 * looks like it is tipping over each corner rather than being carried round.
	 *
	 * `translate()` rather than `left`/`top`, because a transform is composited and a position
	 * change is laid out every frame. Nothing here depends on the tile's box actually moving.
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
	data-loader="wandering-cube"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-10", className)}
>
	<!-- `bg-zinc-800 dark:bg-white` → `bg-foreground`: the tile is the loader. -->
	<span class="cube absolute top-0 left-0 size-4 rounded-sm bg-foreground"></span>
</div>

<style>
	@keyframes loader-wandering-cube-walk {
		0% {
			transform: translate(0, 0) rotate(0deg);
		}
		25% {
			transform: translate(24px, 0) rotate(-90deg);
		}
		50% {
			transform: translate(24px, 24px) rotate(-180deg);
		}
		75% {
			transform: translate(0, 24px) rotate(-270deg);
		}
		100% {
			transform: translate(0, 0) rotate(-360deg);
		}
	}

	.cube {
		/* The rest state: the tile back in the top-left corner, which is where this walk both starts
		   and ends — a real resting pose, not a frame plucked out of the middle of a lap. A rounded
		   square is the same picture at 0° and at −360°, so the loop's snap is invisible too. */
		transform: translate(0, 0) rotate(0deg);

		animation: loader-wandering-cube-walk 2.5s ease-in-out infinite;
	}
</style>
