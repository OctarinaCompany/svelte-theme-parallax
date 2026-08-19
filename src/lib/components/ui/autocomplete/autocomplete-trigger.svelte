<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLButtonAttributes } from "svelte/elements";

	export type AutocompleteTriggerProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement>;
</script>

<script lang="ts">
	import SearchIcon from "@lucide/svelte/icons/search";

	import { getAutocompleteContext } from "./autocomplete.svelte.js";

	/**
	 * The search affordance inside the field, rendered by `<Autocomplete.Input showTrigger>`.
	 *
	 * It is `tabindex="-1"` on purpose: the field is the control, and a second tab stop inside it
	 * that does what `ArrowDown` already does would only lengthen the path through the form.
	 *
	 * `has-[+[data-slot=autocomplete-clear]]:hidden` is upstream's, and it is what keeps the two
	 * buttons from stacking — a clear button rendered next to it wins the corner.
	 */

	let {
		ref = $bindable(null),
		class: className,
		onclick: onclickProp,
		children,
		...restProps
	}: AutocompleteTriggerProps = $props();

	const root = getAutocompleteContext("<Autocomplete.Trigger>");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;
		if (root.disabled || root.readonly) return;

		root.setOpen(!root.open);
		if (root.open) void root.resetHighlight();
		root.inputElement?.focus();
	}
</script>

<button
	bind:this={ref}
	type="button"
	data-slot="autocomplete-trigger"
	data-disabled={root.disabled ? "" : undefined}
	tabindex={-1}
	aria-label="Search"
	aria-haspopup="listbox"
	aria-expanded={root.open}
	disabled={root.disabled}
	{...restProps}
	class={cn(
		"absolute top-1/2 -translate-y-1/2 cursor-pointer ring-offset-background transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none has-[+[data-slot=autocomplete-clear]]:hidden data-disabled:pointer-events-none",
		className,
	)}
	{onclick}
>
	{#if children}
		{@render children()}
	{:else}
		<SearchIcon class="size-4 opacity-70" />
	{/if}
</button>
