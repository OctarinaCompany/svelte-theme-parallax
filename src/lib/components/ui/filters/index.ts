// Root-only barrel, deliberately: Filters is one config-driven monolith, so
// the part files here are internal render helpers with no standalone use — a chip segment outside
// its root has no filter to edit and throws on the missing context.
import Root from "./filters.svelte";

export { filtersVariants, type FiltersProps } from "./filters.svelte";

export {
	DEFAULT_I18N,
	DEFAULT_OPERATORS,
	createOperatorsFromI18n,
	mergeI18n,
} from "./filters-i18n.js";

export {
	createFilter,
	createFilterGroup,
	fieldHasOptions,
	flattenFields,
	getFieldsMap,
	getOperatorsForField,
	isSameValue,
} from "./filters-utils.js";

export { getFiltersContext, setFiltersContext, type FiltersContext } from "./filters.svelte.js";

export type {
	CustomRendererProps,
	Filter,
	FilterFieldConfig,
	FilterFieldGroup,
	FilterFieldsConfig,
	FilterGroup,
	FilterI18nConfig,
	FilterOperator,
	FilterOption,
	FilterOptionListRenderProps,
	FilterSize,
	FilterVariant,
} from "./types.js";

export {
	Root,
	//
	Root as Filters,
};
