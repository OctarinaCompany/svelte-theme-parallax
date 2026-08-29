<script lang="ts">
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Status from "$lib/components/ui/status/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Tool from "$lib/components/ui/tool/index.js";
	import { href } from "$lib/hooks/route.svelte.js";
	import {
		isToolStateActive,
		TOOL_PART_STATES,
		TOOL_STATE_LABELS,
		toolStateVariant,
	} from "$lib/shared/chat-parts.js";
	import {
		TOOL_SAMPLE_DYNAMIC,
		TOOL_SAMPLE_PARTIAL_ERROR,
		TOOL_SAMPLE_PARTS,
		TOOL_SAMPLE_TEXT_OUTPUT,
		TOOL_SAMPLE_TYPED,
	} from "./tool-sample-parts.js";

	/**
	 * The Tool component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART: it predates chat transcripts. What there is to review
	 * here is how the seven tool states land on the five `Status` families — the mapping in
	 * `src/lib/shared/chat-parts.ts` — and whether a JSON tree and a code block read as one object
	 * inside a bordered, collapsible card. The "Every state" section is the one to check first in a
	 * new palette: it is the only place in the gallery where all five status pills sit in a column.
	 */

	let controlledOpen = $state(true);

	const stateRows = TOOL_PART_STATES.map((state) => ({
		state,
		label: TOOL_STATE_LABELS[state],
		variant: toolStateVariant(state),
		pulses: isToolStateActive(state) ? "yes" : "no",
	}));

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "type",
			type: "string",
			default: "—",
			description:
				"The part type the SDK stamps: `dynamic-tool`, or `tool-<name>`. The name printed in the header is derived from it; a value in neither shape prints as it is.",
		},
		{
			prop: "state",
			type: "ToolPartState",
			default: "—",
			description:
				"Where the call is in its life. Chooses the badge's label and Status variant, whether its dot pulses, and the value of `data-tool-state`. A state outside the seven prints itself on a `default` badge.",
		},
		{
			prop: "toolName",
			type: "string",
			default: "—",
			description:
				"The name a dynamic part carries beside its type. Required when `type` is `dynamic-tool` — in development the root throws at mount without it. Ignored for a typed part.",
		},
		{
			prop: "title",
			type: "string",
			default: "—",
			description:
				"Replaces the derived name in the header only; `data-tool-name` keeps the name derived from `type` and `toolName`. It also claims the HTML `title` attribute — the root renders no browser tooltip of its own.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "false",
			description:
				"Whether the content is expanded. Bindable. A parent-driven write moves the content without firing `onOpenChange`.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description:
				"Fired when the header toggles the content, or when a part calls `setOpen` with a different value. Never fired for a parent-driven write.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description:
				"The Collapsible primitive's own prop, passed through: the content stays where it is and the trigger leaves the tab order. Stamps `data-disabled` on the root.",
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
			description: "A `Tool.Header` and a `Tool.Content`, in that order.",
		},
		{
			prop: "...restProps",
			type: "WithoutChild<CollapsiblePrimitive.RootProps>",
			default: "—",
			description:
				"Every other attribute and DOM handler is spread onto the Collapsible root, including the primitive's `onOpenChangeComplete`.",
		},
	];

	const headerProps = [
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
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
				"Replaces the left cluster — the wrench and the name. The status badge and the chevron on the right are always rendered.",
		},
		{
			prop: "...restProps",
			type: "WithoutChild<CollapsiblePrimitive.TriggerProps>",
			default: "—",
			description:
				"Every other attribute and DOM handler is spread onto the trigger button. `aria-expanded` and `data-state` are stamped by the Collapsible.",
		},
	];

	const contentProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the collapsible element.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Applied to the collapsible element, which is hidden while closed; the padding and the rule sit on an inner box.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The body — usually a `Tool.Input` and a `Tool.Output`.",
		},
		{
			prop: "...restProps",
			type: "WithoutChildrenOrChild<CollapsiblePrimitive.ContentProps>",
			default: "—",
			description:
				"Every other attribute and DOM handler is spread onto the collapsible element, including the primitive's `forceMount`.",
		},
	];

	const inputProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. `null` while nothing renders.",
		},
		{
			prop: "input",
			type: "unknown",
			default: "—",
			description:
				"What the model passed to the tool. A string renders as plain text in a code block without a gutter; any other value — object, array, number, boolean, `null` — renders as a fully expanded JSON tree that re-seeds when the value changes. `undefined` renders nothing.",
		},
		{
			prop: "label",
			type: "string",
			default: "'Parameters'",
			description:
				"The micro-label above the value. Doubles as the code block's accessible name when the input is a string.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the base classes.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const outputProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. `null` while nothing renders.",
		},
		{
			prop: "output",
			type: "unknown",
			default: "—",
			description:
				"What the tool returned. A string renders as plain text in a code block; any other value renders as a JSON tree, fully expanded like `Tool.Input`. Both are capped at 20rem and scroll. `undefined` renders nothing unless `errorText` or `children` is set.",
		},
		{
			prop: "errorText",
			type: "string",
			default: "—",
			description:
				"Why the call failed. Rendered as a destructive-subtle block above the output — a call that failed after a partial result shows both — and flips the default `label` to `Error`. Stamps `data-error` on the root.",
		},
		{
			prop: "label",
			type: "string",
			default: "'Result' | 'Error'",
			description:
				"The micro-label above the value: `Result`, or `Error` when `errorText` is set. Doubles as the code block's accessible name when the output is a string.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the built-in rendering of `output` and `errorText`; the label stays. Supplying it forces the part to render even when both are absent.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the base classes.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "Tool.Root", values: "tool" },
		{ attribute: "[data-slot]", part: "Tool.Header", values: "tool-header" },
		{ attribute: "[data-slot]", part: "Tool.Content", values: "tool-content" },
		{ attribute: "[data-slot]", part: "Tool.Input", values: "tool-input" },
		{ attribute: "[data-slot]", part: "Tool.Output", values: "tool-output" },
		{
			attribute: "[data-tool-state]",
			part: "Tool.Root",
			values:
				"input-streaming | input-available | approval-requested | approval-responded | output-available | output-denied | output-error",
		},
		{
			attribute: "[data-tool-name]",
			part: "Tool.Root",
			values: "the name derived from `type` and `toolName` — never `title`, which is display copy",
		},
		{
			attribute: "[data-state]",
			part: "Tool.Root, Tool.Header, Tool.Content",
			values: "open | closed — stamped by the Collapsible",
		},
		{
			attribute: "[data-disabled]",
			part: "Tool.Root, Tool.Header, Tool.Content",
			values: "present while `disabled`",
		},
		{ attribute: "[data-error]", part: "Tool.Output", values: "present while `errorText` is set" },
	];

	const keyboard = [
		{
			keys: "Tab",
			description:
				"Moves focus to the header, then — when the content is open — into the JSON tree's controls and the code block's scroller.",
		},
		{
			keys: "Enter / Space",
			description: "On the header, toggles the content and fires `onOpenChange`.",
		},
	];
