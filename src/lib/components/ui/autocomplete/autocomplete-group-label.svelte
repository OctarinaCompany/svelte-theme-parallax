<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type AutocompleteGroupLabelProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { getAutocompleteGroupContext } from "./autocomplete.svelte.js";

	/** The heading a `<Autocomplete.Group>` names itself with — its `aria-labelledby` target. */

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: AutocompleteGroupLabelProps = $props();

	const group = getAutocompleteGroupContext("<Autocomplete.GroupLabel>");
</script>

<div
	bind:this={ref}
	id={group.labelId}
	data-slot="autocomplete-group-label"
	{...restProps}
	class={cn("px-1.5 py-1 text-xs font-medium text-muted-foreground", className)}
>
	{@render children?.()}
</div>
