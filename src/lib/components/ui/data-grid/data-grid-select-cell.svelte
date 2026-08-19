<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridCellVariantProps } from "./data-grid-cell-wrapper.svelte";

	export type DataGridSelectCellProps<TData extends RowData> = DataGridCellVariantProps<TData>;
</script>

<script lang="ts" generics="TData extends RowData">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import * as Command from "$lib/components/ui/command/index.js";

	import DataGridCellEditor from "./data-grid-cell-editor.svelte";
	import DataGridCellWrapper from "./data-grid-cell-wrapper.svelte";
	import { useDataGridContext } from "./data-grid.svelte.js";

	let {
		grid: gridProp,
		cell,
		rowIndex,
		columnId,
		rowHeight,
		isEditing,
		isFocused,
		isSelected,
		isSearchMatch,
		isActiveSearchMatch,
		readOnly,
	}: DataGridSelectCellProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.Cell>");
	const grid = $derived(gridProp ?? contextGrid!);

	let cellRef = $state<HTMLDivElement | null>(null);

	const cellOpts = $derived(cell.column.columnDef.meta?.cell);
	const options = $derived(cellOpts?.variant === "select" ? cellOpts.options : []);
	const value = $derived(String(cell.getValue() ?? ""));
	const displayLabel = $derived(options.find((option) => option.value === value)?.label ?? value);

	function choose(next: string): void {
		if (readOnly) return;
		grid.updateData({ rowIndex, columnId, value: next });
		grid.stopEditing();
	}

	// Escape and outside presses are the editor layer's job — its listeners are on the document, so
	// they fire wherever focus sits. Nothing is pending here: `choose()` writes immediately.
	//
	// Tab on a resting cell is plain navigation: the grid's own handler owns it, so it must bubble.
</script>

<DataGridCellWrapper
	bind:ref={cellRef}
	{grid}
	{cell}
	{rowIndex}
	{columnId}
	{rowHeight}
	{isEditing}
	{isFocused}
	{isSelected}
	{isSearchMatch}
	{isActiveSearchMatch}
	{readOnly}
	data-slot="data-grid-select-cell"
>
	{#if displayLabel}
		<Badge
			data-slot="data-grid-cell-content"
			variant="secondary"
			class="px-1.5 py-px whitespace-pre-wrap"
		>
			{displayLabel}
		</Badge>
	{/if}
	{#if isEditing}
		<DataGridCellEditor
			open={isEditing}
			anchor={cellRef}
			onDismiss={() => grid.stopEditing()}
			class="w-[220px]"
		>
			<Command.Root>
				<Command.Input placeholder="Search..." aria-label="Search options" />
				<Command.List>
					<Command.Empty>No options found.</Command.Empty>
					<Command.Group>
						{#each options as option (option.value)}
							<Command.Item value={option.label} onSelect={() => choose(option.value)}>
								{option.label}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</DataGridCellEditor>
	{/if}
</DataGridCellWrapper>
