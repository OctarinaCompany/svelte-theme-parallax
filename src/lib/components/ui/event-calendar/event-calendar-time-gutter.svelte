<script lang="ts" module>
	import { cn } from "$lib/utils.js";

	export type EventCalendarTimeGutterProps = {
		/** The first rendered day, used as the label reference. */
		referenceDay: Date;
		/** Gutter slots in minutes from the zoned day start. */
		slots: number[];
		startHour: number;
		interval: number;
	};
</script>

<script lang="ts">
	import { addMinutes, format } from "date-fns";

	import { zonedStartOfDay } from "./event-calendar-lib.js";
	import { getEventCalendarContext, getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let { referenceDay, slots, startHour, interval }: EventCalendarTimeGutterProps = $props();

	const root = getEventCalendarContext("<EventCalendarTimeGutter>");
	const viewConfig = getEventCalendarViewConfig();

	const labelFormat = $derived(
		interval % 60 === 0 ? root.i18n.formats.timeGutter : root.i18n.formats.timeGutterMinute,
	);
</script>

<div
	data-slot="event-calendar-time-gutter"
	class={cn(
		"relative w-(--ec-gutter-width,4.5rem) shrink-0 border-e",
		viewConfig.classNames?.timeGutter,
	)}
>
	{#each slots as minutes (minutes)}
		{@const time = addMinutes(zonedStartOfDay(referenceDay, root.timeZone), minutes)}
		<div class="relative" style="height: calc(var(--ec-hour-height) * {interval / 60})">
			<!-- the default label is suppressed at the day-start edge (it would clip at the top) -->
			{#if minutes > startHour * 60}
				<span
					class={cn(
						"absolute end-2.5 -top-2 text-muted-foreground",
						viewConfig.classNames?.timeGutterLabel,
					)}
				>
					{format(time, labelFormat, { locale: root.locale })}
				</span>
			{/if}
		</div>
	{/each}
</div>
