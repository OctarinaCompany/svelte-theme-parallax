import AgendaView from "./event-calendar-agenda-view.svelte";
import AllDayBars from "./event-calendar-all-day-bars.svelte";
import Content from "./event-calendar-content.svelte";
import DatePicker from "./event-calendar-date-picker.svelte";
import DayColumn from "./event-calendar-day-column.svelte";
import EventChip from "./event-calendar-event.svelte";
import MonthCell from "./event-calendar-month-cell.svelte";
import MonthView from "./event-calendar-month-view.svelte";
import MonthWeek from "./event-calendar-month-week.svelte";
import MoreIndicator from "./event-calendar-more-indicator.svelte";
import Nav from "./event-calendar-nav.svelte";
import NavNext from "./event-calendar-nav-next.svelte";
import NavPrev from "./event-calendar-nav-prev.svelte";
import NavToday from "./event-calendar-nav-today.svelte";
import NowIndicator from "./event-calendar-now-indicator.svelte";
import ResourceView from "./event-calendar-resource-view.svelte";
import TimeGrid from "./event-calendar-time-grid.svelte";
import TimeGutter from "./event-calendar-time-gutter.svelte";
import Title from "./event-calendar-title.svelte";
import Toolbar from "./event-calendar-toolbar.svelte";
import ViewSwitcher from "./event-calendar-view-switcher.svelte";
import Root from "./event-calendar.svelte";

export type { EventCalendarChildProps, EventCalendarProps } from "./event-calendar.svelte";
export type { EventCalendarContentProps } from "./event-calendar-content.svelte";
export type { EventCalendarNavProps } from "./event-calendar-nav.svelte";
export type { EventCalendarNavPrevProps } from "./event-calendar-nav-prev.svelte";
export type { EventCalendarNavNextProps } from "./event-calendar-nav-next.svelte";
export type { EventCalendarNavTodayProps } from "./event-calendar-nav-today.svelte";
export type { EventCalendarTitleProps } from "./event-calendar-title.svelte";
export type { EventCalendarViewSwitcherProps } from "./event-calendar-view-switcher.svelte";
export type { EventCalendarDatePickerProps } from "./event-calendar-date-picker.svelte";
export type { EventCalendarToolbarProps } from "./event-calendar-toolbar.svelte";
export type { EventCalendarMonthViewProps } from "./event-calendar-month-view.svelte";
export type { EventCalendarMonthWeekProps } from "./event-calendar-month-week.svelte";
export type { EventCalendarMonthCellProps } from "./event-calendar-month-cell.svelte";
export type { EventCalendarMoreIndicatorProps } from "./event-calendar-more-indicator.svelte";
export type { EventCalendarTimeGridProps } from "./event-calendar-time-grid.svelte";
export type { EventCalendarDayColumnProps } from "./event-calendar-day-column.svelte";
export type { EventCalendarTimeGutterProps } from "./event-calendar-time-gutter.svelte";
export type { EventCalendarAllDayBarsProps } from "./event-calendar-all-day-bars.svelte";
export type { EventCalendarNowIndicatorProps } from "./event-calendar-now-indicator.svelte";
export type { EventCalendarAgendaViewProps } from "./event-calendar-agenda-view.svelte";
export type { EventCalendarResourceViewProps } from "./event-calendar-resource-view.svelte";

// The chip's consumer-facing constants: the color presets and the fade-truncate class recipe.
export {
	EVENT_CALENDAR_COLORS,
	EVENT_CALENDAR_FADE_TRUNCATE,
	type EventCalendarEventProps,
} from "./event-calendar-event.svelte";

// The engine: state class, contexts, view-config defaults, and the option/callback contracts.
export {
	DEFAULT_EVENT_CALENDAR_VIEW_CONFIG,
	EVENT_CALENDAR_ALL_VIEWS,
	EVENT_CALENDAR_BASE_VIEWS,
	EventCalendarRootState,
	getEventCalendarContext,
	getEventCalendarViewConfig,
	getEventCalendarViewContext,
	hasEventCalendarContext,
	markChipPress,
	offDayClassName,
	resolveEffectiveViewSettings,
	resolveOffDayConfig,
	setEventCalendarContext,
	setEventCalendarViewConfig,
	setEventCalendarViewContext,
	wasRecentChipPress,
	wasRecentDrag,
	type EventCalendarApi,
	type EventCalendarCallbacks,
	type EventCalendarClassNames,
	type EventCalendarOptions,
	type EventCalendarRenderEventProps,
	type EventCalendarViewConfig,
} from "./event-calendar.svelte.js";

