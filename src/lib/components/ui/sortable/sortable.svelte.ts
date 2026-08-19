/**
 * The component layer: the root and item state classes, the four `Symbol`-keyed contexts and the
 * announcement builders.
 *
 * Everything sortable-specific lives here — `sortable-geometry.ts` and `sortable-dnd.svelte.ts`
 * stay free of `value`, orientation and screen-reader knowledge so `kanban` can import them
 * unchanged.
 */

import { getContext, hasContext, setContext, tick } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

import { DndState, type DndNodeEntry, type DragSession } from "./sortable-dnd.svelte.js";
import {
	closestCenter,
	closestCorners,
	horizontalListSortingStrategy,
	rectSortingStrategy,
	resolveKeyboardIndex,
	restrictToHorizontalAxis,
	restrictToParentElement,
	restrictToVerticalAxis,
	verticalListSortingStrategy,
	type ClientRect,
	type Coordinates,
	type SortableArrowKey,
	type SortableCollisionDetection,
	type SortableModifier,
	type SortableOrientation,
	type SortableStrategy,
	type UniqueIdentifier,
} from "./sortable-geometry.js";

export type { SortableOrientation };

/** Upstream's `DragStartEvent` / `DragEndEvent`, narrowed to the two members a consumer can act on. */
export type SortableDragEvent = {
	active: { id: UniqueIdentifier };
	over: { id: UniqueIdentifier } | null;
};

export type SortableMoveEvent = SortableDragEvent & {
	activeIndex: number;
	overIndex: number;
};

/** What the move / over / end announcement builders receive. */
export type SortableAnnouncementArgs = SortableMoveEvent & { count: number };

/** What the pick-up and cancel announcement builders receive. */
export type SortableSessionAnnouncementArgs = {
	active: { id: UniqueIdentifier };
	activeIndex: number;
	count: number;
};

export type SortableAnnouncements = {
	onDragStart: (event: SortableSessionAnnouncementArgs) => string;
	onDragMove: (event: SortableAnnouncementArgs) => string;
	onDragOver: (event: SortableAnnouncementArgs) => string;
	onDragEnd: (event: SortableAnnouncementArgs) => string;
	onDragCancel: (event: SortableSessionAnnouncementArgs) => string;
};

export type SortableAccessibility = {
	/** Per-key override — anything left unsupplied keeps its default text. */
	announcements?: Partial<SortableAnnouncements>;
	screenReaderInstructions?: { draggable: string };
};

const NO_DROPPABLE_ANNOUNCEMENT =
	"Sortable item is no longer over a droppable area. Press escape to cancel.";

/** Copied verbatim from the original implementation, punctuation and 1-based positions included. */
export const DEFAULT_SORTABLE_ANNOUNCEMENTS: SortableAnnouncements = {
	onDragStart: ({ active, activeIndex, count }) =>
		`Grabbed sortable item "${active.id}". Current position is ${activeIndex + 1} of ${count}. Use arrow keys to move, space to drop.`,
	onDragOver: ({ active, over, activeIndex, overIndex, count }) =>
		over
			? `Sortable item "${active.id}" moved ${overIndex > activeIndex ? "down" : "up"} to position ${overIndex + 1} of ${count}.`
			: NO_DROPPABLE_ANNOUNCEMENT,
	onDragMove: ({ active, over, activeIndex, overIndex, count }) =>
		over
			? `Sortable item "${active.id}" is moving ${overIndex > activeIndex ? "down" : "up"} to position ${overIndex + 1} of ${count}.`
			: NO_DROPPABLE_ANNOUNCEMENT,
	onDragEnd: ({ active, over, overIndex, count }) =>
		over
			? `Sortable item "${active.id}" dropped at position ${overIndex + 1} of ${count}.`
			: `Sortable item "${active.id}" dropped. No changes were made.`,
	onDragCancel: ({ active, activeIndex, count }) =>
		`Sorting cancelled. Sortable item "${active.id}" returned to position ${activeIndex + 1} of ${count}.`,
};

/** Upstream `orientationConfig`, with `mixed`'s implicit default made explicit. */
const ORIENTATION_CONFIG: Record<
	SortableOrientation,
	{
		modifiers: SortableModifier[];
		strategy: SortableStrategy;
		collisionDetection: SortableCollisionDetection;
	}
