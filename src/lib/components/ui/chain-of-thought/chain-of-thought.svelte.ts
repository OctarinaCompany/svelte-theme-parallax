import { getContext, hasContext, setContext } from "svelte";
import { tv } from "tailwind-variants";

/**
 * Every value a step's `status` accepts, in upstream declaration order.
 *
 * `complete` comes first because it is the default: upstream's `ChainOfThoughtStep` defaults to
 * `"complete"` on the reasoning that a trace is mostly read after the fact, when every step is
 * done — a caller only names a status for the one step that is still running and the ones that
 * have not started.
 */
export const CHAIN_OF_THOUGHT_STEP_STATUSES = ["complete", "active", "pending"] as const;

/** Where a step is in the model's work: done, running, or not started. */
export type ChainOfThoughtStepStatus = (typeof CHAIN_OF_THOUGHT_STEP_STATUSES)[number];

/**
 * Normalise a possibly untyped runtime value to a known status.
 * Anything outside {@link CHAIN_OF_THOUGHT_STEP_STATUSES} falls back to `"complete"`.
 */
export function resolveChainOfThoughtStepStatus(value?: string): ChainOfThoughtStepStatus {
	return CHAIN_OF_THOUGHT_STEP_STATUSES.includes(value as ChainOfThoughtStepStatus)
		? (value as ChainOfThoughtStepStatus)
		: "complete";
}

/**
 * THE SINGLE SOURCE OF TRUTH for what a step paints. The three inks are upstream's
 * `stepStatusStyles` verbatim — the active step in the page's own ink, the finished ones in the
 * muted ink, the pending ones at half strength — and the ramp is deliberately type-only: no
 * status colour, no ground. A trace is read as one paragraph of work, and a step that changed
 * colour when it finished would turn the paragraph into a status board.
 *
 * `group/step` names the step so its connector (a child) can hide itself on the last step
 * through `group-last/step:hidden`. A `[&>*:last-child]` rule on the content would do the same
 * job — Tailwind compiles both to a `:last-child` test on the step — but this one lives on the
 * step, where the connector lives, so the connector's own class string states its condition
 * instead of the parent having to know about it. The constraint is the same either way: the
 * step must be the last ELEMENT child of its container (Svelte's `{#each}` emits only comment
 * anchors, which `:last-child` ignores, so a keyed list is fine), and a caller who wraps each
 * step in its own element gets a hanging tail on the last one.
 *
 * The entrance is `motion-safe:` gated rather than read through
 * `$lib/shared/reduced-motion.svelte.js`: the reader exists for motion DRIVEN from script (the
 * status dot's ping has to be switched off as a prop). A keyframe applied by a class needs no
 * script at all, and the media variant is exactly the switch, with no listener to attach.
 * There is NO stagger: the steps of a live trace arrive one at a time as the model works, so
 * each one plays its own entrance on mount and a delay would only postpone the one that just
 * arrived.
 */
export const chainOfThoughtStepVariants = tv({
	base: "group/step relative flex gap-2 text-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2",
	variants: {
		status: {
			complete: "text-muted-foreground",
			active: "text-foreground",
			pending: "text-muted-foreground/50",
		},
	},
	defaultVariants: {
		status: "complete",
	},
});

/**
 * Reactive inputs for {@link ChainOfThoughtState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them.
 */
export type ChainOfThoughtStateProps = {
	/** Whether the trace is expanded. */
	getOpen: () => boolean;
	/** Expand or collapse the trace; the root fires `onOpenChange` only when this is a change. */
	setOpen: (open: boolean) => void;
};

/**
 * One instance per `<ChainOfThought.Root>`. Published on context; the header reads it for the
 * chevron, and a custom part can drive the disclosure through {@link ChainOfThoughtState.setOpen}
 * without reaching for the trigger.
 *
 * The disclosure itself — `aria-expanded`, `aria-controls`, the trigger's keyboard contract — is
 * Bits UI's `Collapsible`, mounted once by the root. This class is the caller-facing mirror of
 * that state, not a second copy of it: `open` is the root's bindable, read through a getter.
 */
export class ChainOfThoughtState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: ChainOfThoughtStateProps;

	/** Whether the trace is expanded. */
	readonly open: boolean = $derived(this.#props.getOpen());

	constructor(props: ChainOfThoughtStateProps) {
		this.#props = props;
	}

	/** Expand or collapse the trace. A write equal to the current value is a no-op. */
	setOpen(open: boolean): void {
		this.#props.setOpen(open);
	}

	/** Flip the disclosure. */
	toggle(): void {
		this.setOpen(!this.open);
	}
}

const CHAIN_OF_THOUGHT_CONTEXT_KEY = Symbol("chain-of-thought");

export function setChainOfThoughtContext(state: ChainOfThoughtState): ChainOfThoughtState {
	return setContext(CHAIN_OF_THOUGHT_CONTEXT_KEY, state);
}

export function hasChainOfThoughtContext(): boolean {
	return hasContext(CHAIN_OF_THOUGHT_CONTEXT_KEY);
}

export function getChainOfThoughtContext(part?: string): ChainOfThoughtState {
	if (!hasChainOfThoughtContext()) {
		throw new Error(
			`${part ?? "`<ChainOfThought>` part"} must be used within \`<ChainOfThought.Root>\`.`,
		);
	}
	return getContext<ChainOfThoughtState>(CHAIN_OF_THOUGHT_CONTEXT_KEY);
}

/** Parity name for upstream's `useChainOfThought` hook. Delegates to the getter. */
export function useChainOfThought(): ChainOfThoughtState {
	return getChainOfThoughtContext();
}
