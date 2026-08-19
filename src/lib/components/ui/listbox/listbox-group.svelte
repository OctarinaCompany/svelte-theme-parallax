<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the group's `child` snippet. */
	export type ListboxGroupChildProps = {
		role: "group";
		id: string;
		"aria-labelledby": string;
		"data-slot": "listbox-group";
		class: string;
	} & Record<string, unknown>;

	export type ListboxGroupProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
		/** Normally a `<Listbox.GroupLabel>` and the group's `<Listbox.Item>`s. */
		children?: Snippet;
		/** Render the group onto your own element instead of the default `<div>`. */
		child?: Snippet<[{ props: ListboxGroupChildProps }]>;
	};
</script>

<script lang="ts">
	import {
		getListboxContext,
		ListboxGroupState,
		setListboxGroupContext,
	} from "./listbox.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: ListboxGroupProps = $props();

	// Upstream's `ListboxGroup` never reads the root context, so it renders silently outside a root
	// and its declared error is unreachable. Here the throw is real.
	getListboxContext("<Listbox.Group>");

	const groupId = $props.id();

	const group = setListboxGroupContext(new ListboxGroupState({ id: groupId }));

	const groupAttrs = $derived({
		role: "group",
		id: groupId,
		"aria-labelledby": group.labelId,
		"data-slot": "listbox-group",
		...restProps,
		class: cn("flex flex-col gap-2", className),
	} as ListboxGroupChildProps);
</script>

{#if child}
	{@render child({ props: groupAttrs })}
{:else}
	<div bind:this={ref} {...groupAttrs}>
		{@render children?.()}
	</div>
{/if}
