<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { StepperDataState, StepperOrientation } from "./stepper.svelte.js";

	/** Upstream's inline separator `cn()`. */
	export const stepperSeparatorVariants = tv({
		base: "bg-border transition-colors data-[state=active]:bg-primary data-[state=completed]:bg-primary",
		variants: {
			orientation: {
				horizontal: "h-px flex-1",
				vertical: "h-10 w-px",
			},
		},
		defaultVariants: {
			orientation: "horizontal",
		},
	});

	/** The merged attribute payload handed to the `child` snippet. */
	export type StepperSeparatorChildProps = {
		role: "separator";
		"aria-hidden": "true";
		"aria-orientation": StepperOrientation;
		"data-slot": "stepper-separator";
		"data-state": StepperDataState;
		"data-orientation": StepperOrientation;
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type StepperSeparatorProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * When `true`, keeps the separator mounted after the **last** step, where it is otherwise not
		 * rendered. Useful for controlling animations with external animation libraries.
		 *
		 * Present in the upstream source but missing from its documented
		 * types file; the source wins.
		 * @default false
		 */
		forceMount?: boolean;
		/**
		 * Render the separator onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: StepperSeparatorChildProps }]>;
	};
</script>

<script lang="ts">
	import { getStepperContext, getStepperItemContext } from "./stepper.svelte.js";

	let {
		ref = $bindable(null),
		forceMount = false,
		class: className,
		child,
		children,
		...restProps
	}: StepperSeparatorProps = $props();

	const root = getStepperContext("<Stepper.Separator>");
	const item = getStepperItemContext("<Stepper.Separator>");

	const isLastStep = $derived(root.indexOf(item.value) === root.stepCount - 1);

	// The `'separator'` variant is what keeps the line *after* the active step unfilled: a separator
	// belongs to the step before it, not to the step it points at.
	const separatorAttrs = $derived({
		role: "separator",
		"aria-hidden": "true",
		"aria-orientation": root.orientation,
		"data-slot": "stepper-separator",
		"data-state": root.dataStateFor(item.value, "separator"),
		"data-orientation": root.orientation,
		dir: root.dir,
		...restProps,
		class: cn(stepperSeparatorVariants({ orientation: root.orientation }), className),
	} as StepperSeparatorChildProps);
</script>

{#if !isLastStep || forceMount}
	{#if child}
		{@render child({ props: separatorAttrs })}
	{:else}
		<div bind:this={ref} {...separatorAttrs}>
			{@render children?.()}
		</div>
	{/if}
{/if}
