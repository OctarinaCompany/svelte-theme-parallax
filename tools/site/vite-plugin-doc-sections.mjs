/**
 * Serves each gallery page's examples as data, so a heading can offer to copy the one beside it.
 *
 * `import("…/ButtonPage.svelte?sections")` resolves here and returns the record
 * `tools/site/section-source.mjs` extracts — one entry per `DocSection`, already reduced to the
 * markup, the imports and the page declarations that example needs.
 *
 * WHY A PLUGIN AND NOT A GENERATOR. The alternative was a script writing one JSON file per page
 * into the repository: 2 MB of generated text that churns on every page edit, or the same text
 * gitignored and `npm run check` suddenly depending on a build step having run. A plugin keeps
 * the extraction where it belongs — in Node, where the compiler's parser already lives — with
 * nothing on disk and no new gate. `vite build` IS the test, and CI already runs it, so a page
 * whose shape defeats the extractor fails at review rather than under a reader's click.
 *
 * TWO TRAPS, both paid for once:
 *
 *   THE VIRTUAL ID MUST NOT END IN `.svelte`. `vite-plugin-svelte` steps aside for `?raw`,
 *   `?url` and `?direct` and treats every other `X.svelte?query` as a request to COMPILE — and
 *   it matches on the extension alone, so even a `\0`-prefixed virtual module is handed to the
 *   Svelte compiler, which then fails on the JSON. The id below ends in `.sections.js`, and the
 *   real file it came from is remembered in a map rather than encoded in the name.
 *
 *   `enforce: "pre"` — without it the Svelte plugin resolves the request first and the same
 *   thing happens one step earlier.
 *
 * @see tools/site/section-source.mjs — the extraction, and every judgement in it
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { extractSections, publishedModules } from "./section-source.mjs";

const QUERY = "?sections";
const PREFIX = "\0doc-sections:";

/**
 * @param {{ root?: string }} [options]
 * @returns {import("vite").Plugin}
 */
export function docSections({ root = process.cwd() } = {}) {
	/** Virtual id → the page file it was cut from. */
	const files = new Map();
	let published;

	/** Read once per build: both registries are committed files that do not change under us. */
	const registries = () => {
		published ??= publishedModules(
			JSON.parse(readFileSync(resolve(root, "registry.json"), "utf8")),
			JSON.parse(readFileSync(resolve(root, "tools/registry/official-index.json"), "utf8")),
		);
		return published;
	};

	return {
		name: "parallax:doc-sections",
		enforce: "pre",

		resolveId(id, importer) {
			if (!id.endsWith(QUERY)) return null;
			const resolved = resolve(
				importer ? importer.slice(0, importer.lastIndexOf("/")) : root,
				id.slice(0, -QUERY.length),
			).replaceAll("\\", "/");
			const virtual = `${PREFIX}${resolved}.sections.js`;
			files.set(virtual, resolved);
			return virtual;
		},

		load(id) {
			const file = files.get(id);
			if (!file) return null;

			/*
			 * Re-runs the extraction when the page changes: `load` is called again on the next
			 * request for this module.
			 *
			 * WHAT IT DOES NOT DO, measured rather than assumed. It does not push new examples into
			 * an open tab. The sections module is reached through a dynamic import, so it belongs
			 * to no HMR boundary, and invalidating it by hand — which an earlier version of this
			 * file did — changes nothing the browser can observe: the only update the client
			 * receives is the page's own. A reader editing a page and testing the copy control has
			 * to reload, exactly as `LoaderPage` has always required for its `?raw` sources.
			 */
			this.addWatchFile(file);

			const relative = file.slice(file.indexOf("src/lib/components/pages/"));
			const { sections, skipped } = extractSections(readFileSync(file, "utf8"), {
				file: relative,
				published: registries(),
			});

			// A section that opted out with `code={false}` is skipped deliberately; one that did NOT
			// opt out throws inside `extractSections` and fails the build, so this is only ever the
			// quiet case. Worth one line per build so the count is visible.
			for (const note of skipped) this.warn(note);

			return `export default ${JSON.stringify(sections)};`;
		},
	};
}
