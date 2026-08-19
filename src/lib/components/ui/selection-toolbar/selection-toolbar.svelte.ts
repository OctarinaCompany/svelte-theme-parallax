import { getContext, hasContext, setContext } from "svelte";

/** Every value `side` accepts. Upstream `SIDE_OPTIONS`. */
export const SELECTION_TOOLBAR_SIDES = ["top", "right", "bottom", "left"] as const;
export type SelectionToolbarSide = (typeof SELECTION_TOOLBAR_SIDES)[number];

/** Every value `align` accepts. Upstream `ALIGN_OPTIONS` (29). */
export const SELECTION_TOOLBAR_ALIGNMENTS = ["start", "center", "end"] as const;
export type SelectionToolbarAlign = (typeof SELECTION_TOOLBAR_ALIGNMENTS)[number];

/** Bubbling, cancelable event an item dispatches on itself. Upstream 612. */
export const SELECTION_TOOLBAR_ITEM_SELECT = "selectiontoolbar.select";

/** Upstream's inline init for that event (613-615). */
export const SELECTION_TOOLBAR_ITEM_SELECT_OPTIONS = { bubbles: true, cancelable: true } as const;

/** Distance in px between the selection rect and the toolbar. Upstream default (127). */
export const DEFAULT_SIDE_OFFSET = 8;

/** Offset in px from the `start`/`end` alignment. Upstream default (129). */
export const DEFAULT_ALIGN_OFFSET = 0;

/** The event `onSelect` receives, carrying the text selected at activation time. */
export type SelectionToolbarItemSelectEvent = CustomEvent<{ text: string }>;

/** Keys that, held with Shift, extend the caret selection. */
const SELECTION_EXTENDING_KEYS = new Set([
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Home",
	"End",
	"PageUp",
	"PageDown",
]);

/**
 * The viewport-space box of the current selection, copied out of `Range.getBoundingClientRect()`
 * so a later read cannot mutate it. Upstream `SelectionRect` (50-55).
 */
export type SelectionRect = {
	top: number;
	left: number;
	width: number;
	height: number;
};

/**
 * The virtual element handed to the floating layer's `customAnchor`. Structurally identical to
 * floating-ui's `Measurable`, and to the object upstream feeds `useFloating` (226-241).
 */
export type SelectionToolbarAnchor = {
	getBoundingClientRect: () => DOMRect;
};

export type SelectionToolbarRootStateProps = {
	readonly getOpen: () => boolean;
	/** Writes the caller's binding **and** calls `onOpenChange` — the only path that changes `open`. */
	readonly setOpen: (open: boolean) => void;
	readonly getContainer: () => HTMLElement | null;
	/** Upstream's `containerProp !== undefined` gate (403): scoping is opt-in, `null` still scopes. */
	readonly isContainerScoped: () => boolean;
	/** The rendered floating surface, so an outside press can be told from an inside one. */
	readonly getSurface: () => HTMLElement | null;
	readonly onSelectionChange: (text: string) => void;
};

/**
 * One instance per `<SelectionToolbar>`, published on context. Replaces upstream's external store
 * (57-207) and its tracking effect (457-488).
 *
 * The class never assigns to `open` itself: {@link SelectionToolbarRootState.setOpen} is the single
 * write path and it always notifies `onOpenChange`. Must be constructed during component
 * initialisation, because it owns an `$effect`.
 */
export class SelectionToolbarRootState {
	// `$derived` below is lazy at runtime, but svelte-check cannot see that across the constructor
	// assignment — the same annotation `DirectionProviderState` needs.
	#props!: SelectionToolbarRootStateProps;

	/** rAF token shared by `scroll`/`resize`, so a burst coalesces into one read (447-455). */
	#updateFrame: number | null = null;
	/** rAF token of the deferred `mouseup`/`keyup` read (460-464), cancelled by the effect's teardown. */
	#mouseUpFrame: number | null = null;

	/** Trimmed `selection.toString()`. `""` whenever the toolbar is closed by the tracker. */
	selectedText = $state("");
	/** Anchor box of the live selection, or `null` while the tracker holds the toolbar closed. */
	selectionRect = $state<SelectionRect | null>(null);

