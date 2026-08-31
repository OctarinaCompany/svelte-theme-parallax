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
export const GRADIENT_OPACITY_STORAGE_KEY = "backdrop-gradient-opacity";
export const PATTERN_OPACITY_STORAGE_KEY = "backdrop-pattern-opacity";
export const MARK_X_STORAGE_KEY = "backdrop-mark-x";
export const MARK_Y_STORAGE_KEY = "backdrop-mark-y";
export const MARK_ZOOM_STORAGE_KEY = "backdrop-mark-zoom";
export const MARK_ANGLE_STORAGE_KEY = "backdrop-mark-angle";
export const MARK_ANCHOR_STORAGE_KEY = "backdrop-mark-anchor";
export const MARK_OPACITY_STORAGE_KEY = "backdrop-mark-opacity";

/** The file the mark axis draws. Replace it, keeping the name, to brand a project. */
export const MARK_SOURCE = `${import.meta.env.BASE_URL}backdrop-mark.svg`;

/**
 * Intensity, as a percentage of the weight each look was DESIGNED at. 100 is what this file's
 * alphas were calibrated to; the control multiplies rather than replaces, so 0 is genuinely
 * nothing and there is headroom above for a page that wants to be louder than the kit's taste.
 */
export const DEFAULT_LAYER_OPACITY = 100;
export const LAYER_OPACITY_MIN = 0;
export const LAYER_OPACITY_MAX = 200;

export const DEFAULT_BACKDROP_ANGLE = 0;
export const DEFAULT_BACKDROP_FADE_ANGLE = 0;

export const DEFAULT_BACKDROP_FADE = 640;
export const BACKDROP_FADE_MIN = 0;
export const BACKDROP_FADE_MAX = 1400;

/** How much grain, as a percentage. 0 is none, which is the point of the range starting there. */
export const DEFAULT_BACKDROP_DENSITY = 50;
export const BACKDROP_DENSITY_MIN = 0;
export const BACKDROP_DENSITY_MAX = 100;

export const DEFAULT_MARK_X = 60;
export const DEFAULT_MARK_Y = 120;
export const MARK_OFFSET_MIN = -600;
export const MARK_OFFSET_MAX = 2000;

export const DEFAULT_MARK_ZOOM = 420;
export const MARK_ZOOM_MIN = 60;
export const MARK_ZOOM_MAX = 1600;

export const DEFAULT_MARK_ANGLE = 0;

/** How strongly the mark is painted, as a percentage mixed into the page's own ink. */
export const DEFAULT_MARK_OPACITY = 7;
export const MARK_OPACITY_MIN = 0;
export const MARK_OPACITY_MAX = 40;

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
let gradientOpacity = $state<number>(
	readNumber(
		GRADIENT_OPACITY_STORAGE_KEY,
		DEFAULT_LAYER_OPACITY,
		LAYER_OPACITY_MIN,
		LAYER_OPACITY_MAX,
	),
);
let patternOpacity = $state<number>(
	readNumber(
		PATTERN_OPACITY_STORAGE_KEY,
		DEFAULT_LAYER_OPACITY,
		LAYER_OPACITY_MIN,
		LAYER_OPACITY_MAX,
	),
);
let markAnchor = $state<MarkAnchor>(readAnchor());
let markOpacity = $state<number>(
	readNumber(MARK_OPACITY_STORAGE_KEY, DEFAULT_MARK_OPACITY, MARK_OPACITY_MIN, MARK_OPACITY_MAX),
);

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

/**
 * THE GRAIN, AND WHY A GREY VEIL CAN NEVER BE NEUTRAL. The first grain was one turbulence rect at
 * a fixed opacity. Composited over a ground B it lands at `B(1-a) + 0.5a`, so it pulls everything
 * toward mid-grey — measured, it lifted the dark page by +7, +6, +5 on the three channels, which on
 * a ground of rgb(15,38,63) is a HALF as much red again. No opacity makes that neutral; it only
 * makes it smaller. And the density control could not help, because it scaled the tile rather than
 * the amount, so all three densities lifted by exactly the same +7.
 *
 * The fix is two complementary speckles from the SAME turbulence: white where the noise is above
 * its midpoint, black where it is below. Their mean cancels when the two carry alphas in the ratio
 * of the ground they sit on — light at `s·B`, dark at `s·(1−B)` — which is zero-mean for ANY B by
 * construction, and needs no blend mode, so nothing here can disagree across the header fold.
 *
 * It also behaves the way film does: the visible amplitude goes as `B(1−B)`, largest on a mid
 * ground and small at either extreme, because there is less room to move a page that is nearly
 * black or nearly white.
 *
 * `color-interpolation-filters="sRGB"` is not optional — the default is linearRGB, which makes the
 * midpoint of the noise land somewhere other than where this arithmetic puts it.
 */
