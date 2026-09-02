---
name: parallax
description: Build and style dashboards with Parallax, the shadcn-svelte theme kit (Svelte 5 + Tailwind v4). Use when a project consumes the Parallax registry (svelte-theme-parallax), when AppShell/AppSidebar/PageHeader or parallax-* registry items appear in the code, or when the user asks to install Parallax, start a new Svelte dashboard project from an empty directory, add a sidebar/header shell, add a full-height panel beside the page, react to or drive scrolling inside the shell, fix Safari's collapsing toolbar on iPad, theme a dashboard, use the success/warning/info or subtle token families, or drive the floating/inverted/vibrant/auto-hide appearance axes, or paint a backdrop behind the page (gradient, pattern, mark, grain), or apply a look exported from another Parallax project as `parallax-appearance.json`. Covers bootstrapping a project from scratch, registry installation, shell composition through typed props and snippets, the shell-owned scroll model, nav data wiring with an isActive predicate, the 18 palettes over mode-watcher, and the appearance hooks. Not for generic shadcn-svelte components that Parallax does not ship.
license: MIT
---

# Parallax

Parallax is a dashboard theme kit distributed as a **shadcn-svelte registry**: source is
copied into the project, there is no runtime dependency. Everything Parallax authors ships
from `https://octarinacompany.github.io/svelte-theme-parallax/r/` — the palette
(`parallax-theme`), the appearance axes (`parallax-appearance`) and their controls, the
backdrop axis (`parallax-backdrop`) and its picker, the
shell (`parallax-shell`: sidebar + page header bar), this skill (`parallax-skill`), the
`parallax-restyle` opt-in, and one `parallax-<name>` item per house or forked component
(`parallax-data-table`, `parallax-loader`, `parallax-tour`, `parallax-code-highlighter`, …).
Verbatim ports of official shadcn-svelte components are deliberately NOT republished: install
those by their bare official name. Every item resolves its own chain, so one `add` is usually
enough.

The gallery PAGES (tables-in-cards, page headers, uploads, …) are not items — they are
readable source that shows the published components in use, distilled in
[references/patterns.md](references/patterns.md) and mapped in
[references/components.md](references/components.md).

## Svelte 5 only

Parallax code is runes-only, with zero legacy syntax. When touching any Parallax file or
writing code beside it:

- use `$props()` instead of `export let`
- use `$state()` / `$derived` / `$effect` instead of `let` + `$:`
- use `onclick={...}` instead of `on:click={...}`
- use `{#snippet name()}` / `{@render name()}` instead of `<slot>`
- use callback props (`onValueChange`) instead of `createEventDispatcher`

Run `npx svelte-check` before finalizing any component you write or edit.

## Discover the project first

Before adding or changing anything:

0. **No `components.json`, or no Svelte project at all?** The directory is empty or
   non-Svelte: follow [references/bootstrap.md](references/bootstrap.md) end to end, then
   come back here. Do not run `shadcn-svelte add` first — it reads `components.json` and
   its failure names the symptom, not the cause.
1. Read `components.json` — it defines the aliases (`$lib/components`, `$lib/hooks`, …)
   every import below assumes. Never guess aliases.
2. Check what is already installed: `src/lib/components/layout/AppShell.svelte` present
   means the shell is in; `src/themes.css` means the palette is in;
   `src/lib/hooks/header-mode.svelte.ts` means the appearance axes are in.
3. Installed Parallax files are the user's code now. Edit them like project code; never
   reinstall with `--overwrite` unless the user asks.
4. Before building any non-trivial surface from scratch — a table page, a page header, an
   upload UI, a data grid — check whether Parallax already has it: the recipes are in
   [references/patterns.md](references/patterns.md), the full map in
   [references/components.md](references/components.md). Most of what they describe is an
   installable `parallax-<name>` item, not something to reimplement.

## Principles

1. **Semantic tokens, never raw colors.** `bg-success`, not `bg-green-500`. Every color
   utility must resolve through the palette so all 12 themes and both modes keep working.
2. **Compose the shell through props and snippets, don't fork it.** Every `PageHeader`
   slot has a default; every `AppSidebar` region takes data or a snippet.
3. **Data in, predicate in — never a router import.** The shell learns the active page
   through `isActive: (url: string) => boolean`; wire it once at the root, from the router
   the app already has. In SvelteKit that is `page.url.pathname` from `$app/state` — never
   `location.pathname`, which does not exist on the server: the first SSR render throws
   `ReferenceError: location is not defined` and every page answers 500.
