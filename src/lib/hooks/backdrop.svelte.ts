/**
 * The backdrop axis.
 *
 * A FIFTH APPEARANCE CONTROL, and the only one that paints nothing the other four own: the palette
 * (`data-theme`) and the mode (`.dark`) decide what the surfaces are painted WITH, and a backdrop
 * decides what is painted BEHIND them. It is layered OVER the other four rather than beside them,
 * so every backdrop composes with every palette in either mode, and each one derives its colours
 * from the live tokens instead of restating them.
 *
 * FOUR AXES, NOT ONE CHOICE, and that is the shape this file has been rebuilt around. A backdrop
 * used to be a single id out of twenty-four, which made "grid" and "spotlight" alternatives when
 * they are nothing of the kind — one is a lattice drawn over the page and the other is a light
 * thrown across it, and wanting both is the obvious thing to want. They are now four independent
 * selections that compose:
 *
 *   - GRADIENT — a light, from a bearing you choose. Twelve of them, or none.
 *   - PATTERN — a drawn lattice, fading out toward a bearing, over a length you choose. Ten, or
 *     none.
 *   - GRAIN — a texture, at a density you choose. On or off.
 *   - MARK — one SVG file, translated, scaled and turned. On or off.
 *
 * Each writes its own attribute on `<html>`, and `data-backdrop` is set whenever ANY of them is —
 * a boolean the stylesheet's shared rules key on, so the layer carriers and the kill switches do
 * not have to name four attributes apiece.
 *
 * `backdrop` AND NOT `background`, deliberately: `--background` is the page ground, which this
 * axis reads and relocates but never changes, and a `--background-*` variable prefix would stutter
 * against it at every use.
 *
 * ABSENCE IS THE OFF STATE. `none` writes no attribute, so the kit as it ships needs no CSS to be
 * correct and the default costs nothing. Every other id is written verbatim, so THE IDS ARE THE
 * ATTRIBUTE VALUES and a rename here is a rename in the stylesheet.
 *
 * THE ADJUSTMENTS ARE CUSTOM PROPERTIES, NOT ATTRIBUTES, because an attribute can carry a choice
 * from a known set and these are continuous. They are stored as bare NUMBERS — the stylesheet
 * multiplies by the unit it needs — which keeps one stored value able to drive a rotation in one
 * place and a trigonometric position in another. An adjustment nobody reads is inert, so a
 * gradient never looks at the density and no pattern looks at the mark's zoom.
 *
 * @see src/backdrops.css — the blocks these attributes select, and the three layer pairs
 * @see index.html — the first-paint copy of the same keys, and why it has to exist
 * @see public/backdrop-mark.svg — the file the mark axis draws, meant to be replaced per project
 */

// ================================================================================================
// The two lists of named looks.
// ================================================================================================

export type BackdropCategory = "gradient" | "pattern" | "grain" | "mark";

/** A row in a picker. */
export type BackdropChoice = {
	id: string;
	name: string;
	blurb: string;
};

export const GRADIENT_IDS = [
	"spotlight",
	"horizon",
	"corner",
	"glow",
	"weave",
	"aurora",
	"rays",
	"hiashi",
	"sunrise",
	"beams",
	"ripple",
	"eclipse",
] as const;

export const PATTERN_IDS = [
	"dots",
	"grid",
	"graph",
	"hatch",
	"isometric",
	"seigaiha",
	"shippo",
	"asanoha",
	"uroko",
	"kanoko",
] as const;

export type GradientId = (typeof GRADIENT_IDS)[number] | "none";
export type PatternId = (typeof PATTERN_IDS)[number] | "none";

/** Quietest first, which is also roughly the order someone tries them in. */
export const GRADIENTS: BackdropChoice[] = [
	{ id: "spotlight", name: "Spotlight", blurb: "One wide light from the top. The quietest." },
	{ id: "horizon", name: "Horizon", blurb: "A sky: lighter at the head, weightier at the foot." },
	{ id: "corner", name: "Corner", blurb: "A low light thrown from the far corner of the page." },
	{ id: "glow", name: "Glow", blurb: "One soft brand spotlight, hanging above the page." },
	{ id: "weave", name: "Weave", blurb: "Two fields blended into each other, quietly iridescent." },
	{
		id: "aurora",
		name: "Aurora",
		blurb: "Three colour fields drifting slowly behind the content.",
	},
	{ id: "rays", name: "Rays", blurb: "Light fanning from off-corner, its apex off past the edge." },
	{
		id: "hiashi",
		name: "Hiashi",
		blurb: "A twelve-rayed sun low on the page, after the old crest.",
	},
	{ id: "sunrise", name: "Sunrise", blurb: "Wide bands rising from below the foot of the page." },
	{ id: "beams", name: "Beams", blurb: "Parallel shafts of light falling across the page." },
	{ id: "ripple", name: "Ripple", blurb: "Rings widening as they go, the way water does." },
	{
		id: "eclipse",
		name: "Eclipse",
		blurb: "A rim of light around a dark disc, with streamers combing out of it.",
	},
];

