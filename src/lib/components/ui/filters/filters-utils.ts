import { createOperatorsFromI18n } from "./filters-i18n.js";
import type {
	Filter,
	FilterFieldConfig,
	FilterFieldGroup,
	FilterFieldsConfig,
	FilterGroup,
	FilterI18nConfig,
	FilterOperator,
} from "./types.js";

/**
 * The pure half of the component: flattening the field config, resolving a field's operators,
 * and the two factories the public API exports.
 *
 * All of it is a direct translation — no runes, no DOM, nothing that needed rethinking for
 * Svelte. It lives apart from the components so the page can call `createFilter` without
 * pulling a `.svelte` module into a `<script>` that only wants a value.
 */

/** The `{ fields: [...] }` half of {@link FilterFieldsConfig}. */
function isFieldGroup<T = unknown>(
	item: FilterFieldConfig<T> | FilterFieldGroup<T>,
): item is FilterFieldGroup<T> {
	return "fields" in item && Array.isArray(item.fields);
}

/** The other spelling of a group, and the one every demo uses: `{ group, fields }`. */
function isGroupLevelField<T = unknown>(field: FilterFieldConfig<T>): boolean {
	return Boolean(field.group && field.fields);
}

/** Every field, groups opened out, in declaration order. */
export function flattenFields<T = unknown>(fields: FilterFieldsConfig<T>): FilterFieldConfig<T>[] {
	return fields.reduce<FilterFieldConfig<T>[]>((acc, item) => {
		if (isFieldGroup(item)) return [...acc, ...item.fields];
		if (isGroupLevelField(item)) return [...acc, ...item.fields!];
		return [...acc, item];
	}, []);
}

/** `key` → field, for resolving a {@link Filter.field} back to its config. Group headers drop out. */
export function getFieldsMap<T = unknown>(
	fields: FilterFieldsConfig<T>,
): Record<string, FilterFieldConfig<T>> {
	const flat = flattenFields(fields);
	return flat.reduce<Record<string, FilterFieldConfig<T>>>((acc, field) => {
		if (field.key) acc[field.key] = field;
		return acc;
	}, {});
}

/**
 * Whether two option values are the same value — the one comparison every selection check runs
 * through.
 *
 * Identity (`Object.is`) by default, which is right for the strings and numbers options usually
 * carry and wrong for objects: a value read back out of the consumer's `$state` filters array is
 * a proxy that is never `===` its source option. A field with object values declares
 * {@link FilterFieldConfig.getOptionKey}, and the comparison goes through the key instead.
 */
export function isSameValue<T = unknown>(field: FilterFieldConfig<T>, a: T, b: T): boolean {
	return field.getOptionKey ? field.getOptionKey(a) === field.getOptionKey(b) : Object.is(a, b);
}

/**
 * Whether a field has any option source at all — the gate on showing it as a submenu.
 *
 * The `typeof` test is load-bearing and upstream says so at the same spot: `field.options?.length
 * || field.loadOptions?.length` reads a *function's* arity, which is `1` for every loader written
 * `(query) => …` and `0` for one written `() => …`. The second kind would silently lose its
 * submenu.
 */
export function fieldHasOptions<T = unknown>(field: FilterFieldConfig<T>): boolean {
	return (field.options?.length ?? 0) > 0 || typeof field.loadOptions === "function";
}

/**
 * The operators offered for a field, in dropdown order.
 *
 * The middle rule is the interesting one: a `select` field that has ended up with more than one
 * value is offered the multiselect operators. That is what makes "is" → "is any of" available on
 * a chip the Add filter submenu created as single-select, without the field having to declare
 * itself twice.
 */
export function getOperatorsForField<T = unknown>(
	field: FilterFieldConfig<T>,
	values: T[],
	i18n: FilterI18nConfig,
): FilterOperator[] {
	if (field.operators) return field.operators;

	const operators = createOperatorsFromI18n(i18n);

	let fieldType = field.type || "select";
	if (fieldType === "select" && values.length > 1) fieldType = "multiselect";
	if (fieldType === "multiselect") return operators.multiselect;

	return operators[fieldType] || operators.select;
}

/**
 * A new filter, with an id unique enough for a list that lives in one tab.
 *
 * `Date.now()` plus nine random base-36 characters is upstream's own recipe, kept rather than
 * swapped for `crypto.randomUUID()`: the id is a list key, never a persisted or transmitted
 * identifier, and the timestamp prefix makes a filters array readable when it is dumped as JSON
 * — which the first example on the page does, deliberately.
 */
export function createFilter<T = unknown>(
	field: string,
	operator?: string,
	values: T[] = [],
): Filter<T> {
	return {
		id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
		field,
		operator: operator || "is",
		values,
	};
}

/** A named set of filters over a subset of fields. Part of the public API; nothing here reads it. */
export function createFilterGroup<T = unknown>(
	id: string,
	label: string,
	fields: FilterFieldConfig<T>[],
	initialFilters: Filter<T>[] = [],
): FilterGroup<T> {
	return { id, label, filters: initialFilters, fields };
}
