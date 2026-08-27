/**
 * Emits the two generated files:
 *
 *   src/themes.css               the `[data-theme]` blocks
 *   src/lib/themes/palettes.ts   the same values as data, for the selector and the Themes page
 *
 * Run with `node tools/themes/generate.mjs`. Both outputs are derived from `themes.mjs`, so a
 * palette is edited there and never in the output — which is why both files carry a header
 * saying so.
 *
 * WHY TWO OUTPUTS AND NOT ONE. The swatches in the picker could have been read from the CSS
 * instead, by rendering a preview element carrying `data-theme`. That needs the theme blocks
 * to match a plain element as well as `:root`, which drops their specificity to a tie with
 * `.dark` and puts the light/dark outcome at the mercy of source order. Emitting the values
 * twice from one source is the cheaper correctness.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { THEMES, buildTheme } from "./themes.mjs";
import { hexToOklch } from "./color.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** The five colours the picker shows as a strip, in the order they appear. */
const SWATCH = ["primary", "success", "warning", "destructive", "info"];

/**
 * The nine chrome tokens, and the only ones the mode overrides restate.
 *
 * THEY ARE NOT THE SIDEBAR'S. The shadcn NAME is `--sidebar-*` and unrenameable, but the ROLE is
 * the navbar's — every one of the nine dresses app chrome, not page content. A navbar is as
 * readily horizontal as vertical, which is why the same nine dress the page header, and why each
 * block below carries a second selector for it.
 *
 * They are a closed set on purpose: the mode attributes exist to let a chrome surface wear the
 * mode the page is NOT wearing, and anything outside this list belongs to the page. Restating,
 * say, `--background` under the same selector would drag the whole document across with it.
 *
 * All nine, even though a given theme may hold four of them equal in both modes (Parallax's
 * `--sidebar-primary` is `primary` either way). The block is written from the two solved token
 * sets, not from a diff of them, so a later palette that DOES move one of the four is carried
 * without anyone remembering to widen the list.
 */
const SIDEBAR_TOKENS = [
	"sidebar",
	"sidebar-foreground",
	"sidebar-primary",
	"sidebar-primary-foreground",
	"sidebar-accent",
	"sidebar-accent-foreground",
	"sidebar-border",
	"sidebar-outline",
	"sidebar-ring",
];

const pick = (tokens, keys) => Object.fromEntries(keys.map((k) => [k, tokens[k]]));

/*
 * `spec` LAST in the spread: `buildTheme` carries a `spec` of its own, and it is the entry from
 * `THEMES` — the one holding `builtin` — that has to win.
 *
 * Every theme is solved, including the base. `builtin` used to mean two things at once: "take
 * these tokens from the hand-written anchor tables" and "emit no block, because they already
 * live in app.css". Now that the base is `parallax`, which IS derived, only the second meaning
 * survives — the flag says where the tokens are written, not where they come from.
 */
const built = THEMES.map((spec) => ({ ...buildTheme(spec), spec }));

// ---------------------------------------------------------------------------------------
// src/themes.css
// ---------------------------------------------------------------------------------------

