<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	import type { KeyValueField } from "./key-value.svelte.js";

	export type KeyValueErrorProps = WithElementRef<
		HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	> & {
		/** Which of the row's two fields this message belongs to. */
		field: KeyValueField;
	};
</script>

<script lang="ts">
	import { getKeyValueItemContext } from "./key-value.svelte.js";

	let {
		ref = $bindable(null),
		field,
		class: className,
		children,
		...restProps
	}: KeyValueErrorProps = $props();

	const item = getKeyValueItemContext("<KeyValue.Error>");

	const message = $derived(field === "key" ? item.keyError : item.valueError);
</script>

<!-- Renders nothing at all while the row is valid for this field. -->
{#if message !== undefined}
	<span
		bind:this={ref}
		id={item.root.errorId(item.id, field)}
		role="alert"
		data-slot="key-value-error"
		data-field={field}
		{...restProps}
		class={cn("text-sm font-medium text-destructive", className)}
	>
		{#if children}
			{@render children()}
		{:else}
			{message}
		{/if}
	</span>
{/if}
