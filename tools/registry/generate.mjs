/**
 * Writes `registry.json` — the manifest `shadcn-svelte registry build` compiles into the JSON
 * files another project installs from.
 *
 * GENERATED, for the same reason `src/themes.css` is: every value in it already exists somewhere
 * that a check guards. The base palette lives in `app.css`, where `themes:audit` diffs it against
 * the solved `parallax` and refuses to run on a mismatch; the page-header mechanics live in the
 * same file beside the rules they belong to. Hand-writing either into the manifest would mint a
 * copy under no check at all, and the first edit to `app.css` would leave consumers installing
 * last month's colours.
 *
 * THE EXHAUSTIVE HALF IS MECHANICAL. Every Parallax-authored or -forked ui/ component is an
 * item too, assembled by the import-graph walker (`import-graph.mjs`) against the committed
 * snapshot of the official index; the CSS each one carries comes from the claims table
 * (`css-claims.mjs`) under a TOTAL-accounting rule — every app.css block claimed or excluded,
 * or the build fails by name. Verbatim ports of official components are never published.
 *
 * @see tools/registry/css-blocks.mjs — the reader, and what it does and does not understand
 * @see src/app.css — the blocks this reads, by selector
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
	topLevelBlocks,
	blockBySelector,
	declarations,
	nestedBlock,
	unprefix,
} from "./css-blocks.mjs";
import { walkItem, uiSeeds } from "./import-graph.mjs";
import { CSS_CLAIMS, RESTYLE_SELECTORS } from "./css-claims.mjs";
import { fingerprint, SNAPSHOT_PATH } from "./official-snapshot-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Where the built JSON will answer from.
 *
 * IT HAS TO BE ABSOLUTE, and it has to be decided here rather than at install time: a bare name in
 * `registryDependencies` means a component of the OFFICIAL shadcn-svelte registry, so an item of
 * ours that depends on another of ours can only say so with a full URL. That is the single reason
 * this constant exists, and the reason moving the site means regenerating the manifest.
 *
 * `PARALLAX_REGISTRY_HOMEPAGE` overrides it, which is what makes the whole thing testable before
 * it is published: point it at a local server, rebuild, and the cross-item URLs resolve there
 * instead. Without the override an item that depends on another can only be installed once the
 * real site answers — the CLI follows the URL as written and fails on a 404.
 */
const HOMEPAGE =
	process.env.PARALLAX_REGISTRY_HOMEPAGE ??
	"https://octarinacompany.github.io/svelte-theme-parallax";
const item = (name) => `${HOMEPAGE}/r/${name}.json`;

const blocks = topLevelBlocks(readFileSync(resolve(root, "src/app.css"), "utf8"));

/*
 * TRIPWIRE for the positional reads below. `:root` is read by ORDINAL — the palette is the
 * first, the page-header metrics the second — and the reader only throws when an index is out
 * of RANGE. A new top-level `:root` added above either of them would re-index both silently and
 * publish the wrong block under the right name. Pinning the count turns that into a loud
 * failure here, with the fix being to revisit the ordinals rather than to bump this number.
 */
{
	const roots = blocks.filter((b) => b.selector === ":root").length;
	if (roots !== 3) {
		throw new Error(
			`src/app.css: expected exactly 3 top-level \u0060:root\u0060 blocks (palette, header metrics, loader easings), found ${roots} — the positional reads below are no longer safe`,
		);
	}
}

/**
 * A `css` object built from app.css blocks, by exact normalised selector, in list order.
 *
 * Selector-exact on purpose: a rename in app.css must fail this build, not ship a hollow item.
 * Each selector must match exactly one top-level block — zero is a rename, two is an ambiguity
 * this file must resolve by ordinal before publishing either. At-rule blocks (`@keyframes …`)
 * go through the tree reader, everything else through the flat one; the registry schema accepts
 * both shapes in the same object. The duplicate check exists because a JS object literal would
 * overwrite silently, which for a manifest is the worst possible failure.
 */
function cssFromSelectors(selectors) {
	const css = {};
	for (const selector of selectors) {
		const matches = blocks.filter((b) => b.selector === selector);
		if (matches.length !== 1) {
			throw new Error(
				`src/app.css: expected exactly one \u0060${selector}\u0060 block, found ${matches.length}`,
			);
		}
		if (selector in css)
			throw new Error(`registry css: duplicate selector key \u0060${selector}\u0060`);
		css[selector] = selector.startsWith("@")
			? nestedBlock(blocks, selector)
			: declarations(matches[0].body);
	}
	return css;
}

/*
 * The blocks, read by position among their duplicates rather than by a marker comment.
 *
 * `app.css` holds three top-level `:root` blocks — the base palette, the page-header metrics, and
 * the loader easings — so the palette is the first and the metrics the second. The reader throws
 * when an index is out of range, so a block that is deleted or reordered fails here instead of
 * emitting a half-formed item.
 */
const baseLight = blockBySelector(blocks, ":root", 0);
const baseDark = blockBySelector(blocks, ".dark", 0);
const headerMetrics = blockBySelector(blocks, ":root", 1);
const headerChrome = blockBySelector(blocks, '[data-slot="page-header-bar"]', 0);
const headerFade = blockBySelector(blocks, '[data-slot="page-header"][data-floating]::after', 0);
const headerHidden = blockBySelector(blocks, '[data-slot="page-header"][data-hidden]', 0);
const headerHiddenVeto = blockBySelector(
	blocks,
	'[data-slot="page-header"][data-hidden]:has(:focus-visible), [data-slot="page-header"][data-hidden]:has([data-state="open"])',
	0,
);
const chromeDark = blockBySelector(
	blocks,
	':root[data-sidebar-mode="dark"], :root[data-header-mode="dark"] [data-slot="page-header-bar"]',
	0,
);
const chromeLight = blockBySelector(
	blocks,
	':root.dark[data-sidebar-mode="light"], :root[data-header-mode="light"] [data-slot="page-header-bar"]',
	0,
);

/*
 * The `@theme inline` block that maps the palette onto Tailwind utilities — the FIRST one, which
 * is the type scale plus every `--color-*`. The second belongs to `ui/marquee` and travels with
 * that component, not with the palette.
 */
const themeMappings = blockBySelector(blocks, "@theme inline", 0);

/**
 * A `files` entry that installs where it already sits.
 *
 * THE `~/` IS LOAD-BEARING. Without it the CLI resolves a target against the alias directory for
 * the file's type — or, for a `registry:file`, against the one for the ITEM's type, which for a
 * `registry:theme` is the basename of the consumer's stylesheet. A bare `src/themes.css` therefore
 * lands in a directory literally named `app.css`, and a bare `src/lib/themes/index.ts` lands at
 * `src/lib/src/lib/themes/index.ts`. `~/` is the documented escape hatch: resolve from the project
 * root and take the path as written.
 */
const file = (path, type) => ({ path, type, target: `~/${path}` });

