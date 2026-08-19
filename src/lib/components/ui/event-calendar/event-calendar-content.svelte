<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Component, Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { CalendarView } from "./event-calendar-types.js";

	export type EventCalendarContentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Swap individual view implementations; wins over the root `components` prop. */
		components?: Partial<Record<CalendarView, Component>>;
		/** Replaces the switchboard entirely; read the calendar context inside. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import EventCalendarAgendaView from "./event-calendar-agenda-view.svelte";
	import EventCalendarMonthView from "./event-calendar-month-view.svelte";
	import EventCalendarResourceView from "./event-calendar-resource-view.svelte";
	import EventCalendarTimeGrid from "./event-calendar-time-grid.svelte";
	import { getEventCalendarContext, getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		components,
		children,
		...restProps
	}: EventCalendarContentProps = $props();

	const root = getEventCalendarContext("<EventCalendarContent>");
	const viewConfig = getEventCalendarViewConfig();

	// The week/day/days views are one component parameterized by `view` (the time grid), so the
	// default map hands it the right prop; upstream wrapped it in three thin components instead
	//.
	const view = $derived(root.view);
	// A spread copies keys that hold `undefined`, so `components={{ month: maybeUndefined }}`
	// would erase the default and render nothing — resolve with a fallback per key.
	const override = $derived(components?.[view] ?? viewConfig.components?.[view]);
	// The time grid restricts its `view` prop to the three views it implements; the {:else}
	// branch below only renders for those, but the type system cannot see through the if-chain,
	// so narrow here (the "week" arm is unreachable).
	const timeGridView = $derived(view === "day" || view === "days" ? view : ("week" as const));
</script>

<div
	bind:this={ref}
	data-slot="event-calendar-content"
	data-view={view}
	data-loading={root.loading || undefined}
	{...restProps}
	class={cn(
		"relative flex min-h-0 min-w-0 flex-1 flex-col",
		"data-loading:pointer-events-none data-loading:opacity-60",
		viewConfig.classNames?.content,
		className,
	)}
>
	{#if children}
		{@render children()}
	{:else if override}
		{@const Active = override}
		<Active />
	{:else if view === "month"}
		<EventCalendarMonthView />
	{:else if view === "agenda"}
		<EventCalendarAgendaView />
	{:else if view === "resource"}
		<EventCalendarResourceView />
	{:else}
		<EventCalendarTimeGrid view={timeGridView} />
	{/if}
</div>
