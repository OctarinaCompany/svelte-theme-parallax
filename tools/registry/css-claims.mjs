/**
 * The CSS claims table — which registry item ships which top-level `app.css` block.
 *
 * TOTAL ACCOUNTING, BY DESIGN. Every top-level block of `app.css` must be claimed by at
 * least one item here (or by the hand-built theme/appearance/shell lists in `generate.mjs`),
 * or excluded with a reason — anything else fails the build, naming the block. The
 * alternative is the silent kind of drift where a new restyle block lands in the gallery and
 * never reaches a consumer, which is exactly how the sidebar looked wrong for two increments.
 *
 * Claims may name SEVERAL items when a grouped selector genuinely serves more than one
 * (`--table-pinned-ground` covers `thead` and the data-grid chrome at once); the same rule
 * then ships with each, which double-applies harmlessly if a consumer installs both.
 *
 * `nth` disambiguates repeated selectors (`:root` appears three times, `[data-slot="card"]`
 * and `@theme inline` twice) — same ordinal discipline as the reads in `generate.mjs`.
 */

/** @type {Array<{selector: string, nth?: number, items?: string[], exclude?: string}>} */
export const CSS_CLAIMS = [
	// ---- marquee machinery: its @theme animations and the edge-colour vars on card.
	// `asThemeVars` routes the declarations through the item's cssVars.theme channel — the
	// CLI's css-field writer mangles a string blob under an at-rule key (it leaks its `temp`
	// wrapper rule into the block), while cssVars.theme merges cleanly; the nested keyframes
	// hoist to top-level css entries, which the writer folds into @theme with their bodies.
	{ selector: "@theme inline", nth: 1, items: ["parallax-marquee"], asThemeVars: true },
	{ selector: '[data-slot="card"]', nth: 0, items: ["parallax-marquee"] },

	// ---- loader: the easings :root (third of three), the reduced-motion answer, the rest
	//      keyframes and the stage gate
	{ selector: ":root", nth: 2, items: ["parallax-loader"] },
	{ selector: "@media (prefers-reduced-motion: reduce)", items: ["parallax-loader"] },
	{ selector: "@keyframes loader-rest", items: ["parallax-loader"] },
	{ selector: "[data-loader-stage]", items: ["parallax-loader"] },

	// ---- application-global element defaults: a consumer's own init owns that layer.
	//      FIRST of the two `@layer base` blocks — `* { border-border }`, the body pair and the
	//      font default are shadcn's own boilerplate, written by `init`, and no item of ours may
	//      impersonate it (bootstrap.md tells a from-scratch project to paste it instead).
	{
		selector: "@layer base",
		nth: 0,
		exclude: "global element defaults; the consumer's init writes its own",
	},
	// ---- ...and the SECOND is the opposite case: the hand-cursor rule is a Parallax opinion,
	//      and a guideline the skill states for consumer projects cannot hold in one unless the
	//      rule travels. It rides with the item that already owns the application-global
	//      opinions, in `@layer base` so a `cursor-*` utility still overrides it per element.
	{ selector: "@layer base", nth: 1, items: ["parallax-restyle"] },

	// ---- card fork
	{ selector: '[data-slot="card"]', nth: 1, items: ["parallax-card"] },
	{ selector: '.dark [data-slot="card"]', items: ["parallax-card"] },
	{ selector: '[data-slot="card"]:has(> [data-slot="card-header"])', items: ["parallax-card"] },
	{ selector: '[data-slot="card-header"]', items: ["parallax-card"] },
	{ selector: ':where([data-slot="card"][data-size="default"])', items: ["parallax-card"] },
	{ selector: ':where([data-slot="card"][data-size="sm"])', items: ["parallax-card"] },

	// ---- table fork: head/cell treatment and the density tiers
	{ selector: '[data-slot="table-head"]:not(:has([role="checkbox"]))', items: ["parallax-table"] },
	{ selector: '[data-slot="table-cell"]:not(:has([role="checkbox"]))', items: ["parallax-table"] },
	{ selector: ':where([data-density="sm"])', items: ["parallax-table"] },
	{ selector: ':where([data-density="default"])', items: ["parallax-table"] },
	{ selector: ':where([data-density="lg"])', items: ["parallax-table"] },
	{ selector: '[data-slot="table-head"]', items: ["parallax-table"] },

	// ---- data-grid: its own chrome, plus the pinned-ground block it shares with tables
	{ selector: '[data-slot="data-grid-column-header"]', items: ["parallax-data-grid"] },
	{ selector: '[data-slot="data-grid-header-row"]', items: ["parallax-data-grid"] },
	{
		selector: 'thead, [data-slot="data-grid-header"], [data-slot="data-grid-footer"]',
		items: ["parallax-table", "parallax-data-grid"],
	},
];

/**
 * The restyle of the OFFICIAL ports — everything below repaints a component the consumer
 * installs by bare name (switch, checkbox, tooltip, inputs, sliders, tabs' line variant…).
 * One item carries them all: `parallax-restyle` is the single opt-in for "my official
 * components wear the Parallax shape", which is also why the two application-global opinions
 * (the menu shadow-kill, the dialog scrim) live HERE and are not smuggled in by the shell.
 */
