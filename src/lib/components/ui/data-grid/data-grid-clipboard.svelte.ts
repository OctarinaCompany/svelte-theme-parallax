import { SvelteSet } from "svelte/reactivity";
import { toast } from "svelte-sonner";

import {
	coercePastedValue,
	getCellKey,
	getEmptyCellValue,
	getIsSkippedPaste,
	parseCellKey,
	parseTsv,
	serializeCellsToTsv,
} from "./data-grid-utils.js";
import type { CellOpts, CellPosition, CellUpdate, PasteDialogState } from "./types.js";

/** How long the paste flow waits for a consumer's newly added rows to reach the row model. */
const ROW_SYNC_POLL_MS = 100;
const ROW_SYNC_MAX_ATTEMPTS = 50;

function pluralCells(count: number): string {
	return `${count} cell${count !== 1 ? "s" : ""}`;
}

export type DataGridClipboardStateProps = {
	/** The current cell selection. */
	getSelectedCells: () => Set<string>;
	/** The focused cell — the fallback source and always the paste target. */
	getFocusedCell: () => CellPosition | null;
	/** The value stored at a cell. */
	getCellValue: (rowIndex: number, columnId: string) => unknown;
	/** A column's `meta.cell`, for per-variant serialization and coercion. */
	getCellOpts: (columnId: string) => CellOpts | undefined;
	/** The navigable column ids, in order — the paste target axis. */
	getNavigableColumnIds: () => string[];
	/** How many rows the current row model holds. */
	getRowCount: () => number;
	/** Whether every mutation path is blocked. */
	getReadOnly: () => boolean;
	/** Whether a row-add capability is configured, which is what makes the paste dialog possible. */
	getCanAddRows: () => boolean;
	/** Apply the produced updates and emit one `onDataChange`. */
	updateData: (updates: CellUpdate[]) => void;
	/** Select the rectangle the paste covered. */
	selectRange: (start: CellPosition, end: CellPosition) => void;
	/** Restore focus to the grid once a paste settles. */
	restoreFocus: () => void;
	/** Awaited before `updateData`, so a consumer can persist first. */
	onPaste?: (updates: CellUpdate[]) => void | Promise<void>;
	/** Bulk row creation for a paste that overruns the grid. */
	onRowsAdd?: (count: number) => void | Promise<void>;
	/** Single row creation, used `rowsNeeded` times when `onRowsAdd` is absent. */
	onRowAdd?: () => unknown;
};

/**
 * Copy, cut and paste.
 *
 * Everything that can be pure is pure and lives in `data-grid-utils.ts` (`parseTsv`,
 * `serializeCellsToTsv`, `coercePastedValue`); this class only owns the two state slices and the
 * async choreography around `navigator.clipboard`, which jsdom does not implement.
 */
export class DataGridClipboardState {
	#props: DataGridClipboardStateProps;

	/** Cells marked by the last cut, cleared on the next copy or paste. */
	cutCells = $state.raw<Set<string>>(new SvelteSet());
	/** The "add more rows?" confirmation, and the clipboard text its Continue replays. */
	pasteDialog = $state.raw<PasteDialogState>({ open: false, rowsNeeded: 0, clipboardText: "" });

	constructor(props: DataGridClipboardStateProps) {
		this.#props = props;
	}

	/** The keys the next copy/cut would serialize: the selection, or the focused cell alone. */
	#getSourceCellKeys(): string[] | null {
		const selected = this.#props.getSelectedCells();
		if (selected.size > 0) return [...selected];

