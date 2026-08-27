/**
 * The audit report — and the gate.
 *
 * Every generated theme is measured against the SAME rows as the anchor palette itself, and each row is
 * judged twice: against the WCAG floor, and against the anchor palette's own number for that pairing.
 * A row below the floor but at or above the anchor palette is an inherited property of the design; a row
 * below the anchor palette is a regression the generator introduced. Every one of those must be entered
 * in the ACCEPTED_REGRESSIONS ledger below with its rationale — an unexplained regression, an
 * accepted one that has degraded further, or a ledger entry no run reproduces any more each
 * exit non-zero, so drift fails CI instead of scrolling past in the report.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { THEMES, buildTheme, audit } from "./themes.mjs";

/*
 * The base: the theme app.css's `:root` and `.dark` hold, and the yardstick every other theme is
 * measured beside.
 *
 * It used to be the anchor table in `base.mjs`. That table is now
 * an input to the build rather than an output of it — the values `parallax` nudges away from —
 * so this file no longer imports it, and the yardstick is the solved base instead. The change is
 * not cosmetic: the nudge moved several of the base's own numbers UP, which raised the bar four
 * themes are judged against and cost them a ledger entry apiece. The ledger says which.
 */
const BASE_SPEC = THEMES.find((t) => t.builtin);
const BASE = buildTheme(BASE_SPEC);

// ---------------------------------------------------------------------------------------
// Pre-flight: the solved base really is app.css
// ---------------------------------------------------------------------------------------

/*
 * app.css's `:root` and `.dark` blocks hold the base palette, and the base is `parallax` — the
 * one theme that emits no `[data-theme]` block because it is already written there. This check
 * is what keeps the two in step: an app.css edit that the generator did not produce, or a
 * generator change that nobody copied into app.css, would silently skew the Themes-page grid,
 * the picker swatches and every baseline number below.
 *
 * It compares against the SOLVED palette rather than a hand copy, which is the difference from
 * how this used to read: when the base was the anchor table its tokens existed only as a
 * transcription in base.mjs, so the table was the thing to keep honest. `parallax` is derived, so the
 * derivation is the authority and app.css is what has to match it.
 *
 * The comparison set is exactly the keys of the solved tables — app.css also carries non-palette
 * tokens (`--radius`, `--label-tracking`, the `--control-h-*` ramp and the table density
 * variables) that no theme restates — so the check reads one way: every solved token must
 * appear in its block with the same value.
 */
{
	const css = readFileSync(
		resolve(dirname(fileURLToPath(import.meta.url)), "../../src/app.css"),
		"utf8",
	).replace(/\/\*[\s\S]*?\*\//g, ""); // comments hold no declarations, and may hold braces
	// Anchored with a literal `.dark {` so the `.dark [data-slot=…]` rules further down the
	// file cannot match; the token blocks contain no nested braces once comments are gone.
	const block = (name, re) => {
		const m = css.match(re);
		if (!m) {
			console.error(`app.css sync: could not find the \`${name}\` block in src/app.css`);
			process.exit(1);
		}
		const tokens = {};
		for (const d of m[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g))
			tokens[d[1]] = d[2].trim().toLowerCase();
		return tokens;
	};
	const drift = [];
	for (const [label, table, tokens] of [
		[":root", BASE.light, block(":root", /^:root \{([^}]*)\}/m)],
		[".dark", BASE.dark, block(".dark", /^\.dark \{([^}]*)\}/m)],
	])
		for (const [name, [hex]] of Object.entries(table)) {
			const got = tokens[name];
			if (got !== hex.toLowerCase())
				drift.push(
					`  ${label} --${name}: solved ${hex.toLowerCase()}, app.css ${got ?? "(missing)"}`,
				);
		}
	if (drift.length) {
		console.error(
			`src/app.css has drifted from the solved base palette — rerun \`npm run themes:generate\` and copy the ${BASE_SPEC.name} values into its \`:root\` and \`.dark\` blocks:\n${drift.join("\n")}`,
		);
		process.exit(1);
	}
}

