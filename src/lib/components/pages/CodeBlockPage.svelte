<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as CodeBlock from "$lib/components/ui/code-block/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import { href } from "$lib/hooks/route.svelte.js";
	import {
		CODE_BLOCK_EXTENSIONS,
		CODE_BLOCK_LANGUAGES,
		CODE_BLOCK_MEDIA_TYPES,
		CODE_BLOCK_TOKEN_KINDS,
		codeBlockLanguageLabels,
		resolveCodeBlockLanguage,
		type CodeBlockLanguage,
	} from "$lib/components/ui/code-block/index.js";
	import {
		CUSTOMER_EXPORT_CSV,
		LANGUAGE_TOUR,
		REGISTRY_REQUEST_CURL,
		REGISTRY_REQUEST_SNIPPETS,
		REGISTRY_REQUEST_TSX,
	} from "./code-block-sample-snippets.js";

	/**
	 * The Code block page — the component's three demos, plus two sections this kit
	 * needs that upstream's page has no reason to carry.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. Its own documentation sets its samples in a `<pre>` styled by the
	 * docs stylesheet — a surface, not a component. What there is to theme is the token ramp, and
	 * this is the densest place in the kit where four semantic families are asked to work as TYPE
	 * rather than as fills: a keyword, a string, a number and a literal sit on adjacent characters
	 * of one line. `ui/json-viewer` answers the same question for a data tree, from the same five
	 * families and under the same rule — the walked `--{state}-subtle-foreground`, never the raw
	 * status token. The two do NOT paint a JSON payload identically, and cannot: json-viewer parses
	 * it, so it knows a `true` is a boolean and a quoted name is a key, where a line-at-a-time
	 * regular expression sees a literal and a string. Strings and numbers agree; keys, booleans and
	 * null do not.
	 *
	 * WHERE IT SITS NEXT TO JSON VIEWER. Both render a monospace, gutter-numbered, copyable payload
	 * on a muted ground, and the boundary between them is whether the payload has structure the
	 * component understands. JSON viewer PARSES: it walks a live value, colours by runtime type,
	 * and collapses, expands and truncates the branches it found. Code block does not parse
	 * anything — it takes an opaque string, splits it on newlines and colours what a regular
	 * expression can recognise. Reach for JSON viewer when the reader needs to navigate a payload;
	 * for Code block when they need to read and copy a sample exactly as it was written.
	 *
	 * The section to look at across the twelve palettes is "Every language": fourteen snippets picked
	 * so that every rule in the highlighter fires at least once, on one screen.
	 */

	/** The "Every language" tour opens on TSX rather than on nothing in particular. */
	let tourLanguage = $state<CodeBlockLanguage>("tsx");

	/** The controlled demo's language, owned by the page rather than by the block. */
	let boundLanguage = $state<CodeBlockLanguage>("python");

	/**
	 * The "Download" demo's receipt: the name the last click saved under. The button shows none of
	 * its own — the browser's save UI is the receipt — so this is what `onDownload` is for.
	 */
	let lastDownload = $state<string | undefined>();

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "code",
			type: "string",
			default: "undefined",
			description: "A single snippet's code. Ignored once `snippets` is non-empty.",
		},
		{
			prop: "language",
			type: CODE_BLOCK_LANGUAGES.map((language) => `'${language}'`).join(" | "),
			default: "'tsx'",
			description: "The grammar `code` is highlighted against.",
		},
		{
			prop: "snippets",
			type: "CodeBlockSnippet[]",
			default: "undefined",
			description:
				"Several snippets of the same thing. The language is a snippet's identity, so two entries may not share one.",
		},
		{
			prop: "defaultLanguage",
			type: "CodeBlockLanguage",
			default: "the first snippet's language",
			description:
				"Seed for `activeLanguage`, read once — changing it later leaves the reader's own choice alone.",
		},
		{
			prop: "activeLanguage",
			type: "CodeBlockLanguage",
			default: "—",
			description:
				"Bindable. The snippet on screen: a language the current list does not carry falls back to the first, and the selector follows the fallback rather than the request.",
		},
		{
			prop: "onActiveLanguageChange",
			type: "(language: CodeBlockLanguage) => void",
			default: "undefined",
			description: "Fired when the selector picks another language, never for a parent write.",
		},
		{
			prop: "label",
			type: "string",
			default: "'Code'",
			description: "The caption in the header — a filename, a request name, whatever names it.",
		},
		{
			prop: "showLineNumbers",
			type: "boolean",
			default: "true",
			description:
				"The gutter. Hidden from assistive technology and from the clipboard either way.",
		},
		{
			prop: "allowLanguageSelection",
			type: "boolean",
			default: "true",
			description:
				"With this off, or with a single snippet, the header shows the language as a static tag instead of a selector.",
		},
		{
			prop: "filename",
			type: "string",
			default: "undefined",
			description:
				"The download name; setting it is what makes the header show a download button. A name with an extension is kept as it is; one without is replaced by `snippet.<ext>` for the active language, so it follows the selector. The result is sanitised: path separators become dashes, reserved punctuation is stripped, and an empty result falls back to `snippet.<ext>`.",
		},
		{
			prop: "mediaType",
			type: "string",
			default: "CODE_BLOCK_MEDIA_TYPES[activeLanguage]",
			description:
				"The MIME type the download is stamped with. Left unset, it follows the active language, so a multi-language block saves each snippet under its own type. Ignored unless `filename` is set — without a name there is no download button to stamp.",
		},
		{
			prop: "onDownload",
			type: "(filename: string) => void",
			default: "undefined",
			description:
				"Fired after the download button has handed the file to the browser, with the sanitised name it was saved under. The root renders its own header, so this is where a caller hears about it.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, so it overrides the built-in classes. The height lives on the root: `max-h-112` by default, and this is what changes it.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute is forwarded to the root element.",
		},
	];

	const headerProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the built-in classes.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute is forwarded to the header element.",
		},
	];

	const languageSelectProps = [
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered trigger.",
		},
		{
			prop: "align",
			type: 'ComponentProps<typeof Select.Content>["align"]',
			default: "'end'",
			description:
				"Which edge of the trigger the list aligns to. `end` keeps the list inside the block when the trigger sits at its right edge, which in the header it always does.",
		},
		{
			prop: "...restProps",
			type: "WithoutChildren<ComponentProps<typeof Select.Trigger>>",
			default: "—",
			description:
				"Forwarded to the Select trigger after `size` and the `aria-label`, so each can be overridden. `children` is blocked: the trigger's text is the active label, which carries the control's value into its accessible name.",
		},
	];

	const copyButtonProps = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{
			prop: "...restProps",
			type: "WithoutChildren<ComponentProps<typeof Button>>",
			default: "—",
			description:
				"Forwarded to the Button after `variant`, `size` and the `aria-label`, so each can be overridden. `children` is blocked: the part draws its own icon, and swaps it for the receipt.",
		},
	];

	const downloadButtonProps = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{
			prop: "onDownload",
			type: "(filename: string) => void",
			default: "undefined",
			description:
				"The button's own hook, fired after the root's `onDownload` with the same sanitised name. Reachable only when the button is rendered by hand, since the root's header takes none.",
		},
		{
			prop: "...restProps",
			type: "WithoutChildren<ComponentProps<typeof Button>>",
			default: "—",
			description:
				"Forwarded to the Button after `variant`, `size` and the `aria-label`, so each can be overridden. `children` is blocked: the part draws its own icon.",
		},
	];

	const contentProps = [
		{
			prop: "ref",
			type: "HTMLPreElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<pre>`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, so it overrides the built-in classes. The height is not here — it lives on the root, and the content fills what the header leaves.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLPreElement>",
			default: "—",
			description:
				"Every other attribute is forwarded to the `<pre>`, after `tabindex={0}`, so a caller can remove the tab stop — and with it keyboard access to anything below the fold.",
		},
	];

	const lineProps = [
		{
			prop: "ref",
			type: "HTMLSpanElement | null",
			default: "null",
			description: "Bindable reference to the rendered row.",
		},
		{
			prop: "line",
			type: "string",
			default: "—",
			description:
				"Required. The raw line, tokenised against the block's active language. An empty string renders a single space so the row keeps its height.",
		},
		{
			prop: "lineNumber",
			type: "number",
			default: "—",
			description:
				"Required. What the gutter shows — one-based, as a reader counts. Rendered only while the root's `showLineNumbers` is on, and hidden from assistive technology and the clipboard either way.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the built-in `table-row`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLSpanElement>",
			default: "—",
			description: "Every other attribute is forwarded to the row.",
		},
	];

	/**
	 * The header's tab order is what the download button changes: it inserts a stop between the
	 * language affordance and the copy button, so the copy button is no longer always second.
	 */
	const keyboard = [
		{
			keys: "Tab",
			description:
				"Moves through the header's stops in reading order — the language selector when there is one, the download button when the root has a `filename`, then the copy button — and on into the content, which is a stop of its own because it scrolls (WCAG 2.1.1).",
		},
		{
			keys: "Shift + Tab",
			description: "Moves back through the same stops.",
		},
		{
			keys: "Enter, Space",
			description:
				"On the copy or download button, activates it. On the language selector, opens the list.",
		},
		{
			keys: "Arrow Up, Arrow Down",
			description:
				"On the language selector, open the list and move through the languages. In the content, scroll the code once it has focus.",
		},
		{
			keys: "Escape",
			description: "Closes the language list.",
		},
		{
			keys: "A character",
			description:
				"With the language list open, jumps to the entry whose label starts with it — the label on screen, not the raw language name.",
		},
	];

	/** One row per language: what a name without an extension downloads as, and what the file is stamped with. */
	const downloadNames = CODE_BLOCK_LANGUAGES.map((language) => ({
		language,
		label: codeBlockLanguageLabels[language],
		extension: CODE_BLOCK_EXTENSIONS[language],
		mediaType: CODE_BLOCK_MEDIA_TYPES[language],
	}));

	const parts = [
		{
			part: "CodeBlock.Root",
			description:
				"Resolves the snippet list and the active snippet, owns the seed, and publishes both on context. Renders the header and the content itself.",
		},
		{
			part: "CodeBlock.Header",
			description:
				"The caption, the language affordance — selector or static tag — the download button when the root has a `filename`, and the copy button. The `{#if}` for the download button lives here, not in the button.",
		},
		{
			part: "CodeBlock.LanguageSelect",
			description:
				"The picker, on the house `sm` rung. Its value is the language actually on screen.",
		},
		{
			part: "CodeBlock.CopyButton",
			description:
				"Writes the active snippet verbatim. The receipt appears only once `writeText` resolves, and is dropped when the snippet changes.",
		},
		{
			part: "CodeBlock.DownloadButton",
			description:
				"Saves the active snippet verbatim as a file. Rendered by the header only when the root has a `filename`; composed by hand it always renders, and falls back to `snippet.<ext>`.",
		},
		{
			part: "CodeBlock.Content",
			description:
				"The `<pre><code>` scroller, laid out as a table so the gutter needs no measuring.",
		},
		{
			part: "CodeBlock.Line",
			description: "One row: the gutter cell, then the line's classified runs as `<span>`s.",
		},
	];

	const dataAttributes = [
		{
			attribute: "[data-slot]",
			part: "every part it draws itself",
			values:
				"code-block, code-block-header, code-block-copy-button, code-block-download-button, code-block-content, code-block-line, code-block-line-number, code-block-line-code",
		},
		{
			attribute: "[data-downloadable]",
			part: "CodeBlock.Root",
			values: "present when `filename` is set, absent otherwise",
		},
		{
			attribute: "[data-kind]",
			part: "the token spans",
			values: CODE_BLOCK_TOKEN_KINDS.join(" | "),
		},
		{
			attribute: "[data-language]",
			part: "CodeBlock.Root",
			values: CODE_BLOCK_LANGUAGES.join(" | "),
		},
	];

	const tokenColours = [
		{ token: "comment", upstream: "muted-foreground", mapped: "muted-foreground" },
		{
			token: "string",
			upstream: "green-700 / green-300, emerald in JSON",
			mapped: "success-subtle-foreground",
		},
		{
			token: "literal",
			upstream: "purple-700 / purple-300",
			mapped: "primary-subtle-foreground",
		},
		{ token: "keyword", upstream: "sky-700 / sky-300", mapped: "info-subtle-foreground" },
		{ token: "number", upstream: "amber-700 / amber-300", mapped: "warning-subtle-foreground" },
		{ token: "type", upstream: "violet-700 / violet-300", mapped: "primary-subtle-foreground" },
		{ token: "punctuation", upstream: "muted-foreground", mapped: "muted-foreground" },
		{
			token: "property",
			upstream: "purple-700 / purple-300",
			mapped: "primary-subtle-foreground",
		},
		{ token: "plain", upstream: "foreground", mapped: "foreground" },
	];

	const corrections = [
		{
			input: "curl -s https://example.test/x",
			upstream: "everything from `//` on is a comment",
			fixed: "`//` is a comment only where the language has one",
		},
		{
			input: "mid = total // 2",
			upstream: "floor division read as a comment",
			fixed: "two punctuation tokens and a number",
		},
		{
			input: "color: #fff; background: red;",
			upstream: "the rest of the declaration swallowed by `#`",
			fixed: "`#` is a comment in shell and Python only",
		},
		{
			input: "/* a CSS comment */",
			upstream: "highlighted as code — CSS has no other comment form",
			fixed: "block comments recognised, to end of line",
		},
		{
			input: "--brand: #fff;",
			upstream: "two dashes and a plain word; the custom-property rule cannot fire",
			fixed: "one `property` token",
		},
		{
			input: '{ "ok": true }',
			upstream: "`true` claimed by the keyword rule; the literal rule is dead",
			fixed: "`literal`, which is what the purple was for",
		},
		{
			input: "Don't stop, can't stop",
			upstream: "`'t stop, can'` rendered as a string",
			fixed: "`text` declares no quotes and no comments, so it stays plain",
		},
		{
			input: "a trailing newline",
			upstream: "a numbered blank row at the end of every block",
			fixed: "one trailing newline is dropped; the clipboard still gets the original",
		},
	];
