import { getContext, hasContext, setContext } from "svelte";
import { tv } from "tailwind-variants";

/**
 * Every language the highlighter knows, in upstream declaration order.
 */
export const CODE_BLOCK_LANGUAGES = [
	"tsx",
	"ts",
	"jsx",
	"js",
	"json",
	"css",
	"bash",
	"python",
	"curl",
	"text",
] as const;

/** Which grammar a snippet is highlighted against. */
export type CodeBlockLanguage = (typeof CODE_BLOCK_LANGUAGES)[number];

/**
 * Normalise a possibly untyped runtime value to a known language.
 * Anything outside {@link CODE_BLOCK_LANGUAGES} falls back to `"text"` — the member that claims
 * no grammar, so an unrecognised name degrades to plain code rather than to somebody else's rules.
 */
export function resolveCodeBlockLanguage(value?: string): CodeBlockLanguage {
	return CODE_BLOCK_LANGUAGES.includes(value as CodeBlockLanguage)
		? (value as CodeBlockLanguage)
		: "text";
}

/** One selectable snippet — upstream's `CodeBlockSnippet`. */
export type CodeBlockSnippet = {
	/**
	 * The grammar this snippet is highlighted against, and its IDENTITY in the selector: the
	 * language is what the selector's value carries and what `activeLanguage` names, so two
	 * snippets in one list may not share one. Upstream shares the constraint and is silent about
	 * it — two `bash` entries there produce a duplicate React key and a permanently unreachable
	 * second snippet. Here the selector's keyed `{#each}` raises Svelte's duplicate-key error
	 * instead, which says so.
	 */
	language: CodeBlockLanguage;
	/** Overrides {@link codeBlockLanguageLabels} in the selector and on the static tag. */
	label?: string;
	/** The snippet itself. Split on `\n`; every line is highlighted on its own. */
	code: string;
};

/** The selector's display name for each language. */
export const codeBlockLanguageLabels: Record<CodeBlockLanguage, string> = {
	tsx: "TSX",
	ts: "TypeScript",
	jsx: "JSX",
	js: "JavaScript",
	json: "JSON",
	css: "CSS",
	bash: "Shell",
	python: "Python",
	curl: "cURL",
	text: "Text",
};

/**
 * The words each language paints as keywords, kept verbatim.
 *
 * A KEYWORD LIST IS NOT A PARSER, and this one is upstream's published surface: it is exported
 * so a caller can see exactly what will light up, not so it can be mistaken for a grammar. Two
 * consequences worth stating rather than quietly fixing, because both are inherent to the
 * approach rather than defects in the table:
 *
 *   - a keyword is coloured wherever it appears, including as somebody's variable name — `as`
 *     and `in` are ordinary identifiers in plenty of correct code;
 *   - the CSS entries are bare property stems, and the token pattern admits `-` inside an
 *     identifier, so `background-color` is one token and matches none of them. `background`
 *     alone does. Widening the list to every hyphenated property is a dictionary, not a fix.
 */
export const codeBlockLanguageKeywords: Record<CodeBlockLanguage, readonly string[]> = {
	tsx: [
		"import",
		"from",
		"export",
		"function",
		"return",
		"const",
		"let",
		"type",
		"interface",
		"extends",
		"satisfies",
		"as",
	],
	ts: [
		"import",
		"from",
		"export",
		"function",
		"return",
		"const",
		"let",
		"type",
		"interface",
		"extends",
		"satisfies",
		"as",
	],
	jsx: ["import", "from", "export", "function", "return", "const", "let"],
	js: ["import", "from", "export", "function", "return", "const", "let"],
	json: ["true", "false", "null"],
	css: ["display", "grid", "flex", "color", "background", "border", "padding", "margin"],
	bash: ["npm", "npx", "pnpm", "bun", "cd", "cp", "ssh", "sudo"],
	python: [
		"import",
		"from",
		"def",
		"return",
		"if",
		"else",
		"for",
		"in",
		"with",
		"as",
		"True",
		"False",
		"None",
	],
	curl: ["curl", "GET", "POST", "PUT", "PATCH", "DELETE"],
	text: [],
};

