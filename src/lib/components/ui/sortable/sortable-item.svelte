<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { UniqueIdentifier } from "./sortable-geometry.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type SortableItemChildProps = {
		id: string;
		"data-slot": "sortable-item";
		"data-dragging": "" | undefined;
		"data-disabled": "" | undefined;
		"data-flat-cursor": "" | undefined;
		style: string | undefined;
		class: string;
	} & Record<string, unknown>;

	export type SortableItemProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** The item's identifier. Must match one produced by the root's `getItemValue`. */
		value: UniqueIdentifier;
		/**
		 * Make the item itself the drag activator, instead of requiring a `<Sortable.ItemHandle>`.
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
		child?: Snippet<[{ props: SortableItemChildProps }]>;
	};

	/** dnd-kit's `useSortable()` default transition, ported unchanged. */
	const ITEM_TRANSITION = "transition: transform 200ms ease;";
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { createAttachmentKey } from "svelte/attachments";

	import { translate3d } from "./sortable-geometry.js";
	import {
		getSortableContentContext,
		getSortableContext,
		hasSortableOverlayContext,
		setSortableItemContext,
		SortableItemState,
	} from "./sortable.svelte.js";

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
	}: SortableItemProps = $props();

	const contentContext = getSortableContentContext();
	const inOverlay = hasSortableOverlayContext();

	if (!contentContext && !inOverlay) {
		throw new Error(
			"`<Sortable.Item>` must be used within `<Sortable.Content>` or `<Sortable.Overlay>`.",
		);
	}
	// Read through `untrack` because this is a one-shot initialisation check, exactly as upstream
	// runs it once during render.
	if (untrack(() => value) === "") {
		throw new Error("`SortableItem` value cannot be an empty string");
	}

	const root = getSortableContext("Sortable.Item");
	const id = $props.id();

	const item = new SortableItemState({
		root,
		getValue: () => value,
		getDisabled: () => disabled,
		getStrategy: () => contentContext?.getStrategy(),
		inOverlay,
		id,
	});

	setSortableItemContext(item);

	// An attachment rather than a plain `$effect`, so the registration travels with the spread props
	// and keeps working when the caller supplies their own element through `child` — which is exactly
	// what the `<Table.Row>` composition does. The function reference is stable, so recomputing the
	// attribute payload during a drag never re-registers.
	const attachItem = createAttachmentKey();

	function attach(element: Element): (() => void) | void {
		if (!(element instanceof HTMLElement)) return;

		item.node = element;

		if (!inOverlay) {
			$effect(() => item.register(element, contentContext?.id ?? null));
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
		const transform = translate3d(item.transform);
		const own = transform ? `transform: ${transform}; ${ITEM_TRANSITION}` : "";
		// Caller declarations come last so they win, matching upstream's `..style` spread order.
		const merged = style ? `${own}${style}` : own;
		return merged === "" ? undefined : merged;
	});

	const itemAttrs = $derived({
		id,
		"data-slot": "sortable-item",
		"data-dragging": item.isDragging ? "" : undefined,
		"data-disabled": disabled ? "" : undefined,
		"data-flat-cursor": root.flatCursor ? "" : undefined,
		...restProps,
		// Upstream drops the whole attribute set when the item is disabled; keeping the semantics and
		// dropping only the listeners is what lets a disabled sortable still announce itself as one.
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
	} as SortableItemChildProps);
</script>

{#if child}
	{@render child({ props: itemAttrs })}
{:else}
	<div bind:this={ref} {...itemAttrs}>
		{@render children?.()}
	</div>
{/if}
