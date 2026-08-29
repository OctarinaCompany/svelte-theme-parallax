<script lang="ts">
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Reasoning from "$lib/components/ui/reasoning/index.js";
	import { REASONING_AUTO_CLOSE_MS } from "$lib/components/ui/reasoning/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { AI_CHAT_TRANSCRIPT, type AiChatPart } from "$lib/data/ai-chat.js";
	import { href } from "$lib/hooks/route.svelte.js";
	import { ReasoningStreamSimulation } from "./reasoning-sample-stream.svelte.js";

	/**
	 * The Reasoning component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART: it predates chat transcripts. What there is to review
	 * here is timing rather than paint — whether the panel opens on the first streamed word, folds
	 * itself one second after the last, and stays put once a reader has touched it. The
	 * "Simulated stream" section is the one to watch: it drives every transition the component
	 * has from two buttons, with the bound values printed beside it.
	 */

	type ReasoningPart = Extract<AiChatPart, { type: "reasoning" }>;

	/** The transcript's one reasoning part: the thought behind the model-comparison answer. */
	const reasoningPart = AI_CHAT_TRANSCRIPT.flatMap((message) => message.parts).find(
		(part): part is ReasoningPart => part.type === "reasoning",
	);
	const REASONING_TEXT = reasoningPart?.text ?? "";
	const REASONING_DURATION = reasoningPart?.durationSeconds;

	/** A thought with Markdown in it, for the custom-message section. */
	const MARKDOWN_THOUGHT = `**Two representations, one dataset.**

1. Build the table first — it is what the reader will check the CSV against.
2. Keep the column order identical in both, so \`context_window\` is the second field in each.
3. Cite the models overview page once, under the table, rather than per row.`;

	// Two simulations rather than one shared between sections: the veto section has to start a
	// stream of its own to show the panel NOT opening, and a shared stream would open the other.
	const stream = new ReasoningStreamSimulation(REASONING_TEXT);
	const vetoStream = new ReasoningStreamSimulation(REASONING_TEXT, 60);

	let streamOpen = $state(false);
	let streamDuration = $state<number | undefined>(undefined);
	let openChanges = $state(0);

	// The close timer lives in the root's `ReasoningState`, which is context for the parts and out
	// of the page's reach. Its public surface is the `data-pending-close` attribute the root
	// stamps, so the readout reads that off the DOM the way a stylesheet or a test would, and
	// follows it through a MutationObserver: `bind:ref` hands over the element, not its
	// attributes, and a plain read would not update when the timer arms or clears.
	let streamRoot = $state<HTMLDivElement | null>(null);
	let streamPendingClose = $state(false);

	$effect(() => {
		const root = streamRoot;
		if (!root) {
			streamPendingClose = false;
			return;
		}
		const read = () => {
			streamPendingClose = root.hasAttribute("data-pending-close");
		};
		read();
		const observer = new MutationObserver(read);
		observer.observe(root, { attributes: true, attributeFilter: ["data-pending-close"] });
		return () => observer.disconnect();
	});

	let vetoOpen = $state(false);

	let controlledOpen = $state(true);

	function resetStream(): void {
		stream.reset();
		streamOpen = false;
		streamDuration = undefined;
		openChanges = 0;
	}

	function resetVeto(): void {
		vetoStream.reset();
		vetoOpen = false;
	}

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "isStreaming",
			type: "boolean",
			default: "false",
			description:
				"Whether the model is still writing the thought. The first `true` starts the clock and opens the panel unless `defaultOpen` is `false`; the `false` after it writes `duration` and arms the auto-close. Stamped as `data-streaming`.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "defaultOpen ?? isStreaming",
			description:
				"Whether the content is expanded. Bindable. A parent-driven write moves the content without firing `onOpenChange` and without counting as a reader's toggle.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description:
				"Fired when the trigger toggles the panel, when the root auto-opens it on the first streamed word, and when it auto-closes it after the stream. Never fired for a parent-driven write.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "—",
			description:
				"A seed, read once when `open` is not bound. `false` also vetoes auto-open for the life of the instance; `true` mounts it open; leaving it out mounts it open exactly when `isStreaming` already is.",
		},
		{
			prop: "duration",
			type: "number",
			default: "—",
			description:
				"How long the thought took, in whole seconds. Bindable. Written by the root when a stream it watched ends — `Math.ceil` of the elapsed time, so never 0 — otherwise the caller's, for a replayed transcript. `undefined` or a non-positive value prints as “a few seconds”.",
		},
		{
			prop: "onDurationChange",
			type: "(duration: number | undefined) => void",
			default: "—",
			description: "Fired when the root measures a stream, never for a parent-driven write.",
		},
		{
			prop: "autoCloseDelay",
			type: "number",
			default: "REASONING_AUTO_CLOSE_MS (1000)",
			description:
				"Milliseconds between the stream stopping and the panel folding itself. Read when the timer is armed, so a change mid-window does not move a timer already running.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description:
				"The Collapsible primitive's own prop, passed through: the trigger leaves the tab order and the content stays where it is. Auto-open and auto-close still move `open`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the base classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "A `Reasoning.Trigger` and a `Reasoning.Content`, in that order.",
		},
		{
			prop: "...restProps",
			type: "WithoutChild<CollapsiblePrimitive.RootProps>",
			default: "—",
			description:
				"Every other attribute and DOM handler is spread onto the Collapsible root, including the primitive's `onOpenChangeComplete`.",
		},
	];

	const triggerProps = [
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{
			prop: "message",
			type: "Snippet<[{ isStreaming: boolean; duration: number | undefined }]>",
			default: "—",
			description:
				"Replaces the text between the brain and the chevron. Receives whether the thought is streaming and its duration in whole seconds, or `undefined` when nobody measured it. Ignored when `children` is given.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the base classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				'Replaces the whole row — brain, text and chevron. Without it the default row renders: the shimmering “Thinking…” while streaming — a `role="status"` live region labelled “Thinking”, so a screen reader hears the model start — else “Thought for N seconds” with a singular for 1 and “a few seconds” when the duration is unknown. A replacement row carries no live region of its own.',
		},
		{
			prop: "...restProps",
			type: "WithoutChild<CollapsiblePrimitive.TriggerProps>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the trigger button.",
		},
	];

	const contentProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "content",
			type: "string",
			default: "—",
			description:
				"The thought, as Markdown, rendered through `Message.Response`. Pass the part's `text` as it streams; only the trailing blocks are re-lexed, and an unfinished construct is closed so partial text renders as prose. Words blur in while the root's `isStreaming` is `true`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the base classes.",
		},
		{
			prop: "...restProps",
			type: "WithoutChildrenOrChild<CollapsiblePrimitive.ContentProps>",
			default: "—",
			description:
				"Every other attribute and DOM handler is spread onto the Collapsible content, including the primitive's `forceMount` and `hiddenUntilFound`.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "Reasoning.Root", values: "reasoning" },
		{ attribute: "[data-slot]", part: "Reasoning.Trigger", values: "reasoning-trigger" },
		{ attribute: "[data-slot]", part: "Reasoning.Content", values: "reasoning-content" },
		{
			attribute: "[data-streaming]",
			part: "Reasoning.Root",
			values: "present while `isStreaming`",
		},
		{
			attribute: "[data-pending-close]",
			part: "Reasoning.Root",
			values:
				"present while the close timer is armed — from the stream stopping until the panel folds itself, the reader toggles it, or streaming resumes",
		},
		{
			attribute: "[data-state]",
			part: "Reasoning.Root, Reasoning.Trigger, Reasoning.Content",
			values: "open | closed — stamped by the Collapsible",
		},
		{
			attribute: "[data-disabled]",
			part: "Reasoning.Root, Reasoning.Trigger, Reasoning.Content",
			values: "present while `disabled`",
		},
	];

	const stateMachine = [
		{
			event: "Mount",
			condition: "`open` not bound",
			effect:
				"`open` seeds to `defaultOpen ?? isStreaming`; “has streamed” seeds to `isStreaming`. No callback fires.",
		},
		{
			event: "`isStreaming` → true",
			condition: "always",
			effect:
				"The clock starts if it is not running, a pending close timer is cancelled (`data-pending-close` is removed) and “has streamed” is set. The panel opens — `onOpenChange(true)` — unless it already is or `defaultOpen` was `false`. This is the only moment the root opens the panel: a reader who collapses it mid-stream is not overridden.",
		},
		{
			event: "`isStreaming` → false",
			condition: "the clock is running",
			effect:
				"`duration` becomes `Math.ceil(elapsed / 1000)` and `onDurationChange` fires. The clock stops.",
		},
		{
			event: "`isStreaming` → false",
			condition: "has streamed, open, never auto-closed, never toggled by the reader",
			effect:
				"A close timer is armed for `autoCloseDelay` milliseconds and `data-pending-close` is stamped on the root for as long as it runs.",
		},
		{
			event: "Close timer fires",
			condition: "still open, not streaming, still untouched",
			effect:
				"`data-pending-close` is removed, `open` becomes `false` and `onOpenChange(false)` fires. The instance never auto-closes again.",
		},
		{
			event: "Trigger toggled",
			condition: "always",
			effect:
				"The instance is marked as touched and a pending close timer is cancelled (`data-pending-close` is removed); `onOpenChange` fires with the new value. Auto-open on the next stream is still honoured.",
		},
		{
			event: "Parent writes `open`",
			condition: "always",
			effect: "The panel moves. No callback fires and the timers are untouched.",
		},
		{
			event: "Unmount",
			condition: "a close timer is armed",
			effect: "The timer is cleared; nothing writes to the unmounted instance.",
		},
	];

	const keyboard = [
		{
			keys: "Tab",
			description:
				"Moves focus to the trigger, then — when the content is open — into any focusable the rendered Markdown carries, such as a code block's scroller.",
		},
		{
			keys: "Enter / Space",
			description:
				"On the trigger, toggles the content, fires `onOpenChange` and marks the panel as touched, which cancels a pending auto-close.",
		},
	];
