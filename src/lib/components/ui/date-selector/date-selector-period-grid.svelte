<script lang="ts" module>
	import type { DateSelectorPeriodPoint } from "./date-selector.svelte.js";

	export type DateSelectorPeriodGridProps = {
		/** The year sections, one grid per entry. */
		years: number[];
		/** The cell labels inside every year — month, quarter or half-year names from the i18n tables. */
		items: string[];
		selectedYear?: number;
		/** The zero-based index of the selected item inside `selectedYear`. */
		selectedValue?: number;
		rangeStart?: DateSelectorPeriodPoint;
		rangeEnd?: DateSelectorPeriodPoint;
		/** Whether `(year, index)` sits strictly inside the active range. */
		isInRange: (year: number, value: number) => boolean;
		/** Called with the clicked `(year, index)` pair. */
		onSelect: (year: number, value: number) => void;
		/** Cells per row: 3 for months, 4 for quarters, 2 for half-years. */
		columns: number;
		class?: string;
	};
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	let {
		years,
		items,
		selectedYear,
		selectedValue,
		rangeStart,
		rangeEnd,
		isInRange,
		onSelect,
		columns,
		class: className,
	}: DateSelectorPeriodGridProps = $props();
</script>

<!--
	Port of upstream `DateSelectorPeriodGrid`. The column count
	stays an inline style because it is data, not a design decision — upstream does the same.
-->
<div class={cn("flex w-full flex-col gap-6", className)} data-slot="date-selector-period-grid">
	{#each years as year (year)}
		<div>
			<div class="mb-3 text-sm font-medium text-muted-foreground">
				{year}
			</div>
			<div class="grid gap-2" style="grid-template-columns: repeat({columns}, minmax(0, 1fr));">
				{#each items as item, index (item)}
					{@const isSelected = selectedYear === year && selectedValue === index}
					{@const isRangeStart = rangeStart?.year === year && rangeStart?.value === index}
					{@const isRangeEnd = rangeEnd?.year === year && rangeEnd?.value === index}
					{@const inRange = isInRange(year, index)}
					<Button
						size="sm"
						variant={isSelected || isRangeStart || isRangeEnd ? "default" : "outline"}
						class={cn(
							inRange &&
								!isSelected &&
								!isRangeStart &&
								!isRangeEnd &&
								"bg-accent dark:bg-accent/60",
						)}
						onclick={() => onSelect(year, index)}
					>
						{item}
					</Button>
				{/each}
			</div>
		</div>
	{/each}
</div>
