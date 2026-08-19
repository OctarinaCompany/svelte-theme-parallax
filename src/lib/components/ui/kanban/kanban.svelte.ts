/**
 * The component layer: the root, column and item state classes, the five `Symbol`-keyed contexts and
 * the announcement builders.
 *
 * Everything kanban-specific lives here — `kanban-collision.ts` stays pure and rune-free, and
 * `kanban-dnd.svelte.ts` knows only about drop-target resolution — so a later multi-container drag
 * component can compose either without dragging the board's semantics along.
 */

import { getContext, hasContext, setContext, tick } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import {
	arrayMove,
	toClientRect,
	type ClientRect,
	type Coordinates,
	type DragSession,
	type SortableArrowKey,
	type SortableModifier,
	type SortableStrategy,
	type UniqueIdentifier,
} from "$lib/components/ui/sortable/index.js";

import {
	closestCenterAmong,
	getFirstCollision,
	pointerWithin,
	rectIntersection,
	resolveKanbanArrowTarget,
	type KanbanArrowKey,
	type KanbanDroppable,
} from "./kanban-collision.js";
import { KanbanDndState } from "./kanban-dnd.svelte.js";

/** The board: an ordered map of column identifier to that column's ordered items. */
export type KanbanValue<T> = Record<UniqueIdentifier, T[]>;

export type KanbanOrientation = "horizontal" | "vertical";

export type KanbanOverlayVariant = "column" | "item";

/** Upstream's `DragStartEvent` / `DragEndEvent`, narrowed to the two members a consumer can act on. */
export type KanbanDragEvent = {
	active: { id: UniqueIdentifier };
	over: { id: UniqueIdentifier } | null;
};

export type KanbanMoveEvent = KanbanDragEvent & {
	activeIndex: number;
	overIndex: number;
};

/** What every announcement builder receives. */
export type KanbanAnnouncementArgs = {
	/** The active identifier for pick-up and cancel; the drop target for the other three. */
	value: UniqueIdentifier;
	variant: KanbanOverlayVariant;
	/** 1-based, in the *current* `value` — i.e. after `onDragOver` already committed. */
	position: number;
	total: number;
	/** The column the announced identifier now lives in, or `null`. */
	column: UniqueIdentifier | null;
	/** Whether the dragged item has left the column it was picked up from. */
	changedColumn: boolean;
};

export type KanbanAnnouncements = {
	onDragStart: (args: KanbanAnnouncementArgs) => string;
	onDragMove: (args: KanbanAnnouncementArgs) => string;
	onDragOver: (args: KanbanAnnouncementArgs) => string;
	onDragEnd: (args: KanbanAnnouncementArgs) => string;
	onDragCancel: (args: KanbanAnnouncementArgs) => string;
};

export type KanbanAccessibility = {
	/** Per-key override — anything left unsupplied keeps its default text. */
	announcements?: Partial<KanbanAnnouncements>;
	screenReaderInstructions?: { draggable: string };
};

/** The "… in <column>" suffix only appears when an item has changed column. */
function columnSuffix({ column, changedColumn }: KanbanAnnouncementArgs): string {
	return changedColumn && column !== null ? ` in ${column}` : "";
}

/** Copied verbatim from the original implementation, punctuation and 1-based positions included. */
export const DEFAULT_KANBAN_ANNOUNCEMENTS: KanbanAnnouncements = {
	onDragStart: ({ variant, position, total }) =>
		`Picked up ${variant} at position ${position} of ${total}`,
	onDragOver: (args) =>
		`${args.variant} is now at position ${args.position} of ${args.total}${columnSuffix(args)}`,
	onDragMove: (args) =>
		`${args.variant} is now at position ${args.position} of ${args.total}${columnSuffix(args)}`,
	onDragEnd: (args) =>
		`${args.variant} was dropped at position ${args.position} of ${args.total}${columnSuffix(args)}`,
	onDragCancel: ({ variant }) => `Dragging was cancelled. ${variant} was dropped.`,
};

/**
 * How long a displaced column or item takes to travel to its new slot. dnd-kit's sortable default
 * is `200ms ease-out`, which upstream never overrides.
 */
const LAYOUT_SHIFT_MS = 200;
const LAYOUT_SHIFT_TRANSITION = `transform ${LAYOUT_SHIFT_MS}ms cubic-bezier(0.2, 0, 0, 1)`;

/**
 * How long the floating preview takes to glide from where it was released onto the dropped
 * element's settled slot. dnd-kit's `DragOverlay` default drop animation (250ms ease), which
 * upstream never overrides.
 */
const DROP_ANIMATION_MS = 250;
const DROP_TRANSITION = `transform ${DROP_ANIMATION_MS}ms ease`;

/** Upstream's instruction text, its source indentation collapsed. */
const DEFAULT_INSTRUCTIONS =
	"To pick up a kanban item or column, press space or enter. While dragging, use the arrow keys to move the item. Press space or enter again to drop the item in its new position, or press escape to cancel.";

/**
 * Upstream's runtime rule: object arrays must say how to identify an item.
 * Evaluated where the raw `value` is still in scope, so it surfaces on first render.
 */
export function assertKanbanItemValueGetter<T>(
	value: KanbanValue<T> | undefined,
	getItemValue: ((item: T) => UniqueIdentifier) | undefined,
): void {
	if (getItemValue || !value) return;
	for (const items of Object.values(value)) {
		const first = items?.[0];
		if (typeof first === "object" && first !== null) {
			throw new Error("`getItemValue` is required when using array of objects");
		}
	}
}

function translateRect(rect: ClientRect, transform: Coordinates): ClientRect {
	return {
		top: rect.top + transform.y,
		bottom: rect.bottom + transform.y,
		left: rect.left + transform.x,
		right: rect.right + transform.x,
		width: rect.width,
		height: rect.height,
	};
}

