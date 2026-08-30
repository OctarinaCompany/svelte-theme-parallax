<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as CodeBlock from "$lib/components/ui/code-block/index.js";
	import * as CodeHighlighter from "$lib/components/ui/code-highlighter/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Table from "$lib/components/ui/table/index.js";
	import { href } from "$lib/hooks/route.svelte.js";
	import {
		CODE_HIGHLIGHTER_CONTAINER_SCOPES,
		CODE_HIGHLIGHTER_GRAMMARS,
		CODE_HIGHLIGHTER_LINE_TIME_LIMIT_MS,
		CODE_HIGHLIGHTER_MAX_LINE_LENGTH,
		CODE_HIGHLIGHTER_SCOPES,
		CODE_HIGHLIGHTER_TYPE_CASED_LANGUAGES,
	} from "$lib/components/ui/code-highlighter/index.js";
	import {
		ADAPTER_REPORT_TS,
		GRAMMAR_TOUR,
		STREAMED_REPORT_CHUNKS,
		STREAMED_REPORT_PY,
	} from "./code-highlighter-sample-snippets.js";

	/**
	 * The Code highlighter page — the Shiki adapter that fills the code block's highlighter seam.
	 *
	 * THIS PAGE DOCUMENTS A COMPONENT THAT DRAWS NOTHING. `<CodeHighlighter.Root>` renders no
	 * element: it publishes a highlighter on context and every `<CodeBlock.Root>` below it upgrades.
	 * So every demo here is a code block, and what is being shown is the DIFFERENCE between two
	 * tokenizers on the same characters — which is why the second section puts them side by side
	 * rather than describing the gap.
	 *
	 * ONE PROVIDER PER SECTION, WHICH IS NOT WHAT AN APP SHOULD DO, and the reason is the gallery
	 * rather than the component. `tools/site/section-source.mjs` cuts each `DocSection` out as a
	 * standalone example, so a section whose provider lived at the top of the page would copy as
	 * markup that paints nothing. Mounting one per section keeps every example true on its own; the
	 * cost is a second engine compiling `ts` twice, because the first two sections share a snippet
	 * and nothing else here overlaps. An application mounts ONE, at the root — the item's registry
	 * description and its post-install note both say so, and this page says it in prose below.
	 *
	 * WHERE IT SITS NEXT TO CODE BLOCK. The block is the component: the frame, the gutter, the
	 * selector, the copy and download buttons, and a tokenizer of its own that reads one line at a
	 * time against a keyword list. This is only the tokenizer, swapped — nothing on the block's page
	 * changes to allow it, and a block with no provider above it still renders. The section to look
	 * at across the twelve palettes is "Scopes and kinds": the adapter emits the same nine kinds the
	 * block already paints, so the ramp is Code block's and the mapping is what is new.
	 */

	type PropRow = { prop: string; type: string; default: string; description: string };

	/** The streaming demo, one chunk of {@link STREAMED_REPORT_PY} at a time. */
	const STREAM_TICK_MS = 420;

	/** How many lines the finished snippet has, for the readout under the streaming demo. */
	const STREAM_TOTAL_LINES = STREAMED_REPORT_PY.split("\n").length;

	let streamed = $state(STREAMED_REPORT_CHUNKS[0] ?? "");
	let streaming = $state(false);
	let streamTimer: ReturnType<typeof setInterval> | null = null;

	const streamedLines = $derived(streamed.replace(/\n$/, "").split("\n").length);

	function stopStream() {
		if (streamTimer) clearInterval(streamTimer);
		streamTimer = null;
		streaming = false;
	}

	function startStream() {
		stopStream();
		streamed = STREAMED_REPORT_CHUNKS[0] ?? "";
		streaming = true;
		let index = 1;
		streamTimer = setInterval(() => {
			streamed += STREAMED_REPORT_CHUNKS[index] ?? "";
			index += 1;
			if (index >= STREAMED_REPORT_CHUNKS.length) stopStream();
		}, STREAM_TICK_MS);
	}

	// Nothing reactive is read, so this runs once: it exists only to stop a timer writing into a
	// page that is gone. The stream itself starts on the button rather than on mount, because the
	// point of the demo is watching the rows arrive.
	$effect(() => stopStream);

	/**
	 * The container pass, straight off the export, so the page cannot drift from the table.
	 *
	 * A row with no `kind` is TRANSPARENT — it claims nothing and the scan moves inward — which is
	 * a third state the four-column shape has no column for, so it is spelled in the kind cell.
	 */
	const containerRows = CODE_HIGHLIGHTER_CONTAINER_SCOPES.map((rule) => ({
		scope: rule.scope,
		kind: rule.kind ?? "—",
		note:
			rule.kind === undefined
				? "Transparent: it decides nothing and the scan moves inward."
				: "Every token beneath it takes this kind, whatever its own scope says.",
	}));

	/** Every language this adapter carries, off the exported table. */
	const grammarRows = Object.entries(CODE_HIGHLIGHTER_GRAMMARS).map(([language, grammar]) => ({
		language,
		name: grammar.name,
	}));

	/**
	 * Which rows bring another grammar with them, and what that costs.
	 *
	 * The counts are the transitive `dist` modules of `@shikijs/langs` at the version this repo
	 * depends on, and they are the same figures `code-highlighter.svelte.ts` records over
	 * `CODE_HIGHLIGHTER_GRAMMARS`. The guests are what the language can HOST: a `<style>` block, a
	 * heredoc, an embedded query. Every other row is a single module, and the everyday ones are
	 * small — `json` and `jsonc` around 3 kB, `dockerfile` 2 kB, `yaml` 11 kB, `sql` 24 kB.
	 *
	 * THOSE ARE SOURCE BYTES, WHICH IS NOT WHAT A READER DOWNLOADS. Measured over this site's own
	 * production build, gzipped: the adapter and Shiki's core are one 54 kB chunk, paid once and
	 * only when a provider is mounted; a grammar chunk runs from 1 kB (`json`, `jsonc`, `diff`,
	 * `dockerfile`) through 16 kB for each of the JavaScript family to 45 kB for `cpp`, the
	 * heaviest. All thirty-two together would be 320 kB, which is the number to hold against the
	 * table below — and the number nobody pays, because a chunk arrives only when a block asks for
	 * that language.
	 */
	const embeddedGrammars = [
		{ language: "html", guests: "javascript, css", weight: "3 modules, ~292 kB" },
		{
			language: "svelte",
			guests: "javascript, typescript, css, postcss",
			weight: "5 modules, ~445 kB",
		},
		{ language: "scss", guests: "css", weight: "2 modules, ~81 kB" },
		{ language: "xml", guests: "java", weight: "2 modules, ~36 kB" },
		{
			language: "graphql",
			guests: "javascript, typescript, jsx, tsx",
			weight: "5 modules, ~751 kB",
		},
		{ language: "cpp", guests: "cpp-macro, regexp, glsl, c, sql", weight: "6 modules, ~765 kB" },
		{
			language: "php",
			guests: "html, javascript, css, xml, java, sql, json",
			weight: "8 modules, ~470 kB",
		},
		{
			language: "ruby",
			guests:
				"html, haml, xml, sql, graphql, css, cpp, c, javascript, shellscript, lua, yaml, and the grammars those pull in",
			weight: "20 modules, ~1.8 MB",
		},
	];

	/**
	 * What the two tokenizers do to the same characters.
	 *
	 * THE RULE BETWEEN THEM, which every row is checked against and which the scope table states in
	 * its own comment: the adapter may ADD colour where the house had none, and must not repaint
	 * what the house had an opinion about. The reason is streaming rather than taste — during a
	 * chat answer the house paints a line and this repaints it a second later, so a disagreement is
	 * a visible flicker. `plain` is not an opinion, which is why the additions below are additions.
	 *
	 * THE RULE IS ENFORCED RATHER THAN AUDITED, which is what lets this table be short. A run the
	 * scope tables answer `plain` for is handed to `tokenizeCodeBlockLine`, so wherever the grammar
	 * has nothing to say the house's answer stands unchanged. What is left is the handful of places
	 * the grammar DOES have something to say and disagrees, and the last five rows are all of them —
	 * counted, not sampled: a per-character diff of both tokenizers over every snippet this page and
	 * the Code block page render, plus `src/app.css`, finds no sixth.
	 */
	const houseComparison = [
		{
			token: "display, color, background (CSS)",
			house: "keyword",
			adapter: "keyword",
			why: "Pinned: `codeBlockLanguageKeywords.css` lists exactly these words, so `support.type.property-name` takes `keyword` rather than the `type` its scope suggests.",
		},
		{
			token: "--ring, and the id inside var()",
			house: "property",
			adapter: "property",
			why: "Pinned: the house classifier ends with a custom-property rule, and `variable.css` and `variable.argument` reproduce it in both positions. SCSS's `$brand` lands there too. Inside a Tailwind v4 at-rule the css grammar does not model — `@theme`, `@utility`, `@custom-variant` — the grammar hands back one unscoped run for the whole line, and the house tokenizer's answer stands for it, so the tokens keep their ink there as well.",
		},
		{
			token: '"name": in JSON',
			house: "string",
			adapter: "string",
			why: "Pinned by the container pass: a key's stack is `string.json support.type.property-name.json`, and the outermost row wins. A key is what it lexically is — which is the answer the block already commits to.",
		},
		{
			token: "true / false / null in JSON and YAML",
			house: "literal",
			adapter: "literal",
			why: "The house's own `LITERAL_LANGUAGES` rule, generalised: `constant.language` is that scope in every grammar that has one.",
		},
		{
			token: "=>, !==, &&, // in Python",
			house: "punctuation",
			adapter: "punctuation",
			why: "The no-letter downgrade: a token whose row says `keyword` but which contains no letter is punctuation. The house draws the line from the other side — its punctuation class is one symbol wide — so `=>` is two grey characters there and one grey run here.",
		},
		{
			token: "NAMES, Set in ts / tsx / js / jsx",
			house: "type",
			adapter: "type",
			why: "The capitalised-identifier fallback is kept, over the same four ids. It fires only when no scope matched at all, so it catches what the house was guessing at and nothing the grammar has named.",
		},
		{
			token: "load, has — a function name",
			house: "plain",
			adapter: "plain",
			why: "There is no function kind among the nine, so `entity.name.function` deliberately has no row.",
		},
		{
			token: "( ) [ ] in ts / tsx / js / jsx",
			house: "punctuation",
			adapter: "punctuation",
			why: "Pinned by `meta.brace`, the scope table's one `meta.*` row. Those four grammars scope a grouping paren and an array bracket as structure rather than as punctuation, and every other language in the table emits `punctuation.*` for the same characters. Without the row `list.map((n) => n + 1)` would draw its two touching parens in two colours.",
		},
		{
			token: "A capitalised JSX tag: <Badge>",
			house: "type",
			adapter: "type",
			why: "Pinned by `support.class`, which the tsx and jsx grammars put INSIDE `entity.name.tag` for a component. Without that row the walk steps out to the tag row and `<Badge>` reads as a keyword while the `Badge` imported above it stays a type — one name, two colours. A lower-case `<div>` carries no `support.class` and does read as a keyword, which is colour the house never had.",
		},
		{
			token: "id, len — a Python builtin as a name",
			house: "plain",
			adapter: "plain",
			why: "Pinned by carving `support.function.builtin.python` out of the `support.function` row. The shell scope marks the command WORD of a statement; python's marks a builtin NAME in any position, so `[id for id in …]` would paint an ordinary loop variable the same blue as `for`.",
		},
		{
			token: "Everything else no row claims",
			house: "any",
			adapter: "the same",
			why: "Not a promise — a mechanism. A run the tables answer `plain` for is passed to the block's own `tokenizeCodeBlockLine`, so wherever the grammar has nothing to say the house has the last word: `--ring` inside a Tailwind at-rule the css grammar does not model keeps its property ink, and the `-` of `--save-dev` inside a shell argument stays grey. It costs 4-10% of a pass.",
		},
		{
			token: "echo, curl, date — a shell verb",
			house: "plain",
			adapter: "keyword",
			why: "Added, not repainted. The house colours four verbs (`npm`, `cd`, `ssh`, `sudo`); `entity.name.command` and `support.function` extend that to the rest of the line rather than colouring four words and not the fifth.",
		},
		{
			token: "A YAML mapping key",
			house: "plain",
			adapter: "keyword",
			why: "Added. YAML's keyword list is empty by design, and the grammar scopes a key `entity.name.tag` — which is why every editor paints a YAML key in its tag colour.",
		},
		{
			token: "rust, go, html, diff, and 14 more",
			house: "plain",
			adapter: "coloured",
			why: `Added: ${grammarRows.length} languages here against the block's fourteen. A language with no row still renders — it simply keeps the house tokenizer.`,
		},
		{
			token: "Inside a comment, docstring or literal that opened earlier",
			house: "guessed",
			adapter: "comment / string",
			why: "DIVERGENCE, and the reason the adapter exists. On line two of a block comment the house is not plain — it has already read the line as code and coloured its punctuation, its numbers and its keywords. Painting the whole construct one colour necessarily overrules that. It is the largest class by far: 9,348 characters of the 9,511 this page's snippets, the Code block page's and `src/app.css` repaint between them.",
		},
		{
			token: "${…} in a template literal, {…} in an f-string",
			house: "string",
			adapter: "code",
			why: "DIVERGENCE, and the other half of the same idea. The house paints a one-line literal green end to end; the grammar knows the hole is parsed code, so the braces come out punctuation and the expression inside them is coloured as what it is. The literal chunks either side stay green.",
		},
		{
			token: "0.375rem, -100%, #641725",
			house: "split",
			adapter: "one run",
			why: "DIVERGENCE, from the container pass. The house matches a number without its sign or unit and has no rule for a hex colour, so it draws `0.375rem` as a number, a grey dot and plain text. `constant.numeric` and `constant.other.color` claim the whole token, which is one colour instead of three.",
		},
		{
			token: "True / False / None in Python",
			house: "keyword",
			adapter: "literal",
			why: "DIVERGENCE, written down rather than argued away. The house lists them among python's keywords because a keyword list is all it has; the grammar knows they are constants, and putting them in the bucket the house already uses for the same three words in JSON is the smaller inconsistency.",
		},
		{
			token: "type: — a house keyword used as a key",
			house: "keyword",
			adapter: "property",
			why: "DIVERGENCE. `type` is on the house's tsx keyword list, which colours it wherever it appears, including as the name of a field. The grammar scopes it `meta.object-literal.key`, so it lands in the same purple as every other key beside it. The keyword table's own documented limit, corrected by a parser.",
		},
		{
			token: "The ! of !important",
			house: "punctuation",
			adapter: "keyword",
			why: "DIVERGENCE, one character wide. The css grammar hands `!important` over as a single token and it has a letter in it, so the no-letter downgrade does not fire and the whole run takes keyword ink; the house splits the `!` off as punctuation. Splitting it back would be worse for the sake of a rule.",
		},
	];

	const rootProps: PropRow[] = [
		{
			prop: "languages",
			type: "readonly CodeBlockLanguageId[]",
			default: "—",
			description:
				"Grammars to start loading up front, in any spelling `resolveCodeBlockLanguage` accepts. REACTIVE: adding an id later starts that grammar too, and removing one loads nothing back out — a grammar is held for the life of the instance. The grammar is COMPILED inside that request too, not just fetched, so the first block to show the language reads an answer rather than paying about 100ms for one mid-render. Left unset, nothing is fetched until a block asks; an id with no row in the table is silently ignored.",
		},
		{
			prop: "grammars",
			type: "Readonly<Record<string, CodeHighlighterGrammar>>",
			default: "—",
			description:
				"Extra or replacement loaders, merged over `CODE_HIGHLIGHTER_GRAMMARS`: a new key adds a language, an existing key replaces that row's loader. KEYS ARE CANONICALISED as they are merged, so `typescript`, `TypeScript` and `ts` all name the built-in `ts` row and any of the three replaces it. Read ONCE, at initialisation, because it is constructor input to the state — a later change does nothing. Ignored entirely when `highlighter` is set, since that instance was built with its own table. Every loader must carry a string-literal `import()` specifier, or the registry's import graph and Vite's chunking both lose sight of it.",
		},
		{
			prop: "highlighter",
			type: "CodeHighlighterState",
			default: "—",
			description:
				"A state to publish instead of creating one. Read ONCE. Use it to share a single engine across providers, or to keep one alive across a route change: an instance passed in here is NOT disposed when this component unmounts — only one it created itself is.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The subtree the highlighter is published to. It is rendered bare: this component draws no element, so there is no wrapper, no `class` and no `data-slot`.",
		},
	];

	const stateMembers: PropRow[] = [
		{
			prop: "new CodeHighlighterState(props?)",
			type: "(props?: CodeHighlighterStateProps) => CodeHighlighterState",
			default: "{}",
			description:
				"Builds the grammar table — `CODE_HIGHLIGHTER_GRAMMARS`, with `props.grammars` merged over it under canonical keys — and nothing else. The Shiki engine is created on first use, and only where `window` exists.",
		},
		{
			prop: "languages",
			type: "readonly CodeBlockLanguageId[]",
			default: "—",
			description:
				"Every id this instance has a row for, canonical. Not reactive: the table is fixed at construction.",
		},
		{
			prop: "loaded",
			type: "ReadonlySet<CodeBlockLanguageId>",
			default: "—",
			description:
				"The ids whose grammar is loaded AND warm. Reactive — a `SvelteSet`, which is how a block that declined a language repaints itself the moment that language lands. Emptied by `dispose()`.",
		},
		{
			prop: "isSupported(language)",
			type: "(language: CodeBlockLanguageId) => boolean",
			default: "—",
			description:
				"Whether this instance has a row for the language and has not already failed on it. A load that threw is permanent, so a supported id can become unsupported once.",
		},
		{
			prop: "isReady(language)",
			type: "(language: CodeBlockLanguageId) => boolean",
			default: "—",
			description:
				"Whether `highlight` will answer for the language. Reactive, and false on the server for every id.",
		},
		{
			prop: "prepare(language)",
			type: "(language: CodeBlockLanguageId) => void",
			default: "—",
			description:
				"Start the load and return. What `<CodeBlock.Root>` calls once per language it shows, and what the provider calls for each entry of `languages`. It returns void deliberately: readiness is reported by `highlight` answering differently, not by a promise the seam has no way to await.",
		},
		{
			prop: "load(language)",
			type: "(language: CodeBlockLanguageId) => Promise<void>",
			default: "—",
			description:
				"Fetch the grammar module, register it, tokenise the last code that asked for this language, and only then publish the id. That order is the point — the first tokenisation against a grammar compiles its regexes (about 80ms for TypeScript), so doing it inside the promise means the repaint it schedules reads an answer already computed. On the preload path there is no such code yet, so it tokenises one character instead, which still compiles every top-level pattern and halves what the first block pays. Concurrent calls share one promise; a failure is recorded, never retried, warned about once in development, and leaves the block on the house tokenizer.",
		},
		{
			prop: "highlight(code, language)",
			type: "(code: string, language: CodeBlockLanguageId) => CodeBlockToken[][] | undefined",
			default: "—",
			description:
				"The seam. Declines with `undefined` for a language with no row, one whose load failed, and one still loading — the third after starting that load, so the block paints house colours now and this answer later. It folds CRLF and splits on newlines itself, and deliberately does NOT strip a trailing one: the block hands over its rendered lines rejoined, so re-splitting them is the identity and the row count equals the line count by construction. Stripping again would answer one row short for every snippet whose last line is blank, and rule 7 would throw the whole block back to the house tokenizer. Every row is checked against its line and ONE mismatch discards the whole answer.",
		},
		{
			prop: "dispose()",
			type: "() => void",
			default: "—",
			description:
				"Release the engine and every memo, and empty `loaded`. The provider calls it on unmount only for an instance it created; one passed in through `highlighter` is the caller's to release.",
		},
	];

	const contextAccessors: PropRow[] = [
		{
			prop: "setCodeHighlighterContext",
			type: "(state: CodeHighlighterState) => CodeHighlighterState",
			default: "—",
			description:
				"Publish a state on this folder's own key. It does NOT install the block's seam — the provider calls `setCodeBlockHighlighterContext` beside it, and a caller wiring the two by hand must too.",
		},
		{
			prop: "hasCodeHighlighterContext",
			type: "() => boolean",
			default: "—",
			description: "Whether a provider is above. Initialisation only, like every `getContext`.",
		},
		{
			prop: "getCodeHighlighterContext",
			type: "(consumer?: string) => CodeHighlighterState",
			default: "—",
			description:
				"The published state, or a thrown error naming the consumer. For a descendant that cannot work without one.",
		},
		{
			prop: "useCodeHighlighter",
			type: "() => CodeHighlighterState | undefined",
			default: "—",
			description:
				"The nearest state, or `undefined`. Never throws — the accessor for the ordinary case, where having no provider above is not an error.",
		},
	];

	const typesAndTables: PropRow[] = [
		{
			prop: "CodeHighlighterRootProps",
			type: "{ languages?; grammars?; highlighter?; children? }",
			default: "—",
			description:
				"The provider's props, as the table above documents them. `CodeHighlighterProps` is an alias of it, present for parity with the other parts in this kit.",
		},
		{
			prop: "CodeHighlighterGrammar",
			type: "{ name: string; load: () => Promise<{ default: LanguageRegistration[] }> }",
			default: "—",
			description:
				"One row of the table: the name Shiki registers the grammar under, and the loader that fetches it. `load` resolves to the WHOLE registration array — `@shikijs/langs/html` exports `[javascript, css, html]`, and handing over only the last element throws.",
		},
		{
			prop: "CodeHighlighterScopeRule",
			type: "{ scope: string; kind: CodeBlockTokenKind }",
			default: "—",
			description:
				"One row of the scope pass. `scope` is matched segment-aware, so `string` matches `string.quoted.double.ts` and never `stringify.ts`.",
		},
		{
			prop: "CodeHighlighterContainerRule",
			type: "{ scope: string; kind?: CodeBlockTokenKind }",
			default: "—",
			description: "One row of the container pass. A missing `kind` declares it transparent.",
		},
		{
			prop: "CodeHighlighterStateProps",
			type: "{ grammars?: Readonly<Record<string, CodeHighlighterGrammar>> }",
			default: "—",
			description: "Construction input for the state — the same merge the provider's prop does.",
		},
		{
			prop: "codeHighlighterKindOf",
			type: "(scopes: readonly string[], text: string, language: CodeBlockLanguageId) => CodeBlockTokenKind",
			default: "—",
			description:
				"What one Shiki token is, in the block's nine-kind vocabulary. Pure, because it runs once per token inside a `$derived`. `text` carries the no-letter downgrade and `language` the capitalised-identifier fallback; a stack nothing claims is `plain` — and inside the state, a `plain` run is then handed to the block's own `tokenizeCodeBlockLine`, which is what keeps the house's answer wherever the grammar had none.",
		},
		{
			prop: "CODE_HIGHLIGHTER_GRAMMARS",
			type: "Readonly<Record<string, CodeHighlighterGrammar>>",
			default: "—",
			description: `The ${grammarRows.length} languages, keyed by the canonical code-block id. \`text\` and \`csv\` are absent on purpose.`,
		},
		{
			prop: "CODE_HIGHLIGHTER_CONTAINER_SCOPES",
			type: "readonly CodeHighlighterContainerRule[]",
			default: "—",
			description: `The ${containerRows.length} container rows, scanned outermost first. Order matters: the two transparent rows sit above the general \`string\` row they would otherwise be swallowed by.`,
		},
		{
			prop: "CODE_HIGHLIGHTER_SCOPES",
			type: "readonly CodeHighlighterScopeRule[]",
			default: "—",
			description: `The ${CODE_HIGHLIGHTER_SCOPES.length} scope rows, tested innermost first, first match wins. Reordering them changes the output — \`support.function.builtin.python\` must stay above \`support.function\`, and \`support.type.property-name\` above \`support.type\`.`,
		},
		{
			prop: "CODE_HIGHLIGHTER_TYPE_CASED_LANGUAGES",
			type: "readonly CodeBlockLanguageId[]",
			default: `[${CODE_HIGHLIGHTER_TYPE_CASED_LANGUAGES.map((id) => `'${id}'`).join(", ")}]`,
			description:
				"Which languages paint a capitalised identifier no scope claimed as a type — the house tokenizer's own rule, over the same four ids.",
		},
		{
			prop: "CODE_HIGHLIGHTER_MAX_LINE_LENGTH",
			type: "number",
			default: String(CODE_HIGHLIGHTER_MAX_LINE_LENGTH),
			description:
				"A longer line is emitted as one `plain` run instead of being tokenised — a minified bundle pasted into a chat is the one input that could freeze a tab. It is also the one `plain` run NOT passed to the house tokenizer, since the cap exists to spend nothing on that line rather than to spend it twice. The line still renders with its own text, so the block accepts the row; the rule stack is carried across it unchanged.",
		},
		{
			prop: "CODE_HIGHLIGHTER_LINE_TIME_LIMIT_MS",
			type: "number",
			default: String(CODE_HIGHLIGHTER_LINE_TIME_LIMIT_MS),
			description:
				"The per-line budget handed to the grammar, half of Shiki's own default: a code block is not an editor, and a line that needs longer is one the reader would rather see plain. When it runs out the last token stops short and the remainder is appended as one `plain` run.",
		},
	];
