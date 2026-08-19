/**
 * The classic theme's contextual button recipes — `.btn-{state}` and `.btn-outline-{state}` — applied
 * ON TOP of `buttonVariants` through the `class` prop, e.g.
 * `cn(buttonVariants(), buttonContextualSolid.Primary)`.
 *
 * Deliberately NOT folded into `buttonVariants` itself: `button.svelte` is a registry file
 * and stays vega, and the two neutral pairs below reproduce the classic theme's own compiled output
 * including its dark-mode gaps — output a first-class variant would be expected to fix.
 * Every value was read off the classic theme's rendered page.
 *
 * The keys are the classic theme's state names as the Buttons page spells them (capitalised, so they
 * double as display labels); the Button group page's lowercase `solid.primary` etc. are the
 * same recipes under `Primary` here.
 */

/**
 * Solid variants. The classic `button-variant()` mixin fills with the theme colour, borders
 * with the same colour, and types with `color-contrast()` — white everywhere except
 * `warning` and `light`, exactly as documented at length in AlertPage.
 *
 * HOVER. The classic framework precomputes it as `shade-color(value, 15%)`, and `color-mix()` is that
 * function in CSS: `color-mix(in srgb, X 85%, black)` reproduces `.btn-primary`'s #2569C3
 * from #2C7BE5 exactly. Two variants shade the other way — `warning` tints, because its
 * type is dark rather than light, and the classic framework special-cases `light` and `dark` in
 * the reference stylesheet so that each moves AWAY from its own extreme.
 *
 * THE BORDER IS NOT DECORATION. `button-variant()` sets `--bs-btn-border-color` to the SAME
 * colour as the background, while shadcn's base is `border border-transparent
 * bg-clip-padding` — a transparent 1px border with the background clipped to the padding
 * box, so whatever sits behind the button shows through a 1px frame. Standalone that reads
 * as a slightly small button; inside a `ButtonGroup`, where two of those frames meet, it
 * reads as a hairline of page background running between the buttons. Every solid variant
 * therefore states its border as well as its fill, hover included.
 *
 * The classic framework shades the hover border 20% against the background's 15%; the two are matched
 * here instead, a difference of about one value step and invisible at 1px.
 *
 * `secondary` inherits the same caveat as everywhere else in this theme: the classic theme's
 * `secondary` is `gray-700`, which `--muted-foreground` matches in dark mode and misses
 * by one step in light. See §4.1 of the theme notes.
 *
 * `light` AND `dark` NEED A `dark:` HALF FOR EVERY STATE, not just the ground — the trap
 * AlertPage documents, and one the Button page fell into first. `dark` is #12263F in BOTH
 * modes (the reference stylesheet never redefines it) while `--foreground` inverts to white, so
 * pinning only `dark:bg-background` left the hover state turning the button white in dark
 * mode. The token holding `dark` is `--foreground` in light and `--background` in dark, and
 * every declaration that mentions the colour has to switch with it. `light` splits the same
 * way: `--secondary` in light, `--card` in dark, with `black` as its dark-mode hover.
 */
export const buttonContextualSolid = {
	Primary:
		"bg-primary border-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_85%,black)] hover:border-[color-mix(in_srgb,var(--primary)_85%,black)]",
	Secondary:
		"bg-muted-foreground border-muted-foreground text-primary-foreground hover:bg-[color-mix(in_srgb,var(--muted-foreground)_85%,black)] hover:border-[color-mix(in_srgb,var(--muted-foreground)_85%,black)]",
	Success:
		"bg-success border-success text-success-foreground hover:bg-[color-mix(in_srgb,var(--success)_85%,black)] hover:border-[color-mix(in_srgb,var(--success)_85%,black)]",
	Danger:
		"bg-destructive border-destructive text-destructive-foreground hover:bg-[color-mix(in_srgb,var(--destructive)_85%,black)] hover:border-[color-mix(in_srgb,var(--destructive)_85%,black)]",
	Warning:
		"bg-warning border-warning text-warning-foreground hover:bg-[color-mix(in_srgb,var(--warning)_85%,white)] hover:border-[color-mix(in_srgb,var(--warning)_85%,white)]",
	Info: "bg-info border-info text-info-foreground hover:bg-[color-mix(in_srgb,var(--info)_85%,black)] hover:border-[color-mix(in_srgb,var(--info)_85%,black)]",
	Light:
		"bg-secondary border-secondary text-warning-foreground hover:bg-[color-mix(in_srgb,var(--secondary)_85%,black)] hover:border-[color-mix(in_srgb,var(--secondary)_85%,black)] dark:bg-card dark:border-card dark:text-primary-foreground dark:hover:bg-background dark:hover:border-background",
	Dark: "bg-foreground border-foreground text-primary-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_85%,white)] hover:border-[color-mix(in_srgb,var(--foreground)_85%,white)] dark:bg-background dark:border-background dark:hover:bg-[color-mix(in_srgb,var(--background)_85%,white)] dark:hover:border-[color-mix(in_srgb,var(--background)_85%,white)]",
} as const satisfies Record<string, string>;

/**
 * Outline variants: `--bs-btn-bg` stays transparent, the colour moves to the border and the
 * type, and hover fills with the solid variant. No `color-mix()` is needed — the hover
 * state IS the base colour.
 *
 * `bg-transparent` is not decorative. `buttonVariants()` emits its default variant, which
 * includes `bg-primary`; without an explicit background here tailwind-merge has nothing to
 * evict, and every outline button renders as a filled blue one with coloured text on top.
 *
 * The two neutrals split by mode, as above, and they do NOT split the same way:
 *
 *   .btn-outline-light  the classic theme overrides it in the reference stylesheet's dark block — the border
 *                       becomes `light-dark` and the type becomes `white`, so it stays
 *                       readable
 *   .btn-outline-dark   the classic theme overrides NOTHING, so it keeps #12263F on both the border
 *                       and the type — against a #152E4D card that is very nearly
 *                       invisible. Reproduced rather than corrected: it is the theme's
 *                       output, and inventing a colour here would hide a real gap
 */
export const buttonContextualOutline = {
	Primary:
		"bg-transparent border-primary text-primary hover:bg-primary hover:text-primary-foreground",
	Secondary:
		"bg-transparent border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-primary-foreground",
	Success:
		"bg-transparent border-success text-success hover:bg-success hover:text-success-foreground",
	Danger:
		"bg-transparent border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground",
	Warning:
		"bg-transparent border-warning text-warning hover:bg-warning hover:text-warning-foreground",
	Info: "bg-transparent border-info text-info hover:bg-info hover:text-info-foreground",
	Light:
		"bg-transparent border-secondary text-secondary hover:bg-secondary hover:text-warning-foreground dark:border-card dark:text-primary-foreground dark:hover:bg-card",
	Dark: "bg-transparent border-foreground text-foreground hover:bg-foreground hover:text-primary-foreground dark:border-background dark:text-background dark:hover:bg-background dark:hover:text-primary-foreground",
} as const satisfies Record<string, string>;
