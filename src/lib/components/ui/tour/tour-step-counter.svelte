<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourStepCounterChildProps = {
		"data-slot": "tour-step-counter";
		class: string;
	} & Record<string, unknown>;

	export type TourStepCounterProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * How the position is rendered. `children` overrides it entirely.
		 * @default (current, total) => `${current} / ${total}`
		 */
		format?: (current: number, total: number) => string;
		/**
		 * Render the counter onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element, and the formatted text as its
		 * content is the caller's to place.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TourStepCounterChildProps; text: string }]>;
	};

	/** Upstream's default `format`. */
	const DEFAULT_FORMAT = (current: number, total: number) => `${current} / ${total}`;
</script>

<script lang="ts">
	import { getTourContext } from "./tour.svelte.js";

	let {
		ref = $bindable(null),
		format = DEFAULT_FORMAT,
		class: className,
		children,
		child,
		...restProps
	}: TourStepCounterProps = $props();

	const root = getTourContext("<Tour.StepCounter>");

	// Upstream `format(value + 1, steps.length)` — one-based for the reader.
	const text = $derived(format(root.value + 1, root.stepCount));

	const counterAttrs = $derived({
		"data-slot": "tour-step-counter",
		...restProps,
		class: cn("text-sm text-muted-foreground", className),
	} as TourStepCounterChildProps);
</script>

{#if child}
	{@render child({ props: counterAttrs, text })}
{:else}
	<div bind:this={ref} {...counterAttrs}>
		{#if children}
			{@render children()}
		{:else}
			{text}
		{/if}
	</div>
{/if}
