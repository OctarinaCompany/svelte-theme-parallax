/**
 * The event calendar engine: options resolution, state, the imperative api, contexts, and the
 * slot drag-create gesture. Ported from the original source, with the React store
 * (`useSyncExternalStore` + manual snapshot/index caches, event-calendar.tsx:369-930) collapsed
 * into one rune-backed state class: `$derived` already memoizes the ranges and the event index,
 * so every selector hook, equality memo and cache key from upstream simply disappears.
 *
 * Divergences (indexed here, cited as `divergence D-NN` below and in sibling parts):
 * - D-01 — the pointer move/resize engine is not ported. Event
 *   chips cannot be dragged or resized; `interactions.drag`/`interactions.resize`, the per-event
 *   `draggable`/`resizable` flags and the `drag` state field remain in the contract so consumer
 *   code and future work keep their shape, but `drag` stays `null` and `onEventUpdate` /
 *   `canDropEvent` / `onDragBlocked` only fire through `api.updateEvent` (source "api"). Slot
 *   drag-create IS ported (see `beginCreate`), so `onSelectSlot`/`canSelectSlot` work.
 * - D-02 — render overrides port as snippets, and only the ones a consumer realistically reaches
 *   for: `renderEvent`, `renderAgendaEvent`, `renderEventTooltip`, `renderDayHeader`,
 *   `renderResourceHeader`, `renderNoEvents`. The remaining upstream overrides (renderMonthCell,
 *   renderAllDaySection, renderDayColumnBackground, renderMoreContent, the drag previews..)
 *   are dropped with their features intact — the built-in markup always renders.
 * - D-03 — components are not generic over `TData`: Svelte context cannot carry a type parameter
 *   across parts, so the parts operate on `unknown` data while the exported types stay generic.
 */

import { getContext, hasContext, setContext } from "svelte";
import type { Component, Snippet } from "svelte";
import type { Locale } from "date-fns";

import { mergeEventCalendarI18n, type EventCalendarI18nOverrides } from "./event-calendar-i18n.js";
import {
	buildEventIndex,
	defaultEventOrder,
	eventsOverlap,
	getDayKey,
	getRangeKey,
	getViewDateRange,
	snapMinutes,
	stepDate,
	toZoned,
	zonedStartOfDay,
	type EventCalendarDayBucket,
	type EventCalendarIndex,
	type WeekStartsOn,
} from "./event-calendar-lib.js";
import type {
	CalendarEvent,
	CalendarView,
	EventCalendarDateRange,
	EventCalendarDragState,
	EventCalendarEventId,
	EventCalendarInteractions,
	EventCalendarOccurrence,
	EventCalendarOffDaysConfig,
	EventCalendarProposedUpdate,
	EventCalendarRangeInfo,
	EventCalendarResource,
	EventCalendarSegment,
	EventCalendarSelection,
	EventCalendarSlotDraft,
	EventCalendarSlotInfo,
	EventCalendarUpdateResult,
	EventCalendarViewSettings,
} from "./event-calendar-types.js";
import { addDays, addMinutes } from "date-fns";

export const EVENT_CALENDAR_BASE_VIEWS: CalendarView[] = ["month", "week", "day", "days", "agenda"];
export const EVENT_CALENDAR_ALL_VIEWS: CalendarView[] = [...EVENT_CALENDAR_BASE_VIEWS, "resource"];

const DEFAULT_INTERACTIONS: EventCalendarInteractions = {
	drag: true,
	resize: true,
	selectSlot: true,
};

const EMPTY_SELECTION: EventCalendarSelection = { eventKeys: [], slot: null };
const DEFAULT_WEEKEND_DAYS: number[] = [0, 6];
const EMPTY_RESOURCES: EventCalendarResource[] = [];
const EMPTY_BUCKET: EventCalendarDayBucket = { allDay: [], timed: [] };
const EMPTY_BARS: EventCalendarSegment[] = [];

/** Drag-create activation distance in px; below it a press stays a click. */
const CREATE_DISTANCE_PX = 4;

const warned = new Set<string>();
function warnOnce(key: string, message: string) {
	if (!warned.has(key)) {
		warned.add(key);
		console.warn(`[event-calendar] ${message}`);
	}
}

/** Module flag so chip/slot click handlers can ignore the click that ends a drag-create. */
let lastGestureEndedAt = 0;
export function wasRecentDrag(): boolean {
	return performance.now() - lastGestureEndedAt < 250;
}

/**
 * A press that started on an event chip. Slot-create clicks consult this so a press on a chip
 * whose trailing native click retargets to the empty grid does NOT open a create flow.
 */
let lastChipPressAt = 0;
export function markChipPress(): void {
	lastChipPressAt = performance.now();
	window.addEventListener(
		"pointerup",
		() => {
			lastChipPressAt = performance.now();
		},
		{ once: true, capture: true },
	);
}
export function wasRecentChipPress(): boolean {
	return performance.now() - lastChipPressAt < 300;
}

