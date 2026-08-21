# Bootstrapping a new project from an empty directory

Contents: [When this applies](#when-this-applies) · [The chain](#the-chain) ·
[1. Scaffold](#1-scaffold-the-svelte-project) · [2. components.json](#2-write-componentsjson-by-hand) ·
[3. Install Parallax](#3-install-parallax) · [4. The missing pieces](#4-the-two-pieces-init-would-have-left) ·
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
npm install -D shadcn-svelte
```

Then the two manual steps, the shell wiring, and `npx svelte-check`.

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

One command resolves the whole chain — the theme, the axes, the shell, the nav trio, the
official components underneath — and it does three separate things:

1. writes the component files under `src/lib/`
2. writes `src/themes.css` (the eleven alternate palettes)
3. **merges the base tokens into the global stylesheet** — 56 `cssVars` plus two `css`
   blocks. This is where `--background`, `--primary`, the success/warning/info families,
   the subtle family and `--sidebar-outline` come from; `themes.css` holds only the
   `[data-theme]` alternates and is useless on its own.

**Let the CLI install the npm dependencies — never pass `--no-deps` here.** It resolves
the ranges the components were built against, `@tanstack/table-core@^8.21.3` and
`vaul-svelte@^1.0.0-next.7` among them, and both have a newer release that does not
compile against this code. Installing those by bare name afterwards is how you earn
twenty-odd `svelte-check` errors in files you never touched.

If a run did end early, re-run the same command: the merge is the last step, so an
interrupted install is one that wrote every file and themed nothing.

## 4. The two pieces `init` would have left

Skipping `init` skips two things that nothing else provides:

```sh
npx shadcn-svelte@latest add utils --yes   # writes src/lib/utils.ts (the `cn` helper)
npm install -D shadcn-svelte               # provides the `shadcn-svelte/tailwind.css` the CLI imports
```

- **`utils`** is not pulled in as a registry dependency of the shell. Without it every
  component that imports `$lib/utils.js` fails to resolve — roughly a hundred
  `svelte-check` errors that all trace back to this one file.
- **The `shadcn-svelte` package** must be a real dependency because the stylesheet merge
  adds `@import "shadcn-svelte/tailwind.css";`. Running the CLI through `npx` does not put
  the package in `node_modules`, and the import then fails at dev-server start with
  `Can't resolve 'shadcn-svelte/tailwind.css'`.

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

A clean `svelte-check` here is meaningful: it proves the aliases resolve, the dependency
versions agree, and `utils` landed. Then load the page and confirm the sidebar, the header
bar and its appearance controls render, and that switching palette and light/dark works.

## Traps

- **`--add tailwindcss` without `=plugins:none`** hangs on an interactive plugin picker and
  scaffolds nothing. Exit code is 0, so it looks like it worked.
- **`--yes` does not cover the stylesheet confirmation.** The one prompt that matters has
  its own flag, `--overwrite`. A run missing it hangs silently at the very end.
- **Installing dependencies by bare name** after `--no-deps` picks wrong majors. Two bite
  in practice: `@tanstack/table-core` must be `^8.21.3` (the 9.x generics take different
  arity, ~10 errors), and `vaul-svelte` must be `^1.0.0-next.7` (the stable 0.x is
  Svelte-4 era, ~15 errors). Let the CLI do it, or copy its ranges verbatim.
- **Restart the dev server after any dependency install.** Vite caches a failed module
  resolution for the process lifetime, so a correct fix keeps showing the old error.
- **`src/themes.css` alone does not theme anything.** If colors look like stock shadcn,
  the stylesheet merge from step 3 did not complete — check the global stylesheet for
  `--sidebar-outline` and `--success-subtle`, and re-run the add if they are absent.
- **A port conflict is not a build failure.** `Port 5173 is already in use` means another
  dev server is running, and Vite may quietly serve a different app on the next port.
