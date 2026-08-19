import Connector from "./timeline-connector.svelte";
import Content from "./timeline-content.svelte";
import Description from "./timeline-description.svelte";
import Dot from "./timeline-dot.svelte";
import Header from "./timeline-header.svelte";
import Item from "./timeline-item.svelte";
import Time from "./timeline-time.svelte";
import Title from "./timeline-title.svelte";
import Root from "./timeline.svelte";

export {
	timelineVariants,
	type TimelineChildProps,
	type TimelineProps,
	type TimelineRootProps,
} from "./timeline.svelte";
export {
	timelineItemVariants,
	type TimelineItemChildProps,
	type TimelineItemProps,
} from "./timeline-item.svelte";
export {
	timelineDotVariants,
	type TimelineDotChildProps,
	type TimelineDotProps,
} from "./timeline-dot.svelte";
export {
	timelineConnectorVariants,
	type TimelineConnectorChildProps,
	type TimelineConnectorProps,
} from "./timeline-connector.svelte";
export {
	timelineContentVariants,
	type TimelineContentChildProps,
	type TimelineContentProps,
} from "./timeline-content.svelte";
export { type TimelineHeaderChildProps, type TimelineHeaderProps } from "./timeline-header.svelte";
export { type TimelineTitleChildProps, type TimelineTitleProps } from "./timeline-title.svelte";
export {
	type TimelineDescriptionChildProps,
	type TimelineDescriptionProps,
} from "./timeline-description.svelte";
export { type TimelineTimeChildProps, type TimelineTimeProps } from "./timeline-time.svelte";

export {
	getTimelineContext,
	getTimelineItemContext,
	getTimelineItemStatus,
	setTimelineContext,
	setTimelineItemContext,
	sortByDocumentPosition,
	TimelineItemState,
	TimelineState,
	TIMELINE_ORIENTATIONS,
	TIMELINE_STATUSES,
	TIMELINE_VARIANTS,
	type TimelineItemEntry,
	type TimelineItemStateProps,
	type TimelineOrientation,
	type TimelineStateProps,
	type TimelineStatus,
	type TimelineVariant,
} from "./timeline.svelte.js";

export {
	Root,
	Item,
	Dot,
	Connector,
	Content,
	Header,
	Title,
	Description,
	Time,
	//
	Root as Timeline,
	Item as TimelineItem,
	Dot as TimelineDot,
	Connector as TimelineConnector,
	Content as TimelineContent,
	Header as TimelineHeader,
	Title as TimelineTitle,
	Description as TimelineDescription,
	Time as TimelineTime,
};
