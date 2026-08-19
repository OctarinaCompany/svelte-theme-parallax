import Root from "./autocomplete.svelte";
import Input from "./autocomplete-input.svelte";
import Trigger from "./autocomplete-trigger.svelte";
import Clear from "./autocomplete-clear.svelte";
import Content from "./autocomplete-content.svelte";
import List from "./autocomplete-list.svelte";
import Item from "./autocomplete-item.svelte";
import Group from "./autocomplete-group.svelte";
import GroupLabel from "./autocomplete-group-label.svelte";
import Collection from "./autocomplete-collection.svelte";
import Empty from "./autocomplete-empty.svelte";
import Status from "./autocomplete-status.svelte";
import Separator from "./autocomplete-separator.svelte";

export type { AutocompleteProps, AutocompleteRootProps } from "./autocomplete.svelte";
export type { AutocompleteInputProps, AutocompleteInputSize } from "./autocomplete-input.svelte";
export { autocompleteInputVariants } from "./autocomplete-input.svelte";
export type { AutocompleteTriggerProps } from "./autocomplete-trigger.svelte";
export type { AutocompleteClearProps } from "./autocomplete-clear.svelte";
export type {
	AutocompleteAlign,
	AutocompleteContentProps,
	AutocompleteSide,
} from "./autocomplete-content.svelte";
export type { AutocompleteListProps } from "./autocomplete-list.svelte";
export type { AutocompleteItemProps } from "./autocomplete-item.svelte";
export type { AutocompleteGroupProps } from "./autocomplete-group.svelte";
export type { AutocompleteGroupLabelProps } from "./autocomplete-group-label.svelte";
export type { AutocompleteCollectionProps } from "./autocomplete-collection.svelte";
export type { AutocompleteEmptyProps } from "./autocomplete-empty.svelte";
export type { AutocompleteStatusProps } from "./autocomplete-status.svelte";
export type { AutocompleteSeparatorProps } from "./autocomplete-separator.svelte";

export {
	AutocompleteItemCollection,
	AutocompleteGroupState,
	AutocompleteRootState,
	createFilter,
	defaultFilter,
	defaultItemToStringValue,
	getAutocompleteContext,
	getAutocompleteGroupContext,
	setAutocompleteContext,
	setAutocompleteGroupContext,
	type AutocompleteFilters,
	type AutocompleteHighlightDirection,
	type AutocompleteItemData,
	type AutocompleteMatcher,
	type AutocompleteRootStateProps,
} from "./autocomplete.svelte.js";

export {
	Root,
	Input,
	Trigger,
	Clear,
	Content,
	List,
	Item,
	Group,
	GroupLabel,
	Collection,
	Empty,
	Status,
	Separator,
	//
	Root as Autocomplete,
	Input as AutocompleteInput,
	Trigger as AutocompleteTrigger,
	Clear as AutocompleteClear,
	Content as AutocompleteContent,
	List as AutocompleteList,
	Item as AutocompleteItem,
	Group as AutocompleteGroup,
	GroupLabel as AutocompleteGroupLabel,
	Collection as AutocompleteCollection,
	Empty as AutocompleteEmpty,
	Status as AutocompleteStatus,
	Separator as AutocompleteSeparator,
};