/** How a language opens a comment. `block` is the slash-star form, matched to end of line only. */
export type CodeBlockCommentSyntax = "double-slash" | "hash" | "block";

/** How a language quotes a string. */
export type CodeBlockStringSyntax = "double" | "single" | "backtick";

/**
 * WHICH COMMENT SYNTAX EACH LANGUAGE ACTUALLY HAS — the theme's one substantive correction.
 *
 * Upstream compiles a single token pattern for every language, and that pattern always contains
 * both `//.*` and `#.*`. A marker the language does not have therefore
 * eats the rest of the line as ONE token, and what happens next depends on whether
 * `getTokenClass` recognises it — either way the line is wrong:
 *
 *   curl    `curl -s https://registry.example.com/r/status-page.json` — everything from the
 *           URL's `//` onward matches the comment rule and is greyed as a comment.
 *   python  `blocks = total // size` — floor division, greyed as a comment.
 *   css     `color: #fff; background: red;` — `#` claims the rest of the line, and since the class
 *           rule greys `#` only for shell and Python it comes out as one unstyled run: the second
 *           declaration, its keyword and every brace and semicolon after it lose their colour.
 *
 * Nothing about the fix is speculative: each language keeps exactly the markers it defines, and
 * the two that define none (JSON is comment-free by specification, `text` has no grammar) get
 * none. `curl` keeps `#` because a cURL sample is a shell line.
 *
 * A block comment is matched to its own closing marker when it has one, and to the end of the line
 * when it does not — see {@link COMMENT_PATTERNS}. What no table can fix is one that spans lines: a
 * highlighter colouring one line at a time cannot know it is inside a slash-star block that opened
 * three lines up, so the opening line greys and the continuation lines do not. That limit is the
 * architecture.
 */
export const CODE_BLOCK_COMMENT_SYNTAX: Record<
	CodeBlockLanguage,
	readonly CodeBlockCommentSyntax[]
> = {
	tsx: ["double-slash", "block"],
	ts: ["double-slash", "block"],
	jsx: ["double-slash", "block"],
	js: ["double-slash", "block"],
	json: [],
	css: ["block"],
	bash: ["hash"],
	python: ["hash"],
	curl: ["hash"],
	text: [],
};

/**
 * WHICH QUOTES EACH LANGUAGE ACTUALLY HAS — the same correction, applied to strings.
 *
 * Upstream's one pattern always offers all three quote forms, so a language that has none of
 * them still gets them. The damage is concentrated in `text`, whose whole promise is that it is
 * NOT code: two apostrophes anywhere in a sentence pair into a string, and `Don't stop, can't
 * stop` renders `'t stop, can'` in string green. JSON is the other case — the specification
 * admits the double quote and nothing else.
 *
 * `text` gets no markers at all, and {@link tokenizeCodeBlockLine} short-circuits a language with
 * no markers to a single plain run. A language labelled `Text`, whose keyword table upstream
 * leaves empty, should render as text.
 */
export const CODE_BLOCK_STRING_SYNTAX: Record<CodeBlockLanguage, readonly CodeBlockStringSyntax[]> =
	{
		tsx: ["double", "single", "backtick"],
		ts: ["double", "single", "backtick"],
		jsx: ["double", "single", "backtick"],
		js: ["double", "single", "backtick"],
		json: ["double"],
		css: ["double", "single"],
		bash: ["double", "single"],
		python: ["double", "single"],
		curl: ["double", "single"],
		text: [],
	};

/** Which languages paint a capitalised identifier as a type. */
const TYPE_CASED_LANGUAGES: readonly CodeBlockLanguage[] = ["tsx", "jsx", "ts", "js"];

/**
 * The token pattern's pieces, as `RegExp` literals so the escaping stays readable.
 *
 * The line-comment, string, identifier, number and punctuation pieces are upstream's, split apart
 * unchanged; the block-comment and custom-property pieces are this
 * port's, and each carries its reason where it is declared. The identifier class admits `-`, which
 * is what makes `background-color` a single token; the punctuation class is deliberately one
 * character wide, which is what {@link classifyCodeBlockToken}'s `^…$` test relies on.
 */
