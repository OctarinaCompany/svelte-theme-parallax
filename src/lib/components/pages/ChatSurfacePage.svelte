<script lang="ts">
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";
	import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import ThumbsDownIcon from "@lucide/svelte/icons/thumbs-down";
	import ThumbsUpIcon from "@lucide/svelte/icons/thumbs-up";

	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as CodeBlock from "$lib/components/ui/code-block/index.js";
	import * as Conversation from "$lib/components/ui/conversation/index.js";
	import { CopyButton } from "$lib/components/ui/copy-button/index.js";
	import * as Message from "$lib/components/ui/message/index.js";
	import * as PromptInput from "$lib/components/ui/prompt-input/index.js";
	import type { PromptInputMessage } from "$lib/components/ui/prompt-input/index.js";
	import * as Reasoning from "$lib/components/ui/reasoning/index.js";
	import * as Status from "$lib/components/ui/status/index.js";
	import * as Suggestion from "$lib/components/ui/suggestion/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Tool from "$lib/components/ui/tool/index.js";
	import { AI_CHAT_STARTERS, AI_CHAT_TRANSCRIPT, type AiChatPart } from "$lib/data/ai-chat.js";
	import { href, type RoutePath } from "$lib/hooks/route.svelte.js";
	import { isChatGenerating, type ChatStatus, type MessageRole } from "$lib/shared/chat-parts.js";
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";

	/**
	 * Chat surface — the AI chat family assembled into the one screen it was built for.
	 *
	 * A Patterns page ships no component: everything below is composed from published ones, and
	 * the value of the page is the WIRING between them — which element scrolls, where the composer
	 * sits, what the caller has to own. The sections after the demo state those decisions, because
	 * they are the part a reader cannot see by looking at the result.
	 *
	 * NOTHING HERE TALKS TO A MODEL. There is no `fetch`, no transport and no `ai` dependency —
	 * `src/lib/shared/chat-parts.ts` records why the kit declares the SDK's vocabulary structurally
	 * rather than importing it. The reply is a `setInterval` walking a written-down answer, which
	 * is enough to exercise every behaviour the surface has: the viewport's pin, the reasoning
	 * panel's clock, the submit button becoming a stop button. Swap the timer for a transport and
	 * no markup below changes.
	 *
	 * THE SEED IS THE SHARED TRANSCRIPT (`src/lib/data/ai-chat.ts`), the same exchange the
	 * Conversation and Message pages render, so a reader arriving from either recognises it. It is
	 * cloned rather than referenced: `$state` proxies write THROUGH to the object they wrap, and
	 * appended words would otherwise land in the shared demo data.
	 */

	/** One turn of the surface's transcript. */
	type ChatTurn = {
		/**
		 * Stable for the life of the turn, and what the `{#each}` below is keyed by. Nothing else
		 * would do: a turn's text changes on every streamed word and its draft changes under the
		 * pager, so keying by index or by content would destroy and rebuild the turn — losing the
		 * open state of every reasoning panel and tool call above the one being written.
		 */
		id: string;
		role: MessageRole;
		/**
		 * Every answer this turn has produced, oldest first. One, until a regenerate appends
		 * another; `drafts.length > 1` is exactly what puts a pager under the turn.
		 */
		drafts: AiChatPart[][];
		/** Which draft is on screen — the index `Message.Branch` binds to. */
		branch: number;
		/**
		 * Answers a regenerate can still append. Empty on every turn but the seeded one: the page
		 * has no model, so an alternative has to be written down before it can be offered.
		 */
		alternatives: string[];
		/** The reader's verdict on the draft on screen. The page's, not the toolbar's. */
		rating?: "good" | "poor";
	};

	/** Which half of a simulated reply is arriving. */
	type StreamPhase = "reasoning" | "text";

	/**
	 * The alternatives behind the closing answer's pager.
	 *
	 * The seeded turn opens on the SECOND of them, because that is what a regenerate leaves
	 * behind — the newest answer on screen and the earlier one a step back. The third is held in
	 * `alternatives` for the Regenerate button to append.
	 */
	const REGENERATED_ANSWERS = [
		`**Sonnet 5**, if this is a job you run every week. It holds the same 300 pages, costs a fraction of Opus per run, and the two summaries differ mostly on the chapters nobody reads.`,
		`Either fits — 300 pages is roughly 150K tokens, well inside both windows.

- **Opus 5** — keeps a long document coherent across chapters; worth it for a one-off.
- **Sonnet 5** — cheaper per run; the pick once you are summarising a stack of these every week.

Start on Opus, and move down once the prompt has settled.`,
	];

	/** The thought the simulated reply writes before it answers. */
	const SIMULATED_REASONING =
		"There is no model behind this page, so this thought is written down rather than produced. It exists to show the panel opening while the answer is still being written, timing itself, and folding a second after the last word lands.";

	/** The answer the simulated reply writes, Markdown and a downloadable fence included. */
	const SIMULATED_ANSWER = `This reply is a timer walking a written-down answer one word at a time — which is all the surface needs to be exercised end to end.

Everything around it is real: the viewport stayed pinned to the bottom while this grew and lets go the moment you scroll up, the composer keeps its own height below the transcript, the thought above folded itself once it stopped, and this fence is drawn by the house code block, which offers it as a download.

\`\`\`ts chat-surface.ts
// Replace the timer with a transport and nothing in the markup changes.
const reply = await send({ text: draft, files });
\`\`\``;

	/** Milliseconds between two ticks of the simulated reply. */
	const TICK_MS = 55;

	/** Words appended per tick — one at a time is what reads as typing. */
	const WORDS_PER_TICK = 1;

	/** The per-file ceiling on the composer, in bytes. */
	const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;

	const models = [
		{ id: "opus-5", label: "Opus 5" },
		{ id: "sonnet-5", label: "Sonnet 5" },
		{ id: "haiku-4-5", label: "Haiku 4.5" },
	];

	/**
	 * The seeded transcript, cloned out of the shared demo data.
	 *
	 * The closing assistant turn is the one that was regenerated, so the pager is on screen at
	 * rest rather than only after a press — the pattern being shown is what a transcript looks
	 * like once a reader has asked for a second answer, not how to build the button.
	 */
	function seedTurns(): ChatTurn[] {
		return structuredClone(AI_CHAT_TRANSCRIPT).map((message) => {
			const regenerated = message.id === "a2";
			const drafts: AiChatPart[][] = [message.parts];
			if (regenerated) drafts.push([{ type: "text", text: REGENERATED_ANSWERS[0] }]);
			return {
				id: message.id,
				role: message.role,
				drafts,
				branch: drafts.length - 1,
				alternatives: regenerated ? REGENERATED_ANSWERS.slice(1) : [],
			};
		});
	}

	const reducedMotion = useReducedMotion();

	let turns = $state<ChatTurn[]>(seedTurns());
	let status = $state<ChatStatus>("ready");
	let draft = $state("");
	let modelId = $state("opus-5");
	let atBottom = $state(true);
	let attachmentError = $state<string | null>(null);

	/**
	 * Which turn is being written, and which half of it. `null` when nothing is in flight.
	 *
	 * One record rather than a flag per turn: only one reply is ever in flight, and the parts read
	 * it by identity — `Reasoning.Root` gets `isStreaming` while the phase is `reasoning`,
	 * `Message.Response` gets `isAnimating` while it is `text`.
	 */
	let stream = $state<{ turnId: string; phase: StreamPhase } | null>(null);

	let timer: ReturnType<typeof setInterval> | undefined;
	let sequence = 0;

	const busy = $derived(isChatGenerating(status));
	const modelLabel = $derived(models.find((model) => model.id === modelId)?.label ?? "Opus 5");

	/**
	 * The transcript as `Conversation.Download` reads it: one message per turn, carrying the draft
	 * currently on screen. A pager that has walked back to an earlier answer exports that answer,
	 * which is the only reading that matches what the reader is looking at.
	 */
	const transcript = $derived(
		turns.map((turn) => ({ id: turn.id, role: turn.role, parts: turn.drafts[turn.branch] ?? [] })),
	);

	/** The phase this turn is in, or `undefined` when it is not the one being written. */
	function streamingPhase(turn: ChatTurn): StreamPhase | undefined {
		return stream !== null && stream.turnId === turn.id ? stream.phase : undefined;
	}

	/** A draft's text parts, joined — what the copy button puts on the clipboard. */
	function draftText(parts: AiChatPart[]): string {
		return parts
			.filter((part) => part.type === "text")
			.map((part) => part.text)
			.join("\n\n");
	}

	function stopStream(): void {
		if (timer !== undefined) clearInterval(timer);
		timer = undefined;
		stream = null;
		status = "ready";
	}

	/**
	 * Write the reply into the turn `turnId` names, a few words at a time.
	 *
	 * The turn is looked up by id on every tick rather than captured: a reset while a reply is in
	 * flight removes it, and a closure holding the object would keep writing into a turn nothing
	 * renders.
	 *
	 * REDUCED MOTION TAKES THE WHOLE PHASE IN ONE TICK. The blur on each word is already skipped
	 * by `Message.Response` and the viewport's follow is already `instant` inside
	 * `Conversation.Root`, but the transcript would still grow fifty times, and each growth is a
	 * scroll. One tick per phase is one scroll per phase.
	 */
	function runStream(turnId: string): void {
		const reasoningWords = SIMULATED_REASONING.split(" ");
		const answerWords = SIMULATED_ANSWER.split(" ");
		let phase: StreamPhase = "reasoning";
		let index = 0;

		timer = setInterval(() => {
			const turn = turns.find((entry) => entry.id === turnId);
			const parts = turn?.drafts[0];
			const part = parts?.at(-1);
			if (!parts || !part || part.type === "tool") {
				stopStream();
				return;
			}

			status = "streaming";
			const words = phase === "reasoning" ? reasoningWords : answerWords;
			index = Math.min(
				index + (reducedMotion.current ? words.length : WORDS_PER_TICK),
				words.length,
			);
			part.text = words.slice(0, index).join(" ");
			if (index < words.length) return;

			if (phase === "reasoning") {
				// The thought is finished: append the answer part and hand the phase over. The
				// `isStreaming` this drops on `Reasoning.Root` is what stops its clock, writes the
				// duration onto its trigger and arms the fold.
				phase = "text";
				index = 0;
				parts.push({ type: "text", text: "" });
				stream = { turnId, phase };
				return;
			}

			stopStream();
		}, TICK_MS);
	}

	/** Append the reader's turn and an empty assistant turn, then start writing into the second. */
	function ask(text: string, files: string[] = []): void {
		if (busy || (text === "" && files.length === 0)) return;

		sequence += 1;
		const answerId = `a-${sequence}`;
		turns.push(
			{
				id: `u-${sequence}`,
				role: "user",
				drafts: [
					[
						{
							type: "text",
							text: files.length > 0 ? `${text}\n\nAttached: ${files.join(", ")}` : text,
						},
					],
				],
				branch: 0,
				alternatives: [],
			},
			{
				id: answerId,
				role: "assistant",
				drafts: [[{ type: "reasoning", text: "" }]],
				branch: 0,
				alternatives: [],
			},
		);

		status = "submitted";
		stream = { turnId: answerId, phase: "reasoning" };
		runStream(answerId);
	}

	/**
	 * The composer's handler.
	 *
	 * ONLY THE FILE NAMES ARE KEPT. Each attachment's `url` is an object URL the composer minted
	 * and revokes as soon as this returns — `PromptInputMessage.files` states the rule — so a
	 * surface that wanted to show a thumbnail would mint its own from `file`, which outlives the
	 * revoke, and revoke that when the bubble goes.
	 */
	function send(message: PromptInputMessage): void {
		attachmentError = null;
		ask(
			message.text.trim(),
			message.files.map((file) => file.filename ?? file.file.name),
		);
	}

	/** Append the next written-down alternative and step the pager onto it. */
	function regenerate(turn: ChatTurn): void {
		const next = turn.alternatives.shift();
		if (next === undefined) return;
		turn.drafts.push([{ type: "text", text: next }]);
		turn.branch = turn.drafts.length - 1;
		turn.rating = undefined;
	}

	function rate(turn: ChatTurn, value: "good" | "poor"): void {
		turn.rating = turn.rating === value ? undefined : value;
	}

	function reset(): void {
		stopStream();
		turns = [];
		draft = "";
		attachmentError = null;
	}

	// A timer that outlived the page would keep writing to state nobody renders.
	$effect(() => () => stopStream());

	/** The layout the section below explains, with everything that is not structure removed. */
	const LAYOUT_SKELETON = `<Card.Root class="h-[36rem] gap-0 py-0">      <!-- the flex column, with a height -->
  <Card.Header>…</Card.Header>                 <!-- 60px, above the scroller -->

  <Conversation.Root class="flex-1">          <!-- min-h-0 is baked in; flex-1 is yours -->
    <Conversation.Content>…turns…</Conversation.Content>
    <Conversation.ScrollButton />             <!-- sibling of Content, not inside it -->
  </Conversation.Root>

  <div class="border-t p-4">                  <!-- the composer, outside the scroller -->
    <PromptInput.Root …>…</PromptInput.Root>
  </div>
</Card.Root>`;

	type PinRow = { moment: string; effect: string };

	const pinRows: PinRow[] = [
		{
			moment: "A turn is appended",
			effect:
				"`Conversation.Content` grows, and the root's ResizeObserver — which watches the viewport's CHILDREN, because the viewport's own box never changes — scrolls to the new bottom while the reader is inside the band.",
		},
		{
			moment: "A word lands",
			effect:
				"The same path, once per tick. The pin is a consequence of the content resizing; this page calls nothing to produce it.",
		},
		{
			moment: "The reader scrolls up",
			effect:
				"A scroll whose `scrollTop` went down can only be the reader, so the root releases the pin and mounts `Conversation.ScrollButton`. The reply keeps arriving; it just stops dragging the viewport.",
		},
		{
			moment: "The reader returns to the bottom",
			effect:
				"Scrolling back into the band, or pressing the button, hands the pin back. `onAtBottomChange` fires and the badge in the card header follows it.",
		},
		{
			moment: "`prefers-reduced-motion: reduce`",
			effect:
				"`initial` and `resize` resolve to `instant` inside the root, `Message.Response` drops the per-word blur, and this page delivers each half of the reply in one tick — one growth, one scroll, instead of fifty.",
		},
		{
			moment: "Enter while the reply streams",
			effect:
				"Refused by `PromptInput.Textarea`: `PromptInput.Submit` is a stop button while the status is generating, so there is no submission to request. The composer needs no `onkeydown` veto here.",
		},
	];

	type OwnerRow = { concern: string; owner: string; note: string };

	const ownerRows: OwnerRow[] = [
		{
			concern: "The transcript, its ids and its order",
			owner: "The page",
			note: "An array of `$state`. Nothing in the family stores messages — `Conversation.Root` is a viewport and `Message.Root` is one turn.",
		},
		{
			concern: "Which draft of a regenerated answer is on screen",
			owner: "Shared",
			note: "`Message.Branch` holds the index and the pager steps it; the page binds it so the export and the copy button read the same draft the reader sees.",
		},
		{
			concern: "Whether the viewport follows the bottom",
			owner: "`Conversation.Root`",
			note: "Published as `data-at-bottom` and through `onAtBottomChange`; the page only reads it.",
		},
		{
			concern: "The draft text",
			owner: "Shared",
			note: "`value` is bindable on `PromptInput.Root`, which is what lets a starter chip write into it. A submission clears it after `onSubmit` succeeds.",
		},
		{
			concern: "The attachment list and its object URLs",
			owner: "`PromptInput.Root`",
			note: "It mints each `blob:` URL and revokes it on remove, on clear and on destroy. A handler keeps `file`, never `url`.",
		},
		{
			concern: "Whether the send button is a stop button",
			owner: "`PromptInput.Submit`",
			note: "Derived from the `status` the page sets — the page owns the status, the button owns what it looks like.",
		},
		{
			concern: "When a reasoning panel folds, and what it says it took",
			owner: "`Reasoning.Root`",
			note: "It times the stream it was handed through `isStreaming` and folds a second after it ends. The seeded turns pass a recorded `duration` instead.",
		},
		{
			concern: "Whether a tool call's body is open",
			owner: "`Tool.Root`",
			note: "A collapsible with the call's identity on it; the page passes `type`, `state` and the two payloads.",
		},
		{
			concern: "Markdown, fenced code and the download beside it",
			owner: "`Message.Response`",
			note: "Rendered by svelte-streamdown, with fences drawn by the house code block — a fence whose info string reads `csv models.csv` is labelled `csv` and offers `models.csv` as a download.",
		},
		{
			concern: "The rating under a turn",
			owner: "The page",
			note: "`Message.Action` is a named icon button and nothing else; the pressed state and what it means are the caller's.",
		},
	];

	type PieceRow = { title: string; path: RoutePath; used: string };

	const pieces: PieceRow[] = [
		{
			title: "Conversation",
			path: "/components/conversation",
			used: "Root, Content, ScrollButton, EmptyState and Download — the viewport, the column, the jump-back button, the pre-first-message state and the Markdown export.",
		},
		{
			title: "Message",
			path: "/components/message",
			used: "Root, Content, Response, Toolbar, Actions and Action for a turn; Branch, BranchContent, BranchSelector, BranchPrevious, BranchNext and BranchPage for the pager.",
		},
		{
			title: "Prompt input",
			path: "/components/prompt-input",
			used: "Root, Attachments, Body, Textarea, Footer, Tools, Select, Submit, and the ActionMenu trio with ActionAddAttachments.",
		},
		{
			title: "Suggestion",
			path: "/components/suggestion",
			used: "Root and Item, wrapped, as the starters beside the empty state.",
		},
		{
			title: "Reasoning",
			path: "/components/reasoning",
			used: "Root, Trigger and Content — replayed with a recorded duration on the seeded turn, timed live on the simulated one.",
		},
		{
			title: "Tool",
			path: "/components/tool",
			used: "Root, Header, Content, Input and Output for the search the seeded answer ran.",
		},
		{
			title: "Card",
			path: "/components/card",
			used: "Root, Header and Title — the frame, with `gap-0 py-0` so the header's rule and the composer's own border are the only lines inside it.",
		},
		{
			title: "Code block",
			path: "/components/code-block",
			used: "Reached indirectly: every fence in an answer and every string payload on a tool call is drawn by it, download button included.",
		},
		{
			title: "Empty",
			path: "/components/empty",
			used: "Reached indirectly: `Conversation.EmptyState` is built from it, so an empty chat looks like every other empty surface in the kit.",
		},
	];
