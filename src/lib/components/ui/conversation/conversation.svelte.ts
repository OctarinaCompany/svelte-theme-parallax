import { getContext, hasContext, setContext } from "svelte";
import type { MessageRole } from "$lib/shared/chat-parts.js";
import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";
import { computeAxisOverflow, readScrollMetrics } from "$lib/shared/scroll-position.svelte.js";

/**
 * What the viewport announces to assistive technology.
 *
 * `role="log"` carries an implicit `aria-live="polite"`, and `Conversation.Root` OVERRIDES it to
 * `off` by default. A chat transcript that streams a reply token by token would otherwise announce
 * every token as it lands — a screen reader reads a live region's additions as they happen, and
 * sixty additions a second of one word each is noise, not a message. `polite` is there for a log
 * that appends whole messages at a time, which is what the role was designed for.
 */
export const CONVERSATION_LIVE_MODES = ["off", "polite"] as const;

export type ConversationLiveMode = (typeof CONVERSATION_LIVE_MODES)[number];

/**
 * Normalise a possibly untyped runtime value to a known live mode.
 * Anything outside {@link CONVERSATION_LIVE_MODES} falls back to `"off"`.
 */
export function resolveConversationLiveMode(value?: string): ConversationLiveMode {
	return CONVERSATION_LIVE_MODES.includes(value as ConversationLiveMode)
		? (value as ConversationLiveMode)
		: "off";
}

/**
 * The least a message has to be for `Conversation.Download` to export it: a role and a list of
 * parts, of which only the text ones are read.
 *
 * Structural on purpose, for the reason `src/lib/shared/chat-parts.ts` gives at length — importing
 * the AI SDK's `UIMessage` would pin the SDK onto every project that installs this component. A
 * `UIMessage` satisfies this shape unchanged: its `parts` carry a `type` and the text ones a
 * `text`, and the extra fields a tool or reasoning part carries are simply not read.
 */
export type ConversationMessage = {
	id?: string;
	role: MessageRole;
	parts: readonly { type: string; text?: string }[];
};

/** Upstream's `getMessageText`: the text parts, joined, and nothing else. */
export function conversationMessageText(message: ConversationMessage): string {
	return message.parts
		.filter((part) => part.type === "text")
		.map((part) => part.text ?? "")
		.join("");
}

/**
 * The default formatter: a level-two heading naming the role, a blank line, then the text.
 *
 * DIVERGES FROM UPSTREAM, which writes `**User:** text` on one line (`conversation.tsx:118`). A
 * bold prefix in front of a multi-paragraph answer puts the label on the first paragraph only,
 * and a Markdown table or a fenced block directly after `**Assistant:** ` does not parse — a
 * table needs to start its own line. A heading per turn gives every message its own block and
 * survives whatever the message contains, which is the point of exporting Markdown at all.
 */
export function formatConversationMessage(message: ConversationMessage): string {
	const label = message.role.charAt(0).toUpperCase() + message.role.slice(1);
	return `## ${label}\n\n${conversationMessageText(message)}`;
}

/**
 * The whole transcript as one Markdown document, messages separated by a blank line.
 *
 * `formatMessage` replaces the per-message rendering entirely — it receives the message and its
 * index and returns the block to write, so a caller can include timestamps, skip system prompts
 * (return an empty string; the separator still lands) or write a different dialect.
 */
export function messagesToMarkdown(
	messages: readonly ConversationMessage[],
	formatMessage: (
		message: ConversationMessage,
		index: number,
	) => string = formatConversationMessage,
): string {
	return messages.map((message, index) => formatMessage(message, index)).join("\n\n");
}

/**
 * How long a scroll has to stay silent before an in-flight smooth scroll is considered over.
 *
 * A native smooth scroll reports its progress only as `scroll` events, and there is no reliable
 * end signal to wait for: `scrollend` is not in every engine this kit supports, and a scroll the
 * reader interrupts with the wheel simply stops firing. A few frames of silence after the last
 * step is the fallback, and it is only a fallback — a scroll that reaches the bottom is
 * recognised on the event that gets it there, without waiting.
 */
const CONVERSATION_SETTLE_MS = 160;

/**
 * Reactive inputs for {@link ConversationState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them.
 */
