import Root from "./tags-input.svelte";
import Label from "./tags-input-label.svelte";
import Input from "./tags-input-input.svelte";
import Item from "./tags-input-item.svelte";
import ItemText from "./tags-input-item-text.svelte";
import ItemDelete from "./tags-input-item-delete.svelte";
import Clear from "./tags-input-clear.svelte";

export type { TagsInputProps, TagsInputRootProps } from "./tags-input.svelte";
export type { TagsInputLabelProps } from "./tags-input-label.svelte";
export type { TagsInputInputProps } from "./tags-input-input.svelte";
export type { TagsInputItemProps } from "./tags-input-item.svelte";
export type { TagsInputItemTextProps } from "./tags-input-item-text.svelte";
export type { TagsInputItemDeleteProps } from "./tags-input-item-delete.svelte";
export type { TagsInputClearChildProps, TagsInputClearProps } from "./tags-input-clear.svelte";

export {
	findAdjacentIndex,
	getTagsInputContext,
	getTagsInputItemContext,
	setTagsInputContext,
	setTagsInputItemContext,
	splitByDelimiter,
	TagsInputItemState,
	TagsInputRootState,
	type FindAdjacentIndexOptions,
	type TagsInputBlurBehavior,
	type TagsInputItemStateProps,
	type TagsInputRootStateProps,
} from "./tags-input.svelte.js";

export {
	Root,
	Label,
	Input,
	Item,
	ItemText,
	ItemDelete,
	Clear,
	//
	Root as TagsInput,
	Label as TagsInputLabel,
	Input as TagsInputInput,
	Item as TagsInputItem,
	ItemText as TagsInputItemText,
	ItemDelete as TagsInputItemDelete,
	Clear as TagsInputClear,
};
