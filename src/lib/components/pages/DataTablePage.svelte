<script lang="ts">
	import type {
		CellContext,
		Header,
		HeaderContext,
		Row,
		Table as TanstackTable,
	} from "@tanstack/table-core";
	import { functionalUpdate, getExpandedRowModel } from "@tanstack/table-core";
	import type { ExpandedState, RowPinningState } from "@tanstack/table-core";
	import { toast } from "svelte-sonner";
	import type { Snippet } from "svelte";
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import ChartColumnIcon from "@lucide/svelte/icons/chart-column";
	import CheckCircle2Icon from "@lucide/svelte/icons/check-circle-2";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
	import CircleDashedIcon from "@lucide/svelte/icons/circle-dashed";
	import CloudDownloadIcon from "@lucide/svelte/icons/cloud-download";
	import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
	import EyeIcon from "@lucide/svelte/icons/eye";
	import EyeOffIcon from "@lucide/svelte/icons/eye-off";
	import FunnelIcon from "@lucide/svelte/icons/funnel";
	import GripVerticalIcon from "@lucide/svelte/icons/grip-vertical";
	import MapPinIcon from "@lucide/svelte/icons/map-pin";
	import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import PinIcon from "@lucide/svelte/icons/pin";
	import PinOffIcon from "@lucide/svelte/icons/pin-off";
	import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
	import SearchIcon from "@lucide/svelte/icons/search";
	import TableIcon from "@lucide/svelte/icons/table";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import UserPlusIcon from "@lucide/svelte/icons/user-plus";
	import XIcon from "@lucide/svelte/icons/x";
	import XCircleIcon from "@lucide/svelte/icons/x-circle";

	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import * as DataTable from "$lib/components/ui/data-table/index.js";
	import {
		createDataTable,
		getColumnPinningStyle,
		type DataTableColumnDef,
		type DataTableState,
	} from "$lib/components/ui/data-table/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import * as Sortable from "$lib/components/ui/sortable/index.js";
	import type {
		SortableContentChildProps,
		SortableItemChildProps,
		SortableItemHandleChildProps,
	} from "$lib/components/ui/sortable/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DataGridOrderItems, {
		type DataGridOrderItem,
	} from "$lib/components/pages/data-grid-order-items.svelte";
	import { getInitials } from "$lib/shared/get-initials.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The Data table component page.
	 *
	 * SAME INHERITANCE AS THE DATA GRID: every cell goes through the `table-head`/`table-cell`
	 * slots `app.css` already restyles, so the classic theme's 1rem density and uppercase head row apply
	 * without this page asking for them.
	 *
	 * What this component adds over the grid is the surrounding furniture — toolbar, faceted
	 * filters, view options, pagination — and all of it is built from Button, Input, Select and
	 * Popover, each of which is already themed. The result is that the most classic-theme-shaped
	 * component in the whole batch needed the least work.
	 *
	 * On `@tanstack/table-core` 8, alongside the Dashboard example's 9. See the Data grid page.
	 */

	type Project = {
		id: string;
		title: string;
		status: "active" | "paused" | "inactive";
		priority: "low" | "medium" | "high";
		budget: number;
		effort: number;
		startedAt: number;
		dueAt: number;
	};

	function day(month: number, date: number): number {
		return new Date(2024, month - 1, date).getTime();
	}

	const projects: Project[] = [
		{
			id: "1",
			title: "Project Alpha",
			status: "active",
			priority: "high",
			budget: 50000,
			effort: 12,
			startedAt: day(1, 8),
			dueAt: day(4, 30),
		},
		{
			id: "2",
			title: "Project Beta",
			status: "inactive",
			priority: "low",
			budget: 75000,
			effort: 30,
			startedAt: day(2, 12),
			dueAt: day(6, 14),
		},
		{
			id: "3",
			title: "Project Gamma",
			status: "active",
			priority: "medium",
			budget: 25000,
			effort: 6,
			startedAt: day(3, 3),
			dueAt: day(5, 20),
		},
		{
			id: "4",
			title: "Project Delta",
			status: "paused",
			priority: "high",
			budget: 100000,
			effort: 44,
			startedAt: day(3, 21),
			dueAt: day(9, 1),
		},
		{
			id: "5",
			title: "Project Epsilon",
			status: "active",
			priority: "low",
			budget: 18000,
			effort: 3,
			startedAt: day(4, 2),
			dueAt: day(7, 11),
		},
		{
			id: "6",
			title: "Project Zeta",
			status: "inactive",
			priority: "medium",
			budget: 62000,
			effort: 21,
			startedAt: day(5, 9),
			dueAt: day(8, 25),
		},
	];

	const statusOptions = [
		{ label: "Active", value: "active", icon: CheckCircle2Icon, count: 3 },
		{ label: "Paused", value: "paused", icon: CircleDashedIcon, count: 1 },
		{ label: "Inactive", value: "inactive", icon: XCircleIcon, count: 2 },
	];

	const priorityOptions = [
		{ label: "Low", value: "low", icon: ArrowDownIcon, count: 2 },
		{ label: "Medium", value: "medium", icon: ArrowRightIcon, count: 2 },
		{ label: "High", value: "high", icon: ArrowUpIcon, count: 2 },
	];

	const statusIcons = {
		active: CheckCircle2Icon,
		paused: CircleDashedIcon,
		inactive: XCircleIcon,
	};

	const priorityIcons = {
		low: ArrowDownIcon,
		medium: ArrowRightIcon,
		high: ArrowUpIcon,
	};

	// --- Example 1: browse, sort and page --------------------------------------

	const basicColumns: DataTableColumnDef<Project>[] = [
		{
			id: "title",
			accessorKey: "title",
			header: titleHeader,
			meta: { label: "Title" },
		},
		{
			id: "status",
			accessorKey: "status",
			header: statusHeader,
			cell: statusCell,
			meta: { label: "Status" },
		},
		{
			id: "budget",
			accessorKey: "budget",
			header: budgetHeader,
			cell: budgetCell,
			meta: { label: "Budget" },
		},
	];

	const basic = createDataTable<Project>({
		data: () => projects,
		columns: () => basicColumns,
		getRowId: (row) => row.id,
		initialState: { sorting: [{ id: "title", desc: false }], pagination: { pageSize: 3 } },
	});

	// --- Example 2: plain sortable headers ---------------------------------------

	// Upstream ships no dropdown-free header demo; this is the classic shadcn/ui data-table
	// recipe — a ghost button in the header snippet that cycles the sort — composed in the page
	// only, so the column header part stays untouched.
	const plainColumns: DataTableColumnDef<Project>[] = [
		{
			id: "title",
			accessorKey: "title",
			header: plainSortHeader,
			meta: { label: "Title" },
		},
		{
			id: "status",
			accessorKey: "status",
			header: plainSortHeader,
			cell: statusCell,
			meta: { label: "Status" },
		},
		{
			id: "budget",
			accessorKey: "budget",
			header: plainSortHeader,
			cell: budgetCell,
			meta: { label: "Budget" },
		},
	];

	const plain = createDataTable<Project>({
		data: () => projects,
		columns: () => plainColumns,
		getRowId: (row) => row.id,
		initialState: { sorting: [{ id: "title", desc: false }], pagination: { pageSize: 3 } },
	});

	// --- Example 3: filter, hide columns and select rows ------------------------

	const toolbarColumns: DataTableColumnDef<Project>[] = [
		{
			id: "select",
			header: selectHeader,
			cell: selectCell,
			size: 32,
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "title",
			accessorKey: "title",
			header: titleHeader,
			enableColumnFilter: true,
			meta: { label: "Title", placeholder: "Search titles...", variant: "text" },
		},
		{
			id: "status",
			accessorKey: "status",
			header: statusHeader,
			cell: statusCell,
			enableColumnFilter: true,
			filterFn: (row, columnId, filterValue) =>
				Array.isArray(filterValue) && filterValue.includes(row.getValue(columnId)),
			meta: { label: "Status", variant: "multiSelect", options: statusOptions },
		},
		{
			id: "priority",
			accessorKey: "priority",
			header: priorityHeader,
			cell: priorityCell,
			enableColumnFilter: true,
			filterFn: (row, columnId, filterValue) =>
				Array.isArray(filterValue) && filterValue.includes(row.getValue(columnId)),
			meta: { label: "Priority", variant: "select", options: priorityOptions },
		},
		{
			id: "budget",
			accessorKey: "budget",
			header: budgetHeader,
			cell: budgetCell,
			enableColumnFilter: true,
			// The `number` variant writes the raw input string, so the comparison is stringified.
			filterFn: (row, columnId, filterValue) =>
				filterValue === "" || String(row.getValue(columnId)) === String(filterValue),
			meta: { label: "Budget", placeholder: "Budget", variant: "number", unit: "USD" },
		},
	];

	const withToolbar = createDataTable<Project>({
		data: () => projects,
		columns: () => toolbarColumns,
		getRowId: (row) => row.id,
		initialState: { pagination: { pageSize: 4 } },
	});

	// --- Example 4: search with match highlighting -------------------------------

	// Upstream ships no highlighting demo. Composed in the page only — the toolbar's text input and
	// the column's `filterFn` are untouched; the highlight is purely a `cell` snippet, so nothing
	// about it needs to live in the component.
	type Segment = { text: string; match: boolean };

	/**
	 * Splits `text` around every case-insensitive occurrence of `query`.
	 *
	 * An `indexOf` loop rather than a regex, so a query of `(` or `\` matches literally instead of
	 * throwing out of `new RegExp()`. Segments are sliced from the original string, which keeps the
	 * rendered casing; rendering them through the template rather than `{@html}` keeps cell data
	 * inert.
	 */
	function splitOnQuery(text: string, query: string): Segment[] {
		const needle = query.trim().toLowerCase();
		if (!needle) return [{ text, match: false }];
		const haystack = text.toLowerCase();
		// `toLowerCase` is not length-preserving for every character ('İ' becomes 'i' + U+0307), and
		// these are haystack indices sliced out of `text`. When the fold shifts them, no highlight
		// beats a misplaced one.
		if (haystack.length !== text.length) return [{ text, match: false }];
		const segments: Segment[] = [];
		let from = 0;
		let at = haystack.indexOf(needle);
		while (at !== -1) {
			if (at > from) segments.push({ text: text.slice(from, at), match: false });
			segments.push({ text: text.slice(at, at + needle.length), match: true });
			from = at + needle.length;
			at = haystack.indexOf(needle, from);
		}
		if (from < text.length) segments.push({ text: text.slice(from), match: false });
		return segments;
	}

	const searchColumns: DataTableColumnDef<Project>[] = [
		{
			id: "title",
			accessorKey: "title",
			header: titleHeader,
			cell: highlightedTitleCell,
			enableColumnFilter: true,
			meta: { label: "Title", placeholder: "Search titles...", variant: "text" },
		},
		{
			id: "status",
			accessorKey: "status",
			header: statusHeader,
			cell: statusCell,
			meta: { label: "Status" },
		},
		{
			id: "budget",
			accessorKey: "budget",
			header: budgetHeader,
			cell: budgetCell,
			meta: { label: "Budget" },
		},
	];

	const search = createDataTable<Project>({
		data: () => projects,
		columns: () => searchColumns,
		getRowId: (row) => row.id,
		initialState: { pagination: { pageSize: 4 } },
	});

	// The *applied* filter drives the highlight — the same value the column's `filterFn` reads — so
	// the marks can never disagree with the rows that survived.
	const searchQuery = $derived.by(() => {
		const value = search.table.getColumn("title")?.getFilterValue();
		return typeof value === "string" ? value : "";
	});

	// --- Example 5: range and date filters, pinning and reordering ---------------

	const advancedColumns: DataTableColumnDef<Project>[] = [
		{
			id: "title",
			accessorKey: "title",
			header: titleHeader,
			enableColumnFilter: true,
			meta: { label: "Title", placeholder: "Search titles...", variant: "text" },
		},
		{
			id: "effort",
			accessorKey: "effort",
			header: effortHeader,
			cell: effortCell,
			enableColumnFilter: true,
			filterFn: "inNumberRange",
			meta: { label: "Effort", variant: "range", range: [0, 50], unit: "d" },
		},
		{
			id: "startedAt",
			accessorKey: "startedAt",
			header: startedHeader,
			cell: startedCell,
			enableColumnFilter: true,
			filterFn: (row, columnId, filterValue) =>
				typeof filterValue !== "number" || row.getValue(columnId) === filterValue,
			meta: { label: "Started", variant: "date" },
		},
		{
			id: "dueAt",
			accessorKey: "dueAt",
			header: dueHeader,
			cell: dueCell,
			enableColumnFilter: true,
			filterFn: (row, columnId, filterValue) => {
				if (!Array.isArray(filterValue)) return true;
				const value = Number(row.getValue(columnId));
				const [from, to] = filterValue;
				if (typeof from === "number" && value < from) return false;
				if (typeof to === "number" && value > to) return false;
				return true;
			},
			meta: { label: "Due", variant: "dateRange" },
		},
		{
			id: "actions",
			header: actionsHeader,
			cell: actionsCell,
			size: 48,
			enableSorting: false,
			enableHiding: false,
		},
	];

	const advanced = createDataTable<Project>({
		data: () => projects,
		columns: () => advancedColumns,
		getRowId: (row) => row.id,
		initialState: {
			columnPinning: { right: ["actions"] },
			pagination: { pageSize: 4 },
		},
	});

	// --- Example 6: selectable rows with a numbered pager -------------------------

	// Mirrors the demo set's numbered-pager table, minus its search input: checkbox selection,
	// status badges, a row
	// actions menu and a numbered pager with a per-page count. `DataTable.Root` always renders the
	// shared `DataTable.Pagination` footer, so this composes `Table.Root` and `DataTable.FlexRender`
	// directly — the same pieces `data-table.svelte` renders internally — to swap in the numbered
	// footer without touching the shared component.
	type OrderStatus = "completed" | "processing" | "pending" | "cancelled";

	type Order = {
		id: string;
		name: string;
		date: string;
		status: OrderStatus;
		amount: number;
	};

	const orders: Order[] = [
		{ id: "1", name: "Project Alpha", date: "Jan 15, 2024", status: "completed", amount: 2500 },
		{ id: "2", name: "Website Redesign", date: "Feb 3, 2024", status: "processing", amount: 4200 },
		{ id: "3", name: "Mobile App MVP", date: "Feb 18, 2024", status: "pending", amount: 8750 },
		{ id: "4", name: "Brand Identity", date: "Mar 5, 2024", status: "completed", amount: 1800 },
		{
			id: "5",
			name: "Marketing Campaign",
			date: "Mar 22, 2024",
			status: "cancelled",
			amount: 3400,
		},
		{
			id: "6",
			name: "Analytics Dashboard",
			date: "Apr 8, 2024",
			status: "processing",
			amount: 5600,
		},
		{
			id: "7",
			name: "E-commerce Platform",
			date: "Apr 25, 2024",
			status: "pending",
			amount: 12000,
		},
		{ id: "8", name: "API Integration", date: "May 10, 2024", status: "completed", amount: 3200 },
	];

	// Upstream's emerald/amber/blue/rose classes, mapped onto the Badge's own `{state}-subtle`
	// variants — the opaque `-subtle` ground IS the classic theme's status pill, where an earlier version
	// hand-rolled a `/15` wash beside it. "Cancelled" reads as a failure state, so it takes
	// `destructive` rather than the meaningless decorative `rose` hue.
	const orderStatusConfig: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
		completed: { label: "Completed", variant: "success-subtle" },
		processing: { label: "Processing", variant: "info-subtle" },
		pending: { label: "Pending", variant: "warning-subtle" },
		cancelled: { label: "Cancelled", variant: "destructive-subtle" },
	};

	const orderPageSizeOptions = [5, 10, 20];

	const ordersColumns: DataTableColumnDef<Order>[] = [
		{
			id: "select",
			header: orderSelectHeader,
			cell: orderSelectCell,
			size: 32,
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "name",
			accessorKey: "name",
			header: "Name",
			cell: orderNameCell,
		},
		{
			id: "date",
			accessorKey: "date",
			header: "Date",
		},
		{
			id: "status",
			accessorKey: "status",
			header: "Status",
			cell: orderStatusCell,
		},
		{
			id: "amount",
			accessorKey: "amount",
			header: orderAmountHeader,
			cell: orderAmountCell,
		},
		{
			id: "actions",
			// Blank, like upstream's header-less actions column — `DataTable.FlexRender` would
			// otherwise fall back to the column id ("actions") as visible text.
			header: "",
			cell: orderActionsCell,
			size: 32,
			enableSorting: false,
			enableHiding: false,
		},
	];

	const ordersTable = createDataTable<Order>({
		data: () => orders,
		columns: () => ordersColumns,
		getRowId: (row) => row.id,
		initialState: { pagination: { pageSize: 5 } },
	});

	// --- Props tables ------------------------------------------------------------

	const createOptions = [
		{
			prop: "data",
			type: "TData[] | (() => TData[])",
			default: "—",
			description: "The rows. Pass a getter to keep them reactive.",
		},
		{
			prop: "columns",
			type: "DataTableColumnDef<TData>[] | (() => …)",
			default: "—",
			description: "The column definitions. `header` and `cell` are strings or snippets.",
		},
		{
			prop: "pageCount",
			type: "number",
			default: "-1",
			description: "Total pages for server-driven paging. `-1` lets the table derive it.",
		},
		{
			prop: "initialState",
			type: "DataTableInitialState<TData>",
			default: "{}",
			description: "Seeds the seven state slices.",
		},
		{
			prop: "state",
			type: "Partial<TableState> | (() => …)",
			default: "undefined",
			description: "Fully controlled state, merged last — the caller becomes authoritative.",
		},
		{
			prop: "getRowId",
			type: "(row, index, parent?) => string",
			default: "undefined",
			description: "Stable row identity; row selection is keyed by it.",
		},
		{
			prop: "enableRowSelection",
			type: "boolean | ((row) => boolean)",
			default: "true",
			description: "Whether rows can be selected, optionally per row.",
		},
		{
			prop: "manualPagination / manualSorting / manualFiltering",
			type: "boolean",
			default: "false",
			description: "Hand paging, sorting or filtering to the server instead.",
		},
		{
			prop: "on*Change",
			type: "(value) => void",
			default: "undefined",
			description:
				"One per slice — sorting, columnFilters, pagination, rowSelection, columnVisibility, columnPinning, columnOrder. Called with the resolved next value.",
		},
	];

	const rootProps = [
		{
			prop: "table",
			type: "Table<TData>",
			default: "—",
			description: "Required. Also published to context for the toolbar and pagination.",
		},
		{
			prop: "actionBar",
			type: "Snippet",
			default: "—",
			description: "Rendered only while at least one filtered row is selected.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Rendered above the table — where the toolbar goes.",
		},
	];

	const partProps = [
		{
			part: "DataTable.Toolbar",
			prop: "table",
			type: "Table<TData>",
			default: "context",
			description: "One filter per filterable column, plus Reset filters and the View menu.",
		},
		{
			part: "DataTable.ColumnHeader",
			prop: "column, label",
			type: "Column<TData, TValue>, string",
			default: "—",
			description: "Sort/hide menu, or plain text when the column allows neither.",
		},
		{
			part: "DataTable.FacetedFilter",
			prop: "options, multiple, open",
			type: "Option[], boolean, boolean",
			default: "—, false, false",
			description: "Command-palette facet with badge summary. `open` is bindable.",
		},
		{
			part: "DataTable.SliderFilter",
			prop: "column, title, open",
			type: "Column<TData>, string, boolean",
			default: "—, —, false",
			description: "Two-thumb range with paired numeric inputs and a unit suffix.",
		},
		{
			part: "DataTable.DateFilter",
			prop: "column, title, multiple, open",
			type: "Column<TData>, string, boolean, boolean",
			default: "—, —, false, false",
			description: "Calendar popover. The filter value stays epoch milliseconds.",
		},
		{
			part: "DataTable.ViewOptions",
			prop: "disabled, reorderable, align, open",
			type: 'boolean, boolean, "start" | "center" | "end", boolean',
			default: 'false, false, "end", false',
			description:
				'Column visibility list; `reorderable` adds drag-to-reorder. A "Reset columns" row appears at the foot of the list once the view differs from `initialState`.',
		},
		{
			part: "DataTable.Pagination",
			prop: "table, pageSizeOptions",
			type: "Table<TData>, number[]",
			default: "context, [10, 20, 30, 40, 50]",
			description: "Page-size select, page summary and four labelled paging buttons.",
		},
		{
			part: "DataTable.Skeleton",
			prop: "columnCount, rowCount, filterCount, cellWidths",
			type: "number, number, number, string[]",
			default: '—, 10, 0, ["auto"]',
			description: "Loading placeholder with no live data and no interactive controls.",
		},
	];

	const dataAttributes = [
		{ part: "Root", attribute: "data-slot", value: '"data-table"' },
		{ part: "Body row", attribute: "data-state", value: '"selected" while the row is selected.' },
		{ part: "Header / body cell", attribute: "data-pinned", value: '"left" | "right"' },
		{
			part: "Header / body cell",
			attribute: "data-pinned-edge",
			value: "Present on the last left-pinned and first right-pinned column.",
		},
		{ part: "Toolbar", attribute: "data-filtered", value: "Present while a filter is applied." },
		{ part: "ColumnHeader", attribute: "data-sorted", value: '"asc" | "desc"' },
		{
			part: "FacetedFilter / DateFilter",
			attribute: "data-multiple",
			value: "Present when multiple.",
		},
		{
			part: "FacetedFilter / DateFilter / SliderFilter",
			attribute: "data-selected",
			value: "Present while the filter holds a value.",
		},
		{ part: "ViewOptions", attribute: "data-reorderable", value: "Present when reorderable." },
		{ part: "Pagination", attribute: "data-dir", value: '"ltr" | "rtl"' },
		{ part: "Skeleton", attribute: "data-loading", value: "Always present." },
	];

	// =============================================================================================
	// The data grid demo set (demo 1 .. demo 18).
	//
	// MOVED FROM THE DATA GRID PAGE. These demos are not what that page documents:
	// `ui/data-grid` is a spreadsheet — virtualized, cell-addressed, editable — where
	// this set is the shadcn table pattern this page is about: one `@tanstack/table-core`
	// instance rendered as a real `<table>`, a pagination bar under it, and a `tableLayout` object
	// of presentation switches. So its demos live here, assembled from the house parts that already
	// say that: `createDataTable` for the state (the same
	// `src/lib/shared/tanstack-table-bridge.svelte.ts` the data grid rides on), `Table.*` for the
	// markup, and `DataTable.ColumnHeader` / `DataTable.FlexRender` / `DataTable.Pagination` for
	// the furniture. Nothing here re-implements a grid.
	//
	// ONLY THE DEMOS SHOWING SOMETHING THE SECTIONS ABOVE DO NOT made the move. The pagination,
	// sorting, row-selection and column-visibility baselines and the pure `tableLayout` looks
	// (cell border, dense, striped, borderless, auto width, column icons, card container) were
	// dropped as duplicates rather than ported — `gridTable` below keeps their switches, which is
	// what documents them.
	//
	// THREE STANDING SUBSTITUTIONS, the same ones the Filters page records for the same upstream:
	//
	// 1. NO REMOTE IMAGES. Upstream loads ten stock portraits and one `flagcdn.com` SVG per row.
	//    This repository ships no images and fetches none, so avatars fall back to initials and the
	//    Location column keeps the country name behind a map-pin icon.
	// 2. NO RAW PALETTE COLOURS. The availability dot is `--success` / `--warning` /
	//    `--destructive` / `--muted-foreground`, never `bg-green-500` and friends.
	// 3. BADGE VARIANTS. Outline and light status variants all land on this repository's soft
	//    family — `success-subtle`, `warning-subtle`, `primary-subtle`.
	//
	// The classic theme's own table rules apply on top and are not fought: `app.css` sets 1rem cell padding
	// and an uppercase, page-ground head row on `[data-slot='table-head']` / `[data-slot='table-cell']`
	// UNLAYERED. So a bare, unfilled header row is already the resting state here.
	// =============================================================================================

	type TeamMember = {
		id: string;
		name: string;
		email: string;
		availability: "online" | "away" | "busy" | "offline";
		status: "active" | "inactive";
		company: string;
		role: string;
		joined: string;
		location: string;
		balance: number;
	};

	const TEAM_NAMES = [
		"Alex Johnson",
		"Sarah Chen",
		"Michael Rodriguez",
		"Emma Wilson",
		"David Kim",
		"Aron Thompson",
		"James Brown",
		"Maria Garcia",
		"Nick Johnson",
		"Liam Thompson",
	] as const;

	const TEAM_AVAILABILITIES = ["online", "away", "busy", "offline"] as const;

	const TEAM_COMPANIES = [
		"Apple",
		"OpenAI",
		"Meta",
		"Tesla",
		"SAP",
		"Siemens",
		"BBVA",
		"Sony",
		"LVMH",
		"ENI",
	] as const;

	const TEAM_ROLES = [
		"CEO",
		"CTO",
		"Designer",
		"Developer",
		"Lawyer",
		"Director",
		"Product Manager",
		"Marketing Lead",
		"Data Scientist",
		"Engineer",
	] as const;

	const TEAM_LOCATIONS = [
		"United States",
		"United Kingdom",
		"Canada",
		"Australia",
		"Germany",
		"Malaysia",
		"Spain",
		"Japan",
		"France",
		"Italy",
	] as const;

	/**
	 * The ten rows every data-grid demo shares, derived rather than listed —
	 * availability cycles every four rows, status alternates, and the balance climbs $100 a row.
	 */
	const teamMembers: TeamMember[] = TEAM_NAMES.map((name, index) => ({
		id: String(index + 1),
		name,
		email: `${name.split(" ")[0]!.toLowerCase()}@example.com`,
		availability: TEAM_AVAILABILITIES[index % 4]!,
		status: index % 2 === 0 ? "active" : "inactive",
		company: TEAM_COMPANIES[index % 10]!,
		role: TEAM_ROLES[index % 10]!,
		joined: "Jan, 2024",
		location: TEAM_LOCATIONS[index % 10]!,
		balance: 5143.03 + index * 100,
	}));

	const usdFormat = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	});

	/**
	 * The layout switches the house `Table` parts can actually
	 * honour. Everything here is layout or rules — nothing paints.
	 */
	type GridLook = {
		/** `cellBorder` — vertical rules between cells. */
		cellBorder?: boolean;
		/** `dense` — the table's `sm` density tier (40px rows, 13px body type). */
		dense?: boolean;
		/** `stripped` — alternating row ground. */
		striped?: boolean;
		/** `rowBorder` — horizontal rules between rows. @default true */
		rowBorder?: boolean;
		/** `rowRounded` — round the row's leading and trailing cell. */
		rowRounded?: boolean;
		/** The rounded border frame around the whole grid. @default true */
		framed?: boolean;
		/** `width: 'auto'` — columns sized by content instead of by `column.getSize()`. */
		autoWidth?: boolean;
		/** `columnsResizable` — a drag handle on the trailing edge of every resizable header. */
		resizable?: boolean;
		/** `columnsPinnable` — sticky offsets and widths from the shared pinning helper. */
		pinned?: boolean;
		/** `headerSticky` — caps the scroller and sticks the head row to its top. */
		stickyHeader?: boolean;
	};

	type GridTableArgs = {
		/** The table state driving this section. */
		grid: DataTableState<TeamMember>;
		look?: GridLook;
		/** Rendered in a full-width row under an expanded row. */
		rowDetail?: Snippet<[Row<TeamMember>]>;
		/** Whether {@link rowDetail} is showing for a given row. */
		isRowExpanded?: (row: Row<TeamMember>) => boolean;
	};

	/** The column order as table-core currently resolves it — explicit when set, natural otherwise. */
	function getResolvedColumnOrder(table: TanstackTable<TeamMember>): string[] {
		const explicit = table.getState().columnOrder;
		return explicit.length > 0 ? [...explicit] : table.getAllLeafColumns().map(({ id }) => id);
	}

	/** Whether a column can travel `delta` places — what disables the two menu entries. */
	function getCanMoveColumn(
		table: TanstackTable<TeamMember>,
		columnId: string,
		delta: number,
	): boolean {
		const order = getResolvedColumnOrder(table);
		const index = order.indexOf(columnId);
		const next = index + delta;
		return index >= 0 && next >= 0 && next < order.length;
	}

	/**
	 * The column-move menu entries: swap a column with its neighbour. Writing the resolved
	 * order back — rather than a sparse one — keeps the first move from reordering everything else.
	 */
	function moveColumn(table: TanstackTable<TeamMember>, columnId: string, delta: number): void {
		if (!getCanMoveColumn(table, columnId, delta)) return;
		const order = getResolvedColumnOrder(table);
		const index = order.indexOf(columnId);
		const next = index + delta;
		[order[index], order[next]] = [order[next]!, order[index]!];
		table.setColumnOrder(order);
	}

	// Shared with the Data grid page, which keeps its own copy for the trick generator.
	/**
	 * Upstream generates its thirty rows with faker, in the browser. This page is prerendered, so
	 * the same rows have to come out on the server and on the client — hence a seeded generator
	 * rather than `Math.random()`, which would hydrate into a mismatch.
	 */
	function createRandom(seed: number): () => number {
		let current = seed;
		return () => {
			current = (current + 0x6d2b79f5) | 0;
			let t = Math.imul(current ^ (current >>> 15), 1 | current);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	// --- Expandable rows ----------------------------------------------------------------------

	/**
	 * Upstream drives this from table-core's `expanded` slice and `getRowCanExpand`. `createDataTable`
	 * registers no expanded row model — the disclosure is one boolean per row id, which is all the
	 * demo needs and keeps the component untouched.
	 */
	let expandedMembers = $state.raw<Record<string, boolean>>({});

	function toggleExpandedMember(id: string): void {
		expandedMembers = { ...expandedMembers, [id]: !expandedMembers[id] };
	}

	const memberDetails: Record<string, string> = Object.fromEntries(
		teamMembers.map((member) => [
			member.id,
			`${member.name} joined ${member.company} in ${member.joined} as ${member.role}, and works out of ${member.location}.`,
		]),
	);

	const expandableColumns: DataTableColumnDef<TeamMember>[] = [
		{
			id: "expand",
			header: blankHeader,
			cell: expandCell,
			enableSorting: false,
			enableHiding: false,
			size: 48,
		},
		{
			id: "name",
			accessorKey: "name",
			cell: memberLinkCell,
			meta: { label: "Name" },
			size: 150,
			enableHiding: false,
		},
		{ id: "email", accessorKey: "email", cell: emailCell, meta: { label: "Email" }, size: 150 },
		{
			id: "location",
			accessorKey: "location",
			cell: locationCell,
			meta: { label: "Location" },
			size: 175,
		},
		{
			id: "status",
			accessorKey: "status",
			cell: memberStatusCell,
			meta: { label: "Status" },
			size: 100,
		},
	];

	const expandableGrid = createDataTable<TeamMember>({
		data: () => teamMembers,
		columns: () => expandableColumns,
		getRowId: (row) => row.id,
		enableRowSelection: false,
		initialState: { sorting: [{ id: "name", desc: true }], pagination: { pageSize: 5 } },
	});

	// --- Sub table ----------------------------------------------------------------------------

	type SalesOrder = {
		id: string;
		orderNumber: string;
		customer: string;
		customerEmail: string;
		total: string;
		status: { label: string; variant: "primary-subtle" | "success-subtle" | "warning-subtle" };
		items: DataGridOrderItem[];
	};

	const SALES_ORDER_PRODUCTS = [
		{ productName: "Wireless Headphones", category: "Electronics", price: "$199.99", quantity: 1 },
		{ productName: "Phone Case", category: "Accessories", price: "$99.99", quantity: 1 },
		{ productName: "Screen Protector", category: "Accessories", price: "$29.99", quantity: 2 },
		{ productName: "Charging Cable", category: "Electronics", price: "$19.99", quantity: 1 },
		{ productName: "Bluetooth Speaker", category: "Electronics", price: "$89.99", quantity: 1 },
		{ productName: "Phone Stand", category: "Accessories", price: "$39.99", quantity: 1 },
	] as const;

	const SALES_ORDER_STATUSES = [
		{ label: "Shipped", variant: "primary-subtle" as const },
		{ label: "Delivered", variant: "success-subtle" as const },
		{ label: "Processing", variant: "warning-subtle" as const },
	];

	/**
	 * Six orders rather than upstream's sixteen. The demo is about the nested table, and sixteen
	 * near-identical order blocks would be 1 700 lines of fixture for the same three behaviours.
	 */
	const salesOrders: SalesOrder[] = teamMembers.slice(0, 6).map((member, index) => {
		const items = SALES_ORDER_PRODUCTS.slice(0, 3 + (index % 4)).map((product, itemIndex) => ({
			id: `${index + 1}-${itemIndex + 1}`,
			...product,
		}));
		const total = items.reduce(
			(sum, item) => sum + Number(item.price.replace("$", "")) * item.quantity,
			0,
		);
		return {
			id: String(index + 1),
			orderNumber: `SO-00${index + 1}`,
			customer: member.name,
			customerEmail: member.email,
			total: usdFormat.format(total),
			status: SALES_ORDER_STATUSES[index % 3]!,
			items,
		};
	});

	let expandedSalesOrders = $state.raw<Record<string, boolean>>({});

	function toggleExpandedSalesOrder(id: string): void {
		expandedSalesOrders = { ...expandedSalesOrders, [id]: !expandedSalesOrders[id] };
	}

	const salesOrderColumns: DataTableColumnDef<SalesOrder>[] = [
		{
			id: "expand",
			header: blankSalesOrderHeader,
			cell: salesOrderExpandCell,
			enableSorting: false,
			enableHiding: false,
			size: 48,
		},
		{
			id: "customer",
			accessorKey: "customer",
			header: salesOrderSortableHeader,
			cell: salesOrderCustomerCell,
			meta: { label: "Customer" },
			size: 200,
		},
		{
			id: "items",
			accessorFn: (row) => row.items.length,
			header: salesOrderSortableHeader,
			cell: salesOrderItemsCell,
			meta: { label: "Items" },
			size: 120,
		},
		{
			id: "total",
			accessorKey: "total",
			header: salesOrderSortableHeader,
			meta: { label: "Total" },
			size: 120,
		},
		{
			id: "status",
			accessorFn: (row) => row.status.label,
			header: salesOrderSortableHeader,
			cell: salesOrderStatusCell,
			meta: { label: "Status" },
			size: 120,
		},
	];

	const subTableGrid = createDataTable<SalesOrder>({
		data: () => salesOrders,
		columns: () => salesOrderColumns,
		getRowId: (row) => row.id,
		enableRowSelection: false,
		initialState: { pagination: { pageSize: 5 } },
	});

	// --- Draggable columns -------------------------------------------------------------------

	/**
	 * Upstream reaches for `@dnd-kit` here. The house drag engine is `ui/sortable`, so the header
	 * row becomes a horizontal sortable region: `Sortable.Content` composes onto the `<tr>`, each
	 * `Sortable.Item` onto its `<th>`, and the committed order is the table's `columnOrder`.
	 */
	let draggableColumnOrder = $state.raw<string[]>(["name", "email", "status"]);

	const draggableColumns: DataTableColumnDef<TeamMember>[] = [
		{
			id: "name",
			accessorKey: "name",
			cell: memberLinkCell,
			meta: { label: "Name" },
			size: 175,
			enableHiding: false,
		},
		{ id: "email", accessorKey: "email", cell: emailCell, meta: { label: "Email" }, size: 140 },
		{
			id: "status",
			accessorKey: "status",
			cell: memberStatusCell,
			meta: { label: "Status" },
			size: 100,
			enableSorting: false,
		},
	];

	const draggableColumnsGrid = createDataTable<TeamMember>({
		data: () => teamMembers,
		columns: () => draggableColumns,
		getRowId: (row) => row.id,
		enableRowSelection: false,
		state: () => ({ columnOrder: draggableColumnOrder }),
		initialState: { sorting: [{ id: "name", desc: true }], pagination: { pageSize: 5 } },
	});

	// --- Draggable rows ----------------------------------------------------------------------

	let draggableRows = $state.raw<TeamMember[]>([...teamMembers]);

	const draggableRowColumns: DataTableColumnDef<TeamMember>[] = [
		{
			id: "drag",
			header: dragHandleHeader,
			cell: dragHandleCell,
			enableSorting: false,
			enableHiding: false,
			size: 48,
		},
		{
			id: "name",
			accessorKey: "name",
			cell: memberLinkCell,
			meta: { label: "Name" },
			size: 170,
			enableHiding: false,
		},
		{ id: "email", accessorKey: "email", cell: emailCell, meta: { label: "Email" }, size: 150 },
		{
			id: "location",
			accessorKey: "location",
			cell: locationCell,
			meta: { label: "Location" },
			size: 170,
		},
	];

	const draggableRowsGrid = createDataTable<TeamMember>({
		data: () => draggableRows,
		columns: () => draggableRowColumns,
		getRowId: (row) => row.id,
		enableRowSelection: false,
		// Every row on one page: a drop that crosses a page boundary would have nowhere to land.
		initialState: { pagination: { pageSize: 10 } },
	});

	// --- Column resizing ---------------------------------------------------------------------

	const resizableColumns: DataTableColumnDef<TeamMember>[] = [
		{
			id: "name",
			accessorKey: "name",
			header: sortableHeader,
			cell: memberCell,
			meta: { label: "Staff" },
			size: 320,
			minSize: 220,
			enableHiding: false,
		},
		{
			id: "role",
			accessorKey: "role",
			header: sortableHeader,
			cell: roleCompanyCell,
			meta: { label: "Occupation" },
			size: 200,
			enableHiding: false,
		},
		{
			id: "status",
			accessorKey: "status",
			header: sortableHeader,
			cell: memberStatusCell,
			meta: { label: "Status" },
			size: 200,
			enableSorting: false,
			enableHiding: false,
			enableResizing: false,
		},
	];

	const resizableGrid = createDataTable<TeamMember>({
		data: () => teamMembers,
		columns: () => resizableColumns,
		getRowId: (row) => row.id,
		enableRowSelection: false,
		enableColumnResizing: true,
		columnResizeMode: "onChange",
		initialState: { sorting: [{ id: "name", desc: true }], pagination: { pageSize: 5 } },
	});

	// --- Pinnable columns --------------------------------------------------------------------

	const pinnableColumns: DataTableColumnDef<TeamMember>[] = [
		{
			id: "name",
			accessorKey: "name",
			header: pinnableHeader,
			cell: memberLinkCell,
			meta: { label: "Name" },
			size: 220,
			minSize: 180,
			enableHiding: false,
		},
		{
			id: "email",
			accessorKey: "email",
			header: pinnableHeader,
			cell: emailCell,
			meta: { label: "Email" },
			size: 200,
			enableHiding: false,
		},
		{
			id: "location",
			accessorKey: "location",
			header: pinnableHeader,
			cell: locationCell,
			meta: { label: "Location" },
			size: 200,
			enableHiding: false,
		},
		{
			id: "company",
			accessorKey: "company",
			header: pinnableHeader,
			meta: { label: "Company" },
			size: 220,
			enableHiding: false,
		},
		{
			id: "role",
			accessorKey: "role",
			header: pinnableHeader,
			meta: { label: "Role" },
			size: 220,
			enableHiding: false,
		},
		{
			id: "joined",
			accessorKey: "joined",
			header: pinnableHeader,
			meta: { label: "Joined" },
			size: 160,
			enableHiding: false,
		},
		{
			id: "status",
			accessorKey: "status",
			header: pinnableHeader,
			cell: memberStatusCell,
			meta: { label: "Status" },
			size: 180,
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "balance",
			accessorKey: "balance",
			header: pinnableHeader,
			cell: currencyCell,
			meta: { label: "Balance" },
			size: 160,
			enableHiding: false,
		},
	];

	const pinnableGrid = createDataTable<TeamMember>({
		data: () => teamMembers,
		columns: () => pinnableColumns,
		getRowId: (row) => row.id,
		enableRowSelection: false,
		enableColumnResizing: true,
		columnResizeMode: "onChange",
		initialState: {
			sorting: [{ id: "name", desc: true }],
			pagination: { pageSize: 5 },
			columnPinning: { left: ["name"], right: [] },
		},
	});

	// --- Sticky header -----------------------------------------------------------------------

	const stickyHeaderColumns: DataTableColumnDef<TeamMember>[] = [
		{
			id: "name",
			accessorKey: "name",
			cell: memberBadgeCell,
			meta: { label: "Name" },
			size: 250,
			enableHiding: false,
		},
		{
			id: "role",
			accessorKey: "role",
			cell: roleCompanyCell,
			meta: { label: "Role" },
			size: 150,
			enableHiding: false,
		},
		{
			id: "status",
			accessorKey: "status",
			cell: memberStatusCell,
			meta: { label: "Status" },
			size: 100,
		},
	];

	const stickyHeaderGrid = createDataTable<TeamMember>({
		data: () => teamMembers,
		columns: () => stickyHeaderColumns,
		getRowId: (row) => row.id,
		enableRowSelection: false,
		initialState: { sorting: [{ id: "name", desc: true }], pagination: { pageSize: 10 } },
	});

	// --- Column controls ---------------------------------------------------------------------

	const columnControlsColumns: DataTableColumnDef<TeamMember>[] = [
		{
			id: "name",
			accessorKey: "name",
			header: controlsHeader,
			cell: memberCell,
			meta: { label: "User" },
			size: 260,
			minSize: 200,
			enableHiding: false,
		},
		{
			id: "email",
			accessorKey: "email",
			header: controlsHeader,
			cell: emailCell,
			meta: { label: "Email" },
			size: 200,
		},
		{
			id: "location",
			accessorKey: "location",
			header: controlsHeader,
			cell: locationCell,
			meta: { label: "Location" },
			size: 200,
		},
		{
			id: "status",
			accessorKey: "status",
			header: controlsHeader,
			cell: memberStatusCell,
			meta: { label: "Status" },
			size: 150,
			enableResizing: false,
		},
	];

	const columnControlsGrid = createDataTable<TeamMember>({
		data: () => teamMembers,
		columns: () => columnControlsColumns,
		getRowId: (row) => row.id,
		enableRowSelection: false,
		enableColumnResizing: true,
		columnResizeMode: "onChange",
		initialState: {
			sorting: [{ id: "name", desc: true }],
			pagination: { pageSize: 5 },
			columnOrder: ["name", "email", "location", "status"],
		},
	});

	// =============================================================================================
	// The data grid demo set, part two — demo 19 .. demo 30, under
	// the same three standing substitutions the block above records (no remote images, no raw
	// palette colours, the soft badge family). Three more belong to this half:
	//
	// 4. NO `<DataGridContainer>` / `<DataGridScrollArea>` / `<DataGridTable>`. Those three are one
	//    component upstream; here each demo assembles `Table.*` itself, exactly as the sub-table
	//    demo above does. `gridTable` is reused wherever the row type is still `TeamMember`; the
	//    demos that widen it get `staffTable`, and the two scrolling ones get `directoryTable`.
	// 5. NO BADGE SIZE. `<Badge size="sm">` is the obvious ask; the house Badge has one size, so
	//    the prop is dropped rather than a size added to a registry component.
	// 6. A WIDER STATUS VOCABULARY. From demo 22 on, the rows carry four statuses — Active /
	//    Inactive / Blocked / Pending — against `TeamMember`'s two, plus a transaction count and a
	//    department. Those demos therefore ride `staffMembers`, the same ten people widened.
	// =============================================================================================

	type StaffStatus = "Active" | "Inactive" | "Blocked" | "Pending";

	type StaffMember = {
		id: string;
		name: string;
		email: string;
		role: string;
		department: string;
		joined: string;
		location: string;
		status: StaffStatus;
		balance: number;
		transactions: number;
	};

	const STAFF_STATUSES: StaffStatus[] = ["Active", "Inactive", "Blocked", "Pending"];

	const STAFF_DEPARTMENTS = [
		"Engineering",
		"Marketing",
		"Design",
		"Sales",
		"Finance",
		"Operations",
		"Legal",
		"Support",
	] as const;

	/** The same ten people as `teamMembers`, widened with the fields demos 22-30 read. */
	const staffMembers: StaffMember[] = teamMembers.map((member, index) => ({
		id: member.id,
		name: member.name,
		email: member.email,
		role: member.role,
		department: STAFF_DEPARTMENTS[index % STAFF_DEPARTMENTS.length]!,
		joined: member.joined,
		location: member.location,
		status: STAFF_STATUSES[index % STAFF_STATUSES.length]!,
		balance: member.balance,
		transactions: 12 + index * 7,
	}));

	// --- Loading skeleton ----------------------------------------------------------------------

	/**
	 * Upstream hands `isLoading` to `<DataGrid>` and a `meta.skeleton` element to every column.
	 * `DataTable.Skeleton` next door draws a whole placeholder table instead — head row included —
	 * which loses the point of the demo, so the flag is held here and the real head row stays.
	 */
	let skeletonLoading = $state(true);

	const skeletonColumns: DataTableColumnDef<TeamMember>[] = [
		{
			id: "name",
			accessorKey: "name",
			header: sortableHeader,
			cell: memberCell,
			meta: { label: "User" },
			size: 220,
			enableHiding: false,
		},
		{
			id: "email",
			accessorKey: "email",
			header: sortableHeader,
			cell: emailCell,
			meta: { label: "Email" },
			size: 180,
		},
		{
			id: "status",
			accessorKey: "status",
			header: sortableHeader,
			cell: memberStatusCell,
			meta: { label: "Status" },
			size: 120,
		},
	];

	const skeletonGrid = createDataTable<TeamMember>({
		data: () => teamMembers,
		columns: () => skeletonColumns,
		getRowId: (row) => row.id,
		// No affordance on this section brings a hidden column back, so none may be hidden — the
		// same rule the sortable-columns section above applies, expressed once here.
		defaultColumn: { enableHiding: false },
		enableRowSelection: false,
		initialState: { sorting: [{ id: "name", desc: true }], pagination: { pageSize: 5 } },
	});

	// --- 22 and 23. CRUD toolbar -------------------------------------------------------------------

	/** Upstream's filter: a status whitelist, then a case-insensitive match across every field. */
	function filterStaff(query: string, statuses: string[]): StaffMember[] {
		const needle = query.trim().toLowerCase();
		return staffMembers.filter((member) => {
			const matchesStatus = statuses.length === 0 || statuses.includes(member.status);
			const matchesQuery =
				needle === "" || Object.values(member).join(" ").toLowerCase().includes(needle);
			return matchesStatus && matchesQuery;
		});
	}

	/** How many rows each status covers — the count beside every checkbox in the filter popover. */
	const staffStatusCounts: [StaffStatus, number][] = STAFF_STATUSES.map((status) => [
		status,
		staffMembers.filter((member) => member.status === status).length,
	]);

	function toggleStaffStatus(list: string[], status: string, checked: boolean): string[] {
		return checked ? [...list, status] : list.filter((entry) => entry !== status);
	}

	/**
	 * Upstream's `useCopyToClipboard` hook, inlined — the same contract the Collapsible page's copy
	 * demo uses: the receipt only appears once `writeText` RESOLVES, since the clipboard API can
	 * refuse outright (insecure context, denied permission).
	 */
	async function copyStaffId(id: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(id);
		} catch {
			return;
		}
		toast.success("Employee ID copied", { description: id });
	}

	const crudColumns: DataTableColumnDef<StaffMember>[] = [
		{
			id: "select",
			header: staffSelectHeader,
			cell: staffSelectCell,
			enableSorting: false,
			enableHiding: false,
			size: 44,
		},
		{
			id: "name",
			accessorKey: "name",
			header: staffSortableHeader,
			cell: staffMemberCell,
			meta: { label: "User" },
			size: 240,
			enableHiding: false,
		},
		{
			id: "location",
			accessorKey: "location",
			header: staffSortableHeader,
			cell: staffLocationCell,
			meta: { label: "Location" },
			size: 170,
		},
		{
			id: "role",
			accessorKey: "role",
			header: staffSortableHeader,
			meta: { label: "Role" },
			size: 150,
		},
		{
			id: "joined",
			accessorKey: "joined",
			header: staffSortableHeader,
			meta: { label: "Joined" },
			size: 130,
		},
		{
			id: "status",
			accessorKey: "status",
			header: staffSortableHeader,
			cell: staffStatusCell,
			meta: { label: "Status" },
			size: 120,
		},
		{
			id: "actions",
			header: staffActionsHeader,
			cell: staffActionsCell,
			enableSorting: false,
			enableHiding: false,
			size: 60,
		},
	];

	let crudSearch = $state("");
	let crudStatuses = $state.raw<string[]>([]);
	const crudRows = $derived(filterStaff(crudSearch, crudStatuses));

	const crudGrid = createDataTable<StaffMember>({
		data: () => crudRows,
		columns: () => crudColumns,
		getRowId: (row) => row.id,
		// No affordance on this section brings a hidden column back, so none may be hidden — the
		// same rule the sortable-columns section above applies, expressed once here.
		defaultColumn: { enableHiding: false },
		initialState: { sorting: [{ id: "name", desc: true }], pagination: { pageSize: 5 } },
	});

	// --- Column totals footer ------------------------------------------------------------------

	const totalsColumns: DataTableColumnDef<StaffMember>[] = [
		{
			id: "select",
			header: staffSelectHeader,
			cell: staffSelectCell,
			enableSorting: false,
			enableHiding: false,
			size: 44,
		},
		{
			id: "name",
			accessorKey: "name",
			header: staffSortableHeader,
			cell: staffNameCell,
			meta: { label: "User" },
			size: 240,
			enableHiding: false,
		},
		{
			id: "role",
			accessorKey: "role",
			header: staffSortableHeader,
			meta: { label: "Role" },
			size: 160,
		},
		{
			id: "status",
			accessorKey: "status",
			header: staffSortableHeader,
			cell: staffStatusCell,
			meta: { label: "Status" },
			size: 130,
		},
		{
			id: "balance",
			accessorKey: "balance",
			header: staffSortableHeader,
			cell: staffBalanceCell,
			meta: { label: "Balance" },
			size: 150,
		},
		{
			id: "actions",
			header: staffActionsHeader,
			cell: staffActionsCell,
			enableSorting: false,
			enableHiding: false,
			size: 60,
		},
	];

	const totalsGrid = createDataTable<StaffMember>({
		data: () => staffMembers,
		columns: () => totalsColumns,
		getRowId: (row) => row.id,
		// No affordance on this section brings a hidden column back, so none may be hidden — the
		// same rule the sortable-columns section above applies, expressed once here.
		defaultColumn: { enableHiding: false },
		initialState: { sorting: [{ id: "name", desc: true }], pagination: { pageSize: 5 } },
	});

	/** The whole set, not the page: upstream's total is the column's, not the viewport's. */
	const staffTotalBalance = staffMembers.reduce((sum, member) => sum + member.balance, 0);

	// --- Summary stats footer ------------------------------------------------------------------

	const summaryColumns: DataTableColumnDef<StaffMember>[] = [
		{
			id: "name",
			accessorKey: "name",
			header: staffSortableHeader,
			cell: staffNameCell,
			meta: { label: "User" },
			size: 240,
			enableHiding: false,
		},
		{
			id: "location",
			accessorKey: "location",
			header: staffSortableHeader,
			cell: staffLocationCell,
			meta: { label: "Location" },
			size: 170,
		},
		{
			id: "status",
			accessorKey: "status",
			header: staffSortableHeader,
			cell: staffStatusCell,
			meta: { label: "Status" },
			size: 130,
		},
		{
			id: "balance",
			accessorKey: "balance",
			header: staffSortableHeader,
			cell: staffBalanceCell,
			meta: { label: "Balance" },
			size: 150,
		},
	];

	const summaryGrid = createDataTable<StaffMember>({
		data: () => staffMembers,
		columns: () => summaryColumns,
		getRowId: (row) => row.id,
		// No affordance on this section brings a hidden column back, so none may be hidden — the
		// same rule the sortable-columns section above applies, expressed once here.
		defaultColumn: { enableHiding: false },
		enableRowSelection: false,
		initialState: { sorting: [{ id: "name", desc: false }], pagination: { pageSize: 5 } },
	});

	const staffBalances = staffMembers.map((member) => member.balance);

	const staffStats = {
		activeCount: staffMembers.filter((member) => member.status === "Active").length,
		minBalance: Math.min(...staffBalances),
		maxBalance: Math.max(...staffBalances),
		avgBalance: staffBalances.reduce((sum, value) => sum + value, 0) / staffBalances.length,
	};

	// --- Per-column aggregate footer -----------------------------------------------------------

	const aggregateColumns: DataTableColumnDef<StaffMember>[] = [
		{
			id: "name",
			accessorKey: "name",
			header: staffSortableHeader,
			cell: staffNameCell,
			meta: { label: "User" },
			size: 250,
			enableHiding: false,
		},
		{
			id: "status",
			accessorKey: "status",
			header: staffSortableHeader,
			cell: staffStatusCell,
			meta: { label: "Status" },
			size: 150,
		},
		{
			id: "balance",
			accessorKey: "balance",
			header: staffSortableHeader,
			cell: staffBalanceCell,
			meta: { label: "Balance" },
			size: 160,
		},
		{
			id: "transactions",
			accessorKey: "transactions",
			header: staffSortableHeader,
			cell: staffTransactionsCell,
			meta: { label: "Transactions" },
			size: 160,
		},
	];

	const aggregateGrid = createDataTable<StaffMember>({
		data: () => staffMembers,
		columns: () => aggregateColumns,
		getRowId: (row) => row.id,
		// No affordance on this section brings a hidden column back, so none may be hidden — the
		// same rule the sortable-columns section above applies, expressed once here.
		defaultColumn: { enableHiding: false },
		enableRowSelection: false,
		initialState: { sorting: [{ id: "name", desc: false }], pagination: { pageSize: 5 } },
	});

	const staffTransactionCounts = staffMembers.map((member) => member.transactions);

	const staffAggregates = {
		avgBalance: staffStats.avgBalance,
		minBalance: staffStats.minBalance,
		maxBalance: staffStats.maxBalance,
		avgTransactions: Math.round(
			staffTransactionCounts.reduce((sum, value) => sum + value, 0) / staffTransactionCounts.length,
		),
		minTransactions: Math.min(...staffTransactionCounts),
		maxTransactions: Math.max(...staffTransactionCounts),
	};

	// --- 27 and 28. Infinite scroll ----------------------------------------------------------------

	type DirectoryRow = {
		id: string;
		name: string;
		email: string;
		department: string;
		status: StaffStatus;
		balance: number;
	};

	const DIRECTORY_STATUSES: StaffStatus[] = ["Active", "Inactive", "Pending"];
	/** Upstream's server page size, and the step both scrollers grow by. */
	const DIRECTORY_PAGE_SIZE = 20;
	const DIRECTORY_TOTAL = 200;

	/**
	 * Upstream fills these two hundred rows with `Math.random()`. Same reason as `generateTrickData`
	 * at the top of this file: the page prerenders, so a balance that differs between the server
	 * pass and the client pass would hydrate into a mismatch — hence the seeded generator.
	 */
	function generateDirectory(count: number, seed: number): DirectoryRow[] {
		const random = createRandom(seed);
		return Array.from({ length: count }, (_, index) => {
			const name = TEAM_NAMES[index % TEAM_NAMES.length]!;
			return {
				id: String(index + 1),
				name,
				email: `${name.split(" ")[0]!.toLowerCase()}${index + 1}@example.com`,
				department: STAFF_DEPARTMENTS[index % STAFF_DEPARTMENTS.length]!,
				status: DIRECTORY_STATUSES[index % DIRECTORY_STATUSES.length]!,
				balance: Math.round((random() * 9000 + 1000) * 100) / 100,
			};
		});
	}

	const directoryColumns: DataTableColumnDef<DirectoryRow>[] = [
		{
			id: "id",
			accessorKey: "id",
			header: directoryHeader,
			cell: directoryIndexCell,
			meta: { label: "#" },
			size: 70,
			enableSorting: false,
		},
		{
			id: "name",
			accessorKey: "name",
			header: directoryHeader,
			cell: directoryMemberCell,
			meta: { label: "User" },
			size: 260,
		},
		{
			id: "department",
			accessorKey: "department",
			header: directoryHeader,
			meta: { label: "Department" },
			size: 160,
		},
		{
			id: "status",
			accessorKey: "status",
			header: directoryHeader,
			cell: directoryStatusCell,
			meta: { label: "Status" },
			size: 130,
		},
		{
			id: "balance",
			accessorKey: "balance",
			header: directoryHeader,
			cell: directoryBalanceCell,
			meta: { label: "Balance" },
			size: 150,
		},
	];

	const localDirectory = generateDirectory(DIRECTORY_TOTAL, 20240819);

	let localVisibleCount = $state(DIRECTORY_PAGE_SIZE);
	const localRows = $derived(localDirectory.slice(0, localVisibleCount));
	const localHasMore = $derived(localVisibleCount < localDirectory.length);

	function loadMoreLocal(): void {
		if (!localHasMore) return;
		localVisibleCount = Math.min(localVisibleCount + DIRECTORY_PAGE_SIZE, localDirectory.length);
	}

	const localScrollGrid = createDataTable<DirectoryRow>({
		data: () => localRows,
		columns: () => directoryColumns,
		getRowId: (row) => row.id,
		// No affordance on this section brings a hidden column back, so none may be hidden — the
		// same rule the sortable-columns section above applies, expressed once here.
		defaultColumn: { enableHiding: false },
		enableRowSelection: false,
		// Upstream's `manualPagination`: the rows handed in are already the window, so table-core's
		// pagination row model must hand them straight back rather than slice them a second time.
		manualPagination: true,
	});

	const remoteDirectory = generateDirectory(DIRECTORY_TOTAL, 20240820);

	let remoteRows = $state.raw<DirectoryRow[]>(remoteDirectory.slice(0, DIRECTORY_PAGE_SIZE));
	let remoteFetching = $state(false);
	let remoteTimeout: ReturnType<typeof setTimeout> | null = null;
	const remoteHasMore = $derived(remoteRows.length < DIRECTORY_TOTAL);

	/** The 800 ms upstream waits, standing in for a request. Re-entry is guarded, not queued. */
	function fetchMoreRemote(): void {
		if (remoteFetching || !remoteHasMore) return;
		remoteFetching = true;
		remoteTimeout = setTimeout(() => {
			remoteRows = remoteDirectory.slice(0, remoteRows.length + DIRECTORY_PAGE_SIZE);
			remoteFetching = false;
			remoteTimeout = null;
		}, 800);
	}

	function resetRemote(): void {
		if (remoteTimeout !== null) {
			clearTimeout(remoteTimeout);
			remoteTimeout = null;
		}
		remoteFetching = false;
		remoteRows = remoteDirectory.slice(0, DIRECTORY_PAGE_SIZE);
	}

	// An in-flight timer outliving the page would write to state nobody reads any more.
	$effect(() => () => {
		if (remoteTimeout !== null) clearTimeout(remoteTimeout);
	});

	const remoteScrollGrid = createDataTable<DirectoryRow>({
		data: () => remoteRows,
		columns: () => directoryColumns,
		getRowId: (row) => row.id,
		// No affordance on this section brings a hidden column back, so none may be hidden — the
		// same rule the sortable-columns section above applies, expressed once here.
		defaultColumn: { enableHiding: false },
		enableRowSelection: false,
		manualPagination: true,
	});

	// --- Row pinning ---------------------------------------------------------------------------

	/**
	 * table-core's row-pinning slice is not one of the seven `createDataTable` owns, so it is held
	 * here and handed back as controlled state — `functionalUpdate` resolves the updater table-core
	 * passes, the same thing the bridge's slice handlers do for the seven it does own.
	 */
	let pinnedRows = $state.raw<RowPinningState>({ top: [], bottom: [] });

	const rowPinningColumns: DataTableColumnDef<StaffMember>[] = [
		{
			id: "pin",
			header: rowPinHeader,
			cell: rowPinCell,
			enableSorting: false,
			enableHiding: false,
			size: 48,
		},
		{
			id: "name",
			accessorKey: "name",
			header: staffSortableHeader,
			cell: staffNameCell,
			meta: { label: "User" },
			size: 230,
			enableHiding: false,
		},
		{
			id: "role",
			accessorKey: "role",
			header: staffSortableHeader,
			meta: { label: "Role" },
			size: 170,
		},
		{
			id: "status",
			accessorKey: "status",
			header: staffSortableHeader,
			cell: staffStatusCell,
			meta: { label: "Status" },
			size: 130,
		},
		{
			id: "balance",
			accessorKey: "balance",
			header: staffSortableHeader,
			cell: staffBalanceCell,
			meta: { label: "Balance" },
			size: 150,
		},
		{
			id: "actions",
			header: staffActionsHeader,
			cell: rowPinActionsCell,
			enableSorting: false,
			enableHiding: false,
			size: 60,
		},
	];

	const rowPinningGrid = createDataTable<StaffMember>({
		data: () => staffMembers,
		columns: () => rowPinningColumns,
		getRowId: (row) => row.id,
		// No affordance on this section brings a hidden column back, so none may be hidden — the
		// same rule the sortable-columns section above applies, expressed once here.
		defaultColumn: { enableHiding: false },
		enableRowSelection: false,
		enableRowPinning: true,
		// A pinned row stays visible even when the current page or sort would have dropped it.
		keepPinnedRows: true,
		state: () => ({ rowPinning: pinnedRows }),
		onRowPinningChange: (updater) => {
			pinnedRows = functionalUpdate(updater, pinnedRows);
		},
		initialState: { sorting: [{ id: "name", desc: false }], pagination: { pageSize: 5 } },
	});

	const pinnedRowCount = $derived(pinnedRows.top?.length ?? 0);

	// --- Tree rows -----------------------------------------------------------------------------

	type OrgNode = {
		id: string;
		name: string;
		kind: "department" | "team" | "member";
		status: "active" | "inactive";
		role?: string;
		location?: string;
		children?: OrgNode[];
	};

	const orgTree: OrgNode[] = [
		{
			id: "engineering",
			name: "Engineering",
			kind: "department",
			status: "active",
			children: [
				{
					id: "engineering-platform",
					name: "Platform",
					kind: "team",
					status: "active",
					children: [
						{
							id: "engineering-platform-1",
							name: "Alex Johnson",
							kind: "member",
							status: "active",
							role: "Staff Engineer",
							location: "United States",
						},
						{
							id: "engineering-platform-2",
							name: "Sarah Chen",
							kind: "member",
							status: "active",
							role: "Senior Engineer",
							location: "United Kingdom",
						},
						{
							id: "engineering-platform-3",
							name: "Michael Rodriguez",
							kind: "member",
							status: "inactive",
							role: "Frontend Engineer",
							location: "Canada",
						},
					],
				},
				{
					id: "engineering-mobile",
					name: "Mobile",
					kind: "team",
					status: "active",
					children: [
						{
							id: "engineering-mobile-1",
							name: "Emma Wilson",
							kind: "member",
							status: "active",
							role: "iOS Engineer",
							location: "Australia",
						},
						{
							id: "engineering-mobile-2",
							name: "David Kim",
							kind: "member",
							status: "active",
							role: "Android Engineer",
							location: "Germany",
						},
					],
				},
			],
		},
		{
			id: "operations",
			name: "Operations",
			kind: "department",
			status: "active",
			children: [
				{
					id: "operations-finance",
					name: "Finance",
					kind: "team",
					status: "active",
					children: [
						{
							id: "operations-finance-1",
							name: "Maria Garcia",
							kind: "member",
							status: "active",
							role: "Controller",
							location: "Japan",
						},
						{
							id: "operations-finance-2",
							name: "Aron Thompson",
							kind: "member",
							status: "inactive",
							role: "Accountant",
							location: "Malaysia",
						},
					],
				},
				{
					id: "operations-people",
					name: "People",
					kind: "team",
					status: "active",
					children: [
						{
							id: "operations-people-1",
							name: "Nick Johnson",
							kind: "member",
							status: "active",
							role: "People Lead",
							location: "France",
						},
						{
							id: "operations-people-2",
							name: "Liam Thompson",
							kind: "member",
							status: "active",
							role: "Recruiter",
							location: "Italy",
						},
					],
				},
			],
		},
		{
			id: "sales",
			name: "Sales",
			kind: "department",
			status: "active",
			children: [
				{
					id: "sales-accounts",
					name: "Accounts",
					kind: "team",
					status: "active",
					children: [
						{
							id: "sales-accounts-1",
							name: "James Brown",
							kind: "member",
							status: "active",
							role: "Account Executive",
							location: "Spain",
						},
						{
							id: "sales-accounts-2",
							name: "Emma Wilson",
							kind: "member",
							status: "inactive",
							role: "Account Manager",
							location: "Australia",
						},
					],
				},
			],
		},
	];

	/** Upstream opens Engineering and its Platform team on first paint. */
	let orgExpanded = $state.raw<ExpandedState>({
		engineering: true,
		"engineering-platform": true,
	});

	const orgColumns: DataTableColumnDef<OrgNode>[] = [
		{
			id: "name",
			accessorKey: "name",
			header: orgHeader,
			cell: orgNameCell,
			meta: { label: "Name" },
			size: 320,
			enableHiding: false,
		},
		{
			id: "role",
			accessorKey: "role",
			header: orgHeader,
			cell: orgRoleCell,
			meta: { label: "Role" },
			size: 190,
		},
		{
			id: "location",
			accessorKey: "location",
			header: orgHeader,
			cell: orgLocationCell,
			meta: { label: "Location" },
			size: 190,
		},
		{
			id: "status",
			accessorKey: "status",
			header: orgHeader,
			cell: orgStatusCell,
			meta: { label: "Status" },
			size: 140,
		},
	];

	const orgGrid = createDataTable<OrgNode>({
		data: () => orgTree,
		columns: () => orgColumns,
		getRowId: (row) => row.id,
		// No affordance on this section brings a hidden column back, so none may be hidden — the
		// same rule the sortable-columns section above applies, expressed once here.
		defaultColumn: { enableHiding: false },
		enableRowSelection: false,
		// The three options that turn a flat table into a tree. `createDataTable` registers no
		// expanded row model of its own — it is passed through here, the way `getSubRows` is.
		getSubRows: (row) => row.children,
		getExpandedRowModel: getExpandedRowModel(),
		// Children stay on their parent's page instead of counting toward the page size.
		paginateExpandedRows: false,
		state: () => ({ expanded: orgExpanded }),
		onExpandedChange: (updater) => {
			orgExpanded = functionalUpdate(updater, orgExpanded);
		},
		initialState: { pagination: { pageSize: 4 } },
	});
</script>

{#snippet titleHeader(ctx: HeaderContext<Project, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label="Title" />
{/snippet}

{#snippet statusHeader(ctx: HeaderContext<Project, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label="Status" />
{/snippet}

<!-- A dropdown-free sortable header: clicking it cycles ascending <-> descending directly.
	The label comes from the column's `meta.label`, so one snippet serves every column. -->
{#snippet plainSortHeader(ctx: HeaderContext<Project, unknown>)}
	{@const sorted = ctx.column.getIsSorted()}
	<Button
		variant="ghost"
		size="sm"
		class="-ms-2.5 [&_svg]:text-muted-foreground"
		data-sorted={sorted || undefined}
		onclick={() => ctx.column.toggleSorting(sorted === "asc")}
	>
		{ctx.column.columnDef.meta?.label}
		{#if sorted === "desc"}
			<ChevronDownIcon />
		{:else if sorted === "asc"}
			<ChevronUpIcon />
		{:else}
			<ChevronsUpDownIcon />
		{/if}
	</Button>
{/snippet}

<!--
	`<mark>` rather than a styled span: it is the element the HTML spec defines for marking text of
	special relevance to the reader, NVDA announces it, and Windows High Contrast maps it to the
	Mark/MarkText system colours a span would lose. The class replaces its UA default (yellow on
	black), which no theme survives.
	Written on one line because whitespace between the blocks would land inside the cell text.
-->
{#snippet highlightedTitleCell(ctx: CellContext<Project, unknown>)}
	{@const segments = splitOnQuery(String(ctx.getValue()), searchQuery)}
	<!-- Keyed by index: the segments are derived from the query and regenerated whole on every
		change, so position is the only identity they have. -->
	{#each segments as segment, index (index)}{#if segment.match}<mark
				class="bg-highlight text-highlight-foreground rounded-sm">{segment.text}</mark
			>{:else}{segment.text}{/if}{/each}
{/snippet}

{#snippet statusCell(ctx: CellContext<Project, unknown>)}
	{@const status = ctx.row.original.status}
	{@const Icon = statusIcons[status]}
	<Badge variant="outline" class="capitalize">
		<Icon />
		{status}
	</Badge>
{/snippet}

{#snippet priorityHeader(ctx: HeaderContext<Project, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label="Priority" />
{/snippet}

{#snippet priorityCell(ctx: CellContext<Project, unknown>)}
	{@const priority = ctx.row.original.priority}
	{@const Icon = priorityIcons[priority]}
	<span class="flex items-center gap-1.5 capitalize">
		<Icon class="size-4 text-muted-foreground" />
		{priority}
	</span>
{/snippet}

{#snippet budgetHeader(ctx: HeaderContext<Project, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label="Budget" />
{/snippet}

{#snippet budgetCell(ctx: CellContext<Project, unknown>)}
	<span class="flex items-center gap-1">
		<DollarSignIcon class="size-4 text-muted-foreground" />
		{ctx.row.original.budget.toLocaleString("en-US")}
	</span>
{/snippet}

{#snippet effortHeader(ctx: HeaderContext<Project, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label="Effort" />
{/snippet}

{#snippet effortCell(ctx: CellContext<Project, unknown>)}
	{ctx.row.original.effort} d
{/snippet}

{#snippet startedHeader(ctx: HeaderContext<Project, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label="Started" />
{/snippet}

{#snippet startedCell(ctx: CellContext<Project, unknown>)}
	{DataTable.formatDate(ctx.row.original.startedAt)}
{/snippet}

{#snippet dueHeader(ctx: HeaderContext<Project, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label="Due" />
{/snippet}

{#snippet dueCell(ctx: CellContext<Project, unknown>)}
	{DataTable.formatDate(ctx.row.original.dueAt)}
{/snippet}

{#snippet actionsHeader(ctx: HeaderContext<Project, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label="Actions" />
{/snippet}

{#snippet actionsCell(ctx: CellContext<Project, unknown>)}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="icon"
					aria-label={`Open ${ctx.row.original.title} menu`}
				>
					<MoreHorizontalIcon />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Item>Edit</DropdownMenu.Item>
			<DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

<!-- The selection column recipe: a labelled header checkbox that goes indeterminate while only
	some of the page's rows are selected, and a labelled checkbox in every row. -->
{#snippet selectHeader(ctx: HeaderContext<Project, unknown>)}
	<Checkbox
		aria-label="Select all"
		bind:checked={
			() => ctx.table.getIsAllPageRowsSelected(),
			(next) => ctx.table.toggleAllPageRowsSelected(next)
		}
		bind:indeterminate={() => ctx.table.getIsSomePageRowsSelected(), () => {}}
	/>
{/snippet}

{#snippet selectCell(ctx: CellContext<Project, unknown>)}
	<Checkbox
		aria-label="Select row"
		bind:checked={() => ctx.row.getIsSelected(), (next) => ctx.row.toggleSelected(next)}
	/>
{/snippet}

{#snippet orderSelectHeader(ctx: HeaderContext<Order, unknown>)}
	<Checkbox
		aria-label="Select all"
		bind:checked={
			() => ctx.table.getIsAllPageRowsSelected(),
			(next) => ctx.table.toggleAllPageRowsSelected(next)
		}
		bind:indeterminate={() => ctx.table.getIsSomePageRowsSelected(), () => {}}
	/>
{/snippet}

{#snippet orderSelectCell(ctx: CellContext<Order, unknown>)}
	<Checkbox
		aria-label="Select row"
		bind:checked={() => ctx.row.getIsSelected(), (next) => ctx.row.toggleSelected(next)}
	/>
{/snippet}

{#snippet orderNameCell(ctx: CellContext<Order, unknown>)}
	<span class="font-medium">{ctx.row.original.name}</span>
{/snippet}

{#snippet orderStatusCell(ctx: CellContext<Order, unknown>)}
	{@const config = orderStatusConfig[ctx.row.original.status]}
	<Badge variant={config.variant}>{config.label}</Badge>
{/snippet}

{#snippet orderAmountHeader()}
	<div class="text-right">Amount</div>
{/snippet}

{#snippet orderAmountCell(ctx: CellContext<Order, unknown>)}
	<div class="text-right font-medium">
		{ctx.row.original.amount.toLocaleString("en-US", {
			style: "currency",
			currency: "USD",
			maximumFractionDigits: 0,
		})}
	</div>
{/snippet}

{#snippet orderActionsCell(ctx: CellContext<Order, unknown>)}
	<div class="text-right">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon"
						aria-label={`Open ${ctx.row.original.name} menu`}
					>
						<MoreHorizontalIcon />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item>
					<EyeIcon />
					View details
				</DropdownMenu.Item>
				<DropdownMenu.Item>
					<PencilIcon />
					Edit
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item variant="destructive">
					<Trash2Icon />
					Delete
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
{/snippet}

<!-- "Show N entries" — the upstream page-size control, without its neighbouring search input
	(dropped per review). -->
{#snippet ordersPageSizeSelect()}
	{@const pageSize = ordersTable.table.getState().pagination.pageSize}
	<div class="flex items-center gap-2">
		<span class="text-sm text-muted-foreground">Show</span>
		<Select.Root
			type="single"
			value={String(pageSize)}
			onValueChange={(value) => ordersTable.table.setPageSize(Number(value))}
		>
			<Select.Trigger size="sm" class="w-16" aria-label="Rows per page">
				{pageSize}
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					{#each orderPageSizeOptions as size (size)}
						<Select.Item value={String(size)} label={String(size)} />
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>
		<span class="text-sm text-muted-foreground">entries</span>
	</div>
{/snippet}

<!-- A numbered pager — "Showing X to Y of Z entries" plus one button per page — instead of
	`DataTable.Pagination`'s "Page X of Y" and first/prev/next/last chevrons. -->
{#snippet ordersFooter()}
	{@const pagination = ordersTable.table.getState().pagination}
	{@const filteredCount = ordersTable.filteredRowCount}
	{@const from = filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}
	{@const to = Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredCount)}
	{@const currentPage = pagination.pageIndex + 1}
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<p class="text-sm text-muted-foreground">
			Showing {from} to {to} of {filteredCount} entries
		</p>
		<div class="flex items-center gap-1">
			<Button
				aria-label="Previous page"
				variant="outline"
				size="icon-sm"
				disabled={!ordersTable.table.getCanPreviousPage()}
				onclick={() => ordersTable.table.previousPage()}
			>
				<ChevronLeftIcon />
			</Button>
			{#each Array.from({ length: ordersTable.pageCount }, (_, i) => i + 1) as page (page)}
				<Button
					aria-label={`Go to page ${page}`}
					variant={currentPage === page ? "default" : "outline"}
					size="icon-sm"
					onclick={() => ordersTable.table.setPageIndex(page - 1)}
				>
					{page}
				</Button>
			{/each}
			<Button
				aria-label="Next page"
				variant="outline"
				size="icon-sm"
				disabled={!ordersTable.table.getCanNextPage()}
				onclick={() => ordersTable.table.nextPage()}
			>
				<ChevronRightIcon />
			</Button>
		</div>
	</div>
{/snippet}

{#snippet selectionActionBar()}
	<div
		class="flex items-center justify-between gap-3 rounded-lg border bg-background p-2 text-sm shadow-sm"
	>
		<span class="text-muted-foreground">
			{withToolbar.selectedRowCount} of {withToolbar.filteredRowCount} selected
		</span>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() => withToolbar.table.toggleAllRowsSelected(false)}
			>
				Clear
			</Button>
			<Button variant="outline" size="sm">Export</Button>
		</div>
	</div>
{/snippet}

<!--
	=============================================================================================
	Snippets for the data-grid sections below, moved from the Data grid page with them: the
	TeamMember cell/header family, the composed column menu, the shared `gridTable` /
	`staffTable` / `directoryTable` bodies, and the per-section row templates.
	=============================================================================================
-->

<!-- Upstream's photograph plus name and email. The photograph is a remote stock-photo URL, so the
	avatar falls back to initials — the same substitution the Filters page makes. -->
{#snippet memberCell(ctx: CellContext<TeamMember, unknown>)}
	{@const member = ctx.row.original}
	<div class="flex items-center gap-3">
		<Avatar.Root>
			<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
		</Avatar.Root>
		<div class="flex min-w-0 flex-col">
			<span class="truncate font-medium text-foreground">{member.name}</span>
			<span class="truncate text-muted-foreground">{member.email}</span>
		</div>
	</div>
{/snippet}

<!-- The same cell with the presence dot upstream paints `bg-green-500` / `bg-yellow-500` /
	`bg-orange-500` / `bg-gray-400`: here the four status tokens, so it follows the theme. -->
{#snippet memberBadgeCell(ctx: CellContext<TeamMember, unknown>)}
	{@const member = ctx.row.original}
	<div class="flex items-center gap-3">
		<Avatar.Root>
			<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
			<Avatar.Badge
				class={member.availability === "online"
					? "bg-success"
					: member.availability === "away"
						? "bg-warning"
						: member.availability === "busy"
							? "bg-destructive"
							: "bg-muted-foreground"}
			/>
		</Avatar.Root>
		<div class="flex min-w-0 flex-col">
			<span class="truncate font-medium text-foreground">{member.name}</span>
			<span class="truncate text-muted-foreground">{member.email}</span>
		</div>
	</div>
{/snippet}

{#snippet memberLinkCell(ctx: CellContext<TeamMember, unknown>)}
	{@const member = ctx.row.original}
	<div class="flex items-center gap-2">
		<Avatar.Root size="sm">
			<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
		</Avatar.Root>
		<!-- Upstream links the name to `href="#"`. There is nowhere for it to go here, and a dead
			anchor is worse than none, so the name keeps the weight and drops the link. -->
		<span class="truncate font-medium text-foreground">{member.name}</span>
	</div>
{/snippet}

{#snippet emailCell(ctx: CellContext<TeamMember, unknown>)}
	<a
		href={`mailto:${ctx.row.original.email}`}
		class="block truncate hover:text-primary hover:underline"
	>
		{ctx.row.original.email}
	</a>
{/snippet}

<!-- Upstream puts a `flagcdn.com` SVG here. No remote images, so the country keeps a map pin. -->
{#snippet locationCell(ctx: CellContext<TeamMember, unknown>)}
	<div class="flex items-center gap-1.5">
		<MapPinIcon class="size-4 shrink-0 text-muted-foreground" />
		<span class="truncate font-medium text-foreground">{ctx.row.original.location}</span>
	</div>
{/snippet}

{#snippet roleCompanyCell(ctx: CellContext<TeamMember, unknown>)}
	<div class="flex min-w-0 flex-col">
		<span class="truncate font-medium text-foreground">{ctx.row.original.role}</span>
		<span class="truncate text-muted-foreground">{ctx.row.original.company}</span>
	</div>
{/snippet}

{#snippet currencyCell(ctx: CellContext<TeamMember, unknown>)}
	<div class="text-end font-medium tabular-nums">{usdFormat.format(ctx.row.original.balance)}</div>
{/snippet}

<!-- The status pills take the house soft family, `*-subtle`. -->
{#snippet memberStatusCell(ctx: CellContext<TeamMember, unknown>)}
	{#if ctx.row.original.status === "active"}
		<Badge variant="success-subtle">Active</Badge>
	{:else}
		<Badge variant="info-subtle">Inactive</Badge>
	{/if}
{/snippet}

{#snippet blankHeader()}
	<span class="sr-only">Expand row</span>
{/snippet}

{#snippet sortableHeader(ctx: HeaderContext<TeamMember, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label={ctx.column.columnDef.meta?.label ?? ""} />
{/snippet}

<!--
	The composed column menu. `DataTable.ColumnHeader` covers sort and hide but knows nothing about moving
	or pinning a column, and it is a ported component that a documentation page has no business
	widening — so the three sections that need those entries compose the menu here, from the same
	DropdownMenu parts the part itself uses.
-->
{#snippet columnMenu({
	ctx,
	movable = false,
	pinnable = false,
	hideable = false,
}: {
	ctx: HeaderContext<TeamMember, unknown>;
	movable?: boolean;
	pinnable?: boolean;
	hideable?: boolean;
})}
	{@const column = ctx.column}
	{@const sorted = column.getIsSorted()}
	{@const pinned = column.getIsPinned()}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			data-sorted={sorted || undefined}
			class="-ms-1.5 flex h-8 items-center gap-1.5 rounded-md border border-transparent px-2 outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
		>
			{column.columnDef.meta?.label ?? column.id}
			{#if column.getCanSort()}
				{#if sorted === "desc"}
					<ChevronDownIcon />
				{:else if sorted === "asc"}
					<ChevronUpIcon />
				{:else}
					<ChevronsUpDownIcon />
				{/if}
			{/if}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-44">
			{#if column.getCanSort()}
				<DropdownMenu.Item onSelect={() => column.toggleSorting(false)}>
					<ChevronUpIcon />
					Asc
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={() => column.toggleSorting(true)}>
					<ChevronDownIcon />
					Desc
				</DropdownMenu.Item>
			{/if}
			{#if movable}
				{#if column.getCanSort()}
					<DropdownMenu.Separator />
				{/if}
				<DropdownMenu.Item
					disabled={!getCanMoveColumn(ctx.table, column.id, -1)}
					onSelect={() => moveColumn(ctx.table, column.id, -1)}
				>
					<ArrowLeftIcon />
					Move left
				</DropdownMenu.Item>
				<DropdownMenu.Item
					disabled={!getCanMoveColumn(ctx.table, column.id, 1)}
					onSelect={() => moveColumn(ctx.table, column.id, 1)}
				>
					<ArrowRightIcon />
					Move right
				</DropdownMenu.Item>
			{/if}
			{#if pinnable}
				<DropdownMenu.Separator />
				<DropdownMenu.Item disabled={pinned === "left"} onSelect={() => column.pin("left")}>
					<PinIcon />
					Pin to start
				</DropdownMenu.Item>
				<DropdownMenu.Item disabled={pinned === "right"} onSelect={() => column.pin("right")}>
					<PinIcon />
					Pin to end
				</DropdownMenu.Item>
				<DropdownMenu.Item disabled={!pinned} onSelect={() => column.pin(false)}>
					<PinOffIcon />
					Unpin
				</DropdownMenu.Item>
			{/if}
			{#if hideable && column.getCanHide()}
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={() => column.toggleVisibility(false)}>
					<EyeOffIcon />
					Hide
				</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet pinnableHeader(ctx: HeaderContext<TeamMember, unknown>)}
	{@render columnMenu({ ctx, pinnable: true })}
{/snippet}

{#snippet controlsHeader(ctx: HeaderContext<TeamMember, unknown>)}
	{@render columnMenu({ ctx, movable: true, pinnable: true, hideable: true })}
{/snippet}

{#snippet expandCell(ctx: CellContext<TeamMember, unknown>)}
	{@const open = expandedMembers[ctx.row.id] === true}
	<Button
		variant="ghost"
		size="icon-sm"
		aria-expanded={open}
		aria-label={open ? "Collapse details" : "Expand details"}
		onclick={() => toggleExpandedMember(ctx.row.id)}
	>
		{#if open}
			<ChevronUpIcon />
		{:else}
			<ChevronDownIcon />
		{/if}
	</Button>
{/snippet}

{#snippet memberDetailRow(row: Row<TeamMember>)}
	<div class="px-4 py-3 text-sm text-muted-foreground">{memberDetails[row.id]}</div>
{/snippet}

{#snippet dragHandleHeader()}
	<span class="sr-only">Reorder row</span>
{/snippet}

{#snippet dragHandleCell()}
	<Sortable.ItemHandle>
		{#snippet child({ props }: { props: SortableItemHandleChildProps })}
			<Button
				{...props as Record<string, unknown>}
				variant="ghost"
				size="icon-sm"
				class={cn(props.class, "text-muted-foreground")}
				aria-label="Drag to reorder"
			>
				<GripVerticalIcon />
			</Button>
		{/snippet}
	</Sortable.ItemHandle>
{/snippet}

<!--
	The drag handle for a resizable column. A focusable `role="separator"` is the ARIA splitter
	pattern, the same one `DataGrid.ColumnResizer` uses next door; the a11y rule only sees a
	noninteractive role beside a tabindex and a pointer handler.
-->
{#snippet resizeHandle(header: Header<TeamMember, unknown>)}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		role="separator"
		aria-orientation="vertical"
		aria-label={`Resize ${header.column.columnDef.meta?.label ?? header.column.id} column`}
		tabindex={0}
		data-resizing={header.column.getIsResizing() ? "" : undefined}
		class={cn(
			"absolute -end-px top-0 z-10 h-full w-0.5 cursor-ew-resize touch-none bg-border transition-opacity select-none hover:bg-primary focus:bg-primary focus:outline-none",
			header.column.getIsResizing()
				? "bg-primary"
				: "opacity-0 hover:opacity-100 focus-visible:opacity-100",
		)}
		onkeydown={(event) => {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
			event.preventDefault();
			const step = event.key === "ArrowLeft" ? -16 : 16;
			header.getContext().table.setColumnSizing((previous) => ({
				...previous,
				[header.column.id]: Math.max(60, header.column.getSize() + step),
			}));
		}}
		onmousedown={header.getResizeHandler()}
		ontouchstart={header.getResizeHandler()}
	></div>
{/snippet}

<!--
	The one table body every layout demo shares. The variations arrive as {@link GridLook} and
	land on the house Table parts.
-->
{#snippet gridTable({ grid, look = {}, rowDetail, isRowExpanded }: GridTableArgs)}
	{@const rowBorder = look.rowBorder ?? true}
	{@const framed = look.framed ?? true}
	<div
		class={cn(
			"overflow-hidden rounded-md",
			framed && "border",
			look.stickyHeader && "[&>[data-slot=table-container]]:max-h-96",
		)}
	>
		<Table.Root
			density={look.dense ? "sm" : "default"}
			class={look.autoWidth ? "w-auto" : "table-fixed"}
			style={look.autoWidth ? undefined : `width: ${grid.table.getTotalSize()}px; min-width: 100%;`}
		>
			<Table.Header class={cn(look.stickyHeader && "sticky top-0 z-20")}>
				{#each grid.headerGroups as headerGroup (headerGroup.id)}
					<Table.Row class={cn(!rowBorder && "border-b-0")}>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head
								colspan={header.colSpan}
								data-pinned={(look.pinned && header.column.getIsPinned()) || undefined}
								class={cn("relative", look.cellBorder && "border-e last:border-e-0")}
								style={look.pinned
									? getColumnPinningStyle({ column: header.column, withBorder: true })
									: look.autoWidth
										? undefined
										: `width: ${header.getSize()}px;`}
							>
								{#if !header.isPlaceholder}
									<DataTable.FlexRender
										template={header.column.columnDef.header}
										context={header.getContext()}
										fallback={header.column.columnDef.meta?.label ?? header.column.id}
									/>
								{/if}
								{#if look.resizable && header.column.getCanResize()}
									{@render resizeHandle(header)}
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#if grid.rows.length}
					{#each grid.rows as row (row.id)}
						<Table.Row
							data-state={row.getIsSelected() ? "selected" : undefined}
							class={cn(
								!rowBorder && "border-b-0",
								look.striped && "odd:bg-muted/40",
								look.rowRounded && "[&>*:first-child]:rounded-s-md [&>*:last-child]:rounded-e-md",
							)}
						>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell
									data-pinned={(look.pinned && cell.column.getIsPinned()) || undefined}
									class={cn(look.cellBorder && "border-e last:border-e-0")}
									style={look.pinned
										? getColumnPinningStyle({ column: cell.column, withBorder: true })
										: undefined}
								>
									<DataTable.FlexRender
										template={cell.column.columnDef.cell}
										context={cell.getContext()}
										fallback={String(cell.renderValue() ?? "")}
									/>
								</Table.Cell>
							{/each}
						</Table.Row>
						{#if rowDetail && isRowExpanded?.(row)}
							<Table.Row class="bg-muted/30 hover:bg-muted/30">
								<Table.Cell colspan={row.getVisibleCells().length} class="p-0!">
									{@render rowDetail(row)}
								</Table.Cell>
							</Table.Row>
						{/if}
					{/each}
				{:else}
					<Table.Row>
						<Table.Cell colspan={grid.table.getAllColumns().length} class="h-24 text-center">
							No results.
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
{/snippet}

<!-- The sub-table demo's own row templates: a different row type, so its own snippets. -->
{#snippet blankSalesOrderHeader()}
	<span class="sr-only">Expand order</span>
{/snippet}

{#snippet salesOrderSortableHeader(ctx: HeaderContext<SalesOrder, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label={ctx.column.columnDef.meta?.label ?? ""} />
{/snippet}

{#snippet salesOrderExpandCell(ctx: CellContext<SalesOrder, unknown>)}
	{@const open = expandedSalesOrders[ctx.row.id] === true}
	<Button
		variant="ghost"
		size="icon-sm"
		aria-expanded={open}
		aria-label={open ? "Collapse order items" : "Expand order items"}
		onclick={() => toggleExpandedSalesOrder(ctx.row.id)}
	>
		{#if open}
			<ChevronUpIcon />
		{:else}
			<ChevronDownIcon />
		{/if}
	</Button>
{/snippet}

{#snippet salesOrderCustomerCell(ctx: CellContext<SalesOrder, unknown>)}
	{@const order = ctx.row.original}
	<div class="flex items-center gap-3">
		<Avatar.Root>
			<Avatar.Fallback>{getInitials(order.customer)}</Avatar.Fallback>
		</Avatar.Root>
		<div class="flex min-w-0 flex-col">
			<span class="truncate font-medium text-foreground">{order.customer}</span>
			<span class="truncate text-muted-foreground">{order.orderNumber}</span>
		</div>
	</div>
{/snippet}

{#snippet salesOrderItemsCell(ctx: CellContext<SalesOrder, unknown>)}
	{@const count = ctx.row.original.items.length}
	<button
		type="button"
		class="font-medium text-foreground hover:text-primary"
		onclick={() => toggleExpandedSalesOrder(ctx.row.id)}
	>
		{count}
		{count === 1 ? "item" : "items"}
	</button>
{/snippet}

{#snippet salesOrderStatusCell(ctx: CellContext<SalesOrder, unknown>)}
	<Badge variant={ctx.row.original.status.variant}>{ctx.row.original.status.label}</Badge>
{/snippet}

<!-- demo 21 hangs one skeleton element off each column's `meta.skeleton`. Here the
	three live together and the body picks by column id, which keeps markup out of the column
	defs — the `meta` on this theme's columns carries data, not elements. -->
{#snippet loadingCell(columnId: string)}
	{#if columnId === "name"}
		<div class="flex items-center gap-3">
			<Skeleton class="size-8 rounded-full" />
			<div class="flex flex-col gap-1">
				<Skeleton class="h-4 w-24" />
				<Skeleton class="h-3 w-16" />
			</div>
		</div>
	{:else if columnId === "email"}
		<Skeleton class="h-5 w-28" />
	{:else}
		<Skeleton class="h-5 w-16" />
	{/if}
{/snippet}

<!-- --- The widened `StaffMember` row: cells, headers and the body they share ------------------ -->

{#snippet staffSortableHeader(ctx: HeaderContext<StaffMember, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label={ctx.column.columnDef.meta?.label ?? ""} />
{/snippet}

{#snippet staffNameCell(ctx: CellContext<StaffMember, unknown>)}
	{@const member = ctx.row.original}
	<div class="flex items-center gap-3">
		<Avatar.Root>
			<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
		</Avatar.Root>
		<span class="truncate font-medium text-foreground">{member.name}</span>
	</div>
{/snippet}

{#snippet staffMemberCell(ctx: CellContext<StaffMember, unknown>)}
	{@const member = ctx.row.original}
	<div class="flex items-center gap-3">
		<Avatar.Root>
			<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
		</Avatar.Root>
		<div class="flex min-w-0 flex-col">
			<span class="truncate font-medium text-foreground">{member.name}</span>
			<span class="truncate text-muted-foreground">{member.email}</span>
		</div>
	</div>
{/snippet}

{#snippet staffLocationCell(ctx: CellContext<StaffMember, unknown>)}
	<div class="flex items-center gap-1.5">
		<MapPinIcon class="size-4 shrink-0 text-muted-foreground" />
		<span class="truncate font-medium text-foreground">{ctx.row.original.location}</span>
	</div>
{/snippet}

<!-- The four-valued status, landing on the four soft badge variants. -->
{#snippet staffStatusCell(ctx: CellContext<StaffMember, unknown>)}
	{@const status = ctx.row.original.status}
	{#if status === "Active"}
		<Badge variant="success-subtle">Active</Badge>
	{:else if status === "Blocked"}
		<Badge variant="destructive-subtle">Blocked</Badge>
	{:else if status === "Inactive"}
		<Badge variant="info-subtle">Inactive</Badge>
	{:else}
		<Badge variant="warning-subtle">Pending</Badge>
	{/if}
{/snippet}

{#snippet staffBalanceCell(ctx: CellContext<StaffMember, unknown>)}
	<span class="font-medium tabular-nums">{usdFormat.format(ctx.row.original.balance)}</span>
{/snippet}

{#snippet staffTransactionsCell(ctx: CellContext<StaffMember, unknown>)}
	<span class="font-medium tabular-nums">{ctx.row.original.transactions}</span>
{/snippet}

{#snippet staffSelectHeader(ctx: HeaderContext<StaffMember, unknown>)}
	<Checkbox
		aria-label="Select all"
		bind:checked={
			() => ctx.table.getIsAllPageRowsSelected(),
			(next) => ctx.table.toggleAllPageRowsSelected(next)
		}
		bind:indeterminate={() => ctx.table.getIsSomePageRowsSelected(), () => {}}
	/>
{/snippet}

{#snippet staffSelectCell(ctx: CellContext<StaffMember, unknown>)}
	<Checkbox
		aria-label="Select row"
		bind:checked={() => ctx.row.getIsSelected(), (next) => ctx.row.toggleSelected(next)}
	/>
{/snippet}

{#snippet staffActionsHeader()}
	<span class="sr-only">Row actions</span>
{/snippet}

<!-- Edit and Delete are inert upstream too — the demo is about the menu, not about a mutation.
	Copy ID is the one entry that does something, and it reports through a toast. -->
{#snippet staffActionsCell(ctx: CellContext<StaffMember, unknown>)}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="icon-sm"
					aria-label={`Open ${ctx.row.original.name} menu`}
				>
					<EllipsisIcon />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start">
			<DropdownMenu.Item>Edit</DropdownMenu.Item>
			<DropdownMenu.Item onSelect={() => copyStaffId(ctx.row.original.id)}
				>Copy ID</DropdownMenu.Item
			>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

<!--
	The body the `StaffMember` sections share. Same shape as `gridTable` above minus the layout
	switches none of these demos ask for, plus the `<tfoot>` three of them do: it is a snippet
	handed the table so a footer can
	span `getVisibleLeafColumns().length` columns.
-->
{#snippet staffTable({
	grid,
	footer,
	framed = true,
}: {
	grid: DataTableState<StaffMember>;
	footer?: Snippet<[TanstackTable<StaffMember>]>;
	/** Off when the container already draws the border this would double. */
	framed?: boolean;
})}
	<div class={cn("overflow-hidden rounded-md", framed && "border")}>
		<Table.Root
			class="table-fixed"
			style={`width: ${grid.table.getTotalSize()}px; min-width: 100%;`}
		>
			<Table.Header>
				{#each grid.headerGroups as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head colspan={header.colSpan} style={`width: ${header.getSize()}px;`}>
								{#if !header.isPlaceholder}
									<DataTable.FlexRender
										template={header.column.columnDef.header}
										context={header.getContext()}
										fallback={header.column.columnDef.meta?.label ?? header.column.id}
									/>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#if grid.rows.length}
					{#each grid.rows as row (row.id)}
						<Table.Row data-state={row.getIsSelected() ? "selected" : undefined}>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell>
									<DataTable.FlexRender
										template={cell.column.columnDef.cell}
										context={cell.getContext()}
										fallback={String(cell.renderValue() ?? "")}
									/>
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				{:else}
					<Table.Row>
						<Table.Cell colspan={grid.table.getAllColumns().length} class="h-24 text-center">
							No results.
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
			{#if footer}
				<Table.Footer>
					{@render footer(grid.table)}
				</Table.Footer>
			{/if}
		</Table.Root>
	</div>
{/snippet}

<!-- demo 22 / demo 23 share this toolbar: a search box over every field and
	a status whitelist with per-status counts. -->
{#snippet crudToolbar({
	idPrefix,
	search,
	onSearchChange,
	statuses,
	onStatusesChange,
}: {
	idPrefix: string;
	search: string;
	onSearchChange: (next: string) => void;
	statuses: string[];
	onStatusesChange: (next: string[]) => void;
})}
	<div class="flex flex-wrap items-center gap-2.5">
		<InputGroup.Root class="w-48">
			<InputGroup.Addon>
				<SearchIcon />
			</InputGroup.Addon>
			<InputGroup.Input
				value={search}
				placeholder="Search..."
				aria-label="Search team members"
				oninput={(event) => onSearchChange(event.currentTarget.value)}
			/>
			{#if search.length > 0}
				<InputGroup.Addon align="inline-end">
					<InputGroup.Button
						size="icon-xs"
						aria-label="Clear search"
						title="Clear"
						onclick={() => onSearchChange("")}
					>
						<XIcon />
					</InputGroup.Button>
				</InputGroup.Addon>
			{/if}
		</InputGroup.Root>
		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline">
						<FunnelIcon data-icon="inline-start" />
						Status
						{#if statuses.length > 0}
							<Badge variant="info-subtle">{statuses.length}</Badge>
						{/if}
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content align="start" class="w-44">
				<div class="flex flex-col gap-3">
					<div class="text-xs font-medium text-muted-foreground">Filters</div>
					{#each staffStatusCounts as [status, count] (status)}
						<div class="flex items-center gap-2.5">
							<Checkbox
								id={`${idPrefix}-${status}`}
								checked={statuses.includes(status)}
								onCheckedChange={(checked) =>
									onStatusesChange(toggleStaffStatus(statuses, status, checked === true))}
							/>
							<Label for={`${idPrefix}-${status}`} class="grow justify-between gap-1.5 font-normal">
								{status}
								<span class="text-muted-foreground">{count}</span>
							</Label>
						</div>
					{/each}
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
{/snippet}

<!-- demo 24: the label spans every column up to the balance, then the total, then the
	actions column stays empty. -->
{#snippet totalsFooter(table: TanstackTable<StaffMember>)}
	{@const visible = table.getVisibleLeafColumns().length}
	<Table.Row>
		<Table.Cell colspan={visible - 2}>
			<span class="text-muted-foreground">Total balance</span>
		</Table.Cell>
		<Table.Cell class="font-semibold tabular-nums">
			{usdFormat.format(staffTotalBalance)}
		</Table.Cell>
		<Table.Cell></Table.Cell>
	</Table.Row>
{/snippet}

<!-- demo 25: two footer rows — the balance range on top, the averages under it. -->
{#snippet summaryFooter(table: TanstackTable<StaffMember>)}
	{@const visible = table.getVisibleLeafColumns().length}
	<Table.Row>
		<Table.Cell colspan={visible - 2}></Table.Cell>
		<Table.Cell>
			<div class="flex flex-col gap-0.5">
				<span class="text-xs text-muted-foreground">Min</span>
				<span class="tabular-nums">{usdFormat.format(staffStats.minBalance)}</span>
			</div>
		</Table.Cell>
		<Table.Cell>
			<div class="flex flex-col gap-0.5">
				<span class="text-xs text-muted-foreground">Max</span>
				<span class="tabular-nums">{usdFormat.format(staffStats.maxBalance)}</span>
			</div>
		</Table.Cell>
	</Table.Row>
	<Table.Row>
		<Table.Cell colspan={visible - 2}>
			<div class="flex items-center gap-1.5">
				<span class="text-muted-foreground">Avg balance</span>
				<span class="tabular-nums">{usdFormat.format(staffStats.avgBalance)}</span>
			</div>
		</Table.Cell>
		<Table.Cell colspan={2}>
			<div class="flex items-center gap-1.5">
				<span class="text-muted-foreground">Active</span>
				<Badge variant="success-subtle">{staffStats.activeCount}</Badge>
			</div>
		</Table.Cell>
	</Table.Row>
{/snippet}

<!-- demo 26: one footer row, each numeric column carrying its own average and range. -->
{#snippet aggregateFooter()}
	<Table.Row>
		<Table.Cell colspan={2}>
			<div class="flex flex-col gap-0.5">
				<span class="text-muted-foreground">Summary</span>
				<span class="font-medium text-foreground">Across all members</span>
				<span class="text-muted-foreground tabular-nums">{staffMembers.length} members</span>
			</div>
		</Table.Cell>
		<Table.Cell>
			<div class="flex flex-col gap-0.5">
				<span class="text-muted-foreground">Avg</span>
				<span class="tabular-nums">{usdFormat.format(staffAggregates.avgBalance)}</span>
				<span class="text-muted-foreground tabular-nums">
					{usdFormat.format(staffAggregates.minBalance)} – {usdFormat.format(
						staffAggregates.maxBalance,
					)}
				</span>
			</div>
		</Table.Cell>
		<Table.Cell>
			<div class="flex flex-col gap-0.5">
				<span class="text-muted-foreground">Avg</span>
				<span class="tabular-nums">{staffAggregates.avgTransactions}</span>
				<span class="text-muted-foreground tabular-nums">
					{staffAggregates.minTransactions} – {staffAggregates.maxTransactions}
				</span>
			</div>
		</Table.Cell>
	</Table.Row>
{/snippet}

<!-- --- The scrolling directory the two infinite-scroll sections share ------------------------- -->

{#snippet directoryHeader(ctx: HeaderContext<DirectoryRow, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label={ctx.column.columnDef.meta?.label ?? ""} />
{/snippet}

{#snippet directoryIndexCell(ctx: CellContext<DirectoryRow, unknown>)}
	<span class="text-muted-foreground tabular-nums">{ctx.row.original.id}</span>
{/snippet}

{#snippet directoryMemberCell(ctx: CellContext<DirectoryRow, unknown>)}
	{@const row = ctx.row.original}
	<div class="flex items-center gap-3">
		<Avatar.Root size="sm">
			<Avatar.Fallback>{getInitials(row.name)}</Avatar.Fallback>
		</Avatar.Root>
		<div class="flex min-w-0 flex-col">
			<span class="truncate font-medium text-foreground">{row.name}</span>
			<span class="truncate text-xs text-muted-foreground">{row.email}</span>
		</div>
	</div>
{/snippet}

{#snippet directoryStatusCell(ctx: CellContext<DirectoryRow, unknown>)}
	{@const status = ctx.row.original.status}
	{#if status === "Active"}
		<Badge variant="success-subtle">Active</Badge>
	{:else if status === "Inactive"}
		<Badge variant="info-subtle">Inactive</Badge>
	{:else}
		<Badge variant="warning-subtle">Pending</Badge>
	{/if}
{/snippet}

{#snippet directoryBalanceCell(ctx: CellContext<DirectoryRow, unknown>)}
	<span class="tabular-nums">{usdFormat.format(ctx.row.original.balance)}</span>
{/snippet}

<!--
	The one place on this page that does not use `Table.Root`. Upstream virtualizes these two
	hundred rows through `<DataGridTableVirtual>`; this theme has no virtualizer on the data-table
	side, so the demo becomes what its title says instead — a window that grows as the scroller
	nears its end. That needs the scroll event, and `Table.Root` owns its own scroll container
	without exposing it, so the container is declared here and only the inner parts are house ones.
	`onscroll` on a plain scrolling box is not an interactive-role affordance — the rows below it
	are reachable by keyboard through the scroller itself.
-->
{#snippet directoryTable({
	grid,
	hasMore,
	fetching = false,
	onNearEnd,
}: {
	grid: DataTableState<DirectoryRow>;
	hasMore: boolean;
	fetching?: boolean;
	onNearEnd: () => void;
})}
	<div
		class="max-h-[420px] overflow-auto rounded-md border"
		onscroll={(event) => {
			const element = event.currentTarget;
			if (element.scrollTop + element.clientHeight >= element.scrollHeight - 96) onNearEnd();
		}}
	>
		<table
			data-slot="table"
			class="table-fixed caption-bottom text-sm"
			style={`width: ${grid.table.getTotalSize()}px; min-width: 100%;`}
		>
			<Table.Header class="sticky top-0 z-20">
				{#each grid.headerGroups as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head colspan={header.colSpan} style={`width: ${header.getSize()}px;`}>
								{#if !header.isPlaceholder}
									<DataTable.FlexRender
										template={header.column.columnDef.header}
										context={header.getContext()}
										fallback={header.column.columnDef.meta?.label ?? header.column.id}
									/>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each grid.rows as row (row.id)}
					<Table.Row>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell>
								<DataTable.FlexRender
									template={cell.column.columnDef.cell}
									context={cell.getContext()}
									fallback={String(cell.renderValue() ?? "")}
								/>
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
				{#if hasMore}
					<Table.Row class="hover:bg-transparent">
						<Table.Cell
							colspan={grid.table.getAllColumns().length}
							class="text-center text-muted-foreground"
						>
							{#if fetching}
								<span class="inline-flex items-center gap-2">
									<Spinner />
									Loading more…
								</span>
							{:else}
								Keep scrolling to load more
							{/if}
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</table>
	</div>
{/snippet}

<!-- --- Row pinning ---------------------------------------------------------------------------- -->

{#snippet rowPinHeader()}
	<span class="sr-only">Pin row</span>
{/snippet}

{#snippet rowPinCell(ctx: CellContext<StaffMember, unknown>)}
	{@const pinned = ctx.row.getIsPinned() !== false}
	<Button
		variant="ghost"
		size="icon-sm"
		aria-pressed={pinned}
		aria-label={pinned ? `Unpin ${ctx.row.original.name}` : `Pin ${ctx.row.original.name} to top`}
		class={pinned ? "text-primary" : "text-muted-foreground"}
		onclick={() => ctx.row.pin(pinned ? false : "top")}
	>
		{#if pinned}
			<PinOffIcon />
		{:else}
			<PinIcon />
		{/if}
	</Button>
{/snippet}

{#snippet rowPinActionsCell(ctx: CellContext<StaffMember, unknown>)}
	{@const pinned = ctx.row.getIsPinned() !== false}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="icon-sm"
					aria-label={`Open ${ctx.row.original.name} menu`}
				>
					<EllipsisIcon />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start">
			<DropdownMenu.Item onSelect={() => ctx.row.pin(pinned ? false : "top")}>
				{pinned ? "Unpin row" : "Pin to top"}
			</DropdownMenu.Item>
			<DropdownMenu.Item>Edit</DropdownMenu.Item>
			<DropdownMenu.Item onSelect={() => copyStaffId(ctx.row.original.id)}
				>Copy ID</DropdownMenu.Item
			>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

<!-- One `<tr>`, used for both the pinned band and the rest of the page. -->
{#snippet pinnableRow(row: Row<StaffMember>, pinned: boolean)}
	<Table.Row class={pinned ? "bg-primary/5 hover:bg-primary/10" : undefined}>
		{#each row.getVisibleCells() as cell (cell.id)}
			<Table.Cell>
				<DataTable.FlexRender
					template={cell.column.columnDef.cell}
					context={cell.getContext()}
					fallback={String(cell.renderValue() ?? "")}
				/>
			</Table.Cell>
		{/each}
	</Table.Row>
{/snippet}

<!-- --- Tree rows ------------------------------------------------------------------------------- -->

{#snippet orgHeader(ctx: HeaderContext<OrgNode, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label={ctx.column.columnDef.meta?.label ?? ""} />
{/snippet}

<!-- The indent is `row.depth`, which table-core sets from `getSubRows`. Rows that cannot expand
	still reserve the disclosure's width so the names of one level stay aligned. -->
{#snippet orgNameCell(ctx: CellContext<OrgNode, unknown>)}
	{@const row = ctx.row}
	{@const node = row.original}
	<div class="flex items-center gap-1.5" style={`padding-inline-start: ${row.depth * 1.25}rem;`}>
		{#if row.getCanExpand()}
			<Button
				variant="ghost"
				size="icon-xs"
				aria-expanded={row.getIsExpanded()}
				aria-label={row.getIsExpanded() ? `Collapse ${node.name}` : `Expand ${node.name}`}
				onclick={() => row.toggleExpanded()}
			>
				{#if row.getIsExpanded()}
					<ChevronDownIcon />
				{:else}
					<ChevronRightIcon />
				{/if}
			</Button>
		{:else}
			<span class="size-6 shrink-0" aria-hidden="true"></span>
		{/if}
		{#if node.kind === "member"}
			<Avatar.Root size="sm">
				<Avatar.Fallback>{getInitials(node.name)}</Avatar.Fallback>
			</Avatar.Root>
		{/if}
		<span class="truncate font-medium text-foreground">{node.name}</span>
	</div>
{/snippet}

{#snippet orgRoleCell(ctx: CellContext<OrgNode, unknown>)}
	{@const node = ctx.row.original}
	<span class="text-muted-foreground">
		{node.role ?? (node.kind === "department" ? "Department" : "Team")}
	</span>
{/snippet}

{#snippet orgLocationCell(ctx: CellContext<OrgNode, unknown>)}
	{#if ctx.row.original.location}
		<div class="flex items-center gap-1.5">
			<MapPinIcon class="size-4 shrink-0 text-muted-foreground" />
			<span class="truncate font-medium text-foreground">{ctx.row.original.location}</span>
		</div>
	{:else}
		<span class="text-muted-foreground">—</span>
	{/if}
{/snippet}

{#snippet orgStatusCell(ctx: CellContext<OrgNode, unknown>)}
	{#if ctx.row.original.status === "active"}
		<Badge variant="success-subtle">Active</Badge>
	{:else}
		<Badge variant="warning-subtle">Inactive</Badge>
	{/if}
{/snippet}

<DocPage title="Data Table">
	{#snippet subtitle()}
		A powerful and flexible data table for displaying, filtering, sorting and paginating tabular
		data, built on <code>@tanstack/table-core</code>. Reach for it over the plain
		<a class="text-primary underline underline-offset-3" href="#/components/table">Table</a>
		when the rows need a toolbar, faceted filters and pagination rather than markup you write yourself,
		and over the
		<a class="text-primary underline underline-offset-3" href="#/components/data-grid">Data grid</a>
		when they are only read: this one pages a dataset through the Table primitive's own cells, where the
		grid drops pagination for windowed scrolling and edits cells in place.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			Rows render from a table built by createDataTable; the column header menu sorts and the
			pagination controls page.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="w-full">
					<DataTable.Root table={basic.table} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Plain sortable headers">
		{#snippet blurb()}
			Headers without the dropdown menu — clicking a header cycles the sort between ascending and
			descending. Upstream ships no such demo; this composes a ghost Button in the header snippet,
			leaving the column header part untouched.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="w-full">
					<DataTable.Root table={plain.table} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toolbar, filters and row selection">
		{#snippet blurb()}
			A text filter, a multi-select facet, a single-select facet, a number filter with a unit
			suffix, the View menu, and an action bar that appears only while rows are selected. Upstream's
			own demo covers fewer of these — it filters on text and one facet only — so this example
			carries the extra variants.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="w-full">
					<DataTable.Root table={withToolbar.table} actionBar={selectionActionBar}>
						<DataTable.Toolbar />
					</DataTable.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Search with match highlighting">
		{#snippet blurb()}
			A single text filter, with the matched substring marked in the column it searches. Upstream
			ships no such demo; the highlight is composed in the page as a cell snippet — the toolbar
			input and the column's filterFn are untouched — and reads the applied filter value, so the
			marks can never disagree with the rows that survived it.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="w-full">
					<DataTable.Root table={search.table}>
						<DataTable.Toolbar />
					</DataTable.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Range and date filters, pinning and reordering">
		{#snippet blurb()}
			A slider filter with a unit, single-date and date-range filters, a right-pinned actions
			column, and a View menu whose list can be dragged to reorder the columns.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="w-full">
					<DataTable.Root table={advanced.table}>
						<DataTable.Toolbar reorderable />
					</DataTable.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Selectable rows with a numbered pager">
		{#snippet blurb()}
			Checkbox selection, status badges, a row actions menu and a numbered pager with a per-page
			count, without the upstream demo's search input. DataTable.Root always renders the shared
			Pagination footer, so this composes Table.Root and DataTable.FlexRender directly to swap in
			the numbered one.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="flex w-full max-w-3xl flex-col gap-4">
					{@render ordersPageSizeSelect()}
					<div class="overflow-hidden rounded-lg border">
						<Table.Root>
							<Table.Header>
								{#each ordersTable.headerGroups as headerGroup (headerGroup.id)}
									<Table.Row>
										{#each headerGroup.headers as header (header.id)}
											<Table.Head colspan={header.colSpan}>
												{#if !header.isPlaceholder}
													<DataTable.FlexRender
														template={header.column.columnDef.header}
														context={header.getContext()}
														fallback={header.column.id}
													/>
												{/if}
											</Table.Head>
										{/each}
									</Table.Row>
								{/each}
							</Table.Header>
							<Table.Body>
								{#if ordersTable.rows.length}
									{#each ordersTable.rows as row (row.id)}
										<Table.Row data-state={row.getIsSelected() ? "selected" : undefined}>
											{#each row.getVisibleCells() as cell (cell.id)}
												<Table.Cell>
													<DataTable.FlexRender
														template={cell.column.columnDef.cell}
														context={cell.getContext()}
														fallback={String(cell.renderValue() ?? "")}
													/>
												</Table.Cell>
											{/each}
										</Table.Row>
									{/each}
								{:else}
									<Table.Row>
										<Table.Cell
											colspan={ordersTable.table.getAllColumns().length}
											class="h-24 text-center"
										>
											No results.
										</Table.Cell>
									</Table.Row>
								{/if}
							</Table.Body>
						</Table.Root>
					</div>
					{@render ordersFooter()}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Skeleton">
		{#snippet blurb()}
			A presentational placeholder for the loading state — no live data, no interactive controls.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="w-full">
					<DataTable.Skeleton columnCount={4} rowCount={4} filterCount={2} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		The sections from here to the API reference are the data-grid demos, moved from the Data
		grid page — that name belongs to this component's table pattern, not the spreadsheet. See
		the banner in the script block for the standing substitutions.
	-->

	<DocSection title="Expandable rows">
		{#snippet blurb()}
			A disclosure column opens a full-width detail row underneath. `createDataTable` registers no
			expanded row model, so the open set is one boolean per row id on the page.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full min-w-0 flex-col gap-2.5">
					{@render gridTable({
						grid: expandableGrid,
						rowDetail: memberDetailRow,
						isRowExpanded: (row) => expandedMembers[row.id] === true,
					})}
					<DataTable.Pagination table={expandableGrid.table} pageSizeOptions={[5, 10]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sub table">
		{#snippet blurb()}
			The same disclosure, but the detail row is a second table with a sorting and paging state of
			its own — one per expanded order, which is why it is a component (<code
				>data-grid-order-items.svelte</code
			>) rather than a snippet.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full min-w-0 flex-col gap-2.5">
					<div class="overflow-hidden rounded-md border">
						<Table.Root
							class="table-fixed"
							style={`width: ${subTableGrid.table.getTotalSize()}px; min-width: 100%;`}
						>
							<Table.Header>
								{#each subTableGrid.headerGroups as headerGroup (headerGroup.id)}
									<Table.Row>
										{#each headerGroup.headers as header (header.id)}
											<Table.Head colspan={header.colSpan} style={`width: ${header.getSize()}px;`}>
												{#if !header.isPlaceholder}
													<DataTable.FlexRender
														template={header.column.columnDef.header}
														context={header.getContext()}
														fallback={header.column.columnDef.meta?.label ?? header.column.id}
													/>
												{/if}
											</Table.Head>
										{/each}
									</Table.Row>
								{/each}
							</Table.Header>
							<Table.Body>
								{#each subTableGrid.rows as row (row.id)}
									<Table.Row>
										{#each row.getVisibleCells() as cell (cell.id)}
											<Table.Cell>
												<DataTable.FlexRender
													template={cell.column.columnDef.cell}
													context={cell.getContext()}
													fallback={String(cell.renderValue() ?? "")}
												/>
											</Table.Cell>
										{/each}
									</Table.Row>
									{#if expandedSalesOrders[row.id]}
										<Table.Row class="bg-muted/30 hover:bg-muted/30">
											<Table.Cell colspan={row.getVisibleCells().length} class="p-0!">
												<DataGridOrderItems items={row.original.items} />
											</Table.Cell>
										</Table.Row>
									{/if}
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
					<DataTable.Pagination table={subTableGrid.table} pageSizeOptions={[5, 10]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Draggable columns">
		{#snippet blurb()}
			Column reorder by pointer — the same order the Column controls menu below moves through its
			entries. The head row is a horizontal
			<code>Sortable</code> region and each header cell an item.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full min-w-0 flex-col gap-2.5">
					<div class="overflow-hidden rounded-md border">
						<Sortable.Root bind:value={draggableColumnOrder} orientation="horizontal">
							<Table.Root
								class="table-fixed"
								style={`width: ${draggableColumnsGrid.table.getTotalSize()}px; min-width: 100%;`}
							>
								<Table.Header>
									{#each draggableColumnsGrid.headerGroups as headerGroup (headerGroup.id)}
										<Sortable.Content>
											{#snippet child({ props }: { props: SortableContentChildProps })}
												<Table.Row {...props as Record<string, unknown>} class={props.class}>
													{#each headerGroup.headers as header (header.id)}
														<Sortable.Item value={header.column.id} asHandle>
															{#snippet child({
																props: headProps,
															}: {
																props: SortableItemChildProps;
															})}
																<Table.Head
																	{...headProps as Record<string, unknown>}
																	colspan={header.colSpan}
																	class={cn(headProps.class, "cursor-grab")}
																	style={`${headProps.style ?? ""} width: ${header.getSize()}px;`}
																>
																	<DataTable.FlexRender
																		template={header.column.columnDef.header}
																		context={header.getContext()}
																		fallback={header.column.columnDef.meta?.label ??
																			header.column.id}
																	/>
																</Table.Head>
															{/snippet}
														</Sortable.Item>
													{/each}
												</Table.Row>
											{/snippet}
										</Sortable.Content>
									{/each}
								</Table.Header>
								<Table.Body>
									{#each draggableColumnsGrid.rows as row (row.id)}
										<Table.Row>
											{#each row.getVisibleCells() as cell (cell.id)}
												<Table.Cell>
													<DataTable.FlexRender
														template={cell.column.columnDef.cell}
														context={cell.getContext()}
														fallback={String(cell.renderValue() ?? "")}
													/>
												</Table.Cell>
											{/each}
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
							<Sortable.Overlay>
								<div class="size-full bg-primary/10"></div>
							</Sortable.Overlay>
						</Sortable.Root>
					</div>
					<DataTable.Pagination table={draggableColumnsGrid.table} pageSizeOptions={[5, 10]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Draggable rows">
		{#snippet blurb()}
			A grip in the leading column carries the row. The whole list is on one page, because a drop
			that crossed a page boundary would have nowhere to land.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full min-w-0 flex-col gap-2.5">
					<div class="overflow-hidden rounded-md border">
						<Sortable.Root bind:value={draggableRows} getItemValue={(member) => member.id}>
							<Table.Root
								class="table-fixed"
								style={`width: ${draggableRowsGrid.table.getTotalSize()}px; min-width: 100%;`}
							>
								<Table.Header>
									{#each draggableRowsGrid.headerGroups as headerGroup (headerGroup.id)}
										<Table.Row>
											{#each headerGroup.headers as header (header.id)}
												<Table.Head
													colspan={header.colSpan}
													style={`width: ${header.getSize()}px;`}
												>
													{#if !header.isPlaceholder}
														<DataTable.FlexRender
															template={header.column.columnDef.header}
															context={header.getContext()}
															fallback={header.column.columnDef.meta?.label ?? header.column.id}
														/>
													{/if}
												</Table.Head>
											{/each}
										</Table.Row>
									{/each}
								</Table.Header>
								<Sortable.Content>
									{#snippet child({ props }: { props: SortableContentChildProps })}
										<Table.Body {...props as Record<string, unknown>} class={props.class}>
											{#each draggableRowsGrid.rows as row (row.id)}
												<Sortable.Item value={row.id}>
													{#snippet child({ props: rowProps }: { props: SortableItemChildProps })}
														<Table.Row
															{...rowProps as Record<string, unknown>}
															class={rowProps.class}
														>
															{#each row.getVisibleCells() as cell (cell.id)}
																<Table.Cell>
																	<DataTable.FlexRender
																		template={cell.column.columnDef.cell}
																		context={cell.getContext()}
																		fallback={String(cell.renderValue() ?? "")}
																	/>
																</Table.Cell>
															{/each}
														</Table.Row>
													{/snippet}
												</Sortable.Item>
											{/each}
										</Table.Body>
									{/snippet}
								</Sortable.Content>
							</Table.Root>
							<Sortable.Overlay>
								<div class="size-full bg-primary/10"></div>
							</Sortable.Overlay>
						</Sortable.Root>
					</div>
					<DataTable.Pagination table={draggableRowsGrid.table} pageSizeOptions={[10, 20]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Column resizing">
		{#snippet blurb()}
			`columnsResizable` — drag the trailing edge of a header, or focus it and use the arrow keys.
			Status opts out with <code>enableResizing: false</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full min-w-0 flex-col gap-2.5">
					{@render gridTable({ grid: resizableGrid, look: { resizable: true } })}
					<DataTable.Pagination table={resizableGrid.table} pageSizeOptions={[5, 10]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Pinnable columns">
		{#snippet blurb()}
			`columnsPinnable` plus `columnsResizable`. Name starts pinned to the leading edge; the sticky
			offsets and the edge shadow come from the data-table helper
			<code>getColumnPinningStyle</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full min-w-0 flex-col gap-2.5">
					{@render gridTable({ grid: pinnableGrid, look: { pinned: true, resizable: true } })}
					<DataTable.Pagination table={pinnableGrid.table} pageSizeOptions={[5, 10]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sticky header">
		{#snippet blurb()}
			`headerSticky` — the scroller is capped and the head row sticks to its top. The classic theme
			already fills the head with the page ground, so nothing shows through it while the rows pass
			under.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full min-w-0 flex-col gap-2.5">
					{@render gridTable({ grid: stickyHeaderGrid, look: { stickyHeader: true } })}
					<DataTable.Pagination table={stickyHeaderGrid.table} pageSizeOptions={[10, 20]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Column controls">
		{#snippet blurb()}
			All four switches at once — sort, move, pin, hide in the column menu, and a resize handle on
			every column that allows one. <code>DataTable.ViewOptions</code> brings a hidden column back.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full min-w-0 flex-col gap-2.5">
					<div class="flex justify-end">
						<DataTable.ViewOptions table={columnControlsGrid.table} />
					</div>
					{@render gridTable({
						grid: columnControlsGrid,
						look: { pinned: true, resizable: true },
					})}
					<DataTable.Pagination table={columnControlsGrid.table} pageSizeOptions={[5, 10]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="In-place loading skeleton">
		{#snippet blurb()}
			The head row, the column widths and the pagination bar all stay put while the cells are
			placeholders — that is the point of a skeleton, and it is why this section does not reach for
			<code>DataTable.Skeleton</code>, which replaces the whole table.
		{/snippet}
		<Card.Root>
			<Card.Header>
				<Card.Title>Employees</Card.Title>
				<Card.Action>
					<Button
						variant="outline"
						size="sm"
						onclick={() => (skeletonLoading = !skeletonLoading)}
						aria-pressed={skeletonLoading}
					>
						{skeletonLoading ? "Disable loading" : "Enable loading"}
					</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				<div class="flex w-full min-w-0 flex-col gap-2.5">
					<div class="overflow-hidden rounded-md border">
						<Table.Root
							class="table-fixed"
							style={`width: ${skeletonGrid.table.getTotalSize()}px; min-width: 100%;`}
						>
							<Table.Header>
								{#each skeletonGrid.headerGroups as headerGroup (headerGroup.id)}
									<Table.Row>
										{#each headerGroup.headers as header (header.id)}
											<Table.Head colspan={header.colSpan} style={`width: ${header.getSize()}px;`}>
												{#if !header.isPlaceholder}
													<DataTable.FlexRender
														template={header.column.columnDef.header}
														context={header.getContext()}
														fallback={header.column.columnDef.meta?.label ?? header.column.id}
													/>
												{/if}
											</Table.Head>
										{/each}
									</Table.Row>
								{/each}
							</Table.Header>
							<Table.Body>
								{#each skeletonGrid.rows as row (row.id)}
									<Table.Row>
										{#each row.getVisibleCells() as cell (cell.id)}
											<Table.Cell>
												{#if skeletonLoading}
													{@render loadingCell(cell.column.id)}
												{:else}
													<DataTable.FlexRender
														template={cell.column.columnDef.cell}
														context={cell.getContext()}
														fallback={String(cell.renderValue() ?? "")}
													/>
												{/if}
											</Table.Cell>
										{/each}
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
					<DataTable.Pagination table={skeletonGrid.table} pageSizeOptions={[5, 10]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="CRUD toolbar">
		{#snippet blurb()}
			The full working surface: a search box over every field, a status whitelist with per-status
			counts, row selection, and a per-row menu whose Copy ID entry reports through a toast. Edit
			and Delete are inert here, as they are upstream.
		{/snippet}
		<Card.Root>
			<Card.Header>
				{@render crudToolbar({
					idPrefix: "crud",
					search: crudSearch,
					onSearchChange: (next) => (crudSearch = next),
					statuses: crudStatuses,
					onStatusesChange: (next) => (crudStatuses = next),
				})}
				<Card.Action>
					<Button>
						<UserPlusIcon data-icon="inline-start" />
						Add new
					</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				{@render staffTable({ grid: crudGrid })}
			</Card.Content>
			<Card.Footer>
				<DataTable.Pagination table={crudGrid.table} pageSizeOptions={[5, 10]} class="w-full" />
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Column totals footer">
		{#snippet blurb()}
			A <code>&lt;tfoot&gt;</code> under the body: the label spans every column up to the balance, and
			the total is the whole set's, not the current page's.
		{/snippet}
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<TableIcon class="size-4 text-muted-foreground" />
					<span class="text-sm font-medium text-foreground">Employee balances</span>
				</div>
				<Card.Action>
					<Button variant="outline" size="sm">
						<DownloadIcon data-icon="inline-start" />
						Export
					</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				{@render staffTable({ grid: totalsGrid, footer: totalsFooter })}
			</Card.Content>
			<Card.Footer>
				<DataTable.Pagination table={totalsGrid.table} pageSizeOptions={[5, 10]} class="w-full" />
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Summary stats footer">
		{#snippet blurb()}
			Two footer rows instead of one — the balance range on top, the average and the active count
			under it.
		{/snippet}
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<ChartColumnIcon class="size-4 text-muted-foreground" />
					<span class="text-sm font-medium text-foreground">Team summary</span>
				</div>
				<Card.Action>
					<Button variant="outline" size="sm">
						<RefreshCwIcon data-icon="inline-start" />
						Refresh
					</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				{@render staffTable({ grid: summaryGrid, footer: summaryFooter })}
			</Card.Content>
			<Card.Footer>
				<DataTable.Pagination table={summaryGrid.table} pageSizeOptions={[5, 10]} class="w-full" />
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Per-column aggregate footer">
		{#snippet blurb()}
			One footer row, but each numeric column carries its own average with the range under it — so
			the footer reads column by column rather than as a single total.
		{/snippet}
		<Card.Root>
			<Card.Header>
				<Card.Title>Column aggregates</Card.Title>
				<Card.Action>
					<Button variant="outline" size="sm">
						<DownloadIcon data-icon="inline-start" />
						Export
					</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				{@render staffTable({ grid: aggregateGrid, footer: aggregateFooter })}
			</Card.Content>
			<Card.Footer>
				<DataTable.Pagination
					table={aggregateGrid.table}
					pageSizeOptions={[5, 10]}
					class="w-full"
				/>
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Local infinite scroll">
		{#snippet blurb()}
			Two hundred rows already in memory, revealed twenty at a time as the scroller nears its end.
			There is no virtualizer on the data-table side, so the window grows rather than sliding —
			which is what the demo's own title describes.
		{/snippet}
		<Card.Root>
			<Card.Header>
				<Card.Title>Directory</Card.Title>
				<Card.Action class="flex items-center gap-2">
					<Badge variant="secondary">{localRows.length} / {DIRECTORY_TOTAL}</Badge>
					<Button
						variant="outline"
						size="sm"
						onclick={() => (localVisibleCount = DIRECTORY_PAGE_SIZE)}
					>
						<RefreshCwIcon data-icon="inline-start" />
						Reset
					</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				{@render directoryTable({
					grid: localScrollGrid,
					hasMore: localHasMore,
					onNearEnd: loadMoreLocal,
				})}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Remote infinite scroll">
		{#snippet blurb()}
			The same scroller against a simulated server: reaching the end fires a request, the sentinel
			row spins for 800 ms, and the next page is appended. Start over cancels anything in flight.
		{/snippet}
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<CloudDownloadIcon class="size-4 text-muted-foreground" />
					<span class="text-sm font-medium text-foreground">Remote data</span>
					<Badge variant="secondary">{remoteRows.length} / {DIRECTORY_TOTAL}</Badge>
				</div>
				<Card.Action class="flex items-center gap-2">
					<Button variant="outline" size="sm" onclick={resetRemote}>
						<RefreshCwIcon data-icon="inline-start" />
						Start over
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Download snapshot"
						title="Download snapshot"
					>
						<DownloadIcon />
					</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content>
				{@render directoryTable({
					grid: remoteScrollGrid,
					hasMore: remoteHasMore,
					fetching: remoteFetching,
					onNearEnd: fetchMoreRemote,
				})}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Row pinning">
		{#snippet blurb()}
			table-core's row-pinning slice, held on the page because <code>createDataTable</code> owns
			seven slices and this is not one of them. With <code>keepPinnedRows</code> a pinned row stays above
			the body whichever page or sort would otherwise have dropped it.
		{/snippet}
		<Card.Root>
			<Card.Header>
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium text-foreground">Team members</span>
					{#if pinnedRowCount > 0}
						<Badge variant="primary-subtle">{pinnedRowCount} pinned</Badge>
					{/if}
				</div>
				<Card.Action>
					{#if pinnedRowCount > 0}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => (pinnedRows = { top: [], bottom: [] })}
						>
							Unpin all
						</Button>
					{/if}
				</Card.Action>
			</Card.Header>
			<Card.Content>
				<div class="flex w-full min-w-0 flex-col gap-2.5">
					<div class="overflow-hidden rounded-md border">
						<Table.Root
							class="table-fixed"
							style={`width: ${rowPinningGrid.table.getTotalSize()}px; min-width: 100%;`}
						>
							<Table.Header>
								{#each rowPinningGrid.headerGroups as headerGroup (headerGroup.id)}
									<Table.Row>
										{#each headerGroup.headers as header (header.id)}
											<Table.Head colspan={header.colSpan} style={`width: ${header.getSize()}px;`}>
												{#if !header.isPlaceholder}
													<DataTable.FlexRender
														template={header.column.columnDef.header}
														context={header.getContext()}
														fallback={header.column.columnDef.meta?.label ?? header.column.id}
													/>
												{/if}
											</Table.Head>
										{/each}
									</Table.Row>
								{/each}
							</Table.Header>
							<Table.Body>
								{#each rowPinningGrid.table.getTopRows() as row (row.id)}
									{@render pinnableRow(row, true)}
								{/each}
								{#each rowPinningGrid.table.getCenterRows() as row (row.id)}
									{@render pinnableRow(row, false)}
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
					<DataTable.Pagination table={rowPinningGrid.table} pageSizeOptions={[5, 10]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tree rows">
		{#snippet blurb()}
			Departments, their teams and their people in one table: <code>getSubRows</code> builds the
			tree, <code>getExpandedRowModel</code> flattens the open branches, and
			<code>paginateExpandedRows: false</code> keeps children on their parent's page — so the four rows
			a page holds are four departments, however many people they carry.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full min-w-0 flex-col gap-2.5">
					<div class="overflow-hidden rounded-md border">
						<Table.Root
							class="table-fixed"
							style={`width: ${orgGrid.table.getTotalSize()}px; min-width: 100%;`}
						>
							<Table.Header>
								{#each orgGrid.headerGroups as headerGroup (headerGroup.id)}
									<Table.Row>
										{#each headerGroup.headers as header (header.id)}
											<Table.Head colspan={header.colSpan} style={`width: ${header.getSize()}px;`}>
												{#if !header.isPlaceholder}
													<DataTable.FlexRender
														template={header.column.columnDef.header}
														context={header.getContext()}
														fallback={header.column.columnDef.meta?.label ?? header.column.id}
													/>
												{/if}
											</Table.Head>
										{/each}
									</Table.Row>
								{/each}
							</Table.Header>
							<Table.Body>
								{#each orgGrid.rows as row (row.id)}
									<Table.Row>
										{#each row.getVisibleCells() as cell (cell.id)}
											<Table.Cell>
												<DataTable.FlexRender
													template={cell.column.columnDef.cell}
													context={cell.getContext()}
													fallback={String(cell.renderValue() ?? "")}
												/>
											</Table.Cell>
										{/each}
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
					<DataTable.Pagination table={orgGrid.table} pageSizeOptions={[4, 8, 16]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">createDataTable(options)</h3>
			<p class="text-sm text-muted-foreground">
				Creates the table instance and the seven writable state slices. Call it during component
				initialisation.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Option</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each createOptions as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">DataTable.Root</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each rootProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Parts</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Part</Table.Head>
								<Table.Head>Props</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each partProps as row (row.part)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.part}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Data Attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Part</Table.Head>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>Value</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (row.part + row.attribute)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.part}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.attribute}</Table.Cell>
									<Table.Cell>{row.value}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
