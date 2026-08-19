<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef } from "$lib/utils.js";

	export type AlertDialogMediaProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: AlertDialogMediaProps = $props();
</script>

<!-- Upstream `AlertDialogMedia` + the vega `cn-alert-dialog-media`
rule (style-vega.css:32-34): an icon/illustration well the Header grid detects by its
`data-slot`. The `*:[svg..]` selector sizes an unsized child icon to 8, so callers pass icons
bare, per the house icon rule; in a default-size content it spans both header rows so title
and description line up beside it. -->
<div
	bind:this={ref}
	data-slot="alert-dialog-media"
	class={cn(
		"mb-2 inline-flex size-16 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
