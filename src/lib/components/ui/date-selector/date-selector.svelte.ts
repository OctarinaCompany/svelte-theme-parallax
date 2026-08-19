import { getContext, hasContext, setContext } from "svelte";
import {
	getLocalTimeZone,
	today,
	ZonedDateTime,
	CalendarDate,
	type DateValue,
} from "@internationalized/date";
import { format as formatWithPattern, parse as parseWithPattern } from "date-fns";

/** Every value `period` accepts, in upstream declaration order. */
export const DATE_SELECTOR_PERIOD_TYPES = ["day", "month", "quarter", "half-year", "year"] as const;

/** `'day' | 'month' | 'quarter' | 'half-year' | 'year'` — upstream `DateSelectorPeriodType`. */
export type DateSelectorPeriodType = (typeof DATE_SELECTOR_PERIOD_TYPES)[number];

/** Every value `operator` accepts, in upstream declaration order. */
export const DATE_SELECTOR_FILTER_TYPES = ["is", "before", "after", "between"] as const;

/** `'is' | 'before' | 'after' | 'between'` — upstream `DateSelectorFilterType`. */
export type DateSelectorFilterType = (typeof DATE_SELECTOR_FILTER_TYPES)[number];

/** The week's first day: `0` is Sunday, `6` is Saturday. Matches bits-ui's `WeekStartsOn`. */
export type DateSelectorWeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Every user-facing string the selector renders. Upstream `DateSelectorI18nConfig`
 * plus `previousMonth`/`nextMonth`, added so the icon-only month-stepping buttons carry an
 * accessible name: callers merge partial overrides over
 * {@link DEFAULT_DATE_SELECTOR_I18N}.
 */
export interface DateSelectorI18nConfig {
	// Labels
	selectDate: string;
	apply: string;
	cancel: string;
	clear: string;
	today: string;
	previousMonth: string;
	nextMonth: string;
	// Filter types
	filterTypes: {
		is: string;
		before: string;
		after: string;
		between: string;
	};
	// Period types
	periodTypes: {
		day: string;
		month: string;
		quarter: string;
		halfYear: string;
		year: string;
	};
	// Months
	months: string[];
	monthsShort: string[];
	// Quarters
	quarters: string[];
	// Half years
	halfYears: string[];
	// Weekdays
	weekdays: string[];
	weekdaysShort: string[];
	// Placeholders
	placeholder: string;
	rangePlaceholder: string;
}

/** Upstream `DEFAULT_DATE_SELECTOR_I18N`, plus the added `previousMonth`/`nextMonth` labels. */
export const DEFAULT_DATE_SELECTOR_I18N: DateSelectorI18nConfig = {
	selectDate: "Select date",
	apply: "Apply",
	cancel: "Cancel",
	clear: "Clear",
	today: "Today",
	previousMonth: "Previous month",
	nextMonth: "Next month",
	filterTypes: {
		is: "is",
		before: "before",
		after: "after",
		between: "between",
	},
	periodTypes: {
		day: "Day",
		month: "Month",
		quarter: "Quarter",
		halfYear: "Half-year",
		year: "Year",
	},
	months: [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	],
	monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	quarters: ["Q1", "Q2", "Q3", "Q4"],
	halfYears: ["H1", "H2"],
	weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	weekdaysShort: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
	placeholder: "Select date..",
	rangePlaceholder: "Select date range..",
};

/**
 * One endpoint of a month / quarter / half-year / year range: the year, and the zero-based
 * index of the period inside it (always `0` for whole years). Upstream inlines this shape;
 * it is named here so parts can type their props.
 */
export type DateSelectorPeriodPoint = { year: number; value: number };

/**
 * Upstream `DateSelectorValue` with one type translation:
 * `startDate` / `endDate` are `DateValue` from `@internationalized/date` instead of JS `Date`,
 * because the day view composes this repo's bits-ui calendars, which speak `DateValue`
 * end to end. {@link dateValueToDate} bridges back to `Date` where pattern formatting needs it.
 */
export interface DateSelectorValue {
	period: DateSelectorPeriodType;
	operator: DateSelectorFilterType;
	startDate?: DateValue;
	endDate?: DateValue;
	year?: number;
	month?: number;
	quarter?: number;
	halfYear?: number;
	rangeStart?: DateSelectorPeriodPoint;
	rangeEnd?: DateSelectorPeriodPoint;
}

