import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import { isDocumentScroller, offsetWithin, scrollParentOf } from "$lib/shared/scroll-parent.js";
import { getContext, hasContext, setContext, type Snippet } from "svelte";

/**
 * The two state classes behind `<Tour.Root>` and `<Tour.Step>`, the step registry they share, and
 * the five pure helpers the geometry and scrolling are expressed in.
 *
 * the reference implementation's `tour.tsx` hand-rolls a `useSyncExternalStore` store (287-343, 613-715) whose
 * only purpose is to re-render each part for its own slice of state. Svelte's signals give that for
 * free, so the store is *translated*, not transliterated: the observable half — the `Object.is`
 * no-op guard, the `onStepLeave` → `onStepEnter` → `onComplete` → close ordering, the controlled
 * early-return — is reproduced literally in {@link TourRootState.setOpenState} and
 * {@link TourRootState.setValueState}, because that is behaviour rather than plumbing.
 */

/** Every value `side` accepts, in upstream declaration order. */
export const TOUR_SIDES = ["top", "right", "bottom", "left"] as const;
export type TourSide = (typeof TOUR_SIDES)[number];

/** Every value `align` accepts, in upstream declaration order. */
export const TOUR_ALIGNS = ["start", "center", "end"] as const;
export type TourAlign = (typeof TOUR_ALIGNS)[number];

/** Upstream `alignOffset = DEFAULT_ALIGN_OFFSET`. */
export const DEFAULT_ALIGN_OFFSET = 0;
/** Upstream `sideOffset = DEFAULT_SIDE_OFFSET`. */
export const DEFAULT_SIDE_OFFSET = 16;
/** Upstream `spotlightPadding = DEFAULT_SPOTLIGHT_PADDING`. */
export const DEFAULT_SPOTLIGHT_PADDING = 4;

/** Upstream `ScrollOffset` — per-edge viewport insets, in pixels. */
export type TourScrollOffset = {
	top?: number;
	bottom?: number;
	left?: number;
	right?: number;
};

/** Upstream's inline `offset` default inside `onScrollToElement`. */
export const DEFAULT_SCROLL_OFFSET: Required<TourScrollOffset> = {
	top: 100,
	bottom: 100,
	left: 0,
	right: 0,
};

/**
 * The DOM's `ScrollBehavior` (`"auto" | "instant" | "smooth"`), re-exported under a name the
 * `.svelte` parts can reference: the ambient DOM type is not in scope inside a Svelte module script
 * (the `scroll-spy` precedent).
 */
export type TourScrollBehavior = ScrollBehavior;

/** A single collision boundary. Upstream `Boundary`. */
export type TourBoundary = Element | null;

/**
 * Anything a step may name as its target. Upstream also accepts a React ref object, which has no
 * Svelte analogue — an element read through `bind:this` is simply passed as the element itself.
 */
export type TourTarget = string | HTMLElement;

/** The spotlight cut-out in viewport coordinates. Upstream `StoreState['spotlightRect']` (309). */
export type TourSpotlightRect = { x: number; y: number; width: number; height: number };

/** Both halves of upstream's `updateMask`, returned together. */
export type TourSpotlightGeometry = { maskPath: string; rect: TourSpotlightRect };

/** The four numbers {@link computeSpotlight} reads off a `DOMRect`. */
export type TourMeasuredRect = {
	left: number;
	top: number;
	width: number;
	height: number;
};

/** The four numbers {@link isTargetInViewport} reads off a `DOMRect`. */
export type TourEdgeRect = {
	top: number;
	bottom: number;
	left: number;
	right: number;
};

/** The measured area a spotlight or in-view test is evaluated against. */
export type TourViewport = { width: number; height: number };

/** Upstream's four custom event names. */
export const TOUR_POINTER_DOWN_OUTSIDE = "tour.pointerDownOutside";
export const TOUR_INTERACT_OUTSIDE = "tour.interactOutside";
export const TOUR_OPEN_AUTO_FOCUS = "tour.openAutoFocus";
export const TOUR_CLOSE_AUTO_FOCUS = "tour.closeAutoFocus";

