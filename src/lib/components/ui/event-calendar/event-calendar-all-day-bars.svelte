<script lang="ts" module>
	import { cn } from "$lib/utils.js";

	export type EventCalendarAllDayBarsProps = {
		days: Date[];
		gridTemplateColumns: string;
	};
</script>

<script lang="ts">
	import { addDays } from "date-fns";

	import EventCalendarEvent from "./event-calendar-event.svelte";
	import { getDayKey, resolveOffDay, toZoned, zonedStartOfDay } from "./event-calendar-lib.js";
	import type { EventCalendarSegment } from "./event-calendar-types.js";
	import {
		getEventCalendarContext,
		getEventCalendarViewConfig,
		getEventCalendarViewContext,
		offDayClassName,
		resolveEffectiveViewSettings,
		resolveOffDayConfig,
		wasRecentChipPress,
		wasRecentDrag,
	} from "./event-calendar.svelte.js";

	let { days, gridTemplateColumns }: EventCalendarAllDayBarsProps = $props();

	const root = getEventCalendarContext("<EventCalendarAllDayBars>");
	const viewConfig = getEventCalendarViewConfig();
	const viewCtx = getEventCalendarViewContext();
	const effective = $derived(resolveEffectiveViewSettings(root, viewConfig));

	/**
	 * Continuous all-day bars: consecutive-day segments of one occurrence merge into a single bar
	 * spanning its columns (same treatment as the month view), lane-packed. Clones only - the
	 * shared per-day segments must stay pristine.
	 */
	const packed = $derived.by(() => {
		type Bar = {
			seg: EventCalendarSegment;
			colStart: number;
			colEnd: number;
			isStart: boolean;
			isEnd: boolean;
			lane: number;
		};
		const merged = new Map<string, Bar>();
		days.forEach((day, col) => {
			for (const seg of root.dayBucket(day).allDay) {
				const key = seg.occurrence.key;
				const bar = merged.get(key);
				if (bar) {
					bar.colEnd = col;
					bar.isEnd = seg.isEnd;
				} else {
					merged.set(key, {
						seg,
						colStart: col,
						colEnd: col,
						isStart: seg.isStart,
						isEnd: seg.isEnd,
						lane: 0,
					});
				}
			}
		});
		const sorted = Array.from(merged.values()).sort(
			(a, b) =>
				a.colStart - b.colStart ||
				b.colEnd - b.colStart - (a.colEnd - a.colStart) ||
				a.seg.occurrence.key.localeCompare(b.seg.occurrence.key),
		);
		const lanes: boolean[][] = [];
		for (const bar of sorted) {
			let lane = 0;
			for (;;) {
				lanes[lane] ??= new Array(days.length).fill(false);
				let free = true;
				for (let c = bar.colStart; c <= bar.colEnd; c++) {
					if (lanes[lane][c]) {
						free = false;
						break;
					}
				}
				if (free) break;
				lane++;
			}
			for (let c = bar.colStart; c <= bar.colEnd; c++) lanes[lane][c] = true;
			bar.lane = lane;
		}
		return {
			bars: sorted.map((bar): EventCalendarSegment => ({
				...bar.seg,
				isStart: bar.isStart,
				isEnd: bar.isEnd,
				continuesBefore: !bar.isStart,
				continuesAfter: !bar.isEnd,
				colStart: bar.colStart,
				colSpan: bar.colEnd - bar.colStart + 1,
				lane: bar.lane,
			})),
			laneCount: lanes.length,
		};
	});

	function draftFor(day: Date): boolean {
		const draft = root.slotDraft;
		if (!draft || !draft.allDay) return false;
		const dayStart = zonedStartOfDay(day, root.timeZone);
		const dayEnd = addDays(toZoned(dayStart, root.timeZone), 1);
		return draft.start < dayEnd && draft.end > dayStart;
	}
</script>

<div class="relative min-w-0 flex-1">
	<div
		class="grid h-full"
		style="grid-template-columns: {gridTemplateColumns}; min-height: calc({Math.max(
			packed.laneCount,
			1,
		)} * var(--ec-month-bar-h, 1.625rem) + 0.625rem)"
	>
		{#each days as day (day.getTime())}
			{@const dayStart = zonedStartOfDay(day, root.timeZone)}
			{@const isOff = resolveOffDay(
				day,
				root.timeZone,
				resolveOffDayConfig(effective.offDays, viewConfig.offDays),
				root.weekendDays,
			)}
			<!-- Pointer-only by design, like upstream: clicking/dragging empty all-day space is a
			     mouse shortcut for slot creation; keyboard flows go through the chips and the
			     consumer's own creation UI (svelte-ignore below, not a missing handler). -->
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				data-slot="event-calendar-all-day-cell"
				data-ec-day={dayStart.getTime()}
				data-off={isOff || undefined}
				class={cn(
					"relative flex min-w-0 flex-col gap-0.5 border-e px-1 py-1.5 last:border-e-0",
					isOff && offDayClassName(viewConfig.offDays),
					viewConfig.dayClassName?.(day),
					draftFor(day) && cn("bg-primary/10", viewConfig.classNames?.slotDraft),
					viewConfig.classNames?.allDayCell,
				)}
				onpointerdown={(e) => {
					if (e.target === e.currentTarget) root.beginCreate(e, day, true);
				}}
				onclick={(e) => {
					if (e.target === e.currentTarget && !wasRecentDrag() && !wasRecentChipPress()) {
						root.opts.onSlotClick?.({ date: dayStart, allDay: true, view: viewCtx.view }, e);
					}
				}}
			></div>
		{/each}
	</div>
	{#if packed.bars.length > 0}
		<div
			data-slot="event-calendar-all-day-bar-overlay"
			class="pointer-events-none absolute inset-x-0 top-0 grid pt-1.5"
			style="grid-template-columns: {gridTemplateColumns}; grid-auto-rows: var(--ec-month-bar-h, 1.625rem)"
		>
			{#each packed.bars as segment (segment.occurrence.key)}
				<div
					class={cn("pointer-events-auto min-w-0 px-1", viewConfig.classNames?.monthBar)}
					style="grid-column: {(segment.colStart ?? 0) + 1} / span {segment.colSpan ??
						1}; grid-row: {(segment.lane ?? 0) + 1}"
				>
					<EventCalendarEvent {segment} class="h-[calc(var(--ec-month-bar-h,1.625rem)-0.125rem)]" />
				</div>
			{/each}
		</div>
	{/if}
</div>
