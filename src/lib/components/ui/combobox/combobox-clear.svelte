<script lang="ts" module>
	import type { ComponentProps } from "svelte";

	import { InputGroupButton } from "$lib/components/ui/input-group/index.js";
	import { cn } from "$lib/utils.js";

	// The clear IS an `InputGroupButton` (upstream renders it as one), so its props are that
	// component's — retyping them as bare `HTMLButtonAttributes` would reject the spread.
	export type ComboboxClearProps = ComponentProps<typeof InputGroupButton>;
</script>

<script lang="ts">
	import XIcon from "@lucide/svelte/icons/x";

	import { getComboboxContext } from "./combobox.svelte.js";

	/**
	 * The clear affordance inside the field: an `InputGroupButton`
	 * (ghost, icon-xs) exactly as upstream composes it through Base UI's `render` prop, with the
	 * `IconPlaceholder` resolved to the `XIcon` it renders at runtime.
	 *
	 * It exists only while there is something to clear — Base UI's `Clear` hides itself on an empty
	 * selection, and that absence is also what lets the sibling trigger reappear: the trigger hides
	 * through a `has-data-[slot=combobox-clear]` selector, so the two never stack in the field's
	 * corner.
	 */

	let {
		ref = $bindable(null),
		class: className,
		onclick: onclickProp,
		children,
		...restProps
	}: ComboboxClearProps = $props();

	const root = getComboboxContext("<Combobox.Clear>");

	function onclick(event: MouseEvent) {
		onclickProp?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
		if (event.defaultPrevented) return;

		root.clear();
	}
</script>

{#if root.hasValue}
	<InputGroupButton
		bind:ref
		variant="ghost"
		size="icon-xs"
		data-slot="combobox-clear"
		data-disabled={root.disabled ? "" : undefined}
		tabindex={-1}
		aria-label="Clear"
		disabled={root.disabled}
		{...restProps}
		class={cn("data-disabled:pointer-events-none", className)}
		{onclick}
	>
		{#if children}
			{@render children()}
		{:else}
			<XIcon class="pointer-events-none" />
		{/if}
	</InputGroupButton>
{/if}
