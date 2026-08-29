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

export {
	getPromptInputContext,
	hasPromptInputContext,
	PROMPT_INPUT_TOOLTIP_SIDES,
	PromptInputState,
	resolvePromptInputTooltip,
	resolvePromptInputTooltipSide,
	setPromptInputContext,
	usePromptInput,
	type PromptInputButtonTooltip,
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
};