const THEME = {
	name: "parallax-theme",
	type: "registry:theme",
	title: "Parallax theme",
	description:
		"The Parallax palette: the base light and dark tokens, the eleven alternate palettes behind `data-theme`, and the Tailwind mappings for the token families shadcn does not ship — success, warning, info, the subtle family, and `--sidebar-outline`.",
	dependencies: ["mode-watcher", "@fontsource-variable/hanken-grotesk"],
	/*
	 * Empty rather than absent, BOTH of them: `registry.json` requires `registryDependencies`
	 * on every item, and an unset `devDependencies` makes `registry build` auto-detect versions
	 * from this repo's package.json — where everything is a devDependency — so each published
	 * item would carry its npm deps a second time, pinned to this repo's ranges.
	 */
	devDependencies: [],
	registryDependencies: [],
	files: [
		file("src/themes.css", "registry:file"),
		file("src/lib/themes/palettes.ts", "registry:lib"),
		file("src/lib/themes/index.ts", "registry:lib"),
	],
	cssVars: {
		theme: unprefix(themeMappings),
		light: unprefix(baseLight),
		dark: unprefix(baseDark),
	},
	/*
	 * The base palette's own chrome blocks. They are PALETTE values, so they ship with the theme
	 * rather than with the appearance system — and they stay inert until something writes the two
	 * attributes they key on, which is exactly what `parallax-appearance` does.
	 */
	css: {
		':root[data-sidebar-mode="dark"], :root[data-header-mode="dark"] [data-slot="page-header-bar"]':
			chromeDark,
		':root.dark[data-sidebar-mode="light"], :root[data-header-mode="light"] [data-slot="page-header-bar"]':
			chromeLight,
	},
	docs: [
		"Two manual steps, because a registry item writes files and cannot patch the ones you already have.",
		"",
		'1. Import the alternate palettes from your global stylesheet, after the Tailwind import: `@import "./themes.css";`',
		'2. Import the typeface the same way: `@import "@fontsource-variable/hanken-grotesk";`',
		"",
		"`parallax` is the base — it IS the `:root` and `.dark` this item just wrote, so it has no `[data-theme]` block of its own. The other eleven answer to `data-theme` on `<html>`; `mode-watcher` owns that attribute and persists it under `mode-watcher-theme`.",
	].join("\n"),
};

const APPEARANCE = {
	name: "parallax-appearance",
	type: "registry:lib",
	title: "Parallax appearance axes",
	description:
		"The four appearance axes as persisted state: an inverted sidebar, an inverted header, a floating header and a header that hides on scroll down. Module-level runes that write attributes on `<html>`, plus the CSS those attributes key on.",
	dependencies: ["mode-watcher"],
	devDependencies: [],
	/*
	 * On the theme, and not merely by taste: the chrome remap below reads `--sidebar-outline`,
	 * which is a Parallax token — shadcn ships `--sidebar-border` and nothing else. Installed
	 * alone against a stock palette this item would resolve that to nothing.
	 */
	registryDependencies: [item("parallax-theme")],
	files: [
		file("src/lib/hooks/sidebar-mode.svelte.ts", "registry:hook"),
		file("src/lib/hooks/header-mode.svelte.ts", "registry:hook"),
		file("src/lib/hooks/sidebar-behaviour.svelte.ts", "registry:hook"),
		file("src/lib/hooks/header-behaviour.svelte.ts", "registry:hook"),
		/*
		 * Owned HERE, referenced by URL from everything else that needs it (the shell's
		 * auto-hide veto, swap's transition gate). Motion preference is appearance
		 * infrastructure, and two items shipping the same target is a silent overwrite.
		 */
		file("src/lib/shared/reduced-motion.svelte.ts", "registry:lib"),
	],
	css: {
		":root": headerMetrics,
		'[data-slot="page-header-bar"]': headerChrome,
		'[data-slot="page-header"][data-floating]::after': headerFade,
		'[data-slot="page-header"][data-hidden]': headerHidden,
		'[data-slot="page-header"][data-hidden]:has(:focus-visible), [data-slot="page-header"][data-hidden]:has([data-state="open"])':
			headerHiddenVeto,
	},
	docs: [
		"## The contract",
		"",
		"The CSS this installed keys on attributes your own header has to write. Nothing paints until it does:",
		"",
		'- `data-slot="page-header"` on the outer sticky element — the one the floating fade hangs off and the auto-hide translates.',
		'- `data-slot="page-header-bar"` on the bar inside it — this is what the inverted palette selects, and what re-scopes the nine chrome tokens onto the controls.',
		"- `data-floating` and `data-hidden` on the outer element, present or absent, from `headerFloating.current` and the auto-hide state.",
		"",
		"The two mode axes need nothing from you: `header-mode` and `sidebar-mode` write `data-header-mode` and `data-sidebar-mode` on `<html>` themselves. The sidebar's floating axis needs nothing either — pass shadcn's own `variant=\"floating\"` when `sidebarFloating.current` is set.",
		"",
		"## The first-paint script",
		"",
		"Add this to the `<head>` of your `index.html` (or `src/app.html` under SvelteKit), before anything else runs. Without it the page paints in the page's own mode for one frame and then snaps to the inverted one — a visible flash on every load, which no client code can prevent because it happens before hydration.",
		"",
		"```html",
		"<script>",
		"  try {",
		"    var root = document.documentElement;",
		'    var mode = localStorage.getItem("mode-watcher-mode") || "system";',
		'    var dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);',
		'    var rail = localStorage.getItem("sidebar-mode");',
		'    var railWear = rail === "inverted" ? (dark ? "light" : "dark") : dark ? "dark" : "light";',
		'    if (rail === "inverted") root.setAttribute("data-sidebar-mode", railWear);',
		'    var bar = localStorage.getItem("header-mode");',
		'    var barWear = bar === "inverted" ? (dark ? "light" : "dark") : dark ? "dark" : "light";',
		'    if (barWear !== railWear) root.setAttribute("data-header-mode", barWear);',
		"  } catch (e) {}",
		"</script>",
		"```",
		"",
		"Keep it in step with the hooks: it repeats their resolution, and every `localStorage` key it reads is exported from one of them as a constant.",
	].join("\n"),
};

const CONTROLS = {
	name: "parallax-appearance-controls",
	type: "registry:component",
	title: "Parallax appearance controls",
	description:
		"The two dropdown menus that drive the axes: one for the sidebar (inverted, floating) and one for the header (inverted, floating, hide on scroll). Drop them in a header and the axes become user-facing.",
	registryDependencies: ["dropdown-menu", "button", item("parallax-appearance")],
	/*
	 * The icons. `svelte` itself is not listed — it is the framework, not a dependency an item
	 * can add — and `bits-ui` arrives with `dropdown-menu` rather than from here.
	 */
	dependencies: ["@lucide/svelte"],
	devDependencies: [],
	files: [
		file("src/lib/components/navigation/SidebarModeToggle.svelte", "registry:component"),
		file("src/lib/components/navigation/HeaderToggle.svelte", "registry:component"),
	],
	docs: "Both are icon-sized `DropdownMenu` triggers meant for a header's right-hand cluster. They read and write the hooks directly, so they take no props and hold no state of their own.",
};

/**
 * The selectors `parallax-shell` lifts out of app.css, in source order — which matters once:
 * the grouped active-marker block ties on specificity with the two placement blocks after it,
 * so their order IS the cascade. 14 sidebar restyle blocks, 12 sheet/mobile-drawer blocks
 * (including both backdrop keyframes), and the menu-cursor rule every shell dropdown renders
 * through. Deliberately absent: `@layer base` and the popover shadow-kill rule — both are
 * application-global opinions a shell item has no business imposing (the docs say so instead).
 */
