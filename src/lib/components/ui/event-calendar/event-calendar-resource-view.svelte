<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type EventCalendarResourceViewProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Per-view bounds override; defaults to the calendar-wide dayStartHour/dayEndHour. */
		dayStartHour?: number;
		dayEndHour?: number;
		/** Render the per-resource all-day row above the timed track. */
		showAllDay?: boolean;
		/** Gutter/gridline interval in minutes; defaults to the `interval` view config. */
		interval?: number;
	};
</script>

<script lang="ts">
	import { addDays } from "date-fns";

	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

	import EventCalendarDayColumn from "./event-calendar-day-column.svelte";
	import EventCalendarEvent from "./event-calendar-event.svelte";
	import EventCalendarNowIndicator from "./event-calendar-now-indicator.svelte";
	import EventCalendarTimeGutter from "./event-calendar-time-gutter.svelte";
	import {
		flattenResources,
		resolveOffDay,
		toZoned,
		zonedStartOfDay,
	} from "./event-calendar-lib.js";
	import {
		getEventCalendarContext,
		getEventCalendarViewConfig,
		offDayClassName,
		resolveEffectiveViewSettings,
		resolveOffDayConfig,
		setEventCalendarViewContext,
		wasRecentChipPress,
		wasRecentDrag,
	} from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		style,
		dayStartHour,
		dayEndHour,
		showAllDay = true,
		interval: intervalProp,
		...restProps
	}: EventCalendarResourceViewProps = $props();

	const root = getEventCalendarContext("<EventCalendarResourceView>");
	const viewConfig = getEventCalendarViewConfig();
	setEventCalendarViewContext({ view: "resource" });

	const effective = $derived(resolveEffectiveViewSettings(root, viewConfig));
	const startHour = $derived(dayStartHour ?? root.dayStartHour);
	const endHour = $derived(dayEndHour ?? root.dayEndHour);
	const interval = $derived(Math.min(Math.max(intervalProp ?? viewConfig.interval, 5), 240));
	const contained = $derived(viewConfig.scrollMode !== "page");

	/** The single anchor day the resource columns book against. */
	const day = $derived(zonedStartOfDay(root.date, root.timeZone));

	// Leaf resources become booking columns; group parents only structure the config.
	const resources = $derived(
		flattenResources(root.resources)
			.filter(({ resource }) => !resource.children?.length)
			.map(({ resource }) => resource),
	);

	const slots = $derived.by(() => {
		const result: number[] = [];
		for (let m = startHour * 60; m < endHour * 60; m += interval) result.push(m);
		return result;
	});

	const gridTemplateColumns = $derived(
		`repeat(${resources.length || 1}, minmax(var(--ec-resource-col-min,8rem), 1fr))`,
	);

	const isOff = $derived(
		resolveOffDay(
			day,
			root.timeZone,
			resolveOffDayConfig(effective.offDays, viewConfig.offDays),
			root.weekendDays,
		),
	);
	const dayEnd = $derived(addDays(toZoned(day, root.timeZone), 1));

	/**
	 * Slot-draft highlight per all-day cell. The engine plumbs the pressed cell's resourceId
	 * into the draft (a Svelte-side improvement over upstream, whose all-day create branch
	 * dropped it and lit every resource cell together, the reference implementation
	 * event-calendar-resource-view.tsx:383-389); a draft without one still lights the whole row.
	 */
	function draftFor(resourceId: string): boolean {
		const draft = root.slotDraft;
		if (!draft || !draft.allDay) return false;
		if (draft.resourceId !== undefined && draft.resourceId !== resourceId) return false;
		return draft.start < dayEnd && draft.end > day;
	}

	// Initial scroll to scrollToHour + api.scrollToTime registration - the same contract as the
	// time grid.
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
		// Mirror the measured scrollbar lane onto the header/all-day rows via a CSS var so
		// classic (width-consuming) scrollbars cannot drift the column borders; 0px for overlay
		// scrollbars and the custom ScrollArea.
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
		<!-- shared gutter component, so classNames.timeGutter customizations apply here too -->
		<EventCalendarTimeGutter referenceDay={day} {slots} {startHour} {interval} />
		<div class="grid min-w-0 flex-1" style="grid-template-columns: {gridTemplateColumns}">
			{#each resources as resource (resource.id)}
				<!-- The day column already carries the whole resource contract: it filters and
				     repacks to its own resourceId, threads it through drag-create and slot
				     clicks, and stamps data-ec-resource (see its resourceId prop). -->
				<EventCalendarDayColumn
					{day}
					{startHour}
					{endHour}
					{interval}
					resourceId={resource.id}
					ariaLabel={resource.title}
				/>
			{/each}
		</div>
		{#if effective.nowIndicator}
			<EventCalendarNowIndicator days={[day]} {startHour} {endHour} />
		{/if}
	</div>
{/snippet}

<div
	bind:this={ref}
	data-slot="event-calendar-resource-view"
	data-view="resource"
	{...restProps}
	class={cn(
		"flex flex-col border-t",
		contained && "min-h-0 flex-1 overflow-hidden",
		viewConfig.classNames?.timeGrid,
		className,
	)}
	style="--ec-hour-height: 4rem;{style ?? ''}"
>
	<!-- Resource header row -->
	<div
		class={cn(
			"flex border-b pe-(--ec-scrollbar-w,0px)",
			!contained && "sticky top-(--ec-sticky-offset,0px) z-20 bg-background",
			viewConfig.classNames?.timeGridHeader,
		)}
	>
		<div class="w-(--ec-gutter-width,4.5rem) shrink-0 border-e"></div>
		<div class="grid min-w-0 flex-1" style="grid-template-columns: {gridTemplateColumns}">
			{#each resources as resource (resource.id)}
				<div
					data-slot="event-calendar-resource-header"
					class={cn(
						"min-w-0 truncate border-e px-2 py-1.5 text-center font-medium last:border-e-0",
						viewConfig.classNames?.resourceHeader,
					)}
				>
					{#if viewConfig.renderResourceHeader}
						{@render viewConfig.renderResourceHeader({ resource })}
					{:else}
						{resource.title}
					{/if}
				</div>
			{/each}
		</div>
	</div>
	<!-- All-day row, one cell per resource -->
	{#if showAllDay}
		<div
			data-slot="event-calendar-all-day-section"
			class={cn("flex border-b pe-(--ec-scrollbar-w,0px)", viewConfig.classNames?.allDaySection)}
		>
			<div
				class={cn(
					// pt-1.5 matches the all-day cell's top inset; the inner box is one bar-row
					// tall and centers the label so it sits on the SAME baseline as the first
					// all-day chip (mirrors the time-grid label)
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
			<div class="grid min-w-0 flex-1" style="grid-template-columns: {gridTemplateColumns}">
				{#each resources as resource (resource.id)}
					{@const mine = root
						.dayBucket(day)
						.allDay.filter((segment) => segment.occurrence.event.resourceId === resource.id)}
					<!-- Pointer-only by design, like upstream: clicking/dragging empty all-day
					     space is a mouse shortcut for slot creation; keyboard flows go through
					     the chips and the consumer's own creation UI. -->
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<div
						data-slot="event-calendar-all-day-cell"
						data-ec-day={day.getTime()}
						data-ec-resource={resource.id}
						data-off={isOff || undefined}
						class={cn(
							// reserve one bar row so the all-day row keeps the same height with or
							// without events, matching the time-grid all-day row (which reserves
							// the same via its bars-grid min-height)
							"relative flex min-h-[calc(var(--ec-month-bar-h,1.625rem)+0.625rem)] min-w-0 flex-col gap-0.5 border-e px-1 py-1.5 last:border-e-0",
							isOff && offDayClassName(viewConfig.offDays),
							viewConfig.dayClassName?.(day),
							draftFor(resource.id) && cn("bg-primary/10", viewConfig.classNames?.slotDraft),
							viewConfig.classNames?.allDayCell,
						)}
						onpointerdown={(e) => {
							if (e.target === e.currentTarget) {
								root.beginCreate(e, day, true, { resourceId: resource.id });
							}
						}}
						onclick={(e) => {
							if (e.target === e.currentTarget && !wasRecentDrag() && !wasRecentChipPress()) {
								root.opts.onSlotClick?.(
									{ date: day, allDay: true, view: "resource", resourceId: resource.id },
									e,
								);
							}
						}}
					>
						{#each mine as segment (segment.occurrence.key)}
							<!-- one bar-row tall, matching the time-grid all-day bars so the row
							     height stays identical across views (and equals the reserved min) -->
							<EventCalendarEvent
								{segment}
								class="h-[calc(var(--ec-month-bar-h,1.625rem)-0.125rem)]"
							/>
						{/each}
					</div>
				{/each}
			</div>
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
