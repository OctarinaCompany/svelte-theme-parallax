<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { ScrollDirection } from "./scroller.svelte.js";

	/**
	 * Upstream's `scrollButtonVariants` (L277–292), plus two additions house style requires: a
	 * `focus-visible` ring so the control is visibly focusable, and `text-muted-foreground` so the
	 * chevron uses a semantic token instead of inheriting whatever colour the content happens to have
	 * (divergence D-05).
	 *
	 * `z-10` is kept from upstream: the "no manual z-index" rule targets overlay components that own
	 * their stacking (Dialog, Popover, Tooltip, Sheet), while this button is a local sibling that must
	 * paint above the scrolling content inside the root's own `relative` wrapper.
	 */
	export const scrollerButtonVariants = tv({
		base: "absolute z-10 rounded-sm text-muted-foreground transition-opacity focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none [&>svg]:size-4 [&>svg]:opacity-80 hover:[&>svg]:opacity-100",
		variants: {
			direction: {
				up: "top-2 left-1/2 -translate-x-1/2",
				down: "bottom-2 left-1/2 -translate-x-1/2",
				left: "top-1/2 left-2 -translate-y-1/2",
				right: "top-1/2 right-2 -translate-y-1/2",
			},
		},
		defaultVariants: {
			direction: "up",
		},
	});

	/**
	 * The accessible name each direction carries. Upstream renders a bare `<button>` holding only an
	 * `<svg>`, which has no accessible name at all (divergence D-05).
	 */
	export const SCROLL_DIRECTION_LABELS: Record<ScrollDirection, string> = {
		up: "Scroll up",
		down: "Scroll down",
		left: "Scroll left",
		right: "Scroll right",
	};

	export type ScrollerButtonProps = WithoutChildren<
		WithElementRef<HTMLButtonAttributes, HTMLButtonElement>
	> & {
		/** Which way this button scrolls. Also selects the chevron and the anchoring classes. */
		direction: ScrollDirection;
	};
</script>

<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";

	import { AUTO_SCROLL_INTERVAL, getScrollerContext } from "./scroller.svelte.js";

	let {
		ref = $bindable(null),
		direction,
		class: className,
		...restProps
	}: ScrollerButtonProps = $props();

	// The trigger mode, the step and the scroll action all live on the root's state: upstream passes
	// `onClick`/`triggerMode` down as props, and context is the Svelte-idiomatic equivalent — it also
	// supplies the "used outside its provider" guard rail this part would otherwise lack.
	const state = getScrollerContext("scroller-button.svelte");

	const directionToIcon = {
		up: ChevronUpIcon,
		down: ChevronDownIcon,
		left: ChevronLeftIcon,
		right: ChevronRightIcon,
	};
	const Icon = $derived(directionToIcon[direction]);

	// A plain `let`, not `$state`: nothing renders from the handle, and keeping it in the button (not
	// in `ScrollerState`) is what makes the repeat stop by itself when the direction is exhausted and
	// this button unmounts.
	let intervalId: number | null = null;

	/** Idempotent, matching upstream's `if (autoScrollTimer !== null) return`. */
	function start(): void {
		if (intervalId !== null || state.triggerMode === "click") return;
		intervalId = window.setInterval(() => state.scrollByStep(direction), AUTO_SCROLL_INTERVAL);
	}

	function stop(): void {
		if (intervalId === null) return;
		window.clearInterval(intervalId);
		intervalId = null;
	}

	function handlePointerDown(): void {
		if (state.triggerMode === "press") start();
	}

	function handlePointerEnter(): void {
		if (state.triggerMode === "hover") start();
	}

	function handleFocus(): void {
		// Keyboard parity for the hover mode: focus is the pointer-free equivalent of hovering, and
		// blur of leaving (divergence D-04).
		if (state.triggerMode === "hover") start();
	}

	function isActivationKey(event: KeyboardEvent): boolean {
		return event.key === "Enter" || event.key === " ";
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (state.triggerMode !== "press" || !isActivationKey(event)) return;
		// Without this, Space would also scroll the nearest scrollable ancestor.
		event.preventDefault();
		start();
	}

	function handleKeyup(event: KeyboardEvent): void {
		if (!isActivationKey(event)) return;
		stop();
	}

	function handleClick(): void {
		// `press` and `hover` deliberately do nothing on click, matching upstream's `onClick: () => {}`.
		if (state.triggerMode === "click") state.scrollByStep(direction);
	}

	// Nothing may outlive the button: unmounting it — which happens as soon as its direction is
	// exhausted — must clear any live interval.
	$effect(() => {
		return () => stop();
	});
</script>

<button
	bind:this={ref}
	type="button"
	data-slot="scroller-button"
	data-direction={direction}
	data-trigger-mode={state.triggerMode}
	aria-label={SCROLL_DIRECTION_LABELS[direction]}
	{...restProps}
	onpointerdown={handlePointerDown}
	onpointerup={stop}
	onpointerenter={handlePointerEnter}
	onpointerleave={stop}
	onpointercancel={stop}
	onkeydown={handleKeydown}
	onkeyup={handleKeyup}
	onfocus={handleFocus}
	onblur={stop}
	onclick={handleClick}
	class={cn(scrollerButtonVariants({ direction }), className)}
>
	<Icon aria-hidden="true" />
</button>
