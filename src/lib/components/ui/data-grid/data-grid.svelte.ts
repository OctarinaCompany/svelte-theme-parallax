import {
	createTable,
	functionalUpdate,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type ColumnFiltersState,
	type ColumnOrderState,
	type ColumnPinningState,
	type Row,
	type RowData,
	type RowSelectionState,
	type SortingState,
	type Table,
	type TableOptionsResolved,
	type TableState,
	type Updater,
	type VisibilityState,
} from "@tanstack/table-core";
import { getContext, hasContext, setContext, untrack } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

import { useDirection } from "$lib/components/ui/direction-provider/index.js";
import { TanstackTableBridge } from "$lib/shared/tanstack-table-bridge.svelte.js";

import { DataGridClipboardState } from "./data-grid-clipboard.svelte.js";
import { DataGridDomRegistry } from "./data-grid-dom-registry.js";
import { DataGridSearchState } from "./data-grid-search.svelte.js";
import { DataGridSelectionState } from "./data-grid-selection.svelte.js";
import {
	applyCellUpdates,
	getCellKey,
	getEmptyCellValue,
	getIsInPopover,
	getScrollDirection,
	HORIZONTAL_PAGE_SIZE,
	MAX_COLUMN_SIZE,
	MIN_COLUMN_SIZE,
	NON_NAVIGABLE_COLUMN_IDS,
	parseCellKey,
	scrollCellIntoView,
	VIEWPORT_OFFSET,
} from "./data-grid-utils.js";
import { DataGridVirtualizer } from "./data-grid-virtualizer.svelte.js";
import type {
	CellOpts,
	CellPosition,
	CellUpdate,
	ContextMenuState,
	CreateDataGridOptions,
	DataGridColumnDef,
	Direction,
	NavigationDirection,
	RowHeightValue,
} from "./types.js";

/** Ctrl/Cmd+F. */
const SEARCH_SHORTCUT_KEY = "f";

/**
 * The runes half of `useDataGrid`.
 *
 * Upstream keeps fourteen slices in a hand-rolled `useSyncExternalStore` store and threads twenty
 * props from the hook into `<DataGrid>`. Here the slices are `$state`, the selectors are
 * `$derived`, and every part reads this one object out of a Symbol context — the store, its
 * `batch()` and the prop plumbing all disappear.
 *
 * The table instance is created once and never re-created; reactivity flows through getters the
 * shared {@link TanstackTableBridge} installs on `table.options` after `createTable` — the same
 * bridge `data-table` builds on.
 */
export class DataGridState<TData extends RowData> {
	// $derived is lazy at runtime — by the time any of these read `#options` the constructor has
	// run — but svelte-check cannot see that across the constructor assignment, hence the definite
	// assignment assertions (the same accommodation `DataTableState` makes).
	#options!: CreateDataGridOptions<TData>;

	/** The create-once bridge: rest state, `getState()` composition and the option getters. */
	#bridge: TanstackTableBridge<TData>;

	/** `cellKey → cell wrapper element`. Deliberately not `$state`: a write-only focus registry. */
	#cellMap = new DataGridDomRegistry<string>();
	/** `rowIndex → row element`. Deliberately not `$state`, for the same reason. */
	#rowMap = new DataGridDomRegistry<number>();
	/** Suppresses focus restoration while an async re-render settles. */
	#focusGuard = false;

	#direction = useDirection({ dir: () => this.#options.dir });

	/** The scroll container, set by `<DataGrid.Root>` once it mounts. */
	container = $state.raw<HTMLElement | null>(null);
	/** The sticky header element, used to keep a focused row clear of it. */
	header = $state.raw<HTMLElement | null>(null);
	/** The sticky footer element, used the same way. */
	footer = $state.raw<HTMLElement | null>(null);

	/** Current sorting. */
	sorting = $state.raw<SortingState>([]);
	/** Current column filters. */
	columnFilters = $state.raw<ColumnFiltersState>([]);
	/** Selected rows, keyed by row id. */
	rowSelection = $state.raw<RowSelectionState>({});
	/** Which columns are pinned left/right. */
	columnPinning = $state.raw<ColumnPinningState>({ left: [], right: [] });
	/** Explicit column order, when one has been set. */
	columnOrder = $state.raw<ColumnOrderState>([]);
	/** Which columns are hidden. */
	columnVisibility = $state.raw<VisibilityState>({});
	/** The active row-height preset. `medium` (56px) is the house table row height — see the
	 * uniform-row-height rule in `app.css`; upstream defaults to `short`. */
	rowHeight = $state<RowHeightValue>("medium");
	/** The focused cell, or `null`. */
	focusedCell = $state.raw<CellPosition | null>(null);
	/** The cell being edited, or `null`. Implies `focusedCell` equals it (invariant 2). */
	editingCell = $state.raw<CellPosition | null>(null);
	/** Whether the context menu is open, and where. */
	contextMenu = $state.raw<ContextMenuState>({ open: false, x: 0, y: 0 });
	/** Anchor for shift-click row selection. */
	lastClickedRowId = $state.raw<string | null>(null);

	/** The `@tanstack/table-core` instance. Its identity is stable for this object's lifetime. */
	readonly table!: Table<TData>;

	/** Cell-range selection. */
	readonly selection: DataGridSelectionState;
	/** Copy / cut / paste. */
	readonly clipboard: DataGridClipboardState;
	/** Row windowing. */
	readonly virtualizer: DataGridVirtualizer;
	/** Find-in-grid. `undefined` unless `enableSearch` was set. */
	readonly search: DataGridSearchState | undefined;

