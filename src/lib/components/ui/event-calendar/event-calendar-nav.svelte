<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type EventCalendarNavProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the view switcher in the composed layout. Turn off when the calendar ships with
		 * a fixed view (e.g. a month-only embed) and users should not be able to change it.
		 * @default true
		 */
		showViewSwitcher?: boolean;
	};
</script>

<script lang="ts">
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";

	import EventCalendarNavNext from "./event-calendar-nav-next.svelte";
	import EventCalendarNavPrev from "./event-calendar-nav-prev.svelte";
	import EventCalendarNavToday from "./event-calendar-nav-today.svelte";
	import EventCalendarTitle from "./event-calendar-title.svelte";
	import EventCalendarViewSwitcher from "./event-calendar-view-switcher.svelte";
	import { getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		showViewSwitcher = true,
		...restProps
	}: EventCalendarNavProps = $props();

	const viewConfig = getEventCalendarViewConfig();

	const tooltipDelay = $derived(
		viewConfig.navTooltips === false ? 600 : (viewConfig.navTooltips?.delay ?? 600),
	);
</script>

<!--
	Default composed nav: Today, view switcher, prev/next, title, spacer. Pass children to use it
	as a pure layout shell instead.
-->
<div
	bind:this={ref}
	data-slot="event-calendar-nav"
	{...restProps}
	class={cn(
		"flex min-w-0 flex-wrap items-center gap-1 px-2 py-2",
		viewConfig.stickyNav && "sticky top-0 z-30 bg-background",
		viewConfig.classNames?.nav,
		className,
	)}
>
	{#if children}
		{@render children()}
	{:else}
		<!-- Shared provider: the first tooltip waits, moving between buttons is instant -->
		<Tooltip.Provider delayDuration={tooltipDelay} skipDelayDuration={300}>
			<EventCalendarNavToday />
			{#if showViewSwitcher}
				<EventCalendarViewSwitcher />
			{/if}
			<div class="flex items-center">
				<EventCalendarNavPrev />
				<EventCalendarNavNext />
			</div>
			<!-- ms-3 sets the title apart from the tight control cluster so the period reads as
			     its own group, not another button -->
			<EventCalendarTitle class="ms-3" />
			<div class="grow"></div>
		</Tooltip.Provider>
	{/if}
</div>