export interface EventCalendarCallbacks<TData = unknown> {
	onEventClick?: (occurrence: EventCalendarOccurrence<TData>, e: MouseEvent) => void;
	onEventDoubleClick?: (occurrence: EventCalendarOccurrence<TData>, e: MouseEvent) => void;
	onEventUpdate?: (update: EventCalendarProposedUpdate<TData>) => EventCalendarUpdateResult;
	canDropEvent?: (update: EventCalendarProposedUpdate<TData>) => boolean;
	/** Reserved for the move/resize engine (divergence D-01); never fired by this theme. */
	onDragBlocked?: (
		occurrence: EventCalendarOccurrence<TData>,
		info: { gesture: "move" | "resize"; reason: "readOnly" | "disabled" | "interactions-off" },
	) => void;
	onSlotClick?: (slot: EventCalendarSlotInfo, e: MouseEvent) => void;
	onSelectSlot?: (slot: EventCalendarSlotDraft) => void;
	canSelectSlot?: (slot: EventCalendarSlotDraft) => boolean;
	onRangeChange?: (info: EventCalendarRangeInfo) => void;
	onViewChange?: (view: CalendarView) => void;
	onDateChange?: (date: Date) => void;
	onDayCountChange?: (count: number) => void;
	onSelectionChange?: (selection: EventCalendarSelection) => void;
	onInteractionsChange?: (interactions: EventCalendarInteractions) => void;
	onViewSettingsChange?: (viewSettings: EventCalendarViewSettings) => void;
	onEventsChange?: (events: CalendarEvent<TData>[]) => void;
	onMoreClick?: (
		day: Date,
		occurrences: EventCalendarOccurrence<TData>[],
		e: MouseEvent,
	) => void | false;
}

/**
 * The headless options. Controlled/uncontrolled pairs follow the upstream contract: a defined
 * controlled value wins, `default*` seeds the internal state once. The root component supplies
 * this object with getters, so every property read is individually reactive.
 */
export interface EventCalendarOptions<TData = unknown> extends EventCalendarCallbacks<TData> {
	readonly events?: CalendarEvent<TData>[];
	readonly defaultEvents?: CalendarEvent<TData>[];
	readonly view?: CalendarView;
	readonly defaultView?: CalendarView;
	readonly date?: Date;
	readonly defaultDate?: Date;
	readonly dayCount?: number;
	readonly defaultDayCount?: number;
	readonly selection?: EventCalendarSelection;
	readonly defaultSelection?: EventCalendarSelection;
	readonly interactions?: Partial<EventCalendarInteractions>;
	readonly defaultInteractions?: Partial<EventCalendarInteractions>;
	readonly viewSettings?: EventCalendarViewSettings;
	readonly defaultViewSettings?: EventCalendarViewSettings;
	readonly loading?: boolean;
	readonly views?: CalendarView[];
	readonly timeZone?: string;
	readonly locale?: Locale;
	readonly weekStartsOn?: WeekStartsOn;
	readonly dayStartHour?: number;
	readonly dayEndHour?: number;
	readonly slotDuration?: number;
	readonly snapDuration?: number;
	readonly agendaDayCount?: number;
	readonly fixedWeeks?: boolean;
	readonly showOutsideDays?: boolean;
	readonly i18n?: EventCalendarI18nOverrides;
	/** Bookable resources for the resource view. */
	readonly resources?: EventCalendarResource[];
	readonly getEventPriority?: (event: CalendarEvent<TData>) => number;
	readonly eventOrder?: (
		a: EventCalendarOccurrence<TData>,
		b: EventCalendarOccurrence<TData>,
	) => number;
	readonly getOccurrences?: (
		event: CalendarEvent<TData>,
		range: EventCalendarDateRange,
		ctx: { timeZone: string },
	) => Array<{ start: Date; end: Date }> | null;
	/**
	 * Weekday numbers (0 = Sunday) treated as the weekend by the "weekends" view toggle.
	 * @default [0, 6]
	 */
	readonly weekendDays?: number[];
}

export interface EventCalendarApi<TData = unknown> {
	next(): void;
	prev(): void;
	today(): void;
	goTo(date: Date): void;
	setView(view: CalendarView, opts?: { dayCount?: number }): void;
	setDayCount(count: number): void;
	getEvents(): CalendarEvent<TData>[];
	getEvent(id: EventCalendarEventId): CalendarEvent<TData> | undefined;
	setEvents(events: CalendarEvent<TData>[]): void;
	addEvent(event: CalendarEvent<TData>): void;
	updateEvent(id: EventCalendarEventId, patch: Partial<CalendarEvent<TData>>): void;
	removeEvent(id: EventCalendarEventId): void;
	getOccurrences(range?: EventCalendarDateRange): EventCalendarOccurrence<TData>[];
	getOccurrencesForDay(day: Date): EventCalendarOccurrence<TData>[];
	findOverlapping(candidate: {
		start: Date;
		end: Date;
		excludeEventId?: string;
	}): EventCalendarOccurrence<TData>[];
	select(selection: Partial<EventCalendarSelection>): void;
	selectEvent(key: string, opts?: { additive?: boolean }): void;
	clearSelection(): void;
	setInteractions(patch: Partial<EventCalendarInteractions>): void;
	setViewSettings(patch: EventCalendarViewSettings): void;
	getVisibleRange(): EventCalendarDateRange;
	getActiveRange(): EventCalendarDateRange;
	/** TZDate in the calendar's display time zone. */
	toZoned(date: Date): Date;
	/** number = minutes from the zoned day start; no-op outside time-grid views. */
	scrollToTime(time: Date | number): void;
}

export interface EventCalendarRenderEventProps<TData = unknown> {
	occurrence: EventCalendarOccurrence<TData>;
	segment: EventCalendarSegment<TData>;
	view: CalendarView;
	isDragging: boolean;
	isSelected: boolean;
}

