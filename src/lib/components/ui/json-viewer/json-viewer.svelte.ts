import { getContext, hasContext, setContext } from "svelte";
import { SvelteSet } from "svelte/reactivity";
import { tv } from "tailwind-variants";

/**
 * The path the tree is rooted at — upstream's literal `"root"` (`json-viewer.tsx:432`, `:468`).
 * Every other path is built from it, so it is the one key `collapseAll` keeps.
 */
export const JSON_VIEWER_ROOT_PATH = "root";

/** Every value {@link JsonViewerDataType} accepts, in upstream declaration order (`:32-39`). */
export const JSON_VIEWER_DATA_TYPES = [
	"string",
	"number",
	"boolean",
	"null",
	"object",
	"array",
	"unknown",
] as const;

/** What a node renders as. Upstream's `DataType`. */
export type JsonViewerDataType = (typeof JSON_VIEWER_DATA_TYPES)[number];

/** Upstream's `getDataType`. `null` is checked before `typeof`. */
export function getJsonDataType(value: unknown): JsonViewerDataType {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";

	const type = typeof value;
	if (type === "string" || type === "number" || type === "boolean" || type === "object") {
		return type;
	}
	return "unknown";
}

/** Whether a type collapses — the two that own a path in the expansion set. */
export function isJsonBranch(type: JsonViewerDataType): boolean {
	return type === "object" || type === "array";
}

/** Every value {@link JsonViewerCollapseMode} accepts, in upstream declaration order (`:22`). */
export const JSON_VIEWER_COLLAPSE_MODES = ["click", "doubleClick"] as const;

/** Which pointer gesture on a branch trigger toggles it. */
export type JsonViewerCollapseMode = (typeof JSON_VIEWER_COLLAPSE_MODES)[number];

/**
 * Normalise a possibly untyped runtime value to a known collapse mode.
 * Anything outside {@link JSON_VIEWER_COLLAPSE_MODES} falls back to `"click"`.
 */
export function resolveJsonViewerCollapseMode(value?: string): JsonViewerCollapseMode {
	return JSON_VIEWER_COLLAPSE_MODES.includes(value as JsonViewerCollapseMode)
		? (value as JsonViewerCollapseMode)
		: "click";
}

/** Upstream's `TruncationSettings`, resolved rather than partial. */
export type JsonViewerTruncation = {
	/** Whether long arrays are cut down to {@link JsonViewerTruncation.itemsPerArray}. */
	enabled: boolean;
	/** How many items of a long array render before the "Show N more" control. */
	itemsPerArray: number;
};

/** `itemsPerArray` fallback — upstream `truncationProp?.itemsPerArray ?? 5` (`:450`). */
export const DEFAULT_JSON_VIEWER_ITEMS_PER_ARRAY = 5;

/** Above this many characters a string value wraps instead of staying on one line (`:221`). */
export const JSON_VIEWER_WRAP_CHARS = 50;

/** Above this many characters a string value is clamped to three lines behind a toggle (`:222`). */
export const JSON_VIEWER_CLAMP_CHARS = 180;

/** The path of an object's property — upstream `` `${path}.${key}` `` (`:742`). */
export function jsonChildPath(path: string, key: string): string {
	return `${path}.${key}`;
}

/** The path of an array's element — upstream `` `${path}[${index}]` `` (`:903`). */
export function jsonIndexPath(path: string, index: number): string {
	return `${path}[${index}]`;
}

/**
 * Every collapsible path in `data`, down to `maxLevel` inclusive. Upstream's `generateAllPaths`
 * — the seed for `defaultExpanded` and the target of "Expand all".
 */
