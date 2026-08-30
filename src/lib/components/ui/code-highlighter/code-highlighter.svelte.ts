import { getContext, hasContext, setContext } from "svelte";
import { SvelteSet } from "svelte/reactivity";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { Grammar, HighlighterCore, LanguageRegistration } from "shiki/core";
import {
	isCodeBlockLanguage,
	resolveCodeBlockLanguage,
	tokenizeCodeBlockLine,
	type CodeBlockHighlighter,
	type CodeBlockLanguage,
	type CodeBlockLanguageId,
	type CodeBlockToken,
	type CodeBlockTokenKind,
} from "$lib/components/ui/code-block/index.js";

/**
 * One entry of a string-keyed table, or `undefined` — the OWN property only.
 *
 * The same guard `code-block.svelte.ts` writes over its own tables, and for the same reason: the
 * key is whatever word a fence's info string carried, so a bare `table[key]` would answer a
 * function for `constructor` and the prototype object for `__proto__`.
 */
function ownEntry<T>(table: Readonly<Record<string, T>>, key: string): T | undefined {
	return Object.hasOwn(table, key) ? table[key] : undefined;
}

/**
 * One grammar this adapter can fetch: the name Shiki registers it under, and the loader that
 * brings it in.
 *
 * `load` MUST be a `() => import("@shikijs/langs/<id>")` with a STRING LITERAL specifier, and the
 * table below is written out row by row rather than generated from the ids for exactly that
 * reason. Two separate machines read those specifiers statically and neither can see through a
 * template literal: `tools/registry/import-graph.mjs` walks them to decide which packages a
 * registry item depends on — a `` import(`@shikijs/langs/${id}`) `` would silently drop
 * `@shikijs/langs` out of this component's dependency list — and Vite needs them to cut one chunk
 * per grammar instead of bundling every language into the entry.
 */
export type CodeHighlighterGrammar = {
	/** The grammar's `name` in Shiki's registry — what `HighlighterCore.getLanguage` is keyed by. */
	name: string;
	/** Fetch the registration array. Must carry a literal specifier; see the type's own comment. */
	load: () => Promise<{ default: LanguageRegistration[] }>;
};

/**
 * Every language this adapter paints, keyed by the CANONICAL id — what
 * {@link resolveCodeBlockLanguage} returns, so `typescript`, `TypeScript` and `ts` all arrive here
 * as `ts` and a caller never has to know which spelling the fence used.
 *
 * THE KEY IS THE HOUSE ID AND `name` IS SHIKI'S, and the two differ more often than not:
 * `ts` -> `typescript`, `js` -> `javascript`, `bash` -> `shellscript`, `md` -> `markdown`,
 * `dockerfile` -> `docker`. `curl` is the one row that is not a language at all — the code block
 * carries it because a chat answer fences a request as ```` ```curl ````, and a curl invocation IS
 * a shell command, so it takes `shellscript` too. Both `bash` and `curl` therefore name the same
 * module; the second import is a cache hit and `loadLanguageSync` skips a grammar it already
 * holds, so the pair costs one download.
 *
 * WHAT IS DELIBERATELY ABSENT.
 *   - `text` — the id `resolveCodeBlockLanguage` gives a blank or absent fence. There is no grammar
 *     for "no language", so `highlight` declines it by finding no row here, and the house tokenizer
 *     renders it as the one plain run it already renders it as.
 *   - `csv` — Shiki DOES register `csv`, and its grammar is a rainbow: probing it against
 *     `id,name,weight` emits `rainbow1`, `keyword.rainbow2` and `entity.name.function.rainbow3`,
 *     one per column position. Mapped through any honest scope table the second column of every CSV
 *     file would paint as a keyword and the third as a function. The house tokenizer keeps `csv`
 *     and paints it plainly, which is the right answer for a table of values.
 *   - `mermaid` and `objective-c`, which `CODE_BLOCK_LANGUAGE_ALIASES` resolves ids onto. Both
 *     exist in `@shikijs/langs` and neither is something a reader of this kit is likely to be
 *     handed; a consumer who needs one adds a row through the provider's `grammars` prop.
 *
 * WHAT A ROW WEIGHS. Most are one module. Eight drag embedded grammars in, because a language that
 * can host another language must carry the guest's rules; the transitive size of the `dist` modules,
 * measured in `node_modules/@shikijs/langs` at 3.23.0, is worth knowing before adding a row to a
 * preload list:
 *   - `html` -> javascript + css, 3 modules, ~292 kB
 *   - `svelte` -> javascript + typescript + css + postcss, 5 modules, ~445 kB
 *   - `scss` -> css, 2 modules, ~81 kB; `xml` -> java, 2 modules, ~36 kB
 *   - `graphql` -> javascript + typescript + jsx + tsx, 5 modules, ~751 kB
 *   - `cpp` -> regexp + c + glsl + sql + cpp-macro, 6 modules, ~765 kB
 *   - `php` -> 8 modules, ~470 kB; `ruby` -> 20 modules, ~1.8 MB, the heaviest row here
 * For contrast the everyday rows are small: `json` and `jsonc` ~3 kB, `dockerfile` ~2 kB, `yaml`
 * ~11 kB, `sql` ~24 kB, and the whole JS family ~181-186 kB each. None of it is in the initial
 * bundle — every row is behind its own dynamic import and arrives only when a block asks for that
 * language.
 */
export const CODE_HIGHLIGHTER_GRAMMARS: Readonly<Record<string, CodeHighlighterGrammar>> = {
	// The fourteen the house tokenizer knows, minus `text` and `csv` (see above).
	tsx: { name: "tsx", load: () => import("@shikijs/langs/tsx") },
	ts: { name: "typescript", load: () => import("@shikijs/langs/typescript") },
	jsx: { name: "jsx", load: () => import("@shikijs/langs/jsx") },
	js: { name: "javascript", load: () => import("@shikijs/langs/javascript") },
	json: { name: "json", load: () => import("@shikijs/langs/json") },
	css: { name: "css", load: () => import("@shikijs/langs/css") },
	bash: { name: "shellscript", load: () => import("@shikijs/langs/shellscript") },
	python: { name: "python", load: () => import("@shikijs/langs/python") },
	curl: { name: "shellscript", load: () => import("@shikijs/langs/shellscript") },
	md: { name: "markdown", load: () => import("@shikijs/langs/markdown") },
	sql: { name: "sql", load: () => import("@shikijs/langs/sql") },
	yaml: { name: "yaml", load: () => import("@shikijs/langs/yaml") },

	// What a chatbot actually emits beyond them. Markup and config first — the formats a model
	// reaches for when it is showing a file rather than a program.
	html: { name: "html", load: () => import("@shikijs/langs/html") },
	xml: { name: "xml", load: () => import("@shikijs/langs/xml") },
	svelte: { name: "svelte", load: () => import("@shikijs/langs/svelte") },
	scss: { name: "scss", load: () => import("@shikijs/langs/scss") },
	toml: { name: "toml", load: () => import("@shikijs/langs/toml") },
	jsonc: { name: "jsonc", load: () => import("@shikijs/langs/jsonc") },
	dockerfile: { name: "docker", load: () => import("@shikijs/langs/docker") },
	graphql: { name: "graphql", load: () => import("@shikijs/langs/graphql") },
	diff: { name: "diff", load: () => import("@shikijs/langs/diff") },
	powershell: { name: "powershell", load: () => import("@shikijs/langs/powershell") },

	// Then the compiled and scripted languages, alphabetically.
	c: { name: "c", load: () => import("@shikijs/langs/c") },
	cpp: { name: "cpp", load: () => import("@shikijs/langs/cpp") },
	csharp: { name: "csharp", load: () => import("@shikijs/langs/csharp") },
	go: { name: "go", load: () => import("@shikijs/langs/go") },
	java: { name: "java", load: () => import("@shikijs/langs/java") },
	kotlin: { name: "kotlin", load: () => import("@shikijs/langs/kotlin") },
	php: { name: "php", load: () => import("@shikijs/langs/php") },
	ruby: { name: "ruby", load: () => import("@shikijs/langs/ruby") },
	rust: { name: "rust", load: () => import("@shikijs/langs/rust") },
	swift: { name: "swift", load: () => import("@shikijs/langs/swift") },
};

