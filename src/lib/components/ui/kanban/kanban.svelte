<script lang="ts" module>
	import type { Snippet } from "svelte";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import type {
		SortableModifier,
		SortableStrategy,
		UniqueIdentifier,
	} from "$lib/components/ui/sortable/index.js";

	import type {
		KanbanAccessibility,
		KanbanDragEvent,
		KanbanMoveEvent,
		KanbanOrientation,
		KanbanValue,
	} from "./kanban.svelte.js";

	/**
	 * The root renders no element of its own — upstream's `DndContext` renders only its children plus
	 * dnd-kit's accessibility nodes — so it has no `ref`, no `class` and no `child` snippet.
	 */
	export type KanbanRootProps<T> = {
		/**
		 * The controlled board: an ordered map of column identifier to that column's ordered items.
		 * Upstream requires it; here it is optional so {@link defaultValue} can seed an uncontrolled
		 * board.
		 */
		value?: KanbanValue<T>;
		/**
		 * Initial board when uncontrolled. Read once, during initialisation.
		 * @default {}
		 */
		defaultValue?: KanbanValue<T>;
		/** Called with the whole new board on every committed move. */
		onValueChange?: (columns: KanbanValue<T>) => void;
		/**
		 * Callback that returns a unique identifier for each kanban item. Required for array of
		 * objects.
		 *
		 * ```svelte
		 * getItemValue={(item) => item.id}
		 * ```
		 */
		getItemValue?: (item: T) => UniqueIdentifier;
		/**
		 * Called on drop with the move the drag amounts to. It **intercepts** the column reorder,
		 * which is only ever committed on drop, suppressing both the default splice and
		 * `onValueChange`; it **reports** the same-column item reorder, which `onDragOver` has already
		 * published through `onValueChange` so that the board reflows under the pointer.
		 */
		onMove?: (event: KanbanMoveEvent) => void;
		/**
		 * The orientation of the board.
		 * @default "horizontal"
		 */
		orientation?: KanbanOrientation;
		/**
		 * Accepted for API parity and applied to nothing — upstream stores it on its context and no
		 * consumer ever reads it.
		 * @default verticalListSortingStrategy
		 */
		strategy?: SortableStrategy;
		/** Clamps the dragged element's transform. */
		modifiers?: SortableModifier[];
		/**
		 * Whether to use a neutral cursor instead of the grab/grabbing drag affordance.
		 * @default false
		 */
		flatCursor?: boolean;
		/**
		 * Explicit text direction. When omitted, resolves the nearest `<DirectionProvider>`, then an
		 * ancestor `[dir]`, then `"ltr"`.
		 */
		dir?: Direction;
		/** Base id for the live region and the screen-reader instructions element. */
		id?: string;
		/** Per-key override of the announcements and of the upfront instructions. */
		accessibility?: KanbanAccessibility;
		/** Fires when a column or item is picked up, by pointer or by keyboard. */
		onDragStart?: (event: KanbanDragEvent) => void;
		/** Fires on every move frame. */
		onDragMove?: (event: KanbanDragEvent) => void;
		/** Fires only when the drop target changes, before the mid-drag commit. */
		onDragOver?: (event: KanbanDragEvent) => void;
		/** Fires on a drop, before the reorder is committed. */
		onDragEnd?: (event: KanbanDragEvent) => void;
		/**
		 * Fires on `Escape`, on a pointer cancel, and when the active identifier is removed from the
		 * board mid-drag.
		 */
		onDragCancel?: (event: KanbanDragEvent) => void;
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link KanbanRootProps}. */
	export type KanbanProps<T> = KanbanRootProps<T>;
</script>

<script lang="ts" generics="T">
	import { untrack } from "svelte";

	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { verticalListSortingStrategy } from "$lib/components/ui/sortable/index.js";

	import {
		assertKanbanItemValueGetter,
		KanbanRootState,
		setKanbanContext,
	} from "./kanban.svelte.js";

	// `$props.id()` is only legal as a top-level `const` initialiser, so the generated id is created
	// here and used as the `id` prop's default.
	const generatedId = $props.id();

	let {
		value = $bindable(),
		defaultValue = {},
		onValueChange,
		getItemValue,
		onMove,
		orientation = "horizontal",
		strategy = verticalListSortingStrategy,
		modifiers,
		flatCursor = false,
		dir,
		id = generatedId,
		accessibility,
		onDragStart,
		onDragMove,
		onDragOver,
		onDragEnd,
		onDragCancel,
		children,
	}: KanbanRootProps<T> = $props();

	// Uncontrolled seed. This is a one-shot initialisation, so `defaultValue` is read through
	// `untrack`, and the write is guarded rather than written `value ??= …` — the latter compiles to
	// an unconditional assignment and would notify a controlled parent of a change that never
	// happened.
	if (value === undefined) value = untrack(() => defaultValue);

	// Upstream's runtime rule, evaluated once at first render while the raw items are still in scope.
	untrack(() => assertKanbanItemValueGetter(value, getItemValue));

	const reader = useDirection({ dir: () => dir });

	const state = new KanbanRootState({
		getValue: () => value ?? {},
		setValue: (next) => {
			const columns = next as KanbanValue<T>;
			value = columns;
			onValueChange?.(columns);
		},
		getItemValue: (item) => (getItemValue ? getItemValue(item as T) : (item as UniqueIdentifier)),
		getOrientation: () => orientation,
		getStrategy: () => strategy,
		getModifiers: () => modifiers,
		getFlatCursor: () => flatCursor,
		getDir: () => reader.current,
		getAccessibility: () => accessibility,
		getOnMove: () => onMove,
		getOnDragStart: () => onDragStart,
		getOnDragMove: () => onDragMove,
		getOnDragOver: () => onDragOver,
		getOnDragEnd: () => onDragEnd,
		getOnDragCancel: () => onDragCancel,
		// The two accessibility node ids are minted once, like React's `useId`.
		id: untrack(() => id),
	});

	setKanbanContext(state);

	// The active identifier disappearing from `value` mid-drag cancels the session rather than letting
	// it commit against stale indices. Both reads are external state and the write is untracked, so
	// this cannot loop.
	$effect(() => {
		const activeId = state.activeId;
		const identifiers = state.identifiers;
		if (activeId === null || identifiers.includes(activeId)) return;
		untrack(() => state.dnd.cancel());
	});

	// The engine's document listeners, touch-activation timer, pointer capture and any drop flight
	// still gliding all belong to this component's lifetime.
	$effect(() => () => state.destroy());
</script>

{@render children?.()}
<div
	id={state.liveRegionId}
	role="status"
	aria-live="assertive"
	aria-atomic="true"
	data-slot="kanban-live-region"
	class="sr-only"
>
	{state.announcement}
</div>
<div id={state.instructionsId} data-slot="kanban-instructions" class="sr-only">
	{state.instructions}
</div>
