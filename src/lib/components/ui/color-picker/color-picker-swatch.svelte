<script lang="ts" module>
	import type {
		ColorSwatchChildProps,
		ColorSwatchRootProps,
		ColorSwatchSize,
	} from "$lib/components/ui/color-swatch/index.js";
	import type { Snippet } from "svelte";

	/**
	 * The merged attribute payload handed to the `child` snippet — `ColorSwatch`'s own payload, with
	 * `data-slot` and `aria-label` overridden by this part, plus the picker's `data-readonly`.
	 */
	export type ColorPickerSwatchChildProps = ColorSwatchChildProps & {
		/** Present (`""`) iff the picker is `readOnly`. */
		"data-readonly"?: "" | undefined;
	};

	export type ColorPickerSwatchProps = Omit<
		ColorSwatchRootProps,
		"color" | "disabled" | "child"
	> & {
		/**
		 * The swatch size.
		 *
		 * @default "default"
		 */
		size?: ColorSwatchSize;
		/**
		 * Suppress the checkerboard pattern behind a translucent colour.
		 *
		 * @default false
		 */
		withoutTransparency?: boolean;
		/**
		 * Render the swatch onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild`. In `child` mode `ref` stays `null`.
		 */
		child?: Snippet<[{ props: ColorPickerSwatchChildProps }]>;
	};
</script>

<script lang="ts">
	import * as ColorSwatch from "$lib/components/ui/color-swatch/index.js";

	import { colorToString } from "./color.js";
	import { getColorPickerContext } from "./color-picker.svelte.js";

	let {
		ref = $bindable(null),
		size = "default",
		withoutTransparency = false,
		class: className,
		child: childSnippet,
		...restProps
	}: ColorPickerSwatchProps = $props();

	const root = getColorPickerContext("<ColorPicker.Swatch>");

	/**
	 * A translucent colour is handed over in `rgba()` notation so `ColorSwatch`'s own `hasAlpha` check
	 * fires and the checkerboard renders — including at alpha `0`, which would otherwise paint nothing
	 * at all.
	 */
	const colorValue = $derived(
		root.isEmpty
			? undefined
			: root.alpha < 1
				? `rgba(${root.rgb.r}, ${root.rgb.g}, ${root.rgb.b}, ${root.alpha})`
				: root.hex,
	);

	const ariaLabel = $derived(
		root.isEmpty ? "No color selected" : `Current color: ${colorToString(root.rgb, root.format)}`,
	);
</script>

{#if childSnippet}
	<ColorSwatch.Root
		color={colorValue}
		{size}
		{withoutTransparency}
		disabled={root.disabled}
		data-slot="color-picker-swatch"
		data-readonly={root.readOnly ? "" : undefined}
		aria-label={ariaLabel}
		class={className}
		{...restProps}
	>
		{#snippet child({ props })}
			{@render childSnippet({ props: props as ColorPickerSwatchChildProps })}
		{/snippet}
	</ColorSwatch.Root>
{:else}
	<ColorSwatch.Root
		bind:ref
		color={colorValue}
		{size}
		{withoutTransparency}
		disabled={root.disabled}
		data-slot="color-picker-swatch"
		data-readonly={root.readOnly ? "" : undefined}
		aria-label={ariaLabel}
		class={className}
		{...restProps}
	/>
{/if}
