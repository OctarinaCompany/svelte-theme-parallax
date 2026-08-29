<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ToolInputProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> & {
		/**
		 * What the model passed to the tool. A string renders as text in a code block; anything
		 * else — an object, an array, a bare number or boolean, `null` — renders as a JSON tree.
		 * `undefined` renders nothing at all, which is what a part in `input-streaming` carries
		 * before its first token.
		 */
		input: unknown;
		/**
		 * The micro-label above the value. Also the code block's accessible name when the input is
		 * a string.
		 * @default "Parameters"
		 */
		label?: string;
	};
</script>

<script lang="ts">
	import * as CodeBlock from "$lib/components/ui/code-block/index.js";
	import * as JsonViewer from "$lib/components/ui/json-viewer/index.js";

	/**
	 * What went into the call.
	 *
	 * Upstream serialises the value with `JSON.stringify(input, null, 2)` into a JSON code block
	 * (`tool.tsx:125`). A live value is data, and this kit has the object for data: `ui/json-viewer`
	 * folds a large argument, copies it as JSON and colours it by type. A string stays a string —
	 * serialising it would wrap it in quotes and escape its newlines, which is not what a reader
	 * of a prompt argument wants to see — so it goes through `ui/code-block` as plain text with
	 * the gutter off.
	 *
	 * The tree re-seeds on every new `input` (the `{#key}`), which matters for the streaming
	 * state: the viewer reads `defaultExpanded` once, and a branch that arrived after the first
	 * render would otherwise land collapsed under an expanded parent. The cost — a reader's own
	 * folding is lost when the value changes — is the right one for a value that changes only
	 * while it is still being written.
	 */
	let {
		ref = $bindable(null),
		class: className,
		input,
		label = "Parameters",
		...restProps
	}: ToolInputProps = $props();
</script>

{#if input !== undefined}
	<div
		bind:this={ref}
		data-slot="tool-input"
		class={cn("flex flex-col gap-2 overflow-hidden", className)}
		{...restProps}
	>
		<h4 class="text-xs font-medium tracking-label text-muted-foreground uppercase">{label}</h4>
		{#if typeof input === "string"}
			<CodeBlock.Root code={input} language="text" showLineNumbers={false} {label} />
		{:else}
			{#key input}
				<JsonViewer.Root data={input} showLineNumbers={false} defaultExpanded={true} />
			{/key}
		{/if}
	</div>
{/if}
