<script lang="ts" module>
	import type { Column, RowData } from "@tanstack/table-core";

	import type { DataTableFilterAttributes, Option } from "./types.js";

	export type DataTableFacetedFilterProps<
		TData extends RowData,
		TValue,
	> = DataTableFilterAttributes & {
		/** The column being filtered. Without it the control renders but does nothing. */
		column?: Column<TData, TValue>;
		/** Trigger label, and the placeholder of the search input. */
		title?: string;
		/** The selectable values. */
		options: Option[];
		/**
		 * Allow more than one value. Single mode replaces the filter and closes the popover.
		 * @default false
		 */
		multiple?: boolean;
		/**
		 * Whether the popover is open. Bindable.
		 * @default false
		 */
		open?: boolean;
		/** Called whenever the popover opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/** The trigger element. Every other attribute is spread onto it too. */
		ref?: HTMLElement | null;
	};
</script>

<script lang="ts" generics="TData extends RowData, TValue">
	import CheckIcon from "@lucide/svelte/icons/check";
	import PlusCircleIcon from "@lucide/svelte/icons/plus-circle";
	import XCircleIcon from "@lucide/svelte/icons/x-circle";

	import { Badge } from "$lib/components/ui/badge/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import * as Command from "$lib/components/ui/command/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		column,
		title,
		options,
		multiple = false,
		open = $bindable(false),
		onOpenChange,
		class: className,
		...restProps
	}: DataTableFacetedFilterProps<TData, TValue> = $props();

	const columnFilterValue = $derived(column?.getFilterValue());
	// Upstream keeps the selection in a `Set`; a plain array carries the same insertion order —
	// removal preserves it, a new value is appended — without a mutable built-in collection.
	const selectedValues = $derived(
		Array.isArray(columnFilterValue) ? columnFilterValue.map((value) => String(value)) : [],
	);
	const selectedOptions = $derived(
		options.filter((option) => selectedValues.includes(option.value)),
	);

	function onItemSelect(option: Option, isSelected: boolean) {
		if (!column) return;

		if (multiple) {
			const filterValues = isSelected
				? selectedValues.filter((value) => value !== option.value)
				: [...selectedValues, option.value];
			column.setFilterValue(filterValues.length ? filterValues : undefined);
		} else {
			column.setFilterValue(isSelected ? undefined : [option.value]);
			open = false;
		}
	}

	function onReset() {
		column?.setFilterValue(undefined);
	}
</script>

<!--
	The wrapper wears the whole pill's chrome (the outline button variant, dashed) at all times:
	both halves inside it paint transparent, so background, border, hover and open-state highlights
	are one uniform surface — upstream's single `<button>` — even though the clear affordance stays
	a sibling element. The chrome is unconditional on purpose: were it added only while a value is
	selected, the variant base's `transition-all` would tween the wrapper's background and border up
	from transparent on first selection — a visible flicker. For the same reason the trigger swaps
	`transition-all` for `transition-colors`, so its start padding (10px resting → 6px selected)
	snaps instead of sliding the title. `has-data-[state=open]:` mirrors the variant's
	`aria-expanded:` highlight, which bits-ui only ever sets on the trigger half, and
	`active:…translate-y-0` cancels the press nudge the wrapper `<div>` would otherwise add on top
	of its children's own. Consumers overriding background or border via `class` now target a
	transparent trigger — such overrides belong on upstream's single button, which this wrapper
	plays.
-->
<div
	class={cn(
		buttonVariants({ variant: "outline", size: "sm" }),
		"gap-0 border-dashed p-0 font-normal active:not-aria-[haspopup]:translate-y-0 has-data-[state=open]:bg-muted has-data-[state=open]:text-foreground",
	)}