export type KanbanRootStateProps = {
	readonly getValue: () => KanbanValue<unknown>;
	readonly setValue: (next: KanbanValue<unknown>) => void;
	readonly getItemValue: (item: unknown) => UniqueIdentifier;
	readonly getOrientation: () => KanbanOrientation;
	/** Stored on the context and read by nothing — exactly as upstream. */
	readonly getStrategy: () => SortableStrategy | undefined;
	readonly getModifiers: () => SortableModifier[] | undefined;
	readonly getFlatCursor: () => boolean;
	readonly getDir: () => Direction;
	readonly getAccessibility: () => KanbanAccessibility | undefined;
	readonly getOnMove: () => ((event: KanbanMoveEvent) => void) | undefined;
	readonly getOnDragStart: () => ((event: KanbanDragEvent) => void) | undefined;
	readonly getOnDragMove: () => ((event: KanbanDragEvent) => void) | undefined;
	readonly getOnDragOver: () => ((event: KanbanDragEvent) => void) | undefined;
	readonly getOnDragEnd: () => ((event: KanbanDragEvent) => void) | undefined;
	readonly getOnDragCancel: () => ((event: KanbanDragEvent) => void) | undefined;
	/** The one `$props.id()` the live region and instructions ids derive from. */
	readonly id: string;
};

/** One instance per `<Kanban>`. Published on context; every part reads it. */
export class KanbanRootState {
	// `$derived` below is lazy at runtime, but svelte-check's static analysis cannot see that and
	// flags the field as used before its constructor assignment.
	#props!: KanbanRootStateProps;

	readonly dnd: KanbanDndState;

