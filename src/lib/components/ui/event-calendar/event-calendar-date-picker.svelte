<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	export type EventCalendarDatePickerProps = Omit<ButtonProps, "children"> & {
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { CalendarDate, type DateValue } from "@internationalized/date";
	import CalendarIcon from "@lucide/svelte/icons/calendar";

	import { Button } from "$lib/components/ui/button/index.js";
	import { Calendar } from "$lib/components/ui/calendar/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";

	import { toZoned } from "./event-calendar-lib.js";
	import { getEventCalendarContext, getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: EventCalendarDatePickerProps = $props();

	const root = getEventCalendarContext("<EventCalendarDatePicker>");
	const viewConfig = getEventCalendarViewConfig();

	let open = $state(false);

	// The house Calendar speaks @internationalized/date, the engine speaks Date; convert on the
	// display-zone wall date so the highlighted day matches what the title shows. Upstream's
	// range-highlight mode for week/N-days/agenda is not ported — the picker always selects a
	// single anchor date (any click re-anchors the period either way).
	const zonedAnchor = $derived(toZoned(root.date, root.timeZone));
	const selected = $derived(
		new CalendarDate(zonedAnchor.getFullYear(), zonedAnchor.getMonth() + 1, zonedAnchor.getDate()),
	);

	function pick(next: DateValue | undefined) {
		if (!next) return;
		// Wall date in the display zone: hand the engine the zoned midnight of the picked day.
		const zoned = toZoned(new Date(), root.timeZone);
		zoned.setFullYear(next.year, next.month - 1, next.day);
		zoned.setHours(0, 0, 0, 0);
		root.api.goTo(new Date(zoned.getTime()));
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				bind:ref
				variant={viewConfig.navButtonVariant}
				size={viewConfig.navButtonSize === "sm" ? "icon-sm" : "icon"}
				data-slot="event-calendar-date-picker"
				aria-label={root.i18n.labels.goToDate}
				class={cn(viewConfig.classNames?.navButton, className)}
				{...restProps}
				{...props}
			>
				{#if children}
					{@render children()}
				{:else}
					<CalendarIcon aria-hidden="true" />
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content
		align="start"
		class={cn("w-auto p-0!", viewConfig.classNames?.datePickerContent)}
	>
		<Calendar
			type="single"
			value={selected}
			onValueChange={pick}
			locale={root.locale?.code ?? "en-US"}
			weekStartsOn={root.weekStartsOn}
		/>
	</Popover.Content>
</Popover.Root>