/** The drawn lattices, then the wagara — traditional Japanese geometric patterns. */
export const PATTERNS: BackdropChoice[] = [
	{ id: "dots", name: "Dots", blurb: "A fine dot lattice, fading in below the header." },
	{ id: "grid", name: "Grid", blurb: "A one-pixel rule every 24px. Blueprint, not table." },
	{ id: "graph", name: "Graph", blurb: "The grid with a heavier rule every fifth line." },
	{ id: "hatch", name: "Hatch", blurb: "Diagonal hatching, drawn rather than printed." },
	{
		id: "isometric",
		name: "Isometric",
		blurb: "Three axes of rule work. Depth without perspective.",
	},
	{
		id: "seigaiha",
		name: "Seigaiha",
		blurb: "Overlapping wave crests — calm seas, and luck without end.",
	},
	{
		id: "shippo",
		name: "Shippō",
		blurb: "Interlocking circles: the seven treasures, endlessly linked.",
	},
	{
		id: "asanoha",
		name: "Asanoha",
		blurb: "The hemp-leaf star lattice, a wish for straight growth.",
	},
	{ id: "uroko", name: "Uroko", blurb: "Scales, alternating. Worn as a charm against harm." },
	{ id: "kanoko", name: "Kanoko", blurb: "Fawn spots — each ring one tied knot of shibori dye." },
];

// ================================================================================================
// Keys, attributes and ranges.
// ================================================================================================

export const BACKDROP_ATTRIBUTE = "data-backdrop";

export const GRADIENT_STORAGE_KEY = "backdrop-gradient";
export const PATTERN_STORAGE_KEY = "backdrop-pattern";
export const GRAIN_STORAGE_KEY = "backdrop-grain";
export const MARK_STORAGE_KEY = "backdrop-mark";

export const BACKDROP_ANGLE_STORAGE_KEY = "backdrop-angle";
export const BACKDROP_FADE_ANGLE_STORAGE_KEY = "backdrop-fade-angle";
export const BACKDROP_FADE_STORAGE_KEY = "backdrop-fade";
export const BACKDROP_DENSITY_STORAGE_KEY = "backdrop-density";
export const MARK_X_STORAGE_KEY = "backdrop-mark-x";
export const MARK_Y_STORAGE_KEY = "backdrop-mark-y";
export const MARK_ZOOM_STORAGE_KEY = "backdrop-mark-zoom";
export const MARK_ANGLE_STORAGE_KEY = "backdrop-mark-angle";
export const MARK_ANCHOR_STORAGE_KEY = "backdrop-mark-anchor";

/** The file the mark axis draws. Replace it, keeping the name, to brand a project. */
export const MARK_SOURCE = `${import.meta.env.BASE_URL}backdrop-mark.svg`;

export const DEFAULT_BACKDROP_ANGLE = 0;
export const DEFAULT_BACKDROP_FADE_ANGLE = 0;

export const DEFAULT_BACKDROP_FADE = 640;
export const BACKDROP_FADE_MIN = 0;
export const BACKDROP_FADE_MAX = 1400;

export const DEFAULT_BACKDROP_DENSITY = 100;
export const BACKDROP_DENSITY_MIN = 40;
export const BACKDROP_DENSITY_MAX = 220;

export const DEFAULT_MARK_X = 60;
export const DEFAULT_MARK_Y = 120;
export const MARK_OFFSET_MIN = -600;
export const MARK_OFFSET_MAX = 2000;

export const DEFAULT_MARK_ZOOM = 420;
export const MARK_ZOOM_MIN = 60;
export const MARK_ZOOM_MAX = 1600;

export const DEFAULT_MARK_ANGLE = 0;

