/**
 * Cuts every `DocSection` out of a gallery page and rebuilds it as a standalone component.
 *
 * WHAT THIS IS FOR. Each section heading in the gallery carries a control that copies the
 * example beside it. The examples are written INLINE — there is no file per demo — and three
 * quarters of them reach for something the page declared: a class helper (`btn(size.base,
 * white)`), a piece of `$state` a control binds to, a snippet rendered by name. Copying the
 * markup alone would put code on somebody's clipboard that cannot compile, with nothing to say
 * why. So the markup is copied together with the imports and the page declarations it actually
 * uses, and anything left over is NAMED rather than dropped.
 *
 * WHY AN AST AND NOT A REGEX. Two regex extractors were written while this was being measured
 * and both lost track of scope in ways that produced silently broken output: a page constant
 * called `number` was swallowed by a keyword list, a name appearing in a type annotation was
 * mistaken for a binding, the contents of a string literal were read as identifiers. The
 * compiler's own parser has none of those failure modes, and it decodes entities, so a title
 * written `title &amp; description` yields the same key the browser will ask for.
 *
 * THE ONE INVARIANT that keeps this honest: an identifier is only ever RECORDED when it matches
 * a name the page declares. Over-collecting therefore costs a helper nobody needed, while
 * under-collecting costs a broken paste — so every node type this file does not understand is
 * still walked generically. Missing a reference is the failure that matters; carrying a spare
 * declaration is not.
 *
 * @see tools/site/vite-plugin-doc-sections.mjs — serves this per page, at build time
 * @see src/lib/components/layout/section-source.ts — the browser half, which only joins strings
 */

import { parse } from "svelte/compiler";

/**
 * Modules a consumer of the published registry is guaranteed to have, beyond what the registry
 * itself lists.
 *
 * `$lib/utils.js` is shadcn-svelte's own file — the CLI writes it into every project it touches,
 * which is why `registry.json` never mentions it and why `cn` may still be imported freely. A
 * bare specifier is a package the reader installs like any other.
 */
const BASELINE_MODULES = new Set(["$lib/utils.js"]);

/** The prop name whose snippet is the section's prose, not part of the example. */
const BLURB = "blurb";

/**
 * @typedef {object} SectionSource
 * @property {string} title The heading, for the copied header.
 * @property {string[]} imports Import statements, pruned to the specifiers the example uses.
 * @property {string[]} locals Page declarations the example uses, in the order the page wrote them.
 * @property {string[]} snippets Page-level snippets the example renders.
 * @property {string} code The example's markup, frame removed and dedented.
 * @property {string[]} missing Imports the example needs from a module the gallery does not publish.
 *
 * `missing` can only ever name an IMPORT. Nothing outside the page's own bindings is recorded in
 * the first place, so a reference to something the page never declared cannot reach this list —
 * which is why the two gaps that would matter are closed at the source instead: an unnamed
 * top-level statement is carried by what it touches, and a title the build cannot key fails the
 * build rather than shipping a control with no answer.
 */

/* -------------------------------------------------------------------------------------------
 * Patterns and scope
 * ---------------------------------------------------------------------------------------- */

/** Every name a binding pattern introduces — destructuring, defaults and rests included. */
function patternNames(node, into = new Set()) {
	if (!node || typeof node !== "object") return into;
	switch (node.type) {
		case "Identifier":
			into.add(node.name);
			break;
		case "ObjectPattern":
			for (const property of node.properties) {
				patternNames(property.type === "Property" ? property.value : property.argument, into);
			}
			break;
		case "ArrayPattern":
			for (const element of node.elements) patternNames(element, into);
			break;
		case "AssignmentPattern":
			patternNames(node.left, into);
			break;
		case "RestElement":
			patternNames(node.argument, into);
			break;
		default:
			break;
	}
	return into;
}

/** A child scope, so a binding introduced inside a block cannot leak back out of it. */
function extend(scope, names) {
	if (!names || names.size === 0) return scope;
	const next = new Set(scope);
	for (const name of names) next.add(name);
	return next;
}

/* -------------------------------------------------------------------------------------------
 * Reference collection
 * ---------------------------------------------------------------------------------------- */

