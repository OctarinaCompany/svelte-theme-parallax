<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type JsonViewerBranchProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	> & {
		/** The path this branch is stored under in the expansion set. */
		path: string;
		/** Depth from the root, which is what cycles the coloured indent guides. @default 0 */
		level?: number;
		/** `object` renders braces, `array` renders brackets. */
		kind: "object" | "array";
		/** How many entries or items the collapsed summary reports. */
		count: number;
		/** The property name this branch hangs off, rendered in front of the opening glyph. */
		objectKey?: string;
		/** Render a trailing comma — true for every sibling but the last. @default false */
		showComma?: boolean;
		/** The rows, rendered only while the branch is open. */
		children: Snippet;
	};
</script>

<script lang="ts">
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import JsonViewerKey from "./json-viewer-key.svelte";
	import {
		getJsonViewerContext,
		jsonViewerIndentTone,
		jsonViewerIndentVariants,
	} from "./json-viewer.svelte.js";

	/**
	 * The collapsible shell an object and an array share: the trigger row, the indent guide down
	 * the open body, and the closing glyph.
	 *
	 * ONE PART WHERE UPSTREAM HAS TWO. `JsonObject` and `JsonArray`
	 * (`:803-965`) are the same 90 lines twice over, differing only in the glyph pair, the summary
	 * wording and what they iterate. Iteration stays in `json-viewer-node.svelte`, where the
	 * difference actually is; everything else is here, once.
	 *
	 * NO `Collapsible`. Upstream wraps each node in one, but puts its trigger OUTSIDE
	 * `CollapsibleContent` as a plain sibling — so the primitive contributes nothing but a mounted
	 * hidden subtree per node. `{#if}` gives the same result and, on a tree of any size, unmounts
	 * the closed body instead of keeping it in the DOM.
	 *
	 * THE TRIGGER IS A REAL `<button>`. Upstream's is a `<div>` with an `onClick`, wrapped around a
	 * second `<button>` for the chevron — a nested button, which is invalid HTML and reaches the
	 * keyboard through neither. One button carrying `aria-expanded` costs nothing and is operable.
	 */
	let {
		ref = $bindable(null),
		class: className,
		path,
		level = 0,
		kind,
		count,
		objectKey,
		showComma = false,
		children,
		...restProps
	}: JsonViewerBranchProps = $props();

	const viewer = getJsonViewerContext("`<JsonViewer.Branch>`");

	const open = $derived(viewer.isExpanded(path));
	const openGlyph = $derived(kind === "object" ? "{" : "[");
	const closeGlyph = $derived(kind === "object" ? "}" : "]");

	/** `..} (3 items)` — one expression, so the spacing cannot depend on how the file is formatted. */
	const summary = $derived(`..${closeGlyph} (${count} ${count === 1 ? "item" : "items"})`);

	function onclick(event: MouseEvent) {
		// `detail === 0` is the signature of a click the browser synthesised from Enter or Space.
		// Keyboard activation has to keep working in `doubleClick` mode, where there is no gesture
		// for a keyboard to make, so those clicks toggle in both modes.
		if (viewer.collapseMode === "click" || event.detail === 0) viewer.toggle(path);
	}

	function ondblclick() {
		if (viewer.collapseMode === "doubleClick") viewer.toggle(path);
	}
</script>

<div
	bind:this={ref}
	data-slot="json-viewer-branch"
	data-kind={kind}
	data-state={open ? "open" : "closed"}
	class={className}
	{...restProps}
>
	<button
		type="button"
		aria-expanded={open}
		class={cn(
			"group/json-viewer-branch -ml-1 inline-flex h-6 w-full cursor-pointer items-center rounded-sm px-1 text-left leading-6 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50",
			"**:data-[slot=json-viewer-chevron]:size-4",
			// Upstream only lights the trigger up while the branch is open (`:682`): when it is
			// closed, the row around it already carries the hover.
			open && "hover:bg-muted-foreground/20",
		)}
		{onclick}
		{ondblclick}
	>
		{#if objectKey !== undefined}
			<JsonViewerKey name={objectKey} />
		{/if}
		<ChevronRightIcon
			data-slot="json-viewer-chevron"
			class={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
		/>
		<span class="text-muted-foreground">{openGlyph}</span>
		{#if !open}
			<span class="text-muted-foreground">{summary}</span>
			{#if showComma}
				<span class="text-muted-foreground">,</span>
			{/if}
		{/if}
	</button>

	{#if open}
		<div
			class={jsonViewerIndentVariants({
				tone: jsonViewerIndentTone(level, viewer.showColorIndent),
			})}
		>
			{@render children()}
		</div>
		<div class="flex items-center">
			<span class="text-muted-foreground">{closeGlyph}</span>
			{#if showComma}
				<span class="text-muted-foreground">,</span>
			{/if}
		</div>
	{/if}
</div>
