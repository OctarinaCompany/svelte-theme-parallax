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
 * WHAT THIS DOES INSTEAD. Remembers the scroll offset at the moment of opening and puts it back
 * on the frames the stray scroll can land in. Restoring inside the scroll listener happens before
 * the next paint, so nothing is drawn at the wrong offset and there is no flicker to see. It
 * stops at the first frame after the popup is placed, which is also the first frame a real user
 * scroll could arrive, so a deliberate scroll is never fought.
 */

/** How many frames to watch. Placement lands in one or two; three is margin, not superstition. */
const FRAMES = 3;

/**
 * `onOpenChange` for a `Popover.Root` whose content holds a `Command`.
 *
 * Does nothing on close, and nothing at all outside the browser.
 */
export function keepPageScroll(open: boolean): void {
	if (!open || typeof window === "undefined") return;

	const top = window.scrollY;
	const left = window.scrollX;
	let frames = 0;

	const restore = () => {
		if (window.scrollY !== top || window.scrollX !== left) window.scrollTo(left, top);
	};

	window.addEventListener("scroll", restore, true);

	const tick = () => {
		restore();
		if (++frames >= FRAMES) {
			window.removeEventListener("scroll", restore, true);
			return;
		}
		requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
}
