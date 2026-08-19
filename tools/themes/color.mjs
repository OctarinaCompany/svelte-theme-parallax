/**
 * Colour maths for the theme generator.
 *
 * Everything here is plain arithmetic on sRGB / OKLab / OKLCH, plus the two contrast
 * metrics the palettes are validated against (WCAG 2.x ratio and APCA Lc). No dependency:
 * the generator has to run from the scratchpad without touching the project's lockfile.
 */

// --- sRGB <-> linear -------------------------------------------------------------------

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex) {
	const h = hex.replace("#", "").trim();
	const n =
		h.length === 3
			? h
					.split("")
					.map((c) => c + c)
					.join("")
			: h;
	return [
		parseInt(n.slice(0, 2), 16) / 255,
		parseInt(n.slice(2, 4), 16) / 255,
		parseInt(n.slice(4, 6), 16) / 255,
	];
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function rgbToHex([r, g, b]) {
	const to = (c) =>
		Math.round(clamp01(c) * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

// --- OKLab / OKLCH (Björn Ottosson) ----------------------------------------------------

export function rgbToOklab([r, g, b]) {
	const lr = toLinear(r),
		lg = toLinear(g),
		lb = toLinear(b);
	const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
	const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
	const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	];
}

export function oklabToRgb([L, a, bb]) {
	const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * bb) ** 3;
	return [
		toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
		toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
		toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
	];
}

export function rgbToOklch(rgb) {
	const [L, a, b] = rgbToOklab(rgb);
	const C = Math.hypot(a, b);
	let h = (Math.atan2(b, a) * 180) / Math.PI;
	if (h < 0) h += 360;
	return [L, C, C < 1e-6 ? 0 : h];
}

export function oklchToRgb([L, C, h]) {
	const rad = (h * Math.PI) / 180;
	return oklabToRgb([L, C * Math.cos(rad), C * Math.sin(rad)]);
}

export const hexToOklch = (hex) => rgbToOklch(hexToRgb(hex));

const inGamut = ([r, g, b]) => [r, g, b].every((c) => c >= -1e-4 && c <= 1 + 1e-4);

/**
 * The largest chroma at this (L, h) that still lands inside sRGB, found by bisection.
 * Everything the generator emits is gamut-clipped this way rather than by clamping the
 * channels, which would shift both hue and lightness.
 */
export function maxChroma(L, h) {
	let lo = 0,
		hi = 0.4;
	if (inGamut(oklchToRgb([L, hi, h]))) return hi;
	for (let i = 0; i < 40; i++) {
		const mid = (lo + hi) / 2;
		if (inGamut(oklchToRgb([L, mid, h]))) lo = mid;
		else hi = mid;
	}
	return lo;
}

/** OKLCH -> hex, with the chroma pulled back to the sRGB boundary when it overflows. */
export function oklchToHex([L, C, h]) {
	const capped = Math.min(C, maxChroma(L, h));
	return rgbToHex(oklchToRgb([L, capped, h]));
}

// --- Mixing ----------------------------------------------------------------------------

/** Mix in sRGB, `amount` of `a` against `b` — the classic preprocessor mix space. */
export function mixHex(a, b, amount) {
	const A = hexToRgb(a),
		B = hexToRgb(b);
	return rgbToHex([0, 1, 2].map((i) => A[i] * amount + B[i] * (1 - amount)));
}

// --- Contrast --------------------------------------------------------------------------

export function relLuminance(rgb) {
	const [r, g, b] = rgb.map(toLinear);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, 1 … 21. */
export function contrast(hexA, hexB) {
	const a = relLuminance(hexToRgb(hexA));
	const b = relLuminance(hexToRgb(hexB));
	const [hi, lo] = a > b ? [a, b] : [b, a];
	return (hi + 0.05) / (lo + 0.05);
}

/**
 * APCA (SAPC-98 / W3C draft), the perceptual metric WCAG 3 is built on. Reported alongside
 * the 2.x ratio because 2.x systematically over-rates light text on dark grounds, which is
 * exactly the case every dark theme here lives in.
 *
 * Returns Lc, signed: positive for dark text on a light ground, negative for the reverse.
 */
export function apca(textHex, bgHex) {
	const Y = (hex) => {
		const [r, g, b] = hexToRgb(hex);
		return 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4;
	};
	const clampY = (y) => (y > 0.022 ? y : y + (0.022 - y) ** 1.414);
	const Ytxt = clampY(Y(textHex));
	const Ybg = clampY(Y(bgHex));
	if (Math.abs(Ybg - Ytxt) < 0.0005) return 0;

	let Lc;
	if (Ybg > Ytxt) {
		Lc = (Ybg ** 0.56 - Ytxt ** 0.57) * 1.14;
		Lc = Lc < 0.1 ? 0 : Lc - 0.027;
	} else {
		Lc = (Ybg ** 0.65 - Ytxt ** 0.62) * 1.14;
		Lc = Lc > -0.1 ? 0 : Lc + 0.027;
	}
	return Lc * 100;
}

/** Smallest angular distance between two hues, 0 … 180. */
export function hueDistance(h1, h2) {
	const d = Math.abs(((h1 - h2) % 360) + 360) % 360;
	return d > 180 ? 360 - d : d;
}

/**
 * Brettel/Viénot-style dichromacy simulation, used only to check that the status colours
 * stay distinguishable from each other and from the brand for the two common forms.
 * LMS matrices from Viénot, Brettel & Mollon (1999).
 */
export function simulate(hex, kind) {
	const [r, g, b] = hexToRgb(hex).map(toLinear);
	const L = 17.8824 * r + 43.5161 * g + 4.11935 * b;
	const M = 3.45565 * r + 27.1554 * g + 3.86714 * b;
	const S = 0.0299566 * r + 0.184309 * g + 1.46709 * b;

	let l = L,
		m = M,
		s = S;
	if (kind === "protan") l = 2.02344 * M - 2.5258 * S;
	if (kind === "deutan") m = 0.494207 * L + 1.24827 * S;
	if (kind === "tritan") s = -0.395913 * L + 0.801109 * M;

	const R = 0.080944 * l - 0.130504 * m + 0.116721 * s;
	const G = -0.0102485 * l + 0.0540194 * m - 0.113615 * s;
	const B = -0.000365294 * l - 0.00412163 * m + 0.693513 * s;
	return rgbToHex([toGamma(clamp01(R)), toGamma(clamp01(G)), toGamma(clamp01(B))]);
}

/** Perceptual distance in OKLab — the metric used to check two colours read as different. */
export function deltaEOk(hexA, hexB) {
	const a = rgbToOklab(hexToRgb(hexA));
	const b = rgbToOklab(hexToRgb(hexB));
	return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
