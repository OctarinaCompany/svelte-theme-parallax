<script lang="ts" module>
	import type { WithoutChild } from "$lib/utils.js";
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";

	/**
	 * The trigger's own attributes, minus Bits UI's `child` snippet: the header owns its markup
	 * (icon, label, chevron), so there is no element for a caller to substitute.
	 */
	export type ChainOfThoughtHeaderProps = WithoutChild<CollapsiblePrimitive.TriggerProps>;
</script>

<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import { cn } from "$lib/utils.js";
	import BrainIcon from "@lucide/svelte/icons/brain";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import { getChainOfThoughtContext } from "./chain-of-thought.svelte.js";

	/**
	 * The disclosure button: a brain, the label, and a chevron that turns when the trace is open.
	 *
	 * It is `Collapsible.Trigger`, so Bits UI supplies `type="button"`, `aria-expanded`,
	 * `aria-controls` and `data-state`, and the keyboard contract is the native button's — Enter
	 * and Space toggle. The chevron is turned from the context's `open` rather than from
	 * `data-state`, because the same value drives both and one source cannot disagree with itself.
	 *
	 * The icons are sized from the button (`[&>svg]:size-4`), never on the icon — the rule every
	 * Button child follows, stated once on the container so a caller's own icon is sized too.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ChainOfThoughtHeaderProps = $props();

	const state = getChainOfThoughtContext("`<ChainOfThought.Header>`");
</script>

<Collapsible.Trigger
	bind:ref
	data-slot="chain-of-thought-header"
	class={cn(
		"flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground [&>svg]:size-4 [&>svg]:shrink-0",
		className,
	)}
	{...restProps}
>
	<BrainIcon />
	<span class="flex-1 text-left">
		{#if children}
			{@render children()}
		{:else}
			Chain of thought
		{/if}
	</span>
	<ChevronDownIcon class={cn("transition-transform", state.open ? "rotate-180" : "rotate-0")} />
</Collapsible.Trigger>
