<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** How the toolbar lays its buttons out, and what `aria-orientation` reports. */
	export type EditableToolbarOrientation = "horizontal" | "vertical";

	/** The merged attribute payload handed to the `child` snippet. */
	export type EditableToolbarChildProps = {
		role: "toolbar";
		"aria-controls": string;
		"aria-orientation": EditableToolbarOrientation;
		dir: Direction;
		"data-slot": "editable-toolbar";
		"data-orientation": EditableToolbarOrientation;
		class: string;
	} & Record<string, unknown>;

	export type EditableToolbarProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir">,
		HTMLDivElement
	> & {
		/**
		 * The toolbar's layout and reported orientation.
		 *
		 * @default "horizontal"
		 */
		orientation?: EditableToolbarOrientation;
		/**
		 * Render the toolbar onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: EditableToolbarChildProps }]>;
		/** The submit and cancel buttons. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getEditableContext } from "./editable.svelte.js";

	let {
		ref = $bindable(null),
		orientation = "horizontal",
		class: className,
		child,
		children,
		...restProps
	}: EditableToolbarProps = $props();

	const root = getEditableContext("<Editable.Toolbar>");

	// `data-orientation` is an addition (divergence D-7): upstream sets only `aria-orientation`, and
	// every piece of state has to be stylable from the outside.
	const toolbarAttrs = $derived({
		role: "toolbar",
		"aria-controls": root.rootId,
		"aria-orientation": orientation,
		"data-slot": "editable-toolbar",
		"data-orientation": orientation,
		dir: root.dir,
		...restProps,
		class: cn("flex items-center gap-2", orientation === "vertical" && "flex-col", className),
	} as EditableToolbarChildProps);
</script>

{#if child}
	{@render child({ props: toolbarAttrs })}
{:else}
	<div bind:this={ref} {...toolbarAttrs}>
		{@render children?.()}
	</div>
{/if}
