<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourDescriptionChildProps = {
		id: string;
		"data-slot": "tour-description";
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type TourDescriptionProps = Omit<
		WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
		"dir"
	> & {
		/**
		 * Render the description onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element — including the generated `id` the
		 * step's `aria-describedby` points at.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TourDescriptionChildProps }]>;
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
	}: TourDescriptionProps = $props();

	const root = getTourContext("<Tour.Description>");
	const step = getTourStepContext("<Tour.Description>");

	const instanceId = $props.id();
	const descriptionId = $derived(id ?? instanceId);

	/** Upstream emits no id; the card's `aria-describedby` needs one. */
	$effect(() => {
		step.registerDescription(descriptionId);

		return () => step.unregisterDescription();
	});

	const descriptionAttrs = $derived({
		id: descriptionId,
		"data-slot": "tour-description",
		dir: root.dir,
		...restProps,
		class: cn("text-sm text-muted-foreground", className),
	} as TourDescriptionChildProps);
</script>

{#if child}
	{@render child({ props: descriptionAttrs })}
{:else}
	<div bind:this={ref} {...descriptionAttrs}>
		{@render children?.()}
	</div>
{/if}
