/**
 * The flavor axis.
 *
 * A FIFTH APPEARANCE CONTROL, and the only one that is not a colour: the palette (`data-theme`)
 * and the mode (`.dark`) decide what the surfaces are painted WITH, and a flavor decides what is
 * painted — a gradient down the rail, a band across the bar, a spotlight behind the page, a serif
 * on the headings, a radius that squares or rounds everything. It is layered OVER the other four
 * rather than beside them, so every flavor composes with every palette in either mode, and each
 * one derives its colours from the live tokens instead of restating them.
 *
 * WHY IT EXISTS. Twelve palettes over one token set change the hue and nothing else, so twelve
 * applications built on this kit are twelve pages of the same drawing in different inks. A flavor
 * is the axis that answers "which application is this?" before a single label is read.
 *
 * SEVEN VALUES, ONE OF THEM ABSENT. `stock` writes NO attribute — `src/flavors.css` has no block
 * for it, so it is the kit exactly as it ships and needs no CSS to be correct. That absence is the
 * same third state the two chrome axes use, and it is why the default costs nothing. Every other
 * id is written verbatim as `data-flavor` on `<html>`: THE IDS ARE THE ATTRIBUTE VALUES, so a
 * rename here is a rename in the stylesheet.
 *
 * ABSOLUTE, NOT RELATIVE, unlike `sidebar-mode` and `header-mode`. Those two resolve a choice
 * against the page mode and re-resolve it whenever the mode moves; a flavor has no such
 * arithmetic — its stylesheet answers `.dark` itself — so there is no `wear` here, and the
 * first-paint script in `index.html` echoes the stored id with no resolution to perform.
 *
 * @see src/flavors.css — the blocks this attribute selects, and their specificity ladder
 * @see index.html — the first-paint copy of the same key, and why it has to exist
 * @see src/lib/hooks/sidebar-mode.svelte.ts — the axis this module is shaped after
 */

/** The `localStorage` key. Also read by the first-paint script in `index.html`. */
export const FLAVOR_STORAGE_KEY = "flavor";

/** The attribute the stylesheets select on. Absent for `stock`. */
export const FLAVOR_ATTRIBUTE = "data-flavor";

/**
 * Every flavor, in the order the picker lists them: the control first, then the families in
 * widening scope — chrome, light, type, shape.
 *
 * FIVE MORE WERE BUILT AND CUT, on the owner's verdict after seeing all twelve on screen:
 * `masthead` and `overlap` (their brand band and ink L-frame both lost to Cascade, which paints
 * the same two surfaces better), `glass`, `editorial` and `crest`. The removals are the point of
 * a POC — the list is what survived being looked at, not what was easy to write.
 */
export const FLAVOR_IDS = [
	"stock",
	"cascade",
	"glow",
	"aurora",
	"devtool",
	"pebble",
	"brutalist",
] as const;

export type FlavorId = (typeof FLAVOR_IDS)[number];

/** What a first visit gets, and what an unknown stored value falls back to. */
export const DEFAULT_FLAVOR: FlavorId = "stock";

/**
 * What a flavor mostly changes. The picker rules a line between families rather than labelling
 * them: a flat list of rows reads as a list, grouped rows read as a menu.
 */
export type FlavorFamily = "none" | "chrome" | "light" | "type" | "shape";

export type Flavor = {
	id: FlavorId;
	name: string;
	/** One line, for the picker's row and the Settings card. */
	blurb: string;
	family: FlavorFamily;
};

/**
 * The list the picker renders. It is written here rather than in `src/lib/data/` because that
 * folder is the demo's CONTENT — workspaces, users, transcripts — and this is appearance
 * vocabulary, the counterpart of `THEMES` in `src/lib/themes/palettes.ts`.
 */
