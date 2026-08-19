<script lang="ts" module>
	export type JsonViewerNodeProps = {
		/** The value this node renders. */
		data: unknown;
		/** This node's path from the root — the key its expansion state is stored under. */
		path: string;
		/** Depth from the root, which is what cycles the coloured indent guides. @default 0 */
		level?: number;
		/** The property name this node hangs off. Objects and arrays render it; leaves never do. */
		objectKey?: string;
		/** Render a trailing comma — true for every sibling but the last. @default false */
		showComma?: boolean;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import JsonViewerBranch from "./json-viewer-branch.svelte";
	import JsonViewerKey from "./json-viewer-key.svelte";
	import JsonViewerNode from "./json-viewer-node.svelte";
	import JsonViewerValue from "./json-viewer-value.svelte";
	import {
		getJsonDataType,
		getJsonViewerContext,
		isJsonBranch,
		jsonChildPath,
		jsonIndexPath,
	} from "./json-viewer.svelte.js";

	/**
	 * One node of the tree, and the recursion itself. Upstream's `JsonNode`
	 * plus the two iteration bodies of `JsonObject` and `JsonArray`.
	 *
	 * RECURSION IS A SELF-IMPORT, not a recursive snippet. Svelte 5 supports both — `<svelte:self>`
	 * was retired in favour of importing a component into itself
	 * (`https://svelte.dev/docs/svelte/svelte-self`). The self-import is the one that keeps this a
	 * component: it carries its own props type, appears in the barrel, and each level gets its own
	 * instance and its own local state, which is what `json-viewer-value.svelte`'s per-value
	 * "Show more" needs. A recursive snippet would have to live inside whichever file declared it
	 * and pass every parameter positionally at each level.
	 *
	 * A LEAF RENDERS TWO SIBLINGS — the value and, when it is not last, a comma. Every container
	 * that renders a node is therefore a FLEX container, so the whitespace the formatter leaves
	 * between those siblings collapses away instead of separating `'x'` from its comma.
	 */
	let { data, path, level = 0, objectKey, showComma = false }: JsonViewerNodeProps = $props();

	const viewer = getJsonViewerContext("`<JsonViewer.Node>`");

	const type = $derived(getJsonDataType(data));

	const entries = $derived(
		type === "object" ? Object.entries(data as Record<string, unknown>) : [],
	);
	const items = $derived(type === "array" ? (data as unknown[]) : []);

	const truncates = $derived(
		type === "array" && viewer.truncation.enabled && items.length > viewer.truncation.itemsPerArray,
	);
	const fullyShown = $derived(viewer.isFullyShown(path));
	const visibleItems = $derived(
		truncates && !fullyShown ? items.slice(0, viewer.truncation.itemsPerArray) : items,
	);
	const hiddenCount = $derived(items.length - viewer.truncation.itemsPerArray);

	/**
	 * The row wrapper around a child. A leaf row is flex (see the header note); a child branch
	 * brings its own block. The hover wash is dropped once a child branch is open, matching
	 * upstream (`:755`) — a wash that covered a whole open subtree would swallow the rows in it.
	 */
	function rowClass(childPath: string, childIsBranch: boolean, centred: boolean): string {
		return cn(
			"rounded-md",
			!childIsBranch &&
				(centred ? "flex min-h-6 items-start sm:h-6 sm:items-center" : "flex min-h-6 items-start"),
			!(childIsBranch && viewer.isExpanded(childPath)) && "hover:bg-muted-foreground/20",
		);
	}
</script>

{#if isJsonBranch(type)}
	<JsonViewerBranch
		{path}
		{level}
		{objectKey}
		{showComma}
		kind={type === "array" ? "array" : "object"}
		count={type === "array" ? items.length : entries.length}
	>
		{#if type === "object"}
			{#each entries as [key, value], index (key)}
				{@const childPath = jsonChildPath(path, key)}
				{@const childIsBranch = isJsonBranch(getJsonDataType(value))}
				<div class={rowClass(childPath, childIsBranch, false)}>
					{#if childIsBranch}
						<JsonViewerNode
							data={value}
							path={childPath}
							level={level + 1}
							objectKey={key}
							showComma={index < entries.length - 1}
						/>
					{:else}
						<JsonViewerKey name={key} />
						<JsonViewerNode
							data={value}
							path={childPath}
							level={level + 1}
							showComma={index < entries.length - 1}
						/>
					{/if}
				</div>
			{/each}
		{:else}
			<!--
				Keyed by index on purpose: array items have no identity of their own, and the index IS
				the path the expansion state is stored under.
			-->
			{#each visibleItems as item, index (index)}
				{@const childPath = jsonIndexPath(path, index)}
				{@const childIsBranch = isJsonBranch(getJsonDataType(item))}
				<div class={rowClass(childPath, childIsBranch, true)}>
					<JsonViewerNode
						data={item}
						path={childPath}
						level={level + 1}
						showComma={index < items.length - 1}
					/>
				</div>
			{/each}
			{#if truncates}
				<div class="pl-5">
					<!--
						Upstream can only ever expand a truncated array (`:934-956`): its "Show Less"
						branch is unreachable, because `itemsToShow` stops truncating the moment
						`showAll` flips, and the button that would put it back is inside the block that
						the same flag hides. The control toggles here, and the flag lives on the shared
						state so the line-number gutter can count what it produced.
					-->
					<!--
						`outline`, not upstream's `secondary`: this kit's `--secondary` and the viewer's
						own `bg-muted/50` ground are the same grey, so a secondary button here is text
						with padding. The border is what says it is a control.
					-->
					<Button
						variant="outline"
						size="xs"
						class="mt-1 font-sans font-normal text-muted-foreground hover:text-foreground"
						onclick={() => viewer.setFullyShown(path, !fullyShown)}
					>
						{fullyShown
							? "Show less"
							: `Show ${hiddenCount} more ${hiddenCount === 1 ? "item" : "items"}...`}
					</Button>
				</div>
			{/if}
		{/if}
	</JsonViewerBranch>
{:else}
	<JsonViewerValue value={data} {type} />
	{#if showComma}
		<span class="text-muted-foreground">,</span>
	{/if}
{/if}