</script>

<!--
	One assistant answer: the parts it is made of, then the toolbar under them.

	A SNIPPET WITH PARAMETERS rather than markup inline in the loop, because the branch pager needs
	to render the same thing at three different indices — see the `{#snippet}` trio below.
-->
{#snippet answer(turn: ChatTurn, index: number)}
	{@const parts = turn.drafts[index] ?? []}
	<Message.Root from="assistant">
		<Message.Content>
			{#each parts as part, partIndex (partIndex)}
				{#if part.type === "reasoning"}
					<Reasoning.Root
						duration={part.durationSeconds}
						isStreaming={streamingPhase(turn) === "reasoning"}
					>
						<Reasoning.Trigger />
						<Reasoning.Content content={part.text} />
					</Reasoning.Root>
				{:else if part.type === "tool"}
					<!-- The transcript carries the name; `Tool.Root` wants the AI SDK's part `type`,
						which for a declared tool is `tool-<name>`. -->
					<Tool.Root type={`tool-${part.toolName}`} state={part.state}>
						<Tool.Header />
						<Tool.Content>
							<Tool.Input input={part.input} />
							<Tool.Output output={part.output} errorText={part.errorText} />
						</Tool.Content>
					</Tool.Root>
				{:else}
					<Message.Response content={part.text} isAnimating={streamingPhase(turn) === "text"} />
				{/if}
			{/each}
		</Message.Content>
		<Message.Toolbar>
			<Message.Actions>
				<CopyButton value={draftText(parts)} variant="ghost" size="icon-sm" />
				<Message.Action
					label="Regenerate"
					tooltip={turn.alternatives.length > 0
						? "Regenerate this answer"
						: "No further answer is written down for this turn"}
					disabled={busy || turn.alternatives.length === 0}
					onclick={() => regenerate(turn)}
				>
					<RefreshCwIcon />
				</Message.Action>
				<Message.Action
					label="Good answer"
					tooltip="Good answer"
					aria-pressed={turn.rating === "good"}
					onclick={() => rate(turn, "good")}
				>
					<ThumbsUpIcon />
				</Message.Action>
				<Message.Action
					label="Poor answer"
					tooltip="Poor answer"
					aria-pressed={turn.rating === "poor"}
					onclick={() => rate(turn, "poor")}
				>
					<ThumbsDownIcon />
				</Message.Action>
			</Message.Actions>
			<span class="text-xs text-muted-foreground">
				{turn.rating ? `Rated ${turn.rating} · ` : ""}{modelLabel}
			</span>
		</Message.Toolbar>
	</Message.Root>
{/snippet}

<DocPage title="Chat surface">
	{#snippet subtitle()}
		The
		<a class="text-primary underline underline-offset-3" href={href("/components/group/ai-chat")}
			>AI chat</a
		>
		family assembled into the screen it was built for: a scrolling transcript, turns carrying reasoning
		and tool calls, a pager over a regenerated answer, starters before the first message, and a composer
		that keeps its own height underneath. This page ships no component — it is the wiring, and the sections
		after the demo state the decisions a reader has to copy.
	{/snippet}

	<DocSection title="The surface">
		{#snippet blurb()}
			Send something. The reply is a timer walking a written-down answer — there is no model behind
			this page and no request leaves it — but everything around the reply is the real thing: the
			viewport follows the bottom and lets go when you scroll up, the thought above the answer times
			itself and folds, the send button becomes a stop button, and the <code>+</code> menu attaches files.
			Clear the chat to reach the empty state and its starters.
		{/snippet}
		<Card.Root class="h-[36rem] gap-0 py-0">
			<Card.Header class="flex flex-row items-center justify-between gap-3">
				<div class="flex min-w-0 items-center gap-3">
					<Card.Title>Assistant</Card.Title>
					<Status.Root variant={atBottom ? "info" : "default"}>
						<Status.Indicator pulse={busy && atBottom} />
						<Status.Label>{atBottom ? "Following" : "Scrolled up"}</Status.Label>
					</Status.Root>
				</div>
				<div class="flex shrink-0 items-center gap-1">
					<Conversation.Download
						messages={transcript}
						filename="chat-surface.md"
						variant="ghost"
						size="icon-sm"
						disabled={turns.length === 0}
					/>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Clear the chat"
						disabled={turns.length === 0}
						onclick={reset}
					>
						<RotateCcwIcon />
					</Button>
				</div>
			</Card.Header>

			<!--
				THE SCROLL CONTAINER. `flex-1` is the caller's job (the root deliberately does not bake
				it in, or an `h-*` given here could never win on the main axis); `min-h-0` is already
				inside the root, and without it this flex item would refuse to shrink below its content
				and the PAGE would scroll instead of the transcript.
			-->
			<Conversation.Root class="flex-1" onAtBottomChange={(value) => (atBottom = value)}>
				<Conversation.Content>
					{#if turns.length === 0}
						<!-- `Conversation.Content` is `min-h-full`, which is what lets this centre in a
							viewport with nothing else in it. -->
						<div class="flex size-full flex-1 flex-col items-center justify-center gap-6 p-2">
							<Conversation.EmptyState
								class="size-auto p-0"
								title="Start a conversation"
								description="Pick a starter, or type a question of your own."
							>
								{#snippet icon()}
									<MessageSquareIcon />
								{/snippet}
							</Conversation.EmptyState>
							<Suggestion.Root layout="wrap" class="max-w-xl justify-center">
								{#each AI_CHAT_STARTERS as starter (starter)}
									<Suggestion.Item
										suggestion={starter}
										class="h-auto py-1.5 text-left whitespace-normal"
										onSelect={(text) => ask(text)}
									/>
								{/each}
							</Suggestion.Root>
						</div>
					{:else}
						{#each turns as turn (turn.id)}
							{#if turn.role === "user"}
								<Message.Root from="user">
									<Message.Content>
										<Message.Response content={draftText(turn.drafts[0] ?? [])} />
									</Message.Content>
								</Message.Root>
							{:else if turn.drafts.length > 1}
								<!--
									`Message.BranchContent` takes an ARRAY of snippets — Svelte cannot count
									children the way the React original does — and an array cannot be built
									from a loop. So the page declares one snippet per possible draft and
									slices the list to the drafts this turn actually has, which is why
									`alternatives` is a written-down list rather than an open tap.

									They sit inside a plain `<div>` on purpose: a `{#snippet}` written
									directly inside a component becomes a PROP of that component.
								-->
								<div class="flex flex-col">
									{#snippet firstAnswer()}
										{@render answer(turn, 0)}
									{/snippet}
									{#snippet secondAnswer()}
										{@render answer(turn, 1)}
									{/snippet}
									{#snippet thirdAnswer()}
										{@render answer(turn, 2)}
									{/snippet}
									<Message.Branch bind:branch={turn.branch} loop={false}>
										<Message.BranchContent
											branches={[firstAnswer, secondAnswer, thirdAnswer].slice(
												0,
												turn.drafts.length,
											)}
										/>
										<Message.BranchSelector>
											<Message.BranchPrevious />
											<Message.BranchPage label="Answer" />
											<Message.BranchNext />
										</Message.BranchSelector>
									</Message.Branch>
								</div>
							{:else}
								{@render answer(turn, 0)}
							{/if}
						{/each}
					{/if}
				</Conversation.Content>
				<Conversation.ScrollButton />
			</Conversation.Root>

			<!-- The composer is a SIBLING of the scroller, not a child of it: it keeps its height
				whatever the transcript does, and it never scrolls out of reach. -->
			<div class="flex flex-col gap-2 border-t p-4">
				<PromptInput.Root
					bind:value={draft}
					accept="image/*,.pdf,.csv"
					multiple
					maxFiles={3}
					maxFileSize={MAX_ATTACHMENT_SIZE}
					onError={(error) => (attachmentError = error.message)}
					onSubmit={send}
				>
					<PromptInput.Attachments />
					<PromptInput.Body>
						<PromptInput.Textarea placeholder="Ask anything… (Shift+Enter for a new line)" />
					</PromptInput.Body>
					<PromptInput.Footer>
						<PromptInput.Tools>
							<PromptInput.ActionMenu>
								<PromptInput.ActionMenuTrigger tooltip="Add photos or files" />
								<PromptInput.ActionMenuContent>
									<PromptInput.ActionAddAttachments />
									<PromptInput.ActionMenuItem disabled={turns.length === 0} onSelect={reset}>
										<RotateCcwIcon />
										Clear the chat
									</PromptInput.ActionMenuItem>
								</PromptInput.ActionMenuContent>
							</PromptInput.ActionMenu>
							<PromptInput.Select bind:value={modelId}>
								<PromptInput.SelectTrigger aria-label="Model: {modelLabel}">
									{modelLabel}
								</PromptInput.SelectTrigger>
								<PromptInput.SelectContent>
									{#each models as model (model.id)}
										<PromptInput.SelectItem value={model.id} label={model.label} />
									{/each}
								</PromptInput.SelectContent>
							</PromptInput.Select>
						</PromptInput.Tools>
						<PromptInput.Submit {status} onStop={stopStream} />
					</PromptInput.Footer>
				</PromptInput.Root>
				{#if attachmentError}
					<p class="text-xs text-destructive">{attachmentError}</p>
				{/if}
			</div>
		</Card.Root>
	</DocSection>

	<DocSection title="The frame">
		{#snippet blurb()}
			Four elements, and the whole behaviour of the surface follows from how they nest. Everything
			else on this page is content.
		{/snippet}
		<div class="flex flex-col gap-4">
			<CodeBlock.Root
				label="Layout skeleton"
				language="text"
				code={LAYOUT_SKELETON}
				showLineNumbers={false}
			/>
			<Card.Root>
				<Card.Content class="flex flex-col gap-4 text-sm">
					<p>
						<strong>The card is the flex column, and it has a height.</strong> A chat surface has to
						be told how tall it is by something — a fixed <code>h-*</code> here, a
						<code>h-full</code> under a page that is itself full-height. A column that grows with its
						content has no overflow, and a viewport with no overflow never scrolls and therefore never
						pins.
					</p>
					<p>
						<strong
							>The scroll container is <code>Conversation.Root</code>, and
							<code>min-h-0</code> is what makes it one.</strong
						>
						A flex item's <code>min-height</code> resolves to <code>auto</code>, which means it
						refuses to shrink below its content — so without <code>min-h-0</code> the transcript
						would push the card taller and the page, not the transcript, would scroll. The root
						bakes that in and leaves <code>flex-1</code> to the caller, deliberately: upstream bakes
						<code>flex-1</code>
						in too, and then a call site that says
						<code>h-96</code> is silently ignored, because <code>flex-basis</code> wins over
						<code>height</code> on the main axis.
					</p>
					<p>
						<strong>The composer sits outside the scroller, as its sibling.</strong> Inside
						<code>Conversation.Content</code>
						it would scroll away with the transcript and be reachable only from the bottom of the log;
						under the card's own column it keeps its height, grows with its attachments and stays where
						the reader's hands are. The header is the same decision at the other end.
					</p>
					<p>
						<strong><code>Conversation.ScrollButton</code> is a sibling of the content</strong>, not
						a child of it: its containing block is the root's outer anchor, so it floats over the
						transcript's bottom edge instead of being clipped by the scroller — and it only exists
						while the reader has scrolled away.
					</p>
					<p>
						<strong>The empty state is a branch of the content, not a state of the root.</strong>
						Before the first turn the page renders
						<code>Conversation.EmptyState</code> — the house
						<a class="text-primary underline underline-offset-3" href={href("/components/empty")}
							>Empty</a
						>
						with a chat's wording — and a wrapped
						<a
							class="text-primary underline underline-offset-3"
							href={href("/components/suggestion")}>Suggestion</a
						>
						strip beside it. It centres because <code>Conversation.Content</code> is
						<code>min-h-full</code>; a transcript taller than the viewport is unaffected, because
						the minimum is already met. A starter goes straight in as the next question here, and
						<code>onSelect</code> would just as happily write it into the bound draft for the reader to
						edit first.
					</p>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<DocSection title="Streaming, and what stays pinned">
		{#snippet blurb()}
			The one behaviour a chat surface is judged on: the newest line stays in view while a reply
			arrives, and the viewport lets go the moment the reader scrolls up to re-read something.
			Nothing on this page implements it — <code>Conversation.Root</code> does, and the page only has
			to grow the transcript.
		{/snippet}
		<Card.Root>
			<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-64">Moment</Table.Head>
							<Table.Head>What the surface does</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each pinRows as row (row.moment)}
							<Table.Row>
								<Table.Cell class="font-medium">{row.moment}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{row.effect}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Who owns what">
		{#snippet blurb()}
			The line between the caller and the components, stated once so it does not have to be
			rediscovered per part. The short version: the components own presentation and their own
			interaction state, and the page owns the conversation.
		{/snippet}
		<div class="flex flex-col gap-4">
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-64">Concern</Table.Head>
								<Table.Head class="w-40">Owner</Table.Head>
								<Table.Head>What that means</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each ownerRows as row (row.concern)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.concern}</Table.Cell>
									<Table.Cell>{row.owner}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.note}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Content class="flex flex-col gap-4 text-sm">
					<p>
						<strong>The transcript is keyed by message id, and that is load-bearing.</strong> Every
						other key is wrong here for a reason worth naming: a turn's text changes on every
						streamed word, and the draft under it changes whenever the pager steps, so keying by
						content re-creates the turn constantly. Keying by index is worse still — a turn appended
						at the end shifts nothing, but a turn removed shifts everything after it. A re-created
						turn is a new <code>Reasoning.Root</code> and a new
						<code>Tool.Root</code>, which means every panel a reader had opened above the one being
						written closes itself, and the reasoning panel's auto-close fires again because it fires
						once per instance.
					</p>
					<p>
						<strong>A turn is a list of drafts, not a string.</strong> Regenerating replaces an
						answer rather than appending one, so the shape that survives it is a list with an index
						beside it — which is exactly what <code>Message.Branch</code> binds to. A turn that was never
						regenerated simply has one draft and renders without a pager.
					</p>
					<p>
						<strong>The status is the page's, and three components read it.</strong>
						<code>submitted</code>
						and <code>streaming</code> both mean a turn is in flight (<code>isChatGenerating</code
						>): the submit button becomes a stop button, Enter stops submitting because of it, and
						the regenerate action is disabled. One value, no flags beside it.
					</p>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<DocSection title="What it composes">
		{#snippet blurb()}
			Nine published components, each with a page of its own that documents it properly — this one
			only shows them working together.
		{/snippet}
		<Card.Root>
			<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-44">Component</Table.Head>
							<Table.Head>Parts used here</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each pieces as piece (piece.path)}
							<Table.Row>
								<Table.Cell class="font-medium">
									<a class="text-primary underline underline-offset-3" href={href(piece.path)}>
										{piece.title}
									</a>
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">{piece.used}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
