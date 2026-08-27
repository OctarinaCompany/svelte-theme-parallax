<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.js";
	import { navigationMenuTriggerStyle } from "$lib/components/ui/navigation-menu/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import { cn } from "$lib/utils.js";
	import BuildingIcon from "@lucide/svelte/icons/building";
	import CircleIcon from "@lucide/svelte/icons/circle";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import CircleDollarSignIcon from "@lucide/svelte/icons/circle-dollar-sign";
	import CircleHelpIcon from "@lucide/svelte/icons/circle-help";
	import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
	import RadioIcon from "@lucide/svelte/icons/radio";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import UserIcon from "@lucide/svelte/icons/user";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Navigation menu component page, ported from
	 * `https://shadcn-svelte.com/docs/components/navigation-menu`.
	 *
	 * THE CLASSIC THEME HAS NO NAVIGATION MENU. The reference docs document no such section,
	 * and there is no reference-stylesheet section. What it does theme are the two classic-framework objects
	 * this component is assembled from:
	 *
	 *   the bar    `.navbar-nav .nav-link` inside an expanded `.navbar` (the reference stylesheet, the
	 *              `.navbar-expand-*` block)
	 *   the panel  `.dropdown-menu` and `.dropdown-item`, already ported on
	 *              this app's Dropdown Menu page — the constants below restate its findings so
	 *              the two pages cannot drift
	 *
	 * So the triggers take the navbar's link treatment and the flat link lists take the dropdown
	 * menu's geometry. The MEGA MENU has no counterpart at all: a panel holding a grid, a hero
	 * tile and two-line items is not a shape the classic framework has anywhere, so the first two panels keep
	 * shadcn's own geometry and inherit only the surface.
	 *
	 * Three the classic theme facts that are deliberately NOT reproduced here:
	 *
	 *   active marker  `.navbar-nav .nav-link.active:before` draws a 1px `primary` line along
	 *                  the bottom of an expanded navbar's link, inset by
	 *                  `--bs-navbar-nav-link-padding-x`, where shadcn fills the link with
	 *                  `data-[active=true]:bg-muted/50`. The docs page has no active item, so
	 *                  there is no example here to hang it on
	 *   focus ring     `nav-link-focus-box-shadow: 0 0` removes the classic focus ring from
	 *                  nav links entirely. shadcn's `focus-visible:ring-3` is kept: once the
	 *                  hover fill is gone the ring is the only affordance a keyboard user gets
	 *                  that a mouse user does not
	 *   elevation      `dropdown-box-shadow: box-shadow` = `0 .5rem 1rem rgba(18,38,63,.15)`,
	 *                  and dark mode blanks it. Elevation is still deferred repo-wide — see the
	 *                  `card-box-shadow` note on the card rule in `app.css` — so shadcn's
	 *                  `shadow` stays
	 *
	 * The chevron needs nothing. `.dropdown-toggle::after` is Feather's chevron-down glyph
	 * (`content: '\e92e'; font-family: 'Feather'`) and Lucide, a fork of Feather, draws the same
	 * one. Its 180° rotation on open is shadcn's addition; the classic framework leaves the caret still, and
	 * it is kept as a motion detail with no classic value to contradict it.
	 *
	 * The viewport is out of reach from a call site: `navigation-menu.svelte` renders
	 * `NavigationMenuViewport` itself and passes it no `class`, so `dropdown-border-radius` and
	 * the dark border colour are returned as `app.css` rules instead.
	 */

	/**
	 * `viewport={isMobile.current}` is the docs page's own choice, and it is the classic-shaped
	 * one: above the mobile breakpoint each panel becomes its own popover anchored under its
	 * trigger, which is exactly how a classic `.dropdown-menu` sits under its
	 * `.dropdown-toggle`. Below it the panels fall back to the shared viewport, which is
	 * full-width and needs no anchoring. One instance serves every demo on the page.
	 */
	const isMobile = new IsMobile();

	/**
	 * Where every demo link on this page points.
	 *
	 * Upstream writes `href="#!"`, which in a static page is an anchor that does nothing. It is
	 * not nothing here: a fragment naming no element still writes `#!` into the address bar and
	 * spends a history entry, so a reader who tries a menu item and then presses Back only sheds
	 * the punctuation. Pointing at this page's own route is the gallery's standing answer —
	 * `BreadcrumbPage.svelte` states it in full — and the router turns a link to the page you are
	 * already on into a genuine no-op.
	 */
	const self = href("/components/navigation-menu");

	/**
	 * A top-level menu link — `.navbar-nav .nav-link` in an EXPANDED navbar:
	 *
	 *   h-auto py-2.5 px-2   `padding: .625rem var(--bs-navbar-nav-link-padding-x)`, the second
	 *                        being 0.5rem. The 10px is not arbitrary: the partial's comment says
	 *                        it exists to "align the underline with the bottom of the navbar".
	 *                        shadcn fixes the row at `h-9` (36px) instead; 10 + 22.5 + 10 gives
	 *                        42.5px, so the height has to be released as well as re-padded
	 *   rounded-none         a nav link has no radius — its hover state is not a pill
	 *   font-normal          `--bs-nav-link-font-weight` is empty, so links inherit
	 *                        `font-weight-base` (400) where shadcn asks for 500
	 *
	 * `text-sm` needs no restating: shadcn's value is `font-size-base` (15px) already.
	 *
	 * THE COLOURS ARE THE WHOLE POINT. `--bs-navbar-color` is `gray-700` and
	 * `--bs-navbar-hover-color` is `black` (`white` in dark), with NO background in any state —
	 * a classic nav link signals hover and open by darkening its type, never by filling. shadcn
	 * fills with `bg-muted`, which is the opposite convention, so every fill is neutralised here.
	 * `--foreground` is the hover colour exactly in both modes; `--muted-foreground` is the
	 * resting one exactly in dark (the classic theme switches to `secondary-color`, the same #6E84A3) and
	 * one grey step lighter in light.
	 *
	 * The base's `data-popup-open:` classes are left alone: bits-ui's trigger reports its state
	 * through `data-state` only, so that variant never matches here.
	 */
	const trigger =
		"h-auto rounded-none px-2 py-2.5 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent focus:text-foreground data-open:bg-transparent data-open:text-foreground data-open:hover:bg-transparent data-open:focus:bg-transparent";

	/**
	 * The panel, when it holds a flat list of links — `.dropdown-menu` in the compiled bundle:
	 *
	 *   min-w-40    `dropdown-min-width: 10rem`
	 *   p-0 py-2    `dropdown-padding-y: .5rem` with `dropdown-padding-x: 0` — the items run
	 *               edge to edge and supply their own inset. `p-0` is written before `py-2`
	 *               so it drops the component's `p-2 pr-2.5` outright rather than relying on
	 *               Tailwind's property order to outrank it
	 *
	 * The radius and the surface colour are handled elsewhere: in the anchored (viewport=false)
	 * mode the component already applies `rounded-md`, which is `dropdown-border-radius`
	 * (`border-radius`, 6px), and `bg-popover`, which `app.css` maps to `dropdown-bg` in both
	 * modes. The shared viewport gets its radius from an `app.css` rule instead, having no
	 * `class` prop.
	 */
	const menu = "min-w-40 p-0 py-2";

	/**
	 * The card each demo sits in, unclipped.
	 *
	 * `Card.Root` ships `overflow-hidden` in its own class list — it is how shadcn clips a
	 * first- or last-child image to the card's corner radius. Every other floating surface in
	 * this app is unaffected by that, because dropdown, popover, select and the rest render
	 * into a PORTAL at the end of `<body>`. The navigation menu does not: its panel is an
	 * absolutely positioned child of the menu itself, so it stays inside the card and the card
	 * cuts it off at its own bottom edge — which is the whole panel, since the menu bar sits on
	 * the last line of the card.
	 *
	 * `overflow-visible` is safe here specifically: the clip exists for images, and no card on
	 * this page holds one. tailwind-merge drops the base `overflow-hidden` in its favour, both
	 * being the same property.
	 *
	 * Unclipping is not enough on its own: the panel paints above STATIC content further down
	 * the page, but every demo card below holds its own `relative` nav, which paints above the
	 * panel in document order. `app.css` lifts whichever menu is open — see the
	 * `[data-slot='navigation-menu']:has(…)` rule there.
	 */
	const panelCard = "overflow-visible";

	/**
	 * One link in that list — `.dropdown-item`:
	 *
	 *   px-6 py-1.5   `dropdown-item-padding-x: 1.5rem` (the classic default, which the classic theme
	 *                 keeps) and `dropdown-item-padding-y: .375rem` (the classic theme's own, down from
	 *                 the classic .25rem), against shadcn's uniform `p-2`
	 *   rounded-none  `--bs-dropdown-item-border-radius` defaults to 0 — the item is a full-bleed
	 *                 row, not an inset pill. It is written under the component's own
	 *                 `in-data-[slot=navigation-menu-content]:` variant so the two merge; a plain
	 *                 `rounded-none` would be sorted before the variant and lose to it
	 *
	 * The hover is the same inversion as the trigger, and for the same reason:
	 * `--bs-dropdown-link-hover-bg` is TRANSPARENT in the classic theme, `dropdown-link-color` is
	 * `gray-700`, `dropdown-link-hover-color` is `black` / `white`.
	 *
	 * `.dropdown-item` is also `white-space: nowrap`, which is not carried over: two of the three
	 * lists below hold a description line that is meant to wrap.
	 */
	const item =
		"rounded-none px-6 py-1.5 font-normal text-muted-foreground in-data-[slot=navigation-menu-content]:rounded-none hover:bg-transparent hover:text-foreground focus:bg-transparent focus:text-foreground";

	/**
	 * A STACKED row — a label with a description line under it.
	 *
	 * `flex-col items-start gap-0`: the component lays a link out as a centred row, and the classic theme's
	 * items are single-line, so nothing in the reference stylesheet speaks to a stacked one. The axis is
	 * turned for the description, and the 6px `gap-1.5` closed — the two lines are one item, and
	 * `dropdown-item-padding-y` already spaces the rows.
	 *
	 * IT TAKES BACK THE COMPONENT'S HOVER FILL, for the reason the mega menu's tiles already
	 * state below: the classic theme's transparent-hover convention signals by shifting the item's text
	 * colour, and that only reads when there is one colour to shift. Here the description is
	 * pinned to `text-muted-foreground`, so the hover moved the label alone — one line out of
	 * two, by one step — and the row read as having no hover at all.
	 *
	 * No classic value is overruled by that. `.dropdown-item` is a single line of one colour;
	 * a two-line menu row is a shape the classic framework does not have, so there is nothing to be faithful
	 * to. The label still shifts colour, which is what keeps these rows in step with the
	 * single-line lists on the same page.
	 */
	const stackedItem = cn(item, "flex-col items-start gap-0 hover:bg-muted focus:bg-muted");

	/** The docs page's own list, kept verbatim so the two can be compared side by side. */
	const components: { title: string; href: string; content: string }[] = [
		{
			title: "Alert Dialog",
			href: self,
			content:
				"A modal dialog that interrupts the user with important content and expects a response.",
		},
		{
			title: "Hover Card",
			href: self,
			content: "For sighted users to preview content available behind a link.",
		},
		{
			title: "Progress",
			href: href("/components/progress"),
			content:
				"Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
		},
		{
			title: "Scroll-area",
			href: self,
			content: "Visually or semantically separates content.",
		},
		{
			title: "Tabs",
			href: self,
			content:
				"A set of layered sections of content — known as tab panels — that are displayed one at a time.",
		},
		{
			title: "Tooltip",
			href: href("/components/tooltip"),
			content:
				"A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
		},
	];

	/** The three rows of the “List” panel, and of the shared-viewport demo. */
	const pages = [
		{ title: "Components", content: "Browse all components in the library." },
		{ title: "Documentation", content: "Learn how to use the library." },
		{ title: "Blog", content: "Read our latest blog posts." },
	];

	const statuses = [
		{ label: "Backlog", icon: CircleHelpIcon },
		{ label: "To Do", icon: CircleIcon },
		{ label: "Done", icon: CircleCheckIcon },
	];

	/**
	 * The tiles of the mega menu (demo 4) — including its two
	 * deliberate icon repeats (Building for LLCs and Big companies, CircleDollarSign for
	 * Freelancers and Crypto). Upstream renders icons through its multi-set `IconPlaceholder`;
	 * this repository is lucide-only, so the tiles take the demo's `lucide` choice directly.
	 */
	const industries = [
		{ title: "Individuals", description: "Keep your finances organized.", icon: UserIcon },
		{ title: "LLCs", description: "Benefit from tax write-offs.", icon: BuildingIcon },
		{ title: "Freelancers", description: "For independent workers.", icon: CircleDollarSignIcon },
		{ title: "Investors", description: "Make and grow your money.", icon: LayoutGridIcon },
		{ title: "Small businesses", description: "We take care of your taxes.", icon: SparklesIcon },
		{ title: "Crypto", description: "For tech enthusiasts.", icon: CircleDollarSignIcon },
		{ title: "Big companies", description: "Run your finances easily.", icon: BuildingIcon },
		{ title: "Investments", description: "Launch your ideas worldwide.", icon: RadioIcon },
	];
