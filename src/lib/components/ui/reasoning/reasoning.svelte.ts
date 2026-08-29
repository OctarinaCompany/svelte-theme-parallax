import { getContext, hasContext, setContext } from "svelte";

/**
 * How long a panel that streamed stays open after the stream stops before it folds itself —
 * upstream's `AUTO_CLOSE_DELAY` (`reasoning.tsx`), exported so a transcript can time something
 * against it. The root's `autoCloseDelay` prop defaults to it.
 */
export const REASONING_AUTO_CLOSE_MS = 1000;

/** Milliseconds in a second, named so the duration arithmetic reads as what it is. */
const MS_IN_S = 1000;

/**
 * Reactive inputs for {@link ReasoningState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them — `isStreaming` flips at least twice in
 * the life of a reasoning part, and both flips have to be seen.
 */
export type ReasoningStateProps = {
	/** Whether the model is still writing this thought. */
	getIsStreaming: () => boolean;
	/** Whether the content is expanded. */
	getOpen: () => boolean;
	/** Expand or collapse the content, firing the root's `onOpenChange` on a real change. */
	setOpen: (open: boolean) => void;
	/**
	 * The caller's `defaultOpen`, as written. `false` is a VETO on auto-open; `undefined` and
	 * `true` are not — only the explicit `false` says "never open this on my behalf".
	 */
	getDefaultOpen: () => boolean | undefined;
	/** How long the thought took, in whole seconds, or `undefined` when nobody has measured it. */
	getDuration: () => number | undefined;
	/** Record a measured duration, firing the root's `onDurationChange` on a real change. */
	setDuration: (duration: number | undefined) => void;
	/** Milliseconds between the stream stopping and the panel folding itself. */
	getAutoCloseDelay: () => number;
};

/**
 * One instance per `<Reasoning.Root>`. Published on context; the trigger and the content read it.
 *
 * WHAT IT OWNS is the three behaviours upstream spreads over three `useEffect`s
 * (`reasoning.tsx`): open the panel when streaming begins, measure how long the stream ran, and
 * fold the panel a moment after it ends. They are one method here, {@link ReasoningState.sync},
 * because they are one story — a stream starts, runs, stops — and the bookkeeping they share
 * (the start timestamp, the "has ever streamed" flag, the close timer) is easier to keep honest
 * in one place than across three closures and two refs.
 *
 * THE COMMUNITY SVELTE PORT RE-CALLS `setContext` FROM A WATCHER so that its parts see fresh
 * values. That is a misreading of context: `setContext` is init-time only, and calling it again
 * later either throws or silently registers nothing the parts can see. Here the context value is
 * this ONE object, and its fields are `$derived` over getters, so a part that reads
 * `reasoning.isStreaming` is reading the root's live prop. Nothing is ever re-set.
 *
 * TWO GUARDS UPSTREAM DOES NOT HAVE:
 *
 * 1. THE USER WINS. Upstream's auto-close effect re-arms whenever `isOpen` flips back to `true`
 *    before `hasAutoClosed` is set, so a reader who closes the panel in the one-second window and
 *    reopens it is folded shut a second later, and a reader who OPENS a panel that streamed while
 *    vetoed (`defaultOpen={false}`) sees it close on them. A toggle the trigger fires marks the
 *    instance as touched ({@link ReasoningState.noteUserToggle}); a touched panel is never
 *    auto-closed. Auto-OPEN is still honoured once after a touch — a reader who folded an idle
 *    panel still wants to see the model start thinking — but only ONCE per stream, on the flag's
 *    rising edge. Upstream's auto-open effect also depends on `isOpen`, so a reader who collapses
 *    the panel while the model is still writing is reopened on the next render; here the
 *    collapse sticks until the next stream begins.
 *
 * 2. THE TIMER IS CANCELLED WHEN STREAMING RESUMES. A part that streams twice — a retried turn,
 *    a provider that emits reasoning in two bursts — reopens on the second burst; upstream's
 *    pending timer from the first burst would then fold it mid-stream. The effect cleanup upstream
 *    relies on only fires when `isStreaming` changes, which it does, so upstream is actually safe
 *    here by accident; the cancellation is explicit so it stays safe on purpose.
 *
 * AUTO-CLOSE FIRES AT MOST ONCE PER INSTANCE, as upstream. A transcript that keys each reasoning
 * part by its message id gets a fresh instance per thought, which is the granularity the rule
 * wants; a caller that recycles one instance across thoughts gets one auto-close and then a panel
 * that stays where the reader left it, which is the safer of the two mistakes.
 */
