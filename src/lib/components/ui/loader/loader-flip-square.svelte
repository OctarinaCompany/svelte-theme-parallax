<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A rounded tile that flips end over end, then side to side.
	 *
	 * TWO RAMPS, ONE `transform`. `rotateX` runs 0 → 180 → 180 → 0 while
	 * `rotateY` runs 0 → 0 → 180 → 180; CSS has a
	 * single `transform` property, so the two ramps are zipped stop by stop — four values over
	 * three equal intervals: 0%, 33.333%, 66.667%, 100%.
	 *
	 * NO `perspective`, DELIBERATELY. CSS adds none implicitly, so the flip
	 * renders flat: the tile squashes to a line and comes back rather than swinging
	 * through depth. Adding `perspective` here would look better and would not be this loader.
	 *
	 * THE LOOP SNAP IS INVISIBLE, and that is what makes the last stop legal. The animation
	 * loops, so the 100% frame — `rotateX(0) rotateY(180deg)` — jumps straight back to
	 * `rotateX(0) rotateY(0)`. A flat rounded square turned half a turn about its own vertical axis
	 * is the same picture as an unturned one, so nothing is seen to jump. Same trick as
	 * `loader-spring-hexagon.svelte`'s 60°.
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
	data-loader="flip-square"
	{role}
	aria-label={ariaLabel}
	class={cn("size-8", className)}
>
	<!--
		The tile is the whole visible
		object of this loader, so it is the primary mark, `bg-foreground` — a token that carries both
		themes on its own.
	-->
	<span class="square block size-full rounded-md bg-foreground shadow-sm"></span>
</div>

<style>
	@keyframes loader-flip-square-flip {
		0% {
			transform: rotateX(0deg) rotateY(0deg);
		}
		33.333% {
			transform: rotateX(180deg) rotateY(0deg);
		}
		66.667% {
			transform: rotateX(180deg) rotateY(180deg);
		}
		100% {
			transform: rotateX(0deg) rotateY(180deg);
		}
	}

	.square {
		/* The rest state: the tile as drawn, face on. This loader has no meaningful mid-motion pose —
		   every frame of a flat flip is either the same square or a foreshortened sliver of one — so
		   the honest frozen frame is the object itself, and the shared root pulse in `src/app.css`
		   carries the "still waiting" signal. */
		transform: rotateX(0deg) rotateY(0deg);

		/* `ease-in-out` is the CSS keyword exactly, and not
		   Tailwind's `--ease-in-out` (a Material curve). Keywords in here, never an `ease-*` class. */
		animation: loader-flip-square-flip 2s ease-in-out infinite;
	}
</style>
