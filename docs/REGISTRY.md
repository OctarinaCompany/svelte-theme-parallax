# The Parallax registry

GENERATED — the text lives in `tools/registry/generate.mjs`; edit it there and re-run
`npm run registry:generate`. It is duplicated out of `registry.json` because the registry
build strips each item's `docs` field from the published JSON.

## parallax-theme

The Parallax palette: the base light and dark tokens, the seventeen alternate palettes behind `data-theme`, and the Tailwind mappings for the token families shadcn does not ship — success, warning, info, the subtle family, and `--sidebar-outline`.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-theme.json
```

Two manual steps, because a registry item writes files and cannot patch the ones you already have.

1. Import the alternate palettes from your global stylesheet, after the Tailwind import: `@import "./themes.css";` — the `./` holds only when that stylesheet is a SIBLING of the `src/themes.css` this item just wrote. Resolve the path against the directory of the stylesheet itself: a SvelteKit scaffold puts it at `src/routes/layout.css`, which needs `../themes.css`. The `tailwind.css` entry in `components.json` names the real location.
2. Import the typeface the same way: `@import "@fontsource-variable/hanken-grotesk";`

A third applies only if your stylesheet was NOT created by `shadcn-svelte init` — check it for the `@layer base` block with `* { @apply border-border outline-ring/50; }` and for `@import "tw-animate-css";`, and add whichever is absent. Tailwind v4's preflight gives borders a width and a style but no colour, so without that rule every `border-*` utility falls back to `currentColor` and the hairlines wear the text colour instead. Nothing errors, the page renders, and only the borders are wrong.

`parallax` is the base — it IS the `:root` and `.dark` this item just wrote, so it has no `[data-theme]` block of its own. The other seventeen answer to `data-theme` on `<html>`; `mode-watcher` owns that attribute and persists it under `mode-watcher-theme`.

## parallax-appearance

The four appearance axes as persisted state: the sidebar's chrome and the header's chrome — each of them `default`, `inverted` or `vibrant` — a floating header, and a header that hides on scroll down. Module-level runes that write attributes on `<html>`, plus the CSS those attributes key on, `src/vibrant.css` included.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-appearance.json
```

### One manual step

Import the third value's stylesheet from your global stylesheet, after the Tailwind import and after `./themes.css`: `@import "./vibrant.css";`. The `./` holds only when that stylesheet is a SIBLING of the `src/vibrant.css` this item just wrote — resolve the path against the directory of the stylesheet itself, which `components.json`'s `tailwind.css` entry names. The order is part of it: `vibrant.css` states the nine chrome tokens ON the two painted surfaces, and it is imported after the palettes so that a per-theme chrome block cannot take them back.

Skip the step and `default` and `inverted` still work perfectly — but the Vibrant row in either menu writes an attribute nothing selects, and the chrome does not move.

### The contract

The CSS this installed keys on attributes your own header has to write. Nothing paints until it does:

- `data-slot="page-header"` on the outer sticky element — the one the floating fade hangs off, the auto-hide translates, and the vibrant paint reads to place its corner light.
- `data-slot="page-header-bar"` on the bar inside it — this is what the inverted palette and the vibrant paint both select, and what re-scopes the nine chrome tokens onto the controls.
- `data-floating` and `data-hidden` on the outer element, present or absent, from `headerFloating.current` and the auto-hide state.

A vibrant RAIL asks one thing more, and it comes from shadcn's own sidebar rather than from you: `data-sidebar="sidebar"` on the panel, which is the element the paint block states its tokens on.

The two mode axes need nothing from you: `header-mode` and `sidebar-mode` write `data-header-mode` and `data-sidebar-mode` on `<html>` themselves. The sidebar's floating axis needs nothing either — pass shadcn's own `variant="floating"` when `sidebarFloating.current` is set.

### The first-paint script

Add this to the `<head>` of your `index.html` (or `src/app.html` under SvelteKit), before anything else runs. Without it the page paints in the page's own mode for one frame and then snaps to the chosen one — a visible flash on every load, which no client code can prevent because it happens before hydration.

```html
<script>
  try {
    var root = document.documentElement;
    var mode = localStorage.getItem("mode-watcher-mode") || "system";
    var dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    var rail = localStorage.getItem("sidebar-mode");
    var railVibrant = rail === "vibrant";
    // "dark" is the retired absolute spelling of inverted, which the hook still migrates.
    var railInverted = rail === "inverted" || rail === "dark";
    var railWear = railVibrant ? "dark" : railInverted ? (dark ? "light" : "dark") : dark ? "dark" : "light";
    if (railVibrant) root.setAttribute("data-sidebar-mode", "vibrant");
    else if (railInverted) root.setAttribute("data-sidebar-mode", railWear);
    var bar = localStorage.getItem("header-mode");
    if (bar === "vibrant") root.setAttribute("data-header-mode", "vibrant");
    else {
      var barWear = bar === "inverted" ? (dark ? "light" : "dark") : dark ? "dark" : "light";
      if (railVibrant || barWear !== railWear) root.setAttribute("data-header-mode", barWear);
    }
  } catch (e) {}
</script>
```

Keep it in step with the hooks: it repeats their resolution, and every `localStorage` key it reads is exported from one of them as a constant.

`vibrant` is the exception on both counts, which is what the two extra branches buy. It is ABSOLUTE, so it is written verbatim rather than resolved against the page; and it states its nine tokens on the painted surface rather than on `<html>`, so beside a vibrant rail there is nothing for the bar to inherit and the bar writes its own value even when the two wears agree.

