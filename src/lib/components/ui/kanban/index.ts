import Board from "./kanban-board.svelte";
import ColumnHandle from "./kanban-column-handle.svelte";
import Column from "./kanban-column.svelte";
import ItemHandle from "./kanban-item-handle.svelte";
import Item from "./kanban-item.svelte";
import Overlay from "./kanban-overlay.svelte";
import Root from "./kanban.svelte";

// The root renders no element of its own, so — unlike every other part — it has no `child` snippet
// and therefore no `KanbanChildProps` payload type.
export type { KanbanProps, KanbanRootProps } from "./kanban.svelte";
export type { KanbanBoardChildProps, KanbanBoardProps } from "./kanban-board.svelte";
export type { KanbanColumnChildProps, KanbanColumnProps } from "./kanban-column.svelte";
export type {
	KanbanColumnHandleChildProps,
	KanbanColumnHandleProps,
} from "./kanban-column-handle.svelte";
export type { KanbanItemChildProps, KanbanItemProps } from "./kanban-item.svelte";
export type {
	KanbanItemHandleChildProps,
	KanbanItemHandleProps,
} from "./kanban-item-handle.svelte";
export type { KanbanOverlayProps } from "./kanban-overlay.svelte";

export {
	DEFAULT_KANBAN_ANNOUNCEMENTS,
	KanbanColumnState,
	KanbanItemState,
	KanbanRootState,
	assertKanbanItemValueGetter,
	getKanbanColumnContext,
	getKanbanContext,
	getKanbanItemContext,
	hasKanbanBoardContext,
	hasKanbanOverlayContext,
	peekKanbanColumnContext,
	setKanbanBoardContext,
	setKanbanColumnContext,
	setKanbanContext,
	setKanbanItemContext,
	setKanbanOverlayContext,
	useKanbanItem,
	type KanbanAccessibility,
	type KanbanAnnouncementArgs,
	type KanbanAnnouncements,
	type KanbanDragEvent,
	type KanbanMoveEvent,
	type KanbanOrientation,
	type KanbanOverlayVariant,
	type KanbanPartStateProps,
	type KanbanRootStateProps,
	type KanbanValue,
} from "./kanban.svelte.js";

export { KanbanDndState, type KanbanDndStateProps } from "./kanban-dnd.svelte.js";

// Pure, rune-free and component-agnostic, so any later multi-container drag component composes it
// instead of re-deriving the absolute-direction filter.
export {
	closestCenterAmong,
	filterByDirection,
	getFirstCollision,
	pointerWithin,
	rectIntersection,
	resolveKanbanArrowTarget,
	type KanbanArrowKey,
	type KanbanCollision,
	type KanbanDroppable,
	type KanbanRectEntry,
	type ResolveKanbanArrowTargetArgs,
} from "./kanban-collision.js";

export {
	Root,
	Board,
	Column,
	ColumnHandle,
	Item,
	ItemHandle,
	Overlay,
	//
	Root as Kanban,
	Board as KanbanBoard,
	Column as KanbanColumn,
	ColumnHandle as KanbanColumnHandle,
	Item as KanbanItem,
	ItemHandle as KanbanItemHandle,
	Overlay as KanbanOverlay,
};