	/** The rows of the current row model. */
	readonly rows: Row<TData>[] = $derived(this.table.getRowModel().rows);

	/** Every column id, in definition order. */
	readonly columnIds: string[] = $derived(
		this.#resolveColumns()
			.map((column) => {
				if (column.id) return column.id;
				if ("accessorKey" in column) return String(column.accessorKey);
				return undefined;
			})
			.filter((id): id is string => Boolean(id)),
	);

	/** `columnIds` minus the non-navigable ids — the axis focus and paste move along. */
	readonly navigableColumnIds: string[] = $derived(
		this.columnIds.filter((id) => !NON_NAVIGABLE_COLUMN_IDS.has(id)),
	);

	/**
	 * The `--header-<id>-size` / `--col-<id>-size` custom properties, as one style string.
	 *
	 * Upstream stores bare numbers and multiplies them back with `calc(var(…) * 1px)`. The values
	 * here carry their unit instead, so a header or cell can write `width: var(--col-x-size)`
	 * directly — `calc()` over a custom property is unresolvable in jsdom and takes
	 * `getComputedStyle` down with it, which would make every role query in the suite throw.
	 */
	readonly columnSizeVars: string = $derived.by(() => {
		const declarations: string[] = [];
		for (const header of this.table.getFlatHeaders()) {
			declarations.push(`--header-${header.id}-size: ${header.getSize()}px`);
			declarations.push(`--col-${header.column.id}-size: ${header.column.getSize()}px`);
		}
		return declarations.length > 0 ? `${declarations.join("; ")};` : "";
	});

	/** `rowIndex → selected cell keys`, so a row can render its highlights without a full scan. */
	readonly cellSelectionMap: Map<number, Set<string>> | null = $derived.by(() => {
		const selectedCells = this.selection.selectedCells;
		if (selectedCells.size === 0) return null;

		const rowCells = new SvelteMap<number, Set<string>>();
		for (const cellKey of selectedCells) {
			const { rowIndex } = parseCellKey(cellKey);
			let rowSet = rowCells.get(rowIndex);
			if (!rowSet) {
				rowSet = new SvelteSet<string>();
				rowCells.set(rowIndex, rowSet);
			}
			rowSet.add(cellKey);
		}
		return rowCells;
	});

