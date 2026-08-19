<script lang="ts" module>
	export type EventCalendarNowIndicatorProps = {
		days: Date[];
		startHour: number;
		endHour: number;
	};
</script>

<script lang="ts">
	import { differenceInMinutes } from "date-fns";

	import { getDayKey, zonedStartOfDay } from "./event-calendar-lib.js";
	import { getEventCalendarContext, getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let { days, startHour, endHour }: EventCalendarNowIndicatorProps = $props();

	const root = getEventCalendarContext("<EventCalendarNowIndicator>");
	const viewConfig = getEventCalendarViewConfig();

	// Current time, refreshed on an interval and on tab focus (the reference implementation
	// event-calendar-time-grid.tsx:57-72).
	let now = $state(new Date());
	$effect(() => {
		const tick = () => {
			now = new Date();
		};
		const id = setInterval(tick, viewConfig.nowIndicatorInterval);
		document.addEventListener("visibilitychange", tick);
		window.addEventListener("focus", tick);
		return () => {
			clearInterval(id);
			document.removeEventListener("visibilitychange", tick);
			window.removeEventListener("focus", tick);
		};
	});

	const todayIndex = $derived(
		days.findIndex((day) => getDayKey(day, root.timeZone) === getDayKey(now, root.timeZone)),
	);
	const minutes = $derived(differenceInMinutes(now, zonedStartOfDay(now, root.timeZone)));
	const visible = $derived(
		todayIndex !== -1 && minutes >= startHour * 60 && minutes <= endHour * 60,
	);
	const top = $derived(minutes / 60 - startHour);
	const columnWidthPct = $derived(100 / days.length);
</script>

{#if visible}
	<div
		data-slot="event-calendar-now-indicator"
		class="pointer-events-none absolute inset-x-0 z-40"
		style="top: calc(var(--ec-hour-height) * {top})"
	>
		<!-- hairline across the content columns only (clear of the time gutter) -->
		<div class="absolute start-(--ec-gutter-width,4.5rem) end-0 h-px bg-destructive/40"></div>
		<!-- stronger segment + dot over today's column -->
		<div
			class="absolute h-px"
			style="left: calc(var(--ec-gutter-width, 4.5rem) + (100% - var(--ec-gutter-width, 4.5rem)) * {(todayIndex *
				columnWidthPct) /
				100}); width: calc((100% - var(--ec-gutter-width, 4.5rem)) * {columnWidthPct / 100})"
		>
			<div class="absolute inset-x-0 top-0 h-px bg-destructive"></div>
			<!-- dot leads the line at today's column-start border: pulled 1px left of center so it
			     reads as a distinct bullet instead of merging into the line to its right -->
			<div
				class="absolute -start-1 top-0 size-1.5 -translate-y-1/2 rounded-full bg-destructive"
			></div>
		</div>
	</div>
{/if}
