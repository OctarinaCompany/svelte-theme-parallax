<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ChainOfThoughtSearchResultsProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	/**
	 * The row of sources a search step found. Wraps, so a step that found twelve pages sets them
	 * over three lines inside the step's body rather than widening the trace.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ChainOfThoughtSearchResultsProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="chain-of-thought-search-results"
	class={cn("flex flex-wrap items-center gap-2", className)}
	{...restProps}
>
	{@render children?.()}
</div>