const CSS_HEADER = `/**
 * The predefined colour themes.
 *
 * GENERATED — edit \`tools/themes/themes.mjs\` and re-run \`node tools/themes/generate.mjs\`.
 * Every value below is derived; none of them was picked by hand in this file.
 *
 * HOW A THEME IS BUILT. Each one restates the whole token set, but only two things actually
 * vary: the hue and the chroma. The LIGHTNESS LADDER is the anchor palette's own, measured out of
 * \`app.css\` in OKLCH and reused verbatim —
 *
 *   light  n100 .987  n200 .959  n300 .937  n400 .894  n500 .808  n600 .733  n700 .608
 *          n800 .426  n900 .359  ink .266
 *   dark   d700 .344  d800 .298  d900 .282, on the same ink as the page
 *
 * — and so is the mapping from those steps onto the tokens (\`--border\` is n200, \`--input\` is
 * n400, the dark card is d800, the sidebar's border is flush with its panel, and so on:
 * docs/THEME.md §2). That is what makes a dozen different palettes feel like one family —
 * every surface sits at the same lightness, only the cast changes.
 *
 * WHAT IS SOLVED RATHER THAN INHERITED, and why in each case:
 *
 *   --muted-foreground        the anchor value measures 2.37:1 on a white card.
 *                             Here it is the lightness that
 *                             clears 4.5:1 against every ground it sits on.
 *   --sidebar-foreground      same value, same reason — the anchor measures 3.82:1.
 *   the five *-foreground     a naive contrast pick puts white
 *                             on the success green at 1.87:1 and on the info cyan at 2.55:1.
 *                             Each is chosen
 *                             here by measuring both candidates — white, and the theme's own
 *                             near-black — and taking the better.
 *   the dark *-subtle grounds a classic 45% mix of the colour into black lets a bright
 *                             status ground eat the room its ink needs. The mix is 28% here,
 *                             which lands every lifted status's wash near the dark-700 line.
 *   *-subtle-foreground       the ink on those washes — a walked emphasis ink,
 *                             never the raw status colour
 *                             (1.5–4.4:1, the worst rows this audit ever measured). Solved by
 *                             \`subtleInk\`: walked from the status colour until the 80%-opacity
 *                             composite — the alert description's form — clears 4.5:1, with an
 *                             APCA Lc 68 floor in dark. Full-strength lands at 5.9–7.6:1.
 *   --scrim                   a new token. The sheet backdrop was the literal #12263F, so it
 *                             would have stayed the anchor palette navy under every other theme.
 *   --sidebar-outline         a new token, and the counterpart \`--sidebar-border\` cannot be.
 *                             That one is the anchor palette's \`navbar-*-border-color\`, which in DARK is
 *                             set flush with the panel on purpose — the rail has no visible
 *                             edge there. Anything drawn INSIDE the panel (the identity
 *                             buttons, the floating variant's ring) still needs a hairline that
 *                             reads, so it gets its own: n300 against a white panel, d700
 *                             against a d800 one. One step off the surface either way.
 *
 * HOW A COLLISION IS RESOLVED. The four status hues are fixed for every theme — Material 3
 * pins its error palette independently of the brand seed for the same reason — and only move
 * when a brand lands on one, and then only inside a band where the colour still reads as the
 * status it names. Where a hue has nowhere to go (a green brand beside a green success), the
 * separation is carried by lightness instead, which is what Carbon does with its Blue 60 and
 * Blue 70. Every theme's numbers are checked by \`node tools/themes/audit.mjs\`, against the
 * WCAG floor AND against the anchor palette's own measurement for the same pairing.
 *
 * SELECTORS. \`.dark\` and \`data-theme\` both live on <html> — mode-watcher writes the first and,
 * since 1.1, the second. \`:root[data-theme=…]\` is (0,2,0) and \`:root[data-theme=…].dark\` is
 * (0,3,0), so both outrank the \`:root\` and \`.dark\` blocks in app.css whatever the import
 * order, and Tailwind's \`dark:\` variant keeps working because the mode is still a class.
 *
 * Parallax has no block here: it IS \`:root\` and \`.dark\` in app.css, so \`data-theme="parallax"\`
 * matches nothing and the base values simply stand.
 *
 * THE SIDEBAR MODE OVERRIDE. \`data-sidebar-mode\`, also on <html>, lets the panel wear the mode
 * the page is not — a dark rail beside a light page, which is how the anchor palette ships its own
 * \`.navbar-vertical.navbar-dark\`. Each theme therefore emits two extra blocks holding nothing
 * but the nine chrome tokens, and the specificity is what makes them land:
 *
 *   [data-sidebar-mode='dark']        (0,3,0) — beats the light block (0,2,0). It also TIES with
 *                                     the \`.dark\` block, which is why it is emitted between the
 *                                     two: in dark mode the tie is a no-op, since it is carrying
 *                                     the dark values the \`.dark\` block would set anyway
 *   .dark[data-sidebar-mode='light']  (0,4,0) — outranks everything above it outright
 *
 * The attribute is absent by default, which is the third state: the sidebar follows the page.
 * That is why "auto" needs no CSS at all — see \`$lib/hooks/sidebar-mode.svelte.ts\`.
 */
`;

const cssBlock = (selector, tokens) => {
	const lines = Object.entries(tokens).map(([name, [hex, note]]) => {
		const [L, C, h] = hexToOklch(hex);
		const oklch = `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(0)})`;
		return `\t--${name}: ${hex.toLowerCase()}; /* ${note} · ${oklch} */`;
	});
	return `${selector} {\n${lines.join("\n")}\n}\n`;
};

const cssParts = [CSS_HEADER];

for (const t of built) {
	if (t.spec.builtin) continue;
	const brand = hexToOklch(t.brand);
	const moved = Object.entries(t.status)
		.filter(([key]) => t.spec.status?.[key])
		.map(([key, s]) => `${key} → h ${s.h}`)
		.join(", ");

	cssParts.push(`
/*
 * ${t.spec.name} — ${t.spec.blurb}
 *
 * ${t.spec.why}
 *
 *   neutrals  hue ${t.spec.nh}, at ${t.spec.nc}× the anchor palette's chroma
 *   brand     oklch(${brand[0].toFixed(3)} ${brand[1].toFixed(3)} ${brand[2].toFixed(0)})${t.spec.brandDark ? ", lifted in dark so a label still reads on it" : ""}
 *   statuses  ${moved || "all four at the shared anchors"}
 */
${cssBlock(`:root[data-theme='${t.spec.id}']`, t.light)}
${cssBlock(
	`:root[data-theme='${t.spec.id}'][data-sidebar-mode='dark'],
:root[data-theme='${t.spec.id}'][data-header-mode='dark'] [data-slot='page-header-bar']`,
	pick(t.dark, SIDEBAR_TOKENS),
)}
${cssBlock(`:root[data-theme='${t.spec.id}'].dark`, t.dark)}
${cssBlock(
	`:root[data-theme='${t.spec.id}'].dark[data-sidebar-mode='light'],
:root[data-theme='${t.spec.id}'][data-header-mode='light'] [data-slot='page-header-bar']`,
	pick(t.light, SIDEBAR_TOKENS),
)}`);
}

