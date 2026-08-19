import Root from "./editable.svelte";
import Label from "./editable-label.svelte";
import Area from "./editable-area.svelte";
import Preview from "./editable-preview.svelte";
import Input from "./editable-input.svelte";
import Trigger from "./editable-trigger.svelte";
import Toolbar from "./editable-toolbar.svelte";
import Cancel from "./editable-cancel.svelte";
import Submit from "./editable-submit.svelte";

export type { EditableProps, EditableRootProps } from "./editable.svelte";
export type { EditableLabelChildProps, EditableLabelProps } from "./editable-label.svelte";
export type { EditableAreaChildProps, EditableAreaProps } from "./editable-area.svelte";
export type { EditablePreviewChildProps, EditablePreviewProps } from "./editable-preview.svelte";
export type { EditableInputChildProps, EditableInputProps } from "./editable-input.svelte";
export type { EditableTriggerChildProps, EditableTriggerProps } from "./editable-trigger.svelte";
export type {
	EditableToolbarChildProps,
	EditableToolbarOrientation,
	EditableToolbarProps,
} from "./editable-toolbar.svelte";
export type { EditableCancelChildProps, EditableCancelProps } from "./editable-cancel.svelte";
export type { EditableSubmitChildProps, EditableSubmitProps } from "./editable-submit.svelte";

export {
	EditableRootState,
	getEditableContext,
	setEditableContext,
	type EditableRootStateProps,
	type EditableTriggerMode,
} from "./editable.svelte.js";

export {
	Root,
	Label,
	Area,
	Preview,
	Input,
	Trigger,
	Toolbar,
	Cancel,
	Submit,
	//
	Root as Editable,
	Label as EditableLabel,
	Area as EditableArea,
	Preview as EditablePreview,
	Input as EditableInput,
	Trigger as EditableTrigger,
	Toolbar as EditableToolbar,
	Cancel as EditableCancel,
	Submit as EditableSubmit,
};