4. **The appearance axes are the API.** Floating, inverted and auto-hide are persisted
   user state driven by the installed hooks — never reimplement them with local state.
5. **Install, don't reimplement.** Anything Parallax authors is a registry item; anything
   it merely ports is an official one. Hand-copying source from the gallery is the last
   resort, not the first move.

## Critical rules

**Shell composition** — see [references/shell.md](references/shell.md)

- **Bind the shell's open state, seed it from the cookie** — `AppShell` already does both;
  never mount `Sidebar.Provider` yourself when `AppShell` is installed.
- **`NavItem` has `url` XOR `items`** — an entry with children is a category, not a place.
- **A `search` snippet must carry `min-w-0 shrink`** — the bar is over-subscribed between
  ~640 and ~1200px and the search field is the designated giver.
- **A custom `breadcrumb` snippet renders into a `min-w-0 flex-1` box whose width its own
  content must not change** — a content-sized box loops the trail's measurement.
- **Never nest children inside `<PageHeader>`** — it is a compile error by design; page
  content goes beside the header, inside `AppShell`.
- **`WorkspaceSwitcher.activeWorkspace` may start undefined** — never pre-seed it with
  `workspaces[0]`; the component resolves the default itself.
- **The canvas cannot be widened from inside** — `parallax-shell` pins
  `min-width: 0` on `Sidebar.Inset`, so content too wide for the page scrolls in its own
  box instead of pushing a horizontal scrollbar onto the document. Wide content therefore
  needs a scroll container of its own (`Table.Root` already has one). To opt out for one
  canvas: `min-w-max!`.
- **The shell is the viewport; the canvas scrolls.** `parallax-shell` pins the provider's
  wrapper to `100dvh` and clips it, and makes `Sidebar.Inset` — the `<main>` — the one scroll
  container. The document never scrolls, so iOS Safari never collapses its toolbars
  mid-scroll, so `100dvh` is the viewport as it stands, and only rotation — or a software
  keyboard, which AppShell follows — changes it; `svh` / `lvh` would still be wrong there.
  - Never `h-svh`, `min-h-svh` or `h-screen` inside the shell. A panel that spans the window
    beside the page is a sibling of `Sidebar.Inset` in the provider's row and stretches as a
    flex child (or takes `h-full`); its content fills with `flex-1 min-h-0` and scrolls in
    its own box.
  - Never `window.scrollY`, `window.scrollTo` or `<svelte:window onscroll>` — the document
    sits at 0 forever and the listener never fires. Read and drive the scroll parent
    (`scrollParentOf` from `$lib/shared/scroll-parent.js`, installed with
    `parallax-primitives`) or call `element.scrollIntoView()`; to react to any scroll
    anywhere, listen on `window` in the capture phase (`{ capture: true, passive: true }`),
    because `scroll` does not bubble.
  - After every in-app navigation, move focus to the canvas:
    `document.getElementById("main-content")?.focus({ preventScroll: true })` — `AppShell`
    gives the inset the id, `tabindex={-1}` and `focus-visible:outline-hidden` for this.
    PageDown, Space and the arrows scroll from the focused element upwards, never across
    to a sibling scroller, so after a rail click they scroll nothing until the canvas has
    focus. A fragment landing focuses its heading instead.
  - `scroll-padding-top` lives on the canvas, not on `:root` — `scrollIntoView` and a
    fragment honour the padding of the container that scrolls.
  - No scroll container may sit between the canvas and `PageHeader`: the sticky resolves
    against the nearest scrolling ancestor, and a wrapper that scrolls steals it. That is
    what the `overflow-x: hidden` rule under Installation is about.
  - Sticky chrome you add inside the canvas needs a negative `scroll-margin-top`. The canvas
    carries the `scroll-padding-top` AND resolves your sticky, so a toolbar or filter bar of
    your own pinned at `top-0` sits inside that reserve permanently and reads as obscured:
    focus landing in it scrolls the canvas after something it can never reveal, and the page
    jumps. Stick it below the reserve, or cancel the reserve on the element AND its
    descendants (`scroll-margin` does not inherit; over-cancelling is inert).
    `parallax-shell` ships that cancellation for `PageHeader` alone.

