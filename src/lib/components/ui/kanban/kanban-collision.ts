/**
 * Pure collision detection and keyboard geometry for the kanban board — no runes, no DOM reads, no
 * component knowledge.
 *
 * It replaces the parts of `@dnd-kit/core` the upstream React component reaches for
 * (`pointerWithin`, `rectIntersection`, `getFirstCollision`, `closestCorners` and the keyboard
 * `coordinateGetter`), and it is deliberately component-agnostic so any later multi-container drag
 * component can compose it instead of re-deriving the absolute-direction filter.
 */

import {
	closestCenter,
	closestCorners,
	type ClientRect,
	type Coordinates,
	type UniqueIdentifier,
} from "$lib/components/ui/sortable/index.js";

/** The four keys {@link resolveKanbanArrowTarget} understands. */
export type KanbanArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

/** One ranked hit. `value` is the metric the producing function ranked on, best first. */
export type KanbanCollision = { id: UniqueIdentifier; value: number };

/** The minimum a function here needs to know about a candidate. */
export type KanbanRectEntry = { id: UniqueIdentifier; rect: ClientRect };

/** A registered drop target, as {@link resolveKanbanArrowTarget} sees it. */
export type KanbanDroppable = KanbanRectEntry & {
	/** `true` when the identifier is a column key rather than an item identifier. */
	isColumn: boolean;
	/** Only meaningful for a column: whether it currently holds no items. */
	isEmpty: boolean;
	disabled: boolean;
	/** The column this target belongs to; a column's own identifier for a column. */
	columnId: UniqueIdentifier | null;
};

function centerOf(rect: ClientRect): Coordinates {
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function distanceBetween(a: Coordinates, b: Coordinates): number {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function contains(rect: ClientRect, point: Coordinates): boolean {
	return (
		point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
	);
}

/**
 * dnd-kit's `pointerWithin`: every droppable the pointer is actually inside, tightest box first.
 *
 * Ranking on the distance from the pointer to each centre is what makes an item inside a column win
 * over the column that encloses it, which is the whole reason upstream's cascade starts here.
 */
export function pointerWithin(
	pointer: Coordinates,
	droppables: readonly KanbanRectEntry[],
): KanbanCollision[] {
	return droppables
		.filter((droppable) => contains(droppable.rect, pointer))
		.map((droppable) => ({
			id: droppable.id,
			value: distanceBetween(pointer, centerOf(droppable.rect)),
		}))
		.sort((a, b) => a.value - b.value);
}

/**
 * dnd-kit's `rectIntersection`: the fallback for when the pointer is between two boxes. Ranked by
 * overlap area, largest first; boxes that only touch along an edge score zero and are dropped.
 */
export function rectIntersection(
	collisionRect: ClientRect,
	droppables: readonly KanbanRectEntry[],
): KanbanCollision[] {
	return droppables
		.map((droppable) => {
			const width =
				Math.min(collisionRect.right, droppable.rect.right) -
				Math.max(collisionRect.left, droppable.rect.left);
			const height =
				Math.min(collisionRect.bottom, droppable.rect.bottom) -
				Math.max(collisionRect.top, droppable.rect.top);
			return { id: droppable.id, value: width > 0 && height > 0 ? width * height : 0 };
		})
		.filter((collision) => collision.value > 0)
		.sort((a, b) => b.value - a.value);
}

/** dnd-kit's `getFirstCollision(collisions, 'id')`, narrowed to the one accessor upstream uses. */
export function getFirstCollision(collisions: readonly KanbanCollision[]): UniqueIdentifier | null {
	return collisions[0]?.id ?? null;
}

/** The nearest candidate centre to the collision rect's centre, or `null` when there is none. */
export function closestCenterAmong(
	collisionRect: ClientRect,
	droppables: readonly KanbanRectEntry[],
): UniqueIdentifier | null {
	if (droppables.length === 0) return null;
	return closestCenter({ collisionRect, droppables: [...droppables] })[0]?.id ?? null;
}

/**
 * Upstream's four `coordinateGetter` inequalities, kept verbatim.
 *
 * The direction is absolute — screen left is screen left whatever the board's `orientation` is.
 * Only the caller mirrors it for `dir="rtl"`.
 */
export function filterByDirection<T extends KanbanRectEntry>(
	key: KanbanArrowKey,
	collisionRect: ClientRect,
	droppables: readonly T[],
): T[] {
	return droppables.filter(({ rect }) => {
		switch (key) {
			case "ArrowDown":
				return collisionRect.top < rect.top;
			case "ArrowUp":
				return collisionRect.top > rect.top;
			case "ArrowLeft":
				return collisionRect.left >= rect.left + rect.width;
			case "ArrowRight":
				return collisionRect.left + collisionRect.width <= rect.left;
		}
	});
}

export type ResolveKanbanArrowTargetArgs = {
	key: KanbanArrowKey;
	dir: "ltr" | "rtl";
	/** The identifier being dragged; never its own target. */
	activeId: UniqueIdentifier;
	activeIsColumn: boolean;
	/** The dragged rect at its current keyboard position. */
	collisionRect: ClientRect;
	droppables: readonly KanbanDroppable[];
};

/**
 * Which identifier an arrow key moves the drop target to, or `null` when nothing lies that way.
 *
 * Candidate rules: dragging a **column** targets only other columns; dragging an
 * **item** targets other items plus **empty** columns, because a populated column is represented by
 * its items. Upstream aborts the whole resolution on the first disabled, unmeasured or populated
 * column it meets — three `return`s that make arrow movement impossible on any real board — so this
 * port skips the entry and keeps scanning instead.
 */
export function resolveKanbanArrowTarget(
	args: ResolveKanbanArrowTargetArgs,
): UniqueIdentifier | null {
	const { dir, activeId, activeIsColumn, collisionRect, droppables } = args;

	// RTL mirror. The vertical axis is unaffected by direction.
	let key = args.key;
	if (dir === "rtl") {
		if (key === "ArrowLeft") key = "ArrowRight";
		else if (key === "ArrowRight") key = "ArrowLeft";
	}

	const candidates = droppables.filter((droppable) => {
		if (droppable.id === activeId || droppable.disabled) return false;
		if (droppable.rect.width === 0 && droppable.rect.height === 0) return false;
		if (activeIsColumn) return droppable.isColumn;
		return droppable.isColumn ? droppable.isEmpty : true;
	});

	const reachable = filterByDirection(key, collisionRect, candidates);
	if (reachable.length === 0) return null;

	return (
		closestCorners({
			collisionRect,
			droppables: reachable.map(({ id, rect }) => ({ id, rect })),
		})[0]?.id ?? null
	);
}
