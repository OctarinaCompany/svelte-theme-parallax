import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import {
	DomOrderedCollection,
	type DomOrderedEntry,
} from "$lib/shared/dom-ordered-collection.svelte.js";
import { focusFirst, getDirectionAwareKey, wrapArray } from "$lib/shared/roving-focus.svelte.js";
import { getContext, hasContext, setContext } from "svelte";
import { SvelteMap } from "svelte/reactivity";

/**
 * The three state classes behind `<Stepper.Root>`, `<Stepper.Item>` and `<Stepper.List>`.
 *
 * Upstream builds a hand-rolled `useSyncExternalStore` store with
 * `useLazyRef`, `useAsRef` and `useIsomorphicLayoutEffect`. All three hooks exist only to work
 * around React's re-render model — a `$state` field is already fine-grained and a getter-function
 * prop already reads the latest callback — so the store is *translated*, not transliterated.
 *
 * Two behaviours are composed rather than rewritten: the document-ordered trigger registry is the
 * shared {@link DomOrderedCollection}, and the pure roving-focus helpers `focusFirst`, `wrapArray`
 * and `getDirectionAwareKey` come from the shared roving-focus module.
 */

/** Every value `orientation` accepts, in upstream declaration order. */
export const STEPPER_ORIENTATIONS = ["horizontal", "vertical"] as const;
export type StepperOrientation = (typeof STEPPER_ORIENTATIONS)[number];

/** Every value `activationMode` accepts. Upstream `ActivationMode`. */
export const STEPPER_ACTIVATION_MODES = ["automatic", "manual"] as const;
export type StepperActivationMode = (typeof STEPPER_ACTIVATION_MODES)[number];

/** The `data-state` a step, trigger, indicator or separator reports. Upstream `DataState` (35). */
export const STEPPER_DATA_STATES = ["inactive", "active", "completed"] as const;
export type StepperDataState = (typeof STEPPER_DATA_STATES)[number];

/** Which way a requested step change travels. Upstream `NavigationDirection` (33). */
export type StepperNavigationDirection = "next" | "prev";

/** Where a navigation key wants focus to land. Upstream `FocusIntent` (55). */
export type StepperFocusIntent = "first" | "last" | "prev" | "next";

/** The cancelable event the list dispatches on itself when keyboard focus enters the group. */
export const STEPPER_ENTRY_FOCUS = "stepperFocusGroup.onEntryFocus";

/** Upstream `EVENT_OPTIONS`. */
export const STEPPER_EVENT_OPTIONS: CustomEventInit = { bubbles: false, cancelable: true };

/** One registered step. Upstream `StepState` (135-139). */
export type StepRegistration = {
	readonly value: string;
	readonly completed: boolean;
	readonly disabled: boolean;
};

/** Upstream `MAP_KEY_TO_FOCUS_INTENT` (57-66) — note the `PageUp`/`PageDown` rows. */
const MAP_KEY_TO_FOCUS_INTENT: Readonly<Record<string, StepperFocusIntent>> = {
	ArrowLeft: "prev",
	ArrowUp: "prev",
	ArrowRight: "next",
	ArrowDown: "next",
	PageUp: "first",
	Home: "first",
	PageDown: "last",
	End: "last",
};

/** Build one part's element id. Upstream `getId` (47-53). */
export function getStepperId(
	rootId: string,
	variant: "trigger" | "content" | "title" | "description",
	value: string,
): string {
	return `${rootId}-${variant}-${value}`;
}

/**
 * Upstream `getDataState` (110-133). The precedence is load-bearing and each rule is asserted by an
 * upstream test:
 *
 * 1. an explicit `completed` flag wins, **before** the active check;
 * 2. the active step is `"active"` — except for the `"separator"` variant, where the line *after*
 *    the active step must not be filled;
 * 3. anything positioned before the active step is `"completed"`;
 * 4. everything else is `"inactive"`.
 */
export function getStepperDataState(
	value: string | undefined,
	itemValue: string,
	step: StepRegistration | undefined,
	stepKeys: readonly string[],
	variant: "item" | "separator" = "item",
): StepperDataState {
	const currentIndex = stepKeys.indexOf(itemValue);

	if (step?.completed) return "completed";

	if (value === itemValue) {
		return variant === "separator" ? "inactive" : "active";
	}

	if (value) {
		const activeIndex = stepKeys.indexOf(value);
		if (activeIndex > currentIndex) return "completed";
	}

	return "inactive";
}