## parallax-appearance-controls

The two dropdown menus that drive the axes: one for the sidebar (default, inverted or vibrant, plus floating) and one for the header (the same three, plus floating and hide on scroll). Put them on a settings page — or back in the header bar through `PageHeader`'s `controls` snippet — and the axes become user-facing.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-appearance-controls.json
```

Both are icon-sized `DropdownMenu` triggers, for a settings page or a header's right-hand cluster. `parallax-shell`'s own header does not render them — its `controls` snippet is the light/dark toggle alone — so mount them where they belong in your app. They read and write the hooks directly, so they take no props and hold no state of their own.

## parallax-backdrop

The backdrop axis: four layers painted BEHIND the page, each independent — a gradient lit from a bearing you choose (twelve), a drawn lattice that fades out over a length you choose (ten), one SVG mark placed from a corner or the centre, and a grain over all of it. Persisted state plus the stylesheet its attributes key on. Every layer derives its colours from the live tokens, so one block serves all eighteen palettes in both modes.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-backdrop.json
```

### Two manual steps

1. Import the stylesheet from your global stylesheet, after the Tailwind import and after `./themes.css`: `@import "./backdrops.css";`. The `./` holds only when that stylesheet is a SIBLING of the `src/backdrops.css` this item just wrote — resolve the path against the directory of the stylesheet itself, which `components.json`'s `tailwind.css` entry names. If you also import `./vibrant.css` (it ships with `parallax-appearance`), the backdrop goes FIRST: an explicit chrome choice has to outrank a backdrop decorating the same two surfaces, and source order is what settles the tie.
2. The first-paint script below, in the `<head>` before anything else runs. Without it a page with a backdrop stored paints one frame with none.

**And one file to move, under SvelteKit.** The mark layer draws `backdrop-mark.svg`, which this item wrote to `public/` — where Vite serves static files from. SvelteKit serves `static/`: move it there, keeping the name. The hook builds the URL from `import.meta.env.BASE_URL` and fails silently when it 404s, so a mark that never appears is this. Replace the file with your own whenever you like — same name, same place. It is fetched, inlined and re-inked from the live tokens, so it must be a single-colour SVG drawn with `fill="currentColor"`.

### The contract

Every PAINTING rule in `backdrops.css` hangs off the shell's own slots (the root token blocks and the accessibility neutralisers aside). Installed beside a layout that writes none of them, the axis stores its choice, writes its attributes on `<html>`, builds its images — and paints NOTHING, with no error anywhere:

- `data-slot="sidebar-wrapper"` and `data-slot="sidebar-inset"` — shadcn's own sidebar provider and inset. The light and the lattice hang off the wrapper; the mark and the grain ride a pair of their own, `sidebar-inset::before` and `page-header::after`.
- `data-slot="page-header"` and `data-slot="page-header-bar"` — the same header contract `parallax-appearance` states; `PageHeader` from `parallax-shell` writes both.
- `data-sidebar="sidebar"` on the rail panel, which the official sidebar writes. This one and `page-header-bar` are needed only so the contrast, forced-colours and print blocks can take a backdrop back off those two surfaces.

`parallax-shell` satisfies all of it, and is the intended host. A hand-rolled shell has to write them itself.

### The first-paint script

Ten of the axis's sixteen `localStorage` keys — the six mark details are deliberately not among them, for the reason below — and the four layer attributes are ECHOED rather than validated — a stale id selects no block for one frame and the hook repairs the attribute at module evaluation. The six numeric adjustments this script echoes are CLAMPED rather than merely parsed: the stylesheet divides by `(1 - A) + A*k` to make an intensity saturate, and that denominator only stays positive while `k >= 0`, so one negative value out of storage would take a whole declaration out. `Number(null)` is `0`, so absent has to be told apart from zero before coercing — that is what `num()` is for. Drop it and a first visit writes `--backdrop-gradient-k: 0`, which takes every alpha the gradient mixes down to nothing: the layer is on, the attribute is set, and the page looks exactly as if it were off.

```html
<script>
  function num(key) {
    var raw = localStorage.getItem(key);
    if (raw === null || raw === "") return null;
    var value = Number(raw);
    return isFinite(value) ? value : null;
  }
  // min, max, divisor — the divisor turns a stored percentage into the factor the CSS multiplies by.
  var RANGES = {
    "backdrop-angle": [0, 360, 1],
    "backdrop-fade-angle": [0, 360, 1],
    "backdrop-fade": [0, 1400, 1],
    "backdrop-density": [0, 100, 1],
    "backdrop-gradient-opacity": [10, 300, 100],
    "backdrop-pattern-opacity": [10, 200, 100],
  };
  function echo(key, property) {
    var value = num(key);
    if (value === null) return;
    var range = RANGES[key];
    value = Math.min(range[1], Math.max(range[0], value));
    document.documentElement.style.setProperty(property, String(value / range[2]));
  }
  try {
    var root = document.documentElement;
    var gradient = localStorage.getItem("backdrop-gradient");
    var pattern = localStorage.getItem("backdrop-pattern");
    var markOn = localStorage.getItem("backdrop-mark") === "on";
    var grainOn = localStorage.getItem("backdrop-grain") === "on";
    var hasGradient = !!gradient && gradient !== "none";
    var hasPattern = !!pattern && pattern !== "none";
    if (hasGradient) root.setAttribute("data-backdrop-gradient", gradient);
    if (hasPattern) root.setAttribute("data-backdrop-pattern", pattern);
    if (markOn) root.setAttribute("data-backdrop-mark", "");
    if (grainOn) root.setAttribute("data-backdrop-grain", "");
    if (hasGradient || hasPattern || markOn || grainOn) {
      root.setAttribute("data-backdrop", "");
      echo("backdrop-angle", "--backdrop-angle");
      echo("backdrop-fade-angle", "--backdrop-fade-angle");
      echo("backdrop-fade", "--backdrop-fade");
      echo("backdrop-density", "--backdrop-density");
      echo("backdrop-gradient-opacity", "--backdrop-gradient-k");
      echo("backdrop-pattern-opacity", "--backdrop-pattern-k");
    }
  } catch (e) {}
</script>
```

