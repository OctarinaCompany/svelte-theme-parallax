# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

The first published state of the project. Nothing is tagged yet, so everything the repository
ships today is listed here.

### Added

- **A web app manifest, so the gallery stays an app window on an iOS home screen.** iOS opens a
  home-screen site with no browser chrome and puts the URL bar and toolbar back the moment a
  navigation leaves the app's scope — and with no manifest that scope is the start URL's own
  directory, so the second click on a site whose routes are paths brought Safari's chrome back.
  `public/manifest.webmanifest` states `"scope": "./"` and `"start_url": "./"`, both resolved
  against the manifest's URL so they follow the `/svelte-theme-parallax/` base without being
  written twice, and `index.html` links it beside the Apple tags iOS below 16.4 still needs —
  including a PNG `apple-touch-icon`, without which a home screen shows a screenshot of the page.
  The trap is written up in the skill's `bootstrap.md`, since it belongs to any shell whose routes
  are paths rather than to this gallery.
- **A fifth appearance axis, the page's own scrollbar** — one switch, off by default, over the last
  surface in the kit still speaking the platform's dialect. Turned on, the canvas takes
  `scrollbar-width: thin` and a `scrollbar-color` pair from the palette, the thumb being the same
  `--border` the `ScrollArea` component paints its own with, on a transparent track so a backdrop
  shows through the channel; left off — which is what the kit ships — the bar stays exactly as the
  operating system draws it, since a scrollbar is a platform control before it is a design.
  `page-scrollbar.svelte.ts` writes `data-scrollbar="themed"` on `<html>` and ships with
  `parallax-appearance` beside the one CSS block that reads it, the Settings page carries the
  switch, and the first-paint script echoes the key — which is not cosmetic here, since `thin`
  narrows the reserved gutter (measured: 15px to 10px at 1440px) and a late attribute would move
  the page's width under the reader.
- **The canvas reserves its scrollbar's width, always** — `scrollbar-gutter: stable` on
  `[data-slot="sidebar-inset"]`, shipped with `parallax-shell` and deliberately outside the axis
  above: reserving the width is a fix, dressing the bar is a taste, and only the taste switches.
  Navigating between a page that overflows and one that does not stopped resizing the canvas, which
  used to slide the centred reading column by half a scrollbar on every step. Measured: the
  reservation is inline-axis only — 15px at the inline edge, 0 at the block end even with content
  overflowing on both axes — so no empty band appears along the bottom, and it is inert wherever
  scrollbars are overlays, since an overlay bar consumes no space for a gutter to hold open.
- **A reading panel in the header bar**, where the backdrop's wand used to sit: one `Aa` trigger
  over the two settings that decide how a page is READ rather than how it looks — its text size,
  in four steps, and the width of its content column, in four more. Both are stored per device and
  neither is part of the look a consumer installs, which is what earns them a place on a bar the
  kit otherwise keeps for the light/dark toggle alone; every appearance axis, the backdrop now
  included, lives on the Settings page where it can be named and explained. The text size is one
  multiplier, `--text-factor`, which the type ramp in `src/app.css` now carries on every step —
  `@theme inline` inlines the multiplication into each `text-*` utility, so it resolves per
  element against whatever scope sets it, exactly as `--radius-factor` already did for the radius
  ramp. It ships inert (the factor defaults to 1 and the rendering is unchanged to the pixel), and
  a consumer can now scale the kit's type in any container — or at `:root`, which catches portaled
  overlays too. Only the type scales: control heights, spacing and radii keep their own ramps, so
  the top step stops at 1.3, where the densest 1.5rem control tier is 1.3px over its line box and
  still spills rather than clips.
- Six more palettes, taking the set to eighteen. Three widen the spectrum: `moss` and `fern`
  fill the 104° of hue circle that had nothing in it between Sandstone and Evergreen — the
  yellow-green and the kit's first true green — and `heather` takes the untouched arc between
  Amethyst and Orchid, the first purple here that keeps its full chroma on the dark page. Three
  depart on the axes the kit had never moved rather than on hue: `bluestone` is a deep, quiet
  petrol that enters the crowded blue arc by lightness, `damson` tints every neutral to the
  brand's own hue in both modes so nothing reads as grey, and `kiln` pairs the only warm
  near-achromatic neutrals with a deep bronze. Each is eight numbers in `tools/themes/themes.mjs`;
  every token is solved from them by the generator and cleared by the audit.
