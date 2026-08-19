import type { Snippet } from "svelte";

/**
 * The whole type surface of the Filters component.
 *
 * FOUR TRANSLATIONS RUN THROUGH EVERY TYPE BELOW, and none of them is cosmetic.
 *
 * 1. `React.ReactNode` becomes a {@link Snippet}. Upstream's `icon` is arbitrary markup — a
 *    lucide glyph on one field, an avatar on the next, a coloured dot on the one after — so
 *    `Component<{ class?: string }>`, which is what `data-table/types.ts` uses for its own
 *    icons, would cover the first of those three and reject the other two. A snippet covers all
 *    three, and a snippet is what Svelte has where React has a node.
 *
 *    The consequence is worth stating once, because it shapes every page that configures this
 *    component: snippets are declared in markup, so a `fields` array that carries them must be
 *    built where they are in scope. `const fields = $derived([...])` in the `<script>`, with the
 *    snippets declared at the top level of the same component's markup, is the shape that works
 *    — `$derived` reads lazily, and its first read happens during render, by which point every
 *    snippet is defined. A plain `const fields = [...]` would run before them.
 *
 * 2. Render props become snippets too, one level up. `customRenderer(props) => ReactNode` is
 *    `customRenderer: Snippet<[CustomRendererProps<T>]>`, and {@link FilterOptionListRenderProps}'s
 *    own `renderOption` callback — a function returning a node — becomes a nested snippet the
 *    consumer renders with `{@render renderOption(option, index)}`.
 *
 * 3. `className` becomes `class`. A reserved word is still a legal property name, and every
 *    other class-bearing surface in this repository spells it that way.
 *
 * 4. `T` survives. Svelte 5's `generics` attribute types a component the way React types a
 *    function, so a `Filters<T>` keeps the consumer's own value type end to end rather than
 *    widening everything to `unknown` at the component boundary.
 *
 * WHAT IS NOT PORTED, and why — all of it is config upstream declares and never reads:
 *
 * | Dropped                                            | Why |
 * |---|---|
 * | `radius`                                           | threaded from props through the context and read by nothing |
 * | `collapseAddButton`                                | declared on the props interface, never destructured |
 * | field `min` / `max` / `step` / `allowCustomValues` | leftovers from field types this component never grew |
 * | field `onLabel` / `offLabel`                       | likewise — there is no boolean field type |
 * | field `groupLabel` / `menuPopupClassName`          | superseded by `group` and the root's `menuPopupClass` |
 * | field `onInputChange`                              | a React `ChangeEvent` handler the input never calls |
 * | 15 of the 42 `i18n` keys                           | see {@link FilterI18nConfig} |
 *
 * `metadata` on {@link FilterOption} stays although this component never reads it either: it is
 * the consumer's own payload on an option, which is exactly what an unread field should be.
 */

/** The three control ladders. Matches the `Button` sizes the chips are built from. */
export type FilterSize = "sm" | "default" | "lg";

/**
 * How the chips space themselves.
 *
 * Upstream also lets `solid` set `gap-2`, in the same `cva` call where `size` sets `gap-1.5` /
 * `gap-2.5` / `gap-3.5`. Both land on the container, `size` is declared second, and the result
 * goes through `cn()` — so `size` always wins and `solid`'s gap has never once been applied.
 * The variant is kept because it is public API; its gap is not reproduced, because reproducing
 * a value that upstream's own class merge discards would be reproducing the merge, not the design.
 */
export type FilterVariant = "solid" | "default";

/** One selectable value in a `select` or `multiselect` field. */
export interface FilterOption<T = unknown> {
	/**
	 * What lands in {@link Filter.values}. Also the key of the value→option cache, through
	 * {@link FilterFieldConfig.getOptionKey} when the field declares one.
	 */
	value: T;
	/** Rendered text, and what the chip's trigger shows once selected. */
	label: string;
	/**
	 * Rendered before the label, in the list and in the chip's trigger.
	 *
	 * IT RECEIVES THE OPTION, which upstream's does not — there, `icon` is a node built per option,
	 * so a list of sixteen people needs sixteen avatars written out. A snippet handed the option is
	 * one snippet for the whole list, and it is the only shape in which a `fields` array declared in
	 * a `<script>` can carry per-row markup without a component per row.
	 */
	icon?: Snippet<[FilterOption<T>]>;
	/** Never read here — the consumer's own payload on an option. */
	metadata?: Record<string, unknown>;
	/** Extra classes for this one row. */
	class?: string;
}