/** Upstream `EVENT_OPTIONS`. `cancelable` is what makes `preventDefault()` mean something. */
export const TOUR_EVENT_OPTIONS: CustomEventInit = { bubbles: false, cancelable: true };

/** Upstream `PointerDownOutsideEvent`. */
export type TourPointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;
/** Upstream `InteractOutsideEvent`. */
export type TourInteractOutsideEvent = CustomEvent<{
	originalEvent: PointerEvent | FocusEvent;
}>;
/** Upstream `OpenAutoFocusEvent`. */
export type TourOpenAutoFocusEvent = CustomEvent<Record<string, never>>;
/** Upstream `CloseAutoFocusEvent`. */
export type TourCloseAutoFocusEvent = CustomEvent<Record<string, never>>;

/**
 * One registered `<Tour.Step>`. Upstream `StepData` field for field: a snapshot
 * of the step's resolved props, refreshed whenever they change.
 */
export type TourStepData = {
	target: TourTarget;
	side: TourSide;
	sideOffset: number;
	align: TourAlign;
	alignOffset: number;
	collisionBoundary: TourBoundary | TourBoundary[];
	collisionPadding: number | Partial<Record<TourSide, number>>;
	arrowPadding: number;
	sticky: "partial" | "always";
	hideWhenDetached: boolean;
	avoidCollisions: boolean;
	/** Stored for API parity and never read — inert upstream too. */
	required: boolean;
	onStepEnter?: () => void;
	onStepLeave?: () => void;
};

/**
 * Upstream's `stepIdsMapRef` + `stepIdCounterRef` + `state.steps` triple (* 687-712), as one object.
 *
 * Storage is a **plain, non-reactive** array: a reactive container would make each step's
 * registration effect a dependent of the very signal it writes, which is the loop the project's
 * `SvelteMap`-in-`$effect` note warns about. Only {@link version} and {@link count} are `$state`,
 * and both are *assigned* from a plain counter rather than read-modify-written — the
 * `SectionRegistry` pattern from `scroll-spy`.
 */
export class TourStepRegistry {
	#entries: { id: string; data: TourStepData }[] = [];
	#idCounter = 0;
	#changes = 0;
	#version = $state(0);
	#count = $state(0);

	/** Bumped on every membership or data change. Read it to subscribe to the registry. */
	get version(): number {
		return this.#version;
	}

	/** How many steps are registered. Reactive — drives `Tour.StepCounter` and `Next`'s "Finish". */
	get count(): number {
		return this.#count;
	}

	/** Append `data` in mount order and return its fresh id. Upstream `addStep` (687-694). */
	register(data: TourStepData): string {
		const id = `step-${this.#idCounter++}`;
		this.#entries.push({ id, data });
		this.#bump();
		return id;
	}

	/**
	 * Replace one record in place, keeping its index. Upstream re-runs `addStep`/`removeStep` for a
	 * prop change (its dependency array, 922-937); replacing in place is the same observable result
	 * without renumbering every later step on every prop tick.
	 */
	update(id: string, data: TourStepData): void {
		const entry = this.#entries.find((candidate) => candidate.id === id);
		if (!entry || isSameStepData(entry.data, data)) return;

		entry.data = data;
		this.#bump();
	}

	/**
	 * Remove `id`; later steps shift down by one, exactly as upstream's `removeStep` renumbers its id
	 * map (695-712). A no-op — and no version bump — for an unknown id.
	 */
	unregister(id: string): void {
		const index = this.#entries.findIndex((candidate) => candidate.id === id);
		if (index === -1) return;

		this.#entries.splice(index, 1);
		this.#bump();
	}

