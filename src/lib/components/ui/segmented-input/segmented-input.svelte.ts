import { getContext, hasContext, setContext } from "svelte";
import { tv } from "tailwind-variants";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

import { SegmentNavigation } from "./segment-navigation.svelte.js";

/** Every value `size` accepts, in upstream declaration order. */
export const SEGMENTED_INPUT_SIZES = ["default", "sm", "lg"] as const;

/** `'default' | 'sm' | 'lg'` — upstream `Size`. */
export type SegmentedInputSize = (typeof SEGMENTED_INPUT_SIZES)[number];

/** Every value `orientation` accepts, in upstream declaration order. */
export const SEGMENTED_INPUT_ORIENTATIONS = ["horizontal", "vertical"] as const;

/** `'horizontal' | 'vertical'` — the same tuple `SegmentOrientation` names. */
export type SegmentedInputOrientation = (typeof SEGMENTED_INPUT_ORIENTATIONS)[number];

/**
 * Upstream `segmentedInputItemVariants`, translated from
 * `cva` to `tv()`, with two deliberate corrections:
 *
 * - **Logical borders (divergence D-06).** Upstream mixes logical and physical properties in one
 *   rule (`-ms-px … border-l-0`), so under `dir="rtl"` every seam renders a doubled border and the
 *   leading edge loses its own. `border-s-0`/`border-s` is the same result in LTR and the intended
 *   one in RTL.
 * - **Paddings re-anchored.** Upstream's scale sits on its `h-9 px-3` base input; here the
 *   heights consume the house `--control-h-*` ramp (sm 32 / default 40 / lg 48, the same
 *   tokens the select-trigger and Button read
 *   steps) — while each horizontal padding steps down one to the tighter house field.
 *
 * The vertical compounds that *restore* a corner restore it at the group's own radius (divergence
 * D-05): `rounded-md`, the radius this repo's `Input` shares with upstream's.
 *
 * Colour, focus and invalid styling all come from the composed `Input`; these variants add geometry
 * only.
 */
export const segmentedInputItemVariants = tv({
	base: "",
	variants: {
		position: {
			isolated: "",
			first: "rounded-e-none",
			middle: "-ms-px rounded-none border-s-0",
			last: "-ms-px rounded-s-none border-s-0",
		},
		orientation: {
			horizontal: "",
			vertical: "",
		},
		size: {
			sm: "h-(--control-h-sm) px-2 text-xs",
			default: "h-(--control-h-default) px-2.5",
			lg: "h-(--control-h-lg) px-3",
		},
	},
	compoundVariants: [
		{
			position: "first",
			orientation: "vertical",
			class: "ms-0 rounded-e-md rounded-b-none border-s",
		},
		{
			position: "middle",
			orientation: "vertical",
			class: "ms-0 -mt-px rounded-none border-s border-t-0",
		},
		{
			position: "last",
			orientation: "vertical",
			class: "ms-0 -mt-px rounded-s-md rounded-t-none border-s border-t-0",
		},
	],
	defaultVariants: {
		position: "isolated",
		orientation: "horizontal",
		size: "default",
	},
});

export type SegmentedInputRootStateProps = {
	readonly getDir: () => Direction;
	readonly getOrientation: () => SegmentedInputOrientation;
	readonly getSize: () => SegmentedInputSize;
	readonly getDisabled: () => boolean;
	readonly getInvalid: () => boolean;
	readonly getRequired: () => boolean;
};

/**
 * One instance per `<SegmentedInput.Root>`, published on context.
 *
 * Replaces upstream's `SegmentedInputContextValue` + `React.useMemo`
 *: a state class with `$derived` fields has no
 * re-render to skip, so the memo is dropped. Reactive inputs arrive as getter functions rather
 * than snapshots.
 */
export class SegmentedInputRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: SegmentedInputRootStateProps;

	readonly dir: Direction = $derived(this.#props.getDir());
	readonly orientation: SegmentedInputOrientation = $derived(this.#props.getOrientation());
	readonly size: SegmentedInputSize = $derived(this.#props.getSize());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly invalid: boolean = $derived(this.#props.getInvalid());
	readonly required: boolean = $derived(this.#props.getRequired());

	/**
	 * The registry every item joins, and the behaviour Time Picker reuses. Never published
	 * on its own context key, so an unattached instance is always constructible.
	 */
	readonly nav: SegmentNavigation;

	constructor(props: SegmentedInputRootStateProps) {
		this.#props = props;
		this.nav = new SegmentNavigation({
			getOrientation: () => this.orientation,
			getDir: () => this.dir,
		});
	}

	/** An item's own `disabled` wins, including an explicit `false` against a disabled group. */
	resolveDisabled(own: boolean | undefined): boolean {
		return own ?? this.disabled;
	}

	/** Same inheritance rule as {@link resolveDisabled}. `invalid` has none — upstream offers no override. */
	resolveRequired(own: boolean | undefined): boolean {
		return own ?? this.required;
	}
}

const SEGMENTED_INPUT_CONTEXT_KEY = Symbol("segmented-input");

export function setSegmentedInputContext(state: SegmentedInputRootState): SegmentedInputRootState {
	return setContext(SEGMENTED_INPUT_CONTEXT_KEY, state);
}

export function hasSegmentedInputContext(): boolean {
	return hasContext(SEGMENTED_INPUT_CONTEXT_KEY);
}

/** Read the group's state, throwing when there is no `<SegmentedInput.Root>` ancestor. */
export function getSegmentedInputContext(
	consumerName = "<SegmentedInput.Item>",
): SegmentedInputRootState {
	if (!hasSegmentedInputContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<SegmentedInput.Root>\`.`);
	}
	return getContext<SegmentedInputRootState>(SEGMENTED_INPUT_CONTEXT_KEY);
}
