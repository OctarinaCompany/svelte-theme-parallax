<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	// Imports below serve the appendix sections — see the note ahead
	// of the "Basic card" section for the ground rules.
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
	import BellIcon from "@lucide/svelte/icons/bell";
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
	import EllipsisVerticalIcon from "@lucide/svelte/icons/ellipsis-vertical";
	import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
	import EyeIcon from "@lucide/svelte/icons/eye";
	import EyeOffIcon from "@lucide/svelte/icons/eye-off";
	import LinkIcon from "@lucide/svelte/icons/link";
	import PinIcon from "@lucide/svelte/icons/pin";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import Share2Icon from "@lucide/svelte/icons/share-2";
	import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import SquareTerminalIcon from "@lucide/svelte/icons/square-terminal";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
	import UserIcon from "@lucide/svelte/icons/user";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { cn } from "$lib/utils.js";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Card component page.
	 *
	 * SCOPE. The classic theme's Cards section runs ~2450 lines and splits in two. The first half
	 * documents the card *component* — header, header navigation, inactive, fill, adjust —
	 * and is what this page ports. The second half (Profile, Team, Project, Files, Statcards,
	 * Posts, Pricing, Kanban) is a set of finished page templates that happen to be built
	 * from cards; those are page work, not component documentation, and are left out.
	 *
	 * The `.card-header` fixed height is not demonstrated with a modifier here because it is
	 * already the global behaviour — see §11 of the theme notes, where `CardHeader` took
	 * the classic theme's 60px model.
	 */

	const lorem =
		"Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facilis non dolore est fuga nobis ipsum illum eligendi nemo iure repellat, soluta, optio minus ut reiciendis voluptates enim impedit veritatis officiis.";

	/**
	 * The four stat cards the classic theme stacks in the Fill example's right column. Their combined
	 * height is what the filling card on the left has to reach.
	 */
	const stats = [
		{ label: "Weekly Sales", value: "$24,500", delta: "+3.5%" },
		{ label: "Orders Placed", value: "763.5", delta: null },
		{ label: "Conversion Rate", value: "84.5%", delta: null },
		{ label: "Avg. Order Value", value: "$85.50", delta: null },
	];

	/** Filler for the Adjust demo, long enough to force the scrollbar it is meant to show. */
	const activity = Array.from({ length: 12 }, (_, i) => ({
		id: i,
		title: `Launchday 1.${i} update email sent`,
		time: `${i + 1}h ago`,
	}));

	/* ---------------------------------------------------------------------------------------
	 * State and data for the appendix sections (demo 1 to demo 18). The markup-side
	 * ground rules are stated in the comment ahead of the "Basic card" section.
	 * ------------------------------------------------------------------------------------ */

	/** demo 12 — whether the password field shows its text. */
	let loginPasswordVisible = $state(false);

	/**
	 * demo 12 asks for a GitHub glyph. Lucide carries no brand icons, so this is the
	 * standard 24x24 GitHub mark drawn in `currentColor` — the same path the Button page's
	 * c-button-16 section already inlines, and for the same reason.
	 */
	const githubIconPath =
		"M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";

	/** demo 13 — expanded shows the full meter breakdown, collapsed a faded teaser. */
	let billingUsageOpen = $state(false);

	/** demo 13 — the per-meter charges under the included-credit summary. */
	const billingUsageLines = [
		{ label: "Requests", value: "$210.84" },
		{ label: "Active CPU", value: "$21.95" },
		{ label: "Events", value: "$21.20" },
		{ label: "Storage Usage", value: "$20.45" },
		{ label: "Bandwidth", value: "$0.00" },
	];

	/** demo 14 — the deployment facts listed under the hero, striped every other row. */
	const deploymentStats = [
		{ label: "Environment", value: "Production" },
		{ label: "Region", value: "us-east-1" },
		{ label: "Version", value: "v2.4.0" },
		{ label: "Status", value: "Healthy" },
	];

	/**
	 * demo 15 — the stat the trend card reports. Upstream declares these as five loose
	 * constants inside its component body; one record keeps the demo's "this is data, not copy"
	 * point without five page-scoped names.
	 */
	const revenueStat = {
		title: "Revenue",
		value: "$12.4k",
		delta: 12.5,
		positive: true,
		lastMonth: "$11.0k",
	};
</script>

