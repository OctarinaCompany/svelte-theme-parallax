/**
 * The sidebar's own light/dark axis.
 *
 * A THIRD APPEARANCE AXIS, alongside the palette and the page mode: it decides whether the rail
 * wears the mode the page wears, or the other one. A dark rail beside a light document is
 * the look most dashboards ship with; the inverse — a light rail on a dark page — is the same
 * choice seen from the other mode.
 *
 * TWO STATES, RELATIVE ONES (owner decision, 2026-08-13 — this replaced an absolute
 * `auto`/`light`/`dark` pin). `default` writes no attribute: no CSS block matches and the rail
 * follows the page as it always did. `inverted` wears the OPPOSITE of the page mode — and stays
 * opposite when the user flips the page, which is what an absolute pin could not promise. The
 * stylesheets still key on `data-sidebar-mode="light" | "dark"`, so this module RESOLVES the
 * relative choice to an absolute attribute and re-resolves it whenever the page mode moves
 * (the `$effect.root` below; mode-watcher's `mode` is the reactive input).
 *
 * WHY NOT mode-watcher. It owns `.dark` and `data-theme` and persists both, and `$lib/themes`
 * leans on that rather than keeping a second copy. It has no third attribute to lend, so this
 * one is written here — deliberately in its shape: same `<html>` placement, same
 * `localStorage`-then-attribute order, so the axes are read the same way in devtools.
 *
 * @see tools/themes/generate.mjs — the CSS blocks the attribute selects, and their specificity
 * @see src/app.css — the same pair of blocks for the base palette
 */

import { mode } from "mode-watcher";

/** The `localStorage` key. Also read by the first-paint script in `index.html`. */
export const SIDEBAR_MODE_STORAGE_KEY = "sidebar-mode";

/** The attribute the stylesheets select on. Absent for `default`. */
export const SIDEBAR_MODE_ATTRIBUTE = "data-sidebar-mode";

export type SidebarMode = "default" | "inverted";

/**
 * The stored choice, narrowed — with a migration. `auto` is the retired name of `default`, and
 * a stored absolute `dark` pin was, in every real install, the classic dark-rail-on-light-page
 * look, which is exactly what `inverted` now says; a stored `light` collapses to `default`.
 * Anything else falls back to `default`, the state that needs no stylesheet to be correct.
 */
function read(): SidebarMode {
	try {
		// Guard for any non-browser evaluation (prerendering, tests, SSR added later) — INSIDE
		// the try, because with storage fully blocked the `localStorage` getter itself throws.
		if (typeof localStorage === "undefined") return "default";

		const stored = localStorage.getItem(SIDEBAR_MODE_STORAGE_KEY);
		if (stored === "inverted" || stored === "dark") return "inverted";
		return "default";
	} catch {
		// Storage blocked outright. The session still switches, it just does not persist.
		return "default";
	}
}

function persist(value: SidebarMode): void {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(SIDEBAR_MODE_STORAGE_KEY, value);
	} catch {
		/* storage blocked — the attribute is still applied, it just will not survive a reload */
	}
}

let current = $state<SidebarMode>(read());

// Normalise storage once, so a migrated legacy value is stored under its new name.
// `persist` carries its own guards; a bare `typeof localStorage` here would throw when blocked.
// The initial value is exactly what this wants — Svelte 5.57 warns on any module-level read.
// svelte-ignore state_referenced_locally
persist(current);

/**
 * What the rail actually wears, resolved against the live page mode. This is the value the
 * attribute carries under `inverted`, and what `header-mode.svelte.ts` inverts in turn.
 */
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
 * Keep the attribute in step with both inputs — the stored choice and the page mode. The
 * first-paint script in `index.html` has already written the same resolution one frame before
 * this module existed, so on the happy path the first run changes nothing; every later run is
 * the page mode flipping under an `inverted` rail, which an attribute written once could not
 * follow.
 */
$effect.root(() => {
	$effect(() => {
		if (typeof document === "undefined") return;
		if (current === "inverted") {
			document.documentElement.setAttribute(SIDEBAR_MODE_ATTRIBUTE, wear);
		} else {
			document.documentElement.removeAttribute(SIDEBAR_MODE_ATTRIBUTE);
		}
	});
});

/** The active sidebar mode. Read-only; write through {@link setSidebarMode}. */
export const sidebarMode = {
	get current(): SidebarMode {
		return current;
	},
};

/** The light/dark half the rail is wearing right now, whatever the reason. Read-only. */
export const sidebarWear = {
	get current(): "light" | "dark" {
		return wear;
	},
};

/** Invert the rail against the page, or hand it back with `default`. Persists. */
export function setSidebarMode(value: SidebarMode): void {
	current = value;
	persist(value);
}
