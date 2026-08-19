<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Empty from "$lib/components/ui/empty/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import * as Kbd from "$lib/components/ui/kbd/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import ArrowUpRightIcon from "@lucide/svelte/icons/arrow-up-right";
	import BellIcon from "@lucide/svelte/icons/bell";
	import CloudIcon from "@lucide/svelte/icons/cloud";
	import FolderCodeIcon from "@lucide/svelte/icons/folder-code";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import RefreshCcwIcon from "@lucide/svelte/icons/refresh-ccw";
	import SearchIcon from "@lucide/svelte/icons/search";
	// Icons for the gallery sections appended below the shadcn-svelte ones.
	import BookmarkIcon from "@lucide/svelte/icons/bookmark";
	import ChartColumnIcon from "@lucide/svelte/icons/chart-column";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import FileIcon from "@lucide/svelte/icons/file";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import InboxIcon from "@lucide/svelte/icons/inbox";
	import UserPlusIcon from "@lucide/svelte/icons/user-plus";
	import UsersIcon from "@lucide/svelte/icons/users";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Empty component page, ported from shadcn-svelte's own documentation
	 * (`/docs/components/empty`): the opening "No Projects Yet" demo, then Outline, Background,
	 * Avatar, Avatar group and InputGroup.
	 *
	 * THE CLASSIC THEME HAS NO EMPTY COMPONENT — no reference-stylesheet section, no `empty-*` variable, and
	 * the reference docs document nothing of the kind; the theme's only matches for
	 * "empty" are `modal-kanban-task-empty.html`, an unrelated modal. What it does have is the
	 * PATTERN, built out of parts it documents elsewhere, and one page that shows it whole:
	 *
	 *   `project-reports.html`   <div class="card card-inactive">
	 *                              <div class="card-body text-center">
	 *                                <img class="img-fluid" style="max-width: 182px">
	 *                                <h1>No reports yet.</h1>
	 *                                <p class="text-body-secondary">Create a report to …</p>
	 *                                <a class="btn btn-primary">Create Report</a>
	 *
	 * That block is the reference for everything below: `.card-inactive` for the
	 * outlined variant, its default margins for the vertical rhythm, `.text-body-secondary` for
	 * the description, `.btn-primary` for the action. `error.html` is the same object at page
	 * scale — a 404 built from the identical four pieces — and confirms the reading.
	 *
	 * Two further parts come from elsewhere in the theme: `.avatar > .avatar-title`, which is
	 * what `Empty.Media` draws, and `.dz-message`, the theme's other dashed placeholder box.
	 *
	 * Three things have no classic counterpart at all and keep shadcn's default, each said
	 * plainly where it happens: the gradient of the Background section (the classic
	 * `enable-gradients` is left `false` and the theme compiles no linear-gradient utility),
	 * `<kbd>` (there is no `kbd-*` override anywhere in the reference source) and `Empty.Content`'s own
	 * gap (the classic theme stacks the action directly after the paragraph, with nothing between them).
	 *
	 * NO REMOTE ASSETS. The classic theme's empty state leads with an SVG illustration and the docs' two
	 * avatar demos load photos from github.com; this repo makes no network requests at runtime,
	 * so the illustration becomes `Empty.Media variant="icon"` and the photos become
	 * `Avatar.Fallback`. The second substitution is not a loss for the theme — the fallback IS
	 * `.avatar-title`, which is the one avatar part the classic theme gives colours to.
	 *
	 * ICONS. The docs' examples mix Lucide and Tabler; only Lucide is installed here, and it is
	 * Feather's maintained successor, which is the icon font the classic theme itself uses.
	 */

	/**
	 * `.card-body` is `padding: card-spacer-y card-spacer-x`, both `spacer` = 1.5rem, against
	 * shadcn's `p-12` (48px).
	 *
	 * The house frame wraps every example in a `Card.Content` that already carries that 24px, so
	 * on this page the value shows up twice — the outer card's padding, then the block's own. In
	 * the classic theme the two are the same element, and the demos below are the only place they are not.
	 *
	 * `Empty.Root`'s `gap-4` is left alone: the classic reboot gives `<p>` `margin-bottom: 1rem`,
	 * which is exactly the space between the paragraph and the button in the block above, and
	 * exactly what `gap-4` already is. `text-center` matches `.card-body.text-center` too.
	 */
	const root = "p-6";

	/**
	 * The gap between the title and the description. The classic theme sets no margin class there at all —
	 * the heading's own `headings-margin-bottom` supplies it, and the reference stylesheet scales that per
	 * level: full 1.125rem for `h1`/`h2`, three quarters for `h3`, half for `h4`–`h6`.
	 *
	 * `Empty.Title` renders at `h3-font-size` (see {@link title}), so it takes the `h3` step:
	 * `spacer * .75 * .75` = 0.84375rem, the same value the Typography page writes as
	 * `mb-[0.84375rem]`. shadcn's `gap-2` is 8px against that 13.5px.
	 *
	 * The distance from the media to the title gets the same gap for want of anything to measure
	 * it against — the classic theme's illustration is a 182px-wide SVG whose own whitespace does that job,
	 * so `Empty.Media`'s `mb-2` is left in place rather than reasoned about.
	 */
	const header = "gap-[0.84375rem]";

	/**
	 * `Empty.Title` is `text-lg font-medium tracking-tight`, and two of those three are already
	 * the classic theme: `text-lg` is 1.0625rem here — `app.css` maps that step to `font-size-lg`, which
	 * is the same value as `h3-font-size` — and `font-medium` is `headings-font-weight: 500`.
	 *
	 * The classic theme's own empty state titles with an `h1` (1.625rem from `md` up). The card-scale step
	 * is kept anyway: `Empty` is used inside panels and list bodies, not only as a whole page,
	 * and `text-lg` lands on a real classic heading size rather than on an invented one.
	 *
	 * What is missing is the heading treatment `app.css` deliberately withholds from this step,
	 * because `text-lg` also plays `font-size-lg` in non-heading roles: `headings-line-height:
	 * 1.1` against the inherited 1.5, and `headings-letter-spacing: -.02em` against Tailwind's
	 * `tracking-tight` (-0.025em). Same two values, same reasoning, as the Typography page's
	 * `heading` constant.
	 */
	const title = "leading-[1.1] tracking-[-0.02em]";

	/**
	 * `Empty.Description` is `text-sm/relaxed text-muted-foreground`. The colour is already
	 * the classic theme's — `.text-body-secondary` is `body-secondary-color` = `gray-600`, which
	 * `--muted-foreground` holds exactly, and it is the class on the subtitle of both the classic theme
	 * empty states. The leading is not: `relaxed` is 1.625 where `line-height-base` is 1.5.
	 *
	 * Restated as `text-sm/normal` rather than as a bare `leading-normal` so tailwind-merge sees
	 * a font-size conflict and drops `text-sm/relaxed` outright — the two would otherwise both
	 * survive, tie on specificity, and be decided by stylesheet order.
	 */
	const description = "text-sm/normal";

	/**
	 * `Empty.Media variant="icon"` is a 40px rounded chip with a 24px glyph. The classic theme draws that
	 * object as `.avatar.avatar-sm > .avatar-title`, and the one form its own pages use for
	 * icons — 10 occurrences across `dashboard-project-management.html` and `widgets.html`,
	 * every one identical — is
	 *
	 *   <div class="avatar avatar-sm">
	 *     <div class="avatar-title fs-lg bg-primary-subtle rounded-circle text-primary-subtle-foreground">
	 *
	 * so the chip is a primary-subtle circle, not a grey rounded square:
	 *
	 *   size-10        `avatar-size-sm: 2.5rem` — shadcn's default already, unchanged
	 *   rounded-full   `.rounded-circle`, against shadcn's `rounded-lg`
	 *   bg + text      `.bg-primary-subtle.text-primary-subtle-foreground` — `--primary-subtle` and `--primary`
	 *                  are exact in both modes, so nothing is approximated here
	 *
	 * The plain `.avatar-title` default is a different pair of colours, used by the group demos
	 * below; see {@link avatarTitle}.
	 */
	const mediaIcon = "rounded-full bg-primary-subtle text-primary-subtle-foreground";

	/**
	 * The glyph size, which has to sit on the icon rather than on the chip.
	 *
	 * `.avatar` sets `font-size: calc(var(--bs-avatar-size) / 3)` and the icon chips override it
	 * with `.fs-lg` = `font-size-lg` = 1.0625rem, so the classic theme's glyph is 17px where shadcn's is
	 * 24px. The variant states its own size as `[&_svg:not([class*='size-'])]:size-6`, so a
	 * competing `[&_svg]:*` written on the chip would tie with it on specificity; putting the
	 * class on the icon makes the `:not()` fail instead, which the selector decides rather than
	 * source order.
	 */
	const mediaGlyph = "size-[1.0625rem]";

	/**
	 * `.avatar-title` in its default colours: `avatar-title-bg` under `avatar-title-color:
	 * white` (`--primary-foreground`, white in both modes). This is what a photoless the classic theme
	 * avatar looks like — see the `+7` group-overflow chips in `profile-groups.html`.
	 *
	 * THE GROUND NEEDS BOTH MODES SPELLED OUT, and neither is exact. `avatar-title-bg` is
	 * `gray-500` (#B1C2D9) in light and `avatar-title-bg-dark` is `gray-600-dark` (#244166);
	 * no token holds either. `--muted-foreground` is #95AAC9 (gray-600), one grey step darker
	 * than the light value, and `--secondary` is #1E3A5C (gray-700-dark), one step darker than
	 * the dark one — the same near-miss the Progress track and the Switch already document. They
	 * land on different tokens, so the `dark:` half cannot be avoided: in dark mode
	 * `--muted-foreground` is a light grey, i.e. the opposite of what is wanted.
	 *
	 * `--input` (#D2DDEC, gray-400) is gray-500's other neighbour in light and is closer in
	 * name, but white type on it is illegible; the darker neighbour is chosen for that reason.
	 */
	const avatarTitle = "bg-muted-foreground text-primary-foreground dark:bg-secondary";

	/**
	 * `Avatar.Root` draws `after:border after:border-border` — a 1px hairline inside the circle.
	 * The classic theme's `.avatar` has no border at any size; the only thing its `:after` does is preload
	 * the group mask images.
	 */
	const avatar = "after:border-0";

	/**
	 * Button geometry, as derived on the Buttons page: `input-btn-*` resolved rather than
	 * guessed, `btn-font-weight: font-weight-normal` against shadcn's `font-medium`, and
	 * `border-radius-{,sm}` because the classic framework changes the corner with the size.
	 *
	 *   base  15px x 1.5 line-height + 2 x .5rem padding + 2 x 1px border = 40.5px -> h-10
	 *   sm    13px x 1.75            + 2 x .125rem       + 2px            = 28.75px — the reference; rendered at the ramp's `--control-h-sm` (32px, the divergence `app.css` records)
	 *
	 * The two `has-data-[icon=*]` classes restate what the size variant already sets, at
	 * `btn-padding-x` instead of shadcn's value: shadcn trims 4px off whichever side carries an
	 * icon, the classic framework keeps the same padding on both. Restating the variant is what lets
	 * tailwind-merge evict it — a plain `px-*` loses, because the two are scoped differently
	 * rather than conflicting. Same trick as the Button group page's radii.
	 */
	const btn = {
		base: "h-10 rounded-md px-3 text-sm font-normal has-data-[icon=inline-start]:pl-3 has-data-[icon=inline-end]:pr-3",
		sm: "h-(--control-h-sm) rounded-sm px-2 text-xs font-normal has-data-[icon=inline-start]:pl-2 has-data-[icon=inline-end]:pr-2",
	} as const;

	/**
	 * `.btn-primary`, the action on both of the classic theme's empty states, from the classic
	 * `button-variant()`: the theme colour as fill AND as border, `color-contrast()` type, and
	 * `shade-color(value, 15%)` on hover — which `color-mix(in srgb, X 85%, black)` reproduces
	 * exactly.
	 *
	 * The border is not decoration. shadcn's base is `border border-transparent
	 * bg-clip-padding`, so a solid button without it shows a 1px frame of whatever is behind.
	 */
	const primary =
		"bg-primary border-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_85%,black)] hover:border-[color-mix(in_srgb,var(--primary)_85%,black)]";

	/**
	 * `.btn-white` — the classic theme's answer to the classic `light` variant not working over light
	 * grounds, and the theme's actual secondary action. `--bs-btn-bg: white` with
	 * `--bs-btn-hover-bg: gray-100`, flipping in dark to `gray-800-dark` with `black` on hover.
	 *
	 * The dark half has to be stated even though this is applied to shadcn's `outline` variant,
	 * because that variant ships `dark:bg-input/30 dark:hover:bg-input/50` — a translucent field
	 * colour that would otherwise survive.
	 *
	 * The border is one grey step off in both modes, exactly as the Buttons page records:
	 * The classic theme asks for `gray-300` / `gray-600-dark`, `--border` holds `gray-200` /
	 * `gray-700-dark`. Neither grey has a token, and inventing two for one button variant costs
	 * more than the difference is worth.
	 */
	const white =
		"border-border bg-card text-card-foreground hover:bg-accent dark:border-border dark:bg-card dark:hover:bg-background";

	/**
	 * `.btn-link` — `link-color` type on nothing. NO UNDERLINE at rest or on hover:
	 * `link-decoration` and `link-hover-decoration` are both `none`, where shadcn's `link`
	 * variant underlines on hover.
	 *
	 * `link-hover-color` is `darken(link-color, 15%)` = #1657AF, and `darken()` moves HSL
	 * lightness, which no CSS function reproduces. The 70/30 mix lands at #1F56A1 — the same
	 * stand-in the Buttons and Typography pages use, and honest about being a token rather than
	 * a pasted hex.
	 */
	const link =
		"text-primary no-underline hover:no-underline hover:text-[color-mix(in_srgb,var(--primary)_70%,black)]";

	/**
	 * The in-card demos (demo 5, demo 8, demo 12) size their own card
	 * `w-full max-w-md` and centre it in a preview frame. The frame here is the section's card,
	 * so the demo card centres inside that instead — the width itself is upstream's, kept.
	 */
	const demoCard = "mx-auto w-full max-w-md";
