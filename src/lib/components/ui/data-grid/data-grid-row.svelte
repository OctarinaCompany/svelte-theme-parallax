<script lang="ts" module>
	import type { Cell, Row, RowData } from "@tanstack/table-core";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef } from "$lib/utils.js";

	import type { DataGridState } from "./data-grid.svelte.js";

	export type DataGridRowProps<TData extends RowData> = WithElementRef<
		HTMLAttributes<HTMLDivElement>
	> & {
		/** The grid state. Defaults to the one `<DataGrid.Root>` published. */
		grid?: DataGridState<TData>;
		/** The row to render. */
		row: Row<TData>;
		/** Its index in the current row model. */
		rowIndex: number;
		/** Its absolute offset inside the virtualized body, in pixels. */
		top: number;
		/** Whether columns stretch to fill the grid's width. */
		stretchColumns?: boolean;
		/** Override how a single cell renders. */
		cell?: Snippet<[{ cell: Cell<TData, unknown>; colIndex: number }]>;
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import { cn } from "$lib/utils.js";

	import DataGridCell from "./data-grid-cell.svelte";
	import {
		getColumnBorderVisibility,
		getColumnPinningStyle,
		getRowHeightValue,
	} from "./data-grid-utils.js";
	import { useDataGridContext } from "./data-grid.svelte.js";

	let {
		ref = $bindable(null),
		grid: gridProp,
		row,
		rowIndex,
		top,
		stretchColumns = false,
		class: className,
		cell: cellSnippet,
		...restProps
	}: DataGridRowProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.Row>");
	const grid = $derived(gridProp ?? contextGrid!);

	const visibleCells = $derived(row.getVisibleCells());
	const rowHeightValue = $derived(getRowHeightValue(grid.rowHeight));

	// The DOM registry the grid scrolls rows through, cleared when the row is unmounted by the
	// virtualizer.
	$effect(() => {
		grid.registerRow(rowIndex, ref);
		return () => grid.registerRow(rowIndex, null);
	});
</script>

<div
	bind:this={ref}
	role="row"
	aria-rowindex={grid.table.getHeaderGroups().length + rowIndex + 1}
	aria-selected={row.getIsSelected()}
	data-slot="data-grid-row"
	data-index={rowIndex}
	tabindex={-1}
	class={cn("absolute flex w-full border-b will-change-transform", className)}
	style={`height: ${rowHeightValue}px; transform: translateY(${top}px);`}
	{...restProps}
>
	{#each visibleCells as cell, colIndex (cell.id)}
		{@const columnId = cell.column.id}
		{@const borders = getColumnBorderVisibility({
			column: cell.column,
			nextColumn: visibleCells[colIndex + 1]?.column,
			isLastColumn: colIndex === visibleCells.length - 1,
		})}
		<div
			role="gridcell"
			aria-colindex={colIndex + 1}
			data-slot="data-grid-cell-container"
			data-column-id={columnId}
			data-highlighted={grid.focusedCell?.rowIndex === rowIndex &&
			grid.focusedCell?.columnId === columnId
				? ""
				: undefined}
			tabindex={-1}
			class={cn(
				stretchColumns && columnId !== "select" && "grow",
				borders.showEndBorder && columnId !== "select" && "border-e",
				borders.showStartBorder && columnId !== "select" && "border-s",
			)}
			style={`${getColumnPinningStyle({ column: cell.column, dir: grid.dir })} width: var(--col-${columnId}-size);`}
		>
			{#if cellSnippet}
				{@render cellSnippet({ cell, colIndex })}
			{:else}
				<DataGridCell
					{grid}
					{cell}
					{rowIndex}
					{columnId}
					rowHeight={grid.rowHeight}
					isEditing={grid.editingCell?.rowIndex === rowIndex &&
						grid.editingCell?.columnId === columnId}
					isFocused={grid.focusedCell?.rowIndex === rowIndex &&
						grid.focusedCell?.columnId === columnId}
					isSelected={grid.getIsCellSelected(rowIndex, columnId)}
					isSearchMatch={grid.getIsSearchMatch(rowIndex, columnId)}
					isActiveSearchMatch={grid.getIsActiveSearchMatch(rowIndex, columnId)}
					readOnly={grid.readOnly}
				/>
			{/if}
		</div>
	{/each}
</div>
