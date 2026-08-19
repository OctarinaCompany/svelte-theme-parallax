import Root from "./key-value.svelte";
import List from "./key-value-list.svelte";
import Item from "./key-value-item.svelte";
import KeyInput from "./key-value-key-input.svelte";
import ValueInput from "./key-value-value-input.svelte";
import Remove from "./key-value-remove.svelte";
import Add from "./key-value-add.svelte";
import ErrorMessage from "./key-value-error.svelte";

export type { KeyValueProps, KeyValueRootProps } from "./key-value.svelte";
export type { KeyValueListProps } from "./key-value-list.svelte";
export type { KeyValueItemProps } from "./key-value-item.svelte";
export type { KeyValueKeyInputProps } from "./key-value-key-input.svelte";
export type { KeyValueValueInputProps } from "./key-value-value-input.svelte";
export type { KeyValueRemoveProps } from "./key-value-remove.svelte";
export type { KeyValueAddProps } from "./key-value-add.svelte";
export type { KeyValueErrorProps } from "./key-value-error.svelte";

export {
	createKeyValueItemId,
	getKeyValueContext,
	getKeyValueItemContext,
	KEY_VALUE_ORIENTATIONS,
	KeyValueItemState,
	KeyValueRootState,
	parseKeyValueText,
	setKeyValueContext,
	setKeyValueItemContext,
	stripSurroundingQuotes,
	type KeyValueErrors,
	type KeyValueField,
	type KeyValueItemData,
	type KeyValueItemErrors,
	type KeyValueItemStateProps,
	type KeyValueOrientation,
	type KeyValueRootStateProps,
} from "./key-value.svelte.js";

export {
	Root,
	List,
	Item,
	KeyInput,
	ValueInput,
	Remove,
	Add,
	ErrorMessage as Error,
	//
	Root as KeyValue,
	List as KeyValueList,
	Item as KeyValueItem,
	KeyInput as KeyValueKeyInput,
	ValueInput as KeyValueValueInput,
	Remove as KeyValueRemove,
	Add as KeyValueAdd,
	ErrorMessage as KeyValueError,
};
