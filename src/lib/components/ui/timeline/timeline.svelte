<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLOlAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import type { TimelineOrientation, TimelineVariant } from "./timeline.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TimelineChildProps = {
		role: "list";
		"data-slot": "timeline";
		"data-orientation": TimelineOrientation;
		"data-variant": TimelineVariant;
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export const timelineVariants = tv({
		base: "relative flex list-none [--timeline-connector-thickness:0.125rem] [--timeline-dot-size:0.875rem]",
		variants: {
			orientation: {
				vertical: "flex-col",
				horizontal: "flex-row items-start",
			},
			variant: {
				default: "",
				alternate: "",
			},
		},
		compoundVariants: [
			{ orientation: "vertical", variant: "default", class: "gap-6" },
			{ orientation: "horizontal", variant: "default", class: "gap-8" },
			{ orientation: "vertical", variant: "alternate", class: "relative w-full gap-3" },
			{ orientation: "horizontal", variant: "alternate", class: "items-center gap-4" },
		],
		defaultVariants: {
			orientation: "vertical",
			variant: "default",
		},
	});

	export type TimelineRootProps = Omit<
		WithElementRef<HTMLOlAttributes, HTMLOListElement>,
		"dir"
	> & {
		/**
		 * Explicit text direction. When omitted, resolves the nearest `<DirectionProvider>`, then an
		 * ancestor `[dir]`, then `"ltr"`.
		 */
		dir?: Direction;
		/**
		 * The layout axis of the timeline.
		 * @default "vertical"
		 */
		orientation?: TimelineOrientation;
		/**
		 * `"alternate"` enables the zig-zag layout where items alternate sides of the center line.
		 * @default "default"
		 */
		variant?: TimelineVariant;
		/**
		 * Zero-based index of the currently active item. Items before it are `"completed"`, the item
		 * at this index is `"active"`, items after are `"pending"`. Omit for every item `"pending"`.
		 */
		activeIndex?: number;
		/**
		 * Render the root onto your own element instead of the default `<ol>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TimelineChildProps }]>;
	};

	/** Upstream-parity alias of {@link TimelineRootProps}. */
	export type TimelineProps = TimelineRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { setTimelineContext, TimelineState } from "./timeline.svelte.js";

	let {
		ref = $bindable(null),
		dir,
		orientation = "vertical",
		variant = "default",
		activeIndex,
		class: className,
		children,
		child,
		...restProps
	}: TimelineRootProps = $props();

	const reader = useDirection({ dir: () => dir });

	const state = new TimelineState({
		getOrientation: () => orientation,
		getVariant: () => variant,
		getDir: () => reader.current,
		getActiveIndex: () => activeIndex,
	});

	setTimelineContext(state);

	// `aria-orientation` is deliberately not rendered — ARIA does not support it on `role="list"` and
	// Svelte's compiler flags it (`a11y_role_supports_aria_props`) in every spelling, which the
	// Quality Gates forbid suppressing. `data-orientation` carries the same information instead.
	const rootAttrs = $derived({
		role: "list",
		"data-slot": "timeline",
		"data-orientation": orientation,
		"data-variant": variant,
		dir: reader.current,
		...restProps,
		class: cn(timelineVariants({ orientation, variant }), className),
	} as TimelineChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<ol bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</ol>
{/if}
