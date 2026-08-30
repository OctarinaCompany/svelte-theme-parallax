# Gallery pattern recipes

Contents: [How to use this file](#how-to-use-this-file) · [Tables in cards](#tables-in-cards) ·
[Chat surface](#chat-surface) · [Page headers](#page-headers) · [List group](#list-group) ·
[File upload](#file-upload) · [Typography](#typography) ·
[Sizing and density](#sizing-and-density) · [Data table](#data-table) ·
[Data grid](#data-grid)

## How to use this file

These are the flagship designs of the Parallax gallery, distilled to their load-bearing
decisions. They are **not registry items** — the code is readable source you study and
adapt. For each pattern: read this recipe first, then the source when you build — locally
if the Parallax repo is around, otherwise from
`https://raw.githubusercontent.com/OctarinaCompany/svelte-theme-parallax/main/<path>`.
The complete gallery map (every page, every ui/ folder) is in
[components.md](components.md). Every COMPONENT these recipes name is a published registry
item: install `parallax-<name>` (e.g. `parallax-data-table`) and let it resolve its own
dependency chain — never copy its source. Only a verbatim port of an official component
installs by its bare name, and `collapsible`, `label` and `aspect-ratio` are the whole of
that list; a 404 on `.../r/parallax-<name>.json` is the test.

## Tables in cards

A list page's table never stands bare: it sits flush inside a Card — search, filters and
density in the header, rows edge-to-edge, pagination in the footer. Reach for it whenever
a data table is the page's main content.

- `Card.Root` takes `gap-0 py-0`: the table runs edge-to-edge between the header's rule
  and the footer; all vertical rhythm moves onto the rows.
- Edge cells re-pad with `ps-6!`/`pe-6!` so columns align with the card-header controls
  (the `!` beats the theme's unlayered cell-padding rule).
- The last row's border is **restored** — `[&_tbody_tr:last-child]:border-b` outweighs the
  table-body's stripper; that row, not the footer, draws the line above the pager.
- Global search filters the source array feeding `data: () => rows` (a getter, so
  reactive) instead of per-column filters: one query spans every column, formatted dates
  included.
- The selection action-bar counts raw `Object.keys(rowSelection).length` and clears with
  `resetRowSelection()` — filtered helpers collapse the bar when a search hides checked
  rows.
- The filter popover holds *pending* state committed on Apply and re-seeded on open; the
  trigger badge counts applied filters; Apply resets `pageIndex`.
- Secondary columns drop by **card width, not viewport**: `@container` on `Card.Root`, then
  `hidden @min-[38rem]:table-cell` — 48rem and 57rem for the next two — on the head and body
  cells of the columns that go. Each threshold is the width the table needs once that column
  returns.
  `lg:`/`xl:` would be wrong here — the viewport still counts the 250px the sidebar spent,
  so a viewport-keyed column survives well past the point where the card can hold it. The
  page passes the map as `columnClass` (id → classes) rather than adding a field to the
  published `ColumnMeta`, and the helper applies it to the `<th>` and every `<td>`.
- Sort-header ghost buttons restate `text-xs font-semibold` (the Button's own scale would
  override the head's); a blank `header: ""` keeps FlexRender from printing the column id.

Composes, all as `parallax-<name>` items: `card`, `checkbox`, `dropdown-menu`, `popover`,
`select`, `toggle-group`, `data-table` (the engine), `action-bar`, `table` for its
`density` prop, `badge` for the `*-subtle` variants.
Source: `src/lib/components/pages/TablesInCardsPage.svelte` +
`pages/tables-in-cards-table.svelte`.

## Chat surface

The AI chat family assembled into one screen: a scrolling transcript whose turns carry
reasoning traces and tool calls, a pager over a regenerated answer, starters before the
first message, and a composer that keeps its own height underneath. Reach for it when a
chat *is* the page rather than a widget on one.

- Four elements decide the behaviour: a flex column **with a height**, a header, the
  `Conversation.Root` scroller taking `flex-1`, and the composer as its **sibling**. A
  column that grows with its content never overflows, so its viewport never scrolls and
  therefore never pins.
- `min-h-0` is what makes the scroller a scroller: a flex item's `min-height` resolves to
  `auto`, so without it the transcript pushes the card taller and the *page* scrolls. The
  root bakes `min-h-0` in and leaves `flex-1` to the caller — baked in, `flex-1` would beat
  any `h-*` you pass, because `flex-basis` outranks `height` on the main axis.
- The composer never goes inside `Conversation.Content`; there it scrolls away with the
  transcript. `Conversation.ScrollButton` is the opposite case — a sibling of the content
  *inside* the root, so the outer anchor is its containing block and the scroller cannot
  clip it.
- The pin is not code you write. Growing the transcript is enough: the root observes the
  viewport **and each of its children** (the viewport's own box never changes while a reply
  streams), follows the bottom while the reader is inside the `offset` band, and releases on
  any scroll whose `scrollTop` went down. `onAtBottomChange` is the read-out.
- Key the transcript `{#each}` by **message id**. A turn's text changes on every streamed
  word and its draft changes under the pager, so keying by content or index re-creates the
  turn — closing every reasoning panel and tool call above the one being written, and
  re-arming the reasoning auto-close, which fires once per instance.
- A turn is a **list of drafts plus an index**, not a string: regenerating replaces an answer
  rather than appending a turn, and that index is what `Message.Branch` binds to. A turn that
  was never regenerated has one draft and renders with no pager at all.
- `Message.BranchContent` takes `branches: Snippet[]` — Svelte cannot count children — and an
  array of snippets cannot be built from a loop, so declare one `{#snippet}` per possible
  draft and slice the list. Put them inside a plain element: a `{#snippet}` written directly
  inside a component becomes a **prop** of that component.
- One `ChatStatus` on the page drives three things at once — `PromptInput.Submit` turns into
  a stop button, Enter stops submitting *because* it did (no `onkeydown` veto needed), and
  the regenerate action disables. `isChatGenerating` is the predicate.
- Keep `PromptInputFile.file`, never `url`: the composer revokes every object URL it minted
  as soon as `onSubmit` returns.
- Reduced motion is already handled inside the parts (`instant` scrolling, no per-word blur).
  What is left to the caller is the **cadence** — deliver a simulated reply in one step
  rather than fifty, or the transcript grows fifty times and every growth is a scroll.

Composes, all as `parallax-<name>` items: `conversation`, `message`, `prompt-input`,
`suggestion`, `reasoning`, `tool`, `card` for the frame, plus `code-block` and `empty`
reached through `Message.Response` and `Conversation.EmptyState`. One optional item:
`code-highlighter`, mounted ONCE as `<CodeHighlighter.Root>` at the app root above the
transcript. It buys the answers real TextMate grammars for 32 languages instead of the block's
fourteen — a model writes Rust, Go and Dockerfile as readily as TypeScript — and it colours the
constructs a line-at-a-time tokenizer has to give up on, so a block comment, a docstring or a
template literal stays one colour past its first line. Leave it out and every fence still
renders, in the house colours.
Source: `src/lib/components/pages/ChatSurfacePage.svelte`.

## Page headers

The page-opening block: pretitle over title, closed by a 1px rule, optionally carrying a
button, a bottom-hung tab row, an avatar stack, a cover image, or a chart band.

- Three fixed recipes: header `mb-8 dark:bg-background dark:text-foreground`, body
  `border-b py-6`, optional inset `px-3 md:px-9`.
- Pretitle: `text-[0.625rem] font-medium tracking-label uppercase text-muted-foreground`;
  title: `text-2xl font-medium md:text-[1.625rem]` — one of the theme's only responsive
  type steps.
- Tabs hang off the bottom rule: list `-mb-6 flex`, links `-mb-px … py-6`, so the active
  `border-primary` underline lands **on** the header rule and replaces that segment.
- Tab margins sit on the `<li>` (`mx-3 first:ml-0 last:mr-0`), not the link — each
  underline is exactly as wide as its label.
- A cover image is a *sibling* of the inset container (full-bleed); the body pulls up
  `-mt-9 md:-mt-18` and a `size-32 border-4 border-card` avatar straddles the seam.
- Merge active states with `cn()`, never string concatenation — contradictory utilities
  are otherwise resolved by Tailwind's sort order, not intent.

Composes, all as `parallax-<name>` items: `card`, `avatar`, `button`, `chart`. Source:
`src/lib/components/pages/PageHeadersPage.svelte`.

## List group

Bordered, rounded stacks of uniform rows (a card's quiet alternative to a table) — plain
rows, nav links, or avatar+meta rows, with active, hover-action, large and flush variants.
A class recipe, not a component.

- All borders live on the **container**: `[&>*]:border [&>*+*]:border-t-0` states each
  edge once and never doubles a hairline.
- Radius rides the first/last child (`[&>*:first-child]:rounded-t-md`), **not**
  `overflow-hidden` — clipping cuts the item's border at the corner instead of bending it.
- The active row needs `border-primary!` — the container's arbitrary variant outweighs a
  plain utility and would silently repaint it grey.
- Flush *replaces* the group class (`[&>*]:border-b [&>*:last-child]:border-b-0`, no
  radius, items drop their `px`) rather than stacking on it.
- Item padding is `px-5 py-4`; the large variant bumps only to `py-6`.

Composes, all as `parallax-<name>` items: `card`, `badge`, `avatar`. Source:
`src/lib/components/pages/ListGroupPage.svelte`.

## File upload

Ten upload surfaces (picker, avatar, compact row, gallery+zoom, progress list, table,
image grid, sortable grid, cards, cover) driven by one rune-class plus a simulated queue.

- State is a class with `$state` fields constructed at component init; the hidden input
  wires through an action: `<input use:upload.input class="sr-only" />`.
- Dropzone = three `cn()`-joined strings: base `rounded-lg border border-dashed
  transition-colors`, idle `border-muted-foreground/25 hover:…`, active
  `border-primary bg-primary/5`.
- Scrims use palette-proof token pairs: `bg-foreground/50 dark:bg-background/50` with
  `text-background dark:text-foreground` — `primary-foreground` fails in most themes.
- Reveal-on-hover overlays add `focus-visible:opacity-100` beside
  `group-hover/item:opacity-100`, or keyboard focus paints at zero opacity.
- A card used as a dropzone needs `border` **and** `ring-0` — the theme's card draws its
  outline as `ring-1`, so `border-dashed` alone styles a 0px border.
- Every dropzone div gets `role="group"` + `aria-label`; progress rings pair with an
  `sr-only` `role="progressbar"`.

Composes, all as `parallax-<name>` items: `card`, `dialog`, `progress`, `tooltip`,
`alert` for `solid-destructive` and `Alert.Action`, `badge` for `*-subtle`, `button` for
the icon sizes. Source:
`src/lib/components/pages/FileUploadPage.svelte` + `src/lib/hooks/file-upload.svelte.ts`.

## Typography

The canonical class strings for headings, body and links — the theme has **no global
heading CSS**, classes carry the scale.

- Shared heading string: `font-medium leading-[1.1] tracking-[-0.02em]`; h1 is
  `text-2xl md:text-[1.625rem]`, h6 `text-[0.625rem]`.
- Heading margins scale from a 1.125rem base: full for h1/h2, ¾ for h3, half for h4-h6
  (preflight stripped the defaults; each page re-adds its own).
- Paragraphs re-add `mb-4 text-sm`; secondary copy is `text-muted-foreground`.
- Links are `text-primary no-underline`, darkened on hover via
  `hover:text-[color-mix(in_srgb,var(--primary)_70%,black)]`.

Source: `src/lib/components/pages/TypographyPage.svelte`.

## Sizing and density

One authoritative control-height ladder (`--control-h-xs/sm/default/lg` =
24/32/40/48px) plus a three-tier table density axis.

- Sizes are picked by **role**, not taste: 40px form line, 32px table/toolbar furniture,
  24px inside input groups, 48px standalone hero only — never beside a 40px field.
- Size *names* stay shadcn's API (`xs/sm/default/lg`, never `md`); only the pixels are
  theme tokens, so call sites never learn a new vocabulary.
- The ramp lives in `:root` CSS vars (not `@theme inline`, which emits no runtime vars for
  the unlayered rules to read); components consume it as `h-(--control-h-default)` so
  `h-8`-style merges keep working.
- Density is a second axis that never resizes controls: a `density` prop stamps
  `data-density`, and `:where([data-density=…])` retunes `--table-row-h/head-h/cell-py`
  at zero specificity. Every tier restates every token — custom properties inherit, and a
  nested default table would silently take the outer tier. Tiers are floors, not clamps.

Source: `src/lib/components/pages/SizingPage.svelte` + `src/app.css`.

## Data table

The TanStack-driven table engine: `createDataTable` holds seven reactive slices,
`DataTable.Root` renders toolbar + table + pagination. Choose it when rows need sorting,
faceted filtering, visibility, selection and paging; choose Data grid for in-place editing
or virtualized length.

- The Toolbar auto-builds filters from `column.meta` (`label`, `variant:
  text|number|select|multiSelect|range|date|dateRange`, `options`, `unit`) — every variant
  except `text` needs an explicit `filterFn`.
- `header`/`cell` are snippets on the column def rendered through `DataTable.FlexRender`
  with a `fallback`; pass `header: ""` on action columns.
- `DataTable.Root` always renders its own Pagination — for a custom pager, compose
  `Table.Root` + `FlexRender` directly and read `state.pageCount`.
- Layout switches (striped, sticky, pinned, fixed widths) are page-level classes on
  `Table.*`; pinning uses the exported `getColumnPinningStyle`.

**Install** `parallax-data-table` — it resolves the table fork, the primitives (TanStack
bridge) and `@tanstack/table-core` itself.
Source: `src/lib/components/pages/DataTablePage.svelte` +
`src/lib/components/ui/data-table/`.

## Data grid

The spreadsheet: virtualized rows, cell-addressed keyboard navigation, in-place editors
per cell variant, its own ARIA grid markup (not a `<table>`).

- Sits flush in a card via `Card.Content class="items-stretch justify-stretch p-0"` — the
  grid paints its own borders; padding double-frames it.
- Column shape: `{ id, accessorKey, size, meta: { label, cell: { variant, …opts } } }` —
  the variant drives the editor.
- Rows live in `$state.raw` arrays; `createDataGrid` takes thunks and writes back whole
  arrays via `onDataChange`/`onRowsAdd`/`onRowsDelete`.
- The head row is the grid's **own** slot (`data-grid-column-header`) — a global thead
  restyle cannot reach it; restate head ink/size/tracking if you want table-head parity,
  and set `--table-pinned-ground` so pinned cells occlude correctly.
- Pin the identity column via `initialState.columnPinning.left`; mirror
  `enableSearch`/`enablePaste` on `<DataGrid.KeyboardShortcuts>` so the Ctrl/Cmd+/ dialog
  stays truthful.

**Install** `parallax-data-grid`. Source:
`src/lib/components/pages/DataGridPage.svelte` + `src/lib/components/ui/data-grid/`.