/**
 * Record every page-declared name the subtree reads.
 *
 * One function for both trees. The compiler hands back Svelte nodes with ESTree expressions
 * embedded in them, and the traversal below does not care which it is looking at: the cases it
 * names are the ones that introduce a binding or that hold an identifier which is NOT a
 * reference, and everything else falls through to a generic walk of the node's own children.
 * That fallthrough is the safety property — a node shape this file has never seen still gets
 * searched.
 *
 * @param {any} node
 * @param {Set<string>} known Names the page declares. Nothing outside this set is recorded.
 * @param {Set<string>} scope Names bound between here and the subtree's root.
 * @param {Set<string>} out
 */
function collect(node, known, scope, out) {
	if (!node || typeof node !== "object") return;

	if (Array.isArray(node)) {
		for (const child of node) collect(child, known, scope, out);
		return;
	}
	if (typeof node.type !== "string") return;

	switch (node.type) {
		case "Identifier": {
			if (!scope.has(node.name) && known.has(node.name)) out.add(node.name);
			// `const rows: PropRow[] = …` needs `PropRow` as much as it needs `rows`. The paste is
			// `<script lang="ts">`, so a type the page declared and this dropped is an error the
			// reader sees the moment they open the file.
			collect(node.typeAnnotation, known, scope, out);
			return;
		}

		// `a.b` reads `a`; `b` is a property name, not a binding. `a[b]` reads both.
		case "MemberExpression": {
			collect(node.object, known, scope, out);
			if (node.computed) collect(node.property, known, scope, out);
			return;
		}
		// `{ key: value }` — same shape, same reasoning.
		case "Property": {
			if (node.computed) collect(node.key, known, scope, out);
			collect(node.value, known, scope, out);
			return;
		}
		// `Foo.Bar` in type position.
		case "TSQualifiedName": {
			collect(node.left, known, scope, out);
			return;
		}
		// Handled wholesale when the page's bindings are gathered; never a reference.
		case "ImportDeclaration":
			return;

		/*
		 * `<BookmarkIcon />` and `<Card.Root>` reference a binding, but the parser stores the tag
		 * as a STRING on `name` rather than as an identifier node — so the generic walk below
		 * cannot see it, and every icon and every component would be dropped from the imports.
		 * A dotted tag names its root: `Card.Root` reads `Card`.
		 */
		case "Component": {
			const root = node.name.split(".")[0];
			if (!scope.has(root) && known.has(root)) out.add(root);
			collect(node.attributes, known, scope, out);
			collect(node.fragment, known, scope, out);
			return;
		}

		/*
		 * `use:registerTreeItem`, `transition:slide`, `animate:flip` — the same trap as a component
		 * tag, and for the same reason: the parser puts the target on `name` as a string, where the
		 * generic walk cannot see it. The expression beside it (`use:x={y}`) is a normal reference
		 * and falls through to the walk below.
		 */
		case "UseDirective":
		case "TransitionDirective":
		case "AnimateDirective": {
			if (!scope.has(node.name) && known.has(node.name)) out.add(node.name);
			collect(node.expression, known, scope, out);
			return;
		}

		// Function bodies see their parameters.
		case "FunctionDeclaration":
		case "FunctionExpression":
		case "ArrowFunctionExpression": {
			const inner = extend(scope, patternNames({ type: "ArrayPattern", elements: node.params }));
			// The params are walked in the INNER scope rather than skipped: their names are bound
			// there and so cannot be recorded, while their type annotations and default values —
			// `(row: PropRow, fallback = EMPTY)` — still are.
			for (const key of Object.keys(node)) {
				if (key === "id") continue;
				collect(node[key], known, inner, out);
			}
			return;
		}
		case "CatchClause": {
			collect(node.body, known, extend(scope, patternNames(node.param)), out);
			return;
		}

		// `{#each list as item, i (key)}` — the list and the key are read in the OUTER scope.
		case "EachBlock": {
			collect(node.expression, known, scope, out);
			const names = patternNames(node.context);
			if (node.index) names.add(node.index);
			const inner = extend(scope, names);
			collect(node.key, known, inner, out);
			collect(node.body, known, inner, out);
			collect(node.fallback, known, scope, out);
			return;
		}
		// `{#snippet name(params)}` — the name belongs to the page, the parameters to the body.
		case "SnippetBlock": {
			const inner = extend(
				scope,
				patternNames({ type: "ArrayPattern", elements: node.parameters ?? [] }),
			);
			// Same reasoning as a function's params: `{#snippet demo(content: Snippet)}` needs the
			// `Snippet` type carried even though `content` must not be.
			collect(node.parameters, known, inner, out);
			collect(node.body, known, inner, out);
			return;
		}
		case "AwaitBlock": {
			collect(node.expression, known, scope, out);
			collect(node.pending, known, scope, out);
			collect(node.then, known, extend(scope, patternNames(node.value)), out);
			collect(node.catch, known, extend(scope, patternNames(node.error)), out);
			return;
		}

		default:
			break;
	}

	for (const key of Object.keys(node)) {
		if (key === "type" || key === "start" || key === "end" || key === "loc" || key === "parent") {
			continue;
		}
		collect(node[key], known, scope, out);
	}
}

