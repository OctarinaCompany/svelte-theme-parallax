<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Slider as SliderPrimitive } from "bits-ui";

	/**
	 * Every single-value `bits-ui` `Slider.Root` prop except the ones this part owns: `type`, `value`,
	 * `onValueChange`, `min`, `max`, `dir` and `disabled` all come from the picker. The value is a
	 * whole percentage, `0..100`, mapping onto the colour's `0..1` alpha.
	 */
	export type ColorPickerAlphaSliderProps = Omit<
		SliderPrimitive.RootProps,
		| "type"
		| "value"
		| "onValueChange"
		| "onValueCommit"
		| "min"
		| "max"
		| "dir"
		| "disabled"
		| "children"
		| "child"
	> & {
		/** Called once the user stops dragging, with the committed alpha as a whole percentage. */
		onValueCommit?: (value: number) => void;
		/**
		 * The slider's accessible name, applied to the thumb.
		 *
		 * @default "Alpha"
		 */
		"aria-label"?: string;
	};
</script>

<script lang="ts">
	import { Slider } from "bits-ui";

	import { getColorPickerContext } from "./color-picker.svelte.js";

	let {
		ref = $bindable(null),
		"aria-label": ariaLabel = "Alpha",
		class: className,
		style,
		...restProps
	}: ColorPickerAlphaSliderProps = $props();

	const root = getColorPickerContext("<ColorPicker.AlphaSlider>");

	/**
	 * The checkerboard sits on the root; the transparent → opaque ramp is layered over it. bits-ui
	 * offsets a horizontal thumb from `right` under `dir="rtl"`, so the ramp mirrors with it — else an
	 * rtl thumb at `0` would sit over the fully opaque end. The checkerboard itself is symmetric.
	 */
	const trackStyle = $derived(
		[
			`background: linear-gradient(to ${root.dir === "rtl" ? "left" : "right"}, transparent, rgb(${root.rgb.r}, ${root.rgb.g}, ${root.rgb.b})), linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
			"background-size: auto, 8px 8px, 8px 8px, 8px 8px, 8px 8px",
			"background-position: 0 0, 0 0, 0 4px, 4px -4px, -4px 0",
		].join("; ") + (typeof style === "string" && style ? `; ${style}` : ""),
	);
</script>

<Slider.Root
	bind:ref
	type="single"
	data-slot="color-picker-alpha-slider"
	data-disabled={root.disabled ? "" : undefined}
	data-readonly={root.readOnly ? "" : undefined}
	min={0}
	max={100}
	step={1}
	dir={root.dir}
	disabled={root.disabled}
	bind:value={() => root.alphaPercent, (next) => root.setAlpha(next / 100)}
	style={trackStyle}
	class={cn(
		"relative flex h-3 w-full touch-none items-center rounded-full select-none data-disabled:pointer-events-none data-disabled:opacity-50",
		className,
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<Slider.Range class="absolute h-full" />
		{#each thumbItems as thumb (thumb.index)}
			<Slider.Thumb
				index={thumb.index}
				data-slot="color-picker-alpha-slider-thumb"
				aria-label={ariaLabel}
				aria-valuetext="{root.alphaPercent}%"
				class="block size-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
			/>
		{/each}
	{/snippet}
</Slider.Root>