	readonly open: boolean = $derived(this.#props.getOpen());

	readonly anchor: SelectionToolbarAnchor | null = $derived.by(() => {
		const rect = this.selectionRect;
		if (!rect) return null;
		return {
			getBoundingClientRect: () => new DOMRect(rect.left, rect.top, rect.width, rect.height),
		};
	});

	constructor(props: SelectionToolbarRootStateProps) {
		this.#props = props;

		$effect(() => {
			const container: HTMLElement | Document = this.#props.getContainer() ?? document;

			const onMouseUp = () => {
				if (this.#mouseUpFrame !== null) return;
				this.#mouseUpFrame = requestAnimationFrame(() => {
					this.#mouseUpFrame = null;
					this.updateSelection();
				});
			};

			// Divergence from upstream, which reads the selection only on `mouseup`: a selection made
			// with the keyboard (Shift+navigation, Ctrl/Cmd+A) must open the toolbar too. Reuses the
			// same coalesced deferred read as `onMouseUp`. `Event`-typed because the container union's
			// `addEventListener` only offers the loose overload.
			const onKeyUp = (event: Event) => {
				const { key, shiftKey, ctrlKey, metaKey } = event as KeyboardEvent;
				const extendsSelection =
					(shiftKey && SELECTION_EXTENDING_KEYS.has(key)) ||
					((ctrlKey || metaKey) && key.toLowerCase() === "a");
				if (extendsSelection) onMouseUp();
			};

			const onSelectionChange = () => {
				const selection = window.getSelection();
				if (!selection?.toString().trim()) this.closeToolbar();
			};

			const onScheduleUpdate = () => this.scheduleUpdate();

			container.addEventListener("mouseup", onMouseUp);
			container.addEventListener("keyup", onKeyUp);
			document.addEventListener("selectionchange", onSelectionChange);
			window.addEventListener("scroll", onScheduleUpdate, { passive: true });
			window.addEventListener("resize", onScheduleUpdate, { passive: true });

			return () => {
				container.removeEventListener("mouseup", onMouseUp);
				container.removeEventListener("keyup", onKeyUp);
				document.removeEventListener("selectionchange", onSelectionChange);
				window.removeEventListener("scroll", onScheduleUpdate);
				window.removeEventListener("resize", onScheduleUpdate);
				if (this.#updateFrame !== null) {
					cancelAnimationFrame(this.#updateFrame);
					this.#updateFrame = null;
				}
				if (this.#mouseUpFrame !== null) {
					cancelAnimationFrame(this.#mouseUpFrame);
					this.#mouseUpFrame = null;
				}
			};
		});

		/**
		 * Upstream's outside-press effect (498-521), attached only while the toolbar is open.
		 *
		 * The floating layer raises its own outside-interaction callback, but it debounces it by
		 * 10 ms and tears the pending call down when the surface unmounts — so a press that closes
		 * the toolbar through some other path (a `selectionchange`, say) would never get to drop the
		 * browser's ranges, and the selection would be cleared only by luck. This listener is
		 * synchronous on the press, exactly like upstream's, and `clearSelection()` is idempotent, so
		 * the two paths compose. `pointerdown` rather than upstream's `mousedown`: it is the same
		 * moment for a mouse and it also covers pen and touch, which `mousedown` reports late or not
		 * at all.
		 */
		$effect(() => {
			if (!this.open) return;

			const onPointerDown = (event: PointerEvent) => {
				const surface = this.#props.getSurface();
				const target = event.target;
				if (surface && target instanceof Node && surface.contains(target)) return;

				this.clearSelection();
			};

			document.addEventListener("pointerdown", onPointerDown);
			return () => document.removeEventListener("pointerdown", onPointerDown);
		});
	}

	setOpen(next: boolean): void {
		this.#props.setOpen(next);
	}

	/**
	 * Reads the live selection and drives the toolbar from it. A verbatim translation of upstream
	 * 390-445, including the "did anything actually change?" comparison that keeps an *extended*
	 * selection from closing and reopening, and the early return for a scoped-but-unresolved
	 * container (403-406) which must neither open nor close.
	 */
	updateSelection(): void {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			this.closeToolbar();
			return;
		}

		const text = selection.toString().trim();
		if (!text) {
			this.closeToolbar();
			return;
		}

		if (this.#props.isContainerScoped()) {
			const container = this.#props.getContainer();
			if (!container) return;

			const commonAncestor = selection.getRangeAt(0).commonAncestorContainer;
			const element =
				commonAncestor.nodeType === Node.ELEMENT_NODE
					? (commonAncestor as Element)
					: commonAncestor.parentElement;

			if (!element || !container.contains(element)) {
				this.closeToolbar();
				return;
			}
		}

		const rect = selection.getRangeAt(0).getBoundingClientRect();
		const current = this.selectionRect;
		const hasChanges =
			this.selectedText !== text ||
			!current ||
			current.top !== rect.top ||
			current.left !== rect.left ||
			current.width !== rect.width ||
			current.height !== rect.height ||
			!this.open;

		if (!hasChanges) return;

		// Upstream's batch order (434-443): text first, then the rect, then `open` — so
		// `onSelectionChange` is notified before `onOpenChange`, and each fires only on a real change.
		if (this.selectedText !== text) {
			this.selectedText = text;
			this.#props.onSelectionChange(text);
		}
		this.selectionRect = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
		if (!this.open) this.setOpen(true);
	}

	/** Clears text, rect and open state in one transition. Upstream `closeToolbar` (379-388). */
	closeToolbar(): void {
		if (!this.open && this.selectedText === "" && this.selectionRect === null) return;

		if (this.open) this.setOpen(false);
		if (this.selectedText !== "") {
			this.selectedText = "";
			this.#props.onSelectionChange("");
		}
		this.selectionRect = null;
	}

	/** Drops the browser's ranges, then closes. Upstream `clearSelection` (490-496). */
	clearSelection(): void {
		window.getSelection()?.removeAllRanges();
		this.closeToolbar();
	}

	/** One pending frame at a time, and only a re-read while open. Upstream 447-455. */
	scheduleUpdate(): void {
		if (this.#updateFrame !== null) return;
		this.#updateFrame = requestAnimationFrame(() => {
			this.#updateFrame = null;
			if (this.open) this.updateSelection();
		});
	}
}

const SELECTION_TOOLBAR_CONTEXT_KEY = Symbol("selection-toolbar");

export function setSelectionToolbarContext(
	state: SelectionToolbarRootState,
): SelectionToolbarRootState {
	return setContext(SELECTION_TOOLBAR_CONTEXT_KEY, state);
}

/**
 * Read the root's state, throwing when there is no `<SelectionToolbar>` ancestor.
 * The Svelte equivalent of upstream's exported `useSelectionToolbar` hook (divergence D-6).
 */
export function getSelectionToolbarContext(consumerName: string): SelectionToolbarRootState {
	if (!hasContext(SELECTION_TOOLBAR_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<SelectionToolbar>\`.`);
	}
	return getContext<SelectionToolbarRootState>(SELECTION_TOOLBAR_CONTEXT_KEY);
}
