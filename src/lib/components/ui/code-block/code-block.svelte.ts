import { getContext, hasContext, setContext } from "svelte";
import { tv } from "tailwind-variants";
import { downloadText, sanitiseFilename } from "$lib/shared/download-text.js";

/**
 * Every language the HOUSE TOKENIZER knows: upstream's ten in its declaration order, then the
 * four this theme adds, appended rather than interleaved so the first half stays diffable against
 * upstream.
 *
 * IT IS NOT THE SET OF IDS A CALLER MAY NAME. {@link CodeBlockLanguageId} is that set — any word
 * at all — and this tuple is what the six tables below stay exhaustive over: the grammars this
 * file can paint unaided. Any other id renders as plain text under its own name until a
 * {@link CodeBlockHighlighter} is installed above the block.
 *
 * WHY THESE FOUR. They are the formats a reader is handed AS A FILE rather than as a sample —
 * `csv` and `yaml` are what a dashboard exports and configures with, `sql` is the query behind a
 * table, `md` is what a chat answer is written in — and each one arriving here rather than
 * falling back to `text` is what gives it a name in the header, a real MIME type in
 * {@link CODE_BLOCK_MEDIA_TYPES} and an extension in {@link CODE_BLOCK_EXTENSIONS}. Before them a
 * ```` ```csv customers.csv ```` fence in a message rendered under the label `Text` and saved as
 * `text/plain`.
 *
 * Markup languages are deliberately NOT here. `html` and `xml` would take a label and a MIME type
 * and gain nothing else: the line tokeniser has no tag rule, so a tag would come out as
 * punctuation and identifiers, and giving one a rule is writing a parser rather than extending a
 * table. They are still legal ids — `language="html"` keeps its name in the header and downloads
 * as `snippet.html`; what it does not get from this file is colour.
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
	"csv",
	"md",
	"sql",
	"yaml",
] as const;

/** One of the fourteen grammars the house tokenizer carries. */
export type CodeBlockLanguage = (typeof CODE_BLOCK_LANGUAGES)[number];

/**
 * ANY language a caller may name — the fourteen above, or a grammar somebody else knows.
 *
 * `(string & {})` rather than a bare `string`, which would swallow the literal union and leave an
 * editor with nothing to suggest. The distinction it draws is the one this component now rests
 * on: the fourteen are what the house tokenizer paints and what the six per-language tables are
 * exhaustive over, and every other id is a legal value that reaches
 * {@link codeBlockLanguageLabel}, {@link codeBlockExtension} and {@link codeBlockMediaType}
 * instead of a table index.
 */
export type CodeBlockLanguageId = CodeBlockLanguage | (string & {});

/** Whether `value` is one of the fourteen — the test that decides house grammar or no grammar. */
export function isCodeBlockLanguage(value: string): value is CodeBlockLanguage {
	return CODE_BLOCK_LANGUAGES.includes(value as CodeBlockLanguage);
}

/**
 * One entry of a string-keyed table, or `undefined` — the OWN property only.
 *
 * An object literal inherits `Object.prototype`, so a bare `table[key]` answers a function for
 * `constructor` or `toString` and the prototype object for `__proto__`. These tables are indexed
 * with whatever word a fence's info string carried, so the guard is not theoretical.
 */
function ownEntry<T extends string>(table: Record<string, T>, key: string): T | undefined {
	return Object.hasOwn(table, key) ? table[key] : undefined;
}

/**
 * Other spellings of a language, folded onto the id this component canonicalises to.
 *
 * WHY IT EXISTS. {@link resolveCodeBlockLanguage} used to NARROW — anything outside the fourteen
 * became `text` — so a ```` ```javascript ```` fence in a chat answer rendered captioned
 * `javascript`, badged `Text` and uncoloured, while a ```` ```js ```` fence two messages later was
 * coloured. The language word is what a model or an author writes, not what this tuple happens to
 * spell.
 *
 * TWO GROUPS, ONE RULE: the id on the right is the canonical one.
 *   - For a grammar the house knows, canonical is the HOUSE id, so the long spellings fold onto
 *     the short ones (`javascript` -> `js`, `yml` -> `yaml`, `sh` -> `bash`).
 *   - For one it does not, canonical is the name Shiki registers the grammar under, so an adapter
 *     over the {@link CodeBlockHighlighter} seam can pass the id straight to its loader instead of
 *     carrying a second alias table. Read out of `@shikijs/langs` rather than remembered — it is
 *     a dependency of `svelte-streamdown`, which is what `Message.Response` renders Markdown with:
 *     `rust` lists alias `rs`, `csharp` lists `c#` and `cs`, `kotlin` lists `kt` and `kts`,
 *     `objective-c` lists `objc`, `graphql` lists `gql`, `cpp` lists `c++`, `mermaid` lists
 *     `mmd`, `powershell` lists `ps` and `ps1`. `dockerfile` is the one inversion: Shiki registers
 *     `docker` and lists `dockerfile` as ITS alias, and resolves either, so the longer
 *     self-describing spelling is kept because it is also the better label for a header.
 *
 * Keys are lower-case because the lookup lower-cases. No value is also a key, which is what makes
 * {@link resolveCodeBlockLanguage} idempotent: resolving an already-resolved id returns it.
 */
