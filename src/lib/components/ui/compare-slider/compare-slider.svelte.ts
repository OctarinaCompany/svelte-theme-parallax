import { getContext, hasContext, setContext } from "svelte";

/** `defaultValue` fallback — upstream `defaultValue = 50`. */
export const DEFAULT_COMPARE_SLIDER_VALUE = 50;

/** `step` fallback — upstream `step = 1`. */
export const DEFAULT_COMPARE_SLIDER_STEP = 1;

/** How far a Page key, or a shifted arrow, moves the divider. */
export const COMPARE_SLIDER_SKIP_MULTIPLIER = 10;

/** Keys that move by {@link COMPARE_SLIDER_SKIP_MULTIPLIER} steps. */
const PAGE_KEYS = ["PageUp", "PageDown"];

/** Keys that move by one step, or ten while shift is held. */
const ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

/**
 * `drag` requires a pointer press before the divider follows; `hover` follows the pointer
 * unpressed, and renders no grab affordance.
 */
export const COMPARE_SLIDER_INTERACTIONS = ["hover", "drag"] as const;
export type CompareSliderInteraction = (typeof COMPARE_SLIDER_INTERACTIONS)[number];

export const COMPARE_SLIDER_ORIENTATIONS = ["horizontal", "vertical"] as const;
export type CompareSliderOrientation = (typeof COMPARE_SLIDER_ORIENTATIONS)[number];

/** Which half of the comparison a label belongs to. */
export type CompareSliderSide = "before" | "after";

/** Hold a percentage inside the track. */
export function clampComparePercentage(value: number): number {
	return Math.min(Math.max(value, 0), 100);
}

/**
 * The divider position, and everything the parts read.
 *
 * WHY THIS IS NOT A PORT OF UPSTREAM'S STORE. `compare-slider.tsx:39-71` hand-rolls a subscribe /
 * getState / setState store behind `useSyncExternalStore`, so that dragging re-renders only the
 * parts that read `value` rather than the whole subtree. That machinery answers a React problem.
 * A `$state` field read from context is already fine-grained here: the four parts that read
 * `value` re-run their own `$derived`, and nothing else does. Porting the store would have been
 * fifty lines reproducing a scheduler Svelte does not need.
 *
 * `value` is held clamped, so no reader has to defend against a percentage outside the track.
 */
export class CompareSliderState {
	#value = $state(DEFAULT_COMPARE_SLIDER_VALUE);

	/** True between pointerdown and pointerup, for the grab cursor and any consumer that cares. */
	dragging = $state(false);

	/** Set by the root each render, so the parts follow a change of orientation. */
	orientation = $state<CompareSliderOrientation>("horizontal");

	/** Set by the root each render — the handle renders its chevrons only in `drag`. */
	interaction = $state<CompareSliderInteraction>("drag");

	/** Step size in percentage points, for keyboard moves. */
	step = $state(DEFAULT_COMPARE_SLIDER_STEP);

	/** Fired on every real change, never on a set that resolves to the current value. */
	onValueChange?: (value: number) => void;

	constructor(initial: number = DEFAULT_COMPARE_SLIDER_VALUE) {
		this.#value = clampComparePercentage(initial);
	}

	get value(): number {
		return this.#value;
	}

	/**
	 * Move the divider, clamped.
	 *
	 * The equality guard is what makes `onValueChange` obey the house rule that a callback fires
	 * only on a real change (`CONVENTIONS.md` §6) — without it a drag along the edge of the track
	 * would emit `100` on every pointer event.
	 */
	set value(next: number) {
		const clamped = clampComparePercentage(next);
		if (clamped === this.#value) return;
		this.#value = clamped;
		this.onValueChange?.(clamped);
	}

	/** Adopt a controlled value without re-notifying the owner that set it. */
	sync(next: number): void {
		this.#value = clampComparePercentage(next);
	}

	get isVertical(): boolean {
		return this.orientation === "vertical";
	}

	/** Percentage of the track a pointer sits at, from a client coordinate and the root's box. */
	percentageFromPointer(rect: DOMRect, clientX: number, clientY: number): number {
		const position = this.isVertical ? clientY - rect.top : clientX - rect.left;
		const size = this.isVertical ? rect.height : rect.width;
		if (size === 0) return this.#value;
		return clampComparePercentage((position / size) * 100);
	}

	/**
	 * Apply a keyboard move. Returns whether the key was one this slider handles, so the caller
	 * knows whether to call `preventDefault`.
	 *
	 * Direction follows the axis: on a vertical slider `ArrowUp` decreases, on a horizontal one
	 * `ArrowLeft` does. `PageUp` decreases on both, which is upstream's mapping
	 * and matches how a page key reads against a scrollbar.
	 */
	applyKey(key: string, shiftKey: boolean): boolean {
		if (key === "Home") {
			this.value = 0;
			return true;
		}
		if (key === "End") {
			this.value = 100;
			return true;
		}

		const isPageKey = PAGE_KEYS.includes(key);
		const isArrowKey = ARROW_KEYS.includes(key);
		if (!isPageKey && !isArrowKey) return false;

		const skip = isPageKey || shiftKey;
		const multiplier = skip ? COMPARE_SLIDER_SKIP_MULTIPLIER : 1;
		const decreaseKeys = this.isVertical ? ["ArrowUp", "PageUp"] : ["ArrowLeft", "PageUp"];
		const direction = decreaseKeys.includes(key) ? -1 : 1;

		this.value = this.value + this.step * multiplier * direction;
		return true;
	}
}

const COMPARE_SLIDER_CONTEXT_KEY = Symbol("compare-slider");

export function setCompareSliderContext(state: CompareSliderState): CompareSliderState {
	return setContext(COMPARE_SLIDER_CONTEXT_KEY, state);
}

export function hasCompareSliderContext(): boolean {
	return hasContext(COMPARE_SLIDER_CONTEXT_KEY);
}

export function getCompareSliderContext(part?: string): CompareSliderState {
	if (!hasCompareSliderContext()) {
		throw new Error(`${part ?? "This part"} must be used within <CompareSlider>.`);
	}
	return getContext<CompareSliderState>(COMPARE_SLIDER_CONTEXT_KEY);
}

/**
 * The clip that hides the half of an image the divider has passed.
 *
 * `inset()` rather than a width: both halves stay full-size and full-position, so the two pictures
 * stay registered with each other. Animating a width instead would squash one of them, which is
 * the classic wrong way to build this control.
 */
export function compareSliderClipPath(
	side: CompareSliderSide,
	value: number,
	orientation: CompareSliderOrientation,
): string {
	const vertical = orientation === "vertical";
	if (side === "before") {
		return vertical ? `inset(0 0 ${100 - value}% 0)` : `inset(0 ${100 - value}% 0 0)`;
	}
	return vertical ? `inset(${value}% 0 0 0)` : `inset(0 0 0 ${value}%)`;
}
