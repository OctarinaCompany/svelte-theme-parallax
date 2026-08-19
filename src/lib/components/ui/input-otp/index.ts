import Root from "./input-otp.svelte";
import Group from "./input-otp-group.svelte";
import Separator from "./input-otp-separator.svelte";
import Slot from "./input-otp-slot.svelte";

export type { InputOTPProps, InputOTPRootProps } from "./input-otp.svelte";
export type { InputOTPGroupProps } from "./input-otp-group.svelte";
export type { InputOTPSeparatorProps } from "./input-otp-separator.svelte";
export type { InputOTPSlotProps } from "./input-otp-slot.svelte";

export {
	getInputOTPContext,
	hasInputOTPContext,
	InputOTPRootState,
	REGEXP_ONLY_CHARS,
	REGEXP_ONLY_DIGITS,
	REGEXP_ONLY_DIGITS_AND_CHARS,
	setInputOTPContext,
	type InputOTPCell,
	type InputOTPRootStateProps,
} from "./input-otp.svelte.js";

export {
	Root,
	Group,
	Slot,
	Separator,
	//
	Root as InputOTP,
	Group as InputOTPGroup,
	Slot as InputOTPSlot,
	Separator as InputOTPSeparator,
};
