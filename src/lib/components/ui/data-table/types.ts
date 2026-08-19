import type {
	CellContext,
	ColumnDef,
	ColumnFiltersState,
	ColumnOrderState,
	ColumnPinningState,
	ColumnSort,
	HeaderContext,
	InitialTableState,
	PaginationState,
	Row,
	RowData,
	RowSelectionState,
	SortingState,
	TableOptions,
	TableState,
	VisibilityState,
} from "@tanstack/table-core";
import type { Component, Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

import type { WithoutChildren } from "$lib/utils.js";

import type { DataTableConfig } from "./data-table-config.js";

/**
 * The attribute surface a filter part spreads onto the control it renders.
 *
 * Two attributes are dropped from `HTMLAttributes` rather than forwarded: `title`, because it is a
 * *prop* of every filter part (the trigger's label) and would otherwise collide, and `id`, which
 * `svelte/elements` types `string | null` where the bits-ui primitives underneath accept only
 * `string | undefined` — so it is re-declared narrowly instead.
 */
export type DataTableFilterAttributes = Omit<
	WithoutChildren<HTMLAttributes<HTMLElement>>,
	"id" | "title"
> & {
	id?: string;
};

/**
 * An icon component — a `@lucide/svelte` icon, or any Svelte component that renders an `<svg>`.
 *
 * Upstream types this `React.FC<React.SVGProps<SVGSVGElement>>`. Typing it against Svelte's
 * `SVGAttributes` would *reject* every `@lucide/svelte` icon, because Svelte's SVG attribute types
 * allow `null` where lucide's own props do not. Requiring only `class` accepts both and is all the
 * component set ever passes.
 */
export type DataTableIcon = Component<{ class?: string }>;

/**
 * `label` / `variant` / `options` / `range` / `unit` / `icon` / `placeholder` on a column's `meta`
 * are what every toolbar surface reads. Augmenting `@tanstack/table-core` (rather than
 * `@tanstack/react-table`, which this theme does not depend on) makes the fields visible on
 * `column.columnDef.meta` everywhere, exactly as upstream's `docs/types/data-table.ts` does.
 */
declare module "@tanstack/table-core" {
	interface TableMeta<TData extends RowData> {
		/**
		 * Upstream persists table state to the URL with `nuqs` and threads the query-string keys
		 * through here. This theme owns its state instead, so nothing reads this field; it is
		 * retained so consumer code keeps type-checking.
		 */
		queryKeys?: QueryKeys;
		/**
		 * Never assigned, never read. An interface augmentation must repeat the upstream type
		 * parameter list *verbatim* (TS2428), and neither field above is generic — upstream
		 * silences the resulting "unused type parameter" with a `biome-ignore`, which this repo's
		 * zero-suppression rule forbids, so the parameter is spent on a phantom member instead.
		 */
		readonly _phantomRow?: (row: TData) => never;
	}

	interface ColumnMeta<TData extends RowData, TValue> {
		/** Human label for the column — header text, filter title and the View list entry. */
		label?: string;
		/** Placeholder for the `text` / `number` filter inputs. Falls back to {@link label}. */
		placeholder?: string;
		/** Which filter control the toolbar renders. Absent ⇒ no control at all. */
		variant?: FilterVariant;
		/** Options for the `select` / `multiSelect` variants. */
		options?: Option[];
		/** `[min, max]` bounds for the `range` variant, overriding the faceted min/max. */
		range?: [number, number];
		/** Unit suffix rendered inside the `number` and `range` controls, e.g. `"hrs"`. */
		unit?: string;
		/** Icon rendered beside the column, as a Svelte component. */
		icon?: DataTableIcon;
		/** Never assigned, never read — see `TableMeta._phantomRow` above. */
		readonly _phantomCell?: (row: TData, value: TValue) => never;
	}
}

/**
 * The five query-string keys upstream's `nuqs` integration used. Retained for API-shape parity —
 * nothing in this theme reads them.
 */
export interface QueryKeys {
	page: string;
	perPage: string;
	sort: string;
	filters: string;
	joinOperator: string;
}

/** One selectable value of a `select` / `multiSelect` column filter. */
export interface Option {
	/** Rendered text, and what the trigger badge shows. */
	label: string;
	/** What lands in `columnFilters[].value`. */
	value: string;
	/** Occurrence count, right-aligned in the list. Rendered only when truthy. */
	count?: number;
	/** Optional leading icon. */
	icon?: DataTableIcon;
}

/** `text | number | range | date | dateRange | boolean | select | multiSelect`. */
export type FilterVariant = DataTableConfig["filterVariants"][number];

/**
 * A column template. React's `flexRender()` accepts a component or a string; the Svelte
 * equivalent is a string or a {@link Snippet} rendered by `DataTable.FlexRender`.
 */
export type DataTableColumnTemplate<TContext extends object> = string | Snippet<[TContext]>;

/**
 * `@tanstack/table-core`'s `ColumnDef` with `header` and `cell` narrowed to a string or a Svelte
 * snippet. The intersection keeps every discriminated member of the upstream union — so
 * `accessorKey`, `accessorFn`, `id` and `columns` behave exactly as they do upstream — while
 * making the template fields read back as something `DataTable.FlexRender` can `{@render}`.
 */
export type DataTableColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<
	TData,
	TValue
> & {
	/** Header template. Absent ⇒ `DataTable.FlexRender` falls back to `column.id`. */
	header?: DataTableColumnTemplate<HeaderContext<TData, TValue>>;
	/** Cell template. Absent ⇒ falls back to the stringified cell value. */
	cell?: DataTableColumnTemplate<CellContext<TData, TValue>>;
};

/** A sort entry whose `id` is constrained to a key of the row type. */
export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
	id: Extract<keyof TData, string>;
}

