<script lang="ts">
	import BoldIcon from "@lucide/svelte/icons/bold";
	import FileIcon from "@lucide/svelte/icons/file";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import ImageIcon from "@lucide/svelte/icons/image";
	import ItalicIcon from "@lucide/svelte/icons/italic";
	import LinkIcon from "@lucide/svelte/icons/link";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import SaveIcon from "@lucide/svelte/icons/save";
	import UserIcon from "@lucide/svelte/icons/user";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Menubar from "$lib/components/ui/menubar/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Menubar component page, ported from shadcn-svelte's documentation
	 * (`/docs/components/menubar`), which ships exactly one example — the File / Edit /
	 * View / Profiles bar reproduced below. One example, so no `DocSection`s.
	 *
	 * THE CLASSIC THEME HAS NO MENUBAR. What it has is the two halves this component is built from,
	 * and they are documented separately: `.navbar` (`the reference docs#navbarDocs`,
	 * the reference stylesheet) for the bar of triggers, and `.dropdown-menu` / `.dropdown-item`
	 * (`#dropdowns`, the reference stylesheet) for the panel each one opens. The classic theme's navbar
	 * example is precisely that — a `.navbar-nav` whose third `.nav-item` carries a
	 * `.dropdown-toggle` and a `.dropdown-menu` — so the theme is the two ported vocabularies
	 * joined, and the menu values are the ones the Dropdown Menu page already derived.
	 *
	 * The bar is taken in its EXPANDED form (`.navbar-expand-*` above its breakpoint), since
	 * a menubar is always horizontal: that variant zeroes the navbar's own horizontal padding
	 * and sets each link to `padding: .625rem var(--bs-navbar-nav-link-padding-x)`. The
	 * collapsed form — a hamburger toggler over a stacked, transparent-backed menu — has no
	 * equivalent here and is not reproduced.
	 *
	 * Three pieces of this component have NO classic or the classic theme counterpart at all, and
	 * keep shadcn's defaults:
	 *
	 *   Menubar.Shortcut    the classic framework has no keyboard-shortcut element in a dropdown. Its
	 *                       `text-xs` does land on `font-size-sm` through this repo's type
	 *                       scale, but `tracking-widest` is shadcn's own; the classic theme's only
	 *                       widened tracking (`--label-tracking`, .08em) belongs to uppercase
	 *                       micro-labels such as table heads, which these are not.
	 *   CheckboxItem /      the classic framework dropdowns hold links, not stateful rows. Only the row
	 *   RadioItem           geometry is pulled onto the classic theme's grid (below); the check glyph
	 *                       and its column are shadcn's invention, kept as they are.
	 *   Sub / SubContent    the classic framework dropped nested dropdowns. The classic theme still carries one
	 *                       positioning rule for hand-rolled ones,
	 *                       `.navbar-nav .dropdown-menu .dropdown-menu { margin-left: calc(
	 *                       var(--bs-dropdown-item-padding-x) * .5) }` — but every
	 *                       `.navbar-expand-*` breakpoint resets that to `margin-left: 0`, so
	 *                       in the expanded bar the submenu is simply flush and there is
	 *                       nothing to apply.
	 */

	/** Docs-page state, verbatim. */
	let bookmarks = $state(false);
	let fullUrls = $state(true);
	let profileRadioValue = $state("benoit");

	/**
	 * The bar itself — `.navbar`, expanded.
	 *
	 *   h-auto             `.navbar` has no height; it is `navbar-padding-y` twice around
	 *                      whatever the links measure. shadcn pins `h-9`, which is 4px
	 *                      shorter than the 40px this resolves to
	 *   py-3               `navbar-padding-y: .75rem`
	 *   px-0               `.navbar-expand-* { padding-left: 0; padding-right: 0 }` above the
	 *                      breakpoint, so the first trigger sits flush with the card's gutter
	 *   gap-0              `.navbar-nav` is a plain flex list with no gap — the separation
	 *                      between triggers is each link's own `padding-x`, which is why the
	 *                      hover area of two neighbours touches
	 *   rounded-none       `.navbar` sets no radius
	 *   shadow-none        nor a shadow: `enable-shadows` is off, and the bar is separated
	 *                      from the page by its border alone
	 *   bg-card            `--bs-navbar-bg: navbar-light-bg` = `white` / `gray-800-dark`,
	 *                      which is `--card` exactly in both modes
	 *
	 * The border is the one value worth spelling out. `.navbar` sets
	 * `border-width: 0 0 var(--bs-border-width) 0` — a BOTTOM rule only, not shadcn's box —
	 * in `navbar-light-border-color`, which is `gray-300` (#E3EBF6) in light and
	 * `gray-800-dark` (#152E4D) in dark, i.e. flush with the bar's own background: the classic theme
	 * deliberately hides the rule in dark mode. `--border` would draw #EDF2F9 / #1E3A5C and
	 * so would be wrong in light and visible in dark, where the classic theme shows nothing.
	 *
	 * `--sidebar-border` is not a near miss here, it is the same Sass variable: this app's
	 * sidebar IS the classic theme's `.navbar-vertical.navbar-light`, and `app.css` records the token as
	 * `navbar-light-border-color` / `navbar-light-border-color-dark`. A horizontal navbar
	 * reads the same two values. (The Accordion page rejected this token for
	 * `accordion-border-color`, which only coincides with it in light mode; there the name
	 * would have been borrowed, here it is the component's own.)
	 *
	 * The classic theme's own navbar demo goes further and strips even this with `style="border: none"`,
	 * because its example sits inside a `.card-body` where a half-width rule reads as an
	 * accident. The rule is kept here — it is what the component looks like in the product.
	 */
	const bar =
		"h-auto gap-0 rounded-none border-0 border-b border-sidebar-border bg-card px-0 py-3 shadow-none";

	/**
	 * A trigger — `.navbar-nav .nav-link` in an expanded navbar.
	 *
	 *   py-2.5         `.navbar-expand-* .navbar-nav .nav-link { padding: .625rem … }`, the
	 *                  comment in the reference stylesheet explaining the raise: it aligns the active
	 *                  underline with the bottom of the navbar. shadcn's `py-1` is 6px short
	 *   px-2           `--bs-navbar-nav-link-padding-x: .5rem` — already shadcn's value,
	 *                  restated so the pair reads as one measurement
	 *   font-normal    `--bs-nav-link-font-weight` is empty, so a nav link inherits
	 *                  `font-weight-base` (400); shadcn asks for 500
	 *   rounded-none   `.nav-link` sets no radius, and with no fill there is nothing to round
	 *   text-sm        `font-size-base` (15px) through this repo's type scale — the size
	 *                  shadcn already uses
	 *
	 * The state colours are the same convention the Dropdown Menu page ported: NO FILL. A nav
	 * link signals hover by darkening its type — `--bs-navbar-color: gray-700` resting,
	 * `--bs-navbar-hover-color: black` (`white` in dark) on hover — and the classic
	 * `.navbar-nav .nav-link.show { color: var(--bs-navbar-active-color) }` gives the OPEN
	 * trigger that same darkened colour and nothing else, where shadcn fills it with
	 * `bg-muted`. `.show` is what `aria-expanded` stands in for here.
	 *
	 * `text-muted-foreground` rather than `text-sidebar-foreground`, even though the latter
	 * holds `navbar-light-color` (#6E84A3) exactly in both modes. `navbar-light-color` and
	 * `dropdown-link-color` are the SAME grey in the classic theme, and the menu items below take
	 * `--muted-foreground` from the Dropdown Menu page; splitting the page across two tokens
	 * would render the bar a step darker than the menus it opens, which the classic theme never does.
	 * The cost is the same one that page records — `--muted-foreground` is exact in dark and
	 * one step lighter in light. `--foreground` is the hover colour exactly in both modes.
	 *
	 * `transition-colors` is `.nav-link`'s own `transition: color .15s ease-in-out, …`;
	 * `.dropdown-item` has no such rule, which is why nothing below carries it.
	 */
	const trigger =
		"rounded-none px-2 py-2.5 text-sm font-normal text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground aria-expanded:bg-transparent aria-expanded:text-foreground";

	/**
	 * The menu surface — `.dropdown-menu`, unchanged from the Dropdown Menu page apart from the
	 * two values shadcn's menubar spells differently to its dropdown:
	 *
	 *   min-w-40      `dropdown-min-width: 10rem`, against shadcn's `min-w-36`
	 *   px-0 py-2     `--bs-dropdown-padding-x: 0` with `dropdown-padding-y: .5rem`; items
	 *                 run edge to edge and supply their own inset
	 *   rounded-md    `dropdown-border-radius: border-radius` (6px), against `rounded-lg`
	 *   text-sm       `--bs-dropdown-font-size: .9375rem` = `font-size-base`
	 *   shadow-none   `enable-shadows` is off: `--bs-dropdown-box-shadow` is declared in the
	 *                 compiled bundle but never consumed, so a classic menu is held off the
	 *                 page by its border alone. shadcn ships `shadow-md`
	 *
	 * The hairline is left as shadcn's `ring-1 ring-foreground/10` in light, because that is
	 * `dropdown-border-color: rgba(var(--bs-black-rgb), .1)` written out — `black` is
	 * `--foreground`. Dark mode is the exception TooltipPage also hit: `dropdown-border-
	 * color-dark` is solid `black`, i.e. #12263F, which in dark mode is `--background` and
	 * has no other token. Hence the one `dark:` override on the page.
	 *
	 * A navbar's menu keeps that border, incidentally — `.navbar-nav .dropdown-menu { border:
	 * none }` applies only while the navbar is COLLAPSED; every `.navbar-expand-*` breakpoint
	 * restores `border: var(--bs-dropdown-border-width) solid var(--bs-dropdown-border-color)`.
	 */
	const menu = "min-w-40 rounded-md px-0 py-2 text-sm shadow-none dark:ring-background";

	/**
	 * `dropdown-spacer: 0`, and the menu is positioned at `top: 100%; left: 0` of the
	 * `.nav-item` — the padded link box — so it is flush under the trigger and flush with its
	 * left edge. shadcn's `Content` defaults to `sideOffset={8} alignOffset={-4}`.
	 */
	const sideOffset = 0;
	const alignOffset = 0;

	/**
	 * THE CLASSIC DROPDOWNS ARE NOT MODAL; bits-ui's are. The Dropdown Menu page sets out the
	 * full reasoning — while a menu is open bits-ui puts `pointer-events: none` on
	 * `document.body`, so a click on a second trigger only dismisses the first. On a menubar
	 * the cost is higher than on a lone dropdown: moving from File to Edit is the component's
	 * primary gesture. `preventScroll={false}` drops the lock and restores it.
	 *
	 * Passed per `Content` rather than fixed globally, for the same reason as there: this is
	 * bits-ui's considered default, and changing it app-wide is a decision about behaviour
	 * rather than about theme.
	 */
	const nonModal = false;

	/**
	 * A menu item — `.dropdown-item`.
	 *
	 *   px-6           `--bs-dropdown-item-padding-x: 1.5rem`, against shadcn's `px-2`
	 *   py-1.5         `dropdown-item-padding-y: .375rem` — already shadcn's value
	 *   rounded-none   `.dropdown-item` takes `--bs-dropdown-item-border-radius, 0`
	 *
	 * The colours are the Dropdown Menu page's: `--bs-dropdown-link-hover-bg` is TRANSPARENT in
	 * the classic theme, so an item signals hover by darkening its type instead of filling, which is
	 * the opposite of shadcn's `focus:bg-accent`. Resting is `gray-700`, hover is `black`.
	 * `--bs-dropdown-link-active-color/-bg` are aliases of the hover pair, so the keyboard
	 * highlight and the pointer hover are the same state — which is what `focus:` already is
	 * for bits-ui.
	 */
	const item =
		"rounded-none px-6 py-1.5 text-sm text-muted-foreground focus:bg-transparent focus:text-foreground";

	/**
	 * A checkbox or radio row. The classic theme has no such thing, so only the parts that ARE
	 * `.dropdown-item` are pulled onto its grid: the colours and `py-1.5` as above, and the
	 * text inset moved from shadcn's `pl-8` back to the same `px-6` as a plain item.
	 *
	 * That works because the 24px gutter is wide enough to hold shadcn's 16px check with 4px
	 * either side — `left-1` centres the indicator inside it, where the component's own
	 * `left-2` was measured against its narrower `px-2`. Every row on the menu then shares one
	 * text inset, which is why the docs' `inset` prop is dropped from the markup below: it
	 * exists to push a plain item out to the indicator column, and here there is no step to
	 * cross.
	 *
	 * The indicator is targeted through the item because it is an internal element with no
	 * `class` prop of its own; it is reliably the first child of both row components.
	 */
	const checkItem =
		"rounded-none px-6 py-1.5 text-sm text-muted-foreground focus:bg-transparent focus:text-foreground [&>span:first-child]:left-1";

	/**
	 * `.dropdown-divider`: `margin: var(--bs-dropdown-divider-margin-y) 0` at .75rem, and a
	 * 1px rule in `--bs-dropdown-divider-bg`. `mx-0` cancels shadcn's `-mx-1`, which bleeds a
	 * separator into a menu padding that classic does not have.
	 *
	 * The colour is `rgba(black, .1)` in light and solid `black` in dark. Over the menu
	 * surface the light value resolves to roughly #E7EAEE, a shade off `--border`'s #EDF2F9;
	 * the dark value is one step darker than `--border`. As on the Dropdown Menu page the token
	 * wins, so the divider stays tied to every other hairline in the app.
	 */
	const divider = "mx-0 my-3 bg-border";

	/**
	 * A submenu trigger. `.dropdown-item.dropdown-toggle` is `display: flex; justify-content:
	 * space-between` with a Feather chevron in `::after` — the same layout as shadcn's
	 * `ml-auto` chevron, so only the open state needs restating: `data-open:bg-accent` becomes
	 * the transparent-ground, darkened-type pair every other row uses.
	 */
	const subTrigger = `${item} data-open:bg-transparent data-open:text-foreground`;

	/**
	 * The two sections below are demo 4 and demo 5 of the menubar demo set; the
	 * first three demos are not reproduced because the shadcn-svelte bar above already shows
	 * the same compositions — plain items with shortcuts, Share/Find submenus, and checkbox
	 * plus radio rows.
	 *
	 * The demos assume an `IconPlaceholder` that resolves per icon
	 * set; here each resolves to its Lucide name directly. The icons carry no sizing classes —
	 * the item and sub-trigger parts size any svg they contain — and every row reuses the
	 * classic-theme class constants derived above, so the ported menus sit on the same grid as the
	 * rest of the page.
	 */

	/** Checked states for the Format menu of demo 5 (upstream ships Strikethrough on). */
	let formatStrikethrough = $state(true);
	let formatCode = $state(false);
