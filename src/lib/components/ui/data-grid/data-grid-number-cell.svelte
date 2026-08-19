<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridCellVariantProps } from "./data-grid-cell-wrapper.svelte";

	export type DataGridNumberCellProps<TData extends RowData> = DataGridCellVariantProps<TData>;
</script>

<script lang="ts" generics="TData extends RowData">
	import { untrack } from "svelte";

	import DataGridCellWrapper from "./data-grid-cell-wrapper.svelte";
	import { clampCellNumber } from "./data-grid-utils.js";
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
	}: DataGridNumberCellProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.Cell>");
	const grid = $derived(gridProp ?? contextGrid!);

	const initialValue = $derived(cell.getValue() as number | null | undefined);
	const cellOpts = $derived(cell.column.columnDef.meta?.cell);
	const numberOpts = $derived(cellOpts?.variant === "number" ? cellOpts : null);

	/** The editor's text. Reseeded from the row whenever the cell is not being edited. */
	let draft = $state("");
	let inputRef = $state<HTMLInputElement | null>(null);
	let skipBlurCommit = false;

	$effect(() => {
		const next = initialValue ?? "";
		if (untrack(() => isEditing)) return;
		draft = String(next);
	});

	$effect(() => {
		if (!isEditing) return;
		const element = inputRef;
		if (!element) return;
		untrack(() => element.focus());
	});

	/**
	 * Commit the draft, clamped to the column's `min`/`max`.
	 *
	 * The input's attributes alone do not constrain a typed value, so the bounds are enforced here;
	 * the draft is rewritten to the clamped number as well, so the resting cell never shows a value
	 * the grid refused to store.
	 */
	function commit(): void {
		const parsed = draft === "" ? null : Number(draft);
		const next = clampCellNumber(parsed, numberOpts ?? undefined);

		if (next !== parsed) draft = next === null ? "" : String(next);
		if (!readOnly && next !== (initialValue ?? null)) {
			grid.updateData({ rowIndex, columnId, value: next });
		}
	}

	function handleBlur(): void {
		if (skipBlurCommit) {
			skipBlurCommit = false;
			return;
		}
		commit();
		grid.stopEditing();
	}

	function handleWrapperKeydown(event: KeyboardEvent): void {
		if (isEditing) {
			if (event.key === "Enter") {
				event.preventDefault();
				event.stopPropagation();
				skipBlurCommit = true;
				commit();
				grid.stopEditing({ moveToNextRow: true });
			} else if (event.key === "Tab") {
				event.preventDefault();
				event.stopPropagation();
				skipBlurCommit = true;
				commit();
				grid.stopEditing({ direction: grid.getTabDirection(event.shiftKey) });
			} else if (event.key === "Escape") {
				event.preventDefault();
				event.stopPropagation();
				skipBlurCommit = true;
				draft = String(initialValue ?? "");
				grid.stopEditing();
			}
			return;
		}

		if (!isFocused || readOnly) return;

		// Typing over a focused cell replaces its value; Backspace starts from empty.
		if (event.key === "Backspace") draft = "";
		else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) draft = event.key;
	}
</script>

<DataGridCellWrapper
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
	data-slot="data-grid-number-cell"
	onkeydown={handleWrapperKeydown}
>
	{#if isEditing}
		<input
			bind:this={inputRef}
			bind:value={draft}
			type="number"
			aria-label={String(cell.column.columnDef.meta?.label ?? columnId)}
			min={numberOpts?.min}
			max={numberOpts?.max}
			step={numberOpts?.step}
			class="w-full [appearance:textfield] border-none bg-transparent p-0 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			onblur={handleBlur}
		/>
	{:else}
		<span data-slot="data-grid-cell-content">{draft}</span>
	{/if}
</DataGridCellWrapper>