</script>

<!--
	A grid tile inside a mega menu: a title over a clamped description. The docs page reaches for
	the `child` snippet to render its own anchor; `NavigationMenu.Link` already renders one and
	takes `href`, so the anchor is used directly and only its axis is turned — the component's
	base is `flex items-center gap-1.5`, which lays a two-line tile out sideways.

	The hover fill is left as shadcn ships it, unlike the flat lists further down. The classic theme's
	transparent-hover convention works by shifting the item's text colour, and a tile whose two
	lines are already two different colours has nothing to shift.
-->
{#snippet listItem({ title, href, content }: { title: string; href: string; content: string })}
	<li>
		<NavigationMenu.Link {href} class="flex-col items-start gap-1 p-3">
			<div class="text-sm leading-none font-medium">{title}</div>
			<p class="line-clamp-2 text-sm leading-snug text-muted-foreground">{content}</p>
		</NavigationMenu.Link>
	</li>
{/snippet}

<DocPage title="Navigation menu">
	{#snippet subtitle()}
		A collection of links for navigating websites. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/navigation-menu"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root class={panelCard}>
		<Card.Content>
			<NavigationMenu.Root viewport={isMobile.current}>
				<!--
					`flex-wrap` is the docs page's own, so a full bar does not overflow a narrow card.
					The list needs nothing else: `.navbar-nav` puts no gap between its items — the
					links carry their own padding-x — and the component is already `gap-0`.
				-->
				<NavigationMenu.List class="flex-wrap">
					<NavigationMenu.Item>
						<NavigationMenu.Trigger class={trigger}>Home</NavigationMenu.Trigger>
						<NavigationMenu.Content>
							<ul class="grid gap-2 p-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
								<li class="row-span-3">
									<!--
										The hero tile. `bg-linear-to-b from-muted/50 to-muted` is shadcn's; the classic theme
										has no gradient anywhere in the reference stylesheet, and no dropdown panel of its
										own to put one in, so the tokens are left as they are.
									-->
									<NavigationMenu.Link
										href={self}
										class="flex h-full w-full flex-col items-start justify-end rounded-md bg-linear-to-b from-muted/50 to-muted p-4 no-underline outline-hidden select-none focus:shadow-md md:p-6"
									>
										<div class="mt-4 mb-2 text-lg font-medium">shadcn-svelte</div>
										<p class="text-sm leading-tight text-muted-foreground">
											Beautifully designed components built with Tailwind CSS.
										</p>
									</NavigationMenu.Link>
								</li>
								{@render listItem({
									href: self,
									title: "Introduction",
									content: "Re-usable components built using Bits UI and Tailwind CSS.",
								})}
								{@render listItem({
									href: self,
									title: "Installation",
									content: "How to install dependencies and structure your app.",
								})}
								{@render listItem({
									href: href("/components/typography"),
									title: "Typography",
									content: "Styles for headings, paragraphs, lists…etc",
								})}
							</ul>
						</NavigationMenu.Content>
					</NavigationMenu.Item>

					<NavigationMenu.Item>
						<NavigationMenu.Trigger class={trigger}>Components</NavigationMenu.Trigger>
						<NavigationMenu.Content>
							<ul
								class="grid w-[300px] gap-2 p-2 sm:w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]"
							>
								{#each components as component (component.title)}
									{@render listItem(component)}
								{/each}
							</ul>
						</NavigationMenu.Content>
					</NavigationMenu.Item>

					<NavigationMenu.Item>
						<!--
							A menu entry that is only a link. `navigationMenuTriggerStyle()` comes from the
							navigation-menu barrel; the nav-link overrides are appended so it matches the
							two triggers beside it.
						-->
						<NavigationMenu.Link
							href={href("/components/navigation-menu")}
							class={cn(navigationMenuTriggerStyle(), trigger)}
						>
							Docs
						</NavigationMenu.Link>
					</NavigationMenu.Item>
				</NavigationMenu.List>
			</NavigationMenu.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="List">
		{#snippet blurb()}
			A panel holding nothing but links, each with a label and a line of description.
		{/snippet}
		<Card.Root class={panelCard}>
			<Card.Content>
				<NavigationMenu.Root viewport={isMobile.current}>
					<NavigationMenu.List>
						<NavigationMenu.Item>
							<NavigationMenu.Trigger class={trigger}>List</NavigationMenu.Trigger>
							<NavigationMenu.Content class={menu}>
								<ul class="grid w-[300px] gap-0">
									{#each pages as page (page.title)}
										<li>
											<NavigationMenu.Link href={self} class={stackedItem}>
												<div class="font-medium">{page.title}</div>
												<div class="text-muted-foreground">{page.content}</div>
											</NavigationMenu.Link>
										</li>
									{/each}
								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
					</NavigationMenu.List>
				</NavigationMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Simple">
		{#snippet blurb()}
			The same panel with one line per link — a straight dropdown of plain rows, with no description
			column beside them.
		{/snippet}
		<Card.Root class={panelCard}>
			<Card.Content>
				<NavigationMenu.Root viewport={isMobile.current}>
					<NavigationMenu.List>
						<NavigationMenu.Item>
							<NavigationMenu.Trigger class={trigger}>Simple</NavigationMenu.Trigger>
							<NavigationMenu.Content class={menu}>
								<ul class="grid gap-0">
									{#each ["Components", "Documentation", "Blocks"] as label (label)}
										<li>
											<NavigationMenu.Link href={self} class={item}>{label}</NavigationMenu.Link>
										</li>
									{/each}
								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
					</NavigationMenu.List>
				</NavigationMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With icon">
		{#snippet blurb()}
			Each link carries a leading icon.
		{/snippet}
		<Card.Root class={panelCard}>
			<Card.Content>
				<NavigationMenu.Root viewport={isMobile.current}>
					<NavigationMenu.List>
						<NavigationMenu.Item>
							<NavigationMenu.Trigger class={trigger}>With icon</NavigationMenu.Trigger>
							<NavigationMenu.Content class={menu}>
								<ul class="grid gap-0">
									{#each statuses as status (status.label)}
										<li>
											<!--
												`gap-2` is the docs page's value. The classic theme sizes nav icons
												(`.navbar-nav .nav-link > .fe`: `min-width: 1.75rem`, `font-size:
												font-size-lg`) but says nothing about an icon inside a
												`.dropdown-item`, so the component's own `size-4` stands.
											-->
											<NavigationMenu.Link
												href={self}
												class={cn(item, "flex-row items-center gap-2")}
											>
												<status.icon />
												{status.label}
											</NavigationMenu.Link>
										</li>
									{/each}
								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
					</NavigationMenu.List>
				</NavigationMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Shared viewport">
		{#snippet blurb()}
			Left at the component's default, every panel is rendered into one shared box below the bar,
			which resizes and slides between items. The demos above follow the shadcn-svelte documentation
			and pass <code class="text-[87.5%] text-primary"
				>viewport=&lbrace;isMobile.current&rbrace;</code
			>
			instead, so that above the mobile breakpoint each panel is anchored under its own trigger — the
			way a dropdown menu sits under its toggle.
		{/snippet}
		<Card.Root class={panelCard}>
			<Card.Content>
				<NavigationMenu.Root>
					<NavigationMenu.List>
						<NavigationMenu.Item>
							<NavigationMenu.Trigger class={trigger}>Overview</NavigationMenu.Trigger>
							<NavigationMenu.Content class={menu}>
								<ul class="grid w-[300px] gap-0">
									{#each pages as page (page.title)}
										<li>
											<NavigationMenu.Link href={self} class={stackedItem}>
												<div class="font-medium">{page.title}</div>
												<div class="text-muted-foreground">{page.content}</div>
											</NavigationMenu.Link>
										</li>
									{/each}
								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
						<NavigationMenu.Item>
							<NavigationMenu.Trigger class={trigger}>Status</NavigationMenu.Trigger>
							<NavigationMenu.Content class={menu}>
								<ul class="grid gap-0">
									{#each statuses as status (status.label)}
										<li>
											<NavigationMenu.Link
												href={self}
												class={cn(item, "flex-row items-center gap-2")}
											>
												<status.icon />
												{status.label}
											</NavigationMenu.Link>
										</li>
									{/each}
								</ul>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
					</NavigationMenu.List>
				</NavigationMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		Demo 4: a two-column grid of icon tiles closed by a
		full-width call-to-action button — the one composition the shadcn-svelte demos above do
		not have, a panel that ends in an action rather than another link row.

		The tiles keep the component's hover fill rather than taking the flat lists' transparent
		treatment, for the reason the mega-menu tiles at the top of the page already state:
		The classic theme's colour-shift hover only reads on a single-colour line, and these rows are
		already two colours. The icon needs no sizing class — `NavigationMenu.Link` applies its
		own `size-4` fallback — and a `Button asChild` around an anchor becomes the house
		Button's own `href` prop.
	-->
	<DocSection title="Navigation menu with grid layout and learn more button">
		{#snippet blurb()}
			A mega menu that ends in an action: icon tiles in a grid, with a full-width button under them.
		{/snippet}
		<Card.Root class={panelCard}>
			<Card.Content>
				<NavigationMenu.Root viewport={isMobile.current}>
					<NavigationMenu.List>
						<NavigationMenu.Item>
							<NavigationMenu.Trigger class={trigger}>Industries</NavigationMenu.Trigger>
							<NavigationMenu.Content>
								<div class="w-[500px]">
									<ul class="grid grid-cols-2 gap-1">
										{#each industries as industry (industry.title)}
											<li>
												<!--
													`items-start` is the demo's own: the icon aligns with the title's
													cap line, not the tile's centre, so the two-line description
													hangs below it.
												-->
												<NavigationMenu.Link href={self} class="items-start gap-2 p-3">
													<industry.icon />
													<div class="flex flex-col gap-0.5">
														<div class="text-sm leading-none font-medium">
															{industry.title}
														</div>
														<p class="text-xs leading-snug text-muted-foreground">
															{industry.description}
														</p>
													</div>
												</NavigationMenu.Link>
											</li>
										{/each}
									</ul>
									<div class="mt-2 px-1 pb-1">
										<Button href={self} class="w-full">Learn more</Button>
									</div>
								</div>
							</NavigationMenu.Content>
						</NavigationMenu.Item>
					</NavigationMenu.List>
				</NavigationMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		Room for the last panel to drop into.

		The same missing portal that made the panels clip and stack wrong leaves them out of flow
		but still inside the document, so nothing reserves the space they need: the tallest panel
		on this page ("Overview", 187px) hangs 169px below its card, and the page's own
		`pb-4` gutter — 16px, sized for text — does not reach it. Measured, the panel's bottom
		landed exactly on the document's, with no air under it at all.

		No other page needs this, because every other floating surface here portals to the end of
		`<body>` and is positioned against the VIEWPORT rather than the document. `h-48` (192px)
		clears the 169px and, with the gutter's own 16px, leaves 39px under an open panel.
	-->
	<div class="h-48" aria-hidden="true"></div>

	<!--
		The "Industries" panel above is taller than the "Overview" panel the `h-48` gutter
		was measured against — four tile rows plus a button footer against three text rows — so
		it needs more room than the spacer left. This tops it up rather than resizing the
		original, whose comment records the measurement it was cut to.
	-->
	<div class="h-32" aria-hidden="true"></div>
</DocPage>
