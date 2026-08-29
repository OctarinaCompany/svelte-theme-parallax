<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type ToolOutputProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * What the tool returned. A string renders as text in a code block; anything else renders
		 * as a JSON tree, fully expanded like `Tool.Input`, under the same height cap. `undefined`
		 * renders nothing — unless `errorText` or `children` is set.
		 */
		output?: unknown;
		/**
		 * Why the call failed. Rendered as a destructive block ABOVE the output, so a tool that
		 * failed after producing a partial result shows both. Also flips the default `label`.
		 */
		errorText?: string;
		/**
		 * The micro-label above the value.
		 * @default "Result", or "Error" when `errorText` is set
		 */
		label?: string;
		/**
		 * Replaces the built-in rendering of `output` and `errorText` — for a tool whose result
		 * deserves its own component, a map or a table. The label stays. Supplying it forces the
		 * part to render even when both `output` and `errorText` are absent, which is how a caller
		 * renders something for a denied call.
		 */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import * as CodeBlock from "$lib/components/ui/code-block/index.js";
	import * as JsonViewer from "$lib/components/ui/json-viewer/index.js";

	/**
	 * What came out of the call.
	 *
	 * Upstream renders nothing without an output or an error, then serialises an object into a JSON
	 * code block and hands a string to the same block as `language="json"` (`tool.tsx:141-153`).
	 * Here a live value takes `ui/json-viewer` and a string takes `ui/code-block` as plain text, the
	 * same split as `tool-input.svelte`, for the same reasons — and the tree opens fully, the way
	 * the input's does, so the two halves of one card behave alike; the height cap below is what
	 * keeps a large result in check, not a fold the reader would have to undo branch by branch.
	 * The `{#key}` re-seeds the tree on a new `output` for the reason `tool-input.svelte` gives:
	 * the viewer reads `defaultExpanded` once, and a result that is replaced — a partial one by
	 * the final one — would otherwise keep the old tree's folding for branches it did not have.
	 *
	 * THE HEIGHT CAP IS ON THE RENDERERS, NOT ON A WRAPPER. A single `max-h-80 overflow-auto` box
	 * around the code block would put one scroller inside another — the block already scrolls its
	 * own `<pre>` — and a wrapper that scrolls is a region a keyboard cannot reach unless it is
	 * focusable, which the block's content already is. So each renderer takes the cap through its
	 * `class` and scrolls itself, and the error block, which contains nothing focusable, takes the
	 * cap together with a tab stop of its own (WCAG 2.1.1; the same shape as
	 * `code-block-content.svelte`).
	 *
	 * The error block is `bg-destructive-subtle` under `text-destructive-subtle-foreground` — the
	 * soft status pair of `docs/CONVENTIONS.md` §3 — where upstream paints `bg-destructive/10` with
	 * the raw `text-destructive`, an ink that measures below 4.5:1 on that tint in most palettes.
	 */
	let {
		ref = $bindable(null),
		class: className,
		output,
		errorText,
		label,
		children,
		...restProps
	}: ToolOutputProps = $props();

	const resolvedLabel = $derived(label ?? (errorText ? "Error" : "Result"));
	const rendered = $derived(children !== undefined || output !== undefined || !!errorText);
</script>

{#if rendered}
	<div
		bind:this={ref}
		data-slot="tool-output"
		data-error={errorText ? "" : undefined}
		class={cn("flex flex-col gap-2", className)}
		{...restProps}
	>
		<h4 class="text-xs font-medium tracking-label text-muted-foreground uppercase">
			{resolvedLabel}
		</h4>
		{#if children}
			{@render children()}
		{:else}
			{#if errorText}
				<!--
					The a11y rule fires because a `div` is not interactive. It has to be focusable anyway:
					this is a region that scrolls once the message outgrows `max-h-80`, and it contains
					nothing focusable of its own, so without a tab stop a keyboard-only reader cannot reach
					the rest of the message in Firefox or Safari (WCAG 2.1.1; axe
					`scrollable-region-focusable`). Same shape of exception as `code-block-content.svelte`.
				-->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					tabindex={0}
					class="max-h-80 overflow-auto rounded-md bg-destructive-subtle p-3 text-sm whitespace-pre-wrap text-destructive-subtle-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
				>
					{errorText}
				</div>
			{/if}
			{#if output !== undefined}
				{#if typeof output === "string"}
					<CodeBlock.Root
						code={output}
						language="text"
						showLineNumbers={false}
						label={resolvedLabel}
						class="max-h-80"
					/>
				{:else}
					{#key output}
						<JsonViewer.Root
							data={output}
							showLineNumbers={false}
							defaultExpanded={true}
							class="max-h-80"
						/>
					{/key}
				{/if}
			{/if}
		{/if}
	</div>
{/if}