// The public data contract.
export {
	CALENDAR_VIEWS,
	type CalendarEvent,
	type CalendarView,
	type EventCalendarDataAdapter,
	type EventCalendarDateRange,
	type EventCalendarDragState,
	type EventCalendarEventId,
	type EventCalendarInteractions,
	type EventCalendarOccurrence,
	type EventCalendarOffDaysConfig,
	type EventCalendarProposedUpdate,
	type EventCalendarRangeInfo,
	type EventCalendarRecurrenceRule,
	type EventCalendarResource,
	type EventCalendarSegment,
	type EventCalendarSelection,
	type EventCalendarSlotDraft,
	type EventCalendarSlotInfo,
	type EventCalendarStateSnapshot,
	type EventCalendarUpdateResult,
	type EventCalendarViewSettings,
	type EventCalendarWeekday,
} from "./event-calendar-types.js";

// i18n defaults and the per-section merge.
export {
	DEFAULT_EVENT_CALENDAR_I18N,
	mergeEventCalendarI18n,
	type EventCalendarI18nConfig,
	type EventCalendarI18nOverrides,
} from "./event-calendar-i18n.js";

// Pure calendar math, exported for consumers building custom views or adapters on the same
// zoned-day semantics the built-in views use.
export {
	buildEventIndex,
	defaultEventOrder,
	eventsOverlap,
	flattenResources,
	getDayKey,
	getDayTotalMinutes,
	getRangeKey,
	getViewDateRange,
	isBarOccurrence,
	listRangeDays,
	MIN_PACK_SLOT,
	packTimedSegments,
	packWeekRowLanes,
	rangesIntersect,
	resolveOffDay,
	segmentOccurrence,
	snapMinutes,
	spansMultipleDays,
	stepDate,
	toZoned,
	zonedStartOfDay,
	type BuildIndexOptions,
	type EventCalendarDayBucket,
	type EventCalendarIndex,
	type EventCalendarWeekRow,
	type ViewDateRanges,
	type ViewRangeOptions,
	type WeekStartsOn,
} from "./event-calendar-lib.js";

// Recurrence: RRULE parsing/serialization and the bounded series expansion.
export {
	EventCalendarRecurrenceError,
	expandRecurrence,
	formatRRuleString,
	MAX_OCCURRENCES,
	parseRRuleString,
} from "./event-calendar-recurrence.js";

export {
	Root,
	Content,
	Nav,
	NavPrev,
	NavNext,
	NavToday,
	Title,
	ViewSwitcher,
	DatePicker,
	Toolbar,
	MonthView,
	MonthWeek,
	MonthCell,
	MoreIndicator,
	TimeGrid,
	DayColumn,
	TimeGutter,
	AllDayBars,
	NowIndicator,
	AgendaView,
	ResourceView,
	EventChip as Event,
	//
	Root as EventCalendar,
	Content as EventCalendarContent,
	Nav as EventCalendarNav,
	NavPrev as EventCalendarNavPrev,
	NavNext as EventCalendarNavNext,
	NavToday as EventCalendarNavToday,
	Title as EventCalendarTitle,
	ViewSwitcher as EventCalendarViewSwitcher,
	DatePicker as EventCalendarDatePicker,
	Toolbar as EventCalendarToolbar,
	MonthView as EventCalendarMonthView,
	MonthWeek as EventCalendarMonthWeek,
	MonthCell as EventCalendarMonthCell,
	MoreIndicator as EventCalendarMoreIndicator,
	TimeGrid as EventCalendarTimeGrid,
	DayColumn as EventCalendarDayColumn,
	TimeGutter as EventCalendarTimeGutter,
	AllDayBars as EventCalendarAllDayBars,
	NowIndicator as EventCalendarNowIndicator,
	AgendaView as EventCalendarAgendaView,
	ResourceView as EventCalendarResourceView,
	EventChip as EventCalendarEvent,
};
