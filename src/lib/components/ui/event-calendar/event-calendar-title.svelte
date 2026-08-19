<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type EventCalendarTitleProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "children">
	> & {
		/** Replaces the default text; receives the formatted period title. */
		children?: Snippet<[{ title: string }]>;
	};
</script>

<script lang="ts">
	import { toZoned } from "./event-calendar-lib.js";
	import { getEventCalendarContext, getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: EventCalendarTitleProps = $props();

	const root = getEventCalendarContext("<EventCalendarTitle>");
	const viewConfig = getEventCalendarViewConfig();

	const title = $derived(
		root.i18n.functions.formatTitle(root.view, {
			date: toZoned(root.date, root.timeZone),
			activeRange: root.activeRange,
			visibleRange: root.visibleRange,
			locale: root.locale,
		}),
	);
</script>

<div
	bind:this={ref}
	data-slot="event-calendar-title"
	aria-live="polite"
	{...restProps}
	class={cn("min-w-0 truncate text-sm font-semibold", viewConfig.classNames?.title, className)}
>
	{#if children}
		{@render children({ title })}
	{:else}
		{title}
	{/if}
</div>
