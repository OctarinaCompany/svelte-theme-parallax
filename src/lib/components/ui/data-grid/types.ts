import type {
	ColumnDef,
	ColumnFiltersState,
	ColumnOrderState,
	ColumnPinningState,
	Row,
	RowData,
	RowSelectionState,
	SortingState,
	TableState,
} from "@tanstack/table-core";
import type { Component } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

/**
 * `'ltr' | 'rtl'` — re-exported from `direction-provider` rather than redeclared, so a grid nested
 * in a `<DirectionProvider>` and one given an explicit `dir` speak the same type.
 */
export type { Direction };

/**
 * An icon component — a `@lucide/svelte` icon, or any Svelte component that renders an `<svg>`.
 *
 * Upstream types this `React.FC<React.SVGProps<SVGSVGElement>>`. Requiring only `class` accepts
 * every lucide icon without widening to `any`, matching `DataTableIcon`.
 */
export type DataGridIcon = Component<{ class?: string }>;

/**
 * How tall each row is. Read through `getRowHeightValue()` (pixels) and `getLineCount()` (visible
 * lines of text) — both exhaustive `Record` lookups, so an unknown value is a type error rather
 * than a runtime fallback.
 */
export type RowHeightValue = "short" | "medium" | "tall" | "extra-tall";

/** One option of a `select` / `multi-select` cell. */
export interface CellSelectOption {
	/** What the user reads. */
	label: string;
	/** What is stored in the row. */
	value: string;
	/** Optional leading icon. */
	icon?: DataGridIcon;
	/** Optional trailing count, for faceted lists. */
	count?: number;
}

/**
 * Which editor a column's cells render, plus that variant's configuration. Discriminated on
 * `variant`, so `cellOpts.options` is only reachable after narrowing to `select`/`multi-select`.
 */
export type CellOpts =
	| { variant: "short-text" }
	| { variant: "long-text" }
	| {
			variant: "number";
			/** Lower bound handed to the editor's `<input type="number">`. */
			min?: number;
			/** Upper bound handed to the editor's `<input type="number">`. */
			max?: number;
			/** Increment handed to the editor's `<input type="number">`. */
			step?: number;
	  }
	| { variant: "select"; options: CellSelectOption[] }
	| { variant: "multi-select"; options: CellSelectOption[] }
	| { variant: "checkbox" }
	| { variant: "date" }
	| { variant: "url" }
	| {
			variant: "file";
			/** Largest accepted file, in bytes. @default 10485760 */
			maxFileSize?: number;
			/** How many files the cell holds at once. @default 10 */
			maxFiles?: number;
			/** `accept` attribute of the hidden file input. */
			accept?: string;
			/** Whether the picker accepts more than one file at a time. @default false */
			multiple?: boolean;
	  };

/** The unit of focus, editing, and the corners of a selection range. */
export interface CellPosition {
	/** Index into the **current row model** (post-sort, post-filter). */
	rowIndex: number;
	/** A member of `columnIds`. */
	columnId: string;
}

/**
 * Anchor and moving edge of a selection. Unordered — `start` may sit below/right of `end`; the
 * covered set is always the normalised rectangle.
 */
export interface CellRange {
	start: CellPosition;
	end: CellPosition;
}

/** One cell write. `updateData` accepts one or many and emits a single `onDataChange`. */
export interface CellUpdate {
	rowIndex: number;
	columnId: string;
	value: unknown;
}

/** What a `file` cell stores per file. */
export interface FileCellData {
	id: string;
	name: string;
	size: number;
	type: string;
	url?: string;
}

/** The cell-selection slice, as exposed for tests and consumers. */
export interface SelectionState {
	selectedCells: Set<string>;
	selectionRange: CellRange | null;
	isSelecting: boolean;
}

/** The context-menu slice: whether it is open and the viewport point it is anchored at. */
export interface ContextMenuState {
	open: boolean;
	x: number;
	y: number;
}

/** The paste-confirmation slice. `clipboardText` is carried so the dialog's Continue can replay it. */
export interface PasteDialogState {
	open: boolean;
	rowsNeeded: number;
	clipboardText: string;
}

/** The search slice, as exposed for tests and consumers. */
export interface SearchStateSnapshot {
	open: boolean;
	query: string;
	matches: CellPosition[];
	matchIndex: number;
}

/** Every move `navigateCell` understands. */
export type NavigationDirection =
	| "up"
	| "down"
	| "left"
	| "right"
	| "home"
	| "end"
	| "ctrl+up"
	| "ctrl+down"
	| "ctrl+home"
	| "ctrl+end"
	| "pageup"
	| "pagedown"
	| "pageleft"
	| "pageright";

/**
 * `meta.label` names the column in its header and the shortcuts dialog; `meta.cell` picks the cell
 * variant. Augmenting `@tanstack/table-core` makes both visible on `column.columnDef.meta`
 * everywhere without a cast, exactly as upstream's `types/data-grid.ts` does.
 */
declare module "@tanstack/table-core" {
	interface ColumnMeta<TData extends RowData, TValue> {
		/** Human label for the column — header text and the variant tooltip. */
		label?: string;
		/** Which editor this column's cells render. Absent ⇒ short text. */
		cell?: CellOpts;
		/**
		 * Never assigned, never read. An interface augmentation must repeat the upstream type
		 * parameter list verbatim (TS2428) and neither field above is generic, so the parameters
		 * are spent on a phantom member rather than silenced with a suppression.
		 */
		readonly _phantomCellVariant?: (row: TData) => TValue;
	}
}

