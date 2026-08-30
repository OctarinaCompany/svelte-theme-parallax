# Bootstrapping a new project from an empty directory

Contents: [When this applies](#when-this-applies) · [The chain](#the-chain) ·
[1. Scaffold](#1-scaffold-the-svelte-project) · [2. components.json](#2-write-componentsjson-by-hand) ·
[3. Install Parallax](#3-install-parallax) · [4. The missing pieces](#4-the-three-pieces-init-would-have-left) ·
[5. Manual steps](#5-the-manual-post-install-steps) · [6. Wire the shell](#6-wire-the-shell) ·
[7. Validate](#7-validate) · [Traps](#traps)

## When this applies

The user is standing in an **empty (or non-Svelte) directory** and wants a Parallax
dashboard. [install.md](install.md) assumes a Svelte + Tailwind + shadcn-svelte project
already exists; this file covers everything before that point.

Do not attempt `shadcn-svelte add` first. It reads `components.json`, and without one it
fails with a message about the project not being initialised — which is the symptom, not
the problem.

## The chain

```sh
npx sv@latest create . --template minimal --types ts --add "tailwindcss=plugins:none" \
  --install npm --no-dir-check --no-download-check
# write components.json by hand (step 2 — `init` cannot run unattended)
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-shell.json --yes --overwrite
npx shadcn-svelte@latest add utils --yes
npm install -D shadcn-svelte tw-animate-css
# paste the import and the base layer into the global stylesheet (step 4 — nothing writes them)
```

Then the two manual steps, the shell wiring, and the checks in step 7.

## 1. Scaffold the Svelte project

```sh
npx sv@latest create . --template minimal --types ts --add "tailwindcss=plugins:none" \
  --install npm --no-dir-check --no-download-check
```

Pass a name instead of `.` to create a subdirectory. Flag by flag:

| Flag                          | Why                                                                     |
| ----------------------------- | ----------------------------------------------------------------------- |
| `--template minimal`          | `demo` ships a sample app you would only delete                          |
| `--types ts`                  | Parallax's items are TypeScript; `components.json` will say `"typescript": true` |
| `--add "tailwindcss=plugins:none"` | Tailwind v4 is required. **The `=plugins:none` suffix is load-bearing** — a bare `--add tailwindcss` still prompts for typography/forms and hangs an unattended run |
| `--no-dir-check`              | allows a directory holding `.claude/`, `.git/`, a README                 |
| `--no-download-check`         | suppresses the download confirmation prompt                             |

**Where the stylesheet lands.** The current Tailwind add-on writes
**`src/routes/layout.css`**, imported by `src/routes/+layout.svelte` — *not* `src/app.css`.
Read `+layout.svelte` to confirm rather than assuming; every later step needs the real
path. Older scaffolds, and any Vite-SPA project, use `src/app.css` instead.

## 2. Write `components.json` by hand

`shadcn-svelte init` **cannot be run unattended**. It demands a `--preset`, and a preset
string is only obtainable from the builder at `shadcn-svelte.com/create`. Left without one
it opens an interactive menu that no scripted run can answer.

So write the file yourself, at the project root. This mirrors Parallax's own — matching
`style` and `baseColor` is what keeps an installed component looking like the gallery:

```json
{
	"$schema": "https://shadcn-svelte.com/schema.json",
	"tailwind": {
		"css": "src/routes/layout.css",
		"baseColor": "neutral"
	},
	"aliases": {
		"components": "$lib/components",
		"utils": "$lib/utils",
		"ui": "$lib/components/ui",
		"hooks": "$lib/hooks",
		"lib": "$lib"
	},
	"typescript": true,
	"registry": "https://shadcn-svelte.com/registry",
	"style": "vega",
	"iconLibrary": "lucide",
	"menuColor": "default",
	"menuAccent": "subtle"
}
```

`tailwind.css` must be the path found in step 1. The aliases are SvelteKit's `$lib`, which
Kit resolves through `.svelte-kit/tsconfig.json` — nothing to add to `tsconfig.json`. A
Vite SPA has no such generated config and needs the `paths` entry from
[install.md](install.md#troubleshooting).

## 3. Install Parallax

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-shell.json --yes --overwrite
```

**`--overwrite` is required here, and `--yes` is not enough.** Before merging the tokens
the CLI asks *"Updates to your `<stylesheet>` are required. Existing CSS variables may be
overwritten. Continue?"* — a separate confirmation that `--yes` does not answer. Without
`--overwrite` an unattended run stalls on that prompt after writing every component file,
so it looks like a slow install and dies at whatever timeout you set. `--overwrite` is
safe *here* precisely because the scaffold is minutes old; it is the wrong flag on any
project that already carries Parallax files.

One command resolves the whole chain — the theme, the axes, the shell, the nav trio, and
the component forks underneath, `collapsible` being the one bare official name in it — and
it does three separate things:

1. writes the component files under `src/lib/`
2. writes `src/themes.css` (the seventeen alternate palettes)
3. **merges the base tokens into the global stylesheet** — 56 `cssVars` plus two `css`
   blocks. This is where `--background`, `--primary`, the success/warning/info families,
   the subtle family and `--sidebar-outline` come from; `themes.css` holds only the
   `[data-theme]` alternates and is useless on its own.

**Let the CLI install the npm dependencies — never pass `--no-deps` here.** It resolves
the ranges the components were built against, `@tanstack/table-core@^8.21.3` and
`vaul-svelte@^1.0.0-next.7` among them, and both have a newer release that does not
compile against this code. Installing those by bare name afterwards is how you earn
`svelte-check` errors in files you never touched.

If a run did end early, re-run the same command: the merge is the last step, so an
interrupted install is one that wrote every file and themed nothing.

## 4. The three pieces `init` would have left

Skipping `init` skips three things that nothing else provides. Two are commands:

```sh
npx shadcn-svelte@latest add utils --yes      # writes src/lib/utils.ts (the `cn` helper)
npm install -D shadcn-svelte tw-animate-css   # the two packages the stylesheet imports
```

and the third is what `init` writes into the stylesheet itself — one import and the base
layer. No registry item carries either, so both are pasted by hand, into the stylesheet
found in step 1:

```css
@import "tw-animate-css";

@layer base {
	* {
		@apply border-border outline-ring/50;
	}

	body {
		@apply bg-background text-foreground;
	}
}
```

The `@import` belongs beside the two already at the top of that file — `tailwindcss` and
the `shadcn-svelte/tailwind.css` the CLI merged in — because an `@import` after any rule is
dropped. The layer block can go anywhere below them.

- **`utils`** is not pulled in as a registry dependency of the shell. Without it every
  component that imports `$lib/utils.js` fails to resolve — roughly a hundred
  `svelte-check` errors that all trace back to this one file.
- **The `shadcn-svelte` package** must be a real dependency because the stylesheet merge
  adds `@import "shadcn-svelte/tailwind.css";`. Running the CLI through `npx` does not put
  the package in `node_modules`, and the import then fails at dev-server start with
  `Can't resolve 'shadcn-svelte/tailwind.css'`.
- **`tw-animate-css`** carries the enter/exit animations the overlays ask for — the
  `animate-in`, `fade-in-0`, `zoom-in-95` family and the `data-[state=closed]:` half.
  Tailwind v4 does not ship them, and five of the components a bare `parallax-shell`
  install writes do use them: the dropdown menu, its submenu, the tooltip, the sheet and
  the mobile drawer. Without the package and its import Tailwind has no such utility to
  compile, so every menu appears and vanishes instantly — measured on a fresh bootstrap,
  the user menu's content computes `animation-name: none` without it and `enter` at 0.1s
  with it. Nothing errors either way.
- **The base layer** is the one with no error attached to it, and no registry item ships
  it: it is shadcn's own boilerplate, written by `init`, and skipping `init` skips it.
  Tailwind v4's preflight sets `border: 0 solid` — a width and a style, **no colour** — so
  every `border` / `border-b` / `border-t` utility that does not name one falls back to
  `currentColor`, i.e. the text colour. The tokens are all correct; the borders simply wear
  the wrong one. Table rows, card footers and section rules come out near-black in light
  and near-white in dark, while the borders Parallax paints itself — a `Card.Header`'s
  rule, the sidebar's outline, a table head — stay right. **That incoherence is the tell**,
  and it is the whole symptom: the install succeeds, the build is clean, `svelte-check` is
  at zero, the page renders, and nothing anywhere says a word. Step 7 has the one-liner
  that proves it landed.

  Those two rules are exactly what `init` writes, and this file stops there deliberately.
  The kit's own third base rule — the hand cursor Tailwind v4 dropped — is not pasted by
  hand: it ships with **`parallax-restyle`**, which is worth adding beside the shell for
  exactly that reason. Without it every button, `select` and bound `<label>` shows an arrow
  where the gallery shows a hand.

## 5. The manual post-install steps

Both are the ones [install.md](install.md#manual-post-install-steps) describes; only the
first has a from-scratch wrinkle.

**In the global stylesheet**, after the Tailwind and shadcn imports:

```css
@import "../themes.css";
@import "@fontsource-variable/hanken-grotesk";
```

`../themes.css` — **not** `./themes.css`. The path is relative to the stylesheet's own
directory: `src/routes/layout.css` reaching `src/themes.css` climbs one level. Only a
stylesheet at `src/app.css` gets `./themes.css`.

**The first-paint script** goes in the `<head>` of `src/app.html`, before
`%sveltekit.head%`. Exact copy in [theming.md](theming.md#the-first-paint-script).

## 6. Wire the shell

In `src/routes/+layout.svelte`, keeping the stylesheet import the scaffold put there:

```svelte
<script lang="ts">
	import "./layout.css";
	import { page } from "$app/state";
	import { ModeWatcher } from "mode-watcher";
	import AppShell from "$lib/components/layout/AppShell.svelte";
	import AppSidebar from "$lib/components/layout/AppSidebar.svelte";
	import PageHeader from "$lib/components/layout/PageHeader.svelte";
	import type { NavItem, User, Workspace } from "$lib/shared/nav.js";
	import GaugeIcon from "@lucide/svelte/icons/gauge";
	import CommandIcon from "@lucide/svelte/icons/command";

	let { children } = $props();

	const user: User = { name: "Ada Lovelace", email: "ada@example.com" };
	const workspaces: Workspace[] = [{ name: "Acme Inc", plan: "Enterprise", logo: CommandIcon }];
	const items: NavItem[] = [{ title: "Dashboard", url: "/", icon: GaugeIcon }];
</script>

<ModeWatcher />
<AppShell>
	{#snippet sidebar()}
		<AppSidebar {user} {workspaces} {items} label="Sections" isActive={(url) => url === page.url.pathname} />
	{/snippet}
	<PageHeader trail={[{ label: "Dashboard" }]} />
	{@render children()}
</AppShell>
```

In SvelteKit the `isActive` predicate reads `page.url.pathname` from `$app/state` — this
is the router the shell never imports itself. Page content goes in `src/routes/+page.svelte`
and renders through `{@render children()}`, beside `PageHeader`, never inside it.

## 7. Validate

```sh
npx svelte-check   # must reach 0 errors before you call this done
npm run dev
```

A clean `svelte-check` here is meaningful, and narrow: it proves the aliases resolve, the
dependency versions agree, and `utils` landed. It proves **nothing about the theme**. Every
failure this file warns about is silent at build time — a missing base layer, a stylesheet
merge that stopped halfway, a canvas that scrolls sideways — and each one leaves a page
that renders, so *"it displays"* is not a check. Load the page and run these eight:

```js
(() => {
	const root = document.documentElement;
	const token = (name) => getComputedStyle(root).getPropertyValue(name).trim();
	const paint = (name) => {
		const probe = document.createElement("div");
		probe.style.color = `var(${name})`;
		document.body.append(probe);
		const value = getComputedStyle(probe).color;
		probe.remove();
		return value;
	};
	const bare = document.createElement("div");
	document.body.append(bare);
	const borders = getComputedStyle(bare).borderTopColor;
	bare.remove();
	const inset = document.querySelector('[data-slot="sidebar-inset"]');
	const insetMin = inset && getComputedStyle(inset).minWidth;
	const insetOverflow = inset && getComputedStyle(inset).overflowY;
	const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]');
	const wrapperOverflow = wrapper && getComputedStyle(wrapper).overflowY;
	// Wide content pans the canvas, never the root, under the clipped wrapper: measure the inset.
	const wide = inset ?? root;
	const overflow = wide.scrollWidth - wide.clientWidth;
	const scroller = document.scrollingElement ?? root;

	console.table([
		{ check: "base layer", ok: borders === paint("--border"), detail: `borders wear ${borders}, --border paints ${paint("--border")}` },
		{ check: "animations", ok: token("--tw-enter-opacity") !== "", detail: token("--tw-enter-opacity") ? "tw-animate-css is loaded" : "tw-animate-css is missing" },
		{ check: "tokens", ok: token("--sidebar-outline") !== "", detail: token("--sidebar-outline") || "absent — the step-3 merge never finished" },
		{ check: "kit CSS", ok: insetMin === "0px", detail: inset ? `inset min-width: ${insetMin}` : "no [data-slot=sidebar-inset] on this page" },
		{ check: "no h-scroll", ok: overflow <= 1, detail: `${wide.scrollWidth}px of content in a ${wide.clientWidth}px ${inset ? "canvas" : "window"}` },
		{ check: "shell pinned", ok: wrapperOverflow === "clip", detail: wrapper ? `wrapper overflow-y: ${wrapperOverflow}` : "no [data-slot=sidebar-wrapper] on this page" },
		{ check: "app scroll", ok: scroller.scrollHeight <= scroller.clientHeight + 1, detail: `${scroller.scrollHeight}px of document in a ${scroller.clientHeight}px window` },
		{ check: "canvas scrolls", ok: insetOverflow === "auto", detail: inset ? `inset overflow-y: ${insetOverflow}` : "no [data-slot=sidebar-inset] on this page" },
	]);
})();
```

| Check | What a `false` means |
| ----- | -------------------- |
| **base layer** | The `@layer base` block from step 4 is missing. Borders are wearing the text colour. |
| **animations** | `tw-animate-css` is not installed or not imported. Menus, tooltips, the sheet and the drawer open and close with no transition. |
| **tokens** | The step-3 stylesheet merge did not complete — re-run the `add`. |
| **kit CSS** | `parallax-shell`'s `css` blocks never reached the stylesheet (same cause, same fix), or the install predates them. |
| **no h-scroll** | Something on the page is wider than the canvas and not in a scroll container of its own — the canvas pans sideways to show it. The document cannot widen under the clipped wrapper, which is why the check measures the inset and not the root. |
| **shell pinned** | The wrapper rule never reached the stylesheet — the shell scrolls the document, Safari collapses its toolbars on iPad. Same cause as **kit CSS**, same fix; or an `overflow-*` utility on the provider took the clip back. |
| **app scroll** | The DOCUMENT scrolls, which the shell is built to prevent: the wrapper rule (`100dvh` + `overflow: clip`) never reached the stylesheet, or a utility on the provider overrode it. On iPad the browser toolbars collapse as you scroll, and a panel sized `h-svh` shows a strip at its foot. Note the check can only fail on a page taller than the window — the short page step 6 leaves you passes it either way, which is what **shell pinned** is for. |
| **canvas scrolls** | `Sidebar.Inset` is not a scroll container: the shell CSS predates the scroll model, or an `overflow-*` utility on the inset overrode it. Either nothing scrolls, or the document does. |

Compare colours as **resolved** values, never a computed colour against a raw token: a
custom property reads back as its literal text (`#3c354a`) while `getComputedStyle` returns
`rgb(60, 53, 74)`, so a direct `===` between the two is false on a perfectly healthy
project. That is what `paint()` above is for — it makes the browser resolve the token
through a real element and hands back the same form both sides are compared in.

Then the eye check the console cannot do: the sidebar and the header bar render, collapsing
the rail works, and the light/dark toggle at the bar's right flips both halves.

**That toggle is the only appearance control the bar ships.** `ThemeSelector`, `HeaderToggle`
and `SidebarModeToggle` install with the shell and are deliberately not mounted — a real
application puts them on a settings surface of its own, which is what the gallery does. To see
a palette before you have one, call `setTheme("ember")` from the console, or drop a
`<ThemeSelector />` on a page; [shell.md](shell.md#appearance-controls) has the snippet that
puts the whole group back in the bar.

## Traps

- **`--add tailwindcss` without `=plugins:none`** hangs on an interactive plugin picker and
  scaffolds nothing. Exit code is 0, so it looks like it worked.
- **`--yes` does not cover the stylesheet confirmation.** The one prompt that matters has
  its own flag, `--overwrite`. A run missing it hangs silently at the very end.
- **Installing dependencies by bare name** after `--no-deps` picks wrong majors. Two bite
  in practice: `@tanstack/table-core` must be `^8.21.3` (v9 is a rewrite — `createTable`
  and the row-model options are gone, every core type takes a features parameter first, and
  state moves into store atoms, so the errors start inside the reactivity bridge and fan out
  from there), and `vaul-svelte` must be `^1.0.0-next.7` (the stable 0.x is Svelte-4 era).
  Let the CLI do it, or copy its ranges verbatim.
- **Restart the dev server after any dependency install.** Vite caches a failed module
  resolution for the process lifetime, so a correct fix keeps showing the old error.
- **A stylesheet with no `@layer base` block is the silent one.** Nothing errors, nothing
  warns, and only the borders are wrong — they inherit the text colour, because Tailwind
  v4's preflight gives them a width and a style but no colour. Step 4 has the block, step 7
  the one-liner that catches it.
- **`src/themes.css` alone does not theme anything.** If colors look like stock shadcn,
  the stylesheet merge from step 3 did not complete — check the global stylesheet for
  `--sidebar-outline` and `--success-subtle`, and re-run the add if they are absent.
- **A port conflict is not a build failure.** `Port 5173 is already in use` means another
  dev server is running, and Vite may quietly serve a different app on the next port.