const COMMENT_PATTERNS: Record<CodeBlockCommentSyntax, string> = {
	"double-slash": /\/\/.*/.source,
	hash: /#.*/.source,
	// CLOSED FORM FIRST. A block comment that opens and shuts on one line ends at its `*/`, and only
	// an unterminated one runs to the end of the line. Written the other way round — the greedy
	// `\/\*.*` alone — `/* one */ color: red;` greys the declaration after the comment, which is a
	// worse answer than upstream's (it has no block-comment rule at all, so it colours the line as
	// code). The lazy `.*?` finds the FIRST `*/`, so two comments on one line stay two comments.
	block: /\/\*(?:.*?\*\/|.*)/.source,
};

const STRING_PATTERNS: Record<CodeBlockStringSyntax, string> = {
	double: /"(?:\\.|[^"\\])*"/.source,
	single: /'(?:\\.|[^'\\])*'/.source,
	backtick: /`(?:\\.|[^`\\])*`/.source,
};

/**
 * A CSS custom property, added by this theme.
 *
 * Upstream carries a rule for these that cannot fire: its token
 * pattern has no alternative that produces a token starting with `--`, because the identifier
 * alternative must start with `[A-Za-z_$]` and the punctuation alternative is a single
 * character. `--radius` arrives as `-`, `-`, `radius`, and the punctuation rule claims the two
 * dashes before the custom-property rule is ever reached. Adding the alternative is what makes
 * the rule upstream already wrote reachable.
 */
const CSS_CUSTOM_PROPERTY = /--[A-Za-z0-9_-]+/.source;

const IDENTIFIER = /\b[A-Za-z_$][A-Za-z0-9_$-]*\b/.source;
const NUMBER = /\b\d+(?:\.\d+)?\b/.source;
const PUNCTUATION = /[{}()[\].,;:<>/=+\-*|&!]/.source;

/** One character of {@link PUNCTUATION}, anchored — the classifier's own test (`:156`). */
const SINGLE_PUNCTUATION = /^[{}()[\].,;:<>/=+\-*|&!]$/;

/** JSON's three bare literals (`:144`). */
const JSON_LITERAL = /^(true|false|null)$/;

const tokenPatterns = new Map<CodeBlockLanguage, RegExp | null>();

/**
 * The scanner for one language, built once and cached. `null` for a language that declares no
 * markers at all, which {@link tokenizeCodeBlockLine} renders as one plain run.
 *
 * ORDER IS THE GRAMMAR. Comments come first so a `#` or a `//` claims the rest of the line
 * before anything inside it can be tokenised; the custom property comes before the punctuation
 * that would otherwise strip its leading dashes; strings come before identifiers so a keyword
 * inside a string stays a string.
 *
 * `matchAll` builds its own regex from this one, so a cached instance carries no `lastIndex`
 * between calls.
 */
function getCodeBlockTokenPattern(language: CodeBlockLanguage): RegExp | null {
	const cached = tokenPatterns.get(language);
	if (cached !== undefined) return cached;

	const comments = CODE_BLOCK_COMMENT_SYNTAX[language];
	const strings = CODE_BLOCK_STRING_SYNTAX[language];

	// A language with neither comments nor strings has no grammar worth scanning for: `text` is
	// the only member, and every alternative left would be a false positive on prose.
	if (comments.length === 0 && strings.length === 0) {
		tokenPatterns.set(language, null);
		return null;
	}

	const alternatives = [
		...comments.map((syntax) => COMMENT_PATTERNS[syntax]),
		...(language === "css" ? [CSS_CUSTOM_PROPERTY] : []),
		...strings.map((syntax) => STRING_PATTERNS[syntax]),
		IDENTIFIER,
		NUMBER,
		PUNCTUATION,
	];

	const pattern = new RegExp(`(${alternatives.join("|")})`, "g");
	tokenPatterns.set(language, pattern);
	return pattern;
}