	/** The resolved text direction — the `dir` option, else the ambient provider, else `ltr`. */
	readonly dir: Direction = $derived(this.#direction.current);

	/** Whether every mutation path is blocked. */
	readonly readOnly: boolean = $derived(this.#options.readOnly ?? false);

	/** Whether Ctrl/Cmd+V is wired up. */
	readonly enablePaste: boolean = $derived(this.#options.enablePaste ?? false);

	/** Whether a row-add affordance should render. */
	readonly canAddRow: boolean = $derived(Boolean(this.#options.onRowAdd));

	/** Whether the delete-rows affordances should render. */
	readonly canDeleteRows: boolean = $derived(Boolean(this.#options.onRowsDelete));

	/** The consumer's file-upload handler, for `file` cells. */
	readonly onFilesUpload: CreateDataGridOptions<TData>["onFilesUpload"] = $derived(
		this.#options.onFilesUpload,
	);

	/** The consumer's file-delete handler, for `file` cells. */
	readonly onFilesDelete: CreateDataGridOptions<TData>["onFilesDelete"] = $derived(
		this.#options.onFilesDelete,
	);

	constructor(options: CreateDataGridOptions<TData>) {
		this.#options = options;

		this.#bridge = new TanstackTableBridge<TData>({
			getData: () => this.#resolveData(),
			getColumns: () => this.#resolveColumns(),
			getControlledState: () => this.#resolveControlledState(),
			slices: {
				sorting: { get: () => this.sorting, set: (next) => (this.sorting = next) },
				columnFilters: {
					get: () => this.columnFilters,
					set: (next) => (this.columnFilters = next),
				},
				rowSelection: { get: () => this.rowSelection, set: (next) => (this.rowSelection = next) },
				columnPinning: {
					get: () => this.columnPinning,
					set: (next) => (this.columnPinning = next),
				},
				columnOrder: { get: () => this.columnOrder, set: (next) => (this.columnOrder = next) },
				columnVisibility: {
					get: () => this.columnVisibility,
					set: (next) => (this.columnVisibility = next),
				},
			},
		});

		const {
			data: _data,
			columns: _columns,
			state: _state,
			initialState,
			defaultColumn,
			getRowId,
			rowHeight = "medium",
		} = options;

		const resolvedOptions: TableOptionsResolved<TData> = {
			data: this.#resolveData(),
			columns: this.#resolveColumns(),
			getRowId,
			initialState,
			defaultColumn: {
				minSize: MIN_COLUMN_SIZE,
				maxSize: MAX_COLUMN_SIZE,
				...defaultColumn,
			},
			state: {},
			columnResizeMode: "onChange",
			columnResizeDirection: options.dir ?? "ltr",
			onStateChange: this.#bridge.onStateChange,
			onSortingChange: this.#bridge.sliceHandler("sorting", (next) =>
				this.#options.onSortingChange?.(next),
			),
			onColumnFiltersChange: this.#bridge.sliceHandler("columnFilters", (next) =>
				this.#options.onColumnFiltersChange?.(next),
			),
			// Row selection cannot use the bridge's plain handler: it also projects onto the cell
			// selection and drops focus (see `#setRowSelection`).
			onRowSelectionChange: (updater) => this.#setRowSelection(updater),
			onColumnPinningChange: this.#bridge.sliceHandler("columnPinning"),
			onColumnOrderChange: this.#bridge.sliceHandler("columnOrder"),
			onColumnVisibilityChange: this.#bridge.sliceHandler("columnVisibility"),
			renderFallbackValue: null,
			getCoreRowModel: getCoreRowModel(),
			getFilteredRowModel: getFilteredRowModel(),
			getSortedRowModel: getSortedRowModel(),
		};

		const table = createTable(resolvedOptions);
		this.table = table;
		this.rowHeight = rowHeight;

		// Seeds every slice from `table.initialState` and installs the reactive option getters —
		// plus the grid-only `columnResizeDirection`, which must track the resolved direction.
		this.#bridge.attach(table, { columnResizeDirection: () => this.dir });

		this.selection = new DataGridSelectionState({
			getColumnIds: () => this.columnIds,
			getRowCount: () => this.rows.length,
			getEnableSingleCellSelection: () => this.#options.enableSingleCellSelection ?? false,
			getEnableColumnSelection: () => this.#options.enableColumnSelection ?? false,
		});

		this.virtualizer = new DataGridVirtualizer({
			getRowCount: () => this.rows.length,
			getRowHeight: () => this.rowHeight,
			getOverscan: () => this.#options.overscan ?? 6,
			getScrollElement: () => this.container,
		});

		this.clipboard = new DataGridClipboardState({
			getSelectedCells: () => this.selection.selectedCells,
			getFocusedCell: () => this.focusedCell,
			getCellValue: (rowIndex, columnId) => this.getCellValue(rowIndex, columnId),
			getCellOpts: (columnId) => this.getCellOpts(columnId),
			getNavigableColumnIds: () => this.navigableColumnIds,
			getRowCount: () => this.rows.length,
			getReadOnly: () => this.readOnly,
			getCanAddRows: () => Boolean(this.#options.onRowsAdd ?? this.#options.onRowAdd),
			updateData: (updates) => this.updateData(updates),
			selectRange: (start, end) => this.selection.selectRange(start, end),
			restoreFocus: () => this.restoreFocus(),
			onPaste: (updates) => this.#options.onPaste?.(updates),
			onRowsAdd: this.#options.onRowsAdd ? (count) => this.#options.onRowsAdd?.(count) : undefined,
			onRowAdd: this.#options.onRowAdd ? () => this.#options.onRowAdd?.() : undefined,
		});

		this.search = options.enableSearch
			? new DataGridSearchState({
					getRowCount: () => this.rows.length,
					getColumnIds: () => this.columnIds,
					getCellValue: (rowIndex, columnId) => this.getCellValue(rowIndex, columnId),
					scrollToIndex: (rowIndex) =>
						this.virtualizer.scrollToIndex(rowIndex, { align: "center" }),
					focusCell: (rowIndex, columnId) => this.focusCell(rowIndex, columnId),
					restoreFocus: () => this.restoreFocus(),
				})
			: undefined;
	}

	// -------------------------------------------------------------------------
	// Option resolution and the table-core bridge
	// -------------------------------------------------------------------------

	#resolveData(): TData[] {
		const { data } = this.#options;
		return typeof data === "function" ? data() : data;
	}

	#resolveColumns(): DataGridColumnDef<TData>[] {
		const { columns } = this.#options;
		return typeof columns === "function" ? columns() : columns;
	}

	#resolveControlledState(): Partial<TableState> {
		const { state } = this.#options;
		if (state === undefined) return {};
		return typeof state === "function" ? state() : state;
	}

	/**
	 * Row selection also projects onto the cell selection — selecting a row selects its cells —
	 * and drops focus, exactly as upstream does.
	 */
	#setRowSelection(updater: Updater<RowSelectionState>): void {
		const next = functionalUpdate(updater, this.rowSelection);
		this.rowSelection = next;

		const selectedCells = new SvelteSet<string>();
		for (const [rowIndex, row] of this.rows.entries()) {
			if (!next[row.id]) continue;
			for (const columnId of this.columnIds) {
				selectedCells.add(getCellKey(rowIndex, columnId));
			}
		}

		this.selection.selectedCells = selectedCells;
		this.selection.selectionRange = null;
		this.selection.isSelecting = false;
		this.focusedCell = null;
		this.editingCell = null;

		this.#options.onRowSelectionChange?.(next);
	}

	// -------------------------------------------------------------------------
	// Reads
	// -------------------------------------------------------------------------

	/** The value stored at a cell, or `undefined` when the cell does not exist. */
	getCellValue(rowIndex: number, columnId: string): unknown {
		const row = this.rows[rowIndex];
		if (!row) return undefined;
		const cell = row.getVisibleCells().find((entry) => entry.column.id === columnId);
		return cell?.getValue();
	}

	/** A column's declared cell variant and its options. */
	getCellOpts(columnId: string): CellOpts | undefined {
		return this.table.getAllColumns().find((column) => column.id === columnId)?.columnDef.meta
			?.cell;
	}

	/** Whether a cell is part of the current selection. */
	getIsCellSelected(rowIndex: number, columnId: string): boolean {
		return this.selection.has(rowIndex, columnId);
	}

	/** Whether a cell matches the current search query. */
	getIsSearchMatch(rowIndex: number, columnId: string): boolean {
		return this.search?.isMatch(rowIndex, columnId) ?? false;
	}

	/** Whether a cell is the search match currently being navigated to. */
	getIsActiveSearchMatch(rowIndex: number, columnId: string): boolean {
		return this.search?.isActiveMatch(rowIndex, columnId) ?? false;
	}