{#snippet basic()}
	<Card.Root>
		<Card.Content>
			<!--
			The classic theme's in-body `.card-title` is an `h3` (h3-font-size, 17px), not the `h4` of a card
			header. `text-lg` IS 17px here — app.css maps it to `font-size-lg` / `h3-font-size`
			rather than leaving Tailwind's 18px, which is what this comment used to claim wrongly.
		-->
			<h3 class="mb-2 text-lg font-medium">Card title</h3>
			<p class="mb-4 text-sm">{lorem}</p>
			<a href={href("/components/card")} class={buttonVariants({ variant: "default" })}>
				Go somewhere
			</a>
		</Card.Content>
	</Card.Root>
{/snippet}
{#snippet header()}
	<Card.Root>
		<Card.Header>
			<Card.Title>Card title</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-sm">{lorem}</p>
		</Card.Content>
	</Card.Root>
{/snippet}
{#snippet headerNav()}
	<Tabs.Root value="all">
		<Card.Root>
			<Card.Header class="flex items-center justify-between gap-4">
				<Card.Title>Traffic Channels</Card.Title>
				<!--
				The classic theme bleeds `.card-header-tabs` into the header with negative margins
				(`margin: -.75rem 0`) so the tabs occupy its full height. shadcn's `Tabs.List`
				is a self-contained pill, so it simply sits in the header row instead.
			-->
				<Tabs.List>
					<Tabs.Trigger value="all">All</Tabs.Trigger>
					<Tabs.Trigger value="direct">Direct</Tabs.Trigger>
				</Tabs.List>
			</Card.Header>
			<Card.Content>
				<Tabs.Content value="all"><p class="text-sm">Every channel combined.</p></Tabs.Content>
				<Tabs.Content value="direct"><p class="text-sm">Direct traffic only.</p></Tabs.Content>
			</Card.Content>
		</Card.Root>
	</Tabs.Root>
{/snippet}
{#snippet inactive()}
	<!--
	`.card-inactive` is `--bs-card-bg: transparent`, no shadow, and `border-style: dashed`
	against `--bs-border-color`.

	`border` is not redundant with `border-dashed`: shadcn's Card draws its outline with a
	ring, not a border, so its border-WIDTH is 0 and `border-dashed` alone would set a style
	on nothing — the first version of this demo rendered no outline at all. `ring-0` then
	drops the ring that would otherwise sit outside the dashes.
-->
	<Card.Root class="border border-dashed border-border bg-transparent shadow-none ring-0">
		<Card.Content>
			<p class="text-sm">{lorem}</p>
		</Card.Content>
	</Card.Root>
{/snippet}
{#snippet fill()}
	<div class="grid gap-6 md:grid-cols-2">
		<!--
			The filling card. It needs nothing to match the stack's height — a grid item stretches
			by default, which is the whole of `.card-fill`'s `height: calc(100% - 1.5rem)`.

			`my-auto` on the CONTENT is the part worth carrying over: it is the classic theme's
			`.card-fill .card-body { margin-top: auto; margin-bottom: auto }`. Note it goes on the
			body, not the card — putting `justify-center` on the card would centre the header along
			with it, where the classic theme keeps the header pinned to the top.
		-->
		<Card.Root>
			<Card.Header><Card.Title>Traffic Channels</Card.Title></Card.Header>
			<Card.Content class="my-auto">
				<div class="h-28 rounded-md bg-muted" aria-hidden="true"></div>
				<p class="mt-3 text-xs text-muted-foreground">
					Stands in for the classic theme's chart. The card is taller than this content because the
					column beside it is.
				</p>
			</Card.Content>
		</Card.Root>

		<!-- The stack that sets the row height: four cards, as in the original. -->
		<div class="flex flex-col gap-6">
			{#each stats as stat (stat.label)}
				<Card.Root>
					<Card.Content>
						<h6 class="mb-2 text-xs tracking-label text-muted-foreground uppercase">
							{stat.label}
						</h6>
						<div class="flex items-center gap-2">
							<span class="text-2xl font-medium">{stat.value}</span>
							{#if stat.delta}
								<Badge variant="success-subtle">
									{stat.delta}
								</Badge>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</div>
{/snippet}
{#snippet adjust()}
	<div class="grid gap-6 md:grid-cols-2">
		<!--
		THE PATTERN. The classic theme's `.card-adjust` is `height: 0; min-height: 100%` on a wrapper,
		with the body at `calc(100% - 60px)`. That does not transfer: the trick relies on
		the classic flex `.row`, and in a CSS grid `min-height: 100%` resolves against a
		content-sized track, so the row grows instead of containing.

		The grid-native equivalent is `relative` on the item and `absolute inset-0` on the
		card, which takes the card out of the row's height calculation entirely. The
		neighbour then sets the row height and the body scrolls inside it.

		It is also stricter than the classic theme's: `calc(100% - 60px)` hardcodes the header height,
		which breaks on the two-line headers this codebase has, while `flex-1` computes
		whatever is actually left.
	-->
		<div class="relative min-h-72">
			<Card.Root class="absolute inset-0 overflow-hidden">
				<Card.Header><Card.Title>Recent Activity</Card.Title></Card.Header>
				<Card.Content class="min-h-0 flex-1 overflow-y-auto">
					<ul class="flex flex-col gap-4">
						{#each activity as item (item.id)}
							<li class="text-sm">
								<span class="block">{item.title}</span>
								<span class="text-xs text-muted-foreground">{item.time}</span>
							</li>
						{/each}
					</ul>
				</Card.Content>
			</Card.Root>
		</div>

		<Card.Root>
			<Card.Header><Card.Title>Neighbour</Card.Title></Card.Header>
			<Card.Content>
				<p class="text-sm">
					This card sets the row height. The one beside it shrinks to match and scrolls its own body
					rather than pushing the row taller.
				</p>
			</Card.Content>
		</Card.Root>
	</div>
{/snippet}

<DocPage title="Card">
	{#snippet subtitle()}
		Cards provide a flexible and extensible content container with multiple variants and options.
		Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/card"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<DocSection title="Basic">
		{#snippet blurb()}A card with a body, a heading and an action.{/snippet}
		{@render basic()}
	</DocSection>

	<DocSection title="Card header">
		{#snippet blurb()}
			A card header of a fixed height, populated with text, buttons or a navigation. Already the
			default here — the 60px header and its rule were ported globally.
		{/snippet}
		{@render header()}
	</DocSection>

	<DocSection title="Card header navigation">
		{#snippet blurb()}A navigation placed inside the card header.{/snippet}
		{@render headerNav()}
	</DocSection>

	<DocSection title="Inactive">
		{#snippet blurb()}
			Merge a card into the background: transparent, unshadowed, with a dashed border.
		{/snippet}
		{@render inactive()}
	</DocSection>

	<DocSection title="Fill">
		{#snippet blurb()}
			Make a card fill the whole available space to fit the height of a neighbouring column — here a
			stack of four. In a CSS grid the height match is already the default, since grid items
			stretch, so only the vertical centring of the body is carried over.
		{/snippet}
		{@render fill()}
	</DocSection>

	<DocSection title="Adjust">
		{#snippet blurb()}
			Make a card shrink to its neighbour’s height, scrolling its body instead of growing the row.
		{/snippet}
		{@render adjust()}
	</DocSection>

	<!--
		The sections from here down are the card demo set, in its documented order, after the
		sections above. Three standing substitutions apply throughout, each the repository's own
		rule:

		1. NO REMOTE ASSETS. Upstream loads picsum.photos backgrounds, stock portraits and the
		   github.com/shadcn.png avatar; this repo makes no network requests at runtime (the
		   Aspect ratio and Item pages are the precedent). Photographs become captioned `bg-muted`
		   placeholder blocks and avatars keep only their initials fallback.
		2. TOKENS ONLY. The white-on-black image overlays become `background` type over a
		   `foreground` scrim — the same relationship, inverted per theme — and every raw palette
		   colour (fuchsia hero, blue verification seal) maps to the nearest semantic token.
		3. HOUSE STATUS VOCABULARY. Light and solid `success` badge variants become
		   the `success-subtle` soft family, per docs/CONVENTIONS.md §3.
	-->
	<DocSection title="Basic card">
		{#snippet blurb()}
			The full default anatomy — header with title and description, content, footer action.
		{/snippet}
		<!-- demo 1 -->
		<Card.Root class="w-full max-w-xs">
			<Card.Header>
				<Card.Title>Default Card</Card.Title>
				<Card.Description>This card uses the default size variant.</Card.Description>
			</Card.Header>
			<Card.Content>
				<p>
					The card component supports a size prop that defaults to "default" for standard spacing
					and sizing.
				</p>
			</Card.Content>
			<Card.Footer>
				<Button variant="outline" class="w-full">Action</Button>
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Card header with border">
		<!--
			demo 2 — the whole demo is one class: `border-b` on the header, which the card's
			own `[.border-b]:pb-(--card-spacing)` rule answers with matching padding.
		-->
		<Card.Root class="w-full max-w-xs">
			<Card.Header class="border-b">
				<Card.Title>Header with Border</Card.Title>
				<Card.Description>This is a card with a header that has a bottom border.</Card.Description>
			</Card.Header>
			<Card.Content>
				<p>
					The header has a border-b class applied, creating a visual separation between the header
					and content sections.
				</p>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Card with border separation">
		{#snippet blurb()}
			Zero the card's own spacing and let each region carry its padding and borders itself.
		{/snippet}
		<!-- demo 3 -->
		<Card.Root class="w-full max-w-xs gap-0 p-0">
			<Card.Header class="flex items-center justify-between px-4 py-2">
				<Card.Title>Header</Card.Title>
				<Card.Action>
					<Button variant="outline" class="w-full">Action</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content class="border-y px-4 py-3">
				<p>
					The footer has a border-t class applied, creating a visual separation between the content
					and footer sections.
				</p>
			</Card.Content>
			<Card.Footer class="px-4 py-3">
				<Button variant="outline" class="w-full">Action</Button>
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Card with header and footer">
		<!-- demo 4 — the border-b/border-t pair at the card's default spacing. -->
		<Card.Root class="w-full max-w-xs">
			<Card.Header class="border-b">
				<Card.Title>Header with Border</Card.Title>
			</Card.Header>
			<Card.Content>
				<p>
					The footer has a border-t class applied, creating a visual separation between the content
					and footer sections.
				</p>
			</Card.Content>
			<Card.Footer class="border-t">
				<Button variant="outline" class="w-full">Action</Button>
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Card with link">
		<!-- demo 5 — a link-variant button as the footer action, flush left via `px-0`. -->
		<Card.Root class="w-full max-w-xs gap-2 pt-5">
			<Card.Header>
				<Card.Title>Need a help in Claim?</Card.Title>
			</Card.Header>
			<Card.Content class="mb-2">
				<p>Go to this step by step guideline process on how to certify for your weekly benefits:</p>
			</Card.Content>
			<Card.Footer class="py-2">
				<Button variant="link" class="px-0">
					See our guideline
					<ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
				</Button>
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Card with dropdown menu">
		<!--
			demo 6. The footer button's avatar loads `github.com/shadcn.png` upstream; the
			initials fallback stands in, per the no-remote-assets rule above.
		-->
		<Card.Root class="w-full max-w-xs gap-2 pt-5">
			<Card.Header class="flex items-center justify-between">
				<Card.Title>Need a help in Claim?</Card.Title>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="ghost" size="icon" aria-label="More options">
								<EllipsisIcon aria-hidden="true" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-48">
						<DropdownMenu.Group>
							<DropdownMenu.Label>Team Settings</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								<UserIcon aria-hidden="true" />
								<span>Manage members</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<SettingsIcon aria-hidden="true" />
								<span>Team preferences</span>
							</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							<ExternalLinkIcon aria-hidden="true" />
							<span>Open dashboard</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Header>
			<Card.Content class="mb-2">
				<p>Go to this step by step guideline process on how to certify for your weekly benefits:</p>
			</Card.Content>
			<Card.Footer>
				<Button size="sm">
					<Avatar.Root class="size-5">
						<Avatar.Fallback>CH</Avatar.Fallback>
					</Avatar.Root>
					<span class="text-xs">@shadcn</span>
				</Button>
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Card with image">
		<!--
			demo 7 — a rounded media block inside the padded content. The picsum photo
			becomes the captioned placeholder; the standalone Sparkles glyph keeps an explicit
			`size-4` because no component sizes it.
		-->
		<Card.Root class="w-full max-w-xs">
			<Card.Content class="flex flex-col gap-4">
				<div
					class="flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-muted text-xs text-muted-foreground"
				>
					Photo placeholder
				</div>

				<div class="flex items-center justify-between gap-5">
					<Badge variant="outline">
						<BellIcon data-icon="inline-start" aria-hidden="true" />
						Trending
					</Badge>
					<div class="flex items-center gap-1">
						<SparklesIcon class="size-4" aria-hidden="true" />
						<span class="text-xs font-medium text-secondary-foreground">Featured</span>
					</div>
				</div>

				<p class="text-sm text-foreground">
					Simplifying your workflow from day one. Manage your tasks, projects, and team in one
					place.
				</p>

				<Button>
					Get Started
					<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Card with image scale hover effect">
		{#snippet blurb()}
			Hover the card: the media layer scales up while the scrim deepens behind the caption.
		{/snippet}
		<!--
			demo 8. The card root already carries `group/card`, so the hover state needs no
			extra group class. The photo's white-on-black overlay becomes `background` type over a
			`foreground` scrim — same contrast, and it inverts with the theme. `ring-0` is
			upstream's `border-0`: this Card draws its outline as a ring, not a border.
		-->
		<Card.Root class="relative h-96 w-full max-w-xs overflow-hidden p-0 ring-0">
			<div
				class="absolute inset-0 flex size-full items-center justify-center bg-muted text-xs text-muted-foreground transition-transform duration-500 group-hover/card:scale-110"
			>
				Photo placeholder
			</div>

			<!-- Background fade effect -->
			<div
				class="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-foreground/60 to-transparent transition-opacity duration-500 group-hover/card:from-foreground/70"
			></div>

			<!-- Content -->
			<div class="relative flex h-full flex-col justify-end p-6">
				<h3 class="text-2xl font-bold text-background">Image Scale Effect</h3>
				<p class="mt-2 text-sm text-background/90">
					This card features a smooth image scaling effect and background overlay on hover.
				</p>
			</div>
		</Card.Root>
	</DocSection>

	<DocSection title="Card with full image">
		<!--
			demo 9 — the media block runs edge to edge (`p-0` at both levels) and the card's
			own `overflow-hidden` clips its corners.
		-->
		<Card.Root class="w-full max-w-xs p-0">
			<Card.Content class="flex flex-col gap-5 p-0">
				<div
					class="flex h-48 w-full items-center justify-center overflow-hidden bg-muted text-xs text-muted-foreground"
				>
					Photo placeholder
				</div>

				<div class="flex flex-col items-center gap-4 p-6 pt-0">
					<Badge variant="outline">
						<BellIcon data-icon="inline-start" aria-hidden="true" />
						Trending
					</Badge>

					<p class="text-center text-sm text-foreground">
						Making your design process faster and easier. Design tools for your team.
					</p>

					<Button class="w-fit">
						Get Started
						<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Full card with image and shadow fade effect">
		<!--
			demo 10. Three substitutions beyond the standing ones: the stock-photo portrait
			keeps its initials fallback; upstream's hand-drawn `fill-blue-500` verification seal
			is lucide's badge-check filled with the `info` token (its check stroked in
			`background`, matching the overlay type); and the solid `success` badge becomes
			`success-subtle`. The hover scale needs its own group (`group/photo`) because the
			effect belongs to the media block here, not the card root.
		-->
		<Card.Root class="w-full max-w-xs p-0">
			<Card.Content class="flex items-center gap-5 p-0">
				<div class="group/photo relative flex h-96 w-full flex-col justify-end overflow-hidden">
					<div
						class="absolute inset-0 flex size-full items-center justify-center bg-muted text-xs text-muted-foreground transition-transform duration-500 group-hover/photo:scale-110"
					>
						Photo placeholder
					</div>

					<!-- Background fade effects -->
					<div
						class="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-foreground/60 to-transparent"
					></div>
					<div
						class="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-foreground/60 to-transparent"
					></div>

					<!-- Header -->
					<div class="absolute top-0 right-0 left-0 flex flex-wrap items-center gap-3 p-6">
						<div class="relative">
							<Avatar.Root class="size-10">
								<Avatar.Fallback>NJ</Avatar.Fallback>
							</Avatar.Root>
							<span class="absolute -top-0.5 -right-0.5">
								<BadgeCheckIcon class="size-4 fill-info text-background" aria-hidden="true" />
							</span>
						</div>
						<div class="flex flex-1 flex-col gap-px">
							<a href={href("/components/card")} class="font-medium text-background">Nick Johnson</a
							>
							<div class="text-background/80">nick@example.com</div>
						</div>

						<Badge variant="success-subtle">New</Badge>
					</div>

					<!-- Content -->
					<div class="absolute right-0 bottom-0 left-0 flex flex-col gap-2 p-6">
						<h3 class="text-2xl font-bold text-background">Author Profile</h3>
						<p class="text-background">
							Profile card showcasing the author’s avatar, name, and estimated reading time for each
							post.
						</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Card with stacked depth effect">
		<!--
			demo 11 — two offset `bg-card` layers peeking from under the card. They take the
			card's `rounded-xl` (upstream's lg belongs to its flatter radius scale) and plain
			`shadow-md`: the `shadow-black/1` tint is a raw colour the house rules out, and at 1%
			alpha it is imperceptible anyway.
		-->
		<div class="relative size-fit">
			<!-- Card -->
			<Card.Root class="relative z-1 w-full max-w-xs">
				<Card.Header>
					<Card.Title>Default Card</Card.Title>
					<Card.Description>This card uses the default size variant.</Card.Description>
				</Card.Header>
				<Card.Content>
					<p>
						The card component supports a size prop that defaults to "default" for standard spacing
						and sizing.
					</p>
				</Card.Content>
				<Card.Footer>
					<Button variant="outline" class="w-full">Action</Button>
				</Card.Footer>
			</Card.Root>
			<!-- Depth effect -->
			<div class="absolute inset-4 -bottom-3 z-0 rounded-xl border bg-card shadow-md"></div>
			<div class="absolute inset-2 -bottom-1.5 z-0 rounded-xl border bg-card shadow-md"></div>
		</div>
	</DocSection>

	<DocSection title="Advanced clean login form card">
		<!--
			demo 12 — the Field/InputGroup composition, with the password visibility toggle
			as page state. The GitHub mark is inlined ({@link githubIconPath} explains why).
		-->
		<Card.Root class="mx-auto w-full max-w-xs">
			<Card.Header>
				<Card.Title>Sign in</Card.Title>
				<Card.Description>Enter your email and password to access your account</Card.Description>
			</Card.Header>
			<Card.Content>
				<form onsubmit={(e) => e.preventDefault()} class="grid gap-6">
					<Field.Group>
						<Field.Field>
							<Field.Label for="card-login-email">Email address</Field.Label>
							<Input id="card-login-email" type="email" placeholder="name@example.com" required />
						</Field.Field>
						<Field.Field>
							<div class="flex items-center justify-between">
								<Field.Label for="card-login-password">Password</Field.Label>
								<a
									href={href("/components/card")}
									class="text-xs text-muted-foreground underline-offset-4 hover:underline"
								>
									Forgot password?
								</a>
							</div>
							<InputGroup.Root>
								<InputGroup.Input
									id="card-login-password"
									placeholder="Password"
									type={loginPasswordVisible ? "text" : "password"}
									required
								/>
								<InputGroup.Addon align="inline-end">
									<InputGroup.Button
										size="icon-sm"
										aria-label={loginPasswordVisible ? "Hide password" : "Show password"}
										onclick={() => (loginPasswordVisible = !loginPasswordVisible)}
									>
										{#if loginPasswordVisible}
											<EyeOffIcon aria-hidden="true" />
										{:else}
											<EyeIcon aria-hidden="true" />
										{/if}
									</InputGroup.Button>
								</InputGroup.Addon>
							</InputGroup.Root>
						</Field.Field>
					</Field.Group>
					<div class="flex flex-col gap-6">
						<Button type="submit" class="w-full">Sign in</Button>
						<Field.Separator class="text-xs">Or continue with</Field.Separator>
						<Button variant="outline" class="w-full">
							<svg
								viewBox="0 0 24 24"
								fill="currentColor"
								data-icon="inline-start"
								aria-hidden="true"
							>
								<path d={githubIconPath} />
							</svg>
							GitHub
						</Button>
					</div>
				</form>
			</Card.Content>
			<Card.Footer>
				<p class="w-full text-center text-xs text-muted-foreground">
					By clicking continue, you agree to our
					<a
						href={href("/components/card")}
						class="underline underline-offset-4 hover:text-primary"
					>
						Terms of Service
					</a>
				</p>
			</Card.Footer>
		</Card.Root>
	</DocSection>

	<DocSection title="Expandable billing usage card">
		{#snippet blurb()}
			The content clamps its height and fades out until the floating toggle expands it.
		{/snippet}
		<!--
			demo 13. `overflow-visible` undoes the card's own clipping so the toggle can
			straddle the bottom edge. The collapsed-state fade starts `from-card`, not upstream's
			`from-background` — it fades into the card it sits on, and here those are different
			surfaces.
		-->
		<Card.Root class="relative w-full max-w-md gap-6 overflow-visible pb-1">
			<Card.Header class="flex items-center justify-between">
				<Card.Title>3 days remaining in cycle</Card.Title>
				<Card.Action>
					<Button variant="outline" size="sm">Billing</Button>
				</Card.Action>
			</Card.Header>
			<Card.Content
				class={cn(
					"relative flex flex-col gap-5 overflow-hidden transition-all duration-500 ease-in-out",
					billingUsageOpen ? "max-h-[500px]" : "max-h-48",
				)}
			>
				<!-- Usage details -->
				<div class="flex flex-col gap-3 rounded-lg bg-muted/60 p-4">
					<div class="flex justify-between text-xs font-medium text-muted-foreground">
						<span>Included Credit</span>
						<span>On-Demand Charges</span>
					</div>
					<div class="flex justify-between text-lg font-bold">
						<span>$18.08 / $20</span>
						<span>$0</span>
					</div>
					<Progress value={90} class="h-2" />
				</div>

				<!-- Additional usage details -->
				<div class="flex flex-col gap-4">
					{#each billingUsageLines as line (line.label)}
						<div class="flex justify-between text-sm">
							<span class="font-medium text-foreground">{line.label}</span>
							<span class="text-muted-foreground">{line.value}</span>
						</div>
					{/each}
				</div>

				<!-- Faded background effect for the collapsed state -->
				<div
					class={cn(
						"pointer-events-none absolute inset-x-0 bottom-0 h-20 rounded-b-lg bg-linear-to-t from-card to-transparent transition-opacity duration-300",
						billingUsageOpen ? "opacity-0" : "opacity-100",
					)}
				></div>
			</Card.Content>

			<!-- Toggle button -->
			<div class="absolute -bottom-4 left-1/2 -translate-x-1/2">
				<Button
					variant="outline"
					size="icon-sm"
					class="rounded-full bg-background shadow-sm hover:bg-background"
					onclick={() => (billingUsageOpen = !billingUsageOpen)}
				>
					<ChevronDownIcon
						class={cn("transition-transform duration-300", billingUsageOpen && "rotate-180")}
						aria-hidden="true"
					/>
					<span class="sr-only">Toggle card</span>
				</Button>
			</div>
		</Card.Root>
	</DocSection>

	<DocSection title="Deployment status summary card">
		<!--
			demo 14 paints its hero in fuchsia — gradient wash, glow, icon. Raw palette
			colours are ruled out here, so the whole trio maps onto the primary family:
			`primary-subtle` for the wash (the token built for exactly this ground role), and
			`primary` at low alpha for the glow behind the `primary` icon.
		-->
		<Card.Root class="mx-auto w-full max-w-xs overflow-hidden p-0">
			<Card.Content class="flex flex-col items-center p-0">
				<!-- Header with gradient -->
				<div
					class="flex w-full flex-col items-center justify-center bg-linear-to-b from-primary-subtle/80 to-transparent py-12"
				>
					<div class="relative mb-6">
						<div class="absolute inset-0 scale-150 rounded-full bg-primary/10 blur-2xl"></div>
						<SquareTerminalIcon
							class="relative size-16 text-primary"
							strokeWidth={1.5}
							aria-hidden="true"
						/>
					</div>
					<h3 class="text-lg font-semibold text-foreground">Deployment Successful</h3>
					<p class="text-sm text-muted-foreground">Your app is now live</p>
				</div>

				<!-- Status rows -->
				<div class="flex w-full flex-col gap-1 px-4 pb-6">
					{#each deploymentStats as item, index (item.label)}
						<div
							class={cn(
								"flex items-center justify-between rounded-lg px-3 py-2.5",
								index % 2 === 0 && "bg-muted/40",
							)}
						>
							<span class="text-sm font-medium text-foreground">{item.label}</span>
							<span class="text-sm text-muted-foreground">{item.value}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Stat card with trend and overflow menu">
		<!--
			demo 15 — the trend badge pair takes the
			`{state}-subtle` soft family.
		-->
		<Card.Root class="w-full max-w-xs">
			<Card.Content class="flex flex-col gap-5">
				<div class="flex items-center justify-between gap-3">
					<h3 class="text-sm font-medium text-muted-foreground">{revenueStat.title}</h3>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="icon"
									class="-me-1.5"
									aria-label="More options"
								>
									<EllipsisIcon aria-hidden="true" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-48">
							<DropdownMenu.Group>
								<DropdownMenu.Item>
									<SettingsIcon aria-hidden="true" />
									Settings
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<TriangleAlertIcon aria-hidden="true" />
									Add Alert
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<PinIcon aria-hidden="true" />
									Pin to Dashboard
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<Share2Icon aria-hidden="true" />
									Share
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item variant="destructive">
									<TrashIcon aria-hidden="true" />
									Remove
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<div class="flex flex-col gap-2.5">
					<div class="flex items-center gap-2.5">
						<span class="text-2xl font-medium tracking-tight text-foreground tabular-nums">
							{revenueStat.value}
						</span>
						<Badge variant={revenueStat.positive ? "success-subtle" : "destructive-subtle"}>
							{#if revenueStat.positive}
								<ArrowUpIcon data-icon="inline-start" aria-hidden="true" />
							{:else}
								<ArrowDownIcon data-icon="inline-start" aria-hidden="true" />
							{/if}
							{revenueStat.delta}%
						</Badge>
					</div>
					<Separator />
					<div class="text-xs text-muted-foreground">
						Vs last month:
						<span class="font-medium text-foreground tabular-nums">{revenueStat.lastMonth}</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Card with header badge and actions">
		<!--
			demo 16. The `success-light` badge becomes `success-subtle` and drops upstream's
			`size="sm"` — the house Badge has one size. The stock portraits keep only their
			initials fallbacks.
		-->
		<Card.Root class="w-full max-w-sm p-0">
			<Card.Content class="p-0">
				<div class="flex items-center justify-between border-b px-3 py-2">
					<Badge variant="secondary">
						<CheckIcon data-icon="inline-start" aria-hidden="true" />
						Live
					</Badge>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="icon"
									class="text-muted-foreground"
									aria-label="More options"
								>
									<EllipsisVerticalIcon aria-hidden="true" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-32" align="end">
							<DropdownMenu.Group>
								<DropdownMenu.Item>Edit</DropdownMenu.Item>
								<DropdownMenu.Item>Copy link</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<div class="flex flex-col gap-3 p-4">
					<div class="flex items-start justify-between gap-2">
						<h3 class="text-sm leading-tight font-medium">Integration name</h3>
						<Badge variant="success-subtle">Installed</Badge>
					</div>
					<p class="text-sm text-muted-foreground">
						Short description of the integration and what it does in one line.
					</p>
					<Avatar.Group>
						<Avatar.Root class="size-6">
							<Avatar.Fallback>SC</Avatar.Fallback>
						</Avatar.Root>
						<Avatar.Root class="size-6">
							<Avatar.Fallback>MR</Avatar.Fallback>
						</Avatar.Root>
						<Avatar.Root class="size-6">
							<Avatar.Fallback>EW</Avatar.Fallback>
						</Avatar.Root>
						<Avatar.GroupCount class="size-6 border text-[10px]">+3</Avatar.GroupCount>
					</Avatar.Group>
				</div>
				<div class="border-t p-3">
					<Button variant="outline" class="w-full">Open</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Card with icon, title and link">
		<!--
			demo 17 feeds its icon through `[&_svg]` selectors because it arrives as data;
			here the icon is markup, so the tile sizes and colours it directly.
		-->
		<Card.Root class="w-full max-w-xs">
			<Card.Content class="flex flex-col gap-3">
				<div class="flex size-11 items-center justify-center rounded-md bg-primary">
					<ShoppingBagIcon class="size-5 text-primary-foreground" aria-hidden="true" />
				</div>
				<a
					href={href("/components/card")}
					class="block text-sm leading-tight font-medium text-foreground hover:text-primary"
				>
					Recent Orders Overview
				</a>
				<p class="text-xs leading-relaxed text-muted-foreground">
					Track and review all recent purchases, updates, and status changes in one place.
				</p>
				<a
					href={href("/components/card")}
					class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
				>
					View Orders
					<ChevronRightIcon class="size-2.5 shrink-0" aria-hidden="true" />
				</a>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Card with header label and link">
		<!-- demo 18 — same recipe as the previous card, with the label row as a bordered header strip. -->
		<Card.Root class="w-full max-w-xs p-0">
			<Card.Content class="p-0">
				<div class="border-b px-4 py-3">
					<div class="flex items-center gap-2 text-muted-foreground">
						<BookOpenIcon class="size-4" aria-hidden="true" />
						<span class="text-sm font-medium text-foreground">Documentation</span>
					</div>
				</div>
				<div class="flex flex-col gap-3 p-4">
					<p class="text-sm leading-relaxed text-muted-foreground">
						Find guides, API references, and examples to integrate with our platform.
					</p>
					<a
						href={href("/components/card")}
						class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
					>
						<LinkIcon class="size-2.5 shrink-0" aria-hidden="true" />
						View docs
					</a>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
