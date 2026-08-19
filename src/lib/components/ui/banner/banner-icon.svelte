<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type BannerIconChildProps = {
		"data-slot": "banner-icon";
		class: string;
	} & Record<string, unknown>;

	export type BannerIconProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the icon onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent.
		 */
		child?: Snippet<[{ props: BannerIconChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: BannerIconProps = $props();

	const iconAttrs: BannerIconChildProps = $derived({
		"data-slot": "banner-icon",
		...restProps,
		class: cn("flex shrink-0 items-center [&>svg]:size-4", className),
	});
</script>

{#if child}
	{@render child({ props: iconAttrs })}
{:else}
	<div bind:this={ref} {...iconAttrs}>
		{@render children?.()}
	</div>
{/if}
