<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import type { ScrollerOrientation, ScrollerTriggerMode } from "./scroller.svelte.js";

	/**
	 * Upstream's `scrollerVariants` (L22–47), kept verbatim.
	 *
	 * The gradients use `#000`/`transparent` as an **alpha mask**, not as a theme colour — they are
	 * luminance stops, identical in light and dark, so the "semantic tokens only" rule does not apply
	 * and no token exists for (or belongs in) a mask. The mask attributes are matched
	 * on the literal value `"true"`, which is why `ScrollerState` emits `'true' | undefined` rather
	 * than the usual `'' | undefined`.
	 */
	export const scrollerVariants = tv({
		variants: {
			orientation: {
				vertical: [
					"overflow-y-auto",
					"data-[top-scroll=true]:[mask-image:linear-gradient(0deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
					"data-[bottom-scroll=true]:[mask-image:linear-gradient(180deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
					"data-[top-bottom-scroll=true]:[mask-image:linear-gradient(#000,#000,transparent_0,#000_var(--scroll-shadow-size),#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
				],
				horizontal: [
					"overflow-x-auto",
					"data-[left-scroll=true]:[mask-image:linear-gradient(270deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
					"data-[right-scroll=true]:[mask-image:linear-gradient(90deg,#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
					"data-[left-right-scroll=true]:[mask-image:linear-gradient(to_right,#000,#000,transparent_0,#000_var(--scroll-shadow-size),#000_calc(100%_-_var(--scroll-shadow-size)),transparent)]",
				],
			},
			hideScrollbar: {
				true: "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
				false: "",
			},
		},
		defaultVariants: {
			orientation: "vertical",
			hideScrollbar: false,
		},
	});

	/**
	 * The merged attribute payload handed to the `child` snippet.
	 *
	 * The `Record<string, unknown>` tail carries `restProps` and the `createAttachmentKey()` entry —
	 * a `symbol` key, which is why the index signature is required.
	 */
	export type ScrollerChildProps = {
		"data-slot": "scroller";
		"data-orientation": ScrollerOrientation;
		"data-hide-scrollbar": "" | undefined;
		"data-top-scroll": "true" | undefined;
		"data-bottom-scroll": "true" | undefined;
		"data-top-bottom-scroll": "true" | undefined;
		"data-left-scroll": "true" | undefined;
		"data-right-scroll": "true" | undefined;
		"data-left-right-scroll": "true" | undefined;
		dir: Direction;
		style: string;
		class: string;
	} & Record<string, unknown>;

	export type ScrollerRootProps = Omit<WithElementRef<HTMLAttributes<HTMLDivElement>>, "dir"> & {
		/**
		 * The scroll direction of the container.
		 * @default "vertical"
		 */
		orientation?: ScrollerOrientation;
		/**
		 * Whether to hide the scrollbar.
		 * @default false
		 */
		hideScrollbar?: boolean;
		/**
		 * Size of the scroll shadow in pixels.
		 * @default 40
		 */
		size?: number;
		/**
		 * Offset for scroll shadow visibility.
		 * @default 0
		 */
		offset?: number;
		/**
		 * Whether to show navigation buttons.
		 * @default false
		 */
		withNavigation?: boolean;
		/**
		 * Amount to scroll when using navigation buttons.
		 *
		 * When `withNavigation` is false, this prop is ignored.
		 * @default 40
		 */
		scrollStep?: number;
		/**
		 * How navigation buttons trigger scrolling.
		 * - `press`: Continuous scrolling while button is pressed
		 * - `hover`: Continuous scrolling while hovering
		 * - `click`: Single scroll step per click
		 *
		 * When `withNavigation` is false, this prop is ignored.
		 * @default "press"
		 */
		scrollTriggerMode?: ScrollerTriggerMode;
		/**
		 * Explicit text direction. When omitted, resolves the nearest `<DirectionProvider>`, then an
		 * ancestor `[dir]`, then `"ltr"`. Horizontal edge cues and navigation buttons follow the
		 * content's visual start/end (divergence D-01 — upstream has no direction awareness).
		 */
		dir?: Direction;
		/**
		 * Render the scroller onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element; the spread also registers the element
		 * for measurement, so edge cues and navigation keep working.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: ScrollerChildProps }]>;
	};

	/** Upstream-parity alias of {@link ScrollerRootProps}. */
	export type ScrollerProps = ScrollerRootProps;
</script>

<script lang="ts">
	import { createAttachmentKey } from "svelte/attachments";

	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { observeScrollPosition } from "$lib/shared/scroll-position.svelte.js";

	import ScrollerButton from "./scroller-button.svelte";
	import {
		DEFAULT_HIDE_SCROLLBAR,
		DEFAULT_OFFSET,
		DEFAULT_ORIENTATION,
		DEFAULT_SCROLL_STEP,
		DEFAULT_SCROLL_TRIGGER_MODE,
		DEFAULT_SIZE,
		DEFAULT_WITH_NAVIGATION,
		ScrollerState,
		setScrollerContext,
	} from "./scroller.svelte.js";

	let {
		ref = $bindable(null),
		orientation = DEFAULT_ORIENTATION,
		hideScrollbar = DEFAULT_HIDE_SCROLLBAR,
		size = DEFAULT_SIZE,
		offset = DEFAULT_OFFSET,
		withNavigation = DEFAULT_WITH_NAVIGATION,
		scrollStep = DEFAULT_SCROLL_STEP,
		scrollTriggerMode = DEFAULT_SCROLL_TRIGGER_MODE,
		dir,
		class: className,
		style,
		children,
		child,
		...restProps
	}: ScrollerRootProps = $props();

	const reader = useDirection({ dir: () => dir });

	const state = new ScrollerState({
		getOrientation: () => orientation,
		getSize: () => size,
		getOffset: () => offset,
		getScrollStep: () => scrollStep,
		getWithNavigation: () => withNavigation,
		getScrollTriggerMode: () => scrollTriggerMode,
		getDir: () => reader.current,
	});

	setScrollerContext(state);

	const ATTACHMENT = createAttachmentKey();

	/**
	 * Registers whichever element the attributes land on — the component's own `<div>`, or the
	 * consumer's element in `child` mode — and keeps its metrics current for as long as it lives.
	 *
	 * This is the Svelte-native equivalent of React's `Slot` ref-merging: unlike a `child` snippet
	 * that only forwards attributes, spreading these props keeps measurement, the mask attributes and
	 * the navigation buttons fully functional. The reference is deliberately stable, so re-deriving
	 * the attribute object on every scroll never re-subscribes.
	 */
	function registerElement(element: HTMLElement) {
		state.element = element;
		const teardown = observeScrollPosition(element, (metrics) => state.setMetrics(metrics));

		return () => {
			teardown();
			if (state.element === element) state.element = null;
		};
	}

	const rootAttrs = $derived({
		"data-slot": "scroller",
		"data-orientation": orientation,
		"data-hide-scrollbar": hideScrollbar ? "" : undefined,
		...state.edgeAttributes,
		dir: reader.current,
		...restProps,
		style: style ? `${state.customProperty} ${style}` : state.customProperty,
		class: cn(scrollerVariants({ orientation, hideScrollbar }), className),
		[ATTACHMENT]: registerElement,
	} as ScrollerChildProps);
</script>

{#snippet scroller()}
	{#if child}
		{@render child({ props: rootAttrs })}
	{:else}
		<div bind:this={ref} {...rootAttrs}>
			{@render children?.()}
		</div>
	{/if}
{/snippet}

{#if withNavigation}
	<div data-slot="scroller-wrapper" class="relative w-full">
		{#each state.visibleDirections as direction (direction)}
			<ScrollerButton {direction} />
		{/each}
		{@render scroller()}
	</div>
{:else}
	{@render scroller()}
{/if}
