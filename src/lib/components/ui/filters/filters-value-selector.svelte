<script lang="ts" module>
	import type { FilterFieldConfig } from "./types.js";

	export interface FiltersValueSelectorProps<T = unknown> {
		field: FilterFieldConfig<T>;
		values: T[];
		operator: string;
		onChange: (values: T[]) => void;
		/** Focus the control shortly after it mounts. Only a `text` field can honour it. */
		autofocus?: boolean;
	}
</script>

<script lang="ts" generics="T">
	import { ButtonGroupText } from "$lib/components/ui/button-group/index.js";
	import FiltersInput from "./filters-input.svelte";
	import FiltersSelectOptionsPopover from "./filters-select-options-popover.svelte";

	/**
	 * The third segment of a chip — whichever control the field's `type` calls for.
	 *
	 * `empty` and `not_empty` render nothing: the operator is the whole predicate, and the chip
	 * ends at it. Anything that is not `text` and not `custom` gets the options popover, including
	 * a field with no `type` at all, which is what makes `select` the default.
	 */

	let {
		field,
		values,
		operator,
		onChange,
		autofocus = false,
	}: FiltersValueSelectorProps<T> = $props();
</script>

{#if operator === "empty" || operator === "not_empty"}
	<!-- Nothing to pick. -->
{:else if field.customRenderer}
	<!--
		The consumer's control, in a segment painted like the outline buttons around it rather than
		like `ButtonGroupText`'s muted addon — it holds something clickable, so it should not read as
		a label.
	-->
	<ButtonGroupText
		class="bg-background text-start whitespace-nowrap outline-hidden hover:bg-accent aria-expanded:bg-accent dark:bg-input/30"
	>
		{@render field.customRenderer({ field, values, onChange, operator, autofocus })}
	</ButtonGroupText>
{:else if field.type === "text"}
	<FiltersInput
		{field}
		value={(values[0] as string) ?? ""}
		onChange={(value) => onChange([value] as T[])}
		{autofocus}
	/>
{:else}
	<FiltersSelectOptionsPopover {field} {values} {onChange} />
{/if}