export const CODE_BLOCK_LANGUAGE_ALIASES: Record<string, CodeBlockLanguageId> = {
	javascript: "js",
	typescript: "ts",
	py: "python",
	sh: "bash",
	shell: "bash",
	shellscript: "bash",
	zsh: "bash",
	yml: "yaml",
	markdown: "md",
	txt: "text",
	plaintext: "text",
	rs: "rust",
	rb: "ruby",
	kt: "kotlin",
	kts: "kotlin",
	cs: "csharp",
	"c#": "csharp",
	"c++": "cpp",
	golang: "go",
	ps: "powershell",
	ps1: "powershell",
	pwsh: "powershell",
	docker: "dockerfile",
	gql: "graphql",
	patch: "diff",
	htm: "html",
	objc: "objective-c",
	mmd: "mermaid",
};

/**
 * Canonicalise a language word: trim, lower-case, then fold through
 * {@link CODE_BLOCK_LANGUAGE_ALIASES}.
 *
 * IT NORMALISES, IT DOES NOT NARROW — the whole point of the rewrite. Only a blank or absent value
 * becomes `text`; an id the house has no grammar for passes through as itself, so it keeps its
 * name in the header, an extension of its own in the download, and its chance of being painted by
 * an installed {@link CodeBlockHighlighter}. Which ids the house can actually tokenise is decided
 * later and separately, by {@link CodeBlockState.grammar}.
 */
export function resolveCodeBlockLanguage(value?: string): CodeBlockLanguageId {
	const id = value?.trim().toLowerCase() ?? "";
	if (id === "") return "text";
	return ownEntry(CODE_BLOCK_LANGUAGE_ALIASES, id) ?? id;
}

/** One selectable snippet — upstream's `CodeBlockSnippet`. */
export type CodeBlockSnippet = {
	/**
	 * The language this snippet is written in, and its IDENTITY in the selector: it is what the
	 * selector's value carries and what `activeLanguage` names, so two snippets in one list may not
	 * share one. Upstream shares the constraint and is silent about
	 * it — two `bash` entries there produce a duplicate React key and a permanently unreachable
	 * second snippet. Here the selector's keyed `{#each}` raises Svelte's duplicate-key error
	 * instead, which says so. The comparison is made on the CANONICAL id — `<CodeBlock.Root>` runs
	 * every entry through {@link resolveCodeBlockLanguage} before the state sees it — so
	 * `JavaScript` and `js` are one language here, and listing both is the duplicate that error
	 * names.
	 */
	language: CodeBlockLanguageId;
	/** Overrides the language's label in the selector and on the static tag. */
	label?: string;
	/**
	 * The snippet itself. Split on `\n`; the house tokenizer paints each line on its own, and an
	 * installed {@link CodeBlockHighlighter} is handed the whole thing at once.
	 */
	code: string;
};

/**
 * The selector's display name for each of the fourteen. {@link codeBlockLanguageLabel} is how a
 * wider id reads it.
 */
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
	csv: "CSV",
	md: "Markdown",
	sql: "SQL",
	yaml: "YAML",
};

/**
 * The label for any language id: {@link codeBlockLanguageLabels} for the fourteen, the id itself
 * for everything else.
 *
 * THE ID IS ITS OWN LABEL because there is nothing better to show. A foreign id arrives already
 * lower-cased and canonical, and `rust` over a block of Rust is what its author wrote; a second
 * casing table would have to be maintained beside this one and would disagree with it within a
 * month. A caller who wants `Rust` writes `label` on the snippet, which wins over both.
 */
export function codeBlockLanguageLabel(language: CodeBlockLanguageId): string {
	return isCodeBlockLanguage(language) ? codeBlockLanguageLabels[language] : language;
}

/**
 * The MIME type a downloaded snippet is stamped with, per language — what `CodeBlock.DownloadButton`
 * hands to `downloadText` when the root sets no `mediaType` of its own.
 *
 * Every entry carries `;charset=utf-8`: the Blob is built from a JavaScript string, which the
 * Blob constructor encodes as UTF-8, and a type without the parameter leaves the consumer to
 * guess (https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob).
 *
 * TYPESCRIPT IS `text/plain`, NOT A TYPE OF ITS OWN. No registered MIME type exists for it, and
 * the one servers commonly infer from a `.ts` extension is `video/mp2t` — MPEG transport stream
 * (https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types/Common_types). Stamping a
 * source file as video is worse than stamping it as text; the extension in
 * {@link CODE_BLOCK_EXTENSIONS} is what tells an editor what it is. JavaScript and JSX take
 * `text/javascript`, the type the HTML standard designates for scripts. cURL is a shell line but
 * not a script, so it stays plain.
 *
 * THE FOUR HOUSE LANGUAGES ALL HAVE A REGISTERED TYPE, which is half the reason they are in the
 * tuple: `text/csv` (RFC 4180), `text/markdown` (RFC 7763), `application/sql` (RFC 6922) and
 * `application/yaml` (RFC 9512). A spreadsheet opens a `text/csv` download and does not open a
 * `text/plain` one, so the type is not decoration.
 */