>
	{#if selectedValues.length > 0}
		<!--
			Upstream nests this affordance inside the trigger `<button>` as a
			`div role="button" tabIndex={0}` with a click handler only — it is not keyboard-operable
			and nests interactive content inside a button. Here it stays a real sibling `<button>`,
			rendered as the leading half of the wrapper's pill while remaining focusable and operable
			from the keyboard. The `hover:`/`dark:` transparents add no colour of their own — they
			only cancel the outline variant's per-element state layers so the wrapper alone paints,
			and only the icon dims, exactly like upstream. `ps-2.5` puts the X exactly where the
			resting plus icon sits (upstream swaps them in place), and `active:…translate-y-0` keeps
			the half from nudging on press — upstream's X never moves.
		-->
		<button
			type="button"
			aria-label={`Clear ${title} filter`}
			class={cn(
				buttonVariants({ variant: "outline", size: "sm" }),
				"rounded-s-[inherit] rounded-e-none border-0 bg-transparent px-0 ps-2.5 pe-1.5 text-muted-foreground hover:bg-transparent active:not-aria-[haspopup]:translate-y-0 dark:bg-transparent dark:hover:bg-transparent [&_svg]:size-3.5 [&_svg]:opacity-70 [&_svg]:transition-opacity hover:[&_svg]:opacity-100",
			)}
			onclick={onReset}
		>
			<XCircleIcon />
		</button>
		<!--
			Upstream draws no rule here — inside its single button only the 4px gap separates the
			clear icon from the title. Ours marks where the keyboard-operable clear half ends, in the
			label↔badges separator's look *and spacing*: that rule breathes `gap-1` + `mx-0.5` = 6px
			on each side, so the clear's `pe-1.5` and the trigger's `ps-1.5` give this one the same
			6px flanks. Symmetry costs the title a one-off 9px step when the clear half mounts.
		-->
		<Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />
	{/if}
	<Popover.Root bind:open {onOpenChange}>
		<Popover.Trigger
			bind:ref
			data-slot="data-table-faceted-filter"
			data-multiple={multiple ? "" : undefined}
			data-selected={selectedValues.length > 0 ? "" : undefined}
			class={cn(
				buttonVariants({ variant: "outline", size: "sm" }),
				"border-0 bg-transparent font-normal transition-colors hover:bg-transparent aria-expanded:bg-transparent dark:bg-transparent dark:hover:bg-transparent",
				selectedValues.length > 0 && "rounded-s-none rounded-e-[inherit] ps-1.5",
				className,
			)}
			{...restProps}
		>
			{#if selectedValues.length === 0}
				<PlusCircleIcon />
			{/if}
			{title}
			{#if selectedValues.length > 0}
				<Separator orientation="vertical" class="mx-0.5 data-[orientation=vertical]:h-4" />
				<Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
					{selectedValues.length}
				</Badge>
				<span class="hidden items-center gap-1 lg:flex">
					{#if selectedValues.length > 2}
						<Badge variant="secondary" class="rounded-sm px-1 font-normal">
							{selectedValues.length} selected
						</Badge>
					{:else}
						{#each selectedOptions as option (option.value)}
							<Badge variant="secondary" class="rounded-sm px-1 font-normal">
								{option.label}
							</Badge>
						{/each}
					{/if}
				</span>
			{/if}
		</Popover.Trigger>
		<Popover.Content class="w-50 p-0" align="start">
			<Command.Root>
				<Command.Input placeholder={title} />
				<Command.List class="max-h-full">
					<Command.Empty>No results found.</Command.Empty>
					<Command.Group class="max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto">
						{#each options as option (option.value)}
							{@const isSelected = selectedValues.includes(option.value)}
							<!--
								No `data-checked`: the leading checkbox is upstream's affordance, and the class
								the attribute unhides — `Command.Item`'s own trailing indicator, which React's
								`CommandItem` has no equivalent of — would draw a second tick on the same row.
							-->
							<Command.Item
								value={option.value}
								keywords={[option.label]}
								onSelect={() => onItemSelect(option, isSelected)}
							>
								<div
									class={cn(
										"flex size-4 items-center justify-center rounded-[4px] border border-input",
										isSelected
											? "border-primary bg-primary text-primary-foreground"
											: "dark:bg-input/30 [&_svg]:invisible",
									)}
								>
									<!-- Explicit size so Command.Item's [&_svg:not([class*='size-'])]:size-4 rule
										does not inflate the tick to fill the box (checkbox.svelte draws size-3.5). -->
									<CheckIcon class="size-3.5" />
								</div>
								{#if option.icon}
									{@const Icon = option.icon}
									<Icon />
								{/if}
								<span class="truncate">{option.label}</span>
								{#if option.count}
									<span class="ml-auto font-mono text-xs">{option.count}</span>
								{/if}
							</Command.Item>
						{/each}
					</Command.Group>
					{#if selectedValues.length > 0}
						<Command.Separator />
						<Command.Group>
							<!--
								The indicator is hidden, not just left transparent: `Command.Item` always renders
								it with `ml-auto`, and an auto margin absorbs the free space before
								`justify-content` is applied, so the invisible tick pushed this label off centre.
							-->
							<Command.Item
								value="clear-filters"
								class="justify-center text-center [&_.cn-command-item-indicator]:hidden"
								onSelect={onReset}
							>
								Clear filters
							</Command.Item>
						</Command.Group>
					{/if}
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
