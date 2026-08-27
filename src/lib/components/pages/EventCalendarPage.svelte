<script lang="ts">
	import {
		addDays,
		addMinutes,
		differenceInMinutes,
		format,
		setHours,
		startOfDay,
		startOfWeek,
	} from "date-fns";
	import type { Locale } from "date-fns";
	import { ar, de, es, fr, ja } from "date-fns/locale";
	import InfoIcon from "@lucide/svelte/icons/info";
	import * as Alert from "$lib/components/ui/alert/index.js";

	import CodeIcon from "@lucide/svelte/icons/code";
	import CompassIcon from "@lucide/svelte/icons/compass";
	import FlagIcon from "@lucide/svelte/icons/flag";
	import ListIcon from "@lucide/svelte/icons/list";
	import MegaphoneIcon from "@lucide/svelte/icons/megaphone";
	import PaletteIcon from "@lucide/svelte/icons/palette";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import Settings2Icon from "@lucide/svelte/icons/settings-2";

	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as EventCalendar from "$lib/components/ui/event-calendar/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { EVENT_CALENDAR_COLORS } from "$lib/components/ui/event-calendar/index.js";
	import type {
		CalendarEvent,
		CalendarView,
		EventCalendarApi,
		EventCalendarI18nOverrides,
		EventCalendarOccurrence,
		EventCalendarRenderEventProps,
		EventCalendarResource,
		EventCalendarSegment,
		EventCalendarSlotDraft,
		EventCalendarSlotInfo,
		EventCalendarViewSettings,
	} from "$lib/components/ui/event-calendar/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { cn } from "$lib/utils.js";

	/**
	 * The Event calendar component page — its five demos in the order that
	 * page gives them.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. Its calendar surface is a static month table in
	 * the reference docs: no hour track, no resource columns, no agenda, no event model.
	 * Everything here belongs to the ported component in `$lib/components/ui/event-calendar/`,
	 * which documents its own translation decisions file by file.
	 *
	 * TWO THINGS SHAPE EVERY SECTION BELOW.
	 *
	 * 1. NO EVENT DRAG-AND-DROP. The theme's engine header lists this as divergence D-01: the
	 *    pointer move/resize engine is not ported, so an existing chip cannot be dragged to
	 *    another day or stretched by its edge. Slot drag-create IS ported, so drawing across empty
	 *    time still works and `onSelectSlot` / `canSelectSlot` still fire. Upstream demos that
	 *    advertise "drag to reschedule" therefore say so in a blurb here and reach for
	 *    `api.updateEvent` or a dialog instead; the `interactions.drag` / `interactions.resize`
	 *    switches upstream puts in its settings panel are dropped rather than left inert.
	 *
	 * 2. COLOURS COME FROM THE COMPONENT'S OWN PRESET LIST. §8 of `docs/CONVENTIONS.md` forbids
	 *    raw palette colours in markup, and upstream writes `var(--color-blue-500)` inline all over
	 *    these demos. `EVENT_CALENDAR_COLORS` is the escape hatch the component itself exports for
	 *    exactly this: palette *values* a consumer picks an event colour from, justified in
	 *    `event-calendar-event.svelte`. Every colour on this page is looked up from it by name
	 *    through {@link ecColor}, so no section hard-codes a hue.
	 *
	 * `renderEvent` is a snippet here, not a function returning a node — which means it cannot
	 * "return undefined to fall back". A snippet that customises only some events has to render a
	 * default arm itself; §"All views and live settings" below is the one that does.
	 */

	/**
	 * An event colour by preset name, from the component's exported palette. Falls back to the
	 * chip's own default so a typo degrades to a themed chip rather than an unstyled one.
	 */
	function ecColor(name: string): string {
		return (
			EVENT_CALENDAR_COLORS.find((entry) => entry.name === name)?.value ?? "var(--color-primary)"
		);
	}

	/** Payload of the styled event tooltip; a different shape from `renderEvent`'s. */
	type EventTooltipProps = {
		occurrence: EventCalendarOccurrence;
		segment: EventCalendarSegment;
		view: CalendarView;
		label: string | undefined;
	};

	/* ---------------------------------------------------------------------------------------
	 * 1. All views and live settings
	 * ------------------------------------------------------------------------------------ */

	/**
	 * Team members — passing resources unlocks the resource day view, so the view switcher offers
	 * every view the calendar ships.
	 */
	const TEAM: EventCalendarResource[] = [
		{ id: "alex", title: "Alex", color: ecColor("Blue") },
		{ id: "mia", title: "Mia", color: ecColor("Violet") },
		{ id: "sam", title: "Sam", color: ecColor("Emerald") },
	];

	/**
	 * Demo events: a balanced current week (timed, multi-day, all-day, two custom-rendered chips)
	 * plus a light scatter in the nearby weeks so the month view reads naturally without crowding
	 * any cell.
	 */
	function buildTeamEvents(anchor: Date): CalendarEvent[] {
		const week = startOfWeek(startOfDay(anchor), { weekStartsOn: 0 });
		const at = (dayOffset: number, hour: number, minute = 0) =>
			addMinutes(setHours(addDays(week, dayOffset), hour), minute);
		const day = (dayOffset: number) => addDays(week, dayOffset);

		return [
			{
				id: "team-sync",
				title: "Team sync",
				start: at(1, 9),
				end: at(1, 9, 30),
				resourceId: "alex",
			},
			{
				id: "design-review",
				title: "Design review",
				start: at(2, 11),
				end: at(2, 12),
				resourceId: "mia",
				color: ecColor("Violet"),
			},
			{
				id: "product-demo",
				title: "Product demo",
				start: at(3, 15),
				end: at(3, 16),
				resourceId: "sam",
				color: ecColor("Emerald"),
			},
			{
				id: "roadmap-planning",
				title: "Roadmap planning",
				start: at(4, 10),
				end: at(4, 11, 30),
				resourceId: "alex",
				color: ecColor("Indigo"),
			},
			{
				id: "client-call",
				title: "Client call",
				start: at(5, 14),
				end: at(5, 15),
				resourceId: "mia",
				color: ecColor("Amber"),
			},
			{
				id: "team-offsite",
				title: "Team offsite",
				start: day(4),
				end: day(6),
				allDay: true,
				color: ecColor("Rose"),
			},
			{
				id: "sprint-planning",
				title: "Sprint planning",
				start: at(9, 9, 30),
				end: at(9, 10, 30),
				resourceId: "sam",
				color: ecColor("Blue"),
			},
			{
				id: "quarterly-review",
				title: "Quarterly review",
				start: at(17, 13),
				end: at(17, 14, 30),
				resourceId: "alex",
				color: ecColor("Cyan"),
			},
		];
	}

	const teamEvents = buildTeamEvents(new Date());

	/**
	 * i18n presets — each language ships a date-fns `locale` (which localizes every formatted
	 * date: weekday headers, month title, time gutter) plus an `i18n` override map for the static
	 * UI strings the locale cannot reach (Today, view names, "+N more"). Arabic also flips the
	 * whole calendar to right-to-left. English is the built-in default, so it leaves both unset.
	 */
	type DemoLocale = {
		id: string;
		/** Native language name, shown in the picker. */
		label: string;
		locale: Locale | undefined;
		dir: "ltr" | "rtl";
		i18n: EventCalendarI18nOverrides | undefined;
	};

	const LOCALES: DemoLocale[] = [
		{ id: "en", label: "English", locale: undefined, dir: "ltr", i18n: undefined },
		{
			id: "de",
			label: "Deutsch",
			locale: de,
			dir: "ltr",
			i18n: {
				labels: {
					today: "Heute",
					allDay: "Ganztägig",
					noEvents: "Keine Termine",
					more: (count) => `+${count} weitere`,
				},
				viewNames: {
					month: "Monat",
					week: "Woche",
					day: "Tag",
					days: (count) => `${count} Tage`,
					agenda: "Agenda",
					resource: "Zeitraster",
				},
			},
		},
		{
			id: "fr",
			label: "Français",
			locale: fr,
			dir: "ltr",
			i18n: {
				labels: {
					today: "Aujourd'hui",
					allDay: "Journée entière",
					noEvents: "Aucun événement",
					more: (count) => `+${count} autres`,
				},
				viewNames: {
					month: "Mois",
					week: "Semaine",
					day: "Jour",
					days: (count) => `${count} jours`,
					agenda: "Agenda",
					resource: "Grille horaire",
				},
			},
		},
		{
			id: "es",
			label: "Español",
			locale: es,
			dir: "ltr",
			i18n: {
				labels: {
					today: "Hoy",
					allDay: "Todo el día",
					noEvents: "Sin eventos",
					more: (count) => `+${count} más`,
				},
				viewNames: {
					month: "Mes",
					week: "Semana",
					day: "Día",
					days: (count) => `${count} días`,
					agenda: "Agenda",
					resource: "Cuadrícula",
				},
			},
		},
		{
			id: "ja",
			label: "日本語",
			locale: ja,
			dir: "ltr",
			i18n: {
				labels: {
					today: "今日",
					allDay: "終日",
					noEvents: "予定なし",
					more: (count) => `他${count}件`,
				},
				viewNames: {
					month: "月",
					week: "週",
					day: "日",
					days: (count) => `${count}日間`,
					agenda: "予定",
					resource: "タイムグリッド",
				},
			},
		},
		{
			id: "ar",
			label: "العربية",
			locale: ar,
			dir: "rtl",
			i18n: {
				labels: {
					today: "اليوم",
					allDay: "طوال اليوم",
					noEvents: "لا توجد أحداث",
					more: (count) => `+${count} المزيد`,
				},
				viewNames: {
					month: "شهر",
					week: "أسبوع",
					day: "يوم",
					days: (count) => `${count} أيام`,
					agenda: "جدول الأعمال",
					resource: "شبكة زمنية",
				},
			},
		},
	];

	/**
	 * Display time zones — all event math and rendering happen in the chosen zone, so switching it
	 * visibly shifts every event's clock time.
	 */
	const TIME_ZONES: Array<{ id: string; label: string; value?: string }> = [
		{ id: "local", label: "Browser" },
		{ id: "ny", label: "New York", value: "America/New_York" },
		{ id: "london", label: "London", value: "Europe/London" },
		{ id: "tokyo", label: "Tokyo", value: "Asia/Tokyo" },
		{ id: "kolkata", label: "Kolkata", value: "Asia/Kolkata" },
	];

	/** Everything the settings panel drives, as one resettable object. */
	type DemoSettings = {
		viewSettings: EventCalendarViewSettings;
		selectSlot: boolean;
		weekStartsOn: 0 | 1;
		dayStartHour: number;
		dayEndHour: number;
		interval: number;
		snapDuration: number;
		eventTooltip: boolean;
		showDayAddButton: boolean;
		localeId: string;
		timeZoneId: string;
	};

	function defaultTeamSettings(): DemoSettings {
		return {
			viewSettings: { weekends: true, weekNumbers: false, nowIndicator: true, offDays: false },
			selectSlot: true,
			weekStartsOn: 0,
			dayStartHour: 0,
			dayEndHour: 24,
			interval: 60,
			snapDuration: 15,
			eventTooltip: false,
			showDayAddButton: false,
			localeId: "en",
			timeZoneId: "local",
		};
	}

	let teamSettings = $state<DemoSettings>(defaultTeamSettings());
	let teamApi = $state<EventCalendarApi>();
	let teamView = $state<CalendarView>("month");
	let teamSettingsTab = $state("view");
	let teamEventCount = 0;

	// Time-grid internals only exist where an hour track renders — month and agenda have none, so
	// the tab that tunes them follows the active view.
	const teamIsTimeGrid = $derived(teamView !== "month" && teamView !== "agenda");
	const teamLocale = $derived(
		LOCALES.find((entry) => entry.id === teamSettings.localeId) ?? LOCALES[0],
	);
	const teamTimeZone = $derived(
		TIME_ZONES.find((entry) => entry.id === teamSettings.timeZoneId) ?? TIME_ZONES[0],
	);

	// Leaving the time grid while its tab is open would show an empty panel.
	$effect(() => {
		if (!teamIsTimeGrid && teamSettingsTab === "time") teamSettingsTab = "view";
	});

	/** Add a one-hour event at noon today and jump to it — a minimal stand-in for a create dialog. */
	function addTeamEvent() {
		if (!teamApi) return;
		const start = setHours(startOfDay(new Date()), 12);
		teamApi.addEvent({
			id: `new-event-${teamEventCount++}`,
			title: "New event",
			start,
			end: addMinutes(start, 60),
			resourceId: "alex",
			color: ecColor("Blue"),
		});
		teamApi.goTo(start);
	}

	/* ---------------------------------------------------------------------------------------
	 * 2. Resource view for room bookings
	 * ------------------------------------------------------------------------------------ */

	/** Rooms become columns in the resource day view — the time grid tuned for booking boards. */
	const ROOMS: EventCalendarResource[] = [
		{ id: "r101", title: "101 · King", color: ecColor("Blue") },
		{ id: "r102", title: "102 · Queen", color: ecColor("Emerald") },
		{ id: "r204", title: "204 · Twin", color: ecColor("Violet") },
		{ id: "r301", title: "Suite 301", color: ecColor("Amber") },
	];

	/**
	 * One source of truth for booking status: it drives both the chip colour and the legend, so
	 * the two can never drift apart.
	 */
	type BookingStatus = "occupied" | "checkout" | "housekeeping" | "checkin";

	const BOOKING_STATUS: Record<BookingStatus, { label: string; color: string }> = {
		occupied: { label: "Occupied", color: ecColor("Emerald") },
		checkout: { label: "Check-out", color: ecColor("Rose") },
		housekeeping: { label: "Housekeeping", color: ecColor("Cyan") },
		checkin: { label: "Check-in", color: ecColor("Blue") },
	};

	const BOOKING_STATUS_KEYS = Object.keys(BOOKING_STATUS) as BookingStatus[];

	/**
	 * A hotel's day of room activity — stays, turnovers, housekeeping and check-ins — anchored to
	 * today so the resource view opens full.
	 */
	function buildBookings(anchor: Date): CalendarEvent[] {
		const base = startOfDay(anchor);
		// Fractional hours (11.5 = 11:30) resolve through minutes so half-hour turnovers land
		// precisely.
		const at = (hour: number) => addMinutes(base, Math.round(hour * 60));

		const booking = (
			id: string,
			title: string,
			startHour: number,
			endHour: number,
			resourceId: string,
			status: BookingStatus,
		): CalendarEvent => ({
			id,
			title,
			start: at(startHour),
			end: at(endHour),
			resourceId,
			color: BOOKING_STATUS[status].color,
			data: { status },
		});

		return [
			// 101 — morning stay, turnover, afternoon check-in
			booking("stay-reed", "Occupied · Reed", 8, 10, "r101", "occupied"),
			booking("checkout-reed", "Check-out · Reed", 10, 10.5, "r101", "checkout"),
			booking("clean-101", "Housekeeping", 10.5, 12, "r101", "housekeeping"),
			booking("checkin-alvarez", "Check-in · Alvarez", 14, 15, "r101", "checkin"),
			// 102 — long stay with a late-afternoon turnover
			booking("stay-chen", "Occupied · Chen", 8, 16, "r102", "occupied"),
			booking("checkout-chen", "Check-out · Chen", 16, 16.5, "r102", "checkout"),
			booking("clean-102", "Housekeeping", 16.5, 18, "r102", "housekeeping"),
			// 204 — midday turnover into an evening stay
			booking("checkout-novak", "Check-out · Novak", 11, 11.5, "r204", "checkout"),
			booking("clean-204", "Deep clean", 11.5, 13, "r204", "housekeeping"),
			booking("checkin-ford", "Check-in · Ford", 15, 16, "r204", "checkin"),
			booking("stay-ford", "Occupied · Ford", 16, 20, "r204", "occupied"),
			// Suite 301 — early prep, mid-morning check-in, VIP stay
			booking("clean-301", "Housekeeping", 8, 9.5, "r301", "housekeeping"),
			booking("checkin-osei", "Check-in · Osei", 10, 11, "r301", "checkin"),
			booking("stay-osei", "Occupied · Osei", 11, 20, "r301", "occupied"),
		];
	}

	const bookingEvents = buildBookings(new Date());
	let bookingApi = $state<EventCalendarApi>();
	let bookingCount = 0;

	/** Add a one-hour booking at noon in the first room and jump to it. */
	function addBooking() {
		if (!bookingApi) return;
		const start = setHours(startOfDay(new Date()), 12);
		bookingApi.addEvent({
			id: `booking-${bookingCount++}`,
			title: "New booking",
			start,
			end: addMinutes(start, 60),
			resourceId: "r101",
			color: BOOKING_STATUS.checkin.color,
			data: { status: "checkin" },
		});
		bookingApi.goTo(start);
	}

	/* ---------------------------------------------------------------------------------------
	 * 3. Create and edit dialog
	 * ------------------------------------------------------------------------------------ */

	/** The five colours the editor offers, from the component's preset list. */
	const CRUD_COLORS = EVENT_CALENDAR_COLORS.filter((entry) =>
		["Blue", "Violet", "Emerald", "Amber", "Rose"].includes(entry.name),
	);

	const CRUD_START_HOURS = Array.from({ length: 13 }, (_, index) => index + 7); // 07:00 – 19:00
	const CRUD_DURATIONS = [
		{ value: 30, label: "30 min" },
		{ value: 60, label: "1 hour" },
		{ value: 90, label: "1.5 hours" },
		{ value: 120, label: "2 hours" },
	];

	/**
	 * The one dialog is a create form when `id` is null and an edit form otherwise — a single
	 * working copy that the calendar's clicks seed.
	 */
	type EventDraft = {
		id: string | null;
		title: string;
		date: Date;
		startHour: number;
		duration: number;
		allDay: boolean;
		color: string;
	};

	function buildCrudEvents(anchor: Date): CalendarEvent[] {
		const week = startOfWeek(startOfDay(anchor), { weekStartsOn: 0 });
		const at = (dayOffset: number, hour: number) => setHours(addDays(week, dayOffset), hour);
		return [
			{
				id: "kickoff",
				title: "Project kickoff",
				start: at(1, 10),
				end: at(1, 11),
				color: ecColor("Blue"),
			},
			{
				id: "1on1",
				title: "1:1 with Mia",
				start: at(2, 14),
				end: at(2, 15),
				color: ecColor("Violet"),
			},
			{
				id: "review",
				title: "Design review",
				start: at(4, 11),
				end: at(4, 12),
				color: ecColor("Emerald"),
			},
			{
				id: "standup",
				title: "Team standup",
				start: at(3, 9),
				end: addMinutes(at(3, 9), 30),
				color: ecColor("Amber"),
			},
			{
				id: "interview",
				title: "Candidate interview",
				start: at(5, 13),
				end: at(5, 14),
				color: ecColor("Rose"),
			},
			{
				id: "retro",
				title: "Sprint retro",
				start: at(5, 16),
				end: at(5, 17),
				color: ecColor("Violet"),
			},
		];
	}

	const crudEvents = buildCrudEvents(new Date());
	let crudApi = $state<EventCalendarApi>();
	let crudOpen = $state(false);
	let crudDraft = $state<EventDraft | null>(null);
	let crudCounter = 0;

	const crudIsEdit = $derived(crudDraft?.id != null);
	const crudCanSave = $derived((crudDraft?.title ?? "").trim().length > 0);

	/** Seed a blank create draft for a day — shared by the empty-slot click and the toolbar button. */
	function seedCreate(date: Date) {
		crudDraft = {
			id: null,
			title: "",
			date: startOfDay(date),
			startHour: 9,
			duration: 60,
			allDay: false,
			color: CRUD_COLORS[0].value,
		};
		crudOpen = true;
	}

	/** Event click → seed an edit draft from the event itself, which is the source of truth. */
	function seedEdit(occurrence: EventCalendarOccurrence) {
		const event = occurrence.event;
		crudDraft = {
			id: String(event.id),
			title: event.title,
			date: startOfDay(event.start),
			startHour: event.start.getHours(),
			duration: Math.max(30, differenceInMinutes(event.end, event.start)),
			allDay: event.allDay ?? false,
			color: event.color ?? CRUD_COLORS[0].value,
		};
		crudOpen = true;
	}

	function saveDraft() {
		if (!crudApi || !crudDraft || !crudCanSave) return;
		const draft = crudDraft;
		const start = draft.allDay ? draft.date : setHours(draft.date, draft.startHour);
		const end = draft.allDay ? addDays(draft.date, 1) : addMinutes(start, draft.duration);
		const patch = {
			title: draft.title.trim(),
			start,
			end,
			allDay: draft.allDay,
			color: draft.color,
		};
		if (draft.id === null) {
			crudApi.addEvent({ id: `evt-${crudCounter++}`, ...patch });
		} else {
			crudApi.updateEvent(draft.id, patch);
		}
		crudOpen = false;
	}

	function removeDraft() {
		if (!crudApi || !crudDraft?.id) return;
		crudApi.removeEvent(crudDraft.id);
		crudOpen = false;
	}

	/* ---------------------------------------------------------------------------------------
	 * 4. Custom event chips
	 * ------------------------------------------------------------------------------------ */

	type Category = "design" | "engineering" | "marketing" | "product";

	/** One source of truth per track: the bar colour, its legend label and its leading icon. */
	const CATEGORY: Record<Category, { label: string; color: string }> = {
		design: { label: "Design", color: ecColor("Violet") },
		engineering: { label: "Engineering", color: ecColor("Cyan") },
		marketing: { label: "Marketing", color: ecColor("Orange") },
		product: { label: "Product", color: ecColor("Teal") },
	};

	const CATEGORY_KEYS = Object.keys(CATEGORY) as Category[];

	/**
	 * A month of cross-functional work as multi-day all-day bars, anchored to the current week so
	 * the month opens full.
	 */
	function buildProjects(anchor: Date): CalendarEvent[] {
		const week = startOfWeek(startOfDay(anchor), { weekStartsOn: 1 });
		const day = (offset: number) => addDays(week, offset);

		const span = (
			id: string,
			title: string,
			startOffset: number,
			endOffset: number,
			category: Category,
		): CalendarEvent => ({
			id,
			title,
			// all-day, end-exclusive: [startOffset, endOffset) covers whole days
			start: day(startOffset),
			end: day(endOffset),
			allDay: true,
			color: CATEGORY[category].color,
			data: { category },
		});

		return [
			span("onboarding", "Onboarding revamp", -2, 1, "product"),
			span("design-sprint", "Design sprint", 1, 4, "design"),
			span("api-migration", "API migration", 2, 6, "engineering"),
			span("user-research", "User research", 3, 5, "product"),
			span("brand-refresh", "Brand refresh", 8, 10, "design"),
			span("launch", "Launch campaign", 9, 13, "marketing"),
			span("roadmap", "Roadmap review", 15, 16, "engineering"),
		];
	}

	const projectEvents = buildProjects(new Date());
	let projectApi = $state<EventCalendarApi>();
	let projectCounter = 0;

	/** The theme's parts operate on `unknown` data (divergence D-03), so a demo narrows its own. */
	function categoryOf(event: CalendarEvent): Category | undefined {
		return (event.data as { category?: Category } | undefined)?.category;
	}

	/** Add a multi-day design project starting today and jump to it. */
	function addProject() {
		if (!projectApi) return;
		const start = startOfDay(new Date());
		projectApi.addEvent({
			id: `project-${projectCounter++}`,
			title: "New project",
			start,
			end: addDays(start, 3),
			allDay: true,
			color: CATEGORY.design.color,
			data: { category: "design" },
		});
		projectApi.goTo(start);
	}

	/** Add a single-day product milestone today. */
	function addMilestone() {
		if (!projectApi) return;
		const start = startOfDay(new Date());
		projectApi.addEvent({
			id: `milestone-${projectCounter++}`,
			title: "Milestone",
			start,
			end: addDays(start, 1),
			allDay: true,
			color: CATEGORY.product.color,
			data: { category: "product" },
		});
		projectApi.goTo(start);
	}

	/* ---------------------------------------------------------------------------------------
	 * 5. Drag-to-book appointments
	 * ------------------------------------------------------------------------------------ */

	/** Each service type carries its own hue, so the day reads as a colour-coded schedule. */
	const SERVICE = {
		consultation: { label: "Consultation", color: ecColor("Violet") },
		followup: { label: "Follow-up", color: ecColor("Indigo") },
		assessment: { label: "Assessment", color: ecColor("Amber") },
		therapy: { label: "Therapy", color: ecColor("Rose") },
	} as const;

	type Service = keyof typeof SERVICE;

	const NEW_APPOINTMENT_COLOR = ecColor("Emerald");

	type ApptData = { client: string; initials: string; service?: Service };

	/**
	 * A consultant's day with colour-coded appointments and deliberate gaps to draw into, anchored
	 * to today so the day view opens on real appointments.
	 */
	function buildAppointments(anchor: Date): CalendarEvent[] {
		const base = startOfDay(anchor);
		const at = (hour: number, minute = 0) => addMinutes(setHours(base, hour), minute);

		const appt = (
			id: string,
			client: string,
			initials: string,
			service: Service,
			startHour: number,
			startMinute: number,
			minutes: number,
		): CalendarEvent => {
			const start = at(startHour, startMinute);
			return {
				id,
				title: client,
				start,
				end: addMinutes(start, minutes),
				color: SERVICE[service].color,
				data: { client, initials, service },
			};
		};

		return [
			appt("a1", "Dana Whitfield", "DW", "consultation", 9, 0, 45),
			appt("a2", "Marco Reyes", "MR", "followup", 11, 0, 45),
			appt("a3", "Priya Nair", "PN", "assessment", 14, 0, 60),
			appt("a4", "Leon Fischer", "LF", "therapy", 16, 0, 45),
		];
	}

	const appointmentEvents = buildAppointments(new Date());
	let appointmentApi = $state<EventCalendarApi>();
	let appointmentCounter = 0;

	function apptDataOf(event: CalendarEvent): ApptData | undefined {
		return event.data as ApptData | undefined;
	}

	/**
	 * Drag across an open span to book it. The calendar reports the drawn slot but inserts
	 * nothing — `onSelectSlot` is where the appointment is actually created, so a real app opens a
	 * form or calls an API here instead.
	 */
	function bookSlot(slot: EventCalendarSlotDraft) {
		if (!appointmentApi) return;
		appointmentApi.addEvent({
			id: `appt-${appointmentCounter++}`,
			title: "New appointment",
			start: slot.start,
			end: slot.end,
			color: NEW_APPOINTMENT_COLOR,
			data: { client: "New appointment", initials: "+" },
		});
	}

	/** Refuse a draw that would overlap an existing appointment — returning false cancels it. */
	function canBookSlot(slot: EventCalendarSlotDraft): boolean {
		if (!appointmentApi) return true;
		return appointmentApi.findOverlapping({ start: slot.start, end: slot.end }).length === 0;
	}

	/** Book the first open 45-minute slot in business hours — the toolbar's take on the gesture. */
	function addAppointment() {
		if (!appointmentApi) return;
		const base = startOfDay(new Date());
		for (let minutes = 9 * 60; minutes + 45 <= 18 * 60; minutes += 30) {
			const start = addMinutes(base, minutes);
			const end = addMinutes(start, 45);
			if (appointmentApi.findOverlapping({ start, end }).length === 0) {
				appointmentApi.addEvent({
					id: `appt-${appointmentCounter++}`,
					title: "New appointment",
					start,
					end,
					color: NEW_APPOINTMENT_COLOR,
					data: { client: "New appointment", initials: "+" },
				});
				appointmentApi.goTo(start);
				return;
			}
		}
	}

	// API reference
	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "events",
			type: "CalendarEvent<TData>[]",
			default: "—",
			description:
				"Controlled event list. When defined it wins over the internal list, and every api write (setEvents, addEvent, updateEvent, removeEvent) only reaches you through `onEventsChange`.",
		},
		{
			prop: "defaultEvents",
			type: "CalendarEvent<TData>[]",
			default: "[]",
			description:
				"Seeds the internal list once at construction when `events` is undefined; later changes to it are ignored.",
		},
		{
			prop: "view",
			type: "CalendarView",
			default: "—",
			description:
				"Controlled view. A value missing from `views` warns once in the console and renders `views[0]` instead.",
		},
		{
			prop: "defaultView",
			type: "CalendarView",
			default: "'month'",
			description: "Initial view when uncontrolled; goes through the same `views` fallback.",
		},
		{
			prop: "date",
			type: "Date",
			default: "—",
			description:
				"Controlled anchor instant, read in `timeZone`: the month, week, day or N-day window containing it becomes the active range.",
		},
		{
			prop: "defaultDate",
			type: "Date",
			default: "new Date()",
			description: "Initial anchor when uncontrolled.",
		},
		{
			prop: "dayCount",
			type: "number",
			default: "—",
			description: "Controlled column count of the `'days'` view; a value below 1 is read as 1.",
		},
		{
			prop: "defaultDayCount",
			type: "number",
			default: "3",
			description:
				"Initial column count of the `'days'` view when uncontrolled; a switcher preset replaces it through `setView('days', { dayCount })`.",
		},
		{
			prop: "selection",
			type: "EventCalendarSelection",
			default: "—",
			description:
				"Controlled selection: `eventKeys` holds occurrence keys (`id::startISO`), `slot` the last committed drag-create range or null. A chip click replaces the keys; `api.selectEvent(key, { additive: true })` toggles one.",
		},
		{
			prop: "defaultSelection",
			type: "EventCalendarSelection",
			default: "{ eventKeys: [], slot: null }",
			description: "Initial selection when uncontrolled.",
		},
		{
			prop: "interactions",
			type: "Partial<EventCalendarInteractions>",
			default: "—",
			description:
				"Controlled gesture switches, merged over `{ drag: true, resize: true, selectSlot: true }`. Only `selectSlot` does anything in this theme — false disables drag-create on every surface; `drag` and `resize` keep the contract's shape but chips are never dragged or resized.",
		},
		{
			prop: "defaultInteractions",
			type: "Partial<EventCalendarInteractions>",
			default: "—",
			description:
				"Merged over the same defaults once at construction when `interactions` is undefined.",
		},
		{
			prop: "viewSettings",
			type: "EventCalendarViewSettings",
			default: "—",
			description:
				"Controlled display toggles. Each undefined field defers to a root prop: `weekends` to true, `weekNumbers` to `showWeekNumbers`, `nowIndicator` to `nowIndicator`, `offDays` to whether `offDays` is set.",
		},
		{
			prop: "defaultViewSettings",
			type: "EventCalendarViewSettings",
			default: "{}",
			description: "Initial toggles when uncontrolled.",
		},
		{
			prop: "loading",
			type: "boolean",
			default: "false",
			description:
				"Stamps `data-loading` on `EventCalendar.Content`, which then ignores pointer events and dims to 60% opacity. Nothing else changes — a spinner is yours to render.",
		},
		{
			prop: "views",
			type: "CalendarView[]",
			default: "EVENT_CALENDAR_BASE_VIEWS",
			description:
				"Views the switcher offers and the shortcuts reach: month, week, day, days and agenda, plus resource when `resources` is non-empty. The first entry is the fallback for an unlisted `view`.",
		},
		{
			prop: "timeZone",
			type: "string",
			default: "Intl.DateTimeFormat().resolvedOptions().timeZone",
			description:
				"IANA display zone. Every day boundary, title, gutter label and today test is computed in it rather than in the browser zone; all-day events must start and end at midnight in this zone.",
		},
		{
			prop: "locale",
			type: "Locale",
			default: "—",
			description:
				"date-fns locale for every formatted string. Its `options.weekStartsOn` becomes the default `weekStartsOn`, and its `code` drives the date picker's calendar (en-US when unset).",
		},
		{
			prop: "weekStartsOn",
			type: "WeekStartsOn",
			default: "0",
			description:
				"First column of the month and week grids and the basis of week numbers. Unset, it follows `locale.options.weekStartsOn`, then Sunday.",
		},
		{
			prop: "dayStartHour",
			type: "number",
			default: "0",
			description:
				"First hour of the timed track in the week, day, N-day and resource views. Chips starting earlier are clipped to it, and a drag-create cannot begin above it.",
		},
		{
			prop: "dayEndHour",
			type: "number",
			default: "24",
			description:
				"Exclusive last hour of the timed track. The now indicator hides while the current minute lies outside `dayStartHour`–`dayEndHour`.",
		},
		{
			prop: "slotDuration",
			type: "number",
			default: "30",
			description:
				"Length in minutes of the slot a plain click on empty time-grid space reports to `onSlotClick` (`date` to `date + slotDuration`); the click position is clamped so the slot ends inside the day bounds.",
		},
		{
			prop: "snapDuration",
			type: "number",
			default: "15",
			description:
				"Minute grid that a click position and each drag-create edge round to; a drag-create draft is never shorter than one snap.",
		},
		{
			prop: "agendaDayCount",
			type: "number",
			default: "30",
			description:
				"Days the agenda lists from the anchor, and the distance prev/next step in that view. A value below 1 counts as 1.",
		},
		{
			prop: "fixedWeeks",
			type: "boolean",
			default: "true",
			description:
				"The month grid always spans six rows (42 days) so its height never jumps between months; false renders only the rows the month needs.",
		},
		{
			prop: "showOutsideDays",
			type: "boolean",
			default: "true",
			description:
				"false makes the leading and trailing cells of neighbouring months invisible; they keep their grid slot, so bars still lane correctly.",
		},
		{
			prop: "i18n",
			type: "EventCalendarI18nOverrides",
			default: "—",
			description:
				"Per-key overrides of `labels`, `viewNames`, `formats` and `functions`, shallow-merged per section into `DEFAULT_EVENT_CALENDAR_I18N`; a partial section never erases its siblings, and the default functions read the merged labels and formats.",
		},
		{
			prop: "resources",
			type: "EventCalendarResource[]",
			default: "[]",
			description:
				"Bookable resources. Leaves (no `children`) become the columns of the resource view; a non-empty list also adds `'resource'` to the default `views`.",
		},
		{
			prop: "getEventPriority",
			type: "(event: CalendarEvent<TData>) => number",
			default: "(event) => event.priority ?? 0",
			description:
				"Packing prominence: a higher number orders and lanes first. Ignored when `eventOrder` is supplied.",
		},
		{
			prop: "eventOrder",
			type: "(a: EventCalendarOccurrence<TData>, b: EventCalendarOccurrence<TData>) => number",
			default: "—",
			description:
				"Replaces the whole occurrence sort. The default sorts by priority descending, then start ascending, then longer first, then key.",
		},
		{
			prop: "getOccurrences",
			type: "(event: CalendarEvent<TData>, range: EventCalendarDateRange, ctx: { timeZone: string }) => Array<{ start: Date; end: Date }> | null",
			default: "—",
			description:
				"Custom expansion of an event into instances for the visible range; return null to fall back to the built-in RRULE expansion. Returned instances are flagged `isRecurring`, indexed in order, and still lose any instant a `recurringEventId` override replaces.",
		},
		{
			prop: "weekendDays",
			type: "number[]",
			default: "[0, 6]",
			description:
				"Weekday numbers (0 = Sunday) the weekends toggle hides in the month, week and N-day grids; also the default off-day set and the `data-weekend` marker on month cells.",
		},
		{
			prop: "onEventClick",
			type: "(occurrence: EventCalendarOccurrence<TData>, e: MouseEvent) => void",
			default: "—",
			description:
				"Called on every chip click before the built-in selection; `e.preventDefault()` skips the selection. Agenda rows never select. Not called for the click that ends a drag-create.",
		},
		{
			prop: "onEventDoubleClick",
			type: "(occurrence: EventCalendarOccurrence<TData>, e: MouseEvent) => void",
			default: "—",
			description:
				"Called on a chip double-click after the chip's own `ondblclick`; the event is stopped before it reaches the day cell.",
		},
		{
			prop: "onEventUpdate",
			type: "(update: EventCalendarProposedUpdate<TData>) => EventCalendarUpdateResult",
			default: "—",
			description:
				"Called when `api.updateEvent` changes `start`, `end` or `allDay` (`source: 'api'` — chips are never dragged here). Return false to reject the write, an object to adjust its start/end/allDay, anything else to accept.",
		},
		{
			prop: "canDropEvent",
			type: "(update: EventCalendarProposedUpdate<TData>) => boolean",
			default: "—",
			description: "Reserved for the move/resize engine this theme does not ship; never called.",
		},
		{
			prop: "onDragBlocked",
			type: "(occurrence: EventCalendarOccurrence<TData>, info: { gesture: 'move' | 'resize'; reason: 'readOnly' | 'disabled' | 'interactions-off' }) => void",
			default: "—",
			description: "Reserved for the same engine; never called.",
		},
		{
			prop: "onSlotClick",
			type: "(slot: EventCalendarSlotInfo, e: MouseEvent) => void",
			default: "—",
			description:
				"Called on a click on empty space: a month or all-day cell reports an all-day point (no `end`), a time-grid column a snapped timed slot of `slotDuration` with its `resourceId`, the month add button its day. Not called for the click that ends a drag-create or for a press that started on a chip.",
		},
		{
			prop: "onSelectSlot",
			type: "(slot: EventCalendarSlotDraft) => void",
			default: "—",
			description:
				"Called when a drag-create is released (at least 4px of movement; Escape cancels) and `canSelectSlot` did not refuse it, after `selection.slot` was committed to the same range. Nothing is inserted — creating the event is yours.",
		},
		{
			prop: "canSelectSlot",
			type: "(slot: EventCalendarSlotDraft) => boolean",
			default: "—",
			description:
				"Consulted with the finished draft; false discards it silently, with no selection change and no `onSelectSlot`.",
		},
		{
			prop: "onRangeChange",
			type: "(info: EventCalendarRangeInfo) => void",
			default: "—",
			description:
				"Called once after mount and again whenever the view, the visible range or `timeZone` changes, deduped on those three. `range` includes outside days — fetch remote events for that one.",
		},
		{
			prop: "onViewChange",
			type: "(view: CalendarView) => void",
			default: "—",
			description:
				"Called on a real view change from the switcher, a shortcut or `api.setView`, in both modes, with the value already resolved against `views`.",
		},
		{
			prop: "onDateChange",
			type: "(date: Date) => void",
			default: "—",
			description:
				"Called when prev/next/today, the date picker or `api.goTo` move the anchor to a different instant; a same-instant write is dropped.",
		},
		{
			prop: "onDayCountChange",
			type: "(count: number) => void",
			default: "—",
			description:
				"Called when the N-day count changes (a preset, a digit shortcut, `api.setDayCount`) with the clamped value, never below 1.",
		},
		{
			prop: "onSelectionChange",
			type: "(selection: EventCalendarSelection) => void",
			default: "—",
			description:
				"Called on chip selection, drag-create commit, `api.select`/`selectEvent`/`clearSelection`, and when a timing update re-keys a selected occurrence — that re-key is emitted before the matching `onEventsChange`.",
		},
		{
			prop: "onInteractionsChange",
			type: "(interactions: EventCalendarInteractions) => void",
			default: "—",
			description:
				"Called by `api.setInteractions` with the full merged object, only when a flag actually changed.",
		},
		{
			prop: "onViewSettingsChange",
			type: "(viewSettings: EventCalendarViewSettings) => void",
			default: "—",
			description:
				"Called by `api.setViewSettings` with the merged object, only when one of `weekends`, `weekNumbers`, `nowIndicator` or `offDays` changed.",
		},
		{
			prop: "onEventsChange",
			type: "(events: CalendarEvent<TData>[]) => void",
			default: "—",
			description:
				"Called with the next array on every api write (`setEvents`, `addEvent`, `updateEvent`, `removeEvent`), in both modes; a write handing back the same array reference is dropped.",
		},
		{
			prop: "onMoreClick",
			type: "(day: Date, occurrences: EventCalendarOccurrence<TData>[], e: MouseEvent) => void | false",
			default: "—",
			description:
				"Called on a “+N more” click with only the hidden occurrences of that cell; return false to keep the built-in popover closed and show your own.",
		},
		{
			prop: "scrollToHour",
			type: "number",
			default: "7",
			description:
				"Hour the timed track scrolls to when a time-grid or resource view mounts. Contained scroll mode only — page mode has no internal viewport.",
		},
		{
			prop: "nowIndicator",
			type: "boolean",
			default: "true",
			description:
				"Shows the current-time line across the time-grid and resource views; `viewSettings.nowIndicator` overrides it when set.",
		},
		{
			prop: "interval",
			type: "number",
			default: "60",
			description:
				"Gutter-slot and gridline spacing in minutes for the time-based views, clamped to 5–240; when it is not a multiple of 60 the gutter labels slots with `formats.timeGutterMinute` instead of `formats.timeGutter`.",
		},
		{
			prop: "maxEventsPerCell",
			type: "number | 'auto'",
			default: "'auto'",
			description:
				"Rows a month cell shows before “+N more”. `'auto'` measures the cell height in contained scroll mode and falls back to 3 in page mode; multi-day bars consume rows before single-day chips.",
		},
		{
			prop: "showWeekNumbers",
			type: "boolean",
			default: "false",
			description:
				"Adds the week-number column to the month grid; `viewSettings.weekNumbers` overrides it when set.",
		},
		{
			prop: "enableShortcuts",
			type: "boolean",
			default: "true",
			description:
				"Single-key view shortcuts on `window` (the letters in `i18n.labels.viewShortcuts`, a digit from `dayCountPresets`) and the `<kbd>` hints in the switcher. Skipped while a text field has focus or a modifier is held; with several calendars mounted the one holding focus answers, otherwise the first mounted.",
		},
		{
			prop: "scrollMode",
			type: "'contained' | 'page'",
			default: "'contained'",
			description:
				"`'contained'` caps the calendar at its container and scrolls each view internally; `'page'` lets the views grow with their content and the document scroll, which also disables `scrollToHour`, `api.scrollToTime` and the `'auto'` cell cap.",
		},
		{
			prop: "stickyNav",
			type: "boolean",
			default: "false",
			description:
				"Makes the default `EventCalendar.Nav` stick to the top on a solid background, for the page scroll mode.",
		},
		{
			prop: "dayClassName",
			type: "(day: Date) => string | undefined",
			default: "—",
			description:
				"Per-day classes appended to month cells, day columns and all-day cells; called with the zoned day start.",
		},
		{
			prop: "todayClassName",
			type: "string",
			default: "—",
			description:
				"Extra classes for the current day, appended after the built-in highlight on month cells and time-grid day headers — and the only tint a today column gets in the time grid.",
		},
		{
			prop: "showDayAddButton",
			type: "boolean",
			default: "false",
			description:
				"Reveals a “+” button on month-cell hover and focus next to the day number; it reports the day to `onSlotClick` without bubbling to the cell.",
		},
		{
			prop: "scrollbars",
			type: "'custom' | 'native'",
			default: "'custom'",
			description:
				"Scroller of the internally scrolling surfaces (time track, agenda, “+N more” popover): the ScrollArea component or native overflow. Switching re-wires the scroll handling and re-measures the scrollbar gutter.",
		},
		{
			prop: "navButtonVariant",
			type: "'ghost' | 'outline' | 'secondary' | 'default'",
			default: "'ghost'",
			description:
				"Button variant of every nav part (Today, switcher, prev/next, date picker); a `variant` on the part itself wins.",
		},
		{
			prop: "navButtonSize",
			type: "'sm' | 'default'",
			default: "'sm'",
			description:
				"Button size of the nav parts; the icon buttons (prev, next, date picker) use the matching `icon-sm` / `icon` size.",
		},
		{
			prop: "offDays",
			type: "boolean | EventCalendarOffDaysConfig",
			default: "—",
			description:
				"Marks non-working days with `data-off` and a muted background: true uses `weekendDays`, an object adds explicit `dates`, an `isOffDay` predicate and its own `className`. Unset means off, unless `viewSettings.offDays` is true — then `weekendDays` are marked.",
		},
		{
			prop: "classNames",
			type: "EventCalendarClassNames",
			default: "—",
			description:
				"Per-element class hooks merged after the built-in classes of each named element (`nav`, `monthCell`, `timedChip`, …); a part's own `class` is merged after these.",
		},
		{
			prop: "components",
			type: "Partial<Record<CalendarView, Component>>",
			default: "—",
			description:
				"Replaces the built-in component of a view inside `EventCalendar.Content`; a key holding undefined keeps the default instead of rendering nothing. Content's own `components` wins over this one.",
		},
		{
			prop: "renderEvent",
			type: "Snippet<[EventCalendarRenderEventProps]>",
			default: "—",
			description:
				"Replaces the chip content in the month, week, day, N-day and resource views — the tinted button wrapper stays. Receives `occurrence`, `segment`, `view`, `isDragging` and `isSelected`.",
		},
		{
			prop: "renderAgendaEvent",
			type: "Snippet<[EventCalendarRenderEventProps]>",
			default: "—",
			description:
				"The same for agenda rows only; unset, the agenda renders its own time–dot–title row, not `renderEvent`.",
		},
		{
			prop: "renderEventTooltip",
			type: "Snippet<[{ occurrence: EventCalendarOccurrence; segment: EventCalendarSegment; view: CalendarView; label: string | undefined }]>",
			default: "—",
			description:
				"Content of the styled tooltip that `eventTooltip` enables; `label` is the native title text (title and time range).",
		},
		{
			prop: "renderDayHeader",
			type: "Snippet<[{ day: Date; view: CalendarView; isToday: boolean }]>",
			default: "—",
			description:
				"Replaces the weekday header cells of the month grid and the day headers of the time grid; `day` is the zoned day start.",
		},
		{
			prop: "renderResourceHeader",
			type: "Snippet<[{ resource: EventCalendarResource }]>",
			default: "—",
			description: "Replaces the column header text (`resource.title`) in the resource view.",
		},
		{
			prop: "renderNoEvents",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the icon-and-label empty state of the agenda when no day in its window has events.",
		},
		{
			prop: "dayCountPresets",
			type: "number[]",
			default: "[5]",
			description:
				"Counts the switcher lists as “N days” entries when the `'days'` view is enabled; each is also a digit shortcut.",
		},
		{
			prop: "navTooltips",
			type: "false | { side?: 'top' | 'bottom' | 'left' | 'right'; delay?: number }",
			default: "—",
			description:
				"Tooltips on the nav buttons: unset shows them on top after 600 ms, false removes them all, an object tunes the side and the first-open delay (moving between buttons is instant).",
		},
		{
			prop: "eventTooltip",
			type: "boolean | { side?: 'top' | 'bottom' | 'left' | 'right'; delay?: number }",
			default: "false",
			description:
				"Styled tooltip on chip hover and focus. false keeps only the native `title` attribute; true (or an object tuning side and delay) shows the Tooltip component and drops the `title` so the two never stack.",
		},
		{
			prop: "compactEventMinutes",
			type: "number",
			default: "45",
			description:
				"Timed chips shorter than this render the single-row layout; from this length up the title stacks over the time range and fade-truncates in narrow columns.",
		},
		{
			prop: "morePopoverAlign",
			type: "'start' | 'center' | 'end'",
			default: "'start'",
			description: "Alignment of the “+N more” popover against its trigger.",
		},
		{
			prop: "nowIndicatorInterval",
			type: "number",
			default: "30000",
			description:
				"Refresh period of the now indicator in milliseconds; it also refreshes on tab focus and visibility change.",
		},
		{
			prop: "api",
			type: "EventCalendarApi<TData>",
			default: "undefined",
			description:
				"Bindable; assigned the imperative handle once before the first paint (`next`, `prev`, `today`, `goTo`, `setView`, `addEvent`, `updateEvent`, `removeEvent`, `select`, `scrollToTime`, …) and stable for the component's lifetime. Read it; never assign it.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered div. Stays null in `child` mode, so the keyboard shortcuts can no longer be scoped to focus inside this instance.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: EventCalendarChildProps; children?: Snippet }]>",
			default: "—",
			description:
				"Renders the calendar onto your own element instead of the default div: spread `props` (`data-slot`, the merged `class`, the rest attributes) and render `children` inside. Replaces upstream's `asChild`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The parts — typically `EventCalendar.Nav`, `EventCalendar.Toolbar` and `EventCalendar.Content`, in any layout.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged after the built-in flex column and the `text-xs` type base, so a `text-*` class here rescales every element that inherits the calendar's type size (portaled surfaces pin their own).",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div, or handed to `child` inside `props`.",
		},
	];

	const contentProps: PropRow[] = [
		{
			prop: "components",
			type: "Partial<Record<CalendarView, Component>>",
			default: "—",
			description:
				"Per-view replacement, resolved per key with a fallback so an undefined entry keeps the default; wins over the root `components`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the switchboard entirely; call `getEventCalendarContext()` inside to build a view of your own.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the built-in flex classes and `classNames.content`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div.",
		},
	];

	const navProps: PropRow[] = [
		{
			prop: "showViewSwitcher",
			type: "boolean",
			default: "true",
			description:
				"false leaves the switcher out of the composed layout (a fixed-view embed); the keyboard shortcuts still switch views unless `enableShortcuts` is off.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the composed layout entirely, including the shared tooltip provider; compose the nav parts yourself.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged after the built-in wrapping row, the `stickyNav` classes and `classNames.nav`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div.",
		},
	];

	const navPrevProps: PropRow[] = [
		{
			prop: "tooltip",
			type: "string | null",
			default: "—",
			description:
				"Tooltip text. Unset shows `i18n.labels.previous`; null removes the tooltip for this button only (`navTooltips={false}` on the root removes them all).",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler<HTMLButtonElement> & MouseEventHandler<HTMLAnchorElement>",
			default: "—",
			description:
				"Runs before the navigation; `e.preventDefault()` inside it cancels the step. Typed as `Button`'s button-and-anchor intersection because an `href` in the spread turns the button into an anchor.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "navButtonVariant",
			description:
				"Forwarded to the Button; overrides the root `navButtonVariant` for this button.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'icon-sm'",
			description:
				"Forwarded to the Button; the default is the icon twin of `navButtonSize` (`'icon'` when that is `'default'`).",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Replaces the chevron icon; the `aria-label` stays.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after `classNames.navButton`.",
		},
		{
			prop: "...restProps",
			type: "Omit<ButtonProps, 'children'>",
			default: "—",
			description:
				"Merged onto the Button with `mergeProps`, so a caller handler chains with the tooltip trigger's own instead of replacing it.",
		},
	];

	const navNextProps: PropRow[] = [
		{
			prop: "tooltip",
			type: "string | null",
			default: "—",
			description:
				"Tooltip text. Unset shows `i18n.labels.next`; null removes the tooltip for this button only.",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler<HTMLButtonElement> & MouseEventHandler<HTMLAnchorElement>",
			default: "—",
			description:
				"Runs before the navigation; `e.preventDefault()` inside it cancels the step. Typed as `Button`'s button-and-anchor intersection because an `href` in the spread turns the button into an anchor.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "navButtonVariant",
			description:
				"Forwarded to the Button; overrides the root `navButtonVariant` for this button.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'icon-sm'",
			description:
				"Forwarded to the Button; the default is the icon twin of `navButtonSize` (`'icon'` when that is `'default'`).",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Replaces the chevron icon; the `aria-label` stays.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after `classNames.navButton`.",
		},
		{
			prop: "...restProps",
			type: "Omit<ButtonProps, 'children'>",
			default: "—",
			description:
				"Merged onto the Button with `mergeProps`, so a caller handler chains with the tooltip trigger's own instead of replacing it.",
		},
	];

	const navTodayProps: PropRow[] = [
		{
			prop: "tooltip",
			type: "string | null",
			default: "—",
			description:
				"Tooltip text. Unset shows today's date formatted with `formats.dayTitle` in the display zone — information the label itself does not carry; null removes this button's tooltip.",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler<HTMLButtonElement> & MouseEventHandler<HTMLAnchorElement>",
			default: "—",
			description:
				"Runs before the jump to now; `e.preventDefault()` inside it cancels the jump. Typed as `Button`'s button-and-anchor intersection because an `href` in the spread turns the button into an anchor.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "navButtonVariant",
			description:
				"Forwarded to the Button; overrides the root `navButtonVariant` for this button.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "navButtonSize",
			description: "Forwarded to the Button; a text button, so no icon twin.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Replaces the `i18n.labels.today` text.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after `classNames.navButton`.",
		},
		{
			prop: "...restProps",
			type: "Omit<ButtonProps, 'children'>",
			default: "—",
			description:
				"Merged onto the Button with `mergeProps`, so a caller handler chains with the tooltip trigger's own instead of replacing it.",
		},
	];

	const titleProps: PropRow[] = [
		{
			prop: "children",
			type: "Snippet<[{ title: string }]>",
			default: "—",
			description: "Replaces the text; receives the formatted period title to wrap or extend.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged after the built-in one-line truncate and semibold classes and `classNames.title`.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLAttributes<HTMLDivElement>, 'children'>",
			default: "—",
			description: "Spread onto the div.",
		},
	];

	const viewSwitcherProps: PropRow[] = [
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Replaces the trigger content — the current view's name and the chevron.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "navButtonVariant",
			description: "Forwarded to the trigger Button; overrides the root `navButtonVariant`.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "navButtonSize",
			description: "Forwarded to the trigger Button; overrides the root `navButtonSize`.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the trigger button.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the built-in `gap-1` and `classNames.navButton`.",
		},
		{
			prop: "...restProps",
			type: "Omit<ButtonProps, 'children'>",
			default: "—",
			description:
				"Spread onto the trigger Button, before the dropdown trigger's own attributes and handlers.",
		},
	];

	const datePickerProps: PropRow[] = [
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Replaces the calendar icon; the `aria-label` stays.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "navButtonVariant",
			description: "Forwarded to the trigger Button; overrides the root `navButtonVariant`.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'icon-sm'",
			description:
				"Forwarded to the trigger Button; the default is the icon twin of `navButtonSize`.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the trigger button.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after `classNames.navButton`.",
		},
		{
			prop: "...restProps",
			type: "Omit<ButtonProps, 'children'>",
			default: "—",
			description:
				"Spread onto the trigger Button, before the popover trigger's own attributes and handlers.",
		},
	];

	const toolbarProps: PropRow[] = [
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The only content of the `flex items-center gap-2` div; the part adds no controls of its own, so without it the div renders empty.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the built-in flex row and `classNames.toolbar`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div.",
		},
	];

	const monthViewProps: PropRow[] = [
		{
			prop: "maxEventsPerCell",
			type: "number | 'auto'",
			default: "—",
			description:
				"Per-instance cap on the rows a cell shows before “+N more”; unset reads the root `maxEventsPerCell`. `'auto'` measures the first cell with a ResizeObserver in contained mode and is 3 in page mode.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered grid element.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the built-in classes and `classNames.monthView`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the grid element.",
		},
	];

	const monthWeekProps: PropRow[] = [
		{
			prop: "week",
			type: "Date[]",
			default: "—",
			description:
				"Zoned day starts of the visible columns, in order. Shorter than seven when weekends are hidden; bars are still positioned from the true row start.",
		},
		{
			prop: "gridTemplateColumns",
			type: "string",
			default: "—",
			description:
				"The CSS column template shared with the header row, so the cells and the bar overlay line up with it.",
		},
		{
			prop: "showWeekNumber",
			type: "boolean",
			default: "—",
			description:
				'Renders the leading `role="rowheader"` cell with `i18n.labels.week(n)`, numbered by the locale\'s week rules and `weekStartsOn`.',
		},
		{
			prop: "cap",
			type: "number",
			default: "—",
			description:
				"Lanes visible per cell; bars in deeper lanes go to that day's overflow popover.",
		},
		{
			prop: "autoFit",
			type: "boolean",
			default: "—",
			description:
				"Passed to each cell: when it overflows, one chip row is given up to the “+N more” indicator so the content fits the measured height.",
		},
	];

	const monthCellProps: PropRow[] = [
		{
			prop: "day",
			type: "Date",
			default: "—",
			description:
				"The zoned day start; also formatted into the cell's `aria-label` with `formats.monthCellAriaLabel`.",
		},
		{
			prop: "cap",
			type: "number",
			default: "—",
			description:
				"Total rows available: the reserved bar lanes come off first, timed chips fill the rest.",
		},
		{
			prop: "reservedLanes",
			type: "number",
			default: "—",
			description:
				"Bar lanes passing through this cell, kept as an empty spacer so the timed chips start below the row's overlay bars.",
		},
		{
			prop: "hiddenBarKeys",
			type: "Set<string>",
			default: "—",
			description:
				"Occurrence keys of the bars the lane cap hid in this column; they are listed first in the overflow popover, never re-listing the visible ones.",
		},
		{
			prop: "isLast",
			type: "boolean",
			default: "—",
			description:
				"Drops the trailing border on the row's last column; passed explicitly because the bar overlay makes `:last-child` unreliable.",
		},
		{
			prop: "autoFit",
			type: "boolean",
			default: "—",
			description:
				"When the cell overflows, one timed row is surrendered to the “+N more” indicator so the visible chips fit the clipped height.",
		},
	];

	const moreIndicatorProps: PropRow[] = [
		{
			prop: "day",
			type: "Date",
			default: "—",
			description:
				"The day the popover is for; formatted into its header with `formats.moreDayHeader` and passed to `onMoreClick`.",
		},
		{
			prop: "count",
			type: "number",
			default: "—",
			description: "The number in the `i18n.labels.more` label.",
		},
		{
			prop: "segments",
			type: "EventCalendarSegment[]",
			default: "—",
			description:
				"The hidden segments only, bars first then timed; their occurrences are what `onMoreClick` receives.",
		},
	];

	const timeGridProps: PropRow[] = [
		{
			prop: "view",
			type: "Extract<CalendarView, 'week' | 'day' | 'days'>",
			default: "—",
			description:
				"Which view this instance renders and publishes to the view context; `'day'` keeps weekend days even when the weekends toggle hides them elsewhere.",
		},
		{
			prop: "dayStartHour",
			type: "number",
			default: "—",
			description: "First hour of this grid's track; unset reads the root `dayStartHour`.",
		},
		{
			prop: "dayEndHour",
			type: "number",
			default: "—",
			description: "Exclusive last hour of the track; unset reads the root `dayEndHour`.",
		},
		{
			prop: "showAllDay",
			type: "boolean",
			default: "true",
			description:
				"Renders the all-day row (label plus `EventCalendar.AllDayBars`) between the day headers and the track.",
		},
		{
			prop: "interval",
			type: "number",
			default: "—",
			description:
				"Gutter and gridline minutes for this grid, clamped to 5–240; unset reads the root `interval`.",
		},
		{
			prop: "style",
			type: "string | null",
			default: "—",
			description:
				"Appended after the built-in `--ec-hour-height: 4rem`, so redefining that variable here changes this grid's hour height.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the built-in classes and `classNames.timeGrid`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div.",
		},
	];

	const dayColumnProps: PropRow[] = [
		{
			prop: "day",
			type: "Date",
			default: "—",
			description:
				"The zoned day start whose bucket is rendered; the default `aria-label` formats it with `formats.dayAria`.",
		},
		{
			prop: "startHour",
			type: "number",
			default: "—",
			description:
				"Start of the rendered bounds in hours; chips starting earlier are clipped to it.",
		},
		{
			prop: "endHour",
			type: "number",
			default: "—",
			description:
				"End of the bounds; also clipped to the day's real length on a DST day, and the track is never shorter than one hour.",
		},
		{
			prop: "interval",
			type: "number",
			default: "—",
			description: "Gridline spacing in minutes, drawn as a repeating background gradient.",
		},
		{
			prop: "resourceId",
			type: "string",
			default: "—",
			description:
				"Restricts the column to that resource's events, tags the drag-create draft and the slot clicks with it, stamps `data-ec-resource`, and drops the default `aria-label`.",
		},
		{
			prop: "ariaLabel",
			type: "string",
			default: "—",
			description: "Accessible name override; the resource view passes the resource title.",
		},
	];

	const timeGutterProps: PropRow[] = [
		{
			prop: "referenceDay",
			type: "Date",
			default: "—",
			description: "The day whose zoned midnight the slot minutes are added to before formatting.",
		},
		{
			prop: "slots",
			type: "number[]",
			default: "—",
			description: "Minutes from the day start of each label row; one row is rendered per entry.",
		},
		{
			prop: "startHour",
			type: "number",
			default: "—",
			description:
				"The slot at `startHour * 60` renders without a label, so nothing clips at the top edge.",
		},
		{
			prop: "interval",
			type: "number",
			default: "—",
			description:
				"Row height as a fraction of `--ec-hour-height`; a multiple of 60 formats with `formats.timeGutter`, anything else with `formats.timeGutterMinute`.",
		},
	];

	const allDayBarsProps: PropRow[] = [
		{
			prop: "days",
			type: "Date[]",
			default: "—",
			description:
				"Zoned day starts of the columns; a bar reaching beyond them is clipped to the visible span.",
		},
		{
			prop: "gridTemplateColumns",
			type: "string",
			default: "—",
			description:
				"The column template shared with the day columns below, so cells and bars align.",
		},
	];

	const nowIndicatorProps: PropRow[] = [
		{
			prop: "days",
			type: "Date[]",
			default: "—",
			description:
				"The rendered columns; today's index picks which one gets the dot and the stronger segment. Nothing renders when today is not among them.",
		},
		{
			prop: "startHour",
			type: "number",
			default: "—",
			description: "Top of the track the line is offset from; hidden before it.",
		},
		{
			prop: "endHour",
			type: "number",
			default: "—",
			description: "Hidden after this hour.",
		},
	];

	const agendaViewProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the built-in classes and `classNames.agendaView`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div.",
		},
	];

	const resourceViewProps: PropRow[] = [
		{
			prop: "dayStartHour",
			type: "number",
			default: "—",
			description: "First hour of the track; unset reads the root `dayStartHour`.",
		},
		{
			prop: "dayEndHour",
			type: "number",
			default: "—",
			description: "Exclusive last hour of the track; unset reads the root `dayEndHour`.",
		},
		{
			prop: "showAllDay",
			type: "boolean",
			default: "true",
			description: "Renders the all-day row with one cell per resource above the track.",
		},
		{
			prop: "interval",
			type: "number",
			default: "—",
			description:
				"Gutter and gridline minutes, clamped to 5–240; unset reads the root `interval`.",
		},
		{
			prop: "style",
			type: "string | null",
			default: "—",
			description:
				"Appended after the built-in `--ec-hour-height: 4rem`, so redefining that variable here changes this view's hour height.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged after the built-in classes and `classNames.timeGrid` — the resource view shares the time grid's class hook.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div.",
		},
	];

	const eventProps: PropRow[] = [
		{
			prop: "segment",
			type: "EventCalendarSegment",
			default: "—",
			description:
				"The per-day slice to render; its occurrence and flags drive the label, the squared-off edges of a continuing bar, the time text and the `aria-label`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the chip content, winning over `renderEvent` and `renderAgendaEvent`; the tinted wrapper stays.",
		},
		{
			prop: "onpointerdown",
			type: "PointerEventHandler<HTMLButtonElement>",
			default: "—",
			description:
				"Runs first; the chip then stops propagation and marks the press so the trailing click cannot open a slot-create on the cell beneath.",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler<HTMLButtonElement>",
			default: "—",
			description:
				"Runs before `onEventClick` and the selection; the event never reaches the day cell.",
		},
		{
			prop: "ondblclick",
			type: "MouseEventHandler<HTMLButtonElement>",
			default: "—",
			description: "Runs before `onEventDoubleClick`.",
		},
		{
			prop: "style",
			type: "string | null",
			default: "—",
			description:
				"Appended after `--ec-event-color`, so it can add variables but cannot lose the event colour every tint, ring and dot reads.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the built-in view-specific classes and `classNames.event`.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLButtonAttributes, 'children'>",
			default: "—",
			description:
				"Spread onto the button after the computed attributes, so a caller `title` or `aria-label` replaces the default one.",
		},
	];
