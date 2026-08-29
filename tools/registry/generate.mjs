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
import { parseCatalog } from "../shared/catalog.mjs";

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
	/*
	 * The same tripwire for `@layer base`, which is now TWO blocks read by ordinal: the first is
	 * init's own boilerplate and is excluded from every item, the second is the hand-cursor rule
	 * and ships with `parallax-restyle`. Merging them back into one would silently publish the
	 * consumer's own base defaults from our registry; adding a third would re-index the claim.
	 */
	const bases = blocks.filter((b) => b.selector === "@layer base").length;
	if (bases !== 2) {
		throw new Error(
			`src/app.css: expected exactly 2 top-level @layer base blocks (init's boilerplate, then the hand-cursor rule), found ${bases} — the ordinal claims in css-claims.mjs are no longer safe`,
		);
	}
}

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

/*
 * npm dependencies ship RANGE-QUALIFIED (`@tanstack/table-core@^8.21.3`), taken from this
 * repo's package.json — the only ranges the code is actually tested against. A bare name
 * hands the consumer whatever latest is, which is how table-core 9 (a breaking rewrite)
 * produced 191 type errors in the mass E2E. A walked dependency missing from package.json
 * fails the build: the repo could not have compiled either. When the repo carries a
 * matching `@types/<pkg>` devDependency, the item forwards it the same way.
 *
 * IT SITS ABOVE THE HAND-BUILT ITEMS FOR A REASON. The rule used to be enforced only where
 * the walker applied it, so the four literal `dependencies` arrays below shipped bare names —
 * `mode-watcher` on the two items the whole appearance system rests on, unqualified — while
 * every walked item was pinned. Declaring `pinned` before the first item is what makes
 * the two halves obey the same rule, and puts the hand-written names under the same tripwire.
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

const THEME = {
	name: "parallax-theme",
	type: "registry:theme",
	title: "Parallax theme",
	description:
		"The Parallax palette: the base light and dark tokens, the eleven alternate palettes behind `data-theme`, and the Tailwind mappings for the token families shadcn does not ship — success, warning, info, the subtle family, and `--sidebar-outline`.",
	dependencies: ["mode-watcher", "@fontsource-variable/hanken-grotesk"].map(pinned),
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
		'1. Import the alternate palettes from your global stylesheet, after the Tailwind import: `@import "./themes.css";` — the `./` holds only when that stylesheet is a SIBLING of the `src/themes.css` this item just wrote. Resolve the path against the directory of the stylesheet itself: a SvelteKit scaffold puts it at `src/routes/layout.css`, which needs `../themes.css`. The `tailwind.css` entry in `components.json` names the real location.',
		'2. Import the typeface the same way: `@import "@fontsource-variable/hanken-grotesk";`',
		"",
		'A third applies only if your stylesheet was NOT created by `shadcn-svelte init` — check it for the `@layer base` block with `* { @apply border-border outline-ring/50; }` and for `@import "tw-animate-css";`, and add whichever is absent. Tailwind v4\'s preflight gives borders a width and a style but no colour, so without that rule every `border-*` utility falls back to `currentColor` and the hairlines wear the text colour instead. Nothing errors, the page renders, and only the borders are wrong.',
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
	dependencies: ["mode-watcher"].map(pinned),
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
		"### The contract",
		"",
		"The CSS this installed keys on attributes your own header has to write. Nothing paints until it does:",
		"",
		'- `data-slot="page-header"` on the outer sticky element — the one the floating fade hangs off and the auto-hide translates.',
		'- `data-slot="page-header-bar"` on the bar inside it — this is what the inverted palette selects, and what re-scopes the nine chrome tokens onto the controls.',
		"- `data-floating` and `data-hidden` on the outer element, present or absent, from `headerFloating.current` and the auto-hide state.",
		"",
		"The two mode axes need nothing from you: `header-mode` and `sidebar-mode` write `data-header-mode` and `data-sidebar-mode` on `<html>` themselves. The sidebar's floating axis needs nothing either — pass shadcn's own `variant=\"floating\"` when `sidebarFloating.current` is set.",
		"",
		"### The first-paint script",
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
		"The two dropdown menus that drive the axes: one for the sidebar (inverted, floating) and one for the header (inverted, floating, hide on scroll). Put them on a settings page — or back in the header bar through `PageHeader`'s `controls` snippet — and the axes become user-facing.",
	registryDependencies: ["dropdown-menu", "button", item("parallax-appearance")],
	/*
	 * The icons. `svelte` itself is not listed — it is the framework, not a dependency an item
	 * can add — and `bits-ui` arrives with `dropdown-menu` rather than from here.
	 */
	dependencies: ["@lucide/svelte"].map(pinned),
	devDependencies: [],
	files: [
		file("src/lib/components/navigation/SidebarModeToggle.svelte", "registry:component"),
		file("src/lib/components/navigation/HeaderToggle.svelte", "registry:component"),
	],
	docs: "Both are icon-sized `DropdownMenu` triggers, for a settings page or a header's right-hand cluster. `parallax-shell`'s own header does not render them — its `controls` snippet is the light/dark toggle alone — so mount them where they belong in your app. They read and write the hooks directly, so they take no props and hold no state of their own.",
};

