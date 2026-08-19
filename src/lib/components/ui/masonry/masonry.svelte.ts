import { getContext, hasContext, setContext } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

import { createPositioner, type Positioner, type PositionerItem } from "./masonry-positioner.js";

/** Upstream `DEBOUNCE_DELAY` — how long window resizes are coalesced for, in ms. */
const DEBOUNCE_DELAY = 300;

/** Upstream `SCROLL_FPS` — the default upper bound on scroll-driven recomputation. */
const SCROLL_FPS = 12;

type RafScheduled<T extends unknown[]> = {
	(...args: T): void;
	cancel: () => void;
};

/**
 * Coalesce repeated calls into a single `requestAnimationFrame`, replacing upstream's
 * `onRafSchedule` (lines 913–936).
 *
 * **Divergence.** Upstream guards with `if (frameId)`, so the very first call — when `frameId` is
 * still `null` — schedules nothing at all and the callback never runs until a second call lands.
 * The guard here is `if (frameId === null)`, which is the evident intent: schedule when no frame is
 * pending, and let a pending frame absorb later calls (with the latest arguments winning).
 */
function createRafSchedule<T extends unknown[]>(callback: (...args: T) => void): RafScheduled<T> {
	let lastArgs: T | undefined;
	let frameId: number | null = null;

	const scheduled = (...args: T) => {
		lastArgs = args;
		if (frameId !== null) return;

		frameId = requestAnimationFrame(() => {
			frameId = null;
			if (lastArgs) callback(...lastArgs);
		});
	};

	scheduled.cancel = () => {
		if (frameId === null) return;
		cancelAnimationFrame(frameId);
		frameId = null;
	};

	return scheduled;
}

type Throttled<T> = {
	(value: T): void;
	cancel: () => void;
};

/**
 * Rate-limit a value stream to `fps` updates per second, replacing upstream's `useThrottle`
 * (lines 1085–1149) including its leading-edge call and its trailing coalescing timeout.
 */
function createThrottle<T>(
	onValue: (value: T) => void,
	fps: number,
	leading: boolean,
): Throttled<T> {
	const ms = 1000 / fps;
	let previous = 0;
	let trailing: ReturnType<typeof setTimeout> | null = null;

	function clearTrailing() {
		if (trailing === null) return;
		clearTimeout(trailing);
		trailing = null;
	}

	const throttled = (value: T) => {
		const now = typeof performance !== "undefined" ? performance.now() : Date.now();

		function call() {
			previous = now;
			clearTrailing();
			onValue(value);
		}

		if (leading && previous === 0) {
			call();
			return;
		}

		if (now - previous > ms) {
			if (previous > 0) {
				call();
				return;
			}
			previous = now;
		}

		clearTrailing();
		trailing = setTimeout(() => {
			call();
			previous = 0;
		}, ms);
	};

	throttled.cancel = () => {
		previous = 0;
		clearTrailing();
	};

	return throttled;
}

/**
 * Track the debounced document size, replacing upstream's `useDebouncedWindowSize` (lines 847–906).
 * Returns the teardown. Not exported through `index.ts` — it is DOM plumbing, not a layout
 * primitive.
 */
export function observeWindowSize(
	state: MasonryState,
	delayMs: number = DEBOUNCE_DELAY,
): () => void {
	if (typeof window === "undefined") return () => {};

	let timeout: ReturnType<typeof setTimeout> | null = null;

	function onResize() {
		if (timeout !== null) clearTimeout(timeout);
		timeout = setTimeout(() => {
			state.windowSize = state.readDocumentSize();
		}, delayMs);
	}

	window.addEventListener("resize", onResize, { passive: true });
	window.addEventListener("orientationchange", onResize);
	window.visualViewport?.addEventListener("resize", onResize);

	return () => {
		window.removeEventListener("resize", onResize);
		window.removeEventListener("orientationchange", onResize);
		window.visualViewport?.removeEventListener("resize", onResize);
		if (timeout !== null) clearTimeout(timeout);
	};
}

