<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type AutocompleteStatusProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { getAutocompleteContext } from "./autocomplete.svelte.js";

	/**
	 * A line above the options for whatever the list cannot say itself — "searching…", a result
	 * count, an error.
	 *
	 * `aria-live="polite"` is the point: an asynchronous search changes the list under a user who is
	 * still typing, and without a live region a screen reader never learns that the results moved.
	 * `empty:p-0` keeps it from reserving a stripe of padding when there is nothing to announce.
	 */

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: AutocompleteStatusProps = $props();

	// Only for the guard-rail error: the status line reads nothing from the root.
	getAutocompleteContext("<Autocomplete.Status>");
</script>

<div
	bind:this={ref}
	role="status"
	aria-live="polite"
	data-slot="autocomplete-status"
	{...restProps}
	class={cn("px-2 py-1.5 text-sm text-muted-foreground empty:m-0 empty:p-0", className)}
>
	{@render children?.()}
</div>
