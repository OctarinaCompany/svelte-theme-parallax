<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type BannerTitleProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: BannerTitleProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="banner-title"
	class={cn("text-sm leading-none font-medium", className)}
	{...restProps}
>
	{@render children?.()}
</div>
