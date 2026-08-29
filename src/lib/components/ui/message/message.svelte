<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { MessageRole } from "$lib/shared/chat-parts.js";

	export type MessageRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Who authored the turn. Stamped as `data-from`, published on context for the parts, and
		 * what decides the alignment: a `user` turn hugs the right edge, everything else the left.
		 * A value outside `MESSAGE_ROLES` renders as `assistant`.
		 */
		from: MessageRole;
	};

	/** Alias of {@link MessageRootProps}, present for parity with the upstream type name. */
	export type MessageProps = MessageRootProps;
</script>

<script lang="ts">
	import {
		MessageState,
		messageVariants,
		resolveMessageRole,
		setMessageContext,
	} from "./message.svelte.js";

	/**
	 * One turn of a chat: who said it, aligned accordingly, holding a body, a Markdown response
	 * and a row of actions.
	 *
	 * A port of the AI Elements `Message` family. What the kit must render is the transcript loop
	 * in the origin's `chat.tsx` — `<Message from={role}><MessageContent>…parts…</MessageContent>
	 * </Message>` with `<MessageResponse isAnimating>` for text parts — and that is what the six
	 * parts here cover.
	 *
	 * WHAT DIVERGES FROM UPSTREAM, AND WHY:
	 *
	 * 1. THE ROLE TRAVELS ON CONTEXT, NOT ON A CLASS. Upstream stamps `is-user` / `is-assistant`
	 *    on the root and every part reads it back through `group-[.is-user]:` selectors. Here the
	 *    root publishes a `MessageState` and stamps `data-from`; `Message.Content` reads the state
	 *    and picks its `tv` variant. The look is expressed as variants (`docs/CONVENTIONS.md` §8),
	 *    and a caller's own part reaches the role the same way every other house context does.
	 *
	 * 2. `Message.Response` TAKES `content: string`, NOT CHILDREN. Upstream passes the Markdown
	 *    as React children because a string is a valid child there. A Svelte snippet is a render
	 *    function, not a value, so the text has to arrive as a prop — see the part's own comment.
	 *
	 * 3. THE BRANCH PARTS ARE NOT PORTED. `MessageBranch`, `MessageBranchContent`, `Selector`,
	 *    `Previous`, `Next` and `Page` switch between alternative answers to one prompt. The
	 *    origin's chat never renders them, and the mechanism — counting and hiding sibling
	 *    elements from a parent — is a separate component's worth of state. Left out rather than
	 *    ported half-way.
	 *
	 * 4. `Message.Action` REQUIRES `label`. Upstream names the button `label || tooltip` and lets
	 *    both be absent, which is an icon button with no accessible name. Here the label is the
	 *    contract and the tooltip is decoration on top of it.
	 *
	 * 5. THE WIDTH CAP IS ON THE BODY, NOT THE ROOT. Upstream caps the root at `max-w-[95%]` and
	 *    pushes a user turn right with `ml-auto`; the body is then `w-fit`. Here the root is
	 *    always the full column and aligns its content with `items-end` / `items-start`, and the
	 *    80% cap sits on the user bubble alone — so an assistant table gets the whole width and
	 *    a toolbar under either turn lines up with the column edge.
	 *
	 * 6. NO `is-user:dark`. Upstream flips the user bubble to the dark palette to get contrast
	 *    on `bg-secondary`. The kit's `secondary` / `secondary-foreground` pair is walked for both
	 *    modes, so the bubble takes the pair and flips nothing.
	 *
	 * 7. THE FENCED CODE IS THE HOUSE `CodeBlock`, with a download button when the fence names a
	 *    file. Upstream hands fences to Streamdown's Shiki renderer; `message-response.svelte`
	 *    says why the kit's own block is the better trade here.
	 */
	let {
		ref = $bindable(null),
		from,
		class: className,
		children,
		...restProps
	}: MessageRootProps = $props();

	const role = $derived(resolveMessageRole(from));

	setMessageContext(new MessageState({ getRole: () => role }));
</script>

<div
	bind:this={ref}
	data-slot="message"
	data-from={role}
	class={cn(messageVariants({ from: role }), className)}
	{...restProps}
>
	{@render children?.()}
</div>
