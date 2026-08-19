<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { UniqueIdentifier } from "$lib/components/ui/sortable/index.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type KanbanColumnChildProps = {
		id: string;
		"data-slot": "kanban-column";
		"data-value": UniqueIdentifier;
		"data-dragging": "" | undefined;
		"data-disabled": "" | undefined;
		"data-flat-cursor": "" | undefined;
		style: string | undefined;
		class: string;
	} & Record<string, unknown>;

	export type KanbanColumnProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** The column's identifier. Must be one of `Object.keys(value)`. */
		value: UniqueIdentifier;
		/**
		 * Make the column itself the drag activator, instead of requiring a `<Kanban.ColumnHandle>`.
		 * @default false
		 */
		asHandle?: boolean;
		/**
		 * Whether the column is draggable and droppable.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Render the column onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props — spread them, or the column is neither registered nor draggable.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: KanbanColumnChildProps }]>;
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
		KanbanColumnState,
		setKanbanColumnContext,
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
	}: KanbanColumnProps = $props();

	const root = getKanbanContext("Kanban.Column");
	const inBoard = hasKanbanBoardContext();
	const inOverlay = hasKanbanOverlayContext();

	if (!inBoard && !inOverlay) {
		throw new Error(
			"`<Kanban.Column>` must be used within `<Kanban.Board>` or `<Kanban.Overlay>`.",
		);
	}
	// Read through `untrack` because this is a one-shot initialisation check, exactly as upstream
	// runs it once during render.
	if (untrack(() => value) === "") {
		throw new Error("`<Kanban.Column>` value cannot be an empty string");
	}

	const id = $props.id();

	const column = new KanbanColumnState({
		root,
		getValue: () => value,
		getDisabled: () => disabled,
		inOverlay,
		id,
	});

	setKanbanColumnContext(column);

	// An attachment rather than a plain `$effect`, so the registration travels with the spread props
	// and keeps working when the caller supplies their own element through `child`.
	const attachColumn = createAttachmentKey();

	function attach(element: Element): (() => void) | void {
		if (!(element instanceof HTMLElement)) return;

		column.node = element;

		if (!inOverlay) {
			$effect(() => {
				// A column owns no container of its own — it *is* one.
				return column.register(element, null);
			});
		}

		return () => {
			column.node = null;
		};
	}

	function onpointerdown(event: PointerEvent) {
		if (!(event.currentTarget instanceof HTMLElement)) return;
		column.onActivatorPointerDown(event, event.currentTarget);
	}

	function onkeydown(event: KeyboardEvent) {
		column.onActivatorKeydown(event);
	}

	const columnStyle = $derived.by(() => {
		// The drag transform wins: a dragged column follows the pointer and carries no FLIP offset.
		const transform = translate3d(column.transform) ?? translate3d(column.layoutShift);
		let own = transform ? `transform: ${transform};` : "";
		if (column.layoutTransition) own += `transition: ${column.layoutTransition};`;
		// dnd-kit's drop-animation side effect: the column is already sitting in its settled slot
		// while the floating preview glides onto it, hidden until the flight lands.
		if (column.isDropping) own += "opacity: 0;";
		// Caller declarations come last so they win, matching upstream's `..style` spread order.
		const merged = style ? `${own}${style}` : own;
		return merged === "" ? undefined : merged;
	});

	const columnAttrs = $derived({
		id,
		"data-slot": "kanban-column",
		"data-value": value,
		"data-dragging": column.isDragging ? "" : undefined,
		"data-disabled": disabled ? "" : undefined,
		"data-flat-cursor": root.flatCursor ? "" : undefined,
		...restProps,
		// Upstream drops the whole attribute set when the column is disabled; keeping the semantics
		// and dropping only the listeners is what lets a disabled column still announce itself.
		...(asHandle && !inOverlay
			? {
					role: "button" as const,
					...column.activatorAttrs,
					...(disabled ? {} : { onpointerdown, onkeydown }),
				}
			: {}),
		style: columnStyle,
		class: cn(
			"flex size-full flex-col gap-2 rounded-lg border bg-muted p-2.5",
			asHandle && "touch-none select-none",
			root.flatCursor ? "cursor-default" : "data-dragging:cursor-grabbing",
			!column.isDragging && asHandle && !root.flatCursor && "cursor-grab",
			column.isDragging && "opacity-50",
			disabled && "pointer-events-none opacity-50",
			className,
		),
		[attachColumn]: attach,
	} as KanbanColumnChildProps);
</script>

{#if child}
	{@render child({ props: columnAttrs })}
{:else}
	<div bind:this={ref} {...columnAttrs}>
		{@render children?.()}
	</div>
{/if}
