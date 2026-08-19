import { cn } from "$lib/utils.js";

/**
 * The classic skin for a range calendar — the picker's `mode: range`, restated for bits-ui's
 * `RangeCalendar`.
 *
 * SHARED, AND WHY. This began as page-local constants on a Range calendar page. Then the
 * Calendar page took on its full thirty-demo set, eight of which select ranges, and a second
 * copy of a hundred documented lines is a copy that drifts — so the two class strings moved
 * out, docs and all, and now live beside the component itself: the skin ships with
 * `range-calendar`, which was the point of sharing it. Two consumers draw on the barrel —
 * `CalendarPage` (the pattern demos, and since the regroup the range demos too) and the
 * Filters page's date-range control.
 *
 * Everything below derives from the reference stylesheet (84 lines) or, where that
 * partial is silent, from the picker's own stylesheet — each value names its source, and the
 * ones that are the picker's rather than the classic theme's say so. In quoted selectors and
 * variables, `<picker>` stands in for the picker library's class and variable prefix.
 */

/**
 * The panel: frame, ground, head row, and the range band.
 *
 *   border         `border: input-border-width solid var(--bs-<picker>-border-color)`,
 *                  where the colour is `input-border-color` — `gray-400` (#D2DDEC) light,
 *                  `gray-700-dark` (#1E3A5C) dark — which `--input` holds exactly in BOTH
 *                  modes. shadcn's docs ask for a bare `border`, i.e. `--border` (#EDF2F9),
 *                  all but invisible against white.
 *   rounded-md     `border-radius` (0.375rem). the picker's own panel is 5px and the classic theme
 *                  never touches it, but 6px is what the classic theme puts on everything else.
 *   ground         `--bs-<picker>-bg` is `input-bg`: `#fff` in light and `gray-700-dark`
 *                  (#1E3A5C) in dark. The component goes `bg-transparent` inside a
 *                  `card-content` OR a `popover-content`, so without these rules the panel
 *                  shows the host surface through — which in dark is #152E4D, EXACTLY the
 *                  colour of the range band below, and the highlight disappears. That is not
 *                  hypothetical: the popover form shipped that way, and the band measured
 *                  rgb(21,46,77) on rgb(21,46,77). The `--card` / dark `--input` pair is the
 *                  same one `.form-control` uses in `app.css`, and honestly so — the classic theme's
 *                  picker IS a form control, and its popup inherits the field's ground.
 *   --cell-size    the 39px day cell — the picker's, untouched
 *                  by the classic theme. shadcn ships 32px.
 *   [&_th]         the weekday row: `color: inherit !important` drags the picker's grey up to
 *                  the body colour, and `font-weight: bolder` against 400 computes to 700.
 *   [&_td…]        the band itself. The classic theme paints `.<picker>-day.inRange` with
 *                  `background-color: var(--bs-light)` and bridges the column gutters with
 *                  box-shadows in the same colour; shadcn gets the same continuity by painting
 *                  the whole `<td>`. `data-selected` is set on every day of the range — start,
 *                  middles and end alike — so one selector covers the band.
 *
 * `--bs-light` is `gray-200` (#EDF2F9) in light and `light-dark` = `gray-800-dark`
 * (#152E4D) in dark. No single token holds both: `--secondary` is exact in light, `--card` in
 * dark — the same split, and the same reason for a `dark:` override, as the tooltip chip.
 *
 * The last two rules round the band's ends at a ROW boundary, which shadcn rounds for middles
 * and forgets for the two caps: a range that ends on the first cell of a week would otherwise
 * be rounded on its right and square on the side the band opened from.
 */
export const rangeCalendar = cn(
	"w-fit rounded-md border border-input",
	"[[data-slot=card-content]_&]:bg-card dark:[[data-slot=card-content]_&]:bg-input",
	"[[data-slot=popover-content]_&]:bg-card dark:[[data-slot=popover-content]_&]:bg-input",
	"[--cell-size:39px]",
	"[&_th]:font-bold [&_th]:text-foreground",
	"[&_td:has([data-selected])]:bg-secondary dark:[&_td:has([data-selected])]:bg-card",
	"[&_td:first-child:has([data-range-end])]:rounded-s-(--cell-radius)",
	"[&_td:last-child:has([data-range-start])]:rounded-e-(--cell-radius)",
);

/**
 * The variant for a panel that sits flush inside a `p-0` card or a popover, which is how the
 * pattern demos are built: the card or the popover IS the frame, so the panel drops its own
 * border and corners and keeps everything else. The host wants `overflow-hidden` so the
 * square panel does not poke through the rounded card.
 */