/** Every kind a token can be classified as, in the order {@link classifyCodeBlockToken} tests them. */
export const CODE_BLOCK_TOKEN_KINDS = [
	"comment",
	"string",
	"literal",
	"keyword",
	"number",
	"type",
	"punctuation",
	"property",
	"plain",
] as const;

/** What a token is, which is what decides its ink. */
export type CodeBlockTokenKind = (typeof CODE_BLOCK_TOKEN_KINDS)[number];

/** One classified run of a line. Concatenating every `text` reproduces the line exactly. */
export type CodeBlockToken = {
	text: string;
	kind: CodeBlockTokenKind;
};

/** Whether `token` opens a comment in `language`. */
function isCodeBlockComment(token: string, language: CodeBlockLanguage): boolean {
	for (const syntax of CODE_BLOCK_COMMENT_SYNTAX[language]) {
		if (syntax === "double-slash" && token.startsWith("//")) return true;
		if (syntax === "hash" && token.startsWith("#")) return true;
		if (syntax === "block" && token.startsWith("/*")) return true;
	}
	return false;
}

/**
 * What a token is — upstream's `getTokenClass`, with the class names
 * replaced by kinds so the ink lives in one `tv()` instead of nine string literals.
 *
 * ONE RULE IS REORDERED. Upstream tests the keyword list before JSON's literals, and its
 * JSON keyword list is exactly `true`, `false`, `null` — so
 * the keyword branch always claims them and the literal branch below can never fire for any
 * input. The purple it reaches for is emitted nowhere in the component. Testing the literal
 * first is what makes upstream's own intent visible; the keyword table stays verbatim, since it
 * is the surface upstream publishes and JSON has no other keyword to lose.
 *
 * Everything else keeps upstream's order, including the custom-property rule sitting after the
 * punctuation rule. That position is harmless — punctuation only ever matches a single character
 * and `--x` is longer — and keeping it makes the two files diffable.
 */
export function classifyCodeBlockToken(
	token: string,
	language: CodeBlockLanguage,
): CodeBlockTokenKind {
	if (isCodeBlockComment(token, language)) return "comment";
	if (token.startsWith('"') || token.startsWith("'") || token.startsWith("`")) return "string";
	if (language === "json" && JSON_LITERAL.test(token)) return "literal";
	if (codeBlockLanguageKeywords[language].includes(token)) return "keyword";
	if (/^\d/.test(token)) return "number";
	if (/^[A-Z]/.test(token) && TYPE_CASED_LANGUAGES.includes(language)) return "type";
	if (SINGLE_PUNCTUATION.test(token)) return "punctuation";
	if (language === "css" && token.startsWith("--")) return "property";
	return "plain";
}

/**
 * One line, split into classified runs — upstream's `highlightLine`.
 *
 * The gaps BETWEEN matches are emitted as `plain` tokens rather than dropped, which is what
 * makes the concatenation of every `text` equal to the input: whitespace, and any character no
 * alternative claims, survives in place. Upstream pushes those gaps as bare strings, which comes
 * to the same rendering and gives the caller nothing to iterate over.
 */
export function tokenizeCodeBlockLine(line: string, language: CodeBlockLanguage): CodeBlockToken[] {
	const pattern = getCodeBlockTokenPattern(language);
	if (!pattern) return [{ text: line, kind: "plain" }];

	const tokens: CodeBlockToken[] = [];
	let cursor = 0;

	for (const match of line.matchAll(pattern)) {
		const text = match[0];
		const index = match.index ?? 0;

		if (index > cursor) tokens.push({ text: line.slice(cursor, index), kind: "plain" });
		tokens.push({ text, kind: classifyCodeBlockToken(text, language) });
		cursor = index + text.length;
	}

	if (cursor < line.length) tokens.push({ text: line.slice(cursor), kind: "plain" });
	return tokens;
}

