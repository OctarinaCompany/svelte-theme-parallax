/**
 * How the page is READ: the text size and the width of the content column.
 *
 * NOT AN APPEARANCE AXIS, and that is the whole distinction. The palette, the two chrome modes,
 * the backdrop and the sizing tiers decide what a Parallax application LOOKS like, they are part
 * of the look a consumer installs, and every one of them lives on the Settings page where it can
 * be named and explained. These two decide how THIS reader reads THIS page — the same kind of
 * choice as light/dark, made while reading, on the page being read — so they belong in the bar
 * and nowhere else, and they are deliberately per-device with no promise made across machines.
 *
 * THE TEXT SIZE IS ONE MULTIPLIER, `--text-factor`, and the type ramp in `src/app.css` is what
 * gives it teeth. That ramp is declared in `@theme inline`, which INLINES its values into every
 * `text-*` utility rather than emitting a variable — so `text-sm` compiles to the `calc()` itself
 * and resolves per element against whatever `--text-factor` is in scope. `DocPage` sets it on the
 * page content only, which is why the bar holding this control never resizes itself and why the
 * chrome around the page stays put. It is the mechanism `--radius-factor` already uses, and the
 * reason this hook can be four numbers rather than a stylesheet.
 *
 * ONLY THE TYPE SCALES. Control heights, spacing and radii are their own ramps — the kit states
 * them in `rem` off the root and gives them their own axis on the Sizing page — so a reader who
 * enlarges the text gets larger text in the same buttons rather than a zoomed page. That is the
 * kit's own model of the two being separate, not an omission.
 *
 * THE WIDTH IS A CLASS, not a `max-width`. `ContentColumn` is a PERCENTAGE of its container with
 * no cap, deliberately — see that component — so a width step has to speak the same language or
 * it would cap the very column the design leaves uncapped. Each step is a pair of `lg:`/`xl:`
 * overrides that `cn`'s `tailwind-merge` swaps for the column's own, which also means the steps
 * bite exactly where the column stops being full-width and are inert below `lg` with no viewport
 * rule to write.
 *
 * @see src/app.css — the type ramp, and the `--text-factor` hook the whole file explains
 * @see src/lib/components/layout/ContentColumn.svelte — the column these widths override
 * @see src/lib/components/navigation/ReadingSettings.svelte — the panel over this state
 */

/** The `localStorage` keys. Per-device reading comfort; nothing here reaches a server. */
export const TEXT_SIZE_STORAGE_KEY = "reading-text-size";
export const CONTENT_WIDTH_STORAGE_KEY = "reading-content-width";

export interface TextStep {
	/** What `--text-factor` becomes — the multiplier every `text-*` utility resolves against. */
	scale: number;
	label: string;
}

/**
 * FOUR STEPS, AND THE TOP ONE IS WHERE A MEASUREMENT PUT IT. Because only the type scales, the
 * ceiling is the point where a label stops fitting the control around it, and the control ramp
 * decides which tier binds. `--control-h-xs` is 1.5rem and carries `text-xs`, a 0.8125rem step on
 * a 1.5 line-height: 1.219rem of line box, so that tier is exactly full at a factor of 1.23.
 * `--control-h-sm` is 2rem on the body step's 1.406rem and fills at 1.42, the default tier at
 * 1.78 — so it is the DENSE tier that decides, not the smallest number in the type ramp.
 *
 * 1.3 IS ACCEPTED AND 1.5 IS NOT, and the difference is what happens past the ceiling. At 1.3 the
 * xs tier's line box is 1.584rem inside a 1.5rem control — 1.3px over, on a button that computes
 * `overflow: visible` (measured), so the glyphs spill into the button's own border rather than
 * being cut, on the one tier the kit reserves for table row actions and toolbars. At 1.5 the same
 * control is asked for 1.83rem and the sm tier goes over as well: two tiers straining at once is
 * a page that reads as broken rather than as enlarged. Past `Larger` a reader has the browser's
 * own zoom, which scales the control ramp along with the type because both are stated in `rem`.
 */
export const TEXT_STEPS: readonly TextStep[] = [
	{ scale: 0.85, label: "Small" },
	{ scale: 1, label: "Default" },
	{ scale: 1.15, label: "Large" },
	{ scale: 1.3, label: "Larger" },
];

export interface WidthStep {
	/**
	 * The `lg:`/`xl:` pair handed to `ContentColumn`, which merges it over its own. Empty is the
	 * column as the kit ships it — the default has nothing to override.
	 */
	class: string;
	label: string;
}

/**
 * The column is `w-full lg:w-10/12 xl:w-8/12`. Each step moves both fractions together so the
 * two breakpoints keep their relationship — the column has always narrowed as the viewport grows,
 * which is what stops a line of prose running the width of a 2560px screen.
 *
 * `Full` is the one step that is not a fraction pair: it hands the page back to the gutter, which
 * is what a wide table or a dashboard demo wants and what the column is deliberately not.
 */