export const CODE_BLOCK_MEDIA_TYPES: Record<CodeBlockLanguage, string> = {
	tsx: "text/plain;charset=utf-8",
	ts: "text/plain;charset=utf-8",
	jsx: "text/javascript;charset=utf-8",
	js: "text/javascript;charset=utf-8",
	json: "application/json;charset=utf-8",
	css: "text/css;charset=utf-8",
	bash: "text/x-shellscript;charset=utf-8",
	python: "text/x-python;charset=utf-8",
	curl: "text/plain;charset=utf-8",
	text: "text/plain;charset=utf-8",
	csv: "text/csv;charset=utf-8",
	md: "text/markdown;charset=utf-8",
	sql: "application/sql;charset=utf-8",
	yaml: "application/yaml;charset=utf-8",
};

/**
 * The MIME type any language id is stamped with: {@link CODE_BLOCK_MEDIA_TYPES} for the fourteen,
 * `text/plain;charset=utf-8` for everything else.
 *
 * PLAIN TEXT IS THE ONLY HONEST ANSWER for a language this file knows nothing about — minting
 * `text/x-<id>` out of an arbitrary word would stamp files with types no registry lists. The
 * `charset` parameter is kept for the reason every row above carries it, and the specificity a
 * foreign id does get is its extension: {@link codeBlockExtension} is what tells an editor that
 * `snippet.rs` is Rust.
 */
export function codeBlockMediaType(language: CodeBlockLanguageId): string {
	return isCodeBlockLanguage(language)
		? CODE_BLOCK_MEDIA_TYPES[language]
		: "text/plain;charset=utf-8";
}

/**
 * The extension `snippet.<ext>` takes in {@link codeBlockFilename} when a download name carries
 * none. `bash` and `curl` both land as `.sh`: a cURL sample is a shell line, and there is no
 * extension for one.
 */
export const CODE_BLOCK_EXTENSIONS: Record<CodeBlockLanguage, string> = {
	tsx: "tsx",
	ts: "ts",
	jsx: "jsx",
	js: "js",
	json: "json",
	css: "css",
	bash: "sh",
	python: "py",
	curl: "sh",
	text: "txt",
	csv: "csv",
	md: "md",
	sql: "sql",
	yaml: "yaml",
};

/**
 * The extension for a language the house has no grammar for and whose file suffix is NOT its own
 * id. Seven rows, and each earns its place by being a name a reader would not otherwise
 * recognise: `snippet.rust` is not a Rust file, `snippet.rs` is.
 *
 * EVERY OTHER FOREIGN ID IS ITS OWN EXTENSION — `go`, `java`, `php`, `html`, `toml`, `swift` —
 * and needs no row here; {@link codeBlockExtension} passes those through rather than listing a
 * hundred languages in a table this component could not keep current.
 *
 * MERMAID IS THE SEVENTH, and it is the case the first six describe rather than a new one: an id
 * simply LONGER THAN ITS OWN SUFFIX, exactly as `rust` is longer than `rs`. Without a row it spent
 * its own id and saved as `snippet.mermaid`, not the `.mmd` a Mermaid file carries. It is also the
 * foreign id THIS KIT sends here rather than an author: `Message.Response` withholds Streamdown's
 * own mermaid path — `controls.mermaid` is off and no `components.code` is passed — so a mermaid
 * fence takes the same slot as every other fence and the house block draws its source
 * (`ui/message/message-response.svelte`). `mmd` is its short spelling, so the alias table folds
 * `mmd` onto `mermaid` and both fences save one file — the relationship every other row here has
 * with its own short spelling.
 *
 * DOCKERFILE IS DELIBERATELY ABSENT, and it is the question this table had to answer. Docker's
 * file has no extension at all — the name IS `Dockerfile` — so there is nothing to map the id to.
 * Left out, it falls through to the pass-through and saves as `snippet.dockerfile`, which is the
 * spelling a project already uses when it needs a second one; a row would either repeat the id or
 * invent a suffix Docker does not define.
 */
export const CODE_BLOCK_FOREIGN_EXTENSIONS: Record<string, string> = {
	rust: "rs",
	ruby: "rb",
	kotlin: "kt",
	csharp: "cs",
	powershell: "ps1",
	"objective-c": "m",
	mermaid: "mmd",
};

