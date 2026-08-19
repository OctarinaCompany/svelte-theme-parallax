<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { KeyValueOrientation } from "./key-value.svelte.js";

	export type KeyValueListProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
		/**
		 * How the rows are laid out.
		 *
		 * @default "vertical"
		 */
		orientation?: KeyValueOrientation;
		/**
		 * The row template. Written **once** and rendered once per row inside that row's context
		 * provider — do not wrap it in an `{#each}` yourself.
		 */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getKeyValueContext } from "./key-value.svelte.js";
	import ItemProvider from "./key-value-item-provider.svelte";

	let {
		ref = $bindable(null),
		orientation = "vertical",
		class: className,
		children,
		...restProps
	}: KeyValueListProps = $props();

	const root = getKeyValueContext("<KeyValue.List>");
</script>

<!--
	`aria-orientation` is deliberately not emitted (divergence D-6): upstream sets it
	on `role="list"`, where it is neither a supported ARIA property nor read by assistive technology.
	`data-orientation` carries the orientation for styling and tests.
-->
<div
	bind:this={ref}
	role="list"
	data-slot="key-value-list"
	data-orientation={orientation}
	{...restProps}
	class={cn("flex", orientation === "vertical" ? "flex-col gap-2" : "flex-row gap-2", className)}
>
	{#each root.value as item (item.id)}
		<ItemProvider itemId={item.id} {children} />
	{/each}
</div>
