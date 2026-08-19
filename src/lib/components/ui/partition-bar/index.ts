import Root from "./partition-bar.svelte";
import Segment from "./partition-bar-segment.svelte";
import SegmentTitle from "./partition-bar-segment-title.svelte";
import SegmentValue from "./partition-bar-segment-value.svelte";

export { type PartitionBarRootProps } from "./partition-bar.svelte";
export { type PartitionBarSegmentProps } from "./partition-bar-segment.svelte";
export { type PartitionBarSegmentTitleProps } from "./partition-bar-segment-title.svelte";
export { type PartitionBarSegmentValueProps } from "./partition-bar-segment-value.svelte";
export {
	DEFAULT_PARTITION_BAR_GAP,
	PARTITION_BAR_ALIGNMENTS,
	PARTITION_BAR_LINE_CLASSES,
	PARTITION_BAR_SEGMENT_TITLE_CLASSES,
	PARTITION_BAR_SEGMENT_VALUE_CLASSES,
	PARTITION_BAR_SIZES,
	PARTITION_BAR_VARIANTS,
	PartitionBarState,
	getPartitionBarContext,
	hasPartitionBarContext,
	partitionBarLabelVariants,
	partitionBarSegmentVariants,
	partitionBarVariants,
	setPartitionBarContext,
	type PartitionBarAlignment,
	type PartitionBarSize,
	type PartitionBarStateProps,
	type PartitionBarVariant,
} from "./partition-bar.svelte.js";

export {
	Root,
	Segment,
	SegmentTitle,
	SegmentValue,
	//
	Root as PartitionBar,
	Segment as PartitionBarSegment,
	SegmentTitle as PartitionBarSegmentTitle,
	SegmentValue as PartitionBarSegmentValue,
};
