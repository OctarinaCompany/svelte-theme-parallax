<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type ComboboxChipProps<T = unknown> = WithElementRef<
		HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	> & {
		/**
		 * The selected entry this chip stands for. Optional because upstream's chips (rendered
		 * inside the `Value` snippet, one per selection, in order) never say it either — Base UI
		 * infers it from position, and so does this theme: without `value`, removal resolves the
		 * chip's index among its rendered siblings.
		 */
		value?: T;
		/**
		 * Whether the remove button is rendered.
		 *
		 * @default true
		 */
		showRemove?: boolean;
		/** The chip's rendered content. */
		children?: Snippet;
	};
</script>

<script lang="ts" generics="T = unknown">
	import XIcon from "@lucide/svelte/icons/x";

	import { Button } from "$lib/components/ui/button/index.js";

	import { getComboboxContext } from "./combobox.svelte.js";

	/**
	 * One committed selection in the chips row, remove button
	 * included — upstream renders `ChipRemove` as a ghost icon `Button`, `IconPlaceholder`
	 * resolved to the `XIcon` it renders at runtime.
	 */

	let {
		ref = $bindable(null),
		value,
		showRemove = true,
		class: className,
		children,
		...restProps
	}: ComboboxChipProps<T> = $props();

	const root = getComboboxContext("<Combobox.Chip>");

	function remove() {
		if (root.disabled || root.readonly) return;

		// An explicit `value` removes by identity (`itemsEqual` — the caller's `isItemEqualToValue`,
		// else the string form); otherwise the chip's position among its rendered siblings is its
		// position in the selection, because the Value snippet renders one chip per selected entry,
		// in order.
		if (value !== undefined) {
			const index = root.selectedItems.findIndex((selected) => root.itemsEqual(value, selected));
			if (index !== -1) root.removeAt(index);
			return;
		}

		const container = root.chipsElement;
		const element = ref;
		if (!container || !element) return;

		const chips = Array.from(container.querySelectorAll('[data-slot="combobox-chip"]'));
		const index = chips.indexOf(element);
		if (index !== -1) root.removeAt(index);
	}
</script>

<span
	bind:this={ref}
	data-slot="combobox-chip"
	{...restProps}
	class={cn(
		"flex h-6 w-fit items-center justify-center gap-1 rounded-[min(var(--radius-md),8px)] bg-muted px-1.5 text-xs font-medium whitespace-nowrap has-data-[slot=combobox-chip-remove]:pr-0",
		className,
	)}
>
	{@render children?.()}
	{#if showRemove}
		<Button
			variant="ghost"
			size="icon-xs"
			data-slot="combobox-chip-remove"
			aria-label="Remove"
			tabindex={-1}
			disabled={root.disabled}
			class="opacity-50 hover:bg-transparent hover:opacity-100"
			onclick={remove}
		>
			<XIcon class="pointer-events-none" />
		</Button>
	{/if}
</span>
