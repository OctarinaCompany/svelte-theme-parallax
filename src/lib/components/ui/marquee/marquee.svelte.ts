import { getContext, hasContext, setContext } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

/** Which edge the content scrolls toward. Upstream `Side`. */
export const MARQUEE_SIDES = ["left", "right", "top", "bottom"] as const;
export type MarqueeSide = (typeof MARQUEE_SIDES)[number];

/** Scroll axis implied by {@link MarqueeSide}. Upstream `Orientation`. */
export const MARQUEE_ORIENTATIONS = ["horizontal", "vertical"] as const;
export type MarqueeOrientation = (typeof MARQUEE_ORIENTATIONS)[number];

/** How much of the container the edge gradient covers. Upstream `marqueeEdgeVariants.size`. */
export const MARQUEE_EDGE_SIZES = ["default", "sm", "lg"] as const;
export type MarqueeEdgeSize = (typeof MARQUEE_EDGE_SIZES)[number];

/** Upstream's inline `side === 'top' || side === 'bottom' ? 'vertical' : 'horizontal'`. */
export function sideToOrientation(side: MarqueeSide): MarqueeOrientation {
	return side === "top" || side === "bottom" ? "vertical" : "horizontal";
}

/**
 * Normalise `gap` to a CSS length.
 *
 * Upstream writes the raw value into `--marquee-gap`, so `gap={16}` emits the unitless `16`, which is
 * not a valid length — `gap-(--marquee-gap)` then collapses. The documented type is
 * `string | number` with "numbers in pixels", so a number becomes `px` here (research, `gap` note).
 */
export function resolveGap(gap: string | number): string {
	return typeof gap === "number" ? `${gap}px` : gap;
}

/**
 * Upstream's `--marquee-loop-count` expression: `0` and `Infinity` both mean "forever". Any
 * non-finite value is treated as `Infinity` rather than stringified, since `"Infinity"` and `"NaN"`
 * are both invalid `animation-iteration-count` values.
 */
export function resolveLoopCount(loopCount: number): string {
	if (loopCount === 0 || !Number.isFinite(loopCount)) return "infinite";
	return String(loopCount);
}

export type DurationInput = {
	/** The container's size along the scroll axis, in px. `0` means "not measured yet". */
	rootSize: number;
	/** The content track's size along the scroll axis, in px. `0` means "not measured yet". */
	contentSize: number;
	/** Pixels per second. */
	speed: number;
	autoFill: boolean;
};

/**
 * How many times {@link MarqueeContent}'s children are repeated per track — upstream's `multiplier`
 * memo, including its `contentSize === 0` guard.
 */
export function computeAutoFillMultiplier(
	rootSize: number,
	contentSize: number,
	autoFill: boolean,
): number {
	if (!autoFill || contentSize === 0) return 1;
	return contentSize < rootSize ? Math.ceil(rootSize / contentSize) : 1;
}

/**
 * The animation duration in seconds — upstream's `duration` memo.
 *
 * Upstream keys its "not measured" branch on `dimensions === null` (no `ResizeObserver` entry yet);
 * a zero size is the equivalent here and additionally covers a container with zero measured size
 * without dividing by zero. `speed` is floored at `0.001`, exactly as upstream does, so `speed={0}`
 * and a negative `speed` still yield a finite positive duration.
 */
export function computeMarqueeDuration(input: DurationInput): number {
	const { rootSize, contentSize, speed, autoFill } = input;
	const safeSpeed = Math.max(0.001, speed);

	if (rootSize === 0 || contentSize === 0) {
		return (autoFill ? 1000 : 2000) / safeSpeed;
	}

	if (autoFill) {
		const multiplier = computeAutoFillMultiplier(rootSize, contentSize, true);
		return (contentSize * multiplier) / safeSpeed;
	}

	return contentSize < rootSize ? rootSize / safeSpeed : contentSize / safeSpeed;
}

/** One measurement pass over the root container and the content track. */
export type MarqueeSizes = {
	rootWidth: number;
	rootHeight: number;
	contentWidth: number;
	contentHeight: number;
};

function readSizes(root: HTMLElement, content: HTMLElement): MarqueeSizes {
	const rootRect = root.getBoundingClientRect();
	const contentRect = content.getBoundingClientRect();
	return {
		rootWidth: rootRect.width,
		rootHeight: rootRect.height,
		contentWidth: contentRect.width,
		contentHeight: contentRect.height,
	};
}

/**
 * Observe both boxes with a single `ResizeObserver` and report all four sizes on every change, plus
 * once eagerly so a page that never resizes still measures (upstream measures at the end of
 * `observe()` too). Returns a teardown that disconnects the observer.
 *
 * SSR-guarded: with no `window` or no `ResizeObserver` it observes nothing and returns a no-op
 * teardown, so a caller never has to branch. Exported so later size-driven ports compose it — it is
 * the axis-aware, two-element counterpart to badge-overflow's single-element `observeResize`.
 */
export function observeMarqueeSizes(
	root: HTMLElement,
	content: HTMLElement,
	onResize: (sizes: MarqueeSizes) => void,
): () => void {
	if (typeof window === "undefined" || typeof ResizeObserver === "undefined") {
		return () => {};
	}

	const observer = new ResizeObserver(() => onResize(readSizes(root, content)));
	observer.observe(root);
	observer.observe(content);
	onResize(readSizes(root, content));

	return () => observer.disconnect();
}

