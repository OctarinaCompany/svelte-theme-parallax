<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { CompareSliderSide } from "./compare-slider.svelte.js";

	export type CompareSliderLabelProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Which half this names. Decides the corner it parks in, so that the two labels of one
		 * comparison never collide.
		 */
		side?: CompareSliderSide;
	};
</script>

<script lang="ts">
	import { getCompareSliderContext } from "./compare-slider.svelte.js";

	/**
	 * A caption naming one half of the comparison.
	 *
	 * Rendered for you when `<CompareSlider.Before label="…">` is given a string, and available
	 * directly for anything richer than a word.
	 *
	 * Placement is the whole job: on a horizontal slider the two labels take opposite top corners,
	 * on a vertical one they stack down the left edge — in both cases as far from the divider's
	 * travel as the box allows, so a label never sits under the handle.
	 */
	let {
		ref = $bindable(null),
		side = "before",
		class: className,
		children,
		...restProps
	}: CompareSliderLabelProps = $props();

	const state = getCompareSliderContext("<CompareSlider.Label>");

	const placement = $derived(
		state.isVertical
			? side === "before"
				? "top-2 left-2"
				: "bottom-2 left-2"
			: side === "before"
				? "top-2 left-2"
				: "top-2 right-2",
	);
</script>

<div
	bind:this={ref}
	data-slot="compare-slider-label"
	data-side={side}
	{...restProps}
	class={cn(
		"absolute z-20 rounded-md border border-border bg-background/80 px-3 py-1.5 text-sm font-medium backdrop-blur-sm",
		placement,
		className,
	)}
>
	{@render children?.()}
</div>