export const WIDTH_STEPS: readonly WidthStep[] = [
	{ class: "lg:w-8/12 xl:w-6/12", label: "Narrow" },
	{ class: "", label: "Default" },
	{ class: "lg:w-11/12 xl:w-10/12", label: "Wide" },
	{ class: "lg:w-full xl:w-full", label: "Full" },
];

export const TEXT_DEFAULT_STEP = 1;
export const WIDTH_DEFAULT_STEP = 1;

/**
 * The viewport width from which the width steps do anything: Tailwind's `lg`, the breakpoint the
 * column's own first fraction sits on. The panel hides the width group below it rather than
 * offering a control whose effect the reader cannot see — the same threshold, stated once.
 */
export const CONTENT_WIDTH_BREAKPOINT = 1024;

/**
 * Coerce whatever storage hands back into a usable index. Absent, blank, non-numeric, fractional,
 * negative and out-of-range all land on the fallback rather than throwing, so a value written by a
 * future version with more steps degrades to the default instead of breaking the page.
 *
 * The blank string has to be rejected BEFORE `Number` sees it: `Number("")` is 0, which passes
 * every check below and would silently pin the reader to the first step.
 */
export function clampStep(raw: string | null, count: number, fallback: number): number {
	if (raw === null || raw.trim() === "") return fallback;

	const step = Number(raw);
	if (!Number.isInteger(step) || step < 0 || step >= count) return fallback;

	return step;
}

function read(key: string, count: number, fallback: number): number {
	try {
		// Guard for any non-browser evaluation (prerendering, tests, SSR added later) — INSIDE
		// the try, because with storage fully blocked the `localStorage` getter itself throws.
		if (typeof localStorage === "undefined") return fallback;

		return clampStep(localStorage.getItem(key), count, fallback);
	} catch {
		// Storage blocked outright. The session still adjusts, it just does not persist.
		return fallback;
	}
}

function persist(key: string, step: number): void {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(key, String(step));
	} catch {
		/* storage blocked — the step still applies, it just will not survive a reload */
	}
}

let textStep = $state<number>(read(TEXT_SIZE_STORAGE_KEY, TEXT_STEPS.length, TEXT_DEFAULT_STEP));
let widthStep = $state<number>(
	read(CONTENT_WIDTH_STORAGE_KEY, WIDTH_STEPS.length, WIDTH_DEFAULT_STEP),
);

/**
 * The live reading state. Read-only — write through the movers below, which persist.
 *
 * The four `can*` guards exist so the panel's buttons can be genuinely `disabled` at the ends
 * rather than merely inert: a button that looks pressable and does nothing is the version of this
 * control a reader reports as broken.
 */
export const reading = {
	get textScale(): number {
		return TEXT_STEPS[textStep].scale;
	},
	get textLabel(): string {
		return TEXT_STEPS[textStep].label;
	},
	get widthClass(): string {
		return WIDTH_STEPS[widthStep].class;
	},
	get widthLabel(): string {
		return WIDTH_STEPS[widthStep].label;
	},
	get canEnlargeText(): boolean {
		return textStep < TEXT_STEPS.length - 1;
	},
	get canShrinkText(): boolean {
		return textStep > 0;
	},
	get canWidenContent(): boolean {
		return widthStep < WIDTH_STEPS.length - 1;
	},
	get canNarrowContent(): boolean {
		return widthStep > 0;
	},
};

// Write-through on every step, so an abruptly closed tab never loses the size just chosen.
function setTextStep(step: number): void {
	textStep = step;
	persist(TEXT_SIZE_STORAGE_KEY, step);
}

function setWidthStep(step: number): void {
	widthStep = step;
	persist(CONTENT_WIDTH_STORAGE_KEY, step);
}

/** One step up the type ramp. No-op at the top. Persists. */
export function enlargeText(): void {
	if (reading.canEnlargeText) setTextStep(textStep + 1);
}

/** One step down the type ramp. No-op at the bottom. Persists. */
export function shrinkText(): void {
	if (reading.canShrinkText) setTextStep(textStep - 1);
}

/** Back to the size the kit ships. Persists. */
export function resetTextSize(): void {
	setTextStep(TEXT_DEFAULT_STEP);
}

/** One step wider. No-op at `Full`. Persists. */
export function widenContent(): void {
	if (reading.canWidenContent) setWidthStep(widthStep + 1);
}

/** One step narrower. No-op at `Narrow`. Persists. */
export function narrowContent(): void {
	if (reading.canNarrowContent) setWidthStep(widthStep - 1);
}
