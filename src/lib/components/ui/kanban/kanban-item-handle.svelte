<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type KanbanItemHandleChildProps = {
		type: "button";
		"data-slot": "kanban-item-handle";
		"aria-controls": string;
		"aria-disabled": "true" | undefined;
		"data-dragging": "" | undefined;
		"data-disabled": "" | undefined;
		"data-flat-cursor": "" | undefined;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type KanbanItemHandleProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
		/**
		 * Render the handle onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element — this is how the handle composes onto
		 * `<Button>`.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: KanbanItemHandleChildProps }]>;
	};
</script>

<script lang="ts">
	import { getKanbanItemContext } from "./kanban.svelte.js";

	let {
		ref = $bindable(null),
		disabled,
		class: className,
		children,
		child,
		...restProps
	}: KanbanItemHandleProps = $props();

	// Read before anything else, so a handle with no `<Kanban.Item>` above it fails with the message
	// that names both parts.
	const item = getKanbanItemContext();
	const root = item.root;

	/** The item's `disabled` is inherited; an explicit value on the handle wins. */
	const isDisabled = $derived(disabled ?? item.disabled);

	function onpointerdown(event: PointerEvent) {
		if (!(event.currentTarget instanceof HTMLElement)) return;
		item.onActivatorPointerDown(event, event.currentTarget);
	}

	function onkeydown(event: KeyboardEvent) {
		item.onActivatorKeydown(event);
	}

	const handleAttrs = $derived({
		type: "button" as const,
		"data-slot": "kanban-item-handle",
		"aria-controls": item.id,
		"aria-disabled": isDisabled ? ("true" as const) : undefined,
		"data-dragging": item.isDragging ? "" : undefined,
		"data-disabled": isDisabled ? "" : undefined,
		"data-flat-cursor": root.flatCursor ? "" : undefined,
		...restProps,
		// The element is already a button, so dnd-kit's `role` is not reproduced here.
		...(isDisabled ? {} : { ...item.activatorAttrs, onpointerdown, onkeydown }),
		disabled: isDisabled,
		class: cn(
			"select-none disabled:pointer-events-none disabled:opacity-50",
			root.flatCursor ? "cursor-default" : "cursor-grab data-dragging:cursor-grabbing",
			className,
		),
	} as KanbanItemHandleChildProps);
</script>

{#if child}
	{@render child({ props: handleAttrs })}
{:else}
	<button bind:this={ref} {...handleAttrs}>
		{@render children?.()}
	</button>
{/if}
