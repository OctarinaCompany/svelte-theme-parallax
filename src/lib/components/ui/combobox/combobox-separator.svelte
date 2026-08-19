<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type ComboboxSeparatorProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	/** A rule between two runs of options. */

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxSeparatorProps = $props();
</script>

<div
	bind:this={ref}
	role="separator"
	aria-orientation="horizontal"
	data-slot="combobox-separator"
	{...restProps}
	class={cn("-mx-1 my-1 h-px bg-border", className)}
></div>
