<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourTitleChildProps = {
		id: string;
		"data-slot": "tour-title";
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type TourTitleProps = Omit<
		WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
		"dir"
	> & {
		/**
		 * Render the title onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element — including the generated `id` the step's
		 * `aria-labelledby` points at, so the caller's element keeps the accessible name.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TourTitleChildProps }]>;
	};
</script>

<script lang="ts">
	import { getTourContext, getTourStepContext } from "./tour.svelte.js";

	let {
		ref = $bindable(null),
		id,
		class: className,
		children,
		child,
		...restProps
	}: TourTitleProps = $props();

	const root = getTourContext("<Tour.Title>");
	const step = getTourStepContext("<Tour.Title>");

	const instanceId = $props.id();
	const titleId = $derived(id ?? instanceId);

	/**
	 * Upstream's `TourTitle` emits no id at all; the step card here is a modal
	 * dialog, so accessibility requires it to be named by its title.
	 */
	$effect(() => {
		step.registerTitle(titleId);

		return () => step.unregisterTitle();
	});

	const titleAttrs = $derived({
		id: titleId,
		"data-slot": "tour-title",
		dir: root.dir,
		...restProps,
		class: cn("text-base leading-none font-medium", className),
	} as TourTitleChildProps);
</script>

{#if child}
	{@render child({ props: titleAttrs })}
{:else}
	<div bind:this={ref} {...titleAttrs}>
		{@render children?.()}
	</div>
{/if}
