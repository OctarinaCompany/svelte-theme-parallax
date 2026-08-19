<script lang="ts">
	import ActivityIcon from "@lucide/svelte/icons/activity";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ShieldIcon from "@lucide/svelte/icons/shield";
	import XIcon from "@lucide/svelte/icons/x";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as Item from "$lib/components/ui/item/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Select component page. The first half follows shadcn-svelte's documented demos
	 * (`https://shadcn-svelte.com/docs/components/select`); the sections from "Select with
	 * icons and placeholder state" on extend them with further compositions.
	 *
	 * The house select is styled as two halves that read as one control family with the rest
	 * of the theme:
	 *
	 *   the trigger   wears the text inputs' chrome — same height, inset, border, radius and
	 *                 fill — so a form mixes selects and inputs without a seam
	 *   the menu      wears the dropdown surface — 10rem minimum width, vertical padding
	 *                 only, options running edge to edge — and takes the width of the
	 *                 control rather than of its content
	 *
	 * Two shadcn-svelte behaviours stay exactly as shipped, because nothing in this theme
	 * says otherwise:
	 *
	 *   - the check mark on the selected item, and the `pr-8` that reserves its room
	 *   - the scroll-up / scroll-down buttons `Select.Content` renders when the list
	 *     overflows
	 *
	 * The drop shadow is removed rather than kept: elevation is deferred repo-wide, the same
	 * call `app.css` records for the card shadow.
	 *
	 * One value stays approximate. The placeholder grey rides `--muted-foreground` through
	 * shadcn's `data-placeholder:` class — one ladder step darker than ideal in light and one
	 * lighter in dark. No token carries the ideal value under a name that means "faint text"
	 * here, so the default stands.
	 */

	/**
	 * The trigger — `.form-select`, read off the compiled bundle:
	 *
	 *   padding: .5rem 1.75rem .5rem .75rem; line-height: 1.5; font-size: .9375rem;
	 *   border: 1px solid var(--bs-gray-400); border-radius: var(--bs-border-radius);
	 *   background-color: #fff; color: var(--bs-body-color)
	 *
	 * Three of those need nothing: `rounded-md` is already `border-radius`, `border-input` is
	 * already `input-border-color` = `gray-400` (and `input-border-color-dark` =
	 * `gray-700-dark` in dark), and `text-sm` is already `font-size-base`, since `--text-sm`
	 * is mapped to 0.9375rem in `app.css`. What is left:
	 *
	 *   height      .5rem + .5rem padding + 1.5 × 15px line box + 2 × 1px border = 40.5px,
	 *               the same arithmetic the Buttons page ran for `btn-padding-y` — and no
	 *               longer this page's to state: `src/app.css` pins every default-size
	 *               trigger to `--control-h-default` (40px) with an unlayered rule, so the
	 *               `data-[size=default]:h-10` recipe this const used to carry is retired.
	 *   px-3        `input-padding-x: .75rem`. The classic 1.75rem on the right is room for a
	 *               background-image caret pinned at `right .75rem center`; with the caret as
	 *               a real flex child, `.75rem` on both sides puts it in the same place.
	 *   bg-card     `input-bg: white`, which `--card` holds. The dark half is
	 *               `input-bg-dark: gray-700-dark` (#1E3A5C) — that is `--secondary`, not
	 *               `--card` (#152E4D), so the two modes genuinely need different tokens and
	 *               the `dark:` override is the honest way to say it. It also displaces
	 *               shadcn's `dark:bg-input/30`, a translucent fill the classic theme does not have.
	 *   hover       `.form-select` has no hover rule at all, so shadcn's
	 *               `dark:hover:bg-input/50` is pinned back to the resting colour.
	 *   shadow-none `.form-select` carries no `box-shadow` in the compiled bundle; shadcn adds
	 *               `shadow-xs`.
	 *   ring-0      `.form-select:focus` is `border-color: var(--bs-primary); box-shadow: none`
	 *               — `input-btn-focus-box-shadow: none` deletes the classic focus glow
	 *               theme-wide. The border half already matches: shadcn's
	 *               `focus-visible:border-ring` and `--ring` is `input-focus-border-color` =
	 *               `primary`. Only the 3px ring has to go.
	 *
	 * `.form-select` is also `display: block; width: 100%` — a classic select fills its form
	 * column. The fixed widths below are the shadcn docs examples', kept so the two pages can
	 * be compared.
	 */
	const trigger =
		"rounded-md border-input bg-card px-3 shadow-none focus-visible:ring-0 dark:bg-secondary dark:hover:bg-secondary";

	/**
	 * Squaring the joint. the open-state rule flattens the control's bottom
	 * corners and the menu below it gets `margin-top: -dropdown-border-width` plus flat top
	 * corners — the open control and its menu read as one box, which is the most recognisable
	 * thing about a classic select. `dropdown-spacer: 0` on top of that -1px is why
	 * `sideOffset` drops from shadcn's 4 to -1.
	 *
	 * Only the downward case is handled, because the reference stylesheet only handles the downward
	 * case too: it has no `.is-flipped` rule. The menu keeps its radius when bits-ui flips it
	 * upwards; the trigger cannot know that it flipped, so a flipped menu leaves the control's
	 * bottom corners square. The classic theme has the same gap.
	 */
	const triggerOpen = "data-[state=open]:rounded-b-none";

	/**
	 * The menu surface, i.e. `.dropdown-menu` as the Dropdowns page already derived it:
	 * `dropdown-min-width: 10rem`, `dropdown-padding-y: .5rem` with `--bs-dropdown-padding-x: 0`
	 * so items run edge to edge, `dropdown-border-radius: border-radius`, and
	 * `dropdown-font-size: font-size-base`.
	 *
	 * The border needs a word. `dropdown-border-color` is `rgba(var(--bs-black-rgb), .1)` and
	 * the classic theme's `black` IS `--foreground` (#12263F), so shadcn's `ring-1 ring-foreground/10`
	 * is that value exactly — nothing to do in light mode. Dark mode inverts it to
	 * `rgba(255,255,255,.1)` where `dropdown-border-color-dark` is solid `black`; `--background`
	 * is #12263F in dark, so `dark:ring-background` restates the classic value rather than
	 * approximating it. Same problem, same shape of fix, as the card outline in `app.css`.
	 */
	const menu =
		"min-w-40 rounded-md px-0 py-2 text-sm data-[side=bottom]:rounded-t-none dark:ring-background";

	/**
	 * the vendor menu rule ties the menu to the control,
	 * unlike a plain classic dropdown, which is content-sized. `--bits-select-anchor-width`
	 * is the trigger's width, so this is the same statement.
	 */
	const menuAnchored = "w-(--bits-select-anchor-width)";

	/**
	 * An option — `.dropdown-item`, with the widget inset:
	 *
	 *   py-1.5     `--bs-dropdown-item-padding-y: 0.375rem`, which shadcn already matches
	 *   pl-3       the vendor item-inset rule
	 *              — 0.75rem, so the option lines up under the control's own text rather than
	 *              under the dropdown's usual 1.5rem. The right inset stays shadcn's `pr-8`,
	 *              since that reserves room for a check mark the classic theme has no equivalent of.
	 *   rounded-none  `.dropdown-item` resolves `--bs-dropdown-item-border-radius` to 0
	 *
	 * The colours are the Dropdowns page's finding again: `--bs-dropdown-link-hover-bg` is
	 * TRANSPARENT, so a classic item signals hover by darkening its type, never by filling —
	 * and the reference stylesheet says it a second time for the keyboard case
	 * (`.dropdown-item.is-highlighted { color: var(--bs-dropdown-link-hover-color) }`).
	 *
	 * Only the fill is removed. The two text colours are already right: `dropdown-link-color`
	 * is `gray-700` (#6E84A3), which `--muted-foreground` holds exactly in dark and one step
	 * lighter in light, and `dropdown-link-hover-color` is `black` / `white` — which is what
	 * `--accent-foreground` carries in both modes, so shadcn's own
	 * `focus:text-accent-foreground` lands on the classic value untouched.
	 *
	 * Disabled items are left alone too. The classic framework greys them to `--bs-tertiary-color`
	 * (`rgba(18,38,63,.5)`, the body colour at half alpha); shadcn halves the item's own colour
	 * with `data-[disabled]:opacity-50`. Same weight, and the hue difference is invisible.
	 */
	const item =
		"rounded-none py-1.5 pl-3 text-muted-foreground focus:bg-transparent data-highlighted:bg-transparent";

	/**
	 * `Select.Group` ships `p-1`, which would inset the options 4px from a menu whose own
	 * `--bs-dropdown-padding-x` is 0. The menu supplies the vertical padding, the items supply
	 * the horizontal, so the group supplies nothing.
	 */
	const optionGroup = "p-0";

	/**
	 * The group heading — a solid SECONDARY BADGE, by decision rather than by derivation.
	 *
	 * Neither source dictates this. The classic `.dropdown-header` inherits the menu's body
	 * colour (a default nobody in the classic theme designed), and an earlier version of this page used
	 * the classic theme's pretitle micro-label instead. The badge replaces both: the group name reads as
	 * a chip, unmistakably not an option.
	 *
	 * Both halves restate the Badges page's derivations verbatim, so the two pages cannot
	 * drift: the geometry is its `shape` (the classic theme's `badge-*` em box on `border-radius`),
	 * the colours its solid `Secondary` — `bg-muted-foreground` because `secondary` is
	 * `gray-700`, which `--muted-foreground` holds exactly in dark and one step light in
	 * light; `--secondary` itself carries a different colour in this theme (see §4.1 of
	 * the theme notes).
	 *
	 * The ROW keeps the inset the pretitle had: `px-3` aligns the chip's left edge over the
	 * options' text (the classic framework gives header and item the same padding-x), `py-2` is
	 * `dropdown-header-padding-y`, and `text-sm` gives the badge's 76% em sizing the menu's
	 * own type size to track, not `Select.Label`'s smaller `text-xs`.
	 */
	const headingRow = "block px-3 py-2 text-sm";

	const headingBadge =
		"h-auto rounded-md px-[0.5em] py-[0.33em] align-middle text-[76%] leading-none font-normal bg-muted-foreground text-primary-foreground";

	const fruits = [
		{ value: "apple", label: "Apple" },
		{ value: "banana", label: "Banana" },
		{ value: "blueberry", label: "Blueberry" },
		{ value: "grapes", label: "Grapes" },
		{ value: "pineapple", label: "Pineapple" },
	];

	let fruit = $state("");
	const fruitLabel = $derived(fruits.find((f) => f.value === fruit)?.label ?? "Select a fruit");

	const themes = [
		{ value: "light", label: "Light" },
		{ value: "dark", label: "Dark" },
		{ value: "system", label: "System" },
	];

	let theme = $state("");
	const themeLabel = $derived(themes.find((t) => t.value === theme)?.label ?? "Theme");

	const timezones = [
		{
			region: "North America",
			zones: [
				{ value: "est", label: "Eastern Standard Time (EST)" },
				{ value: "cst", label: "Central Standard Time (CST)" },
				{ value: "mst", label: "Mountain Standard Time (MST)" },
				{ value: "pst", label: "Pacific Standard Time (PST)" },
				{ value: "akst", label: "Alaska Standard Time (AKST)" },
				{ value: "hst", label: "Hawaii Standard Time (HST)" },
			],
		},
		{
			region: "Europe & Africa",
			zones: [
				{ value: "gmt", label: "Greenwich Mean Time (GMT)" },
				{ value: "cet", label: "Central European Time (CET)" },
				{ value: "eet", label: "Eastern European Time (EET)" },
				{ value: "west", label: "Western European Summer Time (WEST)" },
				{ value: "cat", label: "Central Africa Time (CAT)" },
				{ value: "eat", label: "East Africa Time (EAT)" },
			],
		},
		{
			region: "Asia",
			zones: [
				{ value: "msk", label: "Moscow Time (MSK)" },
				{ value: "ist", label: "India Standard Time (IST)" },
				{ value: "cst_china", label: "China Standard Time (CST)" },
				{ value: "jst", label: "Japan Standard Time (JST)" },
				{ value: "kst", label: "Korea Standard Time (KST)" },
				{ value: "ist_indonesia", label: "Indonesia Central Standard Time (WITA)" },
			],
		},
		{
			region: "Australia & Pacific",
			zones: [
				{ value: "awst", label: "Australian Western Standard Time (AWST)" },
				{ value: "acst", label: "Australian Central Standard Time (ACST)" },
				{ value: "aest", label: "Australian Eastern Standard Time (AEST)" },
				{ value: "nzst", label: "New Zealand Standard Time (NZST)" },
				{ value: "fjt", label: "Fiji Time (FJT)" },
			],
		},
		{
			region: "South America",
			zones: [
				{ value: "art", label: "Argentina Time (ART)" },
				{ value: "bot", label: "Bolivia Time (BOT)" },
				{ value: "brt", label: "Brasilia Time (BRT)" },
				{ value: "clt", label: "Chile Standard Time (CLT)" },
			],
		},
	];

	let timezone = $state("");
	const timezoneLabel = $derived(
		timezones.flatMap((g) => g.zones).find((z) => z.value === timezone)?.label ??
			"Select a timezone",
	);

	/**
	 * THE PATTERN APPENDIX. Everything from "Select with icons and placeholder state" down is
	 * the select demo set — the same continuation the Input page
	 * makes after its shadcn half. Two standing translations apply to all of them:
	 *
	 *   - A `<SelectValue>` part has no bits-ui counterpart — the trigger renders whatever it
	 *     is given — so every trigger below renders a `$derived` label instead, the same move
	 *     the shadcn-svelte sections above already make.
	 *   - every section reuses the classic class recipes at the top of this file (`trigger`,
	 *     `menu`, `item`, ...), so the appendix examples wear the same skin as the rest
	 *     of the page rather than introducing a second look.
	 *
	 * Five demos are not repeated because a section above already shows the same composition,
	 * or because bits-ui has no equivalent to show:
	 *
	 *   demo 1  the intro card and "Usage" — a basic fruit list
	 *   demo 4  a 100-item list; "Scrollable" already shows the capped, scrolling panel
	 *   demo 7  "item alignment disabled" is bits-ui's only positioning mode, and the
	 *                   rest of the demo repeats the intro card (fruits with Grapes disabled)
	 *   demo 12 single selection — every select on this page is `type="single"`
	 *   demo 15 "item alignment enabled": Radix's item-aligned mode, where the panel
	 *                   opens with the selected item over the trigger, does not exist in
	 *                   bits-ui, so there is nothing to illustrate
	 */

	/**
	 * `.form-label` is `margin-bottom: .5rem` and nothing else — the label keeps
	 * `font-weight-base` (400) where shadcn's `Label` asks for `font-medium`. The Input page
	 * records the full derivation; this constant rides along on every `FieldLabel` below.
	 */
	const fieldLabel = "font-normal";

	/**
	 * The Submit button beside a field, sized like the Input page's Subscribe button: `h-10`
	 * is the base `btn-*` size derived on the Buttons page, so button and control resolve to
	 * the same 40px the `trigger` recipe above gives the select.
	 */
	const fieldButton = "h-10 rounded-md px-3 text-sm font-normal";

	/**
	 * demo 2 — the lucide icon names it
	 * lists are imported directly. Its first row (a `ScanIcon` placeholder entry with a null
	 * value) is data upstream filters out before rendering, so it is not carried over.
	 */
	const iconOptions = [
		{ value: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
		{ value: "activity", label: "Activity", icon: ActivityIcon },
		{ value: "security", label: "Security", icon: ShieldIcon },
		{ value: "settings", label: "Settings", icon: SettingsIcon },
	];

	let iconOption = $state("");
	const iconOptionSelected = $derived(iconOptions.find((o) => o.value === iconOption));

	/** demo 3. */
	const groupedFruits = [
		{ value: "apple", label: "Apple" },
		{ value: "banana", label: "Banana" },
		{ value: "blueberry", label: "Blueberry" },
	];
	const groupedVegetables = [
		{ value: "carrot", label: "Carrot" },
		{ value: "broccoli", label: "Broccoli" },
		{ value: "spinach", label: "Spinach" },
	];

	let groupedProduce = $state("");
	const groupedProduceLabel = $derived(
		[...groupedFruits, ...groupedVegetables].find((o) => o.value === groupedProduce)?.label ??
			"Select an option",
	);

	/**
	 * The three-fruit list `c-select-5`, `c-select-9` and `c-select-14` share — the head of the
	 * `fruits` list the shadcn half of this page already declares.
	 */
	const shortFruits = fruits.slice(0, 3);

	let smallFruit = $state("");
	const smallFruitLabel = $derived(
		shortFruits.find((f) => f.value === smallFruit)?.label ?? "Select a fruit",
	);

	/** demo 6. */
	const planOptions = [
		{ name: "Starter", description: "Perfect for individuals getting started." },
		{ name: "Professional", description: "Ideal for growing teams and businesses." },
		{ name: "Enterprise", description: "Advanced features for large organizations." },
	];

	let plan = $state("Starter");
	const planSelected = $derived(planOptions.find((p) => p.name === plan) ?? planOptions[0]);

	let favoriteFruit = $state("");
	const favoriteFruitLabel = $derived(
		fruits.find((f) => f.value === favoriteFruit)?.label ?? "Select a fruit",
	);

	let invalidFruit = $state("");
	const invalidFruitLabel = $derived(
		shortFruits.find((f) => f.value === invalidFruit)?.label ?? "Select a fruit",
	);

	let dialogFruit = $state("");
	const dialogFruitLabel = $derived(
		fruits.find((f) => f.value === dialogFruit)?.label ?? "Select a fruit",
	);

	/** demo 13. */
	const inlineFilters = [
		{ value: "all", label: "All" },
		{ value: "active", label: "Active" },
		{ value: "inactive", label: "Inactive" },
	];

	let inlineFilter = $state("");
	const inlineFilterLabel = $derived(
		inlineFilters.find((f) => f.value === inlineFilter)?.label ?? "Filter",
	);

	let submitFruit = $state("");
	const submitFruitLabel = $derived(
		shortFruits.find((f) => f.value === submitFruit)?.label ?? "Select a fruit",
	);

	/** demo 16. */
	const accessLevels = [
		{ value: "full_access", label: "Full access", description: "Can modify list access" },
		{ value: "read_write", label: "Read and write", description: "Can edit & publish lists" },
		{ value: "read_only", label: "Read only", description: "Can only view lists" },
		{ value: "no_access", label: "No access", description: "Cannot view or edit lists" },
	];

	let accessLevel = $state("read_write");
	const accessLevelSelected = $derived(
		accessLevels.find((l) => l.value === accessLevel) ?? accessLevels[1],
	);

	/**
	 * demo 17, its palette translated to tokens: upstream's `bg-violet-500`,
	 * `bg-green-500` and `bg-yellow-500` are raw colours this repository does not write, so
	 * those dots take `--info`, `--success` and `--warning`; `bg-primary` and `bg-destructive`
	 * were already tokens and stand unchanged.
	 */
	const bulletStatuses = [
		{ value: "1", label: "In Progress", color: "bg-info" },
		{ value: "2", label: "Completed", color: "bg-success" },
		{ value: "3", label: "Pending", color: "bg-primary" },
		{ value: "4", label: "Cancelled", color: "bg-warning" },
		{ value: "5", label: "Rejected", color: "bg-destructive" },
	];

	let bulletStatus = $state("2");
	const bulletStatusSelected = $derived(
		bulletStatuses.find((s) => s.value === bulletStatus) ?? bulletStatuses[1],
	);

	/**
	 * demo 18, names and initials unchanged. Its stock portraits are dropped in
	 * favour of the fallback initials it also ships — this repository loads no photographs,
	 * the same substitution the Filters page records for its assignee lists. The two `LT`
	 * initials pairs are upstream's own data, kept as-is.
	 */
	const assignees = [
		{ value: "1", name: "Alex Johnson", initials: "AJ" },
		{ value: "2", name: "Sarah Chen", initials: "SC" },
		{ value: "3", name: "Michael Rodriguez", initials: "MR" },
		{ value: "4", name: "Emma Wilson", initials: "EW" },
		{ value: "5", name: "David Kim", initials: "DK" },
		{ value: "6", name: "Aron Thompson", initials: "LT" },
		{ value: "7", name: "James Brown", initials: "JB" },
		{ value: "8", name: "Maria Garcia", initials: "MG" },
		{ value: "9", name: "Nick Johnson", initials: "NJ" },
		{ value: "10", name: "Liam Thompson", initials: "LT" },
	];

	let assignee = $state("3");
	const assigneeSelected = $derived(assignees.find((u) => u.value === assignee) ?? assignees[2]);

	/**
	 * The demos from c-select-19 on continue below, under the same two standing translations.
	 * Eight more are not repeated, because a section already on the page — or one this
	 * continuation adds — shows the same composition:
	 *
	 *   demo 23  colored status dots — the dot-before-label item and trigger are the
	 *   demo 26  "Select with colored bullets for status" section, twice over
	 *   demo 24  two labelled groups with a separator — the c-select-3 section
	 *   demo 27  a label with a description under it — the c-select-16 section
	 *   demo 29  avatar items with a group label — the c-select-18 section
	 *   demo 30  priority badges per option — the same badge-in-item composition as
	 *                    c-select-19 below; worse, its `warning` / `warning-light` rungs both
	 *                    land on `warning-subtle` under the house badge set, so the ladder
	 *                    would show two identical steps
	 *   demo 32  icon-labelled options — the c-select-2 section
	 *   demo 33  a `size="sm"` trigger — the c-select-5 section
	 */

	/**
	 * demo 19, its badges translated: each status wants a `{state}-outline`
	 * badge, a family the house Badge does not have, so every one takes the corresponding
	 * `{state}-subtle` variant — the standing soft mapping, applied to `primary-outline` too.
	 */
	const badgeStatuses: { value: string; label: string; variant: BadgeVariant }[] = [
		{ value: "1", label: "In Progress", variant: "warning-subtle" },
		{ value: "2", label: "Completed", variant: "success-subtle" },
		{ value: "3", label: "Pending", variant: "info-subtle" },
		{ value: "4", label: "Cancelled", variant: "primary-subtle" },
		{ value: "5", label: "Rejected", variant: "destructive-subtle" },
	];

	let badgeStatus = $state("3");
	const badgeStatusSelected = $derived(
		badgeStatuses.find((s) => s.value === badgeStatus) ?? badgeStatuses[2],
	);

	/**
	 * demo 20. Its first row (a null-valued "Select an option" entry) is data upstream
	 * slices off before rendering, so it is not carried over — the same trim the icon demo's
	 * comment records.
	 */
	const leftIndicatorOptions = [
		{ value: "1", label: "Option 1" },
		{ value: "2", label: "Option 2" },
		{ value: "3", label: "Option 3" },
	];

	let leftIndicatorOption = $state("");
	const leftIndicatorLabel = $derived(
		leftIndicatorOptions.find((o) => o.value === leftIndicatorOption)?.label ?? "Select an option",
	);

	/** demo 21 — its `IconPlaceholder` resolves to lucide's `XIcon` for the clear affordance. */
	const clearFrameworks = [
		{ value: "next", label: "Next.js" },
		{ value: "svelte", label: "SvelteKit" },
		{ value: "nuxt", label: "Nuxt.js" },
		{ value: "remix", label: "Remix" },
		{ value: "astro", label: "Astro" },
	];

	let clearFramework = $state("");
	const clearFrameworkLabel = $derived(
		clearFrameworks.find((f) => f.value === clearFramework)?.label ?? "Select framework",
	);

	/** demo 22 — upstream's six-fruit list is the page's `fruits` plus Strawberry. */
	const chevronFruits = [...fruits, { value: "strawberry", label: "Strawberry" }];

	let chevronFruit = $state("");
	const chevronFruitLabel = $derived(
		chevronFruits.find((f) => f.value === chevronFruit)?.label ?? "Select an option",
	);

	/**
	 * demo 25. The flags stay, unlike the Filters page's, because they are different
	 * things: that page's country lists fetched 171 SVGs from flagcdn.com, and the no-images
	 * rule removed the fetch; these are emoji code points in the data itself — text, loading
	 * nothing.
	 */
	const countries = [
		{ value: "us", label: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
		{ value: "gb", label: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
		{ value: "de", label: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
		{ value: "fr", label: "France", flag: "\u{1F1EB}\u{1F1F7}" },
		{ value: "jp", label: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
		{ value: "au", label: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
	];

	let country = $state("us");
	const countrySelected = $derived(countries.find((c) => c.value === country) ?? countries[0]);

	/**
	 * demo 28, reshaped the way the Scrollable section's `timezones` already are: three
	 * region arrays become one array of `{ region, zones }` groups, so the markup is one nested
	 * `{#each}` instead of three copies of the same group. The zones and offsets are upstream's.
	 */
	const utcRegions = [
		{
			region: "Americas",
			zones: [
				{ value: "est", label: "EST", offset: "UTC-5" },
				{ value: "cst", label: "CST", offset: "UTC-6" },
				{ value: "pst", label: "PST", offset: "UTC-8" },
			],
		},
		{
			region: "Europe",
			zones: [
				{ value: "gmt", label: "GMT", offset: "UTC+0" },
				{ value: "cet", label: "CET", offset: "UTC+1" },
			],
		},
		{
			region: "Asia",
			zones: [
				{ value: "ist", label: "IST", offset: "UTC+5:30" },
				{ value: "jst", label: "JST", offset: "UTC+9" },
			],
		},
	];

	let utcZone = $state("");
	const utcZoneLabel = $derived.by(() => {
		const zone = utcRegions.flatMap((r) => r.zones).find((z) => z.value === utcZone);
		return zone ? `${zone.label} (${zone.offset})` : "Select a timezone";
	});

	/** demo 31. */
	const fontOptions = [
		{ value: "sans", label: "Inter", class: "font-sans" },
		{ value: "mono", label: "Mono", class: "font-mono" },
		{ value: "serif", label: "Serif", class: "font-serif" },
	];

	let fontOption = $state("sans");
	const fontOptionSelected = $derived(
		fontOptions.find((f) => f.value === fontOption) ?? fontOptions[0],
	);
</script>

<DocPage title="Select">
	{#snippet subtitle()}
		Displays a list of options for the user to pick from, triggered by a button. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/select"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options, and the
		<a class="text-primary underline underline-offset-3" href="#/components/combobox"
			>Combobox page</a
		> for how the type-to-pick components divide their roles.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<Select.Root type="single" bind:value={fruit}>
				<!--
					`w-[180px]` is the docs example's own width. Until a fruit is picked, bits-ui puts
					`data-placeholder` on the trigger, which is what greys `Select a fruit` — see the
					header comment for how close that grey gets to `input-placeholder-color`.
				-->
				<Select.Trigger class={cn(trigger, triggerOpen, "w-[180px]")}>
					{fruitLabel}
				</Select.Trigger>
				<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
					<Select.Group class={optionGroup}>
						<Select.Label class={headingRow}>
							<Badge class={headingBadge}>Fruits</Badge>
						</Select.Label>
						{#each fruits as f (f.value)}
							<Select.Item
								class={item}
								value={f.value}
								label={f.label}
								disabled={f.value === "grapes"}
							>
								{f.label}
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Usage">
		{#snippet blurb()}
			The minimal form: a trigger, a panel and three options, with no group and no heading.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Select.Root type="single" bind:value={theme}>
					<Select.Trigger class={cn(trigger, triggerOpen, "w-[180px]")}>
						{themeLabel}
					</Select.Trigger>
					<!--
						Without a `Select.Group` there is nothing between the panel and the options, so
						the panel's own `py-2` — `dropdown-padding-y` — is the only vertical padding in
						play. That is exactly how the boxed menu is built.
					-->
					<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
						{#each themes as t (t.value)}
							<Select.Item class={item} value={t.value} label={t.label}>{t.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Scrollable">
		{#snippet blurb()}
			Capping the panel's height turns it into a scrolling list. The five groups below each get
			their own heading.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Select.Root type="single" bind:value={timezone}>
					<Select.Trigger class={cn(trigger, triggerOpen, "w-[280px]")}>
						{timezoneLabel}
					</Select.Trigger>
					<!--
						This is the one panel that does NOT take `menuAnchored`. Several of these labels
						are wider than the 280px trigger, and the full-width menu rule
						would clip them against the panel's `overflow-x: hidden`. The classic theme has the same
						escape hatch for the same reason — the small-select menu rule
						is `min-width: 100%; width: auto` — so the panel is content-sized here and the
						viewport's own `min-w-(--bits-select-anchor-width)` supplies the `min-width: 100%`
						half.

						`max-h-[300px]` is the docs example's cap. the boxed widget caps its own list at
						`max-height: 300px` with `overflow: auto`, so the number happens to agree; what
						differs is that the overflow buttons at the top and bottom of the panel are
						shadcn's, where the boxed widget leaves a native scrollbar.
					-->
					<Select.Content sideOffset={-1} class={cn(menu, "max-h-[300px]")}>
						{#each timezones as group (group.region)}
							<Select.Group class={optionGroup}>
								<Select.Label class={headingRow}>
									<Badge class={headingBadge}>{group.region}</Badge>
								</Select.Label>
								{#each group.zones as zone (zone.value)}
									<Select.Item class={item} value={zone.value} label={zone.label}>
										{zone.label}
									</Select.Item>
								{/each}
							</Select.Group>
						{/each}
					</Select.Content>
				</Select.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select with icons and placeholder state">
		{#snippet blurb()}
			Each option carries an icon, and the trigger repeats the selected option's icon beside its
			label; until a selection is made it shows only the placeholder text.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 2. The icons take no sizing classes of their own — trigger and
					item both already size any inline svg to `size-4`
					(`[&_svg:not([class*='size-'])]:size-4` in select-trigger.svelte and
					select-item.svelte).
				-->
				<Select.Root type="single" bind:value={iconOption}>
					<Select.Trigger class={cn(trigger, triggerOpen, "w-[200px]")}>
						{#if iconOptionSelected}
							<span class="flex items-center gap-2">
								<iconOptionSelected.icon class="text-muted-foreground" />
								{iconOptionSelected.label}
							</span>
						{:else}
							Select an option
						{/if}
					</Select.Trigger>
					<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
						<Select.Group class={optionGroup}>
							{#each iconOptions as option (option.value)}
								<Select.Item class={item} value={option.value} label={option.label}>
									<option.icon class="text-muted-foreground" />
									{option.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select component with grouped options and labels">
		<Card.Root>
			<Card.Content>
				<!--
					Demo 3. The two group headings take this page's badge treatment —
					the `headingBadge` decision above — rather than a plain `SelectLabel`, and
					the `Select.Separator` between the groups stays.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={groupedProduce}>
						<Select.Trigger class={cn(trigger, triggerOpen, "w-full")}>
							{groupedProduceLabel}
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							<Select.Group class={optionGroup}>
								<Select.Label class={headingRow}>
									<Badge class={headingBadge}>Fruits</Badge>
								</Select.Label>
								{#each groupedFruits as f (f.value)}
									<Select.Item class={item} value={f.value} label={f.label}>
										{f.label}
									</Select.Item>
								{/each}
							</Select.Group>
							<Select.Separator />
							<Select.Group class={optionGroup}>
								<Select.Label class={headingRow}>
									<Badge class={headingBadge}>Vegetables</Badge>
								</Select.Label>
								{#each groupedVegetables as v (v.value)}
									<Select.Item class={item} value={v.value} label={v.label}>
										{v.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select component with small trigger size">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">size="sm"</code> is the h-8 step of the house control ramp.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 5. The app.css trigger rule only re-heights the default
					size, so `size="sm"` keeps the ramp's 32px untouched.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={smallFruit}>
						<Select.Trigger size="sm" class={cn(trigger, triggerOpen, "w-full")}>
							{smallFruitLabel}
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							{#each shortFruits as f (f.value)}
								<Select.Item class={item} value={f.value} label={f.label}>{f.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select component with a subscription plan style">
		{#snippet blurb()}
			Two-line options built from the Item parts, with the trigger growing to fit the selected
			plan's name and description.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 6. Upstream forces the trigger open with `h-auto!`, and so
					does this theme: `src/app.css` pins a default-size trigger to
					`--control-h-default` from outside any layer, and a departure from an unlayered
					rule states itself with `!` — the same precedent as the command rows' `h-8!`.
					The trigger's two lines are rendered directly where upstream's `SelectValue`
					clones the selected item.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={plan}>
						<Select.Trigger class={cn(trigger, triggerOpen, "h-auto! w-full py-2")}>
							<span class="flex flex-col items-start text-left">
								<span class="font-medium">{planSelected.name}</span>
								<span class="text-xs text-muted-foreground">{planSelected.description}</span>
							</span>
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							<Select.Group class={optionGroup}>
								{#each planOptions as p (p.name)}
									<Select.Item class={item} value={p.name} label={p.name}>
										<Item.Root size="xs" class="w-full p-0">
											<Item.Content class="gap-0">
												<Item.Title>{p.name}</Item.Title>
												<Item.Description class="text-xs">{p.description}</Item.Description>
											</Item.Content>
										</Item.Root>
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select component within a Field with label and description">
		<Card.Root>
			<Card.Content>
				<!--
					Demo 8 — the Field wiring: label above, hint below. `fieldLabel`
					is the `.form-label` weight correction declared beside the other recipes.
				-->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel class={fieldLabel} for="select-fruit">Favorite Fruit</Field.FieldLabel>
					<Select.Root type="single" bind:value={favoriteFruit}>
						<Select.Trigger id="select-fruit" class={cn(trigger, triggerOpen, "w-full")}>
							{favoriteFruitLabel}
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							{#each fruits as f (f.value)}
								<Select.Item class={item} value={f.value} label={f.label}>{f.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<Field.FieldDescription>Choose your favorite fruit from the list.</Field.FieldDescription>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select component in an invalid state">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">aria-invalid</code> on the trigger paints the destructive
			border and ring; the Field relays the error message below.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 9. Two attributes because label and control colour through
					different selectors: `data-invalid` on the Field turns the label destructive,
					`aria-invalid` on the trigger takes the destructive border. The `trigger` recipe
					only zeroes the focus ring, so the aria-invalid ring survives it.
				-->
				<Field.Field class="max-w-xs" data-invalid="true">
					<Field.FieldLabel class={fieldLabel} for="select-fruit-invalid">
						Favorite Fruit
					</Field.FieldLabel>
					<Select.Root type="single" bind:value={invalidFruit}>
						<Select.Trigger
							id="select-fruit-invalid"
							aria-invalid="true"
							class={cn(trigger, triggerOpen, "w-full")}
						>
							{invalidFruitLabel}
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							{#each shortFruits as f (f.value)}
								<Select.Item class={item} value={f.value} label={f.label}>{f.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<Field.FieldError errors={[{ message: "Please select a valid fruit." }]} />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select component in a disabled state">
		<Card.Root>
			<Card.Content>
				<!--
					Demo 10. `disabled` sits on the root and reaches the trigger
					through bits-ui. No value is bound — a disabled control cannot acquire one, so
					the trigger permanently shows its placeholder. The Grapes item keeps its own
					`disabled`, invisible here but faithful to the source data.
				-->
				<Field.Field class="max-w-xs" data-disabled="true">
					<Select.Root type="single" disabled>
						<Select.Trigger class={cn(trigger, triggerOpen, "w-full")}>
							Select a fruit
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							{#each fruits as f (f.value)}
								<Select.Item
									class={item}
									value={f.value}
									label={f.label}
									disabled={f.value === "grapes"}
								>
									{f.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select component inside a Dialog">
		{#snippet blurb()}
			The panel portals above the dialog overlay — nothing extra to wire.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 11. The trigger-as-Button `child` snippet is the Dialog
					page's own pattern: one element wearing both the button chrome and the trigger's
					aria wiring.
				-->
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button {...props}>Open Dialog</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Select Example</Dialog.Title>
							<Dialog.Description>Use the select below to choose a fruit.</Dialog.Description>
						</Dialog.Header>
						<Select.Root type="single" bind:value={dialogFruit}>
							<Select.Trigger class={cn(trigger, triggerOpen, "w-full")}>
								{dialogFruitLabel}
							</Select.Trigger>
							<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
								{#each fruits as f (f.value)}
									<Select.Item class={item} value={f.value} label={f.label}>{f.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select component inline with Input">
		<Card.Root>
			<Card.Content>
				<!--
					Demo 13 — a search box with a status filter at its side. The
					input needs no classes of its own: `.form-control` lives in `app.css` on
					`[data-slot='input']` (the Input page records why), and resolves to the same
					40px as the `trigger` recipe.
				-->
				<div class="flex w-full max-w-xs items-center gap-2">
					<Input placeholder="Search..." class="flex-1" />
					<Select.Root type="single" bind:value={inlineFilter}>
						<Select.Trigger class={cn(trigger, triggerOpen, "w-[140px]")}>
							{inlineFilterLabel}
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							{#each inlineFilters as f (f.value)}
								<Select.Item class={item} value={f.value} label={f.label}>{f.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select component with Button side by side">
		<Card.Root>
			<Card.Content>
				<!--
					Demo 14. The button takes `fieldButton` — the Input page's
					Subscribe sizing — so it stands level with the 40px trigger beside it.
				-->
				<div class="flex w-full max-w-xs items-center gap-2">
					<Select.Root type="single" bind:value={submitFruit}>
						<Select.Trigger class={cn(trigger, triggerOpen, "grow")}>
							{submitFruitLabel}
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							{#each shortFruits as f (f.value)}
								<Select.Item class={item} value={f.value} label={f.label}>{f.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<Button class={fieldButton}>Submit</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select with custom access level descriptions">
		{#snippet blurb()}
			Each option pairs its label with a one-line permission summary; the trigger repeats the label
			alone.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 16. Upstream hides the description in the trigger with
					`[&_small]:hidden` because its `SelectValue` clones the whole item; a bits-ui
					trigger renders what it is given, so it simply renders the label and the hack
					disappears. `[&_svg]:text-primary` on the items is upstream's — it colours the
					selected-item check mark.
				-->
				<Select.Root type="single" bind:value={accessLevel}>
					<Select.Trigger class={cn(trigger, triggerOpen, "w-[240px]")}>
						{accessLevelSelected.label}
					</Select.Trigger>
					<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
						<Select.Group class={optionGroup}>
							{#each accessLevels as level (level.value)}
								<Select.Item
									class={cn(item, "[&_svg]:text-primary")}
									value={level.value}
									label={level.label}
								>
									<span class="flex flex-col items-start gap-px">
										<span class="font-medium">{level.label}</span>
										<small class="text-xs text-muted-foreground">{level.description}</small>
									</span>
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select with colored bullets for status">
		{#snippet blurb()}
			A status dot in front of each label, carried into the trigger with the selection.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 17, dots re-coloured to tokens — the data comment in the
					script block records the mapping.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={bulletStatus}>
						<Select.Trigger class={cn(trigger, triggerOpen, "w-full")}>
							<span class="flex items-center gap-2">
								<span class={cn("size-1.5 rounded-full", bulletStatusSelected.color)}></span>
								<span>{bulletStatusSelected.label}</span>
							</span>
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							<Select.Group class={optionGroup}>
								{#each bulletStatuses as status (status.value)}
									<Select.Item class={item} value={status.value} label={status.label}>
										<span class="flex items-center gap-2">
											<span class={cn("size-1.5 rounded-full", status.color)}></span>
											<span>{status.label}</span>
										</span>
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select with user avatars">
		{#snippet blurb()}
			An assignee picker: every option is an avatar and a name, and the trigger shows the current
			pick the same way.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 18. The avatars render their initials fallbacks — no
					photographs, per the script-block note — and the "Select a user" group label
					takes this page's badge heading like every other group on the page.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={assignee}>
						<Select.Trigger class={cn(trigger, triggerOpen, "w-full")}>
							<span class="flex items-center gap-2">
								<Avatar.Root class="size-6">
									<Avatar.Fallback class="text-xs">{assigneeSelected.initials}</Avatar.Fallback>
								</Avatar.Root>
								<span>{assigneeSelected.name}</span>
							</span>
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							<Select.Group class={optionGroup}>
								<Select.Label class={headingRow}>
									<Badge class={headingBadge}>Select a user</Badge>
								</Select.Label>
								{#each assignees as user (user.value)}
									<Select.Item class={item} value={user.value} label={user.name}>
										<span class="flex items-center gap-2">
											<Avatar.Root class="size-6">
												<Avatar.Fallback class="text-xs">{user.initials}</Avatar.Fallback>
											</Avatar.Root>
											<span>{user.name}</span>
										</span>
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select with status badges">
		{#snippet blurb()}
			Every option is a soft status badge, and the trigger repeats the current one after a static
			prefix.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 19. Upstream draws the options with its `{state}-outline`
					badges; the script-block note records the `{state}-subtle` translation. The
					`w-[200px]` on the trigger is upstream's own.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={badgeStatus}>
						<Select.Trigger class={cn(trigger, triggerOpen, "w-[200px]")}>
							<span class="flex items-center gap-2">
								Status:
								<Badge variant={badgeStatusSelected.variant}>{badgeStatusSelected.label}</Badge>
							</span>
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							{#each badgeStatuses as status (status.value)}
								<Select.Item class={item} value={status.value} label={status.label}>
									<Badge variant={status.variant}>{status.label}</Badge>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select with indicator on the left side">
		{#snippet blurb()}
			The selected-item check mark moves from the right edge to the left, and the option text
			indents to leave it room.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 20. Upstream forces the move with `right-auto!` / `left-2!`
					on the indicator span; the house select-item positions that span with the
					logical `end-2`, so the override is logical too — and needs no `!`, because the
					`[&>span:first-child]` descendant selector out-specifies the span's own single
					utility class. The insets swap with it: `pl-8` reserves the check's room on the
					left where the `item` recipe's `pr-8` reserved it on the right.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={leftIndicatorOption}>
						<Select.Trigger class={cn(trigger, triggerOpen, "w-full")}>
							{leftIndicatorLabel}
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							<Select.Group class={optionGroup}>
								{#each leftIndicatorOptions as option (option.value)}
									<Select.Item
										class={cn(
											item,
											"pr-3 pl-8 [&>span:first-child]:start-2 [&>span:first-child]:end-auto",
										)}
										value={option.value}
										label={option.label}
									>
										{option.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select with clear button">
		{#snippet blurb()}
			Once a value is picked, the trigger's chevron gives way to an inline clear affordance that
			empties the selection without opening the panel.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 21. Two translations beyond the usual: upstream remounts the
					whole Select with `key={value || "__empty__"}` to reset Radix's internal state
					after clearing — bits-ui follows its controlled `value`, so writing "" is the
					whole reset — and the clear affordance is a span inside the trigger (a button
					cannot nest in a button), swallowing pointerdown so bits-ui never sees the press
					as an open gesture. `[&>svg:last-child]:hidden` hides the trigger's built-in
					chevron only while the clear affordance is shown, exactly upstream's toggle.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={clearFramework}>
						<Select.Trigger
							class={cn(
								trigger,
								triggerOpen,
								"w-full",
								clearFramework !== "" && "[&>svg:last-child]:hidden",
							)}
						>
							{clearFrameworkLabel}
							{#if clearFramework !== ""}
								<span
									role="button"
									tabindex={-1}
									class="flex size-4 items-center justify-center rounded-sm text-muted-foreground opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:outline-none"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										clearFramework = "";
									}}
									onpointerdown={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
									onkeydown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											clearFramework = "";
										}
									}}
								>
									<XIcon />
									<span class="sr-only">Clear selection</span>
								</span>
							{/if}
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							{#each clearFrameworks as framework (framework.value)}
								<Select.Item class={item} value={framework.value} label={framework.label}>
									{framework.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Select with custom chevrons up down icon">
		{#snippet blurb()}
			The single down chevron becomes a chevrons-up-down glyph while the select is empty, and the
			clear affordance takes its place once a fruit is picked.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 22 — the previous demo's clear button plus a replacement
					resting icon. `[&>svg:last-child]:hidden` is unconditional here because the
					built-in chevron never shows; the custom ChevronsUpDownIcon is a direct svg
					child too, but never the LAST one — the hidden built-in chevron always follows
					it — so the selector reaches exactly the right icon in both states.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={chevronFruit}>
						<Select.Trigger
							class={cn(trigger, triggerOpen, "w-[200px]", "[&>svg:last-child]:hidden")}
						>
							{chevronFruitLabel}
							{#if chevronFruit !== ""}
								<span
									role="button"
									tabindex={-1}
									class="flex size-4 items-center justify-center rounded-sm text-muted-foreground opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:outline-none"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										chevronFruit = "";
									}}
									onpointerdown={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
									onkeydown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											chevronFruit = "";
										}
									}}
								>
									<XIcon />
									<span class="sr-only">Clear selection</span>
								</span>
							{:else}
								<ChevronsUpDownIcon class="text-muted-foreground" />
							{/if}
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							<Select.Group class={optionGroup}>
								{#each chevronFruits as f (f.value)}
									<Select.Item class={item} value={f.value} label={f.label}>{f.label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Country picker select with flag emojis">
		<Card.Root>
			<Card.Content>
				<!--
					Demo 25. The flag column costs nothing: the script-block note
					records why these emoji survive the no-images rule that stripped the Filters
					page's flagcdn set.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={country}>
						<Select.Trigger class={cn(trigger, triggerOpen, "w-full")}>
							<span class="flex items-center gap-2">
								<span>{countrySelected.flag}</span>
								<span>{countrySelected.label}</span>
							</span>
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							<Select.Group class={optionGroup}>
								{#each countries as c (c.value)}
									<Select.Item class={item} value={c.value} label={c.label}>
										<span class="flex items-center gap-2">
											<span>{c.flag}</span>
											<span>{c.label}</span>
										</span>
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Timezone select with UTC offsets">
		{#snippet blurb()}
			Each zone pairs its abbreviation with a right-aligned UTC offset; the trigger joins the two
			into one line.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 28. The `w-full` on the inner span matters: the house
					select-item wraps its children in a `flex-1` span, so full width is what lets
					`justify-between` push the offset to the item's right edge. The three region
					headings take this page's badge treatment like every other group on the page.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={utcZone}>
						<Select.Trigger class={cn(trigger, triggerOpen, "w-full")}>
							{utcZoneLabel}
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							{#each utcRegions as region, i (region.region)}
								{#if i > 0}
									<Select.Separator />
								{/if}
								<Select.Group class={optionGroup}>
									<Select.Label class={headingRow}>
										<Badge class={headingBadge}>{region.region}</Badge>
									</Select.Label>
									{#each region.zones as zone (zone.value)}
										<Select.Item
											class={item}
											value={zone.value}
											label={`${zone.label} (${zone.offset})`}
										>
											<span class="flex w-full items-center justify-between gap-3">
												<span>{zone.label}</span>
												<span class="text-xs text-muted-foreground">{zone.offset}</span>
											</span>
										</Select.Item>
									{/each}
								</Select.Group>
							{/each}
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Font family select with preview">
		{#snippet blurb()}
			Each option renders in the typeface it names, and the trigger previews the current pick the
			same way.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 31. The `font-sans` / `font-mono` / `font-serif` classes are
					the preview — each resolves to whatever stack the theme's own tokens define, so
					the demo needs no font data of its own.
				-->
				<Field.Field class="max-w-xs">
					<Select.Root type="single" bind:value={fontOption}>
						<Select.Trigger class={cn(trigger, triggerOpen, "w-[200px]")}>
							<span class={fontOptionSelected.class}>{fontOptionSelected.label}</span>
						</Select.Trigger>
						<Select.Content sideOffset={-1} class={cn(menu, menuAnchored)}>
							<Select.Group class={optionGroup}>
								{#each fontOptions as font (font.value)}
									<Select.Item class={item} value={font.value} label={font.label}>
										<span class={font.class}>{font.label}</span>
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
