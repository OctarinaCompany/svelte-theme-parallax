<script lang="ts" module>
	import type { WithoutChild } from "$lib/utils.js";
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";

	/**
	 * The region's own attributes, minus Bits UI's `child` snippet. The steps are always in the
	 * DOM — Bits UI renders the region unconditionally and stamps `hidden` on it while closed — so
	 * `forceMount` is not a way to keep them mounted; it drops that `hidden` attribute, for a
	 * caller that hides the closed region with its own CSS. `hiddenUntilFound` overrides it.
	 */
	export type ChainOfThoughtContentProps = WithoutChild<CollapsiblePrimitive.ContentProps>;
</script>

<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import { cn } from "$lib/utils.js";
	import { getChainOfThoughtContext } from "./chain-of-thought.svelte.js";

	/**
	 * The collapsible region holding the steps, one below the other.
	 *
	 * `mt-2` is upstream's, and it is on purpose on top of the root's `gap-4`: the header is a
	 * bare line of text and the steps are a block, and the extra 8px is what separates a caption
	 * from what it captions. The region itself does not animate — `chain-of-thought.svelte`
	 * divergence 4 says why the steps carry the entrance instead.
	 *
	 * The context is read only to assert the part is inside a root; the region's open state is
	 * Bits UI's, threaded from the root's `Collapsible.Root`.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ChainOfThoughtContentProps = $props();

	getChainOfThoughtContext("`<ChainOfThought.Content>`");
</script>

<Collapsible.Content
	bind:ref
	data-slot="chain-of-thought-content"
	class={cn("mt-2 flex flex-col gap-3", className)}
	{...restProps}
>
	{@render children?.()}
</Collapsible.Content>
