<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	import { getAngleSliderContext } from "./angle-slider.svelte.js";

	/** The merged attribute payload handed to the thumb's `child` snippet. */
	export type AngleSliderThumbChildProps = {
		role: "slider";
		"aria-label": string;
		"aria-valuemin": number;
		"aria-valuenow": number;
		"aria-valuemax": number;
		"aria-orientation": "vertical";
		"aria-disabled"?: "true";
		"aria-readonly"?: "true";
		"data-slot": "angle-slider-thumb";
		"data-disabled"?: "";
		"data-readonly"?: "";
		"data-index": number;
		tabindex?: number;
		class: string;
	} & Record<string, unknown>;

	export type AngleSliderThumbProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Which entry of the dial's value array this thumb drives. Renders nothing when there is no
		 * value at that index.
		 * @default 0
		 */
		index?: number;
		/**
		 * Render the thumb onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. Registration
		 * lives on the positioned wrapper `<span>`, so it survives `child` mode; `ref` stays `null`.
		 */
		child?: Snippet<[{ props: AngleSliderThumbChildProps }]>;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";

	import HiddenInput from "./angle-slider-hidden-input.svelte";

	let {
		ref = $bindable(null),
		index = 0,
		class: className,
		children,
		child,
		onfocus,
		...restProps
	}: AngleSliderThumbProps = $props();

	const slider = getAngleSliderContext("<AngleSlider.Thumb>");

	let wrapper = $state<HTMLSpanElement | null>(null);

	const value = $derived(slider.values[index]);
	const position = $derived(value === undefined ? { x: 0, y: 0 } : slider.positionFor(value));

	// Upstream assumes form participation until the element has mounted, so a server-rendered dial
	// still submits; once mounted the real ancestry decides.
	const isFormControl = $derived(
		wrapper === null ? true : !!slider.form || !!wrapper.closest("form"),
	);

	const inputName = $derived(
		slider.name === undefined ? undefined : slider.name + (slider.values.length > 1 ? "[]" : ""),
	);

	// Keyed on the element and the index only: re-registering on every value change would churn the
	// map during a drag. `untrack` keeps the `SvelteMap` write from invalidating this very effect.
	$effect(() => {
		const element = wrapper;
		const registeredIndex = index;
		if (!element) return;

		untrack(() => slider.register(registeredIndex, element));

		return () => slider.unregister(registeredIndex);
	});

	function handleFocus(event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onfocus?.(event);
		if (event.defaultPrevented) return;

		slider.valueIndexToChange = index;
	}

	const thumbAttrs = $derived({
		role: "slider",
		// Default accessible name, overridable through `restProps`; multi-thumb dials get indexed
		// names so a screen reader can tell them apart.
		"aria-label":
			slider.values.length > 1 ? `Angle ${index + 1} of ${slider.values.length}` : "Angle",
		"aria-valuemin": slider.min,
		"aria-valuenow": value,
		"aria-valuemax": slider.max,
		"aria-orientation": "vertical",
		"aria-disabled": slider.disabled ? "true" : undefined,
		"aria-readonly": slider.readOnly ? "true" : undefined,
		"data-slot": "angle-slider-thumb",
		"data-disabled": slider.disabled ? "" : undefined,
		"data-readonly": slider.readOnly ? "" : undefined,
		"data-index": index,
		tabindex: slider.disabled ? undefined : 0,
		...restProps,
		onfocus: handleFocus,
		class: cn(
			"block size-4 shrink-0 rounded-full border border-primary bg-background shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden",
			className,
		),
	} as AngleSliderThumbChildProps);
</script>

{#if value !== undefined}
	<span
		bind:this={wrapper}
		data-slot="angle-slider-thumb-wrapper"
		style="position:absolute;left:{slider.centre + position.x}px;top:{slider.centre +
			position.y}px;transform:translate(-50%, -50%);"
	>
		{#if child}
			{@render child({ props: thumbAttrs })}
		{:else}
			<div bind:this={ref} {...thumbAttrs}>
				{@render children?.()}
			</div>
		{/if}
		{#if isFormControl}
			<HiddenInput
				control={wrapper}
				type="number"
				name={inputName}
				form={slider.form}
				value={String(value)}
				min={slider.min}
				max={slider.max}
				step={slider.step}
				disabled={slider.disabled}
			/>
		{/if}
	</span>
{/if}
