/**
 * A stand-in photograph for the Compare slider page, drawn rather than fetched.
 *
 * Same rule and same reasoning as `cropper-sample-image.ts`: upstream's demos load stock-photo, this
 * repository fetches nothing at runtime, and a flat grey block would demonstrate nothing — a wipe
 * between two featureless rectangles is invisible.
 *
 * The pair is ONE drawing rendered twice, which is what a before/after control is actually for. The
 * "after" copy is the same markup with a different grade, so the divider reveals a genuine
 * correction of one picture rather than two unrelated images — the mistake that makes most
 * before/after demos read as a crossfade.
 */

export const SCENE_WIDTH = 1200;
export const SCENE_HEIGHT = 800;

/** `graded` swaps the palette for the warmer, higher-contrast treatment. */
function scene(graded: boolean): string {
	const sky = graded ? ["#12305c", "#5aa0d0", "#ffd9a1"] : ["#4a5560", "#8a949c", "#c9c6bd"];
	const water = graded ? "#0e2745" : "#454f57";
	const ridge = graded ? "#16395f" : "#3c4650";
	const near = graded ? "#0b1f38" : "#2f383f";
	const sun = graded ? "#ffe6b4" : "#d8d5cc";

	return `
<svg xmlns="http://www.w3.org/2000/svg" width="${SCENE_WIDTH}" height="${SCENE_HEIGHT}" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sky[0]}"/>
      <stop offset="58%" stop-color="${sky[1]}"/>
      <stop offset="100%" stop-color="${sky[2]}"/>
    </linearGradient>
    <radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${sun}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${sun}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="800" fill="url(#s)"/>
  <circle cx="880" cy="430" r="200" fill="url(#g)"/>
  <circle cx="880" cy="430" r="58" fill="${sun}"/>

  <path d="M0 520 L220 400 L430 520 Z" fill="${ridge}"/>
  <path d="M300 530 L600 355 L880 530 Z" fill="${near}"/>
  <path d="M780 540 L1010 430 L1200 540 L1200 560 L780 560 Z" fill="${ridge}"/>

  <rect y="540" width="1200" height="260" fill="${water}"/>
  <g fill="${sun}" fill-opacity="0.28">
    <rect x="820" y="580" width="120" height="6" rx="3"/>
    <rect x="840" y="612" width="80" height="5" rx="2.5"/>
    <rect x="855" y="642" width="50" height="4" rx="2"/>
  </g>

  <g fill="${near}">
    <path d="M150 540 l24 -66 l24 66 Z"/>
    <path d="M205 540 l18 -50 l18 50 Z"/>
  </g>
</svg>`.trim();
}

/** The uncorrected frame. */
export const SCENE_BEFORE_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(scene(false))}`;

/** The graded frame — warmer sky, deeper water, a sun that reads. */
export const SCENE_AFTER_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(scene(true))}`;