/** A row-level action a consumer's cell template dispatches, e.g. from a row dropdown. */
export interface DataTableRowAction<TData> {
	row: Row<TData>;
	variant: "update" | "delete";
}

/** `InitialTableState` with `sorting` constrained to keys of the row type. */
export type DataTableInitialState<TData> = Omit<InitialTableState, "sorting"> & {
	sorting?: ExtendedColumnSort<TData>[];
};

/**
 * Options accepted by `createDataTable`. Everything `@tanstack/table-core`'s `TableOptions`
 * offers is available except the members this theme owns: the row models, the seven state slices'
 * change handlers, `state`, `initialState`, `data`, `columns` and `pageCount` are all re-declared
 * below, and `onStateChange` / `renderFallbackValue` are supplied internally.
 *
 * Upstream's nuqs-only options (`queryKeys`, `history`, `debounceMs`, `throttleMs`,
 * `clearOnDefault`, `scroll`, `shallow`, `startTransition`, `enableAdvancedFilter`) are dropped.
 */
export type CreateDataTableOptions<TData extends RowData> = Omit<
	TableOptions<TData>,
	| "columns"
	| "data"
	| "defaultColumn"
	| "getCoreRowModel"
	| "getFacetedMinMaxValues"
	| "getFacetedRowModel"
	| "getFacetedUniqueValues"
	| "getFilteredRowModel"
	| "getPaginationRowModel"
	| "getSortedRowModel"
	| "initialState"
	| "onColumnFiltersChange"
	| "onColumnOrderChange"
	| "onColumnPinningChange"
	| "onColumnVisibilityChange"
	| "onPaginationChange"
	| "onRowSelectionChange"
	| "onSortingChange"
	| "onStateChange"
	| "pageCount"
	| "renderFallbackValue"
	| "state"
> & {
	/** The rows. Pass a getter to keep them reactive. */
	data: TData[] | (() => TData[]);
	/** The column definitions. Pass a getter to keep them reactive. */
	columns: DataTableColumnDef<TData>[] | (() => DataTableColumnDef<TData>[]);
	/**
	 * Total page count for server-driven pagination. `-1` lets `table-core` derive it.
	 * @default -1
	 */
	pageCount?: number;
	/** Seeds the seven state slices. `sorting` is typed against the row's keys. */
	initialState?: DataTableInitialState<TData>;
	/**
	 * Fully controlled state, merged over the internal slices. Pass a getter to keep it reactive.
	 */
	state?: Partial<TableState> | (() => Partial<TableState>);
	/**
	 * Defaults merged into every column definition. `enableColumnFilter` is forced to `false`
	 * afterwards, matching upstream.
	 */
	defaultColumn?: Partial<DataTableColumnDef<TData>>;
	/** Called with the resolved next sorting state. */
	onSortingChange?: (sorting: SortingState) => void;
	/** Called with the resolved next column-filter state. */
	onColumnFiltersChange?: (columnFilters: ColumnFiltersState) => void;
	/** Called with the resolved next pagination state. */
	onPaginationChange?: (pagination: PaginationState) => void;
	/** Called with the resolved next row-selection state. */
	onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
	/** Called with the resolved next column-visibility state. */
	onColumnVisibilityChange?: (columnVisibility: VisibilityState) => void;
	/** Called with the resolved next column-pinning state. */
	onColumnPinningChange?: (columnPinning: ColumnPinningState) => void;
	/** Called with the resolved next column-order state. */
	onColumnOrderChange?: (columnOrder: ColumnOrderState) => void;
};
