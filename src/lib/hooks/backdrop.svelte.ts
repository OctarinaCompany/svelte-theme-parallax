/**
 * The backdrop axis.
 *
 * A FIFTH APPEARANCE CONTROL, and the only one that paints nothing the other four own: the palette
 * (`data-theme`) and the mode (`.dark`) decide what the surfaces are painted WITH, and a backdrop
 * decides what is painted BEHIND them. It is layered OVER the other four rather than beside them,
 * so every backdrop composes with every palette in either mode, and each one derives its colours
 * from the live tokens instead of restating them.
 *
 * IT WAS CALLED `flavor` UNTIL IT ONLY DID THIS, and the rename is the point rather than a tidy-up.
 * The axis held twelve looks spanning type, shape and light, and an umbrella name was right for
 * that spread. Eight were cut and one was promoted to the chrome axis, leaving three values that
 * are all the same kind of object — so the umbrella covered one thing, and the comment here had to
 * say "a flavor is now strictly a light behind the page", which is a name admitting it stopped
 * carrying the information.
 *
 * `backdrop` AND NOT `background`, deliberately: `--background` is the page ground, which this
 * axis reads and relocates but never changes, and a `--background-*` variable prefix would stutter
 * against it at every use. The word is used elsewhere for the Sheet overlay, but only in prose and
 * in keyframes already prefixed `sheet-backdrop-*`; that overlay's token is `--scrim`.
 *
 * WHY IT EXISTS. Palettes over one token set change the hue and nothing else, so two applications
 * built on this kit are two pages of the same drawing in different inks. A backdrop is the axis that
 * answers "which application is this?" before a single label is read.
 *
 * THREE VALUES, ONE OF THEM ABSENT. `none` writes NO attribute — `src/backdrops.css` has no block
 * for it, so it is the kit exactly as it ships and needs no CSS to be correct. That absence is the
 * same third state the two chrome axes use, and it is why the default costs nothing. Every other
 * id is written verbatim as `data-backdrop` on `<html>`: THE IDS ARE THE ATTRIBUTE VALUES, so a
 * rename here is a rename in the stylesheet.
 *
 * ABSOLUTE, NOT RELATIVE, unlike `sidebar-mode` and `header-mode`. Those two resolve a choice
 * against the page mode and re-resolve it whenever the mode moves; a backdrop has no such
 * arithmetic — its stylesheet answers `.dark` itself — so there is no `wear` here, and the
 * first-paint script in `index.html` echoes the stored id with no resolution to perform.
 *
 * @see src/backdrops.css — the blocks this attribute selects, and their specificity ladder
 * @see index.html — the first-paint copy of the same key, and why it has to exist
 * @see src/lib/hooks/sidebar-mode.svelte.ts — the axis this module is shaped after
 */

/** The `localStorage` key. Also read by the first-paint script in `index.html`. */
export const BACKDROP_STORAGE_KEY = "backdrop";

/** The attribute the stylesheets select on. Absent for `none`. */
export const BACKDROP_ATTRIBUTE = "data-backdrop";

/**
 * THE TWO ADJUSTMENTS, and why they are custom properties rather than attributes.
 *
 * An attribute can carry a choice from a known set — which is what `data-backdrop` is. These are
 * continuous, so they are written as custom properties on `<html>` and read by the stylesheet with
 * `var()`. That also means a backdrop that ignores an adjustment costs nothing: an unread property
 * is inert, so `grain` never looks at the angle and no pattern looks at the density.
 *
 * Both are stored as bare NUMBERS, not as `45deg` or `120%`. The stylesheet multiplies by the unit
 * it needs (`calc(1deg * var(--backdrop-angle))`), which keeps the stored value arithmetic and lets
 * the same number drive a rotation in one place and a trigonometric position in another.
 */
export const BACKDROP_ANGLE_STORAGE_KEY = "backdrop-angle";
export const BACKDROP_DENSITY_STORAGE_KEY = "backdrop-density";

/** Bearing the light comes from, degrees clockwise from the top. Wraps, so 360 is 0. */
export const DEFAULT_BACKDROP_ANGLE = 0;

