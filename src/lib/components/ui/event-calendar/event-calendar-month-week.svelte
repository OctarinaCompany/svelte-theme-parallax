<script lang="ts" module>
	import { cn } from "$lib/utils.js";

	export type EventCalendarMonthWeekProps = {
		week: Date[];
		gridTemplateColumns: string;
		showWeekNumber: boolean;
		cap: number;
		autoFit: boolean;
	};
</script>

<script lang="ts">
	import { getWeek } from "date-fns";

	import EventCalendarEvent from "./event-calendar-event.svelte";
	import EventCalendarMonthCell from "./event-calendar-month-cell.svelte";
	import { toZoned, zonedStartOfDay } from "./event-calendar-lib.js";
	import type { EventCalendarSegment } from "./event-calendar-types.js";
	import { getEventCalendarContext, getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let { week, gridTemplateColumns, showWeekNumber, cap, autoFit }: EventCalendarMonthWeekProps =
		$props();

	const root = getEventCalendarContext("<EventCalendarMonthWeek>");
	const viewConfig = getEventCalendarViewConfig();

	const dayMs = 86400000;
	const row = $derived(root.weekRowFor(week[0]));
	const bars = $derived(row.bars);
	const colOffset = $derived(showWeekNumber ? 1 : 0);
	const rowStartMs = $derived(zonedStartOfDay(row.rowStart ?? week[0], root.timeZone).getTime());
	// Day offsets from the TRUE row start (0-6) for each visible column, so a weekends-hidden
	// month still places bars on the right days.
	const offsets = $derived(
		week.map((d) => Math.round((zonedStartOfDay(d, root.timeZone).getTime() - rowStartMs) / dayMs)),
	);

	/** Clamp a day-offset span onto the visible columns; null = fully hidden. */
	function gridPos(colStart: number, colSpan: number): { col: number; span: number } | null {
		let start = -1;
		let end = -1;
		for (let o = colStart; o < colStart + colSpan; o++) {
			const col = offsets.indexOf(o);
			if (col === -1) continue;
			if (start === -1) start = col;
			end = col;
		}
		return start === -1 ? null : { col: start, span: end - start + 1 };
	}

	// bars fit within the cap; deeper lanes fall into each day's "+N more"
	const visibleBars = $derived(bars.filter((b) => (b.lane ?? 0) < cap));
	function covers(b: EventCalendarSegment, dayOffset: number): boolean {
		return (b.colStart ?? 0) <= dayOffset && dayOffset < (b.colStart ?? 0) + (b.colSpan ?? 1);
	}
	// Occurrence keys of the bars hidden in each column (lane >= cap). Threaded to the cell so
	// its "+N more" popover can list the hidden bars WITHOUT re-listing the visible ones (day
	// buckets carry no lane, so the week row - which owns bar laning - is the only place that
	// knows which bars are hidden).
	const hiddenBarKeysByCol = $derived(
		week.map(
			(_, col) =>
				new Set(
					bars
						.filter((b) => (b.lane ?? 0) >= cap && covers(b, offsets[col]))
						.map((b) => b.occurrence.key),
				),
		),
	);
</script>

<div
	role="row"
	data-slot="event-calendar-month-row"
	class={cn("relative grid min-h-0 border-b last:border-b-0", viewConfig.classNames?.monthRow)}
	style="grid-template-columns: {gridTemplateColumns}"
>
	{#if showWeekNumber}
		<div
			role="rowheader"
			data-slot="event-calendar-week-number"
			class={cn(
				"border-e px-2 pt-1 text-muted-foreground tabular-nums",
				viewConfig.classNames?.weekNumber,
			)}
		>
			{root.i18n.labels.week(
				getWeek(toZoned(week[0], root.timeZone), {
					// locale supplies firstWeekContainsDate, so a de/ISO calendar numbers the
					// year-boundary weeks its own way instead of falling back to US numbering;
					// weekStartsOn stays explicit so the number keeps matching the rendered grid
					locale: root.locale,
					weekStartsOn: root.weekStartsOn,
				}),
			)}
		</div>
	{/if}
	{#each week as day, col (day.getTime())}
		<EventCalendarMonthCell
			{day}
			{cap}
			reservedLanes={visibleBars.reduce(
				(max, b) => (covers(b, offsets[col]) ? Math.max(max, (b.lane ?? 0) + 1) : max),
				0,
			)}
			hiddenBarKeys={hiddenBarKeysByCol[col]}
			isLast={col === week.length - 1}
			{autoFit}
		/>
	{/each}
	<!-- Continuous bar overlay: one element per bar, placed by grid-column so a cross-day span
	     is a single unbroken block. pointer-events pass through the gaps to the cells below.
	     NOT aria-hidden - these are the real interactive bars. -->
	{#if visibleBars.length > 0}
		<div
			data-slot="event-calendar-month-bar-overlay"
			class={cn(
				"pointer-events-none absolute inset-x-0 top-0 z-10 grid pt-1.5",
				viewConfig.classNames?.monthBarOverlay,
			)}
			style="grid-template-columns: {gridTemplateColumns}; grid-auto-rows: var(--ec-month-bar-h, 1.75rem)"
		>
			{#each visibleBars as bar (bar.occurrence.key)}
				{@const pos = gridPos(bar.colStart ?? 0, bar.colSpan ?? 1)}
				{#if pos}
					<div
						class={cn("pointer-events-auto min-w-0 px-1", viewConfig.classNames?.monthBar)}
						style="grid-column: {colOffset + pos.col + 1} / span {pos.span}; grid-row: {(bar.lane ??
							0) + 1}"
					>
						<!-- lane height minus the 2px inter-lane gap -->
						<EventCalendarEvent
							segment={bar}
							class="h-[calc(var(--ec-month-bar-h,1.75rem)-0.125rem)]"
						/>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
