<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TimelineTitleChildProps = {
		"data-slot": "timeline-title";
		class: string;
	} & Record<string, unknown>;

	export type TimelineTitleProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the title onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TimelineTitleChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: TimelineTitleProps = $props();

	const titleAttrs = $derived({
		"data-slot": "timeline-title",
		...restProps,
		class: cn("leading-none font-semibold", className),
	} as TimelineTitleChildProps);
</script>

{#if child}
	{@render child({ props: titleAttrs })}
{:else}
	<div bind:this={ref} {...titleAttrs}>
		{@render children?.()}
	</div>
{/if}
