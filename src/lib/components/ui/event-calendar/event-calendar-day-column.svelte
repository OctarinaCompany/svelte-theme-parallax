<script lang="ts" module>
	import { cn } from "$lib/utils.js";

	export type EventCalendarDayColumnProps = {
		day: Date;
		startHour: number;
		endHour: number;
		interval: number;
		/** Restrict rendering + slot resolution to this resource (resource view columns). */
		resourceId?: string;
		/**
		 * Accessible name override; the resource view passes the resource title here (upstream's
		 * resource column labels itself, the original source).
		 */
		ariaLabel?: string;
	};
</script>

<script lang="ts">
	import { addMinutes, format } from "date-fns";

	import EventCalendarEvent from "./event-calendar-event.svelte";
	import {
		getDayTotalMinutes,
		packTimedSegments,
		resolveOffDay,
		snapMinutes,
		toZoned,
		zonedStartOfDay,
	} from "./event-calendar-lib.js";
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

	let { day, startHour, endHour, interval, resourceId, ariaLabel }: EventCalendarDayColumnProps =
		$props();

	const root = getEventCalendarContext("<EventCalendarDayColumn>");
	const viewConfig = getEventCalendarViewConfig();
	const viewCtx = getEventCalendarViewContext();

	let columnEl: HTMLDivElement | null = $state(null);

	const segments = $derived(root.dayBucket(day));
	const isToday = $derived(root.isTodayDay(day));
	const effective = $derived(resolveEffectiveViewSettings(root, viewConfig));
	const isOff = $derived(
		resolveOffDay(
			day,
			root.timeZone,
			resolveOffDayConfig(effective.offDays, viewConfig.offDays),
			root.weekendDays,
		),
	);

	const dayStart = $derived(zonedStartOfDay(day, root.timeZone));
	const totalMinutes = $derived(getDayTotalMinutes(day, root.timeZone));
	const boundsStartMin = $derived(startHour * 60);
	const boundsEndMin = $derived(Math.min(endHour * 60, totalMinutes));
	const boundsMinutes = $derived(Math.max(60, boundsEndMin - boundsStartMin));

	// Segments the day bounds clip away still occupy a column in the shared index's packing,
	// leaving a phantom empty half beside the first in-bounds chip. Repack the visible subset;
	// clones keep the shared index untouched. The
	// resource view additionally filters to its own column's events first.
	const packedTimed = $derived.by(() => {
		const visible = segments.timed.filter((segment) => {
			if (resourceId !== undefined && segment.occurrence.event.resourceId !== resourceId) {
				return false;
			}
			const startMin = Math.max(segment.startMin ?? 0, boundsStartMin);
			const endMin = Math.min(segment.endMin ?? startMin, boundsEndMin);
			return endMin > boundsStartMin && startMin < boundsEndMin;
		});
		if (resourceId === undefined && visible.length === segments.timed.length) {
			return segments.timed;
		}
		const clones = visible.map((segment) => ({ ...segment }) as EventCalendarSegment);
		packTimedSegments(clones);
		return clones;
	});

	const draftWindow = $derived.by((): [number, number] | null => {
		const draft = root.slotDraft;
		if (!draft || draft.allDay) return null;
		if (resourceId !== undefined && draft.resourceId !== resourceId) return null;
		const dayEndMs = dayStart.getTime() + totalMinutes * 60000;
		if (draft.start.getTime() >= dayEndMs || draft.end.getTime() <= dayStart.getTime()) return null;
		const from = Math.max((draft.start.getTime() - dayStart.getTime()) / 60000, boundsStartMin);
		const to = Math.min((draft.end.getTime() - dayStart.getTime()) / 60000, boundsEndMin);
		return to > from ? [from, to] : null;
	});

	function slotFromPointer(e: MouseEvent & { currentTarget: HTMLElement }): {
		date: Date;
		end: Date;
	} {
		const rect = e.currentTarget.getBoundingClientRect();
		const pxPerMinute = rect.height / boundsMinutes;
		const minutes = snapMinutes(
			boundsStartMin + (e.clientY - rect.top) / pxPerMinute,
			root.snapDuration,
		);
		const clamped = Math.min(Math.max(minutes, boundsStartMin), boundsEndMin - root.slotDuration);
		return {
			date: addMinutes(dayStart, clamped),
			end: addMinutes(dayStart, clamped + root.slotDuration),
		};
	}
</script>