export const FLAVORS: Flavor[] = [
	{
		id: "stock",
		name: "Stock",
		blurb: "The kit exactly as it ships. Nothing is painted.",
		family: "none",
	},
	{
		id: "cascade",
		name: "Cascade",
		blurb: "The brand poured down the sidebar as a gradient, with a little grain.",
		family: "chrome",
	},
	{
		id: "glow",
		name: "Glow",
		blurb: "One soft brand spotlight, hanging above the page.",
		family: "light",
	},
	{
		id: "aurora",
		name: "Aurora",
		blurb: "Three colour fields drifting slowly behind the content.",
		family: "light",
	},
	{
		id: "devtool",
		name: "Devtool",
		blurb: "Mono labels, sharp corners and a faint engineering grid.",
		family: "type",
	},
	{
		id: "pebble",
		name: "Pebble",
		blurb: "Soft and rounded: pills, wide corners, tinted shadows.",
		family: "shape",
	},
	{
		id: "brutalist",
		name: "Brutalist",
		blurb: "No radius, thick ink borders, a hard offset shadow and one loud fill.",
		family: "shape",
	},
];

/** Whether a string is a flavor this application actually ships. */
export function isFlavorId(value: string | null | undefined): value is FlavorId {
	return typeof value === "string" && (FLAVOR_IDS as readonly string[]).includes(value);
}

/**
 * The stored choice, narrowed. The narrowing is not paranoia: the value comes from
 * `localStorage`, so it survives a flavor being renamed or dropped, and an unknown id would
 * otherwise leave `<html>` carrying an attribute no stylesheet answers — which renders as stock
 * anyway, but with the picker showing nothing selected.
 */
function read(): FlavorId {
	try {
		// Guard for any non-browser evaluation (prerendering, tests, SSR added later) — INSIDE
		// the try, because with storage fully blocked the `localStorage` getter itself throws.
		if (typeof localStorage === "undefined") return DEFAULT_FLAVOR;

		const stored = localStorage.getItem(FLAVOR_STORAGE_KEY);
		return isFlavorId(stored) ? stored : DEFAULT_FLAVOR;
	} catch {
		// Storage blocked outright. The session still switches, it just does not persist.
		return DEFAULT_FLAVOR;
	}
}

function persist(value: FlavorId): void {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(FLAVOR_STORAGE_KEY, value);
	} catch {
		/* storage blocked — the attribute is still applied, it just will not survive a reload */
	}
}

let current = $state<FlavorId>(read());

// Normalise storage once, so an unknown id is replaced by the one the app is actually showing —
// which is also what stops the first-paint script writing it again on the next load.
// `persist` carries its own guards; a bare `typeof localStorage` here would throw when blocked.
// The initial value is exactly what this wants — Svelte 5.57 warns on any module-level read.
// svelte-ignore state_referenced_locally
persist(current);

/*
 * Keep the attribute in step with the choice. The first-paint script in `index.html` has already
 * written the same value one frame before this module existed, so on the happy path the first run
 * changes nothing; it is every later run — the picker — that this exists for.
 *
 * `stock` REMOVES the attribute rather than writing `"stock"`: the absence is the state, and a
 * value no stylesheet answers would be one more thing to strip later.
 */
$effect.root(() => {
	$effect(() => {
		if (typeof document === "undefined") return;
		if (current === DEFAULT_FLAVOR) {
			document.documentElement.removeAttribute(FLAVOR_ATTRIBUTE);
		} else {
			document.documentElement.setAttribute(FLAVOR_ATTRIBUTE, current);
		}
	});
});

/** The active flavor, always a known id. Read-only; write through {@link setFlavor}. */
export const activeFlavor = {
	get current(): FlavorId {
		return current;
	},
};

/** Switch flavors. Persists, and takes effect on the next frame. */
export function setFlavor(value: FlavorId): void {
	current = value;
	persist(value);
}

/** The record for a flavor id, for the picker's trigger and the Settings page. */
export function flavorById(id: FlavorId): Flavor {
	// Non-null: `id` is a `FlavorId`, and `FLAVORS` is written from the same list.
	return FLAVORS.find((f) => f.id === id)!;
}