export type ConversationStateProps = {
	/** How the viewport reaches the bottom the first time it is observed. */
	getInitial: () => ScrollBehavior;
	/** How the viewport follows content that grows while the reader is at the bottom. */
	getResize: () => ScrollBehavior;
	/** How many pixels short of the bottom still count as "at the bottom". */
	getOffset: () => number;
	/** Called when {@link ConversationState.atBottom} changes — never for the initial value. */
	onAtBottomChange?: (atBottom: boolean) => void;
};

/**
 * One instance per `<Conversation.Root>`. Published on context; the scroll button reads it.
 *
 * WHAT IT REPLACES. Upstream wraps `use-stick-to-bottom`, a library that runs its own spring
 * animation over `requestAnimationFrame` and reads velocity to tell a reader's wheel from its own
 * motion. This class keeps the contract — pinned to the bottom while content grows, released the
 * moment the reader scrolls up, back once they return — and hands the animation to the browser's
 * own `scrollTo({ behavior })`, which honours the platform's scroll physics for free and, through
 * `src/lib/shared/reduced-motion.svelte.ts`, the reader's `prefers-reduced-motion`.
 *
 * HOW A READER'S SCROLL IS TOLD FROM THE COMPONENT'S OWN. Every source of scrolling — wheel, touch,
 * keyboard, a scrollbar drag, an assistive technology — ends in the same `scroll` event, and so
 * does the component's own smooth scroll to the bottom. One fact separates them: a scroll whose
 * `scrollTop` DECREASED — one that moved towards the top — can only be the reader, because the
 * component never scrolls that way. That is the release, and it is the only one.
 *
 * Every other scroll leaves the pin where it was, which is what a reader who is pinned needs:
 * they are AT the bottom, so no gesture of theirs can move further down, and every downward step
 * that arrives is this component's or the content's. The `#animating` flag holds the pin through
 * an animation in flight until it arrives or goes quiet for {@link CONVERSATION_SETTLE_MS}; the
 * steps that arrive after the flag has been cleared — the tail of an animation whose earlier step
 * touched the bottom, still running while the content grew past it — are held for the same
 * reason, and the settle re-aims at the bottom it has fallen short of.
 *
 * GROWTH IS OBSERVED ON THE CHILDREN, NOT THE VIEWPORT. The viewport's own box never changes when
 * a reply streams in — it is the content inside that grows — so a `ResizeObserver` on the
 * viewport alone would never fire. Same reasoning, and same shape, as `observeScrollPosition` in
 * `src/lib/shared/scroll-position.svelte.ts`; that helper is not used directly because it funnels
 * scroll and resize into one callback, and this class needs to know which one it is looking at.
 */
