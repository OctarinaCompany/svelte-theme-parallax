/**
 * Keeps the page where it was when one of this page's comboboxes opens.
 *
 * THE BUG THIS ANSWERS, measured rather than guessed. A floating popup is parked off the page
 * while it is measured — `bits-ui` sets `transform: translate(0, -200%)` on the wrapper until
 * floating-ui has placed it, and its comment says exactly that: "keep off page when measuring".
 * Radix does the same thing in React, character for character. Meanwhile `Command` reveals its
 * selected option with `scrollIntoView({ block: "nearest" })` and does not wait for the placement,
 * so the browser is asked to scroll to an element sitting 200% above the viewport and obliges: the
 * page jumps to the top, the popup then slides into its real position, and the scroll damage stays.
 *
 * WHY IT LOOKS INTERMITTENT. It is a race, and React wins it by accident: Radix places the popup
 * in a `useLayoutEffect`, before paint, so `cmdk`'s scheduled scroll always finds it already
 * placed. bits-ui places it in an `$effect`, after paint, so whichever lands first decides. Some
 * scroll positions and some examples never show it.
 *
 * WHY NOT FIX IT WHERE IT HAPPENS. `bits-ui` already knows the answer and applies it to its own
 * `Select`, which refuses to scroll unless `content.isPositioned` — its `Command` has no such
 * guard. That flag, and the `onPlaced` callback beside it, are internal to the floating layer and
 * not exposed on `Popover.Content`, so there is nothing to wait on from out here. Delaying the
 * list until the popup is placed does work and costs a visible frame of the popup growing, which
 * is a worse trade for an intermittent jump. The reference implementation avoided the question rather than answering it:
 * its combobox is not `Popover` + `Command` at all, but Base UI's `Combobox` with a `Positioner`
 * of its own — the same shape this repository's own `ui/combobox` primitive takes.
 *
 * WHAT THIS DOES INSTEAD. Remembers the scroll offset of every box the stray scroll can land in
 * at the moment of opening, and puts back whichever one moved on the frames it can land in.
 * `scrollIntoView` scrolls EVERY scrollable ancestor that needs to move to reveal the element,
 * and in the Parallax shell the page that is being kept in place is the canvas — `Sidebar.Inset`
 * is the scroll container and the document never scrolls (`src/app.css`,
 * `src/lib/shared/scroll-parent.ts`) — so the canvas is snapshotted alongside the document rather
 * than instead of it: a page where the document still scrolls is protected the same way, and a
 * page without a shell has one box fewer to watch, because `scrollCanvas`
 * (`src/lib/hooks/route.svelte.ts`) then answers the document again and the pair collapses to
 * one. Restoring inside the
 * scroll listener happens before the next paint, so nothing is drawn at the wrong offset and
 * there is no flicker to see. The listener sits on `window` in the capture phase because `scroll`
 * does not bubble: that is the one place that hears a scroll on any box. It stops at the first
 * frame after the popup is placed, which is also the first frame a real user scroll could arrive,
 * so a deliberate scroll is never fought.
 */

import { scrollCanvas } from "$lib/hooks/route.svelte.js";

/** How many frames to watch. Placement lands in one or two; three is margin, not superstition. */
const FRAMES = 3;

/** One box to hold still: where it was when the popup opened. */
type Snapshot = { element: Element; top: number; left: number };

/**
 * `onOpenChange` for a `Popover.Root` whose content holds a `Command`.
 *
 * Does nothing on close, and nothing at all outside the browser.
 */
export function keepPageScroll(open: boolean): void {
	if (!open || typeof window === "undefined") return;

	// `document.scrollingElement` stands for the document so that `scrollTop` and `scrollTo` read
	// and write the same way on both boxes; it is `null` only in quirks-mode oddities, hence the
	// filter rather than an assertion. `scrollCanvas` is the canvas inside the shell and the same
	// scrolling element again where there is none, which the `Set` collapses to a single box.
	const snapshots: Snapshot[] = [...new Set([document.scrollingElement, scrollCanvas()])]
		.filter((element): element is Element => element !== null)
		.map((element) => ({ element, top: element.scrollTop, left: element.scrollLeft }));
	let frames = 0;

	const restore = () => {
		for (const { element, top, left } of snapshots) {
			if (element.scrollTop !== top || element.scrollLeft !== left) element.scrollTo(left, top);
		}
	};

	window.addEventListener("scroll", restore, { capture: true, passive: true });

	const tick = () => {
		restore();
		if (++frames >= FRAMES) {
			window.removeEventListener("scroll", restore, { capture: true });
			return;
		}
		requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
}
