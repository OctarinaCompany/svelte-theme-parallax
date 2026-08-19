<script lang="ts" module>
	import type { Header, RowData } from "@tanstack/table-core";
	import type { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

	import type { DataGridState } from "./data-grid.svelte.js";

	export type DataGridColumnHeaderProps<TData extends RowData> = Omit<
		DropdownMenuPrimitive.TriggerProps,
		"child" | "children"
	> & {
		/** The grid state. Defaults to the one `<DataGrid.Root>` published. */
		grid?: DataGridState<TData>;
		/** The header this component renders. */
		header: Header<TData, unknown>;
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
	import EyeOffIcon from "@lucide/svelte/icons/eye-off";
	import PinIcon from "@lucide/svelte/icons/pin";
	import PinOffIcon from "@lucide/svelte/icons/pin-off";
	import XIcon from "@lucide/svelte/icons/x";

	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { cn } from "$lib/utils.js";

	import DataGridColumnResizer from "./data-grid-column-resizer.svelte";
	import { getColumnVariant } from "./data-grid-utils.js";
	import { useDataGridContext } from "./data-grid.svelte.js";

	let {
		ref = $bindable(null),
		grid: gridProp,
		header,
		class: className,
		...restProps
	}: DataGridColumnHeaderProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.ColumnHeader>");
	const grid = $derived(gridProp ?? contextGrid!);

	const column = $derived(header.column);
	const label = $derived(
		column.columnDef.meta?.label ??
			(typeof column.columnDef.header === "string" ? column.columnDef.header : column.id),
	);
	const columnVariant = $derived(getColumnVariant(column.columnDef.meta?.cell?.variant));
	const sorted = $derived(column.getIsSorted());
	const pinned = $derived(column.getIsPinned());
	const isResizingAny = $derived(Boolean(grid.table.getState().columnSizingInfo.isResizingColumn));

	// Upstream drives sorting through `table.setSorting` so the resolved value reaches
	// `onSortingChange`; writing `grid.sorting` directly would bypass the callback.
	function sortBy(desc: boolean): void {
		grid.table.setSorting((previous) => {
			const next = [...previous];
			const index = next.findIndex((entry) => entry.id === column.id);
			if (index >= 0) next[index] = { id: column.id, desc };
			else next.push({ id: column.id, desc });
			return next;
		});
	}

	function removeSort(): void {
		grid.table.setSorting((previous) => previous.filter((entry) => entry.id !== column.id));
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		bind:ref
		data-slot="data-grid-column-header"
		class={cn(
			"flex size-full items-center justify-between gap-2 p-2 text-sm hover:bg-accent/40 data-[state=open]:bg-accent/40 [&_svg]:size-4",
			isResizingAny && "pointer-events-none",
			className,
		)}
		onpointerdown={(event) => {
			if (event.button !== 0) return;
			grid.selectColumn(column.id);
		}}
		{...restProps}
	>
		<div class="flex min-w-0 flex-1 items-center gap-1.5">
			{#if columnVariant}
				{@const VariantIcon = columnVariant.icon}
				<!--
					The trigger renders onto a `<span>` through the `child` snippet: the whole header
					is already a `<DropdownMenu.Trigger>` button, and bits-ui's default trigger
					element would nest a button inside it.
				-->
				<Tooltip.Provider delayDuration={100}>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<span {...props} class="inline-flex" aria-label={columnVariant.label}>
									<VariantIcon class="size-3.5 shrink-0 text-muted-foreground" />
								</span>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="top">{columnVariant.label}</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			{/if}
			<span class="truncate">{label}</span>
		</div>
		<ChevronDownIcon class="shrink-0 text-muted-foreground" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start" sideOffset={0} class="w-60">
		{#if column.getCanSort()}
			<DropdownMenu.CheckboxItem
				class="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
				bind:checked={
					() => sorted === "asc",
					(next) => {
						if (next) sortBy(false);
					}
				}
			>
				<ChevronUpIcon />
				Sort asc
			</DropdownMenu.CheckboxItem>
			<DropdownMenu.CheckboxItem
				class="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
				bind:checked={
					() => sorted === "desc",
					(next) => {
						if (next) sortBy(true);
					}
				}
			>
				<ChevronDownIcon />
				Sort desc
			</DropdownMenu.CheckboxItem>
			{#if sorted}
				<DropdownMenu.Item onSelect={removeSort}>
					<XIcon />
					Remove sort
				</DropdownMenu.Item>
			{/if}
		{/if}
		{#if column.getCanPin()}
			{#if column.getCanSort()}
				<DropdownMenu.Separator />
			{/if}
			{#if pinned === "left"}
				<DropdownMenu.Item class="[&_svg]:text-muted-foreground" onSelect={() => column.pin(false)}>
					<PinOffIcon />
					Unpin from left
				</DropdownMenu.Item>
			{:else}
				<DropdownMenu.Item
					class="[&_svg]:text-muted-foreground"
					onSelect={() => column.pin("left")}
				>
					<PinIcon />
					Pin to left
				</DropdownMenu.Item>
			{/if}
			{#if pinned === "right"}
				<DropdownMenu.Item class="[&_svg]:text-muted-foreground" onSelect={() => column.pin(false)}>
					<PinOffIcon />
					Unpin from right
				</DropdownMenu.Item>
			{:else}
				<DropdownMenu.Item
					class="[&_svg]:text-muted-foreground"
					onSelect={() => column.pin("right")}
				>
					<PinIcon />
					Pin to right
				</DropdownMenu.Item>
			{/if}
		{/if}
		{#if column.getCanHide()}
			<DropdownMenu.Separator />
			<DropdownMenu.Item
				class="[&_svg]:text-muted-foreground"
				onSelect={() => column.toggleVisibility(false)}
			>
				<EyeOffIcon />
				Hide column
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
{#if column.getCanResize()}
	<DataGridColumnResizer {grid} {header} {label} />
{/if}
