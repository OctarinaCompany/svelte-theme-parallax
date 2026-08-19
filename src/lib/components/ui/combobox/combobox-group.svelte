<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type ComboboxGroupProps<T = unknown> = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** The rows this group holds — what `<Combobox.Collection>` iterates, filter applied. */
		items?: readonly T[];
		/** Normally a `<Combobox.Label>` and a `<Combobox.Collection>`. */
		children?: Snippet;
	};
</script>

<script lang="ts" generics="T = unknown">
	import {
		ComboboxGroupState,
		getComboboxContext,
		setComboboxGroupContext,
	} from "./combobox.svelte.js";

	/**
	 * A labelled section of the list.
	 *
	 * The group carries its own `items` — the `items` array of one group-shaped entry — and hides
	 * itself while none of them match, which is Base UI's behaviour: a heading with nothing under
	 * it is noise, not structure. `group/combobox-group` is the named group upstream's separator
	 * demo styles against (`group-last/combobox-group:hidden`).
	 */

	let {
		ref = $bindable(null),
		items = [],
		class: className,
		children,
		...restProps
	}: ComboboxGroupProps<T> = $props();

	const root = getComboboxContext("<Combobox.Group>");

	const labelId = $props.id();

	const group = setComboboxGroupContext(new ComboboxGroupState(root, () => items, labelId));
</script>

{#if group.filteredItems.length > 0}
	<div
		bind:this={ref}
		role="group"
		aria-labelledby={labelId}
		data-slot="combobox-group"
		{...restProps}
		class={cn("group/combobox-group flex flex-col", className)}
	>
		{@render children?.()}
	</div>
{/if}
