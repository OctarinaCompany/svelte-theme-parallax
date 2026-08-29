import Root from "./reasoning.svelte";
import Trigger from "./reasoning-trigger.svelte";
import Content from "./reasoning-content.svelte";

export type { ReasoningProps, ReasoningRootProps } from "./reasoning.svelte";
export type { ReasoningTriggerProps } from "./reasoning-trigger.svelte";
export type { ReasoningContentProps } from "./reasoning-content.svelte";

export {
	getReasoningContext,
	hasReasoningContext,
	REASONING_AUTO_CLOSE_MS,
	ReasoningState,
	setReasoningContext,
	useReasoning,
	type ReasoningStateProps,
} from "./reasoning.svelte.js";

export {
	Root,
	Trigger,
	Content,
	//
	Root as Reasoning,
	Trigger as ReasoningTrigger,
	Content as ReasoningContent,
};
