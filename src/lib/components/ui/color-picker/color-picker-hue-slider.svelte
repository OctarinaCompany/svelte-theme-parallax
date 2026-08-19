<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Slider as SliderPrimitive } from "bits-ui";

	/**
	 * Every single-value `bits-ui` `Slider.Root` prop except the ones this part owns: `type`, `value`,
	 * `onValueChange`, `min`, `max`, `dir` and `disabled` all come from the picker.
	 *
	 * bits-ui has no `Slider.Track` — its `Slider.Root` *is* the track — so upstream's track classes
	 * and the full-spectrum gradient live on the root.
	 */
	export type ColorPickerHueSliderProps = Omit<
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
		/** Called once the user stops dragging, with the committed hue in degrees. */
		onValueCommit?: (value: number) => void;
		/**
		 * The slider's accessible name, applied to the thumb.
		 *
		 * @default "Hue"
		 */
		"aria-label"?: string;
	};
</script>

<script lang="ts">
	import { Slider } from "bits-ui";

	import { getColorPickerContext } from "./color-picker.svelte.js";

	let {
		ref = $bindable(null),
		"aria-label": ariaLabel = "Hue",
		class: className,
		style,
		...restProps
	}: ColorPickerHueSliderProps = $props();

	const root = getColorPickerContext("<ColorPicker.HueSlider>");

	/**
	 * bits-ui offsets a horizontal thumb from `right` under `dir="rtl"`, so a track painted
	 * unconditionally `to right` would put hue `120` under magenta. The ramp follows the direction the
	 * thumb travels in, which is why it lives in `style` rather than in a `bg-[…]` class.
	 */
	const trackStyle = $derived(
		`background: linear-gradient(to ${root.dir === "rtl" ? "left" : "right"}, #ff0000 0%, #ffff00 16.66%, #00ff00 33.33%, #00ffff 50%, #0000ff 66.66%, #ff00ff 83.33%, #ff0000 100%)` +
			(typeof style === "string" && style ? `; ${style}` : ""),
	);
</script>

<Slider.Root
	bind:ref
	type="single"
	data-slot="color-picker-hue-slider"
	data-disabled={root.disabled ? "" : undefined}
	data-readonly={root.readOnly ? "" : undefined}
	min={0}
	max={360}
	step={1}
	dir={root.dir}
	disabled={root.disabled}
	bind:value={() => root.hue, (next) => root.setHue(next)}
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
				data-slot="color-picker-hue-slider-thumb"
				aria-label={ariaLabel}
				aria-valuetext="{root.hue} degrees"
				class="block size-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
			/>
		{/each}
	{/snippet}
</Slider.Root>
