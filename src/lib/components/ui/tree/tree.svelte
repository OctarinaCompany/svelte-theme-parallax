<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { TreeState, TreeToggleIconType } from "./tree.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TreeChildProps = {
		"data-slot": "tree";
		role: "tree";
		"aria-multiselectable": "true";
		style: string;
		class: string;
	} & Record<string, unknown>;

	export type TreeRootProps<T = unknown> = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * The state driving this view. Upstream `tree` is the
		 * `useTree` store from `@headless-tree/react`; here it is the runes-based
		 * {@link TreeState}, constructed where the demos call `useTree`. Optional for
		 * upstream parity — items reach their own state through their instance.
		 */
		tree?: TreeState<T>;
		/**
		 * Pixels of start padding added per depth level, published as `--tree-indent` so
		 * layered guides can read it.
		 *
		 * @default 20
		 */
		indent?: number;
		/**
		 * Which affordance folders render in the default label. Upstream defaults the prop
		 * to `"chevron"` even though the bare context default says
		 * `"plus-minus"`; the prop default is the one that can ever apply.
		 *
		 * @default "chevron"
		 */
		toggleIconType?: TreeToggleIconType;
		/**
		 * Render the root onto your own element instead of the default `<div>`. Replaces
		 * upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TreeChildProps }]>;
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link TreeRootProps}. */
	export type TreeProps<T = unknown> = TreeRootProps<T>;
</script>

<script lang="ts" generics="T = unknown">
	import { setTreeContext } from "./tree.svelte.js";

	let {
		ref = $bindable(null),
		tree,
		indent = 20,
		toggleIconType = "chevron",
		class: className,
		style,
		child,
		children,
		...restProps
	}: TreeRootProps<T> = $props();

	setTreeContext({
		get indent() {
			return indent;
		},
		get toggleIconType() {
			return toggleIconType;
		},
		get tree() {
			return tree as TreeState<any> | undefined;
		},
	});

	// `role="tree"` is what upstream's `tree.getContainerProps()` spread contributes
	//; spreading it keeps the compiler's static a11y analysis from
	// demanding literal tabindex here — the roving tab stop lives on the items.
	// `aria-multiselectable` is a deliberate divergence: upstream's getContainerProps()
	// omits it even though the click handlers implement Ctrl/Shift multi-select —
	// matching the documented aria-expanded divergence in tree-item.svelte.
	const rootAttrs = $derived({
		"data-slot": "tree",
		role: "tree",
		"aria-multiselectable": "true",
		...restProps,
		style: `--tree-indent: ${indent}px;${style ? ` ${style}` : ""}`,
		class: cn("flex flex-col", className),
	} as TreeChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
