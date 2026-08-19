<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef } from "$lib/utils.js";

	export type AlertDialogHeaderProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: AlertDialogHeaderProps = $props();
</script>

<!-- Upstream `AlertDialogHeader` + the vega `cn-alert-dialog-header`
rule (style-vega.css:28-30). The grid re-shapes itself twice without any JS: a Media child adds
a row (`has-data-[slot=alert-dialog-media]`), and the default-size content left-aligns the
whole header from `sm:` up while the sm size stays centered (dialog-box style). -->
<div
	bind:this={ref}
	data-slot="alert-dialog-header"
	class={cn(
		"grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
