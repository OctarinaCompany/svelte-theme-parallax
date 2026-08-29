<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import type { ScrollSpyOrientation, ScrollSpyScrollBehavior } from "./scroll-spy.svelte.js";

	/**
	 * The root's layout axis, kept byte-identical to upstream's inline `cn()` (lines 321-324): a
	 * horizontal root lays the nav out beside the viewport, a vertical one stacks them.
	 */
	export const scrollSpyVariants = tv({
		base: "flex",
		variants: {
			orientation: {
				horizontal: "flex-row",
				vertical: "flex-col",
			},
		},
		defaultVariants: {
			orientation: "horizontal",
		},
	});

	/** The merged attribute payload handed to the `child` snippet. */
	export type ScrollSpyChildProps = {
		"data-slot": "scroll-spy";
		"data-orientation": ScrollSpyOrientation;
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type ScrollSpyRootProps = Omit<WithElementRef<HTMLAttributes<HTMLDivElement>>, "dir"> & {
		/** The active section id. Controlled when bound or passed. */
		value?: string;
		/** Seeds {@link ScrollSpyRootProps.value} once when the component is uncontrolled. */
		defaultValue?: string;
		/** Called on every change to a non-empty active section id. */
		onValueChange?: (value: string) => void;
		/**
		 * `rootMargin` handed to the `IntersectionObserver`. The default shrinks the observation band
		 * to the top of the tracked area, which is what makes "topmost intersecting section" mean
		 * "the section the reader is looking at".
		 * @default `${-offset}px 0px -70% 0px`
		 */
		rootMargin?: string;
		/**
		 * `threshold` handed to the `IntersectionObserver`.
		 * @default 0.1
		 */
		threshold?: number | number[];
		/**
		 * Pixels subtracted from the scroll destination, e.g. to clear a sticky header. Also drives
		 * the default {@link ScrollSpyRootProps.rootMargin}.
		 * @default 0
		 */
		offset?: number;
		/**
		 * How a link-triggered scroll animates.
		 * @default "auto" under `prefers-reduced-motion: reduce`, otherwise "smooth"
		 */
		scrollBehavior?: ScrollSpyScrollBehavior;
		/**
		 * The element whose scroll position is tracked and scrolled. `null` observes against the
		 * viewport (the `IntersectionObserver` root) and scrolls whichever ancestor of the section
		 * actually scrolls — the document on a page that scrolls it, the shell's canvas inside
		 * Parallax, where the document never moves.
		 * @default null
		 */
		scrollContainer?: HTMLElement | null;
		/**
		 * Explicit text direction. When omitted, resolves the nearest `<DirectionProvider>`, then an
		 * ancestor `[dir]`, then `"ltr"`.
		 */
		dir?: Direction;
		/**
		 * Layout axis, published as `data-orientation` on every part.
		 * @default "horizontal"
		 */
		orientation?: ScrollSpyOrientation;
		/**
		 * Render the root onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: ScrollSpyChildProps }]>;
	};

	/** Upstream-parity alias of {@link ScrollSpyRootProps}. */
	export type ScrollSpyProps = ScrollSpyRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";

	import {
		DEFAULT_OFFSET,
		DEFAULT_ORIENTATION,
		DEFAULT_THRESHOLD,
		getDefaultScrollBehavior,
		ScrollSpyState,
		setScrollSpyContext,
	} from "./scroll-spy.svelte.js";
	import { observeSections } from "./section-observer.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue,
		onValueChange,
		rootMargin,
		threshold = DEFAULT_THRESHOLD,
		offset = DEFAULT_OFFSET,
		scrollBehavior = getDefaultScrollBehavior(),
		scrollContainer = null,
		dir,
		orientation = DEFAULT_ORIENTATION,
		class: className,
		children,
		child,
		...restProps
	}: ScrollSpyRootProps = $props();

	// Uncontrolled: seed once from `defaultValue`. Controlled: the parent's binding wins.
	// svelte-ignore state_referenced_locally
	value ??= defaultValue ?? "";

	// The DOM fallback walks up from `document.documentElement`, not from `ref`: the root always
	// renders a resolved `dir` of its own, so anchoring the walk at `ref` would only ever find that.
	const reader = useDirection({ dir: () => dir });

	const state = new ScrollSpyState({
		getValue: () => value ?? "",
		setValue: (next) => {
			value = next;
			// Upstream notifies only for a truthy value (line 143), so seeding to `''` is silent.
			if (next) onValueChange?.(next);
		},
		getOffset: () => offset,
		getScrollBehavior: () => scrollBehavior,
		getScrollContainer: () => scrollContainer,
		getOrientation: () => orientation,
		getDir: () => reader.current,
	});

	setScrollSpyContext(state);

	$effect(() => {
		state.syncExternalValue(value ?? "");
	});

	$effect(() => {
		// Reading the snapshot subscribes this effect to every register/unregister, so the observer is
		// re-established whenever the tracked set changes (divergence D-1).
		const { elements } = state.sections.snapshot();
		if (elements.length === 0) return;

		return observeSections(elements, (element) => state.onObserverTopmost(element), {
			root: scrollContainer,
			rootMargin: rootMargin ?? `${-offset}px 0px -70% 0px`,
			threshold,
		});
	});

	// The settle timeout outlives the observer effect's early return, so it is cleared separately.
	$effect(() => () => state.dispose());

	const rootAttrs = $derived({
		"data-slot": "scroll-spy",
		"data-orientation": orientation,
		dir: reader.current,
		...restProps,
		class: cn(scrollSpyVariants({ orientation }), className),
	} as ScrollSpyChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