const SHELL_CSS_SELECTORS = [
	// The affordance cursor on menu items — every shell dropdown renders through it.
	'[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"]), [role="option"]:not([aria-disabled="true"]), [role="slider"]:not([aria-disabled="true"])',
	// The sidebar restyle: rhythm, the transparent-active pair, the bar markers, the rail.
	'[data-slot="sidebar-menu-sub-button"]',
	'[data-slot="sidebar-menu-button"][data-active="true"], [data-slot="sidebar-menu-sub-button"][data-active="true"]',
	'[data-slot="sidebar-menu-item"]:has(> [data-active="true"])::before, [data-slot="sidebar-menu-sub-item"]:has(> [data-active="true"])::before',
	'[data-slot="sidebar-menu-item"]:has(> [data-active="true"])::before',
	'[data-slot="sidebar-menu-sub-item"]:has(> [data-active="true"])::before',
	'[data-collapsible="icon"] [data-slot="sidebar-menu-button"][data-active="true"]',
	'[data-collapsible="icon"] [data-slot="sidebar-menu-item"]:has(> [data-active="true"])::before',
	'[data-slot="sidebar-header"] [data-sidebar="menu-button"], [data-slot="sidebar-footer"] [data-sidebar="menu-button"]',
	'[data-slot="sidebar-rail"]',
	'[data-side="left"][data-state="expanded"] [data-slot="sidebar-rail"], [data-side="right"][data-state="collapsed"] [data-slot="sidebar-rail"]',
	'[data-side="left"][data-state="collapsed"] [data-slot="sidebar-rail"], [data-side="right"][data-state="expanded"] [data-slot="sidebar-rail"]',
	'[data-slot="sidebar-inner"]',
	'[data-slot="sidebar-group"], [data-slot="sidebar-header"], [data-slot="sidebar-footer"]',
	'[data-collapsible="icon"] [data-slot="sidebar-group"], [data-collapsible="icon"] [data-slot="sidebar-header"], [data-collapsible="icon"] [data-slot="sidebar-footer"]',
	// The mobile drawer the sidebar opens in below the breakpoint, plus its scrim — and the
	// breadcrumb's own drawer scrim, split out of its grouped rule in app.css for exactly this.
	'[data-slot="drawer-overlay"]',
	'[data-slot="sheet-overlay"]',
	'[data-slot="sheet-overlay"][data-state="open"]',
	'[data-slot="sheet-overlay"][data-state="closed"]',
	"@keyframes sheet-backdrop-in",
	"@keyframes sheet-backdrop-out",
	':is([data-slot="sheet-content"], [data-slot="sidebar"][data-mobile="true"])',
	':is([data-slot="sheet-content"], [data-slot="sidebar"][data-mobile="true"]):is( [data-side="left"], [data-side="right"] )',
	':is([data-slot="sheet-content"], [data-slot="sidebar"][data-mobile="true"])[data-side="left"]',
	':is([data-slot="sheet-content"], [data-slot="sidebar"][data-mobile="true"])[data-side="right"]',
	':is([data-slot="sheet-content"], [data-slot="sidebar"][data-mobile="true"]):is( [data-side="top"], [data-side="bottom"] )',
	':is([data-slot="sheet-content"], [data-slot="sidebar"][data-mobile="true"])[data-side="top"]',
	':is([data-slot="sheet-content"], [data-slot="sidebar"][data-mobile="true"])[data-side="bottom"]',
];

const SWAP = {
	name: "parallax-swap",
	type: "registry:ui",
	title: "Swap",
	description:
		"A two-state icon crossfade — the house primitive behind the light/dark toggle. Not in the official registry, which is why it ships from here.",
	dependencies: [],
	devDependencies: [],
	/* For `shared/reduced-motion.svelte.ts`, which gates the transition. */
	registryDependencies: [item("parallax-appearance")],
	files: [
		file("src/lib/components/ui/swap/index.ts", "registry:ui"),
		file("src/lib/components/ui/swap/swap.svelte", "registry:ui"),
		file("src/lib/components/ui/swap/swap-on.svelte", "registry:ui"),
		file("src/lib/components/ui/swap/swap-off.svelte", "registry:ui"),
		file("src/lib/components/ui/swap/swap.svelte.ts", "registry:ui"),
	],
};

const SHELL = {
	name: "parallax-shell",
	type: "registry:block",
	title: "Parallax shell",
	description:
		"The application shell: the sidebar (workspace switcher, two-shape navigation, user menu, icon rail, mobile drawer) and the page header bar (breadcrumb, search slot, appearance controls) — wired to the published appearance axes, taking their content as typed props.",
	dependencies: ["@lucide/svelte", "mode-watcher"],
	devDependencies: [],
	registryDependencies: [
		"sidebar",
		"separator",
		"breadcrumb",
		"button",
		"dropdown-menu",
		"collapsible",
		"avatar",
		"drawer",
		item("parallax-primitives"),
		item("parallax-theme"),
		item("parallax-appearance"),
		item("parallax-appearance-controls"),
		item("parallax-swap"),
	],
	files: [
		file("src/lib/components/layout/AppShell.svelte", "registry:component"),
		file("src/lib/components/layout/AppSidebar.svelte", "registry:component"),
		file("src/lib/components/layout/PageHeader.svelte", "registry:component"),
		file("src/lib/components/layout/BreadcrumbTrail.svelte", "registry:component"),
		file("src/lib/components/navigation/NavMain.svelte", "registry:component"),
		file("src/lib/components/navigation/NavUser.svelte", "registry:component"),
		file("src/lib/components/navigation/WorkspaceSwitcher.svelte", "registry:component"),
		file("src/lib/components/navigation/ThemeSelector.svelte", "registry:component"),
		file("src/lib/components/navigation/ThemeSwatch.svelte", "registry:component"),
		file("src/lib/components/navigation/ModeToggle.svelte", "registry:component"),
		file("src/lib/shared/nav.ts", "registry:lib"),
		file("src/lib/shared/get-initials.ts", "registry:lib"),
		file("src/lib/shared/overflow-fit.ts", "registry:lib"),
		file("src/lib/hooks/sidebar-state.ts", "registry:hook"),
	],
	css: cssFromSelectors(SHELL_CSS_SELECTORS),
	docs: [
		"## Wiring",
		"",
		"The shell takes its content as typed props (see `src/lib/shared/nav.ts`) and its active state as a predicate — never a router. A minimal `App.svelte`:",
		"",
		"```svelte",
		"<script lang=\u0022ts\u0022>",
		"  import { ModeWatcher } from \u0022mode-watcher\u0022;",
		"  import AppShell from \u0022$lib/components/layout/AppShell.svelte\u0022;",
		"  import AppSidebar from \u0022$lib/components/layout/AppSidebar.svelte\u0022;",
		"  import PageHeader from \u0022$lib/components/layout/PageHeader.svelte\u0022;",
		"  import type { NavItem, User, Workspace } from \u0022$lib/shared/nav.js\u0022;",
		"  import GaugeIcon from \u0022@lucide/svelte/icons/gauge\u0022;",
		"  import CommandIcon from \u0022@lucide/svelte/icons/command\u0022;",
		"",
		"  const user: User = { name: \u0022Ada Lovelace\u0022, email: \u0022ada@example.com\u0022 };",
		"  const workspaces: Workspace[] = [{ name: \u0022Acme Inc\u0022, plan: \u0022Enterprise\u0022, logo: CommandIcon }];",
		"  const items: NavItem[] = [",
		"    { title: \u0022Dashboard\u0022, url: \u0022/\u0022, icon: GaugeIcon },",
		"    { title: \u0022Reports\u0022, items: [{ title: \u0022Monthly\u0022, url: \u0022/reports/monthly\u0022 }] },",
		"  ];",
		"</script>",
		"",
		"<ModeWatcher />",
		"<AppShell>",
		"  {#snippet sidebar()}",
		"    <AppSidebar {user} {workspaces} {items} isActive={(url) => url === location.pathname} />",
		"  {/snippet}",
		"  <PageHeader trail={[{ label: \u0022Dashboard\u0022 }]} />",
		"  <!-- your page -->",
		"</AppShell>",
		"```",
		"",
		"Every `PageHeader` slot is a snippet with a default: `sidebarTrigger`, `breadcrumb` (receives `trail`), `search` (empty — pass your own field or palette) and `controls` (the four appearance controls). Pass an empty `sidebarTrigger` snippet if the header ever renders outside `AppShell`'s provider.",
		"",
		"## What is already wired",
		"",
		"This header carries `data-slot=\u0022page-header\u0022` / `data-slot=\u0022page-header-bar\u0022` and writes `data-floating` / `data-hidden` itself — the contract `parallax-appearance`'s docs ask a hand-rolled header to satisfy is closed here. The first-paint script from those docs still applies verbatim.",
		"",
		"## Cautions",
		"",
		"- Nothing above `PageHeader` may gain `overflow-x: hidden` — beside an `overflow-y: visible` it computes as `auto`, silently turning the shell into a scroll container and killing the sticky header with no error anywhere. Use `overflow-x: clip` if a clip is ever needed.",
		"- The CSS this item adds is unlayered on purpose (it must outrank the sidebar's own utilities), so it also outranks YOUR utility classes on the same slots — override it in plain CSS, not with a utility.",
		"- Three fidelity notes against the Parallax gallery: buttons install from the official registry, so icon buttons run ~36px rather than the gallery's token-driven 40px; dropdown menus keep the upstream shadow; and the collapsed rail's tooltips keep the upstream look — both of the latter are application-global restyles this item deliberately does not ship.",
	].join("\n"),
};

