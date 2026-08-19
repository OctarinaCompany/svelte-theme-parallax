import { getContext, hasContext, setContext } from "svelte";

import type { PinInputCell } from "bits-ui";

/**
 * Pattern strings, verbatim from the `input-otp` package (regexps.ts) that upstream's
 * `OTPInput` wraps. The demos import them from that package, so this barrel carries them —
 * they are plain strings, and bits-ui's PinInput accepts a string `pattern` the same way
 * (pin-input.svelte.js:43-47 compiles it to a RegExp).
 */
export const REGEXP_ONLY_DIGITS = "^\\d+$";
export const REGEXP_ONLY_CHARS = "^[a-zA-Z]+$";
export const REGEXP_ONLY_DIGITS_AND_CHARS = "^[a-zA-Z0-9]+$";

/**
 * What one slot knows about itself: `char`, `isActive`, `hasFakeCaret` — the exact shape
 * upstream reads from `OTPInputContext` and the exact shape
 * bits-ui's PinInput hands to its `children` snippet, so the primitive's cells flow through
 * untouched.
 */
export type InputOTPCell = PinInputCell;

/**
 * Upstream tolerates a slot rendered past `maxLength` by falling back to an empty object
 * (`inputOTPContext?.slots[index] ?? {}`, input-otp.tsx:51). The typed equivalent: an inert
 * cell, so `<InputOTP.Slot index={9}>` on a 6-slot input renders empty instead of throwing.
 */
const EMPTY_CELL: InputOTPCell = { char: null, isActive: false, hasFakeCaret: false };

export type InputOTPRootStateProps = {
	readonly getCells: () => readonly InputOTPCell[];
};

/**
 * One instance per `<InputOTP>`, published on context.
 *
 * Replaces upstream's `OTPInputContext` (50 — provided by the React
 * `input-otp` package itself). bits-ui's PinInput exposes its cells only as a snippet
 * parameter, while this surface addresses them by `index` from anywhere below the root;
 * this class is the bridge. The reactive input arrives as a getter function rather than a
 * snapshot, the same convention as the sibling `SegmentedInputRootState`.
 */
export class InputOTPRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: InputOTPRootStateProps;

	readonly cells: readonly InputOTPCell[] = $derived(this.#props.getCells());

	constructor(props: InputOTPRootStateProps) {
		this.#props = props;
	}

	/** The slot-by-index lookup upstream does inline, out-of-range safe. */
	cellAt(index: number): InputOTPCell {
		return this.cells[index] ?? EMPTY_CELL;
	}
}

const INPUT_OTP_CONTEXT_KEY = Symbol("input-otp");

export function setInputOTPContext(state: InputOTPRootState): InputOTPRootState {
	return setContext(INPUT_OTP_CONTEXT_KEY, state);
}

export function hasInputOTPContext(): boolean {
	return hasContext(INPUT_OTP_CONTEXT_KEY);
}

/** Read the root's state, throwing when there is no `<InputOTP>` ancestor. */
export function getInputOTPContext(consumerName = "<InputOTP.Slot>"): InputOTPRootState {
	if (!hasInputOTPContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<InputOTP>\`.`);
	}
	return getContext<InputOTPRootState>(INPUT_OTP_CONTEXT_KEY);
}
