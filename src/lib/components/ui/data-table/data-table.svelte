<script lang="ts" module>
	import type { Column, RowData, Table as TanstackTable } from "@tanstack/table-core";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";

	export type DataTableRootProps<TData extends RowData> = WithElementRef<
		HTMLAttributes<HTMLDivElement>
	> & {
		/** The table instance, usually `createDataTable(...).table`. Also published to context. */
		table: TanstackTable<TData>;
		/**
		 * Rendered under the table, **only** while at least one filtered row is selected.
		 * The root never inspects its contents.
		 */
		actionBar?: Snippet;
		/** Rendered above the table — where `<DataTable.Toolbar>` goes. */
		children?: Snippet;
	};

	/** `data-pinned-edge` marks the last left-pinned / first right-pinned column. */
	function isPinnedEdge<TData extends RowData>(column: Column<TData, unknown>): boolean {
		const pinned = column.getIsPinned();
		return (
			(pinned === "left" && column.getIsLastColumn("left")) ||
			(pinned === "right" && column.getIsFirstColumn("right"))
		);
	}
</script>

<script lang="ts" generics="TData extends RowData">
	import * as Table from "$lib/components/ui/table/index.js";
	import { cn } from "$lib/utils.js";

	import DataTableFlexRender from "./data-table-flex-render.svelte";
	import DataTablePagination from "./data-table-pagination.svelte";
	import { getColumnPinningStyle } from "./data-table-utils.js";
	import { setDataTableContext } from "./data-table.svelte.js";

	let {
		ref = $bindable(null),
		table,
		actionBar,
		class: className,
		children,
		...restProps
	}: DataTableRootProps<TData> = $props();

	setDataTableContext<TData>({
		get table() {
			return table;
		},
	});
</script>

<div
	bind:this={ref}
	data-slot="data-table"
	class={cn("flex w-full flex-col gap-2.5 overflow-auto", className)}
	{...restProps}
>
	{@render children?.()}
	<div class="overflow-hidden rounded-md border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head
								colspan={header.colSpan}
								data-pinned={header.column.getIsPinned() || undefined}
								data-pinned-edge={isPinnedEdge(header.column) ? "" : undefined}
								style={getColumnPinningStyle({ column: header.column })}
							>
								{#if !header.isPlaceholder}
									<DataTableFlexRender
										template={header.column.columnDef.header}
										context={header.getContext()}
										fallback={header.column.id}
									/>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#if table.getRowModel().rows.length}
					{#each table.getRowModel().rows as row (row.id)}
						<Table.Row data-state={row.getIsSelected() ? "selected" : undefined}>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell
									data-pinned={cell.column.getIsPinned() || undefined}
									data-pinned-edge={isPinnedEdge(cell.column) ? "" : undefined}
									style={getColumnPinningStyle({ column: cell.column })}
								>
									<DataTableFlexRender
										template={cell.column.columnDef.cell}
										context={cell.getContext()}
										fallback={String(cell.renderValue() ?? "")}
									/>
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				{:else}
					<Table.Row>
						<Table.Cell colspan={table.getAllColumns().length} class="h-24 text-center">
							No results.
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
	<div class="flex flex-col gap-2.5">
		<DataTablePagination {table} />
		{#if actionBar && table.getFilteredSelectedRowModel().rows.length > 0}
			{@render actionBar()}
		{/if}
	</div>
</div>
