import { createIntervalTree } from "./masonry-interval-tree.js";

/**
 * The column positioner — a pure port of upstream's `usePositioner` core (`masonry.tsx` lines
 * 548–799) with the `useRef`/`useCallback` shell stripped.
 *
 * It owns the whole layout algorithm: how many columns fit, how wide they are, which column each
 * item lands in, and where later items move when one of them is re-measured. Nothing here is
 * reactive and nothing here reads the DOM, so upstream parity is directly unit-testable.
 */

const COLUMN_WIDTH = 200;
const GAP = 0;

export interface PositionerItem {
	/** Distance from the top of the viewport container, in px. */
	top: number;
	/**
	 * Offset from the *leading* inline edge, in px — direction-agnostic. The item renders it as
	 * `inset-inline-start`, so RTL mirroring is a CSS consequence and the numbers never change.
	 */
	left: number;
	/** Last measured height, in px. */
	height: number;
	/** Which column this item was assigned to, 0-based from the leading edge. */
	columnIndex: number;
}

export interface PositionerOptions {
	/** Measured container width, in px. */
	width: number;
	/** @default 200 */
	columnWidth?: number;
	/** @default 0 */
	columnGap?: number;
	/** Falls back to `columnGap` when omitted. */
	rowGap?: number;
	/** Explicit column count; overrides the computed one. */
	columnCount?: number;
	/** Caps the computed column count. Ignored when `columnCount` is set. */
	maxColumnCount?: number;
	/** @default false */
	linear?: boolean;
}

export interface Positioner {
	/** How many columns this instance lays out into. */
	readonly columnCount: number;
	/** The width of one column, in px. */
	readonly columnWidth: number;
	/**
	 * Position the item at `index`, appending it to the chosen column.
	 *
	 * Callers must only ever pass `index === size()` — the assignment depends on call order, and
	 * that invariant is what keeps column choice identical to upstream.
	 */
	set(index: number, height?: number): void;
	get(index: number): PositionerItem | undefined;
	/** Apply a flat `[index, height, index, height, …]` list and re-flow the affected columns. */
	update(updates: number[]): void;
	/** Report every positioned item whose vertical extent overlaps `[low, high]`. */
	range(
		low: number,
		high: number,
		onItemRender: (index: number, left: number, top: number) => void,
	): void;
	/** How many items have been positioned. */
	size(): number;
	/** Total height for `itemCount` items, extrapolating the unmeasured ones. */
	estimateHeight(itemCount: number, defaultItemHeight: number): number;
	/** The height of the currently shortest column. */
	shortestColumn(): number;
	/** Every positioned item, in index order. */
	all(): PositionerItem[];
}

/**
 * `columnCount || min(floor((width + columnGap) / (columnWidth + columnGap)), maxColumnCount) || 1`
 * — upstream lines 610–616 verbatim. The trailing `|| 1` is what makes a container narrower than one
 * column still render exactly one column, because `floor(...)` is `0` there.
 */
export function resolveColumnCount(options: PositionerOptions): number {
	const {
		width,
		columnWidth = COLUMN_WIDTH,
		columnGap = GAP,
		columnCount,
		maxColumnCount,
	} = options;

	return (
		columnCount ||
		Math.min(
			Math.floor((width + columnGap) / (columnWidth + columnGap)),
			maxColumnCount || Number.POSITIVE_INFINITY,
		) ||
		1
	);
}

/** `floor((width - columnGap * (columnCount - 1)) / columnCount)` — upstream lines 617–619. */
export function resolveColumnWidth(options: PositionerOptions): number {
	const { width, columnGap = GAP } = options;
	const columnCount = resolveColumnCount(options);

	return Math.floor((width - columnGap * (columnCount - 1)) / columnCount);
}

/** Index of `target` in the ascending list `values`, or `-1`. */
function binarySearch(values: number[], target: number): number {
	let low = 0;
	let high = values.length - 1;

	while (low <= high) {
		const middle = (low + high) >>> 1;
		const value = values[middle];
		if (value === target) return middle;
		if (value <= target) low = middle + 1;
		else high = middle - 1;
	}

	return -1;
}

