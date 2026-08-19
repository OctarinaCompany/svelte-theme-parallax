<script lang="ts" module>
	import { cn } from "$lib/utils.js";

	export type EventCalendarMonthCellProps = {
		day: Date;
		cap: number;
		/**
		 * Bar lanes passing through THIS cell, so a short multi-day event does not push down
		 * timed events in unrelated cells of the same row.
		 */
		reservedLanes: number;
		/**
		 * Occurrence keys of the bars hidden in THIS column (lane >= cap), from the week row.
		 * Lets the cell list hidden bars in its overflow popover without re-listing the bars
		 * already visible in the row overlay.
		 */
		hiddenBarKeys: Set<string>;
		/**
		 * Last column in the row - drops the right border so the grid's outer edge is owned by
		 * the container. Passed explicitly because the bar overlay renders after the cells, so
		 * `:last-child` is unreliable on rows that have bars.
		 */
		isLast: boolean;
		/**
		 * When true, the "+N more" chip is treated as taking a row so the visible chips +
		 * indicator always fit the measured cell height.
		 */
		autoFit: boolean;
	};
</script>

<script lang="ts">
	import PlusIcon from "@lucide/svelte/icons/plus";
	import { addDays, format } from "date-fns";

	import EventCalendarEvent from "./event-calendar-event.svelte";
	import EventCalendarMoreIndicator from "./event-calendar-more-indicator.svelte";
	import { resolveOffDay, toZoned, zonedStartOfDay } from "./event-calendar-lib.js";
	import {
		getEventCalendarContext,
		getEventCalendarViewConfig,
		offDayClassName,
		resolveEffectiveViewSettings,
		resolveOffDayConfig,
		wasRecentChipPress,
		wasRecentDrag,
	} from "./event-calendar.svelte.js";

	let { day, cap, reservedLanes, hiddenBarKeys, isLast, autoFit }: EventCalendarMonthCellProps =
		$props();

	const root = getEventCalendarContext("<EventCalendarMonthCell>");
	const viewConfig = getEventCalendarViewConfig();

	const segments = $derived(root.dayBucket(day));
	const isToday = $derived(root.isTodayDay(day));
	const isOutside = $derived(root.isOutsideDay(day));

	const dayStart = $derived(zonedStartOfDay(day, root.timeZone));
	const dayEnd = $derived(addDays(toZoned(dayStart, root.timeZone), 1));
	const effective = $derived(resolveEffectiveViewSettings(root, viewConfig));
	const isOff = $derived(
		resolveOffDay(
			day,
			root.timeZone,
			resolveOffDayConfig(effective.offDays, viewConfig.offDays),
			root.weekendDays,
		),
	);

	const inDraft = $derived.by(() => {
		const draft = root.slotDraft;
		if (!draft || !draft.allDay) return null;
		if (draft.start >= dayEnd || draft.end <= dayStart) return null;
		return { isStart: draft.start >= dayStart, isEnd: draft.end <= dayEnd };
	});

	// Bars (allDay/multi-day) are drawn by the week-row overlay; the cell renders only single-day
	// timed events, below the reserved bar lanes.
	const hiddenBarSegs = $derived(
		segments.allDay.filter((s) => hiddenBarKeys.has(s.occurrence.key)),
	);
	const timedSlots = $derived(Math.max(0, cap - reservedLanes));
	// The "+N more" popover carries ONLY the hidden events (hidden bars + timed past the cap),
	// never the chips already visible in the cell. autoFit gives up one timed row to the
	// indicator so the visible chips fit the clipped cell height.
	const overflowing = $derived(hiddenBarKeys.size > 0 || segments.timed.length > timedSlots);
	const shown = $derived(autoFit && overflowing ? Math.max(0, timedSlots - 1) : timedSlots);
	const visibleTimed = $derived(segments.timed.slice(0, shown));
	const overflowSegments = $derived([...hiddenBarSegs, ...segments.timed.slice(shown)]);

	function handlePointerDown(e: PointerEvent) {
		const target = e.target as HTMLElement;
		if (target.closest("[data-slot=event-calendar-event]")) return;
		if (target.closest("[data-slot=event-calendar-more]")) return;
		root.beginCreate(e, day, true);
	}

	function handleClick(e: MouseEvent) {
		if (wasRecentDrag() || wasRecentChipPress()) return;
		root.opts.onSlotClick?.({ date: day, allDay: true, view: "month" }, e);
	}
