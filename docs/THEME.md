# The theme system

How the palettes are built, what the generator owns, and what the audit enforces. The generator
and the audit live in `tools/themes/`; the files they write are `src/themes.css` and
`src/lib/themes/palettes.ts`; the base token set is hand-written in `src/app.css`.

## 1. Token architecture

One token set, two independent axes:

- **Palette** — `data-theme="<id>"` on `<html>`. The base palette, `parallax`, is the one id
  with no CSS block of its own: the bare `:root` (light) and dark blocks in `src/app.css` ARE
  the base, and every other theme overrides the same custom properties in `src/themes.css`.
- **Mode** — the `.dark` class, independent of the palette. Every theme defines both modes, so
  `<html class="dark" data-theme="ember">` is an ordinary state. `mode-watcher` owns both
  attributes and persists both.

Components consume semantic tokens only (`--background`, `--card`, `--border`, `--primary`,
`--success-subtle`, …), never raw colours, so switching palettes never touches a component.

## 2. The base palette and its structure

`tools/themes/base.mjs` states the anchor values the whole system is derived from: the anchor
palette's own light and dark token tables — its neutrals, brand, status colours, chart series and
dark surfaces. Two structural facts are read off those anchors and reused by every theme:

1. **The lightness ladder.** The neutral ramp's lightness and chroma stops, measured in OKLCH
   (`L_LIGHT` / `C_LIGHT` / `L_DARK` / `C_DARK` in `themes.mjs`). The light steps are the
   anchor's verbatim. The ink and the three dark steps are the anchor's taken deeper, so a dark
   page sits at about two thirds of the anchor's lightness:

   | Step | Plays | Anchor L | Kit L |
   | ---- | ----- | -------- | ----- |
   | ink  | the dark page; in light, the body text and `--scrim` | 0.266 | 0.18 |
   | d900 | `--muted`, `--accent`, `--sidebar-accent` | 0.282 | 0.198 |
   | d800 | `--card`, `--popover`, `--sidebar`, `--sidebar-border` | 0.298 | 0.218 |
   | d700 | `--border`, `--input`, `--secondary`, `--sidebar-outline` | 0.344 | 0.276 |

   The chroma is the anchor's at every step, clipped to the gamut where a hue cannot hold it that
   deep. Every theme keeps the same surface, elevation, border and text architecture; only hue
   and chroma move. The two ink brands, Graphite's and Sepia's, sit a hair above the ink and
   moved with it (L 0.30 → 0.22).
2. **The token mapping.** Which ramp step plays `--border`, `--input`, `--sidebar-accent`, … is
   fixed once and shared by every theme, so a dozen palettes read as one family.

The default theme, `parallax`, is derived from the anchors in two moves: its four ladder colours
— the navy ink `#12263f` and the dark surfaces `#132a46`, `#152e4d` and `#1e3a5c` — are taken
down to the deeper ladder at their own hue and chroma, and then every colour is moved by a small
per-colour shift (0.1–2%). Its dark page is `#001227`, its cards `#011a36` and its lines
`#082a4a`. The shift is drawn from a hash of each colour, never a random number, so the generated
files are byte-identical on every run.

## 3. Generated themes

A theme in `tools/themes/themes.mjs` is a handful of numbers — a neutral hue, a chroma scale, a
brand hue, and any status hue that had to move out of the brand's way. Everything else is solved:

- Surfaces, borders and text walk the shared ladder at the theme's hue and chroma.
- Brand and status pairings are solved against the contrast floors in §4. The secondary text
  (`--muted-foreground`) clears them on every ground it sits on, and in dark also holds APCA
  Lc 41.5: WCAG 2.x flatters light text on a dark ground, and on the deeper ladder 4.55:1 alone
  would read about six Lc dimmer.
- The `*-subtle` grounds and their `*-subtle-foreground` inks are built per theme. A dark ground
  is a 28% mix of its colour into black, measured on the anchor's ladder and carried down with
  the dark-700 line (the base's five are re-cut onto the line itself); the ink is its own token,
  walked from the status colour until it clears 4.5:1 even at 80% opacity (and APCA Lc 68 in
  dark). A fill is not an ink — even where the walk ends on the fill's own value, as every dark
  warning's does on the deeper washes.

`npm run themes:generate` rewrites `src/themes.css` and `src/lib/themes/palettes.ts`. The output
is deterministic: running the generator twice must produce identical bytes, and a palette is
edited only in `tools/themes/`, never in the generated files.

## 4. The audit

`npm run themes:audit` measures every pairing in every theme and exits non-zero on regressions:

- **Contrast floors.** Text pairings are held to WCAG AA with a hair of margin (4.55:1); solid
  accents to 3.1:1 against the surface they sit on (WCAG 1.4.11, non-text contrast).
- **Relative to the base.** Every pairing is also compared against the base palette's own number
  for the same pairing, so a theme that inherits a known weakness is distinguished from one that
  introduces a new one — the first is recorded, the second fails.
- **Brand/status separation.** A brand colour must never land on a status colour — in hue, in
  lightness, or under simulated deuteranopia and protanopia (a brand that only differs from
  `destructive` by a red/green distinction is a collision, not a theme).

## 5. Editing rules

- A palette is edited **only** in `tools/themes/`; the generated files are build artefacts that
  happen to be committed so palette diffs stay reviewable.
- `src/app.css` is the one hand-written token file: the base palette, the ramp, and the
  behavioural tokens (control heights, radii, typography) everything else consumes.
- Keep the generator free of timestamps and randomness — byte-identical output is the contract,
  and CI runs the audit on every push to `main` and every pull request.
