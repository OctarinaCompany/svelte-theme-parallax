<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as DataGrid from "$lib/components/ui/data-grid/index.js";
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
</DocPage>