	/** The step at `index`, or `undefined`. Reactive: reading it subscribes to {@link version}. */
	at(index: number): TourStepData | undefined {
		void this.#version;
		return this.#entries[index]?.data;
	}

	/** Where `id` currently sits, or `-1`. Reactive, so a step knows when it becomes current. */
	indexOf(id: string): number {
		void this.#version;
		return this.#entries.findIndex((candidate) => candidate.id === id);
	}

	/** Both reactive fields are assigned, never read-modify-written (see the class note). */
	#bump(): void {
		this.#changes += 1;
		this.#version = this.#changes;
		this.#count = this.#entries.length;
	}
}

/**
 * Compare two boundaries by content, not by identity: `collisionBoundary` defaults to a fresh `[]`
 * on every prop read, so an identity check would report a change on every tick.
 */
function isSameBoundary(
	a: TourBoundary | TourBoundary[],
	b: TourBoundary | TourBoundary[],
): boolean {
	if (a === b) return true;

	const left = Array.isArray(a) ? a : [a];
	const right = Array.isArray(b) ? b : [b];

	return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

/** The same content-not-identity comparison for the per-side `collisionPadding` object. */
function isSamePadding(
	a: number | Partial<Record<TourSide, number>>,
	b: number | Partial<Record<TourSide, number>>,
): boolean {
	if (a === b) return true;
	if (typeof a === "number" || typeof b === "number") return false;

	return TOUR_SIDES.every((side) => a[side] === b[side]);
}

/**
 * Whether two step records describe the same step. Compared field by field so a `<Tour.Step>` whose
 * registration effect re-runs with unchanged inputs does not bump the registry version forever.
 */
function isSameStepData(a: TourStepData, b: TourStepData): boolean {
	return (
		a.target === b.target &&
		a.side === b.side &&
		a.sideOffset === b.sideOffset &&
		a.align === b.align &&
		a.alignOffset === b.alignOffset &&
		isSameBoundary(a.collisionBoundary, b.collisionBoundary) &&
		isSamePadding(a.collisionPadding, b.collisionPadding) &&
		a.arrowPadding === b.arrowPadding &&
		a.sticky === b.sticky &&
		a.hideWhenDetached === b.hideWhenDetached &&
		a.avoidCollisions === b.avoidCollisions &&
		a.required === b.required &&
		a.onStepEnter === b.onStepEnter &&
		a.onStepLeave === b.onStepLeave
	);
}

/**
 * Resolve a step's `target` to a live element. Upstream `getTargetElement`,
 * minus the React ref branch. A selector matching nothing — or matching several elements — behaves
 * exactly as upstream: `null`, or the first match.
 */
export function resolveTarget(target: TourTarget | null | undefined): HTMLElement | null {
	if (typeof document === "undefined" || target === null || target === undefined) return null;
	if (typeof target === "string") return document.querySelector<HTMLElement>(target);
	if (target instanceof HTMLElement) return target;
	return null;
}

/**
 * Upstream `updateMask`, as a pure function so the arithmetic is unit-testable
 * under jsdom, which performs no layout.
 *
 * `padding` is added on all four edges and the result is clamped to the viewport, so a target
 * touching the top-left corner never produces a negative origin.
 */
export function computeSpotlight(
	rect: TourMeasuredRect,
	padding: number = DEFAULT_SPOTLIGHT_PADDING,
	viewport: TourViewport,
): TourSpotlightGeometry {
	const x = Math.max(0, rect.left - padding);
	const y = Math.max(0, rect.top - padding);
	const width = Math.min(viewport.width - x, rect.width + padding * 2);
	const height = Math.min(viewport.height - y, rect.height + padding * 2);

	const maskPath = `polygon(0% 0%, 0% 100%, ${x}px 100%, ${x}px ${y}px, ${x + width}px ${y}px, ${x + width}px ${y + height}px, ${x}px ${y + height}px, ${x}px 100%, 100% 100%, 100% 0%)`;

	return { maskPath, rect: { x, y, width, height } };
}

/**
 * Upstream `getDefaultScrollBehavior`: honour `prefers-reduced-motion: reduce`,
 * and fall back to `'smooth'` during SSR where no media query can be evaluated.
 *
 * A local three-line copy rather than an import from `scroll-spy`: upstream duplicates it per
 * component too, and importing it would add a `registryDependencies: ["scroll-spy"]` edge to every
 * Tour install for one media-query read.
 */
export function getDefaultScrollBehavior(): ScrollBehavior {
	if (typeof window === "undefined") return "smooth";
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

/**
 * Whether `rect` already sits inside the viewport once every edge's {@link TourScrollOffset} inset
 * is applied. Upstream's inline `isInViewport`.
 */
export function isTargetInViewport(
	rect: TourEdgeRect,
	scrollOffset: TourScrollOffset | undefined,
	viewport: TourViewport,
): boolean {
	const offset = { ...DEFAULT_SCROLL_OFFSET, ...scrollOffset };

	return (
		rect.top >= offset.top &&
		rect.bottom <= viewport.height - offset.bottom &&
		rect.left >= offset.left &&
		rect.right <= viewport.width - offset.right
	);
}

/**
 * Upstream `onScrollToElement`: scroll so `element` clears the top inset, but only when it is not
 * already in view, and never past `0`.
 *
 * Divergence: upstream scrolls the WINDOW (`rect.top + window.scrollY`). Inside the Parallax shell
 * the document never scrolls — `Sidebar.Inset` is the scroll container and `window.scrollY` stays
 * at `0` for good (`src/app.css`, `src/lib/shared/scroll-parent.ts`) — so a `window.scrollTo` there
 * is a silent no-op and the step opens on a target that is still off screen. EVERY scroll
 * container between the target and the document takes part instead, nearest first: the panel
 * the target sits in, the canvas around it, and the document where it still scrolls. Scrolling
 * the nearest one alone is not enough — a target inside a `ScrollArea` viewport, a `Table.Root`
 * wrapper (its `overflow-x: auto` makes `overflow-y` compute to `auto` as well, per MDN) or any
 * nested `overflow-y: auto` panel would be brought to the top of that panel while the panel
 * itself, and the canvas around it, stayed exactly where they were.
 *
 * MEASURED FIRST, SCROLLED AFTER. Every scroller's destination is computed from the rects as
 * they stand before anything moves, carrying forward how far the inner ones will have shifted
 * the target (`shift`), and only then are the `scrollTo` calls issued. Reading the rects again
 * after each call would be wrong under `behavior: "smooth"`: the scroll runs asynchronously, the
 * rect still shows the target where it was, and the outer scroller would overshoot by exactly
 * the inner delta. A destination is clamped to what its scroller can reach
 * (`scrollHeight - clientHeight`), and the clamped value is what the next one compensates for.
 *
 * The in-view test still measures against `window.innerWidth`/`innerHeight`, on purpose: the
 * canvas fills the viewport, so "inside the viewport minus the insets" and "inside the canvas
 * minus the insets" are the same rectangle, and `getBoundingClientRect` is viewport-relative
 * whichever box scrolls.
 *
 * Fire-and-forget by design — there is no pending-scroll bookkeeping, which is exactly why a later
 * `Next`/`Previous` always supersedes an earlier one under rapid repeated activation.
 */
export function scrollTargetIntoView(
	element: HTMLElement,
	scrollBehavior: ScrollBehavior = getDefaultScrollBehavior(),
	scrollOffset?: TourScrollOffset,
): void {
	if (typeof window === "undefined") return;

	const offset = { ...DEFAULT_SCROLL_OFFSET, ...scrollOffset };
	const rect = element.getBoundingClientRect();
	const viewport = { width: window.innerWidth, height: window.innerHeight };

	if (isTargetInViewport(rect, scrollOffset, viewport)) return;

	const plan: Array<[HTMLElement, number]> = [];
	let scroller = scrollParentOf(element);
	let shift = 0;
	for (;;) {
		const current = scroller.scrollTop;
		const max = scroller.scrollHeight - scroller.clientHeight;
		const wanted = Math.min(max, Math.max(0, offsetWithin(scroller, element) - shift - offset.top));
		if (wanted !== current) plan.push([scroller, wanted]);
		shift += wanted - current;
		if (isDocumentScroller(scroller)) break;
		scroller = scrollParentOf(scroller);
	}
	for (const [target, top] of plan) target.scrollTo({ top, behavior: scrollBehavior });
}

export type TourRootStateProps = {
	readonly getOpen: () => boolean;
	/** Assigns the `$bindable` and calls `onOpenChange`. An authoritative parent may decline it. */
	readonly setOpen: (open: boolean) => void;
	readonly getValue: () => number;
	/** Assigns the `$bindable` and calls `onValueChange`. An authoritative parent may decline it. */
	readonly setValue: (value: number) => void;
	/** Captured **before** the `??=` uncontrolled seed, so it survives it. */
	readonly isOpenControlled: boolean;
	readonly isValueControlled: boolean;
	readonly getDir: () => Direction;
	readonly getSideOffset: () => number;
	readonly getAlignOffset: () => number;
	readonly getSpotlightPadding: () => number;
	readonly getDismissible: () => boolean;
	readonly getModal: () => boolean;
	readonly getAutoScroll: () => boolean;
	readonly getScrollBehavior: () => ScrollBehavior;
	readonly getScrollOffset: () => TourScrollOffset | undefined;
	readonly getStepFooter: () => Snippet | undefined;
	readonly getOnComplete: () => (() => void) | undefined;
	readonly getOnSkip: () => (() => void) | undefined;
	readonly getOnPointerDownOutside: () =>
		((event: TourPointerDownOutsideEvent) => void) | undefined;
	readonly getOnInteractOutside: () => ((event: TourInteractOutsideEvent) => void) | undefined;
	readonly getOnOpenAutoFocus: () => ((event: TourOpenAutoFocusEvent) => void) | undefined;
};

/** One instance per `<Tour.Root>`, published on {@link setTourContext}. */
export class TourRootState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: TourRootStateProps;

	/** The registered steps, in mount order. */
	readonly steps = new TourStepRegistry();

	/** Upstream `StoreState.maskPath` — the spotlight's `clip-path` polygon. */
	maskPath = $state("");
	/** Upstream `StoreState.spotlightRect` — the ring's box. */
	spotlightRect = $state<TourSpotlightRect | null>(null);

	readonly open: boolean = $derived(this.#props.getOpen());
	readonly value: number = $derived(this.#props.getValue());
	readonly stepCount: number = $derived(this.steps.count);
	readonly isLastStep: boolean = $derived(this.value === this.stepCount - 1);
	readonly canGoPrev: boolean = $derived(this.value > 0);

	readonly dir: Direction = $derived(this.#props.getDir());
	readonly sideOffset: number = $derived(this.#props.getSideOffset());
	readonly alignOffset: number = $derived(this.#props.getAlignOffset());
	readonly spotlightPadding: number = $derived(this.#props.getSpotlightPadding());
	readonly dismissible: boolean = $derived(this.#props.getDismissible());
	readonly modal: boolean = $derived(this.#props.getModal());
	readonly stepFooter: Snippet | undefined = $derived(this.#props.getStepFooter());

	constructor(props: TourRootStateProps) {
		this.#props = props;
	}

	/** Whether the parent owns `value`. Drives the two controlled branches of {@link setValueState}. */
	get isValueControlled(): boolean {
		return this.#props.isValueControlled;
	}

	/** Whether the parent owns `open`. Exposed for symmetry and for consumer introspection. */
	get isOpenControlled(): boolean {
		return this.#props.isOpenControlled;
	}

	/** The caller's `onPointerDownOutside`, read at dispatch time so a late binding still wins. */
	get onPointerDownOutside(): ((event: TourPointerDownOutsideEvent) => void) | undefined {
		return this.#props.getOnPointerDownOutside();
	}

	get onInteractOutside(): ((event: TourInteractOutsideEvent) => void) | undefined {
		return this.#props.getOnInteractOutside();
	}

	get onOpenAutoFocus(): ((event: TourOpenAutoFocusEvent) => void) | undefined {
		return this.#props.getOnOpenAutoFocus();
	}

	/**
	 * Upstream's `open` branch of `store.setState`.
	 *
	 * Opening onto an out-of-range index resets to `0` on reopen; closing before the last step is a
	 * *skip*, never a completion — an asymmetry that never reports both for one run, since
	 * `onComplete`'s own close always leaves `value` at `stepCount - 1` or beyond.
	 */
	setOpenState(next: boolean): void {
		if (Object.is(this.open, next)) return;

		this.#props.setOpen(next);

		if (next) {
			if (this.stepCount > 0 && this.value >= this.stepCount) this.setValueState(0);
			return;
		}

		if (this.value < this.stepCount - 1) this.#props.getOnSkip()?.();
	}

	/**
	 * Upstream's `value` branch of `store.setState`, ordering included:
	 * `onStepLeave` → `onStepEnter` → (past the end) `onComplete` → close, else `onValueChange` and,
	 * **only when uncontrolled**, the auto-scroll.
	 */
	setValueState(next: number): void {
		const current = this.value;
		if (Object.is(current, next)) return;

		this.stepAt(current)?.onStepLeave?.();
		this.stepAt(next)?.onStepEnter?.();

		if (next >= this.stepCount) {
			this.#props.getOnComplete()?.();

			// A controlled parent is told the out-of-range index; an uncontrolled one is not moved
			// there at all, so `Tour.StepCounter` never flashes "5 / 4" on the way out.
			if (this.isValueControlled) this.#props.setValue(next);

			this.setOpenState(false);

			// Uncontrolled `value` would otherwise stay parked on the last step, and the reopen
			// reset in `setOpenState` only catches out-of-range values — which only a controlled
			// parent ever holds. Reset after the close, so the counter never shows the move; the
			// `!== 0` guard keeps `onValueChange` silent for a single-step tour already at `0`.
			if (!this.isValueControlled && this.value !== 0) this.#props.setValue(0);
			return;
		}

		this.#props.setValue(next);

		// Controlled: the parent owns the move, and upstream returns before scrolling (661-664).
		if (this.isValueControlled) return;
		if (!this.#props.getAutoScroll()) return;

		const step = this.stepAt(next);
		const element = step ? resolveTarget(step.target) : null;
		if (!element) return;

		scrollTargetIntoView(element, this.#props.getScrollBehavior(), this.#props.getScrollOffset());
	}

	/** Past the last step this completes and closes rather than advancing. */
	goNext(): void {
		this.setValueState(this.value + 1);
	}

	/** Never moves below `0`, matching upstream's `value > 0` guard (1535-1537). */
	goPrev(): void {
		if (this.value > 0) this.setValueState(this.value - 1);
	}

	/** Used by `Tour.Close`, `Tour.Skip`, `Escape` and the outside-interaction layer. */
	close(): void {
		this.setOpenState(false);
	}

	registerStep(data: TourStepData): string {
		return this.steps.register(data);
	}

	updateStep(id: string, data: TourStepData): void {
		this.steps.update(id, data);
	}

	unregisterStep(id: string): void {
		this.steps.unregister(id);
	}

	stepAt(index: number): TourStepData | undefined {
		return this.steps.at(index);
	}

	stepIndexOf(id: string): number {
		return this.steps.indexOf(id);
	}

	/** Both halves land together, so the backdrop and the ring never disagree for a frame. */
	setSpotlight(geometry: TourSpotlightGeometry): void {
		this.maskPath = geometry.maskPath;
		this.spotlightRect = geometry.rect;
	}

	/** Reset when the active step goes away, so a re-open never flashes the previous cut-out. */
	clearSpotlight(): void {
		this.maskPath = "";
		this.spotlightRect = null;
	}
}

/**
 * One instance per **rendered** `<Tour.Step>`, published on {@link setTourStepContext}. Replaces
 * upstream's `StepContext`.
 *
 * Arrow placement (`arrowX`/`arrowY`/`placedSide`/`shouldHideArrow`) is deliberately absent:
 * `bits-ui`'s floating layer owns it and `Popover.Arrow` consumes it through its own context.
 * `Tour.Arrow` keeps the step-context lookup only so it throws the documented error
 * outside a step.
 */
export class TourStepState {
	/** Set by a `<Tour.Footer>` rendered as the step's own child — upstream `onFooterChange` (472). */
	hasOwnFooter = $state(false);
	/** The id of this step's `<Tour.Title>`, wired through `aria-labelledby`. */
	titleId = $state<string | undefined>(undefined);
	/** The id of this step's `<Tour.Description>`, wired through `aria-describedby`. */
	descriptionId = $state<string | undefined>(undefined);

	registerFooter(): void {
		this.hasOwnFooter = true;
	}

	unregisterFooter(): void {
		this.hasOwnFooter = false;
	}

	registerTitle(id: string): void {
		this.titleId = id;
	}

	unregisterTitle(): void {
		this.titleId = undefined;
	}

	registerDescription(id: string): void {
		this.descriptionId = id;
	}

	unregisterDescription(): void {
		this.descriptionId = undefined;
	}
}

const TOUR_CONTEXT_KEY = Symbol("tour");
const TOUR_STEP_CONTEXT_KEY = Symbol("tour-step");
const TOUR_DEFAULT_FOOTER_CONTEXT_KEY = Symbol("tour-default-footer");

export function setTourContext(state: TourRootState): TourRootState {
	return setContext(TOUR_CONTEXT_KEY, state);
}

/**
 * Read the root's state, throwing when there is no `<Tour.Root>` ancestor.
 *
 * `consumer` is the part's full spelling (`'<Tour.Step>'`, `'<Tour.Next>'`, …) so the message names
 * both the part and its provider, mirroring upstream's `useStoreContext(consumerName)`.
 */
export function getTourContext(consumer: string): TourRootState {
	if (!hasContext(TOUR_CONTEXT_KEY)) {
		throw new Error(`\`${consumer}\` must be used within \`<Tour.Root>\`.`);
	}
	return getContext<TourRootState>(TOUR_CONTEXT_KEY);
}

export function setTourStepContext(state: TourStepState): TourStepState {
	return setContext(TOUR_STEP_CONTEXT_KEY, state);
}

/** Read the enclosing step's state, throwing when there is no `<Tour.Step>` ancestor. */
export function getTourStepContext(consumer: string): TourStepState {
	if (!hasContext(TOUR_STEP_CONTEXT_KEY)) {
		throw new Error(`\`${consumer}\` must be used within \`<Tour.Step>\`.`);
	}
	return getContext<TourStepState>(TOUR_STEP_CONTEXT_KEY);
}

/**
 * Upstream's `DefaultFooterContext`. Set to `true` only around the root's
 * shared `stepFooter` snippet, so the footer rendered there never registers itself as the step's own
 * — which would make the step drop the very footer it just mounted, forever.
 */
export function setTourDefaultFooterContext(): boolean {
	return setContext(TOUR_DEFAULT_FOOTER_CONTEXT_KEY, true);
}

/** `false` for a footer written as a step's child, `true` inside the root's `stepFooter` snippet. */
export function isInTourDefaultFooter(): boolean {
	return hasContext(TOUR_DEFAULT_FOOTER_CONTEXT_KEY);
}
