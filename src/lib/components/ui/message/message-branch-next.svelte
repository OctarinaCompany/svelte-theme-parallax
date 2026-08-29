<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	/** `href` is omitted for the reason `Message.BranchPrevious` omits it. */
	export type MessageBranchNextProps = Omit<ButtonProps, "href">;
</script>

<script lang="ts">
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { mergeProps } from "bits-ui";
	import { Button } from "$lib/components/ui/button/index.js";
	import { getMessageBranchContext } from "./message.svelte.js";

	/**
	 * One step forward through the alternatives, wrapping to the first while the root loops. The
	 * mirror of `message-branch-previous.svelte`, which carries the reasoning for both.
	 */
	let {
		ref = $bindable(null),
		variant = "ghost",
		size = "icon-sm",
		class: className,
		children,
		...restProps
	}: MessageBranchNextProps = $props();

	const branch = getMessageBranchContext("`<Message.BranchNext>`");
</script>

<Button
	bind:ref
	{variant}
	{size}
	aria-label="Next branch"
	class={className}
	{...mergeProps({ onclick: () => branch.goNext(), disabled: !branch.canGoNext }, restProps)}
	data-slot="message-branch-next"
>
	{#if children}
		{@render children()}
	{:else}
		<ChevronRightIcon />
	{/if}
</Button>