> = {
	vertical: {
		modifiers: [restrictToVerticalAxis, restrictToParentElement],
		strategy: verticalListSortingStrategy,
		collisionDetection: closestCenter,
	},
	horizontal: {
		modifiers: [restrictToHorizontalAxis, restrictToParentElement],
		strategy: horizontalListSortingStrategy,
		collisionDetection: closestCenter,
	},
	mixed: {
		modifiers: [restrictToParentElement],
		strategy: rectSortingStrategy,
		collisionDetection: closestCorners,
	},
};

const ZERO_RECT: ClientRect = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };

function arrowWordsFor(orientation: SortableOrientation): string {
	if (orientation === "vertical") return "up and down";
	if (orientation === "horizontal") return "left and right";
	return "arrow";
}

/**
 * Upstream's runtime rule: object arrays must say how to identify an item.
 * Evaluated where the raw `value` is still in scope, so it surfaces on first render.
 */
export function assertItemValueGetter<T>(
	value: T[] | undefined,
	getItemValue: ((item: T) => UniqueIdentifier) | undefined,
): void {
	if (getItemValue || !value?.length) return;
	const first = value[0];
	if (typeof first === "object" && first !== null) {
		throw new Error("`getItemValue` is required when using array of objects");
	}
}

/** The identifier space: `value.map(getItemValue)`, or the items themselves for primitives. */
export function toItemValues<T>(
	value: T[] | undefined,
	getItemValue: ((item: T) => UniqueIdentifier) | undefined,
): UniqueIdentifier[] {
	if (!value) return [];
	if (getItemValue) return value.map(getItemValue);
	return value.map((item) => item as unknown as UniqueIdentifier);
}

export type SortableRootStateProps = {
	readonly getItems: () => UniqueIdentifier[];
	readonly getCount: () => number;
	readonly getOrientation: () => SortableOrientation;
	readonly getStrategy: () => SortableStrategy | undefined;
	readonly getCollisionDetection: () => SortableCollisionDetection | undefined;
	readonly getModifiers: () => SortableModifier[] | undefined;
	readonly getFlatCursor: () => boolean;
	readonly getDir: () => Direction;
	readonly getAccessibility: () => SortableAccessibility | undefined;
	/** Performs the reorder. Never called when the drop produced no change. */
	readonly commit: (activeIndex: number, overIndex: number, event: SortableDragEvent) => void;
	readonly getOnDragStart: () => ((event: SortableDragEvent) => void) | undefined;
	readonly getOnDragMove: () => ((event: SortableDragEvent) => void) | undefined;
	readonly getOnDragOver: () => ((event: SortableDragEvent) => void) | undefined;
	readonly getOnDragEnd: () => ((event: SortableDragEvent) => void) | undefined;
	readonly getOnDragCancel: () => ((event: SortableDragEvent) => void) | undefined;
	/** The one `$props.id()` the live region and instructions ids derive from. */
	readonly id: string;
};

/** One instance per `<Sortable>`. Published on context; every part reads it. */
export class SortableRootState {
	// `$derived` below is lazy at runtime, but svelte-check's static analysis cannot see that and
	// flags the field as used before its constructor assignment.
	#props!: SortableRootStateProps;

	readonly dnd: DndState;