const SKILL = {
	name: "parallax-skill",
	/*
	 * `registry:file`, NOT the generic `registry:item`: the CLI's per-type directory resolver
	 * has no branch for `registry:item` and throws "TODO: unhandled item type" during install,
	 * even though every file below carries a `~/` target that bypasses the resolver's answer.
	 */
	type: "registry:file",
	title: "Parallax skill",
	description:
		"The Agent Skill that teaches an AI assistant to use Parallax correctly: registry installation, shell composition, the token families, the palettes and the appearance axes, with the pitfalls spelled out. Installs into the project's `.claude/skills/parallax/`.",
	dependencies: [],
	devDependencies: [],
	registryDependencies: [],
	/*
	 * `registry:file` targets, because these land OUTSIDE `src/` — in the project's
	 * `.claude/skills/` — which only the root-relative `~/` form can express. The tracked
	 * source lives under `skills/parallax/`; the rename to `.claude/skills/` happens in the
	 * target, so this repo's own `.claude/skills/` (vendored, gitignored) stays untouched.
	 * `evals.json` ships too — the skill README tells maintainers to re-run it; README.md
	 * itself stays repo-side, it is the notice for humans browsing the source.
	 */
	files: [
		{
			path: "skills/parallax/SKILL.md",
			type: "registry:file",
			target: "~/.claude/skills/parallax/SKILL.md",
		},
		{
			path: "skills/parallax/references/shell.md",
			type: "registry:file",
			target: "~/.claude/skills/parallax/references/shell.md",
		},
		{
			path: "skills/parallax/references/theming.md",
			type: "registry:file",
			target: "~/.claude/skills/parallax/references/theming.md",
		},
		{
			path: "skills/parallax/references/install.md",
			type: "registry:file",
			target: "~/.claude/skills/parallax/references/install.md",
		},
		{
			path: "skills/parallax/references/patterns.md",
			type: "registry:file",
			target: "~/.claude/skills/parallax/references/patterns.md",
		},
		{
			path: "skills/parallax/references/components.md",
			type: "registry:file",
			target: "~/.claude/skills/parallax/references/components.md",
		},
		{
			path: "skills/parallax/evals.json",
			type: "registry:file",
			target: "~/.claude/skills/parallax/evals.json",
		},
	],
	docs: [
		"The skill is installed at `.claude/skills/parallax/` — commit it so the whole team's assistants share it. Claude Code picks it up automatically (live-watched, no restart); invoke it explicitly with `/parallax`.",
		"",
		"It teaches: discover before installing (components.json), install through the CLI, the two manual post-install steps, Svelte 5 runes only, semantic tokens (soft status fills pair with their own foregrounds), and the appearance axes through their hooks.",
	].join("\n"),
};

// ============================== The ui/ component items ==============================
/*
 * The exhaustive half of the registry: every Parallax-authored or Parallax-forked ui/
 * component, assembled MECHANICALLY by the import-graph walker. Three classes, decided
 * against the committed snapshot of the official index (`official-index.json`, refresh by
 * re-fetching https://shadcn-svelte.com/registry/index.json):
 *
 *   PORT — official name, ≤ PORT_COMMENT_CEILING comment lines across the folder (the house
 *          rule: registry-ported files stay comment-free). Never published: the official
 *          registry already serves it, and a copy could only go stale.
 *   FORK — official name, but commented: house API grew on it (button's control ramp,
 *          table's density, badge's subtle variants…). Published as `parallax-<name>`, and
 *          every internal dependency on it re-points to OUR copy automatically.
 *   HOUSE — absent from the official index. Published as `parallax-<name>`.
 *
 * FORCE_FORKS exists because the comment heuristic is not fork-proof: `avatar` and `card`
 * carry house API (a `size` prop, the ring treatment) with almost no comments. A port that
 * turns out to hide house API surfaces in the mass consumer E2E as a svelte-check failure —
 * the fix is to add it here, not to hand-edit an item.
 */
const OFFICIAL_INDEX = JSON.parse(
	readFileSync(resolve(root, "tools/registry/official-index.json"), "utf8"),
);
const OFFICIAL = new Set(
	OFFICIAL_INDEX.filter((i) => i.type === "registry:ui" || i.type === "registry:hook").map(
		(i) => i.name,
	),
);
const OFFICIAL_SNAPSHOT = JSON.parse(readFileSync(resolve(root, SNAPSHOT_PATH), "utf8"));

