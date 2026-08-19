import Root from "./color-swatch.svelte";

export {
	colorSwatchVariants,
	COLOR_SWATCH_SIZES,
	resolveColorSwatchSize,
	type ColorSwatchSize,
	type ColorSwatchRootProps,
	type ColorSwatchProps,
	type ColorSwatchChildProps,
} from "./color-swatch.svelte";

export {
	normalizeColorValue,
	isCssColor,
	hasAlpha,
	getColorBackgroundStyle,
	type ColorBackgroundOptions,
} from "./color.js";

export {
	Root,
	//
	Root as ColorSwatch,
};
