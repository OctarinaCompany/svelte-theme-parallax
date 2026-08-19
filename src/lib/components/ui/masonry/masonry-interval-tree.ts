/**
 * A red-black interval tree — a direct, behaviour-preserving port of upstream's
 * `createIntervalTree` (`masonry.tsx` lines 8–426).
 *
 * It answers one question for the masonry positioner: *which item indices have a vertical extent
 * overlapping `[low, high]`?* Mutation is the point, so nothing here is reactive and nothing here
 * touches the DOM — which is what makes the layout parity assertions unit-testable without jsdom.
 */

const NODE_COLOR = {
	RED: 0,
	BLACK: 1,
	SENTINEL: 2,
} as const;

const NODE_OPERATION = {
	REMOVE: 0,
	PRESERVE: 1,
} as const;

type NodeColor = (typeof NODE_COLOR)[keyof typeof NODE_COLOR];
type NodeOperation = (typeof NODE_OPERATION)[keyof typeof NODE_OPERATION];

/** One index stored at a tree node, ordered by descending `high`. */
interface ListNode {
	index: number;
	high: number;
	next: ListNode | null;
}

interface TreeNode {
	max: number;
	low: number;
	high: number;
	color: NodeColor;
	parent: TreeNode;
	right: TreeNode;
	left: TreeNode;
	list: ListNode;
}

interface Tree {
	root: TreeNode;
	size: number;
}

/**
 * The shared leaf terminator. Upstream builds it with `undefined as unknown as TreeNode`; here it is
 * constructed explicitly and then closed over itself, so no assertion widens a real type away. Its
 * `list` is a never-read placeholder — every code path that reads `node.list` has already excluded
 * the sentinel.
 */
function createSentinel(): TreeNode {
	const sentinel: Partial<TreeNode> = {
		low: 0,
		max: 0,
		high: 0,
		color: NODE_COLOR.SENTINEL,
		list: { index: -1, high: 0, next: null },
	};

	const node = sentinel as TreeNode;
	node.parent = node;
	node.left = node;
	node.right = node;

	return node;
}

const SENTINEL_NODE = createSentinel();

/** Insert `index` into a node's descending-`high` list. Returns `false` when it is already there. */
function addInterval(treeNode: TreeNode, high: number, index: number): boolean {
	let node: ListNode | null = treeNode.list;
	let prevNode: ListNode | undefined;

	while (node) {
		if (node.index === index) return false;
		if (high > node.high) break;
		prevNode = node;
		node = node.next;
	}

	if (!prevNode) treeNode.list = { index, high, next: node };
	if (prevNode) prevNode.next = { index, high, next: prevNode.next };

	return true;
}

/**
 * Drop `index` from a node's list. Returns `REMOVE` when the node is now empty and must leave the
 * tree, `PRESERVE` when it still holds other indices, and `undefined` when `index` was not there.
 */
function removeInterval(treeNode: TreeNode, index: number): NodeOperation | undefined {
	let node: ListNode | null = treeNode.list;
	if (node.index === index) {
		if (node.next === null) return NODE_OPERATION.REMOVE;
		treeNode.list = node.next;
		return NODE_OPERATION.PRESERVE;
	}

	let prevNode: ListNode = node;
	node = node.next;

	while (node !== null) {
		if (node.index === index) {
			prevNode.next = node.next;
			return NODE_OPERATION.PRESERVE;
		}
		prevNode = node;
		node = node.next;
	}

	return undefined;
}

function updateMax(node: TreeNode) {
	const max = node.high;
	if (node.left === SENTINEL_NODE && node.right === SENTINEL_NODE) node.max = max;
	else if (node.left === SENTINEL_NODE) node.max = Math.max(node.right.max, max);
	else if (node.right === SENTINEL_NODE) node.max = Math.max(node.left.max, max);
	else node.max = Math.max(Math.max(node.left.max, node.right.max), max);
}

function updateMaxUp(node: TreeNode) {
	let current = node;

	while (current.parent !== SENTINEL_NODE) {
		updateMax(current.parent);
		current = current.parent;
	}
}

