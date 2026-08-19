<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type CheckboxGroupListProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { getCheckboxGroupContext } from "./checkbox-group.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CheckboxGroupListProps = $props();

	const state = getCheckboxGroupContext("<CheckboxGroup.List>");
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="checkbox-group-list"
	id={state.listId}
	data-orientation={state.orientation}
	data-invalid={state.isInvalid ? "" : undefined}
	data-disabled={state.disabled ? "" : undefined}
	{...restProps}
	class={cn(
		"flex gap-3 data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:flex-wrap data-[orientation=vertical]:flex-col",
		className,
	)}
>
	{@render children?.()}
</div>
