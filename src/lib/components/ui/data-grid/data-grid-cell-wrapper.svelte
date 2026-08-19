<script lang="ts" module>
	import type { Cell, RowData } from "@tanstack/table-core";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef } from "$lib/utils.js";

	import type { DataGridState } from "./data-grid.svelte.js";
	import type { RowHeightValue } from "./types.js";

	/**
	 * What every cell variant is handed. Identical to upstream's `DataGridCellProps`, except that
	 * the twenty-odd `tableMeta` callbacks collapse into the single `grid` state object every part
	 * can also read from context.
	 */
	export type DataGridCellVariantProps<TData extends RowData> = {
		/** The grid state. Defaults to the one `<DataGrid.Root>` published. */
		grid?: DataGridState<TData>;
		/** The table-core cell this component renders. */
		cell: Cell<TData, unknown>;
		/** The cell's row index in the current row model. */
		rowIndex: number;
		/** The cell's column id. */
		columnId: string;
		/** The active row-height preset, which decides the resting line clamp. */
		rowHeight: RowHeightValue;
		/** Whether the cell is in edit mode. */
		isEditing: boolean;
		/** Whether the cell holds grid focus. */
		isFocused: boolean;
		/** Whether the cell is part of the cell selection. */
		isSelected: boolean;
		/** Whether the cell matches the current search query. */
		isSearchMatch: boolean;
		/** Whether the cell is the search match being navigated to. */
		isActiveSearchMatch: boolean;
		/** Whether editing is blocked. */
		readOnly: boolean;
	};

	export type DataGridCellWrapperProps<TData extends RowData> = WithElementRef<
		HTMLAttributes<HTMLDivElement>
	> &
		DataGridCellVariantProps<TData> & {
			/** The variant's own resting content or editor. */
			children?: Snippet;
		};

	/** Keys the grid's own keydown handler owns; the wrapper must let them bubble untouched. */
	const NAVIGATION_KEYS = new Set([
		"ArrowUp",
		"ArrowDown",
		"ArrowLeft",
		"ArrowRight",
		"Home",
		"End",
		"PageUp",
		"PageDown",
		"Tab",
	]);
</script>

<script lang="ts" generics="TData extends RowData">
	import { cn } from "$lib/utils.js";

	import { useDataGridContext } from "./data-grid.svelte.js";

	let {
		ref = $bindable(null),
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
		class: className,
		onclick,
		ondblclick,
		onkeydown,
		children,
		...restProps
	}: DataGridCellWrapperProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.Cell>");
	const grid = $derived(gridProp ?? contextGrid!);

	const isCut = $derived(grid.clipboard.isCut(rowIndex, columnId));

	// The DOM registry the grid focuses and scrolls through. Cleared on unmount so a virtualized
	// row that scrolls away never leaves a detached node behind.
	$effect(() => {
		grid.registerCell(rowIndex, columnId, ref);
		return () => grid.registerCell(rowIndex, columnId, null);
	});

	/**
	 * Whether an event came from an editor the cell renders over itself. The built-in overlay
	 * editors portal out of the grid (`<DataGridCellEditor>`), so their events never reach here —
	 * but a custom variant may render one inline, and then every click inside it would also read as
	 * a click on the cell, re-opening the editor the moment a choice closed it.
	 */
	function isFromEditor(event: Event): boolean {
		return (
			event.target instanceof Element && event.target.closest("[data-grid-cell-editor]") !== null
		);
	}

	/**
	 * A variant's own handler runs first and owns the event if it calls `preventDefault()` — the
	 * `checkbox` variant does exactly that, because it toggles in place and must never be handed to
	 * `startEditing()` (it renders with `isEditing={false}`, so nothing would ever stop the edit).
	 */
	function handleClick(event: MouseEvent & { currentTarget: HTMLDivElement }): void {
		if (isEditing || isFromEditor(event)) return;

		onclick?.(event);
		if (event.defaultPrevented) return;

		event.preventDefault();

		if (isFocused && !readOnly) grid.startEditing(rowIndex, columnId);
		else grid.handleCellClick(rowIndex, columnId, event);
	}

	function handleDblClick(event: MouseEvent & { currentTarget: HTMLDivElement }): void {
		if (isEditing || isFromEditor(event)) return;

		ondblclick?.(event);
		if (event.defaultPrevented) return;

		event.preventDefault();
		grid.startEditing(rowIndex, columnId);
	}

	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }): void {
		onkeydown?.(event);
		if (event.defaultPrevented) return;
		if (NAVIGATION_KEYS.has(event.key)) return;
		if (!isFocused || isEditing || readOnly) return;

		// `Shift+Enter` is the grid's row-insert shortcut, never an edit trigger: the wrapper is the
		// inner listener, so letting it through here would swallow the event before the grid sees it.
		if (event.key === "F2" || (event.key === "Enter" && !event.shiftKey) || event.key === " ") {
			event.preventDefault();
			event.stopPropagation();
			grid.startEditing(rowIndex, columnId);
			return;
		}

		if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
			event.preventDefault();
			event.stopPropagation();
			grid.startEditing(rowIndex, columnId);
		}
	}
</script>

<div
	bind:this={ref}
	role="button"
	data-slot="data-grid-cell-wrapper"
	data-cell-id={cell.id}
	data-cell-key={`${rowIndex}:${columnId}`}
	data-editing={isEditing ? "" : undefined}
	data-focused={isFocused ? "" : undefined}
	data-selected={isSelected ? "" : undefined}
	data-search-match={isSearchMatch ? "" : undefined}
	data-active-search-match={isActiveSearchMatch ? "" : undefined}
	data-cut={isCut ? "" : undefined}
	data-readonly={readOnly ? "" : undefined}
	tabindex={isFocused && !isEditing ? 0 : -1}
	class={cn(
		"size-full px-2 py-1.5 text-start text-sm outline-none has-data-[slot=checkbox]:pt-2.5",
		isFocused && "ring-1 ring-ring ring-inset",
		isSearchMatch && !isActiveSearchMatch && "bg-warning/15",
		isActiveSearchMatch && "bg-warning/35",
		isSelected && !isEditing && "bg-primary/10",
		isCut && "opacity-60",
		!isEditing && "cursor-default",
		!isEditing && rowHeight === "short" && "**:data-[slot=data-grid-cell-content]:line-clamp-1",
		!isEditing && rowHeight === "medium" && "**:data-[slot=data-grid-cell-content]:line-clamp-2",
		!isEditing && rowHeight === "tall" && "**:data-[slot=data-grid-cell-content]:line-clamp-3",
		!isEditing &&
			rowHeight === "extra-tall" &&
			"**:data-[slot=data-grid-cell-content]:line-clamp-4",
		className,
	)}
	onclick={handleClick}
	oncontextmenu={(event) => {
		if (!isEditing && !isFromEditor(event)) grid.handleCellContextMenu(rowIndex, columnId, event);
	}}
	ondblclick={handleDblClick}
	onpointerdown={(event) => {
		if (!isEditing && !isFromEditor(event)) grid.handleCellPointerDown(rowIndex, columnId, event);
	}}
	onpointerenter={(event) => {
		if (!isEditing && !isFromEditor(event)) grid.handleCellPointerEnter(rowIndex, columnId);
	}}
	onpointerup={(event) => {
		if (!isEditing && !isFromEditor(event)) grid.handleCellPointerUp();
	}}
	onkeydown={handleKeydown}
	{...restProps}
>
	{@render children?.()}
</div>
