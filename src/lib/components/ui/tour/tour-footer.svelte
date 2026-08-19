<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourFooterChildProps = {
		"data-slot": "tour-footer";
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type TourFooterProps = Omit<
		WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
		"dir"
	> & {
		/**
		 * Render the footer onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TourFooterChildProps }]>;
	};
</script>

<script lang="ts">
	import { getTourContext, getTourStepContext, isInTourDefaultFooter } from "./tour.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: TourFooterProps = $props();

	const root = getTourContext("<Tour.Footer>");
	const step = getTourStepContext("<Tour.Footer>");

	// Upstream's `hasDefaultFooter` check: a footer written inside the root's
	// shared `stepFooter` snippet is *the* default footer and must not claim to be this step's own,
	// or the step would stop rendering the very snippet it is inside.
	const isDefaultFooter = isInTourDefaultFooter();

	$effect(() => {
		if (isDefaultFooter) return;

		step.registerFooter();

		return () => step.unregisterFooter();
	});

	const footerAttrs = $derived({
		"data-slot": "tour-footer",
		dir: root.dir,
		...restProps,
		class: cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className),
	} as TourFooterChildProps);
</script>

{#if child}
	{@render child({ props: footerAttrs })}
{:else}
	<div bind:this={ref} {...footerAttrs}>
		{@render children?.()}
	</div>
{/if}