/**
 * The selectors `parallax-shell` lifts out of app.css, in source order — which matters once:
 * the grouped active-marker block ties on specificity with the two placement blocks after it,
 * so their order IS the cascade. 15 sidebar restyle blocks, 12 sheet/mobile-drawer blocks
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
	// The canvas beside the rail, kept from being widened by a wide table inside it.
	':where([data-slot="sidebar-inset"])',
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
		"The application shell: the sidebar (workspace switcher, two-shape navigation, user menu, icon rail, mobile drawer) and the page header bar (breadcrumb, search slot, light/dark toggle) — wired to the published appearance axes, taking their content as typed props.",
	dependencies: ["@lucide/svelte", "mode-watcher"].map(pinned),
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
		"### Wiring",
		"",
		"The shell takes its content as typed props (see `src/lib/shared/nav.ts`) and its active state as a predicate — never a router. A minimal `App.svelte`:",
		"",
		"```svelte",
		"<script lang=\u0022ts\u0022>",
		"  import { ModeWatcher } from \u0022mode-watcher\u0022;",
		"  import AppShell from \u0022$lib/components/layout/AppShell.svelte\u0022;",
		"  import AppSidebar from \u0022$lib/components/layout/AppSidebar.svelte\u0022;",
		"  import PageHeader from \u0022$lib/components/layout/PageHeader.svelte\u0022;",
		"  import { page } from \u0022$app/state\u0022;",
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
		"    <AppSidebar {user} {workspaces} {items} isActive={(url) => url === page.url.pathname} />",
		"  {/snippet}",
		"  <PageHeader trail={[{ label: \u0022Dashboard\u0022 }]} />",
		"  <!-- your page -->",
		"</AppShell>",
		"```",
		"",
		"The predicate is the only thing the shell needs from a router, and reading it from `$app/state` is what keeps it correct on the server: `location` is not defined there, so the bare-`location` spelling this example used to carry threw a `ReferenceError` the moment the layout was server-rendered. Outside SvelteKit, feed the predicate from whatever the app already knows its current path to be.",
		"",
		"Every `PageHeader` slot is a snippet with a default: `sidebarTrigger`, `breadcrumb` (receives `trail`), `search` (empty — pass your own field or palette) and `controls` — which is the light/dark toggle alone. The palette picker and the two panel dropdowns are installed (`ThemeSelector`, plus `HeaderToggle` / `SidebarModeToggle` through `parallax-appearance-controls`) but not rendered: put them on a settings page, or render your own group through `controls`. Pass an empty `sidebarTrigger` snippet if the header ever renders outside `AppShell`'s provider.",
		"",
		"### What is already wired",
		"",
		"This header carries `data-slot=\u0022page-header\u0022` / `data-slot=\u0022page-header-bar\u0022` and writes `data-floating` / `data-hidden` itself — the contract `parallax-appearance`'s docs ask a hand-rolled header to satisfy is closed here. The first-paint script from those docs still applies verbatim.",
		"",
		"### Cautions",
		"",
		"- Nothing above `PageHeader` may gain `overflow-x: hidden` — beside an `overflow-y: visible` it computes as `auto`, silently turning the shell into a scroll container and killing the sticky header with no error anywhere. Use `overflow-x: clip` if a clip is ever needed.",
		"- The CSS this item adds is unlayered on purpose (it must outrank the sidebar's own utilities), so it also outranks YOUR utility classes on the same slots — override it in plain CSS, not with a utility.",
		"- Two fidelity notes against the Parallax gallery: dropdown menus keep the upstream shadow, and the collapsed rail's tooltips keep the upstream look. Both are application-global restyles this item deliberately does not ship — they arrive with `parallax-restyle`. Buttons are not among them: this item depends on `parallax-button`, so the sizes it installs are the gallery's own token-driven ramp.",
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
			path: "skills/parallax/references/bootstrap.md",
			type: "registry:file",
			target: "~/.claude/skills/parallax/references/bootstrap.md",
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
		"The skill is installed at `.claude/skills/parallax/` — commit it so the whole team's assistants share it, and start a fresh session if the assistant was already running when it landed. Invoke it explicitly with `/parallax`.",
		"",
		"It teaches: discover before installing (components.json), install through the CLI, the two manual post-install steps, Svelte 5 runes only, semantic tokens (soft status fills pair with their own foregrounds), and the appearance axes through their hooks.",
	].join("\n"),
};

// ============================== The ui/ component items ==============================
/*
 * The exhaustive half of the registry: every Parallax-authored or Parallax-forked ui/
 * component, assembled MECHANICALLY by the import-graph walker. Three classes, decided by
 * comparing each folder's CONTENT against the committed snapshot of the official registry
 * (`official-snapshot.json`, refreshed by `npm run registry:sync`). The NAMES come from
 * `official-index.json`, re-fetched from https://shadcn-svelte.com/registry/index.json:
 *
 *   PORT — official name, official file set, and every file fingerprints identically to
 *          upstream's. Never published: the official registry already serves it, and a copy
 *          could only go stale.
 *   FORK — official name, but the folder's content diverges: house API grew on it (button's
 *          control ramp, table's density, badge's subtle variants…). Published as
 *          `parallax-<name>`, and every internal dependency on it re-points to OUR copy
 *          automatically.
 *   HOUSE — absent from the official index. Published as `parallax-<name>`.
 *
 * The comparison IS the decision — there is no exception list, and `classifyUi` below says
 * why one is not needed. A folder that classifies as the wrong thing is a fact about the
 * folder, not about this file: a port carrying a gratuitous edit is a fork until the edit is
 * reverted, and the fix is always in `src/lib/components/ui/`.
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
	"src/lib/shared/chat-parts.ts": "parallax-primitives",
	"src/lib/shared/download-text.ts": "parallax-primitives",
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

/**
 * The description every published `ui/` item ships, one line each.
 *
 * EXHAUSTIVE, AND CHECKED. These strings are not decoration: they are the whole payload of
 * `public/r/index.json`, of the item lines in `public/llms.txt`, and of every section in
 * `docs/REGISTRY.md` — the surface a reader, or an agent choosing what to install, actually
 * reads. Two generated templates used to fill the gap ("the same API with the house
 * refinements this theme depends on", "not in the official shadcn-svelte registry"), which
 * gave 102 of 119 items a sentence that said what they were NOT and repeated their own name.
 * A missing entry now FAILS the build (`describeUi` below) rather than minting another one, so
 * a new component cannot ship anonymous.
 *
 * The rule for writing one: say what the item IS, and — where a neighbour is easy to confuse
 * with it — when to reach for this one instead. A FORK names the refinement it actually
 * carries; "house refinements" in the abstract is the phrase this table exists to replace.
 */