/**
 * WHICH CORNER THE OFFSETS ARE MEASURED FROM. Two numbers are not a position until you say what
 * they are counted from, and "60, 120" meant the top-left corner only because that is what CSS
 * defaults to — a mark meant to sit in the bottom-right then had to be placed by arithmetic
 * against a viewport size nobody knows in advance, and moved on every resize.
 *
 * Anchoring to the corner you actually want makes the offsets small, stable and readable, and it
 * is the browser that does the arithmetic: `background-position` takes a four-value form —
 * `right 40px bottom 24px` — that names an edge per axis. The centre is the exception, since that
 * form does not accept `center` with an offset, so it is written as a percentage plus the offset.
 */
export const MARK_ANCHORS = [
	{ id: "top-left", name: "Top left", x: "Left", y: "Top" },
	{ id: "top-right", name: "Top right", x: "Right", y: "Top" },
	{ id: "bottom-left", name: "Bottom left", x: "Left", y: "Bottom" },
	{ id: "bottom-right", name: "Bottom right", x: "Right", y: "Bottom" },
	{ id: "center", name: "Centre", x: "Horizontal", y: "Vertical" },
] as const;

export type MarkAnchor = (typeof MARK_ANCHORS)[number]["id"];
export const DEFAULT_MARK_ANCHOR: MarkAnchor = "top-left";

export function isMarkAnchor(value: string | null | undefined): value is MarkAnchor {
	return (
		typeof value === "string" && MARK_ANCHORS.some((anchor) => anchor.id === (value as MarkAnchor))
	);
}

/**
 * The offsets are counted FROM the named edges, so a positive number always moves the mark inward.
 * That is why the centre case adds rather than subtracts on both axes: everywhere else "more" is
 * "further from that edge", and the centre has no edge to be further from.
 */
export function markPosition(anchor: MarkAnchor, x: number, y: number): string {
	if (anchor === "center") return `calc(50% + ${x}px) calc(50% + ${y}px)`;
	const [vertical, horizontal] = anchor.split("-");
	return `${horizontal} ${x}px ${vertical} ${y}px`;
}

// ================================================================================================
// Reading and writing what is stored.
// ================================================================================================

export function isGradientId(value: string | null | undefined): value is GradientId {
	return typeof value === "string" && (GRADIENT_IDS as readonly string[]).includes(value);
}

export function isPatternId(value: string | null | undefined): value is PatternId {
	return typeof value === "string" && (PATTERN_IDS as readonly string[]).includes(value);
}

/**
 * A stored id is NARROWED, not trusted. It survives a look being renamed or dropped, and an
 * unknown id would otherwise leave `<html>` carrying an attribute no stylesheet answers — which
 * renders as nothing, but with the picker showing nothing selected either.
 */
function readId<T extends string>(key: string, guard: (v: string | null) => v is T): T | "none" {
	try {
		// Guarded INSIDE the try: with storage fully blocked the getter itself throws.
		if (typeof localStorage === "undefined") return "none";
		const stored = localStorage.getItem(key);
		return guard(stored) ? stored : "none";
	} catch {
		return "none";
	}
}

function readFlag(key: string): boolean {
	try {
		if (typeof localStorage === "undefined") return false;
		return localStorage.getItem(key) === "on";
	} catch {
		return false;
	}
}

/**
 * Numbers are read the same defensive way. One that does not parse, or lands outside its range,
 * falls back rather than reaching the stylesheet — `calc()` with a junk value invalidates the
 * whole declaration, which would take the layer out entirely rather than degrade it.
 */
function readNumber(key: string, fallback: number, min: number, max: number): number {
	try {
		if (typeof localStorage === "undefined") return fallback;
		const raw = localStorage.getItem(key);
		if (raw === null || raw === "") return fallback;
		const value = Number(raw);
		if (!Number.isFinite(value)) return fallback;
		return Math.min(max, Math.max(min, Math.round(value)));
	} catch {
		return fallback;
	}
}

function persist(key: string, value: string): void {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(key, value);
	} catch {
		/* storage blocked — the session still switches, it just will not survive a reload */
	}
}

// ================================================================================================
// The state.
// ================================================================================================

let gradient = $state<GradientId>(readId(GRADIENT_STORAGE_KEY, isGradientId));
let pattern = $state<PatternId>(readId(PATTERN_STORAGE_KEY, isPatternId));
let grain = $state<boolean>(readFlag(GRAIN_STORAGE_KEY));
let mark = $state<boolean>(readFlag(MARK_STORAGE_KEY));

