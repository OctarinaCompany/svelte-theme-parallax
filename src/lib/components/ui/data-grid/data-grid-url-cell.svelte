<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridCellVariantProps } from "./data-grid-cell-wrapper.svelte";

	export type DataGridUrlCellProps<TData extends RowData> = DataGridCellVariantProps<TData>;
</script>

<script lang="ts" generics="TData extends RowData">
	import { untrack } from "svelte";
	import { toast } from "svelte-sonner";

	import { cn } from "$lib/utils.js";

	import DataGridCellWrapper from "./data-grid-cell-wrapper.svelte";
	import { getUrlHref } from "./data-grid-utils.js";
	import { placeCaretAtEnd } from "./data-grid-short-text-cell.svelte";
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
	}: DataGridUrlCellProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.Cell>");
	const grid = $derived(gridProp ?? contextGrid!);

	const initialValue = $derived(String(cell.getValue() ?? ""));
	const displayValue = $derived(isEditing ? "" : initialValue);
	const urlHref = $derived(displayValue ? getUrlHref(displayValue) : "");
	/** A value that resolved to no `href` was rejected for its protocol. */
	const isDangerousUrl = $derived(Boolean(displayValue) && !urlHref);

	let editorRef = $state<HTMLDivElement | null>(null);
	let pendingChar: string | null = null;
	let skipBlurCommit = false;

	function commit(): void {
		const next = editorRef?.textContent?.trim() ?? "";
		if (!readOnly && next !== initialValue) {
			grid.updateData({ rowIndex, columnId, value: next || null });
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

	function handleLinkClick(event: MouseEvent): void {
		if (isEditing) {
			event.preventDefault();
			return;
		}

		if (!getUrlHref(initialValue)) {
			event.preventDefault();
			toast.error("Invalid URL", {
				description: "URL contains a dangerous protocol (javascript:, data:, vbscript:, or file:)",
			});
			return;
		}

		event.stopPropagation();
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
	data-slot="data-grid-url-cell"
	onkeydown={handleWrapperKeydown}
>
	{#if !isEditing && displayValue}
		<div data-slot="data-grid-cell-content" class="size-full overflow-hidden">
			<a
				data-focused={isFocused && !isDangerousUrl ? "" : undefined}
				data-invalid={isDangerousUrl ? "" : undefined}
				href={urlHref}
				target="_blank"
				rel="noopener noreferrer"
				class="truncate text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary/60 data-focused:text-foreground data-focused:decoration-foreground/50 data-focused:hover:decoration-foreground/70 data-invalid:cursor-not-allowed data-invalid:text-destructive data-invalid:decoration-destructive/50 data-invalid:hover:decoration-destructive/70"
				onclick={handleLinkClick}
			>
				{displayValue}
			</a>
		</div>
	{:else}
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
	{/if}
</DataGridCellWrapper>
