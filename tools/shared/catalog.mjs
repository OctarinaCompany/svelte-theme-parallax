/**
 * The gallery catalog, read out of `src/lib/hooks/route.svelte.ts`.
 *
 * SHARED, not copied. `CATEGORIES` is the single place a route is written down
 * (`docs/CONVENTIONS.md` §9), and two tools now need that list: `tools/registry/generate.mjs`
 * (the gallery index in `public/llms.txt` and `skills/parallax/references/components.md`) and
 * `tools/site/prerender.mjs` (one HTML file per route). A second copy of the parser would be a
 * second thing to keep in step with the catalog, which is the exact drift §9 exists to prevent.
 *
 * The parser is a TEXT WALK, not an import: `route.svelte.ts` is TypeScript and drags Svelte
 * runes with it, so a Node tool cannot load it. The same reasoning the CSS reader uses against
 * `src/app.css`.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * The groups of one exported catalog literal, in source order.
 *
 * `CATEGORIES` returns the twelve groups, each with the items filed under it; `DESTINATIONS`
 * has no group headers and comes back as a single group whose `title` and `slug` are `null`.
 *
 * @param {string} exportName `"CATEGORIES"` or `"DESTINATIONS"`.
 * @returns {{ title: string | null, slug: string | null, items: { title: string, slug: string }[] }[]}
 */
export function parseCatalog(exportName) {
	const source = readFileSync(resolve(root, "src/lib/hooks/route.svelte.ts"), "utf8");
	const start = source.indexOf(`export const ${exportName} = [`);
	const end = source.indexOf("] as const", start);
	if (start === -1 || end === -1) {
		throw new Error(`route.svelte.ts: could not find the ${exportName} literal`);
	}
	const block = source.slice(start, end);
	// Pair every `title:` with the `slug:` that follows it, in order. A slug that does not
	// start with "/components/" is a GROUP header; everything after it belongs to that group.
	const pairs = [...block.matchAll(/title: "([^"]+)",\s*slug: "([^"]+)"/g)].map((m) => ({
		title: m[1],
		slug: m[2],
	}));
	const groups = [];
	for (const pair of pairs) {
		if (!pair.slug.startsWith("/components/")) {
			// A group header carries its own one-segment slug — `patterns`, `layout` — which
			// `groupPath()` in `route.svelte.ts` turns into `/components/group/<slug>`. The
			// registry generator ignores the field; the prerender step needs it.
			groups.push({ title: pair.title, slug: pair.slug, items: [] });
		} else if (groups.length === 0) {
			// DESTINATIONS: a flat list with no group headers.
			groups.push({ title: null, slug: null, items: [pair] });
		} else {
			groups.at(-1).items.push(pair);
		}
	}
	return groups;
}
