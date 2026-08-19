<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { TreeItemInstance } from "./tree.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TreeItemLabelChildProps = {
		"data-slot": "tree-item-label";
		class: string;
	} & Record<string, unknown>;

	export type TreeItemLabelProps<T = unknown> = WithElementRef<
		HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	> & {
		/**
		 * Explicit item override. Defaults to the enclosing `<Tree.Item>`'s item — upstream's
		 * `propItem || currentItem` fallback.
		 */
		item?: TreeItemInstance<T>;
		/**
		 * Render the label onto your own element instead of the default `<span>`. Replaces
		 * upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode neither `children` nor the default toggle-icon/name content is rendered —
		 * the caller owns the element's content.
		 */
		child?: Snippet<[{ props: TreeItemLabelChildProps }]>;
	};
</script>

<script lang="ts" generics="T = unknown">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import MinusIcon from "@lucide/svelte/icons/minus";
	import PlusIcon from "@lucide/svelte/icons/plus";

	import {
		getTreeContext,
		getTreeItemContext,
		hasTreeItemContext,
		type TreeItemContextValue,
	} from "./tree.svelte.js";

	let {
		ref = $bindable(null),
		item,
		class: className,
		child,
		children,
		...restProps
	}: TreeItemLabelProps<T> = $props();

	const ctx = getTreeContext("<Tree.ItemLabel>");
	// Resolved once at init like any context read; the label may legitimately stand outside
	// a `<Tree.Item>` when the `item` prop supplies the row directly.
	const itemCtx: TreeItemContextValue | undefined = hasTreeItemContext()
		? getTreeItemContext("<Tree.ItemLabel>")
		: undefined;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const resolvedItem = $derived((item as TreeItemInstance<any> | undefined) ?? itemCtx?.item);

	/**
	 * Ported from the original source with four deliberate edits:
	 * - `in-data-[search-match=true]:bg-blue-50!` is dropped — the search feature is not
	 *   ported, and the raw palette colour has no place among semantic tokens anyway.
	 * - The `style-vega:rounded-sm … style-sera:rounded-none` multi-style ladder collapses to
	 *   `rounded-sm`, the radius the house menu rows use (dropdown-menu-item.svelte).
	 * - Icon sizing moves off the icons onto the `[&_svg:not([class*='size-'])]:size-4`
	 *   selector, the same rule `ui/button` uses — upstream's 3.5 plus/minus glyphs render at
	 *   size-4 as a result.
	 * - `bg-background` is dropped, and the row is TRANSPARENT AT REST. Upstream paints the row
	 *   with the page ground because its own tree sits directly on the page, where an opaque
	 *   fill is invisible and masks the guide rails behind the text. Put the same tree inside a
	 *   Card — which is where every tree in this kit sits — and it paints `--background` over
	 *   `--card`, so each row reads as a darker patch on the surface holding it. A row should
	 *   take the colour of whatever it is placed on; the rails are a demo-level effect, and the
	 *   page that draws them knocks them out behind its own labels (`TreePage.svelte`).
	 */
	const labelAttrs = $derived({
		"data-slot": "tree-item-label",
		...restProps,
		class: cn(
			"flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent",
			"in-data-[drag-target=true]:bg-accent in-data-[selected=true]:bg-accent in-data-[selected=true]:text-accent-foreground",
			"in-focus-visible:ring-[3px] in-focus-visible:ring-ring/50",
			"not-in-data-[folder=true]:ps-7",
			"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			className,
		),
	} as TreeItemLabelChildProps);
</script>

<!-- Upstream warns and renders null without an item; same here,
     minus the console noise — the barrel types already steer callers inside <Tree.Item>. -->
{#if resolvedItem}
	{#if child}
		{@render child({ props: labelAttrs })}
	{:else}
		<span bind:this={ref} {...labelAttrs}>
			{#if resolvedItem.isFolder()}
				{#if ctx.toggleIconType === "plus-minus"}
					{#if resolvedItem.isExpanded()}
						<MinusIcon class="text-muted-foreground" />
					{:else}
						<PlusIcon class="text-muted-foreground" />
					{/if}
				{:else}
					<!-- Rotation keys off the item button's aria-expanded, exactly as upstream's
					     `in-aria-[expanded=false]`. -->
					<ChevronDownIcon class="text-muted-foreground in-aria-[expanded=false]:-rotate-90" />
				{/if}
			{/if}
			{#if children}
				{@render children()}
			{:else}
				{resolvedItem.getItemName()}
			{/if}
		</span>
	{/if}
{/if}
