<script lang="ts" module>
	import type { DateValue } from "@internationalized/date";

	import type { DateSelectorWeekStartsOn } from "./date-selector.svelte.js";

	export type DateSelectorDayPickerProps = {
		/** The first displayed month. Upstream `currentMonth`. */
		month: DateValue;
		/**
		 * Called whenever the calendar wants to move the view: keyboard navigation across a month
		 * boundary, or bits-ui pulling the view onto a fresh selection. Leave it unset to pin the
		 * view — external navigation through the `month` prop still works.
		 */
		onMonthChange?: (month: DateValue) => void;
		selectedDate?: DateValue;
		selectedEndDate?: DateValue;
		/**
		 * Whether the picker runs in range mode — the root passes
		 * `filterType === "between" && allowRange`.
		 * @default false
		 */
		isRange?: boolean;
		/** Called with the clicked day in single mode. */
		onDaySelect?: (day: DateValue) => void;
		/**
		 * Called with the resolved endpoints in range mode: `(start, undefined)` when a range is
		 * opened or restarted, `(start, end)` once it closes. bits-ui's `RangeCalendar` has already
		 * ordered the pair.
		 */
		onRangeSelect?: (start: DateValue | undefined, end: DateValue | undefined) => void;
		/**
		 * Whether two months render side by side on desktop. Below the mobile breakpoint the picker
		 * always collapses to one month, matching upstream's `useIsMobile` gate.
		 * @default true
		 */
		showTwoMonths?: boolean;
		/** The week's first day: `0` is Sunday. Defaults to bits-ui's Sunday start. */
		weekStartsOn?: DateSelectorWeekStartsOn;
		class?: string;
	};
</script>

<script lang="ts">
	import {
		Calendar as CalendarPrimitive,
		RangeCalendar as RangeCalendarPrimitive,
		type DateRange,
	} from "bits-ui";

	import * as Calendar from "$lib/components/ui/calendar/index.js";
	import * as RangeCalendar from "$lib/components/ui/range-calendar/index.js";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import { cn } from "$lib/utils.js";

	import { dateValueToDate, getDateSelectorContext } from "./date-selector.svelte.js";

	let {
		month,
		onMonthChange,
		selectedDate,
		selectedEndDate,
		isRange = false,
		onDaySelect,
		onRangeSelect,
		showTwoMonths = true,
		weekStartsOn,
		class: className,
	}: DateSelectorDayPickerProps = $props();

	const selector = getDateSelectorContext("<DateSelector.DayPicker>");

	const isMobile = new IsMobile();
	const numberOfMonths = $derived(isMobile.current ? 1 : showTwoMonths ? 2 : 1);

	const rangeValue: DateRange = $derived({ start: selectedDate, end: selectedEndDate });

	/**
	 * Upstream `formatWeekdayName`: head labels come from the
	 * i18n tables keyed by the JS Sunday-based day index, not from bits-ui's locale strings, so a
	 * custom i18n config controls the whole grid.
	 */
	function weekdayLabel(date: DateValue): string {
		const dayIndex = dateValueToDate(date).getDay();
		return selector.i18n.weekdaysShort[dayIndex] || selector.i18n.weekdays[dayIndex];
	}

	/**
	 * In range mode bits-ui only reports `value` once a range closes; opening or restarting one
	 * surfaces as a start-value change alone (range-calendar.svelte.js:214-254, bits-ui). This
	 * forwards exactly those, and the reference guard drops the echo bits-ui emits when the
	 * committed value flows back in through the `value` prop.
	 */
	function handleStartValueChange(start: DateValue | undefined) {
		if (!start || start === selectedDate) return;
		onRangeSelect?.(start, undefined);
	}

	// Upstream stretches its months row and hides the built-in nav
	// because the period tabs own month navigation; here the nav is simply never rendered. The
	// caption is plain text from the i18n month table — upstream `formatMonthCaption`
	// — rather than bits-ui's locale-driven heading.
	const rootClass = cn(
		"group/calendar w-full p-0 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(8)]",
	);
	const monthsClass = "w-full flex-row flex-wrap items-start justify-between gap-5";
	const monthClass = "min-w-0 flex-1 items-center";
