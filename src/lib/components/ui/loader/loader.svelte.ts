import type { WithElementRef, WithoutChildren } from "$lib/utils.js";
import type { HTMLAttributes } from "svelte/elements";

/**
 * The whole shared surface of `ui/loader`.
 *
 * WHY THERE IS ALMOST NOTHING HERE. This folder is not one component with parts — it is ~128
 * unrelated animations that happen to share a barrel.
 * `CONVENTIONS.md` §1 asks a component folder to export each part's `Props` type and §4 puts the
 * folder's pure helpers in `<folder>.svelte.ts`; both rules assume the usual shape, where the parts
 * compose into one thing. Applied literally here they would produce 128 aliases of one identical
 * type and one module holding 128 unrelated helpers. So: the props type is declared once, below,
 * and a loader that needs maths of its own keeps it in its own `<script module>` block.
 *
 * WHAT EVERY LOADER SHARES. `ref`, `class`, and the `role="status"` + `aria-label` pair that
 * `ui/spinner` already establishes as this repo's loading a11y shape. Nothing else: no `size`, no
 * `speed`, no `color`. Each loader is hand-tuned at one fixed size — the pixel geometry is baked
 * into a dozen literals per component — so a `size` prop would ask every one of them to invent a
 * scaling scheme for numbers that were never parameterised. A caller that needs a different size
 * wraps the loader and scales it (`scale-[0.6] sm:scale-75 md:scale-100`), which is what the
 * Loader page's gallery already does.
 */

/**
 * The props every loader takes.
 *
 * `WithoutChildren` on purpose: a loader renders a fixed composition of its own elements, so there
 * is nowhere for a caller's children to land. A `children` prop that silently rendered nothing
 * would be worse than not having one.
 */
export type LoaderProps = WithoutChildren<
	WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
>;

/**
 * The props of a loader whose animation is made of words rather than shapes — the shimmer family.
 *
 * One knob, not two: `label` is both the visible string and the accessible name. Hardcoding
 * the word ("Thinking", "Slide to unlock") would make the loader unusable for any other wait, and
 * a separate `aria-label` could only ever drift out of sync with the text beside it.
 */
export type LoaderTextProps = LoaderProps & {
	/** The word the loader animates. Doubles as the root's `aria-label`. */
	label?: string;
};

/** The accessible name every non-text loader announces, matching `ui/spinner`. */
export const DEFAULT_LOADER_LABEL = "Loading";
