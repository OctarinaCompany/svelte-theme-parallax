/**
 * Refreshes `official-snapshot.json` — the fingerprints `generate.mjs` classifies against.
 *
 * Run it when shadcn-svelte releases: `npm run registry:sync`. The snapshot is committed, so a
 * generate run never touches the network, and a refresh that reclassifies a folder shows up as
 * a reviewable diff in `registry.json` rather than as a surprise at install time.
 *
 * @see tools/registry/official-snapshot-lib.mjs — the normalisation both sides share, and why
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

import { fingerprint, normalise, SNAPSHOT_PATH } from "./official-snapshot-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY = "https://shadcn-svelte.com/registry";

/**
 * Re-format the official side with THIS repo's Prettier config before hashing.
 *
 * Formatting is not divergence, and unnormalised it swamps the signal: `label.svelte` differed
 * from upstream by a single trailing comma and read as a fork. The repo's own files are already
 * Prettier-clean (`format:check` covers `ui/`), so only this side needs the pass — which also
 * keeps `generate` free of any formatting work.
 */
async function formatted(source, filename) {
	const options = await prettier.resolveConfig(resolve(root, "src/lib/components/ui", filename));
	try {
		return await prettier.format(source, { ...options, filepath: filename });
	} catch {
		// Unformattable upstream content is compared as-is: a parse failure is upstream's
		// business, and hashing the raw text still detects real change.
		return source;
	}
}

const index = JSON.parse(readFileSync(resolve(root, "tools/registry/official-index.json"), "utf8"));
const wanted = index.filter((i) => i.type === "registry:ui" || i.type === "registry:hook");

const snapshot = {};
let files = 0;
for (const entry of wanted) {
	const item = await (await fetch(`${REGISTRY}/${entry.relativeUrl}`)).json();
	const entries = [];
	for (const f of item.files ?? []) {
		// Keyed by BASENAME: the official targets carry their own folder prefix, and the only
		// thing that has to line up is which file in the folder is being compared.
		const name = (f.target ?? f.path).split("/").at(-1);
		entries.push([name, fingerprint(await formatted(normalise(f.content), name))]);
	}
	snapshot[entry.name] = Object.fromEntries(entries);
	files += entries.length;
}

writeFileSync(resolve(root, SNAPSHOT_PATH), `${JSON.stringify(snapshot, null, "\t")}\n`, "utf8");
console.log(`wrote ${SNAPSHOT_PATH} — ${wanted.length} items, ${files} files`);
