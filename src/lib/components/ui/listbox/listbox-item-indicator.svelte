<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the indicator's `child` snippet. */
	export type ListboxItemIndicatorChildProps = {
		"aria-hidden": "true";
		"data-slot": "listbox-item-indicator";
		class: string;
	} & Record<string, unknown>;

	export type ListboxItemIndicatorProps = WithElementRef<
		HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	> & {
		/**
		 * Whether to render the indicator even when the option is not selected.
		 * @default false
		 */
		forceMount?: boolean;
		/** The indicator's content. @default a `<Check>` icon */
		children?: Snippet;
		/** Render the indicator onto your own element instead of the default `<span>`. */
		child?: Snippet<[{ props: ListboxItemIndicatorChildProps }]>;
	};
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";

	import { getListboxItemContext } from "./listbox.svelte.js";

	let {
		ref = $bindable(null),
		forceMount = false,
		class: className,
		children,
		child,
		...restProps
	}: ListboxItemIndicatorProps = $props();

	const item = getListboxItemContext("<Listbox.ItemIndicator>");

	const indicatorAttrs = $derived({
		"aria-hidden": "true",
		"data-slot": "listbox-item-indicator",
		...restProps,
		class: cn("flex shrink-0 items-center justify-center", className),
	} as ListboxItemIndicatorChildProps);
</script>

{#if forceMount || item.isSelected}
	{#if child}
		{@render child({ props: indicatorAttrs })}
	{:else}
		<span bind:this={ref} {...indicatorAttrs}>
			{#if children}
				{@render children()}
			{:else}
				<CheckIcon class="size-4" />
			{/if}
		</span>
	{/if}
{/if}