/**
 * What may be spent as an extension AS IT IS: a lower-case word of at most twelve characters,
 * starting with a letter. Deliberately narrower than a language id — `f#` and `objective-c++` are
 * legal ids and neither is a legal suffix — so an id carrying punctuation lands on `txt` instead
 * of on a filename a shell would have to be told about.
 *
 * `objective-c` AND `c#` ARE NOT EXAMPLES OF THAT, though they look like the obvious two: this
 * test is the THIRD step of {@link codeBlockExtension} and both are answered before it —
 * `objective-c` by the row above (`m`), `c#` by {@link CODE_BLOCK_LANGUAGE_ALIASES} folding it to
 * `csharp` (`cs`). A punctuated id reaches `txt` only when no table knows it.
 */
const EXTENSION_SHAPED = /^[a-z][a-z0-9]{0,11}$/;

/**
 * The extension `snippet.<ext>` takes for any language id, in four steps: the house table, then
 * {@link CODE_BLOCK_FOREIGN_EXTENSIONS}, then the id itself when it is {@link EXTENSION_SHAPED},
 * then `txt`.
 *
 * `txt` is the floor rather than no extension at all, for the reason `messageFenceFilename`
 * (`ui/message/message.svelte.ts`) already gave: a reader can rename a `.txt`, and cannot open a
 * file with no extension.
 */
export function codeBlockExtension(language: CodeBlockLanguageId): string {
	if (isCodeBlockLanguage(language)) return CODE_BLOCK_EXTENSIONS[language];
	return (
		ownEntry(CODE_BLOCK_FOREIGN_EXTENSIONS, language) ??
		(EXTENSION_SHAPED.test(language) ? language : "txt")
	);
}

/**
 * What counts as "already has an extension": a trailing dot followed by a letter and up to
 * fifteen more letters or digits. The leading letter is deliberate — `release-1.2` is a stem
 * with a version in it, not a file with extension `2`.
 */
const FILENAME_EXTENSION = /\.[A-Za-z][A-Za-z0-9]{0,15}$/;

/**
 * The name a snippet downloads under.
 *
 * A label that already carries an extension is a filename and wins as it is — `app.css` stays
 * `app.css` whatever language is on screen. One that carries none is NOT a filename and is
 * replaced outright by `snippet.<ext>` for the active language ({@link codeBlockExtension}, so a
 * language with no house grammar still saves under a suffix of its own: `rust` gives
 * `snippet.rs`), so `request` over a TSX/Python selector downloads as `snippet.tsx` and then as
 * `snippet.py` when the reader switches. No label at all, or a blank one, yields the same.
 *
 * REPLACED, NOT EXTENDED. Appending the extension to an extension-less label instead — `request`
 * saving as `request.tsx` — reads well for a stem and badly for anything else: a caption-shaped
 * name like `Component request` would become `Component request.tsx`, a file named after prose.
 * A caller who wants a name of their own writes it with its extension, and then it is used
 * verbatim.
 *
 * THE HAZARD IS THE FIRST RULE: a caller who names a multi-snippet block `request.tsx` has pinned
 * the extension, and the Python snippet downloads as `.tsx` too. Leave the extension off to let
 * it follow the selector.
 *
 * Path separators and reserved punctuation are NOT handled here — the root runs the result
 * through `sanitiseFilename` (`$lib/shared/download-text.js`), which is where that rule lives.
 */
export function codeBlockFilename(
	label: string | undefined,
	language: CodeBlockLanguageId,
): string {
	const name = label?.trim() ?? "";
	if (FILENAME_EXTENSION.test(name)) return name;
	return `snippet.${codeBlockExtension(language)}`;
}

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
	// Three of the four house languages have no keyword worth the name: a CSV row is data, a
	// Markdown document is prose, and YAML's `true` / `false` / `null` are literals rather than
	// keywords — they are painted by {@link LITERAL_LANGUAGES} instead, which is the same
	// treatment JSON gets.
	csv: [],
	md: [],
	// SQL is the opposite case: a statement is made almost entirely of keywords, so the list is
	// longer than the others and still stops at the words that give a statement its SHAPE. Joins
	// keep `join` and `on` but not every flavour word before them (`left`, `inner`, `outer`), and
	// the control-flow group (`case` / `when` / `then` / `else` / `end`) is left out for the same
	// reason: a longer list is a dictionary, not a better highlighter. Lower case is the stored
	// form — {@link CASE_INSENSITIVE_KEYWORD_LANGUAGES} is what makes `SELECT` match it.
	sql: [
		"select",
		"from",
		"where",
		"join",
		"on",
		"group",
		"order",
		"by",
		"having",
		"limit",
		"insert",
		"into",
		"values",
		"update",
		"set",
		"delete",
		"create",
		"table",
		"alter",
		"drop",
		"as",
		"and",
		"or",
		"not",
		"null",
		"distinct",
		"union",
		"with",
	],
	yaml: [],
};

