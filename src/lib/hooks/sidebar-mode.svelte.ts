/**
 * The sidebar's own appearance axis.
 *
 * A THIRD APPEARANCE AXIS, alongside the palette and the page mode: it decides what the rail is
 * dressed in. A dark rail beside a light document is the look most dashboards ship with; the
 * inverse — a light rail on a dark page — is the same choice seen from the other mode.
 *
 * THREE STATES, AND THEY ARE NOT ALL THE SAME KIND OF THING.
 *
 *   `default`  — writes no attribute: no CSS block matches and the rail follows the page.
 *   `inverted` — RELATIVE (owner decision, 2026-08-13, replacing an absolute `light`/`dark` pin).
 *                It wears the OPPOSITE of the page mode and STAYS opposite when the page flips,
 *                which is what a pin could not promise. The stylesheets key on an absolute
 *                `light`/`dark`, so this module resolves the relative choice and re-resolves it
 *                whenever the page mode moves — the `$effect.root` below, with mode-watcher's
 *                `mode` as the reactive input.
 *   `vibrant`   — ABSOLUTE, and the one state that is not a light/dark choice at all: the panel
 *                is painted with the palette's own brand as a corner light. It writes itself
 *                verbatim, because there is nothing to resolve — the surface answers `.dark` in
 *                its own stylesheet. It began life as a "flavor" and was promoted here, which is
 *                the right home: it dresses exactly the surface this axis owns, and a reader
 *                choosing how the rail looks should find all three answers in one control.
 *
 * WHAT `vibrant` COSTS THE HEADER'S AXIS. That sibling normally omits its attribute when the bar
 * and the rail agree, and lets the bar inherit the rail's resolution. A vibrant rail resolves to
 * nothing inheritable — its tokens are set on the panel, not on `<html>` — so the bar has to
 * state its own. `header-mode.svelte.ts` reads `sidebarMode` for exactly that one case.
 *
 * WHY NOT mode-watcher. It owns `.dark` and `data-theme` and persists both, and `$lib/themes`
 * leans on that rather than keeping a second copy. It has no third attribute to lend, so this
 * one is written here — deliberately in its shape: same `<html>` placement, same
 * `localStorage`-then-attribute order, so the axes are read the same way in devtools.
 *
 * @see tools/themes/generate.mjs — the CSS blocks the light/dark values select
 * @see src/app.css — the same pair of blocks for the base palette
 * @see src/vibrant.css — the third value's own stylesheet
 */

import { mode } from "mode-watcher";

/** The `localStorage` key. Also read by the first-paint script in `index.html`. */
export const SIDEBAR_MODE_STORAGE_KEY = "sidebar-mode";

/** The attribute the stylesheets select on. Absent for `default`. */
export const SIDEBAR_MODE_ATTRIBUTE = "data-sidebar-mode";

export type SidebarMode = "default" | "inverted" | "vibrant";

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
		if (stored === "vibrant") return "vibrant";
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
 *
 * `vibrant` REPORTS DARK, and it is a real answer rather than a default: the painted panel is a
 * deep brand colour in both halves and carries `color-scheme: dark`, so anything asking "which
 * half is the rail wearing" — to pick an ink, to draw a swatch — should be told the dark one.
 */
const wear = $derived<"light" | "dark">(
	current === "vibrant"
		? "dark"
		: current === "inverted"
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
 *
 * `vibrant` is written VERBATIM, not resolved: it is the one value that is not a light/dark
 * choice, so there is nothing for this module to compute and its stylesheet answers `.dark`
 * itself. That also means the per-theme `[data-sidebar-mode='light'|'dark']` blocks stop
 * matching, which is exactly right — the vibrant panel states all nine chrome tokens on itself.
 */
$effect.root(() => {
	$effect(() => {
		if (typeof document === "undefined") return;
		if (current === "vibrant") {
			document.documentElement.setAttribute(SIDEBAR_MODE_ATTRIBUTE, "vibrant");
		} else if (current === "inverted") {
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
