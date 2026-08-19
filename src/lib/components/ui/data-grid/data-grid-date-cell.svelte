<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridCellVariantProps } from "./data-grid-cell-wrapper.svelte";

	export type DataGridDateCellProps<TData extends RowData> = DataGridCellVariantProps<TData>;
</script>

<script lang="ts" generics="TData extends RowData">
	import { CalendarDate, getLocalTimeZone, type DateValue } from "@internationalized/date";

	import { Calendar } from "$lib/components/ui/calendar/index.js";

	import DataGridCellEditor from "./data-grid-cell-editor.svelte";
	import DataGridCellWrapper from "./data-grid-cell-wrapper.svelte";
	import { formatDateForDisplay, formatDateToString, parseLocalDate } from "./data-grid-utils.js";
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
	}: DataGridDateCellProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.Cell>");
	const grid = $derived(gridProp ?? contextGrid!);

	let cellRef = $state<HTMLDivElement | null>(null);

	const rawValue = $derived(cell.getValue());
	const selectedDate = $derived(parseLocalDate(rawValue));
	const calendarValue = $derived(
		selectedDate
			? new CalendarDate(
					selectedDate.getFullYear(),
					selectedDate.getMonth() + 1,
					selectedDate.getDate(),
				)
			: undefined,
	);

	function handleSelect(next: DateValue | undefined): void {
		if (!next || readOnly) return;
		grid.updateData({
			rowIndex,
			columnId,
			value: formatDateToString(next.toDate(getLocalTimeZone())),
		});
		grid.stopEditing();
	}

	// Escape and outside presses are the editor layer's job — its listeners are on the document, so
	// they fire wherever focus sits. Nothing is pending here: `handleSelect()` writes immediately.
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
	data-slot="data-grid-date-cell"
>
	<span data-slot="data-grid-cell-content">{formatDateForDisplay(rawValue)}</span>
	{#if isEditing}
		<DataGridCellEditor
			open={isEditing}
			anchor={cellRef}
			onDismiss={() => grid.stopEditing()}
			class="w-auto"
		>
			<Calendar
				type="single"
				captionLayout="dropdown"
				value={calendarValue}
				onValueChange={handleSelect}
			/>
		</DataGridCellEditor>
	{/if}
</DataGridCellWrapper>
