<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type StepperContentChildProps = {
		id: string;
		role: "tabpanel";
		"aria-labelledby": string;
		"data-slot": "stepper-content";
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type StepperContentProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * The unique value that links the content with its item.
		 *
		 * ```svelte
		 * <Stepper.Content value="step-1" />
		 * ```
		 */
		value: string;
		/**
		 * When `true`, forces the content to be rendered even if it is not active. Useful for
		 * controlling animations with external animation libraries.
		 * @default false
		 */
		forceMount?: boolean;
		/**
		 * Render the content onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: StepperContentChildProps }]>;
	};
</script>

<script lang="ts">
	import { getStepperContext, getStepperId } from "./stepper.svelte.js";

	let {
		ref = $bindable(null),
		value,
		forceMount = false,
		class: className,
		child,
		children,
		...restProps
	}: StepperContentProps = $props();

	// The content lives *outside* `<Stepper.Item>`, so it derives its ids from the root id and its own
	// `value` rather than from the item context.
	const root = getStepperContext("<Stepper.Content>");

	const contentAttrs = $derived({
		id: getStepperId(root.rootId, "content", value),
		role: "tabpanel",
		"aria-labelledby": getStepperId(root.rootId, "trigger", value),
		"data-slot": "stepper-content",
		dir: root.dir,
		...restProps,
		class: cn("flex-1 outline-none", className),
	} as StepperContentChildProps);
</script>

{#if value === root.value || forceMount}
	{#if child}
		{@render child({ props: contentAttrs })}
	{:else}
		<div bind:this={ref} {...contentAttrs}>
			{@render children?.()}
		</div>
	{/if}
{/if}
