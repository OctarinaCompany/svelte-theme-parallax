/**
 * Pure geometry for the sortable drag engine — no runes, no DOM writes, no component knowledge.
 *
 * Everything here is a total, side-effect-free function over plain objects, which is what makes it
 * unit-testable without a DOM and reusable verbatim by the upcoming `kanban` port. It replaces the
 * parts of `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` and `@dnd-kit/utilities` the
 * upstream React component depends on.
 */

/** dnd-kit's `UniqueIdentifier`. */
export type UniqueIdentifier = string | number;

export type Coordinates = { x: number; y: number };

/** A snapshot of `getBoundingClientRect()` — never a live `DOMRect`. */
export type ClientRect = {
	top: number;
	left: number;
	right: number;
	bottom: number;
	width: number;
	height: number;
};

/** Every value {@link SortableOrientation} accepts, in upstream declaration order. */
export const SORTABLE_ORIENTATIONS = ["vertical", "horizontal", "mixed"] as const;

export type SortableOrientation = (typeof SORTABLE_ORIENTATIONS)[number];

/** One ranked droppable, nearest first. */
export type SortableCollision = { id: UniqueIdentifier; distance: number };

export type SortableCollisionDetection = (args: {
	collisionRect: ClientRect;
	droppables: { id: UniqueIdentifier; rect: ClientRect }[];
}) => SortableCollision[];

export type SortableModifier = (args: {
	transform: Coordinates;
	activeRect: ClientRect | null;
	containerRect: ClientRect | null;
}) => Coordinates;

export type SortableStrategyArgs = {
	index: number;
	activeIndex: number;
	overIndex: number;
	rects: ClientRect[];
	activeRect: ClientRect | null;
};

export type SortableStrategy = (args: SortableStrategyArgs) => Coordinates | null;

/** The four keys {@link resolveKeyboardIndex} understands. */
export type SortableArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

export type ResolveKeyboardIndexArgs = {
	key: SortableArrowKey;
	orientation: SortableOrientation;
	dir: "ltr" | "rtl";
	activeIndex: number;
	/** One entry per item in the root's `items` array, in that order. */
	candidates: { id: UniqueIdentifier; disabled: boolean; rect: ClientRect | null }[];
};

/** Snapshot an element's box as a plain, non-live {@link ClientRect}. */
export function toClientRect(element: Element): ClientRect {
	const { top, left, right, bottom, width, height } = element.getBoundingClientRect();
	return { top, left, right, bottom, width, height };
}

/**
 * The nearest ancestor that actually generates a layout box.
 *
 * A `display: contents` element produces no box, so `getBoundingClientRect()` answers a zero rect at
 * the viewport origin. Measuring one as the drag container would clamp every transform to the
 * top-left corner and make every collision test miss — which is exactly what happens when an item is
 * rendered through `bits-ui`'s `Command.Item`, since it wraps each child in a `display: contents`
 * div. Walking past those wrappers lands on the element the item is visually laid out in.
 *
 * Only `display: contents` is skipped, never a merely empty box: a container that is genuinely 0×0
 * is a real constraint, and under jsdom — where nothing is laid out — every rect is 0×0.
 */
export function layoutParentOf(node: Element): HTMLElement | null {
	let parent = node.parentElement;
	while (parent && getComputedStyle(parent).display === "contents") {
		parent = parent.parentElement;
	}
	return parent;
}

/** Replaces `CSS.Translate.toString`. Returns `undefined` so it can be dropped from a style string. */
export function translate3d(transform: Coordinates | null | undefined): string | undefined {
	if (!transform) return undefined;
	return `translate3d(${transform.x}px, ${transform.y}px, 0)`;
}

/**
 * Move `from` to `to`, returning a new array. Out-of-range indices return an unchanged copy, so a
 * caller never has to guard a `-1` from `indexOf`.
 */
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
	const next = array.slice();
	if (from < 0 || from >= array.length || to < 0 || to >= array.length) return next;
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
}

