<script lang="ts">
	import { format } from "date-fns";
	import type { DateValue } from "@internationalized/date";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";

	import * as Card from "$lib/components/ui/card/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import {
		DateSelector,
		DEFAULT_DATE_SELECTOR_I18N,
		dateValueToDate,
		formatDateValue,
		type DateSelectorI18nConfig,
		type DateSelectorValue,
		type DateSelectorWeekStartsOn,
	} from "$lib/components/ui/date-selector/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Date selector component page — its four examples, in that page's order and under its titles.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. Its date input is a vendor picker plugin, which picks days and
	 * day ranges and nothing else; the neighbouring Calendar and Range calendar pages document
	 * what that plugin covers. A selector that also offers months, quarters, half-years and years,
	 * behind an is/before/after/between operator, is a shape the theme simply does not have — so
	 * the component in `$lib/components/ui/date-selector/` is a port with no classic surface to
	 * reconcile against, and this page shows how it is driven rather than how it was restyled.
	 *
	 * THREE TRANSLATIONS APPLY THROUGHOUT:
	 *
	 *   value      upstream's `onChange` is `onValueChange` here, paired with the bindable
	 *              `value` prop the way every other component in this repository pairs them.
	 *   dates      `DateSelectorValue.startDate`/`endDate` are `DateValue` from
	 *              `@internationalized/date`, not JS `Date`, because the day view composes this
	 *              repo's bits-ui calendars. {@link dateValueToDate} bridges back where the
	 *              debug dump below wants a date-fns pattern.
	 *   draft      the popover and dialog examples keep a draft copy that only becomes the real
	 *              value on Apply. React syncs it from an effect keyed on `open`; here the
	 *              open-change handler does it directly, which is the same rule without the
	 *              round trip through a reactive dependency list.
	 *
	 * ONE DIVERGENCE. The language switcher of the fourth example drops upstream's flag emoji and
	 * keeps the language names. Same rule as the Filters page: no flags, and a name is the half a
	 * reader actually parses.
	 */

	/* ---------------------------------------------------------------------------------------
	 * Basic date selector
	 * ------------------------------------------------------------------------------------ */

	let basicValue = $state<DateSelectorValue | undefined>();

	/**
	 * A `DateValue` carries `era`/`calendar` fields that would dominate the dump, so the replacer
	 * renders it as the same `MM/dd/yyyy` string upstream's `Date` branch produces.
	 */
	function isDateValue(entry: unknown): entry is DateValue {
		return typeof entry === "object" && entry !== null && "era" in entry && "calendar" in entry;
	}

	const basicDebug = $derived(
		basicValue
			? JSON.stringify(
					basicValue,
					(_key, entry: unknown) =>
						isDateValue(entry) ? format(dateValueToDate(entry), "MM/dd/yyyy") : entry,
					2,
				)
			: "",
	);

	/* ---------------------------------------------------------------------------------------
	 * Date selector with popover
	 * ------------------------------------------------------------------------------------ */

	let popoverOpen = $state(false);
	let popoverValue = $state<DateSelectorValue | undefined>();
	let popoverDraft = $state<DateSelectorValue | undefined>();

	const popoverLabel = $derived(
		(popoverValue ? formatDateValue(popoverValue) : "") || "Select a date",
	);

	function handlePopoverOpenChange(open: boolean) {
		popoverOpen = open;
		// Opening always restarts from the committed value, so a cancelled edit leaves nothing behind.
		if (open) popoverDraft = popoverValue;
	}

	function applyPopover() {
		popoverValue = popoverDraft;
		popoverOpen = false;
	}

	function cancelPopover() {
		popoverDraft = popoverValue;
		popoverOpen = false;
	}

	/* ---------------------------------------------------------------------------------------
	 * Date selector with dialog
	 * ------------------------------------------------------------------------------------ */

	let dialogOpen = $state(false);
	let dialogValue = $state<DateSelectorValue | undefined>();
	let dialogDraft = $state<DateSelectorValue | undefined>();

	const dialogLabel = $derived(
		(dialogValue ? formatDateValue(dialogValue) : "") || "Select a date",
	);

	function handleDialogOpenChange(open: boolean) {
		dialogOpen = open;
		if (open) dialogDraft = dialogValue;
	}

	function applyDialog() {
		// Upstream keeps the previous value when the draft is still empty.
		if (dialogDraft) dialogValue = dialogDraft;
		dialogOpen = false;
	}

	/* ---------------------------------------------------------------------------------------
	 * Date selector with dropdown menu
	 * ------------------------------------------------------------------------------------ */

	type LocalizedLanguage = "en" | "es" | "fr" | "de";

	/** Partial string tables, merged over the defaults exactly as upstream's helper does. */
	const translations: Record<Exclude<LocalizedLanguage, "en">, Partial<DateSelectorI18nConfig>> = {
		es: {
			selectDate: "Seleccionar fecha",
			apply: "Aplicar",
			cancel: "Cancelar",
			clear: "Limpiar",
			today: "Hoy",
			filterTypes: { is: "es", before: "antes de", after: "después de", between: "entre" },
			periodTypes: {
				day: "Día",
				month: "Mes",
				quarter: "Trimestre",
				halfYear: "Semestre",
				year: "Año",
			},
			months: [
				"Enero",
				"Febrero",
				"Marzo",
				"Abril",
				"Mayo",
				"Junio",
				"Julio",
				"Agosto",
				"Septiembre",
				"Octubre",
				"Noviembre",
				"Diciembre",
			],
			monthsShort: [
				"Ene",
				"Feb",
				"Mar",
				"Abr",
				"May",
				"Jun",
				"Jul",
				"Ago",
				"Sep",
				"Oct",
				"Nov",
				"Dic",
			],
			quarters: ["T1", "T2", "T3", "T4"],
			halfYears: ["S1", "S2"],
			weekdays: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
			weekdaysShort: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"],
			placeholder: "Seleccionar fecha...",
			rangePlaceholder: "Seleccionar rango de fechas...",
		},
		fr: {
			selectDate: "Sélectionner une date",
			apply: "Appliquer",
			cancel: "Annuler",
			clear: "Effacer",
			today: "Aujourd'hui",
			filterTypes: { is: "est", before: "avant", after: "après", between: "entre" },
			periodTypes: {
				day: "Jour",
				month: "Mois",
				quarter: "Trimestre",
				halfYear: "Semestre",
				year: "Année",
			},
			months: [
				"Janvier",
				"Février",
				"Mars",
				"Avril",
				"Mai",
				"Juin",
				"Juillet",
				"Août",
				"Septembre",
				"Octobre",
				"Novembre",
				"Décembre",
			],
			monthsShort: [
				"Jan",
				"Fév",
				"Mar",
				"Avr",
				"Mai",
				"Juin",
				"Juil",
				"Aoû",
				"Sep",
				"Oct",
				"Nov",
				"Déc",
			],
			quarters: ["T1", "T2", "T3", "T4"],
			halfYears: ["S1", "S2"],
			weekdays: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
			weekdaysShort: ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
			placeholder: "Sélectionner une date...",
			rangePlaceholder: "Sélectionner une plage de dates...",
		},
		de: {
			selectDate: "Datum auswählen",
			apply: "Anwenden",
			cancel: "Abbrechen",
			clear: "Löschen",
			today: "Heute",
			filterTypes: { is: "ist", before: "vor", after: "nach", between: "zwischen" },
			periodTypes: {
				day: "Tag",
				month: "Monat",
				quarter: "Quartal",
				halfYear: "Halbjahr",
				year: "Jahr",
			},
			months: [
				"Januar",
				"Februar",
				"März",
				"April",
				"Mai",
				"Juni",
				"Juli",
				"August",
				"September",
				"Oktober",
				"November",
				"Dezember",
			],
			monthsShort: [
				"Jan",
				"Feb",
				"Mär",
				"Apr",
				"Mai",
				"Jun",
				"Jul",
				"Aug",
				"Sep",
				"Okt",
				"Nov",
				"Dez",
			],
			quarters: ["Q1", "Q2", "Q3", "Q4"],
			halfYears: ["H1", "H2"],
			weekdays: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
			weekdaysShort: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
			placeholder: "Datum auswählen...",
			rangePlaceholder: "Datumsbereich auswählen...",
		},
	};

	const i18nConfigs: Record<LocalizedLanguage, DateSelectorI18nConfig> = {
		en: DEFAULT_DATE_SELECTOR_I18N,
		es: { ...DEFAULT_DATE_SELECTOR_I18N, ...translations.es },
		fr: { ...DEFAULT_DATE_SELECTOR_I18N, ...translations.fr },
		de: { ...DEFAULT_DATE_SELECTOR_I18N, ...translations.de },
	};

	/**
	 * What changes with the language beyond the strings: the day pattern and the first day of the
	 * week. Those are props, not part of the i18n table, which is why they live here.
	 */
	const languageMetadata: Record<
		LocalizedLanguage,
		{
			label: string;
			dateFormat: string;
			weekStartsOn: DateSelectorWeekStartsOn;
			ui: { label: string; hint: string; placeholder: string };
		}
	> = {
		en: {
			label: "English",
			dateFormat: "MM/dd/yyyy",
			weekStartsOn: 0,
			ui: {
				label: "Due date",
				hint: "Try: 2025, Q4, 05/10/2025",
				placeholder: "Select a date",
			},
		},
		es: {
			label: "Español",
			dateFormat: "dd/MM/yyyy",
			weekStartsOn: 1,
			ui: {
				label: "Fecha de vencimiento",
				hint: "Prueba: 2025, T4, 05/10/2025",
				placeholder: "Seleccionar una fecha",
			},
		},
		fr: {
			label: "Français",
			dateFormat: "dd/MM/yyyy",
			weekStartsOn: 1,
			ui: {
				label: "Date d'échéance",
				hint: "Essayez: 2025, T4, 05/10/2025",
				placeholder: "Sélectionner une date",
			},
		},
		de: {
			label: "Deutsch",
			dateFormat: "dd.MM.yyyy",
			weekStartsOn: 1,
			ui: {
				label: "Fälligkeitsdatum",
				hint: "Versuchen Sie: 2025, Q4, 05.10.2025",
				placeholder: "Datum auswählen",
			},
		},
	};

	const languageOptions = Object.entries(languageMetadata).map(([value, meta]) => ({
		value: value as LocalizedLanguage,
		label: meta.label,
	}));

	let localizedLanguage = $state<LocalizedLanguage>("fr");
	let localizedOpen = $state(false);
	let localizedValue = $state<DateSelectorValue | undefined>();
	let localizedDraft = $state<DateSelectorValue | undefined>();

	const localizedMeta = $derived(languageMetadata[localizedLanguage]);
	const localizedI18n = $derived(i18nConfigs[localizedLanguage]);
	const localizedLabel = $derived(
		(localizedValue
			? formatDateValue(localizedValue, localizedI18n, localizedMeta.dateFormat)
			: "") || localizedMeta.ui.placeholder,
	);

	function handleLocalizedOpenChange(open: boolean) {
		localizedOpen = open;
		if (open) localizedDraft = localizedValue;
	}

	function applyLocalized() {
		localizedValue = localizedDraft;
		localizedOpen = false;
	}

	function cancelLocalized() {
		localizedDraft = localizedValue;
		localizedOpen = false;
	}

	/* ---------------------------------------------------------------------------------------
	 * API reference
	 * ------------------------------------------------------------------------------------ */

	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "value",
			type: "DateSelectorValue",
			default: "undefined",
			description:
				"Bindable; the whole selection as one structured value — `period`, `operator`, and the day or period fields that granularity uses. Also written by a successful free-text parse. A value set from outside is mirrored into the panel without firing `onValueChange`; setting it to `undefined` is ignored — clearing goes through the input's clear button.",
		},
		{
			prop: "onValueChange",
			type: "(value: DateSelectorValue) => void",
			default: "—",
			description:
				"Called with the next value after every user-driven change: a day or period click, an operator or granularity switch, a clear, or a successful input parse. Never fires on mount, nor when `value` is set from outside.",
		},
		{
			prop: "allowRange",
			type: "boolean",
			default: "true",
			description:
				"Whether the `between` tab renders and the views take two endpoints. With `false`, an operator of `between` arriving through `value` or `presetMode` still selects a single point.",
		},
		{
			prop: "periodTypes",
			type: "DateSelectorPeriodType[]",
			default: "—",
			description:
				"Restricts which granularity tabs render, always in day → year order whatever the array's order. An empty array renders no tab at all.",
		},
		{
			prop: "defaultPeriodType",
			type: "DateSelectorPeriodType",
			default: "'day'",
			description:
				"The granularity shown before any value exists, and the one an incoming `value` without a `period` falls back to. When `periodTypes` excludes it, the first allowed entry is used instead.",
		},
		{
			prop: "defaultFilterType",
			type: "DateSelectorFilterType",
			default: "'is'",
			description:
				"The operator active before any value exists. An initial `value.operator` wins over it, and `presetMode` wins over both.",
		},
		{
			prop: "presetMode",
			type: "DateSelectorFilterType",
			default: "—",
			description:
				"Pins the operator: the filter toggle dims and ignores clicks, the pinned operator overrides `value.operator`, and free-text parses take it too. Every value sync while it is set — a `value` present at mount, any click — also stores the pinned operator as the user's own choice, so removing it later keeps the pinned operator; the earlier choice survives only when nothing was synced under the pin.",
		},
		{
			prop: "showInput",
			type: "boolean",
			default: "true",
			description:
				"Whether the text field and its clear button render between the toggle and the tabs. The clear button is the only in-panel way to empty the selection while keeping the current granularity and operator — switching either one also discards it; from outside, a `value` carrying only `period` and `operator` empties it the same way.",
		},
		{
			prop: "showTwoMonths",
			type: "boolean",
			default: "true",
			description:
				"Whether the day view lays two months side by side. Below the mobile breakpoint a single month always renders.",
		},
		{
			prop: "label",
			type: "string",
			default: "—",
			description:
				"A heading rendered before the filter toggle, on the same row. An empty string renders nothing.",
		},
		{
			prop: "yearRange",
			type: "number",
			default: "10",
			description:
				"How many years the month, quarter, half-year and year views list when `minYear` and `maxYear` are not both set: that many consecutive years, starting `floor(yearRange / 2)` years before `baseYear`.",
		},
		{
			prop: "baseYear",
			type: "number",
			default: "—",
			description:
				"The year the `yearRange` window is centred on. Unset means the current year, so the window follows the clock.",
		},
		{
			prop: "minYear",
			type: "number",
			default: "—",
			description:
				"First listed year. Takes effect only together with `maxYear`; on its own it is ignored and the `yearRange` window applies.",
		},
		{
			prop: "maxYear",
			type: "number",
			default: "—",
			description:
				"Last listed year. Takes effect only together with `minYear`; a `maxYear` below `minYear` lists no year at all.",
		},
		{
			prop: "i18n",
			type: "Partial<DateSelectorI18nConfig>",
			default: "—",
			description:
				"String overrides, shallow-merged over `DEFAULT_DATE_SELECTOR_I18N`: a top-level key you omit keeps its default, but a nested table you supply (`filterTypes`, `months`, …) replaces the default one whole.",
		},
		{
			prop: "inputHint",
			type: "string",
			default: "—",
			description:
				"Placeholder shown while the input is focused, hinting at what it parses. Setting it also makes the input editable: it accepts a bare year, `Q1`–`Q4` with an optional year, or a day in one of the date-fns patterns, and abandons anything unparseable on blur. Without it the input is a read-only display.",
		},
		{
			prop: "dayDateFormat",
			type: "string",
			default: "'MM/dd/yyyy'",
			description:
				"The date-fns pattern day values display with. Free-text parsing tries it first unless `dayDateFormats` already lists it, in which case it keeps the position it has there.",
		},
		{
			prop: "dayDateFormats",
			type: "string[]",
			default: "—",
			description:
				"Additional date-fns patterns parsing tries, in order, with `dayDateFormat` prepended when it is missing. Supplying any replaces the built-in fallback list (`dd/MM/yyyy`, `yyyy-MM-dd`, `MM-dd-yyyy`, `dd-MM-yyyy`).",
		},
		{
			prop: "weekStartsOn",
			type: "DateSelectorWeekStartsOn",
			default: "—",
			description:
				"The day the week columns start on: `0` is Sunday, `6` is Saturday. Unset leaves the calendar's own Sunday start.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged after the wrapper's own classes, which fix a 470px width from the `sm` breakpoint up.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered wrapper `<div>`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the wrapper `<div>`.",
		},
	];

	const filterToggleProps: PropRow[] = [
		{
			prop: "value",
			type: "DateSelectorFilterType",
			default: "—",
			description:
				"The active operator. Required. Seeds the highlighted tab and moves it whenever it changes, but the highlight is the underlying Tabs' own state: a tab focused with an arrow key highlights itself before `onValueChange` reports it, so the two stay together only while that report is echoed back into `value`. A `presetMode` only shows once `value` carries it.",
		},
		{
			prop: "onValueChange",
			type: "(value: DateSelectorFilterType) => void",
			default: "—",
			description:
				"Called with the clicked operator. Required. Suppressed entirely while `presetMode` is set.",
		},
		{
			prop: "showBetween",
			type: "boolean",
			default: "true",
			description:
				"Whether the `between` tab renders; `before` and `after` always do. The root passes `allowRange` here.",
		},
		{
			prop: "showIs",
			type: "boolean",
			default: "true",
			description: "Whether the `is` tab renders. The root never turns it off.",
		},
		{
			prop: "presetMode",
			type: "DateSelectorFilterType",
			default: "—",
			description:
				"When set the list drops to half opacity, stops taking pointer events and stops reporting changes. It does not move the highlighted tab, but the dimmed list still takes keyboard focus: an arrow key re-highlights the focused tab locally and the dropped report never undoes that, so `value` decides the highlight only until an arrow key is pressed.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Applied to both the Tabs root and its list, as upstream does.",
		},
	];

	const periodTabsProps: PropRow[] = [
		{
			prop: "value",
			type: "DateSelectorPeriodType",
			default: "—",
			description:
				"The active granularity. Required; the navigation cluster only renders while it is `'day'`.",
		},
		{
			prop: "onValueChange",
			type: "(value: DateSelectorPeriodType) => void",
			default: "—",
			description: "Called with the clicked granularity. Required.",
		},
		{
			prop: "periodTypes",
			type: "readonly DateSelectorPeriodType[]",
			default: "—",
			description:
				"Restricts which tabs render; the order is always day, month, quarter, half-year, year whatever the array's order. An empty array renders no tab.",
		},
		{
			prop: "calendarMonth",
			type: "DateValue",
			default: "—",
			description:
				"The month the chevrons step from. It also drives the return-to-today button: hidden while this is the current month, its arrow pointing back from the future or from the past.",
		},
		{
			prop: "onCalendarMonthChange",
			type: "(month: DateValue) => void",
			default: "—",
			description:
				"Called with the previous or next month from the chevrons, or with today's month from the return button.",
		},
		{
			prop: "showNavigationButtons",
			type: "boolean",
			default: "false",
			description:
				"Whether the month navigation cluster renders. Three more conditions apply: `value` must be `'day'`, and `calendarMonth` and `onCalendarMonthChange` must both be set.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged onto the wrapping row that holds the tabs and the navigation cluster.",
		},
	];

	const dayPickerProps: PropRow[] = [
		{
			prop: "month",
			type: "DateValue",
			default: "—",
			description:
				"The first displayed month; the second, when two render, follows it. Required. Passed to the calendar as its placeholder — not bound — so a new value moves the view, while the calendar's own keyboard navigation moves the view without writing back to it.",
		},
		{
			prop: "onMonthChange",
			type: "(month: DateValue) => void",
			default: "—",
			description:
				"Called when the calendar itself moves the view: arrow keys crossing a month boundary, or bits-ui recentring on a fresh selection. Leaving it unset does not pin the view: the calendar still moves on its own, and only `month` goes stale until the next value you pass.",
		},
		{
			prop: "selectedDate",
			type: "DateValue",
			default: "—",
			description: "The selected day, or the range start when `isRange` is set.",
		},
		{
			prop: "selectedEndDate",
			type: "DateValue",
			default: "—",
			description: "The range end. Ignored in single mode.",
		},
		{
			prop: "isRange",
			type: "boolean",
			default: "false",
			description:
				"Swaps the single-select Calendar for a RangeCalendar, whose hover preview and endpoint ordering come for free. The root passes `filterType === 'between' && allowRange`.",
		},
		{
			prop: "onDaySelect",
			type: "(day: DateValue) => void",
			default: "—",
			description:
				"Single mode only: called with the clicked day. Clicking the selected day again keeps it selected rather than clearing it, so the callback never receives an empty value.",
		},
		{
			prop: "onRangeSelect",
			type: "(start: DateValue | undefined, end: DateValue | undefined) => void",
			default: "—",
			description:
				"Range mode only: `(start, undefined)` when a range opens or restarts, `(start, end)` once it closes, the pair already ordered. Not called when the reported start is the `selectedDate` already held — that is bits-ui echoing the value back.",
		},
		{
			prop: "showTwoMonths",
			type: "boolean",
			default: "true",
			description:
				"Whether two months render side by side. Below the mobile breakpoint the picker always collapses to one month.",
		},
		{
			prop: "weekStartsOn",
			type: "DateSelectorWeekStartsOn",
			default: "—",
			description:
				"The day the week columns start on: `0` is Sunday. Unset is Sunday. Head labels come from the i18n `weekdaysShort` table, falling back to `weekdays` for an empty or missing entry — never from the locale.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged onto the wrapping `<div>`, not the calendar root.",
		},
	];

	const periodGridProps: PropRow[] = [
		{
			prop: "years",
			type: "number[]",
			default: "—",
			description: "One section per entry, in the given order, each headed by its year. Required.",
		},
		{
			prop: "items",
			type: "string[]",
			default: "—",
			description:
				"The cell labels repeated under every year — the i18n `monthsShort`, `quarters` or `halfYears` table. A cell's index is the `value` reported on click. Required.",
		},
		{
			prop: "selectedYear",
			type: "number",
			default: "—",
			description: "Together with `selectedValue`, the one cell drawn as selected.",
		},
		{
			prop: "selectedValue",
			type: "number",
			default: "—",
			description: "The zero-based index, inside `selectedYear`, of the selected cell.",
		},
		{
			prop: "rangeStart",
			type: "DateSelectorPeriodPoint",
			default: "—",
			description:
				"The cell drawn as the range's first endpoint, with the same filled style as a selection.",
		},
		{
			prop: "rangeEnd",
			type: "DateSelectorPeriodPoint",
			default: "—",
			description: "The cell drawn as the range's last endpoint.",
		},
		{
			prop: "isInRange",
			type: "(year: number, value: number) => boolean",
			default: "—",
			description:
				"Asked once per cell; a `true` cell that is neither the selection nor an endpoint gets the accent background. Required.",
		},
		{
			prop: "onSelect",
			type: "(year: number, value: number) => void",
			default: "—",
			description: "Called with the clicked cell's year and index. Required.",
		},
		{
			prop: "columns",
			type: "number",
			default: "—",
			description:
				"Cells per row, set as an inline grid template: the root passes 3 for months, 4 for quarters, 2 for half-years. Required.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged onto the wrapping `<div>`.",
		},
	];

	const yearListProps: PropRow[] = [
		{
			prop: "years",
			type: "number[]",
			default: "—",
			description: "The buttons, in the given order, on a two-column grid. Required.",
		},
		{
			prop: "selectedYear",
			type: "number",
			default: "—",
			description:
				"The year drawn as selected — but only while no `rangeStart` or `rangeEnd` exists; a range highlights its endpoints instead.",
		},
		{
			prop: "rangeStart",
			type: "DateSelectorPeriodPoint",
			default: "—",
			description: "The year drawn as the range's first endpoint; only its `year` is read.",
		},
		{
			prop: "rangeEnd",
			type: "DateSelectorPeriodPoint",
			default: "—",
			description: "The year drawn as the range's last endpoint; only its `year` is read.",
		},
		{
			prop: "isYearInRange",
			type: "(year: number) => boolean",
			default: "—",
			description:
				"Asked once per year; a `true` year that is neither the selection nor an endpoint gets the accent background. Required.",
		},
		{
			prop: "onSelect",
			type: "(year: number) => void",
			default: "—",
			description: "Called with the clicked year. Required.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged onto the wrapping `<div>`.",
		},
	];
