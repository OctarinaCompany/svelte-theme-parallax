<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as DataGrid from "$lib/components/ui/data-grid/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { href } from "$lib/hooks/route.svelte.js";
	import {
		/**
		 * The Data grid component page.
		 *
		 * THIS ONE LANDS ON THE CLASSIC THEME'S TABLES, but not entirely for free. The body cells inherit the
		 * body ink on the card surface and need nothing. The head row is the grid's own ARIA markup —
		 * `[data-slot='data-grid-column-header']`, not the Table primitive's `table-head` slot — so
		 * the global head restyle in `app.css` could not reach it, and a companion rule there
		 * restates the classic theme's head treatment (muted ink, 13px, weight 600, letter-spaced uppercase)
		 * on the grid's own slot. It was measured 15px/400/foreground before that rule existed:
		 * "every cell goes through the same slots" was this comment's original claim, and it was
		 * wrong about the head.
		 *
		 * The grid is built on `@tanstack/table-core` 8 — the same headless core `ui/data-table`
		 * consumes, so one dependency serves both.
		 */
		createDataGrid,
		type DataGridColumnDef,
		type FileCellData,
	} from "$lib/components/ui/data-grid/index.js";

	type SkateTrick = {
		id: string;
		trickName: string;
		skaterName: string;
		difficulty: string;
		variant: string;
		landed: boolean;
		attempts: number | null;
		bestScore: number | null;
		location: string;
		dateAttempted: string | null;
	};

	const SKATE_SPOTS = [
		"Venice Beach Skate Park",
		"Burnside Skate Park",
		"Love Park (Philadelphia)",
		"MACBA (Barcelona)",
		"Southbank (London)",
		"FDR Skate Park",
		"Brooklyn Banks",
		"El Toro High School",
		"Hubba Hideout",
		"Wallenberg High School",
		"EMB (Embarcadero)",
		"Pier 7 (San Francisco)",
	] as const;

	const SKATE_TRICKS = {
		flip: [
			"Kickflip",
			"Heelflip",
			"Tre Flip",
			"Hardflip",
			"Inward Heelflip",
			"Frontside Flip",
			"Backside Flip",
			"Varial Flip",
			"Varial Heelflip",
			"Double Flip",
			"Laser Flip",
			"Anti-Casper Flip",
			"Casper Flip",
			"Impossible",
			"360 Flip",
			"Big Spin",
			"Bigspin Flip",
		],
		grind: [
			"50-50 Grind",
			"5-0 Grind",
			"Nosegrind",
			"Crooked Grind",
			"Feeble Grind",
			"Smith Grind",
			"Lipslide",
			"Boardslide",
			"Tailslide",
			"Noseslide",
			"Bluntslide",
			"Nollie Backside Lipslide",
			"Switch Frontside Boardslide",
		],
		grab: [
			"Indy Grab",
			"Melon Grab",
			"Stalefish",
			"Tail Grab",
			"Nose Grab",
			"Method",
			"Mute Grab",
			"Crail Grab",
			"Seatbelt Grab",
			"Roast Beef",
			"Chicken Wing",
			"Tweaked Indy",
			"Japan Air",
		],
		transition: [
			"Frontside Air",
			"Backside Air",
			"McTwist",
			"540",
			"720",
			"900",
			"Frontside 180",
			"Backside 180",
			"Frontside 360",
			"Backside 360",
			"Alley-Oop",
			"Fakie",
			"Revert",
			"Carve",
			"Pump",
			"Drop In",
		],
		manual: [
			"Manual",
			"Nose Manual",
			"Casper",
			"Rail Stand",
			"Pogo",
			"Handstand",
			"One Foot Manual",
			"Spacewalk",
			"Truckstand",
			"Primo",
		],
		slide: [
			"Powerslide",
			"Bert Slide",
			"Coleman Slide",
			"Pendulum Slide",
			"Stand-up Slide",
			"Toeside Slide",
			"Heelside Slide",
		],
	} as const;

	const SKATER_NAMES = [
		"Rodney Mullen",
		"Elissa Steamer",
		"Nyjah Huston",
		"Daewon Song",
		"Leticia Bufoni",
		"Eric Koston",
		"Lizzie Armanto",
		"Mark Gonzales",
		"Alexis Sablone",
		"Chris Joslin",
		"Sky Brown",
		"Andrew Reynolds",
		"Rayssa Leal",
		"Guy Mariano",
		"Aori Nishimura",
		"Tony Hawk",
		"Samarria Brevard",
		"Paul Rodriguez",
		"Nora Vasconcellos",
		"Ishod Wair",
	] as const;

	const EXPERT_TRICKS = ["Tre Flip", "900", "McTwist", "Laser Flip", "Impossible"];
	const ADVANCED_TRICKS = [
		"Hardflip",
		"720",
		"540",
		"Crooked Grind",
		"Switch Frontside Boardslide",
	];
	const INTERMEDIATE_TRICKS = [
		"Kickflip",
		"Heelflip",
		"Frontside 180",
		"50-50 Grind",
		"Boardslide",
	];

	const DIFFICULTY_OPTIONS = [
		{ label: "Beginner", value: "beginner" },
		{ label: "Intermediate", value: "intermediate" },
		{ label: "Advanced", value: "advanced" },
		{ label: "Expert", value: "expert" },
	];

	const VARIANT_OPTIONS = [
		{ label: "Flip", value: "flip" },
		{ label: "Grind", value: "grind" },
		{ label: "Grab", value: "grab" },
		{ label: "Transition", value: "transition" },
		{ label: "Manual", value: "manual" },
		{ label: "Slide", value: "slide" },
	];

	const LOCATION_OPTIONS = SKATE_SPOTS.map((spot) => ({ label: spot, value: spot }));

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

	function generateTrickData(): SkateTrick[] {
		const random = createRandom(20240514);
		const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
		const intBetween = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

		const getDifficulty = (trick: string): string => {
			if (EXPERT_TRICKS.some((name) => trick.includes(name))) return "expert";
			if (ADVANCED_TRICKS.some((name) => trick.includes(name))) return "advanced";
			if (INTERMEDIATE_TRICKS.some((name) => trick.includes(name))) return "intermediate";
			return "beginner";
		};

		// A fixed window rather than "up to today", for the same prerendering reason.
		const firstDay = Date.UTC(2023, 0, 1);
		const dayCount = 1000;
		const dayMs = 86_400_000;

		return Array.from({ length: 30 }, (_, index) => {
			const variant = pick(Object.keys(SKATE_TRICKS) as (keyof typeof SKATE_TRICKS)[]);
			const trickName = pick(SKATE_TRICKS[variant]);
			const landed = random() < 0.6;

			return {
				id: `trick-${index + 1}`,
				trickName,
				skaterName: pick(SKATER_NAMES),
				difficulty: getDifficulty(trickName),
				variant,
				landed,
				attempts: intBetween(1, 50),
				bestScore: landed ? intBetween(6, 10) : intBetween(1, 5),
				location: pick(SKATE_SPOTS),
				dateAttempted:
					new Date(firstDay + intBetween(0, dayCount) * dayMs).toISOString().split("T")[0] ?? null,
			};
		});
	}

	function createEmptyTrick(id: string): SkateTrick {
		return {
			id,
			trickName: "",
			skaterName: "",
			difficulty: "",
			variant: "",
			landed: false,
			attempts: null,
			bestScore: null,
			location: "",
			dateAttempted: null,
		};
	}

	let nextTrickId = $state(31);
	let tricks = $state.raw<SkateTrick[]>(generateTrickData());

	const columns: DataGridColumnDef<SkateTrick>[] = [
		{
			id: "trickName",
			accessorKey: "trickName",
			meta: { label: "Trick name", cell: { variant: "short-text" } },
			size: 180,
		},
		{
			id: "skaterName",
			accessorKey: "skaterName",
			meta: { label: "Skater", cell: { variant: "short-text" } },
			size: 170,
		},
		{
			id: "difficulty",
			accessorKey: "difficulty",
			meta: { label: "Difficulty", cell: { variant: "select", options: DIFFICULTY_OPTIONS } },
			size: 150,
		},
		{
			id: "variant",
			accessorKey: "variant",
			meta: { label: "Category", cell: { variant: "select", options: VARIANT_OPTIONS } },
			size: 140,
		},
		{
			id: "landed",
			accessorKey: "landed",
			meta: { label: "Landed", cell: { variant: "checkbox" } },
			size: 110,
		},
		{
			id: "attempts",
			accessorKey: "attempts",
			meta: { label: "Attempts", cell: { variant: "number", min: 1, max: 100 } },
			size: 110,
		},
		{
			id: "bestScore",
			accessorKey: "bestScore",
			meta: { label: "Score", cell: { variant: "number", min: 1, max: 10 } },
			size: 110,
		},
		{
			id: "location",
			accessorKey: "location",
			meta: { label: "Location", cell: { variant: "select", options: LOCATION_OPTIONS } },
			size: 220,
		},
		{
			id: "dateAttempted",
			accessorKey: "dateAttempted",
			meta: { label: "Attempted at", cell: { variant: "date" } },
			size: 150,
		},
	];

	const grid = createDataGrid<SkateTrick>({
		data: () => tricks,
		columns: () => columns,
		getRowId: (row) => row.id,
		initialState: { columnPinning: { left: ["trickName"], right: [] } },
		enableSearch: true,
		enablePaste: true,
		onDataChange: (next) => {
			tricks = next;
		},
		onRowAdd: () => {
			tricks = [...tricks, createEmptyTrick(`trick-${nextTrickId++}`)];
			return { rowIndex: tricks.length - 1, columnId: "trickName" };
		},
		onRowsAdd: (count) => {
			tricks = [
				...tricks,
				...Array.from({ length: count }, () => createEmptyTrick(`trick-${nextTrickId++}`)),
			];
		},
		onRowsDelete: (rows) => {
			const removed = new Set(rows.map((row) => row.id));
			tricks = tricks.filter((row) => !removed.has(row.id));
		},
	});

	// --- The cell variants upstream's own demo does not exercise -------------------------------

	type TrickNote = {
		id: string;
		trickName: string;
		variants: string[];
		notes: string;
		clip: string;
		footage: FileCellData[];
	};

	let nextFileId = $state(2);
	let deletedFileCount = $state(0);

	let notes = $state.raw<TrickNote[]>([
		{
			id: "note-1",
			trickName: "Kickflip",
			variants: ["flip"],
			notes: "Pop straight up, flick off the corner of the nose, catch with the back foot first.",
			clip: "https://svelte.dev",
			footage: [{ id: "file-1", name: "kickflip-line.mp4", size: 4_718_592, type: "video/mp4" }],
		},
		{
			id: "note-2",
			trickName: "Smith Grind",
			variants: ["grind"],
			notes: "Back truck locks, front truck hangs below the coping.",
			clip: "example.com",
			footage: [],
		},
		{
			id: "note-3",
			trickName: "Tre Flip",
			variants: ["flip", "slide"],
			notes: "A 360 shuvit and a kickflip at once — the scoop and the flick have to be equal.",
			clip: "",
			footage: [],
		},
	]);

	const noteColumns: DataGridColumnDef<TrickNote>[] = [
		{
			id: "trickName",
			accessorKey: "trickName",
			meta: { label: "Trick name", cell: { variant: "short-text" } },
			size: 170,
		},
		{
			id: "variants",
			accessorKey: "variants",
			meta: { label: "Variants", cell: { variant: "multi-select", options: VARIANT_OPTIONS } },
			size: 190,
		},
		{
			id: "notes",
			accessorKey: "notes",
			meta: { label: "Notes", cell: { variant: "long-text" } },
			size: 260,
		},
		{
			id: "clip",
			accessorKey: "clip",
			meta: { label: "Clip", cell: { variant: "url" } },
			size: 180,
		},
		{
			id: "footage",
			accessorKey: "footage",
			meta: {
				label: "Footage",
				cell: {
					variant: "file",
					maxFileSize: 8 * 1024 * 1024,
					maxFiles: 3,
					accept: "video/*,image/*",
					multiple: true,
				},
			},
			size: 200,
		},
	];

	const noteGrid = createDataGrid<TrickNote>({
		data: () => notes,
		columns: () => noteColumns,
		getRowId: (row) => row.id,
		onDataChange: (next) => {
			notes = next;
		},
		// A demo upload: the files never leave the page, they are just described back to the grid,
		// which writes the returned metadata into the row. A real handler would POST them first.
		onFilesUpload: async ({ files }) =>
			files.map((file) => ({
				id: `file-${nextFileId++}`,
				name: file.name,
				size: file.size,
				type: file.type,
				url: URL.createObjectURL(file),
			})),
		// Nothing to revoke here — the cell revokes its own object URLs — so this only stands in for
		// the delete request a real consumer would await before the row is rewritten.
		onFilesDelete: async ({ fileIds }) => {
			deletedFileCount += fileIds.length;
			await Promise.resolve();
		},
	});
	// --- API reference -------------------------------------------------------------------------

	type PropRow = { prop: string; type: string; default: string; description: string };

	const createOptions: PropRow[] = [
		{
			prop: "data",
			type: "TData[] | (() => TData[])",
			default: "—",
			description:
				"The rows to render. Pass a getter so a reassignment of the outer array (`rows = next`) reaches the grid; a plain array is captured once. The grid never mutates it — every edit arrives through `onDataChange` as a new array.",
		},
		{
			prop: "columns",
			type: "DataGridColumnDef<TData>[] | (() => DataGridColumnDef<TData>[])",
			default: "—",
			description:
				"The column definitions. `meta.label` names the column in its header, `meta.cell` picks its variant (absent means short text). Columns with id `select` or `actions` render but are never navigable: focus, Tab, paste and copy skip them.",
		},
		{
			prop: "getRowId",
			type: "(row: TData, index: number, parent?: Row<TData>) => string",
			default: "—",
			description:
				"Stable row identity, passed straight to table-core. Row selection and the shift-click anchor are keyed by it; without it table-core keys rows by index, so a sort or delete re-keys them.",
		},
		{
			prop: "defaultColumn",
			type: "Partial<ColumnDef<TData, unknown>>",
			default: "—",
			description:
				"Merged over the theme's `{ minSize: 60, maxSize: 800 }`, the bounds the column resizer clamps to when a column declares none of its own.",
		},
		{
			prop: "initialState",
			type: "DataGridInitialState",
			default: "—",
			description:
				"Seeds the six uncontrolled slices — sorting, columnFilters, rowSelection, columnPinning, columnOrder, columnVisibility — once, at creation.",
		},
		{
			prop: "state",
			type: "Partial<TableState> | (() => Partial<TableState>)",
			default: "—",
			description:
				"Controlled override: every slice present here wins over the internal one on each read, so the matching `on…Change` callback is where the consumer writes it back.",
		},
		{
			prop: "onDataChange",
			type: "(data: TData[]) => void",
			default: "—",
			description:
				"Called with the full next array after every cell edit, paste, clear and cut-clear — touched rows shallow-copied, untouched rows carried by reference, each row-model index mapped back onto the source array. Without it the edits are computed and dropped.",
		},
		{
			prop: "onRowAdd",
			type: "(event?: MouseEvent) => Partial<CellPosition> | Promise<Partial<CellPosition> | null> | null | void",
			default: "—",
			description:
				"Providing it renders the sticky Add row footer and arms Shift+Enter. Return the cell to focus afterwards — a missing `rowIndex` means the previous row count, a missing `columnId` the focused column — or `null` to leave focus alone; a throw is swallowed. When `onRowsAdd` is absent a paste that overruns the grid calls it once per missing row.",
		},
		{
			prop: "onRowsAdd",
			type: "(count: number) => void | Promise<void>",
			default: "—",
			description:
				"Called once with the number of rows a paste needs beyond the grid, instead of `count` calls to `onRowAdd`. The paste is awaited on it, then polls the row model every 100 ms for up to 5 s before writing.",
		},
		{
			prop: "onRowsDelete",
			type: "(rows: TData[], rowIndices: number[]) => void | Promise<void>",
			default: "—",
			description:
				"Providing it enables the context menu's Delete rows and Ctrl/Cmd+Backspace/Delete. Receives the row objects and their row-model indices, is awaited, then focus lands on the row now occupying the lowest deleted index.",
		},
		{
			prop: "onPaste",
			type: "(updates: CellUpdate[]) => void | Promise<void>",
			default: "—",
			description:
				"Awaited with the coerced paste updates before `onDataChange` runs, so a consumer can persist first. A rejection aborts the paste with a toast and writes nothing.",
		},
		{
			prop: "onFilesUpload",
			type: "(params: { files: File[]; rowIndex: number; columnId: string }) => Promise<FileCellData[]>",
			default: "—",
			description:
				"Receives the files a `file` cell accepted — already checked against `maxFileSize`, `accept` and `maxFiles` — and returns the metadata to store. Without it the cell stores a `crypto.randomUUID()` id and a `blob:` object URL. A rejection is toasted and nothing is written.",
		},
		{
			prop: "onFilesDelete",
			type: "(params: { fileIds: string[]; rowIndex: number; columnId: string }) => void | Promise<void>",
			default: "—",
			description:
				"Awaited before a `file` cell drops entries from its array; a rejection keeps them. The cell revokes the `blob:` URLs of the removed files itself.",
		},
		{
			prop: "onSortingChange",
			type: "(sorting: SortingState) => void",
			default: "—",
			description:
				"Receives the resolved next sorting — never an updater function — after the internal slice is written. The column header menu sorts through `table.setSorting`, so it fires for those too.",
		},
		{
			prop: "onColumnFiltersChange",
			type: "(filters: ColumnFiltersState) => void",
			default: "—",
			description:
				"Receives the resolved next filters, never an updater, after the internal slice is written.",
		},
		{
			prop: "onRowSelectionChange",
			type: "(rowSelection: RowSelectionState) => void",
			default: "—",
			description:
				"Receives the resolved next row selection from every write routed through table-core, and `{}` from `grid.clearSelection()` (Escape included). Selecting rows also selects every cell of those rows and drops the focused and editing cell. A plain pointer-down on a cell resets the slice to `{}` without calling it, so a consumer mirroring the selection must also read `grid.rowSelection`.",
		},
		{
			prop: "onRowHeightChange",
			type: "(rowHeight: RowHeightValue) => void",
			default: "—",
			description:
				"Fires whenever `grid.setRowHeight()` runs — not when the `rowHeight` option is first applied.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "'medium'",
			description:
				"The row-height preset: 40, 56, 76 or 96 px, showing 1, 2, 3 or 4 lines of text at rest. Read once at creation; change it later through `grid.setRowHeight()`.",
		},
		{
			prop: "overscan",
			type: "number",
			default: "6",
			description:
				"Rows kept mounted beyond each edge of the viewport as a scroll buffer: the window runs from `floor(scrollTop / rowHeight) - overscan` to `ceil((scrollTop + viewportHeight) / rowHeight) + overscan`, clamped to the row range. The viewport height is measured synchronously at mount and falls back to the `height` prop of `DataGrid.Root` when the container reports 0 px (jsdom), so the window is never overscan-sized on its own.",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "—",
			description:
				"Text direction. Absent, the grid follows the nearest `DirectionProvider`, else a `dir` attribute on `<html>` — the resolver walks up from `document.documentElement`, so a `dir` on any closer ancestor is not consulted — else `ltr`. Under `rtl` the arrow keys, Tab, the pinned edges and the resizer's arrows all mirror.",
		},
		{
			prop: "autoFocus",
			type: "boolean | Partial<CellPosition>",
			default: "false",
			description:
				"Focus a cell once `DataGrid.Root` mounts: `true` picks row 0 of the first navigable column; an object fills a missing `rowIndex` with 0 and a missing `columnId` with the first navigable column. Skipped when the grid is empty or a cell is already focused.",
		},
		{
			prop: "enableSingleCellSelection",
			type: "boolean",
			default: "false",
			description:
				"Collapses every range to its moving edge: drag, Shift+click, Shift+arrows and Ctrl/Cmd+click select at most one cell, and a plain click selects the cell it focuses. Ctrl/Cmd+A still selects everything.",
		},
		{
			prop: "enableColumnSelection",
			type: "boolean",
			default: "false",
			description:
				"A left pointer-down on a column header selects every cell of that column. When off, the same press clears the current selection instead.",
		},
		{
			prop: "enableSearch",
			type: "boolean",
			default: "false",
			description:
				"Creates `grid.search`, makes `DataGrid.Root` render the find box and arms Ctrl/Cmd+F. Matching is a case-insensitive substring test on `String(value)` over every column, 150 ms after the last keystroke.",
		},
		{
			prop: "enablePaste",
			type: "boolean",
			default: "false",
			description:
				"Arms Ctrl/Cmd+V. Copy and cut are always available; only the paste path is gated.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "false",
			description:
				"Blocks every mutation path: editing, clearing, cut, paste, row add and delete, file upload. Navigation, selection, copy and search stay available, and every cell renders `data-readonly`.",
		},
	];

	const rootProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The state from `createDataGrid`. Published to context once, at initialisation (`untrack`), while the root's own effects and template read it reactively — so a later reassignment moves the root to the new instance and leaves every context-reading part on the old one; treat it as fixed for the root's lifetime. Destroyed — its search debounce cancelled — when the root unmounts.",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "—",
			description:
				"Overrides the resolved direction for the wrapper's `dir` attribute and the header cells' pinned edge only; body cells and the keyboard mirroring still follow `grid.dir`, so prefer the `dir` option of `createDataGrid`.",
		},
		{
			prop: "height",
			type: "number",
			default: "600",
			description:
				"The scroll container's `max-height` in px: the grid grows with its rows up to it and scrolls beyond it. Also the viewport height the virtualizer assumes while the container measures 0 px.",
		},
		{
			prop: "stretchColumns",
			type: "boolean",
			default: "false",
			description:
				"Lets every column except `select` grow to fill the width left over after the declared sizes; the sizes become minimums.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				'Bindable; the outer wrapper `div`, not the `role="grid"` scroll container — that one is `grid.container`.',
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged onto the wrapper `div`, not the scroll container.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Rendered after the grid, inside the wrapper — where `DataGrid.KeyboardShortcuts`, toolbars and overlays go.",
		},
		{
			prop: "row",
			type: "Snippet<[{ row: Row<TData>; rowIndex: number; top: number }]>",
			default: "—",
			description:
				"Replaces `DataGrid.Row` for every mounted row. The body is a `relative` box of the full scroll height, so the replacement must position itself at `top` px (`DataGrid.Row` uses `transform: translateY`) and register its cells for focus to reach them.",
		},
		{
			prop: "empty",
			type: "Snippet",
			default: "—",
			description:
				"Rendered inside the body rowgroup when the row model is empty — after filtering too, not only when `data` is.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the wrapper `div` last, so a caller `style` or `data-slot` wins.",
		},
	];

	const rowProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to render against. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Row> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "row",
			type: "Row<TData>",
			default: "—",
			description:
				'The table-core row. Its visible cells render in order, one `role="gridcell"` container each, and `aria-selected` mirrors `row.getIsSelected()`.',
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Position in the current (sorted, filtered) row model — the index every `CellPosition` uses, the `data-index`, and what `aria-rowindex` is computed from (header rows + rowIndex + 1).",
		},
		{
			prop: "top",
			type: "number",
			default: "—",
			description:
				"Pixel offset inside the virtualized body, applied as `transform: translateY()`. The row is absolutely positioned; its height comes from `grid.rowHeight`.",
		},
		{
			prop: "stretchColumns",
			type: "boolean",
			default: "false",
			description:
				"Lets every cell container except `select` grow to fill spare width. `DataGrid.Root` passes its own value through.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				'Bindable; the `role="row"` element. Registered with `grid.registerRow` while mounted, which is how navigation knows whether a target row is in the window or must be scrolled to.',
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged onto the row element.",
		},
		{
			prop: "cell",
			type: "Snippet<[{ cell: Cell<TData, unknown>; colIndex: number }]>",
			default: "—",
			description:
				'Replaces `DataGrid.Cell` inside every cell container. The container itself — `role="gridcell"`, width, pinning, borders, `data-highlighted` on the focused cell — is still rendered; the snippet only fills it.',
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the row element last, so a caller `style` replaces the computed height and transform.",
		},
	];

	const cellProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to write to. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Cell> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "cell",
			type: "Cell<TData, unknown>",
			default: "—",
			description:
				"The table-core cell: `getValue()` is the resting value, `column.columnDef.meta.cell` supplies the variant options, and `meta.label` the editor's `aria-label` (falling back to `columnId`).",
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Row-model index used for every write (`grid.updateData`), for the DOM registry key and for `data-cell-key`.",
		},
		{
			prop: "columnId",
			type: "string",
			default: "—",
			description:
				"Column id used for the write, the registry key, `data-cell-key` and the `aria-label` fallback.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "—",
			description:
				"Clamps the resting content to 1, 2, 3 or 4 lines (`line-clamp` on `[data-slot=data-grid-cell-content]`). The clamp is lifted while editing.",
		},
		{
			prop: "isEditing",
			type: "boolean",
			default: "—",
			description:
				"Forwarded to the variant it routes to; what edit mode renders is that variant's decision.",
		},
		{
			prop: "isFocused",
			type: "boolean",
			default: "—",
			description:
				"Draws the focus ring, sets `data-focused`, makes the wrapper the grid's tab stop (`tabindex=0` while not editing), and turns the next click, Enter, F2, space or printable key into an edit.",
		},
		{
			prop: "isSelected",
			type: "boolean",
			default: "—",
			description:
				"Paints the selection tint (`bg-primary/10`, suppressed while editing) and sets `data-selected`.",
		},
		{
			prop: "isSearchMatch",
			type: "boolean",
			default: "—",
			description: "Paints the match highlight (`bg-warning/15`) and sets `data-search-match`.",
		},
		{
			prop: "isActiveSearchMatch",
			type: "boolean",
			default: "—",
			description:
				"Paints the stronger active-match highlight (`bg-warning/35`) over `isSearchMatch` and sets `data-active-search-match`.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "—",
			description:
				"Blocks every write and every edit trigger in the wrapper and the variant, and sets `data-readonly`. Focus, selection and copy still work.",
		},
	];

	const cellWrapperProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to write to. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Cell> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "cell",
			type: "Cell<TData, unknown>",
			default: "—",
			description:
				"The table-core cell: `getValue()` is the resting value, `column.columnDef.meta.cell` supplies the variant options, and `meta.label` the editor's `aria-label` (falling back to `columnId`).",
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Row-model index used for every write (`grid.updateData`), for the DOM registry key and for `data-cell-key`.",
		},
		{
			prop: "columnId",
			type: "string",
			default: "—",
			description:
				"Column id used for the write, the registry key, `data-cell-key` and the `aria-label` fallback.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "—",
			description:
				"Clamps the resting content to 1, 2, 3 or 4 lines (`line-clamp` on `[data-slot=data-grid-cell-content]`). The clamp is lifted while editing.",
		},
		{
			prop: "isEditing",
			type: "boolean",
			default: "—",
			description:
				"Sets `data-editing`, drops the wrapper out of the tab order, lifts the line clamp and the selection tint, and makes the click, double-click, pointer and context-menu handlers ignore events until editing ends.",
		},
		{
			prop: "isFocused",
			type: "boolean",
			default: "—",
			description:
				"Draws the focus ring, sets `data-focused`, makes the wrapper the grid's tab stop (`tabindex=0` while not editing), and turns the next click, Enter, F2, space or printable key into an edit.",
		},
		{
			prop: "isSelected",
			type: "boolean",
			default: "—",
			description:
				"Paints the selection tint (`bg-primary/10`, suppressed while editing) and sets `data-selected`.",
		},
		{
			prop: "isSearchMatch",
			type: "boolean",
			default: "—",
			description: "Paints the match highlight (`bg-warning/15`) and sets `data-search-match`.",
		},
		{
			prop: "isActiveSearchMatch",
			type: "boolean",
			default: "—",
			description:
				"Paints the stronger active-match highlight (`bg-warning/35`) over `isSearchMatch` and sets `data-active-search-match`.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "—",
			description:
				"Blocks every write and every edit trigger in the wrapper and the variant, and sets `data-readonly`. Focus, selection and copy still work.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				'Bindable; the `role="button"` wrapper. Registered with `grid.registerCell` while mounted — this is the element `focusCell` focuses and the horizontal scroll measures.',
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the state classes.",
		},
		{
			prop: "onclick",
			type: "(event: MouseEvent) => void",
			default: "—",
			description:
				"Runs before the wrapper's own click handling. Calling `preventDefault()` claims the click, so it neither starts an edit nor moves focus. Not called while editing, nor for a click inside a `[data-grid-cell-editor]`.",
		},
		{
			prop: "ondblclick",
			type: "(event: MouseEvent) => void",
			default: "—",
			description:
				"Runs before the double-click edit trigger; `preventDefault()` suppresses the edit.",
		},
		{
			prop: "onkeydown",
			type: "(event: KeyboardEvent) => void",
			default: "—",
			description:
				"Runs before the wrapper's edit triggers; `preventDefault()` stops them. Navigation keys always bubble to the grid untouched, and Shift+Enter is never an edit trigger — it is the grid's row-insert shortcut.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				'The variant\'s resting content or editor. Mark the resting node `data-slot="data-grid-cell-content"` to receive the row-height line clamp.',
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the wrapper last. A caller `oncontextmenu`, `onpointerdown`, `onpointerenter` or `onpointerup` replaces the built-in drag-select and context-menu handler rather than running before it.",
		},
	];

	const cellEditorProps: PropRow[] = [
		{
			prop: "open",
			type: "boolean",
			default: "false",
			description:
				"Whether the layer is mounted. Mirror the cell's `isEditing`: the layer never flips it itself — when it closes from inside it calls `onDismiss` and expects the caller to leave edit mode.",
		},
		{
			prop: "anchor",
			type: "HTMLElement | null",
			default: "null",
			description:
				"The element the layer positions against — the cell wrapper's `ref`. The editor lands flush over it: `align=\"start\"` with a `sideOffset` of minus the anchor's height. `null` means no anchor and a 0 offset.",
		},
		{
			prop: "onDismiss",
			type: "() => void",
			default: "—",
			description:
				"Called once when the layer closes itself — an outside press, or Escape from anywhere in the document. Variants commit or revert here. The layer never moves focus: focus trapping is off and auto-focus is cancelled on open and on close.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				"Bindable; the portalled content element, marked `data-grid-cell-editor` so the wrapper and the grid treat events from inside it as inside the cell.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged onto the content after the popover surface classes; variants use it for the editor width.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The editor UI, rendered inside the portalled content.",
		},
		{
			prop: "...restProps",
			type: "Omit<PopoverPrimitive.ContentProps, 'customAnchor'>",
			default: "—",
			description:
				"Spread onto `Popover.Content` after the built-in `align`, `sideOffset`, `trapFocus` and auto-focus guards, so any of them can be overridden.",
		},
	];

	const shortTextCellProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to write to. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Cell> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "cell",
			type: "Cell<TData, unknown>",
			default: "—",
			description:
				"The table-core cell: `getValue()` is the resting value, `column.columnDef.meta.cell` supplies the variant options, and `meta.label` the editor's `aria-label` (falling back to `columnId`).",
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Row-model index used for every write (`grid.updateData`), for the DOM registry key and for `data-cell-key`.",
		},
		{
			prop: "columnId",
			type: "string",
			default: "—",
			description:
				"Column id used for the write, the registry key, `data-cell-key` and the `aria-label` fallback.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "—",
			description:
				"Clamps the resting content to 1, 2, 3 or 4 lines (`line-clamp` on `[data-slot=data-grid-cell-content]`). The clamp is lifted while editing.",
		},
		{
			prop: "isEditing",
			type: "boolean",
			default: "—",
			description:
				"Makes the content `div` `contenteditable`, seeds it with the pending typed character or the stored value, and focuses it with the caret at the end. Enter commits and moves down a row, Tab commits and moves along the row, Escape discards, blur commits.",
		},
		{
			prop: "isFocused",
			type: "boolean",
			default: "—",
			description:
				"Draws the focus ring, sets `data-focused`, makes the wrapper the grid's tab stop (`tabindex=0` while not editing), and turns the next click, Enter, F2, space or printable key into an edit.",
		},
		{
			prop: "isSelected",
			type: "boolean",
			default: "—",
			description:
				"Paints the selection tint (`bg-primary/10`, suppressed while editing) and sets `data-selected`.",
		},
		{
			prop: "isSearchMatch",
			type: "boolean",
			default: "—",
			description: "Paints the match highlight (`bg-warning/15`) and sets `data-search-match`.",
		},
		{
			prop: "isActiveSearchMatch",
			type: "boolean",
			default: "—",
			description:
				"Paints the stronger active-match highlight (`bg-warning/35`) over `isSearchMatch` and sets `data-active-search-match`.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "—",
			description:
				"Blocks every write and every edit trigger in the wrapper and the variant, and sets `data-readonly`. Focus, selection and copy still work.",
		},
	];

	const longTextCellProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to write to. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Cell> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "cell",
			type: "Cell<TData, unknown>",
			default: "—",
			description:
				"The table-core cell: `getValue()` is the resting value, `column.columnDef.meta.cell` supplies the variant options, and `meta.label` the editor's `aria-label` (falling back to `columnId`).",
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Row-model index used for every write (`grid.updateData`), for the DOM registry key and for `data-cell-key`.",
		},
		{
			prop: "columnId",
			type: "string",
			default: "—",
			description:
				"Column id used for the write, the registry key, `data-cell-key` and the `aria-label` fallback.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "—",
			description:
				"Clamps the resting content to 1, 2, 3 or 4 lines (`line-clamp` on `[data-slot=data-grid-cell-content]`). The clamp is lifted while editing.",
		},
		{
			prop: "isEditing",
			type: "boolean",
			default: "—",
			description:
				"Opens a `DataGrid.CellEditor` holding a 400 px `Textarea` seeded with the draft, or with the pending typed character. Ctrl/Cmd+Enter, Tab, blur and an outside press commit; plain Enter inserts a newline; Escape reverts to the stored value.",
		},
		{
			prop: "isFocused",
			type: "boolean",
			default: "—",
			description:
				"Draws the focus ring, sets `data-focused`, makes the wrapper the grid's tab stop (`tabindex=0` while not editing), and turns the next click, Enter, F2, space or printable key into an edit.",
		},
		{
			prop: "isSelected",
			type: "boolean",
			default: "—",
			description:
				"Paints the selection tint (`bg-primary/10`, suppressed while editing) and sets `data-selected`.",
		},
		{
			prop: "isSearchMatch",
			type: "boolean",
			default: "—",
			description: "Paints the match highlight (`bg-warning/15`) and sets `data-search-match`.",
		},
		{
			prop: "isActiveSearchMatch",
			type: "boolean",
			default: "—",
			description:
				"Paints the stronger active-match highlight (`bg-warning/35`) over `isSearchMatch` and sets `data-active-search-match`.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "—",
			description:
				"Blocks every write and every edit trigger in the wrapper and the variant, and sets `data-readonly`. Focus, selection and copy still work.",
		},
	];

	const numberCellProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to write to. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Cell> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "cell",
			type: "Cell<TData, unknown>",
			default: "—",
			description:
				"The table-core cell: `getValue()` is the resting value, `column.columnDef.meta.cell` supplies the variant options, and `meta.label` the editor's `aria-label` (falling back to `columnId`).",
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Row-model index used for every write (`grid.updateData`), for the DOM registry key and for `data-cell-key`.",
		},
		{
			prop: "columnId",
			type: "string",
			default: "—",
			description:
				"Column id used for the write, the registry key, `data-cell-key` and the `aria-label` fallback.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "—",
			description:
				"Clamps the resting content to 1, 2, 3 or 4 lines (`line-clamp` on `[data-slot=data-grid-cell-content]`). The clamp is lifted while editing.",
		},
		{
			prop: "isEditing",
			type: "boolean",
			default: "—",
			description:
				'Swaps the text for an `<input type="number">` carrying the column\'s `min`, `max` and `step`. Enter commits and moves down, Tab commits and moves along, Escape restores, blur commits. A commit clamps into `min`/`max`, writes `null` for an emptied input, and only writes when the value changed.',
		},
		{
			prop: "isFocused",
			type: "boolean",
			default: "—",
			description:
				"Draws the focus ring, sets `data-focused`, makes the wrapper the grid's tab stop (`tabindex=0` while not editing), and turns the next click, Enter, F2, space or printable key into an edit.",
		},
		{
			prop: "isSelected",
			type: "boolean",
			default: "—",
			description:
				"Paints the selection tint (`bg-primary/10`, suppressed while editing) and sets `data-selected`.",
		},
		{
			prop: "isSearchMatch",
			type: "boolean",
			default: "—",
			description: "Paints the match highlight (`bg-warning/15`) and sets `data-search-match`.",
		},
		{
			prop: "isActiveSearchMatch",
			type: "boolean",
			default: "—",
			description:
				"Paints the stronger active-match highlight (`bg-warning/35`) over `isSearchMatch` and sets `data-active-search-match`.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "—",
			description:
				"Blocks every write and every edit trigger in the wrapper and the variant, and sets `data-readonly`. Focus, selection and copy still work.",
		},
	];

	const urlCellProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to write to. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Cell> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "cell",
			type: "Cell<TData, unknown>",
			default: "—",
			description:
				"The table-core cell: `getValue()` is the resting value, `column.columnDef.meta.cell` supplies the variant options, and `meta.label` the editor's `aria-label` (falling back to `columnId`).",
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Row-model index used for every write (`grid.updateData`), for the DOM registry key and for `data-cell-key`.",
		},
		{
			prop: "columnId",
			type: "string",
			default: "—",
			description:
				"Column id used for the write, the registry key, `data-cell-key` and the `aria-label` fallback.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "—",
			description:
				"Clamps the resting content to 1, 2, 3 or 4 lines (`line-clamp` on `[data-slot=data-grid-cell-content]`). The clamp is lifted while editing.",
		},
		{
			prop: "isEditing",
			type: "boolean",
			default: "—",
			description:
				"Replaces the link with the same `contenteditable` editor short text uses, seeded with the pending typed character or the stored value. Enter, Tab and blur commit; Escape discards. A commit trims the text and writes `null` when it is empty.",
		},
		{
			prop: "isFocused",
			type: "boolean",
			default: "—",
			description:
				"Draws the focus ring, sets `data-focused`, makes the wrapper the grid's tab stop (`tabindex=0` while not editing), and turns the next click, Enter, F2, space or printable key into an edit.",
		},
		{
			prop: "isSelected",
			type: "boolean",
			default: "—",
			description:
				"Paints the selection tint (`bg-primary/10`, suppressed while editing) and sets `data-selected`.",
		},
		{
			prop: "isSearchMatch",
			type: "boolean",
			default: "—",
			description: "Paints the match highlight (`bg-warning/15`) and sets `data-search-match`.",
		},
		{
			prop: "isActiveSearchMatch",
			type: "boolean",
			default: "—",
			description:
				"Paints the stronger active-match highlight (`bg-warning/35`) over `isSearchMatch` and sets `data-active-search-match`.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "—",
			description:
				"Blocks every write and every edit trigger in the wrapper and the variant, and sets `data-readonly`. Focus, selection and copy still work.",
		},
	];

	const checkboxCellProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to write to. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Cell> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "cell",
			type: "Cell<TData, unknown>",
			default: "—",
			description:
				"The table-core cell: `getValue()` is the resting value, `column.columnDef.meta.cell` supplies the variant options, and `meta.label` the editor's `aria-label` (falling back to `columnId`).",
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Row-model index used for every write (`grid.updateData`), for the DOM registry key and for `data-cell-key`.",
		},
		{
			prop: "columnId",
			type: "string",
			default: "—",
			description:
				"Column id used for the write, the registry key, `data-cell-key` and the `aria-label` fallback.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "—",
			description:
				"Passed to the wrapper, whose `line-clamp` targets `[data-slot=data-grid-cell-content]` — a node this variant never renders — so the preset has no visible effect here; the checkbox is only top-padded (`has-data-[slot=checkbox]:pt-2.5`) inside the taller row.",
		},
		{
			prop: "isEditing",
			type: "boolean",
			default: "—",
			description:
				"Accepted and ignored: the checkbox toggles in place and the wrapper is always rendered with `isEditing={false}`. A click on the focused cell, space, Enter or F2 toggles; printable keys are swallowed rather than starting an edit that could never end.",
		},
		{
			prop: "isFocused",
			type: "boolean",
			default: "—",
			description:
				"Draws the focus ring, sets `data-focused` and makes the wrapper the grid's tab stop (`tabindex=0`). Here the focused-cell inputs toggle instead of editing: a click, Enter, F2 or space flips the value through `grid.updateData`, and a printable key is swallowed so no edit can ever start.",
		},
		{
			prop: "isSelected",
			type: "boolean",
			default: "—",
			description:
				"Paints the selection tint (`bg-primary/10`, suppressed while editing) and sets `data-selected`.",
		},
		{
			prop: "isSearchMatch",
			type: "boolean",
			default: "—",
			description: "Paints the match highlight (`bg-warning/15`) and sets `data-search-match`.",
		},
		{
			prop: "isActiveSearchMatch",
			type: "boolean",
			default: "—",
			description:
				"Paints the stronger active-match highlight (`bg-warning/35`) over `isSearchMatch` and sets `data-active-search-match`.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "—",
			description:
				"Blocks every write and every edit trigger in the wrapper and the variant, and sets `data-readonly`. Focus, selection and copy still work.",
		},
	];

	const selectCellProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to write to. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Cell> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "cell",
			type: "Cell<TData, unknown>",
			default: "—",
			description:
				"The table-core cell: `getValue()` is the resting value, `column.columnDef.meta.cell` supplies the variant options, and `meta.label` the editor's `aria-label` (falling back to `columnId`).",
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Row-model index used for every write (`grid.updateData`), for the DOM registry key and for `data-cell-key`.",
		},
		{
			prop: "columnId",
			type: "string",
			default: "—",
			description:
				"Column id used for the write, the registry key, `data-cell-key` and the `aria-label` fallback.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "—",
			description:
				"Clamps the resting content to 1, 2, 3 or 4 lines (`line-clamp` on `[data-slot=data-grid-cell-content]`). The clamp is lifted while editing.",
		},
		{
			prop: "isEditing",
			type: "boolean",
			default: "—",
			description:
				"Opens a 220 px `DataGrid.CellEditor` holding a searchable `Command` list of the column's `options`. Choosing writes that option's `value` and closes; Escape or an outside press closes without a write.",
		},
		{
			prop: "isFocused",
			type: "boolean",
			default: "—",
			description:
				"Draws the focus ring, sets `data-focused`, makes the wrapper the grid's tab stop (`tabindex=0` while not editing), and turns the next click, Enter, F2, space or printable key into an edit.",
		},
		{
			prop: "isSelected",
			type: "boolean",
			default: "—",
			description:
				"Paints the selection tint (`bg-primary/10`, suppressed while editing) and sets `data-selected`.",
		},
		{
			prop: "isSearchMatch",
			type: "boolean",
			default: "—",
			description: "Paints the match highlight (`bg-warning/15`) and sets `data-search-match`.",
		},
		{
			prop: "isActiveSearchMatch",
			type: "boolean",
			default: "—",
			description:
				"Paints the stronger active-match highlight (`bg-warning/35`) over `isSearchMatch` and sets `data-active-search-match`.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "—",
			description:
				"Blocks every write and every edit trigger in the wrapper and the variant, and sets `data-readonly`. Focus, selection and copy still work.",
		},
	];

	const multiSelectCellProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to write to. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Cell> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "cell",
			type: "Cell<TData, unknown>",
			default: "—",
			description:
				"The table-core cell: `getValue()` is the resting value, `column.columnDef.meta.cell` supplies the variant options, and `meta.label` the editor's `aria-label` (falling back to `columnId`).",
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Row-model index used for every write (`grid.updateData`), for the DOM registry key and for `data-cell-key`.",
		},
		{
			prop: "columnId",
			type: "string",
			default: "—",
			description:
				"Column id used for the write, the registry key, `data-cell-key` and the `aria-label` fallback.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "—",
			description:
				"Clamps the resting content to 1, 2, 3 or 4 lines (`line-clamp` on `[data-slot=data-grid-cell-content]`). The clamp is lifted while editing.",
		},
		{
			prop: "isEditing",
			type: "boolean",
			default: "—",
			description:
				"Opens a 260 px `DataGrid.CellEditor` holding a checkable `Command` list of the column's `options`, followed by a Clear all row only while at least one value is set — an empty cell's editor has none. Every toggle is written immediately, so Escape or an outside press rolls nothing back.",
		},
		{
			prop: "isFocused",
			type: "boolean",
			default: "—",
			description:
				"Draws the focus ring, sets `data-focused`, makes the wrapper the grid's tab stop (`tabindex=0` while not editing), and turns the next click, Enter, F2, space or printable key into an edit.",
		},
		{
			prop: "isSelected",
			type: "boolean",
			default: "—",
			description:
				"Paints the selection tint (`bg-primary/10`, suppressed while editing) and sets `data-selected`.",
		},
		{
			prop: "isSearchMatch",
			type: "boolean",
			default: "—",
			description: "Paints the match highlight (`bg-warning/15`) and sets `data-search-match`.",
		},
		{
			prop: "isActiveSearchMatch",
			type: "boolean",
			default: "—",
			description:
				"Paints the stronger active-match highlight (`bg-warning/35`) over `isSearchMatch` and sets `data-active-search-match`.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "—",
			description:
				"Blocks every write and every edit trigger in the wrapper and the variant, and sets `data-readonly`. Focus, selection and copy still work.",
		},
	];

	const dateCellProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to write to. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Cell> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "cell",
			type: "Cell<TData, unknown>",
			default: "—",
			description:
				"The table-core cell: `getValue()` is the resting value, `column.columnDef.meta.cell` supplies the variant options, and `meta.label` the editor's `aria-label` (falling back to `columnId`).",
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Row-model index used for every write (`grid.updateData`), for the DOM registry key and for `data-cell-key`.",
		},
		{
			prop: "columnId",
			type: "string",
			default: "—",
			description:
				"Column id used for the write, the registry key, `data-cell-key` and the `aria-label` fallback.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "—",
			description:
				"Clamps the resting content to 1, 2, 3 or 4 lines (`line-clamp` on `[data-slot=data-grid-cell-content]`). The clamp is lifted while editing.",
		},
		{
			prop: "isEditing",
			type: "boolean",
			default: "—",
			description:
				"Opens a `DataGrid.CellEditor` holding a single-date `Calendar` with dropdown month and year captions. Picking a day writes it and closes; Escape or an outside press closes without a write.",
		},
		{
			prop: "isFocused",
			type: "boolean",
			default: "—",
			description:
				"Draws the focus ring, sets `data-focused`, makes the wrapper the grid's tab stop (`tabindex=0` while not editing), and turns the next click, Enter, F2, space or printable key into an edit.",
		},
		{
			prop: "isSelected",
			type: "boolean",
			default: "—",
			description:
				"Paints the selection tint (`bg-primary/10`, suppressed while editing) and sets `data-selected`.",
		},
		{
			prop: "isSearchMatch",
			type: "boolean",
			default: "—",
			description: "Paints the match highlight (`bg-warning/15`) and sets `data-search-match`.",
		},
		{
			prop: "isActiveSearchMatch",
			type: "boolean",
			default: "—",
			description:
				"Paints the stronger active-match highlight (`bg-warning/35`) over `isSearchMatch` and sets `data-active-search-match`.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "—",
			description:
				"Blocks every write and every edit trigger in the wrapper and the variant, and sets `data-readonly`. Focus, selection and copy still work.",
		},
	];

	const fileCellProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid to write to. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.Cell> must be used within <DataGrid.Root>.` at initialisation.",
		},
		{
			prop: "cell",
			type: "Cell<TData, unknown>",
			default: "—",
			description:
				"The table-core cell: `getValue()` is the resting value, `column.columnDef.meta.cell` supplies the variant options, and `meta.label` the editor's `aria-label` (falling back to `columnId`).",
		},
		{
			prop: "rowIndex",
			type: "number",
			default: "—",
			description:
				"Row-model index used for every write (`grid.updateData`), for the DOM registry key and for `data-cell-key`.",
		},
		{
			prop: "columnId",
			type: "string",
			default: "—",
			description:
				"Column id used for the write, the registry key, `data-cell-key` and the `aria-label` fallback.",
		},
		{
			prop: "rowHeight",
			type: "'short' | 'medium' | 'tall' | 'extra-tall'",
			default: "—",
			description:
				"Clamps the resting content to 1, 2, 3 or 4 lines (`line-clamp` on `[data-slot=data-grid-cell-content]`). The clamp is lifted while editing.",
		},
		{
			prop: "isEditing",
			type: "boolean",
			default: "—",
			description:
				"Opens a 400 px `DataGrid.CellEditor` with a drop zone, the hidden file input, the per-file list and Clear all. Space opens the picker, Tab moves along the row. Adds and removes are written as they happen, so dismissal rolls nothing back; only the transient error message is cleared.",
		},
		{
			prop: "isFocused",
			type: "boolean",
			default: "—",
			description:
				"Draws the focus ring, sets `data-focused`, makes the wrapper the grid's tab stop (`tabindex=0` while not editing), and turns the next click, Enter, F2, space or printable key into an edit.",
		},
		{
			prop: "isSelected",
			type: "boolean",
			default: "—",
			description:
				"Paints the selection tint (`bg-primary/10`, suppressed while editing) and sets `data-selected`.",
		},
		{
			prop: "isSearchMatch",
			type: "boolean",
			default: "—",
			description: "Paints the match highlight (`bg-warning/15`) and sets `data-search-match`.",
		},
		{
			prop: "isActiveSearchMatch",
			type: "boolean",
			default: "—",
			description:
				"Paints the stronger active-match highlight (`bg-warning/35`) over `isSearchMatch` and sets `data-active-search-match`.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "—",
			description:
				"Blocks every write and every edit trigger in the wrapper and the variant, and sets `data-readonly`. Focus, selection and copy still work.",
		},
	];

	const columnHeaderProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid whose sorting and column selection the menu drives. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.ColumnHeader> must be used within <DataGrid.Root>.`",
		},
		{
			prop: "header",
			type: "Header<TData, unknown>",
			default: "—",
			description:
				"The table-core header. Its column supplies the label (`meta.label`, else a string `header`, else the id), the variant icon, and which menu items and the resizer render (`getCanSort`, `getCanPin`, `getCanHide`, `getCanResize`).",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable; the trigger button.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged onto the trigger, after the class that disables pointer events while any column is being resized.",
		},
		{
			prop: "...restProps",
			type: "Omit<DropdownMenuPrimitive.TriggerProps, 'child' | 'children'>",
			default: "—",
			description:
				"Spread onto the trigger last; a caller `onpointerdown` replaces the column-select press.",
		},
	];

	const columnResizerProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid whose column sizing is written and whose mounted cells the auto-fit measures. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.ColumnResizer> must be used within <DataGrid.Root>.`",
		},
		{
			prop: "header",
			type: "Header<TData, unknown>",
			default: "—",
			description:
				"The header whose column the handle resizes: its `getResizeHandler()` drives mouse and touch drags, and `column.columnDef.minSize`/`maxSize` — else the table's defaults, else 60/800 — bound every keyboard and auto-fit write.",
		},
		{
			prop: "label",
			type: "string",
			default: "—",
			description: "Goes into the accessible name, `Resize {label} column`.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: 'Bindable; the `role="separator"` handle.',
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the handle's own classes, including the resting `opacity-0`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the handle last; a caller `onkeydown`, `ondblclick`, `onfocus`, `onmousedown` or `ontouchstart` replaces the corresponding built-in gesture.",
		},
	];

	const contextMenuProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid whose `contextMenu` slice opens the menu and whose clipboard, clear and delete actions the items call. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.ContextMenu> must be used within <DataGrid.Root>.`",
		},
	];

	const pasteDialogProps: PropRow[] = [
		{
			prop: "grid",
			type: "DataGridState<TData>",
			default: "—",
			description:
				"The grid whose `clipboard.pasteDialog` slice opens the dialog and whose `clipboard.paste()` Continue replays. Absent, the one `DataGrid.Root` published is used; with neither, the part throws `<DataGrid.PasteDialog> must be used within <DataGrid.Root>.`",
		},
	];

	const searchProps: PropRow[] = [
		{
			prop: "search",
			type: "DataGridSearchState",
			default: "—",
			description:
				"The search state to drive. Absent, `grid.search` from the `DataGrid.Root` context is used — which is `undefined` unless `enableSearch` was set, and then the box renders nothing. With neither a `search` prop nor a root, the part throws `<DataGrid.Search> must be used within <DataGrid.Root>.`",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				'Bindable; the `role="search"` panel. `null` while the box is closed, because nothing is rendered.',
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged onto the panel, after the absolute top-end positioning.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the panel last, so a caller `style` can reposition it.",
		},
	];

	const keyboardShortcutsProps: PropRow[] = [
		{
			prop: "open",
			type: "boolean",
			default: "undefined",
			description:
				"Bindable; whether the dialog is open. Left `undefined`, it is seeded once from `defaultOpen` and the dialog manages itself.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Seeds `open` once, at initialisation, when `open` was left `undefined`.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description:
				"Called after every transition the dialog performs itself — the Ctrl/Cmd+/ shortcut, the close button, Escape, an outside press. Not called when the parent writes `open` directly. Closing also clears the filter box.",
		},
		{
			prop: "enableSearch",
			type: "boolean",
			default: "false",
			description:
				"Adds the Search group (Ctrl/Cmd+F, Enter, Shift+Enter, Esc). Descriptive only — it enables nothing; match it to the `enableSearch` option of `createDataGrid`.",
		},
		{
			prop: "enableUndoRedo",
			type: "boolean",
			default: "false",
			description:
				"Adds Undo (Ctrl/Cmd+Z) and Redo (Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y) rows to the Editing group. The grid ships no undo stack, so only set it when you provide one.",
		},
		{
			prop: "enablePaste",
			type: "boolean",
			default: "false",
			description:
				"Adds the Ctrl/Cmd+V row to the Editing group; descriptive only, match it to the `enablePaste` option.",
		},
		{
			prop: "enableRowAdd",
			type: "boolean",
			default: "false",
			description:
				"Adds the Shift+Enter Insert row below row to the Editing group; descriptive only, match it to `onRowAdd`.",
		},
		{
			prop: "enableRowsDelete",
			type: "boolean",
			default: "false",
			description:
				"Adds the Ctrl/Cmd+Backspace and Ctrl/Cmd+Delete rows to the Editing group; descriptive only, match it to `onRowsDelete`.",
		},
	];

	const shortcutCardProps: PropRow[] = [
		{
			prop: "keys",
			type: "string[]",
			default: "—",
			description:
				"Rendered as one `<kbd>` per entry, joined with `+`. Entries are keyed by value, so the same key twice in one shortcut is a duplicate-key error.",
		},
		{
			prop: "description",
			type: "string",
			default: "—",
			description: "The text at the start of the row.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable; the row element.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the row's flex layout classes.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the row element last.",
		},
	];

	const keyboard = [
		{
			keys: "Ctrl/Cmd + F",
			description:
				"With `enableSearch`, toggles the find box. Checked ahead of every other binding.",
		},
		{
			keys: "Enter / Shift + Enter / Escape (find box open)",
			description:
				"Next match / previous match / close the box. While it is open and no cell is editing, the grid handles no other key.",
		},
		{
			keys: "Ctrl/Cmd + Backspace / Delete",
			description:
				"With `onRowsDelete` and not read-only, deletes the selected rows — else the rows of the selected cells, else the focused row. The only binding below the search ones that needs no focused cell.",
		},
		{
			keys: "Ctrl/Cmd + A",
			description: "Selects every cell of every row in the current row model.",
		},
		{
			keys: "Ctrl/Cmd + C",
			description:
				"Copies the selected cells — the focused one when nothing is selected — to the clipboard as TSV, and drops any cut marks.",
		},
		{
			keys: "Ctrl/Cmd + X",
			description:
				"Copies the same cells and marks them `data-cut`; the next paste clears them. Blocked by `readOnly`.",
		},
		{
			keys: "Ctrl/Cmd + V",
			description:
				"With `enablePaste` and not read-only, pastes the clipboard TSV with its top-left cell on the focused cell.",
		},
		{
			keys: "Delete / Backspace",
			description:
				"Clears the selected cells — else the focused cell — to each column's empty value. Blocked by `readOnly`.",
		},
		{
			keys: "Shift + Enter",
			description: "With `onRowAdd` and not read-only, inserts a row through it.",
		},
		{
			keys: "ArrowUp / ArrowDown / ArrowLeft / ArrowRight",
			description:
				"Moves focus one cell, clearing any selection first. Row steps clamp to the first and last row, column steps stop at the first and last navigable column; left and right mirror under `rtl`.",
		},
		{
			keys: "Shift + Arrow",
			description:
				"Extends the selection from its anchor — the focused cell when there is none — one cell in that direction, without moving focus.",
		},
		{
			keys: "Ctrl/Cmd + ArrowUp / ArrowDown",
			description: "First / last row, same column.",
		},
		{
			keys: "Ctrl/Cmd + ArrowLeft / ArrowRight",
			description: "First / last navigable column, same row (the same as Home / End).",
		},
		{
			keys: "Ctrl/Cmd + Shift + Arrow",
			description:
				"Extends the selection to the first or last row, or to the first or last navigable column.",
		},
		{
			keys: "PageUp / PageDown, Alt + ArrowUp / ArrowDown",
			description:
				"Moves focus one page of rows — the number of rows currently mounted, 10 when none is — clamped to the row range.",
		},
		{
			keys: "Alt + PageUp / PageDown",
			description: "Moves focus five navigable columns left or right (`HORIZONTAL_PAGE_SIZE`).",
		},
		{
			keys: "Home / End",
			description: "First / last navigable column of the focused row.",
		},
		{
			keys: "Ctrl/Cmd + Home / End",
			description: "First cell of the first row / last cell of the last row.",
		},
		{
			keys: "Tab / Shift + Tab",
			description:
				"Next / previous navigable column, mirrored under `rtl`; stops at the edge rather than leaving the grid, and never extends the selection.",
		},
		{
			keys: "Escape",
			description:
				"Clears the cell and row selection when there is one; otherwise blurs the focused cell.",
		},
		{
			keys: "Enter / F2 / Space / printable key (resting cell)",
			description:
				"Starts editing the focused cell — owned by the cell wrapper, so the checkbox variant toggles instead. While editing, Enter, Tab and Escape belong to the variant's editor, which commits or reverts before the grid sees them.",
		},
	];
