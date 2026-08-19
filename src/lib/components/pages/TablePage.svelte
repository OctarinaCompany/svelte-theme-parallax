<script lang="ts">
	import CopyIcon from "@lucide/svelte/icons/copy";
	import FileSpreadsheetIcon from "@lucide/svelte/icons/file-spreadsheet";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import ImageIcon from "@lucide/svelte/icons/image";
	import MoreHorizontalIcon from "@lucide/svelte/icons/more-horizontal";
	import PackageIcon from "@lucide/svelte/icons/package";
	import PenToolIcon from "@lucide/svelte/icons/pen-tool";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import TrendingDownIcon from "@lucide/svelte/icons/trending-down";
	import TrendingUpIcon from "@lucide/svelte/icons/trending-up";

	import { SvelteSet } from "svelte/reactivity";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Status from "$lib/components/ui/status/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { getInitials } from "$lib/shared/get-initials.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Table component page, ported from the shadcn-svelte documentation
	 * (https://shadcn-svelte.com/docs/components/table) — which ships exactly one demo, the
	 * invoices table. The hero below reproduces it.
	 *
	 * NOTHING ON THIS PAGE RESTYLES THE TABLE. The classic theme's whole table signature — 1rem cell
	 * padding against shadcn's `p-2`, and a head row that is uppercase, 13px, weight 600,
	 * letter-spaced and filled with the PAGE ground so it reads as the page showing through
	 * the card — lives unlayered in `app.css` against `[data-slot='table-head']` /
	 * `[data-slot='table-cell']` (§10 of the theme notes). Every table below arrives already
	 * classic-theme-shaped, which is the point worth demonstrating: the page's only job is markup.
	 *
	 * THREE COMPONENTS SHARE THIS ANATOMY. This one is the bare `<table>`: eight thin wrappers
	 * over the native parts, no state, no dependency. The Data table adds TanStack furniture
	 * (sorting, filters, pagination) and the Data grid adds spreadsheet-style editing — and
	 * every cell either of them renders goes through these same `table-head`/`table-cell`
	 * slots, which is why all three read as one table family. The subtitle links the other two.
	 *
	 * The sections past the hero are not upstream's. Each shows one capability the primitive
	 * itself carries — the row's `data-[state=selected]` hook, the overflow container
	 * `Table.Root` always renders — or one classic table variant the primitive does not
	 * ship (stripes), stated at the call site.
	 */

	/** `en-US` because the upstream demo's copy is `$250.00`-shaped. */
	const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

	/** Round-thousand budgets: `$50,000` reads better than `$50,000.00` in a cell. */
	const usdWhole = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	});

	const shortDate = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	// --- Hero: upstream's invoices table -----------------------------------------------------

	type Invoice = {
		id: string;
		status: "Paid" | "Pending" | "Unpaid";
		method: string;
		amount: number;
	};

	/** The seven rows of the upstream demo, verbatim — ids, statuses, methods and amounts. */
	const invoices: Invoice[] = [
		{ id: "INV001", status: "Paid", method: "Credit Card", amount: 250 },
		{ id: "INV002", status: "Pending", method: "PayPal", amount: 150 },
		{ id: "INV003", status: "Unpaid", method: "Bank Transfer", amount: 350 },
		{ id: "INV004", status: "Paid", method: "Credit Card", amount: 450 },
		{ id: "INV005", status: "Paid", method: "PayPal", amount: 550 },
		{ id: "INV006", status: "Pending", method: "Bank Transfer", amount: 200 },
		{ id: "INV007", status: "Unpaid", method: "Credit Card", amount: 300 },
	];

	/**
	 * Computed, not copied: upstream hardcodes the footer at `$2,500.00`, but its seven rows
	 * sum to $2,250.00. Deriving the total from the rows keeps the footer honest and means a
	 * demo-data edit cannot quietly break it.
	 */
	const invoiceTotal = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

	// --- Row selection -----------------------------------------------------------------------

	type Member = {
		id: string;
		name: string;
		email: string;
		role: "Owner" | "Member" | "Viewer";
	};

	/** The five people the Mention page already introduced, so the gallery keeps one cast. */
	const members: Member[] = [
		{ id: "1", name: "Olivia Martin", email: "olivia@email.com", role: "Owner" },
		{ id: "2", name: "Isabella Nguyen", email: "isabella@email.com", role: "Member" },
		{ id: "3", name: "Emma Wilson", email: "emma@email.com", role: "Member" },
		{ id: "4", name: "Jackson Lee", email: "jackson@email.com", role: "Viewer" },
		{ id: "5", name: "William Kim", email: "will@email.com", role: "Member" },
	];

	/**
	 * A `SvelteSet` rather than `$state` over an array: membership toggles are the only
	 * operation, and in-place `add`/`delete` on a reactive set keeps them O(1) with no
	 * copy-on-write ceremony — the same choice `data-grid`'s selection state records.
	 * Seeded with one row so the selected surface is visible before anything is clicked.
	 */
	const selected = new SvelteSet<string>(["2"]);

	const allSelected = $derived(selected.size === members.length);
	const someSelected = $derived(selected.size > 0 && !allSelected);

	function toggleAll(checked: boolean) {
		if (checked) for (const member of members) selected.add(member.id);
		else selected.clear();
	}

	// --- Striped rows ------------------------------------------------------------------------

	type Project = {
		name: string;
		status: "Active" | "Paused" | "Inactive";
		budget: number;
		dueAt: Date;
	};

	/** The Data table page's Greek-letter projects, thinned to the columns a static table needs. */
	const projects: Project[] = [
		{ name: "Project Alpha", status: "Active", budget: 50000, dueAt: new Date(2024, 3, 30) },
		{ name: "Project Beta", status: "Inactive", budget: 75000, dueAt: new Date(2024, 5, 14) },
		{ name: "Project Gamma", status: "Active", budget: 25000, dueAt: new Date(2024, 4, 20) },
		{ name: "Project Delta", status: "Paused", budget: 100000, dueAt: new Date(2024, 8, 1) },
		{ name: "Project Epsilon", status: "Active", budget: 18000, dueAt: new Date(2024, 6, 11) },
		{ name: "Project Zeta", status: "Inactive", budget: 62000, dueAt: new Date(2024, 7, 8) },
	];

	/**
	 * The soft badge family for live states, per the house status vocabulary. `Inactive` takes
	 * `secondary` rather than `destructive-subtle` on purpose: it is the absence of a state,
	 * not an error, and painting it red would claim one.
	 */
	const projectStatusVariant: Record<Project["status"], BadgeVariant> = {
		Active: "success-subtle",
		Paused: "warning-subtle",
		Inactive: "secondary",
	};

	/**
	 * The classic framework stripes `tbody tr:nth-of-type(odd)`, so the FIRST body row is filled;
	 * Tailwind's `odd:` compiles to `:nth-child(odd)` and lands on the same rows. The stripe
	 * reuses `bg-muted/50` — the exact surface the row primitive already hovers with — for the
	 * same reason §10 of the theme notes declined to override the hover: one near-identical grey
	 * per job, not two.
	 */
	const stripe = "odd:bg-muted/50";

	/** The Row density section — three tiers over the same three rows, each labelled. */
	const densityTiers = [
		{ value: "sm", note: "40px rows, 13px body type" },
		{ value: "default", note: "56px, the uniform house row" },
		{ value: "lg", note: "76px, room for a second line" },
	] as const;

	// --- Horizontal overflow -----------------------------------------------------------------

	type Order = {
		id: string;
		customer: string;
		email: string;
		status: "Fulfilled" | "Processing" | "Refunded";
		method: string;
		placedAt: Date;
		items: number;
		amount: number;
	};

	/** Wide on purpose — eight `whitespace-nowrap` columns, so the container has to scroll. */
	const orders: Order[] = [
		{
			id: "ORD-0101",
			customer: "Olivia Martin",
			email: "olivia@email.com",
			status: "Fulfilled",
			method: "Credit Card",
			placedAt: new Date(2024, 0, 8),
			items: 3,
			amount: 316,
		},
		{
			id: "ORD-0102",
			customer: "Isabella Nguyen",
			email: "isabella@email.com",
			status: "Processing",
			method: "PayPal",
			placedAt: new Date(2024, 1, 12),
			items: 1,
			amount: 74.99,
		},
		{
			id: "ORD-0103",
			customer: "Emma Wilson",
			email: "emma@email.com",
			status: "Fulfilled",
			method: "Bank Transfer",
			placedAt: new Date(2024, 2, 3),
			items: 5,
			amount: 529.5,
		},
		{
			id: "ORD-0104",
			customer: "Jackson Lee",
			email: "jackson@email.com",
			status: "Refunded",
			method: "Credit Card",
			placedAt: new Date(2024, 2, 21),
			items: 2,
			amount: 189,
		},
		{
			id: "ORD-0105",
			customer: "William Kim",
			email: "will@email.com",
			status: "Fulfilled",
			method: "PayPal",
			placedAt: new Date(2024, 3, 2),
			items: 4,
			amount: 412.25,
		},
	];

	// --- The table pattern appendix ------------------------------------------------------------

	/**
	 * Everything below is the table demo set, in its documented
	 * order. Its first three examples are not here: demo 1 and demo 2 are the same
	 * invoices table the hero already renders, footer included, and `c-table-3` is a card holding
	 * a table of status pills, which the Striped rows section above already is.
	 *
	 * FIVE STANDING SUBSTITUTIONS apply to all of them, each a repository rule:
	 *
	 * 1. NO REMOTE ASSETS. Every upstream row loads a stock portrait; this repository makes no
	 *    network requests at runtime, so avatars keep only their initials fallback — the Card
	 *    page's precedent, for the same reason.
	 * 2. HOUSE STATUS VOCABULARY. Light badges become the `{state}-subtle` soft family,
	 *    and so do SOLID `success` / `info` / `warning` badges: subtle is the only status
	 *    colour Badge carries here (CONVENTIONS.md §3). Its raw `bg-green-500/10 text-green-700`
	 *    status pills go the same way, and `text-green-600` / `bg-amber-500` become `--success`
	 *    and `--warning`.
	 * 3. NO BADGE SIZES. A `size="xs" | "sm"` Badge axis is the ask; this one has a single
	 *    height, so the prop is dropped rather than faked with utility classes.
	 * 4. FRAME BECOMES CARD. Three examples want their table in a `Frame` / `FramePanel`;
	 *    this page has shown every table in a `Card` since the hero, and a second panel idiom
	 *    halfway down would read as a different component rather than a different example.
	 * 5. NO CELL PADDING AT THE CALL SITE. The last two examples tighten their cells with `py-2`.
	 *    The 1rem density rule in `app.css` is unlayered and beats any padding utility written
	 *    here (that is its documented behaviour, §10), so the class is dropped instead of shipped
	 *    inert — those tables arrive at the house density like every other one on the page.
	 */

	/** Scores are printed grouped (`12,840`) in `en-US`, like every other number on the page. */
	const grouped = new Intl.NumberFormat("en-US");

	// --- Actions column ---------------------------------------------------------

	const actionProducts = [
		{ id: "1", name: "Wireless Mouse", price: 29.99 },
		{ id: "2", name: "Mechanical Keyboard", price: 129.99 },
		{ id: "3", name: "USB-C Hub", price: 49.99 },
	];

	// --- Interactive cells ------------------------------------------------------

	/**
	 * Upstream's quantity inputs are uncontrolled (`defaultValue`), which has no Svelte
	 * equivalent — a `$state` row array is the honest translation, and it makes the typed value
	 * readable, which an uncontrolled input never was.
	 */
	const lineItems = $state([
		{ id: "1", name: "Item Alpha", quantity: 1, price: 10 },
		{ id: "2", name: "Item Beta", quantity: 2, price: 20 },
		{ id: "3", name: "Item Gamma", quantity: 1, price: 30 },
	]);

	// --- Team members -----------------------------------------------------------

	type TeamMember = {
		name: string;
		email: string;
		role: string;
		roleVariant: BadgeVariant;
		status: string;
		statusVariant: BadgeVariant;
	};

	/** `default` and `outline` survive verbatim; the `*-light` pairs become the subtle family. */
	const teamMembers: TeamMember[] = [
		{
			name: "Sarah Chen",
			email: "sarah@example.com",
			role: "Admin",
			roleVariant: "default",
			status: "Active",
			statusVariant: "success-subtle",
		},
		{
			name: "Marcus Johnson",
			email: "marcus@example.com",
			role: "Developer",
			roleVariant: "info-subtle",
			status: "Active",
			statusVariant: "success-subtle",
		},
		{
			name: "Emily Park",
			email: "emily@example.com",
			role: "Designer",
			roleVariant: "warning-subtle",
			status: "Away",
			statusVariant: "warning-subtle",
		},
		{
			name: "David Kim",
			email: "david@example.com",
			role: "Viewer",
			roleVariant: "outline",
			status: "Offline",
			statusVariant: "outline",
		},
	];

	// --- Customer orders --------------------------------------------------------

	type CustomerOrder = {
		id: string;
		customer: string;
		date: string;
		amount: number;
		status: string;
		statusVariant: BadgeVariant;
	};

	const customerOrders: CustomerOrder[] = [
		{
			id: "#3210",
			customer: "Olivia Martin",
			date: "Feb 1, 2025",
			amount: 1999,
			status: "Paid",
			statusVariant: "success-subtle",
		},
		{
			id: "#3209",
			customer: "Jackson Lee",
			date: "Jan 28, 2025",
			amount: 39,
			status: "Pending",
			statusVariant: "warning-subtle",
		},
		{
			id: "#3208",
			customer: "Isabella Nguyen",
			date: "Jan 25, 2025",
			amount: 299,
			status: "Paid",
			statusVariant: "success-subtle",
		},
		{
			id: "#3207",
			customer: "William Kim",
			date: "Jan 22, 2025",
			amount: 99,
			status: "Refunded",
			statusVariant: "destructive-subtle",
		},
		{
			id: "#3206",
			customer: "Sofia Davis",
			date: "Jan 18, 2025",
			amount: 2500,
			status: "Paid",
			statusVariant: "success-subtle",
		},
	];

	// --- Team projects ----------------------------------------------------------

	type TeamProject = {
		name: string;
		description: string;
		status: string;
		statusVariant: BadgeVariant;
		/** Initials rather than portrait URLs — the avatars are fallback-only here. */
		team: string[];
		extra: number;
		due: string;
	};

	const teamProjects: TeamProject[] = [
		{
			name: "Website Redesign",
			description: "Landing page and marketing site",
			status: "In Progress",
			statusVariant: "info-subtle",
			team: ["SC", "MJ", "EP"],
			extra: 2,
			due: "Mar 15",
		},
		{
			name: "Mobile App v2",
			description: "iOS and Android release",
			status: "Review",
			statusVariant: "warning-subtle",
			team: ["DK", "SD"],
			extra: 0,
			due: "Apr 1",
		},
		{
			name: "API Integration",
			description: "Third-party payment gateway",
			status: "Completed",
			statusVariant: "success-subtle",
			team: ["MJ"],
			extra: 0,
			due: "Feb 28",
		},
		{
			name: "Analytics Dashboard",
			description: "Real-time metrics and reporting",
			status: "Planning",
			statusVariant: "outline",
			team: ["SC", "DK", "EP"],
			extra: 4,
			due: "May 10",
		},
	];

	// --- Activity log -----------------------------------------------------------

	type ActivityEntry = {
		id: string;
		user: string;
		action: string;
		actionVariant: BadgeVariant;
		target: string;
		timestamp: string;
	};

	/** Upstream keys these rows by array index; an explicit id is the keyed-`{#each}` equivalent. */
	const activityLog: ActivityEntry[] = [
		{
			id: "deploy",
			user: "Sarah Chen",
			action: "Deployed",
			actionVariant: "success-subtle",
			target: "production",
			timestamp: "2 minutes ago",
		},
		{
			id: "merge",
			user: "Marcus Johnson",
			action: "Merged",
			actionVariant: "info-subtle",
			target: "feat/auth-flow",
			timestamp: "15 minutes ago",
		},
		{
			id: "comment",
			user: "Emily Park",
			action: "Commented",
			actionVariant: "outline",
			target: "PR #284",
			timestamp: "1 hour ago",
		},
		{
			id: "revert",
			user: "David Kim",
			action: "Reverted",
			actionVariant: "destructive",
			target: "hotfix/api-crash",
			timestamp: "3 hours ago",
		},
		{
			id: "create",
			user: "Sofia Davis",
			action: "Created",
			actionVariant: "secondary",
			target: "issue #512",
			timestamp: "5 hours ago",
		},
	];

	// --- Subscriptions ---------------------------------------------------------

	type Subscription = {
		service: string;
		plan: string;
		planVariant: BadgeVariant;
		billing: string;
		nextBilling: string;
		status: string;
		statusVariant: BadgeVariant;
	};

	const subscriptions: Subscription[] = [
		{
			service: "Vercel Pro",
			plan: "Pro",
			planVariant: "default",
			billing: "$20/mo",
			nextBilling: "Mar 1, 2025",
			status: "Active",
			statusVariant: "success-subtle",
		},
		{
			service: "GitHub Enterprise",
			plan: "Enterprise",
			planVariant: "info-subtle",
			billing: "$21/user/mo",
			nextBilling: "Mar 15, 2025",
			status: "Active",
			statusVariant: "success-subtle",
		},
		{
			service: "Figma Organization",
			plan: "Organization",
			planVariant: "warning-subtle",
			billing: "$45/editor/mo",
			nextBilling: "Apr 1, 2025",
			status: "Active",
			statusVariant: "success-subtle",
		},
		{
			service: "Slack Business+",
			plan: "Business+",
			planVariant: "secondary",
			billing: "$12.50/user/mo",
			nextBilling: "—",
			status: "Cancelled",
			statusVariant: "destructive-subtle",
		},
		{
			service: "Linear Standard",
			plan: "Standard",
			planVariant: "outline",
			billing: "$8/user/mo",
			nextBilling: "Mar 20, 2025",
			status: "Trial",
			statusVariant: "info-subtle",
		},
	];

	// --- Product inventory -----------------------------------------------------

	type InventoryItem = {
		name: string;
		sku: string;
		category: string;
		price: number;
		stock: number;
		stockStatus: string;
		stockVariant: BadgeVariant;
	};

	const inventory: InventoryItem[] = [
		{
			name: "Ergonomic Desk Chair",
			sku: "FRN-001",
			category: "Furniture",
			price: 549,
			stock: 124,
			stockStatus: "In Stock",
			stockVariant: "success-subtle",
		},
		{
			name: "Wireless Noise-Canceling Headphones",
			sku: "AUD-042",
			category: "Audio",
			price: 349.99,
			stock: 8,
			stockStatus: "Low Stock",
			stockVariant: "warning-subtle",
		},
		{
			name: '4K Ultra HD Monitor 32"',
			sku: "DSP-019",
			category: "Displays",
			price: 799,
			stock: 0,
			stockStatus: "Out of Stock",
			stockVariant: "destructive-subtle",
		},
		{
			name: "Mechanical Keyboard RGB",
			sku: "INP-087",
			category: "Input",
			price: 179.99,
			stock: 56,
			stockStatus: "In Stock",
			stockVariant: "success-subtle",
		},
		{
			name: "USB-C Docking Station",
			sku: "ACC-033",
			category: "Accessories",
			price: 249,
			stock: 3,
			stockStatus: "Low Stock",
			stockVariant: "warning-subtle",
		},
	];

	// --- API keys --------------------------------------------------------------

	type ApiKey = {
		name: string;
		token: string;
		permissions: string[];
		lastUsed: string;
		status: string;
		statusVariant: BadgeVariant;
	};

	const apiKeys: ApiKey[] = [
		{
			name: "Production API",
			token: "sk_live_••••••••4f3a",
			permissions: ["read", "write"],
			lastUsed: "2 minutes ago",
			status: "Active",
			statusVariant: "success-subtle",
		},
		{
			name: "Staging API",
			token: "sk_test_••••••••8b2c",
			permissions: ["read", "write", "admin"],
			lastUsed: "1 hour ago",
			status: "Active",
			statusVariant: "success-subtle",
		},
		{
			name: "CI/CD Pipeline",
			token: "sk_ci_••••••••1d9e",
			permissions: ["read"],
			lastUsed: "3 days ago",
			status: "Active",
			statusVariant: "success-subtle",
		},
		{
			name: "Legacy Integration",
			token: "sk_old_••••••••7a5f",
			permissions: ["read", "write"],
			lastUsed: "30 days ago",
			status: "Expired",
			statusVariant: "destructive-subtle",
		},
	];

	/** A scope is not a status, so the three keep neutral and informational badges only. */
	const apiKeyPermissionVariant: Record<string, BadgeVariant> = {
		read: "outline",
		write: "info-subtle",
		admin: "warning-subtle",
	};

	// --- File manager ----------------------------------------------------------

	type ManagedFile = {
		name: string;
		/** The row's leading glyph. Lucide icons are components, so the row carries one. */
		icon: typeof FileTextIcon;
		size: string;
		owner: string;
		sharing: string;
		sharingVariant: BadgeVariant;
		modified: string;
	};

	const managedFiles: ManagedFile[] = [
		{
			name: "Q4 Financial Report.pdf",
			icon: FileTextIcon,
			size: "2.4 MB",
			owner: "Sarah Chen",
			sharing: "Team",
			sharingVariant: "info-subtle",
			modified: "2 hours ago",
		},
		{
			name: "Brand Guidelines",
			icon: FolderIcon,
			size: "—",
			owner: "Emily Park",
			sharing: "Public",
			sharingVariant: "success-subtle",
			modified: "1 day ago",
		},
		{
			name: "Product Roadmap 2025.xlsx",
			icon: FileSpreadsheetIcon,
			size: "856 KB",
			owner: "Marcus Johnson",
			sharing: "Private",
			sharingVariant: "outline",
			modified: "3 days ago",
		},
		{
			name: "App Screenshots",
			icon: ImageIcon,
			size: "48.2 MB",
			owner: "David Kim",
			sharing: "Team",
			sharingVariant: "info-subtle",
			modified: "1 week ago",
		},
		{
			name: "Architecture Diagram.fig",
			icon: PenToolIcon,
			size: "12.8 MB",
			owner: "Sofia Davis",
			sharing: "Restricted",
			sharingVariant: "warning-subtle",
			modified: "2 weeks ago",
		},
	];

	// --- Issues ----------------------------------------------------------------

	type Issue = {
		id: string;
		title: string;
		label: string;
		assignee: string;
		status: string;
		statusVariant: BadgeVariant;
	};

	/**
	 * Upstream's rows also carry `priority`, `priorityVariant` and a `priorityIcon`, and its
	 * table renders none of the three — the label badge is hardcoded to `outline` there too. The
	 * port follows what the example DRAWS rather than what its data declares, so the fields are
	 * gone rather than dead.
	 */
	const issues: Issue[] = [
		{
			id: "ISS-421",
			title: "Login page returns 500 on mobile",
			label: "Bug",
			assignee: "Sarah Chen",
			status: "Open",
			statusVariant: "info-subtle",
		},
		{
			id: "ISS-420",
			title: "Add dark mode support",
			label: "Feature",
			assignee: "Marcus Johnson",
			status: "In Progress",
			statusVariant: "warning-subtle",
		},
		{
			id: "ISS-419",
			title: "Update user onboarding flow",
			label: "Improvement",
			assignee: "Emily Park",
			status: "In Review",
			statusVariant: "info-subtle",
		},
		{
			id: "ISS-418",
			title: "Refactor API rate limiter module",
			label: "Tech Debt",
			assignee: "David Kim",
			status: "Closed",
			statusVariant: "success-subtle",
		},
	];

	// --- Leaderboard -----------------------------------------------------------

	type Leader = {
		rank: number;
		name: string;
		handle: string;
		score: number;
		change: string;
		changeUp: boolean;
		level: string;
		levelVariant: BadgeVariant;
	};

	const leaderboard: Leader[] = [
		{
			rank: 1,
			name: "Sarah Chen",
			handle: "@sarahchen",
			score: 12840,
			change: "+320",
			changeUp: true,
			level: "Diamond",
			levelVariant: "info-subtle",
		},
		{
			rank: 2,
			name: "Marcus Johnson",
			handle: "@marcusj",
			score: 11250,
			change: "+180",
			changeUp: true,
			level: "Platinum",
			levelVariant: "default",
		},
		{
			rank: 3,
			name: "Emily Park",
			handle: "@emilyp",
			score: 10890,
			change: "-45",
			changeUp: false,
			level: "Platinum",
			levelVariant: "default",
		},
		{
			rank: 4,
			name: "David Kim",
			handle: "@davidk",
			score: 9420,
			change: "+520",
			changeUp: true,
			level: "Gold",
			levelVariant: "warning-subtle",
		},
		{
			rank: 5,
			name: "Sofia Davis",
			handle: "@sofiad",
			score: 8750,
			change: "+90",
			changeUp: true,
			level: "Gold",
			levelVariant: "warning-subtle",
		},
	];

	// --- Vertical tables (demo 16, demo 17) ---------------------------------------

	/**
	 * A header column instead of a header row: the label cell takes the muted ground, and the
	 * rule between the two columns is stated per row because a `<td>` carries no border by
	 * default and Tailwind v4's default border colour is `currentColor`, not `--border`.
	 * `hover:bg-transparent` cancels the row primitive's hover — nothing here is a record to
	 * pick out of a list.
	 */
	const verticalRow = "hover:bg-transparent [&>*]:border-border [&>*:not(:last-child)]:border-r";

	/** The label column, wide enough for `Instance Type` on one line. */
	const verticalLabel = "w-40 bg-muted/50 font-medium";
