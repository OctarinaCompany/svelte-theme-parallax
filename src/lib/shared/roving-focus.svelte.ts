import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import { getContext, hasContext, setContext } from "svelte";

import { DomOrderedCollection, type DomOrderedEntry } from "./dom-ordered-collection.svelte.js";

/**
 * Component-agnostic implementation of the WAI-ARIA Toolbar roving-tabindex pattern: one tab stop
 * for a whole group of controls, arrow keys moving between them, `Home`/`End` jumping to the ends,
 * `loop` wrapping, disabled entries skipped and the horizontal arrows inverted under `dir="rtl"`.
 *
 * Lives in `src/lib/shared/` (registry:lib pattern): first ported for `action-bar` and consumed
 * through its barrel by `selection-toolbar`, with the pure helpers `focusFirst`,
 * `wrapArray` and `getDirectionAwareKey` also composed by `stepper` — kept out of any one
 * component's folder so a registry install of one consumer does not drag in another. Nothing here
 * imports a component part. The item registry itself is *not* bespoke: it is the shared
 * {@link DomOrderedCollection}, which already implements upstream's `compareDocumentPosition`
 * ordering and `isConnected` filter.
 */

/**
 * The axis a group's arrow keys travel. Structurally identical to `action-bar`'s
 * `FloatingOrientation`, declared locally so this module depends on no component folder.
 */
export type RovingFocusOrientation = "horizontal" | "vertical";

/** Where a navigation key wants focus to land. Upstream's `focusIntent` union. */
export const ROVING_FOCUS_INTENTS = ["first", "last", "prev", "next"] as const;
export type RovingFocusIntent = (typeof ROVING_FOCUS_INTENTS)[number];

/**
 * Metadata every item registers with. `disabled` is a **getter**, read at event time, so an item
 * that becomes disabled after registration is skipped without re-registering.
 */
export type RovingFocusItemMeta = {
	readonly getDisabled: () => boolean;
};

/** `{ bubbles: false, cancelable: true }` — upstream `EVENT_OPTIONS`. */
const DEFAULT_ENTRY_FOCUS_OPTIONS: CustomEventInit = { bubbles: false, cancelable: true };

/**
 * Focus the first candidate that actually takes focus. Upstream `focusFirst` (35-47).
 *
 * Two behaviours make this more than `candidates[0]?.focus()`: it returns without moving anything
 * when the first candidate is *already* the active element (so `Home` on the first item is a no-op
 * rather than a jump), and it walks on when a candidate refuses focus (detached or disabled).
 */
export function focusFirst(candidates: readonly HTMLElement[], preventScroll = false): void {
	const previouslyFocused = document.activeElement;
	for (const candidate of candidates) {
		if (candidate === previouslyFocused) return;
		candidate.focus({ preventScroll });
		if (document.activeElement !== previouslyFocused) return;
	}
}

/** Rotate `array` so that `startIndex` comes first. Upstream `wrapArray` (49-53). */
export function wrapArray<T>(array: readonly T[], startIndex: number): T[] {
	return array.map((_, index) => array[(startIndex + index) % array.length] as T);
}

/** Swap the two horizontal arrows under `rtl`. Upstream `getDirectionAwareKey` (55-62). */
export function getDirectionAwareKey(key: string, dir?: Direction): string {
	if (dir !== "rtl") return key;
	if (key === "ArrowLeft") return "ArrowRight";
	if (key === "ArrowRight") return "ArrowLeft";
	return key;
}

/**
 * Resolve a key into a navigation intent for the given axis and reading direction, or `undefined`
 * when the toolbar pattern does not own the key. Upstream's inline branch,
 * extracted so it is unit-testable and reusable.
 */
export function getFocusIntent(
	key: string,
	orientation: RovingFocusOrientation,
	dir?: Direction,
): RovingFocusIntent | undefined {
	const resolved = getDirectionAwareKey(key, dir);
	if (resolved === "Home") return "first";
	if (resolved === "End") return "last";
	if (orientation === "horizontal") {
		if (resolved === "ArrowLeft") return "prev";
		if (resolved === "ArrowRight") return "next";
		return undefined;
	}
	if (resolved === "ArrowUp") return "prev";
	if (resolved === "ArrowDown") return "next";
	return undefined;
}

export type RovingFocusGroupStateProps = {
	readonly getDir: () => Direction;
	readonly getOrientation: () => RovingFocusOrientation;
	readonly getLoop: () => boolean;
	/** Name of the cancelable event dispatched on the group when focus enters it from the keyboard. */
	readonly entryFocusEventName: string;
	/** @default { bubbles: false, cancelable: true } */
	readonly entryFocusEventOptions?: CustomEventInit;
};

/**
 * One instance per roving-focus group, published on context.
 *
 * Replaces upstream's `FocusContext` plus the `ActionBarGroup` state it carries (89-110, 265-391).
 * `bits-ui`'s `Toolbar` cannot stand in: it scopes roving focus to the whole bar, which would rob
 * the close button of its own tab stop, and its `Group` is a toggle group rather than a
 * `role="group"` focus sub-scope.
 */
export class RovingFocusGroupState {
	// `$derived` below is lazy at runtime, but svelte-check cannot see that across the constructor
	// assignment — the `DirectionProviderState` annotation, for the same reason.
	#props!: RovingFocusGroupStateProps;

