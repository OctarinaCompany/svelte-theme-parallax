import Root from "./suggestion.svelte";
import Item from "./suggestion-item.svelte";

/*
 * There is no `suggestion.svelte.ts`, and that is a statement rather than a gap: the component
 * holds no state and its two parts share no context. The strip is a scroll container and a chip
 * is a Button with a value attached; the one thing they could have agreed on — the class recipe —
 * lives with the part that paints it, as `status` keeps `statusVariants`, `STATUS_VARIANTS` and
 * `resolveStatusVariant` in `status.svelte` with no `.svelte.ts` beside it.
 *
 * The aliases keep upstream's names, where `Suggestions` is the strip and `Suggestion` the chip —
 * so `SuggestionsProps` is the ROOT's props and `SuggestionProps` the ITEM's, the one folder in the
 * kit where the bare `<Folder>Props` alias does not name the root.
 */
export {
	resolveSuggestionLayout,
	SUGGESTION_LAYOUTS,
	suggestionVariants,
	type SuggestionLayout,
	type SuggestionRootProps,
	type SuggestionsProps,
} from "./suggestion.svelte";
export { type SuggestionItemProps, type SuggestionProps } from "./suggestion-item.svelte";

export {
	Root,
	Item,
	//
	Root as Suggestions,
	Item as Suggestion,
};
