<script lang="ts">
	import type { CellContext, HeaderContext, Table as TanstackTable } from "@tanstack/table-core";
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import CheckCircle2Icon from "@lucide/svelte/icons/check-circle-2";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import CircleDashedIcon from "@lucide/svelte/icons/circle-dashed";
	import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
	import EllipsisVerticalIcon from "@lucide/svelte/icons/ellipsis-vertical";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import Rows2Icon from "@lucide/svelte/icons/rows-2";
	import Rows3Icon from "@lucide/svelte/icons/rows-3";
	import Rows4Icon from "@lucide/svelte/icons/rows-4";
	import SearchIcon from "@lucide/svelte/icons/search";
	import SlidersHorizontalIcon from "@lucide/svelte/icons/sliders-horizontal";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import XCircleIcon from "@lucide/svelte/icons/x-circle";
	import XIcon from "@lucide/svelte/icons/x";

	import * as ActionBar from "$lib/components/ui/action-bar/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import * as DataTable from "$lib/components/ui/data-table/index.js";
	import { createDataTable, type DataTableColumnDef } from "$lib/components/ui/data-table/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import TablesInCardsTable from "$lib/components/pages/tables-in-cards-table.svelte";
	import { getInitials } from "$lib/shared/get-initials.js";
	import { cn } from "$lib/utils.js";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * Tables in cards — the classic theme's list pages stated as a pattern, skinned against
	 * `crm-companies.html`'s Companies card (`#companiesList`). There a table never stands
	 * alone: it sits in a `.card` whose header row holds a flush search field, a per-page
	 * select and a `.dropdown-menu-card` filter, whose
	 * `.table-sm.table-hover.table-nowrap.card-table` runs flush to the card's edges, and whose
	 * `.card-footer` is the `.pagination-tabs.card-pagination` Prev / numbers / Next row.
	 * list.js wires search, sort, selection and pagination client-side there (`data-list` on
	 * the card); here the same behaviours ride `createDataTable` (`@tanstack/table-core`) — the
	 * engine the Data table and Data grid pages already use. The second and third cards
	 * re-house those pages' own demos ("Toolbar, filters and row selection" and "Data grid with
	 * movable columns") between a card header and a card footer.
	 *
	 * NO PHOTOGRAPHS. The classic theme's name and owner cells load avatar JPEGs; this repository ships
	 * no images (the Page headers page states the rule), so avatars fall back to initials.
	 *
	 * Divergences:
	 * D-01 — sort headers show the sort direction. The classic theme's `.list-sort` glyph is a static
	 *        double arrow that never changes; the house recipe (Data table page, "Plain
	 *        sortable headers") is kept instead.
	 * D-02 — the filter dropdown filters. The reference's Title and Lead score selects are
	 *        wired to nothing; here Industry and Owner actually narrow the rows, and the badge
	 *        on the button counts the applied filters — the reference hard-codes "1".
	 * D-03 — the bulk-selection bar is the house Action bar. The classic theme floats its own
	 *        `.list-alert` over the viewport for the same job: a count, Edit and Delete, and a
	 *        close that clears every checkbox.
	 * D-04 — Prev and Next disable and fade at the boundaries. The reference's list.js leaves
	 *        them looking like live links whose clicks do nothing on the first and last page;
	 *        the house disabled treatment says so instead.
	 */
	const self = href("/components/tables-in-cards");

	// --- CRM companies -------------------------------------------------------------------------

	type Company = {
		id: string;
		name: string;
		industry: string;
		location: string;
		owner: string;
		createdAt: number;
	};

	/** All dates are 2020, like the reference's. */
	function day(month: number, date: number): number {
		return new Date(2020, month - 1, date).getTime();
	}

	/**
	 * The reference's own eight rows first (it repeats them verbatim to fill its pages), then
	 * sixteen more in the same register, so search, sort and three pages of pagination all have
	 * something real to do.
	 */
	const companies: Company[] = [
		{
			id: "1",
			name: "Launchday",
			industry: "Web design",
			location: "Los Angeles, CA",
			owner: "Dianna Smiley",
			createdAt: day(1, 14),
		},
		{
			id: "2",
			name: "Medium Corporation",
			industry: "Publishing",
			location: "San Francisco, CA",
			owner: "Ab Hadley",
			createdAt: day(3, 22),
		},
		{
			id: "3",
			name: "Lyft",
			industry: "Transportation",
			location: "San Francisco, CA",
			owner: "Adolfo Hess",
			createdAt: day(4, 1),
		},
		{
			id: "4",
			name: "PayPal",
			industry: "Finance",
			location: "San Jose, CA",
			owner: "Daniela Dewitt",
			createdAt: day(5, 9),
		},
		{
			id: "5",
			name: "Dropbox Inc.",
			industry: "File hosting",
			location: "San Francisco, CA",
			owner: "Miyah Myles",
			createdAt: day(6, 16),
		},
		{
			id: "6",
			name: "Squarespace",
			industry: "Hosting",
			location: "New York City",
			owner: "Ryu Duke",
			createdAt: day(8, 22),
		},
		{
			id: "7",
			name: "Github",
			industry: "Hosting",
			location: "Redmond, WA",
			owner: "Glen Rouse",
			createdAt: day(3, 5),
		},
		{
			id: "8",
			name: "Slack",
			industry: "Messaging",
			location: "San Francisco, CA",
			owner: "Miyah Myles",
			createdAt: day(4, 30),
		},
		{
			id: "9",
			name: "Stripe",
			industry: "Finance",
			location: "San Francisco, CA",
			owner: "Dianna Smiley",
			createdAt: day(2, 3),
		},
		{
			id: "10",
			name: "Notion",
			industry: "Productivity",
			location: "New York City",
			owner: "Ab Hadley",
			createdAt: day(7, 27),
		},
		{
			id: "11",
			name: "Figma",
			industry: "Web design",
			location: "San Francisco, CA",
			owner: "Adolfo Hess",
			createdAt: day(9, 10),
		},
		{
			id: "12",
			name: "Airtable",
			industry: "Productivity",
			location: "San Francisco, CA",
			owner: "Daniela Dewitt",
			createdAt: day(10, 5),
		},
		{
			id: "13",
			name: "Netflix",
			industry: "Streaming",
			location: "Los Gatos, CA",
			owner: "Ryu Duke",
			createdAt: day(1, 30),
		},
		{
			id: "14",
			name: "Spotify",
			industry: "Streaming",
			location: "New York City",
			owner: "Glen Rouse",
			createdAt: day(11, 12),
		},
		{
			id: "15",
			name: "Asana",
			industry: "Productivity",
			location: "San Francisco, CA",
			owner: "Miyah Myles",
			createdAt: day(2, 18),
		},
		{
			id: "16",
			name: "Intercom",
			industry: "Messaging",
			location: "San Francisco, CA",
			owner: "Dianna Smiley",
			createdAt: day(6, 2),
		},
		{
			id: "17",
			name: "Twilio",
			industry: "Messaging",
			location: "San Francisco, CA",
			owner: "Ab Hadley",
			createdAt: day(8, 7),
		},
		{
			id: "18",
			name: "Shopify",
			industry: "E-commerce",
			location: "Ottawa, ON",
			owner: "Adolfo Hess",
			createdAt: day(3, 19),
		},
		{
			id: "19",
			name: "Zoom",
			industry: "Communications",
			location: "San Jose, CA",
			owner: "Daniela Dewitt",
			createdAt: day(5, 25),
		},
		{
			id: "20",
			name: "Mailchimp",
			industry: "Marketing",
			location: "Atlanta, GA",
			owner: "Ryu Duke",
			createdAt: day(7, 8),
		},
		{
			id: "21",
			name: "Vimeo",
			industry: "Streaming",
			location: "New York City",
			owner: "Glen Rouse",
			createdAt: day(9, 3),
		},
		{
			id: "22",
			name: "Trello",
			industry: "Productivity",
			location: "New York City",
			owner: "Miyah Myles",
			createdAt: day(10, 21),
		},
		{
			id: "23",
			name: "Segment",
			industry: "Analytics",
			location: "San Francisco, CA",
			owner: "Dianna Smiley",
			createdAt: day(11, 2),
		},
		{
			id: "24",
			name: "Heap",
			industry: "Analytics",
			location: "San Francisco, CA",
			owner: "Ab Hadley",
			createdAt: day(12, 11),
		},
	];

	/** "Jan 14, 2020" — the reference zero-pads the day ("Apr 01, 2020"), hence `2-digit`. */
	const companyDate = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric",
	});

	/** The filter dropdown's option lists, read from the data rather than maintained beside it. */
	const companyIndustries = [...new Set(companies.map((company) => company.industry))].sort();
	const companyOwners = [...new Set(companies.map((company) => company.owner))].sort();

	let companySearch = $state("");

	let filtersOpen = $state(false);
	/** What Apply committed — these narrow the rows and the button badge counts them. */
	let industryFilter = $state("any");
	let ownerFilter = $state("any");
	/** What the dropdown currently shows — committed on Apply, re-seeded on open (divergence D-02). */
	let pendingIndustry = $state("any");
	let pendingOwner = $state("any");

	const appliedCompanyFilters = $derived(
		(industryFilter === "any" ? 0 : 1) + (ownerFilter === "any" ? 0 : 1),
	);

	/**
	 * list.js's whole `data-list` contract in one derivation: the search input matches a
	 * substring of any `valueNames` field — the formatted date included, since the reference
	 * searches the cell text — and the committed filters narrow first. Filtering BEFORE the
	 * table (the `data` option is a getter, so this re-runs reactively) rather than through
	 * TanStack's own filter state keeps the search global across columns without a filterFn per
	 * column.
	 */
	const visibleCompanies = $derived.by(() => {
		const query = companySearch.trim().toLowerCase();
		return companies.filter((company) => {
			if (industryFilter !== "any" && company.industry !== industryFilter) return false;
			if (ownerFilter !== "any" && company.owner !== ownerFilter) return false;
			if (query === "") return true;
			return [
				company.name,
				company.industry,
				company.location,
				company.owner,
				companyDate.format(company.createdAt),
			].some((field) => field.toLowerCase().includes(query));
		});
	});

	const crmColumns: DataTableColumnDef<Company>[] = [
		{
			id: "select",
			header: companySelectHeader,
			cell: companySelectCell,
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "name",
			accessorKey: "name",
			header: companySortHeader,
			cell: companyNameCell,
			meta: { label: "Name" },
		},
		{
			id: "industry",
			accessorKey: "industry",
			header: companySortHeader,
			meta: { label: "Industry" },
		},
		{
			id: "location",
			accessorKey: "location",
			header: companySortHeader,
			meta: { label: "Location" },
		},
		{
			id: "owner",
			accessorKey: "owner",
			header: companySortHeader,
			cell: companyOwnerCell,
			meta: { label: "Owner" },
		},
		{
			id: "created",
			accessorKey: "createdAt",
			header: companySortHeader,
			cell: companyCreatedCell,
			meta: { label: "Created at" },
		},
		{
			id: "actions",
			// Blank, like the reference's colspan-absorbed actions column — `FlexRender` would
			// otherwise fall back to the column id as visible text.
			header: "",
			cell: companyActionsCell,
			enableSorting: false,
			enableHiding: false,
		},
	];

	/**
	 * Which columns survive at which CARD width — the container-query half of the recipe.
	 *
	 * The seven columns want 898px together (40 + 204 + 131 + 153 + 161 + 137 + 72, measured at
	 * the default density). The card in this gallery gets 639px, so three of them have nowhere to
	 * go, and a horizontally scrolling table is a worse answer than showing what fits: `owner` is
	 * the column the selection and the row actions are read against, `created` the one nobody
	 * sorts by twice.
	 *
	 * Each threshold is the width the table actually NEEDS once that column returns, rounded up to
	 * the next half rem: 608 for name + industry + owner (38rem), 761 with location (48rem), 898
	 * with created at (57rem). Arbitrary steps rather than the named `@2xl` / `@3xl` / `@4xl`,
	 * because the named ones sit 30–60px above the real minimums and would leave a column hidden
	 * across a band where it fitted — the point of the exercise is that the column goes exactly
	 * when the room does. They are measured against THIS dataset; a card fed longer names wants
	 * them re-measured.
	 *
	 * `hidden` and `table-cell` rather than a `display` toggle of our own — a `<td>` that comes
	 * back as anything but `table-cell` leaves the row a column short.
	 *
	 * `select`, `name` and `actions` carry no entry: the checkbox, the thing being named and the
	 * row menu are the table, not its detail.
	 */
	const crmColumnClass: Record<string, string> = {
		industry: "hidden @min-[38rem]:table-cell",
		location: "hidden @min-[48rem]:table-cell",
		created: "hidden @min-[57rem]:table-cell",
	};

	const crm = createDataTable<Company>({
		data: () => visibleCompanies,
		columns: () => crmColumns,
		getRowId: (row) => row.id,
		initialState: { pagination: { pageSize: 10 } },
	});

	const crmPage = $derived(crm.table.getState().pagination.pageIndex + 1);

	/** The reference's per-page select, wired for real — the reference's own is a decorative boxed select widget. */
	const companyPageSizes = [
		{ value: "5", label: "5 per page" },
		{ value: "10", label: "10 per page" },
		{ value: "all", label: "All" },
	];

	let companyPageSize = $state("10");

	const companyPageSizeLabel = $derived(
		companyPageSizes.find((option) => option.value === companyPageSize)?.label ?? "10 per page",
	);

	function setCompanyPageSize(value: string) {
		companyPageSize = value;
		crm.table.setPageSize(value === "all" ? companies.length : Number(value));
	}

	function onFiltersOpenChange(open: boolean) {
		filtersOpen = open;
		// Re-seed the dropdown from what is committed, so selections abandoned by closing the
		// popover do not resurface as ghosts on the next open.
		if (open) {
			pendingIndustry = industryFilter;
			pendingOwner = ownerFilter;
		}
	}

	function applyCompanyFilters() {
		industryFilter = pendingIndustry;
		ownerFilter = pendingOwner;
		filtersOpen = false;
		crm.table.setPageIndex(0);
	}

	function clearCompanyFilters() {
		pendingIndustry = "any";
		pendingOwner = "any";
		industryFilter = "any";
		ownerFilter = "any";
		crm.table.setPageIndex(0);
	}

	/**
	 * What the action bar shows and clears: the WHOLE selection, not the slice the current
	 * search leaves visible. The classic theme counts every checked `.list-checkbox`, hidden by the
	 * search or not, and its close unchecks them all — so the count reads the raw
	 * `rowSelection` (the `selectedRowCount` helper intersects with the filtered rows, and
	 * would collapse the bar the moment a search hides the checked rows without clearing
	 * anything), and the close is `resetRowSelection`, which also reaches ids the narrowed
	 * row model no longer contains where `toggleAllRowsSelected(false)` would not.
	 */
	const crmSelectedCount = $derived(Object.keys(crm.rowSelection).length);

	function onCompanySelectionOpenChange(open: boolean) {
		if (!open) crm.table.resetRowSelection();
	}

	/**
	 * `.input-group-flush.input-group-merge.input-group-reverse` — the header search is a bare
	 * magnifier-and-placeholder line: the reference stylesheet keeps the input's border and
	 * background but paints both transparent, focus included, so nothing here draws a field.
	 * `text-base` is 15px (`font-size-base`, remapped in `app.css`); the placeholder takes
	 * `input-placeholder-color`, the muted ink.
	 */
	const flushSearch =
		"w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground";

	/** `.form-select-sm.form-control-flush` — the per-page select as borderless text. */
	const flushSelectTrigger = "border-0 bg-transparent shadow-none dark:bg-transparent";

	/**
	 * `.pagination-tabs.card-pagination` — quiet 15px links on a 60px row: `pagination-tabs-*`
	 * colours them gray-600, hovers them to the body ink, and underlines the active page with
	 * 1px of primary that `.card-pagination`'s -1rem margins drop onto the card's bottom edge.
	 * Here the 60px row IS the footer (`Card.Footer` brings no vertical padding of its own), so
	 * the underline lands on the edge without the margin trick.
	 */
	const pageLink =
		"flex h-[60px] items-center text-base text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50";
	const pageNumber = "border-b border-transparent px-3";
	const pageNumberActive = "border-primary text-foreground";

	// --- Data table with toolbar and filters -----------------------------------------------------

	// The Data table page's "Toolbar, filters and row selection" demo, verbatim where possible:
	// same rows, same column defs, same filter variants. What changes is only the housing.

	type Project = {
		id: string;
		title: string;
		status: "active" | "paused" | "inactive";
		priority: "low" | "medium" | "high";
		budget: number;
	};

	const projects: Project[] = [
		{ id: "1", title: "Project Alpha", status: "active", priority: "high", budget: 50000 },
		{ id: "2", title: "Project Beta", status: "inactive", priority: "low", budget: 75000 },
		{ id: "3", title: "Project Gamma", status: "active", priority: "medium", budget: 25000 },
		{ id: "4", title: "Project Delta", status: "paused", priority: "high", budget: 100000 },
		{ id: "5", title: "Project Epsilon", status: "active", priority: "low", budget: 18000 },
		{ id: "6", title: "Project Zeta", status: "inactive", priority: "medium", budget: 62000 },
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

	const projectColumns: DataTableColumnDef<Project>[] = [
		{
			id: "select",
			header: projectSelectHeader,
			cell: projectSelectCell,
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "title",
			accessorKey: "title",
			header: projectHeader,
			enableColumnFilter: true,
			meta: { label: "Title", placeholder: "Search titles...", variant: "text" },
		},
		{
			id: "status",
			accessorKey: "status",
			header: projectHeader,
			cell: projectStatusCell,
			enableColumnFilter: true,
			filterFn: (row, columnId, filterValue) =>
				Array.isArray(filterValue) && filterValue.includes(row.getValue(columnId)),
			meta: { label: "Status", variant: "multiSelect", options: statusOptions },
		},
		{
			id: "priority",
			accessorKey: "priority",
			header: projectHeader,
			cell: projectPriorityCell,
			enableColumnFilter: true,
			filterFn: (row, columnId, filterValue) =>
				Array.isArray(filterValue) && filterValue.includes(row.getValue(columnId)),
			meta: { label: "Priority", variant: "select", options: priorityOptions },
		},
		{
			id: "budget",
			accessorKey: "budget",
			header: projectHeader,
			cell: projectBudgetCell,
			enableColumnFilter: true,
			// The `number` variant writes the raw input string, so the comparison is stringified.
			filterFn: (row, columnId, filterValue) =>
				filterValue === "" || String(row.getValue(columnId)) === String(filterValue),
			meta: { label: "Budget", placeholder: "Budget", variant: "number", unit: "USD" },
		},
	];

	const projectsTable = createDataTable<Project>({
		data: () => projects,
		columns: () => projectColumns,
		getRowId: (row) => row.id,
		initialState: { pagination: { pageSize: 4 } },
	});

	// --- Data grid with movable columns ----------------------------------------------------------

	// The Data grid page's "Data grid with movable columns" demo,
	// trimmed to the fields its four columns actually read.

	type TeamMember = {
		id: string;
		name: string;
		email: string;
		company: string;
		role: string;
		status: "active" | "inactive";
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

	const teamMembers: TeamMember[] = TEAM_NAMES.map((name, index) => ({
		id: String(index + 1),
		name,
		email: `${name.split(" ")[0]!.toLowerCase()}@example.com`,
		company: TEAM_COMPANIES[index % TEAM_COMPANIES.length]!,
		role: TEAM_ROLES[index % TEAM_ROLES.length]!,
		status: index % 2 === 0 ? "active" : "inactive",
	}));

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
	 * The column-move menu entries: swap a column with its neighbour. Writing the
	 * resolved order back — rather than a sparse one — keeps the first move from reordering
	 * everything else.
	 */
	function moveColumn(table: TanstackTable<TeamMember>, columnId: string, delta: number): void {
		if (!getCanMoveColumn(table, columnId, delta)) return;
		const order = getResolvedColumnOrder(table);
		const index = order.indexOf(columnId);
		const next = index + delta;
		[order[index], order[next]] = [order[next]!, order[index]!];
		table.setColumnOrder(order);
	}

	const movableColumns: DataTableColumnDef<TeamMember>[] = [
		{
			id: "name",
			accessorKey: "name",
			header: movableHeader,
			cell: memberCell,
			meta: { label: "Staff" },
			enableHiding: false,
		},
		{
			id: "company",
			accessorKey: "company",
			header: movableHeader,
			meta: { label: "Company" },
			enableHiding: false,
		},
		{
			id: "role",
			accessorKey: "role",
			header: movableHeader,
			meta: { label: "Occupation" },
			enableHiding: false,
		},
		{
			id: "status",
			accessorKey: "status",
			header: movableHeader,
			cell: teamStatusCell,
			meta: { label: "Status" },
			enableSorting: false,
			enableHiding: false,
		},
	];

	const movableGrid = createDataTable<TeamMember>({
		data: () => teamMembers,
		columns: () => movableColumns,
		getRowId: (row) => row.id,
		enableRowSelection: false,
		initialState: {
			sorting: [{ id: "name", desc: true }],
			pagination: { pageSize: 5 },
			columnOrder: ["name", "company", "role", "status"],
		},
	});

	// --- Row density ----------------------------------------------------------------------------

	/**
	 * The density card's own table state — not {@link movableGrid}, whose column order one card
	 * should not move for the other. No header snippets: `FlexRender` falls back to
	 * `meta.label`, which is all a plain head needs. Single-line cells on purpose (no
	 * {@link memberCell}): a tier's height is a MINIMUM, and the two-line identity stack would
	 * hold the `sm` rows at ~49px — with one-line content the switcher shows the three floors
	 * exactly.
	 */
	const densityColumns: DataTableColumnDef<TeamMember>[] = [
		{ id: "name", accessorKey: "name", meta: { label: "Staff" } },
		{ id: "company", accessorKey: "company", meta: { label: "Company" } },
		{ id: "role", accessorKey: "role", meta: { label: "Occupation" } },
		{ id: "status", accessorKey: "status", cell: teamStatusCell, meta: { label: "Status" } },
	];

	const densityGrid = createDataTable<TeamMember>({
		data: () => teamMembers,
		columns: () => densityColumns,
		getRowId: (row) => row.id,
		enableRowSelection: false,
		initialState: { pagination: { pageSize: 5 } },
	});

	/**
	 * The switcher's value. bits-ui's single toggle group deselects on a second press and
	 * writes back an empty string — which would blank every button while the table quietly
	 * reverted to `default`, a click on `lg` making the table less lg. The function binding's
	 * setter refuses the empty write, so one tier is always pressed and the control and the
	 * table cannot diverge.
	 */
	let teamDensity = $state<"sm" | "default" | "lg">("default");
</script>

<!-- The selection column recipe from the Data table page: a header checkbox that goes
	indeterminate while only some of the page's rows are selected, a checkbox per row. -->
{#snippet companySelectHeader(ctx: HeaderContext<Company, unknown>)}
	<Checkbox
		aria-label="Select all"
		bind:checked={
			() => ctx.table.getIsAllPageRowsSelected(),
			(next) => ctx.table.toggleAllPageRowsSelected(next)
		}
		bind:indeterminate={() => ctx.table.getIsSomePageRowsSelected(), () => {}}
	/>
{/snippet}

{#snippet companySelectCell(ctx: CellContext<Company, unknown>)}
	<Checkbox
		aria-label="Select row"
		bind:checked={() => ctx.row.getIsSelected(), (next) => ctx.row.toggleSelected(next)}
	/>
{/snippet}

<!-- The classic theme's `.list-sort` is a muted link that toggles asc/desc; the ghost-button recipe from
	the Data table page's "Plain sortable headers" carries the same gesture (divergence D-01).
	The head scale is restated on the button — `text-xs` here is 13px and `font-semibold` 600,
	the same values `app.css`'s table-head port gives plain text heads — because the Button's
	own 15px/500 would otherwise override what the `<th>` inherits. -->
{#snippet companySortHeader(ctx: HeaderContext<Company, unknown>)}
	{@const sorted = ctx.column.getIsSorted()}
	<Button
		variant="ghost"
		size="sm"
		class="-ms-2.5 h-6 px-2.5 text-xs font-semibold [&_svg]:text-muted-foreground"
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

<!-- `.avatar.avatar-xs` + `a.item-name.text-reset`: the identity cell, initials instead of the
	reference's JPEG, and the link taking the primary ink on hover as `.table a[class*='text-reset']`
	does. -->
{#snippet companyNameCell(ctx: CellContext<Company, unknown>)}
	{@const company = ctx.row.original}
	<div class="flex items-center gap-2">
		<Avatar.Root size="sm">
			<Avatar.Fallback>{getInitials(company.name)}</Avatar.Fallback>
		</Avatar.Root>
		<a href={self} class="text-foreground transition-colors hover:text-primary">
			{company.name}
		</a>
	</div>
{/snippet}

{#snippet companyOwnerCell(ctx: CellContext<Company, unknown>)}
	{@const company = ctx.row.original}
	<div class="flex items-center gap-2">
		<Avatar.Root size="sm">
			<Avatar.Fallback>{getInitials(company.owner)}</Avatar.Fallback>
		</Avatar.Root>
		<a href={self} class="text-foreground transition-colors hover:text-primary">
			{company.owner}
		</a>
	</div>
{/snippet}

{#snippet companyCreatedCell(ctx: CellContext<Company, unknown>)}
	{@const createdAt = ctx.row.original.createdAt}
	<time datetime={new Date(createdAt).toISOString().slice(0, 10)}>
		{companyDate.format(createdAt)}
	</time>
{/snippet}

<!-- `.dropdown-ellipses` — the quiet vertical-ellipsis menu closing every row. -->
{#snippet companyActionsCell(ctx: CellContext<Company, unknown>)}
	<div class="text-right">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon-sm"
						class="text-muted-foreground"
						aria-label={`Open ${ctx.row.original.name} menu`}
					>
						<EllipsisVerticalIcon />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item>View details</DropdownMenu.Item>
				<DropdownMenu.Item>Edit</DropdownMenu.Item>
				<DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
{/snippet}

{#snippet projectSelectHeader(ctx: HeaderContext<Project, unknown>)}
	<Checkbox
		aria-label="Select all"
		bind:checked={
			() => ctx.table.getIsAllPageRowsSelected(),
			(next) => ctx.table.toggleAllPageRowsSelected(next)
		}
		bind:indeterminate={() => ctx.table.getIsSomePageRowsSelected(), () => {}}
	/>
{/snippet}

{#snippet projectSelectCell(ctx: CellContext<Project, unknown>)}
	<Checkbox
		aria-label="Select row"
		bind:checked={() => ctx.row.getIsSelected(), (next) => ctx.row.toggleSelected(next)}
	/>
{/snippet}

<!-- One header snippet for all four columns where the source page wrote one per column: every
	column carries `meta.label`, which is all `ColumnHeader` needs. -->
{#snippet projectHeader(ctx: HeaderContext<Project, unknown>)}
	<DataTable.ColumnHeader
		column={ctx.column}
		label={ctx.column.columnDef.meta?.label ?? ctx.column.id}
	/>
{/snippet}

{#snippet projectStatusCell(ctx: CellContext<Project, unknown>)}
	{@const status = ctx.row.original.status}
	{@const Icon = statusIcons[status]}
	<Badge variant="outline" class="capitalize">
		<Icon />
		{status}
	</Badge>
{/snippet}

{#snippet projectPriorityCell(ctx: CellContext<Project, unknown>)}
	{@const priority = ctx.row.original.priority}
	{@const Icon = priorityIcons[priority]}
	<span class="flex items-center gap-1.5 capitalize">
		<Icon class="size-4 text-muted-foreground" />
		{priority}
	</span>
{/snippet}

{#snippet projectBudgetCell(ctx: CellContext<Project, unknown>)}
	<span class="flex items-center gap-1">
		<DollarSignIcon class="size-4 text-muted-foreground" />
		{ctx.row.original.budget.toLocaleString("en-US")}
	</span>
{/snippet}

{#snippet memberCell(ctx: CellContext<TeamMember, unknown>)}
	{@const member = ctx.row.original}
	<div class="flex items-center gap-3">
		<Avatar.Root>
			<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
		</Avatar.Root>
		<!--
			`leading-5` keeps the two-line stack inside the uniform 56px row (`app.css`'s table
			height rule): 2 × 20px sits under the 40px an avatar occupies, where the default
			leading measured 45px and pushed the row past every other table's.
		-->
		<div class="flex min-w-0 flex-col leading-5">
			<span class="truncate font-medium text-foreground">{member.name}</span>
			<span class="truncate text-muted-foreground">{member.email}</span>
		</div>
	</div>
{/snippet}

{#snippet teamStatusCell(ctx: CellContext<TeamMember, unknown>)}
	{#if ctx.row.original.status === "active"}
		<Badge variant="success-subtle">Approved</Badge>
	{:else}
		<Badge variant="warning-subtle">Pending</Badge>
	{/if}
{/snippet}

<!-- The source demo's column menu, kept to the branches this card exercises: sort, and the two
	`columnsMovable` entries that swap neighbours in table-core's `columnOrder`. -->
{#snippet movableHeader(ctx: HeaderContext<TeamMember, unknown>)}
	{@const column = ctx.column}
	{@const sorted = column.getIsSorted()}
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
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

<DocPage title="Tables in cards">
	{#snippet subtitle()}
		A list page is never a bare table: the table lives in a card, with the search field and filters
		in the card header, the rows flush to the card's edges, and the pager in the card footer. This
		page states that pattern with the house engines: the
		<a class="text-primary underline underline-offset-3" href={href("/components/data-table")}
			>Data table</a
		>'s toolbar demo and the
		<a class="text-primary underline underline-offset-3" href={href("/components/data-grid")}
			>Data grid</a
		>'s movable-columns demo, each re-housed between a card header and a card footer.
	{/snippet}

	<DocSection title="CRM companies">
		{#snippet blurb()}
			The Companies card from <code>crm-companies.html</code>: flush search, a per-page select and
			an applied-filters dropdown in the header; sortable columns; checkbox selection driving a
			floating action bar; the Prev / numbers / Next pager in the footer. The reference's list.js
			search, sort and pagination are TanStack's here.
		{/snippet}
		<!--
			`@container` makes the CARD the yardstick for the columns below, and it has to be: the
			viewport is not the width the table gets. The rail spends 250px of it, and the card
			itself is narrower again, so `lg:` / `xl:` would keep a column long after the space for
			it was gone — and now that the canvas can no longer be widened from inside (see the
			`sidebar-inset` rule in app.css), the price is a table that scrolls in its own box
			rather than a page that fits. Asking the card how wide IT is drops each column exactly
			when the card can no longer hold it.
		-->
		<Card.Root class="@container gap-0 py-0">
			<Card.Header class="flex items-center gap-4">
				<div class="flex min-w-0 flex-1 items-center gap-3" role="search">
					<SearchIcon class="size-4 shrink-0 text-muted-foreground" />
					<input
						type="search"
						name="company-search"
						placeholder="Search"
						aria-label="Search companies"
						class={flushSearch}
						bind:value={companySearch}
						oninput={() => crm.table.setPageIndex(0)}
					/>
				</div>
				<Select.Root type="single" value={companyPageSize} onValueChange={setCompanyPageSize}>
					<Select.Trigger size="sm" class={flushSelectTrigger} aria-label="Rows per page">
						{companyPageSizeLabel}
					</Select.Trigger>
					<Select.Content align="end">
						{#each companyPageSizes as option (option.value)}
							<Select.Item value={option.value} label={option.label} />
						{/each}
					</Select.Content>
				</Select.Root>
				<Popover.Root open={filtersOpen} onOpenChange={onFiltersOpenChange}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" size="sm">
								<SlidersHorizontalIcon data-icon="inline-start" />
								Filter
								{#if appliedCompanyFilters > 0}
									<Badge class="px-1.5">{appliedCompanyFilters}</Badge>
								{/if}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<!-- `.dropdown-menu-card`: a 350px dropdown whose panel is a card — its own
						header row, then a body of label + select rows and the Apply button. -->
					<Popover.Content align="end" class="w-[350px] p-0">
						<div class="flex min-h-[50px] items-center justify-between border-b px-6 py-2">
							<h4 class="text-base font-medium">Filters</h4>
							<Button
								variant="link"
								size="sm"
								class="h-auto p-0 text-xs font-normal text-foreground"
								onclick={clearCompanyFilters}
							>
								Clear filters
							</Button>
						</div>
						<div class="p-6">
							<div class="flex items-center justify-between gap-4 border-b pb-3">
								<span class="text-sm">Industry</span>
								<Select.Root type="single" bind:value={pendingIndustry}>
									<Select.Trigger size="sm" class="w-40" aria-label="Filter by industry">
										{pendingIndustry === "any" ? "Any" : pendingIndustry}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="any" label="Any" />
										{#each companyIndustries as industry (industry)}
											<Select.Item value={industry} label={industry} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div class="flex items-center justify-between gap-4 py-3">
								<span class="text-sm">Owner</span>
								<Select.Root type="single" bind:value={pendingOwner}>
									<Select.Trigger size="sm" class="w-40" aria-label="Filter by owner">
										{pendingOwner === "any" ? "Any" : pendingOwner}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="any" label="Any" />
										{#each companyOwners as owner (owner)}
											<Select.Item value={owner} label={owner} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<Button class="mt-3 w-full" onclick={applyCompanyFilters}>Apply filter</Button>
						</div>
					</Popover.Content>
				</Popover.Root>
			</Card.Header>
			<TablesInCardsTable grid={crm} columnClass={crmColumnClass} />
			<!-- The rule above this footer is the last row's restored border (the helper documents
				why it, not the footer, carries the line). -->
			<Card.Footer class="justify-between">
				<button
					type="button"
					class={cn(pageLink, "gap-2 border-e pe-6")}
					disabled={!crm.table.getCanPreviousPage()}
					onclick={() => crm.table.previousPage()}
				>
					<ArrowLeftIcon class="size-4" />
					Prev
				</button>
				<ul class="flex items-center">
					{#each Array.from({ length: crm.pageCount }, (_, i) => i + 1) as page (page)}
						<li>
							<button
								type="button"
								class={cn(pageLink, pageNumber, page === crmPage && pageNumberActive)}
								aria-current={page === crmPage ? "page" : undefined}
								aria-label={`Go to page ${page}`}
								onclick={() => crm.table.setPageIndex(page - 1)}
							>
								{page}
							</button>
						</li>
					{/each}
				</ul>
				<button
					type="button"
					class={cn(pageLink, "gap-2 border-s ps-6")}
					disabled={!crm.table.getCanNextPage()}
					onclick={() => crm.table.nextPage()}
				>
					Next
					<ArrowRightIcon class="size-4" />
				</button>
			</Card.Footer>
		</Card.Root>
		<!-- The classic theme's `.list-alert`, played by the house Action bar (divergence D-03): floats
			while rows are checked, counts them, and its close clears the selection. -->
		<ActionBar.Root open={crmSelectedCount > 0} onOpenChange={onCompanySelectionOpenChange}>
			<ActionBar.Selection>
				{crmSelectedCount} selected
				<ActionBar.Separator />
				<ActionBar.Close>
					<XIcon />
					<span class="sr-only">Clear selection</span>
				</ActionBar.Close>
			</ActionBar.Selection>
			<ActionBar.Separator />
			<ActionBar.Group>
				<ActionBar.Item>
					<PencilIcon />
					Edit
				</ActionBar.Item>
				<ActionBar.Item variant="destructive">
					<Trash2Icon />
					Delete
				</ActionBar.Item>
			</ActionBar.Group>
		</ActionBar.Root>
	</DocSection>

	<DocSection title="Data table with toolbar and filters">
		{#snippet blurb()}
			The Data table page's "Toolbar, filters and row selection" demo, re-housed: the toolbar — text
			filter, facets, the View menu — becomes the card header row, the table runs flush to the
			card's edges, and the shared pagination moves into the card footer, where the selection count
			already lives.
		{/snippet}
		<Card.Root class="gap-0 py-0">
			<Card.Header>
				<DataTable.Toolbar table={projectsTable.table} class="p-0" />
			</Card.Header>
			<TablesInCardsTable grid={projectsTable} />
			<Card.Footer class="py-4">
				<DataTable.Pagination
					table={projectsTable.table}
					pageSizeOptions={[4, 10]}
					class="w-full p-0"
				/>
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Data grid with movable columns">
		{#snippet blurb()}
			The Data grid page's movable-columns demo in the same housing: Move left / Move right in each
			column menu swap neighbours in table-core's <code>columnOrder</code>, under a titled card
			header, with the shared pagination in the footer.
		{/snippet}
		<Card.Root class="gap-0 py-0">
			<Card.Header>
				<Card.Title>Team members</Card.Title>
			</Card.Header>
			<TablesInCardsTable grid={movableGrid} />
			<Card.Footer class="py-4">
				<DataTable.Pagination
					table={movableGrid.table}
					pageSizeOptions={[5, 10]}
					class="w-full p-0"
				/>
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Row density">
		{#snippet blurb()}
			Airtable and GitHub Projects put the row-height switch on the view itself; here it sits in the
			card header, driving <code>Table.Root</code>'s <code>density</code>:
			<code>sm</code> is 40px rows with 13px body type,
			<code>default</code> the uniform 56px, <code>lg</code> 76px. Each tier is a floor, not a clamp —
			a cell that stacks two lines simply holds its row above it.
		{/snippet}
		<Card.Root class="gap-0 py-0">
			<Card.Header class="flex items-center justify-between gap-4">
				<Card.Title>Team members</Card.Title>
				<ToggleGroup.Root
					type="single"
					variant="outline"
					size="sm"
					bind:value={
						() => teamDensity,
						(next) => {
							if (next === "sm" || next === "default" || next === "lg") teamDensity = next;
						}
					}
					aria-label="Row density"
				>
					<ToggleGroup.Item value="sm" aria-label="Compact rows">
						<Rows4Icon />
					</ToggleGroup.Item>
					<ToggleGroup.Item value="default" aria-label="Default rows">
						<Rows3Icon />
					</ToggleGroup.Item>
					<ToggleGroup.Item value="lg" aria-label="Relaxed rows">
						<Rows2Icon />
					</ToggleGroup.Item>
				</ToggleGroup.Root>
			</Card.Header>
			<TablesInCardsTable grid={densityGrid} density={teamDensity} />
			<Card.Footer class="py-4">
				<DataTable.Pagination
					table={densityGrid.table}
					pageSizeOptions={[5, 10]}
					class="w-full p-0"
				/>
			</Card.Footer>
		</Card.Root>
	</DocSection>
</DocPage>
