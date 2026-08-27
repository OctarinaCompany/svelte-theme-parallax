/**
 * The theme generator.
 *
 * A theme is described by a handful of numbers — a neutral hue, a chroma scale, a brand hue
 * and any status hue that had to move out of the brand's way. Everything else is DERIVED.
 *
 * Two things are inherited from the anchor palette and are what make the themes feel like one family:
 *
 *   1. THE LIGHTNESS LADDER. the anchor palette's neutral ramp, measured in OKLCH, is reused verbatim,
 *      so every theme has the same surface, elevation, border and text architecture. Only
 *      hue and chroma move.
 *   2. THE TOKEN MAPPING. Which ramp step plays `--border`, `--input`, `--sidebar-accent` …
 *      is the mapping docs/THEME.md §2 records, unchanged.
 *
 * What is deliberately NOT inherited is in DIVERGENCES at the bottom, and every one of them
 * exists because the anchor palette value fails a contrast floor a generated theme has no reason
 * to reproduce — a port must be faithful, a new theme only has to be good.
 */

import {
	hexToOklch,
	oklchToHex,
	maxChroma,
	mixHex,
	contrast,
	apca,
	hueDistance,
	simulate,
	deltaEOk,
	relLuminance,
	hexToRgb,
} from "./color.mjs";
import { ANCHOR_LIGHT, ANCHOR_DARK } from "./base.mjs";

// ---------------------------------------------------------------------------------------
// the anchor palette's structure, measured
// ---------------------------------------------------------------------------------------

const L_LIGHT = {
	n100: 0.987,
	n200: 0.959,
	n300: 0.937,
	n400: 0.894,
	n500: 0.808,
	n600: 0.733,
	n700: 0.608,
	n800: 0.426,
	n900: 0.359,
	ink: 0.266,
};
const C_LIGHT = {
	n100: 0.0034,
	n200: 0.0108,
	n300: 0.0172,
	n400: 0.0238,
	n500: 0.0375,
	n600: 0.0509,
	n700: 0.0539,
	n800: 0.0537,
	n900: 0.0548,
	ink: 0.0538,
};
const L_DARK = { d700: 0.344, d800: 0.298, d900: 0.282 };
const C_DARK = { d700: 0.069, d800: 0.0646, d900: 0.0595 };

/** Chart series 2 — the anchor palette's `"primary-300"` (#A6C5F7), a tint of the brand. */
const CHART2 = { L: 0.818, C: 0.0785 };

const WHITE = "#FFFFFF";

/** The floor every generated pairing is solved against, with a hair of margin over 4.5. */
const AA = 4.55;
/** WCAG 1.4.11: a solid accent has to be seen against the surface it sits on. */
const UI = 3.1;

// ---------------------------------------------------------------------------------------
// The `*-subtle` grounds and their ink
//
// The classic recipe builds the grounds by mixing — 20% of the colour into white for
// light, 45% into black for dark — and pairs them with a dedicated `*-text-emphasis`
// colour (shade 60% in light, tint 40% in dark). the anchor palette overrides the second half away
// and puts the FULL-STRENGTH colour on top as the type, which only ever read for hues that
// are intrinsically light: sRGB luminance is ~72% green, so success (L 0.79) landed near
// 4.4:1 in dark while destructive and primary (L ≈ 0.6) sat under the 3:1 large-text floor, and
// light mode ran 1.5–3.5:1 across the board. Every mature system rejects that recipe —
// Radix puts its step-11 ink on a step-3 wash, never step 9; Tailwind's soft idiom is
// `*-400` ink on a `*-500/10` veil — an emphasis ink, never the raw status colour.
//
// So since 2026-08-11 the pairing is the classic DESIGN with the numbers SOLVED: the
// grounds keep the mixes below (20% light / 28% dark — at a classic 45% a bright status
// ground eats the ink's room; the base palette's dark grounds are additionally re-cut, see
// `alignDarkWash`), and the type is a dedicated `{state}-subtle-foreground`, walked by
// `subtleInk` until the pairing clears AA in its harshest composited form. The raw status
// colour is a fill again, exactly as Radix's step 9 is — nothing renders it as type on a
// tint any more.
// ---------------------------------------------------------------------------------------

const SUBTLE_LIGHT = 0.2;
const SUBTLE_DARK = 0.28;

export const subtleL = (hex) => mixHex(hex, WHITE, SUBTLE_LIGHT);
export const subtleD = (hex) => mixHex(hex, "#000000", SUBTLE_DARK);

/**
 * The ink for a subtle wash — an emphasis ink, solved rather than fixed
 * at a tint percentage. The status colour's own lightness walks away from the wash (down in
 * light, up in dark), hue held, chroma clamped to the gamut, until the HARSHEST consumer
 * clears WCAG AA: the alert description, which renders this ink at 80% opacity over the
 * wash. The full-strength ink then lands near 6–7.5:1 on its own.
 *
 * Dark adds an APCA floor of Lc 68, because WCAG 2.x arithmetic flatters dark pairs — a
 * dark pairing can pass 4.5:1 at a perceptual Lc 40 that light mode would only produce
 * around 1.9:1. Lc 68 lands the walked inks in the measured territory of classic dark
 * text-emphasis (7.2–10.8:1) and Radix's step 11 (7.1–10.3:1), well under the Lc 85–90
 * halation cap. Light needs no such floor: an ink dark enough for the 80% composite
 * measures Lc 67–81 by itself.
 *
 * The target is WCAG's own 4.5 rather than this file's `AA` margin constant: the at-80%
 * composite IS the margin-bearing form, and the full-strength ink clears `AA` by a mile.
 */
