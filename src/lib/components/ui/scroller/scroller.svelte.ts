import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import {
	computeAxisOverflow,
	EMPTY_SCROLL_METRICS,
	readScrollMetrics,
	type AxisOverflow,
	type ScrollMetrics,
} from "$lib/shared/scroll-position.svelte.js";
import { getContext, hasContext, setContext } from "svelte";

/** The scroll axis the component drives. Upstream `scrollerVariants.orientation`. */
export const SCROLLER_ORIENTATIONS = ["vertical", "horizontal"] as const;
export type ScrollerOrientation = (typeof SCROLLER_ORIENTATIONS)[number];

/** How a navigation button turns an interaction into scrolling. Upstream `scrollTriggerMode`. */
export const SCROLLER_TRIGGER_MODES = ["press", "hover", "click"] as const;
export type ScrollerTriggerMode = (typeof SCROLLER_TRIGGER_MODES)[number];

/** Every direction a navigation button can point at. Upstream `ScrollDirection`. */
export const SCROLL_DIRECTIONS = ["up", "down", "left", "right"] as const;
export type ScrollDirection = (typeof SCROLL_DIRECTIONS)[number];

/** Milliseconds between two auto-scroll steps while a button is held or hovered. Upstream `50`. */
export const AUTO_SCROLL_INTERVAL = 50;

/** `orientation` fallback — upstream `orientation = "vertical"`. */
export const DEFAULT_ORIENTATION: ScrollerOrientation = "vertical";
/** `hideScrollbar` fallback — upstream `defaultVariants.hideScrollbar = false`. */
export const DEFAULT_HIDE_SCROLLBAR = false;
/** `size` fallback in pixels — upstream `size = 40`. */
export const DEFAULT_SIZE = 40;
/** `offset` fallback in pixels — upstream `offset = 0`. */
export const DEFAULT_OFFSET = 0;
/** `withNavigation` fallback — upstream `withNavigation = false`. */
export const DEFAULT_WITH_NAVIGATION = false;
/** `scrollStep` fallback in pixels — upstream `scrollStep = 40`. */
export const DEFAULT_SCROLL_STEP = 40;
/** `scrollTriggerMode` fallback — upstream `scrollTriggerMode = "press"`. */
export const DEFAULT_SCROLL_TRIGGER_MODE: ScrollerTriggerMode = "press";

/** The six mask attributes, derived as one object so no intermediate combination can be observed. */
export type ScrollerEdgeAttributes = {
	"data-top-scroll": "true" | undefined;
	"data-bottom-scroll": "true" | undefined;
	"data-top-bottom-scroll": "true" | undefined;
	"data-left-scroll": "true" | undefined;
	"data-right-scroll": "true" | undefined;
	"data-left-right-scroll": "true" | undefined;
};

/** Which directions currently hide content, regardless of whether navigation is enabled. */
export type ScrollerNavigationVisibility = Record<ScrollDirection, boolean>;

export type ScrollerStateProps = {
	readonly getOrientation: () => ScrollerOrientation;
	readonly getSize: () => number;
	readonly getOffset: () => number;
	readonly getScrollStep: () => number;
	readonly getWithNavigation: () => boolean;
	readonly getScrollTriggerMode: () => ScrollerTriggerMode;
	/** The direction already resolved by `useDirection()` — override, provider, DOM, then `ltr`. */
	readonly getDir: () => Direction;
};

/**
 * One instance per `<Scroller.Root>`, published on a `Symbol` context key.
 *
 * Upstream mutates the DOM from a layout effect (`container.setAttribute(DATA_TOP_SCROLL, "true")`)
 * because React cannot re-render from a scroll event without a state write per frame. Here a single
 * `metrics` write feeds every attribute through `$derived`, so the attributes are part of the
 * rendered markup — which is what lets `child`-mode consumers and SSR see them too.
 */
