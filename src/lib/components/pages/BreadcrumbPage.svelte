<script lang="ts">
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import ChevronsRightIcon from "@lucide/svelte/icons/chevrons-right";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import HouseIcon from "@lucide/svelte/icons/house";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
	import SettingsIcon from "@lucide/svelte/icons/settings";

	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import * as Resizable from "$lib/components/ui/resizable/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
	import BreadcrumbTrail from "$lib/components/layout/BreadcrumbTrail.svelte";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { cn } from "$lib/utils.js";

	/**
	 * The Breadcrumb component page.
	 *
	 * The classic theme documents a single example here, so the page has no `DocSection`s.
	 *
	 * WHAT THE CLASSIC THEME CHANGES about the classic breadcrumb, from the reference stylesheet and the
	 * variables around it — all four are reproduced below:
	 *
	 *   padding      `breadcrumb-padding-x/y: 0`, `breadcrumb-margin-bottom: 0`; the
	 *                component is bare, and spacing belongs to whatever contains it
	 *   item gap     `breadcrumb-item-padding-x: .35rem`, applied on BOTH sides of the
	 *                separator (the classic framework pads the item left and the `::before` right)
	 *   separator    a Feather chevron at `font-size: .8rem` in `breadcrumb-divider-color`
	 *                (`gray-400`) — replacing the classic default "/" text divider
	 *   active step  `breadcrumb-active-color: gray-600`, i.e. quieter than the links
	 *
	 * That last point is the one visible inversion against shadcn, which renders the links
	 * muted and the current page at full strength. The classic framework leaves the links at
	 * `link-color` (= `primary`) and dims the page instead.
	 */

	/** `breadcrumb-item-padding-x`, on both sides of each separator. */
	const gap = "gap-[0.35rem] sm:gap-[0.35rem]";

	/**
	 * `breadcrumb-divider-color` is `gray-400` = #D2DDEC, which `--input` holds exactly.
	 *
	 * the reference stylesheet declares nothing for the breadcrumb, so the classic theme keeps that same
	 * light-mode grey in dark mode — where it would sit BRIGHTER than the link text it
	 * separates, inverting the hierarchy the light theme sets up. The dark half therefore
	 * uses the token that plays the divider's role rather than copying the value.
	 */
	const divider = "text-input dark:text-muted-foreground [&>svg]:size-[0.8rem]";

	/**
	 * The classic theme's demo links are `href="#!"`, a no-op anchor in a static page. Here the fragment
	 * IS the router, so `#!` would resolve to the home route and navigate away from the
	 * example. Every demo link on these pages points at its own route instead.
	 */
	const self = "#/components/breadcrumb";

	/**
	 * ADDENDUM — the fifteen sections below are the breadcrumb demo set, in
	 * their upstream order. The comment above describes the classic example that opens the page,
	 * which was indeed the whole page until these were added; from here down the styling is the
	 * component's own rather than the classic theme's, so the two halves read as a before/after of the same
	 * part set.
	 *
	 * FOUR STANDING SUBSTITUTIONS, each a repository rule:
	 *
	 * 1. NO REMOTE ASSETS. Upstream's avatars load `github.com/vercel.png` and
	 *    `github.com/shadcn.png`; this repo makes no network requests at runtime, so every avatar
	 *    keeps only its initials fallback (the Card and Item pages are the precedent).
	 * 2. TOKENS ONLY. The document tile in the last example is painted `bg-sky-100 text-sky-500`
	 *    upstream; here it is the `info` pair, which is the token that plays that role.
	 * 3. HOUSE STATUS VOCABULARY. A `destructive-outline` badge becomes the soft
	 *    `destructive-subtle` variant — the nearest member of the family this repo actually ships
	 *    (docs/CONVENTIONS.md §3). Badge has no `size` prop here and is already a pill, so
	 *    upstream's `size="sm" rounded-full` has nothing left to say.
	 * 4. LINKS POINT AT THIS ROUTE. Upstream writes `href="#"`; `self` above explains why every
	 *    demo link on these pages points at its own route instead.
	 *
	 * Where a demo brings its own container — the card example, and the two frame examples — the
	 * section renders it bare instead of nesting it inside the `Card` the other sections use as a
	 * stage.
	 *
	 * THE LAST SECTION IS THIS REPOSITORY'S OWN, from neither source. It documents
	 * `BreadcrumbTrail`, the trail the application header renders, because a collapse that only
	 * ever happens in the chrome is a behaviour nobody can review — and in a theme kit that is the
	 * one thing that must not happen (docs/CONVENTIONS.md §9).
	 */

	/**
	 * A deeper trail than any this application produces, so the ladder has rungs to climb.
	 *
	 * The header's own trail is three steps, which reaches its floor in one move; five shows the
	 * ellipsis absorbing the steps one at a time, root first.
	 *
	 * The labels are short on purpose. Measured, these five need ~466px and the pane opens at ~502px,
	 * so the demo starts on the WHOLE trail and the reader's first drag is what takes a step away. A
	 * longer set — `Acme Corporation` was the first draft — opens two steps down and shows the reader
	 * the end state before the start.
	 */
	const deepTrail = [
		{ label: "Home", href: self },
		{ label: "Projects", href: self },
		{ label: "Acme Corp", href: self },
		{ label: "Design system", href: self },
		{ label: "Breadcrumb" },
	];
