/**
 * A runes reader over `(prefers-reduced-motion: reduce)`.
 *
 * WHY IT LIVES HERE. It was written inside `ui/swap` for `<Swap>`'s crossfade. Three unrelated
 * components read it now — Swap, Shake, and Status's indicator — and `CONVENTIONS.md` §2 is
 * explicit that a component imports another only for real composition, and that anything two
 * unrelated components need moves to `src/lib/shared/`. A status dot importing from a swap
 * component is exactly the edge that rule exists to prevent.
 *
 * ONE LISTENER FOR THE WHOLE APPLICATION. The previous shape handed every caller its own instance,
 * each registering its own `matchMedia` listener. That was fine for a page with one `<Swap>` on it
 * and wrong the moment the reader reached `Status.Indicator`, whose headline use case is a
 * monitoring list — ninety dots meant ninety listeners answering one identical question. The state
 * is now module-level, and the listener is attached once, lazily, by the first reader to ask.
 *
 * It is never torn down. That is deliberate: it is a single listener on a media query for the
 * lifetime of the document, and reference-counting it across arbitrarily many short-lived
 * components would cost more than it saves — the teardown bookkeeping would be larger than the
 * thing being torn down.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function readReducedMotion(): boolean {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
	return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * The shared answer. Seeded synchronously so the first render is already correct — a component
 * that animated on its first frame and stopped on its second would defeat the point of asking.
 */
const state = $state({ reduced: readReducedMotion() });

let listening = false;

function listen(): void {
	if (listening) return;
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

	listening = true;
	const query = window.matchMedia(REDUCED_MOTION_QUERY);
	query.addEventListener("change", () => {
		state.reduced = query.matches;
	});
}

/**
 * A reader over the shared value.
 *
 * Kept as a class with a `current` field rather than exposing the state object, because that is the
 * shape every call site already reads (`reducedMotion.current`) and because it leaves room to make
 * the reader per-instance again — a component inside a container query, say — without touching a
 * caller.
 */
export class ReducedMotionReader {
	get current(): boolean {
		return state.reduced;
	}
}

const reader = new ReducedMotionReader();

/**
 * Read whether the reader has asked for less motion.
 *
 * Safe to call anywhere, unlike its predecessor: there is no `$effect` in the constructor any more,
 * so it no longer has to be called during component initialisation.
 */
export function useReducedMotion(): ReducedMotionReader {
	listen();
	return reader;
}
