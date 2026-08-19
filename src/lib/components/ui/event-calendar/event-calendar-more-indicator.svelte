<script lang="ts" module>
	import { cn } from "$lib/utils.js";

	import type { EventCalendarSegment } from "./event-calendar-types.js";

	export type EventCalendarMoreIndicatorProps = {
		day: Date;
		count: number;
		/**
		 * The OVERFLOW (hidden) segments for this day - bars first, then timed. The popover lists
		 * only these, never the chips already visible in the cell.
		 */
		segments: EventCalendarSegment[];
	};
</script>

<script lang="ts">
	import { format } from "date-fns";

	import * as Popover from "$lib/components/ui/popover/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

	import EventCalendarEvent from "./event-calendar-event.svelte";
	import { toZoned } from "./event-calendar-lib.js";
	import { getEventCalendarContext, getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let { day, count, segments }: EventCalendarMoreIndicatorProps = $props();

	const root = getEventCalendarContext("<EventCalendarMoreIndicator>");
	const viewConfig = getEventCalendarViewConfig();

	let open = $state(false);
	const headerId = $props.id();

	function handleTriggerClick(e: MouseEvent) {
		e.stopPropagation();
		const verdict = root.opts.onMoreClick?.(
			day,
			segments.map((segment) => segment.occurrence),
			e,
		);
		// onMoreClick returning false suppresses the built-in popover
		if (verdict === false) {
			e.preventDefault();
			open = false;
		}
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		data-slot="event-calendar-more"
		class={cn(
			"cursor-pointer truncate rounded-sm px-1.5 text-start text-muted-foreground hover:text-foreground",
			viewConfig.classNames?.moreIndicator,
		)}
		onclick={handleTriggerClick}
	>
		{root.i18n.labels.more(count)}
	</Popover.Trigger>
	<Popover.Content
		data-slot="event-calendar-more-popover"
		align={viewConfig.morePopoverAlign}
		aria-labelledby={headerId}
		onclick={(e: MouseEvent) => e.stopPropagation()}
		class={cn(
			// text-xs re-establishes the calendar's base type here because this content is
			// portaled out of the root subtree and cannot inherit it
			"flex w-64 flex-col gap-1 p-2 text-xs",
			viewConfig.classNames?.morePopover,
		)}
	>
		<div
			id={headerId}
			class={cn(
				"px-1 py-1 text-xs font-medium text-muted-foreground",
				viewConfig.classNames?.morePopoverHeader,
			)}
		>
			{format(toZoned(day, root.timeZone), root.i18n.formats.moreDayHeader, {
				locale: root.locale,
			})}
		</div>
		<!-- The scroll region breaks out of the popover's right padding (-me-2) so the scrollbar
		     sits flush in the gutter; the list then pads itself back and adds py-1 so the
		     first/last focus ring is not clipped by the overflow. -->
		{#if viewConfig.scrollbars === "native"}
			<div class="-me-2 max-h-(--ec-more-max-height,16rem) min-h-0 overflow-y-auto">
				<div class="flex flex-col gap-1 py-1 ps-1 pe-4">
					{#each segments as segment (segment.occurrence.key)}
						<EventCalendarEvent {segment} class="py-0.5" />
					{/each}
				</div>
			</div>
		{:else}
			<ScrollArea
				class="-me-2 min-h-0 **:data-[slot=scroll-area-viewport]:max-h-(--ec-more-max-height,16rem)"
			>
				<div class="flex flex-col gap-1 py-1 ps-1 pe-4">
					{#each segments as segment (segment.occurrence.key)}
						<EventCalendarEvent {segment} class="py-0.5" />
					{/each}
				</div>
			</ScrollArea>
		{/if}
	</Popover.Content>
</Popover.Root>
