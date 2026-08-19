<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { UniqueIdentifier } from "$lib/components/ui/sortable/index.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type KanbanItemChildProps = {
		id: string;
		"data-slot": "kanban-item";
		"data-value": UniqueIdentifier;
		"data-dragging": "" | undefined;
		"data-disabled": "" | undefined;
		"data-flat-cursor": "" | undefined;
		style: string | undefined;
		class: string;
	} & Record<string, unknown>;

	export type KanbanItemProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** The item's identifier. Must match one produced by the root's `getItemValue`. */
		value: UniqueIdentifier;
		/**
		 * Make the item itself the drag activator, instead of requiring a `<Kanban.ItemHandle>`.
		 * @default false
		 */
		asHandle?: boolean;
		/**
		 * Whether the item is draggable and droppable.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Render the item onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props — spread them, or the item is neither registered nor draggable.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: KanbanItemChildProps }]>;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { createAttachmentKey } from "svelte/attachments";

	import { translate3d } from "$lib/components/ui/sortable/index.js";

	import {
		getKanbanContext,
		hasKanbanBoardContext,
		hasKanbanOverlayContext,
		KanbanItemState,
		peekKanbanColumnContext,
		setKanbanItemContext,
	} from "./kanban.svelte.js";

	let {
		ref = $bindable(null),
		value,
		asHandle = false,
		disabled = false,
		class: className,
		style,
		children,
		child,
		...restProps
	}: KanbanItemProps = $props();

	const root = getKanbanContext("Kanban.Item");
	const inBoard = hasKanbanBoardContext();
	const inOverlay = hasKanbanOverlayContext();

	if (!inBoard && !inOverlay) {
		throw new Error("`<Kanban.Item>` must be used within `<Kanban.Board>` or `<Kanban.Overlay>`.");
	}
	// Read through `untrack` because this is a one-shot initialisation check, exactly as upstream
	// runs it once during render.
	if (untrack(() => value) === "") {
		throw new Error("`<Kanban.Item>` value cannot be an empty string");
	}

	const id = $props.id();
	// The enclosing column, so a cross-column drag knows where the item came from. An item inside a
	// bare overlay preview has none, and never registers anyway.
	const column = peekKanbanColumnContext();

	const item = new KanbanItemState({
		root,
		getValue: () => value,
		getDisabled: () => disabled,
		inOverlay,
		id,
	});

	setKanbanItemContext(item);

	// An attachment rather than a plain `$effect`, so the registration travels with the spread props
	// and keeps working when the caller supplies their own element through `child`.
	const attachItem = createAttachmentKey();

	function attach(element: Element): (() => void) | void {
		if (!(element instanceof HTMLElement)) return;

		item.node = element;

		if (!inOverlay) {
			$effect(() => {
				return item.register(element, column?.value ?? null);
			});
		}

		return () => {
			item.node = null;
		};
	}

	function onpointerdown(event: PointerEvent) {
		if (!(event.currentTarget instanceof HTMLElement)) return;
		item.onActivatorPointerDown(event, event.currentTarget);
	}

	function onkeydown(event: KeyboardEvent) {
		item.onActivatorKeydown(event);
	}

	const itemStyle = $derived.by(() => {
		// The drag transform wins: a dragged item follows the pointer and never carries a FLIP offset.
		const transform = translate3d(item.transform) ?? translate3d(item.layoutShift);
		let own = transform ? `transform: ${transform};` : "";
		if (item.layoutTransition) own += `transition: ${item.layoutTransition};`;
		// dnd-kit's drop-animation side effect: the item is already sitting in its settled slot
		// while the floating preview glides onto it, hidden until the flight lands.
		if (item.isDropping) own += "opacity: 0;";
		// Caller declarations come last so they win, matching upstream's `..style` spread order.
		const merged = style ? `${own}${style}` : own;
		return merged === "" ? undefined : merged;
	});

	const itemAttrs = $derived({
		id,
		"data-slot": "kanban-item",
		"data-value": value,
		"data-dragging": item.isDragging ? "" : undefined,
		"data-disabled": disabled ? "" : undefined,
		"data-flat-cursor": root.flatCursor ? "" : undefined,
		...restProps,
		// Upstream drops the whole attribute set when the item is disabled; keeping the semantics and
		// dropping only the listeners is what lets a disabled item still announce itself.
		...(asHandle && !inOverlay
			? {
					role: "button" as const,
					...item.activatorAttrs,
					...(disabled ? {} : { onpointerdown, onkeydown }),
				}
			: {}),
		style: itemStyle,
		class: cn(
			"focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-hidden",
			asHandle && "touch-none select-none",
			root.flatCursor ? "cursor-default" : "data-dragging:cursor-grabbing",
			!item.isDragging && asHandle && !root.flatCursor && "cursor-grab",
			item.isDragging && "opacity-50",
			disabled && "pointer-events-none opacity-50",
			className,
		),
		[attachItem]: attach,
	} as KanbanItemChildProps);
</script>

{#if child}
	{@render child({ props: itemAttrs })}
{:else}
	<div bind:this={ref} {...itemAttrs}>
		{@render children?.()}
	</div>
{/if}
