<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { SortableOrientation, SortableStrategy } from "./sortable-geometry.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type SortableContentChildProps = {
		"data-slot": "sortable-content";
		"data-orientation": SortableOrientation;
		class: string;
	} & Record<string, unknown>;

	export type SortableContentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Per-region sorting strategy override. Defaults to the root's. */
		strategy?: SortableStrategy;
		/**
		 * Render the items with no wrapping element at all, for layouts where an extra wrapper would
		 * break the parent's contract.
		 * @default false
		 */
		withoutSlot?: boolean;
		/**
		 * Render the region onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: SortableContentChildProps }]>;
	};
</script>

<script lang="ts">
	import { getSortableContext, setSortableContentContext } from "./sortable.svelte.js";

	let {
		ref = $bindable(null),
		strategy,
		withoutSlot = false,
		class: className,
		children,
		child,
		...restProps
	}: SortableContentProps = $props();

	const root = getSortableContext("Sortable.Content");

	// Every region under one root shares the identifier space, but a drag stays inside the region it
	// started in — this id is what the engine matches on.
	const id = $props.id();
	setSortableContentContext({ id, getStrategy: () => strategy });

	const contentAttrs = $derived({
		"data-slot": "sortable-content",
		"data-orientation": root.orientation,
		...restProps,
		class: cn(className),
	} as SortableContentChildProps);
</script>

{#if withoutSlot}
	{@render children?.()}
{:else if child}
	{@render child({ props: contentAttrs })}
{:else}
	<div bind:this={ref} {...contentAttrs}>
		{@render children?.()}
	</div>
{/if}
