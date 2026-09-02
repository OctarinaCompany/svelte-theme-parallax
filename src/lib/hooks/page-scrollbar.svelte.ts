/**
 * The page's own scrollbar: the theme's, or the platform's.
 *
 * WHAT IT SWITCHES is two declarations on the canvas — `scrollbar-width: thin` and a
 * `scrollbar-color` pair taken from the palette — so the bar down the side of the page reads as
 * part of the kit rather than as a system control borrowed from the desktop. Off, the canvas hands
 * the bar back to the platform untouched, which is what an operating system's own convention looks
 * like and what some readers would rather have.
 *
 * WHAT IT DOES NOT SWITCH is `scrollbar-gutter: stable`, which stays on the canvas unconditionally.
 * That one is not a look: it reserves the bar's width whether or not there is a bar, so navigating
 * between a page that overflows and one that does not stops resizing the canvas. A fix and a taste
 * are two different things and only the taste gets a switch.
 *
 * OFF BY DEFAULT, like the backdrop and unlike the floating rail — an owner decision (2026-09-02),
 * taken after living with the opposite for an afternoon. A scrollbar is the operating system's own
 * control before it is anyone's design: it carries the platform's drag target, its arrow buttons
 * where the platform has them, and the habits of the reader using it. A theme kit may offer to
 * dress it and should not assume the offer is accepted, so the kit ships the bar the machine
 * already draws and this axis is the opt-in. The switch is the same either way; only what a first
 * visit sees changed.
 *
 * The key is read only when ABSENT: a reader who turns it on finds it on at the next load.
 *
 * IT WRITES AN ATTRIBUTE, unlike its two behaviour siblings, and the asymmetry is the same one
 * `header-behaviour.svelte.ts` records: those flags only ever change classes on an element Svelte
 * owns, while this one is read by a STYLESHEET, so the document has to carry the value. Which is
 * also why `index.html`'s first-paint script writes it a frame before this module exists — and why
 * that is not merely cosmetic here: `thin` narrows the reserved gutter (measured: 15px to 10px at
 * 1440px), so a late attribute would move the page's width under the reader rather than just
 * recolour a bar.
 *
 * @see src/app.css — `:root[data-scrollbar="themed"] [data-slot="sidebar-inset"]`, and the canvas
 *      block above it that explains the gutter this axis deliberately does not govern
 * @see src/lib/components/pages/SettingsPage.svelte — the switch over this state
 */

/** The `localStorage` key. Also read by the first-paint script in `index.html`. */
export const PAGE_SCROLLBAR_STORAGE_KEY = "page-scrollbar";

/** The attribute the stylesheet selects on. Absent means the platform's bar. */
export const PAGE_SCROLLBAR_ATTRIBUTE = "data-scrollbar";

/** The one value the attribute takes. Written verbatim by this hook and by the first-paint script. */
export const PAGE_SCROLLBAR_THEMED = "themed";

function read(): boolean {
	try {
		// Guard for any non-browser evaluation (prerendering, tests, SSR added later) — INSIDE
		// the try, because with storage fully blocked the `localStorage` getter itself throws.
		if (typeof localStorage === "undefined") return false;

		// Only the literal "true" turns it on — absent means the platform's own bar.
		return localStorage.getItem(PAGE_SCROLLBAR_STORAGE_KEY) === "true";
	} catch {
		// Storage blocked outright. The session still switches, it just does not persist.
		return false;
	}
}

let current = $state<boolean>(read());

/*
 * Keep the attribute in step with the stored choice. The first-paint script has already written
 * the same answer one frame before this module existed, so on the happy path the first run changes
 * nothing; every later run is the reader working the switch.
 */
$effect.root(() => {
	$effect(() => {
		if (typeof document === "undefined") return;

		if (current) {
			document.documentElement.setAttribute(PAGE_SCROLLBAR_ATTRIBUTE, PAGE_SCROLLBAR_THEMED);
		} else {
			document.documentElement.removeAttribute(PAGE_SCROLLBAR_ATTRIBUTE);
		}
	});
});

/** Whether the page's scrollbar wears the theme. Read-only; write through the setter. */
export const pageScrollbar = {
	get current(): boolean {
		return current;
	},
};

/** Dress the page's scrollbar in the palette, or hand it back to the platform. Persists. */
export function setPageScrollbar(value: boolean): void {
	current = value;

	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(PAGE_SCROLLBAR_STORAGE_KEY, String(value));
	} catch {
		/* storage blocked — the attribute still moves, it just will not survive a reload */
	}
}
