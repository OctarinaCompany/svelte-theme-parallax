<script lang="ts">
	import { Slider as SliderPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		orientation = "horizontal",
		thumbLabel,
		thumbValueText,
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledby,
		"aria-describedby": ariaDescribedby,
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SliderPrimitive.RootProps> & {
		/**
		 * The accessible name of the thumb — a string for every thumb, or one string per thumb of a
		 * range. Defaults to the root's own `aria-label`.
		 */
		thumbLabel?: string | string[];
		/**
		 * What the thumb announces as its value — `"300%"` rather than `300`, or `"12 px"` rather
		 * than `12`. A string for every thumb, or one per thumb of a range. Without it a screen
		 * reader speaks the bare number, which for anything with a unit is half the information.
		 */
		thumbValueText?: string | string[];
	} = $props();

	/**
	 * The name has to reach the THUMB. `role="slider"` lives there, while `aria-label` — and a
	 * `<label for>`, which cannot bind to the root's `<span>` at all — lands on the root, so a
	 * slider labelled the obvious way still leaves the control a screen reader stops on with an
	 * empty name (WCAG 4.1.2). Naming the root as well is deliberate: it carries no role, so the
	 * name is not announced twice, and a caller who names only the root gets a named thumb for free.
	 *
	 * The description and the value text take the same road, for the same reason: `aria-describedby`
	 * and `aria-valuetext` are read from the element that carries the role, and that is the thumb.
	 */
	function thumbName(index: number): string | null | undefined {
		if (Array.isArray(thumbLabel)) return thumbLabel[index] ?? ariaLabel;
		return thumbLabel ?? ariaLabel;
	}

	function thumbText(index: number): string | undefined {
		return Array.isArray(thumbValueText) ? thumbValueText[index] : thumbValueText;
	}
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	data-slot="slider"
	{orientation}
	aria-label={ariaLabel}
	aria-labelledby={ariaLabelledby}
	aria-describedby={ariaDescribedby}
	class={cn(
		"relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
		className,
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-slot="slider-track"
			data-orientation={orientation}
			class={cn(
				"relative grow overflow-hidden rounded-full bg-muted bg-muted data-horizontal:h-1.5 data-horizontal:w-full data-horizontal:w-full data-vertical:h-full data-vertical:h-full data-vertical:w-1.5",
			)}
		>
			<SliderPrimitive.Range
				data-slot="slider-range"
				class={cn("absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full")}
			/>
		</span>
		{#each thumbItems as thumb (thumb.index)}
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				index={thumb.index}
				aria-label={thumbName(thumb.index)}
				aria-labelledby={thumbName(thumb.index) ? undefined : ariaLabelledby}
				aria-describedby={ariaDescribedby}
				aria-valuetext={thumbText(thumb.index)}
				class="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