/**
 * PORT, FORK or HOUSE — decided by comparing CONTENT against the official snapshot, never by a
 * proxy for it. A folder is a port only when it has exactly the official file set and every
 * file fingerprints identically; anything else the official registry also names is a fork;
 * anything it does not name is house code.
 *
 * The proxy this replaced was a comment-line count, and it was wrong in both directions —
 * `tabs` and `toggle` are forks that stayed under the threshold (so a consumer installing the
 * official one lost the `size` prop and the control ramp), while `sidebar` is verbatim upstream
 * that sailed over it on upstream's own JSDoc. Two `FORCE_FORKS` exceptions were already
 * papering over the same gap; the comparison needs no exceptions.
 */
function classifyUi(dir) {
	const official = OFFICIAL_SNAPSHOT[dir];
	if (!official) return "house";
	const local = Object.fromEntries(
		readdirSync(resolve(root, "src/lib/components/ui", dir)).map((f) => [
			f,
			fingerprint(readFileSync(resolve(root, "src/lib/components/ui", dir, f), "utf8")),
		]),
	);
	const names = Object.keys(official);
	const verbatim =
		names.length === Object.keys(local).length && names.every((n) => local[n] === official[n]);
	return verbatim ? "port" : "fork";
}

/*
 * A folder the official registry names but the snapshot has never seen means the snapshot is
 * stale — refresh it (`npm run registry:sync`) rather than let the folder fall through to
 * "house" and be republished under a name the official registry already owns.
 */
const ALL_UI = readdirSync(resolve(root, "src/lib/components/ui"));
{
	const unseen = ALL_UI.filter((d) => OFFICIAL.has(d) && !OFFICIAL_SNAPSHOT[d]);
	if (unseen.length > 0) {
		throw new Error(
			`official-snapshot.json predates these official items: ${unseen.join(", ")} — run \`npm run registry:sync\``,
		);
	}
}

/** Dirs already carried by a hand-built item — the sweep must not mint a duplicate. */
const HAND_BUILT_UI = new Set(["swap"]);
const UI_CLASS = Object.fromEntries(ALL_UI.map((d) => [d, classifyUi(d)]));
const PUBLISHED_UI = ALL_UI.filter((d) => !HAND_BUILT_UI.has(d) && UI_CLASS[d] !== "port");
const PUBLISHED_SET = new Set([...PUBLISHED_UI, ...HAND_BUILT_UI]);

/*
 * Shared/hooks files used by MORE THAN ONE published item need one declared owner — the
 * owner ships the file, everyone else depends on the owner's URL. Single-consumer files
 * fold into their consumer implicitly. A multi-consumer file missing here fails the build
 * with the full consumer list, so one run surfaces every decision.
 */
const SHARED_OWNERS = {
	"src/lib/shared/roving-focus.svelte.ts": "parallax-primitives",
	"src/lib/shared/form-control.svelte.ts": "parallax-primitives",
	"src/lib/shared/tanstack-table-bridge.svelte.ts": "parallax-primitives",
	"src/lib/shared/scroll-position.svelte.ts": "parallax-primitives",
	"src/lib/shared/dom-ordered-collection.svelte.ts": "parallax-primitives",
	"src/lib/shared/reduced-motion.svelte.ts": "parallax-appearance",
	"src/lib/shared/nav.ts": "parallax-shell",
	"src/lib/shared/get-initials.ts": "parallax-shell",
	"src/lib/shared/overflow-fit.ts": "parallax-shell",
	"src/lib/hooks/sidebar-state.ts": "parallax-shell",
	/*
	 * NOT the official hook, despite the name: the house copy exports
	 * `DEFAULT_MOBILE_BREAKPOINT`, which `responsive-dialog` imports — substituting
	 * upstream's file breaks every consumer of that export.
	 */
	"src/lib/hooks/is-mobile.svelte.ts": "parallax-primitives",
	"src/lib/hooks/header-mode.svelte.ts": "parallax-appearance",
	"src/lib/hooks/sidebar-mode.svelte.ts": "parallax-appearance",
	"src/lib/hooks/header-behaviour.svelte.ts": "parallax-appearance",
	"src/lib/hooks/sidebar-behaviour.svelte.ts": "parallax-appearance",
};

const sharedConsumers = new Map();

const graphCtx = (itemName) => ({
	itemName,
	uiDep: (name) => {
		if (name === itemName.replace(/^parallax-/, "")) return null;
		if (PUBLISHED_SET.has(name)) return item(`parallax-${name}`);
		if (OFFICIAL.has(name)) return name;
		throw new Error(`ui dep "${name}" is neither published nor in the official index`);
	},
	ownerOf: (file) => SHARED_OWNERS[file] ?? null,
	urlOf: (owner) => (owner.startsWith("@official:") ? owner.slice(10) : item(owner)),
	record: (file, consumer) => {
		if (!sharedConsumers.has(file)) sharedConsumers.set(file, new Set());
		sharedConsumers.get(file).add(consumer);
	},
});

/** Curated descriptions for the flagship items; everything else gets an honest generic one. */
const UI_DESCRIPTIONS = {
	"data-table":
		"The TanStack-driven table engine: createDataTable state in runes, Toolbar with meta-driven filters, ColumnHeader, FlexRender, Pagination. The motor behind every list page in the gallery.",
	"data-grid":
		"The spreadsheet: virtualized rows, cell-addressed keyboard navigation, in-place editors per cell variant, its own ARIA grid markup.",
	loader:
		"128 loaders behind one API, with a shared reduced-motion answer: moving parts stop, the loader breathes.",
	"action-bar":
		"The floating bulk-selection bar: a count, grouped actions, and an Escape that defers to open overlays.",
	button:
		"The house button: shadcn's API on the --control-h-* ramp (24/32/40/48px), with xs/icon-xs sizes and the data-icon slots.",
	table:
		"The house table: shadcn's API plus the three-tier density axis (data-density retunes row/head/cell tokens; tiers are floors, not clamps).",
	badge: "The house badge: shadcn's API plus the soft *-subtle variants for every status family.",
	avatar: "The house avatar: shadcn's API plus a size ramp and the hairline ring treatment.",
	card: "The house card: shadcn's API plus a size prop and the ring-drawn outline.",
};

/*
 * npm dependencies ship RANGE-QUALIFIED (`@tanstack/table-core@^8.21.3`), taken from this
 * repo's package.json — the only ranges the code is actually tested against. A bare name
 * hands the consumer whatever latest is, which is how table-core 9 (a breaking rewrite)
 * produced 191 type errors in the mass E2E. A walked dependency missing from package.json
 * fails the build: the repo could not have compiled either. When the repo carries a
 * matching `@types/<pkg>` devDependency, the item forwards it the same way.
 */
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const REPO_RANGES = { ...pkg.devDependencies, ...pkg.dependencies };
const pinned = (name) => {
	const range = REPO_RANGES[name];
	if (!range) throw new Error(`npm dep "${name}" walked from source but absent from package.json`);
	return `${name}@${range}`;
};
const typesFor = (names) =>
	names
		.map((n) => `@types/${n.replace(/^@([^/]+)\//, "$1__")}`)
		.filter((t) => REPO_RANGES[t])
		.map((t) => `${t}@${REPO_RANGES[t]}`);

const titleOf = (dir) => dir.charAt(0).toUpperCase() + dir.slice(1).replaceAll("-", " ");

const fileTypeOf = (path) =>
	path.startsWith("src/lib/components/ui/")
		? "registry:ui"
		: path.startsWith("src/lib/hooks/")
			? "registry:hook"
			: "registry:lib";

