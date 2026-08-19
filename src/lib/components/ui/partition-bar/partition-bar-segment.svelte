<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		getPartitionBarContext,
		PARTITION_BAR_LINE_CLASSES,
		partitionBarLabelVariants,
		partitionBarSegmentVariants,
		type PartitionBarAlignment,
		type PartitionBarVariant,
	} from "./partition-bar.svelte.js";

	export type PartitionBarSegmentProps = WithElementRef<
		HTMLAttributes<HTMLLIElement>,
		HTMLLIElement
	> & {
		/**
		 * This segment's share of the bar. Relative to the other segments' `num`, or a fraction of
		 * the root's `total` when it has one.
		 *
		 * @default 0
		 */
		num?: number;
		/**
		 * The token pair that paints the bar and its label.
		 *
		 * @default "default"
		 */
		variant?: PartitionBarVariant;
		/** Where this segment's label sits. Defaults to the root's `alignment`. */
		alignment?: PartitionBarAlignment;
		/**
		 * Any CSS colour for the bar, for the series a token set does not name — a chart palette.
		 * Overrides `variant`'s fill, and tints the label with it unless `labelColor` says otherwise.
		 */
		color?: string;
		/**
		 * Any CSS colour for the label. Set it when the bar's own colour is too pale to read as
		 * type, which is most of a chart palette.
		 */
		labelColor?: string;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		num = 0,
		variant = "default",
		alignment,
		color,
		labelColor,
		style,
		children,
		...restProps
	}: PartitionBarSegmentProps = $props();

	const state = getPartitionBarContext("<PartitionBar.Segment>");

	const resolvedAlignment = $derived(alignment ?? state.alignment);
	const ink = $derived(labelColor ?? color);

	// The escape hatch writes the two properties `variant` would have set, inline, where it beats
	// the class it overrides. `flex-grow` carries the share: see `PartitionBarState` for why the
	// layout engine divides the track rather than a total computed in JS.
	const segmentStyle = $derived(
		[
			`flex-grow: ${state.growOf(num)}`,
			color ? `--partition-bar-color: ${color}` : undefined,
			ink ? `--partition-bar-ink: ${ink}` : undefined,
			style,
		]
			.filter(Boolean)
			.join("; "),
	);
</script>

<li
	bind:this={ref}
	data-slot="partition-bar-segment"
	data-variant={variant}
	data-alignment={resolvedAlignment}
	{...restProps}
	class={cn(partitionBarSegmentVariants({ variant }), className)}
	style={segmentStyle}
>
	<div
		data-slot="partition-bar-line"
		data-variant={variant}
		class={PARTITION_BAR_LINE_CLASSES}
	></div>
	{#if children}
		<div
			data-slot="partition-bar-segment-label"
			class={partitionBarLabelVariants({ alignment: resolvedAlignment })}
		>
			{@render children()}
		</div>
	{/if}
</li>
