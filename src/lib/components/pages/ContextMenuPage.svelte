<script lang="ts">
	import ArchiveIcon from "@lucide/svelte/icons/archive";
	import ClipboardIcon from "@lucide/svelte/icons/clipboard";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import ScissorsIcon from "@lucide/svelte/icons/scissors";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Context menu component page, ported from shadcn-svelte's own documentation
	 * (`https://shadcn-svelte.com/docs/components/context-menu`).
	 *
	 * THE CLASSIC THEME HAS NO CONTEXT MENU. Grepping the reference source and the reference docs
	 * for `contextmenu` / `right-click` returns nothing, and the classic framework has never shipped a
	 * right-click component either. What the classic theme does have is the surface such a menu is made
	 * of — `.dropdown-menu` and `.dropdown-item` — so every constant below
	 * is taken from there, and the page stays deliberately consistent with the Dropdowns page,
	 * which ports the same object.
	 *
	 * Four pieces of the shadcn example have no classic counterpart at all, and keep shadcn's
	 * defaults on purpose:
	 *
	 *   shortcut hints    `.dropdown-item` has no keyboard-hint element
	 *   checked items     the classic framework has no checkbox or radio menu item; the check indicator is
	 *                     absolutely positioned inside the component, so only its gutter is
	 *                     reachable from here
	 *   submenus          nested dropdowns were dropped in the classic framework 4 and never came back
	 *   elevation         `dropdown-box-shadow: var(--bs-box-shadow)` is
	 *                     `0 .5rem 1rem rgba(18,38,63,.15)`, softer and larger than Tailwind's
	 *                     `shadow-md`. Shadows are still deferred theme-wide (see the
	 *                     `[data-slot='card']` note in `app.css`), so this one is left alone
	 *                     rather than ported in isolation
	 *
	 * The open animation is also left as shadcn's: the classic theme animates opacity only
	 * (`.dropdown-menu { animation: dropdownMenu .15s }`, a plain 0 -> 1 fade) where shadcn adds
	 * a `zoom-in-95`. Neutralising the zoom means fighting the component's own enter/exit
	 * utilities from the call site, which is not worth the class soup for 150ms.
	 */

	/** Docs example state: two independent checkboxes and one radio group. */
	let showBookmarks = $state(false);
	let showFullURLs = $state(true);
	let person = $state("pedro");

	/**
	 * THE CLASSIC MENUS ARE NOT MODAL; bits-ui's are — the same reasoning the Dropdowns page
	 * writes out. While a menu is open, bits-ui puts `pointer-events: none` on `document.body`,
	 * so right-clicking the SECOND trigger on this page while the first menu is open only
	 * dismisses the first: the `contextmenu` event never reaches the second target. Every
	 * desktop context menu moves in one gesture instead, and `preventScroll={false}` restores
	 * that. Passed per `Content` rather than fixed globally, since it is a decision about
	 * behaviour and not about theme.
	 */
	const nonModal = false;

	/**
	 * The menu surface. Every value is `.dropdown-menu` in the compiled bundle:
	 *
	 *   min-w-40     `dropdown-min-width: 10rem`, against the component's `min-w-36`
	 *   rounded-md   `dropdown-border-radius: border-radius`
	 *   px-0 py-2    `dropdown-padding-x: 0` / `dropdown-padding-y: .5rem` — the items run
	 *                edge to edge and supply their own inset
	 *   text-sm      `dropdown-font-size: font-size-base` (15px, which `--text-sm` holds)
	 *
	 * The outline is the one colour correction, and it is stated per surface below because
	 * shadcn draws it as a ring on `Content` and as a real `border` on `SubContent`. Either way
	 * the value is `dropdown-border-color: rgba(var(--bs-black-rgb), .1)` in light — which
	 * `ring-foreground/10` already IS, exactly, so nothing is done there — and
	 * `dropdown-border-color-dark: var(--bs-black)` in dark, a SOLID #12263F where shadcn's
	 * 10% mix inverts to 10% white. `--background` is #12263F in dark, so it carries that
	 * value; no single token covers both modes, which is why these two need the `dark:` prefix.
	 * (The Dropdowns page predates this reading and still ships shadcn's ring on both sides.)
	 */
	const menuGeometry = "min-w-40 rounded-md px-0 py-2 text-sm";

	/**
	 * The first example's menu. Its width is widened from the docs' `w-52` to `w-60` — exactly
	 * 2 x 16px — because the docs chose 13rem against an 8px item inset and the classic theme's is 24px,
	 * so the text measure inside the menu would otherwise be 32px narrower than the example was
	 * drawn for. Both values are above `dropdown-min-width`, so the width is what decides.
	 */
	const menu = cn(menuGeometry, "w-60 dark:ring-background");

	/**
	 * The second example sets no width, so `min-w-40` decides and the menu is sized by its
	 * content — which is how the classic absolutely positioned menu behaves.
	 */
	const basicMenu = cn(menuGeometry, "dark:ring-background");

	/**
	 * The submenu surface. There is no `.dropdown-submenu` in the classic framework to port, so what is
	 * reproduced is the parent `.dropdown-menu` — a second one of those is what the classic theme would
	 * draw. Same +32px correction as above, from the docs' `w-48` to `w-56`.
	 *
	 * IT IS RENDERED INSIDE A `ContextMenu.Portal`, and it has to be. `SubContent` is not
	 * portalled by the generated wrapper, so it lands as a DOM child of the panel that opened
	 * it — and `context-menu-content` is `overflow-x-hidden`. The submenu opens to the right of
	 * that edge, which means all of it is outside and none of it is visible. Portalling is the
	 * fix that does not require editing a CLI-generated file.
	 */
	const submenu = cn(menuGeometry, "w-56 border-foreground/10 dark:border-background");

	/**
	 * The colours shared by every kind of item, all from `.dropdown-item`:
	 *
	 *   resting     `dropdown-link-color: var(--bs-gray-700)`. `--muted-foreground` is exactly
	 *               that in dark mode (where the classic theme itself switches to `secondary-color`, the
	 *               same #6E84A3) and one step lighter in light
	 *   hover       `--bs-dropdown-link-hover-bg` is TRANSPARENT in the classic theme, so an item signals
	 *               hover by darkening its type rather than by filling — the opposite of
	 *               shadcn's `focus:bg-accent`. The colour is `dropdown-link-hover-color:
	 *               var(--bs-black)`, which `--foreground` holds in both modes
	 *   disabled    `dropdown-link-disabled-color: var(--bs-tertiary-color)` resolves to
	 *               `rgba(18,38,63,.5)` in light and `rgba(255,255,255,.5)` in dark, which is
	 *               `text-foreground/50` exactly in both. shadcn dims the whole row with
	 *               `opacity-50` instead, which halves a grey rather than half-tinting the body
	 *               colour, so the opacity is put back to 1 and the colour stated directly
	 */
	const itemColors =
		"text-muted-foreground focus:bg-transparent focus:text-foreground data-disabled:opacity-100 data-disabled:text-foreground/50";

	/**
	 * A plain item. `dropdown-item-padding-x: 1.5rem` and
	 * `dropdown-item-padding-y: .375rem` — the vertical half is already shadcn's `py-1.5`, so
	 * only the inset moves. `border-radius: var(--bs-dropdown-item-border-radius, 0)` is the
	 * `rounded-none`, against shadcn's `rounded-sm`.
	 *
	 * `inset` is deliberately NOT used anywhere on this page, where the docs example passes it
	 * on three items and the group heading. The classic theme gives every `.dropdown-item` the same
	 * `padding-x` and has no indented variant, and the reason shadcn offers one — leaving room
	 * for a check indicator — does not apply to this build, whose indicator sits on the RIGHT
	 * of the row. Keeping it would indent four rows by 8px past the other seven for nothing.
	 */
	const item = cn("rounded-none px-6 py-1.5 text-sm", itemColors);

	/**
	 * The shortcut hint stays BARE TEXT, which is both what the docs render and what suits this
	 * menu. Rendering it as `Kbd` caps was tried and dropped: the classic port of this surface
	 * is deliberately quiet — transparent hover, square corners, rows running edge to edge — and
	 * a row of filled caps fights all three, while the rows that carry no shortcut start to read
	 * as unfinished beside the ones that do. The chip also all but vanishes on this ground in
	 * dark mode, where `--muted` (#132A46) sits 1.06:1 against `--popover` (#152E4D).
	 */

	/**
	 * A checkbox or radio item. The left inset is `dropdown-item-padding-x` like any other
	 * item; the right one stays shadcn's `pr-8`, because the check is an absolutely positioned
	 * `right-2` span inside the component with no `class` prop of its own — widening the
	 * padding alone would just open a gap between the label and a check that has not moved.
	 * The classic framework has no checked menu item, so no classic value is being contradicted here.
	 */
	const indicatorItem = cn("rounded-none py-1.5 pr-8 pl-6 text-sm", itemColors);

	/**
	 * The submenu trigger. It is a `.dropdown-item` first, so it takes the item's geometry and
	 * colours, plus the open state: `dropdown-link-active-bg: var(--bs-dropdown-link-hover-bg)`
	 * and `dropdown-link-active-color: var(--bs-dropdown-link-hover-color)` — the classic theme points
	 * the active pair straight at the hover pair, so an open trigger looks exactly like a
	 * hovered item, transparent ground included.
	 *
	 * The chevron needs nothing. `.dropdown-item.dropdown-toggle` is
	 * `display: flex; justify-content: space-between`, and `.dropend > .dropdown-toggle::after`
	 * is Feather's `\e930` — a right chevron pushed to the end of the row, which is what the
	 * component's own `ChevronRightIcon.ml-auto` already draws.
	 */
	const subTrigger = cn(
		"rounded-none px-6 py-1.5 text-sm",
		itemColors,
		"data-open:bg-transparent data-open:text-foreground",
	);

	/**
	 * `.dropdown-header`: `font-size: .8125rem` (`font-size-sm`, which `--text-xs` holds) and
	 * `padding: dropdown-header-padding-y dropdown-header-padding-x` = `.5rem 1.5rem`.
	 *
	 * The colour needs no class: the classic theme overrides the classic grey with
	 * `dropdown-header-color: inherit`, so the heading takes
	 * `--bs-dropdown-color: var(--bs-body-color)` — which is what shadcn's `text-foreground`
	 * already resolves to. The classic framework sets no `font-weight` on it, so it stays at
	 * `font-weight-base` (400) where shadcn asks for `font-medium`.
	 */
	const heading = "px-6 py-2 text-xs font-normal";

	/**
	 * `.dropdown-divider` is `margin: var(--bs-dropdown-divider-margin-y) 0` with
	 * `--bs-dropdown-divider-margin-y: .75rem` — full bleed, and three times shadcn's `my-1`.
	 * `mx-0` is what "full bleed" means on a menu with `dropdown-padding-x: 0`; shadcn's
	 * `-mx-1` cancels a `p-1` this surface no longer has, and would hang 4px off each edge of
	 * the submenu, which has no `overflow-x-hidden` to clip it.
	 *
	 * `dropdown-divider-bg` is `rgba(black, .1)` in light and solid `black` in dark. Over
	 * the menu surface the light value resolves to roughly #E7EAEE, a shade off `--border`'s
	 * #EDF2F9; the dark value is one step darker than `--border`. Using the token keeps the
	 * divider tied to every other hairline in the app rather than to two loose values — the
	 * same call the Dropdowns page makes.
	 */
	const divider = "mx-0 my-3 bg-border";

	/**
	 * The right-click target. shadcn's demo draws a dashed 300x150 box; the classic theme's nearest
	 * object is `.card-inactive`, which is `border-style: dashed` over a
	 * transparent background with no shadow and
	 * `--bs-card-outline-color: var(--bs-border-color)`.
	 *
	 * `border-color` is `gray-300` (#E3EBF6) in light, which no token carries exactly —
	 * `--border` is #EDF2F9, one step lighter, the same substitution the Accordion page
	 * documents. In dark, `border-color-dark: gray-700-dark` (#1E3A5C) and `--border` is
	 * precisely that.
	 *
	 * `rounded-xl` is `card-border-radius` (0.5rem), not the menu's `border-radius` (6px) —
	 * this box is a card shape, not a dropdown shape. The docs' `text-sm` is dropped: it is
	 * 15px here, i.e. `font-size-base`, which the box already inherits from the body.
	 */
	const trigger =
		"flex h-[150px] w-[300px] items-center justify-center rounded-xl border border-dashed";

	/*
	 * THE SECTIONS BELOW ARE THE DEMO SET, which documents the same Radix surface
	 * this component wraps. They reuse the classic `.dropdown-menu` constants above unchanged —
	 * the reading of the surface does not depend on which docs site the example came from.
	 * Five of the ten demos duplicate compositions this page already shows (basic items,
	 * shortcuts, a submenu, checkbox items, radio items) and are deliberately not repeated.
	 */

	/**
	 * A destructive item, from demo 2 (`variant="destructive"` — the house
	 * name for the negative status, per docs/CONVENTIONS.md §3). The component's own destructive
	 * treatment fills the row with `bg-destructive/10` on focus, but this theme's items signal
	 * hover by recolouring type over a TRANSPARENT ground (see `itemColors`), so the fill is
	 * switched off here too and the red text carries the state alone — the same move the classic theme's
	 * `.dropdown-item.text-danger` pattern makes.
	 */
	const destructiveItem = cn(
		item,
		"data-[variant=destructive]:focus:bg-transparent dark:data-[variant=destructive]:focus:bg-transparent",
	);

	/**
	 * The trigger boxes of the alignment demo. Same dashed
	 * `.card-inactive` reading as `trigger` above, but sized by the grid cell and the upstream
	 * `aspect-[2/0.5]` ratio instead of a fixed 300x150.
	 */
	const sideTrigger =
		"flex aspect-[2/0.5] items-center justify-center rounded-xl border border-dashed p-4 capitalize";

	/**
	 * The trigger inside the dialog fills the dialog body's width, so
	 * only the fixed box of `trigger` changes.
	 */
	const dialogTrigger =
		"flex aspect-[2/0.5] w-full items-center justify-center rounded-xl border border-dashed";

	/** The four placements exercised by demo 9, in its order. */
	const menuSides = ["left", "top", "bottom", "right"] as const;