/* -------------------------------------------------------------------------------------------
 * The page's own bindings
 * ---------------------------------------------------------------------------------------- */

/** Rebuild an import statement carrying only the specifiers the example reached for. */
function pruneImport(declaration, used) {
	const kept = declaration.specifiers.filter((specifier) => used.has(specifier.local.name));
	if (kept.length === 0) return null;

	const source = JSON.stringify(declaration.source.value);
	const typeOnly = declaration.importKind === "type" ? "type " : "";

	// A namespace import cannot be joined by named ones, so it is the whole statement or nothing.
	const namespace = kept.find((specifier) => specifier.type === "ImportNamespaceSpecifier");
	if (namespace) return `import ${typeOnly}* as ${namespace.local.name} from ${source};`;

	/*
	 * A default import CAN be joined by named ones — `import Foo, { bar } from "x"` — and taking
	 * the first specifier and returning was how `bar` used to vanish from a paste with nothing to
	 * say it had. No page writes that shape today; the next one to write it will not find out the
	 * hard way.
	 */
	const fallback = kept.find((specifier) => specifier.type === "ImportDefaultSpecifier");
	const named = kept.filter((specifier) => specifier.type === "ImportSpecifier");
	if (fallback && named.length === 0) {
		return `import ${typeOnly}${fallback.local.name} from ${source};`;
	}

	const names = named.map((specifier) => {
		const prefix = specifier.importKind === "type" ? "type " : "";
		const imported = specifier.imported?.name ?? specifier.local.name;
		return imported === specifier.local.name
			? `${prefix}${specifier.local.name}`
			: `${prefix}${imported} as ${specifier.local.name}`;
	});
	const clause = `{ ${names.join(", ")} }`;
	return `import ${typeOnly}${fallback ? `${fallback.local.name}, ` : ""}${clause} from ${source};`;
}

/**
 * Can a reader who installed the published registry resolve this module?
 *
 * DERIVED FROM `registry.json`, not from a hand-written list, so it cannot drift: the registry
 * is the definition of what ships, and a component promoted or retired changes this answer on
 * the next build. A bare specifier is a package. Everything else — `$lib/hooks/route.svelte.js`,
 * a sibling under `pages/`, the layout components — is the gallery's own and belongs on the
 * missing line instead.
 */
function isPublished(specifier, published, fromDirectory) {
	if (!specifier.startsWith("$lib/") && !specifier.startsWith(".")) return true;
	if (BASELINE_MODULES.has(specifier)) return true;

	/*
	 * A verbatim port of an official shadcn-svelte component is deliberately NEVER republished
	 * here — `tools/registry/generate.mjs` states the rule — so `registry.json` has nothing to
	 * say about `label`, `collapsible` or `aspect-ratio` even though every consumer installs
	 * them from the official registry. Their absence means "you already have it", not "you
	 * cannot have it", and reporting them missing would put a false warning on 84 examples.
	 */
	const ui = /^\$lib\/components\/ui\/([^/]+)\//.exec(specifier);
	if (ui && published.official.has(ui[1])) return true;

	const base = specifier.startsWith("$lib/")
		? `src/lib/${specifier.slice("$lib/".length)}`
		: `${fromDirectory}/${specifier.replace(/^\.\//, "")}`;

	return [base, base.replace(/\.js$/, ".ts"), base.replace(/\.svelte\.js$/, ".svelte.ts")].some(
		(candidate) => published.files.has(candidate),
	);
}

/* -------------------------------------------------------------------------------------------
 * Markup
 * ---------------------------------------------------------------------------------------- */

/** The nodes that render something, ignoring the whitespace between them. */
function elementNodes(nodes) {
	return nodes.filter((node) => !(node.type === "Text" && node.data.trim() === ""));
}

