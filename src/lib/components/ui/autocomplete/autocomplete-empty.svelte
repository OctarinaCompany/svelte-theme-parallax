<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type AutocompleteEmptyProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { getAutocompleteContext } from "./autocomplete.svelte.js";

	/**
	 * What the popup says when the filter kept nothing.
	 *
	 * It renders only in that case, so it can sit beside `<Autocomplete.List>` unconditionally — the
	 * caller never has to duplicate the "are there matches?" test the root has already made.
	 */

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: AutocompleteEmptyProps = $props();

	const root = getAutocompleteContext("<Autocomplete.Empty>");
</script>

{#if root.filteredItems.length === 0}
	<div
		bind:this={ref}
		data-slot="autocomplete-empty"
		{...restProps}
		class={cn("px-2 py-1.5 text-center text-sm text-muted-foreground", className)}
	>
		{@render children?.()}
	</div>
{/if}
