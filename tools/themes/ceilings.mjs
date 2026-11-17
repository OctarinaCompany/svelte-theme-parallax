/**
 * The sRGB ceiling tables — the two tables of derived data that live outside the generator,
 * checked against the palettes they were cut from.
 *
 * WHY THIS EXISTS. Two stylesheets carry a chroma cap per palette, and `generate.mjs` writes
 * neither. `src/vibrant.css` caps the dark head of the vibrant chrome (`--vibrant-cap`), and
 * `src/backdrops.css` caps the three dark aurora fields (`--backdrop-aur-ceil-1` to `-3`). Each
 * entry was measured from a palette's dark `--primary` and copied in by hand, so nothing keeps it
 * true: a brand hue that moves, a palette that is added or a stop whose lightness is edited voids
 * rows without a sound. A cap set too high authors a colour outside sRGB, which the browser clips
 * with an algorithm that shifts hue — a colour nobody wrote. One set too low spends chroma the
 * gamut had room for; one present where nothing needs it is inert while it sits at or above the
 * request, and cuts chroma the day the request grows past it. This file rebuilds both tables from
 * the live palettes and reports every difference, and `npm run themes:audit` runs it in its
 * pre-flight, before the report.
 *
 * THE RULE BOTH TABLES FOLLOW. For each palette and each capped expression, the request is the
 * expression's own clamp evaluated at that palette's dark chroma, without the entry, and the
 * ceiling is the largest in-gamut chroma at the expression's lightness and hue: the hue after the
 * vibrant torsion, or the aurora's brand hue and the fan either side of it. A request past its
 * ceiling needs an entry, and the entry is the ceiling TRUNCATED to three decimals,
 * floor(ceiling * 1000) / 1000, never rounded, because rounding up lands a cap back outside the
 * gamut. A request inside its ceiling needs no entry, and one that is there anyway is reported as
 * well. The vibrant floor is held to the same ceilings, because `clamp()` returns its MIN whenever
 * MIN exceeds MAX: a floor past a ceiling is out of gamut by itself, and no cap under it takes
 * effect. It is held to the whole hue circle too, since a primary too grey to set its own chroma
 * receives the floor at whatever hue it carries.
 *
 * THE CEILING IS `maxChroma` FROM `color.mjs`, the function the tables were cut with, and it is
 * TOLERANT: it counts a gamma-encoded channel as inside sRGB up to 1e-4 past [0, 1], which is
 * 0.0255 of one 8-bit code value. An entry can therefore sit that hair outside strict sRGB. A
 * strict ceiling here would truncate a few entries one step lower and fail tables that are exact
 * on the definition they were cut to.
 *
 * THE LITERALS ARE READ, NOT RESTATED. Each expression's lightness, floor, factor and shared cap,
 * the torsion, the fan and every entry are parsed out of the two files on each run, so an edited
 * stop re-derives the expected table instead of being checked against a stale copy. The patterns
 * are narrow on purpose. A shape this file cannot read is reported as a problem, never skipped, so
 * a refactor of either stylesheet has to update this file in the same change.
 *
 * Each palette's dark `--primary` comes from the generator. `themes.css` is the generator's
 * output, and the audit's first pre-flight checks the base blocks in `app.css` against the
 * generator's solved base. The base palette has no `[data-theme]` block of its own, so its entries
 * have to answer to a root with no `data-theme` at all as well as to its id, as in
 * `:root:is(:not([data-theme]), [data-theme="parallax"])`.
 */
import { readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { THEMES, buildTheme } from "./themes.mjs";
import { hexToOklch, maxChroma } from "./color.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** How the base palette is reached without its id: a root that carries no `data-theme`. */
const BARE_ROOT = ":not([data-theme])";

/** The dark aurora fields, by the index of the ceiling variable each one reads. */
const AURORA_FIELDS = [1, 2, 3];
const AURORA_CEIL = "--backdrop-aur-ceil-";

// ---------------------------------------------------------------------------------------
// Reading the stylesheets
// ---------------------------------------------------------------------------------------

/*
 * The patterns are written the way the CSS reads. A space matches any run of whitespace,
 * including none, so a line break prettier adds or removes changes nothing. `{num}` captures a
 * number, `{sign}` a `+` or `-`, and `{hue}` the aurora's hue channel, which is either the bare
 * `h` or `calc(h ± var(--backdrop-aur-fan))` (its sign is captured; the bare `h` leaves it
 * undefined). `{alpha}` is a slash and whatever alpha follows it. Everything else is literal, and
 * the whole value has to match.
 */
const TOKENS = {
	" ": String.raw`\s*`,
	"{num}": String.raw`(-?(?:\d+(?:\.\d+)?|\.\d+))`,
	"{sign}": "([+-])",
	"{hue}": String.raw`(?:h|calc\(\s*h\s*([+-])\s*var\(\s*--backdrop-aur-fan\s*\)\s*\))`,
	"{alpha}": String.raw`\/[\s\S]*`,
};
const literal = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const shape = (...parts) => {
	const pieces = parts.join(" ").split(/(\{\w+\}| )/);
	const source = pieces.map((p) => (Object.hasOwn(TOKENS, p) ? TOKENS[p] : literal(p))).join("");
	return new RegExp(`^${source}$`);
};

/** The dark head of the vibrant chrome: lightness, floor, factor, shared cap, torsion sign. */
const HEAD = shape(
	"oklch( from var( --primary ) {num}",
	"clamp( {num} , calc( c * {num} ) , var( --vibrant-cap , {num} ) )",
	"calc( h {sign} var( --vibrant-torsion ) ) )",
);

/** One dark aurora field: lightness, clamp, ceiling index, fallback, fan sign. */
const FIELD = shape(
	"oklch( from var( --primary ) {num}",
	"min( clamp( {num} , calc( c * {num} ) , {num} ) , var( --backdrop-aur-ceil-{num} , {num} ) )",
	"{hue} {alpha} )",
);

/** The two shapes again, as a person reads them, for the messages that say one was not found. */
const HEAD_TEXT =
	"oklch(from var(--primary) L clamp(FLOOR, calc(c * K), var(--vibrant-cap, CAP)) calc(h ± var(--vibrant-torsion)))";
const FIELD_TEXT =
	"oklch(from var(--primary) L min(clamp(LO, calc(c * K), HI), var(--backdrop-aur-ceil-N, FALLBACK)) HUE / ALPHA), HUE being h or calc(h ± var(--backdrop-aur-fan))";

/**
 * Every rule of a stylesheet that holds declarations, at any depth, as its selector and its
 * declarations in source order (duplicates kept). Comments go first, and quoted strings are
 * stepped over, so neither can open or close a block.
 */
function readRules(css) {
	const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
	const rules = [];
	const open = [];
	let text = "";
	let quote = null;
	for (const char of source) {
		if (quote) {
			text += char;
			if (char === quote) quote = null;
		} else if (char === '"' || char === "'") {
			quote = char;
			text += char;
		} else if (char === "{") {
			open.push({ selector: text.trim().replace(/\s+/g, " "), body: "" });
			text = "";
		} else if (char === "}") {
			const rule = open.pop();
			if (!rule) throw new Error("a `}` closes a block that was never opened");
			rules.push({ selector: rule.selector, body: rule.body + text });
			text = "";
		} else if (char === ";") {
			if (open.length) open[open.length - 1].body += `${text};`;
			text = "";
		} else text += char;
	}
	if (open.length) throw new Error(`${open.length} block(s) are never closed`);
	return rules.map(({ selector, body }) => ({
		selector,
		decls: body
			.split(";")
			.map((d) => d.match(/^\s*(--[\w-]+|[a-z-]+)\s*:\s*([\s\S]*?)\s*$/i))
			.filter(Boolean)
			.map((m) => [m[1], m[2]]),
	}));
}

/** A selector list split at its top-level commas, so `:is(a, b)` stays one item. */
function selectorItems(selector) {
	const items = [];
	let depth = 0;
	let item = "";
	for (const char of selector) {
		if (char === "(" || char === "[") depth++;
		if (char === ")" || char === "]") depth--;
		if (char === "," && depth === 0) {
			items.push(item);
			item = "";
		} else item += char;
	}
	return [...items, item];
}

/**
 * The palettes a selector names, item by item: each `[data-theme="id"]`, and `:not([data-theme])`
 * as the bare root. `open` is set when an item names no palette at all, and so reaches every one.
 * `unread` is set when an item mentions `data-theme` in any other form, such as a negated id or a
 * bare presence test, because guessing which palettes that reaches is how a checker ends up
 * checking the wrong ones.
 */
function palettesNamed(selector) {
	const ids = [];
	let open = false;
	let unread = false;
	for (const item of selectorItems(selector)) {
		const before = ids.length;
		let rest = item.replace(/:not\(\s*\[\s*data-theme\s*\]\s*\)/g, () => {
			ids.push(BARE_ROOT);
			return " ";
		});
		if (/:not\((?:[^()]|\([^()]*\))*data-theme/.test(rest)) {
			unread = true;
			continue;
		}
		rest = rest.replace(/\[\s*data-theme\s*=\s*(["']?)([\w-]+)\1\s*\]/g, (_, _quote, id) => {
			ids.push(id);
			return " ";
		});
		if (/data-theme/.test(rest)) unread = true;
		else if (ids.length === before) open = true;
	}
	return { ids, open, unread };
}

const who = ({ palette, target }) =>
	target === BARE_ROOT ? `${palette} (on a root with no data-theme)` : palette;

const plainNumber = (value) =>
	/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim()) ? Number(value) : Number.NaN;
const isDark = (selector) => /\.dark\b/.test(selector);
const norm = (h) => ((h % 360) + 360) % 360;
const truncate3 = (c) => Math.floor(c * 1000) / 1000;

/** A stylesheet's rules, or null with the reason recorded when it cannot be read. */
function read(path, problems) {
	const rel = relative(ROOT, path);
	const file = rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel.split(sep).join("/") : path;
	try {
		return { file, rules: readRules(readFileSync(path, "utf8")) };
	} catch (error) {
		problems.push(`${file}: could not be read — ${error.code ?? error.message}`);
		return null;
	}
}

/** The declarations whose value matches `reads`, with the selector they sit under. */
function readersOf(rules, reads) {
	return rules.flatMap((rule) =>
		rule.decls
			.filter(([, value]) => reads.test(value))
			.map(([name, value]) => ({ name, value, selector: rule.selector })),
	);
}

/**
 * A per-palette setting with a default: the torsion, the fan. The default is the one declaration
 * on a rule that names no palette; an override is any declaration on a rule that names some.
 * Returns `of(target)`, or null when the default cannot be established.
 */
function setting(rules, file, name, known, problems) {
	let fallback = [];
	const override = new Map();
	for (const rule of rules)
		for (const [prop, value] of rule.decls) {
			if (prop !== name) continue;
			const v = plainNumber(value);
			const { ids, open, unread } = palettesNamed(rule.selector);
			if (Number.isNaN(v)) problems.push(`${file}: ${name} is \`${value}\`, not a plain number`);
			else if (unread)
				problems.push(
					`${file}: \`${rule.selector}\` sets ${name} in a form the checker cannot read`,
				);
			else if (open && ids.length)
				problems.push(
					`${file}: \`${rule.selector}\` sets ${name} as a default and an override at once`,
				);
			else if (open) fallback.push(v);
			else
				for (const id of ids) {
					if (!known.has(id))
						problems.push(`${file}: \`${rule.selector}\` sets ${name} for "${id}", not a palette`);
					else if (override.has(id) && override.get(id) !== v)
						problems.push(`${file}: ${id} ${name} is set twice (${override.get(id)}, ${v})`);
					else override.set(id, v);
				}
		}
	fallback = [...new Set(fallback)];
	if (fallback.length !== 1) {
		problems.push(
			`${file}: expected one default ${name} on a rule that names no palette, found ${fallback.length ? fallback.join(", ") : "none"} — update tools/themes/ceilings.mjs if the setting moved`,
		);
		return null;
	}
	return { of: (target) => override.get(target) ?? fallback[0] };
}

/**
 * The entries a table holds, as `variable|target` -> values. An entry on a rule that names no
 * palette, or one the generator does not have, is reported rather than kept.
 */
function holdings(rules, file, isEntry, known, problems) {
	const held = new Map();
	for (const rule of rules)
		for (const [name, value] of rule.decls) {
			if (!isEntry(name)) continue;
			const v = plainNumber(value);
			const { ids, open, unread } = palettesNamed(rule.selector);
			if (Number.isNaN(v)) problems.push(`${file}: ${name} is \`${value}\`, not a plain number`);
			else if (unread)
				problems.push(
					`${file}: \`${rule.selector}\` sets ${name} in a form the checker cannot read — name each palette as [data-theme="<id>"], and the base also as ${BARE_ROOT}`,
				);
			else if (open)
				problems.push(
					`${file}: \`${rule.selector}\` sets ${name} on a selector that names no palette, so it would cap every palette at once`,
				);
			else
				for (const id of ids) {
					if (!known.has(id)) {
						problems.push(`${file}: \`${rule.selector}\` sets ${name} for "${id}", not a palette`);
						continue;
					}
					const key = `${name}|${id}`;
					held.set(key, [...(held.get(key) ?? []), v]);
				}
		}
	return held;
}

/** One palette's entry against the table's rule, recorded as a row and, if wrong, a problem. */
function judge(out, { file, variable, target, palette, L, hue, asks, ceiling, held }) {
	const needs = asks > ceiling;
	const expected = needs ? truncate3(ceiling) : null;
	const found = held.get(`${variable}|${target}`) ?? [];
	const got = found.length ? found[found.length - 1] : null;
	out.rows.push({ file, variable, palette, target, L, hue, asks, ceiling, expected, found: got });

	const where = `${file} ${who({ palette, target })} ${variable}`;
	const why = `asks ${asks.toFixed(4)} at L ${L} h${hue.toFixed(1)}, ${needs ? "past" : "inside"} its sRGB ceiling ${ceiling.toFixed(5)}`;
	if (found.length > 1)
		out.problems.push(`${where}: set ${found.length} times (${found.join(", ")})`);
	if (expected === null && got !== null)
		out.problems.push(`${where}: found ${got}, expected none — ${why}`);
	else if (expected !== null && got === null)
		out.problems.push(`${where}: missing, expected ${expected} — ${why}`);
	else if (expected !== null && Math.abs(got - expected) > 1e-9)
		out.problems.push(`${where}: found ${got}, expected ${expected} — ${why}`);
}

// ---------------------------------------------------------------------------------------
// The palettes
// ---------------------------------------------------------------------------------------

let palettes = null;

/**
 * Every place a table can be keyed, with the dark primary's chroma and hue measured there: one
 * per palette id, plus the bare root, which is the base palette again.
 */
function targets() {
	palettes ??= THEMES.flatMap((spec) => {
		const [, C, h] = hexToOklch(buildTheme(spec).dark.primary[0]);
		const own = { target: spec.id, palette: spec.id, C, h };
		return spec.builtin ? [own, { ...own, target: BARE_ROOT }] : [own];
	});
	return palettes;
}

/** The narrowest sRGB ceiling on the hue circle at L: every 0.5deg, then refined to 0.005deg. */
function narrowest(L) {
	let best = { h: 0, c: Infinity };
	const scan = (from, to, step) => {
		for (let h = from; h <= to; h += step) {
			const c = maxChroma(L, norm(h));
			if (c < best.c) best = { h: norm(h), c };
		}
	};
	scan(0, 359.5, 0.5);
	scan(best.h - 0.5, best.h + 0.5, 0.005);
	return best;
}

// ---------------------------------------------------------------------------------------
// The two tables
// ---------------------------------------------------------------------------------------

function checkVibrant(path, out) {
	const css = read(path, out.problems);
	if (!css) return;
	const { file, rules } = css;
	const all = targets();
	const known = new Set(all.map((t) => t.target));

	const heads = readersOf(rules, /var\(\s*--vibrant-cap\s*[,)]/);
	if (heads.length !== 1) {
		out.problems.push(
			`${file}: expected one declaration reading var(--vibrant-cap, …), the dark head, found ${heads.length} — update tools/themes/ceilings.mjs to the stylesheet's new shape`,
		);
		return;
	}
	const [head] = heads;
	const m = head.value.match(HEAD);
	if (!m) {
		out.problems.push(
			`${file}: the dark head \`${head.name}\` no longer reads as ${HEAD_TEXT} — update tools/themes/ceilings.mjs to its new shape`,
		);
		return;
	}
	if (!isDark(head.selector))
		out.problems.push(
			`${file}: the head reading --vibrant-cap sits under \`${head.selector}\`, which is not a .dark rule, and the caps are measured against the dark --primary`,
		);
	const [L, floor, k, shared] = m.slice(1, 5).map(Number);
	const sign = m[5] === "-" ? -1 : 1;
	const torsion = setting(rules, file, "--vibrant-torsion", known, out.problems);
	if (!torsion) return;
	const held = holdings(rules, file, (name) => name === "--vibrant-cap", known, out.problems);

	for (const t of all) {
		const hue = norm(t.h + sign * torsion.of(t.target));
		const ceiling = maxChroma(L, hue);
		// CSS `clamp(MIN, VAL, MAX)` is max(MIN, min(VAL, MAX)): the MIN wins a crossing.
		const asks = Math.max(floor, Math.min(t.C * k, shared));
		judge(out, { file, variable: "--vibrant-cap", ...t, L, hue, asks, ceiling, held });
		if (floor > ceiling)
			out.problems.push(
				`${file} ${who(t)}: the dark head's floor ${floor} is past its sRGB ceiling ${ceiling.toFixed(5)} at L ${L} h${hue.toFixed(1)}, so the floor itself is out of gamut and no cap can lower it`,
			);
		for (const cap of held.get(`--vibrant-cap|${t.target}`) ?? [])
			if (cap < floor)
				out.problems.push(
					`${file} ${who(t)} --vibrant-cap: ${cap} is under the floor ${floor}, and clamp() returns its MIN, so the cap does nothing`,
				);
	}

	// The floor is what a primary too grey to set its own chroma receives, at whatever hue it
	// carries, so it has to hold on the whole circle and not only at the palettes' hues.
	const tightest = narrowest(L);
	if (floor > tightest.c)
		out.problems.push(
			`${file}: the dark head's floor ${floor} is past the narrowest sRGB ceiling on the hue circle at L ${L}, ${tightest.c.toFixed(5)} at h${tightest.h.toFixed(1)}`,
		);
}

function checkAurora(path, out) {
	const css = read(path, out.problems);
	if (!css) return;
	const { file, rules } = css;
	const all = targets();
	const known = new Set(all.map((t) => t.target));

	const fields = new Map();
	const unparsed = new Set();
	for (const reader of readersOf(rules, /var\(\s*--backdrop-aur-ceil-/)) {
		const m = reader.value.match(FIELD);
		if (!m) {
			out.problems.push(
				`${file}: \`${reader.name}\` reads a --backdrop-aur-ceil-* but not as ${FIELD_TEXT} — update tools/themes/ceilings.mjs to its new shape`,
			);
			for (const [, n] of reader.value.matchAll(/var\(\s*--backdrop-aur-ceil-(\d+)/g))
				unparsed.add(Number(n));
			continue;
		}
		if (!isDark(reader.selector))
			out.problems.push(
				`${file}: \`${reader.name}\` reads its ceiling under \`${reader.selector}\`, which is not a .dark rule, and the ceilings are measured against the dark --primary`,
			);
		const [L, lo, k, hi, n, fallback] = m.slice(1, 7).map(Number);
		const offset = m[7] === undefined ? 0 : m[7] === "-" ? -1 : 1;
		if (fields.has(n)) out.problems.push(`${file}: two dark aurora fields read ${AURORA_CEIL}${n}`);
		else fields.set(n, { L, lo, k, hi, fallback, offset });
	}
	const indices = [...fields.keys()].sort((a, b) => a - b);
	if (indices.join() !== AURORA_FIELDS.join()) {
		out.problems.push(
			`${file}: expected the dark aurora fields reading ${AURORA_CEIL}${AURORA_FIELDS.join(", -")}, found ${indices.length ? indices.map((n) => `-${n}`).join(", ") : "none"} — update tools/themes/ceilings.mjs to the stylesheet's new shape`,
		);
		if (!indices.length) return;
	}
	const fan = setting(rules, file, "--backdrop-aur-fan", known, out.problems);
	if (!fan) return;
	const held = holdings(rules, file, (name) => name.startsWith(AURORA_CEIL), known, out.problems);
	for (const key of held.keys()) {
		const [variable, target] = key.split("|");
		const n = Number(variable.slice(AURORA_CEIL.length));
		if (!fields.has(n) && !unparsed.has(n))
			out.problems.push(`${file} ${target} ${variable}: set, but no dark aurora field reads it`);
	}

	for (const [n, f] of fields)
		for (const t of all) {
			const variable = `${AURORA_CEIL}${n}`;
			const hue = norm(t.h + f.offset * fan.of(t.target));
			// The ceiling sits in a `min()` OUTSIDE the clamp, so the request is the whole clamp,
			// floor included, and the fallback is the ceiling a palette with no entry gets.
			const asks = Math.min(Math.max(f.lo, Math.min(t.C * f.k, f.hi)), f.fallback);
			const ceiling = maxChroma(f.L, hue);
			judge(out, { file, variable, ...t, L: f.L, hue, asks, ceiling, held });
		}
}

/**
 * Check both tables against the palettes.
 *
 * @param {{ vibrant?: string, backdrops?: string }} [paths] the two stylesheets; the repo's own
 *   by default, and another copy for a test.
 * @returns {{ rows: object[], problems: string[] }} `rows` holds one entry per palette and capped
 *   expression — `{ file, variable, palette, target, L, hue, asks, ceiling, expected, found }`,
 *   with `expected` and `found` null for "no entry" — and `problems` every difference, in words.
 */
export function checkCeilings({
	vibrant = resolve(ROOT, "src/vibrant.css"),
	backdrops = resolve(ROOT, "src/backdrops.css"),
} = {}) {
	const out = { rows: [], problems: [] };
	checkVibrant(resolve(vibrant), out);
	checkAurora(resolve(backdrops), out);
	return out;
}

// ---------------------------------------------------------------------------------------
// Run directly: a short report, and a non-zero exit on any problem
// ---------------------------------------------------------------------------------------

const invokedDirectly = (() => {
	try {
		return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
	} catch {
		return false;
	}
})();

if (invokedDirectly) {
	const { rows, problems } = checkCeilings();
	console.log(`sRGB ceiling tables, against the dark --primary of all ${THEMES.length} palettes`);
	for (const file of [...new Set(rows.map((r) => r.file))]) {
		const own = rows.filter((r) => r.file === file && r.target !== BARE_ROOT);
		const lightness = [...new Set(own.map((r) => r.L))].join(" / ");
		const needed = own.filter((r) => r.expected !== null);
		const set = own.filter((r) => r.found !== null);
		const on = new Set(needed.map((r) => r.palette)).size;
		console.log(
			`  ${file.padEnd(18)} L ${lightness}: ${needed.length} entries needed on ${on} palettes, ${set.length} set`,
		);
	}
	if (problems.length) {
		console.error(`\n${problems.length} problem(s):\n${problems.map((p) => `  ${p}`).join("\n")}`);
		process.exitCode = 1;
	} else console.log("Both tables match the palettes.");
}
