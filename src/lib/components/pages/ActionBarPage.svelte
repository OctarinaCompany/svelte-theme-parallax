<script lang="ts">
	import ArchiveIcon from "@lucide/svelte/icons/archive";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import StarIcon from "@lucide/svelte/icons/star";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import XIcon from "@lucide/svelte/icons/x";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as ActionBar from "$lib/components/ui/action-bar/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { cn } from "$lib/utils.js";
	import { SvelteSet } from "svelte/reactivity";

	/**
	 * The Action bar component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART, and neither does the classic framework. A bar that appears over the viewport
	 * once rows are selected is a behaviour the classic theme expresses as a whole page state — its tables
	 * put bulk actions in the card header, not in a floating dock.
	 *
	 * There is therefore nothing to be faithful TO here, and nothing was invented. The bar is a
	 * portalled surface, so it lands on `--popover`, `--border` and the radius scale like every
	 * other overlay in this theme, and follows the palette picker for free.
	 */

	type Task = { id: string; name: string };

	let nextTaskId = 5;

	// Default
	let tasks = $state<Task[]>([
		{ id: "task-1", name: "Weekly Status Report" },
		{ id: "task-2", name: "Client Invoice Review" },
		{ id: "task-3", name: "Product Roadmap" },
		{ id: "task-4", name: "Team Standup Notes" },
	]);
	const selectedTaskIds = new SvelteSet<string>();

	const selectionOpen = $derived(selectedTaskIds.size > 0);

	function onSelectionOpenChange(open: boolean) {
		if (!open) selectedTaskIds.clear();
	}

	function onTaskToggle(id: string, checked: boolean) {
		if (checked) selectedTaskIds.add(id);
		else selectedTaskIds.delete(id);
	}

	function duplicateSelected() {
		const duplicates = tasks
			.filter((task) => selectedTaskIds.has(task.id))
			.map((task) => ({ id: `task-${nextTaskId++}`, name: `${task.name} (copy)` }));
		tasks = [...tasks, ...duplicates];
		selectedTaskIds.clear();
	}

	function deleteSelected() {
		tasks = tasks.filter((task) => !selectedTaskIds.has(task.id));
		selectedTaskIds.clear();
	}

	// Position
	let positionOpen = $state(false);
	let side = $state<ActionBar.ActionBarSide>("bottom");
	let align = $state<ActionBar.ActionBarAlign>("center");

	const SIDE_LABELS: Record<ActionBar.ActionBarSide, string> = { top: "Top", bottom: "Bottom" };
	const ALIGN_LABELS: Record<ActionBar.ActionBarAlign, string> = {
		start: "Start",
		center: "Center",
		end: "End",
	};

	const rootProps = [
		{
			prop: "open",
			type: "boolean",
			default: "undefined",
			description:
				"Controlled open state. Bindable; `onOpenChange` still fires on every transition.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Open state the bar seeds itself with when uncontrolled.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description: "Called on every open/close transition, in both modes.",
		},
		{
			prop: "onEscapeKeyDown",
			type: "(event: KeyboardEvent) => void",
			default: "—",
			description: "Called on `Escape` before closing. `preventDefault()` keeps the bar open.",
		},
		{
			prop: "side",
			type: "'top' | 'bottom'",
			default: "'bottom'",
			description: "Which viewport edge the bar is docked to.",
		},
		{
			prop: "sideOffset",
			type: "number",
			default: "16",
			description: "Distance from the docked edge, in px.",
		},
		{
			prop: "align",
			type: "'start' | 'center' | 'end'",
			default: "'center'",
			description: "How the bar is aligned along the docked edge.",
		},
		{
			prop: "alignOffset",
			type: "number",
			default: "0",
			description: 'Distance from the aligned edge, in px. Ignored for `align="center"`.',
		},
		{
			prop: "portalContainer",
			type: "Element | DocumentFragment | string | null",
			default: "document.body",
			description: "Where the bar is portalled to. `null` also means `document.body`.",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "inherited",
			description:
				"Reading direction. Falls back to the nearest `DirectionProvider`, then the DOM `dir`, then `ltr`.",
		},
		{
			prop: "orientation",
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			description: "Layout axis of the bar and the arrow-key axis of its group.",
		},
		{
			prop: "loop",
			type: "boolean",
			default: "true",
			description: "Whether arrow navigation wraps around the ends of the group.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Not populated in `child` mode.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ActionBarChildProps }]>",
			default: "—",
			description: "Render the bar onto your own element. Replaces upstream’s `asChild`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the element. A caller `style` wins over the viewport-edge one.",
		},
	];

	const selectionProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ActionBarSelectionChildProps }]>",
			default: "—",
			description: "Render the pill onto your own element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the element. Purely presentational — it is the one part that does not require an `ActionBar` ancestor.",
		},
	];

	const groupProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ActionBarGroupChildProps }]>",
			default: "—",
			description: "Render the group onto your own element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the element. A caller `onfocusin`, `onfocusout` or `onmousedown` runs before the group’s own handler and may `preventDefault()` it.",
		},
	];

	const itemProps = [
		{
			prop: "onSelect",
			type: "(event: ActionBarItemSelectEvent) => void",
			default: "—",
			description:
				"Called with the bubbling, cancelable `actionbar.itemSelect` event. `preventDefault()` keeps the bar open.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "'secondary'",
			description: "Forwarded to the underlying `Button`.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'sm'",
			description: "Forwarded to the underlying `Button`.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "undefined",
			description: "Excludes the item from arrow navigation and from the group’s tab stop.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered button. In `child` mode it stays `null`, so the item never joins the roving focus.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ActionBarItemChildProps }]>",
			default: "—",
			description: "Render the item onto your own element.",
		},
		{
			prop: "...restProps",
			type: "ButtonProps",
			default: "—",
			description:
				"Spread onto the element. Caller `onclick`, `onfocus`, `onkeydown` and `onmousedown` all run first.",
		},
	];

	const closeProps = [
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ActionBarCloseChildProps }]>",
			default: "—",
			description: "Render the close control onto your own element.",
		},
		{
			prop: "...restProps",
			type: "HTMLButtonAttributes",
			default: "—",
			description:
				"Spread onto the element. A caller `onclick` runs first and may `preventDefault()` the close.",
		},
	];

	const separatorProps = [
		{
			prop: "orientation",
			type: "'horizontal' | 'vertical'",
			default: "the root’s orientation",
			description: "Which way the divider runs.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ActionBarSeparatorChildProps }]>",
			default: "—",
			description: "Render the separator onto your own element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the element.",
		},
	];

	const keyboard = [
		{
			keys: "Tab",
			description: "Moves focus to the next stop — the action group, then the close button.",
		},
		{
			keys: "Shift + Tab",
			description: "Moves focus to the previous stop, skipping the group once.",
		},
		{
			keys: "Escape",
			description: "Calls `onEscapeKeyDown`, then closes the bar unless prevented.",
		},
		{
			keys: "ArrowLeft / ArrowRight",
			description: 'Previous / next item in a horizontal group. Inverted under `dir="rtl"`.',
		},
		{ keys: "ArrowUp / ArrowDown", description: "Previous / next item in a vertical group." },
		{ keys: "Home / End", description: "First / last enabled item in the group." },
		{
			keys: "Enter / Space",
			description: "Activates the focused item through native button semantics.",
		},
	];
