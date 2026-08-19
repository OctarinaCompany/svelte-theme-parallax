<script lang="ts" module>
	import type { Column, RowData } from "@tanstack/table-core";

	import type { DataTableFilterAttributes } from "./types.js";

	export type DataTableToolbarFilterProps<TData extends RowData> = DataTableFilterAttributes & {
		/** The column to render a filter control for. */
		column: Column<TData, unknown>;
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import { Input } from "$lib/components/ui/input/index.js";
	import { cn } from "$lib/utils.js";

	import DataTableDateFilter from "./data-table-date-filter.svelte";
	import DataTableFacetedFilter from "./data-table-faceted-filter.svelte";
	import DataTableSliderFilter from "./data-table-slider-filter.svelte";

	// Upstream keeps this component module-private; one part per file makes it a file, and
	// exporting it is free.
	let { column, class: className, ...restProps }: DataTableToolbarFilterProps<TData> = $props();

	const meta = $derived(column.columnDef.meta);
	const variant = $derived(meta?.variant);
	const title = $derived(meta?.label ?? column.id);
	const textValue = $derived(
		typeof column.getFilterValue() === "string" ? column.getFilterValue() : "",
	);
</script>

{#if variant === "text"}
	<Input
		data-slot="data-table-toolbar-filter"
		placeholder={meta?.placeholder ?? meta?.label}
		value={textValue}
		oninput={(event) => column.setFilterValue(event.currentTarget.value)}
		class={cn("h-8 w-40 lg:w-56", className)}
		{...restProps}
	/>
{:else if variant === "number"}
	<div class="relative">
		<Input
			data-slot="data-table-toolbar-filter"
			type="number"
			inputmode="numeric"
			placeholder={meta?.placeholder ?? meta?.label}
			value={textValue}
			oninput={(event) => column.setFilterValue(event.currentTarget.value)}
			class={cn("h-8 w-[120px]", meta?.unit && "pr-8", className)}
			{...restProps}
		/>
		{#if meta?.unit}
			<span
				class="absolute inset-y-px right-px flex items-center rounded-r-[calc(var(--radius-lg)-1px)] bg-accent px-2 text-sm text-muted-foreground"
			>
				{meta.unit}
			</span>
		{/if}
	</div>
{:else if variant === "range"}
	<DataTableSliderFilter {column} {title} class={className} {...restProps} />
{:else if variant === "date" || variant === "dateRange"}
	<DataTableDateFilter
		{column}
		{title}
		multiple={variant === "dateRange"}
		class={className}
		{...restProps}
	/>
{:else if variant === "select" || variant === "multiSelect"}
	<DataTableFacetedFilter
		{column}
		{title}
		options={meta?.options ?? []}
		multiple={variant === "multiSelect"}
		class={className}
		{...restProps}
	/>
{/if}

<!--
	No `meta.variant`, or `variant === 'boolean'`: nothing is rendered, matching upstream's
	`default: return null`.
-->
