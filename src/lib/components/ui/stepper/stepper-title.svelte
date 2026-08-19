<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type StepperTitleChildProps = {
		id: string;
		"data-slot": "stepper-title";
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type StepperTitleProps = WithElementRef<
		HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	> & {
		/**
		 * Render the title onto your own element instead of the default `<span>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: StepperTitleChildProps }]>;
	};
</script>

<script lang="ts">
	import { getStepperContext, getStepperItemContext } from "./stepper.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		child,
		children,
		...restProps
	}: StepperTitleProps = $props();

	const root = getStepperContext("<Stepper.Title>");
	const item = getStepperItemContext("<Stepper.Title>");

	// `data-slot="stepper-title"`, not upstream's bare `title`: the bare name collides with `card`,
	// `alert` and `empty`, and the trigger's matching selector is renamed in step.
	const titleAttrs = $derived({
		id: item.titleId,
		"data-slot": "stepper-title",
		dir: root.dir,
		...restProps,
		class: cn("text-sm font-medium", className),
	} as StepperTitleChildProps);
</script>

{#if child}
	{@render child({ props: titleAttrs })}
{:else}
	<span bind:this={ref} {...titleAttrs}>
		{@render children?.()}
	</span>
{/if}