/**
 * Per-element class hooks, cn()-merged AFTER the built-in classes. Trimmed to the elements this
 * port actually renders (divergence D-01 removes the drag surfaces, D-02 the override-only ones).
 */
export interface EventCalendarClassNames {
	nav?: string;
	toolbar?: string;
	content?: string;
	monthView?: string;
	monthCell?: string;
	timeGrid?: string;
	timeGutter?: string;
	dayColumn?: string;
	allDaySection?: string;
	agendaView?: string;
	event?: string;
	eventTooltip?: string;
	moreIndicator?: string;
	morePopover?: string;
	morePopoverHeader?: string;
	navButton?: string;
	title?: string;
	navTooltip?: string;
	viewSwitcherContent?: string;
	viewSwitcherLabel?: string;
	viewShortcut?: string;
	datePickerContent?: string;
	monthHeader?: string;
	monthDayHeader?: string;
	monthBody?: string;
	monthRow?: string;
	weekNumber?: string;
	monthBarOverlay?: string;
	monthBar?: string;
	monthCellContent?: string;
	monthCellFooter?: string;
	monthDayNumber?: string;
	dayAddButton?: string;
	timeGridHeader?: string;
	timeGutterLabel?: string;
	allDayLabel?: string;
	allDayCell?: string;
	timedChip?: string;
	resourceHeader?: string;
	slotDraft?: string;
	noEvents?: string;
	agendaDay?: string;
	agendaDayHeader?: string;
	agendaItem?: string;
}

/**
 * View-layer configuration: display props and render overrides. These live on `<EventCalendar>`,
 * never in the headless options.
 */
export interface EventCalendarViewConfig {
	scrollToHour: number;
	nowIndicator: boolean;
	/** Grid interval in minutes for the time-based views: gutter slots and gridlines follow it. */
	interval: number;
	maxEventsPerCell: number | "auto";
	showWeekNumbers: boolean;
	enableShortcuts: boolean;
	/**
	 * "contained" (default): the calendar fills its container and views scroll internally.
	 * "page": content flows with the document and the page scrolls.
	 */
	scrollMode: "contained" | "page";
	/** Stick the default nav to the top while the page scrolls. */
	stickyNav: boolean;
	/** Custom per-day indication; applied to month cells, day columns, and all-day cells. */
	dayClassName?: (day: Date) => string | undefined;
	/** Extra classes for the CURRENT day, appended after the built-in highlight. */
	todayClassName?: string;
	/** Show a hover "+" add affordance on month cells next to the day number. */
	showDayAddButton: boolean;
	/** Scroll implementation for internally scrolling surfaces: shadcn ScrollArea or native. */
	scrollbars: "custom" | "native";
	/** Nav button variant; all nav buttons follow it. Default "ghost". */
	navButtonVariant: "ghost" | "outline" | "secondary" | "default";
	/** Nav button size; icon buttons use the icon twin. Default "sm". */
	navButtonSize: "sm" | "default";
	/** Off-day (non-working day) marking; true = weekends with a muted background. */
	offDays?: boolean | EventCalendarOffDaysConfig;
	classNames?: EventCalendarClassNames;
	/** Swap individual view implementations. */
	components?: Partial<Record<CalendarView, Component>>;
	renderEvent?: Snippet<[EventCalendarRenderEventProps]>;
	renderAgendaEvent?: Snippet<[EventCalendarRenderEventProps]>;
	/** Content for the styled hover tooltip (`eventTooltip`). */
	renderEventTooltip?: Snippet<
		[
			{
				occurrence: EventCalendarOccurrence;
				segment: EventCalendarSegment;
				view: CalendarView;
				label: string | undefined;
			},
		]
	>;
	renderDayHeader?: Snippet<[{ day: Date; view: CalendarView; isToday: boolean }]>;
	/** Resource column header cell content; default is resource.title. */
	renderResourceHeader?: Snippet<[{ resource: EventCalendarResource }]>;
	renderNoEvents?: Snippet;
	/** N-day presets offered by the view switcher when the "days" view is enabled. */
	dayCountPresets: number[];
	/** Nav tooltips: false disables them all; an object tunes placement and delay. */
	navTooltips?: false | { side?: "top" | "bottom" | "left" | "right"; delay?: number };
	/**
	 * Styled tooltip on event hover / keyboard focus. `false` (default) keeps only the native
	 * title attribute; `true` shows the standard Tooltip with the event label; an object also
	 * tunes the side and open delay.
	 */
	eventTooltip?: boolean | { side?: "top" | "bottom" | "left" | "right"; delay?: number };
	/** Timed events shorter than this render the compact single-row chip layout. */
	compactEventMinutes: number;
	/** "+N more" popover alignment against its trigger. */
	morePopoverAlign: "start" | "center" | "end";
	/** Now-indicator refresh cadence in milliseconds. */
	nowIndicatorInterval: number;
}

export const DEFAULT_EVENT_CALENDAR_VIEW_CONFIG: EventCalendarViewConfig = {
	scrollToHour: 7,
	nowIndicator: true,
	interval: 60,
	maxEventsPerCell: "auto",
	showWeekNumbers: false,
	enableShortcuts: true,
	scrollMode: "contained",
	stickyNav: false,
	showDayAddButton: false,
	scrollbars: "custom",
	navButtonVariant: "ghost",
	navButtonSize: "sm",
	dayCountPresets: [5],
	eventTooltip: false,
	compactEventMinutes: 45,
	morePopoverAlign: "start",
	nowIndicatorInterval: 30_000,
};

