<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes, KeyboardEventHandler } from "svelte/elements";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import type { MarqueeOrientation, MarqueeSide } from "./marquee.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MarqueeChildProps = {
		role: "marquee";
		"aria-live": "off";
		"data-slot": "marquee";
		"data-orientation": MarqueeOrientation;
		"data-side": MarqueeSide;
		"data-paused": "" | undefined;
		"data-pause-on-hover": "" | undefined;
		dir: Direction;
		tabindex: 0 | undefined;
		style: string;
		class: string;
		onkeydown: KeyboardEventHandler<HTMLDivElement>;
	} & Record<string, unknown>;

	export type MarqueeRootProps = Omit<WithElementRef<HTMLAttributes<HTMLDivElement>>, "dir"> & {
		/**
		 * The direction of the marquee animation.
		 * @default "left"
		 */
		side?: MarqueeSide;
		/**
		 * Explicit text direction. When omitted, resolves the nearest `<DirectionProvider>`, then an
		 * ancestor `[dir]`, then `"ltr"`.
		 */
		dir?: Direction;
		/**
		 * The speed of the animation in pixels per second.
		 * @default 50
		 */
		speed?: number;
		/**
		 * Seconds to wait before the animation starts.
		 * @default 0
		 */
		delay?: number;
		/**
		 * Number of animation iterations.
		 * - `0` (default): Infinite loop
		 * - `Infinity`: Infinite loop
		 * - `> 0`: Loop the specified number of times then stop
		 * @default 0
		 */
		loopCount?: number;
		/**
		 * The gap between marquee items. Accepts CSS length values or numbers (in pixels).
		 * @default "1rem"
		 */
		gap?: string | number;
		/**
		 * Automatically duplicate content to fill the container width/height.
		 * When enabled, content will be repeated until it fills the visible area.
		 * @default false
		 */
		autoFill?: boolean;
		/**
		 * Whether to pause the animation on hover. Also pauses while focus is inside the marquee, so
		 * the pause is reachable without a pointer (divergence D-04).
		 * @default false
		 */
		pauseOnHover?: boolean;
		/**
		 * Whether the marquee can be paused with keyboard controls (Space key). Adds `tabindex="0"`
		 * and a visible focus ring.
		 *
		 * Upstream's source defaults this to `false` while its published prop table documents `true`;
		 * the documented contract wins here (divergence D-01).
		 * @default true
		 */
		pauseOnKeyboard?: boolean;
		/**
		 * Whether to reverse the animation direction.
		 * @default false
		 */
		reverse?: boolean;
		/**
		 * Render the root onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — and because
		 * `<Marquee.Content>` measures the element `ref` points at, the size-driven duration then
		 * falls back to its unmeasured value.
		 */
		child?: Snippet<[{ props: MarqueeChildProps }]>;
	};

	/** Upstream-parity alias of {@link MarqueeRootProps}. */
	export type MarqueeProps = MarqueeRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { MarqueeState, setMarqueeContext } from "./marquee.svelte.js";

	let {
		ref = $bindable(null),
		side = "left",
		dir,
		speed = 50,
		delay = 0,
		loopCount = 0,
		gap = "1rem",
		autoFill = false,
		pauseOnHover = false,
		pauseOnKeyboard = true,
		reverse = false,
		class: className,
		style,
		onkeydown,
		children,
		child,
		...restProps
	}: MarqueeRootProps = $props();

	const reader = useDirection({ dir: () => dir });

	const state = new MarqueeState({
		getSide: () => side,
		getDir: () => reader.current,
		getSpeed: () => speed,
		getDelay: () => delay,
		getLoopCount: () => loopCount,
		getGap: () => gap,
		getAutoFill: () => autoFill,
		getPauseOnHover: () => pauseOnHover,
		getPauseOnKeyboard: () => pauseOnKeyboard,
		getReverse: () => reverse,
	});

	setMarqueeContext(state);

	// `<Marquee.Content>` needs the container to measure it against, and the element only exists once
	// the root is mounted. Publishing it here keeps the elements out of the context *value*, which
	// has no Svelte counterpart for React's `RefObject`-in-context pattern.
	$effect(() => {
		state.rootElement = ref;
		return () => {
			state.rootElement = null;
		};
	});

	// Upstream's own `onKeyDown` replaces a caller-supplied one; composing them keeps the pause
	// behaviour identical while honouring the attribute-forwarding contract (divergence D-06).
	const handleKeydown: KeyboardEventHandler<HTMLDivElement> = (event) => {
		onkeydown?.(event);
		state.onkeydown(event);
	};

	// `role`, `tabindex` and `onkeydown` are merged into one spread object rather than written as
	// literal attributes: Svelte's a11y analysis is static, and a literal `tabindex` on the
	// non-interactive `marquee` role would warn. The `child` snippet needs exactly
	// this payload anyway.
	const rootAttrs = $derived({
		role: "marquee",
		"aria-live": "off",
		"data-slot": "marquee",
		"data-orientation": state.orientation,
		"data-side": side,
		"data-paused": state.paused ? "" : undefined,
		"data-pause-on-hover": pauseOnHover ? "" : undefined,
		dir: reader.current,
		tabindex: pauseOnKeyboard ? 0 : undefined,
		...restProps,
		style: style ? `${state.customProperties} ${style}` : state.customProperties,
		class: cn(
			"relative flex overflow-hidden motion-reduce:animate-none",
			state.isVertical ? "h-full flex-col" : "w-full",
			state.paused && "[&_*]:[animation-play-state:paused]",
			pauseOnHover && "group",
			pauseOnKeyboard &&
				"rounded-md focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
			className,
		),
		onkeydown: handleKeydown,
	} as MarqueeChildProps);
</script>

<div data-slot="marquee-wrapper" class="grid">
	{#if child}
		{@render child({ props: rootAttrs })}
	{:else}
		<div bind:this={ref} {...rootAttrs}>
			{@render children?.()}
		</div>
	{/if}
</div>
