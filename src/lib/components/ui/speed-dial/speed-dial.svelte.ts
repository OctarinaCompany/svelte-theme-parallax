import { DomOrderedCollection } from "$lib/shared/dom-ordered-collection.svelte.js";
import { getContext, hasContext, setContext } from "svelte";
import { tv } from "tailwind-variants";

/** Gap between action items, in px. Upstream `DEFAULT_GAP`. */
export const DEFAULT_GAP = 8;

/** Distance between the trigger and the content, in px. Upstream `DEFAULT_OFFSET` (25). */
export const DEFAULT_OFFSET = 8;

/** Stagger step between consecutive items, in ms. Upstream `DEFAULT_ITEM_DELAY` (26). */
export const DEFAULT_ITEM_DELAY = 50;

/** How long the pointer may be away before hover mode closes, in ms. Upstream (27). */
export const DEFAULT_HOVER_CLOSE_DELAY = 100;

/** Per-item enter/exit transition length, in ms. Upstream `DEFAULT_ANIMATION_DURATION` (28). */
export const DEFAULT_ANIMATION_DURATION = 200;

/** `delay` fallback — how long hover must dwell before opening, in ms. Upstream (158). */
export const DEFAULT_HOVER_OPEN_DELAY = 250;

/** Every value `side` accepts. Upstream `Side` (30). */
export const SPEED_DIAL_SIDES = ["top", "right", "bottom", "left"] as const;
export type SpeedDialSide = (typeof SPEED_DIAL_SIDES)[number];

/** Every value `activationMode` accepts. Upstream `ActivationMode` (31). */
export const SPEED_DIAL_ACTIVATION_MODES = ["click", "hover"] as const;
export type SpeedDialActivationMode = (typeof SPEED_DIAL_ACTIVATION_MODES)[number];

/** Reading direction of the fan, derived from `side`. */
export type SpeedDialOrientation = "horizontal" | "vertical";

/** Bubbling, cancelable event an action dispatches on itself. Upstream `ACTION_SELECT` (20). */
export const ACTION_SELECT_EVENT = "speedDial.actionSelect";

/** Cancelable event handed to `onInteractOutside`. Upstream `INTERACT_OUTSIDE` (21). */
export const INTERACT_OUTSIDE_EVENT = "speedDial.interactOutside";

/** Shared `CustomEvent` init for both events above. Upstream `EVENT_OPTIONS` (22). */
export const SPEED_DIAL_EVENT_OPTIONS = { bubbles: true, cancelable: true } as const;

/** Upstream `getDataState` (48-50). */
export function getDataState(open: boolean): "open" | "closed" {
	return open ? "open" : "closed";
}

/** Upstream `getTransformOrigin` (52-63). */
export function getTransformOrigin(side: SpeedDialSide): string {
	switch (side) {
		case "top":
			return "bottom center";
		case "bottom":
			return "top center";
		case "left":
			return "right center";
		case "right":
			return "left center";
	}
}

/** Upstream's inline `orientation` expression. */
export function getOrientation(side: SpeedDialSide): SpeedDialOrientation {
	return side === "top" || side === "bottom" ? "vertical" : "horizontal";
}

/**
 * The static CSS declarations that pin the content beside the trigger, as a `style` string.
 *
 * Upstream computes the same placement in `updatePosition` through a
 * `useState` + layout-effect dance, and skips it entirely while closed. Nothing here is measured —
 * there is no geometry, no collision detection — so it is a pure function applied unconditionally,
 * which also fixes a `forceMount`ed closed content rendering unpositioned.
 *
 * The offset is expressed as a margin on top of a 100% inset rather than as upstream's
 * `calc(100% + Npx)` inset. On an absolutely positioned box the two are equivalent — the inset
 * measures to the margin edge — and the percentage stays outside a `calc()`, which jsdom 30 cannot
 * compute (it throws out of `getComputedStyle`, taking every role query and pointer assertion with
 * it).
 */