`data-backdrop` is the boolean the shared rules key on — the layer carriers and the four media blocks that neutralise a backdrop — reduced motion, more contrast, forced colours and print — ask *is anything on*, not *which one*. Nothing of the MARK is echoed beyond its on/off: its image is built from a file this script cannot wait for, so the hook writes the image, the size and the position together one frame later.

A second `add` on a project that already carries Parallax is the trap `install.md` names: the CLI asks whether to overwrite, `--yes` does not answer that question, and an unanswered prompt CANCELS while exiting 0. Silence is not success — check that the files changed.

### What it does not include

The twelve adjustments have no UI here — the two bearings, the fade length, the grain density and the two intensities, plus the mark's anchor, its two offsets, its zoom, its turn and its opacity. Eleven are numeric and clamped; the anchor is one of five positions — the four corners and the centre. They are setters (`setBackdropAngle(v)` and its siblings), and the gallery's Settings page is the worked example of a panel over them. `parallax-backdrop-controls` installs the picker for the four LAYERS only.

## parallax-backdrop-controls

`BackdropSelector`: the wand dropdown that drives the four backdrop layers — two radio groups for the gradient and the pattern, two checkboxes for the mark and the grain. Put it in the header bar through `PageHeader`'s `controls` snippet, or on a settings page.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-backdrop-controls.json
```

An icon-sized `DropdownMenu` trigger, prop-free: it reads and writes the backdrop hook directly and holds no state of its own. Two radio groups and two checkboxes, which is the model telling the truth — the layers compose, so the mark is not a third gradient and the grain is not a fourth. It drives the four LAYER choices only; the twelve adjustments behind them are setters without a control here (see `parallax-backdrop`). `parallax-shell`'s header does not render it, and should not: an axis a consumer's application has not defined does not belong in chrome they installed for a breadcrumb.

## parallax-swap

A two-state icon crossfade — the house primitive behind the light/dark toggle. Not in the official registry, which is why it ships from here.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-swap.json
```

## parallax-shell

The application shell: the sidebar (workspace switcher, two-shape navigation, user menu, icon rail, mobile drawer) and the page header bar (breadcrumb, search slot, light/dark toggle) — wired to the published appearance axes, taking their content as typed props.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-shell.json
```

### Wiring

The shell takes its content as typed props (see `src/lib/shared/nav.ts`) and its active state as a predicate — never a router. A minimal `App.svelte`:

```svelte
<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import AppSidebar from "$lib/components/layout/AppSidebar.svelte";
  import PageHeader from "$lib/components/layout/PageHeader.svelte";
  import { page } from "$app/state";
  import type { NavItem, User, Workspace } from "$lib/shared/nav.js";
  import GaugeIcon from "@lucide/svelte/icons/gauge";
  import CommandIcon from "@lucide/svelte/icons/command";

  const user: User = { name: "Ada Lovelace", email: "ada@example.com" };
  const workspaces: Workspace[] = [{ name: "Acme Inc", plan: "Enterprise", logo: CommandIcon }];
  const items: NavItem[] = [
    { title: "Dashboard", url: "/", icon: GaugeIcon },
    { title: "Reports", items: [{ title: "Monthly", url: "/reports/monthly" }] },
  ];
</script>

