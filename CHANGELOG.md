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
- The path router derived from a single `CATEGORIES` ladder in `src/lib/hooks/route.svelte.ts`;
  routes, route types and the sidebar menu are all generated from it.
- A link to every section: each heading in the gallery carries a control that copies its address
  and navigates to it, so `/components/badge#sizes` can be shared and opened cold. The id is the
  heading's own title, kebab-cased, which means rewording a title moves the address — `DocSection`
  takes an explicit `id` where that is not acceptable.
- **A link to the source, in the bar and on every copied example.** The header carries the
  repository beside the light/dark toggle, and each copied example names both addresses it came
  from — the page and the source. The link rides in through `PageHeader`'s `controls` snippet from
  the demo, never through the published header, so `parallax-shell` is untouched and a consumer's
  application does not gain a link to somebody else's repository. The URL is derived from
  `package.json` at build time, so a fork's remote is the only place it is written down.
- **A card header whose navigation meets the rule.** The Card page gains the shape the classic
  theme called `.card-header-tabs`, beside the pill it already showed: the tab row spans the full
  60px header and the active underline lands on the header's own rule instead of floating inside
  it. Three classes over the `line` tab variant, which already ports the rest.
- **The code of every example, on the clipboard.** A second control beside each heading copies that
  demo as a standalone Svelte component: the markup with the gallery's card frame removed, the
  imports it needs, and the page declarations it reads — carried whole, `$effect`s and types
  included. `tools/site/section-source.mjs` extracts all of it at build time with the compiler's
  own parser, so a page it cannot cut fails the build rather than a reader's click. Where an
  example leans on something only the gallery has — its router, a page's sample data — the copied
  header names it instead of dropping it silently.
- The published registry: `registry.json` is generated from the source by `tools/registry/`,
  compiled into `public/r/`, and deployed to GitHub Pages with the gallery on every push to
  `main` — so the theme, the shell, the Agent Skill and every house component install into
  another project through the shadcn-svelte CLI.
- House conventions written down in `docs/CONVENTIONS.md`; the theme system in `docs/THEME.md`;
  the published items in `docs/REGISTRY.md`.
- CI: formatting, type-checking, production build, the theme audit and the loader-style check
  on every push and pull request.

### Changed

- **Routes are paths under the site base, not fragments.** `#/components/badge` became
  `/components/badge`, which hands the fragment back to the document — a section anchor such
  as `/components/badge#sizes` is now the browser's navigation rather than something the
  router has to arbitrate. Every `#/components/…` address the gallery ever published is
  rewritten to its path on arrival, so an old bookmark still lands on the page it named. Deep
  links are prerendered — one real file per route, beside the SPA fallback — so a shared URL
  answers 200 instead of a 404 page that repairs itself once JavaScript runs. The cost is the
  base: `vite.config.ts` now sets an absolute one in a build (`/svelte-theme-parallax/`, `/`
  in development), so no in-app link may be written by hand — every one goes through `href()`
  in `src/lib/hooks/route.svelte.ts`, the only place a base and a route meet.

### Fixed

- **A squared avatar no longer shows its corners around a circle.** `Avatar.Root` drew its
  hairline ring with a hardcoded `after:rounded-full`, so every call site that squares the avatar
  off — the sidebar footer's `rounded-lg`, a thumbnail's `rounded-md` — got a circle traced over a
  rounded square with the four corners of the fill sticking out. Six gallery pages carried a manual
  `after:rounded-*` beside the box to hide it — the Avatar page even documented the recipe as a
  three-way call (box, ring, fallback) — and the sidebar footer, which ships with the shell, did
  not. The ring, the image and the fallback now take `rounded-[inherit]`, which makes the root the
  only place a radius is written; every workaround and every restated `rounded-*` on a fallback
  is gone, and the Avatar page's radius ramp is one class per rung. `parallax-avatar` and
  `parallax-shell` publish it; the skill states the rule ("a radius has one owner") and gains an eval.
- **The sample video and audio were broken on the published site.** The Media player and Cropper
  demos loaded them from `/assets/…`, which on a project site is the OWNER's root rather than the
  site's, so both 404'd everywhere except a local dev server. They go through the site base now.
- **An auto-hidden header no longer hides an arrival.** A scroll longer than the viewport is not a
  gesture — it is `scrollIntoView` or a router restoring a position — so the bar shows itself and
  starts measuring again from where the reader landed, instead of tucking away the trail that says
  where that is. Behaviour, and `parallax-shell` publishes it.
- **Duplicate element ids on three demo pages.** Two Mask input demos shared one `id`, so a
  `<label for>` pointed at the wrong field; several Timeline and Scroll spy demos rendered one
  dataset more than once. Invalid HTML anywhere, and under a fragment link it silently resolves to
  whichever element comes first.

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
- **The page header bar keeps only the light/dark toggle.** The palette picker and the two
  panel dropdowns (inverted / floating / hide-on-scroll) moved to the gallery's Settings page,
  which names and explains what four unlabelled icon dropdowns could not — and reaches `system`
  mode, which the bar's two-state toggle cannot. Measured at 780px with the sidebar open: the
  cluster went from 377px to 72px, and the search field, which was being squeezed to 18px while
  the cluster overflowed the bar by 41px, now keeps its full 256px. `parallax-shell` still
  installs all four controls; `PageHeader`'s `controls` snippet is how a consumer puts any of
  them back. `ThemeSelector` gains `chromeWear` for that case — the swatch strip used to follow
  the header's light/dark pin whenever `compact` was set, and `compact` stopped meaning "on the
  bar" the moment the picker left it.
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
