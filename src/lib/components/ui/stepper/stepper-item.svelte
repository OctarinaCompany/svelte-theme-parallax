<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { StepperDataState, StepperOrientation } from "./stepper.svelte.js";

	/** Upstream's inline item `cn()`. */
	export const stepperItemVariants = tv({
		base: "relative flex items-center not-last:flex-1",
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
	export type StepperItemChildProps = {
		"data-slot": "stepper-item";
		"data-state": StepperDataState;
		"data-orientation": StepperOrientation;
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type StepperItemProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
		/**
		 * The unique value that links the item with its content.
		 *
		 * ```svelte
		 * <Stepper.Item value="step-1" />
		 * ```
		 */
		value: string;
		/**
		 * When `true`, marks this step as completed regardless of its position.
		 * @default false
		 */
		completed?: boolean;
		/**
		 * When `true`, prevents the user from interacting with this step.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Render the item onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: StepperItemChildProps }]>;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";

	import { getStepperContext, setStepperItemContext, StepperItemState } from "./stepper.svelte.js";

	let {
		ref = $bindable(null),
		value,
		completed = false,
		disabled = false,
		class: className,
		child,
		children,
		...restProps
	}: StepperItemProps = $props();

	const root = getStepperContext("<Stepper.Item>");

	const state = setStepperItemContext(
		new StepperItemState(root, {
			getValue: () => value,
			getDisabled: () => disabled,
		}),
	);

	// Each registration input goes through a `$derived` first. A caller that rebuilds its step array
	// on every render hands each item a *new* object with the same fields; reading the prop straight
	// inside the effect would then invalidate it and unregister/re-register the step for nothing,
	// firing `onValueRemove`/`onValueAdd` spuriously. A derived that recomputes to an equal value
	// does not notify, so only a genuine change reaches the registry.
	const stepValue = $derived(value);
	const isCompleted = $derived(completed);
	const isDisabled = $derived(disabled);

	// Registration is keyed on `value` **alone**: a `completed`/`disabled` flip updates the step in
	// place (below) instead of removing and re-adding it, which would move the key to the end of the
	// insertion-ordered registry. Upstream's two effects share one dependency list and have exactly
	// that defect, which is also why its `onValueComplete` can never fire.
	//
	// The write itself is untracked: `SvelteMap.set` reads the map's version counter to increment it,
	// so a tracked call would subscribe *every* item to *every* other item's registration and churn
	// the whole registry each time one step mounts or unmounts.
	$effect(() => {
		const key = stepValue;

		untrack(() => root.addStep(key, isCompleted, isDisabled));

		return () => root.removeStep(key);
	});

	// Upstream `setStep` (635-637): updates the registration in place, firing `onValueComplete` only
	// when the `completed` flag actually flips.
	$effect(() => {
		const key = stepValue;
		const completedFlag = isCompleted;
		const disabledFlag = isDisabled;

		untrack(() => root.setStep(key, completedFlag, disabledFlag));
	});

	const itemAttrs = $derived({
		"data-slot": "stepper-item",
		"data-state": state.dataState,
		"data-disabled": state.disabled ? "" : undefined,
		"data-orientation": root.orientation,
		dir: root.dir,
		...restProps,
		class: cn(stepperItemVariants({ orientation: root.orientation }), className),
	} as StepperItemChildProps);
</script>

{#if child}
	{@render child({ props: itemAttrs })}
{:else}
	<div bind:this={ref} {...itemAttrs}>
		{@render children?.()}
	</div>
{/if}
