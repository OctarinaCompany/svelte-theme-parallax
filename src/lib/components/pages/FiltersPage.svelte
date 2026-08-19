<script lang="ts">
	import { z } from "zod";
	import AtSignIcon from "@lucide/svelte/icons/at-sign";
	import BanIcon from "@lucide/svelte/icons/ban";
	import BellIcon from "@lucide/svelte/icons/bell";
	import BuildingIcon from "@lucide/svelte/icons/building";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import ClockIcon from "@lucide/svelte/icons/clock";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import FunnelXIcon from "@lucide/svelte/icons/funnel-x";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import LinkIcon from "@lucide/svelte/icons/link";
	import ListFilterIcon from "@lucide/svelte/icons/list-filter";
	import MailIcon from "@lucide/svelte/icons/mail";
	import MapPinIcon from "@lucide/svelte/icons/map-pin";
	import PackageIcon from "@lucide/svelte/icons/package";
	import PhoneIcon from "@lucide/svelte/icons/phone";
	import SlidersVerticalIcon from "@lucide/svelte/icons/sliders-vertical";
	import StarIcon from "@lucide/svelte/icons/star";
	import TagIcon from "@lucide/svelte/icons/tag";
	import UserIcon from "@lucide/svelte/icons/user";
	import UserRoundCheckIcon from "@lucide/svelte/icons/user-round-check";
	import UserRoundXIcon from "@lucide/svelte/icons/user-round-x";
	import UserSearchIcon from "@lucide/svelte/icons/user-search";
	import UsersIcon from "@lucide/svelte/icons/users";

	import type { CellContext, HeaderContext } from "@tanstack/table-core";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as DataTable from "$lib/components/ui/data-table/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { createDataTable, type DataTableColumnDef } from "$lib/components/ui/data-table/index.js";
	import {
		Filters,
		createFilter,
		type CustomRendererProps,
		type Filter,
		type FilterFieldConfig,
		type FilterI18nConfig,
		type FilterOption,
		type FilterOptionListRenderProps,
	} from "$lib/components/ui/filters/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import FiltersDateDialogInput from "$lib/components/pages/filters-date-dialog-input.svelte";
	import FiltersDateRangeInput from "$lib/components/pages/filters-date-range-input.svelte";
	import FiltersDateTimeInput from "$lib/components/pages/filters-date-time-input.svelte";
	import FiltersSliderRangeInput from "$lib/components/pages/filters-slider-range-input.svelte";
	import FiltersVirtualizedOptions from "$lib/components/pages/filters-virtualized-options.svelte";
	import { cn } from "$lib/utils.js";

	/**
	 * The Filters component page — its twelve examples in the order that page gives them.
	 *
	 * The File upload page next door records the standing conventions in general. What is specific
	 * to this one is that the component itself had to be built first: the reference implementation is 2 150 lines
	 * with no counterpart anywhere in this repository, and it now lives in
	 * `$lib/components/ui/filters/`, which documents its own translation decisions file by file.
	 * This page documents the twelve examples that exercise it.
	 *
	 * FIVE STANDING RULES apply to the whole demo set:
	 *
	 * 1. NO PHOTOGRAPHS, NO FLAGS. Upstream's assignee lists load sixteen portraits from
	 *    `randomuser.me`, its country list 171 SVG flags from `flagcdn.com`, and its data grid twelve
	 *    photographs from stock-photo. This repository ships no images and fetches none — the same
	 *    substitution the File upload page makes for the same reason. Avatars become initials, and
	 *    the country and language lists lose their flags and keep their names, which is the half a
	 *    filter actually reads.
	 *
	 * 2. NO RAW PALETTE COLOURS. §12 of the theme notes forbids `bg-green-500` and friends, and
	 *    upstream paints priorities, statuses and availability with eight of them. Everything here is
	 *    a token. Where a ladder needs more steps than the token set has hues — five priorities, from
	 *    low to critical — the last three are one hue at three strengths, which reads as escalation
	 *    where five unrelated hues read as a legend.
	 *
	 * 3. ONE ICON SIZE. `size-3.5` on every field icon — no stray inherited 4 on the first
	 *    example. The whole page is 3.5.
	 *
	 * 4. THE MODAL DATE PICKER IS THIS REPOSITORY'S CALENDAR. The "Custom controls" example could
	 *    fill its dialog with `DateSelector`, a separate component with a page of its own. The dialog
	 *    and its model are reproduced exactly; what is inside it is the `Calendar` already here.
	 *    `filters-date-dialog-input.svelte` says so at its own call site.
	 *
	 * 5. THE TWO DATA GRID EXAMPLES ARE ACTUALLY TWO. Upstream's "Data grid" already simulates a
	 *    request — an 800-2 000ms delay and a skeleton — so its "Data grid and async mode" differs
	 *    from it only by a 300ms debounce, which is not a difference a reader can see. Here the first
	 *    filters the grid directly and the second puts the same grid behind a debounced, simulated
	 *    request. The pair now demonstrates two things instead of one thing twice, and the 917-line
	 *    duplicate is a shared dataset and a shared column set.
	 *
	 * WHAT THE CONFIGS LOOK LIKE, AND WHY. Every `fields` array below is a `$derived`, not a `const`.
	 * A field's `icon` is a snippet, snippets are declared in markup, and a `const` initialiser runs
	 * before the markup exists; `$derived` reads lazily — its first read is during render, by which
	 * point every snippet is defined. It also never recomputes, since none of these arrays reads
	 * reactive state (the internationalisation example, which does, is the one exception and is
	 * meant to rebuild). That stability matters: the component keeps its value→label cache in a
	 * `WeakMap` keyed on the field object, and an array rebuilt on every render would throw it away.
	 */

	/* ---------------------------------------------------------------------------------------
	 * Shared recipes
	 * ------------------------------------------------------------------------------------ */

	/** `John Doe` → `JD`. What an avatar shows in place of a photograph. */
	function initials(name: string): string {
		return name
			.split(" ")
			.map((part) => part[0])
			.join("")
			.slice(0, 2)
			.toUpperCase();
	}

	/**
	 * The five-step priority ladder, in tokens.
	 *
	 * A raw green / yellow / violet / orange / red ladder is what §12 rules out, and it is not an
	 * escalation anyway — violet sits between yellow and orange. Two status tokens carry the bottom
	 * of the ladder and the top three are `destructive` at three strengths, so the ramp reads in one
	 * pass and every value survives a palette change.
	 */
	const PRIORITY_TONE: Record<string, string> = {
		low: "bg-success",
		medium: "bg-warning",
		high: "bg-destructive/50",
		urgent: "bg-destructive/75",
		critical: "bg-destructive",
	};

	/** The same ladder for the star icons of examples 3 to 5, which stop at four steps. */
	const PRIORITY_TEXT_TONE: Record<string, string> = {
		low: "text-success",
		medium: "text-warning",
		high: "text-destructive/70",
		urgent: "text-destructive",
	};

	/* ---------------------------------------------------------------------------------------
	 * 1. Field types
	 * ------------------------------------------------------------------------------------ */

	const COUNTRIES: FilterOption<string>[] = (
		[
			["AF", "Afghanistan"],
			["AL", "Albania"],
			["DZ", "Algeria"],
			["AS", "American Samoa"],
			["AD", "Andorra"],
			["AO", "Angola"],
			["AI", "Anguilla"],
			["AG", "Antigua and Barbuda"],
			["AR", "Argentina"],
			["AM", "Armenia"],
			["AU", "Australia"],
			["AT", "Austria"],
			["AZ", "Azerbaijan"],
			["BS", "Bahamas"],
			["BH", "Bahrain"],
			["BD", "Bangladesh"],
			["BB", "Barbados"],
			["BY", "Belarus"],
			["BE", "Belgium"],
			["BZ", "Belize"],
			["BJ", "Benin"],
			["BM", "Bermuda"],
			["BT", "Bhutan"],
			["BO", "Bolivia"],
			["BA", "Bosnia and Herzegovina"],
			["BW", "Botswana"],
			["BR", "Brazil"],
			["IO", "British Indian Ocean Territory"],
			["BN", "Brunei Darussalam"],
			["BG", "Bulgaria"],
			["BF", "Burkina Faso"],
			["BI", "Burundi"],
			["KH", "Cambodia"],
			["CM", "Cameroon"],
			["CA", "Canada"],
			["CV", "Cape Verde"],
			["KY", "Cayman Islands"],
			["CF", "Central African Republic"],
			["TD", "Chad"],
			["CL", "Chile"],
			["CN", "China"],
			["CO", "Colombia"],
			["KM", "Comoros"],
			["CG", "Congo"],
			["CR", "Costa Rica"],
			["CI", "Cote D'Ivoire"],
			["HR", "Croatia"],
			["CU", "Cuba"],
			["CY", "Cyprus"],
			["CZ", "Czech Republic"],
			["DK", "Denmark"],
			["DJ", "Djibouti"],
			["DM", "Dominica"],
			["DO", "Dominican Republic"],
			["EC", "Ecuador"],
			["EG", "Egypt"],
			["SV", "El Salvador"],
			["GQ", "Equatorial Guinea"],
			["ER", "Eritrea"],
			["EE", "Estonia"],
			["SZ", "Eswatini"],
			["ET", "Ethiopia"],
			["FI", "Finland"],
			["FR", "France"],
			["GA", "Gabon"],
			["GM", "Gambia"],
			["GE", "Georgia"],
			["DE", "Germany"],
			["GH", "Ghana"],
			["GR", "Greece"],
			["GD", "Grenada"],
			["GT", "Guatemala"],
			["GN", "Guinea"],
			["GW", "Guinea-Bissau"],
			["GY", "Guyana"],
			["HT", "Haiti"],
			["HN", "Honduras"],
			["HK", "Hong Kong"],
			["HU", "Hungary"],
			["IS", "Iceland"],
			["IN", "India"],
			["ID", "Indonesia"],
			["IR", "Iran"],
			["IQ", "Iraq"],
			["IE", "Ireland"],
			["IL", "Israel"],
			["IT", "Italy"],
			["JM", "Jamaica"],
			["JP", "Japan"],
			["JO", "Jordan"],
			["KZ", "Kazakhstan"],
			["KE", "Kenya"],
			["KR", "South Korea"],
			["KW", "Kuwait"],
			["KG", "Kyrgyzstan"],
			["LA", "Laos"],
			["LV", "Latvia"],
			["LB", "Lebanon"],
			["LS", "Lesotho"],
			["LR", "Liberia"],
			["LY", "Libya"],
			["LT", "Lithuania"],
			["LU", "Luxembourg"],
			["MO", "Macao"],
			["MG", "Madagascar"],
			["MW", "Malawi"],
			["MY", "Malaysia"],
			["MV", "Maldives"],
			["ML", "Mali"],
			["MT", "Malta"],
			["MH", "Marshall Islands"],
			["MR", "Mauritania"],
			["MU", "Mauritius"],
			["MX", "Mexico"],
			["FM", "Micronesia"],
			["MD", "Moldova"],
			["MC", "Monaco"],
			["MN", "Mongolia"],
			["ME", "Montenegro"],
			["MA", "Morocco"],
			["MZ", "Mozambique"],
			["MM", "Myanmar"],
			["NA", "Namibia"],
			["NP", "Nepal"],
			["NL", "Netherlands"],
			["NZ", "New Zealand"],
			["NI", "Nicaragua"],
			["NG", "Nigeria"],
			["NO", "Norway"],
			["OM", "Oman"],
			["PK", "Pakistan"],
			["PA", "Panama"],
			["PG", "Papua New Guinea"],
			["PY", "Paraguay"],
			["PE", "Peru"],
			["PH", "Philippines"],
			["PL", "Poland"],
			["PT", "Portugal"],
			["QA", "Qatar"],
			["RO", "Romania"],
			["RU", "Russia"],
			["RW", "Rwanda"],
			["WS", "Samoa"],
			["SM", "San Marino"],
			["SA", "Saudi Arabia"],
			["SN", "Senegal"],
			["RS", "Serbia"],
			["SG", "Singapore"],
			["SK", "Slovakia"],
			["SI", "Slovenia"],
			["ZA", "South Africa"],
			["ES", "Spain"],
			["LK", "Sri Lanka"],
			["SE", "Sweden"],
			["CH", "Switzerland"],
			["SY", "Syria"],
			["TW", "Taiwan"],
			["TJ", "Tajikistan"],
			["TZ", "Tanzania"],
			["TH", "Thailand"],
			["TR", "Turkey"],
			["UG", "Uganda"],
			["UA", "Ukraine"],
			["AE", "United Arab Emirates"],
			["GB", "United Kingdom"],
			["US", "United States"],
			["UY", "Uruguay"],
			["UZ", "Uzbekistan"],
			["VN", "Vietnam"],
			["ZM", "Zambia"],
			["ZW", "Zimbabwe"],
		] as const
	).map(([value, label]) => ({ value, label }));

	const PEOPLE = [
		"John Doe",
		"Jane Smith",
		"Bob Johnson",
		"Alice Brown",
		"Nick Bold",
		"Sarah Wilson",
		"Michael Scott",
		"Emily Blunt",
		"David Gandy",
		"Laura Palmer",
		"Kevin Hart",
		"Anna Kendrick",
		"Tom Cruise",
		"Lisa Kudrow",
		"James Bond",
	];

	let typesFilters = $state<Filter<string>[]>([
		createFilter("priority", "is_any_of", ["low", "medium", "critical"]),
	]);

	const typesFields: FilterFieldConfig<string>[] = $derived([
		{
			group: "Basic",
			fields: [
				{ key: "text", label: "Text", type: "text", icon: iconMail, placeholder: "Search text..." },
				{
					key: "email",
					label: "Email",
					type: "text",
					icon: iconAtSign,
					placeholder: "user@example.com",
				},
				{
					key: "website",
					label: "Website",
					type: "text",
					icon: iconGlobe,
					placeholder: "https://example.com",
				},
				{
					key: "phone",
					label: "Phone",
					type: "text",
					icon: iconPhone,
					placeholder: "+1 (123) 456-7890",
				},
			],
		},
		{
			group: "Select",
			fields: [
				{
					key: "status",
					label: "Status",
					type: "select",
					icon: iconBell,
					searchable: false,
					class: "w-[200px]",
					options: [
						{ value: "todo", label: "To Do", icon: statusOptionIcon },
						{ value: "in-progress", label: "In Progress", icon: statusOptionIcon },
						{ value: "done", label: "Done", icon: statusOptionIcon },
						{ value: "cancelled", label: "Cancelled", icon: statusOptionIcon },
					],
				},
				{
					key: "priority",
					label: "Priority",
					type: "multiselect",
					icon: iconBan,
					class: "w-[180px]",
					options: [
						{ value: "low", label: "Low", icon: priorityDot },
						{ value: "medium", label: "Medium", icon: priorityDot },
						{ value: "high", label: "High", icon: priorityDot },
						{ value: "urgent", label: "Urgent", icon: priorityDot },
						{ value: "critical", label: "Critical", icon: priorityDot },
					],
				},
				{
					key: "assignee",
					label: "Assignee",
					type: "multiselect",
					icon: iconUserCheck,
					maxSelections: 5,
					options: [
						...PEOPLE.map((name) => ({
							value: name.toLowerCase().split(" ")[0],
							label: name,
							icon: personAvatar,
						})),
						{ value: "unassigned", label: "Unassigned", icon: unassignedAvatar },
					],
				},
				{
					key: "userType",
					label: "User Type",
					type: "select",
					icon: iconUsers,
					searchable: false,
					class: "w-[200px]",
					options: [
						{ value: "premium", label: "Premium", icon: userTypeIcon },
						{ value: "standard", label: "Standard", icon: userTypeIcon },
						{ value: "trial", label: "Trial", icon: userTypeIcon },
					],
				},
				{
					key: "country",
					label: "Country",
					type: "select",
					icon: iconGlobe,
					searchable: true,
					class: "w-[220px]",
					options: COUNTRIES,
				},
			],
		},
	]);

	/* ---------------------------------------------------------------------------------------
	 * 2. Validation
	 * ------------------------------------------------------------------------------------ */

	/**
	 * A Zod schema as a field validator.
	 *
	 * `error.format()._errors` is the classic way to the first message; `format()` is deprecated
	 * in the Zod 4 this repository depends on, and `issues[0].message` is the same string by a
	 * supported route.
	 */
	function zodValidator(schema: z.ZodType) {
		return (value: unknown): { valid: boolean; message?: string } => {
			const result = schema.safeParse(value);
			if (result.success) return { valid: true };
			return { valid: false, message: result.error.issues[0]?.message ?? "Invalid value" };
		};
	}

	const emailSchema = z
		.string()
		.min(1, { message: "Email is required" })
		.pipe(z.email({ message: "Please enter a valid email address" }));

	const urlSchema = z
		.string()
		.pipe(z.url({ message: "Please enter a valid URL (e.g., https://example.com)" }));

	const phoneSchema = z
		.string()
		.regex(/^\+?[1-9]\d{1,14}$/, { message: "Please enter a valid phone number" });

	const usernameSchema = z
		.string()
		.min(3, { message: "Username must be at least 3 characters" })
		.max(20, { message: "Username must be at most 20 characters" })
		.regex(/^[a-zA-Z0-9_]+$/, {
			message: "Username can only contain letters, numbers, and underscores",
		});

	const cardSchema = z
		.string()
		.regex(/^\d{13,19}$/, { message: "Please enter a valid credit card number (13-19 digits)" });

	let validationFilters = $state<Filter<string>[]>([createFilter("email", "contains", [""])]);

	const validationFields: FilterFieldConfig<string>[] = $derived([
		{
			key: "email",
			label: "Email",
			type: "text",
			icon: iconAtSign,
			placeholder: "user@example.com",
			validation: zodValidator(emailSchema),
		},
		{
			key: "website",
			label: "Website",
			type: "text",
			icon: iconGlobe,
			placeholder: "https://example.com",
			validation: zodValidator(urlSchema),
		},
		{
			key: "phone",
			label: "Phone",
			type: "text",
			icon: iconPhone,
			placeholder: "+1234567890",
			validation: zodValidator(phoneSchema),
		},
		{
			key: "username",
			label: "Username",
			type: "text",
			icon: iconUser,
			class: "w-44",
			placeholder: "john_doe",
			validation: zodValidator(usernameSchema),
		},
		{
			key: "cardNumber",
			label: "Card Number",
			type: "text",
			icon: iconCreditCard,
			placeholder: "4111111111111111",
			validation: zodValidator(cardSchema),
		},
		{
			key: "customUrl",
			label: "Custom URL",
			type: "text",
			icon: iconLink,
			placeholder: "https://...",
			// The one validator written by hand rather than by Zod, which is upstream's point: the
			// field takes a function, not a schema library.
			validation: (value) =>
				/^https?:\/\/.+\..+/.test(String(value))
					? { valid: true }
					: { valid: false, message: "URL must start with http:// or https://" },
		},
	]);

	/* ---------------------------------------------------------------------------------------
	 * 3. Trigger button
	 * ------------------------------------------------------------------------------------ */

	const BASIC_PEOPLE = PEOPLE.slice(0, 5);

	let triggerFilters = $state<Filter<string>[]>([
		createFilter("assignee", "is_any_of", ["john", "nick", "alice"]),
	]);

	const triggerFields: FilterFieldConfig<string>[] = $derived([
		{
			key: "text",
			label: "Text",
			type: "text",
			icon: iconTag,
			class: "w-36",
			placeholder: "Search text...",
		},
		{
			key: "email",
			label: "Email",
			type: "text",
			icon: iconMail,
			class: "w-40",
			placeholder: "user@example.com",
		},
		{
			key: "website",
			label: "Website",
			type: "text",
			icon: iconGlobe,
			class: "w-40",
			placeholder: "https://example.com",
		},
		{
			key: "assignee",
			label: "Assignee",
			type: "multiselect",
			icon: iconUser,
			class: "w-[200px]",
			options: [
				...BASIC_PEOPLE.map((name) => ({
					value: name.toLowerCase().split(" ")[0],
					label: name,
					icon: personAvatar,
				})),
				{ value: "unassigned", label: "Unassigned", icon: unassignedAvatar },
			],
		},
		{
			key: "priority",
			label: "Priority",
			type: "multiselect",
			icon: iconCircleAlert,
			class: "w-[180px]",
			options: [
				{ value: "low", label: "Low", icon: priorityStar },
				{ value: "medium", label: "Medium", icon: priorityStar },
				{ value: "high", label: "High", icon: priorityStar },
				{ value: "urgent", label: "Urgent", icon: priorityStar },
			],
		},
	]);

	/* ---------------------------------------------------------------------------------------
	 * 4 and 5. Small and large controls
	 *
	 * One field set, two `<Filters>`: upstream ships the two examples as byte-identical files that
	 * differ in one prop, and copying six field configs to change `size="sm"` to `size="lg"` would
	 * be copying the wrong half. Upstream also carries two unused state slots in each file and
	 * gives its LARGE example a small trigger button; the dead state is dropped and the trigger
	 * follows its own example's size.
	 * ------------------------------------------------------------------------------------ */

	let smallFilters = $state<Filter<string>[]>([
		createFilter("priority", "is_any_of", ["high", "urgent"]),
	]);
	let largeFilters = $state<Filter<string>[]>([
		createFilter("priority", "is_any_of", ["high", "urgent"]),
	]);

	const sizeFields: FilterFieldConfig<string>[] = $derived([
		{
			key: "text",
			label: "Text",
			type: "text",
			icon: iconTag,
			class: "w-36",
			placeholder: "Search text...",
		},
		{
			key: "email",
			label: "Email",
			type: "text",
			icon: iconMail,
			class: "w-48",
			placeholder: "user@example.com",
		},
		{
			key: "website",
			label: "Website",
			type: "text",
			icon: iconGlobe,
			class: "w-40",
			placeholder: "https://example.com",
		},
		{
			key: "status",
			label: "Status",
			type: "select",
			icon: iconClock,
			searchable: false,
			class: "w-[200px]",
			options: [
				{ value: "todo", label: "To Do", icon: statusOptionIcon },
				{ value: "in-progress", label: "In Progress", icon: statusOptionIcon },
				{ value: "done", label: "Done", icon: statusOptionIcon },
				{ value: "cancelled", label: "Cancelled", icon: statusOptionIcon },
			],
		},
		{
			key: "priority",
			label: "Priority",
			type: "multiselect",
			icon: iconCircleAlert,
			class: "w-[180px]",
			options: [
				{ value: "low", label: "Low", icon: priorityStar },
				{ value: "medium", label: "Medium", icon: priorityStar },
				{ value: "high", label: "High", icon: priorityStar },
				{ value: "urgent", label: "Urgent", icon: priorityStar },
			],
		},
	]);

	/* ---------------------------------------------------------------------------------------
	 * 6. Custom controls
	 *
	 * Each control is a component under `pages/` rather than a snippet on this page, for one
	 * reason: `allowMultiple` is on, so a field can be filtered on twice, and two chips of the same
	 * field must not share one popover's open state. A component per chip is what React's own
	 * example gets for free.
	 *
	 * Upstream gives none of these fields a `defaultOperator`, so a `Date Range` chip added from the
	 * menu opens on `is` — an operator that is not in its own list of two. Each field names its
	 * first operator here instead.
	 * ------------------------------------------------------------------------------------ */

	let customFilters = $state<Filter<unknown>[]>([createFilter("customDateRange", "between", [])]);

	const customFields: FilterFieldConfig<unknown>[] = $derived([
		{
			key: "modalDateSelector",
			label: "Modal Date Selector",
			type: "custom",
			icon: iconCalendar,
			defaultOperator: "is",
			operators: [
				{ value: "is", label: "is" },
				{ value: "is_not", label: "is not" },
			],
			customRenderer: modalDateControl,
		},
		{
			key: "customDateRange",
			label: "Date Range",
			type: "custom",
			icon: iconCalendar,
			defaultOperator: "between",
			operators: [
				{ value: "between", label: "between" },
				{ value: "not_between", label: "not between" },
			],
			customRenderer: dateRangeControl,
		},
		{
			key: "customDateRangePresets",
			label: "Date Range Presets",
			type: "custom",
			icon: iconCalendar,
			defaultOperator: "between",
			operators: [
				{ value: "between", label: "between" },
				{ value: "not_between", label: "not between" },
			],
			customRenderer: dateRangePresetsControl,
		},
		{
			key: "customDateTime",
			label: "Date & Time",
			type: "custom",
			icon: iconClock,
			defaultOperator: "is",
			operators: [
				{ value: "is", label: "is" },
				{ value: "before", label: "before" },
				{ value: "after", label: "after" },
			],
			customRenderer: dateTimeControl,
		},
		{
			key: "customSliderRange",
			label: "Slider Range",
			type: "custom",
			icon: iconSliders,
			class: "w-36",
			defaultOperator: "between",
			operators: [
				{ value: "between", label: "between" },
				{ value: "not_between", label: "not between" },
			],
			customRenderer: sliderRangeControl,
		},
	]);

	/* ---------------------------------------------------------------------------------------
	 * 7 and 8. The data grid, and the same grid behind a request
	 * ------------------------------------------------------------------------------------ */

	type Staff = {
		id: string;
		name: string;
		email: string;
		company: string;
		role: string;
		status: "active" | "inactive";
		availability: "online" | "away" | "busy" | "offline";
		location: string;
		balance: number;
	};

	const STAFF: Staff[] = [
		{
			id: "1",
			name: "Alex Johnson",
			email: "alex@apple.com",
			company: "Apple",
			role: "CEO",
			status: "active",
			availability: "online",
			location: "San Francisco, USA",
			balance: 5143.03,
		},
		{
			id: "2",
			name: "Sarah Chen",
			email: "sarah@openai.com",
			company: "OpenAI",
			role: "CTO",
			status: "inactive",
			availability: "away",
			location: "London, UK",
			balance: 4321.87,
		},
		{
			id: "3",
			name: "Michael Rodriguez",
			email: "michael@meta.com",
			company: "Meta",
			role: "Designer",
			status: "active",
			availability: "busy",
			location: "Toronto, Canada",
			balance: 7654.98,
		},
		{
			id: "4",
			name: "Emma Wilson",
			email: "emma@tesla.com",
			company: "Tesla",
			role: "Developer",
			status: "inactive",
			availability: "offline",
			location: "Sydney, Australia",
			balance: 3456.45,
		},
		{
			id: "5",
			name: "David Kim",
			email: "david@sap.com",
			company: "SAP",
			role: "Lawyer",
			status: "active",
			availability: "online",
			location: "Berlin, Germany",
			balance: 9876.54,
		},
		{
			id: "6",
			name: "Aron Thompson",
			email: "aron@northwind.com",
			company: "Northwind",
			role: "Director",
			status: "active",
			availability: "away",
			location: "Kuala Lumpur, MY",
			balance: 6214.22,
		},
		{
			id: "7",
			name: "James Brown",
			email: "james@bbva.es",
			company: "BBVA",
			role: "Product Manager",
			status: "inactive",
			availability: "busy",
			location: "Barcelona, Spain",
			balance: 5321.77,
		},
		{
			id: "8",
			name: "Maria Garcia",
			email: "maria@sony.jp",
			company: "Sony",
			role: "Marketing Lead",
			status: "active",
			availability: "offline",
			location: "Tokyo, Japan",
			balance: 8452.39,
		},
		{
			id: "9",
			name: "Nick Johnson",
			email: "nick@lvmh.fr",
			company: "LVMH",
			role: "Data Scientist",
			status: "active",
			availability: "online",
			location: "Paris, France",
			balance: 7345.1,
		},
		{
			id: "10",
			name: "Liam Thompson",
			email: "liam@eni.it",
			company: "ENI",
			role: "Engineer",
			status: "inactive",
			availability: "away",
			location: "Milan, Italy",
			balance: 5214.88,
		},
		{
			id: "11",
			name: "Alex Johnson",
			email: "alex@vale.br",
			company: "Vale",
			role: "Software Engineer",
			status: "active",
			availability: "busy",
			location: "Rio de Janeiro, Brazil",
			balance: 9421.5,
		},
		{
			id: "12",
			name: "Sarah Chen",
			email: "sarah@tata.in",
			company: "Tata",
			role: "Sales Manager",
			status: "active",
			availability: "offline",
			location: "Mumbai, India",
			balance: 4521.67,
		},
	];

	const COMPANIES = [...new Set(STAFF.map((row) => row.company))];
	const ROLES = [...new Set(STAFF.map((row) => row.role))];

	/**
	 * A filter with nothing in it narrows nothing.
	 *
	 * The empty-string case is the one that matters: a `text` filter is created holding `['']`, and
	 * without this every row would disappear the moment one was added and before anything was typed.
	 */
	function isActive(filter: Filter<unknown>): boolean {
		if (!filter.values || filter.values.length === 0) return false;
		if (filter.values.every((value) => typeof value === "string" && value.trim() === "")) {
			return false;
		}
		return !filter.values.every((value) => value === null || value === undefined);
	}

	/**
	 * The predicate behind one filter, by operator.
	 *
	 * Upstream's switch, with its coverage intact: `is_any_of`, `starts_with`, `empty` and the rest
	 * fall through to `true` and narrow nothing. That is visible on the page — switching a chip from
	 * `is` to `is any of` widens the table back to everything — and it is the demo's behaviour, not
	 * a defect in the component, which stores the operator faithfully either way.
	 */
	function matches(row: Staff, filter: Filter<unknown>): boolean {
		const value = row[filter.field as keyof Staff];
		const values = filter.values;
		const text = String(value).toLowerCase();

		switch (filter.operator) {
			case "is":
				return values.includes(value);
			case "is_not":
				return !values.includes(value);
			case "contains":
				return values.some((entry) => text.includes(String(entry).toLowerCase()));
			case "not_contains":
				return !values.some((entry) => text.includes(String(entry).toLowerCase()));
			case "equals":
				return value === values[0];
			case "not_equals":
				return value !== values[0];
			case "greater_than":
				return Number(value) > Number(values[0]);
			case "less_than":
				return Number(value) < Number(values[0]);
			case "between":
				return values.length < 2
					? true
					: Number(value) >= Number(values[0]) && Number(value) <= Number(values[1]);
			case "not_between":
				return values.length < 2
					? true
					: Number(value) < Number(values[0]) || Number(value) > Number(values[1]);
			default:
				return true;
		}
	}

	function applyFilters(rows: Staff[], active: Filter<unknown>[]): Staff[] {
		return active.reduce(
			(narrowed, filter) => narrowed.filter((row) => matches(row, filter)),
			rows,
		);
	}

	function staffFields(multipleStatus: boolean): FilterFieldConfig<unknown>[] {
		return [
			{
				key: "name",
				label: "Name",
				type: "text",
				icon: iconUser,
				class: "w-40",
				placeholder: "Search names...",
			},
			{
				key: "email",
				label: "Email",
				type: "text",
				icon: iconMail,
				class: "w-48",
				placeholder: "user@example.com",
			},
			{
				key: "company",
				label: "Company",
				type: "select",
				icon: iconBuilding,
				searchable: true,
				class: "w-[180px]",
				options: COMPANIES.map((company) => ({ value: company, label: company })),
			},
			{
				key: "role",
				label: "Role",
				type: "select",
				icon: iconUser,
				searchable: true,
				class: "w-[160px]",
				options: ROLES.map((role) => ({ value: role, label: role })),
			},
			{
				key: "status",
				label: "Status",
				type: multipleStatus ? "multiselect" : "select",
				icon: iconCircleCheck,
				searchable: false,
				class: "w-[140px]",
				options: [
					{ value: "active", label: "Active", icon: statusDot },
					{ value: "inactive", label: "Inactive", icon: statusDot },
					{ value: "archived", label: "Archived", icon: statusDot },
				],
			},
			{
				key: "availability",
				label: "Availability",
				type: "select",
				icon: iconCircleAlert,
				searchable: false,
				class: "w-[160px]",
				options: [
					{ value: "online", label: "Online", icon: availabilityDot },
					{ value: "away", label: "Away", icon: availabilityDot },
					{ value: "busy", label: "Busy", icon: availabilityDot },
					{ value: "offline", label: "Offline", icon: availabilityDot },
				],
			},
			{
				key: "location",
				label: "Location",
				type: "text",
				icon: iconMapPin,
				class: "w-40",
				placeholder: "Search locations...",
			},
		];
	}

	const staffColumns: DataTableColumnDef<Staff>[] = [
		{
			id: "name",
			accessorKey: "name",
			header: staffHeader,
			cell: staffCell,
			meta: { label: "Staff" },
		},
		{ id: "company", accessorKey: "company", header: staffHeader, meta: { label: "Company" } },
		{ id: "role", accessorKey: "role", header: staffHeader, meta: { label: "Occupation" } },
		{
			id: "status",
			accessorKey: "status",
			header: staffHeader,
			cell: statusCell,
			meta: { label: "Status" },
		},
		{
			id: "availability",
			accessorKey: "availability",
			header: staffHeader,
			cell: availabilityCell,
			meta: { label: "Availability" },
		},
		{ id: "location", accessorKey: "location", header: staffHeader, meta: { label: "Location" } },
		{
			id: "balance",
			accessorKey: "balance",
			header: staffHeader,
			cell: balanceCell,
			meta: { label: "Balance" },
		},
	];

	/* --- 7: the grid follows the filters directly ------------------------------------------- */

	let gridFilters = $state<Filter<unknown>[]>([createFilter("status", "is", ["active"])]);
	const gridFields: FilterFieldConfig<unknown>[] = $derived(staffFields(false));
	const gridRows = $derived(applyFilters(STAFF, gridFilters.filter(isActive)));

	const gridTable = createDataTable<Staff>({
		data: () => gridRows,
		columns: () => staffColumns,
		getRowId: (row) => row.id,
		initialState: { sorting: [{ id: "name", desc: false }], pagination: { pageSize: 5 } },
	});

	/* --- 8: the same grid, behind a debounced request ---------------------------------------- */

	let asyncFilters = $state<Filter<unknown>[]>([
		createFilter("status", "is", ["active"]),
		createFilter("availability", "is", ["online"]),
	]);
	const asyncFields: FilterFieldConfig<unknown>[] = $derived(staffFields(true));

	let asyncRows = $state.raw<Staff[]>(
		applyFilters(STAFF, [
			{ id: "seed-1", field: "status", operator: "is", values: ["active"] },
			{ id: "seed-2", field: "availability", operator: "is", values: ["online"] },
		]),
	);
	let asyncLoading = $state(false);

	/**
	 * The simulated round trip: settle for 300ms, then take between 800 and 2 000ms to answer.
	 *
	 * The effect depends on a STRING, not on the array. `asyncFilters` is replaced on every
	 * keystroke inside a text chip, and half of those changes — an operator dropdown opening, an
	 * empty filter being added — do not change what a server would be asked. Keying on the signature
	 * of the active filters is what stops the request firing for those.
	 */
	const asyncSignature = $derived(
		JSON.stringify(
			asyncFilters.filter(isActive).map((filter) => [filter.field, filter.operator, filter.values]),
		),
	);

	$effect(() => {
		const signature = asyncSignature;
		let cancelled = false;

		const debounce = setTimeout(() => {
			asyncLoading = true;
			const latency = 800 + Math.random() * 1200;
			const request = setTimeout(() => {
				if (cancelled) return;
				asyncRows = applyFilters(
					STAFF,
					JSON.parse(signature).map(([field, operator, values]: [string, string, unknown[]]) => ({
						id: "",
						field,
						operator,
						values,
					})),
				);
				asyncLoading = false;
			}, latency);
			cleanupRequest = () => clearTimeout(request);
		}, 300);

		let cleanupRequest = () => {};

		return () => {
			cancelled = true;
			clearTimeout(debounce);
			cleanupRequest();
		};
	});

	const asyncTable = createDataTable<Staff>({
		data: () => asyncRows,
		columns: () => staffColumns,
		getRowId: (row) => row.id,
		initialState: { sorting: [{ id: "name", desc: false }], pagination: { pageSize: 5 } },
	});

	/* ---------------------------------------------------------------------------------------
	 * 9. Internationalisation
	 * ------------------------------------------------------------------------------------ */

	const LANGUAGES = [
		{ value: "en", label: "English" },
		{ value: "es", label: "Español" },
		{ value: "fr", label: "Français" },
		{ value: "de", label: "Deutsch" },
		{ value: "ja", label: "日本語" },
	];

	/**
	 * The four translations, over the English defaults.
	 *
	 * `placeholders.searchField` is a function and not a template because German and Japanese put
	 * the field name first — `Namen suchen...`, `名前を検索...` — where English and the Romance
	 * languages put it last. A template string could not express both.
	 *
	 * Upstream supplies none of the five configs with `loadingOptions` or `errorLoadingOptions`, so
	 * its async strings stay English in every language. Both are translated here; the merge is
	 * per key, so the omission was never a decision, only an oversight.
	 */
	const I18N: Record<string, Partial<FilterI18nConfig>> = {
		en: {},
		es: {
			addFilter: "Agregar filtro",
			searchFields: "Buscar campos...",
			noFieldsFound: "No se encontraron campos.",
			noResultsFound: "No se encontraron resultados.",
			select: "Seleccionar...",
			selectedCount: "seleccionados",
			loadingOptions: "Cargando...",
			errorLoadingOptions: "No se pudieron cargar las opciones.",
			operators: {
				is: "es",
				isNot: "no es",
				isAnyOf: "es cualquiera de",
				isNotAnyOf: "no es cualquiera de",
				includesAll: "incluye todos",
				excludesAll: "excluye todos",
				before: "antes de",
				after: "después de",
				between: "entre",
				notBetween: "no entre",
				contains: "contiene",
				notContains: "no contiene",
				startsWith: "comienza con",
				endsWith: "termina con",
				isExactly: "es exactamente",
				equals: "igual a",
				notEquals: "no igual a",
				greaterThan: "mayor que",
				lessThan: "menor que",
				overlaps: "se superpone",
				includes: "incluye",
				excludes: "excluye",
				includesAllOf: "incluye todos de",
				includesAnyOf: "incluye cualquiera de",
				empty: "está vacío",
				notEmpty: "no está vacío",
			},
			placeholders: { searchField: (name: string) => `Buscar ${name.toLowerCase()}...` },
			validation: {
				invalidEmail: "Formato de email inválido",
				invalidUrl: "Formato de URL inválido",
				invalidTel: "Formato de teléfono inválido",
				invalid: "Formato de entrada inválido",
			},
		},
		fr: {
			addFilter: "Ajouter un filtre",
			searchFields: "Rechercher des champs...",
			noFieldsFound: "Aucun champ trouvé.",
			noResultsFound: "Aucun résultat trouvé.",
			select: "Sélectionner...",
			selectedCount: "sélectionnés",
			loadingOptions: "Chargement...",
			errorLoadingOptions: "Impossible de charger les options.",
			operators: {
				is: "est",
				isNot: "n'est pas",
				isAnyOf: "est l'un de",
				isNotAnyOf: "n'est pas l'un de",
				includesAll: "inclut tous",
				excludesAll: "exclut tous",
				before: "avant",
				after: "après",
				between: "entre",
				notBetween: "pas entre",
				contains: "contient",
				notContains: "ne contient pas",
				startsWith: "commence par",
				endsWith: "se termine par",
				isExactly: "est exactement",
				equals: "égal à",
				notEquals: "pas égal à",
				greaterThan: "supérieur à",
				lessThan: "inférieur à",
				overlaps: "se chevauche",
				includes: "inclut",
				excludes: "exclut",
				includesAllOf: "inclut tous de",
				includesAnyOf: "inclut l'un de",
				empty: "est vide",
				notEmpty: "n'est pas vide",
			},
			placeholders: { searchField: (name: string) => `Rechercher ${name.toLowerCase()}...` },
			validation: {
				invalidEmail: "Format d'email invalide",
				invalidUrl: "Format d'URL invalide",
				invalidTel: "Format de téléphone invalide",
				invalid: "Format de saisie invalide",
			},
		},
		de: {
			addFilter: "Filter hinzufügen",
			searchFields: "Felder suchen...",
			noFieldsFound: "Keine Felder gefunden.",
			noResultsFound: "Keine Ergebnisse gefunden.",
			select: "Auswählen...",
			selectedCount: "ausgewählt",
			loadingOptions: "Wird geladen...",
			errorLoadingOptions: "Optionen konnten nicht geladen werden.",
			operators: {
				is: "ist",
				isNot: "ist nicht",
				isAnyOf: "ist eines von",
				isNotAnyOf: "ist nicht eines von",
				includesAll: "enthält alle",
				excludesAll: "schließt alle aus",
				before: "vor",
				after: "nach",
				between: "zwischen",
				notBetween: "nicht zwischen",
				contains: "enthält",
				notContains: "enthält nicht",
				startsWith: "beginnt mit",
				endsWith: "endet mit",
				isExactly: "ist genau",
				equals: "gleich",
				notEquals: "nicht gleich",
				greaterThan: "größer als",
				lessThan: "kleiner als",
				overlaps: "überschneidet sich",
				includes: "enthält",
				excludes: "schließt aus",
				includesAllOf: "enthält alle von",
				includesAnyOf: "enthält eines von",
				empty: "ist leer",
				notEmpty: "ist nicht leer",
			},
			placeholders: { searchField: (name: string) => `${name.toLowerCase()} suchen...` },
			validation: {
				invalidEmail: "Ungültiges E-Mail-Format",
				invalidUrl: "Ungültiges URL-Format",
				invalidTel: "Ungültiges Telefonformat",
				invalid: "Ungültiges Format",
			},
		},
		ja: {
			addFilter: "フィルターを追加",
			searchFields: "フィールドを検索...",
			noFieldsFound: "フィールドが見つかりません。",
			noResultsFound: "結果が見つかりません。",
			select: "選択...",
			selectedCount: "選択済み",
			loadingOptions: "読み込み中...",
			errorLoadingOptions: "オプションを読み込めませんでした。",
			operators: {
				is: "は",
				isNot: "ではない",
				isAnyOf: "のいずれか",
				isNotAnyOf: "のいずれでもない",
				includesAll: "すべて含む",
				excludesAll: "すべて除外",
				before: "より前",
				after: "より後",
				between: "の間",
				notBetween: "の間ではない",
				contains: "含む",
				notContains: "含まない",
				startsWith: "で始まる",
				endsWith: "で終わる",
				isExactly: "正確に",
				equals: "等しい",
				notEquals: "等しくない",
				greaterThan: "より大きい",
				lessThan: "より小さい",
				overlaps: "重複する",
				includes: "含む",
				excludes: "除外",
				includesAllOf: "すべて含む",
				includesAnyOf: "いずれか含む",
				empty: "空",
				notEmpty: "空でない",
			},
			placeholders: { searchField: (name: string) => `${name.toLowerCase()}を検索...` },
			validation: {
				invalidEmail: "無効なメール形式",
				invalidUrl: "無効なURL形式",
				invalidTel: "無効な電話番号形式",
				invalid: "無効な形式",
			},
		},
	};

	/** Field and option labels are the consumer's job, not the component's — so here they are. */
	const FIELD_LABELS: Record<string, Record<string, string>> = {
		en: {
			name: "Name",
			email: "Email",
			company: "Company",
			role: "Role",
			status: "Status",
			location: "Location",
		},
		es: {
			name: "Nombre",
			email: "Correo electrónico",
			company: "Empresa",
			role: "Rol",
			status: "Estado",
			location: "Ubicación",
		},
		fr: {
			name: "Nom",
			email: "E-mail",
			company: "Entreprise",
			role: "Rôle",
			status: "Statut",
			location: "Localisation",
		},
		de: {
			name: "Name",
			email: "E-Mail",
			company: "Unternehmen",
			role: "Rolle",
			status: "Status",
			location: "Standort",
		},
		ja: {
			name: "名前",
			email: "メール",
			company: "会社",
			role: "役割",
			status: "ステータス",
			location: "場所",
		},
	};

	const NAME_PLACEHOLDER: Record<string, string> = {
		en: "Search names...",
		es: "Buscar nombres...",
		fr: "Rechercher des noms...",
		de: "Namen suchen...",
		ja: "名前を検索...",
	};

	const LOCATION_PLACEHOLDER: Record<string, string> = {
		en: "Search locations...",
		es: "Buscar ubicaciones...",
		fr: "Rechercher des lieux...",
		de: "Standorte suchen...",
		ja: "場所を検索...",
	};

	const STATUS_LABELS: Record<string, { active: string; inactive: string }> = {
		en: { active: "Active", inactive: "Inactive" },
		es: { active: "Activo", inactive: "Inactivo" },
		fr: { active: "Actif", inactive: "Inactif" },
		de: { active: "Aktiv", inactive: "Inaktiv" },
		ja: { active: "アクティブ", inactive: "非アクティブ" },
	};

	let language = $state("es");
	const currentLanguage = $derived(
		LANGUAGES.find((entry) => entry.value === language) ?? LANGUAGES[0],
	);

	let i18nFilters = $state<Filter<unknown>[]>([createFilter("status", "is", ["active"])]);

	const i18nFields: FilterFieldConfig<unknown>[] = $derived.by(() => {
		const labels = FIELD_LABELS[language] ?? FIELD_LABELS.en;
		const statuses = STATUS_LABELS[language] ?? STATUS_LABELS.en;

		return [
			{
				key: "name",
				label: labels.name,
				type: "text",
				icon: iconUser,
				class: "w-40",
				placeholder: NAME_PLACEHOLDER[language],
			},
			{
				key: "email",
				label: labels.email,
				type: "text",
				icon: iconMail,
				class: "w-48",
				placeholder: "user@example.com",
			},
			{
				key: "company",
				label: labels.company,
				type: "select",
				icon: iconBuilding,
				searchable: true,
				class: "w-[180px]",
				options: ["TechCorp", "StartupCo", "BigCorp", "InnovateTech", "GlobalNet"].map(
					(company) => ({ value: company, label: company }),
				),
			},
			{
				key: "role",
				label: labels.role,
				type: "select",
				icon: iconUser,
				searchable: true,
				class: "w-[160px]",
				options: ["Developer", "Designer", "Manager", "Product Manager", "Sales Rep"].map(
					(role) => ({ value: role, label: role }),
				),
			},
			{
				key: "status",
				label: labels.status,
				type: "select",
				icon: iconCircleCheck,
				searchable: false,
				class: "w-[140px]",
				options: [
					{ value: "active", label: statuses.active },
					{ value: "inactive", label: statuses.inactive },
				],
			},
			{
				key: "location",
				label: labels.location,
				type: "text",
				icon: iconMapPin,
				class: "w-40",
				placeholder: LOCATION_PLACEHOLDER[language],
			},
		];
	});

	/* ---------------------------------------------------------------------------------------
	 * 10. Virtualised large lists
	 * ------------------------------------------------------------------------------------ */

	const PRODUCTS: FilterOption<string>[] = Array.from({ length: 5000 }, (_, index) => ({
		value: `sku-${index + 1}`,
		label: `Product ${String(index + 1).padStart(4, "0")}`,
	}));

	let virtualFilters = $state<Filter<string>[]>([
		createFilter("product", "is_any_of", ["sku-42", "sku-1024"]),
	]);

	const virtualFields: FilterFieldConfig<string>[] = $derived([
		{
			key: "product",
			label: "Product",
			type: "multiselect",
			icon: iconPackage,
			options: PRODUCTS,
			renderOptionList: virtualisedList,
		},
	]);

	/* ---------------------------------------------------------------------------------------
	 * 11. Prefetched async options
	 * ------------------------------------------------------------------------------------ */

	const TEAMS: FilterOption<string>[] = [
		{ value: "eng", label: "Engineering" },
		{ value: "design", label: "Design" },
		{ value: "product", label: "Product" },
		{ value: "marketing", label: "Marketing" },
		{ value: "sales", label: "Sales" },
		{ value: "support", label: "Customer Support" },
		{ value: "finance", label: "Finance" },
		{ value: "people", label: "People Ops" },
		{ value: "legal", label: "Legal" },
		{ value: "it", label: "IT" },
		{ value: "data", label: "Data & Analytics" },
		{ value: "security", label: "Security" },
	];

	// Deliberately NOT `$state`: it is a cache, nothing renders it, and making it reactive would
	// invalidate the loader that wrote it.
	let teamCache: FilterOption<string>[] | null = null;

	let prefetchFilters = $state<Filter<string>[]>([]);

	const prefetchFields: FilterFieldConfig<string>[] = $derived([
		{
			key: "team",
			label: "Team",
			type: "multiselect",
			icon: iconUsers,
			// The whole list once, then filtered from the cache — so only the first open waits.
			loadOptions: async (query: string) => {
				if (!teamCache) {
					await new Promise((resolve) => setTimeout(resolve, 600));
					teamCache = TEAMS;
				}
				const needle = query.trim().toLowerCase();
				return needle
					? teamCache.filter((team) => team.label.toLowerCase().includes(needle))
					: teamCache;
			},
		},
	]);

	/* ---------------------------------------------------------------------------------------
	 * 12. Async server-side search
	 * ------------------------------------------------------------------------------------ */

	const FIRST_NAMES = [
		"Alex",
		"Bailey",
		"Casey",
		"Dana",
		"Emerson",
		"Finley",
		"Gray",
		"Harper",
		"Indira",
		"Jordan",
		"Kai",
		"Logan",
		"Morgan",
		"Noor",
		"Parker",
		"Quinn",
		"Riley",
		"Sasha",
		"Taylor",
		"Umi",
		"Val",
		"Wren",
		"Xan",
		"Yuki",
		"Zephyr",
	];
	const LAST_NAMES = [
		"Ahmed",
		"Brooks",
		"Chen",
		"Diaz",
		"Evans",
		"Ferreira",
		"Gupta",
		"Hansen",
		"Ito",
		"Johnson",
		"Kowalski",
		"Lopez",
		"Mensah",
		"Novak",
		"Okafor",
		"Park",
	];

	/** Ten thousand people: too many to prefetch, which is the example's premise. */
	const DIRECTORY: FilterOption<string>[] = Array.from({ length: 10000 }, (_, index) => ({
		value: `user-${index + 1}`,
		label: `${FIRST_NAMES[index % FIRST_NAMES.length]} ${
			LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]
		} #${index + 1}`,
	}));

	let searchFilters = $state<Filter<string>[]>([createFilter("assignee", "is_any_of", ["user-1"])]);

	const searchFields: FilterFieldConfig<string>[] = $derived([
		{
			key: "assignee",
			label: "Assignee",
			type: "multiselect",
			icon: iconUserSearch,
			// Only the pre-selected entry is seeded, so its chip is labelled before anything loads.
			options: [DIRECTORY[0]],
			loadOptions: async (query: string) => {
				await new Promise((resolve) => setTimeout(resolve, 400));
				const needle = query.trim().toLowerCase();
				const found = needle
					? DIRECTORY.filter((option) => option.label.toLowerCase().includes(needle))
					: DIRECTORY;
				return found.slice(0, 50);
			},
		},
	]);
