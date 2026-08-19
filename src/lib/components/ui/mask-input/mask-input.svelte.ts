import type {
	ClipboardEventHandler,
	CompositionEventHandler,
	FocusEventHandler,
	FormEventHandler,
	HTMLInputAttributes,
	KeyboardEventHandler,
} from "svelte/elements";

import {
	applyMask,
	CURRENCY_PERCENTAGE_SYMBOLS,
	fromUnmaskedIndex,
	getCurrencyCaretPosition,
	getPatternCaretPosition,
	getUnmaskedValue,
	isCurrencyAtEnd,
	isCurrencyMask,
	NUMERIC_MASK_PATTERNS,
	resolveMaskPattern,
	toUnmaskedIndex,
	type MaskPattern,
	type MaskPatternKey,
	type TransformOptions,
	type ValidateOptions,
} from "./mask-engine.js";

/** Counts the `#` value slots of a pattern; module-level so its `lastIndex` never leaks. */
const HASH_PATTERN = /#/g;

/** When `onValidate` runs, mirroring `react-hook-form`'s modes. */
export const MASK_INPUT_VALIDATION_MODES = [
	"onChange",
	"onBlur",
	"onSubmit",
	"onTouched",
	"all",
] as const;

/** When `onValidate` runs. See {@link MASK_INPUT_VALIDATION_MODES}. */
export type MaskInputValidationMode = (typeof MASK_INPUT_VALIDATION_MODES)[number];

/** A DOM event whose `currentTarget` is known to be the masked `<input>`. */
type MaskInputEvent<E extends Event> = E & { currentTarget: EventTarget & HTMLInputElement };

/**
 * Everything {@link MaskInputState} needs from the component. Every reactive value arrives as a
 * getter function so the class keeps tracking it; `setValue` is the one place the value is written.
 */
export type MaskInputStateProps = {
	getValue: () => string;
	/** Assigns the component's `value`. Notification is the caller's job, through `getOnValueChange`. */
	setValue: (value: string) => void;
	getMask: () => MaskPatternKey | MaskPattern | undefined;
	getCurrency: () => string;
	getLocale: () => string;
	getValidationMode: () => MaskInputValidationMode;
	getPlaceholder: () => string | undefined | null;
	getMaskPlaceholder: () => string | undefined;
	getWithoutMask: () => boolean;
	getDisabled: () => boolean;
	getReadonly: () => boolean;
	getInputMode: () => HTMLInputAttributes["inputmode"];
	getMaxLength: () => number | undefined | null;
	getMin: () => string | number | undefined | null;
	getMax: () => string | number | undefined | null;
	getOnValueChange: () => ((maskedValue: string, unmaskedValue: string) => void) | undefined;
	getOnValidate: () => ((isValid: boolean, unmaskedValue: string) => void) | undefined;
	getOninput: () => FormEventHandler<HTMLInputElement> | undefined | null;
	getOnfocus: () => FocusEventHandler<HTMLInputElement> | undefined | null;
	getOnblur: () => FocusEventHandler<HTMLInputElement> | undefined | null;
	getOnkeydown: () => KeyboardEventHandler<HTMLInputElement> | undefined | null;
	getOnpaste: () => ClipboardEventHandler<HTMLInputElement> | undefined | null;
	getOncompositionstart: () => CompositionEventHandler<HTMLInputElement> | undefined | null;
	getOncompositionend: () => CompositionEventHandler<HTMLInputElement> | undefined | null;
};

function toNumber(value: string | number | undefined | null): number | undefined {
	if (value === undefined || value === null) return undefined;
	return typeof value === "string" ? parseFloat(value) : value;
}

/**
 * The behaviour of `<MaskInput>`: what the field displays, where the caret goes after the value has
 * been reformatted, and when validation runs.
 *
 * Every handler resolves the element from `event.currentTarget` rather than from a stored `ref`
 * (divergence D-05), which is what keeps the `child` snippet behaviour-complete.
 */
export class MaskInputState {
	// The `$derived` fields below are lazy at runtime (evaluated only when read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: MaskInputStateProps;

