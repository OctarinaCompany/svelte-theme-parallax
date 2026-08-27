/**
 * Reusable scroll-position and overflow detection.
 *
 * This module is deliberately standalone: it imports nothing from any component folder, and knows
 * nothing about masks, direction context or markup. It lives in `src/lib/shared/` (registry:lib
 * pattern): consumed by `scroller` (which also re-exports it from its barrel) and
 * `scroll-spy`, kept out of any one component's folder so a registry install of one consumer does
 * not drag in the other. `readScrollMetrics`, `computeAxisOverflow` and `observeScrollPosition` are
 * the stability promise to those consumers — changing their signatures is a breaking change.
 */

/** Which axis a measurement is reduced along. */
export type ScrollAxis = "vertical" | "horizontal";

/**
 * One measurement snapshot: every number upstream reads off the container, captured in a single pass
 * so no derivation can see a torn mixture of two frames.
 */
export type ScrollMetrics = {
	scrollTop: number;
	scrollLeft: number;
	clientWidth: number;
	clientHeight: number;
	scrollWidth: number;
	scrollHeight: number;
};

/**
 * All-zero seed used before the first measurement. With it every overflow predicate is `false`, so
 * the first paint shows no edge cue and no navigation button — correct, since nothing is yet known
 * to overflow.
 */
export const EMPTY_SCROLL_METRICS: ScrollMetrics = {
	scrollTop: 0,
	scrollLeft: 0,
	clientWidth: 0,
	clientHeight: 0,
	scrollWidth: 0,
	scrollHeight: 0,
};

/**
 * Read all six values in one pass. Pure — no layout writes — and returns a fresh object every call,
 * so a stored snapshot can never be mutated underneath its reader.
 */
export function readScrollMetrics(element: HTMLElement): ScrollMetrics {
	return {
		scrollTop: element.scrollTop,
		scrollLeft: element.scrollLeft,
		clientWidth: element.clientWidth,
		clientHeight: element.clientHeight,
		scrollWidth: element.scrollWidth,
		scrollHeight: element.scrollHeight,
	};
}

/** One axis' logical overflow state, independent of any visual treatment. */
export type AxisOverflow = {
	/** Whether the axis has any hidden content at all. */
	scrollable: boolean;
	/** Pixels already scrolled away from the content's start. */
	startDistance: number;
	/** Pixels still hidden beyond the content's end. */
	endDistance: number;
	/** Whether {@link startDistance} is within `offset` of the start. */
	atStart: boolean;
	/** Whether {@link endDistance} is within `offset` of the end. */
	atEnd: boolean;
};

export type ComputeAxisOverflowOptions = {
	/**
	 * Hidden content must exceed this many pixels to count as "away from" a boundary.
	 * @default 0
	 */
	offset?: number;
	/**
	 * Resolved text direction. Only meaningful for the horizontal axis, and only as documentation of
	 * intent: the `Math.abs` normalisation below already covers both the left-to-right (`scrollLeft`
	 * counts up from `0`) and the CSS-standard right-to-left (`scrollLeft` counts down from `0` to
	 * `-(scrollWidth - clientWidth)`) models, so no browser-model sniffing is needed.
	 * @default 'ltr'
	 */
	dir?: "ltr" | "rtl";
};

/**
 * Pure reduction of a snapshot to one axis' logical overflow state.
 *
 * Two invariants hold for every input: `startDistance + endDistance === max(0, scrollSize -
 * clientSize)`, and `scrollable === false` implies both distances are `0` and both boundary flags
 * are `true`.
 */
export function computeAxisOverflow(
	metrics: ScrollMetrics,
	axis: ScrollAxis,
	options: ComputeAxisOverflowOptions = {},
): AxisOverflow {
	const { offset = 0 } = options;

	const isVertical = axis === "vertical";
	const scrollSize = isVertical ? metrics.scrollHeight : metrics.scrollWidth;
	const clientSize = isVertical ? metrics.clientHeight : metrics.clientWidth;

	const scrollable = scrollSize > clientSize;
	const maxDistance = Math.max(0, scrollSize - clientSize);
	const startDistance = scrollable
		? isVertical
			? metrics.scrollTop
			: Math.abs(metrics.scrollLeft)
		: 0;
	const endDistance = maxDistance - startDistance;

	return {
		scrollable,
		startDistance,
		endDistance,
		atStart: startDistance <= offset,
		atEnd: endDistance <= offset,
	};
}

