import type { ColorPickerInputField as ColorPickerInputFieldModelType } from "./color.js";

import Root from "./color-picker.svelte";
import Trigger from "./color-picker-trigger.svelte";
import Content from "./color-picker-content.svelte";
import Area from "./color-picker-area.svelte";
import HueSlider from "./color-picker-hue-slider.svelte";
import AlphaSlider from "./color-picker-alpha-slider.svelte";
import Swatch from "./color-picker-swatch.svelte";
import EyeDropper from "./color-picker-eye-dropper.svelte";
import FormatSelect from "./color-picker-format-select.svelte";
import Input from "./color-picker-input.svelte";
import InputField from "./color-picker-input-field.svelte";

export type {
	ColorPickerChildProps,
	ColorPickerProps,
	ColorPickerRootProps,
} from "./color-picker.svelte";
export type {
	ColorPickerTriggerChildProps,
	ColorPickerTriggerProps,
} from "./color-picker-trigger.svelte";
export type { ColorPickerContentProps } from "./color-picker-content.svelte";
export type { ColorPickerAreaChildProps, ColorPickerAreaProps } from "./color-picker-area.svelte";
export type { ColorPickerHueSliderProps } from "./color-picker-hue-slider.svelte";
export type { ColorPickerAlphaSliderProps } from "./color-picker-alpha-slider.svelte";
export type {
	ColorPickerSwatchChildProps,
	ColorPickerSwatchProps,
} from "./color-picker-swatch.svelte";
export type {
	ColorPickerEyeDropperChildProps,
	ColorPickerEyeDropperProps,
} from "./color-picker-eye-dropper.svelte";
export type {
	ColorPickerFormatSelectChildProps,
	ColorPickerFormatSelectProps,
} from "./color-picker-format-select.svelte";
export type { ColorPickerInputProps } from "./color-picker-input.svelte";
export {
	colorPickerInputVariants,
	type ColorPickerInputFieldPosition,
	type ColorPickerInputFieldProps,
} from "./color-picker-input-field.svelte";

export {
	ColorPickerAreaState,
	ColorPickerRootState,
	getColorPickerContext,
	setColorPickerContext,
	type ColorPickerAreaStateProps,
	type ColorPickerRootStateProps,
	type EyeDropperApi,
} from "./color-picker.svelte.js";

export {
	clampChannel,
	COLOR_FORMATS,
	colorToString,
	describeColor,
	getInputFields,
	hexToRgb,
	hslToRgb,
	hsvToRgb,
	isColorFormat,
	parseColorString,
	rgbToHex,
	rgbToHsl,
	rgbToHsv,
	type ColorFormat,
	type ColorPickerInputChannel,
	type ColorPickerInputFieldsInput,
	type HslColor,
	type HsvaColor,
	type RgbaColor,
} from "./color.js";

/**
 * The channel model {@link getInputFields} returns, one entry per rendered field.
 *
 * The obvious name for this re-export would be `ColorPickerInputField`, but
 * that name is already the `InputField` part's `ColorPicker*` alias below and a module cannot export
 * one name as both a type and a value. The component alias wins — it is the documented public part —
 * so the model carries the `Model` suffix here. It is still `ColorPickerInputField` when imported
 * straight from `./color.js`.
 */
export type ColorPickerInputFieldModel = ColorPickerInputFieldModelType;

export {
	Root,
	Trigger,
	Content,
	Area,
	HueSlider,
	AlphaSlider,
	Swatch,
	EyeDropper,
	FormatSelect,
	Input,
	InputField,
	//
	Root as ColorPicker,
	Trigger as ColorPickerTrigger,
	Content as ColorPickerContent,
	Area as ColorPickerArea,
	HueSlider as ColorPickerHueSlider,
	AlphaSlider as ColorPickerAlphaSlider,
	Swatch as ColorPickerSwatch,
	EyeDropper as ColorPickerEyeDropper,
	FormatSelect as ColorPickerFormatSelect,
	Input as ColorPickerInput,
	InputField as ColorPickerInputField,
};