</script>

<DocPage title="Date selector">
	{#snippet subtitle()}
		A single control for picking a day, a month, a quarter, a half-year or a year — behind an
		is/before/after/between operator, with a free-text input that parses all of them. Four examples
		follow.
	{/snippet}

	<DocSection title="Basic date selector">
		{#snippet blurb()}
			The panel inline, with the parsing hint that makes its input editable — the dump below is the
			structured value it publishes.
		{/snippet}
		<div class="flex w-full flex-col items-center gap-5">
			<Card.Root class="p-0">
				<Card.Content class="p-3">
					<DateSelector
						bind:value={basicValue}
						label="Due date"
						inputHint="Try: 2025, Q4, 05/10/2025"
					/>
				</Card.Content>
			</Card.Root>

			{#if basicDebug}
				<pre
					class="w-full overflow-auto rounded-md bg-muted p-3 font-mono text-xs md:w-[500px]">{basicDebug}</pre>
			{:else}
				<div class="text-sm text-muted-foreground">
					No value selected. Select a date to see the debug information.
				</div>
			{/if}
		</div>
	</DocSection>

	<DocSection title="Date selector with popover">
		{#snippet blurb()}
			Behind a trigger button, editing a draft that Apply commits and Cancel discards.
		{/snippet}
		<Popover.Root open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="w-56 justify-start">
						<CalendarIcon data-icon="inline-start" />
						{popoverLabel}
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto gap-3 p-0" align="start" sideOffset={4}>
				<div class="p-3">
					<DateSelector
						bind:value={popoverDraft}
						allowRange={true}
						label="Due date"
						inputHint="Try: 2025, Q4, 05/10/2025"
					/>
				</div>
				<Separator />
				<div class="flex justify-end gap-2 p-3 pt-0">
					<Button variant="outline" onclick={cancelPopover}>Cancel</Button>
					<Button onclick={applyPopover}>Apply</Button>
				</div>
			</Popover.Content>
		</Popover.Root>
	</DocSection>

	<DocSection title="Date selector with dialog">
		{#snippet blurb()}
			The same draft-then-apply model in a modal, where the footer owns the two actions and the
			dialog's own close button is suppressed.
		{/snippet}
		<Dialog.Root open={dialogOpen} onOpenChange={handleDialogOpenChange}>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="w-56 justify-start">
						<CalendarIcon data-icon="inline-start" />
						{dialogLabel}
					</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-lg" showCloseButton={false}>
				<Dialog.Header>
					<Dialog.Title>Select Due Date</Dialog.Title>
				</Dialog.Header>

				<DateSelector bind:value={dialogDraft} showInput={true} />

				<Dialog.Footer>
					<Dialog.Close>
						{#snippet child({ props })}
							<Button {...props} variant="outline">Cancel</Button>
						{/snippet}
					</Dialog.Close>
					<Button onclick={applyDialog}>Apply</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</DocSection>

	<DocSection title="Date selector with dropdown menu">
		{#snippet blurb()}
			A language menu driving the whole panel: the strings, the day pattern and the first day of the
			week all follow the choice.
		{/snippet}
		<div class="flex w-full flex-col gap-4">
			<div class="flex w-full justify-end">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" size="sm">
								{localizedMeta.label}
								<ChevronDownIcon data-icon="inline-end" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="start">
						{#each languageOptions as language (language.value)}
							<DropdownMenu.Item onSelect={() => (localizedLanguage = language.value)}>
								{language.label}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
			<div class="flex grow items-center justify-center">
				<Dialog.Root open={localizedOpen} onOpenChange={handleLocalizedOpenChange}>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="w-56 justify-start">
								<CalendarIcon data-icon="inline-start" />
								{localizedLabel}
							</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-lg" showCloseButton={false}>
						<Dialog.Header>
							<Dialog.Title>{localizedMeta.ui.label}</Dialog.Title>
						</Dialog.Header>
						<DateSelector
							bind:value={localizedDraft}
							showInput={true}
							i18n={localizedI18n}
							dayDateFormat={localizedMeta.dateFormat}
							weekStartsOn={localizedMeta.weekStartsOn}
						/>
						<Dialog.Footer>
							<Dialog.Close>
								{#snippet child({ props })}
									<Button {...props} variant="outline" onclick={cancelLocalized}>
										{localizedI18n.cancel}
									</Button>
								{/snippet}
							</Dialog.Close>
							<Button onclick={applyLocalized}>{localizedI18n.apply}</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		</div>
	</DocSection>
	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">DateSelector.Root</h3>
			<p class="text-sm text-muted-foreground">
				The whole panel: an optional label and the filter toggle on one row, the text input, the
				granularity tabs, then the day picker or the scrolling grid the active granularity calls
				for. It owns the state FilterToggle, PeriodTabs and DayPicker read from context, so those
				three throw when rendered outside it; PeriodGrid and YearList read no context and work
				anywhere.
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
			<h3 class="text-base font-medium">DateSelector.FilterToggle</h3>
			<p class="text-sm text-muted-foreground">
				The <code>is</code> / <code>before</code> / <code>after</code> / <code>between</code> tabs —
				a controlled Tabs that reads only the i18n strings from context. It spreads nothing:
				<code>class</code> is its only styling hook.
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
							{#each filterToggleProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DateSelector.PeriodTabs</h3>
			<p class="text-sm text-muted-foreground">
				The granularity tabs, plus the month navigation cluster (return to today, previous, next)
				the day view relies on, since the picker renders no navigation of its own. It spreads
				nothing: <code>class</code> is its only styling hook.
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
							{#each periodTabsProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DateSelector.DayPicker</h3>
			<p class="text-sm text-muted-foreground">
				The day view: one or two months from this theme's Calendar or RangeCalendar, with weekday
				and month captions taken from the i18n tables rather than the locale. It reads the i18n
				strings from context and spreads nothing: <code>class</code> is its only styling hook.
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
							{#each dayPickerProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DateSelector.PeriodGrid</h3>
			<p class="text-sm text-muted-foreground">
				A stack of year sections, each a grid of month, quarter or half-year buttons. Purely
				presentational — it reads no context, so it also works outside the root — and it spreads
				nothing: <code>class</code> is its only styling hook.
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
							{#each periodGridProps as row (row.prop)}
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
			<h3 class="text-base font-medium">DateSelector.YearList</h3>
			<p class="text-sm text-muted-foreground">
				A two-column grid of year buttons. Purely presentational — it reads no context, so it also
				works outside the root — and it spreads nothing: <code>class</code> is its only styling hook.
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
							{#each yearListProps as row (row.prop)}
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
