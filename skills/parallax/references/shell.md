# Shell contracts

Contents: [AppShell](#appshell) · [AppSidebar](#appsidebar) · [PageHeader](#pageheader) ·
[BreadcrumbTrail](#breadcrumbtrail) · [NavMain](#navmain) · [NavUser](#navuser) ·
[WorkspaceSwitcher](#workspaceswitcher) · [Nav types](#nav-types) ·
[Appearance controls](#appearance-controls)

All paths assume the standard aliases from `components.json`. Every component below is
installed source — read the file's own header comment before non-trivial edits; the
reasoning lives there.

## AppShell

`$lib/components/layout/AppShell.svelte`

| Prop           | Type      | Default        | Notes                                          |
| -------------- | --------- | -------------- | ---------------------------------------------- |
| `children`     | `Snippet` | —              | The page, rendered inside `Sidebar.Inset`      |
| `sidebar`      | `Snippet` | `<AppSidebar />` | Replace to pass data — see the correct pair    |
| `sidebarWidth` | `string`  | `"250px"`      | The expanded rail width                        |

`AppShell` owns `Sidebar.Provider`: the open/closed state (bound, seeded from the
`sidebar_state` cookie via `getStoredSidebarState()` — the SPA fix the official block
lacks), the mobile breakpoint, and the Ctrl/Cmd+B shortcut.

Incorrect — mounting the provider yourself next to an installed AppShell:

```svelte
<Sidebar.Provider>
	<AppSidebar ... />
</Sidebar.Provider>
```

Correct — AppShell is the provider; give it the sidebar through the snippet:

```svelte
<AppShell>
	{#snippet sidebar()}
		<AppSidebar {user} {workspaces} {items} isActive={(url) => url === page.url.pathname} />
	{/snippet}
	<PageHeader {trail} />
	<main>…</main>
</AppShell>
```

**The canvas has `min-width: 0`.** `parallax-shell` ships
`:where([data-slot="sidebar-inset"]) { min-width: 0 }` unlayered, because the inset is a flex
item beside the rail and its automatic minimum size would otherwise be the min-content of the
whole page — a table wider than the window pushes the shell past the viewport and scrolls the
DOCUMENT sideways, taking the sidebar and the header with it. Consequences:

- Anything that can outgrow the page needs a scroll container of its own. `Table.Root` has
  one; a wide `<pre>`, a chart band or a board column may not.
- The rule reaches any `Sidebar.Inset`, whether it came from `AppShell` or from a provider you
  mounted yourself.
- To let one canvas widen the document deliberately: `<Sidebar.Inset class="min-w-max!">`. The
  `!` is required — Parallax CSS is unlayered and outranks utilities — while the rule's
  `:where()` keeps its specificity at zero, so plain CSS of your own takes it back unaided.

## AppSidebar

`$lib/components/layout/AppSidebar.svelte` — also accepts every `Sidebar.Root` prop
(`side`, `collapsible = "icon"`, `variant`, …).

| Prop                      | Type                             | Notes                                             |
| ------------------------- | -------------------------------- | ------------------------------------------------- |
| `user`                    | `User`                           | Footer identity; region renders only when set     |
| `workspaces`              | `Workspace[]`                    | Header switcher; region renders only when non-empty |
| `activeWorkspace`         | `Workspace` (`$bindable`)        | Forwarded to `WorkspaceSwitcher`                  |
| `onActiveWorkspaceChange` | `(w: Workspace) => void`         | Fires only on a real change                       |
| `onAddWorkspace`          | `() => void`                     | Wires the "Add workspace" row                     |
| `items`                   | `NavItem[]`                      | The navigation                                    |
| `label`                   | `string`                         | Heading over the categories group                 |
| `activePath` / `isActive` | `string` / `(url) => boolean`    | `isActive` wins; forwarded to `NavMain`           |
| `header`/`content`/`footer` | `Snippet`                      | Region overrides (a brand mark, a custom footer)  |
| `userMenu`                | `Snippet`                        | Forwarded to `NavUser` as `menu`                  |

`variant` follows the persisted floating axis unless a caller pins one explicitly.

## PageHeader

`$lib/components/layout/PageHeader.svelte` — the sticky top bar. No prop is required;
`<PageHeader />` renders a correct bar. `Crumb` is re-exported from its module script.

| Prop / snippet  | Type                | Default                                            |
| --------------- | ------------------- | -------------------------------------------------- |
| `trail`         | `Crumb[]`           | `[]` — feeds the default breadcrumb                |
| `class`         | `string`            | merged onto the sticky WRAPPER                     |
| `barClass`      | `string`            | merged onto the painted BAR                        |
| `sidebarTrigger`| `Snippet`           | `Sidebar.Trigger` + separator, as one unit         |
| `breadcrumb`    | `Snippet<[Crumb[]]>`| `<BreadcrumbTrail {trail} class="min-w-0 flex-1"/>`|
| `search`        | `Snippet`           | **empty** — the one app-specific slot              |
| `controls`      | `Snippet`           | the four appearance controls                       |

Contracts that make overrides safe:

- **`search`**: whatever you pass must carry `min-w-0 shrink` — between ~640 and ~1200px
  the bar is over-subscribed and this slot is the designated giver.
- **`breadcrumb`**: render into a `min-w-0 flex-1` box whose width your own content cannot
  change; a content-sized box re-enters the trail's measurement loop.
- **`sidebarTrigger`**: it is a snippet (not a boolean) because `Sidebar.Trigger` throws
  outside a `Sidebar.Provider` — pass an empty snippet to render the header providerless.
- **children are rejected at compile time** (`Omit<…, "class" | "children">`): page
  content goes beside the header, never inside it.
- The floating / auto-hide / inverted behaviour needs no wiring here — the header already
  carries `data-slot="page-header"` / `"page-header-bar"` and writes
  `data-floating`/`data-hidden` itself.

Incorrect — search field without the giver classes (clips the controls on laptops):

```svelte
{#snippet search()}<Input class="w-64" placeholder="Search" />{/snippet}
```

Correct:

```svelte
{#snippet search()}<Input class="w-64 min-w-0 shrink" placeholder="Search" />{/snippet}
```

## BreadcrumbTrail

`$lib/components/layout/BreadcrumbTrail.svelte` — measures itself and collapses middle
steps into a menu when space runs out; on mobile the menu becomes a drawer.

```ts
type Crumb = { label: string; href?: string };
```

Root first. Ancestors carry `href`; a mid-trail heading may omit it; the **last step is
the current page and never has `href`**.

## NavMain

`$lib/components/navigation/NavMain.svelte`

| Prop         | Type                      | Notes                                             |
| ------------ | ------------------------- | ------------------------------------------------- |
| `items`      | `NavItem[]`               | destinations (no `items`) above, categories below |
| `label`      | `string?`                 | heading over the categories; unheaded when unset  |
| `activePath` | `string?`                 | default predicate is `url === activePath`         |
| `isActive`   | `(url: string) => boolean`| full control; wins over `activePath`              |

The group holding the current page auto-opens (and closes the others) when the route
crosses into it; between navigations the reader owns the open state. In the icon rail,
categories become right-side flyout menus. There is no `defaultOpen` — active-state drives
it.

Incorrect — importing a router into a shell component:

```ts
import { page } from "$app/state"; // inside NavMain/AppSidebar: never
```

Correct — the predicate closes over the router at the app root, reactivity flows through:

```svelte
<AppSidebar {items} isActive={(url) => url === page.url.pathname} />
```

## NavUser

`$lib/components/navigation/NavUser.svelte`

| Prop   | Type      | Notes                                                        |
| ------ | --------- | ------------------------------------------------------------ |
| `user` | `User`    | `avatar?` URL renders an image; otherwise initials from name |
| `menu` | `Snippet?`| replaces the dropdown body below the identity header         |

The default menu rows (Upgrade/Account/Billing/…) are decorative; a real application
passes `menu` (or `userMenu` on `AppSidebar`) with its own `DropdownMenu.Item`s.

## WorkspaceSwitcher

`$lib/components/navigation/WorkspaceSwitcher.svelte`

| Prop                      | Type                      | Notes                                  |
| ------------------------- | ------------------------- | -------------------------------------- |
| `workspaces`              | `Workspace[]`             | empty list renders nothing (no crash)  |
| `activeWorkspace`         | `Workspace?` (`$bindable`)| **no fallback by design** — see below  |
| `onActiveWorkspaceChange` | `(w: Workspace) => void`  | fires only on a real change            |
| `onAddWorkspace`          | `() => void`              | wires the trailing row                 |

The default selection resolves at read time (`activeWorkspace ?? workspaces[0]`), so:
binding an initially-`undefined` variable is supported (a `$bindable` fallback would throw
`props_invalid_value` at mount), and a `workspaces` update never silently resets an
explicit selection. The change guard compares `name` — the `{#each}` key — because a
`$bindable` write re-proxies and object identity across that boundary is meaningless.

## Nav types

`$lib/shared/nav.ts` — the published contract. Generic over the URL
(`NavItem<U extends string = string>`) so an app may narrow `url` to its own route union.

```ts
type NavIcon = LucideIcon; // rendered as <item.icon />
type Workspace = { name: string; plan: string; logo: NavIcon }; // name is the {#each} key
type User = { name: string; email: string; avatar?: string };
type NavSubItem<U extends string = string> = { title: string; url: U };
type NavItem<U extends string = string> = {
	title: string; // also the collapsed-rail tooltip — must stand alone
	url?: U; // only on entries WITHOUT items
	icon?: NavIcon;
	items?: NavSubItem<U>[]; // presence makes the entry a category
};
type NavIsActive = (url: string) => boolean;
```

`url` XOR `items` — an entry with children is a category: clicking it expands, nothing
else. Giving it a URL too would make one click carry two meanings.

## Appearance controls

`HeaderToggle` and `SidebarModeToggle` (`$lib/components/navigation/`) are prop-free
dropdowns that read and write the appearance hooks directly; `ThemeSelector` takes
`compact` for the header form; `ModeToggle` is the light/dark swap. All four are the
default `controls` snippet of `PageHeader` — subtract by overriding the snippet, never by
editing the header.