</script>

<DocPage title="Data grid">
	{#snippet subtitle()}
		A virtualized, spreadsheet-like editable grid: keyboard navigation, rectangular cell selection,
		clipboard support and nine cell variants. Reach for it over the
		<a class="text-primary underline underline-offset-3" href={href("/components/data-table")}
			>Data table</a
		>
		when cells are edited in place, or when the list is too long to page — it windows its rows instead
		of paginating them, and draws its own ARIA grid rather than the table markup the
		<a class="text-primary underline underline-offset-3" href={href("/components/table")}>Table</a>
		primitive and the Data table share. The trade is the Data table's furniture: no pagination, and a
		toolbar and filter controls the caller builds. Elsewhere "data grid" names that table pattern rather
		than this spreadsheet, so its demos live with the
		<a class="text-primary underline underline-offset-3" href={href("/components/data-table")}
			>Data table</a
		>.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			— thirty skate tricks. Click a cell to focus it, click again or press Enter to edit,
			Ctrl/Cmd+F to search, Ctrl/Cmd+/ for the shortcut list.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-stretch justify-stretch p-0">
				<DataGrid.Root {grid} height={340}>
					<DataGrid.KeyboardShortcuts enableSearch enablePaste enableRowAdd enableRowsDelete />
				</DataGrid.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Cell variants">
		{#snippet blurb()}
			The four variants upstream's demo does not show: multi-select, long text, URL and file.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-stretch justify-stretch p-0">
				<DataGrid.Root grid={noteGrid} height={260}>
					<p class="px-1 pt-2 text-xs text-muted-foreground">
						The Footage column accepts up to 3 videos or images of 8 MB each, uploaded through
						<code>onFilesUpload</code>. {deletedFileCount}
						file{deletedFileCount === 1 ? "" : "s"} removed through
						<code>onFilesDelete</code> this session.
					</p>
				</DataGrid.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">createDataGrid(options)</h3>
			<p class="text-sm text-muted-foreground">
				Creates the grid state: the table-core instance, the six writable table slices, the
				selection, clipboard and virtualizer sub-states, and — with <code>enableSearch</code> — the
				search state. Call it during component initialisation, it creates runes, and hand the result
				to <code>DataGrid.Root</code>. Only <code>data</code>, <code>columns</code> and
				<code>state</code> accept getters; every other option is read as it was given.
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
			<h3 class="text-base font-medium">DataGrid.Root</h3>
			<p class="text-sm text-muted-foreground">
				The wrapper <code>div</code> and, inside it, the <code>role="grid"</code> scroll container:
				a sticky header rowgroup, the virtualized body and — when <code>onRowAdd</code> was provided
				and the grid is not read-only — the sticky Add row footer. It publishes <code>grid</code> to
				context, renders <code>DataGrid.Search</code>, <code>DataGrid.ContextMenu</code> and
				<code>DataGrid.PasteDialog</code> itself, owns the keyboard contract, and drops focus and selection
				on a press outside the grid that is not inside a floating layer.
			</p>
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
			<h3 class="text-base font-medium">DataGrid.Row</h3>
			<p class="text-sm text-muted-foreground">
				One <code>role="row"</code> element, absolutely positioned inside the virtualized body,
				holding a <code>role="gridcell"</code> container per visible cell — width from
				<code>--col-&lt;id&gt;-size</code>, pinned columns stuck to their edge,
				<code>data-highlighted</code>
				on the focused cell's container. <code>DataGrid.Root</code> renders it for every mounted row
				unless its <code>row</code> snippet is set.
			</p>
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
							{#each rowProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.Cell</h3>
			<p class="text-sm text-muted-foreground">
				The variant router. It reads <code>cell.column.columnDef.meta.cell.variant</code> and
				renders the matching variant part with the same props; an absent or unknown variant renders
				<code>DataGrid.ShortTextCell</code>. Every variant below takes this same
				<code>DataGridCellVariantProps</code>
				set, so only the <code>isEditing</code> row differs between them.
			</p>
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
							{#each cellProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.CellWrapper</h3>
			<p class="text-sm text-muted-foreground">
				The <code>role="button"</code> element every variant renders its content into. It carries
				the state data attributes (<code>data-focused</code>, <code>data-selected</code>,
				<code>data-editing</code>, <code>data-search-match</code>,
				<code>data-active-search-match</code>, <code>data-cut</code>, <code>data-readonly</code>),
				the focus ring, the selection and search tints, the row-height line clamp, the drag-select
				and context-menu pointer handlers, and the click, double-click and key triggers that start
				an edit. It registers itself with the grid's DOM registry while mounted.
			</p>
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
							{#each cellWrapperProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.CellEditor</h3>
			<p class="text-sm text-muted-foreground">
				A portalled bits-ui <code>Popover</code> layer that the overlay variants — long text,
				select, multi-select, date, file — open flush over their cell. Portalling is what lets it
				escape the grid's <code>overflow: auto</code>; its dismissable and escape layers listen on
				the document, so an outside press or Escape closes it wherever focus sits.
			</p>
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
							{#each cellEditorProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.ShortTextCell</h3>
			<p class="text-sm text-muted-foreground">
				The default variant: a <code>role="textbox"</code> <code>div</code> showing
				<code>String(value ?? '')</code>, edited in place through <code>contenteditable</code> — no
				popover. A printable key typed on the focused cell replaces the text when the editor opens.
				Writes a <code>string</code>, only when it changed.
			</p>
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
							{#each shortTextCellProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.LongTextCell</h3>
			<p class="text-sm text-muted-foreground">
				A <code>span</code> showing the text, clamped to the row height, edited in a
				<code>Textarea</code>
				inside a <code>DataGrid.CellEditor</code>. Writes a <code>string</code>, only when it
				changed.
			</p>
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
							{#each longTextCellProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.NumberCell</h3>
			<p class="text-sm text-muted-foreground">
				Shows the number as text at rest and a spinner-less <code>&lt;input type="number"&gt;</code>
				while editing. A digit typed on the focused cell replaces the value and Backspace starts from
				empty. Writes a <code>number</code> clamped to the column's <code>min</code>/<code>max</code
				>
				— the input's attributes alone would not stop a typed 5000 in a <code>max: 10</code> column
				— or <code>null</code> for an empty input.
			</p>
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
							{#each numberCellProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.UrlCell</h3>
			<p class="text-sm text-muted-foreground">
				Shows the value as a <code>target="_blank"</code> link at rest — a bare domain is prefixed
				with <code>https://</code>; a <code>javascript:</code>, <code>data:</code>,
				<code>vbscript:</code>
				or <code>file:</code> value renders as an inert <code>data-invalid</code> link that toasts
				on click — and edits it in place through the same <code>contenteditable</code> editor as
				short text. Writes a trimmed <code>string</code>, or <code>null</code> when emptied.
			</p>
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
							{#each urlCellProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.CheckboxCell</h3>
			<p class="text-sm text-muted-foreground">
				A centred <code>Checkbox</code> bound to <code>Boolean(value)</code>. It toggles in place —
				a click on the focused cell, space, Enter or F2 — and never enters edit mode; a double click
				has already toggled twice and starts nothing. Writes a <code>boolean</code>.
			</p>
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
							{#each checkboxCellProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.SelectCell</h3>
			<p class="text-sm text-muted-foreground">
				A secondary <code>Badge</code> showing the label of the option whose <code>value</code>
				matches the stored string — or the raw value when none does — and a searchable
				<code>Command</code>
				list of <code>meta.cell.options</code> inside a <code>DataGrid.CellEditor</code>. Writes the
				chosen option's <code>value</code>.
			</p>
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
							{#each selectCellProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.MultiSelectCell</h3>
			<p class="text-sm text-muted-foreground">
				A <code>BadgeOverflow</code> of the labels for the stored <code>string[]</code>, sized to
				the row height, and a checkable <code>Command</code> list of <code>meta.cell.options</code>
				with a Clear all row inside a <code>DataGrid.CellEditor</code>. Writes a
				<code>string[]</code> on every toggle.
			</p>
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
							{#each multiSelectCellProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.DateCell</h3>
			<p class="text-sm text-muted-foreground">
				Shows the stored <code>YYYY-MM-DD</code> as <code>toLocaleDateString()</code> — a string
				that does not parse as a real local date, Feb 30 included, is echoed verbatim — and a
				single-date <code>Calendar</code> inside a <code>DataGrid.CellEditor</code>. Writes a
				<code>YYYY-MM-DD</code> string built from local date components, so there is no timezone drift.
			</p>
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
							{#each dateCellProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.FileCell</h3>
			<p class="text-sm text-muted-foreground">
				A <code>BadgeOverflow</code> of file-name badges with a type icon for the stored
				<code>FileCellData[]</code>, and a <code>DataGrid.CellEditor</code> holding a drop zone, the
				hidden file input, the file list and Clear all. Files are checked against
				<code>meta.cell.maxFileSize</code>
				(10 MB), <code>maxFiles</code> (10) and <code>accept</code> — the first failure is toasted —
				then handed to <code>onFilesUpload</code>, or stored with a <code>blob:</code> URL when
				there is none. Removals go through <code>onFilesDelete</code> first.
			</p>
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
							{#each fileCellProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.ColumnHeader</h3>
			<p class="text-sm text-muted-foreground">
				The header cell's content: a <code>DropdownMenu.Trigger</code> button showing the variant
				icon (with a tooltip naming the variant), the label and a chevron, opening a menu of Sort
				asc / Sort desc / Remove sort, Pin to left / right (or unpin) and Hide column — each group
				present only when the column allows it — followed by a <code>DataGrid.ColumnResizer</code>
				when the column is resizable. Sorting goes through <code>table.setSorting</code>, so
				<code>onSortingChange</code> fires.
			</p>
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
							{#each columnHeaderProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.ColumnResizer</h3>
			<p class="text-sm text-muted-foreground">
				A focusable vertical <code>role="separator"</code> at the header cell's end edge, dragged
				with the mouse or touch through table-core's resize handler. From the keyboard, the arrows
				step the width by 10 px (mirrored under <code>rtl</code>), Home and End jump to the column's
				<code>minSize</code>/<code>maxSize</code>, Enter re-bases the restore point and Escape
				restores the width the handle was focused at. A double click auto-fits the column to its
				widest mounted cell plus 24 px.
			</p>
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
							{#each columnResizerProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.ContextMenu</h3>
			<p class="text-sm text-muted-foreground">
				The right-click menu: Copy, Cut, Clear and — when <code>onRowsDelete</code> was provided —
				Delete rows, with the mutating items disabled under <code>readOnly</code>. It renders
				nothing until <code>grid.contextMenu.open</code>, then a <code>DropdownMenu</code> anchored
				at the stored viewport point through a 1×1 invisible fixed trigger; closing returns focus to
				the grid. <code>DataGrid.Root</code> renders one already.
			</p>
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
							{#each contextMenuProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.PasteDialog</h3>
			<p class="text-sm text-muted-foreground">
				The confirmation a paste raises when it needs more rows than the grid has and a row-add
				handler exists: Create new rows replays the paste with row expansion, Keep current rows
				pastes only what fits. It renders nothing until <code>grid.clipboard.pasteDialog.open</code
				>. <code>DataGrid.Root</code> renders one already.
			</p>
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
							{#each pasteDialogProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.Search</h3>
			<p class="text-sm text-muted-foreground">
				The find box: a <code>role="search"</code> panel at the grid's top end corner, rendered only
				while <code>search.open</code>. Typing re-runs the search 150 ms after the last keystroke;
				Enter and Shift+Enter step through the matches (wrapping), the arrow buttons do the same,
				and Escape or Ctrl/Cmd+F in the box closes it — which moves grid focus onto the match that
				was active. <code>DataGrid.Root</code> renders one when <code>enableSearch</code> was set.
			</p>
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
							{#each searchProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.KeyboardShortcuts</h3>
			<p class="text-sm text-muted-foreground">
				A <code>Dialog</code> listing the grid's shortcuts by group — Navigation, Selection,
				Editing, optionally Search, General — with a filter box that matches descriptions and key
				names. A window-level listener opens it on Ctrl/Cmd+/ from anywhere on the page for as long
				as the part is mounted; the modifier renders as ⌘ on Apple user agents.
				<code>DataGrid.Root</code> does not render it — place it in the root's children.
			</p>
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
							{#each keyboardShortcutsProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DataGrid.ShortcutCard</h3>
			<p class="text-sm text-muted-foreground">
				One row of the shortcuts dialog: the description at the start, and the keys as <code
					>&lt;kbd&gt;</code
				>
				elements joined by <code>+</code> at the end.
			</p>
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
							{#each shortcutCardProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Keyboard interactions</h3>
			<p class="text-sm text-muted-foreground">
				The grid's own contract, handled on the <code>role="grid"</code> container in this
				precedence order; every binding after the row-deletion one needs a focused cell. Under
				<code>dir="rtl"</code> the horizontal keys mirror.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Key</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each keyboard as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.keys}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
