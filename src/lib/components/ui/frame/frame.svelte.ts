/**
 * Frame is purely presentational: the parts coordinate through the CSS custom properties the
 * root publishes (`--frame-panel-*`), not through JS state, so this module carries only the
 * constant unions the variant props are typed from. Ported from the original source.
 */

/** Chrome treatment of the frame shell. Upstream `variant`. */
export const FRAME_VARIANTS = ["default", "inverse", "ghost"] as const;
export type FrameVariant = (typeof FRAME_VARIANTS)[number];

/**
 * Padding ladder shared by panel body, header and footer. Upstream `spacing`.
 * Note this is a density ramp for container padding, not a control size, so
 * it does not follow the `--control-h-*` control ramp (CONVENTIONS §3: sm 32 / default 40 / lg 48).
 */
export const FRAME_SPACINGS = ["xs", "sm", "default", "lg"] as const;
export type FrameSpacing = (typeof FRAME_SPACINGS)[number];
