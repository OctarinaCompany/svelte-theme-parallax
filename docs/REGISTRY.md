# The Parallax registry

GENERATED — the text lives in `tools/registry/generate.mjs`; edit it there and re-run
`npm run registry:generate`. It is duplicated out of `registry.json` because the registry
build strips each item's `docs` field from the published JSON.

## parallax-theme

The Parallax palette: the base light and dark tokens, the eleven alternate palettes behind `data-theme`, and the Tailwind mappings for the token families shadcn does not ship — success, warning, info, the subtle family, and `--sidebar-outline`.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-theme.json
```

Two manual steps, because a registry item writes files and cannot patch the ones you already have.

1. Import the alternate palettes from your global stylesheet, after the Tailwind import: `@import "./themes.css";`
2. Import the typeface the same way: `@import "@fontsource-variable/hanken-grotesk";`

A third applies only if your stylesheet was NOT created by `shadcn-svelte init` — check it for the `@layer base` block with `* { @apply border-border outline-ring/50; }` and for `@import "tw-animate-css";`, and add whichever is absent. Tailwind v4's preflight gives borders a width and a style but no colour, so without that rule every `border-*` utility falls back to `currentColor` and the hairlines wear the text colour instead. Nothing errors, the page renders, and only the borders are wrong.

`parallax` is the base — it IS the `:root` and `.dark` this item just wrote, so it has no `[data-theme]` block of its own. The other eleven answer to `data-theme` on `<html>`; `mode-watcher` owns that attribute and persists it under `mode-watcher-theme`.

## parallax-appearance

The four appearance axes as persisted state: an inverted sidebar, an inverted header, a floating header and a header that hides on scroll down. Module-level runes that write attributes on `<html>`, plus the CSS those attributes key on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-appearance.json
```

## The contract

The CSS this installed keys on attributes your own header has to write. Nothing paints until it does:

- `data-slot="page-header"` on the outer sticky element — the one the floating fade hangs off and the auto-hide translates.
- `data-slot="page-header-bar"` on the bar inside it — this is what the inverted palette selects, and what re-scopes the nine chrome tokens onto the controls.
- `data-floating` and `data-hidden` on the outer element, present or absent, from `headerFloating.current` and the auto-hide state.

The two mode axes need nothing from you: `header-mode` and `sidebar-mode` write `data-header-mode` and `data-sidebar-mode` on `<html>` themselves. The sidebar's floating axis needs nothing either — pass shadcn's own `variant="floating"` when `sidebarFloating.current` is set.

## The first-paint script

Add this to the `<head>` of your `index.html` (or `src/app.html` under SvelteKit), before anything else runs. Without it the page paints in the page's own mode for one frame and then snaps to the inverted one — a visible flash on every load, which no client code can prevent because it happens before hydration.

```html
<script>
  try {
    var root = document.documentElement;
    var mode = localStorage.getItem("mode-watcher-mode") || "system";
    var dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    var rail = localStorage.getItem("sidebar-mode");
    var railWear = rail === "inverted" ? (dark ? "light" : "dark") : dark ? "dark" : "light";
    if (rail === "inverted") root.setAttribute("data-sidebar-mode", railWear);
    var bar = localStorage.getItem("header-mode");
    var barWear = bar === "inverted" ? (dark ? "light" : "dark") : dark ? "dark" : "light";
    if (barWear !== railWear) root.setAttribute("data-header-mode", barWear);
  } catch (e) {}
</script>
```

Keep it in step with the hooks: it repeats their resolution, and every `localStorage` key it reads is exported from one of them as a constant.

## parallax-appearance-controls

The two dropdown menus that drive the axes: one for the sidebar (inverted, floating) and one for the header (inverted, floating, hide on scroll). Put them on a settings page — or back in the header bar through `PageHeader`'s `controls` snippet — and the axes become user-facing.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-appearance-controls.json
```

Both are icon-sized `DropdownMenu` triggers, for a settings page or a header's right-hand cluster. `parallax-shell`'s own header does not render them — its `controls` snippet is the light/dark toggle alone — so mount them where they belong in your app. They read and write the hooks directly, so they take no props and hold no state of their own.

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

## Wiring

The shell takes its content as typed props (see `src/lib/shared/nav.ts`) and its active state as a predicate — never a router. A minimal `App.svelte`:

```svelte
<script lang="ts">
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
    { title: "Dashboard", url: "/", icon: GaugeIcon },
    { title: "Reports", items: [{ title: "Monthly", url: "/reports/monthly" }] },
  ];