export function collectExpandablePaths(
	data: unknown,
	maxLevel: number = Number.POSITIVE_INFINITY,
	level = 0,
	path: string = JSON_VIEWER_ROOT_PATH,
	ancestors: WeakSet<object> = new WeakSet(),
): Set<string> {
	const paths = new Set<string>();
	if (level > maxLevel) return paths;
	if (typeof data !== "object" || data === null) return paths;

	paths.add(path);

	// A cycle would recurse forever — the same hostile input `toJsonText` already degrades on. The
	// set holds the CURRENT ANCESTOR CHAIN only (added before the walk, removed after), so a value
	// shared between two sibling branches still gets its paths at both, but a branch that contains
	// itself stops at its own path.
	if (ancestors.has(data)) return paths;
	ancestors.add(data);

	if (Array.isArray(data)) {
		data.forEach((item, index) => {
			for (const child of collectExpandablePaths(
				item,
				maxLevel,
				level + 1,
				jsonIndexPath(path, index),
				ancestors,
			)) {
				paths.add(child);
			}
		});
	} else {
		for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
			for (const child of collectExpandablePaths(
				value,
				maxLevel,
				level + 1,
				jsonChildPath(path, key),
				ancestors,
			)) {
				paths.add(child);
			}
		}
	}

	ancestors.delete(data);
	return paths;
}

/** What {@link countRenderedLines} needs to know about the tree's current shape. */
export type JsonViewerLineCountOptions = {
	/** Whether a branch at this path is open. */
	isExpanded: (path: string) => boolean;
	/** Whether a truncated array at this path has been expanded to its full length. */
	isFullyShown: (path: string) => boolean;
	/** The resolved truncation settings. */
	truncation: JsonViewerTruncation;
};

/**
 * How many rows the tree renders, for the line-number gutter. Upstream's `calculateLineCount`.
 *
 * TWO CORRECTIONS to upstream's arithmetic, both of which made the gutter disagree with the tree:
 * upstream counts the truncated array's "Show N more" row (its `3 +`) but never counts the "Show
 * less" row that replaces it, and it has no way to know an array was expanded in place because
 * upstream keeps that flag inside `JsonArray`'s own `useState`. Here the flag lives on
 * {@link JsonViewerState}, so both cases are simply "the control occupies one row whenever
 * truncation applies to this array".
 *
 * The count is still a count of ROWS, not of visual lines: a string long enough to wrap occupies
 * more than one line box and no gutter built this way can know that. Upstream has the same limit.
 */
export function countRenderedLines(
	data: unknown,
	options: JsonViewerLineCountOptions,
	path: string = JSON_VIEWER_ROOT_PATH,
): number {
	const type = getJsonDataType(data);

	if (type === "object") {
		if (!options.isExpanded(path)) return 1;
		const entries = Object.entries(data as Record<string, unknown>);
		return entries.reduce(
			(total, [key, value]) => total + countRenderedLines(value, options, jsonChildPath(path, key)),
			2,
		);
	}

	if (type === "array") {
		if (!options.isExpanded(path)) return 1;
		const items = data as unknown[];
		const truncates = options.truncation.enabled && items.length > options.truncation.itemsPerArray;
		const visible =
			truncates && !options.isFullyShown(path)
				? items.slice(0, options.truncation.itemsPerArray)
				: items;

		return visible.reduce(
			(total: number, item: unknown, index: number) =>
				total + countRenderedLines(item, options, jsonIndexPath(path, index)),
			truncates ? 3 : 2,
		);
	}

	return 1;
}

/** 2000-01-01T00:00:00Z and 2100-01-01T00:00:00Z, in seconds — upstream's window (`:106-111`). */
const EPOCH_SECONDS_MIN = 946684800;
const EPOCH_SECONDS_MAX = 4102444800;
const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

/**
 * The date a value probably is, or `null`. Upstream's `detectDate`:
 * a string starting with an ISO date, or a number inside the 2000-2100 window read as seconds
 * and then as milliseconds. Deliberately conservative — a plain integer id must not become a date.
 */
export function detectJsonDate(value: unknown): Date | null {
	if (typeof value === "string") {
		if (!ISO_DATE_PREFIX.test(value)) return null;
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? null : date;
	}

	if (typeof value === "number") {
		if (value >= EPOCH_SECONDS_MIN && value <= EPOCH_SECONDS_MAX) return new Date(value * 1000);
		if (value >= EPOCH_SECONDS_MIN * 1000 && value <= EPOCH_SECONDS_MAX * 1000)
			return new Date(value);
	}

	return null;
}

