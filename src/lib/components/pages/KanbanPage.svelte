<script lang="ts">
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import CircleIcon from "@lucide/svelte/icons/circle";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import CircleDotIcon from "@lucide/svelte/icons/circle-dot";
	import GripVerticalIcon from "@lucide/svelte/icons/grip-vertical";
	import { toast } from "svelte-sonner";

	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Kanban from "$lib/components/ui/kanban/index.js";
	import type {
		KanbanColumnHandleChildProps,
		KanbanDragEvent,
		KanbanItemChildProps,
	} from "$lib/components/ui/kanban/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The Kanban component page.
	 *
	 * THE CLASSIC THEME HAS A KANBAN PAGE, AND THIS PORT DOES NOT HAVE ITS COLOURS. The reference stylesheet
	 * carries a `kanban-*` block, which §12 of the theme notes lists among the things left
	 * deliberately unported — "component-specific colours for pages that do not exist here yet".
	 * They still do not exist.
	 *
	 * So the board is painted from the generic tokens: `--card` for a column, `--muted` for the
	 * board behind it, `--border` for the seams. That is a real divergence from the classic theme rather
	 * than an absence of one, and it is recorded here so the `kanban-*` block is a known thing to
	 * pick up rather than a discovery.
	 */

	type Task = {
		id: string;
		title: string;
		priority: "low" | "medium" | "high";
		assignee?: string;
		dueDate?: string;
	};

	const columnTitles: Record<string, string> = {
		backlog: "Backlog",
		inProgress: "In Progress",
		done: "Done",
	};

	const initialTasks: Record<string, Task[]> = {
		backlog: [
			{
				id: "1",
				title: "Add authentication",
				priority: "high",
				assignee: "John Doe",
				dueDate: "2024-04-01",
			},
			{
				id: "2",
				title: "Create API endpoints",
				priority: "medium",
				assignee: "Jane Smith",
				dueDate: "2024-04-05",
			},
			{
				id: "3",
				title: "Write documentation",
				priority: "low",
				assignee: "Bob Johnson",
				dueDate: "2024-04-10",
			},
		],
		inProgress: [
			{
				id: "4",
				title: "Design system updates",
				priority: "high",
				assignee: "Alice Brown",
				dueDate: "2024-03-28",
			},
			{
				id: "5",
				title: "Implement dark mode",
				priority: "medium",
				assignee: "Charlie Wilson",
				dueDate: "2024-04-02",
			},
		],
		done: [
			{
				id: "7",
				title: "Setup project",
				priority: "high",
				assignee: "Eve Davis",
				dueDate: "2024-03-25",
			},
			{
				id: "8",
				title: "Initial commit",
				priority: "low",
				assignee: "Frank White",
				dueDate: "2024-03-24",
			},
		],
	};

	function seed(): Record<string, Task[]> {
		return Object.fromEntries(
			Object.entries(initialTasks).map(([key, tasks]) => [key, [...tasks]]),
		);
	}

	let defaultBoard = $state<Record<string, Task[]>>(seed());
	let overlayBoard = $state<Record<string, Task[]>>(seed());

	const cardClass = "rounded-md border bg-card p-3 shadow-xs";

	function priorityVariant(priority: Task["priority"]) {
		if (priority === "high") return "destructive" as const;
		if (priority === "medium") return "default" as const;
		return "secondary" as const;
	}

	function taskFor(board: Record<string, Task[]>, id: string | number): Task | undefined {
		return Object.values(board)
			.flat()
			.find((task) => task.id === String(id));
	}

	const rootProps = [
		{
			prop: "value",
			type: "Record<UniqueIdentifier, T[]>",
			default: "—",
			description: "The controlled board. Bindable; a function binding keeps you authoritative.",
		},
		{
			prop: "defaultValue",
			type: "Record<UniqueIdentifier, T[]>",
			default: "{}",
			description: "Initial board when uncontrolled. Read once, during initialisation.",
		},
		{
			prop: "onValueChange",
			type: "(columns: Record<UniqueIdentifier, T[]>) => void",
			default: "—",
			description: "Called with the whole new board on every committed move.",
		},
		{
			prop: "getItemValue",
			type: "(item: T) => UniqueIdentifier",
			default: "—",
			description: "Identifier for each item. Required at runtime for object arrays.",
		},
		{
			prop: "onMove",
			type: "(event: KanbanMoveEvent) => void",
			default: "—",
			description:
				"Intercepts the column reorder on drop; reports the net same-column item move, which onDragOver already committed.",
		},
		{
			prop: "orientation",
			type: '"horizontal" | "vertical"',
			default: '"horizontal"',
			description: "The axis the board lays its columns out on.",
		},
		{
			prop: "strategy",
			type: "SortableStrategy",
			default: "verticalListSortingStrategy",
			description: "Accepted for parity and read by nothing — upstream does the same.",
		},
		{
			prop: "modifiers",
			type: "SortableModifier[]",
			default: "—",
			description: "Clamps the dragged element's transform.",
		},
		{
			prop: "flatCursor",
			type: "boolean",
			default: "false",
			description: "Uses a neutral cursor instead of the grab/grabbing affordance.",
		},
		{
			prop: "dir",
			type: '"ltr" | "rtl"',
			default: "inherited",
			description: "Explicit direction; otherwise resolved from DirectionProvider or [dir].",
		},
		{
			prop: "id",
			type: "string",
			default: "$props.id()",
			description: "Base id for the live region and the screen-reader instructions.",
		},
		{
			prop: "accessibility",
			type: "KanbanAccessibility",
			default: "—",
			description: "Per-key announcement overrides and the upfront instruction text.",
		},
		{
			prop: "onDragStart / onDragMove / onDragOver / onDragEnd / onDragCancel",
			type: "(event: KanbanDragEvent) => void",
			default: "—",
			description: "The five drag lifecycle hooks, each receiving { active, over }.",
		},
	];

	const boardProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{ prop: "class", type: "string", default: "—", description: "Merged last through cn()." },
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the board onto your own element instead of the default div.",
		},
		{ prop: "children", type: "Snippet", default: "—", description: "The columns." },
	];

	const columnProps = [
		{
			prop: "value",
			type: "UniqueIdentifier",
			default: "— (required)",
			description: "The column identifier. Must be one of Object.keys(value).",
		},
		{
			prop: "asHandle",
			type: "boolean",
			default: "false",
			description: "Make the column itself the drag activator.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Neither draggable nor a drop target.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "class / style",
			type: "string",
			default: "—",
			description: "Both merged after the drag transform, so the caller wins.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render onto your own element; spread the props or it stops being draggable.",
		},
	];

	const columnHandleProps = [
		{
			prop: "disabled",
			type: "boolean",
			default: "the column's",
			description: "An explicit value on the handle wins over the column it belongs to.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{ prop: "class", type: "string", default: "—", description: "Merged last through cn()." },
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "How the handle composes onto <Button>.",
		},
	];

	const itemProps = [
		{
			prop: "value",
			type: "UniqueIdentifier",
			default: "— (required)",
			description: "The item identifier, as produced by the root's getItemValue.",
		},
		{
			prop: "asHandle",
			type: "boolean",
			default: "false",
			description: "Make the item itself the drag activator.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Neither draggable nor a drop target.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "class / style",
			type: "string",
			default: "—",
			description: "Both merged after the drag transform, so the caller wins.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render onto your own element; spread the props or it stops being draggable.",
		},
	];

	const itemHandleProps = [
		{
			prop: "disabled",
			type: "boolean",
			default: "the item's",
			description: "An explicit value on the handle wins over the item it belongs to.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{ prop: "class", type: "string", default: "—", description: "Merged last through cn()." },
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "How the handle composes onto <Button>.",
		},
	];

	const overlayProps = [
		{
			prop: "container",
			type: "Element | DocumentFragment | string | null",
			default: "document.body",
			description: "Where the floating preview is portalled to.",
		},
		{ prop: "class", type: "string", default: "—", description: "Merged last through cn()." },
		{
			prop: "children",
			type: "Snippet<[{ value, variant }]>",
			default: "—",
			description: "Fixed preview, or content driven by what is being dragged.",
		},
	];

	const dataAttributes = [
		{ part: "Board", attribute: "data-orientation", value: '"horizontal" | "vertical"' },
		{ part: "Column", attribute: "data-value", value: "The column identifier." },
		{ part: "Column", attribute: "data-disabled", value: "Present when the column is disabled." },
		{
			part: "Column",
			attribute: "data-dragging",
			value: "Present while the column is being dragged.",
		},
		{
			part: "ColumnHandle",
			attribute: "data-disabled",
			value: "Present when the column is disabled.",
		},
		{
			part: "ColumnHandle",
			attribute: "data-dragging",
			value: "Present while the parent column is being dragged.",
		},
		{ part: "Item", attribute: "data-value", value: "The item identifier." },
		{ part: "Item", attribute: "data-disabled", value: "Present when the item is disabled." },
		{ part: "Item", attribute: "data-dragging", value: "Present while the item is being dragged." },
		{ part: "ItemHandle", attribute: "data-disabled", value: "Present when the item is disabled." },
		{
			part: "ItemHandle",
			attribute: "data-dragging",
			value: "Present while the parent item is being dragged.",
		},
		{ part: "Overlay", attribute: "data-variant", value: '"column" | "item"' },
		{ part: "Overlay", attribute: "data-dragging", value: "Always present while it exists." },
		{
			part: "Every part",
			attribute: "data-flat-cursor",
			value: "Present when the root sets flatCursor.",
		},
	];

	const keyboardShortcuts = [
		{
			keys: "Enter / Space",
			description:
				"Picks the focused column or item up, and drops it at its current target when pressed again.",
		},
		{ keys: "ArrowUp", description: "Moves the drop target to the nearest candidate above." },
		{ keys: "ArrowDown", description: "Moves the drop target to the nearest candidate below." },
		{
			keys: "ArrowLeft",
			description:
				'Moves the drop target to the nearest candidate entirely to the left, including an empty column. Inverted under dir="rtl".',
		},
		{
			keys: "ArrowRight",
			description:
				'Moves the drop target to the nearest candidate entirely to the right, including an empty column. Inverted under dir="rtl".',
		},
		{
			keys: "Escape",
			description: "Cancels the drag and restores the board to where the pick-up found it.",
		},
		{
			keys: "Tab",
			description: "Swallowed while dragging — focus may not leave a grabbed element.",
		},
	];

	/*
	 * The sections below are the pattern appendix. Two of the six
	 * upstream demos are already on this page under other names — the placeholder-overlay board is
	 * "Default" and the dynamic-overlay board is "With Dynamic Overlay" — so only the four
	 * remaining compositions follow.
	 *
	 * Three standing substitutions apply to all of them, each a repository rule rather than an
	 * matter of taste:
	 *
	 * 1. NO REMOTE ASSETS. Upstream loads stock portraits into every assignee avatar; this repo
	 *    makes no network requests at runtime, so the avatars keep only their initials fallback
	 *    (the Card and Item pages are the precedent).
	 * 2. TOKENS ONLY. The roadmap board's hard-coded column dots (`bg-blue-500`, `bg-yellow-500`,
	 *    `bg-purple-500`, `bg-green-500`) map to the nearest semantic token.
	 * 3. HOUSE STATUS VOCABULARY. The `*-light` badge family becomes the `*-subtle` soft family
	 *    and `destructive-light` becomes `destructive-subtle`, per docs/CONVENTIONS.md §3. Badge
	 *    here has no `size` prop, so upstream's `size="sm"` is dropped rather than approximated.
	 *
	 * `Kanban.Column` paints its own column chrome (`border bg-muted p-2.5`), which upstream's does
	 * not; the Frame-based sections neutralise it with `border-0 bg-transparent p-0` so the Frame
	 * is the only shell, exactly as upstream reads.
	 */

	// --- Kanban board with frame columns ---

	type LabelledTask = {
		id: string;
		title: string;
		label: string;
		labelVariant:
			"primary-subtle" | "success-subtle" | "warning-subtle" | "destructive-subtle" | "info-subtle";
	};

	const frameColumns: Record<string, { title: string; icon: typeof CircleIcon }> = {
		todo: { title: "To Do", icon: CircleIcon },
		doing: { title: "In Progress", icon: CircleDotIcon },
		done: { title: "Done", icon: CircleCheckIcon },
	};

	let frameBoard = $state<Record<string, LabelledTask[]>>({
		todo: [
			{ id: "1", title: "Design landing page", label: "Design", labelVariant: "info-subtle" },
			{ id: "2", title: "Set up CI/CD pipeline", label: "DevOps", labelVariant: "warning-subtle" },
			{ id: "3", title: "Write unit tests", label: "Testing", labelVariant: "success-subtle" },
		],
		doing: [
			{ id: "4", title: "Implement auth flow", label: "Backend", labelVariant: "primary-subtle" },
			{
				id: "5",
				title: "Create component library",
				label: "Frontend",
				labelVariant: "destructive-subtle",
			},
		],
		done: [{ id: "6", title: "Project kickoff", label: "Planning", labelVariant: "info-subtle" }],
	});

	// --- Minimal kanban with stacked frame ---

	type ProgressTask = { id: string; title: string; assignee: string; progress: number };

	const stackedDescriptions: Record<string, string> = {
		planning: "Tasks being scoped",
		active: "Currently in development",
		completed: "Finished and deployed",
	};

	let stackedBoard = $state<Record<string, ProgressTask[]>>({
		planning: [{ id: "1", title: "Research competitors", assignee: "Alex J.", progress: 20 }],
		active: [
			{ id: "2", title: "Build dashboard", assignee: "Sarah C.", progress: 65 },
			{ id: "3", title: "API integration", assignee: "David K.", progress: 40 },
		],
		completed: [{ id: "4", title: "Setup repository", assignee: "Emma W.", progress: 100 }],
	});

	// --- Feature roadmap kanban with progress ---

	type Feature = {
		id: string;
		title: string;
		description: string;
		progress: number;
		votes: number;
	};

	// Upstream declares a fourth "testing" column here that its state never populates; the map is
	// kept as written so the board matches the published demo.
	const roadmapColumns: Record<string, { title: string; dot: string }> = {
		planned: { title: "Planned", dot: "bg-info" },
		building: { title: "Building", dot: "bg-warning" },
		testing: { title: "Testing", dot: "bg-primary" },
		shipped: { title: "Shipped", dot: "bg-success" },
	};

	let roadmapBoard = $state<Record<string, Feature[]>>({
		planned: [
			{
				id: "f1",
				title: "AI-powered search",
				description: "Natural language search across all content",
				progress: 0,
				votes: 142,
			},
			{
				id: "f2",
				title: "Custom webhooks",
				description: "User-configurable webhook endpoints",
				progress: 0,
				votes: 98,
			},
		],
		building: [
			{
				id: "f3",
				title: "Real-time collaboration",
				description: "Multi-user editing with presence indicators",
				progress: 65,
				votes: 234,
			},
			{
				id: "f4",
				title: "API v2 migration",
				description: "RESTful API with OpenAPI 3.0 spec",
				progress: 40,
				votes: 176,
			},
		],
		shipped: [
			{
				id: "f6",
				title: "Dark mode",
				description: "System-aware theme with manual override",
				progress: 100,
				votes: 456,
			},
			{
				id: "f7",
				title: "Export to CSV",
				description: "Bulk data export with custom fields",
				progress: 100,
				votes: 189,
			},
		],
	});

	// --- Kanban board persisted to a backend ---

	type PersistedTask = { id: string; title: string; priority: "low" | "medium" | "high" };

	const persistedColumnTitles: Record<string, string> = {
		todo: "To Do",
		inProgress: "In Progress",
		done: "Done",
	};

	let persistedBoard = $state<Record<string, PersistedTask[]>>({
		todo: [
			{ id: "1", title: "Add authentication", priority: "high" },
			{ id: "2", title: "Create API endpoints", priority: "medium" },
			{ id: "3", title: "Write documentation", priority: "low" },
		],
		inProgress: [
			{ id: "4", title: "Design system updates", priority: "high" },
			{ id: "5", title: "Implement dark mode", priority: "medium" },
		],
		done: [{ id: "6", title: "Setup project", priority: "low" }],
	});

	function persistedPriorityVariant(priority: PersistedTask["priority"]) {
		if (priority === "high") return "destructive-subtle" as const;
		if (priority === "medium") return "primary-subtle" as const;
		return "warning-subtle" as const;
	}

	/**
	 * Simulated backend. In a real app this would be a fetch or a query-client mutation. It rejects
	 * roughly one call in four so the rollback path is easy to see.
	 */
	function persistBoard(): Promise<void> {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				if (Math.random() < 0.25) reject(new Error("Network error"));
				else resolve();
			}, 700);
		});
	}

	function snapshotPersistedBoard(): Record<string, PersistedTask[]> {
		return Object.fromEntries(
			Object.entries(persistedBoard).map(([key, tasks]) => [key, [...tasks]]),
		);
	}

	// Upstream reaches for an `onValueCommit(next, meta)` prop that carries `previousValue` and the
	// kind of move. This Kanban has no such prop and is not going to grow one for a demo, so the
	// same guarantee is assembled from the two lifecycle hooks it does have: `onDragStart` takes the
	// pre-drag snapshot (correct even for item moves, which `onDragOver` commits live), and
	// `onDragEnd` fires exactly once per completed drag and is where the write is issued.
	let persistedSnapshot: Record<string, PersistedTask[]> | null = null;

	function columnOf(id: string): string | undefined {
		return Object.keys(persistedBoard).find(
			(key) => key === id || persistedBoard[key].some((task) => task.id === id),
		);
	}

	function onPersistedDragStart() {
		persistedSnapshot = snapshotPersistedBoard();
	}

	function onPersistedDragCancel() {
		persistedSnapshot = null;
	}

	function onPersistedDragEnd(event: KanbanDragEvent) {
		const previous = persistedSnapshot;
		persistedSnapshot = null;
		if (!previous) return;

		const activeId = String(event.active.id);
		const isColumn = activeId in persistedBoard;
		const container = columnOf(activeId) ?? activeId;
		const label = isColumn
			? `Reordered "${persistedColumnTitles[container] ?? container}"`
			: `Moved to "${persistedColumnTitles[container] ?? container}"`;

		toast.promise(persistBoard(), {
			loading: "Saving board...",
			success: () => label,
			error: () => {
				// Restore the pre-drag arrangement. In production prefer a refetch here, so a newer
				// drag is not clobbered by this snapshot.
				persistedBoard = previous;
				return "Could not save. Board restored.";
			},
		});
	}
