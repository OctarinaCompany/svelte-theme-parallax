<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A solid app-icon tile that rounds itself into a disc, turns, and squares back up.
	 *
	 * `border-radius` IS ANIMATED RATHER THAN FAKED. The folder's default is to move `transform` and
	 * `opacity` and nothing else, because a layout property is re-laid-out on the main thread every
	 * frame — but a radius is resolved at paint time, not in layout, and no transform turns a square
	 * into a circle anyway. So this is a literal translation of
	 * `borderRadius: ["20%", "50%", "50%", "20%"]`, with the rotation
	 * merged onto the same stops because CSS has one `transform` property.
	 *
	 * FOUR VALUES MEAN FOUR EQUAL INTERVALS — 0%, 33.3%, 66.7%, 100%. There is no `times:` array in
	 * this transition, so the equal-interval rule applies.
	 *
	 * THE 270° IS LOAD-BEARING. `repeat: Infinity` loops rather than alternates, so the last frame
	 * snaps back to the first: 270° back to 0°. A square with four equal corners is its own image
	 * under a quarter-turn, so that snap is invisible and the tile appears to keep turning one way
	 * forever. It only works because the radius is back at 20% by then too.
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
	data-loader="apple-icon-morph"
	{role}
	aria-label={ariaLabel}
	class={cn("size-8", className)}
>
	<!-- The tile is the single token `bg-foreground`, which carries both themes. -->
	<span class="tile block size-full bg-foreground"></span>
</div>

<style>
	@keyframes loader-apple-icon-morph-morph {
		0% {
			border-radius: 20%;
			transform: rotate(0deg);
		}
		33.333% {
			border-radius: 50%;
			transform: rotate(90deg);
		}
		66.667% {
			border-radius: 50%;
			transform: rotate(180deg);
		}
		100% {
			border-radius: 20%;
			transform: rotate(270deg);
		}
	}

	.tile {
		/* The rest state: the icon as drawn, square-on with its 20% corners — the animation's own
		   first keyframe, and a shape that reads as an app icon rather than as a glitch. Both
		   animated properties are declared at 0% and 100% above, so this never shows while the
		   animation runs. */
		border-radius: 20%;
		transform: rotate(0deg);

		/* `ease-in-out` is the CSS keyword, cubic-bezier(0.42, 0, 0.58, 1),
		   not Tailwind's `--ease-in-out`. */
		animation: loader-apple-icon-morph-morph 2s ease-in-out infinite;
	}
</style>