</script>

<DocPage title="Code highlighter">
	{#snippet subtitle()}
		A Shiki adapter for the highlighter seam on
		<a class="text-primary underline underline-offset-3" href={href("/components/code-block")}
			>Code block</a
		>: real TextMate grammars for {grammarRows.length} languages, mapped onto the nine token kinds the
		block already paints. It renders no element — mount it once above the blocks that need it, and every
		one of them upgrades as each grammar arrives.
	{/snippet}

	<DocSection title="The provider">
		{#snippet blurb()}
			Wrap the part of the tree that shows code and set nothing else. This snippet opens with a
			five-line block comment and returns a five-line template literal — the two constructs the
			house tokenizer ends at the first line break, because its rules run one line at a time. Here
			the comment stays grey to its last line, the literal stays green through all of it, and the
			<code>{"${…}"}</code> holes inside it are live code rather than string ink.
			<code>languages</code> is what starts a grammar before a block asks for it; leave it out and nothing
			is fetched until one does. An application mounts ONE provider, at the root — this page mounts one
			per section only because each example is extracted and copied on its own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CodeHighlighter.Root languages={["ts"]}>
					<CodeBlock.Root label="report.ts" language="ts" code={ADAPTER_REPORT_TS} />
				</CodeHighlighter.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With and without">
		{#snippet blurb()}
			The same characters, the same provider, one screen. The block on the right sets
			<code>highlighter={"{null}"}</code>, which is the seam's first rule: an explicit
			<code>null</code>
			opts a block out and keeps the house tokenizer whatever is installed above it. Read the two down
			the left edge and the parting is in exactly two places: the five-line block comment and the five-line
			template literal, where the house can only see one line at a time. Everywhere else they agree —
			every keyword, string, number, capitalised identifier, bracket and operator outside those two constructs
			is the same colour in both, which is a decision rather than a coincidence: 519 of this snippet's
			889 characters are ones the house had an opinion about and the adapter left alone, 349 more are
			ones it had none for, and the 21 that differ are all inside the comment or the literal.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CodeHighlighter.Root languages={["ts"]}>
					<div class="grid gap-4 lg:grid-cols-2">
						<CodeBlock.Root
							label="Shiki grammar"
							language="ts"
							code={ADAPTER_REPORT_TS}
							showLineNumbers={false}
						/>
						<CodeBlock.Root
							label="House tokenizer"
							language="ts"
							code={ADAPTER_REPORT_TS}
							showLineNumbers={false}
							highlighter={null}
						/>
					</div>
				</CodeHighlighter.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Languages the house never had">
		{#snippet blurb()}
			Four ids the block accepts and its own tokenizer has no grammar for, so before this adapter
			every one of them rendered plain. Nothing is preloaded here: the grammar is fetched when you
			pick the language, which is the whole cost model — one dynamic import per language, arriving
			when a block asks. The labels are the ids themselves, because none of the four is one of the
			fourteen the block names; the download follows the selector for the same reason, so
			<code>rust</code> saves as <code>snippet.rs</code> and <code>dockerfile</code> as
			<code>snippet.dockerfile</code>. <code>html</code> is the row worth watching: its grammar carries
			the CSS and JavaScript grammars with it, and the style and script blocks inside the document are
			painted by those guests through the same table.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CodeHighlighter.Root>
					<CodeBlock.Root
						label="Four grammars"
						snippets={GRAMMAR_TOUR}
						filename="snippet"
						class="h-[420px]"
					/>
				</CodeHighlighter.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="First paint and streaming">
		{#snippet blurb()}
			Press the button and the answer arrives three lines at a time, as a chat answer does. Three
			things are on show. FIRST PAINT is whatever the adapter returns synchronously, and until a
			grammar is loaded that is nothing — so the block paints house colours immediately rather than
			rendering a skeleton or awaiting anything, and swaps when the grammar lands. This section
			preloads nothing, so that swap happens a frame or two after the section itself mounts.
			SPANNING CONSTRUCTS are why the docstring below is worth watching: it is one string over five
			lines, and the house paints almost none of it. And ONLY CHANGED LINES ARE RE-TOKENISED — the
			adapter keeps the previous answer per language and reuses the longest common line prefix, so a
			chunk that appends three lines costs three lines of work and the rows above it are the same
			arrays as before.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div class="flex flex-wrap items-center gap-4">
						<Button variant="outline" onclick={() => (streaming ? stopStream() : startStream())}>
							{streaming ? "Stop" : "Stream the report"}
						</Button>
						<span class="text-sm text-muted-foreground" aria-live="polite">
							{streamedLines} of {STREAM_TOTAL_LINES} lines written{streaming ? "…" : "."}
						</span>
					</div>
					<CodeHighlighter.Root>
						<CodeBlock.Root
							label="grammar_report.py"
							language="python"
							code={streamed}
							class="h-[420px]"
						/>
					</CodeHighlighter.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Scopes and kinds">
		{#snippet blurb()}
			A grammar hands back a scope STACK per token — <code>source.ts</code> down to whatever claimed
			the characters — and the block paints nine kinds. These three tables are the whole
			translation, and they are rendered from the adapter's own exports, so a row added there
			appears here. The container pass runs first, outermost scope first, because a grammar keeps
			describing structure INSIDE a construct the reader sees as one thing: without it a JSDoc tag
			would be a keyword in the middle of grey prose, a regular expression would be four colours,
			and the
			<code>.</code> of <code>1.5</code> would split one number in two.
		{/snippet}
		<div class="flex flex-col gap-8">
			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">Container scopes, outermost first</h3>
				<p class="text-sm text-muted-foreground">
					A match here decides every token beneath it. Two rows are TRANSPARENT and decide nothing:
					a template literal's holes are real parsed code, and the shell grammar scopes every bare
					argument as an unquoted string — left opaque, <code>npm install --save-dev</code> would be
					three quarters green. Transparency has a second half, in the scope walk below: a
					transparent container reached from further in stops the walk and yields
					<code>plain</code>, while the same scope still answers for itself when it is the innermost
					one. That is what keeps a template's text green and its interpolation live.
				</p>
				<Card.Root>
					<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Scope</Table.Head>
									<Table.Head>Kind</Table.Head>
									<Table.Head>What it does</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each containerRows as row (row.scope)}
									<Table.Row>
										<Table.Cell class="font-medium">{row.scope}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{row.kind}</Table.Cell>
										<Table.Cell>{row.note}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">Scopes, innermost first</h3>
				<p class="text-sm text-muted-foreground">
					Tried top to bottom within one scope, first match wins; a scope that matches nothing moves
					the scan one step outward. Order is the grammar here too — <code
						>punctuation.definition.string</code
					>
					sits above <code>punctuation</code> so a quote is a string, and
					<code>support.type.property-name</code>
					above <code>support.type</code> so a CSS declaration name is not a type. Every row whose
					kind is <code>keyword</code> is subject to one further line: a keyword-kind token
					containing no letter is punctuation instead, which is what keeps
					<code>=&gt;</code>, <code>!==</code>, <code>&amp;&amp;</code> and <code>::</code> out of
					the keyword ink while leaving <code>typeof</code>, <code>in</code> and
					<code>!important</code> in it. What is deliberately ABSENT keeps the table small:
					<code>entity.name.function</code> and <code>variable.other</code> have no row, so an
					identifier the author named stays plain. <code>meta.*</code> is absent for the same reason
					with the three exceptions listed —
					<code>meta.definition.property</code> and <code>meta.object-literal.key</code>, which name
					a field rather than describe one, and <code>meta.brace</code>, which IS the bracket rather
					than structure around it.
				</p>
				<Card.Root>
					<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Scope</Table.Head>
									<Table.Head>Kind</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each CODE_HIGHLIGHTER_SCOPES as row (row.scope)}
									<Table.Row>
										<Table.Cell class="font-medium">{row.scope}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{row.kind}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">Agreements, and where they part</h3>
				<p class="text-sm text-muted-foreground">
					The rule the table above is written to: this adapter may ADD colour where the house
					tokenizer had none, and must not repaint what it had an opinion about. The reason is
					streaming — during a chat answer both paint the same line seconds apart, so a disagreement
					is a flicker the reader sees. THE RULE IS ENFORCED RATHER THAN AUDITED: a run the scope
					tables answer <code>plain</code> for is handed to the block's own tokenizer, so wherever
					the grammar has nothing to say the house's answer stands unchanged. What is left is the
					six places the grammar DOES have something to say and disagrees, and every one of them is
					a row below marked DIVERGENCE. They are counted rather than sampled — a per-character diff
					of both tokenizers over every snippet this page and the Code block page render, plus
					<code>src/app.css</code>, is 9,511 characters, and 9,348 of them are the first divergence
					alone.
				</p>
				<Card.Root>
					<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Token</Table.Head>
									<Table.Head>House</Table.Head>
									<Table.Head>Adapter</Table.Head>
									<Table.Head>Why</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each houseComparison as row (row.token)}
									<Table.Row>
										<Table.Cell class="font-medium">{row.token}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{row.house}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{row.adapter}</Table.Cell>
										<Table.Cell>{row.why}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</DocSection>

	<DocSection title="Grammars">
		{#snippet blurb()}
			{grammarRows.length} rows, keyed by the canonical id the code block resolves a fence to — so
			<code>typescript</code>, <code>TypeScript</code> and <code>ts</code> all arrive as
			<code>ts</code>. The key is the house id and the name is Shiki's, and the two differ more
			often than not. Two ids are missing on purpose: <code>text</code> is what a blank fence
			resolves to and there is no grammar for "no language", and <code>csv</code> has one whose
			scopes are a rainbow — probed against <code>id,name,weight</code> it emits
			<code>rainbow1</code>, <code>keyword.rainbow2</code> and
			<code>entity.name.function.rainbow3</code>, one per column position, so the second column of
			every CSV file would paint as a keyword. Both keep the house tokenizer, which is the right
			answer for a table of values. Note also that <code>bash</code> and <code>curl</code> name the same
			module: the second import is a cache hit, so the pair costs one download.
		{/snippet}
		<div class="flex flex-col gap-8">
			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">The table</h3>
				<Card.Root>
					<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Language</Table.Head>
									<Table.Head>Shiki grammar</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each grammarRows as row (row.language)}
									<Table.Row>
										<Table.Cell class="font-medium">{row.language}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{row.name}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">The rows that drag other grammars in</h3>
				<p class="text-sm text-muted-foreground">
					Eight of them, because a language that can HOST another language has to carry the guest's
					rules. Every other row is a single module, and none of any of it is in the initial bundle
					— each row is behind its own dynamic import and arrives only when a block asks for that
					language. The weights are what makes the difference worth knowing before adding one of
					these to a <code>languages</code> preload: <code>ruby</code> is nearly two megabytes,
					<code>json</code> is three kilobytes. Those are source bytes; what a reader downloads is
					smaller and is the figure to hold against this table — measured over this site's own
					production build, gzipped, the adapter and Shiki's core are one 54&nbsp;kB chunk paid
					once, and a grammar runs from 1&nbsp;kB (<code>json</code>, <code>diff</code>,
					<code>dockerfile</code>) through 16&nbsp;kB for each of the JavaScript family to
					45&nbsp;kB for <code>cpp</code>. All thirty-two would come to 320&nbsp;kB, which is the
					number nobody pays.
				</p>
				<Card.Root>
					<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Language</Table.Head>
									<Table.Head>Also loads</Table.Head>
									<Table.Head>Transitively</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each embeddedGrammars as row (row.language)}
									<Table.Row>
										<Table.Cell class="font-medium">{row.language}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{row.guests}</Table.Cell>
										<Table.Cell>{row.weight}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CodeHighlighter.Root</h3>
			<p class="text-sm text-muted-foreground">
				The whole component, and the only part. It renders no element — just its children — so it
				carries no <code>class</code>, no rest props and no <code>data-slot</code>: there is nothing
				for one to name. What it does is publish a <code>CodeHighlighterState</code> twice, on two
				keys, because they answer different questions: the code block's seam, which is what makes
				every block below it upgrade, and its own, so a descendant can reach the instance and ask
				what is loaded. An instance it created is disposed when it unmounts; one handed to it
				through <code>highlighter</code> is not.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each rootProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CodeHighlighterState</h3>
			<p class="text-sm text-muted-foreground">
				The engine behind the provider, and a plain class a caller may construct directly — to share
				one across providers, to preload from outside a component, or to implement the block's seam
				without this provider at all. It IS a <code>CodeBlockHighlighter</code>, so
				<code>highlighter={"{engine}"}</code> on a single block works with nothing else installed. It
				holds one Shiki engine for every grammar, so the regex cache is shared between them, loads no
				theme at all — the colours are the block's nine kinds over the theme's tokens — and is client-only
				by construction: on the server it creates nothing and declines every call, which is exactly what
				it does in the browser while a grammar loads.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Member</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each stateMembers as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Context accessors</h3>
			<p class="text-sm text-muted-foreground">
				This folder's own key, alongside the code block's. Reaching the instance is what lets a
				descendant explain a block that is still plain — <code>isReady</code> and
				<code>loaded</code> are reactive, so a status line built on them updates itself.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Accessor</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each contextAccessors as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Types, tables and helpers</h3>
			<p class="text-sm text-muted-foreground">
				Everything else the barrel exports. The tables are exported so a consumer can read them, add
				a row through <code>grammars</code>, or render them — this page's own scope tables are the
				exports, which is why they cannot drift from the component.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Export</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Value</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each typesAndTables as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
