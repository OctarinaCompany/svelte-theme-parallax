import { getContext, hasContext, setContext } from "svelte";

/**
 * One attached file: what `PromptInput.Attachment` draws and what {@link PromptInputMessage}
 * carries to `onSubmit`.
 *
 * STRUCTURAL, NOT IMPORTED. This is the AI SDK's `FileUIPart` plus the `id` the list is keyed and
 * removed by, declared by shape rather than imported from `ai`: the registry's import walker
 * matches `import type` as well, so a type-only import would pin the whole SDK onto every project
 * that installs this component. `src/lib/shared/chat-parts.ts` states that rule, its cost and its
 * reason in full for the identical decision taken there; the shapes unify structurally, so a
 * `FileUIPart` from the SDK is assignable to this and back.
 *
 * NAMED FOR THE FIELD IT FILLS rather than for the part that renders it: the barrel already
 * exports `PromptInputAttachment` as the component alias of `PromptInput.Attachment`, and
 * TypeScript refuses to re-export a type and a value under one name.
 *
 * `url` IS AN OBJECT URL THIS COMPOSER OWNS. {@link PromptInputAttachmentsState} mints it with
 * `URL.createObjectURL` as the file is added and revokes it on remove, on clear, and when the
 * composer is destroyed — the three exits a leak hides in. {@link PromptInputMessage.files} says
 * what that means for a submit handler.
 */
export type PromptInputFile = {
	/** Unique within one composer for that composer's lifetime. The handle {@link PromptInputAttachmentsState.remove} takes. */
	id: string;
	/** Always `"file"`, so a caller can widen these into a union of its own message parts. */
	type: "file";
	/** The picked file's name. Optional to mirror `FileUIPart`; this component always sets it. */
	filename?: string;
	/** The browser's media type for the file — an empty string when it could not determine one. */
	mediaType: string;
	/** A `blob:` URL, owned by the composer. See above. */
	url: string;
	/**
	 * The picked `File` itself, kept so that everything a caller needs outlives the composer's
	 * `url`.
	 *
	 * THIS IS WHAT MAKES THE OBJECT-URL LIFETIME SAFE TO LIVE WITH. The `url` above dies when the
	 * composer revokes it — on remove, on clear, and on the clear a submission performs — so a
	 * handler that only had the URL would have to race that revoke with a `fetch`, and an
	 * optimistic bubble rendering the attachment would break the moment the composer cleared. With
	 * the file in hand a caller sends the bytes (`new FormData().append("file", file)`), reads them
	 * (`await file.arrayBuffer()`), or mints a URL of its own for a preview it controls.
	 *
	 * It also composes with the AI SDK without a conversion step: `Chat.sendMessage` takes
	 * `files: FileList | File[]`, so `files: message.files.map((f) => f.file)` is the whole of
	 * sending a turn's attachments.
	 *
	 * Keeping it costs no copy — a `File` is a handle to data the browser already holds for the
	 * `url` beside it, not a second buffer.
	 */
	file: File;
};

/**
 * What `PromptInput.Root` hands to `onSubmit`.
 */
export type PromptInputMessage = {
	/** The textarea's value at the moment of submission, untrimmed. */
	text: string;
	/**
	 * The attachments at the moment of submission, in the order they were added — an empty array
	 * when there are none, never `undefined`.
	 *
	 * THE URLS LIVE EXACTLY AS LONG AS THE HANDLER; THE FILES OUTLIVE IT. Every `url` here is a
	 * `blob:` URL the composer minted, and a submission that clears (`clearOnSubmit`, the default)
	 * revokes them the moment `onSubmit` returns — or, for a promise, the moment it settles. So a
	 * handler keeps `file`, never `url`: `PromptInputFile.file` is the picked `File`, it is not
	 * revoked with the URL, and it is what both sending and previewing should be built on. A
	 * handler that renders an optimistic bubble mints its own object URL from it and revokes that
	 * when the bubble goes.
	 *
	 * UPSTREAM CONVERTS INSTEAD: `prompt-input.tsx` fetches every blob URL and hands `onSubmit`
	 * base64 data URLs, so its message survives the revoke. That trades a leak for a copy — a 10 MB
	 * image becomes a ~13 MB string retained for as long as the caller keeps the message — and it
	 * makes every submission asynchronous. Handing over the `File` reaches the same place with no
	 * copy and no forced `await`, and leaves the encoding to whatever the caller is actually
	 * talking to. `clearOnSubmit={false}` opts out of the revoke entirely and leaves the files in
	 * the composer.
	 */
	files: PromptInputFile[];
};

/** Why {@link PromptInputStateProps.getOnError}'s callback fired. Upstream's three codes. */
export const PROMPT_INPUT_ERROR_CODES = ["accept", "max_file_size", "max_files"] as const;

