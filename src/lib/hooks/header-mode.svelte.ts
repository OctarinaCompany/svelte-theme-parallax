/**
 * The page header's own light/dark axis.
 *
 * A FOURTH APPEARANCE CONTROL, and the sibling of `sidebar-mode.svelte.ts`: it decides whether
 * the bar wears the mode the page wears, or the other one.
 *
 * TWO STATES, RELATIVE TO THE PAGE — and INDEPENDENT of the rail's axis (owner decision,
 * 2026-08-13, revising the first cut of the same day where `default` followed the rail:
 * inverting the rail dragged the bar with it, which read as a bug from the control that had
 * only asked for the rail). `default` wears the page's mode even beside an inverted rail;
 * `inverted` wears the opposite half and keeps wearing it as the page mode moves.
 *
 * THE ATTRIBUTE FIGHTS AN INHERITANCE. With no `data-header-mode` attribute the stylesheets
 * hand the bar the nine chrome tokens exactly as the RAIL resolved them — that is the CSS
 * default this axis's independence has to overrule. So the attribute is written whenever the
 * bar's resolved wear DIFFERS from the rail's (an absolute `light`/`dark` the stylesheets key
 * on), and removed when the two agree, where inheriting is already correct. Both are
 * re-resolved reactively as the page mode or the rail's axis moves.
 *
 * @see tools/themes/generate.mjs — the two selectors this attribute widens, and their specificity
 * @see src/app.css — the same pair for the base palette, plus the alias block that makes the pin
 * visible on the bar's children
 */

import { mode } from "mode-watcher";

import { sidebarWear } from "./sidebar-mode.svelte.js";

/** The `localStorage` key. Also read by the first-paint script in `index.html`. */
export const HEADER_MODE_STORAGE_KEY = "header-mode";

/** The attribute the stylesheets select on. Absent when the bar agrees with the rail. */
export const HEADER_MODE_ATTRIBUTE = "data-header-mode";

export type HeaderMode = "default" | "inverted";

/**
 * The stored choice, narrowed — with a migration. `auto` is the retired name of `default`; the
 * retired absolute pins have no faithful relative reading, so both collapse to `default`
 * rather than guessing.
 */
function read(): HeaderMode {
	try {
		// Guard for any non-browser evaluation (prerendering, tests, SSR added later) — INSIDE
		// the try, because with storage fully blocked the `localStorage` getter itself throws.
		if (typeof localStorage === "undefined") return "default";

		const stored = localStorage.getItem(HEADER_MODE_STORAGE_KEY);
		return stored === "inverted" ? "inverted" : "default";
	} catch {
		// Storage blocked outright. The session still switches, it just does not persist.
		return "default";
	}
}

function persist(value: HeaderMode): void {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(HEADER_MODE_STORAGE_KEY, value);
	} catch {
		/* storage blocked — the attribute is still applied, it just will not survive a reload */
	}
}

let current = $state<HeaderMode>(read());

// Normalise storage once, so a migrated legacy value is stored under its new name.
// `persist` carries its own guards; a bare `typeof localStorage` here would throw when blocked.
persist(current);

/** What the bar actually wears: the page's mode, or its opposite under `inverted`. */
const wear = $derived<"light" | "dark">(
	current === "inverted"
		? mode.current === "dark"
			? "light"
			: "dark"
		: mode.current === "dark"
			? "dark"
			: "light",
);

/*
 * Keep the attribute in step with all three inputs — this choice, the page mode, and the
 * rail's wear it may have to overrule. The first-paint script in `index.html` performs the
 * same resolution once, pre-hydration.
 */
$effect.root(() => {
	$effect(() => {
		if (typeof document === "undefined") return;
		if (wear !== sidebarWear.current) {
			document.documentElement.setAttribute(HEADER_MODE_ATTRIBUTE, wear);
		} else {
			document.documentElement.removeAttribute(HEADER_MODE_ATTRIBUTE);
		}
	});
});

/** The active header mode. Read-only; write through {@link setHeaderMode}. */
export const headerMode = {
	get current(): HeaderMode {
		return current;
	},
};

/** The light/dark half the bar is wearing right now, whatever the reason. Read-only. */
export const headerWear = {
	get current(): "light" | "dark" {
		return wear;
	},
};

/** Invert the bar against the page, or hand it back with `default`. Persists. */
export function setHeaderMode(value: HeaderMode): void {
	current = value;
	persist(value);
}
