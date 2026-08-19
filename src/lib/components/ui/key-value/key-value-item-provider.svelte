<script lang="ts" module>
	import type { Snippet } from "svelte";

	/**
	 * Internal. Shipped with the component but deliberately not exported from the barrel: it exists
	 * only because Svelte context can be set during a component's initialisation, so the per-row
	 * provider cannot be `<KeyValue.Item>` — that part lives *inside* the row template and has no way
	 * to know which row it belongs to.
	 */
	export type KeyValueItemProviderProps = {
		/** The row this provider publishes. Stable, so the instance survives list mutations. */
		itemId: string;
		/** `<KeyValue.List>`'s row template, written once and rendered once per row. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";

	import {
		getKeyValueContext,
		KeyValueItemState,
		setKeyValueItemContext,
	} from "./key-value.svelte.js";

	let { itemId, children }: KeyValueItemProviderProps = $props();

	const root = getKeyValueContext("<KeyValue.List>");

	// One-shot: the `{#each}` above is keyed by this id, so an instance is bound to one row for its
	// whole life. `untrack` says so rather than looking like a reactive read.
	setKeyValueItemContext(new KeyValueItemState({ root, id: untrack(() => itemId) }));
</script>

{@render children?.()}