export type PromptInputErrorCode = (typeof PROMPT_INPUT_ERROR_CODES)[number];

/** What `onError` receives: a machine-readable code and a sentence a caller may show as it is. */
export type PromptInputError = {
	code: PromptInputErrorCode;
	message: string;
};

/**
 * Whether a file satisfies an `accept` string — the same grammar the `accept` attribute takes
 * (MDN, `<input type="file">`): a comma-separated list of media types (`image/png`), media type
 * groups (`image/*`) and file extensions (`.pdf`).
 *
 * THE ATTRIBUTE IS NOT ENOUGH ON ITS OWN, which is why this exists: the browser enforces `accept`
 * in the file dialog and nowhere else, so a drop or a paste walks straight past it. Every add path
 * goes through here.
 *
 * EXTENSIONS ARE MATCHED, where upstream's `matchesAccept` only understands media types and
 * therefore rejects every file for an `accept=".pdf"` composer. The extension branch is the one
 * `src/lib/hooks/file-upload.svelte.ts` already implements for the same grammar.
 *
 * An absent, empty or whitespace-only `accept` allows everything, and so does a `*` pattern. A file
 * the browser could not type (`file.type === ""`) matches no media-type pattern at all, so an
 * `accept="image/*"` composer refuses it — it can still be admitted by extension.
 */
export function matchesPromptInputAccept(file: File, accept?: string): boolean {
	const patterns = (accept ?? "")
		.split(",")
		.map((pattern) => pattern.trim())
		.filter(Boolean);
	if (patterns.length === 0) return true;

	const extension = file.name.includes(".") ? `.${file.name.split(".").pop()?.toLowerCase()}` : "";

	return patterns.some((pattern) => {
		if (pattern === "*" || pattern === "*/*") return true;
		if (pattern.startsWith(".")) return extension === pattern.toLowerCase();
		// `image/*` → the file's type starts with `image/`. `pattern.slice(0, -1)` keeps the
		// slash, which is what stops `image/*` from also matching an `imagex/png`.
		if (pattern.endsWith("/*")) return file.type.startsWith(pattern.slice(0, -1));
		return file.type === pattern;
	});
}

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
 * Reactive inputs for {@link PromptInputAttachmentsState}. Getters rather than values, for the
 * reason {@link PromptInputStateProps} gives.
 */
export type PromptInputAttachmentsStateProps = {
	/** The root's `accept`, enforced by {@link matchesPromptInputAccept} on every add path. */
	getAccept: () => string | undefined;
	/** Whether more than one file may be held. `false` caps the list at one. */
	getMultiple: () => boolean;
	/** How many files may be held at once, `undefined` for no ceiling. Only read when multiple. */
	getMaxFiles: () => number | undefined;
	/** The per-file byte ceiling, `undefined` or `0` for no ceiling. */
	getMaxFileSize: () => number | undefined;
	/**
	 * Whether the whole composer is inert. An inert composer refuses to submit and accepts no file
	 * from any path — the dialog, a drop or a paste.
	 */
	getDisabled: () => boolean;
	/** Where a rejection is reported. */
	getOnError: () => ((error: PromptInputError) => void) | undefined;
	/** The root's hidden `<input type="file">`, or `null` before it mounts. */
	getFileInput: () => HTMLInputElement | null;
};

/** `3 files` / `1 file` — the only piece of grammar the messages below need. */
function countFiles(count: number): string {
	return `${count} file${count === 1 ? "" : "s"}`;
}

/**
 * The attachment list of one composer: what is held, how a file gets in, and — the part that has
 * to be right — when each object URL is released.
 *
 * OBJECT URL LIFECYCLE. `URL.createObjectURL` hands back a URL that keeps its blob alive until
 * `URL.revokeObjectURL` is called on it (MDN, `URL.createObjectURL`), so a composer that mints one
 * per attachment and never releases it holds every file the reader ever picked for as long as the
 * document lives. There are exactly three exits, and all three revoke:
 *
 *   1. {@link remove} — the reader deletes one chip, or Backspace deletes the last.
 *   2. {@link clear} — a submission cleared the composer, or the caller cleared it by hand.
 *   3. Destruction — the `$effect` teardown in the constructor.
 *
 * The third is the one that is easy to miss and impossible to see: without it, every visit to a
 * page that mounts a composer with attachments on it leaks the lot. `src/lib/hooks/file-upload.svelte.ts`
 * makes the same point about its previews and takes the same `$effect(() => () => …)` teardown,
 * which is why this class carries the same requirement as `FileUpload`: **construct it during
 * component initialisation**. `PromptInputState` does, and `prompt-input.svelte` constructs that at
 * the top of its instance script.
 */
export class PromptInputAttachmentsState {
	// No `!` here, unlike `PromptInputState.#props`: nothing in this class reads the props from a
	// field initializer, so the constructor assignment is all the compiler needs to see.
	#props: PromptInputAttachmentsStateProps;