**Theming and tokens** — see [references/theming.md](references/theming.md)

- **Soft status = tint fill + its own foreground**: `bg-warning-subtle
  text-warning-subtle-foreground`, never `text-warning` on `bg-warning-subtle`.
- **Switch palettes through `setTheme(id)`** from `$lib/themes/index.js`, never by writing
  `data-theme` or `localStorage` directly; light/dark goes through `mode-watcher`.
- **The `parallax` theme id has no CSS block on purpose** — it IS the `:root`/`.dark` base,
  and it is also `DEFAULT_THEME`: a first visit wears the base. Keep the literal in the
  first-paint script in step with whatever `defaultTheme` the project passes `<ModeWatcher />`.
- **Drive the axes through their setters** (`setHeaderFloating`, `setSidebarMode`, …),
  never by toggling classes or attributes yourself.
- **Round an `Avatar.Root` and everything follows** — ring, image and fallback are
  `rounded-[inherit]`; never restate the radius on the children or add `after:rounded-*`.
- **Anything that runs a command or navigates wears the hand cursor.** `parallax-restyle`
  ships the rule — buttons, `select`, `summary`, bound `<label>`s and the ARIA roles that
  stand for a control, in `@layer base` so a `cursor-*` utility still wins per element.
  Build a clickable `div` with `role="button"` and it inherits the affordance for free.
  The exceptions are as deliberate as the rule: a surface you click **at** rather than
  **on** (a data-grid cell, a calendar slot) keeps the arrow, a drag handle takes
  `cursor-grab`, an inline editor `cursor-text`, and a control that only focuses or opens a
  tooltip is not a command at all. This is a convention, not a browser default — the spec
  reserves `pointer` for links, and Parallax follows Bootstrap, Primer, MUI and Carbon
  instead.

**Installation** — see [references/install.md](references/install.md), and
[references/bootstrap.md](references/bootstrap.md) for an empty directory

- **From scratch, `shadcn-svelte init` cannot run unattended** — it demands a `--preset`
  only the docs-site builder issues. Write `components.json` by hand instead, and add the
  two things `init` would have left: the `utils` item and the `shadcn-svelte` package.
- **Two manual steps after `parallax-theme`** (a registry item cannot patch existing
  files): the `@import "./themes.css";` + font imports in the global stylesheet, and the
  **first-paint script** in `index.html` / `app.html` (exact copy in theming.md).
- **One manual step after `parallax-code-highlighter`** (a registry item writes files, it
  cannot wire a root): mount `<CodeHighlighter.Root>` **once**, at the app root, above
  everything that renders code. It renders no element and reaches the blocks through context,
  so a second one lower down only compiles a second engine. Nothing goes in the stylesheet —
  the adapter paints `code-block`'s own token classes through the theme's tokens — and nothing
  is fetched from a network. Forgetting it fails SILENTLY: a block outside the provider keeps
  `code-block`'s own fourteen house grammars, so a fence in any other language renders in one
  flat ink — the body `text-foreground`, near-black in light mode and near-white in dark, never
  grey — rather than erroring.
- **The adapter carries 32 language ids, not every language.** `CODE_HIGHLIGHTER_GRAMMARS` in
  `ui/code-highlighter/code-highlighter.svelte.ts` is the whole list, and an id outside it falls
  back to the house tokenizer exactly as silently as a missing provider — Elixir, Lua, Zig,
  Scala and Haskell stay uncoloured with the provider correctly mounted. The escape hatch is the
  Root's `grammars` prop: one `{ <id>: { name, load: () => import("@shikijs/langs/<id>") } }`
  row merged over the built-in table, the specifier a STRING LITERAL so the bundler can see it.
  Reach for that, never for a second provider or a hand-written highlighter.
- **Nothing between the canvas and `PageHeader` may gain `overflow-x: hidden`** — it
  computes to `auto` beside `overflow-y: visible`, the wrapper becomes a scroll container,
  and the sticky header and its auto-hide follow the wrapper instead of the canvas, with no
  error anywhere. Use `overflow-x: clip` if a clip is ever needed.
- **Parallax CSS is unlayered on purpose** and beats utility classes on the same slots —
  override it with plain CSS, or with `!` at the call site, never by stacking utilities.
  The case that bites: an `Input` given `ps-9` for an icon and `h-8` for size keeps its
  12px padding and its 40px height, and the icon lands on the placeholder. Reach for
  `InputGroup` instead — that is what the gallery's own toolbars use.

