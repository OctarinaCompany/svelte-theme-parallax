/**
 * Pure, side-effect-free date formatting for `<RelativeTimeCard>`.
 *
 * Every string is produced by a platform `Intl` API — there is no bespoke formatter and no
 * hand-written pluralisation. Upstream's thresholds, branch order and phrasing
 * are reproduced exactly; only the machinery differs.
 *
 * Nothing here throws. Upstream crashes on an unparseable `date` and on an unknown IANA time zone;
 * both are rendered states here instead.
 */

/** Below this many seconds of difference the label is {@link JUST_NOW_LABEL}. Upstream line 28. */
export const JUST_NOW_THRESHOLD_SECONDS = 5;

/** At or beyond this many days the label falls back to a locale date. Upstream lines 34, 42. */
export const RELATIVE_CUTOFF_DAYS = 7;

/**
 * Upstream's own English string for a sub-five-second difference (line 28), kept verbatim because
 * it is part of the documented output. `Intl.RelativeTimeFormat` with `numeric: 'auto'` would say
 * `"now"`, which is a different string.
 */
export const JUST_NOW_LABEL = "just now";

/** Everything `date` accepts. Upstream `Date | string | number` (line 138). */
export type DateInput = Date | string | number;

/** The intermediate breakdown {@link formatRelativeTime} buckets on. Upstream lines 18-27. */
export type RelativeTimeParts = {
	/** `true` when the instant is later than `now`. */
	isFuture: boolean;
	/** Whole seconds of absolute difference. */
	seconds: number;
	/** Whole minutes of absolute difference. */
	minutes: number;
	/** Whole hours of absolute difference. */
	hours: number;
	/** Whole days of absolute difference. */
	days: number;
};

/** Trigger label shape. Upstream lines 207-212. */
const ABSOLUTE_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
};

/** Timezone-row date shape. Upstream lines 70-75. */
const ZONED_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
	month: "long",
	day: "numeric",
	year: "numeric",
};

/** Timezone-row time shape. Upstream lines 76-82. */
const ZONED_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hour12: true,
};

/**
 * Normalise a caller's `date`. A `Date` is passed through by identity — never copied — so a
 * caller-owned instance keeps its reference. Upstream lines 167-170.
 */
export function toDate(value: DateInput): Date {
	return value instanceof Date ? value : new Date(value);
}

/** Whether `date` represents a real instant. An invalid date is a rendered state, never a throw. */
export function isValidDate(date: Date): boolean {
	return !Number.isNaN(date.getTime());
}

/**
 * The value for a `<time datetime>` attribute, or `undefined` when the date does not parse — so
 * the attribute is simply omitted rather than `toISOString()` throwing.
 */
export function toIsoString(date: Date): string | undefined {
	return isValidDate(date) ? date.toISOString() : undefined;
}

/** The viewer's resolved locale. Upstream lines 54-57, 172-175. */
export function resolveLocale(): string {
	return new Intl.DateTimeFormat().resolvedOptions().locale;
}

