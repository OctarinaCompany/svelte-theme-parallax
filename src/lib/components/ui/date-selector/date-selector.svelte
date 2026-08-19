<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef } from "$lib/utils.js";

	import type {
		DateSelectorFilterType,
		DateSelectorI18nConfig,
		DateSelectorPeriodType,
		DateSelectorValue,
		DateSelectorWeekStartsOn,
	} from "./date-selector.svelte.js";

	export type DateSelectorRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * The selection, as one structured value covering every granularity. Bindable; also
		 * written by free-text input parsing.
		 */
		value?: DateSelectorValue;
		/**
		 * Called with the next value after every user-driven change — day or period clicks,
		 * operator or granularity switches, clearing, and successful input parses. Upstream's
		 * `onChange`, renamed to pair with the bindable `value`.
		 */
		onValueChange?: (value: DateSelectorValue) => void;
		/**
		 * Whether the `between` operator is offered and ranges can be selected.
		 * @default true
		 */
		allowRange?: boolean;
		/** Restricts which period granularities the tabs offer. */
		periodTypes?: DateSelectorPeriodType[];
		/**
		 * The granularity shown before any value exists. Falls back to the first allowed entry
		 * when `periodTypes` excludes it.
		 * @default "day"
		 */
		defaultPeriodType?: DateSelectorPeriodType;
		/**
		 * The operator active before any value exists.
		 * @default "is"
		 */
		defaultFilterType?: DateSelectorFilterType;
		/** Pins the operator and disables the filter toggle. */
		presetMode?: DateSelectorFilterType;
		/**
		 * Whether the text input (with its clear button) renders above the tabs.
		 * @default true
		 */
		showInput?: boolean;
		/**
		 * Whether the day view shows two months side by side on desktop.
		 * @default true
		 */
		showTwoMonths?: boolean;
		/** A heading rendered before the filter toggle. */
		label?: string;
		/**
		 * How many years the period grids list when `minYear`/`maxYear` are not both set,
		 * centred on `baseYear`.
		 * @default 10
		 */
		yearRange?: number;
		/** The centre of the `yearRange` window. Defaults to the current year. */
		baseYear?: number;
		/** First listed year. Both bounds must be set to take effect over `yearRange`. */
		minYear?: number;
		/** Last listed year. Both bounds must be set to take effect over `yearRange`. */
		maxYear?: number;
		/** Partial string overrides, merged over {@link DEFAULT_DATE_SELECTOR_I18N}. */
		i18n?: Partial<DateSelectorI18nConfig>;
		/**
		 * A focus-time placeholder hinting at what the input parses (e.g. "Try: 2025, Q4,
		 * 05/10/2025"). Setting it also makes the input editable — without a hint the input is a
		 * read-only display, exactly upstream's contract.
		 */
		inputHint?: string;
		/**
		 * The date-fns pattern day values display and parse with.
		 * @default "MM/dd/yyyy"
		 */
		dayDateFormat?: string;
		/** Additional date-fns patterns input parsing accepts, tried in order. */
		dayDateFormats?: string[];
		/** The week's first day for the day view: `0` is Sunday. */
		weekStartsOn?: DateSelectorWeekStartsOn;
	};

	/** Upstream-parity alias of {@link DateSelectorRootProps}. */
	export type DateSelectorProps = DateSelectorRootProps;
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import XIcon from "@lucide/svelte/icons/x";

	import { Input } from "$lib/components/ui/input/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { cn } from "$lib/utils.js";

	import DayPicker from "./date-selector-day-picker.svelte";
	import FilterToggle from "./date-selector-filter-toggle.svelte";
	import PeriodGrid from "./date-selector-period-grid.svelte";
	import PeriodTabs from "./date-selector-period-tabs.svelte";
	import YearList from "./date-selector-year-list.svelte";
	import {
		DateSelectorState,
		DEFAULT_DATE_SELECTOR_I18N,
		formatDateValue,
		parseDateSelectorInput,
		resolveDayDateFormats,
		setDateSelectorContext,
	} from "./date-selector.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		onValueChange,
		allowRange = true,
		periodTypes,
		defaultPeriodType = "day",
		defaultFilterType = "is",
		presetMode,
		showInput = true,
		showTwoMonths = true,
		label,
		class: className,
		yearRange = 10,
		baseYear,
		// Unset by default — a deliberate divergence from upstream, whose fixed 2015/2026 defaults
		// make `yearRange`/`baseYear` unreachable and stop offering the current year after 2026.
		minYear,
		maxYear,
		i18n: i18nOverride,
		inputHint,
		dayDateFormat = "MM/dd/yyyy",
		dayDateFormats,
		weekStartsOn,
		...restProps
	}: DateSelectorRootProps = $props();

	const mergedI18n = $derived({ ...DEFAULT_DATE_SELECTOR_I18N, ...i18nOverride });

	const selector = setDateSelectorContext(
		new DateSelectorState(
			{
				getI18n: () => mergedI18n,
				getAllowRange: () => allowRange,
				getPresetMode: () => presetMode,
				getPeriodTypes: () => periodTypes,
				getDefaultPeriodType: () => defaultPeriodType,
				getDefaultFilterType: () => defaultFilterType,
				getYearRange: () => yearRange,
				getBaseYear: () => baseYear,
				getMinYear: () => minYear,
				getMaxYear: () => maxYear,
				onCommit: (next) => {
					value = next;
					onValueChange?.(next);
				},
			},
			untrack(() => value),
		),
	);

	// Mirror an externally supplied `value` into the granular state — upstream's value-sync
	// effect. This also fires after our own commit, where
	// `applyValue` rewrites every field with the references it already holds and settles.
	$effect(() => {
		const next = value;
		untrack(() => selector.applyValue(next));
	});

	const displayValue = $derived(formatDateValue(selector.currentValue, mergedI18n, dayDateFormat));
	const dateFormats = $derived(resolveDayDateFormats(dayDateFormat, dayDateFormats));

	let inputValue = $state("");
	let isInputFocused = $state(false);

	// Keep the editable input following the formatted value, but never mid-keystroke
	//.
	$effect(() => {
		const next = displayValue;
		if (!untrack(() => isInputFocused)) {
			inputValue = next;
		}
	});

	function parseInput(text: string) {
		return parseDateSelectorInput(text, {
			operator: presetMode ?? selector.filterType,
			formats: dateFormats,
		});
	}

	// A successful parse is published like any interaction; the value-sync effect above then
	// spreads it into the granular fields (upstream routes it through the controlled `value`
	// prop the same way, the original source).
	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		const next = event.currentTarget.value;
		inputValue = next;
		const parsed = parseInput(next);
		if (parsed) {
			value = parsed;
			onValueChange?.(parsed);
		}
	}

	function handleInputBlur() {
		isInputFocused = false;
		// Abandon unparseable text and fall back to the formatted value.
		if (!parseInput(inputValue)) {
			inputValue = displayValue;
		}
	}
