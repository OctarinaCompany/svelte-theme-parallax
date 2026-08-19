<script lang="ts" module>
	import type { DateSelectorPeriodPoint } from "./date-selector.svelte.js";

	export type DateSelectorYearListProps = {
		years: number[];
		selectedYear?: number;
		rangeStart?: DateSelectorPeriodPoint;
		rangeEnd?: DateSelectorPeriodPoint;
		/** Whether `year` sits strictly inside the active range. */
		isYearInRange: (year: number) => boolean;
		/** Called with the clicked year. */
		onSelect: (year: number) => void;
		class?: string;
	};
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	let {
		years,
		selectedYear,
		rangeStart,
		rangeEnd,
		isYearInRange,
		onSelect,
		class: className,
	}: DateSelectorYearListProps = $props();
</script>

<!--
	Port of upstream `DateSelectorYearList`. Unlike the period
	grid, a plain `selectedYear` only counts as selected while no range exists — a year range
	highlights its endpoints instead.
-->
<div class={cn("grid grid-cols-2 gap-2", className)} data-slot="date-selector-year-list">
	{#each years as year (year)}
		{@const isSelected = selectedYear === year && !rangeStart && !rangeEnd}
		{@const isRangeStart = rangeStart?.year === year}
		{@const isRangeEnd = rangeEnd?.year === year}
		{@const inRange = isYearInRange(year)}
		<Button
			size="sm"
			variant={isSelected || isRangeStart || isRangeEnd ? "default" : "outline"}
			class={cn(
				inRange && !isSelected && !isRangeStart && !isRangeEnd && "bg-accent dark:bg-accent/60",
			)}
			onclick={() => onSelect(year)}
		>
			{year}
		</Button>
	{/each}
</div>
