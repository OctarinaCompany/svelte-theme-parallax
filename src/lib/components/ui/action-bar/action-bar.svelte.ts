import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import { getContext, hasContext, setContext } from "svelte";
import { tv } from "tailwind-variants";

import type {
	FloatingAlign,
	FloatingOrientation,
	FloatingSide,
} from "./action-bar-floating.svelte.js";

/** Upstream `ActionBarProps["side"]`, under the component's own name. */
export type ActionBarSide = FloatingSide;

/** Upstream `ActionBarProps["align"]`, under the component's own name. */
export type ActionBarAlign = FloatingAlign;

/** Upstream `Orientation`, under the component's own name. */
export type ActionBarOrientation = FloatingOrientation;

/** Bubbling, cancelable event an item dispatches on itself. Upstream `ITEM_SELECT` (20). */
export const ACTION_BAR_ITEM_SELECT = "actionbar.itemSelect";

/** Cancelable event the group dispatches when focus enters it. Upstream `ENTRY_FOCUS` (21). */
export const ACTION_BAR_ENTRY_FOCUS = "actionbarFocusGroup.onEntryFocus";

/** Upstream `EVENT_OPTIONS` (22) — the entry-focus event does **not** bubble. */
export const ACTION_BAR_EVENT_OPTIONS = { bubbles: false, cancelable: true } as const;

/** Upstream's inline init for the item-select event (476-479), which **does** bubble. */
export const ACTION_BAR_ITEM_SELECT_OPTIONS = { bubbles: true, cancelable: true } as const;

/**
 * Upstream `ActionBarSeparator`'s class list (652-656).
 *
 * Not the shared `$lib/components/ui/separator`: upstream deliberately pairs `role="separator"`
 * with `aria-hidden="true"` — a decorative divider that is still selectable for styling — and its
 * classes depend on the `in-data-[slot=action-bar-selection]:` contextual variant to shrink inside
 * the selection pill. Neither is expressible through the shared component's `bits-ui`-backed ARIA
 * contract.
 */
export const actionBarSeparatorVariants = tv({
	base: "bg-border in-data-[slot=action-bar-selection]:ml-0.5 in-data-[slot=action-bar-selection]:h-4 in-data-[slot=action-bar-selection]:w-px",
	variants: {
		orientation: {
			horizontal: "h-6 w-px",
			vertical: "h-px w-full",
		},
	},
	defaultVariants: {
		orientation: "horizontal",
	},
});

export type ActionBarRootStateProps = {
	readonly getOpen: () => boolean;
	/**
	 * Writes the caller's binding **and** calls `onOpenChange` — the only path that changes `open`.
	 * The write is skipped when the caller's `open` already reads as `open`, so a controlled prop
	 * passed without `bind:` is never shadowed by a redundant local override; `onOpenChange` still
	 * fires on every request.
	 */
	readonly setOpen: (open: boolean) => void;
	readonly getDir: () => Direction;
	readonly getOrientation: () => ActionBarOrientation;
	readonly getLoop: () => boolean;
};

/**
 * One instance per `<ActionBar>`, published on context. Upstream `ActionBarContextValue`
 * (70-79, 180-188).
 *
 * The class never assigns to `open` itself: {@link ActionBarRootState.setOpen} is the single write
 * path, and it always notifies `onOpenChange`.
 */
export class ActionBarRootState {
	// `$derived` below is lazy at runtime, but svelte-check cannot see that across the constructor
	// assignment — the same annotation `DirectionProviderState` needs.
	#props!: ActionBarRootStateProps;

	readonly open: boolean = $derived(this.#props.getOpen());
	readonly dir: Direction = $derived(this.#props.getDir());
	readonly orientation: ActionBarOrientation = $derived(this.#props.getOrientation());
	readonly loop: boolean = $derived(this.#props.getLoop());

	constructor(props: ActionBarRootStateProps) {
		this.#props = props;
	}

	setOpen(next: boolean): void {
		this.#props.setOpen(next);
	}
}

const ACTION_BAR_CONTEXT_KEY = Symbol("action-bar");

export function setActionBarContext(state: ActionBarRootState): ActionBarRootState {
	return setContext(ACTION_BAR_CONTEXT_KEY, state);
}

/** Read the root's state, throwing when there is no `<ActionBar>` ancestor. */
export function getActionBarContext(consumerName: string): ActionBarRootState {
	if (!hasContext(ACTION_BAR_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<ActionBar>\`.`);
	}
	return getContext<ActionBarRootState>(ACTION_BAR_CONTEXT_KEY);
}