</script>

<!--
	Settings rows for §1. One string-keyed select serves both the numeric and the textual pickers:
	a `<select>` value is a string either way, and the two callers convert on the way back out.
-->
{#snippet settingsSwitch(
	id: string,
	label: string,
	checked: boolean,
	onChange: (value: boolean) => void,
)}
	<div class="flex items-center justify-between gap-4">
		<Label for={id} class="font-normal">{label}</Label>
		<Switch {id} {checked} onCheckedChange={onChange} />
	</div>
{/snippet}

{#snippet settingsSelect(
	id: string,
	label: string,
	value: string,
	options: Array<{ value: string; label: string }>,
	onChange: (value: string) => void,
	width: string,
)}
	<div class="flex items-center justify-between gap-4">
		<Label for={id} class="font-normal">{label}</Label>
		<Select.Root type="single" {value} onValueChange={onChange}>
			<Select.Trigger {id} size="sm" class={width}>
				{options.find((option) => option.value === value)?.label ?? ""}
			</Select.Trigger>
			<Select.Content>
				{#each options as option (option.value)}
					<Select.Item value={option.value}>{option.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
{/snippet}

<!--
	§1's chip content. A snippet cannot "return undefined to keep the built-in chip" the way
	upstream's render function does, so the {:else} arm reproduces the default single-row chip for
	every event the demo does not dress up.
-->
{#snippet teamEventContent({ occurrence }: EventCalendarRenderEventProps)}
	{@const event = occurrence.event}
	{#if event.id === "design-review"}
		<!-- Attendee avatars in place of the leading colour dot; a thin ring keeps the overlap
		     crisp at this size. -->
		<span class="flex shrink-0 -space-x-1">
			<Avatar.Root class="size-4 ring-1 ring-background">
				<Avatar.Fallback
					class="bg-(--ec-event-color)/25 text-[8px] font-semibold text-(--ec-event-color)"
				>
					MJ
				</Avatar.Fallback>
			</Avatar.Root>
			<Avatar.Root class="size-4 ring-1 ring-background">
				<Avatar.Fallback
					class="bg-(--ec-event-color)/25 text-[8px] font-semibold text-(--ec-event-color)"
				>
					AL
				</Avatar.Fallback>
			</Avatar.Root>
		</span>
		<span class="truncate font-medium">{event.title}</span>
	{:else if event.id === "client-call"}
		<!-- Title with a trailing status pill. Dot, title and pill share one flex row so the dot
		     stays glued to the label — a stacked time-grid chip would drop it onto its own line. -->
		<span class="flex w-full min-w-0 items-center gap-1.5">
			<span aria-hidden="true" class="-me-0.5 size-1.5 shrink-0 rounded-full bg-(--ec-event-color)"
			></span>
			<span class="truncate font-medium">{event.title}</span>
			<span
				class="ms-auto shrink-0 rounded bg-(--ec-event-color)/25 px-1 text-[10px] font-semibold"
			>
				30m
			</span>
		</span>
	{:else}
		<span aria-hidden="true" class="-me-0.5 size-1.5 shrink-0 rounded-full bg-(--ec-event-color)"
		></span>
		<span class="truncate font-medium">{event.title}</span>
	{/if}
{/snippet}

<!-- §4: a compact single-row bar with an inline category icon and the title. -->
{#snippet projectChip({ occurrence }: EventCalendarRenderEventProps)}
	{@const category = categoryOf(occurrence.event)}
	<span class="flex w-full min-w-0 items-center gap-1.5">
		{#if category}
			<span class="flex shrink-0 text-(--ec-event-color)">
				{#if category === "design"}
					<PaletteIcon class="size-3.5" aria-hidden="true" />
				{:else if category === "engineering"}
					<CodeIcon class="size-3.5" aria-hidden="true" />
				{:else if category === "marketing"}
					<MegaphoneIcon class="size-3.5" aria-hidden="true" />
				{:else}
					<CompassIcon class="size-3.5" aria-hidden="true" />
				{/if}
			</span>
		{/if}
		<span class="truncate font-medium">{occurrence.event.title}</span>
	</span>
{/snippet}

<!-- §4: hover tooltip — the title and its track. -->
{#snippet projectTooltip({ occurrence }: EventTooltipProps)}
	{@const category = categoryOf(occurrence.event)}
	<div class="flex flex-col gap-0.5">
		<p class="font-medium">{occurrence.event.title}</p>
		{#if category}
			<p class="text-xs text-muted-foreground">{CATEGORY[category].label}</p>
		{/if}
	</div>
{/snippet}

<!-- §5: an initials badge, the client name and — when the block is tall enough — the service. -->
{#snippet appointmentChip({ occurrence, segment }: EventCalendarRenderEventProps)}
	{@const data = apptDataOf(occurrence.event)}
	{@const minutes = (segment.endMin ?? 0) - (segment.startMin ?? 0)}
	<span class="flex h-full w-full min-w-0 flex-col justify-start gap-0.5">
		<span class="flex min-w-0 items-center gap-1.5">
			<Avatar.Root class="size-5 shrink-0">
				<Avatar.Fallback
					class="bg-(--ec-event-color)/25 text-[9px] font-semibold text-(--ec-event-color)"
				>
					{data?.initials ?? "?"}
				</Avatar.Fallback>
			</Avatar.Root>
			<span class="truncate font-medium">{data?.client ?? occurrence.event.title}</span>
		</span>
		{#if data?.service && minutes >= 45}
			<span class="truncate ps-[1.625rem] text-[11px] font-medium text-(--ec-event-color)">
				{SERVICE[data.service].label}
			</span>
		{/if}
	</span>
{/snippet}

<DocPage title="Event calendar">
	{#snippet subtitle()}
		A full scheduling surface — month, week, day, N-day, agenda and resource views over one event
		model, with time zones, recurrence, localisation and an imperative API.
	{/snippet}

	<!--
		The gap is stated on the page, not only in the component's header, because it is the first
		thing a reader will test: upstream's calendar moves an event by dragging it, and this one
		does not. Saying so once, at the top and in the alert family the theme uses for a standing
		caveat, is cheaper than letting every section repeat it — though the sections whose upstream
		version demonstrates dragging still say what they do instead.
	-->
	<Alert.Root variant="info-subtle" class="mb-8">
		<InfoIcon />
		<Alert.Title>Events cannot be dragged or resized</Alert.Title>
		<Alert.Description>
			This theme leaves out upstream's pointer engine for moving and resizing an existing event
			(divergence D-01, recorded in the component's header). Everything else is here: all six views,
			recurrence, time zones, localisation, the imperative API — and drag-to-create, which draws a
			new event across empty time and does work. To reschedule an event, call
			<code class="text-[87.5%] text-primary">api.updateEvent</code> from your own control. The
			<code class="text-[87.5%] text-primary">interactions.drag</code> and
			<code class="text-[87.5%] text-primary">interactions.resize</code> props keep their shape, so nothing
			here changes on the day the engine lands.
		</Alert.Description>
	</Alert.Root>

	<DocSection title="Event calendar with all views and live settings">
		{#snippet blurb()}
			Every view the calendar ships, over one week of team events, with a settings popover that
			rewrites the options live — display toggles, the hour track, tooltips, language and time zone.
			Upstream's panel also carries "Drag to move" and "Drag to resize" switches; those gestures do
			not exist in this theme, so only "Drag to create" remains, and it is the slot drag-create that
			does work.
		{/snippet}
		<Card.Root class="overflow-hidden py-0">
			<Card.Content class="p-0">
				<div dir={teamLocale.dir}>
					<EventCalendar.Root
						defaultEvents={teamEvents}
						defaultView="month"
						onViewChange={(view) => (teamView = view)}
						resources={TEAM}
						bind:api={teamApi}
						renderEvent={teamEventContent}
						locale={teamLocale.locale}
						i18n={teamLocale.i18n}
						timeZone={teamTimeZone.value}
						viewSettings={teamSettings.viewSettings}
						onViewSettingsChange={(viewSettings) => (teamSettings.viewSettings = viewSettings)}
						interactions={{ selectSlot: teamSettings.selectSlot }}
						weekStartsOn={teamSettings.weekStartsOn}
						dayStartHour={teamSettings.dayStartHour}
						dayEndHour={teamSettings.dayEndHour}
						interval={teamSettings.interval}
						snapDuration={teamSettings.snapDuration}
						eventTooltip={teamSettings.eventTooltip}
						showDayAddButton={teamSettings.showDayAddButton}
						offDays
						class="h-[640px] w-full"
					>
						<div class="flex flex-wrap items-center gap-2 pe-2">
							<EventCalendar.Nav class="min-w-0 flex-1" />
							<EventCalendar.Toolbar>
								<Popover.Root>
									<Popover.Trigger>
										{#snippet child({ props })}
											<Button {...props} variant="outline" size="sm">
												<Settings2Icon data-icon="inline-start" />
												Settings
											</Button>
										{/snippet}
									</Popover.Trigger>
									<Popover.Content align="end" sideOffset={8} class="w-80">
										<Tabs.Root bind:value={teamSettingsTab}>
											<Tabs.List class="w-full">
												<Tabs.Trigger value="view" class="flex-1">View</Tabs.Trigger>
												{#if teamIsTimeGrid}
													<Tabs.Trigger value="time" class="flex-1">Time grid</Tabs.Trigger>
												{/if}
												<Tabs.Trigger value="behavior" class="flex-1">Behavior</Tabs.Trigger>
												<Tabs.Trigger value="region" class="flex-1">Region</Tabs.Trigger>
											</Tabs.List>

											<Tabs.Content value="view" class="flex flex-col gap-3">
												{@render settingsSwitch(
													"ec-set-weekends",
													"Weekends",
													teamSettings.viewSettings.weekends ?? true,
													(weekends) =>
														(teamSettings.viewSettings = {
															...teamSettings.viewSettings,
															weekends,
														}),
												)}
												{@render settingsSwitch(
													"ec-set-week-numbers",
													"Week numbers",
													teamSettings.viewSettings.weekNumbers ?? false,
													(weekNumbers) =>
														(teamSettings.viewSettings = {
															...teamSettings.viewSettings,
															weekNumbers,
														}),
												)}
												{@render settingsSwitch(
													"ec-set-now",
													"Now indicator",
													teamSettings.viewSettings.nowIndicator ?? true,
													(nowIndicator) =>
														(teamSettings.viewSettings = {
															...teamSettings.viewSettings,
															nowIndicator,
														}),
												)}
												{@render settingsSwitch(
													"ec-set-off-days",
													"Mark off days",
													teamSettings.viewSettings.offDays ?? false,
													(offDays) =>
														(teamSettings.viewSettings = { ...teamSettings.viewSettings, offDays }),
												)}
												{@render settingsSwitch(
													"ec-set-day-add",
													"Day add button",
													teamSettings.showDayAddButton,
													(value) => (teamSettings.showDayAddButton = value),
												)}
												<!-- week start shapes month and week grids alike, so it lives here
												     rather than among the time-grid internals -->
												{@render settingsSelect(
													"ec-set-week-start",
													"Week starts",
													String(teamSettings.weekStartsOn),
													[
														{ value: "0", label: "Sunday" },
														{ value: "1", label: "Monday" },
													],
													(value) => (teamSettings.weekStartsOn = Number(value) as 0 | 1),
													"w-28",
												)}
											</Tabs.Content>

											<Tabs.Content value="time" class="flex flex-col gap-3">
												{@render settingsSelect(
													"ec-set-day-start",
													"Day starts",
													String(teamSettings.dayStartHour),
													[
														{ value: "0", label: "00:00" },
														{ value: "6", label: "06:00" },
														{ value: "8", label: "08:00" },
													],
													(value) => (teamSettings.dayStartHour = Number(value)),
													"w-28",
												)}
												{@render settingsSelect(
													"ec-set-day-end",
													"Day ends",
													String(teamSettings.dayEndHour),
													[
														{ value: "18", label: "18:00" },
														{ value: "20", label: "20:00" },
														{ value: "24", label: "24:00" },
													],
													(value) => (teamSettings.dayEndHour = Number(value)),
													"w-28",
												)}
												{@render settingsSelect(
													"ec-set-interval",
													"Grid interval",
													String(teamSettings.interval),
													[
														{ value: "30", label: "30 min" },
														{ value: "60", label: "60 min" },
													],
													(value) => (teamSettings.interval = Number(value)),
													"w-28",
												)}
												{@render settingsSelect(
													"ec-set-snap",
													"Draw snap",
													String(teamSettings.snapDuration),
													[
														{ value: "5", label: "5 min" },
														{ value: "15", label: "15 min" },
														{ value: "30", label: "30 min" },
													],
													(value) => (teamSettings.snapDuration = Number(value)),
													"w-28",
												)}
											</Tabs.Content>

											<Tabs.Content value="behavior" class="flex flex-col gap-3">
												{@render settingsSwitch(
													"ec-set-select-slot",
													"Drag to create",
													teamSettings.selectSlot,
													(value) => (teamSettings.selectSlot = value),
												)}
												{@render settingsSwitch(
													"ec-set-tooltip",
													"Event tooltips",
													teamSettings.eventTooltip,
													(value) => (teamSettings.eventTooltip = value),
												)}
											</Tabs.Content>

											<Tabs.Content value="region" class="flex flex-col gap-3">
												{@render settingsSelect(
													"ec-set-language",
													"Language",
													teamSettings.localeId,
													LOCALES.map((entry) => ({ value: entry.id, label: entry.label })),
													(value) => (teamSettings.localeId = value),
													"w-36",
												)}
												{@render settingsSelect(
													"ec-set-timezone",
													"Time zone",
													teamSettings.timeZoneId,
													TIME_ZONES.map((entry) => ({ value: entry.id, label: entry.label })),
													(value) => (teamSettings.timeZoneId = value),
													"w-36",
												)}
												<p class="text-xs leading-relaxed text-muted-foreground">
													Language switches the date-fns locale and every UI label. Time zone shifts
													all event times. Arabic also flips the calendar to right-to-left.
												</p>
											</Tabs.Content>
										</Tabs.Root>
										<Button
											variant="outline"
											size="sm"
											class="mt-4 w-full"
											onclick={() => (teamSettings = defaultTeamSettings())}
										>
											Reset to defaults
										</Button>
									</Popover.Content>
								</Popover.Root>
								<Button size="sm" onclick={addTeamEvent}>
									<PlusIcon data-icon="inline-start" />
									New event
								</Button>
							</EventCalendar.Toolbar>
						</div>
						<EventCalendar.Content />
					</EventCalendar.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Event calendar with resource view for room bookings">
		{#snippet blurb()}
			Rooms become columns in the resource day view, the layout tuned for space and booking boards.
			Upstream rearranges a stay by dragging its block; here a booking moves through
			<code>api.updateEvent</code>, and the toolbar button stands in for the booking form. Slot
			drag-create is off on purpose — a stray draw should not carve out a reservation.
		{/snippet}
		<Card.Root class="overflow-hidden py-0">
			<Card.Content class="p-0">
				<EventCalendar.Root
					defaultEvents={bookingEvents}
					defaultView="resource"
					resources={ROOMS}
					dayStartHour={8}
					dayEndHour={20}
					interval={60}
					interactions={{ selectSlot: false }}
					bind:api={bookingApi}
					class="h-[600px] w-full"
				>
					<div class="flex flex-wrap items-center gap-2 pe-2">
						<!-- resource is the only view here, so the switcher is hidden -->
						<EventCalendar.Nav class="min-w-0 flex-1" showViewSwitcher={false} />
						<EventCalendar.Toolbar>
							<Button size="sm" onclick={addBooking}>
								<PlusIcon data-icon="inline-start" />
								New booking
							</Button>
						</EventCalendar.Toolbar>
					</div>
					<EventCalendar.Content />
				</EventCalendar.Root>
				<!--
					Status legend. The swatch colours are runtime palette values picked from the
					component's own preset list, so they ride inline styles rather than utility classes
					Tailwind would have to synthesize.
				-->
				<div
					class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-4 py-3 text-xs text-muted-foreground"
				>
					{#each BOOKING_STATUS_KEYS as key (key)}
						<span class="flex items-center gap-1.5">
							<span
								aria-hidden="true"
								class="size-2 rounded-full"
								style="background-color: {BOOKING_STATUS[key].color};"
							></span>
							{BOOKING_STATUS[key].label}
						</span>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Event calendar with create and edit dialog">
		{#snippet blurb()}
			One dialog does both jobs: clicking an empty day seeds a create draft, clicking an event seeds
			an edit draft from the event itself, and the toolbar button opens the same form on today.
			Saving commits through <code>api.addEvent</code> or <code>api.updateEvent</code>, so the
			calendar stays the single owner of the event list.
		{/snippet}
		<Card.Root class="overflow-hidden py-0">
			<Card.Content class="p-0">
				<EventCalendar.Root
					defaultEvents={crudEvents}
					defaultView="month"
					bind:api={crudApi}
					onSlotClick={(slot: EventCalendarSlotInfo) => seedCreate(slot.date)}
					onEventClick={(occurrence, event) => {
						// open the editor instead of the built-in selection tint
						event.preventDefault();
						seedEdit(occurrence);
					}}
					interactions={{ selectSlot: false }}
					class="h-[640px] w-full"
				>
					<div class="flex flex-wrap items-center gap-2 pe-2">
						<EventCalendar.Nav class="min-w-0 flex-1" />
						<EventCalendar.Toolbar>
							<Button size="sm" onclick={() => seedCreate(new Date())}>
								<PlusIcon data-icon="inline-start" />
								Add event
							</Button>
						</EventCalendar.Toolbar>
					</div>
					<EventCalendar.Content />
				</EventCalendar.Root>
			</Card.Content>
		</Card.Root>

		<Dialog.Root bind:open={crudOpen}>
			{#if crudDraft}
				<Dialog.Content class="sm:max-w-sm">
					<Dialog.Header>
						<Dialog.Title>{crudIsEdit ? "Edit event" : "New event"}</Dialog.Title>
						<Dialog.Description>
							{format(crudDraft.date, "EEEE, MMMM d, yyyy")}
						</Dialog.Description>
					</Dialog.Header>

					<Field.Group>
						<Field.Field>
							<Field.Label for="ec-crud-title">Title</Field.Label>
							<Input id="ec-crud-title" placeholder="Add a title" bind:value={crudDraft.title} />
						</Field.Field>

						<Field.Field>
							<Field.Label>Color</Field.Label>
							<div class="flex gap-2">
								{#each CRUD_COLORS as color (color.value)}
									<button
										type="button"
										aria-label={color.name}
										aria-pressed={crudDraft.color === color.value}
										onclick={() => crudDraft && (crudDraft.color = color.value)}
										style="background-color: {color.value};"
										class={cn(
											"size-6 rounded-full ring-offset-background transition",
											crudDraft.color === color.value && "ring-2 ring-ring ring-offset-2",
										)}
									></button>
								{/each}
							</div>
						</Field.Field>

						{#if !crudDraft.allDay}
							<div class="grid grid-cols-2 gap-3">
								<Field.Field>
									<Field.Label for="ec-crud-start">Start</Field.Label>
									<Select.Root
										type="single"
										value={String(crudDraft.startHour)}
										onValueChange={(value) => crudDraft && (crudDraft.startHour = Number(value))}
									>
										<Select.Trigger id="ec-crud-start" size="sm">
											{String(crudDraft.startHour).padStart(2, "0")}:00
										</Select.Trigger>
										<Select.Content>
											{#each CRUD_START_HOURS as hour (hour)}
												<Select.Item value={String(hour)}>
													{String(hour).padStart(2, "0")}:00
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</Field.Field>
								<Field.Field>
									<Field.Label for="ec-crud-duration">Duration</Field.Label>
									<Select.Root
										type="single"
										value={String(crudDraft.duration)}
										onValueChange={(value) => crudDraft && (crudDraft.duration = Number(value))}
									>
										<Select.Trigger id="ec-crud-duration" size="sm">
											{CRUD_DURATIONS.find((option) => option.value === crudDraft?.duration)
												?.label ?? ""}
										</Select.Trigger>
										<Select.Content>
											{#each CRUD_DURATIONS as option (option.value)}
												<Select.Item value={String(option.value)}>{option.label}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</Field.Field>
							</div>
						{/if}

						<Field.Field orientation="horizontal">
							<Field.Label for="ec-crud-allday" class="font-normal">All day</Field.Label>
							<Switch id="ec-crud-allday" bind:checked={crudDraft.allDay} />
						</Field.Field>
					</Field.Group>

					<Dialog.Footer class="sm:justify-between">
						{#if crudIsEdit}
							<Button
								variant="ghost"
								size="sm"
								class="text-destructive hover:text-destructive"
								onclick={removeDraft}
							>
								Delete
							</Button>
						{:else}
							<span></span>
						{/if}
						<div class="flex gap-2">
							<Dialog.Close>
								{#snippet child({ props })}
									<Button {...props} variant="outline" size="sm">Cancel</Button>
								{/snippet}
							</Dialog.Close>
							<Button size="sm" onclick={saveDraft} disabled={!crudCanSave}>
								{crudIsEdit ? "Save changes" : "Create event"}
							</Button>
						</div>
					</Dialog.Footer>
				</Dialog.Content>
			{/if}
		</Dialog.Root>
	</DocSection>

	<DocSection title="Event calendar with custom event chips">
		{#snippet blurb()}
			A month of cross-functional work as multi-day bars, each chip rebuilt through
			<code>renderEvent</code> — a category icon and the title on one slim row — with a styled hover
			tooltip from <code>renderEventTooltip</code>. Upstream drags a bar to reschedule it and
			stretches its edge to change the span; here the two toolbar buttons add work through the API
			instead.
		{/snippet}
		<Card.Root class="overflow-hidden py-0">
			<Card.Content class="p-0">
				<EventCalendar.Root
					defaultEvents={projectEvents}
					defaultView="month"
					weekStartsOn={1}
					bind:api={projectApi}
					renderEvent={projectChip}
					renderEventTooltip={projectTooltip}
					eventTooltip={{ side: "top" }}
					interactions={{ selectSlot: false }}
					class="h-[640px] w-full"
				>
					<div class="flex flex-wrap items-center gap-2 pe-2">
						<EventCalendar.Nav class="min-w-0 flex-1" showViewSwitcher={false} />
						<EventCalendar.Toolbar>
							<Button variant="outline" size="sm" onclick={addMilestone}>
								<FlagIcon data-icon="inline-start" />
								Milestone
							</Button>
							<Button size="sm" onclick={addProject}>
								<PlusIcon data-icon="inline-start" />
								New project
							</Button>
						</EventCalendar.Toolbar>
					</div>
					<EventCalendar.Content />
				</EventCalendar.Root>
				<div
					class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-4 py-3 text-xs text-muted-foreground"
				>
					{#each CATEGORY_KEYS as key (key)}
						<span class="flex items-center gap-1.5">
							<span
								aria-hidden="true"
								class="size-2 rounded-full"
								style="background-color: {CATEGORY[key].color};"
							></span>
							{CATEGORY[key].label}
						</span>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Event calendar with drag-to-book appointments">
		{#snippet blurb()}
			Slot drag-create is the one pointer gesture this theme keeps, and this is what it is for: drag
			across an open span in the day view to book it. The calendar reports the drawn slot and
			inserts nothing — <code>onSelectSlot</code> creates the appointment, and
			<code>canSelectSlot</code> refuses any draw that overlaps an existing one, so the day cannot be
			double-booked.
		{/snippet}
		<Card.Root class="overflow-hidden py-0">
			<Card.Content class="p-0">
				<EventCalendar.Root
					defaultEvents={appointmentEvents}
					defaultView="day"
					dayStartHour={9}
					dayEndHour={18}
					interval={30}
					snapDuration={15}
					bind:api={appointmentApi}
					renderEvent={appointmentChip}
					onSelectSlot={bookSlot}
					canSelectSlot={canBookSlot}
					interactions={{ selectSlot: true }}
					class="h-[600px] w-full"
				>
					<div class="flex flex-wrap items-center gap-2 pe-2">
						<!-- the switcher stays on: booking lives in the day view, but the week and month
						     give the same appointments a wider context -->
						<EventCalendar.Nav class="min-w-0 flex-1" />
						<EventCalendar.Toolbar>
							<Button variant="outline" size="sm" onclick={() => appointmentApi?.setView("agenda")}>
								<ListIcon data-icon="inline-start" />
								Agenda
							</Button>
							<Button size="sm" onclick={addAppointment}>
								<PlusIcon data-icon="inline-start" />
								New appointment
							</Button>
						</EventCalendar.Toolbar>
					</div>
					<EventCalendar.Content />
				</EventCalendar.Root>
				<p class="border-t px-4 py-3 text-xs text-muted-foreground">
					Drag across an open time to book an appointment. Slots that overlap an existing booking
					are blocked.
				</p>
			</Card.Content>
		</Card.Root>
	</DocSection>
	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.Root</h3>
			<p class="text-sm text-muted-foreground">
				The container: owns the state class and both contexts, and renders a
				<code>&lt;div data-slot="event-calendar"&gt;</code> whose <code>text-xs</code> is the type
				base every part inherits. It also listens on <code>window</code> for the single-key view
				shortcuts. Controlled/uncontrolled pairs follow one rule: a defined controlled value wins,
				the
				<code>default*</code> twin seeds the internal state once, and the paired callback fires in
				both modes on a real change. <code>TData</code> resolves to <code>unknown</code> on the component
				— Svelte context cannot carry a type parameter across parts.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each rootProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.Content</h3>
			<p class="text-sm text-muted-foreground">
				The view switchboard: a <code>&lt;div&gt;</code> carrying <code>data-view</code> and
				<code>data-loading</code> that renders the built-in component for the current view — the
				month view, the agenda, the resource view, or the one time grid parameterised for week, day
				and N-days. Throws outside <code>EventCalendar.Root</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each contentProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.Nav</h3>
			<p class="text-sm text-muted-foreground">
				The composed navigation row: a <code>&lt;div&gt;</code> holding Today, the view switcher,
				prev/next, the title and a trailing spacer under one shared tooltip provider (the first
				tooltip waits, moving between buttons is instant). Becomes sticky with
				<code>stickyNav</code>; pass <code>children</code> to use it as an empty layout shell.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each navProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.NavPrev</h3>
			<p class="text-sm text-muted-foreground">
				An icon <code>Button</code> labelled <code>i18n.labels.previous</code> that steps the anchor
				one period back — a month, a week, a day, <code>dayCount</code> days or
				<code>agendaDayCount</code> days depending on the view — wrapped in a tooltip unless that is
				disabled. Throws outside <code>EventCalendar.Root</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each navPrevProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.NavNext</h3>
			<p class="text-sm text-muted-foreground">
				The mirror of <code>NavPrev</code>: an icon <code>Button</code> labelled
				<code>i18n.labels.next</code> that steps the anchor one period forward. Stepping from a month
				end lands on the next month's end, so next-then-prev returns to the same day.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each navNextProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.NavToday</h3>
			<p class="text-sm text-muted-foreground">
				A text <code>Button</code> reading <code>i18n.labels.today</code> that moves the anchor to
				now; it carries <code>data-active</code> while the active range contains the current instant,
				re-evaluated at every zoned midnight.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each navTodayProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.Title</h3>
			<p class="text-sm text-muted-foreground">
				A <code>&lt;div aria-live="polite"&gt;</code> showing the current period through
				<code>i18n.functions.formatTitle</code> — the month name, a cross-month week range, the day, or
				the agenda's range — truncated to one line.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each titleProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.ViewSwitcher</h3>
			<p class="text-sm text-muted-foreground">
				A <code>Button</code> opening a dropdown of the root's <code>views</code>: one item per view
				plus one per <code>dayCountPresets</code> entry for the N-day view, each carrying
				<code>data-active</code> for the current view and a <code>&lt;kbd&gt;</code> hint while
				<code>enableShortcuts</code> is on. Choosing an item closes the menu and calls
				<code>api.setView</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each viewSwitcherProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.DatePicker</h3>
			<p class="text-sm text-muted-foreground">
				An icon <code>Button</code> labelled <code>i18n.labels.goToDate</code> opening a popover
				with the house <code>Calendar</code> on the anchor's wall date in <code>timeZone</code>;
				picking a day calls <code>api.goTo</code> with that day's zoned midnight and closes. Always
				a single date, never a range highlight. Not part of the composed <code>Nav</code> — place it yourself.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each datePickerProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.Toolbar</h3>
			<p class="text-sm text-muted-foreground">
				A flex-row <code>&lt;div&gt;</code> for your own buttons: a pure layout shell with no
				behaviour, it only reads <code>classNames.toolbar</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each toolbarProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.MonthView</h3>
			<p class="text-sm text-muted-foreground">
				The month grid: a <code>role="grid"</code> element labelled with the month title, a weekday
				header row, then one <code>EventCalendar.MonthWeek</code> per row of the visible range (six
				with <code>fixedWeeks</code>). Weekend columns drop out when the weekends toggle is off.
				Publishes the <code>'month'</code> view context; rendered by <code>Content</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each monthViewProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.MonthWeek</h3>
			<p class="text-sm text-muted-foreground">
				One row of the month grid: a <code>role="row"</code> element with the optional week number,
				one <code>EventCalendar.MonthCell</code> per day, and an absolute overlay where multi-day
				bars are placed by grid column so a span is one unbroken block. The lanes beyond the cap are
				handed to each cell for its “+N more”. Rendered by <code>MonthView</code>; takes no HTML
				attributes.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each monthWeekProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.MonthCell</h3>
			<p class="text-sm text-muted-foreground">
				One day of the month grid: a <code>role="gridcell"</code> element carrying
				<code>data-today</code>, <code>data-outside</code>, <code>data-weekend</code>,
				<code>data-off</code>, <code>data-draft</code> and <code>data-ec-day</code>, with the
				single-day timed chips, the overflow indicator, the day number and the optional add button.
				A press on empty space begins an all-day drag-create; a click reports the day to
				<code>onSlotClick</code>. Rendered by <code>MonthWeek</code>; takes no HTML attributes.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each monthCellProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.MoreIndicator</h3>
			<p class="text-sm text-muted-foreground">
				The “+N more” trigger and its popover listing a day's hidden chips under a
				<code>formats.moreDayHeader</code> heading, scrolled by the configured
				<code>scrollbars</code> and aligned by <code>morePopoverAlign</code>. The click calls
				<code>onMoreClick</code> first; false keeps the popover closed. Rendered by
				<code>MonthCell</code>; takes no HTML attributes.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each moreIndicatorProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.TimeGrid</h3>
			<p class="text-sm text-muted-foreground">
				The week, day and N-day views in one component: a <code>&lt;div&gt;</code> with a day-header
				row, an optional all-day row, and the scrolling track of a time gutter, one
				<code>EventCalendar.DayColumn</code> per visible day and the now indicator. In contained
				mode it scrolls to <code>scrollToHour</code> on mount, registers
				<code>api.scrollToTime</code>, and mirrors the scrollbar width onto the header rows so the
				columns stay aligned. Rendered by <code>Content</code> for those three views.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each timeGridProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.DayColumn</h3>
			<p class="text-sm text-muted-foreground">
				One day's timed column: a <code>role="group"</code> element carrying
				<code>data-today</code>,
				<code>data-off</code>, <code>data-ec-day</code>, <code>data-ec-bounds-start/end</code> and
				<code>data-ec-resource</code>, positioning the day's timed chips by minute inside the hour
				bounds and repacking the overlaps the bounds or the resource filter leave visible. A press
				on empty space begins a timed drag-create; a click reports a <code>slotDuration</code> slot
				to
				<code>onSlotClick</code>. Needs a view context; rendered by <code>TimeGrid</code> and
				<code>ResourceView</code>. Takes no HTML attributes.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dayColumnProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.TimeGutter</h3>
			<p class="text-sm text-muted-foreground">
				The hour-label column beside the day columns, one row per slot sized from
				<code>--ec-hour-height</code>. Rendered by <code>TimeGrid</code> and
				<code>ResourceView</code>; takes no HTML attributes.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each timeGutterProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.AllDayBars</h3>
			<p class="text-sm text-muted-foreground">
				The all-day row's cell grid plus a bar overlay: consecutive-day segments of one occurrence
				merge into a single lane-packed bar spanning its columns. Each cell starts an all-day
				drag-create on press and reports an all-day point to <code>onSlotClick</code> on click.
				Needs a view context; rendered by <code>TimeGrid</code>. Takes no HTML attributes.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each allDayBarsProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.NowIndicator</h3>
			<p class="text-sm text-muted-foreground">
				The current-time line: a hairline across the columns with a stronger segment and a dot over
				today's column, refreshed every <code>nowIndicatorInterval</code> milliseconds and on tab
				focus. Rendered by <code>TimeGrid</code> and <code>ResourceView</code>; takes no HTML
				attributes.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each nowIndicatorProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.AgendaView</h3>
			<p class="text-sm text-muted-foreground">
				A read-only list: a <code>role="group"</code> element labelled with its date range, grouping
				the <code>agendaDayCount</code> days that have events under a sticky weekday-and-date
				heading, bars first then timed rows. Empty days are dropped; an empty window shows the
				no-events state. Rows never select on click. Publishes the <code>'agenda'</code> view
				context; rendered by <code>Content</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each agendaViewProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.ResourceView</h3>
			<p class="text-sm text-muted-foreground">
				The bookings-per-resource day view: the time grid's layout with one
				<code>EventCalendar.DayColumn</code> per leaf resource for the single anchor day, resource
				titles (or <code>renderResourceHeader</code>) as column headers, and one all-day cell per
				resource. With an empty <code>resources</code> list every per-resource loop renders nothing:
				no header cell, all-day cell or day column, only an empty one-column track beside the
				gutter. Publishes the
				<code>'resource'</code> view context; rendered by <code>Content</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each resourceViewProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">EventCalendar.Event</h3>
			<p class="text-sm text-muted-foreground">
				One chip: a <code>&lt;button&gt;</code> carrying <code>data-view</code>,
				<code>data-all-day</code>, <code>data-recurring</code>, <code>data-selected</code>,
				<code>data-past</code> and <code>aria-pressed</code>, tinted from the event's
				<code>color</code> through <code>--ec-event-color</code>. Its content is the default layout,
				the root <code>renderEvent</code> / <code>renderAgendaEvent</code>, or
				<code>children</code>. Needs a view context; rendered by every view.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each eventProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
