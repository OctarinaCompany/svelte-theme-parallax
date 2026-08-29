<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type CodeBlockLineProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
	> & {
		/** The raw line, highlighted against the block's active language. */
		line: string;
		/** What the gutter shows. One-based, as a reader counts. */
		lineNumber: number;
		/**
		 * Which row of the block's own `lines` this is, ZERO-based — what lets the row be matched to
		 * an installed highlighter's output for the same line. `CodeBlock.Content` passes it; a line
		 * composed by hand without one is painted by the house tokenizer, whatever is installed,
		 * because there is no row to line it up with.
		 */
		index?: number;
	};
</script>

<script lang="ts">
	import { codeBlockTokenVariants, getCodeBlockContext } from "./code-block.svelte.js";

	/**
	 * One row: the gutter cell, and the line's classified runs.
	 *
	 * A `table-row` inside the content's `table`, which is upstream's layout
	 * and the reason the gutter is exactly as wide as its widest number without being measured.
	 *
	 * A `<span>`, NOT upstream's `<div>`. `<pre>` and `<code>` take phrasing
	 * content, and a `<div>` inside them is invalid HTML — the parser tolerates it, the validator
	 * does not, and `display: table-row` does not care which element carries it.
	 *
	 * THE GUTTER IS `aria-hidden`. Line numbers are an aid to pointing at code, not part of it; a
	 * screen reader reading "one const two import" over a snippet is reading noise. `select-none`
	 * is upstream's and does the same job for the clipboard — dragging across the block copies the
	 * code without the numbers.
	 *
	 * An empty line renders a single space, upstream's `line || " "` (`:214`), so the row keeps its
	 * height instead of collapsing. That substitution is also why an empty line stays house-painted
	 * under a highlighter: the row it produced spells the empty line, and a row that does not
	 * concatenate to what is rendered is not used.
	 *
	 * THE MARKUP IS DELIBERATELY UNBROKEN. Every one of these elements sits inside the content's
	 * `<pre>`, where whitespace is content: a newline between the gutter cell and the code cell
	 * becomes a blank anonymous cell, and a newline between two token spans becomes a space in the
	 * middle of the code. `prettier-ignore` holds the shape, because a formatter has no way to know
	 * that.
	 */
	let {
		ref = $bindable(null),
		class: className,
		line,
		lineNumber,
		index,
		...restProps
	}: CodeBlockLineProps = $props();

	const block = getCodeBlockContext("`<CodeBlock.Line>`");

	const tokens = $derived(block.tokenize(line || " ", index));
</script>

<!-- prettier-ignore -->
<span
	bind:this={ref}
	data-slot="code-block-line"
	class={cn("table-row", className)}
	{...restProps}
>{#if block.showLineNumbers}<span data-slot="code-block-line-number" aria-hidden="true" class="table-cell w-10 pr-5 text-right text-muted-foreground select-none">{lineNumber}</span>{/if}<span data-slot="code-block-line-code" class="table-cell min-w-0 whitespace-pre">{#each tokens as token, index (index)}<span data-kind={token.kind} class={codeBlockTokenVariants({ kind: token.kind })}>{token.text}</span>{/each}</span></span>
