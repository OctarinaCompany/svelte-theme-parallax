<script lang="ts" generics="TData extends RowData">
	import type { RowData } from "@tanstack/table-core";
	import * as DataTable from "$lib/components/ui/data-table/index.js";
	import type { DataTableState } from "$lib/components/ui/data-table/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The table half of every card on the Tables in cards page — the classic theme's `.card-table`
	 *: the table runs flush between the card header's rule and the card footer,
	 * and the first and last cell of every row take the card's own 1.5rem padding so the columns
	 * line up with the header's title and controls. The `!` is against `app.css`'s unlayered
	 * 1rem cell-padding port, which outweighs any call-site utility (TablePage's script states
	 * the same rule); it also deliberately reaches the checkbox column that rule excludes,
	 * because the classic theme's `.card-table` pads the edge cell whatever it holds.
	 *
	 * The last row's border is RESTORED (`[&_tbody_tr:last-child]:border-b`, which out-weighs
	 * `table-body.svelte`'s `[&_tr:last-child]:border-0` stripper): in the reference the rule
	 * between the table and the footer is the `.card-footer`'s own border-top, and with the
	 * house `Card.Footer` carrying no border by default, the row supplies that line instead —
	 * `table-border-color` and `card-border-color` are the same gray, so the two readings
	 * are identical.
	 *
	 * A helper file rather than a page snippet because the page instantiates it for three row
	 * shapes and snippets cannot be generic. The render loop is the one `data-table.svelte` and
	 * DataGridPage's `gridTable` already use: `FlexRender` per header and cell, and a
	 * "No results." row when the current filters leave nothing.
	 */
	let {
		grid,
		density = "default",
		class: className,
	}: {
		grid: DataTableState<TData>;
		/** Forwarded to `Table.Root` — the card keeps its chrome, only the rows retune. */
		density?: "sm" | "default" | "lg";
		class?: string;
	} = $props();
</script>

<Table.Root
	{density}
	class={cn(
		"[&_td:first-child]:ps-6! [&_td:last-child]:pe-6! [&_th:first-child]:ps-6! [&_th:last-child]:pe-6!",
		"[&_tbody_tr:last-child]:border-b",
		className,
	)}
>
	<Table.Header>
		{#each grid.headerGroups as headerGroup (headerGroup.id)}
			<Table.Row>
				{#each headerGroup.headers as header (header.id)}
					<Table.Head colspan={header.colSpan}>
						{#if !header.isPlaceholder}
							<DataTable.FlexRender
								template={header.column.columnDef.header}
								context={header.getContext()}
								fallback={header.column.columnDef.meta?.label ?? header.column.id}
							/>
						{/if}
					</Table.Head>
				{/each}
			</Table.Row>
		{/each}
	</Table.Header>
	<Table.Body>
		{#if grid.rows.length}
			{#each grid.rows as row (row.id)}
				<Table.Row data-state={row.getIsSelected() ? "selected" : undefined}>
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
		{:else}
			<Table.Row>
				<Table.Cell colspan={grid.table.getAllColumns().length} class="h-24 text-center">
					No results.
				</Table.Cell>
			</Table.Row>
		{/if}
	</Table.Body>
</Table.Root>