/*
 * The shared infrastructure with MULTIPLE consumers, as one lib item — so that installing
 * `parallax-tree` does not drag the whole action bar in for one roving-focus file, and no
 * two items ever ship the same target. Single-consumer shared files still fold into their
 * consumer; a file joins this list only when the ownership tripwire below names it.
 */
const PRIMITIVES = {
	name: "parallax-primitives",
	type: "registry:lib",
	title: "Parallax primitives",
	description:
		"Shared infrastructure the house components compose: roving focus, form-control bridging, the TanStack table bridge, scroll position, DOM-ordered collections. Installed automatically as a dependency; rarely asked for by name.",
	/*
	 * WALKED, not hand-asserted. This item's dependencies used to be a literal `[]` while its
	 * files were computed — two mechanisms with nothing cross-checking them — and
	 * `roving-focus.svelte.ts` quietly imports `ui/direction-provider`. Eight items depending
	 * on primitives therefore never pulled it, and a single-item install wrote a file whose
	 * first line names a folder the CLI never created. Walking the very files it ships is the
	 * only arrangement in which the two halves cannot disagree.
	 */
	...(() => {
		const seeds = Object.entries(SHARED_OWNERS)
			.filter(([, owner]) => owner === "parallax-primitives")
			.map(([path]) => path);
		const graph = walkItem(root, seeds, graphCtx("parallax-primitives"));
		return {
			dependencies: graph.dependencies.map(pinned),
			devDependencies: typesFor(graph.dependencies),
			registryDependencies: graph.registryDependencies,
			files: graph.files.map((f) => file(f, fileTypeOf(f))),
		};
	})(),
};

/*
 * The css each item carries, resolved from the claims table. Repeated selectors are
 * disambiguated by ordinal (`nth`), exactly like the positional `:root` reads above; a claim
 * that matches no block, or a block left unclaimed at the end, fails the build by name.
 */
const blockValueAt = (selector, nth = 0) => {
	const matches = blocks.filter((b) => b.selector === selector);
	if (matches.length <= nth) {
		throw new Error(
			`css claims: expected at least ${nth + 1} "${selector}" block(s), found ${matches.length}`,
		);
	}
	const body = matches[nth].body;
	if (!selector.startsWith("@")) return declarations(body);
	/*
	 * At-rules are special-cased by the CLI's css writer: an OBJECT value under one is read
	 * as `{ selector: rule }`, so direct declarations (`@theme inline { --a: b }`) must be
	 * ONE string blob — a `{ "--a": "b" }` object would be parsed as a rule whose selector
	 * is `--a` and whose content is `b`, which is the postcss "Unknown word" crash. Nested
	 * blocks (`@media`, `@keyframes`) keep the tree form the writer expects.
	 */
	const tree = nestedBlock(blocks, selector, nth);
	const decls = Object.entries(tree).filter(([, v]) => typeof v === "string");
	const children = Object.entries(tree).filter(([, v]) => typeof v !== "string");
	/*
	 * MIXED at-rules (the marquee `@theme inline`: declarations beside nested `@keyframes`)
	 * cannot be one object either — the string-valued keys crash the writer as above. The
	 * declarations become the at-rule's blob, and each nested child is HOISTED to its own
	 * top-level css entry via `__hoist`, which `claim()` expands. For `@keyframes` that is
	 * not even a semantic change: Tailwind hoists them out of `@theme` itself.
	 */
	const blob = decls.map(([k, v]) => `${k}: ${v};`).join(" ");
	if (children.length === 0) return blob;
	if (decls.length === 0) return tree;
	return { __blob: blob, __hoist: Object.fromEntries(children) };
};

const cssByItem = new Map();
const themeVarsByItem = new Map();
const claimedBlocks = new Set();
const claimAsThemeVars = (selector, nth, itemNames) => {
	claimedBlocks.add(`${selector} ${nth}`);
	const value = blockValueAt(selector, nth);
	const decls = typeof value === "string" ? value : value.__blob;
	const hoisted = typeof value === "string" ? {} : value.__hoist;
	const vars = Object.fromEntries(
		decls
			.split(";")
			.map((d) => d.trim())
			.filter(Boolean)
			.map((d) => {
				const colon = d.indexOf(":");
				return [d.slice(0, colon).trim().replace(/^--/, ""), d.slice(colon + 1).trim()];
			}),
	);
	for (const name of itemNames) {
		themeVarsByItem.set(name, { ...(themeVarsByItem.get(name) ?? {}), ...vars });
		if (!cssByItem.has(name)) cssByItem.set(name, {});
		/*
		 * The hoisted keyframes ride inside a neutral `@media all` wrapper. Written as
		 * top-level `@keyframes` entries on an item that ALSO carries cssVars, the CLI's
		 * writer emits them EMPTY (`@keyframes marquee-left;`) — the same objects written
		 * from a cssVars-less item (the shell's backdrops) keep their bodies. `@media`
		 * children go through the writer's nested path, which is the one that works, and
		 * `@media all` is a no-op wrapper CSS-wise.
		 */
		if (Object.keys(hoisted).length > 0) {
			Object.assign(cssByItem.get(name), { "@media all": hoisted });
		}
	}
};

const claim = (selector, nth, itemNames) => {
	claimedBlocks.add(`${selector} ${nth}`);
	for (const name of itemNames) {
		if (!cssByItem.has(name)) cssByItem.set(name, {});
		const css = cssByItem.get(name);
		if (selector in css) throw new Error(`css claims: duplicate key ${selector} in ${name}`);
		const value = blockValueAt(selector, nth);
		if (value !== null && typeof value === "object" && "__hoist" in value) {
			css[selector] = value.__blob;
			for (const [childSelector, childTree] of Object.entries(value.__hoist)) {
				if (childSelector in css) {
					throw new Error(`css claims: hoisted key ${childSelector} collides in ${name}`);
				}
				css[childSelector] = childTree;
			}
		} else {
			css[selector] = value;
		}
	}
};
for (const c of CSS_CLAIMS) {
	if (c.exclude) claimedBlocks.add(`${c.selector} ${c.nth ?? 0}`);
	else if (c.asThemeVars) claimAsThemeVars(c.selector, c.nth ?? 0, c.items);
	else claim(c.selector, c.nth ?? 0, c.items);
}
for (const selector of RESTYLE_SELECTORS) claim(selector, 0, ["parallax-restyle"]);

const UI_ITEMS = PUBLISHED_UI.map((dir) => {
	const graph = walkItem(root, uiSeeds(root, dir), graphCtx(`parallax-${dir}`));
	return {
		name: `parallax-${dir}`,
		type: "registry:ui",
		title: titleOf(dir),
		description:
			UI_DESCRIPTIONS[dir] ??
			(UI_CLASS[dir] === "fork"
				? `The Parallax fork of the official ${dir}: the same API with the house refinements this theme depends on.`
				: `Parallax's ${titleOf(dir).toLowerCase()} component — not in the official shadcn-svelte registry.`),
		dependencies: graph.dependencies.map(pinned),
		devDependencies: typesFor(graph.dependencies),
		registryDependencies: graph.registryDependencies,
		files: graph.files.map((f) => file(f, fileTypeOf(f))),
		...(cssByItem.has(`parallax-${dir}`) && { css: cssByItem.get(`parallax-${dir}`) }),
		...(themeVarsByItem.has(`parallax-${dir}`) && {
			cssVars: { theme: themeVarsByItem.get(`parallax-${dir}`) },
		}),
	};
});

