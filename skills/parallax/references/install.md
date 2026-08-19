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
| `parallax-theme`               | The palette: base light/dark tokens, `src/themes.css` (11 alternates), the Tailwind mappings for success/warning/info, the subtle family, `--sidebar-outline` |
| `parallax-appearance`          | The four axes as hooks + `reduced-motion` + the page-header CSS         |
| `parallax-appearance-controls` | `HeaderToggle` + `SidebarModeToggle`                                    |
| `parallax-shell`               | The whole shell: AppShell/AppSidebar/PageHeader + nav trio + breadcrumb + theme controls + `shared/nav.ts` + the sidebar/drawer CSS |
| `parallax-restyle`             | CSS-only: the Parallax shape for the OFFICIAL components you install by bare name (switch, checkbox, tooltip, inputs, select, sliders, sonner, tabs' line variant) plus the global menu-shadow and dialog-scrim opinions |
| `parallax-skill`               | This skill, into `.claude/skills/parallax/`                             |

**One item per house or forked component** — `parallax-<name>`, e.g.
`parallax-data-table`, `parallax-data-grid`, `parallax-action-bar`, `parallax-loader`,
`parallax-tour`, `parallax-kanban`, and the forks that carry house API
(`parallax-button` for the control ramp, `parallax-table` for density, `parallax-badge`
for the `*-subtle` variants, `parallax-card`, `parallax-avatar`). `parallax-primitives`
holds the shared infrastructure several of them compose and arrives on its own.

**What is NOT published**: verbatim ports of official shadcn-svelte components. Install
those by their bare official name (`npx shadcn-svelte@latest add dialog`) — republishing a
copy could only go stale.

`parallax-shell` depends on the foundations plus the official `sidebar`, `breadcrumb`,
`drawer`, `dropdown-menu`, `collapsible`, `avatar`, `separator`, `button` — one command
resolves the entire chain, and the same is true of every component item.

## Prerequisites

- Svelte 5 + Tailwind v4 project with shadcn-svelte **1.x** initialised (a
  `components.json` with the `$lib` aliases). Not initialised? Run
  `npx shadcn-svelte@latest init` first, or write `components.json` by hand.
- npm dependencies arrive with the items (`mode-watcher`, `@lucide/svelte`,
  `@fontsource-variable/hanken-grotesk`); the CLI adds and installs them.

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

## Manual post-install steps

A registry item cannot patch files that already exist. After `parallax-theme` (direct or
via the shell), do both and tell the user you did:

1. In the global stylesheet (`src/app.css`), after the Tailwind import:

   ```css
   @import "./themes.css";
   @import "@fontsource-variable/hanken-grotesk";
   ```

2. The **first-paint script** in `index.html` / `src/app.html` — exact copy in
   [theming.md](theming.md#the-first-paint-script).

Then wire the shell at the app root — the Key Patterns block in SKILL.md is the canonical
shape (data as props, `isActive` predicate, content beside `PageHeader`).

## Fidelity notes

The differences a consumer sees when they install only part of the kit. Close them by
installing the item named, never by hand-porting gallery code:

- Buttons: `parallax-shell` depends on the **official** button, so icon buttons run ~36px.
  Add `parallax-button` for the gallery's token-driven 40px control ramp.
- Dropdown menus keep the upstream shadow, and tooltips the upstream look, until
  `parallax-restyle` is installed — it carries those application-global opinions, which no
  other item smuggles in.
- The shell's CSS is unlayered and outranks utility classes on the same slots; override
  in plain CSS.

## Troubleshooting

- **404 on the item URL** — the registry answers only once the demo site is deployed to
  GitHub Pages. Until then, build it locally in the Parallax repo
  (`npm run registry:build`), serve `public/r` over HTTP, and rebuild with
  `PARALLAX_REGISTRY_HOMEPAGE=http://localhost:<port>` so the cross-item URLs resolve
  locally too (bare names mean the official registry; self-references are absolute URLs).
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