/**
 * A `DateValue` as a JS `Date` in the local time zone. `ZonedDateTime` carries its own zone and
 * its `toDate()` takes no argument, hence the branch — calling the union method directly does
 * not typecheck.
 */
export function dateValueToDate(value: DateValue): Date {
	if (value instanceof ZonedDateTime) return value.toDate();
	return value.toDate(getLocalTimeZone());
}

/**
 * Upstream `formatDateValue`: the single human-readable line
 * the input and any trigger button display. Day dates go through the date-fns `dayDateFormat`
 * pattern; every other period renders from the i18n tables. Empty string when nothing is
 * selected yet.
 */
export function formatDateValue(
	value: DateSelectorValue,
	i18n: DateSelectorI18nConfig = DEFAULT_DATE_SELECTOR_I18N,
	dayDateFormat: string = "MM/dd/yyyy",
): string {
	const { period, startDate, endDate, year, month, quarter, halfYear, rangeStart, rangeEnd } =
		value;

	if (period === "day") {
		if (startDate && endDate) {
			return `${formatWithPattern(dateValueToDate(startDate), dayDateFormat)} - ${formatWithPattern(dateValueToDate(endDate), dayDateFormat)}`;
		}
		if (startDate) {
			return formatWithPattern(dateValueToDate(startDate), dayDateFormat);
		}
		return "";
	}

	if (period === "month") {
		if (rangeStart && rangeEnd) {
			return `${i18n.monthsShort[rangeStart.value]} ${rangeStart.year} - ${i18n.monthsShort[rangeEnd.value]} ${rangeEnd.year}`;
		}
		if (year !== undefined && month !== undefined) {
			return `${i18n.monthsShort[month]} ${year}`;
		}
		return "";
	}

	if (period === "quarter") {
		if (rangeStart && rangeEnd) {
			return `${i18n.quarters[rangeStart.value]} ${rangeStart.year} - ${i18n.quarters[rangeEnd.value]} ${rangeEnd.year}`;
		}
		if (year !== undefined && quarter !== undefined) {
			return `${i18n.quarters[quarter]} ${year}`;
		}
		return "";
	}

	if (period === "half-year") {
		if (rangeStart && rangeEnd) {
			return `${i18n.halfYears[rangeStart.value]} ${rangeStart.year} - ${i18n.halfYears[rangeEnd.value]} ${rangeEnd.year}`;
		}
		if (year !== undefined && halfYear !== undefined) {
			return `${i18n.halfYears[halfYear]} ${year}`;
		}
		return "";
	}

	if (period === "year") {
		if (rangeStart && rangeEnd) {
			return `${rangeStart.year} - ${rangeEnd.year}`;
		}
		if (year !== undefined) {
			return `${year}`;
		}
		return "";
	}

	return "";
}

/**
 * The date-fns patterns free-text input parsing tries, in order. Upstream's `dateFormats` memo
 *: caller-provided formats win, `dayDateFormat` is always
 * included first, and the fallback list covers the common regional orderings.
 */
export function resolveDayDateFormats(dayDateFormat: string, dayDateFormats?: string[]): string[] {
	if (dayDateFormats && dayDateFormats.length > 0) {
		const formats = [...dayDateFormats];
		if (!formats.includes(dayDateFormat)) {
			formats.unshift(dayDateFormat);
		}
		return formats;
	}
	const defaultFormats = [dayDateFormat, "dd/MM/yyyy", "yyyy-MM-dd", "MM-dd-yyyy", "dd-MM-yyyy"];
	return Array.from(new Set(defaultFormats));
}

/**
 * Upstream `parseInputValue`, hoisted to a pure function.
 * Recognises, in order: a bare year (`2025`), a quarter (`Q4`, `q1 2025` — the `Q` prefix is
 * hardcoded upstream, i18n quarter labels are not consulted), and a day date through the
 * date-fns `formats`. Returns `null` when nothing matches, so callers can keep the previous
 * value while the user is mid-keystroke.
 */