/**
 * Per-kind ink.
 *
 * UPSTREAM PAINTS THESE WITH RAW PALETTE COLOURS: strings
 * `green-700/green-300` and `emerald-700/emerald-300` in JSON, keywords `sky-700/sky-300`,
 * numbers `amber-700/amber-300`, JSON literals `purple-700/purple-300`, capitalised identifiers
 * `violet-700/violet-300`. Hard-coded hues survive exactly one palette and this kit ships
 * twelve, so each is mapped to the semantic family whose hue it matches — and to that family's
 * WALKED ink, `--{state}-subtle-foreground` rather than the raw status token, because the raw
 * token is a fill: `--warning` is `#f5c042`, which as type on this ground measures about 1.6:1.
 * `ui/json-viewer` made the same mapping for the same reason, from the same five families, on the
 * same rule — the walked ink, never the raw token.
 *
 * THE TWO DO NOT AGREE CONSTRUCT FOR CONSTRUCT, and cannot: json-viewer PARSES, so it knows a
 * `true` is a boolean (info) and a `null` is a null (muted) and a quoted name is a key (primary).
 * A scanner sees three tokens and no structure. Here JSON's three bare literals are one `literal`
 * bucket, which is what upstream's own rule means by them, and a key is what it lexically is — a
 * string. The palette is shared; the parse is not. What must not differ is the RULE, and it does
 * not: no raw status token is ever spent as type on either surface.
 *
 *   comment      muted-foreground -> unchanged, it was already a token
 *   string       green / emerald  -> success-subtle-foreground
 *   keyword      sky              -> info-subtle-foreground
 *   number       amber            -> warning-subtle-foreground
 *   literal      purple           -> primary-subtle-foreground
 *   type         violet           -> primary-subtle-foreground
 *   property     purple           -> primary-subtle-foreground
 *   punctuation  muted-foreground -> unchanged
 *
 * TWO UPSTREAM DISTINCTIONS COLLAPSE HERE, and both are meant to. Emerald and green differ by
 * about ten degrees of hue and upstream spends them on "a string in JSON" versus "a string
 * anywhere else", which is not a distinction a reader can act on. Violet and purple likewise:
 * they mark a capitalised identifier and a JSON literal, and no language reaches both rules —
 * the type rule is restricted to the JS family and the literal rule to JSON. One family for
 * each pair loses nothing that was legible.
 */
export const codeBlockTokenVariants = tv({
	base: "",
	variants: {
		kind: {
			comment: "text-muted-foreground",
			string: "text-success-subtle-foreground",
			keyword: "text-info-subtle-foreground",
			literal: "text-primary-subtle-foreground",
			number: "text-warning-subtle-foreground",
			type: "text-primary-subtle-foreground",
			property: "text-primary-subtle-foreground",
			punctuation: "text-muted-foreground",
			plain: "text-foreground",
		},
	},
	defaultVariants: {
		kind: "plain",
	},
});

/**
 * Reactive inputs for {@link CodeBlockState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them.
 */
export type CodeBlockStateProps = {
	/** The resolved snippet list — never empty; the root wraps a bare `code` into one entry. */
	getSnippets: () => readonly CodeBlockSnippet[];
	/** The language the caller currently wants shown. */
	getActiveLanguage: () => CodeBlockLanguage;
	/** Called when the selector picks another language. */
	setActiveLanguage: (language: CodeBlockLanguage) => void;
	/** Whether the gutter renders. */
	getShowLineNumbers: () => boolean;
	/** Whether more than one snippet may be switched between. */
	getAllowLanguageSelection: () => boolean;
	/** The caption in the header. */
	getLabel: () => string;
};

/**
 * One instance per `<CodeBlock.Root>`. Published on context; every part reads it.
 *
 * THE ACTIVE SNIPPET IS RESOLVED, NOT STORED. Upstream keeps `activeLanguage` in `useState` and
 * falls back to `availableSnippets[0]` when it names nothing — so a
 * `snippets` prop that changes to a set without the selected language renders the first snippet
 * underneath a selector still displaying the old one. Here every part reads
 * {@link CodeBlockState.activeLanguage}, which is the language of the snippet actually on
 * screen, so the two cannot disagree.
 */