export function getContentPosition(side: SpeedDialSide, offset: number): string {
	switch (side) {
		case "top":
			return `bottom: 100%; right: 0; margin-bottom: ${offset}px;`;
		case "bottom":
			return `top: 100%; right: 0; margin-top: ${offset}px;`;
		case "left":
			return `right: 100%; top: 0; margin-right: ${offset}px;`;
		case "right":
			return `left: 100%; top: 0; margin-left: ${offset}px;`;
	}
}

/**
 * Stagger delay of the item at `index`, in ms — forwards while opening, reversed while closing.
 *
 * Upstream's expression, extracted so it is unit-testable and so each item
 * can compute its own delay from the shared collection instead of being wrapped by its parent.
 */
export function getItemDelay(index: number, count: number, animating: boolean): number {
	return animating ? index * DEFAULT_ITEM_DELAY : (count - index - 1) * DEFAULT_ITEM_DELAY;
}

/**
 * Upstream `speedDialContentVariants` (489-504).
 *
 * `z-50` is deliberately retained. Manual `z-index` is banned on overlays whose primitive owns
 * stacking (Dialog/Popover/Tooltip/Sheet); this content is a locally positioned `absolute` sibling
 * with no primitive behind it, so nothing else can lift it above the page content beside it — the
 * same carve-out already documented in `marquee-edge.svelte` and `scroller-button.svelte`.
 */
export const speedDialContentVariants = tv({
	base: "absolute z-50 flex gap-(--speed-dial-gap) data-[state=closed]:pointer-events-none",
	variants: {
		side: {
			top: "flex-col-reverse items-end",
			bottom: "flex-col items-end",
			left: "flex-row-reverse items-center",
			right: "flex-row items-center",
		},
	},
	defaultVariants: {
		side: "top",
	},
});

/** Upstream `speedDialItemVariants` (841-874). */
export const speedDialItemVariants = tv({
	base: "flex items-center gap-2 transition-all [transition-delay:var(--speed-dial-delay)] [transition-duration:var(--speed-dial-animation-duration)] data-[state=closed]:opacity-0 data-[state=open]:translate-x-0 data-[state=open]:translate-y-0 data-[state=open]:opacity-100",
	variants: {
		side: {
			top: "justify-end",
			bottom: "justify-end",
			left: "flex-row-reverse justify-start",
			right: "justify-start",
		},
	},
	compoundVariants: [
		{ side: "top", class: "data-[state=closed]:translate-y-2" },
		{ side: "bottom", class: "data-[state=closed]:-translate-y-2" },
		{ side: "left", class: "data-[state=closed]:translate-x-2" },
		{ side: "right", class: "data-[state=closed]:-translate-x-2" },
	],
	defaultVariants: {
		side: "top",
	},
});

/** Metadata every focusable node registers with, read at keydown time so it is never stale. */
export type SpeedDialNodeMeta = {
	readonly getDisabled: () => boolean;
};

export type SpeedDialRootStateProps = {
	readonly getOpen: () => boolean;
	readonly setOpen: (open: boolean) => void;
	readonly getSide: () => SpeedDialSide;
	readonly getActivationMode: () => SpeedDialActivationMode;
	readonly getDelay: () => number;
	readonly getDisabled: () => boolean;
	readonly contentId: string;
};

/**
 * One instance per `<SpeedDial.Root>`, published on context.
 *
 * Replaces upstream's hand-built pub/sub `Store` (65-104, 176-211) *and* its `SpeedDialContextValue`
 * (112-137, 263-288) — runes are already fine-grained, so `subscribe`/`notify`/`getState`/`setState`
 * and the `useSyncExternalStore` selector have no counterpart here. Reactive inputs arrive as
 * getter functions rather than snapshots.
 */
export class SpeedDialRootState {
	#props!: SpeedDialRootStateProps;

	/** `aria-controls` on the trigger, `id` on the content. */
	readonly contentId: string;

