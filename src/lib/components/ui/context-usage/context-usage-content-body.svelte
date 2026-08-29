<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ContextUsageContentBodyProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	/**
	 * The card's middle band: a padded column for the usage rows. A row that has nothing to show
	 * renders nothing, so the column's `gap` never opens a hole for it.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ContextUsageContentBodyProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="context-usage-content-body"
	class={cn("flex w-full flex-col gap-2 p-3", className)}
	{...restProps}
>
	{@render children?.()}
</div>
