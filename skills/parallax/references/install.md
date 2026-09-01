# Installing from the Parallax registry

Contents: [What ships](#what-ships) · [Prerequisites](#prerequisites) ·
[Install](#install) · [Manual post-install steps](#manual-post-install-steps) ·
[Fidelity notes](#fidelity-notes) · [Troubleshooting](#troubleshooting)

## What ships

Base URL: `https://octarinacompany.github.io/svelte-theme-parallax/r/<name>.json`. The
complete generated list, with each item's post-install notes, is in the repository's
`docs/REGISTRY.md`; the front door for machines is `public/llms.txt`.

**The foundations**

| Item                           | What it installs                                                        |
| ------------------------------ | ----------------------------------------------------------------------- |
| `parallax-theme`               | The palette: base light/dark tokens, `src/themes.css` (17 alternates), the Tailwind mappings for success/warning/info, the subtle family, `--sidebar-outline` |
| `parallax-appearance`          | The four axes as hooks + `reduced-motion` + the page-header CSS + `src/vibrant.css`, the brand-painted third value of both chrome axes (needs its own `@import`) |
| `parallax-appearance-controls` | `HeaderToggle` + `SidebarModeToggle`                                    |
| `parallax-backdrop`            | The fifth axis: four layers painted BEHIND the page (gradient, pattern, mark, grain) as hooks + `src/backdrops.css` + `public/backdrop-mark.svg` (needs its own `@import`, and the asset moves to `static/` under SvelteKit) |
| `parallax-backdrop-controls`   | `BackdropSelector`, the wand dropdown over the four layers               |
| `parallax-shell`               | The whole shell: AppShell/AppSidebar/PageHeader + nav trio + breadcrumb + `ModeToggle` and `ThemeSelector` + `shared/nav.ts` + the sidebar/drawer CSS |
| `parallax-restyle`             | CSS-only: the Parallax shape for the components whose look is application-global (switch, checkbox, tooltip, inputs, select, sliders, sonner, tabs' line variant) plus the global menu-shadow and dialog-scrim opinions. It selects on `data-slot`, so it reaches a Parallax fork and a bare official port alike |
| `parallax-skill`               | This skill, into `.claude/skills/parallax/`                             |

**One item per house or forked component** — `parallax-<name>`, e.g.
`parallax-data-table`, `parallax-data-grid`, `parallax-action-bar`, `parallax-loader`,
`parallax-tour`, `parallax-kanban`, `parallax-code-block`, `parallax-code-highlighter`, and
the forks that carry house API (`parallax-button` for the control ramp, `parallax-table` for
density, `parallax-badge` for the `*-subtle` variants, `parallax-card`, `parallax-avatar`).
`parallax-primitives` holds the shared infrastructure several of them compose and arrives on
its own.

**What is NOT published**: verbatim ports of official shadcn-svelte components — the
folders Parallax has not touched at all. Install those by their bare official name
(`npx shadcn-svelte@latest add collapsible`); republishing a copy could only go stale.
That list is short — `collapsible`, `label` and `aspect-ratio` are the whole of it today.
Everything else the gallery renders is a fork or a house component and ships under the
Parallax name, `parallax-dialog` and `parallax-card` included, so **do not guess from the
component's name**: a 404 on `.../r/parallax-<name>.json` is the test.

`parallax-shell` depends on `parallax-theme`, `parallax-appearance` and
`parallax-appearance-controls`, plus `parallax-primitives`, `parallax-swap` and the forks
it composes: `parallax-sidebar`, `parallax-breadcrumb`, `parallax-drawer`,
`parallax-dropdown-menu`, `parallax-avatar`, `parallax-separator`, `parallax-button`.
`collapsible` is the one bare official name in the whole chain. One command resolves all of
it, and the same is true of every component item.

## Prerequisites

- Svelte 5 + Tailwind v4 project with shadcn-svelte **1.x** initialised (a
  `components.json` with the `$lib` aliases). Not initialised — or no Svelte project at
  all? [bootstrap.md](bootstrap.md) covers the whole path from an empty directory. Note
  that `init` cannot run unattended (it demands a `--preset` only the docs-site builder
  issues), so a scripted setup writes `components.json` by hand.
- npm dependencies arrive with the items (`mode-watcher`, `@lucide/svelte`,
  `@fontsource-variable/hanken-grotesk`, `svelte-streamdown` with `parallax-message`,
  `shiki` and `@shikijs/langs` with `parallax-code-highlighter`); the CLI adds and installs
  them.

## Install

```sh
# the whole shell (recommended first install — pulls the foundations with it)
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-shell.json

# or the palette alone
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-theme.json

# a single component, with its dependency chain
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-data-table.json
```

Never `--overwrite` on a project that already carries Parallax files without the user's
explicit approval — the files are their code now.

Know what refusing it costs, though, because the CLI does not say. On a project that
already carries Parallax, `add` warns *"The following items already exist"* and asks
whether to overwrite everything — and `--yes` does **not** answer that question. `add` has
exactly two confirmation flags, `--yes` and `--overwrite`, and this prompt is gated on
`--overwrite` alone; left unanswered in a non-interactive shell it cancels, and cancelling
**exits 0 having written nothing**. A scripted second `add` therefore reports success and
installs no files. So a second install needs an interactive terminal, or `--overwrite` and
the user's approval — silence is not success here, check that the files changed.

What `--overwrite` costs is the component files, rewritten from the registry, and the
values of the tokens the items declare. It does not cost the rest of the stylesheet: the
merge runs on that file's PostCSS tree and only adds nodes, so a hand-pasted `@layer base`
block and the `@import` lines above it survive it.

## Manual post-install steps

A registry item cannot patch files that already exist. After `parallax-theme` (direct or
via the shell), do both and tell the user you did:

1. In the global stylesheet, after the Tailwind import:

   ```css
   @import "./themes.css";
   @import "./backdrops.css"; /* only with parallax-backdrop */
   @import "./vibrant.css"; /* only with parallax-appearance */
   @import "@fontsource-variable/hanken-grotesk";
   ```

   The `./` holds only when the stylesheet is `src/app.css`, a sibling of the
   `src/themes.css` the item just wrote. Resolve the path against the stylesheet's own
   directory: a SvelteKit scaffold puts it at `src/routes/layout.css`, which needs
   `../themes.css`. Read `components.json`'s `tailwind.css` for the real location.

   `vibrant.css` arrives with `parallax-appearance` rather than with the palette, and it goes
   AFTER `themes.css`: it states the nine chrome tokens on the painted surfaces, and a
   per-theme chrome block that ties it on specificity would otherwise win on source order.
   Omit it and the two Vibrant menu rows write an attribute nothing selects — the chrome
   simply does not move, with no error anywhere.

   `backdrops.css` arrives with `parallax-backdrop` and sits BETWEEN the two, for the same
   kind of reason: after the palettes so a backdrop can move a page token, before
   `vibrant.css` so an explicit chrome choice outranks a backdrop that decorates the same
   two surfaces. That item also writes `public/backdrop-mark.svg` — **move it to `static/`
   under SvelteKit**, keeping the name, or the mark layer 404s and paints nothing.

2. The **first-paint script** in `index.html` / `src/app.html` — exact copy in
   [theming.md](theming.md#the-first-paint-script).

A third applies only when the stylesheet was **not** created by `shadcn-svelte init` — a
hand-written one, or a project bootstrapped from an empty directory. Then the file is also
missing what `init` writes: the `@layer base` block (`* { @apply border-border
outline-ring/50; }` and the `body` pair) and the `@import "tw-animate-css";` the overlays
animate through. Both are spelled out, with their symptoms, in
[bootstrap.md](bootstrap.md#4-the-three-pieces-init-would-have-left) — and the console
checks in [its step 7](bootstrap.md#7-validate) tell you in one paste whether this project
has them.

A fourth applies after `parallax-message` (directly or through `parallax-reasoning`, which
depends on it). The item installs `svelte-streamdown`, whose Markdown renderer ships pre-built
Tailwind classes in its `dist` that no project file mentions, so the stylesheet must tell
Tailwind to scan the package — one line, next to the imports:

```css
@source "../node_modules/svelte-streamdown/**/*";
```

Resolve the path against the stylesheet's own directory: `../node_modules/…` from `src/app.css`,
`../../node_modules/…` from `src/routes/layout.css`. The symptom of forgetting it is silent: the
answer renders, but tables lose their rules, lists their indents and code blocks their ground.

A fifth applies after `parallax-code-highlighter`. The item writes the adapter; it cannot mount
it. Put ONE `<CodeHighlighter.Root>` at the app root, wrapping everything that renders code —
`src/routes/+layout.svelte` in SvelteKit, the root component in a Vite SPA:

```svelte
<script lang="ts">
	import * as CodeHighlighter from "$lib/components/ui/code-highlighter/index.js";

	let { children } = $props();
</script>

<CodeHighlighter.Root>
	<!-- every CodeBlock.Root and Message.Response below here upgrades as its grammar lands -->
	{@render children()}
</CodeHighlighter.Root>
```

It renders no element and publishes itself on context, so a second one below the first buys
nothing and compiles a second engine. Two things it does **not** need, unlike the step above it:
nothing goes in the stylesheet — no `@source` line — because the adapter reads a grammar's scopes
and paints `code-block`'s own token classes over the theme's tokens, loading no Shiki theme at
all; and nothing is fetched from a network, because each grammar is a
`() => import("@shikijs/langs/<id>")` that the bundler cuts into a chunk of the project's own
build. The symptom of forgetting it is not an error either: a block outside the provider silently
keeps `code-block`'s fourteen house grammars, so a Rust or Dockerfile fence renders in one flat
ink — the body `text-foreground`, near-black in light mode and near-white in dark, never grey —
while the TypeScript one beside it still looks right.

**The adapter's own ceiling is 32 language ids**, declared as `CODE_HIGHLIGHTER_GRAMMARS` in
`ui/code-highlighter/code-highlighter.svelte.ts`. An id outside that table falls back to the
house tokenizer exactly as quietly as a missing provider — Elixir, Lua, Zig, Scala and Haskell
are not carried — so a fence that stays uncoloured with the Root correctly mounted is this case,
not the one above, and the fix is the Root's `grammars` prop rather than a second Root:

```svelte
<CodeHighlighter.Root
	grammars={{ elixir: { name: "elixir", load: () => import("@shikijs/langs/elixir") } }}
>
```

The specifier must be a STRING LITERAL — the bundler has to see it to cut the chunk — and keys
are canonicalised as they merge, so an id the table already carries replaces that row's loader
instead of adding a second one.

Then wire the shell at the app root — the Key Patterns block in SKILL.md is the canonical
shape (data as props, `isActive` predicate, content beside `PageHeader`).

## Fidelity notes

The differences a consumer sees when they install only part of the kit. Close them by
installing the item named, never by hand-porting gallery code:

- Dropdown menus keep the upstream shadow, and tooltips the upstream look, until
  `parallax-restyle` is installed — it carries those application-global opinions, which no
  other item smuggles in.
- The shell's CSS is unlayered and outranks utility classes on the same slots; override
  in plain CSS.
- Without `parallax-restyle`, every button, `select` and bound `<label>` shows an arrow
  instead of a hand: Tailwind v4 ships no pointer default, and that item carries the rule
  (see the hand-cursor rule in SKILL.md's Critical rules).

## Troubleshooting

- **404 on the item URL** — the registry answers only once the demo site is deployed to
  GitHub Pages. Until then, in the Parallax repo:
  `PARALLAX_REGISTRY_HOMEPAGE=http://localhost:<port> npm run registry:build`, then serve
  **`public/`** over HTTP on that port — the PARENT of `public/r`, not `public/r` itself.
  Item URLs are `<homepage>/r/<name>.json`, so serving `r/` as the docroot answers the item
  you asked for and 404s on every cross-item dependency: the install dies mid-chain with
  `Failed to fetch registry from .../r/parallax-sidebar.json: 404` and writes nothing.
  (Bare names still mean the official registry; self-references are absolute URLs.) That
  build rewrites `registry.json` with the local URLs on purpose and leaves the committed
  docs alone — re-run `npm run registry:generate` with the variable unset before committing.
- **`"$lib/components" does not use an existing path alias`** — the consumer's
  `tsconfig.json` lacks the `$lib` paths; add
  `"paths": { "$lib": ["./src/lib"], "$lib/*": ["./src/lib/*"] }`.
- **Sidebar forgets its collapsed state on reload** — the first-paint of the shell reads
  the `sidebar_state` cookie through `getStoredSidebarState()`; make sure the app mounts
  `AppShell` (the provider) rather than a hand-rolled `Sidebar.Provider`.
- **Floating/inverted options "do nothing"** — `parallax-appearance` CSS is missing (the
  axes fail silent by design) or the header lacks the `data-slot` contract; installing
  `parallax-shell` closes both.
- **One-frame wrong-mode flash on load** — the first-paint script is missing or placed
  after other scripts in `<head>`.
- **Borders look near-black in light mode and near-white in dark** — while the ones
  Parallax paints itself (a card header's rule, the sidebar outline) stay correct. The
  `@layer base` block is missing from the global stylesheet, so every `border-*` utility
  inherits `currentColor`. Paste the block above. To confirm in one line, in the console:
  `getComputedStyle(document.body.appendChild(document.createElement("div"))).borderTopColor`
  — it must be `--border` resolved, not your text colour.
- **Overlays open and close with no animation** — dropdown menus, tooltips, the sheet and
  the mobile drawer. `tw-animate-css` is missing: it owns `animate-in` / `fade-in-0` /
  `zoom-in-95`, Tailwind v4 does not, and `init` is what normally installs and imports it.
  `npm i -D tw-animate-css`, then `@import "tw-animate-css";` beside the Tailwind import.
- **Every button shows an arrow where the gallery shows a hand** — Tailwind v4 dropped the
  pointer cursor on buttons, and the rule that restores it ships with **`parallax-restyle`**.
  Install that item; it writes the rule into `@layer base`, where any `cursor-*` utility
  still outranks it per element.
- **Safari's toolbar collapses and expands while scrolling on iPad** — the DOCUMENT is
  scrolling, which the shell is built to prevent: the provider's wrapper is pinned to
  `100dvh` and clipped, and the canvas (`Sidebar.Inset`) is the scroll container. Either the
  shell CSS predates the scroll model (re-run the `add` — with `--overwrite`, and the user's
  approval) or an `overflow-*` / `h-*` utility on one of the two slots overrode it. The
  "shell pinned", "app scroll" and "canvas scrolls" checks in
  [bootstrap.md](bootstrap.md#7-validate) say which.
- **A full-height panel leaves a strip of background at its foot on iPad** — the panel
  carries `h-svh` (or `min-h-svh`, `h-screen`): it is cut to the small viewport while the
  layout viewport is the large one, and the toolbar collapsing uncovers the difference. Drop
  the height. A flex child of the provider's row stretches to the wrapper's `100dvh` on its
  own (or takes `h-full`); the kit's own rail had the same bug, closed by
  `:where([data-slot="sidebar-container"]) { height: auto }`.
- **The header stopped hiding on scroll** — auto-hide reads the bar's own scroll container.
  Either something between the canvas and the header scrolls (an `overflow-x: hidden`
  wrapper computes `overflow-y: auto`, becomes the scroller, and steals the sticky in the
  same move — use `overflow-x: clip`), or the app scrolls a box the header is not inside (a
  page that scrolls its own `<div>` while the canvas never moves), so there is nothing for
  the bar to react to.
- **Closing a menu in the header throws the page to the top** — or Shift+Tab from the page
  back into the bar does. Nothing in the overlay scrolls anything; the movement is the FOCUS
  RESTORE. The canvas reserves `calc(var(--page-header-height) + 0.5rem)` at its top so focus
  never lands under the bar, and the bar is pinned INSIDE that reserve, so its controls read
  as obscured and the scroll to reveal one can never succeed — the bar travels with the
  scrollport, so the page moves and the control does not. `parallax-shell` ships the
  cancellation (`scroll-margin-top: calc((var(--page-header-height) + 0.5rem) * -2)` on
  `[data-slot="page-header"]` and every descendant); an install that predates it is missing
  the rule, and
  `getComputedStyle(document.querySelector('[data-slot=page-header]')).scrollMarginTop` says
  so — it must be negative, else re-run the `add` with `--overwrite`. If the box that jumps is
  a sticky of YOUR OWN inside the canvas, no shipped rule reaches it: stick it below the
  reserve, or restate the cancellation on it and its descendants. `preventScroll` fixes
  neither — bits-ui restores focus with a bare `.focus()`, and Shift+Tab is the browser's own
  sequential-focus scroll, which no script is invoked to prevent.
- **PageDown / Space does nothing after clicking a rail link** — the app's router does not
  move focus to the canvas. Keyboard scrolling starts from the FOCUSED element and walks up
  its ancestors, never across to a sibling scroller; after a rail click focus sits in the
  rail, so the keys have nothing to scroll. After every in-app navigation call
  `document.getElementById("main-content")?.focus({ preventScroll: true })` — `AppShell`
  gives the inset the id, `tabindex={-1}` and `focus-visible:outline-hidden` for exactly this
  — except on a fragment landing, where the heading takes focus instead.
- **Typing near the bottom of a field hides the caret behind the iPad keyboard** — the
  installed `AppShell` predates the visual-viewport follow. iOS resizes only the visual
  viewport when the software keyboard comes up, and `100dvh` tracks the layout viewport, so
  the bottom of the canvas sits behind the keys. The current `AppShell` writes
  `--shell-height` from `window.visualViewport` while a keyboard is up (the wrapper rule reads
  `var(--shell-height, 100dvh)`) and undoes Safari's pan with `window.scrollTo(0, 0)`; re-run
  the `add` with `--overwrite` — with the user's approval, since `AppShell.svelte` is their
  code by then.