/**
 * How a language opens a comment. `block` is the slash-star form, matched to end of line only.
 *
 * `double-dash` is this theme's, added with `sql`: `-- comment` is SQL's line comment, and it is
 * the one marker in the set that no other member of the tuple uses.
 */
export type CodeBlockCommentSyntax = "double-slash" | "hash" | "block" | "double-dash";

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
 * tokenizer colouring one line at a time cannot know it is inside a slash-star block that opened
 * three lines up, so the opening line greys and the continuation lines do not. That limit belongs
 * to THIS tokenizer rather than to the component: a {@link CodeBlockHighlighter} is handed the
 * whole snippet at once, and lifting exactly this is what the seam exists for.
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
	// A CSV file has no comment syntax — a `#` row is a row whose first field starts with `#`.
	csv: [],
	// Markdown's only comment is the HTML one, `<!-- -->`, which no marker here spells. Giving it
	// `hash` instead would grey every ATX heading in the document.
	md: [],
	sql: ["double-dash", "block"],
	yaml: ["hash"],
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
		// A quoted CSV field is the only run in the format that is not read literally (RFC 4180),
		// so it is the only one worth painting. The escape form is a doubled quote, which comes
		// out as two adjacent strings rather than one — both green, so the line still reads.
		csv: ["double"],
		// Markdown is prose, and prose is where the apostrophe hazard `text` documents lives:
		// `Don't stop, can't stop` would render `'t stop, can'` in string ink. No markers at all
		// means {@link tokenizeCodeBlockLine} short-circuits the whole line to one plain run.
		md: [],
		// SQL's string is single-quoted. The double quote delimits an IDENTIFIER in standard SQL
		// (`"order"` is a column named order, not a string), so it is deliberately not listed, and
		// the effect is exactly that: no alternative claims the quote characters, so they fall
		// through as plain and the word between them is tokenised on its own. A column called
		// `order` then wears keyword ink, which is the keyword list's own documented limit rather
		// than this table's.
		sql: ["single"],
		yaml: ["double", "single"],
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
	// SQL's line comment. It sits before the identifier and punctuation alternatives like every
	// other comment marker, which is what keeps `-- rows returned` a comment rather than two
	// minus signs; a lone `-` is still punctuation, since this pattern needs two.
	"double-dash": /--.*/.source,
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

/** JSON's three bare literals (`:144`), which YAML's core schema spells the same way. */
const JSON_LITERAL = /^(true|false|null)$/;

/**
 * Which languages paint `true` / `false` / `null` as a literal rather than as a keyword.
 *
 * JSON is upstream's; YAML is this theme's, and it is the same three words — YAML 1.2's core
 * schema resolves them exactly as JSON does. Only the lower-case spelling is claimed: YAML also
 * accepts `True` and `TRUE`, which come out plain, because widening the test would change what
 * JSON does with a capitalised word for the sake of a spelling YAML style guides discourage.
 */
const LITERAL_LANGUAGES: readonly CodeBlockLanguage[] = ["json", "yaml"];

/**
 * Which languages match their keyword table without regard to case.
 *
 * SQL alone. The standard defines its keywords case-insensitively and both houses are idiomatic —
 * upper case in most style guides, lower case in plenty of real code — so a case-sensitive list
 * would colour one and ignore the other. Every other member of the tuple is a case-sensitive
 * language, where `True` and `true` are genuinely different tokens.
 */
const CASE_INSENSITIVE_KEYWORD_LANGUAGES: readonly CodeBlockLanguage[] = ["sql"];

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

	// A language with neither comments nor strings has no grammar worth scanning for: `text` and
	// `md` are the members, both of them prose, and every alternative left would be a false
	// positive on it.
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
		if (syntax === "double-dash" && token.startsWith("--")) return true;
	}
	return false;
}

/**
 * Whether `token` is one of `language`'s keywords — a plain lookup, except for the languages
 * {@link CASE_INSENSITIVE_KEYWORD_LANGUAGES} names, whose tables are stored lower-case and are
 * looked up lower-cased.
 */
