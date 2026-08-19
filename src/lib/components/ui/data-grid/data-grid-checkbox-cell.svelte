<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridCellVariantProps } from "./data-grid-cell-wrapper.svelte";

	/**
	 * A checkbox cell toggles in place, so it never enters edit mode — upstream types it with the
	 * same `Omit<…, 'isEditing'>`.
	 */
	export type DataGridCheckboxCellProps<TData extends RowData> = Omit<
		DataGridCellVariantProps<TData>,
		"isEditing"
	> & {
		/** Accepted for a uniform call site and ignored, matching upstream's `Omit`. */
		isEditing?: boolean;
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";

	import DataGridCellWrapper from "./data-grid-cell-wrapper.svelte";
	import { useDataGridContext } from "./data-grid.svelte.js";

	let {
		grid: gridProp,
		cell,
		rowIndex,
		columnId,
		rowHeight,
		isEditing: _isEditing,
		isFocused,
		isSelected,
		isSearchMatch,
		isActiveSearchMatch,
		readOnly,
	}: DataGridCheckboxCellProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.Cell>");
	const grid = $derived(gridProp ?? contextGrid!);

	const checked = $derived(Boolean(cell.getValue()));

	function setChecked(next: boolean): void {
		if (readOnly) return;
		grid.updateData({ rowIndex, columnId, value: next });
	}

	function handleWrapperKeydown(event: KeyboardEvent): void {
		if (!isFocused || readOnly) return;
		if (event.ctrlKey || event.metaKey || event.altKey) return;

		// `Shift+Enter` is the grid's row-insert shortcut, so only the unshifted keys toggle.
		if (event.key === "F2" || (!event.shiftKey && (event.key === " " || event.key === "Enter"))) {
			event.preventDefault();
			event.stopPropagation();
			setChecked(!checked);
			return;
		}

		// Every other variant starts an edit on a printable character; a checkbox has no editor, so
		// the key is swallowed here. Letting it reach the wrapper would call `grid.startEditing()`
		// for a cell that is rendered with `isEditing={false}` and can therefore never call
		// `stopEditing()` — leaving `editingCell` set and the grid deaf to every subsequent key.
		if (event.key.length === 1) {
			event.preventDefault();
			event.stopPropagation();
		}

		// Tab is plain navigation here — a checkbox cell has no edit mode to leave — so it is left
		// to bubble to the grid's own handler.
	}

	function handleWrapperClick(event: MouseEvent): void {
		if (!isFocused || readOnly) return;
		// `preventDefault()` tells the wrapper this click is handled, so it does not start an edit.
		event.preventDefault();
		event.stopPropagation();
		setChecked(!checked);
	}

	/** A double click has already toggled twice through the two clicks; it must not start an edit. */
	function handleWrapperDblClick(event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();
	}
</script>

<DataGridCellWrapper
	{grid}
	{cell}
	{rowIndex}
	{columnId}
	{rowHeight}
	isEditing={false}
	{isFocused}
	{isSelected}
	{isSearchMatch}
	{isActiveSearchMatch}
	{readOnly}
	data-slot="data-grid-checkbox-cell"
	class="flex size-full justify-center"
	onclick={handleWrapperClick}
	ondblclick={handleWrapperDblClick}
	onkeydown={handleWrapperKeydown}
>
	<Checkbox
		aria-label={String(cell.column.columnDef.meta?.label ?? columnId)}
		{checked}
		onCheckedChange={setChecked}
		disabled={readOnly}
		class="border-primary"
		onclick={(event) => event.stopPropagation()}
		onpointerdown={(event) => event.stopPropagation()}
		ondblclick={(event) => event.stopPropagation()}
	/>
</DataGridCellWrapper>