/** One row of {@link CODE_HIGHLIGHTER_SCOPES}: a TextMate scope prefix and the kind it paints as. */
export type CodeHighlighterScopeRule = {
	/** A scope prefix, matched segment-aware: `scope === key || scope.startsWith(key + ".")`. */
	scope: string;
	/** The kind this prefix resolves to. One of the nine; there is no tenth. */
	kind: CodeBlockTokenKind;
};

/** One row of {@link CODE_HIGHLIGHTER_CONTAINER_SCOPES}. A missing `kind` means TRANSPARENT. */
export type CodeHighlighterContainerRule = {
	/** A scope prefix, matched the same way {@link CodeHighlighterScopeRule.scope} is. */
	scope: string;
	/**
	 * What every token inside this container paints as, or `undefined` to declare the container
	 * transparent — it decides nothing and the scan moves inward.
	 */
	kind?: CodeBlockTokenKind;
};

/**
 * Whether `scope` is `key` or one of its children. SEGMENT-AWARE, so `string` matches
 * `string.quoted.double.ts` but never `stringify.ts`, and `comment` never matches `commented.foo`.
 */
function matchesScope(scope: string, key: string): boolean {
	return scope === key || scope.startsWith(`${key}.`);
}

/**
 * The CONTAINER pass: scopes that decide the whole region beneath them, scanned OUTERMOST first.
 *
 * Every token carries its full scope stack, from `source.ts` down to whatever claimed the
 * characters. Reading that stack innermost-first is right for most tokens and wrong for a whole
 * class of them, because a grammar keeps describing structure INSIDE a construct where the
 * construct itself is what a reader sees. Four cases, all of them observed by tokenising real
 * snippets against these grammars rather than guessed:
 *
 *  - A JSDoc tag inside a block comment is
 *    `comment.block.documentation.ts storage.type.class.jsdoc`. Innermost-first paints `@param` as
 *    a declaration keyword in the middle of grey prose.
 *  - A regular expression is `string.regexp.ts` with `keyword.control.anchor.regexp`,
 *    `keyword.operator.quantifier.regexp` and `constant.other.character-class.set.regexp` inside
 *    it, so `/^--[a-z]+$/gi` would come out as four different colours.
 *  - A JSON key is `string.json support.type.property-name.json`. The container rule is what makes
 *    it a STRING, which is the answer `code-block.svelte.ts` already commits to over
 *    `codeBlockTokenVariants` — "a key is what it lexically is — a string" — and the reason that
 *    matters here is streaming: the house tokenizer paints the line first and this adapter repaints
 *    it a moment later, so any disagreement is a visible colour flicker in a chat answer.
 *  - The `.` of `1.5` is `constant.numeric.decimal.rust punctuation.separator.dot.decimal.rust`,
 *    and the `rem` of `0.875rem` is `constant.numeric.css keyword.other.unit.rem.css`. Both would
 *    split one number into two colours. `#fff` and `&amp;` split the same way — their `#`, `&` and
 *    `;` are `punctuation.definition.*` inside `constant.other.color` and `constant.character` —
 *    which is why those two are containers here rather than rows in the scope table.
 *
 * TWO STRING FAMILIES ARE TRANSPARENT, and they are the reason this list is ordered rather than a
 * set. Both would otherwise be swallowed by the `string` row below them:
 *
 *  - `string.template` — a template literal's `${…}` is scoped `meta.template.expression` with
 *    `meta.embedded.line` inside it: real code the grammar has parsed as such. Painting a live
 *    expression as string ink is the kind of wrong a reader can act on, and colouring it is
 *    precisely what the house tokenizer cannot do (its backtick pattern swallows the whole
 *    literal). The literal chunks between the holes still reach the `string` row on their own
 *    innermost scope, so the quotes and the text stay green either way.
 *  - `string.unquoted` — the shell grammar scopes EVERY bare command argument
 *    `string.unquoted.argument.shell`, and YAML scopes a block scalar's body
 *    `string.unquoted.block.yaml`. Left opaque, `npm install --save-dev` would be three quarters
 *    green. The scope table below maps `string.unquoted` to `plain`, which is what the house
 *    tokenizer already paints an unquoted word as.
 *
 * The last four rows are the one language whose meaning lives entirely at line level. A diff's
 * `+`/`-` gutter character is scoped `punctuation.definition.inserted.diff` INSIDE
 * `markup.inserted.diff`, so only a container rule keeps the marker the same colour as the line it
 * marks.
 */
export const CODE_HIGHLIGHTER_CONTAINER_SCOPES: readonly CodeHighlighterContainerRule[] = [
	{ scope: "comment", kind: "comment" },
	{ scope: "string.template" },
	{ scope: "string.unquoted" },
	{ scope: "string", kind: "string" },
	{ scope: "constant.numeric", kind: "number" },
	// An escape or an HTML entity belongs to the text it stands in for. Most sit inside a string
	// container already; Python's f-string and HTML's `&amp;` scope theirs as a sibling instead.
	{ scope: "constant.character", kind: "string" },
	{ scope: "constant.other.color", kind: "literal" },
	{ scope: "markup.inserted", kind: "string" },
	{ scope: "markup.deleted", kind: "number" },
	{ scope: "meta.diff.range", kind: "keyword" },
	{ scope: "meta.diff.header", kind: "comment" },
];

