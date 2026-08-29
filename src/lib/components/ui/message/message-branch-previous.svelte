<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	/**
	 * `href` is omitted for the reason `Message.Action` omits it: stepping is a command, never a
	 * link — which is also what lets `ref` be a `<button>` and nothing else.
	 */
	export type MessageBranchPreviousProps = Omit<ButtonProps, "href">;
</script>

<script lang="ts">
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import { mergeProps } from "bits-ui";
	import { Button } from "$lib/components/ui/button/index.js";
	import { getMessageBranchContext } from "./message.svelte.js";

	/**
	 * One step back through the alternatives, wrapping to the last while the root loops.
	 *
	 * DISABLED WHEN THE STEP CANNOT HAPPEN: with fewer than two branches always, and on the first
	 * branch when the root was given `loop={false}`. Upstream disables on the count alone, because
	 * it always loops — see divergence 4 in `message-branch.svelte`.
	 *
	 * `mergeProps` RATHER THAN A PLAIN SPREAD, as `message-action.svelte` uses for its tooltip
	 * trigger: a caller's `onclick` chains after the step instead of replacing it, so an analytics
	 * handler cannot silently leave a pager that no longer pages, while a caller's `disabled` still
	 * wins the plain attribute. `data-slot` is restated after the merge because `Button` stamps its
	 * own and spreads the rest over it.
	 */
	let {
		ref = $bindable(null),
		variant = "ghost",
		size = "icon-sm",
		class: className,
		children,
		...restProps
	}: MessageBranchPreviousProps = $props();

	const branch = getMessageBranchContext("`<Message.BranchPrevious>`");
</script>

<Button
	bind:ref
	{variant}
	{size}
	aria-label="Previous branch"
	class={className}
	{...mergeProps(
		{ onclick: () => branch.goPrevious(), disabled: !branch.canGoPrevious },
		restProps,
	)}
	data-slot="message-branch-previous"
>
	{#if children}
		{@render children()}
	{:else}
		<ChevronLeftIcon />
	{/if}
</Button>