/**
 * One instance per `<EventCalendar>`, published on context. Replaces upstream's store + the
 * whole selector-hook family: rune-derived fields make every read reactive and memoized.
 */
export class EventCalendarRootState<TData = unknown> {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#opts!: EventCalendarOptions<TData>;

	// Uncontrolled internals, seeded from the default* options once at construction.
	#uView: CalendarView = $state("month");
	#uDate: Date = $state(new Date());
	#uDayCount: number = $state(3);
	#uEvents: CalendarEvent<TData>[] = $state([]);
	#uSelection: EventCalendarSelection = $state(EMPTY_SELECTION);
	#uInteractions: EventCalendarInteractions = $state({ ...DEFAULT_INTERACTIONS });
	#uViewSettings: EventCalendarViewSettings = $state({});

	/** In-flight drag-create rectangle; cleared on commit or cancel. */
	slotDraft: EventCalendarSlotDraft | null = $state(null);
	/** Reserved for the move/resize engine (divergence D-01); stays null. */
	readonly drag: EventCalendarDragState<TData> | null = $state(null);
	/**
	 * Bumped at every zoned midnight by the root component's timer, so `isTodayDay` — a pure
	 * wall-clock read no store write would ever refresh — moves on for a calendar left open
	 * overnight (upstream's midnightTicker, event-calendar.tsx:1027-1092).
	 */
	todayTick = $state(0);

	/** The rendered calendar root element, or null before mount. */
	rootEl: HTMLElement | null = null;
	#scrollHandler: ((time: Date | number) => void) | null = null;
	#lastEmittedRangeKey: string | null = null;