/** The units upstream walks, largest first, with the seconds each holds. */
const RELATIVE_UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
	["year", 31536000],
	["month", 2592000],
	["week", 604800],
	["day", 86400],
	["hour", 3600],
	["minute", 60],
];

const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>();

function getRelativeFormatter(locale?: string): Intl.RelativeTimeFormat {
	const key = locale ?? "";
	let formatter = relativeFormatters.get(key);
	if (!formatter) {
		formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
		relativeFormatters.set(key, formatter);
	}
	return formatter;
}

/**
 * The `// 3 months ago` annotation beside a detected date.
 *
 * Upstream's `formatRelativeTime` builds the phrase by hand — it
 * concatenates an English unit name, an `s` for the plural and `"ago"`/`"from now"`. That is
 * replaced by `Intl.RelativeTimeFormat`, which the platform already has: it pluralises for the
 * caller's locale and gives `"now"` for the under-a-minute case upstream spells `"just now"`.
 */
export function formatJsonRelativeTime(date: Date, now: number, locale?: string): string {
	const formatter = getRelativeFormatter(locale);
	const seconds = (date.getTime() - now) / 1000;

	for (const [unit, unitSeconds] of RELATIVE_UNITS) {
		const value = Math.trunc(seconds / unitSeconds);
		if (value !== 0) return formatter.format(value, unit);
	}

	return formatter.format(0, "second");
}

