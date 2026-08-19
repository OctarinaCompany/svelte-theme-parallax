<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type {
		EventCalendarApi,
		EventCalendarOptions,
		EventCalendarViewConfig,
	} from "./event-calendar.svelte.js";

	/**
	 * Every mounted calendar, in mount order. The view shortcuts listen on `window` so they
	 * work without first clicking into a calendar — but a bare keypress must not switch every
	 * mounted instance at once (the gallery page mounts a few dozen). Focus inside a calendar
	 * scopes the event to that instance; with focus outside every calendar, only the
	 * earliest-mounted one answers.
	 */
	const shortcutOwners: { el: () => HTMLElement | null }[] = [];

	/** The merged attribute payload handed to the `child` snippet. */
	export type EventCalendarChildProps = {
		"data-slot": "event-calendar";
		class: string;
	} & Record<string, unknown>;

	export type EventCalendarProps = WithElementRef<HTMLAttributes<HTMLDivElement>> &
		EventCalendarOptions &
		Partial<EventCalendarViewConfig> & {
			/**
			 * Imperative escape hatch usable from outside the tree: `bind:api` and call
			 * `api.setView(...)`, `api.addEvent(...)`, ... Replaces upstream's `apiRef`.
			 */
			api?: EventCalendarApi;
			/**
			 * Render the calendar onto your own element instead of the default `<div>`. Replaces
			 * upstream's `asChild` (Radix `Slot`). The snippet receives the merged props to spread,
			 * plus the default children to render inside.
			 */
			child?: Snippet<[{ props: EventCalendarChildProps; children?: Snippet }]>;
		};
</script>