let angle = $state<number>(readNumber(BACKDROP_ANGLE_STORAGE_KEY, DEFAULT_BACKDROP_ANGLE, 0, 360));
let fadeAngle = $state<number>(
	readNumber(BACKDROP_FADE_ANGLE_STORAGE_KEY, DEFAULT_BACKDROP_FADE_ANGLE, 0, 360),
);
let fade = $state<number>(
	readNumber(
		BACKDROP_FADE_STORAGE_KEY,
		DEFAULT_BACKDROP_FADE,
		BACKDROP_FADE_MIN,
		BACKDROP_FADE_MAX,
	),
);
let density = $state<number>(
	readNumber(
		BACKDROP_DENSITY_STORAGE_KEY,
		DEFAULT_BACKDROP_DENSITY,
		BACKDROP_DENSITY_MIN,
		BACKDROP_DENSITY_MAX,
	),
);
let markX = $state<number>(
	readNumber(MARK_X_STORAGE_KEY, DEFAULT_MARK_X, MARK_OFFSET_MIN, MARK_OFFSET_MAX),
);
let markY = $state<number>(
	readNumber(MARK_Y_STORAGE_KEY, DEFAULT_MARK_Y, MARK_OFFSET_MIN, MARK_OFFSET_MAX),
);
let markZoom = $state<number>(
	readNumber(MARK_ZOOM_STORAGE_KEY, DEFAULT_MARK_ZOOM, MARK_ZOOM_MIN, MARK_ZOOM_MAX),
);
let markAngle = $state<number>(readNumber(MARK_ANGLE_STORAGE_KEY, DEFAULT_MARK_ANGLE, 0, 360));
let markAnchor = $state<MarkAnchor>(readAnchor());

function readAnchor(): MarkAnchor {
	try {
		if (typeof localStorage === "undefined") return DEFAULT_MARK_ANCHOR;
		const stored = localStorage.getItem(MARK_ANCHOR_STORAGE_KEY);
		return isMarkAnchor(stored) ? stored : DEFAULT_MARK_ANCHOR;
	} catch {
		return DEFAULT_MARK_ANCHOR;
	}
}

/** The mark file's own markup, fetched once. `null` until it arrives, `""` if it cannot. */
let markSource = $state<string | null>(null);

// ================================================================================================
// The mark: one file, turned.
// ================================================================================================

/**
 * A BACKGROUND IMAGE CANNOT BE ROTATED, and that is the only reason this function exists. CSS has
 * no `background-rotate`, and rotating the ELEMENT is not available either: the mark is painted
 * twice, on the page and on the strip behind the header, and a transform would move each carrier's
 * box away from the region it is supposed to cover.
 *
 * So the rotation goes INSIDE the image. The file's markup is fetched once and re-emitted inside a
 * wrapper that turns it, as a data URI both carriers can name — which also puts the two copies in
 * register for free, since they are then literally the same image.
 *
 * THE VIEWBOX IS GROWN BY √2. A square turned 45 degrees inside its own box loses its corners; the
 * wrapper's box is the diagonal of the original, centred on the same point, so nothing is ever
 * clipped and the mark's apparent size does not change as it turns.
 *
 * THE COLOUR IS BAKED IN, because a data URI is an isolated document: it cannot read `var(--fg)`,
 * and `currentColor` in it resolves against nothing. The live token is resolved here and the
 * result written onto the wrapper, which is why this reruns when the mode or the palette moves.
 */
function wrapMark(markup: string, turn: number, colour: string): string {
	const box = markup.match(/viewBox="([^"]+)"/);
	const [x, y, w, h] = box
		? box[1]
				.trim()
				.split(/[\s,]+/)
				.map(Number)
		: [0, 0, 100, 100];
	if (![x, y, w, h].every(Number.isFinite)) return "";

	const cx = x + w / 2;
	const cy = y + h / 2;
	const side = Math.max(w, h) * Math.SQRT2;
	const outer = `${cx - side / 2} ${cy - side / 2} ${side} ${side}`;

	// Only the file's CONTENT is carried over; its own root element is replaced so the wrapper
	// owns the viewBox, and a stray width/height on it cannot fight the one CSS asks for.
	const inner = markup
		.replace(/<\?xml[\s\S]*?\?>/g, "")
		.replace(/<!DOCTYPE[\s\S]*?>/gi, "")
		.replace(/^[\s\S]*?<svg[^>]*>/i, "")
		.replace(/<\/svg>\s*$/i, "")
		.trim();

	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${outer}" fill="${colour}" color="${colour}">` +
		`<g transform="rotate(${turn} ${cx} ${cy})">${inner}</g>` +
		`</svg>`;

	// `encodeURIComponent` rather than base64: the markup stays legible in devtools, and a data
	// URI is smaller as text for anything path-shaped.
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** The ink the mark is painted in — a soft neutral, resolved from the live tokens. */
function markInk(): string {
	if (typeof document === "undefined") return "rgba(0,0,0,0.05)";
	const styles = getComputedStyle(document.documentElement);
	const fg = styles.getPropertyValue("--foreground").trim();
	if (!fg) return "rgba(0,0,0,0.05)";
	// `color-mix` in a data URI is fine — it is resolved by the SVG's own renderer, which is the
	// same engine. The alpha is the family's: a mark is a wash, not a logo lockup.
	return `color-mix(in oklab, ${fg} 7%, transparent)`;
}

