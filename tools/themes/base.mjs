/**
 * the anchor palette's own tokens — the values app.css's `:root` and `.dark` held before the
 * base became the nudged palette.
 *
 * They are the INPUT the base theme is computed from: `parallax` reads these two tables and
 * moves every value by under 2% (`nudgeAnchors` in `themes.mjs`), and it is the SOLVED result —
 * not this copy — that app.css holds now, and that every generated theme is audited beside. A
 * row that measures below 4.5:1 but at or above the base's value for the same pairing is an
 * inherited property of the design, not a regression the generator introduced — and the report
 * says which is which.
 *
 * The copy is not on trust: `audit.mjs` opens by diffing the solved `parallax` — a pure
 * function of these tables — against app.css's `:root` and `.dark` blocks and refuses to run
 * on any mismatch, so an edit to either side (these tables or app.css) that skips the other
 * fails the audit instead of silently skewing the swatches and the baseline.
 */

export const ANCHOR_LIGHT = {
	background: "#f9fbfd",
	foreground: "#12263f",
	card: "#ffffff",
	"card-foreground": "#12263f",
	popover: "#ffffff",
	"popover-foreground": "#12263f",
	primary: "#2c7be5",
	"primary-foreground": "#ffffff",
	secondary: "#edf2f9",
	"secondary-foreground": "#12263f",
	muted: "#edf2f9",
	"muted-foreground": "#95aac9",
	accent: "#f9fbfd",
	"accent-foreground": "#12263f",
	"primary-subtle": "#d5e5fa",
	destructive: "#e63757",
	"destructive-foreground": "#ffffff",
	"destructive-subtle": "#fad7dd",
	success: "#00d97e",
	"success-foreground": "#ffffff",
	"success-subtle": "#ccf7e5",
	warning: "#f6c343",
	"warning-foreground": "#283e59",
	"warning-subtle": "#fdf3d9",
	info: "#39afd1",
	"info-foreground": "#ffffff",
	"info-subtle": "#d7eff6",
	border: "#edf2f9",
	input: "#d2ddec",
	ring: "#2c7be5",
	"chart-1": "#2c7be5",
	"chart-2": "#a6c5f7",
	"chart-3": "#d2ddec",
	"chart-4": "#6e84a3",
	"chart-5": "#b1c2d9",
	scrim: "#12263f",
	sidebar: "#ffffff",
	"sidebar-foreground": "#6e84a3",
	"sidebar-primary": "#2c7be5",
	"sidebar-primary-foreground": "#ffffff",
	"sidebar-accent": "#f9fbfd",
	"sidebar-accent-foreground": "#12263f",
	"sidebar-border": "#e3ebf6",
	// Not an original token: minted equal to `sidebar-border` (dark: `secondary`) so the
	// value-keyed nudge lands it exactly on the `--sidebar-outline` app.css already holds.
	"sidebar-outline": "#e3ebf6",
	"sidebar-ring": "#2c7be5",
};

export const ANCHOR_DARK = {
	background: "#12263f",
	foreground: "#ffffff",
	card: "#152e4d",
	"card-foreground": "#ffffff",
	popover: "#152e4d",
	"popover-foreground": "#ffffff",
	primary: "#2c7be5",
	"primary-foreground": "#ffffff",
	secondary: "#1e3a5c",
	"secondary-foreground": "#ffffff",
	muted: "#132a46",
	"muted-foreground": "#6e84a3",
	accent: "#132a46",
	"accent-foreground": "#ffffff",
	"primary-subtle": "#143767",
	destructive: "#e63757",
	"destructive-foreground": "#ffffff",
	"destructive-subtle": "#681927",
	success: "#00d97e",
	"success-foreground": "#ffffff",
	"success-subtle": "#006239",
	warning: "#f6c343",
	"warning-foreground": "#283e59",
	"warning-subtle": "#6f581e",
	info: "#39afd1",
	"info-foreground": "#ffffff",
	"info-subtle": "#1a4f5e",
	border: "#1e3a5c",
	input: "#1e3a5c",
	ring: "#2c7be5",
	"chart-1": "#2c7be5",
	"chart-2": "#a6c5f7",
	"chart-3": "#d2ddec",
	"chart-4": "#6e84a3",
	"chart-5": "#b1c2d9",
	sidebar: "#152e4d",
	"sidebar-foreground": "#6e84a3",
	"sidebar-primary": "#2c7be5",
	"sidebar-primary-foreground": "#ffffff",
	"sidebar-accent": "#132a46",
	"sidebar-accent-foreground": "#ffffff",
	"sidebar-border": "#152e4d",
	// See the light table's note: minted equal to `secondary` for the same reason.
	"sidebar-outline": "#1e3a5c",
	"sidebar-ring": "#2c7be5",
};
