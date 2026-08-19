import Root from "./combobox.svelte";
import Input from "./combobox-input.svelte";
import Trigger from "./combobox-trigger.svelte";
import Clear from "./combobox-clear.svelte";
import Value from "./combobox-value.svelte";
import Content from "./combobox-content.svelte";
import List from "./combobox-list.svelte";
import Item from "./combobox-item.svelte";
import Group from "./combobox-group.svelte";
import Label from "./combobox-label.svelte";
import Collection from "./combobox-collection.svelte";
import Empty from "./combobox-empty.svelte";
import Separator from "./combobox-separator.svelte";
import Chips from "./combobox-chips.svelte";
import Chip from "./combobox-chip.svelte";
import ChipsInput from "./combobox-chips-input.svelte";

export type { ComboboxProps, ComboboxRootProps } from "./combobox.svelte";
export type { ComboboxInputProps } from "./combobox-input.svelte";
export type { ComboboxTriggerChildProps, ComboboxTriggerProps } from "./combobox-trigger.svelte";
export type { ComboboxClearProps } from "./combobox-clear.svelte";
export type { ComboboxValueProps } from "./combobox-value.svelte";
export type { ComboboxAlign, ComboboxContentProps, ComboboxSide } from "./combobox-content.svelte";
export type { ComboboxListProps } from "./combobox-list.svelte";
export type { ComboboxItemProps } from "./combobox-item.svelte";
export type { ComboboxGroupProps } from "./combobox-group.svelte";
export type { ComboboxLabelProps } from "./combobox-label.svelte";
export type { ComboboxCollectionProps } from "./combobox-collection.svelte";
export type { ComboboxEmptyProps } from "./combobox-empty.svelte";
export type { ComboboxSeparatorProps } from "./combobox-separator.svelte";
export type { ComboboxChipsProps } from "./combobox-chips.svelte";
export type { ComboboxChipProps } from "./combobox-chip.svelte";
export type { ComboboxChipsInputProps } from "./combobox-chips-input.svelte";

export {
	ComboboxAnchor,
	ComboboxGroupState,
	ComboboxItemCollection,
	ComboboxRootState,
	createComboboxAnchor,
	createFilter,
	defaultFilter,
	defaultItemToStringValue,
	getComboboxContext,
	getComboboxGroupContext,
	hasComboboxContentMarker,
	isGroupShapedItem,
	setComboboxContentMarker,
	setComboboxContext,
	setComboboxGroupContext,
	type ComboboxFilters,
	type ComboboxHighlightDirection,
	type ComboboxItemData,
	type ComboboxMatcher,
	type ComboboxRootStateProps,
} from "./combobox.svelte.js";

export {
	Root,
	Input,
	Trigger,
	Clear,
	Value,
	Content,
	List,
	Item,
	Group,
	Label,
	Collection,
	Empty,
	Separator,
	Chips,
	Chip,
	ChipsInput,
	//
	Root as Combobox,
	Input as ComboboxInput,
	Trigger as ComboboxTrigger,
	Clear as ComboboxClear,
	Value as ComboboxValue,
	Content as ComboboxContent,
	List as ComboboxList,
	Item as ComboboxItem,
	Group as ComboboxGroup,
	Label as ComboboxLabel,
	Collection as ComboboxCollection,
	Empty as ComboboxEmpty,
	Separator as ComboboxSeparator,
	Chips as ComboboxChips,
	Chip as ComboboxChip,
	ChipsInput as ComboboxChipsInput,
};
