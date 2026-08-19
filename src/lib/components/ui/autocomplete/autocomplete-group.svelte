<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type AutocompleteGroupProps<T = unknown> = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** The rows this group holds — what `<Autocomplete.Collection>` iterates. */
		items?: readonly T[];
		/** Normally a `<Autocomplete.GroupLabel>` and a `<Autocomplete.Collection>`. */
		children?: Snippet;
	};
</script>

<script lang="ts" generics="T = unknown">
	import {
		AutocompleteGroupState,
		getAutocompleteContext,
		setAutocompleteGroupContext,
	} from "./autocomplete.svelte.js";

	/**
	 * A labelled section of the list.
	 *
	 * The group carries its own `items` rather than reading a slice of the root's: a grouped list
	 * arrives already grouped — and, as the ported demo shows, already filtered — so the root's flat
	 * list is the *groups*, and only the group knows what is inside it.
	 */

	let {
		ref = $bindable(null),
		items = [],
		class: className,
		children,
		...restProps
	}: AutocompleteGroupProps<T> = $props();

	getAutocompleteContext("<Autocomplete.Group>");

	const labelId = $props.id();

	setAutocompleteGroupContext(new AutocompleteGroupState(() => items, labelId));
</script>

<div
	bind:this={ref}
	role="group"
	aria-labelledby={labelId}
	data-slot="autocomplete-group"
	{...restProps}
	class={cn("flex flex-col", className)}
>
	{@render children?.()}
</div>
