<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type {
		StepperActivationMode,
		StepperNavigationDirection,
		StepperOrientation,
	} from "./stepper.svelte.js";

	/** The root's layout axis, kept byte-identical to upstream's inline `cn()`. */
	export const stepperVariants = tv({
		base: "flex gap-6",
		variants: {
			orientation: {
				horizontal: "w-full flex-col",
				vertical: "flex-row",
			},
		},
		defaultVariants: {
			orientation: "horizontal",
		},
	});

	/** The merged attribute payload handed to the `child` snippet. */
	export type StepperChildProps = {
		id: string;
		"data-slot": "stepper";
		"data-orientation": StepperOrientation;
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type StepperRootProps = Omit<
		WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
		"dir"
	> & {
		/**
		 * The current active step value.
		 *
		 * ```svelte
		 * <Stepper.Root bind:value />
		 * ```
		 */
		value?: string;
		/**
		 * The default active step value.
		 *
		 * ```svelte
		 * <Stepper.Root defaultValue="step-1" />
		 * ```
		 */
		defaultValue?: string;
		/** Event handler called when the active step changes. */
		onValueChange?: (value: string) => void;
		/** Event handler called when a step's `completed` flag flips. */
		onValueComplete?: (value: string, completed: boolean) => void;
		/** Event handler called when a step is added to the stepper. */
		onValueAdd?: (value: string) => void;
		/** Event handler called when a step is removed from the stepper. */
		onValueRemove?: (value: string) => void;
		/**
		 * Event handler called to validate the current step before changing steps.
		 *
		 * Accepts the target step value and the direction of the change, and returns a boolean or
		 * `Promise<boolean>`. A `false` result — or a rejection — blocks the move. Only **forward**
		 * moves are validated; `Stepper.Prev` and backward trigger activation bypass it entirely.
		 *
		 * ```ts
		 * onValidate={(value, direction) => {
		 * 	if (direction === 'prev') return true;
		 * 	return validateCurrentStep(value);
		 * }}
		 * ```
		 */
		onValidate?: (
			value: string,
			direction: StepperNavigationDirection,
		) => boolean | Promise<boolean>;
		/**
		 * Controls how steps are activated during keyboard navigation.
		 *
		 * - `"automatic"`: arrow keys immediately activate the focused step (selection follows focus)
		 * - `"manual"`: arrow keys only move focus, `Enter`/`Space` activate the focused step
		 *
		 * @default "automatic"
		 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ WAI-ARIA Tabs Pattern}
		 */
		activationMode?: StepperActivationMode;
		/**
		 * The reading direction of the stepper. When omitted, resolves the nearest
		 * `<DirectionProvider>`, then an ancestor `[dir]`, then `"ltr"`.
		 * @default "ltr"
		 */
		dir?: Direction;
		/**
		 * The orientation of the stepper.
		 * @default "horizontal"
		 */
		orientation?: StepperOrientation;
		/**
		 * When `true`, prevents the user from interacting with the stepper.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether keyboard navigation should loop around.
		 * @default false
		 */
		loop?: boolean;
		/**
		 * When `true`, prevents interaction with step navigation. The active step still follows
		 * `value`.
		 * @default false
		 */
		nonInteractive?: boolean;
		/**
		 * Render the root onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: StepperChildProps }]>;
	};

	/** Upstream-parity alias of {@link StepperRootProps}. */
	export type StepperProps = StepperRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";

	import { setStepperContext, StepperRootState } from "./stepper.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue,
		onValueChange,
		onValueComplete,
		onValueAdd,
		onValueRemove,
		onValidate,
		activationMode = "automatic",
		dir,
		orientation = "horizontal",
		disabled = false,
		loop = false,
		nonInteractive = false,
		id,
		class: className,
		children,
		child,
		...restProps
	}: StepperRootProps = $props();

	// Uncontrolled: seed once from `defaultValue`. Controlled: the parent's binding wins, which is
	// what lets an authoritative parent decline a write.
	// svelte-ignore state_referenced_locally
	value ??= defaultValue ?? "";

	// The DOM fallback walks up from `document.documentElement`, not from `ref`: the root always
	// renders a resolved `dir` of its own, so anchoring the walk at `ref` would only ever find that.
	const reader = useDirection({ dir: () => dir });

	const instanceId = $props.id();
	const rootId = $derived(id ?? instanceId);

	const state = new StepperRootState({
		getValue: () => value ?? "",
		setValue: (next) => {
			value = next;
			onValueChange?.(next);
		},
		getOrientation: () => orientation,
		getActivationMode: () => activationMode,
		getDisabled: () => disabled,
		getNonInteractive: () => nonInteractive,
		getLoop: () => loop,
		getDir: () => reader.current,
		getOnValidate: () => onValidate,
		getOnValueComplete: () => onValueComplete,
		getOnValueAdd: () => onValueAdd,
		getOnValueRemove: () => onValueRemove,
		getRootId: () => rootId,
	});

	setStepperContext(state);

	const rootAttrs = $derived({
		id: rootId,
		"data-slot": "stepper",
		"data-disabled": disabled ? "" : undefined,
		"data-orientation": orientation,
		dir: reader.current,
		...restProps,
		class: cn(stepperVariants({ orientation }), className),
	} as StepperChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
