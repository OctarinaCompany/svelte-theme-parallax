<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TimelineHeaderChildProps = {
		"data-slot": "timeline-header";
		class: string;
	} & Record<string, unknown>;

	export type TimelineHeaderProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the header onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TimelineHeaderChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: TimelineHeaderProps = $props();

	const headerAttrs = $derived({
		"data-slot": "timeline-header",
		...restProps,
		class: cn("flex flex-col gap-1", className),
	} as TimelineHeaderChildProps);
</script>

{#if child}
	{@render child({ props: headerAttrs })}
{:else}
	<div bind:this={ref} {...headerAttrs}>
		{@render children?.()}
	</div>
{/if}
