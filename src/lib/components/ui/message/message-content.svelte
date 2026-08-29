<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type MessageContentProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { getMessageContext, messageContentVariants } from "./message.svelte.js";

	/**
	 * The turn's body: the user's bubble or the assistant's full-width prose, decided by the role
	 * the root published. Holds whatever the turn is made of — a `Message.Response`, a tool call,
	 * a reasoning block — stacked with a gap.
	 *
	 * `data-from` is restated here so a stylesheet can address the bubble directly
	 * (`[data-slot=message-content][data-from=user]`) without walking up to the root.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: MessageContentProps = $props();

	const message = getMessageContext("`<Message.Content>`");
</script>

<div
	bind:this={ref}
	data-slot="message-content"
	data-from={message.role}
	class={cn(messageContentVariants({ from: message.role }), className)}
	{...restProps}
>
	{@render children?.()}
</div>