	readonly value: KanbanValue<unknown> = $derived(this.#props.getValue());
	readonly columns: UniqueIdentifier[] = $derived(Object.keys(this.value));
	readonly itemValues: UniqueIdentifier[] = $derived(
		Object.values(this.value)
			.flat()
			.map((item) => this.#props.getItemValue(item)),
	);
	/** Columns first, then items: one flat identifier space, as dnd-kit's single context has upstream. */
	readonly identifiers: UniqueIdentifier[] = $derived([...this.columns, ...this.itemValues]);

	readonly orientation: KanbanOrientation = $derived(this.#props.getOrientation());
	readonly flatCursor: boolean = $derived(this.#props.getFlatCursor());
	readonly dir: Direction = $derived(this.#props.getDir());
	readonly strategy: SortableStrategy | undefined = $derived(this.#props.getStrategy());

	/** Incremented by every mounted `<Kanban.Overlay>`; drives the R-07 transform suppression. */
	overlayCount = $state(0);
	readonly hasOverlay: boolean = $derived(this.overlayCount > 0);

	/** The live region's text. Written only when it actually changes. */
	announcement = $state("");

	readonly instructions: string = $derived(
		this.#props.getAccessibility()?.screenReaderInstructions?.draggable ?? DEFAULT_INSTRUCTIONS,
	);

	readonly liveRegionId: string = $derived(`${this.#props.id}-live`);
	readonly instructionsId: string = $derived(`${this.#props.id}-instructions`);

	readonly #announcements: KanbanAnnouncements = $derived.by(() => {
		const overrides = this.#props.getAccessibility()?.announcements;
		return {
			onDragStart: overrides?.onDragStart ?? DEFAULT_KANBAN_ANNOUNCEMENTS.onDragStart,
			onDragMove: overrides?.onDragMove ?? DEFAULT_KANBAN_ANNOUNCEMENTS.onDragMove,
			onDragOver: overrides?.onDragOver ?? DEFAULT_KANBAN_ANNOUNCEMENTS.onDragOver,
			onDragEnd: overrides?.onDragEnd ?? DEFAULT_KANBAN_ANNOUNCEMENTS.onDragEnd,
			onDragCancel: overrides?.onDragCancel ?? DEFAULT_KANBAN_ANNOUNCEMENTS.onDragCancel,
		};
	});

	/** Upstream's two refs, plus the column the drag was picked up from. */
	#lastOverId: UniqueIdentifier | null = null;
	#hasMoved = false;
	#startColumn: UniqueIdentifier | null = null;
	/** The board as it stood at pick-up, republished when a cancel has to undo a mid-drag commit. */
	#startValue: KanbanValue<unknown> | null = null;
	/** Whether `onDragOver` published at least once, i.e. whether a cancel has anything to undo. */
	#committed = false;
	/**
	 * The net same-column reorder `onDragOver` has already published: the index the item was picked up
	 * from, the index it now occupies, and the sibling it last settled against. `onDragEnd` reports it
	 * to `onMove`, which the mid-drag commit itself never routes to.
	 */
	#sameColumnMove: {
		activeIndex: number;
		overIndex: number;
		overId: UniqueIdentifier;
	} | null = null;

	/**
	 * Where each column sat when a column drag was picked up, before anything was transformed. Empty
	 * for an item drag. See {@link #columnStrategyShift}.
	 */
	#columnLayout: { id: UniqueIdentifier; rect: ClientRect }[] = [];

	/** FLIP state, keyed by stringified identifier. See {@link #playLayoutShift}. */
	#layoutShifts = $state<Record<string, Coordinates>>({});
	#layoutAnimating = $state<Record<string, Coordinates>>({});
	#layoutTimer: ReturnType<typeof setTimeout> | null = null;

	/**
	 * The floating preview's drop flight. From the moment a session closes until the flight lands,
	 * the overlay keeps rendering from this record: positioned at the same pick-up `rect`, its
	 * `transform` released from the drop position towards the element's settled slot under
	 * `transition`, while the element itself hides underneath. See {@link #animateDrop}.
	 *
	 * `$state.raw`, not `$state`: the record is only ever replaced whole, and `#animateDrop` guards
	 * its async resumptions by identity — a deep proxy would never compare equal to what it stored.
	 */
	#dropFlight = $state.raw<{
		id: UniqueIdentifier;
		rect: ClientRect;
		transform: Coordinates;
		transition: string | null;
	} | null>(null);
	#dropTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(props: KanbanRootStateProps) {
		this.#props = props;

		this.dnd = new KanbanDndState({
			getItems: () => this.identifiers,
			getModifiers: () => this.#props.getModifiers() ?? [],
			// Never consulted: `move()` is overridden and `moveToIndex` resolves an index instead.
			getCollisionDetection: () => () => [],
			resolveOverId: (session, pointer) => this.resolveOverId(session, pointer),
			onStart: (session) => this.#onSessionStart(session),
			onMove: (session) => this.#onSessionMove(session),
			onOver: (session) => this.#onSessionOver(session),
			onEnd: (session) => this.#onSessionEnd(session),
			onCancel: (session) => this.#onSessionCancel(session),
			onArrowKey: (key, session) => this.resolveArrowTarget(key, session),
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

	itemValueOf(item: unknown): UniqueIdentifier {
		return this.#props.getItemValue(item);
	}

	/** Column identifiers and item identifiers share one space; this is what tells them apart. */
	isColumn(id: UniqueIdentifier): boolean {
		return Object.hasOwn(this.value, id);
	}

	/** The column an identifier belongs to: itself for a column, the owner for an item. */
	getColumn(id: UniqueIdentifier): UniqueIdentifier | null {
		if (this.isColumn(id)) return id;
		for (const [column, items] of Object.entries(this.value)) {
			if (items.some((item) => this.itemValueOf(item) === id)) return column;
		}
		return null;
	}

	/** 1-based position of an identifier inside its column, or of a column inside the board. */
	positionOf(id: UniqueIdentifier): number {
		if (this.isColumn(id)) return this.columns.indexOf(id) + 1;

		const column = this.getColumn(id);
		const items = column === null ? undefined : this.value[column];
		if (!items) return 1;
		return items.findIndex((item) => this.itemValueOf(item) === id) + 1;
	}

	/** How many siblings the identifier is counted against. */
	countFor(id: UniqueIdentifier): number {
		if (this.isColumn(id)) return this.columns.length;

		const column = this.getColumn(id);
		return column === null ? 0 : (this.value[column]?.length ?? 0);
	}

	/**
	 * The transform an element renders with. For the dragged one: nothing when an overlay is mounted,
	 * the clamped delta when not. For everything else it depends on whether `value` has already
	 * moved underneath it.
	 *
	 * An **item** drag commits through `#commitOver` on every target change, so the array has already
	 * reordered by the time the parts render and the move is animated by FLIP. Adding a
	 * sorting-strategy shift on top would count it twice.
	 *
	 * A **column** drag commits nothing until the drop — `#commitOver` returns early for columns, and
	 * so does upstream's `onDragOver`, whose cross-column branch looks the active column up among its
	 * own items and finds `-1`. dnd-kit still opens a gap during the gesture, because upstream wraps
	 * the board in `<SortableContext strategy={horizontal|verticalListSortingStrategy}>`,
	 * which displaces the non-active columns without touching any data. That
	 * displacement is what {@link #columnStrategyShift} reproduces — and the strategy displaces the
	 * *active* column's own faded placeholder too, sending it to the slot it would drop into, which
	 * is what {@link #activeColumnShift} reproduces and what makes the source column travel the
	 * board during the gesture instead of staying glued to its origin.
	 */
	getDragTransform(id: UniqueIdentifier): Coordinates | null {
		const session = this.dnd.session;
		if (!session) return null;
		if (session.activeId !== id) return this.#columnStrategyShift(session, id);
		if (!this.hasOverlay) return session.transform;
		return this.#activeColumnShift(session);
	}

	/**
	 * Where a non-active column sits while a column is being dragged over it: one slot along, towards
	 * the gap the dragged column left behind.
	 *
	 * The offsets come from the layout snapshot taken at pick-up rather than from a live measurement,
	 * because `getBoundingClientRect` reports the transform we are in the middle of applying — reading
	 * it here would feed each frame's shift back into the next one. Measured slots also mean variable
	 * column widths, gaps and `dir="rtl"` all fall out for free instead of needing arithmetic.
	 */
	#columnStrategyShift(session: DragSession, id: UniqueIdentifier): Coordinates | null {
		const layout = this.#columnLayout;
		if (layout.length === 0 || !this.isColumn(id) || !this.isColumn(session.activeId)) return null;

		const overId = session.overId;
		if (overId === null || !this.isColumn(overId)) return null;

		const active = layout.findIndex((entry) => entry.id === session.activeId);
		const over = layout.findIndex((entry) => entry.id === overId);
		const self = layout.findIndex((entry) => entry.id === id);
		if (active === -1 || over === -1 || self === -1 || active === over) return null;

		// Only the columns the dragged one has travelled across move, and each takes its neighbour's
		// slot: forwards they shift back one, backwards they shift on one.
		let target: number;
		if (active < over) {
			if (self <= active || self > over) return null;
			target = self - 1;
		} else {
			if (self >= active || self < over) return null;
			target = self + 1;
		}

		const from = layout[self];
		const to = layout[target];
		if (!from || !to) return null;

		return this.orientation === "horizontal"
			? { x: to.rect.left - from.rect.left, y: 0 }
			: { x: 0, y: to.rect.top - from.rect.top };
	}

	/**
	 * Where the dragged column's own faded placeholder sits: the slot it would occupy if dropped
	 * now. dnd-kit's sorting strategies move the active element as well as its neighbours —
	 * travelling forwards it lands trailing-edge against the target slot, backwards leading-edge,
	 * `horizontalListSortingStrategy`'s two formulas verbatim. Items need no equivalent: their
	 * mid-drag commits reorder `value` itself, so an item's placeholder relocates for real.
	 *
	 * Only meaningful under an overlay — without one the element itself follows the pointer — and
	 * only for a column drag: {@link #columnLayout} is empty for anything else.
	 */
	#activeColumnShift(session: DragSession): Coordinates | null {
		const layout = this.#columnLayout;
		const overId = session.overId;
		if (layout.length === 0 || overId === null || overId === session.activeId) return null;
		if (!this.isColumn(overId)) return null;

		const active = layout.findIndex((entry) => entry.id === session.activeId);
		const over = layout.findIndex((entry) => entry.id === overId);
		if (active === -1 || over === -1 || active === over) return null;

		const from = layout[active];
		const to = layout[over];
		if (!from || !to) return null;

		if (this.orientation === "horizontal") {
			return {
				x: active < over ? to.rect.right - from.rect.right : to.rect.left - from.rect.left,
				y: 0,
			};
		}
		return {
			x: 0,
			y: active < over ? to.rect.bottom - from.rect.bottom : to.rect.top - from.rect.top,
		};
	}

	/** Whether a column currently rides a column drag's sorting-strategy displacement. */
	isStrategyDisplaced(id: UniqueIdentifier): boolean {
		const session = this.dnd.session;
		if (!session || this.#columnLayout.length === 0) return false;
		if (!this.isColumn(id) || !this.isColumn(session.activeId)) return false;
		// The dragged column's faded placeholder glides between slots too — but only under an
		// overlay; without one the element itself follows the pointer, which a transition would lag.
		return session.activeId === id ? this.hasOverlay : true;
	}

	/** What the floating preview renders: the live session's subject, or the one still in drop flight. */
	get overlayId(): UniqueIdentifier | null {
		return this.dnd.activeId ?? this.#dropFlight?.id ?? null;
	}

	/** The floating preview's clamped delta — the release delta gliding home during a drop flight. */
	getOverlayTransform(): Coordinates | null {
		return this.dnd.session?.transform ?? this.#dropFlight?.transform ?? null;
	}

	/** The active element's pick-up box, which the floating preview is sized and placed from. */
	getOverlayRect(): ClientRect | null {
		return this.dnd.session?.activeRect ?? this.#dropFlight?.rect ?? null;
	}

	/** The transition the preview carries — set only while its drop flight is releasing. */
	getOverlayTransition(): string | null {
		return this.dnd.session ? null : (this.#dropFlight?.transition ?? null);
	}

	/** Whether this identifier's element is hidden underneath the preview's drop flight. */
	isDropping(id: UniqueIdentifier): boolean {
		return this.#dropFlight?.id === id;
	}

	/** Write the live region, but only when the text actually changed. */
	announce(text: string): void {
		if (text !== this.announcement) this.announcement = text;
	}

	/**
	 * Upstream's collision cascade, reproduced step for step. Rects are
	 * measured live rather than read from the pick-up snapshot, which is what dnd-kit's
	 * `MeasuringStrategy.Always` does upstream and what keeps the board resolvable while `value`
	 * mutates underneath the pointer.
	 */
	resolveOverId(session: DragSession, pointer: Coordinates): UniqueIdentifier | null {
		const activeId = session.activeId;
		const activeRect = session.activeRect;
		if (!activeRect) return session.overId;

		const collisionRect = translateRect(activeRect, session.transform);
		// The active entry stays in the candidate set, exactly as dnd-kit keeps its own droppable in
		// `droppableContainers`. Once the board has reflowed under the pointer, the pointer sits over
		// the dragged item's *new* slot, so resolving to the active identifier is the correct answer:
		// `#commitOver` reads it as "already where it belongs" and commits nothing. Filtering it out
		// forces a neighbour to win instead, which shifts the item one slot further on every reflow.
		const droppables = this.droppables().filter((entry) => !entry.disabled);

		/*
		 * 1. A column only ever lands on a column — INCLUDING ITSELF, for the reason stated just
		 * above about items, which applies here with one extra consequence.
		 *
		 * Column candidates are matched against the layout snapshot taken at pick-up, so "the
		 * active column's slot" stays a real target for the whole gesture even after the board has
		 * reflowed. Excluding it made that slot unreachable: dragging right displaced the columns
		 * passed over, and dragging back could then only ever resolve to a NEIGHBOUR, never to the
		 * origin, so the displacement could not be undone. The gesture the user sees is a column
		 * that moves out on the way right and refuses to come home — the one at the far left
		 * looking stuck, because it is already sitting in the slot the resolver keeps choosing.
		 *
		 * Resolving to the active id is the correct answer for that position and needs no special
		 * case downstream: `#columnStrategyShift` returns null when active and over coincide, so
		 * nothing is displaced, and `#commitEnd` returns early on equal indices, so nothing is
		 * reordered on drop.
		 */
		if (this.isColumn(activeId)) {
			return closestCenterAmong(
				collisionRect,
				droppables.filter((entry) => entry.isColumn),
			);
		}

		// 2. The pointer wins; the overlap area is the fallback when it is between two boxes.
		const pointerHits = pointerWithin(pointer, droppables);
		const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(collisionRect, droppables);
		let overId = getFirstCollision(hits);

		// 3. Nothing under the pointer: keep the remembered target rather than dropping the drag.
		if (overId === null) {
			if (this.#hasMoved) this.#lastOverId = activeId;
			return this.#lastOverId;
		}

		// 4. A populated column is represented by its items, so re-resolve against them.
		if (this.isColumn(overId)) {
			const items = this.value[overId] ?? [];
			if (items.length > 0) {
				const owned = items.map((item) => this.itemValueOf(item));
				const closest = closestCenterAmong(
					collisionRect,
					droppables.filter((entry) => entry.id !== overId && owned.includes(entry.id)),
				);
				if (closest !== null) overId = closest;
			}
		}

		// 5. Remember it, exactly as upstream's `lastOverIdRef` does.
		this.#lastOverId = overId;
		return overId;
	}

	/** Which index in {@link identifiers} an arrow key moves the drop target to. */
	resolveArrowTarget(key: SortableArrowKey, session: DragSession): number | null {
		const activeRect = session.activeRect;
		if (!activeRect) return null;

		const target = resolveKanbanArrowTarget({
			key: key as KanbanArrowKey,
			dir: this.dir,
			activeId: session.activeId,
			activeIsColumn: this.isColumn(session.activeId),
			collisionRect: translateRect(activeRect, session.transform),
			droppables: this.droppables(),
		});
		if (target === null) return null;

		const index = this.identifiers.indexOf(target);
		return index === -1 ? null : index;
	}

	/** Every registered node, measured now, described the way the collision module needs it. */
	droppables(): KanbanDroppable[] {
		const entries: KanbanDroppable[] = [];
		for (const id of this.identifiers) {
			const entry = this.dnd.getEntry(id);
			if (!entry) continue;

			const isColumn = this.isColumn(id);
			entries.push({
				id,
				// While a column drag is displacing the other columns, their painted boxes are no longer
				// where the layout put them. Resolving against the paint would chase the displacement:
				// shifting a column out from under the pointer makes the next one win, which shifts that
				// one too, and the cascade runs to the end of the board. dnd-kit measures droppables with
				// `ignoreTransform`; the pick-up snapshot is our equivalent.
				rect: (isColumn ? this.#columnLayoutRect(id) : null) ?? toClientRect(entry.node),
				isColumn,
				isEmpty: isColumn ? (this.value[id]?.length ?? 0) === 0 : false,
				disabled: entry.disabled(),
				columnId: isColumn ? id : (entry.containerId ?? null),
			});
		}
		return entries;
	}

	#eventOf(session: DragSession): KanbanDragEvent {
		return {
			active: { id: session.activeId },
			over: session.overId === null ? null : { id: session.overId },
		};
	}

	/**
	 * Which identifier a mid-drag announcement describes. An item is relocated live by `#commitOver`,
	 * so its own position is already the news. A column is only reordered on drop (`#commitOver`
	 * returns early for columns), so the board still reads as it did at pick-up and the announcement
	 * has to name the position the column is heading for — that is the drop target.
	 */
	#announcementSubject(session: DragSession): UniqueIdentifier {
		return this.isColumn(session.activeId)
			? (session.overId ?? session.activeId)
			: session.activeId;
	}

	#argsFor(session: DragSession, id: UniqueIdentifier): KanbanAnnouncementArgs {
		const variant: KanbanOverlayVariant = this.isColumn(session.activeId) ? "column" : "item";
		const column = this.getColumn(id);
		return {
			value: id,
			variant,
			position: this.positionOf(id),
			total: this.countFor(id),
			column,
			changedColumn: variant === "item" && column !== null && column !== this.#startColumn,
		};
	}

	/**
	 * Every reorder funnels through here, which makes it the one place that can see a layout change
	 * coming. Upstream gets its animation from dnd-kit: `useSortable` runs on every column and item,
	 * so each one is re-measured and given a `transform` + `transition` when the board reflows, and
	 * columns force `defaultAnimateLayoutChanges({ wasDragging: true })` on top.
	 *
	 * We cannot borrow the sorting-strategy shift directly, because `value` has already been
	 * reordered by the time the parts render — adding an index-derived offset on top would count the
	 * move twice. Measured geometry has no such problem: capture where every node is, let Svelte
	 * relocate them, then invert the difference and release it. That is FLIP, and it is what
	 * dnd-kit's own layout animation reduces to.
	 */
	#publish(next: KanbanValue<unknown>): void {
		const before = this.#captureRects();
		this.#props.setValue(next);
		void this.#playLayoutShift(before);
	}

	/**
	 * Where every registered node sits right now, before the DOM is allowed to move. A plain array
	 * rather than a `Map`: this is a synchronous snapshot that nothing renders from, so it must stay
	 * outside the reactive graph.
	 */
	#captureRects(): { id: UniqueIdentifier; x: number; y: number }[] {
		const rects: { id: UniqueIdentifier; x: number; y: number }[] = [];
		for (const id of this.identifiers) {
			const node = this.dnd.getEntry(id)?.node;
			if (!node) continue;
			const rect = node.getBoundingClientRect();
			rects.push({ id, x: rect.left, y: rect.top });
		}
		return rects;
	}

	async #playLayoutShift(before: { id: UniqueIdentifier; x: number; y: number }[]): Promise<void> {
		if (before.length === 0 || typeof requestAnimationFrame !== "function") return;

		await tick();

		// Mid-drag the session is still open and the dragged node is following the pointer, so
		// animating it too would fight that. At a drop under an overlay the dropped node rides the
		// drop flight instead — hidden while the preview glides onto its slot — so it is skipped
		// too. With neither (a drop without an overlay), nothing is skipped and the dropped node
		// FLIPs into its final slot itself.
		const skipId = this.dnd.session?.activeId ?? this.#dropFlight?.id ?? null;
		const moved: { id: UniqueIdentifier; node: HTMLElement; x: number; y: number }[] = [];

		for (const prev of before) {
			const { id } = prev;
			if (id === skipId) continue;
			const node = this.dnd.getEntry(id)?.node;
			if (!node) continue;

			const rect = node.getBoundingClientRect();
			const x = prev.x - rect.left;
			const y = prev.y - rect.top;
			if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) continue;

			moved.push({ id, node, x, y });
		}