</script>

<ModeWatcher />
<AppShell>
  {#snippet sidebar()}
    <AppSidebar {user} {workspaces} {items} isActive={(url) => url === location.pathname} />
  {/snippet}
  <PageHeader trail={[{ label: "Dashboard" }]} />
  <!-- your page -->
</AppShell>
```

Every `PageHeader` slot is a snippet with a default: `sidebarTrigger`, `breadcrumb` (receives `trail`), `search` (empty — pass your own field or palette) and `controls` — which is the light/dark toggle alone. The palette picker and the two panel dropdowns are installed (`ThemeSelector`, plus `HeaderToggle` / `SidebarModeToggle` through `parallax-appearance-controls`) but not rendered: put them on a settings page, or render your own group through `controls`. Pass an empty `sidebarTrigger` snippet if the header ever renders outside `AppShell`'s provider.

## What is already wired

This header carries `data-slot="page-header"` / `data-slot="page-header-bar"` and writes `data-floating` / `data-hidden` itself — the contract `parallax-appearance`'s docs ask a hand-rolled header to satisfy is closed here. The first-paint script from those docs still applies verbatim.

## Cautions

- Nothing above `PageHeader` may gain `overflow-x: hidden` — beside an `overflow-y: visible` it computes as `auto`, silently turning the shell into a scroll container and killing the sticky header with no error anywhere. Use `overflow-x: clip` if a clip is ever needed.
- The CSS this item adds is unlayered on purpose (it must outrank the sidebar's own utilities), so it also outranks YOUR utility classes on the same slots — override it in plain CSS, not with a utility.
- Three fidelity notes against the Parallax gallery: buttons install from the official registry, so icon buttons run ~36px rather than the gallery's token-driven 40px; dropdown menus keep the upstream shadow; and the collapsed rail's tooltips keep the upstream look — both of the latter are application-global restyles this item deliberately does not ship.

## parallax-skill

The Agent Skill that teaches an AI assistant to use Parallax correctly: registry installation, shell composition, the token families, the palettes and the appearance axes, with the pitfalls spelled out. Installs into the project's `.claude/skills/parallax/`.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-skill.json
```

The skill is installed at `.claude/skills/parallax/` — commit it so the whole team's assistants share it. Claude Code picks it up automatically (live-watched, no restart); invoke it explicitly with `/parallax`.

It teaches: discover before installing (components.json), install through the CLI, the two manual post-install steps, Svelte 5 runes only, semantic tokens (soft status fills pair with their own foregrounds), and the appearance axes through their hooks.

## parallax-primitives

Shared infrastructure the house components compose: roving focus, form-control bridging, the TanStack table bridge, scroll position, DOM-ordered collections. Installed automatically as a dependency; rarely asked for by name.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-primitives.json
```

## parallax-restyle

The Parallax shape for the OFFICIAL components: css-only restyles of switch, checkbox, tooltip, inputs, native-select, select, sliders, sonner, navigation-menu, kbd, command and the tabs line variant, plus the global menu-shadow and dialog-scrim opinions. Install once beside parallax-theme.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-restyle.json
```

## parallax-accordion

The Parallax fork of the official accordion: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-accordion.json
```

## parallax-action-bar

The floating bulk-selection bar: a count, grouped actions, and an Escape that defers to open overlays.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-action-bar.json
```

## parallax-alert

The Parallax fork of the official alert: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-alert.json
```

## parallax-alert-dialog

The Parallax fork of the official alert-dialog: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-alert-dialog.json
```

## parallax-angle-slider

Parallax's angle slider component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-angle-slider.json
```

## parallax-autocomplete

Parallax's autocomplete component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-autocomplete.json
```

## parallax-avatar

The house avatar: shadcn's API plus a size ramp and the hairline ring treatment.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-avatar.json
```

## parallax-badge

The house badge: shadcn's API plus the soft *-subtle variants for every status family.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-badge.json
```

## parallax-badge-overflow

Parallax's badge overflow component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-badge-overflow.json
```

## parallax-banner

Parallax's banner component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-banner.json
```

## parallax-breadcrumb

The Parallax fork of the official breadcrumb: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-breadcrumb.json
```

## parallax-button

The house button: shadcn's API on the --control-h-* ramp (24/32/40/48px), with xs/icon-xs sizes and the data-icon slots.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-button.json
```

## parallax-button-group

The Parallax fork of the official button-group: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-button-group.json
```

## parallax-calendar

The Parallax fork of the official calendar: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-calendar.json
```

## parallax-card

The house card: shadcn's API plus a size prop and the ring-drawn outline.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-card.json
```

## parallax-carousel

The Parallax fork of the official carousel: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-carousel.json
```

## parallax-chart

The Parallax fork of the official chart: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-chart.json
```

## parallax-checkbox

The Parallax fork of the official checkbox: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-checkbox.json
```

## parallax-checkbox-group

Parallax's checkbox group component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-checkbox-group.json
```

## parallax-circular-progress

Parallax's circular progress component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-circular-progress.json
```

## parallax-code-block

Parallax's code block component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-code-block.json
```

## parallax-color-picker

Parallax's color picker component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-color-picker.json
```

## parallax-color-swatch

Parallax's color swatch component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-color-swatch.json
```

## parallax-combobox

Parallax's combobox component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-combobox.json
```

## parallax-command

The Parallax fork of the official command: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-command.json
```

## parallax-compare-slider

Parallax's compare slider component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-compare-slider.json
```

## parallax-context-menu

The Parallax fork of the official context-menu: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-context-menu.json
```

## parallax-copy-button

Parallax's copy button component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-copy-button.json
```

## parallax-cropper

Parallax's cropper component — not in the official shadcn-svelte registry.

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

Parallax's date selector component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-date-selector.json
```

## parallax-dialog

The Parallax fork of the official dialog: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-dialog.json
```

## parallax-direction-provider

Parallax's direction provider component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-direction-provider.json
```

## parallax-drawer

The Parallax fork of the official drawer: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-drawer.json
```

## parallax-dropdown-menu

The Parallax fork of the official dropdown-menu: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-dropdown-menu.json
```

## parallax-editable

Parallax's editable component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-editable.json
```

## parallax-empty

The Parallax fork of the official empty: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-empty.json
```

## parallax-event-calendar

Parallax's event calendar component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-event-calendar.json
```

## parallax-field

The Parallax fork of the official field: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-field.json
```

## parallax-filters

Parallax's filters component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-filters.json
```

## parallax-fps

Parallax's fps component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-fps.json
```

## parallax-frame

Parallax's frame component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-frame.json
```

## parallax-gauge

Parallax's gauge component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-gauge.json
```

## parallax-hover-card

The Parallax fork of the official hover-card: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-hover-card.json
```

## parallax-icon-stack

Parallax's icon stack component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-icon-stack.json
```

## parallax-icon-tile

Parallax's icon tile component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-icon-tile.json
```

## parallax-input

The Parallax fork of the official input: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-input.json
```

## parallax-input-group

The Parallax fork of the official input-group: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-input-group.json
```

## parallax-input-otp

The Parallax fork of the official input-otp: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-input-otp.json
```

## parallax-item

The Parallax fork of the official item: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-item.json
```

## parallax-json-viewer

Parallax's json viewer component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-json-viewer.json
```

## parallax-kanban

Parallax's kanban component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-kanban.json
```

## parallax-kbd

The Parallax fork of the official kbd: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-kbd.json
```

## parallax-key-value

Parallax's key value component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-key-value.json
```

## parallax-language-selector

Parallax's language selector component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-language-selector.json
```

## parallax-listbox

Parallax's listbox component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-listbox.json
```

## parallax-loader

128 loaders behind one API, with a shared reduced-motion answer: moving parts stop, the loader breathes.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-loader.json
```

## parallax-marquee

Parallax's marquee component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-marquee.json
```

## parallax-mask-input

Parallax's mask input component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-mask-input.json
```

## parallax-masonry

Parallax's masonry component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-masonry.json
```

## parallax-media-player

Parallax's media player component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-media-player.json
```

## parallax-mention

Parallax's mention component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-mention.json
```

## parallax-menubar

The Parallax fork of the official menubar: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-menubar.json
```

## parallax-native-select

The Parallax fork of the official native-select: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-native-select.json
```

## parallax-navigation-menu

The Parallax fork of the official navigation-menu: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-navigation-menu.json
```

## parallax-number-field

Parallax's number field component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-number-field.json
```

## parallax-pagination

The Parallax fork of the official pagination: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-pagination.json
```

## parallax-partition-bar

Parallax's partition bar component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-partition-bar.json
```

## parallax-pending

Parallax's pending component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-pending.json
```

## parallax-phone-input

Parallax's phone input component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-phone-input.json
```

## parallax-popover

The Parallax fork of the official popover: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-popover.json
```

## parallax-progress

The Parallax fork of the official progress: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-progress.json
```

## parallax-qr-code

Parallax's qr code component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-qr-code.json
```

## parallax-radio-group

The Parallax fork of the official radio-group: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-radio-group.json
```

## parallax-range-calendar

The Parallax fork of the official range-calendar: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-range-calendar.json
```

## parallax-rating

Parallax's rating component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-rating.json
```

## parallax-relative-time-card

Parallax's relative time card component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-relative-time-card.json
```

## parallax-resizable

The Parallax fork of the official resizable: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-resizable.json
```

## parallax-responsive-dialog

Parallax's responsive dialog component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-responsive-dialog.json
```

## parallax-scroll-area

The Parallax fork of the official scroll-area: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-scroll-area.json
```

## parallax-scroll-spy

Parallax's scroll spy component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-scroll-spy.json
```

## parallax-scroller

Parallax's scroller component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-scroller.json
```

## parallax-segmented-input

Parallax's segmented input component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-segmented-input.json
```

## parallax-select

The Parallax fork of the official select: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-select.json
```

## parallax-selection-toolbar

Parallax's selection toolbar component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-selection-toolbar.json
```

## parallax-separator

The Parallax fork of the official separator: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-separator.json
```

## parallax-shake

Parallax's shake component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-shake.json
```

## parallax-sheet

The Parallax fork of the official sheet: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-sheet.json
```

## parallax-sidebar

The Parallax fork of the official sidebar: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-sidebar.json
```

## parallax-skeleton

The Parallax fork of the official skeleton: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-skeleton.json
```

## parallax-slider

The Parallax fork of the official slider: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-slider.json
```

## parallax-sonner

The Parallax fork of the official sonner: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-sonner.json
```

## parallax-sortable

Parallax's sortable component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-sortable.json
```

## parallax-speed-dial

Parallax's speed dial component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-speed-dial.json
```

## parallax-spinner

The Parallax fork of the official spinner: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-spinner.json
```

## parallax-status

Parallax's status component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-status.json
```

## parallax-status-monitor

Parallax's status monitor component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-status-monitor.json
```

## parallax-stepper

Parallax's stepper component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-stepper.json
```

## parallax-switch

The Parallax fork of the official switch: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-switch.json
```

## parallax-table

The house table: shadcn's API plus the three-tier density axis (data-density retunes row/head/cell tokens; tiers are floors, not clamps).

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-table.json
```

## parallax-tabs

The Parallax fork of the official tabs: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-tabs.json
```

## parallax-tags-input

Parallax's tags input component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-tags-input.json
```

## parallax-text-gradient

Parallax's text gradient component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-text-gradient.json
```

## parallax-textarea

The Parallax fork of the official textarea: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-textarea.json
```

## parallax-timeline

Parallax's timeline component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-timeline.json
```

## parallax-toggle

The Parallax fork of the official toggle: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-toggle.json
```

## parallax-toggle-group

The Parallax fork of the official toggle-group: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-toggle-group.json
```

## parallax-tooltip

The Parallax fork of the official tooltip: the same API with the house refinements this theme depends on.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-tooltip.json
```

## parallax-tour

Parallax's tour component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-tour.json
```

## parallax-tree

Parallax's tree component — not in the official shadcn-svelte registry.

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-tree.json
```
