<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	import type { CalendarView } from "./event-calendar-types.js";

	export type EventCalendarTimeGridProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** The week/day/N-days views share this one grid, parameterized by view. */
		view: Extract<CalendarView, "week" | "day" | "days">;
		/** Per-view bounds override; defaults to the calendar-wide dayStartHour/dayEndHour. */
		dayStartHour?: number;
		dayEndHour?: number;
		/** Render the all-day row above the timed track. */
		showAllDay?: boolean;
		/** Gutter/gridline interval in minutes; defaults to the `interval` view config. */
		interval?: number;
	};
</script>

<script lang="ts">
	import { format } from "date-fns";

	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

	import EventCalendarAllDayBars from "./event-calendar-all-day-bars.svelte";
	import EventCalendarDayColumn from "./event-calendar-day-column.svelte";
	import EventCalendarNowIndicator from "./event-calendar-now-indicator.svelte";
	import EventCalendarTimeGutter from "./event-calendar-time-gutter.svelte";
	import { listRangeDays, toZoned } from "./event-calendar-lib.js";
	import {
		getEventCalendarContext,
		getEventCalendarViewConfig,
		resolveEffectiveViewSettings,
		setEventCalendarViewContext,
	} from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		style,
		view,
		dayStartHour,
		dayEndHour,
		showAllDay = true,
		interval: intervalProp,
		...restProps
	}: EventCalendarTimeGridProps = $props();

	const root = getEventCalendarContext("<EventCalendarTimeGrid>");
	const viewConfig = getEventCalendarViewConfig();
	// Getter-backed: the content switchboard keeps ONE time-grid instance alive across
	// week <-> day <-> N-days changes, so the context must follow the prop.
	setEventCalendarViewContext({
		get view() {
			return view;
		},
	});

	const effective = $derived(resolveEffectiveViewSettings(root, viewConfig));
	const startHour = $derived(dayStartHour ?? root.dayStartHour);
	const endHour = $derived(dayEndHour ?? root.dayEndHour);
	const interval = $derived(Math.min(Math.max(intervalProp ?? viewConfig.interval, 5), 240));
	const contained = $derived(viewConfig.scrollMode !== "page");

	const days = $derived.by(() => {
		const result = listRangeDays(root.visibleRange, root.timeZone);
		if (effective.weekends || view === "day") return result;
		// Same weekend definition the month view filters on, so the toggle cannot hide one set
		// of days here and another one there.
		const filtered = result.filter(
			(day) => !root.weekendDays.includes(toZoned(day, root.timeZone).getDay()),
		);
		// A short N-days window landing entirely on the weekend would otherwise filter to
		// nothing and emit an invalid repeat(0, ...) track.
		return filtered.length ? filtered : result;
	});

	// Gutter slots in minutes from the zoned day start
	const slots = $derived.by(() => {
		const result: number[] = [];
		for (let m = startHour * 60; m < endHour * 60; m += interval) result.push(m);
		return result;
	});

	const gridTemplateColumns = $derived(
		`repeat(${days.length}, minmax(var(--ec-day-col-min,0px), 1fr))`,
	);

	// Initial scroll to scrollToHour + api.scrollToTime registration (contained mode only:
	// page mode has no internal viewport to scroll), the original source.
	let scrollEl: HTMLDivElement | null = $state(null);
	$effect(() => {
		if (!contained || !scrollEl) return;
		// custom <-> native swaps the scroller DOM: re-bind the viewport, the scroll wiring,
		// and the measured --ec-scrollbar-w
		void viewConfig.scrollbars;
		const viewport = scrollEl.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
		// Measure a rendered slot row - the CSS var is in rem, rects are in px.
		const slotRow = scrollEl.querySelector<HTMLElement>(
			"[data-slot=event-calendar-time-gutter] > div",
		);
		const slotPx = slotRow?.getBoundingClientRect().height || 64;
		const pxPerMinute = slotPx / interval;
		const timeZone = root.timeZone;
		const baseMin = startHour * 60;
		const scrollTo = (minutes: number) => {
			// keep the hour label above the target line visible (it hangs -top-2)
			viewport?.scrollTo({ top: Math.max(0, (minutes - baseMin) * pxPerMinute - 12) });
		};
		scrollTo(viewConfig.scrollToHour * 60);
		root.registerScrollHandler((time) => {
			const minutes =
				typeof time === "number"
					? time
					: toZoned(time, timeZone).getHours() * 60 + toZoned(time, timeZone).getMinutes();
			scrollTo(minutes);
		});
		// Classic (width-consuming) scrollbars squeeze the scrolling track while the
		// header/all-day rows outside keep full width, drifting the column borders. Mirror the
		// measured gutter onto those rows via a CSS var - 0px for overlay scrollbars and the
		// custom ScrollArea, so both modes lay out identically.
		const rootEl = ref;
		const syncScrollbarGutter = () => {
			rootEl?.style.setProperty(
				"--ec-scrollbar-w",
				`${viewport ? viewport.offsetWidth - viewport.clientWidth : 0}px`,
			);
		};
		syncScrollbarGutter();
		const observer =
			viewport && typeof ResizeObserver !== "undefined"
				? new ResizeObserver(syncScrollbarGutter)
				: null;
		if (viewport) observer?.observe(viewport);
		return () => {
			root.registerScrollHandler(null);
			observer?.disconnect();
		};
	});
