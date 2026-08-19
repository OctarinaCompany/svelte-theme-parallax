<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type BannerDescriptionProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: BannerDescriptionProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="banner-description"
	class={cn("text-xs opacity-90", className)}
	{...restProps}
>
	{@render children?.()}
</div>
