<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type KeyValueItemProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
		/** The row's fields, remove control and error messages. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getKeyValueItemContext } from "./key-value.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: KeyValueItemProps = $props();

	const item = getKeyValueItemContext("<KeyValue.Item>");
</script>

<div
	bind:this={ref}
	role="listitem"
	data-slot="key-value-item"
	data-highlighted={item.isHighlighted ? "" : undefined}
	{...restProps}
	class={cn("flex items-start gap-2", className)}
>
	{@render children?.()}
</div>
