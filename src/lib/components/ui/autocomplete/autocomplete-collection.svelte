<script lang="ts" module>
	import type { Snippet } from "svelte";

	/** `T` defaults to `any` for the reason `<Autocomplete.List>` records. */
	export type AutocompleteCollectionProps<T = any> = {
		/** Rendered once per item of the enclosing group, with the item and its index. */
		children?: Snippet<[T, number]>;
	};
</script>

<script lang="ts" generics="T = any">
	import { getAutocompleteGroupContext } from "./autocomplete.svelte.js";

	/**
	 * The rows of the enclosing `<Autocomplete.Group>`.
	 *
	 * It renders no element of its own — the group is already the labelled container, and a second
	 * wrapper between `role="group"` and `role="option"` would only add a node for assistive
	 * technology to walk past.
	 *
	 * `<Combobox.Collection>` is this part's twin, duplicated rather than shared: `src/lib/shared/`
	 * carries `.ts` machinery and never markup, and the two folders publish as independent registry
	 * items, so a shared part would make installing one pull in the other. The only difference is
	 * which list the enclosing group publishes — every item here, the surviving ones there.
	 */

	let { children }: AutocompleteCollectionProps<T> = $props();

	const group = getAutocompleteGroupContext("<Autocomplete.Collection>");

	const items = $derived(group.items as readonly T[]);
</script>

{#each items as item, index (index)}
	{@render children?.(item, index)}
{/each}