		const focused = this.#props.getFocusedCell();
		if (!focused) return null;
		return [getCellKey(focused.rowIndex, focused.columnId)];
	}

	#serialize(): { tsv: string; cellKeys: string[] } | null {
		const cellKeys = this.#getSourceCellKeys();
		if (!cellKeys) return null;

		return serializeCellsToTsv({
			cellKeys,
			getCellValue: this.#props.getCellValue,
			getCellOpts: this.#props.getCellOpts,
		});
	}

	/** Whether a cell carries a cut mark. */
	isCut(rowIndex: number, columnId: string): boolean {
		return this.cutCells.has(getCellKey(rowIndex, columnId));
	}

	/** Serialize the selection to TSV, write it to the clipboard and drop any cut marks. */
	async copy(): Promise<void> {
		const result = this.#serialize();
		if (!result) return;

		try {
			await navigator.clipboard.writeText(result.tsv);
			if (this.cutCells.size > 0) this.cutCells = new SvelteSet();
			toast.success(`${pluralCells(result.cellKeys.length)} copied`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to copy to clipboard");
		}
	}

	/** Like {@link copy}, but marks the source cells so the next paste clears them. */
	async cut(): Promise<void> {
		if (this.#props.getReadOnly()) return;

		const result = this.#serialize();
		if (!result) return;

		try {
			await navigator.clipboard.writeText(result.tsv);
			this.cutCells = new SvelteSet(result.cellKeys);
			toast.success(`${pluralCells(result.cellKeys.length)} cut`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to cut to clipboard");
		}
	}

	/** Close (or reset) the paste confirmation dialog. */
	setPasteDialogOpen(open: boolean): void {
		if (open) return;
		this.pasteDialog = { open: false, rowsNeeded: 0, clipboardText: "" };
	}

	async #addRows(rowsNeeded: number): Promise<void> {
		const expectedRowCount = this.#props.getRowCount() + rowsNeeded;

		if (this.#props.onRowsAdd) {
			await this.#props.onRowsAdd(rowsNeeded);
		} else if (this.#props.onRowAdd) {
			for (let index = 0; index < rowsNeeded; index++) {
				await this.#props.onRowAdd();
			}
		}

		let attempts = 0;
		while (this.#props.getRowCount() < expectedRowCount && attempts < ROW_SYNC_MAX_ATTEMPTS) {
			await new Promise((resolve) => setTimeout(resolve, ROW_SYNC_POLL_MS));
			attempts++;
		}
	}

	/**
	 * Read the clipboard and apply it, anchored at the focused cell.
	 *
	 * When the paste overruns the grid and a row-add capability exists, the first call stops and
	 * raises the confirmation dialog instead; its Continue calls back with `expandRows`.
	 */
	async paste(expandRows = false): Promise<void> {
		if (this.#props.getReadOnly()) return;

		const focusedCell = this.#props.getFocusedCell();
		if (!focusedCell) return;

		const navigableColumnIds = this.#props.getNavigableColumnIds();
		const startColIndex = navigableColumnIds.indexOf(focusedCell.columnId);
		if (startColIndex === -1) return;

		const dialog = this.pasteDialog;

		try {
			let clipboardText = dialog.clipboardText;
			if (!clipboardText) {
				clipboardText = await navigator.clipboard.readText();
				if (!clipboardText) return;
			}

			const pastedData = parseTsv(clipboardText, navigableColumnIds.length);
			const startRowIndex = focusedCell.rowIndex;
			const rowsNeeded = startRowIndex + pastedData.length - this.#props.getRowCount();

			if (rowsNeeded > 0 && !expandRows && this.#props.getCanAddRows() && !dialog.clipboardText) {
				this.pasteDialog = { open: true, rowsNeeded, clipboardText };
				return;
			}

			if (expandRows && rowsNeeded > 0) await this.#addRows(rowsNeeded);

			const updates: CellUpdate[] = [];
			const rowCount = this.#props.getRowCount();
			let cellsUpdated = 0;
			let cellsSkipped = 0;
			let endRowIndex = startRowIndex;
			let endColIndex = startColIndex;

			for (let pasteRowIdx = 0; pasteRowIdx < pastedData.length; pasteRowIdx++) {
				const pasteRow = pastedData[pasteRowIdx];
				if (!pasteRow) continue;

				const targetRowIndex = startRowIndex + pasteRowIdx;
				if (targetRowIndex >= rowCount) break;

				for (let pasteColIdx = 0; pasteColIdx < pasteRow.length; pasteColIdx++) {
					const targetColIndex = startColIndex + pasteColIdx;
					if (targetColIndex >= navigableColumnIds.length) break;

					const targetColumnId = navigableColumnIds[targetColIndex];
					if (!targetColumnId) continue;

					endRowIndex = Math.max(endRowIndex, targetRowIndex);
					endColIndex = Math.max(endColIndex, targetColIndex);

					const coerced = coercePastedValue(
						pasteRow[pasteColIdx] ?? "",
						this.#props.getCellOpts(targetColumnId),
					);

					if (getIsSkippedPaste(coerced)) {
						cellsSkipped++;
						continue;
					}

					updates.push({
						rowIndex: targetRowIndex,
						columnId: targetColumnId,
						value: coerced.value,
					});
					cellsUpdated++;
				}
			}

			if (updates.length > 0) {
				await this.#props.onPaste?.(updates);

				const allUpdates = [...updates];

				if (this.cutCells.size > 0) {
					// A cut cell that is also a paste target keeps the pasted value: the clears are
					// appended after the paste updates, so an unconditional clear would win and blank it.
					const pastedKeys = new Set(
						updates.map((update) => getCellKey(update.rowIndex, update.columnId)),
					);
					for (const cellKey of this.cutCells) {
						if (pastedKeys.has(cellKey)) continue;
						const { rowIndex, columnId } = parseCellKey(cellKey);
						allUpdates.push({
							rowIndex,
							columnId,
							value: getEmptyCellValue(this.#props.getCellOpts(columnId)?.variant),
						});
					}
					this.cutCells = new SvelteSet();
				}

				this.#props.updateData(allUpdates);

				toast.success(
					cellsSkipped > 0
						? `${pluralCells(cellsUpdated)} pasted, ${cellsSkipped} skipped`
						: `${pluralCells(cellsUpdated)} pasted`,
				);

				const endColumnId = navigableColumnIds[endColIndex];
				if (endColumnId) {
					this.#props.selectRange(
						{ rowIndex: startRowIndex, columnId: focusedCell.columnId },
						{ rowIndex: endRowIndex, columnId: endColumnId },
					);
				}

				this.#props.restoreFocus();
			} else if (cellsSkipped > 0) {
				toast.error(`${pluralCells(cellsSkipped)} skipped pasting for invalid data`);
			}

			if (this.pasteDialog.open) this.setPasteDialogOpen(false);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to paste. Please try again.");
		}
	}
}
