<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type AutocompleteSeparatorProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	/** A rule between two runs of options. */

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AutocompleteSeparatorProps = $props();
</script>

<div
	bind:this={ref}
	role="separator"
	aria-orientation="horizontal"
	data-slot="autocomplete-separator"
	{...restProps}
	class={cn("my-1.5 h-px bg-border", className)}
></div>