</script>

<!-- Pointer-only by design, like upstream: clicking empty cell space is a mouse shortcut for
     slot creation; the keyboard path is the day add button and the consumer's own UI. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	role="gridcell"
	tabindex="-1"
	data-slot="event-calendar-month-cell"
	data-today={isToday || undefined}
	data-outside={isOutside || undefined}
	data-weekend={root.weekendDays.includes(toZoned(day, root.timeZone).getDay()) || undefined}
	data-ec-day={dayStart.getTime()}
	data-off={isOff || undefined}
	data-draft={inDraft ? "" : undefined}
	aria-label={format(toZoned(day, root.timeZone), root.i18n.formats.monthCellAriaLabel, {
		locale: root.locale,
	})}
	class={cn(
		"group/ec-cell relative flex min-h-0 min-w-0 flex-col overflow-hidden",
		!isLast && "border-e",
		isOutside && !root.showOutsideDays && "invisible",
		isOff && offDayClassName(viewConfig.offDays),
		isToday &&
			cn("relative border-b-2 border-b-primary/40 bg-primary/3", viewConfig.todayClassName),
		viewConfig.dayClassName?.(day),
		inDraft && "bg-primary/5",
		viewConfig.classNames?.monthCell,
	)}
	onpointerdown={handlePointerDown}
	onclick={handleClick}
>
	{#if inDraft}
		<span
			aria-hidden="true"
			data-slot="event-calendar-slot-draft"
			class={cn(
				"pointer-events-none absolute inset-0 z-10 border-y border-dashed border-primary/40",
				inDraft.isStart && "border-s",
				inDraft.isEnd && "border-e",
				viewConfig.classNames?.slotDraft,
			)}
		></span>
	{/if}
	<div
		data-slot="event-calendar-month-cell-content"
		class={cn(
			// gap-0.5 pairs with the 0.125rem subtraction in the lane spacer below. px-1 matches
			// the all-day bar wrapper inset so single-day chips and multi-day bars line up on the
			// same left/right edge in a cell.
			"flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-1 pt-1.5",
			viewConfig.classNames?.monthCellContent,
		)}
	>
		{#if reservedLanes > 0}
			<div
				aria-hidden="true"
				class="shrink-0"
				style="height: calc({reservedLanes} * var(--ec-month-bar-h, 1.75rem) - 0.125rem)"
			></div>
		{/if}
		{#each visibleTimed as segment (segment.occurrence.key)}
			<!-- shrink-0 holds a fixed height like the all-day lane above; without it the chip
			     flex-shrinks to whatever room the cell has left -->
			<EventCalendarEvent {segment} class="shrink-0" />
		{/each}
		{#if overflowSegments.length > 0}
			<EventCalendarMoreIndicator
				{day}
				count={overflowSegments.length}
				segments={overflowSegments}
			/>
		{/if}
	</div>
	<!-- Day number + add affordance, bottom-right (Notion-style) -->
	<div
		class={cn(
			"flex items-center justify-end gap-1 px-2 pb-1.5",
			viewConfig.classNames?.monthCellFooter,
		)}
	>
		{#if viewConfig.showDayAddButton}
			<button
				type="button"
				data-slot="event-calendar-day-add"
				aria-label={root.i18n.labels.addEvent}
				class={cn(
					"flex size-5 cursor-pointer items-center justify-center rounded-sm bg-primary text-primary-foreground opacity-0 transition-opacity group-hover/ec-cell:opacity-100 focus-visible:opacity-100",
					viewConfig.classNames?.dayAddButton,
				)}
				onclick={(e) => {
					e.stopPropagation();
					root.opts.onSlotClick?.({ date: day, allDay: true, view: "month" }, e);
				}}
			>
				<PlusIcon class="size-3.5" aria-hidden="true" />
			</button>
		{/if}
		<span
			data-slot="event-calendar-month-day-number"
			class={cn(
				"flex size-5 items-center justify-center rounded-full",
				isOutside && "text-muted-foreground",
				// the filled circle already marks today; a lighter weight cancels the way white
				// digits on the filled circle read bolder than the dark-on-light numbers around them
				isToday && "bg-primary font-light text-primary-foreground",
				viewConfig.classNames?.monthDayNumber,
			)}
		>
			{format(toZoned(day, root.timeZone), root.i18n.formats.monthCellDay, {
				locale: root.locale,
			})}
		</span>
	</div>
</div>
