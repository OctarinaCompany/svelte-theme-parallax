<script lang="ts">
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Conversation from "$lib/components/ui/conversation/index.js";
	import { messagesToMarkdown } from "$lib/components/ui/conversation/index.js";
	import * as Status from "$lib/components/ui/status/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { TextGradient } from "$lib/components/ui/text-gradient/index.js";
	import { AI_CHAT_STARTERS, AI_CHAT_TRANSCRIPT, type AiChatMessage } from "$lib/data/ai-chat.js";
	import { href } from "$lib/hooks/route.svelte.js";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";
	import PlayIcon from "@lucide/svelte/icons/play";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";

	/**
	 * The Conversation component page.
	 *
	 * The transcript is rendered with plain markup on purpose — a `bg-secondary` bubble for the
	 * reader's turns, pre-wrapped text for the assistant's — because this page documents the
	 * VIEWPORT, not the message. The Markdown in the assistant's answer therefore shows as
	 * Markdown; the Message page is where it renders.
	 */

	/** The first `true` never fires the callback, so the badge starts where the state does. */
	let atBottom = $state(true);

	/**
	 * The streaming sample. `structuredClone` because `$state` proxies write THROUGH to the object
	 * they wrap — a seed taken straight from `AI_CHAT_TRANSCRIPT` would have the appended words
	 * land in the shared demo data. The short closing exchange is the seed rather than the whole
	 * transcript so the viewport starts without overflow and the pin is seen to take hold.
	 */
	function seedStream(): AiChatMessage[] {
		return structuredClone(AI_CHAT_TRANSCRIPT.slice(2));
	}

	const STREAM_QUESTION = "Why should a chat viewport follow the reply as it streams in?";

	const STREAM_REPLY =
		"Because the reader who is at the bottom is reading the newest words, and every token that arrives lands just below the last one they saw. If the viewport stayed put, the text would grow out of sight and the reader would have to chase it — scroll, read a line, scroll again — for the whole length of the answer. Following the bottom keeps the newest line in view for as long as the reader wants it there. The moment they scroll up to re-read something, the pin lets go: nothing is worse than a page that drags you back down while you are still reading. Scrolling back to the bottom, or pressing the button, hands the viewport the pin again.";

	let streamMessages = $state<AiChatMessage[]>(seedStream());
	let streaming = $state(false);
	let streamTimer: ReturnType<typeof setInterval> | undefined;

	function stopStream(): void {
		if (streamTimer !== undefined) clearInterval(streamTimer);
		streamTimer = undefined;
		streaming = false;
	}

	/** Appends a question and an empty reply, then grows the reply one word every 60ms. */
	function startStream(): void {
		if (streaming) return;
		const words = STREAM_REPLY.split(" ");
		const id = `stream-${Date.now()}`;
		streamMessages.push(
			{ id: `${id}-user`, role: "user", parts: [{ type: "text", text: STREAM_QUESTION }] },
			{ id, role: "assistant", parts: [{ type: "text", text: "" }] },
		);
		streaming = true;
		let index = 0;
		streamTimer = setInterval(() => {
			const part = streamMessages.at(-1)?.parts[0];
			if (!part || part.type !== "text" || index >= words.length) {
				stopStream();
				return;
			}
			part.text += (index === 0 ? "" : " ") + words[index];
			index += 1;
			if (index >= words.length) stopStream();
		}, 60);
	}

	function resetStream(): void {
		stopStream();
		streamMessages = seedStream();
	}

	// A timer that outlives the page would keep writing to state nobody renders.
	$effect(() => () => stopStream());

	/** The empty-state sample: a starter becomes the first turn, and the empty state gives way. */
	let starterMessages = $state<AiChatMessage[]>([]);

	function ask(starter: string): void {
		starterMessages.push(
			{
				id: `starter-${starterMessages.length}`,
				role: "user",
				parts: [{ type: "text", text: starter }],
			},
			{
				id: `starter-${starterMessages.length + 1}`,
				role: "assistant",
				parts: [
					{
						type: "text",
						text: "This page renders the viewport, not the model — but the empty state has done its job and stepped aside.",
					},
				],
			},
		);
	}

	const transcriptMarkdown = messagesToMarkdown(AI_CHAT_TRANSCRIPT);

	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description:
				"Bindable reference to the outer anchor — the element the scroll button positions against, not the one that scrolls.",
		},
		{
			prop: "viewportRef",
			type: "HTMLDivElement | null",
			default: "null",
			description:
				'Bindable reference to the inner scrolling element, the one carrying `role="log"`, `tabindex`, `aria-live` and the scrollbar. An element reference like `ref`, so it has no change callback.',
		},
		{
			prop: "initial",
			type: "ScrollBehavior",
			default: "'smooth'",
			description:
				"How the viewport reaches the bottom when it mounts. `prefers-reduced-motion: reduce` overrides it to `instant`.",
		},
		{
			prop: "resize",
			type: "ScrollBehavior",
			default: "'smooth'",
			description:
				"How the viewport follows content that grows while the reader is at the bottom — a streamed token, an appended message, a viewport that shrank. Not consulted once the reader has scrolled up. `prefers-reduced-motion: reduce` overrides it to `instant`.",
		},
		{
			prop: "offset",
			type: "number",
			default: "16",
			description:
				"How many pixels short of the bottom still count as being at the bottom — the band inside which the pin holds and the scroll button hides. A negative value is read as `0`.",
		},
		{
			prop: "live",
			type: "'off' | 'polite'",
			default: "'off'",
			description:
				"The viewport's `aria-live`. `off` announces nothing, a deliberate override of `role=\"log\"`'s implicit `polite`, because a streamed reply would announce every token; `polite` announces additions once the reader is idle and suits a log that appends whole messages. Any other runtime value normalises to `off`.",
		},
		{
			prop: "onAtBottomChange",
			type: "(atBottom: boolean) => void",
			default: "—",
			description:
				"Fired when the reader enters or leaves the bottom band. Never fires for the initial `true`, and never twice for the same value. The value is not bindable — the component is its only writer; read it here or from `getConversationContext().atBottom`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged onto the outer anchor. The root is `relative min-h-0 overflow-hidden` and takes its height from outside — `flex-1` in a flex column, or an `h-*` — because a root that grows with its content never scrolls and so never pins. `flex-1` is not baked in, unlike upstream: in a flex column it would override any `h-*` given here.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Rendered inside the viewport. `Conversation.Content`, then `Conversation.ScrollButton` as its sibling — the button escapes the viewport's clip because its containing block is the outer anchor.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Every other attribute and DOM handler is spread onto the outer anchor, not onto the log — an `aria-label` for the log goes through `viewportRef`.",
		},
	];

	const contentProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, over `flex min-h-full flex-col gap-8 p-4`. `min-h-full` is what lets an empty state centre itself; a transcript taller than the viewport is unaffected.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The messages, in order.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const scrollButtonProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				"Bindable reference to the button. `null` whenever the button is not rendered — which is whenever the reader is at the bottom.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "'outline'",
			description: "Forwarded to `Button`.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'icon'",
			description: "Forwarded to `Button`.",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler<HTMLButtonElement>",
			default: "—",
			description:
				"Runs before the scroll. `preventDefault()` on the event cancels it — the button then does nothing of its own.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				'Merged onto the positioned wrapper (stamped `conversation-scroll-button-anchor`), over `absolute bottom-4 left-1/2 -translate-x-1/2` — so `class="bottom-8"` or `class="right-4 left-auto translate-x-0"` moves the button. The button itself is fixed at `rounded-full`; its look is set through `variant` and `size`.',
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Replaces the down-arrow icon.",
		},
		{
			prop: "...restProps",
			type: "Omit<ButtonProps, 'href'>",
			default: "—",
			description:
				"Every other Button prop and DOM handler, spread onto the button last. `aria-label` defaults to “Scroll to bottom” only when `children` is absent — visible text names the button itself (WCAG 2.5.3); `href` is omitted because the part is a command, never a link.",
		},
	];

	const emptyStateProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered `Empty.Root`.",
		},
		{
			prop: "title",
			type: "string",
			default: "'No messages yet'",
			description: "The heading. Not rendered when `children` is supplied.",
		},
		{
			prop: "description",
			type: "string",
			default: "'Start a conversation to see messages here'",
			description:
				"The line under the heading. An empty string renders no description element at all. Not rendered when `children` is supplied.",
		},
		{
			prop: "icon",
			type: "Snippet",
			default: "—",
			description:
				"Rendered above the heading inside `Empty.Media`'s icon tile — a 40px muted square that sizes an unsized SVG to 24px. Nothing is rendered without it. Ignored when `children` is supplied.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, over `Empty.Root`'s classes plus `size-full gap-3 p-8`. `chat.tsx` passes `size-auto p-0` to sit it inside a wrapper of its own.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"REPLACES the default content: with it, `icon`, `title` and `description` are not rendered at all. Use it for a fully custom layout.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const downloadProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the button.",
		},
		{
			prop: "messages",
			type: "readonly ConversationMessage[]",
			default: "—",
			description:
				'The transcript to export — anything with a `role` and a `parts` list, an AI SDK `UIMessage` included. Only parts whose `type` is `"text"` are written; tool, reasoning and file parts are skipped. An empty list downloads an empty file.',
		},
		{
			prop: "filename",
			type: "string",
			default: "'conversation.md'",
			description:
				"The name the browser saves under. Path separators become `-`, reserved punctuation is stripped, and a name left empty falls back to the default.",
		},
		{
			prop: "formatMessage",
			type: "(message: ConversationMessage, index: number) => string",
			default: "—",
			description:
				"Replaces the per-message rendering. The default writes `## User` / `## Assistant` / `## System`, a blank line, then the message's text; messages are joined with a blank line either way.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "'outline'",
			description: "Forwarded to `Button`.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'icon-sm'",
			description: "Forwarded to `Button`. Pass a text size and `children` for a labelled button.",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler<HTMLButtonElement>",
			default: "—",
			description: "Runs before the download. `preventDefault()` on the event cancels it.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Replaces the download icon.",
		},
		{
			prop: "...restProps",
			type: "Omit<ButtonProps, 'href'>",
			default: "—",
			description:
				"Every other Button prop and DOM handler, spread last. `aria-label` defaults to “Download conversation” only when `children` is absent — visible text names the button itself (WCAG 2.5.3).",
		},
	];

	const stateMembers: PropRow[] = [
		{
			prop: "atBottom",
			type: "boolean",
			default: "true",
			description:
				"Whether the reader is within `offset` of the bottom, and therefore whether growth is followed. Read-only; starts `true` because nothing is known to overflow yet.",
		},
		{
			prop: "viewport",
			type: "HTMLElement | null",
			default: "null",
			description: "The element being observed — `null` before `observe()` and after `destroy()`.",
		},
		{
			prop: "offset",
			type: "number",
			default: "—",
			description: "The root's `offset`, clamped at `0`.",
		},
		{
			prop: "observe(viewport)",
			type: "(viewport: HTMLElement) => () => void",
			default: "—",
			description:
				"Start following an element: a `scroll` listener plus a `ResizeObserver` on the element and each of its children. Scrolls to the bottom with the `initial` behaviour and returns the teardown. Replaces any element observed before; a no-op returning a no-op without a `window`.",
		},
		{
			prop: "scrollToBottom(behavior?)",
			type: "(behavior?: ScrollBehavior) => void",
			default: "'smooth'",
			description:
				"Scroll to the bottom and pin there. `instant` under reduced motion whatever was asked; a no-op before `observe()`. Sets `atBottom` to `true` immediately rather than on arrival, so growth during the animation re-targets the bottom.",
		},
		{
			prop: "destroy()",
			type: "() => void",
			default: "—",
			description: "Stop observing and clear any pending timer. Idempotent.",
		},
	];

	const helpers: PropRow[] = [
		{
			prop: "messagesToMarkdown",
			type: "(messages: readonly ConversationMessage[], formatMessage?) => string",
			default: "—",
			description:
				"The document `Conversation.Download` writes: every message through `formatMessage` (default `formatConversationMessage`), joined with a blank line.",
		},
		{
			prop: "formatConversationMessage",
			type: "(message: ConversationMessage) => string",
			default: "—",
			description:
				"`## Role`, a blank line, then the message's text. A heading per turn rather than upstream's `**Role:**` prefix, so a table or a fence in the answer still parses.",
		},
		{
			prop: "conversationMessageText",
			type: "(message: ConversationMessage) => string",
			default: "—",
			description: 'The `text` of every `type: "text"` part, concatenated.',
		},
		{
			prop: "resolveConversationLiveMode",
			type: "(value?: string) => 'off' | 'polite'",
			default: "—",
			description: "Normalises an untyped value to a live mode; anything unknown is `off`.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "Conversation", values: "conversation" },
		{
			attribute: "[data-at-bottom]",
			part: "Conversation",
			values: "present while the reader is within `offset` of the bottom; absent otherwise",
		},
		{
			attribute: "[data-slot]",
			part: "Conversation (viewport)",
			values: 'conversation-viewport — the `role="log"` element `viewportRef` points at',
		},
		{
			attribute: "[aria-live]",
			part: "Conversation (viewport)",
			values: "off | polite — whatever `live` resolved to",
		},
		{ attribute: "[data-slot]", part: "Conversation.Content", values: "conversation-content" },
		{
			attribute: "[data-slot]",
			part: "Conversation.ScrollButton",
			values:
				"conversation-scroll-button on the button; conversation-scroll-button-anchor on the positioned wrapper",
		},
		{
			attribute: "[data-slot]",
			part: "Conversation.EmptyState",
			values: "conversation-empty-state",
		},
		{ attribute: "[data-slot]", part: "Conversation.Download", values: "conversation-download" },
	];

	const keyboard = [
		{
			keys: "Tab",
			description:
				"Focuses the log — the viewport is a tab stop, with the kit's inset focus ring, so a keyboard reader can reach a transcript that contains nothing else to focus.",
		},
		{
			keys: "ArrowUp / ArrowDown",
			description:
				"Scrolls the focused log by a line. The first ArrowUp away from the bottom releases the pin; scrolling back within `offset` of the bottom takes it again.",
		},
		{
			keys: "PageUp / PageDown, Space / Shift + Space",
			description: "Scrolls the focused log by a page, with the same pin rules.",
		},
		{
			keys: "Home / End",
			description: "The top or the bottom of the log. `End` re-pins.",
		},
		{
			keys: "Enter / Space on the scroll button",
			description: "Scrolls to the bottom and pins; the button then disappears.",
		},
	];
</script>

<DocPage title="Conversation">
	{#snippet subtitle()}
		The scrolling transcript of a chat: a viewport that keeps the newest content in view while the
		reader is at the bottom, lets go the moment they scroll up, and offers a button back. Renders no
		messages of its own — for those, see the
		<a class="text-primary underline underline-offset-3" href={href("/components/message")}
			>Message</a
		> page.
	{/snippet}

	<DocSection title="Transcript">
		{#snippet blurb()}
			The viewport opens at the bottom, as a chat does. Scroll up and the button appears; the badge
			follows <code>onAtBottomChange</code>. The transcript is plain markup here — a bubble for the
			reader, pre-wrapped text for the assistant — because this page documents the viewport.
		{/snippet}
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-3">
				<Status.Root variant={atBottom ? "info" : "default"}>
					<Status.Indicator pulse={false} />
					<Status.Label>{atBottom ? "At the bottom" : "Scrolled up"}</Status.Label>
				</Status.Root>
			</div>
			<Card.Root class="h-96 py-0">
				<Card.Content class="flex h-full min-h-0 flex-col px-0">
					<Conversation.Root class="flex-1" onAtBottomChange={(value) => (atBottom = value)}>
						<Conversation.Content>
							{#each AI_CHAT_TRANSCRIPT as message (message.id)}
								{#each message.parts as part, index (index)}
									{#if part.type === "text"}
										{#if message.role === "user"}
											<div class="ml-auto w-fit rounded-lg bg-secondary px-4 py-3 text-sm">
												{part.text}
											</div>
										{:else}
											<div class="text-sm whitespace-pre-wrap">{part.text}</div>
										{/if}
									{/if}
								{/each}
							{/each}
						</Conversation.Content>
						<Conversation.ScrollButton />
					</Conversation.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<DocSection title="Streaming">
		{#snippet blurb()}
			A reply grows one word every 60ms and the viewport follows it. Scroll up while it streams and
			the viewport stays where you put it; press the button, or scroll back down, and it follows
			again. The label under the reply is a <code>TextGradient</code> inside a
			<code>role="status"</code> span.
		{/snippet}
		<div class="flex flex-col gap-4">
			<div class="flex flex-wrap items-center gap-2">
				<Button size="sm" onclick={startStream} disabled={streaming}>
					<PlayIcon data-icon="inline-start" />
					Stream a reply
				</Button>
				<Button size="sm" variant="outline" onclick={resetStream}>
					<RotateCcwIcon data-icon="inline-start" />
					Reset
				</Button>
			</div>
			<Card.Root class="h-96 py-0">
				<Card.Content class="flex h-full min-h-0 flex-col px-0">
					<Conversation.Root class="flex-1">
						<Conversation.Content>
							{#each streamMessages as message (message.id)}
								{#each message.parts as part, index (index)}
									{#if part.type === "text"}
										{#if message.role === "user"}
											<div class="ml-auto w-fit rounded-lg bg-secondary px-4 py-3 text-sm">
												{part.text}
											</div>
										{:else}
											<div class="text-sm whitespace-pre-wrap">{part.text}</div>
										{/if}
									{/if}
								{/each}
							{/each}
							{#if streaming}
								<span role="status" class="text-sm">
									<TextGradient duration={1.5}>Claude is thinking…</TextGradient>
								</span>
							{/if}
						</Conversation.Content>
						<Conversation.ScrollButton />
					</Conversation.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<DocSection title="Empty state">
		{#snippet blurb()}
			Before the first message, <code>Conversation.EmptyState</code> — built from the kit's own
			<a class="text-primary underline underline-offset-3" href={href("/components/empty")}>Empty</a
			>
			— and a strip of starters beside it, the shape <code>chat.tsx</code> renders. Pick one and the empty
			state gives way to the first turn.
		{/snippet}
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-2">
				<Button
					size="sm"
					variant="outline"
					onclick={() => (starterMessages = [])}
					disabled={starterMessages.length === 0}
				>
					Clear
				</Button>
			</div>
			<Card.Root class="h-96 py-0">
				<Card.Content class="flex h-full min-h-0 flex-col px-0">
					<Conversation.Root class="flex-1">
						<Conversation.Content>
							{#if starterMessages.length === 0}
								<div class="flex size-full flex-1 flex-col items-center justify-center gap-6 p-6">
									<Conversation.EmptyState
										class="size-auto p-0"
										title="Start a conversation"
										description="Pick a starter, or type a question of your own."
									>
										{#snippet icon()}
											<MessageSquareIcon />
										{/snippet}
									</Conversation.EmptyState>
									<div class="flex max-w-2xl flex-wrap justify-center gap-2">
										{#each AI_CHAT_STARTERS as starter (starter)}
											<Button
												size="sm"
												variant="outline"
												class="h-auto py-1.5 text-left whitespace-normal"
												onclick={() => ask(starter)}
											>
												{starter}
											</Button>
										{/each}
									</div>
								</div>
							{:else}
								{#each starterMessages as message (message.id)}
									{#each message.parts as part, index (index)}
										{#if part.type === "text"}
											{#if message.role === "user"}
												<div class="ml-auto w-fit rounded-lg bg-secondary px-4 py-3 text-sm">
													{part.text}
												</div>
											{:else}
												<div class="text-sm whitespace-pre-wrap">{part.text}</div>
											{/if}
										{/if}
									{/each}
								{/each}
							{/if}
						</Conversation.Content>
						<Conversation.ScrollButton />
					</Conversation.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<DocSection title="Download">
		{#snippet blurb()}
			<code>Conversation.Download</code> writes the transcript as Markdown — a heading per turn, text
			parts only — through the same routine the code block's download button uses. It is a toolbar control
			the caller places, not a corner overlay. Below it, the file the demo transcript produces.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div class="flex flex-wrap items-center gap-2">
					<Conversation.Download messages={AI_CHAT_TRANSCRIPT} />
					<Conversation.Download
						messages={AI_CHAT_TRANSCRIPT}
						size="sm"
						filename="claude-models.md"
					>
						<DownloadIcon data-icon="inline-start" />
						Download transcript
					</Conversation.Download>
				</div>
				<!--
					A scrolling region with nothing focusable inside it needs a tab stop of its own
					(WCAG 2.1.1; axe `scrollable-region-focusable`), as `code-block-content.svelte` explains.
				-->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<pre
					tabindex={0}
					class="max-h-64 overflow-auto rounded-md bg-muted/50 p-4 font-mono text-xs leading-5 whitespace-pre-wrap text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset">{transcriptMarkdown}</pre>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Conversation</h3>
			<p class="text-sm text-muted-foreground">
				The root. Renders an outer anchor <code>div</code> (position context for the scroll button,
				the element <code>ref</code> and <code>class</code> reach) around the scrolling viewport — a
				focusable <code>div</code> with <code>role="log"</code> that <code>viewportRef</code>
				reaches. Creates the <code>ConversationState</code> every other part reads from context.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each rootProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Conversation.Content</h3>
			<p class="text-sm text-muted-foreground">
				The column the messages stack in. Renders a <code>div</code>; throws outside a root.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each contentProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Conversation.ScrollButton</h3>
			<p class="text-sm text-muted-foreground">
				The way back to the newest message. Renders a round outline <code>Button</code> with a down arrow,
				floating over the bottom edge of the transcript, only while the reader is away from the bottom;
				it rises in through a fade, collapsed to one frame under reduced motion. Throws outside a root.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each scrollButtonProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Conversation.EmptyState</h3>
			<p class="text-sm text-muted-foreground">
				What a transcript shows before its first message. Renders an <code>Empty.Root</code> with a header
				of icon, title and description; reads no context, so it works outside a root too.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each emptyStateProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Conversation.Download</h3>
			<p class="text-sm text-muted-foreground">
				Saves the transcript as a Markdown file. Renders an outline icon <code>Button</code> at the toolbar
				size; reads no context, because the messages come from the caller.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each downloadProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">ConversationState</h3>
			<p class="text-sm text-muted-foreground">
				The object behind the root, published on context and reachable through
				<code>getConversationContext()</code> or <code>useConversation()</code> from any descendant. A
				caller who needs the follow-the-bottom behaviour on an element of their own can construct one
				directly with the getter props and hand it a viewport.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Member</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each stateMembers as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Helpers</h3>
			<p class="text-sm text-muted-foreground">
				Pure functions exported from the barrel, for a caller who wants the Markdown without the
				button.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Export</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each helpers as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Data attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>Part</Table.Head>
								<Table.Head>Values</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (`${row.attribute}-${row.part}`)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.attribute}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.part}</Table.Cell>
									<Table.Cell>{row.values}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard interactions</h3>
			<p class="text-sm text-muted-foreground">
				The viewport is a native scroll container with a tab stop, so the browser supplies the
				scrolling keys; the component only decides what each scroll means for the pin.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Key</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each keyboard as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.keys}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
