<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridCellVariantProps } from "./data-grid-cell-wrapper.svelte";

	export type DataGridMultiSelectCellProps<TData extends RowData> = DataGridCellVariantProps<TData>;
</script>

<script lang="ts" generics="TData extends RowData">
	import CheckIcon from "@lucide/svelte/icons/check";

	import { Badge } from "$lib/components/ui/badge/index.js";
	import { BadgeOverflow } from "$lib/components/ui/badge-overflow/index.js";
	import * as Command from "$lib/components/ui/command/index.js";
	import { cn } from "$lib/utils.js";

	import DataGridCellEditor from "./data-grid-cell-editor.svelte";
	import DataGridCellWrapper from "./data-grid-cell-wrapper.svelte";
	import { getLineCount } from "./data-grid-utils.js";
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
	}: DataGridMultiSelectCellProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.Cell>");
	const grid = $derived(gridProp ?? contextGrid!);

	let cellRef = $state<HTMLDivElement | null>(null);

	const cellOpts = $derived(cell.column.columnDef.meta?.cell);
	const options = $derived(cellOpts?.variant === "multi-select" ? cellOpts.options : []);
	const values = $derived((cell.getValue() as string[] | null | undefined) ?? []);
	const selectedSet = $derived(new Set(values));
	const labels = $derived(
		values.map((value) => options.find((option) => option.value === value)?.label ?? value),
	);

	function write(next: string[]): void {
		if (readOnly) return;
		grid.updateData({ rowIndex, columnId, value: next });
	}

	function toggle(optionValue: string): void {
		write(
			selectedSet.has(optionValue)
				? values.filter((value) => value !== optionValue)
				: [...values, optionValue],
		);
	}

	// Escape and outside presses are the editor layer's job — its listeners are on the document, so
	// they fire wherever focus sits. Every toggle is written the moment it is clicked, so like
	// upstream neither dismissal path rolls anything back.
	//
	// Tab on a resting cell is plain navigation: the grid's own handler owns it, so it must bubble.
</script>

<DataGridCellWrapper
	bind:ref={cellRef}
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
	data-slot="data-grid-multi-select-cell"
>
	{#if labels.length > 0}
		<BadgeOverflow
			data-slot="data-grid-cell-content"
			items={labels}
			lineCount={getLineCount(rowHeight)}
		>
			{#snippet badge(_item: string, label: string)}
				<Badge variant="secondary" class="px-1.5 py-px">{label}</Badge>
			{/snippet}
		</BadgeOverflow>
	{/if}
	{#if isEditing}
		<DataGridCellEditor
			open={isEditing}
			anchor={cellRef}
			onDismiss={() => grid.stopEditing()}
			class="w-[260px]"
		>
			<Command.Root>
				<Command.Input placeholder="Search..." aria-label="Search options" />
				<Command.List>
					<Command.Empty>No options found.</Command.Empty>
					<Command.Group>
						{#each options as option (option.value)}
							<Command.Item value={option.label} onSelect={() => toggle(option.value)}>
								<div
									class={cn(
										"flex size-4 items-center justify-center rounded-sm border border-primary",
										selectedSet.has(option.value)
											? "bg-primary text-primary-foreground"
											: "opacity-50 [&_svg]:invisible",
									)}
								>
									<CheckIcon class="size-3" />
								</div>
								<span>{option.label}</span>
							</Command.Item>
						{/each}
					</Command.Group>
					{#if values.length > 0}
						<Command.Separator />
						<Command.Group>
							<!-- `ml-auto` on `Command.Item`'s own indicator would eat the free space this row
								centres in, so it is hidden rather than left transparent. -->
							<Command.Item
								class="justify-center text-muted-foreground [&_.cn-command-item-indicator]:hidden"
								onSelect={() => write([])}
							>
								Clear all
							</Command.Item>
						</Command.Group>
					{/if}
				</Command.List>
			</Command.Root>
		</DataGridCellEditor>
	{/if}
</DataGridCellWrapper>
