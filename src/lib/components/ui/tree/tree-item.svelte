<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	import type { TreeItemInstance } from "./tree.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TreeItemChildProps = {
		"data-slot": "tree-item";
		role: "treeitem";
		"aria-expanded"?: boolean;
		"aria-selected": boolean;
		"aria-level": number;
		"aria-posinset": number;
		"aria-setsize": number;
		"data-focus": "true" | "false";
		"data-folder": "true" | "false";
		"data-selected": "true" | "false";
		"data-drag-target": "false";
		"data-search-match": "false";
		tabindex: number;
		style: string;
		class: string;
		/**
		 * Registers `element` with the tree's focus registry and returns the matching
		 * unregister callback. `ref` stays `null` in `child` mode, so a caller rendering
		 * through `child` must invoke this (e.g. from its own `$effect`) to keep keyboard
		 * navigation able to land on this row.
		 */
		register: (element: HTMLElement) => () => void;
	} & Record<string, unknown>;

	export type TreeItemProps<T = unknown> = WithElementRef<
		HTMLButtonAttributes,
		HTMLButtonElement
	> & {
		/** The row this element renders — upstream `item`. */
		item: TreeItemInstance<T>;
		/**
		 * Render the row onto your own element instead of the default `<button>`. Replaces
		 * upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent — the payload
		 * carries the merged props plus `register`. In `child` mode `children` is not
		 * rendered; the caller places its own `<Tree.ItemLabel>` (the item context set here
		 * still reaches it), matching how demo 7:100-116 uses `asChild`.
		 */
		child?: Snippet<[{ props: TreeItemChildProps }]>;
	};
</script>

<script lang="ts" generics="T = unknown">
	import {
		getTreeContext,
		setTreeItemContext,
		type TreeItemInstance as Instance,
	} from "./tree.svelte.js";

	let {
		ref = $bindable(null),
		item,
		class: className,
		style,
		onclick,
		onkeydown,
		onfocus,
		child,
		children,
		...restProps
	}: TreeItemProps<T> = $props();

	const ctx = getTreeContext("<Tree.Item>");

	setTreeItemContext({
		get item() {
			return item as Instance<any>;
		},
	});

	const tree = $derived(item.getTree());
	const meta = $derived(item.getItemMeta());
	const folder = $derived(item.isFolder());
	const selected = $derived(item.isSelected());

	function register(element: HTMLElement): () => void {
		return item.registerElement(element);
	}

	$effect(() => {
		if (!ref) return;
		return register(ref);
	});

	// The shared handlers live on TreeState (upstream: `item.getProps()`'s spread handlers,
	// the original source); the caller's own handlers still run after them.
	function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		tree.handleItemClick(item.getId(), event);
		onclick?.(event);
	}

	function handleKeydown(
		event: KeyboardEvent & { currentTarget: EventTarget & HTMLButtonElement },
	) {
		tree.handleItemKeydown(item.getId(), event);
		onkeydown?.(event);
	}

	function handleFocus(event: FocusEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		tree.setFocusedItem(item.getId());
		onfocus?.(event);
	}

	// The `data-*` flags render as "true"/"false" strings because upstream emits booleans
	// through React and the label's `in-data-[selected=true]:*`
	// selectors match on those exact strings. `data-drag-target` and `data-search-match`
	// stay constant "false": the drag and search features are not ported. `aria-expanded`
	// is emitted for folders only — upstream stamps it on leaves too,
	// where ARIA declares it unsupported.
	const itemAttrs = $derived({
		"data-slot": "tree-item",
		role: "treeitem",
		type: "button",
		"aria-expanded": folder ? item.isExpanded() : undefined,
		"aria-selected": selected,
		"aria-level": meta.level + 1,
		"aria-posinset": meta.posInSet,
		"aria-setsize": meta.setSize,
		"data-focus": item.isFocused() ? "true" : "false",
		"data-folder": folder ? "true" : "false",
		"data-selected": selected ? "true" : "false",
		"data-drag-target": "false",
		"data-search-match": "false",
		tabindex: tree.tabbableItemId === item.getId() ? 0 : -1,
		...restProps,
		style: `--tree-padding: ${meta.level * ctx.indent}px;${style ? ` ${style}` : ""}`,
		class: cn(
			"z-10 ps-(--tree-padding) outline-hidden select-none not-last:pb-0.5 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			className,
		),
		onclick: handleClick,
		onkeydown: handleKeydown,
		onfocus: handleFocus,
	} as Omit<TreeItemChildProps, "register">);
</script>

{#if child}
	{@render child({ props: { ...itemAttrs, register } as TreeItemChildProps })}
{:else}
	<button bind:this={ref} {...itemAttrs}>
		{@render children?.()}
	</button>
{/if}
