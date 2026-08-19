import Close from "./action-bar-close.svelte";
import Group from "./action-bar-group.svelte";
import Item from "./action-bar-item.svelte";
import Portal from "./action-bar-portal.svelte";
import Selection from "./action-bar-selection.svelte";
import Separator from "./action-bar-separator.svelte";
import Root from "./action-bar.svelte";

export {
	type ActionBarChildProps,
	type ActionBarProps,
	type ActionBarRootProps,
} from "./action-bar.svelte";
export {
	type ActionBarSelectionChildProps,
	type ActionBarSelectionProps,
} from "./action-bar-selection.svelte";
export { type ActionBarGroupChildProps, type ActionBarGroupProps } from "./action-bar-group.svelte";
export {
	type ActionBarItemChildProps,
	type ActionBarItemProps,
	type ActionBarItemSelectEvent,
} from "./action-bar-item.svelte";
export { type ActionBarCloseChildProps, type ActionBarCloseProps } from "./action-bar-close.svelte";
export {
	type ActionBarSeparatorChildProps,
	type ActionBarSeparatorProps,
} from "./action-bar-separator.svelte";
export { type ActionBarPortalProps } from "./action-bar-portal.svelte";

export {
	ACTION_BAR_ENTRY_FOCUS,
	ACTION_BAR_EVENT_OPTIONS,
	ACTION_BAR_ITEM_SELECT,
	ACTION_BAR_ITEM_SELECT_OPTIONS,
	ActionBarRootState,
	actionBarSeparatorVariants,
	getActionBarContext,
	setActionBarContext,
	type ActionBarAlign,
	type ActionBarOrientation,
	type ActionBarRootStateProps,
	type ActionBarSide,
} from "./action-bar.svelte.js";

// Component-agnostic on purpose: `selection-toolbar` imports these instead of duplicating them.
// Neither shared module imports an `action-bar-*` part.
export {
	DEFAULT_ALIGN_OFFSET,
	DEFAULT_SIDE_OFFSET,
	EscapeDismissState,
	FLOATING_ALIGNMENTS,
	FLOATING_ORIENTATIONS,
	FLOATING_SIDES,
	floatingSurfaceVariants,
	getViewportEdgeStyle,
	type EscapeDismissStateProps,
	type FloatingAlign,
	type FloatingOrientation,
	type FloatingSide,
	type ViewportEdgeStyleOptions,
} from "./action-bar-floating.svelte.js";

export {
	Root,
	Selection,
	Separator,
	Group,
	Item,
	Close,
	Portal,
	//
	Root as ActionBar,
	Selection as ActionBarSelection,
	Separator as ActionBarSeparator,
	Group as ActionBarGroup,
	Item as ActionBarItem,
	Close as ActionBarClose,
	Portal as ActionBarPortal,
};