export class ScrollerState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: ScrollerStateProps;

	/** The measured element: the component's own `<div>`, or the consumer's in `child` mode. */
	element: HTMLElement | null = $state(null);

	#metrics: ScrollMetrics = $state.raw(EMPTY_SCROLL_METRICS);

	/** The latest measurement snapshot. Replaced wholesale by {@link setMetrics}, never mutated. */
	get metrics(): ScrollMetrics {
		return this.#metrics;
	}

	readonly orientation: ScrollerOrientation = $derived(this.#props.getOrientation());
	readonly isVertical: boolean = $derived(this.orientation === "vertical");
	readonly isRtl: boolean = $derived(this.#props.getDir() === "rtl");
	readonly offset: number = $derived(this.#props.getOffset());
	readonly triggerMode: ScrollerTriggerMode = $derived(this.#props.getScrollTriggerMode());

	readonly vertical: AxisOverflow = $derived(
		computeAxisOverflow(this.#metrics, "vertical", {
			offset: this.offset,
			dir: this.#props.getDir(),
		}),
	);
	readonly horizontal: AxisOverflow = $derived(
		computeAxisOverflow(this.#metrics, "horizontal", {
			offset: this.offset,
			dir: this.#props.getDir(),
		}),
	);

	/** Upstream `hasTopScroll` (L149), gated on the orientation exactly as upstream gates it (L128). */
	readonly hasTopScroll: boolean = $derived(
		this.isVertical && this.vertical.startDistance > this.offset,
	);
	/** Upstream `hasBottomScroll && isVerticallyScrollable` (L150–152). */
	readonly hasBottomScroll: boolean = $derived(
		this.isVertical && this.vertical.endDistance > this.offset && this.vertical.scrollable,
	);

	/** Hidden content toward the content's logical start. Upstream's raw `hasLeftScroll` (L188). */
	readonly hasStartScroll: boolean = $derived(this.horizontal.startDistance > this.offset);
	/** Hidden content toward the content's logical end. Upstream's raw `hasRightScroll` (L189–190). */
	readonly hasEndScroll: boolean = $derived(
		this.horizontal.endDistance > this.offset && this.horizontal.scrollable,
	);

	// The mask is physical — `data-[left-scroll=true]` fades the left edge — so the attribute names
	// stay physical while which logical end they represent flips under RTL (divergence D-01).
	readonly hasLeftScroll: boolean = $derived(this.isRtl ? this.hasEndScroll : this.hasStartScroll);
	readonly hasRightScroll: boolean = $derived(this.isRtl ? this.hasStartScroll : this.hasEndScroll);

	/**
	 * Upstream's combined/separate branching (L154–203), reproduced per axis: when both ends are open
	 * the two single attributes are removed and one combined attribute is set, so the mask is a single
	 * continuous fade rather than two overlapping ones.
	 */
	readonly edgeAttributes: ScrollerEdgeAttributes = $derived.by(() => {
		const verticalBoth = this.hasTopScroll && this.hasBottomScroll && this.vertical.scrollable;
		const horizontalBoth = this.hasLeftScroll && this.hasRightScroll && this.horizontal.scrollable;

		return {
			"data-top-scroll": !verticalBoth && this.hasTopScroll ? "true" : undefined,
			"data-bottom-scroll": !verticalBoth && this.hasBottomScroll ? "true" : undefined,
			"data-top-bottom-scroll": verticalBoth ? "true" : undefined,
			"data-left-scroll": !horizontalBoth && this.hasLeftScroll ? "true" : undefined,
			"data-right-scroll": !horizontalBoth && this.hasRightScroll ? "true" : undefined,
			"data-left-right-scroll": horizontalBoth ? "true" : undefined,
		};
	});

	/**
	 * Upstream's `scrollVisibility` (L134–136, L173–175). Note the deliberate asymmetry: the leading
	 * direction applies `offset`, the trailing one does not (`scrollTop + clientHeight <
	 * scrollHeight`). Reproduced verbatim rather than symmetrised.
	 */
	readonly navigation: ScrollerNavigationVisibility = $derived.by(() => {
		const hasStart = this.horizontal.startDistance > this.offset;
		const hasEnd = this.horizontal.endDistance > 0;

		return {
			up: this.isVertical && this.vertical.startDistance > this.offset,
			down: this.isVertical && this.vertical.endDistance > 0,
			left: this.isRtl ? hasEnd : hasStart,
			right: this.isRtl ? hasStart : hasEnd,
		};
	});

	/** The pair of directions navigation could render for the active orientation (upstream L224–227). */
	readonly activeDirections: ScrollDirection[] = $derived.by((): ScrollDirection[] => {
		if (!this.#props.getWithNavigation()) return [];
		return this.isVertical ? ["up", "down"] : ["left", "right"];
	});

	/** Of those, the ones that currently hide content (upstream L246–247). */
	readonly visibleDirections: ScrollDirection[] = $derived(
		this.activeDirections.filter((direction) => this.navigation[direction]),
	);

	/** The `--scroll-shadow-size` declaration every mask gradient reads (upstream L216–222). */
	readonly customProperty: string = $derived(`--scroll-shadow-size: ${this.#props.getSize()}px;`);

	constructor(props: ScrollerStateProps) {
		this.#props = props;
	}

	/** Store one snapshot. The only writer, so no reader ever needs `untrack()`. */
	setMetrics(metrics: ScrollMetrics): void {
		this.#metrics = metrics;
	}

	/** Measure {@link element} now. A no-op while no element is registered. */
	measure(): void {
		if (!this.element) return;
		this.setMetrics(readScrollMetrics(this.element));
	}

	/**
	 * Move the container one `scrollStep` toward `direction`, then re-measure so the cues and button
	 * visibility follow immediately rather than waiting for the element's own `scroll` event.
	 *
	 * Upstream's map (L97–104) is already direction-agnostic: decreasing `scrollLeft` moves the
	 * viewport toward the physical left in both scroll models, so only *visibility* flips under RTL.
	 */
	scrollByStep(direction: ScrollDirection): void {
		const element = this.element;
		if (!element) return;

		const step = this.#props.getScrollStep();
		switch (direction) {
			case "up":
				element.scrollTop -= step;
				break;
			case "down":
				element.scrollTop += step;
				break;
			case "left":
				element.scrollLeft -= step;
				break;
			case "right":
				element.scrollLeft += step;
				break;
		}

		this.measure();
	}
}

const SCROLLER_CONTEXT_KEY = Symbol("scroller");

export function setScrollerContext(state: ScrollerState): ScrollerState {
	return setContext(SCROLLER_CONTEXT_KEY, state);
}

/**
 * Read the root's state, throwing when there is no `<Scroller.Root>` ancestor.
 *
 * `consumerName` is the file name (`'scroller-button.svelte'`) rather than a `<Scroller.Button>`
 * spelling, because the navigation button is deliberately not exported from the barrel — naming a
 * part a consumer cannot import would make the message misleading.
 */
export function getScrollerContext(consumerName: string): ScrollerState {
	if (!hasContext(SCROLLER_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Scroller.Root>\`.`);
	}
	return getContext<ScrollerState>(SCROLLER_CONTEXT_KEY);
}