/**
 * Resolve a key into a navigation intent for the given axis and reading direction, or `undefined`
 * when the stepper does not own the key. Upstream `getFocusIntent` (77-88).
 *
 * The `rtl` swap is delegated to the shared roving-focus module's `getDirectionAwareKey`; the key
 * map itself is stepper's own, because it adds `PageUp`/`PageDown` that the toolbar pattern does not
 * have.
 */
export function getStepperFocusIntent(
	key: string,
	orientation: StepperOrientation,
	dir?: Direction,
): StepperFocusIntent | undefined {
	const resolved = getDirectionAwareKey(key, dir);
	if (orientation === "horizontal" && (resolved === "ArrowUp" || resolved === "ArrowDown")) {
		return undefined;
	}
	if (orientation === "vertical" && (resolved === "ArrowLeft" || resolved === "ArrowRight")) {
		return undefined;
	}
	return MAP_KEY_TO_FOCUS_INTENT[resolved];
}

export type StepperRootStateProps = {
	readonly getValue: () => string;
	readonly setValue: (value: string) => void;
	readonly getOrientation: () => StepperOrientation;
	readonly getActivationMode: () => StepperActivationMode;
	readonly getDisabled: () => boolean;
	readonly getNonInteractive: () => boolean;
	readonly getLoop: () => boolean;
	readonly getDir: () => Direction;
	readonly getOnValidate: () =>
		| ((value: string, direction: StepperNavigationDirection) => boolean | Promise<boolean>)
		| undefined;
	readonly getOnValueComplete: () => ((value: string, completed: boolean) => void) | undefined;
	readonly getOnValueAdd: () => ((value: string) => void) | undefined;
	readonly getOnValueRemove: () => ((value: string) => void) | undefined;
	/** The `id ?? $props.id()` every part's element id is derived from. */
	readonly getRootId: () => string;
};

/**
 * One instance per `<Stepper.Root>`, published on context. Replaces upstream's `Store`,
 * `StoreState` and `StepperContextValue` (141-227, 250-354).
 */
export class StepperRootState {
	// `$derived` below is lazy at runtime, but svelte-check cannot see that across the constructor
	// assignment — the same limitation `DirectionProviderState` documents.
	#props!: StepperRootStateProps;

	/**
	 * Every registered step, keyed by value, in `<Stepper.Item>` mount order. A JS `Map` preserves
	 * insertion order, which is what `aria-posinset`, `getStepperDataState`, `Stepper.Prev` and
	 * `Stepper.Next` all index into.
	 */
	readonly steps = new SvelteMap<string, StepRegistration>();

	/**
	 * Bumped by every validated navigation. An awaited result is applied only while its generation is
	 * still the current one *and* the value it was computed against has not been replaced — upstream
	 * writes the stale result unconditionally (283-298), which would clobber a newer navigation.
	 */
	#validationGeneration = 0;

