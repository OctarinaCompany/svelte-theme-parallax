<script lang="ts">
	import {
		CalendarDate,
		DateFormatter,
		endOfMonth,
		endOfYear,
		getLocalTimeZone,
		isSameDay,
		startOfMonth,
		startOfYear,
		today,
		type DateValue,
	} from "@internationalized/date";
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import * as CalendarUI from "$lib/components/ui/calendar/index.js";
	import { Calendar, Day as CalendarDay } from "$lib/components/ui/calendar/index.js";
	import {
		RangeCalendar,
		Day as RangeDay,
		rangeCalendarFlush,
		rangeDay,
	} from "$lib/components/ui/range-calendar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { cn } from "$lib/utils.js";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import ClockIcon from "@lucide/svelte/icons/clock";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Calendar page: THIRTY demos, in a deliberate order and under stable titles —
	 * including the title used twice.
	 *
	 * WHAT THE CLASSIC THEME HAS. The classic framework has no calendar; the classic theme ships a picker as a vendor plugin
	 * and re-skins it in the reference stylesheet (84 lines). That partial is the
	 * source of every colour and size the class constants below carry — `pickerBody`, `picker`,
	 * `dayCell` for the single-date calendars, and the shared `range-calendar-classes.ts` for
	 * the range ones. Where a value is the picker's own rather than the classic theme's, the constant's
	 * comment says so.
	 *
	 * THE PAGE USED TO CARRY the shadcn-svelte docs demos. Each had an equivalent here that
	 * says strictly more — the default panel is #1, the two-month single grid is #20, the
	 * caption dropdowns are #8/#9, the popover picker is #24, the date-plus-time pair is #30 —
	 * so they were replaced rather than kept alongside, and this page now mirrors one source
	 * instead of splicing two.
	 *
	 * THREE TRANSLATIONS APPLY THROUGHOUT, and are not repeated per section:
	 *
	 *   dates      The React-ecosystem stack for this is react-day-picker plus `date-fns`; this stack is bits-ui plus
	 *              `@internationalized/date`. `subDays(d, 7)` becomes `d.subtract({ days: 7 })`,
	 *              `format(d, 'PPP')` becomes a `DateFormatter`, and no package is added.
	 *   month      react-day-picker drives the displayed month with `month`/`onMonthChange`;
	 *              bits-ui calls it `placeholder`. Every preset writes BOTH the value and the
	 *              placeholder — setting the value alone selects a date the user cannot see.
	 *   disabled   `disabled={[{ before: today }]}` and `{ after: today }` are `minValue` and
	 *              `maxValue`; anything richer (weekends, booked lists) is `isDateDisabled`.
	 *
	 * TWO react-day-picker FEATURES HAVE NO bits-ui COUNTERPART and are rebuilt by hand, each
	 * at its section: week numbers (#10, the grid is composed from the calendar primitives
	 * with an extra column) and replaceable caption/grid internals (#8, #9, #13, #26 — the
	 * component's header is hidden and an equivalent one is rendered above it).
	 */

	const now = today(getLocalTimeZone());
	const tz = getLocalTimeZone();

	/*
	 * THE HEAD-CELL SELECTOR WAS `data-bits-head-cell` ONCE AND MATCHED NOTHING. bits-ui names
	 * the part `data-calendar-head-cell` — verified in the browser, where the cells measured
	 * `font-weight: 400` in `--muted-foreground` until the attribute was corrected.
	 *
	 *   [--cell-size:39px]   the picker's the 39px day cell,
	 *                        untouched by the reference stylesheet; shadcn ships 32px
	 *   head cells           `color: inherit !important` drags the picker's grey weekday labels
	 *                        up to the body colour; `font-weight: bolder` against 400 is 700
	 */
	const pickerBody =
		"[--cell-size:39px] [&_[data-calendar-head-cell]]:font-bold [&_[data-calendar-head-cell]]:text-foreground";

	/**
	 * The panel as a BORDERED inline box — the picker border variable is
	 * `input-border-color`, which `--input` holds exactly in both modes, and `rounded-md` is
	 * `border-radius`. Most demos sit flush inside a `p-0` card instead (the card is the
	 * frame), so the one consumer left is #17, whose source draws its own border.
	 */
	const picker = cn(
		"w-fit rounded-md border border-input",
		"[[data-slot=card-content]_&]:bg-card dark:[[data-slot=card-content]_&]:bg-input",
		pickerBody,
	);

	/** The panel inside a popover: the popover draws the frame, the calendar keeps the body. */
	const pickerDropdown = pickerBody;

	/**
	 * `Popover.Content` standing in for the picker panel as a dropdown: `w-auto p-0`
	 * because the calendar brings its own padding, `ring-input` because shadcn's
	 * `ring-foreground/10` inverts with the theme, `shadow-none` because the reference stylesheet
	 * says `box-shadow: none`.
	 */
	const popoverPanel = "w-auto overflow-hidden p-0 shadow-none ring-input";

	/**
	 * One day cell — the reference stylesheet's the day cell rules: hover is `--bs-light` with a
	 * 1px `--input` border (restored via a transparent resting border so nothing moves), today
	 * is an OUTLINE rather than shadcn's fill, and a selected day's white label survives the
	 * pointer, `!important`-style.
	 */
	const dayCell =
		"border border-transparent not-data-selected:hover:border-input not-data-selected:hover:bg-muted [&[data-today]:not([data-selected])]:border-border [&[data-today]:not([data-selected])]:bg-transparent data-[selected]:border-primary data-[selected]:hover:text-primary-foreground";

	/**
	 * `.form-control` geometry for the popover triggers — the classic theme's date picker IS an
	 * `<input class="form-control">`, so its stand-in button takes the input's box:
	 * 15px x 1.5 + 2 x .5rem + 2 x 1px = 40.5px -> h-10, `input-padding-x` -> px-3, and the
	 * body's 400 weight where shadcn's Button asks for 500.
	 */
	const formControl = "h-10 px-3 font-normal";

	/**
	 * The demos sit in a card that HUGS the panel — each one centres a
	 * shrink-wrapped card, where a block-level card here would stretch across the reading
	 * column and leave the grid floating in it. `overflow-hidden` because the flush panel
	 * inside is square-cornered.
	 */
	const fitCard = "w-fit max-w-full gap-0 overflow-hidden py-0";

	/** No outside days — bits-ui always renders the cells, so they hide. */
	const hideOutside = "[&_[data-outside-month]]:invisible";

	/* --- formatters ------------------------------------------------------------------------ */

	const fmtLong = new DateFormatter("en-US", { dateStyle: "long" }); // date-fns `PPP`
	const fmtShort = new DateFormatter("en-US", { month: "short", day: "2-digit", year: "numeric" }); // `LLL dd, y`
	/*
	 * date-fns `EEEE, d` -> "Sunday, 9". One `Intl` formatter with weekday + day cannot say
	 * it: en-US orders those fields "9 Sunday", so the two halves are formatted separately
	 * and joined in the source's order.
	 */
	const fmtWeekdayOnly = new DateFormatter("en-US", { weekday: "long" });
	const fmtWeekdayDay = {
		format: (date: Date) => `${fmtWeekdayOnly.format(date)}, ${date.getDate()}`,
	};
	const fmtBooking = new DateFormatter("en-US", { weekday: "long", day: "numeric", month: "long" });
	const fmtMonthYear = new DateFormatter("en-US", { month: "long", year: "numeric" });
	const fmtMonthLong = new DateFormatter("en-US", { month: "long" });
	const fmtEventHeading = new DateFormatter("en-US", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
	const fmtEventDay = new DateFormatter("en-US", { month: "short", day: "numeric" });

	const at = (date: DateValue) => date.toDate(tz);

	const monthNames = Array.from({ length: 12 }, (_, index) =>
		new DateFormatter("en-US", { month: "short" }).format(new Date(2025, index, 1)),
	);

	/* --- #1 Basic calendar ------------------------------------------------------------------ */

	let basicDate = $state<DateValue | undefined>(now);

	/* --- #2 Range calendar ------------------------------------------------------------------ */

	type Range = { start: DateValue | undefined; end: DateValue | undefined };

	let basicRange = $state<Range>({ start: now, end: now.add({ days: 5 }) });

	/* --- #3 Disabled dates ------------------------------------------------------------------ */

	/**
	 * The source's five matchers — everything before today, today itself, weekends, and two
	 * short ranges two and three weeks out — folded into one predicate, which is the general
	 * form bits-ui takes. `excludeDisabled` clears the selection whenever a disabled day would
	 * fall inside it, exactly as in react-day-picker.
	 */
	const blockA = { from: now.add({ days: 14 }), to: now.add({ days: 16 }) };
	const blockB = { from: now.add({ days: 23 }), to: now.add({ days: 24 }) };

	function isDate3Disabled(date: DateValue): boolean {
		if (date.compare(now) <= 0) return true;
		const weekday = at(date).getDay();
		if (weekday === 0 || weekday === 6) return true;
		if (date.compare(blockA.from) >= 0 && date.compare(blockA.to) <= 0) return true;
		if (date.compare(blockB.from) >= 0 && date.compare(blockB.to) <= 0) return true;
		return false;
	}

	let disabledRange = $state<Range>({ start: undefined, end: undefined });

	/* --- #4 Multiple day selection ---------------------------------------------------------- */

	let multipleDays = $state<DateValue[]>([
		now.subtract({ days: 17 }),
		now.add({ days: 2 }),
		now.add({ days: 6 }),
		now.add({ days: 8 }),
	]);

	/* --- #5 / #6 Custom select styles ------------------------------------------------------- */

	let circleDate = $state<DateValue | undefined>(now);
	let circleRange = $state<Range>({ start: now, end: now.add({ days: 5 }) });

	/**
	 * #6's band, restated. The source keeps the middle band and half-fills the two cap CELLS
	 * with a gradient — transparent on the outer half, band colour on the inner — so a circular
	 * cap appears to emerge from the band. The shared recipe paints every selected `<td>` one
	 * colour, which a gradient cannot override cleanly (they are different CSS properties, and
	 * the winner would be decided by emission order), so this variant declares the band on the
	 * MIDDLE cells only and gives each cap its own gradient. A one-day range has no inner side,
	 * hence the two `:not()` guards.
	 */
	const circleRangeFrame = cn(
		"w-fit [--cell-radius:calc(infinity*1px)] [--cell-size:39px]",
		"[[data-slot=card-content]_&]:bg-card dark:[[data-slot=card-content]_&]:bg-input",
		"[&_th]:font-bold [&_th]:text-foreground",
		"[&_td:has([data-range-middle])]:bg-secondary dark:[&_td:has([data-range-middle])]:bg-card",
		"[&_td:has([data-range-start]):not(:has([data-range-end]))]:bg-linear-to-r",
		"[&_td:has([data-range-end]):not(:has([data-range-start]))]:bg-linear-to-l",
		"[&_td:has([data-range-start]):not(:has([data-range-end]))]:from-transparent [&_td:has([data-range-start]):not(:has([data-range-end]))]:from-50% [&_td:has([data-range-start]):not(:has([data-range-end]))]:to-secondary [&_td:has([data-range-start]):not(:has([data-range-end]))]:to-50%",
		"[&_td:has([data-range-end]):not(:has([data-range-start]))]:from-transparent [&_td:has([data-range-end]):not(:has([data-range-start]))]:from-50% [&_td:has([data-range-end]):not(:has([data-range-start]))]:to-secondary [&_td:has([data-range-end]):not(:has([data-range-start]))]:to-50%",
		"dark:[&_td:has([data-range-start]):not(:has([data-range-end]))]:to-card",
		"dark:[&_td:has([data-range-end]):not(:has([data-range-start]))]:to-card",
	);

	/* --- #7 Right navigation ---------------------------------------------------------------- */

	let rightNavDate = $state<DateValue | undefined>(now);

	/* --- #8 Month and year selection / #9 Year select with navigation ----------------------- */

	/**
	 * react-day-picker's `captionLayout="dropdown"` takes replacement `Dropdown` components,
	 * which is how the native `<select>` gives way to the popup one. bits-ui's caption
	 * dropdowns are native `<select>` elements with no replacement hook, so these two demos
	 * hide the component's header (and #8 its arrows too — `hideNavigation` in the source) and
	 * render the same row above the grid out of this repo's `Select`, which is the non-native
	 * control the design asks for.
	 *
	 * The span is the source's `startMonth={new Date(1980, 6)}` up to the END of the current
	 * year — react-day-picker defaults `endMonth` to `endOfYear(today)` when the dropdown
	 * layouts are on, so the months after today stay enabled and only the July-1980 edge
	 * disables anything. An earlier version disabled Sep–Dec of the current year too, which
	 * the source never does; the fidelity review caught it.
	 */
	const dropdownFirst = new CalendarDate(1980, 7, 1);
	const dropdownYears = Array.from({ length: now.year - 1980 + 1 }, (_, index) => 1980 + index);

	let selectDate = $state<DateValue | undefined>(now);
	let selectMonth = $state<DateValue>(now);

	function monthDisabled(year: number, month: number): boolean {
		return year === dropdownFirst.year && month < dropdownFirst.month;
	}

	function setSelectMonth(month: number) {
		selectMonth = selectMonth.set({ month });
	}

	/**
	 * Picking a year KEEPS the month-of-year, as react-day-picker's `setYear` does; the one
	 * correction is the 1980 edge, where January–June do not exist in the span.
	 */
	function setSelectYear(year: number) {
		let next = selectMonth.set({ year });
		if (monthDisabled(year, next.month)) next = next.set({ month: dropdownFirst.month });
		selectMonth = next;
	}

	let yearNavDate = $state<DateValue | undefined>(now);
	let yearNavMonth = $state<DateValue>(now);

	function setYearNavYear(year: number) {
		let next = yearNavMonth.set({ year });
		if (monthDisabled(year, next.month)) next = next.set({ month: dropdownFirst.month });
		yearNavMonth = next;
	}

	/* --- #10 Display week numbers ----------------------------------------------------------- */

	let weekNumDate = $state<DateValue | undefined>(now);

	/**
	 * react-day-picker's `showWeekNumber`, which bits-ui does not have — so this demo composes
	 * the grid from the same primitives the generated wrapper uses, with one extra column.
	 *
	 * The number itself follows `date-fns.getWeek`'s DEFAULTS, because that is what
	 * react-day-picker renders when the demo passes nothing: weeks start on Sunday and week 1
	 * is the week containing January 1st — NOT ISO 8601, whose weeks start Monday and whose
	 * week 1 contains the first Thursday.
	 */
	function weekNumber(date: DateValue): number {
		const startOfWeek = (input: Date) => {
			const result = new Date(input);
			result.setHours(0, 0, 0, 0);
			result.setDate(result.getDate() - result.getDay());
			return result;
		};
		const target = startOfWeek(at(date));
		let year = at(date).getFullYear();
		if (target.getTime() >= startOfWeek(new Date(year + 1, 0, 1)).getTime()) year += 1;
		else if (target.getTime() < startOfWeek(new Date(year, 0, 1)).getTime()) year -= 1;
		const first = startOfWeek(new Date(year, 0, 1));
		return Math.round((target.getTime() - first.getTime()) / 604800000) + 1;
	}

	/* --- #11 Current month button / #12 Today button ----------------------------------------- */

	const fourWeeksAgo = now.subtract({ days: 28 });

	let currentMonthDate = $state<DateValue | undefined>(fourWeeksAgo);
	let currentMonthMonth = $state<DateValue>(fourWeeksAgo);

	let todayBtnDate = $state<DateValue | undefined>(fourWeeksAgo);
	let todayBtnMonth = $state<DateValue>(fourWeeksAgo);

	/* --- #13 Custom navigation with year view ------------------------------------------------ */

	/**
	 * The inline sibling of #26: the caption is a button, and the year and month grids are an
	 * OVERLAY over the day grid rather than a replacement of the whole panel — the caption and
	 * the arrows stay put, which is the affordance that lets the caption close the view again.
	 */
	let inlineYearDate = $state<DateValue | undefined>(now);
	let inlineYearMonth = $state<DateValue>(now);
	let inlineYearOpen = $state(false);
	let inlineYearPicked = $state<number | null>(null);
	let inlineYearBox = $state<HTMLElement | null>(null);

	const inlineYearRange = Array.from({ length: 21 }, (_, index) => now.year - 10 + index);

	/*
	 * The source centres the active year with `scrollIntoView({ block: 'center' })`, which
	 * also scrolls every ANCESTOR — opening the view would yank the whole page. The offset
	 * arithmetic scrolls only the list.
	 */
	$effect(() => {
		if (inlineYearOpen && inlineYearPicked === null && inlineYearBox) {
			const active = inlineYearBox.querySelector<HTMLElement>('[data-active="true"]');
			if (active) {
				inlineYearBox.scrollTop =
					active.offsetTop - inlineYearBox.clientHeight / 2 + active.clientHeight / 2;
			}
		}
	});

	/* --- #14 Preset time selection, and the demos that reuse its column ---------------------- */

	/** The source's mock availability, verbatim. */
	const timeSlots = [
		{ time: "09:00", available: false },
		{ time: "09:30", available: false },
		{ time: "10:00", available: true },
		{ time: "10:30", available: true },
		{ time: "11:00", available: true },
		{ time: "11:30", available: true },
		{ time: "12:00", available: false },
		{ time: "12:30", available: true },
		{ time: "13:00", available: true },
		{ time: "13:30", available: true },
		{ time: "14:00", available: true },
		{ time: "14:30", available: false },
		{ time: "15:00", available: false },
		{ time: "15:30", available: true },
		{ time: "16:00", available: true },
		{ time: "16:30", available: true },
		{ time: "17:00", available: true },
		{ time: "17:30", available: true },
	];

	let slotDate = $state<DateValue>(now);
	let slotTime = $state<string | null>(null);

	let pickerSlotDate = $state<DateValue>(now);
	let pickerSlotTime = $state<string | null>(null);
	let pickerSlotOpen = $state(false);

	/* --- #15 Calendar with presets, and its popover form (#28) ------------------------------- */

	const singlePresets = [
		{ label: "Today", value: now },
		{ label: "Yesterday", value: now.subtract({ days: 1 }) },
		{ label: "Last week", value: now.subtract({ days: 7 }) },
		{ label: "Last month", value: now.subtract({ months: 1 }) },
		{ label: "Last year", value: now.subtract({ years: 1 }) },
	];

	let presetDate = $state<DateValue | undefined>(now);
	let presetMonth = $state<DateValue>(now);

	let pickerPresetDate = $state<DateValue | undefined>(now);
	let pickerPresetMonth = $state<DateValue>(now);
	let pickerPresetOpen = $state(false);

	/* --- #16 Range calendar with presets, and its popover form (#29) ------------------------- */

	const rangePresets: { label: string; value: Range }[] = [
		{ label: "Today", value: { start: now, end: now } },
		{
			label: "Yesterday",
			value: { start: now.subtract({ days: 1 }), end: now.subtract({ days: 1 }) },
		},
		{ label: "Last 7 days", value: { start: now.subtract({ days: 6 }), end: now } },
		{ label: "Last 30 days", value: { start: now.subtract({ days: 29 }), end: now } },
		{ label: "Month to date", value: { start: startOfMonth(now), end: now } },
		{
			label: "Last month",
			value: {
				start: startOfMonth(now.subtract({ months: 1 })),
				end: endOfMonth(now.subtract({ months: 1 })),
			},
		},
		{ label: "Year to date", value: { start: startOfYear(now), end: now } },
		{
			label: "Last year",
			value: {
				start: startOfYear(now.subtract({ years: 1 })),
				end: endOfYear(now.subtract({ years: 1 })),
			},
		},
	];

	const lastSevenDays = (): Range => ({ start: now.subtract({ days: 6 }), end: now });

	let presetRange = $state<Range>(lastSevenDays());
	let presetRangeMonth = $state<DateValue>(now);

	let pickPresetOpen = $state(false);
	let pickPresetRange = $state<Range>(lastSevenDays());
	let pickPresetMonth = $state<DateValue>(now);

	function rangeLabel(range: Range) {
		if (!range.start) return "Pick a date range";
		if (!range.end) return fmtShort.format(at(range.start));
		return `${fmtShort.format(at(range.start))} - ${fmtShort.format(at(range.end))}`;
	}

	/* --- #17 Calendar with pricing ----------------------------------------------------------- */

	/** The source's seeded pseudo-random price, verbatim — stable for a given date. */
	function priceFor(date: DateValue): number {
		const seed = date.year * 10000 + date.month * 100 + date.day;
		const value = (seed * 9301 + 49297) % 233280;
		return Math.floor(50 + (value / 233280) * 200);
	}

	let pricingDate = $state<DateValue | undefined>(now);

	/* --- #18 Calendar with presets (footer form) --------------------------------------------- */

	const footerPresets = [
		{ label: "Today", days: 0 },
		{ label: "Tomorrow", days: 1 },
		{ label: "3 days", days: 3 },
		{ label: "Week", days: 7 },
		{ label: "2 weeks", days: 14 },
	];

	/* `new Date(year, 1, 12)` is FEBRUARY the 12th — `Date` months are zero-based. */
	let footerDate = $state<DateValue | undefined>(new CalendarDate(now.year, 2, 12));
	let footerMonth = $state<DateValue>(startOfMonth(now));

	/* --- #19 Appointment calendar ------------------------------------------------------------ */

	/** 09:00 to 18:00 in quarter-hour steps — `Array.from({ length: 37 })` in the source. */
	const appointmentSlots = Array.from({ length: 37 }, (_, index) => {
		const minutes = index * 15;
		const hour = Math.floor(minutes / 60) + 9;
		return `${String(hour).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
	});

	const bookedDates = [0, 1, 2].map((offset) => now.add({ days: offset }));
	const isBooked = (date: DateValue) => bookedDates.some((booked) => isSameDay(booked, date));

	let appointmentDate = $state<DateValue | undefined>(now);
	let appointmentTime = $state<string | null>("10:00");

	/* --- #20 / #21 Two months ----------------------------------------------------------------- */

	let twoMonthsDate = $state<DateValue | undefined>(now);

	const clampToMonth = (day: number) => Math.min(day, endOfMonth(now).day);
	let twoMonthRange = $state<Range>({
		start: now.set({ day: clampToMonth(6) }),
		end: now.set({ day: clampToMonth(18) }),
	});

	/* --- #22 Calendar with event list --------------------------------------------------------- */

	/**
	 * The source's mock events, on their fixed 2026 dates. Their times are printed with
	 * `little-date`, whose one behaviour that matters here is the shortening: a full hour
	 * drops its minutes and one shared meridiem serves both ends — "10 - 11:30 AM". The
	 * package is not installed for three strings, so the formatter below reproduces exactly
	 * that output for same-day, same-meridiem events, which the three below all are.
	 */
	const events = [
		{
			title: "Product Launch",
			date: new CalendarDate(2026, 1, 24),
			start: "10:00",
			end: "11:30",
			accent: "after:bg-success",
		},
		{
			title: "Weekly Standup",
			date: new CalendarDate(2026, 1, 28),
			start: "13:00",
			end: "13:30",
			accent: "after:bg-warning",
		},
		{
			title: "Code Review Session",
			date: new CalendarDate(2026, 1, 31),
			start: "15:00",
			end: "16:00",
			accent: "after:bg-info",
		},
	];

	function eventRange(event: (typeof events)[number]): string {
		const half = (raw: string) => {
			const [h, m] = raw.split(":").map(Number);
			const hour = h % 12 || 12;
			return m === 0 ? `${hour}` : `${hour}:${String(m).padStart(2, "0")}`;
		};
		const meridiem = Number(event.end.split(":")[0]) < 12 ? "AM" : "PM";
		return `${fmtEventDay.format(at(event.date))}, ${half(event.start)} - ${half(event.end)} ${meridiem}`;
	}

	let eventDate = $state<DateValue>(now);

	/* --- #23 Localize calendar ----------------------------------------------------------------- */

	const localized = {
		en: { title: "Schedule a meeting", locale: "en-US" },
		zh: { title: "安排会议", locale: "zh-CN" },
	} as const;

	let localeKey = $state<keyof typeof localized>("en");
	let localeRange = $state<Range>({
		start: new CalendarDate(2026, 2, 9),
		end: new CalendarDate(2026, 2, 17),
	});
	let localeMonth = $state<DateValue>(new CalendarDate(2026, 2, 9));

	/* --- #24 / #25 The plain popover pickers ---------------------------------------------------- */

	let pickDateOpen = $state(false);
	let pickDate = $state<DateValue | undefined>();

	let pickRangeOpen = $state(false);
	let pickRange = $state<Range>({ start: undefined, end: undefined });

	/* --- #26 Calendar with date picker and year view -------------------------------------------- */

	let yearViewOpen = $state(false);
	let yearViewMonth = $state<DateValue>(now);
	let yearViewDate = $state<DateValue | undefined>(now);
	let yearViewStep = $state<"calendar" | "years" | "months">("calendar");
	let yearViewYear = $state(now.year);

	const yearRange = Array.from({ length: 21 }, (_, index) => now.year - 10 + index);

	function openYearStep() {
		yearViewYear = yearViewMonth.year;
		yearViewStep = "years";
	}

	function chooseMonth(monthIndex: number) {
		yearViewMonth = yearViewMonth.set({ year: yearViewYear, month: monthIndex + 1 });
		yearViewStep = "calendar";
	}

	/* --- #30 Calendar with date and time range picker -------------------------------------------- */

	let timeRangeOpen = $state(false);
	let timeRangeDate = $state<DateValue | undefined>(new CalendarDate(now.year, now.month, 12));

	const uid = $props.id();
</script>

<!-- The page's day cell, handed to every single-date calendar below. -->
{#snippet dayChip()}
	<CalendarDay class={dayCell} />
{/snippet}

<!-- Its range counterpart. -->
{#snippet rangeDayChip()}
	<RangeDay class={rangeDay} />
{/snippet}

<!--
	The time-slot column, shared by #14 and #27. A ScrollArea component could scroll it,
	which this repository does not carry — the classic theme ships no custom scrollbar, so a column that
	scrolls is a column that scrolls. The picked time arrives as a callback so one snippet can
	serve two demos with separate state.
-->
{#snippet timeColumn(date: DateValue, current: string | null, pick: (time: string) => void)}
	<div class="relative w-full max-sm:h-48 sm:w-40">
		<div class="absolute inset-0 py-4 max-sm:border-t">
			<div class="h-full overflow-y-auto sm:border-s">
				<div class="flex flex-col gap-3">
					<div class="flex h-5 shrink-0 items-center px-5">
						<p class="text-sm font-medium">{fmtWeekdayDay.format(at(date))}</p>
					</div>
					<div class="grid gap-1.5 px-5 max-sm:grid-cols-2">
						{#each timeSlots as slot (slot.time)}
							<Button
								class="w-full"
								disabled={!slot.available}
								size="sm"
								variant={current === slot.time ? "default" : "outline"}
								onclick={() => pick(slot.time)}
							>
								{slot.time}
							</Button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/snippet}

<!--
	The single-date preset rail, shared by #15 and #28. `max-sm:order-1` is the source's: below
	`sm` the rail drops beneath the grid.
-->
{#snippet presetRail(pick: (value: DateValue) => void)}
	<div class="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
		<div class="h-full sm:border-e">
			<div class="flex flex-col px-2">
				{#each singlePresets as preset (preset.label)}
					<Button
						class="w-full justify-start"
						size="sm"
						variant="ghost"
						onclick={() => pick(preset.value)}
					>
						{preset.label}
					</Button>
				{/each}
			</div>
		</div>
	</div>
{/snippet}

<!-- The eight-period rail, shared by #16 and #29. -->
{#snippet rangeRail(pick: (value: Range) => void)}
	<div class="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
		<div class="h-full sm:border-e">
			<div class="flex flex-col px-2">
				{#each rangePresets as preset (preset.label)}
					<Button
						class="w-full justify-start"
						size="sm"
						variant="ghost"
						onclick={() => pick(preset.value)}
					>
						{preset.label}
					</Button>
				{/each}
			</div>
		</div>
	</div>
{/snippet}

<!--
	The popover triggers' shared interior. The box is `formControl` — the classic theme's picker is an
	input, not shadcn's `h-9` button — and the placeholder grey applies when there is NO value;
	the source writes `date && "text-muted-foreground"` on five of its seven triggers, which
	greys the text once a date IS picked and reads as a slip rather than a decision.
-->
{#snippet pickerTrigger(label: string, muted: boolean)}
	<span class={cn("truncate", muted && "text-muted-foreground")}>{label}</span>
	<CalendarIcon
		data-icon="inline-end"
		aria-hidden="true"
		class="shrink-0 opacity-60 transition-opacity group-hover/pick-date:opacity-100"
	/>
{/snippet}

<DocPage title="Calendar">
	{#snippet subtitle()}
		Thirty calendar patterns — from a basic picker to presets, ranges and time — built on this
		theme's
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/calendar"
			target="_blank"
			rel="noreferrer">shadcn-svelte calendar</a
		>, wearing the house skin.
	{/snippet}

	<div>
		<DocSection title="Basic calendar">
			{#snippet blurb()}
				One month, one selected day, flush in a card — the card is the frame, so the panel keeps no
				border of its own.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<Calendar type="single" bind:value={basicDate} class={pickerBody} day={dayChip} />
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Range calendar">
			{#snippet blurb()}
				Six days, seeded from today. The days between the ends take the in-range fill, the same band
				the Range calendar page draws.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<RangeCalendar bind:value={basicRange} class={rangeCalendarFlush} day={rangeDayChip} />
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Disabled dates">
			{#snippet blurb()}
				Everything up to today, weekends, and two blocked ranges.
				<code class="text-[87.5%] text-primary">excludeDisabled</code> clears any selection a disabled
				day would fall inside, which bits-ui carries under the same name.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<RangeCalendar
						bind:value={disabledRange}
						isDateDisabled={isDate3Disabled}
						excludeDisabled
						class={rangeCalendarFlush}
						day={rangeDayChip}
					/>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Multiple day selection">
			{#snippet blurb()}
				<code class="text-[87.5%] text-primary">type="multiple"</code> turns the value into an array and
				lets any number of days be picked, consecutive or not.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<Calendar type="multiple" bind:value={multipleDays} class={pickerBody} day={dayChip} />
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Custom select day style">
			{#snippet blurb()}
				Every radius in the panel reads <code class="text-[87.5%] text-primary">--cell-radius</code
				>, so one variable turns the day chips from rounded squares into circles.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<Calendar
						type="single"
						bind:value={circleDate}
						class={cn(pickerBody, "[--cell-radius:calc(infinity*1px)]")}
						day={dayChip}
					/>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Custom select range style">
			{#snippet blurb()}
				Circular caps emerging from the band: the cap cells are half-filled with a gradient —
				transparent outward, band colour inward — under a fully rounded chip.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<RangeCalendar bind:value={circleRange} class={circleRangeFrame} day={rangeDayChip} />
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Right navigation">
			{#snippet blurb()}
				Both arrows on the right and the caption on the left — CSS only, since the header and the
				nav are separate absolutely-positioned rows.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<Calendar
						type="single"
						bind:value={rightNavDate}
						class={cn(
							pickerBody,
							"[&_[data-calendar-header]]:justify-start [&_[data-calendar-header]]:ps-2.5 [&_nav]:justify-end",
						)}
						day={dayChip}
					/>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Month and year selection">
			{#snippet blurb()}
				Month and year as NON-native dropdowns. Bits UI's caption selects are native <code
					class="text-[87.5%] text-primary">&lt;select&gt;</code
				> elements with no replacement hook, so the header is hidden and the same row is rendered above
				the grid from this theme's Select. The span offered is July 1980 to today.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<div class="w-fit">
						<div class="flex items-center gap-2 px-3 pt-3">
							<Select.Root
								type="single"
								value={String(selectMonth.month)}
								onValueChange={(value) => value && setSelectMonth(Number(value))}
							>
								<Select.Trigger class="grow" aria-label="Month">
									{monthNames[selectMonth.month - 1]}
								</Select.Trigger>
								<Select.Content align="start">
									{#each monthNames as name, index (name)}
										<Select.Item
											value={String(index + 1)}
											disabled={monthDisabled(selectMonth.year, index + 1)}
										>
											{name}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<Select.Root
								type="single"
								value={String(selectMonth.year)}
								onValueChange={(value) => value && setSelectYear(Number(value))}
							>
								<Select.Trigger aria-label="Year">{selectMonth.year}</Select.Trigger>
								<Select.Content align="start">
									{#each dropdownYears as year (year)}
										<Select.Item value={String(year)}>{year}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
						<!-- `hideNavigation` in the source: no arrows, the dropdowns are the nav. -->
						<Calendar
							type="single"
							bind:value={selectDate}
							bind:placeholder={selectMonth}
							class={cn(pickerDropdown, "[&_[data-calendar-header]]:hidden [&_nav]:hidden")}
							day={dayChip}
						/>
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Year select with navigation">
			{#snippet blurb()}
				The month stays a label, the year is a dropdown, and the arrows keep working around them.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<div class="w-fit">
						<div class="relative flex h-9 items-center justify-center gap-3 px-3 pt-3">
							<Button
								variant="ghost"
								size="icon-sm"
								class="absolute start-3"
								aria-label="Previous month"
								disabled={yearNavMonth.year === dropdownFirst.year &&
									yearNavMonth.month === dropdownFirst.month}
								onclick={() => (yearNavMonth = yearNavMonth.subtract({ months: 1 }))}
							>
								<ChevronLeftIcon />
							</Button>
							<span class="text-sm font-medium">{fmtMonthLong.format(at(yearNavMonth))}</span>
							<Select.Root
								type="single"
								value={String(yearNavMonth.year)}
								onValueChange={(value) => value && setYearNavYear(Number(value))}
							>
								<Select.Trigger size="sm" aria-label="Year">{yearNavMonth.year}</Select.Trigger>
								<Select.Content align="start">
									{#each dropdownYears as year (year)}
										<Select.Item value={String(year)}>{year}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<Button
								variant="ghost"
								size="icon-sm"
								class="absolute end-3"
								aria-label="Next month"
								disabled={yearNavMonth.year === now.year && yearNavMonth.month === 12}
								onclick={() => (yearNavMonth = yearNavMonth.add({ months: 1 }))}
							>
								<ChevronRightIcon />
							</Button>
						</div>
						<Calendar
							type="single"
							bind:value={yearNavDate}
							bind:placeholder={yearNavMonth}
							class={cn(pickerDropdown, "[&_[data-calendar-header]]:hidden [&_nav]:hidden")}
							day={dayChip}
						/>
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Display week numbers">
			{#snippet blurb()}
				react-day-picker's <code class="text-[87.5%] text-primary">showWeekNumber</code>, which
				bits-ui does not have — so the grid is composed from the calendar primitives with one extra
				column. The numbering is <code class="text-[87.5%] text-primary">date-fns</code>'s default,
				not ISO: weeks start Sunday, and week 1 holds January&nbsp;1st.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<CalendarPrimitive.Root
						type="single"
						bind:value={weekNumDate}
						fixedWeeks
						weekdayFormat="short"
						locale="en-US"
						class={cn(
							"group/calendar w-fit p-3 [--cell-radius:var(--radius-md)]",
							"bg-background [[data-slot=card-content]_&]:bg-transparent",
							pickerBody,
						)}
					>
						{#snippet children({ months, weekdays })}
							<CalendarUI.Months>
								<CalendarUI.Nav>
									<CalendarUI.PrevButton />
									<CalendarUI.NextButton />
								</CalendarUI.Nav>
								{#each months as month (month)}
									<CalendarUI.Month>
										<CalendarUI.Header>
											<CalendarUI.Heading />
										</CalendarUI.Header>
										<CalendarUI.Grid>
											<CalendarUI.GridHead>
												<CalendarUI.GridRow class="select-none">
													<!-- The week-number column's header is an empty cell, as in the source. -->
													<CalendarUI.HeadCell />
													{#each weekdays as weekday, index (index)}
														<CalendarUI.HeadCell>{weekday.slice(0, 2)}</CalendarUI.HeadCell>
													{/each}
												</CalendarUI.GridRow>
											</CalendarUI.GridHead>
											<CalendarUI.GridBody>
												{#each month.weeks as weekDates (weekDates)}
													<CalendarUI.GridRow class="mt-2 w-full">
														<th class="size-(--cell-size) p-0 text-center font-normal">
															<span
																class="inline-flex size-8 items-center justify-center text-sm font-normal text-muted-foreground"
															>
																{weekNumber(weekDates[0])}
															</span>
														</th>
														{#each weekDates as date (date)}
															<CalendarUI.Cell {date} month={month.value}>
																<CalendarUI.Day class={dayCell} />
															</CalendarUI.Cell>
														{/each}
													</CalendarUI.GridRow>
												{/each}
											</CalendarUI.GridBody>
										</CalendarUI.Grid>
									</CalendarUI.Month>
								{/each}
							</CalendarUI.Months>
						{/snippet}
					</CalendarPrimitive.Root>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Current month button">
			{#snippet blurb()}
				Seeded four weeks back; the button returns the GRID to today's month without touching the
				selection.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<Calendar
						type="single"
						bind:value={currentMonthDate}
						bind:placeholder={currentMonthMonth}
						class={pickerBody}
						day={dayChip}
					/>
					<Button
						class="mb-2 ml-4"
						size="sm"
						variant="outline"
						onclick={() => (currentMonthMonth = now)}
					>
						Current month
					</Button>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Today button">
			{#snippet blurb()}
				The same shape, but the button selects today as well as scrolling the grid to it.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<Calendar
						type="single"
						bind:value={todayBtnDate}
						bind:placeholder={todayBtnMonth}
						class={pickerBody}
						day={dayChip}
					/>
					<Button
						class="mb-2 ml-4"
						size="sm"
						variant="outline"
						onclick={() => {
							todayBtnDate = now;
							todayBtnMonth = now;
						}}
					>
						Today
					</Button>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Custom navigation with year view">
			{#snippet blurb()}
				The inline form of the year drill-down: the caption is a button, and the year and month
				grids are an overlay over the day grid — the caption stays visible, which is what lets it
				close the view again. Twenty-one years, the active one scrolled to centre.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<div class="w-fit">
						<div class="flex items-center justify-between p-3 pb-0">
							<Button
								variant="ghost"
								size="sm"
								class={cn(
									"-ms-2 gap-2 font-medium hover:bg-transparent",
									inlineYearOpen && "text-muted-foreground/80",
								)}
								onclick={() => {
									inlineYearOpen = !inlineYearOpen;
									if (!inlineYearOpen) inlineYearPicked = null;
								}}
							>
								{fmtMonthYear.format(at(inlineYearMonth))}
								<ChevronDownIcon
									class={cn(
										"shrink-0 text-muted-foreground/80 transition-transform duration-200",
										inlineYearOpen && "rotate-180",
									)}
								/>
							</Button>
							<!--
								The arrows stay LIVE while the overlay is up, as the source's do — its nav
								sits outside the overlay with pointer-events restored. Stepping the month
								moves the highlighted year in the list, which is the point of leaving them on.
							-->
							<div class="flex items-center">
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Previous month"
									disabled={inlineYearMonth.year === now.year - 10 && inlineYearMonth.month === 1}
									onclick={() => (inlineYearMonth = inlineYearMonth.subtract({ months: 1 }))}
								>
									<ChevronLeftIcon />
								</Button>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Next month"
									disabled={inlineYearMonth.year === now.year + 10 && inlineYearMonth.month === 12}
									onclick={() => (inlineYearMonth = inlineYearMonth.add({ months: 1 }))}
								>
									<ChevronRightIcon />
								</Button>
							</div>
						</div>
						<div class="relative">
							<Calendar
								type="single"
								bind:value={inlineYearDate}
								bind:placeholder={inlineYearMonth}
								class={cn(pickerDropdown, "[&_[data-calendar-header]]:hidden [&_nav]:hidden")}
								day={dayChip}
							/>
							{#if inlineYearOpen}
								<div
									bind:this={inlineYearBox}
									class="absolute inset-0 z-20 overflow-y-auto bg-card p-3"
								>
									{#if inlineYearPicked === null}
										<div class="grid grid-cols-4 gap-2">
											{#each inlineYearRange as year (year)}
												<Button
													variant={year === inlineYearMonth.year ? "default" : "outline"}
													size="sm"
													class="h-8"
													data-active={year === inlineYearMonth.year}
													onclick={() => (inlineYearPicked = year)}
												>
													{year}
												</Button>
											{/each}
										</div>
									{:else}
										<div class="flex flex-col gap-2">
											<div class="flex items-center gap-2">
												<Button
													variant="ghost"
													size="sm"
													class="px-2"
													onclick={() => (inlineYearPicked = null)}
												>
													<ChevronLeftIcon class="mr-1 size-4" />
													{inlineYearPicked}
												</Button>
											</div>
											<div class="grid grid-cols-3 gap-2">
												{#each monthNames as name, index (name)}
													<Button
														variant={inlineYearPicked === inlineYearMonth.year &&
														index + 1 === inlineYearMonth.month
															? "default"
															: "outline"}
														size="sm"
														class="h-8"
														onclick={() => {
															inlineYearMonth = inlineYearMonth.set({
																year: inlineYearPicked!,
																month: index + 1,
															});
															inlineYearOpen = false;
															inlineYearPicked = null;
														}}
													>
														{name}
													</Button>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Preset time selection">
			{#snippet blurb()}
				A picker beside its available slots. Picking a day clears the chosen time — the slots belong
				to the day, not to the form.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<div class="flex max-sm:flex-col">
						<!--
							A FUNCTION binding, not a plain one — the source guards its callback with
							`if (newDate)`, so re-clicking the selected day is a no-op there. A plain
							binding lets bits-ui write `undefined` through on that click, and the slot
							column's heading then formats a date that no longer exists. The setter is
							also where the chosen time resets, since it only runs for real changes.
						-->
						<Calendar
							type="single"
							bind:value={
								() => slotDate,
								(value) => {
									if (value) {
										slotDate = value;
										slotTime = null;
									}
								}
							}
							minValue={now}
							class={cn(pickerBody, "w-fit")}
							day={dayChip}
						/>
						{@render timeColumn(slotDate, slotTime, (time) => (slotTime = time))}
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Calendar with presets">
			{#snippet blurb()}
				Shortcuts down the left edge. Each one writes the value <em>and</em> the displayed month —
				bits-ui calls the second one
				<code class="text-[87.5%] text-primary">placeholder</code>, and without it "Last year" would
				select a date the grid never moves to.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<div class="flex max-sm:flex-col">
						{@render presetRail((value) => {
							presetDate = value;
							presetMonth = value;
						})}
						<!-- Guarded like the slot picker above: the source swallows the deselect. -->
						<Calendar
							type="single"
							bind:value={() => presetDate, (value) => value && (presetDate = value)}
							bind:placeholder={presetMonth}
							maxValue={now}
							class={cn(pickerBody, "w-fit")}
							day={dayChip}
						/>
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Range calendar with presets">
			{#snippet blurb()}
				The eight periods a dashboard filter actually offers, driving a range.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="p-0">
					<div class="flex max-sm:flex-col">
						{@render rangeRail((value) => {
							presetRange = value;
							presetRangeMonth = value.end ?? now;
						})}
						<RangeCalendar
							bind:value={presetRange}
							bind:placeholder={presetRangeMonth}
							maxValue={now}
							class={rangeCalendarFlush}
							day={rangeDayChip}
						/>
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Calendar with pricing">
			{#snippet blurb()}
				A per-night price under each day, seeded from the date so it is stable between renders, and
				green under $100. The one demo shipped without a card: the panel draws its own border, and
				the cells grow to 48px to hold two lines.
			{/snippet}
			<Calendar
				type="single"
				bind:value={pricingDate}
				class={cn(picker, "rounded-lg [--cell-size:48px]", hideOutside)}
			>
				{#snippet day({ day, outsideMonth })}
					{@const price = priceFor(day)}
					<CalendarDay class={dayCell}>
						{day.day}
						{#if !outsideMonth}
							<span class={price < 100 ? "text-success" : ""}>${price}</span>
						{/if}
					</CalendarDay>
				{/snippet}
			</Calendar>
		</DocSection>

		<DocSection title="Calendar with presets in the footer">
			{#snippet blurb()}
				The set uses this title twice, so this one names where its shortcuts sit: relative offsets
				in the card's footer, rather than the rail above. It opens on the selected month rather than
				the current one — bits-ui seeds the placeholder from the value, and that is the kinder rule:
				react-day-picker opens on today with the selection off-screen.
			{/snippet}
			<Card.Root class="mx-auto w-fit max-w-[300px] gap-0 py-0">
				<Card.Content class="p-3">
					<!-- `fixedWeeks` keeps five- and six-week months the same height, so the footer never jumps. -->
					<Calendar
						type="single"
						bind:value={footerDate}
						bind:placeholder={footerMonth}
						fixedWeeks
						class={pickerBody}
						day={dayChip}
					/>
				</Card.Content>
				<Card.Footer class="flex flex-wrap gap-2 border-t p-3">
					{#each footerPresets as preset (preset.label)}
						<Button
							variant="outline"
							size="sm"
							class="flex-1"
							onclick={() => {
								const next = now.add({ days: preset.days });
								footerDate = next;
								footerMonth = startOfMonth(next);
							}}
						>
							{preset.label}
						</Button>
					{/each}
				</Card.Footer>
			</Card.Root>
		</DocSection>

		<DocSection title="Appointment calendar">
			{#snippet blurb()}
				The booking form: taken days struck out, quarter-hour slots, and a footer that reads the
				choice back. The three booked days are today and the two after it.
			{/snippet}
			<!--
				`w-fit` matters MORE here than on the other cards: the slot column is pinned to the
				content's right edge (`md:absolute right-0 w-48`), so on a full-width card the grid
				sits at the left, the hours at the far right, and the gap between them is the whole
				reading column. Hugging the content puts the column back beside the grid — the card
				is exactly grid + the `md:pr-48` reserved for the hours, which is the source's shape.
			-->
			<Card.Root class="w-fit max-w-full gap-0 overflow-hidden p-0">
				<Card.Header class="border-b px-4">
					<Card.Title>Book your appointment</Card.Title>
				</Card.Header>
				<Card.Content class="relative p-0 md:pr-48">
					<div class="p-4">
						<Calendar
							type="single"
							bind:value={appointmentDate}
							isDateDisabled={isBooked}
							disableDaysOutsideMonth
							class={cn(pickerBody, hideOutside, "w-fit p-0")}
							day={dayChip}
						/>
					</div>
					<div
						class="inset-y-0 right-0 flex w-full flex-col gap-4 border-t max-md:h-60 md:absolute md:w-48 md:border-t-0 md:border-l"
					>
						<div class="h-full overflow-y-auto">
							<div class="flex flex-col gap-2 p-4">
								{#each appointmentSlots as slot (slot)}
									<Button
										variant={appointmentTime === slot ? "default" : "outline"}
										class="w-full shadow-none"
										onclick={() => (appointmentTime = slot)}
									>
										{slot}
									</Button>
								{/each}
							</div>
						</div>
					</div>
				</Card.Content>
				<Card.Footer class="flex flex-col gap-4 border-t px-4 py-3 md:flex-row">
					<div class="flex max-w-64 items-center gap-2 text-sm">
						{#if appointmentDate && appointmentTime}
							<CircleCheckIcon class="size-4 shrink-0" />
							<span>
								Your meeting is booked for
								<span class="font-medium">{fmtBooking.format(at(appointmentDate))}</span>
								at <span class="font-medium">{appointmentTime}</span>
							</span>
						{:else}
							<span>Select a date and time for your meeting.</span>
						{/if}
					</div>
					<Button
						variant="outline"
						class="w-full md:ml-auto md:w-auto"
						disabled={!appointmentDate || !appointmentTime}
					>
						Confirm
					</Button>
				</Card.Footer>
			</Card.Root>
		</DocSection>

		<DocSection title="Display 2 months">
			{#snippet blurb()}
				<code class="text-[87.5%] text-primary">numberOfMonths</code> with a single selection:
				stacked below <code class="text-[87.5%] text-primary">md</code>, side by side above it.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="overflow-x-auto p-0">
					<Calendar
						type="single"
						bind:value={twoMonthsDate}
						numberOfMonths={2}
						class={pickerBody}
						day={dayChip}
					/>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Display 2 months with range picker">
			{#snippet blurb()}
				The same two grids selecting a range, side by side. Nothing is drawn between the months: the
				gap is the separation, so neither panel needs a rule that would have to be themed twice.
			{/snippet}
			<Card.Root class={fitCard}>
				<Card.Content class="overflow-x-auto p-0">
					<RangeCalendar
						bind:value={twoMonthRange}
						numberOfMonths={2}
						class={rangeCalendarFlush}
						day={rangeDayChip}
					/>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Calendar with event list">
			{#snippet blurb()}
				A narrow card with the day's events beneath the grid, each with its little-date-style time
				range. The selection is <code class="text-[87.5%] text-primary">required</code> — clicking
				the selected day again keeps it, via a function binding that refuses
				<code class="text-[87.5%] text-primary">undefined</code>.
			{/snippet}
			<Card.Root class="w-2xs py-4">
				<Card.Content class="px-4">
					<Calendar
						type="single"
						bind:value={() => eventDate, (value) => value && (eventDate = value)}
						class={cn(pickerBody, "mx-auto w-fit p-0 [--cell-size:36px]")}
						day={dayChip}
					/>
				</Card.Content>
				<Card.Footer class="flex flex-col items-start gap-3 border-t px-4 pt-3">
					<div class="flex w-full items-center justify-between px-1">
						<div class="text-sm font-medium">{fmtEventHeading.format(at(eventDate))}</div>
						<Button variant="ghost" size="icon-xs" title="Add Event">
							<PlusIcon />
							<span class="sr-only">Add Event</span>
						</Button>
					</div>
					<div class="flex w-full flex-col gap-2">
						{#each events as event (event.title)}
							<div
								class={cn(
									"relative rounded-md bg-muted p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full",
									event.accent,
								)}
							>
								<div class="font-medium">{event.title}</div>
								<div class="text-xs text-muted-foreground">{eventRange(event)}</div>
							</div>
						{/each}
					</div>
				</Card.Footer>
			</Card.Root>
		</DocSection>

		<DocSection title="Localize calendar">
			{#snippet blurb()}
				The locale is a prop: weekday and caption labels re-render in Chinese, and the title follows
				from the demo's own strings.
			{/snippet}
			<Card.Root class="w-fit">
				<Card.Header>
					<Card.Title>{localized[localeKey].title}</Card.Title>
					<Card.Action>
						<Select.Root
							type="single"
							value={localeKey}
							onValueChange={(value) => value && (localeKey = value as keyof typeof localized)}
						>
							<!--
								NO fixed width — a `w-[60px]` would be tempting. A fixed label works inside a
								`SelectValue` span the trigger clamps (`*:data-[slot=select-value]:line-clamp-1`),
								so 60px shows a truncated word; this theme's label is a bare text node — the
								shadcn-svelte trigger has no value wrapper — so it cannot shrink, and a fixed
								width narrower than the word pushes the chevron out of the button. The trigger's
								own `w-fit` hugs the label instead, which is how every other Select in this
								repository sizes itself (Transactions, CardsReportIssue).
							-->
							<Select.Trigger size="sm" aria-label="Select language">
								{localeKey === "zh" ? "Chinese" : "English"}
							</Select.Trigger>
							<Select.Content align="start">
								<Select.Item value="zh">Chinese</Select.Item>
								<Select.Item value="en">English</Select.Item>
							</Select.Content>
						</Select.Root>
					</Card.Action>
				</Card.Header>
				<Card.Content>
					<RangeCalendar
						bind:value={localeRange}
						bind:placeholder={localeMonth}
						locale={localized[localeKey].locale}
						class={rangeCalendarFlush}
						day={rangeDayChip}
					/>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Calendar with date picker">
			{#snippet blurb()}
				The plainest of the pickers: a form-control trigger and the grid in a popover, which is the
				shape a date field takes in a form rather than on a page of its own.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<Popover.Root bind:open={pickDateOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									class="{formControl} group/pick-date w-60 justify-between"
								>
									{@render pickerTrigger(
										pickDate ? fmtLong.format(at(pickDate)) : "Pick a date",
										!pickDate,
									)}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class={popoverPanel} align="start">
							<Calendar
								type="single"
								bind:value={pickDate}
								class={pickerDropdown}
								day={dayChip}
								onValueChange={() => (pickDateOpen = false)}
							/>
						</Popover.Content>
					</Popover.Root>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Calendar with date range picker">
			{#snippet blurb()}
				Two months in a popover behind a trigger that prints both ends. It does not close on a click
				— a range takes two, and closing on the first would make the second unreachable.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<Popover.Root bind:open={pickRangeOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									class="{formControl} group/pick-date w-60 justify-between"
								>
									{@render pickerTrigger(rangeLabel(pickRange), !pickRange.start)}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class={popoverPanel} align="start">
							<RangeCalendar
								bind:value={pickRange}
								numberOfMonths={2}
								class={rangeCalendarFlush}
								day={rangeDayChip}
							/>
						</Popover.Content>
					</Popover.Root>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Calendar with date picker and year view">
			{#snippet blurb()}
				The popover form of the drill-down: caption to years, year to months, month to the grid. The
				calendar is hidden rather than unmounted while the grids are up — on remount bits-ui
				re-seeds the placeholder from the value, which threw away the chosen month.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<Popover.Root bind:open={yearViewOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									class="{formControl} group/pick-date w-60 justify-between"
								>
									{@render pickerTrigger(
										yearViewDate ? fmtShort.format(at(yearViewDate)) : "Pick a date",
										!yearViewDate,
									)}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="{popoverPanel} w-[17.5rem]" align="start">
							<div class="flex items-center justify-between gap-1 p-3 pb-0">
								<!-- The label always steps one level OUT, which keeps the back path on the caption itself. -->
								<Button
									variant="ghost"
									size="sm"
									class="font-medium"
									onclick={() => {
										if (yearViewStep === "calendar") openYearStep();
										else if (yearViewStep === "months") yearViewStep = "years";
										else yearViewStep = "calendar";
									}}
								>
									{#if yearViewStep === "calendar"}
										{fmtMonthYear.format(at(yearViewMonth))}
									{:else if yearViewStep === "months"}
										{yearViewYear}
									{:else}
										{yearRange[0]} – {yearRange[yearRange.length - 1]}
									{/if}
									<ChevronDownIcon data-icon="inline-end" class="opacity-60" />
								</Button>
								{#if yearViewStep === "calendar"}
									<!-- Clamped to the same ±10-year window the year grid offers, as the
									     source's `startMonth`/`endMonth` clamp their nav. -->
									<div class="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label="Previous month"
											disabled={yearViewMonth.year === now.year - 10 && yearViewMonth.month === 1}
											onclick={() => (yearViewMonth = yearViewMonth.subtract({ months: 1 }))}
										>
											<ChevronLeftIcon />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label="Next month"
											disabled={yearViewMonth.year === now.year + 10 && yearViewMonth.month === 12}
											onclick={() => (yearViewMonth = yearViewMonth.add({ months: 1 }))}
										>
											<ChevronRightIcon />
										</Button>
									</div>
								{/if}
							</div>

							<div class:hidden={yearViewStep !== "calendar"}>
								<Calendar
									type="single"
									bind:value={yearViewDate}
									bind:placeholder={yearViewMonth}
									class={cn(pickerDropdown, "[&_[data-calendar-header]]:hidden [&_nav]:hidden")}
									day={dayChip}
									onValueChange={() => (yearViewOpen = false)}
								/>
							</div>

							{#if yearViewStep === "years"}
								<div class="grid max-h-64 grid-cols-4 gap-1 overflow-y-auto p-3">
									{#each yearRange as year (year)}
										<Button
											variant={year === yearViewMonth.year ? "default" : "ghost"}
											size="sm"
											onclick={() => {
												yearViewYear = year;
												yearViewStep = "months";
											}}
										>
											{year}
										</Button>
									{/each}
								</div>
							{:else if yearViewStep === "months"}
								<div class="grid grid-cols-3 gap-1 p-3">
									{#each monthNames as month, index (month)}
										<Button
											variant={yearViewYear === yearViewMonth.year &&
											index + 1 === yearViewMonth.month
												? "default"
												: "ghost"}
											size="sm"
											onclick={() => chooseMonth(index)}
										>
											{month}
										</Button>
									{/each}
								</div>
							{/if}
						</Popover.Content>
					</Popover.Root>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Calendar with date and appointment picker">
			{#snippet blurb()}
				"Preset time selection" hung off a trigger — same grid, same slot column.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<Popover.Root bind:open={pickerSlotOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<!-- The trigger shows the DATE only — the source never echoes the time slot. -->
								<Button
									{...props}
									variant="outline"
									class="{formControl} group/pick-date w-60 justify-between"
								>
									{@render pickerTrigger(fmtShort.format(at(pickerSlotDate)), false)}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class={popoverPanel} align="start">
							<div class="flex max-sm:flex-col">
								<!-- Guarded for the same reason as the inline form: the source swallows the deselect. -->
								<Calendar
									type="single"
									bind:value={
										() => pickerSlotDate,
										(value) => {
											if (value) {
												pickerSlotDate = value;
												pickerSlotTime = null;
											}
										}
									}
									minValue={now}
									class={cn(pickerBody, "w-fit")}
									day={dayChip}
								/>
								{@render timeColumn(
									pickerSlotDate,
									pickerSlotTime,
									(time) => (pickerSlotTime = time),
								)}
							</div>
						</Popover.Content>
					</Popover.Root>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Calendar with date picker and presets">
			{#snippet blurb()}
				The preset rail in a popover. A preset closes it — it is a complete answer — and so does
				picking a day.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<Popover.Root bind:open={pickerPresetOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									class="{formControl} group/pick-date w-60 justify-between"
								>
									{@render pickerTrigger(
										pickerPresetDate ? fmtShort.format(at(pickerPresetDate)) : "Pick a date",
										!pickerPresetDate,
									)}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class={popoverPanel} align="start">
							<div class="flex max-sm:flex-col">
								{@render presetRail((value) => {
									pickerPresetDate = value;
									pickerPresetMonth = value;
									pickerPresetOpen = false;
								})}
								<!-- Guarded, as its inline sibling is; the close-on-pick is this theme's
								     convention for single-date popovers, stated in the blurb. -->
								<Calendar
									type="single"
									bind:value={
										() => pickerPresetDate,
										(value) => {
											if (value) {
												pickerPresetDate = value;
												pickerPresetOpen = false;
											}
										}
									}
									bind:placeholder={pickerPresetMonth}
									maxValue={now}
									class={cn(pickerBody, "w-fit")}
									day={dayChip}
								/>
							</div>
						</Popover.Content>
					</Popover.Root>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Range calendar with date picker and presets">
			{#snippet blurb()}
				The eight periods and the grid, both in the popover. Shortcuts close it; day clicks do not,
				for the range picker's reason.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<Popover.Root bind:open={pickPresetOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									class="{formControl} group/pick-date w-60 justify-between"
								>
									{@render pickerTrigger(rangeLabel(pickPresetRange), !pickPresetRange.start)}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class={popoverPanel} align="start">
							<div class="flex max-sm:flex-col">
								{@render rangeRail((value) => {
									pickPresetRange = value;
									pickPresetMonth = value.end ?? now;
									pickPresetOpen = false;
								})}
								<RangeCalendar
									bind:value={pickPresetRange}
									bind:placeholder={pickPresetMonth}
									maxValue={now}
									class={rangeCalendarFlush}
									day={rangeDayChip}
								/>
							</div>
						</Popover.Content>
					</Popover.Root>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Calendar with date and time range picker">
			{#snippet blurb()}
				A day and the two ends of a meeting on it. Each time input is a
				<code class="text-[87.5%] text-primary">Label</code> over an
				<code class="text-[87.5%] text-primary">InputGroup</code>; the time fields are the
				browser's.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<Popover.Root bind:open={timeRangeOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									class="{formControl} group/pick-date w-60 justify-between"
								>
									{@render pickerTrigger(
										timeRangeDate ? fmtLong.format(at(timeRangeDate)) : "Pick a date and time",
										!timeRangeDate,
									)}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<!-- Padded, unlike the shared panel: this popover holds fields below the grid. -->
						<Popover.Content class="w-auto shadow-none ring-input" align="start">
							<Calendar
								type="single"
								bind:value={timeRangeDate}
								class={cn(pickerBody, "w-fit p-0")}
								day={dayChip}
							/>
							<Separator class="my-3" />
							<div class="grid grid-cols-2 gap-2.5">
								<div class="grid gap-1.5">
									<Label for="{uid}-time-from">Start Time</Label>
									<InputGroup.Root>
										<InputGroup.Input
											id="{uid}-time-from"
											type="time"
											step="1"
											value="10:30:00"
											class="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
										/>
										<InputGroup.Addon>
											<ClockIcon />
										</InputGroup.Addon>
									</InputGroup.Root>
								</div>
								<div class="grid gap-1.5">
									<Label for="{uid}-time-to">End Time</Label>
									<InputGroup.Root>
										<InputGroup.Input
											id="{uid}-time-to"
											type="time"
											step="1"
											value="12:30:00"
											class="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
										/>
										<InputGroup.Addon>
											<ClockIcon />
										</InputGroup.Addon>
									</InputGroup.Root>
								</div>
							</div>
						</Popover.Content>
					</Popover.Root>
				</Card.Content>
			</Card.Root>
		</DocSection>
	</div>
</DocPage>
