<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type EventCalendarMonthViewProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		maxEventsPerCell?: number | "auto";
	};
</script>

<script lang="ts">
	import { format } from "date-fns";

	import EventCalendarMonthWeek from "./event-calendar-month-week.svelte";
	import { getDayKey, listRangeDays, toZoned } from "./event-calendar-lib.js";
	import {
		getEventCalendarContext,
		getEventCalendarViewConfig,
		resolveEffectiveViewSettings,
		setEventCalendarViewContext,
	} from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		maxEventsPerCell,
		...restProps
	}: EventCalendarMonthViewProps = $props();

	const root = getEventCalendarContext("<EventCalendarMonthView>");
	const viewConfig = getEventCalendarViewConfig();
	setEventCalendarViewContext({ view: "month" });

	const effective = $derived(resolveEffectiveViewSettings(root, viewConfig));

	const weeks = $derived.by(() => {
		const days = listRangeDays(root.visibleRange, root.timeZone);
		const rows: Date[][] = [];
		for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
		if (effective.weekends) return rows;
		return rows.map((row) =>
			row.filter((day) => !root.weekendDays.includes(toZoned(day, root.timeZone).getDay())),
		);
	});

	const headerDays = $derived(weeks[0] ?? []);
	const title = $derived(
		root.i18n.functions.formatTitle("month", {
			date: toZoned(root.date, root.timeZone),
			activeRange: root.activeRange,
			visibleRange: root.visibleRange,
			locale: root.locale,
		}),
	);

	const gridTemplateColumns = $derived(
		`${effective.weekNumbers ? "var(--ec-week-number-w, 2.75rem) " : ""}repeat(${headerDays.length}, minmax(0, 1fr))`,
	);
	const cap = $derived(maxEventsPerCell ?? viewConfig.maxEventsPerCell);
	const contained = $derived(viewConfig.scrollMode !== "page");

	// "auto" fits as many event rows as the cell height allows and rolls the rest into "+N more".
	// Only the contained mode gives a cell a bounded height to measure; page mode grows to fit,
	// so "auto" there keeps the fixed fallback.
	const autoFit = $derived(cap === "auto" && contained);
	let slotProbe: HTMLDivElement | null = $state(null);
	let autoCap: number | null = $state(null);

	$effect(() => {
		if (!autoFit || !ref || !slotProbe) {
			autoCap = null;
			return;
		}
		// re-observe the first cell after a re-layout (row count or month change)
		void weeks.length;
		void root.date;
		// slotProbe resolves the event-row height (--ec-month-bar-h) to px, honoring the current
		// font size and any consumer override; the probed content area is the first cell's flex-1
		// content box, whose height is the event space per cell.
		const content = ref.querySelector<HTMLElement>("[data-slot=event-calendar-month-cell-content]");
		if (!content || typeof ResizeObserver === "undefined") return;
		const probe = slotProbe;
		const measure = () => {
			const laneH = probe.getBoundingClientRect().height;
			if (laneH <= 0) return;
			const cs = getComputedStyle(content);
			const inner = content.clientHeight - (parseFloat(cs.paddingTop) || 0);
			const gap = parseFloat(cs.rowGap) || 0;
			// N rows occupy N*laneH - gap (the last row has no trailing gap)
			autoCap = Math.max(1, Math.floor((inner + gap) / laneH));
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(content);
		return () => observer.disconnect();
	});
	const resolvedCap = $derived(cap === "auto" ? (autoFit ? (autoCap ?? 3) : 3) : cap);
</script>

<div
	bind:this={ref}
	data-slot="event-calendar-month-view"
	data-view="month"
	role="grid"
	aria-label={title}
	{...restProps}
	class={cn(
		"flex flex-col border-t",
		contained && "min-h-0 flex-1 overflow-hidden",
		viewConfig.classNames?.monthView,
		className,
	)}
>
	<div
		role="row"
		data-slot="event-calendar-month-header"
		class={cn("@container grid border-b", viewConfig.classNames?.monthHeader)}
		style="grid-template-columns: {gridTemplateColumns}"
	>
		{#if effective.weekNumbers}
			<div
				role="columnheader"
				aria-hidden="true"
				class={cn("border-e px-2 py-1.5", viewConfig.classNames?.weekNumber)}
			></div>
		{/if}
		{#each headerDays as day (day.getTime())}
			<div
				role="columnheader"
				class={cn(
					"truncate px-2 py-1.5 font-medium text-muted-foreground",
					viewConfig.classNames?.monthDayHeader,
				)}
			>
				{#if viewConfig.renderDayHeader}
					{@render viewConfig.renderDayHeader({
						day,
						view: "month",
						isToday: getDayKey(day, root.timeZone) === getDayKey(new Date(), root.timeZone),
					})}
				{:else}
					<span class="@max-[36rem]:hidden">
						{format(toZoned(day, root.timeZone), root.i18n.formats.monthDayHeader, {
							locale: root.locale,
						})}
					</span>
					<span class="hidden @max-[36rem]:inline">
						{format(toZoned(day, root.timeZone), root.i18n.formats.monthDayHeaderNarrow, {
							locale: root.locale,
						})}
					</span>
				{/if}
			</div>
		{/each}
	</div>
	<div
		data-slot="event-calendar-month-body"
		class={cn("grid", contained && "min-h-0 flex-1", viewConfig.classNames?.monthBody)}
		style="grid-template-rows: {contained
			? `repeat(${weeks.length}, minmax(0, 1fr))`
			: `repeat(${weeks.length}, minmax(var(--ec-month-row-min-h, 8rem), auto))`}"
	>
		{#each weeks as week, rowIndex (rowIndex)}
			<EventCalendarMonthWeek
				{week}
				{gridTemplateColumns}
				showWeekNumber={effective.weekNumbers}
				cap={resolvedCap}
				{autoFit}
			/>
		{/each}
	</div>
	{#if autoFit}
		<div
			bind:this={slotProbe}
			aria-hidden="true"
			class="pointer-events-none invisible absolute h-[var(--ec-month-bar-h,1.75rem)] w-0"
		></div>
	{/if}
</div>
