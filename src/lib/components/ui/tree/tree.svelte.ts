import { getContext, hasContext, setContext } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import { getDirectionAwareKey } from "$lib/shared/roving-focus.svelte.js";

/**
 * Runes-based replacement for the `@headless-tree/core` store upstream renders against
 * (the original source plus `useTree` in every demo). The demos enable exactly two of that
 * library's features — `syncDataLoaderFeature` and `hotkeysCoreFeature` — so this module
 * hand-ports those two behaviours (synchronous data resolution, expand/collapse, selection,
 * WAI-ARIA tree keyboard navigation) instead of bridging the React adapter's
 * subscribe/re-render store into Svelte. The drag-and-drop, search and rename features are
 * not ported: no demo uses them, and `TreeDragLine` goes with them.
 *
 * The item registry here is intentionally NOT `src/lib/shared/`'s `DomOrderedCollection`:
 * a tree's row order is defined by the data (the flattened visible list), never by scanning
 * the DOM. Only `getDirectionAwareKey` is shared with the roving-focus machinery, so RTL
 * swaps the horizontal arrows the same way everywhere.
 */

/** Every value `toggleIconType` accepts, in upstream declaration order. */
export const TREE_TOGGLE_ICON_TYPES = ["chevron", "plus-minus"] as const;

/** `'chevron' | 'plus-minus'` — upstream `ToggleIconType`. */
export type TreeToggleIconType = (typeof TREE_TOGGLE_ICON_TYPES)[number];

/**
 * Synchronous item accessors, shaped exactly like the `dataLoader` every upstream demo hands
 * to `useTree`: resolve a payload by id, resolve ordered child ids.
 */
export type TreeDataLoader<T> = {
	/** Resolve one item's payload by id. */
	getItem: (itemId: string) => T;
	/** Resolve the ordered child ids of `itemId`. Leaves may return `[]` or `undefined`. */
	getChildren: (itemId: string) => readonly string[] | undefined;
};

/**
 * One visible row's position, the shape `item.getItemMeta()` exposes — upstream reads
 * `.level` off it for the indent padding.
 */
export type TreeItemMeta = {
	readonly itemId: string;
	/** The parent's id — `rootItemId` for top-level items. */
	readonly parentId: string;
	/** Depth below the never-rendered root: top-level items sit at level 0. */
	readonly level: number;
	/** Row index in the flattened visible list. */
	readonly index: number;
	/** 1-based position among the parent's children (rendered as `aria-posinset`). */
	readonly posInSet: number;
	/** The parent's child count (rendered as `aria-setsize`). */
	readonly setSize: number;
};

export type TreeStateOptions<T> = {
	/**
	 * Id of the conceptual root. Like `@headless-tree/core`, the root itself never renders:
	 * its children are the top-level rows, which is why the demos can leave `"crm"` out of
	 * `expandedItems` and still see the whole tree.
	 */
	rootItemId: string;
	dataLoader: TreeDataLoader<T>;
	/** Display name for an item. Defaults to `String(item.getItemData())`. */
	getItemName?: (item: TreeItemInstance<T>) => string;
	/** Whether an item can hold children. Defaults to "has at least one child id". */
	isItemFolder?: (item: TreeItemInstance<T>) => boolean;
	/** Mirrors `useTree`'s `initialState`. */
	initialState?: {
		expandedItems?: readonly string[];
		selectedItems?: readonly string[];
		focusedItem?: string | null;
	};
	onExpandedItemsChange?: (expandedItems: string[]) => void;
	onSelectedItemsChange?: (selectedItems: string[]) => void;
	onFocusedItemChange?: (focusedItem: string | null) => void;
};

/**
 * One instance per userland tree, constructed where upstream demos call `useTree` and passed
 * to `<Tree.Root tree={...}>`. Every mutator with an observable state change pairs with an
 * `on*Change` callback fired only on a real change, matching the house `$bindable` rule.
 */
export class TreeState<T = unknown> {
	// `$derived` below is lazy at runtime (evaluated only when the field is read), but
	// svelte-check's static analysis cannot see that and flags the field as used before its
	// constructor assignment.
	#options!: TreeStateOptions<T>;

	#expandedItems = $state<string[]>([]);
	#selectedItems = $state<string[]>([]);
	#focusedItem = $state<string | null>(null);

	/**
	 * Where a Shift+Click range starts: the last plainly clicked item. Read only inside
	 * handlers, never rendered — so not `$state`.
	 */
	#selectionAnchor: string | null = null;

	/**
	 * Instance cache keyed by id, so `item.getId()` stays a stable `{#each}` key across
	 * re-derivations. Plain `Map`: creating an instance is not a reactive write, the
	 * instances themselves read reactive state lazily.
	 */
	#instances = new Map<string, TreeItemInstance<T>>();

