/**
 * The box that scrolls an element, and where its `scroll` events fire.
 *
 * WHY IT EXISTS. The Parallax shell is the viewport: `Sidebar.Provider`'s wrapper is pinned to
 * `100dvh` and clipped, `Sidebar.Inset` is the one scroll container, and the DOCUMENT never
 * scrolls — that is what keeps iOS and iPadOS Safari from collapsing their toolbars mid-scroll,
 * a browser gesture an application has no use for (`src/app.css` states the rules and the
 * reasoning). Every component that read `window.scrollY`, called `window.scrollTo` or listened
 * on `window` for `scroll` was reading the wrong box the moment that landed: the number stays at
 * 0 and a bubbling listener on `window` never fires (a capturing one hears everything —
 * {@link scrollEventTargetOf} says why), with no error anywhere. Those components ask this
 * module instead, and the answer is right in either arrangement — a shell that owns its scroll,
 * or a page where the document still does.
 *
 * WHAT COUNTS AS A SCROLLER: an ancestor whose computed `overflow-y` is `auto` or `scroll`.
 * `hidden` is deliberately excluded — it is scrollable from script but not by a reader, so a
 * sticky bar inside one has nothing to react to — and `clip` is not a scroll container at all.
 * `<body>` and `<html>` are never returned as elements: a scroll on either is the document's,
 * and the document is answered as `document.scrollingElement` so that `scrollTop`,
 * `scrollHeight` and `clientHeight` read the same way whatever the answer is.
 *
 * Client-only, like everything that measures. There is no server-side answer to "what scrolls
 * this", so a caller runs it from an effect, never at module scope.
 */

/**
 * The element that stands for `document` when the document scrolls: `document.scrollingElement`,
 * which is `<html>` in standards mode and `<body>` in quirks mode, so that `scrollTop`,
 * `scrollHeight` and `scrollTo` read and write the way they do on any other scroller. The
 * fallback exists for the quirks-mode oddities in which `scrollingElement` is `null` (MDN,
 * `Document.scrollingElement`); a standards-mode document never takes it.
 */
export function documentScrollerOf(document: Document): HTMLElement {
	return (document.scrollingElement ?? document.documentElement) as HTMLElement;
}

/** The nearest scroll container above `element`, or the document's scrolling element. */
export function scrollParentOf(element: Element): HTMLElement {
	const document = element.ownerDocument;

	let current = element.parentElement;
	while (current && current !== document.body && current !== document.documentElement) {
		const { overflowY } = getComputedStyle(current);
		if (overflowY === "auto" || overflowY === "scroll") return current;
		current = current.parentElement;
	}
	return documentScrollerOf(document);
}

/** Whether `scroller` is the document itself rather than an element inside it. */
export function isDocumentScroller(scroller: Element): boolean {
	return scroller === documentScrollerOf(scroller.ownerDocument);
}

/**
 * Where to listen for `scroller`'s `scroll` events.
 *
 * The document's fire on `window` (and `document`), never on `<html>` — so a listener attached
 * to what {@link scrollParentOf} returned would miss every one of them. An element's fire on the
 * element.
 *
 * THE CAPTURE PHASE, stated once here for every listener in the kit that has no single scroller
 * to ask. `scroll` does not bubble (MDN, `Element: scroll event`), so a plain — bubbling —
 * listener on `window` or `document` hears only the document's own scrolls, which inside the
 * shell never happen: the canvas scrolls and the document stays put (`src/app.css`). A
 * capturing listener on `window` is instead handed every `scroll` on the page on its way down
 * to whichever box scrolled — the document's, the canvas's, a nested panel's — which is what
 * "react whenever anything under me moves" listens with. A listener added with `capture` is
 * only removed with `capture`: the flag is part of the listener's identity, and a
 * `removeEventListener` without it removes nothing (MDN, `EventTarget.removeEventListener`).
 */
export function scrollEventTargetOf(scroller: Element): EventTarget {
	return isDocumentScroller(scroller) ? scroller.ownerDocument.defaultView! : scroller;
}

/**
 * `element`'s top edge as an offset into `scroller`'s content, in CSS pixels — the value to hand
 * `scroller.scrollTo({ top })` to bring the edge to the top of the scroller.
 *
 * For the document that is the familiar `rect.top + scrollY`; for an element it is the same sum
 * taken from the scroller's own edge rather than the viewport's. That edge is the PADDING edge:
 * `scrollTop` counts from where the scrollable content starts, inside the border, whereas
 * `getBoundingClientRect` reports the border edge — so `clientTop`, the top border's width, is
 * added back (MDN, `Element.clientTop`). Without it a bordered `Card` or `ScrollArea` used as a
 * scroll panel scrolled every target a border-width too far, tucking its edge under the border.
 */
export function offsetWithin(scroller: Element, element: Element): number {
	const top = element.getBoundingClientRect().top;
	const origin = isDocumentScroller(scroller)
		? 0
		: scroller.getBoundingClientRect().top + scroller.clientTop;
	return top - origin + scroller.scrollTop;
}