export function parseDateSelectorInput(
	text: string,
	options: { operator: DateSelectorFilterType; formats: string[] },
): DateSelectorValue | null {
	if (!text.trim()) return null;

	const trimmed = text.trim();

	// A bare year, e.g. "2025".
	const yearMatch = trimmed.match(/^\d{4}$/);
	if (yearMatch) {
		const year = parseInt(yearMatch[0]);
		if (year >= 1900 && year <= 2100) {
			return { period: "year", operator: options.operator, year };
		}
	}

	// A quarter, e.g. "Q4" or "Q1 2025".
	const quarterMatch = trimmed.match(/^Q([1-4])(?:\s+(\d{4}))?$/i);
	if (quarterMatch) {
		const quarter = parseInt(quarterMatch[1]) - 1;
		const year = quarterMatch[2] ? parseInt(quarterMatch[2]) : new Date().getFullYear();
		if (year >= 1900 && year <= 2100) {
			return { period: "quarter", operator: options.operator, year, quarter };
		}
	}

	// A day date, through the caller's pattern list.
	for (const dateFormat of options.formats) {
		try {
			const parsed = parseWithPattern(trimmed, dateFormat, new Date());
			if (!isNaN(parsed.getTime())) {
				return {
					period: "day",
					operator: options.operator,
					startDate: new CalendarDate(
						parsed.getFullYear(),
						parsed.getMonth() + 1,
						parsed.getDate(),
					),
				};
			}
		} catch {
			// Try the next format.
		}
	}

	return null;
}

export type DateSelectorStateProps = {
	readonly getI18n: () => DateSelectorI18nConfig;
	readonly getAllowRange: () => boolean;
	readonly getPresetMode: () => DateSelectorFilterType | undefined;
	readonly getPeriodTypes: () => readonly DateSelectorPeriodType[] | undefined;
	readonly getDefaultPeriodType: () => DateSelectorPeriodType;
	readonly getDefaultFilterType: () => DateSelectorFilterType;
	readonly getYearRange: () => number;
	readonly getBaseYear: () => number | undefined;
	readonly getMinYear: () => number | undefined;
	readonly getMaxYear: () => number | undefined;
	/** Receives the freshly assembled {@link DateSelectorValue} after every user interaction. */
	readonly onCommit: (value: DateSelectorValue) => void;
};

/**
 * One instance per `<DateSelector.Root>`, published on context.
 *
 * Merges upstream's `useDateSelector` hook and its
 * `DateSelectorContext`. The upstream context also carried
 * `variant` and `size`, but no child ever read anything except `i18n`, so those two fields are
 * dropped. Where the hook emitted `onChange` from a `useEffect` watching `currentValue` — which
 * also fires once on mount in React — this class calls `onCommit` at the end of each interaction
 * method, so the callback fires only on real user-driven changes, matching the house callback
 * rule (docs/CONVENTIONS.md §6).
 */
