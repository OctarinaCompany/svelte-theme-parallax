import Content from "./sortable-content.svelte";
import ItemHandle from "./sortable-item-handle.svelte";
import Item from "./sortable-item.svelte";
import Overlay from "./sortable-overlay.svelte";
import Root from "./sortable.svelte";

// The root renders no element of its own, so — unlike every other part — it has no `child` snippet
// and therefore no `SortableChildProps` payload type.
export type { SortableProps, SortableRootProps } from "./sortable.svelte";
export type { SortableContentChildProps, SortableContentProps } from "./sortable-content.svelte";
export type { SortableItemChildProps, SortableItemProps } from "./sortable-item.svelte";
export type {
	SortableItemHandleChildProps,
	SortableItemHandleProps,
} from "./sortable-item-handle.svelte";
export type { SortableOverlayProps } from "./sortable-overlay.svelte";

export {
	DEFAULT_SORTABLE_ANNOUNCEMENTS,
	SortableItemState,
	SortableRootState,
	assertItemValueGetter,
	getSortableContentContext,
	getSortableContext,
	getSortableItemContext,
	hasSortableContentContext,
	hasSortableOverlayContext,
	setSortableContentContext,
	setSortableContext,
	setSortableItemContext,
	setSortableOverlayContext,
	toItemValues,
	useSortable,
	type SortableAccessibility,
	type SortableAnnouncementArgs,
	type SortableAnnouncements,
	type SortableContentContext,
	type SortableDragEvent,
	type SortableItemStateProps,
	type SortableMoveEvent,
	type SortableOrientation,
	type SortableRootStateProps,
	type SortableSessionAnnouncementArgs,
} from "./sortable.svelte.js";

export {
	DndState,
	DragSession,
	type DndNodeEntry,
	type DndNodeKind,
	type DndStateProps,
	type DragActivator,
	type DragSessionProps,
	type DragSource,
} from "./sortable-dnd.svelte.js";

export {
	SORTABLE_ORIENTATIONS,
	arrayMove,
	closestCenter,
	closestCorners,
	horizontalListSortingStrategy,
	rectSortingStrategy,
	resolveKeyboardIndex,
	restrictToHorizontalAxis,
	restrictToParentElement,
	restrictToVerticalAxis,
	toClientRect,
	translate3d,
	verticalListSortingStrategy,
	type ClientRect,
	type Coordinates,
	type ResolveKeyboardIndexArgs,
	type SortableArrowKey,
	type SortableCollision,
	type SortableCollisionDetection,
	type SortableModifier,
	type SortableStrategy,
	type SortableStrategyArgs,
	type UniqueIdentifier,
} from "./sortable-geometry.js";

export {
	Root,
	Content,
	Item,
	ItemHandle,
	Overlay,
	//
	Root as Sortable,
	Content as SortableContent,
	Item as SortableItem,
	ItemHandle as SortableItemHandle,
	Overlay as SortableOverlay,
};
