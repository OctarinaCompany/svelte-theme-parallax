/** Upstream's `useIsMobile(mobileBreakpoint = 768)` default. */
export const DEFAULT_MOBILE_BREAKPOINT = 768;

/**
 * A runes reader over `(max-width: <breakpoint - 1>px)`, SSR-safe.
 *
 * `current` is seeded `false` — matching upstream's `!!undefined` before its effect runs — and
 * corrects inside an `$effect` on the client. Exactly one `change` listener is registered per
 * instance; changing the breakpoint getter tears the old query down and creates a new one.
 *
 * THE SEED STAYS `false`, AND THAT COSTS A DEV WARNING. Below the breakpoint the first render
 * therefore takes the DESKTOP branch of `sidebar.svelte`, mounts twelve `Collapsible.Root`s and
 * destroys them one tick later, before bits-ui's presence `watch` has settled — twelve
 * `derived_inert` warnings on every page load at a phone width. Measured: twelve at 390, 700 and
 * 767 CSS px, zero at 768 and 1440, and zero when the window is resized 1440 -> 390 after load,
 * which is what identifies the immediate teardown rather than teardown in general as the trigger.
 *
 * Seeding from `window.matchMedia(...).matches` in the constructor removes it outright, and is
 * NOT done here. This class is a published registry item, and the seed is the one thing making a
 * server render and the first client render agree: a SvelteKit consumer would hydrate a desktop
 * shell into a mobile client value and get a real mismatch in exchange for a warning that Svelte
 * strips from production builds. A wrong tree for every SSR consumer is the worse trade.
 */
export class IsMobile {
	/** `true` when the viewport is narrower than the breakpoint. */
	current: boolean = $state(false);

	constructor(getBreakpoint: () => number = () => DEFAULT_MOBILE_BREAKPOINT) {
		$effect(() => {
			const breakpoint = getBreakpoint();

			if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

			// The query string is copied verbatim from upstream's `use-mobile.ts`.
			const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
			const onChange = () => {
				this.current = query.matches;
			};

			this.current = query.matches;
			query.addEventListener("change", onChange);

			return () => query.removeEventListener("change", onChange);
		});
	}
}
