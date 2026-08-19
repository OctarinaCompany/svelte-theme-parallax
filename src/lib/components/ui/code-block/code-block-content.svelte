<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type CodeBlockContentProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLPreElement>, HTMLPreElement>
	>;
</script>

<script lang="ts">
	import CodeBlockLine from "./code-block-line.svelte";
	import { getCodeBlockContext } from "./code-block.svelte.js";

	/**
	 * The scroller: a `<pre><code>` laid out as a table, one row per line.
	 *
	 * `min-w-max` on the `<code>` is what makes the long line scroll instead of wrap — the table is
	 * as wide as its widest row and the `<pre>` scrolls over it. `flex-1 min-h-0` is this theme's,
	 * not upstream's: the root carries the height (`max-h-112`, upstream's 28rem) and the content
	 * takes whatever the header leaves, so one `class` on the root sizes the whole object.
	 *
	 * IT IS FOCUSABLE, which upstream is not. A region that scrolls and contains nothing focusable
	 * cannot be reached by a keyboard at all in Firefox and Safari — the reader can see that there
	 * is more code and has no way to get to it (WCAG 2.1.1; axe calls it
	 * `scrollable-region-focusable`). `tabindex={0}` is the whole fix, and it takes the kit's own
	 * focus ring so the stop is visible when it is reached.
	 *
	 * The markup between the tags is unbroken on purpose — see `code-block-line.svelte`, which
	 * explains what a newline costs inside a `<pre>`.
	 */
	let { ref = $bindable(null), class: className, ...restProps }: CodeBlockContentProps = $props();

	const block = getCodeBlockContext("`<CodeBlock.Content>`");
</script>

<!--
	The a11y rule fires because a `pre` is not interactive. It has to be focusable anyway: this is a
	region that scrolls, and it contains nothing focusable of its own, so without a tab stop a
	keyboard-only reader cannot reach the code below the fold at all in Firefox or Safari (WCAG
	2.1.1; axe `scrollable-region-focusable`). Same shape of exception as
	`data-grid-column-resizer.svelte:133`.
-->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- prettier-ignore -->
<pre
	bind:this={ref}
	data-slot="code-block-content"
	tabindex={0}
	class={cn(
		"min-h-0 min-w-0 flex-1 overflow-auto p-4 font-mono text-sm leading-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
		className,
	)}
	{...restProps}><code class="table min-w-max border-spacing-0">{#each block.lines as line, index (index)}<CodeBlockLine {line} lineNumber={index + 1} />{/each}</code></pre>