/*
 * The restyle of the official ports, as ONE css-only item: install it and every official
 * component the project carries takes the Parallax shape — switch, checkbox, tooltip,
 * inputs, sliders, sonner, the tabs line variant. This is also the single opt-in for the two
 * application-global opinions (menu shadow-kill, dialog scrim) that no other item smuggles in.
 */
const RESTYLE = {
	name: "parallax-restyle",
	type: "registry:ui",
	title: "Parallax restyle",
	description:
		"The Parallax shape for the OFFICIAL components: css-only restyles of switch, checkbox, tooltip, inputs, native-select, select, sliders, sonner, navigation-menu, kbd, command and the tabs line variant, plus the global menu-shadow and dialog-scrim opinions. Install once beside parallax-theme.",
	dependencies: [],
	devDependencies: [],
	registryDependencies: [item("parallax-theme")],
	files: [],
	css: cssByItem.get("parallax-restyle"),
};

/*
 * The ownership tripwire: after every walk, any shared/hooks file that ended up inside TWO
 * items is a silent-overwrite bug waiting in the consumer. Owned files are fine — the walker
 * already routed non-owners to a URL. Everything else must have exactly one consumer.
 */
{
	const conflicts = [...sharedConsumers.entries()]
		.filter(([f, consumers]) => !SHARED_OWNERS[f] && consumers.size > 1)
		.map(([f, consumers]) => `${f} ← ${[...consumers].join(", ")}`);
	if (conflicts.length > 0) {
		throw new Error(
			`shared files with multiple consumers need an entry in SHARED_OWNERS:\n${conflicts.join("\n")}`,
		);
	}
}

const registry = {
	$schema: "https://shadcn-svelte.com/schema/registry.json",
	name: "parallax",
	homepage: HOMEPAGE,
	/*
	 * The import paths `registry build` rewrites into whatever the consumer's `components.json`
	 * calls them. They are this project's own aliases, copied from its `components.json` — a
	 * mismatch here would leave `$lib/...` imports in the published files.
	 */
	aliases: {
		components: "$lib/components",
		utils: "$lib/utils",
		ui: "$lib/components/ui",
		hooks: "$lib/hooks",
		lib: "$lib",
	},
	items: [THEME, APPEARANCE, CONTROLS, SWAP, SHELL, SKILL, PRIMITIVES, RESTYLE, ...UI_ITEMS],
};

/*
 * TOTAL CSS ACCOUNTING. Every top-level app.css block must be claimed by an item (the
 * hand-built theme/appearance/shell lists, or css-claims.mjs) or excluded there with a
 * reason. A block nobody accounts for is a look that silently never reaches consumers —
 * the failure this whole file exists to prevent — so it fails the build by name instead.
 */
{
	const handClaimed = new Set([
		":root 0",
		".dark 0",
		"@theme inline 0",
		':root[data-sidebar-mode="dark"], :root[data-header-mode="dark"] [data-slot="page-header-bar"] 0',
		':root.dark[data-sidebar-mode="light"], :root[data-header-mode="light"] [data-slot="page-header-bar"] 0',
		":root 1",
		'[data-slot="page-header-bar"] 0',
		'[data-slot="page-header"][data-floating]::after 0',
		'[data-slot="page-header"][data-hidden] 0',
		'[data-slot="page-header"][data-hidden]:has(:focus-visible), [data-slot="page-header"][data-hidden]:has([data-state="open"]) 0',
		...SHELL_CSS_SELECTORS.map((s) => `${s} 0`),
	]);
	const counters = new Map();
	const unclaimed = [];
	for (const b of blocks) {
		const nth = counters.get(b.selector) ?? 0;
		counters.set(b.selector, nth + 1);
		const key = `${b.selector} ${nth}`;
		if (!handClaimed.has(key) && !claimedBlocks.has(key)) unclaimed.push(key);
	}
	if (unclaimed.length > 0) {
		throw new Error(
			`app.css blocks nobody claims or excludes (add them to css-claims.mjs):\n${unclaimed.join("\n")}`,
		);
	}
}

/*
 * BARE NAMES THAT WE OURSELVES PUBLISH — rewritten here, over the ASSEMBLED items, because
 * the hand-written ones (shell, controls) were authored before the sweep started publishing
 * forks and named `button`, `avatar`, `sidebar` the official way. Both spellings write the
 * same file targets, so an install resolving one of each is a last-write-wins race: whichever
 * lands second decides whether the consumer keeps the house API. The walked items were always
 * correct; running every item through the same mapping is what stops the two diverging again.
 */
for (const it of registry.items) {
	it.registryDependencies = (it.registryDependencies ?? []).map((dep) =>
		!dep.startsWith("http") && PUBLISHED_SET.has(dep) ? item(`parallax-${dep}`) : dep,
	);
}

/*
 * …and the tripwires that would have caught it. The first restates the rule above as an
 * assertion; the second follows each remaining bare name into the official snapshot, because
 * a bare dep drags ITS deps too — official `sidebar` pulls official `is-mobile`, whose file is
 * the very one `parallax-primitives` owns with the house copy that exports
 * `DEFAULT_MOBILE_BREAKPOINT`. Neither collision is visible to the target check below, which
 * only ever compares Parallax items against each other.
 */
{
	const ownedTargets = new Map();
	for (const it of registry.items) {
		for (const f of it.files ?? []) ownedTargets.set(f.target.replace(/^~\//, ""), it.name);
	}
	const officialTargets = {
		"is-mobile": "src/lib/hooks/is-mobile.svelte.ts",
	};
	for (const it of registry.items) {
		for (const dep of it.registryDependencies ?? []) {
			if (dep.startsWith("http")) continue;
			if (PUBLISHED_SET.has(dep)) {
				throw new Error(
					`${it.name} depends on bare "${dep}", but this registry publishes parallax-${dep}, which writes the same file targets`,
				);
			}
			const officialEntry = OFFICIAL_INDEX.find((i) => i.name === dep);
			for (const transitive of officialEntry?.registryDependencies ?? []) {
				const target = officialTargets[transitive];
				if (target && ownedTargets.has(target)) {
					throw new Error(
						`${it.name} depends on bare "${dep}", which pulls official "${transitive}" writing ${target} — a file ${ownedTargets.get(target)} owns with the house copy`,
					);
				}
			}
		}
	}
}

/*
 * Global uniqueness tripwires. Item names must be unique or the second silently wins in
 * every index; file targets must be unique across ALL items or installing two items
 * overwrites one's file with the other's — the consumer-side failure nothing here would see.
 */
{
	const names = registry.items.map((i) => i.name);
	const dupNames = names.filter((n, i) => names.indexOf(n) !== i);
	if (dupNames.length > 0) {
		throw new Error(`duplicate item names: ${[...new Set(dupNames)].join(", ")}`);
	}
	const targets = new Map();
	for (const it of registry.items) {
		for (const f of it.files ?? []) {
			if (targets.has(f.target) && targets.get(f.target) !== it.name) {
				throw new Error(
					`file target ${f.target} shipped by both ${targets.get(f.target)} and ${it.name}`,
				);
			}
			targets.set(f.target, it.name);
		}
	}
}

writeFileSync(resolve(root, "registry.json"), `${JSON.stringify(registry, null, "\t")}\n`, "utf8");

/*
 * The docs page, emitted beside the manifest — and not as a nicety: `shadcn-svelte registry
 * build` STRIPS the `docs` field when it compiles the published JSON (verified against the
 * built output), and the CLI has no docs-printing path. The manifest keeps the fields as the
 * single source; this page is the only route by which they reach a reader.
 */
const docsPage = [
	"# The Parallax registry",
	"",
	"GENERATED — the text lives in `tools/registry/generate.mjs`; edit it there and re-run",
	"`npm run registry:generate`. It is duplicated out of `registry.json` because the registry",
	"build strips each item's `docs` field from the published JSON.",
	"",
	...registry.items.flatMap((i) => [
		`## ${i.name}`,
		"",
		i.description,
		"",
		"```sh",
		`npx shadcn-svelte@latest add ${item(i.name)}`,
		"```",
		...(i.docs ? ["", i.docs] : []),
		"",
	]),
].join("\n");
writeFileSync(resolve(root, "docs/REGISTRY.md"), `${docsPage}`, "utf8");

/*
 * The gallery index — `references/components.md` in the skill, and the catalog half of
 * `public/llms.txt`. Parsed out of `route.svelte.ts`'s CATEGORIES/DESTINATIONS literals the
 * same way the CSS is read out of app.css: the catalog is already the single place a route is
 * written down (CONVENTIONS §9), so the index cannot drift from it. The parser is a text walk,
 * not an import — the module is TypeScript and drags Svelte runes with it.
 */
function parseCatalog(exportName) {
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
			groups.push({ title: pair.title, items: [] });
		} else if (groups.length === 0) {
			// DESTINATIONS: a flat list with no group headers.
			groups.push({ title: null, items: [pair] });
		} else {
			groups.at(-1).items.push(pair);
		}
	}
	return groups;
}

