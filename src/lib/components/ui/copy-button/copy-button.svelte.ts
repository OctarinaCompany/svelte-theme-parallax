import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

/**
 * The text a `<CopyButton>` writes, or a producer for it.
 *
 * The function form is for text that is expensive or not yet known when the button renders — a
 * serialised selection, a token minted on demand. It may hand back the string directly or a promise
 * for it; only the promise form ever shows the pending face, for the reason spelled out in
 * {@link CopyButtonState.copy}.
 */
export type CopyButtonValue = string | (() => string | Promise<string>);

/** Every face the button can show, in the order it moves through them. */
export const COPY_BUTTON_PHASES = ["idle", "pending", "copied"] as const;

/** Which glyph is on screen. Drives the `{#key}` block, so it is also the swap's identity. */
export type CopyButtonPhase = (typeof COPY_BUTTON_PHASES)[number];

/** How long the receipt stays up, in ms. Upstream's revert delay. */
export const DEFAULT_COPY_BUTTON_TIMEOUT = 2000;

/**
 * The swap's duration in ms — upstream's `duration: 0.3`.
 *
 * Upstream asks for `{type: "spring", duration: 0.3, bounce: 0}`, and a spring with zero bounce is
 * critically damped: it approaches its target and stops, with NO overshoot. So the honest CSS
 * approximation is an ease-out, not one of the springy back-out curves — a bouncy easing here would
 * be a different animation that merely looks livelier. {@link copyButtonIconSwap} uses `cubicOut`.
 */
export const COPY_BUTTON_SWAP_DURATION = 300;

/** The scale an icon enters from and exits to — upstream's `scale: 0.25`. */
const COPY_BUTTON_SWAP_SCALE = 0.25;

/** The blur an icon enters from and exits to, in px — upstream's `blur(4px)`. */
const COPY_BUTTON_SWAP_BLUR = 4;

/**
 * The copied ground: the house soft family, not upstream's emerald.
 *
 * Upstream tints the button `bg-emerald-100 text-emerald-600 border-emerald-300` in light and
 * `bg-emerald-500/20 text-emerald-400 border-emerald-500/30` in dark. That is
 * a raw palette and a second source of truth for "success", so it maps onto the tokens instead:
 * `CONVENTIONS.md` §3 makes the soft family `--success-subtle` with `--success-subtle-foreground` as
 * the ink — never the raw `--success`, which is a fill and not an ink on a tint. `border-transparent`
 * matches how Alert's `success-subtle` variant handles the same edge.
 *
 * EVERY RULE HERE HAS TO MATCH A RULE IT DEFEATS, because this list is merged over a Button variant
 * rather than replacing one, and `twMerge` only drops a class when a LATER class lands in the same
 * group — where the modifier is part of the group key. So the `hover:` pair exists because every
 * variant declares a hover ground (`hover:bg-primary/80` would otherwise repaint the receipt under
 * the pointer), and the three `dark:` rules exist because `outline` and `ghost` declare
 * `dark:bg-input/30`, `dark:border-input` and `dark:hover:bg-muted/50`, which an unmodified
 * `bg-success-subtle` does not group with — and which would then also outrank it in the cascade,
 * `@custom-variant dark (&:is(.dark *))` in `src/app.css` making every `dark:` utility one selector
 * heavier. They are not a second colour: `--success-subtle` already flips with the theme, so the
 * prefix changes when the rule applies and never what it paints.
 *
 * Exported so a caller who wants the tint elsewhere reads it from here rather than retyping it.
 */
export const COPY_BUTTON_COPIED_CLASSES =
	"border-transparent bg-success-subtle text-success-subtle-foreground hover:bg-success-subtle hover:text-success-subtle-foreground dark:border-transparent dark:bg-success-subtle dark:hover:bg-success-subtle";

/**
 * One icon entering or leaving the swap — upstream's `IconSwapItem` as a
 * Svelte transition.
 *
 * ONE FUNCTION FOR BOTH DIRECTIONS, which is the whole trick. Upstream's `initial` and `exit` are
 * the same values (`{opacity: 0, scale: 0.25, filter: "blur(4px)"}`) and `animate` is the resting
 * state, so a single `css(t)` describes the entrance read forwards and the exit read backwards.
 * Used as `in:` and `out:` on the same element, it reproduces `AnimatePresence mode="popLayout"`
 * exactly: the outgoing icon and the incoming one are on screen together, animating past each other.
 *
 * `scale:` and `filter:` rather than `transform: scale()` — the independent transform properties
 * compose with anything the button already puts on `transform`, and nothing here needs the legacy
 * shorthand.
 */
export function copyButtonIconSwap(
	_node: Element,
	params?: { duration?: number },
): TransitionConfig {
	return {
		duration: params?.duration ?? COPY_BUTTON_SWAP_DURATION,
		easing: cubicOut,
		// `t` runs 0→1 on the way in and 1→0 on the way out; `u` is its complement.
		css: (t, u) =>
			`opacity: ${t}; scale: ${COPY_BUTTON_SWAP_SCALE + (1 - COPY_BUTTON_SWAP_SCALE) * t}; filter: blur(${COPY_BUTTON_SWAP_BLUR * u}px);`,
	};
}

