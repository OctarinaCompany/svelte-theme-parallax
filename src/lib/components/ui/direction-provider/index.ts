import Root from "./direction-provider.svelte";

export type { DirectionProviderProps } from "./direction-provider.svelte";

export {
	DIRECTIONS,
	DirectionProviderState,
	DirectionReader,
	getDirectionContext,
	hasDirectionContext,
	isDirection,
	resolveDomDirection,
	setDirectionContext,
	useDirection,
	type Direction,
	type UseDirectionOptions,
} from "./direction-provider.svelte.js";

export {
	Root,
	//
	Root as DirectionProvider,
};