function subtleInk(statusHex, wash, scheme) {
	const [fromL, C, h] = hexToOklch(statusHex);
	const dir = scheme === "dark" ? +1 : -1;
	for (let L = fromL; L > 0.05 && L < 0.99; L += dir * 0.004) {
		const hex = fit(L, C, h);
		const composited = mixHex(hex, wash, 0.8);
		if (
			contrast(composited, wash) >= 4.5 &&
			(scheme === "light" || Math.abs(apca(hex, wash)) >= 68)
		)
			return hex;
	}
	throw new Error(`no subtle ink works for ${statusHex} on ${wash} (${scheme})`);
}

/** Rebuild a token table with the walked ink inserted after each `{state}-subtle` ground. */
function withSubtleInks(tokens, scheme) {
	const out = {};
	for (const [token, value] of Object.entries(tokens)) {
		out[token] = value;
		const state = token.endsWith("-subtle") ? token.slice(0, -"-subtle".length) : null;
		if (state && tokens[state]) {
			const ink = subtleInk(tokens[state][0], value[0], scheme);
			const full = contrast(ink, value[0]).toFixed(2);
			const at80 = contrast(mixHex(ink, value[0], 0.8), value[0]).toFixed(2);
			out[`${token}-foreground`] = [ink, `ink on ${token}, ${full}:1 / ${at80}:1 at 80%`];
		}
	}
	return out;
}

// ---------------------------------------------------------------------------------------
// Solvers
// ---------------------------------------------------------------------------------------

/** Chroma capped to what the sRGB gamut allows at this lightness and hue. */
const fit = (L, C, h) => oklchToHex([L, Math.min(C, maxChroma(L, h)), h]);

/**
 * Dark mode's floor: the same colour, lifted only as far as it must be to read as type on
 * the dark card and on its own subtle ground.
 *
 * the anchor palette keeps every status and the brand IDENTICAL across modes, and Radix's step 9 is
 * likewise theme-invariant in 25 of its 27 scales — so the lift starts at the light value
 * and stops the moment both floors clear, rather than reaching for a separately-designed
 * dark palette. Where the light value already passes, nothing moves at all.
 */
function liftDark(h, C, fromL, card, inkish, onCard = AA) {
	for (let L = fromL; L <= 0.94; L += 0.002) {
		const hex = fit(L, C, h);
		// The label has to survive the lift too. Without this the search happily stops in the
		// dead band where a fill is too light for white type and too dark for ink type.
		const label = Math.max(contrast(WHITE, hex), contrast(inkish, hex));
		if (contrast(hex, card) >= onCard && contrast(hex, subtleD(hex)) >= AA && label >= AA)
			return { L, hex };
	}
	throw new Error(`no dark lightness works at hue ${h}`);
}

/**
 * The label for a solid fill: white, or the theme's own `gray-900` — the pair the anchor palette
 * already uses for `--warning-foreground`. Whichever measures better.
 */
function onSolid(fill, inkish) {
	const w = contrast(WHITE, fill),
		d = contrast(inkish, fill);
	return w >= d ? { hex: WHITE, ratio: w } : { hex: inkish, ratio: d };
}

// ---------------------------------------------------------------------------------------
// The shared semantic anchors
//
// Material 3 fixes its error palette independently of the brand seed; USWDS keeps state
// colours in a namespace of their own. Same here: these four hues are the default for every
// theme, and a theme only moves one when its brand lands on top of it — and then only inside
// the band, where the colour still reads as the status it names.
// ---------------------------------------------------------------------------------------

const STATUS = {
	// Vermillion rather than a pure red. Okabe–Ito's CVD-safe red sits here, and USWDS moves
	// its error to #d54309 for the same reason: it widens the red/green gap that deuteranopia
	// collapses.
	destructive: { h: 25, C: 0.19, L: 0.614, band: [10, 40] },
	warning: { h: 84, C: 0.15, L: 0.841, band: [62, 102] },
	// Bluish-green rather than grass-green — the other half of the same Okabe–Ito move, which
	// turns the red/green pair into an orange/teal one.
	success: { h: 160, C: 0.18, L: 0.73, band: [138, 180] },
	info: { h: 232, C: 0.125, L: 0.704, band: [198, 252] },
};

/**
 * The `L` above is the anchor palette's own, measured from `destructive`, `warning`, `success` and
 * `info`. Keeping it is what preserves the LADDER those four sit on — a bright amber above
 * a mint above a red above a cyan — and that ladder is most of what keeps them apart for the
 * 8% of men with a red/green deficiency, for whom hue alone collapses. Only the label on top
 * is recomputed; see `placeLight`.
 */

/**
 * the anchor palette's lightness for a status, nudged to the nearest value where a label — white or the
 * theme's `gray-900` — clears 4.5:1 on it.
 *
 * A naive contrast pick returns white for the success green and
 * lands at 1.87:1. Rather than inherit the mistake, the fill moves as little as it can: the
 * search walks outward from the anchor palette's value and stops at the first lightness that works, so
 * the ladder is preserved to within a step nobody can see.
 */