/**
 * Track the throttled window scroll offset and the "is scrolling" flag, replacing upstream's
 * `useScroller` (lines 1020–1083). Returns the teardown.
 *
 * **Divergence.** Upstream settles `isScrolling` through a `requestAnimationFrame` polling loop that
 * compares timestamps; a single `setTimeout` of the same `40 + 1000 / fps` delay is equivalent and
 * does not keep a frame loop alive while the page is idle.
 */
export function observeWindowScroll(state: MasonryState, fps: number = SCROLL_FPS): () => void {
	if (typeof window === "undefined") return () => {};

	const settleDelay = 40 + 1000 / fps;
	let settle: ReturnType<typeof setTimeout> | null = null;

	const throttled = createThrottle<number>(
		(scrollY) => {
			state.scrollY = scrollY;
		},
		fps,
		true,
	);

	function onScroll() {
		state.isScrolling = true;
		if (settle !== null) clearTimeout(settle);
		settle = setTimeout(() => {
			state.isScrolling = false;
		}, settleDelay);

		throttled(window.scrollY ?? document.documentElement.scrollTop ?? 0);
	}

	window.addEventListener("scroll", onScroll, { passive: true });

	return () => {
		window.removeEventListener("scroll", onScroll);
		throttled.cancel();
		if (settle !== null) clearTimeout(settle);
	};
}

/**
 * Every positioned item overlapping `[low, high]`, by index.
 *
 * Built here rather than inside the class because the result is only ever *replaced*, never mutated
 * — the `ReadonlyMap` return type says so, and keeping the construction outside the reactive class
 * keeps that promise checkable (the same reasoning as `badge-overflow`'s width map).
 */
function collectVisible(
	positioner: Positioner,
	low: number,
	high: number,
): ReadonlyMap<number, PositionerItem> {
	const entries: [number, PositionerItem][] = [];
	positioner.range(low, high, (index) => {
		const item = positioner.get(index);
		if (item) entries.push([index, item]);
	});
	return new Map(entries);
}

export type MasonryStateProps = {
	readonly getColumnWidth: () => number;
	readonly getColumnCount: () => number | undefined;
	readonly getMaxColumnCount: () => number | undefined;
	readonly getGap: () => number | { column: number; row: number };
	readonly getItemHeight: () => number;
	readonly getDefaultWidth: () => number | undefined;
	readonly getDefaultHeight: () => number | undefined;
	readonly getOverscan: () => number;
	readonly getScrollFps: () => number;
	readonly getLinear: () => boolean;
	readonly getDir: () => Direction;
};

/**
 * One instance per `<Masonry.Root>`, published on context.
 *
 * It replaces upstream's whole React shell — `usePositioner`, `useResizeObserver`, `useScroller`,
 * `useDebouncedWindowSize` and `MasonryContextValue` — and, because Svelte cannot inspect a
 * `Snippet` the way `React.Children.toArray` inspects children, it also owns the
 * item registry that upstream derived from child position.
 */
