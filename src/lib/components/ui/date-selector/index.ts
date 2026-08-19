import DayPicker from "./date-selector-day-picker.svelte";
import FilterToggle from "./date-selector-filter-toggle.svelte";
import PeriodGrid from "./date-selector-period-grid.svelte";
import PeriodTabs from "./date-selector-period-tabs.svelte";
import YearList from "./date-selector-year-list.svelte";
import Root from "./date-selector.svelte";

export type { DateSelectorProps, DateSelectorRootProps } from "./date-selector.svelte";
export type { DateSelectorFilterToggleProps } from "./date-selector-filter-toggle.svelte";
export type { DateSelectorPeriodTabsProps } from "./date-selector-period-tabs.svelte";
export type { DateSelectorDayPickerProps } from "./date-selector-day-picker.svelte";
export type { DateSelectorPeriodGridProps } from "./date-selector-period-grid.svelte";
export type { DateSelectorYearListProps } from "./date-selector-year-list.svelte";

export {
	DATE_SELECTOR_FILTER_TYPES,
	DATE_SELECTOR_PERIOD_TYPES,
	DateSelectorState,
	dateValueToDate,
	DEFAULT_DATE_SELECTOR_I18N,
	formatDateValue,
	getDateSelectorContext,
	hasDateSelectorContext,
	parseDateSelectorInput,
	resolveDayDateFormats,
	setDateSelectorContext,
	type DateSelectorFilterType,
	type DateSelectorI18nConfig,
	type DateSelectorPeriodPoint,
	type DateSelectorPeriodType,
	type DateSelectorStateProps,
	type DateSelectorValue,
	type DateSelectorWeekStartsOn,
} from "./date-selector.svelte.js";

export {
	Root,
	FilterToggle,
	PeriodTabs,
	DayPicker,
	PeriodGrid,
	YearList,
	//
	Root as DateSelector,
	FilterToggle as DateSelectorFilterToggle,
	PeriodTabs as DateSelectorPeriodTabs,
	DayPicker as DateSelectorDayPicker,
	PeriodGrid as DateSelectorPeriodGrid,
	YearList as DateSelectorYearList,
};
