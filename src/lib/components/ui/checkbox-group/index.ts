import Root from "./checkbox-group.svelte";
import Label from "./checkbox-group-label.svelte";
import List from "./checkbox-group-list.svelte";
import Item from "./checkbox-group-item.svelte";
import Indicator from "./checkbox-group-indicator.svelte";
import Description from "./checkbox-group-description.svelte";
import Message from "./checkbox-group-message.svelte";

export type { CheckboxGroupProps, CheckboxGroupRootProps } from "./checkbox-group.svelte";
export type { CheckboxGroupLabelProps } from "./checkbox-group-label.svelte";
export type { CheckboxGroupListProps } from "./checkbox-group-list.svelte";
export type { CheckboxGroupItemProps } from "./checkbox-group-item.svelte";
export type { CheckboxGroupIndicatorProps } from "./checkbox-group-indicator.svelte";
export type { CheckboxGroupDescriptionProps } from "./checkbox-group-description.svelte";
export type { CheckboxGroupMessageProps } from "./checkbox-group-message.svelte";

export {
	CHECKBOX_GROUP_ORIENTATIONS,
	CheckboxGroupItemState,
	CheckboxGroupRootState,
	getCheckboxGroupContext,
	getCheckboxGroupItemContext,
	getDataState,
	setCheckboxGroupContext,
	setCheckboxGroupItemContext,
	toValidationMessage,
	type CheckboxGroupItemStateProps,
	type CheckboxGroupOrientation,
	type CheckboxGroupRootStateProps,
	type CheckboxGroupValidationResult,
} from "./checkbox-group.svelte.js";

export {
	Root,
	Label,
	List,
	Item,
	Indicator,
	Description,
	Message,
	//
	Root as CheckboxGroup,
	Label as CheckboxGroupLabel,
	List as CheckboxGroupList,
	Item as CheckboxGroupItem,
	Indicator as CheckboxGroupIndicator,
	Description as CheckboxGroupDescription,
	Message as CheckboxGroupMessage,
};
