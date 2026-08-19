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
</DocPage>
