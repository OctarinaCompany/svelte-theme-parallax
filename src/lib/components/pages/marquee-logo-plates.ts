/**
 * The logo wall for the Marquee page's wide-plate section, drawn rather than fetched.
 *
 * WHY THIS EXISTS. Upstream's `marquee-demo.tsx` scrolls three real company logos in 192x80 and
 * 192x56 boxes. Two rules bite at once: this repository makes no network request at runtime, and a
 * logo WALL of real brands would be using them decoratively rather than to identify anything. So
 * the brands are invented and their marks are drawn here, inlined as data URIs — the same technique
 * and the same reasoning as `cropper-sample-image.ts`. The marks the project does carry are the
 * nominative ones, listed in `THIRD-PARTY-NOTICES.md`: a GitHub link that points at GitHub, and the
 * social buttons whose whole subject is which service they sign you in with.
 *
 * THE MARK IS COLOURED, THE WORDMARK IS NOT. A logo wall with no colour in it is not a logo wall,
 * so each mark carries its own brand hue and is rendered as a real `<img>`. The wordmark beside it
 * is left to the page as ordinary DOM text under `--foreground`.
 *
 * That split is the whole design, and it is what makes a fixed ink safe here. An SVG loaded as an
 * image is an isolated document: it inherits no token and no font from the page, so anything drawn
 * inside it commits to a colour on all twelve palettes at once. A brand MARK can afford that — a
 * mark is meant to keep its colour, and every hue below is picked mid-luminance so it holds on the
 * light grounds and the dark ones alike. A WORDMARK cannot: text that fixed its ink would be
 * unreadable on half of them. Keeping it in the DOM also means it renders in the application's own
 * webfont, which an SVG image could never reach, and it retires the `textLength` advance-estimate
 * this file used to need to stop a system font from spilling past the plate's edge.
 *
 * PLATE WIDTHS STILL VARY, which is the point of the section — they are now simply the width the
 * text turns out to be, rather than a number computed from an assumed advance per character.
 */

/** A drawn brand: the mark to render, its hue, and how the wordmark sits against it. */
export type MarqueeLogoPlate = {
	name: string;
	/** The mark as a coloured SVG data URI. */
	src: string;
	/** Rendered size of the mark, in CSS pixels. */
	markSize: number;
	/** Brand hue, exposed so a caller can tint something else with it if it wants to. */
	color: string;
	/** Stacked plates put the mark above the wordmark, so the row varies in height as well. */
	stacked: boolean;
};

/** Every mark is authored in this box, then scaled by the layout that uses it. */
const MARK_BOX = 24;

/** Mark beside the wordmark. */
const INLINE_MARK = 30;

/** Mark above the wordmark: taller, and much narrower. */
const STACKED_MARK = 36;

type PlateSpec = {
	name: string;
	/**
	 * Brand hue. Mid-luminance on purpose: a near-black mark disappears on the dark palettes and a
	 * pastel one disappears on the light ones, and this drawing gets no second chance because it
	 * cannot read a token.
	 */
	color: string;
	/** Mark geometry in the 24x24 box. `fill` and `stroke` are inherited from the wrapping group. */
	mark: string;
	/** Stacked plates are the short-named ones, so the two heights are visibly different. */
	stacked?: boolean;
};

/**
 * The secondary tone of every mark.
 *
 * One opacity rather than a second hex per brand: it keeps the pair unmistakably the same hue, and
 * it composites against whatever ground the card happens to be — a light tint on the light
 * palettes, a deeper one on the dark, in both cases still reading as the quieter half of the same
 * mark.
 */
const SECONDARY_OPACITY = 0.45;

const SPECS: PlateSpec[] = [
	{
		name: "Orbitwise",
		color: "#4f8ff0",
		mark: `<circle cx="12" cy="12" r="4.6"/>
      <ellipse cx="12" cy="12" rx="11" ry="6.2" fill="none" stroke-width="2" stroke-opacity="${SECONDARY_OPACITY}" transform="rotate(-28 12 12)"/>`,
	},
	{
		name: "Northkeep Systems",
		color: "#e0654f",
		mark: `<path d="M12 1.6 L22.4 10.4 H1.6 Z"/>
      <path d="M3.4 13.6 H20.6 L12 22.4 Z" fill-opacity="${SECONDARY_OPACITY}"/>`,
	},
	{
		name: "Lumenpath",
		color: "#2fae7e",
		mark: `<rect x="1.6" y="1.6" width="11" height="20.8" rx="5.5"/>
      <circle cx="18.6" cy="12" r="4.2" fill-opacity="${SECONDARY_OPACITY}"/>`,
	},
	{
		name: "Corvale",
		color: "#8b6ee0",
		stacked: true,
		mark: `<path d="M12 6.4 L17 9.2 V14.8 L12 17.6 L7 14.8 V9.2 Z"/>
      <path d="M12 1.4 L21.2 6.7 V17.3 L12 22.6 L2.8 17.3 V6.7 Z" fill="none" stroke-width="1.9" stroke-opacity="${SECONDARY_OPACITY}"/>`,
	},
	{
		name: "Fernmark Studio",
		color: "#16a3b8",
		mark: `<path d="M12 1.8 C 5.4 7.4, 4.6 16.4, 12 22.2 Z"/>
      <path d="M12 1.8 C 18.6 7.4, 19.4 16.4, 12 22.2 Z" fill-opacity="${SECONDARY_OPACITY}"/>`,
	},
	{
		name: "Halcyra",
		color: "#d9902b",
		stacked: true,
		mark: `<path d="M7.4 2.4 L12.8 12 L7.4 21.6 L2 12 Z"/>
      <path d="M18 6.6 L22.6 12 L18 17.4 L13.4 12 Z" fill-opacity="${SECONDARY_OPACITY}"/>`,
	},
	{
		name: "Quillson",
		color: "#e2568f",
		mark: `<path d="M4.2 21.4 L15.6 2.6 H19.8 L8.4 21.4 Z"/>
      <circle cx="19.2" cy="18.4" r="3.1" fill-opacity="${SECONDARY_OPACITY}"/>`,
	},
];

/**
 * The mark as a data URI.
 *
 * `encodeURIComponent` rather than base64, following `cropper-sample-image.ts`: the markup stays
 * readable in devtools, and `#` — which would otherwise cut the URL short and leave a broken image
 * — is escaped along the way. That matters more here than it did before: every colour below starts
 * with one.
 */
function toDataUri(svg: string): string {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

function plate(spec: PlateSpec): MarqueeLogoPlate {
	const size = spec.stacked ? STACKED_MARK : INLINE_MARK;
	const scale = size / MARK_BOX;

	return {
		name: spec.name,
		color: spec.color,
		markSize: size,
		stacked: spec.stacked ?? false,
		src: toDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g fill="${spec.color}" stroke="${spec.color}" transform="scale(${scale})">
    ${spec.mark}
  </g>
</svg>`),
	};
}

/** Seven invented brands in two layouts, in a deliberately unsorted order. */
export const MARQUEE_LOGO_PLATES: MarqueeLogoPlate[] = SPECS.map(plate);