// ================================================================================================
// The effects that write to the document.
// ================================================================================================

$effect.root(() => {
	// The four attributes, plus the boolean the shared rules key on.
	$effect(() => {
		if (typeof document === "undefined") return;
		const root = document.documentElement;

		const set = (name: string, value: string | null) => {
			if (value === null) root.removeAttribute(name);
			else root.setAttribute(name, value);
		};

		set("data-backdrop-gradient", gradient === "none" ? null : gradient);
		set("data-backdrop-pattern", pattern === "none" ? null : pattern);
		set("data-backdrop-grain", grain ? "" : null);
		set("data-backdrop-mark", mark ? "" : null);

		const any = gradient !== "none" || pattern !== "none" || grain || mark;
		set(BACKDROP_ATTRIBUTE, any ? "" : null);
	});

	// The adjustments, in their own effect so moving a slider does not rewrite five attributes.
	$effect(() => {
		if (typeof document === "undefined") return;
		const style = document.documentElement.style;
		style.setProperty("--backdrop-angle", String(angle));
		style.setProperty("--backdrop-fade-angle", String(fadeAngle));
		style.setProperty("--backdrop-fade", String(fade));
		style.setProperty("--backdrop-density", String(density));
		style.setProperty("--backdrop-mark-position", markPosition(markAnchor, markX, markY));
		style.setProperty("--backdrop-mark-size", `${markZoom}px ${markZoom}px`);
	});

	// The file, fetched the first time the mark is asked for and kept thereafter.
	$effect(() => {
		if (!mark || markSource !== null || typeof fetch === "undefined") return;
		let cancelled = false;
		fetch(MARK_SOURCE)
			.then((r) => (r.ok ? r.text() : ""))
			.then((text) => {
				if (!cancelled) markSource = text;
			})
			.catch(() => {
				// A missing or unreadable file is not an error worth shouting about: the axis simply
				// paints nothing, and the rest of the backdrop is unaffected.
				if (!cancelled) markSource = "";
			});
		return () => {
			cancelled = true;
		};
	});

	// The wrapped image. Reruns on the angle, and on anything that could move `--foreground`.
	$effect(() => {
		if (typeof document === "undefined") return;
		const style = document.documentElement.style;
		if (!mark || !markSource) {
			style.removeProperty("--backdrop-mark-image");
			return;
		}
		// Read inside the effect so the dependency is recorded; the value is not otherwise used.
		void markAngle;
		style.setProperty("--backdrop-mark-image", wrapMark(markSource, markAngle, markInk()));
	});

	/*
	 * THE MARK'S COLOUR IS BAKED, SO IT HAS TO BE REBAKED. Everything else on this axis reads live
	 * tokens through `var()` and follows a palette or mode change on its own; the mark cannot,
	 * because its ink is inside a data URI. An observer on the two attributes that carry those
	 * changes is the cheapest way to notice, and it is idle the rest of the time.
	 */
	$effect(() => {
		if (typeof document === "undefined" || !mark || !markSource) return;
		const root = document.documentElement;
		const observer = new MutationObserver(() => {
			root.style.setProperty("--backdrop-mark-image", wrapMark(markSource!, markAngle, markInk()));
		});
		observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });
		return () => observer.disconnect();
	});
});

// ================================================================================================
// The public API.
// ================================================================================================

export const activeGradient = {
	get current(): GradientId {
		return gradient;
	},
};
export const activePattern = {
	get current(): PatternId {
		return pattern;
	},
};
export const grainOn = {
	get current(): boolean {
		return grain;
	},
};
export const markOn = {
	get current(): boolean {
		return mark;
	},
};