	/** Document-ordered, `isConnected`-filtered registry of the group's items. */
	readonly items = new DomOrderedCollection<RovingFocusItemMeta>();

	/** Identity of the item that currently owns the group's single tab stop. */
	tabStopId = $state<string | null>(null);

	/** Set by an item's `Shift+Tab`, cleared when focus leaves the group. */
	isTabbingBackOut = $state(false);

	/** Upstream `isClickFocusRef` (272): read once inside a handler, never rendered — so not `$state`. */
	#isClickFocus = false;

	/**
	 * Enabled, attached items. Replaces upstream's manual `focusableItemCount` counter, which is a
	 * React workaround for not having derived state and double-counts when `disabled` toggles.
	 */
	readonly focusableCount: number = $derived(
		this.items.ordered.filter((entry) => !entry.meta.getDisabled()).length,
	);

	/** Upstream's group `tabIndex` expression (402). */
	readonly tabIndex: number = $derived(this.isTabbingBackOut || this.focusableCount === 0 ? -1 : 0);

	constructor(props: RovingFocusGroupStateProps) {
		this.#props = props;
	}

	register(id: string, element: HTMLElement, meta: RovingFocusItemMeta): void {
		this.items.register(id, element, meta);
	}

	unregister(id: string): void {
		this.items.unregister(id);
	}

	isTabStop(id: string): boolean {
		return this.tabStopId === id;
	}

	/** Upstream `onItemFocus` (276-278). */
	onItemFocus(id: string): void {
		this.tabStopId = id;
	}

	/** Upstream `onItemShiftTab` (280-282). */
	onItemShiftTab(): void {
		this.isTabbingBackOut = true;
	}

	/** Upstream `onMouseDown` (360-368). */
	onGroupMouseDown(): void {
		this.#isClickFocus = true;
	}

	/** Upstream `onBlur` (318-326) — React's `onBlur` is the bubbling `focusout`. */
	onGroupFocusOut(): void {
		this.isTabbingBackOut = false;
	}

	/**
	 * Upstream `onFocus` (328-358). React's `onFocus` is the bubbling `focusin`, which is what makes
	 * the `target === currentTarget` guard meaningful: only focus landing on the group itself is an
	 * entry, focus landing on an item is not.
	 */
	onGroupFocusIn(event: FocusEvent): void {
		const isKeyboardFocus = !this.#isClickFocus;

		if (event.target === event.currentTarget && isKeyboardFocus && !this.isTabbingBackOut) {
			const entryFocusEvent = new CustomEvent(
				this.#props.entryFocusEventName,
				this.#props.entryFocusEventOptions ?? DEFAULT_ENTRY_FOCUS_OPTIONS,
			);
			(event.currentTarget as HTMLElement).dispatchEvent(entryFocusEvent);

			if (!entryFocusEvent.defaultPrevented) {
				const enabled = this.#enabledEntries();
				const current = enabled.find((entry) => entry.id === this.tabStopId);
				const candidates = (current ? [current, ...enabled] : enabled).map(
					(entry) => entry.element,
				);
				focusFirst(candidates, false);
			}
		}

		this.#isClickFocus = false;
	}

	/**
	 * Move focus according to `intent`, starting from `current`. Upstream's candidate arithmetic
	 * (537-552) verbatim: the reverse-then-wrap trick is what lets one code path serve
	 * prev/next/first/last, and paraphrasing it is how off-by-one wrap bugs get introduced.
	 */
	navigate(intent: RovingFocusIntent, current: HTMLElement): void {
		let candidates = this.#enabledEntries().map((entry) => entry.element);

		if (intent === "last") {
			candidates = [...candidates].reverse();
		} else if (intent === "prev" || intent === "next") {
			if (intent === "prev") candidates = [...candidates].reverse();
			const currentIndex = candidates.indexOf(current);
			candidates = this.#props.getLoop()
				? wrapArray(candidates, currentIndex + 1)
				: candidates.slice(currentIndex + 1);
		}

		// Deferred exactly as upstream (552), so the focus move lands after the keydown's own
		// default handling rather than inside it.
		queueMicrotask(() => focusFirst(candidates));
	}

	/** The key of the item whose keydown produced `intent`, resolved through the reading direction. */
	focusIntentFor(key: string): RovingFocusIntent | undefined {
		return getFocusIntent(key, this.#props.getOrientation(), this.#props.getDir());
	}

	#enabledEntries(): DomOrderedEntry<RovingFocusItemMeta>[] {
		return this.items.ordered.filter((entry) => !entry.meta.getDisabled());
	}
}

const ROVING_FOCUS_CONTEXT_KEY = Symbol("roving-focus");

export function setRovingFocusContext(state: RovingFocusGroupState): RovingFocusGroupState {
	return setContext(ROVING_FOCUS_CONTEXT_KEY, state);
}

/**
 * Read the enclosing group's state, throwing when there is none. Upstream `useFocusContext`
 * (102-110) names its internal `FocusProvider`; the message here names the Svelte ancestor a
 * consumer can actually write.
 */
export function getRovingFocusContext(
	consumerName: string,
	providerName = "<ActionBar.Group>",
): RovingFocusGroupState {
	if (!hasContext(ROVING_FOCUS_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`${providerName}\`.`);
	}
	return getContext<RovingFocusGroupState>(ROVING_FOCUS_CONTEXT_KEY);
}