	readonly open: boolean = $derived(this.#props.getOpen());
	readonly side: SpeedDialSide = $derived(this.#props.getSide());
	readonly activationMode: SpeedDialActivationMode = $derived(this.#props.getActivationMode());
	readonly delay: number = $derived(this.#props.getDelay());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly orientation: SpeedDialOrientation = $derived(getOrientation(this.side));

	/** The trigger plus every action — the composite's `Tab` exit boundary. */
	readonly nodes = new DomOrderedCollection<SpeedDialNodeMeta>();

	/** Every `<SpeedDial.Item>`, in document order — the source of each item's stagger index. */
	readonly items = new DomOrderedCollection();

	/** Set by the trigger, so `Escape` can restore focus to it. */
	triggerElement = $state<HTMLElement | null>(null);

	/** Set by the root, for the `contains()` check in outside dismissal. */
	rootElement = $state<HTMLElement | null>(null);

	/** Not `$state` — nothing renders from it. Upstream `isPointerInsideReactTreeRef` (173). */
	#pointerInsideTree = false;

	/** Shared by the trigger and the content, exactly as upstream's `hoverCloseTimerRef` (174). */
	#hoverCloseTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(props: SpeedDialRootStateProps) {
		this.#props = props;
		this.contentId = props.contentId;
	}

	/** Short-circuits on an unchanged value, then reports the transition (upstream 194-198). */
	setOpen(next: boolean): void {
		if (Object.is(this.open, next)) return;
		this.#props.setOpen(next);
	}

	toggle(): void {
		this.setOpen(!this.open);
	}

	/** `Escape` hands focus back to the trigger — the MDX contract. */
	focusTrigger(): void {
		this.triggerElement?.focus();
	}

	/** The `Tab` boundary candidates, with disabled actions removed (upstream 674-676). */
	enabledNodeElements(): HTMLElement[] {
		return this.nodes.ordered
			.filter((entry) => !entry.meta.getDisabled())
			.map((entry) => entry.element);
	}

	/** Capture-phase root guard: was the pointer pressed inside a registered node? (upstream 247-261) */
	markPointerInsideTree(target: EventTarget | null): void {
		this.#pointerInsideTree =
			target instanceof Node && this.nodes.elements().some((element) => element.contains(target));
	}

	get pointerInsideTree(): boolean {
		return this.#pointerInsideTree;
	}

	/** Mirrors upstream's unconditional reset at the end of every `pointerdown` (738). */
	resetPointerInsideTree(): void {
		this.#pointerInsideTree = false;
	}

	scheduleHoverClose(ms: number = DEFAULT_HOVER_CLOSE_DELAY): void {
		this.cancelHoverClose();
		this.#hoverCloseTimer = setTimeout(() => {
			this.#hoverCloseTimer = null;
			this.setOpen(false);
		}, ms);
	}

	cancelHoverClose(): void {
		if (this.#hoverCloseTimer === null) return;
		clearTimeout(this.#hoverCloseTimer);
		this.#hoverCloseTimer = null;
	}

	/** Clears the shared hover timer. Called from the root's `$effect` teardown. */
	destroy(): void {
		this.cancelHoverClose();
	}
}

export type SpeedDialContentStateProps = {
	readonly root: SpeedDialRootState;
	readonly getForceMount: () => boolean;
};

/**
 * One instance per `<SpeedDial.Content>`, published on an **optional** context.
 *
 * Replaces upstream's `SpeedDialItemImpl` wrapper and its context (454-487) plus the `renderState`
 * pair (571-622). It stays optional because upstream's `useSpeedDialItemImplContext()` deliberately
 * does not throw (462-464): an `<Item>` rendered outside a `<Content>` must still render, with
 * `delay = 0` and `data-state="closed"`.
 */
export class SpeedDialContentState {
	#props!: SpeedDialContentStateProps;

	/** Drives `data-state` on the content and every item — one frame behind `open`. */
	animating = $state(false);

	/**
	 * Upstream's `renderState.shouldRender`: latched on when the dial opens and
	 * cleared only by the unmount timer, so the content survives the whole exit stagger.
	 *
	 * It must be **latched on open**, not set on close. Setting it when `open` flips to `false` is one
	 * flush too late: the `{#if}` re-evaluates before user effects run, so the content would unmount
	 * and immediately remount — losing focus mid-`Tab` and unregistering every item before the exit
	 * duration is computed.
	 */
	shouldRender = $state(false);

	get root(): SpeedDialRootState {
		return this.#props.root;
	}

	readonly forceMount: boolean = $derived(this.#props.getForceMount());
	readonly open: boolean = $derived(this.#props.root.open);
	readonly mounted: boolean = $derived(
		this.forceMount || this.#props.root.open || this.shouldRender,
	);
	readonly itemCount: number = $derived(this.#props.root.items.size);

	/** Upstream's unmount window: the last item's delay plus one animation (605-608). */
	readonly exitDuration: number = $derived(
		Math.max(this.itemCount - 1, 0) * DEFAULT_ITEM_DELAY + DEFAULT_ANIMATION_DURATION,
	);

	constructor(props: SpeedDialContentStateProps) {
		this.#props = props;
	}

	/**
	 * The stagger delay of the item registered as `id`, in ms. An item that has not registered — it
	 * renders through `child`, so it owns no element — has no place in the sequence and no delay.
	 */
	delayFor(id: string): number {
		const index = this.#props.root.items.indexById.get(id);
		if (index === undefined) return 0;
		return getItemDelay(index, this.itemCount, this.animating);
	}
}

/**
 * One instance per `<SpeedDial.Item>`, published on context. Upstream `SpeedDialItemContextValue`
 * (876-890): the two ids that tie an action to its sibling label, visible or `sr-only`.
 */
export class SpeedDialItemState {
	readonly actionId: string;
	readonly labelId: string;

	constructor(props: { readonly actionId: string; readonly labelId: string }) {
		this.actionId = props.actionId;
		this.labelId = props.labelId;
	}
}

const SPEED_DIAL_CONTEXT_KEY = Symbol("speed-dial");

export function setSpeedDialContext(state: SpeedDialRootState): SpeedDialRootState {
	return setContext(SPEED_DIAL_CONTEXT_KEY, state);
}

/** Read the root's state, throwing when there is no `<SpeedDial.Root>` ancestor. */
export function getSpeedDialContext(consumerName: string): SpeedDialRootState {
	if (!hasContext(SPEED_DIAL_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<SpeedDial.Root>\`.`);
	}
	return getContext<SpeedDialRootState>(SPEED_DIAL_CONTEXT_KEY);
}

const SPEED_DIAL_CONTENT_CONTEXT_KEY = Symbol("speed-dial-content");

export function setSpeedDialContentContext(state: SpeedDialContentState): SpeedDialContentState {
	return setContext(SPEED_DIAL_CONTENT_CONTEXT_KEY, state);
}

/** Deliberately non-throwing: an `<Item>` outside a `<Content>` still renders. */
export function getSpeedDialContentContext(): SpeedDialContentState | undefined {
	if (!hasContext(SPEED_DIAL_CONTENT_CONTEXT_KEY)) return undefined;
	return getContext<SpeedDialContentState>(SPEED_DIAL_CONTENT_CONTEXT_KEY);
}

const SPEED_DIAL_ITEM_CONTEXT_KEY = Symbol("speed-dial-item");

export function setSpeedDialItemContext(state: SpeedDialItemState): SpeedDialItemState {
	return setContext(SPEED_DIAL_ITEM_CONTEXT_KEY, state);
}

/** Read the item's ids, throwing when there is no `<SpeedDial.Item>` ancestor. */
export function getSpeedDialItemContext(consumerName: string): SpeedDialItemState {
	if (!hasContext(SPEED_DIAL_ITEM_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<SpeedDial.Item>\`.`);
	}
	return getContext<SpeedDialItemState>(SPEED_DIAL_ITEM_CONTEXT_KEY);
}