export const backdropAngle = {
	get current(): number {
		return angle;
	},
};
export const backdropFadeAngle = {
	get current(): number {
		return fadeAngle;
	},
};
export const backdropFade = {
	get current(): number {
		return fade;
	},
};
export const backdropDensity = {
	get current(): number {
		return density;
	},
};
export const markOffsetX = {
	get current(): number {
		return markX;
	},
};
export const markOffsetY = {
	get current(): number {
		return markY;
	},
};
export const markScale = {
	get current(): number {
		return markZoom;
	},
};
export const markTurn = {
	get current(): number {
		return markAngle;
	},
};
export const markCorner = {
	get current(): MarkAnchor {
		return markAnchor;
	},
};

export function setGradient(value: GradientId): void {
	gradient = isGradientId(value) ? value : "none";
	persist(GRADIENT_STORAGE_KEY, gradient);
}

export function setPattern(value: PatternId): void {
	pattern = isPatternId(value) ? value : "none";
	persist(PATTERN_STORAGE_KEY, pattern);
}

export function setGrain(value: boolean): void {
	grain = value;
	persist(GRAIN_STORAGE_KEY, value ? "on" : "off");
}

export function setMark(value: boolean): void {
	mark = value;
	persist(MARK_STORAGE_KEY, value ? "on" : "off");
}

/** Turn a bearing. Wraps at 360, so a dial can run round without a discontinuity. */
function wrapDegrees(value: number): number {
	return ((Math.round(value) % 360) + 360) % 360;
}

export function setBackdropAngle(value: number): void {
	angle = wrapDegrees(value);
	persist(BACKDROP_ANGLE_STORAGE_KEY, String(angle));
}

export function setBackdropFadeAngle(value: number): void {
	fadeAngle = wrapDegrees(value);
	persist(BACKDROP_FADE_ANGLE_STORAGE_KEY, String(fadeAngle));
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, Math.round(value)));
}

/** Stretch the fade. 0 is a legitimate value and means no fade at all. */
export function setBackdropFade(value: number): void {
	fade = clamp(value, BACKDROP_FADE_MIN, BACKDROP_FADE_MAX);
	persist(BACKDROP_FADE_STORAGE_KEY, String(fade));
}

/** Scale the grain. Clamped, because an unclamped tile size is a blank page or a grey one. */
export function setBackdropDensity(value: number): void {
	density = clamp(value, BACKDROP_DENSITY_MIN, BACKDROP_DENSITY_MAX);
	persist(BACKDROP_DENSITY_STORAGE_KEY, String(density));
}

export function setMarkOffsetX(value: number): void {
	markX = clamp(value, MARK_OFFSET_MIN, MARK_OFFSET_MAX);
	persist(MARK_X_STORAGE_KEY, String(markX));
}

export function setMarkOffsetY(value: number): void {
	markY = clamp(value, MARK_OFFSET_MIN, MARK_OFFSET_MAX);
	persist(MARK_Y_STORAGE_KEY, String(markY));
}

export function setMarkScale(value: number): void {
	markZoom = clamp(value, MARK_ZOOM_MIN, MARK_ZOOM_MAX);
	persist(MARK_ZOOM_STORAGE_KEY, String(markZoom));
}

export function setMarkAnchor(value: MarkAnchor): void {
	markAnchor = isMarkAnchor(value) ? value : DEFAULT_MARK_ANCHOR;
	persist(MARK_ANCHOR_STORAGE_KEY, markAnchor);
}

export function setMarkTurn(value: number): void {
	markAngle = wrapDegrees(value);
	persist(MARK_ANGLE_STORAGE_KEY, String(markAngle));
}

/** Everything back to the kit as it ships — used by the Settings page's Reset. */
export function resetBackdrop(): void {
	setGradient("none");
	setPattern("none");
	setGrain(false);
	setMark(false);
	setBackdropAngle(DEFAULT_BACKDROP_ANGLE);
	setBackdropFadeAngle(DEFAULT_BACKDROP_FADE_ANGLE);
	setBackdropFade(DEFAULT_BACKDROP_FADE);
	setBackdropDensity(DEFAULT_BACKDROP_DENSITY);
	setMarkOffsetX(DEFAULT_MARK_X);
	setMarkOffsetY(DEFAULT_MARK_Y);
	setMarkScale(DEFAULT_MARK_ZOOM);
	setMarkTurn(DEFAULT_MARK_ANGLE);
	setMarkAnchor(DEFAULT_MARK_ANCHOR);
}
