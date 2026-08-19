<script lang="ts" module>
	import type { FilterFieldConfig } from "./types.js";

	export interface FiltersOperatorDropdownProps<T = unknown> {
		field: FilterFieldConfig<T>;
		operator: string;
		values: T[];
		onChange: (operator: string) => void;
	}
</script>

<script lang="ts" generics="T">
	import CheckIcon from "@lucide/svelte/icons/check";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { cn } from "$lib/utils.js";
	import { getFiltersContext } from "./filters.svelte.js";
	import { getOperatorsForField } from "./filters-utils.js";

	/**
	 * The middle segment of a chip: `is`, `is any of`, `contains`, …
	 *
	 * The label falls back to `helpers.formatOperator`, which turns `is_any_of` into `is any of`,
	 * so a filter created with an operator outside the field's own set still reads as words rather
	 * than as a key.
	 */

	let { field, operator, values, onChange }: FiltersOperatorDropdownProps<T> = $props();

	const context = getFiltersContext();
	const operators = $derived(getOperatorsForField(field, values, context.i18n));
	const label = $derived(
		operators.find((candidate) => candidate.value === operator)?.label ??
			context.i18n.helpers.formatOperator(operator),
	);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				size={context.size}
				class="text-muted-foreground hover:text-foreground"
			>
				{label}
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start" class="w-fit min-w-fit">
		{#each operators as candidate (candidate.value)}
			<DropdownMenu.Item
				class="flex items-center justify-between"
				onSelect={() => onChange(candidate.value)}
			>
				<span>{candidate.label}</span>
				<!--
					The tick keeps its space at zero opacity rather than being conditionally rendered:
					every row is then the same width, and the list does not reflow as the choice moves.
				-->
				<CheckIcon
					class={cn(
						"ms-auto text-primary",
						candidate.value === operator ? "opacity-100" : "opacity-0",
					)}
				/>
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