	readonly items: UniqueIdentifier[] = $derived(this.#props.getItems());
	readonly count: number = $derived(this.#props.getCount());
	readonly orientation: SortableOrientation = $derived(this.#props.getOrientation());
	readonly flatCursor: boolean = $derived(this.#props.getFlatCursor());
	readonly dir: Direction = $derived(this.#props.getDir());

	readonly config = $derived.by(() => {
		const base = ORIENTATION_CONFIG[this.orientation];
		return {
			modifiers: this.#props.getModifiers() ?? base.modifiers,
			strategy: this.#props.getStrategy() ?? base.strategy,
			collisionDetection: this.#props.getCollisionDetection() ?? base.collisionDetection,
		};
	});

	readonly activeIndex: number = $derived(
		this.activeId === null ? -1 : this.items.indexOf(this.activeId),
	);
	readonly overIndex: number = $derived(
		this.overId === null ? -1 : this.items.indexOf(this.overId),
	);

	/** Incremented by every mounted `<Sortable.Overlay>`; suppresses the dragged item's transform. */
	overlayCount = $state(0);
	readonly hasOverlay: boolean = $derived(this.overlayCount > 0);

	/** The live region's text. Written only when it actually changes. */
	announcement = $state("");

	readonly instructions: string = $derived(
		this.#props.getAccessibility()?.screenReaderInstructions?.draggable ??
			`To pick up a sortable item, press space or enter. While dragging, use the ${arrowWordsFor(this.orientation)} keys to move the item. Press space or enter again to drop the item in its new position, or press escape to cancel.`,
	);

	readonly liveRegionId: string = $derived(`${this.#props.id}-live`);
	readonly instructionsId: string = $derived(`${this.#props.id}-instructions`);

	readonly #announcements: SortableAnnouncements = $derived.by(() => {
		const overrides = this.#props.getAccessibility()?.announcements;
		return {
			onDragStart: overrides?.onDragStart ?? DEFAULT_SORTABLE_ANNOUNCEMENTS.onDragStart,
			onDragMove: overrides?.onDragMove ?? DEFAULT_SORTABLE_ANNOUNCEMENTS.onDragMove,
			onDragOver: overrides?.onDragOver ?? DEFAULT_SORTABLE_ANNOUNCEMENTS.onDragOver,
			onDragEnd: overrides?.onDragEnd ?? DEFAULT_SORTABLE_ANNOUNCEMENTS.onDragEnd,
			onDragCancel: overrides?.onDragCancel ?? DEFAULT_SORTABLE_ANNOUNCEMENTS.onDragCancel,
		};
	});

	constructor(props: SortableRootStateProps) {
		this.#props = props;

		this.dnd = new DndState({
			getItems: () => this.items,
			getModifiers: () => this.config.modifiers,
			getCollisionDetection: () => this.config.collisionDetection,
			// Cross-region dragging is out of scope: a drag resolves only against the region it
			// started in.
			filterDroppables: (candidates, active) =>
				candidates.filter((candidate) => candidate.containerId === active.containerId),
			onStart: (session) => this.#onSessionStart(session),
			onMove: (session) => this.#onSessionMove(session),
			onOver: (session) => this.#onSessionOver(session),
			onEnd: (session) => this.#onSessionEnd(session),
			onCancel: (session) => this.#onSessionCancel(session),
			onArrowKey: (key, session) => this.resolveArrowKey(key, session),
		});
	}

	// Plain getters rather than `$derived` fields: `dnd` is assigned in the constructor, so a field
	// initializer reading it would be a use-before-initialization. `dnd.activeId` is itself derived,
	// so reading through a getter stays reactive.
	get activeId(): UniqueIdentifier | null {
		return this.dnd.activeId;
	}

	get overId(): UniqueIdentifier | null {
		return this.dnd.overId;
	}

	indexOf(value: UniqueIdentifier): number {
		return this.items.indexOf(value);
	}

	/**
	 * The transform an item renders with: nothing while idle, the sorting strategy's shift for every
	 * other item, and — for the dragged item — nothing when an overlay is mounted, or the clamped
	 * pointer delta when there is none.
	 */
	getItemTransform(value: UniqueIdentifier, strategy?: SortableStrategy): Coordinates | null {
		const session = this.dnd.session;
		if (!session) return null;

		if (value === session.activeId) return this.hasOverlay ? null : session.transform;

		const activeIndex = this.activeIndex;
		const overIndex = this.overIndex;
		const index = this.indexOf(value);
		if (activeIndex < 0 || overIndex < 0 || index < 0) return null;

		return (strategy ?? this.config.strategy)({
			index,
			activeIndex,
			overIndex,
			rects: this.items.map((id) => session.rects.get(id) ?? ZERO_RECT),
			activeRect: session.activeRect,
		});
	}

	/** The floating element's clamped delta. */
	getOverlayTransform(): Coordinates | null {
		return this.dnd.session?.transform ?? null;
	}

	/** The active item's snapshot box, which the floating element is sized and placed from. */
	getOverlayRect(): ClientRect | null {
		return this.dnd.session?.activeRect ?? null;
	}

	/** Write the live region, but only when the text actually changed. */
	announce(text: string): void {
		if (text !== this.announcement) this.announcement = text;
	}

	/** Which index an arrow key moves the grabbed item to, measured from its current drop target. */
	resolveArrowKey(key: SortableArrowKey, session: DragSession): number | null {
		const containerId = this.dnd.getEntry(session.activeId)?.containerId ?? null;

		const candidates = this.items.map((id) => {
			const entry = this.dnd.getEntry(id);
			return {
				id,
				// An item in another region is not a target, for the same reason the pointer path
				// filters droppables by region.
				disabled: (entry?.disabled() ?? true) || (entry?.containerId ?? null) !== containerId,
				rect: session.rects.get(id) ?? null,
			};
		});

		return resolveKeyboardIndex({
			key,
			orientation: this.orientation,
			dir: this.dir,
			activeIndex: this.items.indexOf(session.overId ?? session.activeId),
			candidates,
		});
	}

	#eventOf(session: DragSession): SortableDragEvent {
		return {
			active: { id: session.activeId },
			over: session.overId === null ? null : { id: session.overId },
		};
	}

	#announcementArgs(session: DragSession): SortableAnnouncementArgs {
		const event = this.#eventOf(session);
		return {
			...event,
			activeIndex: this.items.indexOf(session.activeId),
			overIndex: session.overId === null ? -1 : this.items.indexOf(session.overId),
			count: this.count,
		};
	}

	#onSessionStart(session: DragSession): void {
		const event = this.#eventOf(session);
		this.#props.getOnDragStart()?.(event);
		this.announce(
			this.#announcements.onDragStart({
				active: event.active,
				activeIndex: session.initialIndex,
				count: this.count,
			}),
		);
	}

	#onSessionOver(session: DragSession): void {
		this.#props.getOnDragOver()?.(this.#eventOf(session));
		this.announce(this.#announcements.onDragOver(this.#announcementArgs(session)));
	}

	#onSessionMove(session: DragSession): void {
		this.#props.getOnDragMove()?.(this.#eventOf(session));
		this.announce(this.#announcements.onDragMove(this.#announcementArgs(session)));
	}

	/**
	 * Keep the grabbed activator focused across the reorder: committing a keyboard drop relocates the
	 * item's node, and relocating a focused node runs the removal steps first, which blurs it. The
	 * restore is scheduled after the commit so `tick()` resolves once the node is back in place.
	 */
	#retainFocus(session: DragSession): void {
		if (session.source !== "keyboard") return;

		const element = document.activeElement;
		if (!(element instanceof HTMLElement)) return;

		void tick().then(() => {
			if (element.isConnected && document.activeElement !== element) element.focus();
		});
	}

	#onSessionEnd(session: DragSession): void {
		const event = this.#eventOf(session);
		const args = this.#announcementArgs(session);

		// A release with nothing under it commits nothing: it is routed to `onDragCancel`, while the
		// announcement stays upstream's "dropped, no changes were made" text.
		if (session.overId === null) {
			this.#props.getOnDragCancel()?.(event);
			this.announce(this.#announcements.onDragEnd(args));
			return;
		}

		this.#props.getOnDragEnd()?.(event);
		this.announce(this.#announcements.onDragEnd(args));
		this.#props.commit(args.activeIndex, args.overIndex, event);
		this.#retainFocus(session);
	}

	#onSessionCancel(session: DragSession): void {
		const event = this.#eventOf(session);
		this.#props.getOnDragCancel()?.(event);
		this.announce(
			this.#announcements.onDragCancel({
				active: event.active,
				activeIndex: session.initialIndex,
				count: this.count,
			}),
		);
	}
}

