<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type BannerActionsChildProps = {
		"data-slot": "banner-actions";
		class: string;
	} & Record<string, unknown>;

	export type BannerActionsProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the actions container onto your own element instead of the default `<div>`. The
		 * snippet receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent.
		 */
		child?: Snippet<[{ props: BannerActionsChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: BannerActionsProps = $props();

	const actionsAttrs: BannerActionsChildProps = $derived({
		"data-slot": "banner-actions",
		...restProps,
		class: cn("flex items-center gap-2", className),
	});
</script>

{#if child}
	{@render child({ props: actionsAttrs })}
{:else}
	<div bind:this={ref} {...actionsAttrs}>
		{@render children?.()}
	</div>
{/if}