// ---------------------------------------------------------------------------------------
// The accepted regressions
// ---------------------------------------------------------------------------------------

/*
 * The ledger of trade-offs. Each entry is one pairing that measures below BOTH the WCAG
 * floor and the anchor palette's own value, examined and kept deliberately. `measured` is the ratio at
 * acceptance time — for a status pair it is the raw-luminance ratio, the first of the three
 * channels the pair check weighs — and `baseline` is the base's number for the same
 * pairing, recorded so an entry states how far the trade-off reaches without re-running
 * history. Pairs carry mode 'light' because the pair check measures the light hexes.
 *
 * An entry pardons exactly what it recorded: the same pairing measuring WORSE than
 * `measured` is new damage and fails the run, and an entry no run reproduces any more is
 * reported as stale and fails it too, so the ledger cannot rot in either direction.
 */
const acc = (theme, mode, pairing, measured, baseline, why) => ({
	theme,
	mode,
	pairing,
	measured,
	baseline,
	why,
});

const WHY_INFO =
	"a legible solid info badge costs contrast on a white card — one cause across all 11 themes, see the group note";
const WHY_PAIR =
	"success/info end a step closer than the anchor palette on all three channels; dHue ≥ 50° and the tone ladder still separate them";
const WHY_CHART2 =
	"chart-2 is the brand's own 300-tint, and a cyan-leaning brand tints lighter than the anchor palette blue; repainting one series would break the ramp";
const WHY_NUDGE =
	"a pairing the anchor palette itself fails, jittered a hair further by the nudge — see the group note";
const WHY_CRIMSON =
	"the dark-lifted red brand still lands 0.30 under the anchor palette blue on the dark card; lifting further reads pink, not crimson";
const WHY_CRIMSON_TEXT =
	"the one hand-placed dark brand the AA text solver does not reach: at h8 C0.145 the window where a WHITE label still works closes before 4.5:1 does, and the solver's own next passing lightness (L 0.76) is a dusty pink carrying dark type. `text-primary` on this theme in dark mode is the link variant and the today marker only — the fill-and-label pairing every other use of the token relies on measures 4.62:1";

