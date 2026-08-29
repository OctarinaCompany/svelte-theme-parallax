import { getContext, hasContext, setContext } from "svelte";
import type { AlertVariant } from "$lib/components/ui/alert/index.js";
import type { ToolApproval, ToolPartState } from "$lib/shared/chat-parts.js";

/**
 * The three answers a confirmation can be showing, in the order a tool call reaches them: the
 * question is open, the human said yes, the human said no.
 *
 * Upstream has no such value. Its three gated parts each re-derive their own visibility from the
 * raw `(approval, state)` pair (`confirmation.tsx`, `ConfirmationRequest` / `Accepted` /
 * `Rejected`), and the root paints nothing from them at all. Naming the phase once means the root
 * can colour itself from it, stamp it as `data-phase`, and the three parts cannot drift apart —
 * two of them showing at once is impossible by construction rather than by the care of three
 * separate conditions.
 */
export const CONFIRMATION_PHASES = ["request", "accepted", "rejected"] as const;

export type ConfirmationPhase = (typeof CONFIRMATION_PHASES)[number];

/**
 * Normalise a possibly untyped runtime value to a known phase, or `undefined` when it names none.
 * There is no default phase: "none of the three" is a real answer (see
 * {@link resolveConfirmationPhase}), so unlike `resolveStatusVariant` this cannot fall back.
 */
export function resolveConfirmationPhaseValue(value?: string): ConfirmationPhase | undefined {
	return CONFIRMATION_PHASES.includes(value as ConfirmationPhase)
		? (value as ConfirmationPhase)
		: undefined;
}

/**
 * Whether the root renders at all — upstream's early `return null`
 * (`confirmation.tsx`, `Confirmation`): nothing without an approval object, and nothing while
 * the model is still writing the call or the call is already running unasked.
 */
export function isConfirmationVisible(
	approval: ToolApproval | undefined,
	state: ToolPartState,
): boolean {
	if (!approval) return false;
	return state !== "input-streaming" && state !== "input-available";
}

/**
 * Which phase the pair is in, or `undefined` when it is in none.
 *
 * READ AGAINST UPSTREAM, this is narrower on purpose. Upstream's `ConfirmationAccepted` shows for
 * a truthy `approved` in ANY of the three settled states — including `output-denied` — and
 * `ConfirmationRejected` likewise accepts `output-available`. Neither pairing can be produced by
 * the SDK: a denied output follows a `false`, an available output follows a `true`. Here each
 * answer is paired only with the outcomes it can actually precede, so a contradictory pair — a
 * hand-built transcript, a bug upstream of this component — renders the title alone instead of
 * asserting an answer the outcome disagrees with.
 *
 * `approval-responded` is the moment between the human answering and the tool acting on it, and
 * it carries either answer. `output-error` carries neither: an error after an approval is the
 * tool's story to tell, and the confirmation says nothing beyond its title, as upstream's does.
 *
 * `request` needs `approved` to still be `undefined`: an approval that already carries an answer
 * while the state still says `approval-requested` is a transcript mid-update, and showing the
 * buttons for a decision already taken invites a second click.
 */
export function resolveConfirmationPhase(
	approval: ToolApproval | undefined,
	state: ToolPartState,
): ConfirmationPhase | undefined {
	if (!approval) return undefined;
	if (state === "approval-requested") {
		return approval.approved === undefined ? "request" : undefined;
	}
	if (approval.approved === true) {
		return state === "approval-responded" || state === "output-available" ? "accepted" : undefined;
	}
	if (approval.approved === false) {
		return state === "approval-responded" || state === "output-denied" ? "rejected" : undefined;
	}
	return undefined;
}

/**
 * The `Alert` face each phase wears, and the reason the root has a `variant` prop at all.
 *
 * Upstream's confirmation is a plain `Alert` in every phase — the only thing that changes is which
 * children show, so an approved call and a refused one are the same card with a different word in
 * it. The kit has the soft status family (`alert.svelte`, `success-subtle` /
 * `destructive-subtle`), so a settled answer is painted as one. An open question stays on the
 * card ground: it is a prompt, not a status, and the buttons are what mark it as pending.
 */
export const CONFIRMATION_PHASE_VARIANTS: Record<ConfirmationPhase, AlertVariant> = {
	request: "default",
	accepted: "success-subtle",
	rejected: "destructive-subtle",
};

/** The variant for a phase; `default` when there is none. */
export function confirmationPhaseVariant(phase: ConfirmationPhase | undefined): AlertVariant {
	return phase ? CONFIRMATION_PHASE_VARIANTS[phase] : "default";
}

/**
 * Reactive inputs for {@link ConfirmationState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them.
 *
 * This is the whole reason for the class. A context that stored `{ approval, state }` as plain
 * values would have to be re-published when they change, and it cannot be: `setContext` may only
 * be called during component initialisation (Svelte docs, `svelte` → `setContext`). Getters read
 * the live props on every access, so the context is published once and never goes stale.
 */
export type ConfirmationStateProps = {
	/** The tool part's state, as the SDK stamps it. */
	getState: () => ToolPartState;
	/** The decision object, or `undefined` while the call needs none. */
	getApproval: () => ToolApproval | undefined;
};

/**
 * One instance per `<Confirmation.Root>`. Published on context; every gated part reads it.
 */
export class ConfirmationState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: ConfirmationStateProps;

	readonly state: ToolPartState = $derived(this.#props.getState());
	readonly approval: ToolApproval | undefined = $derived(this.#props.getApproval());

	/** Whether the root renders anything. */
	readonly visible: boolean = $derived(isConfirmationVisible(this.approval, this.state));

	/** The phase on screen, or `undefined` when the pair is in none. */
	readonly phase: ConfirmationPhase | undefined = $derived(
		resolveConfirmationPhase(this.approval, this.state),
	);

	/** The `Alert` variant the phase implies — before the root's own `variant` override. */
	readonly variant: AlertVariant = $derived(confirmationPhaseVariant(this.phase));

	constructor(props: ConfirmationStateProps) {
		this.#props = props;
	}

	/** Whether a gated part should render its children. */
	is(phase: ConfirmationPhase): boolean {
		return this.phase === phase;
	}
}

const CONFIRMATION_CONTEXT_KEY = Symbol("confirmation");

export function setConfirmationContext(state: ConfirmationState): ConfirmationState {
	return setContext(CONFIRMATION_CONTEXT_KEY, state);
}

export function hasConfirmationContext(): boolean {
	return hasContext(CONFIRMATION_CONTEXT_KEY);
}

export function getConfirmationContext(part?: string): ConfirmationState {
	if (!hasConfirmationContext()) {
		throw new Error(
			`${part ?? "`<Confirmation>` part"} must be used within \`<Confirmation.Root>\`.`,
		);
	}
	return getContext<ConfirmationState>(CONFIRMATION_CONTEXT_KEY);
}

/** Parity name for upstream's `useConfirmation` hook. Delegates to the getter. */
export function useConfirmation(): ConfirmationState {
	return getConfirmationContext();
}
