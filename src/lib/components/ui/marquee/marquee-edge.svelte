<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { MarqueeEdgeSize, MarqueeSide } from "./marquee.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MarqueeEdgeChildProps = {
		"data-slot": "marquee-edge";
		"data-side": MarqueeSide;
		"data-size": MarqueeEdgeSize;
		"aria-hidden": "true";
		class: string;
	} & Record<string, unknown>;

	/**
	 * `z-10` is kept from upstream: the "no manual z-index" rule targets overlay components that own
	 * their stacking (Dialog, Popover, Tooltip, Sheet), while this gradient is a local sibling that
	 * must paint above the scrolling track inside the same stacking context.
	 *
	 * The `size` variant carries no classes of its own — the axis it applies to depends on `side`, so
	 * every size lands through a compound variant.
	 *
	 * WHY THE GRADIENT READS A VARIABLE. This edge fakes a fade by painting the surface colour over
	 * the moving track, so it is only invisible while that colour is the one actually behind it.
	 * Upstream hardcodes `from-background`, which is right on the page ground and wrong everywhere
	 * else — inside a card it lays a `--background` smudge over `--card`, a visible band in both
	 * themes because the two tokens differ by design (the page is the darker surface, cards sit
	 * above it).
	 *
	 * `--marquee-edge` lets the surface say what it is instead. It is deliberately NOT declared on
	 * `Marquee.Root`: a declaration there would out-rank the inherited one and defeat the whole
	 * mechanism, so the fallback lives here, at the point of use. Undefined — a marquee sitting
	 * straight on the page — still resolves to `--background`, which is upstream's behaviour. The
	 * surfaces that override it do so in `src/app.css`, beside the other `--marquee-*` properties.
	 */
	export const marqueeEdgeVariants = tv({
		base: "pointer-events-none absolute z-10",
		variants: {
			side: {
				left: "top-0 left-0 h-full bg-gradient-to-r from-[var(--marquee-edge,var(--background))] to-transparent",
				right:
					"top-0 right-0 h-full bg-gradient-to-l from-[var(--marquee-edge,var(--background))] to-transparent",
				top: "top-0 left-0 w-full bg-gradient-to-b from-[var(--marquee-edge,var(--background))] to-transparent",
				bottom:
					"bottom-0 left-0 w-full bg-gradient-to-t from-[var(--marquee-edge,var(--background))] to-transparent",
			},
			size: {
				default: "",
				sm: "",
				lg: "",
			},
		},
		compoundVariants: [
			{ side: ["left", "right"], size: "default", class: "w-1/4" },
			{ side: ["left", "right"], size: "sm", class: "w-1/6" },
			{ side: ["left", "right"], size: "lg", class: "w-1/3" },
			{ side: ["top", "bottom"], size: "default", class: "h-1/4" },
			{ side: ["top", "bottom"], size: "sm", class: "h-1/6" },
			{ side: ["top", "bottom"], size: "lg", class: "h-1/3" },
		],
		defaultVariants: {
			size: "default",
		},
	});

	export type MarqueeEdgeProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Which side to apply the edge gradient effect. */
		side: MarqueeSide;
		/**
		 * The size of the edge gradient effect.
		 * - `sm`: 1/6 of container width/height
		 * - `default`: 1/4 of container width/height
		 * - `lg`: 1/3 of container width/height
		 * @default "default"
		 */
		size?: MarqueeEdgeSize;
		/**
		 * Render the edge onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: MarqueeEdgeChildProps }]>;
	};
</script>

<script lang="ts">
	// Reads no context, matching upstream's `MarqueeEdge` — `side` is its own prop, so it renders
	// standalone outside `<Marquee.Root>` rather than throwing.
	let {
		ref = $bindable(null),
		side,
		size = "default",
		class: className,
		children,
		child,
		...restProps
	}: MarqueeEdgeProps = $props();

	const edgeAttrs = $derived({
		"data-slot": "marquee-edge",
		"data-side": side,
		"data-size": size,
		// The overlay is a pure gradient with no content, so it is hidden from assistive technology
		// (divergence D-05).
		"aria-hidden": "true",
		...restProps,
		class: cn(marqueeEdgeVariants({ side, size }), className),
	} as MarqueeEdgeChildProps);
</script>

{#if child}
	{@render child({ props: edgeAttrs })}
{:else}
	<div bind:this={ref} {...edgeAttrs}>
		{@render children?.()}
	</div>
{/if}
