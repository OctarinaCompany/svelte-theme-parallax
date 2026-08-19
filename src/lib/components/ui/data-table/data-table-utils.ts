import { CalendarDate, getLocalTimeZone, type DateValue } from "@internationalized/date";
import type { Column, RowData } from "@tanstack/table-core";

/**
 * Inline `style` for a (possibly pinned) header or body cell.
 *
 * Ported from upstream `docs/lib/data-table.ts`, which computes the same values in JS because the
 * sticky offsets depend on the runtime widths of the preceding pinned columns and cannot be
 * expressed as utility classes. React takes a style *object*; Svelte's `style` attribute takes a
 * string, so this returns CSS text. The `z-index: 1` is upstream's own value and lands on a
 * `<th>`/`<td>`, not on an overlay.
 *
 * ONE DEPARTURE FROM UPSTREAM: it painted `--background` on every cell, pinned or not, which
 * filled table bodies with the page ground where every other table in this theme lets the card
 * show through (the classic theme's `.card .table` model — see the Tables in cards page). Here only pinned
 * cells paint, in the surface they actually cover: the card by default, or whatever
 * `--table-pinned-ground` says — `app.css` rebinds it to `--background` inside head and footer
 * rows, whose ground is the page's by design.
 *
 * @param withBorder Draw upstream's inset shadow on the last left-pinned / first right-pinned
 * column. @default false
 */
export function getColumnPinningStyle<TData extends RowData>({
	column,
	withBorder = false,
}: {
	column: Column<TData, unknown>;
	withBorder?: boolean;
}): string {
	const isPinned = column.getIsPinned();
	const isLastLeftPinnedColumn = isPinned === "left" && column.getIsLastColumn("left");
	const isFirstRightPinnedColumn = isPinned === "right" && column.getIsFirstColumn("right");

	const declarations: string[] = [];

	if (withBorder && isLastLeftPinnedColumn) {
		declarations.push("box-shadow: -4px 0 4px -4px var(--border) inset");
	} else if (withBorder && isFirstRightPinnedColumn) {
		declarations.push("box-shadow: 4px 0 4px -4px var(--border) inset");
	}
	if (isPinned === "left") {
		declarations.push(`left: ${column.getStart("left")}px`);
	}
	if (isPinned === "right") {
		declarations.push(`right: ${column.getAfter("right")}px`);
	}
	declarations.push(`opacity: ${isPinned ? 0.97 : 1}`);
	declarations.push(`position: ${isPinned ? "sticky" : "relative"}`);
	if (isPinned) {
		declarations.push("background: var(--table-pinned-ground, var(--card))");
	}
	declarations.push(`width: ${column.getSize()}px`);
	if (isPinned) {
		declarations.push("z-index: 1");
	}

	return `${declarations.join("; ")};`;
}

/**
 * `"January 1, 2024"`. Ported verbatim from upstream `docs/lib/format.ts` so trigger labels match
 * character for character; invalid input yields an empty string.
 */
export function formatDate(
	date: Date | string | number | undefined,
	opts: Intl.DateTimeFormatOptions = {},
): string {
	if (!date) return "";

	try {
		return new Intl.DateTimeFormat("en-US", {
			month: opts.month ?? "long",
			day: opts.day ?? "numeric",
			year: opts.year ?? "numeric",
			...opts,
		}).format(new Date(date));
	} catch {
		return "";
	}
}

/** Epoch milliseconds (or their string form) to a `Date`, or `undefined` when unparseable. */
export function parseAsDate(timestamp: number | string | undefined): Date | undefined {
	if (!timestamp) return undefined;
	const numericTimestamp = typeof timestamp === "string" ? Number(timestamp) : timestamp;
	const date = new Date(numericTimestamp);
	return !Number.isNaN(date.getTime()) ? date : undefined;
}

/** Normalises whatever a date column's filter value happens to be into a timestamp list. */
export function parseColumnFilterValue(value: unknown): (number | string | undefined)[] {
	if (value === null || value === undefined) {
		return [];
	}

	if (Array.isArray(value)) {
		return value.map((item) => {
			if (typeof item === "number" || typeof item === "string") {
				return item;
			}
			return undefined;
		});
	}

	if (typeof value === "string" || typeof value === "number") {
		return [value];
	}

	return [];
}

/**
 * The `{ start, end }` pair the range calendar binds to. Structurally identical to bits-ui's
 * `DateRange`; upstream's `react-day-picker` calls the same thing `{ from, to }`.
 */
export type DateRangeValue = { start: DateValue | undefined; end: DateValue | undefined };

/** Distinguishes the range calendar's `{ start, end }` object from single mode's date list. */
export function getIsDateRange(value: DateValue[] | DateRangeValue): value is DateRangeValue {
	return typeof value === "object" && !Array.isArray(value);
}

/**
 * Epoch milliseconds to the `@internationalized/date` value the local calendar wrapper binds to.
 * The *column filter* value stays epoch milliseconds — only the calendar speaks `DateValue`.
 */
export function toDateValue(timestamp: number | string | undefined): CalendarDate | undefined {
	const date = parseAsDate(timestamp);
	if (!date) return undefined;
	return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** The inverse of {@link toDateValue}: a calendar value back to epoch milliseconds. */
export function fromDateValue(value: DateValue | undefined): number | undefined {
	if (!value) return undefined;
	return value.toDate(getLocalTimeZone()).getTime();
}

/** A `[min, max]` numeric range, as stored in a `range` column's filter value. */
export type RangeValue = [number, number];

/** Whether an unknown value is a `[number, number]` tuple. */
export function getIsValidRange(value: unknown): value is RangeValue {
	return (
		Array.isArray(value) &&
		value.length === 2 &&
		typeof value[0] === "number" &&
		typeof value[1] === "number"
	);
}

/** Coerces a two-element numeric-ish array to a `[number, number]` tuple. */
export function parseValuesAsNumbers(value: unknown): RangeValue | undefined {
	if (
		Array.isArray(value) &&
		value.length === 2 &&
		value.every((v) => (typeof v === "string" || typeof v === "number") && !Number.isNaN(Number(v)))
	) {
		return [Number(value[0]), Number(value[1])];
	}

	return undefined;
}

/**
 * Slider bounds and step for a `range` column: `meta.range` when it is a valid `[min, max]`,
 * otherwise the column's faceted min/max, otherwise `[0, 100]`. Step buckets are upstream's —
 * `size ≤ 20 → 1`, `size ≤ 100 → ceil(size / 20)`, else `ceil(size / 50)`.
 */
export function getSliderRange(
	defaultRange: [number, number] | undefined,
	facetedMinMaxValues: undefined | [number, number],
): { min: number; max: number; step: number } {
	let minValue = 0;
	let maxValue = 100;

	if (defaultRange && getIsValidRange(defaultRange)) {
		[minValue, maxValue] = defaultRange;
	} else if (facetedMinMaxValues && getIsValidRange(facetedMinMaxValues)) {
		[minValue, maxValue] = facetedMinMaxValues;
	}

	const rangeSize = maxValue - minValue;
	const step =
		rangeSize <= 20 ? 1 : rangeSize <= 100 ? Math.ceil(rangeSize / 20) : Math.ceil(rangeSize / 50);

	return { min: minValue, max: maxValue, step };
}