</script>

<DocPage title="Table">
	{#snippet subtitle()}
		A responsive table component. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/table"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options. This is the bare markup — you write the rows, and nothing sorts, filters
		or pages them. Reach for the
		<a class="text-primary underline underline-offset-3" href="#/components/data-table"
			>Data table</a
		>
		when they need a filter toolbar and pagination, which it builds out of these same cells, and for the
		<a class="text-primary underline underline-offset-3" href="#/components/data-grid">Data grid</a>
		when cells are edited in place, which it draws as a virtualized grid of its own instead.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				Upstream's one demo, part for part: caption, a 100px first column, a right-aligned
				amount column, and a footer whose Total cell spans the other three. The classic
				density and head treatment need nothing here — `app.css` supplies both by data-slot.
			-->
			<Table.Root>
				<Table.Caption>A list of your recent invoices.</Table.Caption>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[100px]">Invoice</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Method</Table.Head>
						<Table.Head class="text-right">Amount</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each invoices as invoice (invoice.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{invoice.id}</Table.Cell>
							<Table.Cell>{invoice.status}</Table.Cell>
							<Table.Cell>{invoice.method}</Table.Cell>
							<Table.Cell class="text-right">{usd.format(invoice.amount)}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
				<Table.Footer>
					<Table.Row>
						<Table.Cell colspan={3}>Total</Table.Cell>
						<Table.Cell class="text-right">{usd.format(invoiceTotal)}</Table.Cell>
					</Table.Row>
				</Table.Footer>
			</Table.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Row selection">
		{#snippet blurb()}
			The row primitive ships a
			<code class="text-[87.5%] text-primary">data-[state=selected]:bg-muted</code> hook and nothing
			to drive it — selection state belongs to the caller. Here a checkbox column feeds it; the
			checkbox cells keep shadcn's narrow
			<code class="text-[87.5%] text-primary">p-2</code>, because the global 1rem density rule
			excludes them on purpose.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Table.Root>
					<!--
						First child because HTML says so — a `<caption>` anywhere else in the table is
						invalid markup; `caption-bottom` on the root is what PAINTS it below the rows.
						The count is live, and the copy is the Data table pagination's, kept so the two
						components speak alike.
					-->
					<Table.Caption>{selected.size} of {members.length} rows selected.</Table.Caption>
					<Table.Header>
						<Table.Row>
							<Table.Head>
								<Checkbox
									aria-label="Select all rows"
									checked={allSelected}
									indeterminate={someSelected}
									onCheckedChange={toggleAll}
								/>
							</Table.Head>
							<Table.Head>Name</Table.Head>
							<Table.Head>Email</Table.Head>
							<Table.Head>Role</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each members as member (member.id)}
							<!--
								`undefined` rather than `data-state="unselected"`: the primitive styles
								only the `selected` value, and an absent attribute is the state the bare
								row renders with, so the two cannot drift apart.
							-->
							<Table.Row data-state={selected.has(member.id) ? "selected" : undefined}>
								<Table.Cell>
									<Checkbox
										aria-label={`Select ${member.name}`}
										checked={selected.has(member.id)}
										onCheckedChange={(checked) => {
											if (checked) selected.add(member.id);
											else selected.delete(member.id);
										}}
									/>
								</Table.Cell>
								<Table.Cell class="font-medium">{member.name}</Table.Cell>
								<Table.Cell>{member.email}</Table.Cell>
								<Table.Cell>{member.role}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Striped rows">
		{#snippet blurb()}
			the classic <code class="text-[87.5%] text-primary">.table-striped</code>, which neither the
			primitive nor the global table rules carry — the stripe is stated on the rows at the call
			site, on the same
			<code class="text-[87.5%] text-primary">bg-muted/50</code> surface the hover state already uses.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Project</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="text-right">Budget</Table.Head>
							<Table.Head>Due date</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each projects as project (project.name)}
							<Table.Row class={stripe}>
								<Table.Cell class="font-medium">{project.name}</Table.Cell>
								<Table.Cell>
									<Badge variant={projectStatusVariant[project.status]}>
										{project.status}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-right">{usdWhole.format(project.budget)}</Table.Cell>
								<Table.Cell>{shortDate.format(project.dueAt)}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Row density">
		{#snippet blurb()}
			This theme's extension rather than a port: the classic theme's
			<code class="text-[87.5%] text-primary">.table-sm</code> keeps the same cell padding and only
			drops type.
			<code class="text-[87.5%] text-primary">Table.Root</code> takes
			<code class="text-[87.5%] text-primary">density</code> —
			<code class="text-[87.5%] text-primary">sm</code>
			is 40px rows carrying the 13px <code class="text-[87.5%] text-primary">.table-sm</code> body
			type,
			<code class="text-[87.5%] text-primary">default</code> the uniform 56px every table already
			renders, and <code class="text-[87.5%] text-primary">lg</code> 76px for cells that stack two
			lines. The head follows the body down on <code class="text-[87.5%] text-primary">sm</code> and never
			grows past 56.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				{#each densityTiers as tier (tier.value)}
					<div class="flex flex-col gap-2">
						<h3 class="text-base font-medium">
							<code class="text-[87.5%] text-primary">density="{tier.value}"</code>
							<span class="text-sm font-normal text-muted-foreground">— {tier.note}</span>
						</h3>
						<div class="overflow-hidden rounded-md border">
							<Table.Root density={tier.value}>
								<Table.Header>
									<Table.Row>
										<Table.Head>Project</Table.Head>
										<Table.Head>Status</Table.Head>
										<Table.Head class="text-right">Budget</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each projects.slice(0, 3) as project (project.name)}
										<Table.Row>
											<Table.Cell class="font-medium">{project.name}</Table.Cell>
											<Table.Cell>
												<Badge variant={projectStatusVariant[project.status]}>
													{project.status}
												</Badge>
											</Table.Cell>
											<Table.Cell class="text-right">{usdWhole.format(project.budget)}</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Horizontal overflow">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">Table.Root</code> always wraps the
			<code class="text-[87.5%] text-primary">&lt;table&gt;</code> in an
			<code class="text-[87.5%] text-primary">overflow-x-auto</code> container, and every cell is
			<code class="text-[87.5%] text-primary">whitespace-nowrap</code> — so a table wider than its card
			scrolls inside it instead of breaking the page. Narrow the window to see it engage.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Order</Table.Head>
							<Table.Head>Customer</Table.Head>
							<Table.Head>Email</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Method</Table.Head>
							<Table.Head>Placed</Table.Head>
							<Table.Head class="text-right">Items</Table.Head>
							<Table.Head class="text-right">Amount</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each orders as order (order.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{order.id}</Table.Cell>
								<Table.Cell>{order.customer}</Table.Cell>
								<Table.Cell>{order.email}</Table.Cell>
								<Table.Cell>{order.status}</Table.Cell>
								<Table.Cell>{order.method}</Table.Cell>
								<Table.Cell>{shortDate.format(order.placedAt)}</Table.Cell>
								<Table.Cell class="text-right">{order.items}</Table.Cell>
								<Table.Cell class="text-right">{usd.format(order.amount)}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		The sections from here down are the table demo set, in its documented order. The script
		block above records the five substitutions that apply to all of them; only what is specific
		to one example is restated at its call site.
	-->

	<DocSection title="Table card with actions column">
		{#snippet blurb()}
			The trailing menu column. The destructive item takes the menu's own
			<code class="text-[87.5%] text-primary">variant="destructive"</code> rather than a red class, so
			it also gets the destructive focus ground.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 4. Upstream sizes the trigger with `size="icon" class="size-8"`;
					`icon-sm` IS that size, expressed through the ramp instead of overridden.
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Product</Table.Head>
							<Table.Head>Price</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each actionProducts as product (product.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{product.name}</Table.Cell>
								<Table.Cell>{usd.format(product.price)}</Table.Cell>
								<Table.Cell class="text-right">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													variant="ghost"
													size="icon-sm"
													aria-label={`Open ${product.name} menu`}
												>
													<MoreHorizontalIcon />
												</Button>
											{/snippet}
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item>Edit</DropdownMenu.Item>
											<DropdownMenu.Item>Duplicate</DropdownMenu.Item>
											<DropdownMenu.Separator />
											<DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Table with interactive elements">
		{#snippet blurb()}
			A cell is an ordinary layout box: a control dropped into one keeps working, and the row height
			follows it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 5. The quantity is read back through `valueAsNumber` rather than
					`bind:value`: `Input` types its value as the DOM attribute union, and a number
					input's empty state is NaN, which `|| 0` folds back to a usable quantity.
					`h-8` is the ramp's `sm` height — `Input` has no size prop to say it with.
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Item</Table.Head>
							<Table.Head>Quantity</Table.Head>
							<Table.Head class="text-right">Price</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each lineItems as item (item.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{item.name}</Table.Cell>
								<Table.Cell>
									<Input
										type="number"
										min="0"
										class="h-8 w-20"
										aria-label={`Quantity of ${item.name}`}
										value={item.quantity}
										oninput={(event) => (item.quantity = event.currentTarget.valueAsNumber || 0)}
									/>
								</Table.Cell>
								<Table.Cell class="text-right">{usd.format(item.price)}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Team members table with avatars, roles, and status">
		<Card.Root>
			<Card.Content>
				<!--
					demo 6. The identity cell is the pattern the next five examples repeat:
					an avatar beside a two-line stack, name over a muted second line.
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Member</Table.Head>
							<Table.Head>Role</Table.Head>
							<Table.Head>Status</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each teamMembers as member (member.email)}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<Avatar.Root size="sm">
											<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
										</Avatar.Root>
										<div class="flex flex-col">
											<span class="font-medium">{member.name}</span>
											<span class="text-xs text-muted-foreground">{member.email}</span>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={member.roleVariant}>{member.role}</Badge>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={member.statusVariant}>{member.status}</Badge>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Orders table with customer info and payment status">
		<Card.Root>
			<Card.Content>
				<!--
					demo 7. The order id is monospaced so the `#32xx` run aligns down the
					column, and the customer's second line carries the date rather than the email —
					the date has no column of its own here.
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Order</Table.Head>
							<Table.Head>Customer</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="text-right">Amount</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each customerOrders as order (order.id)}
							<Table.Row>
								<Table.Cell class="font-mono">{order.id}</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<Avatar.Root size="sm">
											<Avatar.Fallback>{getInitials(order.customer)}</Avatar.Fallback>
										</Avatar.Root>
										<div class="flex flex-col">
											<span class="font-medium">{order.customer}</span>
											<span class="text-xs text-muted-foreground">{order.date}</span>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={order.statusVariant}>{order.status}</Badge>
								</Table.Cell>
								<Table.Cell class="text-right font-medium">{usd.format(order.amount)}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Projects table with team avatars and status">
		<Card.Root>
			<Card.Content>
				<!--
					demo 8. A whole avatar group fits in a cell. The group's ring is the
					ground it overlaps, which inside a card is `--card`, not `--background` — the
					Avatar page's `ring-card` precedent, and the reason the count chip restates it.
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Project</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Team</Table.Head>
							<Table.Head class="text-right">Due</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each teamProjects as project (project.name)}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<div
											class="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground"
										>
											<FolderIcon class="size-4" aria-hidden="true" />
										</div>
										<div class="flex flex-col">
											<span class="font-medium">{project.name}</span>
											<span class="text-xs text-muted-foreground">{project.description}</span>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={project.statusVariant}>{project.status}</Badge>
								</Table.Cell>
								<Table.Cell>
									<Avatar.Group class="*:data-[slot=avatar]:ring-card">
										{#each project.team as initials (initials)}
											<Avatar.Root size="sm">
												<Avatar.Fallback>{initials}</Avatar.Fallback>
											</Avatar.Root>
										{/each}
										{#if project.extra > 0}
											<Avatar.GroupCount class="text-xs ring-card">
												+{project.extra}
											</Avatar.GroupCount>
										{/if}
									</Avatar.Group>
								</Table.Cell>
								<Table.Cell class="text-right text-muted-foreground">{project.due}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Activity log table with user avatars and timestamps">
		<Card.Root>
			<Card.Content>
				<!--
					demo 9. The verb is the badge and the object is monospaced, so a branch
					name and an issue number read as the machine strings they are.
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>User</Table.Head>
							<Table.Head>Action</Table.Head>
							<Table.Head>Target</Table.Head>
							<Table.Head class="text-right">Time</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each activityLog as activity (activity.id)}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<Avatar.Root size="sm">
											<Avatar.Fallback>{getInitials(activity.user)}</Avatar.Fallback>
										</Avatar.Root>
										<span class="font-medium">{activity.user}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={activity.actionVariant}>{activity.action}</Badge>
								</Table.Cell>
								<Table.Cell class="font-mono">{activity.target}</Table.Cell>
								<Table.Cell class="text-right text-muted-foreground">
									{activity.timestamp}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Subscriptions table with plan badges and billing info">
		<Card.Root>
			<Card.Content>
				<!--
					demo 10. Upstream's row action is `size="sm" class="h-7"`, i.e. a size
					below the ramp; `sm` (h-8) is the nearest step the theme actually draws.
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Service</Table.Head>
							<Table.Head>Plan</Table.Head>
							<Table.Head>Billing</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each subscriptions as subscription (subscription.service)}
							<Table.Row>
								<Table.Cell>
									<div class="flex flex-col">
										<span class="font-medium">{subscription.service}</span>
										<span class="text-xs text-muted-foreground">
											Next: {subscription.nextBilling}
										</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={subscription.planVariant}>{subscription.plan}</Badge>
								</Table.Cell>
								<Table.Cell>{subscription.billing}</Table.Cell>
								<Table.Cell>
									<Badge variant={subscription.statusVariant}>{subscription.status}</Badge>
								</Table.Cell>
								<Table.Cell class="text-right">
									<Button variant="ghost" size="sm">
										<SettingsIcon data-icon="inline-start" />
										Manage
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Product inventory table with stock badges and prices">
		<Card.Root>
			<Card.Content>
				<!--
					demo 11. The stock cell pairs the qualitative badge with the count in
					parentheses: `Low Stock` says what to do, `(3)` says how urgently.
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Product</Table.Head>
							<Table.Head>Category</Table.Head>
							<Table.Head>Stock</Table.Head>
							<Table.Head class="text-right">Price</Table.Head>
							<Table.Head class="w-10"><span class="sr-only">Actions</span></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each inventory as product (product.sku)}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<div
											class="flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground"
										>
											<PackageIcon class="size-4" aria-hidden="true" />
										</div>
										<div class="flex flex-col">
											<span class="font-medium">{product.name}</span>
											<span class="font-mono text-xs text-muted-foreground">{product.sku}</span>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">{product.category}</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Badge variant={product.stockVariant}>{product.stockStatus}</Badge>
										<span class="text-xs text-muted-foreground">({product.stock})</span>
									</div>
								</Table.Cell>
								<Table.Cell class="text-right font-medium">{usd.format(product.price)}</Table.Cell>
								<Table.Cell>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											{#snippet child({ props })}
												<Button
													{...props}
													variant="ghost"
													size="icon-sm"
													aria-label={`Open ${product.name} menu`}
												>
													<MoreHorizontalIcon />
												</Button>
											{/snippet}
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item>Edit</DropdownMenu.Item>
											<DropdownMenu.Item>Restock</DropdownMenu.Item>
											<DropdownMenu.Separator />
											<DropdownMenu.Item variant="destructive">Archive</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API keys table with permission badges and actions">
		<Card.Root>
			<Card.Content>
				<!--
					demo 12. Two icon buttons instead of a menu, because copy and regenerate
					are the whole vocabulary; each keeps an `sr-only` name, since the glyph is the
					only visible label. Upstream's `size-7` triggers land on `icon-sm` (h-8).
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Key</Table.Head>
							<Table.Head>Permissions</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each apiKeys as apiKey (apiKey.name)}
							<Table.Row>
								<Table.Cell>
									<div class="flex flex-col">
										<span class="font-medium">{apiKey.name}</span>
										<span class="text-xs text-muted-foreground">
											Last used: {apiKey.lastUsed}
										</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
										{apiKey.token}
									</code>
								</Table.Cell>
								<Table.Cell>
									<div class="flex gap-1">
										{#each apiKey.permissions as permission (permission)}
											<Badge variant={apiKeyPermissionVariant[permission] ?? "outline"}>
												{permission}
											</Badge>
										{/each}
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={apiKey.statusVariant}>{apiKey.status}</Badge>
								</Table.Cell>
								<Table.Cell>
									<div class="flex justify-end gap-1">
										<Button variant="ghost" size="icon-sm">
											<CopyIcon />
											<span class="sr-only">Copy {apiKey.name} key</span>
										</Button>
										<Button variant="ghost" size="icon-sm">
											<RotateCcwIcon />
											<span class="sr-only">Regenerate {apiKey.name} key</span>
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="File manager table with owners and sharing badges">
		<Card.Root>
			<Card.Content>
				<!--
					demo 13. The leading glyph varies per row, so the icon component travels
					in the data; an `{@const}` gives it the capitalised binding Svelte 5 needs to
					render a component held in a variable.
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Owner</Table.Head>
							<Table.Head>Sharing</Table.Head>
							<Table.Head>Size</Table.Head>
							<Table.Head class="text-right">Modified</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each managedFiles as file (file.name)}
							{@const FileIcon = file.icon}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<FileIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
										<span class="font-medium">{file.name}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Avatar.Root size="sm">
											<Avatar.Fallback>{getInitials(file.owner)}</Avatar.Fallback>
										</Avatar.Root>
										<span>{file.owner}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={file.sharingVariant}>{file.sharing}</Badge>
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">{file.size}</Table.Cell>
								<Table.Cell class="text-right text-muted-foreground">{file.modified}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Issues table with priority, assignee, and labels">
		<Card.Root>
			<Card.Content>
				<!--
					demo 14. The label rides inside the title cell rather than taking a
					column of its own, which is what keeps a four-column table readable at this
					width. Upstream's unrendered priority fields are dropped — see the script.
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-20">ID</Table.Head>
							<Table.Head>Issue</Table.Head>
							<Table.Head>Assignee</Table.Head>
							<Table.Head>Status</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each issues as issue (issue.id)}
							<Table.Row>
								<Table.Cell class="font-mono text-xs text-muted-foreground">{issue.id}</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<span class="truncate font-medium">{issue.title}</span>
										<Badge variant="outline">{issue.label}</Badge>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Avatar.Root size="sm">
											<Avatar.Fallback>{getInitials(issue.assignee)}</Avatar.Fallback>
										</Avatar.Root>
										<span>{issue.assignee}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={issue.statusVariant}>{issue.status}</Badge>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Leaderboard table with rank, score, and level badges">
		<Card.Root>
			<Card.Content>
				<!--
					demo 15. The delta is the one place on the page where colour carries
					meaning on its own, so it pairs a trend arrow with the `--success` /
					`--destructive` type — direction is legible without reading the colour.
				-->
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-12 text-center">#</Table.Head>
							<Table.Head>Player</Table.Head>
							<Table.Head>Level</Table.Head>
							<Table.Head class="text-right">Score</Table.Head>
							<Table.Head class="text-right">Change</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each leaderboard as leader (leader.rank)}
							<Table.Row>
								<Table.Cell class="text-center font-bold">{leader.rank}</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-3">
										<Avatar.Root size="sm">
											<Avatar.Fallback>{getInitials(leader.name)}</Avatar.Fallback>
										</Avatar.Root>
										<div class="flex flex-col">
											<span class="font-medium">{leader.name}</span>
											<span class="text-xs text-muted-foreground">{leader.handle}</span>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={leader.levelVariant}>{leader.level}</Badge>
								</Table.Cell>
								<Table.Cell class="text-right font-mono font-medium">
									{grouped.format(leader.score)}
								</Table.Cell>
								<Table.Cell class="text-right">
									<span
										class="inline-flex items-center gap-0.5 {leader.changeUp
											? 'text-success'
											: 'text-destructive'}"
									>
										{#if leader.changeUp}
											<TrendingUpIcon class="size-3.5" aria-hidden="true" />
										{:else}
											<TrendingDownIcon class="size-3.5" aria-hidden="true" />
										{/if}
										{leader.change}
									</span>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical table with employee profile details">
		{#snippet blurb()}
			No header row at all: the first column is the header, one field per row. A
			<code class="text-[87.5%] text-primary">&lt;tbody&gt;</code> on its own is valid table markup, so
			the primitive needs nothing it does not already have.
		{/snippet}
		<Card.Root class="py-0">
			<Card.Content class="px-0">
				<!--
					demo 16. The card loses its own padding so the label column's ground runs
					to the edge, which is what makes the two columns read as one grid rather than as
					a table floating inside a box.
				-->
				<Table.Root>
					<Table.Body>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Employee</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-2">
									<Avatar.Root size="sm">
										<Avatar.Fallback>{getInitials("Sarah Chen")}</Avatar.Fallback>
									</Avatar.Root>
									<div class="flex flex-col leading-none">
										<span class="font-medium">Sarah Chen</span>
										<span class="text-xs text-muted-foreground">Lead Product Designer</span>
									</div>
								</div>
							</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Department</Table.Cell>
							<Table.Cell>Design &amp; User Experience</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Email</Table.Cell>
							<Table.Cell class="text-primary">sarah.chen@acmecorp.com</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Location</Table.Cell>
							<Table.Cell>San Francisco, CA</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Status</Table.Cell>
							<Table.Cell><Badge variant="success-subtle">Active</Badge></Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Start date</Table.Cell>
							<Table.Cell>March 15, 2022</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Reports to</Table.Cell>
							<Table.Cell>James Rodriguez, VP of Design</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical table with server configuration details">
		{#snippet blurb()}
			The same two-column grid under a titled header, with a live indicator and two meters in the
			value column.
		{/snippet}
		<Card.Root class="gap-0 pb-0">
			<Card.Header class="pb-4">
				<Card.Title>Droplet status</Card.Title>
				<Card.Description class="flex items-center gap-2">
					Primary production server
					<Badge variant="outline">prod-api-us-east-1</Badge>
				</Card.Description>
			</Card.Header>
			<Card.Content class="px-0">
				<!--
					demo 17. Three substitutions beyond the standing ones: the hand-rolled
					pinging green dot is `Status` with `variant="success"` (its indicator already
					carries the ping, and it names the state instead of painting it), and the two
					`<div>` meters are `Progress` — the memory bar recoloured to `--warning` the
					way the Alert page recolours its own, since amber is not a token here.
				-->
				<Table.Root>
					<Table.Body>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Status</Table.Cell>
							<Table.Cell>
								<Status.Root variant="success">
									<Status.Indicator />
									<Status.Label>Operational</Status.Label>
								</Status.Root>
							</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Instance type</Table.Cell>
							<Table.Cell class="font-mono">c6g.2xlarge</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Region</Table.Cell>
							<Table.Cell>US East (N. Virginia)</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>CPU usage</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-3">
									<Progress value={42} class="w-24" aria-label="CPU usage" />
									<span class="text-muted-foreground">42%</span>
								</div>
							</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Memory</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-3">
									<Progress
										value={67}
										class="w-24 bg-warning-subtle *:bg-warning"
										aria-label="Memory usage"
									/>
									<span class="text-muted-foreground">10.7 / 16 GB</span>
								</div>
							</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Uptime</Table.Cell>
							<Table.Cell>47 days, 12 hours</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>OS</Table.Cell>
							<Table.Cell>Amazon Linux 2023</Table.Cell>
						</Table.Row>
						<Table.Row class={verticalRow}>
							<Table.Cell class={verticalLabel}>Tags</Table.Cell>
							<Table.Cell>
								<div class="flex flex-wrap gap-1.5">
									<Badge variant="secondary">production</Badge>
									<Badge variant="secondary">api</Badge>
									<Badge variant="secondary">critical</Badge>
								</div>
							</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
