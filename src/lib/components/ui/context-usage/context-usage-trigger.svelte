<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	/**
	 * A `Button`'s props: `variant` and `size` pick the button, `children` replace the default
	 * percentage-and-ring label, and everything else lands on the button element.
	 */
	export type ContextUsageTriggerProps = ButtonProps;
</script>

<script lang="ts">
	import { mergeProps } from "bits-ui";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as HoverCard from "$lib/components/ui/hover-card/index.js";
	import { cn } from "$lib/utils.js";
	import ContextUsageIcon from "./context-usage-icon.svelte";
	import { getContextUsageContext } from "./context-usage.svelte.js";

	/**
	 * The thing that opens the card: a ghost `Button` showing the percentage beside the ring.
	 *
	 * `HoverCard.Trigger` renders an `<a>` by default, which is the wrong element for something
	 * that is not a link. Its `child` snippet hands over the attributes Bits UI needs on the
	 * anchor element — the `id` it resolves the element by, `data-state`, and the pointer and
	 * focus handlers that open the card — and they are spread onto the `Button` instead. That is
	 * what upstream's `<HoverCardTrigger asChild>` does with a Radix `Slot`.
	 */
	let {
		ref = $bindable(null),
		class: className,
		variant = "ghost",
		size = "sm",
		children,
		...restProps
	}: ContextUsageTriggerProps = $props();

	const state = getContextUsageContext("`<ContextUsage.Trigger>`");
</script>

<HoverCard.Trigger>
	{#snippet child({ props })}
		<!--
			mergeProps, not a plain spread: the trigger's `props` carry the pointer and focus handlers
			that open the card, and a caller's own `onfocus` or `onpointerenter` must chain after
			them rather than replace them. The stamps and the class go in as the last object rather
			than as attributes after the spread: `mergeProps` merges `class` with clsx, so a class the
			trigger's `props` ever carry survives instead of being overwritten by a literal one.
		-->
		<Button
			bind:ref
			{variant}
			{size}
			{...mergeProps(props, restProps, {
				"data-slot": "context-usage-trigger",
				"data-percent": state.percent,
				class: cn("gap-2", className),
			})}
		>
			{#if children}
				{@render children()}
			{:else}
				<span class="font-medium text-muted-foreground">{state.percentLabel}</span>
				<ContextUsageIcon />
			{/if}
		</Button>
	{/snippet}
</HoverCard.Trigger>
