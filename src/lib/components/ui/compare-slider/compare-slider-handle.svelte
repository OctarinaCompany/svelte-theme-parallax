<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type CompareSliderHandleProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
	import { getCompareSliderContext } from "./compare-slider.svelte.js";

	/**
	 * The divider, and its grip.
	 *
	 * `role="presentation"` and `aria-hidden`: this is the picture of the root's value, not a
	 * control of its own. The root owns `role="slider"`, the tab stop and the keyboard, so a second
	 * focusable element here would put two things in the tab order that do one job — and the grip
	 * is not where a keyboard user's focus ring should land anyway.
	 *
	 * The chevrons appear only under `interaction="drag"`. In `hover` mode there is nothing to
	 * grab, so a grip would advertise an affordance that does not exist.
	 *
	 * Passing children replaces the default bar and grip entirely, which is how the customization
	 * demo swaps in its own.
	 */
	let {
		ref = $bindable(null),
		class: className,
		style,
		children,
		...restProps
	}: CompareSliderHandleProps = $props();

	const state = getCompareSliderContext("<CompareSlider.Handle>");

	const axis = $derived(
		state.isVertical ? "left-0 h-10 w-full -translate-y-1/2" : "top-0 h-full w-10 -translate-x-1/2",
	);
	const offset = $derived(state.isVertical ? `top: ${state.value}%;` : `left: ${state.value}%;`);
</script>

<div
	bind:this={ref}
	role="presentation"
	aria-hidden="true"
	data-slot="compare-slider-handle"
	data-orientation={state.orientation}
	{...restProps}
	class={cn(
		"absolute z-50 flex items-center justify-center",
		axis,
		state.interaction === "drag" && "cursor-grab active:cursor-grabbing",
		className,
	)}
	style="{offset}{style ?? ''}"
>
	{#if children}
		{@render children()}
	{:else}
		<div
			class={cn(
				"absolute bg-background",
				state.isVertical
					? "top-1/2 h-1 w-full -translate-y-1/2"
					: "left-1/2 h-full w-1 -translate-x-1/2",
			)}
		></div>
		{#if state.interaction === "drag"}
			<div
				class="z-50 flex aspect-square size-11 shrink-0 items-center justify-center rounded-full bg-background p-2 [&_svg]:size-4 [&_svg]:stroke-3 [&_svg]:text-muted-foreground [&_svg]:select-none"
			>
				{#if state.isVertical}
					<div class="flex flex-col items-center">
						<ChevronUpIcon />
						<ChevronDownIcon />
					</div>
				{:else}
					<div class="flex items-center">
						<ChevronLeftIcon />
						<ChevronRightIcon />
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
