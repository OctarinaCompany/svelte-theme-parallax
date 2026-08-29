<script lang="ts">
	import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import ThumbsDownIcon from "@lucide/svelte/icons/thumbs-down";
	import ThumbsUpIcon from "@lucide/svelte/icons/thumbs-up";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { CopyButton } from "$lib/components/ui/copy-button/index.js";
	import * as Message from "$lib/components/ui/message/index.js";
	import { MESSAGE_RESPONSE_THEME } from "$lib/components/ui/message/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import {
		AI_CHAT_MARKDOWN_ANSWER,
		AI_CHAT_TRANSCRIPT,
		type AiChatMessage,
	} from "$lib/data/ai-chat.js";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Message component page.
	 *
	 * Every transcript demo here is the exchange `src/lib/data/ai-chat.ts` declares, shared with
	 * the Conversation page so a reader moving between the two recognises it. This page renders
	 * the TEXT parts only: the reasoning and tool parts of the same transcript belong to the
	 * components that draw them.
	 */

	/** The text a turn is made of — its text parts joined, the other kinds left to their pages. */
	function textOf(message: AiChatMessage): string {
		return message.parts
			.filter((part) => part.type === "text")
			.map((part) => part.text)
			.join("\n\n");
	}

	/** The follow-up question and its plain answer: the pair without a table in it. */
	const turns = AI_CHAT_TRANSCRIPT.slice(-2);

	/**
	 * The toolbar demo's rating. Kept so the thumbs actions have a real `onclick` — the handler
	 * has to run THROUGH the tooltip trigger's own click handler, which is what `Message.Action`
	 * merges rather than overwrites.
	 */
	let rating = $state<"good" | "poor" | undefined>();

	const alertsSample = `> [!NOTE]
> Context windows are subscription-dependent; the 1M window on Opus is included on Max.

> [!TIP]
> Ask for the CSV in the same message as the table so the columns match.

> [!WARNING]
> Token counts are estimates. A PDF with scanned pages costs more than its page count suggests.

> [!CAUTION]
> Do not paste an API key into the prompt; it will be echoed back in the transcript.

> [!IMPORTANT]
> Pick the model before the conversation starts — switching mid-thread resets the cache.`;

	const streamSample = `Opus 5 is the safer pick for a **300-page PDF**. Three reasons:

1. The document is roughly 150K tokens, which leaves room in the window for the summary itself.
2. Long-document reasoning holds up better across chapters than on Sonnet.
3. You only run this once, so the cost difference is a rounding error.

If you plan to summarise a stack of them every week, switch to Sonnet 5 and batch the PDFs.`;

	/**
	 * The stream, one word at a time. Split AFTER each run of whitespace so every piece carries
	 * its trailing space and the concatenation reproduces the sample exactly — a split on the
	 * whitespace itself would lose it, and the Markdown list would fold into a paragraph.
	 */
	const streamWords = streamSample.split(/(?<=\s)/);

	let streamed = $state("");
	let streaming = $state(false);
	let streamTimer: ReturnType<typeof setInterval> | null = null;

	function stopStream() {
		if (streamTimer) clearInterval(streamTimer);
		streamTimer = null;
		streaming = false;
	}

	function startStream() {
		stopStream();
		streamed = "";
		streaming = true;
		let index = 0;
		streamTimer = setInterval(() => {
			streamed += streamWords[index] ?? "";
			index += 1;
			if (index >= streamWords.length) stopStream();
		}, 60);
	}

	// Starts on mount so the reader sees the blur without clicking, and stops on unmount so a
	// timer never writes into a page that is gone. Nothing reactive is read here — `startStream`
	// only writes — so the effect runs once.
	$effect(() => {
		startStream();
		return stopStream;
	});

	const toolbarAnswer = textOf(AI_CHAT_TRANSCRIPT[3]);

	/**
	 * Three answers to the same question — what a "regenerate" button leaves behind. Written out
	 * rather than taken from the transcript because the point of the demo is that they DIFFER: the
	 * reader is choosing between them, not reading one twice.
	 */
	const branchDrafts = [
		"**Opus 5.** 300 pages is roughly 150K tokens, which leaves room in the window for the summary itself, and the reasoning holds up across chapters. You run this once, so the price difference is a rounding error.",
		"**Sonnet 5**, if this is a weekly job. It fits the same document, costs a fraction of Opus per run, and the two summaries differ mostly on the chapters nobody reads. Batch the PDFs and spend the difference on a second pass.",
		`Either fits — the document is roughly 150K tokens.

- **Opus 5** — holds a long document together better; worth it for a one-off.
- **Sonnet 5** — cheaper per run; the pick if you summarise a stack every week.

Start on Opus, and move to Sonnet once the prompt has settled.`,
	];

	/** Which draft the branch demo is showing. Bound, so the page can print the callback's count. */
	let draft = $state(0);

	/**
	 * How many times `onBranchChange` has fired. The callback is the demo's point: it counts steps,
	 * not renders, and the seed never counts as one.
	 */
	let draftMoves = $state(0);

	/** `MESSAGE_RESPONSE_THEME` flattened to `group.part` rows for the mapping table. */
	function flattenTheme(node: object, prefix = ""): { key: string; classes: string }[] {
		return Object.entries(node).flatMap(([key, value]) =>
			typeof value === "string"
				? [{ key: `${prefix}${key}`, classes: value }]
				: flattenTheme(value, `${prefix}${key}.`),
		);
	}

	const themeRows = flattenTheme(MESSAGE_RESPONSE_THEME);

	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "from",
			type: '"user" | "assistant" | "system"',
			default: "—",
			description:
				"Who authored the turn. Stamped as data-from, published on context for every part, and what aligns the column: user hugs the right edge, assistant and system the left. A value outside MESSAGE_ROLES renders as assistant.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after messageVariants, so a layout class of the caller's wins.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div after the stamped attributes.",
		},
	];

	const contentProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged after messageContentVariants for the role read from context. Throws if rendered outside Message.Root.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div after data-slot and data-from.",
		},
	];

	const responseProps: PropRow[] = [
		{
			prop: "content",
			type: "string",
			default: "—",
			description:
				"The Markdown to render. A string, not children — a Svelte snippet has no text to read back. Pass the streaming part's text as it grows; only the trailing blocks are re-lexed.",
		},
		{
			prop: "isAnimating",
			type: "boolean",
			default: "false",
			description:
				"Whether the text is still arriving. While true, and the reader has not asked for reduced motion, each new word blurs in; false renders at rest. Stamped as data-animating only when the animation actually plays.",
		},
		{
			prop: "parseIncompleteMarkdown",
			type: "boolean",
			default: "true",
			description:
				"Close constructs a stream has opened but not finished — an unclosed **bold, a half-written link — so partial text renders as prose rather than literal asterisks.",
		},
		{
			prop: "allowedLinkPrefixes",
			type: "string[]",
			default: '["*"]',
			description:
				'URL prefixes a link may point at; anything else renders as "[blocked]" text. "*" allows every http and https URL; a protocol alone ("https://", "mailto:") allows that protocol only.',
		},
		{
			prop: "allowedImagePrefixes",
			type: "string[]",
			default: '["*"]',
			description: "The same gate for images.",
		},
		{
			prop: "controls",
			type: 'StreamdownProps["controls"]',
			default: "{ code: false, table: true, mermaid: false }",
			description:
				"Which of Streamdown's own toolbars render. code is off because fenced code is drawn by the house CodeBlock with its own copy and download buttons; table keeps its copy-as-CSV menu; mermaid has no renderer loaded.",
		},
		{
			prop: "components",
			type: 'StreamdownProps["components"]',
			default: "—",
			description:
				"Streamdown's opt-in heavy renderers. math is honoured as it is. code replaces the house code block — pass Streamdown's Code for Shiki highlighting and the house snippet steps aside, with its label, its filename and its download button. Replacing the renderer is not the only route to a real grammar: a CodeBlockHighlighter installed above these messages keeps the house block and changes only what paints it. mermaid fences travel through the same code slot.",
		},
		{
			prop: "theme",
			type: "MessageResponseTheme",
			default: "—",
			description:
				"Class overrides per Markdown element, merged over MESSAGE_RESPONSE_THEME and then over Streamdown's shadcn base with tailwind-merge at both steps: a class here wins its conflicts and keeps the rest.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the wrapper div, not to Streamdown's own root.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged onto the wrapper div.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the wrapper div. Streamdown's own root takes a class and nothing else, which is why there is a wrapper.",
		},
	];

	const actionsProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the flex row classes.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div.",
		},
	];

	const actionProps: PropRow[] = [
		{
			prop: "label",
			type: "string",
			default: "—",
			description:
				"The accessible name: the button's aria-label and a visually hidden text. Required, because the button carries an icon and nothing else.",
		},
		{
			prop: "tooltip",
			type: "string",
			default: "—",
			description:
				"A tooltip on hover and focus, wrapped in its own Tooltip.Provider. Decoration over the label, never the accessible name. Omitted, the button renders bare with no tooltip wiring at all.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: '"ghost"',
			description: "Forwarded to Button.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: '"icon-sm"',
			description: "Forwarded to Button; the 32px rung of the control ramp.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the button. href is omitted, so it is never an anchor.",
		},
		{
			prop: "...restProps",
			type: 'Omit<ButtonProps, "href">',
			default: "—",
			description:
				"Merged onto the Button with mergeProps, so a caller's onclick chains after the tooltip trigger's own handler instead of replacing it, and a caller's disabled wins over the trigger's.",
		},
	];

	const toolbarProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the justify-between row classes.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div.",
		},
	];

	const branchProps: PropRow[] = [
		{
			prop: "branch",
			type: "number",
			default: "—",
			description:
				"Which alternative is on screen, zero-based. Bindable. An index outside 0…count-1 renders the nearest branch and is not corrected in place, so a value the parent owns is never rewritten from inside; a fractional index is truncated and a non-finite one renders the first.",
		},
		{
			prop: "defaultBranch",
			type: "number",
			default: "0",
			description:
				"Where to start when branch is not bound. A seed, read once at init — changing it later moves nothing, and it is clamped at render like any other index rather than at seed time.",
		},
		{
			prop: "onBranchChange",
			type: "(branch: number) => void",
			default: "—",
			description:
				"Fired when a step actually moves the index. Never for a parent's write through the binding, never for the initial seed, and never for a step the ends refused.",
		},
		{
			prop: "loop",
			type: "boolean",
			default: "true",
			description:
				"Whether stepping past an end wraps to the other one — upstream's behaviour, which has no opt-out there. false disables Message.BranchPrevious on the first branch and Message.BranchNext on the last instead.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered div.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged after the column classes.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the div after data-slot, data-branch and data-branch-count.",
		},
	];

	const branchContentProps: PropRow[] = [
		{
			prop: "branches",
			type: "Snippet[]",
			default: "—",
			description:
				"The alternatives in the order the pager walks them, each usually a whole Message.Root. Only the active one is rendered — stepping away destroys a branch and stepping back rebuilds it. The array's length is the count every other branch part reads, so appending to it adds a page; an empty array renders nothing and leaves the counter at 0 of 0.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the wrapper div, not to the active branch.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged after the column classes and the rule that flattens a nested turn's bottom padding. Throws if rendered outside Message.Branch.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the wrapper div after data-slot and data-branch.",
		},
	];

	const branchSelectorProps: PropRow[] = [
		{
			prop: "orientation",
			type: "ButtonGroupOrientation",
			default: '"horizontal"',
			description:
				"Forwarded to ButtonGroup, which is what decides whether the three controls sit in a row or a column.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description:
				"Bindable reference to the group's div — null for as long as the selector renders nothing.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged after the rule that puts the children's corners back, so a caller's class wins over it.",
		},
		{
			prop: "...restProps",
			type: "ComponentProps<typeof ButtonGroup>",
			default: "—",
			description:
				"Spread onto ButtonGroup before data-slot is restated, so every group prop is reachable and the slot name is not.",
		},
	];

	const branchPreviousProps: PropRow[] = [
		{
			prop: "variant",
			type: "ButtonVariant",
			default: '"ghost"',
			description: "Forwarded to Button.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: '"icon-sm"',
			description: "Forwarded to Button; the 32px rung of the control ramp.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the default chevron. The accessible name is the aria-label either way, so an icon of the caller's needs no label of its own.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "—",
			description:
				"Merged over the computed state and wins it. The button disables itself with fewer than two branches, and on the first branch when the root was given loop={false}; a caller's false re-enables it there, and a caller's true disables it anywhere.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the button. href is omitted, so it is never an anchor.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Forwarded to Button as its class.",
		},
		{
			prop: "...restProps",
			type: 'Omit<ButtonProps, "href">',
			default: "—",
			description:
				"Merged onto the Button with mergeProps, so a caller's onclick chains after the step instead of replacing it — a pager that no longer pages is not something a handler should be able to cause by accident.",
		},
	];

	/** The two buttons take the same props; only which end disables them differs. */
	const branchNextProps: PropRow[] = branchPreviousProps.map((row) =>
		row.prop === "disabled"
			? {
					...row,
					description:
						"Merged over the computed state and wins it. The button disables itself with fewer than two branches, and on the last branch when the root was given loop={false}; a caller's false re-enables it there, and a caller's true disables it anywhere.",
				}
			: row,
	);

	const branchPageProps: PropRow[] = [
		{
			prop: "label",
			type: "string",
			default: '"Branch"',
			description:
				"The noun the announced counter opens with — Branch 2 of 3. Read by a screen reader only; the visible text stays the bare 2 of 3. Name what the alternatives are wherever branch is not the page's own word for them.",
		},
		{
			prop: "ref",
			type: "HTMLSpanElement | null",
			default: "null",
			description: "Bindable reference to the span the counter renders as.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged after the three classes that strip ButtonGroupText's border, ground and shadow.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLSpanElement>",
			default: "—",
			description:
				"Spread onto the span after ButtonGroupText's own props and before data-slot, role and the two aria attributes — which are therefore the four a caller cannot override.",
		},
	];

	const dataAttributes = [
		{
			attribute: "data-slot",
			part: "every part",
			values:
				'"message", "message-content", "message-response", "message-actions", "message-action", "message-toolbar", "message-branch", "message-branch-content", "message-branch-selector", "message-branch-previous", "message-branch-next", "message-branch-page"',
		},
		{
			attribute: "data-from",
			part: "Root, Content",
			values: '"user" | "assistant" | "system" — the resolved role',
		},
		{
			attribute: "data-branch",
			part: "Branch, BranchContent",
			values:
				"The index actually rendered: the caller's branch, clamped into range and never written back to the prop.",
		},
		{
			attribute: "data-branch-count",
			part: "Branch",
			values:
				"How many alternatives BranchContent is holding. 0 until the effect flush after the mount registers them.",
		},
		{
			attribute: "data-animating",
			part: "Response",
			values:
				"Present while the blur animation plays: isAnimating is true and the reader has not asked for reduced motion.",
		},
		{
			attribute: "data-state",
			part: "Action (with a tooltip)",
			values:
				'"closed" | "delayed-open" | "instant-open" — the tooltip trigger state Bits UI stamps.',
		},
		{
			attribute: "data-downloadable",
			part: "CodeBlock inside Response",
			values:
				"Present on a fenced block that NAMES something — the file in its info string, else `snippet.<ext>` for its language. A bare ``` fence names nothing, so it carries no download button.",
		},
	];
