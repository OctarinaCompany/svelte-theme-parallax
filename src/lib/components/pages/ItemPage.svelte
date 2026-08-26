<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Item from "$lib/components/ui/item/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
	import { Kbd } from "$lib/components/ui/kbd/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { cn } from "$lib/utils.js";
	import ArchiveIcon from "@lucide/svelte/icons/archive";
	import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import CodeIcon from "@lucide/svelte/icons/code";
	import CpuIcon from "@lucide/svelte/icons/cpu";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
	import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
	import FileIcon from "@lucide/svelte/icons/file";
	import FileSpreadsheetIcon from "@lucide/svelte/icons/file-spreadsheet";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import ImageIcon from "@lucide/svelte/icons/image";
	import InboxIcon from "@lucide/svelte/icons/inbox";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import MusicIcon from "@lucide/svelte/icons/music";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import SaveIcon from "@lucide/svelte/icons/save";
	import SearchIcon from "@lucide/svelte/icons/search";
	import SendIcon from "@lucide/svelte/icons/send";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ShieldAlertIcon from "@lucide/svelte/icons/shield-alert";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import WebhookIcon from "@lucide/svelte/icons/webhook";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Item component page, following shadcn-svelte's documentation
	 * (`https://shadcn-svelte.com/docs/components/item.md`).
	 *
	 * The default row is skinned to the theme's own list row — the padded row an avatar or
	 * icon, a title, a line of secondary text and an action share. What that skin states,
	 * and what it leaves alone:
	 *
	 *   padding      1rem vertical / 1.25rem horizontal, applied
	 *   gap          18px between the media column and the text block, applied
	 *   border       the row's hairline is already `--border`, so `variant="outline"`
	 *                needs nothing
	 *   hover        link rows fill with `--accent`
	 *   title        shadcn's `text-sm font-medium` already IS the house heading pair,
	 *                so nothing changes
	 *   description  13px — shadcn ships 15px, so this one is reduced
	 *
	 * Left at shadcn's defaults, because the house list row has no opinion of its own to
	 * state there:
	 *
	 *   variant="muted"     `bg-muted/50`. A house list row is either transparent or takes
	 *                       a full `--primary` fill when active — there is no third, quiet
	 *                       surface
	 *   size="sm" / "xs"    the house list row scales only UPWARDS (one large tier); it
	 *                       has no compact row
	 *   line-clamp          `Item.Title` clamps to one line and `Item.Description` to two;
	 *                       elsewhere in the theme, text truncates only where asked by hand
	 *   focus ring          the house list row recolours the TITLE on focus rather than
	 *                       drawing a ring (shown on the List group page, not repeated here)
	 *   avatar group notch  overlapping avatars separate with shadcn's `ring-2
	 *                       ring-background` — a ring rather than a cut-out bite, same
	 *                       purpose, different drawing
	 *
	 * NO REMOTE ASSETS. The shadcn examples load avatars from `github.com` and photographs
	 * from stock-photo; this repo makes no network requests at runtime, the same reason
	 * `dashboard.ts` carries no `avatar` field. Initials stand in for the photographs
	 * (`Avatar.Fallback` exists for exactly that) and a `bg-muted` block with a Lucide glyph
	 * stands in for the album art and the model thumbnails.
	 */

	/**
	 * The default row geometry.
	 *
	 *   px-5 py-4   1.25rem of horizontal padding and 1rem of vertical, against shadcn's
	 *               `px-4 py-3.5` (16px / 14px)
	 *   gap-4.5     18px between the media column and the text block — the 1.5rem house row
	 *               gutter minus the 6px the text block is pulled back toward its media
	 *               (24 − 6 = 18px, which Tailwind v4 spells `gap-4.5`) — against shadcn's
	 *               `gap-3.5` (14px)
	 *
	 * The radius needs nothing: the house radius is 0.375rem, which is `rounded-md`, which
	 * is what `itemVariants` already carries.
	 */
	const row = "gap-4.5 px-5 py-4";

	/**
	 * The one size the theme adds to a list row: 1.5rem of vertical padding, with the
	 * horizontal padding unchanged.
	 */
	const rowLarge = "gap-4.5 px-5 py-6";

	/**
	 * The link row's hover fill: `--accent` in both modes — the same mapping the List group
	 * page derived. shadcn fills with `bg-muted`, one step darker.
	 *
	 * The `[a]:` prefix is restated rather than dropped so tailwind-merge sees the same
	 * modifier list on both classes and evicts the one it replaces; a plain `hover:bg-accent`
	 * would leave both on the element.
	 */
	const action = "[a]:hover:bg-accent";

	/**
	 * The classic theme's secondary line is `<p class="small text-body-secondary">`:
	 * `small-font-size: 0.8125rem` (13px), which `--text-xs` holds. shadcn's
	 * `ItemDescription` is `text-sm` — 15px here, since this theme maps `--text-sm` to
	 * `font-size-base`.
	 *
	 * The colour is already right and is left alone: `.text-body-secondary` is
	 * `body-secondary-color` = `gray-600` in light and `body-secondary-color-dark` =
	 * `gray-700` in dark, and `--muted-foreground` holds #95AAC9 / #6E84A3 — exact in both.
	 *
	 * The distance to the title above is left alone as well, and it is the one value on this
	 * page that is close rather than equal: the classic theme writes `mb-1` on the heading, and its
	 * `spacers` key 1 is `spacer * .125` = 3px, where `ItemContent`'s `gap-1` is 4px.
	 * One pixel, and closing it would take an arbitrary value for no visible gain.
	 */
	const description = "text-xs";

	/**
	 * The classic theme's rows are `.row.align-items-center`: the media is centred against the whole
	 * text block, however tall it gets. shadcn nudges it to the top the moment the item
	 * carries a description (`self-start` plus `translate-y-0.5` on `itemMediaVariants`).
	 *
	 * Both overrides repeat the same `group-has-…` prefix as the rules they replace, for the
	 * tailwind-merge reason spelled out in {@link action}.
	 */
	const mediaCentred =
		"group-has-data-[slot=item-description]/item:self-center group-has-data-[slot=item-description]/item:translate-y-0";

	/**
	 * `.avatar.avatar-sm` — `avatar-size-sm: 2.5rem`, the size the classic theme uses inside a list
	 * row (the reference “team-overview” demo page). shadcn's `Avatar` defaults to `size-8`.
	 *
	 * `Avatar.Fallback` is left at `bg-muted text-muted-foreground`. The classic theme's `.avatar-title`
	 * is `avatar-title-bg: gray-500` (#B1C2D9) on `white`, and no semantic token here holds
	 * that grey — `--chart-5` does, under a name that would not survive review. The List group
	 * page made the same call, and this page stays consistent with it.
	 */
	const avatar = "size-10";

	/**
	 * The classic theme never puts a bare icon in a list row: it puts the icon in an avatar chip —
	 * `<div class="avatar avatar-sm"><div class="avatar-title fs-lg bg-primary-subtle
	 * rounded-circle text-primary">` (the reference “team-overview” demo page line 1032). That is the
	 * `*-subtle` pairing documented in `app.css`: the tinted ground carries the
	 * full-strength colour as its type, so `--primary-subtle` and `--primary` are the pair.
	 *
	 * `fs-lg` is `font-size-lg: 1.0625rem`, and the glyph is sized from it. The media slot
	 * keeps its DEFAULT variant rather than `variant="icon"` for that reason: the icon variant
	 * pins the glyph at `size-4` through `[&_svg:not([class*='size-'])]`, a selector that
	 * outranks a plain size class written on the icon.
	 *
	 * `size-10` is `.avatar-sm` again, and the base already centres its content, so only the
	 * chip's fill, type colour and corner are stated here.
	 */
	const iconChip = "size-10 rounded-full bg-primary-subtle text-primary-subtle-foreground";

	/**
	 * `.btn.btn-sm.btn-white` — the row action the classic theme uses everywhere a list item carries a
	 * button. Geometry from the Buttons page (`btn-*-sm`: 13px type at `line-height-sm`
	 * 1.75, `btn-padding-y-sm: .125rem`, `border-radius-sm`), colours from `.btn-white`,
	 * the classic theme's answer to `.btn-light` being invisible over light grounds.
	 *
	 * Applied over `Button`'s DEFAULT variant rather than over `outline`: the outline variant
	 * carries `dark:bg-input/30` and `dark:hover:bg-input/50`, which no light-mode class can
	 * evict, so the button would keep a stray dark-mode fill.
	 */
	const buttonWhite =
		"h-(--control-h-sm) rounded-sm px-2 text-xs font-normal border-border bg-card text-card-foreground hover:bg-accent dark:hover:bg-background";

	/** `.btn-white.btn-rounded-circle` at the base size, from the Buttons page. */
	const buttonCircle =
		"size-10 rounded-full p-0 text-sm font-normal border-border bg-card text-card-foreground hover:bg-accent dark:hover:bg-background";

	/**
	 * The dropdown surface and its items, both as derived on the Dropdowns page:
	 * `dropdown-border-radius: border-radius`, `dropdown-padding-y: .5rem` with no
	 * horizontal padding, `dropdown-font-size: font-size-base`, and
	 * `dropdown-item-padding-x: 1.5rem` / `-y: .375rem` (read out of `theme.bundle.css`).
	 *
	 * `w-72` is the width shadcn's own example asks for and it is kept: `dropdown-min-width:
	 * 10rem` is a floor rather than a cap, so a wider menu is not a contradiction. shadcn's
	 * example also sets `[--radius:0.65rem]`, which is dropped — the classic theme's dropdown corner is
	 * `border-radius`, the value `--radius` already holds.
	 */
	const menu = "w-72 rounded-md px-0 py-2 text-sm";

	/**
	 * bits-ui's menus are modal and the classic are not; `preventScroll={false}` drops the
	 * scroll lock, for the reasons written out on the Dropdowns page.
	 */
	const nonModal = false;

	/** This page's own route, so the link demos go somewhere real instead of nowhere. */
	const self = href("/components/item");

	const people = [
		{ username: "shadcn", initials: "CN", email: "shadcn@vercel.com" },
		{ username: "maxleiter", initials: "LR", email: "maxleiter@vercel.com" },
		{ username: "evilrabbit", initials: "ER", email: "evilrabbit@vercel.com" },
	];

	const music = [
		{
			title: "Midnight City Lights",
			artist: "Neon Dreams",
			album: "Electric Nights",
			duration: "3:45",
		},
		{
			title: "Coffee Shop Conversations",
			artist: "The Morning Brew",
			album: "Urban Stories",
			duration: "4:05",
		},
		{
			title: "Digital Rain",
			artist: "Cyber Symphony",
			album: "Binary Beats",
			duration: "3:30",
		},
	];

	const models = [
		{ name: "v0-1.5-sm", description: "Everyday tasks and UI generation." },
		{ name: "v0-1.5-lg", description: "Advanced thinking or reasoning." },
		{ name: "v0-2.0-mini", description: "Open Source model for everyone." },
	];

	/**
	 * Every section from here down is the item demo set. It rebuilds
	 * the same shadcn item on Radix, so the parts map one to one and the examples drop straight
	 * onto the component above. Three substitutions carry this repository's standing rules onto
	 * them:
	 *
	 * - The demos' Badge asks speak `success`/`warning` and a `-light` family, in `sm`/`xs` sizes. The
	 *   house soft family is `{state}-subtle`, and the house Badge has one size — so every
	 *   `*-light` becomes `*-subtle`, the solid `success`/`warning` pills become `*-subtle` too
	 *   (there is no solid success or warning badge here), and the size props are dropped.
	 * - The stock portraits become `Avatar.Fallback` initials — the no-remote-assets rule the
	 *   header comment states.
	 * - The rows are `size="xs"`, which is shadcn's own compact row; it is kept as shipped,
	 *   the call the Size section above already made for sizes the classic theme does not have.
	 */

	/** demo 5 — presence states. `success`→`success-subtle`, `warning`→`warning-subtle`. */
	const teamStatus = [
		{
			name: "Sarah Chen",
			initials: "SC",
			role: "Team Lead",
			badge: "success-subtle",
			label: "Online",
		},
		{
			name: "Alex Johnson",
			initials: "AJ",
			role: "Developer",
			badge: "warning-subtle",
			label: "Away",
		},
		{ name: "David Kim", initials: "DK", role: "Designer", badge: "outline", label: "Offline" },
	] as const;

	/** demo 6 — the `·` between size and age is upstream's `&middot;`, kept. */
	const files = [
		{
			icon: FileTextIcon,
			name: "Quarterly Report.pdf",
			meta: "2.4 MB · Updated 2 hours ago",
			badge: "success-subtle",
			label: "Final",
		},
		{
			icon: FileSpreadsheetIcon,
			name: "Budget 2025.xlsx",
			meta: "856 KB · Updated yesterday",
			badge: "warning-subtle",
			label: "Draft",
		},
		{
			icon: ImageIcon,
			name: "Hero Banner.png",
			meta: "4.1 MB · Updated 3 days ago",
			badge: "info-subtle",
			label: "Review",
		},
	] as const;

	/** demo 7 — the icons move into the data; `<cmd.icon />` renders them directly. */
	const commands = [
		{ icon: SearchIcon, label: "Search", shortcut: "⌘K" },
		{ icon: PlusIcon, label: "New File", shortcut: "⌘N" },
		{ icon: SaveIcon, label: "Save", shortcut: "⌘S" },
		{ icon: SettingsIcon, label: "Settings", shortcut: "⌘," },
		{ icon: LogOutIcon, label: "Sign Out", shortcut: "⌘Q" },
	] as const;

	/** demo 8 — `count > 1` (not `> 0`) is upstream's own threshold, kept as shipped. */
	const mailFolders = [
		{ icon: InboxIcon, label: "Inbox", count: 12 },
		{ icon: SendIcon, label: "Sent", count: 0 },
		{ icon: FileIcon, label: "Drafts", count: 3 },
		{ icon: ArchiveIcon, label: "Archive", count: 0 },
		{ icon: Trash2Icon, label: "Trash", count: 0 },
	] as const;

	/**
	 * demo 9 — the role ladder: a solid primary pill for the admin, the soft family for
	 * the editor (`info-light`→`info-subtle`), an outline for the viewer.
	 */
	const teamMembers = [
		{
			name: "Sarah Chen",
			email: "sarah@example.com",
			initials: "SC",
			role: "Admin",
			roleVariant: "default",
		},
		{
			name: "Alex Johnson",
			email: "alex@example.com",
			initials: "AJ",
			role: "Editor",
			roleVariant: "info-subtle",
		},
		{
			name: "Emily Park",
			email: "emily@example.com",
			initials: "EP",
			role: "Viewer",
			roleVariant: "outline",
		},
	] as const;

	/** demo 11 — two connected states and one call to action. */
	const integrations = [
		{
			icon: DatabaseIcon,
			name: "Database",
			description: "Sync records from your data warehouse",
			connected: true,
		},
		{
			icon: WebhookIcon,
			name: "Webhooks",
			description: "Push realtime events to your endpoints",
			connected: true,
		},
		{
			icon: CodeIcon,
			name: "API access",
			description: "Build custom integrations with the REST API",
			connected: false,
		},
	] as const;

	/** demo 12 — the verb rides in the badge, the object in the description's plain text. */
	const activities = [
		{
			name: "Sarah Chen",
			initials: "SC",
			action: "deployed",
			target: "v2.4.1 to production",
			badge: "success-subtle",
			time: "5 min ago",
		},
		{
			name: "Marcus Johnson",
			initials: "MJ",
			action: "merged",
			target: "feat/dark-mode into main",
			badge: "info-subtle",
			time: "32 min ago",
		},
		{
			name: "Emily Park",
			initials: "EP",
			action: "opened",
			target: "issue #284: Fix mobile nav",
			badge: "warning-subtle",
			time: "1 hour ago",
		},
	] as const;