</script>

<!-- ================================================================================
	 Field icons. One per glyph, shared across the twelve examples.
	 ================================================================================ -->
{#snippet iconAtSign()}<AtSignIcon class="size-3.5" />{/snippet}
{#snippet iconBan()}<BanIcon class="size-3.5" />{/snippet}
{#snippet iconBell()}<BellIcon class="size-3.5" />{/snippet}
{#snippet iconBuilding()}<BuildingIcon class="size-3.5" />{/snippet}
{#snippet iconCalendar()}<CalendarIcon class="size-3.5" />{/snippet}
{#snippet iconCircleAlert()}<CircleAlertIcon class="size-3.5" />{/snippet}
{#snippet iconCircleCheck()}<CircleCheckIcon class="size-3.5" />{/snippet}
{#snippet iconClock()}<ClockIcon class="size-3.5" />{/snippet}
{#snippet iconCreditCard()}<CreditCardIcon class="size-3.5" />{/snippet}
{#snippet iconGlobe()}<GlobeIcon class="size-3.5" />{/snippet}
{#snippet iconLink()}<LinkIcon class="size-3.5" />{/snippet}
{#snippet iconMail()}<MailIcon class="size-3.5" />{/snippet}
{#snippet iconMapPin()}<MapPinIcon class="size-3.5" />{/snippet}
{#snippet iconPackage()}<PackageIcon class="size-3.5" />{/snippet}
{#snippet iconPhone()}<PhoneIcon class="size-3.5" />{/snippet}
{#snippet iconSliders()}<SlidersVerticalIcon class="size-3.5" />{/snippet}
{#snippet iconTag()}<TagIcon class="size-3.5" />{/snippet}
{#snippet iconUser()}<UserIcon class="size-3.5" />{/snippet}
{#snippet iconUserCheck()}<UserRoundCheckIcon class="size-3.5" />{/snippet}
{#snippet iconUserSearch()}<UserSearchIcon class="size-3.5" />{/snippet}
{#snippet iconUsers()}<UsersIcon class="size-3.5" />{/snippet}

<!-- ================================================================================
	 Option icons. Each takes the option, so ONE snippet serves a whole list — the
	 difference this theme makes to `FilterOption.icon`, and the reason a sixteen-person
	 assignee list is sixteen lines of data rather than sixteen avatars written out.
	 ================================================================================ -->
{#snippet statusOptionIcon(option: FilterOption<string>)}
	{#if option.value === "todo"}
		<ClockIcon class="text-primary" />
	{:else if option.value === "in-progress"}
		<CircleAlertIcon class="text-warning" />
	{:else if option.value === "done"}
		<CircleCheckIcon class="text-success" />
	{:else}
		<BanIcon class="text-destructive" />
	{/if}
{/snippet}

{#snippet priorityDot(option: FilterOption<string>)}
	<div class={cn("size-2.5 shrink-0 rounded-full", PRIORITY_TONE[option.value])}></div>
{/snippet}

{#snippet priorityStar(option: FilterOption<string>)}
	<StarIcon class={PRIORITY_TEXT_TONE[option.value]} />
{/snippet}

{#snippet personAvatar(option: FilterOption<string>)}
	<Avatar.Root class="size-5 border">
		<Avatar.Fallback class="text-[0.5rem]">{initials(option.label)}</Avatar.Fallback>
	</Avatar.Root>
{/snippet}

{#snippet unassignedAvatar()}
	<Avatar.Root class="size-5 border">
		<Avatar.Fallback><UserRoundXIcon class="size-3" /></Avatar.Fallback>
	</Avatar.Root>
{/snippet}

{#snippet userTypeIcon(option: FilterOption<string>)}
	{#if option.value === "premium"}
		<StarIcon class="size-3 text-warning" />
	{:else if option.value === "standard"}
		<BuildingIcon class="size-3 text-primary" />
	{:else}
		<ClockIcon class="size-3 text-muted-foreground" />
	{/if}
{/snippet}

{#snippet statusDot(option: FilterOption<unknown>)}
	<div
		class={cn(
			"size-2 shrink-0 rounded-full",
			option.value === "active"
				? "bg-success"
				: option.value === "inactive"
					? "bg-destructive"
					: "bg-muted-foreground",
		)}
	></div>
{/snippet}

{#snippet availabilityDot(option: FilterOption<unknown>)}
	<div
		class={cn(
			"size-2 shrink-0 rounded-full",
			option.value === "online"
				? "bg-success"
				: option.value === "away"
					? "bg-warning"
					: option.value === "busy"
						? "bg-destructive"
						: "bg-muted-foreground",
		)}
	></div>
{/snippet}

<!-- ================================================================================
	 The five custom controls of example 6, and the windowed list of example 10.
	 ================================================================================ -->
{#snippet modalDateControl({ values, onChange, autofocus }: CustomRendererProps<unknown>)}
	<FiltersDateDialogInput {values} {onChange} {autofocus} />
{/snippet}

{#snippet dateRangeControl({ values, onChange, autofocus }: CustomRendererProps<unknown>)}
	<FiltersDateRangeInput {values} {onChange} {autofocus} placeholder="Pick a date range" />
{/snippet}

{#snippet dateRangePresetsControl({ values, onChange, autofocus }: CustomRendererProps<unknown>)}
	<FiltersDateRangeInput
		{values}
		{onChange}
		{autofocus}
		presets
		placeholder="Pick a date range with presets"
	/>
{/snippet}

{#snippet dateTimeControl({ values, onChange, autofocus }: CustomRendererProps<unknown>)}
	<FiltersDateTimeInput {values} {onChange} {autofocus} />
{/snippet}

{#snippet sliderRangeControl({ values, onChange, autofocus }: CustomRendererProps<unknown>)}
	<FiltersSliderRangeInput {values} {onChange} {autofocus} />
{/snippet}

{#snippet virtualisedList({
	options,
	highlightedIndex,
	renderOption,
}: FilterOptionListRenderProps<string>)}
	<FiltersVirtualizedOptions {options} {highlightedIndex} {renderOption} />
{/snippet}

<!-- ================================================================================
	 The data grid's headers and cells, shared by examples 7 and 8.
	 ================================================================================ -->
{#snippet staffHeader(ctx: HeaderContext<Staff, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label={ctx.column.columnDef.meta?.label ?? ""} />
{/snippet}

{#snippet staffCell(ctx: CellContext<Staff, unknown>)}
	<div class="flex items-center gap-3">
		<Avatar.Root class="size-8">
			<Avatar.Fallback>{initials(ctx.row.original.name)}</Avatar.Fallback>
		</Avatar.Root>
		<div class="flex flex-col gap-px">
			<div class="font-medium text-foreground">{ctx.row.original.name}</div>
			<div class="truncate text-xs text-muted-foreground">{ctx.row.original.email}</div>
		</div>
	</div>
{/snippet}

{#snippet statusCell(ctx: CellContext<Staff, unknown>)}
	{#if ctx.row.original.status === "active"}
		<Badge variant="success-subtle">Active</Badge>
	{:else}
		<Badge variant="destructive-subtle">Inactive</Badge>
	{/if}
{/snippet}

{#snippet availabilityCell(ctx: CellContext<Staff, unknown>)}
	{@const availability = ctx.row.original.availability}
	<span class="flex items-center gap-2 capitalize">
		<span
			class={cn(
				"size-2 shrink-0 rounded-full",
				availability === "online"
					? "bg-success"
					: availability === "away"
						? "bg-warning"
						: availability === "busy"
							? "bg-destructive"
							: "bg-muted-foreground",
			)}
		></span>
		{availability}
	</span>
{/snippet}

{#snippet balanceCell(ctx: CellContext<Staff, unknown>)}
	<span class="font-medium">${ctx.row.original.balance.toLocaleString("en-US")}</span>
{/snippet}

<DocPage title="Filters">
	{#snippet subtitle()}
		Twelve filter patterns on a component built for this theme. A filter is a chip — field,
		operator, value — and the row of them is state the page owns.
	{/snippet}

	<DocSection title="Field types">
		{#snippet blurb()}
			Text, single select, multi select and a searchable list of 171 countries, in two groups.
			<kbd class="rounded border px-1 text-xs">F</kbd> opens the menu; the JSON below is the state the
			page holds.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="flex w-full flex-col gap-5">
					<div class="flex items-start gap-2.5">
						<div class="flex-1">
							<Filters
								bind:filters={typesFilters}
								fields={typesFields}
								enableShortcut
								shortcutKey="f"
								shortcutLabel="F"
								trigger={addFilterTrigger}
							/>
						</div>
						{#if typesFilters.length > 0}
							<Button variant="outline" onclick={() => (typesFilters = [])}>
								<FunnelXIcon data-icon="inline-start" />
								Clear
							</Button>
						{/if}
					</div>
					<pre
						class="max-h-[400px] w-full max-w-[500px] overflow-auto rounded-md border bg-muted p-3 text-xs dark:bg-muted/60">{JSON.stringify(
							$state.snapshot(typesFilters),
							null,
							2,
						)}</pre>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Validation">
		{#snippet blurb()}
			A field validates on blur and clears on the next keystroke. Five of these six are Zod schemas;
			the last is a plain function, which is all the field asks for.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Filters bind:filters={validationFilters} fields={validationFields} trigger={iconTrigger} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Trigger button">
		{#snippet blurb()}
			The Add filter button is a snippet: it receives the menu trigger's props and renders whatever
			you hand it.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="flex w-full items-start gap-2.5">
					<div class="flex-1">
						<Filters bind:filters={triggerFilters} fields={triggerFields} trigger={iconTrigger} />
					</div>
					{#if triggerFilters.length > 0}
						<Button variant="outline" onclick={() => (triggerFilters = [])}>
							<FunnelXIcon data-icon="inline-start" />
							Clear
						</Button>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small size">
		{#snippet blurb()}
			<code>size="sm"</code> takes every control in the row down a step — the chip's segments, its input
			and its remove button.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Filters bind:filters={smallFilters} fields={sizeFields} size="sm" trigger={smallTrigger} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Large size">
		{#snippet blurb()}
			And <code>size="lg"</code> takes them up one, against the same field set.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Filters bind:filters={largeFilters} fields={sizeFields} size="lg" trigger={largeTrigger} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom controls">
		{#snippet blurb()}
			A field of type <code>custom</code> replaces the whole value control with a snippet. Five of them
			here: a modal date picker, two range calendars, a date and time picker, and a slider.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="flex w-full items-start gap-2.5">
					<div class="flex-1">
						<Filters bind:filters={customFilters} fields={customFields} trigger={iconTrigger} />
					</div>
					{#if customFilters.length > 0}
						<Button variant="outline" onclick={() => (customFilters = [])}>
							<FunnelXIcon data-icon="inline-start" />
							Clear
						</Button>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Data grid">
		{#snippet blurb()}
			The filters narrow the table directly: every chip is one predicate, and they are combined with
			AND. Operators the example does not implement — <code>is any of</code>,
			<code>starts with</code>
			— narrow nothing, which is visible the moment you switch one.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<!--
					`grid-cols-[minmax(0,1fr)]` around the table, and it is load-bearing.
					A seven-column table has a min-content width of about 1 040px, and a block box hands
					that figure straight up its ancestors — through the card, the section and the reading
					column — until it reaches `main`, which is a flex item and sizes to it. The result is a
					page 116px wider than the window, sidebar and all, with a horizontal scrollbar under
					everything. `min-w-0` does not help: it constrains the box, not the figure it reports.
					A grid track of `minmax(0, 1fr)` does, because a track that may be zero reports zero —
					and the table then uses the horizontal scroll it already has.
				-->
				<div class="flex w-full min-w-0 flex-col gap-4">
					<Filters
						bind:filters={gridFilters}
						fields={gridFields}
						size="sm"
						trigger={smallTrigger}
					/>
					<div class="grid grid-cols-[minmax(0,1fr)]">
						<DataTable.Root table={gridTable.table} />
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Data grid with async mode">
		{#snippet blurb()}
			The same grid behind a simulated request: the filters settle for 300ms, then the answer takes
			between 800ms and two seconds. <code>Status</code> is a multi select here.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="flex w-full min-w-0 flex-col gap-4">
					<Filters
						bind:filters={asyncFilters}
						fields={asyncFields}
						size="sm"
						trigger={smallTrigger}
					/>
					<div class="grid grid-cols-[minmax(0,1fr)]">
						{#if asyncLoading}
							<DataTable.Skeleton columnCount={7} rowCount={5} withViewOptions={false} />
						{:else}
							<DataTable.Root table={asyncTable.table} />
						{/if}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Internationalisation">
		{#snippet blurb()}
			Every string the component renders comes from <code>i18n</code>, merged over the English
			defaults one level deep. Switching language re-labels the chips already on screen — field and
			option labels are the page's own job.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<div class="flex w-full items-start justify-between gap-4">
					<Filters
						bind:filters={i18nFilters}
						fields={i18nFields}
						size="sm"
						i18n={I18N[language]}
						trigger={smallTrigger}
					/>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline" size="sm">
									{currentLanguage.label}
									<ChevronDownIcon data-icon="inline-end" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							{#each LANGUAGES as option (option.value)}
								<DropdownMenu.Item onSelect={() => (language = option.value)}>
									<span>{option.label}</span>
									<CheckIcon
										class={cn(
											"ms-auto text-primary",
											language === option.value ? "opacity-100" : "opacity-0",
										)}
									/>
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Virtualised large lists">
		{#snippet blurb()}
			Five thousand options, through the field's <code>renderOptionList</code> snippet. The component
			ships no windowing dependency — bring your own, and stay bound to its selection and keyboard behaviour.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Filters bind:filters={virtualFilters} fields={virtualFields} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Prefetched async options">
		{#snippet blurb()}
			<code>loadOptions</code> instead of a static list. This one fetches the whole list once and filters
			the cached copy afterwards, so only the first open waits.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Filters bind:filters={prefetchFilters} fields={prefetchFields} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Async server-side search">
		{#snippet blurb()}
			Ten thousand entries, fifty at a time. The query is debounced, out-of-order answers are
			dropped, and a selected value keeps its label even when the current page no longer contains
			it.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-start">
				<Filters bind:filters={searchFilters} fields={searchFields} />
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>

<!-- The four Add filter triggers the examples use. -->
{#snippet addFilterTrigger({ props }: { props: Record<string, unknown> })}
	<Button {...props} variant="outline">
		<ListFilterIcon data-icon="inline-start" />
		Add Filter
	</Button>
{/snippet}

{#snippet iconTrigger({ props }: { props: Record<string, unknown> })}
	<Button {...props} variant="outline" size="icon" aria-label="Add filter">
		<ListFilterIcon />
	</Button>
{/snippet}

{#snippet smallTrigger({ props }: { props: Record<string, unknown> })}
	<Button {...props} variant="outline" size="icon-sm" aria-label="Add filter">
		<ListFilterIcon />
	</Button>
{/snippet}

{#snippet largeTrigger({ props }: { props: Record<string, unknown> })}
	<Button {...props} variant="outline" size="icon-lg" aria-label="Add filter">
		<ListFilterIcon />
	</Button>
{/snippet}
