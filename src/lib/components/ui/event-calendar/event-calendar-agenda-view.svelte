<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	/**
	 * The agenda window length is the agendaDayCount SETTING (the engine derives visibleRange
	 * from it); a per-view prop here would silently disagree with that setting.
	 */
	export type EventCalendarAgendaViewProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import { format } from "date-fns";

	import { IconStack } from "$lib/components/ui/icon-stack/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

	import EventCalendarEvent from "./event-calendar-event.svelte";
	import { listRangeDays, toZoned } from "./event-calendar-lib.js";
	import {
		getEventCalendarContext,
		getEventCalendarViewConfig,
		setEventCalendarViewContext,
	} from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: EventCalendarAgendaViewProps = $props();

	const root = getEventCalendarContext("<EventCalendarAgendaView>");
	const viewConfig = getEventCalendarViewConfig();
	setEventCalendarViewContext({ view: "agenda" });

	// Chronological day groups, empty days dropped; each group lists bars first, then timed
	// rows in start order (the buckets are already sorted by the index).
	const groups = $derived(
		listRangeDays(root.visibleRange, root.timeZone)
			.map((day) => {
				const bucket = root.dayBucket(day);
				return { day, items: [...bucket.allDay, ...bucket.timed] };
			})
			.filter((group) => group.items.length > 0),
	);

	const native = $derived(viewConfig.scrollbars === "native");
	const rangeLabel = $derived(
		root.i18n.functions.formatDayRange(root.visibleRange, { locale: root.locale }),
	);
</script>

{#snippet body()}
	{#if groups.length === 0}
		<div
			data-slot="event-calendar-no-events"
			class={cn(
				"flex min-h-72 flex-col items-center justify-center gap-4 py-16",
				viewConfig.classNames?.noEvents,
			)}
		>
			{#if viewConfig.renderNoEvents}
				{@render viewConfig.renderNoEvents()}
			{:else}
				<IconStack>
					<CalendarIcon class="size-5" aria-hidden="true" />
				</IconStack>
				<span class="text-sm text-muted-foreground">{root.i18n.labels.noEvents}</span>
			{/if}
		</div>
	{:else}
		<!-- Drop the very last row's bottom border so it does not double up with the calendar
		     container's own bottom border. Targets the last day group's last child (its last
		     agenda item); per-item border-b is kept everywhere else. -->
		<div class="flex flex-col [&>*:last-child>*:last-child]:border-b-0">
			{#each groups as { day, items } (day.getTime())}
				{@const zoned = toZoned(day, root.timeZone)}
				{@const weekday = format(zoned, root.i18n.formats.agendaWeekday, { locale: root.locale })}
				{@const dayDate = format(zoned, root.i18n.formats.agendaDayDate, { locale: root.locale })}
				{@const isToday = root.isTodayDay(day)}
				<!-- A named group per day so a screen reader can step day by day (and hear how
				     full one is) instead of arrowing every row. -->
				<div
					data-slot="event-calendar-agenda-day"
					data-today={isToday || undefined}
					role="group"
					aria-label="{weekday}, {dayDate}, {root.i18n.labels.events(items.length)}"
					class={viewConfig.classNames?.agendaDay}
				>
					<!-- Group header: weekday (leading) + full date (trailing). The day bar is the
					     agenda's only structure, so give it a heading level: the H key and the
					     rotor can jump between days, which is the whole point of a long agenda. -->
					<div
						data-slot="event-calendar-agenda-day-header"
						role="heading"
						aria-level={3}
						class={cn(
							"sticky top-0 z-10 flex items-baseline justify-between gap-4 border-b bg-muted/60 px-4 py-2",
							// The custom ScrollArea's overlay scrollbar (w-2.5 = 10px) is painted
							// UNDER this sticky, z-10, opaque header, so the thumb vanishes behind
							// the day bar at the top of the view. Inset the header by the scrollbar
							// lane so its background stops before the scrollbar instead of covering
							// it. Native scrollbars already sit outside the content box.
							!native && "me-2.5",
							viewConfig.classNames?.agendaDayHeader,
						)}
					>
						<span class={cn("font-semibold text-foreground", isToday && "text-primary")}>
							{weekday}
						</span>
						<span class="font-medium text-muted-foreground tabular-nums">{dayDate}</span>
					</div>
					{#each items as segment (segment.occurrence.key)}
						<!-- One agenda row: full-width table row - time column, color dot, title
						     (all replaceable via renderAgendaEvent). Read-only list: hover only,
						     no selected/focused styling on click. -->
						<EventCalendarEvent
							{segment}
							class={cn(
								"gap-3 rounded-none border-b px-4 py-2.5 transition-colors hover:bg-accent/40",
								viewConfig.classNames?.agendaItem,
							)}
						/>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
{/snippet}

<!-- Unlike the grid views the agenda has no row/column semantics to carry a name, so label the
     region with the day range it covers - through formatDayRange, so a consumer override
     reaches it. -->
<div
	bind:this={ref}
	data-slot="event-calendar-agenda-view"
	data-view="agenda"
	role="group"
	aria-label={rangeLabel}
	{...restProps}
	class={cn(
		"flex min-h-0 flex-1 flex-col overflow-hidden border-t",
		viewConfig.classNames?.agendaView,
		className,
	)}
>
	{#if native}
		<div data-slot="scroll-area-viewport" data-ec-native-scroll="" class="h-full overflow-y-auto">
			{@render body()}
		</div>
	{:else}
		<ScrollArea class="h-full">
			{@render body()}
		</ScrollArea>
	{/if}
</div>