		// A reordered column takes its cards with it, so every card measures as moved too. Transforms
		// inherit, so translating both would displace each card twice. Only the outermost mover is
		// animated; its descendants ride along, which is also the cheaper composite.
		const shifts: Record<string, Coordinates> = {};
		let shifted = false;
		for (const entry of moved) {
			if (moved.some((other) => other.node !== entry.node && other.node.contains(entry.node))) {
				continue;
			}
			shifts[String(entry.id)] = { x: entry.x, y: entry.y };
			shifted = true;
		}

		if (!shifted) return;

		// Invert: the parts re-render translated back to where they were, with no transition, so the
		// move is invisible so far.
		this.#layoutShifts = shifts;
		this.#layoutAnimating = {};
		await tick();

		// Play: one frame later the offset is dropped and the transition is switched on, so each node
		// travels from its old geometry to its new one.
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.#layoutShifts = {};
				this.#layoutAnimating = shifts;
				this.#layoutTimer = setTimeout(() => {
					this.#layoutAnimating = {};
					this.#layoutTimer = null;
				}, LAYOUT_SHIFT_MS);
			});
		});
	}

	/** Drop the transform and the transition immediately, without waiting for the timer. */
	#clearLayoutShift(): void {
		if (this.#layoutTimer !== null) {
			clearTimeout(this.#layoutTimer);
			this.#layoutTimer = null;
		}
		this.#layoutShifts = {};
		this.#layoutAnimating = {};
	}

	/** The FLIP offset a part renders with, or `null` when it is settled. */
	layoutShiftFor(id: UniqueIdentifier): Coordinates | null {
		return this.#layoutShifts[String(id)] ?? null;
	}

	/** Whether a part should carry the transform transition this frame. */
	isLayoutAnimating(id: UniqueIdentifier): boolean {
		return this.#layoutAnimating[String(id)] !== undefined;
	}

	/**
	 * dnd-kit's default drop animation, played on drop and on cancel. Under an overlay: keep the
	 * preview mounted after the session closes, glide it from where it was released onto the
	 * element's settled rect while the element hides underneath, then unmount and reveal — which is
	 * what stops a drop from snapping the card from the pointer into its slot. Item drops need it
	 * most: their commits already happened mid-drag, so the drop itself publishes nothing and no
	 * publish-driven FLIP will play.
	 *
	 * `published` says whether this drop already published (and so played `#publish`'s FLIP). When
	 * it did not, the strategy-displaced columns of a cancelled or aborted column drag would still
	 * snap home as the session's transforms vanish, so the same painted capture drives a FLIP here.
	 * The dragged element is captured too, but riding the flight it is skipped — and without an
	 * overlay that FLIP is precisely its drop animation, pointer position to settled slot.
	 */
	async #animateDrop(session: DragSession, published: boolean): Promise<void> {
		const id = session.activeId;
		const rect = session.activeRect;
		if (!rect || typeof requestAnimationFrame !== "function") return;

		// Measured before any of this renders: the DOM is still painted exactly as the drag left it.
		const before = published ? null : this.#captureRects();

		if (!this.hasOverlay) {
			if (before) void this.#playLayoutShift(before);
			return;
		}

		const flight = {
			id,
			rect,
			transform: session.transform,
			transition: null as string | null,
		};
		this.#dropFlight = flight;
		if (before) void this.#playLayoutShift(before);

		await tick();
		if (this.#dropFlight !== flight) return;

		const node = this.dnd.getEntry(id)?.node;
		const target = node?.getBoundingClientRect();
		if (!target) {
			this.#dropFlight = null;
			return;
		}

		const to = { x: target.left - rect.left, y: target.top - rect.top };
		if (Math.abs(to.x - flight.transform.x) < 0.5 && Math.abs(to.y - flight.transform.y) < 0.5) {
			this.#dropFlight = null;
			return;
		}

		// The preview has been painted at the release position for the whole gesture, so switching
		// the transform and the transition on together transitions from there to the slot.
		requestAnimationFrame(() => {
			if (this.#dropFlight !== flight) return;
			this.#dropFlight = { ...flight, transform: to, transition: DROP_TRANSITION };
			this.#dropTimer = setTimeout(() => {
				this.#dropFlight = null;
				this.#dropTimer = null;
			}, DROP_ANIMATION_MS);
		});
	}

	/** Land the preview immediately: unmount it and reveal the element underneath. */
	#clearDropFlight(): void {
		if (this.#dropTimer !== null) {
			clearTimeout(this.#dropTimer);
			this.#dropTimer = null;
		}
		this.#dropFlight = null;
	}

	/** Release the engine's document listeners and whatever animation is still in flight. */
	destroy(): void {
		this.#clearLayoutShift();
		this.#clearDropFlight();
		this.dnd.destroy();
	}

	/**
	 * Upstream's `onDragOver`: a same-column reorder and a cross-column move
	 * are both committed while the drag is still running, which is what makes the board reflow under
	 * the pointer and what makes "drop into an empty column" reachable at all. Both publish through
	 * `onValueChange` only, unconditionally — `onMove` is never routed to from here.
	 *
	 * The drop target is deliberately left alone after a commit, exactly as upstream leaves `over`
	 * alone. `resolveOverId` excludes the active identifier from its candidate set, so writing it
	 * into `session.overId` here would guarantee that the next resolution differs, re-firing `onOver`
	 * and swapping the same pair straight back — a self-sustaining cycle that reorders on every
	 * pointer frame even when the pointer has not moved. Leaving the session on the neighbour makes
	 * the next resolution a no-op, which is what keeps the board stable under the pointer.
	 */
	#commitOver(session: DragSession): void {
		const activeId = session.activeId;
		const overId = session.overId;
		if (overId === null || overId === activeId) return;
		// A column reorder is only ever committed on drop.
		if (this.isColumn(activeId)) return;

		const value = this.value;
		const activeColumn = this.getColumn(activeId);
		const overColumn = this.getColumn(overId);
		if (activeColumn === null || overColumn === null) return;

		if (activeColumn === overColumn) {
			const items = value[activeColumn];
			if (!items) return;

			const activeIndex = items.findIndex((item) => this.itemValueOf(item) === activeId);
			const overIndex = items.findIndex((item) => this.itemValueOf(item) === overId);
			if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;

			// The first commit of the drag owns the pick-up index; every later one only moves the end
			// of the net move, so a run of arrow keys still reports one move from where it started.
			this.#sameColumnMove = {
				activeIndex: this.#sameColumnMove?.activeIndex ?? activeIndex,
				overIndex,
				overId,
			};
			this.#publish({ ...value, [activeColumn]: arrayMove(items, activeIndex, overIndex) });
		} else {
			const activeItems = value[activeColumn];
			const overItems = value[overColumn];
			if (!activeItems || !overItems) return;

			const activeIndex = activeItems.findIndex((item) => this.itemValueOf(item) === activeId);
			if (activeIndex === -1) return;

			const activeItem = activeItems[activeIndex];
			// Leaving the column ends whatever same-column move was in flight; coming back starts a
			// fresh one from the item's new pick-up index.
			this.#sameColumnMove = null;
			this.#publish({
				...value,
				[activeColumn]: activeItems.filter((item) => this.itemValueOf(item) !== activeId),
				[overColumn]: [...overItems, activeItem],
			});
			this.#hasMoved = true;
			// dnd-kit re-fires `onDragOver` only when `over.id` actually changes, so upstream's append
			// is the last word until the pointer reaches a different card. Our cascade re-resolves a
			// populated column to its closest item, which would turn the very next frame into a
			// same-column reorder and undo the append. Parking the target on the active identifier
			// reproduces upstream's "no new event" without freezing the same-column path below.
			this.#lastOverId = activeId;
			session.overId = activeId;
		}

		this.#committed = true;
	}

	/**
	 * Upstream's `onDragEnd`: the column reorder and the same-column drop.
	 * Returns whether it published — a drop that published gets its layout animation from
	 * `#publish`'s FLIP, and `#animateDrop` plays one itself for every drop that did not.
	 */
	#commitEnd(session: DragSession): boolean {
		const activeId = session.activeId;
		const overId = session.overId;
		if (overId === null) return false;

		const value = this.value;
		const onMove = this.#props.getOnMove();

		if (this.isColumn(activeId) && this.isColumn(overId)) {
			const keys = Object.keys(value);
			const activeIndex = keys.indexOf(String(activeId));
			const overIndex = keys.indexOf(String(overId));
			if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return false;

			if (onMove) {
				onMove({ ...this.#eventOf(session), activeIndex, overIndex });
				return false;
			}

			const next: KanbanValue<unknown> = {};
			for (const key of arrayMove(keys, activeIndex, overIndex)) {
				const items = value[key];
				if (items) next[key] = items;
			}
			this.#publish(next);
			return true;
		}

		const activeColumn = this.getColumn(activeId);
		const overColumn = this.getColumn(overId);
		// A cross-column drop committed already, in `onDragOver`.
		if (activeColumn === null || overColumn === null || activeColumn !== overColumn) return false;

		// So did every same-column reorder, which also left the session pointing at the active
		// identifier — there is nothing left to splice here, only the net move to report. `onMove`
		// therefore reports rather than intercepts a same-column drop.
		if (this.#sameColumnMove) {
			const { activeIndex, overIndex, overId: target } = this.#sameColumnMove;
			onMove?.({ active: { id: activeId }, over: { id: target }, activeIndex, overIndex });
			return false;
		}

		const items = value[activeColumn];
		if (!items) return false;

		const activeIndex = items.findIndex((item) => this.itemValueOf(item) === activeId);
		const overIndex = items.findIndex((item) => this.itemValueOf(item) === overId);
		if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return false;

		if (onMove) {
			onMove({ ...this.#eventOf(session), activeIndex, overIndex });
			return false;
		}
		this.#publish({ ...value, [activeColumn]: arrayMove(items, activeIndex, overIndex) });
		return true;
	}

	#reset(): void {
		this.#lastOverId = null;
		this.#hasMoved = false;
		this.#startColumn = null;
		this.#startValue = null;
		this.#committed = false;
		this.#sameColumnMove = null;
		this.#columnLayout = [];
		// Cancels a reflow still in flight when a new drag starts. At the end of a drag this runs
		// before `#playLayoutShift` has awaited its first tick, so the drop animation is untouched.
		this.#clearLayoutShift();
		// And a drop flight still gliding home from the previous drop lands on the spot — the ends
		// of a drag call `#animateDrop` only after this, so their own flight is never the casualty.
		this.#clearDropFlight();
	}

	/** The columns' slots as laid out, read before any transform is applied. */
	#captureColumnLayout(): { id: UniqueIdentifier; rect: ClientRect }[] {
		const layout: { id: UniqueIdentifier; rect: ClientRect }[] = [];
		for (const id of this.columns) {
			const node = this.dnd.getEntry(id)?.node;
			if (!node) continue;
			layout.push({ id, rect: toClientRect(node) });
		}
		return layout;
	}

	/** The untransformed slot a column occupies, while a column drag is displacing the others. */
	#columnLayoutRect(id: UniqueIdentifier): ClientRect | null {
		return this.#columnLayout.find((entry) => entry.id === id)?.rect ?? null;
	}

	#onSessionStart(session: DragSession): void {
		this.#reset();
		this.#startColumn = this.getColumn(session.activeId);
		// Taken here and not per frame: nothing is transformed yet, so these are the true slots.
		if (this.isColumn(session.activeId)) this.#columnLayout = this.#captureColumnLayout();
		// Every commit builds a new record and new arrays rather than mutating, so holding the current
		// board is a sufficient snapshot for the cancel path below.
		this.#startValue = this.value;

		this.#props.getOnDragStart()?.(this.#eventOf(session));
		this.announce(this.#announcements.onDragStart(this.#argsFor(session, session.activeId)));
	}

	#onSessionOver(session: DragSession): void {
		this.#props.getOnDragOver()?.(this.#eventOf(session));
		this.#commitOver(session);
		// The mid-drag commit is what moves the element, so focus has to be restored here rather than
		// waiting for the drop.
		this.#retainFocus(session);

		if (session.overId === null) return;
		this.announce(
			this.#announcements.onDragOver(this.#argsFor(session, this.#announcementSubject(session))),
		);
	}

	#onSessionMove(session: DragSession): void {
		this.#props.getOnDragMove()?.(this.#eventOf(session));

		if (session.overId === null) return;
		this.announce(
			this.#announcements.onDragMove(this.#argsFor(session, this.#announcementSubject(session))),
		);
	}

	/**
	 * Keep the grabbed activator focused across the reorder. Committing relocates the element, and
	 * relocating a focused node runs the removal steps first, which blurs it. A cross-column commit
	 * goes further and re-creates the element in the destination column's block, so the fallback
	 * looks the grabbed activator up again by the one attribute that survives the move.
	 */
	#retainFocus(session: DragSession): void {
		if (session.source !== "keyboard") return;

		const element = document.activeElement;
		if (!(element instanceof HTMLElement)) return;

		void tick().then(() => {
			if (document.activeElement === element) return;
			if (element.isConnected) {
				element.focus();
				return;
			}
			document.querySelector<HTMLElement>('[data-slot^="kanban-"][aria-pressed="true"]')?.focus();
		});
	}

	#onSessionEnd(session: DragSession): void {
		this.#props.getOnDragEnd()?.(this.#eventOf(session));

		// Released over nothing: commit nothing, announce nothing — but still fly the preview home.
		if (session.overId === null) {
			this.#reset();
			void this.#animateDrop(session, false);
			return;
		}

		const published = this.#commitEnd(session);
		// The drop announcement names where the dragged element actually landed, which is only the
		// drop target when the two are the same — after a mid-drag commit they are.
		this.announce(this.#announcements.onDragEnd(this.#argsFor(session, session.activeId)));
		this.#retainFocus(session);
		this.#reset();
		void this.#animateDrop(session, published);
	}

	/**
	 * `Escape` cancels the operation *and restores the original position*. `onDragOver` has already
	 * published every same-column reorder and cross-column move by the time a cancel arrives, so
	 * restoring means republishing the pick-up snapshot — and only when something was published, so
	 * a cancel that changed nothing never notifies a controlled parent of a no-op. Upstream does not
	 * restore.
	 */
	#onSessionCancel(session: DragSession): void {
		this.#props.getOnDragCancel()?.(this.#eventOf(session));

		const published = this.#committed && this.#startValue !== null;
		if (published && this.#startValue) this.#publish(this.#startValue);

		this.announce(this.#announcements.onDragCancel(this.#argsFor(session, session.activeId)));
		this.#reset();
		void this.#animateDrop(session, published);
	}
}

