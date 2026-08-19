<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	/**
	 * `T` defaults to `any`, not `unknown`.
	 *
	 * Nothing on this component carries the element type — the items come from the root's context,
	 * and a context cannot be generic over its consumers — so Svelte has nothing to infer from and
	 * markup has no syntax for passing a type argument. `unknown` would therefore make every ordinary
	 * `{#snippet children(item)}` a type error at `item.anything`. A caller who wants the check back
	 * annotates the parameter: `{#snippet children(item: Person)}`.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export type AutocompleteListProps<T = any> = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "children">,
		HTMLDivElement
	> & {
		/** Rendered once per matching item, with the item and its index. */
		children?: Snippet<[T, number]>;
	};
</script>

<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
<script lang="ts" generics="T = any">
	import { getAutocompleteContext } from "./autocomplete.svelte.js";

	/**
	 * The options, one render of `children` per item the filter kept.
	 *
	 * A snippet rather than a plain slot because the list owns the iteration: the root has already
	 * decided *which* items survive, and letting the caller loop as well is how the two disagree.
	 *
	 * This is the scroll container, not the popup: an empty state or a status line rendered beside it
	 * stays pinned while the options scroll under it. The `not-empty:` padding is upstream's — with no
	 * options left the element collapses to nothing rather than leaving a stripe of padding above the
	 * empty message.
	 *
	 * DEVIATION — upstream wraps the options in its own `ScrollArea` for a thin custom scrollbar. Here
	 * the overflow is native, because that is what every other popup list in this repository does
	 * (`select-content`, `command-list`): one component quietly introducing a second kind of scrollbar
	 * is a worse inconsistency than a plain one.
	 */

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: AutocompleteListProps<T> = $props();

	const root = getAutocompleteContext("<Autocomplete.List>");

	// The root types its items as `unknown` — one context cannot be generic over every consumer — so
	// the list is where the caller's element type is reapplied.
	const items = $derived(root.filteredItems as readonly T[]);
</script>

<div
	bind:this={ref}
	id={root.listId}
	role="listbox"
	aria-orientation="vertical"
	data-slot="autocomplete-list"
	{...restProps}
	class={cn(
		"min-h-0 flex-1 overflow-y-auto overscroll-contain not-empty:scroll-py-1 not-empty:p-1",
		className,
	)}
>
	{#each items as item, index (index)}
		{@render children?.(item, index)}
	{/each}
</div>
