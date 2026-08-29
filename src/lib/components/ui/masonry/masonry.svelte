<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";

	/**
	 * The merged attribute payload handed to the `child` snippet. Spread it onto the element whole:
	 * besides the attributes it carries the attachment that hands the element back to the root, and
	 * without it the root is neither measured nor virtualised.
	 */
	export type MasonryChildProps = {
		"data-slot": "masonry";
		"data-scrolling": "" | undefined;
		dir: Direction;
		style: string;
		class: string;
	} & Record<string, unknown>;

	export type MasonryRootProps = Omit<WithElementRef<HTMLAttributes<HTMLDivElement>>, "dir"> & {
		/**
		 * Preferred column width in px, used to derive the column count when `columnCount` is not set.
		 * @default 200
		 */
		columnWidth?: number;
		/** Explicit column count. Overrides the derived one and makes `maxColumnCount` inert. */
		columnCount?: number;
		/** Caps the derived column count. Ignored when `columnCount` is set. */
		maxColumnCount?: number;
		/**
		 * Space between items. A number applies to both axes; the object sets each independently.
		 * @default 0
		 */
		gap?: number | { column: number; row: number };
		/**
		 * Estimated height of a not-yet-measured item, in px. Drives total-height estimation and how
		 * many items each hidden measurement pass covers.
		 * @default 300
		 */
		itemHeight?: number;
		/** Container width assumed before measurement (server render / first paint). Effective `0`. */
		defaultWidth?: number;
		/** Viewport height assumed before measurement. Effective `0`. */
		defaultHeight?: number;
		/**
		 * How far beyond the viewport items stay mounted, in multiples of viewport height.
		 * @default 2
		 */
		overscan?: number;
		/**
		 * Upper bound on scroll-driven recomputation, in frames per second.
		 * @default 12
		 */
		scrollFps?: number;
		/**
		 * Round-robin column assignment instead of shortest-first, so items keep their source order
		 * from the leading edge onwards while the columns stay reasonably balanced.
		 * @default false
		 */
		linear?: boolean;
		/**
		 * Rendered **instead of** the whole positioned list until the component has mounted and
		 * measured. Server and first client pass both emit it, so there is no hydration mismatch and
		 * the first paint never depends on measurement.
		 */
		fallback?: Snippet;
		/**
		 * Explicit text direction. When omitted, resolves the nearest `<DirectionProvider>`, then an
		 * ancestor `[dir]`, then `"ltr"`. Not present upstream: items anchor on `inset-inline-start`,
		 * so the resolved direction is what mirrors the layout.
		 */
		dir?: Direction;
		/**
		 * Render the root onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered; `ref` is still published — the spread props carry an
		 * attachment that hands the element back — so the root is measured and virtualised against
		 * its scroll parent exactly as the default `<div>` is.
		 */
		child?: Snippet<[{ props: MasonryChildProps }]>;
	};

	/** Upstream-parity alias of {@link MasonryRootProps}. */
	export type MasonryProps = MasonryRootProps;

	const ROOT_STYLE = "position:relative;width:100%;height:100%;";
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { scrollParentOf } from "$lib/shared/scroll-parent.js";
	import { createAttachmentKey } from "svelte/attachments";

	import MasonryViewport from "./masonry-viewport.svelte";
	import {
		MasonryState,
		observeWindowScroll,
		observeWindowSize,
		setMasonryContext,
	} from "./masonry.svelte.js";

	let {
		ref = $bindable(null),
		columnWidth = 200,
		columnCount,
		maxColumnCount,
		gap = 0,
		itemHeight = 300,
		defaultWidth,
		defaultHeight,
		overscan = 2,
		scrollFps = 12,
		linear = false,
		fallback,
		dir,
		class: className,
		style,
		children,
		child,
		...restProps
	}: MasonryRootProps = $props();

	const reader = useDirection({ dir: () => dir, element: () => ref });

	const state = new MasonryState({
		getColumnWidth: () => columnWidth,
		getColumnCount: () => columnCount,
		getMaxColumnCount: () => maxColumnCount,
		getGap: () => gap,
		getItemHeight: () => itemHeight,
		getDefaultWidth: () => defaultWidth,
		getDefaultHeight: () => defaultHeight,
		getOverscan: () => overscan,
		getScrollFps: () => scrollFps,
		getLinear: () => linear,
		getDir: () => reader.current,
	});

	setMasonryContext(state);

	// In `child` mode there is no `bind:this`, so the consumer's element comes back through the
	// spread props instead — the attachment pattern `masonry-item.svelte` uses for `measure`.
	// Without it `ref` stayed `null` in that mode, the scroll parent was never resolved, and the
	// observers read the document's offset for good: inside the shell that is `0`, so the grid
	// painted its first band and never advanced. Declared once with a stable identity rather than
	// inline in the `$derived` below, so the attachment does not re-run — tearing `ref` down and
	// publishing it again — every time `isScrolling` flips `rootAttrs`.
	const attachRoot = createAttachmentKey();
	const publishRoot = (element: Element) => {
		if (!(element instanceof HTMLElement)) return;
		ref = element;
		return () => {
			ref = null;
		};
	};

	// Publishing the element separately from the measurement keeps the measurement effect from
	// tearing down and re-publishing on every debounced resize.
	//
	// The scroll parent is resolved here as well, and nowhere else. Upstream virtualises against
	// the window; inside the Parallax shell the window never scrolls — `Sidebar.Inset` is the one
	// scroll container (`src/app.css`) — so the grid asks `src/lib/shared/scroll-parent.ts` which
	// box scrolls it and the observers below follow that answer. The lookup walks the ancestors'
	// computed styles, so it needs the element in the document: `bind:this` — and, in `child`
	// mode, the attachment that stands in for it — lands from an `$effect`, after this
	// pre-effect's first pass, and the re-run it triggers is the one that finds the element
	// connected. A detached element publishes `null` rather than a wrong answer (the walk would
	// stop at nothing and fall back to the document).
	$effect.pre(() => {
		state.rootElement = ref;
		state.scroller = ref?.isConnected ? scrollParentOf(ref) : null;
		return () => {
			state.rootElement = null;
			state.scroller = null;
		};
	});

	// Upstream's `useIsomorphicLayoutEffect` (lines 1243–1263): flip `mounted` and measure the
	// container's offset before paint, so the first `range()` never runs against a stale scroll
	// offset. `measureContainer` reads `state.scroller`, so the offset is taken again — into the
	// right box this time — once the effect above has resolved it. Svelte runs no effects on the
	// server, so the fallback is what SSR emits.
	$effect.pre(() => {
		state.mounted = true;
		void state.windowSize;
		state.measureContainer(ref);
	});

	// Re-subscribes whenever `scrollFps` changes or the scroller is resolved (the scroll observer
	// reads it), and only ever detaches the listeners: tearing the whole state down here would
	// cancel the in-flight layout frame and drop the `ResizeObserver` on a change that has nothing
	// to do with either.
	$effect(() => {
		const stopSize = observeWindowSize(state);
		const stopScroll = observeWindowScroll(state, scrollFps);

		return () => {
			stopSize();
			stopScroll();
		};
	});

	// No dependencies, so this teardown runs once, when the root itself is destroyed.
	$effect(() => () => state.destroy());

	const rootAttrs = $derived({
		"data-slot": "masonry",
		"data-scrolling": state.isScrolling ? "" : undefined,
		dir: reader.current,
		...restProps,
		style: style ? `${ROOT_STYLE}${style}` : ROOT_STYLE,
		class: cn(className),
		[attachRoot]: publishRoot,
	} as MasonryChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		<MasonryViewport {fallback}>
			{@render children?.()}
		</MasonryViewport>
	</div>
{/if}
