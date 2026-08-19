<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourHeaderChildProps = {
		"data-slot": "tour-header";
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type TourHeaderProps = Omit<
		WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
		"dir"
	> & {
		/**
		 * Render the header onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TourHeaderChildProps }]>;
	};
</script>

<script lang="ts">
	import { getTourContext } from "./tour.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: TourHeaderProps = $props();

	const root = getTourContext("<Tour.Header>");

	const headerAttrs = $derived({
		"data-slot": "tour-header",
		dir: root.dir,
		...restProps,
		class: cn("flex flex-col gap-1.5 text-center sm:text-left", className),
	} as TourHeaderChildProps);
</script>

{#if child}
	{@render child({ props: headerAttrs })}
{:else}
	<div bind:this={ref} {...headerAttrs}>
		{@render children?.()}
	</div>
{/if}
