<script lang="ts" module>
	import type { FilterFieldConfig, FilterOption } from "./types.js";

	export interface FiltersSubmenuContentProps<T = unknown> {
		field: FilterFieldConfig<T>;
		/** The values of the filter this menu session is building, if it has started one. */
		currentValues: T[];
		multiple: boolean;
		onToggle: (value: T, isSelected: boolean) => void;
		/** ArrowLeft — back to the field list. */
		onBack: () => void;
	}
</script>

<script lang="ts" generics="T">
	import { FieldOptions } from "./field-options.svelte.js";
	import FiltersOptionList from "./filters-option-list.svelte";
	import { isSameValue } from "./filters-utils.js";
	import { getFiltersContext } from "./filters.svelte.js";

	/**
	 * The options of one field, inside the Add filter menu.
	 *
	 * Picking here does not open a chip and then fill it — it builds the filter as you go, which is
	 * what makes "Priority → Low, Medium" one gesture instead of three. The root owns that session;
	 * this component only reports toggles.
	 *
	 * UPSTREAM'S `isActive` / `onActive` PAIR IS GONE. It exists to tell a submenu whether it is
	 * the one the user is in, because Radix keeps every submenu's content mounted. bits-ui unmounts
	 * a closed `Sub`, so being mounted already answers the question, and a `mouseenter` handler
	 * that only re-states it would be one more thing to keep in step.
	 */

	let { field, currentValues, multiple, onToggle, onBack }: FiltersSubmenuContentProps<T> =
		$props();

	const context = getFiltersContext();

	let search = $state("");

	// `enabled` is a constant here, unlike in the chip's popover: this component only exists while
	// its submenu is open, so there is no closed state to hold a loader back from.
	const resolved = new FieldOptions<T>({
		field: () => field,
		query: () => search,
		enabled: () => true,
	});

	/**
	 * What the list shows.
	 *
	 * An async field floats the selected values to the top, resolved from the cache so they keep
	 * their labels when the loader's latest page no longer contains them. A static field leaves
	 * everything where it is and simply never hides a selected row — the search filters the rest.
	 */
	const options = $derived.by(() => {
		const isSelected = (option: FilterOption<T>) =>
			currentValues.some((value) => isSameValue(field, value, option.value));

		if (resolved.isAsync) {
			return [
				...resolved.resolveSelected(currentValues),
				...resolved.options.filter((option) => !isSelected(option)),
			];
		}

		const query = search.toLowerCase();
		return (
			field.options?.filter(
				(option) => isSelected(option) || !query || option.label.toLowerCase().includes(query),
			) ?? []
		);
	});
</script>

<div class="flex flex-col">
	<FiltersOptionList
		{field}
		{options}
		values={currentValues}
		{multiple}
		isAsync={resolved.isAsync}
		loading={resolved.loading}
		error={resolved.error}
		i18n={context.i18n}
		bind:search
		autoHighlightFirst
		onToggle={(option) =>
			onToggle(
				option.value,
				currentValues.some((value) => isSameValue(field, value, option.value)),
			)}
		{onBack}
	/>
</div>
