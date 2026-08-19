import Indicator from "./badge-overflow-indicator.svelte";
import Root from "./badge-overflow.svelte";

export {
	type BadgeOverflowChildProps,
	type BadgeOverflowProps,
	type BadgeOverflowRootProps,
} from "./badge-overflow.svelte";
export {
	type BadgeOverflowIndicatorChildProps,
	type BadgeOverflowIndicatorProps,
} from "./badge-overflow-indicator.svelte";

export {
	BadgeOverflowState,
	type BadgeOverflowEntry,
	type BadgeOverflowSplit,
	type BadgeOverflowStateProps,
	type ComputeVisibleSplitOptions,
	type ContainerMetrics,
	computeVisibleSplit,
	getPlaceholderCount,
	getPlaceholderHeight,
	observeResize,
	readContainerMetrics,
	resolveBadgeLabel,
	DEFAULT_BADGE_GAP,
	DEFAULT_BADGE_HEIGHT,
	DEFAULT_LINE_COUNT,
	DEFAULT_OVERFLOW_BADGE_WIDTH,
	OVERFLOW_SAMPLE_COUNT,
} from "./badge-overflow.svelte.js";

export {
	Root,
	Indicator,
	//
	Root as BadgeOverflow,
	Indicator as BadgeOverflowIndicator,
};
