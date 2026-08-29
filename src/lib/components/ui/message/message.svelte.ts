import { getContext, hasContext, setContext } from "svelte";
import { tv } from "tailwind-variants";
import type { StreamdownProps } from "svelte-streamdown";
import { cn } from "$lib/utils.js";
import { buttonVariants } from "$lib/components/ui/button/index.js";
import {
	codeBlockFilename,
	resolveCodeBlockLanguage,
} from "$lib/components/ui/code-block/index.js";
import { MESSAGE_ROLES, type MessageRole } from "$lib/shared/chat-parts.js";

/**
 * Normalise a possibly untyped runtime value to a known role.
 * Anything outside `MESSAGE_ROLES` (`$lib/shared/chat-parts.js`) falls back to `"assistant"` —
 * the column a transcript from an unknown author reads best in, because it is the wide one.
 */
export function resolveMessageRole(value?: string): MessageRole {
	return MESSAGE_ROLES.includes(value as MessageRole) ? (value as MessageRole) : "assistant";
}

/**
 * The turn's outer box: a full-width column that ALIGNS its content by role. The user's bubble
 * hugs the right edge, the assistant's prose the left.
 *
 * `group/message` is named rather than bare so a caller's own `group-hover` on a nested control
 * (a hover-revealed toolbar, say) can target the turn and nothing else. Upstream reaches the
 * role from descendants through `group-[.is-user]` class selectors; here the role travels on
 * context and as `data-from`, so the selector is `data-[from=user]` instead.
 */
export const messageVariants = tv({
	base: "group/message flex w-full flex-col gap-2 py-4",
	variants: {
		from: {
			user: "items-end",
			assistant: "items-start",
			// A system turn is rare on screen; when it is shown it takes the assistant's column.
			system: "items-start",
		},
	},
	defaultVariants: {
		from: "assistant",
	},
});

/**
 * The turn's body, keyed by the role `Message.Root` published.
 *
 * THE USER GETS A BUBBLE AND THE ASSISTANT DOES NOT — upstream's split, kept. A user turn is a
 * short thing the reader wrote and wants to recognise as their own, so it is boxed in the
 * secondary ground and capped at 80% of the column; an assistant turn is prose with tables and
 * code in it and needs the whole width. `text-secondary-foreground` rather than upstream's
 * `text-foreground` on the bubble because the kit's secondary pair is contrast-walked as a pair
 * and the page ink is not guaranteed to read on it in every palette.
 *
 * Upstream also flips the user bubble to the dark palette (`is-user:dark`); this kit's tokens
 * already give `secondary` a legible pair in both modes, so there is nothing to flip.
 *
 * `flex flex-col gap-2 min-w-0` are structural: a body holds a Response, a Tool and a Reasoning
 * stacked, and `min-w-0` is what lets a wide table inside scroll in its own box instead of
 * widening the column. `wrap-anywhere` breaks an unbroken token (a URL, a hash) that would
 * otherwise overflow the bubble.
 */
export const messageContentVariants = tv({
	base: "flex min-w-0 flex-col gap-2 text-sm leading-relaxed wrap-anywhere",
	variants: {
		from: {
			user: "ml-auto w-fit max-w-[80%] rounded-lg bg-secondary px-4 py-3 text-secondary-foreground",
			assistant: "w-full text-foreground",
			// Not the assistant speaking, so not the assistant's ink.
			system: "w-full text-muted-foreground",
		},
	},
	defaultVariants: {
		from: "assistant",
	},
});

/**
 * Reactive inputs for {@link MessageState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them.
 */
export type MessageStateProps = {
	/** Who authored the turn, already resolved through {@link resolveMessageRole}. */
	getRole: () => MessageRole;
};

/**
 * One instance per `<Message.Root>`. Published on context; `Message.Content` reads it to pick
 * its variant, and any part a caller writes may read it the same way.
 *
 * Context rather than a prop on every part, because the role is a property of the TURN and the
 * body should not have to be told twice — a `<Message.Content from="user">` inside a
 * `<Message.Root from="assistant">` is a contradiction the API should not be able to express.
 */
