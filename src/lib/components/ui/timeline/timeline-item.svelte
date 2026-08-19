<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLLiAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import type { TimelineOrientation, TimelineStatus } from "./timeline.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TimelineItemChildProps = {
		role: "listitem";
		"aria-current"?: "step";
		"data-slot": "timeline-item";
		"data-status": TimelineStatus;
		"data-orientation": TimelineOrientation;
		"data-alternate-right"?: "";
		id: string;
		dir: Direction;
		class: string;
		/**
		 * Registers `element` as this item's node with the root's DOM-order collection and returns
		 * the matching unregister callback. `ref` stays `null` in `child` mode, so a caller rendering
		 * through `child` must invoke this (e.g. from its own `$effect`) to keep this item's
		 * `data-status` — and its connector's derivation — correct.
		 */
		register: (element: HTMLElement) => () => void;
	} & Record<string, unknown>;

	export const timelineItemVariants = tv({
		base: "relative flex",
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
			{ orientation: "vertical", variant: "default", class: "gap-3 pb-8 last:pb-0" },
			{ orientation: "horizontal", variant: "default", class: "flex-col gap-3" },
			{
				orientation: "vertical",
				variant: "alternate",
				isAlternateRight: false,
				class: "w-1/2 gap-3 pe-6 pb-12 last:pb-0",
			},
			{
				orientation: "vertical",
				variant: "alternate",
				isAlternateRight: true,
				class: "ms-auto w-1/2 flex-row-reverse gap-3 ps-6 pb-12 last:pb-0",
			},
			{
				orientation: "horizontal",
				variant: "alternate",
				class: "grid min-w-0 grid-rows-[1fr_auto_1fr] gap-3",
			},
		],
		defaultVariants: {
			orientation: "vertical",
			variant: "default",
			isAlternateRight: false,
		},
	});

	export type TimelineItemProps = WithElementRef<HTMLLiAttributes, HTMLLIElement> & {
		/**
		 * The item's `id`, and its collection key. Falls back to `$props.id()` when omitted, matching
		 * upstream's `id ?? React.useId()`.
		 */
		id?: string;
		/**
		 * Render the item onto your own element instead of the default `<li>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — call the payload's `register`
		 * function instead to keep this item in the root's collection.
		 */
		child?: Snippet<[{ props: TimelineItemChildProps }]>;
	};
</script>

<script lang="ts">
	import {
		getTimelineContext,
		setTimelineItemContext,
		TimelineItemState,
	} from "./timeline.svelte.js";

	let {
		ref = $bindable(null),
		id,
		class: className,
		children,
		child,
		...restProps
	}: TimelineItemProps = $props();

	const uid = $props.id();
	const itemId = $derived(id ?? uid);

	const root = getTimelineContext("Item");
	const item = new TimelineItemState(root, { getId: () => itemId });
	setTimelineItemContext(item);

	function register(element: HTMLElement): () => void {
		// Capture the id: at teardown the `$derived` already reflects the new id, and
		// unregistering that would leak the old entry from the root's collection.
		const registeredId = itemId;
		root.register(registeredId, element);
		return () => root.unregister(registeredId);
	}

	$effect(() => {
		if (!ref) return;
		return register(ref);
	});

	const itemAttrs = $derived({
		role: "listitem",
		"aria-current": item.status === "active" ? "step" : undefined,
		"data-slot": "timeline-item",
		"data-status": item.status,
		"data-orientation": root.orientation,
		"data-alternate-right": item.isAlternateRight ? "" : undefined,
		id: itemId,
		dir: root.dir,
		...restProps,
		class: cn(
			timelineItemVariants({
				orientation: root.orientation,
				variant: root.variant,
				isAlternateRight: item.isAlternateRight,
			}),
			className,
		),
	} as Omit<TimelineItemChildProps, "register">);
</script>

{#if child}
	{@render child({ props: { ...itemAttrs, register } as TimelineItemChildProps })}
{:else}
	<li bind:this={ref} {...itemAttrs}>
		{@render children?.()}
	</li>
{/if}
