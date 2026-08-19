<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type BannerContentChildProps = {
		"data-slot": "banner-content";
		class: string;
	} & Record<string, unknown>;

	export type BannerContentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the content container onto your own element instead of the default `<div>`. The
		 * snippet receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent.
		 */
		child?: Snippet<[{ props: BannerContentChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: BannerContentProps = $props();

	const contentAttrs: BannerContentChildProps = $derived({
		"data-slot": "banner-content",
		...restProps,
		class: cn("flex min-w-0 flex-1 flex-col gap-1", className),
	});
</script>

{#if child}
	{@render child({ props: contentAttrs })}
{:else}
	<div bind:this={ref} {...contentAttrs}>
		{@render children?.()}
	</div>
{/if}