/**
 * Subscribe to everything that can change the metrics and report a fresh snapshot on each of them:
 * the element's own `scroll`, a `ResizeObserver` on the element **and on each of its element
 * children** (kept current by a `MutationObserver` on `childList`), and `window`'s `resize`.
 * Measures once eagerly, so a page that never scrolls or resizes still gets its first snapshot.
 *
 * The children are observed because a scroller usually has a fixed size — its own box never changes
 * when a late-loading image or a newly added card grows the content, so observing only the container
 * would leave a stale edge cue (divergence D-02).
 *
 * SSR-guarded: with no `window` it subscribes to nothing and returns a no-op teardown, so a caller
 * never has to branch. The returned teardown removes all four subscriptions.
 */
export function observeScrollPosition(
	element: HTMLElement,
	onChange: (metrics: ScrollMetrics) => void,
): () => void {
	if (typeof window === "undefined") return () => {};

	function measure(): void {
		onChange(readScrollMetrics(element));
	}

	element.addEventListener("scroll", measure);
	window.addEventListener("resize", measure);

	let resizeObserver: ResizeObserver | undefined;
	let mutationObserver: MutationObserver | undefined;

	if (typeof ResizeObserver !== "undefined") {
		const observer = new ResizeObserver(measure);
		resizeObserver = observer;

		const observeTree = () => {
			observer.disconnect();
			observer.observe(element);
			for (const child of Array.from(element.children)) observer.observe(child);
		};
		observeTree();

		if (typeof MutationObserver !== "undefined") {
			mutationObserver = new MutationObserver(() => {
				observeTree();
				measure();
			});
			mutationObserver.observe(element, { childList: true });
		}
	}

	measure();

	return () => {
		element.removeEventListener("scroll", measure);
		window.removeEventListener("resize", measure);
		resizeObserver?.disconnect();
		mutationObserver?.disconnect();
	};
}

export type ScrollPositionStateOptions = {
	/** Threshold in pixels handed to {@link computeAxisOverflow}. */
	getOffset?: () => number;
	/** Resolved text direction handed to {@link computeAxisOverflow}. */
	getDir?: () => "ltr" | "rtl";
};

/**
 * Optional runes wrapper around the three functions above: assign `.element`, call `.measure()` (or
 * wire {@link observeScrollPosition} to `.setMetrics`), then read `.metrics` / `.vertical` /
 * `.horizontal` reactively.
 *
 * NOTHING IN THIS REPOSITORY USES IT, and that is deliberate rather than an oversight: `Scroller`
 * needs the mask-specific derivations in `ScrollerState`, and `ScrollSpy` needs its own section
 * bookkeeping, so both reach for the three functions above instead. The class is kept because the
 * module is published as `registry:lib` and a consumer whose only question is "is this element
 * scrolled, and how far" should not have to rewrite the plumbing to ask it.
 */
export class ScrollPositionState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#options!: ScrollPositionStateOptions | undefined;

	/** The observed element. Assign it once the DOM exists; `null` disables measurement. */
	element: HTMLElement | null = $state(null);

	#metrics: ScrollMetrics = $state.raw(EMPTY_SCROLL_METRICS);

	/** The latest snapshot. Replaced wholesale by {@link setMetrics}, never mutated. */
	get metrics(): ScrollMetrics {
		return this.#metrics;
	}

	readonly vertical: AxisOverflow = $derived(
		computeAxisOverflow(this.#metrics, "vertical", {
			offset: this.#options?.getOffset?.(),
			dir: this.#options?.getDir?.(),
		}),
	);
	readonly horizontal: AxisOverflow = $derived(
		computeAxisOverflow(this.#metrics, "horizontal", {
			offset: this.#options?.getOffset?.(),
			dir: this.#options?.getDir?.(),
		}),
	);

	constructor(options?: ScrollPositionStateOptions) {
		this.#options = options;
	}

	/** Store one snapshot. The only writer, so no reader ever needs `untrack()`. */
	setMetrics(metrics: ScrollMetrics): void {
		this.#metrics = metrics;
	}

	/** Measure {@link element} now. A no-op while no element is assigned. */
	measure(): void {
		if (!this.element) return;
		this.setMetrics(readScrollMetrics(this.element));
	}
}