</script>

<DocPage title="Item">
	{#snippet subtitle()}
		A flex container that displays a title, a description and an action — group it with
		<code class="text-[87.5%] text-primary">Item.Group</code> to build a list. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/item"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options. The default row here is skinned to the classic
		<code class="text-[87.5%] text-primary">.list-group-item</code>, but
		<code class="text-[87.5%] text-primary">Item.Group</code> only stacks rows with a gap. For the
		container the classic framework draws around them — one rounded box, a hairline per seam, and an
		active fill on the chosen row — see
		<a class="text-primary underline underline-offset-3" href={href("/components/list-group")}
			>List group</a
		>, which ports that as plain classes rather than as a component.
	{/snippet}

	<!--
		THE STACK GAPS ON THIS PAGE ARE SCAFFOLDING, not theme values: shadcn's examples float
		each item on its own so the variant under discussion is visible. `gap-6` is at least
		`spacer` (1.5rem), the margin the classic theme puts between two cards. The classic theme's own lists are
		flush — no gap, a hairline between adjacent rows — and that shape is what the Group
		section below renders.

		The `max-w-md` / `max-w-lg` wrappers of the shadcn examples are dropped throughout: a
		classic-theme list row spans its card.
	-->
	<Card.Root>
		<Card.Content class="flex flex-col gap-6">
			<Item.Root variant="outline" class={row}>
				<Item.Content>
					<Item.Title>Basic Item</Item.Title>
					<Item.Description class={description}>
						A simple item with title and description.
					</Item.Description>
				</Item.Content>
				<Item.Actions>
					<Button class={buttonWhite}>Action</Button>
				</Item.Actions>
			</Item.Root>

			<!--
				`size="sm"` is shadcn's own compact row and is left untouched — the classic theme has no
				small list row to port it against, so only the hover colour applies here.
			-->
			<Item.Root variant="outline" size="sm" class={action}>
				{#snippet child({ props })}
					<a href={self} {...props}>
						<Item.Media>
							<BadgeCheckIcon class="size-5" />
						</Item.Media>
						<Item.Content>
							<Item.Title>Your profile has been verified.</Item.Title>
						</Item.Content>
						<Item.Actions>
							<ChevronRightIcon class="size-4" />
						</Item.Actions>
					</a>
				{/snippet}
			</Item.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Variants">
		{#snippet blurb()}
			Three grounds for one row. Only <code class="text-[87.5%] text-primary">outline</code> has a classic
			counterpart — a list row always draws its border there.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<!--
					`default` is `border-transparent` on nothing. The classic theme's `list-group-bg` is
					transparent too, so the FILL matches; what it never does is drop the border. The
					borderless row is how a flush list looks between its seams, which is why the
					Group section pairs this variant with separators rather than with an outline.
				-->
				<Item.Root class={row}>
					<Item.Content>
						<Item.Title>Default Variant</Item.Title>
						<Item.Description class={description}>
							Standard styling with subtle background and borders.
						</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Button class={buttonWhite}>Open</Button>
					</Item.Actions>
				</Item.Root>

				<!--
					`outline` is `border-border`, and that needs no correction:
					`list-group-border-color` is `gray-200` in light and `--bs-border-color` in
					dark, which is exactly what `--border` holds in both modes.
				-->
				<Item.Root variant="outline" class={row}>
					<Item.Content>
						<Item.Title>Outline Variant</Item.Title>
						<Item.Description class={description}>
							Outlined style with clear borders and transparent background.
						</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Button class={buttonWhite}>Open</Button>
					</Item.Actions>
				</Item.Root>

				<!--
					`muted` is `bg-muted/50` and stays that way. The classic theme's list row is either
					transparent or `.active` (a full `primary` fill); it has no quiet third surface,
					so there is nothing here to port and nothing worth inventing.
				-->
				<Item.Root variant="muted" class={row}>
					<Item.Content>
						<Item.Title>Muted Variant</Item.Title>
						<Item.Description class={description}>
							Subdued appearance with muted colors for secondary content.
						</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Button class={buttonWhite}>Open</Button>
					</Item.Actions>
				</Item.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Size">
		{#snippet blurb()}
			The item has different sizes for different use cases — a compact row, a standard one, and the
			one size the classic theme itself adds.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<!--
					The shadcn docs repeat their opening example verbatim under this heading, so
					rendering it again would show the same two rows twice. The section shows one row
					per size instead, which is what its prose describes.

					Only two of the four are the classic theme values: `default` is `.list-group-item` and
					`large` is `.list-group-lg`. `sm` and `xs` are shadcn's, kept as shipped.
				-->
				<Item.Root variant="outline" size="xs">
					<Item.Content>
						<Item.Title>Extra small</Item.Title>
					</Item.Content>
					<Item.Actions>
						<ChevronRightIcon class="size-4" />
					</Item.Actions>
				</Item.Root>

				<Item.Root variant="outline" size="sm">
					<Item.Content>
						<Item.Title>Small</Item.Title>
					</Item.Content>
					<Item.Actions>
						<ChevronRightIcon class="size-4" />
					</Item.Actions>
				</Item.Root>

				<Item.Root variant="outline" class={row}>
					<Item.Content>
						<Item.Title>Default</Item.Title>
						<Item.Description class={description}>
							The classic theme's list row: 16px of vertical padding, 20px of horizontal.
						</Item.Description>
					</Item.Content>
					<Item.Actions>
						<ChevronRightIcon class="size-4" />
					</Item.Actions>
				</Item.Root>

				<Item.Root variant="outline" class={rowLarge}>
					<Item.Content>
						<Item.Title>Large</Item.Title>
						<Item.Description class={description}>
							The list-group-lg row: the same width, one full spacer tall.
						</Item.Description>
					</Item.Content>
					<Item.Actions>
						<ChevronRightIcon class="size-4" />
					</Item.Actions>
				</Item.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Icon">
		{#snippet blurb()}
			An icon in the media slot. The classic theme puts one in an avatar chip rather than leaving it
			bare, so this row carries the chip.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Item.Root variant="outline" class={row}>
					<Item.Media class="{iconChip} {mediaCentred}">
						<ShieldAlertIcon class="size-[1.0625rem]" />
					</Item.Media>
					<Item.Content>
						<Item.Title>Security Alert</Item.Title>
						<Item.Description class={description}>
							New login detected from unknown device.
						</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Button class={buttonWhite}>Review</Button>
					</Item.Actions>
				</Item.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar">
		{#snippet blurb()}
			One avatar, then a stack of them — the shape the classic theme calls
			<code class="text-[87.5%] text-primary">.avatar-group</code>.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<Item.Root variant="outline" class={row}>
					<Item.Media class={mediaCentred}>
						<Avatar.Root class={avatar}>
							<Avatar.Fallback>ER</Avatar.Fallback>
						</Avatar.Root>
					</Item.Media>
					<Item.Content>
						<Item.Title>Evil Rabbit</Item.Title>
						<Item.Description class={description}>Last seen 5 months ago</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Button class={buttonCircle} aria-label="Invite">
							<PlusIcon />
						</Button>
					</Item.Actions>
				</Item.Root>

				<Item.Root variant="outline" class={row}>
					<Item.Media class={mediaCentred}>
						<!--
							`.avatar-group` shifts every avatar after the first by
							`calc(var(--bs-avatar-size) * .25 * -1)` — 0.625rem at `avatar-size-sm`,
							which is `-ml-2.5`. Written as a child selector rather than as
							`-space-x-2.5` because this codebase uses `gap-*` and never `space-*`.

							The notch between two overlapping avatars is a `mask-image` in the classic theme,
							pointing at `assets/img/masks/avatar-group.svg`. That file ships with the
							theme and not with this repo, so shadcn's `ring-2 ring-background` stands
							in: a ring where the classic theme cuts a bite, same purpose, different drawing.
						-->
						<div
							class="flex *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background [&>*+*]:-ml-2.5"
						>
							{#each people as person (person.username)}
								<Avatar.Root class={avatar}>
									<Avatar.Fallback>{person.initials}</Avatar.Fallback>
								</Avatar.Root>
							{/each}
						</div>
					</Item.Media>
					<Item.Content>
						<Item.Title>No Team Members</Item.Title>
						<Item.Description class={description}>
							Invite your team to collaborate on this project.
						</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Button class={buttonWhite}>Invite</Button>
					</Item.Actions>
				</Item.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Image">
		{#snippet blurb()}
			A thumbnail in the media slot, with a second content column pinned to the right.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				{#each music as song (song.title)}
					<Item.Root variant="outline" class="{row} {action}">
						{#snippet child({ props })}
							<a href={self} {...props}>
								<!--
									`variant="image"` is `size-10 rounded-sm`. The size is already
									`avatar-size-sm` (2.5rem); the corner is not — the classic theme's thumbnails
									are `.avatar-img.rounded`, i.e. `border-radius` (0.375rem), which is
									`rounded-md`.

									A `bg-muted` block carries a glyph instead of album art: no remote
									assets, as the header comment explains.
								-->
								<Item.Media
									variant="image"
									class="{mediaCentred} rounded-md bg-muted text-muted-foreground"
								>
									<MusicIcon class="size-4" />
								</Item.Media>
								<Item.Content>
									<Item.Title>
										{song.title} -
										<span class="text-muted-foreground">{song.album}</span>
									</Item.Title>
									<Item.Description class={description}>{song.artist}</Item.Description>
								</Item.Content>
								<Item.Content class="flex-none text-center">
									<Item.Description class={description}>{song.duration}</Item.Description>
								</Item.Content>
							</a>
						{/snippet}
					</Item.Root>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Group">
		{#snippet blurb()}
			Items stacked into a list. This is the one section where the classic theme has an opinion
			about the container rather than about the row.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`gap-0` replaces `ItemGroup`'s `gap-4`, and `my-0` replaces `ItemSeparator`'s
					`my-2`. Together they are `.list-group.list-group-flush`: rows sit directly on top
					of each other and a single hairline marks the seam, with no outer box. The classic framework
					gets there by putting a border on each row and removing the doubled edge; the
					separator between two transparent-bordered items is the same picture.

					`Separator` is already `bg-border`, which is `list-group-border-color` exactly —
					so the seam needs no colour of its own.
				-->
				<Item.Group class="gap-0">
					{#each people as person, index (person.username)}
						<Item.Root class={row}>
							<Item.Media class={mediaCentred}>
								<Avatar.Root class={avatar}>
									<Avatar.Fallback>{person.initials}</Avatar.Fallback>
								</Avatar.Root>
							</Item.Media>
							<Item.Content>
								<Item.Title>{person.username}</Item.Title>
								<Item.Description class={description}>{person.email}</Item.Description>
							</Item.Content>
							<Item.Actions>
								<Button class={buttonCircle} aria-label="Add {person.username}">
									<PlusIcon />
								</Button>
							</Item.Actions>
						</Item.Root>
						{#if index !== people.length - 1}
							<Item.Separator class="my-0" />
						{/if}
					{/each}
				</Item.Group>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Header">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">Item.Header</code> takes a full row of its own, which turns
			the item on its side: media above, text below.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`gap-6` rather than shadcn's `gap-4`: this is a grid of cards, not a list, and a
					classic-framework `.row` separates its columns by `grid-gutter-width` (1.5rem).

					The thumbnail is a `bg-muted` block for the no-remote-assets reason above, cornered
					with `rounded-md` — `border-radius`, which is what the classic theme's `.avatar-img.rounded`
					resolves to.
				-->
				<Item.Group class="grid grid-cols-3 gap-6">
					{#each models as model (model.name)}
						<Item.Root variant="outline" class={row}>
							<Item.Header>
								<div
									class="flex aspect-square w-full items-center justify-center rounded-md bg-muted text-muted-foreground"
								>
									<CpuIcon class="size-6" />
								</div>
							</Item.Header>
							<Item.Content>
								<Item.Title>{model.name}</Item.Title>
								<Item.Description class={description}>{model.description}</Item.Description>
							</Item.Content>
						</Item.Root>
					{/each}
				</Item.Group>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Link">
		{#snippet blurb()}
			To render an item as a link, use the <code class="text-[87.5%] text-primary">child</code>
			snippet. The hover and focus states are applied to the anchor element.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<!--
					These two rows are the classic `.list-group-item-action`: the hover fill is the
					whole difference between a link row and a plain one, and `{action}` is where it
					comes from.
				-->
				<Item.Root class="{row} {action}">
					{#snippet child({ props })}
						<a href={self} {...props}>
							<Item.Content>
								<Item.Title>Visit our documentation</Item.Title>
								<Item.Description class={description}>
									Learn how to get started with our components.
								</Item.Description>
							</Item.Content>
							<Item.Actions>
								<ChevronRightIcon class="size-4" />
							</Item.Actions>
						</a>
					{/snippet}
				</Item.Root>

				<Item.Root variant="outline" class="{row} {action}">
					{#snippet child({ props })}
						<a
							href="https://shadcn-svelte.com/docs/components/item"
							target="_blank"
							rel="noopener noreferrer"
							{...props}
						>
							<Item.Content>
								<Item.Title>External resource</Item.Title>
								<Item.Description class={description}>
									Opens in a new tab with security attributes.
								</Item.Description>
							</Item.Content>
							<Item.Actions>
								<ExternalLinkIcon class="size-4" />
							</Item.Actions>
						</a>
					{/snippet}
				</Item.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Dropdown">
		{#snippet blurb()}
			An item inside a menu. The classic theme's own version of this is a
			<code class="text-[87.5%] text-primary">.dropdown-menu-card</code> holding a flush list.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<DropdownMenu.Root>
					<!--
						`DropdownMenu.Trigger` renders a bare `<button>`, so the base has to come from
						`buttonVariants()` before the `.btn-white` overrides can evict anything —
						the composition the Dropdowns and Buttons pages both use. The caret is a
						Lucide chevron rather than the classic CSS triangle, because the classic theme replaces
						that triangle with a Feather one (`.dropdown-toggle::after`).
					-->
					<DropdownMenu.Trigger class={cn(buttonVariants(), buttonWhite)}>
						Select
						<ChevronDownIcon />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} align="end" class={menu}>
						{#each people as person (person.username)}
							<!--
								The menu item is emptied of its own padding so the `Item` supplies the box,
								and the `Item` takes `dropdown-item-padding-x/y` instead of the list-row
								padding — inside a menu the surrounding geometry is the dropdown's.

								`focus:bg-transparent` is the classic theme's dropdown hover: `--bs-dropdown-link-hover-bg`
								is transparent there, so an item signals hover by darkening its type rather
								than by filling, as derived on the Dropdowns page.
							-->
							<DropdownMenu.Item class="p-0 focus:bg-transparent">
								<Item.Root size="sm" class="w-full gap-4.5 px-6 py-1.5">
									<Item.Media class={mediaCentred}>
										<Avatar.Root class={avatar}>
											<Avatar.Fallback>{person.initials}</Avatar.Fallback>
										</Avatar.Root>
									</Item.Media>
									<Item.Content>
										<Item.Title>{person.username}</Item.Title>
										<Item.Description class={description}>{person.email}</Item.Description>
									</Item.Content>
								</Item.Root>
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Item group with status badges">
		{#snippet blurb()}
			A presence list: the action slot carries a status pill instead of a button.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 5. `Item.Group` needs no gap override here: its own
					`has-data-[size=xs]:gap-2` matches upstream's spacing for outlined xs rows.
				-->
				<Item.Group>
					{#each teamStatus as member (member.name)}
						<Item.Root variant="outline" size="xs">
							<Item.Media>
								<Avatar.Root>
									<Avatar.Fallback>{member.initials}</Avatar.Fallback>
								</Avatar.Root>
							</Item.Media>
							<Item.Content>
								<Item.Title>{member.name}</Item.Title>
								<Item.Description class={description}>{member.role}</Item.Description>
							</Item.Content>
							<Item.Actions>
								<Badge variant={member.badge}>{member.label}</Badge>
							</Item.Actions>
						</Item.Root>
					{/each}
				</Item.Group>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="File items with icon media, size, and actions">
		{#snippet blurb()}
			A file list — the action slot holds a state pill and a button side by side.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-2">
				<!--
					demo 6. Upstream separates badge and button with `ml-2` on the button;
					`Item.Actions` is already a flex row, so a `gap-2` on it says the same thing in
					this codebase's vocabulary (flex + gap, never margins between siblings).
				-->
				{#each files as file (file.name)}
					<Item.Root variant="outline" size="xs">
						<Item.Media variant="icon">
							<file.icon />
						</Item.Media>
						<Item.Content>
							<Item.Title>{file.name}</Item.Title>
							<Item.Description class={description}>{file.meta}</Item.Description>
						</Item.Content>
						<Item.Actions class="gap-2">
							<Badge variant={file.badge}>{file.label}</Badge>
							<Button class={buttonWhite}>Open</Button>
						</Item.Actions>
					</Item.Root>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Items with keyboard shortcuts">
		{#snippet blurb()}
			A command list: link rows whose action slot carries a
			<code class="text-[87.5%] text-primary">Kbd</code> shortcut.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 7. Upstream caps the list at `max-w-64`, the one width kept on this
					page: a command palette is a narrow surface by design, not a list row that spans
					its card. The rows are anchors, so `{action}` supplies the hover fill, as on the
					Link section above.
				-->
				<div class="flex max-w-64 flex-col gap-0.5">
					{#each commands as cmd (cmd.label)}
						<Item.Root size="xs" class={action}>
							{#snippet child({ props })}
								<a href={self} {...props}>
									<Item.Media variant="icon">
										<cmd.icon />
									</Item.Media>
									<Item.Content>
										<Item.Title>{cmd.label}</Item.Title>
									</Item.Content>
									<Item.Actions>
										<Kbd>{cmd.shortcut}</Kbd>
									</Item.Actions>
								</a>
							{/snippet}
						</Item.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small-size items with badges">
		{#snippet blurb()}
			A mail sidebar — the badge appears only where the count clears upstream's threshold.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 8. Same narrow column as the command list above, for the same reason.
					Upstream's `rounded-full` on the badge is dropped: the house Badge is already a
					pill (`rounded-4xl`), so the class had nothing left to change.
				-->
				<div class="flex max-w-64 flex-col gap-0.5">
					{#each mailFolders as folder (folder.label)}
						<Item.Root size="xs" class={action}>
							{#snippet child({ props })}
								<a href={self} {...props}>
									<Item.Media variant="icon">
										<folder.icon />
									</Item.Media>
									<Item.Content>
										<Item.Title>{folder.label}</Item.Title>
									</Item.Content>
									{#if folder.count > 1}
										<Item.Actions>
											<Badge variant="success-subtle">{folder.count}</Badge>
										</Item.Actions>
									{/if}
								</a>
							{/snippet}
						</Item.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Team members with roles and multiple actions">
		{#snippet blurb()}
			A member list with a role pill and an overflow menu in the same action slot.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Item.Group>
					{#each teamMembers as member (member.email)}
						<!--
							demo 9. Upstream's trigger is a `size-7` ghost icon button; the house
							ramp has no 28px stop, so `icon-sm` (size-8) stands in — the nearest step,
							same reasoning as every other off-ramp size on this page. The `ml-1` becomes
							`gap-2` on the actions row, the flex-not-margin rule again.
						-->
						<Item.Root variant="outline" size="xs">
							<Item.Media>
								<Avatar.Root>
									<Avatar.Fallback>{member.initials}</Avatar.Fallback>
								</Avatar.Root>
							</Item.Media>
							<Item.Content>
								<Item.Title>{member.name}</Item.Title>
								<Item.Description class={description}>{member.email}</Item.Description>
							</Item.Content>
							<Item.Actions class="gap-2">
								<Badge variant={member.roleVariant}>{member.role}</Badge>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class={buttonVariants({ variant: "ghost", size: "icon-sm" })}
										aria-label="Actions for {member.name}"
									>
										<EllipsisIcon />
									</DropdownMenu.Trigger>
									<DropdownMenu.Content preventScroll={nonModal} align="end">
										<DropdownMenu.Item>Change Role</DropdownMenu.Item>
										<DropdownMenu.Item>View Profile</DropdownMenu.Item>
										<DropdownMenu.Separator />
										<DropdownMenu.Item variant="destructive">Remove</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Item.Actions>
						</Item.Root>
					{/each}
				</Item.Group>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Item with header and footer sections">
		{#snippet blurb()}
			All five regions at once:
			<code class="text-[87.5%] text-primary">Item.Header</code> above the content,
			<code class="text-[87.5%] text-primary">Item.Footer</code> below it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 10. `max-w-xs` is upstream's and is kept — this variant is a project
					CARD, not a list row, so the span-the-card rule from the page intro does not
					apply. The footer's avatar stack is `Avatar.Group`, whose ring already draws the
					seam the Avatar section derived by hand.
				-->
				<Item.Root variant="outline" class="max-w-xs">
					<Item.Header>
						<div class="flex items-center gap-2">
							<FolderIcon class="size-3.5 text-muted-foreground" aria-hidden="true" />
							<span class="text-xs text-muted-foreground">Project</span>
						</div>
						<Badge variant="info-subtle">In Progress</Badge>
					</Item.Header>
					<Item.Content>
						<Item.Title>Website Redesign</Item.Title>
						<Item.Description class={description}>
							Complete overhaul of the marketing site with a focus on conversion optimization and
							modern design patterns.
						</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Button class={buttonWhite}>Open</Button>
					</Item.Actions>
					<Item.Footer>
						<Avatar.Group>
							{#each people as person (person.username)}
								<Avatar.Root size="sm">
									<Avatar.Fallback>{person.initials}</Avatar.Fallback>
								</Avatar.Root>
							{/each}
						</Avatar.Group>
						<div class="flex items-center gap-2">
							<Progress value={65} class="w-20" />
							<span class="text-xs text-muted-foreground">65%</span>
						</div>
					</Item.Footer>
				</Item.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Integration items with connect actions">
		{#snippet blurb()}
			The action slot switches on state: a pill for what is connected, a button for what is not.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 11 — `Connected` is `success-light` upstream, `success-subtle` here. -->
				<Item.Group>
					{#each integrations as integration (integration.name)}
						<Item.Root variant="outline" size="xs">
							<Item.Media variant="icon">
								<integration.icon />
							</Item.Media>
							<Item.Content>
								<Item.Title>{integration.name}</Item.Title>
								<Item.Description class={description}>
									{integration.description}
								</Item.Description>
							</Item.Content>
							<Item.Actions>
								{#if integration.connected}
									<Badge variant="success-subtle">Connected</Badge>
								{:else}
									<Button class={buttonWhite}>Connect</Button>
								{/if}
							</Item.Actions>
						</Item.Root>
					{/each}
				</Item.Group>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Activity feed items with avatars and actions">
		{#snippet blurb()}
			The verb travels as a pill inside the description; the timestamp takes the action slot.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 12. The badge sits in running text, so upstream's `mr-1` stays — this
					is inline flow, not a flex row, and a gap has no element to live on. `Badge`
					renders a span, so it is legal inside the description's `<p>`.
				-->
				<Item.Group>
					{#each activities as activity (activity.name)}
						<Item.Root variant="outline" size="xs">
							<Item.Media>
								<Avatar.Root size="sm">
									<Avatar.Fallback>{activity.initials}</Avatar.Fallback>
								</Avatar.Root>
							</Item.Media>
							<Item.Content>
								<Item.Title>{activity.name}</Item.Title>
								<Item.Description class={description}>
									<Badge variant={activity.badge} class="mr-1 align-text-top">
										{activity.action}
									</Badge>
									{activity.target}
								</Item.Description>
							</Item.Content>
							<Item.Actions>
								<span class="text-xs whitespace-nowrap text-muted-foreground">
									{activity.time}
								</span>
							</Item.Actions>
						</Item.Root>
					{/each}
				</Item.Group>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