<script lang="ts">
	import { addDays } from "date-fns";

	import { toZoned, zonedStartOfDay } from "./event-calendar-lib.js";
	import {
		DEFAULT_EVENT_CALENDAR_VIEW_CONFIG,
		EventCalendarRootState,
		setEventCalendarContext,
		setEventCalendarViewConfig,
	} from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		api = $bindable(),
		class: className,
		children,
		child,
		// headless options (controlled + defaults + settings + callbacks)
		events,
		defaultEvents,
		view,
		defaultView,
		date,
		defaultDate,
		dayCount,
		defaultDayCount,
		selection,
		defaultSelection,
		interactions,
		defaultInteractions,
		viewSettings,
		defaultViewSettings,
		loading,
		views,
		timeZone,
		locale,
		weekStartsOn,
		dayStartHour,
		dayEndHour,
		slotDuration,
		snapDuration,
		agendaDayCount,
		fixedWeeks,
		showOutsideDays,
		i18n,
		resources,
		getEventPriority,
		eventOrder,
		getOccurrences,
		weekendDays,
		onEventClick,
		onEventDoubleClick,
		onEventUpdate,
		canDropEvent,
		onDragBlocked,
		onSlotClick,
		onSelectSlot,
		canSelectSlot,
		onRangeChange,
		onViewChange,
		onDateChange,
		onDayCountChange,
		onSelectionChange,
		onInteractionsChange,
		onViewSettingsChange,
		onEventsChange,
		onMoreClick,
		// view config
		scrollToHour,
		nowIndicator,
		interval,
		maxEventsPerCell,
		showWeekNumbers,
		enableShortcuts,
		scrollMode,
		stickyNav,
		dayClassName,
		todayClassName,
		showDayAddButton,
		scrollbars,
		navButtonVariant,
		navButtonSize,
		offDays,
		classNames,
		components,
		renderEvent,
		renderAgendaEvent,
		renderEventTooltip,
		renderDayHeader,
		renderResourceHeader,
		renderNoEvents,
		dayCountPresets,
		navTooltips,
		eventTooltip,
		compactEventMinutes,
		morePopoverAlign,
		nowIndicatorInterval,
		...restProps
	}: EventCalendarProps = $props();

	// Getter-based options: each property read inside the state class tracks exactly the prop it
	// reads, replacing upstream's OPTION_KEYS diffing.
	const root = new EventCalendarRootState({
		get events() {
			return events;
		},
		get defaultEvents() {
			return defaultEvents;
		},
		get view() {
			return view;
		},
		get defaultView() {
			return defaultView;
		},
		get date() {
			return date;
		},
		get defaultDate() {
			return defaultDate;
		},
		get dayCount() {
			return dayCount;
		},
		get defaultDayCount() {
			return defaultDayCount;
		},
		get selection() {
			return selection;
		},
		get defaultSelection() {
			return defaultSelection;
		},
		get interactions() {
			return interactions;
		},
		get defaultInteractions() {
			return defaultInteractions;
		},
		get viewSettings() {
			return viewSettings;
		},
		get defaultViewSettings() {
			return defaultViewSettings;
		},
		get loading() {
			return loading;
		},
		get views() {
			return views;
		},
		get timeZone() {
			return timeZone;
		},
		get locale() {
			return locale;
		},
		get weekStartsOn() {
			return weekStartsOn;
		},
		get dayStartHour() {
			return dayStartHour;
		},
		get dayEndHour() {
			return dayEndHour;
		},
		get slotDuration() {
			return slotDuration;
		},
		get snapDuration() {
			return snapDuration;
		},
		get agendaDayCount() {
			return agendaDayCount;
		},
		get fixedWeeks() {
			return fixedWeeks;
		},
		get showOutsideDays() {
			return showOutsideDays;
		},
		get i18n() {
			return i18n;
		},
		get resources() {
			return resources;
		},
		get getEventPriority() {
			return getEventPriority;
		},
		get eventOrder() {
			return eventOrder;
		},
		get getOccurrences() {
			return getOccurrences;
		},
		get weekendDays() {
			return weekendDays;
		},
		get onEventClick() {
			return onEventClick;
		},
		get onEventDoubleClick() {
			return onEventDoubleClick;
		},
		get onEventUpdate() {
			return onEventUpdate;
		},
		get canDropEvent() {
			return canDropEvent;
		},
		get onDragBlocked() {
			return onDragBlocked;
		},
		get onSlotClick() {
			return onSlotClick;
		},
		get onSelectSlot() {
			return onSelectSlot;
		},
		get canSelectSlot() {
			return canSelectSlot;
		},
		get onRangeChange() {
			return onRangeChange;
		},
		get onViewChange() {
			return onViewChange;
		},
		get onDateChange() {
			return onDateChange;
		},
		get onDayCountChange() {
			return onDayCountChange;
		},
		get onSelectionChange() {
			return onSelectionChange;
		},
		get onInteractionsChange() {
			return onInteractionsChange;
		},
		get onViewSettingsChange() {
			return onViewSettingsChange;
		},
		get onEventsChange() {
			return onEventsChange;
		},
		get onMoreClick() {
			return onMoreClick;
		},
	});
	setEventCalendarContext(root);

	// Same getter treatment for the view config, with the defaults applied per key so an
	// undefined prop never erases a default.
	const defaults = DEFAULT_EVENT_CALENDAR_VIEW_CONFIG;
	setEventCalendarViewConfig({
		get scrollToHour() {
			return scrollToHour ?? defaults.scrollToHour;
		},
		get nowIndicator() {
			return nowIndicator ?? defaults.nowIndicator;
		},
		get interval() {
			return interval ?? defaults.interval;
		},
		get maxEventsPerCell() {
			return maxEventsPerCell ?? defaults.maxEventsPerCell;
		},
		get showWeekNumbers() {
			return showWeekNumbers ?? defaults.showWeekNumbers;
		},
		get enableShortcuts() {
			return enableShortcuts ?? defaults.enableShortcuts;
		},
		get scrollMode() {
			return scrollMode ?? defaults.scrollMode;
		},
		get stickyNav() {
			return stickyNav ?? defaults.stickyNav;
		},
		get dayClassName() {
			return dayClassName;
		},
		get todayClassName() {
			return todayClassName;
		},
		get showDayAddButton() {
			return showDayAddButton ?? defaults.showDayAddButton;
		},
		get scrollbars() {
			return scrollbars ?? defaults.scrollbars;
		},
		get navButtonVariant() {
			return navButtonVariant ?? defaults.navButtonVariant;
		},
		get navButtonSize() {
			return navButtonSize ?? defaults.navButtonSize;
		},
		get offDays() {
			return offDays;
		},
		get classNames() {
			return classNames;
		},
		get components() {
			return components;
		},
		get renderEvent() {
			return renderEvent;
		},
		get renderAgendaEvent() {
			return renderAgendaEvent;
		},
		get renderEventTooltip() {
			return renderEventTooltip;
		},
		get renderDayHeader() {
			return renderDayHeader;
		},
		get renderResourceHeader() {
			return renderResourceHeader;
		},
		get renderNoEvents() {
			return renderNoEvents;
		},
		get dayCountPresets() {
			return dayCountPresets ?? defaults.dayCountPresets;
		},
		get navTooltips() {
			return navTooltips;
		},
		get eventTooltip() {
			return eventTooltip ?? defaults.eventTooltip;
		},
		get compactEventMinutes() {
			return compactEventMinutes ?? defaults.compactEventMinutes;
		},
		get morePopoverAlign() {
			return morePopoverAlign ?? defaults.morePopoverAlign;
		},
		get nowIndicatorInterval() {
			return nowIndicatorInterval ?? defaults.nowIndicatorInterval;
		},
	});

	// The imperative handle: assigned once, stable for the component's lifetime.
	$effect.pre(() => {
		api = root.api;
	});

	// onRangeChange: fires once for the initial range and again whenever view/range/zone change
	// (upstream emits from notify() + a mount effect, the original source 950-954).
	$effect(() => {
		root.emitRangeIfChanged();
	});

	// One timer armed for the next zoned midnight, so today highlighting moves on for a calendar
	// left open overnight; an interval would tick thousands of times a day to catch one
	// transition.
	$effect(() => {
		const timeZone = root.timeZone;
		void root.todayTick; // re-arm after each fire
		const now = new Date();
		const next = zonedStartOfDay(addDays(toZoned(now, timeZone), 1), timeZone).getTime();
		const timer = setTimeout(
			() => {
				root.todayTick += 1;
			},
			Math.max(1000, next - now.getTime()),
		);
		return () => clearTimeout(timer);
	});

	// Register the root element so gesture code can resolve day cells from portaled surfaces
	// (the "+N more" popover).
	$effect(() => {
		root.rootEl = ref;
		return () => {
			root.rootEl = null;
		};
	});

	// This instance's entry in the module-scope owner list — see its comment for the rule.
	const shortcutOwner = { el: () => ref };
	$effect(() => {
		shortcutOwners.push(shortcutOwner);
		return () => {
			const index = shortcutOwners.indexOf(shortcutOwner);
			if (index !== -1) shortcutOwners.splice(index, 1);
		};
	});

	// The view shortcuts the switcher's <kbd> hints advertise: a bare letter switches to the
	// matching view (i18n viewShortcuts), a digit matching a dayCountPresets entry opens the
	// N-day view. Skipped while focus sits in a text field or while a chord modifier is held.
	function handleShortcutKeydown(e: KeyboardEvent) {
		if (!(enableShortcuts ?? defaults.enableShortcuts)) return;
		if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
		if (e.key.length !== 1) return;
		const target = e.target;
		if (
			target instanceof HTMLElement &&
			(target.isContentEditable ||
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				target instanceof HTMLSelectElement)
		) {
			return;
		}
		const active = document.activeElement;
		const focused = shortcutOwners.find((owner) => {
			const el = owner.el();
			return el !== null && active !== null && el.contains(active);
		});
		if (focused ? focused !== shortcutOwner : shortcutOwners[0] !== shortcutOwner) return;
		if (root.views.includes("days") && /^\d$/.test(e.key)) {
			const count = Number(e.key);
			if ((dayCountPresets ?? defaults.dayCountPresets).includes(count)) {
				e.preventDefault();
				root.api.setView("days", { dayCount: count });
			}
			return;
		}
		const key = e.key.toLowerCase();
		const match = root.views.find(
			(candidate) => root.i18n.labels.viewShortcuts[candidate]?.toLowerCase() === key,
		);
		if (match) {
			e.preventDefault();
			root.api.setView(match);
		}
	}

	// text-xs is the calendar-wide default type size; because it sits before `class`, a consumer
	// can override the whole scale with e.g. class="text-sm" and every inheriting element
	// follows. Portaled surfaces ("+N more" popover) pin the size explicitly since DOM
	// inheritance does not cross a portal.
	const rootAttrs = $derived({
		"data-slot": "event-calendar",
		...restProps,
		class: cn("flex min-h-0 min-w-0 flex-col text-xs", className),
	} as EventCalendarChildProps);
</script>

<svelte:window onkeydown={handleShortcutKeydown} />

{#if child}
	{@render child({ props: rootAttrs, children })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