</script>

<DocPage title="Tool">
	{#snippet subtitle()}
		A collapsible card for one tool call in a chat transcript: the tool's name and state in a
		header, what went in and what came out in the body. The state badge is a
		<a class="text-primary underline underline-offset-3" href={href("/components/status")}>Status</a
		>, and <code>Tool.Input</code> renders through the
		<a class="text-primary underline underline-offset-3" href={href("/components/json-viewer")}
			>JSON viewer</a
		>
		for a live value and the
		<a class="text-primary underline underline-offset-3" href={href("/components/code-block")}
			>Code block</a
		>
		for text. The two states that wait on a person are what
		<a class="text-primary underline underline-offset-3" href={href("/components/confirmation")}
			>Confirmation</a
		> gates on.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			A completed call, closed. <code>Tool.Root</code> takes the part's <code>type</code> and
			<code>state</code>; the header reads both from context and needs no props of its own.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<Tool.Root type={TOOL_SAMPLE_TYPED.type} state={TOOL_SAMPLE_TYPED.state}>
					<Tool.Header />
					<Tool.Content>
						<Tool.Input input={TOOL_SAMPLE_TYPED.input} />
						<Tool.Output
							output={TOOL_SAMPLE_TYPED.output}
							errorText={TOOL_SAMPLE_TYPED.errorText}
						/>
					</Tool.Content>
				</Tool.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Every state">
		{#snippet blurb()}
			The seven states in the order a call travels through them. The two working states pulse; the
			state that asks a person for a decision is <code>warning</code>, and once they have answered
			it drops back to <code>info</code>; the three outcomes are <code>success</code>,
			<code>warning</code> and <code>destructive</code>. Open the last one to see the error block.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<div class="flex flex-col">
					{#each TOOL_SAMPLE_PARTS as part, i (part.state)}
						<Tool.Root
							type={part.type}
							state={part.state}
							toolName={part.toolName}
							class={i === TOOL_SAMPLE_PARTS.length - 1 ? "mb-0" : undefined}
						>
							<Tool.Header />
							<Tool.Content>
								<Tool.Input input={part.input} />
								<Tool.Output output={part.output} errorText={part.errorText} />
							</Tool.Content>
						</Tool.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Typed and dynamic parts">
		{#snippet blurb()}
			A typed part carries its name in its <code>type</code> — <code>tool-getWeather</code> — and a
			dynamic one carries the literal <code>dynamic-tool</code> with the name in
			<code>toolName</code>. The header prints the same thing for both, and
			<code>title</code> replaces it when the caller has a better caption than an identifier.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<div class="flex flex-col">
					<Tool.Root type={TOOL_SAMPLE_TYPED.type} state={TOOL_SAMPLE_TYPED.state} open>
						<Tool.Header />
						<Tool.Content>
							<Tool.Input input={TOOL_SAMPLE_TYPED.input} />
							<Tool.Output output={TOOL_SAMPLE_TYPED.output} />
						</Tool.Content>
					</Tool.Root>

					<Tool.Root
						type={TOOL_SAMPLE_DYNAMIC.type}
						toolName={TOOL_SAMPLE_DYNAMIC.toolName}
						state={TOOL_SAMPLE_DYNAMIC.state}
					>
						<Tool.Header />
						<Tool.Content>
							<Tool.Input input={TOOL_SAMPLE_DYNAMIC.input} />
							<Tool.Output output={TOOL_SAMPLE_DYNAMIC.output} />
						</Tool.Content>
					</Tool.Root>

					<Tool.Root
						type={TOOL_SAMPLE_DYNAMIC.type}
						toolName={TOOL_SAMPLE_DYNAMIC.toolName}
						state={TOOL_SAMPLE_DYNAMIC.state}
						title="Read CONVENTIONS.md"
						class="mb-0"
					>
						<Tool.Header />
						<Tool.Content>
							<Tool.Input input={TOOL_SAMPLE_DYNAMIC.input} />
							<Tool.Output output={TOOL_SAMPLE_DYNAMIC.output} />
						</Tool.Content>
					</Tool.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Output variants">
		{#snippet blurb()}
			<code>Tool.Output</code> reads the shape of what it is given: a live value becomes a JSON
			tree, a string becomes plain text in a code block, and <code>errorText</code> becomes a
			destructive block that sits above whatever partial result arrived with it. A
			<code>children</code> snippet replaces all of that for a result that deserves its own component.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<div class="flex flex-col">
					<Tool.Root type={TOOL_SAMPLE_TYPED.type} state={TOOL_SAMPLE_TYPED.state} open>
						<Tool.Header />
						<Tool.Content>
							<Tool.Output output={TOOL_SAMPLE_TYPED.output} />
						</Tool.Content>
					</Tool.Root>

					<Tool.Root type={TOOL_SAMPLE_TEXT_OUTPUT.type} state={TOOL_SAMPLE_TEXT_OUTPUT.state} open>
						<Tool.Header />
						<Tool.Content>
							<Tool.Input input={TOOL_SAMPLE_TEXT_OUTPUT.input} />
							<Tool.Output output={TOOL_SAMPLE_TEXT_OUTPUT.output} />
						</Tool.Content>
					</Tool.Root>

					<Tool.Root
						type={TOOL_SAMPLE_PARTIAL_ERROR.type}
						state={TOOL_SAMPLE_PARTIAL_ERROR.state}
						open
					>
						<Tool.Header />
						<Tool.Content>
							<Tool.Input input={TOOL_SAMPLE_PARTIAL_ERROR.input} />
							<Tool.Output
								output={TOOL_SAMPLE_PARTIAL_ERROR.output}
								errorText={TOOL_SAMPLE_PARTIAL_ERROR.errorText}
							/>
						</Tool.Content>
					</Tool.Root>

					<Tool.Root
						type={TOOL_SAMPLE_TYPED.type}
						state={TOOL_SAMPLE_TYPED.state}
						open
						class="mb-0"
					>
						<Tool.Header>
							<div class="flex min-w-0 items-center gap-2">
								<span class="truncate text-sm font-medium">Weather in Lyon</span>
								<span class="text-xs text-muted-foreground">custom header</span>
							</div>
						</Tool.Header>
						<Tool.Content>
							<Tool.Output output={TOOL_SAMPLE_TYPED.output} label="Forecast">
								<div class="flex flex-wrap gap-2">
									{#each ["Tue 24° / 14°", "Wed 22° / 13°", "Thu 19° / 11°"] as day (day)}
										<Status.Root variant="info">
											<Status.Label>{day}</Status.Label>
										</Status.Root>
									{/each}
								</div>
							</Tool.Output>
						</Tool.Content>
					</Tool.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled open">
		{#snippet blurb()}
			Bind <code>open</code> to drive the content from outside — a transcript that expands the
			running call and folds the finished ones. <code>onOpenChange</code> fires when the header toggles
			it, never when the button below writes it.
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
					<Tool.Root
						type={TOOL_SAMPLE_TYPED.type}
						state={TOOL_SAMPLE_TYPED.state}
						bind:open={controlledOpen}
						class="mb-0"
					>
						<Tool.Header />
						<Tool.Content>
							<Tool.Input input={TOOL_SAMPLE_TYPED.input} />
							<Tool.Output output={TOOL_SAMPLE_TYPED.output} />
						</Tool.Content>
					</Tool.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="State to variant">
		{#snippet blurb()}
			How each <code>state</code> lands on the badge. The mapping is
			<code>toolStateVariant</code> in <code>src/lib/shared/chat-parts.ts</code>, shared with
			Confirmation and Prompt input, and an unknown state falls back to the neutral pill rather than
			throwing.
		{/snippet}

		<Card.Root>
			<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>State</Table.Head>
							<Table.Head>Label</Table.Head>
							<Table.Head>Status variant</Table.Head>
							<Table.Head>Pulses</Table.Head>
							<Table.Head>Badge</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each stateRows as row (row.state)}
							<Table.Row>
								<Table.Cell class="font-medium">{row.state}</Table.Cell>
								<Table.Cell>{row.label}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{row.variant}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{row.pulses}</Table.Cell>
								<Table.Cell>
									<Status.Root variant={row.variant}>
										<Status.Indicator pulse={row.pulses === "yes"} />
										<Status.Label>{row.label}</Status.Label>
									</Status.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Tool.Root</h3>
			<p class="text-sm text-muted-foreground">
				The card. Renders a Collapsible root — a bordered <code>div</code> — that owns the call's identity
				and publishes it on context, and stamps the state and the resolved name as data attributes.
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
			<h3 class="text-base font-medium">Tool.Header</h3>
			<p class="text-sm text-muted-foreground">
				The trigger. Renders a full-width <code>button</code> carrying the wrench and the name on the
				left, and the state badge and a chevron on the right. Everything it prints is read from the root.
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
			<h3 class="text-base font-medium">Tool.Content</h3>
			<p class="text-sm text-muted-foreground">
				The body. Renders a Collapsible content element — hidden while closed — around a padded
				column with a rule above it.
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
			<h3 class="text-base font-medium">Tool.Input</h3>
			<p class="text-sm text-muted-foreground">
				What went into the call. Renders a micro-label over a JSON viewer for a live value or a code
				block for a string; renders nothing for <code>undefined</code>.
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
							{#each inputProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Tool.Output</h3>
			<p class="text-sm text-muted-foreground">
				What came out of the call. Renders a micro-label over an error block, a JSON viewer or a
				code block — or the caller's own snippet — and renders nothing while there is neither an
				output nor an error.
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
							{#each outputProps as row (row.prop)}
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
				The header is a native button, so the Collapsible's contract is the button's own.
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
