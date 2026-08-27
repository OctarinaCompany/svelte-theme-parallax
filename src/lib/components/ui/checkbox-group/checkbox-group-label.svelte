<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLLabelAttributes } from "svelte/elements";

	/**
	 * `id` is omitted deliberately: the label's id is derived from the group's, because that is what
	 * the root's `aria-labelledby` points at. Overriding it would dangle the reference.
	 */
	export type CheckboxGroupLabelProps = WithElementRef<
		Omit<HTMLLabelAttributes, "id">,
		HTMLLabelElement
	>;
</script>

<script lang="ts">
	import { Label as LabelPrimitive } from "bits-ui";

	import { getCheckboxGroupContext } from "./checkbox-group.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CheckboxGroupLabelProps = $props();

	const state = getCheckboxGroupContext("<CheckboxGroup.Label>");

	// The root only points `aria-labelledby` at this id while the label is actually rendered, so a
	// consumer who omits it never leaves a dangling idref behind.
	$effect(() => state.registerLabel());
</script>

<LabelPrimitive.Root
	bind:ref
	data-slot="checkbox-group-label"
	id={state.labelId}
	data-disabled={state.disabled ? "" : undefined}
	{...restProps}
	class={cn(
		"text-sm leading-none font-medium text-foreground/70 data-disabled:cursor-not-allowed data-disabled:opacity-70",
		className,
	)}
>
	{@render children?.()}
</LabelPrimitive.Root>
