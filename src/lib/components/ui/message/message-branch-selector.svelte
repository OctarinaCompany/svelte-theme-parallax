<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import { ButtonGroup } from "$lib/components/ui/button-group/index.js";
	import { cn } from "$lib/utils.js";

	/** The group's own props, as upstream types this part. `orientation` included. */
	export type MessageBranchSelectorProps = ComponentProps<typeof ButtonGroup>;
</script>

<script lang="ts">
	import { getMessageBranchContext } from "./message.svelte.js";

	/**
	 * The pager under the alternatives: previous, the counter, next. A `ButtonGroup` — upstream's
	 * choice, and the house component that already owns the group's `role="group"`, its orientation
	 * and the focus-ring stacking.
	 *
	 * IT RENDERS NOTHING BELOW TWO BRANCHES, upstream's rule kept: one answer has nothing to page
	 * through, and a pager reading "1 of 1" is furniture. The whole subtree goes with it, so the
	 * buttons are not merely disabled — they are absent from the tab order.
	 *
	 * THE CORNERS ARE PUT BACK. `buttonGroupVariants` squares the inner edges, which is what makes
	 * a row of outline buttons read as one control; here the children are ghost buttons and a
	 * transparent counter, and the only thing the squared corners shape is a hover ground, which
	 * then reads as a block rather than a control. Upstream re-rounds the same way.
	 *
	 * The `!` is what makes it stick. `buttonGroupVariants` states the corners through several
	 * different arbitrary variants — `[&>[data-slot]]:rounded-r-none`,
	 * `[&>[data-slot]~[data-slot]]:rounded-l-none` and one more with `!` of its own — and
	 * tailwind-merge can only drop a class the override shares a modifier with. A plain
	 * `rounded-md` here would therefore merge away exactly one of them and lose the cascade to the
	 * rest.
	 */
	let {
		ref = $bindable(null),
		orientation = "horizontal",
		class: className,
		children,
		...restProps
	}: MessageBranchSelectorProps = $props();

	const branch = getMessageBranchContext("`<Message.BranchSelector>`");
</script>

{#if branch.count > 1}
	<ButtonGroup
		bind:ref
		{orientation}
		class={cn("[&>[data-slot]]:rounded-md!", className)}
		{...restProps}
		data-slot="message-branch-selector"
	>
		{@render children?.()}
	</ButtonGroup>
{/if}
