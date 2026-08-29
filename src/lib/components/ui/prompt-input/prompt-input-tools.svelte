<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type PromptInputToolsProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	/**
	 * The left-hand cluster of the footer: selects and tool buttons in a row.
	 *
	 * `min-w-0` is load-bearing. The footer is `justify-between` and the submit button must never
	 * be pushed off the frame; without it a long row of `whitespace-nowrap` triggers cannot shrink
	 * and does exactly that.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: PromptInputToolsProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="prompt-input-tools"
	class={cn("flex min-w-0 items-center gap-1", className)}
	{...restProps}
>
	{@render children?.()}
</div>
