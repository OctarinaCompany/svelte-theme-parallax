import { getContext, hasContext, setContext } from "svelte";
import type { StatusVariant } from "$lib/components/ui/status/index.js";
import {
	isToolStateActive,
	TOOL_STATE_LABELS,
	toolNameOf,
	toolStateVariant,
	type ToolPartState,
} from "$lib/shared/chat-parts.js";

/**
 * Reactive inputs for {@link ToolState}. Getters rather than values, so the class keeps tracking
 * the root's props instead of snapshotting them — a tool part changes state five or six times
 * during one call, and the header has to follow every step.
 */
export type ToolStateProps = {
	/** The part `type` the SDK stamps: `"dynamic-tool"` or `` `tool-${name}` ``. */
	getType: () => string;
	/** Where the call is in its life. */
	getState: () => ToolPartState;
	/** The name a dynamic part carries beside its `type`; `undefined` for a typed part. */
	getToolName: () => string | undefined;
	/** A caption that replaces the derived name when the caller has a better one. */
	getTitle: () => string | undefined;
	/** Whether the content is expanded. */
	getOpen: () => boolean;
	/** Expand or collapse the content, firing the root's `onOpenChange` on a real change. */
	setOpen: (open: boolean) => void;
};

/**
 * One instance per `<Tool.Root>`. Published on context; the header reads it.
 *
 * THE IDENTITY LIVES ON THE ROOT, NOT ON THE HEADER. Upstream's `Tool` is a bare `Collapsible`
 * and `ToolHeader` takes `type`, `state` and `toolName` itself (`tool.tsx:35-45`), which leaves
 * the root knowing nothing about the call it wraps: it cannot stamp the state as a data attribute,
 * and a second part that wants the name — a custom header, an output caption — has to be handed
 * the same three props again. Here the root owns them and derives the two things every part
 * needs, {@link ToolState.name} and {@link ToolState.variant}, once.
 */
export class ToolState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: ToolStateProps;

	readonly type: string = $derived(this.#props.getType());
	readonly state: ToolPartState = $derived(this.#props.getState());
	readonly toolName: string | undefined = $derived(this.#props.getToolName());
	readonly title: string | undefined = $derived(this.#props.getTitle());
	readonly open: boolean = $derived(this.#props.getOpen());

	/**
	 * The name read off the part, with the two part shapes resolved by the shared `toolNameOf`
	 * rather than by a `split("-")` repeated per call site. This is what `data-tool-name` stamps:
	 * machine identity, never the caption, so a selector keyed on the tool keeps matching when a
	 * caller passes a `title`.
	 */
	readonly identity: string = $derived(toolNameOf(this.type, this.toolName));

	/**
	 * What the header prints: the caller's `title`, else {@link ToolState.identity} — upstream's
	 * `title ?? derivedName` (`tool.tsx:82-83, 95`).
	 */
	readonly name: string = $derived(this.title ?? this.identity);

	/**
	 * Which `Status` family the state wears. Upstream paints each state with a raw palette colour
	 * on a Lucide glyph (`tool.tsx:57-65`); the mapping to the house status vocabulary is written
	 * once, in `src/lib/shared/chat-parts.ts`, and read here.
	 */
	readonly variant: StatusVariant = $derived(toolStateVariant(this.state));

	/** Whether the status dot pulses — a call that is running, not one waiting on a human. */
	readonly active: boolean = $derived(isToolStateActive(this.state));

	/**
	 * The badge text. A state the tuple does not know — the cost `chat-parts.ts` accepts by not
	 * importing the SDK's union — prints as itself rather than as `undefined`.
	 */
	readonly label: string = $derived(TOOL_STATE_LABELS[this.state] ?? this.state);

	constructor(props: ToolStateProps) {
		this.#props = props;
	}

	/** Expand or collapse the content. A write that changes nothing fires no callback. */
	setOpen(open: boolean): void {
		this.#props.setOpen(open);
	}

	/** Flip the content. */
	toggle(): void {
		this.#props.setOpen(!this.open);
	}
}

const TOOL_CONTEXT_KEY = Symbol("tool");

export function setToolContext(state: ToolState): ToolState {
	return setContext(TOOL_CONTEXT_KEY, state);
}

export function hasToolContext(): boolean {
	return hasContext(TOOL_CONTEXT_KEY);
}

export function getToolContext(part?: string): ToolState {
	if (!hasToolContext()) {
		throw new Error(`${part ?? "`<Tool>` part"} must be used within \`<Tool.Root>\`.`);
	}
	return getContext<ToolState>(TOOL_CONTEXT_KEY);
}

/** Parity name for the selector-hook shape the other ports expose. Delegates to the getter. */
export function useTool(): ToolState {
	return getToolContext();
}