	/** A row's 1-based position in the current row model, for the select column's label. */
	getVisualRowIndex(rowId: string): number | undefined {
		const index = this.rows.findIndex((row) => row.id === rowId);
		return index === -1 ? undefined : index + 1;
	}

	// -------------------------------------------------------------------------
	// DOM registries
	// -------------------------------------------------------------------------

	/** Register (or drop) a cell wrapper element, so focus and scroll can reach it. */
	registerCell(rowIndex: number, columnId: string, element: HTMLElement | null): void {
		this.#cellMap.set(getCellKey(rowIndex, columnId), element);
	}

	/** Register (or drop) a row element. */
	registerRow(rowIndex: number, element: HTMLElement | null): void {
		this.#rowMap.set(rowIndex, element);
	}

	/** The registered cell wrapper for a position, if it is currently mounted. */
	getCellElement(rowIndex: number, columnId: string): HTMLElement | undefined {
		return this.#cellMap.get(getCellKey(rowIndex, columnId));
	}

	/** The registered row element for an index, if it is currently mounted. */
	getRowElement(rowIndex: number): HTMLElement | undefined {
		return this.#rowMap.get(rowIndex);
	}

	/** Move DOM focus back to the grid container. */
	restoreFocus(): void {
		const container = this.container;
		if (container && document.activeElement !== container) container.focus();
	}

