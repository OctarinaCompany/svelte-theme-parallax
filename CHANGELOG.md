# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

The first published state of the project. Nothing is tagged yet, so everything the repository
ships today is listed here.

### Added

- The component library under `src/lib/components/ui/` — the shadcn-svelte registry set plus
  the house components (kanban, data grid, sortable, editable, gauge, phone input, media
  player, and many more), all under one token set.
- The gallery: every component documented by at least one live page, served inside a working
  dashboard shell (collapsible sidebar with flyouts, breadcrumb header, theme picker, mobile
  drawer).
- The theme system: twelve palettes generated from a handful of numbers per theme by
  `tools/themes/generate.mjs`, audited by `tools/themes/audit.mjs` for contrast, brand/status
  separation and CVD collisions — the audit is a CI gate.
- The sizing charter: one control ramp (`--control-h-*`: 24/32/40/48 px) consumed by every
  sized control, and per-surface density tiers on tables and cards.
- The hash router derived from a single `CATEGORIES` ladder in `src/lib/hooks/route.svelte.ts`;
  routes, route types and the sidebar menu are all generated from it.
- The published registry: `registry.json` is generated from the source by `tools/registry/`,
  compiled into `public/r/`, and deployed to GitHub Pages with the gallery on every push to
  `main` — so the theme, the shell, the Agent Skill and every house component install into
  another project through the shadcn-svelte CLI.
- House conventions written down in `docs/CONVENTIONS.md`; the theme system in `docs/THEME.md`;
  the published items in `docs/REGISTRY.md`.
- CI: formatting, type-checking, production build, the theme audit and the loader-style check
  on every push and pull request.

### Fixed

- **The page canvas can no longer be widened by its own content.** `parallax-shell` now ships
  `:where([data-slot="sidebar-inset"]) { min-width: 0 }`. Without it the canvas is a flex item
  whose automatic minimum size is the min-content of the whole page, so anything wider than the
  viewport — a table, most often — pushed the shell past the window and put a horizontal
  scrollbar on the DOCUMENT, sliding the sidebar and the header bar off with it. A table's own
  `overflow-x-auto` container never prevented this: it isolates the overflow, not the min-content
  that travels up to the flex item. Nine gallery pages overflowed at 1280px and sixty-six at
  768px; none do now.

  **The contract this changes:** content that does not fit now scrolls inside its own box instead
  of widening the page. A consumer who deliberately wants a wide canvas to widen the document
  overrides with `min-w-max!` on the inset — the `!` because Parallax CSS is unlayered — or with
  a rule of their own, which the zero-specificity `:where()` lets through unaided.
- **The hand cursor now reaches consumer projects, and covers more of the kit.** Tailwind v4
  ships no pointer default on buttons, and the rule that restored it lived in a block no
  registry item carried — so a project built on Parallax showed an arrow on every button where
  the gallery showed a hand. It now ships with `parallax-restyle`, in `@layer base`, where a
  `cursor-*` utility still overrides it per element. A sweep of all 121 gallery pages added
  what was missing beside buttons: `select`, bound `<label>`s (the kit was already
  inconsistent there, because `cursor` inherits) and the ARIA roles that stand for a control
  when it is built from a `div`. The deliberate exceptions are unchanged and now written down
  in `docs/CONVENTIONS.md` §8.
- The Tables in cards gallery page now drops its secondary columns by CARD width
  (`@container` plus arbitrary `@min-[38rem]`-style container variants) rather than by viewport breakpoint: `lg:` / `xl:`
  cannot see the 250px the sidebar already spent, so a viewport-keyed column stays long after
  the room for it is gone.