const UI_DESCRIPTIONS = {
	accordion:
		"The house accordion: shadcn's API with a chevron pair that swaps on open, hairline seams between items, and link and paragraph spacing inside a panel.",
	"action-bar":
		"The floating bulk-selection bar: a count, grouped actions, and an Escape that defers to open overlays.",
	alert:
		"The house alert: shadcn's API plus an `Alert.Action` corner slot and the full status ramp — the soft `*-subtle` family and the `solid-*` fills.",
	"alert-dialog":
		"The house alert dialog: a `Media` part for the leading illustration, size variants on the content, and Action/Cancel that take Button's own `variant` and `size` rather than wrapping a button in a button.",
	"angle-slider":
		"A circular slider for angles: drag the thumb round the dial, with keyboard steps and an optional range. Reach for it when the value is a direction rather than a position on a line.",
	autocomplete:
		"A text field that suggests as you type and still accepts what the list never offered — the free-text half of type-to-pick. Reach for Combobox instead when the answer must be one of the items.",
	avatar:
		"The house avatar: shadcn's API plus a size ramp, the hairline ring treatment, a status `Avatar.Badge` and `Avatar.Group` stacking.",
	badge:
		"The house badge: shadcn's API plus the soft `*-subtle` variants for every status family, and the ghost and link variants.",
	"badge-overflow":
		"A row of badges that measures its container and folds whatever does not fit into a `+N` indicator. Reach for it wherever a list of tags has to survive a narrow column.",
	banner:
		"A full-width notification strip pinned to the top or bottom of the viewport, with a queue that shows one at a time in priority order. Reach for it when the message outranks the page — an Alert stays in the flow it was written into, and a toast clears itself.",
	breadcrumb:
		"The house breadcrumb: shadcn's API with the theme's separator rhythm and muted trail, sized for the header bar the shell renders it in.",
	button:
		"The house button: shadcn's API on the --control-h-* ramp (24/32/40/48px), with xs/icon-xs sizes, the data-icon slots and the contextual solid and outline palettes.",
	"button-group":
		"The house button group: shadcn's API with the seam treatment that fuses a row or a column of controls into one shape, plus a `Text` part for inline labels.",
	calendar:
		"The house calendar: shadcn's API rebuilt on `--cell-size` and `--cell-radius`, so one month grid retunes for a card, a popover or a full page without forking the parts.",
	card: "The house card: shadcn's API plus a `size` prop that retunes `--card-spacing`, and the ring-drawn outline.",
	carousel:
		"The house carousel: shadcn's Embla wrapper with the previous and next controls rebuilt as round icon-sm Buttons on the house ramp.",
	"chain-of-thought":
		"The steps a model took to an answer, as a collapsible trace: labelled steps with a status each, search-result chips and an optional image. Reach for it to show the WORK; Timeline is for events that happened to a system.",
	chart:
		"The house chart frame: shadcn's LayerChart container, tooltip and legend on the theme's grid, axis and tooltip treatment, driven by a per-series colour config.",
	checkbox:
		"The house checkbox: shadcn's API on a 4px-radius box with the theme's border, focus ring and indeterminate mark.",
	"checkbox-group":
		"Several checkboxes as one value: a shared label, description and validation message, horizontal or vertical. Reach for it when the boxes answer one question rather than several.",
	"circular-progress":
		"A progress ring: a closed circle, 48px on a 4px stroke, determinate or indeterminate. Reach for Gauge when the arc itself carries meaning — the two share their geometry.",
	"code-block":
		"A copyable — and, given a filename, downloadable — code sample with a line-number gutter, a language selector and lightweight language-aware highlighting. Reach for it for an opaque string to read and copy; JSON viewer parses a live value instead.",
	"color-picker":
		"A full colour picker: a saturation and brightness area, hue and alpha sliders, the native eyedropper, and per-channel fields in hex, rgb, hsl or hsb.",
	"color-swatch":
		"A single colour chip that renders transparency honestly, in five sizes — the building block of the picker's palette rows and of any legend that names a colour.",
	combobox:
		"A searchable select: a Command list inside a Popover, single, multiple, or multiple as chips. What it commits is always one of the items — reach for Autocomplete when the answer may be one the list never offered.",
	command:
		"The house command menu: shadcn's cmdk wrapper with the input rebuilt on Input group, a rounded popover ground and the selected-row treatment the palette uses.",
	"compare-slider":
		"Two versions of one image and a divider that wipes between them, by pointer, by touch or from the keyboard.",
	confirmation:
		"The approval gate on a tool call: the request while a decision is open, then the accepted or rejected receipt, painted from the status ramp. Renders nothing until there is a decision to show.",
	"context-menu":
		"The house context menu: shadcn's API with the flat row treatment, ring-drawn popovers and an RTL-aware submenu chevron.",
	"context-usage":
		"How much of a model's context window a conversation has used — a ring in the composer, a hover card of token counts and, when the caller supplies one, the cost. Numbers and cost are the caller's; the component only formats them.",
	conversation:
		"The transcript viewport: sticks to the bottom while a reply streams, offers a scroll-to-bottom button once the reader has scrolled away, an empty state, and a Markdown download of the whole exchange.",
	"copy-button":
		"A button that writes text to the clipboard and swaps its icon for a tick — once the write has actually resolved. The swap is a Svelte transition, with no animation library.",
	cropper:
		"An image and video crop surface: drag, wheel zoom, pinch-zoom-rotate and arrow-key nudging, rectangular or round.",
	"data-grid":
		"The spreadsheet: virtualized rows, cell-addressed keyboard navigation, in-place editors per cell variant, its own ARIA grid markup.",
	"data-table":
		"The TanStack-driven table engine: createDataTable state in runes, Toolbar with meta-driven filters, ColumnHeader, FlexRender, Pagination. The motor behind every list page in the gallery.",
	"date-selector":
		"One control for a day, a month, a quarter, a half-year or a year, behind an is/before/after/between operator, with a free-text input that parses all of them.",
	dialog:
		"The house dialog: shadcn's API with the close control rebuilt as a ghost icon Button, on the popover ground the theme's overlays share.",
	"direction-provider":
		"The RTL/LTR provider. Where upstream renders no DOM and asks each consumer to forward `dir` itself, this renders a `display: contents` wrapper, so the real attribute reaches the subtree and descendants flip without opting in.",
	drawer:
		"The house drawer: shadcn's Vaul wrapper on the popover ground, with the drag handle and edge treatment the mobile sidebar uses.",
	"dropdown-menu":
		"The house dropdown menu: shadcn's API with the flat row treatment, ring-drawn popovers and check and radio indicators on the trailing edge.",
	editable:
		"Text that becomes an input in place: a trigger, a preview, an input and a submit/cancel toolbar over one bindable value. Reach for it in a table cell or a heading where a whole form would be too much furniture.",
	empty:
		"The house empty state: shadcn's API with the media tile, heading and description treatment every placeholder in the gallery shares.",
	"event-calendar":
		"A full scheduling surface: month, week, day, N-day, agenda and resource views over one event model, with time zones, recurrence, localisation and an imperative API.",
	field:
		"The house field: shadcn's form-layout primitive carrying the label, description and error rhythm every form in this theme is built from, including the horizontal and fieldset arrangements.",
	filters:
		"The filter row as state: a filter is a chip of field, operator and value, and the row of them is a value the page owns. Reach for it when a list needs more than a search box.",
	fps: "A frames-per-second counter, for watching whether an interaction still runs at frame rate.",
	frame:
		"A presentational panel family: a bordered tray whose header, panels and footer share one spacing ladder and one radius, with panels separated, fused into a stacked run, or pulled flush to the edge.",
	gauge:
		"A circular meter over a configurable arc — a dial, a segment, a sweep short of a full turn — with an indeterminate state. Reach for Circular progress when a closed ring is all you need.",
	"hover-card":
		"The house hover card: shadcn's API on the theme's popover ground, ring-drawn rather than shadowed.",
	"icon-stack":
		"A layered isometric mark framing a single icon — the illustration an empty state or a feature card leads with, tinted from the surrounding text colour.",
	"icon-tile":
		"A small framed container for one icon — the mark that leads a list row, a feature card or an empty state — in five surfaces, five sizes and two corner treatments.",
	input:
		"The house input: shadcn's API at the theme's height, padding and focus ring, so a field and a default button share a line.",
	"input-group":
		"The house input group: shadcn's API with addons on either side of the control or above and below it, and an `xs` button size for the controls that sit inside one.",
	"input-otp":
		"A segmented one-time-code field, rebuilt on its own state module and provider: a slot per character, groups split by separators, and one hidden input so paste and autofill keep working.",
	item: "The house item row: shadcn's title/description/action row with the `xs` and `sm` sizes and the media slot the gallery's list rows use. For the framed container drawn around a run of them, see the List group page.",
	"json-viewer":
		"A collapsible JSON tree coloured by runtime type, with expand and collapse, copy, and array truncation. Reach for Code block when the payload is an opaque sample rather than a tree to navigate.",
	kanban:
		"A drag-and-drop board: reorder inside a column, move between columns, reorder the columns themselves — with a pointer, with touch, or from the keyboard alone.",
	kbd: "The house keyboard key: shadcn's API as the theme's muted chip, sized to sit inside an input group or a menu row.",
	"key-value":
		"A dynamic list of key/value pairs with paste support and per-row validation — headers, environment variables, metadata a user types.",
	"language-selector":
		"A dialog that switches the active locale. The catalog is data the caller supplies and the component moves a code: it translates nothing.",
	listbox:
		"An always-visible option list with the WAI-ARIA keyboard model and typeahead, single or multiple, as a column or a grid. Reach for it when the options should not be hidden behind a trigger.",
	loader:
		"128 loaders behind one API, with a shared reduced-motion answer: moving parts stop, the loader breathes.",
	marquee:
		"Content that scrolls continuously, horizontally or vertically — pausing on hover and on focus, mirroring under RTL, and holding still for reduced motion.",
	"mask-input":
		"An input that formats what you type against a pattern — a phone number, a date, a card, a currency amount — and keeps the caret where you left it.",
	masonry:
		"A masonry grid: a column count that answers the breakpoint, and items placed by measured height rather than by row.",
	"media-player":
		"A full video and audio player: custom controls, chapters, captions, playback rate and the complete keyboard shortcut set.",
	mention:
		"A text field that suggests and inserts mentions when a trigger character is typed at a word boundary. The popup follows the caret, and each inserted mention behaves as one atomic unit of text.",
	menubar:
		"The house menubar: shadcn's API with the flat row treatment, ring-drawn popovers and indicators on the leading edge.",
	message:
		"One turn of a chat — a user bubble or an assistant answer — with a Markdown response rendered through svelte-streamdown, actions and a toolbar. Installing it brings svelte-streamdown and needs one `@source` line in the stylesheet.",
	"model-selector":
		"A command palette for choosing a model: searchable groups per provider, provider logos, a name slot. Chosen values are the caller's; the component only presents the list.",
	"native-select":
		"The house native select: the browser's own dropdown at the theme's field height, with a `sm` or `default` size stamped as `data-size`.",
	"navigation-menu":
		"The house navigation menu: shadcn's API with the theme's trigger, link and viewport treatment, and `navigationMenuTriggerStyle` exported for the links that are not triggers.",
	"number-field":
		"A numeric input with spinner buttons, press-and-hold repeat, keyboard stepping and a drag-to-scrub label.",
	pagination:
		"The house pagination: shadcn's API with the page links drawn by `buttonVariants` at any Button size, so a pager matches the controls beside it.",
	"partition-bar":
		"A total split into labelled parts: one bar per part, sized by its share, with its name and measurement underneath.",
	pending:
		"A wrapper that marks anything as pending: interactions off, keyboard focus kept, and the right ARIA state for buttons, forms, links and switches.",
	"phone-input":
		"A phone field with country detection and international formatting, built on the mask input.",
	popover:
		"The house popover: shadcn's API plus `Header`, `Title` and `Description` parts, so a popover with a heading is composed rather than hand-laid.",
	progress: "The house progress bar: shadcn's API as a slim rounded track on the muted ground.",
	"prompt-input":
		"The composer: an auto-growing textarea that submits on Enter, a header and footer for tools, borderless selects, and a submit button that becomes a stop button while a reply is in flight.",
	"qr-code":
		"A QR code you compose: the same value rendered as SVG, canvas or image, with a centre overlay, a loading skeleton and a download control.",
	question:
		"A clarifying question from the model, as a form: single or multiple choice, a free-text answer, and a submit that stays disabled until there is a response. Its shape is the AskUserQuestion tool call.",
	"radio-group":
		"The house radio group: shadcn's API with the theme's ring, dot indicator and row rhythm.",
	"range-calendar":
		"The house range calendar: shadcn's API plus the `rangeCalendar`, `rangeCalendarFlush` and `rangeDay` class recipes, so a range picker reads the same in a card, in a popover, or flush to a panel edge.",
	rating:
		"A star rating that displays whole, half and fractional scores, and — when editable — collects one by mouse or keyboard.",
	reasoning:
		"The model's reasoning summary in a collapsible panel that opens while it streams, reports how long the thinking took, and closes itself once the answer starts. Reach for it over Collapsible when the content is a thought, not a section.",
	"relative-time-card":
		"A hover card that shows a moment as relative time, with the absolute time and its zone underneath.",
	resizable:
		"The house resizable panes: shadcn's API with the hairline handle and grip the theme's split layouts use.",
	"responsive-dialog":
		"One dialog that renders as a centred modal above the breakpoint and a bottom drawer below it — and swaps between them without closing.",
	"scroll-area":
		"The house scroll area: shadcn's API with the overlay scrollbar the theme paints. Reach for Scroller instead when native scrolling should stay and only the edge cues are wanted.",
	"scroll-spy":
		"Navigation links that track scroll position and scroll to their section on click, nested sections included.",
	scroller:
		"A scroll container that keeps the browser's own scrollbar and fades the edges where content continues, with optional buttons that scroll on press, hover or click. Where Scroll area replaces the scrollbar, this only layers affordances on top of it.",
	"segmented-input":
		"Connected inputs that read as one segmented control, with focus and typing moving between the segments as they fill and empty.",
	select:
		"The house select: shadcn's API at the theme's field height, with the boxed trigger, ring-drawn content and scroll buttons on the popover ground.",
	"selection-toolbar":
		"A floating toolbar that appears over a text selection, carrying formatting and utility actions.",
	separator:
		"The house separator: shadcn's API on the theme's border token, a hairline in both orientations.",
	shake:
		"A wrapper that replays a perspective wobble whenever a signal changes — the wrong-password nudge.",
	sheet:
		"The house sheet: shadcn's edge panel with the close control rebuilt as a ghost icon Button, and a `showCloseButton` for the panels that own their own.",
	sidebar:
		"The sidebar primitive the application shell is built on — provider, rail, menu, sub-menu and mobile drawer — retuned to the theme's rhythm and its sidebar tokens. `parallax-shell` installs it already wired.",
	skeleton:
		"The house skeleton: shadcn's pulsing placeholder on the muted ground rather than the accent one.",
	slider:
		"The house slider: shadcn's API with the pale thumb and focus ring the theme's controls share, horizontal or vertical.",
	sortable:
		"Drag-and-drop reordering for a list or a grid, operable with a pointer, with touch and from the keyboard alone. Kanban composes it.",
	"speed-dial":
		"A floating action button that fans a set of labelled actions out when it is triggered.",
	spinner:
		"The house spinner: shadcn's loading mark with `role` and `aria-label` overridable, and the foreign icon-library props (`name`, `color`, `stroke`) normalised so another icon set can stand in.",
	status:
		"A status indicator: a dot with an animated ping and the colour families, for system state, presence and service health.",
	"status-monitor":
		"The uptime strip from a public status page: one bar per period, coloured by state, with a tooltip per bar.",
	stepper:
		"A multi-step flow with visible progress: a list of steps with indicator, title, description and separator, horizontal or vertical, each carrying its own state.",
	suggestion:
		"A row of follow-up prompts as pill buttons, scrolling sideways when they overflow. Each pill hands its text to the caller; reach for Badge when the chips are labels rather than actions.",
	switch:
		"The house switch: shadcn's API with the theme's track and thumb, stamped `data-size` so the control ramp reaches it.",
	table:
		"The house table: shadcn's API plus the three-tier density axis (data-density retunes row/head/cell tokens; tiers are floors, not clamps).",
	tabs: "The house tabs: shadcn's API plus the `line` list variant and its `sm` size, both stamped as `data-*` so `app.css` owns the look.",
	"tags-input":
		"Free-text values entered as removable chips, with paste, split-on-delimiter, edit in place and per-tag validation.",
	task: "A model's todo item as a collapsible: a title, sub-items and file chips, open by default so progress reads at a glance.",
	"text-gradient":
		"A highlight that sweeps through text — the label that says a machine is still working.",
	textarea:
		"The house textarea: shadcn's API at the theme's padding and focus ring, so it matches the fields beside it.",
	timeline:
		"A chronological list of events: vertical or horizontal, an alternating variant, RTL support, and completed/active/pending states.",
	toggle:
		"The house toggle: shadcn's API on the --control-h-* ramp with the data-icon slots, so a toggle and a button share a line.",
	"toggle-group":
		"The house toggle group: shadcn's API with a `spacing` axis — fused into one shape, or spaced apart — and an orientation.",
	tool: "One tool call as a card: name, a status badge from the seven AI SDK states, the parameters it was called with and the result it returned — structured payloads through JSON viewer, text through code block.",
	tooltip:
		"The house tooltip: shadcn's API on the inverted foreground ground, with the arrow the theme draws.",
	tour: "A guided tour: highlight an element, step through the instructions, and teach a screen the first time somebody sees it.",
	tree: "A multi-level tree view with expand and collapse, selection, and the WAI-ARIA keyboard model.",
};

