<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { SpeedDialSide } from "./speed-dial.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type SpeedDialItemChildProps = {
		role: "none";
		"data-slot": "speed-dial-item";
		"data-state": "open" | "closed";
		"data-side": SpeedDialSide;
		/** The animation duration and this item's stagger delay, caller's `style` last. */
		style: string;
		class: string;
	} & Record<string, unknown>;

	export type SpeedDialItemProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the item onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child` mode
		 * `children` is not rendered and `ref` stays `null` — the caller owns the element, so the item
		 * cannot register itself and falls back to a zero stagger delay.
		 */
		child?: Snippet<[{ props: SpeedDialItemChildProps }]>;
	};
</script>

<script lang="ts">
	import {
		DEFAULT_ANIMATION_DURATION,
		getDataState,
		getSpeedDialContentContext,
		getSpeedDialContext,
		setSpeedDialItemContext,
		speedDialItemVariants,
		SpeedDialItemState,
	} from "./speed-dial.svelte.js";

	let {
		ref = $bindable(null),
		style,
		class: className,
		child,
		children,
		...restProps
	}: SpeedDialItemProps = $props();

	const root = getSpeedDialContext("<SpeedDial.Item>");
	// Deliberately optional: an item outside a `<SpeedDial.Content>` still renders, with no stagger
	// and `data-state="closed"` — upstream's `useSpeedDialItemImplContext()` does not throw either.
	const content = getSpeedDialContentContext();

	// One `$props.id()` per component is all Svelte allows, so the item's own registration id is the
	// stem and the two association ids are suffixed off it.
	const itemId = $props.id();

	setSpeedDialItemContext(
		new SpeedDialItemState({ actionId: `${itemId}-action`, labelId: `${itemId}-label` }),
	);

	// Self-registration replaces upstream's `React.Children.map`, which has no Svelte equivalent: the
	// collection sorts by document position, so the stagger survives `{#each}` reordering and
	// conditional items, and every item reads its index out of one shared map.
	$effect(() => {
		const element = ref;
		if (!element || !content) return;

		root.items.register(itemId, element, undefined);
		return () => root.items.unregister(itemId);
	});

	const delay = $derived(content?.delayFor(itemId) ?? 0);
	const open = $derived(content?.animating ?? false);

	const itemStyle = $derived(
		[
			`--speed-dial-animation-duration: ${DEFAULT_ANIMATION_DURATION}ms;`,
			`--speed-dial-delay: ${delay}ms;`,
			style,
		]
			.filter(Boolean)
			.join(" "),
	);

	const itemAttrs = $derived({
		role: "none",
		"data-slot": "speed-dial-item",
		"data-state": getDataState(open),
		"data-side": root.side,
		...restProps,
		style: itemStyle,
		class: cn(speedDialItemVariants({ side: root.side }), className),
	} as SpeedDialItemChildProps);
</script>

{#if child}
	{@render child({ props: itemAttrs })}
{:else}
	<div bind:this={ref} {...itemAttrs}>
		{@render children?.()}
	</div>
{/if}
