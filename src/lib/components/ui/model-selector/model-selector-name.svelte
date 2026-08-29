<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ModelSelectorNameProps = WithElementRef<HTMLAttributes<HTMLSpanElement>>;
</script>

<script lang="ts">
	/**
	 * The model's name. Takes the row's free width and truncates, so a long name yields to the
	 * logo before it and the description or shortcut after it rather than wrapping the row.
	 * `text-left` because the same span sits inside a trigger `Button`, which centres its text.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ModelSelectorNameProps = $props();
</script>

<span
	bind:this={ref}
	data-slot="model-selector-name"
	class={cn("flex-1 truncate text-left", className)}
	{...restProps}
>
	{@render children?.()}
</span>
