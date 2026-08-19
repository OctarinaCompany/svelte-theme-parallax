<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef, WithoutChildren } from "$lib/utils.js";

	export type DataGridShortcutCardProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	> & {
		/** The keys, in press order. Rendered as `A + B + C`. */
		keys: string[];
		/** What the shortcut does. */
		description: string;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		keys,
		description,
		class: className,
		...restProps
	}: DataGridShortcutCardProps = $props();
</script>

<!--
	Upstream composes shadcn's `Kbd` / `KbdGroup`, which are not installed here and cannot be added
	mid-port; a `<kbd>` styled with semantic tokens is the same element with the same semantics.
-->
<div
	bind:this={ref}
	data-slot="data-grid-shortcut-card"
	class={cn("flex items-center gap-4 px-3 py-2", className)}
	{...restProps}
>
	<span class="flex-1 text-sm">{description}</span>
	<span class="flex shrink-0 items-center gap-1">
		{#each keys as key, index (key)}
			{#if index > 0}
				<span class="text-xs text-muted-foreground">+</span>
			{/if}
			<kbd
				data-slot="data-grid-kbd"
				class="rounded border bg-secondary px-1.5 py-0.5 font-mono text-[11.2px] text-secondary-foreground shadow-xs select-none"
			>
				{key}
			</kbd>
		{/each}
	</span>
</div>