const ACCEPTED_REGRESSIONS = [
	/*
	 * The whole group below shares one cause, and it is NOT the anchor. `STATUS.info.L` is only
	 * where `placeLight` starts; the solver then walks away from it until the colour can carry a
	 * foreground at `AA`. For a cyan the foreground that wins is the dark ink, and dark ink wants
	 * the colour LIGHTER — so the solver walks up, landing near L 0.724 against an anchor of
	 * 0.704, lighter than #39afd1 and therefore 0.11–0.20:1 under it on a white card. Every theme
	 * inherits the same walk, which is why there are eleven identical entries.
	 *
	 * SO THERE IS NO ONE-LINE FIX, and an earlier version of this note claiming otherwise was
	 * wrong: dropping the anchor to 0.654 and re-running produces a byte-identical report,
	 * because the anchor never bound in the first place.
	 *
	 * The lever that would actually move it is the foreground rule. the anchor palette ships white on
	 * #39afd1 at 2.55:1 — a solid badge whose own type barely reads — where this generator
	 * refuses to go under 4.55:1, and for a cyan the only way to hold that is to start light and
	 * take the dark ink. Darkening info therefore means either accepting the anchor palette's unreadable
	 * solid badge or re-cutting info's hue and chroma so a darker cyan still carries dark ink.
	 * That is palette design, and the palette owner's call, not this audit's.
	 *
	 * Worth keeping in view: the floor is 3.1 and the anchor palette's own 2.55 misses it too, so this
	 * group is "worse than a reference that already fails", not "the only failure here".
	 */
	acc("graphite", "light", "info on card", 2.38, 2.55, WHY_INFO),
	acc("sepia", "light", "info on card", 2.38, 2.55, WHY_INFO),
	acc("nordic", "light", "info on card", 2.4, 2.55, WHY_INFO),
	acc("harbor", "light", "info on card", 2.35, 2.55, WHY_INFO),
	acc("evergreen", "light", "info on card", 2.35, 2.55, WHY_INFO),
	acc("sandstone", "light", "info on card", 2.38, 2.55, WHY_INFO),
	acc("ember", "light", "info on card", 2.41, 2.55, WHY_INFO),
	acc("crimson", "light", "info on card", 2.41, 2.55, WHY_INFO),
	// `orchid` no longer needs an entry here: its 2.44 sits at or above the base's own number for
	// the same pairing, now that the base is the nudged palette rather than the original.
	acc("amethyst", "light", "info on card", 2.41, 2.55, WHY_INFO),
	acc("indigo", "light", "info on card", 2.38, 2.55, WHY_INFO),

	/*
	 * These themes resolve success/info a step closer than the base's pair on every channel at
	 * once, which the pair check refuses to wave through on balance alone.
	 *
	 * The last four joined the group when the base became the nudged palette, and the reason is
	 * arithmetic rather than anything about them: the nudge happened to move all three of the
	 * base's own channels UP — lum 1.36 → 1.43, deutan 0.175 → 0.191, protan 0.187 → 0.205 — so
	 * the bar they are measured against rose while their own numbers did not move at all. They
	 * measure what they always measured; the yardstick is what changed. Their entries record the
	 * new baseline so the next re-cut is still checked against something real.
	 */
	acc("sepia", "light", "success/info", 1.07, 1.36, WHY_PAIR),
	acc("nordic", "light", "success/info", 1.07, 1.36, WHY_PAIR),
	acc("sandstone", "light", "success/info", 1.07, 1.36, WHY_PAIR),
	acc("ember", "light", "success/info", 1.08, 1.36, WHY_PAIR),
	acc("orchid", "light", "success/info", 1.09, 1.36, WHY_PAIR),
	acc("graphite", "light", "success/info", 1.07, 1.43, WHY_PAIR),
	acc("crimson", "light", "success/info", 1.08, 1.43, WHY_PAIR),
	acc("amethyst", "light", "success/info", 1.08, 1.43, WHY_PAIR),
	acc("indigo", "light", "success/info", 1.07, 1.43, WHY_PAIR),

	// `harbor` and `evergreen` are out for the same reason as `orchid` above: the base moved under
	// them by a hair and their chart-2 is no longer below it.

	acc("crimson", "dark", "primary on card", 3.02, 3.32, WHY_CRIMSON),
	/*
	 * The same colour, judged as type. Eight light themes and Crimson's dark brand were the nine
	 * pairs that failed when `--primary` was solved as a fill only; the solver now clears the AA
	 * text floor against the binding ground in both modes, and this is the single pair it cannot
	 * reach, for the reason its own spec comment already records.
	 */
	acc("crimson", "dark", "primary as text on card", 3.02, 3.14, WHY_CRIMSON_TEXT),
	acc("crimson", "dark", "primary as text on background", 3.32, 3.57, WHY_CRIMSON_TEXT),

	/*
	 * `parallax` had thirteen entries here and no longer needs one. It is the base now: app.css's
	 * `:root` and `.dark` are its values, so it is reported in the base section above rather than
	 * pardoned as a theme, exactly as the former base was while it held that seat. The reasoning
	 * those entries carried still holds and is worth keeping, because it is the reason the nudge is
	 * safe to ship at all: parallax is not solved from scratch, it is the anchor palette displaced
	 * by up to 2%, so
	 * a random displacement lands on the low side of roughly half the pairings it touches, and any
	 * of those the anchors already failed reappears. Every one of them sat against an anchor value
	 * itself under the floor — 1.87 against 4.5, 1.76 against 3, 2.55 against 3.1. It inherits the
	 * original's failures and jitters around them; it introduces none the original did not have.
	 *
	 * A tolerance would have been the tidier fix and does not work: 2% of lightness is 8% of a
	 * contrast ratio down at 1.8:1, so the band that would pardon those is far wider than the band
	 * the palette actually moved, and it would pardon real regressions with it.
	 */
];

