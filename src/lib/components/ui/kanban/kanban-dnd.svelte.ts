/**
 * The one seam a kanban board needs on top of `sortable`'s drag engine.
 *
 * `DndState`'s own `#resolveOver` confines a drag to the dragged node's parent element — which is
 * exactly the capability a board is defined by having — and it applies a single collision function
 * where upstream kanban runs a four-step cascade that discriminates columns from items. Both are
 * `#private` and unreachable from outside, so this subclass overrides the one public method that
 * calls them, `move()`. Sensors, activation constraints, pointer capture, `moveToIndex`, `end`,
 * `cancel`, `destroy` and the whole keyboard session machine are inherited unchanged, and no file
 * under `sortable/` is modified.
 */

import {
	DndState,
	type Coordinates,
	type DndStateProps,
	type DragSession,
	type UniqueIdentifier,
} from "$lib/components/ui/sortable/index.js";

export type KanbanDndStateProps = DndStateProps & {
	/**
	 * Resolve the drop target for the live pointer position, which `move()` reconstructs as
	 * `session.initialCoordinates + delta`.
	 */
	readonly resolveOverId: (session: DragSession, pointer: Coordinates) => UniqueIdentifier | null;
};

export class KanbanDndState extends DndState {
	/**
	 * The base keeps its own props in a `#private` field, so the hooks this override fires are read
	 * from a second reference rather than from the parent.
	 */
	#props: KanbanDndStateProps;

	constructor(props: KanbanDndStateProps) {
		super(props);
		this.#props = props;
	}

	/** Apply a raw pointer delta: store it, re-resolve the board-wide drop target, notify. */
	override move(delta: Coordinates): void {
		const session = this.session;
		if (!session) return;

		session.delta = delta;

		const pointer = {
			x: session.initialCoordinates.x + delta.x,
			y: session.initialCoordinates.y + delta.y,
		};

		const nextOver = this.#props.resolveOverId(session, pointer);
		if (nextOver !== session.overId) {
			session.overId = nextOver;
			this.#props.onOver?.(session);
		}
		this.#props.onMove?.(session);
	}
}
