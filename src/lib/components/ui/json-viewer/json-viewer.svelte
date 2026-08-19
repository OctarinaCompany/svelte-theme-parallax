<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { JsonViewerCollapseMode, JsonViewerTruncation } from "./json-viewer.svelte.js";

	export type JsonViewerRootProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	> & {
		/**
		 * The value to render. Upstream types this `Record<string, any>`; it is widened to `unknown`
		 * here because every branch of the renderer already handles an array or a bare scalar, and a
		 * response body that is a top-level array is the common case that type forbids.
		 */
		data: unknown;
		/**
		 * How long arrays are cut down. Merged over the defaults — `{ enabled: true, itemsPerArray: 5 }`
		 * — so `{ itemsPerArray: 3 }` alone is enough.
		 */
		truncation?: Partial<JsonViewerTruncation>;
		/**
		 * Show the line-number gutter. Hidden below the `sm` breakpoint whatever this says.
		 * @default true
		 */
		showLineNumbers?: boolean;
		/**
		 * Cycle the indent guides through five hues by depth instead of drawing them all in the
		 * page ink.
		 * @default false
		 */
		showColorIndent?: boolean;
		/**
		 * Which pointer gesture on a branch trigger toggles it. Enter and Space toggle in both modes.
		 * @default "click"
		 */
		collapseOn?: JsonViewerCollapseMode;
		/**
		 * What is open on first render: `false` opens the root alone, `true` opens everything, and a
		 * number opens every branch down to that depth. A SEED, read once — changing it later leaves
		 * the reader's own expansions alone. Wrap the viewer in `{#key}` to re-seed it.
		 * @default false
		 */
		defaultExpanded?: boolean | number;
		/**
		 * The caption in the toolbar. Note that this claims the `title` attribute: the root renders no
		 * browser tooltip of its own.
		 */
		title?: string;
	};

	/** Alias of {@link JsonViewerRootProps}, present for parity with the upstream type name. */
	export type JsonViewerProps = JsonViewerRootProps;
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import JsonViewerLineNumbers from "./json-viewer-line-numbers.svelte";
	import JsonViewerNode from "./json-viewer-node.svelte";
	import JsonViewerToolbar from "./json-viewer-toolbar.svelte";
	import {
		collectExpandablePaths,
		JSON_VIEWER_ROOT_PATH,
		JsonViewerState,
		resolveJsonViewerCollapseMode,
		setJsonViewerContext,
	} from "./json-viewer.svelte.js";

	/**
	 * A collapsible JSON tree with per-type colouring, expand/collapse, copy and array truncation.
	 *
	 * WHERE THE COLOURS WENT. Upstream paints every type with a raw Tailwind palette colour, which
	 * would survive one of this kit's twelve palettes. The mapping — and the reason each type takes
	 * the WALKED `--{state}-subtle-foreground` ink rather than the raw status token — is written out
	 * over `jsonViewerValueVariants` in `json-viewer.svelte.ts`.
	 *
	 * THE GROUND is `bg-muted/50` in both modes. Upstream's light-mode ground is `bg-secondary/10`,
	 * which in this palette is `#eef3fa` at a tenth — a code block that is
	 * indistinguishable from the card it sits on.
	 *
	 * SIZE. Upstream sets `text-[13px]`; this uses `text-sm`, the nearest step on the scale. The
	 * `leading-6` is upstream's and is load-bearing: `json-viewer-line-numbers.svelte` assumes a
	 * 24px row.
	 */
	let {
		ref = $bindable(null),
		class: className,
		data,
		truncation,
		showLineNumbers = true,
		showColorIndent = false,
		collapseOn = "click",
		defaultExpanded = false,
		title,
		...restProps
	}: JsonViewerRootProps = $props();

	const isMobile = new IsMobile();

	/**
	 * Upstream's `useState` initialiser, read through `untrack` so the
	 * seed is unambiguously a seed: nothing here subscribes to `data` or `defaultExpanded`.
	 */
	const seed = untrack(() => {
		if (typeof defaultExpanded === "number") return collectExpandablePaths(data, defaultExpanded);
		if (defaultExpanded === true) return collectExpandablePaths(data);
		return typeof data === "object" && data !== null
			? new Set([JSON_VIEWER_ROOT_PATH])
			: new Set<string>();
	});

	const viewer = new JsonViewerState(
		{
			getData: () => data,
			getTruncation: () => truncation,
			getCollapseMode: () => resolveJsonViewerCollapseMode(collapseOn),
			getShowColorIndent: () => showColorIndent,
			getIsMobile: () => isMobile.current,
		},
		seed,
	);

	setJsonViewerContext(viewer);
</script>

<div
	bind:this={ref}
	data-slot="json-viewer"
	class={cn(
		"relative flex w-full flex-col rounded-md border bg-muted/50 font-mono text-sm leading-6 text-foreground",
		className,
	)}
	{...restProps}
>
	<JsonViewerToolbar label={title} />
	<div class="flex-1 overflow-auto p-4 pt-0">
		<div class="flex">
			{#if showLineNumbers}
				<JsonViewerLineNumbers />
			{/if}
			<div class="flex min-w-0 flex-1 flex-col">
				<JsonViewerNode {data} path={JSON_VIEWER_ROOT_PATH} />
			</div>
		</div>
	</div>
</div>
