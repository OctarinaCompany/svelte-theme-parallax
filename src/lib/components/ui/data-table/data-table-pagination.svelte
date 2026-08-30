<script lang="ts" module>
	import type { RowData, Table } from "@tanstack/table-core";
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";

	export type DataTablePaginationProps<TData extends RowData> = WithElementRef<
		HTMLAttributes<HTMLDivElement>
	> & {
		/**
		 * The table to page. Falls back to the instance published by `<DataTable.Root>`.
		 */
		table?: Table<TData>;
		/** @default [10, 20, 30, 40, 50] */
		pageSizeOptions?: number[];
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import ChevronsLeftIcon from "@lucide/svelte/icons/chevrons-left";
	import ChevronsRightIcon from "@lucide/svelte/icons/chevrons-right";

	import { Button } from "$lib/components/ui/button/index.js";
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { cn } from "$lib/utils.js";

	import { useDataTableInstance } from "./data-table.svelte.js";

	let {
		ref = $bindable(null),
		table: tableProp,
		pageSizeOptions = [10, 20, 30, 40, 50],
		class: className,
		...restProps
	}: DataTablePaginationProps<TData> = $props();

	const instance = useDataTableInstance(() => tableProp);
	const table = $derived(instance.current);

	// Upstream hard-codes LTR chevrons. Mirroring them is the only RTL-sensitive part of this
	// component: labels, DOM order and disabled logic never change.
	const direction = useDirection({ element: () => ref });
	const isRtl = $derived(direction.current === "rtl");

	const pageSize = $derived(table.getState().pagination.pageSize);
</script>

<!--
	`overflow-x-auto overflow-y-hidden` rather than upstream's `overflow-auto`, and the axes are
	split on purpose. The house `Button` nudges itself down on press
	(`active:not-aria-[haspopup]:translate-y-px`), and a transform counts towards its ancestor's
	SCROLLABLE overflow — so a scroll container that ends exactly at the button's own height grows
	a vertical scrollbar for as long as the mouse is held down, then loses it. `p-1` hides that
	here (4px absorbs 1px), which is why it is invisible on the Data table page and plain on the
	Tables in cards page, whose cards pass `p-0` to run the pager flush to the card's edges. The
	horizontal axis keeps `auto`, which is what the rule is for: the bar really does scroll
	sideways when the row count, the page-size select and the four arrows outgrow a narrow card.
-->
<div
	bind:this={ref}
	data-slot="data-table-pagination"
	data-dir={direction.current}
	class={cn(
		"flex w-full flex-col-reverse items-center justify-between gap-4 overflow-x-auto overflow-y-hidden p-1 sm:flex-row sm:gap-8",
		className,
	)}
	{...restProps}
>
	<div class="flex-1 text-sm whitespace-nowrap text-muted-foreground">
		{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
		selected.
	</div>
	<div class="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
		<div class="flex items-center gap-2">
			<p class="text-sm font-medium whitespace-nowrap">Rows per page</p>
			<Select.Root
				type="single"
				value={`${pageSize}`}
				onValueChange={(value) => table.setPageSize(Number(value))}
			>
				<Select.Trigger size="sm" class="w-18" aria-label="Rows per page">
					{pageSize}
				</Select.Trigger>
				<Select.Content side="top">
					<Select.Group>
						{#each pageSizeOptions as option (option)}
							<Select.Item value={`${option}`} label={`${option}`} />
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</div>
		<div class="flex items-center justify-center text-sm font-medium">
			Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
		</div>
		<div class="flex items-center gap-2">
			<Button
				aria-label="Go to first page"
				variant="outline"
				size="icon-sm"
				class="hidden lg:flex"
				onclick={() => table.setPageIndex(0)}
				disabled={!table.getCanPreviousPage()}
			>
				{#if isRtl}
					<ChevronsRightIcon />
				{:else}
					<ChevronsLeftIcon />
				{/if}
			</Button>
			<Button
				aria-label="Go to previous page"
				variant="outline"
				size="icon-sm"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				{#if isRtl}
					<ChevronRightIcon />
				{:else}
					<ChevronLeftIcon />
				{/if}
			</Button>
			<Button
				aria-label="Go to next page"
				variant="outline"
				size="icon-sm"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				{#if isRtl}
					<ChevronLeftIcon />
				{:else}
					<ChevronRightIcon />
				{/if}
			</Button>
			<Button
				aria-label="Go to last page"
				variant="outline"
				size="icon-sm"
				class="hidden lg:flex"
				onclick={() => table.setPageIndex(table.getPageCount() - 1)}
				disabled={!table.getCanNextPage()}
			>
				{#if isRtl}
					<ChevronsLeftIcon />
				{:else}
					<ChevronsRightIcon />
				{/if}
			</Button>
		</div>
	</div>
</div>