/**
 * Widen an offset back to the start of its line, when only indentation precedes it.
 *
 * A node's `start` sits after the tabs that indent it, so a slice taken from there gives a first
 * line at column zero and the rest at their original depth — which {@link dedent} then reads as
 * nothing to remove. Taking the line's whitespace with it keeps the block rectangular.
 */
function lineStart(source, index) {
	const start = source.lastIndexOf("\n", index - 1) + 1;
	return source.slice(start, index).trim() === "" ? start : index;
}

/** Remove the deepest indentation every line shares, so the example starts at column zero. */
function dedent(text) {
	const lines = text.split("\n");
	let depth = Infinity;
	for (const line of lines) {
		if (line.trim() === "") continue;
		depth = Math.min(depth, line.length - line.replace(/^\t+/, "").length);
	}
	if (!Number.isFinite(depth) || depth === 0) return lines.join("\n").trim();
	return lines
		.map((line) => (line.trim() === "" ? "" : line.slice(depth)))
		.join("\n")
		.trim();
}

/**
 * Cut the gallery's frame off the example.
 *
 * Four sections in five open with a bare `<Card.Root><Card.Content …>`, and that card is not the demo
 * — it is the surface the gallery renders every demo on, the way another documentation site
 * wraps its examples in a bordered `<div>`. A reader pasting into their own page already has a
 * surface. So the frame comes off, and the `class` that sat on `Card.Content` stays, because it
 * is the demo's own layout (`flex flex-wrap items-center gap-2` is what puts four buttons in a
 * row).
 *
 * THE CONDITIONS ARE STRICT ON PURPOSE. A `Card.Root` carrying any attribute at all, or holding
 * a `Card.Header`, is the demo — the Card page's sections are exactly that — so the frame is
 * only ever removed when it carries nothing and contains nothing but one `Card.Content`.
 */
function stripFrame(nodes, source) {
	const elements = elementNodes(nodes);
	if (elements.length !== 1) return null;

	const root = elements[0];
	if (root.type !== "Component" || root.name !== "Card.Root" || root.attributes.length > 0)
		return null;

	const inner = elementNodes(root.fragment.nodes);
	if (inner.length !== 1) return null;

	const content = inner[0];
	if (content.type !== "Component" || content.name !== "Card.Content") return null;

	// One static `class` may travel; an expression would drag page declarations into a wrapper
	// the reader did not ask for, and any other attribute means the card is doing something.
	const attributes = content.attributes;
	let wrapper = null;
	if (attributes.length === 1) {
		const only = attributes[0];
		const isStaticClass =
			only.type === "Attribute" &&
			only.name === "class" &&
			Array.isArray(only.value) &&
			only.value.length === 1 &&
			only.value[0].type === "Text";
		if (!isStaticClass) return null;
		wrapper = only.value[0].data;
	} else if (attributes.length > 1) {
		return null;
	}

	const children = elementNodes(content.fragment.nodes);
	if (children.length === 0) return null;

	const body = dedent(source.slice(lineStart(source, children[0].start), children.at(-1).end));
	// The retained nodes travel back with the markup, because references are read off THEM. A
	// demo that nests its own card inside the gallery's — eleven of them do — must keep the
	// `Card` import that dropping the frame alone would have taken away with it.
	const indented = body
		.split("\n")
		.map((line) => (line === "" ? "" : `\t${line}`))
		.join("\n");
	return {
		markup: wrapper ? `<div class="${wrapper}">\n${indented}\n</div>` : body,
		nodes: children,
	};
}

/* -------------------------------------------------------------------------------------------
 * The extractor
 * ---------------------------------------------------------------------------------------- */

/**
 * Every section of one page, keyed the way `DocSection` will ask for it.
 *
 * THE KEY IS THE TITLE, or the explicit `id` where a section overrides it. Not the derived
 * anchor id: computing that here would mean a second copy of `sectionId()` living in a build
 * tool, free to drift from the one the component uses. The component knows both strings, so it
 * asks with the one this file can also see.
 *
 * @param {string} rawSource
 * @param {{ file: string, published: ReturnType<typeof publishedModules> }} options
 * @returns {{ sections: Record<string, SectionSource>, skipped: string[] }}
 */