export type KanbanPartStateProps = {
	readonly root: KanbanRootState;
	readonly getValue: () => UniqueIdentifier;
	readonly getDisabled: () => boolean;
	/** A part rendered inside `<Kanban.Overlay>` is a preview: it never registers and never drags. */
	readonly inOverlay: boolean;
	/** The part's own `$props.id()` — its handle's `aria-controls` target. */
	readonly id: string;
};

/**
 * The behaviour a `<Kanban.Column>` and a `<Kanban.Item>` share in full: both are draggable,
 * droppable, disable-able and can be their own activator. Only what they register as a member of —
 * a column registers no container, an item registers its column — differs.
 */
class KanbanPartState {
	// Same lazy-`$derived` caveat as KanbanRootState#props.
	#props!: KanbanPartStateProps;

	/** The rendered element, bound by the part; drives registration. */
	node = $state<HTMLElement | null>(null);

	readonly value: UniqueIdentifier = $derived(this.#props.getValue());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly isDragging: boolean = $derived(
		!this.#props.inOverlay && this.#props.root.activeId === this.value,
	);
	/** Whether this part's element is hidden underneath the overlay's drop flight. */
	readonly isDropping: boolean = $derived(
		!this.#props.inOverlay && this.#props.root.isDropping(this.value),
	);
	readonly transform: Coordinates | null = $derived(
		this.#props.inOverlay ? null : this.#props.root.getDragTransform(this.value),
	);
	/** The FLIP offset while the board reflows around this part. Never set on the dragged one. */
	readonly layoutShift: Coordinates | null = $derived(
		this.#props.inOverlay ? null : this.#props.root.layoutShiftFor(this.value),
	);
	/**
	 * Carried while FLIP releases an offset, and for the whole of a column drag by the columns being
	 * displaced — without it the sorting-strategy shift would jump a slot at a time instead of
	 * gliding, which is the transition dnd-kit's `useSortable` hands every sortable node.
	 */
	readonly layoutTransition: string | null = $derived(
		!this.#props.inOverlay &&
			(this.#props.root.isLayoutAnimating(this.value) ||
				this.#props.root.isStrategyDisplaced(this.value))
			? LAYOUT_SHIFT_TRANSITION
			: null,
	);

	/** dnd-kit's default draggable attribute set, which upstream passes straight through. */
	readonly activatorAttrs = $derived({
		tabindex: this.disabled ? undefined : 0,
		"aria-roledescription": "draggable",
		"aria-describedby": this.#props.root.instructionsId,
		"aria-disabled": this.disabled ? ("true" as const) : undefined,
		"aria-pressed": this.isDragging ? ("true" as const) : undefined,
	});

	constructor(props: KanbanPartStateProps) {
		this.#props = props;
	}

	get root(): KanbanRootState {
		return this.#props.root;
	}

	get id(): string {
		return this.#props.id;
	}

	get inOverlay(): boolean {
		return this.#props.inOverlay;
	}

	/** Register as draggable and droppable. Returns its own unregister thunk. */
	register(node: HTMLElement, containerId: UniqueIdentifier | null): () => void {
		return this.root.dnd.register({
			// Columns register as `'item'` too: the engine measures and considers only that kind, and
			// kanban discriminates the two through `isColumn()` instead.
			id: this.value,
			kind: "item",
			containerId,
			node,
			disabled: () => this.disabled,
		});
	}

	onActivatorPointerDown(event: PointerEvent, activator: HTMLElement): void {
		if (this.disabled || this.inOverlay) return;
		const entry = this.root.dnd.getEntry(this.value);
		if (!entry) return;
		this.root.dnd.startPointerDrag(entry, event, activator);
	}

	onActivatorKeydown(event: KeyboardEvent): void {
		if (this.disabled || this.inOverlay) return;
		// An open session is owned by the engine's own document listener.
		if (this.root.dnd.session) return;
		if (event.key !== " " && event.key !== "Enter") return;

		const entry = this.root.dnd.getEntry(this.value);
		if (!entry) return;

		event.preventDefault();
		this.root.dnd.startKeyboardDrag(entry, event);
	}
}

/** One instance per `<Kanban.Column>`. */
export class KanbanColumnState extends KanbanPartState {}

/** One instance per `<Kanban.Item>`. The Svelte counterpart of dnd-kit's `useSortable()`. */
export class KanbanItemState extends KanbanPartState {}

const KANBAN_CONTEXT_KEY = Symbol("kanban");
const KANBAN_BOARD_CONTEXT_KEY = Symbol("kanban-board");
const KANBAN_COLUMN_CONTEXT_KEY = Symbol("kanban-column");
const KANBAN_ITEM_CONTEXT_KEY = Symbol("kanban-item");
const KANBAN_OVERLAY_CONTEXT_KEY = Symbol("kanban-overlay");

export function setKanbanContext(state: KanbanRootState): KanbanRootState {
	return setContext(KANBAN_CONTEXT_KEY, state);
}

/** Read the root state, naming the misused part in the error when there is no `<Kanban>` above. */
export function getKanbanContext(part = "Kanban.Board"): KanbanRootState {
	if (!hasContext(KANBAN_CONTEXT_KEY)) {
		throw new Error(`\`<${part}>\` must be used within \`<Kanban>\`.`);
	}
	return getContext<KanbanRootState>(KANBAN_CONTEXT_KEY);
}

export function setKanbanBoardContext(): boolean {
	return setContext(KANBAN_BOARD_CONTEXT_KEY, true);
}

export function hasKanbanBoardContext(): boolean {
	return hasContext(KANBAN_BOARD_CONTEXT_KEY);
}

export function setKanbanOverlayContext(): boolean {
	return setContext(KANBAN_OVERLAY_CONTEXT_KEY, true);
}

export function hasKanbanOverlayContext(): boolean {
	return hasContext(KANBAN_OVERLAY_CONTEXT_KEY);
}

export function setKanbanColumnContext(state: KanbanColumnState): KanbanColumnState {
	return setContext(KANBAN_COLUMN_CONTEXT_KEY, state);
}

export function getKanbanColumnContext(): KanbanColumnState {
	if (!hasContext(KANBAN_COLUMN_CONTEXT_KEY)) {
		throw new Error("`<Kanban.ColumnHandle>` must be used within `<Kanban.Column>`.");
	}
	return getContext<KanbanColumnState>(KANBAN_COLUMN_CONTEXT_KEY);
}

/** The enclosing column, or `undefined` — an item inside a bare overlay preview has none. */
export function peekKanbanColumnContext(): KanbanColumnState | undefined {
	return hasContext(KANBAN_COLUMN_CONTEXT_KEY)
		? getContext<KanbanColumnState>(KANBAN_COLUMN_CONTEXT_KEY)
		: undefined;
}

export function setKanbanItemContext(state: KanbanItemState): KanbanItemState {
	return setContext(KANBAN_ITEM_CONTEXT_KEY, state);
}

export function getKanbanItemContext(): KanbanItemState {
	if (!hasContext(KANBAN_ITEM_CONTEXT_KEY)) {
		throw new Error("`<Kanban.ItemHandle>` must be used within `<Kanban.Item>`.");
	}
	return getContext<KanbanItemState>(KANBAN_ITEM_CONTEXT_KEY);
}

/**
 * Read the nearest `<Kanban.Item>`'s state — this theme's counterpart of dnd-kit's `useSortable()`,
 * for consumers composing their own parts inside an item.
 */
export function useKanbanItem(): KanbanItemState {
	return getKanbanItemContext();
}