/**
 * The description for a published `ui/` folder — or a build failure naming it.
 *
 * The throw is the point. A silent template is what produced 102 identical sentences, and the
 * only arrangement in which that cannot come back is one where adding a component and
 * describing it are the same commit.
 */
/*
 * Post-install prose for the items whose install is not finished by copying files. Keyed by ui/
 * folder, with the same orphan rule as the descriptions: an entry for a folder that is not
 * published is a sentence nobody reads.
 *
 * WHERE IT ACTUALLY LANDS, because the obvious assumption is wrong. `docs` is a field of
 * shadcn's registry-item schema, and the React CLI prints it after an `add`; shadcn-svelte 1.5.1
 * does NOT — its item schema has no `docs` at all, so `registry build` parses it away and
 * `public/r/parallax-message.json` carries no trace of it. Measured, not assumed: the built item's
 * keys are name, title, type, description, dependencies, registryDependencies, files.
 *
 * So this string reaches a reader through `docs/REGISTRY.md`, which renders it under the item's
 * install command, and the same requirement is stated twice more where someone installing will
 * actually be standing: in the item's own `description` (which does survive the build, and is
 * what `public/llms.txt` hands an agent) and in the skill's install reference. Keep it here
 * anyway — it is the field the schema defines for exactly this, REGISTRY.md is generated from it,
 * and a CLI that grows the feature would print it with no edit.
 */
