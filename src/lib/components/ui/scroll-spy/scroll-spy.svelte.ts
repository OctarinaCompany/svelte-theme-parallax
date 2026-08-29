import { getContext, hasContext, setContext } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import { offsetWithin, scrollParentOf } from "$lib/shared/scroll-parent.js";
import { readScrollMetrics } from "$lib/shared/scroll-position.svelte.js";

import { SectionRegistry } from "./section-observer.svelte.js";

/** Every value `orientation` accepts, in upstream declaration order. */
export const SCROLL_SPY_ORIENTATIONS = ["horizontal", "vertical"] as const;
export type ScrollSpyOrientation = (typeof SCROLL_SPY_ORIENTATIONS)[number];

/** Upstream `orientation = "horizontal"` (line 115). */
export const DEFAULT_ORIENTATION: ScrollSpyOrientation = "horizontal";
/** Upstream `offset = 0` (line 111). */
export const DEFAULT_OFFSET = 0;
/** Upstream `threshold = 0.1` (line 110). */
export const DEFAULT_THRESHOLD = 0.1;
/** Upstream's 500 ms post-click suppression window (line 216). */
export const SCROLL_SETTLE_DELAY = 500;

/**
 * The DOM's `ScrollBehavior` (`"auto" | "instant" | "smooth"`), re-exported under a name the
 * `.svelte` parts can reference: the ambient DOM type is not in scope inside a Svelte module script.
 */
export type ScrollSpyScrollBehavior = ScrollBehavior;

/**
 * Upstream `getDefaultScrollBehavior` (lines 26-31): honour `prefers-reduced-motion: reduce`, and
 * fall back to `'smooth'` during SSR where no media query can be evaluated.
 */
