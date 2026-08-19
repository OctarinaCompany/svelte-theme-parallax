<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		DEFAULT_PARTITION_BAR_GAP,
		partitionBarVariants,
		PartitionBarState,
		setPartitionBarContext,
		type PartitionBarAlignment,
		type PartitionBarSize,
	} from "./partition-bar.svelte.js";

	export type PartitionBarRootProps = WithElementRef<
		HTMLAttributes<HTMLUListElement>,
		HTMLUListElement
	> & {
		/**
		 * Type scale, bar height and the space under it, for every segment.
		 *
		 * @default "default"
		 */
		size?: PartitionBarSize;
		/**
		 * Where the labels sit under their bars. Every segment inherits it and may override it.
		 *
		 * @default "center"
		 */
		alignment?: PartitionBarAlignment;
		/**
		 * The denominator for every segment's `num`, when the bar is not meant to be full —
		 * `17 GB of 64 GB`. Omit it and the segments divide the whole track between them.
		 */
		total?: number;
		/**
		 * Space between segments, in spacing steps: `1` is `--spacing(1)`, i.e. 4px.
		 *
		 * @default 1
		 */
		gap?: number;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		size = "default",
		alignment = "center",
		total,
		gap = DEFAULT_PARTITION_BAR_GAP,
		style,
		children,
		...restProps
	}: PartitionBarRootProps = $props();

	const state = new PartitionBarState({
		getSize: () => size,
		getAlignment: () => alignment,
		getTotal: () => total,
	});

	setPartitionBarContext(state);

	// `gap` is a number, so it cannot be a utility class; the caller's own `style` is appended
	// after it rather than replaced by it, which spreading `restProps` alone would do.
	const rootStyle = $derived(
		[`gap: calc(var(--spacing) * ${gap})`, style].filter(Boolean).join("; "),
	);
</script>

<ul
	bind:this={ref}
	data-slot="partition-bar"
	data-size={size}
	{...restProps}
	class={cn(partitionBarVariants({ size }), className)}
	style={rootStyle}
>
	{@render children?.()}
</ul>
