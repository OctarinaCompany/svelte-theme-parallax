import Root from "./pending.svelte";

export type { PendingChildProps, PendingRootProps } from "./pending.svelte";
export {
	createPendingId,
	PendingState,
	usePending,
	type PendingAttributes,
	type UsePendingOptions,
	type UsePendingReturn,
} from "./pending.svelte.js";

export {
	Root,
	//
	Root as Pending,
};
