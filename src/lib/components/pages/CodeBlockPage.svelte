<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as CodeBlock from "$lib/components/ui/code-block/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import {
		CODE_BLOCK_LANGUAGES,
		CODE_BLOCK_TOKEN_KINDS,
		resolveCodeBlockLanguage,
		type CodeBlockLanguage,
	} from "$lib/components/ui/code-block/index.js";
	import {
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
	 * The section to look at across the twelve palettes is "Every language": ten snippets picked so
	 * that every rule in the highlighter fires at least once, on one screen.
	 */

	/** The "Every language" tour opens on TSX rather than on nothing in particular. */
	let tourLanguage = $state<CodeBlockLanguage>("tsx");

	/** The controlled demo's language, owned by the page rather than by the block. */
	let boundLanguage = $state<CodeBlockLanguage>("python");

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

	const parts = [
		{
			part: "CodeBlock.Root",
			description:
				"Resolves the snippet list and the active snippet, owns the seed, and publishes both on context. Renders the header and the content itself.",
		},
		{
			part: "CodeBlock.Header",
			description:
				"The caption, the language affordance — selector or static tag — and the copy button.",
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
				"code-block, code-block-header, code-block-content, code-block-line, code-block-line-number, code-block-line-code",
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
		<a class="text-primary underline underline-offset-3" href="#/components/json-viewer"
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
			All ten languages the highlighter knows, chosen so that every rule fires at least once —
			comment, string, keyword, JSON literal, number, capitalised type, CSS custom property,
			punctuation, and, in <code>text</code>, nothing at all. This is the section to walk across the
			twelve palettes: the four coloured families have to stay distinguishable from each other and
			from the page ink in every one of them. The height is fixed rather than fitted, so switching
			language does not move the rest of the page under the reader.
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
	</DocSection>
</DocPage>