// ---------------------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------------------

const base = audit(BASE);
const baseRow = new Map(base.rows.map((r) => [`${r.scope}|${r.what}`, r.value]));
const basePair = new Map(base.pairs.map((p) => [`${p.a}|${p.b}`, p]));

const only = process.argv[2];
// A mistyped id must not skip every theme and report a green run that audited nothing.
if (only && only !== "all" && !THEMES.some((t) => t.id === only)) {
	console.error(`unknown theme id '${only}' — one of: all, ${THEMES.map((t) => t.id).join(", ")}`);
	process.exit(1);
}
let accepted = 0,
	unexplained = 0,
	belowFloor = 0;
const consulted = new Set();
const auditedIds = new Set();

/*
 * A regression is pardoned only while it matches its ledger entry: same theme, mode and
 * pairing, and measured no worse than the entry recorded (a 0.02 epsilon absorbs the
 * two-decimal rounding the entries were transcribed at).
 */
function pardoned(theme, mode, pairing, value) {
	const e = ACCEPTED_REGRESSIONS.find(
		(e) => e.theme === theme && e.mode === mode && e.pairing === pairing,
	);
	if (e) {
		consulted.add(e);
		if (value >= e.measured - 0.02) {
			accepted++;
			return true;
		}
	}
	unexplained++;
	return false;
}

function line(tag, scope, what, value, floor, ref) {
	const vs = ref === undefined ? "" : `   base ${ref.toFixed(2)}`;
	console.log(
		`   ${tag} ${scope.padEnd(5)} ${what.padEnd(38)} ${value.toFixed(2)}:1 (floor ${floor})${vs}`,
	);
}

if (!only || only === "all" || only === BASE_SPEC.id) {
	console.log("=".repeat(96));
	console.log(`${BASE_SPEC.name.toUpperCase()} — the base, measured`);
	console.log("=".repeat(96));
	for (const r of base.rows.filter((r) => !r.pass))
		line("base ", r.scope, r.what, r.value, r.floor);
	console.log("status pairs:");
	for (const p of base.pairs)
		console.log(
			`        ${p.a.padEnd(12)}/${p.b.padEnd(12)} dHue ${p.dh.toFixed(0).padStart(3)}°  lum ${p.lum.toFixed(2)}  deutan ${p.deutan.toFixed(3)}  protan ${p.protan.toFixed(3)}`,
		);
}

