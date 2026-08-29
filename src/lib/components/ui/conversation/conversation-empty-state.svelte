<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type ConversationEmptyStateProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * The heading.
		 * @default "No messages yet"
		 */
		title?: string;
		/**
		 * The line under the heading. An empty string renders no description element at all.
		 * @default "Start a conversation to see messages here"
		 */
		description?: string;
		/** An icon above the heading, rendered in `Empty.Media`'s icon tile. Nothing without it. */
		icon?: Snippet;
		/**
		 * REPLACES the default content — icon, title and description are not rendered when this is
		 * supplied, exactly as upstream's `children ??` fallback behaves. Use it for a fully custom
		 * layout; use the props for the standard one.
		 */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import * as Empty from "$lib/components/ui/empty/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * What a transcript shows before its first message.
	 *
	 * Composed from `ui/empty` rather than hand-rolled from utilities (divergence 6 in
	 * `conversation.svelte`): `Empty.Root` is the centred column, `Empty.Header` the stack,
	 * `Empty.Media variant="icon"` the muted tile the icon sits in. The type sizes are the house
	 * empty state's — `text-lg` title, relaxed muted description — not upstream's `text-sm` pair,
	 * so an empty chat looks like every other empty surface in the kit.
	 *
	 * Standalone on purpose: it reads no context, so it renders wherever a caller puts it —
	 * inside `Conversation.Content`, as `chat.tsx` does, or outside a conversation entirely.
	 */
	let {
		ref = $bindable(null),
		class: className,
		title = "No messages yet",
		description = "Start a conversation to see messages here",
		icon,
		children,
		...restProps
	}: ConversationEmptyStateProps = $props();
</script>

<Empty.Root
	bind:ref
	data-slot="conversation-empty-state"
	class={cn("size-full gap-3 p-8", className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<Empty.Header>
			{#if icon}
				<Empty.Media variant="icon">
					{@render icon()}
				</Empty.Media>
			{/if}
			<Empty.Title>{title}</Empty.Title>
			{#if description}
				<Empty.Description>{description}</Empty.Description>
			{/if}
		</Empty.Header>
	{/if}
</Empty.Root>
