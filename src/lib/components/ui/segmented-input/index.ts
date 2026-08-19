import Root from "./segmented-input.svelte";
import Item from "./segmented-input-item.svelte";

export type {
	SegmentedInputChildProps,
	SegmentedInputProps,
	SegmentedInputRootProps,
} from "./segmented-input.svelte";
export type {
	SegmentedInputItemChildProps,
	SegmentedInputItemProps,
	SegmentedInputItemType,
} from "./segmented-input-item.svelte";

export {
	getSegmentedInputContext,
	hasSegmentedInputContext,
	segmentedInputItemVariants,
	SEGMENTED_INPUT_ORIENTATIONS,
	SEGMENTED_INPUT_SIZES,
	SegmentedInputRootState,
	setSegmentedInputContext,
	type SegmentedInputOrientation,
	type SegmentedInputRootStateProps,
	type SegmentedInputSize,
} from "./segmented-input.svelte.js";

// The Time Picker reuse surface: markup-free navigation, exported so another component can
// construct it without rendering a `<SegmentedInput.Root>`.
export {
	resolveSegmentIntent,
	resolveSegmentPosition,
	SEGMENT_ORIENTATIONS,
	SEGMENT_POSITIONS,
	SegmentNavigation,
	splitPastedValue,
	type SegmentCaret,
	type SegmentEntryMeta,
	type SegmentIntent,
	type SegmentNavigationProps,
	type SegmentOrientation,
	type SegmentPosition,
} from "./segment-navigation.svelte.js";

export {
	Root,
	Item,
	//
	Root as SegmentedInput,
	Item as SegmentedInputItem,
};
