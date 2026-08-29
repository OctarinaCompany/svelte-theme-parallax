<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import TerminalIcon from "@lucide/svelte/icons/terminal";
	import XIcon from "@lucide/svelte/icons/x";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as CodeBlock from "$lib/components/ui/code-block/index.js";
	import * as Confirmation from "$lib/components/ui/confirmation/index.js";
	import {
		CONFIRMATION_PHASES,
		isConfirmationVisible,
		resolveConfirmationPhase,
		resolveConfirmationPhaseValue,
		type ConfirmationPhase,
	} from "$lib/components/ui/confirmation/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import { href } from "$lib/hooks/route.svelte.js";
	import {
		TOOL_PART_STATES,
		TOOL_STATE_LABELS,
		toolStateVariant,
		type ToolApproval,
		type ToolPartState,
	} from "$lib/shared/chat-parts.js";

	/**
	 * The Confirmation component page.
	 *
	 * The component reads a `(state, approval)` pair the AI SDK stamps on a tool part and renders
	 * one of three phases from it, so every demo on this page is a pair being edited: the toggle
	 * group writes one, the Approve / Reject buttons write one, and the matrix section enumerates
	 * every pair the SDK can produce and what each one renders.
	 */

	type Scenario = { state: ToolPartState; approval: ToolApproval | undefined };

	const APPROVAL_ID = "call_8f2a1c";

	/** The pair each phase is shown from — the settled ones at the outcome, not the response. */
	const SCENARIOS: Record<ConfirmationPhase, Scenario> = {
		request: { state: "approval-requested", approval: { id: APPROVAL_ID } },
		accepted: { state: "output-available", approval: { id: APPROVAL_ID, approved: true } },
		rejected: {
			state: "output-denied",
			approval: { id: APPROVAL_ID, approved: false, reason: "Build output is not disposable." },
		},
	};

	let scenario = $state<Scenario>(SCENARIOS.request);

	const phase = $derived(resolveConfirmationPhase(scenario.approval, scenario.state));

	const PHASE_LABELS: Record<ConfirmationPhase, string> = {
		request: "Request",
		accepted: "Accepted",
		rejected: "Rejected",
	};

	/**
	 * The toggle writes a whole pair; an empty value (the pressed item released) is ignored. The
	 * toggle group is bound through a function binding for that reason: the ignored write leaves
	 * `phase` unchanged, and the getter re-reads it so the pressed item snaps back instead of
	 * staying released while the card below still shows that phase.
	 */
	function showPhase(value: string) {
		const next = resolveConfirmationPhaseValue(value);
		if (next) scenario = SCENARIOS[next];
	}

	/**
	 * What a real handler does: `addToolApprovalResponse` in the SDK flips the state to
	 * `approval-responded` and stamps the answer at once; the outcome state arrives later, when
	 * the tool has run or been refused.
	 */
	function answer(approved: boolean) {
		scenario = {
			state: "approval-responded",
			approval: {
				id: APPROVAL_ID,
				approved,
				reason: approved ? undefined : "Build output is not disposable.",
			},
		};
	}

	/** The matrix: every SDK state against the three values `approved` can hold. */
	type MatrixCell = { label: string; variant: BadgeVariant };

	const APPROVED_VALUES: { heading: string; approved: boolean | undefined }[] = [
		{ heading: "approved: undefined", approved: undefined },
		{ heading: "approved: true", approved: true },
		{ heading: "approved: false", approved: false },
	];

	function matrixCell(state: ToolPartState, approved: boolean | undefined): MatrixCell {
		const approval: ToolApproval = { id: APPROVAL_ID, approved };
		if (!isConfirmationVisible(approval, state)) return { label: "hidden", variant: "outline" };
		const resolved = resolveConfirmationPhase(approval, state);
		switch (resolved) {
			case "request":
				return { label: "request", variant: "secondary" };
			case "accepted":
				return { label: "accepted", variant: "success-subtle" };
			case "rejected":
				return { label: "rejected", variant: "destructive-subtle" };
			default:
				return { label: "title only", variant: "outline" };
		}
	}

	const matrix = TOOL_PART_STATES.map((state) => ({
		state,
		cells: APPROVED_VALUES.map((column) => matrixCell(state, column.approved)),
	}));

	/** The tool-card sample: the same pair, driven by its own buttons. */
	let toolScenario = $state<Scenario>(SCENARIOS.request);

	const TOOL_INPUT = JSON.stringify({ command: "rm -rf build/", cwd: "/srv/app" }, null, 2);

	/** The badge the mock tool header wears — `toolStateVariant` read into the soft badge family. */
	const toolBadgeVariant = $derived.by((): BadgeVariant => {
		const variant = toolStateVariant(toolScenario.state);
		return variant === "default" ? "secondary" : `${variant}-subtle`;
	});

	function answerTool(approved: boolean) {
		toolScenario = {
			state: approved ? "output-available" : "output-denied",
			approval: { id: APPROVAL_ID, approved },
		};
	}

	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "state",
			type: "ToolPartState",
			default: "—",
			description:
				"The tool part's state, as the SDK stamps it. Required. `input-streaming` and `input-available` render nothing at all; the other five are read together with `approval` to pick the phase.",
		},
		{
			prop: "approval",
			type: "ToolApproval | undefined",
			default: "—",
			description:
				"The decision object. `undefined` renders nothing — the call needs no approval. `approved` undefined is the open question; `true` / `false` the answer. `reason` and `signature` are carried, not read.",
		},
		{
			prop: "variant",
			type: "AlertVariant",
			default: "—",
			description:
				"Overrides the Alert face. Unset, the phase picks it: `default` for a request, `success-subtle` once accepted, `destructive-subtle` once rejected, and `default` again when the pair is in no phase.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the Alert element. `null` while the root is hidden.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged after `flex flex-col gap-2` and the Alert variant classes, so it overrides both.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The title, the gated parts and the actions row. Not rendered while hidden.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				'Spread onto the Alert element last, after `data-slot`, `data-phase`, `data-variant` and Alert\'s own `role="alert"`, so any of them can be overridden — `role="status"` for a quiet list of settled ones.',
		},
	];

	const titleProps: PropRow[] = [
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
				"Merged after Alert.Description's classes and this part's `inline text-sm text-current`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The question. Rendered in every phase — the answer is read against it.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	/** `Request`, `Accepted` and `Rejected` take the same four props; only the gate differs. */
	function gatedProps(phaseName: ConfirmationPhase, layout: string): PropRow[] {
		return [
			{
				prop: "ref",
				type: "HTMLDivElement | null",
				default: "null",
				description: `Bindable reference to the rendered element. \`null\` outside the \`${phaseName}\` phase, when the element is not in the DOM.`,
			},
			{
				prop: "class",
				type: "ClassValue",
				default: "—",
				description: `Merged after \`${layout}\`.`,
			},
			{
				prop: "children",
				type: "Snippet",
				default: "—",
				description: `Rendered only while the root's phase is \`${phaseName}\`; otherwise nothing is mounted.`,
			},
			{
				prop: "...restProps",
				type: "HTMLAttributes<HTMLDivElement>",
				default: "—",
				description: "Every other attribute and DOM handler is spread onto the rendered element.",
			},
		];
	}

	const requestProps = gatedProps("request", "flex flex-col gap-2");
	const acceptedProps = gatedProps("accepted", "flex items-center gap-2 text-sm");
	const rejectedProps = gatedProps("rejected", "flex items-center gap-2 text-sm");

	const actionsProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered element. `null` outside the `request` phase.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged after `flex items-center justify-end gap-2 self-end`. `self-end` needs a flex-column parent — the root and `Request` both are.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The `Action` buttons. Rendered only while the phase is `request`, whether or not the row sits inside `Request`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const actionProps: PropRow[] = [
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "'default'",
			description:
				"Forwarded to Button untouched. By convention the affirmative answer is `default` and the refusal `outline`.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'sm'",
			description:
				"Forwarded to Button. The 32px rung of the control ramp, where upstream hand-sets `h-8`.",
		},
		{
			prop: "type",
			type: "HTMLButtonAttributes['type']",
			default: "'button'",
			description:
				"Forwarded to Button, so a confirmation inside a form never submits it by accident.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | HTMLAnchorElement | null",
			default: "null",
			description: "Bindable reference to the rendered element — an anchor when `href` is set.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The button label. Not gated on the phase; the `Actions` row it sits in is.",
		},
		{
			prop: "...restProps",
			type: "ButtonProps",
			default: "—",
			description:
				"Every other Button prop — `disabled`, `href`, `class`, `onclick` — passes through.",
		},
	];

	type HelperRow = { name: string; signature: string; description: string };

	const helpers: HelperRow[] = [
		{
			name: "resolveConfirmationPhase",
			signature: "(approval, state) => ConfirmationPhase | undefined",
			description:
				"The phase a pair is in: `request` for `approval-requested` with no answer; `accepted` for `true` in `approval-responded` / `output-available`; `rejected` for `false` in `approval-responded` / `output-denied`. Anything else, including a `true` in `output-denied`, is `undefined`.",
		},
		{
			name: "isConfirmationVisible",
			signature: "(approval, state) => boolean",
			description:
				"Whether the root renders at all: `false` without an approval or while the state is `input-streaming` / `input-available`.",
		},
		{
			name: "confirmationPhaseVariant",
			signature: "(phase) => AlertVariant",
			description:
				"`CONFIRMATION_PHASE_VARIANTS[phase]`, or `default` for `undefined`. What the root paints before its `variant` prop is applied.",
		},
		{
			name: "resolveConfirmationPhaseValue",
			signature: "(value?: string) => ConfirmationPhase | undefined",
			description:
				"Normalises an untyped string to a member of `CONFIRMATION_PHASES`. No default: an unknown value is `undefined`.",
		},
		{
			name: "getConfirmationContext",
			signature: "(part?: string) => ConfirmationState",
			description:
				"The root's state from context. Throws naming `part` when called outside `<Confirmation.Root>`. `useConfirmation()` is the upstream-named alias; `hasConfirmationContext()` the test.",
		},
	];

	type AttributeRow = { attribute: string; part: string; values: string };

	const dataAttributes: AttributeRow[] = [
		{
			attribute: "data-slot",
			part: "every part",
			values:
				"confirmation, confirmation-title, confirmation-request, confirmation-accepted, confirmation-rejected, confirmation-actions, confirmation-action",
		},
		{
			attribute: "data-phase",
			part: "Confirmation",
			values: "request | accepted | rejected — absent when the pair is in no phase",
		},
		{
			attribute: "data-variant",
			part: "Confirmation",
			values: "The Alert variant actually painted, after the `variant` override.",
		},
		{
			attribute: "data-size",
			part: "Confirmation.Action",
			values: "Button's own stamp: sm unless overridden.",
		},
	];