/**
 * The SCOPE pass: one TextMate scope prefix per row, tested INNERMOST first, first match wins.
 *
 * ORDER IS THE GRAMMAR HERE TOO. Within one scope the rows are tried top to bottom, so a specific
 * prefix must sit above the general one it would otherwise be swallowed by — that is what makes
 * `punctuation.definition.string` a string rather than punctuation, and `support.type.property-name`
 * a CSS declaration name rather than a type. Reordering the rows changes the output; grouping them
 * is formatting, but the order inside a group is not.
 *
 * A scope that matches NO row is not an answer: the scan moves one scope outward and tries again,
 * and only a stack that matches nothing at all falls through. That is what keeps the table small.
 * `variable.other.readwrite.ts`, `constant.other.database-name.sql` and `entity.name.namespace.rust`
 * are absent on purpose — an identifier whose name the reader chose is plain, and adding rows for
 * them would paint a whole file. `meta.*` is absent for the same reason with ONE exception, stated
 * where it sits: `meta.brace`, which is not structure around a token but the bracket characters
 * themselves.
 *
 * THE NINE KINDS ARE FIXED (`CODE_BLOCK_TOKEN_KINDS`), so several distinctions a theme would draw
 * cannot be drawn here, and the table says which rather than pretending otherwise. There is no
 * function kind, no variable kind, and no destructive ink at all — the ramp in
 * `codeBlockTokenVariants` spends five semantic families on code and none of them is
 * `--destructive`.
 *
 * THE DECISIONS WORTH ARGUING ABOUT, each checked against what the house tokenizer already does on
 * the same snippet. THE RULE BETWEEN THEM: this adapter may add colour where the house had none,
 * and must not repaint what the house had an opinion about — because during a streamed answer both
 * paint the same line seconds apart.
 *
 *  - CSS PROPERTY NAMES are `support.type.property-name.css` and take `keyword`, matching
 *    `codeBlockLanguageKeywords.css`, which lists `display`, `color`, `background`, `padding` and
 *    `margin` as keywords. The row above `support.type` is what stops them being read as types.
 *    `support.constant.property-value.css` takes `keyword` for the same reason — `grid` and `flex`
 *    are in that same house list, and CSS itself calls `auto` and `grid` keyword values.
 *  - CSS CUSTOM PROPERTIES are `variable.css` (`--ring: …`) and `variable.argument.css` (the id
 *    inside `var()`), and both take `property`. That is the house answer exactly: its classifier
 *    ends with `if (language === "css" && token.startsWith("--")) return "property"`, and its
 *    scanner matches a custom property in both positions. SCSS spells both its `$brand` and its
 *    `--ring` as `variable.scss`, so a SCSS variable lands there too, which is the same idea.
 *  - `keyword.operator` SPLITS BY THE TEXT, not by the scope, and so does every other row whose
 *    kind is `keyword`: a keyword-kind token with NO LETTER in it is punctuation instead. That one
 *    line covers `=`, `!==`, `&&`, `+`, `//`, `::`, `|`, `*`, `>` and `=>` — which grammars scope as
 *    `keyword.operator.assignment`, `keyword.operator.comparison`, `keyword.operator.namespace`,
 *    `keyword.operator.pipe` and even `storage.type.function.arrow` — while leaving `typeof`, `new`,
 *    `in`, `not`, `is` and `!important` as keywords. The house draws the same line from the other
 *    side: its punctuation class is one symbol wide and every one of its keyword tables holds words,
 *    so `=>` is already two grey characters there and `typeof` is already plain.
 *  - `entity.name.tag` takes `keyword`. It is the tag name in HTML, XML and Svelte — the reserved
 *    structural word of a markup document, which is what `keyword` marks in a program — and the
 *    house has no grammar for any of those three. YAML reuses the same scope for a mapping key
 *    (`string.unquoted.plain.out.yaml entity.name.tag.yaml`), so YAML keys read as keywords; that is
 *    not an accident of this table but of the grammar, and it is why every editor paints a YAML key
 *    in its tag colour. IT REACHES THE JS FAMILY TOO, which is what the `support.class` row above it
 *    is for: tsx and jsx scope a JSX component `entity.name.tag.tsx support.class.component.tsx`,
 *    and tsx is this kit's most-shown language. Without that row the innermost scope claims nothing,
 *    the walk steps out to `entity.name.tag`, and `<Badge>` paints as a keyword while the `Badge`
 *    imported two lines above it stays a type — one identifier, two colours, one screen. A lower-case
 *    intrinsic tag (`<div>`) carries no `support.class` and still reads as a keyword, which is
 *    colour the house did not have.
 *  - `entity.name.function` HAS NO ROW, so a function name is plain. The house paints `load` and
 *    `has` plain and there is no function kind to promote them to. Two neighbours of it do have
 *    rows: `entity.name.command` (`npm`, `curl`, `date` — the command word of a shell statement)
 *    and `support.function` (`echo`, `var`, `COUNT`, `Get-ChildItem`) both take `keyword`, which
 *    matches `codeBlockLanguageKeywords.bash` naming `npm`, `cd`, `ssh` and `sudo`, and extends it
 *    to the rest of the line's verbs instead of colouring four of them and not the fifth. PYTHON IS
 *    CARVED OUT OF THAT ROW, by the `support.function.builtin.python` row above it, because the
 *    argument does not transfer: the shell scope marks the command WORD of a statement and nothing
 *    else, while the python grammar attaches its own to a builtin NAME in any position. Left in,
 *    `[id for id in self.languages]` paints three occurrences of an ordinary loop variable the same
 *    info blue as `for` and `if`, which contradicts this table's own "an identifier whose name the
 *    reader chose is plain". The row's kind is `plain`, which is this table's way of saying DEFER —
 *    see `CodeHighlighterState`'s own comment on what a `plain` run is handed to.
 *  - `constant.language` takes `literal` and `constant.numeric` takes `number`. The first is the
 *    house's own JSON and YAML rule generalised: `LITERAL_LANGUAGES` paints `true` / `false` /
 *    `null` as a literal there, and `constant.language` is precisely that scope in every grammar
 *    that has one. It does move Python's `True` / `False` / `None`, which the house lists among
 *    python's KEYWORDS because a keyword list is all it has; the grammar knows they are constants,
 *    and putting them in the bucket the house already uses for the same three words in JSON is the
 *    smaller inconsistency.
 *  - `diff` gets FOUR of the nine and no red. `markup.inserted` takes `string`, whose ink is
 *    `--success-subtle-foreground`, so an added line is green; `markup.deleted` takes `number`,
 *    whose ink is `--warning-subtle-foreground`, because that is the only warm family in a ramp
 *    that deliberately has no destructive member. The hunk header `@@ …` takes `keyword`, the
 *    `---`/`+++` file lines take `comment`, and an unchanged context line carries only `source.diff`
 *    and stays `plain`. Adding a tenth kind for red was not an option and would not have been the
 *    right one: the ramp is a CODE ramp, and `destructive` in this kit means a failed state.
 *  - MARKDOWN emphasis stays plain. `markup.bold` and `markup.italic` have no row because nine
 *    kinds meant for code contain nothing that means "bolder"; their `**` and `*` delimiters take
 *    punctuation from the generic row and that is the whole signal. Raw spans, fenced bodies and
 *    link targets take `string`, a heading takes `keyword`, and a blockquote takes `comment` —
 *    muted, which is what a quote reads as.
 *  - THE THREE CONFIG FORMATS DISAGREE ABOUT KEYS and this table follows each grammar rather than
 *    inventing a fourth answer: JSON's is inside `string` and comes out green (pinned by the house
 *    rule above), YAML's is `entity.name.tag` and comes out blue, TOML's is `variable.other.key`
 *    and comes out purple. Recorded because it is visible, not because it is a defect to fix.
 */
