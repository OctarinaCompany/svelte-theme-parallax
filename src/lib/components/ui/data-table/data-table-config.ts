/**
 * Filter-variant table — the source of truth for {@link FilterVariant}.
 *
 * Ported from upstream `docs/config/data-table.ts`, cut down to what this theme ships: column-bound
 * faceted/toolbar filtering lives here in `ui/data-table`; standalone advanced filter-building
 * (operator vocabularies, join logic) is `ui/filters`. Upstream's operator, join and sort tables
 * served only its advanced filter surfaces (`DataTableFilterList`, `DataTableFilterMenu`,
 * `DataTableSortList`), which are not ported, so they do not ship.
 */
export const dataTableConfig = {
	filterVariants: [
		"text",
		"number",
		"range",
		"date",
		"dateRange",
		"boolean",
		"select",
		"multiSelect",
	] as const,
};

export type DataTableConfig = typeof dataTableConfig;
