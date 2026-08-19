/**
 * A small reader for the top-level blocks of `src/app.css`.
 *
 * WHY PARSE RATHER THAN RETYPE. The registry has to hand a consumer the base palette and the
 * page-header mechanics, and both already exist — in `app.css`, where `themes:audit` checks the
 * palette half against the solved base and refuses to run on a mismatch. Copying either into
 * `registry.json` by hand would mint a third copy that no check guards, so `registry:generate`
 * reads the real file instead and the copy cannot drift.
 *
 * IT IS NOT A CSS PARSER. It knows three things: comments, brace depth, and semicolons at depth
 * zero. That is enough for the blocks it is pointed at — flat declaration lists under a selector
 * — and it throws rather than guessing when a requested block is absent, so a rename in `app.css`
 * fails the generator instead of silently emitting an item with a missing half.
 */

/** Strip `/* … *\/` comments. Runs first, so nothing below has to think about them. */
function stripComments(css) {
	return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Every top-level `selector { body }` pair, in source order.
 *
 * Nested blocks stay inside their parent's body untouched — `@theme inline` and the `@layer base`
 * rules are read as one block each, which is what the callers want.
 */
export function topLevelBlocks(css) {
	const source = stripComments(css);
	const blocks = [];
	let selector = "";
	let depth = 0;
	let body = "";

	for (const char of source) {
		if (depth === 0) {
			if (char === "{") {
				depth = 1;
				body = "";
			} else if (char === ";") {
				// A statement, not a selector: `@import`, `@custom-variant`, `@plugin`. Whatever has
				// accumulated belongs to it and must not be carried onto the next block's selector.
				selector = "";
			} else {
				selector += char;
			}
			continue;
		}

		if (char === "{") depth += 1;
		if (char === "}") {
			depth -= 1;
			if (depth === 0) {
				blocks.push({ selector: selector.trim().replace(/\s+/g, " "), body });
				selector = "";
				continue;
			}
		}
		body += char;
	}

	return blocks;
}

/**
 * The declarations of a block body, as `{ property: value }`.
 *
 * Splitting on semicolons at depth zero is what keeps a nested rule out of the result: its own
 * semicolons sit at depth one and are skipped along with it. Values spanning several lines are
 * rejoined, because the split is on `;` and not on the newline.
 */
export function declarations(body) {
	const out = {};
	let depth = 0;
	let buffer = "";

	const flush = () => {
		const text = buffer.trim();
		buffer = "";
		if (!text) return;

		const colon = text.indexOf(":");
		if (colon === -1) return;

		const property = text.slice(0, colon).trim();
		const value = text
			.slice(colon + 1)
			.trim()
			.replace(/\s+/g, " ");
		if (property && value) out[property] = value;
	};

	for (const char of body) {
		if (char === "{") {
			depth += 1;
			// Entering a nested rule: whatever accumulated was its SELECTOR, not a declaration.
			if (depth === 1) {
				buffer = "";
				continue;
			}
		}
		if (char === "}") {
			depth -= 1;
			if (depth === 0) {
				buffer = "";
				continue;
			}
		}
		// Inside a nested rule: its declarations belong to `nestedBlock`, never to this reader.
		if (depth > 0) continue;
		if (char === ";") {
			flush();
			continue;
		}
		buffer += char;
	}
	flush();

	return out;
}

/**
 * One block, by exact selector, with an ordinal for the selectors that repeat.
 *
 * `app.css` has three top-level `:root` blocks — the base palette, the page-header metrics, and
 * the loader easings — so the caller has to say which, and `nth` is how. Out of range throws:
 * a block that moved is a block the generator must not silently skip.
 */
export function blockBySelector(blocks, selector, nth = 0) {
	const matches = blocks.filter((b) => b.selector === selector);
	if (matches.length <= nth) {
		throw new Error(
			`src/app.css: expected at least ${nth + 1} \`${selector}\` block(s), found ${matches.length}`,
		);
	}
	return declarations(matches[nth].body);
}

/** The first block whose selector contains `needle`. Throws when there is none. */
export function blockContaining(blocks, needle) {
	const match = blocks.find((b) => b.selector.includes(needle));
	if (!match)
		throw new Error(`src/app.css: no top-level block whose selector contains \`${needle}\``);
	return declarations(match.body);
}

/**
 * One block, by exact selector, as a TREE — for the blocks `declarations` cannot read.
 *
 * `declarations` splits on depth-zero semicolons and skips nested rules entirely, which is
 * right for a flat rule and garbage for an at-rule: an `@keyframes` body is NOTHING BUT nested
 * rules, so the flat reader returns keys like `"50% {
 opacity"`. The registry's `css` field
 * accepts the nested form — a value may itself be a `{ selector: declarations }` object — so
 * this returns exactly that: the block's own depth-zero declarations merged with one entry per
 * child block. Children keep source order, which JSON object keys preserve.
 */
export function nestedBlock(blocks, selector, nth = 0) {
	const matches = blocks.filter((b) => b.selector === selector);
	if (matches.length <= nth) {
		throw new Error(
			`src/app.css: expected at least ${nth + 1} \`${selector}\` block(s), found ${matches.length}`,
		);
	}
	return bodyToTree(matches[nth].body);
}

/**
 * A block body as a RECURSIVE tree: own declarations plus one entry per child block, each
 * child a tree of its own. One level was not enough — a `@keyframes` nested inside `@theme`
 * has its `from`/`to` at depth TWO, and a single-level reader returned `{}` for it, which
 * shipped six bodiless marquee animations before the recursion existed.
 */
export function bodyToTree(body) {
	const children = topLevelBlocks(body).map((child) => [child.selector, bodyToTree(child.body)]);
	return { ...declarations(body), ...Object.fromEntries(children) };
}

/** Drop the leading `--` from every key: the registry writes css vars unprefixed. */
export function unprefix(tokens) {
	return Object.fromEntries(Object.entries(tokens).map(([k, v]) => [k.replace(/^--/, ""), v]));
}