- A third value on both chrome axes, `vibrant`: the palette's own brand painted onto the rail
  and the bar as one corner light, rather than a light or dark half. It is authored as ONE field
  sized to the viewport and sampled by both surfaces, so the rail gets a full fall down its
  height and the bar a full sweep across the window, and the two meet at the elbow with no seam
  — the join survives the icon rail, off-canvas, the mobile Sheet and every breakpoint with no
  media query. Every colour derives from the live tokens, so it composes with all eighteen
  palettes in both modes. It ships from `parallax-appearance` as `src/vibrant.css`, beside the
  hooks that write the attribute, and needs the one `@import` a registry item cannot add for you.
- The backdrop axis, a fifth appearance control and the only one that paints nothing the other
  four own: the palette and the mode decide what the surfaces are painted WITH, a backdrop
  decides what is painted BEHIND them. Four independent layers compose — a gradient lit from a
  bearing you choose (twelve looks), a drawn lattice that fades out over a length you choose
  (ten), one SVG mark placed from a corner or the centre, scaled and turned, and a grain over all of it — with
  twelve adjustments over sixteen `localStorage` keys — eleven numeric and clamped, plus the
  mark's corner. Every colour derives from the live
  tokens, so one stylesheet serves all eighteen palettes in both modes rather than eighteen
  hand-written blocks per look, and `none` writes no attribute, so the kit as it ships costs
  nothing. It publishes as `parallax-backdrop` (the hook, `src/backdrops.css` and the mark's SVG)
  and `parallax-backdrop-controls` (the wand dropdown over the four layers).
- The AI chat family: twelve house components under a new `AI chat` catalog group —
  conversation, message (Markdown through `svelte-streamdown`), prompt input, suggestion,
  reasoning, tool, chain of thought, task, confirmation, question, context usage and model
  selector — ported from Vercel's AI Elements to this kit's primitives, each published as a
  `parallax-<name>` registry item and documented by a page with an API reference. `code-block`
  gains a `filename` prop and a `CodeBlock.DownloadButton`.
- Attachments and an action menu on `prompt-input`, the follow-up its first release named:
  `PromptInput.Attachments` and `.Attachment` above the textarea, `.ActionMenu` with
  `.ActionAddAttachments`, and files arriving from the menu, a drop or a paste. `accept` (media
  types **and** extensions), `multiple` as a real ceiling, `maxFiles` and `maxFileSize` are
  enforced in code rather than left to the input's attributes, and a partial rejection is
  reported rather than swallowed. `onSubmit` receives `{ text, files }`, each file carrying the
  picked `File` beside the object URL the composer owns and revokes.
- Branch navigation on `message`: `Message.Branch` around the alternatives a regenerate leaves
  behind, with `.BranchContent`, `.BranchSelector`, `.BranchPrevious`, `.BranchNext` and an
  announced `.BranchPage` counter. The alternatives are a `branches: Snippet[]` prop — Svelte
  cannot count children the way the React original does — and only the active one is mounted.
- A `Chat surface` page under `Patterns`, the sixth: the AI chat family composed into one working
  screen — a scrolling transcript carrying a reasoning trace and a tool call, a branch pager over a
  regenerated answer, starters before the first message, and a live composer with its action menu
  and attachments — driven by local state and a simulated reply, so it runs with no transport, no
  network and no `ai` dependency. It ships no component of its own, so it owes no API reference;
  what it documents instead is the wiring a reader has to copy — which element is the scroll
  container and why `min-h-0` is what makes it one, where the composer sits relative to it, how a
  streaming turn keeps the viewport pinned, why the transcript is keyed by message id, and what a
  caller owns against what the components own.
- Four languages in `code-block`: `csv`, `md`, `sql` and `yaml`, each with the label, registered
  MIME type and extension its downloads need — a ```` ```csv customers.csv ```` fence in a chat
  answer used to render under the label `Text` and save as `text/plain`. SQL brings the `--` line
  comment and a case-insensitive keyword table; YAML shares JSON's literal rule; Markdown, like
  `text`, declares no grammar at all, because prose is where a highlighter does damage.
- **A Shiki adapter behind `code-block`, painting in the theme's own ink.** `code-highlighter`
  is a new house component, published as `parallax-code-highlighter`. An application mounts
  `<CodeHighlighter.Root>` ONCE, at its root: it renders no element, publishes itself on context,
  and every code block below it — a chat answer's fences included — gets real TextMate grammars
  for 32 languages. No Shiki theme is loaded and no hex is written. The adapter reads each run's
  scope stack and maps it onto the nine token kinds the block already paints, so all twelve
  palettes and both modes keep working, and turning the provider on changes WHAT is coloured,
  never how the kit colours it. What that buys is the answer a line-at-a-time tokenizer cannot
  give: a `/* … */` comment is still a comment on its second line, and a docstring or a template
  literal keeps its ink past its first. Grammars are lazy and literal — one
  `() => import("@shikijs/langs/<id>")` each — so a language becomes one chunk of the consumer's
  own bundle, arriving on first use, and nothing is fetched from a CDN. The item depends on
  `parallax-code-block` and that edge never reverses, which is what keeps it optional: a block
  with no provider above it keeps the fourteen house grammars, and nothing errors. `code-block`
  itself gained what made the adapter possible — the `CodeBlockHighlighter` seam and the context
  its own folder owns — plus a `language` prop that reads any id rather than the closed fourteen,
  and case-insensitive alias resolution. That last pair closed a bug a reader could see: a
  ```` ```javascript ```` fence used to be captioned "javascript", badged "Text" and left
  uncoloured — every run painted in the body ink — while a ```` ```js ```` fence two messages
  later was coloured.
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
- **One mark for "which one am I on?".** The sidebar's active item, the horizontal `line` tab
  row, the vertical one turned a quarter, and the two hand-rolled tab rows on the Chart and Page
  headers pages now all carry the same shape: `primary` with a `var(--radius)` curve on its
  free edge — the edge that touches nothing, so the anchored one stays square and the mark sits on
  the rule it is measured onto. Two weights, split by axis: 6px for a mark that runs horizontally,
  5px for one that runs vertically, because the same stroke reads heavier lying down. The vertical tab list gained that rule down its right edge, where
  it used to wear the horizontal reading's along its bottom. It replaces a ladder of 2px, 1px and
  2px that had no reading.
- **A card header whose navigation meets the rule.** The Card page gains the shape the classic
  theme called `.card-header-tabs`, beside the pill it already showed: the tab row spans the full
  60px header and the active mark lands on the header's own rule instead of floating inside
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

- **The shell owns the scroll.** `parallax-shell` now pins `Sidebar.Provider`'s wrapper to
  `100dvh` and clips it, and makes `Sidebar.Inset` — the `<main>` — the one scroll container:
  `overflow-y: auto`, `overscroll-behavior-y: contain` so a flick at the end of the canvas does
  not chain into the document, and the `scroll-padding-top` that used to sit on `:root`, because
  `scrollIntoView` and a fragment honour the padding of the container that scrolls. The document
  never scrolls inside the shell, so iOS and iPadOS Safari never collapse their toolbars
  mid-scroll — a browser gesture a dashboard has no use for, and the one that exposed the rail
  strip fixed below — and `100dvh` is the viewport as it stands: only rotation, or a software
  keyboard, changes it, and `svh` / `lvh` would still be wrong there. The keyboard is followed,
  because iOS resizes only the visual viewport when one comes up and `dvh` tracks the layout
  viewport: `AppShell` writes `--shell-height` from `window.visualViewport` while a software
  keyboard is up — the wrapper rule reads `var(--shell-height, 100dvh)` — and undoes Safari's
  visual-viewport pan with `window.scrollTo(0, 0)`; a hardware or floating keyboard changes
  nothing. A touch that starts on chrome outside the canvas — the rail, the header, a right
  rail — used to rubber-band the document itself on iOS, which `contain` on the canvas cannot
  reach; `:root` now carries `overscroll-behavior: none`, scoped by `:has()` to a document that
  holds the shell. `@media print` releases both boxes, so a print is the whole page rather than
  one viewport. `PageHeader`'s auto-hide, masonry, scroll spy and the tour ask their scroll
  parent through the new `scroll-parent` module in `src/lib/shared/` (published with
  `parallax-primitives`; `documentScrollerOf` is the one spelling of the document fallback, and
  `offsetWithin` accounts for the scroller's `clientTop`), so each works in a shell that owns
  its scroll and on a page where the document still does; the selection toolbar, the media
  player's seek tooltip and the tour's spotlight listen in the capture phase instead, which
  hears every scroll container at once. Masonry's child mode publishes the consumer's element
  through an attachment, so it virtualises against the scroll parent too. The gallery router
  restores the canvas's position rather than the window's, and moves focus to the canvas after
  every in-app navigation: PageDown, Space and the arrows scroll from the focused element
  upwards, never across to a sibling scroller, so a router that only scrolls leaves the keys
  dead after a rail click — a fragment landing focuses its heading instead. The contract for a
  consumer, stated in the skill: nothing inside the shell claims `h-svh` / `min-h-svh` /
  `h-screen` (a full-height panel beside the canvas stretches as a flex child of the provider's
  row, and is `relative` when it hosts an absolute pull-strip — `sticky` used to provide the
  containing block), nothing reads `window.scrollY`, the router focuses `#main-content` after
  navigating, and no scroll container may sit between the canvas and the header. The rules are
  unlayered and `:where()`, so a consumer who wants the document back overrides with `!`
  utilities on the inset and the provider.
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

- **A control inside an inverted or vibrant surface is now styled FOR that surface, rules
  included.** The chrome block gave such a control the right colours; nothing gave it the right
  rules, because `dark:` meant "the page is dark" and a rail can be dark while the page is light.
  `@custom-variant dark` now names the two chrome surfaces beside `.dark`, so `dark:` means "the
  ground under this element is dark" — 153 utilities across the kit follow the surface they sit on
  rather than the document. Nothing new is stamped on the DOM: both hooks already resolve their
  axis to an absolute `light`/`dark`/`vibrant` on `<html>` and the first-paint script writes the
  same, so this is a stylesheet change with no component, hook or snippet touched. Every branch is
  pinned to (0,1,0) with `:where()`, which keeps a compiled `dark:` utility at (0,2,0) — where it
  ties with `hover:` and `data-[state]:` and source order decides, exactly as before.
- **A field inside a vibrant surface on a dark page was rendering its text on its own
  background** — 1.00:1, measured, on `Input`, `Textarea`, `InputGroup` and `NativeSelect`. Their
  `.dark` fills paint `var(--input)`, and `--input` means two different things: a control's dark
  ground on the page, a hairline on a chrome surface — and under `vibrant` a solved near-white
  boundary ink, which is also what the surface hands its children as text. The three fill rules now
  fence themselves out of chrome, so a field there keeps its transparent ground and is read from
  its border. Measured after: 9.7:1 inside the rail, and the page's own fields unchanged at 10.93:1.
  The rule behind it — a chrome surface imposes its own half of the palette, values AND rules —
  is written up in `docs/CONVENTIONS.md` §8, in the skill's `theming.md`, and in
  `parallax-appearance`'s own docs, since the variant lives in a line only the consumer can write.
- **A control inside the chrome now paints in the chrome's colours, on both surfaces and in the
  menus they open.** The nine `--sidebar-*` tokens describe the chrome, but the components dropped
  into it read PAGE tokens — a Button says `bg-background`, an Input says `bg-card`, a menu row
  says `bg-accent` — and only the header bar had a block projecting one family onto the other, six
  tokens wide. The rail had none at all, and the block for portaled menus stopped four tokens
  short. Three lists, no two the same, with nothing keeping them in step; the visible results were
  the reading panel's buttons rendering near-white on near-white over a vibrant bar, its focus
  border page-blue at 2.15:1 against that pane (below 3:1 in all eighteen palettes), the account
  avatar drawing a near-white page puck on a navy rail in both `inverted` and `vibrant`, and the
  flush rail's own outer edge drawing the page's `--border` at 12.09:1 against the panel it edges.
  The bar's block is now ONE selector list covering the bar, the rail and the mobile Sheet, widened
  to eleven tokens; the vibrant menu block covers eleven too; and the flush rail's edge takes
  `--sidebar-outline` like every other edge drawn on that panel. Eight of the eleven were measured
  byte-identical to their chrome counterparts across all 36 palette blocks, so they cannot change
  anything a chrome axis has not already changed — `--background` and `--card` are the two that
  move, which is the repair rather than a side effect. `--primary`, `--secondary` and
  `--destructive` are deliberately left alone: a brand CTA and a status colour must read the same
  on every surface.
- **The vibrant focus halo reaches the controls the bar actually holds.** It selected
  `[data-slot="button"], button`, and half the bar is neither: the repository link is an `<a>` and
  `ModeToggle` — `PageHeader`'s DEFAULT control, so every consumer has one — is a
  `<div role="button">`. Both took the page's focus ring on a painted surface.
- **The mobile sidebar no longer draws a pale line down its inner edge under a dark rail.**
  Below the breakpoint the sidebar renders through `Sheet.Content`, whose own 1px `border-r`
  took the PAGE's `--border` from the `@layer base` default — invisible while the panel follows
  the page, and a near-white hairline the full height of a dark panel under a light one, in
  `inverted` and `vibrant` alike (measured at 390px: `#eef3fa` on `#182f4f`). The sheet is the
  floating rail's mobile counterpart, so its edge now reads `--sidebar-outline`, the token the
  floating ring already draws with: one step off the panel in either mode. Under `vibrant` the
  same token is the lit hairline, and `vibrant.css` also runs the field under the border — the
  component paints `bg-clip-padding`, so on the token alone the white alpha would land on the
  scrim behind the panel rather than on the panel, where the desktop ring draws it.
- **A tap on a destination in the mobile sidebar now dismisses the sheet.** shadcn's sidebar
  leaves closing the mobile Sheet to the caller, and nothing here did: the link navigated, the
  page changed underneath, and the sheet stayed up until the reader found the scrim. `NavMain`'s
  destination links and sub-items — the two links that render on mobile — now close it on the
  way out, for the same clicks a client-side router would act on: a modified or non-primary
  click opens a new tab and leaves the sheet where it is. Category rows are toggles and are
  left alone; on desktop the rail is not an overlay and nothing moves.
- The backdrop's three kill switches reached the wrapper's layers and the header's band but not
  the pair carrying the mark and the grain — `[data-slot="sidebar-inset"]::before` and
  `[data-slot="page-header"]::after`. Under `prefers-contrast: more`, `forced-colors: active` and
  in print, both kept painting: the `background-image: none` rules beside them name the HOSTS,
  which never reaches a pseudo-element. All three lists now drop them by name, which in print is
  the one that cost paper — the grain tiles at 256px over every sheet and the mark is
  `position: fixed`, so it prints once per page.
- **The sidebar rail no longer leaves a strip of background at its foot on iPadOS Safari.**
  `sidebar-container` is `fixed inset-y-0 … h-svh` upstream — over-constrained, and `bottom` is
  the declaration the browser drops, so the rail was cut to the SMALL viewport (the one with the
  toolbars expanded) while a fixed box is laid out against the LARGE one. Collapsing the toolbar
  uncovered the difference; nothing scrolled. `parallax-shell` now ships
  `:where([data-slot="sidebar-container"]) { height: auto }` and lets `inset-y-0` size the rail,
  which fills the layout viewport exactly on every platform — `100dvh` would have closed the same
  gap but re-laid the rail out on every toolbar animation, a jump on the one axis a navigation
  rail must hold still. Both desktop variants measured at exactly `innerHeight`. The rule keeps
  its job for a consumer who unlocks the document again.
- **A streamed answer no longer strands its last screenful below the fold.** `Conversation`
  released its pin on any downward scroll that landed short of the bottom, and the tail of its
  own smooth scroll is exactly that: the step that touches the bottom clears the animating flag,
  the content keeps growing, and the remaining steps of the animation the browser is still
  running arrive short — read as the reader leaving. Nothing re-arms the pin after that, so the
  viewport stopped following mid-answer with the scroll button up. Measured on the Chat surface
  pattern: pinned through growth in 24px steps, released on a step that landed 27px short, ending
  148px from the bottom. A reader who is pinned is at the bottom and cannot scroll further down,
  so only a scroll towards the TOP releases now, and a settle that lands short re-aims instead of
  judging. Verified against a 303px single-frame growth, and the reader's own control is
  unchanged: scrolling up releases, growth while released moves nothing, the button re-pins.

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
  `cursor-*` utility still overrides it per element. A sweep of all 120 gallery pages added
  what was missing beside buttons: `select`, bound `<label>`s (the kit was already
  inconsistent there, because `cursor` inherits) and the ARIA roles that stand for a control
  when it is built from a `div`. The deliberate exceptions are unchanged and now written down
  in `docs/CONVENTIONS.md` §8.
- The Tables in cards gallery page now drops its secondary columns by CARD width
  (`@container` plus arbitrary `@min-[38rem]`-style container variants) rather than by viewport breakpoint: `lg:` / `xl:`
  cannot see the 250px the sidebar already spent, so a viewport-keyed column stays long after
  the room for it is gone.