export function extractSections(rawSource, { file, published }) {
	// Parse the LF form so every offset below indexes the same string the slices come from.
	const source = rawSource.replace(/\r\n/g, "\n");
	const ast = parse(source, { modern: true });
	const directory = file.slice(0, file.lastIndexOf("/"));

	/** @type {Map<string, { statement: import("estree").ImportDeclaration, specifier: string }>} */
	const imported = new Map();
	/** @type {Map<string, { text: string, node: any, order: number }>} */
	const declared = new Map();
	/** Top-level statements that declare nothing but drive something. */
	/** @type {{ text: string, node: any, order: number }[]} */
	const effects = [];

	let order = 0;
	for (const statement of ast.instance?.content.body ?? []) {
		if (statement.type === "ImportDeclaration") {
			for (const specifier of statement.specifiers) {
				imported.set(specifier.local.name, { statement, specifier: statement.source.value });
			}
			continue;
		}
		const text = source.slice(statement.start, statement.end);
		const names =
			statement.type === "VariableDeclaration"
				? statement.declarations.flatMap((d) => [...patternNames(d.id)])
				: statement.id?.name
					? [statement.id.name]
					: [];

		const entry = { text, node: statement, order: order++ };
		if (names.length > 0) {
			for (const name of names) declared.set(name, entry);
			continue;
		}

		/*
		 * A statement with NO name — `$effect(…)`, `progressQueue.seed(…)` — is the one thing the
		 * closure cannot reach, because the closure follows names. It is also the one thing that
		 * cannot be reported as missing, for the same reason. So it is kept separately and pulled
		 * in by what it TOUCHES: an example that carries `statusProgress` gets the effect that
		 * advances it, and a progress bar that would otherwise paste frozen at zero moves.
		 */
		effects.push(entry);
	}

	/** Page-level snippets: a demo may render one by name, and then it has to travel with it. */
	/** @type {Map<string, { text: string, node: any }>} */
	const snippets = new Map();
	const collectSnippets = (nodes) => {
		for (const node of nodes) {
			if (node.type === "SnippetBlock" && node.expression?.name) {
				snippets.set(node.expression.name, {
					text: source.slice(lineStart(source, node.start), node.end),
					node,
				});
			}
		}
	};
	collectSnippets(ast.fragment.nodes);
	const docPage = ast.fragment.nodes.find(
		(node) => node.type === "Component" && node.name === "DocPage",
	);
	if (docPage) collectSnippets(docPage.fragment.nodes);

	const known = new Set([...imported.keys(), ...declared.keys(), ...snippets.keys()]);

	/** @type {Record<string, SectionSource>} */
	const sections = {};
	const skipped = [];

	const walkForSections = (nodes) => {
		for (const node of nodes) {
			if (node.type === "Component" && node.name === "DocSection") {
				const entry = buildSection(node);
				if (entry) sections[entry.key] = entry.value;
				continue;
			}
			if (node.fragment?.nodes) walkForSections(node.fragment.nodes);
			for (const key of [
				"body",
				"then",
				"catch",
				"pending",
				"fallback",
				"alternate",
				"consequent",
			]) {
				if (node[key]?.nodes) walkForSections(node[key].nodes);
			}
		}
	};

	function buildSection(node) {
		const idAttribute = node.attributes.find((a) => a.type === "Attribute" && a.name === "id");
		const titleAttribute = node.attributes.find(
			(a) => a.type === "Attribute" && a.name === "title",
		);

		const staticText = (attribute) =>
			attribute &&
			Array.isArray(attribute.value) &&
			attribute.value.length === 1 &&
			attribute.value[0].type === "Text"
				? attribute.value[0].data
				: null;

		const title = staticText(titleAttribute);
		const key = staticText(idAttribute) ?? title;
		if (!key) {
			/*
			 * A title built from an expression cannot be matched to what the browser will ask for,
			 * so the section has to say `code={false}` — and this is what makes that agreement a
			 * mechanism rather than a habit. Opted out, the section is skipped in silence; not
			 * opted out, the build FAILS, because the alternative is a control that renders and
			 * then cannot answer.
			 */
			// `code={false}` parses as a single `ExpressionTag`, not as the array a quoted value gets.
			const optedOut = node.attributes.some((attribute) => {
				if (attribute.type !== "Attribute" || attribute.name !== "code") return false;
				const value = Array.isArray(attribute.value) ? attribute.value[0] : attribute.value;
				return value?.type === "ExpressionTag" && value.expression?.value === false;
			});
			if (!optedOut) {
				throw new Error(
					`${file}: a DocSection's title is an expression, so its example cannot be extracted. ` +
						`Add code={false} to that section.`,
				);
			}
			skipped.push(`${file}: a DocSection opted out of code extraction`);
			return null;
		}

		const body = node.fragment.nodes.filter(
			(child) => !(child.type === "SnippetBlock" && child.expression?.name === BLURB),
		);
		const elements = elementNodes(body);
		if (elements.length === 0) return null;

		const stripped = stripFrame(body, source);
		const markup = stripped
			? stripped.markup
			: dedent(source.slice(lineStart(source, elements[0].start), elements.at(-1).end));

		// Read off exactly what is COPIED. Deleting the frame's own names afterwards was the same
		// idea done by guesswork, and it took `Card` away from eleven demos that nest a card of
		// their own inside the gallery's.
		const used = new Set();
		for (const child of stripped?.nodes ?? body) collect(child, known, new Set(), used);

		/*
		 * Close over what those names themselves need, until nothing new appears — and each round,
		 * admit any unnamed statement that touches something already carried, because admitting it
		 * can pull in further names of its own.
		 */
		const carriedEffects = new Set();
		const pending = [...used];
		const reach = (node_) => {
			const nested = new Set();
			collect(node_, known, new Set(), nested);
			for (const next of nested) {
				if (used.has(next)) continue;
				used.add(next);
				pending.push(next);
			}
			return nested;
		};

		for (;;) {
			while (pending.length > 0) {
				const name = pending.pop();
				const declaration = declared.get(name) ?? snippets.get(name);
				if (declaration) reach(declaration.node);
			}

			const admitted = effects.filter((effect) => {
				if (carriedEffects.has(effect)) return false;
				const touches = new Set();
				collect(effect.node, known, new Set(), touches);
				return [...touches].some((name) => used.has(name));
			});
			if (admitted.length === 0) break;
			for (const effect of admitted) {
				carriedEffects.add(effect);
				reach(effect.node);
			}
		}

		const importsUsed = new Map();
		for (const name of used) {
			const entry = imported.get(name);
			if (!entry) continue;
			const list = importsUsed.get(entry.statement) ?? new Set();
			list.add(name);
			importsUsed.set(entry.statement, list);
		}

		const imports = [];
		const missing = [];
		for (const [statement, names] of importsUsed) {
			if (isPublished(statement.source.value, published, directory)) {
				const text = pruneImport(statement, names);
				if (text) imports.push(text);
				continue;
			}
			for (const name of names) missing.push(`${name} (from ${statement.source.value})`);
		}

		// By statement, not by name: one declaration can bind several, and the page's order is the
		// order things have to run in.
		const statements = new Set(
			[...declared.entries()].filter(([name]) => used.has(name)).map(([, value]) => value),
		);
		for (const effect of carriedEffects) statements.add(effect);
		const locals = [...statements].sort((a, b) => a.order - b.order).map((value) => value.text);

		const renderedSnippets = [...snippets.entries()]
			.filter(([name]) => used.has(name))
			.map(([, value]) => dedent(value.text));

		return {
			key,
			value: {
				title: title ?? key,
				imports,
				locals,
				snippets: renderedSnippets,
				code: markup,
				missing,
			},
		};
	}

	walkForSections(ast.fragment.nodes);
	return { sections, skipped };
}

/**
 * What a reader who installed this theme can already import.
 *
 * TWO SOURCES, BOTH DERIVED. `registry.json` is the definition of what this repository ships, and
 * `tools/registry/official-index.json` is the committed snapshot of the official shadcn-svelte
 * registry — which matters because the house rule is that a verbatim port of an official
 * component is never republished from here. Reading both means the answer follows the registry
 * rather than a list somebody has to remember to update.
 *
 * @param {{ items?: { files?: { path: string }[] }[] }} registry
 * @param {{ name: string, type?: string }[]} officialIndex
 */
export function publishedModules(registry, officialIndex) {
	const files = new Set();
	for (const item of registry.items ?? []) {
		for (const entry of item.files ?? []) files.add(entry.path);
	}
	const official = new Set(
		officialIndex.filter((item) => item.type === "registry:ui").map((item) => item.name),
	);
	return { files, official };
}
