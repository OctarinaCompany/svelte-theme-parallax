<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type SelectionToolbarSeparatorChildProps = {
		role: "separator";
		"aria-orientation": "vertical";
		"aria-hidden": "true";
		"data-slot": "selection-toolbar-separator";
		class: string;
	} & Record<string, unknown>;

	export type SelectionToolbarSeparatorProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * Render the separator onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: SelectionToolbarSeparatorChildProps }]>;
	};
</script>

<script lang="ts">
	import { getSelectionToolbarContext } from "./selection-toolbar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		child,
		children,
		...restProps
	}: SelectionToolbarSeparatorProps = $props();

	// Guard only: the separator renders nothing that depends on the root's state, but a separator
	// outside a toolbar is a composition mistake worth naming (divergence D-7).
	getSelectionToolbarContext("<SelectionToolbar.Separator>");

	const separatorAttrs = $derived({
		role: "separator",
		"aria-orientation": "vertical",
		"aria-hidden": "true",
		"data-slot": "selection-toolbar-separator",
		...restProps,
		class: cn("mx-0.5 h-6 w-px bg-border", className),
	} as SelectionToolbarSeparatorChildProps);
</script>

{#if child}
	{@render child({ props: separatorAttrs })}
{:else}
	<div bind:this={ref} {...separatorAttrs}>
		{@render children?.()}
	</div>
{/if}
