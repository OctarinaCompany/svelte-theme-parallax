<script lang="ts" module>
	import type { Row, RowData } from "@tanstack/table-core";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef } from "$lib/utils.js";

	import type { DataGridState } from "./data-grid.svelte.js";
	import type { Direction } from "./types.js";

	export type DataGridRootProps<TData extends RowData> = WithElementRef<
		HTMLAttributes<HTMLDivElement>
	> & {
		/** The state returned by `createDataGrid`. Also published to context. */
		grid: DataGridState<TData>;
		/** Text direction. Defaults to the direction the grid resolved. */
		dir?: Direction;
		/**
		 * The grid's maximum height in pixels.
		 * @default 600
		 */
		height?: number;
		/**
		 * Whether columns grow to fill the grid's width.
		 * @default false
		 */
		stretchColumns?: boolean;
		/** Rendered after the grid — toolbars, overlays, the shortcuts dialog. */
		children?: Snippet;
		/** Override how a whole row renders. */
		row?: Snippet<[{ row: Row<TData>; rowIndex: number; top: number }]>;
		/** Rendered inside the body when there are no rows. */
		empty?: Snippet;
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import PlusIcon from "@lucide/svelte/icons/plus";
	import { untrack } from "svelte";

	import { cn } from "$lib/utils.js";

	import DataGridColumnHeader from "./data-grid-column-header.svelte";
	import DataGridContextMenu from "./data-grid-context-menu.svelte";
	import DataGridPasteDialog from "./data-grid-paste-dialog.svelte";
	import DataGridRow from "./data-grid-row.svelte";
	import DataGridSearch from "./data-grid-search.svelte";
	import {
		getColumnBorderVisibility,
		getColumnPinningStyle,
		getIsInPopover,
	} from "./data-grid-utils.js";
	import { setDataGridContext } from "./data-grid.svelte.js";

	let {
		ref = $bindable(null),
		grid,
		dir,
		height = 600,
		stretchColumns = false,
		class: className,
		children,
		row: rowSnippet,
		empty,
		...restProps
	}: DataGridRootProps<TData> = $props();

	setDataGridContext<TData>(untrack(() => grid));

	let headerRef = $state<HTMLDivElement | null>(null);
	let footerRef = $state<HTMLDivElement | null>(null);
	let gridRef = $state<HTMLDivElement | null>(null);

	const resolvedDir = $derived(dir ?? grid.dir);
	const rows = $derived(grid.rows);

	$effect(() => {
		grid.container = gridRef;
		grid.header = headerRef;
		grid.footer = footerRef;
	});

	// The viewport height the virtualizer windows against. jsdom reports 0 for every rect, which
	// simply makes the window `overscan`-sized — every row of a small fixture stays mounted.
	$effect(() => {
		const element = gridRef;
		if (!element) return;

		const measure = () => {
			grid.virtualizer.viewportHeight = element.clientHeight || height;
		};
		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	});

	$effect(() => {
		untrack(() => grid.applyAutoFocus());
	});

	$effect(() => () => grid.destroy());

	// A drag started on a cell must end wherever the pointer is released, including outside the
	// grid, so the release listener lives on the document.
	$effect(() => {
		const onPointerUp = () => grid.handleCellPointerUp();
		document.addEventListener("pointerup", onPointerUp);
		return () => document.removeEventListener("pointerup", onPointerUp);
	});

	/**
	 * Pressing outside the grid drops focus and the selection, the way clicking off a spreadsheet
	 * does. An open editor closes itself through its own dismissable layer; this is the outer layer,
	 * and it must not fire for presses that land in one of those floating layers — they are
	 * portalled out of the grid, so `contains()` alone would read them as outside.
	 */
	$effect(() => {
		const onPointerDown = (event: PointerEvent) => {
			// Right-clicks open the context menu, which must not clear what it is acting on.
			if (event.button === 2) return;

			const container = gridRef;
			if (!container || container.contains(event.target as Node)) return;

			if (getIsInPopover(event.target)) return;

			// A layer can render a wrapper the press actually lands on, so the target alone is not
			// conclusive: test the whole stack under the pointer too. jsdom has no `elementsFromPoint`,
			// and there the target is always the real element anyway.
			if (typeof document.elementsFromPoint === "function") {
				const stack = document.elementsFromPoint(event.clientX, event.clientY);
				if (stack.some((element) => getIsInPopover(element))) return;
			}

			grid.blurCell();
			if (grid.selection.size > 0) grid.clearSelection();
		};

		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	});
</script>

<div
	bind:this={ref}
	data-slot="data-grid-wrapper"
	dir={resolvedDir}
	class={cn("relative flex w-full flex-col", className)}
	{...restProps}
>
	{#if grid.search}
		<DataGridSearch search={grid.search} />
	{/if}
	<DataGridContextMenu {grid} />
	<DataGridPasteDialog {grid} />
	<div
		bind:this={gridRef}
		role="grid"
		aria-label="Data grid"
		aria-rowcount={grid.table.getHeaderGroups().length + rows.length + (grid.canAddRow ? 1 : 0)}
		aria-colcount={grid.columnIds.length}
		data-slot="data-grid"
		tabindex={0}
		class="relative grid overflow-auto rounded-md border select-none focus:outline-none"
		style={`${grid.columnSizeVars} max-height: ${height}px;`}
		onkeydown={(event) => grid.handleKeydown(event)}
		oncontextmenu={(event) => event.preventDefault()}
		onscroll={(event) => {
			grid.virtualizer.scrollTop = event.currentTarget.scrollTop;
		}}
		onfocusout={(event) => grid.handleFocusOut(event.relatedTarget)}
	>
		<div
			bind:this={headerRef}
			role="rowgroup"
			data-slot="data-grid-header"
			class="sticky top-0 z-10 grid border-b bg-background"
		>
			{#each grid.table.getHeaderGroups() as headerGroup, headerRowIndex (headerGroup.id)}
				<div
					role="row"
					aria-rowindex={headerRowIndex + 1}
					data-slot="data-grid-header-row"
					tabindex={-1}
					class="flex w-full"
				>
					{#each headerGroup.headers as header, colIndex (header.id)}
						{@const currentSort = grid.sorting.find((sort) => sort.id === header.column.id)}
						{@const borders = getColumnBorderVisibility({
							column: header.column,
							nextColumn: headerGroup.headers[colIndex + 1]?.column,
							isLastColumn: colIndex === headerGroup.headers.length - 1,
						})}
						<div
							role="columnheader"
							aria-colindex={colIndex + 1}
							aria-sort={currentSort?.desc === false
								? "ascending"
								: currentSort?.desc === true
									? "descending"
									: header.column.getCanSort()
										? "none"
										: undefined}
							data-slot="data-grid-header-cell"
							tabindex={-1}
							class={cn(
								"relative",
								stretchColumns && header.column.id !== "select" && "grow",
								borders.showEndBorder && header.column.id !== "select" && "border-e",
								borders.showStartBorder && header.column.id !== "select" && "border-s",
							)}
							style={`${getColumnPinningStyle({ column: header.column, dir: resolvedDir })} width: var(--header-${header.id}-size);`}
						>
							{#if !header.isPlaceholder}
								<DataGridColumnHeader {grid} {header} />
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
		<div
			role="rowgroup"
			data-slot="data-grid-body"
			class="relative grid"
			style={`height: ${grid.virtualizer.totalSize}px;`}
		>
			{#if rows.length === 0}
				{@render empty?.()}
			{:else}
				{#each grid.virtualizer.virtualItems as virtualItem (virtualItem.index)}
					{@const row = rows[virtualItem.index]}
					{#if row}
						{#if rowSnippet}
							{@render rowSnippet({ row, rowIndex: virtualItem.index, top: virtualItem.start })}
						{:else}
							<DataGridRow
								{grid}
								{row}
								rowIndex={virtualItem.index}
								top={virtualItem.start}
								{stretchColumns}
							/>
						{/if}
					{/if}
				{/each}
			{/if}
		</div>
		{#if grid.canAddRow && !grid.readOnly}
			<div
				bind:this={footerRef}
				role="rowgroup"
				data-slot="data-grid-footer"
				class="sticky bottom-0 z-10 grid border-t bg-background"
			>
				<div
					role="row"
					aria-rowindex={grid.table.getHeaderGroups().length + rows.length + 1}
					data-slot="data-grid-add-row"
					tabindex={-1}
					class="flex w-full"
				>
					<div
						role="gridcell"
						aria-label="Add row"
						tabindex={0}
						data-slot="data-grid-add-row-cell"
						class="relative flex h-9 grow items-center bg-muted/30 transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
						style={`width: ${grid.table.getTotalSize()}px; min-width: ${grid.table.getTotalSize()}px;`}
						onclick={(event) => void grid.addRow(event)}
						onkeydown={(event) => {
							if (event.key !== "Enter" && event.key !== " ") return;
							event.preventDefault();
							void grid.addRow();
						}}
					>
						<div class="sticky start-0 flex items-center gap-2 px-3 text-muted-foreground">
							<PlusIcon class="size-3.5" />
							<span class="text-sm">Add row</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	{@render children?.()}
</div>
