import { getContext, setContext } from "svelte";
import { REPOSITORY_URL } from "$lib/data/repository.js";

/**
 * The example behind one section heading, and the text the copy control puts on the clipboard.
 *
 * WHERE THE PARTS COME FROM. `tools/site/section-source.mjs` cuts them out of the page at build
 * time, using the compiler's own parser — that is where every judgement lives (which imports the
 * example needs, which page declarations travel with it, what a consumer will not have). This
 * file only JOINS them, so nothing here can disagree with what was extracted, and the parts stay
 * separate for a code panel that may want them.
 *
 * WHY THE TEXT SAYS WHERE IT CAME FROM. The control copies blind: unlike every documentation
 * site that ships this affordance, there is no code panel open beside it, so the reader learns
 * what they got when they paste. The header names the section and links to it, and anything the
 * example needed that the gallery alone can provide is listed rather than quietly dropped —
 * a paste that does not compile should say why on its first line, not on the reader's third
 * attempt.
 */

/** One section's example, as the build extracted it. */
export type SectionSource = {
	/** The heading this came from. */
	title: string;
	/** Import statements, pruned to the specifiers the example uses. */
	imports: string[];
	/** Page declarations the example reads, in the order the page wrote them. */
	locals: string[];
	/** Page-level snippets the example renders. */
	snippets: string[];
	/** The example's markup, gallery frame removed and dedented. */
	code: string;
	/** Names the example needs that a consumer's project will not have. */
	missing: string[];
};

/** Every section of one page, keyed by its `id` prop or, failing that, its title. */
export type PageSections = Record<string, SectionSource>;

/**
 * What `DocPage` offers its sections.
 *
 * `available` is false for the two routes that render sections from a component with no page
 * file of their own — the catalog index and the group pages — and for anything the build could
 * not extract. `DocSection` renders no control at all in that case, which is the honest
 * alternative to a control that fails when pressed.
 */
export type SectionSourceContext = {
	readonly available: boolean;
	/**
	 * The example for one key.
	 *
	 * A promise on the first call for a page — the extracted sections are their own chunk, fetched
	 * then — and a plain value afterwards. The distinction is not academic: `CopyButtonState`
	 * shows its pending face only for a producer that does not answer synchronously, so returning
	 * the resolved value keeps a spinner from flashing on every later press.
	 */
	get(key: string): SectionSource | Promise<SectionSource>;
};

const SECTION_SOURCE_KEY = Symbol("section-source");

export function setSectionSourceContext(context: SectionSourceContext): void {
	setContext(SECTION_SOURCE_KEY, context);
}

export function getSectionSourceContext(): SectionSourceContext | undefined {
	return getContext<SectionSourceContext | undefined>(SECTION_SOURCE_KEY);
}

/** Push a block one tab deeper. Only the first line needs it; the rest carry their own. */
function indentFirst(block: string): string {
	const [first, ...rest] = block.split("\n");
	return [`\t${first}`, ...rest].join("\n");
}

/**
 * Assemble the clipboard text: a Svelte component, or as close to one as the page allows.
 *
 * The order is a file's order — header, script, markup, then any snippet the markup renders —
 * so what lands in an editor is already in the shape it will be saved in. Tabs, because the
 * repository is tabs and re-indenting someone else's code on the way out is a lossy transform
 * their formatter will undo anyway. One trailing newline: none leaves the editor's next
 * keystroke welded to the closing tag, two leaves a blank line the formatter strips.
 */
export function sectionSourceText(source: SectionSource, url: string, title?: string): string {
	// The rendered title wins. A section whose heading interpolates data — `The 12 palettes` — is
	// an expression in the page source, so the build can only key it by its `id`; the component is
	// the only half that knows what the heading actually says.
	/*
	 * BOTH ADDRESSES ARE LABELLED. They sit under one organisation name and differ only in host, so
	 * a reader opening this file a month later could not tell the rendered page from the source by
	 * looking. The source is worth carrying because the question a pasted example raises later is
	 * rarely "where did I see this" but "how is it actually built".
	 */
	const header = [
		`<!--`,
		`\t${title ?? source.title} — from the Parallax gallery`,
		`\tPage:   ${url}`,
		`\tSource: ${REPOSITORY_URL}`,
	];
	if (source.missing.length > 0) {
		header.push(
			"",
			"\tNOT INCLUDED — these belong to the gallery itself, not to the theme it documents:",
			...source.missing.map((name) => `\t  ${name}`),
		);
	}
	header.push(`-->`);

	const script =
		source.imports.length > 0 || source.locals.length > 0
			? [
					'<script lang="ts">',
					...source.imports.map(indentFirst),
					...(source.imports.length > 0 && source.locals.length > 0 ? [""] : []),
					source.locals.map(indentFirst).join("\n\n"),
					"</script>",
				].filter((part) => part !== "")
			: [];

	return [
		header.join("\n"),
		...(script.length > 0 ? [script.join("\n")] : []),
		source.code,
		...source.snippets,
	]
		.join("\n\n")
		.concat("\n");
}