export class ReasoningState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: ReasoningStateProps;

	readonly isStreaming: boolean = $derived(this.#props.getIsStreaming());
	readonly open: boolean = $derived(this.#props.getOpen());
	readonly duration: number | undefined = $derived(this.#props.getDuration());
	readonly autoCloseDelay: number = $derived(this.#props.getAutoCloseDelay());

	/**
	 * Whether the caller wrote `defaultOpen={false}` — the one value that vetoes auto-open. An
	 * absent `defaultOpen` means "open when streaming starts", which is upstream's
	 * `defaultOpen ?? isStreaming`.
	 */
	readonly explicitlyClosed: boolean = $derived(this.#props.getDefaultOpen() === false);

	/**
	 * Whether this instance has ever seen `isStreaming` true. Auto-close is gated on it so a
	 * panel rendered for a FINISHED thought — a transcript replayed from storage — never folds
	 * itself: it never streamed, so there is no "moment after the stream" to fold at.
	 *
	 * Seeded from the initial `isStreaming` in the constructor, as upstream seeds its ref, so a
	 * part mounted mid-stream counts as having streamed.
	 */
	hasStreamed: boolean = $state(false);

	/**
	 * Whether the close timer is armed — the panel will fold at the end of `autoCloseDelay` unless
	 * the reader toggles it or the stream resumes first. The root stamps it as `data-pending-close`,
	 * which is the one place the window is observable from outside: a stylesheet can mark a panel
	 * about to fold, and a test can wait on the attribute instead of on the clock.
	 */
	pendingClose: boolean = $state(false);

	/** Whether the reader has toggled the panel by hand. A touched panel is never auto-closed. */
	userToggled: boolean = $state(false);

	/** Set once the panel has folded itself; it never does so a second time. */
	#autoClosed = false;

	/** When the current stream began, or `null` between streams. */
	#startedAt: number | null = null;

	#closeTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(props: ReasoningStateProps) {
		this.#props = props;
		this.hasStreamed = props.getIsStreaming();
	}

	/**
	 * The text the trigger prints when the caller gives it nothing better.
	 *
	 * `undefined` and a non-positive duration both read as "a few seconds": `Math.ceil` makes a
	 * measured duration at least 1, so a zero can only arrive from a caller, and a finished thought
	 * that reads "Thought for 0 seconds" is wrong in a way "a few seconds" is not. Upstream shows
	 * the shimmer for `duration === 0` (`reasoning.tsx`), which leaves a finished part looking
	 * unfinished; a thought that has stopped never reads as still thinking here.
	 *
	 * The streaming label is NOT here: it is a `TextGradient`, an element, and the trigger owns
	 * it. This is only ever the resting text.
	 */
	readonly restingLabel: string = $derived.by(() => {
		const duration = this.duration;
		if (duration === undefined || duration <= 0) return "Thought for a few seconds";
		return duration === 1 ? "Thought for 1 second" : `Thought for ${duration} seconds`;
	});

	/**
	 * Apply the streaming flag. The root calls this from an effect keyed on `isStreaming` alone,
	 * with everything else untracked, so it runs exactly on the flag's edges: the start of a
	 * stream opens the panel and stamps the clock; the end reads the clock into `duration` and
	 * arms the close timer. Calling it twice with the same value is harmless — every branch is
	 * guarded on the bookkeeping, not on the argument.
	 */
	sync(streaming: boolean): void {
		if (streaming) {
			this.hasStreamed = true;
			this.#clearCloseTimer();
			if (this.#startedAt === null) this.#startedAt = Date.now();
			if (!this.open && !this.explicitlyClosed) this.#props.setOpen(true);
			return;
		}

		if (this.#startedAt !== null) {
			this.#props.setDuration(Math.ceil((Date.now() - this.#startedAt) / MS_IN_S));
			this.#startedAt = null;
		}

		this.#armAutoClose();
	}

	/**
	 * Record that the trigger — a person — flipped the panel. Called by the root from the
	 * primitive's `onOpenChange`, which Bits UI fires only from its own setter and never for a
	 * write through the binding, so a programmatic open is never mistaken for a reader's.
	 *
	 * Cancels a pending auto-close outright: a reader who reached for the panel inside the window
	 * has said what they want it to do.
	 */
	noteUserToggle(): void {
		this.userToggled = true;
		this.#clearCloseTimer();
	}

	/**
	 * Clear the close timer. The root calls this from `onDestroy`; a timer that outlives its
	 * component would write to a bindable nobody is listening to.
	 */
	destroy(): void {
		this.#clearCloseTimer();
	}

	#armAutoClose(): void {
		if (!this.hasStreamed || this.#autoClosed || this.userToggled || !this.open) return;
		this.#clearCloseTimer();
		this.pendingClose = true;
		this.#closeTimer = setTimeout(() => {
			this.#closeTimer = undefined;
			this.pendingClose = false;
			// Re-checked at fire time: a reader may have folded the panel or resumed streaming
			// inside the window without touching the timer.
			if (this.userToggled || this.isStreaming || !this.open) return;
			this.#autoClosed = true;
			this.#props.setOpen(false);
		}, this.autoCloseDelay);
	}

	#clearCloseTimer(): void {
		if (this.#closeTimer === undefined) return;
		clearTimeout(this.#closeTimer);
		this.#closeTimer = undefined;
		this.pendingClose = false;
	}
}

const REASONING_CONTEXT_KEY = Symbol("reasoning");

export function setReasoningContext(state: ReasoningState): ReasoningState {
	return setContext(REASONING_CONTEXT_KEY, state);
}

export function hasReasoningContext(): boolean {
	return hasContext(REASONING_CONTEXT_KEY);
}

export function getReasoningContext(part?: string): ReasoningState {
	if (!hasReasoningContext()) {
		throw new Error(`${part ?? "`<Reasoning>` part"} must be used within \`<Reasoning.Root>\`.`);
	}
	return getContext<ReasoningState>(REASONING_CONTEXT_KEY);
}

/** Parity name for the selector-hook shape the other ports expose. Delegates to the getter. */
export function useReasoning(): ReasoningState {
	return getReasoningContext();
}
