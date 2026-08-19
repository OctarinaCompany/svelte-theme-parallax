/**
 * Ported from the original source (Radix AlertDialog base), styled after the vega style
 * sheet (`registry/styles/style-vega.css:20-42`) — the same style the sibling `ui/dialog`
 * folder follows.
 *
 * Unlike stateful ports, alert-dialog needs no context or state classes of its own: bits-ui's
 * AlertDialog primitive owns the open state, and the only cross-part signal — the content's
 * `size` — travels as a `data-size` attribute read by descendant parts through Tailwind's
 * named-group selectors, exactly as upstream does it.
 */

/** Content width presets. Upstream `size` on `AlertDialogContent`. */
export const ALERT_DIALOG_SIZES = ["default", "sm"] as const;
export type AlertDialogSize = (typeof ALERT_DIALOG_SIZES)[number];