</script>

<!-- Port of upstream `DateSelector`. -->
<div
	bind:this={ref}
	data-slot="date-selector"
	class={cn("flex w-full flex-col gap-4 sm:w-[470px]", className)}
	{...restProps}
>
	<div class="flex flex-wrap items-center gap-3">
		{#if label}
			<!-- Upstream tags this "data-selector-label" — a typo this theme corrects. -->
			<h3 class="text-sm font-medium" data-slot="date-selector-label">
				{label}
			</h3>
		{/if}
		<FilterToggle
			value={selector.filterType}
			onValueChange={(type) => selector.setFilterType(type)}
			showBetween={allowRange}
			{presetMode}
		/>
	</div>
	{#if showInput}
		<div class="relative">
			<Input
				type="text"
				value={inputHint ? inputValue : displayValue}
				readonly={!inputHint}
				placeholder={isInputFocused && inputHint ? inputHint : mergedI18n.placeholder}
				onfocus={() => (isInputFocused = true)}
				onblur={handleInputBlur}
				oninput={handleInput}
			/>
			{#if inputHint ? inputValue : displayValue}
				<button
					type="button"
					aria-label={mergedI18n.clear}
					onclick={() => selector.clearSelection()}
					class={cn(
						// Upstream carries per-style-preset radii here; this
						// theme has a single radius scale, so a plain rounded-sm stands in for all of them.
						"absolute end-2.5 top-1/2 size-4 -translate-y-1/2 cursor-pointer rounded-sm",
						"opacity-70 transition-opacity hover:opacity-100",
						"ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none",
					)}
				>
					<XIcon class="size-4" />
				</button>
			{/if}
		</div>
	{/if}
	<PeriodTabs
		value={selector.periodType}
		onValueChange={(type) => selector.setPeriodType(type)}
		{periodTypes}
		calendarMonth={selector.calendarMonth}
		onCalendarMonthChange={(month) => selector.setCalendarMonth(month)}
		showNavigationButtons={selector.periodType === "day"}
	/>

	{#if selector.periodType === "day"}
		<div class="w-full pb-1">
			<DayPicker
				month={selector.calendarMonth}
				onMonthChange={(month) => selector.setCalendarMonth(month)}
				selectedDate={selector.selectedDate}
				selectedEndDate={selector.selectedEndDate}
				isRange={selector.filterType === "between" && allowRange}
				onDaySelect={(day) => selector.selectDay(day)}
				onRangeSelect={(start, end) => selector.setDayRange(start, end)}
				{showTwoMonths}
				{weekStartsOn}
			/>
		</div>
	{:else}
		<!-- Upstream's -mr-3/pe-3 pair mixes physical and logical spacing; both sides are logical here. -->
		<div class="-me-3 w-full">
			<!-- Upstream keys the ScrollArea by period type to reset its scroll position on every switch. -->
			{#key selector.periodType}
				<ScrollArea class="h-[200px] w-full pe-3">
					{#if selector.periodType === "month"}
						<PeriodGrid
							years={selector.years}
							items={mergedI18n.monthsShort}
							selectedYear={selector.selectedYear}
							selectedValue={selector.selectedMonth}
							rangeStart={selector.rangeStart}
							rangeEnd={selector.rangeEnd}
							isInRange={(year, index) => selector.isInRange(year, index)}
							onSelect={(year, index) => selector.selectPeriod(year, index)}
							columns={3}
						/>
					{:else if selector.periodType === "quarter"}
						<PeriodGrid
							years={selector.years}
							items={mergedI18n.quarters}
							selectedYear={selector.selectedYear}
							selectedValue={selector.selectedQuarter}
							rangeStart={selector.rangeStart}
							rangeEnd={selector.rangeEnd}
							isInRange={(year, index) => selector.isInRange(year, index)}
							onSelect={(year, index) => selector.selectPeriod(year, index)}
							columns={4}
						/>
					{:else if selector.periodType === "half-year"}
						<PeriodGrid
							years={selector.years}
							items={mergedI18n.halfYears}
							selectedYear={selector.selectedYear}
							selectedValue={selector.selectedHalfYear}
							rangeStart={selector.rangeStart}
							rangeEnd={selector.rangeEnd}
							isInRange={(year, index) => selector.isInRange(year, index)}
							onSelect={(year, index) => selector.selectPeriod(year, index)}
							columns={2}
						/>
					{:else if selector.periodType === "year"}
						<YearList
							years={selector.years}
							selectedYear={selector.selectedYear}
							rangeStart={selector.rangeStart}
							rangeEnd={selector.rangeEnd}
							isYearInRange={(year) => selector.isYearInRange(year)}
							onSelect={(year) => selector.selectYear(year)}
						/>
					{/if}
				</ScrollArea>
			{/key}
		</div>
	{/if}
</div>