	#focusCellElement(rowIndex: number, columnId: string): void {
		this.#focusGuard = true;
		const element = this.getCellElement(rowIndex, columnId);
		if (element) element.focus();
		else this.container?.focus();
		this.#focusGuard = false;
	}

	// -------------------------------------------------------------------------
	// Focus and editing
	// -------------------------------------------------------------------------

	/** Focus a cell: update the slice, drop any edit, and move DOM focus onto its wrapper. */
	focusCell(rowIndex: number, columnId: string): void {
		this.focusedCell = { rowIndex, columnId };
		this.editingCell = null;

		if (this.search?.open) return;

		this.#focusCellElement(rowIndex, columnId);
	}

	/** Drop focus and any in-progress edit. */
	blurCell(): void {
		if (this.editingCell && document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		this.focusedCell = null;
		this.editingCell = null;
	}

	/** Enter edit mode. A no-op while `readOnly` (invariant 4). */
	startEditing(rowIndex: number, columnId: string): void {
		if (this.readOnly) return;
		this.focusedCell = { rowIndex, columnId };
		this.editingCell = { rowIndex, columnId };
	}

	/**
	 * Leave edit mode. Committing the value is the cell variant's job; this only decides where
	 * focus lands afterwards.
	 */
	stopEditing(options?: { moveToNextRow?: boolean; direction?: NavigationDirection }): void {
		const editing = this.editingCell;
		this.editingCell = null;
		if (!editing) return;

		if (options?.moveToNextRow) {
			const nextRowIndex = editing.rowIndex + 1;
			if (nextRowIndex < this.rows.length) {
				this.focusCell(nextRowIndex, editing.columnId);
			} else {
				this.#focusCellElement(editing.rowIndex, editing.columnId);
			}
			return;
		}

		if (options?.direction) {
			this.focusCell(editing.rowIndex, editing.columnId);
			this.navigateCell(options.direction);
			return;
		}

		this.#focusCellElement(editing.rowIndex, editing.columnId);
	}

	// -------------------------------------------------------------------------
	// Navigation
	// -------------------------------------------------------------------------

	/** The position `direction` moves to from `origin`, clamped and RTL-aware. */
	getNextPosition(origin: CellPosition, direction: NavigationDirection): CellPosition {
		const navigableColumnIds = this.navigableColumnIds;
		const currentColIndex = navigableColumnIds.indexOf(origin.columnId);
		const rowCount = this.rows.length;
		const isRtl = this.dir === "rtl";

		let rowIndex = origin.rowIndex;
		let columnId = origin.columnId;

		const stepColumn = (delta: number): void => {
			const target = currentColIndex + delta;
			if (target < 0 || target > navigableColumnIds.length - 1) return;
			const next = navigableColumnIds[target];
			if (next) columnId = next;
		};

		switch (direction) {
			case "up":
				rowIndex = Math.max(0, origin.rowIndex - 1);
				break;
			case "down":
				rowIndex = Math.min(rowCount - 1, origin.rowIndex + 1);
				break;
			case "left":
				stepColumn(isRtl ? 1 : -1);
				break;
			case "right":
				stepColumn(isRtl ? -1 : 1);
				break;
			case "home":
				columnId = navigableColumnIds[0] ?? columnId;
				break;
			case "end":
				columnId = navigableColumnIds[navigableColumnIds.length - 1] ?? columnId;
				break;
			case "ctrl+home":
				rowIndex = 0;
				columnId = navigableColumnIds[0] ?? columnId;
				break;
			case "ctrl+end":
				rowIndex = Math.max(0, rowCount - 1);
				columnId = navigableColumnIds[navigableColumnIds.length - 1] ?? columnId;
				break;
			case "ctrl+up":
				rowIndex = 0;
				break;
			case "ctrl+down":
				rowIndex = Math.max(0, rowCount - 1);
				break;
			case "pageup": {
				const pageSize = this.virtualizer.virtualItems.length || 10;
				rowIndex = Math.max(0, origin.rowIndex - pageSize);
				break;
			}
			case "pagedown": {
				const pageSize = this.virtualizer.virtualItems.length || 10;
				rowIndex = Math.min(rowCount - 1, origin.rowIndex + pageSize);
				break;
			}
			case "pageleft":
				if (currentColIndex > 0) {
					const target = Math.max(0, currentColIndex - HORIZONTAL_PAGE_SIZE);
					columnId = navigableColumnIds[target] ?? columnId;
				}
				break;
			case "pageright":
				if (currentColIndex < navigableColumnIds.length - 1) {
					const target = Math.min(
						navigableColumnIds.length - 1,
						currentColIndex + HORIZONTAL_PAGE_SIZE,
					);
					columnId = navigableColumnIds[target] ?? columnId;
				}
				break;
		}

		if (rowCount === 0) rowIndex = origin.rowIndex;

		return { rowIndex, columnId };
	}

	/**
	 * Which way Tab moves, accounting for direction. Cell variants that commit before leaving edit
	 * mode ask for it rather than hard-coding `left`/`right`, so a Tab out of an editor lands on the
	 * same cell a Tab from the resting cell would.
	 */
	getTabDirection(shiftKey: boolean): NavigationDirection {
		if (this.dir === "rtl") return shiftKey ? "right" : "left";
		return shiftKey ? "left" : "right";
	}

	/** Move focus, then bring the target into view. */
	navigateCell(direction: NavigationDirection): void {
		const focused = this.focusedCell;
		if (!focused) return;
		if (this.navigableColumnIds.length === 0) return;

		const next = this.getNextPosition(focused, direction);
		if (next.rowIndex === focused.rowIndex && next.columnId === focused.columnId) return;

		if (!this.getRowElement(next.rowIndex)) {
			const align =
				direction === "up" ||
				direction === "pageup" ||
				direction === "ctrl+up" ||
				direction === "ctrl+home"
					? "start"
					: direction === "down" ||
						  direction === "pagedown" ||
						  direction === "ctrl+down" ||
						  direction === "ctrl+end"
						? "end"
						: "center";
			this.virtualizer.scrollToIndex(next.rowIndex, { align });
		}

		this.focusCell(next.rowIndex, next.columnId);

		if (next.columnId !== focused.columnId) {
			this.scrollColumnIntoView(next.rowIndex, next.columnId, getScrollDirection(direction));
		}
	}

	/** Bring a cell into view horizontally, accounting for pinned columns and RTL. */
	scrollColumnIntoView(
		rowIndex: number,
		columnId: string,
		direction?: "left" | "right" | "home" | "end",
	): void {
		const container = this.container;
		const targetCell = this.getCellElement(rowIndex, columnId);
		if (!container || !targetCell) return;

		scrollCellIntoView({
			container,
			targetCell,
			table: this.table,
			viewportOffset: VIEWPORT_OFFSET,
			direction,
			isRtl: this.dir === "rtl",
		});
	}

	// -------------------------------------------------------------------------
	// Mutation
	// -------------------------------------------------------------------------

	/**
	 * Apply one or many cell writes and emit exactly one `onDataChange`.
	 *
	 * The row model is post-sort/post-filter, so each `rowIndex` is mapped back onto the source
	 * array before the new array is built. The consumer's rows are never mutated: touched rows are
	 * shallow-copied.
	 */
	updateData(updates: CellUpdate | CellUpdate[]): void {
		if (this.readOnly) return;

		const updateArray = Array.isArray(updates) ? updates : [updates];
		if (updateArray.length === 0) return;

		const rows = this.rows;
		const nextData = applyCellUpdates<TData>({
			data: this.#resolveData(),
			getOriginal: (rowIndex) => rows[rowIndex]?.original,
			updates: updateArray,
		});

		this.#options.onDataChange?.(nextData);
	}

	/** Reset each named cell to its variant's empty value. */
	clearCells(cellKeys: string[]): void {
		if (this.readOnly || cellKeys.length === 0) return;

		const updates: CellUpdate[] = cellKeys.map((cellKey) => {
			const { rowIndex, columnId } = parseCellKey(cellKey);
			return { rowIndex, columnId, value: getEmptyCellValue(this.getCellOpts(columnId)?.variant) };
		});

		this.updateData(updates);

		if (this.selection.size > 0) this.clearSelection();
		if (this.clipboard.cutCells.size > 0) this.clipboard.cutCells = new SvelteSet();
	}

	/** Clear both the cell selection and the row selection. */
	clearSelection(): void {
		this.selection.clear();
		if (Object.keys(this.rowSelection).length > 0) {
			this.rowSelection = {};
			this.#options.onRowSelectionChange?.({});
		}
	}

	/** Run `onRowAdd` and focus the cell it names. */
	async addRow(event?: MouseEvent): Promise<void> {
		if (this.readOnly || !this.#options.onRowAdd) return;

		const initialRowCount = this.#resolveData().length;
		const focusedColumnId = this.focusedCell?.columnId;

		let result: Partial<CellPosition> | null | void;
		try {
			result = await this.#options.onRowAdd(event);
		} catch {
			return;
		}

		if (result === null || event?.defaultPrevented) return;

		this.clearSelection();

		const targetRowIndex = result?.rowIndex ?? initialRowCount;
		const targetColumnId =
			result?.columnId ?? focusedColumnId ?? this.navigableColumnIds[0] ?? undefined;

		if (!targetColumnId) return;

		this.virtualizer.scrollToIndex(targetRowIndex, { align: "center" });
		this.focusCell(Math.max(0, Math.min(targetRowIndex, this.rows.length - 1)), targetColumnId);
	}

	/** Run `onRowsDelete`, then focus the row that now occupies the lowest deleted index. */
	async deleteRows(rowIndices: number[]): Promise<void> {
		if (this.readOnly || !this.#options.onRowsDelete || rowIndices.length === 0) return;

		const rows = this.rows;
		if (rows.length === 0) return;

		const focusedColumnId = this.focusedCell?.columnId ?? this.navigableColumnIds[0];
		const minDeletedRowIndex = Math.min(...rowIndices);

		const rowsToDelete: TData[] = [];
		for (const rowIndex of rowIndices) {
			const row = rows[rowIndex];
			if (row) rowsToDelete.push(row.original);
		}

		await this.#options.onRowsDelete(rowsToDelete, rowIndices);

		this.clearSelection();
		this.editingCell = null;

		const newRowCount = this.rows.length;
		if (newRowCount > 0 && focusedColumnId) {
			this.focusCell(Math.min(minDeletedRowIndex, newRowCount - 1), focusedColumnId);
		} else {
			this.focusedCell = null;
		}
	}

	/** Change the row-height preset and report it. */
	setRowHeight(value: RowHeightValue): void {
		this.rowHeight = value;
		this.#options.onRowHeightChange?.(value);
	}

	/** Toggle one row's selection, extending from the last click when `shiftKey` is held. */
	selectRow(rowId: string, selected: boolean, shiftKey: boolean): void {
		const rows = this.rows;
		const currentRowIndex = rows.findIndex((row) => row.id === rowId);
		if (currentRowIndex === -1) return;

		const next: RowSelectionState = { ...this.rowSelection };

		const lastClickedRowIndex = this.lastClickedRowId
			? rows.findIndex((row) => row.id === this.lastClickedRowId)
			: -1;

		if (shiftKey && lastClickedRowIndex >= 0) {
			const startIndex = Math.min(lastClickedRowIndex, currentRowIndex);
			const endIndex = Math.max(lastClickedRowIndex, currentRowIndex);
			for (let index = startIndex; index <= endIndex; index++) {
				const row = rows[index];
				if (row) next[row.id] = selected;
			}
		} else {
			next[rowId] = selected;
		}

		this.#setRowSelection(next);
		this.lastClickedRowId = rowId;
	}

	/** Header click: select the whole column, or drop the selection when the flag is off. */
	selectColumn(columnId: string): void {
		if (!(this.#options.enableColumnSelection ?? false)) {
			this.clearSelection();
			return;
		}
		this.selection.selectColumn(columnId);
	}

	// -------------------------------------------------------------------------
	// Pointer interaction
	// -------------------------------------------------------------------------

	/** A left click on a cell: modifier-aware selection, else focus, else start editing. */
	handleCellClick(rowIndex: number, columnId: string, event?: MouseEvent): void {
		if (event?.button === 2) return;

		const focused = this.focusedCell;

		if (event && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			this.selection.toggleCell({ rowIndex, columnId });
			this.focusCell(rowIndex, columnId);
			return;
		}

		if (event?.shiftKey && focused) {
			event.preventDefault();
			this.selection.selectRange(focused, { rowIndex, columnId });
			return;
		}

		const hasSelectedCells = this.selection.size > 0;
		const hasSelectedRows = Object.keys(this.rowSelection).length > 0;

		if (hasSelectedCells && !this.selection.isSelecting) {
			if (!this.selection.has(rowIndex, columnId)) {
				this.clearSelection();
			} else {
				this.focusCell(rowIndex, columnId);
				return;
			}
		} else if (hasSelectedRows && columnId !== "select") {
			this.clearSelection();
		}

		if (focused?.rowIndex === rowIndex && focused?.columnId === columnId) {
			this.startEditing(rowIndex, columnId);
		} else {
			this.focusCell(rowIndex, columnId);
		}
	}

	/** Pointer down on a cell begins a drag-select from that cell. */
	handleCellPointerDown(rowIndex: number, columnId: string, event: PointerEvent): void {
		if (event.button === 2) return;
		event.preventDefault();

		if (event.ctrlKey || event.metaKey || event.shiftKey) return;

		this.selection.beginDrag({ rowIndex, columnId });
		if (Object.keys(this.rowSelection).length > 0) this.rowSelection = {};
	}

	/** Pointer entering a cell mid-drag extends the rectangle to it. */
	handleCellPointerEnter(rowIndex: number, columnId: string): void {
		const range = this.selection.selectionRange;
		if (!this.selection.isSelecting || !range) return;

		const { start } = range;
		if (
			this.focusedCell?.rowIndex !== start.rowIndex ||
			this.focusedCell.columnId !== start.columnId
		) {
			this.focusCell(start.rowIndex, start.columnId);
		}
		this.selection.selectRange(start, { rowIndex, columnId }, true);
	}

	/** Pointer up ends the drag. */
	handleCellPointerUp(): void {
		this.selection.isSelecting = false;
	}

	/** Right click selects the cell (unless it already was) and opens the context menu there. */
	handleCellContextMenu(rowIndex: number, columnId: string, event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();

		if (!this.selection.has(rowIndex, columnId)) {
			this.selection.selectRange({ rowIndex, columnId }, { rowIndex, columnId });
			this.focusedCell = { rowIndex, columnId };
		}

		this.contextMenu = { open: true, x: event.clientX, y: event.clientY };
	}

	/** Close the context menu, keeping its anchor point. */
	setContextMenuOpen(open: boolean): void {
		if (open) return;
		this.contextMenu = { open: false, x: this.contextMenu.x, y: this.contextMenu.y };
	}

	/**
	 * Focus leaving the grid restores it to the focused cell — unless it went into a cell editor
	 * or a floating layer, which are logically still inside the grid.
	 */
	handleFocusOut(relatedTarget: EventTarget | null): void {
		if (this.#focusGuard) return;
		if (!this.focusedCell || this.editingCell) return;

		const container = this.container;
		if (!container) return;

		const movingOutside = !relatedTarget || !container.contains(relatedTarget as Node);
		if (!movingOutside || getIsInPopover(relatedTarget)) return;

		const { rowIndex, columnId } = this.focusedCell;
		const element = this.getCellElement(rowIndex, columnId);
		if (element && document.body.contains(element)) element.focus();
		else container.focus();
	}

	// -------------------------------------------------------------------------
	// Keyboard
	// -------------------------------------------------------------------------

	/** Rows the delete shortcut and the context menu's Delete would remove. */
	getRowIndicesToDelete(): number[] {
		const rowIndices = new SvelteSet<number>();

		const selectedRowIds = Object.keys(this.rowSelection).filter((id) => this.rowSelection[id]);
		if (selectedRowIds.length > 0) {
			for (const [rowIndex, row] of this.rows.entries()) {
				if (this.rowSelection[row.id]) rowIndices.add(rowIndex);
			}
		} else if (this.selection.size > 0) {
			for (const cellKey of this.selection.selectedCells) {
				rowIndices.add(parseCellKey(cellKey).rowIndex);
			}
		} else if (this.focusedCell) {
			rowIndices.add(this.focusedCell.rowIndex);
		}

		return [...rowIndices].sort((a, b) => a - b);
	}

	/** The cells Delete/Backspace, the context menu's Clear and a cut would act on. */
	getTargetCellKeys(): string[] {
		if (this.selection.size > 0) return [...this.selection.selectedCells];
		if (this.focusedCell) {
			return [getCellKey(this.focusedCell.rowIndex, this.focusedCell.columnId)];
		}
		return [];
	}

	#extendSelection(direction: NavigationDirection): void {
		const focused = this.focusedCell;
		if (!focused) return;

		const range = this.selection.selectionRange;
		const edge = range?.end ?? focused;
		const start = range?.start ?? focused;
		const next = this.getNextPosition(edge, direction);

		this.selection.selectRange(start, next);
		this.scrollColumnIntoView(next.rowIndex, next.columnId, getScrollDirection(direction));
	}

	/**
	 * The whole grid key contract, in precedence order:
	 * search shortcut → search-open branch → editing → row deletion → no focus → clipboard and
	 * select-all → cell clearing → row insertion → navigation and selection extension.
	 */
	handleKeydown(event: KeyboardEvent): void {
		const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
		const isModPressed = ctrlKey || metaKey;
		const search = this.search;

		if (search && isModPressed && !shiftKey && key === SEARCH_SHORTCUT_KEY) {
			event.preventDefault();
			search.setOpen(!search.open);
			return;
		}

		if (search?.open && !this.editingCell) {
			if (key === "Enter") {
				event.preventDefault();
				if (shiftKey) search.prev();
				else search.next();
				return;
			}
			if (key === "Escape") {
				event.preventDefault();
				search.setOpen(false);
				return;
			}
			return;
		}

		// Enter / Tab / Escape while editing belong to the cell variant, which commits first.
		if (this.editingCell) return;

		if (
			isModPressed &&
			(key === "Backspace" || key === "Delete") &&
			!this.readOnly &&
			this.#options.onRowsDelete
		) {
			const rowIndices = this.getRowIndicesToDelete();
			if (rowIndices.length > 0) {
				event.preventDefault();
				void this.deleteRows(rowIndices);
			}
			return;
		}

		const focused = this.focusedCell;
		if (!focused) return;

		if (isModPressed && !shiftKey && key === "a") {
			event.preventDefault();
			this.selection.selectAll();
			return;
		}

		if (isModPressed && !shiftKey && key === "c") {
			event.preventDefault();
			void this.clipboard.copy();
			return;
		}

		if (isModPressed && !shiftKey && key === "x" && !this.readOnly) {
			event.preventDefault();
			void this.clipboard.cut();
			return;
		}

		if (this.enablePaste && isModPressed && !shiftKey && key === "v" && !this.readOnly) {
			event.preventDefault();
			void this.clipboard.paste();
			return;
		}

		if ((key === "Delete" || key === "Backspace") && !isModPressed && !this.readOnly) {
			const cellKeys = this.getTargetCellKeys();
			if (cellKeys.length > 0) {
				event.preventDefault();
				this.clearCells(cellKeys);
			}
			return;
		}

		if (key === "Enter" && shiftKey && !this.readOnly && this.#options.onRowAdd) {
			event.preventDefault();
			void this.addRow();
			return;
		}

		let direction: NavigationDirection | null = null;

		switch (key) {
			case "ArrowUp":
				if (altKey && !isModPressed && !shiftKey) direction = "pageup";
				else if (isModPressed && shiftKey) {
					event.preventDefault();
					this.#extendToRow(0);
					return;
				} else if (isModPressed) direction = "ctrl+up";
				else direction = "up";
				break;
			case "ArrowDown":
				if (altKey && !isModPressed && !shiftKey) direction = "pagedown";
				else if (isModPressed && shiftKey) {
					event.preventDefault();
					this.#extendToRow(Math.max(0, this.rows.length - 1));
					return;
				} else if (isModPressed) direction = "ctrl+down";
				else direction = "down";
				break;
			case "ArrowLeft":
				if (isModPressed && shiftKey) {
					event.preventDefault();
					this.#extendToColumnEdge(this.dir === "rtl" ? "last" : "first", "home");
					return;
				} else if (isModPressed) direction = "home";
				else direction = "left";
				break;
			case "ArrowRight":
				if (isModPressed && shiftKey) {
					event.preventDefault();
					this.#extendToColumnEdge(this.dir === "rtl" ? "first" : "last", "end");
					return;
				} else if (isModPressed) direction = "end";
				else direction = "right";
				break;
			case "Home":
				direction = isModPressed ? "ctrl+home" : "home";
				break;
			case "End":
				direction = isModPressed ? "ctrl+end" : "end";
				break;
			case "PageUp":
				direction = altKey ? "pageleft" : "pageup";
				break;
			case "PageDown":
				direction = altKey ? "pageright" : "pagedown";
				break;
			case "Escape":
				event.preventDefault();
				if (this.selection.size > 0 || Object.keys(this.rowSelection).length > 0) {
					this.clearSelection();
				} else {
					this.blurCell();
				}
				return;
			case "Tab":
				event.preventDefault();
				if (this.dir === "rtl") direction = shiftKey ? "right" : "left";
				else direction = shiftKey ? "left" : "right";
				break;
		}

		if (!direction) return;

		event.preventDefault();

		// `Tab` is navigation, never selection extension — upstream excludes it from this branch.
		if (shiftKey && key !== "Tab") {
			this.#extendSelection(direction);
			return;
		}

		if (this.selection.size > 0) this.clearSelection();
		this.navigateCell(direction);
	}

	#extendToRow(rowIndex: number): void {
		const focused = this.focusedCell;
		if (!focused) return;

		const range = this.selection.selectionRange;
		const edge = range?.end ?? focused;
		const start = range?.start ?? focused;

		this.selection.selectRange(start, { rowIndex, columnId: edge.columnId });
		this.virtualizer.scrollToIndex(rowIndex, { align: rowIndex === 0 ? "start" : "end" });
		this.restoreFocus();
	}

	#extendToColumnEdge(edge: "first" | "last", scroll: "home" | "end"): void {
		const focused = this.focusedCell;
		if (!focused) return;

		const navigableColumnIds = this.navigableColumnIds;
		const targetColumnId =
			edge === "first" ? navigableColumnIds[0] : navigableColumnIds[navigableColumnIds.length - 1];
		if (!targetColumnId) return;

		const range = this.selection.selectionRange;
		const selectionEdge = range?.end ?? focused;
		const start = range?.start ?? focused;

		this.selection.selectRange(start, {
			rowIndex: selectionEdge.rowIndex,
			columnId: targetColumnId,
		});
		this.scrollColumnIntoView(selectionEdge.rowIndex, targetColumnId, scroll);
		this.restoreFocus();
	}

	/**
	 * Focus the cell `autoFocus` names, on mount. Called from `<DataGrid.Root>`'s mount effect
	 * because `createDataGrid` runs before any DOM exists.
	 */
	applyAutoFocus(): void {
		const autoFocus = this.#options.autoFocus;
		if (!autoFocus) return;
		if (untrack(() => this.focusedCell) !== null) return;
		if (this.rows.length === 0 || this.navigableColumnIds.length === 0) return;

		if (typeof autoFocus === "object") {
			const columnId = autoFocus.columnId ?? this.navigableColumnIds[0];
			if (!columnId) return;
			this.focusCell(autoFocus.rowIndex ?? 0, columnId);
			return;
		}

		const firstColumnId = this.navigableColumnIds[0];
		if (firstColumnId) this.focusCell(0, firstColumnId);
	}

	/** Cancel the search debounce. Called from `<DataGrid.Root>`'s teardown. */
	destroy(): void {
		this.search?.destroy();
	}
}

/**
 * Create the grid state. Must be called during component initialisation — it creates runes.
 *
 * @example
 * ```ts
 * const grid = createDataGrid({
 * 	data: () => rows,
 * 	columns: () => columns,
 * 	getRowId: (row) => row.id,
 * 	onDataChange: (next) => { rows = next; }
 * });
 * ```
 */
export function createDataGrid<TData extends RowData>(
	options: CreateDataGridOptions<TData>,
): DataGridState<TData> {
	return new DataGridState(options);
}

const DATA_GRID_CONTEXT_KEY = Symbol("data-grid");

/** Publish the grid state. Called by `<DataGrid.Root>`. */
export function setDataGridContext<TData extends RowData>(
	state: DataGridState<TData>,
): DataGridState<TData> {
	return setContext(DATA_GRID_CONTEXT_KEY, state);
}

/** Whether a `<DataGrid.Root>` is present above the caller. */
export function hasDataGridContext(): boolean {
	return hasContext(DATA_GRID_CONTEXT_KEY);
}

/**
 * Read the grid published by `<DataGrid.Root>`.
 *
 * @param part The calling part's tag, so the thrown message names it — that message is part of the
 * documented API and is asserted by the test suite.
 */
export function getDataGridContext<TData extends RowData>(
	part = "<DataGrid.Cell>",
): DataGridState<TData> {
	if (!hasDataGridContext()) {
		throw new Error(`\`${part}\` must be used within \`<DataGrid.Root>\`.`);
	}
	return getContext<DataGridState<TData>>(DATA_GRID_CONTEXT_KEY);
}

/**
 * Resolve the grid a part drives during initialisation: nothing when the part was handed its own
 * `grid` (or `search`) prop, otherwise the one `<DataGrid.Root>` published — throwing immediately
 * when neither exists.
 *
 * `getOwn` is a getter so the prop is read inside a closure: reading it at the top level of an
 * instance script would only ever capture its initial value, which Svelte rightly warns about.
 */
export function useDataGridContext<TData extends RowData>(
	getOwn: () => unknown,
	part: string,
): DataGridState<TData> | undefined {
	return untrack(getOwn) !== undefined ? undefined : getDataGridContext<TData>(part);
}
