<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridState } from "./data-grid.svelte.js";

	export type DataGridContextMenuProps<TData extends RowData> = {
		/** The grid state. Defaults to the one `<DataGrid.Root>` published. */
		grid?: DataGridState<TData>;
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import CopyIcon from "@lucide/svelte/icons/copy";
	import EraserIcon from "@lucide/svelte/icons/eraser";
	import ScissorsIcon from "@lucide/svelte/icons/scissors";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import { toast } from "svelte-sonner";

	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	import { useDataGridContext } from "./data-grid.svelte.js";

	let { grid: gridProp }: DataGridContextMenuProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.ContextMenu>");
	const grid = $derived(gridProp ?? contextGrid!);

	const menu = $derived(grid.contextMenu);

	function clearCells(): void {
		const cellKeys = grid.getTargetCellKeys();
		if (cellKeys.length === 0) return;
		grid.clearCells(cellKeys);
		toast.success(`${cellKeys.length} cell${cellKeys.length !== 1 ? "s" : ""} cleared`);
	}

	async function deleteRows(): Promise<void> {
		const rowIndices = grid.getRowIndicesToDelete();
		if (rowIndices.length === 0) return;
		await grid.deleteRows(rowIndices);
		toast.success(`${rowIndices.length} row${rowIndices.length !== 1 ? "s" : ""} deleted`);
	}
</script>

{#if menu.open}
	<DropdownMenu.Root open={menu.open} onOpenChange={(open) => grid.setContextMenuOpen(open)}>
		<!--
			The menu is anchored at the stored viewport point through a 1×1 invisible fixed trigger,
			exactly as upstream does — there is no element at the click position to anchor to.
		-->
		<DropdownMenu.Trigger
			aria-label="Cell actions"
			data-slot="data-grid-context-menu-trigger"
			style={`position: fixed; left: ${menu.x}px; top: ${menu.y}px; width: 1px; height: 1px; padding: 0; margin: 0; border: none; background: transparent; pointer-events: none; opacity: 0;`}
		></DropdownMenu.Trigger>
		<DropdownMenu.Content
			data-grid-popover=""
			data-slot="data-grid-context-menu"
			align="start"
			class="w-48"
			onCloseAutoFocus={(event) => {
				event.preventDefault();
				grid.restoreFocus();
			}}
		>
			<DropdownMenu.Item onSelect={() => void grid.clipboard.copy()}>
				<CopyIcon />
				Copy
			</DropdownMenu.Item>
			<DropdownMenu.Item disabled={grid.readOnly} onSelect={() => void grid.clipboard.cut()}>
				<ScissorsIcon />
				Cut
			</DropdownMenu.Item>
			<DropdownMenu.Item disabled={grid.readOnly} onSelect={clearCells}>
				<EraserIcon />
				Clear
			</DropdownMenu.Item>
			{#if grid.canDeleteRows}
				<DropdownMenu.Separator />
				<DropdownMenu.Item
					variant="destructive"
					disabled={grid.readOnly}
					onSelect={() => void deleteRows()}
				>
					<Trash2Icon />
					Delete rows
				</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
