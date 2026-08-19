<script lang="ts" module>
	import type { Column, RowData } from "@tanstack/table-core";

	import type { DataTableFilterAttributes } from "./types.js";

	export type DataTableDateFilterProps<TData extends RowData> = DataTableFilterAttributes & {
		/**
		 * The column being filtered. Its filter value stays **epoch milliseconds** — a `number` in
		 * single mode, a `[from?, to?]` tuple in range mode.
		 */
		column: Column<TData, unknown>;
		/** Trigger label. */
		title?: string;
		/**
		 * Pick a range instead of a single date.
		 * @default false
		 */
		multiple?: boolean;
		/**
		 * Whether the popover is open. Bindable.
		 * @default false
		 */
		open?: boolean;
		/** Called whenever the popover opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/** The trigger element. Every other attribute is spread onto it too. */
		ref?: HTMLElement | null;
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import type { DateValue } from "@internationalized/date";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import XCircleIcon from "@lucide/svelte/icons/x-circle";
	import { RangeCalendar } from "bits-ui";

	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import * as Calendar from "$lib/components/ui/calendar/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { cn } from "$lib/utils.js";

	import {
		formatDate,
		fromDateValue,
		parseAsDate,
		parseColumnFilterValue,
		toDateValue,
	} from "./data-table-utils.js";

	let {
		ref = $bindable(null),
		column,
		title,
		multiple = false,
		open = $bindable(false),
		onOpenChange,
		class: className,
		...restProps
	}: DataTableDateFilterProps<TData> = $props();

	const timestamps = $derived(parseColumnFilterValue(column.getFilterValue()));
	const fromDate = $derived(column.getFilterValue() ? parseAsDate(timestamps[0]) : undefined);
	const toDate = $derived(
		multiple && column.getFilterValue() ? parseAsDate(timestamps[1]) : undefined,
	);

	const hasValue = $derived(multiple ? Boolean(fromDate || toDate) : Boolean(fromDate));

	const label = $derived.by(() => {
		if (!hasValue) return "";
		if (!multiple) return formatDate(fromDate);
		if (fromDate && toDate) return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
		return formatDate(fromDate ?? toDate);
	});

	const placeholderText = $derived(multiple ? "Select date range" : "Select date");

	const singleValue = $derived(toDateValue(timestamps[0]));
	const rangeValue = $derived({
		start: toDateValue(timestamps[0]),
		end: multiple ? toDateValue(timestamps[1]) : undefined,
	});

	let calendarPlaceholder = $state<DateValue | undefined>(undefined);

	function onSingleSelect(next: DateValue | undefined) {
		column.setFilterValue(fromDateValue(next));
	}

	function onRangeSelect(next: { start: DateValue | undefined; end: DateValue | undefined }) {
		const from = fromDateValue(next.start);
		const to = fromDateValue(next.end);
		column.setFilterValue(from || to ? [from, to] : undefined);
	}

	function onReset() {
		column.setFilterValue(undefined);
	}
</script>

<!--
	The wrapper wears the whole pill's chrome at all times and both halves paint transparent, so
	background, border, hover and open-state read as one control and selecting a value repaints
	nothing (the variant's `transition-all` would flash the swap) — see
	`data-table-faceted-filter.svelte` for the full rationale.
-->
<div
	class={cn(
		buttonVariants({ variant: "outline", size: "sm" }),
		"gap-0 border-dashed p-0 font-normal active:not-aria-[haspopup]:translate-y-0 has-data-[state=open]:bg-muted has-data-[state=open]:text-foreground",
	)}
>
	{#if hasValue}
		<!--
			Sibling, keyboard-operable clear affordance, rendered as the leading half of the
			wrapper's pill. The `hover:`/`dark:` transparents only cancel the outline variant's
			per-element state layers so the wrapper alone paints; the icon alone dims. `ps-2.5` puts
			the X exactly where the resting calendar icon sits, and the `pe-1.5` and trigger
			`ps-1.5` give the rule below the same 6px flanks as the label↔badges one.
		-->
		<button
			type="button"
			aria-label={`Clear ${title} filter`}
			class={cn(
				buttonVariants({ variant: "outline", size: "sm" }),
				"rounded-s-[inherit] rounded-e-none border-0 bg-transparent px-0 ps-2.5 pe-1.5 text-muted-foreground hover:bg-transparent active:not-aria-[haspopup]:translate-y-0 dark:bg-transparent dark:hover:bg-transparent [&_svg]:size-3.5 [&_svg]:opacity-70 [&_svg]:transition-opacity hover:[&_svg]:opacity-100",
			)}
			onclick={onReset}
		>
			<XCircleIcon />
		</button>
		<Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />
	{/if}
	<Popover.Root bind:open {onOpenChange}>
		<Popover.Trigger
			bind:ref
			data-slot="data-table-date-filter"
			data-multiple={multiple ? "" : undefined}
			data-selected={hasValue ? "" : undefined}
			class={cn(
				buttonVariants({ variant: "outline", size: "sm" }),
				"border-0 bg-transparent font-normal transition-colors hover:bg-transparent aria-expanded:bg-transparent dark:bg-transparent dark:hover:bg-transparent",
				hasValue && "rounded-s-none rounded-e-[inherit] ps-1.5",
				className,
			)}
			{...restProps}
		>
			{#if !hasValue}
				<CalendarIcon />
			{/if}
			<span class="flex items-center gap-2">
				<span>{title ?? placeholderText}</span>
				{#if hasValue}
					<Separator orientation="vertical" class="mx-0.5 data-[orientation=vertical]:h-4" />
					<span>{label}</span>
				{/if}
			</span>
		</Popover.Trigger>
		<Popover.Content class="w-auto p-0" align="start">
			{#if multiple}
				<!--
					bits-ui's `RangeCalendar` shares the calendar context with every non-day part, so
					the local `calendar` wrapper's header, nav and grid parts compose over it
					unchanged; only `Cell` and `Day` are range-specific.
				-->
				<RangeCalendar.Root
					value={rangeValue}
					onValueChange={onRangeSelect}
					bind:placeholder={calendarPlaceholder}
					weekdayFormat="short"
					locale="en-US"
					class="bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=popover-content]:bg-transparent"
				>
					{#snippet children({ months, weekdays })}
						<Calendar.Months>
							<Calendar.Nav>
								<Calendar.PrevButton />
								<Calendar.NextButton />
							</Calendar.Nav>
							{#each months as month, monthIndex (month.value)}
								<Calendar.Month>
									<Calendar.Header>
										<Calendar.Caption
											captionLayout="dropdown"
											months={undefined}
											monthFormat="short"
											years={undefined}
											yearFormat="numeric"
											month={month.value}
											bind:placeholder={calendarPlaceholder}
											locale="en-US"
											{monthIndex}
										/>
									</Calendar.Header>
									<Calendar.Grid>
										<Calendar.GridHead>
											<Calendar.GridRow class="select-none">
												{#each weekdays as weekday, index (index)}
													<Calendar.HeadCell>{weekday.slice(0, 2)}</Calendar.HeadCell>
												{/each}
											</Calendar.GridRow>
										</Calendar.GridHead>
										<Calendar.GridBody>
											{#each month.weeks as weekDates (weekDates)}
												<Calendar.GridRow class="mt-2 w-full">
													{#each weekDates as date (date)}
														<RangeCalendar.Cell
															{date}
															month={month.value}
															class="relative size-(--cell-size) p-0 text-center text-sm focus-within:z-20"
														>
															<RangeCalendar.Day
																class="flex size-(--cell-size) flex-col items-center justify-center rounded-(--cell-radius) p-0 leading-none font-normal whitespace-nowrap select-none not-data-selected:hover:bg-accent/50 not-data-selected:hover:text-accent-foreground focus:relative focus:border-ring focus:ring-ring/50 data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[unavailable]:text-muted-foreground data-[unavailable]:line-through data-disabled:pointer-events-none data-disabled:text-muted-foreground data-disabled:opacity-50 [&[data-outside-month]:not([data-selected])]:text-muted-foreground [&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground"
															/>
														</RangeCalendar.Cell>
													{/each}
												</Calendar.GridRow>
											{/each}
										</Calendar.GridBody>
									</Calendar.Grid>
								</Calendar.Month>
							{/each}
						</Calendar.Months>
					{/snippet}
				</RangeCalendar.Root>
			{:else}
				<Calendar.Calendar
					type="single"
					captionLayout="dropdown"
					value={singleValue}
					onValueChange={onSingleSelect}
				/>
			{/if}
		</Popover.Content>
	</Popover.Root>
</div>
