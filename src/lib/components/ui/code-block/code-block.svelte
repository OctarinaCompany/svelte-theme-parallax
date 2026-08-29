<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { CodeBlockLanguage, CodeBlockSnippet } from "./code-block.svelte.js";

	export type CodeBlockRootProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	> & {
		/** A single snippet's code. Ignored when {@link CodeBlockRootProps.snippets} is non-empty. */
		code?: string;
		/**
		 * The grammar {@link CodeBlockRootProps.code} is highlighted against.
		 * @default "tsx"
		 */
		language?: CodeBlockLanguage;
		/**
		 * Several snippets of the same thing, switchable from the header. Languages must be unique
		 * — the language is a snippet's identity here, as it is upstream.
		 */
		snippets?: CodeBlockSnippet[];
		/**
		 * Which snippet opens. A SEED for `activeLanguage`, read once; changing it later leaves the
		 * reader's own choice alone.
		 * @default the first snippet's language
		 */
		defaultLanguage?: CodeBlockLanguage;
		/**
		 * The snippet on screen. Bind it to drive the block from outside, or to follow the reader's
		 * choice. A language the current list does not carry falls back to the first snippet.
		 */
		activeLanguage?: CodeBlockLanguage;
		/** Fired when the selector picks another language, never for a parent-driven write. */
		onActiveLanguageChange?: (language: CodeBlockLanguage) => void;
		/**
		 * The caption in the header — a filename, a request name, whatever names the payload.
		 * @default "Code"
		 */
		label?: string;
		/**
		 * The line-number gutter.
		 * @default true
		 */
		showLineNumbers?: boolean;
		/**
		 * Whether more than one snippet may be switched between. With this off, or with a single
		 * snippet, the header shows the language as a static tag instead.
		 * @default true
		 */
		allowLanguageSelection?: boolean;
		/**
		 * The name the snippet downloads under. PRESENCE IS THE AFFORDANCE: set it and the header
		 * shows a download button; leave it out and there is none.
		 *
		 * A name with an extension is used as it is, whatever language is on screen. One without an
		 * extension is replaced by `snippet.<ext>` for the active language (`CODE_BLOCK_EXTENSIONS`)
		 * and so follows the selector — `snippet.tsx`, then `snippet.py` once Python is on screen —
		 * where `request.tsx` would not. The result is sanitised: path separators become dashes
		 * (`src/app.css` saves as `src-app.css`, because a browser reads a separator in `download`
		 * as a directory hint), the punctuation Windows reserves is stripped, and a name with nothing
		 * left falls back to `snippet.<ext>`.
		 */
		filename?: string;
		/**
		 * The MIME type the download is stamped with. Ignored unless
		 * {@link CodeBlockRootProps.filename} is set — without a name there is no download button to
		 * stamp.
		 * @default the active language's entry in `CODE_BLOCK_MEDIA_TYPES`
		 */
		mediaType?: string;
		/**
		 * Fired after the download button has handed the file to the browser, with the sanitised
		 * name it was saved under. On the root because the root renders its own header: a caller
		 * has no other way to reach the button.
		 */
		onDownload?: (filename: string) => void;
	};

	/** Alias of {@link CodeBlockRootProps}, present for parity with the upstream type name. */
	export type CodeBlockProps = CodeBlockRootProps;
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import CodeBlockContent from "./code-block-content.svelte";
	import CodeBlockHeader from "./code-block-header.svelte";
	import { CodeBlockState, setCodeBlockContext } from "./code-block.svelte.js";

	/**
	 * A copyable code sample with a line-number gutter, a language selector and lightweight
	 * language-aware highlighting.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART — its documentation renders its own samples as `<pre>` blocks
	 * styled by the docs stylesheet, not as a component. What there is to theme is the token ramp:
	 * this is the second place in the kit, after `ui/json-viewer`, where four coloured families are
	 * asked to work as TYPE rather than as fills. Both draw from the same five families under the
	 * same rule — the walked `--{state}-subtle-foreground`, never the raw status token. They do not
	 * agree construct for construct, and `codeBlockTokenVariants` in `code-block.svelte.ts` says
	 * why: one parses its payload and this one does not.
	 *
	 * SEVEN THINGS DIVERGE FROM UPSTREAM:
	 *
	 * 1. THE GROUND IS `bg-muted/50`, NOT `bg-card`. Upstream paints the block in the card colour
	 *    with a `bg-muted/30` header bar (`code-block.tsx:265`, `:269`). Every demo in this kit puts
	 *    a code block inside a Card, and card-on-card is invisible; `ui/json-viewer` rejected the
	 *    equivalent upstream ground for exactly this reason and landed on `bg-muted/50`. With the
	 *    whole block already tinted, the header needs no second tint — a rule alone separates it.
	 *
	 * 2. THE HEIGHT IS ON THE ROOT. Upstream splits it: `max-h-[28rem]` lives on the `<pre>` and a
	 *    `contentClassName` prop exists to change it. Here the root is a
	 *    flex column carrying `max-h-112` — the same 28rem — and the content fills what is left, so
	 *    one `class` sets the height of the object a reader actually sees. That is how
	 *    `ui/json-viewer` is sized too, except that it carries no default at all and leaves every
	 *    caller to set one; a code block that grows to a thousand rows is worse than one that
	 *    scrolls, so the default stays. `contentClassName` has no counterpart and is not missed.
	 *
	 * 3. THE STATIC LANGUAGE TAG IS A `Badge`. Upstream hand-rolls it out of utilities
	 *    (`rounded-md border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground`,
	 *    `:297`). This kit has the object that describes — a small labelled chip — so it takes
	 *    `Badge variant="outline"` rather than a ninth spelling of one. It is a different SHAPE
	 *    (Badge is the house pill, `rounded-4xl h-5`, in page ink rather than muted); a tag that
	 *    does not look like every other tag in the kit is the worse trade.
	 *
	 * 4. THE SELECTOR IS `size="sm"`, NOT `h-7`. Upstream asks for `size="sm"` and then overrides
	 *    the height to 28px (`:282`). The house control ramp is xs 24 / sm 32 / default 40 / lg 48
	 *    (`docs/CONVENTIONS.md` §3) and a registry component does not get a utility-class rung of
	 *    its own, so the selector is 32px.
	 *
	 * 5. THE COPY ICONS DO NOT CROSS-FADE. Upstream stacks both glyphs under `t-icon-swap` /
	 *    `t-icon` classes (`:308-319`); its registry item ships one file and no CSS, so those two
	 *    classes name nothing in any project that installs the component and both glyphs render at
	 *    once. The receipt is an `{#if}`, as in `ui/json-viewer`'s toolbar.
	 *
	 * 6. THE HIGHLIGHTER IS FIXED, not merely translated. Six upstream rules produced wrong output
	 *    — `//` read as a comment inside an unquoted URL and in Python's floor division, `#`
	 *    swallowing the rest of the line in CSS and TSX, no block-comment rule at all, apostrophes
	 *    pairing into strings in prose, and two branches that could never fire. Each fix, and the
	 *    reason it is a fix rather than a preference, is written over the table it belongs to in
	 *    `code-block.svelte.ts`.
	 *
	 * 7. THERE IS A DOWNLOAD BUTTON, which upstream does not have. Set `filename` and the header
	 *    offers to save the active snippet as a file, stamped with the language's MIME type or the
	 *    caller's `mediaType`. Presence of the name is the whole switch — no separate boolean —
	 *    because a download without a name to save under is not an affordance a reader can use.
	 *    The root takes an `onDownload` receipt of its own as well as the button: the root renders
	 *    its own header and `CodeBlockRootProps` is `WithoutChildren`, so a caller has no other way
	 *    to reach the button's hook — one click fires the root's, then the button's. The mechanics
	 *    are `$lib/shared/download-text.js`, shared with `Conversation.Download`
	 *    (`ui/conversation/conversation-download.svelte`).
	 *
	 * SMALLER ONES, recorded so they are not read as oversights: the code is `text-sm` and the
	 * corner `rounded-md`, matching `ui/json-viewer` rather than upstream's `text-xs` and
	 * `rounded-lg`; the gutter is `aria-hidden` and the content is focusable, neither of which
	 * upstream does; and the root carries `data-language`, the language actually on screen, and
	 * `data-downloadable` when a filename is set, because every other component in this kit
	 * publishes its state as data attributes and these are that state.
	 *
	 * WHAT IS NOT FIXED, because it is the approach rather than a defect: highlighting runs one
	 * line at a time, so no construct that spans lines — a block comment, a multi-line template
	 * literal, a docstring — is coloured past its first line; and a keyword list is not a parser,
	 * so a keyword used as an identifier still lights up.
	 */
	let {
		ref = $bindable(null),
		class: className,
		code,
		language = "tsx",
		snippets,
		defaultLanguage,
		activeLanguage = $bindable(),
		onActiveLanguageChange,
		label = "Code",
		showLineNumbers = true,
		allowLanguageSelection = true,
		filename,
		mediaType,
		onDownload,
		...restProps
	}: CodeBlockRootProps = $props();

	/** Upstream's `availableSnippets` memo: a bare `code` is one entry. */
	const resolvedSnippets = $derived(snippets?.length ? snippets : [{ language, code: code ?? "" }]);

	// Upstream's `initialLanguage`, read through `untrack` so it is
	// unambiguously a seed: nothing here subscribes to `defaultLanguage` or to the snippet list.
	activeLanguage ??= untrack(
		() => defaultLanguage ?? (snippets?.length ? snippets[0].language : language),
	);

	const state = new CodeBlockState({
		getSnippets: () => resolvedSnippets,
		getActiveLanguage: () => activeLanguage ?? language,
		setActiveLanguage: (next) => {
			activeLanguage = next;
			onActiveLanguageChange?.(next);
		},
		getShowLineNumbers: () => showLineNumbers,
		getAllowLanguageSelection: () => allowLanguageSelection,
		getLabel: () => label,
		getFilename: () => filename,
		getMediaType: () => mediaType,
		notifyDownload: (name) => onDownload?.(name),
	});

	setCodeBlockContext(state);
</script>

<!--
	`role="group"` + `aria-label` so the block is one named object rather than a caption, a
	selector, a button and a wall of text that happen to be adjacent. Without it the copy button
	announces as "Copy code" with nothing saying WHICH code, which on a page of five blocks is no
	answer at all. Both sit before `restProps`, so a caller can still override either.
-->
<div
	bind:this={ref}
	data-slot="code-block"
	data-language={state.activeLanguage}
	data-downloadable={state.filename !== undefined ? "" : undefined}
	role="group"
	aria-label={state.label}
	class={cn(
		"flex max-h-112 w-full flex-col overflow-hidden rounded-md border bg-muted/50 text-foreground",
		className,
	)}
	{...restProps}
>
	<CodeBlockHeader />
	<CodeBlockContent />
</div>
