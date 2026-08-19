/**
 * The arithmetic behind a single-line row that collapses its leading items into an overflow
 * control when it runs out of room — the "priority plus" pattern
 * (https://jayfreestone.github.io/priority-plus/).
 *
 * This module is deliberately standalone: it imports nothing, touches no DOM and knows nothing
 * about breadcrumbs. It lives in `src/lib/shared/` (registry:lib pattern) because the shape it
 * describes — a row of items, one pinned tail, an overflow trigger, one separator repeated between
 * them — is the same for a breadcrumb, a tab strip and a toolbar. The caller measures; this module
 * only decides.
 *
 * WHY MEASUREMENTS ARE AN INPUT rather than something read here. A row that measures ITSELF is a
 * feedback loop: collapsing an item narrows the row, a narrower row re-measures, and the two states
 * flip forever. The fix is that the numbers fed in must come from a source whose width does not
 * depend on the decision — an invisible full-width copy of the row — and that `available` must be
 * the width of a box the row's own content cannot resize. Both are the caller's responsibility, and
 * both are the reason this file cannot do the measuring for it.
 *
 * WHY THE TAIL IS NOT AN ITEM. The last step of a trail is the current page, and it never collapses
 * — it truncates. React Spectrum states the same rule for its Breadcrumbs
 * (https://react-spectrum.adobe.com/react-spectrum/Breadcrumbs.html): "the last breadcrumb item
 * will automatically truncate with an ellipsis instead of collapsing into the menu". So the tail is
 * a separate field, its natural width is what {@link computeCollapsed} tries to preserve, and when
 * no arrangement can preserve it the tail is the thing that gives.
 */

/**
 * Every width one row needs, in CSS pixels, measured at NATURAL size — no truncation, no shrinking.
 *
 * All five are captured in a single pass by the caller so that no derivation can see a torn mixture
 * of two frames, the same promise `readScrollMetrics` makes in `scroll-position.svelte.ts`.
 */
export type OverflowFitMetrics = {
	/** Natural width of each collapsible item, in row order. The first is the first to collapse. */
	items: readonly number[];
	/** Natural width of the pinned trailing item — the one that truncates rather than collapses. */
	tail: number;
	/** Natural width of the control that stands in for the collapsed items. */
	trigger: number;
	/** Natural width of one separator. Every item is followed by one; the tail is not. */
	separator: number;
	/** The row's resolved `column-gap`, applied between every adjacent pair of children. */
	gap: number;
};

/**
 * All-zero seed used before the first measurement.
 *
 * With it {@link computeCollapsed} returns `0`, because a row with no items has nothing to collapse.
 * That is the ONLY reason it returns zero — "not measured yet" is a state this module deliberately
 * cannot represent, and a caller that has not measured must not call at all. Encoding it as
 * `available === 0` was tried and is wrong: zero is also a real width, reached whenever the row's
 * box is squeezed shut, and the two readings want opposite answers — show everything, or collapse
 * everything.
 */
export const EMPTY_OVERFLOW_FIT_METRICS: OverflowFitMetrics = {
	items: [],
	tail: 0,
	trigger: 0,
	separator: 0,
	gap: 0,
};

/**
 * Width of everything BEFORE the tail, for a given number of collapsed leading items.
 *
 * The row is `[slot][sep][slot][sep]…[slot][sep][tail]`, where a slot is either a kept item or —
 * when anything at all is collapsed — the single overflow trigger standing in for all of them. So
 * with `s` slots there are `s` separators and `2s` gaps, and the tail's own gap is the last of them.
 *
 * Pure, and exported rather than inlined because it is the one line of this module a caller may
 * want to check a layout against.
 */
export function leadWidth(metrics: OverflowFitMetrics, collapsed: number): number {
	const kept = metrics.items.length - collapsed;
	const slots = (collapsed > 0 ? 1 : 0) + Math.max(0, kept);
	if (slots === 0) return 0;

	let width = collapsed > 0 ? metrics.trigger : 0;
	for (let index = Math.max(0, collapsed); index < metrics.items.length; index++) {
		width += metrics.items[index];
	}

	return width + slots * metrics.separator + 2 * slots * metrics.gap;
}

/**
 * How many leading items have to collapse for the row to fit `available` pixels.
 *
 * Returns the SMALLEST number that lets the tail render at its natural width, so the row degrades
 * one step at a time and never collapses more than the space demands. Collapsing is always tried
 * before truncating — Spectrum's order, and the one every source agrees on: hiding a step behind a
 * menu keeps it reachable, whereas a truncated label is simply gone.
 *
 * WHEN NOTHING FITS the answer is the arrangement with the narrowest lead, and the tail truncates
 * inside whatever is left. That is normally "collapse everything", but not always: an overflow
 * trigger is wider than a one-character label, so a row of very short items can be narrower kept
 * than collapsed. Taking the minimum rather than assuming it costs three lines and removes the case
 * where the row would collapse itself into MORE width than it started with.
 *
 * A zero or negative `available` is a real answer, not a missing one: it means the row's box has
 * been squeezed shut, nothing fits, and everything belongs in the menu. See
 * {@link EMPTY_OVERFLOW_FIT_METRICS} for why that is not spelled "unmeasured".
 */
export function computeCollapsed(metrics: OverflowFitMetrics, available: number): number {
	const total = metrics.items.length;
	if (total === 0) return 0;

	let narrowest = 0;
	let narrowestWidth = Number.POSITIVE_INFINITY;

	for (let collapsed = 0; collapsed <= total; collapsed++) {
		const lead = leadWidth(metrics, collapsed);
		if (lead + metrics.tail <= available) return collapsed;
		if (lead < narrowestWidth) {
			narrowestWidth = lead;
			narrowest = collapsed;
		}
	}

	return narrowest;
}
