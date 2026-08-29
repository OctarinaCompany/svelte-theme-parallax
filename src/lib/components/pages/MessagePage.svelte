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
				"Streamdown's opt-in heavy renderers. math is honoured as it is. code replaces the house code block — pass Streamdown's Code for Shiki highlighting and the house snippet steps aside. mermaid fences travel through the same code slot.",
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

	const dataAttributes = [
		{
			attribute: "data-slot",
			part: "every part",
			values:
				'"message", "message-content", "message-response", "message-actions", "message-action", "message-toolbar"',
		},
		{
			attribute: "data-from",
			part: "Root, Content",
			values: '"user" | "assistant" | "system" — the resolved role',
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
			values: "Present on a fenced block whose info string yields a filename.",
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
			The answer every renderer has to survive: a table, a link, a downloadable fence and a quote.
			The table keeps Streamdown's copy and download menu. The fence says
			<code>```csv models.csv</code>, so the house code block labels it <code>csv</code>
			and offers <code>models.csv</code> as a download — a fence naming only a language downloads as
			<code>snippet.&lt;ext&gt;</code>.
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
				the house <code>CodeBlock</code>, with a download button when the fence names a file.
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
