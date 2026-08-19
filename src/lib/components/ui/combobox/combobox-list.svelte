<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	/**
	 * `T` defaults to `any`, not `unknown`.
	 *
	 * Nothing on this component carries the element type — the items come from the root's context,
	 * and a context cannot be generic over its consumers — so Svelte has nothing to infer from and
	 * markup has no syntax for passing a type argument. `unknown` would therefore make every
	 * ordinary `{#snippet children(item)}` a type error at `item.anything`. A caller who wants the
	 * check back annotates the parameter: `{#snippet children(item: Person)}`.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export type ComboboxListProps<T = any> = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "children">,
		HTMLDivElement
	> & {
		/**
		 * Rendered once per surviving top-level entry, with the entry and its index — a row in a
		 * flat list, a group entry in a grouped one. Upstream also accepts static children; here a
		 * fixed layout branches on the entry inside this snippet instead, since a snippet cannot be
		 * two shapes at once.
		 */
		children?: Snippet<[T, number]>;
	};
</script>

<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
<script lang="ts" generics="T = any">
	import { getComboboxContext } from "./combobox.svelte.js";

	/**
	 * The options, one render of `children` per entry the filter kept.
	 *
	 * A snippet rather than a plain slot because the list owns the iteration: the root has already
	 * decided *which* entries survive, and letting the caller loop as well is how the two disagree.
	 *
	 * This is the scroll container, not the popup: an empty state rendered beside it stays pinned
	 * while the options scroll under it. The `not-empty:` padding is upstream's `data-empty:p-0` —
	 * with no options left the element collapses to nothing rather than leaving a stripe of padding
	 * above the empty message.
	 */

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComboboxListProps<T> = $props();

	const root = getComboboxContext("<Combobox.List>");

	// The root types its items as `unknown` — one context cannot be generic over every consumer —
	// so the list is where the caller's element type is reapplied.
	const items = $derived(root.filteredItems as readonly T[]);
</script>

<div
	bind:this={ref}
	id={root.listId}
	role="listbox"
	aria-orientation="vertical"
	aria-multiselectable={root.multiple ? true : undefined}
	data-slot="combobox-list"
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