</script>

<DocPage title="Confirmation">
	{#snippet subtitle()}
		The approval card a tool call shows while it waits for a human, and the record of the answer
		afterwards. One <code>Alert</code> that reads the AI SDK's <code>state</code> and
		<code>approval</code> pair, resolves a phase from it and paints itself accordingly. Ported from AI
		Elements; the parts and their names are upstream's, the phase and the colour are not.
	{/snippet}

	<DocSection title="Phases">
		{#snippet blurb()}
			Pick a phase, or answer the question. The toggle writes a whole <code>(state, approval)</code>
			pair; the buttons do what a real handler does — flip the state to
			<code>approval-responded</code> and stamp the answer — and the card follows.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<ToggleGroup.Root
						type="single"
						variant="outline"
						class="shadow-none"
						bind:value={() => phase ?? "", (next) => showPhase(next)}
						aria-label="Confirmation phase"
					>
						{#each CONFIRMATION_PHASES as item (item)}
							<ToggleGroup.Item value={item}>{PHASE_LABELS[item]}</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
					<p class="text-xs tracking-label text-muted-foreground uppercase">
						state: {scenario.state} · approved: {String(scenario.approval?.approved)}
					</p>
				</div>

				<Confirmation.Root state={scenario.state} approval={scenario.approval}>
					<Confirmation.Title>
						Allow <strong>Bash</strong> to run <code>rm -rf build/</code>?
					</Confirmation.Title>
					<Confirmation.Request>
						<Confirmation.Actions>
							<Confirmation.Action variant="outline" onclick={() => answer(false)}>
								Reject
							</Confirmation.Action>
							<Confirmation.Action onclick={() => answer(true)}>Approve</Confirmation.Action>
						</Confirmation.Actions>
					</Confirmation.Request>
					<Confirmation.Accepted>
						<CheckIcon />
						<span>Approved</span>
					</Confirmation.Accepted>
					<Confirmation.Rejected>
						<XIcon />
						<span>Rejected{scenario.approval?.reason ? ` — ${scenario.approval.reason}` : ""}</span>
					</Confirmation.Rejected>
				</Confirmation.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Phase matrix">
		{#snippet blurb()}
			Every state the SDK stamps against the three values <code>approved</code> can hold, read
			through <code>resolveConfirmationPhase</code>. <em>Hidden</em> is the root rendering nothing;
			<em>title only</em> is a pair in no phase — the card and its title show, the gated parts do
			not. Without an <code>approval</code> object at all, every row is hidden.
		{/snippet}
		<Card.Root>
			<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>state</Table.Head>
							{#each APPROVED_VALUES as column (column.heading)}
								<Table.Head><code>{column.heading}</code></Table.Head>
							{/each}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each matrix as row (row.state)}
							<Table.Row>
								<Table.Cell class="font-medium"><code>{row.state}</code></Table.Cell>
								{#each row.cells as cell, index (index)}
									<Table.Cell>
										<Badge variant={cell.variant}>{cell.label}</Badge>
									</Table.Cell>
								{/each}
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Inside a tool card">
		{#snippet blurb()}
			Where the component lives in a transcript: under the tool call it is gating. The card here is
			a plain bordered block standing in for the
			<a class="text-primary underline underline-offset-3" href={href("/components/tool")}>Tool</a>
			component — a name, a status badge and the parameters, then the confirmation. Answering it settles
			the whole card.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div class="flex flex-col rounded-md border bg-card text-card-foreground">
					<div class="flex items-center gap-2 px-4 py-3">
						<TerminalIcon class="size-4 text-muted-foreground" />
						<span class="text-sm font-medium">Bash</span>
						<Badge variant={toolBadgeVariant} class="ml-auto">
							{TOOL_STATE_LABELS[toolScenario.state]}
						</Badge>
					</div>
					<div class="flex flex-col gap-3 border-t px-4 py-3">
						<CodeBlock.Root
							code={TOOL_INPUT}
							language="json"
							label="Parameters"
							showLineNumbers={false}
						/>
						<Confirmation.Root state={toolScenario.state} approval={toolScenario.approval}>
							<Confirmation.Title>
								This command deletes <code>build/</code> in <code>/srv/app</code>. Run it?
							</Confirmation.Title>
							<Confirmation.Request>
								<Confirmation.Actions>
									<Confirmation.Action variant="outline" onclick={() => answerTool(false)}>
										Reject
									</Confirmation.Action>
									<Confirmation.Action onclick={() => answerTool(true)}>Approve</Confirmation.Action
									>
								</Confirmation.Actions>
							</Confirmation.Request>
							<Confirmation.Accepted>
								<CheckIcon />
								<span>Approved</span>
							</Confirmation.Accepted>
							<Confirmation.Rejected>
								<XIcon />
								<span>Rejected</span>
							</Confirmation.Rejected>
						</Confirmation.Root>
					</div>
				</div>
				<div class="flex justify-end">
					<Button variant="ghost" size="sm" onclick={() => (toolScenario = SCENARIOS.request)}>
						Reset
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Variant override">
		{#snippet blurb()}
			The phase picks the
			<a class="text-primary underline underline-offset-3" href={href("/components/alert")}>Alert</a
			>
			variant; <code>variant</code> replaces the choice. A request for something destructive can wear
			the warning ground, and a settled answer can go back to the card ground when a transcript of tinted
			cards would be noise.
		{/snippet}
		<Card.Root>
			<Card.Content class="grid gap-4 md:grid-cols-2">
				<Confirmation.Root
					state="approval-requested"
					approval={{ id: "call_warn" }}
					variant="warning-subtle"
				>
					<Confirmation.Title>
						<strong>Bash</strong> wants to run <code>git push --force</code>. Continue?
					</Confirmation.Title>
					<Confirmation.Actions>
						<Confirmation.Action variant="outline">Reject</Confirmation.Action>
						<Confirmation.Action>Approve</Confirmation.Action>
					</Confirmation.Actions>
				</Confirmation.Root>
				<Confirmation.Root
					state="output-available"
					approval={{ id: "call_quiet", approved: true }}
					variant="default"
					role="status"
				>
					<Confirmation.Title
						>Allow <strong>Bash</strong> to run <code>npm test</code>?</Confirmation.Title
					>
					<Confirmation.Accepted>
						<CheckIcon />
						<span>Approved</span>
					</Confirmation.Accepted>
				</Confirmation.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Confirmation</h3>
			<p class="text-sm text-muted-foreground">
				The root. Renders an <code>Alert</code> whose variant follows the phase, publishes the pair on
				context for the gated parts, and renders nothing at all without an approval or before the call
				is ready to be approved.
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
			<h3 class="text-base font-medium">Confirmation.Title</h3>
			<p class="text-sm text-muted-foreground">
				The question. An <code>Alert.Description</code> rendered inline at <code>text-sm</code>, in
				the variant's own ink rather than the muted one. Shown in every phase.
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
							{#each titleProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Confirmation.Request</h3>
			<p class="text-sm text-muted-foreground">
				What shows while the question is open. A flex column <code>div</code>, mounted only in the
				<code>request</code> phase.
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
							{#each requestProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Confirmation.Accepted</h3>
			<p class="text-sm text-muted-foreground">
				The receipt for a <code>true</code> answer. A flex row <code>div</code> that sizes an
				unsized icon to 16px, mounted only in the <code>accepted</code> phase.
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
							{#each acceptedProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Confirmation.Rejected</h3>
			<p class="text-sm text-muted-foreground">
				The receipt for a <code>false</code> answer. The same row as <code>Accepted</code>, mounted
				only in the <code>rejected</code> phase.
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
							{#each rejectedProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Confirmation.Actions</h3>
			<p class="text-sm text-muted-foreground">
				The row of answers, right-aligned. A <code>div</code> mounted only in the
				<code>request</code> phase — its own gate, so it disappears with the answer even outside a
				<code>Request</code> wrapper.
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
			<h3 class="text-base font-medium">Confirmation.Action</h3>
			<p class="text-sm text-muted-foreground">
				One answer. A <code>Button</code> on the <code>sm</code> rung with
				<code>type="button"</code>, and nothing else of its own — keyboard behaviour is the native
				button's.
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
			<h3 class="text-base font-medium">Helpers</h3>
			<p class="text-sm text-muted-foreground">
				Exported from the barrel alongside the parts, with <code>CONFIRMATION_PHASES</code>,
				<code>CONFIRMATION_PHASE_VARIANTS</code> and the <code>ConfirmationState</code> class the root
				publishes.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Name</Table.Head>
								<Table.Head>Signature</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each helpers as row (row.name)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.name}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.signature}</Table.Cell>
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
