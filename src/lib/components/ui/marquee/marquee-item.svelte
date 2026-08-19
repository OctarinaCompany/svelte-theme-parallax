<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MarqueeItemChildProps = {
		"data-slot": "marquee-item";
		class: string;
	} & Record<string, unknown>;

	export type MarqueeItemProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the item onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: MarqueeItemChildProps }]>;
	};
</script>

<script lang="ts">
	// Reads no context, matching upstream's `MarqueeItem` — so it renders standalone outside
	// `<Marquee.Root>` rather than throwing.
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: MarqueeItemProps = $props();

	const itemAttrs = $derived({
		"data-slot": "marquee-item",
		...restProps,
		class: cn("shrink-0", className),
	} as MarqueeItemChildProps);
</script>

{#if child}
	{@render child({ props: itemAttrs })}
{:else}
	<div bind:this={ref} {...itemAttrs}>
		{@render children?.()}
	</div>
{/if}