export class MessageState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: MessageStateProps;

	readonly role: MessageRole = $derived(this.#props.getRole());

	/** Whether the turn is the reader's own — the one that gets the bubble. */
	readonly isUser: boolean = $derived(this.role === "user");

	constructor(props: MessageStateProps) {
		this.#props = props;
	}
}

const MESSAGE_CONTEXT_KEY = Symbol("message");

export function setMessageContext(state: MessageState): MessageState {
	return setContext(MESSAGE_CONTEXT_KEY, state);
}

export function hasMessageContext(): boolean {
	return hasContext(MESSAGE_CONTEXT_KEY);
}

export function getMessageContext(part?: string): MessageState {
	if (!hasMessageContext()) {
		throw new Error(`${part ?? "`<Message>` part"} must be used within \`<Message.Root>\`.`);
	}
	return getContext<MessageState>(MESSAGE_CONTEXT_KEY);
}

/** Parity name for the selector-hook shape the other ports expose. Delegates to the getter. */
export function useMessage(): MessageState {
	return getMessageContext();
}

/**
 * Clamp a caller's branch index to something renderable.
 *
 * A count of `0` and an index that is not a finite number both resolve to `0`; a fractional index
 * is truncated. The clamp is READ-ONLY: `Message.Branch` never writes the corrected value back
 * into `branch`, so a caller whose index is briefly out of range — an array being rebuilt while a
 * new alternative streams in — gets the nearest branch rendered and keeps the value it wrote.
 * Upstream clamps nothing; an out-of-range index there renders an empty content box.
 */
export function clampBranchIndex(index: number, count: number): number {
	if (count <= 0 || !Number.isFinite(index)) return 0;
	return Math.min(Math.max(Math.trunc(index), 0), count - 1);
}

/**
 * Reactive inputs for {@link MessageBranchState}. Getters rather than values, the shape
 * {@link MessageStateProps} uses, so the class keeps tracking the root's props instead of
 * snapshotting them.
 */
export type MessageBranchStateProps = {
	/** The active index as the root's `branch` prop currently reads. */
	getBranch: () => number;
	/** Move to `index`, firing the root's `onBranchChange` on a real change and never otherwise. */
	setBranch: (index: number) => void;
	/** Whether stepping past an end wraps around to the other one. */
	getLoop: () => boolean;
};

/**
 * One instance per `<Message.Branch>`: which alternative answer is on screen, how many there are,
 * and the two steps between them. Published on context — `Message.BranchContent` writes the count,
 * and the selector, the two buttons and the counter read it.
 *
 * WHERE THE COUNT COMES FROM. Upstream turns its React children into an array
 * (`Children.toArray`) inside `MessageBranchContent` and pushes that array back up to the root.
 * Svelte has no inspectable children — a snippet is a render function, not a list — so
 * `Message.BranchContent` takes the alternatives as a `branches: Snippet[]` prop and publishes
 * `branches.length` here. That part's own comment states the choice and what it was weighed
 * against.
 *
 * The count is `$state` written by a child rather than `$derived` over the root's own props,
 * because the root does not hold the branches. It therefore arrives one flush after the render
 * that created it — the same lag `<Stepper.Item>`'s registration has in `ui/stepper` — and
 * nothing depends on the first pass: `Message.BranchSelector` renders nothing below two branches
 * and `Message.BranchPage` reads `0 of 0`, and both settle in the effect flush that follows the
 * mount.
 */
