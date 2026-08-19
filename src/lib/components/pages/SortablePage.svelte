<script lang="ts">
	import { toast } from "svelte-sonner";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import ChartColumnIcon from "@lucide/svelte/icons/chart-column";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import GripVerticalIcon from "@lucide/svelte/icons/grip-vertical";
	import ImageIcon from "@lucide/svelte/icons/image";
	import InboxIcon from "@lucide/svelte/icons/inbox";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import ListMusicIcon from "@lucide/svelte/icons/list-music";
	import MusicIcon from "@lucide/svelte/icons/music";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import VideoIcon from "@lucide/svelte/icons/video";

	import * as Card from "$lib/components/ui/card/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { DirectionProvider } from "$lib/components/ui/direction-provider/index.js";
	import * as Sortable from "$lib/components/ui/sortable/index.js";
	import { arrayMove } from "$lib/components/ui/sortable/index.js";
	import type {
		SortableContentChildProps,
		SortableItemChildProps,
		SortableItemHandleChildProps,
		SortableMoveEvent,
		SortableOrientation,
	} from "$lib/components/ui/sortable/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The Sortable component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The nearest thing in the reference stylesheet is Dropzone, which the classic theme
	 * does restyle — but that is a drop target for FILES, not a reorderable list, and this theme
	 * uses none of the vendor block anyway (§12 of the theme notes).
	 *
	 * The dragged item's lift is drawn with the theme's own ring and shadow rather than a colour of
	 * its own, so a row being dragged reads as the same row, raised.
	 */

	type Trick = { id: string; title: string; description: string };
	type TableTrick = { id: string; title: string; difficulty: string; points: number };

	const initialTricks: Trick[] = [
		{ id: "1", title: "The 900", description: "Spin 900 degrees in the air." },
		{ id: "2", title: "Indy Backflip", description: "Backflip while grabbing indy." },
		{ id: "3", title: "Pizza Guy", description: "Flip the board like a pizza." },
		{ id: "4", title: "Rocket Air", description: "Point the nose straight up." },
		{ id: "5", title: "Kickflip Backflip", description: "A kickflip inside a backflip." },
		{ id: "6", title: "FS 540", description: "A frontside 540 rotation." },
	];

	let defaultTricks = $state<Trick[]>([...initialTricks]);
	let overlayTricks = $state<Trick[]>([...initialTricks]);
	let orientationTricks = $state<Trick[]>(initialTricks.slice(0, 4));
	let rtlTricks = $state<Trick[]>(initialTricks.slice(0, 4));

	let tableTricks = $state<TableTrick[]>([
		{ id: "1", title: "The 900", difficulty: "Expert", points: 9000 },
		{ id: "2", title: "Indy Backflip", difficulty: "Advanced", points: 4000 },
		{ id: "3", title: "Pizza Guy", difficulty: "Intermediate", points: 1500 },
		{ id: "4", title: "360 Varial McTwist", difficulty: "Expert", points: 5000 },
	]);

	let primitiveTricks = $state<string[]>([
		"The 900",
		"Indy Backflip",
		"Pizza Guy",
		"Rocket Air",
		"Kickflip Backflip",
		"FS 540",
	]);

	let orientation = $state<SortableOrientation>("vertical");

	const orientationLayouts: Record<SortableOrientation, string> = {
		vertical: "flex w-64 flex-col gap-2",
		horizontal: "flex w-full flex-row gap-2",
		mixed: "grid w-full grid-cols-2 gap-2",
	};

	const cardClass =
		"flex size-full flex-col gap-1 rounded-md border bg-muted p-4 text-foreground shadow-sm";

	const rootProps = [
		{
			prop: "value",
			type: "T[]",
			default: "—",
			description: "The controlled list. Bindable; a function binding keeps you authoritative.",
		},
		{
			prop: "defaultValue",
			type: "T[]",
			default: "[]",
			description: "Initial list when uncontrolled. Read once, during initialisation.",
		},
		{
			prop: "onValueChange",
			type: "(items: T[]) => void",
			default: "—",
			description: "Called with the reordered array. Not called when onMove is supplied.",
		},
		{
			prop: "getItemValue",
			type: "(item: T) => UniqueIdentifier",
			default: "—",
			description: "Identifier for each item. Required at runtime for object arrays.",
		},
		{
			prop: "onMove",
			type: "(event: SortableMoveEvent) => void",
			default: "—",
			description: "Intercepts the reorder, suppressing the splice and onValueChange.",
		},
		{
			prop: "orientation",
			type: '"vertical" | "horizontal" | "mixed"',
			default: '"vertical"',
			description: "Selects the default modifiers, strategy and collision detection.",
		},
		{
			prop: "strategy",
			type: "SortableStrategy",
			default: "per orientation",
			description: "Overrides the sorting transform applied to the other items.",
		},
		{
			prop: "collisionDetection",
			type: "SortableCollisionDetection",
			default: "per orientation",
			description: "Overrides how the drop target is resolved.",
		},
		{
			prop: "modifiers",
			type: "SortableModifier[]",
			default: "per orientation",
			description: "Replaces the default modifier list wholesale.",
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
			description:
				'Explicit text direction. Falls back to the nearest DirectionProvider, then an ancestor [dir], then "ltr".',
		},
		{
			prop: "id",
			type: "string",
			default: "$props.id()",
			description: "Base id for the live region and the screen-reader instructions element.",
		},
		{
			prop: "accessibility",
			type: "SortableAccessibility",
			default: "—",
			description: "Per-key override of the announcements and of the instructions text.",
		},
		{
			prop: "onDragStart",
			type: "(event: SortableDragEvent) => void",
			default: "—",
			description: "Fires when an item is picked up, by pointer or by keyboard.",
		},
		{
			prop: "onDragMove",
			type: "(event: SortableDragEvent) => void",
			default: "—",
			description: "Fires on every move frame.",
		},
		{
			prop: "onDragOver",
			type: "(event: SortableDragEvent) => void",
			default: "—",
			description: "Fires only when the drop target changes.",
		},
		{
			prop: "onDragEnd",
			type: "(event: SortableDragEvent) => void",
			default: "—",
			description: "Fires on a drop over a droppable, before the reorder is committed.",
		},
		{
			prop: "onDragCancel",
			type: "(event: SortableDragEvent) => void",
			default: "—",
			description:
				"Fires on Escape, on a drop outside any droppable, and when the active item is removed mid-drag.",
		},
	];

	const contentProps = [
		{
			prop: "strategy",
			type: "SortableStrategy",
			default: "the root's",
			description: "Per-region sorting strategy override.",
		},
		{
			prop: "withoutSlot",
			type: "boolean",
			default: "false",
			description: "Renders the items with no wrapping element at all.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the region element.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last, so it always overrides the component classes.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the region onto your own element. Replaces upstream asChild.",
		},
	];

	const itemProps = [
		{
			prop: "value",
			type: "UniqueIdentifier",
			default: "— (required)",
			description: "The item's identifier. An empty string throws.",
		},
		{
			prop: "asHandle",
			type: "boolean",
			default: "false",
			description: "Makes the item itself the drag activator.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Neither draggable nor droppable, while others reorder around it.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the item element.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last, so it always overrides the component classes.",
		},
		{
			prop: "style",
			type: "string",
			default: "—",
			description: "Appended after the transform and transition declarations.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the item onto your own element. Spread the props, or it will not drag.",
		},
	];

	const itemHandleProps = [
		{
			prop: "disabled",
			type: "boolean",
			default: "the item's",
			description: "Inherits the item, and an explicit value wins.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the button element.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last, so it always overrides the component classes.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the handle onto your own element — this is how it composes onto Button.",
		},
	];

	const overlayProps = [
		{
			prop: "container",
			type: "Element | DocumentFragment | string | null",
			default: "document.body",
			description: "Portal target for the floating preview.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last onto the floating element.",
		},
		{
			prop: "children",
			type: "Snippet<[{ value }]>",
			default: "—",
			description:
				"The preview content. Take the value parameter to render per-item content instead of a fixed preview.",
		},
	];

	const dataAttributes = [
		{ part: "Sortable.Content", attribute: "[data-orientation]", value: "The list orientation." },
		{ part: "Sortable.Item", attribute: "[data-dragging]", value: "The item is being dragged." },
		{ part: "Sortable.Item", attribute: "[data-disabled]", value: "The item is disabled." },
		{
			part: "Sortable.Item",
			attribute: "[data-flat-cursor]",
			value: "The root's flatCursor is set.",
		},
		{
			part: "Sortable.ItemHandle",
			attribute: "[data-dragging]",
			value: "The parent item is being dragged.",
		},
		{
			part: "Sortable.ItemHandle",
			attribute: "[data-disabled]",
			value: "The handle or its item is disabled.",
		},
		{
			part: "Sortable.ItemHandle",
			attribute: "[data-flat-cursor]",
			value: "The root's flatCursor is set.",
		},
		{
			part: "Sortable.Overlay",
			attribute: "[data-dragging]",
			value: "Always — the preview only exists during a drag.",
		},
	];

	const keyboardShortcuts = [
		{ keys: "Tab", description: "Moves focus between drag activators." },
		{
			keys: "Enter / Space",
			description: "Picks the focused item up, and drops it again at its current position.",
		},
		{
			keys: "ArrowUp / ArrowDown",
			description: "Moves the grabbed item one position in a vertical or mixed list.",
		},
		{
			keys: "ArrowLeft / ArrowRight",
			description:
				'Moves the grabbed item one position in a horizontal or mixed list. Inverted under dir="rtl".',
		},
		{ keys: "Escape", description: "Cancels the drag and returns the item to its position." },
	];

	/*
	 * EVERYTHING BELOW IS THE PATTERN APPENDIX, one section per
	 * demo in the order that page gives them. The sections above document the parts; these show
	 * what the parts are actually assembled into, so they are application patterns rather than
	 * API demos.
	 *
	 * Four adaptations recur across all eight, and are not repeated per section:
	 *
	 * 1. A SINGLE `<Sortable>` WOULD BE BOTH ROOT AND REGION. Here those are two parts, so every
	 *    demo below is `Sortable.Root` + `Sortable.Content`, and the `strategy="vertical" | "grid"`
	 *    becomes `orientation="vertical" | "mixed"` — the orientation selects the matching
	 *    strategy, modifiers and collision detection together, which is the whole point of it.
	 * 2. BADGES LOSE THEIR SIZE. The demos ask for `size="xs" | "sm"`; this Badge has a single
	 *    height. Its `*-light` variants are the `*-subtle` family here.
	 * 3. ICONS ARE LUCIDE'S. The demos assume an `IconPlaceholder`, which resolves to one glyph per icon
	 *    set it supports; this repository draws the Lucide name the placeholder lists first.
	 * 4. NO DEAD CLICK TARGETS. Several upstream rows carry `cursor-pointer` and an empty
	 *    `onClick`. The hover wash stays — it tells you which row the grip belongs to — but the
	 *    pointer cursor does not, because nothing here is clickable.
	 */

	type SortableFile = {
		id: string;
		title: string;
		description: string;
		type: "image" | "document" | "audio" | "video";
		size: string;
	};

	let fileListItems = $state<SortableFile[]>([
		{
			id: "1",
			title: "Product Demo",
			description: "Main product image",
			type: "image",
			size: "2.4 MB",
		},
		{
			id: "2",
			title: "Product Specification",
			description: "Technical details document",
			type: "document",
			size: "1.2 MB",
		},
		{
			id: "3",
			title: "Product Demo Video",
			description: "How to use the product",
			type: "video",
			size: "15.7 MB",
		},
		{
			id: "4",
			title: "Product Audio Guide",
			description: "Audio instructions",
			type: "audio",
			size: "8.3 MB",
		},
		{
			id: "5",
			title: "Product Image",
			description: "Additional product view",
			type: "image",
			size: "3.1 MB",
		},
	]);

	const fileTypeIcons = {
		image: ImageIcon,
		document: FileTextIcon,
		audio: MusicIcon,
		video: VideoIcon,
	};

	const fileTypeVariants: Record<SortableFile["type"], BadgeVariant> = {
		image: "primary-subtle",
		document: "success-subtle",
		audio: "destructive-subtle",
		video: "info-subtle",
	};

	/** Reads the new order back as a numbered list — the reorder is otherwise silent. */
	function announceOrder(heading: string, titles: string[]) {
		toast.success(heading, {
			description: titles.map((title, index) => `${index + 1}. ${title}`).join(", "),
		});
	}

	type SortableGridItem = {
		id: string;
		title: string;
		description: string;
		type: "image" | "document" | "audio" | "video" | "featured";
		size: string;
	};

	let gridItems = $state<SortableGridItem[]>([
		{
			id: "1",
			title: "Hero Image",
			description: "Main banner image",
			type: "image",
			size: "2.4 MB",
		},
		{
			id: "2",
			title: "Product Specs",
			description: "Technical documentation",
			type: "document",
			size: "1.2 MB",
		},
		{
			id: "3",
			title: "Demo Video",
			description: "Product demonstration",
			type: "video",
			size: "15.7 MB",
		},
		{
			id: "4",
			title: "Audio Guide",
			description: "Voice instructions",
			type: "audio",
			size: "8.3 MB",
		},
		{
			id: "5",
			title: "Gallery Photo 1",
			description: "Product view 1",
			type: "image",
			size: "3.1 MB",
		},
		{
			id: "6",
			title: "Gallery Photo 2",
			description: "Product view 2",
			type: "image",
			size: "2.8 MB",
		},
		{
			id: "7",
			title: "User Manual",
			description: "Installation guide",
			type: "document",
			size: "4.2 MB",
		},
		{
			id: "8",
			title: "Background Music",
			description: "Ambient soundtrack",
			type: "audio",
			size: "12.1 MB",
		},
		{
			id: "9",
			title: "Feature Highlight",
			description: "Key product features",
			type: "featured",
			size: "N/A",
		},
	]);

	const gridTypeVariants: Record<SortableGridItem["type"], BadgeVariant> = {
		...fileTypeVariants,
		featured: "warning-subtle",
	};

	type OptionValue = { id: string; value: string };
	type OptionGroup = { id: string; name: string; values: OptionValue[] };

	let optionGroups = $state<OptionGroup[]>([
		{
			id: "1",
			name: "Colors",
			values: [
				{ id: "1-1", value: "White" },
				{ id: "1-2", value: "Black" },
				{ id: "1-3", value: "Grey" },
				{ id: "1-4", value: "Green" },
			],
		},
		{
			id: "2",
			name: "Sizes",
			values: [
				{ id: "2-1", value: "Small" },
				{ id: "2-2", value: "Medium" },
				{ id: "2-3", value: "Large" },
			],
		},
		{
			id: "3",
			name: "Materials",
			values: [
				{ id: "3-1", value: "Cotton" },
				{ id: "3-2", value: "Polyester" },
				{ id: "3-3", value: "Wool" },
			],
		},
	]);

	type QueueTrack = {
		id: string;
		title: string;
		artist: string;
		album: string;
		duration: string;
		plays: string;
		active?: boolean;
	};

	let queueTracks = $state<QueueTrack[]>([
		{
			id: "1",
			title: "Midnight City",
			artist: "M83",
			album: "Hurry Up, We're Dreaming",
			duration: "4:03",
			plays: "1.2B",
			active: true,
		},
		{
			id: "2",
			title: "Digital Love",
			artist: "Daft Punk",
			album: "Discovery",
			duration: "4:58",
			plays: "845M",
		},
		{
			id: "3",
			title: "Starlight",
			artist: "Muse",
			album: "Black Holes",
			duration: "3:59",
			plays: "720M",
		},
		{
			id: "4",
			title: "Take On Me",
			artist: "a-ha",
			album: "Hunting High and Low",
			duration: "3:48",
			plays: "1.8B",
		},
		{
			id: "5",
			title: "Blue Monday",
			artist: "New Order",
			album: "Power, Corruption",
			duration: "7:29",
			plays: "530M",
		},
	]);

	type NotificationChannel = { id: string; name: string; description: string; enabled: boolean };

	let notificationChannels = $state<NotificationChannel[]>([
		{ id: "1", name: "Email", description: "Send notifications via email", enabled: true },
		{ id: "2", name: "Push Notifications", description: "Browser and mobile push", enabled: true },
		{ id: "3", name: "SMS", description: "Text message alerts", enabled: false },
		{ id: "4", name: "Slack", description: "Post to Slack channels", enabled: true },
		{ id: "5", name: "Webhook", description: "Send to custom endpoint", enabled: false },
	]);

	/**
	 * Upstream stores a rendered element per entry; a Svelte value holds the component itself and
	 * the template instantiates it, which is what keeps the icon out of the data's way.
	 */
	type SortableNavItem = {
		id: string;
		label: string;
		icon: typeof LayoutDashboardIcon;
		count?: number;
	};

	let navItems = $state<SortableNavItem[]>([
		{ id: "1", label: "Dashboard", icon: LayoutDashboardIcon },
		{ id: "2", label: "Inbox", icon: InboxIcon, count: 5 },
		{ id: "3", label: "Projects", icon: FolderIcon, count: 12 },
		{ id: "4", label: "Calendar", icon: CalendarIcon },
		{ id: "5", label: "Analytics", icon: ChartColumnIcon },
		{ id: "6", label: "Settings", icon: SettingsIcon },
	]);

	type GalleryImage = { id: string; name: string; dimensions: string; size: string };

	let galleryImages = $state<GalleryImage[]>([
		{ id: "1", name: "hero-banner.jpg", dimensions: "1920×1080", size: "2.4 MB" },
		{ id: "2", name: "product-shot.png", dimensions: "800×600", size: "1.8 MB" },
		{ id: "3", name: "team-photo.jpg", dimensions: "1200×800", size: "3.2 MB" },
		{ id: "4", name: "logo-dark.svg", dimensions: "240×60", size: "12 KB" },
		{ id: "5", name: "og-image.png", dimensions: "1200×630", size: "890 KB" },
		{ id: "6", name: "favicon.ico", dimensions: "32×32", size: "4 KB" },
	]);

	type ReleaseTask = { id: string; title: string };

	let releaseTasks = $state<ReleaseTask[]>([
		{ id: "1", title: "Draft the release notes" },
		{ id: "2", title: "Review open pull requests" },
		{ id: "3", title: "Update the changelog" },
		{ id: "4", title: "Cut the release tag" },
		{ id: "5", title: "Announce on the blog" },
	]);

	/**
	 * Stand-in for the mutation a real application would fire — swap it for the request. It rejects
	 * roughly one call in four, so the rollback below is reachable by dragging a few times.
	 */
	function persistTaskOrder(): Promise<void> {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				if (Math.random() < 0.25) reject(new Error("Network error"));
				else resolve();
			}, 700);
		});
	}

	/**
	 * Upstream reaches for an `onValueCommit(next, meta)` prop carrying the pre-drag order. This
	 * Sortable has no such prop, but `onMove` is a better fit anyway: it fires once per completed
	 * drag, carries both indices, and suppresses the built-in splice — so the pre-drag order is
	 * simply the array as it still stands, and the optimistic write is the one made here.
	 */
	function commitTaskOrder(event: SortableMoveEvent) {
		const previous = releaseTasks;
		const next = arrayMove(previous, event.activeIndex, event.overIndex);
		const moved = next[event.overIndex];
		releaseTasks = next;

		toast.promise(persistTaskOrder(), {
			loading: "Saving order...",
			success: () => `Saved "${moved.title}" at position ${event.overIndex + 1}`,
			error: () => {
				// Restore the pre-drag order. In production prefer a refetch here, so a newer drag is
				// not clobbered by this snapshot.
				releaseTasks = previous;
				return "Could not save the new order. Restored.";
			},
		});
	}
