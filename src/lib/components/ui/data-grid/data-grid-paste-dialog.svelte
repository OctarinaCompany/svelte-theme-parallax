<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridState } from "./data-grid.svelte.js";

	export type DataGridPasteDialogProps<TData extends RowData> = {
		/** The grid state. Defaults to the one `<DataGrid.Root>` published. */
		grid?: DataGridState<TData>;
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as RadioGroup from "$lib/components/ui/radio-group/index.js";

	import { useDataGridContext } from "./data-grid.svelte.js";

	let { grid: gridProp }: DataGridPasteDialogProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.PasteDialog>");
	const grid = $derived(gridProp ?? contextGrid!);

	const dialog = $derived(grid.clipboard.pasteDialog);
	const plural = $derived(dialog.rowsNeeded !== 1 ? "s" : "");

	/** `expand` creates the missing rows; `no-expand` pastes only what fits. */
	let choice = $state("expand");
</script>

{#if dialog.open}
	<Dialog.Root open={dialog.open} onOpenChange={(open) => grid.clipboard.setPasteDialogOpen(open)}>
		<Dialog.Content data-grid-popover="" data-slot="data-grid-paste-dialog">
			<Dialog.Header>
				<Dialog.Title>Do you want to add more rows?</Dialog.Title>
				<Dialog.Description>
					We need <strong>{dialog.rowsNeeded}</strong> additional row{plural} to paste everything from
					your clipboard.
				</Dialog.Description>
			</Dialog.Header>
			<RadioGroup.Root bind:value={choice} class="flex flex-col gap-3 py-1">
				<div class="flex items-start gap-3">
					<RadioGroup.Item value="expand" id="data-grid-paste-expand" />
					<div class="flex flex-col gap-1">
						<Label for="data-grid-paste-expand" class="text-sm leading-none font-medium">
							Create new rows
						</Label>
						<span class="text-sm text-muted-foreground">
							Add {dialog.rowsNeeded} new row{plural} to the table and paste all data
						</span>
					</div>
				</div>
				<div class="flex items-start gap-3">
					<RadioGroup.Item value="no-expand" id="data-grid-paste-no-expand" />
					<div class="flex flex-col gap-1">
						<Label for="data-grid-paste-no-expand" class="text-sm leading-none font-medium">
							Keep current rows
						</Label>
						<span class="text-sm text-muted-foreground">
							Paste only what fits in the existing rows
						</span>
					</div>
				</div>
			</RadioGroup.Root>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => grid.clipboard.setPasteDialogOpen(false)}>
					Cancel
				</Button>
				<Button onclick={() => void grid.clipboard.paste(choice === "expand")}>Continue</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
