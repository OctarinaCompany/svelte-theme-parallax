<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { TimelineOrientation, TimelineStatus } from "./timeline.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TimelineConnectorChildProps = {
		"aria-hidden": "true";
		"data-slot": "timeline-connector";
		"data-completed"?: "";
		"data-status": TimelineStatus;
		"data-orientation": TimelineOrientation;
		class: string;
	} & Record<string, unknown>;

	export const timelineConnectorVariants = tv({
		base: "absolute z-0",
		variants: {
			isCompleted: {
				true: "bg-primary",
				false: "bg-border",
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
				orientation: "vertical",
				variant: "default",
				class:
					"start-[calc(var(--timeline-dot-size)/2-var(--timeline-connector-thickness)/2)] top-3 h-[calc(100%+0.5rem)] w-[var(--timeline-connector-thickness)]",
			},
			{
				orientation: "horizontal",
				variant: "default",
				class:
					"start-3 top-[calc(var(--timeline-dot-size)/2-var(--timeline-connector-thickness)/2)] h-[var(--timeline-connector-thickness)] w-[calc(100%+0.5rem)]",
			},
			{
				orientation: "vertical",
				variant: "alternate",
				isAlternateRight: false,
				class:
					"-end-[calc(var(--timeline-connector-thickness)/2)] top-2 h-full w-[var(--timeline-connector-thickness)]",
			},
			{
				orientation: "vertical",
				variant: "alternate",
				isAlternateRight: true,
				class:
					"-start-[calc(var(--timeline-connector-thickness)/2)] top-2 h-full w-[var(--timeline-connector-thickness)]",
			},
			{
				orientation: "horizontal",
				variant: "alternate",
				class:
					"start-3 top-[calc(var(--timeline-dot-size)/2-var(--timeline-connector-thickness)/2)] row-start-2 h-[var(--timeline-connector-thickness)] w-[calc(100%+0.5rem)]",
			},
		],
		defaultVariants: {
			isCompleted: false,
			orientation: "vertical",
			variant: "default",
			isAlternateRight: false,
		},
	});

	export type TimelineConnectorProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Keep the connector mounted even when its item is last. Upstream `forceMount`.
		 * @default false
		 */
		forceMount?: boolean;
		/**
		 * Render the connector onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TimelineConnectorChildProps }]>;
	};
</script>

<script lang="ts">
	import { getTimelineContext, getTimelineItemContext } from "./timeline.svelte.js";

	let {
		ref = $bindable(null),
		forceMount = false,
		class: className,
		children,
		child,
		...restProps
	}: TimelineConnectorProps = $props();

	const root = getTimelineContext("Connector");
	const item = getTimelineItemContext("Connector");

	const connectorAttrs = $derived({
		"aria-hidden": "true",
		"data-slot": "timeline-connector",
		"data-completed": item.isConnectorCompleted ? "" : undefined,
		"data-status": item.status,
		"data-orientation": root.orientation,
		...restProps,
		class: cn(
			timelineConnectorVariants({
				isCompleted: item.isConnectorCompleted,
				orientation: root.orientation,
				variant: root.variant,
				isAlternateRight: item.isAlternateRight,
			}),
			className,
		),
	} as TimelineConnectorChildProps);
</script>

{#if !forceMount && item.isLast}
	<!-- Renders nothing: this is the last item's connector and forceMount was not requested. -->
{:else if child}
	{@render child({ props: connectorAttrs })}
{:else}
	<div bind:this={ref} {...connectorAttrs}>
		{@render children?.()}
	</div>
{/if}
