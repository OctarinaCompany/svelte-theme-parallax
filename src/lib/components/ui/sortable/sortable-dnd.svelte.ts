/**
 * The sensor-agnostic drag engine: a droppable registry, a pointer sensor, a keyboard sensor and a
 * single {@link DragSession} at a time.
 *
 * It knows nothing about `value`, `getItemValue`, orientation or announcements — those are injected
 * as getter functions by the component layer, which is what lets the upcoming `kanban` port import
 * this file unchanged.
 */

import {
	layoutParentOf,
	toClientRect,
	type ClientRect,
	type Coordinates,
	type SortableArrowKey,
	type SortableCollisionDetection,
	type SortableModifier,
	type UniqueIdentifier,
} from "./sortable-geometry.js";

/** `'item'` is draggable and droppable; `'container'` is the seam `kanban` will register columns on. */
export type DndNodeKind = "item" | "container";

/** One registered node. Registration is imperative and non-reactive by design. */
export type DndNodeEntry = {
	id: UniqueIdentifier;
	kind: DndNodeKind;
	/** Which region owns it. `sortable` fills this from the nearest `<Sortable.Content>`. */
	containerId: UniqueIdentifier | null;
	node: HTMLElement;
	/** A getter, so a disabled entry is neither draggable nor droppable at the moment it is read. */
	disabled: () => boolean;
};

export type DragSource = "pointer" | "keyboard";

export type DragActivator = PointerEvent | KeyboardEvent;

/** Mouse and pen drags start after this much movement. */
const POINTER_ACTIVATION_DISTANCE = 5;

/** Touch drags start after this much hold, and are abandoned if the finger moves first. */
const TOUCH_ACTIVATION_DELAY = 250;

/** A press on one of these never starts a drag, unless the element *is* the activator. */
const INTERACTIVE_SELECTOR = 'button, input, select, textarea, a[href], [contenteditable="true"]';

export type DragSessionProps = {
	readonly activeId: UniqueIdentifier;
	readonly source: DragSource;
	readonly activatorEvent: DragActivator;
	readonly initialIndex: number;
	readonly initialCoordinates: Coordinates;
	readonly activeRect: ClientRect | null;
	readonly containerRect: ClientRect | null;
	readonly rects: ReadonlyMap<UniqueIdentifier, ClientRect>;
	readonly getModifiers: () => SortableModifier[];
};

/** The transient state that exists only while a drag is active. */
export class DragSession {
	// `$derived` below is lazy at runtime (evaluated only when `.transform` is read), but
	// svelte-check's static analysis cannot see that and flags the field as used before its
	// constructor assignment.
	#props!: DragSessionProps;

	/** Raw pointer delta, before the modifier chain. */
	delta = $state<Coordinates>({ x: 0, y: 0 });
	/** The current drop target. Starts as the dragged item itself, as dnd-kit's `over` does. */
	overId = $state<UniqueIdentifier | null>(null);

	/** The modifier-clamped delta. Never stored — always derived from {@link delta}. */
	readonly transform: Coordinates = $derived(
		this.#props.getModifiers().reduce(
			(transform, modifier) =>
				modifier({
					transform,
					activeRect: this.#props.activeRect,
					containerRect: this.#props.containerRect,
				}),
			this.delta,
		),
	);

	constructor(props: DragSessionProps) {
		this.#props = props;
	}

	get activeId(): UniqueIdentifier {
		return this.#props.activeId;
	}

	get source(): DragSource {
		return this.#props.source;
	}

	get activatorEvent(): DragActivator {
		return this.#props.activatorEvent;
	}

	/** The active item's position at pick-up — the cancel announcement's number. */
	get initialIndex(): number {
		return this.#props.initialIndex;
	}

	get initialCoordinates(): Coordinates {
		return this.#props.initialCoordinates;
	}

	get activeRect(): ClientRect | null {
		return this.#props.activeRect;
	}

	get containerRect(): ClientRect | null {
		return this.#props.containerRect;
	}

	/** Immutable snapshot of every item's rect, taken at pick-up. */
	get rects(): ReadonlyMap<UniqueIdentifier, ClientRect> {
		return this.#props.rects;
	}
}

export type DndStateProps = {
	/** The ordered identifier space a drag resolves against. */
	readonly getItems: () => UniqueIdentifier[];
	readonly getModifiers: () => SortableModifier[];
	readonly getCollisionDetection: () => SortableCollisionDetection;
	/** Narrow the droppables a drag may resolve against. Defaults to every enabled item. */
	readonly filterDroppables?: (candidates: DndNodeEntry[], active: DndNodeEntry) => DndNodeEntry[];
	readonly onStart?: (session: DragSession) => void;
	readonly onMove?: (session: DragSession) => void;
	readonly onOver?: (session: DragSession) => void;
	readonly onEnd?: (session: DragSession) => void;
	readonly onCancel?: (session: DragSession) => void;
	/** Resolve an arrow key to a target index, or `null` to leave the item where it is. */
	readonly onArrowKey?: (key: SortableArrowKey, session: DragSession) => number | null;
};

