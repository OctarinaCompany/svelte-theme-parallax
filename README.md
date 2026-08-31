# Parallax

[![CI](https://github.com/OctarinaCompany/svelte-theme-parallax/actions/workflows/ci.yml/badge.svg)](https://github.com/OctarinaCompany/svelte-theme-parallax/actions/workflows/ci.yml)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](./LICENSE)

**A dashboard theme kit for [shadcn-svelte](https://shadcn-svelte.com/docs).**
Svelte 5, Vite, Tailwind CSS v4, [Bits UI](https://bits-ui.com) — 128 components under one
coherent theme, eighteen palettes over one token set, an installable application shell, and a
gallery that renders every component on a live page — 122 own one, the other six appear inside
another component's page or the shell (`docs/CONVENTIONS.md` §9 names them).

## Start here — install the skill

Parallax ships an [Agent Skill](./skills/parallax/README.md). It teaches an AI assistant the
registry, the shell's props, the token families and the eighteen palettes, so everything further
down becomes a conversation instead of a manual read. Install it before anything else.

**Pick a scope first.** *Personal* covers every session on the machine, empty directories
included — it is the only scope that can *start* a project. *Project* pins a version the team
commits beside the code, but it needs a project to install into, so it can never be your first
move. Both formats are the same `SKILL.md`, so one source serves both assistants:

|                                             | Claude Code                  | Codex                       |
| ------------------------------------------- | ---------------------------- | --------------------------- |
| **Personal** — every session on this machine | `~/.claude/skills/parallax/` | `~/.codex/skills/parallax/` |
| **Project** — committed with the repository  | `.claude/skills/parallax/`   | `.codex/skills/parallax/`   |

```powershell
# Personal — Windows. Elsewhere the destinations are ~/.claude/... and ~/.codex/...
npx degit OctarinaCompany/svelte-theme-parallax/skills/parallax "$env:USERPROFILE\.claude\skills\parallax"
npx degit OctarinaCompany/svelte-theme-parallax/skills/parallax "$env:USERPROFILE\.codex\skills\parallax"

# Project — run from the project root
npx degit OctarinaCompany/svelte-theme-parallax/skills/parallax .claude/skills/parallax
npx degit OctarinaCompany/svelte-theme-parallax/skills/parallax .codex/skills/parallax
```

One install per machine or per repository, never a per-session step. Re-run with `--force` to
update — degit refuses a destination that is not empty. Keep the `$env:USERPROFILE` form on
Windows: PowerShell expands a bare `~` but passes a QUOTED one through untouched, so
`"~/.claude/skills/parallax"` creates a directory literally named `~` in the current folder. And
the directory name must stay `parallax`, which the spec requires to match the skill's own name.

**Inside a shadcn-svelte project, prefer the registry** over the third command above. Same
destination, but the skill then updates like every other item:

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-skill.json
```

Eight files land in the project's `.claude/skills/parallax/`, and nothing else changes — the item
carries no dependencies and touches no CSS. It needs a working shadcn-svelte project — a
`components.json`, a `tsconfig.json`, Tailwind v4 and Svelte 5 — and stops before writing
anything without one, so a failed run leaves nothing behind.

**Restart your assistant afterwards**, whichever route: skills are discovered when a session
opens, not while one runs. Starting from an empty directory? The skill's
[`bootstrap.md`](./skills/parallax/references/bootstrap.md) then carries the whole path from
nothing to a running dashboard — scaffold, configure, install, wire, validate. Otherwise add the
theme and whatever else you need:
[Using Parallax in another project](#using-parallax-in-another-project).

The library has two kinds of components, and one theme over both:

- **Registry components** — the official shadcn-svelte set, carrying the Parallax look purely
  through the design tokens in `src/app.css`. The component files stay close to upstream so
  upstream fixes remain easy to pick up.
- **House components** — hand-maintained Svelte 5 components (kanban, data grid, sortable,
  editable, gauge, phone input, media player, and many more), written idiomatically for
  Svelte 5 runes and first-class code in this repository.

An app shell (sidebar, breadcrumb, settings page) and a gallery of 122 component pages document
all of it — every sidebar entry that goes anywhere goes somewhere real. The sidebar's thirteen headings are
groups rather than destinations: the catalog is filed as an ordered ladder, where a component
belongs to the first group whose test it passes. The ladder is declared once, in
`src/lib/hooks/route.svelte.ts`, and the routes, the route type and the menu are derived from it.
All of it is distributable: the repository publishes its own shadcn-svelte registry and the Agent
Skill that drives it, so another project installs the theme, the shell or any single component
straight from the URLs below.

## Quick start

Requires Node.js 22.12 or newer on the 22 LTS line, or 24 and above — the `engines` range, and
the two versions CI builds on. Vite 8's own floor is lower; the extra step up is deliberate, so
the project is not the last thing on a machine holding an end-of-life runtime in place.

```bash
npm install
npm run dev              # http://localhost:5173 — hot reload
npm run format:check     # prettier — the only formatting authority
npm run check            # Svelte + TypeScript, 0 errors expected
npm run build            # production build into dist/
npm run preview          # serve that build, under /svelte-theme-parallax/
```

Those four checks are four of the six CI runs; the other two and the grep beside them are in
[CONTRIBUTING.md](./CONTRIBUTING.md#the-quality-gates). The generators are not part of a
newcomer's loop — CI re-runs them and fails on any diff, so they only matter when you have
changed what they read.

`npm run dev` serves at the root, but a build sets an **absolute** base, so `npm run preview`
— like CI and Pages — serves the site under `/svelte-theme-parallax/`. Routes are real paths, so
that difference is visible from the address bar down: `npm run build && npm run preview` is how
you check a deep link and the prerendered pages in the shape they are deployed in. It does not
reproduce the fallback: Vite's preview server rewrites an unknown path to `index.html` and answers
200, where Pages serves `404.html` and answers 404. The two files are byte-identical, so the page
is the same and only the status differs.

## The two-tier rule for `src/lib/components/ui/`

Every component lives in `src/lib/components/ui/`, but the maintenance contract differs by origin:

1. **Registry-origin files stay close to upstream.** The theme lives in the `src/app.css`
   tokens, not in the component markup, so re-running the shadcn-svelte CLI produces a reviewable
   diff instead of a merge war. Edit these only to fix a real divergence, and say why in a comment.
2. **House files are first-class code here.** There is no CLI to re-run for them; they are
   maintained in this repository, follow the house conventions, and open with a header explaining
   what they do and which decisions they embody.

Which tier a folder belongs to is stated in its own files. The house conventions both tiers follow
— naming, variants, status vocabulary, import style — are in
[`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md).

## The app shell

The gallery is served inside a working dashboard shell built on the official
[`sidebar-07` block](https://shadcn-svelte.com/docs/components/sidebar): workspace switcher,
collapsible sidebar (full 16rem / 3rem icon rail), breadcrumb header, user menu, mobile drawer.
The non-obvious behaviours are deliberate and documented where they live:

- **Collapsed state survives reload.** The shadcn-svelte sidebar writes its state cookie but only
  SvelteKit's server-side `load` reads it back; a plain Vite SPA silently forgets. Six lines in
  `src/lib/hooks/sidebar-state.ts` close that gap.
- **Parents become flyouts in the rail.** A collapsed parent entry opens its children in a menu
  beside the rail instead of turning into a dead button. Children are real `<a href>` links, so
  middle-click and "open in new tab" work.
- **The menu is data, not markup.** Workspaces, navigation and user live in one typed file,
  `src/lib/data/dashboard.ts`; the sidebar's anchors ARE the route table of the small path
  router that closes `src/lib/hooks/route.svelte.ts` — the rest of that file is the catalog it
  routes over. A route is a path under the site base — `/components/badge`, never
  `#/components/badge` — which leaves the fragment to the document, where a section anchor
  like `/components/badge#sizes` belongs. Every link is built by that file's `href()`, the
  one place the base is applied.

## Themes

Eighteen palettes over one token set, switchable from the header of every page and documented on
`Components → Themes`. The palette and the light/dark switch are two independent axes: every theme
defines both modes, so `<html class="dark" data-theme="ember">` is an ordinary state.
`mode-watcher` owns both attributes and persists both.

They are **generated, not hand-picked**. `tools/themes/themes.mjs` holds a handful of numbers per
theme — a neutral hue, a chroma scale, a brand, and any status hue that had to move out of the
brand's way — and everything else is derived from the base palette's structure: the lightness
ladder of its neutral ramp, measured in OKLCH, and the token mapping recorded in
[`docs/THEME.md`](./docs/THEME.md). That is what makes a dozen different palettes read as one
family — every surface sits at the same lightness, and only the cast changes.

`Parallax`, the default, is built the other way round: it is not solved from a handful of numbers
but derived from the anchor set in `tools/themes/base.mjs` by a small deterministic per-colour
shift. The shift is drawn from a hash of each colour, never a random number, because the generated
files have to be byte-identical on every run.

The audit is the interesting half. It measures every pairing against the WCAG floor **and**
against the base palette's own number for the same pairing, so a theme that inherits a weakness is
distinguished from one that introduces it — and it checks that a brand never lands on a status
colour, in hue, in lightness, or under simulated deuteranopia and protanopia.
[`docs/THEME.md`](./docs/THEME.md) records what the generator fixes, what it deliberately does
not, and how each collision was resolved.

## Using Parallax in another project

Parallax publishes a **shadcn-svelte registry**, so another project installs from it the way it
installs anything else — the source is copied in and becomes yours, with no runtime dependency on
this repository.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-theme.json
```

One hundred and thirty-one items ship today — the palette, the axes, the shell, the skill, and every Parallax-authored or Parallax-forked ui/ component (verbatim ports of official components are deliberately never published). Their post-install notes live in [`docs/REGISTRY.md`](./docs/REGISTRY.md) — generated beside the manifest, because the registry build strips each item's `docs` field from the published JSON. The flagship items:

| Item | What it installs |
|------|------------------|
| `parallax-theme` | The palette: the base light and dark tokens, `src/themes.css` with the seventeen alternates, and the Tailwind mappings for the families shadcn does not ship — `success`, `warning`, `info`, the subtle family, `--sidebar-outline` |
| `parallax-appearance` | The four appearance axes as persisted state — inverted sidebar, inverted header, floating header, hide-on-scroll — plus the CSS their attributes key on |
| `parallax-appearance-controls` | The two dropdown menus that drive those axes |
| `parallax-swap` | The two-state icon crossfade behind the light/dark toggle — a house primitive absent from the official registry |
| `parallax-shell` | The application shell: sidebar (workspace switcher, navigation, user menu, icon rail, mobile drawer) and page header bar (breadcrumb, search slot, light/dark toggle), taking content as typed props and active-state as a predicate — never a router |
| `parallax-skill` | The [Agent Skill](./skills/parallax/README.md) that teaches an AI assistant to use all of the above correctly — installs into the consumer's `.claude/skills/` |

One thing a registry item cannot do for you: patch a file you already have — hence the
`@import` lines for `src/themes.css` and the typeface, and the first-paint script for your
`index.html`, all stated in the docs page. The appearance CSS keys on
`data-slot="page-header"` and `data-slot="page-header-bar"`; install `parallax-shell` and its
header carries them already — take `parallax-appearance` alone and your own bar has to.

`registry.json` is **generated** — `npm run registry:build` reads the base palette, the
page-header rules and the shell's sidebar/sheet blocks straight out of `src/app.css`, so the
published values cannot drift from the ones `themes:audit` guards. The shell components are the
same files the gallery renders — the demo passes its own data in through their props rather than
keeping a publishable copy, so the published files and the gallery's cannot drift apart. Every house or forked component under
`src/lib/components/ui/` is its own generated item, assembled by an import-graph walk; only
verbatim ports of official components are left unpublished, since the official registry
already serves them. The command palette is the one house component still held back — it
reads this gallery's catalog, and its publishable form is a separate increment.

The machine-readable front door is [`public/llms.txt`](./public/llms.txt) — generated with
the manifest, per the ecosystem's llms.txt convention: every item with its install URL, the
guides, and the whole gallery as fetchable source. The skill's
[`patterns.md`](./skills/parallax/references/patterns.md) distils the flagship gallery
patterns (tables in cards, page headers, uploads, data table/grid…) so an assistant can
reproduce them without the registry publishing them.

> Working on the registry locally: `npm run registry:build` compiles `public/r/`, which Vite
> then copies into `dist/`, and `PARALLAX_REGISTRY_HOMEPAGE` overrides the origin baked into the
> cross-item links. Every push to `main` republishes the site and the registry together.

## Read further

The reasoning lives next to the code it explains: every house module carries a header comment
stating what it does and which decision it embodies, while registry files stay comment-free to
match upstream. [`docs/THEME.md`](./docs/THEME.md) documents
the theme system — the base palette, the ladder, the token mapping, and what the audit enforces.
[`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md) states the house rules in one place.
[`docs/REGISTRY.md`](./docs/REGISTRY.md) is the consumer's page: every published item, its
install URL, and the post-install steps a registry item cannot perform for you.

## Repository layout

| Path | What it holds |
|------|---------------|
| `src/lib/components/ui/` | The component library — registry components and house components, one folder each |
| `src/lib/components/layout/` | `AppShell` (the provider), `AppSidebar` (the three regions), and the doc-page scaffolding |
| `src/lib/components/navigation/` | The composed pieces: switcher, nav groups, user menu |
| `src/lib/components/pages/` | The gallery — every component is rendered by at least one page |
| `src/lib/shared/` | Shared infrastructure the components compose (form control, roving focus, …) |
| `src/lib/hooks/` | The path router, sidebar persistence, `is-mobile`, file-upload state, and the sidebar/header appearance axes |
| `src/lib/themes/` | The theme axis: generated palette data, and the state over `mode-watcher` |
| `src/lib/hooks/route.svelte.ts` | The catalog — the ladder, and the routes derived from it |
| `src/lib/data/` | The demo's own data: the menu's presentation, and this deployment's repository URL |
| `src/themes.css` | The seventeen alternative palettes — **generated** |
| `tools/themes/` | The generator and its audit — the only place a palette is edited |
| `registry.json` | The registry manifest — **generated** by `tools/registry/` |
| `tools/registry/` | The manifest generator, and the `app.css` block reader it uses |
| `tools/site/` | The build steps the gallery itself needs: the per-route prerender, and the example extractor behind each heading's copy-code control |
| `tools/loaders/` | The CSS-in-markup style check behind `npm run loaders:check`, which reads what `svelte-check` cannot see |
| `tools/shared/` | The catalog reader both the registry generator and the prerender step read the route ladder through |
| `skills/parallax/` | The Agent Skill published as `parallax-skill`, with its references and evals |
| `public/llms.txt` | The machine-readable index of every item and guide — **generated** |
| `.github/workflows/pages.yml` | Builds the registry and the gallery — fallback and prerendered pages included, `npm run build` writes those — and deploys the result to Pages on every push to `main` |
| `docs/THEME.md` | The theme system: base palette, ladder, token mapping, audit |
| `docs/CONVENTIONS.md` | House conventions: tiers, naming, status vocabulary, imports |
| `docs/REGISTRY.md` | Every published item and its install URL — **generated** |
| `LICENSE` | MIT |

Two house rules run through all of it: semantic tokens, never raw colours; and one coherent
library — shadcn-svelte standards, one look, zero redundancy.

## Contributing

Contributions are welcome. [`CONTRIBUTING.md`](./CONTRIBUTING.md) explains the quality gates,
the two-tier rule, and what a good pull request looks like here; the
[`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) applies to every community space. Security
concerns go through [`SECURITY.md`](./SECURITY.md), never a public issue. Notable changes are
recorded in [`CHANGELOG.md`](./CHANGELOG.md).

## Licence

[MIT](./LICENSE) — Copyright (c) 2026 Sylvain Le Breton. Third-party components and
dependencies keep their own terms, listed in
[`THIRD-PARTY-NOTICES.md`](./THIRD-PARTY-NOTICES.md).
