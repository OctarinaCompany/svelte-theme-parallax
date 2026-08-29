<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type CodeBlockHeaderProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	>;
</script>

<script lang="ts">
	import TerminalIcon from "@lucide/svelte/icons/terminal";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import CodeBlockCopyButton from "./code-block-copy-button.svelte";
	import CodeBlockDownloadButton from "./code-block-download-button.svelte";
	import CodeBlockLanguageSelect from "./code-block-language-select.svelte";
	import { getCodeBlockContext } from "./code-block.svelte.js";

	/**
	 * The caption row: the label, the language affordance, the download button when there is a
	 * name to save under, and the copy button.
	 *
	 * The language is a SELECTOR when there is more than one snippet and the caller allows it, and
	 * a static tag otherwise — one control that can only ever show one
	 * value is a control that lies about being one.
	 *
	 * THE DOWNLOAD BUTTON IS CONDITIONAL HERE, NOT IN THE BUTTON. `block.filename` is `undefined`
	 * until the root is given a `filename`, and that is the whole test: the header is the part that
	 * decides what the row contains, so it owns both `{#if}`s. The button itself always renders
	 * (see `code-block-download-button.svelte`), which is what lets a hand-built header show it
	 * unconditionally. It sits BEFORE the copy button so the copy button — the one every block has
	 * — keeps the same position whether or not a download is offered.
	 *
	 * `border-b` and nothing else. Upstream tints this row `bg-muted/30` over a card-coloured block;
	 * the whole block is already muted here (see the root), so a second tint would only muddy it.
	 */
	let { ref = $bindable(null), class: className, ...restProps }: CodeBlockHeaderProps = $props();

	const block = getCodeBlockContext("`<CodeBlock.Header>`");
</script>

<div
	bind:this={ref}
	data-slot="code-block-header"
	class={cn(
		"flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2",
		className,
	)}
	{...restProps}
>
	<div class="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
		<TerminalIcon class="size-3.5 shrink-0" />
		<span class="truncate">{block.label}</span>
	</div>
	<div class="flex items-center gap-2">
		{#if block.selectable}
			<CodeBlockLanguageSelect />
		{:else}
			<Badge variant="outline">{block.activeLabel}</Badge>
		{/if}
		{#if block.filename}
			<CodeBlockDownloadButton />
		{/if}
		<CodeBlockCopyButton />
	</div>
</div>
