<script lang="ts" module>
	/** One line of an order, as the sub-table demo shapes it (demo 9). */
	export type DataGridOrderItem = {
		id: string;
		productName: string;
		category: string;
		price: string;
		quantity: number;
	};
</script>

<script lang="ts">
	import type { HeaderContext } from "@tanstack/table-core";

	import * as DataTable from "$lib/components/ui/data-table/index.js";
	import { createDataTable, type DataTableColumnDef } from "$lib/components/ui/data-table/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The nested order-lines table of the "Data grid with sub table" demo (demo 9).
	 *
	 * A component rather than one more snippet on the page, because every expanded order needs a
	 * table state of its own: sorting or paging the lines of one order must leave every other
	 * order's lines where they were, and a page-level `createDataTable` would be shared by all of
	 * them.
	 */
	let { items }: { items: DataGridOrderItem[] } = $props();

	const columns: DataTableColumnDef<DataGridOrderItem>[] = [
		{
			id: "productName",
			accessorKey: "productName",
			header: sortableHeader,
			meta: { label: "Product" },
			size: 200,
		},
		{
			id: "category",
			accessorKey: "category",
			header: sortableHeader,
			meta: { label: "Category" },
			size: 120,
		},
		{
			id: "price",
			accessorKey: "price",
			header: sortableHeader,
			meta: { label: "Price" },
			size: 100,
		},
		{
			id: "quantity",
			accessorKey: "quantity",
			header: sortableHeader,
			meta: { label: "Qty" },
			size: 80,
		},
	];

	const grid = createDataTable<DataGridOrderItem>({
		data: () => items,
		columns: () => columns,
		getRowId: (row) => row.id,
		// Upstream's sub-table pages five lines at a time, and no line is selectable — the outer
		// grid owns selection, if a consumer turns it on.
		enableRowSelection: false,
		initialState: { pagination: { pageSize: 5 } },
	});
</script>

<!-- One snippet for all four headers: the label comes from the column's `meta.label`. -->
{#snippet sortableHeader(ctx: HeaderContext<DataGridOrderItem, unknown>)}
	<DataTable.ColumnHeader column={ctx.column} label={ctx.column.columnDef.meta?.label ?? ""} />
{/snippet}

<div class="flex flex-col gap-2.5 py-3 ps-8">
	<div class="overflow-hidden rounded-md border">
		<Table.Root class="table-fixed" style="width: {grid.table.getTotalSize()}px; min-width: 100%;">
			<Table.Header>
				{#each grid.headerGroups as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head colspan={header.colSpan} style="width: {header.getSize()}px;">
								{#if !header.isPlaceholder}
									<DataTable.FlexRender
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
				{#each grid.rows as row (row.id)}
					<Table.Row>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell>
								<DataTable.FlexRender
									template={cell.column.columnDef.cell}
									context={cell.getContext()}
									fallback={String(cell.renderValue() ?? "")}
								/>
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<DataTable.Pagination table={grid.table} pageSizeOptions={[5, 10]} />
</div>
