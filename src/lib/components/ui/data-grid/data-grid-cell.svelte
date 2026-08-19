<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridCellVariantProps } from "./data-grid-cell-wrapper.svelte";

	export type DataGridCellProps<TData extends RowData> = DataGridCellVariantProps<TData>;
</script>

<script lang="ts" generics="TData extends RowData">
	import DataGridCheckboxCell from "./data-grid-checkbox-cell.svelte";
	import DataGridDateCell from "./data-grid-date-cell.svelte";
	import DataGridFileCell from "./data-grid-file-cell.svelte";
	import DataGridLongTextCell from "./data-grid-long-text-cell.svelte";
	import DataGridMultiSelectCell from "./data-grid-multi-select-cell.svelte";
	import DataGridNumberCell from "./data-grid-number-cell.svelte";
	import DataGridSelectCell from "./data-grid-select-cell.svelte";
	import DataGridShortTextCell from "./data-grid-short-text-cell.svelte";
	import DataGridUrlCell from "./data-grid-url-cell.svelte";

	let props: DataGridCellProps<TData> = $props();

	const variant = $derived(props.cell.column.columnDef.meta?.cell?.variant);
</script>

<!--
	The variant router. Anything unknown or absent falls back to short text, matching upstream's
	`default` branch.
-->
{#if variant === "long-text"}
	<DataGridLongTextCell {...props} />
{:else if variant === "number"}
	<DataGridNumberCell {...props} />
{:else if variant === "url"}
	<DataGridUrlCell {...props} />
{:else if variant === "checkbox"}
	<DataGridCheckboxCell {...props} />
{:else if variant === "select"}
	<DataGridSelectCell {...props} />
{:else if variant === "multi-select"}
	<DataGridMultiSelectCell {...props} />
{:else if variant === "date"}
	<DataGridDateCell {...props} />
{:else if variant === "file"}
	<DataGridFileCell {...props} />
{:else}
	<DataGridShortTextCell {...props} />
{/if}
