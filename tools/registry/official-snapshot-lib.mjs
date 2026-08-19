/**
 * How this repo's `ui/` folders are compared against the OFFICIAL shadcn-svelte registry.
 *
 * A LIBRARY, imported by both sides: `sync-official.mjs` fetches upstream and writes the
 * fingerprints, `generate.mjs` reads them back and classifies each folder port / fork / house.
 * The two must hash identically or every folder reads as a fork, which is the whole reason the
 * normalisation lives here rather than being written twice.
 *
 * WHY FINGERPRINTS AND NOT A HEURISTIC. The first classifier counted comment lines, on the
 * house rule that ported files stay comment-free. An adversarial review found it wrong in BOTH
 * directions: `tabs` and `toggle` are heavily forked (a `size` prop, the `--control-h-*` ramp)
 * yet sat under the threshold, so they were never published and a consumer installing the
 * official one silently lost the house API; `sidebar` is verbatim upstream yet carries 22 lines
 * of UPSTREAM's own JSDoc, so it was republished for nothing. Comment volume never tracked
 * divergence. Content does, exactly.
 */

import { createHash } from "node:crypto";

/** Where the committed fingerprints live, repo-relative. */
export const SNAPSHOT_PATH = "tools/registry/official-snapshot.json";

/**
 * The comparison shape: alias placeholders resolved to this repo's spelling, line endings and
 * trailing whitespace flattened. Published files write `$UTILS$`/`$UI$` and friends for the CLI
 * to substitute per project; our source has them substituted already, so without this step the
 * two never match.
 */
export function normalise(source) {
	return source
		.replaceAll("$UI$", "$lib/components/ui")
		.replaceAll("$COMPONENTS$", "$lib/components")
		.replaceAll("$HOOKS$", "$lib/hooks")
		.replaceAll("$UTILS$", "$lib/utils")
		.replaceAll("$LIB$", "$lib")
		.replaceAll("\r\n", "\n")
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n")
		.trim();
}

export const fingerprint = (source) =>
	createHash("sha256").update(normalise(source)).digest("hex").slice(0, 16);