	/** Whether the field currently holds focus; drives the mask placeholder swap. */
	focused = $state(false);
	/** Whether an IME composition is in progress; masking is held back until it ends. */
	composing = $state(false);
	/** Whether the field has been blurred at least once; drives the `onTouched` mode. */
	touched = $state(false);

	/** The active pattern: the table entry for a key, or the object the caller passed. */
	readonly maskPattern = $derived(resolveMaskPattern(this.#props.getMask()));

	/** The currency/locale pair handed to every transform and formatter. */
	readonly transformOpts: TransformOptions = $derived({
		currency: this.#props.getCurrency(),
		locale: this.#props.getLocale(),
	});

	/** The bounds handed to the pattern's `validate`, parsed out of the `min`/`max` attributes. */
	readonly validateOpts: ValidateOptions = $derived({
		min: toNumber(this.#props.getMin()),
		max: toNumber(this.#props.getMax()),
	});

	/** The placeholder to render right now, per the resolution table in the component's docs. */
	readonly placeholderValue = $derived.by(() => {
		const placeholder = this.#props.getPlaceholder() ?? undefined;
		const maskPlaceholder = this.#props.getMaskPlaceholder();

		if (this.#props.getWithoutMask()) return placeholder;

		if (placeholder && maskPlaceholder) {
			return this.focused ? maskPlaceholder : placeholder;
		}

		if (maskPlaceholder) {
			return this.focused ? maskPlaceholder : undefined;
		}

		return placeholder;
	});

	/** The masked string the `<input>` shows. The component is the only writer of `element.value`. */
	readonly displayValue = $derived.by(() => {
		const value = this.#props.getValue();
		const maskPattern = this.maskPattern;

		if (this.#props.getWithoutMask() || !maskPattern || !value) return value ?? "";

		const unmasked = getUnmaskedValue({
			value,
			transform: maskPattern.transform,
			...this.transformOpts,
		});
		return applyMask({
			value: unmasked,
			pattern: maskPattern.pattern,
			...this.transformOpts,
			mask: this.#props.getMask(),
		});
	});

	/** How many value slots the pattern has, or `undefined` for `Intl`-formatted patterns. */
	readonly tokenCount = $derived.by(() => {
		const maskPattern = this.maskPattern;
		if (!maskPattern || CURRENCY_PERCENTAGE_SYMBOLS.test(maskPattern.pattern)) return undefined;
		return maskPattern.pattern.match(HASH_PATTERN)?.length ?? 0;
	});

	/**
	 * The emitted `maxlength`. A pattern with fixed slots caps the field at its rendered length;
	 * everything else — including a `#`-less custom pattern, whose `tokenCount` is a falsy `0` —
	 * falls back to the caller's `maxlength`.
	 */
	readonly calculatedMaxLength = $derived(
		this.tokenCount ? this.maskPattern?.pattern.length : (this.#props.getMaxLength() ?? undefined),
	);

	/** The emitted `inputmode`: the caller's wins, else one derived from the mask key. */
	readonly calculatedInputMode = $derived.by((): HTMLInputAttributes["inputmode"] => {
		const inputMode = this.#props.getInputMode();
		if (inputMode) return inputMode;
		if (!this.maskPattern) return undefined;

		const mask = this.#props.getMask();
		if (mask === "currency" || mask === "percentage" || mask === "ipv4") {
			return "decimal";
		}

		if (typeof mask === "string" && NUMERIC_MASK_PATTERNS.test(mask)) {
			return "numeric";
		}
		return undefined;
	});

	constructor(props: MaskInputStateProps) {
		this.#props = props;
	}

	/**
	 * Whether `onValidate` should run for this trigger.
	 *
	 * `touched` is a parameter rather than a plain read of `this.touched` so `onblur` can pass the
	 * value from *before* it marked the field touched — which is what React's stale-closure
	 * `useCallback` does upstream, and what makes the first blur validate in `onTouched` mode.
	 */
	shouldValidate(trigger: "change" | "blur", touched: boolean = this.touched): boolean {
		if (!this.#props.getOnValidate() || !this.maskPattern?.validate) return false;

		switch (this.#props.getValidationMode()) {
			case "onChange":
				return trigger === "change";
			case "onBlur":
				return trigger === "blur";
			case "onSubmit":
				return false;
			case "onTouched":
				return touched ? trigger === "change" : trigger === "blur";
			case "all":
				return true;
			default:
				return trigger === "change";
		}
	}

	/** Runs the pattern's `validate` and reports the verdict. */
	runValidate(unmaskedValue: string) {
		const onValidate = this.#props.getOnValidate();
		const validate = this.maskPattern?.validate;
		if (onValidate && validate) {
			onValidate(validate(unmaskedValue, this.validateOpts), unmaskedValue);
		}
	}

	/**
	 * The single commit path (divergence D-10): assign the value, then notify. Upstream writes state
	 * only in some branches and calls `onValueChange` in others, which would let `bind:value` and the
	 * derived display value go stale here.
	 */
	#commit(maskedValue: string, unmaskedValue: string) {
		this.#props.setValue(maskedValue);
		this.#props.getOnValueChange()?.(maskedValue, unmaskedValue);
	}

	oninput(event: MaskInputEvent<Event>) {
		this.#props.getOninput()?.(event);
		if (event.defaultPrevented) return;

		const element = event.currentTarget;
		const inputValue = element.value;

		// Mid-composition the raw text is kept as-is and nobody is notified; `oncompositionend`
		// masks and commits it once the IME is done.
		if (this.composing) {
			this.#props.setValue(inputValue);
			return;
		}

		const maskPattern = this.maskPattern;

		if (this.#props.getWithoutMask() || !maskPattern) {
			if (this.shouldValidate("change")) this.#props.getOnValidate()?.(true, inputValue);
			this.#commit(inputValue, inputValue);
			return;
		}

		const mask = this.#props.getMask();
		const unmaskedValue = getUnmaskedValue({
			value: inputValue,
			transform: maskPattern.transform,
			...this.transformOpts,
		});
		const newValue = applyMask({
			value: unmaskedValue,
			pattern: maskPattern.pattern,
			...this.transformOpts,
			mask,
		});

		if (newValue !== inputValue) {
			const oldCursorPosition = element.selectionStart ?? 0;

			element.value = newValue;

			const currentUnmasked = getUnmaskedValue({
				value: newValue,
				transform: maskPattern.transform,
				...this.transformOpts,
			});
			const previousUnmasked = getUnmaskedValue({
				value: this.#props.getValue(),
				transform: maskPattern.transform,
				...this.transformOpts,
			});

			let newCursorPosition = CURRENCY_PERCENTAGE_SYMBOLS.test(maskPattern.pattern)
				? getCurrencyCaretPosition({
						newValue,
						mask,
						transformOpts: this.transformOpts,
						oldCursorPosition,
						oldValue: inputValue,
						previousUnmasked,
					})
				: getPatternCaretPosition({
						newValue,
						maskPattern,
						currentUnmasked,
						oldCursorPosition,
						oldValue: inputValue,
						previousUnmasked,
					});

			if (isCurrencyMask({ mask, pattern: maskPattern.pattern })) {
				if (mask === "currency") {
					if (!isCurrencyAtEnd(this.transformOpts)) {
						newCursorPosition = Math.max(1, newCursorPosition);
					}
				} else {
					newCursorPosition = Math.max(1, newCursorPosition);
				}
			} else if (maskPattern.pattern.includes("%")) {
				newCursorPosition = Math.min(newValue.length - 1, newCursorPosition);
			}

			newCursorPosition = Math.min(newCursorPosition, newValue.length);

			element.setSelectionRange(newCursorPosition, newCursorPosition);
		}

		if (this.shouldValidate("change")) this.runValidate(unmaskedValue);
		this.#commit(newValue, unmaskedValue);
	}

	onfocus(event: MaskInputEvent<FocusEvent>) {
		this.#props.getOnfocus()?.(event);
		if (event.defaultPrevented) return;

		this.focused = true;
	}

	onblur(event: MaskInputEvent<FocusEvent>) {
		this.#props.getOnblur()?.(event);
		if (event.defaultPrevented) return;

		this.focused = false;

		const wasTouched = this.touched;
		if (!wasTouched) this.touched = true;

		if (this.shouldValidate("blur", wasTouched)) {
			const currentValue = event.currentTarget.value;
			const maskPattern = this.maskPattern;
			const unmaskedValue = maskPattern
				? getUnmaskedValue({
						value: currentValue,
						transform: maskPattern.transform,
						...this.transformOpts,
					})
				: currentValue;
			this.runValidate(unmaskedValue);
		}
	}

	oncompositionstart(event: MaskInputEvent<CompositionEvent>) {
		this.#props.getOncompositionstart()?.(event);
		if (event.defaultPrevented) return;

		this.composing = true;
	}

	oncompositionend(event: MaskInputEvent<CompositionEvent>) {
		this.#props.getOncompositionend()?.(event);
		if (event.defaultPrevented) return;

		this.composing = false;

		const inputValue = event.currentTarget.value;
		const maskPattern = this.maskPattern;

		if (!maskPattern || this.#props.getWithoutMask()) {
			if (this.shouldValidate("change")) this.#props.getOnValidate()?.(true, inputValue);
			this.#commit(inputValue, inputValue);
			return;
		}

		const unmasked = getUnmaskedValue({
			value: inputValue,
			transform: maskPattern.transform,
			...this.transformOpts,
		});
		const masked = applyMask({
			value: unmasked,
			pattern: maskPattern.pattern,
			...this.transformOpts,
			mask: this.#props.getMask(),
		});

		if (this.shouldValidate("change")) this.runValidate(unmasked);
		this.#commit(masked, unmasked);
	}

	onpaste(event: MaskInputEvent<ClipboardEvent>) {
		this.#props.getOnpaste()?.(event);
		if (event.defaultPrevented) return;

		// Divergence D-08: upstream omits this guard and would rewrite a read-only field's value.
		if (this.#props.getDisabled() || this.#props.getReadonly()) return;

		const maskPattern = this.maskPattern;
		if (this.#props.getWithoutMask() || !maskPattern) return;

		const mask = this.#props.getMask();
		if (mask === "ipv4") return;

		const target = event.currentTarget;
		const pastedData = event.clipboardData?.getData("text");
		if (!pastedData) return;

		event.preventDefault();

		const currentValue = target.value;
		const selectionStart = target.selectionStart ?? 0;
		const selectionEnd = target.selectionEnd ?? 0;

		const newInputValue =
			currentValue.slice(0, selectionStart) + pastedData + currentValue.slice(selectionEnd);

		const unmasked = getUnmaskedValue({
			value: newInputValue,
			transform: maskPattern.transform,
			...this.transformOpts,
		});
		const newMaskedValue = applyMask({
			value: unmasked,
			pattern: maskPattern.pattern,
			...this.transformOpts,
			mask,
		});

		target.value = newMaskedValue;

		// Upstream returns from both symbol branches without notifying; here they run the same
		// validate-and-commit tail as the slot branch so `bind:value`, `onValueChange`, and
		// `onValidate` cannot go stale behind the element (D-10).
		if (isCurrencyMask({ mask, pattern: maskPattern.pattern })) {
			const caret = isCurrencyAtEnd(this.transformOpts)
				? newMaskedValue.search(/\s*[^\d\s]+$/)
				: newMaskedValue.length;
			target.setSelectionRange(caret, caret);
			if (this.shouldValidate("change")) this.runValidate(unmasked);
			this.#commit(newMaskedValue, unmasked);
			return;
		}

		if (maskPattern.pattern.includes("%")) {
			const caret = newMaskedValue.length - 1;
			target.setSelectionRange(caret, caret);
			if (this.shouldValidate("change")) this.runValidate(unmasked);
			this.#commit(newMaskedValue, unmasked);
			return;
		}

		let position = 0;
		let count = 0;
		for (let i = 0; i < maskPattern.pattern.length && i < newMaskedValue.length; i++) {
			if (maskPattern.pattern[i] === "#") {
				count++;
				if (count <= unmasked.length) {
					position = i + 1;
				}
			}
		}

		target.setSelectionRange(position, position);

		if (this.shouldValidate("change")) this.runValidate(unmasked);
		this.#commit(newMaskedValue, unmasked);
	}

	onkeydown(event: MaskInputEvent<KeyboardEvent>) {
		this.#props.getOnkeydown()?.(event);
		if (event.defaultPrevented) return;

		// Divergence D-08: upstream omits this guard and would rewrite a read-only field's value.
		if (this.#props.getDisabled() || this.#props.getReadonly()) return;

		const maskPattern = this.maskPattern;
		if (this.#props.getWithoutMask() || !maskPattern) return;

		const mask = this.#props.getMask();
		if (mask === "ipv4") return;

		// `Intl`-formatted values are re-derived from scratch on `input`, so the native edit is left
		// alone; so is any non-collapsed selection, which the browser deletes as a whole.
		const isSymbolPattern =
			mask === "currency" ||
			mask === "percentage" ||
			maskPattern.pattern.includes("$") ||
			maskPattern.pattern.includes("€") ||
			maskPattern.pattern.includes("%");

		if (event.key === "Backspace") {
			const target = event.currentTarget;
			const cursorPosition = target.selectionStart ?? 0;
			const selectionEnd = target.selectionEnd ?? 0;
			const currentValue = target.value;

			if (isSymbolPattern) return;
			if (cursorPosition !== selectionEnd) return;

			if (cursorPosition > 0) {
				const charBeforeCursor = currentValue[cursorPosition - 1];

				if (charBeforeCursor) {
					event.preventDefault();

					const unmaskedIndex = toUnmaskedIndex({
						masked: currentValue,
						pattern: maskPattern.pattern,
						caret: cursorPosition,
					});

					if (unmaskedIndex > 0) {
						const currentUnmasked = getUnmaskedValue({
							value: currentValue,
							transform: maskPattern.transform,
							...this.transformOpts,
						});
						const nextUnmasked =
							currentUnmasked.slice(0, unmaskedIndex - 1) + currentUnmasked.slice(unmaskedIndex);
						const nextMasked = applyMask({
							value: nextUnmasked,
							pattern: maskPattern.pattern,
							...this.transformOpts,
							mask,
						});

						target.value = nextMasked;
						const nextCaret = fromUnmaskedIndex({
							masked: nextMasked,
							pattern: maskPattern.pattern,
							unmaskedIndex: unmaskedIndex - 1,
						});

						target.setSelectionRange(nextCaret, nextCaret);

						this.#commit(nextMasked, nextUnmasked);
					}
					return;
				}
			}
		}

		if (event.key === "Delete") {
			const target = event.currentTarget;
			const cursorPosition = target.selectionStart ?? 0;
			const selectionEnd = target.selectionEnd ?? 0;
			const currentValue = target.value;

			if (isSymbolPattern) return;
			if (cursorPosition !== selectionEnd) return;

			if (cursorPosition < currentValue.length) {
				const charAtCursor = currentValue[cursorPosition];

				if (charAtCursor) {
					event.preventDefault();

					const unmaskedIndex = toUnmaskedIndex({
						masked: currentValue,
						pattern: maskPattern.pattern,
						caret: cursorPosition,
					});

					const currentUnmasked = getUnmaskedValue({
						value: currentValue,
						transform: maskPattern.transform,
						...this.transformOpts,
					});

					if (unmaskedIndex < currentUnmasked.length) {
						const nextUnmasked =
							currentUnmasked.slice(0, unmaskedIndex) + currentUnmasked.slice(unmaskedIndex + 1);
						const nextMasked = applyMask({
							value: nextUnmasked,
							pattern: maskPattern.pattern,
							...this.transformOpts,
							mask,
						});

						target.value = nextMasked;
						const nextCaret = fromUnmaskedIndex({
							masked: nextMasked,
							pattern: maskPattern.pattern,
							unmaskedIndex,
						});

						target.setSelectionRange(nextCaret, nextCaret);

						this.#commit(nextMasked, nextUnmasked);
					}
					return;
				}
			}
		}
	}
}
