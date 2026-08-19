<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { MarqueeOrientation } from "./marquee.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MarqueeContentChildProps = {
		"data-slot": "marquee-content";
		"data-orientation": MarqueeOrientation;
		style: string;
		class: string;
	} & Record<string, unknown>;

	/**
	 * `motion-reduce:animate-none` sits here, on the elements that actually carry an
	 * `animate-marquee-*` utility. Upstream declares it on the root, which is never animated, so the
	 * animation still ran under `prefers-reduced-motion: reduce` (divergence D-02).
	 *
	 * The `dir` variant has no classes of its own; it exists solely as a compound-variant key,
	 * exactly as upstream declares it.
	 */
	export const marqueeContentVariants = tv({
		base: "flex min-w-full shrink-0 gap-(--marquee-gap) motion-reduce:animate-none",
		variants: {
			side: {
				left: "animate-marquee-left",
				right: "animate-marquee-right",
				top: "min-h-full min-w-auto animate-marquee-up flex-col",
				bottom: "min-h-full min-w-auto animate-marquee-down flex-col",
			},
			dir: {
				ltr: "",
				rtl: "",
			},
			pauseOnHover: {
				true: "group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]",
				false: "",
			},
			reverse: {
				true: "[animation-direction:reverse]",
				false: "",
			},
		},
		compoundVariants: [
			{ side: "left", dir: "rtl", class: "animate-marquee-left-rtl" },
			{ side: "right", dir: "rtl", class: "animate-marquee-right-rtl" },
		],
		defaultVariants: {
			side: "left",
			dir: "ltr",
			pauseOnHover: false,
			reverse: false,
		},
	});

	export type MarqueeContentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the announced track onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`; the decorative clone still renders.
		 */
		child?: Snippet<[{ props: MarqueeContentChildProps }]>;
	};
</script>

<script lang="ts">
	import { getMarqueeContext, observeMarqueeSizes } from "./marquee.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		style,
		children,
		child,
		...restProps
	}: MarqueeContentProps = $props();

	const state = getMarqueeContext("<Marquee.Content>");

	// One observer over the container and the inner measured track. Reading `state.rootElement` makes
	// this re-run as soon as the root mounts, whatever order the two components' effects run in; the
	// sizes it writes are never read here, so no `untrack()` is needed.
	$effect(() => {
		const rootElement = state.rootElement;
		const contentElement = ref;
		if (!rootElement || !contentElement) return;

		return observeMarqueeSizes(rootElement, contentElement, (sizes) => state.setSizes(sizes));
	});

	const trackClass = $derived(
		marqueeContentVariants({
			side: state.side,
			dir: state.dir,
			pauseOnHover: state.pauseOnHover,
			reverse: state.reverse,
		}),
	);

	// The consumer's declarations come first so the animation longhands win: they read the root's
	// custom properties and must beat the `animate-*` shorthand the utility class sets.
	const trackStyle = $derived(
		[
			style,
			"animation-duration: var(--marquee-duration);",
			"animation-delay: var(--marquee-delay);",
			"animation-iteration-count: var(--marquee-loop-count);",
			`animation-direction: ${state.reverse ? "reverse" : "normal"};`,
		]
			.filter(Boolean)
			.join(" "),
	);

	const contentAttrs = $derived({
		"data-slot": "marquee-content",
		"data-orientation": state.orientation,
		...restProps,
		style: trackStyle,
		class: cn(
			trackClass,
			state.isVertical
				? "mb-(--marquee-gap)"
				: state.isRtl
					? "ml-(--marquee-gap)"
					: "mr-(--marquee-gap)",
			className,
		),
	} as MarqueeContentChildProps);

	// The clone is decorative, so it takes neither `restProps` nor the gutter: re-spreading the
	// caller's attributes would duplicate their `id` and break every `aria-*` reference to it
	// (divergence D-03).
	const cloneAttrs = $derived({
		"data-slot": "marquee-content",
		"data-orientation": state.orientation,
		"data-clone": "",
		role: "presentation",
		"aria-hidden": "true",
		style: trackStyle,
		class: cn(trackClass, className),
	} as MarqueeContentChildProps);

	const innerClass = $derived(
		cn("flex shrink-0 gap-(--marquee-gap)", state.isVertical && "flex-col"),
	);

	/** `multiplier - 1` extra copies on the announced track; `multiplier` on the clone. */
	const extraCopies = $derived(
		Array.from({ length: Math.max(0, state.multiplier - 1) }, (_, i) => i),
	);
	const cloneCopies = $derived(Array.from({ length: Math.max(0, state.multiplier) }, (_, i) => i));
</script>

{#if child}
	{@render child({ props: contentAttrs })}
{:else}
	<div {...contentAttrs}>
		<!-- Only this div is measured: it holds exactly one copy of the children, so the duration is
		     not inflated by the auto-fill copies beside it. -->
		<div bind:this={ref} class={innerClass}>
			{@render children?.()}
		</div>
		{#each extraCopies as copy (copy)}
			{@render children?.()}
		{/each}
	</div>
{/if}

<div {...cloneAttrs}>
	{#each cloneCopies as copy (copy)}
		{@render children?.()}
	{/each}
</div>