function centerOf(rect: ClientRect): Coordinates {
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function distanceBetween(a: Coordinates, b: Coordinates): number {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function cornersOf(rect: ClientRect): Coordinates[] {
	return [
		{ x: rect.left, y: rect.top },
		{ x: rect.right, y: rect.top },
		{ x: rect.left, y: rect.bottom },
		{ x: rect.right, y: rect.bottom },
	];
}

/** Ranks droppables by the distance between their centre and the collision rect's centre. */
export const closestCenter: SortableCollisionDetection = ({ collisionRect, droppables }) => {
	const center = centerOf(collisionRect);
	return droppables
		.map(({ id, rect }) => ({ id, distance: distanceBetween(center, centerOf(rect)) }))
		.sort((a, b) => a.distance - b.distance);
};

/** Ranks droppables by the summed distance between the four corresponding corners. */
export const closestCorners: SortableCollisionDetection = ({ collisionRect, droppables }) => {
	const corners = cornersOf(collisionRect);
	return droppables
		.map(({ id, rect }) => {
			const others = cornersOf(rect);
			const distance = corners.reduce(
				(total, corner, index) => total + distanceBetween(corner, others[index]),
				0,
			);
			return { id, distance };
		})
		.sort((a, b) => a.distance - b.distance);
};

/** dnd-kit's `getItemGap`, on whichever axis the caller names. */
function itemGap(
	rects: ClientRect[],
	index: number,
	activeIndex: number,
	start: "top" | "left",
	size: "height" | "width",
): number {
	const current = rects[index];
	if (!current) return 0;

	const previous = rects[index - 1];
	const next = rects[index + 1];

	if (activeIndex < index) {
		if (previous) return current[start] - (previous[start] + previous[size]);
		return next ? next[start] - (current[start] + current[size]) : 0;
	}
	if (next) return next[start] - (current[start] + current[size]);
	return previous ? current[start] - (previous[start] + previous[size]) : 0;
}

function listStrategy(start: "top" | "left", size: "height" | "width"): SortableStrategy {
	const axis = start === "top" ? "y" : "x";
	const zero = { x: 0, y: 0 };

	return ({ index, activeIndex, overIndex, rects, activeRect }) => {
		const active = rects[activeIndex] ?? activeRect;
		if (!active) return null;

		if (index === activeIndex) {
			const overRect = rects[overIndex];
			if (!overRect) return null;
			const offset =
				activeIndex < overIndex
					? overRect[start] + overRect[size] - (active[start] + active[size])
					: overRect[start] - active[start];
			return axis === "y" ? { x: 0, y: offset } : { x: offset, y: 0 };
		}

		const gap = itemGap(rects, index, activeIndex, start, size);

		if (index > activeIndex && index <= overIndex) {
			const offset = -active[size] - gap;
			return axis === "y" ? { x: 0, y: offset } : { x: offset, y: 0 };
		}
		if (index < activeIndex && index >= overIndex) {
			const offset = active[size] + gap;
			return axis === "y" ? { x: 0, y: offset } : { x: offset, y: 0 };
		}
		return { ...zero };
	};
}

/** Shifts items along the block axis; the default for `orientation="vertical"`. */
export const verticalListSortingStrategy: SortableStrategy = listStrategy("top", "height");

/** Shifts items along the inline axis; the default for `orientation="horizontal"`. */
export const horizontalListSortingStrategy: SortableStrategy = listStrategy("left", "width");

/**
 * Moves every item into the slot it would occupy after the reorder; the default for
 * `orientation="mixed"` (dnd-kit's own `SortableContext` default, which upstream reaches by leaving
 * `orientationConfig.mixed.strategy` undefined).
 */
export const rectSortingStrategy: SortableStrategy = ({ index, activeIndex, overIndex, rects }) => {
	const nextRects = arrayMove(rects, overIndex, activeIndex);
	const oldRect = rects[index];
	const newRect = nextRects[index];
	if (!oldRect || !newRect) return null;
	return { x: newRect.left - oldRect.left, y: newRect.top - oldRect.top };
};

/** Drops the inline component of the transform. */
export const restrictToVerticalAxis: SortableModifier = ({ transform }) => ({
	x: 0,
	y: transform.y,
});

/** Drops the block component of the transform. */
export const restrictToHorizontalAxis: SortableModifier = ({ transform }) => ({
	x: transform.x,
	y: 0,
});

/**
 * Clamps the transform so the translated active rect stays inside its container.
 *
 * The container is the dragged node's own parent element, not the `<Sortable.Content>` element —
 * that distinction is what keeps `withoutSlot` and the `child`-onto-`<Table.Body>` composition
 * working.
 */
export const restrictToParentElement: SortableModifier = ({
	transform,
	activeRect,
	containerRect,
}) => {
	if (!activeRect || !containerRect) return transform;

	let { x, y } = transform;

	if (activeRect.top + y < containerRect.top) {
		y = containerRect.top - activeRect.top;
	} else if (activeRect.bottom + y > containerRect.bottom) {
		y = containerRect.bottom - activeRect.bottom;
	}

	if (activeRect.left + x < containerRect.left) {
		x = containerRect.left - activeRect.left;
	} else if (activeRect.right + x > containerRect.right) {
		x = containerRect.right - activeRect.right;
	}

	return { x, y };
};

function isDegenerate(rect: ClientRect | null | undefined): boolean {
	return !rect || (rect.width === 0 && rect.height === 0);
}

function nearestInDirection(
	key: SortableArrowKey,
	activeIndex: number,
	activeRect: ClientRect,
	candidates: ResolveKeyboardIndexArgs["candidates"],
): number | null {
	const from = centerOf(activeRect);
	let best: { index: number; primary: number; total: number } | null = null;

	for (let index = 0; index < candidates.length; index++) {
		if (index === activeIndex) continue;

		const candidate = candidates[index];
		if (candidate.disabled || isDegenerate(candidate.rect) || !candidate.rect) continue;

		const to = centerOf(candidate.rect);
		const dx = to.x - from.x;
		const dy = to.y - from.y;

		const primary =
			key === "ArrowUp" ? -dy : key === "ArrowDown" ? dy : key === "ArrowLeft" ? -dx : dx;
		if (primary <= 0) continue;

		const total = Math.sqrt(dx ** 2 + dy ** 2);
		if (!best || primary < best.primary || (primary === best.primary && total < best.total)) {
			best = { index, primary, total };
		}
	}

	return best?.index ?? null;
}

/**
 * The keyboard sensor's whole decision: which index an arrow key moves the grabbed item to, or
 * `null` when the key does not apply on this axis and no target exists.
 *
 * Index-first rather than dnd-kit's coordinate-first `sortableKeyboardCoordinates`: for list
 * orientations the observable result is identical, and it stays correct on a container that has not
 * been laid out yet — which is also what makes the whole keyboard contract assertable under jsdom.
 */
export function resolveKeyboardIndex(args: ResolveKeyboardIndexArgs): number | null {
	const { orientation, dir, activeIndex, candidates } = args;

	// 1. RTL mirror — `horizontal` and `mixed` only; `vertical` is unaffected by direction.
	let key = args.key;
	if (dir === "rtl" && orientation !== "vertical") {
		if (key === "ArrowLeft") key = "ArrowRight";
		else if (key === "ArrowRight") key = "ArrowLeft";
	}

	// 2. Axis filter.
	const isInline = key === "ArrowLeft" || key === "ArrowRight";
	if (orientation === "vertical" && isInline) return null;
	if (orientation === "horizontal" && !isInline) return null;

	if (activeIndex < 0 || activeIndex >= candidates.length) return null;

	// 3. `mixed` with real geometry — nearest enabled centre strictly in the pressed direction.
	if (orientation === "mixed") {
		const activeRect = candidates[activeIndex].rect;
		const discriminates =
			!isDegenerate(activeRect) &&
			candidates.some(
				(candidate, index) =>
					index !== activeIndex && !candidate.disabled && !isDegenerate(candidate.rect),
			);
		if (discriminates && activeRect) {
			return nearestInDirection(key, activeIndex, activeRect, candidates);
		}
	}

	// 4. List orientations, or a grid whose rects do not discriminate — step to the nearest enabled
	//    index in the key's direction.
	const step = key === "ArrowUp" || key === "ArrowLeft" ? -1 : 1;
	for (let index = activeIndex + step; index >= 0 && index < candidates.length; index += step) {
		if (!candidates[index].disabled) return index;
	}

	// 5. Nothing to move to.
	return null;
}
