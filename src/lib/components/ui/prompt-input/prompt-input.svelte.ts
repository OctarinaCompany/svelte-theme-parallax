import { getContext, hasContext, setContext } from "svelte";

/**
 * What `PromptInput.Root` hands to `onSubmit`.
 *
 * ONLY `text` FOR NOW. Upstream's message also carries `files: FileUIPart[]`; attachments (and
 * with them the paste-to-attach and drop handlers, the hidden file input and the action menu that
 * opens it) are the documented follow-up of this lean port, and the field is added when they land
 * rather than shipped empty. A caller destructuring `{ text }` today keeps compiling then.
 */
export type PromptInputMessage = {
	/** The textarea's value at the moment of submission, untrimmed. */
	text: string;
};

/** Every side a `PromptInput.Button` tooltip may open on — Bits UI's floating sides. */
export const PROMPT_INPUT_TOOLTIP_SIDES = ["top", "right", "bottom", "left"] as const;

export type PromptInputTooltipSide = (typeof PROMPT_INPUT_TOOLTIP_SIDES)[number];

/**
 * Normalise a possibly untyped runtime value to a known side.
 * Anything outside {@link PROMPT_INPUT_TOOLTIP_SIDES} falls back to `"top"`, upstream's default.
 */
export function resolvePromptInputTooltipSide(value?: string): PromptInputTooltipSide {
	return PROMPT_INPUT_TOOLTIP_SIDES.includes(value as PromptInputTooltipSide)
		? (value as PromptInputTooltipSide)
		: "top";
}

/**
 * The `tooltip` prop of `PromptInput.Button`: a bare string, or the string with a shortcut and
 * a side. `content` is a string rather than upstream's `ReactNode` — a snippet prop would be the
 * Svelte equivalent, and a tooltip is one line of text; a caller that needs markup composes
 * `Tooltip` around a plain button instead.
 */
export type PromptInputButtonTooltip =
	| string
	| {
			content: string;
			/** Rendered as a `Kbd` after the content. */
			shortcut?: string;
			/** @default "top" */
			side?: PromptInputTooltipSide;
	  };

/** The tooltip prop, flattened to what the part renders. `null` when there is no tooltip. */
export type ResolvedPromptInputTooltip = {
	content: string;
	shortcut?: string;
	side: PromptInputTooltipSide;
};

/**
 * Flatten {@link PromptInputButtonTooltip}. An empty string is "no tooltip" rather than an empty
 * bubble — the one boundary upstream's `if (!tooltip)` also draws.
 */
export function resolvePromptInputTooltip(
	tooltip?: PromptInputButtonTooltip,
): ResolvedPromptInputTooltip | null {
	if (!tooltip) return null;
	if (typeof tooltip === "string") return { content: tooltip, side: "top" };
	if (!tooltip.content) return null;
	return {
		content: tooltip.content,
		shortcut: tooltip.shortcut,
		side: resolvePromptInputTooltipSide(tooltip.side),
	};
}

/**
 * Reactive inputs for {@link PromptInputState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them.
 */
export type PromptInputStateProps = {
	/** The draft — the root's bindable `value`. */
	getValue: () => string;
	/** Write the draft. The root fires `onValueChange` from here, and only on a real change. */
	setValue: (value: string) => void;
	/** Whether the whole composer is inert. */
	getDisabled: () => boolean;
	/** Whether a successful submission empties the draft. */
	getClearOnSubmit: () => boolean;
	/** The caller's submit handler. */
	getOnSubmit: () => (message: PromptInputMessage, event: SubmitEvent) => void | Promise<void>;
};

