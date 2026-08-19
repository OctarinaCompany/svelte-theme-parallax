<script lang="ts" module>
	import type { Snippet } from "svelte";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";

	import type {
		SortableCollisionDetection,
		SortableModifier,
		SortableOrientation,
		SortableStrategy,
		UniqueIdentifier,
	} from "./sortable-geometry.js";
	import type {
		SortableAccessibility,
		SortableDragEvent,
		SortableMoveEvent,
	} from "./sortable.svelte.js";

	/**
	 * The root renders no element of its own — upstream's `DndContext` renders only its children plus
	 * its accessibility nodes — so it has no `ref`, no `class` and no `child` snippet.
	 */
	export type SortableRootProps<T> = {
		/**
		 * The controlled list. Upstream requires it; here it is optional so {@link defaultValue} can
		 * seed an uncontrolled list.
		 */
		value?: T[];
		/**
		 * Initial list when uncontrolled. Read once, during initialisation.
		 * @default []
		 */
		defaultValue?: T[];
		/** Called with the reordered array on every committed reorder. Not called when `onMove` is set. */
		onValueChange?: (items: T[]) => void;
		/**
		 * Callback that returns a unique identifier for each sortable item. Required for array of
		 * objects.
		 *
		 * ```svelte
		 * getItemValue={(item) => item.id}
		 * ```
		 */
		getItemValue?: (item: T) => UniqueIdentifier;
		/** Intercepts the reorder: suppresses both the default array splice and `onValueChange`. */
		onMove?: (event: SortableMoveEvent) => void;
		/**
		 * The orientation of the list. Selects the default modifiers, strategy and collision detection.
		 * @default "vertical"
		 */
		orientation?: SortableOrientation;
		/** Overrides the per-orientation sorting transform strategy. */
		strategy?: SortableStrategy;
		/** Overrides the per-orientation collision detection. */
		collisionDetection?: SortableCollisionDetection;
		/** Replaces the per-orientation modifier list wholesale. */
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
		accessibility?: SortableAccessibility;
		/** Fires when an item is picked up, by pointer or by keyboard. */
		onDragStart?: (event: SortableDragEvent) => void;
		/** Fires on every move frame. */
		onDragMove?: (event: SortableDragEvent) => void;
		/** Fires only when the drop target changes. */
		onDragOver?: (event: SortableDragEvent) => void;
		/** Fires on a drop over a droppable, before the reorder is committed. */
		onDragEnd?: (event: SortableDragEvent) => void;
		/**
		 * Fires on `Escape`, on a drop outside any droppable, and when the active item is removed from
		 * the list mid-drag.
		 */
		onDragCancel?: (event: SortableDragEvent) => void;
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link SortableRootProps}. */
	export type SortableProps<T> = SortableRootProps<T>;
</script>

<script lang="ts" generics="T">
	import { untrack } from "svelte";

	import { useDirection } from "$lib/components/ui/direction-provider/index.js";

	import { arrayMove } from "./sortable-geometry.js";
	import {
		assertItemValueGetter,
		setSortableContext,
		SortableRootState,
		toItemValues,
	} from "./sortable.svelte.js";

	// `$props.id()` is only legal as a top-level `const` initialiser, so the generated id is created
	// here and used as the `id` prop's default.
	const generatedId = $props.id();

	let {
		value = $bindable(),
		defaultValue = [],
		onValueChange,
		getItemValue,
		onMove,
		orientation = "vertical",
		strategy,
		collisionDetection,
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
	}: SortableRootProps<T> = $props();

	// Uncontrolled seed. This is a one-shot initialisation, so `defaultValue` is read through
	// `untrack`, and the write is guarded rather than written `value ??= …` — the latter compiles to
	// an unconditional assignment and would notify a controlled parent of a change that never
	// happened.
	if (value === undefined) value = untrack(() => defaultValue);

	// Upstream's runtime rule, evaluated once at first render while the raw items are still in scope.
	untrack(() => assertItemValueGetter(value, getItemValue));

	const reader = useDirection({ dir: () => dir });

	const items = $derived(toItemValues(value, getItemValue));

	const state = new SortableRootState({
		getItems: () => items,
		getCount: () => items.length,
		getOrientation: () => orientation,
		getStrategy: () => strategy,
		getCollisionDetection: () => collisionDetection,
		getModifiers: () => modifiers,
		getFlatCursor: () => flatCursor,
		getDir: () => reader.current,
		getAccessibility: () => accessibility,
		commit: (activeIndex, overIndex, event) => {
			if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return;

			if (onMove) {
				onMove({ ...event, activeIndex, overIndex });
				return;
			}

			const next = arrayMove(value ?? [], activeIndex, overIndex);
			value = next;
			onValueChange?.(next);
		},
		getOnDragStart: () => onDragStart,
		getOnDragMove: () => onDragMove,
		getOnDragOver: () => onDragOver,
		getOnDragEnd: () => onDragEnd,
		getOnDragCancel: () => onDragCancel,
		// The two accessibility node ids are minted once, like React's `useId`.
		id: untrack(() => id),
	});

	setSortableContext(state);

	// The active item disappearing from `value` mid-drag cancels the session rather than letting it
	// commit against stale indices. Both reads are external state, and the write is
	// untracked, so this cannot loop.
	$effect(() => {
		const activeId = state.activeId;
		if (activeId === null || items.includes(activeId)) return;
		untrack(() => state.dnd.cancel());
	});

	// The engine's document listeners, touch-activation timer and pointer capture all belong to this
	// component's lifetime.
	$effect(() => () => state.dnd.destroy());
</script>

{@render children?.()}
<div
	id={state.liveRegionId}
	role="status"
	aria-live="assertive"
	aria-atomic="true"
	data-slot="sortable-live-region"
	class="sr-only"
>
	{state.announcement}
</div>
<div id={state.instructionsId} data-slot="sortable-instructions" class="sr-only">
	{state.instructions}
</div>