function rotateLeft(tree: Tree, x: TreeNode) {
	if (x.right === SENTINEL_NODE) return;
	const y = x.right;
	x.right = y.left;
	if (y.left !== SENTINEL_NODE) y.left.parent = x;
	y.parent = x.parent;

	if (x.parent === SENTINEL_NODE) tree.root = y;
	else if (x === x.parent.left) x.parent.left = y;
	else x.parent.right = y;

	y.left = x;
	x.parent = y;

	updateMax(x);
	updateMax(y);
}

function rotateRight(tree: Tree, x: TreeNode) {
	if (x.left === SENTINEL_NODE) return;
	const y = x.left;
	x.left = y.right;
	if (y.right !== SENTINEL_NODE) y.right.parent = x;
	y.parent = x.parent;

	if (x.parent === SENTINEL_NODE) tree.root = y;
	else if (x === x.parent.right) x.parent.right = y;
	else x.parent.left = y;

	y.right = x;
	x.parent = y;

	updateMax(x);
	updateMax(y);
}

function replaceNode(tree: Tree, x: TreeNode, y: TreeNode) {
	if (x.parent === SENTINEL_NODE) tree.root = y;
	else if (x === x.parent.left) x.parent.left = y;
	else x.parent.right = y;
	y.parent = x.parent;
}

function fixRemove(tree: Tree, node: TreeNode) {
	let x = node;
	let w: TreeNode;

	while (x !== SENTINEL_NODE && x.color === NODE_COLOR.BLACK) {
		if (x === x.parent.left) {
			w = x.parent.right;

			if (w.color === NODE_COLOR.RED) {
				w.color = NODE_COLOR.BLACK;
				x.parent.color = NODE_COLOR.RED;
				rotateLeft(tree, x.parent);
				w = x.parent.right;
			}

			if (w.left.color === NODE_COLOR.BLACK && w.right.color === NODE_COLOR.BLACK) {
				w.color = NODE_COLOR.RED;
				x = x.parent;
			} else {
				if (w.right.color === NODE_COLOR.BLACK) {
					w.left.color = NODE_COLOR.BLACK;
					w.color = NODE_COLOR.RED;
					rotateRight(tree, w);
					w = x.parent.right;
				}

				w.color = x.parent.color;
				x.parent.color = NODE_COLOR.BLACK;
				w.right.color = NODE_COLOR.BLACK;
				rotateLeft(tree, x.parent);
				x = tree.root;
			}
		} else {
			w = x.parent.left;

			if (w.color === NODE_COLOR.RED) {
				w.color = NODE_COLOR.BLACK;
				x.parent.color = NODE_COLOR.RED;
				rotateRight(tree, x.parent);
				w = x.parent.left;
			}

			if (w.right.color === NODE_COLOR.BLACK && w.left.color === NODE_COLOR.BLACK) {
				w.color = NODE_COLOR.RED;
				x = x.parent;
			} else {
				if (w.left.color === NODE_COLOR.BLACK) {
					w.right.color = NODE_COLOR.BLACK;
					w.color = NODE_COLOR.RED;
					rotateLeft(tree, w);
					w = x.parent.left;
				}

				w.color = x.parent.color;
				x.parent.color = NODE_COLOR.BLACK;
				w.left.color = NODE_COLOR.BLACK;
				rotateRight(tree, x.parent);
				x = tree.root;
			}
		}
	}

	x.color = NODE_COLOR.BLACK;
}

function minimumTree(node: TreeNode) {
	let current = node;
	while (current.left !== SENTINEL_NODE) {
		current = current.left;
	}
	return current;
}

function fixInsert(tree: Tree, node: TreeNode) {
	let current = node;
	let y: TreeNode;

	while (current.parent.color === NODE_COLOR.RED) {
		if (current.parent === current.parent.parent.left) {
			y = current.parent.parent.right;

			if (y.color === NODE_COLOR.RED) {
				current.parent.color = NODE_COLOR.BLACK;
				y.color = NODE_COLOR.BLACK;
				current.parent.parent.color = NODE_COLOR.RED;
				current = current.parent.parent;
			} else {
				if (current === current.parent.right) {
					current = current.parent;
					rotateLeft(tree, current);
				}

				current.parent.color = NODE_COLOR.BLACK;
				current.parent.parent.color = NODE_COLOR.RED;
				rotateRight(tree, current.parent.parent);
			}
		} else {
			y = current.parent.parent.left;

			if (y.color === NODE_COLOR.RED) {
				current.parent.color = NODE_COLOR.BLACK;
				y.color = NODE_COLOR.BLACK;
				current.parent.parent.color = NODE_COLOR.RED;
				current = current.parent.parent;
			} else {
				if (current === current.parent.left) {
					current = current.parent;
					rotateRight(tree, current);
				}

				current.parent.color = NODE_COLOR.BLACK;
				current.parent.parent.color = NODE_COLOR.RED;
				rotateLeft(tree, current.parent.parent);
			}
		}
	}
	tree.root.color = NODE_COLOR.BLACK;
}