</script>

<!--
	Port of upstream `DateSelectorDayPicker`. react-day-picker's
	one `Calendar` with a `mode` prop splits into bits-ui's two roots, so the branches below mirror
	upstream's own range/single fork. The hover preview upstream
	wires by hand through a custom `DayButton` is native to
	bits-ui's RangeCalendar and needs no code here.
-->
<div
	class={cn("flex w-full items-center justify-between", className)}
	data-slot="date-selector-day-picker"
>
	{#if isRange}
		<RangeCalendarPrimitive.Root
			value={rangeValue}
			onValueChange={(next) => onRangeSelect?.(next.start, next.end)}
			onStartValueChange={handleStartValueChange}
			placeholder={month}
			onPlaceholderChange={(next) => onMonthChange?.(next)}
			{numberOfMonths}
			{weekStartsOn}
			class={rootClass}
		>
			{#snippet children({ months })}
				<RangeCalendar.Months class={monthsClass}>
					{#each months as m (m.value)}
						<RangeCalendar.Month class={monthClass}>
							<RangeCalendar.Header>
								{selector.i18n.months[m.value.month - 1]}
								{m.value.year}
							</RangeCalendar.Header>
							<RangeCalendar.Grid>
								<RangeCalendar.GridHead>
									<RangeCalendar.GridRow class="select-none">
										{#each m.weeks[0] as headDate (headDate)}
											<RangeCalendar.HeadCell>{weekdayLabel(headDate)}</RangeCalendar.HeadCell>
										{/each}
									</RangeCalendar.GridRow>
								</RangeCalendar.GridHead>
								<RangeCalendar.GridBody>
									{#each m.weeks as weekDates (weekDates)}
										<RangeCalendar.GridRow class="mt-2 w-full">
											{#each weekDates as date (date)}
												<RangeCalendar.Cell {date} month={m.value}>
													<RangeCalendar.Day />
												</RangeCalendar.Cell>
											{/each}
										</RangeCalendar.GridRow>
									{/each}
								</RangeCalendar.GridBody>
							</RangeCalendar.Grid>
						</RangeCalendar.Month>
					{/each}
				</RangeCalendar.Months>
			{/snippet}
		</RangeCalendarPrimitive.Root>
	{:else}
		<CalendarPrimitive.Root
			type="single"
			value={selectedDate}
			onValueChange={(day) => {
				if (day) onDaySelect?.(day);
			}}
			preventDeselect
			placeholder={month}
			onPlaceholderChange={(next) => onMonthChange?.(next)}
			{numberOfMonths}
			{weekStartsOn}
			class={rootClass}
		>
			{#snippet children({ months })}
				<Calendar.Months class={monthsClass}>
					{#each months as m (m.value)}
						<Calendar.Month class={monthClass}>
							<Calendar.Header>
								{selector.i18n.months[m.value.month - 1]}
								{m.value.year}
							</Calendar.Header>
							<Calendar.Grid>
								<Calendar.GridHead>
									<Calendar.GridRow class="select-none">
										{#each m.weeks[0] as headDate (headDate)}
											<Calendar.HeadCell>{weekdayLabel(headDate)}</Calendar.HeadCell>
										{/each}
									</Calendar.GridRow>
								</Calendar.GridHead>
								<Calendar.GridBody>
									{#each m.weeks as weekDates (weekDates)}
										<Calendar.GridRow class="mt-2 w-full">
											{#each weekDates as date (date)}
												<Calendar.Cell {date} month={m.value}>
													<Calendar.Day />
												</Calendar.Cell>
											{/each}
										</Calendar.GridRow>
									{/each}
								</Calendar.GridBody>
							</Calendar.Grid>
						</Calendar.Month>
					{/each}
				</Calendar.Months>
			{/snippet}
		</CalendarPrimitive.Root>
	{/if}
</div>
