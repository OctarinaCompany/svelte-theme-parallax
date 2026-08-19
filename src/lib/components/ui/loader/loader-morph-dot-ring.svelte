<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Four dots in a two-by-two block that close into a single body as the block turns.
	 *
	 * AN ANIMATED LAYOUT PROPERTY, AND WHICH EXEMPTION IT CLAIMS. The default in this folder is
	 * `transform`, because it is composited and a layout property is not. This is the grid-sibling
	 * case: the container's `gap` animates from 4px to 0 and back,
	 * and every one of the four cells has to move inward AND grow as that gap closes — the dots are
	 * `size-full` of `1fr` tracks, so closing the gap hands each of them the 2px it gave up. A
	 * transform cannot push a sibling along, so reproducing this with `transform` would mean
	 * hand-deriving a per-quadrant translate and a scale from the root's 24px box and re-deriving
	 * both if that box ever changed size. The gap version simply stays correct.
	 *
	 * The consequence, stated rather than hidden: a Svelte scoped rule is unlayered and Tailwind
	 * utilities live in `@layer utilities`, so unlayered wins — a caller cannot override this
	 * loader's gap with a `gap-*` class. Intended for a fixed-geometry loader, and the reason the gap
	 * is declared here rather than as a utility the block would silently defeat.
	 *
	 * TWO ANIMATIONS, NOT ONE MERGED KEYFRAME SET. `rotate` is a single target (`rotate: 180`), so it
	 * runs once across the whole 2s with one ease; `gap` is a three-value array, so it eases per leg.
	 * They touch different properties, so running them as two animations on one element keeps each
	 * one's timing its own. Merging them into one keyframe set would silently re-ease the
	 * rotation as two half-turns.
	 *
	 * `grid-rows-2` is stated rather than left implicit: two `auto` rows in a
	 * fixed-height grid stretch to fill it anyway, but saying `1fr` twice
	 * makes the geometry independent of that inference.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const dots = [0, 1, 2, 3];
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="morph-dot-ring"
	{role}
	aria-label={ariaLabel}
	class={cn("size-6", className)}
>
	<!-- The animated layer is an inner element, so the rotation and the gap stay off the root that
	     carries a caller's `class` and this loader's a11y attributes. -->
	<!-- `morph`, not `ring`: `ring` is a real Tailwind utility (a box-shadow ring), so naming the
	     class that would have Tailwind emit a shadow around this block on top of the rule below. -->
	<div class="morph grid size-full grid-cols-2 grid-rows-2">
		{#each dots as index (index)}
			<span class="size-full rounded-full bg-foreground"></span>
		{/each}
	</div>
</div>

<style>
	/* The half-turn: a single 0 → 180 ramp across the whole duration,
	   snapping back to 0 at the loop point. On a four-fold-symmetric block 180°
	   and 0° are the same picture, so the snap is invisible. */
	@keyframes loader-morph-dot-ring-turn {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(180deg);
		}
	}

	/* `gap` runs 4px → 0 → 4px — three values, equal intervals, so the block is fully
	   closed at 50%. */
	@keyframes loader-morph-dot-ring-gap {
		0%,
		100% {
			gap: 4px;
		}
		50% {
			gap: 0px;
		}
	}

	.morph {
		/* The rest state, and what reduced motion leaves on screen: the block as drawn, four separate
		   dots square to the box. Both properties are declared at 0% and 100% above, so neither value
		   is ever seen while the animation runs. */
		gap: 4px;
		transform: rotate(0deg);

		animation:
			loader-morph-dot-ring-turn 2s ease-in-out infinite,
			loader-morph-dot-ring-gap 2s ease-in-out infinite;
	}
</style>