	/** DOM nodes for keyboard focus moves. Plain `Map` for the same reason as `#instances`. */
	#elements = new Map<string, HTMLElement>();

	/**
	 * The flattened visible rows, depth-first through the expanded set — the order
	 * `tree.getItems()` hands to every demo's `{#each}`.
	 */
	readonly visibleMetas: readonly TreeItemMeta[] = $derived.by(() => this.#flatten());

	readonly #metaById: ReadonlyMap<string, TreeItemMeta> = $derived(
		new Map(this.visibleMetas.map((meta) => [meta.itemId, meta])),
	);

	/**
	 * The single tab stop (roving tabindex): the focused item while it is visible, otherwise
	 * the first visible row.
	 */
	readonly tabbableItemId: string | null = $derived.by(() => {
		if (this.#focusedItem !== null && this.#metaById.has(this.#focusedItem)) {
			return this.#focusedItem;
		}
		return this.visibleMetas[0]?.itemId ?? null;
	});

	constructor(options: TreeStateOptions<T>) {
		this.#options = options;
		this.#expandedItems = [...(options.initialState?.expandedItems ?? [])];
		this.#selectedItems = [...(options.initialState?.selectedItems ?? [])];
		this.#focusedItem = options.initialState?.focusedItem ?? null;
	}

	get rootItemId(): string {
		return this.#options.rootItemId;
	}

	get expandedItems(): readonly string[] {
		return this.#expandedItems;
	}

	get selectedItems(): readonly string[] {
		return this.#selectedItems;
	}

	get focusedItem(): string | null {
		return this.#focusedItem;
	}

	/** The visible rows as instances — upstream `tree.getItems()`. */
	getItems(): TreeItemInstance<T>[] {
		return this.visibleMetas.map((meta) => this.getItemInstance(meta.itemId));
	}

	getItemInstance(itemId: string): TreeItemInstance<T> {
		let instance = this.#instances.get(itemId);
		if (!instance) {
			instance = new TreeItemInstance(this, itemId);
			this.#instances.set(itemId, instance);
		}
		return instance;
	}

	getItemData(itemId: string): T {
		return this.#options.dataLoader.getItem(itemId);
	}

	getItemName(itemId: string): string {
		const { getItemName } = this.#options;
		return getItemName
			? getItemName(this.getItemInstance(itemId))
			: String(this.getItemData(itemId));
	}