	#files: PromptInputFile[] = $state([]);

	/**
	 * The id counter.
	 *
	 * Upstream mints ids with `nanoid`; a monotonic counter needs no dependency and is enough for
	 * what the id is for — keying an `{#each}` and naming one entry in {@link remove}. It only ever
	 * counts up, so an id is never reused within a composer even after everything is removed.
	 */
	#lastId = 0;

	constructor(props: PromptInputAttachmentsStateProps) {
		this.#props = props;

		// Reads nothing, so it never re-runs: this is the teardown, and only the teardown.
		$effect(() => () => this.#revokeAll());
	}

	/** Everything currently attached, in the order it was added. */
	get files(): PromptInputFile[] {
		return this.#files;
	}

	/**
	 * Add files from any path — the dialog, a drop, a paste.
	 *
	 * VALIDATION RUNS IN THREE PASSES, in this order, and each reports separately: `accept`, then
	 * `maxFileSize`, then the count ceiling. One add can therefore fire `onError` more than once —
	 * a drop of a huge PDF onto an `accept="image/*"` composer reports `accept` alone, because the
	 * PDF never reaches the size pass.
	 *
	 * PARTIAL FAILURES ARE REPORTED, where upstream only calls `onError` when EVERY file was
	 * rejected and silently drops the rest of a mixed batch. `src/lib/hooks/file-upload.svelte.ts`
	 * already diverges from its own upstream on exactly this point, and for the same reason: a
	 * consumer surfacing these as a toast should not have a file vanish without a word.
	 *
	 * THE COUNT CEILING IS `multiple`'s TOO. Upstream passes `multiple` to the file input and
	 * checks it nowhere, so a drop of five files onto a single-file composer attaches five — the
	 * attribute governs the dialog and nothing else. Here `multiple={false}` IS a ceiling of one,
	 * and the overflow is reported as `max_files`.
	 *
	 * The list is capped rather than refused: what fits is added, and the remainder is reported.
	 */
	add(incoming: FileList | File[]): void {
		if (this.#props.getDisabled()) return;

		const candidates = Array.from(incoming);
		if (candidates.length === 0) return;

		const onError = this.#props.getOnError();
		const accept = this.#props.getAccept();

		const accepted = candidates.filter((file) => matchesPromptInputAccept(file, accept));
		if (accepted.length < candidates.length) {
			onError?.({
				code: "accept",
				message: `${countFiles(candidates.length - accepted.length)} did not match the accepted types.`,
			});
		}

		// `0` and `undefined` both mean "no ceiling": a zero-byte limit would refuse every file,
		// which is never what a caller means by it.
		const maxFileSize = this.#props.getMaxFileSize();
		const sized = maxFileSize ? accepted.filter((file) => file.size <= maxFileSize) : accepted;
		if (sized.length < accepted.length) {
			onError?.({
				code: "max_file_size",
				message: `${countFiles(accepted.length - sized.length)} exceeded the maximum file size.`,
			});
		}

		const limit = this.#props.getMultiple() ? this.#props.getMaxFiles() : 1;
		// Read live, not from a snapshot: the ceiling counts what is held at this moment.
		const capacity =
			typeof limit === "number" ? Math.max(0, limit - this.#files.length) : undefined;
		const capped = capacity === undefined ? sized : sized.slice(0, capacity);
		if (typeof limit === "number" && capped.length < sized.length) {
			onError?.({
				code: "max_files",
				message: `${countFiles(sized.length - capped.length)} exceeded the limit of ${countFiles(limit)}.`,
			});
		}

		if (capped.length === 0) return;

		this.#files = [
			...this.#files,
			...capped.map((file) => ({
				id: `attachment-${++this.#lastId}`,
				type: "file" as const,
				filename: file.name,
				mediaType: file.type,
				url: URL.createObjectURL(file),
				file,
			})),
		];
	}

	/** Drop one attachment and release its URL. An unknown id is a no-op. */
	remove(id: string): void {
		const found = this.#files.find((file) => file.id === id);
		if (!found) return;

		URL.revokeObjectURL(found.url);
		this.#files = this.#files.filter((file) => file.id !== id);
	}

	/** Drop everything and release every URL. What a clearing submission calls. */
	clear(): void {
		if (this.#files.length === 0) return;

		this.#revokeAll();
		this.#files = [];
	}

	/**
	 * Whether the list is still exactly the one whose ids these are, in the same order.
	 *
	 * `PromptInputState.submit` asks before it clears, for the reason it clears the draft only
	 * while the draft is untouched: a reader may attach the next message's photo while a promise
	 * from the previous one is still in flight, and wiping it then would throw away a file nobody
	 * has sent.
	 */
	matches(ids: readonly string[]): boolean {
		return (
			this.#files.length === ids.length &&
			this.#files.every((file, index) => file.id === ids[index])
		);
	}

	/**
	 * Open the browser's file picker.
	 *
	 * Must be called from a user gesture — a click or a key press — or the browser refuses to open
	 * the dialog. `PromptInput.ActionAddAttachments` calls it straight out of the menu item's
	 * `onSelect`, which is one.
	 */
	openFileDialog(): void {
		if (this.#props.getDisabled()) return;
		this.#props.getFileInput()?.click();
	}

	#revokeAll(): void {
		for (const file of this.#files) URL.revokeObjectURL(file.url);
	}
}

/**
 * Reactive inputs for {@link PromptInputState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them.
 */
export type PromptInputStateProps = PromptInputAttachmentsStateProps & {
	/** The draft — the root's bindable `value`. */
	getValue: () => string;
	/** Write the draft. The root fires `onValueChange` from here, and only on a real change. */
	setValue: (value: string) => void;
	/** Whether a successful submission empties the draft and the attachment list. */
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

	// Reached through the accessor below rather than being a public field: `submittable`'s
	// initializer names it, and the compiler reads a plain field there as used before the
	// constructor assigned it — true of the initializer, false of the lazy `$derived` inside it.
	// An accessor is not subject to that check.
	#attachments: PromptInputAttachmentsState;

	/**
	 * The attachment list, owned by this instance and reached through the same context every part
	 * already reads. Upstream publishes a second, GLOBAL `PromptInputProvider` so several composers
	 * can share one list and an outside menu can open the dialog; this port has none — the kit's
	 * context is per-form, so there is one list per `<PromptInput.Root>` and nothing to fall back
	 * to. `prompt-input.svelte` records that as a deliberate omission.
	 */
	get attachments(): PromptInputAttachmentsState {
		return this.#attachments;
	}

	readonly value: string = $derived(this.#props.getValue());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly clearOnSubmit: boolean = $derived(this.#props.getClearOnSubmit());

	/**
	 * Whether there is anything to send — what {@link submit} will accept.
	 *
	 * AN ATTACHMENT ALONE IS A MESSAGE. A photo with no words is a perfectly ordinary thing to
	 * send, so the whitespace-only refusal now only applies while nothing is attached.
	 */
	readonly submittable: boolean = $derived(
		this.value.trim().length > 0 || this.attachments.files.length > 0,
	);

	/**
	 * Whether an asynchronous `onSubmit` is still running. Stamped on the root as `data-pending`;
	 * a second submission while it is set is ignored, so Enter mashed during a slow request sends
	 * one message, not several copies of it.
	 */
	pending: boolean = $state(false);

	constructor(props: PromptInputStateProps) {
		this.#props = props;
		// Constructed here rather than by the root so there is one construction site for the
		// context, and so the attachments' destroy-time teardown is registered by the same
		// component-initialisation call that creates this instance.
		this.#attachments = new PromptInputAttachmentsState(props);
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
	 * wants, even when the submission is refused. The text and the attachment list are both read
	 * synchronously, before any `await`, so keystrokes and files that land during a slow handler
	 * are not what gets sent. A draft that is whitespace-only AND has nothing attached is refused
	 * without calling `onSubmit`.
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
	 * are always equal, so nothing changes there. The attachment list is cleared under the same
	 * condition, tested separately: editing the text does not keep a sent photo on screen, and
	 * attaching a new file does not keep the sent text.
	 *
	 * CLEARING THE ATTACHMENTS REVOKES THE URLS THE HANDLER WAS JUST GIVEN, which is the whole of
	 * the contract {@link PromptInputMessage.files} states: they are alive for the duration of the
	 * handler and no longer.
	 */
	async submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (this.disabled || this.pending) return;

		const text = this.#props.getValue();
		// A copy, not the live array: the handler must not be able to mutate the composer's list,
		// and `matches` below has to compare against what was actually sent.
		const files = [...this.attachments.files];
		if (text.trim() === "" && files.length === 0) return;

		const result = this.#props.getOnSubmit()({ text, files }, event);
		if (result instanceof Promise) {
			this.pending = true;
			try {
				await result;
			} finally {
				this.pending = false;
			}
		}
		if (!this.#props.getClearOnSubmit()) return;
		if (this.#props.getValue() === text) this.clear();
		if (this.attachments.matches(files.map((file) => file.id))) this.attachments.clear();
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

/**
 * Parity name for upstream's `usePromptInputAttachments`. Reaches the one list of the enclosing
 * composer; upstream's fallback to a global provider has no counterpart here, as
 * {@link PromptInputState.attachments} records.
 */
export function usePromptInputAttachments(): PromptInputAttachmentsState {
	return getPromptInputContext("`usePromptInputAttachments()`").attachments;
}
