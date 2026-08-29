import Root from "./message.svelte";
import Content from "./message-content.svelte";
import Response from "./message-response.svelte";
import Actions from "./message-actions.svelte";
import Action from "./message-action.svelte";
import Toolbar from "./message-toolbar.svelte";
import Branch from "./message-branch.svelte";
import BranchContent from "./message-branch-content.svelte";
import BranchSelector from "./message-branch-selector.svelte";
import BranchPrevious from "./message-branch-previous.svelte";
import BranchNext from "./message-branch-next.svelte";
import BranchPage from "./message-branch-page.svelte";

export type { MessageProps, MessageRootProps } from "./message.svelte";
export type { MessageContentProps } from "./message-content.svelte";
export type { MessageCodeToken, MessageResponseProps } from "./message-response.svelte";
export type { MessageActionsProps } from "./message-actions.svelte";
export type { MessageActionProps } from "./message-action.svelte";
export type { MessageToolbarProps } from "./message-toolbar.svelte";
export type { MessageBranchProps, MessageBranchRootProps } from "./message-branch.svelte";
export type { MessageBranchContentProps } from "./message-branch-content.svelte";
export type { MessageBranchSelectorProps } from "./message-branch-selector.svelte";
export type { MessageBranchPreviousProps } from "./message-branch-previous.svelte";
export type { MessageBranchNextProps } from "./message-branch-next.svelte";
export type { MessageBranchPageProps } from "./message-branch-page.svelte";

export {
	clampBranchIndex,
	getMessageBranchContext,
	getMessageContext,
	hasMessageBranchContext,
	hasMessageContext,
	mergeMessageResponseTheme,
	MESSAGE_RESPONSE_THEME,
	MessageBranchState,
	messageContentVariants,
	messageFenceFilename,
	messageFenceInfo,
	messageFenceLanguage,
	MessageState,
	messageVariants,
	resolveMessageRole,
	setMessageBranchContext,
	setMessageContext,
	useMessage,
	useMessageBranch,
	type MessageBranchStateProps,
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
	Branch,
	BranchContent,
	BranchSelector,
	BranchPrevious,
	BranchNext,
	BranchPage,
	//
	Root as Message,
	Content as MessageContent,
	Response as MessageResponse,
	Actions as MessageActions,
	Action as MessageAction,
	Toolbar as MessageToolbar,
	Branch as MessageBranch,
	BranchContent as MessageBranchContent,
	BranchSelector as MessageBranchSelector,
	BranchPrevious as MessageBranchPrevious,
	BranchNext as MessageBranchNext,
	BranchPage as MessageBranchPage,
};
