<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import CircleIcon from "@lucide/svelte/icons/circle";
	import GitCompareArrowsIcon from "@lucide/svelte/icons/git-compare-arrows";
	import GitForkIcon from "@lucide/svelte/icons/git-fork";
	import GitMergeIcon from "@lucide/svelte/icons/git-merge";
	import GitPullRequestArrowIcon from "@lucide/svelte/icons/git-pull-request-arrow";
	import PlayIcon from "@lucide/svelte/icons/play";
	import XIcon from "@lucide/svelte/icons/x";

	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import { getInitials } from "$lib/shared/get-initials.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Timeline from "$lib/components/ui/timeline/index.js";

	/**
	 * The Timeline component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. Its activity feeds are list groups with an avatar in the first
	 * column — there is no connector line and no dot rail anywhere in the theme.
	 *
	 * The rail is therefore the component's own, drawn in `--border` so it sits at the same weight
	 * as every other divider on the page, and the dots take `--primary` for a completed step and
	 * `--muted-foreground` for a pending one.
	 */

	const projectItems = [
		{
			id: "project-kickoff",
			dateTime: "2025-01-15",
			date: "January 15, 2025",
			title: "Project Kickoff",
			description: "Initial meeting to define scope.",
		},
		{
			id: "design-phase",
			dateTime: "2025-02-01",
			date: "February 1, 2025",
			title: "Design Phase",
			description: "Created wireframes and mockups.",
		},
		{
			id: "development",
			dateTime: "2025-03-01",
			date: "March 1, 2025",
			title: "Development",
			description: "Building core features.",
		},
	];

	const quarterItems = [
		{
			id: "research-and-planning",
			dateTime: "2025-01",
			date: "Jan - Mar",
			title: "Q1",
			description: "Research and planning",
		},
		{
			id: "development-sprint",
			dateTime: "2025-04",
			date: "Apr - Jun",
			title: "Q2",
			description: "Development sprint",
		},
		{
			id: "beta-launch",
			dateTime: "2025-07",
			date: "Jul - Sep",
			title: "Q3",
			description: "Beta launch",
		},
	];

	const eventItems = [
		{
			id: "registration-opened",
			dateTime: "2025-01-01",
			date: "January 1, 2025",
			title: "Registration Opened",
			description: "Online registration portal opens.",
		},
		{
			id: "early-bird-deadline",
			dateTime: "2025-02-15",
			date: "February 15, 2025",
			title: "Early Bird Deadline",
			description: "Last day for early bird pricing.",
		},
		{
			id: "event-day",
			dateTime: "2025-03-01",
			date: "March 1, 2025",
			title: "Event Day",
			description: "Main event begins at 9:00 AM.",
		},
	];

	const companyItems = [
		{
			id: "company-founded",
			dateTime: "2023-06",
			date: "June 2023",
			title: "Company Founded",
			description: "Started with a team of five.",
		},
		{
			id: "series-a-funding",
			dateTime: "2024-03",
			date: "March 2024",
			title: "Series A Funding",
			description: "Raised a $10M Series A round.",
		},
		{
			id: "product-launch",
			dateTime: "2025-01",
			date: "January 2025",
			title: "Product Launch",
			description: "Released MVP to beta testers.",
		},
	];

	let activeIndex = $state(1);

	/**
	 * The sections below are the timeline demo set, showing what the primitive looks like
	 * once it carries real content — order tracking, CI pipelines, deployment logs, activity feeds.
	 *
	 * The demos assume a DIFFERENT PRIMITIVE, so these are compositions rather than transcriptions.
	 * Its parts are `TimelineIndicator` / `TimelineSeparator` / `TimelineDate` / `TimelineContent`,
	 * numbered by a one-based `step` prop against a `defaultValue`, with the indicator absolutely
	 * positioned into a margin the demo opens with `ms-10`. Here the same pictures are drawn with
	 * `Timeline.Dot` / `Timeline.Connector` / `Timeline.Time` / `Timeline.Description`, addressed by
	 * the zero-based `activeIndex` this component already publishes, and the rail offset comes from
	 * `--timeline-dot-size` instead of per-item margin arithmetic — the same knob the Custom Dot
	 * section above uses.
	 *
	 * THREE STANDING RULES bend the upstream examples:
	 *
	 * 1. NO PHOTOGRAPHS. Stock demos would load remote portraits into the pipeline and activity-feed avatars;
	 *    this repository ships no images and fetches none, so those become initials — the same
	 *    substitution the Filters page makes.
	 *
	 * 2. NO RAW PALETTE COLOURS. `bg-emerald-500`, `bg-violet-500` and friends paint upstream's
	 *    deployment and roadmap dots. They become `--success` / `--destructive` / `--primary` here,
	 *    which is also what makes the status readable in dark mode.
	 *
	 * 3. THE SOFT FAMILY IS `{state}-subtle`. The `success-light` / `destructive-light` /
	 *    `primary-light` badge appearances map onto this repository's subtle variants, and its
	 *    `size="sm"` badge has no counterpart — Badge here has one size.
	 */

	const roadmapItems = [
		{
			id: "ai-engine-integration",
			dateTime: "2025-01",
			date: "Jan 2025",
			title: "AI Engine Integration",
			description:
				"Deep integration of advanced LLMs for real-time code generation and context-aware suggestions.",
		},
		{
			id: "collaborative-editing",
			dateTime: "2025-02",
			date: "Feb 2025",
			title: "Collaborative Editing",
			description:
				"Multi-user real-time collaboration with shared cursors and instant synchronization across workspaces.",
		},
		{
			id: "visual-theme-builder",
			dateTime: "2025-03",
			date: "Mar 2025",
			title: "Visual Theme Builder",
			description:
				"Interactive interface for creating and managing custom design systems with automated CSS variable generation.",
		},
		{
			id: "enterprise-security",
			dateTime: "2025-04",
			date: "Apr 2025",
			title: "Enterprise Security",
			description:
				"Role-based access control, SOC2 compliance audit, and enhanced data encryption protocols.",
		},
	];

	const orderStatusItems = [
		{
			id: "order-placed",
			dateTime: "2024-03-15",
			date: "Mar 15, 2024",
			title: "Order Placed",
			description: "Your order has been received and is being processed.",
		},
		{
			id: "payment-confirmed",
			dateTime: "2024-03-16",
			date: "Mar 16, 2024",
			title: "Payment Confirmed",
			description: "Transaction successful. Preparing for shipment.",
		},
		{
			id: "order-shipped",
			dateTime: "2024-03-18",
			date: "Mar 18, 2024",
			title: "Shipped",
			description: "Your package is on its way. Track your delivery.",
		},
		{
			id: "order-delivered",
			dateTime: "2024-03-20",
			date: "Mar 20, 2024",
			title: "Delivered",
			description: "Package successfully delivered to the recipient.",
		},
	];

	/** Index of the step the order has reached — everything up to it carries the check mark. */
	const orderStatusActiveIndex = 2;

	const gitActivityItems = [
		{
			id: "forked-repository",
			date: "15 minutes ago",
			title: "Forked Repository",
			description: "Forked the repository to create a new branch for development.",
			icon: GitForkIcon,
		},
		{
			id: "pull-request-submitted",
			date: "10 minutes ago",
			title: "Pull Request Submitted",
			description: "Submitted PR #342 with new feature implementation. Waiting for code review.",
			icon: GitPullRequestArrowIcon,
		},
		{
			id: "comparing-branches",
			date: "5 minutes ago",
			title: "Comparing Branches",
			description: "Received comments on PR. Minor adjustments needed in error handling.",
			icon: GitCompareArrowsIcon,
		},
		{
			id: "merged-branch",
			date: "Just now",
			title: "Merged Branch",
			description: "Merged the feature branch into the main branch. Ready for deployment.",
			icon: GitMergeIcon,
		},
	];

	const gitActivityActiveIndex = 2;

	const pipelineSteps = [
		{
			id: "source-code-checkout",
			title: "Source Code Checkout",
			duration: "12s",
			status: "completed",
			description: "Successfully fetched latest changes from the main branch.",
			user: "Alex Johnson",
		},
		{
			id: "dependency-installation",
			title: "Dependency Installation",
			duration: "1m 45s",
			status: "completed",
			description: "All npm packages installed and cached for future builds.",
			user: "Sarah Chen",
		},
		{
			id: "unit-and-integration-tests",
			title: "Unit & Integration Tests",
			duration: "Running",
			status: "active",
			description: "Running 142 test suites across the entire codebase...",
			user: "Michael Rodriguez",
		},
		{
			id: "production-build",
			title: "Production Build",
			duration: "Pending",
			status: "pending",
			description: "Optimizing assets and generating static site pages.",
			user: "Emma Wilson",
		},
	];

	/** One open flag per pipeline step — upstream's `<Collapsible defaultOpen>`, per row. */
	let pipelineOpen = $state(pipelineSteps.map(() => true));

	const roadmapPhases = [
		{
			id: "beta-program",
			dateTime: "2025-12-15",
			date: "Dec 15, 2025",
			state: "Completed",
			label: "Beta Program",
		},
		{
			id: "usability-testing",
			dateTime: "2025-11-01",
			date: "Nov 01, 2025",
			state: "Completed",
			label: "Usability Testing",
		},
		{
			id: "design-phase",
			dateTime: "2025-10-15",
			date: "Oct 15, 2025",
			state: "Initiated",
			label: "Design Phase",
		},
		{
			id: "requirements-gathering",
			dateTime: "2024-08-01",
			date: "Aug 01, 2024",
			state: "Completed",
			label: "Requirements Gathering",
		},
		{
			id: "project-kickoff",
			dateTime: "2024-07-15",
			date: "Jul 15, 2024",
			state: "Started",
			label: "Project Kickoff",
		},
	];

	const deployments = [
		{
			id: "production-deploy-latest",
			title: "Production Deploy",
			dateTime: "2025-06-02T10:58",
			date: "2 minutes ago",
			commit: "a1b2c3d",
			branch: "main",
			status: "success",
			duration: "42s",
		},
		{
			id: "staging-deploy",
			title: "Staging Deploy",
			dateTime: "2025-06-02T10:45",
			date: "15 minutes ago",
			commit: "e4f5g6h",
			branch: "staging",
			status: "success",
			duration: "38s",
		},
		{
			id: "preview-deploy",
			title: "Preview Deploy",
			dateTime: "2025-06-02T10:00",
			date: "1 hour ago",
			commit: "i7j8k9l",
			branch: "feat/auth",
			status: "failed",
			duration: "1m 12s",
		},
		{
			id: "production-deploy-earlier",
			title: "Production Deploy",
			dateTime: "2025-06-02T08:00",
			date: "3 hours ago",
			commit: "m0n1o2p",
			branch: "main",
			status: "success",
			duration: "45s",
		},
	];

	const activities = [
		{
			id: "pushed-commits",
			user: "Alex Johnson",
			action: "pushed 3 commits to",
			target: "main",
			dateTime: "2025-06-02T10:55",
			date: "5 minutes ago",
		},
		{
			id: "opened-pull-request",
			user: "Sarah Chen",
			action: "opened pull request",
			target: "#284 — Add dark mode",
			dateTime: "2025-06-02T10:40",
			date: "20 minutes ago",
		},
		{
			id: "commented-on-issue",
			user: "David Kim",
			action: "commented on",
			target: "Issue #142",
			dateTime: "2025-06-02T10:00",
			date: "1 hour ago",
		},
		{
			id: "deployed-to-production",
			user: "Emma Wilson",
			action: "deployed to",
			target: "production",
			dateTime: "2025-06-02T09:00",
			date: "2 hours ago",
		},
		{
			id: "merged-notifications",
			user: "Michael Rodriguez",
			action: "merged branch",
			target: "feat/notifications",
			dateTime: "2025-06-02T08:00",
			date: "3 hours ago",
		},
	];

	const releases = [
		{
			id: "v1-0",
			version: "v1.0",
			dateTime: "2025-01",
			date: "Jan 2025",
			title: "Initial Release",
			status: "released",
		},
		{
			id: "v1-1",
			version: "v1.1",
			dateTime: "2025-03",
			date: "Mar 2025",
			title: "Bug Fixes",
			status: "released",
		},
		{
			id: "v2-0",
			version: "v2.0",
			dateTime: "2025-06",
			date: "Jun 2025",
			title: "Major Update",
			status: "current",
		},
		{
			id: "v2-1",
			version: "v2.1",
			dateTime: "2025-09",
			date: "Sep 2025",
			title: "Improvements",
			status: "upcoming",
		},
	];

	/**
	 * The last three sections on this page are the block-style timeline demos — the filled, the
	 * hollow and the non-alternating forms.
	 *
	 * ITS PRIMITIVE IS NOT PORTED, AND DELIBERATELY SO. Upstream is one `<Timeline>` that clones an
	 * `index` onto each child, drives a `grid-cols-[1fr_2rem_1fr]` with inline `gridColumn` /
	 * `gridRow` styles, and runs a `ResizeObserver` over the first and last card to pad the list.
	 * Everything it draws is already expressible here — `variant="alternate"`
	 * IS that two-column zig-zag, and the rail, the dot and the gutter between them are all driven by
	 * `--timeline-connector-thickness` and `--timeline-dot-size` — so these are compositions of the
	 * component this page already documents, not a second timeline.
	 *
	 * Its three layout switches map like this:
	 *
	 * 1. `alternating` -> `variant="alternate"` against `variant="default"`.
	 *
	 * 2. `noCards` -> whether a `Card` is placed inside `Timeline.Content`. There is no card chrome
	 *    to strip here: every other section on this page is already the card-less shape, so only the
	 *    CARD version is new, and `noCards` needs no section of its own.
	 *
	 * 3. `hollow` -> the dot's own default. `timelineDotVariants` is `border-2 bg-background`
	 *    already, so a hollow marker is the base state and a FILLED dot is the override.
	 *
	 * Upstream's per-item `variant` (default / secondary / destructive / outline) paints the dot and
	 * the branch. Here it becomes a semantic tone, and it stays on the DOT rather than tinting the
	 * card: a tinted card would owe its text the matching `{state}-subtle-foreground` ink, and
	 * `Timeline.Description` pins that slot to `--muted-foreground`.
	 */

	/**
	 * Upstream's "branch": the hairline that joins a dot to its content (`timeline.tsx:90-102`,
	 * placed by `getBranchStyle`, `timeline.tsx:395-416`). Drawn here as a pseudo element on the dot,
	 * which both inherits the dot's tone through `bg-current` and keeps the markup at three parts.
	 *
	 * Its length is the gutter `timelineItemVariants` opens with `pe-6` / `ps-6` (1.5rem) less the
	 * half dot and half rail the dot already covers, written as that arithmetic rather than a fixed
	 * width so it tracks whatever `--timeline-dot-size` a section sets.
	 */
	const dotBranch =
		"after:absolute after:top-1/2 after:h-px after:w-[calc(1.5rem-var(--timeline-dot-size)/2-var(--timeline-connector-thickness)/2)] after:-translate-y-1/2 after:bg-current after:content-['']";

	/**
	 * One event's card.
	 *
	 * NOT `Card.Root`. `app.css` sets `.dark [data-slot='card'] { --tw-ring-color: var(--card) }`,
	 * because the classic theme's `card-outline-color-dark` IS the card's own background — so a card drawn
	 * on a card is invisible in dark mode, and every section on this page is framed by a `Card`.
	 * The way out is the one `CarouselPage` already records for its slides: `bg-background` is the
	 * page showing through the card, and it contrasts against `--card` in BOTH modes.
	 *
	 * Upstream's own class is `bg-card border text-card-foreground shadow-sm rounded-md p-4`;
	 * only the ground has to move. `rounded-lg` is `card-border-radius`,
	 * and the shadow goes with the ground, since a recessed panel does not float.
	 */
	const eventCard = "flex flex-col gap-1 rounded-lg border bg-background p-4";

	/** Which way the branch points — at the content, which changes sides with the item's index. */
	const dotBranchTowardsStart = "after:end-full";
	const dotBranchTowardsEnd = "after:start-full";

	/**
	 * The two dot treatments, keyed by the tone an event carries. `text-*` is not ink on either of
	 * them: the dots hold no text, and it is there so `after:bg-current` colours the branch with one
	 * class instead of a second lookup table.
	 */
	const filledDot = {
		primary: "border-transparent bg-primary text-primary",
		success: "border-transparent bg-success text-success",
		destructive: "border-transparent bg-destructive text-destructive",
	} as const;

	const hollowDot = {
		primary: "border-primary text-primary",
		success: "border-success text-success",
		destructive: "border-destructive text-destructive",
	} as const;

	type EventTone = keyof typeof filledDot;

	type MigrationEvent = {
		id: string;
		dateTime: string;
		date: string;
		title: string;
		description: string;
		tone: EventTone;
	};

	const migrationEvents: MigrationEvent[] = [
		{
			id: "migration-plan-signed-off",
			dateTime: "2026-02-03",
			date: "February 3, 2026",
			title: "Migration plan signed off",
			description:
				"Product, platform and support agreed the cutover order and froze the public API for the quarter.",
			tone: "primary",
		},
		{
			id: "shadow-writes-enabled",
			dateTime: "2026-02-18",
			date: "February 18, 2026",
			title: "Shadow writes enabled",
			description:
				"A week of production writes was replayed against the new schema and diffed row by row.",
			tone: "primary",
		},
		{
			id: "reads-cut-over",
			dateTime: "2026-03-04",
			date: "March 4, 2026",
			title: "Reads cut over",
			description:
				"Ten percent of read traffic moved to the new cluster behind a flag, then eighty over two days.",
			tone: "success",
		},
		{
			id: "replication-lag-incident",
			dateTime: "2026-03-06",
			date: "March 6, 2026",
			title: "Replication lag incident",
			description:
				"The nightly import pushed lag past thirty seconds. The flag was rolled back and the import resharded.",
			tone: "destructive",
		},
		{
			id: "writes-migrated",
			dateTime: "2026-03-21",
			date: "March 21, 2026",
			title: "Writes migrated",
			description:
				"Every write now lands on the new cluster, and the old one was demoted to a read replica.",
			tone: "success",
		},
		{
			id: "legacy-cluster-retired",
			dateTime: "2026-04-02",
			date: "April 2, 2026",
			title: "Legacy cluster retired",
			description: "Final snapshot archived to cold storage and the original instances shut down.",
			tone: "primary",
		},
	];

	type IncidentEvent = {
		id: string;
		dateTime: string;
		time: string;
		title: string;
		tone: EventTone;
	};

	/** The fourth entry of `migrationEvents`, at the resolution the on-call engineer saw it. */
	const incidentEvents: IncidentEvent[] = [
		{
			id: "lag-alert-fired",
			dateTime: "2026-03-06T02:14",
			time: "02:14",
			title: "Lag alert fired",
			tone: "destructive",
		},
		{
			id: "on-call-acknowledged",
			dateTime: "2026-03-06T02:16",
			time: "02:16",
			title: "On-call paged and acknowledged",
			tone: "primary",
		},
		{
			id: "nightly-import-paused",
			dateTime: "2026-03-06T02:31",
			time: "02:31",
			title: "Nightly import paused",
			tone: "primary",
		},
		{
			id: "read-flag-rolled-back",
			dateTime: "2026-03-06T02:44",
			time: "02:44",
			title: "Read flag rolled back",
			tone: "primary",
		},
		{
			id: "replication-caught-up",
			dateTime: "2026-03-06T03:09",
			time: "03:09",
			title: "Replication caught up",
			tone: "success",
		},
		{
			id: "incident-closed",
			dateTime: "2026-03-06T04:20",
			time: "04:20",
			title: "Incident closed",
			tone: "success",
		},
	];

	const changelogEntries = [
		{
			id: "v3-2-0",
			version: "v3.2.0",
			dateTime: "2026-05-06",
			date: "May 6, 2026",
			title: "Column presets",
			description: "Table layouts save per workspace and travel with a share link.",
		},
		{
			id: "v3-3-0",
			version: "v3.3.0",
			dateTime: "2026-06-11",
			date: "June 11, 2026",
			title: "Bulk actions",
			description: "Selection survives pagination, and every bulk run reports a per-row result.",
		},
		{
			id: "v3-4-0",
			version: "v3.4.0",
			dateTime: "2026-07-23",
			date: "July 23, 2026",
			title: "Offline drafts",
			description: "Unsent edits are kept locally and reconciled the moment the tab reconnects.",
		},
	];

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLOListElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<ol>`.",
		},
		{
			prop: "dir",
			type: '"ltr" | "rtl"',
			default: "_resolved_",
			description:
				'Explicit text direction. Falls back to the nearest `<DirectionProvider>`, then an ancestor `[dir]`, then `"ltr"`.',
		},
		{
			prop: "orientation",
			type: '"vertical" | "horizontal"',
			default: '"vertical"',
			description: "The layout axis of the timeline.",
		},
		{
			prop: "variant",
			type: '"default" | "alternate"',
			default: '"default"',
			description: '`"alternate"` enables the zig-zag layout.',
		},
		{
			prop: "activeIndex",
			type: "number | undefined",
			default: "undefined",
			description:
				"Zero-based index of the active item. Items before it are `completed`, it is `active`, items after are `pending`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render onto your own element instead of the default `<ol>`.",
		},
	];

	const itemProps = [
		{
			prop: "ref",
			type: "HTMLLIElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered `<li>` — also the node registered with the collection.",
		},
		{
			prop: "id",
			type: "string | undefined",
			default: "$props.id()",
			description: "The item id, and its collection key.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description:
				"Render onto your own element. The payload includes a `register` function to keep this item in the collection.",
		},
	];

	const dotProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<div>`.",
		},
		{
			prop: "children",
			type: "Snippet | undefined",
			default: "—",
			description: "Custom dot content, e.g. an icon.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render onto your own element instead of the default `<div>`.",
		},
	];

	const connectorProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<div>`.",
		},
		{
			prop: "forceMount",
			type: "boolean",
			default: "false",
			description: "Keep the connector mounted even after the last item.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render onto your own element instead of the default `<div>`.",
		},
	];

	const contentProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<div>`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render onto your own element instead of the default `<div>`.",
		},
	];

	const headerProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<div>`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render onto your own element instead of the default `<div>`.",
		},
	];

	const titleProps = headerProps;
	const descriptionProps = headerProps;

	const timeProps = [
		{
			prop: "ref",
			type: "HTMLTimeElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<time>`.",
		},
		{
			prop: "dateTime",
			type: "string | undefined",
			default: "—",
			description:
				"Upstream-parity alias for the native `datetime` attribute. A native `datetime` prop wins over this alias.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render onto your own element instead of the default `<time>`.",
		},
	];