export const rangeCalendarFlush = cn(rangeCalendar, "rounded-none border-0");

/**
 * The day chip. Each class repeats one of shadcn's own variant strings so `twMerge` drops the
 * default outright instead of leaving two rules to a specificity contest.
 *
 *   hover     `.<picker>-day:hover` is `background-color: var(--bs-light)` plus a 1px border
 *             in `--input`; shadcn has `bg-accent/50` and no border, so both halves are
 *             restated, width included — the day carries no border by default, so a colour
 *             alone would paint nothing.
 *   today     `.<picker>-day.today { border-color: var(--bs-border-color) }` and nothing
 *             else: an OUTLINE, where shadcn fills the chip. `--border` is exact in dark and
 *             one grey step light in light — the same near-miss the Accordion page records.
 *   caps      `.<picker>-day.selected` pins `color: var(--bs-white) !important`, so the
 *             label never darkens on hover the way shadcn's does.
 *
 * RADIUS AND OUTSIDE DAYS are left as shadcn ships them, because both are already the classic theme's:
 *
 *   radius    `.<picker>-calendar .<picker>-day { border-radius: var(--bs-border-radius) }`
 *             is 0.375rem, and shadcn's `--cell-radius` is `--radius-md`, the same value;
 *             `data-[range-middle]:rounded-none` is `.inRange { border-radius: 0 }`. Note what
 *             the shipped theme actually renders, though: the picker's own
 *             `.<picker>-day.selected.startRange { border-radius: 50px 0 0 50px }` is three
 *             classes against the classic theme's two, so it outranks the override and the end caps stay
 *             pills. That is a specificity accident, not a decision — the value the classic theme wrote
 *             down is `border-radius`, so that is the one followed here.
 *   outside   `.<picker>-day.prevMonthDay { color: body-secondary-color !important }` is
 *             `gray-600` (#95AAC9), which `--muted-foreground` holds exactly in light. The classic theme
 *             inlines the Sass literal outside its `color-mode(dark)` block, so it stays
 *             #95AAC9 in dark too, where `--muted-foreground` follows
 *             `body-secondary-color-dark` to `gray-700` (#6E84A3) — one step darker, and the
 *             only inexact colour in this skin.
 *
 * WHAT IS DELIBERATELY NOT PORTED — three of the picker's rules describe a composition shadcn
 * does not have, so there is nothing to restate:
 *
 *   caption      `.<picker>-current-month { font-size: 115% }` sizes the month/year against
 *                the picker's own `.<picker>-calendar { font-size: 14px }`, and the plugin
 *                splits it into a 700-weight month `<span>` beside a 300-weight year `<input>`.
 *                shadcn renders one `Header` holding one caption string at `text-sm
 *                font-medium`, and `RangeCalendar.Root` exposes no class for it. Two
 *                compositions that do not line up; shadcn's is kept whole.
 *   month arrows `.<picker>-months { padding: .625rem 0 }` with the arrows pinned to
 *                `top: .625rem` is the picker's absolutely-positioned header, which shadcn
 *                already reproduces with `Nav` (`absolute inset-x-0 top-0`). The arrows keep
 *                shadcn's ghost-button hover: the classic theme's blanket
 *                `.<picker>-calendar * { color: inherit !important }` flattens the picker's own
 *                `:hover { color: #959EA9 }`, so the shipped control gives no feedback at all on
 *                the only interactive element in its header.
 *   popup chrome `box-shadow: none` and the `.arrowTop:before/:after` border colours style a
 *                floating popup. Every range calendar here is inline in a card, so neither
 *                applies — shadcn draws no shadow either, so the first is a match by default.
 *
 * This block used to live in the header of `RangeCalendarPage.svelte`. That page was retired
 * when the catalog was regrouped — its single demo was a seven-day range in a bordered box,
 * which the Calendar page already showed among its own range demos — so the research moved to
 * the file that holds the class strings it explains.
 */
export const rangeDay = cn(
	"not-data-selected:hover:bg-secondary dark:not-data-selected:hover:bg-card",
	"not-data-selected:hover:border not-data-selected:hover:border-input",
	"[&[data-today]:not([data-selected])]:border [&[data-today]:not([data-selected])]:border-border [&[data-today]:not([data-selected])]:bg-transparent",
	"data-[range-end]:hover:text-primary-foreground data-[range-start]:hover:text-primary-foreground",
);
