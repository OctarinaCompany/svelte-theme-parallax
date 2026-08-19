/** Upstream's `useIsMobile(mobileBreakpoint = 768)` default. */
export const DEFAULT_MOBILE_BREAKPOINT = 768;

/**
 * A runes reader over `(max-width: <breakpoint - 1>px)`, SSR-safe.
 *
 * `current` is seeded `false` — matching upstream's `!!undefined` before its effect runs — and
 * corrects inside an `$effect` on the client. Exactly one `change` listener is registered per
 * instance; changing the breakpoint getter tears the old query down and creates a new one.
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