/** One entry of the operator dropdown between a chip's field and its value. */
export interface FilterOperator {
	/** What lands in {@link Filter.operator} — `is`, `is_any_of`, `contains`, … */
	value: string;
	/** Rendered text, already localised. */
	label: string;
	/** Declared upstream, read by nothing; multiplicity follows the field's `type`. */
	supportsMultiple?: boolean;
}

/**
 * What a field's `customRenderer` snippet receives — the value half of a chip, in full.
 *
 * `autofocus` is not upstream's. There, a control that wants to open itself on the chip that was
 * just added has to work it out from the outside: the canonical example keeps the last added filter's
 * `values` array in state and compares it by reference, which is a React-only trick — under Svelte's
 * `$state` proxies the two references are not the same object. The component already knows which
 * chip is new, so it says so.
 */
export interface CustomRendererProps<T = unknown> {
	field: FilterFieldConfig<T>;
	values: T[];
	onChange: (values: T[]) => void;
	operator: string;
	/** True on the chip the Add filter menu has just created, for about a second. */
	autofocus: boolean;
}

/**
 * What a field's `renderOptionList` snippet receives.
 *
 * The point of it is to let a consumer render the list however they like — windowing it with a
 * library of their choice, say — while staying bound to this component's selection and keyboard
 * behaviour. Render the scrollable container yourself and call {@link renderOption} per row.
 */
export interface FilterOptionListRenderProps<T = unknown> {
	/** Already resolved, query-filtered, and selected-first. */
	options: FilterOption<T>[];
	/**
	 * Index into {@link options} of the keyboard-highlighted row, or `-1`.
	 *
	 * A virtualized list must scroll this row into view AND keep it mounted, or the combobox's
	 * `aria-activedescendant` points at an element that is not in the DOM.
	 */
	highlightedIndex: number;
	/** One row, with its id, checked state, highlight and toggle already wired. */
	renderOption: Snippet<[FilterOption<T>, number]>;
}

/** A labelled run of fields in the Add filter menu. The `{ group, fields }` half of the union. */
export interface FilterFieldGroup<T = unknown> {
	group?: string;
	fields: FilterFieldConfig<T>[];
}

/**
 * What `fields` accepts: a flat list, a list of groups, or — as every demo actually writes
 * it — a list of {@link FilterFieldConfig} whose entries carry `group` and `fields` themselves.
 */
export type FilterFieldsConfig<T = unknown> = FilterFieldConfig<T>[] | FilterFieldGroup<T>[];

/** One filterable field: what the Add filter menu lists, and what a chip is built from. */
export interface FilterFieldConfig<T = unknown> {
	/** Unique. A field without one is a group header and is skipped. */
	key?: string;
	/** Rendered in the menu row and in the chip's leading segment. */
	label?: string;
	/** Rendered before the label in both places. */
	icon?: Snippet;
	/** Defaults to `select`. `separator` is listed by nothing and filtered out of the menu. */
	type?: "select" | "multiselect" | "text" | "custom" | "separator";
	/** Group label, when this entry is a group rather than a field. */
	group?: string;
	/** The group's own fields. Flattened into the field map. */
	fields?: FilterFieldConfig<T>[];
	/** The static option list, for `select` and `multiselect`. */
	options?: FilterOption<T>[];
	/**
	 * Async options, called with the current search query and free to return a promise.
	 *
	 * Two shapes, both demonstrated on the page: prefetch a remote list once and ignore the
	 * query, or run the query server-side. Calls are debounced and guarded against out-of-order
	 * responses; when `options` is given as well it seeds the first view and the value→label
	 * cache, and the loader supplies everything after.
	 */
	loadOptions?: (query: string) => FilterOption<T>[] | Promise<FilterOption<T>[]>;
	/**
	 * Stable string identity for an option's value. Optional for the usual strings and numbers,
	 * needed for object values: an object read back out of the consumer's `$state` filters array
	 * is a proxy that is never `===` its source option, so identity comparison cannot recognise
	 * it. When declared, every selection check, row key and value→label cache key goes through
	 * this instead.
	 */
	getOptionKey?: (value: T) => string;
	/** Bring-your-own list rendering — see {@link FilterOptionListRenderProps}. */
	renderOptionList?: Snippet<[FilterOptionListRenderProps<T>]>;
	/** Replaces the operator set this field's `type` would otherwise get. */
	operators?: FilterOperator[];
	/** Replaces the whole value control of the chip. */
	customRenderer?: Snippet<[CustomRendererProps<T>]>;
	/** Replaces just the label inside the value control's trigger. */
	customValueRenderer?: Snippet<[{ values: T[]; options: FilterOption<T>[] }]>;
	/** Placeholder for a `text` field's input. */
	placeholder?: string;
	/** `false` removes the search box from this field's option list. Defaults to `true`. */
	searchable?: boolean;
	/** Cap on a `multiselect`. A toggle that would exceed it is ignored. */
	maxSelections?: number;
	/** Rendered in a leading addon of a `text` field's input. */
	prefix?: Snippet;
	/** Rendered in a trailing addon of a `text` field's input. */
	suffix?: Snippet;
	/** Regex source, tested on blur when no {@link validation} is given. */
	pattern?: string;
	/** Runs on blur instead of {@link pattern}. Return `false`, or a reason to show. */
	validation?: (value: unknown) => boolean | { valid: boolean; message?: string };
	/** Extra classes for this field's value control — its popover, or its input. */
	class?: string;
	/** The operator a filter for this field is created with. */
	defaultOperator?: string;
	/** Takes over `values` for this field — the controlled escape hatch. */
	value?: T[];
	/** Called instead of the filter's own `onChange` when {@link value} is controlled. */
	onValueChange?: (values: T[]) => void;
}