/** Break the signed difference between `date` and `now` into whole units. Upstream lines 18-27. */
export function diffRelativeTime(date: Date, now: Date): RelativeTimeParts {
	const difference = now.getTime() - date.getTime();
	const absoluteDifference = Math.abs(difference);
	const seconds = Math.floor(absoluteDifference / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	return {
		isFuture: difference < 0,
		seconds,
		minutes,
		hours,
		days: Math.floor(hours / 24),
	};
}

/**
 * Format `date` with `options`, honouring `timeZone` when it is a zone the runtime knows.
 *
 * An unknown IANA identifier makes the `Intl.DateTimeFormat` constructor throw `RangeError`, and
 * `format` throws the same on an invalid date; both degrade to the viewer's own zone and to
 * `Date.prototype.toLocaleDateString` respectively.
 */
function formatSafely(
	date: Date,
	locale: string,
	options: Intl.DateTimeFormatOptions,
	timeZone?: string,
): string {
	if (!isValidDate(date)) return date.toLocaleDateString(locale);

	if (timeZone !== undefined) {
		try {
			return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
		} catch {
			// Unknown time zone — fall through and format in the viewer's own zone.
		}
	}

	return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Upstream's compound past-minutes string (line 40), built entirely from `Intl`.
 *
 * `Intl.RelativeTimeFormat` has no two-unit mode, so the single-unit frame (`"5 minutes ago"`) has
 * its magnitude phrase swapped for a list of both units (`"5 minutes 30 seconds"`). The `includes`
 * guard is the locale safety net: a locale whose frame does not embed the plain unit phrase keeps
 * the single-unit string instead of producing garbage.
 */
function formatMinutesWithResidual(
	relative: Intl.RelativeTimeFormat,
	locale: string,
	minutes: number,
	residualSeconds: number,
): string {
	const frame = relative.format(-minutes, "minute");
	const magnitude = new Intl.NumberFormat(locale, {
		style: "unit",
		unit: "minute",
		unitDisplay: "long",
	}).format(minutes);

	if (!frame.includes(magnitude)) return frame;

	const residual = new Intl.NumberFormat(locale, {
		style: "unit",
		unit: "second",
		unitDisplay: "long",
	}).format(residualSeconds);
	const compound = new Intl.ListFormat(locale, { style: "narrow", type: "unit" }).format([
		magnitude,
		residual,
	]);

	return frame.replace(magnitude, compound);
}

/**
 * The live label shown inside the card. Upstream `formatRelativeTime` (lines 17-44), branch for
 * branch — including the deliberate asymmetry where only the *past* minutes bucket appends the
 * residual seconds.
 */
export function formatRelativeTime(date: Date, now: Date, locale: string): string {
	if (!isValidDate(date) || !isValidDate(now)) return date.toLocaleDateString(locale);

	const { isFuture, seconds, minutes, hours, days } = diffRelativeTime(date, now);

	if (seconds < JUST_NOW_THRESHOLD_SECONDS) return JUST_NOW_LABEL;

	const relative = new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "long" });

	if (isFuture) {
		if (seconds < 60) return relative.format(seconds, "second");
		if (minutes < 60) return relative.format(minutes, "minute");
		if (hours < 24) return relative.format(hours, "hour");
		if (days < RELATIVE_CUTOFF_DAYS) return relative.format(days, "day");
		return date.toLocaleDateString(locale);
	}

	if (seconds < 60) return relative.format(-seconds, "second");
	if (minutes < 60) return formatMinutesWithResidual(relative, locale, minutes, seconds % 60);
	if (hours < 24) return relative.format(-hours, "hour");
	if (days < RELATIVE_CUTOFF_DAYS) return relative.format(-days, "day");
	return date.toLocaleDateString(locale);
}

/**
 * {@link formatRelativeTime} against a plain epoch timestamp.
 *
 * A runes module may not hold or build a mutable `Date` (`svelte/prefer-svelte-reactivity`), so the
 * reactive state keeps *now* as a number and converts it here, in this rune-free module.
 */
export function formatRelativeTimeAt(date: Date, now: number, locale: string): string {
	return formatRelativeTime(date, new Date(now), locale);
}

/** The trigger's default text. Upstream lines 207-213. */
export function formatAbsoluteDateTime(date: Date, locale: string): string {
	return formatSafely(date, locale, ABSOLUTE_DATE_TIME_OPTIONS);
}

/** One timezone row's date. Upstream lines 70-75. */
export function formatZonedDate(date: Date, locale: string, timeZone?: string): string {
	return formatSafely(date, locale, ZONED_DATE_OPTIONS, timeZone);
}

/** One timezone row's time. Upstream lines 76-82. */
export function formatZonedTime(date: Date, locale: string, timeZone?: string): string {
	return formatSafely(date, locale, ZONED_TIME_OPTIONS, timeZone);
}

/**
 * One timezone row's label: the caller's identifier verbatim, or — for the local row — the
 * runtime's short UTC offset (`"GMT+2"`). Upstream lines 59-66.
 */
export function formatTimeZoneLabel(date: Date, locale: string, timeZone?: string): string {
	if (timeZone !== undefined) return timeZone;

	try {
		const parts = new Intl.DateTimeFormat(locale, { timeZoneName: "shortOffset" }).formatToParts(
			date,
		);
		const name = parts.find((part) => part.type === "timeZoneName")?.value;
		if (name) return name;
	} catch {
		// An invalid date makes `formatToParts` throw — fall through to the zone identifier.
	}

	return new Intl.DateTimeFormat(locale).resolvedOptions().timeZone;
}

/** One timezone row's accessible name. Upstream line 90. */
export function formatTimeZoneAccessibleName(
	date: Date,
	locale: string,
	timeZone?: string,
): string {
	const label = formatTimeZoneLabel(date, locale, timeZone);
	const formattedDate = formatZonedDate(date, locale, timeZone);
	const formattedTime = formatZonedTime(date, locale, timeZone);

	return `Time in ${label}: ${formattedDate} ${formattedTime}`;
}