const HEX_COLOR = /^#([0-9a-f]{3}){1,2}$/i;
const FUNCTIONAL_COLOR = /^(rgba?|hsla?)\(/i;
const HTTP_URL = /^https?:\/\//i;

/** Whether a string value is a colour worth showing a swatch for. */
export function isJsonColorLiteral(value: string): boolean {
	return HEX_COLOR.test(value) || FUNCTIONAL_COLOR.test(value);
}

/** Whether a string value is an `http(s)` URL, which renders as a link. */
export function isJsonHttpUrl(value: string): boolean {
	return HTTP_URL.test(value);
}

/**
 * Per-type ink.
 *
 * UPSTREAM PAINTS THESE WITH RAW PALETTE COLOURS (`json-viewer.tsx:56-69`, `:695`): string
 * `green-600/green-400`, number `orange-600/orange-400`, boolean `blue-600/blue-400`, null
 * `gray-500/gray-400`, key `purple-600/purple-400`. Hard-coded hues survive exactly one palette,
 * and this kit ships twelve. Each is mapped to the semantic family whose hue it matches, and to
 * that family's WALKED INK — `--{state}-subtle-foreground`, not `--{state}` — because the raw
 * status token is a fill: `--warning` is `#f5c042`, which as type on the viewer's ground measures
 * around 1.7:1. The walked family is the one `src/app.css` builds for exactly this job.
 *
 *   string  green  -> success-subtle-foreground
 *   number  orange -> warning-subtle-foreground
 *   boolean blue   -> info-subtle-foreground
 *   null    gray   -> muted-foreground
 *   key     purple -> primary-subtle-foreground  (in `json-viewer-key.svelte`)
 *
 * Purple has no counterpart in the classic vocabulary. Keys take the brand ink rather than info's,
 * so the two blues in play — key and boolean — stay one family apart in every palette.
 */
export const jsonViewerValueVariants = tv({
	base: "",
	variants: {
		type: {
			string: "text-success-subtle-foreground",
			number: "text-warning-subtle-foreground",
			boolean: "text-info-subtle-foreground",
			null: "text-muted-foreground",
			object: "text-muted-foreground",
			array: "text-muted-foreground",
			unknown: "text-muted-foreground",
		},
		/** Long values wrap and break; short ones stay on their row. */
		wrap: {
			true: "wrap-break-word whitespace-pre-wrap",
			false: "whitespace-nowrap",
		},
	},
	defaultVariants: {
		type: "unknown",
		wrap: false,
	},
});

/**
 * The hues the coloured indent guides cycle through, in upstream's `indentColors` order:
 * red, yellow, green, blue, purple. Upstream's fifth hue is purple,
 * which this kit does not have; `primary` takes its slot, which also puts the brand colour on the
 * depth the eye reaches last.
 */
export const JSON_VIEWER_INDENT_TONES = [
	"destructive",
	"warning",
	"success",
	"info",
	"primary",
] as const;

/** A guide's hue, or `plain` when `showColorIndent` is off. */
export type JsonViewerIndentTone = (typeof JSON_VIEWER_INDENT_TONES)[number] | "plain";

/**
 * The rule down the left of an open branch.
 *
 * These are BORDERS, so the raw status tokens are the right ones here — a rule is a fill, and the
 * walked ink family exists for type. Upstream's plain guide is a literal `rgba(0,0,0,.1)` /
 * `rgba(255,255,255,.1)` pair (`:738`); `border-foreground/10` is the same 10% of the page ink in
 * both modes, from a token.
 */
export const jsonViewerIndentVariants = tv({
	base: "border-l pl-5",
	variants: {
		tone: {
			plain: "border-foreground/10",
			destructive: "border-destructive/60",
			warning: "border-warning/60",
			success: "border-success/60",
			info: "border-info/60",
			primary: "border-primary/60",
		},
	},
	defaultVariants: {
		tone: "plain",
	},
});

/** Which guide a depth gets — upstream's `indentColors[level % indentColors.length]` (`:737`). */
export function jsonViewerIndentTone(level: number, colored: boolean): JsonViewerIndentTone {
	if (!colored) return "plain";
	const index =
		((level % JSON_VIEWER_INDENT_TONES.length) + JSON_VIEWER_INDENT_TONES.length) %
		JSON_VIEWER_INDENT_TONES.length;
	return JSON_VIEWER_INDENT_TONES[index] ?? "plain";
}

/**
 * Reactive inputs for {@link JsonViewerState}. They arrive as getter functions so the class keeps
 * tracking the root's props instead of snapshotting them.
 */
export type JsonViewerStateProps = {
	/** The value being viewed. */
	getData: () => unknown;
	/** The caller's partial truncation settings, if any. */
	getTruncation: () => Partial<JsonViewerTruncation> | undefined;
	/** Which gesture toggles a branch. */
	getCollapseMode: () => JsonViewerCollapseMode;
	/** Whether the indent guides are hue-cycled. */
	getShowColorIndent: () => boolean;
	/** Whether the viewport is below the mobile breakpoint. */
	getIsMobile: () => boolean;
};

/**
 * One instance per `<JsonViewer.Root>`. Published on context; every part reads it.
 *
 * Upstream spreads this state over three places — `expandedPaths` on the root, `showAll` inside
 * each `JsonArray`, and the truncation memo (`json-viewer.tsx:425-470`, `:827`). All three live
 * here, because the line-number gutter has to count what the tree will actually render and cannot
 * see state that a node keeps to itself.
 */
export class JsonViewerState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: JsonViewerStateProps;

	/** Every open branch, keyed by path. A branch is closed unless its path is in here. */
	readonly expandedPaths: SvelteSet<string> = new SvelteSet();

	/** Arrays whose "Show N more" has been used, keyed by path. Upstream's per-array `showAll`. */
	readonly untruncatedArrays: SvelteSet<string> = new SvelteSet();

	readonly collapseMode: JsonViewerCollapseMode = $derived(this.#props.getCollapseMode());
	readonly showColorIndent: boolean = $derived(this.#props.getShowColorIndent());

	readonly truncation: JsonViewerTruncation = $derived.by(() => {
		const requested = this.#props.getTruncation();
		const itemsPerArray = requested?.itemsPerArray;

		return {
			// Upstream turns truncation OFF on a mobile viewport, ahead of the caller's own `enabled`,
			// so the narrowest screen is the one that renders every item.
			// Ported as-is: it is the documented behaviour of the component being ported, and a
			// silent disagreement with upstream is worse than a surprising agreement.
			enabled: this.#props.getIsMobile() ? false : (requested?.enabled ?? true),
			// Upstream takes the number as given. A `0` there renders no items above a "Show 0 more"
			// control, and the features demo's number input can produce exactly that (and `NaN`) while
			// it is being typed into, so the floor is enforced here instead.
			itemsPerArray:
				typeof itemsPerArray === "number" && Number.isFinite(itemsPerArray) && itemsPerArray >= 1
					? Math.floor(itemsPerArray)
					: DEFAULT_JSON_VIEWER_ITEMS_PER_ARRAY,
		};
	});

	readonly lineCount: number = $derived.by(() =>
		countRenderedLines(this.#props.getData(), {
			isExpanded: (path) => this.expandedPaths.has(path),
			isFullyShown: (path) => this.untruncatedArrays.has(path),
			truncation: this.truncation,
		}),
	);

	/**
	 * `seed` is the initially open set, resolved by the root from its `defaultExpanded` prop. It is
	 * a constructor argument rather than a getter because it is a SEED: re-reading it later would
	 * silently reopen branches the reader closed.
	 */
	constructor(props: JsonViewerStateProps, seed: Iterable<string>) {
		this.#props = props;
		for (const path of seed) this.expandedPaths.add(path);
	}

	/** Whether the branch at `path` is open. */
	isExpanded(path: string): boolean {
		return this.expandedPaths.has(path);
	}

	/** Open a closed branch, close an open one. */
	toggle(path: string): void {
		if (this.expandedPaths.has(path)) {
			this.expandedPaths.delete(path);
		} else {
			this.expandedPaths.add(path);
		}
	}

	/** Open every branch in the data — upstream's `expandAll`. */
	expandAll(): void {
		const paths = collectExpandablePaths(this.#props.getData());
		this.expandedPaths.clear();
		for (const path of paths) this.expandedPaths.add(path);
	}

	/** Close everything but the root — upstream's `collapseAll`. */
	collapseAll(): void {
		this.expandedPaths.clear();
		this.expandedPaths.add(JSON_VIEWER_ROOT_PATH);
	}

	/** Whether the truncated array at `path` is showing all of its items. */
	isFullyShown(path: string): boolean {
		return this.untruncatedArrays.has(path);
	}

	/** Idempotent: the membership check short-circuits before the write. */
	setFullyShown(path: string, next: boolean): void {
		if (next === this.untruncatedArrays.has(path)) return;
		if (next) this.untruncatedArrays.add(path);
		else this.untruncatedArrays.delete(path);
	}

	/** What the toolbar's copy button writes — upstream `JSON.stringify(data, null, 2)` (`:505`). */
	toJsonText(): string {
		try {
			return JSON.stringify(this.#props.getData(), null, 2) ?? "";
		} catch {
			// `JSON.stringify` throws on a cycle and on a BigInt. Neither can come out of `JSON.parse`,
			// but `data` is any value the caller hands over, so the copy button degrades to a no-op
			// rather than taking the page down.
			return "";
		}
	}
}

const JSON_VIEWER_CONTEXT_KEY = Symbol("json-viewer");

export function setJsonViewerContext(state: JsonViewerState): JsonViewerState {
	return setContext(JSON_VIEWER_CONTEXT_KEY, state);
}

export function hasJsonViewerContext(): boolean {
	return hasContext(JSON_VIEWER_CONTEXT_KEY);
}

export function getJsonViewerContext(part?: string): JsonViewerState {
	if (!hasJsonViewerContext()) {
		throw new Error(`${part ?? "`<JsonViewer>` part"} must be used within \`<JsonViewer.Root>\`.`);
	}
	return getContext<JsonViewerState>(JSON_VIEWER_CONTEXT_KEY);
}

/** Parity name for the selector-hook shape the other ports expose. Delegates to the getter. */
export function useJsonViewer(): JsonViewerState {
	return getJsonViewerContext();
}