</script>

<DocPage title="Message">
	{#snippet subtitle()}
		One turn of a chat: who said it, a body aligned by role, a Markdown response rendered by
		svelte-streamdown with fenced code drawn by the house
		<a class="text-primary underline underline-offset-3" href={href("/components/code-block")}
			>code block</a
		>, and a toolbar of actions underneath. The list a transcript scrolls in is the
		<a class="text-primary underline underline-offset-3" href={href("/components/conversation")}
			>conversation</a
		> component.
	{/snippet}

	<DocSection title="Conversation turns">
		{#snippet blurb()}
			A <code>user</code> turn is a bubble on the secondary ground, capped at 80% of the column and
			pushed right; an <code>assistant</code> turn is full-width prose. Both are the same three
			parts — <code>Message.Root</code>, <code>Message.Content</code>,
			<code>Message.Response</code> — told apart by <code>from</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col">
					{#each turns as turn (turn.id)}
						<Message.Root from={turn.role}>
							<Message.Content>
								<Message.Response content={textOf(turn)} />
							</Message.Content>
						</Message.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Markdown">
		{#snippet blurb()}
			The answer every renderer has to survive: a table, a link, two fences and a quote. The table
			keeps Streamdown's copy and download menu. The first fence says
			<code>```csv models.csv</code>, so the house code block labels it <code>csv</code>
			and offers <code>models.csv</code> as a download — a fence naming only a language downloads as
			<code>snippet.&lt;ext&gt;</code>. The second is opened <code>```javascript</code>, the long
			spelling a model actually writes: it resolves to the <code>js</code> grammar and is coloured,
			where it once fell back to <code>Text</code>. Its comment spans two lines, and only the first
			is grey — the house tokenizer reads one line at a time.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Message.Root from="assistant">
					<Message.Content>
						<Message.Response content={AI_CHAT_MARKDOWN_ANSWER} />
					</Message.Content>
				</Message.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="GitHub alerts">
		{#snippet blurb()}
			The five <code>[!NOTE]</code>-style callouts, each on the status family that carries its
			meaning: note is <code>info</code>, tip <code>success</code>, warning
			<code>warning</code>, caution <code>destructive</code>, important <code>primary</code>. The
			rule and the icon take the raw token; the title takes the family's walked ink.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Message.Root from="assistant">
					<Message.Content>
						<Message.Response content={alertsSample} />
					</Message.Content>
				</Message.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Streaming">
		{#snippet blurb()}
			A timer appends the answer one word at a time and <code>isAnimating</code> is true while it
			runs, so each word blurs in. <code>parseIncompleteMarkdown</code> keeps the half-written bold and
			list rendering as prose on the way. The blur is skipped for a reader who asked for reduced motion;
			the text still arrives.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div class="flex items-center justify-between gap-4">
						<span class="text-xs tracking-label text-muted-foreground uppercase">
							{streaming ? "Streaming" : "Complete"}
						</span>
						<Button variant="outline" size="sm" onclick={startStream}>
							<RotateCcwIcon data-icon="inline-start" />
							Restart
						</Button>
					</div>
					<Message.Root from="assistant" class="py-0">
						<Message.Content>
							<Message.Response content={streamed} isAnimating={streaming} />
						</Message.Content>
					</Message.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Actions and toolbar">
		{#snippet blurb()}
			<code>Message.Toolbar</code> puts a row of <code>Message.Action</code> buttons at one edge and
			metadata at the other. The copy control is the house <code>CopyButton</code> on the same ghost
			<code>icon-sm</code>
			rung; each action names itself through <code>label</code> and may add a <code>tooltip</code> on
			top.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Message.Root from="assistant">
					<Message.Content>
						<Message.Response content={toolbarAnswer} />
					</Message.Content>
					<Message.Toolbar>
						<Message.Actions>
							<CopyButton value={toolbarAnswer} variant="ghost" size="icon-sm" />
							<Message.Action label="Regenerate" tooltip="Regenerate the answer">
								<RefreshCwIcon />
							</Message.Action>
							<Message.Action
								label="Good answer"
								tooltip="Good answer"
								aria-pressed={rating === "good"}
								onclick={() => (rating = rating === "good" ? undefined : "good")}
							>
								<ThumbsUpIcon />
							</Message.Action>
							<Message.Action
								label="Poor answer"
								tooltip="Poor answer"
								aria-pressed={rating === "poor"}
								onclick={() => (rating = rating === "poor" ? undefined : "poor")}
							>
								<ThumbsDownIcon />
							</Message.Action>
						</Message.Actions>
						<span class="text-xs text-muted-foreground">
							{rating ? `Rated ${rating} · ` : ""}Opus 5 · first token 412 ms
						</span>
					</Message.Toolbar>
				</Message.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Branches">
		{#snippet blurb()}
			Three answers to one prompt, one of them on screen, with a pager underneath — what a
			regenerate button leaves behind. The alternatives are snippets handed to
			<code>Message.BranchContent</code> as an array, because Svelte cannot count children the way
			the React original does. Only the active one is mounted;
			<code>onBranchChange</code> fires on a step and never on the seed, and the counter is a polite live
			region so the step is announced.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col">
					{#snippet opusDraft()}
						<Message.Root from="assistant">
							<Message.Content>
								<Message.Response content={branchDrafts[0]} />
							</Message.Content>
						</Message.Root>
					{/snippet}

					{#snippet sonnetDraft()}
						<Message.Root from="assistant">
							<Message.Content>
								<Message.Response content={branchDrafts[1]} />
							</Message.Content>
						</Message.Root>
					{/snippet}

					{#snippet eitherDraft()}
						<Message.Root from="assistant">
							<Message.Content>
								<Message.Response content={branchDrafts[2]} />
							</Message.Content>
						</Message.Root>
					{/snippet}

					<Message.Root from="user">
						<Message.Content>
							<Message.Response content={textOf(turns[0])} />
						</Message.Content>
					</Message.Root>

					<Message.Branch bind:branch={draft} onBranchChange={() => (draftMoves += 1)}>
						<Message.BranchContent branches={[opusDraft, sonnetDraft, eitherDraft]} />
						<Message.BranchSelector>
							<Message.BranchPrevious />
							<Message.BranchPage label="Draft" />
							<Message.BranchNext />
						</Message.BranchSelector>
					</Message.Branch>

					<span class="mt-3 text-xs tracking-label text-muted-foreground uppercase">
						onBranchChange fired {draftMoves}
						{draftMoves === 1 ? "time" : "times"}
					</span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Theme mapping">
		{#snippet blurb()}
			What <code>MESSAGE_RESPONSE_THEME</code> lays over Streamdown's shadcn base theme. The base
			already speaks in tokens almost everywhere; these are the keys it paints in raw palette
			colours or off the kit's ramp, restated in house classes. A <code>theme</code> prop on
			<code>Message.Response</code> merges over this table the same way.
		{/snippet}
		<Card.Root>
			<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Theme key</Table.Head>
							<Table.Head>House classes</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each themeRows as row (row.key)}
							<Table.Row>
								<Table.Cell class="font-medium">{row.key}</Table.Cell>
								<Table.Cell class="font-mono text-xs text-muted-foreground"
									>{row.classes}</Table.Cell
								>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Message.Root</h3>
			<p class="text-sm text-muted-foreground">
				The turn. Renders a full-width <code>div</code> column aligned by <code>from</code>, and
				publishes the role on context for the parts inside it.
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
			<h3 class="text-base font-medium">Message.Content</h3>
			<p class="text-sm text-muted-foreground">
				The body. Renders a <code>div</code> that is the user's bubble or the assistant's full-width prose,
				picked from the role on context, and stacks its children with a gap.
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
			<h3 class="text-base font-medium">Message.Response</h3>
			<p class="text-sm text-muted-foreground">
				The Markdown renderer. Renders a wrapper <code>div</code> around svelte-streamdown in its
				shadcn base theme with <code>MESSAGE_RESPONSE_THEME</code> over it; fenced code is drawn by
				the house <code>CodeBlock</code>, with a download button when the fence names a file. The
				house tokenizer knows fourteen grammars and colours one line at a time, and there are two
				ways past that: install a <code>CodeBlockHighlighter</code> above these messages, which
				keeps the house block and replaces only what paints it, or pass Streamdown's own
				<code>Code</code> through <code>components</code>, which replaces the block entirely.
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
							{#each responseProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Message.Actions</h3>
			<p class="text-sm text-muted-foreground">
				A row of actions. Renders a <code>div</code> flex row with a 4px gap, for
				<code>Message.Action</code> and <code>CopyButton</code> children.
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
							{#each actionsProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Message.Action</h3>
			<p class="text-sm text-muted-foreground">
				One action. Renders a ghost <code>icon-sm</code> <code>Button</code> named by
				<code>label</code>, and, given a <code>tooltip</code>, makes that button the trigger of a
				<code>Tooltip</code> with its own provider.
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
							{#each actionProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Message.Toolbar</h3>
			<p class="text-sm text-muted-foreground">
				The strip under a turn. Renders a full-width <code>div</code> row with its children at the two
				edges — actions on one side, metadata on the other.
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
							{#each toolbarProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Message.Branch</h3>
			<p class="text-sm text-muted-foreground">
				Several answers to one prompt. Renders a full-width <code>div</code> column that stacks the
				alternatives over their pager, and owns the active index — it goes around whole
				<code>Message.Root</code> turns rather than inside one.
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
							{#each branchProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Message.BranchContent</h3>
			<p class="text-sm text-muted-foreground">
				The alternatives. Renders a <code>div</code> holding the active branch and nothing else — the
				snippets are a prop because a Svelte component cannot read its children as a list, which is also
				what makes the count, the pager and the counter agree.
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
							{#each branchContentProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Message.BranchSelector</h3>
			<p class="text-sm text-muted-foreground">
				The pager. Renders a <code>ButtonGroup</code> around the previous button, the counter and the
				next button, with each child's corners put back. Renders nothing at all below two branches, so
				the buttons are absent from the tab order rather than merely disabled.
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
							{#each branchSelectorProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Message.BranchPrevious</h3>
			<p class="text-sm text-muted-foreground">
				One step back. Renders a ghost <code>icon-sm</code> <code>Button</code> named
				<code>Previous branch</code>, holding a chevron unless given children, and disabled when the
				step cannot happen.
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
							{#each branchPreviousProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Message.BranchNext</h3>
			<p class="text-sm text-muted-foreground">
				One step forward, the mirror of <code>Message.BranchPrevious</code>: the same ghost
				<code>icon-sm</code> <code>Button</code>, named <code>Next branch</code> and carrying the other
				chevron.
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
							{#each branchNextProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Message.BranchPage</h3>
			<p class="text-sm text-muted-foreground">
				Where the reader is. Renders a <code>ButtonGroupText</code> as a <code>span</code> printing
				<code>2 of 3</code>, and announces itself: the span is a polite, atomic live region whose
				spoken text is a hidden <code>Branch 2 of 3</code> whilst the visible pair is
				<code>aria-hidden</code>, so a step is reported once and with a noun.
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
							{#each branchPageProps as row (row.prop)}
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
	</DocSection>
</DocPage>