<!-- Pointer-only by design, like upstream: pressing/dragging empty column space is a mouse
     shortcut for slot creation; keyboard flows go through the chips and the consumer's own
     creation UI. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<div
	bind:this={columnEl}
	data-slot="event-calendar-day-column"
	data-today={isToday || undefined}
	data-off={isOff || undefined}
	data-ec-day={dayStart.getTime()}
	data-ec-bounds-start={boundsStartMin}
	data-ec-bounds-end={boundsEndMin}
	data-ec-resource={resourceId}
	role="group"
	aria-label={ariaLabel ??
		(resourceId !== undefined
			? undefined
			: format(toZoned(day, root.timeZone), root.i18n.formats.dayAria, { locale: root.locale }))}
	class={cn(
		"relative min-w-0 border-e last:border-e-0",
		isOff && offDayClassName(viewConfig.offDays),
		// the time grid keeps today's column on the normal background (the header marks today);
		// only a consumer todayClassName can tint it
		isToday && viewConfig.todayClassName,
		viewConfig.dayClassName?.(day),
		viewConfig.classNames?.dayColumn,
	)}
	style="height: calc(var(--ec-hour-height) * {boundsMinutes /
		60}); background-image: repeating-linear-gradient(to bottom, transparent, transparent calc(var(--ec-hour-height) * {interval /
		60} - var(--ec-slot-line-width, 1px)), var(--ec-slot-line-color, var(--color-border)) calc(var(--ec-hour-height) * {interval /
		60} - var(--ec-slot-line-width, 1px)), var(--ec-slot-line-color, var(--color-border)) calc(var(--ec-hour-height) * {interval /
		60}))"
	onpointerdown={(e) => {
		if (e.target === e.currentTarget && columnEl) {
			root.beginCreate(e, day, false, {
				resourceId,
				column: columnEl,
				boundsStartMin,
				boundsEndMin,
			});
		}
	}}
	onclick={(e) => {
		if (e.target !== e.currentTarget || wasRecentDrag() || wasRecentChipPress()) return;
		const slot = slotFromPointer(e);
		root.opts.onSlotClick?.({ ...slot, allDay: false, view: viewCtx.view, resourceId }, e);
	}}
>
	{#each packedTimed as segment (segment.occurrence.key)}
		{@const startMin = Math.max(segment.startMin ?? 0, boundsStartMin)}
		{@const endMin = Math.min(segment.endMin ?? startMin, boundsEndMin)}
		{#if endMin > boundsStartMin && startMin < boundsEndMin}
			{@const columnCount = segment.columnCount ?? 1}
			{@const column = segment.column ?? 0}
			{@const span = segment.columnSpan ?? 1}
			{@const colPct = 100 / columnCount}
			<!-- min-h keeps 15-min chips readable (Google-style: the block may slightly outgrow
			     its true window); hover raises a squeezed chip above its neighbors. Strict
			     side-by-side columns - no cascade overlap; the ring separates neighbors. -->
			<div
				class="absolute z-(--ec-z) min-h-(--ec-event-min-h,1.5rem) px-0.5 hover:z-40"
				style="top: calc(var(--ec-hour-height) * {(startMin - boundsStartMin) /
					60}); height: calc(var(--ec-hour-height) * {Math.max(
					(endMin - startMin) / 60,
					0.25,
				)}); left: {column * colPct}%; width: {span * colPct}%; --ec-z: {segment.occurrence.event
					.zIndex ?? 10 + column}"
			>
				<EventCalendarEvent
					{segment}
					class={cn(
						columnCount > 1 && "ring-1 ring-background",
						// short chips: single centered row, exact-fit line height so the title
						// never slices mid-glyph
						endMin - startMin < viewConfig.compactEventMinutes
							? "h-full gap-1 py-0 leading-4"
							: "h-full flex-col items-start justify-start gap-0 py-1",
						viewConfig.classNames?.timedChip,
					)}
				/>
			</div>
		{/if}
	{/each}
	<!-- Drag-create draft -->
	{#if draftWindow}
		<div
			data-slot="event-calendar-slot-draft"
			class={cn(
				"pointer-events-none absolute inset-x-0.5 z-40 rounded-sm border border-dashed border-primary/40 bg-primary/5",
				viewConfig.classNames?.slotDraft,
			)}
			style="top: calc(var(--ec-hour-height) * {(draftWindow[0] - boundsStartMin) /
				60}); height: calc(var(--ec-hour-height) * {Math.max(
				(draftWindow[1] - draftWindow[0]) / 60,
				0.25,
			)})"
		></div>
	{/if}
</div>
