<script lang="ts" module>
	import type { RowData, Table } from "@tanstack/table-core";
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";

	export type DataTableToolbarProps<TData extends RowData> = WithElementRef<
		HTMLAttributes<HTMLDivElement>
	> & {
		/**
		 * The table to filter. Falls back to the instance published by `<DataTable.Root>`.
		 */
		table?: Table<TData>;
		/**
		 * Let the view menu's list be dragged to reorder columns. Forwarded to the
		 * `<DataTable.ViewOptions>` this toolbar already renders — passing a second one through
		 * `children` would show two identical triggers.
		 * @default false
		 */
		reorderable?: boolean;
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import XIcon from "@lucide/svelte/icons/x";

	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	import DataTableToolbarFilter from "./data-table-toolbar-filter.svelte";
	import DataTableViewOptions from "./data-table-view-options.svelte";
	import { useDataTableInstance } from "./data-table.svelte.js";

	let {
		ref = $bindable(null),
		table: tableProp,
		reorderable = false,
		class: className,
		children,
		...restProps
	}: DataTableToolbarProps<TData> = $props();

	const instance = useDataTableInstance(() => tableProp);
	const table = $derived(instance.current);

	const isFiltered = $derived(table.getState().columnFilters.length > 0);
	const columns = $derived(table.getAllColumns().filter((column) => column.getCanFilter()));
</script>

<div
	bind:this={ref}
	role="toolbar"
	aria-orientation="horizontal"
	data-slot="data-table-toolbar"
	data-filtered={isFiltered ? "" : undefined}
	class={cn("flex w-full items-start justify-between gap-2 p-1", className)}
	{...restProps}
>
	<div class="flex flex-1 flex-wrap items-center gap-2">
		{#each columns as column (column.id)}
			<DataTableToolbarFilter {column} />
		{/each}
		{#if isFiltered}
			<Button
				aria-label="Reset filters"
				variant="outline"
				size="sm"
				class="border-dashed"
				onclick={() => table.resetColumnFilters()}
			>
				<XIcon />
				Reset
			</Button>
		{/if}
	</div>
	<div class="flex items-center gap-2">
		{@render children?.()}
		<DataTableViewOptions {table} {reorderable} align="end" />
	</div>
</div>
