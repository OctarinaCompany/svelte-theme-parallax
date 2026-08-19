<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type StepperDescriptionChildProps = {
		id: string;
		"data-slot": "stepper-description";
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type StepperDescriptionProps = WithElementRef<
		HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	> & {
		/**
		 * Render the description onto your own element instead of the default `<span>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: StepperDescriptionChildProps }]>;
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
	}: StepperDescriptionProps = $props();

	const root = getStepperContext("<Stepper.Description>");
	const item = getStepperItemContext("<Stepper.Description>");

	// `data-slot="stepper-description"`, not upstream's bare `description` — see the note on
	// `<Stepper.Title>`.
	const descriptionAttrs = $derived({
		id: item.descriptionId,
		"data-slot": "stepper-description",
		dir: root.dir,
		...restProps,
		class: cn("text-xs text-muted-foreground", className),
	} as StepperDescriptionChildProps);
</script>

{#if child}
	{@render child({ props: descriptionAttrs })}
{:else}
	<span bind:this={ref} {...descriptionAttrs}>
		{@render children?.()}
	</span>
{/if}
