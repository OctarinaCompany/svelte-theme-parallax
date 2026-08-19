<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type CompareSliderAfterProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Accessible name for this half, also rendered as a caption.
		 *
		 * Without it the panel is `aria-hidden`, for the same reason as its sibling.
		 */
		label?: string;
	};
</script>

<script lang="ts">
	import { compareSliderClipPath, getCompareSliderContext } from "./compare-slider.svelte.js";
	import CompareSliderLabel from "./compare-slider-label.svelte";

	/**
	 * The half revealed on the far side of the divider.
	 *
	 * The mirror of `<CompareSlider.Before>`: same full-size box, complementary clip.
	 */
	let {
		ref = $bindable(null),
		label,
		class: className,
		style,
		children,
		...restProps
	}: CompareSliderAfterProps = $props();

	const state = getCompareSliderContext("<CompareSlider.After>");
	const labelId = $props.id();

	const clipPath = $derived(compareSliderClipPath("after", state.value, state.orientation));
</script>

<div
	bind:this={ref}
	role="img"
	aria-labelledby={label ? labelId : undefined}
	aria-hidden={label ? undefined : "true"}
	data-slot="compare-slider-after"
	data-orientation={state.orientation}
	{...restProps}
	class={cn("absolute inset-0 h-full w-full object-cover", className)}
	style="clip-path: {clipPath};{style ?? ''}"
>
	{@render children?.()}
	{#if label}
		<CompareSliderLabel id={labelId} side="after">{label}</CompareSliderLabel>
	{/if}
</div>
