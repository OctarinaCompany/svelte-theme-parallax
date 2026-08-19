<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLLabelAttributes } from "svelte/elements";

	export type TagsInputLabelProps = WithElementRef<HTMLLabelAttributes, HTMLLabelElement> & {
		/** The label text. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getTagsInputContext } from "./tags-input.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: TagsInputLabelProps = $props();

	const root = getTagsInputContext("<TagsInput.Label>");

	// The input only points `aria-labelledby` at this label while it is actually mounted, so no idref
	// ever dangles and a caller's own `aria-label` is never shadowed (divergence D-6).
	$effect(() => root.registerLabel());
</script>

<label
	bind:this={ref}
	id={root.labelId}
	for={root.inputId}
	data-slot="tags-input-label"
	data-disabled={root.disabled ? "" : undefined}
	{...restProps}
	class={cn(
		"text-sm leading-none font-medium data-disabled:cursor-not-allowed data-disabled:opacity-70",
		className,
	)}
>
	{@render children?.()}
</label>
