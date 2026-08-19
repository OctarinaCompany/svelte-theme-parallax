<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridCellVariantProps } from "./data-grid-cell-wrapper.svelte";

	export type DataGridShortTextCellProps<TData extends RowData> = DataGridCellVariantProps<TData>;

	/**
	 * Put the caret after the last character of a `contenteditable` element.
	 *
	 * Upstream seeds a typed character with `document.execCommand('insertText')`, which is
	 * deprecated and unimplemented in jsdom; a Range/Selection collapse is the same behaviour
	 * without either problem.
	 */
	export function placeCaretAtEnd(element: HTMLElement): void {
		if (!element.textContent) return;
		const range = document.createRange();
		const selection = window.getSelection();
		range.selectNodeContents(element);
		range.collapse(false);
		selection?.removeAllRanges();
		selection?.addRange(range);
	}
</script>

<script lang="ts" generics="TData extends RowData">
	import { untrack } from "svelte";

	import { cn } from "$lib/utils.js";

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
	}: DataGridShortTextCellProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.Cell>");
	const grid = $derived(gridProp ?? contextGrid!);

	const initialValue = $derived(String(cell.getValue() ?? ""));
	/** While editing the browser owns the text, so Svelte must render nothing into the element. */
	const displayValue = $derived(isEditing ? "" : initialValue);

	let editorRef = $state<HTMLDivElement | null>(null);
	/** A printable character typed on the focused cell, seeded once the editor opens. */
	let pendingChar: string | null = null;
	/** Set by an explicit commit or discard, so the follow-up blur does not write twice. */
	let skipBlurCommit = false;

	function commit(): void {
		const next = editorRef?.textContent ?? "";
		if (!readOnly && next !== initialValue) {
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
				// No manual restore is needed: leaving edit mode makes `displayValue` the resting
				// value again, and Svelte writes it back for us.
				skipBlurCommit = true;
				grid.stopEditing();
			}
			return;
		}

		if (isFocused && !readOnly && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
			pendingChar = event.key;
		}
	}

	$effect(() => {
		if (!isEditing) return;
		const element = editorRef;
		if (!element) return;

		untrack(() => {
			element.textContent = pendingChar ?? initialValue;
			pendingChar = null;
			element.focus();
			placeCaretAtEnd(element);
		});
	});
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
	data-slot="data-grid-short-text-cell"
	onkeydown={handleWrapperKeydown}
>
	<div
		bind:this={editorRef}
		role="textbox"
		tabindex="-1"
		aria-label={String(cell.column.columnDef.meta?.label ?? columnId)}
		data-slot="data-grid-cell-content"
		contenteditable={isEditing}
		class={cn(
			"size-full overflow-hidden outline-none",
			isEditing && "whitespace-nowrap **:inline **:whitespace-nowrap [&_br]:hidden",
		)}
		onblur={handleBlur}
	>
		{displayValue}
	</div>
</DataGridCellWrapper>
