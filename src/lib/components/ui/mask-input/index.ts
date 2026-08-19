import Root from "./mask-input.svelte";

export type { MaskInputChildProps, MaskInputProps, MaskInputRootProps } from "./mask-input.svelte";

export {
	MASK_INPUT_VALIDATION_MODES,
	MaskInputState,
	type MaskInputStateProps,
	type MaskInputValidationMode,
} from "./mask-input.svelte.js";

// The `phone-input` reuse surface: the pattern table and the mask/unmask/caret maths, all
// pure and rune-free, so another component can import them without rendering a field.
export {
	applyCurrencyMask,
	applyMask,
	applyPercentageMask,
	DEFAULT_CURRENCY,
	DEFAULT_LOCALE,
	fromUnmaskedIndex,
	getCurrencyCaretPosition,
	getPatternCaretPosition,
	getUnmaskedValue,
	isCurrencyAtEnd,
	isCurrencyMask,
	MASK_PATTERN_KEYS,
	MASK_PATTERNS,
	resolveMaskPattern,
	toUnmaskedIndex,
	type MaskPattern,
	type MaskPatternKey,
	type TransformOptions,
	type ValidateOptions,
} from "./mask-engine.js";

export {
	Root,
	//
	Root as MaskInput,
};
