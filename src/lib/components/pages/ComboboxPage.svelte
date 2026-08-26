<script lang="ts">
	import {
		DateFormatter,
		endOfMonth,
		endOfWeek,
		getLocalTimeZone,
		isSameDay,
		today,
		type DateValue,
	} from "@internationalized/date";
	import { toast } from "svelte-sonner";

	import type { LucideIcon } from "@lucide/svelte";

	import BriefcaseBusinessIcon from "@lucide/svelte/icons/briefcase-business";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import CalendarSearchIcon from "@lucide/svelte/icons/calendar-search";
	import CheckIcon from "@lucide/svelte/icons/circle-check";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import CircleDotIcon from "@lucide/svelte/icons/circle-dot";
	import CircleIcon from "@lucide/svelte/icons/circle";
	import CirclePauseIcon from "@lucide/svelte/icons/circle-pause";
	import CircleXIcon from "@lucide/svelte/icons/circle-x";
	import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
	import FactoryIcon from "@lucide/svelte/icons/factory";
	import FilmIcon from "@lucide/svelte/icons/film";
	import GitBranchIcon from "@lucide/svelte/icons/git-branch";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import HospitalIcon from "@lucide/svelte/icons/hospital";
	import HotelIcon from "@lucide/svelte/icons/hotel";
	import LayersIcon from "@lucide/svelte/icons/layers";
	import MonitorIcon from "@lucide/svelte/icons/monitor";
	import PackageIcon from "@lucide/svelte/icons/package";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import ScaleIcon from "@lucide/svelte/icons/scale";
	import SchoolIcon from "@lucide/svelte/icons/school";
	import SendIcon from "@lucide/svelte/icons/send";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import TagIcon from "@lucide/svelte/icons/tag";
	import TractorIcon from "@lucide/svelte/icons/tractor";
	import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
	import UserIcon from "@lucide/svelte/icons/user";
	import UsersIcon from "@lucide/svelte/icons/users";
	import XIcon from "@lucide/svelte/icons/x";
	import ZapIcon from "@lucide/svelte/icons/zap";

	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Combobox from "$lib/components/ui/combobox/index.js";
	import * as Command from "$lib/components/ui/command/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as Item from "$lib/components/ui/item/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Badge, badgeVariants } from "$lib/components/ui/badge/index.js";
	import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
	import { Calendar } from "$lib/components/ui/calendar/index.js";
	import { InputGroupAddon, InputGroupButton } from "$lib/components/ui/input-group/index.js";
	import { getInitials } from "$lib/shared/get-initials.js";
	import { cn } from "$lib/utils.js";
	import { keepPageScroll } from "./combobox-keep-scroll.svelte.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Combobox page: FOURTEEN variants, in a fixed order and under the
	 * titles the demos carry — the twelve of the main grid, then the two filed separately
	 * as "Animated combobox".
	 *
	 * WHY THERE WAS NO PAGE UNTIL NOW. A combobox is a recipe here, not a component: shadcn-svelte
	 * builds one out of `Command` inside `Popover` and ships no `ui/combobox` to port. Nothing of
	 * it reached this repository along the way, either — the Command page next door records why it
	 * took nothing from the "Combobox" section it met first: that section is a cross-reference
	 * carrying no example of its own. the gallery is the source that writes the recipe out,
	 * fourteen times.
	 *
	 * THE CLASSIC THEME'S COMBOBOX IS A BOXED SELECT WIDGET, and the Select page has already ported it: every example
	 * in the combobox section of the reference docs is a
	 * `<select class="form-select" data-widget>`, and the widget's own dropdown carries a search
	 * field — which is the only thing separating that object from this one. So this page skins
	 * nothing from scratch. It takes the Command page's derivation of `.dropdown-menu` for the
	 * menu, the Select page's derivation of `.form-select` for the trigger, and applies on top
	 * the three things the vendor skin changes about a classic dropdown, as the Select
	 * page's own header enumerates them:
	 *
	 *   1  the menu takes the width of the control          → {@link menu}
	 *   2  `.dropdown-item` is re-inset to `input-padding-x` → {@link option}
	 *   3  `.is-highlighted` takes `--bs-dropdown-link-hover-color` → {@link option}
	 *
	 * plus the fourth thing that page derives separately and that is the most recognisable part
	 * of a classic select: an open control and its menu read as ONE box, joined at a squared
	 * seam ({@link trigger}, {@link menu}, and the `sideOffset` every section passes).
	 *
	 * The recipe is also already in the repository twice, as `PhoneInput.CountrySelect` and the
	 * Cards page's role picker. Everything either of them settled — the `child` trigger,
	 * `data-checked`, a `p-0` panel, emoji flags — is used here without re-arguing it.
	 *
	 * SIX TRANSLATIONS APPLY THROUGHOUT and are not repeated per section:
	 *
	 *   the trigger   React's `<PopoverTrigger asChild>` is bits-ui's `child` snippet. The props
	 *                 it hands down already carry `aria-expanded`, `aria-controls`,
	 *                 `aria-haspopup` and `data-state`, so every source's hand-written
	 *                 `aria-expanded={open}` is dropped as duplicated state. `role='combobox'`
	 *                 is kept — that one says something the primitive does not.
	 *   `onSelect`    cmdk hands the callback the item's value; bits-ui hands it NOTHING
	 *                 (`this.opts.onSelect?.current()`, `command.svelte.js`). Every
	 *                 `onSelect={current => …}` therefore closes over its own item instead. This
	 *                 is the one translation that fails silently if it is done by eye: the
	 *                 parameter simply arrives `undefined`.
	 *   the tick      `command-item.svelte` renders its own `CheckIcon`, hidden until the item
	 *                 carries `data-checked='true'`. So the sources' hand-placed
	 *                 `<CheckIcon className='ml-auto' />` is not translated, it is deleted:
	 *                 passing `data-checked` lights the one the component already ships, and a
	 *                 second would sit beside an invisible first. `PhoneInput` settled this
	 *                 spelling. #5 is the exception and says why at its section.
	 *   the width     `var(--radix-popper-anchor-width)` is `var(--bits-popover-anchor-width)`
	 *                 here — bits-ui derives the name as `--bits-{name}-anchor-width` in
	 *                 `internal/floating-svelte/floating-utils.svelte.js`, and `popover-content`
	 *                 passes `'popover'`. The sources spell their widths four different ways —
	 *                 four demos leave the panel at its own 288px, one pins 300px, and the nine
	 *                 that do reach for the anchor width split between `w-` and a `min-w-`. All
	 *                 fourteen are pinned to the control here, that being the widget rule rather
	 *                 than a per-demo choice.
	 *   the search    A `Command.Item` is scored on its `value` plus its `keywords`, folded into
	 *                 one string — NEVER on what it renders (`command.svelte.js`, `#filterItems`,
	 *                 and `computeCommandScore`, which concatenates the two before matching). So
	 *                 wherever a source passes a `value` that is not the visible label, the list
	 *                 cannot be searched by what it shows, and a row that scores zero does not
	 *                 dim — it UNMOUNTS. Measured against the shipped scorer: `'harvard'` scores
	 *                 0 for "university", `'vue'` scores 0 for both "vuejs" and "js". Every such
	 *                 item here carries `keywords={[label]}`, which is the spelling the data
	 *                 table's faceted filter already uses; #2, #3 and #9 need none, their value
	 *                 being the label. It is the fifth upstream defect declined, and the one
	 *                 that shows: #6's own placeholder reads "Find university".
	 *   the label     Each source wraps its demo in a `<Label>` whose text is the demo's name.
	 *                 `DocSection` already renders that name as the section's `h2`, so a
	 *                 `<label>` immediately below would say it a second time. It becomes an
	 *                 `aria-label` on the trigger instead — which is what #1, the one demo with
	 *                 no visible label, already does.
	 *
	 * FOUR DIVERGENCES, all of them the theme rather than the translation:
	 *
	 *   chips stay pills   #10, #11 and #12 ask for `rounded-sm` on their badges, and the pill
	 *                      they get instead is NOT the classic value. §7 records the whole of it:
	 *                      a classic badge is a 6px rectangle — only 13 of the 170 in the reference demo pages
	 *                      carry `.rounded-pill` — and the Badge component's hardcoded
	 *                      `rounded-4xl` is an ACCEPTED DIVERGENCE, kept because the only lever is
	 *                      the shared `--radius-4xl` token and remapping it would leave the radius
	 *                      scale non-monotonic. So the source's 4px is one wrong value offered in
	 *                      place of another, and the chips are left at the shape every other Badge
	 *                      in this app carries.
	 *   no raw blue        #5's custom tick is `fill-blue-500 stroke-white`. `primary` IS that
	 *                      blue (#2C7BE5) and `btn-text-color` is that white, so the pair
	 *                      becomes `fill-primary stroke-primary-foreground` and follows the
	 *                      palette picker like everything else.
	 *   the panel's edge   Five sources put `border-input` on the popover. That is the FORM
	 *                      CONTROL colour, and §4.2 exists because this theme keeps it distinct
	 *                      from the panel one: a menu's edge is `dropdown-border-color`, which
	 *                      is what the popover's ring already draws. Dropped, not remapped.
	 *   no images          #8's avatars and #9's flags would load remotely. This
	 *                      repository ships no images and fetches none (§16), so they become
	 *                      initials and emoji — the substitutions `dashboard.ts` and
	 *                      `PhoneInput` respectively already make.
	 *
	 * FOUR MORE UPSTREAM DEFECTS ARE DECLINED rather than reproduced, beside the search key
	 * above, and each is also noted at its section:
	 *
	 *   #4 marks the selected industry nowhere in the list, so reopening the menu does not say
	 *      what is in the trigger. It gets the tick its thirteen siblings have.
	 *   #9 compares `value === country.value` to decide its tick while every other line in that
	 *      demo stores `country.label`, so the tick can never appear. Compared like for like.
	 *   #10 seeds its selection with `'london'`, a leftover from some earlier city demo that is
	 *      not in its own framework list: it renders as nothing and still occupies a slot.
	 *   #7 sorts the timezone list on `parseInt('+5:30')`, which reads 5 and drops the half
	 *      hour. The minutes are parsed here, so Kolkata sorts after Karachi rather than beside
	 *      it.
	 *
	 * ONE CONSEQUENCE WORTH STATING PLAINLY. The classic theme's `--bs-dropdown-link-hover-bg` is
	 * transparent, so a menu row here signals itself by darkening its type and never by filling
	 * — the finding the Dropdowns, Command and Select pages each record. In a command list that
	 * attribute is also the KEYBOARD cursor, so on this page the arrow keys move a colour change
	 * and nothing else. It is the classic theme's convention applied literally, it is what the three pages
	 * above already do, and it is at its weakest in #7, where four hundred rows are driven by
	 * the keyboard alone.
	 */

	/**
	 * The trigger — `.form-select`, whose compiled rule the Select page quotes in full:
	 *
	 *   padding: .5rem 1.75rem .5rem .75rem; line-height: 1.5; font-size: .9375rem;
	 *   border: 1px solid var(--bs-gray-400); border-radius: var(--bs-border-radius);
	 *   background-color: #fff; color: var(--bs-body-color)
	 *
	 * Everything below is that page's derivation, re-aimed from `Select.Trigger` at a `Button`.
	 * Three values still need nothing: `rounded-md` is `border-radius`, `border-input` is
	 * `input-border-color`, and `text-sm` is `font-size-base` (0.9375rem here).
	 *
	 *   h-10          .5rem + .5rem + 1.5 × 15px + 2 × 1px = 40.5px, the arithmetic the Buttons
	 *                 page ran for `btn-padding-y`. A BARE `h-10`, where the Select page needs
	 *                 `data-[size=default]:h-10` — that component writes its height behind an
	 *                 attribute selector, `Button` writes a plain `h-(--control-h-default)`, and `cn` evicts it
	 *   px-3          `input-padding-x: .75rem`. The classic 1.75rem on the right is room for a
	 *                 background-image caret; with the caret a real flex child, .75rem on both
	 *                 sides puts it in the same place
	 *   font-normal   `font-weight-base`. shadcn's Button asks for 500, which no classic form
	 *                 control does
	 *   bg-card       `input-bg: white`, which `--card` holds. The dark half is
	 *                 `input-bg-dark: gray-700-dark` (#1E3A5C) — that is `--secondary`, NOT
	 *                 `--card` (#152E4D), so the two modes genuinely need different tokens
	 *   hover, open   `.form-select` has no hover rule at all and does not change colour because
	 *                 its menu is open. The `outline` variant has `hover:bg-muted`,
	 *                 `dark:hover:bg-input/50` AND `aria-expanded:bg-muted`; all three are
	 *                 pinned back to the resting fill
	 *   shadow-none   no `box-shadow` in the compiled bundle, `enable-shadows: false`
	 *   ring-0        `.form-select:focus` is `border-color: var(--bs-primary); box-shadow: none`
	 *                 — `input-btn-focus-box-shadow: none` deletes the glow theme-wide. The
	 *                 border half already matches, `--ring` being `input-focus-border-color`
	 *   rounded-b-none  the open-state rule squares the control's bottom corners so
	 *                 it and the menu read as one box. `data-state` is on the trigger because
	 *                 bits-ui puts it there (`popover.svelte.js`, `PopoverTriggerState.props`)
	 *
	 * Only the downward case is squared, because the reference stylesheet has no `.is-flipped` rule
	 * either: a menu bits-ui flips upwards leaves the control's bottom corners square. The classic theme
	 * has the same gap, and the Select page records it.
	 *
	 * `w-full max-w-xs` is the sources' own width, moved off the wrapper `<div>` they use to
	 * stack a label above the control — a wrapper this page has no label to put in.
	 */
	const trigger =
		"h-10 w-full max-w-xs justify-between rounded-md border-input bg-card px-3 font-normal shadow-none hover:bg-card focus-visible:ring-0 aria-expanded:bg-card data-[state=open]:rounded-b-none dark:bg-secondary dark:hover:bg-secondary dark:aria-expanded:bg-secondary";

	/**
	 * The menu panel.
	 *
	 *   w-…anchor-width   the vendor menu rule ties the menu to
	 *                     the control, where a plain classic dropdown is content-sized. The
	 *                     anchor width IS the trigger's width, so this is the same statement,
	 *                     and it is a WIDTH rather than a `min-width` for the reason §16's third
	 *                     mistake gives: a portaled panel's shrink-to-fit resolves against the
	 *                     viewport, not against the trigger
	 *   p-0               the popover's own `p-4` is a padded panel; a classic menu is
	 *                     `--bs-dropdown-padding-x: 0`, with the vertical half spent once by the
	 *                     list below and the horizontal by each row. `app.css` also paints the
	 *                     search row edge to edge, which any panel padding would inset
	 *   rounded-t-none    the other half of the squared seam, with `sideOffset={-1}` at each
	 *                     call site: `dropdown-spacer: 0` plus
	 *                     `margin-top: -dropdown-border-width`
	 *   dark:ring-background  `dropdown-border-color` is `rgba(black, .1)` and the classic theme's
	 *                     `black` IS `--foreground`, so the panel's own `ring-foreground/10` is
	 *                     that value exactly in light. Dark inverts it to white where
	 *                     `dropdown-border-color-dark` is solid `black`, and `--background`
	 *                     holds #12263F there
	 *
	 * The radius, ground, and flattened elevation are already right and are not restated —
	 * `app.css` zeroes `--tw-shadow` on every floating surface in the app.
	 */
	const menu =
		"w-(--bits-popover-anchor-width) p-0 data-[side=bottom]:rounded-t-none dark:ring-background";

	/**
	 * `Command.Root` inside that panel. `rounded-md!` is `dropdown-border-radius`, and the `!`
	 * is not emphasis: the component's own class is `rounded-xl!`, and only an equally important
	 * utility replaces it through `cn`. `p-0` because `--bs-dropdown-padding-x` is 0 and the
	 * vertical half belongs to the list below, spent once around the whole thing.
	 */
	const panel = "rounded-md! p-0";

	/** `dropdown-padding-y: .5rem`, taken off the root so groups do not each pay it. */
	const list = "py-2";

	/**
	 * A group. `p-0` because the classic theme has no group box at all — the menu pads itself and the item
	 * pads itself, and nothing sits in between.
	 *
	 * The heading is `.dropdown-header`: `padding: .5rem 1.5rem`, `font-size: .8125rem`, and
	 * `dropdown-header-color: inherit` — the classic theme overrides the classic `gray-600` there on
	 * purpose, so the heading is body-coloured, not muted, and inherits `font-weight-base`.
	 * Only the LEADING inset departs from the Command page's reading of the same element, and for
	 * the same reason the options do: the boxed skin re-insets this menu to the control's own padding.
	 * The trailing one is not restated and falls back to the component's own `px-2`, exactly as
	 * the options' does — a heading has nothing on its right edge for the difference to show
	 * against. The Select page answers this slot differently — it renders a secondary badge, by
	 * its own admission a decision rather than a derivation — but that is `Select.Label`, and
	 * this is the element the Command page has already mapped.
	 *
	 * Written as descendant utilities because `Command.Group`'s `class` lands on the container
	 * and the heading's classes are hard-coded inside the component; `[data-command-group-heading]`
	 * is the attribute bits-ui actually emits, and a class plus an attribute outranks the plain
	 * utilities on the element itself.
	 */
	const optionGroup =
		"p-0 **:[[data-command-group-heading]]:py-2 **:[[data-command-group-heading]]:pl-3 **:[[data-command-group-heading]]:font-normal **:[[data-command-group-heading]]:text-inherit";

	/**
	 * An option — `.dropdown-item` with the widget inset and the widget highlight:
	 *
	 *   pl-3           the vendor item-inset rule,
	 *                  so a row lines up under the control's own text rather than under the
	 *                  dropdown's usual 1.5rem. The trailing inset stays the component's `px-2`,
	 *                  which is where the tick sits
	 *   py-1.5         `--bs-dropdown-item-padding-y: .375rem`, which the component already has
	 *   resting        `gray-700`, which `--muted-foreground` holds exactly in dark and one step
	 *                  lighter in light — the near miss §16 files under "two greys with no token",
	 *                  and which the Command and Select pages both carry too
	 *
	 * THE HIGHLIGHT IS PAINTED, AND THE CLASSIC THEME SAYS IT SHOULD NOT BE. `--bs-dropdown-link-hover-bg` is
	 * TRANSPARENT, `dropdown-link-active-bg` is defined as that same value, and
	 * `.dropdown-item.is-highlighted { color: var(--bs-dropdown-link-hover-color) }` says it a
	 * second time for the keyboard case — so a faithful row would darken its type and paint
	 * nothing, which is what this page did. It is the odd surface out: every other menu in the
	 * application fills the active row, and a list where moving the arrow keys changes almost
	 * nothing reads as broken rather than as restrained. The fill is kept, for the reason the
	 * Dropdowns page's item records at length.
	 *
	 * `bg-accent` RATHER THAN THE COMPONENT'S OWN `data-selected:bg-muted`. The two tokens are the
	 * same #132A46 in dark, but in light `--muted` is `gray-200` and `--accent` is `gray-100`,
	 * one step lighter — and `--accent` is what the Dropdowns menu and the Filters menu paint with.
	 * Inheriting `bg-muted` here would put a visibly darker band in this one list in light mode.
	 *
	 * `data-selected` rather than `focus`, because a command list moves one attribute along its
	 * rows instead of moving focus.
	 *
	 * `.dropdown-item`'s `border-radius: 0` IS reproduced now. It was not, on the Command page's
	 * reasoning that with no fill there is no painted box whose corners could be rounded — the
	 * reasoning was sound and it expires the moment the fill comes back. The panel has no
	 * horizontal padding, so a `rounded-sm` band would round its corners against a square panel
	 * edge it is already touching.
	 */
	const option =
		"rounded-none pl-3 text-muted-foreground data-selected:bg-accent data-selected:text-accent-foreground";

	/**
	 * `.dropdown-divider`: `margin: dropdown-divider-margin-y 0` (0.75rem) and a 1px rule.
	 * `mx-0` cancels the component's `-mx-1`, which exists to bleed the rule past a menu that
	 * has horizontal padding; this one no longer does.
	 */
	const separator = "mx-0 my-3 bg-border";

	/**
	 * The empty trigger. `input-placeholder-color` is `gray-500` (#B1C2D9) and
	 * `--muted-foreground` is #95AAC9, one step darker — the near miss the Input, Select and
	 * Command pages all decline to paper over, there being no token for the lighter grey and a
	 * house rule against writing the hex.
	 */
	const placeholder = "text-muted-foreground";

	/**
	 * The trailing chevron. `form-select-indicator-color` is `gray-600` (#95AAC9), which
	 * `--muted-foreground` holds exactly — the sources ask for `text-muted-foreground/80`, an
	 * 80% wash of it, or for `opacity-50`, and neither is a classic value.
	 *
	 * NOT shrunk to `form-select-bg-size` (.75em), which is what `app.css` does globally to
	 * every `Select.Trigger`'s caret. That rule reaches a `[data-slot='select-trigger']` and no
	 * `Button` is one, so the choice is live here — and thirteen of these fourteen ask for a
	 * DOUBLE chevron, whose two strokes stop reading as two at 11.25px.
	 */
	const caret = "shrink-0 text-muted-foreground";

	/**
	 * The multi-select trigger, for #10 and #11 only.
	 *
	 * A CHIP WITH A REMOVE BUTTON CANNOT LIVE INSIDE A `<button>`. Upstream reaches for
	 * `<Button asChild><span>`, which renders something that looks like a button, is not
	 * focusable and cannot be pressed with a keyboard. Here the trigger becomes the element ARIA
	 * asks for instead — a `div` with `role='combobox'` and `tabindex='0'` — so the controls
	 * inside it can be real buttons. The `child` snippet already supplies the click and the
	 * Enter/Space keydown that make it operable, so nothing is lost by its not being a
	 * `<button>`; the chips stop those two keys from reaching it.
	 *
	 * One prop rides along inertly: `Popover.Trigger` defaults `type` to `"button"`, which a
	 * `div` has no use for. It is left there — `type` is not in Svelte's `div` attribute map, so
	 * writing `type={undefined}` after the spread to strip it is a type error, and a `disabled`
	 * of `false` in the same object is already dropped for free, being a boolean attribute.
	 *
	 * This is also what the classic theme does. the widget multiple select is a `.form-select`-shaped BOX of
	 * removable items (a tag list), not a control with one
	 * value in it, and its height grows with them.
	 *
	 *   h-auto min-h-10   the box grows with the chips but never below `.form-select`'s height.
	 *                     The sources say `min-h-8`, which is shadcn's control height, not this
	 *                     theme's
	 *   py-1.5            the chips are 20px in a 40px box; without this they touch the edges as
	 *                     soon as the box wraps to a second line
	 */
	const multiTrigger = "h-auto min-h-10 py-1.5";

	/** The chip's remove control: a real button, sized to sit inside a 20px pill. */
	const chipButton =
		"-me-1 grid size-4 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

	/** Swallow the two keys the trigger listens for, so a chip's own button keeps them. */
	function stopActivationKeys(event: KeyboardEvent) {
		if (event.key === "Enter" || event.key === " ") event.stopPropagation();
	}

	/** Add or remove one value. Shared by #10, #11 and #12, which all toggle the same way. */
	function toggle(values: string[], value: string): string[] {
		return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
	}

	/* ---------------------------------------------------------------- #1, #5, #13, #14 */

	const frameworks = [
		{ value: "next.js", label: "Next.js" },
		{ value: "sveltekit", label: "SvelteKit" },
		{ value: "nuxt.js", label: "Nuxt.js" },
		{ value: "remix", label: "Remix" },
		{ value: "astro", label: "Astro" },
	];

	let basicOpen = $state(false);
	let basicValue = $state("");

	let tickOpen = $state(false);
	let tickValue = $state("");

	let slideOpen = $state(false);
	let slideValue = $state("");

	let zoomOpen = $state(false);
	let zoomValue = $state("");

	/* ------------------------------------------------------------------------ #2 and #3 */

	/**
	 * #2 and #3 share a list; #3 disables one entry in two of its three groups. The source keeps
	 * two copies of it and names the grouping key `continent` in the first, a leftover from some
	 * country demo — one array serves both here, and the key says what it holds.
	 */
	const pantry: { category: string; items: { value: string; disabled?: boolean }[] }[] = [
		{
			category: "Fruits",
			items: [{ value: "Apples" }, { value: "Bananas" }, { value: "Cherries" }],
		},
		{
			category: "Vegetables",
			items: [{ value: "Carrots" }, { value: "Broccoli", disabled: true }, { value: "Spinach" }],
		},
		{
			category: "Beverages",
			items: [{ value: "Tea" }, { value: "Coffee", disabled: true }, { value: "Juice" }],
		},
	];

	let groupOpen = $state(false);
	let groupValue = $state("");

	let disabledOpen = $state(false);
	let disabledValue = $state("");

	/* ------------------------------------------------------------------------------- #4 */

	const industries: { value: string; label: string; icon: LucideIcon }[] = [
		{ value: "information technology", label: "Information Technology", icon: MonitorIcon },
		{ value: "healthcare", label: "Healthcare", icon: HospitalIcon },
		{ value: "finance", label: "Finance", icon: DollarSignIcon },
		{ value: "education", label: "Education", icon: SchoolIcon },
		{ value: "entertainment", label: "Entertainment", icon: FilmIcon },
		{ value: "manufacturing", label: "Manufacturing", icon: FactoryIcon },
		{ value: "energy", label: "Energy", icon: ZapIcon },
		{ value: "hospitality", label: "Hospitality", icon: HotelIcon },
		{ value: "legal", label: "Legal", icon: ScaleIcon },
		{ value: "agriculture", label: "Agriculture", icon: TractorIcon },
	];

	let industryOpen = $state(false);
	let industryValue = $state("");

	const selectedIndustry = $derived(industries.find((entry) => entry.value === industryValue));

	/* ------------------------------------------------------------------------------- #6 */

	const universities = [
		{ value: "harvard", label: "Harvard University" },
		{ value: "cambridge", label: "University of Cambridge" },
		{ value: "stanford", label: "Stanford University" },
		{ value: "texas", label: "University of Texas" },
	];

	let universityOpen = $state(false);
	let universityValue = $state("harvard");

	/* ------------------------------------------------------------------------------- #7 */

	/**
	 * Every timezone the runtime knows, labelled with its current UTC offset.
	 *
	 * COMPUTED ONCE, not in a `$derived`. `Intl.supportedValuesOf('timeZone')` returns some four
	 * hundred entries and each one costs a `DateTimeFormat`; the source memoises it for the same
	 * reason and nothing on this page invalidates it. `new Date()` is read once, so the whole
	 * list is offset against a single instant.
	 *
	 * THE SORT PARSES MINUTES. The source runs `parseInt` over `'+5:30'`, which yields 5 — every
	 * half-hour zone sorts as though it were on the hour, so Kolkata lands among the +05:00
	 * cities and Kathmandu with it. One regular expression reads the whole offset instead. The
	 * label is left exactly as the source formats it, `(GMT+5:30) Asia/Kolkata`, underscores
	 * spaced out.
	 */
	const timezones = (() => {
		const at = new Date();

		return Intl.supportedValuesOf("timeZone")
			.map((zone) => {
				const parts = new Intl.DateTimeFormat("en", {
					timeZone: zone,
					timeZoneName: "shortOffset",
				}).formatToParts(at);

				const offset = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
				const formatted = offset === "GMT" ? "GMT+0" : offset;
				const [, sign, hours, minutes] = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(formatted) ?? [];

				return {
					value: zone,
					label: `(${formatted}) ${zone.replace(/_/g, " ")}`,
					minutes: (sign === "-" ? -1 : 1) * (Number(hours ?? 0) * 60 + Number(minutes ?? 0)),
				};
			})
			.sort((a, b) => a.minutes - b.minutes);
	})();

	let timezoneOpen = $state(false);
	let timezoneValue = $state("Indian/Cocos");

	const selectedTimezone = $derived(timezones.find((zone) => zone.value === timezoneValue));

	/* ------------------------------------------------------------------------------- #8 */

	/**
	 * The source's eight users, minus the `avatar` URLs and minus a `status` field it carries
	 * and never renders.
	 */
	const users = [
		{ name: "Phillip George", email: "phillip12@gmail.com" },
		{ name: "Jaylon Donin", email: "jaylo-don@yahoo.com" },
		{ name: "Tiana Curtis", email: "tiana_curtis@gmail.com" },
		{ name: "Zaire Vetrovs", email: "zaire.vetrovs@outlook.com" },
		{ name: "Kianna Philips", email: "kiannaphilips@gmail.com" },
		{ name: "John Doe", email: "john2doe@icloud.com" },
		{ name: "Rock Lee", email: "rocklee@protonmail.com" },
		{ name: "Henry Potter", email: "henry3potter@gmail.com" },
	];

	let userOpen = $state(false);
	let userValue = $state("");

	const selectedUser = $derived(users.find((user) => user.name === userValue));

	/* ------------------------------------------------------------------------------- #9 */

	/**
	 * Emoji flags, which is `PhoneInput`'s answer — the source loads ten PNGs from its own CDN.
	 * The source's numeric `value` field goes with them: it selects by `label` everywhere except
	 * the one comparison that decides the tick, which is why that tick never appeared.
	 */
	const countries = [
		{ label: "India", flag: "🇮🇳" },
		{ label: "China", flag: "🇨🇳" },
		{ label: "Monaco", flag: "🇲🇨" },
		{ label: "Serbia", flag: "🇷🇸" },
		{ label: "Romania", flag: "🇷🇴" },
		{ label: "Mayotte", flag: "🇾🇹" },
		{ label: "Iraq", flag: "🇮🇶" },
		{ label: "Syria", flag: "🇸🇾" },
		{ label: "Korea", flag: "🇰🇷" },
		{ label: "Zimbabwe", flag: "🇿🇼" },
	];

	let countryOpen = $state(false);
	let countryValue = $state("");

	const selectedCountry = $derived(countries.find((entry) => entry.label === countryValue));

	/* ------------------------------------------------------------------- #10, #11 and #12 */

	const stacks = [
		{ value: "react", label: "React" },
		{ value: "nextjs", label: "Nextjs" },
		{ value: "angular", label: "Angular" },
		{ value: "vue", label: "VueJS" },
		{ value: "django", label: "Django" },
		{ value: "astro", label: "Astro" },
		{ value: "remix", label: "Remix" },
		{ value: "svelte", label: "Svelte" },
		{ value: "solidjs", label: "SolidJS" },
		{ value: "qwik", label: "Qwik" },
	];

	/** The source seeds this with `['london', 'react']`; `'london'` is not a framework. */
	let multiOpen = $state(false);
	let multiValues = $state<string[]>(["react"]);

	let expandOpen = $state(false);
	let expandValues = $state<string[]>(["react", "qwik", "solidjs", "angular", "astro"]);
	let expanded = $state(false);

	/** The source's cap, named rather than repeated as a literal in two derivations. */
	const maxShownChips = 2;

	const shownStacks = $derived(expanded ? expandValues : expandValues.slice(0, maxShownChips));
	const hiddenStacks = $derived(expandValues.length - shownStacks.length);

	let countOpen = $state(false);
	let countValues = $state<string[]>(["react", "nextjs", "angular", "vue", "django", "astro"]);

	/* =======================================================================================
	 * The primitive's examples — demo 1 … demo 18
	 * ==================================================================================== */

	/**
	 * Everything from here down is the combobox demo set,
	 * and it is built on a DIFFERENT OBJECT
	 * from the fourteen above: `$lib/components/ui/combobox/`, a real primitive hand-rolled on
	 * bits-ui's Popover, where the classic recipe assembles a `Command` inside a `Popover`
	 * again at every call site.
	 *
	 * BOTH SETS STAY, and the page is longer for it. The recipe is what shadcn-svelte documents and
	 * what four other pages here compose by hand, so removing it would leave those call sites
	 * unexplained. The primitive is what a form actually wants: one `name` that submits, a filter
	 * that runs over the caller's data instead of over mounted rows, chips a keyboard can unpick,
	 * and groups that hide their own heading when nothing under it matches. The two halves answer
	 * different questions, so the sections below are appended rather than substituted, and they
	 * touch nothing above them.
	 *
	 * SIX TRANSLATIONS APPLY THROUGHOUT and are not repeated per section:
	 *
	 *   the render prop  Base UI's `render={<Button …/>}` is this theme's `child` snippet. Upstream's
	 *                    `ComboboxTrigger` appends its own chevron after `children`; the
	 *                    `child` path renders NEITHER, the caller
	 *                    owning the element — so the two select-shaped demos place the value and the
	 *                    chevron themselves.
	 *   the item snippet React maps `items` inside `<ComboboxList>{(item) => …}`. Here the list owns
	 *                    the iteration and hands each surviving entry to a `children` snippet, for
	 *                    the reason `combobox-list.svelte` records: the root has already decided
	 *                    which entries survive, and a caller looping as well is how the two
	 *                    disagree.
	 *   the anchor       upstream's `useComboboxAnchor()` is `createComboboxAnchor()` here, and the
	 *                    four chips demos need neither: `<Combobox.Content>` already resolves its
	 *                    anchor to the chips container when one is mounted, which is exactly what
	 *                    those demos pass by hand.
	 *   the form control upstream writes `name` and `required` on `<ComboboxInput>`, Base UI's input
	 *                    being the control that submits. Here the hidden, constraint-validated input
	 *                    belongs to `<Combobox.Root>` — one `name` for a widget whose visible field
	 *                    is not what submits — so the form demo moves both props up one level.
	 *   the invalid flag `<Field data-invalid>` is `data-invalid="true"` here: `field.svelte` keys
	 *                    its destructive text on `data-[invalid=true]`, and a valueless attribute
	 *                    would not match it.
	 *   no photographs   the member list loads ten stock portraits and the country list six
	 *                    `flagcdn.com` SVGs. This repository ships no images and fetches none, so
	 *                    they become initials and emoji flags — the substitutions the sections above
	 *                    already make for the same reason.
	 */

	/** The five frameworks that thirteen of the eighteen demos share. */
	const demoFrameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];

	/**
	 * A group-shaped entry: `<Combobox.Root items>` treats it as transparent — the group survives
	 * while any of its rows matches — and `<Combobox.Group items>` unpacks it.
	 */
	type DemoTimezoneGroup = { value: string; items: string[] };

	/** demo 6 and demo 7, which share this list. */
	const demoTimezoneGroups: DemoTimezoneGroup[] = [
		{
			value: "Americas",
			items: [
				"(GMT-5) New York",
				"(GMT-8) Los Angeles",
				"(GMT-6) Chicago",
				"(GMT-5) Toronto",
				"(GMT-8) Vancouver",
				"(GMT-3) São Paulo",
			],
		},
		{
			value: "Europe",
			items: [
				"(GMT+0) London",
				"(GMT+1) Paris",
				"(GMT+1) Berlin",
				"(GMT+1) Rome",
				"(GMT+1) Madrid",
				"(GMT+1) Amsterdam",
			],
		},
		{
			value: "Asia/Pacific",
			items: [
				"(GMT+9) Tokyo",
				"(GMT+8) Shanghai",
				"(GMT+8) Singapore",
				"(GMT+4) Dubai",
				"(GMT+11) Sydney",
				"(GMT+9) Seoul",
			],
		},
	];

	/** demo 8: a hundred rows, which is the whole demo. */
	const demoLargeList = Array.from({ length: 100 }, (_, index) => `Item ${index + 1}`);

	/** demo 10. `flag` replaces the source's `flagcdn.com` URL built from `code`. */
	type DemoCountry = { code: string; flag: string; label: string };

	const demoCountries: DemoCountry[] = [
		{ code: "af", flag: "🇦🇫", label: "Afghanistan" },
		{ code: "al", flag: "🇦🇱", label: "Albania" },
		{ code: "dz", flag: "🇩🇿", label: "Algeria" },
		{ code: "as", flag: "🇦🇸", label: "American Samoa" },
		{ code: "ad", flag: "🇦🇩", label: "Andorra" },
		{ code: "ao", flag: "🇦🇴", label: "Angola" },
	];

	/**
	 * demo 16's ten members.
	 *
	 * The source spreads a `position` over the list with `index % 5` and carries an `avatar` URL and
	 * a hand-written `initials` field beside it. The positions are written out — the modulo is not a
	 * fact about the data — the URLs are gone with the photographs, and the initials come from
	 * `getInitials`, which the section above already uses. That last one also fixes a typo the
	 * source has: its sixth member is "Aron Thompson" carrying Lisa's address and `initials: 'LT'`.
	 */
	type DemoMember = { id: string; name: string; position: string };

	const demoMembers: DemoMember[] = [
		{ id: "1", name: "Alex Johnson", position: "Software Engineer" },
		{ id: "2", name: "Sarah Chen", position: "Product Manager" },
		{ id: "3", name: "Michael Rodriguez", position: "UX Designer" },
		{ id: "4", name: "Emma Wilson", position: "Technical Lead" },
		{ id: "5", name: "David Kim", position: "CTO" },
		{ id: "6", name: "Aron Thompson", position: "Software Engineer" },
		{ id: "7", name: "James Brown", position: "Product Manager" },
		{ id: "8", name: "Maria Garcia", position: "UX Designer" },
		{ id: "9", name: "Nick Johnson", position: "Technical Lead" },
		{ id: "10", name: "Liam Thompson", position: "CTO" },
	];

	/**
	 * demo 11. The selection is read back out of `FormData` rather than out of a `$state`,
	 * which is the demo's point: `<Combobox.Root name>` renders a real, constraint-validated
	 * control, so an ordinary submit already carries it and `required` already blocks an empty one.
	 */
	function onDemoFrameworkSubmit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();

		const framework = new FormData(event.currentTarget).get("framework");
		toast(`You selected ${framework} as your framework.`);
	}

	/** demo 17. */
	let demoDialogOpen = $state(false);

	/**
	 * demo 18, the one demo of the eighteen that has to be controlled: the custom trigger
	 * exists only while nothing is selected, so the page needs to know. Typed as the root's own
	 * value union rather than as `string | null` — a `bind:` needs both sides to agree, and in
	 * `multiple` mode that prop holds an array.
	 */
	let demoTriggerIconValue = $state<string | readonly string[] | null>(null);

	/* =======================================================================================
	 * The application-shaped examples — demo 19 … demo 28
	 * ==================================================================================== */

	/**
	 * The last ten demos are not variants of the control, they are the pickers a project
	 * tracker is assembled from: member tags, status, priority, lead, members, due date, labels,
	 * team, assignee. They drive the same primitive as the eighteen above and add five translations
	 * of their own, stated once here rather than at each section.
	 *
	 *   the repeated row   upstream declares a small React component per demo — `StatusLabel`,
	 *                      `LeadListRow`, `MemberSelectionRow` — and calls it from both the trigger
	 *                      and the list. Each becomes a top-level `{#snippet}` below, which is the
	 *                      spelling the Alert page already uses for a fragment two sections share,
	 *                      and the discriminated union it switches on becomes an `{#if}`.
	 *   the static list    upstream's `<ComboboxList>` also takes plain children, so a demo can put
	 *                      a standalone row, a rule and a group side by side inside it. This theme's
	 *                      list owns the iteration instead (combobox-list.svelte: the root has
	 *                      already decided which entries survive, and a caller looping as well is
	 *                      how the two disagree), so those layouts move INTO `items` — a group
	 *                      becomes a group-shaped entry, `{ kind: 'group', value, items }`, and the
	 *                      one snippet branches on the entry it is handed. The standalone rows and
	 *                      their rules then filter with everything else, where upstream strands a
	 *                      "No lead" row and a divider above an empty search.
	 *   the narrow state   each of these holds a state narrower than the list's item type: a
	 *                      `Team | null` for a list that also carries a "No team" row, an array of
	 *                      members for a list whose first row means "none". Upstream spells that
	 *                      `value` + `onValueChange`; here it is the function binding
	 *                      `bind:value={() => …, (next) => …}` that `<Combobox.Root>`'s own `value`
	 *                      documents, because a plain prop the page does not mirror back leaves the
	 *                      widget's copy ahead of the page's state — and the "Invite…" row of the
	 *                      last section is precisely a write that has to be declined.
	 *   the tones          The obvious paint for these pickers is raw palette hues: sky,
	 *                      emerald, amber, yellow, lime, violet, rose. Raw colours are not something
	 *                      this repository writes, so each maps to the status token that means the
	 *                      same thing — sky → `info`, emerald and lime → `success`, amber and yellow
	 *                      → `warning`, rose → `destructive`, violet → `primary`.
	 *   the in-popup field five of them pass `className="mb-1"` to the field inside the popup.
	 *                      `combobox-content.svelte` already spaces a field it holds
	 *                      (`*:data-[slot=input-group]:m-1`), which is why sections 10 and 16 above
	 *                      pass nothing either, so the margin is dropped rather than doubled.
	 *
	 * `IconPlaceholder`, which every one of these demos assumes, is docs tooling: it names one
	 * glyph per icon set and renders the lucide one in the published documentation. That lucide name
	 * is the icon imported here — `MoreHorizontalIcon` under its current name, `EllipsisIcon`.
	 */

	/**
	 * The two halves of every function binding below.
	 *
	 * `<Combobox.Root>` writes back `T | readonly T[] | null` — one prop covering both modes — and
	 * each section holds exactly one of those two shapes, so the narrowing is done once here instead
	 * of at eight call sites.
	 */
	function demoOneOf<T>(next: T | readonly T[] | null): T | null {
		if (next === null || next === undefined) return null;
		return (Array.isArray(next) ? (next[0] ?? null) : next) as T | null;
	}

	function demoAllOf<T>(next: T | readonly T[] | null): T[] {
		if (next === null || next === undefined) return [];
		return (Array.isArray(next) ? [...next] : [next]) as T[];
	}

	/* ------------------------------------------------------ c-combobox-19 and c-combobox-20 */

	/**
	 * Both member-tag demos run on the ten members section 16 already declares, and both are
	 * uncontrolled — `defaultValue` is the whole of their state.
	 *
	 * THE CHIPS GROW RATHER THAN SHRINKING THE AVATAR. Upstream puts a 16px avatar in the chip's
	 * 24px box; the house avatar ramp is 24 / 32 / 40 with no step below it, and `size="sm"` plus
	 * `h-auto py-0.5` gives the same reading — a round portrait with a hairline of chip around it —
	 * without writing a size this theme does not have.
	 */
	const demoTagDefault = [demoMembers[0], demoMembers[1]];
	const demoBareTagDefault = [demoMembers[5], demoMembers[9], demoMembers[3]];

	/* ------------------------------------------------------------------- demo 21 */

	type DemoStatus = { value: string; label: string; icon: LucideIcon; tone: string };

	/**
	 * `CheckIcon` in this file is `@lucide/svelte/icons/circle-check`, which is the glyph upstream
	 * asks for on the completed row — it is imported once, at the top, under the name the first half
	 * of the page gave it.
	 */
	const demoStatuses: DemoStatus[] = [
		{ value: "backlog", label: "Backlog", icon: CircleDotIcon, tone: "text-muted-foreground" },
		{ value: "planned", label: "Planned", icon: CircleIcon, tone: "text-foreground" },
		{ value: "in-progress", label: "In Progress", icon: CircleDotIcon, tone: "text-info" },
		{ value: "paused", label: "Paused", icon: CirclePauseIcon, tone: "text-warning" },
		{ value: "completed", label: "Completed", icon: CheckIcon, tone: "text-success" },
		{ value: "cancelled", label: "Cancelled", icon: CircleXIcon, tone: "text-muted-foreground" },
	];

	let demoStatus = $state<DemoStatus | null>(demoStatuses[1]);

	/* ------------------------------------------------------------------- demo 22 */

	type DemoPriority = {
		value: string;
		label: string;
		/** How many of the three bars are filled; the two ends of the scale take a glyph instead. */
		bars?: 1 | 2 | 3;
		icon?: LucideIcon;
		tone: string;
		/** Urgent is the one row whose label takes the tone as well as the glyph. */
		toneLabel?: boolean;
	};

	const demoPriorities: DemoPriority[] = [
		{ value: "none", label: "No Priority", icon: EllipsisIcon, tone: "text-muted-foreground" },
		{ value: "low", label: "Low", bars: 1, tone: "text-foreground" },
		{ value: "medium", label: "Medium", bars: 2, tone: "text-foreground" },
		{ value: "high", label: "High", bars: 3, tone: "text-foreground" },
		{
			value: "urgent",
			label: "Urgent",
			icon: TriangleAlertIcon,
			tone: "text-warning",
			toneLabel: true,
		},
	];

	let demoPriority = $state<DemoPriority | null>(demoPriorities[0]);

	/* ------------------------------------------------------------------- demo 23 */

	type DemoLeadNone = { kind: "none"; id: "no-lead"; label: string };
	type DemoLeadMember = { kind: "member"; id: string; label: string; isCurrentUser?: boolean };
	type DemoLeadGroup = { kind: "group"; value: string; items: DemoLeadMember[] };
	/** What can be SELECTED — the group entry is a layout, never a value. */
	type DemoLead = DemoLeadNone | DemoLeadMember;
	/** What the list is BUILT from. */
	type DemoLeadEntry = DemoLead | DemoLeadGroup;

	const demoNoLead: DemoLeadNone = { kind: "none", id: "no-lead", label: "No lead" };

	const demoLeadMembers: DemoLeadMember[] = [
		{ kind: "member", id: "member-1", label: "Shuhrat Saipov", isCurrentUser: true },
		{ kind: "member", id: "member-2", label: "Nadia Karimova" },
		{ kind: "member", id: "member-3", label: "Bekzod Rakhimov" },
		{ kind: "member", id: "member-4", label: "Lina Bauer" },
		{ kind: "member", id: "member-5", label: "Omar Haddad" },
		{ kind: "member", id: "member-6", label: "Priya Nand" },
		{ kind: "member", id: "member-7", label: "Kenji Watan" },
		{ kind: "member", id: "member-8", label: "Ava Sinclair" },
		{ kind: "member", id: "member-9", label: "Nia Okafor" },
		{ kind: "member", id: "member-10", label: "Matteo Sosa" },
		{ kind: "member", id: "member-11", label: "Salma Rahman" },
		{ kind: "member", id: "member-12", label: "Jonas Meyer" },
	];

	const demoLeadEntries: DemoLeadEntry[] = [
		demoNoLead,
		{ kind: "group", value: "Team members", items: demoLeadMembers },
	];

	let demoLead = $state<DemoLead | null>(demoNoLead);

	/* ------------------------------------------------------------------- demo 24 */

	type DemoNoMembers = { kind: "none"; id: "no-members"; label: string; searchText: string };
	type DemoTeamMate = { kind: "member"; id: string; label: string; isCurrentUser?: boolean };
	type DemoMemberOption = DemoNoMembers | DemoTeamMate;

	/**
	 * The "No members" row searches on a sentence rather than on its label, so typing "clear" or
	 * "remove" finds it. That is what `itemToStringValue` is for, and it is why this demo and the
	 * four after it carry a `searchText` beside the label.
	 */
	const demoNoMembers: DemoNoMembers = {
		kind: "none",
		id: "no-members",
		label: "No members",
		searchText: "No members clear members remove members empty",
	};

	const demoTeamMates: DemoTeamMate[] = [
		{ kind: "member", id: "member-1", label: "Alex Morgan", isCurrentUser: true },
		{ kind: "member", id: "member-2", label: "Emma Carter" },
		{ kind: "member", id: "member-3", label: "Ryan Mitchell" },
		{ kind: "member", id: "member-4", label: "Olivia Bennett" },
		{ kind: "member", id: "member-5", label: "Ethan Brooks" },
		{ kind: "member", id: "member-6", label: "Sophia Reed" },
		{ kind: "member", id: "member-7", label: "Lucas Hayes" },
		{ kind: "member", id: "member-8", label: "Ava Sinclair" },
		{ kind: "member", id: "member-9", label: "Mia Parker" },
		{ kind: "member", id: "member-10", label: "Noah Foster" },
		{ kind: "member", id: "member-11", label: "Grace Collins" },
		{ kind: "member", id: "member-12", label: "Jack Turner" },
	];

	const demoMemberOptions: DemoMemberOption[] = [demoNoMembers, ...demoTeamMates];

	let demoSelectedMembers = $state<DemoTeamMate[]>(demoTeamMates.slice(0, 5));

	/** How many portraits the trigger shows before it starts counting. */
	const demoShownMembers = 4;

	/** The "No members" row is a command rather than a selection: picking it empties the list. */
	function onDemoMembersChange(next: DemoMemberOption | readonly DemoMemberOption[] | null) {
		const picked = demoAllOf(next);

		demoSelectedMembers = picked.some((option) => option.kind === "none")
			? []
			: picked.filter((option): option is DemoTeamMate => option.kind === "member");
	}

	const demoMembersCount = $derived.by(() => {
		const total = demoSelectedMembers.length;
		if (total === 1) return "1 member";

		const hidden = total - Math.min(total, demoShownMembers);
		if (hidden > 0) return `+${hidden} ${hidden === 1 ? "member" : "members"}`;
		return `${total} members`;
	});

	/* ------------------------------------------------------------------- demo 25 */

	type DemoDateNone = { kind: "none"; id: "no-date"; label: string; searchText: string };
	type DemoDatePreset = {
		kind: "preset";
		id: string;
		label: string;
		date: DateValue;
		searchText: string;
	};
	type DemoDateCustom = { kind: "custom"; id: "custom-date"; label: string; searchText: string };
	type DemoDateOption = DemoDateNone | DemoDatePreset | DemoDateCustom;

	/** What the page keeps: a preset it can point back at, or a date the user picked by hand. */
	type DemoDateSelection =
		| { kind: "preset"; id: string; label: string; date: DateValue }
		| { kind: "custom"; label: string; date: DateValue }
		| null;

	/**
	 * `@internationalized/date` rather than upstream's `date-fns`, because the Calendar in the dialog
	 * speaks `DateValue` — one calendar system for the whole section beats converting at the seam.
	 * `endOfWeek` takes a locale instead of a `weekStartsOn`, and `en-GB` is the one that starts on
	 * Monday, which is upstream's `{ weekStartsOn: 1 }`.
	 */
	const demoToday = today(getLocalTimeZone());

	const demoWeekEnd = (() => {
		const end = endOfWeek(demoToday, "en-GB");
		return isSameDay(demoToday, end) ? end.add({ weeks: 1 }) : end;
	})();

	const demoMonthEnd = (() => {
		const end = endOfMonth(demoToday);
		return isSameDay(demoToday, end) ? endOfMonth(demoToday.add({ months: 1 })) : end;
	})();

	const demoNoDate: DemoDateNone = {
		kind: "none",
		id: "no-date",
		label: "No date",
		searchText: "No date clear date remove date empty",
	};

	const demoCustomDate: DemoDateCustom = {
		kind: "custom",
		id: "custom-date",
		label: "Custom date...",
		searchText: "Custom date custom day calendar picker choose a date manual date",
	};

	const demoDatePresets: DemoDatePreset[] = [
		{
			kind: "preset",
			id: "tomorrow",
			label: "Tomorrow",
			date: demoToday.add({ days: 1 }),
			searchText: "Tomorrow next day due date",
		},
		{
			kind: "preset",
			id: "end-of-week",
			label: "End of week",
			date: demoWeekEnd,
			searchText: "End of week Sunday week close target",
		},
		{
			kind: "preset",
			id: "in-one-week",
			label: "In one week",
			date: demoToday.add({ weeks: 1 }),
			searchText: "In one week next week seven days target",
		},
		{
			kind: "preset",
			id: "end-of-month",
			label: "End of month",
			date: demoMonthEnd,
			searchText: "End of month month close month end target",
		},
		{
			kind: "preset",
			id: "in-one-month",
			label: "In one month",
			date: demoToday.add({ months: 1 }),
			searchText: "In one month next month thirty days target",
		},
	];

	const demoDateOptions: DemoDateOption[] = [demoNoDate, ...demoDatePresets, demoCustomDate];

	/** `dd/MM/yyyy` and `MMM d`, the two formats the demo prints, as locale formatters. */
	const demoNumericDate = new DateFormatter("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
	const demoShortDate = new DateFormatter("en-US", { month: "short", day: "numeric" });

	function demoFormatDate(formatter: DateFormatter, date: DateValue): string {
		return formatter.format(date.toDate(getLocalTimeZone()));
	}

	let demoStartDate = $state<DemoDateSelection>(null);
	let demoDatePickerOpen = $state(false);
	let demoDateDraft = $state<DateValue | undefined>(undefined);

	/** Which row the list marks: the preset behind the selection, or "No date" while there is none. */
	const demoActiveDate = $derived.by<DemoDateOption | null>(() => {
		const selection = demoStartDate;
		if (!selection) return demoNoDate;
		if (selection.kind === "custom") return null;
		return demoDatePresets.find((preset) => preset.id === selection.id) ?? null;
	});

	function onDemoDateChange(next: DemoDateOption | readonly DemoDateOption[] | null) {
		const option = demoOneOf(next);
		if (!option) return;

		if (option.kind === "none") {
			demoStartDate = null;
			return;
		}

		if (option.kind === "custom") {
			// A frame later, which is upstream's `requestAnimationFrame` and for the same reason: the
			// popup is still closing and handing focus back to the trigger, and a dialog that traps
			// focus in the middle of that fights it.
			requestAnimationFrame(() => {
				demoDateDraft = demoStartDate?.date ?? demoToday.add({ days: 1 });
				demoDatePickerOpen = true;
			});
			return;
		}

		demoStartDate = { kind: "preset", id: option.id, label: option.label, date: option.date };
	}

	function onDemoDateConfirm() {
		if (!demoDateDraft) return;

		demoStartDate = {
			kind: "custom",
			label: demoFormatDate(demoShortDate, demoDateDraft),
			date: demoDateDraft,
		};
		demoDatePickerOpen = false;
	}

	/* ------------------------------------------------------------------- demo 26 */

	type DemoNoLabel = { kind: "none"; id: "no-label"; label: string; searchText: string };
	type DemoLabel = { kind: "label"; id: string; label: string; dot: string; searchText: string };
	type DemoLabelOption = DemoNoLabel | DemoLabel;

	const demoNoLabel: DemoNoLabel = {
		kind: "none",
		id: "no-label",
		label: "No label",
		searchText: "No label clear labels remove labels empty",
	};

	const demoLabels: DemoLabel[] = [
		{
			kind: "label",
			id: "feature",
			label: "Feature",
			dot: "bg-info",
			searchText: "Feature product enhancement capability",
		},
		{
			kind: "label",
			id: "bug",
			label: "Bug",
			dot: "bg-destructive",
			searchText: "Bug issue defect problem",
		},
		{
			kind: "label",
			id: "improvement",
			label: "Improvement",
			dot: "bg-success",
			searchText: "Improvement refinement polish optimization",
		},
		{
			kind: "label",
			id: "design",
			label: "Design",
			dot: "bg-primary",
			searchText: "Design ui ux creative visual",
		},
	];

	const demoLabelOptions: DemoLabelOption[] = [demoNoLabel, ...demoLabels];

	let demoSelectedLabels = $state<DemoLabel[]>([...demoLabels]);

	/** How many dots the trigger shows before it starts counting. */
	const demoShownLabels = 3;

	function onDemoLabelsChange(next: DemoLabelOption | readonly DemoLabelOption[] | null) {
		const picked = demoAllOf(next);

		demoSelectedLabels = picked.some((option) => option.kind === "none")
			? []
			: picked.filter((option): option is DemoLabel => option.kind === "label");
	}

	/* ------------------------------------------------------------------- demo 27 */

	type DemoNoTeam = { kind: "none"; id: "no-team"; label: string; searchText: string };
	type DemoTeam = {
		kind: "team";
		id: string;
		label: string;
		icon: LucideIcon;
		tone: string;
		searchText: string;
	};
	type DemoTeamOption = DemoNoTeam | DemoTeam;

	const demoNoTeam: DemoNoTeam = {
		kind: "none",
		id: "no-team",
		label: "No team",
		searchText: "No team clear team remove team empty",
	};

	const demoTeams: DemoTeam[] = [
		{
			kind: "team",
			id: "testo-growth",
			label: "Testo Growth",
			icon: SparklesIcon,
			tone: "text-success",
			searchText: "Testo Growth experiments lifecycle activation",
		},
		{
			kind: "team",
			id: "atlas-platform",
			label: "Atlas Platform",
			icon: LayersIcon,
			tone: "text-info",
			searchText: "Atlas Platform infrastructure systems",
		},
		{
			kind: "team",
			id: "nova-studio",
			label: "Nova Studio",
			icon: BriefcaseBusinessIcon,
			tone: "text-primary",
			searchText: "Nova Studio design systems creative",
		},
		{
			kind: "team",
			id: "pulse-support",
			label: "Pulse Support",
			icon: PackageIcon,
			tone: "text-destructive",
			searchText: "Pulse Support product health customer care",
		},
		{
			kind: "team",
			id: "orbit-ops",
			label: "Orbit Ops",
			icon: GitBranchIcon,
			tone: "text-warning",
			searchText: "Orbit Ops operations dependencies releases",
		},
	];

	const demoTeamOptions: DemoTeamOption[] = [demoNoTeam, ...demoTeams];

	let demoTeam = $state<DemoTeam | null>(demoTeams[0]);

	/** No team is a row in the list, so "nothing selected" still points at something. */
	const demoSelectedTeam = $derived<DemoTeamOption>(demoTeam ?? demoNoTeam);

	function onDemoTeamChange(next: DemoTeamOption | readonly DemoTeamOption[] | null) {
		const option = demoOneOf(next);
		demoTeam = option?.kind === "team" ? option : null;
	}

	/* ------------------------------------------------------------------- demo 28 */

	type DemoNoAssignee = { kind: "none"; id: "no-assignee"; label: string; searchText: string };
	type DemoAssignee = {
		kind: "member";
		id: string;
		label: string;
		isCurrentUser?: boolean;
		searchText: string;
	};
	type DemoInvite = { kind: "invite"; id: "invite-user"; label: string; searchText: string };
	type DemoAssigneeOption = DemoNoAssignee | DemoAssignee | DemoInvite;
	type DemoAssigneeGroup = { kind: "group"; value: string; items: DemoAssigneeOption[] };
	type DemoAssigneeEntry = DemoAssigneeOption | DemoAssigneeGroup;

	const demoNoAssignee: DemoNoAssignee = {
		kind: "none",
		id: "no-assignee",
		label: "No assignee",
		searchText: "No assignee unassigned clear assignee remove assignee",
	};

	const demoInvite: DemoInvite = {
		kind: "invite",
		id: "invite-user",
		label: "Invite...",
		searchText: "Invite new user teammate member collaborator",
	};

	const demoAssignees: DemoAssignee[] = [
		{
			kind: "member",
			id: "member-1",
			label: "Alex Morgan",
			isCurrentUser: true,
			searchText: "Alex Morgan current user owner",
		},
		{
			kind: "member",
			id: "member-2",
			label: "Emma Carter",
			searchText: "Emma Carter product design",
		},
		{
			kind: "member",
			id: "member-3",
			label: "Ryan Mitchell",
			searchText: "Ryan Mitchell engineering backend",
		},
		{
			kind: "member",
			id: "member-4",
			label: "Olivia Bennett",
			searchText: "Olivia Bennett growth marketing",
		},
		{
			kind: "member",
			id: "member-5",
			label: "Ethan Brooks",
			searchText: "Ethan Brooks operations",
		},
	];

	const demoAssigneeEntries: DemoAssigneeEntry[] = [
		demoNoAssignee,
		{ kind: "group", value: "Team members", items: demoAssignees },
		{ kind: "group", value: "New user", items: [demoInvite] },
	];

	let demoAssignee = $state<DemoAssignee | null>(null);

	const demoSelectedAssignee = $derived<DemoNoAssignee | DemoAssignee>(
		demoAssignee ?? demoNoAssignee,
	);

	function onDemoAssigneeChange(next: DemoAssigneeEntry | readonly DemoAssigneeEntry[] | null) {
		const option = demoOneOf(next);

		// "Invite…" opens an invitation flow the demo does not ship, so it is an action rather than a
		// value: the write is declined and the field keeps whatever it had. This is the one case the
		// function binding exists for — a plain `value` prop would leave the widget showing "Invite…".
		if (!option || option.kind === "invite" || option.kind === "group") return;

		demoAssignee = option.kind === "member" ? option : null;
	}
</script>

<!--
	The fragments the last ten sections share between a trigger and its list, one snippet each —
	upstream writes them as small React components and the script block's third header says why they
	land here instead. None of them sizes its own glyph: `Combobox.Item` and `Button` both size an
	`svg` that carries no `size-*` of its own, which is the house rule for an icon inside a
	component.
-->

<!-- demo 21: `StatusLabel`, in the trigger and on every row. -->
{#snippet demoStatusLabel(status: DemoStatus)}
	<span class="flex min-w-0 items-center gap-2">
		<status.icon class={status.tone} />
		<span class="truncate">{status.label}</span>
	</span>
{/snippet}

<!--
	demo 22: the three bars it draws by hand — `viewBox="0 0 16 16"` and three rounded
	rects of growing height, the ones above the chosen priority faded to 28%. Written once with the
	fill count as a parameter, where the source repeats the whole `svg` three times.
-->
{#snippet demoPriorityBars(filled: number, tone: string)}
	<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class={tone}>
		<rect
			x="3"
			y="9"
			width="2.5"
			height="4"
			rx="1"
			fill="currentColor"
			opacity={filled >= 1 ? 1 : 0.28}
		/>
		<rect
			x="7"
			y="6"
			width="2.5"
			height="7"
			rx="1"
			fill="currentColor"
			opacity={filled >= 2 ? 1 : 0.28}
		/>
		<rect
			x="11"
			y="3"
			width="2.5"
			height="10"
			rx="1"
			fill="currentColor"
			opacity={filled >= 3 ? 1 : 0.28}
		/>
	</svg>
{/snippet}

{#snippet demoPriorityLabel(priority: DemoPriority)}
	<span class="flex min-w-0 items-center gap-2">
		{#if priority.bars}
			{@render demoPriorityBars(priority.bars, priority.tone)}
		{:else if priority.icon}
			<priority.icon class={priority.tone} />
		{/if}
		<span class={cn("truncate", priority.toneLabel && priority.tone)}>{priority.label}</span>
	</span>
{/snippet}

<!-- demo 23: the trigger's rendering of a lead, one line with the portrait inline. -->
{#snippet demoLeadLabel(lead: DemoLead)}
	<span class="flex min-w-0 items-center gap-2">
		{#if lead.kind === "none"}
			<UserIcon class="text-muted-foreground" />
		{:else}
			<!-- Initials rather than the demo's stock portraits, for the reason the page's second
			     header gives: this repository ships no images and fetches none. -->
			<Avatar.Root size="sm">
				<Avatar.Fallback>{getInitials(lead.label)}</Avatar.Fallback>
			</Avatar.Root>
		{/if}
		<span class="truncate">{lead.label}</span>
	</span>
{/snippet}

<!-- The same lead as a list row: an `Item`, and the current user says so. -->
{#snippet demoLeadRow(lead: DemoLead)}
	{#if lead.kind === "none"}
		{@render demoLeadLabel(lead)}
	{:else}
		{@render demoMemberRow(lead.label, lead.isCurrentUser)}
	{/if}
{/snippet}

<!--
	The list row c-combobox-23, -24 and -28 all render: portrait, name, and "(You)" for whoever is
	looking. Takes the two fields it needs rather than a record, so all three unions can call it.
-->
{#snippet demoMemberRow(name: string, isCurrentUser?: boolean)}
	<Item.Root size="xs" class="p-0">
		<Item.Media>
			<Avatar.Root size="sm">
				<Avatar.Fallback>{getInitials(name)}</Avatar.Fallback>
			</Avatar.Root>
		</Item.Media>
		<Item.Content>
			<Item.Title class="gap-1 whitespace-nowrap">
				<span>{name}</span>
				{#if isCurrentUser}
					<span class="font-normal text-muted-foreground">(You)</span>
				{/if}
			</Item.Title>
		</Item.Content>
	</Item.Root>
{/snippet}

<!-- demo 25: one row of the date list — the preset rows carry their date on the right. -->
{#snippet demoDateRow(option: DemoDateOption)}
	{#if option.kind === "preset"}
		<span class="flex w-full min-w-0 items-center justify-between gap-3">
			<span class="flex min-w-0 items-center gap-2">
				<CalendarIcon class="text-muted-foreground" />
				<span class="truncate">{option.label}</span>
			</span>
			<span class="shrink-0 text-xs text-muted-foreground tabular-nums">
				{demoFormatDate(demoNumericDate, option.date)}
			</span>
		</span>
	{:else}
		<span class="flex min-w-0 items-center gap-2">
			{#if option.kind === "custom"}
				<CalendarSearchIcon class="text-muted-foreground" />
			{:else}
				<CalendarIcon class="text-muted-foreground" />
			{/if}
			<span class="truncate">{option.label}</span>
		</span>
	{/if}
{/snippet}

<!-- demo 26: a label's colour chip. `aria-hidden`, the name beside it being the label. -->
{#snippet demoLabelDot(label: DemoLabel)}
	<span aria-hidden="true" class={cn("size-3 shrink-0 rounded-full", label.dot)}></span>
{/snippet}

{#snippet demoLabelRow(option: DemoLabelOption)}
	{#if option.kind === "none"}
		<span class="truncate">{option.label}</span>
	{:else}
		<span class="flex min-w-0 items-center gap-2">
			{@render demoLabelDot(option)}
			<span class="truncate">{option.label}</span>
		</span>
	{/if}
{/snippet}

<!-- demo 27: a team's mark and name, identical in the trigger and in the list. -->
{#snippet demoTeamLabel(option: DemoTeamOption)}
	<span class="flex min-w-0 items-center gap-2">
		{#if option.kind === "none"}
			<UsersIcon class="text-muted-foreground" />
		{:else}
			<option.icon class={option.tone} />
		{/if}
		<span class="truncate">{option.label}</span>
	</span>
{/snippet}

<!-- demo 28: the trigger's rendering, and the list row that adds the invitation case. -->
{#snippet demoAssigneeLabel(option: DemoNoAssignee | DemoAssignee)}
	<span class="flex min-w-0 items-center gap-2">
		{#if option.kind === "none"}
			<UserIcon class="text-muted-foreground" />
		{:else}
			<Avatar.Root size="sm">
				<Avatar.Fallback>{getInitials(option.label)}</Avatar.Fallback>
			</Avatar.Root>
		{/if}
		<span class="truncate">{option.label}</span>
	</span>
{/snippet}

{#snippet demoAssigneeRow(option: DemoAssigneeOption)}
	{#if option.kind === "member"}
		{@render demoMemberRow(option.label, option.isCurrentUser)}
	{:else if option.kind === "invite"}
		<span class="flex min-w-0 items-center gap-2">
			<SendIcon class="text-muted-foreground" />
			<span class="truncate">{option.label}</span>
		</span>
	{:else}
		{@render demoAssigneeLabel(option)}
	{/if}
{/snippet}

<DocPage title="Combobox">
	{#snippet subtitle()}
		An autocomplete control: a select that can be searched. Built here, as everywhere, from a
		<code class="text-[87.5%] text-primary">Command</code>
		inside a
		<code class="text-[87.5%] text-primary">Popover</code>, and skinned as the boxed-select the
		classic select skin this theme already ships. Fourteen arrangements of the two. What it commits
		is always one of the items, never the text typed to find them — reach for
		<a class="text-primary underline underline-offset-3" href={href("/components/autocomplete")}
			>Autocomplete</a
		>
		next door when the answer may be one the list never offered.
		<br />
		Six components type to pick, and each holds one role:
		<strong>Select</strong> — a closed set, one pick, no typing;
		<strong>Combobox</strong> (this recipe) — a searchable pick, including closed-set multi-select
		with chips;
		<strong>Autocomplete</strong> — free text with suggestions, where the value IS the field text;
		<strong>Listbox</strong> — an always-visible option list;
		<strong>Tags input</strong> — free-text multi-values;
		<strong>Mention</strong> — inline
		<code class="text-[87.5%] text-primary">@</code> picks in running text.
	{/snippet}

	<DocSection title="Basic combobox">
		{#snippet blurb()}
			The recipe at its smallest: a trigger that shows the choice, a searchable list, and a second
			click on the chosen row to clear it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={basicOpen}>
					<Popover.Trigger>
						<!-- `child` so the trigger IS the button, rather than a button inside a button. -->
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="Framework combobox"
								class={trigger}
							>
								{#if basicValue}
									{frameworks.find((entry) => entry.value === basicValue)?.label}
								{:else}
									<span class={placeholder}>Select framework...</span>
								{/if}
								<ChevronsUpDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search framework..." />
							<Command.List class={list}>
								<Command.Empty>No framework found.</Command.Empty>
								<Command.Group class={optionGroup}>
									{#each frameworks as framework (framework.value)}
										<Command.Item
											class={option}
											value={framework.value}
											keywords={[framework.label]}
											data-checked={basicValue === framework.value ? "true" : undefined}
											onSelect={() => {
												basicValue = basicValue === framework.value ? "" : framework.value;
												basicOpen = false;
											}}
										>
											{framework.label}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Combobox option group">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">Command.Group</code> with a heading per category. Selecting
			here replaces the value outright — there is no second click to clear, which is the source's choice
			and the one difference from the section above.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={groupOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="Combobox option group"
								class={trigger}
							>
								{#if groupValue}
									<span class="truncate">{groupValue}</span>
								{:else}
									<span class={placeholder}>Select item</span>
								{/if}
								<ChevronsUpDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search item..." />
							<Command.List class={list}>
								<Command.Empty>No item found.</Command.Empty>
								<!--
									React needs a `<Fragment key>` around each group because `map` returns a
									list; `{#each}` keys the block itself and needs no wrapper.
								-->
								{#each pantry as group (group.category)}
									<Command.Group heading={group.category} class={optionGroup}>
										{#each group.items as item (item.value)}
											<Command.Item
												class={option}
												value={item.value}
												data-checked={groupValue === item.value ? "true" : undefined}
												onSelect={() => {
													groupValue = item.value;
													groupOpen = false;
												}}
											>
												{item.value}
											</Command.Item>
										{/each}
									</Command.Group>
								{/each}
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Combobox disabled option">
		{#snippet blurb()}
			The same list with one entry disabled in two of its groups. A disabled row cannot be clicked
			or arrowed onto, and dims to say so.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={disabledOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="Combobox disabled option"
								class={trigger}
							>
								{#if disabledValue}
									<span class="truncate">{disabledValue}</span>
								{:else}
									<span class={placeholder}>Select item</span>
								{/if}
								<ChevronsUpDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search item..." />
							<Command.List class={list}>
								<Command.Empty>No item found.</Command.Empty>
								{#each pantry as group (group.category)}
									<Command.Group heading={group.category} class={optionGroup}>
										{#each group.items as item (item.value)}
											<!--
												THE DIMMING HAS TO BE WRITTEN, and the source writing it is not
												belt and braces. `command-item.svelte` styles the disabled state
												with `data-[disabled=true]:opacity-50`, which asks for the literal
												string `"true"`; bits-ui writes `data-disabled=""`
												(`boolToEmptyStrOrUndef`), so that selector matches nothing. The
												BEHAVIOUR is bits-ui's own and needs no help — `onclick` and
												`onpointermove` both return early on a disabled item — so only the
												appearance is supplied here.
											-->
											<Command.Item
												class={cn(option, item.disabled && "cursor-not-allowed opacity-50")}
												value={item.value}
												disabled={item.disabled}
												data-checked={disabledValue === item.value ? "true" : undefined}
												onSelect={() => {
													disabledValue = item.value;
													disabledOpen = false;
												}}
											>
												{item.value}
											</Command.Item>
										{/each}
									</Command.Group>
								{/each}
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Combobox option with icon">
		{#snippet blurb()}
			An icon per row, and the chosen one repeated in the trigger. The search still runs on the
			label, not on the glyph.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={industryOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="Combobox option with icon"
								class={trigger}
							>
								{#if selectedIndustry}
									<span class="flex min-w-0 items-center gap-2">
										<selectedIndustry.icon class="text-muted-foreground" />
										<span class="truncate">{selectedIndustry.label}</span>
									</span>
								{:else}
									<span class={placeholder}>Select industry category</span>
								{/if}
								<ChevronsUpDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search industries..." />
							<Command.List class={list}>
								<Command.Empty>No industry found.</Command.Empty>
								<Command.Group class={optionGroup}>
									{#each industries as industry (industry.value)}
										<!--
											`data-checked` is this page's addition. The source marks the selected
											industry nowhere in the list, so reopening the menu does not say which
											row is in the trigger — the one demo of the fourteen with that gap.
										-->
										<Command.Item
											class={option}
											value={industry.value}
											keywords={[industry.label]}
											data-checked={industryValue === industry.value ? "true" : undefined}
											onSelect={() => {
												industryValue = industryValue === industry.value ? "" : industry.value;
												industryOpen = false;
											}}
										>
											<industry.icon class="text-muted-foreground" />
											{industry.label}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Combobox with custom check icon">
		{#snippet blurb()}
			The one section that draws its own tick, so the component's has to be put away.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={tickOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="Combobox with custom check icon"
								class={trigger}
							>
								{#if tickValue}
									{frameworks.find((entry) => entry.value === tickValue)?.label}
								{:else}
									<!--
										The source says "Select industry category" here, byte for byte the
										string from #4, on a picker whose every other word is "framework".
										A stray noun rather than a behaviour, so it is corrected in place
										rather than added to the header's list.
									-->
									<span class={placeholder}>Select framework</span>
								{/if}
								<ChevronsUpDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search framework..." />
							<Command.List class={list}>
								<Command.Empty>No framework found.</Command.Empty>
								<Command.Group class={optionGroup}>
									{#each frameworks as framework (framework.value)}
										<!--
											`cn-command-item-indicator` is the class `command-item.svelte` puts on
											the tick it renders itself — a named hook, so hiding it needs no
											structural selector, and the data table's faceted filter already uses
											it for the same purpose. Without this the row would carry two ticks,
											the component's and the one below, both `ml-auto`.

											`fill-primary stroke-primary-foreground` is the source's
											`fill-blue-500 stroke-white` read back through the palette: `primary`
											IS #2C7BE5 and `btn-text-color` IS white, so the pair follows the
											theme picker instead of freezing one theme's blue.
										-->
										<Command.Item
											class={cn(option, "[&_.cn-command-item-indicator]:hidden")}
											value={framework.value}
											keywords={[framework.label]}
											onSelect={() => {
												tickValue = tickValue === framework.value ? "" : framework.value;
												tickOpen = false;
											}}
										>
											{framework.label}
											<CheckIcon
												class={cn(
													"ml-auto fill-primary stroke-primary-foreground",
													tickValue === framework.value ? "opacity-100" : "opacity-0",
												)}
											/>
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Combobox with search and add button">
		{#snippet blurb()}
			An escape hatch below the list, separated from it, for the case the search does not cover.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={universityOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="Combobox with search and add button"
								class={trigger}
							>
								{#if universityValue}
									<span class="truncate">
										{universities.find((entry) => entry.value === universityValue)?.label}
									</span>
								{:else}
									<span class={placeholder}>Select university</span>
								{/if}
								<ChevronsUpDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Find university" />
							<Command.List class={list}>
								<Command.Empty>No university found.</Command.Empty>
								<Command.Group class={optionGroup}>
									{#each universities as university (university.value)}
										<Command.Item
											class={option}
											value={university.value}
											keywords={[university.label]}
											data-checked={universityValue === university.value ? "true" : undefined}
											onSelect={() => {
												universityValue =
													universityValue === university.value ? "" : university.value;
												universityOpen = false;
											}}
										>
											{university.label}
										</Command.Item>
									{/each}
								</Command.Group>
								<!--
									`forceMount` on BOTH, and it is what makes this demo work. A
									`Command.Separator` unmounts as soon as the search box is non-empty, and a
									`Command.Group` unmounts when none of its items match — this one has no
									items at all, only a button, so it would vanish on the first keystroke.
									The row would then be absent precisely when the search has found nothing,
									which is the one moment "New university" is the answer.

									A Button rather than a `Command.Item`, as the source has it: this row is
									not one of the options, so it should not answer the search or take the
									arrow keys. Tab reaches it.

									`onkeydown` is this page's addition and it is not decoration.
									`Command.Root` spreads its own handler over the whole menu, and its
									ENTER case is unconditional — `e.preventDefault(); const item =
									this.#getSelectedItem(); if (item) item?.click();` — so Enter on this
									button, a descendant of that root, would have its own activation
									cancelled and would select whichever row the cursor sat on instead.
									Stopping the two activation keys before they bubble is the same trick
									the chips play on the multi-select triggers.
								-->
								<Command.Separator class={separator} forceMount />
								<Command.Group class={optionGroup} forceMount>
									<Button
										variant="ghost"
										class="w-full justify-start pl-3 font-normal"
										onkeydown={stopActivationKeys}
									>
										<PlusIcon class="opacity-60" aria-hidden="true" />
										New university
									</Button>
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Timezone combobox">
		{#snippet blurb()}
			Every zone the runtime knows — some four hundred rows, which is the point: the search row
			stops being a convenience and becomes the only way in.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={timezoneOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="Timezone combobox"
								class={trigger}
							>
								{#if selectedTimezone}
									<span class="truncate">{selectedTimezone.label}</span>
								{:else}
									<span class={placeholder}>Select timezone</span>
								{/if}
								<ChevronsUpDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search timezone" />
							<Command.List class={list}>
								<Command.Empty>No timezone found.</Command.Empty>
								<Command.Group class={optionGroup}>
									{#each timezones as zone (zone.value)}
										<Command.Item
											class={option}
											value={zone.value}
											keywords={[zone.label]}
											data-checked={timezoneValue === zone.value ? "true" : undefined}
											onSelect={() => {
												timezoneValue = timezoneValue === zone.value ? "" : zone.value;
												timezoneOpen = false;
											}}
										>
											<span class="truncate">{zone.label}</span>
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="User combobox">
		{#snippet blurb()}
			Two lines per row, and an avatar carried up into the trigger.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={userOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="User combobox"
								class={trigger}
							>
								{#if selectedUser}
									<span class="flex min-w-0 items-center gap-2">
										<!--
											Initials, not a photograph: the repository ships no images (§16). No
											`class="border"`, which the Cards page's picker adds — `Avatar.Root`
											already draws its hairline as an `after:` ring, so a real border on
											top of it would double the outline.
										-->
										<Avatar.Root size="sm">
											<Avatar.Fallback>{getInitials(selectedUser.name)}</Avatar.Fallback>
										</Avatar.Root>
										<span class="truncate font-medium">{selectedUser.name}</span>
									</span>
								{:else}
									<span class={placeholder}>Select user</span>
								{/if}
								<ChevronsUpDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search user..." />
							<Command.List class={list}>
								<Command.Empty>No users found.</Command.Empty>
								<Command.Group class={optionGroup}>
									{#each users as user (user.email)}
										<!--
											The one list whose keywords are not its label — here the value IS the
											label, and the second line the row shows is the address, which the
											source leaves unsearchable. `PhoneInput` packs its extra terms into
											the `value` instead, which works but then decides what `onSelect` has
											to compare.
										-->
										<Command.Item
											class={option}
											value={user.name}
											keywords={[user.email]}
											data-checked={userValue === user.name ? "true" : undefined}
											onSelect={() => {
												userValue = userValue === user.name ? "" : user.name;
												userOpen = false;
											}}
										>
											<Avatar.Root>
												<Avatar.Fallback>{getInitials(user.name)}</Avatar.Fallback>
											</Avatar.Root>
											<span class="flex min-w-0 flex-col">
												<span class="truncate font-medium text-foreground">{user.name}</span>
												<span class="truncate">{user.email}</span>
											</span>
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Options with flag and search">
		{#snippet blurb()}
			The same shape as the section above with a single glyph instead of an avatar — and a single
			chevron on the trigger, the source distinguishing a picker that only opens downwards.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={countryOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="Options with flag and search"
								class={trigger}
							>
								{#if selectedCountry}
									<span class="flex min-w-0 items-center gap-2">
										<span class="text-lg leading-none">{selectedCountry.flag}</span>
										<span class="truncate">{selectedCountry.label}</span>
									</span>
								{:else}
									<span class={placeholder}>Select country</span>
								{/if}
								<ChevronDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search country..." />
							<Command.List class={list}>
								<Command.Empty>No country found.</Command.Empty>
								<!--
									Rows with no `Command.Group` around them, as the source has it. They
									register, filter and select normally; the one thing they give up is
									re-ordering, since bits-ui re-appends scored items into a
									`Command.Viewport` this repository does not render. Ten countries in a
									fixed order is exactly the case where that does not matter.
								-->
								{#each countries as country (country.label)}
									<Command.Item
										class={option}
										value={country.label}
										data-checked={countryValue === country.label ? "true" : undefined}
										onSelect={() => {
											countryValue = country.label;
											countryOpen = false;
										}}
									>
										<span class="text-lg leading-none">{country.flag}</span>
										{country.label}
									</Command.Item>
								{/each}
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Multiple combobox">
		{#snippet blurb()}
			Selecting no longer closes the menu, and each choice becomes a chip in the trigger that can be
			dropped without reopening it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={multiOpen}>
					<Popover.Trigger>
						<!--
							A `div`, not a `Button`: see {@link multiTrigger}. `props` supplies the click and
							the Enter/Space keydown; `role` and `tabindex` supply what a `<button>` would
							have given for free.
						-->
						{#snippet child({ props })}
							<div
								{...props}
								role="combobox"
								tabindex="0"
								aria-label="Multiple combobox"
								class={cn(buttonVariants({ variant: "outline" }), trigger, multiTrigger)}
							>
								<div class="flex flex-wrap items-center gap-1">
									{#if multiValues.length > 0}
										{#each multiValues as value (value)}
											{@const stack = stacks.find((entry) => entry.value === value)}
											{#if stack}
												<Badge variant="outline">
													{stack.label}
													<button
														type="button"
														class={chipButton}
														aria-label="Remove {stack.label}"
														onclick={(event) => {
															event.stopPropagation();
															multiValues = toggle(multiValues, value);
														}}
														onkeydown={stopActivationKeys}
													>
														<XIcon class="size-3" />
													</button>
												</Badge>
											{/if}
										{/each}
									{:else}
										<span class={placeholder}>Select framework</span>
									{/if}
								</div>
								<ChevronsUpDownIcon class={caret} />
							</div>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search framework..." />
							<Command.List class={list}>
								<Command.Empty>No framework found.</Command.Empty>
								<Command.Group class={optionGroup}>
									{#each stacks as stack (stack.value)}
										<Command.Item
											class={option}
											value={stack.value}
											keywords={[stack.label]}
											data-checked={multiValues.includes(stack.value) ? "true" : undefined}
											onSelect={() => (multiValues = toggle(multiValues, stack.value))}
										>
											<span class="truncate">{stack.label}</span>
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Multiple combobox expandable">
		{#snippet blurb()}
			The same trigger with a cap of two chips, and a third that counts the rest and unfolds them.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={expandOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<div
								{...props}
								role="combobox"
								tabindex="0"
								aria-label="Multiple combobox expandable"
								class={cn(buttonVariants({ variant: "outline" }), trigger, multiTrigger)}
							>
								<div class="flex flex-wrap items-center gap-1">
									{#if expandValues.length > 0}
										{#each shownStacks as value (value)}
											{@const stack = stacks.find((entry) => entry.value === value)}
											{#if stack}
												<Badge variant="outline">
													{stack.label}
													<button
														type="button"
														class={chipButton}
														aria-label="Remove {stack.label}"
														onclick={(event) => {
															event.stopPropagation();
															expandValues = toggle(expandValues, value);
														}}
														onkeydown={stopActivationKeys}
													>
														<XIcon class="size-3" />
													</button>
												</Badge>
											{/if}
										{/each}
										{#if hiddenStacks > 0 || expanded}
											<!--
												`badgeVariants` on a real button, for the same reason the trigger
												around it is a `div`: this chip is pressed, so it has to be
												something that can be pressed.
											-->
											<button
												type="button"
												class={cn(
													badgeVariants({ variant: "outline" }),
													"cursor-pointer hover:bg-muted",
												)}
												aria-expanded={expanded}
												onclick={(event) => {
													event.stopPropagation();
													expanded = !expanded;
												}}
												onkeydown={stopActivationKeys}
											>
												{expanded ? "Show less" : `+${hiddenStacks} more`}
											</button>
										{/if}
									{:else}
										<span class={placeholder}>Select framework</span>
									{/if}
								</div>
								<ChevronsUpDownIcon class={caret} />
							</div>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search framework..." />
							<Command.List class={list}>
								<Command.Empty>No framework found.</Command.Empty>
								<Command.Group class={optionGroup}>
									{#each stacks as stack (stack.value)}
										<Command.Item
											class={option}
											value={stack.value}
											keywords={[stack.label]}
											data-checked={expandValues.includes(stack.value) ? "true" : undefined}
											onSelect={() => (expandValues = toggle(expandValues, stack.value))}
										>
											<span class="truncate">{stack.label}</span>
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Multiple count badge">
		{#snippet blurb()}
			The chips give way to a count once the list is long enough that they would not fit. This
			trigger stays a button, because nothing inside it is pressed on its own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={countOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="Multiple count badge"
								class={trigger}
							>
								{#if countValues.length > 0}
									<span class="flex min-w-0 items-center gap-2">
										<Badge variant="outline">{countValues.length}</Badge>
										<span class="truncate">frameworks selected</span>
									</span>
								{:else}
									<span class={placeholder}>Select framework</span>
								{/if}
								<ChevronsUpDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class={menu} sideOffset={-1}>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search framework..." />
							<Command.List class={list}>
								<Command.Empty>No framework found.</Command.Empty>
								<Command.Group class={optionGroup}>
									{#each stacks as stack (stack.value)}
										<Command.Item
											class={option}
											value={stack.value}
											keywords={[stack.label]}
											data-checked={countValues.includes(stack.value) ? "true" : undefined}
											onSelect={() => (countValues = toggle(countValues, stack.value))}
										>
											<span class="truncate">{stack.label}</span>
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Combobox menu slide-in from bottom">
		{#snippet blurb()}
			The first of the two demos filed under "Animated combobox". The panel rises instead of
			zooming, over 400ms rather than 100.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={slideOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="Combobox menu slide-in from bottom"
								class={trigger}
							>
								{#if slideValue}
									{frameworks.find((entry) => entry.value === slideValue)?.label}
								{:else}
									<span class={placeholder}>Select framework...</span>
								{/if}
								<ChevronsUpDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<!--
						BOTH ANIMATION UTILITIES ARE IMPORTANT, and the `!` is not emphasis — but they
						need it for two different reasons, so neither can be dropped on the other's
						account. `zoom-in-*` and `slide-in-from-*` come from `tw-animate-css` and set one
						custom property each (`--tw-enter-scale`, `--tw-enter-translate-y`), and the
						panel's own class list already sets both.

						Against its `data-open:zoom-in-95` the zoom TIES: `data-open` is a
						`@custom-variant` written through `:where()`, so both sides weigh (0,1,0) and
						Tailwind's sort order decides. Against its `data-[side=bottom]:slide-in-from-top-2`
						the slide LOSES outright: an arbitrary data variant keeps its attribute selector,
						which is (0,2,0). The source hit the same wall and reached for `!` in its zoom demo
						but not in this one, which is why its slide never quite lands.

						`data-open:` rather than `data-[state=open]:` — the variant
						`shadcn-svelte/tailwind.css` defines, matching both `[data-state='open']` and
						`[data-open]`. bits-ui writes the former.
					-->
					<Popover.Content
						class="{menu} duration-400 data-open:slide-in-from-bottom-10! data-open:zoom-in-100!"
						sideOffset={-1}
					>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search framework..." />
							<Command.List class={list}>
								<Command.Empty>No framework found.</Command.Empty>
								<Command.Group class={optionGroup}>
									{#each frameworks as framework (framework.value)}
										<Command.Item
											class={option}
											value={framework.value}
											keywords={[framework.label]}
											data-checked={slideValue === framework.value ? "true" : undefined}
											onSelect={() => {
												slideValue = slideValue === framework.value ? "" : framework.value;
												slideOpen = false;
											}}
										>
											{framework.label}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Combobox menu zoom-in">
		{#snippet blurb()}
			The second: the panel grows from nothing at its own centre, over half a second.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Popover.Root onOpenChange={keepPageScroll} bind:open={zoomOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								role="combobox"
								aria-label="Combobox menu zoom-in"
								class={trigger}
							>
								{#if zoomValue}
									{frameworks.find((entry) => entry.value === zoomValue)?.label}
								{:else}
									<span class={placeholder}>Select framework...</span>
								{/if}
								<ChevronsUpDownIcon class={caret} />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<!--
						`origin-center` is what the panel already does, by accident. Its own
						`origin-(--transform-origin)` names a variable nothing defines — bits-ui emits
						`--bits-popover-content-transform-origin` — so that declaration is invalid at
						computed-value time and `transform-origin` falls back to its initial `50% 50%`.
						The source asks for the centre explicitly, and writing it means this demo still
						says what it means on the day that variable is corrected.
					-->
					<Popover.Content
						class="{menu} origin-center duration-500 data-open:zoom-in-0!"
						sideOffset={-1}
					>
						<Command.Root class={panel}>
							<Command.Input placeholder="Search framework..." />
							<Command.List class={list}>
								<Command.Empty>No framework found.</Command.Empty>
								<Command.Group class={optionGroup}>
									{#each frameworks as framework (framework.value)}
										<Command.Item
											class={option}
											value={framework.value}
											keywords={[framework.label]}
											data-checked={zoomValue === framework.value ? "true" : undefined}
											onSelect={() => {
												zoomValue = zoomValue === framework.value ? "" : framework.value;
												zoomOpen = false;
											}}
										>
											{framework.label}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		FROM HERE DOWN: the primitive's examples, built on `$lib/components/ui/combobox/` rather than on
		the Popover + Command recipe above. The script block's second header says why both sets stay
		and lists the six translations that apply to all of them.

		demo 1.
	-->
	<DocSection title="A basic combobox with a list of options">
		{#snippet blurb()}
			The primitive at its smallest. The rows come from <code class="text-[87.5%] text-primary"
				>items</code
			>, so the filter runs over the data — a row that scores nothing is never rendered rather than
			rendered and hidden.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root items={demoFrameworks}>
						<Combobox.Input placeholder="Select a framework" />
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 2. -->
	<DocSection title="A disabled combobox">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">disabled</code> on the field takes the chevron with it,
			so there is no way left to open the popup. The same prop on the root disables every part at once
			— which is what the multi-select two sections below does.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root items={demoFrameworks}>
						<Combobox.Input placeholder="Select a framework" disabled />
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 3. -->
	<DocSection title="A combobox in an invalid state">
		{#snippet blurb()}
			Two attributes, two jobs: <code class="text-[87.5%] text-primary">aria-invalid</code> on the
			field is what the input group reads to paint its edge, and
			<code class="text-[87.5%] text-primary">data-invalid</code> on the field wrapper is what turns the
			label and the message destructive.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs" data-invalid="true">
					<Field.FieldLabel for="demo-combobox-invalid">Framework</Field.FieldLabel>
					<Combobox.Root items={demoFrameworks}>
						<Combobox.Input
							id="demo-combobox-invalid"
							placeholder="Select a framework"
							aria-invalid="true"
						/>
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
					<Field.FieldError errors={[{ message: "This field is required." }]} />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 4. -->
	<DocSection title="A combobox with a clear button">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">showClear</code> puts a clear button in the field's corner,
			and only while there is something to clear — which is also what makes room for it, the chevron hiding
			for as long as the clear shows.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root items={demoFrameworks} defaultValue={demoFrameworks[0]}>
						<Combobox.Input placeholder="Select a framework" showClear />
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 5. -->
	<DocSection title="A combobox with auto-highlight enabled">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">autoHighlight</code> arms the first match as you type,
			so <kbd>Enter</kbd> accepts it. Off — the default — nothing is armed until an arrow key moves
			the cursor, and <kbd>Enter</kbd> is left alone for the form to submit.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root items={demoFrameworks} autoHighlight>
						<Combobox.Input placeholder="Select a framework" />
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 6. -->
	<DocSection title="A combobox with grouped options">
		{#snippet blurb()}
			Group-shaped data: each entry carries its own rows, the root filters straight through it, and
			a group whose rows all score nothing takes its heading away with it — a heading over an empty
			list being noise rather than structure.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root items={demoTimezoneGroups}>
						<Combobox.Input placeholder="Select a timezone" />
						<Combobox.Content>
							<Combobox.Empty>No timezones found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(group: DemoTimezoneGroup)}
									<Combobox.Group items={group.items}>
										<Combobox.Label>{group.value}</Combobox.Label>
										<Combobox.Collection>
											{#snippet children(item: string)}
												<Combobox.Item value={item}>{item}</Combobox.Item>
											{/snippet}
										</Combobox.Collection>
									</Combobox.Group>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 7. -->
	<DocSection title="A combobox with grouped options and separators">
		{#snippet blurb()}
			The same list with a rule after each group. It is the LAST group's rule that has to go, not
			the first's, and the group is a named Tailwind group precisely so the separator inside it can
			ask the question.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root items={demoTimezoneGroups}>
						<Combobox.Input placeholder="Select a timezone" />
						<Combobox.Content>
							<Combobox.Empty>No timezones found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(group: DemoTimezoneGroup)}
									<Combobox.Group items={group.items}>
										<Combobox.Label>{group.value}</Combobox.Label>
										<Combobox.Collection>
											{#snippet children(item: string)}
												<Combobox.Item value={item}>{item}</Combobox.Item>
											{/snippet}
										</Combobox.Collection>
										<!--
											`group-last/combobox-group:hidden` — `combobox-group.svelte` declares
											`group/combobox-group` for exactly this. A group that filters itself out
											unmounts, so "last" is asked of what is on screen, not of the source array:
											searching until one group remains leaves it with no trailing rule.
										-->
										<Combobox.Separator class="group-last/combobox-group:hidden" />
									</Combobox.Group>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 8. -->
	<DocSection title="A combobox with a large list of options">
		{#snippet blurb()}
			A hundred rows. The popup caps itself at the smaller of 24rem and the space the viewport has
			left, and the list inside it is the scroll container — so the field stays put while the
			options move under it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root items={demoLargeList}>
						<Combobox.Input placeholder="Search from 100 items" />
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 9. -->
	<DocSection title="A combobox with an icon addon">
		{#snippet blurb()}
			The field is an input group, so anything an input group takes it takes too — here a leading
			addon, which the chevron and the clear button already share the other end of.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root items={demoFrameworks}>
						<!--
							The addon is `<Combobox.Input>`'s `children`, which land inside the group beside the
							control — not inside the input. No size class on the glyph: the addon already sizes
							every `svg` it holds.
						-->
						<Combobox.Input placeholder="Select a framework">
							<InputGroupAddon>
								<GlobeIcon class="text-muted-foreground" />
							</InputGroupAddon>
						</Combobox.Input>
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 10. -->
	<DocSection title="A combobox rendered inside a popup">
		{#snippet blurb()}
			The select shape: the trigger holds the current value and the search field moves into the
			popup. This is the arrangement every section in the first half of this page builds by hand —
			here it is two props.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						items={demoCountries}
						defaultValue={demoCountries[0]}
						itemToStringValue={(item: DemoCountry) => item.label}
					>
						<!--
							`child` rather than upstream's `render` prop, and it renders neither the trigger's
							`children` nor its built-in chevron — so both are placed here. `data-icon="inline-end"`
							is the house spelling for a trailing icon in a Button: it trims the padding on that
							side so the glyph sits where a caret should.
						-->
						<Combobox.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="justify-between font-normal">
									<Combobox.Value>
										{#snippet children(item: DemoCountry)}
											<span class="flex min-w-0 items-center gap-2">
												<span class="text-base leading-none">{item.flag}</span>
												<span class="truncate">{item.label}</span>
											</span>
										{/snippet}
									</Combobox.Value>
									<ChevronDownIcon data-icon="inline-end" class="text-muted-foreground" />
								</Button>
							{/snippet}
						</Combobox.Trigger>
						<!--
							Upstream pins the popup to `min-w-(--anchor-width)` and `max-w-(--anchor-width)`;
							`combobox-content.svelte` is already exactly the anchor's width, so the pair is
							dropped rather than restated. `showTrigger={false}` because the trigger is no longer
							in the field — it is the control the popup hangs off.
						-->
						<Combobox.Content>
							<Combobox.Input showTrigger={false} placeholder="Search" />
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: DemoCountry)}
									<Combobox.Item value={item}>
										<span class="text-base leading-none">{item.flag}</span>
										{item.label}
									</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 11. -->
	<DocSection title="A combobox used within a form">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">name</code> on the root renders a hidden control that
			carries the selection into <code class="text-[87.5%] text-primary">FormData</code>, and
			<code class="text-[87.5%] text-primary">required</code> on it blocks an empty submit the way any
			other field would — a clipped text input rather than a hidden one, because a hidden input is barred
			from constraint validation.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<form class="flex w-full max-w-xs flex-col gap-4" onsubmit={onDemoFrameworkSubmit}>
					<Field.Field>
						<Field.FieldLabel for="demo-combobox-form">Framework</Field.FieldLabel>
						<!--
							`name` and `required` on the ROOT, where upstream writes them on the input: the
							control that submits here is the root's own hidden one, not the field the user types
							in.
						-->
						<Combobox.Root items={demoFrameworks} name="framework" required>
							<Combobox.Input id="demo-combobox-form" placeholder="Select a framework" />
							<Combobox.Content>
								<Combobox.Empty>No items found.</Combobox.Empty>
								<Combobox.List>
									{#snippet children(item: string)}
										<Combobox.Item value={item}>{item}</Combobox.Item>
									{/snippet}
								</Combobox.List>
							</Combobox.Content>
						</Combobox.Root>
					</Field.Field>
					<Button type="submit" class="w-full">Submit</Button>
				</form>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 12. -->
	<DocSection title="A multi-select combobox">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">multiple</code> turns the field into a row of
			committed chips with the search input flowing after them. <kbd>Backspace</kbd> on an empty query
			drops the last chip, so the whole thing is workable without ever leaving the input.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						multiple
						autoHighlight
						items={demoFrameworks}
						defaultValue={[demoFrameworks[0]]}
					>
						<!--
							No `anchor` prop, where upstream threads its `useComboboxAnchor()` ref through both
							parts: `combobox-content.svelte` resolves the chips container on its own whenever one
							is mounted, which is the same answer without the wiring.

							The chips are rendered inside `<Combobox.Value>`'s snippet, one per selected entry in
							order — and that order is what a chip with no `value` removes by, so nothing here has
							to identify itself twice.
						-->
						<Combobox.Chips>
							<Combobox.Value>
								{#snippet children(values: string[])}
									{#each values as value (value)}
										<Combobox.Chip>{value}</Combobox.Chip>
									{/each}
									<Combobox.ChipsInput placeholder="Select frameworks..." />
								{/snippet}
							</Combobox.Value>
						</Combobox.Chips>
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 13. -->
	<DocSection title="A disabled multi-select combobox">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">disabled</code> on the root this time, not on one part:
			the container dims, the input takes nothing, and each chip's remove button goes with it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						multiple
						autoHighlight
						disabled
						items={demoFrameworks}
						defaultValue={[demoFrameworks[0], demoFrameworks[1]]}
					>
						<Combobox.Chips>
							<Combobox.Value>
								{#snippet children(values: string[])}
									{#each values as value (value)}
										<Combobox.Chip>{value}</Combobox.Chip>
									{/each}
									<Combobox.ChipsInput placeholder="Select frameworks..." />
								{/snippet}
							</Combobox.Value>
						</Combobox.Chips>
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 14. -->
	<DocSection title="A multi-select combobox in an invalid state">
		{#snippet blurb()}
			The chips container watches its own descendants for
			<code class="text-[87.5%] text-primary">aria-invalid</code>, so marking the input inside it is
			what turns the whole box destructive.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs" data-invalid="true">
					<Field.FieldLabel for="demo-combobox-multiple-invalid">Frameworks</Field.FieldLabel>
					<Combobox.Root
						multiple
						autoHighlight
						items={demoFrameworks}
						defaultValue={[demoFrameworks[0], demoFrameworks[1]]}
					>
						<Combobox.Chips>
							<Combobox.Value>
								{#snippet children(values: string[])}
									{#each values as value (value)}
										<Combobox.Chip>{value}</Combobox.Chip>
									{/each}
									<Combobox.ChipsInput
										id="demo-combobox-multiple-invalid"
										placeholder="Select frameworks..."
										aria-invalid="true"
									/>
								{/snippet}
							</Combobox.Value>
						</Combobox.Chips>
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
					<Field.FieldError errors={[{ message: "This field is required." }]} />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 15. -->
	<DocSection title="A multi-select with chips that cannot be removed">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">{"showRemove={false}"}</code> takes the × off each
			chip, for a selection that is unpicked from the list rather than from the field.
			<kbd>Backspace</kbd> still works — it belongs to the input, not to the chip.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						multiple
						autoHighlight
						items={demoFrameworks}
						defaultValue={[demoFrameworks[0], demoFrameworks[1]]}
					>
						<Combobox.Chips>
							<Combobox.Value>
								{#snippet children(values: string[])}
									{#each values as value (value)}
										<Combobox.Chip showRemove={false}>{value}</Combobox.Chip>
									{/each}
									<Combobox.ChipsInput placeholder="Select frameworks..." />
								{/snippet}
							</Combobox.Value>
						</Combobox.Chips>
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 16. -->
	<DocSection title="A combobox with custom item rendering">
		{#snippet blurb()}
			A row is whatever you put in it — here an <code class="text-[87.5%] text-primary">Item</code>
			with an avatar and two lines. The value committed is the whole record, not a string, so
			<code class="text-[87.5%] text-primary">itemToStringValue</code> is what decides which of its fields
			the search reads.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						items={demoMembers}
						defaultValue={demoMembers[0]}
						itemToStringValue={(member: DemoMember) => member.name}
					>
						<Combobox.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="w-full justify-between font-normal">
									<Combobox.Value>
										{#snippet children(member: DemoMember | null)}
											{#if member}
												<span class="flex min-w-0 items-center gap-2">
													<!--
														Initials, not a photograph. `size="sm"` is 24px, the nearest step on
														the house avatar ramp to the source's 20px — there is no 20.
													-->
													<Avatar.Root size="sm">
														<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
													</Avatar.Root>
													<span class="truncate">{member.name}</span>
												</span>
											{:else}
												<span class="text-muted-foreground">Select a member</span>
											{/if}
										{/snippet}
									</Combobox.Value>
									<ChevronDownIcon data-icon="inline-end" class="text-muted-foreground" />
								</Button>
							{/snippet}
						</Combobox.Trigger>
						<Combobox.Content>
							<Combobox.Input showTrigger={false} placeholder="Search members..." />
							<Combobox.Empty>No members found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(member: DemoMember)}
									<Combobox.Item value={member}>
										<Item.Root size="xs" class="p-0">
											<Avatar.Root size="sm">
												<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
											</Avatar.Root>
											<Item.Content>
												<Item.Title class="whitespace-nowrap">{member.name}</Item.Title>
												<Item.Description>{member.position}</Item.Description>
											</Item.Content>
										</Item.Root>
									</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 17. -->
	<DocSection title="A combobox used within a dialog">
		{#snippet blurb()}
			A combobox inside a modal dialog, with its popup rendered in place rather than portalled — so
			the dialog counts it as its own and neither its focus trap nor its dismiss layer fights it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root bind:open={demoDialogOpen}>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button {...props} class="w-full max-w-xs">Open Dialog</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-sm">
						<Dialog.Header>
							<Dialog.Title>Select Framework</Dialog.Title>
							<Dialog.Description>
								Choose your preferred framework from the list below.
							</Dialog.Description>
						</Dialog.Header>
						<Field.Field class="pt-4">
							<Field.FieldLabel for="demo-combobox-dialog" class="sr-only">
								Framework
							</Field.FieldLabel>
							<Combobox.Root items={demoFrameworks}>
								<Combobox.Input id="demo-combobox-dialog" placeholder="Select a framework" />
								<!--
									`portalDisabled`, where upstream reaches for a non-modal dialog. Base UI's
									`modal={false}` has no bits-ui counterpart, and the underlying problem is the
									portal rather than the modality: a popup appended to `<body>` is outside the
									dialog for every question the dialog asks — focus trapping, outside presses —
									so a click on an option would dismiss the dialog under it. Left in place, the
									popup is a descendant, and floating positioning is unaffected.
								-->
								<Combobox.Content portalDisabled>
									<Combobox.Empty>No items found.</Combobox.Empty>
									<Combobox.List>
										{#snippet children(item: string)}
											<Combobox.Item value={item}>{item}</Combobox.Item>
										{/snippet}
									</Combobox.List>
								</Combobox.Content>
							</Combobox.Root>
						</Field.Field>
						<Dialog.Footer class="pt-4">
							<Button variant="outline" onclick={() => (demoDialogOpen = false)}>Cancel</Button>
							<Button
								onclick={() => {
									toast("Framework selected.");
									demoDialogOpen = false;
								}}
							>
								Confirm
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 18. -->
	<DocSection title="A combobox with a custom trigger icon">
		{#snippet blurb()}
			The built-in chevron turned off and a double one put in its place, alongside the clear button.
			The two never collide: the custom trigger shows only while nothing is selected, and the clear
			only once something is.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root bind:value={demoTriggerIconValue} items={demoFrameworks}>
						<Combobox.Input placeholder="Select framework" showTrigger={false} showClear>
							{#if !demoTriggerIconValue}
								<!--
									An `InputGroupButton` in a trailing addon rather than upstream's bare primitive
									trigger, so this corner matches the one `showTrigger` would have rendered — same
									ghost, same 24px box, same `tabindex={-1}`, since the field beside it is already
									the keyboard surface.
								-->
								<InputGroupAddon align="inline-end">
									<Combobox.Trigger>
										{#snippet child({ props })}
											<InputGroupButton {...props} variant="ghost" size="icon-xs" tabindex={-1}>
												<ChevronsUpDownIcon class="pointer-events-none text-muted-foreground" />
											</InputGroupButton>
										{/snippet}
									</Combobox.Trigger>
								</InputGroupAddon>
							{/if}
						</Combobox.Input>
						<Combobox.Content>
							<Combobox.Empty>No items found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(item: string)}
									<Combobox.Item value={item}>{item}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 19. -->
	<DocSection title="A multi-select combobox with user tags">
		{#snippet blurb()}
			The multi-select chips row with a portrait in each chip, over the two-line rows the
			custom-item-rendering section above already builds — the same ten members, picked as a set
			rather than one at a time.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						multiple
						items={demoMembers}
						defaultValue={demoTagDefault}
						itemToStringValue={(member: DemoMember) => member.name}
					>
						<!-- `pl-1` only once a chip is there: an empty field keeps the input's own inset. -->
						<Combobox.Chips class="has-data-[slot=combobox-chip]:pl-1">
							<Combobox.Value>
								{#snippet children(members: DemoMember[])}
									{#each members as member (member.id)}
										<Combobox.Chip class="h-auto gap-1.5 rounded-full py-0.5 pl-1">
											<Avatar.Root size="sm">
												<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
											</Avatar.Root>
											{member.name}
										</Combobox.Chip>
									{/each}
									<Combobox.ChipsInput placeholder="Add members..." />
								{/snippet}
							</Combobox.Value>
						</Combobox.Chips>
						<Combobox.Content>
							<Combobox.Empty>No members found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(member: DemoMember)}
									<Combobox.Item value={member}>
										<Item.Root size="xs" class="p-0">
											<Item.Media>
												<Avatar.Root size="sm">
													<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
												</Avatar.Root>
											</Item.Media>
											<Item.Content>
												<Item.Title class="whitespace-nowrap">{member.name}</Item.Title>
												<Item.Description>{member.position}</Item.Description>
											</Item.Content>
										</Item.Root>
									</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 20. -->
	<DocSection title="Invisible combobox with member tags">
		{#snippet blurb()}
			The same control with its field chrome taken off: no border, no ground, no focus ring. The
			chips become the only thing drawn, which is the shape an inline "assigned to" row wants.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						multiple
						items={demoMembers}
						defaultValue={demoBareTagDefault}
						itemToStringValue={(member: DemoMember) => member.name}
					>
						<!--
							`dark:bg-transparent` is not in the source and is needed here: the container's own
							ground is `dark:bg-input/30`, which a plain `bg-transparent` does not outrank.
						-->
						<Combobox.Chips
							class="border-none bg-transparent p-0 shadow-none focus-within:ring-0 dark:bg-transparent"
						>
							<Combobox.Value>
								{#snippet children(members: DemoMember[])}
									{#each members as member (member.id)}
										<!-- Each chip now carries the outline the field gave up. -->
										<Combobox.Chip
											class="h-auto gap-1.5 rounded-full border bg-background py-0.5 pl-1 shadow-xs"
										>
											<Avatar.Root size="sm">
												<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
											</Avatar.Root>
											{member.name}
										</Combobox.Chip>
									{/each}
									<Combobox.ChipsInput placeholder="Add members..." />
								{/snippet}
							</Combobox.Value>
						</Combobox.Chips>
						<Combobox.Content>
							<Combobox.Empty>No members found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(member: DemoMember)}
									<Combobox.Item value={member}>
										<Item.Root size="xs" class="p-0">
											<Item.Media>
												<Avatar.Root size="sm">
													<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
												</Avatar.Root>
											</Item.Media>
											<Item.Content>
												<Item.Title class="whitespace-nowrap">{member.name}</Item.Title>
												<Item.Description>{member.position}</Item.Description>
											</Item.Content>
										</Item.Root>
									</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 21. -->
	<DocSection title="A status change combobox">
		{#snippet blurb()}
			The issue-tracker status picker: a select-shaped trigger, a glyph per state, and the search
			field inside the popup rather than beside it. Six rows barely need searching — what the field
			buys is that the same keyboard reaches a list of any length.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						autoHighlight
						items={demoStatuses}
						itemToStringValue={(status: DemoStatus) => status.label}
						bind:value={() => demoStatus, (next) => (demoStatus = demoOneOf(next))}
					>
						<Combobox.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="w-full justify-between font-normal">
									<Combobox.Value>
										{#snippet children(status: DemoStatus | null)}
											{#if status}
												{@render demoStatusLabel(status)}
											{:else}
												<span class="text-muted-foreground">Set status</span>
											{/if}
										{/snippet}
									</Combobox.Value>
									<ChevronDownIcon data-icon="inline-end" class="text-muted-foreground" />
								</Button>
							{/snippet}
						</Combobox.Trigger>
						<Combobox.Content>
							<Combobox.Input showTrigger={false} placeholder="Change status" />
							<Combobox.Empty>No statuses found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(status: DemoStatus)}
									<Combobox.Item value={status}>{@render demoStatusLabel(status)}</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 22. -->
	<DocSection title="A priority change combobox">
		{#snippet blurb()}
			The same shape with a scale instead of a set of states: three bars filling as the priority
			rises, and a glyph at each end for "none" and "urgent".
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						autoHighlight
						items={demoPriorities}
						itemToStringValue={(priority: DemoPriority) => priority.label}
						bind:value={() => demoPriority, (next) => (demoPriority = demoOneOf(next))}
					>
						<Combobox.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="w-full justify-between font-normal">
									<Combobox.Value>
										{#snippet children(priority: DemoPriority | null)}
											{#if priority}
												{@render demoPriorityLabel(priority)}
											{:else}
												<span class="text-muted-foreground">Set priority</span>
											{/if}
										{/snippet}
									</Combobox.Value>
									<ChevronDownIcon data-icon="inline-end" class="text-muted-foreground" />
								</Button>
							{/snippet}
						</Combobox.Trigger>
						<Combobox.Content>
							<Combobox.Input showTrigger={false} placeholder="Change priority" />
							<Combobox.Empty>No priorities found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(priority: DemoPriority)}
									<Combobox.Item value={priority}>
										{@render demoPriorityLabel(priority)}
									</Combobox.Item>
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 23. -->
	<DocSection title="A lead selection combobox">
		{#snippet blurb()}
			A "No lead" row above a labelled group of twelve people. The row and the group are two entries
			of one <code class="text-[87.5%] text-primary">items</code> array, so a search that matches neither
			takes the heading away with them.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						autoHighlight
						items={demoLeadEntries}
						itemToStringValue={(entry: DemoLeadEntry) =>
							entry.kind === "group" ? entry.value : entry.label}
						bind:value={() => demoLead, (next) => (demoLead = demoOneOf(next))}
					>
						<Combobox.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="w-full justify-between font-normal">
									<Combobox.Value>
										{#snippet children(lead: DemoLead | null)}
											{#if lead}
												{@render demoLeadLabel(lead)}
											{:else}
												<span class="text-muted-foreground">No lead</span>
											{/if}
										{/snippet}
									</Combobox.Value>
									<ChevronDownIcon data-icon="inline-end" class="text-muted-foreground" />
								</Button>
							{/snippet}
						</Combobox.Trigger>
						<Combobox.Content>
							<Combobox.Input showTrigger={false} placeholder="Select lead" />
							<Combobox.Empty>No team members found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(entry: DemoLeadEntry)}
									{#if entry.kind === "group"}
										<Combobox.Group items={entry.items}>
											<Combobox.Label>{entry.value}</Combobox.Label>
											<Combobox.Collection>
												{#snippet children(member: DemoLeadMember)}
													<Combobox.Item value={member}>{@render demoLeadRow(member)}</Combobox.Item
													>
												{/snippet}
											</Combobox.Collection>
										</Combobox.Group>
									{:else}
										<Combobox.Item value={entry}>{@render demoLeadRow(entry)}</Combobox.Item>
									{/if}
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 24. -->
	<DocSection title="A multi-member selection combobox">
		{#snippet blurb()}
			A multi-select whose trigger summarises rather than listing: four overlapping portraits and a
			count. Its first row is a command — picking "No members" empties the selection instead of
			joining it — which is why the page holds the members and the setter filters that row out.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						multiple
						autoHighlight
						items={demoMemberOptions}
						itemToStringValue={(option: DemoMemberOption) =>
							option.kind === "none" ? option.searchText : option.label}
						isItemEqualToValue={(a: DemoMemberOption, b: DemoMemberOption) => a.id === b.id}
						bind:value={() => demoSelectedMembers, onDemoMembersChange}
					>
						<Combobox.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="w-full justify-between font-normal">
									<Combobox.Value>
										{#snippet children(members: DemoTeamMate[])}
											{#if members.length === 0}
												<span class="flex min-w-0 items-center gap-2">
													<UsersIcon class="text-muted-foreground" />
													<span class="truncate">Members</span>
												</span>
											{:else}
												<span class="flex min-w-0 items-center gap-2">
													<!-- The portraits are decoration; the names are said once, for a reader
													     who cannot count faces. -->
													<span class="sr-only">
														Selected members: {members.map((member) => member.label).join(", ")}
													</span>
													<Avatar.Group>
														{#each members.slice(0, demoShownMembers) as member (member.id)}
															<Avatar.Root size="sm">
																<Avatar.Fallback>{getInitials(member.label)}</Avatar.Fallback>
															</Avatar.Root>
														{/each}
													</Avatar.Group>
													<span class="truncate">{demoMembersCount}</span>
												</span>
											{/if}
										{/snippet}
									</Combobox.Value>
									<ChevronDownIcon data-icon="inline-end" class="text-muted-foreground" />
								</Button>
							{/snippet}
						</Combobox.Trigger>
						<Combobox.Content>
							<Combobox.Input showTrigger={false} placeholder="Select members" />
							<Combobox.Empty>No members found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(option: DemoMemberOption)}
									{#if option.kind === "none"}
										<Combobox.Item value={option}>
											<span class="flex min-w-0 items-center gap-2">
												<UsersIcon class="text-muted-foreground" />
												<span class="truncate">{option.label}</span>
											</span>
										</Combobox.Item>
										<!-- Inside the snippet, so the rule leaves with the row it follows. -->
										<Combobox.Separator />
									{:else}
										<Combobox.Item value={option}>
											{@render demoMemberRow(option.label, option.isCurrentUser)}
										</Combobox.Item>
									{/if}
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 25. -->
	<DocSection title="A date selection combobox with an optional custom picker dialog">
		{#snippet blurb()}
			Five relative presets, an empty row, and a last row that is a door rather than a value: it
			opens a two-month calendar and the confirmed day comes back as the selection. The popup has no
			search field at all, so the trigger is the keyboard surface — arrows, <kbd>Enter</kbd> and
			<kbd>Escape</kbd> all work from it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						autoHighlight
						items={demoDateOptions}
						itemToStringValue={(option: DemoDateOption) => option.searchText}
						bind:value={() => demoActiveDate, onDemoDateChange}
					>
						<Combobox.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="w-full justify-between font-normal">
									<!--
										The trigger reads the PAGE's state, not the combobox's: a hand-picked date is
										not one of the rows, so `<Combobox.Value>` would have nothing to show for it.
									-->
									<span class="flex min-w-0 items-center gap-2">
										<CalendarIcon class="text-muted-foreground" />
										{#if demoStartDate}
											<span class="truncate">{demoStartDate.label}</span>
										{:else}
											<span class="truncate text-muted-foreground">Set start</span>
										{/if}
									</span>
									<ChevronDownIcon data-icon="inline-end" class="text-muted-foreground" />
								</Button>
							{/snippet}
						</Combobox.Trigger>
						<Combobox.Content>
							<Combobox.List>
								{#snippet children(option: DemoDateOption)}
									{#if option.kind === "custom"}
										<Combobox.Separator />
										<Combobox.Item value={option}>{@render demoDateRow(option)}</Combobox.Item>
									{:else if option.kind === "none"}
										<Combobox.Item value={option}>{@render demoDateRow(option)}</Combobox.Item>
										<Combobox.Separator />
									{:else}
										<Combobox.Item value={option}>{@render demoDateRow(option)}</Combobox.Item>
									{/if}
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>

					<Dialog.Root bind:open={demoDatePickerOpen}>
						<Dialog.Content class="flex w-auto flex-col gap-0 overflow-hidden sm:max-w-none">
							<Dialog.Header>
								<Dialog.Title>Pick a date</Dialog.Title>
							</Dialog.Header>
							<div class="overflow-x-auto py-3">
								<!--
									`disableDaysOutsideMonth` is the nearest lever to the source's
									`showOutsideDays={false}`: bits-ui dims and disables the neighbouring month's
									days where react-day-picker blanks them, and the Calendar page uses the same
									prop for the same intent.
								-->
								<Calendar
									type="single"
									bind:value={demoDateDraft}
									placeholder={demoDateDraft ?? demoToday}
									numberOfMonths={2}
									pagedNavigation
									disableDaysOutsideMonth
								/>
							</div>
							<Dialog.Footer>
								<Dialog.Close>
									{#snippet child({ props })}
										<Button {...props} variant="outline" size="sm">Dismiss</Button>
									{/snippet}
								</Dialog.Close>
								<Button size="sm" disabled={!demoDateDraft} onclick={onDemoDateConfirm}>
									Confirm
								</Button>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 26. -->
	<DocSection title="A multi-label selection combobox with a no-label mode">
		{#snippet blurb()}
			Labels, summarised three ways: nothing selected shows a tag and a prompt, one shows its dot
			and its name, several show a row of dots and a count.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						multiple
						autoHighlight
						items={demoLabelOptions}
						itemToStringValue={(option: DemoLabelOption) => option.searchText}
						isItemEqualToValue={(a: DemoLabelOption, b: DemoLabelOption) => a.id === b.id}
						bind:value={() => demoSelectedLabels, onDemoLabelsChange}
					>
						<Combobox.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="w-full justify-between font-normal">
									<Combobox.Value>
										{#snippet children(labels: DemoLabel[])}
											{#if labels.length === 0}
												<span class="flex min-w-0 items-center gap-2">
													<TagIcon class="text-muted-foreground" />
													<span class="truncate text-muted-foreground">Add label</span>
												</span>
											{:else if labels.length === 1}
												<span class="flex min-w-0 items-center gap-2">
													{@render demoLabelDot(labels[0])}
													<span class="truncate">{labels[0].label}</span>
												</span>
											{:else}
												<span class="flex min-w-0 items-center gap-1">
													<span class="sr-only">
														Selected labels: {labels.map((label) => label.label).join(", ")}
													</span>
													{#each labels.slice(0, demoShownLabels) as label (label.id)}
														{@render demoLabelDot(label)}
													{/each}
													{#if labels.length > demoShownLabels}
														<span class="ml-0.5 text-xs text-muted-foreground tabular-nums">
															+{labels.length - demoShownLabels}
														</span>
													{/if}
												</span>
											{/if}
										{/snippet}
									</Combobox.Value>
									<ChevronDownIcon data-icon="inline-end" class="text-muted-foreground" />
								</Button>
							{/snippet}
						</Combobox.Trigger>
						<Combobox.Content>
							<Combobox.Input showTrigger={false} placeholder="Select labels" />
							<Combobox.Empty>No labels found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(option: DemoLabelOption)}
									{#if option.kind === "none"}
										<Combobox.Item value={option}>{@render demoLabelRow(option)}</Combobox.Item>
										<Combobox.Separator />
									{:else}
										<Combobox.Item value={option}>{@render demoLabelRow(option)}</Combobox.Item>
									{/if}
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 27. -->
	<DocSection title="A team selection combobox">
		{#snippet blurb()}
			One mark and one colour per team, and a "No team" row that reads as a value rather than as an
			empty field — the trigger always has something to say.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						autoHighlight
						items={demoTeamOptions}
						itemToStringValue={(option: DemoTeamOption) => option.searchText}
						bind:value={() => demoSelectedTeam, onDemoTeamChange}
					>
						<Combobox.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="w-full justify-between font-normal">
									<Combobox.Value>
										{#snippet children(option: DemoTeamOption | null)}
											{#if option}
												{@render demoTeamLabel(option)}
											{:else}
												<span class="truncate text-muted-foreground">Select team</span>
											{/if}
										{/snippet}
									</Combobox.Value>
									<ChevronDownIcon data-icon="inline-end" class="text-muted-foreground" />
								</Button>
							{/snippet}
						</Combobox.Trigger>
						<Combobox.Content>
							<Combobox.Input showTrigger={false} placeholder="Select team" />
							<Combobox.Empty>No teams found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(option: DemoTeamOption)}
									{#if option.kind === "none"}
										<Combobox.Item value={option}>{@render demoTeamLabel(option)}</Combobox.Item>
										<Combobox.Separator />
									{:else}
										<Combobox.Item value={option}>{@render demoTeamLabel(option)}</Combobox.Item>
									{/if}
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 28. -->
	<DocSection title="An assignee selection combobox">
		{#snippet blurb()}
			The fullest of the ten: an empty row, a group of people, and a second group holding one
			action. "Invite…" is not a value — the binding's setter declines that write, so the field
			keeps the assignee it had while the action runs.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Combobox.Root
						autoHighlight
						items={demoAssigneeEntries}
						itemToStringValue={(entry: DemoAssigneeEntry) =>
							entry.kind === "group" ? entry.value : entry.searchText}
						bind:value={() => demoSelectedAssignee, onDemoAssigneeChange}
					>
						<Combobox.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" class="w-full justify-between font-normal">
									<Combobox.Value>
										{#snippet children(option: DemoNoAssignee | DemoAssignee | null)}
											{#if option}
												{@render demoAssigneeLabel(option)}
											{:else}
												<span class="truncate text-muted-foreground">No assignee</span>
											{/if}
										{/snippet}
									</Combobox.Value>
									<ChevronDownIcon data-icon="inline-end" class="text-muted-foreground" />
								</Button>
							{/snippet}
						</Combobox.Trigger>
						<Combobox.Content>
							<Combobox.Input showTrigger={false} placeholder="Select assignee" />
							<Combobox.Empty>No assignees found.</Combobox.Empty>
							<Combobox.List>
								{#snippet children(entry: DemoAssigneeEntry)}
									{#if entry.kind === "group"}
										<!-- The rule belongs to the group it precedes, so both leave together. -->
										<Combobox.Separator />
										<Combobox.Group items={entry.items}>
											<Combobox.Label>{entry.value}</Combobox.Label>
											<Combobox.Collection>
												{#snippet children(option: DemoAssigneeOption)}
													<Combobox.Item value={option}>
														{@render demoAssigneeRow(option)}
													</Combobox.Item>
												{/snippet}
											</Combobox.Collection>
										</Combobox.Group>
									{:else}
										<Combobox.Item value={entry}>{@render demoAssigneeRow(entry)}</Combobox.Item>
									{/if}
								{/snippet}
							</Combobox.List>
						</Combobox.Content>
					</Combobox.Root>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
