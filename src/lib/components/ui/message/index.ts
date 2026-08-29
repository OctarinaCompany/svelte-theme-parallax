import Root from "./message.svelte";
import Content from "./message-content.svelte";
import Response from "./message-response.svelte";
import Actions from "./message-actions.svelte";
import Action from "./message-action.svelte";
import Toolbar from "./message-toolbar.svelte";

export type { MessageProps, MessageRootProps } from "./message.svelte";
export type { MessageContentProps } from "./message-content.svelte";
export type { MessageCodeToken, MessageResponseProps } from "./message-response.svelte";
export type { MessageActionsProps } from "./message-actions.svelte";
export type { MessageActionProps } from "./message-action.svelte";
export type { MessageToolbarProps } from "./message-toolbar.svelte";

export {
	getMessageContext,
	hasMessageContext,
	mergeMessageResponseTheme,
	MESSAGE_FENCE_EXTENSIONS,
	MESSAGE_RESPONSE_THEME,
	messageContentVariants,
	messageFenceFilename,
	messageFenceInfo,
	messageFenceLanguage,
	MessageState,
	messageVariants,
	resolveMessageRole,
	setMessageContext,
	useMessage,
	type MessageResponseTheme,
	type MessageStateProps,
} from "./message.svelte.js";

export {
	Root,
	Content,
	Response,
	Actions,
	Action,
	Toolbar,
	//
	Root as Message,
	Content as MessageContent,
	Response as MessageResponse,
	Actions as MessageActions,
	Action as MessageAction,
	Toolbar as MessageToolbar,
};