export const CODE_HIGHLIGHTER_SCOPES: readonly CodeHighlighterScopeRule[] = [
	// Strings and their punctuation. `string.unquoted` first, or a shell argument turns green.
	{ scope: "string.unquoted", kind: "plain" },
	{ scope: "string", kind: "string" },
	{ scope: "punctuation.definition.string", kind: "string" },
	{ scope: "comment", kind: "comment" },

	// Literals and numbers. Escapes, colour values and the interior of a number are containers
	// rather than rows, because their punctuation is scoped INSIDE them.
	{ scope: "constant.numeric", kind: "number" },
	{ scope: "constant.language", kind: "literal" },

	// Types. The property-name row must stay above `support.type`; see the table's comment.
	{ scope: "support.type.property-name", kind: "keyword" },
	{ scope: "support.type", kind: "type" },
	{ scope: "support.class", kind: "type" },
	{ scope: "entity.name.type", kind: "type" },
	{ scope: "entity.other.inherited-class", kind: "type" },

	// Keys, fields and the two stylesheet variable spellings.
	{ scope: "variable.css", kind: "property" },
	{ scope: "variable.scss", kind: "property" },
	{ scope: "variable.argument", kind: "property" },
	{ scope: "variable.other.key", kind: "property" },
	{ scope: "variable.object.property", kind: "property" },
	// Both halves of a declared member. Without the second, `{ name: string; load: () => void }`
	// paints `name` as a property (it is `variable.object.property`) and `load` as plain (it is
	// `entity.name.function`, which has no row) — one object type, two colours for one idea.
	{ scope: "meta.definition.property", kind: "property" },
	{ scope: "meta.object-literal.key", kind: "property" },
	{ scope: "entity.other.attribute-name", kind: "property" },

	// Words the language owns. Every one of these is subject to the no-letter downgrade in
	// `codeHighlighterKindOf`, which is what keeps `=>` and `&` out of the keyword ink.
	{ scope: "entity.name.tag", kind: "keyword" },
	{ scope: "entity.name.command", kind: "keyword" },
	{ scope: "entity.name.section", kind: "keyword" },
	// Python's builtins are names rather than verbs, and this row must stay above the general one.
	{ scope: "support.function.builtin.python", kind: "plain" },
	{ scope: "support.function", kind: "keyword" },
	{ scope: "support.constant", kind: "keyword" },
	{ scope: "storage.modifier", kind: "keyword" },
	{ scope: "storage.type", kind: "keyword" },
	{ scope: "keyword", kind: "keyword" },

	// Markdown. Its structure is all `markup.*`, and none of it is code.
	{ scope: "markup.inline.raw", kind: "string" },
	{ scope: "markup.fenced_code", kind: "string" },
	{ scope: "markup.underline.link", kind: "string" },
	{ scope: "markup.quote", kind: "comment" },
	{ scope: "markup.heading", kind: "keyword" },

	// THE ONE `meta.*` ROW, and it is here because the JS family scopes a grouping paren and an array
	// bracket `meta.brace.round.ts` / `meta.brace.square.ts` rather than `punctuation.*` — every other
	// language in this table (python, go, rust, java, csharp) emits punctuation for the same
	// characters. Without it `list.map((n) => n + 1)` renders its two touching parens in two colours:
	// the inner one is `punctuation.definition.parameters.begin.ts` and grey, the outer one falls
	// through to plain and is full ink. tsx is the block's default language, so this is the most-seen
	// gap there was.
	{ scope: "meta.brace", kind: "punctuation" },
	// Last, so every more specific punctuation row above has already had its turn.
	{ scope: "punctuation", kind: "punctuation" },
];

/**
 * Which languages paint a capitalised identifier the grammar had no better name for as a type.
 *
 * The house's own rule, kept rather than dropped: its classifier ends with
 * `if (/^[A-Z]/.test(token) && TYPE_CASED_LANGUAGES.includes(language)) return "type"` over exactly
 * these four ids. Without it a streamed TSX block would repaint `NAMES`, `Set` and `JSON` from
 * violet to white the moment the grammar landed — a change the reader would read as a bug. Shiki
 * already names the genuine types (`entity.name.type`, `support.type`, `support.class`), so this
 * only fires on what is left over, which is the same set the house was guessing at.
 *
 * IT IS NOT MADE REDUNDANT by `#tokenizeLine` handing every `plain` run to the house, and the two
 * cannot disagree: the house's rule is this rule, over these four ids. What it buys is that
 * {@link codeHighlighterKindOf} is a COMPLETE answer on its own — it is exported, and a caller
 * mapping scopes with it should not have to know that a second pass finishes the job.
 */
export const CODE_HIGHLIGHTER_TYPE_CASED_LANGUAGES: readonly CodeBlockLanguageId[] = [
	"tsx",
	"jsx",
	"ts",
	"js",
];

/** Any letter in any script — the test that separates a keyword from an operator symbol. */
const CONTAINS_LETTER = /\p{L}/u;

/** A capitalised identifier, for {@link CODE_HIGHLIGHTER_TYPE_CASED_LANGUAGES}. */
const TYPE_CASED = /^[A-Z]/;

/**
 * The house tokenizer's own answer for a run this table had nothing to say about, or `undefined`
 * for a language the house has no grammar for.
 *
 * WHY THE HOUSE GETS THE LAST WORD ON A `plain` RUN. `plain` is the one kind that means "nothing
 * here", and the house often has an opinion about the very same characters: `(` and `[` it calls
 * punctuation, `--ring` inside an at-rule the css grammar does not model it calls a custom
 * property, the `-` of `--save-dev` it greys. Handing those runs back to
 * {@link tokenizeCodeBlockLine} is what makes this table's governing rule — may ADD colour, must
 * not repaint what the house had an opinion about — true by construction over every run the table
 * does not claim, instead of true by inspection. It cannot lose colour either: the worst it can do
 * is agree with what the reader was already looking at.
 *
 * It answers `undefined` outside the house's fourteen ids (`isCodeBlockLanguage`), where there is
 * no keyword table, no comment syntax and no quote set to consult — `rust`, `go`, `html` and the
 * other seventeen rows of {@link CODE_HIGHLIGHTER_GRAMMARS} keep the plain run they were given.
 */
function houseLanguageOf(language: CodeBlockLanguageId): CodeBlockLanguage | undefined {
	return isCodeBlockLanguage(language) ? language : undefined;
}

/** The enclosing kind for a scope stack, or `undefined` when no container claims it. */
function containerKindOf(scopes: readonly string[]): CodeBlockTokenKind | undefined {
	// Outermost first: a `string.quoted` nested inside a template literal's `${…}` must still win
	// over the transparent template that encloses it.
	for (const scope of scopes) {
		for (const rule of CODE_HIGHLIGHTER_CONTAINER_SCOPES) {
			if (!matchesScope(scope, rule.scope)) continue;
			// A transparent row decides nothing, and stops this scope being tested against the more
			// general rows below it. The scan continues inward.
			if (rule.kind === undefined) break;
			return rule.kind;
		}
	}
	return undefined;
}

/** Whether the first container row `scope` matches is a transparent one. */
function isTransparentContainer(scope: string): boolean {
	for (const rule of CODE_HIGHLIGHTER_CONTAINER_SCOPES) {
		if (matchesScope(scope, rule.scope)) return rule.kind === undefined;
	}
	return false;
}

