<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Empty from "$lib/components/ui/empty/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import * as Item from "$lib/components/ui/item/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Spinner component page, following shadcn-svelte's own documentation
	 * (`https://shadcn-svelte.com/docs/components/spinner.md`): the opening Item demo, then
	 * Size, Color, Button, Badge, Input group, Empty and Item — with overlay, full-page,
	 * inline and loading-dots compositions after them.
	 *
	 * THE DRAWING IS A GLYPH, NOT A BOX. shadcn's `Spinner` is Lucide's `loader-2` glyph
	 * under `animate-spin` — a drawn arc in `currentColor`. The theme deliberately adds no
	 * border-drawn ring and no pulsing-circle sibling: everything a spinner needs to vary is
	 * expressed on the glyph itself.
	 *
	 * Three knobs are the theme's own:
	 *
	 *   size    2rem (`size-8`) for a spinner standing on its own, and 1rem (`size-4`) —
	 *           already shadcn's default — wherever a spinner sits beside text
	 *   speed   0.75s per turn against Tailwind's 1s — see {@link speed}
	 *   colour  the glyph strokes in `currentColor`, so `text-*` drives it and the Colors
	 *           card needs no mechanism of its own
	 *
	 * ACCESSIBILITY IS ON THE PRIMITIVE. `spinner.svelte` defaults to `role="status"` and
	 * `aria-label="Loading"`, so a label-less composition needs no extra hidden element —
	 * the spinner already carries its own name.
	 *
	 * THE HOSTS. Badge, Input group, Empty and Item are shadcn compositions. Each host is
	 * styled here with the constants its own page derived, attributed one by one, rather
	 * than re-derived: the spinner is the variable on this page.
	 */

	/**
	 * The animation speed, and the one timing value the classic theme and Tailwind disagree on.
	 *
	 * `.spinner-border` reads its duration from `--bs-spinner-animation-speed: 0.75s`
	 * (`spinner-animation-speed`); Tailwind's `animate-spin` compiles to
	 * `animation: var(--animate-spin)` over `--animate-spin: spin 1s linear infinite`.
	 * Redefining that variable on the element is the same mechanism the classic framework itself uses, and
	 * it is the only one available here: `animate-spin` is written inside `spinner.svelte`, and
	 * a competing `animation` longhand would be decided by utility order rather than by the
	 * cascade. A custom property collides with nothing, so `cn()` keeps both classes.
	 *
	 * The second half is the classic framework's own reduced-motion rule, verbatim:
	 * `@media (prefers-reduced-motion: reduce) { --bs-spinner-animation-speed: 1.5s }`.
	 * Tailwind ships no such default, so without it the spinner keeps full speed there.
	 */
	const speed =
		"[--animate-spin:spin_0.75s_linear_infinite] motion-reduce:[--animate-spin:spin_1.5s_linear_infinite]";

	/**
	 * The loading-dots demo's dot, and the one animation on this page that TRAVELS.
	 *
	 * `animate-spin` under reduced motion is only slowed, following the classic framework's own rule
	 * above — a glyph turning in place is not the motion the setting is about. `animate-bounce`
	 * is: it translates each dot up and down, which is exactly what a reader who asks for
	 * reduced motion is asking not to be shown, and slowing it down would not change that.
	 *
	 * So the substitution is the one `app.css` already makes for the 128 loaders when the same
	 * query matches — `loader-rest`, a 45% opacity dip in place, motion swapped for a pulse
	 * rather than frozen, so the demo still reads as "working". The mechanism is `speed`'s:
	 * `animate-bounce` compiles to `animation: var(--animate-bounce)`, so redefining the
	 * variable collides with no utility and needs no `!`.
	 */
	const dot =
		"size-2 animate-bounce rounded-full bg-primary motion-reduce:[--animate-bounce:loader-rest_2s_ease-in-out_infinite]";

	/**
	 * The classic theme's Colors card, which names exactly four: `.text-primary`, `.text-secondary`,
	 * `.text-success`, `.text-danger`. The shadcn docs use `text-red-500` through
	 * `text-purple-500` — raw palette values this theme does not carry — so the four the classic theme
	 * documents replace them rather than being invented.
	 *
	 * Three are exact. `secondary` is the one near-miss that recurs across this theme:
	 * the classic `.text-secondary` resolves to `--bs-secondary-rgb` = `secondary` = `gray-700`
	 * (#6E84A3), which `--muted-foreground` holds exactly in dark mode and misses by one grey
	 * step (#95AAC9, `gray-600`) in light. See §4.1 of the theme notes.
	 */
	const colors = [
		{ label: "Primary", class: "text-primary" },
		{ label: "Secondary", class: "text-muted-foreground" },
		{ label: "Success", class: "text-success" },
		{ label: "Danger", class: "text-destructive" },
	] as const;

	/**
	 * Button geometry at the base size, as derived on the Buttons page: 15px type at
	 * `line-height-base` 1.5, `btn-padding-y: .5rem` twice and 1px of border twice = 40.5px,
	 * `btn-padding-x: .75rem`, `border-radius`, and `btn-font-weight: font-weight-normal`
	 * against shadcn's `font-medium`.
	 *
	 * The base size is used rather than the docs' `size="sm"` because the classic theme's own
	 * spinner-in-button card is `.btn.btn-primary` at full size.
	 *
	 * The two `has-data-[icon=*]` classes restate what the size variant already sets, at
	 * `btn-padding-x` instead of shadcn's value: shadcn trims 4px off whichever side carries
	 * an icon — and a `Spinner` marked `data-icon` is an icon as far as that selector is
	 * concerned — where the classic framework keeps the same padding on both. Restating the variant is what
	 * lets tailwind-merge evict it; a plain `px-*` loses, because the two are scoped
	 * differently rather than conflicting. Same trick as the Empty and Button group pages.
	 */
	const btn = {
		base: "h-10 rounded-md px-3 text-sm font-normal has-data-[icon=inline-start]:pl-3 has-data-[icon=inline-end]:pr-3",
		sm: "h-(--control-h-sm) rounded-sm px-2 text-xs font-normal has-data-[icon=inline-start]:pl-2 has-data-[icon=inline-end]:pr-2",
	} as const;

	/**
	 * `.btn-primary`, the variant the classic theme's Buttons card uses, from the classic
	 * `button-variant()`: the theme colour as fill AND as border, `color-contrast()` type, and
	 * `shade-color(value, 15%)` on hover, which `color-mix(in srgb, X 85%, black)` reproduces.
	 *
	 * The border is not decoration: shadcn's base is `border border-transparent
	 * bg-clip-padding`, so a solid button without it shows a 1px frame of whatever is behind.
	 */
	const primary =
		"bg-primary border-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_85%,black)] hover:border-[color-mix(in_srgb,var(--primary)_85%,black)]";

	/**
	 * `.btn-white` — the classic theme's secondary action, `--bs-btn-bg: white` hovering to `gray-100`,
	 * flipping in dark to `gray-800-dark` with `black` on hover. Taken from the Empty page,
	 * including the `dark:` half, which has to be stated because shadcn's `outline` variant
	 * ships `dark:bg-input/30` and `dark:hover:bg-input/50`.
	 */
	const white =
		"border-border bg-card text-card-foreground hover:bg-accent dark:border-border dark:bg-card dark:hover:bg-background";

	/**
	 * `.btn-secondary` — the same `button-variant()` output over `secondary`, and the same
	 * `gray-700` caveat as {@link colors}. Taken from the Buttons page.
	 */
	const secondary =
		"bg-muted-foreground border-muted-foreground text-primary-foreground hover:bg-[color-mix(in_srgb,var(--muted-foreground)_85%,black)] hover:border-[color-mix(in_srgb,var(--muted-foreground)_85%,black)]";

	/**
	 * The classic theme's badge, from the Badges page: `badge-padding-x: .5em` / `badge-padding-y: .33em`
	 * in `em` so the box tracks `badge-font-size: 76%`, `badge-font-weight:
	 * font-weight-normal`, `line-height: 1`, `vertical-align: middle`, and `border-radius`
	 * rather than shadcn's pill.
	 *
	 * The spinner inside it keeps the 12px that `badgeVariants` pins with `[&>svg]:size-3!` —
	 * an important declaration no call-site class can outrank, and below anything the classic framework
	 * draws, whose smallest spinner is `spinner-width-sm: 1rem`. The classic framework has no
	 * spinner-in-badge at all, so there is no classic value being contradicted here.
	 */
	const badge =
		"h-auto rounded-md px-[0.5em] py-[0.33em] align-middle text-[76%] leading-none font-normal";

	/**
	 * `.text-bg-secondary`, the badge equivalent of {@link secondary}: the full-strength theme
	 * colour as ground under `color-contrast()` type.
	 */
	const badgeSecondary = "bg-muted-foreground text-primary-foreground";

	/**
	 * `.form-control` resolves to the same 40.5px as `.btn`, so `h-10` against shadcn's `h-9`.
	 * The ground splits by mode: `input-bg` is `white` (`--card`) in light and
	 * `input-bg-dark` is `gray-700-dark`, which `--input` holds exactly — the `dark:` half
	 * also evicts shadcn's translucent `dark:bg-input/30`. Both from the Empty page.
	 *
	 * `input-group-addon-color` is `var(--bs-secondary-color)`, which is already what
	 * `inputGroupAddonVariants` uses, so the addon holding the spinner needs nothing.
	 */
	const field = "h-10 bg-card dark:bg-input";

	/** The same ground on the textarea, whose height is its own rather than `input-height`. */
	const fieldBlock = "bg-card dark:bg-input";

	/**
	 * `.list-group-item` geometry, from the Item page: `list-group-item-padding-x: 1.25rem`
	 * and `-y: 1rem`, with the 18px gap derived there from `.row.align-items-center` plus
	 * `.col.ms-n2` (24px of gutter less the classic theme's 6px `spacers` key 2).
	 */
	const row = "gap-4.5 px-5 py-4";

	/**
	 * The classic theme's secondary line is `<p class="small text-body-secondary">`:
	 * `small-font-size: 0.8125rem`, which `--text-xs` holds, against `ItemDescription`'s
	 * `text-sm` (15px in this theme). The colour is already `--muted-foreground` and is left.
	 */
	const itemDescription = "text-xs";

	/**
	 * The Empty block, all four from the Empty page: `card-spacer-{x,y}` (24px) for the pad,
	 * the `h3` step of `headings-margin-bottom` between title and description,
	 * `headings-line-height: 1.1` with `headings-letter-spacing: -.02em`, and
	 * `line-height-base` 1.5 against shadcn's `relaxed` — restated as `text-sm/normal` so
	 * tailwind-merge sees a font-size conflict and drops `text-sm/relaxed` outright.
	 */
	const empty = {
		root: "p-6",
		header: "gap-[0.84375rem]",
		title: "leading-[1.1] tracking-[-0.02em]",
		description: "text-sm/normal",
	} as const;

	/**
	 * `Empty.Media variant="icon"` as the classic theme draws an icon chip — `.avatar.avatar-sm >
	 * .avatar-title.fs-lg.bg-primary-subtle.rounded-circle.text-primary-subtle-foreground`, the form used
	 * identically ten times across `dashboard-project-management.html` and `widgets.html`.
	 * `--primary-subtle` and `--primary` are exact in both modes.
	 *
	 * The spinner inside keeps its own `size-4`: the variant sizes glyphs with
	 * `[&_svg:not([class*='size-'])]:size-6`, and `spinner.svelte` writes `size-4` into its
	 * class, so the `:not()` fails and 16px stands. That is `spinner-width-sm` exactly, and
	 * `.fs-lg` — the size the classic theme's chips give their glyph — is 17px, so nothing is gained by
	 * forcing it.
	 */
	const emptyMediaIcon = "rounded-full bg-primary-subtle text-primary-subtle-foreground";

	/**
	 * The progress track, from the Progress page: `progress-height: 1rem` (shadcn ships
	 * `h-1.5`), `progress-border-radius: 200px`, and `progress-bg` = `--bs-secondary-bg` =
	 * `gray-200`. The filled bar needs nothing — `progress-bar-bg` is `primary`.
	 */
	const track = "h-4 rounded-full bg-secondary";