function placeLight(h, C, target, inkish, page = null) {
	for (let step = 0; step <= 0.3; step += 0.002) {
		for (const L of step === 0 ? [target] : [target - step, target + step]) {
			if (L < 0.3 || L > 0.95) continue;
			const hex = fit(L, C, h);
			if (Math.max(contrast(WHITE, hex), contrast(inkish, hex)) < AA) continue;
			// `page` is the surface the colour is READ ON when it is used as type, as opposed to
			// the label that sits on top of it when it is used as a fill. Only the brand passes
			// one: the search otherwise walks outward from `target` and would happily stop at a
			// lightness that carries a label perfectly and disappears into the page behind it.
			if (page && contrast(hex, page) < AA) continue;
			return { L, hex };
		}
	}
	throw new Error(`no light lightness works at hue ${h}`);
}

// ---------------------------------------------------------------------------------------
// The themes
//
// nh / nc     neutral hue, and how much of the anchor palette's chroma cast to keep (1 = all, 0 = grey)
// brandH/C    the brand's hue and chroma; its lightness is solved, not chosen
// brandDark   only where an ink brand cannot survive the dark page
// chartH      only where an ink brand would make a degenerate chart ramp
// status      per-status hue overrides, each with the collision it resolves
// ---------------------------------------------------------------------------------------

export const THEMES = [
	{
		id: "graphite",
		name: "Graphite",
		why: "The brand is a neutral, so no hue on screen means anything but its status.",
		blurb: "Neutral greys under an ink primary, leaving saturation to carry meaning.",
		nh: 264,
		nc: 0.1,
		// Polaris' answer to the collision problem, generalised: give the highest-frequency UI
		// role a neutral, and every hue on screen is then free to mean exactly one thing.
		brandH: 264,
		brandC: 0.01,
		brandL: 0.3,
		brandDark: { L: 0.93, C: 0.006 },
		// `chart-1` would otherwise be a near-black and `chart-2` a grey the two neutral series
		// already cover, so the chart ramp takes a hue of its own.
		chartH: 264,
		chartC: 0.15,
		chartL: 0.56,
	},
	{
		id: "sepia",
		name: "Sepia",
		why: "Warm paper neutrals with an ink brand; warning steps to the yellow edge to clear them.",
		blurb: "Warm paper greys under an ink primary — the reading-room counterpart to Graphite.",
		nh: 78,
		nc: 0.55,
		brandH: 60,
		brandC: 0.02,
		brandL: 0.3,
		brandDark: { L: 0.93, C: 0.012 },
		chartH: 62,
		chartC: 0.12,
		chartL: 0.62,
		// The neutrals are warm, so warning is pushed to the yellow edge of its band to stay
		// clear of them as well as of the brand.
		// Moving warning also moves it toward success, so success steps back the same way and
		// the four keep the spacing they have everywhere else.
		status: { warning: { h: 98 }, success: { h: 168 } },
	},
	{
		id: "nordic",
		name: "Nordic",
		why: "A quiet blue at a third of the anchor palette’s chroma; info steps to cyan to leave it room.",
		blurb: "Quiet arctic greys under a frost-blue primary.",
		// Nord's Polar Night measures h 264 at a THIRD of the anchor palette's chroma (nord0 #2E3440 is
		// C 0.023 where the anchor palette's `black` is 0.054), and that restraint is the palette's whole
		// character. At the anchor palette's own cast this theme's page came out byte-identical to it.
		nh: 264,
		nc: 0.45,
		brandH: 245,
		brandC: 0.115,
		// The brand sits one band over from info, so info takes the cyan edge — 35° away from
		// the brand and still 50° from success, which is the spacing the anchors have anyway.
		status: { info: { h: 210 } },
	},
	{
		id: "harbor",
		name: "Harbor",
		why: "A teal brand lands between info and success, so both step outward and it sits in the gap.",
		blurb: "Steel greys under a teal primary.",
		nh: 215,
		nc: 0.85,
		brandH: 196,
		brandC: 0.115,
		// A teal brand sits between info and success, so both move outward and it ends up in
		// the gap rather than on either.
		status: { info: { h: 250 }, success: { h: 148 } },
	},
	{
		id: "evergreen",
		name: "Evergreen",
		why: "A green brand beside a green success: rotated as far as the band allows, then separated on tone.",
		blurb: "Warm green-greys under a pine primary, with success moved clear of it.",
		nh: 150,
		nc: 0.65,
		brandH: 172,
		brandC: 0.105,
		// The hard case: a green brand cannot get 35° from a green success. So this takes
		// Carbon's answer instead — hold the hue as far apart as the band allows, and separate
		// the rest on tone and chroma, which the light/dark solve already does.
		status: { success: { h: 145 }, warning: { h: 75 } },
	},
	{
		id: "sandstone",
		name: "Sandstone",
		why: "An ochre brand beside an amber warning: same resolution as Evergreen, one band over.",
		blurb: "Desert neutrals under an ochre primary, with warning moved clear of it.",
		nh: 80,
		nc: 0.75,
		brandH: 68,
		brandC: 0.11,
		// Same shape as Evergreen, one band over: warning takes its far edge, and destructive is
		// pulled to the crimson side so the two warm colours are not neighbours either.
		status: { warning: { h: 100 }, success: { h: 168 }, destructive: { h: 16 } },
	},
	{
		id: "ember",
		name: "Ember",
		why: "The brand falls between destructive and warning, so both step away from it.",
		blurb:
			"Warm taupe under a burnt-orange primary, sitting between the destructive and warning bands.",
		nh: 55,
		nc: 0.7,
		brandH: 50,
		brandC: 0.135,
		// The brand lands between two status bands, so both move outward.
		status: { destructive: { h: 12 }, warning: { h: 96 }, success: { h: 166 } },
	},
	{
		id: "crimson",
		name: "Crimson",
		why: "A red brand beside a red destructive — the collision whose failure mode is a mistaken delete. The brand goes deep and quiet; destructive rotates to vermillion.",
		blurb: "Warm neutrals under a deep wine primary, kept well below the destructive red.",
		nh: 20,
		nc: 0.55,
		// A red brand beside a red destructive has the worst failure mode of any collision here —
		// a delete button that reads as an ordinary one. The brand therefore goes deep and
		// quiet, and destructive is rotated to vermillion; the pair separates on tone and chroma,
		// which is what Carbon does when a hue has nowhere to go.
		brandH: 8,
		brandC: 0.1,
		brandL: 0.41,
		// Lifted only to the point where a WHITE label still works. Letting the solver find the
		// next passing lightness on its own put it at L 0.76, where the only legible label is
		// dark type and the fill had faded to a dusty pink.
		brandDark: { L: 0.58, C: 0.145 },
		status: { destructive: { h: 34 } },
	},
	{
		id: "orchid",
		name: "Orchid",
		why: "A magenta brand sits in a band no status occupies, so every anchor stays where it is.",
		blurb: "Mauve greys under a magenta primary.",
		nh: 320,
		nc: 0.6,
		brandH: 340,
		brandC: 0.185,
	},
	{
		id: "amethyst",
		name: "Amethyst",
		why: "A violet brand sits in a band no status occupies, so every anchor stays where it is.",
		blurb: "Violet greys under a violet primary.",
		nh: 300,
		nc: 0.55,
		brandH: 302,
		brandC: 0.2,
	},
	{
		id: "indigo",
		name: "Indigo",
		why: "An indigo brand sits in a band no status occupies, so every anchor stays where it is.",
		blurb: "Cool slate under a deep indigo primary.",
		nh: 275,
		nc: 0.6,
		brandH: 278,
		brandC: 0.19,
	},
	// LAST ON PURPOSE, AND THE BASE. Every theme above answers "what if the brand were another
	// hue"; this one answers "what if it were the same hue, measured again", so it belongs at the
	// end of the list rather than beside the eleven that actually depart.
	//
	// `builtin` means it emits no `[data-theme]` block, because it IS `:root` and `.dark` in
	// `src/app.css`. Shipping a palette derived from the anchors, rather than the anchors
	// themselves, is the point of the nudge. The anchor values survive only in `base.mjs`, as the
	// table this one's per-token shift is computed from and as the reference the audit measures
	// against — an input to the build, never an output of it.
	{
		id: "parallax",
		name: "Parallax",
		builtin: true,
		nudgeOf: "anchors",
		why: "The base palette, and the one theme with no block of its own: every token is the anchor palette's read from a hair's different angle, so none is shared with it and none is far from it.",
		blurb: "Navy and blue, every value nudged under 2% off the original.",
	},
];