/**
 * What one Shiki token is, in the kit's own nine-kind vocabulary.
 *
 * Three passes, in this order: the containers of {@link CODE_HIGHLIGHTER_CONTAINER_SCOPES}, then
 * {@link CODE_HIGHLIGHTER_SCOPES} innermost-first, then the capitalised-identifier fallback of
 * {@link CODE_HIGHLIGHTER_TYPE_CASED_LANGUAGES}. A stack nothing claims is `plain`.
 *
 * `text` is not decoration. It carries the no-letter downgrade — a `keyword`-kind token spelled `=>`
 * or `&&` is punctuation, because a keyword is a WORD — and the capital test the last pass needs.
 * `language` is the CANONICAL id, already through {@link resolveCodeBlockLanguage}.
 *
 * PURE, and it has to be: it runs once per token inside a `$derived` (rule 5 of the ten in
 * `code-block.svelte`), so it reads no state and writes none.
 */
export function codeHighlighterKindOf(
	scopes: readonly string[],
	text: string,
	language: CodeBlockLanguageId,
): CodeBlockTokenKind {
	const container = containerKindOf(scopes);
	if (container !== undefined) return container;

	for (let index = scopes.length - 1; index >= 0; index -= 1) {
		const scope = scopes[index];
		// A TRANSPARENT CONTAINER SHIELDS WHAT IT HOLDS, and this is the half of the word that the
		// container pass alone cannot deliver. Reaching one from further in means every more specific
		// scope has already been tested and none claimed the token — so it is interior structure of a
		// construct this table has nothing to say about, and it is plain rather than the container's
		// own kind. Without it a template literal's `${id}` walks out to `string.template.ts`, matches
		// the generic `string` row, and the interpolated expression paints as string ink after all.
		// The container still answers for itself when it IS the innermost scope, which is how the
		// literal chunks of a template stay green and a bare shell argument stays plain.
		if (index < scopes.length - 1 && isTransparentContainer(scope)) break;
		for (const rule of CODE_HIGHLIGHTER_SCOPES) {
			if (!matchesScope(scope, rule.scope)) continue;
			return rule.kind === "keyword" && !CONTAINS_LETTER.test(text) ? "punctuation" : rule.kind;
		}
	}

	return CODE_HIGHLIGHTER_TYPE_CASED_LANGUAGES.includes(language) && TYPE_CASED.test(text)
		? "type"
		: "plain";
}

/**
 * A line longer than this is emitted as one `plain` run instead of being tokenised.
 *
 * A minified bundle pasted into a chat is one line of a hundred thousand characters, and a
 * backtracking grammar over it is the one way this adapter could freeze a tab. The line still
 * renders — with its own text, so rule 8 passes — it is simply not coloured. The rule stack is
 * carried across it unchanged, so the lines after it resume from the state before it; that is
 * approximate for a construct that opens inside a capped line, and the alternative is paying the
 * cost the cap exists to avoid.
 */
export const CODE_HIGHLIGHTER_MAX_LINE_LENGTH = 2000;

/**
 * The per-line budget handed to `Grammar.tokenizeLine`, in milliseconds.
 *
 * Half of the 500 ms Shiki's own tokenizer defaults to, because a code block is not an editor: a
 * line that needs longer is one the reader would rather see plain than wait for. When the budget
 * runs out the grammar returns what it had and the last token stops short of the end of the line —
 * `CodeHighlighterState` appends the remainder as one `plain` run, without which rule 8 would
 * reject the row.
 */
export const CODE_HIGHLIGHTER_LINE_TIME_LIMIT_MS = 250;

/**
 * What a grammar is warmed with when no block has asked for it yet — the `languages` preload path.
 *
 * ONE CHARACTER BUYS MOST OF IT, and that is a fact about the engine rather than a hopeful guess: a
 * TextMate scan has to build the scanner for the WHOLE active rule set before it can match
 * anything, so the first `tokenizeLine` against a grammar compiles every top-level pattern whatever
 * the line says. Measured against this repo's 3.23.0, one fresh process per figure, preloading `ts`
 * and then painting the 22-line snippet the gallery's own page shows:
 *   - warming skipped: 3.1 ms in the promise, then 107.0 ms inside the block's `$derived`
 *   - warmed with this line: 57.7 ms in the promise, then 56.6 ms inside the `$derived`
 * Half the freeze, moved off the frame that repaints. Richer warm-up lines were measured and none
 * beat a bare letter by more than the noise, because what is left is the rules for constructs the
 * snippet actually contains — a block comment, a template literal — which no fixed string can
 * guess. Warming with the REAL code does reach them, and costs the `$derived` 0.0 ms, which is why
 * {@link CodeHighlighterState.load} prefers it and this is only the fallback for a preload that
 * no block has asked about yet.
 *
 * It is a bare letter rather than a snippet of anything because it must not OPEN a construct: the
 * rule stack it produces is discarded, and a string or comment left half-open would compile that
 * construct's rules and nothing else. A letter enters the top level of every grammar in the table.
 */
const CODE_HIGHLIGHTER_WARMUP_LINE = "a";

/** The opaque state a grammar carries from one line to the next. Shiki's `StateStack`, or null. */
type CodeHighlighterRuleStack = Parameters<Grammar["tokenizeLine"]>[1];

/** One language's last answer, kept so a streamed chunk re-tokenises only what changed. */
type CodeHighlighterMemo = {
	/** The lines that produced {@link CodeHighlighterMemo.rows}. */
	lines: string[];
	/** One row of tokens per line. */
	rows: CodeBlockToken[][];
	/** `stacks[i]` is the rule stack AFTER line `i` — what line `i + 1` resumes from. */
	stacks: CodeHighlighterRuleStack[];
};

/** Construction inputs for {@link CodeHighlighterState}. */
export type CodeHighlighterStateProps = {
	/**
	 * Extra or replacement loaders, MERGED OVER {@link CODE_HIGHLIGHTER_GRAMMARS}: a new key adds a
	 * language, an existing key replaces that row's loader. Read once, in the constructor.
	 *
	 * KEYS ARE CANONICALISED with {@link resolveCodeBlockLanguage} as they are merged, so
	 * `typescript`, `TypeScript` and `ts` all name the same row and any of the three replaces the
	 * built-in one. Without that a row filed under an alias would be listed by
	 * {@link CodeHighlighterState.languages} and never used.
	 */
	grammars?: Readonly<Record<string, CodeHighlighterGrammar>>;
};