	// --- resolved settings -------------------------------------------------------------------
	readonly timeZone: string = $derived(
		this.#opts.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
	);
	readonly locale: Locale | undefined = $derived(this.#opts.locale);
	// locale-first default: a de/fr locale gets Monday weeks without also having to set
	// weekStartsOn; an explicit weekStartsOn always wins
	readonly weekStartsOn: WeekStartsOn = $derived(
		this.#opts.weekStartsOn ?? this.#opts.locale?.options?.weekStartsOn ?? 0,
	);
	readonly resources: EventCalendarResource[] = $derived(this.#opts.resources ?? EMPTY_RESOURCES);
	// the resource view only makes sense with resources configured
	readonly views: CalendarView[] = $derived(
		this.#opts.views ??
			(this.resources.length ? EVENT_CALENDAR_ALL_VIEWS : EVENT_CALENDAR_BASE_VIEWS),
	);
	readonly dayStartHour: number = $derived(this.#opts.dayStartHour ?? 0);
	readonly dayEndHour: number = $derived(this.#opts.dayEndHour ?? 24);
	readonly slotDuration: number = $derived(this.#opts.slotDuration ?? 30);
	readonly snapDuration: number = $derived(this.#opts.snapDuration ?? 15);
	readonly agendaDayCount: number = $derived(this.#opts.agendaDayCount ?? 30);
	readonly fixedWeeks: boolean = $derived(this.#opts.fixedWeeks ?? true);
	readonly showOutsideDays: boolean = $derived(this.#opts.showOutsideDays ?? true);
	readonly i18n = $derived(mergeEventCalendarI18n(this.#opts.i18n));
	readonly weekendDays: number[] = $derived(this.#opts.weekendDays ?? DEFAULT_WEEKEND_DAYS);
	readonly getEventPriority: (event: CalendarEvent<TData>) => number = $derived(
		this.#opts.getEventPriority ?? ((event) => event.priority ?? 0),
	);
	// higher priority packs and orders first; ties fall through to the start/duration/key default
	readonly eventOrder: (
		a: EventCalendarOccurrence<TData>,
		b: EventCalendarOccurrence<TData>,
	) => number = $derived(
		this.#opts.eventOrder ??
			((a, b) =>
				this.getEventPriority(b.event) - this.getEventPriority(a.event) || defaultEventOrder(a, b)),
	);

	// --- resolved state ----------------------------------------------------------------------
	readonly view: CalendarView = $derived(this.resolveView(this.#opts.view ?? this.#uView));
	readonly date: Date = $derived(this.#opts.date ?? this.#uDate);
	readonly dayCount: number = $derived(Math.max(1, this.#opts.dayCount ?? this.#uDayCount));
	readonly events: CalendarEvent<TData>[] = $derived(this.#opts.events ?? this.#uEvents);
	readonly selection: EventCalendarSelection = $derived(this.#opts.selection ?? this.#uSelection);
	readonly interactions: EventCalendarInteractions = $derived(
		this.#opts.interactions
			? { ...DEFAULT_INTERACTIONS, ...this.#opts.interactions }
			: this.#uInteractions,
	);
	readonly viewSettings: EventCalendarViewSettings = $derived(
		this.#opts.viewSettings ?? this.#uViewSettings,
	);
	readonly loading: boolean = $derived(this.#opts.loading ?? false);

	readonly #ranges = $derived.by(() =>
		getViewDateRange(this.view, this.date, {
			timeZone: this.timeZone,
			weekStartsOn: this.weekStartsOn,
			dayCount: this.dayCount,
			agendaDayCount: this.agendaDayCount,
			fixedWeeks: this.fixedWeeks,
		}),
	);
	readonly visibleRange: EventCalendarDateRange = $derived(this.#ranges.visibleRange);
	readonly activeRange: EventCalendarDateRange = $derived(this.#ranges.activeRange);

	/**
	 * The expanded, segmented, packed event index for the visible range. Upstream memoized this
	 * behind a six-field cache key; `$derived` recomputes exactly
	 * when one of the read inputs changes, which is the same contract for free.
	 */
	readonly index: EventCalendarIndex<TData> = $derived.by(() =>
		buildEventIndex(this.events, this.visibleRange, {
			timeZone: this.timeZone,
			weekStartsOn: this.weekStartsOn,
			eventOrder: this.eventOrder,
			getOccurrences: this.#opts.getOccurrences,
		}),
	);

	readonly api: EventCalendarApi<TData>;

	constructor(opts: EventCalendarOptions<TData>) {
		this.#opts = opts;
		this.#uView = opts.defaultView ?? "month";
		this.#uDate = opts.defaultDate ?? new Date();
		this.#uDayCount = opts.defaultDayCount ?? 3;
		this.#uEvents = opts.defaultEvents ?? [];
		this.#uSelection = opts.defaultSelection ?? EMPTY_SELECTION;
		this.#uInteractions = { ...DEFAULT_INTERACTIONS, ...opts.defaultInteractions };
		this.#uViewSettings = opts.defaultViewSettings ?? {};
		this.api = this.#buildApi();
	}

	/** The raw options object, for callback access from sibling parts. */
	get opts(): EventCalendarOptions<TData> {
		return this.#opts;
	}

	resolveView(view: CalendarView): CalendarView {
		if (this.views.includes(view)) return view;
		const fallback = this.views[0] ?? "month";
		warnOnce(
			`view-${view}`,
			`view "${view}" is not in views [${this.views.join(", ")}]; falling back to "${fallback}".`,
		);
		return fallback;
	}

	// --- setters (upstream setField, event-calendar.tsx:522-543) ------------------------------
	// Uncontrolled writes land in the internal field; the paired callback fires either way, and
	// only on a real change (house callback rule).

	setView(view: CalendarView, opts?: { dayCount?: number }): void {
		if (opts?.dayCount !== undefined) this.setDayCount(opts.dayCount);
		const next = this.resolveView(view);
		if (next === this.view) return;
		if (this.#opts.view === undefined) this.#uView = next;
		this.#opts.onViewChange?.(next);
	}

	setDate(date: Date): void {
		if (date.getTime() === this.date.getTime()) return;
		if (this.#opts.date === undefined) this.#uDate = date;
		this.#opts.onDateChange?.(date);
	}

	setDayCount(count: number): void {
		const next = Math.max(1, count);
		if (next === this.dayCount) return;
		if (this.#opts.dayCount === undefined) this.#uDayCount = next;
		this.#opts.onDayCountChange?.(next);
	}

	setEvents(events: CalendarEvent<TData>[]): void {
		if (events === this.events) return;
		if (this.#opts.events === undefined) this.#uEvents = events;
		this.#opts.onEventsChange?.(events);
	}

	setSelection(selection: EventCalendarSelection): void {
		if (selection === this.selection) return;
		if (this.#opts.selection === undefined) this.#uSelection = selection;
		this.#opts.onSelectionChange?.(selection);
	}

	setInteractions(patch: Partial<EventCalendarInteractions>): void {
		const next = { ...this.interactions, ...patch };
		if (
			next.drag === this.interactions.drag &&
			next.resize === this.interactions.resize &&
			next.selectSlot === this.interactions.selectSlot
		) {
			return;
		}
		if (this.#opts.interactions === undefined) this.#uInteractions = next;
		this.#opts.onInteractionsChange?.(next);
	}

	setViewSettings(patch: EventCalendarViewSettings): void {
		const next = { ...this.viewSettings, ...patch };
		if (
			next.weekends === this.viewSettings.weekends &&
			next.weekNumbers === this.viewSettings.weekNumbers &&
			next.nowIndicator === this.viewSettings.nowIndicator &&
			next.offDays === this.viewSettings.offDays
		) {
			return;
		}
		if (this.#opts.viewSettings === undefined) this.#uViewSettings = next;
		this.#opts.onViewSettingsChange?.(next);
	}

	// --- range emission ----------------------------------------------------------------------

	/** Called from the root component's `$effect`; dedupes on view+range+zone like upstream. */
	emitRangeIfChanged(): void {
		if (!this.#opts.onRangeChange) return;
		const key = `${this.view}:${getRangeKey(this.visibleRange)}:${this.timeZone}`;
		if (key === this.#lastEmittedRangeKey) return;
		this.#lastEmittedRangeKey = key;
		this.#opts.onRangeChange({
			range: this.visibleRange,
			activeRange: this.activeRange,
			view: this.view,
			date: this.date,
			timeZone: this.timeZone,
		});
	}

	// --- update pipeline ---------------------------------------------------------------------

	/**
	 * An occurrence key encodes the start instant (id::startISO), so committing a move re-keys the
	 * occurrence and a selection holding the old key would point at nothing. Remapped in the same
	 * commit and emitted BEFORE the events write so a controlled consumer applies the two in a
	 * consistent order.
	 */
	#remapSelectionKey(id: EventCalendarEventId, oldKey: string, nextStart: Date): void {
		const newKey = `${id}::${nextStart.toISOString()}`;
		if (newKey === oldKey) return;
		const selection = this.selection;
		if (!selection.eventKeys.includes(oldKey)) return;
		this.setSelection({
			...selection,
			eventKeys: selection.eventKeys.map((key) => (key === oldKey ? newKey : key)),
		});
	}

	/**
	 * extraPatch: non-timing fields committed in the SAME write. Two sequential events writes
	 * break controlled mode - the second one re-reads the still-stale controlled array and its
	 * onEventsChange payload silently reverts the timing change the first one emitted.
	 */
	applyProposedUpdate(
		update: EventCalendarProposedUpdate<TData>,
		extraPatch?: Partial<CalendarEvent<TData>>,
	): boolean {
		const result = this.#opts.onEventUpdate?.(update);
		if (result === false) return false;
		const adjusted: Partial<CalendarEvent<TData>> =
			result && typeof result === "object"
				? {
						start: result.start ?? update.start,
						end: result.end ?? update.end,
						allDay: result.allDay ?? update.allDay,
					}
				: { start: update.start, end: update.end, allDay: update.allDay };
		if (update.resourceId !== undefined) adjusted.resourceId = update.resourceId;
		// the STORED event holds the pre-commit start, which is what the live occurrence key was
		// built from (update.event already carries the proposal when the call comes from
		// api.updateEvent)
		const stored = this.events.find((event) => event.id === update.event.id);
		const oldKey =
			update.occurrence?.key ?? (stored ? `${stored.id}::${stored.start.toISOString()}` : null);
		if (oldKey) {
			this.#remapSelectionKey(update.event.id, oldKey, adjusted.start ?? update.start);
		}
		const next = this.events.map((event) =>
			event.id === update.event.id ? { ...event, ...extraPatch, ...adjusted } : event,
		);
		this.setEvents(next);
		return true;
	}

	// --- day/week reads for the views ----------------------------------------------------------

	dayBucket(day: Date): EventCalendarDayBucket<TData> {
		return (
			this.index.byDay.get(getDayKey(day, this.timeZone)) ??
			(EMPTY_BUCKET as EventCalendarDayBucket<TData>)
		);
	}

	isTodayDay(day: Date): boolean {
		void this.todayTick; // re-derive after the zoned midnight
		return getDayKey(day, this.timeZone) === getDayKey(new Date(), this.timeZone);
	}

	isOutsideDay(day: Date): boolean {
		const dayStart = zonedStartOfDay(day, this.timeZone);
		return dayStart < this.activeRange.start || dayStart >= this.activeRange.end;
	}

	/**
	 * The laned bar row containing `day`. Matched by CONTAINMENT - any day inside the row resolves
	 * it - so a weekends-hidden month (first visible day Monday) still finds its row.
	 */
	weekRowFor(day: Date): {
		bars: EventCalendarSegment<TData>[];
		laneCount: number;
		rowStart: Date | null;
	} {
		const dayStartMs = zonedStartOfDay(day, this.timeZone).getTime();
		const match = this.index.weekRows.find((row) => {
			const startMs = zonedStartOfDay(row.rowStart, this.timeZone).getTime();
			// calendar-aware row end: a fixed 168h window would let the first day AFTER a
			// spring-forward week (167h long) match the wrong row
			const endMs = zonedStartOfDay(
				addDays(toZoned(row.rowStart, this.timeZone), 7),
				this.timeZone,
			).getTime();
			return dayStartMs >= startMs && dayStartMs < endMs;
		});
		const bars = match?.bars ?? (EMPTY_BARS as EventCalendarSegment<TData>[]);
		return {
			bars,
			laneCount: bars.reduce((max, seg) => Math.max(max, (seg.lane ?? 0) + 1), 0),
			rowStart: match?.rowStart ?? null,
		};
	}

	// --- scroll handler plumbing ---------------------------------------------------------------

	registerScrollHandler(handler: ((time: Date | number) => void) | null): void {
		this.#scrollHandler = handler;
	}

	// --- slot drag-create ------------------------------------------------------------------------
	// The one gesture this theme keeps from the upstream dnd engine (divergence D-01). Pointer
	// capture on window, a 4px activation threshold so a plain click stays a click, Escape
	// cancels; the timed branch tracks minutes inside the origin column, the all-day branch
	// tracks day cells under the pointer via elementFromPoint.

	beginCreate(
		e: PointerEvent,
		day: Date,
		allDay: boolean,
		ctx?: {
			resourceId?: string;
			/** The minute column element; required for a timed create. */
			column?: HTMLElement;
			boundsStartMin?: number;
			boundsEndMin?: number;
		},
	): void {
		if (e.button !== 0) return;
		if (!this.interactions.selectSlot) return;

		const timeZone = this.timeZone;
		const view = this.view;
		const dayStart = zonedStartOfDay(day, timeZone);
		const startX = e.clientX;
		const startY = e.clientY;
		const column = ctx?.column ?? null;
		const boundsStartMin = ctx?.boundsStartMin ?? this.dayStartHour * 60;
		const boundsEndMin = ctx?.boundsEndMin ?? this.dayEndHour * 60;
		let active = false;

		const minutesAt = (clientY: number): number => {
			if (!column) return boundsStartMin;
			const rect = column.getBoundingClientRect();
			const pxPerMinute = rect.height / Math.max(1, boundsEndMin - boundsStartMin);
			const raw = boundsStartMin + (clientY - rect.top) / pxPerMinute;
			return Math.min(Math.max(snapMinutes(raw, this.snapDuration), boundsStartMin), boundsEndMin);
		};
		const anchorMin = allDay ? 0 : minutesAt(startY);

		const dayAt = (clientX: number, clientY: number): Date => {
			for (const el of document.elementsFromPoint(clientX, clientY)) {
				const target = (el as HTMLElement).closest?.("[data-ec-day]") as HTMLElement | null;
				if (target?.dataset.ecDay) return new Date(Number(target.dataset.ecDay));
			}
			return dayStart;
		};

		const update = (ev: PointerEvent) => {
			if (!active) {
				const distance = Math.hypot(ev.clientX - startX, ev.clientY - startY);
				if (distance < CREATE_DISTANCE_PX) return;
				active = true;
			}
			if (allDay) {
				const other = zonedStartOfDay(dayAt(ev.clientX, ev.clientY), timeZone);
				const first = other < dayStart ? other : dayStart;
				const last = other < dayStart ? dayStart : other;
				this.slotDraft = {
					start: first,
					end: addDays(toZoned(last, timeZone), 1),
					allDay: true,
					view,
					resourceId: ctx?.resourceId,
				};
			} else {
				const current = minutesAt(ev.clientY);
				const from = Math.min(anchorMin, current);
				const to = Math.max(anchorMin, current, from + this.snapDuration);
				this.slotDraft = {
					start: addMinutes(dayStart, from),
					end: addMinutes(dayStart, to),
					allDay: false,
					view,
					resourceId: ctx?.resourceId,
				};
			}
		};

		const cleanup = () => {
			window.removeEventListener("pointermove", update);
			window.removeEventListener("pointerup", finish);
			window.removeEventListener("pointercancel", cancel);
			window.removeEventListener("keydown", onKeydown, true);
		};

		const cancel = () => {
			cleanup();
			this.slotDraft = null;
		};

		const onKeydown = (ev: KeyboardEvent) => {
			if (ev.key === "Escape") {
				ev.stopPropagation();
				cancel();
			}
		};

		const finish = () => {
			cleanup();
			const draft = this.slotDraft;
			this.slotDraft = null;
			if (!active || !draft) return;
			// a real drag happened: suppress the trailing click so onSlotClick does not also fire
			lastGestureEndedAt = performance.now();
			if (this.#opts.canSelectSlot?.(draft) === false) return;
			this.setSelection({
				...this.selection,
				slot: { start: draft.start, end: draft.end, allDay: draft.allDay },
			});
			this.#opts.onSelectSlot?.(draft);
		};

		window.addEventListener("pointermove", update);
		window.addEventListener("pointerup", finish);
		window.addEventListener("pointercancel", cancel);
		window.addEventListener("keydown", onKeydown, true);
	}

	// --- api -----------------------------------------------------------------------------------

	#buildApi(): EventCalendarApi<TData> {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const root = this;
		const stepOpts = () => ({
			timeZone: root.timeZone,
			dayCount: root.dayCount,
			agendaDayCount: root.agendaDayCount,
		});
		return {
			next: () => root.setDate(stepDate(root.view, root.date, 1, stepOpts())),
			prev: () => root.setDate(stepDate(root.view, root.date, -1, stepOpts())),
			today: () => root.setDate(new Date()),
			goTo: (date) => root.setDate(date),
			setView: (view, opts) => root.setView(view, opts),
			setDayCount: (count) => root.setDayCount(count),
			getEvents: () => root.events,
			getEvent: (id) => root.events.find((event) => event.id === id),
			setEvents: (events) => root.setEvents(events),
			addEvent: (event) => root.setEvents([...root.events, event]),
			updateEvent(id, patch) {
				const event = root.events.find((candidate) => candidate.id === id);
				if (!event) return;
				const merged = { ...event, ...patch };
				const timingChanged =
					patch.start !== undefined || patch.end !== undefined || patch.allDay !== undefined;
				if (timingChanged && root.#opts.onEventUpdate) {
					// single write: the non-timing rest rides along as extraPatch so controlled mode
					// sees one consistent onEventsChange payload
					const rest = { ...patch };
					delete rest.start;
					delete rest.end;
					delete rest.allDay;
					root.applyProposedUpdate(
						{
							event: merged,
							occurrence: null,
							start: merged.start,
							end: merged.end,
							allDay: merged.allDay ?? false,
							source: "api",
						},
						rest,
					);
					return;
				}
				if (timingChanged) {
					root.#remapSelectionKey(id, `${id}::${event.start.toISOString()}`, merged.start);
				}
				root.setEvents(root.events.map((e) => (e.id === id ? merged : e)));
			},
			removeEvent: (id) => root.setEvents(root.events.filter((event) => event.id !== id)),
			getOccurrences(range) {
				if (!range) return root.index.occurrences;
				const within = range.start >= root.visibleRange.start && range.end <= root.visibleRange.end;
				if (within) {
					return root.index.occurrences.filter((occ) => eventsOverlap(occ, range));
				}
				// outside the visible window: a throwaway expansion (no caching needed here — no
				// render loop can key on the result's identity the way React's
				// useSyncExternalStore did, the original source)
				return buildEventIndex(root.events, range, {
					timeZone: root.timeZone,
					weekStartsOn: root.weekStartsOn,
					eventOrder: root.eventOrder,
					getOccurrences: root.#opts.getOccurrences,
				}).occurrences;
			},
			getOccurrencesForDay(day) {
				const bucket = root.index.byDay.get(getDayKey(day, root.timeZone));
				if (!bucket) return [];
				const seen = new Set<string>();
				const result: EventCalendarOccurrence<TData>[] = [];
				for (const seg of [...bucket.allDay, ...bucket.timed]) {
					if (seen.has(seg.occurrence.key)) continue;
					seen.add(seg.occurrence.key);
					result.push(seg.occurrence);
				}
				return result;
			},
			findOverlapping({ start, end, excludeEventId }) {
				return this.getOccurrences({ start, end }).filter((occ) => occ.eventId !== excludeEventId);
			},
			select(partial) {
				const current = root.selection;
				root.setSelection({
					eventKeys: partial.eventKeys ?? current.eventKeys,
					slot: partial.slot !== undefined ? partial.slot : current.slot,
				});
			},
			selectEvent(key, opts) {
				const current = root.selection;
				const eventKeys = opts?.additive
					? current.eventKeys.includes(key)
						? current.eventKeys.filter((k) => k !== key)
						: [...current.eventKeys, key]
					: [key];
				root.setSelection({ ...current, eventKeys });
			},
			clearSelection: () => root.setSelection(EMPTY_SELECTION),
			setInteractions: (patch) => root.setInteractions(patch),
			setViewSettings: (patch) => root.setViewSettings(patch),
			getVisibleRange: () => root.visibleRange,
			getActiveRange: () => root.activeRange,
			toZoned: (date) => toZoned(date, root.timeZone),
			scrollToTime: (time) => root.#scrollHandler?.(time),
		};
	}
}

/**
 * The effective display toggles after falling back from user `viewSettings` to the root
 * view-config props (upstream useEventCalendarViewSettings, event-calendar.tsx:1301-1321).
 */
export function resolveEffectiveViewSettings(
	root: EventCalendarRootState<never> | EventCalendarRootState,
	viewConfig: EventCalendarViewConfig,
): Required<EventCalendarViewSettings> {
	return {
		weekends: root.viewSettings.weekends ?? true,
		weekNumbers: root.viewSettings.weekNumbers ?? viewConfig.showWeekNumbers,
		nowIndicator: root.viewSettings.nowIndicator ?? viewConfig.nowIndicator,
		offDays:
			root.viewSettings.offDays ??
			(viewConfig.offDays !== undefined && viewConfig.offDays !== false),
	};
}

/** The `offDays` config a cell hands to `resolveOffDay`, honoring the effective toggle. */
export function resolveOffDayConfig(
	effectiveOffDays: boolean,
	configured: boolean | EventCalendarOffDaysConfig | undefined,
): boolean | EventCalendarOffDaysConfig {
	if (!effectiveOffDays) return false;
	return typeof configured === "object" ? configured : true;
}

/** The off-day marker classes; the config's own className wins over the default. */
export function offDayClassName(
	configured: boolean | EventCalendarOffDaysConfig | undefined,
): string {
	return (typeof configured === "object" && configured.className) || "bg-muted/25";
}

// --- contexts ---------------------------------------------------------------------------------

const EVENT_CALENDAR_CONTEXT_KEY = Symbol("event-calendar");
const EVENT_CALENDAR_VIEW_CONFIG_KEY = Symbol("event-calendar-view-config");
const EVENT_CALENDAR_VIEW_KEY = Symbol("event-calendar-view");

export function setEventCalendarContext(state: EventCalendarRootState): EventCalendarRootState {
	return setContext(EVENT_CALENDAR_CONTEXT_KEY, state);
}

export function hasEventCalendarContext(): boolean {
	return hasContext(EVENT_CALENDAR_CONTEXT_KEY);
}

/** Read the calendar's state, throwing when there is no `<EventCalendar>` ancestor. */
export function getEventCalendarContext(
	consumerName = "<EventCalendar.*>",
): EventCalendarRootState {
	if (!hasEventCalendarContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<EventCalendar>\`.`);
	}
	return getContext<EventCalendarRootState>(EVENT_CALENDAR_CONTEXT_KEY);
}

export function setEventCalendarViewConfig(
	config: EventCalendarViewConfig,
): EventCalendarViewConfig {
	return setContext(EVENT_CALENDAR_VIEW_CONFIG_KEY, config);
}

/** Root-level display props + render overrides; defaults when read outside `<EventCalendar>`. */
export function getEventCalendarViewConfig(): EventCalendarViewConfig {
	return hasContext(EVENT_CALENDAR_VIEW_CONFIG_KEY)
		? getContext<EventCalendarViewConfig>(EVENT_CALENDAR_VIEW_CONFIG_KEY)
		: DEFAULT_EVENT_CALENDAR_VIEW_CONFIG;
}

export function setEventCalendarViewContext(ctx: { readonly view: CalendarView }): {
	readonly view: CalendarView;
} {
	return setContext(EVENT_CALENDAR_VIEW_KEY, ctx);
}

/** The rendering view of the nearest view component ("month", "week", ...). */
export function getEventCalendarViewContext(): { readonly view: CalendarView } {
	if (!hasContext(EVENT_CALENDAR_VIEW_KEY)) {
		throw new Error("getEventCalendarViewContext must be called inside a calendar view.");
	}
	return getContext(EVENT_CALENDAR_VIEW_KEY);
}
