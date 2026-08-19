<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type {
		CompareSliderInteraction,
		CompareSliderOrientation,
	} from "./compare-slider.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type CompareSliderChildProps = {
		role: "slider";
		"aria-orientation": CompareSliderOrientation;
		"aria-valuemin": number;
		"aria-valuemax": number;
		"aria-valuenow": number;
		"data-slot": "compare-slider";
		"data-orientation": CompareSliderOrientation;
		"data-dragging"?: string;
		tabindex: 0;
		class: string;
	} & Record<string, unknown>;

	export type CompareSliderRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Divider position as a percentage, 0 to 100. Bind it to drive the slider from outside.
		 * Seeded once from `defaultValue`.
		 */
		value?: number;
		/** Starting position when `value` is not bound. @default 50 */
		defaultValue?: number;
		/** Fired on every real change, never on a set that resolves to the current value. */
		onValueChange?: (value: number) => void;
		/** Percentage points per arrow key; ten times that for Page keys and shifted arrows. @default 1 */
		step?: number;
		/**
		 * `drag` moves the divider only while the pointer is held; `hover` follows the pointer
		 * unpressed and renders no grab affordance.
		 *
		 * @default "drag"
		 */
		interaction?: CompareSliderInteraction;
		/** @default "horizontal" */
		orientation?: CompareSliderOrientation;
		/** Render your own element and receive the computed attributes. */
		child?: Snippet<[{ props: CompareSliderChildProps }]>;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import {
		CompareSliderState,
		DEFAULT_COMPARE_SLIDER_STEP,
		DEFAULT_COMPARE_SLIDER_VALUE,
		setCompareSliderContext,
	} from "./compare-slider.svelte.js";

	/**
	 * Two pictures of the same thing, and a divider that wipes between them.
	 * `compare-slider.tsx`.
	 *
	 * THE ROOT IS THE SLIDER, not the handle. It carries `role="slider"`, the value, and the
	 * keyboard — so the whole surface is one tab stop and the arrows work wherever the focus ring
	 * sits, rather than requiring the user to find a 44px grip first. The handle is
	 * `role="presentation"`: it is the visible answer to the root's state, not a second control.
	 *
	 * `touch-none` is load-bearing. Without it a touch drag scrolls the page instead of moving the
	 * divider, because the browser claims the gesture before `pointermove` is delivered.
	 */
	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue = DEFAULT_COMPARE_SLIDER_VALUE,
		onValueChange,
		step = DEFAULT_COMPARE_SLIDER_STEP,
		interaction = "drag",
		orientation = "horizontal",
		class: className,
		children,
		child,
		onpointerdown,
		onpointermove,
		onpointerup,
		onpointercancel,
		onkeydown,
		...restProps
	}: CompareSliderRootProps = $props();

	// Seed the bindable from `defaultValue` once, the way `swap.svelte:102` and
	// `action-bar.svelte:142` do. Reading `defaultValue` bare here would capture only its initial
	// value and warn; `untrack` says that is deliberate, and assigning through `??=` means `value`
	// is defined from the first render whether or not a caller bound it.
	value ??= untrack(() => defaultValue);

	const state = new CompareSliderState(value);
	setCompareSliderContext(state);

	// The parts read these off the context, so the root republishes them rather than passing
	// three props down five levels.
	$effect(() => {
		state.orientation = orientation;
	});
	$effect(() => {
		state.interaction = interaction;
	});
	$effect(() => {
		state.step = step;
	});

	/**
	 * Keep the bound prop and the internal value in step, in both directions.
	 *
	 * `sync` rather than the setter for the inbound half: the owner already knows the value it
	 * just wrote, and echoing `onValueChange` back at it is how a controlled slider ends up in a
	 * loop.
	 */
	$effect(() => {
		if (value === undefined) return;
		state.sync(value);
	});

	state.onValueChange = (next) => {
		value = next;
		onValueChange?.(next);
	};

	function moveToPointer(event: PointerEvent) {
		const root = event.currentTarget as HTMLElement | null;
		if (!root) return;
		state.value = state.percentageFromPointer(
			root.getBoundingClientRect(),
			event.clientX,
			event.clientY,
		);
	}

	function handlePointerDown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		onpointerdown?.(event);
		if (event.defaultPrevented || interaction !== "drag") return;

		event.currentTarget.setPointerCapture(event.pointerId);
		state.dragging = true;
		// Upstream only starts tracking on the next move, so a plain click does nothing. Moving on
		// the press instead means the divider jumps to where you clicked, which is what every other
		// slider on the page does.
		moveToPointer(event);
	}

	function handlePointerMove(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		onpointermove?.(event);
		if (event.defaultPrevented) return;
		if (interaction === "drag" && !state.dragging) return;

		moveToPointer(event);
	}

	function handlePointerUp(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		onpointerup?.(event);
		if (event.defaultPrevented || interaction !== "drag") return;

		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		state.dragging = false;
	}

	function handlePointerCancel(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		onpointercancel?.(event);
		if (event.defaultPrevented || interaction !== "drag") return;
		state.dragging = false;
	}

	function handleKeyDown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented) return;

		if (state.applyKey(event.key, event.shiftKey)) event.preventDefault();
	}

	const rootAttrs = $derived({
		role: "slider",
		"aria-orientation": orientation,
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-valuenow": Math.round(state.value),
		"data-slot": "compare-slider",
		"data-orientation": orientation,
		"data-dragging": state.dragging ? "" : undefined,
		tabindex: 0,
		...restProps,
		class: cn(
			"relative isolate touch-none overflow-hidden transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
			orientation === "horizontal" ? "w-full" : "h-full",
			className,
		),
		onpointerdown: handlePointerDown,
		onpointermove: handlePointerMove,
		onpointerup: handlePointerUp,
		onpointercancel: handlePointerCancel,
		onkeydown: handleKeyDown,
	} as CompareSliderChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
