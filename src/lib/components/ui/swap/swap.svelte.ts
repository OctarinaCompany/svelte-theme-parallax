import { getContext, hasContext, setContext } from "svelte";

/** Every value {@link SwapActivationMode} accepts, in upstream declaration order. */
export const SWAP_ACTIVATION_MODES = ["click", "hover"] as const;

/** How the swap is activated. */
export type SwapActivationMode = (typeof SWAP_ACTIVATION_MODES)[number];

/** Every value {@link SwapAnimation} accepts, in upstream declaration order. */
export const SWAP_ANIMATIONS = ["fade", "rotate", "flip", "scale"] as const;

/** The animation style applied to the two faces when the state changes. */
export type SwapAnimation = (typeof SWAP_ANIMATIONS)[number];

/** `'on' | 'off'` — upstream's `getDataState` return type. */
export type SwapDataState = "on" | "off";

/**
 * Normalise a possibly untyped runtime value to a known activation mode.
 * Anything outside {@link SWAP_ACTIVATION_MODES} falls back to `"click"`.
 */
export function resolveSwapActivationMode(value?: string): SwapActivationMode {
	return SWAP_ACTIVATION_MODES.includes(value as SwapActivationMode)
		? (value as SwapActivationMode)
		: "click";
}

/**
 * Normalise a possibly untyped runtime value to a known animation.
 * Anything outside {@link SWAP_ANIMATIONS} falls back to `"fade"`.
 */
export function resolveSwapAnimation(value?: string): SwapAnimation {
	return SWAP_ANIMATIONS.includes(value as SwapAnimation) ? (value as SwapAnimation) : "fade";
}

/** `swapped ? 'on' : 'off'` — mirrors upstream's `getDataState`. */
export function getSwapDataState(swapped: boolean): SwapDataState {
	return swapped ? "on" : "off";
}

/** The merged attribute payload handed to `<SwapOn>`/`<SwapOff>`'s `child` snippet. */
export type SwapFaceChildProps = {
	"data-slot": "swap-on" | "swap-off";
	"data-state": SwapDataState;
	class: string;
} & Record<string, unknown>;

type SwapStateProps = {
	readonly getSwapped: () => boolean;
	readonly setSwapped: (swapped: boolean) => void;
	readonly getActivationMode: () => SwapActivationMode;
	readonly getAnimation: () => SwapAnimation;
	readonly getDisabled: () => boolean;
	readonly getReducedMotion: () => boolean;
};

/** One instance per `<Swap>` root. Published on context; `<SwapOn>`/`<SwapOff>` read it. */
export class SwapState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: SwapStateProps;

	readonly swapped: boolean = $derived(this.#props.getSwapped());
	readonly activationMode: SwapActivationMode = $derived(this.#props.getActivationMode());
	readonly animation: SwapAnimation = $derived(this.#props.getAnimation());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly reducedMotion: boolean = $derived(this.#props.getReducedMotion());
	readonly isClickMode: boolean = $derived(this.activationMode === "click");
	readonly dataState: SwapDataState = $derived(getSwapDataState(this.swapped));

	constructor(props: SwapStateProps) {
		this.#props = props;
	}

	/** `setSwapped(!swapped)`, ignored while `disabled`. */
	toggle(): void {
		if (this.#props.getDisabled()) return;
		this.setSwapped(!this.#props.getSwapped());
	}

	/** Idempotent: `Object.is(current, next)` short-circuits before the assignment and the callback. */
	setSwapped(next: boolean): void {
		if (Object.is(this.#props.getSwapped(), next)) return;
		this.#props.setSwapped(next);
	}
}

const SWAP_CONTEXT_KEY = Symbol("swap");

export function setSwapContext(state: SwapState): SwapState {
	return setContext(SWAP_CONTEXT_KEY, state);
}

export function hasSwapContext(): boolean {
	return hasContext(SWAP_CONTEXT_KEY);
}

export function getSwapContext(part?: string): SwapState {
	if (!hasSwapContext()) {
		throw new Error(`${part ?? "`<Swap>` part"} must be used within \`<Swap>\`.`);
	}
	return getContext<SwapState>(SWAP_CONTEXT_KEY);
}

/** Upstream-parity name for `useStore as useSwap`. Delegates to {@link getSwapContext}. */
export function useSwap(): SwapState {
	return getSwapContext();
}
