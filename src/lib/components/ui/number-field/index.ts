import Root from "./number-field.svelte";
import Group from "./number-field-group.svelte";
import Input from "./number-field-input.svelte";
import Increment from "./number-field-increment.svelte";
import Decrement from "./number-field-decrement.svelte";
import ScrubArea from "./number-field-scrub-area.svelte";

export type {
	NumberFieldProps,
	NumberFieldRootChildProps,
	NumberFieldRootProps,
} from "./number-field.svelte";
export type {
	NumberFieldGroupChildProps,
	NumberFieldGroupProps,
} from "./number-field-group.svelte";
export type {
	NumberFieldInputChildProps,
	NumberFieldInputProps,
} from "./number-field-input.svelte";
export type {
	NumberFieldIncrementChildProps,
	NumberFieldIncrementProps,
} from "./number-field-increment.svelte";
export type {
	NumberFieldDecrementChildProps,
	NumberFieldDecrementProps,
} from "./number-field-decrement.svelte";
export type { NumberFieldScrubAreaProps } from "./number-field-scrub-area.svelte";

export {
	formatNumber,
	getNumberFieldContext,
	hasNumberFieldContext,
	NUMBER_FIELD_SCRUB_DIRECTIONS,
	NUMBER_FIELD_SIZES,
	NUMBER_FIELD_SPIN_DELAY,
	NUMBER_FIELD_SPIN_INTERVAL,
	numberFieldButtonVariants,
	NumberFieldRootState,
	numberFieldGroupVariants,
	numberFieldInputVariants,
	parseNumber,
	setNumberFieldContext,
	type NumberFieldRootStateProps,
	type NumberFieldScrubDirection,
	type NumberFieldSize,
} from "./number-field.svelte.js";

export {
	Root,
	Group,
	Input,
	Increment,
	Decrement,
	ScrubArea,
	//
	Root as NumberField,
	Group as NumberFieldGroup,
	Input as NumberFieldInput,
	Increment as NumberFieldIncrement,
	Decrement as NumberFieldDecrement,
	ScrubArea as NumberFieldScrubArea,
};
