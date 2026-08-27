# Theming, tokens and the appearance axes

Contents: [Token families](#token-families) · [Type, radius, tracking](#type-radius-tracking) ·
[The 12 palettes](#the-12-palettes) · [Programmatic control](#programmatic-control) ·
[The appearance axes](#the-appearance-axes) · [The first-paint script](#the-first-paint-script)

## Token families

Every mapping generates the full Tailwind utility set (`bg-*`, `text-*`, `border-*`,
`ring-*`, `fill-*`, `stroke-*`, plus `/opacity` modifiers). Use these — never raw palette
colors — so all 12 themes and both modes keep working.

**Status, solid** (emphasis fills; pair with their own foreground):

| Fill             | Ink on it                    |
| ---------------- | ---------------------------- |
| `bg-success`     | `text-success-foreground`    |
| `bg-warning`     | `text-warning-foreground` — dark ink by design |
| `bg-info`        | `text-info-foreground`       |
| `bg-destructive` | `text-destructive-foreground`|

**Status, soft** — the house badge/alert treatment. The tint is the fill and the ink is
its **own walked token**, never the raw status color on its tint:

```html
<!-- correct -->
<span class="bg-warning-subtle text-warning-subtle-foreground">Pending</span>
<!-- wrong: raw status ink on the tint fails contrast -->
<span class="bg-warning-subtle text-warning">Pending</span>
```

Same pairs exist for `primary`, `success`, `info`, `destructive`. All soft foregrounds
clear 4.5:1; in dark, `destructive-subtle-foreground` reads pink by design.

**Chrome extras**: `border-sidebar-outline` / `ring-sidebar-outline` is the hairline one
step off a chrome panel (the floating bar uses `ring-1 ring-sidebar-outline ring-inset`,
the flat bar `border-b-sidebar-outline`). `--sidebar-border` sits flush with the panel in
dark on purpose — do not use it for edges that must stay visible.

**Raw variables (not utilities)**: `--scrim` (overlay ground), `--label-tracking`, and
the control ramp `--control-h-{xs,sm,default,lg}` = 24/32/40/48px.

## Type, radius, tracking

Role-mapped scale — body runs 15px, larger than shadcn's 14px:

- `text-xs` 13px — captions, meta labels; `text-sm` 15px — **the body size**;
  `text-base` 15px (deliberately ties with `text-sm`); `text-lg` 17px.
- `text-xl`–`text-4xl` keep Tailwind's sizes but get heading treatment:
  `letter-spacing -0.02em`, `line-height 1.1`.
- `tracking-label` (0.08em) — the uppercase micro-label spacing:
  `class="text-xs tracking-label uppercase text-muted-foreground"`.
- Radius: `rounded-md` for controls, `rounded-lg` for sidebar/tabs, `rounded-xl` equals
  `lg` on purpose (cards/dialogs), `rounded-4xl` is the pill (Badge).
- **A radius has one owner.** When a component draws decoration in its own boxes — the
  Avatar's hairline ring is a `::after`, its image and fallback are children — those boxes take
  `rounded-[inherit]` and the ROOT is the only place a radius is written. So a squared avatar is
  `<Avatar.Root class="rounded-lg">` and nothing else: never `after:rounded-lg` on the root, never
  `rounded-lg` on the fallback. The sign of a violation is a circle drawn over a rounded square,
  four corners of fill showing around it. Apply the same rule when forking any component that
  stacks decorative boxes (rings, halos, focus outlines drawn by pseudo-elements).
- `font-sans` is Hanken Grotesk Variable — needs
  `@import "@fontsource-variable/hanken-grotesk";` in the global stylesheet.

## The 12 palettes

`graphite, sepia, nordic, harbor, evergreen, sandstone, ember, crimson, orchid, amethyst,
indigo, parallax`. Palette and light/dark are independent axes: every theme defines both
modes, so `<html class="dark" data-theme="ember">` is an ordinary state.

`parallax` is the base and **has no `[data-theme]` block on purpose** — it IS the
`:root`/`.dark` palette. Base is not default: a missing or unknown stored id narrows to
`DEFAULT_THEME`, which the kit ships as `amethyst`, and that is the palette a first visit
wears. The two were the same id until Amethyst took over, so `data-theme` is now written on
the first frame rather than left absent.

## Programmatic control

```ts
import {
	THEMES, THEME_IDS, DEFAULT_THEME, activeTheme, setTheme, isThemeId, themeById,
	type ThemeId,
} from "$lib/themes/index.js";
import { mode, toggleMode, setMode } from "mode-watcher";

activeTheme.current; // always a valid ThemeId (unknown values narrow to DEFAULT_THEME)
setTheme("ember");   // persists (key "mode-watcher-theme"), writes data-theme on <html>
toggleMode();        // light/dark — mode-watcher owns class="dark" and its persistence
```

Never write `data-theme`, `class="dark"` or their `localStorage` keys directly —
`mode-watcher` owns both attributes and suppresses transitions during the swap.

## The appearance axes

Four module-level hooks (`$lib/hooks/`), importable anywhere, no provider. All persist to
`localStorage` and re-resolve reactively:

| Axis              | Hook module                  | Read                       | Write                      | Values / default            |
| ----------------- | ---------------------------- | -------------------------- | -------------------------- | --------------------------- |
| Header inverted   | `header-mode.svelte.ts`      | `headerMode`, `headerWear` | `setHeaderMode(v)`         | `"default" \| "inverted"`   |
| Sidebar inverted  | `sidebar-mode.svelte.ts`     | `sidebarMode`, `sidebarWear` | `setSidebarMode(v)`      | `"default" \| "inverted"`   |
| Header floating   | `header-behaviour.svelte.ts` | `headerFloating.current`   | `setHeaderFloating(v)`     | boolean, default `false`    |
| Header auto-hide  | `header-behaviour.svelte.ts` | `headerAutoHide.current`   | `setHeaderAutoHide(v)`     | boolean, default `false`    |
| Sidebar floating  | `sidebar-behaviour.svelte.ts`| `sidebarFloating.current`  | `setSidebarFloating(v)`    | boolean, **default `true`** |

The two mode axes are **relative** — `"inverted"` means "the opposite of the page mode,
and stays opposite when the page flips". They resolve to absolute `data-sidebar-mode` /
`data-header-mode` attributes on `<html>` (written only when they differ from what would
be inherited). The behaviour flags write no attribute — components read them directly.
Drive everything through the setters; the ready-made UI is `HeaderToggle` /
`SidebarModeToggle` / the Settings-page pattern.

## The first-paint script

Required once, in the `<head>` of `index.html` (Vite) or `src/app.html` (SvelteKit),
**before anything else runs** — without it an inverted rail/header paints one frame in the
wrong mode on every load, and no client code can prevent it. Canonical copy (keep it in
step with the hooks' exported storage keys):

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

**A Vite SPA needs three more lines.** `ModeWatcher` ships its own flash guard for
light/dark and the palette, but delivers it through `<svelte:head>` — which only reaches
the document when the markup is server-rendered. SvelteKit gets it for free; a static SPA
mounts the component from JavaScript, and a `<script>` inserted that way never executes. So
in `index.html`, and only there, the same block does mode-watcher's half too, right after
the `dark` line above:

```js
root.classList.toggle("dark", dark);
root.style.colorScheme = dark ? "dark" : "light";
root.setAttribute("data-theme", localStorage.getItem("mode-watcher-theme") || "amethyst");
```

Write the default palette as a literal and keep it in step with the `defaultTheme` you pass
`<ModeWatcher />` — `DEFAULT_THEME`, `amethyst` as the kit ships. Nothing across a plain
HTML file enforces that agreement, so it is stated at both ends.