</script>

<DocPage title="Timeline">
	{#snippet subtitle()}
		A flexible timeline for chronological events, with vertical/horizontal orientations, an
		alternating variant, RTL support and completed/active/pending states.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<Timeline.Root {activeIndex} class="max-w-md">
					{#each projectItems as item (item.id)}
						<Timeline.Item id={item.id}>
							<Timeline.Dot />
							<Timeline.Connector />
							<Timeline.Content>
								<Timeline.Header>
									<Timeline.Time dateTime={item.dateTime}>{item.date}</Timeline.Time>
									<Timeline.Title>{item.title}</Timeline.Title>
								</Timeline.Header>
								<Timeline.Description>{item.description}</Timeline.Description>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
				<div class="mt-4 flex items-center gap-2">
					<span class="text-sm text-muted-foreground">activeIndex:</span>
					{#each projectItems as _, index (index)}
						<button
							type="button"
							class="rounded-md border px-2 py-1 text-xs"
							onclick={() => (activeIndex = index)}
						>
							{index}
						</button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Horizontal">
		<Card.Root>
			<Card.Content>
				<Timeline.Root orientation="horizontal" activeIndex={1}>
					{#each quarterItems as item (item.id)}
						<Timeline.Item id={item.id}>
							<Timeline.Dot />
							<Timeline.Connector />
							<Timeline.Content>
								<Timeline.Header>
									<Timeline.Title>{item.title}</Timeline.Title>
									<Timeline.Time dateTime={item.dateTime}>{item.date}</Timeline.Time>
								</Timeline.Header>
								<Timeline.Description>{item.description}</Timeline.Description>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="RTL">
		<Card.Root>
			<Card.Content>
				<div dir="rtl" class="max-w-md">
					<Timeline.Root dir="rtl" activeIndex={1}>
						{#each eventItems as item (item.id)}
							<Timeline.Item id={item.id}>
								<Timeline.Dot />
								<Timeline.Connector />
								<Timeline.Content>
									<Timeline.Header>
										<Timeline.Title>{item.title}</Timeline.Title>
										<Timeline.Time dateTime={item.dateTime}>{item.date}</Timeline.Time>
									</Timeline.Header>
									<Timeline.Description>{item.description}</Timeline.Description>
								</Timeline.Content>
							</Timeline.Item>
						{/each}
					</Timeline.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Alternate">
		<Card.Root>
			<Card.Content>
				<Timeline.Root variant="alternate" activeIndex={1} class="max-w-lg">
					{#each projectItems as item (item.id)}
						<Timeline.Item id={item.id}>
							<Timeline.Dot />
							<Timeline.Connector />
							<Timeline.Content>
								<Timeline.Header>
									<Timeline.Time dateTime={item.dateTime}>{item.date}</Timeline.Time>
									<Timeline.Title>{item.title}</Timeline.Title>
								</Timeline.Header>
								<Timeline.Description>{item.description}</Timeline.Description>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Horizontal Alternate">
		<Card.Root>
			<Card.Content>
				<Timeline.Root variant="alternate" orientation="horizontal" activeIndex={1}>
					{#each companyItems as item (item.id)}
						<Timeline.Item id={item.id}>
							<Timeline.Dot />
							<Timeline.Connector />
							<Timeline.Content>
								<Timeline.Header>
									<Timeline.Time dateTime={item.dateTime}>{item.date}</Timeline.Time>
									<Timeline.Title>{item.title}</Timeline.Title>
								</Timeline.Header>
								<Timeline.Description>{item.description}</Timeline.Description>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom Dot">
		<Card.Root>
			<Card.Content>
				<Timeline.Root activeIndex={1} class="max-w-md [--timeline-dot-size:2rem]">
					{#each projectItems as item (item.id)}
						<Timeline.Item id={item.id}>
							<Timeline.Dot>
								<span class="size-3.5 rounded-full bg-current"></span>
							</Timeline.Dot>
							<Timeline.Connector />
							<Timeline.Content>
								<Timeline.Header>
									<Timeline.Time dateTime={item.dateTime}>{item.date}</Timeline.Time>
									<Timeline.Title>{item.title}</Timeline.Title>
								</Timeline.Header>
								<Timeline.Description>{item.description}</Timeline.Description>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Timeline with roadmap">
		{#snippet blurb()}
			From <code>demo 2</code>. The date moves out of the content and into a gutter of its own from
			<code>sm</code> up, so the titles line up on a single left edge.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Upstream opens the gutter with `ms-32` on the item and pulls the date back with
					`-left-32` — reproduced here as `sm:ms-28` plus an absolutely positioned `Time`.
					`Timeline.Item` is already `relative`, so the date needs no extra positioning
					context. Below `sm` the absolute positioning is dropped and the date simply sits
					above the title, which is what the narrow layout wants anyway.
				-->
				<Timeline.Root activeIndex={1} class="max-w-md sm:ps-28">
					{#each roadmapItems as item (item.id)}
						<Timeline.Item id={item.id}>
							<Timeline.Dot />
							<Timeline.Connector />
							<Timeline.Content>
								<Timeline.Header>
									<Timeline.Time
										dateTime={item.dateTime}
										class="sm:absolute sm:-start-28 sm:top-0 sm:w-24 sm:text-end"
									>
										{item.date}
									</Timeline.Time>
									<Timeline.Title>{item.title}</Timeline.Title>
								</Timeline.Header>
								<Timeline.Description>{item.description}</Timeline.Description>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Timeline with order status">
		{#snippet blurb()}
			From <code>demo 3</code>. Every step the parcel has already passed fills its dot and stamps it
			with a check mark.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The dot grows to 1.5rem so a check mark fits inside it, which is exactly what
					`--timeline-dot-size` is for — no per-item margin arithmetic, and the connector
					follows the new radius on its own.

					Whether a step is done is read from `orderStatusActiveIndex` rather than from the
					dot's own `data-status`, because the check mark is content, not styling: it has to
					be absent from the DOM for a pending step, not merely hidden.
				-->
				<Timeline.Root
					activeIndex={orderStatusActiveIndex}
					class="max-w-md [--timeline-dot-size:1.5rem]"
				>
					{#each orderStatusItems as item, index (item.id)}
						<Timeline.Item id={item.id}>
							<Timeline.Dot
								class={index <= orderStatusActiveIndex
									? "border-primary bg-primary text-primary-foreground"
									: ""}
							>
								{#if index <= orderStatusActiveIndex}
									<CheckIcon class="size-3.5" />
								{/if}
							</Timeline.Dot>
							<Timeline.Connector />
							<Timeline.Content>
								<Timeline.Header>
									<Timeline.Time dateTime={item.dateTime}>{item.date}</Timeline.Time>
									<Timeline.Title>{item.title}</Timeline.Title>
								</Timeline.Header>
								<Timeline.Description>{item.description}</Timeline.Description>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Timeline with git activity">
		{#snippet blurb()}
			From <code>demo 4</code>. Each entry carries its own icon in the dot, and the relative time
			drops below the description.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Upstream tints the pending dots `bg-primary/10`; the subtle ground token says the
					same thing in the vocabulary this repository already uses everywhere else.
				-->
				<Timeline.Root
					activeIndex={gitActivityActiveIndex}
					class="max-w-md [--timeline-dot-size:1.5rem]"
				>
					{#each gitActivityItems as item, index (item.id)}
						{@const ItemIcon = item.icon}
						<Timeline.Item id={item.id}>
							<Timeline.Dot
								class={index <= gitActivityActiveIndex
									? "border-primary bg-primary text-primary-foreground"
									: "border-transparent bg-primary-subtle text-primary-subtle-foreground"}
							>
								<ItemIcon class="size-3.5" />
							</Timeline.Dot>
							<Timeline.Connector />
							<Timeline.Content>
								<Timeline.Header>
									<Timeline.Title>{item.title}</Timeline.Title>
								</Timeline.Header>
								<Timeline.Description>{item.description}</Timeline.Description>
								<Timeline.Time class="mt-2 block">{item.date}</Timeline.Time>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Timeline with pipeline steps">
		{#snippet blurb()}
			From <code>demo 6</code>. A CI run, where every step folds a collapsible
			<code>Frame</code> holding the log line and the engineer who owns it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The one demo on this page that composes rather than decorates: Frame + Collapsible +
					Spinner + Badge inside `Timeline.Content`. The running step keeps upstream's ring on
					the dot, drawn in `--primary` at 20% so it reads as a halo rather than a second
					border.

					Badge here has a single size, so upstream's `size="sm"` drops; its `success-light` /
					`info-light` / `warning-light` appearances become the house `-subtle` family.
				-->
				<Timeline.Root activeIndex={2} class="max-w-lg [--timeline-dot-size:1.5rem]">
					{#each pipelineSteps as step, index (step.id)}
						<Timeline.Item id={step.id} class="pb-10 last:pb-0">
							<Timeline.Dot
								class={step.status === "completed"
									? "border-primary bg-primary text-primary-foreground"
									: step.status === "active"
										? "border-primary text-primary ring-2 ring-primary/20"
										: "border-transparent bg-muted text-muted-foreground"}
							>
								{#if step.status === "completed"}
									<CheckIcon class="size-3.5" />
								{:else if step.status === "active"}
									<Spinner class="size-3.5" />
								{:else}
									<CircleIcon class="size-3.5" />
								{/if}
							</Timeline.Dot>
							<Timeline.Connector />
							<Timeline.Content class="flex flex-col gap-2">
								<Timeline.Header class="flex-row items-center gap-2">
									<Timeline.Title class="text-sm">{step.title}</Timeline.Title>
									<Badge
										variant={step.status === "completed"
											? "success-subtle"
											: step.status === "active"
												? "info-subtle"
												: "warning-subtle"}
									>
										{step.duration}
									</Badge>
								</Timeline.Header>
								<Frame.Root stacked dense spacing="sm">
									<Collapsible.Root bind:open={pipelineOpen[index]} class="group/collapsible">
										<Collapsible.Trigger class="flex w-full">
											<Frame.Header class="flex grow flex-row items-center justify-between gap-2">
												<span class="flex items-center gap-2">
													<Avatar.Root class="size-5">
														<Avatar.Fallback class="text-[10px]">
															{getInitials(step.user)}
														</Avatar.Fallback>
													</Avatar.Root>
													<span class="text-xs font-medium text-muted-foreground">{step.user}</span>
												</span>
												<ChevronRightIcon
													class="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
												/>
											</Frame.Header>
										</Collapsible.Trigger>
										<Collapsible.Content>
											<Frame.Panel>
												<p class="text-sm leading-relaxed text-muted-foreground">
													{step.description}
												</p>
											</Frame.Panel>
										</Collapsible.Content>
									</Collapsible.Root>
								</Frame.Root>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Timeline with roadmap items">
		{#snippet blurb()}
			From <code>demo 7</code>. A dense variant: pin-sized dots, an uppercase date and a single line
			of copy per entry.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Upstream gives each entry its own palette colour — emerald, violet, fuchsia, blue,
					red — which this repository does not do. The dot's own status carries the same
					information instead: `--primary` for a phase already behind us, muted for the rest.
				-->
				<Timeline.Root activeIndex={2} class="max-w-xs [--timeline-dot-size:0.5rem]">
					{#each roadmapPhases as phase (phase.id)}
						<Timeline.Item id={phase.id} class="gap-2.5 pb-5 last:pb-0">
							<Timeline.Dot
								class="mt-1.5 border-none bg-primary data-[status=pending]:bg-muted-foreground/40"
							/>
							<Timeline.Connector />
							<Timeline.Content class="flex flex-col gap-1">
								<Timeline.Time
									dateTime={phase.dateTime}
									class="text-[10px] font-semibold text-muted-foreground/60 uppercase"
								>
									{phase.date}
								</Timeline.Time>
								<p class="text-sm font-medium">
									<span class="text-muted-foreground">{phase.state}</span>
									{phase.label}
								</p>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Deployment log timeline">
		{#snippet blurb()}
			From <code>demo 10</code>. Every entry is finished, so the outcome — not the progress — is
			what the dot has to say.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`bg-emerald-500 text-white` upstream becomes `--success`, and the failed run keeps
					`--destructive` (the light spelling of the destructive badge).

					The connector is pinned to `bg-border`: every item here is completed, and the
					component would otherwise paint the whole rail `--primary`, which would read as a
					progress bar for a log that has no progress left to show.
				-->
				<Timeline.Root activeIndex={3} class="max-w-sm [--timeline-dot-size:1.5rem]">
					{#each deployments as deploy (deploy.id)}
						<Timeline.Item id={deploy.id}>
							<Timeline.Dot
								class={deploy.status === "success"
									? "border-transparent bg-success text-success-foreground"
									: "border-transparent bg-destructive text-destructive-foreground"}
							>
								{#if deploy.status === "success"}
									<CheckIcon class="size-3.5" />
								{:else}
									<XIcon class="size-3.5" />
								{/if}
							</Timeline.Dot>
							<Timeline.Connector class="bg-border" />
							<Timeline.Content>
								<Timeline.Header class="flex-row items-center gap-2">
									<Timeline.Title class="text-sm">{deploy.title}</Timeline.Title>
									<Badge
										variant={deploy.status === "success" ? "success-subtle" : "destructive-subtle"}
									>
										{deploy.status}
									</Badge>
								</Timeline.Header>
								<div class="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
									<span class="font-mono">{deploy.commit}</span>
									<span>&middot;</span>
									<span>{deploy.branch}</span>
									<span>&middot;</span>
									<span>{deploy.duration}</span>
								</div>
								<Timeline.Time dateTime={deploy.dateTime} class="mt-1 block">
									{deploy.date}
								</Timeline.Time>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Activity feed timeline with user avatars">
		{#snippet blurb()}
			From <code>demo 11</code>. The dot is replaced outright by the avatar of whoever caused the
			entry.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The closest this page gets to the classic theme's own activity lists — and the demonstration
					that the dot is a slot, not a shape: sized to 2rem through `--timeline-dot-size`,
					stripped of its border, and filled with an Avatar. Initials rather than the stock-photo
					portraits upstream loads, since this repository ships and fetches no images.
				-->
				<Timeline.Root activeIndex={4} class="max-w-md [--timeline-dot-size:2rem]">
					{#each activities as activity (activity.id)}
						<Timeline.Item id={activity.id}>
							<Timeline.Dot class="border-none bg-transparent">
								<Avatar.Root class="size-8">
									<Avatar.Fallback class="text-[10px]">
										{getInitials(activity.user)}
									</Avatar.Fallback>
								</Avatar.Root>
							</Timeline.Dot>
							<Timeline.Connector class="bg-border" />
							<Timeline.Content>
								<p class="text-sm">
									<span class="font-medium">{activity.user}</span>
									<span class="text-muted-foreground">{activity.action}</span>
									<span class="font-medium">{activity.target}</span>
								</p>
								<Timeline.Time dateTime={activity.dateTime} class="mt-0.5 block">
									{activity.date}
								</Timeline.Time>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Compact horizontal milestone timeline">
		{#snippet blurb()}
			From <code>demo 12</code>. A release train laid out along the horizontal axis, with the
			shipped, current and planned versions each marked differently.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Three dot treatments rather than the two the rest of this page uses, because a
					release has three states and not two: shipped is `--success`, the current one is
					`--primary`, and anything still planned stays muted.
				-->
				<Timeline.Root
					orientation="horizontal"
					activeIndex={2}
					class="max-w-xl [--timeline-dot-size:1.5rem]"
				>
					{#each releases as release (release.id)}
						<Timeline.Item id={release.id}>
							<Timeline.Dot
								class={release.status === "released"
									? "border-transparent bg-success text-success-foreground"
									: release.status === "current"
										? "border-transparent bg-primary text-primary-foreground"
										: "border-transparent bg-muted text-muted-foreground"}
							>
								{#if release.status === "released"}
									<CheckIcon class="size-3.5" />
								{:else if release.status === "current"}
									<PlayIcon class="size-3" />
								{:else}
									<CircleIcon class="size-3" />
								{/if}
							</Timeline.Dot>
							<Timeline.Connector />
							<Timeline.Content>
								<Timeline.Header>
									<Timeline.Time dateTime={release.dateTime}>{release.date}</Timeline.Time>
									<Timeline.Title class="flex items-center gap-2">
										{release.version}
										{#if release.status === "current"}
											<Badge variant="primary-subtle">Current</Badge>
										{/if}
									</Timeline.Title>
								</Timeline.Header>
								<Timeline.Description class="text-xs">{release.title}</Timeline.Description>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Alternating cards">
		{#snippet blurb()}
			Every event is a dated card on its own side of a central rail, tied to it by a hairline
			branch.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`gap-0` is what makes the rail continuous. The alternate variant spaces its items with
					`gap-3`, and a flex gap is a hole no connector can reach across; the air between cards
					comes from each item's own `pb-12` instead, which its connector does cover.

					`top-6` then starts every connector at its own dot's centre — the dot's `mt-4` plus half
					of a 1rem dot — so the rail runs from the first dot to the last and stops there instead
					of ending short of one or overshooting into the other.

					No `activeIndex`: this is a record, not a progress bar. Nothing here is "current", so the
					rail stays `--border` and each dot carries its own tone.
				-->
				<Timeline.Root
					variant="alternate"
					class="mx-auto max-w-3xl gap-0 [--timeline-connector-thickness:0.25rem] [--timeline-dot-size:1rem]"
				>
					{#each migrationEvents as event, index (event.id)}
						<Timeline.Item id={event.id}>
							<Timeline.Dot
								class="mt-4 {filledDot[event.tone]} {dotBranch} {index % 2 === 0
									? dotBranchTowardsStart
									: dotBranchTowardsEnd}"
							/>
							<Timeline.Connector class="top-6" />
							<Timeline.Content>
								<div class={eventCard}>
									<Timeline.Time dateTime={event.dateTime}>{event.date}</Timeline.Time>
									<Timeline.Title>{event.title}</Timeline.Title>
									<Timeline.Description>{event.description}</Timeline.Description>
								</div>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Hollow markers">
		{#snippet blurb()}
			From <code>timeline-hollow-demo.tsx</code>. Upstream's <code>hollow</code> prop is this
			component's default state — <code>Timeline.Dot</code> is already a ring on the page ground — so
			only the tone and the branch are set here.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The same alternating skeleton with nothing in the content slot but the two lines, which
					is upstream's card-less shape. The dot's `mt-0.5` lands its centre on the connector's
					own `top-2`, so the rail needs no override this time.
				-->
				<Timeline.Root
					variant="alternate"
					class="mx-auto max-w-xl gap-0 [--timeline-dot-size:0.75rem]"
				>
					{#each incidentEvents as event, index (event.id)}
						<Timeline.Item id={event.id} class="pb-6">
							<Timeline.Dot
								class="mt-0.5 {hollowDot[event.tone]} {dotBranch} {index % 2 === 0
									? dotBranchTowardsStart
									: dotBranchTowardsEnd}"
							/>
							<Timeline.Connector />
							<Timeline.Content class="flex flex-col gap-0.5">
								<Timeline.Time dateTime={event.dateTime}>{event.time}</Timeline.Time>
								<Timeline.Title class="text-sm">{event.title}</Timeline.Title>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Cards on a single rail">
		{#snippet blurb()}
			From <code>timeline-not-alternating-demo.tsx</code>. Turning upstream's
			<code>alternating</code> switch off leaves this component's default variant, carrying the same card
			in its content slot.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`gap-0` again. The default variant already overhangs each connector by 0.5rem
					(`h-[calc(100%+0.5rem)]`), which is enough to close the join once the root's own gap is
					out of the way, so the rail needs nothing else here.
				-->
				<Timeline.Root activeIndex={changelogEntries.length - 1} class="max-w-md gap-0">
					{#each changelogEntries as entry (entry.id)}
						<Timeline.Item id={entry.id}>
							<Timeline.Dot />
							<Timeline.Connector />
							<Timeline.Content>
								<div class={eventCard}>
									<Timeline.Time dateTime={entry.dateTime}>{entry.date}</Timeline.Time>
									<Timeline.Title>{entry.version} &middot; {entry.title}</Timeline.Title>
									<Timeline.Description>{entry.description}</Timeline.Description>
								</div>
							</Timeline.Content>
						</Timeline.Item>
					{/each}
				</Timeline.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Timeline (Root)</h3>
			<p class="text-sm text-muted-foreground">
				The container that publishes <code>orientation</code>/<code>variant</code>/<code>dir</code>/
				<code>activeIndex</code> on context and owns the DOM-order item collection.
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
			<h3 class="text-base font-medium">Timeline.Item</h3>
			<p class="text-sm text-muted-foreground">
				A single chronological entry. Registers its element with the root so its live DOM-order
				index — and therefore its status — is derived.
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
			<h3 class="text-base font-medium">Timeline.Dot</h3>
			<p class="text-sm text-muted-foreground">The visual marker for a timeline item.</p>
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
							{#each dotProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Timeline.Connector</h3>
			<p class="text-sm text-muted-foreground">
				The line connecting an item to the next one. Renders nothing after the last item unless
				<code>forceMount</code>.
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
							{#each connectorProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Timeline.Content</h3>
			<p class="text-sm text-muted-foreground">Container for an item's header and description.</p>
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
			<h3 class="text-base font-medium">Timeline.Header</h3>
			<p class="text-sm text-muted-foreground">Container for the title and time of an item.</p>
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
							{#each headerProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Timeline.Title</h3>
			<p class="text-sm text-muted-foreground">The title/heading of an item.</p>
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
							{#each titleProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Timeline.Description</h3>
			<p class="text-sm text-muted-foreground">The description/body text of an item.</p>
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
							{#each descriptionProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Timeline.Time</h3>
			<p class="text-sm text-muted-foreground">
				A semantic <code>&lt;time&gt;</code> element for displaying dates.
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
							{#each timeProps as row (row.prop)}
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
	</DocSection>
</DocPage>
