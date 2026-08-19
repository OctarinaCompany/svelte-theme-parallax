<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TimelineDescriptionChildProps = {
		"data-slot": "timeline-description";
		class: string;
	} & Record<string, unknown>;

	export type TimelineDescriptionProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the description onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TimelineDescriptionChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: TimelineDescriptionProps = $props();

	const descriptionAttrs = $derived({
		"data-slot": "timeline-description",
		...restProps,
		class: cn("text-sm text-muted-foreground", className),
	} as TimelineDescriptionChildProps);
</script>

{#if child}
	{@render child({ props: descriptionAttrs })}
{:else}
	<div bind:this={ref} {...descriptionAttrs}>
		{@render children?.()}
	</div>
{/if}
