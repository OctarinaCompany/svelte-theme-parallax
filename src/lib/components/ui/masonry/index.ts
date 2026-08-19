import Item from "./masonry-item.svelte";
import Root from "./masonry.svelte";

export { type MasonryChildProps, type MasonryProps, type MasonryRootProps } from "./masonry.svelte";
export { type MasonryItemChildProps, type MasonryItemProps } from "./masonry-item.svelte";

// The scroll / resize / throttle helpers stay out of the barrel on purpose: they are DOM plumbing,
// not reusable layout primitives.
export {
	getMasonryContext,
	hasMasonryContext,
	MasonryState,
	setMasonryContext,
	type MasonryStateProps,
} from "./masonry.svelte.js";

export {
	createPositioner,
	resolveColumnCount,
	resolveColumnWidth,
	type Positioner,
	type PositionerItem,
	type PositionerOptions,
} from "./masonry-positioner.js";

export { createIntervalTree, type IntervalTree } from "./masonry-interval-tree.js";

export {
	Root,
	Item,
	//
	Root as Masonry,
	Item as MasonryItem,
};