export function createPositioner(options: PositionerOptions): Positioner {
	const { columnGap = GAP, rowGap, linear = false } = options;

	const columnCount = resolveColumnCount(options);
	const columnWidth = resolveColumnWidth(options);
	const verticalGap = rowGap ?? columnGap;

	const intervalTree = createIntervalTree();
	const columnHeights: number[] = new Array<number>(columnCount).fill(0);
	const items: (PositionerItem | undefined)[] = [];
	const columnItems: number[][] = Array.from({ length: columnCount }, () => []);

	/** Index of the shortest column; ties resolve to the lowest index. */
	function shortestColumnIndex(): number {
		let shortest = 0;
		for (let index = 1; index < columnHeights.length; index++) {
			if (columnHeights[index] < columnHeights[shortest]) shortest = index;
		}
		return shortest;
	}

	/**
	 * Round-robin placement with upstream's escape hatch: keep the preferred column while its
	 * resulting height stays within `shortestHeight + height * 2.5`, otherwise drop to the
	 * shortest column so one runaway column cannot starve the rest.
	 */
	function linearColumnIndex(index: number, height: number): number {
		const preferredColumn = index % columnCount;
		const shortestIndex = shortestColumnIndex();
		const shortestHeight = columnHeights[shortestIndex];
		const preferredHeight = columnHeights[preferredColumn] + height;

		return preferredHeight <= shortestHeight + height * 2.5 ? preferredColumn : shortestIndex;
	}

	return {
		columnCount,
		columnWidth,

		set(index: number, height = 0) {
			const columnIndex = linear ? linearColumnIndex(index, height) : shortestColumnIndex();

			const top = columnHeights[columnIndex];
			columnHeights[columnIndex] = top + height + verticalGap;
			columnItems[columnIndex].push(index);

			items[index] = {
				left: columnIndex * (columnWidth + columnGap),
				top,
				height,
				columnIndex,
			};
			intervalTree.insert(top, top + height, index);
		},

		get(index: number) {
			return items[index];
		},

		update(updates: number[]) {
			const columns: (number | undefined)[] = new Array<number | undefined>(columnCount);

			for (let cursor = 0; cursor < updates.length - 1; cursor++) {
				const currentIndex = updates[cursor];
				const nextHeight = updates[++cursor];

				const item = items[currentIndex];
				if (!item) continue;

				item.height = nextHeight;
				intervalTree.remove(currentIndex);
				intervalTree.insert(item.top, item.top + item.height, currentIndex);

				const known = columns[item.columnIndex];
				columns[item.columnIndex] =
					known === undefined ? currentIndex : Math.min(currentIndex, known);
			}

			for (let column = 0; column < columns.length; column++) {
				const firstChanged = columns[column];
				if (firstChanged === undefined) continue;

				const itemsInColumn = columnItems[column];
				const startIndex = binarySearch(itemsInColumn, firstChanged);
				if (startIndex === -1) continue;

				const startItem = items[itemsInColumn[startIndex]];
				if (!startItem) continue;

				columnHeights[column] = startItem.top + startItem.height + verticalGap;

				for (let cursor = startIndex + 1; cursor < itemsInColumn.length; cursor++) {
					const currentIndex = itemsInColumn[cursor];
					const item = items[currentIndex];
					if (!item) continue;

					item.top = columnHeights[column];
					columnHeights[column] = item.top + item.height + verticalGap;
					intervalTree.remove(currentIndex);
					intervalTree.insert(item.top, item.top + item.height, currentIndex);
				}
			}
		},

		range(low, high, onItemRender) {
			intervalTree.search(low, high, (index, top) => {
				const item = items[index];
				if (!item) return;
				onItemRender(index, item.left, top);
			});
		},

		size() {
			return intervalTree.size;
		},

		estimateHeight(itemCount, defaultItemHeight) {
			const tallestColumn = Math.max(0, Math.max(...columnHeights));

			return itemCount === intervalTree.size
				? tallestColumn
				: tallestColumn +
						Math.ceil((itemCount - intervalTree.size) / columnCount) * defaultItemHeight;
		},

		shortestColumn() {
			if (columnHeights.length > 1) return Math.min(...columnHeights);
			return columnHeights[0] ?? 0;
		},

		all() {
			return items.filter((item): item is PositionerItem => item !== undefined);
		},
	};
}
