<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A placeholder block with a band sweeping across it.
	 *
	 * THE BLOCK IS `bg-muted-foreground/20`, AND `ui/skeleton`'s `bg-muted` WAS TRIED FIRST AND
	 * MEASURED INVISIBLE. `bg-muted` is the obvious choice, because
	 * `src/lib/components/ui/skeleton/skeleton.svelte` says a content placeholder
	 * is `bg-muted`. That choice does not survive this palette. On the gallery's `bg-card` tile
	 * `--muted` is seven levels from `--card` in dark, so the block itself had no edge and the reader
	 * saw a band travelling across nothing. Measured in Chrome, 16 frames over 5.4s: with `bg-muted`
	 * only 9% of the loader's box sat at least 12/255 from its ground in dark (60% in light — the
	 * same component reading six times better in one theme than the other is the tell); with
	 * `bg-muted-foreground/20`, the recipe's unlit-track weight and the one
	 * `ui/circular-progress` paints its track (`circular-progress-track.svelte:42`), it is 60% in
	 * both. Do not "correct" this back to `bg-muted`. The sweep is what this loader adds over
	 * `ui/skeleton`'s `animate-pulse`.
	 *
	 * THE SWEEP IS INK AT LOW ALPHA, NOT A LIGHT. The intuitive band is a white highlight — the
	 * placeholder catching the light. But a lighter band only reads where there is headroom above the
	 * block, and in light mode there is barely any: the block measures 21/255 below a `--card` of
	 * #fbfbfb, so `white/60` over it is a handful of levels. `--foreground` at 10% moves the same
	 * distance in both themes — a soft shadow crossing the block in light, a soft highlight in dark —
	 * which is the general move Rule 8 of the token map asks for: re-express a literal as one token at
	 * varying alpha, so it is right in every generated palette rather than in one. Measured on the
	 * card tile, block and band together peak at 43/255 from the ground in light and 38/255 in dark.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<!--
	`h-10 w-24` is the block's fixed geometry and `overflow-hidden` is what
	keeps the band inside the rounded block instead of trailing across the page.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="fluid-skeleton"
	{role}
	aria-label={ariaLabel}
	class={cn("relative h-10 w-24 overflow-hidden rounded-xl bg-muted-foreground/20", className)}
>
	<!--
		The gradient is written as utilities rather than in the block, which the house prefers
		wherever a gradient can be.
	-->
	<span
		class="sweep absolute inset-0 bg-linear-to-r from-transparent via-foreground/10 to-transparent"
	></span>
</div>

<style>
	/* The band travels -100% → 200% — a `from`/`to` with a
	   hard snap back at the loop point, which is what makes the
	   sweep read as a repeated pass rather than a shuttle. The band is `inset-0`, so a percentage
	   translation is a percentage of the block's own width: it enters one full width to the left and
	   leaves two full widths to the right, which is the long dark pause between passes. */
	@keyframes loader-fluid-skeleton-sweep {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(200%);
		}
	}

	.sweep {
		/* The rest state: the band sitting square over the block, so the frozen frame is a placeholder
		   caught mid-sweep rather than an empty rectangle with the band parked off one edge. */
		transform: translateX(0%);

		animation: loader-fluid-skeleton-sweep 1.5s linear infinite;
	}
</style>
