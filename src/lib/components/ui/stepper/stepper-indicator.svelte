<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { StepperDataState } from "./stepper.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type StepperIndicatorChildProps = {
		"data-slot": "stepper-indicator";
		"data-state": StepperDataState;
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type StepperIndicatorProps = Omit<
		WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
		"children"
	> & {
		/**
		 * The display content for the indicator. Receives the step's current data state.
		 *
		 * Upstream's `ReactNode | ((dataState) => ReactNode)` union collapses to one snippet that
		 * always receives the state — the house translation of a React render prop. When omitted, the
		 * default content is a check icon for a completed step and the 1-based step position
		 * otherwise.
		 *
		 * ```svelte
		 * {#snippet children(dataState)}
		 * 	{dataState === 'completed' ? '✓' : '1'}
		 * {/snippet}
		 * ```
		 */
		children?: Snippet<[StepperDataState]>;
		/**
		 * Render the indicator onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: StepperIndicatorChildProps }]>;
	};
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";

	import { getStepperContext, getStepperItemContext } from "./stepper.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		child,
		children,
		...restProps
	}: StepperIndicatorProps = $props();

	const root = getStepperContext("<Stepper.Indicator>");
	const item = getStepperItemContext("<Stepper.Indicator>");

	const indicatorAttrs = $derived({
		"data-slot": "stepper-indicator",
		"data-state": item.dataState,
		dir: root.dir,
		...restProps,
		class: cn(
			"flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-muted bg-background text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=completed]:border-primary data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground",
			className,
		),
	} as StepperIndicatorChildProps);
</script>

{#if child}
	{@render child({ props: indicatorAttrs })}
{:else}
	<div bind:this={ref} {...indicatorAttrs}>
		{#if children}
			{@render children(item.dataState)}
		{:else if item.dataState === "completed"}
			<CheckIcon class="size-4" />
		{:else}
			{item.position}
		{/if}
	</div>
{/if}
