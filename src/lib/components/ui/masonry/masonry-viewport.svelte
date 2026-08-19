<script lang="ts" module>
	import type { Snippet } from "svelte";

	/**
	 * Internal sizing container — upstream's `MasonryViewport` (`masonry.tsx` lines 1348–1522), minus
	 * the `React.Children` inspection that items now do for themselves.
	 *
	 * It is not exported from `index.ts`, matching upstream's export list, and takes no caller props:
	 * the root renders it with nothing but the two snippets.
	 */
	export type MasonryViewportProps = {
		/** Rendered instead of the whole positioned list until the root has mounted. */
		fallback?: Snippet;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getMasonryContext } from "./masonry.svelte.js";

	let { fallback, children }: MasonryViewportProps = $props();

	const state = getMasonryContext();

	const viewportStyle = $derived.by(() => {
		const height = Math.ceil(state.estimatedHeight);
		const base = `position:relative;width:100%;max-width:100%;height:${height}px;max-height:${height}px;`;
		return state.isScrolling ? `${base}will-change:contents;pointer-events:none;` : base;
	});
</script>

{#if !state.mounted && fallback}
	{@render fallback()}
{:else}
	<div
		data-slot="masonry-viewport"
		data-version={state.mounted ? state.layoutVersion : undefined}
		style={viewportStyle}
	>
		{@render children?.()}
	</div>
{/if}
