import { SvelteSet } from "svelte/reactivity";

import { getCellKey } from "./data-grid-utils.js";
import type { CellPosition, CellRange } from "./types.js";

export type DataGridSelectionStateProps = {
	/** Every column id, in render order — the axis ranges are measured along. */
	getColumnIds: () => string[];
	/** How many rows the current row model holds. */
	getRowCount: () => number;
	/** Collapse every selection to one cell. */
	getEnableSingleCellSelection: () => boolean;
	/** Whether a header click may select a whole column. */
	getEnableColumnSelection: () => boolean;
};

/**
 * The two-dimensional cell selection: a rectangle with an anchor (`start`) and a moving edge
 * (`end`), plus the flat `Set` of `"rowIndex:columnId"` keys every cell does an O(1) lookup in.
 *
 * Bespoke because no primitive in `bits-ui` or `ui/*` models a rectangular cell range with
 * anchor/edge semantics, Ctrl-click toggling and extend-to-extremity.
 * Every method is pure arithmetic over the two getters, so the whole class is testable without a
 * DOM — which matters, because jsdom cannot simulate the pointer geometry that drives it.
 */
export class DataGridSelectionState {
	#props: DataGridSelectionStateProps;

	/** The selected cell keys. Replaced wholesale, never mutated. */
	selectedCells = $state.raw<Set<string>>(new SvelteSet());
	/** The anchor and moving edge of the current rectangle, when there is one. */
	selectionRange = $state.raw<CellRange | null>(null);
	/** Whether a pointer drag is currently extending the range. */
	isSelecting = $state(false);

	/** How many cells are selected. */
	readonly size: number = $derived(this.selectedCells.size);

	constructor(props: DataGridSelectionStateProps) {
		this.#props = props;
	}

	/**
	 * Select the normalised rectangle between two corners. The corners may be given in any order.
	 *
	 * With `enableSingleCellSelection` the rectangle collapses to `end` alone.
	 */
	selectRange(start: CellPosition, end: CellPosition, isSelecting = false): void {
		if (this.#props.getEnableSingleCellSelection()) {
			this.selectedCells = new SvelteSet([getCellKey(end.rowIndex, end.columnId)]);
			this.selectionRange = { start: end, end };
			this.isSelecting = isSelecting;
			return;
		}

		const columnIds = this.#props.getColumnIds();
		const startColIndex = columnIds.indexOf(start.columnId);
		const endColIndex = columnIds.indexOf(end.columnId);

		const minRow = Math.min(start.rowIndex, end.rowIndex);
		const maxRow = Math.max(start.rowIndex, end.rowIndex);
		const minCol = Math.min(startColIndex, endColIndex);
		const maxCol = Math.max(startColIndex, endColIndex);

		const selectedCells = new SvelteSet<string>();

		for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
			for (let colIndex = minCol; colIndex <= maxCol; colIndex++) {
				const columnId = columnIds[colIndex];
				if (columnId) selectedCells.add(getCellKey(rowIndex, columnId));
			}
		}

		this.selectedCells = selectedCells;
		this.selectionRange = { start, end };
		this.isSelecting = isSelecting;
	}

	/**
	 * Pointer down on a cell: seed the range there and arm the drag.
	 *
	 * The cell itself only joins the selection under `enableSingleCellSelection` — a plain click
	 * that never turns into a drag must leave the selection empty and focus alone.
	 */
	beginDrag(position: CellPosition): void {
		const cellKey = getCellKey(position.rowIndex, position.columnId);
		this.selectedCells = this.#props.getEnableSingleCellSelection()
			? new SvelteSet([cellKey])
			: new SvelteSet();
		this.selectionRange = { start: position, end: position };
		this.isSelecting = true;
	}

	/** Ctrl/Cmd+click: add or remove one cell and drop the rectangle. */
	toggleCell(position: CellPosition): void {
		const cellKey = getCellKey(position.rowIndex, position.columnId);

		if (this.#props.getEnableSingleCellSelection()) {
			this.selectedCells = this.selectedCells.has(cellKey)
				? new SvelteSet<string>()
				: new SvelteSet([cellKey]);
			this.selectionRange = null;
			this.isSelecting = false;
			return;
		}

		const next = new SvelteSet(this.selectedCells);
		if (next.has(cellKey)) next.delete(cellKey);
		else next.add(cellKey);

		this.selectedCells = next;
		this.selectionRange = null;
		this.isSelecting = false;
	}

	/** Ctrl/Cmd+A: every cell of every row. A no-op on an empty grid (invariant 6). */
	selectAll(): void {
		const columnIds = this.#props.getColumnIds();
		const rowCount = this.#props.getRowCount();

		if (rowCount === 0 || columnIds.length === 0) return;

		const selectedCells = new SvelteSet<string>();
		for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
			for (const columnId of columnIds) {
				selectedCells.add(getCellKey(rowIndex, columnId));
			}
		}

		const firstColumnId = columnIds[0];
		const lastColumnId = columnIds[columnIds.length - 1];

		this.selectedCells = selectedCells;
		this.selectionRange =
			firstColumnId && lastColumnId
				? {
						start: { rowIndex: 0, columnId: firstColumnId },
						end: { rowIndex: rowCount - 1, columnId: lastColumnId },
					}
				: null;
		this.isSelecting = false;
	}

	/** Select every cell of one column. Requires `enableColumnSelection`. */
	selectColumn(columnId: string): void {
		if (!this.#props.getEnableColumnSelection()) return;

		const rowCount = this.#props.getRowCount();
		if (rowCount === 0) return;

		const selectedCells = new SvelteSet<string>();
		for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
			selectedCells.add(getCellKey(rowIndex, columnId));
		}

		this.selectedCells = selectedCells;
		this.selectionRange = {
			start: { rowIndex: 0, columnId },
			end: { rowIndex: rowCount - 1, columnId },
		};
		this.isSelecting = false;
	}

	/** Drop the selection entirely. */
	clear(): void {
		if (this.selectedCells.size > 0) this.selectedCells = new SvelteSet();
		this.selectionRange = null;
		this.isSelecting = false;
	}

	/** Whether one cell is selected. */
	has(rowIndex: number, columnId: string): boolean {
		return this.selectedCells.has(getCellKey(rowIndex, columnId));
	}
}
