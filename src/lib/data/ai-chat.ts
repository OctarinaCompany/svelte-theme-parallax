/**
 * One conversation, shared by the AI chat pages that render a transcript — Conversation and
 * Message — so both show the same exchange and a reader who moves between them recognises it.
 *
 * Lives in `src/lib/data/` because it is GALLERY DATA, not component code: the registry generator
 * refuses a `$lib/data/…` import from anything under `ui/`, which is what keeps a demo transcript
 * out of every project that installs `parallax-message`. Page-only samples — a tool call in each
 * of its seven states, a plan with steps — stay colocated with their page as `<slug>-sample-*.ts`
 * (`docs/CONVENTIONS.md` §4).
 *
 * The shapes below are the structural mirror of the AI SDK's `UIMessage` parts that
 * `src/lib/shared/chat-parts.ts` documents: a page that later feeds real SDK messages to these
 * components passes them through unchanged.
 */
import type { MessageRole, ToolPartState } from "$lib/shared/chat-parts.js";

export type AiChatTextPart = { type: "text"; text: string };
export type AiChatReasoningPart = { type: "reasoning"; text: string; durationSeconds?: number };
export type AiChatToolPart = {
	type: "tool";
	toolName: string;
	state: ToolPartState;
	input: unknown;
	output?: unknown;
	errorText?: string;
};
export type AiChatPart = AiChatTextPart | AiChatReasoningPart | AiChatToolPart;

export type AiChatMessage = { id: string; role: MessageRole; parts: AiChatPart[] };

/** The Markdown answer every renderer test needs: a table, a link, a downloadable fence. */
export const AI_CHAT_MARKDOWN_ANSWER = `Here is the comparison you asked for.

| Model | Context window | Best for |
| --- | --- | --- |
| Sonnet 5 | 1M tokens | everyday questions, fast answers |
| Opus 5 | 1M tokens | long reasoning, large documents |
| Haiku 4.5 | 200K tokens | short lookups at the lowest cost |

The figures come from the [model overview](https://platform.claude.com/docs/en/about-claude/models/overview). If you want them as a file:

\`\`\`csv models.csv
model,context_window,best_for
Sonnet 5,1000000,everyday questions
Opus 5,1000000,long reasoning
Haiku 4.5,200000,short lookups
\`\`\`

> Note: context windows are subscription-dependent; the 1M window on Opus is included on Max.`;

export const AI_CHAT_TRANSCRIPT: AiChatMessage[] = [
	{
		id: "u1",
		role: "user",
		parts: [
			{
				type: "text",
				text: "Compare Sonnet 5, Opus 5 and Haiku in a table, then give me the data as a CSV.",
			},
		],
	},
	{
		id: "a1",
		role: "assistant",
		parts: [
			{
				type: "reasoning",
				text: "The user wants two representations of the same data: a table to read and a CSV to download. I should keep the columns identical so the file matches the table, and cite where the numbers come from.",
				durationSeconds: 4,
			},
			{
				type: "tool",
				toolName: "WebSearch",
				state: "output-available",
				input: { query: "Claude Sonnet 5 Opus 5 Haiku 4.5 context window" },
				output: {
					query: "Claude Sonnet 5 Opus 5 Haiku 4.5 context window",
					results: [
						{
							content: [
								{
									title: "Models overview - Claude Docs",
									url: "https://platform.claude.com/docs/en/about-claude/models/overview",
								},
							],
						},
					],
					searchCount: 1,
				},
			},
			{ type: "text", text: AI_CHAT_MARKDOWN_ANSWER },
		],
	},
	{
		id: "u2",
		role: "user",
		parts: [{ type: "text", text: "Which one should I use for summarising a 300-page PDF?" }],
	},
	{
		id: "a2",
		role: "assistant",
		parts: [
			{
				type: "text",
				text: "Opus 5 — 300 pages is roughly 150K tokens of text, which fits comfortably in its window with room for the summary, and its reasoning holds up better across a long document. Sonnet 5 would also fit and cost less; pick it if you plan to run this often.",
			},
		],
	},
];

/** The prompts the Conversation page offers before the first message. */
export const AI_CHAT_STARTERS = [
	"Compare Sonnet 5 and Opus 5 in a table",
	"Give me 3 links to learn Svelte 5",
	"Create a CSV with 10 fictional customers",
	"Help me plan a two-day trip — ask me what you need first",
];
