<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MasonryItemChildProps = {
		"data-slot": "masonry-item";
		"data-index": number;
		"data-column-index": number | undefined;
		"data-measuring": "" | undefined;
		style: string;
		class: string;
	} & Record<string, unknown>;

	export type MasonryItemProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Pins this item's position in the layout order. Defaults to registration (source) order.
		 *
		 * Not present upstream, which derives the same number from child position — something Svelte
		 * cannot see. Supply it when an item is inserted mid-list *after* mount, since registration
		 * would otherwise append it.
		 */
		index?: number;
		/**
		 * Render the item onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props — spread them, or the item is neither positioned nor measured.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: MasonryItemChildProps }]>;
	};

	const BASE_STYLE = "position:absolute;writing-mode:horizontal-tb;";
</script>

<script lang="ts">
	import { createAttachmentKey } from "svelte/attachments";

	import { getMasonryContext } from "./masonry.svelte.js";

	let {
		ref = $bindable(null),
		index: indexProp,
		class: className,
		style,
		children,
		child,
		...restProps
	}: MasonryItemProps = $props();

	const state = getMasonryContext();

	// Registration happens at init, so the very first render already knows the layout index — which
	// is what makes it match source order. The token is opaque and per-instance.
	const token = Symbol("masonry-item");
	state.registerItem(token);

	$effect(() => {
		return () => state.unregisterItem(token);
	});

	const index = $derived(indexProp ?? state.indexOf(token));
	const item = $derived(state.getItem(index));
	const positioned = $derived(state.isVisible(index));
	const measuring = $derived(!positioned && state.isMeasuring(index));

	// An attachment rather than a plain `$effect`, so the measurement wiring travels with the spread
	// props and keeps working when the caller supplies their own element through `child`.
	const measure = createAttachmentKey();

	const itemStyle = $derived.by(() => {
		let own: string;

		if (positioned && item) {
			own = `${BASE_STYLE}visibility:visible;width:${state.columnWidth}px;top:${item.top}px;inset-inline-start:${item.left}px;`;
			if (state.isScrolling) own += "transform:translateZ(0);will-change:transform;";
		} else {
			own = `${BASE_STYLE}visibility:hidden;width:${state.columnWidth}px;z-index:-1000;`;
		}

		// Caller declarations come last so they win, matching upstream's `..child.props.style`.
		return style ? `${own}${style}` : own;
	});

	const itemAttrs = $derived({
		"data-slot": "masonry-item",
		"data-index": index,
		"data-column-index": item?.columnIndex,
		"data-measuring": measuring ? "" : undefined,
		...restProps,
		style: itemStyle,
		class: cn(className),
		[measure]: (element: Element) => {
			if (!(element instanceof HTMLElement)) return;
			return state.observeItem(index, element);
		},
	} as MasonryItemChildProps);
</script>

{#if positioned || measuring}
	{#if child}
		{@render child({ props: itemAttrs })}
	{:else}
		<div bind:this={ref} {...itemAttrs}>
			{@render children?.()}
		</div>
	{/if}
{/if}
