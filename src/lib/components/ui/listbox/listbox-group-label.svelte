<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the group label's `child` snippet. */
	export type ListboxGroupLabelChildProps = {
		id: string;
		"data-slot": "listbox-group-label";
		class: string;
	} & Record<string, unknown>;

	export type ListboxGroupLabelProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** The group's heading text. */
		children?: Snippet;
		/** Render the label onto your own element instead of the default `<div>`. */
		child?: Snippet<[{ props: ListboxGroupLabelChildProps }]>;
	};
</script>

<script lang="ts">
	import { getListboxGroupContext } from "./listbox.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: ListboxGroupLabelProps = $props();

	const group = getListboxGroupContext("<Listbox.GroupLabel>");

	const labelAttrs = $derived({
		id: group.labelId,
		"data-slot": "listbox-group-label",
		...restProps,
		class: cn("px-2 pt-1 text-sm font-medium text-muted-foreground", className),
	} as ListboxGroupLabelChildProps);
</script>

{#if child}
	{@render child({ props: labelAttrs })}
{:else}
	<div bind:this={ref} {...labelAttrs}>
		{@render children?.()}
	</div>
{/if}
