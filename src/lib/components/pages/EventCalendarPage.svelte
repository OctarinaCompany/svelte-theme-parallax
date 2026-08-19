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
</DocPage>