/** One active filter: the object the consumer owns, and the only state this component edits. */
export interface Filter<T = unknown> {
	/** Unique per instance — a field may be filtered on twice. */
	id: string;
	/** The {@link FilterFieldConfig.key} this filter is for. */
	field: string;
	/** One of the field's operators. */
	operator: string;
	/** `[]` for `empty` / `not_empty`, one entry for `select`, many for `multiselect`. */
	values: T[];
}

/** A named set of filters over a subset of fields. Returned by `createFilterGroup`. */
export interface FilterGroup<T = unknown> {
	id: string;
	label?: string;
	filters: Filter<T>[];
	fields: FilterFieldConfig<T>[];
}

/**
 * Every string this component renders, and the one helper that derives one.
 *
 * Passed to `<Filters i18n={…}>` as a `Partial`, and merged over `DEFAULT_I18N` one level deep —
 * `operators`, `placeholders`, `helpers` and `validation` merge per key, so a caller may
 * translate three operators without restating the other twenty-three.
 *
 * FIFTEEN UPSTREAM KEYS ARE NOT HERE. `true`, `false`, `min`, `max`, `to`, `typeAndPressEnter`,
 * `selected`, `percent`, `defaultCurrency`, `defaultColor` and `addFilterTitle`, plus
 * `placeholders.enterField`, `.selectField`, `.enterKey` and `.enterValue`, are declared by
 * the i18n config and rendered nowhere in the component — they belong to numeric,
 * boolean, colour and key/value field types this component never grew. Keeping them would ask a
 * translator to produce eleven strings and four templates that no screen can ever show. Every
 * key below, by contrast, appears on screen; `validation.invalidEmail`, `.invalidUrl` and
 * `.invalidTel` are the exception kept on purpose, because a field's own `validation` returning
 * a bare `false` is what `.invalid` covers and the three specific ones are what a caller reaches
 * for when writing their own message.
 */
export interface FilterI18nConfig {
	/** The default Add filter button's label. */
	addFilter: string;
	/** Placeholder of the Add filter menu's search box. */
	searchFields: string;
	/** Shown when the field search matches nothing. */
	noFieldsFound: string;
	/** Shown when an option search matches nothing. */
	noResultsFound: string;
	/** The value control's label while nothing is selected. */
	select: string;
	/** Suffix after the count, once more than one option is selected. */
	selectedCount: string;
	/** Shown while a `loadOptions` call is in flight and nothing is on screen yet. */
	loadingOptions: string;
	/** Shown when a `loadOptions` call rejects. */
	errorLoadingOptions: string;

	/** Operator labels, keyed by the camelCase name of the operator. */
	operators: {
		is: string;
		isNot: string;
		isAnyOf: string;
		isNotAnyOf: string;
		includesAll: string;
		excludesAll: string;
		before: string;
		after: string;
		between: string;
		notBetween: string;
		contains: string;
		notContains: string;
		startsWith: string;
		endsWith: string;
		isExactly: string;
		equals: string;
		notEquals: string;
		greaterThan: string;
		lessThan: string;
		overlaps: string;
		includes: string;
		excludes: string;
		includesAllOf: string;
		includesAnyOf: string;
		empty: string;
		notEmpty: string;
	};

	/** A function, not a template string, so a translation can put the name wherever it belongs. */
	placeholders: {
		searchField: (fieldName: string) => string;
	};

	helpers: {
		/** Turns an operator with no label of its own into one. */
		formatOperator: (operator: string) => string;
	};

	validation: {
		invalidEmail: string;
		invalidUrl: string;
		invalidTel: string;
		/** The fallback when a field's own `validation` returns `false` with no message. */
		invalid: string;
	};
}
