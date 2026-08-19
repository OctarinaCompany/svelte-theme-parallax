/**
 * Badge overflow has no gallery page of its own: it is consumed by the data-grid cell renderers
 * (`data-grid-file-cell`, `data-grid-multi-select-cell`) and demoed on the Data grid page.
 */

/** `lineCount` fallback — upstream `lineCount = 1`. */
export const DEFAULT_LINE_COUNT = 1;
/** `badgeGap` seed in pixels — upstream `useState(4)`, i.e. `gap-1`. */
export const DEFAULT_BADGE_GAP = 4;
/** `badgeHeight` seed in pixels — upstream `useState(20)`, i.e. `h-5`. */
export const DEFAULT_BADGE_HEIGHT = 20;
/** `overflowBadgeWidth` seed in pixels — upstream `useState(40)`, an approximate `+N` width. */
export const DEFAULT_OVERFLOW_BADGE_WIDTH = 40;
/**
 * The count the measurement row renders the overflow indicator with, so the reserved width is the
 * widest realistic `+N` — upstream `renderOverflow(99)`.
 */
export const OVERFLOW_SAMPLE_COUNT = 99;

/**
 * Resolve one item's label, verbatim from upstream's `getBadgeLabel` callback.
 *
 * The label is the identity key for width lookup, so two items sharing a label share one measured
 * width — upstream's `Map<string, number>` behaves the same way.
 *
 * @throws when `item` is an `object` and no extractor was supplied. Upstream's check is exactly
 * `typeof item === 'object'`, so a `null` item throws too (`typeof null === 'object'`); that quirk
 * is reproduced deliberately.
 */
export function resolveBadgeLabel<T>(item: T, getBadgeLabel?: (item: T) => string): string {
	if (typeof item === "object" && !getBadgeLabel) {
		throw new Error("`getBadgeLabel` is required when using array of objects");
	}
	return getBadgeLabel ? getBadgeLabel(item) : String(item);
}

/** The layout facts one measurement pass reads off the visible container. */
export type ContainerMetrics = {
	/** The gap between badges, in pixels. */
	gap: number;
	/** The container's horizontal padding, in pixels. */
	padding: number;
	/** The usable width: `clientWidth` less the horizontal padding. */
	contentWidth: number;
};

function toFinite(value: number, fallback: number): number {
	return Number.isFinite(value) ? value : fallback;
}

/**
 * Read the container's own computed spacing so consumers control it purely through styling.
 *
 * Upstream writes `const gap = gapValue ? parseFloat(gapValue) : 4`, which yields `NaN` whenever
 * `gap` computes to `normal` — a flex container with no `gap` set. The `Number.isFinite` guard here
 * keeps the documented default of `4` instead, and changes nothing in the case upstream already
 * handles.
 */
export function readContainerMetrics(element: HTMLElement): ContainerMetrics {
	const computedStyle = getComputedStyle(element);
	const gap = toFinite(Number.parseFloat(computedStyle.gap), DEFAULT_BADGE_GAP);
	const padding =
		toFinite(Number.parseFloat(computedStyle.paddingLeft), 0) +
		toFinite(Number.parseFloat(computedStyle.paddingRight), 0);

	return { gap, padding, contentWidth: element.clientWidth - padding };
}

/** The ordered subset of items that fits, plus how many were left out. */
export type BadgeOverflowSplit<T> = {
	visibleItems: T[];
	hiddenCount: number;
};

export type ComputeVisibleSplitOptions<T> = {
	/** Every item, in order. */
	items: T[];
	/** `items[i]`'s resolved label, same length and order as `items`. */
	labels: string[];
	/** Measured badge width per label. */
	badgeWidths: ReadonlyMap<string, number>;
	/** The container's usable width, in pixels. */
	containerWidth: number;
	/** The gap between badges, in pixels. */
	badgeGap: number;
	/** The measured width of the overflow indicator, in pixels. */
	overflowBadgeWidth: number;
	/** Maximum number of lines to fill. */
	lineCount: number;
};

/**
 * Upstream's line-fitting loop, transliterated. Pure, so it is unit-testable without a DOM.
 *
 * Two upstream properties are load-bearing and reproduced exactly:
 *
 * - only the **last** line reserves room for the indicator, and only while items remain after the
 *   one being placed — so the final item is always measured against the full width and the
 *   indicator can wrap;
 * - a falsy item, and a label measured at `0`, are both **skipped** rather than counted as visible,
 *   while still counting toward `items.length` and therefore toward `hiddenCount`.
 */
