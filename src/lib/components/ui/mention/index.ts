import Root from "./mention.svelte";
import Label from "./mention-label.svelte";
import Input from "./mention-input.svelte";
import Portal from "./mention-portal.svelte";
import Content from "./mention-content.svelte";
import Item from "./mention-item.svelte";

export type { MentionProps, MentionRootProps } from "./mention.svelte";
export type { MentionLabelProps } from "./mention-label.svelte";
export type { MentionInputChildProps, MentionInputProps } from "./mention-input.svelte";
export type { MentionPortalProps } from "./mention-portal.svelte";
export type { MentionAlign, MentionContentProps, MentionSide } from "./mention-content.svelte";
export type { MentionItemProps } from "./mention-item.svelte";

export {
	MentionCollection,
	MentionRootState,
	getMentionContext,
	setMentionContext,
	type MentionHighlightDirection,
	type MentionItemData,
	type MentionMountedItem,
	type MentionRootStateProps,
} from "./mention.svelte.js";

export {
	addMentionSpan,
	createCaretAnchor,
	getCaretRect,
	getLineHeight,
	measureTextWidth,
	removeMentionSpans,
	resolveMentionTrigger,
	shiftMentionSpans,
	type CaretAnchor,
	type MentionField,
	type MentionSpan,
	type TriggerMatch,
} from "./mention-caret.js";

export {
	Root,
	Label,
	Input,
	Portal,
	Content,
	Item,
	//
	Root as Mention,
	Label as MentionLabel,
	Input as MentionInput,
	Portal as MentionPortal,
	Content as MentionContent,
	Item as MentionItem,
};