/**
 * One instance per `<PromptInput.Root>`. Published on context; every part reads it.
 *
 * THE DRAFT IS STATE, NOT FORM DATA. Upstream reads the textarea through `new FormData(form)`
 * and calls `form.reset()` the moment it has the text, which is why its textarea needs a `name`
 * and why a controlled value needs a whole separate `PromptInputProvider`. Here the value lives on
 * the root as a bindable prop and the textarea binds to it through this class, so there is one
 * source of truth, a parent can read and write the draft at any time, and clearing is an explicit
 * decision ({@link PromptInputStateProps.getClearOnSubmit}) taken AFTER the handler has
 * succeeded rather than a reset taken before it runs.
 */
export class PromptInputState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: PromptInputStateProps;

	readonly value: string = $derived(this.#props.getValue());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly clearOnSubmit: boolean = $derived(this.#props.getClearOnSubmit());

	/** Whether the draft holds anything but whitespace — what {@link submit} will accept. */
	readonly submittable: boolean = $derived(this.value.trim().length > 0);

	/**
	 * Whether an asynchronous `onSubmit` is still running. Stamped on the root as `data-pending`;
	 * a second submission while it is set is ignored, so Enter mashed during a slow request sends
	 * one message, not several copies of it.
	 */
	pending: boolean = $state(false);

	constructor(props: PromptInputStateProps) {
		this.#props = props;
	}

	/** Write the draft. A parent-driven write goes through the root's prop, never through here. */
	setValue(value: string): void {
		this.#props.setValue(value);
	}

	/** Empty the draft. What a successful submission does when `clearOnSubmit` is on. */
	clear(): void {
		this.#props.setValue("");
	}

	/**
	 * The form's submit handler.
	 *
	 * The default is ALWAYS prevented — a composer that navigates on Enter is never what a caller
	 * wants, even when the submission is refused. The text is read synchronously, before any
	 * `await`, so keystrokes that land during a slow handler are not what gets sent. Whitespace-only
	 * drafts are refused without calling `onSubmit`.
	 *
	 * A promise is awaited and the draft cleared only when it RESOLVES; a rejection keeps the draft
	 * so the reader can retry, and it is re-thrown rather than swallowed as upstream does — a
	 * failed send that leaves no trace anywhere is a bug nobody can find. Surfacing it to the reader
	 * is the caller's job; this class only promises not to lose the text.
	 *
	 * THE CLEAR IS CONDITIONAL ON THE DRAFT BEING UNTOUCHED. The textarea stays editable while a
	 * promise is pending, so the reader may already be typing the next message when the previous
	 * one resolves; wiping the field then would lose that draft — the very thing clearing AFTER the
	 * handler (rather than upstream's `form.reset()` before it) exists to prevent. The draft is
	 * cleared only while it still equals the text that was sent; on the synchronous path the two
	 * are always equal, so nothing changes there.
	 */
	async submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (this.disabled || this.pending) return;

		const text = this.#props.getValue();
		if (text.trim() === "") return;

		const result = this.#props.getOnSubmit()({ text }, event);
		if (result instanceof Promise) {
			this.pending = true;
			try {
				await result;
			} finally {
				this.pending = false;
			}
		}
		if (this.#props.getClearOnSubmit() && this.#props.getValue() === text) this.clear();
	}
}

const PROMPT_INPUT_CONTEXT_KEY = Symbol("prompt-input");

export function setPromptInputContext(state: PromptInputState): PromptInputState {
	return setContext(PROMPT_INPUT_CONTEXT_KEY, state);
}

export function hasPromptInputContext(): boolean {
	return hasContext(PROMPT_INPUT_CONTEXT_KEY);
}

export function getPromptInputContext(part?: string): PromptInputState {
	if (!hasPromptInputContext()) {
		throw new Error(
			`${part ?? "`<PromptInput>` part"} must be used within \`<PromptInput.Root>\`.`,
		);
	}
	return getContext<PromptInputState>(PROMPT_INPUT_CONTEXT_KEY);
}

/** Parity name for the hook shape upstream exposes. Delegates to the getter. */
export function usePromptInput(): PromptInputState {
	return getPromptInputContext();
}
