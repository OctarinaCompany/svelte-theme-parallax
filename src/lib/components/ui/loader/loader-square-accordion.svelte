<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three chunky rounded columns growing and shrinking out of step inside a fixed square.
	 *
	 * ANIMATING `height` IS THE EXCEPTION, CLAIMED FOR THE CORNERS.
	 * The column is 12px wide with a 4px `rounded-sm` radius, so the
	 * radius is two thirds of its half-width. `scaleY` from a 32px base down to 12px would squash
	 * those corners to 1.5px vertically at the moment the column is shortest, turning a rounded
	 * square into a flattened lozenge. That is the first of the three cases the house allows a layout
	 * property for, the same one `loader-waveform-loader.svelte` claims for its `rounded-full` bar.
	 *
	 * The consequence, recorded because it surprises: the column height is not tunable from outside.
	 * A Svelte scoped rule is unlayered and Tailwind utilities live in `@layer utilities`, so the
	 * `height` below outranks any utility landing on a column regardless of specificity — and a
	 * caller's `class` reaches the root only, never a column. So `h-*` from a caller resizes the 48px
	 * box and leaves the three columns exactly as they are, which is the intended contract for a
	 * fixed-size loader.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const columns = Array.from({ length: 3 }, (_, index) => index);
</script>

<!--
	`size-12` is a real fixed box, tall enough for the 32px peak with room to breathe.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="square-accordion"
	{role}
	aria-label={ariaLabel}
	class={cn("flex size-12 items-center justify-center gap-1", className)}
>
	{#each columns as index (index)}
		<!-- `bg-zinc-800 dark:bg-white` is the primary mark: map on the light-mode shade and drop the
		     `dark:` half, because `--foreground` already carries both themes. -->
		<span class="column w-3 rounded-sm bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* `height` runs 12px → 32px → 12px over three equal intervals — evenly spaced stops whose
	   first and last values match. */
	@keyframes loader-square-accordion-grow {
		0%,
		100% {
			height: 12px;
		}
		50% {
			height: 32px;
		}
	}

	.column {
		--duration: 1.5s;
		/* The stagger, `delay: i * 0.2`. */
		--stagger: 0.2s;

		/* The rest state: 12 / 17.3 / 22.7px, the staircase this trio would really be caught on. With
		   `animation-delay: i*0.2s - 1.5s` a column's phase on the first painted frame is
		   `1 - 0.2i/1.5`, and the triangle above (12px → 32px → 12px) evaluated there is exactly
		   `12px + i × 16px/3`. The 16px/3 is the 40px-per-cycle descent spent over each 0.2s of the
		   1.5s cycle, written as a fraction so it stays exact; it and the 12px are the same fact as
		   the `@keyframes` above and have to move together. */
		height: calc(12px + var(--index) * 16px / 3);

		animation: loader-square-accordion-grow var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: every delay goes negative, so the three
		   columns are already staggered on the first painted frame rather than starting flush and
		   drifting apart. Subtracted, not negated — negating would run the wave the other way. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