</script>

<DocPage title="Code block">
	{#snippet subtitle()}
		A copyable code sample with a line-number gutter, a language selector and lightweight
		language-aware highlighting. Unlike
		<a class="text-primary underline underline-offset-3" href={href("/components/json-viewer")}
			>JSON viewer</a
		>, which parses a live value and lets the reader collapse it, this takes an opaque string and
		colours what a regular expression can recognise.
	{/snippet}

	<DocSection title="Syntax highlighted">
		{#snippet blurb()}
			Line-numbered code with language-aware highlighting and a copy button whose check mark is a
			receipt: it appears only once the clipboard has actually taken the text.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CodeBlock.Root label="Component request" language="tsx" code={REGISTRY_REQUEST_TSX} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Language selector">
		{#snippet blurb()}
			Pass <code>snippets</code> to let the reader switch between languages. Each entry may carry
			its own <code>label</code>; the selector falls back to the language's name.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CodeBlock.Root label="Component request" snippets={REGISTRY_REQUEST_SNIPPETS} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="cURL request">
		{#snippet blurb()}
			A short request reads better without a gutter, so <code>showLineNumbers</code> is off. With one
			snippet there is nothing to switch between and the header shows a static tag rather than a selector.
			The URL is the line upstream renders as a comment.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CodeBlock.Root
					label="cURL request"
					language="curl"
					code={REGISTRY_REQUEST_CURL}
					showLineNumbers={false}
				/>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Every language">
		{#snippet blurb()}
			All fourteen languages the highlighter knows — upstream's ten, then the four this theme adds
			for the formats a reader is handed as a file — chosen so that every rule fires at least once:
			comment, string, keyword, JSON literal, number, capitalised type, CSS custom property,
			punctuation, and, in <code>text</code> and <code>md</code>, nothing at all. This is the
			section to walk across the twelve palettes: the four coloured families have to stay
			distinguishable from each other and from the page ink in every one of them. The height is
			fixed rather than fitted, so switching language does not move the rest of the page under the
			reader.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CodeBlock.Root
					label="Language tour"
					snippets={LANGUAGE_TOUR}
					bind:activeLanguage={tourLanguage}
					class="h-[380px]"
				/>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled from outside">
		{#snippet blurb()}
			<code>activeLanguage</code> is bindable, so the page can drive the block and follow it at the
			same time. Here the block's own selector is turned off with
			<code>allowLanguageSelection</code>, which leaves the language showing as a static tag — the
			toggle group is the only way to change it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div class="flex flex-wrap items-center gap-4">
						<ToggleGroup.Root
							type="single"
							variant="outline"
							size="sm"
							spacing={2}
							aria-label="Language"
							value={boundLanguage}
							onValueChange={(value) => value && (boundLanguage = resolveCodeBlockLanguage(value))}
						>
							{#each REGISTRY_REQUEST_SNIPPETS as snippet (snippet.language)}
								<ToggleGroup.Item value={snippet.language}>{snippet.label}</ToggleGroup.Item>
							{/each}
						</ToggleGroup.Root>
						<span class="text-sm text-muted-foreground">
							activeLanguage is <code>{boundLanguage}</code>
						</span>
					</div>
					<CodeBlock.Root
						label="Component request"
						snippets={REGISTRY_REQUEST_SNIPPETS}
						bind:activeLanguage={boundLanguage}
						allowLanguageSelection={false}
					/>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Download">
		{#snippet blurb()}
			Set <code>filename</code> and the header offers to save the snippet as a file — the name is
			the whole switch. This export sets no <code>mediaType</code>: its language is
			<code>csv</code>, so the download is stamped <code>text/csv</code> on its own, and a caller
			only passes a type to override that. A name with an extension is saved as it is; one without
			is replaced by <code>snippet.&lt;ext&gt;</code> for the language on screen, so over a selector
			the extension follows the reader's choice. Path separators in a name are replaced, so
			<code>exports/customers.csv</code>
			would save as <code>exports-customers.csv</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<CodeBlock.Root
						label="Customer export"
						language="csv"
						code={CUSTOMER_EXPORT_CSV}
						filename="customers.csv"
						showLineNumbers={false}
						onDownload={(name) => (lastDownload = name)}
					/>
					<p class="text-sm text-muted-foreground" aria-live="polite">
						{#if lastDownload}
							Last saved as <code>{lastDownload}</code>.
						{:else}
							Nothing saved yet — the block reports through <code>onDownload</code>.
						{/if}
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CodeBlock.Root</h3>
			<p class="text-sm text-muted-foreground">
				The only part a caller normally renders. It publishes the state every other part reads, so
				the parts below are useful for restyling rather than for composing something new.
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
			<h3 class="text-base font-medium">CodeBlock.Header</h3>
			<p class="text-sm text-muted-foreground">
				The caption row: a <code>&lt;div&gt;</code> with the label, the language affordance, the
				download button when the root has a <code>filename</code>, and the copy button. It owns both
				<code>{"{#if}"}</code>s — the one that picks a selector over a static tag, and the one that
				leaves the download button out.
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
							{#each headerProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CodeBlock.LanguageSelect</h3>
			<p class="text-sm text-muted-foreground">
				The language picker: a house <code>Select</code> on the <code>sm</code> rung, rendered by the
				header only when there is more than one snippet and the root allows switching. Its value is the
				language actually on screen, and its accessible name carries that label.
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
							{#each languageSelectProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CodeBlock.CopyButton</h3>
			<p class="text-sm text-muted-foreground">
				The copy button: a ghost <code>icon-sm</code> Button that writes the active snippet verbatim
				to the clipboard and swaps its glyph for a check mark for
				<code>CODE_BLOCK_COPY_RECEIPT_MS</code> (1400ms) once <code>writeText</code> resolves. The receipt
				never appears for a copy the browser refused, and is dropped when the snippet changes.
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
							{#each copyButtonProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CodeBlock.DownloadButton</h3>
			<p class="text-sm text-muted-foreground">
				The download button: a ghost <code>icon-sm</code> Button that saves the active snippet under
				the root's resolved <code>filename</code>, stamped with its <code>mediaType</code>. The
				header renders it only when a filename is set; the part itself never hides.
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
							{#each downloadButtonProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CodeBlock.Content</h3>
			<p class="text-sm text-muted-foreground">
				The scroller: a focusable <code>&lt;pre&gt;&lt;code&gt;</code> laid out as a table, one
				<code>CodeBlock.Line</code> per row of the active snippet. It fills whatever height the root leaves
				after the header, and scrolls in both directions rather than wrapping.
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
							{#each contentProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CodeBlock.Line</h3>
			<p class="text-sm text-muted-foreground">
				One row: a <code>&lt;span&gt;</code> in <code>table-row</code> layout holding the gutter
				cell and the line's classified runs, each a <code>&lt;span&gt;</code> stamped with its
				<code>data-kind</code>. Rendered by the content; composed by hand it still reads the active
				language from context.
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
							{#each lineProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Download names</h3>
			<p class="text-sm text-muted-foreground">
				What a <code>filename</code> without an extension saves as, per language, and the MIME type
				it is stamped with when <code>mediaType</code> is unset — <code>CODE_BLOCK_EXTENSIONS</code>
				and
				<code>CODE_BLOCK_MEDIA_TYPES</code>. TypeScript is <code>text/plain</code> because no
				registered type exists for it and the one servers infer from <code>.ts</code> is an MPEG stream.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Language</Table.Head>
								<Table.Head>Saves as</Table.Head>
								<Table.Head>Media type</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each downloadNames as row (row.language)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.label}</Table.Cell>
									<Table.Cell class="text-muted-foreground">snippet.{row.extension}</Table.Cell>
									<Table.Cell>{row.mediaType}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Parts</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Part</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each parts as row (row.part)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.part}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Colour mapping</h3>
			<p class="text-sm text-muted-foreground">
				Upstream paints the tokens with raw palette colours, which survive exactly one theme. Each
				is mapped to the semantic family whose hue it matches — and to that family's walked
				<code>--{"{state}"}-subtle-foreground</code> rather than the raw status token, which is a fill.
				Two upstream distinctions collapse on purpose: emerald against green marked "a string in JSON"
				against "a string elsewhere", and violet against purple marked a capitalised identifier against
				a JSON literal, which no language reaches both of.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Kind</Table.Head>
								<Table.Head>Upstream</Table.Head>
								<Table.Head>This kit</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each tokenColours as row (row.token)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.token}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.upstream}</Table.Cell>
									<Table.Cell>{row.mapped}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Highlighting corrections</h3>
			<p class="text-sm text-muted-foreground">
				Upstream compiles one token pattern for every language, so a comment marker a language does
				not have still claims the rest of the line, and two of its own rules can never fire. Each
				language now declares the comment and quote forms it actually has. What is left unfixed is
				inherent: highlighting runs one line at a time, so nothing spanning lines is coloured past
				its first, and a keyword list is not a parser.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Input</Table.Head>
								<Table.Head>Upstream</Table.Head>
								<Table.Head>This kit</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each corrections as row (row.input)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.input}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.upstream}</Table.Cell>
									<Table.Cell>{row.fixed}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Data attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>Part</Table.Head>
								<Table.Head>Values</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (`${row.attribute}-${row.part}`)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.attribute}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.part}</Table.Cell>
									<Table.Cell>{row.values}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard interactions</h3>
			<p class="text-sm text-muted-foreground">
				The block has no key handling of its own: the stops are native buttons, a Select, and a
				focusable scroller. The download button, when present, is one more stop between the language
				affordance and the copy button.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Key</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each keyboard as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.keys}</Table.Cell>
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
