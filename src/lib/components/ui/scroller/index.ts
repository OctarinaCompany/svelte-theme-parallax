import Root from "./scroller.svelte";

export {
	scrollerVariants,
	type ScrollerChildProps,
	type ScrollerProps,
	type ScrollerRootProps,
} from "./scroller.svelte";
export {
	scrollerButtonVariants,
	SCROLL_DIRECTION_LABELS,
	type ScrollerButtonProps,
} from "./scroller-button.svelte";

export {
	AUTO_SCROLL_INTERVAL,
	DEFAULT_HIDE_SCROLLBAR,
	DEFAULT_OFFSET,
	DEFAULT_ORIENTATION,
	DEFAULT_SCROLL_STEP,
	DEFAULT_SCROLL_TRIGGER_MODE,
	DEFAULT_SIZE,
	DEFAULT_WITH_NAVIGATION,
	getScrollerContext,
	SCROLL_DIRECTIONS,
	SCROLLER_ORIENTATIONS,
	SCROLLER_TRIGGER_MODES,
	ScrollerState,
	setScrollerContext,
	type ScrollDirection,
	type ScrollerEdgeAttributes,
	type ScrollerNavigationVisibility,
	type ScrollerOrientation,
	type ScrollerStateProps,
	type ScrollerTriggerMode,
} from "./scroller.svelte.js";

export {
	Root,
	//
	Root as Scroller,
};
