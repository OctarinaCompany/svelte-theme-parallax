/*
 * A DEEP IMPORT, deliberately — the one place the house barrel rule bends. `constants.ts` is a
 * verbatim upstream file, shipped by the official `sidebar` registry item, so this path resolves
 * identically here and in any project that installed the sidebar from the registry. Importing via
 * the local barrel required a house re-export that upstream's barrel does not have — a divergence
 * in a registry-ported file that would break this hook the moment it is installed beside the
 * OFFICIAL sidebar. The deep import removes the divergence instead of exporting it.
 */
import { SIDEBAR_COOKIE_NAME } from "$lib/components/ui/sidebar/constants.js";

/**
 * Read the sidebar's persisted open/closed state.
 *
 * WHY THIS EXISTS — this is the one thing a verbatim copy of the official block gets
 * wrong in a Vite SPA.
 *
 * `Sidebar.Provider` WRITES `sidebar_state` to a cookie every time the sidebar is
 * toggled, but it never reads it back: its `open` prop simply defaults to `true`. In
 * SvelteKit that is correct, because the documented pattern reads the cookie
 * server-side in a `load` function and passes the value in as a prop.
 *
 * This project has no server. Without the function below the sidebar writes its state
 * faithfully and forgets it on every reload — and nothing looks broken, which is what
 * makes it easy to miss.
 *
 */
export function getStoredSidebarState(): boolean {
	// Guard for any non-browser evaluation (prerendering, tests, SSR added later).
	if (typeof document === "undefined") return true;

	const match = document.cookie
		.split("; ")
		.find((entry) => entry.startsWith(`${SIDEBAR_COOKIE_NAME}=`));

	// Absent or unrecognised cookie: start expanded, matching the provider's own default.
	if (!match) return true;

	return match.slice(SIDEBAR_COOKIE_NAME.length + 1) !== "false";
}