export class MasonryState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: MasonryStateProps;

	/** The root element, published by `<Masonry.Root>`. Stays `null` in `child` mode. */
	rootElement: HTMLElement | null = $state(null);
	/** `false` until the root's `$effect.pre` runs — i.e. on the server and on the first client pass. */
	mounted: boolean = $state(false);
	/** The debounced document size; seeded from `defaultWidth`/`defaultHeight` when there is no DOM. */
	windowSize: { width: number; height: number } = $state.raw({ width: 0, height: 0 });
	/** The root's offsetTop chain sum and its measured width (upstream lines 1243–1263). */
	containerPosition: { offset: number; width: number } = $state.raw({ offset: 0, width: 0 });
	/** The throttled `window.scrollY`. */
	scrollY: number = $state(0);
	/** True between a scroll tick and its `40 + 1000 / fps` ms settle. */
	isScrolling: boolean = $state(false);
	/** RAF-driven invalidation token; surfaced as `data-version` on the viewport. */
	layoutVersion: number = $state(0);

	/** Registration order of the live items. */
	#tokens: symbol[] = $state.raw([]);
	/** Bumped whenever an item leaves, forcing a from-scratch re-measure of the shifted indices. */
	#structureVersion: number = $state(0);

	/**
	 * Every measured height, in index order — the single source of truth a recreated positioner
	 * replays from. Deliberately plain: it is written while the positioner is being mutated, and
	 * making it reactive would make the positioner derivation depend on its own side effects.
	 */
	#heights: number[] = [];
	/**
	 * Heights reported out of order, sparse by index, awaiting the predecessors that unblock them.
	 * A sparse array rather than a `Map` because it is mutated in place and must stay non-reactive.
	 */
	#pendingHeights: (number | undefined)[] = [];
	#elementIndex = new WeakMap<Element, number>();
	#updates: number[] = [];
	#observer: ResizeObserver | null = null;
	#lastOffset = -1;
	#lastWidth = -1;

	readonly columnGap: number = $derived.by(() => {
		const gap = this.#props.getGap();
		return typeof gap === "object" ? gap.column : gap;
	});

	readonly rowGap: number = $derived.by(() => {
		const gap = this.#props.getGap();
		return typeof gap === "object" ? gap.row : gap;
	});

	readonly dir: Direction = $derived(this.#props.getDir());

	/** The width the layout is computed against: the measured container, else the document. */
	readonly width: number = $derived(this.containerPosition.width || this.windowSize.width);

	/**
	 * Recreated whenever any of the seven layout inputs changes, replaying every height measured so
	 * far into the new instance — upstream lines 817–835.
	 *
	 * The derivation is **pure and idempotent**: it writes no state and carries nothing between
	 * runs, so evaluating it twice yields the same layout. That matters because the measurement
	 * effects mutate the instance it returns; a derivation that remembered its previous instance
	 * could hand out a positioner whose heights had been recorded into a discarded one.
	 */
	readonly positioner: Positioner = $derived.by(() => {
		// A structural change (an item leaving) shifts every later index, so `#heights` has already
		// been emptied — reading the version is what makes this derivation re-run for it.
		void this.#structureVersion;

		const next = createPositioner({
			width: this.width,
			columnWidth: this.#props.getColumnWidth(),
			columnGap: this.columnGap,
			rowGap: this.rowGap,
			columnCount: this.#props.getColumnCount(),
			maxColumnCount: this.#props.getMaxColumnCount(),
			linear: this.#props.getLinear(),
		});

		for (let index = 0; index < this.#heights.length; index++) {
			next.set(index, this.#heights[index]);
		}

		return next;
	});

	readonly columnWidth: number = $derived(this.positioner.columnWidth);
	readonly columnCount: number = $derived(this.positioner.columnCount);
	readonly itemCount: number = $derived(this.#tokens.length);

	readonly measuredCount: number = $derived.by(() => {
		void this.layoutVersion;
		return this.positioner.size();
	});

	readonly shortestColumnSize: number = $derived.by(() => {
		void this.layoutVersion;
		return this.positioner.shortestColumn();
	});

	readonly scrollTop: number = $derived(Math.max(0, this.scrollY - this.containerPosition.offset));
	readonly overscanPixels: number = $derived(this.windowSize.height * this.#props.getOverscan());
	readonly rangeStart: number = $derived(Math.max(0, this.scrollTop - this.overscanPixels / 2));
	readonly rangeEnd: number = $derived(this.scrollTop + this.overscanPixels);

	readonly layoutOutdated: boolean = $derived(
		this.shortestColumnSize < this.rangeEnd && this.measuredCount < this.itemCount,
	);

	/** How many unmeasured items the next hidden measurement pass covers (upstream 1431–1438). */
	readonly batchSize: number = $derived(
		Math.min(
			this.itemCount - this.measuredCount,
			Math.ceil(
				((this.scrollTop + this.overscanPixels - this.shortestColumnSize) /
					this.#props.getItemHeight()) *
					this.columnCount,
			),
		),
	);

	/** Every positioned item whose extent overlaps the overscan window, by index. */
	readonly visibleIndices: ReadonlyMap<number, PositionerItem> = $derived.by(() => {
		void this.layoutVersion;
		return collectVisible(this.positioner, this.rangeStart, this.rangeEnd);
	});

	/** The viewport's height, extrapolating the not-yet-measured items (upstream 1479–1492). */
	readonly estimatedHeight: number = $derived.by(() => {
		const measuredHeight = this.positioner.estimateHeight(
			this.measuredCount,
			this.#props.getItemHeight(),
		);
		if (this.measuredCount === this.itemCount) return measuredHeight;

		const remaining = this.itemCount - this.measuredCount;
		return measuredHeight + Math.ceil((remaining / this.columnCount) * this.#props.getItemHeight());
	});

	#bump = createRafSchedule(() => {
		this.layoutVersion += 1;
	});

	#flushUpdates = createRafSchedule(() => {
		if (this.#updates.length === 0) return;

		this.positioner.update(this.#updates);
		// Keep the replay log in step, or a later positioner recreation would resurrect the height
		// this update just replaced.
		for (let cursor = 0; cursor < this.#updates.length - 1; cursor += 2) {
			this.#heights[this.#updates[cursor]] = this.#updates[cursor + 1];
		}

		this.#updates = [];
		this.layoutVersion += 1;
	});

	constructor(props: MasonryStateProps) {
		this.#props = props;
		this.windowSize = this.readDocumentSize();
	}

	/** The document size, or the declared defaults when there is no DOM (server render). */
	readDocumentSize(): { width: number; height: number } {
		if (typeof document === "undefined") {
			return {
				width: this.#props.getDefaultWidth() ?? 0,
				height: this.#props.getDefaultHeight() ?? 0,
			};
		}

		const element = this.rootElement;
		return {
			width: element ? element.offsetWidth : document.documentElement.clientWidth,
			height: document.documentElement.clientHeight,
		};
	}

	/**
	 * Measure the root's offset from the top of the document and its width. Compared against plain
	 * mirrors rather than the reactive value, so the caller's effect never reads what it writes.
	 */
	measureContainer(element: HTMLElement | null): void {
		if (!element) return;

		let offset = 0;
		let current: HTMLElement | null = element;
		do {
			offset += current.offsetTop ?? 0;
			current = current.offsetParent as HTMLElement | null;
		} while (current);

		const width = element.offsetWidth;
		if (offset === this.#lastOffset && width === this.#lastWidth) return;

		this.#lastOffset = offset;
		this.#lastWidth = width;
		this.containerPosition = { offset, width };
	}

	registerItem(token: symbol): void {
		this.#tokens = [...this.#tokens, token];
	}

	unregisterItem(token: symbol): void {
		const position = this.#tokens.indexOf(token);
		if (position === -1) return;

		this.#tokens = this.#tokens.filter((candidate) => candidate !== token);
		// Every index after `position` shifts, so nothing measured can be trusted any more. Bumping
		// the version last means every effect it wakes sees the cleared buffers.
		this.#heights = [];
		this.#pendingHeights = [];
		this.#updates = [];
		this.#structureVersion += 1;
	}

	indexOf(token: symbol): number {
		return this.#tokens.indexOf(token);
	}

	/**
	 * The item's current geometry, as a fresh object.
	 *
	 * `positioner.update()` re-flows a column by mutating the stored items **in place**, so handing
	 * the stored object straight back would let a `$derived` compare it `===` to its previous value
	 * and skip the update — the re-flow would be computed and never rendered. Copying makes the
	 * `layoutVersion` invalidation observable.
	 */
	getItem(index: number): PositionerItem | undefined {
		void this.layoutVersion;
		const item = this.positioner.get(index);
		return item ? { ...item } : undefined;
	}

	isVisible(index: number): boolean {
		return this.visibleIndices.has(index);
	}

	/** True while the item belongs to the hidden batch rendered purely to be measured. */
	isMeasuring(index: number): boolean {
		if (!this.mounted || !this.layoutOutdated) return false;
		const start = this.measuredCount;
		return index >= start && index < start + this.batchSize;
	}

	/**
	 * Wire one item element up for measurement: remember its index, observe it, and report its
	 * current height. Returns the teardown the item's `$effect` must run.
	 */
	observeItem(index: number, element: HTMLElement): () => void {
		// Subscribes the caller's effect to structural changes, so every live item re-reports its
		// height after a removal shifted the indices and emptied the measurement log.
		void this.#structureVersion;

		this.#elementIndex.set(element, index);
		const observer = this.#ensureObserver();
		observer?.observe(element);
		this.reportHeight(index, element.offsetHeight);

		return () => {
			observer?.unobserve(element);
			this.#elementIndex.delete(element);
		};
	}

	/**
	 * Buffer a measured height and drain the buffer strictly in index order.
	 *
	 * `positioner.set` appends to whichever column is currently shortest, so the assignment depends
	 * on call order. Holding an early report until its predecessors land is what makes the column
	 * choice identical to upstream's for the same height sequence.
	 */
	reportHeight(index: number, height: number): void {
		if (index < 0 || index < this.#heights.length) return;

		// Captured once: a positioner recreated later replays `#heights`, so a stale instance here
		// can only ever lose work that the replay puts straight back.
		const positioner = this.positioner;
		this.#pendingHeights[index] = height;

		let drained = false;
		while (this.#pendingHeights[this.#heights.length] !== undefined) {
			const next = this.#heights.length;
			const measured = this.#pendingHeights[next] ?? 0;
			positioner.set(next, measured);
			this.#heights.push(measured);
			this.#pendingHeights[next] = undefined;
			drained = true;
		}

		if (drained) this.bumpLayout();
	}

	/** RAF-coalesced invalidation of everything derived from the positioner's mutable state. */
	bumpLayout(): void {
		this.#bump();
	}

	/** Drop every observer and pending frame. Called from the root's `$effect` teardown. */
	destroy(): void {
		this.#bump.cancel();
		this.#flushUpdates.cancel();
		this.#observer?.disconnect();
		this.#observer = null;
		this.#pendingHeights = [];
		this.#updates = [];
	}

	#ensureObserver(): ResizeObserver | null {
		if (typeof ResizeObserver === "undefined") return null;
		if (this.#observer) return this.#observer;

		this.#observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const target = entry.target;
				if (!(target instanceof HTMLElement)) continue;

				const index = this.#elementIndex.get(target);
				if (index === undefined) continue;

				const height = target.offsetHeight;
				if (height <= 0) continue;

				const item = this.positioner.get(index);
				if (item === undefined || height === item.height) continue;

				this.#updates.push(index, height);
			}

			this.#flushUpdates();
		});

		return this.#observer;
	}
}

const MASONRY_CONTEXT_KEY = Symbol("masonry");

export function setMasonryContext(state: MasonryState): MasonryState {
	return setContext(MASONRY_CONTEXT_KEY, state);
}

export function hasMasonryContext(): boolean {
	return hasContext(MASONRY_CONTEXT_KEY);
}

/** Read the root's state, throwing when there is no `<Masonry.Root>` ancestor. */
export function getMasonryContext(): MasonryState {
	if (!hasMasonryContext()) {
		throw new Error("`<Masonry.Item>` must be used within `<Masonry.Root>`.");
	}
	return getContext<MasonryState>(MASONRY_CONTEXT_KEY);
}
