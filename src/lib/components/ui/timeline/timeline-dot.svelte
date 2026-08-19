<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { TimelineOrientation, TimelineStatus } from "./timeline.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TimelineDotChildProps = {
		"data-slot": "timeline-dot";
		"data-status": TimelineStatus;
		"data-orientation": TimelineOrientation;
		class: string;
	} & Record<string, unknown>;

	export const timelineDotVariants = tv({
		base: "relative z-10 flex size-[var(--timeline-dot-size)] shrink-0 items-center justify-center rounded-full border-2 bg-background",
		variants: {
			status: {
				completed: "border-primary",
				active: "border-primary",
				pending: "border-border",
			},
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
				class:
					"absolute -end-[calc(var(--timeline-dot-size)/2-var(--timeline-connector-thickness)/2)] bg-background",
			},
			{
				variant: "alternate",
				orientation: "vertical",
				isAlternateRight: true,
				class:
					"absolute -start-[calc(var(--timeline-dot-size)/2-var(--timeline-connector-thickness)/2)] bg-background",
			},
			{
				variant: "alternate",
				orientation: "horizontal",
				class: "row-start-2 bg-background",
			},
		],
		defaultVariants: {
			status: "pending",
			orientation: "vertical",
			variant: "default",
			isAlternateRight: false,
		},
	});

	export type TimelineDotProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the dot onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TimelineDotChildProps }]>;
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
	}: TimelineDotProps = $props();

	const root = getTimelineContext("Dot");
	const item = getTimelineItemContext("Dot");

	const dotAttrs = $derived({
		"data-slot": "timeline-dot",
		"data-status": item.status,
		"data-orientation": root.orientation,
		...restProps,
		class: cn(
			timelineDotVariants({
				status: item.status,
				orientation: root.orientation,
				variant: root.variant,
				isAlternateRight: item.isAlternateRight,
			}),
			className,
		),
	} as TimelineDotChildProps);
</script>

{#if child}
	{@render child({ props: dotAttrs })}
{:else}
	<div bind:this={ref} {...dotAttrs}>
		{@render children?.()}
	</div>
{/if}
