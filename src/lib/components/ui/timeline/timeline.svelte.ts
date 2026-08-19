import { getContext, hasContext, setContext, untrack } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

/** Layout axis. Upstream `Orientation`. */
export const TIMELINE_ORIENTATIONS = ["vertical", "horizontal"] as const;
export type TimelineOrientation = (typeof TIMELINE_ORIENTATIONS)[number];

/** Layout style. Upstream `Variant`. */
export const TIMELINE_VARIANTS = ["default", "alternate"] as const;
export type TimelineVariant = (typeof TIMELINE_VARIANTS)[number];

/** An item's position relative to `activeIndex`. Upstream `Status`. */
export const TIMELINE_STATUSES = ["completed", "active", "pending"] as const;
export type TimelineStatus = (typeof TIMELINE_STATUSES)[number];

/**
 * Upstream `getItemStatus`, verbatim: no clamping, so an out-of-range `activeIndex` still yields a
 * valid status for every item.
 */
export function getTimelineItemStatus(itemIndex: number, activeIndex?: number): TimelineStatus {
	if (activeIndex === undefined) return "pending";
	if (itemIndex < activeIndex) return "completed";
	if (itemIndex === activeIndex) return "active";
	return "pending";
}

/**
 * Upstream `getSortedEntries`, generalised over the entry shape and made non-mutating (returns a
 * new array; sorting in place would mutate a `$state` array and re-trigger its own reader).
 */
export function sortByDocumentPosition<T extends { element: Element | null }>(entries: T[]): T[] {
	return [...entries].sort((a, b) => {
		if (!a.element || !b.element) return 0;
		const position = a.element.compareDocumentPosition(b.element);
		if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
		if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
		return 0;
	});
}

/** One registered item. `element` is the `<li>` (or the caller's `child` element). */
export type TimelineItemEntry = {
	readonly id: string;
	readonly element: HTMLElement;
};

export type TimelineStateProps = {
	readonly getOrientation: () => TimelineOrientation;
	readonly getVariant: () => TimelineVariant;
	readonly getDir: () => Direction;
	readonly getActiveIndex: () => number | undefined;
};

/**
 * One instance per `<Timeline.Root>`. Merges upstream's `Store`/`StoreContext` and
 * `TimelineContextValue`/`TimelineContext`: every consumer of the item collection
 * also consumes `orientation`/`variant`/`activeIndex`, and both are root-owned.
 */
export class TimelineState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: TimelineStateProps;
	#items: TimelineItemEntry[] = $state([]);

	readonly orientation: TimelineOrientation = $derived(this.#props.getOrientation());
	readonly variant: TimelineVariant = $derived(this.#props.getVariant());
	readonly dir: Direction = $derived(this.#props.getDir());
	readonly activeIndex: number | undefined = $derived(this.#props.getActiveIndex());

	readonly orderedIds: string[] = $derived.by(() =>
		sortByDocumentPosition(this.#items).map((item) => item.id),
	);
	readonly count: number = $derived(this.orderedIds.length);

	constructor(props: TimelineStateProps) {
		this.#props = props;
	}

	register(id: string, element: HTMLElement): void {
		// The registering item's own `$effect` calls this, so reading `#items` here must be
		// untracked — otherwise this effect would depend on the very state it writes next,
		// looping forever.
		this.#items = untrack(() => [...this.#items.filter((item) => item.id !== id), { id, element }]);
	}

	unregister(id: string): void {
		this.#items = untrack(() => this.#items.filter((item) => item.id !== id));
	}

	getItemIndex(id: string): number {
		return this.orderedIds.indexOf(id);
	}

	getItemStatus(id: string): TimelineStatus {
		return getTimelineItemStatus(this.getItemIndex(id), this.activeIndex);
	}

	getNextItemStatus(id: string): TimelineStatus | undefined {
		const index = this.getItemIndex(id);
		if (index === -1 || index === this.orderedIds.length - 1) return undefined;
		return getTimelineItemStatus(index + 1, this.activeIndex);
	}
}

export type TimelineItemStateProps = {
	readonly getId: () => string;
};

/** One instance per `<Timeline.Item>`. Maps upstream `TimelineItemContextValue`. */
export class TimelineItemState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags these fields as used before their constructor
	// assignment.
	#root!: TimelineState;
	#props!: TimelineItemStateProps;

	readonly id: string = $derived(this.#props.getId());
	readonly index: number = $derived(this.#root.getItemIndex(this.id));
	readonly status: TimelineStatus = $derived(
		getTimelineItemStatus(this.index, this.#root.activeIndex),
	);
	readonly isAlternateRight: boolean = $derived(
		this.#root.variant === "alternate" && this.index % 2 === 1,
	);
	readonly nextStatus: TimelineStatus | undefined = $derived(this.#root.getNextItemStatus(this.id));
	readonly isLast: boolean = $derived(this.nextStatus === undefined);
	readonly isConnectorCompleted: boolean = $derived(
		this.nextStatus === "completed" || this.nextStatus === "active",
	);

	constructor(root: TimelineState, props: TimelineItemStateProps) {
		this.#root = root;
		this.#props = props;
	}
}

const TIMELINE_CONTEXT_KEY = Symbol("timeline");
const TIMELINE_ITEM_CONTEXT_KEY = Symbol("timeline-item");

export function setTimelineContext(state: TimelineState): TimelineState {
	return setContext(TIMELINE_CONTEXT_KEY, state);
}

export function getTimelineContext(consumerName: string): TimelineState {
	if (!hasContext(TIMELINE_CONTEXT_KEY)) {
		throw new Error(`\`<Timeline.${consumerName}>\` must be used within \`<Timeline.Root>\`.`);
	}
	return getContext<TimelineState>(TIMELINE_CONTEXT_KEY);
}

export function setTimelineItemContext(state: TimelineItemState): TimelineItemState {
	return setContext(TIMELINE_ITEM_CONTEXT_KEY, state);
}

export function getTimelineItemContext(consumerName: string): TimelineItemState {
	if (!hasContext(TIMELINE_ITEM_CONTEXT_KEY)) {
		throw new Error(`\`<Timeline.${consumerName}>\` must be used within \`<Timeline.Item>\`.`);
	}
	return getContext<TimelineItemState>(TIMELINE_ITEM_CONTEXT_KEY);
}
