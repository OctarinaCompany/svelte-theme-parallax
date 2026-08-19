/**
 * The theme axis.
 *
 * A "theme" here is a palette and nothing else — the same tokens, different colours. It is a
 * SECOND axis alongside light/dark, not a replacement for it: every theme defines both modes,
 * so `<html class="dark" data-theme="ember">` is a normal state and the two switches are
 * independent.
 *
 * WHY THERE IS NO STORE HERE. `mode-watcher` already owns this. Since 1.1 it persists a
 * `data-theme` attribute on `<html>` under the `mode-watcher-theme` key, exposes `theme` as a
 * reader and `setTheme` as the writer, and runs the write through the same
 * suppress-transitions wrapper it uses for the mode — so switching palettes does not animate
 * forty tokens at once. Re-implementing that would have meant a second source of truth for
 * the same attribute. This module only adds what it does not have: the list of themes that
 * exist, and the guarantee that the active one is one of them.
 *
 * @see src/lib/themes/palettes.ts — the generated data
 * @see src/themes.css — the generated CSS the attribute selects
 */

import { theme as modeWatcherTheme, setTheme as modeWatcherSetTheme } from "mode-watcher";
import { DEFAULT_THEME, THEMES, THEME_IDS, type ThemeId } from "./palettes.js";

export { THEMES, THEME_IDS, DEFAULT_THEME, TOKEN_GROUPS } from "./palettes.js";
export type { Theme, ThemeId } from "./palettes.js";

/**
 * The localStorage key `mode-watcher` writes the theme to.
 *
 * Stated here because `index.html` has to read the same key from a plain inline script, and a
 * key spelled twice is a key that drifts. It is mode-watcher's default; changing it means
 * passing `themeStorageKey` to `ModeWatcher` and editing the script in `index.html` to match.
 */
export const THEME_STORAGE_KEY = "mode-watcher-theme";

/** Whether a string is a theme this app actually ships. */
export function isThemeId(value: string | null | undefined): value is ThemeId {
	return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
}

/**
 * The active theme, always a known id.
 *
 * The narrowing is not paranoia: the value comes from `localStorage`, so it survives a rename
 * or a removal of a theme and would otherwise leave the app pointing at a `data-theme` no
 * stylesheet answers — which renders as the classic theme anyway, but with a picker showing nothing
 * selected. Falling back here keeps the attribute and the picker agreeing.
 */
export const activeTheme = {
	get current(): ThemeId {
		return isThemeId(modeWatcherTheme.current) ? modeWatcherTheme.current : DEFAULT_THEME;
	},
};

/** Switch palettes. Persists, and takes effect on the next frame without a transition. */
export function setTheme(id: ThemeId): void {
	modeWatcherSetTheme(id);
}

/** The record for a theme id, for the picker's trigger and the Themes page. */
export function themeById(id: ThemeId) {
	// Non-null: `id` is a `ThemeId`, and `THEMES` is generated from the same list.
	return THEMES.find((t) => t.id === id)!;
}
