<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes, KeyboardEventHandler, MouseEventHandler } from "svelte/elements";
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";
	import {
		resolveSwapActivationMode,
		resolveSwapAnimation,
		setSwapContext,
		SwapState,
		type SwapActivationMode,
		type SwapAnimation,
		type SwapDataState,
	} from "./swap.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type SwapChildProps = {
		role?: "button";
		"aria-pressed"?: boolean;
		"aria-disabled"?: "true";
		"data-slot": "swap";
		"data-animation": SwapAnimation;
		"data-state": SwapDataState;
		"data-disabled"?: string;
		"data-motion"?: "reduce";
		tabindex?: 0;
		class: string;
		onclick: MouseEventHandler<HTMLDivElement>;
		onmouseenter: MouseEventHandler<HTMLDivElement>;
		onmouseleave: MouseEventHandler<HTMLDivElement>;
		onkeydown: KeyboardEventHandler<HTMLDivElement>;
	} & Record<string, unknown>;

	export type SwapRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Controlled swapped state. When bound, the parent is authoritative.
		 * Seeded once from `defaultSwapped`.
		 */
		swapped?: boolean;
		/**
		 * Uncontrolled seed for `swapped`. Ignored once `swapped` is supplied.
		 * @default false
		 */
		defaultSwapped?: boolean;
		/**
		 * Called with the next value when the component itself changes state (user interaction).
		 * Not fired for parent-driven writes to a bound `swapped`.
		 */
		onSwappedChange?: (swapped: boolean) => void;
		/**
		 * How the swap is activated: `"click"` toggles on click/Enter/Space; `"hover"` swaps to `true`
		 * on pointer enter and `false` on pointer leave.
		 * @default "click"
		 */
		activationMode?: SwapActivationMode;
		/**
		 * The animation style applied to the two faces when the state changes.
		 * @default "fade"
		 */
		animation?: SwapAnimation;
		/**
		 * Suppresses click, hover and keyboard activation; sets `aria-disabled`/`data-disabled`; drops
		 * `tabindex`.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Render the swap onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child` mode
		 * `children` is not rendered and `ref` is not populated — the caller owns the element.
		 */
		child?: Snippet<[{ props: SwapChildProps }]>;
	};

	const ROOT_CLASSES =
		"relative inline-flex items-center justify-center rounded-md outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-50";
</script>

<script lang="ts">
	import { untrack } from "svelte";

	let {
		ref = $bindable(null),
		swapped = $bindable(),
		defaultSwapped = false,
		onSwappedChange,
		activationMode = "click",
		animation = "fade",
		disabled = false,
		class: className,
		children,
		child,
		onclick: onclickProp,
		onmouseenter: onmouseenterProp,
		onmouseleave: onmouseleaveProp,
		onkeydown: onkeydownProp,
		...restProps
	}: SwapRootProps = $props();

	swapped ??= untrack(() => defaultSwapped);

	const reducedMotion = useReducedMotion();

	const state = new SwapState({
		getSwapped: () => swapped ?? false,
		setSwapped: (next) => {
			swapped = next;
			onSwappedChange?.(next);
		},
		getActivationMode: () => resolveSwapActivationMode(activationMode),
		getAnimation: () => resolveSwapAnimation(animation),
		getDisabled: () => disabled,
		getReducedMotion: () => reducedMotion.current,
	});

	setSwapContext(state);

	const onclick: MouseEventHandler<HTMLDivElement> = (event) => {
		onclickProp?.(event);
		if (event.defaultPrevented || !state.isClickMode) return;
		state.toggle();
	};

	const onmouseenter: MouseEventHandler<HTMLDivElement> = (event) => {
		onmouseenterProp?.(event);
		if (event.defaultPrevented || state.isClickMode || state.disabled) return;
		state.setSwapped(true);
	};

	const onmouseleave: MouseEventHandler<HTMLDivElement> = (event) => {
		onmouseleaveProp?.(event);
		if (event.defaultPrevented || state.isClickMode || state.disabled) return;
		state.setSwapped(false);
	};

	const onkeydown: KeyboardEventHandler<HTMLDivElement> = (event) => {
		onkeydownProp?.(event);
		if (event.defaultPrevented || !state.isClickMode || state.disabled) return;
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			state.toggle();
		}
	};

	// Built once and shared by both branches, so a `child` element is styled and wired exactly like
	// the default `<div>`. `class` can never arrive through `restProps` — it is destructured out — so
	// the computed class always wins, matching upstream's `{...rootProps} className={cn(...)}`.
	// Every attribute lives on one dynamic object rather than a static `role`/handler pair, so
	// svelte-check's a11y analysis never sees a static `onclick` next to a conditional `role`
	// (research D-004) — no `svelte-ignore` needed.
	const rootAttrs = $derived({
		role: state.isClickMode ? "button" : undefined,
		"aria-pressed": state.isClickMode ? state.swapped : undefined,
		"aria-disabled": state.disabled ? "true" : undefined,
		"data-slot": "swap",
		"data-animation": state.animation,
		"data-state": state.dataState,
		"data-disabled": state.disabled ? "" : undefined,
		"data-motion": state.reducedMotion ? "reduce" : undefined,
		tabindex: state.isClickMode && !state.disabled ? 0 : undefined,
		...restProps,
		class: cn(ROOT_CLASSES, className),
		onclick,
		onmouseenter,
		onmouseleave,
		onkeydown,
	} as SwapChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