</script>

<DocPage title="Breadcrumb">
	{#snippet subtitle()}
		Indicate the current page's location within a navigational hierarchy that automatically adds
		separators via CSS. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/breadcrumb"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<Breadcrumb.Root>
				<Breadcrumb.List class={gap}>
					<Breadcrumb.Item>
						<Breadcrumb.Link class="text-primary hover:text-primary" href={self}
							>Home</Breadcrumb.Link
						>
					</Breadcrumb.Item>
					<Breadcrumb.Separator class={divider} />
					<Breadcrumb.Item>
						<Breadcrumb.Link class="text-primary hover:text-primary" href={self}
							>Library</Breadcrumb.Link
						>
					</Breadcrumb.Item>
					<Breadcrumb.Separator class={divider} />
					<Breadcrumb.Item>
						<Breadcrumb.Page class="text-muted-foreground">Data</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Basic breadcrumb">
		{#snippet blurb()}
			The same three steps as the example above, left at the component's own defaults: muted links,
			a full-strength current page, and the built-in chevron separator. Everything below varies this
			baseline.
		{/snippet}
		<!-- demo 1 -->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Home</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Components</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Breadcrumb</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Breadcrumb with dropdown menu">
		{#snippet blurb()}
			The collapsed middle of a long trail becomes a menu: the ellipsis is the trigger, and the
			steps it stands for are its items.
		{/snippet}
		<!--
			demo 2. Upstream puts a second `sr-only` label ("Toggle menu") inside the
			trigger beside the ellipsis, which already ships its own ("More") — a screen reader would
			read both. `aria-label` on the button replaces the whole accessible name instead, so the
			trigger announces exactly once.
		-->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Home</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									{#snippet child({ props })}
										<Button {...props} variant="ghost" size="icon-sm" aria-label="Toggle menu">
											<Breadcrumb.Ellipsis />
										</Button>
									{/snippet}
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="start">
									<DropdownMenu.Item>Documentation</DropdownMenu.Item>
									<DropdownMenu.Item>Themes</DropdownMenu.Item>
									<DropdownMenu.Item>GitHub</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Components</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Breadcrumb</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Breadcrumb with a framework link">
		{#snippet blurb()}
			<code>Breadcrumb.Link</code>'s <code>child</code> snippet hands its attributes to an element you
			supply, so a router's own link component can carry the styling without the component rendering an
			anchor of its own.
		{/snippet}
		<!--
			demo 3, whose title upstream is "Breadcrumb with Next.js link" — the React
			`asChild` idiom, demonstrated on `next/link`. There is no Next.js here, so the section is
			named for what the mechanism does; the Svelte spelling of `asChild` is the `child` snippet,
			and a plain `<a>` stands in for whatever link component a router would supply.
		-->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link>
								{#snippet child({ props })}
									<a {...props} href={self}>Home</a>
								{/snippet}
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link>
								{#snippet child({ props })}
									<a {...props} href={self}>Components</a>
								{/snippet}
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Breadcrumb</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Breadcrumb with a custom slash separator">
		{#snippet blurb()}
			<code>Breadcrumb.Separator</code> renders the chevron only when it has no children — give it some
			and they replace the icon entirely.
		{/snippet}
		<!-- demo 4 -->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Home</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator>/</Breadcrumb.Separator>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Components</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator>/</Breadcrumb.Separator>
						<Breadcrumb.Item>
							<Breadcrumb.Page>Breadcrumb</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Breadcrumb with icons for each item">
		<!--
			demo 5. The icons carry `size-4` themselves: `Breadcrumb.Separator` sizes the
			svg it contains, but `Breadcrumb.Link` and `Breadcrumb.Page` deliberately do not, so an
			icon placed inside one arrives at Lucide's own 24px unless the call site says otherwise.
		-->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self} class="flex items-center gap-1.5">
								<HouseIcon class="size-4" aria-hidden="true" />
								Home
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self} class="flex items-center gap-1.5">
								<LayoutDashboardIcon class="size-4" aria-hidden="true" />
								Components
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page class="flex items-center gap-1.5">
								<SettingsIcon class="size-4" aria-hidden="true" />
								Settings
							</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Breadcrumb with ellipsis for long paths">
		{#snippet blurb()}
			The same ellipsis as the dropdown example, used on its own: the hidden middle is elided rather
			than reachable.
		{/snippet}
		<!-- demo 6 -->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Home</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Ellipsis />
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Projects</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Parallax</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Breadcrumb items with avatars">
		{#snippet blurb()}
			An organisation-then-account trail, where the first two steps are identified by their avatar
			as much as by their name.
		{/snippet}
		<!--
			demo 7. Upstream loads the two avatars from github.com; this page fetches
			nothing, so both keep only their initials fallback. The organisation avatar squares off —
			`Avatar.Root` draws its hairline ring on an `::after` pseudo-element, so the radius has to
			be overridden on the ring and the fallback too, not just on the root box.
		-->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self} class="flex items-center gap-2">
								<Avatar.Root class="size-5 rounded-sm after:rounded-sm">
									<Avatar.Fallback class="rounded-sm text-[0.625rem]">VC</Avatar.Fallback>
								</Avatar.Root>
								Vercel
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self} class="flex items-center gap-2">
								<Avatar.Root class="size-5">
									<Avatar.Fallback class="text-[0.625rem]">CN</Avatar.Fallback>
								</Avatar.Root>
								@shadcn
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Projects</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Breadcrumb with double chevron separators">
		<!--
			demo 8. The separator sizes whatever svg it contains, so the replacement icon
			needs no class of its own — it lands at the same 3.5 as the default chevron.
		-->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Dashboard</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator>
							<ChevronsRightIcon />
						</Breadcrumb.Separator>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Resources</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator>
							<ChevronsRightIcon />
						</Breadcrumb.Separator>
						<Breadcrumb.Item>
							<Breadcrumb.Page>Documentation</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Breadcrumb inside card">
		{#snippet blurb()}
			The trail as a bar of its own, tightened until the card reads as chrome around it rather than
			as a panel.
		{/snippet}
		<!--
			demo 9, rendered bare because the demo IS the card. Upstream tightens it with
			`p-2` on the card and `px-1 py-0` on the content; here both paddings come from one
			`--card-spacing`, so overriding that variable does the same job in one place — 2 for the
			vertical, with the content's horizontal nudged to 3 to match upstream's 2 + 1.
		-->
		<Card.Root class="[--card-spacing:--spacing(2)]">
			<Card.Content class="px-3">
				<Breadcrumb.Root>
					<Breadcrumb.List class="gap-1.5 sm:gap-1.5">
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self} class="flex items-center gap-1.5">
								<HouseIcon class="size-4" aria-hidden="true" />
								Home
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Products</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page class="font-semibold">Checkout</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Pill-style breadcrumb inside frame">
		{#snippet blurb()}
			The same bar again, this time on <code>Frame</code>, whose panel sits inset inside the shell —
			the trail reads as a pill rather than as an edge-to-edge strip.
		{/snippet}
		<!--
			demo 10, rendered bare for the same reason as the card example above. The
			panel's padding is a CSS variable the frame publishes, and a plain `px-3 py-2` is the same
			CSS property at the same specificity — which of the two wins would then depend on
			stylesheet order, so the override is marked important. Upstream's `gap-2` is dropped: the
			panel is not a flex container, so it addressed nothing.
		-->
		<Frame.Root>
			<Frame.Panel class="px-3! py-2!">
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self} class="flex items-center gap-1.5">
								<HouseIcon class="size-4" aria-hidden="true" />
								Home
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Products</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page class="font-semibold">Checkout</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Frame.Panel>
		</Frame.Root>
	</DocSection>

	<DocSection title="Breadcrumb items containing badge with count">
		{#snippet blurb()}
			A step can carry its own count. The badge belongs inside the link, so the whole pair is one
			hit target.
		{/snippet}
		<!--
			demo 11. Upstream's badge is `variant="destructive-outline" size="sm"` with
			`rounded-full`; this Badge has no outlined status family and no size prop, and is already a
			pill, so the soft `destructive-subtle` carries the same "unread, and it matters" reading
			with the vocabulary the theme actually has (docs/CONVENTIONS.md §3).
		-->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self} class="flex items-center gap-2">
								Inbox
								<Badge variant="destructive-subtle">3</Badge>
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Labels</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Important</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Breadcrumb starting with home icon item">
		{#snippet blurb()}
			The root step collapses to an icon button, which keeps a deep trail from spending width on the
			word "Home".
		{/snippet}
		<!--
			demo 12. The step stays one element — the anchor `Breadcrumb.Link` would have
			rendered anyway — and only takes on the button's look, via `buttonVariants`. Handing the
			link's attributes to `Button` itself does not typecheck: it is an anchor-shaped payload,
			and `Button`'s props are the intersection of the anchor and button attribute sets, whose
			`type` fields disagree. `DropdownMenuPage` reaches for `buttonVariants` for the same
			reason.
		-->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link>
								{#snippet child({ props })}
									<a
										{...props}
										href={self}
										class={cn(buttonVariants({ variant: "outline", size: "icon" }), props.class)}
									>
										<HouseIcon />
										<span class="sr-only">Home</span>
									</a>
								{/snippet}
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Help Center</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator />
						<Breadcrumb.Item>
							<Breadcrumb.Page>Getting Started</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Breadcrumb with a custom separator">
		{#snippet blurb()}
			The separator does not have to be a glyph at all — here it is a dash drawn as a rounded rule,
			which reads quieter than a chevron.
		{/snippet}
		<!--
			demo 13, which factors the dash out into a `BulletSeparator` component. Two
			instances of one span do not earn a module here, so it is inlined at both call sites.
		-->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Home</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="flex items-center">
							<span class="inline-flex h-0.5 w-2 shrink-0 rounded-full bg-foreground/30"></span>
						</Breadcrumb.Separator>
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self}>Components</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="flex items-center">
							<span class="inline-flex h-0.5 w-2 shrink-0 rounded-full bg-foreground/30"></span>
						</Breadcrumb.Separator>
						<Breadcrumb.Item>
							<Breadcrumb.Page>Breadcrumb</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button-style breadcrumb">
		{#snippet blurb()}
			Every step becomes a control: ghost buttons for the ancestors, a secondary one for the page
			you are on. The trail gains hover feedback and a wider hit target.
		{/snippet}
		<!--
			demo 14. `data-icon="inline-start"` is what tightens the button's leading
			padding around a leading icon, and the icons take no size class — the button recipe sizes
			them. The two ancestor steps borrow the recipe through `buttonVariants` rather than the
			`Button` component, for the typing reason the home-icon example above spells out.
		-->
		<Card.Root>
			<Card.Content>
				<Breadcrumb.Root>
					<Breadcrumb.List class="sm:gap-1">
						<Breadcrumb.Item>
							<Breadcrumb.Link>
								{#snippet child({ props })}
									<a
										{...props}
										href={self}
										class={cn(buttonVariants({ variant: "ghost", size: "sm" }), props.class)}
									>
										<HouseIcon data-icon="inline-start" />
										Home
									</a>
								{/snippet}
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator>
							<ChevronRightIcon />
						</Breadcrumb.Separator>
						<Breadcrumb.Item>
							<Breadcrumb.Link>
								{#snippet child({ props })}
									<a
										{...props}
										href={self}
										class={cn(buttonVariants({ variant: "ghost", size: "sm" }), props.class)}
									>
										<LayoutGridIcon data-icon="inline-start" />
										Workspace
									</a>
								{/snippet}
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator>
							<ChevronRightIcon />
						</Breadcrumb.Separator>
						<Breadcrumb.Item>
							<!--
								The current step is not a link, so its button is decorative: `disabled` would
								grey it out, and `tabindex={-1}` keeps it out of the tab order while leaving
								the filled treatment that marks it as the page you are on.
							-->
							<Breadcrumb.Page>
								<Button variant="secondary" size="sm" tabindex={-1}>
									<SettingsIcon data-icon="inline-start" />
									Settings
								</Button>
							</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Breadcrumb with project, user and document info">
		{#snippet blurb()}
			The trail as an application header: an organisation, an account with its address, and the open
			document with its filename — each step two lines rather than one word.
		{/snippet}
		<!--
			demo 15, rendered bare because the demo is a frame. Two substitutions: the
			avatars keep only their initials, since this page fetches no images, and the document tile
			— `bg-sky-100 text-sky-500` upstream, plus a hand-written dark half — becomes the `info`
			pair, which is the token that already carries that "neutral, informational" role in both
			themes.
		-->
		<Frame.Root spacing="sm">
			<Frame.Panel>
				<Breadcrumb.Root>
					<Breadcrumb.List class="gap-3 sm:gap-3">
						<Breadcrumb.Item>
							<Breadcrumb.Link href={self} class="flex items-center gap-2 text-foreground">
								<Avatar.Root size="sm">
									<Avatar.Fallback>VC</Avatar.Fallback>
								</Avatar.Root>
							</Breadcrumb.Link>
						</Breadcrumb.Item>

						<Breadcrumb.Separator class="text-muted-foreground/60">/</Breadcrumb.Separator>

						<Breadcrumb.Item>
							<Breadcrumb.Link href={self} class="flex items-center gap-3">
								<Avatar.Root size="sm">
									<Avatar.Fallback>MP</Avatar.Fallback>
								</Avatar.Root>
								<span class="flex flex-col">
									<span class="leading-tight font-medium text-foreground">shadcn</span>
									<span class="leading-tight text-muted-foreground">ui@shadcn.com</span>
								</span>
							</Breadcrumb.Link>
						</Breadcrumb.Item>

						<Breadcrumb.Separator class="text-muted-foreground/60">/</Breadcrumb.Separator>

						<Breadcrumb.Item>
							<Breadcrumb.Page class="flex items-center gap-2.5">
								<span
									class="flex size-6 items-center justify-center rounded-md bg-info-subtle text-info-subtle-foreground"
								>
									<FileTextIcon class="size-3.5" aria-hidden="true" />
								</span>
								<span class="flex flex-col">
									<span class="leading-tight font-medium text-foreground">Document</span>
									<span class="leading-tight text-muted-foreground">agents.md</span>
								</span>
							</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</Frame.Panel>
		</Frame.Root>
	</DocSection>

	<DocSection title="Breadcrumb that collapses to fit">
		{#snippet blurb()}
			Drag the handle. The trail measures the room it is given and gives up one step at a time, root
			first, into a menu that keeps every step reachable — a dropdown on a pointer, a drawer on a
			touch screen. The current page is the last thing to go and never goes entirely: once every
			ancestor is in the menu, it truncates rather than disappearing. This is the trail the
			application header above renders, at whatever width you choose for it.
		{/snippet}
		<!--
			From neither source — see the module comment. `Resizable` is the stage because a pane's width
			is set by its group rather than by its contents, which is the same property the header gives
			the trail and the one its measurement cannot do without. `overflow-hidden` clips the
			invisible full-width copy the trail measures itself against.
		-->
		<Card.Root>
			<Card.Content>
				<!--
					80/20 rather than an even split: the demo has to OPEN on the whole trail, so that what
					the reader does first is take room away. The five steps need about 450px, and the
					reading column is roughly 700 here.
				-->
				<Resizable.PaneGroup direction="horizontal" class="rounded-lg border">
					<!--
						`minSize` so the demo has a bottom. Dragged to zero the pane shows an empty box, which
						is not the last rung of the ladder — it is the absence of one. 22% is about 130px, the
						width at which the trail is the ellipsis and a few letters of the page.
					-->
					<Resizable.Pane defaultSize={80} minSize={22}>
						<div class="flex h-16 items-center overflow-hidden px-4">
							<BreadcrumbTrail trail={deepTrail} class="min-w-0 flex-1" />
						</div>
					</Resizable.Pane>
					<Resizable.Handle withHandle />
					<Resizable.Pane defaultSize={20}>
						<div class="flex h-16 items-center justify-center px-4">
							<span class="text-sm whitespace-nowrap text-muted-foreground">Narrow me</span>
						</div>
					</Resizable.Pane>
				</Resizable.PaneGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
