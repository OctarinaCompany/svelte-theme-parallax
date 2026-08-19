/**
 * A stand-in photograph for the Cropper page, drawn rather than fetched.
 *
 * WHY THIS EXISTS. Upstream's demos load stock photographs. This repository makes no network
 * requests at runtime — the Aspect ratio page states the rule and answers it with a flat
 * `bg-muted` block, which is the right answer for a component whose subject is the frame. It is
 * the wrong answer here: a cropper with a featureless grey rectangle inside it demonstrates
 * nothing, because you cannot see the picture move under the selection.
 *
 * So the picture is drawn as an SVG and inlined as a data URI. That keeps the "fetches nothing"
 * rule and still gives the cropper what it actually needs: an `<img>` with real
 * `naturalWidth`/`naturalHeight`, which is what every measurement in `cropper-geometry.ts` is
 * computed from.
 *
 * The scene is deliberately busy in a legible way — a horizon, a sun, three hills and a tree line —
 * so that a small drag is visible and a zoom is obviously a zoom.
 *
 * NO GRID IN THE PICTURE. An earlier version laid a faint coordinate grid over the whole drawing,
 * on the reasoning that it doubled as a ruler when comparing `contain` against the three `cover`
 * fits. It read as part of the component instead of part of the photograph, and it collided with
 * the rule-of-thirds guides `withGrid` draws inside the selection — two grids, one of them a real
 * feature and one of them scenery. The inset border stays: a single outline marks where the media
 * ends, which is the thing you genuinely need to see while dragging it under the frame.
 */

/** Intrinsic size of the drawing. 3:2, so no crop preset matches it exactly. */
export const SAMPLE_IMAGE_WIDTH = 1200;
export const SAMPLE_IMAGE_HEIGHT = 800;

const SCENE = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SAMPLE_IMAGE_WIDTH}" height="${SAMPLE_IMAGE_HEIGHT}" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1b3a63"/>
      <stop offset="55%" stop-color="#3f7ea6"/>
      <stop offset="100%" stop-color="#e8b978"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#ffe9b0" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#ffe9b0" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="800" fill="url(#sky)"/>
  <circle cx="820" cy="470" r="240" fill="url(#glow)"/>
  <circle cx="820" cy="470" r="66" fill="#fff2cf"/>

  <path d="M0 560 L250 430 L470 560 Z" fill="#2b5068"/>
  <path d="M320 570 L620 380 L900 570 Z" fill="#22415a"/>
  <path d="M760 585 L1010 455 L1200 585 L1200 620 L760 620 Z" fill="#1b3550"/>
  <rect y="560" width="1200" height="240" fill="#16324a"/>

  <g fill="#0f2438">
    <path d="M120 560 l26 -74 l26 74 Z"/>
    <path d="M180 560 l20 -56 l20 56 Z"/>
    <path d="M980 560 l30 -84 l30 84 Z"/>
    <path d="M1050 560 l22 -60 l22 60 Z"/>
  </g>

  <rect y="600" width="1200" height="4" fill="#ffffff" fill-opacity="0.18"/>
  <rect x="6" y="6" width="1188" height="788" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="4"/>
</svg>`;

/**
 * The scene as a data URI.
 *
 * `encodeURIComponent` rather than base64: the markup stays readable in devtools, and the encoded
 * form is shorter for text this repetitive. `#` in the colour literals is the one character that
 * MUST be escaped — unescaped it terminates the URL and the browser silently renders nothing.
 */
export const SAMPLE_IMAGE_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SCENE.trim())}`;