export function computeVisibleSplit<T>(
	options: ComputeVisibleSplitOptions<T>,
): BadgeOverflowSplit<T> {
	const { items, labels, badgeWidths, containerWidth, badgeGap, overflowBadgeWidth, lineCount } =
		options;

	if (!containerWidth || items.length === 0 || badgeWidths.size === 0) {
		return { visibleItems: items, hiddenCount: 0 };
	}

	let currentLineWidth = 0;
	let currentLine = 1;
	const visible: T[] = [];

	for (let index = 0; index < items.length; index++) {
		const item = items[index];
		if (!item) continue;

		const badgeWidth = badgeWidths.get(labels[index]);
		if (!badgeWidth) continue;

		const widthWithGap = badgeWidth + badgeGap;
		const isLastLine = currentLine === lineCount;
		const hasMoreItems = index < items.length - 1;

		const availableWidth =
			isLastLine && hasMoreItems ? containerWidth - overflowBadgeWidth - badgeGap : containerWidth;

		if (currentLineWidth + widthWithGap <= availableWidth) {
			currentLineWidth += widthWithGap;
			visible.push(item);
		} else if (currentLine < lineCount) {
			currentLine++;
			currentLineWidth = widthWithGap;
			visible.push(item);
		} else {
			// We're on the last line and this badge doesn't fit.
			break;
		}
	}

	return { visibleItems: visible, hiddenCount: Math.max(0, items.length - visible.length) };
}

/**
 * How many badges the pre-measurement placeholder shows — upstream's
 * `Math.min(items.length, lineCount * 3 - (lineCount > 1 ? 1 : 0))`.
 */
export function getPlaceholderCount(itemCount: number, lineCount: number): number {
	return Math.min(itemCount, lineCount * 3 - (lineCount > 1 ? 1 : 0));
}

/** The pre-measurement `min-height` guess, so the first paint does not shift much. */
export function getPlaceholderHeight(
	badgeHeight: number,
	badgeGap: number,
	lineCount: number,
): number {
	return badgeHeight * lineCount + badgeGap * (lineCount - 1);
}

/**
 * Observe `element`'s box and return a teardown that disconnects the observer.
 *
 * SSR-guarded: with no `window` or no `ResizeObserver` it observes nothing and returns a no-op
 * teardown, so a caller never has to branch. Exported so later measurement-driven ports compose it
 * instead of re-deriving it.
 */
export function observeResize(element: HTMLElement, onResize: () => void): () => void {
	if (typeof window === "undefined" || typeof ResizeObserver === "undefined") {
		return () => {};
	}

	const observer = new ResizeObserver(() => onResize());
	observer.observe(element);

	return () => observer.disconnect();
}

/** One item paired with its resolved label. */
export type BadgeOverflowEntry<T> = {
	readonly item: T;
	readonly label: string;
};

export type BadgeOverflowStateProps<T> = {
	readonly getItems: () => T[];
	readonly getGetBadgeLabel: () => ((item: T) => string) | undefined;
	readonly getLineCount: () => number;
};

/**
 * The seed for {@link BadgeOverflowState.badgeWidths} and its shadow. Built here rather than inside
 * the class because a measured width map is only ever *replaced*, never mutated — the type says so,
 * and constructing it outside the exported declaration keeps that promise checkable.
 */
const NO_WIDTHS: ReadonlyMap<string, number> = new Map();

/** Build an immutable width map from measured `[label, width]` pairs. */
function toWidthMap(measured: Array<[string, number]>): ReadonlyMap<string, number> {
	// A repeated label keeps its last measurement, exactly as upstream's repeated `set()` does.
	return new Map(measured);
}

function sameWidths(a: ReadonlyMap<string, number>, b: ReadonlyMap<string, number>): boolean {
	if (a.size !== b.size) return false;
	for (const [label, width] of a) {
		if (b.get(label) !== width) return false;
	}
	return true;
}

/**
 * One instance per `<BadgeOverflow>` root.
 *
 * Holds the six measured metrics — written only by {@link BadgeOverflowState.measure} — and derives
 * everything else. The read set of `measure()` (the item list and the label extractor) and its write
 * set (the metrics) are disjoint, so the root's single `$effect` never re-schedules itself from its
 * own writes and needs no `untrack()`.
 */
export class BadgeOverflowState<T> {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: BadgeOverflowStateProps<T>;