export type SortableItemStateProps = {
	readonly root: SortableRootState;
	readonly getValue: () => UniqueIdentifier;
	readonly getDisabled: () => boolean;
	readonly getStrategy: () => SortableStrategy | undefined;
	/** An item rendered inside `<Sortable.Overlay>` is a preview: it never registers or moves. */
	readonly inOverlay: boolean;
	/** The item's own `$props.id()` — the handle's `aria-controls` target. */
	readonly id: string;
};

/** One instance per `<Sortable.Item>`. The Svelte counterpart of dnd-kit's `useSortable()`. */
export class SortableItemState {
	// Same lazy-`$derived` caveat as SortableRootState#props.
	#props!: SortableItemStateProps;

	/** The rendered element, bound by the part; drives registration. */
	node = $state<HTMLElement | null>(null);

	readonly value: UniqueIdentifier = $derived(this.#props.getValue());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly index: number = $derived(this.#props.root.indexOf(this.value));
	readonly isDragging: boolean = $derived(
		!this.#props.inOverlay && this.#props.root.activeId === this.value,
	);
	readonly transform: Coordinates | null = $derived(
		this.#props.inOverlay
			? null
			: this.#props.root.getItemTransform(this.value, this.#props.getStrategy()),
	);

	/** dnd-kit's `useSortable().attributes`, minus the `role` the handle already has. */
	readonly activatorAttrs = $derived({
		tabindex: this.disabled ? undefined : 0,
		"aria-roledescription": "sortable",
		"aria-describedby": this.#props.root.instructionsId,
		"aria-disabled": this.disabled ? ("true" as const) : undefined,
		"aria-pressed": this.isDragging ? ("true" as const) : undefined,
	});

	constructor(props: SortableItemStateProps) {
		this.#props = props;
	}

	get root(): SortableRootState {
		return this.#props.root;
	}

	get id(): string {
		return this.#props.id;
	}

	get inOverlay(): boolean {
		return this.#props.inOverlay;
	}

	/** Register this item as draggable and droppable. Returns its own unregister thunk. */
	register(node: HTMLElement, containerId: UniqueIdentifier | null): () => void {
		return this.root.dnd.register({
			id: this.value,
			kind: "item",
			containerId,
			node,
			disabled: () => this.disabled,
		});
	}

	#entry(): DndNodeEntry | undefined {
		return this.root.dnd.getEntry(this.value);
	}