</script>

<DocPage title="Reasoning">
	{#snippet subtitle()}
		A model's thought in a chat transcript: a one-line trigger that shimmers while the model is
		thinking and says how long it thought once it has stopped, over a collapsible body rendered as
		Markdown through
		<a class="text-primary underline underline-offset-3" href={href("/components/message")}
			>Message</a
		>. The panel opens itself on the first streamed word and folds itself a second after the last,
		unless the reader has touched it. The shimmer is a
		<a class="text-primary underline underline-offset-3" href={href("/components/text-gradient")}
			>Text gradient</a
		>. Reach for
		<a class="text-primary underline underline-offset-3" href={href("/components/collapsible")}
			>Collapsible</a
		>
		when the content is a section, not a thought; for a tool call, the sibling
		<a class="text-primary underline underline-offset-3" href={href("/components/tool")}>Tool</a>
		carries the state badge this one has no use for.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			A finished thought, replayed with the duration the transcript recorded. Nothing streamed, so
			nothing auto-opens or auto-closes: the panel is the reader's to fold.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<Reasoning.Root duration={REASONING_DURATION}>
					<Reasoning.Trigger />
					<Reasoning.Content content={REASONING_TEXT} />
				</Reasoning.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Simulated stream">
		{#snippet blurb()}
			<code>Start</code> flips <code>isStreaming</code> and appends a word every 90 ms. The panel
			opens on the first word, the words blur in, the trigger shimmers, and one second after the
			last word the panel folds itself and the measured <code>duration</code> takes the shimmer's
			place. Toggle it by hand during the stream and it stays where you left it.
			<code>Reset</code> mounts a fresh instance, the way a transcript keys each thought by its
			message id — auto-close fires once per instance. <code>pendingClose</code> in the readout is
			the root's
			<code>data-pending-close</code> attribute, read off the DOM: it is present for the one second the
			close timer runs.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div class="flex flex-wrap items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onclick={() => stream.start()}
							disabled={stream.streaming}
						>
							Start
						</Button>
						<Button variant="ghost" size="sm" onclick={resetStream}>Reset</Button>
						<span class="text-sm text-muted-foreground">
							isStreaming: <code>{String(stream.streaming)}</code> · open:
							<code>{String(streamOpen)}</code> · duration:
							<code>{streamDuration === undefined ? "undefined" : `${streamDuration} s`}</code> ·
							pendingClose: <code>{String(streamPendingClose)}</code> · onOpenChange:
							<code>{openChanges}</code>
						</span>
					</div>
					{#key stream.run}
						<Reasoning.Root
							bind:ref={streamRoot}
							isStreaming={stream.streaming}
							bind:open={streamOpen}
							bind:duration={streamDuration}
							onOpenChange={() => (openChanges += 1)}
						>
							<Reasoning.Trigger />
							<Reasoning.Content content={stream.text} />
						</Reasoning.Root>
					{/key}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled open">
		{#snippet blurb()}
			Bind <code>open</code> to drive the panel from outside — a transcript that folds every thought
			once the answer arrives. <code>onOpenChange</code> fires when the trigger toggles it or the root
			moves it itself, never when the button below writes it.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div class="flex flex-wrap items-center gap-3">
						<Button variant="outline" size="sm" onclick={() => (controlledOpen = !controlledOpen)}>
							{controlledOpen ? "Collapse" : "Expand"} from outside
						</Button>
						<span class="text-sm text-muted-foreground">
							open: <code>{String(controlledOpen)}</code>
						</span>
					</div>
					<Reasoning.Root bind:open={controlledOpen} duration={REASONING_DURATION}>
						<Reasoning.Trigger />
						<Reasoning.Content content={REASONING_TEXT} />
					</Reasoning.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Explicitly closed">
		{#snippet blurb()}
			<code>defaultOpen={"{false}"}</code> is a veto, not just a seed: the stream below runs to its end
			and the panel never opens on its own. The clock still runs, so the trigger still reports how long
			the thought took. Open it by hand and it stays open — a reader's toggle is never undone by the auto-close.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div class="flex flex-wrap items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onclick={() => vetoStream.start()}
							disabled={vetoStream.streaming}
						>
							Start
						</Button>
						<Button variant="ghost" size="sm" onclick={resetVeto}>Reset</Button>
						<span class="text-sm text-muted-foreground">
							isStreaming: <code>{String(vetoStream.streaming)}</code> · open:
							<code>{String(vetoOpen)}</code>
						</span>
					</div>
					{#key vetoStream.run}
						<Reasoning.Root
							isStreaming={vetoStream.streaming}
							defaultOpen={false}
							bind:open={vetoOpen}
						>
							<Reasoning.Trigger />
							<Reasoning.Content content={vetoStream.text} />
						</Reasoning.Root>
					{/key}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom message">
		{#snippet blurb()}
			The <code>message</code> snippet replaces the text between the brain and the chevron and is handed
			what the default text is built from. The body is Markdown: a bold lead, an ordered list and inline
			code, rendered by the same pipeline as an answer.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<Reasoning.Root duration={12} defaultOpen>
					<Reasoning.Trigger>
						{#snippet message({ isStreaming, duration })}
							<span>
								{#if isStreaming}
									Working through it…
								{:else if duration === undefined}
									Reasoned briefly
								{:else}
									Reasoned in {duration} s before answering
								{/if}
							</span>
						{/snippet}
					</Reasoning.Trigger>
					<Reasoning.Content content={MARKDOWN_THOUGHT} />
				</Reasoning.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="State machine">
		{#snippet blurb()}
			Every transition the root makes, in the order a stream produces them. The auto-close delay is <code
				>REASONING_AUTO_CLOSE_MS</code
			>
			— {REASONING_AUTO_CLOSE_MS} ms — and is exported for a transcript that times something against it.
		{/snippet}

		<Card.Root>
			<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Event</Table.Head>
							<Table.Head>Condition</Table.Head>
							<Table.Head>Effect</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each stateMachine as row (`${row.event}-${row.condition}`)}
							<Table.Row>
								<Table.Cell class="font-medium">{row.event}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{row.condition}</Table.Cell>
								<Table.Cell>{row.effect}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Reasoning.Root</h3>
			<p class="text-sm text-muted-foreground">
				The Collapsible that owns the thought's state: whether it is streaming, whether it is open,
				how long it took. Renders a <code>div</code>, publishes a
				<code>ReasoningState</code> on context for the parts, and runs the auto-open, stopwatch and auto-close.
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
			<h3 class="text-base font-medium">Reasoning.Trigger</h3>
			<p class="text-sm text-muted-foreground">
				The Collapsible trigger — a native <code>button</code> — carrying a brain icon, the thinking
				message and a chevron that turns while the panel is open. Everything it prints is read off
				the root's context, so it takes no props of its own. While streaming, the message is a
				<code>role="status"</code> live region, the way the Loader's text shimmer is.
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
							{#each triggerProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Reasoning.Content</h3>
			<p class="text-sm text-muted-foreground">
				The collapsible body. Renders the Collapsible content with the thought inside it as
				Markdown, through <code>Message.Response</code>, in muted small type.
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
				The trigger is a native button, so the Collapsible's contract is the button's own.
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
