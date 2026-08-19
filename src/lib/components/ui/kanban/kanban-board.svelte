<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { KanbanOrientation } from "./kanban.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type KanbanBoardChildProps = {
		"data-slot": "kanban-board";
		"data-orientation": KanbanOrientation;
		class: string;
	} & Record<string, unknown>;

	export type KanbanBoardProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the board onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: KanbanBoardChildProps }]>;
	};
</script>

<script lang="ts">
	import { getKanbanContext, setKanbanBoardContext } from "./kanban.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: KanbanBoardProps = $props();

	const root = getKanbanContext("Kanban.Board");

	// What a `<Kanban.Column>` checks for: a column is only real inside the board, and only a preview
	// inside the overlay.
	setKanbanBoardContext();

	// `aria-orientation` is deliberately not emitted (as on key-value's list, divergence D-6):
	// upstream sets it on a role-less `<div>`, where it is neither a supported ARIA property nor
	// read by assistive technology. `data-orientation` carries the orientation for styling.
	const boardAttrs = $derived({
		"data-slot": "kanban-board",
		"data-orientation": root.orientation,
		...restProps,
		class: cn(
			"flex size-full gap-4",
			root.orientation === "horizontal" ? "flex-row" : "flex-col",
			className,
		),
	} as KanbanBoardChildProps);
</script>

{#if child}
	{@render child({ props: boardAttrs })}
{:else}
	<div bind:this={ref} {...boardAttrs}>
		{@render children?.()}
	</div>
{/if}