<ModeWatcher />
<AppShell>
  {#snippet sidebar()}
    <AppSidebar {user} {workspaces} {items} isActive={(url) => url === page.url.pathname} />
  {/snippet}
  <PageHeader trail={[{ label: "Dashboard" }]} />
  <!-- your page -->
</AppShell>
```

The predicate is the only thing the shell needs from a router, and reading it from `$app/state` is what keeps it correct on the server: `location` is not defined there, so the bare-`location` spelling this example used to carry threw a `ReferenceError` the moment the layout was server-rendered. Outside SvelteKit, feed the predicate from whatever the app already knows its current path to be.

Every `PageHeader` slot is a snippet with a default: `sidebarTrigger`, `breadcrumb` (receives `trail`), `search` (empty — pass your own field or palette) and `controls` — which is the light/dark toggle alone. The palette picker and the two panel dropdowns are installed (`ThemeSelector`, plus `HeaderToggle` / `SidebarModeToggle` through `parallax-appearance-controls`) but not rendered: put them on a settings page, or render your own group through `controls`. Pass an empty `sidebarTrigger` snippet if the header ever renders outside `AppShell`'s provider.

### What is already wired

This header carries `data-slot="page-header"` / `data-slot="page-header-bar"` and writes `data-floating` / `data-hidden` itself — the contract `parallax-appearance`'s docs ask a hand-rolled header to satisfy is closed here. The first-paint script from those docs still applies verbatim.

### Cautions

- The shell is the viewport. The CSS this item adds pins `Sidebar.Provider`'s wrapper to `100dvh` and clips it (`AppShell` narrows that to the visual viewport's height, as `--shell-height`, while a software keyboard is up), cuts the document's own iOS rubber band at the root, and makes `Sidebar.Inset` — the `<main>` — the one scroll container, so the document never scrolls; that is what keeps iOS Safari's toolbars still. After each in-app navigation move focus to `Sidebar.Inset` (`#main-content`, `tabindex={-1}`, `focus({ preventScroll: true })`), or keyboard scrolling has nowhere to start. Nothing inside the shell may claim `h-svh`, `min-h-svh` or `h-screen`: a full-height sibling of the canvas stretches as a flex child of the wrapper, and content fills with `flex-1 min-h-0`. Read the scroll position from the scroll parent, never `window.scrollY`, and scroll with the scroll parent's `scrollTo` or with `scrollIntoView` (which honours the canvas's `scroll-padding-top`) — `src/lib/shared/scroll-parent.ts`, from `parallax-primitives`, answers which box that is. Print takes the pin back so a sheet gets the whole page.
- Nothing between `Sidebar.Inset` and `PageHeader` may gain `overflow-x: hidden` — beside an `overflow-y: visible` it computes as `auto`, silently putting a second scroll container between the canvas and the header and stealing the sticky with no error anywhere. Use `overflow-x: clip` if a clip is ever needed.
- A sticky of your OWN inside the canvas needs its own offset. The canvas reserves `calc(var(--page-header-height) + 0.5rem)` at its top so focus never lands under the bar, and this item cancels that reserve for `PageHeader` alone — `scroll-margin-top` on `[data-slot="page-header"]` and every descendant, twice the bar's height so it holds while the auto-hide has the bar translated off the top. Nothing shipped can reach a selector of yours: a toolbar, filter bar or section nav pinned at `top: 0` inside `Sidebar.Inset` sits in that reserve permanently, so the browser reads its controls as obscured and every focus landing there — a menu in it closing, a Shift+Tab from the page — scrolls the canvas to reveal something that travels with the scrollport and never can be: hundreds of pixels upwards, or clean to the top. Stick it BELOW the reserve (`top: calc(var(--page-header-height) + 0.5rem)`), which is also what keeps it clear of the bar; or, if it must sit at `top: 0`, restate the cancellation on it and its descendants — `scroll-margin` does not inherit, and the browser scrolls to the focused control, not to its container. A box with a scrolling height of its own is out of scope: `Table.Root`'s container scrolls, so a sticky table head resolves against it and never sees this padding.
- The CSS this item adds is unlayered on purpose (it must outrank the sidebar's own utilities), so it also outranks YOUR utility classes on the same slots — override it in plain CSS, not with a utility.
- Two fidelity notes against the Parallax gallery: dropdown menus keep the upstream shadow, and the collapsed rail's tooltips keep the upstream look. Both are application-global restyles this item deliberately does not ship — they arrive with `parallax-restyle`. Buttons are not among them: this item depends on `parallax-button`, so the sizes it installs are the gallery's own token-driven ramp.

## parallax-skill

The Agent Skill that teaches an AI assistant to use Parallax correctly: registry installation, shell composition, the token families, the palettes and the appearance axes, with the pitfalls spelled out. Installs into the project's `.claude/skills/parallax/`.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-skill.json
```

The skill is installed at `.claude/skills/parallax/` — commit it so the whole team's assistants share it, and start a fresh session if the assistant was already running when it landed. Invoke it explicitly with `/parallax`.

It teaches: discover before installing (components.json), install through the CLI, the two manual post-install steps, Svelte 5 runes only, semantic tokens (soft status fills pair with their own foregrounds), and the appearance axes through their hooks.

## parallax-primitives

Shared infrastructure the house components compose: roving focus, form-control bridging, the TanStack table bridge, scroll position and the scroll parent, DOM-ordered collections. Installed automatically as a dependency; rarely asked for by name.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-primitives.json
```

## parallax-restyle

The Parallax shape for components this registry does not republish: css-only restyles of switch, checkbox, tooltip, inputs, native-select, select, sliders, sonner, navigation-menu, kbd, command and the tabs line variant, plus the global menu-shadow and dialog-scrim opinions. Install once beside parallax-theme.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-restyle.json
```

## parallax-accordion

The house accordion: shadcn's API with a chevron pair that swaps on open, hairline seams between items, and link and paragraph spacing inside a panel.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-accordion.json
```

## parallax-action-bar

The floating bulk-selection bar: a count, grouped actions, and an Escape that defers to open overlays.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-action-bar.json
```

## parallax-alert

The house alert: shadcn's API plus an `Alert.Action` corner slot and the full status ramp — the soft `*-subtle` family and the `solid-*` fills.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-alert.json
```

## parallax-alert-dialog

The house alert dialog: a `Media` part for the leading illustration, size variants on the content, and Action/Cancel that take Button's own `variant` and `size` rather than wrapping a button in a button.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-alert-dialog.json
```

## parallax-angle-slider

A circular slider for angles: drag the thumb round the dial, with keyboard steps and an optional range. Reach for it when the value is a direction rather than a position on a line.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-angle-slider.json
```

## parallax-autocomplete

A text field that suggests as you type and still accepts what the list never offered — the free-text half of type-to-pick. Reach for Combobox instead when the answer must be one of the items.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-autocomplete.json
```

## parallax-avatar

The house avatar: shadcn's API plus a size ramp, the hairline ring treatment, a status `Avatar.Badge` and `Avatar.Group` stacking.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-avatar.json
```

## parallax-badge

The house badge: shadcn's API plus the soft `*-subtle` variants for every status family, and the ghost and link variants.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-badge.json
```

## parallax-badge-overflow

A row of badges that measures its container and folds whatever does not fit into a `+N` indicator. Reach for it wherever a list of tags has to survive a narrow column.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-badge-overflow.json
```

## parallax-banner

A full-width notification strip pinned to the top or bottom of the viewport, with a queue that shows one at a time in priority order. Reach for it when the message outranks the page — an Alert stays in the flow it was written into, and a toast clears itself.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-banner.json
```

## parallax-breadcrumb

The house breadcrumb: shadcn's API with the theme's separator rhythm and muted trail, sized for the header bar the shell renders it in.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-breadcrumb.json
```

## parallax-button

The house button: shadcn's API on the --control-h-* ramp (24/32/40/48px), with xs/icon-xs sizes, the data-icon slots and the contextual solid and outline palettes.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-button.json
```

## parallax-button-group

The house button group: shadcn's API with the seam treatment that fuses a row or a column of controls into one shape, plus a `Text` part for inline labels.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-button-group.json
```

## parallax-calendar

The house calendar: shadcn's API rebuilt on `--cell-size` and `--cell-radius`, so one month grid retunes for a card, a popover or a full page without forking the parts.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-calendar.json
```

## parallax-card

The house card: shadcn's API plus a `size` prop that retunes `--card-spacing`, and the ring-drawn outline.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-card.json
```

## parallax-carousel

The house carousel: shadcn's Embla wrapper with the previous and next controls rebuilt as round icon-sm Buttons on the house ramp.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-carousel.json
```

## parallax-chain-of-thought

The steps a model took to an answer, as a collapsible trace: labelled steps with a status each, search-result chips and an optional image. Reach for it to show the WORK; Timeline is for events that happened to a system.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-chain-of-thought.json
```

## parallax-chart

The house chart frame: shadcn's LayerChart container, tooltip and legend on the theme's grid, axis and tooltip treatment, driven by a per-series colour config.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-chart.json
```

## parallax-checkbox

The house checkbox: shadcn's API on a 4px-radius box with the theme's border, focus ring and indeterminate mark.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-checkbox.json
```

## parallax-checkbox-group

Several checkboxes as one value: a shared label, description and validation message, horizontal or vertical. Reach for it when the boxes answer one question rather than several.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-checkbox-group.json
```

## parallax-circular-progress

A progress ring: a closed circle, 48px on a 4px stroke, determinate or indeterminate. Reach for Gauge when the arc itself carries meaning — the two share their geometry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-circular-progress.json
```

## parallax-code-block

A copyable — and, given a filename, downloadable — code sample with a line-number gutter, a language selector and lightweight language-aware highlighting. Reach for it for an opaque string to read and copy; JSON viewer parses a live value instead.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-code-block.json
```

## parallax-code-highlighter

A Shiki adapter for Code block's highlighter seam: real TextMate grammars for 32 languages, mapped onto the nine token kinds the block already paints, each grammar its own dynamic import. Mount `<CodeHighlighter.Root>` ONCE above the blocks that read it — it renders no element and reaches them through context. Reach for it over Code block's own tokenizer when a snippet spans lines (a block comment, a template literal, a docstring) or names a language outside the house fourteen; without it those blocks still render, uncoloured.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-code-highlighter.json
```

Mount `<CodeHighlighter.Root>` ONCE, at the app root and above every code block: it renders no element, publishes itself on context, and a second one below the first only compiles a second engine. Nothing goes in your stylesheet — the ink is Code block's own `data-kind` spans over the theme tokens, and no Shiki theme is loaded at all. Each grammar is a `() => import("@shikijs/langs/<id>")`, so the languages become chunks of YOUR bundle and arrive on first use; only the adapter itself is in the initial payload.

## parallax-color-picker

A full colour picker: a saturation and brightness area, hue and alpha sliders, the native eyedropper, and per-channel fields in hex, rgb, hsl or hsb.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-color-picker.json
```

## parallax-color-swatch

A single colour chip that renders transparency honestly, in five sizes — the building block of the picker's palette rows and of any legend that names a colour.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-color-swatch.json
```

## parallax-combobox

A searchable select: a Command list inside a Popover, single, multiple, or multiple as chips. What it commits is always one of the items — reach for Autocomplete when the answer may be one the list never offered.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-combobox.json
```

## parallax-command

The house command menu: shadcn's cmdk wrapper with the input rebuilt on Input group, a rounded popover ground and the selected-row treatment the palette uses.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-command.json
```

## parallax-compare-slider

Two versions of one image and a divider that wipes between them, by pointer, by touch or from the keyboard.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-compare-slider.json
```

## parallax-confirmation

The approval gate on a tool call: the request while a decision is open, then the accepted or rejected receipt, painted from the status ramp. Renders nothing until there is a decision to show.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-confirmation.json
```

## parallax-context-menu

The house context menu: shadcn's API with the flat row treatment, ring-drawn popovers and an RTL-aware submenu chevron.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-context-menu.json
```

## parallax-context-usage

How much of a model's context window a conversation has used — a ring in the composer, a hover card of token counts and, when the caller supplies one, the cost. Numbers and cost are the caller's; the component only formats them.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-context-usage.json
```

## parallax-conversation

The transcript viewport: sticks to the bottom while a reply streams, offers a scroll-to-bottom button once the reader has scrolled away, an empty state, and a Markdown download of the whole exchange.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-conversation.json
```

## parallax-copy-button

A button that writes text to the clipboard and swaps its icon for a tick — once the write has actually resolved. The swap is a Svelte transition, with no animation library.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-copy-button.json
```

## parallax-cropper

An image and video crop surface: drag, wheel zoom, pinch-zoom-rotate and arrow-key nudging, rectangular or round.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-cropper.json
```

## parallax-data-grid

The spreadsheet: virtualized rows, cell-addressed keyboard navigation, in-place editors per cell variant, its own ARIA grid markup.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-data-grid.json
```

## parallax-data-table

The TanStack-driven table engine: createDataTable state in runes, Toolbar with meta-driven filters, ColumnHeader, FlexRender, Pagination. The motor behind every list page in the gallery.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-data-table.json
```

## parallax-date-selector

One control for a day, a month, a quarter, a half-year or a year, behind an is/before/after/between operator, with a free-text input that parses all of them.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-date-selector.json
```

## parallax-dialog

The house dialog: shadcn's API with the close control rebuilt as a ghost icon Button, on the popover ground the theme's overlays share.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-dialog.json
```

## parallax-direction-provider

The RTL/LTR provider. Where upstream renders no DOM and asks each consumer to forward `dir` itself, this renders a `display: contents` wrapper, so the real attribute reaches the subtree and descendants flip without opting in.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-direction-provider.json
```

## parallax-drawer

The house drawer: shadcn's Vaul wrapper on the popover ground, with the drag handle and edge treatment the mobile sidebar uses.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-drawer.json
```

## parallax-dropdown-menu

The house dropdown menu: shadcn's API with the flat row treatment, ring-drawn popovers and check and radio indicators on the trailing edge.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-dropdown-menu.json
```

## parallax-editable

Text that becomes an input in place: a trigger, a preview, an input and a submit/cancel toolbar over one bindable value. Reach for it in a table cell or a heading where a whole form would be too much furniture.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-editable.json
```

## parallax-empty

The house empty state: shadcn's API with the media tile, heading and description treatment every placeholder in the gallery shares.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-empty.json
```

## parallax-event-calendar

A full scheduling surface: month, week, day, N-day, agenda and resource views over one event model, with time zones, recurrence, localisation and an imperative API.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-event-calendar.json
```

## parallax-field

The house field: shadcn's form-layout primitive carrying the label, description and error rhythm every form in this theme is built from, including the horizontal and fieldset arrangements.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-field.json
```

## parallax-filters

The filter row as state: a filter is a chip of field, operator and value, and the row of them is a value the page owns. Reach for it when a list needs more than a search box.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-filters.json
```

## parallax-fps

A frames-per-second counter, for watching whether an interaction still runs at frame rate.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-fps.json
```

## parallax-frame

A presentational panel family: a bordered tray whose header, panels and footer share one spacing ladder and one radius, with panels separated, fused into a stacked run, or pulled flush to the edge.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-frame.json
```

## parallax-gauge

A circular meter over a configurable arc — a dial, a segment, a sweep short of a full turn — with an indeterminate state. Reach for Circular progress when a closed ring is all you need.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-gauge.json
```

## parallax-hover-card

The house hover card: shadcn's API on the theme's popover ground, ring-drawn rather than shadowed.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-hover-card.json
```

## parallax-icon-stack

A layered isometric mark framing a single icon — the illustration an empty state or a feature card leads with, tinted from the surrounding text colour.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-icon-stack.json
```

## parallax-icon-tile

A small framed container for one icon — the mark that leads a list row, a feature card or an empty state — in five surfaces, five sizes and two corner treatments.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-icon-tile.json
```

## parallax-input

The house input: shadcn's API at the theme's height, padding and focus ring, so a field and a default button share a line.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-input.json
```

## parallax-input-group

The house input group: shadcn's API with addons on either side of the control or above and below it, and an `xs` button size for the controls that sit inside one.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-input-group.json
```

## parallax-input-otp

A segmented one-time-code field, rebuilt on its own state module and provider: a slot per character, groups split by separators, and one hidden input so paste and autofill keep working.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-input-otp.json
```

## parallax-item

The house item row: shadcn's title/description/action row with the `xs` and `sm` sizes and the media slot the gallery's list rows use. For the framed container drawn around a run of them, see the List group page.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-item.json
```

## parallax-json-viewer

A collapsible JSON tree coloured by runtime type, with expand and collapse, copy, and array truncation. Reach for Code block when the payload is an opaque sample rather than a tree to navigate.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-json-viewer.json
```

## parallax-kanban

A drag-and-drop board: reorder inside a column, move between columns, reorder the columns themselves — with a pointer, with touch, or from the keyboard alone.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-kanban.json
```

## parallax-kbd

The house keyboard key: shadcn's API as the theme's muted chip, sized to sit inside an input group or a menu row.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-kbd.json
```

## parallax-key-value

A dynamic list of key/value pairs with paste support and per-row validation — headers, environment variables, metadata a user types.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-key-value.json
```

## parallax-language-selector

A dialog that switches the active locale. The catalog is data the caller supplies and the component moves a code: it translates nothing.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-language-selector.json
```

## parallax-listbox

An always-visible option list with the WAI-ARIA keyboard model and typeahead, single or multiple, as a column or a grid. Reach for it when the options should not be hidden behind a trigger.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-listbox.json
```

## parallax-loader

128 loaders behind one API, with a shared reduced-motion answer: moving parts stop, the loader breathes.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-loader.json
```

## parallax-marquee

Content that scrolls continuously, horizontally or vertically — pausing on hover and on focus, mirroring under RTL, and holding still for reduced motion.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-marquee.json
```

## parallax-mask-input

An input that formats what you type against a pattern — a phone number, a date, a card, a currency amount — and keeps the caret where you left it.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-mask-input.json
```

## parallax-masonry

A masonry grid: a column count that answers the breakpoint, and items placed by measured height rather than by row.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-masonry.json
```

## parallax-media-player

A full video and audio player: custom controls, chapters, captions, playback rate and the complete keyboard shortcut set.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-media-player.json
```

## parallax-mention

A text field that suggests and inserts mentions when a trigger character is typed at a word boundary. The popup follows the caret, and each inserted mention behaves as one atomic unit of text.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-mention.json
```

## parallax-menubar

The house menubar: shadcn's API with the flat row treatment, ring-drawn popovers and indicators on the leading edge.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-menubar.json
```

## parallax-message

One turn of a chat — a user bubble or an assistant answer — with a Markdown response rendered through svelte-streamdown, actions, a toolbar, and a pager for walking the alternatives a regenerate leaves behind. Installing it brings svelte-streamdown and needs one `@source` line in the stylesheet.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-message.json
```

Markdown renders through svelte-streamdown, whose classes live in node_modules: add `@source "../node_modules/svelte-streamdown/**/*";` next to the imports of your global stylesheet (`../../node_modules/…` from src/routes/layout.css). Without it answers render unstyled and nothing errors.

## parallax-model-selector

A command palette for choosing a model: searchable groups per provider, provider logos, a name slot. Chosen values are the caller's; the component only presents the list.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-model-selector.json
```

## parallax-native-select

The house native select: the browser's own dropdown at the theme's field height, with a `sm` or `default` size stamped as `data-size`.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-native-select.json
```

## parallax-navigation-menu

The house navigation menu: shadcn's API with the theme's trigger, link and viewport treatment, and `navigationMenuTriggerStyle` exported for the links that are not triggers.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-navigation-menu.json
```

## parallax-number-field

A numeric input with spinner buttons, press-and-hold repeat, keyboard stepping and a drag-to-scrub label.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-number-field.json
```

## parallax-pagination

The house pagination: shadcn's API with the page links drawn by `buttonVariants` at any Button size, so a pager matches the controls beside it.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-pagination.json
```

## parallax-partition-bar

A total split into labelled parts: one bar per part, sized by its share, with its name and measurement underneath.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-partition-bar.json
```

## parallax-pending

A wrapper that marks anything as pending: interactions off, keyboard focus kept, and the right ARIA state for buttons, forms, links and switches.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-pending.json
```

## parallax-phone-input

A phone field with country detection and international formatting, built on the mask input.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-phone-input.json
```

## parallax-popover

The house popover: shadcn's API plus `Header`, `Title` and `Description` parts, so a popover with a heading is composed rather than hand-laid.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-popover.json
```

## parallax-progress

The house progress bar: shadcn's API as a slim rounded track on the muted ground.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-progress.json
```

## parallax-prompt-input

The composer: an auto-growing textarea that submits on Enter, a header and footer for tools, borderless selects, and a submit button that becomes a stop button while a reply is in flight. Files attach from its action menu, a drop or a paste, validated against `accept`, `maxFiles` and `maxFileSize`.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-prompt-input.json
```

## parallax-qr-code

A QR code you compose: the same value rendered as SVG, canvas or image, with a centre overlay, a loading skeleton and a download control.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-qr-code.json
```

## parallax-question

A clarifying question from the model, as a form: single or multiple choice, a free-text answer, and a submit that stays disabled until there is a response. Its shape is the AskUserQuestion tool call.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-question.json
```

## parallax-radio-group

The house radio group: shadcn's API with the theme's ring, dot indicator and row rhythm.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-radio-group.json
```

## parallax-range-calendar

The house range calendar: shadcn's API plus the `rangeCalendar`, `rangeCalendarFlush` and `rangeDay` class recipes, so a range picker reads the same in a card, in a popover, or flush to a panel edge.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-range-calendar.json
```

## parallax-rating

A star rating that displays whole, half and fractional scores, and — when editable — collects one by mouse or keyboard.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-rating.json
```

## parallax-reasoning

The model's reasoning summary in a collapsible panel that opens while it streams, reports how long the thinking took, and closes itself once the answer starts. Reach for it over Collapsible when the content is a thought, not a section.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-reasoning.json
```

## parallax-relative-time-card

A hover card that shows a moment as relative time, with the absolute time and its zone underneath.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-relative-time-card.json
```

## parallax-resizable

The house resizable panes: shadcn's API with the hairline handle and grip the theme's split layouts use.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-resizable.json
```

## parallax-responsive-dialog

One dialog that renders as a centred modal above the breakpoint and a bottom drawer below it — and swaps between them without closing.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-responsive-dialog.json
```

## parallax-scroll-area

The house scroll area: shadcn's API with the overlay scrollbar the theme paints. Reach for Scroller instead when native scrolling should stay and only the edge cues are wanted.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-scroll-area.json
```

## parallax-scroll-spy

Navigation links that track scroll position and scroll to their section on click, nested sections included.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-scroll-spy.json
```

## parallax-scroller

A scroll container that keeps the browser's own scrollbar and fades the edges where content continues, with optional buttons that scroll on press, hover or click. Where Scroll area replaces the scrollbar, this only layers affordances on top of it.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-scroller.json
```

## parallax-segmented-input

Connected inputs that read as one segmented control, with focus and typing moving between the segments as they fill and empty.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-segmented-input.json
```

## parallax-select

The house select: shadcn's API at the theme's field height, with the boxed trigger, ring-drawn content and scroll buttons on the popover ground.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-select.json
```

## parallax-selection-toolbar

A floating toolbar that appears over a text selection, carrying formatting and utility actions.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-selection-toolbar.json
```

## parallax-separator

The house separator: shadcn's API on the theme's border token, a hairline in both orientations.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-separator.json
```

## parallax-shake

A wrapper that replays a perspective wobble whenever a signal changes — the wrong-password nudge.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-shake.json
```

## parallax-sheet

The house sheet: shadcn's edge panel with the close control rebuilt as a ghost icon Button, and a `showCloseButton` for the panels that own their own.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-sheet.json
```

## parallax-sidebar

The sidebar primitive the application shell is built on — provider, rail, menu, sub-menu and mobile drawer — retuned to the theme's rhythm and its sidebar tokens. `parallax-shell` installs it already wired.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-sidebar.json
```

## parallax-skeleton

The house skeleton: shadcn's pulsing placeholder on the muted ground rather than the accent one.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-skeleton.json
```

## parallax-slider

The house slider: shadcn's API with the pale thumb and focus ring the theme's controls share, horizontal or vertical. Its name, description and value text reach the thumb — where the slider role lives — through `thumbLabel`, `aria-labelledby` / `aria-describedby` and `thumbValueText`.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-slider.json
```

## parallax-sortable

Drag-and-drop reordering for a list or a grid, operable with a pointer, with touch and from the keyboard alone. Kanban composes it.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-sortable.json
```

## parallax-speed-dial

A floating action button that fans a set of labelled actions out when it is triggered.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-speed-dial.json
```

## parallax-spinner

The house spinner: shadcn's loading mark with `role` and `aria-label` overridable, and the foreign icon-library props (`name`, `color`, `stroke`) normalised so another icon set can stand in.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-spinner.json
```

## parallax-status

A status indicator: a dot with an animated ping and the colour families, for system state, presence and service health.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-status.json
```

## parallax-status-monitor

The uptime strip from a public status page: one bar per period, coloured by state, with a tooltip per bar.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-status-monitor.json
```

## parallax-stepper

A multi-step flow with visible progress: a list of steps with indicator, title, description and separator, horizontal or vertical, each carrying its own state.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-stepper.json
```

## parallax-suggestion

A row of follow-up prompts as pill buttons, scrolling sideways when they overflow. Each pill hands its text to the caller; reach for Badge when the chips are labels rather than actions.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-suggestion.json
```

## parallax-switch

The house switch: shadcn's API with the theme's track and thumb, stamped `data-size` so the control ramp reaches it.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-switch.json
```

## parallax-table

The house table: shadcn's API plus the three-tier density axis (data-density retunes row/head/cell tokens; tiers are floors, not clamps).

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-table.json
```

## parallax-tabs

The house tabs: shadcn's API plus the `line` list variant and its `sm` size, both stamped as `data-*` so `app.css` owns the look.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-tabs.json
```

## parallax-tags-input

Free-text values entered as removable chips, with paste, split-on-delimiter, edit in place and per-tag validation.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-tags-input.json
```

## parallax-task

A model's todo item as a collapsible: a title, sub-items and file chips, open by default so progress reads at a glance.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-task.json
```

## parallax-text-gradient

A highlight that sweeps through text — the label that says a machine is still working.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-text-gradient.json
```

## parallax-textarea

The house textarea: shadcn's API at the theme's padding and focus ring, so it matches the fields beside it.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-textarea.json
```

## parallax-timeline

A chronological list of events: vertical or horizontal, an alternating variant, RTL support, and completed/active/pending states.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-timeline.json
```

## parallax-toggle

The house toggle: shadcn's API on the --control-h-* ramp with the data-icon slots, so a toggle and a button share a line.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-toggle.json
```

## parallax-toggle-group

The house toggle group: shadcn's API with a `spacing` axis — fused into one shape, or spaced apart — and an orientation.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-toggle-group.json
```

## parallax-tool

One tool call as a card: name, a status badge from the seven AI SDK states, the parameters it was called with and the result it returned — structured payloads through JSON viewer, text through code block.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-tool.json
```

## parallax-tooltip

The house tooltip: shadcn's API on the inverted foreground ground, with the arrow the theme draws.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-tooltip.json
```

## parallax-tour

A guided tour: highlight an element, step through the instructions, and teach a screen the first time somebody sees it.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-tour.json
```

## parallax-tree

A multi-level tree view with expand and collapse, selection, and the WAI-ARIA keyboard model.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-tree.json
```
