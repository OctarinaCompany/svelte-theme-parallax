<script lang="ts">
	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import {
		Button,
		buttonContextualSolid,
		buttonVariants,
	} from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import AlignCenterIcon from "@lucide/svelte/icons/align-center";
	import AlignLeftIcon from "@lucide/svelte/icons/align-left";
	import AlignRightIcon from "@lucide/svelte/icons/align-right";
	import ArchiveIcon from "@lucide/svelte/icons/archive";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
	import AudioLinesIcon from "@lucide/svelte/icons/audio-lines";
	import BellIcon from "@lucide/svelte/icons/bell";
	import BotIcon from "@lucide/svelte/icons/bot";
	import BrainIcon from "@lucide/svelte/icons/brain";
	import CalendarDaysIcon from "@lucide/svelte/icons/calendar-days";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import ChartNoAxesColumnIcon from "@lucide/svelte/icons/chart-no-axes-column";
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import CircleQuestionMarkIcon from "@lucide/svelte/icons/circle-question-mark";
	import ClockIcon from "@lucide/svelte/icons/clock";
	import CodeXmlIcon from "@lucide/svelte/icons/code-xml";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
	import EllipsisVerticalIcon from "@lucide/svelte/icons/ellipsis-vertical";
	import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
	import EyeIcon from "@lucide/svelte/icons/eye";
	import FileBracesIcon from "@lucide/svelte/icons/file-braces";
	import FileIcon from "@lucide/svelte/icons/file";
	import FileSpreadsheetIcon from "@lucide/svelte/icons/file-spreadsheet";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FlagIcon from "@lucide/svelte/icons/flag";
	import FlaskConicalIcon from "@lucide/svelte/icons/flask-conical";
	import FlipHorizontalIcon from "@lucide/svelte/icons/flip-horizontal";
	import FlipVerticalIcon from "@lucide/svelte/icons/flip-vertical";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import FunnelIcon from "@lucide/svelte/icons/funnel";
	import GitBranchIcon from "@lucide/svelte/icons/git-branch";
	import GitForkIcon from "@lucide/svelte/icons/git-fork";
	import GitMergeIcon from "@lucide/svelte/icons/git-merge";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import HeartIcon from "@lucide/svelte/icons/heart";
	import ImageIcon from "@lucide/svelte/icons/image";
	import LayersIcon from "@lucide/svelte/icons/layers";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
	import ListIcon from "@lucide/svelte/icons/list";
	import ListFilterIcon from "@lucide/svelte/icons/list-filter";
	import ListPlusIcon from "@lucide/svelte/icons/list-plus";
	import MenuIcon from "@lucide/svelte/icons/menu";
	import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";
	import MinusIcon from "@lucide/svelte/icons/minus";
	import PaperclipIcon from "@lucide/svelte/icons/paperclip";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import PlayIcon from "@lucide/svelte/icons/play";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
	import RotateCcwClockIcon from "@lucide/svelte/icons/rotate-ccw-clock";
	import RotateCwIcon from "@lucide/svelte/icons/rotate-cw";
	import RouteIcon from "@lucide/svelte/icons/route";
	import SearchIcon from "@lucide/svelte/icons/search";
	import SendIcon from "@lucide/svelte/icons/send";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import Settings2Icon from "@lucide/svelte/icons/settings-2";
	import Share2Icon from "@lucide/svelte/icons/share-2";
	import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
	import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import StarIcon from "@lucide/svelte/icons/star";
	import TableIcon from "@lucide/svelte/icons/table";
	import TerminalIcon from "@lucide/svelte/icons/terminal";
	import TestTubeDiagonalIcon from "@lucide/svelte/icons/test-tube-diagonal";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import TrendingDownIcon from "@lucide/svelte/icons/trending-down";
	import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
	import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import UserIcon from "@lucide/svelte/icons/user";
	import UserPlusIcon from "@lucide/svelte/icons/user-plus";
	import UserRoundXIcon from "@lucide/svelte/icons/user-round-x";
	import UsersIcon from "@lucide/svelte/icons/users";
	import VolumeXIcon from "@lucide/svelte/icons/volume-x";
	import WaypointsIcon from "@lucide/svelte/icons/waypoints";
	import XIcon from "@lucide/svelte/icons/x";
	import ZapIcon from "@lucide/svelte/icons/zap";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Button group component page.
	 *
	 * The opening card shows a toolbar of grouped buttons — three plain groups and one with a
	 * nested dropdown — followed by the same group at the three sizes. It is built on shadcn's
	 * `ButtonGroup` and `Button` rather than on raw markup, so the group's corner-collapsing
	 * comes from the component and only the places where the house geometry disagrees are
	 * overridden; the constants below carry those overrides. Every section after it is a
	 * grouped-control pattern: inputs and selects in groups, split buttons, segmented controls,
	 * steppers, pagination and toolbars.
	 */

	/**
	 * Sizes, as derived and verified on the Buttons page — plus one class that only matters
	 * here.
	 *
	 * `buttonVariants`' default size carries `in-data-[slot=button-group]:rounded-md`, so a
	 * Button placed inside a group has its radius forced to 6px whatever it asked for. That is
	 * right at the base size and wrong at the other two: the group's outer corners follow the
	 * size, 8px at `lg` and 4px at `sm`. Restating the same variant is what
	 * lets tailwind-merge evict it — a plain `rounded-lg` loses, because the two classes are
	 * scoped differently rather than conflicting.
	 */
	const size = {
		lg: "h-12 rounded-lg in-data-[slot=button-group]:rounded-lg px-5 text-sm font-normal",
		base: "h-10 rounded-md px-3 text-sm font-normal",
		sm: "h-(--control-h-sm) rounded-sm in-data-[slot=button-group]:rounded-sm px-2 text-xs font-normal",
	} as const;

	/*
	 * The solid recipes come from `ui/button/button-contextual.ts`, border included — and the
	 * border is what closes the seam: shadcn's button base is `border border-transparent
	 * bg-clip-padding`, so where two buttons meet in a group a transparent border reads as a
	 * hairline of page background between them — exactly what a joined group must not show.
	 * The recipe file documents that at length.
	 */

	/**
	 * HOW GROUPED BUTTONS ARE JOINED.
	 *
	 * shadcn drops the left border of every button after the first
	 * (`[&>[data-slot]~[data-slot]]:border-l-0`). This card keeps all four borders and pulls
	 * each button 1px left instead (`-ml-px`), so the two adjacent hairlines occupy the same
	 * pixel.
	 *
	 * For the solid variants on this page the two approaches look identical — border and
	 * background are the same colour — but they differ by 1px of width per button, and the
	 * difference becomes visible the moment an outline variant is used. The overlap
	 * construction is the one this card teaches.
	 *
	 * tailwind-merge resolves `border-l` against shadcn's `border-l-0`: the arbitrary variant is
	 * part of the key, so same variant plus same property means the later class wins.
	 */
	const seam = "[&>[data-slot]~[data-slot]]:-ml-px [&>[data-slot]~[data-slot]]:border-l";

	/**
	 * The group's OUTER corners follow the size: 8px at `lg`, 6px at the base, 4px at `sm`.
	 *
	 * Each button already carries its own radius through {@link size}, and shadcn's group
	 * variant zeroes the inner corners for us. The one thing it hardcodes is the last child's
	 * right side, `rounded-r-md!`, which is correct only at the base size — hence one override
	 * per size, and none for the base.
	 */
	const lastCorner = {
		lg: "[&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-lg!",
		base: "",
		sm: "[&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-sm!",
	} as const;

	/**
	 * The toolbar is a wrapping flex row with no gap of its own; each group carries the spacing
	 * instead — 6px to the right and 12px below — so the rows keep their rhythm as the groups
	 * reflow on a narrow card.
	 */
	const groupSpacing = "mr-1.5 mb-3";

	/*
	 * NO SPECIAL RUNG FOR FIELD-BEARING GROUPS ANY MORE. These demos used to lift every button
	 * beside a field to `lg`/`icon-lg`, because the ramp's default was 36px against the input's
	 * pinned 40. The charter ended that reconciliation: `--control-h-default` IS `input-height`
	 * (CONVENTIONS.md §3), the classic theme's own reading — `.btn` and `.form-control` share the
	 * `input-btn-*` derivation — so a default button and a field sit on one seam with no size
	 * prop at all, and `lg` now means the 48px rung, which must NOT stand beside a 40px field.
	 */

	const toolbarGroups = [
		{ label: "First group", items: ["1", "2", "3", "4"] },
		{ label: "Second group", items: ["5", "6", "7"] },
		{ label: "Third group", items: ["8"] },
	];

	const sized = [
		{ key: "lg", variant: buttonContextualSolid.Warning },
		{ key: "base", variant: buttonContextualSolid.Success },
		{ key: "sm", variant: buttonContextualSolid.Primary },
	] as const;

	/*
	 * Everything below the first card is the Button Group demo set,
	 * one section per demo, in the order the set gives
	 * them — the source file is cited at each section. Unlike the classic reproduction above,
	 * these use the group and the buttons exactly as shipped: no seam or corner overrides, since
	 * The demos build on the same shadcn `ButtonGroup` this repository generates.
	 *
	 * Two standing substitutions apply throughout. Live-status dots painted `bg-green-*` upstream
	 * become the `success` token, and the avatar strip in the team demo renders initials instead
	 * of fetching portraits from GitHub — this repository's pages make no network requests for
	 * images (see the Avatar page).
	 */

	/** The trio from demo 5, keeping only what an initials avatar needs. */
	const buttonGroupTeam = [
		{ name: "Shadcn", initials: "CN" },
		{ name: "Max", initials: "ML" },
		{ name: "Evil Rabbit", initials: "ER" },
	];

	/** demo 25: the 1-10 recommendation scale, unanswered until clicked. */
	let buttonGroupRating = $state<number | null>(null);

	/** The roster from demo 26 — stock portraits become initials, per the header note. */
	const buttonGroupUsers = [
		{ id: "1", name: "Alex Johnson", initials: "AJ" },
		{ id: "2", name: "Sarah Chen", initials: "SC" },
		{ id: "3", name: "Michael Rodriguez", initials: "MR" },
		{ id: "4", name: "Emma Wilson", initials: "EW" },
	];
	let buttonGroupSelectedUserId = $state("3");
	const buttonGroupSelectedUser = $derived(
		buttonGroupUsers.find((user) => user.id === buttonGroupSelectedUserId),
	);

	/**
	 * The statuses from demo 27. Upstream paints three of the dots with raw
	 * palette colours — `bg-violet-500`, `bg-green-500`, `bg-yellow-500` — which become the
	 * status tokens `info`, `success` and `warning`; `primary` and `destructive` were already
	 * tokens upstream.
	 */
	const buttonGroupStatuses = [
		{ value: "1", label: "In Progress", color: "bg-info" },
		{ value: "2", label: "Completed", color: "bg-success" },
		{ value: "3", label: "Pending", color: "bg-primary" },
		{ value: "4", label: "Cancelled", color: "bg-warning" },
		{ value: "5", label: "Rejected", color: "bg-destructive" },
	];
	let buttonGroupStatus = $state("2");
	const buttonGroupSelectedStatus = $derived(
		buttonGroupStatuses.find((status) => status.value === buttonGroupStatus),
	);

	/*
	 * demo 28: 5% steps clamped to 0-100. Reaching zero mutes; raising the
	 * volume unmutes — exactly the wiring upstream's two setters implement.
	 */
	let buttonGroupVolume = $state(50);
	let buttonGroupMuted = $state(false);

	function buttonGroupDecreaseVolume() {
		buttonGroupVolume = Math.max(buttonGroupVolume - 5, 0);
		if (buttonGroupVolume === 0) buttonGroupMuted = true;
	}

	function buttonGroupIncreaseVolume() {
		buttonGroupVolume = Math.min(buttonGroupVolume + 5, 100);
		buttonGroupMuted = false;
	}

	/** demo 32: which of the two view buttons carries the active `bg-muted`. */
	let buttonGroupView = $state<"grid" | "list">("list");

	/** The two selects of demo 33: environment, then observation window. */
	const buttonGroupEnvironments = [
		{ value: "production", label: "Production", icon: GlobeIcon },
		{ value: "staging", label: "Staging", icon: LayersIcon },
		{ value: "development", label: "Development", icon: TerminalIcon },
	];
	const buttonGroupTimeRanges = [
		{ value: "1h", label: "Last hour", category: "recent" },
		{ value: "6h", label: "Last 6 hours", category: "recent" },
		{ value: "12h", label: "Last 12 hours", category: "recent" },
		{ value: "24h", label: "Last 24 hours", category: "recent" },
		{ value: "3d", label: "Last 3 days", category: "plus" },
		{ value: "7d", label: "Last 7 days", category: "plus" },
		{ value: "14d", label: "Last 14 days", category: "plus" },
		{ value: "30d", label: "Last 30 days", category: "plus" },
	];
	let buttonGroupEnv = $state("development");
	let buttonGroupRange = $state("12h");
	const buttonGroupSelectedEnvironment = $derived(
		buttonGroupEnvironments.find((item) => item.value === buttonGroupEnv),
	);
	const buttonGroupSelectedRange = $derived(
		buttonGroupTimeRanges.find((item) => item.value === buttonGroupRange),
	);

	/** The segments from demo 34; `id` doubles as the active key, as upstream. */
	const buttonGroupSegments = [
		{ id: "Routes", label: "Routes", icon: RouteIcon },
		{ id: "Paths", label: "Paths", icon: WaypointsIcon },
		{ id: "Bot Name", label: "Bot Name", icon: BotIcon },
	];
	let buttonGroupSegment = $state("Paths");

	/** demo 37: 10% steps clamped to 10-200, read out in a passive Text cell. */
	let buttonGroupZoom = $state(100);

	/**
	 * The models from demo 41. The tier badges wear the soft family —
	 * `success-light` / `info-light` / `warning-light` upstream — which is `{state}-subtle`
	 * here; the `size="xs"` goes, the house Badge having a single size.
	 */
	const buttonGroupModels = [
		{
			id: "gpt4o",
			label: "GPT-4o",
			badge: "Fast",
			badgeVariant: "success-subtle",
			tooltip: "128k context, fastest response",
			icon: ZapIcon,
		},
		{
			id: "claude",
			label: "Claude",
			badge: "Pro",
			badgeVariant: "info-subtle",
			tooltip: "200k context, best for analysis",
			icon: BrainIcon,
		},
		{
			id: "gemini",
			label: "Gemini",
			badge: "Preview",
			badgeVariant: "warning-subtle",
			tooltip: "1M context, experimental",
			icon: FlaskConicalIcon,
		},
	] as const;
	let buttonGroupModel = $state("claude");

	/** demo 43: clicking the active stance clears it again, hence the null. */
	const buttonGroupStances = [
		{ id: "buy", label: "Buy", icon: TrendingUpIcon },
		{ id: "hold", label: "Hold", icon: MinusIcon },
		{ id: "sell", label: "Sell", icon: TrendingDownIcon },
	];
	let buttonGroupStance = $state<string | null>(null);

	/** The funnel from demo 44, entered at "Proposal" as upstream does. */
	const buttonGroupStages = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won"];
	let buttonGroupStageIndex = $state(2);

	/**
	 * The environments from demo 45 — distinct from `buttonGroupEnvironments`
	 * above, which belongs to the select-controls demo. Upstream's `Code2Icon` and
	 * `TestTube2Icon` live under lucide's current names, `code-xml` and `test-tube-diagonal`.
	 */
	const buttonGroupSwitcherEnvironments = [
		{
			id: "development",
			label: "Dev",
			tooltip: "Local development environment",
			icon: CodeXmlIcon,
		},
		{
			id: "staging",
			label: "Staging",
			tooltip: "Pre-production mirror",
			icon: TestTubeDiagonalIcon,
		},
		{
			id: "production",
			label: "Production",
			tooltip: "Live environment — affects real users",
			icon: GlobeIcon,
		},
	];
	let buttonGroupSwitcherEnv = $state("development");

	/** The chart intervals from demo 46. */
	const buttonGroupIntervals = [
		{ id: "1m", icon: ClockIcon },
		{ id: "5m", icon: ClockIcon },
		{ id: "1H", icon: ClockIcon },
		{ id: "1D", icon: CalendarIcon },
		{ id: "1W", icon: CalendarDaysIcon },
		{ id: "Auto", icon: SparklesIcon },
	];
	let buttonGroupInterval = $state("1H");

	/** demo 48: the toolbar's own grid/list toggle, separate from the one above. */
	let buttonGroupToolbarView = $state<"grid" | "list">("grid");

	/**
	 * The nav from demo 49. Upstream's `BarChart2Icon` and `CircleHelpIcon`
	 * live under lucide's current names, `chart-no-axes-column` and `circle-question-mark`.
	 */
	const buttonGroupNavItems = [
		{ id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
		{ id: "analytics", label: "Analytics", icon: ChartNoAxesColumnIcon },
		{ id: "settings", label: "Settings", icon: SettingsIcon },
		{ id: "help", label: "Help", icon: CircleQuestionMarkIcon },
	];
	let buttonGroupNavItem = $state("dashboard");

	/** The two viewers from demo 53 — stock portraits become initials, per the header note. */
	const buttonGroupViewers = [
		{ name: "Sarah Chen", initials: "SC" },
		{ name: "Alex Johnson", initials: "AJ" },
	];

	/** The three pickers of demo 54, each a plain dropdown over strings. */
	const buttonGroupApiServices = ["Resend API", "Stripe API", "GitHub API"];
	const buttonGroupApiEnvironments = ["Production", "Staging", "Development"];
	const buttonGroupApiVersions = ["v2", "v1", "beta"];
	let buttonGroupApiService = $state("Resend API");
	let buttonGroupApiEnvironment = $state("Production");
	let buttonGroupApiVersion = $state("v2");

	/** The file pill's content from demo 56. */
	const buttonGroupAttachment = { name: "Q4-Product-Roadmap.pdf", size: "2.4 MB" };

	/** The modes from demo 57; Review and the middle cap start active, as upstream. */
	const buttonGroupAgentModes = [
		{ id: "assist", label: "Assist", icon: MessageSquareIcon },
		{ id: "review", label: "Review", icon: ShieldCheckIcon },
		{ id: "auto", label: "Auto", icon: ZapIcon },
	];
	const buttonGroupCreditCaps = ["2k credits", "10k credits", "Unlimited"];
	let buttonGroupAgentMode = $state("review");
	let buttonGroupCreditCap = $state("10k credits");
</script>

<DocPage title="Button group">
	{#snippet subtitle()}
		Group a series of buttons together on a single line with the button group. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/button-group"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!-- `.btn-toolbar`, wrapping so the four groups reflow on a narrow card. -->
			<div class="flex flex-wrap" role="toolbar" aria-label="Toolbar with button groups">
				{#each toolbarGroups as group (group.label)}
					<ButtonGroup.Root class="{seam} {groupSpacing}" aria-label={group.label}>
						{#each group.items as item (item)}
							<Button class="{size.base} {buttonContextualSolid.Secondary}">{item}</Button>
						{/each}
					</ButtonGroup.Root>
				{/each}

				<ButtonGroup.Root class="{seam} mb-3" aria-label="Button group with nested dropdown">
					<Button class="{size.base} {buttonContextualSolid.Secondary}">1</Button>
					<Button class="{size.base} {buttonContextualSolid.Secondary}">2</Button>
					<!--
						The classic theme nests a second `.btn-group` here purely because the classic dropdown needs
						a positioned wrapper. bits-ui positions from the trigger itself, so `DropdownMenu.Root`
						renders no element of its own and the trigger becomes a direct child of the group —
						which is what the corner and seam rules select on. Flattening it also avoids shadcn's
						`has-[>[data-slot=button-group]]:gap-2`, which would open an 8px gap where the classic framework
						joins the two seamlessly.
					-->
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class={cn(buttonVariants(), size.base, buttonContextualSolid.Secondary, "gap-2")}
						>
							Dropdown
							<ChevronDownIcon />
						</DropdownMenu.Trigger>
						<DropdownMenu.Content
							preventScroll={false}
							class="w-auto min-w-40 rounded-md px-0 py-2 text-sm"
						>
							{#each ["Dropdown link", "Dropdown link"] as label, index (index)}
								<DropdownMenu.Item
									class="rounded-none px-6 py-1.5 text-sm text-muted-foreground focus:bg-transparent focus:text-foreground"
								>
									{label}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</div>

			<!--
				The same group at the three sizes, each in a different variant, as the classic theme shows it.

				`inline-flex` is not cosmetic: `.btn-group` is inline-flex in the classic framework, so these
				three sit on ONE line and wrap only when they run out of room. shadcn's base is
				`flex w-fit`, which is block-level and puts each on its own line. The groups inside
				the toolbar above need no such class — they are flex items, and a flex item's
				`inline-flex` is blockified to `flex` anyway, which is exactly what the classic theme computes
				for them.
			-->
			{#each sized as row (row.key)}
				<ButtonGroup.Root
					class="{seam} {lastCorner[row.key]} {groupSpacing} inline-flex align-middle"
					aria-label="{row.key} group"
				>
					{#each ["1", "2", "3", "4"] as item (item)}
						<Button class="{size[row.key]} {row.variant}">{item}</Button>
					{/each}
				</ButtonGroup.Root>
			{/each}
		</Card.Content>
	</Card.Root>

	<DocSection title="Basic button group with two buttons">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!-- Demo 1: the group as shipped, nothing configured. -->
				<ButtonGroup.Root>
					<Button variant="outline">Button</Button>
					<Button variant="outline">Another Button</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group with button followed by input">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 2. The group's own `[&>input]:flex-1` gives the input
					the remaining width; the corner collapse works because Input carries a
					`data-slot` like any button.

					No size prop: the ramp's default IS the field's 40px (`--control-h-default` =
					`input-height`), so the two share the seam — see the note above.
				-->
				<ButtonGroup.Root>
					<Button variant="outline">Button</Button>
					<Input placeholder="Type something here..." />
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group with buttons and badge">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 3. Upstream's `variant="warning-light"` on the badge is
					the soft family, which is `warning-subtle` here.
				-->
				<ButtonGroup.Root>
					<Button variant="outline">
						<FileTextIcon data-icon="inline-start" />
						<Badge variant="warning-subtle">Draft</Badge>
					</Button>
					<Button variant="outline">
						<PencilIcon data-icon="inline-start" />
						<span>Edit</span>
					</Button>
					<Button variant="outline" size="icon" aria-label="Upload">
						<UploadIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group with dropdown menu">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!-- Demo 4: the split-button pattern, action then chevron. -->
				<ButtonGroup.Root>
					<Button variant="outline">Update</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" size="icon" aria-label="Select environment">
									<ChevronDownIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-36">
							<DropdownMenu.Item>Production</DropdownMenu.Item>
							<DropdownMenu.Item>Staging</DropdownMenu.Item>
							<DropdownMenu.Item>Development</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Team activity and collaboration group">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 5. The member strip is a `ButtonGroup.Text` cell —
					static content between actions — holding an `Avatar.Group`; portraits become
					initials and the live dot's `bg-green-500` becomes the `success` token, per the
					header note.
				-->
				<ButtonGroup.Root>
					<Button variant="outline">
						<UsersIcon data-icon="inline-start" />
						<span>Team</span>
					</Button>
					<ButtonGroup.Text class="gap-0 bg-transparent">
						<Avatar.Group>
							{#each buttonGroupTeam as member (member.name)}
								<Avatar.Root class="size-5">
									<Avatar.Fallback class="text-[9px]">{member.initials}</Avatar.Fallback>
								</Avatar.Root>
							{/each}
						</Avatar.Group>
						<div class="ml-2 flex items-center gap-1">
							<span class="size-1.5 rounded-full bg-success"></span>
							<span class="text-xs font-medium text-muted-foreground">3 Live</span>
						</div>
					</ButtonGroup.Text>
					<Button variant="outline" size="icon" aria-label="Add member">
						<PlusIcon />
					</Button>
					<Button variant="outline" size="icon" aria-label="History">
						<ClockIcon />
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" size="icon" aria-label="More options">
									<EllipsisIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-48">
							<DropdownMenu.Group>
								<DropdownMenu.Label>Team Settings</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.Item>
									<UserIcon />
									<span>Manage members</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<SettingsIcon />
									<span>Team preferences</span>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								<ExternalLinkIcon />
								<span>Open dashboard</span>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group using icons for visual actions">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!-- Demo 6: three icon-only transform actions. -->
				<ButtonGroup.Root>
					<Button variant="outline" size="icon" aria-label="Flip horizontal">
						<FlipHorizontalIcon />
					</Button>
					<Button variant="outline" size="icon" aria-label="Flip vertical">
						<FlipVerticalIcon />
					</Button>
					<Button variant="outline" size="icon" aria-label="Rotate">
						<RotateCwIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Dropdown menu with status indicator">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 7. Upstream shrinks the trigger's chevron to 3.5 and
					dims it; the size class goes — the button sizes its own icons — and only the
					opacity stays. The pulsing dot's `bg-green-600` is the `success` token.
				-->
				<ButtonGroup.Root>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="gap-2">
									<GitMergeIcon data-icon="inline-start" />
									<span>main</span>
									<ChevronDownIcon data-icon="inline-end" class="opacity-60" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="start" class="w-48">
							<DropdownMenu.Group>
								<DropdownMenu.Label>Switch Branch</DropdownMenu.Label>
								<DropdownMenu.Item>
									<GitBranchIcon />
									<span>main</span>
									<CheckIcon class="ml-auto text-primary" />
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<GitBranchIcon />
									<span>develop</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<GitBranchIcon />
									<span>feature/auth</span>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<ButtonGroup.Text class="bg-transparent">
						<div class="size-1.5 animate-pulse rounded-full bg-success"></div>
						<span>Production</span>
					</ButtonGroup.Text>
					<Button variant="outline" size="icon" aria-label="Refresh">
						<RefreshCwIcon />
					</Button>
					<Button variant="outline" size="icon" aria-label="Open externally">
						<ExternalLinkIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group styled as a like button with a counter">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 8. Upstream renders the counter through
					`<Button asChild><span>` — button clothes on a non-interactive element. The
					Svelte equivalent is the recipe on a span, plus the `data-slot` the group's
					corner and border rules key on, which `asChild` would have forwarded.
				-->
				<ButtonGroup.Root>
					<Button variant="outline">
						<HeartIcon data-icon="inline-start" />
						Like
					</Button>
					<span data-slot="button" class={cn(buttonVariants({ variant: "outline" }), "w-12")}>
						1.2K
					</span>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Nested button groups for complex action sets">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 9. Sibling groups nested in a group get the parent's
					`has-[>[data-slot=button-group]]:gap-2` — visually separate clusters, one
					accessible group. The second cluster is an InputGroup whose voice-mode addon
					doubles as a tooltip trigger.
				-->
				<ButtonGroup.Root>
					<ButtonGroup.Root>
						<Button variant="outline" size="icon" aria-label="Send">
							<SendIcon />
						</Button>
					</ButtonGroup.Root>
					<ButtonGroup.Root>
						<InputGroup.Root>
							<InputGroup.Input placeholder="Send a message..." />
							<Tooltip.Provider>
								<Tooltip.Root>
									<Tooltip.Trigger>
										{#snippet child({ props })}
											<InputGroup.Addon align="inline-end" {...props}>
												<AudioLinesIcon />
											</InputGroup.Addon>
										{/snippet}
									</Tooltip.Trigger>
									<Tooltip.Content>Voice Mode</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						</InputGroup.Root>
					</ButtonGroup.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group used for standard pagination">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!-- Demo 10: labelled arrows around plain page numbers. -->
				<ButtonGroup.Root>
					<Button variant="outline" size="sm">
						<ArrowLeftIcon data-icon="inline-start" />
						Previous
					</Button>
					<Button variant="outline" size="sm">1</Button>
					<Button variant="outline" size="sm">2</Button>
					<Button variant="outline" size="sm">3</Button>
					<Button variant="outline" size="sm">
						Next
						<ArrowRightIcon data-icon="inline-end" />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Pagination split into page numbers and navigation arrows">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!-- Demo 11: the arrows shrink to icon-only at the same height. -->
				<ButtonGroup.Root>
					<ButtonGroup.Root>
						<Button variant="outline" size="icon-sm" aria-label="Previous page">
							<ArrowLeftIcon />
						</Button>
						<Button variant="outline" size="sm">1</Button>
						<Button variant="outline" size="sm">2</Button>
						<Button variant="outline" size="sm">3</Button>
						<Button variant="outline" size="icon-sm" aria-label="Next page">
							<ArrowRightIcon />
						</Button>
					</ButtonGroup.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group for editor text alignment controls">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!-- Demo 12. -->
				<ButtonGroup.Root>
					<Button variant="outline" size="icon-sm" aria-label="Align left">
						<AlignLeftIcon />
					</Button>
					<Button variant="outline" size="icon-sm" aria-label="Align center">
						<AlignCenterIcon />
					</Button>
					<Button variant="outline" size="icon-sm" aria-label="Align right">
						<AlignRightIcon />
					</Button>
					<Button variant="outline" size="icon-sm" aria-label="Align justify">
						<MenuIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical button group orientation">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!-- Demo 13: `orientation="vertical"` stacks and collapses top/bottom corners instead. -->
				<ButtonGroup.Root orientation="vertical">
					<Button variant="outline" size="icon" aria-label="Add">
						<PlusIcon />
					</Button>
					<Button variant="outline" size="icon" aria-label="Subtract">
						<MinusIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Nested vertical button group for complex tool palettes">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 14: a vertical palette with the destructive-adjacent
					action split into its own nested group, so the parent's nested-group gap keeps
					it at arm's length.
				-->
				<ButtonGroup.Root orientation="vertical">
					<ButtonGroup.Root orientation="vertical">
						<Button variant="outline" size="icon" aria-label="Search">
							<SearchIcon />
						</Button>
						<Button variant="outline" size="icon" aria-label="Copy">
							<CopyIcon />
						</Button>
						<Button variant="outline" size="icon" aria-label="Share">
							<UploadIcon />
						</Button>
					</ButtonGroup.Root>
					<ButtonGroup.Root>
						<Button variant="outline" size="icon" aria-label="Trash">
							<Trash2Icon />
						</Button>
					</ButtonGroup.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Star button group with count and dropdown">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!-- Demo 15: the GitHub star button, count as a Badge. -->
				<ButtonGroup.Root>
					<Button variant="outline">
						<StarIcon data-icon="inline-start" />
						<span>Star</span>
						<Badge variant="secondary">2.4k</Badge>
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" size="icon">
									<ChevronDownIcon />
									<span class="sr-only">Toggle dropdown</span>
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="min-w-40">
							<DropdownMenu.Item>
								<EyeIcon />
								Watch
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<GitForkIcon />
								Fork
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<ListPlusIcon />
								Add to list
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								<Share2Icon />
								Share
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<BellIcon />
								Notifications
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								<FlagIcon />
								Report
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Search input with filter menu and clear button">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 16: menu on the left, input in the middle, clear on the
					right. No size props: the default rung is the input's own 40px.
				-->
				<ButtonGroup.Root class="max-w-xs">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" aria-label="Filter">
									<ListFilterIcon data-icon="inline-start" />
									Filter
									<ChevronDownIcon data-icon="inline-end" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="start" class="w-40">
							<DropdownMenu.Item>All Records</DropdownMenu.Item>
							<DropdownMenu.Item>Recent</DropdownMenu.Item>
							<DropdownMenu.Item>Archived</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<Input placeholder="Filter records..." />
					<Button variant="outline" size="icon" aria-label="Clear">
						<XIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group with comprehensive action menu">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 17. The delete item keeps its own
					`variant="destructive"` — the menu's negative-action variant, same vocabulary as
					everywhere else here.
				-->
				<ButtonGroup.Root>
					<Button variant="outline">
						<MessageCircleIcon data-icon="inline-start" />
						<span>Conversation</span>
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" size="icon" aria-label="Conversation actions">
									<EllipsisVerticalIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							<DropdownMenu.Group>
								<DropdownMenu.Item>
									<VolumeXIcon />
									Mute Conversation
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<CheckIcon />
									Mark as Read
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<TriangleAlertIcon />
									Report Conversation
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<UserRoundXIcon />
									Block User
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<UploadIcon />
									Share Conversation
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<CopyIcon />
									Copy Link
								</DropdownMenu.Item>
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<DropdownMenu.Item variant="destructive">
									<TrashIcon />
									Delete Conversation
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Solid split button with commit options">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 18: a solid split button. The group strips every
					button's right border, a `ButtonGroup.Separator` tinted toward `primary` draws
					the seam instead, and the trigger re-adds a faint `primary-foreground` left
					border so the joint reads on the solid fill.
				-->
				<ButtonGroup.Root class="**:data-[slot=button]:border-r-0">
					<Button>
						<PlayIcon data-icon="inline-start" class="fill-current" />
						<span>Execute</span>
					</Button>
					<ButtonGroup.Separator class="bg-primary/72" />
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									size="icon"
									aria-label="Commit options"
									class="rounded-l-none border-l border-primary-foreground/20"
								>
									<ChevronDownIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-40">
							<DropdownMenu.Item>Commit &amp; Push</DropdownMenu.Item>
							<DropdownMenu.Item>Commit &amp; Sync</DropdownMenu.Item>
							<DropdownMenu.Item>Amend Last Commit</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group with dropdown menu and input group">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 19: the search-and-filter pattern again, but the field
					is an InputGroup — icon addon inside the field — and the menu folds into a
					trailing icon button instead of a labelled leading one. An InputGroup is a field
					too, so the trigger stays on the default rung — the input's own 40px.
				-->
				<ButtonGroup.Root class="max-w-xs">
					<InputGroup.Root>
						<InputGroup.Addon>
							<SearchIcon />
						</InputGroup.Addon>
						<InputGroup.Input placeholder="Filter records..." />
					</InputGroup.Root>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" size="icon" aria-label="Filter">
									<EllipsisVerticalIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-40">
							<DropdownMenu.Item>All Records</DropdownMenu.Item>
							<DropdownMenu.Item>Recent</DropdownMenu.Item>
							<DropdownMenu.Item>Archived</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group with input group and button">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 20. The solid trigger restates its border in `primary`:
					the button base border is transparent, and inside a group a transparent border
					reads as a hairline gap against the input's real one. It also takes the 40px
					default rung the InputGroup sits at — both read 40px from the ramp.
				-->
				<ButtonGroup.Root class="max-w-xs">
					<InputGroup.Root>
						<InputGroup.Addon>
							<SearchIcon />
						</InputGroup.Addon>
						<InputGroup.Input placeholder="Filter records..." />
					</InputGroup.Root>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} aria-label="Search" class="border-primary">Search</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-40">
							<DropdownMenu.Item>All Records</DropdownMenu.Item>
							<DropdownMenu.Item>Recent</DropdownMenu.Item>
							<DropdownMenu.Item>Archived</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Basic button group with disabled button">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 22: `disabled` on the middle button — the group's
					borders and corners are unaffected, only the button dims.
				-->
				<ButtonGroup.Root>
					<Button variant="outline">
						<FileIcon data-icon="inline-start" />
						Files
					</Button>
					<Button variant="outline" disabled>
						<FolderIcon data-icon="inline-start" />
						Folder
					</Button>
					<Button variant="outline">
						<TrashIcon data-icon="inline-start" />
						Trash
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group buttons with separators">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 23: the same construction as the git toolbar above —
					the group strips the buttons' borders and a `primary`-tinted separator draws each
					seam on the solid fill. Upstream labels its third button "Trash" while rendering
					an image icon and the text "Media"; the label follows the visible text here.
				-->
				<ButtonGroup.Root class="**:data-[slot=button]:border-0">
					<Button>
						<FileIcon data-icon="inline-start" />
						Files
					</Button>
					<ButtonGroup.Separator class="bg-primary/72" />
					<Button>
						<FolderIcon data-icon="inline-start" />
						Folder
					</Button>
					<ButtonGroup.Separator class="bg-primary/72" />
					<Button>
						<ImageIcon data-icon="inline-start" />
						Media
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="View switcher for dashboard layouts">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!-- Demo 24: three icon-only layout choices. -->
				<ButtonGroup.Root>
					<Button variant="outline" size="icon" aria-label="Grid view">
						<LayoutGridIcon />
					</Button>
					<Button variant="outline" size="icon" aria-label="List view">
						<ListIcon />
					</Button>
					<Button variant="outline" size="icon" aria-label="Table view">
						<TableIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Rating scale using numerical buttons">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 25: an NPS-style scale where the chosen number goes
					solid and its hover states are pinned so it cannot dim back. Upstream's
					`space-y-3` wrapper becomes a flex column with a gap.
				-->
				<div class="flex flex-col gap-3">
					<p class="text-sm font-medium">How likely are you to recommend us?</p>
					<ButtonGroup.Root>
						{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as n (n)}
							<Button
								variant="outline"
								size="icon-sm"
								onclick={() => (buttonGroupRating = n)}
								class={cn(
									buttonGroupRating === n &&
										"border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
								)}
							>
								{n}
							</Button>
						{/each}
					</ButtonGroup.Root>
					<div class="flex justify-between text-xs text-muted-foreground">
						<span>Not likely</span>
						<span>Very likely</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group with user selection select">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 26: a Select as the group's first cell. bits-ui has no
					`SelectValue`; the trigger renders the selected member itself — same avatar-plus-
					name row the items use.
				-->
				<ButtonGroup.Root>
					<Select.Root type="single" bind:value={buttonGroupSelectedUserId}>
						<Select.Trigger class="w-40" aria-label="Select user">
							{#if buttonGroupSelectedUser}
								<span class="flex items-center gap-2">
									<Avatar.Root class="size-5">
										<Avatar.Fallback class="text-[10px]">
											{buttonGroupSelectedUser.initials}
										</Avatar.Fallback>
									</Avatar.Root>
									<span class="truncate">{buttonGroupSelectedUser.name}</span>
								</span>
							{/if}
						</Select.Trigger>
						<Select.Content class="min-w-50">
							<Select.Group>
								<Select.GroupHeading>Team Members</Select.GroupHeading>
								{#each buttonGroupUsers as user (user.id)}
									<Select.Item value={user.id} label={user.name}>
										<span class="flex items-center gap-2">
											<Avatar.Root class="size-5">
												<Avatar.Fallback class="text-[10px]">{user.initials}</Avatar.Fallback>
											</Avatar.Root>
											<span class="truncate">{user.name}</span>
										</span>
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
					<Button variant="outline" size="icon" aria-label="Add Tag">
						<PlusIcon />
					</Button>
					<Button variant="outline" size="icon" aria-label="Settings">
						<Settings2Icon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group with select status addon">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 27: status select feeding a search field. The dot
					colours are the status tokens — the mapping is documented at
					`buttonGroupStatuses`.

					The trigger needs no height class at all: `src/app.css` pins a default-size
					Select.Trigger to `--control-h-default` (40px), the same seam the buttons and
					fields above share — the `data-[size=default]:h-10` recipe this demo used to
					carry is retired with the rest of the 36px reconciliation.
				-->
				<ButtonGroup.Root class="max-w-xs">
					<Select.Root type="single" bind:value={buttonGroupStatus}>
						<Select.Trigger class="min-w-36" aria-label="Select status">
							{#if buttonGroupSelectedStatus}
								<span class="flex items-center gap-2">
									<span class={cn("size-1.5 rounded-full", buttonGroupSelectedStatus.color)}></span>
									<span>{buttonGroupSelectedStatus.label}</span>
								</span>
							{/if}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each buttonGroupStatuses as status (status.value)}
									<Select.Item value={status.value} label={status.label}>
										<span class="flex items-center gap-2">
											<span class={cn("size-1.5 rounded-full", status.color)}></span>
											<span>{status.label}</span>
										</span>
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
					<Input placeholder="Search tasks..." />
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Volume controller with plus/minus actions">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 28: a stepper whose middle button doubles as readout
					and mute toggle — `min-w-20` keeps the group from jittering as "Muted" and the
					percentages trade places.
				-->
				<ButtonGroup.Root>
					<Button
						onclick={buttonGroupDecreaseVolume}
						size="sm"
						variant="outline"
						aria-label="Decrease Volume"
					>
						<MinusIcon />
					</Button>
					<Button
						onclick={() => (buttonGroupMuted = !buttonGroupMuted)}
						size="sm"
						variant="outline"
						class="min-w-20"
					>
						{buttonGroupMuted ? "Muted" : `${buttonGroupVolume}%`}
					</Button>
					<Button
						onclick={buttonGroupIncreaseVolume}
						size="sm"
						variant="outline"
						aria-label="Increase Volume"
					>
						<PlusIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group with follower count">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!-- Demo 29: action plus a passive `ButtonGroup.Text` count. -->
				<ButtonGroup.Root>
					<Button size="sm" variant="outline">
						<UserPlusIcon data-icon="inline-start" />
						Follow
					</Button>
					<ButtonGroup.Text class="text-muted-foreground">2.4k followers</ButtonGroup.Text>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Active state button group with count">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 30: the solid variant reads as "already starred", and
					both cells restate their border in `primary` so the counter's outline matches
					the filled button instead of the default border.
				-->
				<ButtonGroup.Root>
					<Button size="sm" aria-label="Star (2.4k stars)" class="border-primary">
						<StarIcon data-icon="inline-start" />
						Star
					</Button>
					<ButtonGroup.Text class="border-primary">2.4k</ButtonGroup.Text>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group with dropdown menu and view toggle">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 32: a full list toolbar — sort menu, then the group as
					a two-way view toggle whose active side holds `bg-muted`, then a solid "Add New"
					menu. Only the toggle is grouped; the flex wrapper spaces the three clusters.
				-->
				<div class="flex items-center gap-2">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" size="icon" aria-label="Sort">
									<ListFilterIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="start" class="min-w-40">
							<DropdownMenu.Item>Newest</DropdownMenu.Item>
							<DropdownMenu.Item>Oldest</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>Recently Updated</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>

					<ButtonGroup.Root>
						<Button
							variant="outline"
							size="icon"
							class={cn(buttonGroupView === "grid" && "bg-muted")}
							onclick={() => (buttonGroupView = "grid")}
							aria-label="Grid view"
						>
							<LayoutGridIcon />
						</Button>
						<Button
							variant="outline"
							size="icon"
							class={cn(buttonGroupView === "list" && "bg-muted")}
							onclick={() => (buttonGroupView = "list")}
							aria-label="List view"
						>
							<ListIcon />
						</Button>
					</ButtonGroup.Root>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props}>
									Add New
									<ChevronDownIcon data-icon="inline-end" class="opacity-60" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="min-w-40">
							<DropdownMenu.Item>
								<PlusIcon />
								Project
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<PlusIcon />
								Domain
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								<PlusIcon />
								Team
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button group with select controls">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 33: two selects sharing one group, environment and
					observation window, the second split into free and "Observability Plus" ranges.
					Upstream sizes the item icons to 3.5 by hand; here only the dimming stays — the
					select sizes its own icons.
				-->
				<ButtonGroup.Root>
					<Select.Root type="single" bind:value={buttonGroupEnv}>
						<Select.Trigger class="w-40" aria-label="Select environment">
							{#if buttonGroupSelectedEnvironment}
								{@const EnvironmentIcon = buttonGroupSelectedEnvironment.icon}
								<span class="flex items-center gap-2">
									<EnvironmentIcon class="opacity-60" />
									<span>{buttonGroupSelectedEnvironment.label}</span>
								</span>
							{/if}
						</Select.Trigger>
						<Select.Content align="start">
							<Select.Group>
								{#each buttonGroupEnvironments as environment (environment.value)}
									{@const EnvironmentIcon = environment.icon}
									<Select.Item value={environment.value} label={environment.label}>
										<span class="flex items-center gap-2">
											<EnvironmentIcon class="opacity-60" />
											<span>{environment.label}</span>
										</span>
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>

					<Select.Root type="single" bind:value={buttonGroupRange}>
						<Select.Trigger class="w-40" aria-label="Select range">
							{buttonGroupSelectedRange?.label}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each buttonGroupTimeRanges.filter((r) => r.category === "recent") as item (item.value)}
									<Select.Item value={item.value} label={item.label}>{item.label}</Select.Item>
								{/each}
							</Select.Group>
							<Select.Separator />
							<Select.Group>
								<Select.GroupHeading>Observability Plus</Select.GroupHeading>
								{#each buttonGroupTimeRanges.filter((r) => r.category === "plus") as item (item.value)}
									<Select.Item value={item.value} label={item.label}>{item.label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Segmented control with dropdown inside button group">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 34: one-of-three segments marked by `bg-muted`, with an
					overflow menu as the group's last cell. Same icon-sizing note as the selects
					above: upstream's hand-set 3.5 goes, the dimming stays.
				-->
				<ButtonGroup.Root>
					{#each buttonGroupSegments as segment (segment.id)}
						{@const SegmentIcon = segment.icon}
						<Button
							variant="outline"
							class={cn(buttonGroupSegment === segment.id && "bg-muted")}
							onclick={() => (buttonGroupSegment = segment.id)}
						>
							<SegmentIcon data-icon="inline-start" class="opacity-60" />
							{segment.label}
						</Button>
					{/each}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" size="icon" aria-label="More options">
									<ChevronDownIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="min-w-40">
							<DropdownMenu.Item>Filter by Group</DropdownMenu.Item>
							<DropdownMenu.Item>Sort by Name</DropdownMenu.Item>
							<DropdownMenu.Item>Export Data</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Pagination button group">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 35: square cells throughout, and the current page goes
					solid — restating its border in `primary` for the same seam reason as the
					counter demo above.
				-->
				<ButtonGroup.Root>
					<Button variant="outline" size="icon" aria-label="Previous page">
						<ChevronLeftIcon />
					</Button>
					<Button variant="outline" size="icon">1</Button>
					<Button variant="outline" size="icon">2</Button>
					<Button size="icon" class="border-primary">3</Button>
					<Button variant="outline" size="icon">4</Button>
					<Button variant="outline" size="icon">5</Button>
					<Button variant="outline" size="icon" aria-label="Next page">
						<ChevronRightIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Zoom controls button group">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 37: the volume stepper's construction with the readout
					moved into a passive `ButtonGroup.Text` cell — `w-16 justify-center` keeps the
					group's width steady anywhere between "10%" and "200%".
				-->
				<ButtonGroup.Root>
					<Button
						variant="outline"
						size="icon"
						aria-label="Zoom out"
						onclick={() => (buttonGroupZoom = Math.max(buttonGroupZoom - 10, 10))}
					>
						<MinusIcon />
					</Button>
					<ButtonGroup.Text class="w-16 justify-center">{buttonGroupZoom}%</ButtonGroup.Text>
					<Button
						variant="outline"
						size="icon"
						aria-label="Zoom in"
						onclick={() => (buttonGroupZoom = Math.min(buttonGroupZoom + 10, 200))}
					>
						<PlusIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical button group">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 40: the vertical orientation worn as a sidebar nav —
					every cell left-aligned by `justify-start`, the current page statically marked
					with `bg-muted`. The interactive version is the nav-links demo further down.
				-->
				<ButtonGroup.Root orientation="vertical">
					<Button variant="outline" class="justify-start bg-muted">Dashboard</Button>
					<Button variant="outline" class="justify-start">Analytics</Button>
					<Button variant="outline" class="justify-start">Settings</Button>
					<Button variant="outline" class="justify-start">Help</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Model selector with tier badges">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 41: the segmented pattern with a tier Badge riding in
					each cell and a tooltip explaining it. The badge variants are documented at
					`buttonGroupModels`.
				-->
				<ButtonGroup.Root>
					<Tooltip.Provider>
						{#each buttonGroupModels as model (model.id)}
							{@const ModelIcon = model.icon}
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										<Button
											{...props}
											variant="outline"
											class={cn(buttonGroupModel === model.id && "bg-muted")}
											onclick={() => (buttonGroupModel = model.id)}
										>
											<ModelIcon data-icon="inline-start" />
											{model.label}
											<Badge variant={model.badgeVariant}>{model.badge}</Badge>
										</Button>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>{model.tooltip}</Tooltip.Content>
							</Tooltip.Root>
						{/each}
					</Tooltip.Provider>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Buy sell hold toggle group">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 43. Unlike the `bg-muted` segments elsewhere on this
					page, the active state here is the variant itself — outline flips to the solid
					default — and a second click on the active stance deselects it.
				-->
				<ButtonGroup.Root>
					{#each buttonGroupStances as stance (stance.id)}
						{@const StanceIcon = stance.icon}
						<Button
							variant={buttonGroupStance === stance.id ? "default" : "outline"}
							onclick={() =>
								(buttonGroupStance = buttonGroupStance === stance.id ? null : stance.id)}
						>
							<StanceIcon data-icon="inline-start" />
							{stance.label}
						</Button>
					{/each}
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Pipeline stage mover with dropdown">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 44: arrows step through the stages and disable at the
					ends; the middle cell jumps directly, marking the current stage the same way the
					branch menu above does. Upstream's `size-3.5` on the two indicator icons goes —
					the button and menu size their own icons — and only the dimming stays.
				-->
				<ButtonGroup.Root>
					<Button
						variant="outline"
						size="icon"
						aria-label="Previous stage"
						disabled={buttonGroupStageIndex === 0}
						onclick={() => (buttonGroupStageIndex -= 1)}
					>
						<ChevronLeftIcon />
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="min-w-36 justify-between">
									<span class="truncate">{buttonGroupStages[buttonGroupStageIndex]}</span>
									<ChevronsUpDownIcon data-icon="inline-end" class="opacity-50" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-44">
							<DropdownMenu.Group>
								<DropdownMenu.Label>Jump to stage</DropdownMenu.Label>
								{#each buttonGroupStages as stage, index (stage)}
									<DropdownMenu.Item onclick={() => (buttonGroupStageIndex = index)}>
										{stage}
										{#if index === buttonGroupStageIndex}
											<CheckIcon class="ml-auto text-primary" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<Button
						variant="outline"
						size="icon"
						aria-label="Next stage"
						disabled={buttonGroupStageIndex === buttonGroupStages.length - 1}
						onclick={() => (buttonGroupStageIndex += 1)}
					>
						<ChevronRightIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Environment switcher with indicator">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 45: tooltip-explained segments again, but the group
					grows a passive "Live" cell only while Production is selected — the dot was
					already the `success` token upstream.
				-->
				<ButtonGroup.Root>
					<Tooltip.Provider>
						{#each buttonGroupSwitcherEnvironments as environment (environment.id)}
							{@const EnvironmentIcon = environment.icon}
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										<Button
											{...props}
											variant="outline"
											class={cn(buttonGroupSwitcherEnv === environment.id && "bg-muted")}
											onclick={() => (buttonGroupSwitcherEnv = environment.id)}
										>
											<EnvironmentIcon data-icon="inline-start" />
											{environment.label}
										</Button>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>{environment.tooltip}</Tooltip.Content>
							</Tooltip.Root>
						{/each}
						{#if buttonGroupSwitcherEnv === "production"}
							<ButtonGroup.Text class="bg-transparent">
								<div class="size-1.5 rounded-full bg-success"></div>
								<span>Live</span>
							</ButtonGroup.Text>
						{/if}
					</Tooltip.Provider>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Compact time interval selector">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 46. Upstream hand-shrinks the buttons to h-7/px-2.5
					below its own `sm`; the house ramp stops at `sm` (h-8), so the buttons take that
					size and keep only `text-xs tabular-nums` — the part of the compactness that
					also stops the cells jittering between "1m" and "Auto".
				-->
				<ButtonGroup.Root>
					{#each buttonGroupIntervals as interval (interval.id)}
						{@const IntervalIcon = interval.icon}
						<Button
							variant="outline"
							size="sm"
							class={cn("text-xs tabular-nums", buttonGroupInterval === interval.id && "bg-muted")}
							onclick={() => (buttonGroupInterval = interval.id)}
						>
							<IntervalIcon data-icon="inline-start" />
							{interval.id}
						</Button>
					{/each}
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toolbar filter with export and view toggle">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 48: unlike the three-cluster toolbar above, everything
					shares ONE group — a plain `ButtonGroup.Separator` fences the filter off from the
					export pair, and the export menu's JSON entry wears lucide's current name for
					upstream's `FileJsonIcon`, `file-braces`.
				-->
				<ButtonGroup.Root>
					<Button variant="outline">
						<ListFilterIcon data-icon="inline-start" />
						Filter
					</Button>
					<ButtonGroup.Separator />
					<Button variant="outline">
						<DownloadIcon data-icon="inline-start" />
						Export CSV
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									size="icon"
									class="shrink-0"
									aria-label="More export options"
								>
									<ChevronDownIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-40">
							<DropdownMenu.Group>
								<DropdownMenu.Item>
									<FileSpreadsheetIcon />
									Export Excel
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<FileBracesIcon />
									Export JSON
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<FileTextIcon />
									Export PDF
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<Button
						variant="outline"
						size="icon"
						aria-label="Grid view"
						class={cn(buttonGroupToolbarView === "grid" && "bg-muted")}
						onclick={() => (buttonGroupToolbarView = "grid")}
					>
						<LayoutGridIcon />
					</Button>
					<Button
						variant="outline"
						size="icon"
						aria-label="List view"
						class={cn(buttonGroupToolbarView === "list" && "bg-muted")}
						onclick={() => (buttonGroupToolbarView = "list")}
					>
						<ListIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical nav links with icons">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 49: the interactive version of the static vertical nav
					above — icons join the labels and `bg-muted` follows the click.
				-->
				<ButtonGroup.Root orientation="vertical">
					{#each buttonGroupNavItems as item (item.id)}
						{@const ItemIcon = item.icon}
						<Button
							variant="outline"
							class={cn("justify-start", buttonGroupNavItem === item.id && "bg-muted")}
							onclick={() => (buttonGroupNavItem = item.id)}
						>
							<ItemIcon data-icon="inline-start" />
							{item.label}
						</Button>
					{/each}
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toolbar filter sort and more">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 50: the export toolbar's construction at `sm`, icon-only.
					Upstream's `FilterIcon` and `MoreHorizontalIcon` live under lucide's current
					names, `funnel` and `ellipsis`.
				-->
				<ButtonGroup.Root>
					<Button variant="outline" size="sm" aria-label="Filter">
						<FunnelIcon />
					</Button>
					<Button variant="outline" size="sm" aria-label="Sort">
						<ArrowUpDownIcon />
					</Button>
					<ButtonGroup.Separator />
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" size="sm" aria-label="More options">
									<EllipsisIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" sideOffset={8}>
							<DropdownMenu.Group>
								<DropdownMenu.Item>
									<CopyIcon />
									Copy link
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<Share2Icon />
									Share
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<DownloadIcon />
									Export
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item>
									<SettingsIcon />
									Settings
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="New button with create dropdown">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 51: the split pattern at `sm`, the trigger an ellipsis
					over a labelled Create menu. Upstream also stamps aria-label="More options" on
					the visible "New" button — a copy-paste slip that would override its own text,
					not reproduced.
				-->
				<ButtonGroup.Root>
					<Button variant="outline" size="sm">
						<PlusIcon data-icon="inline-start" />
						New
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" size="icon-sm" aria-label="More options">
									<EllipsisIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-40">
							<DropdownMenu.Group>
								<DropdownMenu.Label>Create</DropdownMenu.Label>
								<DropdownMenu.Item>
									<UserPlusIcon />
									New Customer
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<ShoppingCartIcon />
									New Order
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<FileTextIcon />
									New Invoice
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Publish controls with split button and overflow">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 53: a full page-header toolbar — viewer avatars, a
					vertical rule, Preview (label hidden below `md`), the git toolbar's solid-split
					construction on Publish, and a ghost overflow menu ending in the destructive
					Delete. Portraits become initials per the header note; the menu icons drop
					upstream's `size-4` and keep the dimming; upstream's `HistoryIcon` lives under
					lucide's current name, `rotate-ccw-clock`.
				-->
				<div class="flex shrink-0 items-center gap-2">
					<Avatar.Group>
						{#each buttonGroupViewers as viewer (viewer.name)}
							<Avatar.Root class="size-6">
								<Avatar.Fallback class="text-[10px]">{viewer.initials}</Avatar.Fallback>
							</Avatar.Root>
						{/each}
					</Avatar.Group>

					<Separator orientation="vertical" class="my-auto h-4" />

					<Button variant="outline" size="sm">
						<EyeIcon data-icon="inline-start" />
						<span class="hidden md:block">Preview</span>
					</Button>

					<ButtonGroup.Root class="**:data-[slot=button]:border-r-0">
						<Button size="sm">
							<SendIcon data-icon="inline-start" />
							Publish
						</Button>
						<ButtonGroup.Separator class="bg-primary/72" />
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										size="icon-sm"
										aria-label="More publish options"
										class="rounded-l-none border-l border-primary-foreground/20"
									>
										<ChevronDownIcon />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content sideOffset={8} align="end" class="w-48">
								<DropdownMenu.Group>
									<DropdownMenu.Item>
										<CalendarIcon class="opacity-60" />
										Schedule for later
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<FileIcon class="opacity-60" />
										Save as draft
									</DropdownMenu.Item>
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</ButtonGroup.Root>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="ghost" size="icon-sm" aria-label="More actions">
									<EllipsisIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content sideOffset={8} align="end" class="w-40">
							<DropdownMenu.Group>
								<DropdownMenu.Item>
									<CopyIcon class="opacity-60" />
									Duplicate
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<RotateCcwClockIcon class="opacity-60" />
									View history
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<ArchiveIcon class="opacity-60" />
									Archive
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item variant="destructive">
									<TrashIcon />
									Delete
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API service environment and version selectors">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 54: three dropdown pickers sharing one group, each
					trigger showing its current value — service in full strength, environment and
					version dimmed, the version in mono. Upstream hand-shrinks to h-7 with 3.5/3
					icons; the buttons take the ramp's `sm` and size their own icons, keeping the
					`text-xs` type and the dimming. `Code2Icon` lives under lucide's current name,
					`code-xml`.
				-->
				<ButtonGroup.Root>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									size="sm"
									class="text-xs font-normal"
									aria-label="Select API service"
								>
									<CodeXmlIcon data-icon="inline-start" class="opacity-60" />
									{buttonGroupApiService}
									<ChevronDownIcon data-icon="inline-end" class="opacity-60" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="start" class="w-40">
							<DropdownMenu.Group>
								{#each buttonGroupApiServices as item (item)}
									<DropdownMenu.Item onclick={() => (buttonGroupApiService = item)}>
										{item}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									size="sm"
									class="text-xs font-normal text-muted-foreground"
									aria-label="Select environment"
								>
									{buttonGroupApiEnvironment}
									<ChevronDownIcon data-icon="inline-end" class="opacity-60" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="start" class="w-36">
							<DropdownMenu.Group>
								{#each buttonGroupApiEnvironments as item (item)}
									<DropdownMenu.Item onclick={() => (buttonGroupApiEnvironment = item)}>
										{item}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									size="sm"
									class="font-mono text-xs text-muted-foreground"
									aria-label="Select API version"
								>
									{buttonGroupApiVersion}
									<ChevronDownIcon data-icon="inline-end" class="opacity-60" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="start" class="w-24">
							<DropdownMenu.Group>
								{#each buttonGroupApiVersions as item (item)}
									<DropdownMenu.Item onclick={() => (buttonGroupApiVersion = item)}>
										<span class="font-mono">{item}</span>
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Payout release controls with amount context">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 55: an amount cell beside a Hold action, then the
					solid-split construction on Release — the same border-r-0 / tinted separator /
					inset border-l recipe as the Publish demo above. The cell's icon and the menu
					icons drop upstream's explicit sizes and keep the dimming.
				-->
				<div class="flex flex-wrap items-center gap-2">
					<ButtonGroup.Root>
						<ButtonGroup.Text
							class="gap-1.5 border-input bg-muted/40 text-xs text-muted-foreground"
						>
							<CreditCardIcon class="opacity-60" />
							<span class="font-medium text-foreground tabular-nums">USD 12,480</span>
						</ButtonGroup.Text>
						<Button variant="outline" size="sm">Hold</Button>
					</ButtonGroup.Root>

					<ButtonGroup.Root class="**:data-[slot=button]:border-r-0">
						<Button size="sm">
							<CheckIcon data-icon="inline-start" />
							Release
						</Button>
						<ButtonGroup.Separator class="bg-primary/72" />
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										{...props}
										size="icon-sm"
										aria-label="More payout actions"
										class="rounded-l-none border-l border-primary-foreground/20"
									>
										<ChevronDownIcon />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" sideOffset={8} class="w-44">
								<DropdownMenu.Group>
									<DropdownMenu.Item>
										<CalendarIcon class="opacity-60" />
										Schedule for Friday
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<CreditCardIcon class="opacity-60" />
										Change destination
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<FileTextIcon class="opacity-60" />
										Export receipt
									</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item variant="destructive">
										<XIcon />
										Cancel payout
									</DropdownMenu.Item>
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</ButtonGroup.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Attachment button group with download action">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 56: the file pill at `xs` — a step the house Button
					ships below the ramp — with the byte count dimmed inline beside the name.
				-->
				<ButtonGroup.Root>
					<Button variant="outline" size="xs">
						<PaperclipIcon data-icon="inline-start" />
						{buttonGroupAttachment.name}
						<span class="opacity-60">({buttonGroupAttachment.size})</span>
					</Button>
					<Button variant="outline" size="icon-xs" aria-label="Download attachment">
						<DownloadIcon />
					</Button>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Agent mode selector with credit cap dropdown">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 57: three mode segments where the active one wears
					`bg-muted` like every other segmented demo on this page, then a separator and
					the credit-cap dropdown. The mode icons and the chevron drop upstream's
					explicit sizes and keep the dimming.
				-->
				<ButtonGroup.Root>
					{#each buttonGroupAgentModes as mode (mode.id)}
						{@const ModeIcon = mode.icon}
						<Button
							variant="outline"
							size="sm"
							class={cn(buttonGroupAgentMode === mode.id && "bg-muted")}
							onclick={() => (buttonGroupAgentMode = mode.id)}
						>
							<ModeIcon data-icon="inline-start" class="opacity-60" />
							{mode.label}
						</Button>
					{/each}
					<ButtonGroup.Separator />
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									size="sm"
									class="gap-1.5 text-xs"
									aria-label="Select credit cap"
								>
									{buttonGroupCreditCap}
									<ChevronDownIcon data-icon="inline-end" class="opacity-60" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-32">
							<DropdownMenu.Group>
								{#each buttonGroupCreditCaps as cap (cap)}
									<DropdownMenu.Item onclick={() => (buttonGroupCreditCap = cap)}>
										{cap}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