export const RESTYLE_SELECTORS = [
	/*
	 * The rows that are clickable without being buttons — the same unlayered rule `parallax-shell`
	 * carries, claimed a second time here on purpose. It is UNLAYERED in app.css because shadcn
	 * writes `cursor-default` into the class list of every menu and option row, which beats the
	 * `@layer base` hand rule; and a consumer who installs Select, Command, Combobox, Autocomplete,
	 * Listbox or Filters WITHOUT the shell would otherwise get an arrow over every dropdown row.
	 * Shipping it with both items double-applies harmlessly, exactly as the header describes.
	 */
	'[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"]), [role="option"]:not([aria-disabled="true"]), [role="slider"]:not([aria-disabled="true"])',
	'[data-slot="switch"]',
	'[data-slot="switch"][data-state="unchecked"]',
	'[data-slot="switch-thumb"]',
	'[data-slot="switch"][data-state="checked"] > [data-slot="switch-thumb"]',
	'[data-slot="checkbox"][data-state="unchecked"]',
	'[data-slot="checkbox"][data-state="indeterminate"]',
	'[data-slot="checkbox"]',
	'[data-slot="checkbox"]:not(:focus-visible):not([aria-invalid="true"])',
	'[data-slot="checkbox-indicator"] > svg',
	'[data-slot="command-input-wrapper"]:not([data-slot="popover-content"] *)',
	'[data-slot="command-input-wrapper"]:not([data-slot="popover-content"] *) > [data-slot="input-group"]',
	'[data-slot="command-input-wrapper"]:not([data-slot="popover-content"] *) [data-slot="input-group-addon"] svg',
	'[data-slot="kbd"]',
	'[data-slot="tooltip-content"]',
	'.dark [data-slot="tooltip-content"]',
	'[data-slot="tooltip-content"] > [data-side]',
	'.dark [data-slot="tooltip-content"] > [data-side]',
	'[data-slot="tooltip-content"] > [data-side="top"]',
	'[data-slot="tooltip-content"] > [data-side="bottom"]',
	'[data-slot="input-group"] [data-slot="input-group-addon"], [data-slot="input-group"] [data-slot="input-group-addon"] > kbd, [data-slot="input-group"] [data-slot="button"][data-size="xs"], [data-slot="input-group"] [data-slot="button"][data-size="icon-xs"]',
	'[data-slot="popover-content"], [data-slot="dropdown-menu-content"], [data-slot="dropdown-menu-sub-content"], [data-slot="context-menu-content"], [data-slot="context-menu-sub-content"], [data-slot="menubar-content"], [data-slot="menubar-sub-content"], [data-slot="select-content"], [data-slot="hover-card-content"], [data-slot="navigation-menu-indicator"]',
	'[data-slot="input"]:not([data-slot="table-cell"] *), [data-slot="textarea"]:not([data-slot="table-cell"] *)',
	'[data-slot="input"]:not([data-slot="table-cell"] *)',
	'[data-slot="textarea"]:not([data-slot="table-cell"] *)',
	'.dark [data-slot="input"]:not([data-slot="table-cell"] *), .dark [data-slot="textarea"]:not([data-slot="table-cell"] *)',
	'[data-slot="input-group"]:not(:has(> textarea)):not(:has(> [data-align^="block"]))',
	'[data-slot="input-group"]:not([data-slot="command-input-wrapper"] > *)',
	'.dark [data-slot="input-group"]:not([data-slot="command-input-wrapper"] > *)',
	'[data-slot="input"]:disabled, [data-slot="textarea"]:disabled',
	'.dark [data-slot="input"][aria-invalid="true"], .dark [data-slot="textarea"][aria-invalid="true"]',
	'[data-slot="native-select"]',
	'.dark [data-slot="native-select"]',
	'.dark [data-slot="native-select"][aria-invalid="true"]',
	'[data-slot="native-select"][data-size="sm"]',
	'[data-slot="select-trigger"][data-size="default"]',
	'[data-slot="select-trigger"] > svg:last-child',
	'[data-slot="navigation-menu-viewport"]',
	'.dark [data-slot="navigation-menu-viewport"], .dark [data-slot="navigation-menu-content"]',
	'[data-slot="navigation-menu"]:has([data-slot="navigation-menu-content"])',
	'[data-slot="dialog-overlay"]',
	"@keyframes placeholder-glow",
	'[data-slot="slider-track"]',
	'[data-slot="slider-track"][data-orientation="horizontal"]',
	'[data-slot="slider-track"][data-orientation="vertical"]',
	'[data-slot="slider-thumb"]',
	'[data-slot="slider-thumb"]:active',
	'[data-slot="slider"][data-disabled] [data-slot="slider-thumb"]',
	"ol[data-sonner-toaster]",
	'[data-sonner-toaster] [data-sonner-toast][data-styled="true"]',
	'[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-description]',
	'ol[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-close-button]',
	'ol[data-sonner-toaster] [data-sonner-toast][data-styled="true"]:hover [data-close-button]:hover',
	'ol[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-close-button]:focus-visible',
	'[data-slot="tabs-list"][data-variant="line"]',
	'[data-slot="tabs-list"][data-variant="line"][data-orientation="vertical"]',
	'[data-slot="tabs-list"][data-variant="line"][data-orientation="vertical"] > [data-slot="tabs-trigger"]',
	'[data-slot="tabs-list"][data-variant="line"] > [data-slot="tabs-trigger"]',
	'[data-slot="tabs-list"][data-variant="line"] > [data-slot="tabs-trigger"]:hover, [data-slot="tabs-list"][data-variant="line"] > [data-slot="tabs-trigger"][data-state="active"]',
	'[data-slot="tabs-list"][data-variant="line"] > [data-slot="tabs-trigger"]:disabled',
	'[data-slot="tabs-list"][data-variant="line"] > [data-slot="tabs-trigger"][data-orientation="horizontal"]::after',
	'[data-slot="tabs-list"][data-variant="line"] > [data-slot="tabs-trigger"][data-orientation="vertical"]::after',
	'[data-slot="tabs-list"][data-variant="line"][data-size="sm"]',
	'[data-slot="tabs-list"][data-variant="line"][data-size="sm"] > [data-slot="tabs-trigger"]',
];