function matchesCodeBlockKeyword(token: string, language: CodeBlockLanguage): boolean {
	const keywords = codeBlockLanguageKeywords[language];
	return CASE_INSENSITIVE_KEYWORD_LANGUAGES.includes(language)
		? keywords.includes(token.toLowerCase())
		: keywords.includes(token);
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
	if (LITERAL_LANGUAGES.includes(language) && JSON_LITERAL.test(token)) return "literal";
	if (matchesCodeBlockKeyword(token, language)) return "keyword";
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
 * The seam a real highlighter installs itself through.
 *
 * `highlight` is handed the WHOLE snippet — {@link CodeBlockState.text}, which is the rendered
 * lines rejoined — and answers one row of {@link CodeBlockToken}s per line, in the kit's own
 * shape, so a construct that spans lines (a block comment, a template literal, a docstring) can
 * be coloured past its first line: exactly what {@link tokenizeCodeBlockLine} cannot do.
 * `undefined` means "not mine to paint", which is the answer for a grammar still loading as much
 * as for one that will never load — the house tokenizer paints instead, and the block repaints on
 * its own when the answer changes, because `highlight` is called from inside a `$derived`.
 *
 * `prepare` is the optional other half: start loading whatever `language` needs. Only
 * `<CodeBlock.Root>`'s effect calls it (rule 4 of the ten in `code-block.svelte`), once per
 * language it shows.
 *
 * OWNERSHIP RUNS ONE WAY. The contract and its context key live HERE, in the folder that consumes
 * them; `ui/code-highlighter/` IMPLEMENTS this type and installs itself through
 * {@link setCodeBlockHighlighterContext}, importing this barrel to do it. This folder must never
 * import that one — that edge is what keeps the code block installable on its own, without
 * dragging a grammar bundle into a project that only wanted a copyable snippet.
 *
 * NOTHING INSTALLS ONE BY DEFAULT. A block with no provider above it paints exactly as it always
 * did, which is why the house tokenizer is still the thing this file spends most of its length on.
 */
export type CodeBlockHighlighter = {
	/**
	 * Paint a whole snippet: one row per line of `code`, or `undefined` to decline it. May read
	 * reactive state, must not write any, and must not block — see rules 5 and 10.
	 */
	highlight(code: string, language: CodeBlockLanguageId): CodeBlockToken[][] | undefined;
	/** Optional. Start loading whatever this language needs; called by the root's effect only. */
	prepare?(language: CodeBlockLanguageId): void;
};

/**
 * A key of its own rather than a corner of the block's context: a provider is an ANCESTOR of many
 * blocks and is not itself a block, so the two must not collide on one key.
 */
const CODE_BLOCK_HIGHLIGHTER_CONTEXT_KEY = Symbol("code-block-highlighter");

/**
 * Install a highlighter for every `<CodeBlock.Root>` below this component that sets no
 * `highlighter` prop of its own. Call it during component initialisation, as `setContext` requires.
 */
export function setCodeBlockHighlighterContext(
	highlighter: CodeBlockHighlighter,
): CodeBlockHighlighter {
	return setContext(CODE_BLOCK_HIGHLIGHTER_CONTEXT_KEY, highlighter);
}

export function hasCodeBlockHighlighterContext(): boolean {
	return hasContext(CODE_BLOCK_HIGHLIGHTER_CONTEXT_KEY);
}

/**
 * The installed highlighter, or a thrown error naming the consumer — the shape
 * `getDirectionContext` uses in `ui/direction-provider`. For the ordinary case, where a block with
 * no provider above it is not an error at all, {@link useCodeBlockHighlighter} is the accessor to
 * reach for.
 */
export function getCodeBlockHighlighterContext(consumer?: string): CodeBlockHighlighter {
	if (!hasCodeBlockHighlighterContext()) {
		const label = consumer ?? "`<CodeBlock>` highlighter consumer";
		throw new Error(`${label} must be used within a code-block highlighter provider.`);
	}
	return getContext<CodeBlockHighlighter>(CODE_BLOCK_HIGHLIGHTER_CONTEXT_KEY);
}

/**
 * The nearest installed highlighter, or `undefined` when there is none. Never throws when no
 * provider is present, and must be called during component initialisation — `ui/direction-provider`'s
 * `useDirection` is the same shape for the same two reasons.
 */
export function useCodeBlockHighlighter(): CodeBlockHighlighter | undefined {
	return hasCodeBlockHighlighterContext() ? getCodeBlockHighlighterContext() : undefined;
}

/**
 * Reactive inputs for {@link CodeBlockState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them.
 */
export type CodeBlockStateProps = {
	/** The resolved snippet list — never empty; the root wraps a bare `code` into one entry. */
	getSnippets: () => readonly CodeBlockSnippet[];
	/** The language the caller currently wants shown. Any id; the root canonicalises it. */
	getActiveLanguage: () => CodeBlockLanguageId;
	/** Called when the selector picks another language. */
	setActiveLanguage: (language: CodeBlockLanguageId) => void;
	/** Whether the gutter renders. */
	getShowLineNumbers: () => boolean;
	/** Whether more than one snippet may be switched between. */
	getAllowLanguageSelection: () => boolean;
	/** The caption in the header. */
	getLabel: () => string;
	/**
	 * The download name as the caller wrote it, or `undefined` for no download affordance at all.
	 * Resolved and sanitised by {@link CodeBlockState.filename}.
	 */
	getFilename: () => string | undefined;
	/** The caller's MIME type for the download, or `undefined` to take the active language's. */
	getMediaType: () => string | undefined;
	/**
	 * What paints this block, or `undefined` for the house tokenizer.
	 *
	 * A GETTER RATHER THAN A CONTEXT READ OF ITS OWN. This class is a plain object and may be
	 * constructed outside a component, where `getContext` throws; and the precedence between an
	 * explicit prop, an opt-out and an inherited provider is the ROOT's to decide (rules 1-3). The
	 * state only consumes the answer.
	 */
	getHighlighter: () => CodeBlockHighlighter | undefined;
	/** Called after {@link CodeBlockState.download} has handed the file to the browser. */
	notifyDownload: (filename: string) => void;
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
	 * Resolved rather than taken, and {@link resolveCodeBlockLanguage} NORMALISES rather than
	 * narrows: a snippet carrying `JavaScript` is shown, downloaded and reported as `js`. The root
	 * already canonicalised the list, so this pass is idempotent and exists to catch a state
	 * constructed by hand.
	 *
	 * It is NOT what protects the per-language tables from a key they do not have — an id outside
	 * the fourteen is legal here. {@link CodeBlockState.grammar} is.
	 */
	readonly activeLanguage: CodeBlockLanguageId = $derived(
		resolveCodeBlockLanguage(this.activeSnippet?.language),
	);

	/**
	 * The house grammar this block is tokenised against: the active id when it is one of the
	 * fourteen, else `text` — the member that claims no grammar.
	 *
	 * It is the only value ever handed to {@link tokenizeCodeBlockLine}, which indexes three
	 * `Record<CodeBlockLanguage, …>` tables and would read `undefined` for anything else. So an
	 * unknown language degrades to plain text instead of throwing, which is also the right picture
	 * of what it is: a snippet nothing in this file knows how to paint.
	 */
	readonly grammar: CodeBlockLanguage = $derived(
		isCodeBlockLanguage(this.activeLanguage) ? this.activeLanguage : "text",
	);
	readonly activeCode: string = $derived(this.activeSnippet?.code ?? "");

	/** The active snippet's own label, or its language's — the id itself when the house has none. */
	readonly activeLabel: string = $derived(
		this.activeSnippet?.label ?? codeBlockLanguageLabel(this.activeLanguage),
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

	/**
	 * What a highlighter is handed: the rows on screen, rejoined.
	 *
	 * DERIVED FROM `lines`, NOT FROM `activeCode`. The two differ — `lines` has already folded CRLF
	 * and dropped one trailing newline — and a highlighter fed the raw code could answer with one
	 * row more than the block renders, which is rule 7's whole failure mode. Rejoining what is
	 * actually rendered makes the two counts agree by construction rather than by luck.
	 */
	readonly text: string = $derived(this.lines.join("\n"));

	/** What paints this block, as the root resolved it: `undefined` means the house tokenizer. */
	readonly highlighter: CodeBlockHighlighter | undefined = $derived(this.#props.getHighlighter());

	/**
	 * The installed highlighter's answer for the whole snippet, or `undefined` when there is none,
	 * when it declined, when it threw, or when it produced a row count the block cannot use.
	 *
	 * THE COUNT TEST IS THE BLOCK-LEVEL GUARD (rule 7). A row list shorter than `lines` would leave
	 * the tail unpainted and a longer one would hide rows, and either way the mismatch says the
	 * highlighter and this component disagree about what the text IS — a disagreement no per-line
	 * check can repair, so the whole block falls back at once rather than painting a striped mix.
	 *
	 * THE CATCH IS DELIBERATE (rule 5). A grammar bundle is third-party code loaded at runtime; a
	 * throw from it must degrade this block to house colours, not break the render of the page the
	 * block is on. Reading reactive state inside `highlight` is not just allowed but expected — it
	 * is how a grammar that finishes loading later re-runs this derivation and repaints the block.
	 */
	readonly rows: CodeBlockToken[][] | undefined = $derived.by(() => {
		const highlighter = this.highlighter;
		if (!highlighter) return undefined;

		let produced: CodeBlockToken[][] | undefined;
		try {
			produced = highlighter.highlight(this.text, this.activeLanguage);
		} catch {
			return undefined;
		}

		return produced && produced.length === this.lines.length ? produced : undefined;
	});

	/**
	 * Whether the installed highlighter's ANSWER WAS ACCEPTED for this block — rule 7 passed, so
	 * {@link CodeBlockState.rows} holds one row per line. Stamped as `data-highlighted`.
	 *
	 * IT IS NOT A PROMISE THAT EVERY LINE IS PAINTED BY IT, and the difference has to be stated
	 * because this attribute is the only signal the seam publishes. Rule 8 is a separate, per-line
	 * test in {@link CodeBlockState.tokenize}: a row that is empty, or whose token texts do not
	 * concatenate to the line, falls back to the house tokenizer on its own. An EMPTY LINE normally
	 * does — `CodeBlock.Line` renders `line || " "`, and a row that faithfully spells the empty
	 * line cannot concatenate to a space (`code-block-line.svelte`) — so a mixed block is ordinary
	 * rather than exotic, and a highlighter whose rows are ALL rejected leaves this true over a
	 * block the house painted entirely.
	 *
	 * NARROWING IT WAS CONSIDERED AND REJECTED. Requiring rows to survive rule 8 would have to
	 * exempt blank lines to mean anything at all, and would still not amount to "every line": it
	 * would buy a second almost-invariant in place of saying plainly what this one is.
	 */
	readonly highlighted: boolean = $derived(this.rows !== undefined);

	/** Whether the header renders a selector rather than a static tag. */
	readonly selectable: boolean = $derived(
		this.#props.getAllowLanguageSelection() && this.snippets.length > 1,
	);

	/**
	 * The name the download button saves under, or `undefined` when the root set none — which is
	 * the header's cue to leave the button out.
	 *
	 * Two passes. {@link codeBlockFilename} settles the extension against the language on screen,
	 * so a name without one follows the selector; `sanitiseFilename` then strips what a browser's
	 * `download` attribute would misread — a path separator becomes a dash, reserved punctuation
	 * goes — and falls back to `snippet.<ext>` should nothing survive. The result is never the
	 * empty string, so `{#if block.filename}` is a sound test for presence.
	 */
	readonly filename: string | undefined = $derived.by(() => {
		const requested = this.#props.getFilename();
		if (requested === undefined) return undefined;
		const language = this.activeLanguage;
		return sanitiseFilename(
			codeBlockFilename(requested, language),
			codeBlockFilename(undefined, language),
		);
	});

	/**
	 * What {@link CodeBlockState.download} actually saves under: {@link CodeBlockState.filename}
	 * when the root set one, else `snippet.<ext>` for the language on screen. Exists so a download
	 * button composed by hand — outside the header's `{#if}` — still has a name to work with.
	 */
	readonly downloadName: string = $derived(
		this.filename ?? codeBlockFilename(undefined, this.activeLanguage),
	);

	/**
	 * The MIME type the download is stamped with: the caller's when set, else
	 * {@link codeBlockMediaType} for the language on screen — the registered type for one of the
	 * fourteen, `text/plain;charset=utf-8` for every other id, because
	 * {@link CODE_BLOCK_MEDIA_TYPES} is keyed by the fourteen and has no `rust` row to read.
	 * Follows the selector for the same reason the filename does — the Python snippet of a
	 * multi-language block is not `text/javascript`.
	 */
	readonly mediaType: string = $derived(
		this.#props.getMediaType() ?? codeBlockMediaType(this.activeLanguage),
	);

	constructor(props: CodeBlockStateProps) {
		this.#props = props;
	}

	/**
	 * Show another snippet. Ignores a language the current list does not carry — and the list is
	 * canonical, so the id has to be too: pass it through {@link resolveCodeBlockLanguage} first.
	 */
	select(language: CodeBlockLanguageId): void {
		if (!this.snippets.some((snippet) => snippet.language === language)) return;
		this.#props.setActiveLanguage(language);
	}

	/** What the copy button writes: the active snippet's code, exactly as the caller supplied it. */
	copyText(): string {
		return this.activeCode;
	}

	/**
	 * Hand the active snippet to the browser as a file, and say which name it went under.
	 *
	 * The content is {@link CodeBlockState.copyText} — the source verbatim, for the reason the
	 * clipboard gets it verbatim: a file that differs from what it claims to be is worse than one
	 * with a blank last line. The root's `onDownload` hears about it here, so a caller who never
	 * touches the header still gets the receipt; the button's own hook fires after, in the button.
	 */
	download(): string {
		const filename = this.downloadName;
		downloadText(filename, this.copyText(), this.mediaType);
		this.#props.notifyDownload(filename);
		return filename;
	}

	/**
	 * One line, classified for the block as it stands.
	 *
	 * WITH AN INDEX, the installed highlighter's row for that line is used — but only if it is
	 * non-empty AND its token texts concatenate to `line` exactly (rule 8). That test is not
	 * defensive decoration: it is what guarantees the characters on screen are the source
	 * characters, whatever an adapter did with tabs, entities or trailing space. It is the same
	 * invariant {@link tokenizeCodeBlockLine} holds by construction, enforced on code this folder
	 * does not own.
	 *
	 * WITHOUT ONE — a `<CodeBlock.Line>` composed by hand — there is no row to line the text up
	 * against, so the house tokenizer paints it whatever is installed.
	 */
	tokenize(line: string, index?: number): CodeBlockToken[] {
		const row = index === undefined ? undefined : this.rows?.[index];
		if (row && row.length > 0 && row.map((token) => token.text).join("") === line) return row;
		return tokenizeCodeBlockLine(line, this.grammar);
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