/**
 * A Shiki-backed implementation of the code block's `CodeBlockHighlighter` seam.
 *
 * WHAT IT IS FOR. The house tokenizer in `code-block.svelte.ts` runs one line at a time against a
 * keyword list, so nothing that spans lines — a block comment, a multi-line template literal, a
 * Python docstring — is coloured past its first line, and a keyword used as an identifier still
 * lights up. Both are stated in `code-block.svelte` as that tokenizer's approach rather than a
 * defect in it, and both are what handing the whole snippet to a real grammar lifts.
 *
 * IT USES THE GRAMMAR DIRECTLY AND LOADS NO THEME. `HighlighterCore.getLanguage(name)` answers a
 * `Grammar`, and `grammar.tokenizeLine(line, previousStack, timeLimit)` returns
 * `{ tokens, ruleStack, stoppedEarly }` with the full scope stack on every token and no theme
 * loaded at all. Measured against this repo's 3.23.0: 6.2 ms warm for 63 dense TypeScript lines,
 * versus 14.5 ms through `codeToTokensBase` with explanations, which runs the tokenizer twice to
 * produce the scopes this adapter needs. A theme is not merely unnecessary on that path — Shiki's
 * `theme: "none"` short-circuits and hands back one untokenised token per line — which is why there
 * is no theme option here to get wrong.
 *
 * THE FIRST TOKENISATION OF A GRAMMAR IS THE EXPENSIVE ONE, because that is when the engine
 * compiles the regexes the grammar actually reaches: about 80 ms for TypeScript, 14 ms for Python,
 * 0.8 ms for JSON, against 0.05-0.6 ms for every warm call after. That cost is why
 * {@link CodeHighlighterState.load} WARMS a grammar before it publishes it. One engine instance is
 * shared across every grammar so the regex cache is shared with it — TSX after TypeScript costs
 * 3.6 ms instead of 15.3.
 *
 * IT DEFERS TO THE HOUSE TOKENIZER ON EVERY RUN IT WOULD PAINT `plain`. `plain` is the one kind
 * that means "nothing here", and on those runs `tokenizeCodeBlockLine` gets the last word — see
 * {@link houseLanguageOf} for the whole argument, and `#tokenizeLine` for where it happens. It is
 * what makes the scope table's governing rule ("may add colour, must not repaint what the house had
 * an opinion about") hold over every run the table does not claim, rather than holding only where
 * somebody checked. It costs 4-10%: 1.42 -> 1.48 ms for the 22-line snippet the gallery page shows,
 * 33.8 -> 37.0 ms for the 2,975 lines of `src/app.css`, warm, measured both ways.
 *
 * IT OBEYS THE TEN RULES `code-block.svelte` STATES, and three of them shape this class:
 *   - Rule 5: `highlight` runs inside a `$derived`. It READS reactive state — the `SvelteSet` of
 *     loaded ids, which is how a grammar arriving later repaints only the blocks that were waiting
 *     on it — and writes none. Every write to that set happens in a promise continuation.
 *   - Rule 8: a row whose token texts do not concatenate to its line is rejected by the block. This
 *     class asserts the same thing per line and returns `undefined` for the WHOLE call if it ever
 *     fails, because a silently wrong answer is worse than no answer.
 *   - Rule 10: first paint is whatever `highlight` returns synchronously. Nothing here is awaited on
 *     the way to an answer; a language that is not loaded yet declines, and the house tokenizer
 *     paints until it is.
 *
 * IT IS CLIENT-ONLY BY CONSTRUCTION. A SvelteKit consumer renders this on the server, where there
 * is no reason to compile a grammar for markup that will be hydrated anyway, so the engine is
 * created lazily and only when `window` exists. On the server every call declines and every block
 * keeps the house tokenizer, which is exactly what it would do while a grammar loads in the browser.
 */
export class CodeHighlighterState implements CodeBlockHighlighter {
	readonly #grammars: Readonly<Record<string, CodeHighlighterGrammar>>;

	/** Created on first use, in the browser only. `undefined` on the server, forever. */
	#core: HighlighterCore | undefined;

	/**
	 * The ids a `$derived` may rely on: reactive, so a block that declined a language re-runs its
	 * `highlight` the moment that language lands — and only the blocks that read that id do.
	 */
	readonly #loaded = new SvelteSet<CodeBlockLanguageId>();

	/** In-flight loads, deduped. A plain `Map`: nothing renders from it. */
	readonly #loading = new Map<CodeBlockLanguageId, Promise<void>>();

	/** Ids whose load threw. Never retried; warned about once, in development. */
	readonly #failed = new Set<CodeBlockLanguageId>();

	/** The last code each language was asked about, so `load` can warm the grammar with it. */
	readonly #requests = new Map<CodeBlockLanguageId, string>();

	/** One memo per language. See {@link CodeHighlighterState.highlight} for what it buys. */
	readonly #memo = new Map<CodeBlockLanguageId, CodeHighlighterMemo>();

	/**
	 * THE CALLER'S KEYS ARE CANONICALISED ON THE WAY IN, which is what makes the merge mean what its
	 * prop doc says. Every lookup below — `isSupported`, `isReady`, `load`, `highlight` — runs the id
	 * through {@link resolveCodeBlockLanguage} first, so a row filed under any aliased spelling would
	 * be unreachable: `{ typescript: mine }` would ADD a `typescript` row that `languages` lists and
	 * `isSupported("typescript")` answers true for, while every block in that language went on being
	 * painted by the built-in `ts` row. Silent, and in the direction that looks like success. The
	 * seventeen spellings this affects are `CODE_BLOCK_LANGUAGE_ALIASES`, and `typescript` is the
	 * likeliest of them to be written by hand — `CODE_HIGHLIGHTER_GRAMMARS` is keyed `ts`, which is
	 * not the spelling a caller guesses from how tolerant every other entry point is.
	 *
	 * `Object.fromEntries` rather than a spread, because a key is caller data: assigning
	 * `merged["__proto__"]` on an object literal invokes the prototype setter instead of creating a
	 * property, while `fromEntries` defines it. The same hazard {@link ownEntry} guards on the way
	 * out.
	 */
	constructor(props: CodeHighlighterStateProps = {}) {
		const extra = props.grammars;
		this.#grammars = extra
			? Object.fromEntries([
					...Object.entries(CODE_HIGHLIGHTER_GRAMMARS),
					...Object.entries(extra).map(
						([key, grammar]) => [resolveCodeBlockLanguage(key), grammar] as const,
					),
				])
			: CODE_HIGHLIGHTER_GRAMMARS;
	}