export type CopyButtonStateProps = {
	readonly getValue: () => CopyButtonValue;
	/** How long the receipt stays up, in ms. */
	readonly getTimeout: () => number;
	/** What the live region says once the write has resolved. */
	readonly getCopiedLabel: () => string;
	/** What the live region says when the clipboard refuses. */
	readonly getErrorLabel: () => string;
	readonly onCopy?: (text: string) => void;
	readonly onCopyError?: (error: unknown) => void;
};

/**
 * One instance per `<CopyButton>`. Replaces upstream's `copiedText` state, its `setTimeout` and its
 * `.then`/`.catch`, which live in the gallery page there because the button is
 * markup rather than a component.
 *
 * It earns a class of its own — the same test `ShakeState` passes — because there is real machinery
 * here and none of it belongs in markup: a cancellable timer, an in-flight write, a re-entrancy
 * guard, and the ordering rule that keeps a stale click from overwriting a fresh one. There is no
 * context and no second part; nothing outside the component reads this.
 */
export class CopyButtonState {
	#props: CopyButtonStateProps;

	/** The receipt timer. One at a time, always cleared before it is re-armed. */
	#timer: ReturnType<typeof setTimeout> | undefined;

	/**
	 * Which click is authoritative. Bumped on every accepted click and on destroy, so a write that
	 * resolves after a later click — or after the component is gone — writes nothing back.
	 * Deliberately not `$state`: only {@link copy} reads it, and only to compare against its own copy.
	 */
	#run = 0;

	/** True while the receipt is showing. */
	copied: boolean = $state(false);

	/** True only while an asynchronous producer is still working — see {@link copy}. */
	pending: boolean = $state(false);

	/** The live region's text. Empty means there is nothing to announce. */
	announcement: string = $state("");

	readonly phase: CopyButtonPhase = $derived(
		this.copied ? "copied" : this.pending ? "pending" : "idle",
	);

	constructor(props: CopyButtonStateProps) {
		this.#props = props;
	}

	/**
	 * Resolve `value` to text, showing the pending face only when that genuinely takes time.
	 *
	 * THE GATE MATTERS. `writeText` returns a promise even for a two-character string, so a pending
	 * flag set around the whole operation would flash a spinner on every ordinary copy for a frame or
	 * two. Pending is therefore scoped to a PRODUCER that hands back something other than a string:
	 * that is the only case where the button can be waiting on work of unknown length.
	 *
	 * The check is `typeof !== "string"` rather than `instanceof Promise`, so a thenable from another
	 * realm or a promise polyfill is awaited too.
	 */
	async #resolveValue(): Promise<string> {
		const value = this.#props.getValue();
		if (typeof value !== "function") return value;

		const produced = value();
		if (typeof produced === "string") return produced;

		this.pending = true;
		try {
			return await produced;
		} finally {
			this.pending = false;
		}
	}

	/**
	 * Produce the text, write it, and show the receipt — but only if the write RESOLVES.
	 *
	 * HONESTY IS THE POINT. `navigator.clipboard` is undefined in an insecure context and `writeText`
	 * rejects when permission is denied, so a check mark shown optimistically is a lie the reader
	 * cannot detect until they paste. Same contract as `CollapsiblePage.svelte`'s and
	 * `DataGridPage.svelte`'s copy demos, and as `ui/json-viewer`'s toolbar. What is new here is that
	 * the failure is not swallowed: `onCopyError` fires and the live region says so, because a
	 * component that silently does nothing is indistinguishable from a broken one.
	 */
	async copy(): Promise<void> {
		// A second click while a producer is still running would start a second production and race
		// it. The first one is already on its way; let it finish.
		if (this.pending) return;

		// Cleared before the await, restored after it. A polite live region only speaks when its text
		// CHANGES, so copying the same value twice in a row would announce nothing at all if the
		// string simply stayed put.
		this.announcement = "";

		const run = ++this.#run;

		try {
			const text = await this.#resolveValue();
			await navigator.clipboard.writeText(text);
			if (run !== this.#run) return;
			this.#showReceipt(text);
		} catch (error) {
			if (run !== this.#run) return;
			this.#fail(error);
		}
	}

	/**
	 * Arm the receipt.
	 *
	 * `clearTimeout` BEFORE re-arming is the trap `CollapsiblePage.svelte` documents at its copy demo:
	 * without it, a rapid second click inherits the first click's timer, which then clears the second
	 * click's check mark early — the receipt blinks instead of holding for the full timeout from the
	 * last press.
	 */
	#showReceipt(text: string): void {
		this.copied = true;
		this.announcement = this.#props.getCopiedLabel();
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => {
			this.copied = false;
			this.announcement = "";
		}, this.#props.getTimeout());
		this.#props.onCopy?.(text);
	}

	/**
	 * The clipboard refused. No receipt, and no timer either — the announcement stands until the next
	 * click clears it, so it is not wiped a moment later by a receipt timer that was already running.
	 */
	#fail(error: unknown): void {
		this.copied = false;
		this.announcement = this.#props.getErrorLabel();
		clearTimeout(this.#timer);
		this.#timer = undefined;
		this.#props.onCopyError?.(error);
	}

	/**
	 * Called from the component's `$effect` teardown.
	 *
	 * Bumping `#run` is the second half of the cleanup and the less obvious one: clearing the timer
	 * stops the receipt from being retracted after the component is gone, but a `writeText` still in
	 * flight would otherwise resolve into a destroyed instance and call `onCopy` for a button that no
	 * longer exists.
	 */
	destroy(): void {
		clearTimeout(this.#timer);
		this.#timer = undefined;
		this.#run += 1;
	}
}