export class CodeBlockState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: CodeBlockStateProps;

	readonly snippets: readonly CodeBlockSnippet[] = $derived(this.#props.getSnippets());
	readonly showLineNumbers: boolean = $derived(this.#props.getShowLineNumbers());
	readonly label: string = $derived(this.#props.getLabel());

	/** The snippet on screen: the requested language, or the first one when it names nothing. */
	readonly activeSnippet: CodeBlockSnippet | undefined = $derived(
		this.snippets.find((snippet) => snippet.language === this.#props.getActiveLanguage()) ??
			this.snippets[0],
	);

	/**
	 * What is actually rendered — the selector's value, so it can never show a missing entry.
	 *
	 * Resolved rather than taken. The tokenizer indexes three per-language tables, so a snippet
	 * carrying a language outside the union — which TypeScript forbids and untyped JavaScript does
	 * not — would throw where upstream's single pattern merely mis-highlighted. It degrades to
	 * `text`, which is the member that claims no grammar.
	 */
	readonly activeLanguage: CodeBlockLanguage = $derived(
		resolveCodeBlockLanguage(this.activeSnippet?.language),
	);
	readonly activeCode: string = $derived(this.activeSnippet?.code ?? "");

	/** The active snippet's own label, or its language's. */
	readonly activeLabel: string = $derived(
		this.activeSnippet?.label ?? codeBlockLanguageLabels[this.activeLanguage],
	);

	/**
	 * The rows the content renders.
	 *
	 * TWO NORMALISATIONS upstream does not do, both of which show up in
	 * ordinary use rather than in edge cases. A snippet authored as a template literal almost
	 * always ends in a newline, and `split` turns that into a final empty row with its own line
	 * number — a numbered blank line at the end of every block. And a `code` string that came from
	 * a CRLF file keeps its `\r`, which no alternative matches and which `white-space: pre` treats
	 * as a segment break, so every row is followed by a blank one.
	 *
	 * Only ONE trailing newline is dropped: two of them are a deliberate blank last line, and a
	 * component that swallows the author's spacing is worse than one that shows an extra row.
	 * {@link CodeBlockState.copyText} is untouched by any of this — the clipboard gets what the
	 * caller passed.
	 */
	readonly lines: string[] = $derived(
		this.activeCode.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n"),
	);

	/** Whether the header renders a selector rather than a static tag. */
	readonly selectable: boolean = $derived(
		this.#props.getAllowLanguageSelection() && this.snippets.length > 1,
	);

	constructor(props: CodeBlockStateProps) {
		this.#props = props;
	}

	/** Show another snippet. Ignores a language the current list does not carry. */
	select(language: CodeBlockLanguage): void {
		if (!this.snippets.some((snippet) => snippet.language === language)) return;
		this.#props.setActiveLanguage(language);
	}

	/** What the copy button writes: the active snippet's code, exactly as the caller supplied it. */
	copyText(): string {
		return this.activeCode;
	}

	/** One line, classified for the language currently on screen. */
	tokenize(line: string): CodeBlockToken[] {
		return tokenizeCodeBlockLine(line, this.activeLanguage);
	}
}

const CODE_BLOCK_CONTEXT_KEY = Symbol("code-block");

export function setCodeBlockContext(state: CodeBlockState): CodeBlockState {
	return setContext(CODE_BLOCK_CONTEXT_KEY, state);
}

export function hasCodeBlockContext(): boolean {
	return hasContext(CODE_BLOCK_CONTEXT_KEY);
}

export function getCodeBlockContext(part?: string): CodeBlockState {
	if (!hasCodeBlockContext()) {
		throw new Error(`${part ?? "`<CodeBlock>` part"} must be used within \`<CodeBlock.Root>\`.`);
	}
	return getContext<CodeBlockState>(CODE_BLOCK_CONTEXT_KEY);
}

/** Parity name for the selector-hook shape the other ports expose. Delegates to the getter. */
export function useCodeBlock(): CodeBlockState {
	return getCodeBlockContext();
}