	/** Every language this instance could paint, as canonical ids. Not reactive: the table is fixed. */
	get languages(): readonly CodeBlockLanguageId[] {
		return Object.keys(this.#grammars);
	}

	/** The languages whose grammar is loaded and warm. REACTIVE — read it to track them. */
	get loaded(): ReadonlySet<CodeBlockLanguageId> {
		return this.#loaded;
	}

	/** Whether this instance has a grammar row for `language` and has not already failed on it. */
	isSupported(language: CodeBlockLanguageId): boolean {
		const id = resolveCodeBlockLanguage(language);
		return ownEntry(this.#grammars, id) !== undefined && !this.#failed.has(id);
	}

	/** Whether `language` is loaded and warm, so `highlight` will answer for it. REACTIVE. */
	isReady(language: CodeBlockLanguageId): boolean {
		return this.#loaded.has(resolveCodeBlockLanguage(language));
	}

	/**
	 * Start loading whatever `language` needs, and return. Rule 4: `<CodeBlock.Root>`'s effect is the
	 * only caller inside the block, once per language it shows; the provider calls it for each entry
	 * of its `languages` prop.
	 *
	 * Returns `void` rather than the promise, deliberately. The seam has no way to await it and no
	 * reason to: readiness is reported by `highlight` answering differently, which is rule 10.
	 */
	prepare(language: CodeBlockLanguageId): void {
		void this.load(language);
	}

	/**
	 * Load a grammar, warm it, and publish it. Resolves once the block will accept its answer.
	 *
	 * THE ORDER OF THE LAST TWO STEPS IS THE POINT. Fetching the module is cheap; the first
	 * tokenisation against a grammar is not, because that is when the engine compiles the regexes it
	 * reaches — 80 ms for TypeScript on a single line, and still 36 ms more for a 63-line block.
	 * Tokenising the last code that asked for this language BEFORE adding the id to the reactive set
	 * puts that cost inside this promise continuation and fills the memo, so the render the set's
	 * change schedules reads an answer that is already computed. Publish first and the whole compile
	 * lands on the frame that repaints the block. `#warm` is where that happens, and it warms on the
	 * PRELOAD path too, where no block has asked yet and there is no such code — without which
	 * `languages` would be the slower option for exactly the jank it is offered to avoid.
	 *
	 * A FAILURE IS PERMANENT AND QUIET. The id goes into a set that is never retried and never read
	 * reactively, so the block stays on the house tokenizer and the page renders. A grammar bundle is
	 * third-party code fetched at runtime; the one thing it must not do is take the page with it.
	 */
	async load(language: CodeBlockLanguageId): Promise<void> {
		const id = resolveCodeBlockLanguage(language);
		if (this.#loaded.has(id) || this.#failed.has(id)) return;

		const pending = this.#loading.get(id);
		if (pending) return pending;

		const grammar = ownEntry(this.#grammars, id);
		if (!grammar) return;

		// The server has nothing to gain from a compiled grammar and would pay for one on every
		// request. Declining here is what keeps SSR on the house tokenizer.
		if (typeof window === "undefined") return;

		const run = (async () => {
			try {
				const core = this.#ensureCore();
				const module = await grammar.load();
				// The WHOLE array. `@shikijs/langs/html` exports `[javascript, css, html]` — embedded
				// grammars first — and passing only the last element throws `Missing languages`.
				// Registrations already held are skipped, which is what makes `bash` and `curl` sharing
				// `shellscript` free.
				core.loadLanguageSync(module.default);
				this.#warm(id, grammar.name);
				// Reactive write, LAST, and in a continuation — never during a derivation.
				this.#loaded.add(id);
			} catch (error) {
				this.#failed.add(id);
				if (import.meta.env.DEV) {
					console.warn(
						`[code-highlighter] the \`${id}\` grammar failed to load; blocks in that language keep the house tokenizer.`,
						error,
					);
				}
			} finally {
				this.#loading.delete(id);
			}
		})();

		this.#loading.set(id, run);
		return run;
	}

	/**
	 * Paint a whole snippet, or decline it.
	 *
	 * DECLINES, in the order they are tested: a language with no row in the grammar table (which is
	 * how `text` and `csv` decline — there is nothing to paint and the house already paints them
	 * well), a language whose load failed, and a language that has not finished loading. The third is
	 * the interesting one: reading {@link CodeHighlighterState.loaded} is what subscribes the calling
	 * derivation to that id, so the block repaints by itself when the grammar lands, with no `await`
	 * anywhere in the code block (rule 10).
	 *
	 * IT FOLDS `\r\n?` AND SPLITS ON `\n` ITSELF, and never lets Shiki split lines. IT DOES NOT DROP
	 * A TRAILING NEWLINE, and that is the whole of it: the block hands over `lines.join("\n")`, and
	 * re-splitting a join on `\n` is the identity, so one row per line falls out by construction.
	 * Dropping a trailing newline here as well would NOT be idempotent — the block drops only ONE, for
	 * a reason it states, so a snippet whose last rendered line is blank arrives with a trailing `\n`
	 * still on it and a second strip answers one row short. Rule 7 rejects the whole answer on a count
	 * mismatch, so that one character decides whether an entire block is painted by a grammar or by
	 * the house: a template literal ending on a blank line, a CRLF file ending `\r\n\r\n`, and every
	 * streamed chunk that lands on a paragraph break — which would flip the block back to house
	 * colours for one frame and forward again on the next.
	 *
	 * THE MEMO IS FOR STREAMING, not for caching. A chat answer arrives one chunk at a time and every
	 * chunk re-renders the same block with a longer string, so the answer is rebuilt from the longest
	 * common LINE PREFIX of the previous one plus that prefix's stored rule stacks: only the lines
	 * that actually changed are tokenised again. It is keyed by language, so two blocks of one
	 * language on a page take turns overwriting it and each pays a full pass — which at 0.05-0.6 ms a
	 * warm line is a cost worth the simpler invariant.
	 *
	 * IT VERIFIES ITSELF. Every row is checked against its line before it is kept, and one failure
	 * discards the whole answer. Rule 8 would reject the row anyway; catching it here is what stops
	 * this adapter from quietly returning something almost right.
	 */
	highlight(code: string, language: CodeBlockLanguageId): CodeBlockToken[][] | undefined {
		const id = resolveCodeBlockLanguage(language);
		const entry = ownEntry(this.#grammars, id);
		if (!entry || this.#failed.has(id)) return undefined;

		// Recorded before the readiness test, so `load` has the code to warm the grammar with.
		this.#requests.set(id, code);

		if (!this.#loaded.has(id)) {
			void this.load(id);
			return undefined;
		}

		return this.#tokenize(id, entry.name, code);
	}

	/**
	 * Release the engine and every memo. Only the component that CREATED an instance disposes it — a
	 * `highlighter` passed in from outside outlives the provider that published it.
	 */
	dispose(): void {
		this.#core?.dispose();
		this.#core = undefined;
		this.#loaded.clear();
		this.#loading.clear();
		this.#failed.clear();
		this.#requests.clear();
		this.#memo.clear();
	}

	/**
	 * The one engine, created on first use.
	 *
	 * `forgiving: true` is what keeps a pattern the JavaScript engine cannot translate from throwing:
	 * it drops that pattern instead, so the language still renders with one rule missing rather than
	 * not at all. `langs: []` and `themes: []` because the first are loaded later and the second
	 * never — see the class comment.
	 */
	#ensureCore(): HighlighterCore {
		this.#core ??= createHighlighterCoreSync({
			engine: createJavaScriptRegexEngine({ forgiving: true }),
			langs: [],
			themes: [],
		});
		return this.#core;
	}

	/**
	 * Compile this grammar's regexes BEFORE `load` publishes the id, so the render that publishing
	 * schedules is not the one that pays for them. See `load` for why the order is the point.
	 *
	 * TWO PATHS, and the second is the reason this method is not one line. When a block has already
	 * asked for the language — the ordinary case, since `<CodeBlock.Root>`'s effect calls `prepare`
	 * only for a block that is on screen — the last code it asked about is tokenised, which both
	 * compiles the grammar and fills the memo, so the repaint reads an answer already computed.
	 *
	 * ON THE PRELOAD PATH THERE IS NO SUCH CODE. `<CodeHighlighter.Root languages={…}>` starts a
	 * grammar for a block that may not exist yet, and `#requests` is written only by `highlight`.
	 * Returning early there would publish a COLD grammar and move its whole compile — 115 ms for
	 * TypeScript — into the first block's `$derived`, making the preload the slower option for the
	 * jank it is advertised to avoid. {@link CODE_HIGHLIGHTER_WARMUP_LINE} is what closes that gap,
	 * and it deliberately does NOT touch the memo: a fabricated line is not an answer about anything,
	 * and a memo whose first line is a lie only costs the next call its prefix reuse.
	 */
	#warm(id: CodeBlockLanguageId, name: string): void {
		const code = this.#requests.get(id);
		if (code !== undefined) {
			this.#tokenize(id, name, code);
			return;
		}

		try {
			this.#core
				?.getLanguage(name)
				.tokenizeLine(CODE_HIGHLIGHTER_WARMUP_LINE, null, CODE_HIGHLIGHTER_LINE_TIME_LIMIT_MS);
		} catch {
			// Warming is an optimisation, and a grammar that cannot tokenise a letter is one
			// `highlight` will decline anyway. `load`'s own catch is what records a real failure.
		}
	}

	/** The whole snippet, one row per line, or `undefined` if anything at all disagreed. */
	#tokenize(id: CodeBlockLanguageId, name: string, code: string): CodeBlockToken[][] | undefined {
		const core = this.#core;
		if (!core) return undefined;

		let grammar: Grammar;
		try {
			grammar = core.getLanguage(name);
		} catch {
			return undefined;
		}

		// FOLD, THEN SPLIT — and nothing else. Stripping a trailing newline here is the defect
		// `highlight`'s comment describes; the fold stays because the block folds too, so a caller
		// reaching this class directly gets the same lines the block would have rendered.
		const lines = code.replace(/\r\n?/g, "\n").split("\n");
		const memo = this.#memo.get(id);

		let reused = 0;
		if (memo) {
			const limit = Math.min(memo.lines.length, lines.length);
			while (reused < limit && memo.lines[reused] === lines[reused]) reused += 1;
		}

		const rows = memo ? memo.rows.slice(0, reused) : [];
		const stacks = memo ? memo.stacks.slice(0, reused) : [];
		let stack: CodeHighlighterRuleStack = reused > 0 ? stacks[reused - 1] : null;

		for (let index = reused; index < lines.length; index += 1) {
			const produced = this.#tokenizeLine(grammar, lines[index], stack, id);
			if (!produced) return undefined;
			rows.push(produced.row);
			stacks.push(produced.stack);
			stack = produced.stack;
		}

		this.#memo.set(id, { lines, rows, stacks });
		return rows;
	}

	/**
	 * One line, as classified runs, plus the rule stack the next line resumes from.
	 *
	 * The gaps BETWEEN tokens are not dropped, and neither is the tail Shiki leaves behind when it
	 * stops early — those two are what make the concatenation equal the line. Adjacent runs of one
	 * kind are merged, which is not only tidiness: the YAML grammar splits `name` into `n` and `ame`
	 * with identical scopes, and a row of one-character spans is a row the browser has to lay out.
	 *
	 * EVERY RUN THIS TABLE ANSWERS `plain` FOR IS HANDED TO THE HOUSE TOKENIZER, gaps and tail
	 * included, which is where {@link houseLanguageOf} states the reasoning. `plain` means the table
	 * had nothing to say, and the house often does about the same characters — the `(` of
	 * `list.map(…)` in a language whose grammar scopes it `meta.brace`, a `--ring` inside a Tailwind
	 * at-rule the css grammar does not model, the `-` of `--save-dev` inside a shell argument. The
	 * splice is what turns "may add colour, must not repaint" from a promise in a comment into the
	 * code that keeps it. Concatenation survives it because `tokenizeCodeBlockLine` reproduces its
	 * input exactly, which is the same guarantee this method is checked against below.
	 *
	 * THE OVER-LENGTH LINE IS THE ONE RUN THAT KEEPS ITS `plain`. A minified bundle pasted into a
	 * chat is one line of a hundred thousand characters, and the cap exists to spend nothing on it;
	 * handing it to a second scanner instead would be spending it twice.
	 *
	 * `undefined` means the row disagreed with its line and the whole answer must be discarded.
	 */
	#tokenizeLine(
		grammar: Grammar,
		line: string,
		stack: CodeHighlighterRuleStack,
		language: CodeBlockLanguageId,
	): { row: CodeBlockToken[]; stack: CodeHighlighterRuleStack } | undefined {
		if (line.length > CODE_HIGHLIGHTER_MAX_LINE_LENGTH) {
			return { row: [{ text: line, kind: "plain" }], stack };
		}

		const result = grammar.tokenizeLine(line, stack, CODE_HIGHLIGHTER_LINE_TIME_LIMIT_MS);
		const house = houseLanguageOf(language);
		const row: CodeBlockToken[] = [];
		let cursor = 0;

		const push = (text: string, kind: CodeBlockTokenKind): void => {
			if (text === "") return;
			const last = row.at(-1);
			if (last && last.kind === kind) last.text += text;
			else row.push({ text, kind });
		};

		/** A run of `kind`, or — when that kind is `plain` — the house tokenizer's reading of it. */
		const pushRun = (text: string, kind: CodeBlockTokenKind): void => {
			if (kind !== "plain" || house === undefined) {
				push(text, kind);
				return;
			}
			for (const token of tokenizeCodeBlockLine(text, house)) push(token.text, token.kind);
		};

		for (const token of result.tokens) {
			if (token.endIndex <= cursor) continue;
			const start = Math.max(token.startIndex, cursor);
			if (start > cursor) pushRun(line.slice(cursor, start), "plain");
			const text = line.slice(start, token.endIndex);
			pushRun(text, codeHighlighterKindOf(token.scopes, text, language));
			cursor = token.endIndex;
		}

		// `stoppedEarly`, and any character no rule claimed.
		if (cursor < line.length) pushRun(line.slice(cursor), "plain");

		if (row.map((token) => token.text).join("") !== line) return undefined;
		return { row, stack: result.ruleStack };
	}
}

