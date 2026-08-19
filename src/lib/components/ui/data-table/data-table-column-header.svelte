<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";
	import type { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

	export type DataTableColumnHeaderProps<TData extends RowData, TValue> = Omit<
		DropdownMenuPrimitive.TriggerProps,
		"child" | "children"
	> & {
		/** The column this header belongs to. */
		column: Column<TData, TValue>;
		/**
		 * The header text. Upstream's type file calls this prop `title`; the component and its only
		 * call-site call it `label`, which wins.
		 */
		label: string;
	};
</script>

<script lang="ts" generics="TData extends RowData, TValue">
	import type { Column } from "@tanstack/table-core";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
	import EyeOffIcon from "@lucide/svelte/icons/eye-off";
	import XIcon from "@lucide/svelte/icons/x";

	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		column,
		label,
		class: className,
		...restProps
	}: DataTableColumnHeaderProps<TData, TValue> = $props();

	const sorted = $derived(column.getIsSorted());
	const canSort = $derived(column.getCanSort());
	const canHide = $derived(column.getCanHide());
</script>

{#if !canSort && !canHide}
	<!--
		Neither sortable nor hideable: plain text, no menu, no indicator.
		`restProps` is typed for the trigger `<button>` and is deliberately not spread here — that
		matches upstream, which renders `<div className={cn(className)}>{label}</div>`.
	-->
	<div bind:this={ref} data-slot="data-table-column-header" class={cn(className)}>
		{label}
	</div>
{:else}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			bind:ref
			data-slot="data-table-column-header"
			data-sorted={sorted || undefined}
			class={cn(
				"-ml-1.5 flex h-8 items-center gap-1.5 rounded-md border border-transparent px-2 py-1.5 outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
				className,
			)}
			{...restProps}
		>
			{label}
			{#if canSort}
				{#if sorted === "desc"}
					<ChevronDownIcon />
				{:else if sorted === "asc"}
					<ChevronUpIcon />
				{:else}
					<ChevronsUpDownIcon />
				{/if}
			{/if}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-28">
			{#if canSort}
				<!--
					Upstream drives these from `onClick` and passes `checked` one-way. Here each item
					binds `checked` to a getter/setter pair so `aria-checked` always reflects
					`column.getIsSorted()` — including when the click is a no-op (re-selecting the
					active order), where a one-way prop would leave the primitive's internal state
					flipped.
				-->
				<DropdownMenu.CheckboxItem
					class="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
					bind:checked={
						() => sorted === "asc",
						(next) => {
							if (next) column.toggleSorting(false);
						}
					}
				>
					<ChevronUpIcon />
					Asc
				</DropdownMenu.CheckboxItem>
				<DropdownMenu.CheckboxItem
					class="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
					bind:checked={
						() => sorted === "desc",
						(next) => {
							if (next) column.toggleSorting(true);
						}
					}
				>
					<ChevronDownIcon />
					Desc
				</DropdownMenu.CheckboxItem>
				{#if sorted}
					<DropdownMenu.Item
						class="pl-2 [&_svg]:text-muted-foreground"
						onSelect={() => column.clearSorting()}
					>
						<XIcon />
						Reset
					</DropdownMenu.Item>
				{/if}
			{/if}
			{#if canHide}
				<DropdownMenu.CheckboxItem
					class="relative pr-8 pl-2 [&_svg]:text-muted-foreground [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
					bind:checked={
						() => !column.getIsVisible(),
						(next) => {
							if (next) column.toggleVisibility(false);
						}
					}
				>
					<EyeOffIcon />
					Hide
				</DropdownMenu.CheckboxItem>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