export type MarqueeStateProps = {
	readonly getSide: () => MarqueeSide;
	readonly getDir: () => Direction;
	readonly getSpeed: () => number;
	readonly getDelay: () => number;
	readonly getLoopCount: () => number;
	readonly getGap: () => string | number;
	readonly getAutoFill: () => boolean;
	readonly getPauseOnHover: () => boolean;
	readonly getPauseOnKeyboard: () => boolean;
	readonly getReverse: () => boolean;
};

/**
 * One instance per `<Marquee.Root>`, published on context. Replaces upstream's `MarqueeContext`
 * value together with its module-global `createResizeObserverStore`: `$state` already is the bridge
 * React needed `useSyncExternalStore` for, so the measurement is per root instance with no ref
 * counting and no snapshot cache.
 */
export class MarqueeState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: MarqueeStateProps;

	/** The keyboard pause flag. Internal by design — upstream exposes no `paused` prop. */
	paused: boolean = $state(false);
	/** Measured container width in px; `0` until the first measurement pass. */
	rootWidth: number = $state(0);
	/** Measured container height in px; `0` until the first measurement pass. */
	rootHeight: number = $state(0);
	/** Measured track width in px; `0` until the first measurement pass. */
	contentWidth: number = $state(0);
	/** Measured track height in px; `0` until the first measurement pass. */
	contentHeight: number = $state(0);

	/** The root element, registered by `<Marquee.Root>` so the content can observe it. */
	rootElement: HTMLElement | null = $state(null);

	readonly side: MarqueeSide = $derived(this.#props.getSide());
	readonly dir: Direction = $derived(this.#props.getDir());
	readonly orientation: MarqueeOrientation = $derived(sideToOrientation(this.side));
	readonly isVertical: boolean = $derived(this.orientation === "vertical");
	readonly isRtl: boolean = $derived(this.dir === "rtl");

	readonly rootSize: number = $derived(this.isVertical ? this.rootHeight : this.rootWidth);
	readonly contentSize: number = $derived(this.isVertical ? this.contentHeight : this.contentWidth);

	readonly autoFill: boolean = $derived(this.#props.getAutoFill());
	readonly duration: number = $derived(
		computeMarqueeDuration({
			rootSize: this.rootSize,
			contentSize: this.contentSize,
			speed: this.#props.getSpeed(),
			autoFill: this.autoFill,
		}),
	);
	readonly multiplier: number = $derived(
		computeAutoFillMultiplier(this.rootSize, this.contentSize, this.autoFill),
	);

	readonly gapValue: string = $derived(resolveGap(this.#props.getGap()));
	readonly loopCountValue: string = $derived(resolveLoopCount(this.#props.getLoopCount()));
	readonly pauseOnHover: boolean = $derived(this.#props.getPauseOnHover());
	readonly pauseOnKeyboard: boolean = $derived(this.#props.getPauseOnKeyboard());
	readonly reverse: boolean = $derived(this.#props.getReverse());

	/** The four custom properties the root publishes, as a CSS declaration string. */
	readonly customProperties: string = $derived(
		[
			`--marquee-duration: ${this.duration}s;`,
			`--marquee-gap: ${this.gapValue};`,
			`--marquee-delay: ${this.#props.getDelay()}s;`,
			`--marquee-loop-count: ${this.loopCountValue};`,
		].join(" "),
	);

	constructor(props: MarqueeStateProps) {
		this.#props = props;
	}

	/**
	 * Store one measurement pass. The only writer of the four measured fields, so the content's
	 * `$effect` never reads a value it writes and needs no `untrack()`.
	 */
	setSizes(sizes: MarqueeSizes): void {
		this.rootWidth = sizes.rootWidth;
		this.rootHeight = sizes.rootHeight;
		this.contentWidth = sizes.contentWidth;
		this.contentHeight = sizes.contentHeight;
	}

	togglePaused(): void {
		this.paused = !this.paused;
	}

	/** Upstream's `onKeyDown`: Space toggles the pause flag, and only when `pauseOnKeyboard`. */
	onkeydown(event: KeyboardEvent): void {
		if (!this.pauseOnKeyboard || event.key !== " ") return;
		event.preventDefault();
		this.togglePaused();
	}
}

const MARQUEE_CONTEXT_KEY = Symbol("marquee");

export function setMarqueeContext(state: MarqueeState): MarqueeState {
	return setContext(MARQUEE_CONTEXT_KEY, state);
}

/**
 * Read the root's state, throwing when there is no `<Marquee.Root>` ancestor.
 *
 * `consumerName` is the full part spelling (`'<Marquee.Content>'`) so the message names both the
 * part and its provider, matching upstream's `useMarqueeContext(consumerName)`. Only
 * `<Marquee.Content>` consumes the context — `Item` and `Edge` read none and must keep working
 * standalone.
 */
export function getMarqueeContext(consumerName: string): MarqueeState {
	if (!hasContext(MARQUEE_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Marquee.Root>\`.`);
	}
	return getContext<MarqueeState>(MARQUEE_CONTEXT_KEY);
}