function buildGrain(amount: number, ground: [number, number, number]): string {
	if (amount <= 0) return "";

	/*
	 * ONE LAYER THAT MOVES AROUND THE GROUND, not two speckles that are meant to cancel.
	 *
	 * Three cuts of this got the balance wrong in three different ways, all measured on the dark
	 * page against the same page with no grain:
	 *
	 *   1. One grey rect at a fixed opacity pulled everything toward mid-grey: +7.3 +6.3 +5.2.
	 *      No opacity fixes that — a grey veil over a dark ground can only lighten it.
	 *   2. A white speckle and a black one, weighted by the ground's headroom, held LUMINANCE but
	 *      not colour: +3.1 red against −4.5 blue at full strength, which is the page desaturating.
	 *   3. Giving those two speckles the ground's own colour should have cancelled exactly, and did
	 *      not: two clamped ramps out of `feTurbulence` do not cover equal area, so the weights that
	 *      balance on paper leave +10 on the page. Forcing the intermediate opaque helped and did
	 *      not fix it.
	 *
	 * So there is one rect, fully covering, whose colour RAMPS from `ground − D` to `ground + D` as
	 * the noise runs 0 to 1, at a constant alpha. Its mean is the ground whenever the noise's mean
	 * is its midpoint — one property of the noise rather than the shape of two clamped curves. The
	 * excursion is symmetric, `D = min(headroom up, headroom down)`, so neither end clips and the
	 * hue never moves: every channel takes the same offset, which is a modulation of the ground
	 * rather than a mix with some other colour.
	 *
	 * The alpha row is forced opaque before the ramp reads red. Filter results are passed on
	 * PREMULTIPLIED, and `feTurbulence` fills alpha with noise too, so un-premultiplying amplifies
	 * red wherever alpha is small and the distribution stops being centred where the arithmetic
	 * needs it.
	 *
	 * `color-interpolation-filters="sRGB"` is not optional: the default is linearRGB, which puts
	 * the midpoint somewhere else entirely.
	 */
	/*
	 * THE EXCURSION IS PER CHANNEL, and that is what makes the grain visible at all. One shared
	 * excursion has to be the SMALLEST channel's headroom, which on the dark page is red's 15 out
	 * of 255 — the mean held perfectly and the texture came out at 2.5 rms, half of what the old
	 * broken grain had. Each channel keeps its own symmetric room instead: red moves ±15, blue
	 * ±63, and each one's mean is still exactly its own ground value, because zero-mean is a
	 * per-channel property and never needed them to agree.
	 *
	 * The texture that gives is a modulation along the ground's own light-to-dark line rather than
	 * a hue shift — the dark end runs toward black, the light end toward a brighter version of the
	 * same colour, which is what a grain over a tint looks like.
	 */
	const spans = ground.map((c) => Math.min(255 - c, c));
	if (Math.max(...spans) <= 0) return "";
	const gain = spans.map((s) => ((2 * s) / 255).toFixed(4));
	const base = ground.map((c, i) => ((c - spans[i]) / 255).toFixed(4));
	const alpha = (amount / 100).toFixed(4);

	const svg =
		"<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'" +
		" color-interpolation-filters='sRGB'>" +
		"<filter id='g' x='0' y='0' width='100%' height='100%'>" +
		"<feTurbulence type='fractalNoise' baseFrequency='.62' numOctaves='3' stitchTiles='stitch'/>" +
		"<feColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1'/>" +
		`<feColorMatrix values='${gain[0]} 0 0 0 ${base[0]} ${gain[1]} 0 0 0 ${base[1]} ${gain[2]} 0 0 0 ${base[2]} 0 0 0 0 1'/>` +
		"</filter>" +
		`<rect width='256' height='256' filter='url(#g)' opacity='${alpha}'/>` +
		"</svg>";
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * The page ground in 8-bit channels — what the grain balances itself against.
 *
 * READ THROUGH THE BROWSER, NOT PARSED BY HAND. `--background` can be `oklch()`, `hsl()` or a hex
 * depending on the palette and on whether relative colour is supported, and `getComputedStyle`
 * hands back `rgb()` whatever went in. A throwaway element is the cheapest way to ask.
 *
 * NO REGULAR EXPRESSION HERE, DELIBERATELY. The first cut matched digits with a character class,
 * and the escape was lost on its way through a shell heredoc — the class became "the letter d or a
 * dot", matched nothing in `rgb(15, 38, 63)`, and the function silently fell back to mid-grey. The
 * grain then balanced itself against a page that does not exist and lifted the real one by nearly
 * sixty code values. Splitting on punctuation cannot fail that way, and the fallback is the only
 * path that can now hide a mistake, so it is worth being blunt about.
 */
function groundColour(): [number, number, number] {
	if (typeof document === "undefined" || !document.body) return [128, 128, 128];
	const probe = document.createElement("span");
	probe.style.cssText = "position:absolute;visibility:hidden;color:var(--background)";
	document.body.appendChild(probe);
	const colour = getComputedStyle(probe).color;
	probe.remove();

	const open = colour.indexOf("(");
	const close = colour.lastIndexOf(")");
	if (open === -1 || close <= open) return [128, 128, 128];
	const channels = colour
		.slice(open + 1, close)
		.split(/[\s,/]+/)
		.map(Number)
		.filter((value) => Number.isFinite(value));
	if (channels.length < 3) return [128, 128, 128];
	return channels.slice(0, 3).map((v) => Math.round(Math.min(255, Math.max(0, v)))) as [
		number,
		number,
		number,
	];
}

/** The ink the mark is painted in — a soft neutral, resolved from the live tokens. */
function markInk(): string {
	if (typeof document === "undefined") return "rgba(0,0,0,0.05)";
	const styles = getComputedStyle(document.documentElement);
	const fg = styles.getPropertyValue("--foreground").trim();
	if (!fg) return "rgba(0,0,0,0.05)";
	const strength = markOpacity;
	// `color-mix` in a data URI is fine — it is resolved by the SVG's own renderer, which is the
	// same engine. The alpha is the family's: a mark is a wash, not a logo lockup.
	return `color-mix(in oklab, ${fg} ${strength}%, transparent)`;
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
		// A FACTOR, NOT A PERCENTAGE: the stylesheet multiplies alphas by it, and `calc(0.22 * 80%)`
		// is not a number. Dividing here keeps every use site free of the conversion.
		style.setProperty("--backdrop-gradient-k", String(gradientOpacity / 100));
		style.setProperty("--backdrop-pattern-k", String(patternOpacity / 100));
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

	/*
	 * The grain is BUILT, not a static image, for the same reason the mark is: its balance depends
	 * on the page ground, which no stylesheet can hand to a data URI. The property is REMOVED when
	 * grain is off rather than set to `none`, because an inline style on `<html>` outranks every
	 * rule — leaving it there would clobber aurora's own dither, which writes the same variable.
	 */
	$effect(() => {
		if (typeof document === "undefined") return;
		const style = document.documentElement.style;
		if (!grain) {
			style.removeProperty("--backdrop-grain-image");
			return;
		}
		style.setProperty("--backdrop-grain-image", buildGrain(density, groundColour()));
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
		if (typeof document === "undefined" || (!mark && !grain)) return;
		const root = document.documentElement;
		const observer = new MutationObserver(() => {
			if (mark && markSource) {
				root.style.setProperty("--backdrop-mark-image", wrapMark(markSource, markAngle, markInk()));
			}
			if (grain) {
				root.style.setProperty("--backdrop-grain-image", buildGrain(density, groundColour()));
			}
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
export const gradientStrength = {
	get current(): number {
		return gradientOpacity;
	},
};
export const patternStrength = {
	get current(): number {
		return patternOpacity;
	},
};
export const markInkStrength = {
	get current(): number {
		return markOpacity;
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

export function setGradientStrength(value: number): void {
	gradientOpacity = clamp(value, LAYER_OPACITY_MIN, LAYER_OPACITY_MAX);
	persist(GRADIENT_OPACITY_STORAGE_KEY, String(gradientOpacity));
}

export function setPatternStrength(value: number): void {
	patternOpacity = clamp(value, LAYER_OPACITY_MIN, LAYER_OPACITY_MAX);
	persist(PATTERN_OPACITY_STORAGE_KEY, String(patternOpacity));
}

export function setMarkInkStrength(value: number): void {
	markOpacity = clamp(value, MARK_OPACITY_MIN, MARK_OPACITY_MAX);
	persist(MARK_OPACITY_STORAGE_KEY, String(markOpacity));
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
	setMarkInkStrength(DEFAULT_MARK_OPACITY);
	setGradientStrength(DEFAULT_LAYER_OPACITY);
	setPatternStrength(DEFAULT_LAYER_OPACITY);
}