// ---------------------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------------------

const ramp = (Ls, Cs, hue, scale) =>
	Object.fromEntries(Object.entries(Ls).map(([k, L]) => [k, oklchToHex([L, Cs[k] * scale, hue])]));

/*
 * THE NUDGED PALETTE, the one theme not solved from anchors.
 *
 * Everything else in this file derives a palette from a handful of numbers. `parallax` instead
 * reads the anchor palette's own tokens and moves each one by between 0.1% and 2% — far enough that it
 * shares no value with the original, near enough that the two read as the same design. It is
 * the theme's own colours, measured a second time by a slightly different instrument.
 *
 * DETERMINISTIC BY CONSTRUCTION, which `Math.random` could not be: `generate.mjs` has to emit
 * the same bytes on every run — `audit.mjs` diffs the palette against `app.css` and CI rebuilds
 * it from scratch — so each token's shift is drawn from a hash of that token's own name. Same
 * name, same shift, for ever, whatever order the tokens are visited in.
 */

/** FNV-1a over a string: a stable seed per token. */
function seedOf(text) {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/** mulberry32 — one draw in [0, 1) from a seed. */
function draw(seed) {
	let t = (seed + 0x6d2b79f5) | 0;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** The band the shift is drawn from: 0.1% at the quietest, 2% at the loudest. */
const NUDGE_MIN = 0.001;
const NUDGE_MAX = 0.02;

/** A signed factor in ±[NUDGE_MIN, NUDGE_MAX], fixed by `key`. */
function shift(key) {
	const magnitude = NUDGE_MIN + draw(seedOf(key)) * (NUDGE_MAX - NUDGE_MIN);
	return (draw(seedOf(`${key}#sign`)) < 0.5 ? -1 : 1) * magnitude;
}

/**
 * One colour, moved in OKLCH so the three channels shift perceptually rather than by byte.
 *
 * Hue turns by its percentage OF ITS OWN ANGLE, which keeps the move proportional: two percent
 * is four degrees on the blue and a third of one on the red, and neither leaves its band. A
 * neutral has no hue to turn, so it only changes lightness — which is what keeps the greys grey.
 *
 * THE SIGN IS FORCED AT THE ENDS. the anchor palette's card and popover are pure white, and a positive
 * shift there clamps at L 1 and hands back the colour untouched — eleven tokens came through
 * identical the first time this ran. At the ends the shift can only point inward.
 */
function nudgeParts(hex, key) {
	const [L, C, h] = hexToOklch(hex);
	const rawL = shift(`${key}:L`);
	const sL = L >= 0.999 ? -Math.abs(rawL) : L <= 0.001 ? Math.abs(rawL) : rawL;
	return {
		L: Math.min(1, Math.max(0, L * (1 + sL))),
		C: Math.max(0, C * (1 + shift(`${key}:C`))),
		h: C < 1e-6 || !Number.isFinite(h) ? h || 0 : (h * (1 + shift(`${key}:h`)) + 360) % 360,
	};
}

/** the anchor palette's two token tables, each value moved, in the shape `buildTheme` returns. */
function nudgeAnchors(spec) {
	const side = (tokens) => {
		// SEEDED BY THE COLOUR, NOT THE TOKEN. the anchor palette gives `card` and `popover` the same white,
		// `background` and `accent` the same grey, `secondary` and `muted` another — equalities the
		// design leans on. Drawing per token would split them and invent distinctions the original
		// does not have; drawing per value keeps every one of them intact.
		const distinct = [...new Set(Object.values(tokens).map((hex) => hex.toUpperCase()))];
		const moved = new Map(distinct.map((hex) => [hex, nudgeParts(hex, `${spec.id}:${hex}`)]));

		// THE LIGHTNESS LADDER IS NOT THE NUDGE'S TO SHUFFLE. the anchor palette's page sits below its cards
		// and its borders below its type, and independent draws invert any such pair whose gap is
		// smaller than the shift — background and card are 1.3% apart, and the first run duly came
		// back with a white page and grey cards, the theme read backwards. So the nudged
		// lightnesses are dealt back out in the original ranking: every colour still lands on a
		// value the draw produced, but the order they were in survives intact.
		const byOriginal = [...distinct].sort((a, b) => hexToOklch(a)[0] - hexToOklch(b)[0]);
		const ascending = distinct.map((hex) => moved.get(hex).L).sort((a, b) => a - b);
		const finalL = new Map(byOriginal.map((hex, i) => [hex, ascending[i]]));

		const resolved = new Map(
			distinct.map((hex) => {
				const { C, h } = moved.get(hex);
				const L = finalL.get(hex);
				// Capped at what the gamut holds at the settled lightness, so a nudge can never push
				// a colour out of sRGB and have it clipped back as something else.
				return [hex, oklchToHex([L, Math.min(C, maxChroma(L, h)), h]).toUpperCase()];
			}),
		);

		return Object.fromEntries(
			Object.entries(tokens).map(([token, hex]) => [
				token,
				[resolved.get(hex.toUpperCase()), "anchor, nudged"],
			]),
		);
	};
	const light = side(ANCHOR_LIGHT);
	const dark = side(ANCHOR_DARK);

	/*
	 * THE DARK WASHES ARE RE-CUT, NOT NUDGED (2026-08-11). the anchor palette's hand values carry
	 * a classic 45% shift, which preserves each status's own luminance and so spread the five
	 * grounds from L 0.34 (primary) to L 0.48 (warning) — five washes, five behaviours, and the
	 * reason the family's contrast varied by state. One line makes it behave like one family:
	 * success and warning's walked inks land within a step of their raw colour, i.e. the state
	 * the reporter judged "fine" becomes the family norm. The generated themes need no re-cut:
	 * their statuses are lifted high before `subtleD` runs, so 28% of a lifted status lands
	 * near this line already (measured L 0.30–0.37 across all eleven; only Crimson's
	 * deliberately deep wine brand sinks its own wash to 0.25, and the walked ink absorbs it).
	 */
	for (const key of ["primary", "destructive", "success", "warning", "info"]) {
		dark[`${key}-subtle`] = [alignDarkWash(dark[key][0]), "status, cut to the dark-700 line"];
	}

	return {
		spec,
		brand: light.primary[0],
		brandDark: dark.primary[0],
		// The same four the solved themes publish, so the audit's status checks read it the same
		// way: the pair distances and the dichromacy simulation both walk this object.
		status: Object.fromEntries(
			["destructive", "warning", "success", "info"].map((key) => [
				key,
				{
					h: hexToOklch(light[key][0])[2],
					light: { hex: light[key][0] },
					dark: { hex: dark[key][0] },
				},
			]),
		),
		light: withSubtleInks(light, "light"),
		dark: withSubtleInks(dark, "dark"),
	};
}

/**
 * One dark wash, re-cut onto the dark-700 line: the mix of the status colour into black
 * whose OKLCH lightness lands closest to 0.34 — half a step under `L_DARK.d700`, and the
 * line the anchor palette's own primary and destructive washes already sat on. Solved per colour because a
 * fixed percentage cannot land five statuses of five different luminances on one line.
 */
function alignDarkWash(statusHex) {
	let best = null;
	for (let i = 20; i <= 120; i++) {
		const wash = mixHex(statusHex, "#000000", i / 200);
		const dL = Math.abs(hexToOklch(wash)[0] - 0.34);
		if (!best || dL < best.dL) best = { wash, dL };
	}
	return best.wash;
}

export function buildTheme(spec) {
	if (spec.nudgeOf) return nudgeAnchors(spec);

	const n = ramp(L_LIGHT, C_LIGHT, spec.nh, spec.nc);
	const d = ramp(L_DARK, C_DARK, spec.nh, spec.nc);

	// --- brand ---------------------------------------------------------------------------
	// the anchor palette's `primary` measures L 0.592; a theme that does not say otherwise starts there
	// and is nudged by the same rule the statuses use.
	/*
	 * THE BRAND IS SOLVED AS TYPE, NOT ONLY AS A FILL.
	 *
	 * It used to be solved as a fill — the light value placed where it carried a label, the dark
	 * value lifted only to WCAG's 3:1 non-text floor against the dark card — on the reasoning
	 * that a brand is a fill before it is type. The tree disagrees: `--primary` IS body-sized
	 * type in the `link` variant of both Button and Badge (shadcn's own), in the calendar's
	 * today marker and in the event calendar's agenda headings. Measured against the old rule,
	 * nine of the twenty-two theme/mode pairs put that type under 4.5:1 — eight light themes at
	 * 4.38-4.45 against the page, and Crimson's dark brand at 3.02 against its own card.
	 *
	 * So both ends are solved at the AA text floor now, each against the surface that actually
	 * binds it: in light mode the page (`n100`), which is a tinted off-white and therefore
	 * darker than the white card; in dark mode the card (`d800`), which is lighter than the
	 * page. An explicit `brandL` / `brandDark` in a theme spec still wins — those are the
	 * hand-placed ink brands, and Graphite and Sepia clear the floor by a factor of two.
	 */
	const brandL = spec.brandL
		? { L: spec.brandL, hex: fit(spec.brandL, spec.brandC, spec.brandH) }
		: placeLight(spec.brandH, spec.brandC, 0.592, n.n900, n.n100);
	const brandD = spec.brandDark
		? { L: spec.brandDark.L, hex: fit(spec.brandDark.L, spec.brandDark.C, spec.brandH) }
		: liftDark(spec.brandH, spec.brandC, brandL.L, d.d800, n.n900);
	const brand = brandL.hex,
		brandDark = brandD.hex;

	// --- statuses ------------------------------------------------------------------------
	const status = {};
	for (const [key, base] of Object.entries(STATUS)) {
		const h = spec.status?.[key]?.h ?? base.h;
		const C = spec.status?.[key]?.C ?? base.C;
		const L = spec.status?.[key]?.L ?? base.L;
		const l = placeLight(h, C, L, n.n900);
		const k = liftDark(h, C, l.L, d.d800, n.n900);
		status[key] = {
			h,
			light: { ...l, fg: onSolid(l.hex, n.n900) },
			dark: { ...k, fg: onSolid(k.hex, n.n900) },
		};
	}

	// --- charts --------------------------------------------------------------------------
	// `chart-1` is one value serving BOTH modes, as the anchor palette's is, so it has to be seen against
	// the white card and against the dark one. That is a window, not a point: 3:1 on white caps
	// it near L 0.67 and 3:1 on the dark card floors it near L 0.53. A deep brand (Crimson's
	// wine at L 0.41) falls under the floor, so the series is lifted into the window rather
	// than left invisible on the dark page.
	const chartH = spec.chartH ?? spec.brandH;
	const chart1C = spec.chartC ?? spec.brandC;
	const chart1 = (() => {
		const start = spec.chartL ?? brandL.L;
		for (let step = 0; step <= 0.35; step += 0.002) {
			for (const L of step === 0 ? [start] : [start + step, start - step]) {
				if (L < 0.35 || L > 0.8) continue;
				const hex = fit(L, chart1C, chartH);
				if (contrast(hex, WHITE) >= UI && contrast(hex, d.d800) >= UI) return hex;
			}
		}
		throw new Error(`no chart-1 lightness works at hue ${chartH}`);
	})();
	const chart2 = fit(CHART2.L, CHART2.C, chartH);

	// --- secondary text ------------------------------------------------------------------
	// Solved rather than taken from the ramp, in both modes and against the harder of the two
	// grounds it sits on. See DIVERGENCES.
	const solveText = (grounds, from, step) => {
		for (let L = from; step > 0 ? L <= 0.95 : L >= 0.25; L += step) {
			const hex = fit(L, C_LIGHT.n700 * spec.nc, spec.nh);
			if (grounds.every((g) => contrast(hex, g) >= AA)) return hex;
		}
		throw new Error("no secondary-text lightness works");
	};
	const mutedFgLight = solveText([WHITE, n.n100, n.n200], 0.7, -0.002);
	const mutedFgDark = solveText([d.d800, n.ink, d.d900], 0.5, +0.002);

	const primaryFg = onSolid(brand, n.n900);
	const primaryFgDark = onSolid(brandDark, n.n900);

	// The key order of `light` (and `dark` below) is the order `generate.mjs` emits.
	const light = {
		background: [n.n100, "neutral-100"],
		foreground: [n.ink, "neutral-ink"],
		card: [WHITE, "white"],
		"card-foreground": [n.ink, "neutral-ink"],
		popover: [WHITE, "white"],
		"popover-foreground": [n.ink, "neutral-ink"],
		primary: [brand, "brand"],
		"primary-foreground": [primaryFg.hex, `on brand, ${primaryFg.ratio.toFixed(2)}:1`],
		secondary: [n.n200, "neutral-200"],
		"secondary-foreground": [n.ink, "neutral-ink"],
		muted: [n.n200, "neutral-200"],
		"muted-foreground": [mutedFgLight, "secondary text, solved"],
		accent: [n.n100, "neutral-100"],
		"accent-foreground": [n.ink, "neutral-ink"],
		"primary-subtle": [subtleL(brand), "brand, 20% into white"],
		destructive: [status.destructive.light.hex, "destructive"],
		"destructive-foreground": [
			status.destructive.light.fg.hex,
			`on destructive, ${status.destructive.light.fg.ratio.toFixed(2)}:1`,
		],
		"destructive-subtle": [subtleL(status.destructive.light.hex), "destructive, 20% into white"],
		success: [status.success.light.hex, "success"],
		"success-foreground": [
			status.success.light.fg.hex,
			`on success, ${status.success.light.fg.ratio.toFixed(2)}:1`,
		],
		"success-subtle": [subtleL(status.success.light.hex), "success, 20% into white"],
		warning: [status.warning.light.hex, "warning"],
		"warning-foreground": [
			status.warning.light.fg.hex,
			`on warning, ${status.warning.light.fg.ratio.toFixed(2)}:1`,
		],
		"warning-subtle": [subtleL(status.warning.light.hex), "warning, 20% into white"],
		info: [status.info.light.hex, "info"],
		"info-foreground": [
			status.info.light.fg.hex,
			`on info, ${status.info.light.fg.ratio.toFixed(2)}:1`,
		],
		"info-subtle": [subtleL(status.info.light.hex), "info, 20% into white"],
		border: [n.n200, "neutral-200"],
		input: [n.n400, "neutral-400"],
		ring: [brand, "brand"],
		"chart-1": [chart1, "brand"],
		"chart-2": [chart2, "brand tint"],
		"chart-3": [n.n400, "neutral-400"],
		"chart-4": [n.n700, "neutral-700"],
		"chart-5": [n.n500, "neutral-500"],
		scrim: [n.ink, "neutral-ink — the same in both modes"],
		sidebar: [WHITE, "white"],
		"sidebar-foreground": [mutedFgLight, "secondary text"],
		"sidebar-primary": [brand, "brand"],
		"sidebar-primary-foreground": [primaryFg.hex, "on brand"],
		"sidebar-accent": [n.n100, "neutral-100"],
		"sidebar-accent-foreground": [n.ink, "neutral-ink"],
		"sidebar-border": [n.n300, "neutral-300"],
		"sidebar-outline": [n.n300, "neutral-300 — one step off the panel"],
		"sidebar-ring": [brand, "brand"],
	};

	const dark = {
		background: [n.ink, "neutral-ink"],
		foreground: [WHITE, "white"],
		card: [d.d800, "dark-800"],
		"card-foreground": [WHITE, "white"],
		popover: [d.d800, "dark-800"],
		"popover-foreground": [WHITE, "white"],
		primary: [brandDark, "brand, lifted for the dark page"],
		"primary-foreground": [primaryFgDark.hex, `on brand, ${primaryFgDark.ratio.toFixed(2)}:1`],
		secondary: [d.d700, "dark-700"],
		"secondary-foreground": [WHITE, "white"],
		muted: [d.d900, "dark-900"],
		"muted-foreground": [mutedFgDark, "secondary text, solved"],
		accent: [d.d900, "dark-900"],
		"accent-foreground": [WHITE, "white"],
		"primary-subtle": [subtleD(brandDark), "brand, 28% into black"],
		destructive: [status.destructive.dark.hex, "destructive, lifted"],
		"destructive-foreground": [
			status.destructive.dark.fg.hex,
			`on destructive, ${status.destructive.dark.fg.ratio.toFixed(2)}:1`,
		],
		"destructive-subtle": [subtleD(status.destructive.dark.hex), "destructive, 28% into black"],
		success: [status.success.dark.hex, "success, lifted"],
		"success-foreground": [
			status.success.dark.fg.hex,
			`on success, ${status.success.dark.fg.ratio.toFixed(2)}:1`,
		],
		"success-subtle": [subtleD(status.success.dark.hex), "success, 28% into black"],
		warning: [status.warning.dark.hex, "warning, lifted"],
		"warning-foreground": [
			status.warning.dark.fg.hex,
			`on warning, ${status.warning.dark.fg.ratio.toFixed(2)}:1`,
		],
		"warning-subtle": [subtleD(status.warning.dark.hex), "warning, 28% into black"],
		info: [status.info.dark.hex, "info, lifted"],
		"info-foreground": [
			status.info.dark.fg.hex,
			`on info, ${status.info.dark.fg.ratio.toFixed(2)}:1`,
		],
		"info-subtle": [subtleD(status.info.dark.hex), "info, 28% into black"],
		border: [d.d700, "dark-700"],
		input: [d.d700, "dark-700"],
		ring: [brandDark, "brand"],
		"chart-1": [chart1, "brand"],
		"chart-2": [chart2, "brand tint"],
		"chart-3": [n.n400, "neutral-400"],
		"chart-4": [n.n700, "neutral-700"],
		"chart-5": [n.n500, "neutral-500"],
		sidebar: [d.d800, "dark-800"],
		"sidebar-foreground": [mutedFgDark, "secondary text"],
		"sidebar-primary": [brandDark, "brand"],
		"sidebar-primary-foreground": [primaryFgDark.hex, "on brand"],
		"sidebar-accent": [d.d900, "dark-900"],
		"sidebar-accent-foreground": [WHITE, "white"],
		"sidebar-border": [d.d800, "dark-800 — flush with the panel"],
		"sidebar-outline": [d.d700, "dark-700 — one step off the panel"],
		"sidebar-ring": [brandDark, "brand"],
	};

	return {
		spec,
		n,
		d,
		brand,
		brandDark,
		status,
		light: withSubtleInks(light, "light"),
		dark: withSubtleInks(dark, "dark"),
	};
}

// ---------------------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------------------

const lum = (hex) => relLuminance(hexToRgb(hex));
const lumRatio = (a, b) => {
	const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
	return (hi + 0.05) / (lo + 0.05);
};

export function audit(t) {
	const { light: l, dark: k } = t;
	const g = (m, key) => m[key][0];
	const rows = [];
	const add = (scope, what, value, floor) =>
		rows.push({ scope, what, value, floor, pass: value >= floor });

	for (const [scope, m] of [
		["light", l],
		["dark", k],
	]) {
		add(scope, "foreground on background", contrast(g(m, "foreground"), g(m, "background")), 7);
		add(scope, "foreground on card", contrast(g(m, "foreground"), g(m, "card")), 7);
		add(scope, "muted-foreground on card", contrast(g(m, "muted-foreground"), g(m, "card")), 4.5);
		add(
			scope,
			"muted-foreground on background",
			contrast(g(m, "muted-foreground"), g(m, "background")),
			4.5,
		);
		add(scope, "muted-foreground on muted", contrast(g(m, "muted-foreground"), g(m, "muted")), 4.5);
		/*
		 * `--primary` AS TYPE, at the text floor, on both grounds.
		 *
		 * Not a duplicate of the `primary on card` fill row further down: this pair is here
		 * because `text-primary` is real body-sized type in the tree — shadcn's own `link`
		 * variant of Button and Badge, the calendar's today marker, the agenda headings. The two
		 * grounds are both measured because neither dominates: the light page is a tinted
		 * off-white and therefore darker than the white card, while the dark card is lighter
		 * than the dark page, so the binding surface swaps between modes and a single row would
		 * report whichever happened to be kinder.
		 */
		add(scope, "primary as text on card", contrast(g(m, "primary"), g(m, "card")), 4.5);
		add(scope, "primary as text on background", contrast(g(m, "primary"), g(m, "background")), 4.5);
		add(
			scope,
			"sidebar-foreground on sidebar",
			contrast(g(m, "sidebar-foreground"), g(m, "sidebar")),
			4.5,
		);

		for (const key of ["primary", "destructive", "success", "warning", "info"]) {
			add(
				scope,
				`${key}-foreground on ${key}`,
				contrast(g(m, `${key}-foreground`), g(m, key)),
				4.5,
			);
			// The soft pair: the dedicated ink on its wash, at full strength AND as the alert
			// description composites it (80% opacity over the wash). Both floors are the WCAG
			// 4.5 that `subtleInk` solves against — in BOTH schemes: the light floor is no
			// longer anchored to the anchor palette's 1.48, because the ink is no longer the status
			// colour itself and the arithmetic excuse died with the recipe.
			const wash = g(m, `${key}-subtle`);
			const ink = g(m, `${key}-subtle-foreground`);
			add(scope, `${key}-subtle-foreground on ${key}-subtle`, contrast(ink, wash), 4.5);
			add(
				scope,
				`${key}-subtle-fg at 80% on ${key}-subtle`,
				contrast(mixHex(ink, wash, 0.8), wash),
				4.5,
			);
			add(scope, `${key} on card`, contrast(g(m, key), g(m, "card")), UI);
		}
		// A decorative edge, not a control outline: Material 3's own target for the equivalent
		// token is 1:1 at default contrast, and the anchor palette's dark pair measures exactly 1.19.
		add(scope, "input border on card", contrast(g(m, "input"), g(m, "card")), 1.15);
		// All five series, not just the first. the anchor palette's `chart-3` measures 1.35:1 on a white
		// card and `chart-5` 1.68:1 — they are the two neutral tints of its ramp, and reusing
		// that ramp inherits the number. Reported rather than hidden.
		for (const i of [1, 2, 3, 4, 5])
			add(scope, `chart-${i} on card`, contrast(g(m, `chart-${i}`), g(m, "card")), 3);
	}

	// Brand vs each status: 30° is the published categorical minimum; 35° gives it margin.
	// Where a hue cannot move that far, tone has to carry the separation instead.
	const [bL, , bh] = hexToOklch(t.brand);
	const sep = Object.entries(t.status).map(([key, s]) => {
		const dh = hueDistance(bh, s.h);
		const dL = Math.abs(bL - hexToOklch(s.light.hex)[0]);
		const dE = deltaEOk(t.brand, s.light.hex);
		return { key, dh, dL, dE, ok: (dh >= 35 || dL >= 0.1) && dE >= 0.09 };
	});

	// Status against status, including under the two common dichromacies.
	const keys = Object.keys(t.status);
	const pairs = [];
	for (let i = 0; i < keys.length; i++)
		for (let j = i + 1; j < keys.length; j++) {
			const a = t.status[keys[i]].light.hex,
				b = t.status[keys[j]].light.hex;
			pairs.push({
				a: keys[i],
				b: keys[j],
				dh: hueDistance(t.status[keys[i]].h, t.status[keys[j]].h),
				dE: deltaEOk(a, b),
				lum: lumRatio(a, b),
				deutan: deltaEOk(simulate(a, "deutan"), simulate(b, "deutan")),
				protan: deltaEOk(simulate(a, "protan"), simulate(b, "protan")),
			});
		}

	return { rows, sep, pairs };
}
