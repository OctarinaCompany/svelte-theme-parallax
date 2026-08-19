<script lang="ts" module>
	import type { DateValue } from "@internationalized/date";

	import type { DateSelectorPeriodType } from "./date-selector.svelte.js";

	export type DateSelectorPeriodTabsProps = {
		/** The active period granularity. Controlled by `<DateSelector.Root>`. */
		value: DateSelectorPeriodType;
		/** Called with the next granularity on every tab change. */
		onValueChange: (value: DateSelectorPeriodType) => void;
		/** Restricts which granularities render, in the fixed day → year order. */
		periodTypes?: readonly DateSelectorPeriodType[];
		/** The month the day view displays; drives the inline month navigation. */
		calendarMonth?: DateValue;
		/** Called with the next month when the inline navigation is used. */
		onCalendarMonthChange?: (month: DateValue) => void;
		/**
		 * Whether the month navigation cluster renders. Only meaningful on the day view — the
		 * cluster hides itself on every other granularity regardless.
		 * @default false
		 */
		showNavigationButtons?: boolean;
		class?: string;
	};
</script>

<script lang="ts">
	import { getLocalTimeZone, isEqualMonth, today } from "@internationalized/date";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import CornerUpLeftIcon from "@lucide/svelte/icons/corner-up-left";
	import CornerUpRightIcon from "@lucide/svelte/icons/corner-up-right";

	import { Button } from "$lib/components/ui/button/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { cn } from "$lib/utils.js";

	import { getDateSelectorContext } from "./date-selector.svelte.js";

	let {
		value,
		onValueChange,
		periodTypes,
		calendarMonth,
		onCalendarMonthChange,
		showNavigationButtons = false,
		class: className,
	}: DateSelectorPeriodTabsProps = $props();

	const selector = getDateSelectorContext("<DateSelector.PeriodTabs>");

	const tabs: { value: DateSelectorPeriodType; label: string }[] = $derived([
		{ value: "day", label: selector.i18n.periodTypes.day },
		{ value: "month", label: selector.i18n.periodTypes.month },
		{ value: "quarter", label: selector.i18n.periodTypes.quarter },
		{ value: "half-year", label: selector.i18n.periodTypes.halfYear },
		{ value: "year", label: selector.i18n.periodTypes.year },
	]);

	const filteredTabs = $derived(
		periodTypes ? tabs.filter((tab) => periodTypes.includes(tab.value)) : tabs,
	);

	// The "back to today" affordance: hidden while the current
	// month is in view, and its arrow points back toward today — up-left from the future, up-right
	// from the past. `subMonths`/`addMonths` become `DateValue.subtract`/`.add`, the idiom the
	// sibling ui/calendar already established.
	const todayDate = $derived(today(getLocalTimeZone()));
	const isCurrentMonth = $derived(
		calendarMonth !== undefined && isEqualMonth(calendarMonth, todayDate),
	);
	const isFuture = $derived(calendarMonth !== undefined && calendarMonth.compare(todayDate) > 0);
</script>

<!-- Port of upstream `DateSelectorPeriodTabs`. -->
<div
	class={cn("flex flex-wrap items-center justify-between gap-3", className)}
	data-slot="date-selector-period-tabs"
>
	<Tabs.Root
		{value}
		onValueChange={(next) => {
			if (next) {
				onValueChange(next as DateSelectorPeriodType);
			}
		}}
	>
		<Tabs.List>
			{#each filteredTabs as tab (tab.value)}
				<Tabs.Trigger
					value={tab.value}
					aria-label={tab.label}
					class="px-1 py-1 font-normal sm:px-2.5"
				>
					{tab.label}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>
	</Tabs.Root>
	{#if showNavigationButtons && value === "day" && calendarMonth && onCalendarMonthChange}
		<div class="flex items-center">
			{#if !isCurrentMonth}
				<!-- Upstream sizes these `size-8.5`; `icon-sm` (size-8) is the house control ramp step. -->
				<Button
					variant="ghost"
					size="icon-sm"
					title={selector.i18n.today}
					aria-label={selector.i18n.today}
					onclick={() => onCalendarMonthChange(today(getLocalTimeZone()))}
				>
					{#if isFuture}
						<CornerUpLeftIcon />
					{:else}
						<CornerUpRightIcon />
					{/if}
				</Button>
			{/if}
			<Button
				variant="ghost"
				size="icon-sm"
				title={selector.i18n.previousMonth}
				aria-label={selector.i18n.previousMonth}
				onclick={() => onCalendarMonthChange(calendarMonth.subtract({ months: 1 }))}
			>
				<ChevronLeftIcon />
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				title={selector.i18n.nextMonth}
				aria-label={selector.i18n.nextMonth}
				onclick={() => onCalendarMonthChange(calendarMonth.add({ months: 1 }))}
			>
				<ChevronRightIcon />
			</Button>
		</div>
	{/if}
</div>