/**
 * A key of its own, in this folder, alongside the code block's.
 *
 * The provider publishes itself TWICE: on this key, so a consumer can reach the instance and ask it
 * what is loaded, and through `setCodeBlockHighlighterContext`, which is the seam every
 * `<CodeBlock.Root>` below reads. Two keys because they answer different questions — this one hands
 * back a `CodeHighlighterState`, with `loaded`, `isReady` and `prepare` on it, and the block's hands
 * back the bare `CodeBlockHighlighter` contract, which any object at all may satisfy.
 */
const CODE_HIGHLIGHTER_CONTEXT_KEY = Symbol("code-highlighter");

/**
 * Publish `state` to every descendant. Call it during component initialisation, as `setContext`
 * requires. It does NOT install the code block's seam — `<CodeHighlighter.Root>` calls
 * `setCodeBlockHighlighterContext` beside this one, and a caller wiring the two by hand must too.
 */
export function setCodeHighlighterContext(state: CodeHighlighterState): CodeHighlighterState {
	return setContext(CODE_HIGHLIGHTER_CONTEXT_KEY, state);
}

export function hasCodeHighlighterContext(): boolean {
	return hasContext(CODE_HIGHLIGHTER_CONTEXT_KEY);
}

/**
 * The published state, or a thrown error naming the consumer — the shape `getDirectionContext` uses
 * in `ui/direction-provider`. For the ordinary case, where having no provider above is not an error,
 * {@link useCodeHighlighter} is the accessor to reach for.
 */
export function getCodeHighlighterContext(consumer?: string): CodeHighlighterState {
	if (!hasCodeHighlighterContext()) {
		const label = consumer ?? "`<CodeHighlighter>` consumer";
		throw new Error(`${label} must be used within \`<CodeHighlighter.Root>\`.`);
	}
	return getContext<CodeHighlighterState>(CODE_HIGHLIGHTER_CONTEXT_KEY);
}

/**
 * The nearest published state, or `undefined` when there is none. Never throws, and must be called
 * during component initialisation.
 */
export function useCodeHighlighter(): CodeHighlighterState | undefined {
	return hasCodeHighlighterContext() ? getCodeHighlighterContext() : undefined;
}
