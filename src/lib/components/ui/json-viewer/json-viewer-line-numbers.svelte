<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type JsonViewerLineNumbersProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	>;
</script>

<script lang="ts">
	import { getJsonViewerContext } from "./json-viewer.svelte.js";

	/**
	 * The gutter. Upstream's `LineNumbers`, reading the count from the
	 * shared state instead of taking it as a prop.
	 *
	 * `hidden sm:flex` is upstream's own `hidden sm:block` wrapper (`:513`) folded into the part:
	 * below `sm` the gutter costs a quarter of the width and tells the reader nothing.
	 *
	 * Each row is `h-6 leading-6`, which is what makes the numbers line up — the tree's rows are the
	 * same height. A value long enough to wrap breaks the alignment below it; see
	 * `countRenderedLines` for why no gutter built this way can help that.
	 */
	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: JsonViewerLineNumbersProps = $props();

	const viewer = getJsonViewerContext("`<JsonViewer.LineNumbers>`");

	const lines = $derived(Array.from({ length: viewer.lineCount }, (_, index) => index + 1));
</script>

<div
	bind:this={ref}
	data-slot="json-viewer-line-numbers"
	aria-hidden="true"
	class={cn(
		"mr-4 hidden shrink-0 flex-col border-r border-foreground/10 pr-4 text-right text-muted-foreground/60 select-none sm:flex",
		className,
	)}
	{...restProps}
>
	{#each lines as line (line)}
		<div class="h-6 text-xs leading-6 tabular-nums">{line}</div>
	{/each}
</div>
