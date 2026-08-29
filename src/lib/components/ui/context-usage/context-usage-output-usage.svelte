<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ContextUsageOutputUsageProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { formatTokens, formatUsd, getContextUsageContext } from "./context-usage.svelte.js";

	/**
	 * The `Output` row: `usage.outputTokens` in compact figures and, when `cost.outputUsd` is
	 * present, the figure after a bullet. Renders nothing when the count is missing, zero or not
	 * a positive finite number. `children` replace the row's content and make it render
	 * regardless.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ContextUsageOutputUsageProps = $props();

	const state = getContextUsageContext("`<ContextUsage.OutputUsage>`");
	const line = $derived(state.line("output"));
</script>

{#if children || line}
	<div
		bind:this={ref}
		data-slot="context-usage-output-usage"
		data-kind="output"
		class={cn("flex items-center justify-between gap-3 text-xs", className)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{:else if line}
			<span class="text-muted-foreground">{line.label}</span>
			<span>
				{formatTokens(line.tokens)}
				{#if line.usd !== undefined}
					<span class="ms-2 text-muted-foreground">• {formatUsd(line.usd)}</span>
				{/if}
			</span>
		{/if}
	</div>
{/if}
