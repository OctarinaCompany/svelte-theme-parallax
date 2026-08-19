<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { TimelineStatus } from "./timeline.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TimelineContentChildProps = {
		"data-slot": "timeline-content";
		"data-status": TimelineStatus;
		class: string;
	} & Record<string, unknown>;

	export const timelineContentVariants = tv({
		base: "flex-1",
		variants: {
			orientation: {
				vertical: "",
				horizontal: "",
			},
			variant: {
				default: "",
				alternate: "",
			},
			isAlternateRight: {
				true: "",
				false: "",
			},
		},
		compoundVariants: [
			{
				variant: "alternate",
				orientation: "vertical",
				isAlternateRight: false,
				class: "text-end",
			},
			{
				variant: "alternate",
				orientation: "horizontal",
				isAlternateRight: false,
				class: "row-start-3 pt-2",
			},
			{
				variant: "alternate",
				orientation: "horizontal",
				isAlternateRight: true,
				class: "row-start-1 pb-2",
			},
		],
		defaultVariants: {
			orientation: "vertical",
			variant: "default",
			isAlternateRight: false,
		},
	});

	export type TimelineContentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the content onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TimelineContentChildProps }]>;
	};
</script>

<script lang="ts">
	import { getTimelineContext, getTimelineItemContext } from "./timeline.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: TimelineContentProps = $props();

	const root = getTimelineContext("Content");
	const item = getTimelineItemContext("Content");

	const contentAttrs = $derived({
		"data-slot": "timeline-content",
		"data-status": item.status,
		...restProps,
		class: cn(
			timelineContentVariants({
				orientation: root.orientation,
				variant: root.variant,
				isAlternateRight: item.isAlternateRight,
			}),
			className,
		),
	} as TimelineContentChildProps);
</script>

{#if child}
	{@render child({ props: contentAttrs })}
{:else}
	<div bind:this={ref} {...contentAttrs}>
		{@render children?.()}
	</div>
{/if}