const UI_DOCS = {
	message:
		'Markdown renders through svelte-streamdown, whose classes live in node_modules: add `@source "../node_modules/svelte-streamdown/**/*";` next to the imports of your global stylesheet (`../../node_modules/…` from src/routes/layout.css). Without it answers render unstyled and nothing errors.',
};
for (const dir of Object.keys(UI_DOCS)) {
	if (!PUBLISHED_UI.includes(dir)) {
		throw new Error(`UI_DOCS has an entry for ui/${dir}, which is not a published item`);
	}
}

const describeUi = (dir) => {
	const description = UI_DESCRIPTIONS[dir];
	if (!description) {
		throw new Error(
			`ui/${dir} is published as parallax-${dir} but has no entry in UI_DESCRIPTIONS — write one line saying what it is, and when to reach for it rather than its neighbour`,
		);
	}
	return description;
};

/*
 * The other half of the accounting: an entry nobody reads. A folder stops being published the
 * moment it fingerprints as a verbatim port again, and its description then sits here saying
 * something about the registry that is no longer true — the exact drift the css claims table
 * fails on when a block is left unclaimed. Same answer: name it and stop.
 */
{
	const orphans = Object.keys(UI_DESCRIPTIONS).filter((dir) => !PUBLISHED_UI.includes(dir));
	if (orphans.length > 0) {
		throw new Error(
			`UI_DESCRIPTIONS describes items that are not published: ${orphans.join(", ")} — the folder is a verbatim port or is gone, so delete the entry`,
		);
	}
}

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
		description: describeUi(dir),
		...(UI_DOCS[dir] && { docs: UI_DOCS[dir] }),
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
		"The Parallax shape for components this registry does not republish: css-only restyles of switch, checkbox, tooltip, inputs, native-select, select, sliders, sonner, navigation-menu, kbd, command and the tabs line variant, plus the global menu-shadow and dialog-scrim opinions. Install once beside parallax-theme.",
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
 * `public/llms.txt`. Parsed out of `route.svelte.ts`'s CATEGORIES/DESTINATIONS literals by
 * `tools/shared/catalog.mjs` the same way the CSS is read out of app.css: the catalog is
 * already the single place a route is written down (CONVENTIONS §9), so the index cannot drift
 * from it. The parser lives in a shared module rather than here because the prerender step
 * (`tools/site/prerender.mjs`) reads the same list to emit one HTML file per route.
 */

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
	`${uiDirs.length} folders under src/lib/components/ui/:`,
	"",
	uiDirs.join(", "),
	"",
	"Verbatim ports of official components install by their bare official name. Everything",
	"Parallax-authored or Parallax-forked is a published parallax-<name> registry item — install",
	"it from the registry rather than copying source; the gallery page listed above shows it in use.",
].join("\n");
writeFileSync(resolve(root, "public/llms.txt"), `${llmsPage}\n`, "utf8");

const summary = registry.items.map((i) => `${i.name} (${i.files?.length ?? 0} files)`).join(", ");
console.log(
	`wrote registry.json, docs/REGISTRY.md, references/components.md and public/llms.txt — ${registry.items.length} items: ${summary}`,
);