export function getDefaultScrollBehavior(): ScrollBehavior {
	if (typeof window === "undefined") return "smooth";
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export type ScrollSpyStateProps = {
	readonly getValue: () => string;
	readonly setValue: (value: string) => void;
	readonly getOffset: () => number;
	readonly getScrollBehavior: () => ScrollBehavior;
	readonly getScrollContainer: () => HTMLElement | null;
	readonly getOrientation: () => ScrollSpyOrientation;
	readonly getDir: () => Direction;
};

/**
 * One instance per `<ScrollSpy.Root>`, published on context. Replaces both of upstream's contexts:
 * its `StoreContext` exists only so that changing the active value re-renders the two links whose
 * state actually flips instead of the whole subtree, and Svelte's signals give that for free — a
 * link that reads `state.value` subscribes to exactly that signal (divergence D-3).
 */
export class ScrollSpyState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: ScrollSpyStateProps;

	/** The elements eligible for passive tracking. */
	readonly sections = new SectionRegistry();

	// Upstream holds all three in refs precisely so writing them does not re-render. Making
	// `#isScrolling` reactive would tear down and re-create the observer on every click, and writing
	// it from inside that same effect would be an infinite loop.
	#isScrolling = false;
	#settleTimeout: number | null = null;
	#lastAppliedValue: string | null = null;

	/** The single active section id every part shares. */
	readonly value: string = $derived(this.#props.getValue());
	readonly orientation: ScrollSpyOrientation = $derived(this.#props.getOrientation());
	readonly dir: Direction = $derived(this.#props.getDir());
	readonly offset: number = $derived(this.#props.getOffset());
	readonly scrollBehavior: ScrollBehavior = $derived(this.#props.getScrollBehavior());
	readonly scrollContainer: HTMLElement | null = $derived(this.#props.getScrollContainer());

	constructor(props: ScrollSpyStateProps) {
		this.#props = props;
	}

	/** Drives each link's `data-state` and `aria-current`. */
	isActive(id: string): boolean {
		return this.value === id;
	}

	/**
	 * Upstream's `store.setState('value', …)` (lines 138-148): equal values are dropped without
	 * notifying, and `onValueChange` fires only for a truthy next value — so seeding or clearing to
	 * `''` is silent.
	 *
	 * What actually landed is read back afterwards, because an authoritative parent bound through
	 * `bind:value={() => …, (next) => …}` may decline the write; a later parent-driven change to the
	 * same id must then still count as external.
	 */
	setValue(next: string): void {
		if (Object.is(this.#props.getValue(), next)) return;

		this.#props.setValue(next);
		this.#lastAppliedValue = this.#props.getValue();
	}

	/**
	 * Upstream's `onScrollToSection` (lines 174-219): record the value immediately, scroll the
	 * tracked area to the section's offset-adjusted position, and hold passive tracking off for
	 * {@link SCROLL_SETTLE_DELAY} ms so the scroll's own intersections cannot overwrite the choice.
	 *
	 * A section that is not in the DOM still records the value, and scrolls nothing.
	 * Rapid repeated clicks each clear the previous timeout, so only the latest window governs.
	 */
	scrollToSection(id: string): void {
		const container = this.scrollContainer;
		// `CSS.escape`, because `getElementById` accepts any id but a raw `#${id}` selector throws on
		// ids that are not CSS identifiers (leading digit, colon, period, …).
		const section = container
			? container.querySelector(`#${CSS.escape(id)}`)
			: document.getElementById(id);

		if (!section) {
			this.setValue(id);
			return;
		}

		this.#isScrolling = true;
		this.setValue(id);

		const behavior = this.scrollBehavior;
		const offset = this.offset;

		if (container) {
			const containerTop = container.getBoundingClientRect().top;
			const sectionTop = section.getBoundingClientRect().top;
			const { scrollTop } = readScrollMetrics(container);

			container.scrollTo({ top: sectionTop - containerTop + scrollTop - offset, behavior });
		} else {
			// No `scrollContainer`: upstream scrolls the window here. Inside the Parallax shell the
			// document never scrolls — `Sidebar.Inset` is the scroll container and `window.scrollY`
			// stays at `0` for good (`src/app.css`, `src/lib/shared/scroll-parent.ts`) — so a
			// `window.scrollTo` would be a silent no-op while the value still flipped. The section's
			// own scroll parent is asked instead: the document on a page where the document still
			// scrolls, the canvas inside the shell. The `IntersectionObserver` needs no such
			// translation: with no container its root is `null`, the viewport, and the canvas fills
			// the viewport, so the observation band is the same rectangle in either arrangement
			// (`section-observer.svelte.ts`).
			//
			// `scrollTo` rather than `scrollIntoView`, because the landing position is
			// `offset`-adjusted. The trade is that a raw `scrollTo` does not consult the scroller's
			// `scroll-padding-top` the way `scrollIntoView` would — which is what `offset` is for.
			const scroller = scrollParentOf(section);

			scroller.scrollTo({ top: offsetWithin(scroller, section) - offset, behavior });
		}

		if (this.#settleTimeout !== null) clearTimeout(this.#settleTimeout);

		this.#settleTimeout = window.setTimeout(() => {
			this.#isScrolling = false;
			this.#settleTimeout = null;
		}, SCROLL_SETTLE_DELAY);
	}

	/**
	 * Passive activation from the observer (upstream lines 259-262): suppressed while a click-driven
	 * scroll is settling, and only ever accepts an element whose id is registered.
	 */
	onObserverTopmost(element: Element): void {
		if (this.#isScrolling) return;

		const id = element.id;
		if (!id || !this.sections.has(id)) return;

		this.setValue(id);
	}

	/**
	 * Upstream's value effect (lines 221-232). The first run only records the seed; every later run
	 * means the value changed from outside the component, so the new section is scrolled to.
	 */
	syncExternalValue(next: string): void {
		if (this.#lastAppliedValue === null) {
			this.#lastAppliedValue = next;
			return;
		}
		if (next === this.#lastAppliedValue) return;

		this.#lastAppliedValue = next;
		this.scrollToSection(next);
	}

	/** Clear the settle timeout. Called from the root's `$effect` teardown. */
	dispose(): void {
		if (this.#settleTimeout !== null) {
			clearTimeout(this.#settleTimeout);
			this.#settleTimeout = null;
		}
		this.#isScrolling = false;
	}
}

const SCROLL_SPY_CONTEXT_KEY = Symbol("scroll-spy");

export function setScrollSpyContext(state: ScrollSpyState): ScrollSpyState {
	return setContext(SCROLL_SPY_CONTEXT_KEY, state);
}

/**
 * Read the root's state, throwing when there is no `<ScrollSpy.Root>` ancestor.
 *
 * `consumerName` is the part's short name (`'Nav'`, `'Link'`, `'Viewport'`, `'Section'`) so the
 * message names both the part and its provider, mirroring upstream's `useScrollSpyContext(name)`.
 */
export function getScrollSpyContext(consumerName: string): ScrollSpyState {
	if (!hasContext(SCROLL_SPY_CONTEXT_KEY)) {
		throw new Error(`\`<ScrollSpy.${consumerName}>\` must be used within \`<ScrollSpy.Root>\`.`);
	}
	return getContext<ScrollSpyState>(SCROLL_SPY_CONTEXT_KEY);
}
