<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { StepperOrientation } from "./stepper.svelte.js";

	/** Upstream's inline list `cn()`. */
	export const stepperListVariants = tv({
		base: "flex outline-none",
		variants: {
			orientation: {
				horizontal: "flex-row items-center",
				vertical: "flex-col items-start",
			},
		},
		defaultVariants: {
			orientation: "horizontal",
		},
	});

	/** The merged attribute payload handed to the `child` snippet. */
	export type StepperListChildProps = {
		role: "tablist";
		"data-slot": "stepper-list";
		"aria-orientation": StepperOrientation;
		"data-orientation": StepperOrientation;
		dir: Direction;
		/** `0` while the list is the group's tab stop, `-1` while tabbing back out or with no enabled trigger. */
		tabindex: number;
		class: string;
	} & Record<string, unknown>;

	export type StepperListProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
		/**
		 * Render the list onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: StepperListChildProps }]>;
	};
</script>

<script lang="ts">
	import {
		getStepperContext,
		setStepperFocusContext,
		StepperFocusState,
	} from "./stepper.svelte.js";

	let {
		ref = $bindable(null),
		onfocusin: onfocusinProp,
		onfocusout: onfocusoutProp,
		onmousedown: onmousedownProp,
		class: className,
		child,
		children,
		...restProps
	}: StepperListProps = $props();

	const root = getStepperContext("<Stepper.List>");

	// The list owns the roving-tabindex group; every `<Stepper.Trigger>` registers with it.
	const state = setStepperFocusContext(new StepperFocusState());

	/**
	 * React's `onFocus`/`onBlur` are the delegated, **bubbling** `focusin`/`focusout`, and upstream
	 * relies on that: `onBlur` must fire when focus leaves a *trigger* to clear the tabbing-back-out
	 * flag, which a native non-bubbling `blur` handler on the list would never see.
	 */
	function onfocusin(event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onfocusinProp?.(event);
		if (event.defaultPrevented) return;

		state.onListFocusIn(event, root.value);
	}

	function onfocusout(event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onfocusoutProp?.(event);
		if (event.defaultPrevented) return;

		state.onListFocusOut();
	}

	function onmousedown(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onmousedownProp?.(event);
		if (event.defaultPrevented) return;

		state.onListMouseDown();
	}

	const listAttrs = $derived({
		role: "tablist",
		"data-slot": "stepper-list",
		"aria-orientation": root.orientation,
		"data-orientation": root.orientation,
		dir: root.dir,
		tabindex: state.tabIndex,
		...restProps,
		class: cn(stepperListVariants({ orientation: root.orientation }), className),
		onfocusin,
		onfocusout,
		onmousedown,
	} as StepperListChildProps);
</script>

{#if child}
	{@render child({ props: listAttrs })}
{:else}
	<div bind:this={ref} {...listAttrs}>
		{@render children?.()}
	</div>
{/if}
