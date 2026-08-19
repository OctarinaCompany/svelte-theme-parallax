import { getContext, setContext } from "svelte";
import type { FilterI18nConfig, FilterSize, FilterVariant } from "./types.js";

/**
 * What every part of a chip reads from its root: the size ladder, the spacing variant, and the
 * merged strings.
 *
 * Upstream's `FilterContextValue` carries four more members — `className`, `showSearchInput`,
 * `trigger` and `allowMultiple`. All four are put on the context and then read straight off the
 * root's own props at the only place that uses them, so the context copies are dead. They are
 * not reproduced. `radius` is dead in both places and is not reproduced anywhere (see
 * `types.ts`).
 *
 * WHY GETTERS RATHER THAN A PLAIN OBJECT: `setContext` runs once, at initialisation, and hands
 * the same reference to every descendant for the life of the component. A snapshot would freeze
 * `size` and `i18n` at their first values, and the i18n example on the page — which swaps the
 * whole config while chips are on screen — would keep rendering English. Getters over the root's
 * `$derived` values keep the reads live, which is what React's provider gave for free.
 */
export interface FiltersContext {
	readonly size: FilterSize;
	readonly variant: FilterVariant;
	readonly i18n: FilterI18nConfig;
}

const FILTERS_CONTEXT_KEY = Symbol("filters");

/** Called by `<Filters>` at initialisation. */
export function setFiltersContext(context: FiltersContext): FiltersContext {
	return setContext(FILTERS_CONTEXT_KEY, context);
}

/**
 * Read the root's context.
 *
 * Throws rather than falling back to defaults: a chip part rendered outside a `<Filters>` has no
 * filter to edit, so a silent default would only postpone the failure to the first click.
 */
export function getFiltersContext(): FiltersContext {
	const context = getContext<FiltersContext | undefined>(FILTERS_CONTEXT_KEY);
	if (!context) {
		throw new Error("Filters parts must be rendered inside a <Filters> component.");
	}
	return context;
}