writeFileSync(resolve(root, "src/themes.css"), cssParts.join("\n"), "utf8");

// ---------------------------------------------------------------------------------------
// src/lib/themes/palettes.ts
// ---------------------------------------------------------------------------------------

const tsTokens = (tokens) =>
	Object.entries(tokens)
		.map(([name, [hex]]) => `\t\t\t\t'${name}': '${hex.toLowerCase()}'`)
		.join(",\n");

const tsTheme = (t) => `	{
		id: '${t.spec.id}',
		name: '${t.spec.name}',
		blurb: ${JSON.stringify(t.spec.blurb)},
		swatch: {
			light: [${SWATCH.map((k) => `'${t.light[k][0].toLowerCase()}'`).join(", ")}],
			dark: [${SWATCH.map((k) => `'${t.dark[k][0].toLowerCase()}'`).join(", ")}]
		},
		tokens: {
			light: {
${tsTokens(t.light)}
			},
			dark: {
${tsTokens(t.dark)}
			}
		}
	}`;

const TS_HEADER = `/**
 * The themes, as data.
 *
 * GENERATED — edit \`tools/themes/themes.mjs\` and re-run \`node tools/themes/generate.mjs\`.
 *
 * These are the same values \`src/themes.css\` paints with, emitted a second time so the picker
 * and the Themes page can DRAW a palette they are not currently wearing. Reading them out of
 * the stylesheet instead would mean scoping the theme blocks to a plain element, which drops
 * their specificity to a tie with \`.dark\`; see the note at the top of the generator.
 *
 * \`swatch\` is the five-colour strip the picker shows: brand, then the four statuses, which is
 * the set that actually differs between two themes at a glance.
 */
`;

const ts = `${TS_HEADER}
/** Every theme id. \`parallax\` is the base, and the one \`data-theme\` value with no CSS block. */
export const THEME_IDS = [${built.map((t) => `'${t.spec.id}'`).join(", ")}] as const;

export type ThemeId = (typeof THEME_IDS)[number];

/**
 * The default, and what an unknown or missing stored value falls back to.
 *
 * THE SAME ID AS THE BASE, and that is the point. The base is the palette \`:root\` already
 * wears — so a consumer who installs \`parallax-theme\` and never writes a \`data-theme\` gets
 * Parallax. This value is what a first visit to the GALLERY is dressed in, and while it was
 * Amethyst the gallery was demonstrating a palette no installation produces by default: the one
 * page a visitor judges the kit by was not showing the kit's own colours.
 *
 * \`parallax\` is the one id with no CSS block, so writing it as \`data-theme\` matches nothing
 * and leaves \`:root\` standing, which is exactly the intended result. \`index.html\`'s
 * first-paint script carries the same spelling and the matching \`theme-color\` pair; nothing
 * across a plain HTML file enforces that agreement, so it is stated on both ends.
 */
export const DEFAULT_THEME: ThemeId = 'parallax';

export type Theme = {
	id: ThemeId;
	name: string;
	/** One line, shown under the name in the picker. */
	blurb: string;
	/** Brand, success, warning, destructive, info — the strip the picker renders. */
	swatch: { light: string[]; dark: string[] };
	/** The full token set, for the swatch grid on the Themes page. */
	tokens: { light: Record<string, string>; dark: Record<string, string> };
};

export const THEMES: Theme[] = [
${built.map(tsTheme).join(",\n")}
];

/** The tokens shown as a palette on the Themes page, grouped as the CSS blocks group them. */
export const TOKEN_GROUPS: { title: string; tokens: string[] }[] = [
	{ title: 'Surfaces', tokens: ['background', 'foreground', 'card', 'popover', 'muted', 'muted-foreground', 'scrim'] },
	{ title: 'Brand', tokens: ['primary', 'primary-foreground', 'primary-subtle', 'primary-subtle-foreground', 'secondary', 'accent', 'ring'] },
	{ title: 'Status', tokens: ['destructive', 'destructive-subtle', 'destructive-subtle-foreground', 'success', 'success-subtle', 'success-subtle-foreground', 'warning', 'warning-subtle', 'warning-subtle-foreground', 'info', 'info-subtle', 'info-subtle-foreground'] },
	{ title: 'Lines', tokens: ['border', 'input', 'sidebar-border', 'sidebar-outline'] },
	{ title: 'Charts', tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] },
	{ title: 'Sidebar', tokens: ['sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-accent'] }
];
`;

writeFileSync(resolve(root, "src/lib/themes/palettes.ts"), ts, "utf8");

console.log(`wrote src/themes.css and src/lib/themes/palettes.ts — ${built.length} themes`);