</script>

{#snippet taskCard(task: Task)}
	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between gap-2">
			<span class="line-clamp-1 text-sm font-medium">{task.title}</span>
			<Badge
				variant={priorityVariant(task.priority)}
				class="pointer-events-none h-5 rounded-sm px-1.5 text-[11px] capitalize"
			>
				{task.priority}
			</Badge>
		</div>
		<div class="flex items-center justify-between text-xs text-muted-foreground">
			{#if task.assignee}
				<div class="flex items-center gap-1">
					<div class="size-2 rounded-full bg-primary/20"></div>
					<span class="line-clamp-1">{task.assignee}</span>
				</div>
			{/if}
			{#if task.dueDate}
				<time class="text-[10px] tabular-nums">{task.dueDate}</time>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet columnHeader(columnValue: string, count: number)}
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<span class="text-sm font-semibold">{columnTitles[columnValue] ?? columnValue}</span>
			<Badge variant="secondary" class="pointer-events-none rounded-sm">{count}</Badge>
		</div>
		<Kanban.ColumnHandle>
			{#snippet child({ props }: { props: KanbanColumnHandleChildProps })}
				<Button
					{...props as Record<string, unknown>}
					variant="ghost"
					size="icon"
					class={props.class}
					aria-label="Drag column"
				>
					<GripVerticalIcon class="size-4" />
				</Button>
			{/snippet}
		</Kanban.ColumnHandle>
	</div>
{/snippet}

<DocPage title="Kanban">
	{#snippet subtitle()}
		A drag and drop kanban board for organizing items into columns — reorder inside a column, move
		between columns and reorder whole columns, with a pointer, with touch or from the keyboard
		alone.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			— an object board with getItemValue, each card its own drag activator, the column handle
			composed onto Button, and a fixed overlay.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Kanban.Root bind:value={defaultBoard} getItemValue={(task) => task.id}>
					<Kanban.Board class="grid auto-rows-fr gap-4 sm:grid-cols-3">
						{#each Object.entries(defaultBoard) as [columnValue, tasks] (columnValue)}
							<Kanban.Column value={columnValue}>
								{@render columnHeader(columnValue, tasks.length)}
								<div class="flex flex-col gap-2 p-0.5">
									{#each tasks as task (task.id)}
										<Kanban.Item value={task.id} asHandle>
											{#snippet child({ props }: { props: KanbanItemChildProps })}
												<div
													{...props as Record<string, unknown>}
													class={cn(props.class, cardClass)}
												>
													{@render taskCard(task)}
												</div>
											{/snippet}
										</Kanban.Item>
									{/each}
								</div>
							</Kanban.Column>
						{/each}
					</Kanban.Board>
					<!--
						The first demo renders its overlay empty and styles the box instead —
						`<KanbanOverlay className="bg-muted/10 rounded-md border-2 border-dashed" />` — so what follows the cursor there is a slot outline, not a
						copy of the column. Worth stating, because the source column staying put looks
						like a bug and is not: dnd-kit nulls the active item's own transform whenever a
						`DragOverlay` is mounted (`shouldDisplaceDragSource = !useDragOverlay &&
						isDragging`), so upstream leaves it faded in place exactly as this does.

						The dashed edge is the part that was missing here. A bare `bg-primary/10` fill
						carries almost nothing against a card, which made the whole gesture read as
						nothing moving at all; the border is what makes the travelling slot legible, and
						it is why upstream draws one.
					-->
					<Kanban.Overlay>
						<div class="size-full rounded-md border-2 border-dashed bg-muted/10"></div>
					</Kanban.Overlay>
				</Kanban.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With dynamic overlay">
		{#snippet blurb()}
			— the overlay snippet receives the active identifier and whether it is a column or an item,
			and renders a whole column preview or a single card.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Kanban.Root bind:value={overlayBoard} getItemValue={(task) => task.id}>
					<Kanban.Board class="grid auto-rows-fr gap-4 sm:grid-cols-3">
						{#each Object.entries(overlayBoard) as [columnValue, tasks] (columnValue)}
							<Kanban.Column value={columnValue}>
								{@render columnHeader(columnValue, tasks.length)}
								<div class="flex flex-col gap-2 p-0.5">
									{#each tasks as task (task.id)}
										<Kanban.Item value={task.id} asHandle>
											{#snippet child({ props }: { props: KanbanItemChildProps })}
												<div
													{...props as Record<string, unknown>}
													class={cn(props.class, cardClass)}
												>
													{@render taskCard(task)}
												</div>
											{/snippet}
										</Kanban.Item>
									{/each}
								</div>
							</Kanban.Column>
						{/each}
					</Kanban.Board>
					<Kanban.Overlay>
						{#snippet children({ value, variant })}
							{#if variant === "column"}
								{@const tasks = overlayBoard[String(value)] ?? []}
								<Kanban.Column value={String(value)}>
									{@render columnHeader(String(value), tasks.length)}
									<div class="flex flex-col gap-2 p-0.5">
										{#each tasks as task (task.id)}
											<div class={cardClass}>{@render taskCard(task)}</div>
										{/each}
									</div>
								</Kanban.Column>
							{:else}
								{@const task = taskFor(overlayBoard, value)}
								{#if task}
									<div class={cardClass}>{@render taskCard(task)}</div>
								{/if}
							{/if}
						{/snippet}
					</Kanban.Overlay>
				</Kanban.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Kanban (Root)</h3>
			<p class="text-sm text-muted-foreground">
				Renders no element of its own — only its children plus a visually hidden live region and the
				screen-reader instructions.
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
			<h3 class="text-base font-medium">Kanban.Board</h3>
			<p class="text-sm text-muted-foreground">The container the columns are laid out in.</p>
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
							{#each boardProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Kanban.Column</h3>
			<p class="text-sm text-muted-foreground">
				One column of the board — itself draggable, and the drop region its items belong to.
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
							{#each columnProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Kanban.ColumnHandle</h3>
			<p class="text-sm text-muted-foreground">The button a column drag starts from.</p>
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
							{#each columnHandleProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Kanban.Item</h3>
			<p class="text-sm text-muted-foreground">One card, belonging to the column it renders in.</p>
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
							{#each itemProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Kanban.ItemHandle</h3>
			<p class="text-sm text-muted-foreground">The button an item drag starts from.</p>
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
							{#each itemHandleProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Kanban.Overlay</h3>
			<p class="text-sm text-muted-foreground">
				A portalled floating preview that exists only while a drag is active.
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
							{#each overlayProps as row (row.prop)}
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

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard Interactions</h3>
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
							{#each keyboardShortcuts as row (row.keys)}
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

	<DocSection title="Kanban board with frame columns">
		{#snippet blurb()}
			— demo 3. Frame supplies both shells: a bordered frame per column, carrying the status icon
			and the count in its header, and a ghost frame per card so the drag target and the panel are
			the same rectangle.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Kanban.Root bind:value={frameBoard} getItemValue={(task) => task.id}>
					<Kanban.Board class="grid auto-rows-fr gap-4 sm:grid-cols-3">
						{#each Object.entries(frameBoard) as [columnValue, tasks] (columnValue)}
							{@const column = frameColumns[columnValue]}
							<Kanban.Column value={columnValue} class="border-0 bg-transparent p-0">
								<Frame.Root spacing="sm" class="h-full">
									<Frame.Header class="flex-row items-center gap-2">
										<column.icon class="size-4 text-muted-foreground" aria-hidden="true" />
										<Frame.Title>{column.title}</Frame.Title>
										<Badge variant="outline" class="ml-auto">{tasks.length}</Badge>
									</Frame.Header>
									<div class="flex flex-col gap-2 p-0.5">
										{#each tasks as task (task.id)}
											<Kanban.Item value={task.id} asHandle>
												<Frame.Root variant="ghost" spacing="sm" class="p-0">
													<Frame.Panel class="p-3">
														<div class="flex flex-col gap-2">
															<span class="text-sm font-medium">{task.title}</span>
															<Badge variant={task.labelVariant} class="w-fit">{task.label}</Badge>
														</div>
													</Frame.Panel>
												</Frame.Root>
											</Kanban.Item>
										{/each}
									</div>
								</Frame.Root>
							</Kanban.Column>
						{/each}
					</Kanban.Board>
					<Kanban.Overlay class="rounded-md border-2 border-dashed bg-muted/10" />
				</Kanban.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Minimal kanban with stacked frame">
		{#snippet blurb()}
			— demo 4. The column frame is <code>stacked</code>, so its header and the cards below it fuse
			into one segmented block instead of reading as separate panels.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Kanban.Root bind:value={stackedBoard} getItemValue={(task) => task.id}>
					<Kanban.Board class="grid auto-rows-fr gap-4 sm:grid-cols-3">
						{#each Object.entries(stackedBoard) as [columnValue, tasks] (columnValue)}
							<Kanban.Column value={columnValue} class="border-0 bg-transparent p-0">
								<Frame.Root stacked spacing="sm" class="h-full">
									<Frame.Header>
										<div class="flex items-center justify-between">
											<Frame.Title class="capitalize">{columnValue}</Frame.Title>
											<Badge variant="outline">{tasks.length}</Badge>
										</div>
										<Frame.Description>{stackedDescriptions[columnValue]}</Frame.Description>
									</Frame.Header>
									<div class="flex flex-col gap-2 p-0.5">
										{#each tasks as task (task.id)}
											<Kanban.Item value={task.id} asHandle>
												<Frame.Root variant="ghost" spacing="xs" class="p-0">
													<Frame.Panel class="flex flex-col gap-3 p-3">
														<p class="text-sm font-medium">{task.title}</p>
														<Progress value={task.progress} class="h-1" />
														<div class="flex items-center justify-between">
															<div class="flex items-center gap-1.5">
																<Avatar.Root class="size-5">
																	<Avatar.Fallback class="text-[9px]">
																		{task.assignee.charAt(0)}
																	</Avatar.Fallback>
																</Avatar.Root>
																<span class="text-xs text-muted-foreground">{task.assignee}</span>
															</div>
															<span class="text-xs text-muted-foreground">{task.progress}%</span>
														</div>
													</Frame.Panel>
												</Frame.Root>
											</Kanban.Item>
										{/each}
									</div>
								</Frame.Root>
							</Kanban.Column>
						{/each}
					</Kanban.Board>
					<Kanban.Overlay class="rounded-md border-2 border-dashed bg-muted/10" />
				</Kanban.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Feature roadmap kanban with progress">
		{#snippet blurb()}
			— demo 5. A public roadmap: each card carries a completion bar and a vote count, and each
			column is identified by a coloured dot rather than an icon.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Kanban.Root bind:value={roadmapBoard} getItemValue={(feature) => feature.id}>
					<Kanban.Board class="grid gap-4 sm:grid-cols-3">
						{#each Object.entries(roadmapBoard) as [columnValue, features] (columnValue)}
							{@const column = roadmapColumns[columnValue]}
							<Kanban.Column value={columnValue} class="border-0 bg-transparent p-0">
								<Frame.Root spacing="sm" class="h-full">
									<Frame.Header class="flex-row items-center gap-2">
										<div class={cn("size-2 rounded-full", column.dot)}></div>
										<Frame.Title class="capitalize">{column.title}</Frame.Title>
										<Badge variant="outline" class="ml-auto">{features.length}</Badge>
									</Frame.Header>
									<div class="flex flex-col gap-2 p-0.5">
										{#each features as feature (feature.id)}
											<Kanban.Item value={feature.id} asHandle>
												<Frame.Root variant="ghost" spacing="sm" class="p-0">
													<Frame.Panel class="p-3">
														<div class="flex flex-col gap-2.5">
															<span class="text-sm font-medium">{feature.title}</span>
															<p class="line-clamp-2 text-xs text-muted-foreground">
																{feature.description}
															</p>
															<Progress value={feature.progress} class="h-1.5" />
															<div class="flex items-center justify-between">
																<span class="text-[10px] text-muted-foreground tabular-nums">
																	{feature.progress}% complete
																</span>
																<div class="flex items-center gap-1">
																	<ArrowUpIcon
																		class="size-3 text-muted-foreground"
																		aria-hidden="true"
																	/>
																	<span class="text-xs text-muted-foreground tabular-nums">
																		{feature.votes}
																	</span>
																</div>
															</div>
														</div>
													</Frame.Panel>
												</Frame.Root>
											</Kanban.Item>
										{/each}
									</div>
								</Frame.Root>
							</Kanban.Column>
						{/each}
					</Kanban.Board>
					<Kanban.Overlay class="rounded-md border-2 border-dashed bg-muted/10" />
				</Kanban.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Kanban board persisted to a backend">
		{#snippet blurb()}
			— demo 6. Every completed drag is written optimistically and confirmed with a toast; the
			simulated backend fails one call in four, and the failure restores the board to where the
			pick-up found it.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Kanban.Root
					bind:value={persistedBoard}
					getItemValue={(task) => task.id}
					onDragStart={onPersistedDragStart}
					onDragEnd={onPersistedDragEnd}
					onDragCancel={onPersistedDragCancel}
				>
					<Kanban.Board class="grid auto-rows-fr gap-4 sm:grid-cols-3">
						{#each Object.entries(persistedBoard) as [columnValue, tasks] (columnValue)}
							<Kanban.Column value={columnValue}>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2.5">
										<span class="text-sm font-semibold">
											{persistedColumnTitles[columnValue] ?? columnValue}
										</span>
										<Badge variant="outline">{tasks.length}</Badge>
									</div>
									<Kanban.ColumnHandle>
										{#snippet child({ props }: { props: KanbanColumnHandleChildProps })}
											<Button
												{...props as Record<string, unknown>}
												variant="ghost"
												size="icon"
												class={props.class}
												aria-label="Drag column"
											>
												<GripVerticalIcon class="size-4" />
											</Button>
										{/snippet}
									</Kanban.ColumnHandle>
								</div>
								<div class="flex flex-col gap-2.5 p-0.5">
									{#each tasks as task (task.id)}
										<Kanban.Item value={task.id} asHandle>
											{#snippet child({ props }: { props: KanbanItemChildProps })}
												<div
													{...props as Record<string, unknown>}
													class={cn(props.class, cardClass)}
												>
													<div class="flex items-center justify-between gap-2">
														<span class="line-clamp-1 text-sm font-medium">{task.title}</span>
														<Badge
															variant={persistedPriorityVariant(task.priority)}
															class="pointer-events-none shrink-0 rounded-sm px-1.5 capitalize"
														>
															{task.priority}
														</Badge>
													</div>
												</div>
											{/snippet}
										</Kanban.Item>
									{/each}
								</div>
							</Kanban.Column>
						{/each}
					</Kanban.Board>
					<Kanban.Overlay class="rounded-md border-2 border-dashed bg-muted/10" />
				</Kanban.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