## Key patterns

```svelte
<script lang="ts">
	// SvelteKit's router, read at the root. A Vite SPA has no `$app/state` — close the
	// predicate over its own current path instead; the shell never imports either.
	import { page } from "$app/state";
	import { ModeWatcher } from "mode-watcher";
	import AppShell from "$lib/components/layout/AppShell.svelte";
	import AppSidebar from "$lib/components/layout/AppSidebar.svelte";
	import PageHeader from "$lib/components/layout/PageHeader.svelte";
	import type { NavItem, User, Workspace } from "$lib/shared/nav.js";
	import GaugeIcon from "@lucide/svelte/icons/gauge";
	import CommandIcon from "@lucide/svelte/icons/command";

	const user: User = { name: "Ada Lovelace", email: "ada@example.com" };
	const workspaces: Workspace[] = [{ name: "Acme Inc", plan: "Enterprise", logo: CommandIcon }];
	const items: NavItem[] = [
		{ title: "Dashboard", url: "/", icon: GaugeIcon }, // url = destination…
		{ title: "Reports", items: [{ title: "Monthly", url: "/reports/monthly" }] }, // …items = category, never both
	];
</script>

<ModeWatcher />
<!-- correct: data as props, active-state as a predicate, content beside the header -->
<AppShell>
	{#snippet sidebar()}
		<AppSidebar
			{user}
			{workspaces}
			{items}
			label="Sections"
			isActive={(url) => url === page.url.pathname}
		/>
	{/snippet}
	<PageHeader trail={[{ label: "Dashboard" }]} />
	<main class="p-6">
		<!-- correct: soft status pairs its own foreground -->
		<span class="rounded-4xl bg-success-subtle px-2 text-success-subtle-foreground">Live</span>
		<!-- wrong: raw palette color, breaks all 12 themes -->
		<!-- <span class="bg-green-100 text-green-700">Live</span> -->
	</main>
</AppShell>
```

## What to reach for

| Need                                     | Use                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------- |
| Whole app frame                          | `AppShell` (+ `sidebar` snippet)                                     |
| Sidebar with nav/user/workspaces         | `AppSidebar` props: `items`, `user`, `workspaces`, `isActive`        |
| Sticky top bar                           | `PageHeader` (snippets: `sidebarTrigger`, `breadcrumb`, `search`, `controls`) |
| Full-height panel beside the canvas      | a sibling of `Sidebar.Inset` in the provider's row, stretched as a flex child (or `h-full`), content `flex-1 min-h-0` — never `h-svh` / `h-screen` |
| React to / drive scrolling               | `scrollParentOf(el)` from `$lib/shared/scroll-parent.js` — read its `scrollTop`, call its `scrollTo` — or `el.scrollIntoView()`; `window.scrollY` is 0 inside the shell |
| Breadcrumb data                          | `Crumb[]` — `{ label, href? }`, last step never has `href`           |
| Icon, prefix, suffix or button **inside** a field | `InputGroup.Root` + `InputGroup.Input` + `InputGroup.Addon` / `InputGroup.Button` — never an `Input` with an absolutely positioned child: `[data-slot="input"]`'s padding and height are unlayered and beat `ps-*` / `h-*` |
| Status badge/alert                       | `bg-{success,warning,info}-subtle` + matching `-foreground`          |
| Emphasis fill                            | `bg-success` / `bg-warning` / `bg-info` + `text-*-foreground`        |
| Hairline on a chrome surface             | `border-sidebar-outline` / `ring-sidebar-outline`                    |
| Uppercase micro-label                    | `text-xs tracking-label uppercase`                                   |
| Palette switch UI                        | `ThemeSelector` (`compact` for a header slot; full form on a settings page) |
| Light/dark toggle                        | `ModeToggle` (or `toggleMode()` from mode-watcher)                   |
| Floating / inverted / vibrant / auto-hide controls | `HeaderToggle`, `SidebarModeToggle`, or the hook setters. `vibrant` needs `@import "./vibrant.css";` in the global stylesheet or it paints nothing |
| The page's scrollbar themed, or handed back to the OS | `page-scrollbar` from `parallax-appearance`: OFF by default, so an install keeps the platform's bar; `setPageScrollbar(true)` writes `data-scrollbar="themed"` on `<html>` and dresses it. It dresses the canvas's bar only — `scrollbar-gutter: stable` is separate, unconditional and part of `parallax-shell`, because reserving the width is a fix rather than a look |
| A gradient, pattern, mark or grain behind the page | `parallax-backdrop` (the hook + `backdrops.css` + the mark SVG) and `BackdropSelector` from `parallax-backdrop-controls`. Needs `@import "./backdrops.css";` after the palettes and before `vibrant.css`, it paints only where the shell's slots exist, and under SvelteKit its `public/backdrop-mark.svg` must be moved to `static/` or the mark 404s in silence |
| A code block, or a Rust / HTML fence rendering uncoloured | `CodeBlock.Root` (`parallax-code-block`) paints fourteen house languages and `Message.Response` already renders fences through it; `parallax-code-highlighter` adds real grammars for 32 ids, and the one thing you must do is mount `<CodeHighlighter.Root>` ONCE, at the app root above the blocks. Both silent failures look the same — a block outside the provider, and a language outside those 32 (Elixir, Lua, Zig, …), stay in the body ink rather than erroring; the second is fixed by the Root's `grammars` prop, not by a second Root |
| A look exported from another Parallax app (`parallax-appearance.json`) | the key → item → setter table and procedure in [references/appearance-export.md](references/appearance-export.md) |
| Table-in-a-card page, page header block, list group, upload UI, data table/grid | the recipes in [references/patterns.md](references/patterns.md) |

