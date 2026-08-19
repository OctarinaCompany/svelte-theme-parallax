<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";

	export type DataTableSkeletonProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** How many placeholder columns to draw. */
		columnCount: number;
		/** @default 10 */
		rowCount?: number;
		/** How many placeholder toolbar filters to draw. @default 0 */
		filterCount?: number;
		/** Cycled across the columns. @default ['auto'] */
		cellWidths?: string[];
		/** Draw the "View" placeholder. @default true */
		withViewOptions?: boolean;
		/** Draw the pagination placeholders. @default true */
		withPagination?: boolean;
		/** Set `min-width` to the cell width instead of `auto`. @default false */
		shrinkZero?: boolean;
	};
</script>

<script lang="ts">
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { cn } from "$lib/utils.js";

	// Purely presentational: no live data, no interactive controls, no event handlers.
	let {
		ref = $bindable(null),
		columnCount,
		rowCount = 10,
		filterCount = 0,
		cellWidths = ["auto"],
		withViewOptions = true,
		withPagination = true,
		shrinkZero = false,
		class: className,
		...restProps
	}: DataTableSkeletonProps = $props();

	const cozyCellWidths = $derived(
		Array.from(
			{ length: columnCount },
			(_, index) => cellWidths[index % cellWidths.length] ?? "auto",
		),
	);

	function cellStyle(width: string): string {
		return `width: ${width}; min-width: ${shrinkZero ? width : "auto"};`;
	}
</script>

<div
	bind:this={ref}
	data-slot="data-table-skeleton"
	data-loading=""
	class={cn("flex w-full flex-col gap-2.5 overflow-auto", className)}
	{...restProps}
>
	<div class="flex w-full items-center justify-between gap-2 overflow-auto p-1">
		<div class="flex flex-1 items-center gap-2">
			{#each { length: filterCount } as _, index (index)}
				<Skeleton class="h-8 w-18 border-dashed" />
			{/each}
		</div>
		{#if withViewOptions}
			<Skeleton class="ml-auto hidden h-8 w-18 lg:flex" />
		{/if}
	</div>
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row class="hover:bg-transparent">
					{#each cozyCellWidths as width, index (index)}
						<Table.Head style={cellStyle(width)}>
							<Skeleton class="h-6 w-full" />
						</Table.Head>
					{/each}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each { length: rowCount } as _, rowIndex (rowIndex)}
					<Table.Row class="hover:bg-transparent">
						{#each cozyCellWidths as width, index (index)}
							<Table.Cell style={cellStyle(width)}>
								<Skeleton class="h-6 w-full" />
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	{#if withPagination}
		<div class="flex w-full items-center justify-between gap-4 overflow-auto p-1 sm:gap-8">
			<Skeleton class="h-8 w-40 shrink-0" />
			<div class="flex items-center gap-4 sm:gap-6 lg:gap-8">
				<div class="flex items-center gap-2">
					<Skeleton class="h-8 w-24" />
					<Skeleton class="h-8 w-18" />
				</div>
				<div class="flex items-center justify-center text-sm font-medium">
					<Skeleton class="h-8 w-20" />
				</div>
				<div class="flex items-center gap-2">
					<Skeleton class="hidden size-8 lg:block" />
					<Skeleton class="size-8" />
					<Skeleton class="size-8" />
					<Skeleton class="hidden size-8 lg:block" />
				</div>
			</div>
		</div>
	{/if}
</div>
