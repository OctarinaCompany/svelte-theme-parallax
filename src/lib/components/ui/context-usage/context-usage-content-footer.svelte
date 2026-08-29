<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ContextUsageContentFooterProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { getContextUsageContext } from "./context-usage.svelte.js";

	/**
	 * The card's last band, on the secondary ground: "Total cost" and the figure. It renders
	 * NOTHING when there is no figure — no `cost` on the root, or a `cost` with neither a total
	 * nor any component to sum — where upstream prints `$0.00`. `children` replace the pair and
	 * make the band render regardless.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ContextUsageContentFooterProps = $props();

	const state = getContextUsageContext("`<ContextUsage.ContentFooter>`");
</script>

{#if children || state.totalUsd !== undefined}
	<div
		bind:this={ref}
		data-slot="context-usage-content-footer"
		class={cn(
			"flex w-full items-center justify-between gap-3 bg-secondary p-3 text-xs text-secondary-foreground",
			className,
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{:else}
			<span class="text-muted-foreground">Total cost</span>
			<span>{state.totalCostLabel}</span>
		{/if}
	</div>
{/if}