	readonly value: string = $derived(this.#props.getValue());
	readonly orientation: StepperOrientation = $derived(this.#props.getOrientation());
	readonly activationMode: StepperActivationMode = $derived(this.#props.getActivationMode());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly nonInteractive: boolean = $derived(this.#props.getNonInteractive());
	readonly loop: boolean = $derived(this.#props.getLoop());
	readonly dir: Direction = $derived(this.#props.getDir());
	readonly rootId: string = $derived(this.#props.getRootId());

	readonly stepKeys: readonly string[] = $derived(Array.from(this.steps.keys()));
	readonly stepCount: number = $derived(this.steps.size);
	readonly activeIndex: number = $derived(this.value ? this.stepKeys.indexOf(this.value) : -1);

	/** Upstream `StepperPrev`'s `currentIndex <= 0` guard (1188). */
	readonly canGoPrev: boolean = $derived(!(this.activeIndex <= 0));

	/** Upstream `StepperNext`'s `currentIndex >= stepKeys.length - 1` guard (1231). */
	readonly canGoNext: boolean = $derived(!(this.activeIndex >= this.stepCount - 1));

	constructor(props: StepperRootStateProps) {
		this.#props = props;
	}

	/** Upstream `addStep` (300-305). */
	addStep(value: string, completed: boolean, disabled: boolean): void {
		this.steps.set(value, { value, completed, disabled });
		this.#props.getOnValueAdd()?.(value);
	}

	/**
	 * Upstream `setStep` (311-323): updates an already-registered step in place and notifies **only**
	 * when the `completed` flag actually flips.
	 */
	setStep(value: string, completed: boolean, disabled: boolean): void {
		const step = this.steps.get(value);
		if (!step) return;
		if (step.completed === completed && step.disabled === disabled) return;

		this.steps.set(value, { value, completed, disabled });

		if (completed !== step.completed) {
			this.#props.getOnValueComplete()?.(value, completed);
		}
	}

	/** Upstream `removeStep` (306-310). */
	removeStep(value: string): void {
		if (!this.steps.delete(value)) return;
		this.#props.getOnValueRemove()?.(value);
	}

	/** Upstream `hasValidation` (299). */
	hasValidation(): boolean {
		return this.#props.getOnValidate() !== undefined;
	}

	/**
	 * Upstream `setState('value', …)` (271-282): a write of the value already held is dropped without
	 * notifying, which is what keeps `onValueChange` from firing when the active step is re-clicked.
	 */
	setValue(next: string): void {
		if (Object.is(this.#props.getValue(), next)) return;
		this.#props.setValue(next);
	}

	/**
	 * Upstream `setStateWithValidation` (283-298), plus the staleness guard. A validator that
	 * rejects — or throws synchronously — blocks the move exactly like one resolving `false`
	 * (295-297).
	 */
	async setValueWithValidation(
		next: string,
		direction: StepperNavigationDirection,
	): Promise<boolean> {
		const validate = this.#props.getOnValidate();

		if (!validate) {
			this.setValue(next);
			return true;
		}

		const generation = ++this.#validationGeneration;
		const valueAtEntry = this.#props.getValue();

		try {
			const isValid = await validate(next, direction);

			if (isValid) {
				const isStale =
					generation !== this.#validationGeneration || this.#props.getValue() !== valueAtEntry;
				if (!isStale) this.setValue(next);
			}

			return isValid;
		} catch {
			return false;
		}
	}

	/** Upstream's inline `targetIndex > currentIndex ? 'next' : 'prev'` (773-775, 807-809, 890-897). */
	directionTo(targetValue: string): StepperNavigationDirection {
		return this.indexOf(targetValue) > this.activeIndex ? "next" : "prev";
	}

	/** Zero-based registration index, or `-1`. Upstream `stepIndex` (709). */
	indexOf(stepValue: string): number {
		return this.stepKeys.indexOf(stepValue);
	}

	/** One-based position, for `aria-posinset` and the default indicator content (711). */
	positionOf(stepValue: string): number {
		return this.indexOf(stepValue) + 1;
	}

	/** The `data-state` this step reports, for the item, trigger, indicator or separator. */
	dataStateFor(stepValue: string, variant: "item" | "separator" = "item"): StepperDataState {
		return getStepperDataState(
			this.value,
			stepValue,
			this.steps.get(stepValue),
			this.stepKeys,
			variant,
		);
	}

	/** Upstream `StepperPrev`'s click handler (1190-1202) — never consults `onValidate`. */
	goPrev(): void {
		if (!this.canGoPrev) return;

		const previous = this.stepKeys[Math.max(this.activeIndex - 1, 0)];
		if (previous) this.setValue(previous);
	}

	/** Upstream `StepperNext`'s click handler (1233-1245) — always routed through `onValidate`. */
	async goNext(): Promise<void> {
		if (!this.canGoNext) return;

		const next = this.stepKeys[Math.min(this.activeIndex + 1, this.stepCount - 1)];
		if (next) await this.setValueWithValidation(next, "next");
	}
}

export type StepperItemStateProps = {
	readonly getValue: () => string;
	readonly getDisabled: () => boolean;
};

/** One instance per `<Stepper.Item>`. Replaces upstream `StepperItemContextValue` (587-590). */
export class StepperItemState {
	// Both fields carry the definite-assignment `!` for the same reason `DirectionProviderState`
	// documents: the `$derived` members below are lazy at runtime, but svelte-check cannot see that
	// across the constructor assignment.
	#props!: StepperItemStateProps;
	#root!: StepperRootState;

	readonly value: string = $derived(this.#props.getValue());
	readonly step: StepRegistration | undefined = $derived(this.#root.steps.get(this.value));
	readonly disabled: boolean = $derived(this.step?.disabled ?? this.#props.getDisabled());
	readonly dataState: StepperDataState = $derived(this.#root.dataStateFor(this.value));
	readonly position: number = $derived(this.#root.positionOf(this.value));

	readonly triggerId: string = $derived(getStepperId(this.#root.rootId, "trigger", this.value));
	readonly contentId: string = $derived(getStepperId(this.#root.rootId, "content", this.value));
	readonly titleId: string = $derived(getStepperId(this.#root.rootId, "title", this.value));
	readonly descriptionId: string = $derived(
		getStepperId(this.#root.rootId, "description", this.value),
	);

	constructor(root: StepperRootState, props: StepperItemStateProps) {
		this.#root = root;
		this.#props = props;
	}
}

/**
 * Metadata every trigger registers with. Both members are **getters**, read at event time, so a
 * trigger that becomes disabled after registration is skipped without re-registering.
 */
export type StepperTriggerMeta = {
	readonly getDisabled: () => boolean;
	readonly getValue: () => string;
};

export type StepperFocusStateProps = {
	/** @default STEPPER_ENTRY_FOCUS */
	readonly entryFocusEventName?: string;
	/** @default { bubbles: false, cancelable: true } */
	readonly entryFocusEventOptions?: CustomEventInit;
};

/**
 * One instance per `<Stepper.List>`: the roving-tabindex group. Replaces upstream's `FocusContext`
 * plus the `StepperList` body (379-400, 424-555).
 *
 * `action-bar`'s `RovingFocusGroupState` cannot stand in — it cannot express a focus move an
 * `await onValidate` may veto, it has no notion of a *selected* value for entry focus, and its key
 * map has no `PageUp`/`PageDown`. What *is* reusable was reused: the registry is the shared
 * `DomOrderedCollection` and the three pure helpers come from the shared roving-focus module.
 */
export class StepperFocusState {
	#props!: StepperFocusStateProps;

	/** Document-ordered, `isConnected`-filtered registry of the list's triggers. */
	readonly items = new DomOrderedCollection<StepperTriggerMeta>();

	/** Identity of the trigger that currently owns the group's single tab stop. Upstream 424. */
	tabStopId = $state<string | null>(null);

	/** Set by a trigger's `Shift+Tab`, cleared when focus leaves the list. Upstream 425. */
	isTabbingBackOut = $state(false);

	/** Upstream `isClickFocusRef` (427): read inside handlers, never rendered — so not `$state`. */
	#isClickFocus = false;

	/**
	 * Enabled, attached triggers. Replaces upstream's manual `focusableItemCount` (426), a React
	 * workaround for not having derived state.
	 */
	readonly focusableCount: number = $derived(
		this.items.ordered.filter((entry) => !entry.meta.getDisabled()).length,
	);

	/** Upstream's list `tabIndex` expression (567). */
	readonly tabIndex: number = $derived(this.isTabbingBackOut || this.focusableCount === 0 ? -1 : 0);

	constructor(props: StepperFocusStateProps = {}) {
		this.#props = props;
	}

	register(id: string, element: HTMLElement, meta: StepperTriggerMeta): void {
		this.items.register(id, element, meta);
	}

	unregister(id: string): void {
		this.items.unregister(id);
	}

	isTabStop(id: string): boolean {
		return this.tabStopId === id;
	}

	/** Upstream `onItemFocus` (432-434). */
	onItemFocus(id: string): void {
		this.tabStopId = id;
	}

	/** Upstream `onItemShiftTab` (436-438). */
	onItemShiftTab(): void {
		this.isTabbingBackOut = true;
	}

	/** Upstream `onMouseDown` (523-532). */
	onListMouseDown(): void {
		this.#isClickFocus = true;
	}

	/** Upstream `onBlur` (474-482) — React's `onBlur` is the bubbling `focusout`. */
	onListFocusOut(): void {
		this.isTabbingBackOut = false;
	}

	/**
	 * Upstream `onFocus` (484-521). React's `onFocus` is the bubbling `focusin`, which is what makes
	 * the `target === currentTarget` guard meaningful: only focus landing on the list itself is an
	 * entry, focus landing on a trigger is not.
	 *
	 * The candidate order is upstream's `[selectedItem, activeItem, currentItem, ...items]`
	 * (508-513); `activeItem` and `currentItem` collapse into one here because upstream registers
	 * `active: isTabStop`, so both resolve to the trigger holding the tab stop.
	 */
	onListFocusIn(event: FocusEvent, selectedValue: string): void {
		const isKeyboardFocus = !this.#isClickFocus;

		if (event.target === event.currentTarget && isKeyboardFocus && !this.isTabbingBackOut) {
			const entryFocusEvent = new CustomEvent(
				this.#props.entryFocusEventName ?? STEPPER_ENTRY_FOCUS,
				this.#props.entryFocusEventOptions ?? STEPPER_EVENT_OPTIONS,
			);
			(event.currentTarget as HTMLElement).dispatchEvent(entryFocusEvent);

			if (!entryFocusEvent.defaultPrevented) {
				const enabled = this.#enabledEntries();
				const selected = selectedValue
					? enabled.find((entry) => entry.meta.getValue() === selectedValue)
					: undefined;
				const current = enabled.find((entry) => entry.id === this.tabStopId);

				const candidates = [selected, current, ...enabled]
					.filter((entry): entry is DomOrderedEntry<StepperTriggerMeta> => entry !== undefined)
					.map((entry) => entry.element);

				focusFirst(candidates, false);
			}
		}

		this.#isClickFocus = false;
	}

	/**
	 * The ordered focus candidates for `intent`, starting from `current` — **without** focusing
	 * anything. That split is what lets `<Stepper.Trigger>` resolve `candidates[0]` back to a step
	 * value and await `onValidate` before committing the move (upstream 867-914).
	 *
	 * The reverse-then-slice arithmetic is upstream's (870-880) verbatim: paraphrasing it is how
	 * off-by-one wrap bugs get introduced.
	 */
	candidatesFor(
		intent: StepperFocusIntent,
		current: HTMLElement,
		loop: boolean,
	): readonly HTMLElement[] {
		let candidates = this.#enabledEntries().map((entry) => entry.element);

		if (intent === "last") {
			candidates = [...candidates].reverse();
		} else if (intent === "prev" || intent === "next") {
			if (intent === "prev") candidates = [...candidates].reverse();
			const currentIndex = candidates.indexOf(current);
			candidates = loop
				? wrapArray(candidates, currentIndex + 1)
				: candidates.slice(currentIndex + 1);
		}

		return candidates;
	}

	/** The registered entry owning `element`, so a candidate can be resolved back to a step value. */
	entryOf(element: HTMLElement | null): DomOrderedEntry<StepperTriggerMeta> | undefined {
		if (!element) return undefined;
		return this.items.ordered.find((entry) => entry.element === element);
	}

	#enabledEntries(): DomOrderedEntry<StepperTriggerMeta>[] {
		return this.items.ordered.filter((entry) => !entry.meta.getDisabled());
	}
}

const STEPPER_CONTEXT_KEY = Symbol("stepper");
const STEPPER_ITEM_CONTEXT_KEY = Symbol("stepper-item");
const STEPPER_FOCUS_CONTEXT_KEY = Symbol("stepper-focus");

export function setStepperContext(state: StepperRootState): StepperRootState {
	return setContext(STEPPER_CONTEXT_KEY, state);
}

/**
 * Read the root's state, throwing when there is no `<Stepper.Root>` ancestor.
 *
 * `consumerName` is the part as a consumer writes it (`'<Stepper.List>'`), so the message names both
 * the part and its provider — mirroring upstream's `useStepperContext(consumerName)` (202-208).
 */
export function getStepperContext(consumerName: string): StepperRootState {
	if (!hasContext(STEPPER_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Stepper.Root>\`.`);
	}
	return getContext<StepperRootState>(STEPPER_CONTEXT_KEY);
}

export function setStepperItemContext(state: StepperItemState): StepperItemState {
	return setContext(STEPPER_ITEM_CONTEXT_KEY, state);
}

/** Read the enclosing item's state. Upstream `useStepperItemContext` (596-602). */
export function getStepperItemContext(consumerName: string): StepperItemState {
	if (!hasContext(STEPPER_ITEM_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Stepper.Item>\`.`);
	}
	return getContext<StepperItemState>(STEPPER_ITEM_CONTEXT_KEY);
}

export function setStepperFocusContext(state: StepperFocusState): StepperFocusState {
	return setContext(STEPPER_FOCUS_CONTEXT_KEY, state);
}

/**
 * Read the enclosing list's roving-focus group. Upstream `useFocusContext` (392-400) names its
 * internal `FocusProvider`; the message here names the Svelte ancestor a consumer can actually write.
 */
export function getStepperFocusContext(consumerName: string): StepperFocusState {
	if (!hasContext(STEPPER_FOCUS_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Stepper.List>\`.`);
	}
	return getContext<StepperFocusState>(STEPPER_FOCUS_CONTEXT_KEY);
}
