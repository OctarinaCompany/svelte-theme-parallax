<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A square that swells into a circle and back as it turns.
	 *
	 * Decisions worth naming:
	 * - `bg-zinc-800 dark:bg-white` is one semantic token, `bg-foreground`.
	 * - The animated square is a child of the root rather than the root itself, so
	 *   the root keeps the fixed attribute block every loader in this folder shares and the swell can
	 *   overflow it (`src/app.css` gates the gallery tile, not the loader, precisely so it may).
	 *
	 * THE 180° IS LOAD-BEARING. The animation loops rather than
	 * alternates, so the last frame snaps back to the first — 180° back to 0°. A square is unchanged
	 * by a quarter turn, so it is certainly unchanged by a half one, and the snap is invisible: the
	 * shape appears to turn forever in one direction. Change this to a shape without that symmetry
	 * and the loader develops a stutter once a cycle.
	 *
	 * `border-radius` is animated rather than transformed because there is no transform that turns a
	 * square into a circle. It is a paint property and not a layout one — nothing reflows when it
	 * changes — so it does not cost what animating a width or a height would. It is also the reason
	 * the square is a child: a Svelte scoped rule is unlayered where Tailwind's utilities are not, so
	 * an animated `border-radius` on the root would silently beat any `rounded-*` a caller passed in
	 * `class`. On the inner element the two never meet.
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
	data-loader="breathing-square"
	{role}
	aria-label={ariaLabel}
	class={cn("size-8", className)}
>
	<span class="square block size-full bg-foreground"></span>
</div>

<style>
	/* Three ramps — `scale` 1 → 1.2 → 1, `border-radius` 0% → 50% → 0%, `rotate` 0 → 90 → 180 —
	   over evenly spaced stops. The scale and the rotation merge
	   into one `transform` per stop: CSS has a single `transform` property, and two animations would
	   be free to drift apart. */
	@keyframes loader-breathing-square-breathe {
		0% {
			border-radius: 0%;
			transform: rotate(0deg) scale(1);
		}
		50% {
			border-radius: 50%;
			transform: rotate(90deg) scale(1.2);
		}
		100% {
			border-radius: 0%;
			transform: rotate(180deg) scale(1);
		}
	}

	.square {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on). A square is what this object is between
		   breaths — the same call `loader-spring-hexagon.svelte` makes for its hexagon — and the
		   shared root pulse carries the "still waiting" signal from there. A frozen half-rounded
		   lozenge at 45° would just look like a rendering fault. Never seen while the animation runs,
		   because the keyframes declare both properties at 0% and at 100%. */
		border-radius: 0%;
		transform: rotate(0deg) scale(1);

		animation: loader-breathing-square-breathe 2s ease-in-out infinite;
	}
</style>
