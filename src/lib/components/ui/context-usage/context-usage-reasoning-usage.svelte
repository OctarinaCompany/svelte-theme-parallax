<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ContextUsageReasoningUsageProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { formatTokens, formatUsd, getContextUsageContext } from "./context-usage.svelte.js";

	/**
	 * The `Reasoning` row: `usage.reasoningTokens` in compact figures and, when
	 * `cost.reasoningUsd` is present, the figure after a bullet. Renders nothing when the count
	 * is missing, zero or not a positive finite number — which is the common case, since most
	 * providers fold thinking into `outputTokens`. `children` replace the row's content and make
	 * it render regardless.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ContextUsageReasoningUsageProps = $props();

	const state = getContextUsageContext("`<ContextUsage.ReasoningUsage>`");
	const line = $derived(state.line("reasoning"));
</script>

{#if children || line}
	<div
		bind:this={ref}
		data-slot="context-usage-reasoning-usage"
		data-kind="reasoning"
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
