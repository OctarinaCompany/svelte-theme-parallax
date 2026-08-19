/**
 * How the page header behaves as the page scrolls: two independent flags, both persisted.
 *
 * STICKY IS NOT HERE, because sticky is not an option. The bar is always pinned; a toggle for the
 * behaviour nobody turns off would be a fifth trigger in a cluster that already has four.
 *
 * NO ATTRIBUTE ON `<html>`, unlike `header-mode.svelte.ts` beside it, and the asymmetry is the
 * point rather than an oversight. The colour axis needs one because CSS token blocks key on it —
 * a stylesheet has to be able to read the value. These two only ever change classes on an element
 * Svelte creates and owns, so there is nothing for a stylesheet to select and nothing for a
 * first-paint script to prevent: `scroll-padding-top` is written once in `app.css` to cover the
 * floating inset as well as the flat bar, precisely so that neither flag has to reach the document.
 *
 * WHY THESE ARE USER-FACING and not author-facing props: 109 pages render `DocPage` with no props,
 * and `DocPage` is the only `PageHeader` call site. A prop would mean editing 109 files, or
 * shipping a default no visitor can reach. Every other appearance axis in this application is
 * already a persisted user control in the same cluster, and a showcase kit demonstrates an option
 * by letting someone flip it.
 */

/** The `localStorage` keys. */
export const HEADER_AUTO_HIDE_STORAGE_KEY = "header-auto-hide";
export const HEADER_FLOATING_STORAGE_KEY = "header-floating";

/**
 * Read a persisted boolean.
 *
 * Anything that is not the literal `"true"` reads as `false`, so a stale or corrupted value falls
 * back to the plain sticky bar — the state that needs no behaviour to be correct, the same
 * principle `auto` follows in the two mode hooks.
 */
function read(key: string): boolean {
	try {
		// The `typeof` guard sits INSIDE the try: with storage fully blocked the `localStorage`
		// getter itself throws, so even the existence check has to be caught.
		if (typeof localStorage === "undefined") return false;

		return localStorage.getItem(key) === "true";
	} catch {
		// Storage blocked outright. The session still toggles, it just does not persist.
		return false;
	}
}

function write(key: string, value: boolean): void {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(key, String(value));
	} catch {
		/* storage blocked — the flag still applies, it just will not survive a reload */
	}
}

let autoHide = $state<boolean>(read(HEADER_AUTO_HIDE_STORAGE_KEY));
let floating = $state<boolean>(read(HEADER_FLOATING_STORAGE_KEY));

/** Slide the bar away on scroll down, bring it back on scroll up. */
export const headerAutoHide = {
	get current(): boolean {
		return autoHide;
	},
};

/** Detach the bar into a rounded panel, inset the way the sidebar's floating variant is. */
export const headerFloating = {
	get current(): boolean {
		return floating;
	},
};

export function setHeaderAutoHide(value: boolean): void {
	autoHide = value;
	write(HEADER_AUTO_HIDE_STORAGE_KEY, value);
}

export function setHeaderFloating(value: boolean): void {
	floating = value;
	write(HEADER_FLOATING_STORAGE_KEY, value);
}
