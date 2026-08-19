import { getRowHeightValue } from "./data-grid-utils.js";
import type { RowHeightValue } from "./types.js";

/** One mounted row: which row it is, where it sits, and how tall it is. */
export type DataGridVirtualItem = {
	index: number;
	start: number;
	size: number;
};

/** How `scrollToIndex` positions the target row inside the viewport. */
export type DataGridScrollAlign = "start" | "center" | "end";

export type DataGridVirtualizerProps = {
	/** How many rows the current row model holds. */
	getRowCount: () => number;
	/** The active row-height preset. */
	getRowHeight: () => RowHeightValue;
	/** How many rows to mount beyond each viewport edge. */
	getOverscan: () => number;
	/** The scroll container, once it is mounted. */
	getScrollElement: () => HTMLElement | null;
};

/**
 * Fixed-height row windowing.
 *
 * Rows have a *known* height per `rowHeight` preset, so the whole virtualizer is a pure function of
 * `(scrollTop, viewportHeight, rowHeight, rowCount, overscan)` — no `ResizeObserver` measurement,
 * and therefore fully unit-testable under jsdom, where every rect is zero.
 * `@tanstack/react-virtual` is replaced rather than added as a dependency for exactly that reason.
 */
export class DataGridVirtualizer {
	#props!: DataGridVirtualizerProps;

	/** Written from the scroll container's `scroll` handler. */
	scrollTop = $state(0);
	/** Written from a `ResizeObserver` on the scroll container. */
	viewportHeight = $state(0);

	/** The pixel height of one row. */
	readonly rowHeightValue: number = $derived(getRowHeightValue(this.#props.getRowHeight()));

	/** First mounted row index. `0` when the grid is empty. */
	readonly startIndex: number = $derived.by(() => {
		const rowCount = this.#props.getRowCount();
		if (rowCount === 0) return 0;
		const overscan = this.#props.getOverscan();
		const raw = Math.floor(this.scrollTop / this.rowHeightValue) - overscan;
		return Math.max(0, Math.min(raw, rowCount - 1));
	});

	/** Last mounted row index, inclusive. `-1` when the grid is empty. */
	readonly endIndex: number = $derived.by(() => {
		const rowCount = this.#props.getRowCount();
		if (rowCount === 0) return -1;
		const overscan = this.#props.getOverscan();
		const raw = Math.ceil((this.scrollTop + this.viewportHeight) / this.rowHeightValue) + overscan;
		return Math.max(0, Math.min(raw, rowCount - 1));
	});

	/** The rows `<DataGrid.Root>` actually mounts, in order. */
	readonly virtualItems: DataGridVirtualItem[] = $derived.by(() => {
		const items: DataGridVirtualItem[] = [];
		const size = this.rowHeightValue;
		for (let index = this.startIndex; index <= this.endIndex; index++) {
			items.push({ index, start: index * size, size });
		}
		return items;
	});

	/** The scroll height the body spacer is given. */
	readonly totalSize: number = $derived(this.#props.getRowCount() * this.rowHeightValue);

	constructor(props: DataGridVirtualizerProps) {
		this.#props = props;
	}

	/**
	 * Bring `index` into view. Updates `scrollTop` unconditionally so the window recomputes even
	 * when there is no scroll container yet (server render, or jsdom).
	 */
	scrollToIndex(index: number, options?: { align?: DataGridScrollAlign }): void {
		const rowCount = this.#props.getRowCount();
		if (rowCount === 0) return;

		const align = options?.align ?? "start";
		const clamped = Math.max(0, Math.min(index, rowCount - 1));
		const size = this.rowHeightValue;
		const start = clamped * size;

		let next = start;
		if (align === "center") {
			next = start - this.viewportHeight / 2 + size / 2;
		} else if (align === "end") {
			next = start - this.viewportHeight + size;
		}

		next = Math.max(0, Math.min(next, Math.max(0, this.totalSize - this.viewportHeight)));

		this.scrollTop = next;

		const element = this.#props.getScrollElement();
		if (element) element.scrollTop = next;
	}
}