	/** The container's usable width in pixels; `0` until the first pass. */
	containerWidth: number = $state(0);
	/** The measured gap between badges, in pixels. */
	badgeGap: number = $state(DEFAULT_BADGE_GAP);
	/** The measured height of one badge, in pixels. */
	badgeHeight: number = $state(DEFAULT_BADGE_HEIGHT);
	/** The measured width of the overflow indicator, in pixels. */
	overflowBadgeWidth: number = $state(DEFAULT_OVERFLOW_BADGE_WIDTH);
	/** Measured badge width per label. Replaced wholesale, never mutated. */
	badgeWidths: ReadonlyMap<string, number> = $state.raw(NO_WIDTHS);
	/** `true` once the first pass completed. Never reset — upstream never resets it either. */
	isMeasured: boolean = $state(false);

	/** A non-reactive shadow of {@link badgeWidths}, so `measure()` reads no state it writes. */
	#lastWidths: ReadonlyMap<string, number> = NO_WIDTHS;

	readonly items: T[] = $derived(this.#props.getItems());
	readonly lineCount: number = $derived(this.#props.getLineCount());

	readonly entries: BadgeOverflowEntry<T>[] = $derived.by(() => {
		const getBadgeLabel = this.#props.getGetBadgeLabel();
		return this.items.map((item) => ({ item, label: resolveBadgeLabel(item, getBadgeLabel) }));
	});
	readonly labels: string[] = $derived.by(() => this.entries.map((entry) => entry.label));

	readonly #split: BadgeOverflowSplit<T> = $derived.by(() =>
		computeVisibleSplit({
			items: this.items,
			labels: this.labels,
			badgeWidths: this.badgeWidths,
			containerWidth: this.containerWidth,
			badgeGap: this.badgeGap,
			overflowBadgeWidth: this.overflowBadgeWidth,
			lineCount: this.lineCount,
		}),
	);
	readonly visibleItems: T[] = $derived(this.#split.visibleItems);
	readonly hiddenCount: number = $derived(this.#split.hiddenCount);
	readonly visibleEntries: BadgeOverflowEntry<T>[] = $derived.by(() => {
		const getBadgeLabel = this.#props.getGetBadgeLabel();
		return this.visibleItems.map((item) => ({
			item,
			label: resolveBadgeLabel(item, getBadgeLabel),
		}));
	});

	readonly placeholderItems: T[] = $derived.by(() =>
		this.items.slice(0, getPlaceholderCount(this.items.length, this.lineCount)),
	);
	readonly placeholderEntries: BadgeOverflowEntry<T>[] = $derived.by(() =>
		this.entries.slice(0, getPlaceholderCount(this.items.length, this.lineCount)),
	);
	readonly placeholderHeight: number = $derived(
		getPlaceholderHeight(this.badgeHeight, this.badgeGap, this.lineCount),
	);

	readonly isEmpty: boolean = $derived(this.items.length === 0);

	constructor(props: BadgeOverflowStateProps<T>) {
		this.#props = props;
	}

	/**
	 * One measurement pass over the already-rendered measurement row, upstream's
	 * `measureContainer()`. Every DOM read happens before the first write.
	 *
	 * @param root the visible container, whose computed spacing and `clientWidth` set the budget
	 * @param measureRow the invisible row holding one badge per item plus the overflow sample
	 */
	measure(root: HTMLElement, measureRow: HTMLElement): void {
		const items = this.#props.getItems();
		const getBadgeLabel = this.#props.getGetBadgeLabel();
		const { gap, contentWidth } = readContainerMetrics(root);
		const children = measureRow.children;

		const measured: Array<[string, number]> = [];
		for (const [index, item] of items.entries()) {
			const child = children.item(index);
			if (!(child instanceof HTMLElement)) continue;
			measured.push([resolveBadgeLabel(item, getBadgeLabel), child.offsetWidth]);
		}
		const widths = toWidthMap(measured);

		const firstBadge = children.item(0);
		const overflowSample = children.item(items.length);

		this.badgeGap = gap;
		if (!sameWidths(this.#lastWidths, widths)) {
			this.#lastWidths = widths;
			this.badgeWidths = widths;
		}
		if (firstBadge instanceof HTMLElement) {
			this.badgeHeight = firstBadge.offsetHeight || DEFAULT_BADGE_HEIGHT;
		}
		if (overflowSample instanceof HTMLElement) {
			this.overflowBadgeWidth = overflowSample.offsetWidth || DEFAULT_OVERFLOW_BADGE_WIDTH;
		}
		this.containerWidth = contentWidth;
		this.isMeasured = true;
	}
}