export class ConversationState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: ConversationStateProps;

	#viewport: HTMLElement | null = null;
	#atBottom: boolean = $state(true);
	#lastScrollTop = 0;
	#animating = false;
	#settleTimer: ReturnType<typeof setTimeout> | undefined;
	#teardown: (() => void) | undefined;
	readonly #reducedMotion = useReducedMotion();

	/** The tolerance, in pixels, below which the reader counts as being at the bottom. */
	readonly offset: number = $derived(Math.max(0, this.#props.getOffset()));

	/**
	 * Whether the reader is within {@link offset} of the bottom — and therefore whether content
	 * that grows will be followed. Starts `true`: nothing is known to overflow yet, and the first
	 * observation scrolls to the bottom anyway.
	 */
	get atBottom(): boolean {
		return this.#atBottom;
	}

	/** The element being observed, or `null` before {@link observe} and after {@link destroy}. */
	get viewport(): HTMLElement | null {
		return this.#viewport;
	}

	constructor(props: ConversationStateProps) {
		this.#props = props;
	}

	/**
	 * Start following `viewport`. Replaces any element observed before, scrolls to the bottom with
	 * the `initial` behaviour, and returns the teardown — the same function {@link destroy} calls.
	 *
	 * SSR-guarded: with no `window` it records the element, observes nothing and returns a no-op.
	 */
	observe(viewport: HTMLElement): () => void {
		this.#teardown?.();
		this.#viewport = viewport;
		if (typeof window === "undefined") return () => {};

		const onScroll = () => this.#onScroll();
		viewport.addEventListener("scroll", onScroll, { passive: true });

		let resizeObserver: ResizeObserver | undefined;
		let mutationObserver: MutationObserver | undefined;

		if (typeof ResizeObserver !== "undefined") {
			const observer = new ResizeObserver(() => this.#onResize());
			resizeObserver = observer;

			// The viewport for a height change of its own (a window resize, a collapsing panel), and
			// each child for the content growing — kept current when children come and go, which is
			// what happens when an empty state is swapped for the first message.
			const observeTree = () => {
				observer.disconnect();
				observer.observe(viewport);
				for (const child of Array.from(viewport.children)) observer.observe(child);
			};
			observeTree();

			if (typeof MutationObserver !== "undefined") {
				mutationObserver = new MutationObserver(() => {
					observeTree();
					this.#onResize();
				});
				mutationObserver.observe(viewport, { childList: true });
			}
		}

		this.#lastScrollTop = viewport.scrollTop;
		this.scrollToBottom(this.#props.getInitial());

		this.#teardown = () => {
			viewport.removeEventListener("scroll", onScroll);
			resizeObserver?.disconnect();
			mutationObserver?.disconnect();
			this.#clearSettle();
			this.#animating = false;
			if (this.#viewport === viewport) this.#viewport = null;
			this.#teardown = undefined;
		};
		return this.#teardown;
	}

	/**
	 * Scroll to the bottom and pin there, so content that grows from now on is followed.
	 *
	 * `behavior` is what the button and the parts pass; under `prefers-reduced-motion: reduce` it
	 * is overridden to `instant`, whatever was asked for. A no-op before {@link observe}.
	 */
	scrollToBottom(behavior: ScrollBehavior = "smooth"): void {
		const viewport = this.#viewport;
		if (!viewport) return;

		const resolved: ScrollBehavior = this.#reducedMotion.current ? "instant" : behavior;
		const top = viewport.scrollHeight - viewport.clientHeight;

		// Pinned from this moment, not from arrival: a resize that lands during the animation must
		// re-target the bottom rather than read the half-way position as a release.
		this.#setAtBottom(true);

		if (top - viewport.scrollTop <= 0) return;

		// `auto` defers to the element's CSS `scroll-behavior`, which a stylesheet may have set to
		// `smooth`; only `instant` is guaranteed not to animate.
		this.#animating = resolved !== "instant";
		this.#lastScrollTop = viewport.scrollTop;
		viewport.scrollTo({ top, behavior: resolved });
		if (this.#animating) this.#armSettle();
		else this.#clearSettle();
	}

	/**
	 * Re-read the position and set {@link atBottom} from it, without scrolling anything.
	 *
	 * The root calls this when `offset` changes: the tolerance is reactive, but nothing else
	 * re-asks the question until the reader scrolls or the content resizes, so a reader sitting
	 * 60px up with the band widened from 16px to 96px would otherwise keep the stale `false` —
	 * button up, `data-at-bottom` absent — until something else moved. Skipped while a scroll of
	 * the component's own is in flight, for the reason `#evaluate` gives. A no-op before
	 * {@link observe}.
	 */
	measure(): void {
		this.#evaluate();
	}

	/** Stop observing. Idempotent; the state may be handed a new viewport afterwards. */
	destroy(): void {
		this.#teardown?.();
		this.#viewport = null;
	}

	#onScroll(): void {
		const viewport = this.#viewport;
		if (!viewport) return;

		const metrics = readScrollMetrics(viewport);
		const scrolledUp = metrics.scrollTop < this.#lastScrollTop;
		this.#lastScrollTop = metrics.scrollTop;

		const { atEnd } = computeAxisOverflow(metrics, "vertical", { offset: this.offset });

		if (atEnd) {
			// Arrived — or the reader came back on their own. Either way the pin is on.
			this.#clearSettle();
			this.#animating = false;
			this.#setAtBottom(true);
			return;
		}

		if (scrolledUp) {
			// Only the reader scrolls up. Releases the pin even mid-animation: the browser has
			// already abandoned the smooth scroll in favour of the wheel.
			this.#clearSettle();
			this.#animating = false;
			this.#setAtBottom(false);
			return;
		}

		if (this.#animating) {
			// One step of the component's own scroll: still short of the bottom, still pinned.
			this.#armSettle();
			return;
		}

		/*
			WHAT IS LEFT IS A DOWNWARD SCROLL, SHORT OF THE BOTTOM, THAT THIS COMPONENT DOES NOT
			BELIEVE IT STARTED — AND IT MUST NOT RELEASE THE PIN.

			A reader who is pinned is AT the bottom, and no gesture from there scrolls further down;
			every downward step that arrives while pinned therefore comes from this component or
			from content growing under it. The one that is easy to miss is the tail of a smooth
			scroll whose earlier step happened to touch the bottom: the `atEnd` branch above clears
			`#animating` on that step, so the remaining steps of an animation the browser is still
			running arrive here — and if the content grew in between, they arrive short. Reading
			that as the reader leaving is how a streamed answer used to strand its last screenful
			below the fold with the scroll button up, measured on the Chat surface pattern: pinned
			through growth in 24px steps, released on a step that landed 27px short at the tail of
			its own animation.

			A reader who is NOT pinned is already `atBottom === false`, so there is nothing here to
			set for them either. Releasing is `scrolledUp`'s job alone, above, and it runs first.
		*/
	}

	#onResize(): void {
		if (!this.#viewport) return;
		if (this.#atBottom) {
			this.scrollToBottom(this.#props.getResize());
			return;
		}
		// Content that shrank may have brought the bottom into view without any scroll event —
		// the browser only fires one when `scrollTop` itself has to change.
		this.#evaluate();
	}

	/** Whether the viewport is within {@link offset} of its bottom right now. */
	#isAtEnd(): boolean {
		const viewport = this.#viewport;
		if (!viewport) return false;
		return computeAxisOverflow(readScrollMetrics(viewport), "vertical", { offset: this.offset })
			.atEnd;
	}

	/** Re-read the position and set `atBottom` from it. Skipped while a scroll is in flight. */
	#evaluate(): void {
		if (!this.#viewport || this.#animating) return;
		this.#setAtBottom(this.#isAtEnd());
	}

	#setAtBottom(next: boolean): void {
		if (this.#atBottom === next) return;
		this.#atBottom = next;
		this.#props.onAtBottomChange?.(next);
	}

	#armSettle(): void {
		this.#clearSettle();
		this.#settleTimer = setTimeout(() => {
			this.#settleTimer = undefined;
			this.#animating = false;

			/*
				A SHORTFALL AT THE END OF THE ANIMATION IS THE CONTENT'S, NOT THE READER'S.

				`scrollTo` aims at the bottom as it was when the scroll started. A reply that streams
				grows the content WHILE the animation runs, so the target it is travelling to is
				already short by the time it arrives, and the further it had to travel the more it
				misses by. Reading that shortfall as a position — which is all `#evaluate` can do —
				releases the pin on a reader who never touched the wheel, and once released nothing
				re-arms it: `#onResize` only follows while `atBottom`. Measured on the Chat surface
				pattern before this: the pin held through a stream in 24px steps and broke on the one
				growth of 123px, leaving the last 148px of the answer below the fold with the scroll
				button up.

				So while the pin is still on, the answer to a shortfall is to aim again rather than to
				judge. It terminates on its own: `scrollToBottom` returns without arming when there is
				nothing left to travel, and the reader's own scroll up still releases in `#onScroll`,
				which runs before any of this.
			*/
			if (this.#atBottom && !this.#isAtEnd()) {
				this.scrollToBottom(this.#props.getResize());
				return;
			}

			this.#evaluate();
		}, CONVERSATION_SETTLE_MS);
	}

	#clearSettle(): void {
		if (this.#settleTimer === undefined) return;
		clearTimeout(this.#settleTimer);
		this.#settleTimer = undefined;
	}
}

const CONVERSATION_CONTEXT_KEY = Symbol("conversation");

export function setConversationContext(state: ConversationState): ConversationState {
	return setContext(CONVERSATION_CONTEXT_KEY, state);
}

export function hasConversationContext(): boolean {
	return hasContext(CONVERSATION_CONTEXT_KEY);
}

export function getConversationContext(part?: string): ConversationState {
	if (!hasConversationContext()) {
		throw new Error(
			`${part ?? "`<Conversation>` part"} must be used within \`<Conversation.Root>\`.`,
		);
	}
	return getContext<ConversationState>(CONVERSATION_CONTEXT_KEY);
}

/** Parity name for upstream's `useStickToBottomContext`. Delegates to the getter. */
export function useConversation(): ConversationState {
	return getConversationContext();
}