/** Grain tile scale, as a percentage of its natural size. Lower is finer. */
export const DEFAULT_BACKDROP_DENSITY = 100;
export const BACKDROP_DENSITY_MIN = 40;
export const BACKDROP_DENSITY_MAX = 220;

/**
 * Every backdrop, in the order the picker lists them: the control first, then the lights.
 *
 * TWELVE WERE BUILT AND EIGHT WERE CUT, on the owner's verdict after seeing each on screen —
 * `masthead`, `overlap`, `glass`, `editorial` and `crest` first, then `devtool`, `pebble` and
 * `brutalist`. A ninth, `cascade`, was not cut but PROMOTED: it turned out to be describing a
 * chrome option rather than a decoration, so it is now the third value of the sidebar's and the
 * header's own axis (`src/vibrant.css`).
 *
 * WHAT SURVIVED IS ONE IDEA. Nothing here paints the rail or the bar — the axes that own those
 * surfaces do — and nothing here changes type or shape either. A backdrop is now strictly a light
 * behind the page, which is why `glow` and `aurora` share every mechanic in `src/backdrops.css`.
 */
export const BACKDROP_IDS = [
	"none",
	// The lights, quietest first.
	"spotlight",
	"horizon",
	"corner",
	"glow",
	"weave",
	"aurora",
	// The drawn ones: a texture, then geometry.
	"grain",
	"dots",
	"grid",
	"graph",
	"hatch",
	"isometric",
	"rays",
	"hiashi",
	"sunrise",
	"beams",
	"ripple",
	"corona",
	// The wagara — traditional Japanese geometric patterns.
	"seigaiha",
	"shippo",
	"asanoha",
	"uroko",
	"kanoko",
] as const;

export type BackdropId = (typeof BACKDROP_IDS)[number];

/** What a first visit gets, and what an unknown stored value falls back to. */
export const DEFAULT_BACKDROP: BackdropId = "none";

/**
 * A row in the picker. There is no `family` field any more: it existed to group twelve looks into
 * type, shape and light, and once only the lights were left the union had a single real member.
 * The picker still rules a line, but it draws it where the meaning actually is — between the row
 * that turns the axis OFF and the rows that turn it on — which it can read from the id.
 */
/**
 * WHAT A BACKDROP IS MADE OF, which is also how it is adjusted.
 *
 * `gradient` — anchored light. One knob: the ANGLE the light comes from, as a bearing round the
 *              viewport, 0 at the top and running clockwise. A radial moves its source along that
 *              bearing; a linear turns to face it. Both are the same idea — where is the sun.
 * `grain`    — texture. One knob: DENSITY, which is the tile's scale. Finer grain is the same
 *              noise sampled smaller, not a different noise.
 * `pattern`  — drawn, tiled. One knob: the ANGLE the lattice is turned to.
 * `none`     — the axis off. No knobs, and no attribute either.
 *
 * The category is what the Settings page groups by, and what decides which control it shows. It is
 * derived from the backdrop rather than stored: a backdrop cannot change category at runtime.
 */
export type BackdropCategory = "none" | "gradient" | "grain" | "pattern";

export type Backdrop = {
	id: BackdropId;
	name: string;
	/** One line, for the picker's row and the Settings card. */
	blurb: string;
	category: BackdropCategory;
};

/**
 * The list the picker renders. It is written here rather than in `src/lib/data/` because that
 * folder is the demo's CONTENT — workspaces, users, transcripts — and this is appearance
 * vocabulary, the counterpart of `THEMES` in `src/lib/themes/palettes.ts`.
 */