export class DateSelectorState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: DateSelectorStateProps;

	readonly i18n: DateSelectorI18nConfig = $derived(this.#props.getI18n());
	readonly allowRange: boolean = $derived(this.#props.getAllowRange());
	readonly presetMode: DateSelectorFilterType | undefined = $derived(this.#props.getPresetMode());
	readonly periodTypes: readonly DateSelectorPeriodType[] | undefined = $derived(
		this.#props.getPeriodTypes(),
	);

	/**
	 * `defaultPeriodType` validated against the allowed `periodTypes` list — an excluded default
	 * falls back to the first allowed entry.
	 */
	readonly validDefaultPeriodType: DateSelectorPeriodType = $derived.by(() => {
		const allowed = this.periodTypes;
		const fallback = this.#props.getDefaultPeriodType();
		if (!allowed || allowed.length === 0) return fallback;
		return allowed.includes(fallback) ? fallback : allowed[0];
	});

	periodType: DateSelectorPeriodType = $state("day");

	/**
	 * The user's own filter choice. The public {@link filterType} lays `presetMode` over it, which
	 * replaces upstream's two sync effects: a preset always
	 * wins while it is set, and the user's last choice resurfaces if the preset is removed.
	 */
	#filterType: DateSelectorFilterType = $state("is");
	readonly filterType: DateSelectorFilterType = $derived(this.presetMode ?? this.#filterType);

	selectedDate: DateValue | undefined = $state();
	selectedEndDate: DateValue | undefined = $state();
	/** The month the day view displays. View state only — never part of the committed value. */
	calendarMonth: DateValue = $state(today(getLocalTimeZone()));
	selectedYear: number | undefined = $state();
	selectedMonth: number | undefined = $state();
	selectedQuarter: number | undefined = $state();
	selectedHalfYear: number | undefined = $state();
	rangeStart: DateSelectorPeriodPoint | undefined = $state();
	rangeEnd: DateSelectorPeriodPoint | undefined = $state();

	/**
	 * The selectable years: the explicit `minYear.maxYear` span
	 * when both bounds are set, else `yearRange` years centred on `baseYear` (default: the current
	 * year).
	 */
	readonly years: number[] = $derived.by(() => {
		const minYear = this.#props.getMinYear();
		const maxYear = this.#props.getMaxYear();
		if (minYear !== undefined && maxYear !== undefined) {
			return Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
		}
		const yearRange = this.#props.getYearRange();
		const currentYear = this.#props.getBaseYear() ?? new Date().getFullYear();
		return Array.from({ length: yearRange }, (_, i) => currentYear - Math.floor(yearRange / 2) + i);
	});

	/** The value as currently assembled — upstream `currentValue`. */
	readonly currentValue: DateSelectorValue = $derived({
		period: this.periodType,
		operator: this.filterType,
		startDate: this.selectedDate,
		endDate: this.selectedEndDate,
		year: this.selectedYear,
		month: this.selectedMonth,
		quarter: this.selectedQuarter,
		halfYear: this.selectedHalfYear,
		rangeStart: this.rangeStart,
		rangeEnd: this.rangeEnd,
	});

	constructor(props: DateSelectorStateProps, initialValue?: DateSelectorValue) {
		this.#props = props;
		this.periodType = initialValue?.period ?? this.validDefaultPeriodType;
		this.#filterType =
			props.getPresetMode() ?? initialValue?.operator ?? props.getDefaultFilterType();
		if (initialValue) {
			this.applyValue(initialValue);
			// Open the day view on the month of the initial selection.
			if (initialValue.startDate) this.calendarMonth = initialValue.startDate;
		}
	}

	#commit(): void {
		this.#props.onCommit(this.currentValue);
	}

	/**
	 * Mirrors an externally supplied value into the granular fields — upstream's value-sync
	 * effect, including its quirk of ignoring `undefined` (clearing goes
	 * through {@link clearSelection}). Never commits: the value came from outside, so echoing it
	 * back would loop.
	 */
	applyValue(value: DateSelectorValue | undefined): void {
		if (!value) return;
		this.periodType = value.period || this.validDefaultPeriodType;
		this.#filterType = this.presetMode ?? value.operator ?? this.#props.getDefaultFilterType();
		this.selectedDate = value.startDate;
		this.selectedEndDate = value.endDate;
		this.selectedYear = value.year;
		this.selectedMonth = value.month;
		this.selectedQuarter = value.quarter;
		this.selectedHalfYear = value.halfYear;
		this.rangeStart = value.rangeStart;
		this.rangeEnd = value.rangeEnd;
	}

	#clearFields(): void {
		this.selectedDate = undefined;
		this.selectedEndDate = undefined;
		this.selectedYear = undefined;
		this.selectedMonth = undefined;
		this.selectedQuarter = undefined;
		this.selectedHalfYear = undefined;
		this.rangeStart = undefined;
		this.rangeEnd = undefined;
	}

	/** Upstream `clearSelection`. */
	clearSelection(): void {
		this.#clearFields();
		this.#commit();
	}

	/**
	 * Upstream `handleDayClick`: in `between` mode the first
	 * click opens a range, the second closes it — swapping when clicked out of order — and a
	 * third starts over. Every other filter keeps a single day.
	 */
	selectDay(day: DateValue): void {
		if (this.filterType === "between" && this.allowRange) {
			if (!this.selectedDate || this.selectedEndDate) {
				this.selectedDate = day;
				this.selectedEndDate = undefined;
			} else if (day.compare(this.selectedDate) < 0) {
				this.selectedEndDate = this.selectedDate;
				this.selectedDate = day;
			} else {
				this.selectedEndDate = day;
			}
		} else {
			this.selectedDate = day;
			this.selectedEndDate = undefined;
		}
		this.#commit();
	}

	/**
	 * Writes both day endpoints at once. This replaces upstream's manual ordering for the range
	 * path: the day view composes bits-ui's `RangeCalendar`,
	 * which already orders and swaps endpoints itself, so the resolved pair just lands here.
	 */
	setDayRange(start: DateValue | undefined, end: DateValue | undefined): void {
		if (start === this.selectedDate && end === this.selectedEndDate) return;
		this.selectedDate = start;
		this.selectedEndDate = end;
		this.#commit();
	}

	/** `year * 100 + value` — the sortable key upstream compares range endpoints with. */
	#periodKey(point: DateSelectorPeriodPoint): number {
		return point.year * 100 + point.value;
	}

	/**
	 * Upstream `handlePeriodSelect`: month / quarter / half-year
	 * cells, single or ranged depending on the active filter.
	 */
	selectPeriod(year: number, value: number): void {
		if (this.filterType === "between" && this.allowRange) {
			if (!this.rangeStart || this.rangeEnd) {
				this.rangeStart = { year, value };
				this.rangeEnd = undefined;
				this.selectedYear = year;
				if (this.periodType === "month") this.selectedMonth = value;
				if (this.periodType === "quarter") this.selectedQuarter = value;
				if (this.periodType === "half-year") this.selectedHalfYear = value;
			} else {
				const startKey = this.#periodKey(this.rangeStart);
				const endKey = year * 100 + value;
				if (endKey < startKey) {
					this.rangeEnd = this.rangeStart;
					this.rangeStart = { year, value };
				} else {
					this.rangeEnd = { year, value };
				}
			}
		} else {
			this.selectedYear = year;
			if (this.periodType === "month") this.selectedMonth = value;
			if (this.periodType === "quarter") this.selectedQuarter = value;
			if (this.periodType === "half-year") this.selectedHalfYear = value;
			this.rangeStart = undefined;
			this.rangeEnd = undefined;
		}
		this.#commit();
	}

	/** Upstream `handleYearSelect`. */
	selectYear(year: number): void {
		if (this.filterType === "between" && this.allowRange) {
			if (!this.rangeStart || this.rangeEnd) {
				this.rangeStart = { year, value: 0 };
				this.rangeEnd = undefined;
				this.selectedYear = year;
			} else if (year < this.rangeStart.year) {
				this.rangeEnd = this.rangeStart;
				this.rangeStart = { year, value: 0 };
			} else {
				this.rangeEnd = { year, value: 0 };
			}
		} else {
			this.selectedYear = year;
			this.rangeStart = undefined;
			this.rangeEnd = undefined;
		}
		this.#commit();
	}

	/**
	 * Upstream `handlePeriodTypeChange`: switching the period
	 * granularity discards the previous selection outright.
	 */
	setPeriodType(type: DateSelectorPeriodType): void {
		if (type === this.periodType) return;
		this.periodType = type;
		this.#clearFields();
		this.#commit();
	}

	/**
	 * Upstream `handleFilterTypeChange`: inert while a
	 * `presetMode` pins the operator; otherwise switching also discards the selection.
	 */
	setFilterType(type: DateSelectorFilterType): void {
		if (this.presetMode !== undefined) return;
		if (type === this.#filterType) return;
		this.#filterType = type;
		this.#clearFields();
		this.#commit();
	}

	/** View-only month navigation for the day view; deliberately does not commit. */
	setCalendarMonth(month: DateValue): void {
		this.calendarMonth = month;
	}

	/** Upstream `isInRange`. */
	isInRange(year: number, value: number): boolean {
		if (!this.rangeStart || !this.rangeEnd) return false;
		const key = year * 100 + value;
		return key >= this.#periodKey(this.rangeStart) && key <= this.#periodKey(this.rangeEnd);
	}

	/** Upstream `isYearInRange`. */
	isYearInRange(year: number): boolean {
		if (!this.rangeStart || !this.rangeEnd) return false;
		return year >= this.rangeStart.year && year <= this.rangeEnd.year;
	}
}

const DATE_SELECTOR_CONTEXT_KEY = Symbol("date-selector");

export function setDateSelectorContext(state: DateSelectorState): DateSelectorState {
	return setContext(DATE_SELECTOR_CONTEXT_KEY, state);
}

export function hasDateSelectorContext(): boolean {
	return hasContext(DATE_SELECTOR_CONTEXT_KEY);
}

/** Read the selector's state, throwing when there is no `<DateSelector.Root>` ancestor. */
export function getDateSelectorContext(consumerName = "<DateSelector.*>"): DateSelectorState {
	if (!hasDateSelectorContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<DateSelector.Root>\`.`);
	}
	return getContext<DateSelectorState>(DATE_SELECTOR_CONTEXT_KEY);
}
