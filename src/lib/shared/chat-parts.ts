/**
 * The vocabulary a chat surface shares — statuses, roles, tool states — as plain structural types.
 *
 * WHY THESE ARE NOT IMPORTED FROM `ai`. The AI SDK publishes `ChatStatus`, `UIMessage` and
 * `ToolUIPart`, and every type below mirrors one of them, so importing would be the obvious move.
 * It is the wrong one HERE: `tools/registry/import-graph.mjs` walks a component's imports to build
 * its registry item and matches `import type` as well, so a single type import would pin `ai` onto
 * `parallax-message`, `parallax-tool` and `parallax-confirmation` — a runtime dependency, in every
 * project that installs one of them, for three string unions and an object shape. A dashboard
 * rendering a transcript its own backend produced would install the whole SDK to do it. Structural
 * types cost nothing and unify by shape: a `ToolUIPart["state"]` from the SDK is assignable to
 * {@link ToolPartState} and back.
 *
 * THE COST, stated rather than hidden: a state the SDK adds later is a state this file does not
 * know about, and the compiler will not say so. The tuples below are the kit's own declaration of
 * what it renders, and a component that meets an unknown value degrades rather than throws — see
 * {@link toolStateVariant}.
 *
 * Lives in `src/lib/shared/` (the registry:lib pattern) because three folders need it: `ui/tool`,
 * `ui/confirmation` and `ui/prompt-input`. `docs/CONVENTIONS.md` §2 is the rule.
 */

/**
 * What a chat is doing, as `PromptInput.Submit` reads it.
 *
 * `submitted` is "sent, nothing back yet" and `streaming` is "tokens arriving". Both are
 * generating, and the submit button turns into a stop button for both.
 */
export const CHAT_STATUSES = ["submitted", "streaming", "ready", "error"] as const;

export type ChatStatus = (typeof CHAT_STATUSES)[number];

/** Whether a status means a turn is in flight — the one predicate two components share. */
export function isChatGenerating(status: ChatStatus): boolean {
	return status === "submitted" || status === "streaming";
}

/** Who authored a turn. `Message.Root` stamps it as `data-from` and styles the bubble from it. */
export const MESSAGE_ROLES = ["user", "assistant", "system"] as const;

export type MessageRole = (typeof MESSAGE_ROLES)[number];

/**
 * Where a tool call is in its life, in the order it travels.
 *
 * The first two are the model writing the call, the middle two a human deciding whether it may
 * run, and the last three the outcome. `ui/tool` renders all seven; `ui/confirmation` gates on the
 * approval trio.
 */
export const TOOL_PART_STATES = [
	"input-streaming",
	"input-available",
	"approval-requested",
	"approval-responded",
	"output-available",
	"output-denied",
	"output-error",
] as const;

export type ToolPartState = (typeof TOOL_PART_STATES)[number];

/** The badge text for each state. */
export const TOOL_STATE_LABELS: Record<ToolPartState, string> = {
	"input-streaming": "Pending",
	"input-available": "Running",
	"approval-requested": "Awaiting approval",
	"approval-responded": "Responded",
	"output-available": "Completed",
	"output-denied": "Denied",
	"output-error": "Error",
};

/**
 * A decision about one tool call, as `ui/confirmation` reads it.
 *
 * `approved` is undefined while the question is open — the three-way distinction the component
 * gates on, and the reason this is not a boolean.
 */
export type ToolApproval = {
	id: string;
	approved?: boolean;
	reason?: string;
	/** Opaque to the UI; carried so a caller can echo the decision back untouched. */
	signature?: string;
};

/**
 * Which `Status` family a tool state wears.
 *
 * The mapping is the status vocabulary of `docs/CONVENTIONS.md` §3 read against the seven states:
 * work in progress is `info`, a settled success is `success`, an error is `destructive`, and both
 * "somebody has to decide" states are `warning` because they are the ones asking for a human. An
 * unknown value — the cost this module accepts by not importing the SDK's union — falls back to
 * `default` rather than throwing, so a newer SDK renders a neutral badge instead of a blank page.
 */
export function toolStateVariant(
	state: ToolPartState,
): "default" | "success" | "destructive" | "warning" | "info" {
	switch (state) {
		case "input-available":
		case "approval-responded":
			return "info";
		case "approval-requested":
		case "output-denied":
			return "warning";
		case "output-available":
			return "success";
		case "output-error":
			return "destructive";
		default:
			return "default";
	}
}

/** Whether a state should pulse — a call that is running, rather than one waiting on a human. */
export function isToolStateActive(state: ToolPartState): boolean {
	return state === "input-streaming" || state === "input-available";
}

/**
 * The tool's own name, from the part `type` the SDK stamps.
 *
 * A typed tool arrives as `` `tool-${name}` `` and a dynamic one as the literal `"dynamic-tool"`
 * with its name in a sibling field, so both shapes are read here rather than at four call sites.
 * The fallback is the raw type: a name a reader can look up beats "Unknown tool".
 */
export function toolNameOf(type: string, toolName?: string): string {
	if (type === "dynamic-tool") return toolName ?? "Tool";
	return type.startsWith("tool-") ? type.slice("tool-".length) : type;
}
