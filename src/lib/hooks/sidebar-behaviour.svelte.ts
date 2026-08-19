/**
 * The sidebar's one behaviour flag: floating.
 *
 * The sibling of `header-behaviour.svelte.ts`, with the default REVERSED: the kit has shipped
 * `variant="floating"` on `AppSidebar` since the shell landed (see the comment there), so
 * `true` is what every install already looks like and an absent key must read `true`. Off
 * seats the rail flush against the viewport.
 *
 * No DOM attribute, for the same reason the header flags carry none: the change is a prop on a
 * Svelte-owned component (`AppSidebar` maps it to `Sidebar.Root`'s `variant`), so nothing in a
 * stylesheet needs to see it — which is also why it is absent from the `index.html` first-paint
 * script.
 */

/** The `localStorage` key. */
export const SIDEBAR_FLOATING_STORAGE_KEY = "sidebar-floating";

function read(): boolean {
	try {
		// Guard for any non-browser evaluation (prerendering, tests, SSR added later) — INSIDE
		// the try, because with storage fully blocked the `localStorage` getter itself throws.
		if (typeof localStorage === "undefined") return true;

		// Only the literal "false" turns it off — absent means the shipped floating look.
		return localStorage.getItem(SIDEBAR_FLOATING_STORAGE_KEY) !== "false";
	} catch {
		// Storage blocked outright. The session still switches, it just does not persist.
		return true;
	}
}

let current = $state<boolean>(read());

/** Whether the sidebar floats as an inset panel. Read-only; write through the setter. */
export const sidebarFloating = {
	get current(): boolean {
		return current;
	},
};

/** Detach the rail into the inset panel, or seat it flush against the viewport. Persists. */
export function setSidebarFloating(value: boolean): void {
	current = value;

	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(SIDEBAR_FLOATING_STORAGE_KEY, String(value));
	} catch {
		/* storage blocked — the variant still switches, it just will not survive a reload */
	}
}
