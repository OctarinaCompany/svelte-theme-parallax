<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ConversationContentProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { getConversationContext } from "./conversation.svelte.js";

	/**
	 * The column the messages stack in — upstream's `StickToBottom.Content` with the same
	 * `flex flex-col gap-8 p-4`.
	 *
	 * `min-h-full` is this kit's: it lets an empty state centre itself in a viewport that has
	 * nothing else in it, which `chat.tsx` needs and upstream gets from the library's own inline
	 * style. A transcript taller than the viewport is unaffected — the minimum is already met.
	 *
	 * The context is read only to enforce the nesting; the root observes its children's size
	 * directly, so this part has nothing to register.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ConversationContentProps = $props();

	getConversationContext("`<Conversation.Content>`");
</script>

<div
	bind:this={ref}
	data-slot="conversation-content"
	class={cn("flex min-h-full flex-col gap-8 p-4", className)}
	{...restProps}
>
	{@render children?.()}
</div>