## Workflow

1. Discover (components.json + installed files) before proposing installs.
2. Install with the CLI, never by hand-copying:
   `npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-shell.json`
3. Apply the manual post-install steps (stylesheet imports, first-paint script) and say so
   explicitly — the CLI cannot do them.
4. Wire data at the root the project already owns (its router lives there too).
5. Validate: `npx svelte-check`, then run the app and check both modes and at least one
   non-default palette before calling styling done. `svelte-check` says nothing about the
   theme — run the nine console checks in
   [references/bootstrap.md](references/bootstrap.md#7-validate), which catch the failures
   that render fine and are wrong.

**Reproducing a gallery pattern** — a page-level design (Tables in cards, Page headers,
List group, …). The COMPONENTS it uses are installable; the composition is what you build:

1. Read its recipe in [references/patterns.md](references/patterns.md) — the load-bearing
   decisions are there so you do not rediscover them by trial.
2. Install what the recipe names — every component it lists is a registry item, and
   nearly all of them ship as `parallax-<name>` (`parallax-data-table`,
   `parallax-action-bar`, `parallax-table` for density, `parallax-badge` for `*-subtle`,
   `parallax-card`, `parallax-select`, …). Only a **verbatim** port installs by its bare
   official name, and there are three of those; a 404 on `parallax-<name>.json` is the
   test. Never hand-copy a component's source, and never take a Parallax fork by its bare
   name — that installs the upstream one and loses the house API.
3. Then write the composition, using the page source as the reference (locally, or from
   `https://raw.githubusercontent.com/OctarinaCompany/svelte-theme-parallax/main/<path>`):
   swap the demo data for the project's, keep the class recipes intact.
4. Drop the gallery's own scaffolding (`DocPage`, `DocSection`, demo data modules) — it
   never travels.

## References

- [references/shell.md](references/shell.md) — every component's props, snippets and
  contracts, with incorrect/correct pairs
- [references/theming.md](references/theming.md) — token families and their utility
  classes, the 18 palettes, the appearance hooks, the first-paint script
- [references/install.md](references/install.md) — the registry items, install order,
  manual steps, fidelity notes, troubleshooting
- [references/appearance-export.md](references/appearance-export.md) — applying a
  `parallax-appearance.json` exported from the gallery's Settings page: which keys the
  project can honour, and how to apply them
- [references/bootstrap.md](references/bootstrap.md) — empty directory to running
  dashboard: scaffolding, the hand-written `components.json`, what `init` leaves behind,
  and the version traps
- [references/patterns.md](references/patterns.md) — distilled recipes of the flagship
  gallery patterns (tables in cards, page headers, list group, uploads, typography,
  sizing, data table/grid) with their Parallax-only dependencies flagged
- [references/components.md](references/components.md) — the generated map of the whole
  gallery: every page and every ui/ folder, with source paths