</script>

<DocPage title="Sortable">
	{#snippet subtitle()}
		A drag and drop sortable component for reordering items, operable with a pointer, with touch and
		from the keyboard alone.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			— an object array with getItemValue, mixed orientation, each item its own drag handle, and a
			fixed overlay.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Sortable.Root
					bind:value={defaultTricks}
					getItemValue={(trick) => trick.id}
					orientation="mixed"
				>
					<Sortable.Content class="grid w-full auto-rows-fr grid-cols-3 gap-2.5">
						{#each defaultTricks as trick (trick.id)}
							<Sortable.Item value={trick.id} asHandle>
								{#snippet child({ props }: { props: SortableItemChildProps })}
									<div {...props as Record<string, unknown>} class={cn(props.class, cardClass)}>
										<div class="text-sm leading-tight font-medium sm:text-base">{trick.title}</div>
										<span class="line-clamp-2 hidden text-sm text-muted-foreground sm:inline-block">
											{trick.description}
										</span>
									</div>
								{/snippet}
							</Sortable.Item>
						{/each}
					</Sortable.Content>
					<Sortable.Overlay>
						<div class="size-full rounded-md bg-primary/10"></div>
					</Sortable.Overlay>
				</Sortable.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With Dynamic Overlay">
		{#snippet blurb()}
			— the overlay snippet receives the active identifier and renders the matching card.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Sortable.Root
					bind:value={overlayTricks}
					getItemValue={(trick) => trick.id}
					orientation="mixed"
				>
					<Sortable.Content class="grid w-full auto-rows-fr grid-cols-3 gap-2.5">
						{#each overlayTricks as trick (trick.id)}
							<Sortable.Item value={trick.id} asHandle>
								{#snippet child({ props }: { props: SortableItemChildProps })}
									<div {...props as Record<string, unknown>} class={cn(props.class, cardClass)}>
										<div class="text-sm leading-tight font-medium sm:text-base">{trick.title}</div>
										<span class="line-clamp-2 hidden text-sm text-muted-foreground sm:inline-block">
											{trick.description}
										</span>
									</div>
								{/snippet}
							</Sortable.Item>
						{/each}
					</Sortable.Content>
					<Sortable.Overlay>
						{#snippet children({ value })}
							{@const trick = overlayTricks.find((candidate) => candidate.id === value)}
							{#if trick}
								<div class={cardClass}>
									<div class="text-sm leading-tight font-medium sm:text-base">{trick.title}</div>
									<span class="line-clamp-2 hidden text-sm text-muted-foreground sm:inline-block">
										{trick.description}
									</span>
								</div>
							{/if}
						{/snippet}
					</Sortable.Overlay>
				</Sortable.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With Handle">
		{#snippet blurb()}
			— the region composes onto a table body, each item onto a table row, and the handle onto a
			Button.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Sortable.Root bind:value={tableTricks} getItemValue={(trick) => trick.id}>
					<Table.Root class="rounded-none border">
						<Table.Header>
							<Table.Row class="bg-accent/50">
								<Table.Head class="w-[50px] bg-transparent" />
								<Table.Head class="bg-transparent">Trick</Table.Head>
								<Table.Head class="bg-transparent">Difficulty</Table.Head>
								<Table.Head class="bg-transparent text-right">Points</Table.Head>
							</Table.Row>
						</Table.Header>
						<Sortable.Content>
							{#snippet child({ props }: { props: SortableContentChildProps })}
								<Table.Body {...props as Record<string, unknown>} class={props.class}>
									{#each tableTricks as trick (trick.id)}
										<Sortable.Item value={trick.id}>
											{#snippet child({ props: rowProps }: { props: SortableItemChildProps })}
												<Table.Row {...rowProps as Record<string, unknown>} class={rowProps.class}>
													<Table.Cell class="w-[50px]">
														<Sortable.ItemHandle>
															{#snippet child({
																props: handleProps,
															}: {
																props: SortableItemHandleChildProps;
															})}
																<Button
																	{...handleProps as Record<string, unknown>}
																	variant="ghost"
																	size="icon"
																	class={cn(handleProps.class, "size-8")}
																	aria-label="Drag to reorder"
																>
																	<GripVerticalIcon />
																</Button>
															{/snippet}
														</Sortable.ItemHandle>
													</Table.Cell>
													<Table.Cell class="font-medium">{trick.title}</Table.Cell>
													<Table.Cell class="text-muted-foreground">{trick.difficulty}</Table.Cell>
													<Table.Cell class="text-right text-muted-foreground">
														{trick.points}
													</Table.Cell>
												</Table.Row>
											{/snippet}
										</Sortable.Item>
									{/each}
								</Table.Body>
							{/snippet}
						</Sortable.Content>
					</Table.Root>
					<Sortable.Overlay>
						<div class="size-full rounded-none bg-primary/10"></div>
					</Sortable.Overlay>
				</Sortable.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With Primitive Values">
		{#snippet blurb()}
			— a string array needs no getItemValue, and the overlay renders a Sortable.Item of its own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Sortable.Root bind:value={primitiveTricks} orientation="mixed">
					<Sortable.Content class="grid w-full grid-cols-3 gap-2.5">
						{#each primitiveTricks as trick (trick)}
							<Sortable.Item
								value={trick}
								asHandle
								class="flex size-full flex-col items-center justify-center rounded-md border bg-muted p-8 text-center shadow-xs"
							>
								<div class="text-sm leading-tight font-medium sm:text-base">{trick}</div>
							</Sortable.Item>
						{/each}
					</Sortable.Content>
					<Sortable.Overlay>
						{#snippet children({ value })}
							<Sortable.Item
								{value}
								class="flex size-full flex-col items-center justify-center rounded-md border bg-muted p-8 text-center shadow-xs"
							>
								<div class="text-sm leading-tight font-medium sm:text-base">{value}</div>
							</Sortable.Item>
						{/snippet}
					</Sortable.Overlay>
				</Sortable.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Orientation">
		{#snippet blurb()}
			The same list in all three orientations. Only the orientation prop and the layout classes
			change; the arrow keys follow along.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-4">
					<div class="flex gap-2">
						{#each ["vertical", "horizontal", "mixed"] as const as option (option)}
							<Button
								variant={orientation === option ? "default" : "outline"}
								size="sm"
								onclick={() => (orientation = option)}
							>
								{option}
							</Button>
						{/each}
					</div>
					<Sortable.Root
						bind:value={orientationTricks}
						getItemValue={(trick) => trick.id}
						{orientation}
					>
						<Sortable.Content class={orientationLayouts[orientation]}>
							{#each orientationTricks as trick (trick.id)}
								<Sortable.Item
									value={trick.id}
									asHandle
									class="flex-1 rounded-md border bg-muted p-4 text-sm font-medium shadow-sm"
								>
									{trick.title}
								</Sortable.Item>
							{/each}
						</Sortable.Content>
					</Sortable.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="RTL">
		{#snippet blurb()}
			Inside a right-to-left context, ArrowLeft and ArrowRight mirror, so they keep matching the
			visually-left and visually-right neighbour.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<DirectionProvider dir="rtl">
					<Sortable.Root
						bind:value={rtlTricks}
						getItemValue={(trick) => trick.id}
						orientation="horizontal"
					>
						<Sortable.Content class="flex w-full flex-row gap-2">
							{#each rtlTricks as trick (trick.id)}
								<Sortable.Item
									value={trick.id}
									asHandle
									class="flex-1 rounded-md border bg-muted p-4 text-sm font-medium shadow-sm"
								>
									{trick.title}
								</Sortable.Item>
							{/each}
						</Sortable.Content>
					</Sortable.Root>
				</DirectionProvider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Sortable (Root)</h3>
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
			<h3 class="text-base font-medium">Sortable.Content</h3>
			<p class="text-sm text-muted-foreground">
				One sortable region. Several can share a single root, and a drag stays inside the region it
				started in.
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
							{#each contentProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Sortable.Item</h3>
			<p class="text-sm text-muted-foreground">
				One entry in the list. With <code>asHandle</code> it is its own drag activator; otherwise it
				needs a <code>Sortable.ItemHandle</code>.
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
			<h3 class="text-base font-medium">Sortable.ItemHandle</h3>
			<p class="text-sm text-muted-foreground">
				A native <code>&lt;button&gt;</code> that restricts drag activation to itself.
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
			<h3 class="text-base font-medium">Sortable.Overlay</h3>
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

	<DocSection title="Sortable list of items with drag-and-drop">
		{#snippet blurb()}
			An asset list where the grip is the only activator, so the row itself stays inert. Each drop
			reads the resulting order back as a toast.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 1 -->
				<Sortable.Root
					bind:value={fileListItems}
					getItemValue={(item) => item.id}
					onValueChange={(items) =>
						announceOrder(
							"Items reordered successfully!",
							items.map((item) => item.title),
						)}
				>
					<Sortable.Content class="mx-auto flex w-full max-w-xl flex-col gap-2">
						{#each fileListItems as item (item.id)}
							{@const TypeIcon = fileTypeIcons[item.type]}
							<Sortable.Item value={item.id}>
								<div
									class="flex items-center gap-3 rounded-md border bg-background p-3 transition-colors hover:bg-accent/50"
								>
									<Sortable.ItemHandle
										class="text-muted-foreground transition-colors hover:text-foreground"
										aria-label="Drag to reorder"
									>
										<GripVerticalIcon class="size-4" />
									</Sortable.ItemHandle>
									<TypeIcon class="size-4 text-muted-foreground" />
									<div class="min-w-0 flex-1">
										<h3 class="truncate text-sm font-medium">{item.title}</h3>
										<p class="truncate text-xs text-muted-foreground">{item.description}</p>
									</div>
									<div class="flex items-center gap-2">
										<Badge variant={fileTypeVariants[item.type]}>{item.type}</Badge>
										<span class="text-xs text-muted-foreground">{item.size}</span>
									</div>
								</div>
							</Sortable.Item>
						{/each}
					</Sortable.Content>
				</Sortable.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sortable list of items with grid layout">
		{#snippet blurb()}
			A grid whose featured tile spans two columns and two rows. The span sits on
			<code>Sortable.Item</code> rather than on the content inside it — the item is the grid child, so
			it is the only element the track sizing can reach.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 2 -->
				<Sortable.Root
					bind:value={gridItems}
					getItemValue={(item) => item.id}
					orientation="mixed"
					onValueChange={(items) =>
						announceOrder(
							"Grid items reordered successfully!",
							items.map((item) => item.title),
						)}
				>
					<Sortable.Content class="mx-auto grid w-full max-w-2xl auto-rows-fr grid-cols-3 gap-3">
						{#each gridItems as item (item.id)}
							<Sortable.Item
								value={item.id}
								class={cn(
									"group/tile relative flex min-h-25 flex-col rounded-md border bg-background p-3 transition-colors hover:bg-accent/50",
									item.type === "featured" && "col-span-2 row-span-2",
								)}
							>
								<Sortable.ItemHandle
									class="absolute end-1.5 top-2.5 z-10 text-muted-foreground opacity-0 transition-opacity group-hover/tile:opacity-100 hover:text-foreground"
									aria-label="Drag to reorder"
								>
									<GripVerticalIcon class="size-3.5" />
								</Sortable.ItemHandle>
								<div class="min-w-0 flex-1">
									<h3 class="truncate text-sm font-medium">{item.title}</h3>
									<p class="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</p>
								</div>
								<div class="mt-2 flex items-center justify-between">
									<Badge variant={gridTypeVariants[item.type]}>{item.type}</Badge>
									{#if item.type !== "featured"}
										<span class="text-xs text-muted-foreground">{item.size}</span>
									{/if}
								</div>
							</Sortable.Item>
						{/each}
					</Sortable.Content>
				</Sortable.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sortable list of items with nested layout">
		{#snippet blurb()}
			Option groups reorder among themselves while their values reorder inside each group. Every
			root owns its own context, so the inner list's drags never reach the outer one — the only
			thing that has to be arranged is that each level's handle belongs to that level.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 3 -->
				<Sortable.Root
					bind:value={optionGroups}
					getItemValue={(group) => group.id}
					onValueChange={(groups) =>
						announceOrder(
							"Option groups reordered successfully!",
							groups.map((group) => group.name),
						)}
				>
					<Sortable.Content class="mx-auto flex w-full max-w-sm flex-col gap-4">
						{#each optionGroups as group, groupIndex (group.id)}
							<Sortable.Item value={group.id}>
								<Card.Root class="p-2">
									<Card.Content class="p-0">
										<div class="mb-2 flex items-center gap-2">
											<Sortable.ItemHandle
												class="text-muted-foreground transition-colors hover:text-foreground"
												aria-label="Drag to reorder the group"
											>
												<GripVerticalIcon class="size-4" />
											</Sortable.ItemHandle>
											<h3 class="text-sm font-semibold">{group.name}</h3>
										</div>

										<Sortable.Root
											bind:value={optionGroups[groupIndex].values}
											getItemValue={(value) => value.id}
											onValueChange={(values) =>
												announceOrder(
													"Values reordered successfully!",
													values.map((value) => value.value),
												)}
										>
											<Sortable.Content class="flex flex-col gap-2">
												{#each group.values as value (value.id)}
													<Sortable.Item value={value.id}>
														<div class="flex items-center gap-2 rounded-md border p-1.5">
															<Sortable.ItemHandle
																class="text-muted-foreground transition-colors hover:text-foreground"
																aria-label="Drag to reorder the value"
															>
																<GripVerticalIcon class="size-4" />
															</Sortable.ItemHandle>
															<span class="flex-1 text-sm">{value.value}</span>
														</div>
													</Sortable.Item>
												{/each}
											</Sortable.Content>
										</Sortable.Root>
									</Card.Content>
								</Card.Root>
							</Sortable.Item>
						{/each}
					</Sortable.Content>
				</Sortable.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sortable playlist with frame">
		{#snippet blurb()}
			A play queue built out of Frame: the header is chrome on the shell, and each track is a panel
			stripped of its padding so the row can set its own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 4 -->
				<Frame.Root spacing="xs" class="mx-auto w-full max-w-md">
					<Frame.Header>
						<div class="flex items-center justify-between">
							<div>
								<Frame.Title>Queue</Frame.Title>
								<Frame.Description>{queueTracks.length} tracks</Frame.Description>
							</div>
							<Badge variant="outline">
								<ListMusicIcon />
								Playlist
							</Badge>
						</div>
					</Frame.Header>
					<Sortable.Root bind:value={queueTracks} getItemValue={(track) => track.id}>
						<Sortable.Content class="flex flex-col gap-0.5">
							{#each queueTracks as track (track.id)}
								<Sortable.Item value={track.id}>
									<Frame.Panel class="p-0!">
										<div class="flex items-center gap-3 px-3 py-2.5">
											<Sortable.ItemHandle
												class="text-muted-foreground transition-colors hover:text-foreground"
												aria-label="Drag to reorder"
											>
												<GripVerticalIcon class="size-4" />
											</Sortable.ItemHandle>
											<div
												class="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted"
											>
												<MusicIcon class="size-4 text-muted-foreground" />
											</div>
											<div class="min-w-0 flex-1">
												<p
													class={cn("truncate text-sm font-medium", track.active && "text-primary")}
												>
													{track.title}
													{#if track.active}
														<Badge variant="primary-subtle" class="ms-1.5 align-middle">
															Playing
														</Badge>
													{/if}
												</p>
												<p class="truncate text-xs text-muted-foreground">
													{track.artist} &middot; {track.album}
												</p>
											</div>
											<div class="flex items-center gap-3">
												<span class="hidden text-xs text-muted-foreground tabular-nums sm:inline">
													{track.plays}
												</span>
												<span class="text-xs text-muted-foreground tabular-nums">
													{track.duration}
												</span>
											</div>
										</div>
									</Frame.Panel>
								</Sortable.Item>
							{/each}
						</Sortable.Content>
					</Sortable.Root>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sortable settings priority with frame">
		{#snippet blurb()}
			Order carries meaning here — the list is the fallback chain, tried top down. The switch on
			each row is a second, independent control inside a draggable item, which is exactly why the
			grip and not the row is the activator.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 5 -->
				<Frame.Root spacing="sm" class="mx-auto w-full max-w-md">
					<Frame.Header>
						<Frame.Title>Notification Priority</Frame.Title>
						<Frame.Description>
							Drag to reorder by priority. Top channels are tried first.
						</Frame.Description>
					</Frame.Header>
					<Sortable.Root bind:value={notificationChannels} getItemValue={(channel) => channel.id}>
						<Sortable.Content class="flex flex-col gap-1">
							{#each notificationChannels as channel, channelIndex (channel.id)}
								<Sortable.Item value={channel.id}>
									<Frame.Panel class="p-0!">
										<div class="flex items-center gap-3 px-3 py-2.5">
											<Sortable.ItemHandle
												class="text-muted-foreground transition-colors hover:text-foreground"
												aria-label="Drag to reorder"
											>
												<GripVerticalIcon class="size-4" />
											</Sortable.ItemHandle>
											<div class="min-w-0 flex-1">
												<p class="text-sm font-medium">{channel.name}</p>
												<p class="text-xs text-muted-foreground">{channel.description}</p>
											</div>
											<Switch
												bind:checked={notificationChannels[channelIndex].enabled}
												aria-label={`Enable ${channel.name}`}
											/>
										</div>
									</Frame.Panel>
								</Sortable.Item>
							{/each}
						</Sortable.Content>
					</Sortable.Root>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sortable sidebar navigation with frame">
		{#snippet blurb()}
			A navigation list the reader arranges themselves. The grip appears only on the hovered row, so
			the list still reads as navigation at rest.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 6 -->
				<Frame.Root spacing="xs" class="mx-auto w-full max-w-xs">
					<Frame.Header>
						<Frame.Title>Navigation</Frame.Title>
					</Frame.Header>
					<Frame.Panel class="p-2!">
						<Sortable.Root bind:value={navItems} getItemValue={(item) => item.id}>
							<Sortable.Content class="flex flex-col gap-0.5">
								{#each navItems as item (item.id)}
									{@const NavIcon = item.icon}
									<Sortable.Item value={item.id}>
										<div
											class="group/nav flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
										>
											<Sortable.ItemHandle
												class="text-muted-foreground opacity-0 transition-opacity group-hover/nav:opacity-100 hover:text-foreground"
												aria-label="Drag to reorder"
											>
												<GripVerticalIcon class="size-3.5" />
											</Sortable.ItemHandle>
											<NavIcon class="size-4 text-muted-foreground" />
											<span class="flex-1 text-sm">{item.label}</span>
											{#if item.count}
												<Badge variant="outline">{item.count}</Badge>
											{/if}
										</div>
									</Sortable.Item>
								{/each}
							</Sortable.Content>
						</Sortable.Root>
					</Frame.Panel>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sortable image gallery grid with frame">
		{#snippet blurb()}
			A media library whose tiles reflow as one grid inside a single panel — the frame supplies the
			tray, and <code>orientation="mixed"</code> supplies the two-axis arrow keys.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 7 -->
				<Frame.Root spacing="xs" class="mx-auto w-full max-w-md">
					<Frame.Header>
						<Frame.Title>Media Library</Frame.Title>
						<Frame.Description>Drag to reorder display priority</Frame.Description>
					</Frame.Header>
					<Frame.Panel class="p-2!">
						<Sortable.Root
							bind:value={galleryImages}
							getItemValue={(image) => image.id}
							orientation="mixed"
						>
							<Sortable.Content class="grid grid-cols-3 gap-2">
								{#each galleryImages as image (image.id)}
									<Sortable.Item
										value={image.id}
										class="group/media relative flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted p-4"
									>
										<Sortable.ItemHandle
											class="absolute end-1.5 top-1.5 text-muted-foreground opacity-0 transition-opacity group-hover/media:opacity-100 hover:text-foreground"
											aria-label="Drag to reorder"
										>
											<GripVerticalIcon class="size-3.5" />
										</Sortable.ItemHandle>
										<ImageIcon class="size-5 text-muted-foreground" />
										<div class="w-full text-center">
											<p class="truncate text-xs font-medium">{image.name}</p>
											<p class="text-[10px] text-muted-foreground">
												{image.dimensions} &middot; {image.size}
											</p>
										</div>
									</Sortable.Item>
								{/each}
							</Sortable.Content>
						</Sortable.Root>
					</Frame.Panel>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sortable list persisted to a backend">
		{#snippet blurb()}
			The drop is optimistic and the write is not: <code>onMove</code> applies the new order at once and
			issues the request, and a rejection puts the pre-drag order back. The stand-in request fails about
			one time in four, so drag a few rows to see the rollback.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 8 -->
				<Sortable.Root
					value={releaseTasks}
					getItemValue={(task) => task.id}
					onMove={commitTaskOrder}
				>
					<Sortable.Content class="mx-auto flex w-full max-w-xl flex-col gap-2">
						{#each releaseTasks as task, taskIndex (task.id)}
							<Sortable.Item value={task.id}>
								<div class="flex items-center gap-3 rounded-md border bg-background p-3">
									<Sortable.ItemHandle
										class="text-muted-foreground transition-colors hover:text-foreground"
										aria-label="Drag to reorder"
									>
										<GripVerticalIcon class="size-4" />
									</Sortable.ItemHandle>
									<Badge variant="outline" class="tabular-nums">{taskIndex + 1}</Badge>
									<span class="min-w-0 flex-1 truncate text-sm font-medium">{task.title}</span>
								</div>
							</Sortable.Item>
						{/each}
					</Sortable.Content>
				</Sortable.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