	/**
	 * Meta of a visible row. Rows under a collapsed parent are never rendered, so the
	 * level-0 fallback only shows on out-of-tree reads and keeps callers branch-free.
	 */
	getItemMeta(itemId: string): TreeItemMeta {
		return (
			this.#metaById.get(itemId) ?? {
				itemId,
				parentId: this.#options.rootItemId,
				level: 0,
				index: -1,
				posInSet: 1,
				setSize: 1,
			}
		);
	}

	isFolder(itemId: string): boolean {
		const { isItemFolder } = this.#options;
		if (isItemFolder) return isItemFolder(this.getItemInstance(itemId));
		return (this.#options.dataLoader.getChildren(itemId) ?? []).length > 0;
	}

	isExpanded(itemId: string): boolean {
		return this.#expandedItems.includes(itemId);
	}

	isSelected(itemId: string): boolean {
		return this.#selectedItems.includes(itemId);
	}

	isFocused(itemId: string): boolean {
		return this.#focusedItem === itemId;
	}

	setExpandedItems(next: readonly string[]): void {
		if (
			this.#expandedItems.length === next.length &&
			this.#expandedItems.every((id, i) => id === next[i])
		) {
			return;
		}
		this.#expandedItems = [...next];
		this.#options.onExpandedItemsChange?.([...next]);
	}

	expandItem(itemId: string): void {
		if (this.isExpanded(itemId)) return;
		this.setExpandedItems([...this.#expandedItems, itemId]);
	}

	collapseItem(itemId: string): void {
		if (!this.isExpanded(itemId)) return;
		this.setExpandedItems(this.#expandedItems.filter((id) => id !== itemId));
	}

	toggleExpanded(itemId: string): void {
		if (this.isExpanded(itemId)) this.collapseItem(itemId);
		else this.expandItem(itemId);
	}

	setSelectedItems(next: readonly string[]): void {
		if (
			this.#selectedItems.length === next.length &&
			this.#selectedItems.every((id, i) => id === next[i])
		) {
			return;
		}
		this.#selectedItems = [...next];
		this.#options.onSelectedItemsChange?.([...next]);
	}

	selectItem(itemId: string): void {
		this.setSelectedItems([itemId]);
	}

	toggleItemSelection(itemId: string): void {
		if (this.isSelected(itemId)) {
			this.setSelectedItems(this.#selectedItems.filter((id) => id !== itemId));
		} else {
			this.setSelectedItems([...this.#selectedItems, itemId]);
		}
	}

	/** State-only focus move — what an item's DOM `focusin` reports back. */
	setFocusedItem(itemId: string | null): void {
		if (this.#focusedItem === itemId) return;
		this.#focusedItem = itemId;
		this.#options.onFocusedItemChange?.(itemId);
	}

	/** State + DOM focus move — what keyboard navigation performs. */
	focusItem(itemId: string): void {
		this.setFocusedItem(itemId);
		this.#elements.get(itemId)?.focus();
	}

	registerItemElement(itemId: string, element: HTMLElement): void {
		this.#elements.set(itemId, element);
	}

	unregisterItemElement(itemId: string, element: HTMLElement): void {
		// Guarded delete: on a re-register the new element lands before the old effect's
		// teardown runs, and an unconditional delete would drop the live registration.
		if (this.#elements.get(itemId) === element) this.#elements.delete(itemId);
	}

	/**
	 * Pointer behaviour of the two ported features: plain click focuses, selects, and toggles
	 * a folder; Ctrl/Cmd toggles the item in the selection; Shift extends a range over the
	 * visible rows from the last plainly clicked anchor. Enter/Space arrive here too, as the
	 * native `<button>` click.
	 */
	handleItemClick(itemId: string, event: MouseEvent): void {
		this.setFocusedItem(itemId);
		if (event.shiftKey) {
			const metas = this.visibleMetas;
			const anchorIndex = metas.findIndex((m) => m.itemId === (this.#selectionAnchor ?? itemId));
			const targetIndex = metas.findIndex((m) => m.itemId === itemId);
			if (anchorIndex !== -1 && targetIndex !== -1) {
				const [start, end] =
					anchorIndex <= targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
				this.setSelectedItems(metas.slice(start, end + 1).map((m) => m.itemId));
			}
		} else if (event.ctrlKey || event.metaKey) {
			this.#selectionAnchor = itemId;
			this.toggleItemSelection(itemId);
		} else {
			this.#selectionAnchor = itemId;
			this.selectItem(itemId);
			if (this.isFolder(itemId)) this.toggleExpanded(itemId);
		}
	}

	/**
	 * The `hotkeysCoreFeature` bindings, per the WAI-ARIA tree pattern: Up/Down walk the
	 * visible rows, Home/End jump to the ends, Right expands a folder (or steps into it when
	 * already open), Left collapses (or steps out to the parent). Enter/Space are left to the
	 * native button click. Horizontal arrows swap under `dir="rtl"`, resolved from the row's
	 * computed style so no direction prop needs threading.
	 */
	handleItemKeydown(itemId: string, event: KeyboardEvent): void {
		const metas = this.visibleMetas;
		const index = metas.findIndex((m) => m.itemId === itemId);
		if (index === -1) return;

		const element = event.currentTarget as HTMLElement | null;
		const dir: Direction = element && getComputedStyle(element).direction === "rtl" ? "rtl" : "ltr";

		let handled = true;
		switch (getDirectionAwareKey(event.key, dir)) {
			case "ArrowDown":
				this.#focusRow(index + 1);
				break;
			case "ArrowUp":
				this.#focusRow(index - 1);
				break;
			case "Home":
				this.#focusRow(0);
				break;
			case "End":
				this.#focusRow(metas.length - 1);
				break;
			case "ArrowRight": {
				if (!this.isFolder(itemId)) {
					handled = false;
					break;
				}
				if (!this.isExpanded(itemId)) {
					this.expandItem(itemId);
				} else if (metas[index + 1]?.parentId === itemId) {
					this.#focusRow(index + 1);
				}
				break;
			}
			case "ArrowLeft": {
				if (this.isFolder(itemId) && this.isExpanded(itemId)) {
					this.collapseItem(itemId);
				} else {
					const parentId = metas[index]!.parentId;
					if (parentId !== this.#options.rootItemId) {
						const parentIndex = metas.findIndex((m) => m.itemId === parentId);
						if (parentIndex !== -1) this.#focusRow(parentIndex);
					}
				}
				break;
			}
			default:
				handled = false;
		}
		if (handled) event.preventDefault();
	}

	#focusRow(index: number): void {
		const metas = this.visibleMetas;
		if (metas.length === 0) return;
		const meta = metas[Math.max(0, Math.min(index, metas.length - 1))]!;
		this.focusItem(meta.itemId);
	}

	#flatten(): TreeItemMeta[] {
		const out: TreeItemMeta[] = [];
		// Guards against cyclic child references, which would otherwise recurse forever —
		// a hazard the synchronous loader shares with any user-supplied adjacency map.
		const visited = new Set<string>([this.#options.rootItemId]);
		const walk = (parentId: string, level: number): void => {
			const children = this.#options.dataLoader.getChildren(parentId) ?? [];
			children.forEach((childId, i) => {
				if (visited.has(childId)) return;
				visited.add(childId);
				out.push({
					itemId: childId,
					parentId,
					level,
					index: out.length,
					posInSet: i + 1,
					setSize: children.length,
				});
				if (this.isExpanded(childId) && this.isFolder(childId)) walk(childId, level + 1);
			});
		};
		walk(this.#options.rootItemId, 0);
		return out;
	}
}

/**
 * The per-row facade, method-compatible with `@headless-tree/core`'s `ItemInstance` where the
 * upstream component and demos touch it (the original source demo 3:110-146):
 * `getId`, `getItemData`, `getItemName`, `getItemMeta`, `isFolder`, `isExpanded`,
 * `isSelected`, `isFocused`, `isDragTarget`, `isMatchingSearch`. The last two are constant
 * `false` because the drag and search features are not ported — kept so the upstream
 * `data-*` contract (and any styling hung off it) stays satisfiable.
 */
export class TreeItemInstance<T = unknown> {
	readonly #tree: TreeState<T>;
	readonly #id: string;

	constructor(tree: TreeState<T>, itemId: string) {
		this.#tree = tree;
		this.#id = itemId;
	}

	getId(): string {
		return this.#id;
	}

	/** The owning {@link TreeState} — how `<Tree.Item>` reaches the shared handlers. */
	getTree(): TreeState<T> {
		return this.#tree;
	}

	getItemData(): T {
		return this.#tree.getItemData(this.#id);
	}

	getItemName(): string {
		return this.#tree.getItemName(this.#id);
	}

	getItemMeta(): TreeItemMeta {
		return this.#tree.getItemMeta(this.#id);
	}

	isFolder(): boolean {
		return this.#tree.isFolder(this.#id);
	}

	isExpanded(): boolean {
		return this.#tree.isExpanded(this.#id);
	}

	isSelected(): boolean {
		return this.#tree.isSelected(this.#id);
	}

	isFocused(): boolean {
		return this.#tree.isFocused(this.#id);
	}

	/** Always `false`: the drag-and-drop feature is not ported. */
	isDragTarget(): boolean {
		return false;
	}

	/** Always `false`: the search feature is not ported. */
	isMatchingSearch(): boolean {
		return false;
	}

	expand(): void {
		this.#tree.expandItem(this.#id);
	}

	collapse(): void {
		this.#tree.collapseItem(this.#id);
	}

	toggleExpanded(): void {
		this.#tree.toggleExpanded(this.#id);
	}

	select(): void {
		this.#tree.selectItem(this.#id);
	}

	/**
	 * Wire this row's DOM node into the tree's focus registry; returns the matching
	 * unregister callback, in the shape `$effect` teardown expects.
	 */
	registerElement(element: HTMLElement): () => void {
		this.#tree.registerItemElement(this.#id, element);
		return () => this.#tree.unregisterItemElement(this.#id, element);
	}
}

/**
 * What `<Tree.Root>` publishes — upstream `TreeContextValue` minus `currentItem`,
 * which moves to its own per-item context so a label always reads its
 * *nearest* `<Tree.Item>` rather than a single mutable slot.
 */
export type TreeContextValue = {
	readonly indent: number;
	readonly toggleIconType: TreeToggleIconType;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly tree: TreeState<any> | undefined;
};

/** What `<Tree.Item>` publishes — upstream's `currentItem` slot. */
export type TreeItemContextValue = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly item: TreeItemInstance<any>;
};

const TREE_CONTEXT_KEY = Symbol("tree");
const TREE_ITEM_CONTEXT_KEY = Symbol("tree-item");

export function setTreeContext(context: TreeContextValue): TreeContextValue {
	return setContext(TREE_CONTEXT_KEY, context);
}

export function hasTreeContext(): boolean {
	return hasContext(TREE_CONTEXT_KEY);
}

/** Read the root's context, throwing when there is no `<Tree.Root>` ancestor. */
export function getTreeContext(consumerName: string): TreeContextValue {
	if (!hasTreeContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<Tree.Root>\`.`);
	}
	return getContext<TreeContextValue>(TREE_CONTEXT_KEY);
}

export function setTreeItemContext(context: TreeItemContextValue): TreeItemContextValue {
	return setContext(TREE_ITEM_CONTEXT_KEY, context);
}

export function hasTreeItemContext(): boolean {
	return hasContext(TREE_ITEM_CONTEXT_KEY);
}

/** Read the enclosing item's context, throwing when there is no `<Tree.Item>` ancestor. */
export function getTreeItemContext(consumerName: string): TreeItemContextValue {
	if (!hasTreeItemContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<Tree.Item>\`.`);
	}
	return getContext<TreeItemContextValue>(TREE_ITEM_CONTEXT_KEY);
}
