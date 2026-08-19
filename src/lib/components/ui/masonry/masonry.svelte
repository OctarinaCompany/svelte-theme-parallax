<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";

	/** The merged attribute payload handed to the `child` snippet. */
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
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: MasonryChildProps }]>;
	};

	/** Upstream-parity alias of {@link MasonryRootProps}. */
	export type MasonryProps = MasonryRootProps;

	const ROOT_STYLE = "position:relative;width:100%;height:100%;";
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";

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

	// Publishing the element separately from the measurement keeps the measurement effect from
	// tearing down and re-publishing on every debounced resize.
	$effect.pre(() => {
		state.rootElement = ref;
		return () => {
			state.rootElement = null;
		};
	});

	// Upstream's `useIsomorphicLayoutEffect` (lines 1243–1263): flip `mounted` and measure the
	// container's offset chain before paint, so the first `range()` never runs against a stale
	// scroll offset. Svelte runs no effects on the server, so the fallback is what SSR emits.
	$effect.pre(() => {
		state.mounted = true;
		void state.windowSize;
		state.measureContainer(ref);
	});

	// Re-subscribes whenever `scrollFps` changes, and only ever detaches the window listeners:
	// tearing the whole state down here would cancel the in-flight layout frame and drop the
	// `ResizeObserver` on a prop change that has nothing to do with either.
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
