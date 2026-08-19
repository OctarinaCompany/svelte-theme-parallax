import Root from "./fps.svelte";

export { type FpsProps } from "./fps.svelte";
export {
	DEFAULT_FPS_DESTRUCTIVE_THRESHOLD,
	DEFAULT_FPS_UPDATE_INTERVAL,
	DEFAULT_FPS_WARNING_THRESHOLD,
	FPS_POSITIONS,
	FPS_STRATEGIES,
	FpsState,
	fpsVariants,
	resolveFpsStatus,
	type FpsPosition,
	type FpsStatus,
	type FpsStrategy,
	type FpsVariants,
} from "./fps.svelte.js";

export {
	Root,
	//
	Root as Fps,
};
