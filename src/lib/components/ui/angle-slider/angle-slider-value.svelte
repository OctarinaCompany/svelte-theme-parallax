<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	import { getAngleSliderContext } from "./angle-slider.svelte.js";

	/** The merged attribute payload handed to the value's `child` snippet. */
	export type AngleSliderValueChildProps = {
		"data-slot": "angle-slider-value";
		"data-disabled"?: "";
		"data-readonly"?: "";
		class: string;
		style: string;
	} & Record<string, unknown>;

	export type AngleSliderValueProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Suffix appended to each rendered number.
		 * @default '°'
		 */
		unit?: string;
		/**
		 * Formats the readout yourself. Receives the single value for a one-thumb dial and the whole
		 * array for two or more.
		 */
		formatValue?: (value: number | number[]) => string;
		/**
		 * Render the readout onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `ref` stays `null`.
		 */
		child?: Snippet<[{ props: AngleSliderValueChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		unit = "°",
		formatValue,
		class: className,
		style,
		children,
		child,
		...restProps
	}: AngleSliderValueProps = $props();

	const slider = getAngleSliderContext("<AngleSlider.Value>");

	// Two or more thumbs read the smallest and largest **current** values, never `min`/`max`.
	const displayValue = $derived.by(() => {
		const values = slider.values;

		if (formatValue) return formatValue(values.length === 1 ? (values[0] ?? 0) : values);
		if (values.length === 1) return `${values[0] ?? 0}${unit}`;
		// An empty value array reads as `min`, mirroring the range's endpoint fallbacks.
		if (values.length === 0) return `${slider.min}${unit}`;

		return `${slider.sorted[0]}${unit} - ${slider.sorted[slider.sorted.length - 1]}${unit}`;
	});

	const valueAttrs = $derived({
		"data-slot": "angle-slider-value",
		"data-disabled": slider.disabled ? "" : undefined,
		"data-readonly": slider.readOnly ? "" : undefined,
		...restProps,
		class: cn(
			"pointer-events-none flex items-center justify-center text-sm font-medium text-foreground select-none",
			className,
		),
		style: `position:absolute;left:${slider.centre}px;top:${slider.centre}px;transform:translate(-50%, -50%);${style ?? ""}`,
	} as AngleSliderValueChildProps);
</script>

{#if child}
	{@render child({ props: valueAttrs })}
{:else}
	<div bind:this={ref} {...valueAttrs}>
		{#if children}{@render children()}{:else}{displayValue}{/if}
	</div>
{/if}