/**
 * The page file for a catalog slug. Names are PascalCase with unpredictable acronym casing
 * (`InputOTPPage` vs `InputOtpPage`), so the match is by normalised lowercase against a scan
 * of the real directory — and it THROWS on a miss, because an index entry pointing at a file
 * that does not exist is worse than no entry.
 */
const pageFiles = readdirSync(resolve(root, "src/lib/components/pages"));
function pageFileFor(slug) {
	const key = `${slug.split("/").at(-1).replaceAll("-", "")}page.svelte`;
	const match = pageFiles.find((f) => f.toLowerCase() === key);
	if (!match) throw new Error(`no page file found for catalog slug ${slug}`);
	return `src/lib/components/pages/${match}`;
}

const RAW = "https://raw.githubusercontent.com/OctarinaCompany/svelte-theme-parallax/main";
const destinations = parseCatalog("DESTINATIONS")[0].items;
const catalog = parseCatalog("CATEGORIES");
const uiDirs = readdirSync(resolve(root, "src/lib/components/ui"));

const componentsPage = [
	"# The Parallax gallery index",
	"",
	"GENERATED by `tools/registry/generate.mjs` from the catalog in `route.svelte.ts` — do not",
	"edit by hand. The gallery pages are NOT registry items: they are readable source. To study",
	"or reproduce one, read its source file — locally when the Parallax repository is available,",
	`or from \`${RAW}/<path>\`.`,
	"",
	"Patterns with a distilled recipe in [patterns.md](patterns.md) are the ones worth reading",
	"first; everything below is the complete map.",
	"",
	"## Destinations",
	"",
	...destinations.map((d) => `- ${d.title} — \`${pageFileFor(d.slug)}\``),
	"",
	...catalog.flatMap((group) => [
		`## ${group.title}`,
		"",
		...group.items.map((i) => `- ${i.title} — \`${pageFileFor(i.slug)}\``),
		"",
	]),
	"## The ui/ inventory",
	"",
	`${uiDirs.length} component folders under \`src/lib/components/ui/\`:`,
	"",
	uiDirs.join(", "),
	"",
	"Verbatim ports of official components install by their bare official name. Everything",
	"Parallax-authored or Parallax-forked is a published `parallax-<name>` registry item —",
	"install it from the registry rather than copying source; the gallery page above shows it",
	"in use.",
].join("\n");
writeFileSync(
	resolve(root, "skills/parallax/references/components.md"),
	`${componentsPage}\n`,
	"utf8",
);

/*
 * `public/llms.txt` — the llms.txt-convention index the wider ecosystem converged on (shadcn/ui
 * and diceui both ship one; neither puts documentation inside the registry). The registry
 * manifests carry no prose an agent can discover, so this is the machine-readable front door:
 * every item with its install URL, every guide, and the whole gallery as fetchable source.
 * Served from the site root once Pages deploys; the GitHub raw links work already.
 */
const llmsPage = [
	"# Parallax",
	"",
	"> Parallax is a dashboard theme kit for shadcn-svelte (Svelte 5, Tailwind v4): a palette of",
	"> 12 themes over one token set, four persisted appearance axes (inverted sidebar/header,",
	"> floating header, auto-hide), an installable application shell, and a gallery of patterns.",
	"> Distribution is a shadcn-svelte registry: source is copied into the consumer project.",
	"",
	"## Registry items",
	"",
	`Install with \`npx shadcn-svelte@latest add <url>\`. Post-install notes: ${RAW}/docs/REGISTRY.md`,
	"",
	...registry.items.map((i) => `- [${i.name}](${item(i.name)}): ${i.description}`),
	"",
	"## Guides",
	"",
	`- [Registry guide](${RAW}/docs/REGISTRY.md): every item's post-install notes, wiring sample, first-paint script`,
	`- [Theme system](${RAW}/docs/THEME.md): the base palette, the OKLCH ladder, the token mapping, the audit`,
	`- [Conventions](${RAW}/docs/CONVENTIONS.md): the house rules the source follows`,
	`- [AI skill](${RAW}/skills/parallax/SKILL.md): the Agent Skill (install it via the parallax-skill registry item)`,
	`- [Pattern recipes](${RAW}/skills/parallax/references/patterns.md): distilled design recipes of the flagship gallery pages`,
	"",
	"## Gallery",
	"",
	"Demonstration pages, readable as source (not registry items). Fetch any file at",
	`\`${RAW}/<path>\`.`,
	"",
	...destinations.map((d) => `- ${d.title}: ${pageFileFor(d.slug)}`),
	...catalog.flatMap((group) =>
		group.items.map((i) => `- ${i.title} (${group.title}): ${pageFileFor(i.slug)}`),
	),
	"",
	"## UI components",
	"",
	`${uiDirs.length} folders under src/lib/components/ui/ — `,
	uiDirs.join(", "),
].join("\n");
writeFileSync(resolve(root, "public/llms.txt"), `${llmsPage}\n`, "utf8");

const summary = registry.items.map((i) => `${i.name} (${i.files?.length ?? 0} files)`).join(", ");
console.log(
	`wrote registry.json, docs/REGISTRY.md, references/components.md and public/llms.txt — ${registry.items.length} items: ${summary}`,
);