</script>

<DocPage title="Spinner">
	{#snippet subtitle()}
		Indicate the loading state of a component or a page. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/spinner"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				The docs wrap this row in `[--radius:1rem]`, which rounds the item to 16px. That is
				dropped: `border-radius` is 0.375rem and `border-radius-lg` 0.5rem, and the classic theme has
				no third, rounder step — `itemVariants`' own `rounded-md` is already the right one.

				`variant="muted"` is kept as the docs ship it and has no classic counterpart: its
				`bg-muted/50` is a quiet surface, where a `.list-group-item` is either
				`list-group-bg: transparent` or `.active`, a full `primary` fill.
			-->
			<div class="flex w-full max-w-xs flex-col gap-4">
				<Item.Root variant="muted" class={row}>
					<Item.Media>
						<Spinner class={speed} />
					</Item.Media>
					<Item.Content>
						<Item.Title class="line-clamp-1">Processing payment...</Item.Title>
					</Item.Content>
					<Item.Content class="flex-none justify-end">
						<span class="text-sm tabular-nums">$100.00</span>
					</Item.Content>
				</Item.Root>
			</div>
		</Card.Content>
	</Card.Root>

	<DocSection title="Size">
		{#snippet blurb()}
			Use the size-* utility class to change the size of the spinner.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The classic theme has exactly two of these four, and they are the outer pair:

					  size-8   `spinner-width` / `spinner-height: 2rem` — the default `.spinner-border`,
					           and four times the area of the `size-4` shadcn ships as its own default
					  size-4   `.spinner-border-sm`, which sets `--bs-spinner-width: 1rem`

					`size-3` and `size-6` have no classic counterpart; they are kept from the shadcn
					docs, which is what the section is demonstrating. The one thing the classic framework changes
					alongside the size and this cannot — `spinner-border-width-sm: .2em` against the
					default `.25em` — is a border property on a `<div>`, and there is no border here.
				-->
				<div class="flex items-center gap-6">
					<Spinner class="{speed} size-3" />
					<Spinner class="{speed} size-4" />
					<Spinner class="{speed} size-6" />
					<Spinner class="{speed} size-8" />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Color">
		{#snippet blurb()}
			The spinner is drawn in currentColor, so any text colour utility recolours it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					THIS SECTION ALREADY AGREES, and it is the most direct hit on the page. The classic theme's
					blurb says it outright: "The border spinner uses currentColor for its border-color,
					meaning you can customize the color with text color utilities." Lucide draws its
					strokes in `currentColor` too, so the mechanism is identical and only the four
					colour names change — see the `colors` constant.

					`size-8` rather than the docs' `size-6`, because the classic theme's Colors card uses the
					default `.spinner-border`, i.e. `spinner-width: 2rem`.
				-->
				<div class="flex items-center gap-6">
					{#each colors as color (color.label)}
						<Spinner class="{speed} size-8 {color.class}" aria-label="Loading ({color.label})" />
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button">
		{#snippet blurb()}
			Add a spinner to a button to indicate a loading state. The button handles the spacing between
			the spinner and the text.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The classic theme documents this one, so the composition is not shadcn's invention:
					`<button class="btn btn-primary" disabled>` with a `.spinner-border.spinner-border-sm`
					before the label. Two values fall out of that and both already hold:

					  spinner size   `.spinner-border-sm` is 1rem, which is `Spinner`'s own `size-4`, and
					                 `buttonVariants` leaves it alone — its `[&_svg:not([class*='size-'])]`
					                 rule skips any icon that names its own size
					  spacing        the classic framework sets no `gap` on `.btn` at all — the reference stylesheet never
					                 mentions the property. The space between the spinner and the label
					                 is the literal whitespace text node in its markup, about 4px at
					                 `font-size-base`, against the `gap-1.5` (6px) the size variant
					                 already carries. Two pixels of nothing, left alone rather than
					                 pinned to an arbitrary value

					`disabled` is the classic theme's too. `btn-disabled-opacity` is the classic stock .65 where
					shadcn uses `opacity-50`; that is a base-class value on `buttonVariants`, not
					something a call-site class can reach, and it is the only difference left standing
					in this card.

					The three variants are the shadcn docs' set, mapped onto the three the classic theme
					actually has: `.btn-primary`, `.btn-white` (its answer to `.btn-light` being
					invisible over light grounds) and `.btn-secondary`.
				-->
				<div class="flex flex-col items-center gap-4">
					<Button disabled class="{btn.base} {primary}">
						<Spinner data-icon="inline-start" class={speed} />
						Loading.
					</Button>
					<Button variant="outline" disabled class="{btn.base} {white}">
						<Spinner data-icon="inline-start" class={speed} />
						Please wait
					</Button>
					<Button variant="secondary" disabled class="{btn.base} {secondary}">
						<Spinner data-icon="inline-start" class={speed} />
						Processing
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Badge">
		{#snippet blurb()}
			A spinner can also sit inside a badge.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					THE CLASSIC FRAMEWORK HAS NO SPINNER-IN-BADGE — `the reference docs#badges` shows text and
					`.rounded-pill` counters only, and the spinner card never leaves buttons and cards.
					The composition is shadcn's; what the classic theme supplies is the badge itself, which the
					`badge` constant restates.

					`variant="outline"` is the third one with no counterpart at all: the classic framework dropped
					outlined badges in v5, and the classic theme's quiet badge is `.text-bg-*-subtle` — a tinted
					ground carrying full-strength type, not a hairline. shadcn's outline is kept as-is
					rather than swapped for a colour the docs are not demonstrating.
				-->
				<div class="flex items-center gap-2">
					<Badge class={badge}>
						<Spinner class={speed} />
						Syncing
					</Badge>
					<Badge variant="secondary" class="{badge} {badgeSecondary}">
						<Spinner class={speed} />
						Updating
					</Badge>
					<Badge variant="outline" class={badge}>
						<Spinner class={speed} />
						Loading
					</Badge>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group">
		{#snippet blurb()}
			An input group can carry a spinner in one of its addons.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Also no classic counterpart. `.input-group` in the classic framework joins a control to a
					`.input-group-text` addon on its outer edge; it has no in-field affordance and no
					block-end row, so the second example here has nothing to compare against. The field
					itself is the classic theme's — see the `field` constant — and the addon's colour already is.
				-->
				<div class="flex w-full max-w-md flex-col gap-4">
					<InputGroup.Root class={field}>
						<InputGroup.Input placeholder="Send a message..." disabled />
						<InputGroup.Addon align="inline-end">
							<Spinner class={speed} />
						</InputGroup.Addon>
					</InputGroup.Root>
					<InputGroup.Root class={fieldBlock}>
						<InputGroup.Textarea placeholder="Send a message..." disabled />
						<InputGroup.Addon align="block-end">
							<Spinner class={speed} />
							Validating.
							<InputGroup.Button class="ms-auto {primary}" variant="default">
								<ArrowUpIcon />
								<span class="sr-only">Send</span>
							</InputGroup.Button>
						</InputGroup.Addon>
					</InputGroup.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Empty">
		{#snippet blurb()}
			A full-panel loading state, built from the empty state with a spinner in place of its icon.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					THIS IS THE CLASSIC THEME'S "CARD" EXAMPLE, one composition further on. Its spinner card ends
					with `<div class="card-body text-center"><div class="spinner-border">` — a centred
					spinner and nothing else — and `Empty.Root` is that same centred block plus the
					title, description and action the classic theme's real empty states carry
					(`project-reports.html`, `error.html`).

					`border` is on the block because the docs put it there; over the outer card it reads
					as `.card-inactive`, the classic theme's outlined empty state. The grey is the near-miss the
					Accordion and Empty pages both record — `--bs-card-outline-color` is `gray-300`
					where `--border` holds `gray-200`, exact in dark, one step lighter in light.

					The spinner is `size-4` inside a 40px chip rather than the classic theme's `.spinner-border` at
					2rem: the chip IS the `.avatar-sm` frame, and `.fs-lg` sizes its content to 17px.
					A 2rem spinner would overflow it.
				-->
				<Empty.Root class="{empty.root} w-full border md:p-6">
					<Empty.Header class={empty.header}>
						<Empty.Media variant="icon" class={emptyMediaIcon}>
							<Spinner class={speed} />
						</Empty.Media>
						<Empty.Title class={empty.title}>Processing your request</Empty.Title>
						<Empty.Description class={empty.description}>
							Please wait while we process your request. Do not refresh the page.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button variant="outline" class="{btn.sm} {white}">Cancel</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Item">
		{#snippet blurb()}
			Put the spinner in the media slot of an item to mark the whole row as busy.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`variant="outline"` is the one thing on this page that needs nothing:
					`list-group-border-color` is already `--border`, as the Item page derived.

					`Item.Media variant="icon"` pins glyphs at `size-4` through
					`[&_svg:not([class*='size-'])]`, which `Spinner`'s own `size-4` satisfies anyway —
					so the row shows `.spinner-border-sm`'s 1rem, the size the classic theme uses everywhere it
					puts a spinner next to text.

					The `[--radius:1rem]` from the docs is dropped for the reason given on the first
					demo, and the progress bar takes the Progress page's track.
				-->
				<div class="flex w-full max-w-md flex-col gap-4">
					<Item.Root variant="outline" class={row}>
						<Item.Media variant="icon">
							<Spinner class={speed} />
						</Item.Media>
						<Item.Content>
							<Item.Title>Downloading...</Item.Title>
							<Item.Description class={itemDescription}>129 MB / 1000 MB</Item.Description>
						</Item.Content>
						<Item.Actions class="hidden sm:flex">
							<Button variant="outline" class="{btn.sm} {white}">Cancel</Button>
						</Item.Actions>
						<Item.Footer>
							<Progress value={75} class={track} />
						</Item.Footer>
					</Item.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Overlay loading spinner">
		{#snippet blurb()}
			A translucent card over the content marks it as stale while fresh data loads.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 7 — the
					first composition on this page that is pure overlay pattern. The recipe:
					a second `Card` at `absolute inset-0` over the data, with
					`bg-background/80` and `backdrop-blur-xs` letting the stale numbers ghost through.

					Two departures. The wrapper gains `relative` — upstream leans on its preview frame
					for the containing block, and without one the overlay would blanket this whole page.
					And `space-y-3` becomes `flex flex-col gap-3`, the house spacing rule.

					The inner cards stay stock rather than taking this page's the classic framework-derived
					constants: the section demonstrates the overlay mechanism, and the card geometry is
					the Card page's problem, derived there once.
				-->
				<div class="relative w-full max-w-xs">
					<Card.Root>
						<Card.Header>
							<Card.Title>Monthly Report</Card.Title>
							<Card.Description>Revenue and growth metrics.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-3">
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-foreground">Revenue</span>
								<span class="font-medium">$12,450</span>
							</div>
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-foreground">Growth</span>
								<span class="font-medium">+18.2%</span>
							</div>
							<div class="flex items-center justify-between text-sm">
								<span class="text-muted-foreground">Users</span>
								<span class="font-medium">1,248</span>
							</div>
						</Card.Content>
					</Card.Root>
					<Card.Root class="absolute inset-0 z-10 bg-background/80 backdrop-blur-xs">
						<Card.Content class="flex grow flex-col items-center justify-center gap-2">
							<Spinner class="{speed} size-5 opacity-60" />
							<span class="text-sm text-muted-foreground">Refreshing data...</span>
						</Card.Content>
					</Card.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Full page loading state">
		{#snippet blurb()}
			A centred spinner with a title and a hint, for a surface that has nothing to show yet.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 8. This is the raw-card sibling of the
					Empty section above — the same centred spinner-plus-copy block, but built from a
					bare `Card` with no icon chip, no action, and the spinner dimmed to `opacity-50`
					instead of tinted `--primary`. It earns its own section because it is the shape a
					loading state takes before there is an empty state to dress it in — which is why
					the two stay separate demos.

					The `size-4` spinner is `.spinner-border-sm`'s 1rem, and the `text-xs` hint is
					`small-font-size` — both facts already derived above, nothing new to restate.
				-->
				<Card.Root class="min-h-[200px] w-full max-w-xs">
					<Card.Content class="flex grow flex-col items-center justify-center gap-4">
						<Spinner class="{speed} size-4 opacity-50" />
						<div class="flex flex-col items-center gap-1">
							<p class="text-sm font-medium">Setting up your workspace</p>
							<p class="text-xs text-muted-foreground">This may take a few seconds...</p>
						</div>
					</Card.Content>
				</Card.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Inline loading text with spinner">
		{#snippet blurb()}
			A spinner beside a line of status text, coloured to match the state it reports.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 9. The Color section above showed the
					mechanism — the glyph is `currentColor`, so `text-*` recolours it — and this one
					shows why it matters: the spinner and the word it sits next to take the same
					utility, so the pair can never disagree.

					`text-success` and `text-warning` are the house status tokens
					(§3 of the conventions); `size-3.5` sits between the small spinner's 1rem
					and nothing — the classic framework has no 14px spinner — and is kept as the demo ships it,
					since a spinner riding a `text-sm` line is exactly where an off-ramp size is earned.
				-->
				<div class="mx-auto flex w-full max-w-xs flex-col gap-3">
					<div class="flex items-center gap-2">
						<Spinner class="{speed} size-3.5" />
						<span class="text-sm text-muted-foreground">Checking availability...</span>
					</div>
					<div class="flex items-center gap-2">
						<Spinner class="{speed} size-3.5 text-success" />
						<span class="text-sm">
							<span class="font-medium text-success">Connected</span>
							<span class="text-muted-foreground"> — syncing data</span>
						</span>
					</div>
					<div class="flex items-center gap-2">
						<Spinner class="{speed} size-3.5 text-warning" />
						<span class="text-sm">
							<span class="font-medium text-warning">Reconnecting</span>
							<span class="text-muted-foreground"> — attempt 3 of 5</span>
						</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Animated loading dots">
		{#snippet blurb()}
			Three staggered dots as a lighter alternative to the spinner glyph.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 10, and the one demo on this page that
					uses no `Spinner` at all: three `bg-primary` dots under `animate-bounce`, staggered
					by negative `animation-delay` so they read as a wave. The classic framework's nearest relative
					is `.spinner-grow` — a pulsing filled circle — but that scales one circle in place
					rather than bouncing three, so nothing transfers and the demo markup stands as-is.

					The page's `speed` constant does not apply: it retunes `--animate-spin`, and
					`animate-bounce` reads `--animate-bounce` — see {@link dot}, which is where the
					reduced-motion answer for this one lives. `role="status"` with an `aria-label`
					restores what `spinner.svelte` provides by default and bare spans do not.
				-->
				<div class="flex items-center justify-center gap-1.5" role="status" aria-label="Loading">
					<span class="{dot} [animation-delay:-0.3s]"></span>
					<span class="{dot} [animation-delay:-0.15s]"></span>
					<span class={dot}></span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