</script>

<DocPage title="Action bar">
	{#snippet subtitle()}
		A floating action bar that appears at the bottom or top of the viewport to display contextual
		actions for selected items.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			Tick a task to raise the bar; it closes itself when the selection clears.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full flex-col gap-2.5">
					<h3 class="text-lg font-semibold">Tasks</h3>
					<div class="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
						{#each tasks as task (task.id)}
							<Label
								class={cn(
									"flex cursor-pointer items-center gap-2.5 rounded-md border bg-card/70 px-3 py-2.5 transition-colors hover:bg-accent/70",
									selectedTaskIds.has(task.id) && "bg-accent/70",
								)}
							>
								<Checkbox
									checked={selectedTaskIds.has(task.id)}
									onCheckedChange={(checked) => onTaskToggle(task.id, checked === true)}
								/>
								<span class="truncate text-sm font-medium">{task.name}</span>
							</Label>
						{/each}
					</div>

					<ActionBar.Root open={selectionOpen} onOpenChange={onSelectionOpenChange}>
						<ActionBar.Selection>
							{selectedTaskIds.size} selected
							<ActionBar.Separator />
							<ActionBar.Close>
								<XIcon />
								<span class="sr-only">Close</span>
							</ActionBar.Close>
						</ActionBar.Selection>
						<ActionBar.Separator />
						<ActionBar.Group>
							<ActionBar.Item onSelect={duplicateSelected}>
								<CopyIcon />
								Duplicate
							</ActionBar.Item>
							<ActionBar.Item variant="destructive" onSelect={deleteSelected}>
								<Trash2Icon />
								Delete
							</ActionBar.Item>
						</ActionBar.Group>
					</ActionBar.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Position">
		{#snippet blurb()}
			`side` and `align` dock the bar to a viewport edge.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div class="flex items-center gap-2">
						<Switch id="action-bar-open" bind:checked={positionOpen} />
						<Label for="action-bar-open">Show Action Bar</Label>
					</div>
					<div class="flex items-center gap-2">
						<Label for="action-bar-side" class="w-14">Side</Label>
						<Select.Root
							type="single"
							value={side}
							onValueChange={(value) => (side = value as ActionBar.ActionBarSide)}
						>
							<Select.Trigger id="action-bar-side" class="w-28">{SIDE_LABELS[side]}</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Item value="top">Top</Select.Item>
									<Select.Item value="bottom">Bottom</Select.Item>
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex items-center gap-2">
						<Label for="action-bar-align" class="w-14">Align</Label>
						<Select.Root
							type="single"
							value={align}
							onValueChange={(value) => (align = value as ActionBar.ActionBarAlign)}
						>
							<Select.Trigger id="action-bar-align" class="w-28"
								>{ALIGN_LABELS[align]}</Select.Trigger
							>
							<Select.Content>
								<Select.Group>
									<Select.Item value="start">Start</Select.Item>
									<Select.Item value="center">Center</Select.Item>
									<Select.Item value="end">End</Select.Item>
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>

					<ActionBar.Root bind:open={positionOpen} {side} {align}>
						<ActionBar.Selection>
							3 selected
							<ActionBar.Separator />
							<ActionBar.Close>
								<XIcon />
								<span class="sr-only">Close</span>
							</ActionBar.Close>
						</ActionBar.Selection>
						<ActionBar.Separator />
						<ActionBar.Group>
							<ActionBar.Item>
								<StarIcon />
								Favorite
							</ActionBar.Item>
							<ActionBar.Item>
								<ArchiveIcon />
								Archive
							</ActionBar.Item>
						</ActionBar.Group>
					</ActionBar.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">ActionBar.Root</h3>
			<p class="text-sm text-muted-foreground">
				The floating <code>role="toolbar"</code> surface. It renders nothing while closed and is
				portalled to <code>document.body</code> while open.
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
			<h3 class="text-base font-medium">ActionBar.Selection</h3>
			<p class="text-sm text-muted-foreground">
				The pill that summarises the selection, typically a count.
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
							{#each selectionProps as row (row.prop)}
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
			<h3 class="text-base font-medium">ActionBar.Group</h3>
			<p class="text-sm text-muted-foreground">
				A <code>role="group"</code> container that implements roving focus: its items form a single tab
				stop and are walked with the arrow keys.
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
							{#each groupProps as row (row.prop)}
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
			<h3 class="text-base font-medium">ActionBar.Item</h3>
			<p class="text-sm text-muted-foreground">
				A button inside the group. Must be rendered inside an <code>ActionBar.Group</code>.
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
			<h3 class="text-base font-medium">ActionBar.Close</h3>
			<p class="text-sm text-muted-foreground">
				A button that closes the bar. It keeps its own tab stop, outside the group’s roving focus,
				so give it a visible or <code>sr-only</code> label.
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
							{#each closeProps as row (row.prop)}
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
			<h3 class="text-base font-medium">ActionBar.Separator</h3>
			<p class="text-sm text-muted-foreground">
				A decorative divider — <code>role="separator"</code> with <code>aria-hidden="true"</code>,
				exactly as upstream. It shrinks automatically inside an
				<code>ActionBar.Selection</code>.
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
							{#each separatorProps as row (row.prop)}
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
				The action bar follows the WAI-ARIA Toolbar pattern.
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
