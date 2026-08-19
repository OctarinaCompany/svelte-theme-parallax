<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three bars that shorten and close up into a single block, then open out again.
	 *
	 * Decisions worth naming:
	 * - The bars are one semantic token, `bg-foreground`, which carries both themes on its own.
	 * - The whole spacing is the animated `gap` — 8px closing to 4px. The bars narrow the space
	 *   between them, they never meet: the keyframes below run 8px → 4px → 8px and the root rests
	 *   at `gap-2`. Letting the gap close to zero instead would collapse the row into one solid
	 *   block, which is a different picture.
	 *
	 * THE GAP IS ANIMATED ON THE ROOT, and that is one of the layout-property exemptions rather than
	 * a lapse: `gap` is what pushes the three flex siblings along, and no transform on any one of
	 * them moves its neighbours. There is no cheaper spelling of this picture.
	 *
	 * The bars themselves take the default instead — `scaleY()`, not an animated
	 * `height`. They are `rounded-sm` on an 8px width, so the corner radius is a quarter of the bar's
	 * smaller dimension, not half of it, and the squashed corners stay invisible at 0.5. That is what
	 * separates this file from `ui/loader/loader-elastic-bars.svelte` and its `rounded-full` bars,
	 * which really do have to animate `height`.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const bars = Array.from({ length: 3 }, (_, index) => index);
</script>

<!-- `gap-2` is 8px — the row's opening spacing,
     and the spacing this row rests at when motion is reduced — the keyframes below
     state the same 8px at 0% and 100%. `w-fit` because a bare block `<div>` would stretch and strand
     the bars against one edge of its container. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="morphing-bars"
	{role}
	aria-label={ariaLabel}
	class={cn("bars flex h-8 w-fit items-center gap-2", className)}
>
	{#each bars as index (index)}
		<span class="bar h-8 w-2 rounded-sm bg-foreground"></span>
	{/each}
</div>

<style>
	/* Both ramps run over three equal intervals — evenly spaced stops
	   — and both start and end on the same value, which is why 0% and 100% share a selector.
	   The 8px here is the same fact as the root's `gap-2`. */
	@keyframes loader-morphing-bars-close {
		0%,
		100% {
			gap: 8px;
		}
		50% {
			gap: 4px;
		}
	}

	/* The squash: half height and back against a 32px bar, i.e. a scale of
	   1 → 0.5 → 1. The bars are centred, so scaling reproduces the picture exactly. */
	@keyframes loader-morphing-bars-squash {
		0%,
		100% {
			transform: scaleY(1);
		}
		50% {
			transform: scaleY(0.5);
		}
	}

	.bars {
		/* No stagger anywhere in this loader — the root and all three bars share the same
		   2s cycle with no delay at all, so there is no phase relationship for a frozen frame to
		   preserve. Reduced motion therefore leaves the object as drawn: three full-height bars, 8px
		   apart, which is this shape at rest the way `ui/loader/loader-newtons-cradle.svelte` freezes
		   as a straight row. The rest gap is the `gap-2` utility on the root. */
		animation: loader-morphing-bars-close 2s ease-in-out infinite;
	}

	.bar {
		transform: scaleY(1); /* the rest state: the bar at its full drawn height */
		animation: loader-morphing-bars-squash 2s ease-in-out infinite;
	}
</style>