export const BACKDROPS: Backdrop[] = [
	{
		id: "none",
		name: "None",
		blurb: "The kit exactly as it ships. Nothing is painted.",
		category: "none",
	},
	{
		id: "spotlight",
		name: "Spotlight",
		blurb: "One wide light from the top. The quietest of them.",
		category: "gradient",
	},
	{
		id: "horizon",
		name: "Horizon",
		blurb: "A sky: lighter at the head, weightier at the foot.",
		category: "gradient",
	},
	{
		id: "corner",
		name: "Corner",
		blurb: "A low light thrown from the far corner of the page.",
		category: "gradient",
	},
	{
		id: "glow",
		name: "Glow",
		blurb: "One soft brand spotlight, hanging above the page.",
		category: "gradient",
	},
	{
		id: "weave",
		name: "Weave",
		blurb: "Two fields blended into each other, quietly iridescent.",
		category: "gradient",
	},
	{
		id: "aurora",
		name: "Aurora",
		blurb: "Three colour fields drifting slowly behind the content.",
		category: "gradient",
	},
	{
		id: "grain",
		name: "Grain",
		blurb: "Paper grain over a low wash. The one you feel more than see.",
		category: "grain",
	},
	{
		id: "dots",
		name: "Dots",
		blurb: "A fine dot lattice, fading in below the header.",
		category: "pattern",
	},
	{
		id: "grid",
		name: "Grid",
		blurb: "A one-pixel rule every 24px. Blueprint, not table.",
		category: "pattern",
	},
	{
		id: "graph",
		name: "Graph",
		blurb: "The grid with a heavier rule every fifth line.",
		category: "pattern",
	},
	{
		id: "hatch",
		name: "Hatch",
		blurb: "Diagonal hatching, drawn rather than printed.",
		category: "pattern",
	},
	{
		id: "isometric",
		name: "Isometric",
		blurb: "Three axes of rule work. Depth without perspective.",
		category: "pattern",
	},
	{
		id: "rays",
		name: "Rays",
		blurb: "Light fanning from off-corner, its apex off past the edge.",
		category: "gradient",
	},
	{
		id: "hiashi",
		name: "Hiashi",
		blurb: "A twelve-rayed sun low on the page, after the old crest.",
		category: "gradient",
	},
	{
		id: "sunrise",
		name: "Sunrise",
		blurb: "Wide bands rising from below the foot of the page.",
		category: "gradient",
	},
	{
		id: "beams",
		name: "Beams",
		blurb: "Parallel shafts of light falling across the page.",
		category: "gradient",
	},
	{
		id: "ripple",
		name: "Ripple",
		blurb: "Rings widening as they go, the way water does.",
		category: "gradient",
	},
	{
		id: "corona",
		name: "Corona",
		blurb: "A single ring with nothing inside it. An eclipse.",
		category: "gradient",
	},
	{
		id: "seigaiha",
		name: "Seigaiha",
		blurb: "Overlapping wave crests — calm seas, and luck without end.",
		category: "pattern",
	},
	{
		id: "shippo",
		name: "Shippō",
		blurb: "Interlocking circles: the seven treasures, endlessly linked.",
		category: "pattern",
	},
	{
		id: "asanoha",
		name: "Asanoha",
		blurb: "The hemp-leaf star lattice, a wish for straight growth.",
		category: "pattern",
	},
	{
		id: "uroko",
		name: "Uroko",
		blurb: "Scales, alternating. Worn as a charm against harm.",
		category: "pattern",
	},
	{
		id: "kanoko",
		name: "Kanoko",
		blurb: "Fawn spots — each ring one tied knot of shibori dye.",
		category: "pattern",
	},
];

/** Whether a string is a backdrop this application actually ships. */
export function isBackdropId(value: string | null | undefined): value is BackdropId {
	return typeof value === "string" && (BACKDROP_IDS as readonly string[]).includes(value);
}

/**
 * The stored choice, narrowed. The narrowing is not paranoia: the value comes from
 * `localStorage`, so it survives a backdrop being renamed or dropped, and an unknown id would
 * otherwise leave `<html>` carrying an attribute no stylesheet answers — which renders as none
 * anyway, but with the picker showing nothing selected.
 */
function read(): BackdropId {
	try {
		// Guard for any non-browser evaluation (prerendering, tests, SSR added later) — INSIDE
		// the try, because with storage fully blocked the `localStorage` getter itself throws.
		if (typeof localStorage === "undefined") return DEFAULT_BACKDROP;

		const stored = localStorage.getItem(BACKDROP_STORAGE_KEY);
		return isBackdropId(stored) ? stored : DEFAULT_BACKDROP;
	} catch {
		// Storage blocked outright. The session still switches, it just does not persist.
		return DEFAULT_BACKDROP;
	}
}

