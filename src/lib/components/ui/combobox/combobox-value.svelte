<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	/** `T` defaults to `any` for the reason `<Combobox.List>` records. */
	export type ComboboxValueProps<T = any> = WithElementRef<
		Omit<HTMLAttributes<HTMLSpanElement>, "children">,
		HTMLSpanElement
	> & {
		/** What the default rendering says while nothing is selected. */
		placeholder?: string;
		/**
		 * Renders the selection yourself: called with the selected item — or `null` — in single
		 * mode, and with the whole selection array in `multiple` mode, which is how the chips
		 * demos map their chips.
		 */
		children?: Snippet<[T]>;
	};
</script>

<script lang="ts" generics="T = any">
	import { getComboboxContext } from "./combobox.svelte.js";

	/**
	 * The selection's rendering (Base UI's `Value` with a `data-slot`).
	 * Lives inside a select-shaped `<Combobox.Trigger>` or a `<Combobox.Chips>`; it reads the root
	 * context, so it works in either.
	 *
	 * Without a snippet it renders the selection's string form — joined with commas in multiple
	 * mode, the way a native multi-`<select>` summarises — or the placeholder, muted.
	 */

	let {
		ref = $bindable(null),
		placeholder,
		class: className,
		children,
		...restProps
	}: ComboboxValueProps<T> = $props();

	const root = getComboboxContext("<Combobox.Value>");

	// The snippet's argument: the array in multiple mode, the item or null in single mode.
	const selection = $derived(
		(root.multiple ? root.selectedItems : (root.selectedItems[0] ?? null)) as T,
	);

	const displayText = $derived(root.selectedStringValues.join(", "));
</script>

{#if children}
	{@render children(selection)}
{:else}
	<span
		bind:this={ref}
		data-slot="combobox-value"
		data-placeholder={root.hasValue ? undefined : ""}
		{...restProps}
		class={cn("truncate data-placeholder:text-muted-foreground", className)}
	>
		{root.hasValue ? displayText : (placeholder ?? "")}
	</span>
{/if}