export interface IntervalTree {
	/** Store `index` as covering `[low, high]`. A duplicate index at the same `low` is a no-op. */
	insert(low: number, high: number, index: number): void;
	/** Forget `index`. An index the tree never held is a no-op. */
	remove(index: number): void;
	/**
	 * Invoke `onCallback(index, low)` for every interval overlapping `[low, high]`, in
	 * tree-traversal order — **not** in index order. Callers must not assume ordering.
	 */
	search(low: number, high: number, onCallback: (index: number, low: number) => void): void;
	/** How many *intervals* are stored; several indices may share one `low`. */
	readonly size: number;
}

export function createIntervalTree(): IntervalTree {
	const tree: Tree = {
		root: SENTINEL_NODE,
		size: 0,
	};

	const indexMap = new Map<number, TreeNode>();

	return {
		insert(low, high, index) {
			let x: TreeNode = tree.root;
			let y: TreeNode = SENTINEL_NODE;

			while (x !== SENTINEL_NODE) {
				y = x;
				if (low === y.low) break;
				if (low < x.low) x = x.left;
				else x = x.right;
			}

			if (low === y.low && y !== SENTINEL_NODE) {
				if (!addInterval(y, high, index)) return;
				y.high = Math.max(y.high, high);
				updateMax(y);
				updateMaxUp(y);
				indexMap.set(index, y);
				tree.size++;
				return;
			}

			const z: TreeNode = {
				low,
				high,
				max: high,
				color: NODE_COLOR.RED,
				parent: y,
				left: SENTINEL_NODE,
				right: SENTINEL_NODE,
				list: { index, high, next: null },
			};

			if (y === SENTINEL_NODE) {
				tree.root = z;
			} else {
				if (z.low < y.low) y.left = z;
				else y.right = z;
				updateMaxUp(z);
			}

			fixInsert(tree, z);
			indexMap.set(index, z);
			tree.size++;
		},

		remove(index) {
			const z = indexMap.get(index);
			if (z === undefined) return;
			indexMap.delete(index);

			const intervalResult = removeInterval(z, index);
			if (intervalResult === undefined) return;
			if (intervalResult === NODE_OPERATION.PRESERVE) {
				z.high = z.list.high;
				updateMax(z);
				updateMaxUp(z);
				tree.size--;
				return;
			}

			let y = z;
			let originalYColor = y.color;
			let x: TreeNode;

			if (z.left === SENTINEL_NODE) {
				x = z.right;
				replaceNode(tree, z, z.right);
			} else if (z.right === SENTINEL_NODE) {
				x = z.left;
				replaceNode(tree, z, z.left);
			} else {
				y = minimumTree(z.right);
				originalYColor = y.color;
				x = y.right;

				if (y.parent === z) {
					x.parent = y;
				} else {
					replaceNode(tree, y, y.right);
					y.right = z.right;
					y.right.parent = y;
				}

				replaceNode(tree, z, y);
				y.left = z.left;
				y.left.parent = y;
				y.color = z.color;
			}

			updateMax(x);
			updateMaxUp(x);

			if (originalYColor === NODE_COLOR.BLACK) fixRemove(tree, x);
			tree.size--;
		},

		search(low, high, onCallback) {
			const stack: TreeNode[] = [tree.root];
			while (stack.length !== 0) {
				const node = stack.pop();
				if (!node) continue;
				if (node === SENTINEL_NODE || low > node.max) continue;
				if (node.left !== SENTINEL_NODE) stack.push(node.left);
				if (node.right !== SENTINEL_NODE) stack.push(node.right);
				if (node.low <= high && node.high >= low) {
					let current: ListNode | null = node.list;
					while (current !== null) {
						if (current.high >= low) onCallback(current.index, node.low);
						current = current.next;
					}
				}
			}
		},

		get size() {
			return tree.size;
		},
	};
}