for (const spec of THEMES) {
	if (spec.builtin) continue;
	if (only && only !== "all" && spec.id !== only) continue;
	auditedIds.add(spec.id);
	const t = buildTheme(spec);
	const a = audit(t);

	console.log("\n" + "=".repeat(96));
	console.log(
		`${spec.name.toUpperCase()}  (${spec.id})  neutral h${spec.nh} c×${spec.nc}  brand h${spec.brandH}`,
	);
	console.log("=".repeat(96));

	let worse = [],
		under = [];
	for (const r of a.rows) {
		const ref = baseRow.get(`${r.scope}|${r.what}`);
		// Only a row that is BOTH below its floor and below the anchor palette is a regression. A row
		// comfortably above the floor that measures 15.21 where the anchor palette measures 15.28 is noise.
		if (!r.pass && ref !== undefined && r.value < ref - 0.05) worse.push([r, ref]);
		else if (!r.pass) under.push([r, ref]);
	}
	console.log(
		`${a.rows.length - under.length - worse.length}/${a.rows.length} rows at or above both the floor and the anchor palette`,
	);
	for (const [r, ref] of worse)
		line(
			pardoned(spec.id, r.scope, r.what, r.value) ? "noted" : "WORSE",
			r.scope,
			r.what,
			r.value,
			r.floor,
			ref,
		);
	for (const [r, ref] of under) {
		belowFloor++;
		line("under", r.scope, r.what, r.value, r.floor, ref);
	}

	console.log("brand vs status:");
	for (const s of a.sep) {
		// No sep failure is on the ledger today; the lookup keys on `brand/<status>` and the
		// entry's `measured` would hold the ΔEok, should one ever have to be recorded.
		const tag = s.ok
			? "ok   "
			: pardoned(spec.id, "light", `brand/${s.key}`, s.dE)
				? "noted"
				: "FAIL ";
		console.log(
			`   ${tag} ${s.key.padEnd(12)} dHue ${s.dh.toFixed(0).padStart(3)}°  dL ${s.dL.toFixed(3)}  dEok ${s.dE.toFixed(3)}`,
		);
	}

	console.log("status pairs vs the base:");
	for (const p of a.pairs) {
		const b = basePair.get(`${p.a}|${p.b}`);
		// Three channels separate a pair: raw luminance, and the two dichromatic simulations.
		// A pair is only a problem when it is weaker than the anchor palette's on ALL of them — being
		// weaker on one while stronger on another is a different balance, not a worse one.
		const ok = p.lum >= b.lum * 0.8 || p.deutan >= b.deutan * 0.9 || p.protan >= b.protan * 0.9;
		const tag = ok
			? "ok   "
			: pardoned(spec.id, "light", `${p.a}/${p.b}`, p.lum)
				? "noted"
				: "WORSE";
		console.log(
			`   ${tag} ${p.a.padEnd(12)}/${p.b.padEnd(12)} dHue ${p.dh.toFixed(0).padStart(3)}°  lum ${p.lum.toFixed(2)}/${b.lum.toFixed(2)}  deutan ${p.deutan.toFixed(3)}/${b.deutan.toFixed(3)}  protan ${p.protan.toFixed(3)}/${b.protan.toFixed(3)}`,
		);
	}

	if (process.env.SWATCH) {
		console.log(
			"light:",
			[
				"background",
				"card",
				"foreground",
				"muted-foreground",
				"primary",
				"destructive",
				"success",
				"warning",
				"info",
				"border",
				"input",
			]
				.map((k) => `${k}=${t.light[k][0]}`)
				.join(" "),
		);
		console.log(
			"dark: ",
			[
				"background",
				"card",
				"muted-foreground",
				"primary",
				"destructive",
				"success",
				"warning",
				"info",
				"border",
			]
				.map((k) => `${k}=${t.dark[k][0]}`)
				.join(" "),
		);
	}
}

/*
 * Three counts, and the split is the whole point of auditing against the anchor palette rather than
 * against the floor alone. `unexplained` is what to act on, and what fails the run;
 * `accepted` is the ledger above holding; `belowFloor` is the shape of the design — and
 * the anchor palette's own run, printed above, carries 24 of those.
 */
console.log(
	`\n${unexplained} unexplained pairings below BOTH the WCAG floor and the base's own value for it` +
		`\n${accepted} more below both, accepted on the ledger` +
		`\n${belowFloor} below the floor but no worse than the base`,
);

// A ledger entry no audited theme reproduces is as much drift as a new regression — the
// trade-off it recorded no longer exists, so the entry has to go. Scoped to the themes this
// run actually audited, so a single-theme run cannot false-flag the other themes' entries.
const stale = ACCEPTED_REGRESSIONS.filter((e) => auditedIds.has(e.theme) && !consulted.has(e));
for (const e of stale)
	console.error(
		`stale accepted entry — not reproduced, remove it: ${e.theme} ${e.mode} '${e.pairing}'`,
	);

if (unexplained || stale.length) process.exitCode = 1;
