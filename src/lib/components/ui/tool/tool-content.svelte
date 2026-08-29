<script lang="ts" module>
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";
	import type { WithoutChildrenOrChild } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	/**
	 * The primitive's content props — see `tool.svelte` for why not Svelte's `HTMLAttributes`.
	 * The primitive's own `children` snippet takes a props argument the inner box has no use for,
	 * so it is replaced by a plain one.
	 */
	export type ToolContentProps = WithoutChildrenOrChild<CollapsiblePrimitive.ContentProps> & {
		/** The body: usually a `Tool.Input` and a `Tool.Output`, in that order. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import { getToolContext } from "./tool.svelte.js";

	/**
	 * The collapsible body.
	 *
	 * The padding and the rule sit on an INNER `div`, not on the Collapsible content itself. Bits
	 * UI's content is the element it measures and hides (`hidden` when closed), and a border on it
	 * would be a one-pixel line visible for the frame the measurement runs in; an inner box has no
	 * such frame. `gap-4` replaces upstream's `space-y-4` (`tool.tsx:108`), the house spelling.
	 *
	 * The context read is a guard, not a dependency: it makes `<Tool.Content>` outside a root fail
	 * with the same message as every other part rather than with Bits UI's own.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ToolContentProps = $props();

	getToolContext("`<Tool.Content>`");
</script>

<Collapsible.Content bind:ref data-slot="tool-content" class={className} {...restProps}>
	<div class="flex flex-col gap-4 border-t p-4">
		{@render children?.()}
	</div>
</Collapsible.Content>