export class MessageBranchState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: MessageBranchStateProps;

	#count = $state(0);

	/** How many alternatives `Message.BranchContent` is holding. `0` until it has registered. */
	get count(): number {
		return this.#count;
	}

	/** The index actually rendered: the caller's `branch`, clamped by {@link clampBranchIndex}. */
	readonly activeIndex: number = $derived(clampBranchIndex(this.#props.getBranch(), this.count));

	/** The one-based position the counter prints, and `0` while there is nothing to count. */
	readonly position: number = $derived(this.count === 0 ? 0 : this.activeIndex + 1);

	/**
	 * Whether stepping back is possible: never with fewer than two branches, always while the root
	 * loops, and otherwise only away from the first. Upstream disables its buttons on the first test
	 * alone, because it always loops.
	 */
	readonly canGoPrevious: boolean = $derived(
		this.count > 1 && (this.#props.getLoop() || this.activeIndex > 0),
	);

	/** The mirror of {@link canGoPrevious} at the other end. */
	readonly canGoNext: boolean = $derived(
		this.count > 1 && (this.#props.getLoop() || this.activeIndex < this.count - 1),
	);

	constructor(props: MessageBranchStateProps) {
		this.#props = props;
	}

	/**
	 * Publish how many alternatives are being held. A write of the count already held is dropped, so
	 * a caller that rebuilds its snippet array on every render does not invalidate every reader.
	 *
	 * ONE `Message.BranchContent` PER `<Message.Branch>` is the contract: a second one overwrites
	 * the first one's count and the counter then describes the wrong part. Upstream has the same
	 * single-writer assumption and does not check it either.
	 */
	setCount(next: number): void {
		if (next === this.#count) return;
		this.#count = next;
	}

	/**
	 * Step back one alternative, wrapping to the last when the root loops. A no-op when
	 * {@link canGoPrevious} is false, which is also what disables `Message.BranchPrevious` — so the
	 * guard is only ever reached by a caller driving the state itself.
	 */
	goPrevious(): void {
		if (!this.canGoPrevious) return;
		this.#props.setBranch(this.activeIndex > 0 ? this.activeIndex - 1 : this.count - 1);
	}

	/** The mirror of {@link goPrevious}: forward one, wrapping to the first when the root loops. */
	goNext(): void {
		if (!this.canGoNext) return;
		this.#props.setBranch(this.activeIndex < this.count - 1 ? this.activeIndex + 1 : 0);
	}
}

const MESSAGE_BRANCH_CONTEXT_KEY = Symbol("message-branch");

export function setMessageBranchContext(state: MessageBranchState): MessageBranchState {
	return setContext(MESSAGE_BRANCH_CONTEXT_KEY, state);
}

export function hasMessageBranchContext(): boolean {
	return hasContext(MESSAGE_BRANCH_CONTEXT_KEY);
}

export function getMessageBranchContext(part?: string): MessageBranchState {
	if (!hasMessageBranchContext()) {
		throw new Error(
			`${part ?? "`<Message.Branch>` part"} must be used within \`<Message.Branch>\`.`,
		);
	}
	return getContext<MessageBranchState>(MESSAGE_BRANCH_CONTEXT_KEY);
}

/** Parity name for the selector-hook shape the other ports expose. Delegates to the getter. */
export function useMessageBranch(): MessageBranchState {
	return getMessageBranchContext();
}

/**
 * The shape of a Streamdown theme override — every group optional, every class inside it
 * optional. Reached through the props type rather than imported by name because
 * `svelte-streamdown` exports `Theme` but not its partial form.
 */
export type MessageResponseTheme = NonNullable<StreamdownProps["theme"]>;

/**
 * WHAT `Message.Response` PAINTS OVER STREAMDOWN'S SHADCN BASE THEME.
 *
 * The base theme (`shadcnTheme` in `svelte-streamdown`) already speaks in tokens almost
 * everywhere — `text-foreground`, `bg-muted`, `border-border` — so most of it is left alone.
 * What is overridden, and why:
 *
 * - THE ALERTS. The base paints `[!NOTE]`, `[!TIP]`, `[!WARNING]` and `[!IMPORTANT]` in raw
 *   `blue-600` / `green-600` / `yellow-600` / `purple-600`. Hard-coded hues survive exactly one
 *   palette and this kit ships twelve, so each is mapped to the status family whose meaning it
 *   carries: note → `info`, tip → `success`, warning → `warning`, caution → `destructive`,
 *   important → `primary`. The rule and the border take the raw token, because those are fills;
 *   the title takes the family's WALKED ink, `--{state}-subtle-foreground`, because the raw token
 *   is not type — `ui/code-block` and `ui/json-viewer` made the same call for the same reason
 *   (`codeBlockTokenVariants` in `code-block.svelte.ts` states the measurements). The ground
 *   stays `bg-card` so the callout reads as a card within the prose.
 * - THE TABLE. The base gives every cell a 200px minimum width, so a three-column table is never
 *   narrower than 600px — inside a chat column that is a horizontal scrollbar on every answer.
 *   Cells here are sized by their content, the head row is the kit's micro-label (`text-xs
 *   tracking-label uppercase text-muted-foreground`), and the frame is `rounded-md` like every
 *   block in the kit.
 *
 *   A KNOWN GAP, NOT A FIX: the frame keeps the base's `overflow-x-auto`, so a table wider
 *   than the column scrolls sideways in a `<div>` that has no `tabindex` — the region a
 *   keyboard-only reader cannot reach in Firefox or Safari (WCAG 2.1.1; axe
 *   `scrollable-region-focusable`), the one `code-block-content.svelte` fixes with
 *   `tabindex={0}`. A theme entry is classes only and cannot add an attribute. The way to add
 *   one is Streamdown's `table` snippet, but that snippet REPLACES the default table block, and
 *   the copy/download control the default draws (`TableDownload`) is not exported by the
 *   package (`svelte-streamdown/package.json` `exports` names `.`, `./code`, `./mermaid` and
 *   `./math` and nothing else), so taking over the block means redrawing that control by
 *   hand. Until the package exposes it, the gap stands and is stated here; cells sized by
 *   content (`min-w-0`) make the scroll rare, not impossible.
 * - THE BUTTONS Streamdown draws itself — the table's copy/download control — take the house
 *   `buttonVariants({ variant: "ghost", size: "icon-sm" })` string instead of a hand-rolled
 *   `w-6 h-6 rounded` chip, so they sit on the control ramp. The house string adds no
 *   `cursor-pointer` of its own (`docs/CONVENTIONS.md` §8: the base layer paints the hand on
 *   every `<button>`) — but the base's `cursor-pointer` SURVIVES the merge, because
 *   tailwind-merge drops a class only when the override supplies one from the same group and
 *   no cursor utility is supplied. It is harmless: it says what the `@layer base` rule already
 *   says. The base's `p-1` survives for the same reason; its `w-6 h-6` do not, because
 *   `size-(--control-h-sm)` is the same group and wins.
 * - THE POPOVER those buttons open takes the kit's popover surface.
 * - LINK, CODESPAN, BLOCKQUOTE and HR are restated in the kit's vocabulary: `underline-offset-3`
 *   on links as the gallery's own links have, a 2px rule on the quote rather than 4px, and the
 *   quote set upright — no other block in the kit italicises quoted prose, and `not-italic`
 *   has to be SAID because the base's `italic` would otherwise ride through the merge.
 *
 * Every entry is MERGED over the base with tailwind-merge (Streamdown's `mergeTheme`), so a
 * class here replaces the base's conflicting class and leaves the rest — `alert.note` below
 * does not have to repeat `relative my-4 p-4`. It cuts both ways: a base class nothing here
 * contradicts stays (`italic` on the quote, `cursor-pointer` on the button), so an override
 * that wants a base class GONE has to name its opposite.
 */
export const MESSAGE_RESPONSE_THEME = {
	link: {
		base: "text-primary underline underline-offset-3 hover:text-primary/80 wrap-anywhere",
	},
	codespan: {
		base: "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]",
	},
	blockquote: {
		base: "my-4 border-l-2 border-border pl-4 text-muted-foreground not-italic",
	},
	alert: {
		// The base already paints `bg-card`; restated so the callout's ground is pinned here,
		// where the rest of the alert mapping lives, should the base ever drift.
		base: "bg-card",
		note: "[&>[data-alert-title]]:text-info-subtle-foreground border-info stroke-info",
		tip: "[&>[data-alert-title]]:text-success-subtle-foreground border-success stroke-success",
		warning: "[&>[data-alert-title]]:text-warning-subtle-foreground border-warning stroke-warning",
		caution:
			"[&>[data-alert-title]]:text-destructive-subtle-foreground border-destructive stroke-destructive",
		important:
			"[&>[data-alert-title]]:text-primary-subtle-foreground border-primary stroke-primary",
	},
	table: {
		base: "my-4 overflow-x-auto rounded-md border border-border",
	},
	thead: {
		base: "bg-muted/50",
	},
	th: {
		base: "min-w-0 px-3 py-2 text-left text-xs font-medium tracking-label text-muted-foreground uppercase",
	},
	td: {
		base: "min-w-0 px-3 py-2 text-sm",
	},
	tr: {
		base: "border-border not-last:border-b",
	},
	hr: {
		base: "my-6 border-border",
	},
	components: {
		button: buttonVariants({ variant: "ghost", size: "icon-sm" }),
		popover: "rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md",
	},
} satisfies MessageResponseTheme;

type ThemeNode = { [key: string]: string | ThemeNode };

/**
 * Two theme trees, class by class. A string meeting a string is merged with `cn`, so the
 * caller's class beats the house class where they conflict and joins it where they do not; a
 * group meeting a group recurses (`inlineCitation` nests two levels); a key present on one side
 * only is kept as it is.
 */
function mergeThemeNodes(base: ThemeNode, custom: ThemeNode): ThemeNode {
	const merged: ThemeNode = { ...base };
	for (const key of Object.keys(custom)) {
		const baseValue = base[key];
		const customValue = custom[key];
		if (typeof customValue === "string") {
			merged[key] = typeof baseValue === "string" ? cn(baseValue, customValue) : customValue;
		} else if (customValue !== undefined) {
			merged[key] =
				typeof baseValue === "object" ? mergeThemeNodes(baseValue, customValue) : customValue;
		}
	}
	return merged;
}

/**
 * A caller's `theme` laid over {@link MESSAGE_RESPONSE_THEME}.
 *
 * WHY NOT STREAMDOWN'S OWN `mergeTheme`: that helper merges ONE override over one of the two
 * built-in bases, and there is no way to hand it a third layer. `Message.Response` needs three —
 * the shadcn base, the house mapping, the caller's tweak — so the last two are folded here into
 * a single partial, and Streamdown's merge (left at its default of `true`, over `baseTheme="shadcn"`)
 * lays that partial over the base. Same merge rule at both steps: tailwind-merge, last wins.
 *
 * Returns the house theme itself when there is nothing to merge, so the common case allocates
 * nothing per render.
 */
export function mergeMessageResponseTheme(theme?: MessageResponseTheme): MessageResponseTheme {
	if (!theme) return MESSAGE_RESPONSE_THEME;
	return mergeThemeNodes(
		MESSAGE_RESPONSE_THEME as ThemeNode,
		theme as ThemeNode,
	) as MessageResponseTheme;
}

/** The `title="x.ts"` / `filename=x.ts` forms some documentation tools put in a fence's info string. */
const FENCE_TITLE_ATTRIBUTE = /^(?:title|filename|file)=["']?([^"']+)["']?$/;

/** A bare word that reads as a filename: it has an extension and is not a `{1,3}` line-range. */
const FENCE_BARE_FILENAME = /^[^{}=\s"']+\.[A-Za-z0-9]+$/;

/**
 * The opening fence — three or more backticks or tildes, then the info string.
 *
 * THE WHITESPACE CLASSES ARE `[ \t]`, NOT `\s`, AND THAT IS THE WHOLE POINT. `\s` matches a
 * newline, so `\s*` after the backticks walked off the fence line and into the code, and the
 * capture became the FIRST WORD OF THE SNIPPET. That is not a corner case: marked reports
 * `lang: ""` for a fence carrying no info string, which is falsy, so {@link messageFenceInfo}
 * took this fallback for every bare ```` ``` ```` fence — the shape a model emits for a log, a
 * stack trace, command output. A log opening `plain text line` was then published as the
 * language `plain`: captioned `plain`, badged `plain`, downloaded as `snippet.plain`. An info
 * string cannot span lines, so neither may this.
 */
const FENCE_OPENING = /^[ \t]*(?:`{3,}|~{3,})[ \t]*([^\n]*)/;

/**
 * What a fence's info string says: its language word and, when it carries one, a filename.
 *
 * MARKED KEEPS THE WHOLE INFO STRING IN `lang`. For ```` ```csv models.csv ```` the token's `lang`
 * is `"csv models.csv"`, not `"csv"` — marked's fence tokenizer trims the string and stores it
 * entire (`svelte-streamdown/dist/marked/index.js`, `fences()`), and only its HTML renderer
 * takes the first word. So the language is the FIRST WORD, and everything after it is where a
 * filename lives. `raw` is the fallback source: a token built by hand without `lang` still opens
 * with its fence line.
 *
 * The filename is the second word when it is a bare `name.ext`, or the value of a
 * `title="…"` / `filename=…` attribute. A `{1,3}` line range or a `showLineNumbers` flag is
 * neither and yields no filename.
 */
export function messageFenceInfo(
	lang: string | undefined,
	raw = "",
): { language?: string; filename?: string } {
	const info = (lang?.trim() || FENCE_OPENING.exec(raw)?.[1] || "").trim();
	if (info === "") return {};

	const [language, ...rest] = info.split(/\s+/);
	for (const word of rest) {
		const attribute = FENCE_TITLE_ATTRIBUTE.exec(word);
		if (attribute) return { language, filename: attribute[1] };
		if (FENCE_BARE_FILENAME.test(word)) return { language, filename: word };
	}
	return { language };
}

/** The fence's language word alone — `"csv"` from `"csv models.csv"`. */
export function messageFenceLanguage(lang: string | undefined, raw = ""): string | undefined {
	return messageFenceInfo(lang, raw).language;
}

/**
 * The name a fenced block downloads under.
 *
 * A fence that names its file (```` ```csv customers.csv ````) downloads as that file. One that
 * names only a language downloads as `snippet.<ext>`, and the extension is the code block's own
 * answer: `resolveCodeBlockLanguage` canonicalises the fence's word (case, and every alias a model
 * writes) and `codeBlockFilename` settles the suffix, falling back to `txt` for a word that is not
 * even extension-shaped — a reader can rename a `.txt`, and cannot open a file with no extension
 * at all. A fence with NO language is a block of unknown content and yields `undefined`, which is
 * `CodeBlock.Root`'s cue to offer no download button.
 *
 * THERE USED TO BE A TABLE HERE. `MESSAGE_FENCE_EXTENSIONS` held the fourteen house grammars, the
 * formats a model is asked for that the house tokenizer does not know (`toml`, `xml`, `html`,
 * `svelte`) and the aliases models actually write (`yml`, `sh`, `py`, `javascript`, `typescript`,
 * `markdown`) — a second copy of knowledge that now has one home, since `ui/code-block` folds the
 * aliases itself and passes an extension-shaped id straight through. Twenty-six of its twenty-seven
 * keys resolve to exactly the name they did before; the twenty-seventh changes on purpose, because
 * there is now one answer rather than two — a ```` ```yml ```` fence saves as `snippet.yaml` rather
 * than `snippet.yml`, since `yml` canonicalises to the `yaml` grammar and `yaml` is that grammar's
 * house extension.
 */
export function messageFenceFilename(lang: string | undefined, raw: string): string | undefined {
	const { language, filename } = messageFenceInfo(lang, raw);
	if (!language) return undefined;
	if (filename) return filename;
	return codeBlockFilename(undefined, resolveCodeBlockLanguage(language));
}
