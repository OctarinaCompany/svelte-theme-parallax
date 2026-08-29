import Root from "./conversation.svelte";
import Content from "./conversation-content.svelte";
import ScrollButton from "./conversation-scroll-button.svelte";
import EmptyState from "./conversation-empty-state.svelte";
import Download from "./conversation-download.svelte";

export type { ConversationProps, ConversationRootProps } from "./conversation.svelte";
export type { ConversationContentProps } from "./conversation-content.svelte";
export type { ConversationScrollButtonProps } from "./conversation-scroll-button.svelte";
export type { ConversationEmptyStateProps } from "./conversation-empty-state.svelte";
export type { ConversationDownloadProps } from "./conversation-download.svelte";

export {
	CONVERSATION_LIVE_MODES,
	ConversationState,
	conversationMessageText,
	formatConversationMessage,
	getConversationContext,
	hasConversationContext,
	messagesToMarkdown,
	resolveConversationLiveMode,
	setConversationContext,
	useConversation,
	type ConversationLiveMode,
	type ConversationMessage,
	type ConversationStateProps,
} from "./conversation.svelte.js";

export {
	Root,
	Content,
	ScrollButton,
	EmptyState,
	Download,
	//
	Root as Conversation,
	Content as ConversationContent,
	ScrollButton as ConversationScrollButton,
	EmptyState as ConversationEmptyState,
	Download as ConversationDownload,
};
