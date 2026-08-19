import Content from "./marquee-content.svelte";
import Edge from "./marquee-edge.svelte";
import Item from "./marquee-item.svelte";
import Root from "./marquee.svelte";

export { type MarqueeChildProps, type MarqueeProps, type MarqueeRootProps } from "./marquee.svelte";
export {
	marqueeContentVariants,
	type MarqueeContentChildProps,
	type MarqueeContentProps,
} from "./marquee-content.svelte";
export { type MarqueeItemChildProps, type MarqueeItemProps } from "./marquee-item.svelte";
export {
	marqueeEdgeVariants,
	type MarqueeEdgeChildProps,
	type MarqueeEdgeProps,
} from "./marquee-edge.svelte";

export {
	computeAutoFillMultiplier,
	computeMarqueeDuration,
	getMarqueeContext,
	MarqueeState,
	MARQUEE_EDGE_SIZES,
	MARQUEE_ORIENTATIONS,
	MARQUEE_SIDES,
	observeMarqueeSizes,
	resolveGap,
	resolveLoopCount,
	setMarqueeContext,
	sideToOrientation,
	type DurationInput,
	type MarqueeEdgeSize,
	type MarqueeOrientation,
	type MarqueeSide,
	type MarqueeSizes,
	type MarqueeStateProps,
} from "./marquee.svelte.js";

export {
	Root,
	Content,
	Item,
	Edge,
	//
	Root as Marquee,
	Content as MarqueeContent,
	Item as MarqueeItem,
	Edge as MarqueeEdge,
};
