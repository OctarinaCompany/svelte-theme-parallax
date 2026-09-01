# Shell contracts

Contents: [AppShell](#appshell) · [The scroll model](#the-scroll-model) ·
[AppSidebar](#appsidebar) · [PageHeader](#pageheader) ·
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
whole page — a table wider than the window would widen the canvas past the viewport, and under
the clipped wrapper a widened canvas is cut at the viewport's edge, header and all, with no
scrollbar to bring it back (while the document still scrolled, it scrolled sideways instead and
took the sidebar with it). With the minimum at zero the canvas holds its width, and what
escapes pans the CANVAS: `overflow-x` computes to `auto` beside the `overflow-y: auto` the
[scroll model](#the-scroll-model) gives it, so the rail and the header hold still while the
page's own content slides. Consequences:

- Anything that can outgrow the page needs a scroll container of its own. `Table.Root` has
  one; a wide `<pre>`, a chart band or a board column may not — and what has none pans the
  whole canvas sideways rather than its own box.
- The rule reaches any `Sidebar.Inset`, whether it came from `AppShell` or from a provider you
  mounted yourself.
- To let one canvas take the width of its content deliberately:
  `<Sidebar.Inset class="min-w-max!">`. Inside the shell that only moves the cut to the
  canvas's own edge — the wrapper clips, and nothing scrolls the document — so it is a choice
  for a page that has [unlocked the document](#the-scroll-model). The `!` is required —
  Parallax CSS is unlayered and outranks utilities — while the rule's `:where()` keeps its
  specificity at zero, so plain CSS of your own takes it back unaided.

## The scroll model

**The shell is the viewport; the canvas scrolls.** Inside the shell the document never
scrolls: the provider's wrapper is pinned to the viewport and clipped, and `Sidebar.Inset` —
the `<main>`, which `AppShell` gives `id="main-content"` — is the one scroll container.
`parallax-shell` ships that as four unlayered rules, verbatim:

```css
:where(:root:has([data-slot="sidebar-wrapper"])) {
	overscroll-behavior: none;
}

:where([data-slot="sidebar-wrapper"]) {
	height: var(--shell-height, 100dvh);
	min-height: 0;
	overflow: clip;
}

:where([data-slot="sidebar-inset"]) {
	min-width: 0;
	min-height: 0;
	overflow-y: auto;
	overscroll-behavior-y: contain;
	scroll-padding-top: calc(var(--page-header-height) + 0.5rem);
}

:where([data-slot="page-header"], [data-slot="page-header"] *) {
	scroll-margin-top: calc((var(--page-header-height) + 0.5rem) * -2);
}

@media print {
	:where([data-slot="sidebar-wrapper"]) {
		height: auto;
		overflow: visible;
	}
	:where([data-slot="sidebar-inset"]) {
		overflow: visible;
	}
}
```

Why. iOS and iPadOS Safari collapse their toolbars when the DOCUMENT scrolls — a browser
gesture a dashboard has no use for, and the one that exposed the rail strip: a fixed rail
sized `h-svh` is cut to the small viewport, and the toolbar collapsing uncovers the
difference along its foot. With a non-scrolling document the toolbars never move, so
`100dvh` is the viewport as it stands, and only rotation — or a software keyboard — changes
it; `svh` would still pin the wrapper to the small viewport and leave the toolbar-height strip
at its foot, and `lvh` would push the canvas's bottom under the toolbars whenever they are up.
The keyboard is the case `dvh` cannot follow on its own: iOS resizes only the VISUAL viewport
when the software keyboard comes up, while `dvh` tracks the layout viewport, so the bottom of
the canvas — and the field being typed into — would sit behind the keys. `AppShell` writes
`--shell-height` from `window.visualViewport` while a keyboard is up (the rule's `var()`
falls back to `100dvh` the rest of the time) and calls `window.scrollTo(0, 0)` to undo the
pan Safari gives the visual viewport; a hardware or floating keyboard resizes nothing and
changes nothing. `clip` rather than `hidden`, because `hidden` is still a scroll container —
script can scroll it, and it would catch the sticky header. `overscroll-behavior-y: contain`
stops a flick at the end of the canvas from chaining into the document (the rubber band). The
root rule covers the case `contain` cannot reach: a touch that starts on chrome outside the
canvas — the rail, the header, a right rail — never scrolls the canvas at all, so on iOS it
rubber-bands the document itself; `overscroll-behavior: none` on `:root` suppresses that, and
the `:has()` scopes it to a document that holds the shell, so a page without one keeps its
bounce. `scroll-padding-top` sits on the canvas rather than on `:root` because
`scrollIntoView` and a fragment honour the padding of the container that actually scrolls.
And `overflow-x` computes to `auto` beside `overflow-y: auto`, so wide content that escapes
its own scroller pans the canvas sideways rather than the document — `min-width: 0` still
keeps the canvas from widening. The rail's own rule,
`:where([data-slot="sidebar-container"]) { height: auto }`, stays outside this set: it sizes
the fixed rail by `inset-y-0` instead of `svh`, and still matters to a consumer who unlocks
the document.

The negative `scroll-margin-top` on the header is the other half of that reserve, and it is
not optional: the bar is pinned at `top: 0` and is never taller than the reserve is deep, so
its own controls sit inside the band permanently, the browser reads every one of them as
obscured, and focus landing on one scrolls the canvas to reveal something that travels with
the scrollport and can never be revealed — measured as a 361px jump upwards, or clean to the
top when there was less than that above. It bites on every dialog, menu or popover in the bar
closing (bits-ui's focus scope restores focus with a bare `.focus()`, no `preventScroll`) and
again on Shift+Tab back into the bar, which is the browser's own sequential-focus scroll and
reachable by no script at all. Two bars' worth rather than one, because the auto-hide option
translates the bar a further full height off the top; over-cancelling is inert, since focus
scrolls into view only if needed. Everything outside the bar keeps the reserve. If you set a
different `scroll-padding-top` — on the canvas, or on `:root` once the document scrolls again
— mirror it here.

What it means for your code, as six pairs.

Incorrect — a right-hand rail sized like a viewport (the recipe the fixed rail used to
carry; on iPad it is cut to the small viewport and a strip of page shows under it):

```svelte
<aside class="sticky top-0 h-svh w-80 shrink-0 border-s border-sidebar-outline">…</aside>
```

Correct — a sibling of `Sidebar.Inset` in the provider's row (the installed
`AppShell.svelte` is your code; put it beside the inset there), stretched as a flex child,
its content filling with `flex-1 min-h-0` and scrolling in its own box. `relative`, because a
pull-strip or collapse handle positioned `absolute` inside the rail needs the rail as its
containing block — the `sticky` the old recipe carried provided one for free, and dropping it
without `relative` sent the strip to the window's left edge in a consumer app:

```svelte
<Sidebar.Inset id="main-content" tabindex={-1}>…</Sidebar.Inset>
<aside class="relative flex w-80 shrink-0 flex-col border-s border-sidebar-outline">
	<div class="flex-1 min-h-0 overflow-y-auto">…</div>
</aside>
```

Incorrect — reading the document's position, which inside the shell is 0 forever:

```ts
const y = window.scrollY;
window.scrollTo({ top: 0 });
```

Correct — asking which box scrolls the element (`$lib/shared/scroll-parent.js`, installed
with `parallax-primitives`; it answers the document on a page where the document still
scrolls), or letting the browser do it:

```ts
import { scrollParentOf } from "$lib/shared/scroll-parent.js";

const scroller = scrollParentOf(el);
const y = scroller.scrollTop;
scroller.scrollTo({ top: 0 });
target.scrollIntoView(); // honours the canvas's scroll-padding-top
```

Incorrect — a router that restores the canvas's position and stops there. PageDown, Space and
the arrow keys scroll from the FOCUSED element and walk up through its ancestors, never across
to a sibling scroller; after a click on a rail link focus sits in the rail, whose nearest
scroller is not the canvas, so the keys scroll nothing:

```ts
const canvas = document.getElementById("main-content")!;
canvas.scrollTo({ top: 0, behavior: "instant" });
```

Correct — scroll AND focus the canvas after every in-app navigation. `AppShell` gives the
inset `id="main-content"`, `tabindex={-1}` so it can take focus at all, and
`focus-visible:outline-hidden` so no ring is drawn around a whole page; `preventScroll` keeps
the focus from moving what was just positioned. The one exception is a fragment landing, where
the section's heading takes focus instead — the gallery's `App.svelte` does both:

```ts
const canvas = document.getElementById("main-content")!;
canvas.scrollTo({ top: 0, behavior: "instant" });
if (!location.hash) canvas.focus({ preventScroll: true });
```

Incorrect — a listener that waits for the document to scroll (`scroll` does not bubble, so
the canvas's events never reach it):

```svelte
<svelte:window onscroll={measure} />
```

Correct — the scroll parent's own events, or the capture phase for "any scroll anywhere":

```ts
import { scrollEventTargetOf, scrollParentOf } from "$lib/shared/scroll-parent.js";

scrollEventTargetOf(scrollParentOf(el)).addEventListener("scroll", measure, { passive: true });
// or, for every scroll container at once:
window.addEventListener("scroll", measure, { capture: true, passive: true });
```

Incorrect — a page wrapper that clips sideways between the canvas and the header (beside an
`overflow-y: visible`, `overflow-x: hidden` computes to `auto`: the wrapper becomes the
scroll container, and both the sticky and the auto-hide follow it instead of the canvas):

```svelte
<div class="overflow-x-hidden">
	<PageHeader {trail} />
	…
</div>
```

Correct — `clip` is not a scroll container:

```svelte
<div class="overflow-x-clip">
	<PageHeader {trail} />
	…
</div>
```

Incorrect — sticky chrome of your own at the top of the canvas: a filter bar over a long
table, a second header, a section nav. Nothing between it and the canvas scrolls, so it
sticks to the CANVAS and inherits the canvas's reserve, which parks its controls inside the
band permanently — the same trap the bar's negative `scroll-margin-top` cancels, on a box the
shipped rule has no selector for. A menu in it closing, or Shift+Tab from the rows below,
throws the page upwards:

```svelte
<div class="sticky top-0 z-30 flex items-center gap-2 bg-background py-3">
	<Input bind:value={query} class="w-64 min-w-0" placeholder="Filter rows" />
	<Button variant="outline">Columns</Button>
</div>
<Table.Root>…</Table.Root>
```

Correct — park it at the reserve's depth rather than at zero. Below the band nothing is
obscured, so nothing scrolls; and it is where the chrome belongs anyway, since at `top-0` it
sits under the bar's `z-40` — the same bug wearing its visible half:

```svelte
<div class="sticky top-[calc(var(--page-header-height)+0.5rem)] z-30 flex items-center gap-2 bg-background py-3">
	…
</div>
```

If it truly has to sit at zero — a page you render without `PageHeader` still gets the
reserve, because the canvas rule is unconditional — cancel it the way `parallax-shell`
cancels it for the bar. Stamp a `data-slot` of your own on the box and key a rule off it: a
class on the box alone will not do, because `scroll-margin` does not inherit and the browser
scrolls to the focused CONTROL, so the rule has to reach the descendants. The doubled value
is the shipped one; over-cancelling is inert, and it covers chrome of yours that hides on
scroll as well:

```css
:where([data-slot="filter-bar"], [data-slot="filter-bar"] *) {
	scroll-margin-top: calc((var(--page-header-height) + 0.5rem) * -2);
}
```

A sticky `Table.Header` needs none of this: `Table.Root` wraps the table in its own
`overflow-x-auto` box, so that sticky resolves against a container carrying no scroll-padding
at all. The jump needs both halves — scroll-padding on the box the sticky resolves against,
and the sticky sitting inside the band it reserves.

**Printing** is the one escape the kit ships: under `@media print` both boxes grow and
release their overflow, so a print is the whole page rather than one viewport.

**Unlocking the document** is possible, and it costs what the model bought. The rules are
`:where()`, so plain CSS of your own beats them at any specificity — but a utility does not,
because Parallax CSS is unlayered, so the override from a class needs `!` on both boxes:
`<Sidebar.Inset class="overflow-visible!">` and, on the provider in your `AppShell.svelte`,
`<Sidebar.Provider class="h-auto! min-h-svh! overflow-visible!">`. After that the document
scrolls again: Safari's toolbars collapse as you scroll, `scroll-padding-top` has to be
restated on `:root` in your stylesheet (the canvas no longer scrolls, so its padding applies
to nothing), the rail keeps its `height: auto` rule, which is exactly the case it guards, and
the root keeps `overscroll-behavior: none` — it stops the rubber band, not the scroll, so
restate it as `auto` in your stylesheet if you want the bounce back. Everything that reads its
scroll parent keeps working — the answer becomes the document.

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
| `controls`      | `Snippet`           | `<ModeToggle />` — the light/dark swap, alone      |

Contracts that make overrides safe:

- **`search`**: whatever you pass must carry `min-w-0 shrink` — it is the slot that gives
  when the bar runs out of room. With the default controls (one button) it rarely has to;
  put your own group of controls back in the bar and it does.
- **`breadcrumb`**: render into a `min-w-0 flex-1` box whose width your own content cannot
  change; a content-sized box re-enters the trail's measurement loop.
- **`sidebarTrigger`**: it is a snippet (not a boolean) because `Sidebar.Trigger` throws
  outside a `Sidebar.Provider` — pass an empty snippet to render the header providerless.
- **children are rejected at compile time** (`Omit<…, "class" | "children">`): page
  content goes beside the header, never inside it.
- The floating / auto-hide / inverted behaviour needs no wiring here — the header already
  carries `data-slot="page-header"` / `"page-header-bar"` and writes
  `data-floating`/`data-hidden` itself.
- **Auto-hide follows the bar's own scroll container.** The header reads and listens on the
  nearest scrolling ancestor of its wrapper — the canvas inside the shell, the document on a
  page that still scrolls — never on `window` by name. So a box that scrolls between the
  canvas and the header both steals the sticky and becomes what auto-hide measures, and a
  page that scrolls a box of its own while the canvas never moves gives the bar nothing to
  react to. [The scroll model](#the-scroll-model) has the pairs.
- **Everything in the bar carries a negative `scroll-margin-top`**, the markup you pass to
  `search` and `controls` included: it cancels the canvas's reserve, so focus landing in the
  bar — a menu of yours closing, Shift+Tab from the page below — cannot move the page. The one
  thing it breaks is an explicit `scrollIntoView({ block: "start" })` on a control in the bar,
  which now overshoots by a bar's height; that control takes the offset back with
  `scroll-mt-0!` (the `!` because Parallax CSS is unlayered).

Incorrect — search field without the giver classes (clips the right-hand controls as soon
as the bar is over-subscribed):

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
`compact` for the header form; `ModeToggle` is the light/dark swap.

**Only `ModeToggle` is in the bar by default.** Light/dark is the one appearance choice a
reader makes while reading; a palette, an inverted rail and a floating bar are set once,
which is a settings page's job — the gallery has one, and it drives the same hooks. Putting
any of them back is the `controls` snippet, never an edit to the header:

```svelte
<PageHeader {trail}>
	{#snippet controls()}
		<HeaderToggle />
		<SidebarModeToggle />
		<ThemeSelector compact />
		<ModeToggle />
	{/snippet}
</PageHeader>
```

`parallax-shell` still installs all four for exactly that override; `HeaderToggle` and
`SidebarModeToggle` arrive through `parallax-appearance-controls`, and each offers three
values — `Default`, `Inverted` and `Vibrant`, the brand painted onto the surface. Vibrant
is drawn by `src/vibrant.css`, which `parallax-appearance` writes and the project imports. Budget it: those four
cost 377px of bar against the default's 72px, and the search field is what pays.
