import Root from "./tree.svelte";
import Item from "./tree-item.svelte";
import ItemLabel from "./tree-item-label.svelte";

export type { TreeChildProps, TreeProps, TreeRootProps } from "./tree.svelte";
export type { TreeItemChildProps, TreeItemProps } from "./tree-item.svelte";
export type { TreeItemLabelChildProps, TreeItemLabelProps } from "./tree-item-label.svelte";

export {
	getTreeContext,
	getTreeItemContext,
	hasTreeContext,
	hasTreeItemContext,
	setTreeContext,
	setTreeItemContext,
	TREE_TOGGLE_ICON_TYPES,
	TreeItemInstance,
	TreeState,
	type TreeContextValue,
	type TreeDataLoader,
	type TreeItemContextValue,
	type TreeItemMeta,
	type TreeStateOptions,
	type TreeToggleIconType,
} from "./tree.svelte.js";

// `TreeDragLine` is intentionally absent: it renders the
// drag-and-drop feature's indicator, and that feature is not ported.
export {
	Root,
	Item,
	ItemLabel,
	//
	Root as Tree,
	Item as TreeItem,
	ItemLabel as TreeItemLabel,
};