</script>

{#snippet track()}
	<div class="relative flex">
		<EventCalendarTimeGutter referenceDay={days[0]} {slots} {startHour} {interval} />
		<div class="grid min-w-0 flex-1" style="grid-template-columns: {gridTemplateColumns}">
			{#each days as day (day.getTime())}
				<EventCalendarDayColumn {day} {startHour} {endHour} {interval} />
			{/each}
		</div>
		{#if effective.nowIndicator}
			<EventCalendarNowIndicator {days} {startHour} {endHour} />
		{/if}
	</div>
{/snippet}

<div
	bind:this={ref}
	data-slot="event-calendar-time-grid"
	data-view={view}
	{...restProps}
	class={cn(
		"flex flex-col border-t",
		contained && "min-h-0 flex-1 overflow-hidden",
		viewConfig.classNames?.timeGrid,
		className,
	)}
	style="--ec-hour-height: 4rem;{style ?? ''}"
>
	<!-- Day-header row (sticky below the nav in page scroll mode) -->
	<div
		class={cn(
			"flex border-b pe-(--ec-scrollbar-w,0px)",
			!contained && "sticky top-(--ec-sticky-offset,0px) z-20 bg-background",
			viewConfig.classNames?.timeGridHeader,
		)}
	>
		<div class="w-(--ec-gutter-width,4.5rem) shrink-0 border-e"></div>
		<div class="grid min-w-0 flex-1" style="grid-template-columns: {gridTemplateColumns}">
			{#each days as day (day.getTime())}
				{@const isToday = root.isTodayDay(day)}
				<div
					data-slot="event-calendar-day-header"
					data-today={isToday || undefined}
					class={cn(
						"min-w-0 truncate border-e px-2 py-1.5 font-medium last:border-e-0 data-today:text-primary",
						isToday && viewConfig.todayClassName,
					)}
				>
					{#if viewConfig.renderDayHeader}
						{@render viewConfig.renderDayHeader({ day, view, isToday })}
					{:else}
						{format(toZoned(day, root.timeZone), root.i18n.formats.timeGridDayHeader, {
							locale: root.locale,
						})}
					{/if}
				</div>
			{/each}
		</div>
	</div>
	<!-- All-day row -->
	{#if showAllDay}
		<div
			data-slot="event-calendar-all-day-section"
			class={cn("flex border-b pe-(--ec-scrollbar-w,0px)", viewConfig.classNames?.allDaySection)}
		>
			<div
				class={cn(
					// pt-1.5 matches the bar overlay's top inset; the inner box is one bar-row tall
					// and centers the label so it sits on the SAME baseline as the first all-day
					// chip and stays top-aligned when the chips wrap onto more lanes
					"w-(--ec-gutter-width,4.5rem) shrink-0 border-e ps-2 pe-2.5 pt-1.5 text-muted-foreground",
					viewConfig.classNames?.allDayLabel,
				)}
			>
				<span
					class="flex h-[calc(var(--ec-month-bar-h,1.625rem)-0.125rem)] items-center justify-end"
				>
					{root.i18n.labels.allDay}
				</span>
			</div>
			<EventCalendarAllDayBars {days} {gridTemplateColumns} />
		</div>
	{/if}
	<!-- Time track: internal scroll (contained) or document flow (page) -->
	{#if contained}
		<div bind:this={scrollEl} class="min-h-0 flex-1">
			{#if viewConfig.scrollbars === "native"}
				<div
					data-slot="scroll-area-viewport"
					data-ec-native-scroll=""
					class="h-full overflow-y-auto"
				>
					{@render track()}
				</div>
			{:else}
				<ScrollArea class="h-full">
					{@render track()}
				</ScrollArea>
			{/if}
		</div>
	{:else}
		{@render track()}
	{/if}
</div>
