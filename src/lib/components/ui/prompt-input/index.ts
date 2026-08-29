import Root from "./prompt-input.svelte";
import Body from "./prompt-input-body.svelte";
import Textarea from "./prompt-input-textarea.svelte";
import Header from "./prompt-input-header.svelte";
import Footer from "./prompt-input-footer.svelte";
import Tools from "./prompt-input-tools.svelte";
import Button from "./prompt-input-button.svelte";
import Submit from "./prompt-input-submit.svelte";
import Select from "./prompt-input-select.svelte";
import SelectTrigger from "./prompt-input-select-trigger.svelte";
import SelectContent from "./prompt-input-select-content.svelte";
import SelectItem from "./prompt-input-select-item.svelte";
import Attachments from "./prompt-input-attachments.svelte";
import Attachment from "./prompt-input-attachment.svelte";
import ActionMenu from "./prompt-input-action-menu.svelte";
import ActionMenuTrigger from "./prompt-input-action-menu-trigger.svelte";
import ActionMenuContent from "./prompt-input-action-menu-content.svelte";
import ActionMenuItem from "./prompt-input-action-menu-item.svelte";
import ActionAddAttachments from "./prompt-input-action-add-attachments.svelte";

export type { PromptInputProps, PromptInputRootProps } from "./prompt-input.svelte";
export type { PromptInputBodyProps } from "./prompt-input-body.svelte";
export type { PromptInputTextareaProps } from "./prompt-input-textarea.svelte";
export type { PromptInputHeaderProps } from "./prompt-input-header.svelte";
export type { PromptInputFooterProps } from "./prompt-input-footer.svelte";
export type { PromptInputToolsProps } from "./prompt-input-tools.svelte";
export type { PromptInputButtonProps } from "./prompt-input-button.svelte";
export type { PromptInputSubmitProps } from "./prompt-input-submit.svelte";
export type { PromptInputSelectProps } from "./prompt-input-select.svelte";
export type { PromptInputSelectTriggerProps } from "./prompt-input-select-trigger.svelte";
export type { PromptInputSelectContentProps } from "./prompt-input-select-content.svelte";
export type { PromptInputSelectItemProps } from "./prompt-input-select-item.svelte";
export type { PromptInputAttachmentsProps } from "./prompt-input-attachments.svelte";
export type { PromptInputAttachmentProps } from "./prompt-input-attachment.svelte";
export type { PromptInputActionMenuProps } from "./prompt-input-action-menu.svelte";
export type { PromptInputActionMenuTriggerProps } from "./prompt-input-action-menu-trigger.svelte";
export type { PromptInputActionMenuContentProps } from "./prompt-input-action-menu-content.svelte";
export type { PromptInputActionMenuItemProps } from "./prompt-input-action-menu-item.svelte";
export type { PromptInputActionAddAttachmentsProps } from "./prompt-input-action-add-attachments.svelte";

export {
	getPromptInputContext,
	hasPromptInputContext,
	matchesPromptInputAccept,
	PROMPT_INPUT_ERROR_CODES,
	PROMPT_INPUT_TOOLTIP_SIDES,
	PromptInputAttachmentsState,
	PromptInputState,
	resolvePromptInputTooltip,
	resolvePromptInputTooltipSide,
	setPromptInputContext,
	usePromptInput,
	usePromptInputAttachments,
	type PromptInputAttachmentsStateProps,
	type PromptInputButtonTooltip,
	type PromptInputError,
	type PromptInputErrorCode,
	// The chip's DATA, not the part: `PromptInputAttachment` below is the component that draws one.
	type PromptInputFile,
	type PromptInputMessage,
	type PromptInputStateProps,
	type PromptInputTooltipSide,
	type ResolvedPromptInputTooltip,
} from "./prompt-input.svelte.js";

export {
	Root,
	Body,
	Textarea,
	Header,
	Footer,
	Tools,
	Button,
	Submit,
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	Attachments,
	Attachment,
	ActionMenu,
	ActionMenuTrigger,
	ActionMenuContent,
	ActionMenuItem,
	ActionAddAttachments,
	//
	Root as PromptInput,
	Body as PromptInputBody,
	Textarea as PromptInputTextarea,
	Header as PromptInputHeader,
	Footer as PromptInputFooter,
	Tools as PromptInputTools,
	Button as PromptInputButton,
	Submit as PromptInputSubmit,
	Select as PromptInputSelect,
	SelectTrigger as PromptInputSelectTrigger,
	SelectContent as PromptInputSelectContent,
	SelectItem as PromptInputSelectItem,
	Attachments as PromptInputAttachments,
	Attachment as PromptInputAttachment,
	ActionMenu as PromptInputActionMenu,
	ActionMenuTrigger as PromptInputActionMenuTrigger,
	ActionMenuContent as PromptInputActionMenuContent,
	ActionMenuItem as PromptInputActionMenuItem,
	ActionAddAttachments as PromptInputActionAddAttachments,
};
