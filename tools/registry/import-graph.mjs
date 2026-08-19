/**
 * The import-graph walker — what turns a `ui/` directory into a registry item mechanically.
 *
 * DETERMINISTIC ON PURPOSE. Seventy-odd items cannot be hand-maintained, and an item whose
 * `files`/`dependencies` drift from its imports fails only in the CONSUMER's project, never
 * here. So the graph is computed from the source at generate time, and every situation the
 * walker does not positively recognise THROWS: an unknown import shape is a bug in this file,
 * not something to skip.
 *
 * WHAT IT KNOWS. Given a start set of files, it walks every `import`/`export … from` across
 * them and classifies each specifier:
 *   - `svelte`, `svelte/*`, `$lib/utils.js`         → nothing (the framework / `init` provide)
 *   - `./x`, `../x`                                  → same item; the file joins the walk
 *   - `$lib/components/ui/<other>/…`                 → a registry dependency on `<other>` —
 *     bare name when `<other>` is a verbatim port of the official registry, our own item's
 *     URL when it is a Parallax fork or house component
 *   - `$lib/shared/<f>`, `$lib/hooks/<f>`            → the owning item's URL, or the file
 *     joins this item when this item IS the owner (single consumers own implicitly;
 *     multi-consumer files must appear in SHARED_OWNERS or the build fails, listing them)
 *   - `$lib/themes/…`                                → parallax-theme's URL
 *   - anything else starting `$lib` or `$app`        → throws (ui code has no business there)
 *   - bare package specifiers                        → npm `dependencies` (subpaths collapse
 *     to the package name; scoped packages keep two segments)
 *
 * @see tools/registry/generate.mjs — the classification tables and the item assembly
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, posix } from "node:path";

/**
 * Every `from "…"` / bare `import "…"` specifier in a source file, type imports included.
 *
 * LINE-ANCHORED, NOT FREE-MATCHED. A free regex over the whole source happily matches the
 * word `from` inside a comment ("ported from 'x'…") and returns prose as a dependency —
 * which is exactly how npm once received `over a snippet is reading noise` as a package
 * name. So statements are accumulated line by line: a line starting with `import`/`export`
 * opens one, the statement closes at the first `;`, and only the accumulated statement is
 * asked for its specifier. Comment lines never open a statement.
 */
export function importsOf(source) {
	const out = [];
	let statement = null;
	for (const raw of source.split("\n")) {
		const line = raw.trim();
		if (statement === null) {
			if (/^(?:import|export)\b/.test(line)) statement = line;
		} else {
			statement += " " + line;
		}
		if (statement !== null && statement.includes(";")) {
			// No quote may precede a real import's `from` — that is what rejects a statement
			// like `export const KEYWORDS = { js: ["import", "from", …] }`, where the word
			// `from` only ever appears INSIDE a string literal.
			const m =
				statement.match(/^(?:import|export)\b[^"'`]*?\bfrom\s*["']([^"']+)["']/) ??
				statement.match(/^import\s*["']([^"']+)["']/);
			if (m) out.push(m[1]);
			statement = null;
		}
	}
	// Dynamic imports — `await import("…")` — count exactly the same.
	for (const m of source.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) {
		out.push(m[1]);
	}
	return out;
}

/** `@lucide/svelte/icons/x` → `@lucide/svelte`; `d3-shape/src/…` → `d3-shape`. */
export function packageOf(specifier) {
	const parts = specifier.split("/");
	return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/**
 * Resolve a repo-relative module path to the file that exists on disk. Imports are written
 * with a `.js` extension against `.ts`/`.svelte.ts` sources, and directory imports mean the
 * barrel — both resolved here, and a miss throws with the importer named.
 */
function resolveFile(root, repoPath, importer) {
	const candidates = repoPath.endsWith(".js")
		? [repoPath.slice(0, -3) + ".ts", repoPath.slice(0, -3) + ".svelte.ts", repoPath]
		: repoPath.endsWith(".svelte")
			? [repoPath]
			: [repoPath + ".ts", repoPath + "/index.ts", repoPath + "/index.js", repoPath];
	for (const candidate of candidates) {
		const abs = resolve(root, candidate);
		if (existsSync(abs) && statSync(abs).isFile()) return candidate;
	}
	throw new Error(`import-graph: cannot resolve "${repoPath}" (imported from ${importer})`);
}

/**
 * Walk one item's graph.
 *
 * @param root      repo root
 * @param seeds     repo-relative files the item starts from (a ui dir's listing)
 * @param ctx       {
 *   itemName,                      // the item being built, e.g. "parallax-data-table"
 *   uiDep(name) -> string|null,    // bare official name, our URL, or null for "same item"
 *   ownerOf(file) -> string|null,  // owning item's name for a shared/hooks file, null = unowned
 *   urlOf(itemName) -> string,     // absolute URL for one of our items
 *   record(file, consumerItem),    // consumer bookkeeping for the ownership report
 * }
 * @returns { files: string[], dependencies: string[], registryDependencies: string[] }
 */
export function walkItem(root, seeds, ctx) {
	const files = new Set();
	const npm = new Set();
	const registry = new Set();
	const queue = [...seeds];

	while (queue.length > 0) {
		const file = queue.shift();
		if (files.has(file)) continue;
		files.add(file);
		const source = readFileSync(resolve(root, file), "utf8");

		for (const spec of importsOf(source)) {
			if (spec === "svelte" || spec.startsWith("svelte/")) continue;
			if (spec === "$lib/utils.js" || spec === "$lib/utils") continue;

			if (spec.startsWith("./") || spec.startsWith("../")) {
				const joined = posix.join(posix.dirname(file), spec);
				queue.push(resolveFile(root, joined, file));
				continue;
			}

			if (spec.startsWith("$lib/components/ui/")) {
				const name = spec.split("/")[3];
				const dep = ctx.uiDep(name);
				if (dep !== null) registry.add(dep);
				continue;
			}

			if (spec.startsWith("$lib/shared/") || spec.startsWith("$lib/hooks/")) {
				const repoPath = resolveFile(root, spec.replace("$lib/", "src/lib/"), file);
				ctx.record(repoPath, ctx.itemName);
				const owner = ctx.ownerOf(repoPath);
				if (owner === ctx.itemName) {
					queue.push(repoPath);
				} else if (owner !== null) {
					registry.add(ctx.urlOf(owner));
				} else {
					// Unowned single-consumer files fold into this item; multi-consumer files
					// without an owner are reported at the end of the generate run instead of
					// here, so ONE run surfaces every decision still to make.
					queue.push(repoPath);
				}
				continue;
			}

			if (spec.startsWith("$lib/themes")) {
				registry.add(ctx.urlOf("parallax-theme"));
				continue;
			}

			if (spec.startsWith("$lib") || spec.startsWith("$app")) {
				throw new Error(`import-graph: unexpected specifier "${spec}" in ${file}`);
			}

			npm.add(packageOf(spec));
		}
	}

	return {
		files: [...files].sort(),
		dependencies: [...npm].sort(),
		registryDependencies: [...registry].sort(),
	};
}

/** A ui directory's own files, repo-relative — the walk's seed set. */
export function uiSeeds(root, dir) {
	return readdirSync(resolve(root, "src/lib/components/ui", dir)).map(
		(f) => `src/lib/components/ui/${dir}/${f}`,
	);
}
