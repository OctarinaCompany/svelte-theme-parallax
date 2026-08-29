<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ContextUsageContentHeaderProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { getContextUsageContext } from "./context-usage.svelte.js";

	/**
	 * The card's first band: the percentage on the left, `used / max` in compact figures on the
	 * right, and a bar underneath. `children` replace all three.
	 *
	 * The bar is the house `Progress`, which is already grounded on `bg-muted` — upstream passes
	 * `className="bg-muted"` to restate it.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ContextUsageContentHeaderProps = $props();

	const state = getContextUsageContext("`<ContextUsage.ContentHeader>`");
</script>

<div
	bind:this={ref}
	data-slot="context-usage-content-header"
	class={cn("flex w-full flex-col gap-2 p-3", className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<div class="flex items-center justify-between gap-3 text-xs">
			<p>{state.percentLabel}</p>
			<p class="font-mono text-muted-foreground">{state.usedLabel} / {state.maxLabel}</p>
		</div>
		<!--
			The unrounded ratio, as the ring in `context-usage-icon.svelte` gets it: `state.percent`
			is the integer for the `data-percent` stamp, and a bar fed that would draw empty under a
			"0.4%" label and full under "99.6%", disagreeing with both the label and the ring.
		-->
		<Progress value={state.usedPercent * 100} max={100} aria-label="Context window used" />
	{/if}
</div>
