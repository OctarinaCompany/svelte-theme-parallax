<script lang="ts" module>
	import type { FilterFieldConfig, FilterOption } from "./types.js";

	export interface FiltersSelectOptionsPopoverProps<T = unknown> {
		field: FilterFieldConfig<T>;
		values: T[];
		onChange: (values: T[]) => void;
	}
</script>

<script lang="ts" generics="T">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { cn } from "$lib/utils.js";
	import { FieldOptions } from "./field-options.svelte.js";
	import FiltersOptionList from "./filters-option-list.svelte";
	import { isSameValue } from "./filters-utils.js";
	import { getFiltersContext } from "./filters.svelte.js";

	/**
	 * The value half of a chip for a `select` or `multiselect` field: a button showing what is
	 * chosen, and the list it is chosen from.
	 *
	 * The list itself is `filters-option-list.svelte`, shared with the Add filter submenu. What is
	 * here is the ordering — selected first, then the rest, the rest filtered by the search box —
	 * and the toggle rules.
	 */

	let { field, values, onChange }: FiltersSelectOptionsPopoverProps<T> = $props();

	const context = getFiltersContext();

	let open = $state(false);
	let search = $state("");

	const resolved = new FieldOptions<T>({
		field: () => field,
		query: () => search,
		// Nothing is fetched until the list is on screen: an async field on a page with ten chips
		// would otherwise fire ten requests on mount for lists nobody has asked to see.
		enabled: () => open,
	});

	/**
	 * `multiselect`, or a `select` that has somehow ended up holding more than one value.
	 *
	 * The second half is what keeps a chip consistent with its own operator dropdown, which offers
	 * the multiselect operators under the same condition.
	 */
	const multiple = $derived(field.type === "multiselect" || values.length > 1);

	/** A field may take its values over from the filter — the controlled escape hatch. */
	const effectiveValues = $derived(field.value ?? values);

	/**
	 * The selected rows, always shown, never filtered by the search box.
	 *
	 * An async field resolves them from the value→label cache instead of from the loader's latest
	 * page, which is what keeps a selection labelled after a search has scrolled it out of the
	 * result set.
	 */
	const selectedOptions = $derived(
		resolved.isAsync
			? resolved.resolveSelected(effectiveValues)
			: (field.options?.filter((option) =>
					effectiveValues.some((value) => isSameValue(field, value, option.value)),
				) ?? []),
	);

	/** The rest. Filtered here for a static list; already filtered by the loader for an async one. */
	const unselectedOptions = $derived.by(() => {
		const isSelected = (option: FilterOption<T>) =>
			effectiveValues.some((value) => isSameValue(field, value, option.value));
		const rest = resolved.isAsync
			? resolved.options.filter((option) => !isSelected(option))
			: (field.options?.filter((option) => !isSelected(option)) ?? []);

		if (resolved.isAsync || !search) return rest;
		const query = search.toLowerCase();
		return rest.filter((option) => option.label.toLowerCase().includes(query));
	});

	const options = $derived([...selectedOptions, ...unselectedOptions]);

	function close() {
		open = false;
	}

	function toggle(option: FilterOption<T>) {
		const isSelected = effectiveValues.some((value) => isSameValue(field, value, option.value));
		const next = isSelected
			? effectiveValues.filter((value) => !isSameValue(field, value, option.value))
			: multiple
				? [...effectiveValues, option.value]
				: [option.value];

		// A cap that would be exceeded is a no-op, with no message and no disabled row — upstream's
		// behaviour, and the reason `maxSelections` reads as a limit rather than as a validation.
		if (!isSelected && multiple && field.maxSelections && next.length > field.maxSelections) {
			return;
		}

		if (field.onValueChange) field.onValueChange(next);
		else onChange(next);

		if (!multiple) close();
	}
</script>

<DropdownMenu.Root
	{open}
	onOpenChange={(value) => {
		open = value;
		// Cleared late, and on purpose: clearing it while the menu is still fading out would
		// re-filter the list under the closing animation.
		if (!value) setTimeout(() => (search = ""), 200);
	}}
>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" size={context.size}>
				<div class="flex items-center gap-1.5">
					{#if field.customValueRenderer}
						{@render field.customValueRenderer({
							values: effectiveValues,
							options: resolved.isAsync
								? resolved.resolveSelected(effectiveValues)
								: (field.options ?? []),
						})}
					{:else}
						{#if selectedOptions.length > 0}
							<!-- Three at most, overlapped: the trigger states the count in words anyway. -->
							<div class="flex items-center -space-x-1.5">
								{#each selectedOptions.slice(0, 3) as option, index (field.getOptionKey?.(option.value) ?? index)}
									{#if option.icon}
										<div>{@render option.icon(option)}</div>
									{/if}
								{/each}
							</div>
						{/if}
						{#if selectedOptions.length === 1}
							{selectedOptions[0].label}
						{:else if selectedOptions.length > 1}
							{selectedOptions.length}
							{context.i18n.selectedCount}
						{:else}
							{context.i18n.select}
						{/if}
					{/if}
				</div>
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="start" class={cn("w-[200px] px-0", field.class)}>
		<FiltersOptionList
			{field}
			{options}
			selectedCount={selectedOptions.length}
			values={effectiveValues}
			{multiple}
			isAsync={resolved.isAsync}
			loading={resolved.loading}
			error={resolved.error}
			i18n={context.i18n}
			bind:search
			onToggle={toggle}
			onBack={close}
		/>
	</DropdownMenu.Content>
</DropdownMenu.Root>
