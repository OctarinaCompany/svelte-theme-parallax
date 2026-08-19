<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type CompareSliderBeforeProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Accessible name for this half, also rendered as a caption.
		 *
		 * Without it the panel is `aria-hidden`: two unnamed pictures of the same subject announce
		 * as two images and tell a screen reader nothing the sighted view does not already carry.
		 */
		label?: string;
	};
</script>

<script lang="ts">
	import { compareSliderClipPath, getCompareSliderContext } from "./compare-slider.svelte.js";
	import CompareSliderLabel from "./compare-slider-label.svelte";

	/**
	 * The half revealed on the near side of the divider.
	 *
	 * Both halves are absolutely positioned at full size and CLIPPED rather than resized, so the
	 * two pictures stay registered pixel for pixel as the divider moves — see
	 * `compareSliderClipPath`.
	 */
	let {
		ref = $bindable(null),
		label,
		class: className,
		style,
		children,
		...restProps
	}: CompareSliderBeforeProps = $props();

	const state = getCompareSliderContext("<CompareSlider.Before>");
	const labelId = $props.id();

	const clipPath = $derived(compareSliderClipPath("before", state.value, state.orientation));
</script>

<div
	bind:this={ref}
	role="img"
	aria-labelledby={label ? labelId : undefined}
	aria-hidden={label ? undefined : "true"}
	data-slot="compare-slider-before"
	data-orientation={state.orientation}
	{...restProps}
	class={cn("absolute inset-0 h-full w-full object-cover", className)}
	style="clip-path: {clipPath};{style ?? ''}"
>
	{@render children?.()}
	{#if label}
		<CompareSliderLabel id={labelId} side="before">{label}</CompareSliderLabel>
	{/if}
</div>
