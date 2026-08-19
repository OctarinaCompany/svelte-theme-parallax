import ColumnHeader from "./data-table-column-header.svelte";
import DateFilter from "./data-table-date-filter.svelte";
import FacetedFilter from "./data-table-faceted-filter.svelte";
import FlexRender from "./data-table-flex-render.svelte";
import Pagination from "./data-table-pagination.svelte";
import Skeleton from "./data-table-skeleton.svelte";
import SliderFilter from "./data-table-slider-filter.svelte";
import Toolbar from "./data-table-toolbar.svelte";
import ToolbarFilter from "./data-table-toolbar-filter.svelte";
import ViewOptions from "./data-table-view-options.svelte";
import Root from "./data-table.svelte";

export type { DataTableRootProps } from "./data-table.svelte";
export type { DataTableFlexRenderProps, DataTableTemplate } from "./data-table-flex-render.svelte";
export type { DataTableColumnHeaderProps } from "./data-table-column-header.svelte";
export type { DataTableToolbarProps } from "./data-table-toolbar.svelte";
export type { DataTableToolbarFilterProps } from "./data-table-toolbar-filter.svelte";
export type { DataTableFacetedFilterProps } from "./data-table-faceted-filter.svelte";
export type { DataTableDateFilterProps } from "./data-table-date-filter.svelte";
export type { DataTableSliderFilterProps } from "./data-table-slider-filter.svelte";
export type { DataTableViewOptionsProps } from "./data-table-view-options.svelte";
export type { DataTablePaginationProps } from "./data-table-pagination.svelte";
export type { DataTableSkeletonProps } from "./data-table-skeleton.svelte";

export {
	DataTableInstance,
	DataTableState,
	createDataTable,
	getDataTableContext,
	hasDataTableContext,
	setDataTableContext,
	useDataTableInstance,
	type DataTableContext,
} from "./data-table.svelte.js";

export { dataTableConfig, type DataTableConfig } from "./data-table-config.js";

export {
	formatDate,
	fromDateValue,
	getColumnPinningStyle,
	getIsDateRange,
	getIsValidRange,
	getSliderRange,
	parseAsDate,
	parseColumnFilterValue,
	parseValuesAsNumbers,
	toDateValue,
	type DateRangeValue,
	type RangeValue,
} from "./data-table-utils.js";

export type {
	CreateDataTableOptions,
	DataTableColumnDef,
	DataTableColumnTemplate,
	DataTableIcon,
	DataTableInitialState,
	DataTableRowAction,
	ExtendedColumnSort,
	FilterVariant,
	Option,
	QueryKeys,
} from "./types.js";

export {
	Root,
	FlexRender,
	ColumnHeader,
	Toolbar,
	ToolbarFilter,
	FacetedFilter,
	DateFilter,
	SliderFilter,
	ViewOptions,
	Pagination,
	Skeleton,
	//
	Root as DataTable,
	FlexRender as DataTableFlexRender,
	ColumnHeader as DataTableColumnHeader,
	Toolbar as DataTableToolbar,
	ToolbarFilter as DataTableToolbarFilter,
	FacetedFilter as DataTableFacetedFilter,
	DateFilter as DataTableDateFilter,
	SliderFilter as DataTableSliderFilter,
	ViewOptions as DataTableViewOptions,
	Pagination as DataTablePagination,
	Skeleton as DataTableSkeleton,
};
