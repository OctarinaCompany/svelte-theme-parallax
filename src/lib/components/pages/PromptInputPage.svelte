<script lang="ts">
	import { onDestroy } from "svelte";
	import BrainIcon from "@lucide/svelte/icons/brain";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import MicIcon from "@lucide/svelte/icons/mic";
	import PaperclipIcon from "@lucide/svelte/icons/paperclip";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as PromptInput from "$lib/components/ui/prompt-input/index.js";
	import type { PromptInputMessage } from "$lib/components/ui/prompt-input/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { AI_CHAT_STARTERS } from "$lib/data/ai-chat.js";
	import { href } from "$lib/hooks/route.svelte.js";
	import { CHAT_STATUSES, isChatGenerating, type ChatStatus } from "$lib/shared/chat-parts.js";

	/**
	 * The Prompt input page.
	 *
	 * The first section is `chat.tsx`'s composer, part for part: a textarea, a model picker, an
	 * effort picker, a reasoning toggle and the submit button that turns into a stop button. The
	 * chat status is driven by a toggle group here and by a simulated round trip on send, since
	 * there is no backend behind a gallery page.
	 *
	 * NOT ON THIS PAGE, because not in the component yet: attachments (the chip list, paste and
	 * drop, the hidden file input) and the action menu that opens the file dialog. Both are the
	 * documented follow-up of the lean port — `prompt-input.svelte`'s header comment says what
	 * lands and where.
	 */

	// ---------------------------------------------------------------------------
	// Composer
	// ---------------------------------------------------------------------------

	const models = [
		{ id: "sonnet-5", label: "Sonnet 5" },
		{ id: "opus-5", label: "Opus 5" },
		{ id: "haiku", label: "Haiku" },
	];

	const efforts = [
		{ id: "default", label: "Default effort" },
		{ id: "low", label: "Low" },
		{ id: "medium", label: "Medium" },
		{ id: "high", label: "High" },
	];

	let modelId = $state("sonnet-5");
	let effort = $state("default");
	let showReasoning = $state(false);
	let composerStatus = $state<ChatStatus>("ready");

	const modelLabel = $derived(models.find((model) => model.id === modelId)?.label ?? modelId);
	const effortLabel = $derived(efforts.find((level) => level.id === effort)?.label ?? effort);
	const composerBusy = $derived(isChatGenerating(composerStatus));

	type ComposerTurn = { text: string; model: string; effort: string; reasoning: boolean };

	let composerLast = $state<ComposerTurn | null>(null);
	let composerTimer: ReturnType<typeof setTimeout> | undefined;

	/**
	 * A fake round trip: `submitted` while the request is "in flight", `streaming` while the
	 * "reply" arrives, then `ready`. Stop cuts it short, exactly as `stop()` from `useChat` would.
	 */
	function composerSend(message: PromptInputMessage) {
		composerLast = {
			text: message.text,
			model: modelLabel,
			effort: effortLabel,
			reasoning: showReasoning,
		};
		composerStatus = "submitted";
		composerTimer = setTimeout(() => {
			composerStatus = "streaming";
			composerTimer = setTimeout(() => {
				composerStatus = "ready";
			}, 1800);
		}, 700);
	}

	function composerStop() {
		clearTimeout(composerTimer);
		composerStatus = "ready";
	}

	/** The toggle group hands back a string, and an empty one when the pressed item is released. */
	function toChatStatus(value: string): ChatStatus {
		return CHAT_STATUSES.includes(value as ChatStatus) ? (value as ChatStatus) : "ready";
	}

	onDestroy(() => clearTimeout(composerTimer));

	// ---------------------------------------------------------------------------
	// Bound value
	// ---------------------------------------------------------------------------

	const DRAFT_LIMIT = 280;

	let draft = $state("");
	let draftChanges = $state(0);

	// ---------------------------------------------------------------------------
	// Message list
	// ---------------------------------------------------------------------------

	type SentMessage = { id: number; text: string; at: string };

	let sent = $state<SentMessage[]>([]);
	let nextSentId = 1;

	/** Resolves after a short delay so the draft visibly stays put until the "request" lands. */
	async function appendMessage(message: PromptInputMessage) {
		await new Promise((resolve) => setTimeout(resolve, 900));
		sent.push({
			id: nextSentId++,
			text: message.text,
			at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
		});
	}

	// ---------------------------------------------------------------------------
	// Tooltips and header
	// ---------------------------------------------------------------------------

	let listening = $state(false);
	let webSearch = $state(false);

	// ---------------------------------------------------------------------------
	// API reference
	// ---------------------------------------------------------------------------

	type PropRow = { prop: string; type: string; default: string; description: string };

	const restRow = (type: string, element: string): PropRow => ({
		prop: "...restProps",
		type,
		default: "—",
		description: `Every other attribute and DOM handler is spread onto the ${element}.`,
	});

	const rootProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLFormElement | null",
			default: "null",
			description: "Bindable reference to the rendered form.",
		},
		{
			prop: "value",
			type: "string",
			default: '""',
			description:
				"The draft. Bindable: a parent write replaces the textarea's text and does not fire `onValueChange`.",
		},
		{
			prop: "onValueChange",
			type: "(value: string) => void",
			default: "—",
			description:
				"Fired when the reader edits the draft and when a successful submission clears it. Never fired for a parent-driven write or when the new value equals the current one.",
		},
		{
			prop: "clearOnSubmit",
			type: "boolean",
			default: "true",
			description:
				"Whether an accepted submission empties the draft. With a promise-returning `onSubmit` the draft is cleared only once the promise resolves, and only if it still equals the text that was sent — a draft the reader edited while the promise was pending is kept; a rejection keeps it and propagates.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Inerts the composer: the textarea and submit button are disabled, `submit()` refuses, and `data-disabled` is stamped on the form and on the input group (which dims the header and footer). Tool buttons and selects are not touched.",
		},
		{
			prop: "onSubmit",
			type: "(message: PromptInputMessage, event: SubmitEvent) => void | Promise<void>",
			default: "— (required)",
			description:
				"Called with `{ text }` on every accepted submission. Not called for a whitespace-only draft, while disabled, or while a previous promise is still pending. `text` is untrimmed.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last onto the form. The frame is the `InputGroup` inside it.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The parts, rendered inside the input group under a `Tooltip.Provider`.",
		},
		restRow("Omit<HTMLFormAttributes, 'onsubmit'>", "form — `onsubmit` is the part's own"),
	];

	const bodyProps: PropRow[] = [
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
				"Merged after `contents`. Giving the body a box of its own breaks the input group's column layout; use it for data attributes and handlers.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The textarea, and the attachment list once it exists.",
		},
		restRow("HTMLAttributes<HTMLDivElement>", "rendered element"),
	];

	const textareaProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the textarea, typed as the registry `Textarea` types it.",
		},
		{
			prop: "placeholder",
			type: "string",
			default: '"What would you like to know?"',
			description: "The textarea's placeholder.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "—",
			description: "OR-ed with the root's `disabled`; cannot re-enable a disabled composer.",
		},
		{
			prop: "onkeydown",
			type: "KeyboardEventHandler<HTMLTextAreaElement>",
			default: "—",
			description:
				"Runs before the part's own handler. Calling `event.preventDefault()` in it vetoes the Enter-to-submit behaviour for that keystroke.",
		},
		{
			prop: "oncompositionstart / oncompositionend",
			type: "CompositionEventHandler<HTMLTextAreaElement>",
			default: "—",
			description:
				"Forwarded after the part records the composition state it uses to ignore Enter during IME input.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged after `field-sizing-content max-h-48 min-h-16 resize-none`.",
		},
		restRow(
			"Omit<ComponentProps<typeof InputGroup.Textarea>, 'value'>",
			"textarea. `value` is not a prop — it belongs to the root",
		),
	];

	const addonProps = (align: string): PropRow[] => [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the addon element.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged after the addon's classes.",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler<HTMLDivElement>",
			default: "—",
			description:
				"Runs before the part's own click handler, which focuses the textarea when the empty space of the row is clicked (the registry addon looks for an `<input>` and finds none here). `event.preventDefault()` vetoes the focus; clicks on buttons and select triggers are left alone.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Rendered inside the addon.",
		},
		restRow(
			"Omit<ComponentProps<typeof InputGroup.Addon>, 'align'>",
			`addon. \`align\` is fixed to \`${align}\``,
		),
	];

	const headerProps = addonProps("block-start");
	const footerProps = addonProps("block-end");

	const toolsProps: PropRow[] = [
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
			description: "Merged after `flex min-w-0 items-center gap-1`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Selects and tool buttons.",
		},
		restRow("HTMLAttributes<HTMLDivElement>", "rendered element"),
	];

	const buttonProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the button.",
		},
		{
			prop: "tooltip",
			type: "string | { content: string; shortcut?: string; side?: 'top' | 'right' | 'bottom' | 'left' }",
			default: "—",
			description:
				"Wraps the button in a tooltip. `shortcut` renders as a `Kbd` after the text; an unknown `side` normalises to `top`. An empty string or empty `content` renders no tooltip. The tooltip is a description, not the button's name — an icon-only button still needs `aria-label`.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: '"ghost"',
			description: "Any `Button` variant. `secondary` is the usual pressed look for a toggle.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: '"sm"',
			description:
				"Any `Button` size. Pass `icon-sm` for an icon-only button — upstream infers it from the child count, which a snippet cannot provide.",
		},
		{
			prop: "type",
			type: "'button' | 'submit' | 'reset'",
			default: '"button"',
			description: "A tool never submits the form by default.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last onto the button.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: 'Icon and/or text. Mark a leading icon `data-icon="inline-start"`.',
		},
		restRow("Omit<ButtonProps, 'href'>", "button — a tool is never a link"),
	];

	const submitProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the button.",
		},
		{
			prop: "status",
			type: "'submitted' | 'streaming' | 'ready' | 'error'",
			default: '"ready"',
			description:
				"Picks the icon: `ready` an enter arrow, `submitted` a spinner, `streaming` a stop square, `error` a cross. Stamped as `data-status`.",
		},
		{
			prop: "onStop",
			type: "() => void",
			default: "—",
			description:
				'While `status` is `submitted` or `streaming`, the button becomes `type="button"`, is labelled "Stop", and a click calls this instead of submitting. Without it the button stays a submit button in every status.',
		},
		{
			prop: "onclick",
			type: "MouseEventHandler",
			default: "—",
			description: "Runs on a click that is not a stop. Not called while the button is stopping.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "—",
			description:
				"OR-ed with the root's `disabled`. A disabled submit button also blocks Enter in the textarea.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: '"default"',
			description: "The primary fill, so it is the one solid object in the frame.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: '"icon-sm"',
			description: "The 32px rung, matching the tools beside it.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Replaces the status icon entirely when supplied.",
		},
		restRow("Omit<ButtonProps, 'href' | 'type'>", "button — `type` is decided by the part"),
	];

	const selectProps: PropRow[] = [
		{
			prop: "type",
			type: "'single'",
			default: '"single"',
			description: "Only single selection is offered; a composer picks one option.",
		},
		{
			prop: "value",
			type: "string",
			default: "—",
			description: "Bindable. The selected item's `value`; `undefined` until something is picked.",
		},
		{
			prop: "onValueChange",
			type: "(value: string) => void",
			default: "—",
			description: "Fired by Bits UI when the reader picks an item, never for a parent write.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "false",
			description: "Bindable. Whether the list is shown.",
		},
		restRow(
			"Extract<ComponentProps<typeof Select.Root>, { type: 'single' }>",
			"Bits UI root, which renders no element — there is no `class` or `data-slot` here",
		),
	];

	const selectTriggerProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the trigger button, typed as Bits UI types it.",
		},
		{
			prop: "size",
			type: "'sm' | 'default'",
			default: '"sm"',
			description: "The ramp rung. `sm` is 32px, in line with the tool buttons.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The label. There is no `SelectValue` part — render the selected option's text here. An `aria-label` replaces it in the accessible name, so include the value in it (`Model: Opus 5`).",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged after the ghost treatment.",
		},
		restRow("ComponentProps<typeof Select.Trigger>", "trigger"),
	];

	const selectContentProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the list, typed as Bits UI types it.",
		},
		{
			prop: "align",
			type: "'start' | 'center' | 'end'",
			default: '"center"',
			description:
				"Which edge of the trigger the list aligns to. Neither this part nor the registry `Select.Content` sets a default; Bits UI's floating layer centres the list under the trigger.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The items.",
		},
		restRow("ComponentProps<typeof Select.Content>", "list"),
	];

	const selectItemProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the item, typed as Bits UI types it.",
		},
		{
			prop: "value",
			type: "string",
			default: "— (required)",
			description: "What the select's `value` becomes when this item is picked.",
		},
		{
			prop: "label",
			type: "string",
			default: "—",
			description:
				"The text typeahead matches against, and the rendered text when there are no children. Pass it whenever the children are not the raw value.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "—",
			description: "The item is shown but cannot be picked or focused.",
		},
		{
			prop: "children",
			type: "Snippet<[{ selected: boolean; highlighted: boolean }]>",
			default: "—",
			description: "Custom item content; falls back to `label`, then `value`.",
		},
		restRow("ComponentProps<typeof Select.Item>", "item"),
	];

	const keyboard = [
		{
			keys: "Enter",
			description:
				"Requests a form submission (`form.requestSubmit()`), which calls `onSubmit` unless the draft is whitespace, the composer is disabled, `PromptInput.Submit` is disabled or is a stop button (`status` generating with `onStop`), or a previous promise is pending.",
		},
		{
			keys: "Shift + Enter",
			description: "Inserts a line break. The textarea grows to `max-h-48`, then scrolls.",
		},
		{
			keys: "Enter during IME composition",
			description:
				"Commits the candidate and does not submit. Both `KeyboardEvent.isComposing` and the composition events are checked, so the Enter Safari delivers after `compositionend` is ignored too.",
		},
		{
			keys: "Enter with `event.preventDefault()` in `onkeydown`",
			description: "Does nothing. The caller's handler runs first and its veto wins.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "PromptInput.Root", values: "prompt-input" },
		{ attribute: "[data-slot]", part: "PromptInput.Body", values: "prompt-input-body" },
		{
			attribute: "[data-slot]",
			part: "PromptInput.Textarea",
			values:
				"input-group-control — kept from `InputGroup.Textarea`: the group's focus ring keys on it",
		},
		{ attribute: "[data-slot]", part: "PromptInput.Header", values: "prompt-input-header" },
		{ attribute: "[data-slot]", part: "PromptInput.Footer", values: "prompt-input-footer" },
		{ attribute: "[data-slot]", part: "PromptInput.Tools", values: "prompt-input-tools" },
		{ attribute: "[data-slot]", part: "PromptInput.Button", values: "prompt-input-button" },
		{ attribute: "[data-slot]", part: "PromptInput.Submit", values: "prompt-input-submit" },
		{
			attribute: "[data-slot]",
			part: "PromptInput.SelectTrigger / .SelectContent / .SelectItem",
			values:
				"select-trigger / select-content / select-item — kept from `ui/select`: `app.css` sizes and de-shadows them by name",
		},
		{
			attribute: "[data-disabled]",
			part: "PromptInput.Root and the inner InputGroup",
			values: "true | absent",
		},
		{
			attribute: "[data-pending]",
			part: "PromptInput.Root",
			values: "true while a promise-returning `onSubmit` is awaited | absent",
		},
		{
			attribute: "[data-status]",
			part: "PromptInput.Submit",
			values: "submitted | streaming | ready | error",
		},
		{
			attribute: "[data-align]",
			part: "PromptInput.Header / .Footer",
			values: "block-start / block-end — from the addon",
		},
		{
			attribute: "[data-size]",
			part: "PromptInput.Button / .Submit / .SelectTrigger",
			values: "the resolved size — from `Button` and `Select.Trigger`",
		},
	];
</script>

<DocPage title="Prompt input">
	{#snippet subtitle()}
		The chat composer: a form around an
		<a class="text-primary underline underline-offset-3" href={href("/components/input-group")}>
			input group
		</a>
		with a growing textarea, rows of tools above and below it, and a submit button that becomes a stop
		button while a turn is generating. Enter submits, Shift+Enter breaks the line, and IME composition
		is left alone. Attachments and the action menu that opens the file dialog are the documented follow-up
		of this port.
	{/snippet}

	<DocSection title="Composer">
		{#snippet blurb()}
			The composer from the reference chat: a model picker, an effort picker, a reasoning toggle and
			the submit button, all in the footer. Sending runs a simulated round trip through
			<code>submitted</code> and <code>streaming</code>; the toggle group sets the status by hand.
			While the submit button is a stop button, Enter is refused by the component itself; the
			textarea's <code>onkeydown</code> veto shown here is the reference's workaround, kept as the demonstration
			of the caller-side hook.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<PromptInput.Root onSubmit={composerSend}>
					<PromptInput.Body>
						<PromptInput.Textarea
							placeholder="Ask anything… (Shift+Enter for a new line)"
							onkeydown={(event) => {
								// While a turn is streaming, Enter must not submit — the draft would be sent
								// on top of the reply still arriving.
								if (composerBusy && event.key === "Enter" && !event.shiftKey) {
									event.preventDefault();
								}
							}}
						/>
					</PromptInput.Body>
					<PromptInput.Footer>
						<PromptInput.Tools>
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
							<PromptInput.Select bind:value={effort}>
								<PromptInput.SelectTrigger aria-label="Effort: {effortLabel}">
									{effortLabel}
								</PromptInput.SelectTrigger>
								<PromptInput.SelectContent>
									{#each efforts as level (level.id)}
										<PromptInput.SelectItem value={level.id} label={level.label} />
									{/each}
								</PromptInput.SelectContent>
							</PromptInput.Select>
							<PromptInput.Button
								variant={showReasoning ? "secondary" : "ghost"}
								aria-pressed={showReasoning}
								onclick={() => (showReasoning = !showReasoning)}
								tooltip={showReasoning ? "Reasoning summary shown" : "Reasoning summary hidden"}
							>
								<BrainIcon data-icon="inline-start" />
								<span>Reasoning</span>
							</PromptInput.Button>
						</PromptInput.Tools>
						<PromptInput.Submit status={composerStatus} onStop={composerStop} />
					</PromptInput.Footer>
				</PromptInput.Root>

				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="flex items-center gap-2">
						<span class="text-xs tracking-label text-muted-foreground uppercase">Status</span>
						<ToggleGroup.Root
							type="single"
							variant="outline"
							size="sm"
							bind:value={() => composerStatus, (next) => (composerStatus = toChatStatus(next))}
						>
							{#each CHAT_STATUSES as status (status)}
								<ToggleGroup.Item value={status}>{status}</ToggleGroup.Item>
							{/each}
						</ToggleGroup.Root>
					</div>
					{#if composerLast}
						<p class="text-sm text-muted-foreground">
							Sent <span class="text-foreground">“{composerLast.text}”</span> to
							{composerLast.model}, {composerLast.effort.toLowerCase()}, reasoning
							{composerLast.reasoning ? "on" : "off"}.
						</p>
					{:else}
						<p class="text-sm text-muted-foreground">Nothing sent yet.</p>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Bound value">
		{#snippet blurb()}
			<code>value</code> is bindable, so the page owns the draft: a counter reads it, the starter
			chips write it, and <code>onValueChange</code> fires for the reader's edits and for the clear a
			submission performs, never for a parent-driven write — a chip click does not move the counter.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div class="flex flex-wrap items-center gap-2">
					{#each AI_CHAT_STARTERS as starter (starter)}
						<Button variant="outline" size="xs" onclick={() => (draft = starter)}>
							<SparklesIcon data-icon="inline-start" />
							{starter}
						</Button>
					{/each}
				</div>
				<PromptInput.Root
					bind:value={draft}
					onValueChange={() => draftChanges++}
					onSubmit={() => {}}
				>
					<PromptInput.Body>
						<PromptInput.Textarea maxlength={DRAFT_LIMIT} />
					</PromptInput.Body>
					<PromptInput.Footer>
						<PromptInput.Tools>
							<span class="px-1 text-xs text-muted-foreground tabular-nums">
								{draft.length} / {DRAFT_LIMIT}
							</span>
							<Badge variant="outline">{draftChanges} edits</Badge>
						</PromptInput.Tools>
						<PromptInput.Submit disabled={draft.trim().length === 0} />
					</PromptInput.Footer>
				</PromptInput.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Message list">
		{#snippet blurb()}
			<code>onSubmit</code> returns a promise here: the draft stays on screen while it is pending —
			the form carries <code>data-pending</code> — and is cleared only once it resolves, and only if it
			was not edited in the meantime: type the next message while the first is in flight and it survives.
			A rejection would keep the draft so the reader can retry.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				{#if sent.length === 0}
					<p class="text-sm text-muted-foreground">No messages yet — send one below.</p>
				{:else}
					<ol class="flex flex-col gap-2">
						{#each sent as message (message.id)}
							<li
								class="flex items-start justify-between gap-3 rounded-md bg-muted px-3 py-2 text-sm"
							>
								<span class="whitespace-pre-wrap">{message.text}</span>
								<span class="shrink-0 text-xs text-muted-foreground tabular-nums">{message.at}</span
								>
							</li>
						{/each}
					</ol>
				{/if}
				<PromptInput.Root onSubmit={appendMessage} class="data-pending:opacity-70">
					<PromptInput.Body>
						<PromptInput.Textarea placeholder="Type a message and press Enter" />
					</PromptInput.Body>
					<PromptInput.Footer>
						<PromptInput.Tools>
							<Button variant="ghost" size="sm" onclick={() => (sent = [])}>Clear list</Button>
						</PromptInput.Tools>
						<PromptInput.Submit />
					</PromptInput.Footer>
				</PromptInput.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltips and header">
		{#snippet blurb()}
			<code>PromptInput.Button</code> takes a <code>tooltip</code> — a string, or an object with a
			<code>shortcut</code>
			and a <code>side</code>. An icon-only button says
			<code>size="icon-sm"</code> and names itself with <code>aria-label</code>; the tooltip
			describes, it does not name. <code>PromptInput.Header</code> is the row above the textarea.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<PromptInput.Root onSubmit={() => {}}>
					<PromptInput.Header>
						<Badge variant="outline">Project: Parallax</Badge>
						<Badge variant="outline">3 files in context</Badge>
					</PromptInput.Header>
					<PromptInput.Body>
						<PromptInput.Textarea />
					</PromptInput.Body>
					<PromptInput.Footer>
						<PromptInput.Tools>
							<PromptInput.Button size="icon-sm" aria-label="Attach files" tooltip="Attach files">
								<PaperclipIcon />
							</PromptInput.Button>
							<PromptInput.Button
								variant={webSearch ? "secondary" : "ghost"}
								aria-pressed={webSearch}
								onclick={() => (webSearch = !webSearch)}
								tooltip={{ content: "Search the web", shortcut: "⌘K", side: "bottom" }}
							>
								<GlobeIcon data-icon="inline-start" />
								<span>Search</span>
							</PromptInput.Button>
							<PromptInput.Button
								size="icon-sm"
								variant={listening ? "secondary" : "ghost"}
								aria-label="Dictate"
								aria-pressed={listening}
								onclick={() => (listening = !listening)}
								tooltip={{ content: listening ? "Stop dictation" : "Dictate", shortcut: "⌘⇧D" }}
							>
								<MicIcon />
							</PromptInput.Button>
						</PromptInput.Tools>
						<PromptInput.Submit />
					</PromptInput.Footer>
				</PromptInput.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled">
		{#snippet blurb()}
			<code>disabled</code> on the root inerts the textarea, the submit button and every submission path,
			and dims the header and footer through the input group. The tools are left to the caller — a disabled
			composer may still want its model picker usable.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<PromptInput.Root
					disabled
					value="A draft that cannot be sent right now."
					onSubmit={() => {}}
				>
					<PromptInput.Body>
						<PromptInput.Textarea />
					</PromptInput.Body>
					<PromptInput.Footer>
						<PromptInput.Tools>
							<PromptInput.Select value="sonnet-5">
								<PromptInput.SelectTrigger aria-label="Model: Sonnet 5"
									>Sonnet 5</PromptInput.SelectTrigger
								>
								<PromptInput.SelectContent>
									{#each models as model (model.id)}
										<PromptInput.SelectItem value={model.id} label={model.label} />
									{/each}
								</PromptInput.SelectContent>
							</PromptInput.Select>
							<PromptInput.Button disabled>
								<BrainIcon data-icon="inline-start" />
								<span>Reasoning</span>
							</PromptInput.Button>
						</PromptInput.Tools>
						<PromptInput.Submit />
					</PromptInput.Footer>
				</PromptInput.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">PromptInput.Root</h3>
			<p class="text-sm text-muted-foreground">
				The composer. Renders a <code>form</code> around an <code>InputGroup</code>, owns the draft,
				publishes the context every other part reads, and handles the submit event.
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
			<h3 class="text-base font-medium">PromptInput.Body</h3>
			<p class="text-sm text-muted-foreground">
				The middle of the composer. Renders a <code>div</code> with <code>display: contents</code>,
				so the textarea stays a direct flex child of the input group.
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
							{#each bodyProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PromptInput.Textarea</h3>
			<p class="text-sm text-muted-foreground">
				The draft field. Renders an <code>InputGroup.Textarea</code> bound to the root's
				<code>value</code>, sized by its content up to <code>max-h-48</code>, and turns Enter into a
				form submission.
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
							{#each textareaProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PromptInput.Header</h3>
			<p class="text-sm text-muted-foreground">
				The row above the textarea. Renders an <code>InputGroup.Addon</code> aligned
				<code>block-start</code> that wraps its children.
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
							{#each headerProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PromptInput.Footer</h3>
			<p class="text-sm text-muted-foreground">
				The row below the textarea. Renders an <code>InputGroup.Addon</code> aligned
				<code>block-end</code> with its children pushed to the two edges.
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
							{#each footerProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PromptInput.Tools</h3>
			<p class="text-sm text-muted-foreground">
				The left-hand cluster of the footer. Renders a <code>div</code> laying its children out in a
				row; <code>min-w-0</code> lets it shrink before the submit button does.
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
							{#each toolsProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PromptInput.Button</h3>
			<p class="text-sm text-muted-foreground">
				A tool button. Renders a ghost <code>Button</code> of <code>type="button"</code> on the 32px
				rung, optionally wrapped in a <code>Tooltip</code>.
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
							{#each buttonProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PromptInput.Submit</h3>
			<p class="text-sm text-muted-foreground">
				The send button, which is also the stop button. Renders a primary
				<code>Button size="icon-sm"</code> whose icon follows <code>status</code>; a disabled
				composer disables it.
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
							{#each submitProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PromptInput.Select</h3>
			<p class="text-sm text-muted-foreground">
				A picker in the tools row. Renders no element — it is
				<a class="text-primary underline underline-offset-3" href={href("/components/select")}>
					Select
				</a>'s root, single selection only. There is no <code>SelectValue</code> part: the trigger renders
				its children as the label.
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
							{#each selectProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PromptInput.SelectTrigger</h3>
			<p class="text-sm text-muted-foreground">
				The picker's button. Renders <code>Select.Trigger</code> as a ghost: no border, no fill, muted
				ink that turns to page ink on hover and while open.
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
							{#each selectTriggerProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PromptInput.SelectContent</h3>
			<p class="text-sm text-muted-foreground">
				The picker's list. Renders <code>Select.Content</code> untouched, in a portal.
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
							{#each selectContentProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PromptInput.SelectItem</h3>
			<p class="text-sm text-muted-foreground">
				One option. Renders <code>Select.Item</code> untouched, with its check mark when selected.
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
							{#each selectItemProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Keyboard interactions</h3>
			<p class="text-sm text-muted-foreground">
				All in <code>PromptInput.Textarea</code>. The selects and tooltips keep Bits UI's own
				contracts.
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