type PointerActivation = {
	entry: DndNodeEntry;
	event: PointerEvent;
	activator: HTMLElement;
	origin: Coordinates;
	pointerId: number;
	timer: ReturnType<typeof setTimeout> | null;
	captured: boolean;
};

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

function intersects(a: ClientRect, b: ClientRect): boolean {
	return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

function centerOf(rect: ClientRect): Coordinates {
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Build the immutable rect snapshot a session reasons about. Constructed here rather than inline so
 * the "measured once, never mutated" promise is what the type says and what the code can do.
 */
function toRectMap(
	measured: Array<[UniqueIdentifier, ClientRect]>,
): ReadonlyMap<UniqueIdentifier, ClientRect> {
	return new Map(measured);
}

/**
 * Owns the droppable registry and at most one open {@link DragSession}.
 *
 * It holds exactly three long-lived resources — the document `pointermove`/`pointerup`/
 * `pointercancel`/`keydown` listeners, the touch-activation timer and the pointer capture — and
 * {@link DndState.destroy} releases all three.
 */
export class DndState {
	#props: DndStateProps;
	/**
	 * A plain, non-reactive array — deliberately not a `SvelteMap`: a reactive
	 * container would make each item's registration effect a dependent of the very signal it writes.
	 * Nothing in the render path reacts to *registration*, only to the drag session. Same shape as
	 * `tour`'s `TourStepRegistry`.
	 */
	#nodes: DndNodeEntry[] = [];
	#pointer: PointerActivation | null = null;
	#pointerListening = false;
	#keyListening = false;

	session = $state<DragSession | null>(null);

	readonly activeId: UniqueIdentifier | null = $derived(this.session?.activeId ?? null);
	readonly overId: UniqueIdentifier | null = $derived(this.session?.overId ?? null);

	constructor(props: DndStateProps) {
		this.#props = props;
	}

	/** Register a draggable/droppable node. Returns its own unregister thunk. */
	register(entry: DndNodeEntry): () => void {
		const existing = this.#nodes.findIndex((candidate) => candidate.id === entry.id);
		if (existing === -1) this.#nodes.push(entry);
		else this.#nodes[existing] = entry;

		return () => {
			const index = this.#nodes.indexOf(entry);
			if (index !== -1) this.#nodes.splice(index, 1);
		};
	}

	getEntry(id: UniqueIdentifier): DndNodeEntry | undefined {
		return this.#nodes.find((candidate) => candidate.id === id);
	}

	/**
	 * Arm the pointer sensor. The session only opens once the activation constraint for this pointer
	 * type is met: 5 px of movement for mouse and pen, a 250 ms hold for touch.
	 */
	startPointerDrag(entry: DndNodeEntry, event: PointerEvent, activator: HTMLElement): void {
		if (this.session || this.#pointer) return;
		if (entry.disabled()) return;
		if (event.button !== 0) return;
		if (!isActivationAllowed(event, activator)) return;

		this.#pointer = {
			entry,
			event,
			activator,
			origin: { x: event.clientX, y: event.clientY },
			pointerId: event.pointerId,
			timer: null,
			captured: false,
		};
		this.#addPointerListeners();

		if (event.pointerType === "touch") {
			this.#pointer.timer = setTimeout(() => this.#activatePointer(), TOUCH_ACTIVATION_DELAY);
		}
	}

	/** Pick the item up from the keyboard. There is no activation constraint on this path. */
	startKeyboardDrag(entry: DndNodeEntry, event: KeyboardEvent): void {
		if (this.session) return;
		if (entry.disabled()) return;

		const rect = toClientRect(entry.node);
		this.#openSession(entry, "keyboard", event, centerOf(rect));
	}

	/** Apply a raw pointer delta: clamp it, re-resolve the drop target, notify. */
	move(delta: Coordinates): void {
		const session = this.session;
		if (!session) return;

		session.delta = delta;

		const nextOver = this.#resolveOver(session);
		if (nextOver !== session.overId) {
			session.overId = nextOver;
			this.#props.onOver?.(session);
		}
		this.#props.onMove?.(session);
	}

	/** The keyboard path: jump the drop target to a position in the identifier space. */
	moveToIndex(index: number): void {
		const session = this.session;
		if (!session) return;

		const id = this.#props.getItems()[index];
		if (id === undefined) return;

		const targetRect = session.rects.get(id);
		if (targetRect && session.activeRect) {
			session.delta = {
				x: targetRect.left - session.activeRect.left,
				y: targetRect.top - session.activeRect.top,
			};
		}

		if (id !== session.overId) {
			session.overId = id;
			this.#props.onOver?.(session);
		}
		this.#props.onMove?.(session);
	}

	/** Drop at the current position. The caller commits the reorder from its `onEnd` hook. */
	end(): void {
		const session = this.session;
		if (!session) return;

		if (session.source === "pointer") this.#suppressNextClick();
		this.#teardown();
		this.session = null;
		this.#props.onEnd?.(session);
	}

	/** Abandon the session. No reorder is ever committed from here. */
	cancel(): void {
		const session = this.session;
		if (!session) return;

		if (session.source === "pointer") this.#suppressNextClick();
		this.#teardown();
		this.session = null;
		this.#props.onCancel?.(session);
	}

	/**
	 * Swallow the `click` the browser synthesises once a pointer drag releases.
	 *
	 * The browser fires it at the nearest common ancestor of the `pointerdown` and `pointerup`
	 * targets, which for a handle inside a row that travels with the pointer is usually the row
	 * itself — so a drop would also *activate* the row. That is not hypothetical: `bits-ui`'s
	 * `Command.Item` selects on `click`, so dragging a row of the data table's `View` list toggled
	 * the column it had just moved.
	 *
	 * The listener is on the document and in the capture phase because the target is the browser's
	 * choice, not ours: it cannot be predicted from the dragged node, and stopping propagation on
	 * the way down is the only way to reach every listener below it, delegated ones included.
	 *
	 * Only a real session gets here — a press that never passed the activation threshold opens none
	 * — so an ordinary click on an item is untouched.
	 */
	#suppressNextClick(): void {
		const onClick = (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
		};

		document.addEventListener("click", onClick, { capture: true, once: true });
		// The synthesised click is dispatched in the same task as the `pointerup`, so it always
		// arrives before this timeout. The timeout is for the drops that are *not* followed by one —
		// a pointer cancel, or a release whose targets share no ancestor — where a listener left
		// armed would go on to eat an unrelated click.
		setTimeout(() => document.removeEventListener("click", onClick, { capture: true }), 0);
	}

	/** Release every long-lived resource. Called from the root's `$effect` teardown. */
	destroy(): void {
		this.#teardown();
		this.session = null;
		this.#nodes.length = 0;
	}

	#candidatesFor(active: DndNodeEntry): DndNodeEntry[] {
		const all = this.#nodes.filter((entry) => entry.kind === "item" && !entry.disabled());
		return this.#props.filterDroppables?.(all, active) ?? all;
	}

	#resolveOver(session: DragSession): UniqueIdentifier | null {
		const active = this.getEntry(session.activeId);
		const activeRect = session.activeRect;
		if (!active || !activeRect) return session.overId;

		const collisionRect = translateRect(activeRect, session.transform);

		// Dragged clear of the region it started in — there is nothing to drop onto, which is what
		// makes "dropped, no changes were made" reachable.
		if (session.containerRect && !intersects(collisionRect, session.containerRect)) return null;

		const droppables = this.#candidatesFor(active).map((entry) => ({
			id: entry.id,
			rect: session.rects.get(entry.id) ?? toClientRect(entry.node),
		}));
		if (droppables.length === 0) return null;

		return this.#props.getCollisionDetection()({ collisionRect, droppables })[0]?.id ?? null;
	}

	#openSession(
		entry: DndNodeEntry,
		source: DragSource,
		activatorEvent: DragActivator,
		initialCoordinates: Coordinates,
	): DragSession | null {
		const activeRect = toClientRect(entry.node);
		// Not `parentElement`: the item's direct parent may be a `display: contents` wrapper, which
		// has no box to clamp or collide against (see `layoutParentOf`).
		const parent = layoutParentOf(entry.node);

		// Every item is measured, disabled ones included: a disabled item is not a drop target but it
		// still occupies a slot the sorting strategy has to shift around. The map is built once and
		// never mutated afterwards — it is the frozen geometry the whole session reasons about.
		const measured: Array<[UniqueIdentifier, ClientRect]> = this.#nodes
			.filter((candidate) => candidate.kind === "item" && candidate.id !== entry.id)
			.map((candidate) => [candidate.id, toClientRect(candidate.node)]);
		measured.push([entry.id, activeRect]);
		const rects = toRectMap(measured);

		const session = new DragSession({
			activeId: entry.id,
			source,
			activatorEvent,
			initialIndex: this.#props.getItems().indexOf(entry.id),
			initialCoordinates,
			activeRect,
			containerRect: parent ? toClientRect(parent) : null,
			rects,
			getModifiers: () => this.#props.getModifiers(),
		});
		session.overId = entry.id;

		this.session = session;
		this.#addKeyListener();
		this.#props.onStart?.(session);
		return session;
	}

	#activatePointer(): void {
		const pointer = this.#pointer;
		if (!pointer || this.session) return;

		this.#clearPointerTimer();
		const session = this.#openSession(pointer.entry, "pointer", pointer.event, pointer.origin);
		if (!session) return;

		try {
			pointer.activator.setPointerCapture(pointer.pointerId);
			pointer.captured = true;
		} catch {
			// Pointer capture is unavailable (jsdom, or a pointer that has already been released):
			// the document listeners still deliver the rest of the gesture.
		}
	}

	#onPointerMove = (event: PointerEvent): void => {
		const pointer = this.#pointer;
		if (!pointer || event.pointerId !== pointer.pointerId) return;

		const delta = { x: event.clientX - pointer.origin.x, y: event.clientY - pointer.origin.y };

		if (!this.session) {
			if (Math.sqrt(delta.x ** 2 + delta.y ** 2) < POINTER_ACTIVATION_DISTANCE) return;
			// A finger that moves before the hold elapses is scrolling, not dragging.
			if (pointer.event.pointerType === "touch") {
				this.#abortPointer();
				return;
			}
			this.#activatePointer();
			if (!this.session) return;
		}

		this.move(delta);
	};

	#onPointerUp = (event: PointerEvent): void => {
		const pointer = this.#pointer;
		if (!pointer || event.pointerId !== pointer.pointerId) return;

		if (this.session) this.end();
		else this.#abortPointer();
	};

	#onPointerCancel = (event: PointerEvent): void => {
		const pointer = this.#pointer;
		if (!pointer || event.pointerId !== pointer.pointerId) return;

		if (this.session) this.cancel();
		else this.#abortPointer();
	};

	#onKeydown = (event: KeyboardEvent): void => {
		const session = this.session;
		if (!session) return;
		// The keypress that opened the session is still bubbling towards the document.
		if (event === session.activatorEvent) return;

		if (event.key === "Escape") {
			event.preventDefault();
			this.cancel();
			return;
		}
		if (session.source !== "keyboard") return;

		switch (event.key) {
			case " ":
			case "Enter":
				event.preventDefault();
				this.end();
				return;
			case "Tab":
				// Focus may not leave a grabbed item.
				event.preventDefault();
				return;
			case "ArrowUp":
			case "ArrowDown":
			case "ArrowLeft":
			case "ArrowRight": {
				event.preventDefault();
				const index = this.#props.onArrowKey?.(event.key, session) ?? null;
				if (index !== null) this.moveToIndex(index);
				return;
			}
			default:
				return;
		}
	};

	#addPointerListeners(): void {
		if (this.#pointerListening) return;
		this.#pointerListening = true;
		document.addEventListener("pointermove", this.#onPointerMove);
		document.addEventListener("pointerup", this.#onPointerUp);
		document.addEventListener("pointercancel", this.#onPointerCancel);
	}

	#removePointerListeners(): void {
		if (!this.#pointerListening) return;
		this.#pointerListening = false;
		document.removeEventListener("pointermove", this.#onPointerMove);
		document.removeEventListener("pointerup", this.#onPointerUp);
		document.removeEventListener("pointercancel", this.#onPointerCancel);
	}

	#addKeyListener(): void {
		if (this.#keyListening) return;
		this.#keyListening = true;
		document.addEventListener("keydown", this.#onKeydown);
	}

	#removeKeyListener(): void {
		if (!this.#keyListening) return;
		this.#keyListening = false;
		document.removeEventListener("keydown", this.#onKeydown);
	}

	#clearPointerTimer(): void {
		if (this.#pointer?.timer != null) {
			clearTimeout(this.#pointer.timer);
			this.#pointer.timer = null;
		}
	}

	#abortPointer(): void {
		this.#clearPointerTimer();
		this.#releaseCapture();
		this.#pointer = null;
		this.#removePointerListeners();
	}

	#releaseCapture(): void {
		const pointer = this.#pointer;
		if (!pointer?.captured) return;
		try {
			pointer.activator.releasePointerCapture(pointer.pointerId);
		} catch {
			// The pointer is already gone; there is nothing left to release.
		}
		pointer.captured = false;
	}

	#teardown(): void {
		this.#abortPointer();
		this.#removeKeyListener();
	}
}

function isActivationAllowed(event: PointerEvent, activator: HTMLElement): boolean {
	const target = event.target;
	if (!(target instanceof Element)) return true;
	if (target.closest("[data-no-dnd]")) return false;
	if (target === activator) return true;

	const interactive = target.closest(INTERACTIVE_SELECTOR);
	if (!interactive || interactive === activator) return true;
	// A native control nested *inside* the activator keeps its own behaviour.
	return !activator.contains(interactive);
}
