<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLButtonAttributes } from "svelte/elements";

	export type AutocompleteClearProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement>;
</script>

<script lang="ts">
	import CircleXIcon from "@lucide/svelte/icons/circle-x";

	import { getAutocompleteContext } from "./autocomplete.svelte.js";

	/**
	 * The clear affordance inside the field, rendered by `<Autocomplete.Input showClear>`.
	 *
	 * It exists only while there is something to clear — upstream renders nothing on an empty field,
	 * and a permanently-visible × that does nothing reads as a broken control.
	 */

	let {
		ref = $bindable(null),
		class: className,
		onclick: onclickProp,
		children,
		...restProps
	}: AutocompleteClearProps = $props();

	const root = getAutocompleteContext("<Autocomplete.Clear>");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		root.clear();
	}
</script>

{#if root.value !== ""}
	<button
		bind:this={ref}
		type="button"
		data-slot="autocomplete-clear"
		data-disabled={root.disabled ? "" : undefined}
		tabindex={-1}
		aria-label="Clear"
		disabled={root.disabled}
		{...restProps}
		class={cn(
			"absolute top-1/2 -translate-y-1/2 opacity-70 ring-offset-background transition-opacity outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none data-disabled:pointer-events-none",
			className,
		)}
		{onclick}
	>
		{#if children}
			{@render children()}
		{:else}
			<CircleXIcon class="size-4" />
		{/if}
	</button>
{/if}
