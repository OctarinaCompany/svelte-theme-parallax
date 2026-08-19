import Root from "./swap.svelte";
import On from "./swap-on.svelte";
import Off from "./swap-off.svelte";

export { type SwapRootProps, type SwapChildProps } from "./swap.svelte";
export { type SwapOnProps } from "./swap-on.svelte";
export { type SwapOffProps } from "./swap-off.svelte";
export {
	SWAP_ACTIVATION_MODES,
	SWAP_ANIMATIONS,
	SwapState,
	getSwapContext,
	getSwapDataState,
	hasSwapContext,
	resolveSwapActivationMode,
	resolveSwapAnimation,
	setSwapContext,
	useSwap,
	type SwapActivationMode,
	type SwapAnimation,
	type SwapDataState,
	type SwapFaceChildProps,
} from "./swap.svelte.js";

export {
	Root,
	On,
	Off,
	//
	Root as Swap,
	On as SwapOn,
	Off as SwapOff,
};
