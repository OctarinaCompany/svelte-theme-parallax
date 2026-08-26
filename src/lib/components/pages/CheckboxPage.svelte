<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import { IconTile } from "$lib/components/ui/icon-tile/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { cn } from "$lib/utils.js";
	import AppleIcon from "@lucide/svelte/icons/apple";
	import ChartNoAxesColumnDecreasingIcon from "@lucide/svelte/icons/chart-no-axes-column-decreasing";
	import ChartPieIcon from "@lucide/svelte/icons/chart-pie";
	import CherryIcon from "@lucide/svelte/icons/cherry";
	import CircleIcon from "@lucide/svelte/icons/circle";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import CircleDollarSignIcon from "@lucide/svelte/icons/circle-dollar-sign";
	import CircleQuestionMarkIcon from "@lucide/svelte/icons/circle-question-mark";
	import CodeIcon from "@lucide/svelte/icons/code";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import GrapeIcon from "@lucide/svelte/icons/grape";
	import HeartIcon from "@lucide/svelte/icons/heart";
	import PaletteIcon from "@lucide/svelte/icons/palette";
	import StarIcon from "@lucide/svelte/icons/star";
	import type { LucideIcon } from "@lucide/svelte";
	import { SvelteSet } from "svelte/reactivity";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Checkbox component page, from TWO upstreams.
	 *
	 * The four sections it opens with come from shadcn-svelte's documentation
	 * (https://shadcn-svelte.com/docs/components/checkbox). That page carries a single preview
	 * holding four rows — a bare checkbox, one with a description under its label, a disabled one,
	 * and one wrapped in a bordered, selectable block — plus the Usage snippet. Each row is a
	 * section here.
	 *
	 * The sixteen after them come from the gallery
	 * — its nineteen demos, in the source's order,
	 * under the names its own demo components carry, minus three. `checkbox-01` and `checkbox-07`
	 * are the first two sections above, line for line; `checkbox-13` is a pair of the fourth. They
	 * are not repeated.
	 *
	 * WHAT A SECOND UPSTREAM CHANGES, AND WHAT IT DOES NOT. The gallery is a shadcn/ui component
	 * set: its demos are composed from the same Checkbox, Label, Badge, Button and Card this
	 * repository already has, against the same token names, so the theme is mostly a React-to-runes
	 * translation. Radix's `<CheckboxPrimitive.Root>` becomes bits-ui's, `useState` becomes `$state`
	 * or a `SvelteSet`, and `motion/react` becomes CSS — the repository carries no motion library
	 * and never has. What is left is the theme work, which is all in one place: the classic theme has strong
	 * opinions about a checkbox and almost none about the sixteen things these demos do with it.
	 *
	 * THE CLASSIC THEME HAS NO "CHECKBOX" SECTION OF ITS OWN. The reference docs document the
	 * control twice, always as the classic framework markup: inside the Forms section (validation example) and
	 * as the engine of the theme-specific `.checklist` component. What it does have is a heavy restyle
	 * of the input itself, in the reference stylesheet and the `form-check-*` block of
	 * the reference stylesheet:
	 *
	 *   size     `form-check-size: 1rem`. ALREADY EQUAL — shadcn's `size-4`
	 *   border   `form-check-input-border: transparent`, which Sass compiles to the
	 *            shorthand `border: transparent`, i.e. `border-style: none` — no border at
	 *            all, where shadcn draws 1px of `--input`
	 *   radius   `form-check-input-border-radius: var(--bs-border-radius)` = 6px, against
	 *            shadcn's hard-coded `rounded-[4px]`
	 *   fill     `form-check-input-bg: var(--bs-gray-300)` — the unchecked box is a solid
	 *            grey chip, not an empty outline. In `app.css`, for the reason below
	 *   tick     `form-check-input-checked-bg-size: 75% 75%` (the reference stylesheet),
	 *            i.e. 12px inside the 16px box, drawn at `stroke-width: 3` on a 20-unit
	 *            viewBox. Also in `app.css`
	 *   checked  `form-check-input-checked-bg-color: component-active-bg` = `primary`,
	 *            with `form-check-input-checked-color: white`. ALREADY EQUAL — the
	 *            component's own `data-checked:bg-primary data-checked:text-primary-foreground`
	 *   shadow   neither the classic framework nor the classic theme puts a `box-shadow` on the input; shadcn
	 *            adds `shadow-xs`
	 *
	 * THREE OF THOSE COULD NOT BE CALL-SITE CLASSES, and sit in `app.css` beside the switch block
	 * instead — same argument, same resolution:
	 *
	 *   the fill  a bare `bg-secondary` written here loses to the component's own
	 *             `dark:bg-input/30`, since `dark:` compiles to `.dark &` and outranks a
	 *             plain class. Restating it as `dark:bg-secondary` then outranks
	 *             `data-checked:bg-primary`, whose variant is a zero-specificity
	 *             `:where([data-state="checked"])`, so the CHECKED box goes grey in dark mode.
	 *             An unlayered rule keyed on `[data-state='unchecked']` has neither problem
	 *   the tick  the indicator is an inner element with no `class` prop. A descendant
	 *             selector written on the root (`[&_svg]:size-3`) ties on specificity with
	 *             the indicator's own `[&>svg]:size-3.5` and loses on source order —
	 *             Tailwind emits the two in that order
	 *   the dash  the indeterminate ground, added for `Indeterminate` and `Tree` below. It ties
	 *             with `dark:bg-input/30` exactly as the fill does, and it was missing before
	 *             those sections asked for it: the Data table's header checkbox and the Payments
	 *             card have been drawing a bare dash on no ground at all
	 *
	 * NOT PORTED: the focus state. The classic theme sets `form-check-input-focus-box-shadow: none` and
	 * `form-check-input-focus-border: transparent`, and shows focus by lighting the unchecked
	 * background to `lighten(primary, 35%)` — #CBDEF9 in the compiled bundle, a colour no token in
	 * this app holds (`--primary-subtle` is #D5E5FA, a neighbour). Dropping the ring for a tint this
	 * app cannot mix would leave a borderless box with no focus affordance at all, so shadcn's ring
	 * stays — the same call `RadioGroupPage.svelte` makes, in the same words, against the same two
	 * variables. The `app.css` block now says that correctly: its `box-shadow: none` is scoped away
	 * from `:focus-visible`, where before it silenced the ring it was written to keep.
	 *
	 * NO COUNTERPART AT ALL: the fourth row, a bordered block that highlights when its checkbox is
	 * checked. The classic framework has no such component and the classic theme adds none; the nearest thing is a
	 * `.list-group-item`, which is a different object. Its geometry is therefore left at shadcn's,
	 * and only its colours are mapped to the classic theme tokens.
	 *
	 * FOUR DELIBERATE DIVERGENCES ACROSS THE GALLERY RUN, each also stated where it happens:
	 *
	 * 1. NO RAW PALETTE COLOURS. `Colors` asks for `sky-600` and `green-600`, `Custom icons` for
	 *    `amber-500` and `green-600`, `Card` for `blue-50`/`blue-950` and `Animated todo list` for
	 *    `blue-500`. §12 of the theme notes declines to port the Tailwind palette for exactly this
	 *    reason, and the house rule forbids reaching for it anyway; every one of
	 *    them has a classic role: `danger`, `info` (a cyan, the nearest thing the classic theme has to sky),
	 *    `success`, `warning`, and `primary` — which IS #2C7BE5, so the blues collapse onto the
	 *    ordinary token and need no override at all.
	 *
	 * 2. TWO DEMOS DROP `data-slot="checkbox"`, and that is the fix rather than a workaround. The
	 *    rules above are keyed on it and on the indicator's slot beneath it, so an element that
	 *    carries the attribute IS a `.form-check-input` and gets the grey chip, the 6px radius and
	 *    the 12px tick. `Custom
	 *    icons` is a heart, and `Filled icon` is a coloured disc; neither is that control, so
	 *    neither claims the attribute, and neither needs a single override. `Animated` splits the
	 *    two slots — it keeps the root's, because it IS the classic box, and omits the indicator's,
	 *    because its tick is a drawn path rather than a Lucide glyph.
	 *
	 * 3. TWO IMPORTANT UTILITIES. `Dashed` needs a border where the theme deleted one and `Animated
	 *    todo list` needs a circle where the theme fixed the radius; both properties are set by an
	 *    unlayered rule, which no ordinary utility can outrank at any specificity. Importance is
	 *    the only lever left in a class string, and both are cheaper than parameterising a global
	 *    for one demo. `ListGroupPage.svelte` reaches for the same lever against the same kind of
	 *    rule, and `ButtonGroupPage`, `CommandPage` and `KbdPage` all carry one.
	 *
	 * 4. THE ANIMATIONS ARE CSS. `Animated`, `Animated todo list` and `Confetti` use `motion/react`
	 *    upstream — a path-draw, a `whileHover`/`whileTap` scale, and twelve particles thrown at
	 *    random angles. All three are keyframes in this page's own style block, the shape
	 *    `CheckboxGroupPage.svelte` already uses for the same reason: a `@keyframes` rule is not a
	 *    utility, and a page-local animation does not belong in the global stylesheet. The classic theme has
	 *    no counterpart to any of them — `.form-check-input` carries no `transition` at all, and
	 *    the only motion the theme authors on an interactive element is `.lift`, a 3px translate
	 *    over 250ms — so what they borrow from it is the easing and the fact that it translates
	 *    rather than scales.
	 */

	/* ---------------------------------------------------------------------------------------
	 * Shared recipes
	 * ------------------------------------------------------------------------------------ */

	/**
	 * The control's box — radius, border and shadow — is stated once in `app.css`, on
	 * `[data-slot='checkbox']`, so every checkbox in the app wears `.form-check-input` and not
	 * just the ones on this page. What stays here is the single behavioural half:
	 *
	 *   disabled:pointer-events-none  the compiled rule is
	 *                                 `.form-check-input:disabled{filter:none;opacity:.5;pointer-events:none}`.
	 *                                 The 50% is shadcn's `disabled:opacity-50` already; the
	 *                                 `pointer-events` half is what keeps shadcn's
	 *                                 `disabled:cursor-not-allowed` from ever being reached,
	 *                                 which is the classic behaviour — a disabled control
	 *                                 shows whatever cursor lies under it
	 */
	const control = "disabled:pointer-events-none";

	/**
	 * The same control on a row whose label runs to more than one line.
	 *
	 * `.form-check` floats a bare `<input>` out of a `padding-left`, so the box sits on the
	 * first text line rather than at the top of the block; the reference stylesheet states the
	 * offset as `margin-top: calc((#{line-height-base} * 1em - 1rem) / 2)`, which compiles to
	 * `calc(.75em - .5rem)` and is transcribed verbatim here. `em` resolves against the
	 * checkbox's own font size, and Tailwind's preflight gives a `<button>` `font: inherit` — so
	 * every row using this class also carries `text-sm`, which is `font-size-base`, the size
	 * `.form-check-input` inherits from the body in the classic framework.
	 */
	const controlTopAligned = `${control} mt-[calc(0.75em-0.5rem)]`;

	/**
	 * The label beside the control — the classic `.form-check-label`.
	 *
	 *   cursor-pointer          `form-check-label-cursor: pointer` (the reference stylesheet;
	 *                           The classic framework leaves that variable `null`). Tailwind v4 ships no
	 *                           `cursor` default and the reboot rule in `app.css` covers only
	 *                           buttons, which a `<label>` is not
	 *   font-normal             `.form-check-label` sets nothing but the cursor, so it
	 *                           inherits `font-weight-base` (400) where shadcn's Label asks
	 *                           for `font-medium`
	 *   leading-normal          same reasoning one property along: no `line-height` is
	 *                           declared, so the label inherits `line-height-base: 1.5`
	 *                           against shadcn's `leading-none`. It is also what makes the
	 *                           offset above correct — that formula centres a 16px box
	 *                           against a 1.5em line box
	 *   peer-disabled:cursor-default  `.form-check-input:disabled~.form-check-label` compiles
	 *                           to `cursor:default;opacity:.5`. The 50% is shadcn's already;
	 *                           the cursor is `not-allowed` there
	 */
	const checkLabel = "cursor-pointer font-normal leading-normal peer-disabled:cursor-default";

	/**
	 * The help line under a label — the classic `.form-text`, which the reference stylesheet
	 * extends. Compiled, it is `color: var(--bs-secondary-color); font-size: .8125rem;
	 * margin-top: 0`:
	 *
	 *   text-xs               `form-text-font-size: font-size-sm` = 0.8125rem, which
	 *                         `--text-xs` holds exactly; shadcn's examples use `text-sm`
	 *   text-muted-foreground `secondary-color` is `gray-600` in light and `gray-700` in
	 *                         dark — `--muted-foreground` in both, exactly
	 *
	 * `form-text-margin-top: 0` is a classic override of the classic `.25rem`, so the line
	 * sits flush under the label and the rows below use no gap.
	 */
	const helpText = "text-xs text-muted-foreground";

	/**
	 * One row of a stack of choices — the shape both group demos below repeat.
	 *
	 * `min-h-[1.40625rem]` is the compiled `.form-check{min-height:1.40625rem}`, which is
	 * `font-size-base * line-height-base`: the height a row keeps even when its label is empty,
	 * and what makes the 2px gap between stacked rows read as a rhythm rather than a collision.
	 * The 0.5rem between box and text is `form-check-padding-start` (1.5rem) less
	 * `form-check-size` (1rem), the same arithmetic the lead example's comment sets out.
	 */
	const checkRow = "flex min-h-[1.40625rem] items-center gap-2";

	/**
	 * The selectable block of the fourth row. shadcn hard-codes `blue-600` / `blue-50` for
	 * the checked state because its own `--primary` is a neutral; the classic theme's `primary` IS
	 * that blue (#2C7BE5 = `blue`), so the accent collapses onto the ordinary tokens and
	 * the checkbox inside needs no colour override of its own at all.
	 *
	 *   border                `list-group-border-color: var(--bs-gray-200)` — `--border`
	 *   hover:bg-accent       `--bs-list-group-action-hover-bg` compiles to `--bs-tertiary-bg`
	 *                         (#F9FBFD) in light and the classic theme overrides it to
	 *                         `list-group-hover-bg-dark: gray-900-dark` (#132A46) in dark;
	 *                         `--accent` is both, exactly. shadcn asks for half of it
	 *   bg-primary-subtle     `primary-bg-subtle` / `primary-bg-subtle-dark`, the ground of
	 *                         `.text-bg-primary-subtle`, which is how the classic theme marks a
	 *                         selected row. Both modes are tokens here, so unlike shadcn's
	 *                         version this needs no `dark:` override
	 *
	 * `rounded-lg` and `p-3` are shadcn's own: `--radius-lg` is `border-radius-lg` (8px), and
	 * the classic theme has no padding to quote for a block that does not exist in it.
	 */
	const choiceCard =
		"items-start gap-2 rounded-lg border p-3 font-normal hover:bg-accent has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-primary-subtle";

	let terms = $state(false);
	let policy = $state(true);
	let notifications = $state(true);

	/* ---------------------------------------------------------------------------------------
	 * the gallery, in the source's order
	 * ------------------------------------------------------------------------------------ */

	/* --- #02 Indeterminate ------------------------------------------------------------------ */

	/**
	 * Two runes rather than one tri-state value. Radix models the three states as a single
	 * `CheckedState`; bits-ui splits them, and clears `indeterminate` itself inside its own toggle:
	 * `if (indeterminate) { indeterminate = false; checked = true }`. Upstream leaves it there, so
	 * its box goes mixed → checked → unchecked and never returns — which is also what a native
	 * `<input type="checkbox">` does, since the DOM drops the flag on click and only script puts it
	 * back.
	 *
	 * THE CYCLE IS THREE-WAY HERE, and that is a deliberate divergence. A section named after a
	 * state that can only be seen until the first click has stopped documenting itself; `Tree`
	 * below recovers the state because it derives it from its children, and this box has no
	 * children to derive from, so it says so directly instead.
	 *
	 * Written with the getter/setter form of `bind:`, as `Tree` is, so the page stays the one
	 * authority on which state the box is in. The empty indeterminate setter is what makes it work:
	 * bits-ui writes `indeterminate` false and `checked` true on its way out of the mixed state,
	 * and dropping the first of those means the second arrives while {@link mixed} still reads
	 * true — so {@link cycleMixed} can tell "leaving mixed" from "was already unchecked".
	 */
	let mixed = $state(true);
	let mixedChecked = $state(false);

	function cycleMixed() {
		if (mixed) {
			mixed = false;
			mixedChecked = true;
		} else if (mixedChecked) {
			mixedChecked = false;
		} else {
			mixed = true;
		}
	}

	/* --- #03 Dashed ------------------------------------------------------------------------- */

	let dashed = $state(false);

	/* --- #04 Todo list ---------------------------------------------------------------------- */

	let todo = $state(true);

	/* --- #05 Sizes -------------------------------------------------------------------------- */

	/**
	 * The classic theme has no size scale for a checkbox — no `.form-check-sm`, no `.form-check-lg`, only
	 * `form-check-size: 1rem` and the 1.375rem of `.form-check-circle`. What it does have is the
	 * RULE the sizes have to obey: the tick is `75% 75%` of the box, so the two resized boxes
	 * restate it through `--checkbox-tick` rather than letting the 12px default ride up to 50% of a
	 * 24px box. The default one restates nothing, because 12px already IS 75% of 16px.
	 *
	 * `Size medium` is upstream's `Size small`, renamed. The source's three labels read default /
	 * small / large over boxes of 16, 20 and 24px, so "small" names the middle one — an accessible
	 * name a screen reader hands over as fact, and not worth reproducing.
	 */
	const SIZES = [
		{ id: "size-default", label: "Size default", class: "" },
		{ id: "size-medium", label: "Size medium", class: "size-5 [--checkbox-tick:0.9375rem]" },
		{ id: "size-large", label: "Size large", class: "size-6 [--checkbox-tick:1.125rem]" },
	];

	const checkedSizes = new SvelteSet(SIZES.map((entry) => entry.id));

	/* --- #06 Badge -------------------------------------------------------------------------- */

	const SNACKS = ["Burger", "Pizza", "Drinks"];

	const selectedSnacks = new SvelteSet(["Burger", "Pizza"]);

	/* --- #08 Horizontal group --------------------------------------------------------------- */

	const TECHNOLOGIES = [
		{ id: "tech-react", label: "React" },
		{ id: "tech-next", label: "Next.js" },
		{ id: "tech-remix", label: "Remix" },
	];

	const selectedTechnologies = new SvelteSet<string>();

	/* --- #09 Vertical group ----------------------------------------------------------------- */

	const FRUITS: { id: string; label: string; icon: LucideIcon }[] = [
		{ id: "fruit-apple", label: "Apple", icon: AppleIcon },
		{ id: "fruit-cherry", label: "Cherry", icon: CherryIcon },
		{ id: "fruit-grape", label: "Grape", icon: GrapeIcon },
	];

	const selectedFruits = new SvelteSet<string>();

	/* --- #10 Colors ------------------------------------------------------------------------- */

	/**
	 * The classic theme recolours a checkbox for exactly one reason — validity: `is-valid` paints it
	 * `--bs-form-valid-color` (#00D97E = `success`) and `is-invalid` paints it
	 * `--bs-form-invalid-color` (#E63757 = `danger`). Decorative colour has no counterpart, so
	 * the three here are the three the classic theme roles nearest the source's red, sky and green.
	 *
	 * Written out per entry rather than built from the token name: Tailwind scans the source for
	 * complete class names, and an interpolated `data-[state=checked]:bg-${role}` would never be
	 * generated — the rule `ToggleGroupPage.svelte` records for the same reason.
	 *
	 * Both halves are restated. The ground has to be, since the component ships
	 * `data-checked:bg-primary`; the tick does too, because `data-checked:text-primary-foreground`
	 * is only white on the palettes where `--primary-foreground` happens to be, and a dozen other
	 * palettes ship with this one.
	 *
	 * AND THE GROUND IS RESTATED TWICE, which is mistakes #1 and #2 of §16 arriving together. The
	 * component pins the checked colour a second time as `dark:data-checked:bg-primary`, and that
	 * compiles to `.dark .cls:where([data-state=checked])` — the same (0,2,0) a bare
	 * `data-[state=checked]:bg-destructive` reaches, so in DARK MODE the two tie and Tailwind's
	 * sort order picks the winner. It picked blue. The `dark:` half adds the third class and
	 * settles it; light mode never needed one, since the plain `data-checked:` variant is a
	 * zero-specificity `:where()`.
	 */
	const COLOURS = [
		{
			id: "colour-destructive",
			label: "Color destructive",
			class:
				"data-[state=checked]:bg-destructive dark:data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground focus-visible:ring-destructive/50",
		},
		{
			id: "colour-info",
			label: "Color info",
			class:
				"data-[state=checked]:bg-info dark:data-[state=checked]:bg-info data-[state=checked]:text-info-foreground focus-visible:ring-info/50",
		},
		{
			id: "colour-success",
			label: "Color success",
			class:
				"data-[state=checked]:bg-success dark:data-[state=checked]:bg-success data-[state=checked]:text-success-foreground focus-visible:ring-success/50",
		},
	];

	const checkedColours = new SvelteSet(COLOURS.map((entry) => entry.id));

	/**
	 * The row shared by `Sizes`, `Colors` and `Filled icon` — three unlabelled boxes side by side,
	 * which is the one arrangement this repository's Checkbox is not built for. It carries
	 * `after:-inset-x-3` as a hit-area expander, 12px of invisible target on each side, and
	 * upstream's `gap-2` is 8px — so each box's slop covers its neighbour and the LAST one wins,
	 * every click landing on the wrong control.
	 *
	 * `after:inset-x-0` takes the horizontal half back and leaves the vertical, which nothing here
	 * is adjacent to. The gap stays upstream's; a box a pointer can hit is worth more than 12px of
	 * slop it cannot use.
	 */
	const bareRowControl = `${control} after:inset-x-0`;

	/* --- #11 Custom icons ------------------------------------------------------------------- */

	/**
	 * The box a checkbox wears when it is not a box. No `data-slot='checkbox'` — see divergence 2
	 * in the header — so none of the three `app.css` rules match and nothing has to be undone.
	 * What the component's own class list would have supplied and this has to restate is the focus
	 * ring and the disabled fade; `cursor: pointer` arrives free, from the reboot rule in `app.css`
	 * that gives every enabled `<button>` the classic theme's hand.
	 *
	 * `rounded-sm` is `border-radius-sm`, and exists only to shape that ring — there is no ground
	 * for it to round.
	 */
	const iconBox =
		"rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

	let heart = $state(true);
	let star = $state(true);
	let circle = $state(true);

	/* --- #12 Filled icon -------------------------------------------------------------------- */

	/**
	 * The classic theme's own circular checkbox is `.form-check-circle`: a 1.375rem disc
	 * (`form-check-circle-indicator-size`) at `border-radius: 50%`, showing a 12×9px white tick
	 * that it draws even when unchecked, so an untouched one reads as a grey disc with a ghost
	 * mark. It is undocumented — no hit in the reference docs — and appears on two pages
	 * only, `crm-companies.html` and `crm-contacts.html`, as the selection control on a card.
	 *
	 * That is a selection control, and these are status discs, so the geometry stays the source's:
	 * a 28px disc carrying a 22px glyph. Worth noting only because 22px IS
	 * `form-check-circle-indicator-size` — the source's glyph is the size of the classic theme's whole
	 * control.
	 *
	 * No `data-slot='checkbox'`, for the same reason `Custom icons` drops it, and here it would
	 * cost three overrides rather than one: the unchecked disc would be repainted `--secondary`,
	 * `rounded-full` would lose to the 6px radius, and the glyph would be crushed to 12px.
	 */
	const DISCS = [
		{
			id: "disc-destructive",
			label: "Color destructive",
			ground: "bg-destructive focus-visible:ring-destructive/50",
			glyph: "fill-destructive-foreground stroke-destructive",
		},
		{
			id: "disc-info",
			label: "Color info",
			ground: "bg-info focus-visible:ring-info/50",
			glyph: "fill-info-foreground stroke-info",
		},
		{
			id: "disc-success",
			label: "Color success",
			ground: "bg-success focus-visible:ring-success/50",
			glyph: "fill-success-foreground stroke-success",
		},
	];

	/**
	 * `flex items-center justify-center` is not decoration either. A bare
	 * `CheckboxPrimitive.Root` is a `<button>`, and a button centres its content by the UA's
	 * `text-align: center` — which centres the glyph's INLINE BOX, not the glyph. The repository's
	 * own Checkbox states the same three classes for the same reason.
	 */
	const statusDisc =
		"flex size-7 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3";

	const checkedDiscs = new SvelteSet(DISCS.map((entry) => entry.id));

	/* --- #14 List group --------------------------------------------------------------------- */

	const SKILLS: { id: string; label: string; icon: LucideIcon }[] = [
		{ id: "skill-web", label: "Web Development", icon: CodeIcon },
		{ id: "skill-data", label: "Data Analysis", icon: ChartPieIcon },
		{ id: "skill-design", label: "Graphic Design", icon: PaletteIcon },
	];

	const selectedSkills = new SvelteSet<string>();

	/* --- #15 Tree --------------------------------------------------------------------------- */

	const TREE_ITEMS = [
		{ id: "tree-child-1", label: "Child 1" },
		{ id: "tree-child-2", label: "Child 2" },
		{ id: "tree-child-3", label: "Child 3" },
	];

	const selectedChildren = new SvelteSet(["tree-child-1", "tree-child-2"]);

	const allChildren = $derived(selectedChildren.size === TREE_ITEMS.length);
	const someChildren = $derived(selectedChildren.size > 0 && !allChildren);

	function setAllChildren(next: boolean) {
		selectedChildren.clear();
		if (next) for (const item of TREE_ITEMS) selectedChildren.add(item.id);
	}

	/* --- #16 Form --------------------------------------------------------------------------- */

	let formTerms = $state(true);

	/* --- #17 Animated ----------------------------------------------------------------------- */

	let animated = $state(true);

	/* --- #18 Animated todo list ------------------------------------------------------------- */

	let animatedTodo = $state(true);

	/* --- #19 Confetti ----------------------------------------------------------------------- */

	/**
	 * The five status colours, and the reason there are five rather than the source's six: on this
	 * palette they are the tokens the classic theme carries unchanged into dark mode, so the burst reads the
	 * same on a white card and a navy one. Every `-subtle` partner inverts, and a piece painted
	 * #143767 would be invisible against the dark card it lands on. The generated palettes
	 * do move their status hues between modes, but they move them to another saturated colour, so
	 * the argument that survives everywhere is the weaker one: a `-subtle` token is a ground, and a
	 * ground makes a poor 4px dot.
	 */
	const CONFETTI_COLOURS = ["--primary", "--success", "--warning", "--info", "--destructive"];

	type Particle = { x: number; y: number; delay: number; colour: string };

	/**
	 * Upstream's `particleAnimation`, unchanged in its numbers: a random angle over the full
	 * circle, 30–50px of travel, and 50ms of stagger per piece. `Math.random()` is safe here
	 * because the array is built inside the click handler — the caveat `DataGridPage.svelte`
	 * records applies to values generated at module scope, which would have to survive hydration.
	 */
	function makeParticles(): Particle[] {
		return Array.from({ length: 12 }, (_, index) => {
			const angle = Math.random() * Math.PI * 2;
			const distance = 30 + Math.random() * 20;

			return {
				x: Math.cos(angle) * distance,
				y: Math.sin(angle) * distance,
				delay: index * 50,
				colour: CONFETTI_COLOURS[index % CONFETTI_COLOURS.length],
			};
		});
	}

	let confetti = $state(false);
	let particles = $state<Particle[]>([]);
	let burst = $state(0);

	function onConfettiChange(checked: boolean) {
		if (!checked) return;

		particles = makeParticles();
		burst += 1;

		/*
		 * 1000ms, not upstream's 800. The last piece starts at `11 * 50ms` and runs for 400ms, so
		 * 800 clears the layer while three pieces are still in the air.
		 */
		const thisBurst = burst;
		setTimeout(() => {
			if (burst === thisBurst) particles = [];
		}, 1000);
	}

	/* ---------------------------------------------------------------------------------------
	 * The pattern appendix, in its documented order
	 * ------------------------------------------------------------------------------------ */

	/**
	 * A THIRD DEMO SET, and the shortest run of the three. The set documents twenty-two checkbox
	 * demos, and most of them are arrangements this
	 * page already carries under another name: a basic row, a disabled one, an indeterminate one,
	 * a colour ramp, a round box with a struck label, a labelled stack, a selectable card, a
	 * divided list of rows. Those are not repeated. What follows is the eight that were missing.
	 *
	 * WHAT THE THIRD SET CHANGES. These demos build out of `Field` rather than a bare
	 * `Label`, and this repository ships that component, so the sections below use it — a
	 * `Field` is the row, a `FieldLabel` is the clickable block (it already carries the
	 * `has-data-checked:` tint and the `has-[>[data-slot=field]]:` card border these demos rely
	 * on), and a `FieldTitle` is a line inside one. The classic half is unchanged: every control
	 * still takes {@link control}, every label sitting beside a box still takes
	 * {@link checkLabel}, and the two unlayered `app.css` rules that pin `border-width` and
	 * `border-radius` still have to be answered with an important utility wherever a demo asks
	 * for a round box — the same lever `Dashed` and `Animated todo list` above reach for.
	 *
	 * AND EVERY `size-5` CORNER CHECKBOX RESTATES `--checkbox-tick` at 0.9375rem, for the reason
	 * the `Sizes` section sets out: the tick is a RATIO of the box in the classic theme
	 * (`form-check-input-checked-bg-size: 75% 75%`), and the 12px default left alone in a 20px
	 * box is 60% of it.
	 */

	/* --- demo 10, "Checkbox group in a frame" ------------------------------------- */

	const FRAME_NOTIFICATIONS = [
		{ id: "frame-push", label: "Push notifications" },
		{ id: "frame-email", label: "Email notifications" },
		{ id: "frame-sms", label: "SMS notifications" },
	];

	const frameNotifications = new SvelteSet(["frame-push"]);

	/* --- demo 13, "Custom positioned checkbox" ------------------------------------ */

	const POSITIONED_CHIPS = [
		{ id: "chip-billings", label: "Billings" },
		{ id: "chip-payments", label: "Payments" },
		{ id: "chip-invoices", label: "Invoices" },
	];

	const positionedChips = new SvelteSet(["chip-billings"]);

	/**
	 * The corner control, shared by the three demos that pin one to a block: 20px, round, and
	 * lifted out of the flow.
	 *
	 * `rounded-full!` is the lever the page's header records — `app.css` pins `border-radius` to
	 * `form-check-input-border-radius` from an unlayered rule, which no ordinary utility outranks
	 * at any specificity. Upstream's `border-none shadow-none` are dropped rather than ported:
	 * The classic theme already deletes both, in the same rule and the one under it.
	 */
	const cornerControl = `${control} absolute size-5 rounded-full! [--checkbox-tick:0.9375rem]`;

	/* --- demo 14, "Custom positioned checkbox" ------------------------------------ */

	const POSITIONED_CARDS: {
		id: string;
		title: string;
		description: string;
		icon: LucideIcon;
	}[] = [
		{
			id: "card-payments",
			title: "Payments",
			description: "Receive payments from your customers",
			icon: CircleDollarSignIcon,
		},
		{
			id: "card-invoices",
			title: "Invoices",
			description: "Create and send invoices to your customers",
			icon: FileTextIcon,
		},
		{
			id: "card-billing",
			title: "Billing",
			description: "Manage your billing and subscriptions",
			icon: CreditCardIcon,
		},
		{
			id: "card-reports",
			title: "Reports",
			description: "View your reports and analytics",
			icon: ChartNoAxesColumnDecreasingIcon,
		},
	];

	const positionedCards = new SvelteSet(["card-payments"]);

	/* --- demo 15, "Avatar based card checkbox" ------------------------------------ */

	let avatarCard = $state(true);

	/* --- demo 16, "Nested checkbox group" ----------------------------------------- */

	type PermissionNode = { id: string; label: string; children?: PermissionNode[] };

	const PERMISSIONS: PermissionNode[] = [
		{
			id: "admin",
			label: "Administration",
			children: [
				{
					id: "user-management",
					label: "User Management",
					children: [
						{ id: "view-users", label: "View Users" },
						{ id: "create-users", label: "Create Users" },
						{ id: "edit-users", label: "Edit Users" },
					],
				},
				{
					id: "role-management",
					label: "Role Management",
					children: [
						{ id: "view-roles", label: "View Roles" },
						{ id: "assign-roles", label: "Assign Roles" },
					],
				},
			],
		},
	];

	/**
	 * ONLY THE LEAVES ARE STORED. Upstream keeps a `Record<string, boolean>` and writes only leaf
	 * ids into it, deriving every branch from the leaves under it; a `SvelteSet` of the chosen
	 * leaves says the same thing with one less falsy state to reason about, and is what `Tree`
	 * above already uses for its one flat level.
	 */
	const permissions = new SvelteSet(["view-users", "create-users", "view-roles"]);

	function leavesOf(node: PermissionNode): string[] {
		return node.children ? node.children.flatMap(leavesOf) : [node.id];
	}

	function nodeChecked(node: PermissionNode): boolean {
		return leavesOf(node).every((id) => permissions.has(id));
	}

	function nodeMixed(node: PermissionNode): boolean {
		const leaves = leavesOf(node);
		const chosen = leaves.filter((id) => permissions.has(id)).length;

		return chosen > 0 && chosen < leaves.length;
	}

	function toggleNode(node: PermissionNode) {
		const next = !nodeChecked(node);

		for (const id of leavesOf(node)) {
			if (next) permissions.add(id);
			else permissions.delete(id);
		}
	}

	/* --- demo 17, "Payment method card checkbox" ---------------------------------- */

	let paymentMethod = $state(true);

	/* --- demo 18, "Checkbox with label and tooltip info" -------------------------- */

	let advancedAnalytics = $state(false);

	/* --- demo 19, "Checkbox group with badge" ------------------------------------- */

	let featureBadgeSuggestions = $state(true);
	let featureBadgeBeta = $state(false);
</script>

<DocPage title="Checkbox">
	{#snippet subtitle()}
		A control that allows the user to toggle between checked and not checked. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/checkbox"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options; the sixteen sections after "As a card" are the composition gallery.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				`.form-check` is `padding-left: form-check-padding-start` (1.5rem) with the input
				floated back out of it by the same amount — the shape the classic framework needs to lay a bare
				`<input>` out beside its sibling label. Since `form-check-size` is 1rem, what it
				measures out to is 0.5rem between the box and the text, which a flex row states
				directly. The docs page writes `gap-3` here, 4px wider.
			-->
			<div class="flex items-center gap-2">
				<Checkbox id="terms" bind:checked={terms} class={control} />
				<Label for="terms" class={checkLabel}>Accept terms and conditions</Label>
			</div>
		</Card.Content>
	</Card.Root>

	<DocSection title="With text">
		{#snippet blurb()}
			A description under the label. The classic framework calls this a
			<code class="text-[87.5%] text-primary">.form-text</code>, and the classic theme sets its
			<code class="text-[87.5%] text-primary">margin-top</code> to zero so it sits flush under the line
			it explains.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`text-sm` is load-bearing, not decoration: it is `font-size-base`, and the
					checkbox's `margin-top` is written in `em` exactly as the classic theme writes it, so the
					row has to carry the size the input would have inherited from the body.
				-->
				<div class="flex items-start gap-2 text-sm">
					<Checkbox id="terms-2" bind:checked={policy} class={controlTopAligned} />
					<div class="grid">
						<Label for="terms-2" class={checkLabel}>Accept terms and conditions</Label>
						<p class={helpText}>
							By clicking this checkbox, you agree to the terms and conditions.
						</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled">
		{#snippet blurb()}
			Both halves fade to 50%, which is the classic figure as well as shadcn's; the difference is
			the cursor, and that the input stops taking pointer events entirely.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The Label has to stay the checkbox's next sibling: shadcn drives its faded state
					from `peer-disabled:`, which is the same shape as the classic
					`.form-check-input:disabled ~ .form-check-label`.
				-->
				<div class="flex items-center gap-2">
					<Checkbox id="toggle" disabled class={control} />
					<Label for="toggle" class={checkLabel}>Enable notifications</Label>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="As a card">
		{#snippet blurb()}
			A bordered block that picks up the checked state of the checkbox inside it, through a
			<code class="text-[87.5%] text-primary">:has()</code> selector. The classic framework has no component
			for this and the classic theme adds none, so only the colours below are the classic theme's.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					A `<label>` wrapper, as on the docs page. It is the `:has()` host and the hit
					area at once: bits-ui renders the checkbox as a `<button role="checkbox">`, and
					a `<button>` IS a labelable element, so a click anywhere in the block — on the
					title, on the help line, on the padding — reaches the control.
				-->
				<Label class={choiceCard}>
					<!--
						No colour override on the control, unlike the docs page: `data-checked:bg-primary`
						already paints it `component-active-bg`, and in the classic theme that IS the blue shadcn
						has to name explicitly.
					-->
					<Checkbox id="toggle-2" bind:checked={notifications} class={controlTopAligned} />
					<div class="grid">
						<!-- `font-medium` is `headings-font-weight: 500` — a title line, not body copy. -->
						<p class="text-sm font-medium">Enable notifications</p>
						<p class={helpText}>You can enable or disable notifications at any time.</p>
					</div>
				</Label>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Indeterminate">
		{#snippet blurb()}
			The third state, for a box that is neither wholly on nor wholly off. The classic framework
			paints it the same
			<code class="text-[87.5%] text-primary">primary</code> as the checked box with a dash where
			the tick would be; the classic theme ships no example of it, and the ground it needs is new in
			<code class="text-[87.5%] text-primary">app.css</code>. This one cycles through all three,
			where the source and the browser both leave the mixed state for good on the first click.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					<Checkbox
						id="checkbox-indeterminate"
						bind:checked={() => mixedChecked, () => cycleMixed()}
						bind:indeterminate={() => mixed, () => {}}
						class={control}
					/>
					<Label for="checkbox-indeterminate" class={checkLabel}>Indeterminate checkbox</Label>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Dashed">
		{#snippet blurb()}
			The classic theme never dashes a form control — the two dashed borders in the whole theme are
			<code class="text-[87.5%] text-primary">.card-inactive</code> and the Dropzone message, both containers,
			where dashed means "empty slot". This one is the source's, and it costs the page one of its two
			important utilities.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					<!--
						`border!` rather than `border`. `form-check-input-border: transparent` compiles
						to no border at all, which `app.css` restates as `border-width: 0` — unlayered,
						so no ordinary utility outranks it at any specificity. `border-dashed` and
						`border-primary` need no help: the rule sets neither style nor colour, only the
						width that makes them visible.
					-->
					<Checkbox
						id="checkbox-dashed"
						bind:checked={dashed}
						class={cn(control, "border! border-dashed border-primary")}
					/>
					<Label for="checkbox-dashed" class={checkLabel}>Accept terms and conditions</Label>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Todo list">
		{#snippet blurb()}
			The one shape on this page the classic theme owns outright.
			<code class="text-[87.5%] text-primary">.checklist</code> is a theme-specific component, and
			its checked row is struck through
			<em>and</em> muted — so this section says more than the source's, which only strikes.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					<Checkbox id="todo" bind:checked={todo} class={control} />
					<!--
						`.checklist .form-check .form-check-input:checked + .form-check-label` compiles to
						`{color: var(--bs-gray-700); text-decoration: line-through}`. `gray-700` (#6E84A3)
						is one of the four values §16 of the theme notes lists as having no token;
						`--muted-foreground` is exact in dark and one step off in light.

						Written `peer-data-[state=checked]:`, not `peer-data-checked:`: the shorthand is a
						zero-specificity `:where()` variant, which pages here do not use.
					-->
					<Label
						for="todo"
						class={cn(
							checkLabel,
							"peer-data-[state=checked]:text-muted-foreground peer-data-[state=checked]:line-through",
						)}
					>
						Simple todo list item
					</Label>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sizes">
		{#snippet blurb()}
			The classic theme has no size scale for a checkbox, only the rule the sizes have to obey:
			<code class="text-[87.5%] text-primary">form-check-input-checked-bg-size: 75% 75%</code>, a
			ratio rather than a length. Each box restates it through
			<code class="text-[87.5%] text-primary">--checkbox-tick</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					{#each SIZES as entry (entry.id)}
						<Checkbox
							checked={checkedSizes.has(entry.id)}
							onCheckedChange={(checked) =>
								checked ? checkedSizes.add(entry.id) : checkedSizes.delete(entry.id)}
							aria-label={entry.label}
							class={cn(bareRowControl, entry.class)}
						/>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Badge">
		{#snippet blurb()}
			A chip that carries its own checkbox, which appears only once the chip is chosen. No badge in
			the classic theme contains a form control — the badge stylesheet is twenty-four lines and none
			of them mention one — so the pill's geometry is the theme's and only the composition is the
			source's.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					{#each SNACKS as snack (snack)}
						<!--
							`relative` is added, and load-bearing: the Badge's own class list has no
							positioning, so the label's `after:inset-0` would otherwise resolve against
							whatever positioned ancestor lies further up.

							`rounded-sm` and `px-3 py-1.5` are the source's and are dropped. §7 of the
							theme notes keeps badges as pills, and the classic theme sizes them by `em` —
							`.33em/.5em` of a `76%` type — which the Badge here renders as a fixed `h-5`.
							A 16px box plus `py-0.5` is exactly those 20px, so nothing has to give.
						-->
						<Badge
							variant="secondary"
							class="relative gap-2 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
						>
							<!--
								`sr-only` where upstream writes `hidden`, and the difference is not
								cosmetic: `display: none` takes the control out of the accessibility tree
								and out of the tab order, so an unchosen chip becomes three words a
								keyboard cannot reach. `sr-only` is `position: absolute`, so it leaves the
								flex row exactly as `hidden` does — no box, and no `gap-2` beside it —
								while the checkbox stays focusable and announced.

								What that costs is a focus ring on a 1px box, which is why the pill above
								wears the ring instead, through `has-[:focus-visible]:`.
							-->
							<Checkbox
								id="snack-{snack}"
								checked={selectedSnacks.has(snack)}
								onCheckedChange={(checked) =>
									checked ? selectedSnacks.add(snack) : selectedSnacks.delete(snack)}
								class={cn(control, "data-[state=unchecked]:sr-only")}
							/>
							<!--
								A bare `<label>`, not the `Label` component: that one is `flex text-sm
								font-medium`, and a badge's type is `text-xs` inside a pill it sets the
								line-height of.
							-->
							<label
								for="snack-{snack}"
								class="cursor-pointer select-none after:absolute after:inset-0"
							>
								{snack}
							</label>
						</Badge>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Horizontal group">
		{#snippet blurb()}
			The classic framework's own answer is
			<code class="text-[87.5%] text-primary">.form-check-inline</code>, which is nothing but
			<code class="text-[87.5%] text-primary">display: inline-block; margin-right: 1rem</code> — and
			the classic theme neither overrides it nor ever uses it. The 1rem is what
			<code class="text-[87.5%] text-primary">gap-x-4</code> states here.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`role="group"` with `aria-labelledby`, where the source leaves the heading a bare
					`<Label>`. A `<label>` with nothing to label is a heading wearing the wrong element:
					it names no control, so a screen reader reads "Technologies" and then three
					unrelated checkboxes. The group is what the word actually names.
				-->
				<div role="group" aria-labelledby="technologies-label">
					<!--
						`mb-2 font-normal` is `.form-label`, which in the classic theme is one declaration —
						`margin-bottom: .5rem` — with no `font-weight` of its own, so it inherits
						`font-weight-base`. The source asks for `font-semibold`; the theme's group
						heading is body weight, the same call `FieldPage.svelte` makes.
					-->
					<p id="technologies-label" class="mb-2 text-sm">Technologies</p>
					<div class="flex flex-wrap items-center gap-x-4 gap-y-0.5">
						{#each TECHNOLOGIES as technology (technology.id)}
							<div class={checkRow}>
								<Checkbox
									id={technology.id}
									checked={selectedTechnologies.has(technology.id)}
									onCheckedChange={(checked) =>
										checked
											? selectedTechnologies.add(technology.id)
											: selectedTechnologies.delete(technology.id)}
									class={control}
								/>
								<Label for={technology.id} class={checkLabel}>{technology.label}</Label>
							</div>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical group">
		{#snippet blurb()}
			The same group stacked, with an icon in each label. The 2px between rows is
			<code class="text-[87.5%] text-primary">.form-check + .form-check</code>, the classic
			<code class="text-[87.5%] text-primary">.125rem</code> — the classic theme raises it to
			<code class="text-[87.5%] text-primary">.75rem</code> only inside a
			<code class="text-[87.5%] text-primary">.checklist</code>, which a stack of choices is not.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div role="group" aria-labelledby="fruits-label">
					<p id="fruits-label" class="mb-2 text-sm">Favorite Fruits</p>
					<div class="flex flex-col gap-0.5">
						{#each FRUITS as fruit (fruit.id)}
							{@const Icon = fruit.icon}
							<div class={checkRow}>
								<Checkbox
									id={fruit.id}
									checked={selectedFruits.has(fruit.id)}
									onCheckedChange={(checked) =>
										checked ? selectedFruits.add(fruit.id) : selectedFruits.delete(fruit.id)}
									class={control}
								/>
								<!--
									`size-4` is not decoration: the Label's class list sizes no descendant
									svg, and a Lucide glyph defaults to 24px — half again the 15px type it
									would sit beside.
								-->
								<Label for={fruit.id} class={checkLabel}>
									<Icon class="size-4" aria-hidden="true" />
									{fruit.label}
								</Label>
							</div>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Colors">
		{#snippet blurb()}
			The classic theme recolours a checkbox for one reason only — validity, green for
			<code class="text-[87.5%] text-primary">.is-valid</code> and red for
			<code class="text-[87.5%] text-primary">.is-invalid</code>. There is no decorative colour
			variant, so these three take the classic roles nearest the source's red, sky and green.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					<!--
						`data-[state=checked]:` rather than the `data-checked:` the component itself
						uses. Both target the same attribute, but the shorthand is a zero-specificity
						`:where()` variant that would tie with the component's own rather than beat it;
						the long form compiles to a real attribute selector and wins.
					-->
					{#each COLOURS as entry (entry.id)}
						<Checkbox
							checked={checkedColours.has(entry.id)}
							onCheckedChange={(checked) =>
								checked ? checkedColours.add(entry.id) : checkedColours.delete(entry.id)}
							aria-label={entry.label}
							class={cn(bareRowControl, entry.class)}
						/>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom icons">
		{#snippet blurb()}
			A checkbox with no box at all: the control keeps its role and its keyboard behaviour, and an
			icon carries the state. Nothing here is the classic theme's, and nothing here has to undo the
			classic theme either — see the note on
			<code class="text-[87.5%] text-primary">data-slot</code> in this file's header.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					<!--
						One icon branched on `checked`, where upstream renders both and hides one with
						`group-data-[state=…]:hidden`. bits-ui hands the state to the children snippet,
						so the branch can be real rather than drawn.
					-->
					<CheckboxPrimitive.Root bind:checked={heart} class={iconBox} aria-label="Heart icon">
						{#snippet children({ checked })}
							<HeartIcon class={cn("stroke-1", checked && "fill-destructive stroke-destructive")} />
						{/snippet}
					</CheckboxPrimitive.Root>
					<CheckboxPrimitive.Root bind:checked={star} class={iconBox} aria-label="Star icon">
						{#snippet children({ checked })}
							<!-- `warning` (#F6C343) for the source's amber — the classic theme's yellow role. -->
							<StarIcon class={cn("stroke-1", checked && "fill-warning stroke-warning")} />
						{/snippet}
					</CheckboxPrimitive.Root>
					<CheckboxPrimitive.Root bind:checked={circle} class={iconBox} aria-label="Circle icon">
						{#snippet children({ checked })}
							<CircleIcon class={cn("stroke-1", checked && "fill-success stroke-success")} />
						{/snippet}
					</CheckboxPrimitive.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Filled icon">
		{#snippet blurb()}
			A coloured disc that shows a ringed tick when chosen. The classic theme does have a circular
			checkbox — <code class="text-[87.5%] text-primary">.form-check-circle</code>, undocumented and
			used on the two CRM pages only — but that is a selection control rather than a status disc, so
			only its colours are borrowed.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					{#each DISCS as entry (entry.id)}
						<CheckboxPrimitive.Root
							checked={checkedDiscs.has(entry.id)}
							onCheckedChange={(checked) =>
								checked ? checkedDiscs.add(entry.id) : checkedDiscs.delete(entry.id)}
							class={cn(statusDisc, entry.ground)}
							aria-label={entry.label}
						>
							{#snippet children({ checked })}
								{#if checked}
									<!--
										`fill-*-foreground` where upstream writes `fill-white`: the two are
										the same colour on this palette — `color-contrast(danger)` is
										#FFFFFF — and the token stays right on the generated ones.
									-->
									<CircleCheckIcon class={cn("size-5.5", entry.glyph)} aria-hidden="true" />
								{/if}
							{/snippet}
						</CheckboxPrimitive.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="List group">
		{#snippet blurb()}
			The classic theme never puts a checkbox in a list-group row — the list-group stylesheet is
			sixty-five lines and mentions no form control — so the rows keep the source's shape and take
			the list's own metrics: <code class="text-[87.5%] text-primary">1rem 1.25rem</code> of padding
			and a
			<code class="text-[87.5%] text-primary">border-radius</code> outer corner.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`divide-y` needs no colour: the `@layer base` reset gives every element
					`border-color: var(--border)`, and `--border` IS `list-group-border-color`.
				-->
				<ul class="flex w-full flex-col divide-y rounded-md border">
					{#each SKILLS as skill (skill.id)}
						{@const Icon = skill.icon}
						<li>
							<Label for={skill.id} class={cn(checkLabel, "justify-between gap-2 px-5 py-4")}>
								<span class="flex items-center gap-2">
									<Icon class="size-4" aria-hidden="true" />
									{skill.label}
								</span>
								<Checkbox
									id={skill.id}
									checked={selectedSkills.has(skill.id)}
									onCheckedChange={(checked) =>
										checked ? selectedSkills.add(skill.id) : selectedSkills.delete(skill.id)}
									class={control}
								/>
							</Label>
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tree">
		{#snippet blurb()}
			A parent that goes indeterminate while only some of its children are chosen. The classic theme
			has a select-all — <code class="text-[87.5%] text-primary">.list-checkbox-all</code> in
			<code class="text-[87.5%] text-primary">src/js/list.js</code> — but it is strictly two-state and
			never sets the third, so the mixed parent is the source's idea on the classic theme's paint.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div class={checkRow}>
						<!--
							The getter/setter form of `bind:`, and the indeterminate setter is empty on
							purpose — the parent's third state is derived from the children and is never
							written to directly. Same recipe as the Data table's selection column.
						-->
						<Checkbox
							id="tree-parent"
							bind:checked={() => allChildren, (next) => setAllChildren(next)}
							bind:indeterminate={() => someChildren, () => {}}
							class={control}
						/>
						<Label for="tree-parent" class={checkLabel}>Parent</Label>
					</div>
					<!--
						`pl-6` is `form-check-padding-start` (1.5rem) — the indent the classic framework already
						reserves for an input, used here as one level of the tree.
					-->
					<div class="flex flex-col gap-0.5 pl-6">
						{#each TREE_ITEMS as item (item.id)}
							<div class={checkRow}>
								<Checkbox
									id={item.id}
									checked={selectedChildren.has(item.id)}
									onCheckedChange={(checked) =>
										checked ? selectedChildren.add(item.id) : selectedChildren.delete(item.id)}
									class={control}
								/>
								<Label for={item.id} class={checkLabel}>{item.label}</Label>
							</div>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Form">
		{#snippet blurb()}
			The same row as "With text" with the two buttons a form ends in. The classic theme's own form
			rhythm is <code class="text-[87.5%] text-primary">form-group-margin-bottom: 1.375rem</code>
			between groups and <code class="text-[87.5%] text-primary">.5rem</code> under the help line.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-start gap-2 text-sm">
					<Checkbox id="form-terms" bind:checked={formTerms} class={controlTopAligned} />
					<!--
						`grid` with no gap, and the buttons pushed down on their own, where the source
						puts `gap-2` between all three. `form-text-margin-top: 0` is a classic override
						of the classic `.25rem` and the reason the help line sits flush in every other
						section here; a gap only under the label would say the opposite two hundred lines
						from where the rule is written down. `mt-3` under the buttons is
						`form-text-margin-bottom: .5rem` plus the `.25rem` a `.form-group` puts between
						a field and its actions.
					-->
					<div class="grid">
						<Label for="form-terms" class={checkLabel}>Accept terms and conditions</Label>
						<p class={helpText}>
							By clicking this checkbox, you agree to the terms and conditions.
						</p>
						<div class="mt-3 flex flex-wrap gap-2">
							<Button variant="outline" size="sm">Reset</Button>
							<Button size="sm">Submit</Button>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Animated">
		{#snippet blurb()}
			The tick drawn rather than switched on, and the box lifting under the pointer.
			<code class="text-[87.5%] text-primary">.form-check-input</code> carries no
			<code class="text-[87.5%] text-primary">transition</code> at all in the classic theme — the tick
			appears instantly — so both movements are the source's, at the theme's own easing.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					<!--
						`data-slot='checkbox'` IS written here, unlike the two icon sections: this is
						still the classic box, so the grey chip, the 6px radius and the missing border
						all reach it. Only the indicator's slot is withheld, so the drawn path is not
						pinned to the Lucide tick's size and weight — which it restates itself, at the
						same 12px and 3.6. The `after:` hit area is restated for the same reason the
						centring is: it lives in a class list this call site replaces rather than adds
						to, and without it this is the one checkbox on the page with a 16px target.

						`motion-safe:` rather than `motion-reduce:` for the scale: a 5% jump with the
						transition switched off is still movement, and the point is to have none.
					-->
					<CheckboxPrimitive.Root
						id="checkbox-animated"
						bind:checked={animated}
						data-slot="checkbox"
						class={cn(
							control,
							"relative flex size-4 shrink-0 items-center justify-center outline-none",
							"after:absolute after:-inset-x-3 after:-inset-y-2",
							"transition-colors duration-500 motion-safe:hover:scale-105 motion-safe:active:scale-95",
							"focus-visible:ring-3 focus-visible:ring-ring/50",
							"data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
						)}
					>
						<!--
							The tick stays MOUNTED and the box's state drives the dash offset, where an
							earlier draft branched on `{#if checked}`. Upstream animates `pathLength` in
							BOTH directions — 0.2s in after a 0.2s wait, 0.2s straight back out — and an
							unmounted element cannot animate out. It also cannot animate in twice: a CSS
							animation replays on mount, so a `{#if}` gets the first half by accident and
							loses the rest.

							`pathLength="1"` restates the path's length as one unit, so
							`stroke-dasharray: 1` is exactly the path and the offset runs 1 → 0. A
							percentage there resolves against the viewport diagonal, which on a 24-unit
							box is shorter than this path — the draw would start from a stub and stop
							before the tip.
						-->
						{#snippet children()}
							<svg
								class="tick-draw size-3"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3.6"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path pathLength="1" d="M4.5 12.75l6 6 9-13.5" />
							</svg>
						{/snippet}
					</CheckboxPrimitive.Root>
					<Label for="checkbox-animated" class={checkLabel}>Animated checkbox</Label>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Animated todo list">
		{#snippet blurb()}
			The strike of
			<code class="text-[87.5%] text-primary">.checklist</code> drawn instead of switched on, on the
			one round checkbox the classic theme has —
			<code class="text-[87.5%] text-primary">.form-check-circle</code>, 1.375rem at
			<code class="text-[87.5%] text-primary">border-radius: 50%</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					<!--
						`rounded-full!` is the page's second important utility, and the reason is the
						first one's: `app.css` pins `border-radius` to `form-check-input-border-radius`
						from an unlayered rule. The 12px tick is left alone deliberately —
						`form-check-circle-indicator-bg-size` is `.75rem .5625rem`, so the classic theme's own
						circle keeps the same 12px glyph in a 22px disc.

						The source's blue needs no override: `primary` IS #2C7BE5. What it does not get
						is the drawn tick of the section above — upstream builds this demo on its
						`motion-checkbox` as well, and one page does not need the same tick animated
						twice. The strike is what this section is for.
					-->
					<Checkbox
						id="animated-todo"
						bind:checked={animatedTodo}
						class={cn(control, "size-5.5 rounded-full!")}
					/>
					<!--
						The strike is a pseudo-element rather than `text-decoration`, because a
						`line-through` cannot be animated. `after:bg-current` keeps the rule the same
						colour as the type it crosses, so both land on `checklist-control-checked-color`
						together.
					-->
					<Label
						for="animated-todo"
						class={cn(
							checkLabel,
							"relative transition-colors peer-data-[state=checked]:text-muted-foreground",
							"after:absolute after:top-1/2 after:left-0 after:h-px after:w-full after:origin-bottom after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-in-out",
							"peer-data-[state=checked]:after:scale-x-100 motion-reduce:after:transition-none",
						)}
					>
						Animated todo list item
					</Label>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Confetti">
		{#snippet blurb()}
			Twelve pieces thrown at random angles when the box is checked. Nothing in the classic theme
			does this; what it lends is the shape of the movement — the one motion it authors on an
			interactive element, <code class="text-[87.5%] text-primary">.lift</code>, is a
			<code class="text-[87.5%] text-primary">translate3d</code> over 250ms, and the theme scales nothing.
		{/snippet}
		<!--
			`overflow-visible` because the Card's own class list is `overflow-hidden`, and pieces
			travel 30–50px from a control sitting well inside the card's padding.
		-->
		<Card.Root class="overflow-visible">
			<Card.Content>
				<!--
					`w-fit` is added to upstream's wrapper. The pieces are laid out from its centre, and
					a block-level row is as wide as the card — so without it the burst goes off from a
					point some way to the right of the control it is meant to come from. Upstream never
					notices, because its preview frame is the width of the row.
				-->
				<div class="relative flex w-fit items-center gap-2">
					<Checkbox
						id="checkbox-confetti"
						bind:checked={confetti}
						onCheckedChange={onConfettiChange}
						class={control}
					/>
					<Label for="checkbox-confetti" class={checkLabel}>Check to see magic</Label>
					<!--
						`{#key burst}` remounts the layer on every check, which is what restarts the
						animation — a CSS animation does not replay because its element's custom
						properties changed. The pieces are cleared 1000ms later so nothing is left in the
						tree between bursts.
					-->
					{#key burst}
						<div class="pointer-events-none absolute inset-0" aria-hidden="true">
							{#each particles as particle, index (index)}
								<span
									class="confetti-piece absolute size-1 rounded-full"
									style="--confetti-x: {particle.x}px; --confetti-y: {particle.y}px; --confetti-delay: {particle.delay}ms; background-color: var({particle.colour})"
								></span>
							{/each}
						</div>
					{/key}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Invalid checkbox">
		{#snippet blurb()}
			A required box that has not been ticked. The classic theme marks an invalid control with
			<code class="text-[87.5%] text-primary">.is-invalid</code>, which is a red BORDER — and this
			theme has removed the border from a checkbox entirely, so what marks it here is the
			destructive ring, the one shadow
			<code class="text-[87.5%] text-primary">app.css</code> deliberately spares.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 3. Nothing is overridden: the Checkbox
					already ships `aria-invalid:ring-3 aria-invalid:ring-destructive/20`, and the
					`[data-slot='checkbox']:not(:focus-visible):not([aria-invalid='true'])` rule in
					`app.css` exists precisely so that ring survives the classic theme's flat surface.

					`aria-invalid="true"` in full, not the bare attribute: both the component's variant
					and that rule match on the VALUE, and Svelte renders `aria-invalid` alone as the
					empty string.

					`data-invalid="true"` on the Field is the other half — `fieldVariants` turns the
					whole group destructive with it, which is how the classic framework colours
					`.form-check-input.is-invalid ~ .form-check-label`.
				-->
				<Field.Field orientation="horizontal" class="w-auto" data-invalid="true">
					<Checkbox id="demo-invalid" aria-invalid="true" class={control} />
					<Field.FieldLabel for="demo-invalid" class={checkLabel}>
						Invalid checkbox
					</Field.FieldLabel>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Checkbox group in a frame">
		{#snippet blurb()}
			The same stack of choices given a surface of its own — a titled shell with the rows in one
			seamless panel. The classic theme's nearest arrangement is a
			<code class="text-[87.5%] text-primary">.card</code> around a
			<code class="text-[87.5%] text-primary">.list-group</code>, which has neither the recessed
			tray nor the concentric inner corner; the Frame page next door records why the component has
			no classic counterpart.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 10. `spacing="sm"` is upstream's, and it is what pulls the panel's
					own padding down to 12px — the rows then supply their own `p-3`, so the
					separators run edge to edge.

					`p-0!` on the panel is upstream's too, and here it is genuinely important: the
					padding is `px-(--frame-panel-px) py-(--frame-panel-py)`, a class in the same
					layer as any override, so `p-0` alone would tie and lose on source order.
				-->
				<Frame.Root spacing="sm" class="w-full max-w-xs">
					<Frame.Header>
						<Frame.Title>Notification Settings</Frame.Title>
					</Frame.Header>
					<Frame.Panel class="p-0!">
						<Field.FieldGroup class="gap-0">
							{#each FRAME_NOTIFICATIONS as item, index (item.id)}
								{#if index > 0}
									<Separator />
								{/if}
								<Field.Field>
									<!--
										The whole row is the label, so the 12px of padding is the hit area
										as well as the rhythm — `p-3` on a `<label>`, not on a wrapper.
									-->
									<Field.FieldLabel class={cn(checkLabel, "p-3")}>
										<Checkbox
											checked={frameNotifications.has(item.id)}
											onCheckedChange={(checked) =>
												checked
													? frameNotifications.add(item.id)
													: frameNotifications.delete(item.id)}
											class={control}
										/>
										<Field.FieldTitle>{item.label}</Field.FieldTitle>
									</Field.FieldLabel>
								</Field.Field>
							{/each}
						</Field.FieldGroup>
					</Frame.Panel>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom positioned checkbox">
		{#snippet blurb()}
			The control pinned to a corner of the block it selects rather than laid out beside a label.
			The pattern comes in two shapes — a row of compact chips and a grid of feature cards — so both
			sit in this section.
		{/snippet}
		<div class="flex flex-col gap-4">
			<Card.Root>
				<Card.Content>
					<!--
						demo 13. `-top-2 -right-2` puts the box half outside its chip, which
						is why it needs a ground of its own to read against: the round 20px control is
						`--secondary` unchecked and `primary` checked, both solid, so it never
						disappears into the chip's border.
					-->
					<Field.FieldGroup class="w-full max-w-xs flex-row gap-4">
						{#each POSITIONED_CHIPS as chip (chip.id)}
							<Field.FieldLabel class={cn(checkLabel, "relative p-0")}>
								<Field.Field orientation="horizontal">
									<Checkbox
										checked={positionedChips.has(chip.id)}
										onCheckedChange={(checked) =>
											checked ? positionedChips.add(chip.id) : positionedChips.delete(chip.id)}
										aria-label={chip.label}
										class={cn(cornerControl, "-top-2 -right-2")}
									/>
									<Field.FieldTitle class="justify-center">{chip.label}</Field.FieldTitle>
								</Field.Field>
							</Field.FieldLabel>
						{/each}
					</Field.FieldGroup>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Content>
					<!--
						demo 14. Upstream draws its icon container by hand — a bordered,
						shadowed, `rounded-2xl` box with `p-2` around a 16px glyph. That object is
						`IconTile` here, whose `outline` variant IS those declarations and whose
						corner comes from the theme's radius scale rather than from one demo's opinion
						of it.
					-->
					<Field.FieldGroup class="grid w-full max-w-xs grid-cols-2 gap-4">
						{#each POSITIONED_CARDS as card (card.id)}
							{@const Icon = card.icon}
							<Field.FieldLabel class={cn(checkLabel, "relative p-0")}>
								<Field.Field orientation="horizontal">
									<Checkbox
										checked={positionedCards.has(card.id)}
										onCheckedChange={(checked) =>
											checked ? positionedCards.add(card.id) : positionedCards.delete(card.id)}
										aria-label={card.title}
										class={cn(cornerControl, "top-3 right-3")}
									/>
									<Field.FieldTitle class="flex-col items-start">
										<IconTile>
											<Icon aria-hidden="true" />
										</IconTile>
										<div class="flex flex-col items-start gap-0.5">
											<!--
												`font-medium` for upstream's `font-semibold`:
												`headings-font-weight` is 500, the weight every title
												line on this page already uses.
											-->
											<span class="text-sm font-medium">{card.title}</span>
											<span class={helpText}>{card.description}</span>
										</div>
									</Field.FieldTitle>
								</Field.Field>
							</Field.FieldLabel>
						{/each}
					</Field.FieldGroup>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<DocSection title="Avatar based card checkbox">
		{#snippet blurb()}
			A person as the thing being chosen, with the control at the far end of the row. The classic
			theme has no such row either — its own selection card, the undocumented
			<code class="text-[87.5%] text-primary">.form-check-circle</code> on the two CRM pages, puts the
			box in the corner rather than in the line.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 15. The photograph is dropped for initials, which is this
					repository's standing substitution — it ships no images and fetches none, and the
					Filters page records the same call for the same reason.

					The checkbox needs no `ml-auto`: `Field` in its horizontal orientation gives the
					`field-label` slot `flex-auto`, and `FieldTitle` carries that slot, so the title
					takes the slack and the box lands on the right.
				-->
				<Field.FieldGroup class="w-full max-w-xs">
					<Field.FieldLabel class={cn(checkLabel, "relative p-0")}>
						<Field.Field orientation="horizontal">
							<Field.FieldTitle>
								<Avatar.Root>
									<Avatar.Fallback>EW</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex flex-col items-start">
									<span class="text-sm font-medium">Emma Wilson</span>
									<span class={helpText}>@emmawilson</span>
								</div>
							</Field.FieldTitle>
							<Checkbox bind:checked={avatarCard} aria-label="Select Emma Wilson" class={control} />
						</Field.Field>
					</Field.FieldLabel>
				</Field.FieldGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Nested checkbox group">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">Tree</code> above with the levels it does not have: a
			branch that is a parent to the row under it and a child to the row over it, so the mixed state
			has to propagate rather than just be computed once. The classic theme's own select-all,
			<code class="text-[87.5%] text-primary">.list-checkbox-all</code>, is one level and two
			states.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 16. Upstream renders this with a recursive function component; the
					Svelte equivalent is a snippet that renders itself, which is legal as long as the
					recursion is bounded by the data — here, by `children` being absent on a leaf.
				-->
				<div class="flex flex-col gap-3">
					<!--
						The snippet lives INSIDE this `<div>` rather than beside it: a snippet declared
						as a direct child of a COMPONENT becomes a prop of that component, and
						`Card.Content` has no `permissionNode` prop. An element's children are markup.
					-->
					{#snippet permissionNode(node: PermissionNode, level: number)}
						<div class="flex flex-col gap-3">
							<Field.Field orientation="horizontal">
								<!--
									The getter/setter form of `bind:` with an empty indeterminate setter,
									exactly as `Tree` above uses it: both states are DERIVED from the
									leaves under this node, so bits-ui must never be the one writing them.
									The checked setter ignores its argument because `toggleNode` recomputes
									the direction itself — upstream's `shouldCheck = !isChecked(item)`,
									which is what makes a click on a mixed branch fill it rather than
									empty it.
								-->
								<Checkbox
									id={node.id}
									bind:checked={() => nodeChecked(node), () => toggleNode(node)}
									bind:indeterminate={() => nodeMixed(node), () => {}}
									class={control}
								/>
								<Field.FieldLabel
									for={node.id}
									class={cn(checkLabel, level === 0 && "font-medium")}
								>
									{node.label}
								</Field.FieldLabel>
							</Field.Field>
							{#if node.children}
								<!--
									`ml-7` is upstream's indent and is one step wider than the `pl-6` of
									`Tree` — 28px against the 24px of `form-check-padding-start`. It is
									kept, because at three levels the extra 4px is what keeps the rails
									distinguishable; at one level the classic framework's own reserve is enough.
								-->
								<div class="ml-7 flex flex-col gap-3">
									{#each node.children as child (child.id)}
										{@render permissionNode(child, level + 1)}
									{/each}
								</div>
							{/if}
						</div>
					{/snippet}

					{#each PERMISSIONS as node (node.id)}
						{@render permissionNode(node, 0)}
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Payment method card checkbox">
		{#snippet blurb()}
			The card-with-a-corner-control shape carrying a real object — a saved payment method. The
			classic theme has a billing card of its own on
			<code class="text-[87.5%] text-primary">account-billing.html</code>, and it is a
			<code class="text-[87.5%] text-primary">.list-group-item</code> with a radio; the checkbox version
			is the source's.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 17. The brand mark keeps its brand fills — #EB001B, #F79E1B and
					#FF5F00 are Mastercard's, not theme colours, and the same call is already made for
					the Claude and Gemini glyphs on `DropdownMenuPage.svelte`. Every other colour in
					this section is a token.

					The mark sits in an `IconTile` rather than upstream's hand-built box, for the
					reason demo 14 above gives; `size-7` on the svg opts out of the tile's
					own glyph size, which is what reproduces upstream's `p-1.5` inside a 40px square.
				-->
				<div class="mx-auto w-full max-w-xs">
					<Field.FieldLabel for="demo-mastercard" class={cn(checkLabel, "relative p-0")}>
						<Field.Field orientation="horizontal">
							<Checkbox
								id="demo-mastercard"
								bind:checked={paymentMethod}
								class={cn(cornerControl, "top-3 right-3")}
							/>
							<Field.FieldTitle class="flex-col items-start gap-4">
								<IconTile>
									<svg
										class="size-7"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
										aria-hidden="true"
									>
										<circle cx="7" cy="12" r="7" fill="#EB001B" />
										<circle cx="17" cy="12" r="7" fill="#F79E1B" />
										<path
											d="M12 17.5C13.5 16.2 14.5 14.2 14.5 12C14.5 9.8 13.5 7.8 12 6.5C10.5 7.8 9.5 9.8 9.5 12C9.5 14.2 10.5 16.2 12 17.5Z"
											fill="#FF5F00"
										/>
									</svg>
								</IconTile>
								<div class="flex flex-col items-start gap-0.5">
									<span class="text-sm font-medium">Mastercard ending in 8888</span>
									<span class={helpText}>Expires 09/25</span>
								</div>
							</Field.FieldTitle>
						</Field.Field>
					</Field.FieldLabel>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Checkbox with label and tooltip info">
		{#snippet blurb()}
			A setting whose label needs a sentence of explanation that does not belong under it. The
			classic framework would write that sentence as a
			<code class="text-[87.5%] text-primary">.form-text</code>, which is what "With text" above
			does; this is the other answer, for when the explanation is longer than the setting is
			important.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 18. The trigger gets an `aria-label`
					upstream does not give it: it renders as a `<button>` whose only content is an
					`aria-hidden` glyph, so without one a screen reader reaches an unnamed control.

					`max-w-[200px] text-center` is `tooltip-max-width` and `.tooltip-inner`'s
					alignment — the pair the Tooltip page derives once and every other call site
					restates.
				-->
				<Field.Field orientation="horizontal" class="w-auto">
					<Checkbox id="demo-analytics" bind:checked={advancedAnalytics} class={control} />
					<div class="flex items-center gap-1.5">
						<Field.FieldLabel for="demo-analytics" class={checkLabel}>
							Enable advanced analytics
						</Field.FieldLabel>
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger
									class="text-muted-foreground"
									aria-label="About advanced analytics"
								>
									<CircleQuestionMarkIcon class="size-3.5" aria-hidden="true" />
								</Tooltip.Trigger>
								<Tooltip.Content side="right" class="max-w-[200px] text-center">
									Advanced analytics provides deeper insights into user behavior and system
									performance.
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</div>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Checkbox group with badge">
		{#snippet blurb()}
			Two settings whose names need a tag rather than a sentence. The classic theme tags a row the
			same way —
			<code class="text-[87.5%] text-primary">.badge</code> beside a title is how
			<code class="text-[87.5%] text-primary">account-billing.html</code> marks the active plan — so only
			the micro-pill's metrics are the source's.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 19, which recurs as demo 22: the same two
					rows, differing only in how the pill is measured. 19 asks the Badge for
					`size="sm"`, and Badge here has ONE size — §7 of the theme notes keeps badges as
					pills sized in `em`, which this one renders as a fixed `h-5`. 22 writes the metrics
					out instead, and those are the three classes kept: `SwitchPage.svelte` and
					`RadioGroupPage.svelte` already carry them for their own copy of this demo, so the
					three pages' "New" pills are one object rather than three near-misses.

					The Badge sits BESIDE the label rather than inside it, which is the same call those
					two pages record: a `<label for>` wrapping the pill would make the chip a second hit
					area for the checkbox, and a tag is not a control.

					The outer `Field` is 19's, and its `gap-2` is worth keeping over 22's `gap-4` — two
					annotated rows are still a stack of choices, and the classic rhythm for one is
					`.form-check + .form-check`, tighter than either.
				-->
				<Field.Field class="w-auto">
					<Field.Field orientation="horizontal">
						<Checkbox
							id="demo-badge-suggestions"
							bind:checked={featureBadgeSuggestions}
							class={control}
						/>
						<div class="flex items-center gap-2">
							<Field.FieldLabel for="demo-badge-suggestions" class={checkLabel}>
								AI-powered suggestions
							</Field.FieldLabel>
							<Badge class="h-4.5 rounded-full px-1.5 text-[10px] tracking-wider uppercase">
								New
							</Badge>
						</div>
					</Field.Field>
					<Field.Field orientation="horizontal">
						<Checkbox id="demo-badge-beta" bind:checked={featureBadgeBeta} class={control} />
						<div class="flex items-center gap-2">
							<Field.FieldLabel for="demo-badge-beta" class={checkLabel}>
								Beta feature access
							</Field.FieldLabel>
							<Badge
								variant="secondary"
								class="h-4.5 rounded-full px-1.5 text-[10px] tracking-wider uppercase"
							>
								Beta
							</Badge>
						</div>
					</Field.Field>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>

<style>
	/*
	 * Two animations that cannot be call-site classes, for the reason `app.css` gives for its own
	 * `@keyframes` block: a keyframes rule is not a utility. They are scoped to this page rather
	 * than added to the global stylesheet because neither is theme machinery — the shape
	 * `CheckboxGroupPage.svelte` already uses.
	 */

	/*
	 * The drawn tick. A transition rather than an animation, because upstream's runs in both
	 * directions and a keyframe animation only replays on mount; the state selector is the root's
	 * own `data-state`, which bits-ui writes on every toggle.
	 *
	 * 0.2s after a 0.2s wait on the way in and 0.2s with no wait on the way out, which is upstream's
	 * timing and is also the theme's: `.15s ease-in-out` is the classic theme's house transition, and `.2s
	 * ease-in-out` is what its accordion chevron uses.
	 *
	 * `:global()` on the ancestor half of the selector: the state lives on `CheckboxPrimitive.Root`,
	 * a component this page does not own the markup of, so Svelte's scoping class never lands there.
	 * The descendant half is scoped as usual, which keeps the rule to this page's own tick.
	 */
	.tick-draw {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		transition: stroke-dashoffset 0.2s ease-in-out;
	}

	:global([data-state="checked"]) .tick-draw {
		stroke-dashoffset: 0;
		transition-delay: 0.2s;
	}

	/*
	 * One piece of confetti. The angle, the distance and the stagger arrive as custom properties on
	 * the element — the pattern `speed-dial-item.svelte` and `marquee.svelte.ts` use for
	 * per-element animation parameters — so the keyframes stay one rule for all twelve.
	 *
	 * `translate3d` rather than a pair of offsets, matching `.lift`, the only transform the classic theme
	 * authors on an interactive element. The scale is upstream's `[0, 1, 0]`, and is what makes a
	 * piece appear and vanish rather than slide in and stop — which is why the midpoint has to
	 * restate the translation as well. A 50% step that named only `opacity` would leave `transform`
	 * interpolating straight from `scale(0)` to `scale(0)`, and the whole burst would run at zero
	 * size, twelve times, invisibly.
	 */
	@keyframes confetti-fly {
		from {
			transform: translate3d(0, 0, 0) scale(0);
			opacity: 0;
		}
		50% {
			transform: translate3d(calc(var(--confetti-x) / 2), calc(var(--confetti-y) / 2), 0) scale(1);
			opacity: 1;
		}
		to {
			transform: translate3d(var(--confetti-x), var(--confetti-y), 0) scale(0);
			opacity: 0;
		}
	}

	.confetti-piece {
		top: 50%;
		left: 50%;
		animation: confetti-fly 0.4s ease-out var(--confetti-delay) both;
	}

	@media (prefers-reduced-motion: reduce) {
		.tick-draw,
		:global([data-state="checked"]) .tick-draw {
			transition: none;
		}

		.confetti-piece {
			display: none;
		}
	}
</style>
