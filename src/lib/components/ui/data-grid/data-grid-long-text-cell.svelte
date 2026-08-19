<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridCellVariantProps } from "./data-grid-cell-wrapper.svelte";

	export type DataGridLongTextCellProps<TData extends RowData> = DataGridCellVariantProps<TData>;
</script>

<script lang="ts" generics="TData extends RowData">
	import { untrack } from "svelte";

	import { Textarea } from "$lib/components/ui/textarea/index.js";

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
	}: DataGridLongTextCellProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.Cell>");
	const grid = $derived(gridProp ?? contextGrid!);

	const initialValue = $derived(String(cell.getValue() ?? ""));

	let draft = $state("");
	let cellRef = $state<HTMLDivElement | null>(null);
	let textareaRef = $state<HTMLTextAreaElement | null>(null);
	/** A printable character typed on the focused cell, seeded once the editor opens. */
	let pendingChar: string | null = null;

	$effect(() => {
		const next = initialValue;
		if (untrack(() => isEditing)) return;
		draft = next;
	});

	$effect(() => {
		if (!isEditing) return;
		const element = textareaRef;
		if (!element) return;

		untrack(() => {
			if (pendingChar !== null) {
				draft = pendingChar;
				pendingChar = null;
			}
			element.focus();
			const length = element.value.length;
			element.setSelectionRange(length, length);
		});
	});

	function commit(): void {
		if (!readOnly && draft !== initialValue) {
			grid.updateData({ rowIndex, columnId, value: draft });
		}
	}

	function handleWrapperKeydown(event: KeyboardEvent): void {
		if (isEditing) return;

		if (isFocused && !readOnly && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
			pendingChar = event.key;
		}
	}

	function handleEditorKeydown(event: KeyboardEvent): void {
		event.stopPropagation();

		if (event.key === "Escape") {
			event.preventDefault();
			draft = initialValue;
			grid.stopEditing();
			return;
		}

		if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			commit();
			grid.stopEditing();
			return;
		}

		if (event.key === "Tab") {
			event.preventDefault();
			commit();
			grid.stopEditing({ direction: grid.getTabDirection(event.shiftKey) });
		}
	}
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
	data-slot="data-grid-long-text-cell"
	onkeydown={handleWrapperKeydown}
>
	<span data-slot="data-grid-cell-content">{initialValue}</span>
	{#if isEditing}
		<DataGridCellEditor
			open={isEditing}
			anchor={cellRef}
			onDismiss={() => {
				// Upstream flushes the pending draft when the layer closes and only reverts on Escape —
				// which `handleEditorKeydown` owns, having already reset `draft` before this runs.
				commit();
				grid.stopEditing();
			}}
			class="w-[400px]"
		>
			<Textarea
				bind:ref={textareaRef}
				bind:value={draft}
				aria-label={String(cell.column.columnDef.meta?.label ?? columnId)}
				placeholder="Enter text..."
				class="max-h-[300px] min-h-[150px] resize-none overflow-y-auto rounded-none border-0 shadow-none focus-visible:ring-1 focus-visible:ring-ring"
				onblur={() => {
					commit();
					grid.stopEditing();
				}}
				onkeydown={handleEditorKeydown}
			/>
		</DataGridCellEditor>
	{/if}
</DataGridCellWrapper>