/** A column definition carrying the grid's `meta` contract. */
export type DataGridColumnDef<TData extends RowData> = ColumnDef<TData, unknown>;

/** The uncontrolled seeds `createDataGrid` accepts. */
export interface DataGridInitialState {
	sorting?: SortingState;
	columnFilters?: ColumnFiltersState;
	rowSelection?: RowSelectionState;
	columnPinning?: ColumnPinningState;
	columnOrder?: ColumnOrderState;
	columnVisibility?: Record<string, boolean>;
}

/** Everything `createDataGrid` accepts. Every option carries its upstream JSDoc. */
export interface CreateDataGridOptions<TData extends RowData> {
	/**
	 * The rows to render. Pass a getter to keep the grid reactive to an outer `$state` array.
	 *
	 * ```ts
	 * createDataGrid({ data: () => rows, columns: () => columns })
	 * ```
	 */
	data: TData[] | (() => TData[]);
	/** The column definitions. Pass a getter when the columns themselves are reactive. */
	columns: DataGridColumnDef<TData>[] | (() => DataGridColumnDef<TData>[]);
	/** Stable row identity. Passed straight through to table-core. */
	getRowId?: (row: TData, index: number, parent?: Row<TData>) => string;
	/** Merged over the theme's `{ minSize: 60, maxSize: 800 }` defaults. */
	defaultColumn?: Partial<ColumnDef<TData, unknown>>;
	/** Seeds the uncontrolled table slices. */
	initialState?: DataGridInitialState;
	/** Controlled override; wins over every internal slice. */
	state?: Partial<TableState> | (() => Partial<TableState>);
	/**
	 * Called when data changes due to cell edits. Receives the **full** updated array — the grid
	 * never mutates the array it was given.
	 *
	 * ```ts
	 * onDataChange: (next) => { rows = next; }
	 * ```
	 */
	onDataChange?: (data: TData[]) => void;
	/**
	 * Called when adding a new row. Return the position to focus afterwards, or `null` to suppress
	 * the default focus move. May be async, for server-side row creation.
	 *
	 * ```ts
	 * onRowAdd: async () => {
	 * 	rows = [...rows, await createRow()];
	 * 	return { rowIndex: rows.length - 1, columnId: 'name' };
	 * }
	 * ```
	 */
	onRowAdd?: (
		event?: MouseEvent,
	) => Partial<CellPosition> | Promise<Partial<CellPosition> | null> | null | void;
	/**
	 * Called when a paste needs more rows than the grid has. More efficient than calling
	 * `onRowAdd` repeatedly, because it allows a single round trip.
	 */
	onRowsAdd?: (count: number) => void | Promise<void>;
	/**
	 * Called when deleting rows. Receives both the row objects and their indices. Providing it is
	 * what enables the delete affordances.
	 */
	onRowsDelete?: (rows: TData[], rowIndices: number[]) => void | Promise<void>;
	/** Awaited before `onDataChange` for a paste, so a consumer can persist first. */
	onPaste?: (updates: CellUpdate[]) => void | Promise<void>;
	/** Handles upload for a `file` cell and returns the stored file metadata. */
	onFilesUpload?: (params: {
		files: File[];
		rowIndex: number;
		columnId: string;
	}) => Promise<FileCellData[]>;
	/** Handles deletion for a `file` cell. */
	onFilesDelete?: (params: {
		fileIds: string[];
		rowIndex: number;
		columnId: string;
	}) => void | Promise<void>;
	/** Receives the resolved next sorting, never an updater. */
	onSortingChange?: (sorting: SortingState) => void;
	/** Receives the resolved next filters, never an updater. */
	onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
	/** Receives the resolved next row selection, never an updater. */
	onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
	/** Fires whenever `setRowHeight` runs. */
	onRowHeightChange?: (rowHeight: RowHeightValue) => void;
	/**
	 * The height of rows in the grid.
	 * @default "medium"
	 */
	rowHeight?: RowHeightValue;
	/**
	 * Rows rendered outside the viewport, for smoother scrolling.
	 * @default 6
	 */
	overscan?: number;
	/** Text direction. Falls back to the ambient `<DirectionProvider>` / `dir` attribute. */
	dir?: Direction;
	/**
	 * Focus a cell on mount: `true` picks the first navigable cell, an object names one exactly.
	 * @default false
	 */
	autoFocus?: boolean | Partial<CellPosition>;
	/**
	 * Collapse every selection to a single cell.
	 * @default false
	 */
	enableSingleCellSelection?: boolean;
	/**
	 * Clicking a column header selects every cell of that column.
	 * @default false
	 */
	enableColumnSelection?: boolean;
	/**
	 * Find-in-grid with Ctrl/Cmd+F.
	 * @default false
	 */
	enableSearch?: boolean;
	/**
	 * Paste from the clipboard with Ctrl/Cmd+V.
	 * @default false
	 */
	enablePaste?: boolean;
	/**
	 * Block every mutation path. Navigation, selection, copy and search stay available.
	 * @default false
	 */
	readOnly?: boolean;
}