function persist(value: BackdropId): void {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(BACKDROP_STORAGE_KEY, value);
	} catch {
		/* storage blocked — the attribute is still applied, it just will not survive a reload */
	}
}

/**
 * The adjustments are read the same defensive way the id is: storage can be absent, blocked, or
 * hold anything at all. A number that does not parse, or lands outside its range, falls back
 * rather than reaching the stylesheet — `calc()` with a junk value invalidates the whole
 * declaration, which would take the backdrop out entirely rather than degrade it.
 */
function readNumber(key: string, fallback: number, min: number, max: number): number {
	try {
		if (typeof localStorage === "undefined") return fallback;
		const raw = localStorage.getItem(key);
		if (raw === null) return fallback;
		const value = Number(raw);
		if (!Number.isFinite(value)) return fallback;
		return Math.min(max, Math.max(min, Math.round(value)));
	} catch {
		return fallback;
	}
}

function persistNumber(key: string, value: number): void {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(key, String(value));
	} catch {
		/* storage blocked — the property is still applied, it just will not survive a reload */
	}
}

let current = $state<BackdropId>(read());
let angle = $state<number>(readNumber(BACKDROP_ANGLE_STORAGE_KEY, DEFAULT_BACKDROP_ANGLE, 0, 360));
let density = $state<number>(
	readNumber(
		BACKDROP_DENSITY_STORAGE_KEY,
		DEFAULT_BACKDROP_DENSITY,
		BACKDROP_DENSITY_MIN,
		BACKDROP_DENSITY_MAX,
	),
);

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
 * `none` REMOVES the attribute rather than writing `"none"`: the absence is the state, and a
 * value no stylesheet answers would be one more thing to strip later.
 */
$effect.root(() => {
	$effect(() => {
		if (typeof document === "undefined") return;
		if (current === DEFAULT_BACKDROP) {
			document.documentElement.removeAttribute(BACKDROP_ATTRIBUTE);
		} else {
			document.documentElement.setAttribute(BACKDROP_ATTRIBUTE, current);
		}
	});

	// The adjustments, in their own effect so moving a slider does not re-run the attribute write.
	$effect(() => {
		if (typeof document === "undefined") return;
		document.documentElement.style.setProperty("--backdrop-angle", String(angle));
		document.documentElement.style.setProperty("--backdrop-density", String(density));
	});
});

/** Bearing the light comes from, in degrees. Read-only; write through {@link setBackdropAngle}. */
export const backdropAngle = {
	get current(): number {
		return angle;
	},
};

/** Grain scale as a percentage. Read-only; write through {@link setBackdropDensity}. */
export const backdropDensity = {
	get current(): number {
		return density;
	},
};

/** Turn the light. Wraps at 360 so a slider can run round without a discontinuity. */
export function setBackdropAngle(value: number): void {
	const next = ((Math.round(value) % 360) + 360) % 360;
	angle = next;
	persistNumber(BACKDROP_ANGLE_STORAGE_KEY, next);
}

/** Scale the grain. Clamped, because an unclamped tile size is a blank page or a grey one. */
export function setBackdropDensity(value: number): void {
	const next = Math.min(BACKDROP_DENSITY_MAX, Math.max(BACKDROP_DENSITY_MIN, Math.round(value)));
	density = next;
	persistNumber(BACKDROP_DENSITY_STORAGE_KEY, next);
}

/** The active backdrop, always a known id. Read-only; write through {@link setBackdrop}. */
export const activeBackdrop = {
	get current(): BackdropId {
		return current;
	},
};

/** Switch backdrops. Persists, and takes effect on the next frame. */
export function setBackdrop(value: BackdropId): void {
	current = value;
	persist(value);
}

/** The record for a backdrop id, for the picker's trigger and the Settings page. */
export function backdropById(id: BackdropId): Backdrop {
	// Non-null: `id` is a `BackdropId`, and `BACKDROPS` is written from the same list.
	return BACKDROPS.find((f) => f.id === id)!;
}
