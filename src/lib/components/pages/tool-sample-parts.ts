/**
 * Tool parts for the Tool page: one call in each of the seven states, plus the shapes the output
 * examples need. Page data, colocated with the page as `docs/CONVENTIONS.md` §4 asks; the
 * component never imports it.
 *
 * The shape is the structural mirror of the AI SDK's `ToolUIPart | DynamicToolUIPart` that
 * `src/lib/shared/chat-parts.ts` documents: `type` is `"dynamic-tool"` or `` `tool-${name}` ``, and
 * a dynamic part carries its `toolName` beside it. A page that later feeds real SDK parts to
 * `Tool.Root` passes them through unchanged.
 */
import type { ToolPartState } from "$lib/shared/chat-parts.js";

export type ToolSamplePart = {
	type: string;
	toolName?: string;
	state: ToolPartState;
	input?: unknown;
	output?: unknown;
	errorText?: string;
};

const weatherInput = { city: "Lyon", unit: "celsius", days: 3 };

const weatherOutput = {
	city: "Lyon",
	unit: "celsius",
	current: { temperature: 21, condition: "Partly cloudy", humidity: 0.48, wind: 12 },
	forecast: [
		{ day: "Tue", high: 24, low: 14, condition: "Sunny" },
		{ day: "Wed", high: 22, low: 13, condition: "Showers" },
		{ day: "Thu", high: 19, low: 11, condition: "Overcast" },
	],
	source: "https://open-meteo.com",
};

const emailInput = {
	to: "ada@example.com",
	subject: "Q3 roadmap review",
	body: "Hi Ada — attached is the roadmap deck we discussed. Could you review it before Thursday?",
};

/**
 * Every state, in the order a call travels through them (`TOOL_PART_STATES`). Seven parts render
 * all five `Status` families, per `toolStateVariant`: `input-streaming` is the neutral `default`,
 * `input-available` and `approval-responded` are `info`, `approval-requested` and `output-denied`
 * are `warning`, `output-available` is `success` and `output-error` is `destructive`.
 */
export const TOOL_SAMPLE_PARTS: readonly ToolSamplePart[] = [
	{
		type: "tool-searchDocs",
		state: "input-streaming",
		input: { query: "svelte 5 runes $bindable" },
	},
	{
		type: "tool-getWeather",
		state: "input-available",
		input: weatherInput,
	},
	{
		type: "tool-sendEmail",
		state: "approval-requested",
		input: emailInput,
	},
	{
		type: "tool-sendEmail",
		state: "approval-responded",
		input: emailInput,
	},
	{
		type: "tool-getWeather",
		state: "output-available",
		input: weatherInput,
		output: weatherOutput,
	},
	{
		type: "tool-deleteBranch",
		state: "output-denied",
		input: { repository: "octarina/svelte-theme-parallax", branch: "main", force: true },
	},
	{
		type: "tool-fetchUrl",
		state: "output-error",
		input: { url: "https://api.example.com/v1/reports/2026-08", timeoutMs: 5000 },
		errorText:
			"Request timed out after 5000 ms.\nThe upstream host answered the TCP handshake but sent no response headers.",
	},
];

/**
 * The typed and dynamic shapes side by side, for the identity example. The typed one is also the
 * completed call most sections start from — referenced by name rather than as a position in
 * `TOOL_SAMPLE_PARTS`, which is ordered by state and free to be reordered.
 */
export const TOOL_SAMPLE_TYPED: ToolSamplePart = {
	type: "tool-getWeather",
	state: "output-available",
	input: weatherInput,
	output: weatherOutput,
};

export const TOOL_SAMPLE_DYNAMIC: ToolSamplePart = {
	type: "dynamic-tool",
	toolName: "mcp__filesystem__read_file",
	state: "output-available",
	input: { path: "docs/CONVENTIONS.md" },
	output: "# House conventions\n\nThe rules every file in this repository follows.",
};

/** A tool whose result is a plain string — a shell command, a file read, a rendered template. */
export const TOOL_SAMPLE_TEXT_OUTPUT: ToolSamplePart = {
	type: "tool-runCommand",
	state: "output-available",
	input: { command: "git log --oneline -3" },
	output:
		"a1b2c3d feat(tool): render the input through the JSON viewer\n9f8e7d6 docs: state the soft status rule\n5c4b3a2 chore: pin bits-ui",
};

/** A tool that failed after producing part of its result, so both blocks render. */
export const TOOL_SAMPLE_PARTIAL_ERROR: ToolSamplePart = {
	type: "tool-syncCalendar",
	state: "output-error",
	input: { calendarId: "team@example.com", range: "2026-09" },
	output: { synced: 14, skipped: 2 },
	errorText: "Rate limited by the calendar API after 16 of 31 events; retry in 60 s.",
};