</script>

<DocPage title="Menubar">
	{#snippet subtitle()}
		A visually persistent menu common in desktop applications that provides quick access to a
		consistent set of commands. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/menubar"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<Menubar.Root class={bar}>
				<Menubar.Menu>
					<Menubar.Trigger class={trigger}>File</Menubar.Trigger>
					<Menubar.Content preventScroll={nonModal} {sideOffset} {alignOffset} class={menu}>
						<Menubar.Item class={item}>
							<!--
								The ⌘ and ⇧ glyphs are read from the demo source
								(`docs/src/lib/registry/examples/menubar-demo.svelte`), not from the docs page:
								served as markdown it strips them, which collapses ⌘Z / ⇧⌘Z and ⌘R / ⇧⌘R
								into two identical pairs and loses the modifier on every other row.
							-->
							New Tab <Menubar.Shortcut>⌘T</Menubar.Shortcut>
						</Menubar.Item>
						<Menubar.Item class={item}>
							New Window <Menubar.Shortcut>⌘N</Menubar.Shortcut>
						</Menubar.Item>
						<Menubar.Item class={item}>New Incognito Window</Menubar.Item>
						<Menubar.Separator class={divider} />
						<Menubar.Sub>
							<Menubar.SubTrigger class={subTrigger}>Share</Menubar.SubTrigger>
							<!--
								PORTALLED, and it has to be. `SubContent` is not portalled by the generated
								wrapper, so it lands as a DOM child of the panel that opened it — and
								`menubar-content` is `overflow-hidden`. A submenu opens to the right of that
								edge, so every pixel of it is outside and none of it is visible. Portalling
								is the fix that does not require editing a CLI-generated file.
							-->
							<Menubar.Portal>
								<Menubar.SubContent class={menu}>
									<Menubar.Item class={item}>Email link</Menubar.Item>
									<Menubar.Item class={item}>Messages</Menubar.Item>
									<Menubar.Item class={item}>Notes</Menubar.Item>
								</Menubar.SubContent>
							</Menubar.Portal>
						</Menubar.Sub>
						<Menubar.Separator class={divider} />
						<Menubar.Item class={item}>
							Print... <Menubar.Shortcut>⌘P</Menubar.Shortcut>
						</Menubar.Item>
					</Menubar.Content>
				</Menubar.Menu>

				<Menubar.Menu>
					<Menubar.Trigger class={trigger}>Edit</Menubar.Trigger>
					<Menubar.Content preventScroll={nonModal} {sideOffset} {alignOffset} class={menu}>
						<Menubar.Item class={item}>
							Undo <Menubar.Shortcut>⌘Z</Menubar.Shortcut>
						</Menubar.Item>
						<Menubar.Item class={item}>
							Redo <Menubar.Shortcut>⇧⌘Z</Menubar.Shortcut>
						</Menubar.Item>
						<Menubar.Separator class={divider} />
						<Menubar.Sub>
							<Menubar.SubTrigger class={subTrigger}>Find</Menubar.SubTrigger>
							<!-- Portalled out of the clipping panel, as above. -->
							<Menubar.Portal>
								<Menubar.SubContent class={menu}>
									<Menubar.Item class={item}>Search the web</Menubar.Item>
									<Menubar.Separator class={divider} />
									<Menubar.Item class={item}>Find...</Menubar.Item>
									<Menubar.Item class={item}>Find Next</Menubar.Item>
									<Menubar.Item class={item}>Find Previous</Menubar.Item>
								</Menubar.SubContent>
							</Menubar.Portal>
						</Menubar.Sub>
						<Menubar.Separator class={divider} />
						<Menubar.Item class={item}>Cut</Menubar.Item>
						<Menubar.Item class={item}>Copy</Menubar.Item>
						<Menubar.Item class={item}>Paste</Menubar.Item>
					</Menubar.Content>
				</Menubar.Menu>

				<Menubar.Menu>
					<Menubar.Trigger class={trigger}>View</Menubar.Trigger>
					<Menubar.Content preventScroll={nonModal} {sideOffset} {alignOffset} class={menu}>
						<Menubar.CheckboxItem class={checkItem} bind:checked={bookmarks}>
							Always Show Bookmarks Bar
						</Menubar.CheckboxItem>
						<Menubar.CheckboxItem class={checkItem} bind:checked={fullUrls}>
							Always Show Full URLs
						</Menubar.CheckboxItem>
						<Menubar.Separator class={divider} />
						<Menubar.Item class={item}>
							Reload <Menubar.Shortcut>⌘R</Menubar.Shortcut>
						</Menubar.Item>
						<Menubar.Item class={item}>
							Force Reload <Menubar.Shortcut>⇧⌘R</Menubar.Shortcut>
						</Menubar.Item>
						<Menubar.Separator class={divider} />
						<Menubar.Item class={item}>Toggle Fullscreen</Menubar.Item>
						<Menubar.Separator class={divider} />
						<Menubar.Item class={item}>Hide Sidebar</Menubar.Item>
					</Menubar.Content>
				</Menubar.Menu>

				<Menubar.Menu>
					<Menubar.Trigger class={trigger}>Profiles</Menubar.Trigger>
					<Menubar.Content preventScroll={nonModal} {sideOffset} {alignOffset} class={menu}>
						<Menubar.RadioGroup bind:value={profileRadioValue}>
							<Menubar.RadioItem class={checkItem} value="andy">Andy</Menubar.RadioItem>
							<Menubar.RadioItem class={checkItem} value="benoit">Benoit</Menubar.RadioItem>
							<Menubar.RadioItem class={checkItem} value="Luis">Luis</Menubar.RadioItem>
						</Menubar.RadioGroup>
						<Menubar.Separator class={divider} />
						<Menubar.Item class={item}>Edit...</Menubar.Item>
						<Menubar.Separator class={divider} />
						<Menubar.Item class={item}>Add Profile...</Menubar.Item>
					</Menubar.Content>
				</Menubar.Menu>
			</Menubar.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Menubar with icons">
		{#snippet blurb()}
			Rows may lead with an icon; the item part sizes it, and a destructive row recolours it through
			its own <code>variant</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Menubar.Root class={bar}>
					<Menubar.Menu>
						<Menubar.Trigger class={trigger}>File</Menubar.Trigger>
						<Menubar.Content preventScroll={nonModal} {sideOffset} {alignOffset} class={menu}>
							<Menubar.Item class={item}>
								<FileIcon />
								New File <Menubar.Shortcut>⌘N</Menubar.Shortcut>
							</Menubar.Item>
							<Menubar.Item class={item}>
								<FolderIcon />
								Open Folder
							</Menubar.Item>
							<Menubar.Separator class={divider} />
							<Menubar.Item class={item}>
								<SaveIcon />
								Save <Menubar.Shortcut>⌘S</Menubar.Shortcut>
							</Menubar.Item>
						</Menubar.Content>
					</Menubar.Menu>

					<Menubar.Menu>
						<Menubar.Trigger class={trigger}>Account</Menubar.Trigger>
						<Menubar.Content preventScroll={nonModal} {sideOffset} {alignOffset} class={menu}>
							<Menubar.Group>
								<Menubar.Item class={item}>
									<UserIcon />
									Profile
								</Menubar.Item>
								<Menubar.Separator class={divider} />
								<!--
									The destructive row keeps the item's own variant rules on top of the
									classic-theme constants: the `data-variant` selectors are more specific than
									the flat classes in `item`, so the red type and the tinted focus fill
									win over the grey/no-fill pair without any extra class.
								-->
								<Menubar.Item class={item} variant="destructive">
									<LogOutIcon />
									Sign out
								</Menubar.Item>
							</Menubar.Group>
						</Menubar.Content>
					</Menubar.Menu>
				</Menubar.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Menubar for formatting and media">
		{#snippet blurb()}
			An editor-style bar mixing icon items, checkable toggles and an iconed submenu — the
			arrangement a text editor's menu row actually takes.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Menubar.Root class={bar}>
					<Menubar.Menu>
						<Menubar.Trigger class={trigger}>Format</Menubar.Trigger>
						<Menubar.Content preventScroll={nonModal} {sideOffset} {alignOffset} class={menu}>
							<Menubar.Item class={item}>
								<BoldIcon />
								Bold <Menubar.Shortcut>⌘B</Menubar.Shortcut>
							</Menubar.Item>
							<Menubar.Item class={item}>
								<ItalicIcon />
								Italic <Menubar.Shortcut>⌘I</Menubar.Shortcut>
							</Menubar.Item>
							<Menubar.Separator class={divider} />
							<Menubar.CheckboxItem class={checkItem} bind:checked={formatStrikethrough}>
								Strikethrough
							</Menubar.CheckboxItem>
							<Menubar.CheckboxItem class={checkItem} bind:checked={formatCode}>
								Code
							</Menubar.CheckboxItem>
						</Menubar.Content>
					</Menubar.Menu>

					<Menubar.Menu>
						<Menubar.Trigger class={trigger}>Insert</Menubar.Trigger>
						<Menubar.Content preventScroll={nonModal} {sideOffset} {alignOffset} class={menu}>
							<Menubar.Sub>
								<Menubar.SubTrigger class={subTrigger}>
									<ImageIcon />
									Media
								</Menubar.SubTrigger>
								<!-- Portalled out of the clipping `overflow-hidden` panel, as above. -->
								<Menubar.Portal>
									<Menubar.SubContent class={menu}>
										<Menubar.Item class={item}>Image</Menubar.Item>
										<Menubar.Item class={item}>Video</Menubar.Item>
									</Menubar.SubContent>
								</Menubar.Portal>
							</Menubar.Sub>
							<Menubar.Separator class={divider} />
							<Menubar.Item class={item}>
								<LinkIcon />
								Link <Menubar.Shortcut>⌘K</Menubar.Shortcut>
							</Menubar.Item>
						</Menubar.Content>
					</Menubar.Menu>
				</Menubar.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