	onActivatorPointerDown(event: PointerEvent, activator: HTMLElement): void {
		if (this.disabled || this.inOverlay) return;
		const entry = this.#entry();
		if (!entry) return;
		this.root.dnd.startPointerDrag(entry, event, activator);
	}

	onActivatorKeydown(event: KeyboardEvent): void {
		if (this.disabled || this.inOverlay) return;
		// An open session is owned by the engine's own document listener.
		if (this.root.dnd.session) return;
		if (event.key !== " " && event.key !== "Enter") return;

		const entry = this.#entry();
		if (!entry) return;

		event.preventDefault();
		this.root.dnd.startKeyboardDrag(entry, event);
	}
}

/** What `<Sortable.Content>` publishes to the items inside it. */
export type SortableContentContext = {
	readonly id: string;
	readonly getStrategy: () => SortableStrategy | undefined;
};

const SORTABLE_CONTEXT_KEY = Symbol("sortable");
const SORTABLE_CONTENT_CONTEXT_KEY = Symbol("sortable-content");
const SORTABLE_ITEM_CONTEXT_KEY = Symbol("sortable-item");
const SORTABLE_OVERLAY_CONTEXT_KEY = Symbol("sortable-overlay");

export function setSortableContext(state: SortableRootState): SortableRootState {
	return setContext(SORTABLE_CONTEXT_KEY, state);
}

/** Read the root state, naming the misused part in the error when there is no `<Sortable>` above. */
export function getSortableContext(part = "Sortable.Content"): SortableRootState {
	if (!hasContext(SORTABLE_CONTEXT_KEY)) {
		throw new Error(`\`<${part}>\` must be used within \`<Sortable>\`.`);
	}
	return getContext<SortableRootState>(SORTABLE_CONTEXT_KEY);
}

export function setSortableContentContext(context: SortableContentContext): SortableContentContext {
	return setContext(SORTABLE_CONTENT_CONTEXT_KEY, context);
}

export function hasSortableContentContext(): boolean {
	return hasContext(SORTABLE_CONTENT_CONTEXT_KEY);
}

export function getSortableContentContext(): SortableContentContext | undefined {
	return hasSortableContentContext()
		? getContext<SortableContentContext>(SORTABLE_CONTENT_CONTEXT_KEY)
		: undefined;
}

export function setSortableOverlayContext(): boolean {
	return setContext(SORTABLE_OVERLAY_CONTEXT_KEY, true);
}

export function hasSortableOverlayContext(): boolean {
	return hasContext(SORTABLE_OVERLAY_CONTEXT_KEY);
}

export function setSortableItemContext(state: SortableItemState): SortableItemState {
	return setContext(SORTABLE_ITEM_CONTEXT_KEY, state);
}

export function getSortableItemContext(): SortableItemState {
	if (!hasContext(SORTABLE_ITEM_CONTEXT_KEY)) {
		throw new Error("`<Sortable.ItemHandle>` must be used within `<Sortable.Item>`.");
	}
	return getContext<SortableItemState>(SORTABLE_ITEM_CONTEXT_KEY);
}

/**
 * Read the nearest `<Sortable.Item>`'s state — this theme's counterpart of dnd-kit's `useSortable()`,
 * for consumers composing their own parts inside an item.
 */
export function useSortable(): SortableItemState {
	return getSortableItemContext();
}