</script>

<DocPage title="Context menu">
	{#snippet subtitle()}
		Displays a menu to the user — such as a set of actions or functions — triggered by right click.
		Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/context-menu"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<ContextMenu.Root>
				<ContextMenu.Trigger class={trigger}>Right click here</ContextMenu.Trigger>
				<ContextMenu.Content preventScroll={nonModal} class={menu}>
					<!--
						`ContextMenu.Shortcut` has no classic counterpart — the classic menus carry no
						keyboard hint — so it keeps shadcn's `text-xs tracking-widest`. Two of its three
						values happen to land on real classic ones anyway: `--text-xs` is `font-size-sm`
						(13px), and its hover colour `--accent-foreground` is `--foreground` in both
						modes, i.e. the same `dropdown-link-hover-color` the label moves to.

						The ⌘ and ⇧ glyphs come from the demo source
						(`docs/src/lib/registry/examples/context-menu-demo.svelte`). The docs page served
						as markdown strips them, leaving a bare "[", "]", "R" and "S" — which reads as a
						different shortcut entirely, so the source is the only reliable reading here.
					-->
					<ContextMenu.Item class={item}>
						Back
						<ContextMenu.Shortcut>⌘[</ContextMenu.Shortcut>
					</ContextMenu.Item>
					<ContextMenu.Item class={item} disabled>
						Forward
						<ContextMenu.Shortcut>⌘]</ContextMenu.Shortcut>
					</ContextMenu.Item>
					<ContextMenu.Item class={item}>
						Reload
						<ContextMenu.Shortcut>⌘R</ContextMenu.Shortcut>
					</ContextMenu.Item>

					<ContextMenu.Sub>
						<ContextMenu.SubTrigger class={subTrigger}>More Tools</ContextMenu.SubTrigger>
						<!-- Portalled out of the clipping panel — see the note above `submenu`. -->
						<ContextMenu.Portal>
							<ContextMenu.SubContent class={submenu}>
								<ContextMenu.Item class={item}>
									Save Page As...
									<ContextMenu.Shortcut>⇧⌘S</ContextMenu.Shortcut>
								</ContextMenu.Item>
								<ContextMenu.Item class={item}>Create Shortcut...</ContextMenu.Item>
								<ContextMenu.Item class={item}>Name Window...</ContextMenu.Item>
								<ContextMenu.Separator class={divider} />
								<ContextMenu.Item class={item}>Developer Tools</ContextMenu.Item>
							</ContextMenu.SubContent>
						</ContextMenu.Portal>
					</ContextMenu.Sub>

					<ContextMenu.Separator class={divider} />

					<ContextMenu.CheckboxItem class={indicatorItem} bind:checked={showBookmarks}>
						Show Bookmarks
					</ContextMenu.CheckboxItem>
					<ContextMenu.CheckboxItem class={indicatorItem} bind:checked={showFullURLs}>
						Show Full URLs
					</ContextMenu.CheckboxItem>

					<ContextMenu.Separator class={divider} />

					<ContextMenu.RadioGroup bind:value={person}>
						<ContextMenu.Group>
							<ContextMenu.GroupHeading class={heading}>People</ContextMenu.GroupHeading>
							<ContextMenu.RadioItem class={indicatorItem} value="pedro">
								Pedro Duarte
							</ContextMenu.RadioItem>
							<ContextMenu.RadioItem class={indicatorItem} value="colm">
								Colm Tuite
							</ContextMenu.RadioItem>
						</ContextMenu.Group>
					</ContextMenu.RadioGroup>
				</ContextMenu.Content>
			</ContextMenu.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Basic menu">
		{#snippet blurb()}
			The minimal form from the documentation's usage section — a trigger and four items, with no
			shortcuts, submenu or indicators. It is the closest this component gets to a plain classic <code
				class="text-[87.5%] text-primary">.dropdown-menu</code
			>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ContextMenu.Root>
					<ContextMenu.Trigger class={trigger}>Right click</ContextMenu.Trigger>
					<ContextMenu.Content preventScroll={nonModal} class={basicMenu}>
						<ContextMenu.Item class={item}>Profile</ContextMenu.Item>
						<ContextMenu.Item class={item}>Billing</ContextMenu.Item>
						<ContextMenu.Item class={item}>Team</ContextMenu.Item>
						<ContextMenu.Item class={item}>Subscription</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Context menu with icons for common actions">
		{#snippet blurb()}
			From Demo 2. The component sizes the icons itself, so they carry no classes here.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ContextMenu.Root>
					<ContextMenu.Trigger class={trigger}>Right click here</ContextMenu.Trigger>
					<ContextMenu.Content preventScroll={nonModal} class={basicMenu}>
						<ContextMenu.Group>
							<ContextMenu.Item class={item}>
								<CopyIcon />
								Copy
							</ContextMenu.Item>
							<ContextMenu.Item class={item}>
								<ScissorsIcon />
								Cut
							</ContextMenu.Item>
							<ContextMenu.Item class={item}>
								<ClipboardIcon />
								Paste
							</ContextMenu.Item>
						</ContextMenu.Group>
						<ContextMenu.Separator class={divider} />
						<ContextMenu.Group>
							<ContextMenu.Item variant="destructive" class={destructiveItem}>
								<TrashIcon />
								Delete
							</ContextMenu.Item>
						</ContextMenu.Group>
					</ContextMenu.Content>
				</ContextMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Context menu labels and separators">
		{#snippet blurb()}
			From Demo 5 — a menu organised into labelled command groups. The
			<code class="text-[87.5%] text-primary">ContextMenuLabel</code> inside a group is this build's
			<code class="text-[87.5%] text-primary">GroupHeading</code>, styled as the classic theme's
			<code class="text-[87.5%] text-primary">.dropdown-header</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ContextMenu.Root>
					<ContextMenu.Trigger class={trigger}>Right click here</ContextMenu.Trigger>
					<ContextMenu.Content preventScroll={nonModal} class={basicMenu}>
						<ContextMenu.Group>
							<ContextMenu.GroupHeading class={heading}>File</ContextMenu.GroupHeading>
							<ContextMenu.Item class={item}>
								New File
								<ContextMenu.Shortcut>⌘N</ContextMenu.Shortcut>
							</ContextMenu.Item>
							<ContextMenu.Item class={item}>
								Open File
								<ContextMenu.Shortcut>⌘O</ContextMenu.Shortcut>
							</ContextMenu.Item>
							<ContextMenu.Item class={item}>
								Save
								<ContextMenu.Shortcut>⌘S</ContextMenu.Shortcut>
							</ContextMenu.Item>
						</ContextMenu.Group>
						<ContextMenu.Separator class={divider} />
						<ContextMenu.Group>
							<ContextMenu.GroupHeading class={heading}>Edit</ContextMenu.GroupHeading>
							<ContextMenu.Item class={item}>
								Undo
								<ContextMenu.Shortcut>⌘Z</ContextMenu.Shortcut>
							</ContextMenu.Item>
							<ContextMenu.Item class={item}>
								Redo
								<ContextMenu.Shortcut>⇧⌘Z</ContextMenu.Shortcut>
							</ContextMenu.Item>
						</ContextMenu.Group>
						<ContextMenu.Separator class={divider} />
						<ContextMenu.Group>
							<ContextMenu.Item class={item}>
								Cut
								<ContextMenu.Shortcut>⌘X</ContextMenu.Shortcut>
							</ContextMenu.Item>
							<ContextMenu.Item class={item}>
								Copy
								<ContextMenu.Shortcut>⌘C</ContextMenu.Shortcut>
							</ContextMenu.Item>
							<ContextMenu.Item class={item}>
								Paste
								<ContextMenu.Shortcut>⌘V</ContextMenu.Shortcut>
							</ContextMenu.Item>
						</ContextMenu.Group>
						<ContextMenu.Separator class={divider} />
						<ContextMenu.Group>
							<ContextMenu.Item variant="destructive" class={destructiveItem}>
								Delete
								<ContextMenu.Shortcut>⌫</ContextMenu.Shortcut>
							</ContextMenu.Item>
						</ContextMenu.Group>
					</ContextMenu.Content>
				</ContextMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Context menu with destructive actions">
		{#snippet blurb()}
			From Demo 8 — the delete action separated from the safe ones and coloured
			<code class="text-[87.5%] text-primary">destructive</code>, the house name for the error
			state.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ContextMenu.Root>
					<ContextMenu.Trigger class={trigger}>Right click here</ContextMenu.Trigger>
					<ContextMenu.Content preventScroll={nonModal} class={basicMenu}>
						<ContextMenu.Group>
							<ContextMenu.Item class={item}>
								<PencilIcon />
								Edit
							</ContextMenu.Item>
							<ContextMenu.Item class={item}>
								<UploadIcon />
								Share
							</ContextMenu.Item>
						</ContextMenu.Group>
						<ContextMenu.Separator class={divider} />
						<ContextMenu.Group>
							<ContextMenu.Item class={item}>
								<ArchiveIcon />
								Archive
							</ContextMenu.Item>
							<ContextMenu.Item variant="destructive" class={destructiveItem}>
								<TrashIcon />
								Delete
							</ContextMenu.Item>
						</ContextMenu.Group>
					</ContextMenu.Content>
				</ContextMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Context menu with different alignment sides">
		{#snippet blurb()}
			From Demo 9. <code class="text-[87.5%] text-primary">side</code> biases which side of the pointer
			the menu opens on; collision handling may still flip it near a viewport edge.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="grid max-w-lg grid-cols-2 gap-2">
					{#each menuSides as side (side)}
						<ContextMenu.Root>
							<ContextMenu.Trigger class={sideTrigger}>{side}</ContextMenu.Trigger>
							<ContextMenu.Content {side} preventScroll={nonModal} class={basicMenu}>
								<ContextMenu.Group>
									<ContextMenu.Item class={item}>Back</ContextMenu.Item>
									<ContextMenu.Item class={item}>Forward</ContextMenu.Item>
									<ContextMenu.Item class={item}>Reload</ContextMenu.Item>
								</ContextMenu.Group>
							</ContextMenu.Content>
						</ContextMenu.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Context menu used inside a dialog component">
		{#snippet blurb()}
			From Demo 10 — the menu portals above the dialog's overlay, so right-clicking inside the modal
			works unchanged.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline">Open Dialog</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Context Menu Example</Dialog.Title>
							<Dialog.Description>
								Right click on the area below to see the context menu.
							</Dialog.Description>
						</Dialog.Header>
						<ContextMenu.Root>
							<ContextMenu.Trigger class={dialogTrigger}>Right click here</ContextMenu.Trigger>
							<ContextMenu.Content preventScroll={nonModal} class={basicMenu}>
								<ContextMenu.Group>
									<ContextMenu.Item class={item}>
										<CopyIcon />
										Copy
									</ContextMenu.Item>
									<ContextMenu.Item class={item}>
										<ScissorsIcon />
										Cut
									</ContextMenu.Item>
									<ContextMenu.Item class={item}>
										<ClipboardIcon />
										Paste
									</ContextMenu.Item>
								</ContextMenu.Group>
								<ContextMenu.Separator class={divider} />
								<ContextMenu.Sub>
									<ContextMenu.SubTrigger class={subTrigger}>More Options</ContextMenu.SubTrigger>
									<!-- Portalled out of the clipping panel — see the note above `submenu`. -->
									<ContextMenu.Portal>
										<ContextMenu.SubContent class={submenu}>
											<ContextMenu.Group>
												<ContextMenu.Item class={item}>Save Page...</ContextMenu.Item>
												<ContextMenu.Item class={item}>Create Shortcut...</ContextMenu.Item>
												<ContextMenu.Item class={item}>Name Window...</ContextMenu.Item>
											</ContextMenu.Group>
											<ContextMenu.Separator class={divider} />
											<ContextMenu.Group>
												<ContextMenu.Item class={item}>Developer Tools</ContextMenu.Item>
											</ContextMenu.Group>
										</ContextMenu.SubContent>
									</ContextMenu.Portal>
								</ContextMenu.Sub>
								<ContextMenu.Separator class={divider} />
								<ContextMenu.Group>
									<ContextMenu.Item variant="destructive" class={destructiveItem}>
										<TrashIcon />
										Delete
									</ContextMenu.Item>
								</ContextMenu.Group>
							</ContextMenu.Content>
						</ContextMenu.Root>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
