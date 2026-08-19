<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLLabelAttributes } from "svelte/elements";

	export type MentionLabelProps = WithElementRef<HTMLLabelAttributes, HTMLLabelElement> & {
		/** The label text. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getMentionContext } from "./mention.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: MentionLabelProps = $props();

	const root = getMentionContext("<Mention.Label>");
</script>

<label
	bind:this={ref}
	id={root.labelId}
	for={root.inputId}
	data-slot="mention-label"
	{...restProps}
	class={cn(
		"text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
		className,
	)}
>
	{@render children?.()}
</label>