</script>

<DocPage title="Empty">
	{#snippet subtitle()}
		Displays an empty state — the placeholder for a list, a panel or a page that has nothing in it
		yet. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/empty"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<Empty.Root class={root}>
				<Empty.Header class={header}>
					<Empty.Media variant="icon" class={mediaIcon}>
						<FolderCodeIcon class={mediaGlyph} />
					</Empty.Media>
					<Empty.Title class={title}>No Projects Yet</Empty.Title>
					<Empty.Description class={description}>
						You haven't created any projects yet. Get started by creating your first project.
					</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<div class="flex gap-2">
						<Button class="{btn.base} {primary}">Create Project</Button>
						<Button variant="outline" class="{btn.base} {white}">Import Project</Button>
					</div>
				</Empty.Content>
				<!--
					The docs wrap an `<a>` inside a `<Button variant="link">`, which nests two
					interactive elements. `Button` renders an `<a>` itself when given `href`, so the
					link goes straight to it — same output, one element.

					`text-muted-foreground` from the docs is dropped: `.btn-link` is `link-color` =
					`primary`, and a muted link is not a treatment the classic theme has.
				-->
				<Button href="#/components/empty" variant="link" class="{btn.sm} {link}">
					Learn More
					<ArrowUpRightIcon data-icon="inline-end" />
				</Button>
			</Empty.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Outline">
		{#snippet blurb()}
			Add a border to draw the empty state as an outlined block.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					THIS IS THE ONE THAT ALREADY AGREES, and it is the most direct hit on the page:
					`.card-inactive` is the classic theme's outlined empty state, the class on the
					"No reports yet." block in `project-reports.html`. All four of its declarations are
					what shadcn already draws:

					  --bs-card-bg: transparent          `Empty.Root` paints no background
					  --bs-card-box-shadow: none         it has no shadow either
					  border-style: dashed               `border-dashed` is in its base class
					  radius                             `card-border-radius` is `border-radius-lg`
					                                     (0.5rem), which `rounded-lg` is here

					`--bs-card-outline-color: var(--bs-border-color)` is the only near-miss, and it is
					the one the Accordion page already documents: `gray-300` (#E3EBF6) in light where
					`--border` carries `gray-200` (#EDF2F9), one step lighter, and `--input` carries
					#D2DDEC, one step darker. In DARK the two agree exactly — both are
					`gray-700-dark`. A plain `border` is left to resolve to `--border` through the
					`@layer base` rule in `app.css`; the grey itself has no token.

					`.dz-message` is the theme's other dashed box and asks
					for something different — a `input-bg` ground, `input-border-color` at
					`border-radius`, `padding: 5rem 1rem`. That is a drop target sized to be dropped
					on, not a message block, so `.card-inactive` is the counterpart used here.
				-->
				<Empty.Root class="{root} border border-dashed">
					<Empty.Header class={header}>
						<Empty.Media variant="icon" class={mediaIcon}>
							<CloudIcon class={mediaGlyph} />
						</Empty.Media>
						<Empty.Title class={title}>Cloud Storage Empty</Empty.Title>
						<Empty.Description class={description}>
							Upload files to your cloud storage to access them anywhere.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button variant="outline" class="{btn.sm} {white}">Upload Files</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Background">
		{#snippet blurb()}
			Use the background utilities to add a background to the empty state.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					NO CLASSIC-THEME COUNTERPART for the gradient. The classic `enable-gradients` is left at
					its default `false` and the classic theme never sets it, so the theme compiles no
					`.bg-gradient-*` utilities at all; its only gradient is `.bg-ellipses`
					(the reference utilities), a radial wash of a theme colour used behind page
					headers. A linear surface fade is shadcn's idea and is kept as the point of the
					example.

					The stops are re-pointed, though. `from-muted/50` is `gray-200` at half strength,
					which is a classic grey; `to-background` is `gray-100`, the PAGE ground — and this
					block sits on a card, so the fade would end on a colour the card is not. `to-card`
					is `card-bg`, which is what is actually behind it.

					`h-full` from the docs is dropped: it sizes the block against a docs preview frame
					that does not exist here.
				-->
				<Empty.Root class="{root} bg-gradient-to-b from-muted/50 from-30% to-card">
					<Empty.Header class={header}>
						<Empty.Media variant="icon" class={mediaIcon}>
							<BellIcon class={mediaGlyph} />
						</Empty.Media>
						<Empty.Title class={title}>No Notifications</Empty.Title>
						<Empty.Description class={description}>
							You're all caught up. New notifications will appear here.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button variant="outline" class="{btn.sm} {white}">
							<RefreshCcwIcon data-icon="inline-start" />
							Refresh
						</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar">
		{#snippet blurb()}
			Use the media slot to put an avatar at the top of the empty state.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<!--
							`variant="default"` is `bg-transparent` — the chip steps aside and the avatar is
							the media. Nothing to port: the classic theme has no wrapper here either, it puts the
							`.avatar` straight into the block.
						-->
						<Empty.Media variant="default">
							<!--
								`size-12` is `avatar-size-base: 3rem` exactly, so the docs' own value is
								already the classic one and stays.

								`.avatar` sizes its content with `font-size: calc(var(--bs-avatar-size) / 3)`,
								which at 48px is 16px — one pixel above the `text-sm` (15px,
								`font-size-base`) the fallback inherits, and worth stating because it is a
								ratio rather than a step off a scale.

								The docs load a photo from github.com and grayscale it. This repo makes no
								network requests at runtime, so the fallback stands in — which is also the
								only avatar part the classic theme gives colours to.
							-->
							<Avatar.Root class="size-12 {avatar}">
								<Avatar.Fallback class="text-[1rem] {avatarTitle}">LR</Avatar.Fallback>
							</Avatar.Root>
						</Empty.Media>
						<Empty.Title class={title}>User Offline</Empty.Title>
						<Empty.Description class={description}>
							This user is currently offline. You can leave a message to notify them or try again
							later.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button class="{btn.sm} {primary}">Leave Message</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar group">
		{#snippet blurb()}
			The media slot takes an avatar group just as well as a single avatar.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- `border` is `.card-inactive` again; see the Outline section for the reading. -->
				<Empty.Root class="{root} flex-none border">
					<Empty.Header class={header}>
						<Empty.Media variant="default">
							<!--
								`.avatar-group` overlaps by a RATIO, not by a fixed amount:
								`.avatar + .avatar { margin-left: calc(var(--bs-avatar-size) * .25 * -1) }`.
								At `avatar-size-sm` (40px) that is -10px where shadcn's group hardcodes -8px,
								so `-space-x-2.5` — and it has to be restated whenever the size changes.

								`size-10` is `avatar-size-sm`; shadcn's default `size-8` (32px) is a step
								the classic theme does not have at all, its neighbours being `avatar-size-xs` (26px)
								and this one. It is written on each avatar rather than as a `*:` rule on the
								group, which would tie on specificity with the component's own `size-8` and
								leave the winner to source order. The fallback then wants `calc(40px / 3)` =
								13.33px, which `text-xs` (`font-size-sm`, 13px) hits to within a third of a
								pixel.

								The classic theme separates the circles by masking a notch out of each
								(`masks/avatar-group.svg`), so the ground shows through between them. That is
								a raster asset this repo will not load; shadcn's `ring-2` in the ground colour
								is the same effect drawn additively. The ring COLOUR is the fix that matters —
								`ring-background` is the page, and these sit on a card.
							-->
							<Avatar.Group class="-space-x-2.5 *:data-[slot=avatar]:ring-card">
								{#each ["CN", "LR", "ER"] as initials (initials)}
									<Avatar.Root class="size-10 {avatar}">
										<Avatar.Fallback class="text-xs {avatarTitle}">{initials}</Avatar.Fallback>
									</Avatar.Root>
								{/each}
							</Avatar.Group>
						</Empty.Media>
						<Empty.Title class={title}>No Team Members</Empty.Title>
						<Empty.Description class={description}>
							Invite your team to collaborate on this project.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button class="{btn.sm} {primary}">
							<PlusIcon data-icon="inline-start" />
							Invite Members
						</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group">
		{#snippet blurb()}
			An input group can be placed in the content slot, in place of an action button.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<Empty.Title class={title}>404 - Not Found</Empty.Title>
						<Empty.Description class={description}>
							The page you're looking for doesn't exist. Try searching for what you need below.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<!--
							`.form-control` resolves to the same 40.5px as `.btn` — 15px x 1.5 line-height,
							`input-padding-y: .5rem` twice, 1px of border twice — so `h-10` against
							shadcn's `h-9`. Two more properties already agree and are left alone:
							`input-border-radius` is `border-radius` (`rounded-md`) and
							`input-border-color` is `--input` (`border-input`).

							The ground splits by mode: `input-bg` is `white` in light, which is `--card`,
							and `input-bg-dark` is `gray-700-dark`. shadcn paints only the dark half and
							paints it translucent (`dark:bg-input/30`); the classic theme's field is opaque, and
							`--input` is that exact colour in dark, so `dark:bg-input` both restores the
							opacity and evicts the fraction.

							`input-group-addon-color` is `var(--bs-secondary-color)`, which is
							`--muted-foreground` — already what the addon uses. `input-placeholder-color`
							is `gray-500` (#B1C2D9) against the #95AAC9 (gray-600) shadcn uses: one grey
							step, and gray-500 has no token, so it is left.
						-->
						<InputGroup.Root class="h-10 bg-card sm:w-3/4 dark:bg-input">
							<InputGroup.Input placeholder="Try searching for pages..." />
							<InputGroup.Addon>
								<SearchIcon />
							</InputGroup.Addon>
							<InputGroup.Addon align="inline-end">
								<!--
									The classic theme never styles `<kbd>` — there is no `kbd-*` override anywhere in
									the reference source and the theme uses the element nowhere, so the classic stock
									treatment applies and shadcn's chip is kept as-is.
								-->
								<Kbd.Root>/</Kbd.Root>
							</InputGroup.Addon>
						</InputGroup.Root>
						<!--
							`Empty.Description` styles its links `underline underline-offset-4`, hovering to
							`--primary`. The classic theme inverts both halves: `link-color: primary` at rest with
							`link-decoration: none`, and the hover changes the COLOUR, not the decoration.
							The mix is the same #1657AF stand-in {@link link} explains.
						-->
						<Empty.Description
							class="{description} [&>a]:text-primary [&>a]:no-underline [&>a:hover]:text-[color-mix(in_srgb,var(--primary)_70%,black)]"
						>
							Need help? <a href="#/components/empty">Contact support</a>
						</Empty.Description>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		Everything below this line is a SECOND gallery. It composes the same shadcn
		Empty parts the page above documents, so every classic constant in the script block
		applies unchanged and is not re-argued per section.

		Four gallery entries are not repeated because a section above already shows the same
		thing: demo 1 is the opening "No Projects Yet" demo, demo 3 is the
		Input group section's 404, demo 6 is the Outline section's dashed upload box,
		and demo 9 is the Background section's muted notifications block.

		Two translations recur and are stated once here rather than per section:

		- The demos pad their blocks `py-12` / `py-16` against a docs preview frame that does not
		  exist here — the same frame whose `h-full` the Background section drops. The page's
		  {@link root} padding stands in everywhere.
		- The illustration demos paint their foreground surfaces and fade overlays with the
		  `background` token. These blocks sit on a card, so `background` (the PAGE ground,
		  `gray-100` in light) is precisely the colour behind them that they are not —
		  the same re-pointing the Background section records. `card` replaces it throughout.
	-->

	<DocSection title="Search empty state">
		{#snippet blurb()}
			A no-results message on a muted ground, with a retry action.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 2. `bg-muted` is already a token and stays. The link button drops
					upstream's `text-muted-foreground` for the reason the opening demo states: a
					muted link is not a treatment the classic theme has — `.btn-link` is `link-color`.
				-->
				<Empty.Root class="{root} bg-muted">
					<Empty.Header class={header}>
						<Empty.Title class={title}>No results found</Empty.Title>
						<Empty.Description class={description}>
							No results found for your search. Try adjusting your search terms.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button class="{btn.base} {primary}">Try again</Button>
						<Button href="#/components/empty" variant="link" class="{btn.sm} {link}">
							Learn more
							<ArrowUpRightIcon data-icon="inline-end" />
						</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Empty state with add button">
		{#snippet blurb()}
			A solid-bordered block whose description carries the call to action twice — as an inline link
			and as a button.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 4. A plain `border` resolves to `--border` — solid, unlike the Outline
					section's dashed `.card-inactive` reading, and the demo draws it solid on purpose. The
					description link takes the Input group section's three classes: rest colour, no
					decoration, hover darkens via the same #1F56A1 stand-in {@link link} explains.
				-->
				<Empty.Root class="{root} border">
					<Empty.Header class={header}>
						<Empty.Media variant="icon" class={mediaIcon}>
							<FolderIcon class={mediaGlyph} />
						</Empty.Media>
						<Empty.Title class={title}>Nothing to see here</Empty.Title>
						<Empty.Description
							class="{description} [&>a]:text-primary [&>a]:no-underline [&>a:hover]:text-[color-mix(in_srgb,var(--primary)_70%,black)]"
						>
							No posts have been created yet. Get started by
							<a href="#/components/empty">creating your first post</a>.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button variant="outline" class="{btn.base} {white}">
							<PlusIcon data-icon="inline-start" />
							New Post
						</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Document empty state">
		{#snippet blurb()}
			The empty state as the body of a titled card — the panel keeps its header while its list has
			nothing to show.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 5. The demo's own card nests inside the section's frame card — see
					{@link demoCard}. This is exactly the classic theme's `project-reports.html` shape: a card
					whose header survives while the body is the placeholder.
				-->
				<Card.Root class={demoCard}>
					<Card.Header>
						<Card.Title>Recent Documents</Card.Title>
						<Card.Description>A list of your recently opened documents.</Card.Description>
					</Card.Header>
					<Card.Content>
						<Empty.Root class={root}>
							<Empty.Header class={header}>
								<Empty.Media variant="icon" class={mediaIcon}>
									<FileIcon class={mediaGlyph} />
								</Empty.Media>
								<Empty.Title class={title}>No documents yet</Empty.Title>
								<Empty.Description class={description}>
									You haven't opened any documents recently.
								</Empty.Description>
							</Empty.Header>
							<Empty.Content>
								<Button class="{btn.sm} {primary}">Create Document</Button>
							</Empty.Content>
						</Empty.Root>
					</Card.Content>
				</Card.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Inbox empty state">
		{#snippet blurb()}
			The header alone — no action at all, for states that need nothing done about them.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 7. "Inbox zero" is the state that IS the goal, so there is no button. -->
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<Empty.Media variant="icon" class={mediaIcon}>
							<InboxIcon class={mediaGlyph} />
						</Empty.Media>
						<Empty.Title class={title}>Inbox zero</Empty.Title>
						<Empty.Description class={description}>
							You're all caught up. No new messages.
						</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Team members empty state">
		{#snippet blurb()}
			The in-card composition again, this time with an icon-led invite action.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 8. Same nesting as the Document empty state; see {@link demoCard}. -->
				<Card.Root class={demoCard}>
					<Card.Header>
						<Card.Title>Team Members</Card.Title>
						<Card.Description>Manage your team and their permissions.</Card.Description>
					</Card.Header>
					<Card.Content>
						<Empty.Root class={root}>
							<Empty.Header class={header}>
								<Empty.Media variant="icon" class={mediaIcon}>
									<UsersIcon class={mediaGlyph} />
								</Empty.Media>
								<Empty.Title class={title}>No team members</Empty.Title>
								<Empty.Description class={description}>
									Invite people to collaborate on this project.
								</Empty.Description>
							</Empty.Header>
							<Empty.Content>
								<Button class="{btn.sm} {primary}">
									<UserPlusIcon data-icon="inline-start" />
									Invite People
								</Button>
							</Empty.Content>
						</Empty.Root>
					</Card.Content>
				</Card.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="No data analytics empty state">
		{#snippet blurb()}
			A bordered block with a primary and a secondary action side by side.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 10. Upstream imports `BarChart3Icon`; Lucide has since renamed that
					glyph `chart-column`, which is the name the installed package publishes.
				-->
				<Empty.Root class="{root} border">
					<Empty.Header class={header}>
						<Empty.Media variant="icon" class={mediaIcon}>
							<ChartColumnIcon class={mediaGlyph} />
						</Empty.Media>
						<Empty.Title class={title}>No data yet</Empty.Title>
						<Empty.Description class={description}>
							Once your project starts receiving traffic, analytics will appear here.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<div class="flex gap-2">
							<Button class="{btn.sm} {primary}">Connect Data Source</Button>
							<Button variant="outline" class="{btn.sm} {white}">View Docs</Button>
						</div>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Bookmarks empty state">
		{#snippet blurb()}
			A minimal state with a single secondary action — nothing is wrong, there is just nothing saved
			yet.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 11 -->
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<Empty.Media variant="icon" class={mediaIcon}>
							<BookmarkIcon class={mediaGlyph} />
						</Empty.Media>
						<Empty.Title class={title}>No bookmarks</Empty.Title>
						<Empty.Description class={description}>
							Items you bookmark will be saved here for quick access.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button variant="outline" class="{btn.sm} {white}">Browse Items</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tasks empty state">
		{#snippet blurb()}
			An in-card state whose emptiness is good news — the icon says done, not missing.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 12. Same nesting as the Document empty state; see {@link demoCard}. -->
				<Card.Root class={demoCard}>
					<Card.Header>
						<Card.Title>Tasks</Card.Title>
						<Card.Description>Track and manage your to-dos.</Card.Description>
					</Card.Header>
					<Card.Content>
						<Empty.Root class={root}>
							<Empty.Header class={header}>
								<Empty.Media variant="icon" class={mediaIcon}>
									<CircleCheckIcon class={mediaGlyph} />
								</Empty.Media>
								<Empty.Title class={title}>All clear</Empty.Title>
								<Empty.Description class={description}>
									You have no pending tasks. Enjoy the downtime or create a new one.
								</Empty.Description>
							</Empty.Header>
							<Empty.Content>
								<Button variant="outline" class="{btn.sm} {white}">
									<PlusIcon data-icon="inline-start" />
									New Task
								</Button>
							</Empty.Content>
						</Empty.Root>
					</Card.Content>
				</Card.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="No automations empty state with toggle illustration">
		{#snippet blurb()}
			The media slot holding an inline SVG illustration instead of an icon chip — drawn entirely in
			theme tokens, so it follows both modes for free.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 13. `Empty.Media`'s default variant is `bg-transparent` — the slot
					steps aside and the drawing is the media, every fill and stroke a token at an
					opacity. Upstream's first path carries `marker-end="url(#arrowhead)"` but defines
					no marker with that id — the polygon right after it IS the arrowhead — so the
					dangling reference is dropped.
				-->
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<Empty.Media>
							<svg
								width="200"
								height="120"
								viewBox="0 0 200 120"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<!-- Left connection line with arrowhead -->
								<path
									d="M30 60 L68 60"
									class="stroke-muted-foreground/30"
									stroke-width="2"
									stroke-linecap="round"
								/>
								<polygon points="66,56 74,60 66,64" class="fill-muted-foreground/30" />
								<!-- Toggle body and knob -->
								<rect
									x="76"
									y="42"
									width="56"
									height="36"
									rx="18"
									class="fill-primary/5 stroke-primary/60 dark:fill-primary/10"
									stroke-width="2"
								/>
								<circle cx="94" cy="60" r="12" class="fill-primary/40" />
								<circle cx="94" cy="60" r="6" class="fill-primary" />
								<!-- Right connections -->
								<path
									d="M134 60 Q150 60 158 48"
									class="stroke-muted-foreground/30"
									stroke-width="2"
									fill="none"
									stroke-linecap="round"
								/>
								<circle cx="162" cy="44" r="3" class="fill-muted-foreground/20" />
								<path
									d="M134 60 Q150 60 158 72"
									class="stroke-muted-foreground/30"
									stroke-width="2"
									fill="none"
									stroke-linecap="round"
								/>
								<circle cx="162" cy="76" r="3" class="fill-muted-foreground/20" />
								<!-- Decorative dots -->
								<circle cx="22" cy="60" r="2" class="fill-muted-foreground/20" />
								<circle cx="174" cy="44" r="2" class="fill-muted-foreground/15" />
								<circle cx="174" cy="76" r="2" class="fill-muted-foreground/15" />
							</svg>
						</Empty.Media>
						<Empty.Title class={title}>No automations yet</Empty.Title>
						<Empty.Description class={description}>
							Hook up your favorite tools and let the automation magic begin.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button class="{btn.base} {primary}">Create new automation</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Comments empty state with isometric board illustration">
		{#snippet blurb()}
			An isometric drawing built from three faces of one board, shaded with the muted ramp.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 14. The right face is upstream's `fill-background`, re-pointed to
					`fill-card` — the intro comment above these sections says why.
				-->
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<Empty.Media>
							<svg
								width="180"
								height="160"
								viewBox="0 0 180 160"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<!-- Ground shadow -->
								<ellipse
									cx="90"
									cy="148"
									rx="60"
									ry="8"
									class="fill-muted-foreground/8 dark:fill-muted-foreground/5"
								/>
								<!-- Board: back, front and right faces -->
								<path
									d="M30 40 L90 10 L160 45 L100 75 Z"
									class="fill-muted/80 stroke-border dark:fill-muted/40"
									stroke-width="1.5"
									stroke-linejoin="round"
								/>
								<path
									d="M30 40 L100 75 L100 110 L30 75 Z"
									class="fill-muted stroke-border dark:fill-muted/60"
									stroke-width="1.5"
									stroke-linejoin="round"
								/>
								<path
									d="M100 75 L160 45 L160 80 L100 110 Z"
									class="fill-card stroke-border"
									stroke-width="1.5"
									stroke-linejoin="round"
								/>
								<!-- Content rows on the board surface -->
								<circle cx="62" cy="35" r="4" class="fill-primary/20" />
								<line
									x1="72"
									y1="33"
									x2="105"
									y2="17"
									class="stroke-muted-foreground/20"
									stroke-width="4"
									stroke-linecap="round"
								/>
								<line
									x1="110"
									y1="15"
									x2="130"
									y2="5"
									class="stroke-muted-foreground/15"
									stroke-width="4"
									stroke-linecap="round"
								/>
								<circle cx="55" cy="50" r="4" class="fill-primary/30" />
								<line
									x1="65"
									y1="48"
									x2="100"
									y2="31"
									class="stroke-muted-foreground/20"
									stroke-width="4"
									stroke-linecap="round"
								/>
								<line
									x1="105"
									y1="29"
									x2="135"
									y2="14"
									class="stroke-muted-foreground/12"
									stroke-width="4"
									stroke-linecap="round"
								/>
								<circle cx="48" cy="65" r="4" class="fill-destructive/25" />
								<line
									x1="58"
									y1="63"
									x2="88"
									y2="48"
									class="stroke-muted-foreground/18"
									stroke-width="4"
									stroke-linecap="round"
								/>
							</svg>
						</Empty.Media>
						<Empty.Title class={title}>Be the first to share a thought</Empty.Title>
						<Empty.Description class={description}>
							Drop a comment on the canvas to get the conversation started.
						</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="No products empty state with stacked cards and blur effect">
		{#snippet blurb()}
			An illustration made of plain divs — three stacked card edges melting into the ground through
			a gradient overlay.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 15. The front card's `bg-background` and the fade's three
					`background` stops all become `card` — the fade has to end on the colour that is
					actually behind it, per the intro comment above these sections.
				-->
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<Empty.Media>
							<div class="relative h-24 w-52" aria-hidden="true">
								<!-- Back and middle card edges -->
								<div
									class="absolute inset-x-6 top-0 h-6 rounded-t-lg border border-border/50 bg-muted/60 dark:bg-muted/30"
								></div>
								<div
									class="absolute inset-x-3 top-3 h-6 rounded-t-lg border border-border/60 bg-muted/80 dark:bg-muted/50"
								></div>
								<!-- Front card -->
								<div
									class="absolute inset-x-0 top-6 flex h-16 items-center gap-3 rounded-lg border border-border bg-card px-4 shadow-sm"
								>
									<div class="size-8 shrink-0 rounded bg-muted"></div>
									<div class="flex flex-1 flex-col gap-1.5">
										<div class="h-2.5 w-3/4 rounded bg-muted"></div>
										<div class="h-2 w-1/2 rounded bg-muted/60"></div>
									</div>
								</div>
								<!-- Fade overlay -->
								<div
									class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-b from-card/0 via-card/60 to-card"
								></div>
							</div>
						</Empty.Media>
						<Empty.Title class={title}>No products</Empty.Title>
						<Empty.Description class={description}>
							No data here yet. We will notify you when there's an update.
						</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Search empty state with stacked file cards illustration">
		{#snippet blurb()}
			The same stacked-card idea inverted — results rising from behind a fade, for a search that has
			not been run yet.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 16. `background` → `card` on the front card and the fade, as above. -->
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<Empty.Media>
							<div class="relative h-32 w-56" aria-hidden="true">
								<!-- Bottom card -->
								<div
									class="absolute right-6 bottom-4 left-6 flex h-12 items-center gap-2.5 rounded-lg border border-border/40 bg-muted/50 px-3 dark:bg-muted/25"
								>
									<div class="size-5 shrink-0 rounded bg-muted-foreground/10"></div>
									<div class="flex flex-1 flex-col gap-1">
										<div class="h-2 w-full rounded bg-muted-foreground/10"></div>
										<div class="h-2 w-2/3 rounded bg-muted-foreground/8"></div>
									</div>
								</div>
								<!-- Middle card -->
								<div
									class="absolute right-3 bottom-8 left-3 flex h-12 items-center gap-2.5 rounded-lg border border-border/50 bg-muted/70 px-3 dark:bg-muted/40"
								>
									<div class="size-5 shrink-0 rounded bg-muted-foreground/12"></div>
									<div class="flex flex-1 flex-col gap-1">
										<div class="h-2 w-full rounded bg-muted-foreground/12"></div>
										<div class="h-2 w-3/4 rounded bg-muted-foreground/10"></div>
									</div>
								</div>
								<!-- Front card -->
								<div
									class="absolute inset-x-0 bottom-12 flex h-14 items-center gap-3 rounded-lg border border-border bg-card px-3.5 shadow-sm"
								>
									<div class="size-7 shrink-0 rounded bg-muted"></div>
									<div class="flex flex-1 flex-col gap-1.5">
										<div class="h-2.5 w-full rounded bg-muted"></div>
										<div class="h-2 w-3/5 rounded bg-muted/70"></div>
									</div>
								</div>
								<!-- Fade -->
								<div
									class="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-b from-card/0 to-card"
								></div>
							</div>
						</Empty.Media>
						<Empty.Title class={title}>Looking for something?</Empty.Title>
						<Empty.Description class={description}>
							Type a keyword and we'll search through files, folders, #tags, and transcripts.
						</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="No messages empty state with chat bubbles illustration">
		{#snippet blurb()}
			Two chat bubbles — the muted one theirs, the primary-tinted one yours.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 17. Every colour is already a token at an opacity; nothing re-pointed. -->
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<Empty.Media>
							<svg
								width="180"
								height="120"
								viewBox="0 0 180 120"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<!-- Left bubble, tail, text lines and avatar dot -->
								<rect
									x="20"
									y="20"
									width="80"
									height="44"
									rx="12"
									class="fill-muted stroke-border dark:fill-muted/60"
									stroke-width="1.5"
								/>
								<path
									d="M36 64 L32 76 L48 64"
									class="fill-muted stroke-border dark:fill-muted/60"
									stroke-width="1.5"
									stroke-linejoin="round"
								/>
								<rect x="32" y="32" width="48" height="4" rx="2" class="fill-muted-foreground/20" />
								<rect x="32" y="42" width="36" height="4" rx="2" class="fill-muted-foreground/15" />
								<circle cx="32" cy="52" r="3" class="fill-muted-foreground/12" />
								<!-- Right bubble, tail and text lines -->
								<rect
									x="80"
									y="50"
									width="80"
									height="40"
									rx="12"
									class="fill-primary/10 stroke-primary/30 dark:fill-primary/15"
									stroke-width="1.5"
								/>
								<path
									d="M144 90 L148 100 L132 90"
									class="fill-primary/10 stroke-primary/30 dark:fill-primary/15"
									stroke-width="1.5"
									stroke-linejoin="round"
								/>
								<rect x="92" y="62" width="52" height="4" rx="2" class="fill-primary/20" />
								<rect x="92" y="72" width="32" height="4" rx="2" class="fill-primary/15" />
								<!-- Decorative dots -->
								<circle cx="14" cy="46" r="2" class="fill-muted-foreground/10" />
								<circle cx="168" cy="66" r="2" class="fill-primary/15" />
								<circle cx="110" cy="16" r="2.5" class="fill-muted-foreground/10" />
							</svg>
						</Empty.Media>
						<Empty.Title class={title}>No messages yet</Empty.Title>
						<Empty.Description class={description}>
							Start a conversation with your team. Messages will appear here.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button class="{btn.base} {primary}">Send a message</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="No payments empty state with credit card illustration">
		{#snippet blurb()}
			A credit card drawn from muted strokes, with a rotated shadow card behind it for depth.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 18. The main card face is `background` upstream → `card`, as above. -->
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<Empty.Media>
							<svg
								width="200"
								height="130"
								viewBox="0 0 200 130"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<!-- Shadow card behind -->
								<rect
									x="48"
									y="12"
									width="120"
									height="78"
									rx="10"
									class="fill-muted/50 dark:fill-muted/25"
									transform="rotate(6 108 51)"
								/>
								<!-- Main card -->
								<rect
									x="36"
									y="18"
									width="128"
									height="82"
									rx="10"
									class="fill-card stroke-border"
									stroke-width="1.5"
								/>
								<!-- Chip and its lines -->
								<rect
									x="52"
									y="38"
									width="22"
									height="16"
									rx="3"
									class="fill-muted-foreground/15 stroke-muted-foreground/20"
									stroke-width="1"
								/>
								<line
									x1="52"
									y1="46"
									x2="74"
									y2="46"
									class="stroke-muted-foreground/15"
									stroke-width="0.8"
								/>
								<line
									x1="63"
									y1="38"
									x2="63"
									y2="54"
									class="stroke-muted-foreground/15"
									stroke-width="0.8"
								/>
								<!-- Contactless waves -->
								<g class="stroke-muted-foreground/20" stroke-width="1.5" fill="none">
									<path d="M84 42 Q87 46 84 50" stroke-linecap="round" />
									<path d="M88 40 Q92 46 88 52" stroke-linecap="round" />
									<path d="M92 38 Q97 46 92 54" stroke-linecap="round" />
								</g>
								<!-- Card number dots -->
								<g class="fill-muted-foreground/20">
									<circle cx="56" cy="68" r="2" />
									<circle cx="64" cy="68" r="2" />
									<circle cx="72" cy="68" r="2" />
									<circle cx="80" cy="68" r="2" />
								</g>
								<g class="fill-muted-foreground/15">
									<circle cx="94" cy="68" r="2" />
									<circle cx="102" cy="68" r="2" />
									<circle cx="110" cy="68" r="2" />
									<circle cx="118" cy="68" r="2" />
								</g>
								<!-- Bottom info lines and network logo -->
								<rect
									x="52"
									y="80"
									width="40"
									height="3"
									rx="1.5"
									class="fill-muted-foreground/12"
								/>
								<rect
									x="120"
									y="80"
									width="28"
									height="3"
									rx="1.5"
									class="fill-muted-foreground/12"
								/>
								<circle cx="140" cy="88" r="6" class="fill-muted-foreground/8" />
								<circle cx="150" cy="88" r="6" class="fill-muted-foreground/12" />
								<!-- Floating decorative elements -->
								<circle cx="26" cy="50" r="3" class="fill-primary/10" />
								<circle cx="180" cy="40" r="2" class="fill-primary/10" />
								<path d="M174 70 L178 66 L178 74 Z" class="fill-muted-foreground/10" />
							</svg>
						</Empty.Media>
						<Empty.Title class={title}>No payment methods</Empty.Title>
						<Empty.Description class={description}>
							Add a payment method to start making transactions securely.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button class="{btn.base} {primary}">Add payment method</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="No integrations empty state with connected nodes illustration">
		{#snippet blurb()}
			A hub-and-spoke diagram — the primary-tinted centre waiting for the muted satellites to
			connect.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 19. Every colour is already a token at an opacity; nothing re-pointed. -->
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<Empty.Media>
							<svg
								width="200"
								height="120"
								viewBox="0 0 200 120"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<!-- Connection lines -->
								<line
									x1="100"
									y1="60"
									x2="44"
									y2="30"
									class="stroke-border"
									stroke-width="1.5"
									stroke-dasharray="4 3"
								/>
								<line
									x1="100"
									y1="60"
									x2="44"
									y2="90"
									class="stroke-border"
									stroke-width="1.5"
									stroke-dasharray="4 3"
								/>
								<line
									x1="100"
									y1="60"
									x2="156"
									y2="30"
									class="stroke-border"
									stroke-width="1.5"
									stroke-dasharray="4 3"
								/>
								<line
									x1="100"
									y1="60"
									x2="156"
									y2="90"
									class="stroke-border"
									stroke-width="1.5"
									stroke-dasharray="4 3"
								/>
								<!-- Center node -->
								<circle
									cx="100"
									cy="60"
									r="18"
									class="fill-primary/10 stroke-primary/40 dark:fill-primary/15"
									stroke-width="1.5"
								/>
								<circle cx="100" cy="60" r="6" class="fill-primary/30" />
								<circle cx="100" cy="60" r="2.5" class="fill-primary" />
								<!-- Top-left node -->
								<circle
									cx="44"
									cy="30"
									r="14"
									class="fill-muted stroke-border dark:fill-muted/60"
									stroke-width="1.5"
								/>
								<rect
									x="37"
									y="26"
									width="14"
									height="3"
									rx="1.5"
									class="fill-muted-foreground/20"
								/>
								<rect x="40" y="32" width="8" height="2" rx="1" class="fill-muted-foreground/12" />
								<!-- Bottom-left node -->
								<circle
									cx="44"
									cy="90"
									r="14"
									class="fill-muted stroke-border dark:fill-muted/60"
									stroke-width="1.5"
								/>
								<rect
									x="37"
									y="86"
									width="14"
									height="3"
									rx="1.5"
									class="fill-muted-foreground/20"
								/>
								<rect x="40" y="92" width="8" height="2" rx="1" class="fill-muted-foreground/12" />
								<!-- Top-right node -->
								<circle
									cx="156"
									cy="30"
									r="14"
									class="fill-muted stroke-border dark:fill-muted/60"
									stroke-width="1.5"
								/>
								<rect
									x="149"
									y="26"
									width="14"
									height="3"
									rx="1.5"
									class="fill-muted-foreground/20"
								/>
								<rect x="152" y="32" width="8" height="2" rx="1" class="fill-muted-foreground/12" />
								<!-- Bottom-right node -->
								<circle
									cx="156"
									cy="90"
									r="14"
									class="fill-muted stroke-border dark:fill-muted/60"
									stroke-width="1.5"
								/>
								<rect
									x="149"
									y="86"
									width="14"
									height="3"
									rx="1.5"
									class="fill-muted-foreground/20"
								/>
								<rect x="152" y="92" width="8" height="2" rx="1" class="fill-muted-foreground/12" />
								<!-- Small floating dots -->
								<circle cx="72" cy="40" r="2" class="fill-primary/15" />
								<circle cx="128" cy="80" r="2" class="fill-primary/15" />
								<circle cx="72" cy="80" r="1.5" class="fill-muted-foreground/10" />
								<circle cx="128" cy="40" r="1.5" class="fill-muted-foreground/10" />
							</svg>
						</Empty.Media>
						<Empty.Title class={title}>No integrations</Empty.Title>
						<Empty.Description class={description}>
							Connect your tools and services to streamline your workflow.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<div class="flex gap-2">
							<Button class="{btn.base} {primary}">Browse integrations</Button>
							<Button variant="outline" class="{btn.base} {white}">Learn more</Button>
						</div>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="No events empty state with calendar illustration">
		{#snippet blurb()}
			A wall calendar with hanging hooks, its one primary-marked day the event yet to be created.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 20. The calendar body is `background` upstream → `card`, as above. -->
				<Empty.Root class={root}>
					<Empty.Header class={header}>
						<Empty.Media>
							<svg
								width="160"
								height="140"
								viewBox="0 0 160 140"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<!-- Calendar body -->
								<rect
									x="24"
									y="28"
									width="112"
									height="96"
									rx="10"
									class="fill-card stroke-border"
									stroke-width="1.5"
								/>
								<!-- Calendar header bar -->
								<rect
									x="24"
									y="28"
									width="112"
									height="24"
									rx="10"
									class="fill-muted dark:fill-muted/60"
								/>
								<rect x="24" y="42" width="112" height="10" class="fill-muted dark:fill-muted/60" />
								<!-- Calendar hooks -->
								<line
									x1="56"
									y1="20"
									x2="56"
									y2="36"
									class="stroke-muted-foreground/30"
									stroke-width="3"
									stroke-linecap="round"
								/>
								<line
									x1="104"
									y1="20"
									x2="104"
									y2="36"
									class="stroke-muted-foreground/30"
									stroke-width="3"
									stroke-linecap="round"
								/>
								<!-- Day dots - row 1 -->
								<circle cx="48" cy="68" r="4" class="fill-muted-foreground/10" />
								<circle cx="68" cy="68" r="4" class="fill-muted-foreground/10" />
								<circle cx="88" cy="68" r="4" class="fill-muted-foreground/10" />
								<circle cx="108" cy="68" r="4" class="fill-muted-foreground/10" />
								<!-- Day dots - row 2 -->
								<circle cx="48" cy="86" r="4" class="fill-muted-foreground/10" />
								<circle cx="68" cy="86" r="4" class="fill-muted-foreground/10" />
								<circle cx="88" cy="86" r="4" class="fill-primary/25" />
								<circle cx="88" cy="86" r="2" class="fill-primary" />
								<circle cx="108" cy="86" r="4" class="fill-muted-foreground/10" />
								<!-- Day dots - row 3 -->
								<circle cx="48" cy="104" r="4" class="fill-muted-foreground/10" />
								<circle cx="68" cy="104" r="4" class="fill-muted-foreground/10" />
								<circle cx="88" cy="104" r="4" class="fill-muted-foreground/10" />
								<circle cx="108" cy="104" r="4" class="fill-muted-foreground/10" />
								<!-- Floating decoration -->
								<circle cx="14" cy="70" r="2" class="fill-muted-foreground/10" />
								<circle cx="148" cy="56" r="2.5" class="fill-primary/10" />
								<circle cx="146" cy="100" r="1.5" class="fill-muted-foreground/8" />
							</svg>
						</Empty.Media>
						<Empty.Title class={title}>No upcoming events</Empty.Title>
						<Empty.Description class={description}>
							Your schedule is clear. Create an event to get started.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<Button class="{btn.base} {primary}">Create event</Button>
					</Empty.Content>
				</Empty.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
