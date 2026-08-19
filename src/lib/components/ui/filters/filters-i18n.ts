import type { FilterI18nConfig, FilterOperator } from "./types.js";

/**
 * The English defaults, and the operator tables derived from them.
 *
 * Every operator label in the component comes through here rather than from a constant, which is
 * the one thing that makes the i18n example on the page work: translating `operators.isAnyOf`
 * has to change the label on an existing chip, not only the label of a chip added afterwards.
 */

/** What a `Filters` renders with no `i18n` prop, and the base every partial merges over. */
export const DEFAULT_I18N: FilterI18nConfig = {
	addFilter: "Filter",
	searchFields: "Filter..",
	noFieldsFound: "No filters found.",
	noResultsFound: "No results found.",
	select: "Select..",
	selectedCount: "selected",
	loadingOptions: "Loading..",
	errorLoadingOptions: "Failed to load options.",

	operators: {
		is: "is",
		isNot: "is not",
		isAnyOf: "is any of",
		isNotAnyOf: "is not any of",
		includesAll: "includes all",
		excludesAll: "excludes all",
		before: "before",
		after: "after",
		between: "between",
		notBetween: "not between",
		contains: "contains",
		notContains: "does not contain",
		startsWith: "starts with",
		endsWith: "ends with",
		isExactly: "is exactly",
		equals: "equals",
		notEquals: "not equals",
		greaterThan: "greater than",
		lessThan: "less than",
		overlaps: "overlaps",
		includes: "includes",
		excludes: "excludes",
		includesAllOf: "includes all of",
		includesAnyOf: "includes any of",
		empty: "is empty",
		notEmpty: "is not empty",
	},

	placeholders: {
		searchField: (fieldName: string) => `Search ${fieldName.toLowerCase()}...`,
	},

	helpers: {
		formatOperator: (operator: string) => operator.replace(/_/g, " "),
	},

	validation: {
		invalidEmail: "Invalid email format",
		invalidUrl: "Invalid URL format",
		invalidTel: "Invalid phone format",
		invalid: "Invalid input format",
	},
};

/**
 * The operator table for each field type, in the order the dropdown lists them.
 *
 * Eleven of the twenty-six labels in {@link FilterI18nConfig.operators} are unreachable from
 * here — `before`, `notBetween`, `equals`, `notEquals`, `greaterThan`, `lessThan`, `overlaps`,
 * `includes`, `excludes`, `includesAllOf`, `includesAnyOf`. They are reachable the other way
 * round: a field that declares its own `operators` may use any of them, and
 * `helpers.formatOperator` covers an operator with no label at all. So unlike the fifteen i18n
 * keys `types.ts` drops, these stay — they are addressable, just not by default.
 */
export function createOperatorsFromI18n(i18n: FilterI18nConfig): Record<string, FilterOperator[]> {
	return {
		select: [
			{ value: "is", label: i18n.operators.is },
			{ value: "is_not", label: i18n.operators.isNot },
			{ value: "empty", label: i18n.operators.empty },
			{ value: "not_empty", label: i18n.operators.notEmpty },
		],
		multiselect: [
			{ value: "is_any_of", label: i18n.operators.isAnyOf },
			{ value: "is_not_any_of", label: i18n.operators.isNotAnyOf },
			{ value: "includes_all", label: i18n.operators.includesAll },
			{ value: "excludes_all", label: i18n.operators.excludesAll },
			{ value: "empty", label: i18n.operators.empty },
			{ value: "not_empty", label: i18n.operators.notEmpty },
		],
		text: [
			{ value: "contains", label: i18n.operators.contains },
			{ value: "not_contains", label: i18n.operators.notContains },
			{ value: "starts_with", label: i18n.operators.startsWith },
			{ value: "ends_with", label: i18n.operators.endsWith },
			{ value: "is", label: i18n.operators.isExactly },
			{ value: "empty", label: i18n.operators.empty },
			{ value: "not_empty", label: i18n.operators.notEmpty },
		],
		custom: [
			{ value: "is", label: i18n.operators.is },
			{ value: "after", label: i18n.operators.after },
			{ value: "between", label: i18n.operators.between },
			{ value: "empty", label: i18n.operators.empty },
			{ value: "not_empty", label: i18n.operators.notEmpty },
		],
	};
}

/** The same tables under {@link DEFAULT_I18N}, for a consumer building its own operator list. */
export const DEFAULT_OPERATORS: Record<string, FilterOperator[]> =
	createOperatorsFromI18n(DEFAULT_I18N);

/**
 * A partial `i18n` over the defaults, one level deep.
 *
 * The nested spreads are the whole point: a shallow merge would let `i18n={{ operators: { is:
 * 'ist' } }}` replace all twenty-six operator labels with one, and the twenty-five chips that
 * lost their label would fall back to `formatOperator` — `is_any_of` rendered as "is any of"
 * again, in English, on a German page. That is a bug you only see on the fifth chip.
 */
export function mergeI18n(i18n?: Partial<FilterI18nConfig>): FilterI18nConfig {
	if (!i18n) return DEFAULT_I18N;

	return {
		...DEFAULT_I18N,
		...i18n,
		operators: { ...DEFAULT_I18N.operators, ...i18n.operators },
		placeholders: { ...DEFAULT_I18N.placeholders, ...i18n.placeholders },
		helpers: { ...DEFAULT_I18N.helpers, ...i18n.helpers },
		validation: { ...DEFAULT_I18N.validation, ...i18n.validation },
	};
}
