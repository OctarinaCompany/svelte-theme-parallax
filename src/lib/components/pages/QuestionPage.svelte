<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as JsonViewer from "$lib/components/ui/json-viewer/index.js";
	import * as Question from "$lib/components/ui/question/index.js";
	import {
		EMPTY_QUESTION_VALUE,
		type QuestionResponse,
		type QuestionValue,
	} from "$lib/components/ui/question/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";
	import { askUserQuestionSample } from "./question-sample-ask-user.js";

	/**
	 * The Question component page — the form an assistant hands the reader when it needs an answer
	 * before it can go on. Ported from Vercel AI Elements' `question.tsx`; the root part's header
	 * comment lists what diverges.
	 */

	/** The last submitted response of the first demo, echoed through the JSON viewer. */
	let singleResponse = $state<QuestionResponse | undefined>(undefined);

	/**
	 * What the viewer shows: the response as it would travel — `JSON.stringify` drops the
	 * `text: undefined` key the way a wire payload would, which is the honest echo of a response
	 * whose `text` is optional.
	 */
	const singleEcho = $derived(
		singleResponse === undefined ? undefined : JSON.parse(JSON.stringify(singleResponse)),
	);

	let multipleResponse = $state<QuestionResponse | undefined>(undefined);

	/** The controlled demo's value, seeded with an answer so the Reset button has work to do. */
	let controlledValue = $state<QuestionValue>({
		selectedValues: ["Weekly"],
		text: "Mondays before 9am, please.",
	});

	/** How many times the controlled form notified — a parent-driven Reset must not count. */
	let controlledChanges = $state(0);

	/** The responses of the "ask the user" demo, one slot per question. */
	let askUserResponses = $state<(QuestionResponse | undefined)[]>(
		askUserQuestionSample.map(() => undefined),
	);

	function describe(response: QuestionResponse | undefined): string {
		if (response === undefined) return "Nothing submitted yet.";
		const picked = response.selectedValues.length > 0 ? response.selectedValues.join(", ") : "—";
		return response.text === undefined ? picked : `${picked} · “${response.text}”`;
	}

	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLFormElement | null",
			default: "null",
			description: "Bindable reference to the rendered form.",
		},
		{
			prop: "value",
			type: "QuestionValue",
			default: "defaultValue ?? EMPTY_QUESTION_VALUE",
			description:
				"Bindable. What the reader has chosen and typed. Every reader-driven change replaces it with a new object — it is never mutated — and a parent-driven write is reflected by every part without firing `onValueChange`.",
		},
		{
			prop: "onValueChange",
			type: "(value: QuestionValue) => void",
			default: "—",
			description:
				"Fired with the next value after an option toggles or the text changes. Not fired for a parent-driven write, nor when the text is set to what it already is.",
		},
		{
			prop: "defaultValue",
			type: "QuestionValue",
			default: "EMPTY_QUESTION_VALUE",
			description:
				"Seed for an unbound `value`, read once on mount. Ignored when `value` is supplied; changing it later leaves the reader's answer alone.",
		},
		{
			prop: "selectionMode",
			type: "'single' | 'multiple'",
			default: "'single'",
			description:
				"`single` keeps at most one option and clicking the selected one clears it; `multiple` toggles membership. An unknown runtime value normalises to `single`. Changing it does not prune an existing multi-selection.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Disables every option, the input and the submit button, ignores `toggle` / `setText` from context, and drops a submit.",
		},
		{
			prop: "onSubmit",
			type: "(response: QuestionResponse, event: SubmitEvent) => void | Promise<void>",
			default: "—",
			description:
				"Called on submit with the selection as is and the text trimmed (`undefined` when blank), after `preventDefault()`. Not called while disabled, nor when nothing is selected and the text is blank. A returned promise is not awaited.",
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
			description: "The parts, in any order.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLFormAttributes, 'onsubmit'>",
			default: "—",
			description:
				"Spread onto the form. `onsubmit` is not accepted — the form owns it; use `onSubmit`.",
		},
	];

	const paragraphProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLParagraphElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
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
			description: "Rendered inside the element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLParagraphElement>",
			default: "—",
			description: "Spread onto the element.",
		},
	];

	const promptProps: PropRow[] = [
		paragraphProps[0]!,
		{
			prop: "id",
			type: "string",
			default: "$props.id()",
			description:
				"The paragraph's id, published on the question state while the prompt is mounted so `Question.Options` can point `aria-labelledby` at it. A caller's id is used as is; changing it re-registers. A second prompt takes the name over.",
		},
		...paragraphProps.slice(1),
	];

	const optionsProps: PropRow[] = [
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
			description: "Merged last, so it overrides the base classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The `Question.Option` buttons.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the element. `onfocusin`, `onfocusout` and `onmousedown` run before the roving-focus handlers and may `preventDefault()` to skip them.",
		},
	];

	const optionProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{
			prop: "value",
			type: "string",
			default: "—",
			description:
				"Required. The option's identity in `selectedValues`, and its label when `children` is omitted. Two options sharing a value select together.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "'default' while selected, 'outline' otherwise",
			description: "Overrides the selected / unselected pair with one fixed look.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'default'",
			description:
				"The button size. The height is `h-auto` whatever the size says, so a wrapped label grows the button.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "—",
			description:
				"Disables this option alone; the root's `disabled` disables it as well. A disabled option is skipped by the arrow keys.",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler",
			default: "—",
			description:
				"Runs before the toggle. `preventDefault()` vetoes it, leaving the selection unchanged.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged after the button variant classes and `h-auto whitespace-normal`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "the value",
			description: "The label. Omit it to show `value` as the text.",
		},
		{
			prop: "...restProps",
			type: "Omit<ButtonProps, 'value' | 'href' | 'type' | 'role' | 'aria-checked'>",
			default: "—",
			description:
				"Spread onto the button. `role`, `aria-checked`, `type` and `tabindex` are the part's own.",
		},
	];

	const inputProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLTextAreaElement | null",
			default: "null",
			description: "Bindable reference to the rendered textarea.",
		},
		{
			prop: "placeholder",
			type: "string",
			default: "'Type your answer…'",
			description: "The textarea placeholder.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "—",
			description: "Disables the textarea alone; the root's `disabled` disables it as well.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged after the textarea classes and `min-h-20`.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLTextareaAttributes, 'value'>",
			default: "—",
			description:
				"Spread onto the textarea. `value` is not accepted — the text lives on the root's `value`.",
		},
	];

	const actionsProps: PropRow[] = [
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
			description: "Merged last, so it overrides the base classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The buttons — `Question.Submit` and whatever sits beside it.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the element.",
		},
	];

	const submitProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "—",
			description:
				"Disables the button in addition to the two built-in reasons: the root is disabled, or nothing is selected and the text is blank.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "'Submit'",
			description: "The label.",
		},
		{
			prop: "...restProps",
			type: "Omit<ButtonProps, 'href' | 'type'>",
			default: "—",
			description: "Spread onto the button. `type` is always `submit`.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "Question", values: "question" },
		{ attribute: "[data-slot]", part: "Question.Prompt", values: "question-prompt" },
		{ attribute: "[data-slot]", part: "Question.Description", values: "question-description" },
		{ attribute: "[data-slot]", part: "Question.Options", values: "question-options" },
		{ attribute: "[data-slot]", part: "Question.Option", values: "question-option" },
		{ attribute: "[data-slot]", part: "Question.Input", values: "question-input" },
		{ attribute: "[data-slot]", part: "Question.Actions", values: "question-actions" },
		{ attribute: "[data-slot]", part: "Question.Submit", values: "question-submit" },
		{
			attribute: "[data-selection-mode]",
			part: "Question, Question.Options",
			values: "single | multiple",
		},
		{ attribute: "[data-disabled]", part: "Question", values: "present while disabled" },
		{
			attribute: "[data-has-response]",
			part: "Question",
			values: "present while an option is selected or the text is not blank",
		},
		{ attribute: "[data-selected]", part: "Question.Option", values: "present while selected" },
		{ attribute: "[role]", part: "Question.Options", values: "radiogroup | group" },
		{
			attribute: "[aria-labelledby]",
			part: "Question.Options",
			values: "the `id` of the mounted Question.Prompt; absent without one",
		},
		{ attribute: "[id]", part: "Question.Prompt", values: "the `id` prop, else a generated id" },
		{ attribute: "[role]", part: "Question.Option", values: "radio | checkbox" },
		{ attribute: "[aria-checked]", part: "Question.Option", values: "true | false" },
	];

	const keyboard = [
		{
			keys: "Tab",
			description:
				"In single mode the option row is one stop, landing on the selected option or the first enabled one; in multiple mode every option is a stop. Then the input, then the submit button.",
		},
		{
			keys: "ArrowLeft / ArrowUp, ArrowRight / ArrowDown",
			description:
				'Previous / next enabled option in single mode — both axes, so a wrapped row and a stacked one behave alike — wrapping at the ends, the horizontal pair inverted under `dir="rtl"`. Focus only — the selection does not follow. No effect in multiple mode.',
		},
		{ keys: "Home / End", description: "First / last enabled option in single mode." },
		{
			keys: "Space / Enter",
			description:
				"Toggles the focused option through native button semantics. In single mode, Space or Enter on the selected option clears the selection.",
		},
		{
			keys: "Enter in the input",
			description: "Inserts a newline — the input is a textarea. Submit with the button.",
		},
	];
</script>

<DocPage title="Question">
	{#snippet subtitle()}
		A question the assistant puts to the reader mid-conversation: a prompt, a row of options, an
		optional free-text answer and a submit button, rendered as one form. For a yes-or-no gate on a
		tool call, use
		<a class="text-primary underline underline-offset-3" href={href("/components/confirmation")}
			>Confirmation</a
		> instead.
	{/snippet}

	<DocSection title="Single choice with free text">
		{#snippet blurb()}
			The default. At most one option is selected and clicking it again clears it, because the
			free-text field is an answer too. The submit button stays disabled until either is filled; the
			response echoes below as it would travel — the text trimmed, and absent when blank.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<Question.Root
						onSubmit={(response) => {
							singleResponse = response;
						}}
					>
						<Question.Prompt>How should the report be delivered?</Question.Prompt>
						<Question.Description>
							Pick a channel, or describe another one in your own words.
						</Question.Description>
						<Question.Options>
							<Question.Option value="Email" />
							<Question.Option value="Slack" />
							<Question.Option value="Download link" />
						</Question.Options>
						<Question.Input />
						<Question.Actions>
							<Question.Submit />
						</Question.Actions>
					</Question.Root>

					{#if singleEcho === undefined}
						<p class="text-sm text-muted-foreground">Nothing submitted yet.</p>
					{:else}
						<JsonViewer.Root data={singleEcho} title="Response" defaultExpanded={true} />
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Multiple choice">
		{#snippet blurb()}
			<code>selectionMode="multiple"</code> turns the options into checkboxes: each toggles on its own,
			each is a tab stop, and the response carries them in the order they were picked.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<Question.Root
						selectionMode="multiple"
						onSubmit={(response) => {
							multipleResponse = response;
						}}
					>
						<Question.Prompt>Which checks should run before the merge?</Question.Prompt>
						<Question.Options>
							<Question.Option value="Lint" />
							<Question.Option value="Unit tests" />
							<Question.Option value="Integration tests" />
							<Question.Option value="Type check" />
						</Question.Options>
						<Question.Actions>
							<Question.Submit>Run checks</Question.Submit>
						</Question.Actions>
					</Question.Root>
					<p class="text-sm text-muted-foreground">{describe(multipleResponse)}</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled">
		{#snippet blurb()}
			Bind <code>value</code> to own the answer. A parent-driven write — the Reset button here — is
			reflected by every part without firing <code>onValueChange</code>, so the change counter only
			moves for the reader's own edits.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<Question.Root
						bind:value={controlledValue}
						onValueChange={() => (controlledChanges += 1)}
						onSubmit={() => {
							controlledValue = EMPTY_QUESTION_VALUE;
						}}
					>
						<Question.Prompt>How often should the digest be sent?</Question.Prompt>
						<Question.Options>
							<Question.Option value="Daily" />
							<Question.Option value="Weekly" />
							<Question.Option value="Monthly" />
						</Question.Options>
						<Question.Input placeholder="Any preferred time?" />
						<Question.Actions>
							<Button
								type="button"
								variant="ghost"
								onclick={() => (controlledValue = EMPTY_QUESTION_VALUE)}
							>
								Reset
							</Button>
							<Question.Submit>Save</Question.Submit>
						</Question.Actions>
					</Question.Root>
					<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
						<dt class="text-muted-foreground">Selected</dt>
						<dd>{controlledValue.selectedValues.join(", ") || "—"}</dd>
						<dt class="text-muted-foreground">Text</dt>
						<dd>{controlledValue.text || "—"}</dd>
						<dt class="text-muted-foreground">Reader changes</dt>
						<dd>{controlledChanges}</dd>
					</dl>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Ask the user">
		{#snippet blurb()}
			An agent's "ask the user" tool call carries a question, a short header, options with a line of
			context each and a <code>multiSelect</code> flag. One <code>Question</code> per call covers
			the shape: the header is the micro-label, the description sits inside the option button, and
			<code>multiSelect</code>
			maps to <code>selectionMode</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					{#each askUserQuestionSample as ask, index (ask.header)}
						<Question.Root
							selectionMode={ask.multiSelect ? "multiple" : "single"}
							onSubmit={(response) => {
								askUserResponses[index] = response;
							}}
						>
							<span class="text-xs tracking-label text-muted-foreground uppercase">
								{ask.header}
							</span>
							<Question.Prompt>{ask.question}</Question.Prompt>
							<Question.Options class="flex-col items-stretch">
								{#each ask.options as option (option.label)}
									<Question.Option value={option.label} class="flex-col items-start text-start">
										<span>{option.label}</span>
										<span class="text-xs font-normal opacity-80">{option.description}</span>
									</Question.Option>
								{/each}
							</Question.Options>
							<Question.Actions>
								<Question.Submit>Answer</Question.Submit>
							</Question.Actions>
						</Question.Root>
						<p class="text-sm text-muted-foreground">{describe(askUserResponses[index])}</p>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled">
		{#snippet blurb()}
			<code>disabled</code> on the root makes the whole form inert — a question already answered, or one
			the assistant withdrew — while keeping the answer visible.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Question.Root disabled defaultValue={{ selectedValues: ["Approve"], text: "" }}>
					<Question.Prompt>Approve the migration plan?</Question.Prompt>
					<Question.Description>Answered — this question is closed.</Question.Description>
					<Question.Options>
						<Question.Option value="Approve" />
						<Question.Option value="Request changes" />
					</Question.Options>
					<Question.Input />
					<Question.Actions>
						<Question.Submit />
					</Question.Actions>
				</Question.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Question</h3>
			<p class="text-sm text-muted-foreground">
				The form. Owns the value, publishes it on context and runs the submit guard. Renders a
				<code>form</code>.
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
			<h3 class="text-base font-medium">Question.Prompt</h3>
			<p class="text-sm text-muted-foreground">
				The question itself, in the form's lead weight. Renders a <code>p</code> whose
				<code>id</code> names the option row: <code>Question.Options</code> points its
				<code>aria-labelledby</code> at it while the prompt is mounted.
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
							{#each promptProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Question.Description</h3>
			<p class="text-sm text-muted-foreground">
				Supporting copy under the prompt, in the muted ink. Renders a <code>p</code> and takes the
				same props as <code>Question.Prompt</code>.
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
							{#each paragraphProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Question.Options</h3>
			<p class="text-sm text-muted-foreground">
				The wrapping row of options. Renders a <code>div</code> that is a
				<code>radiogroup</code> in single mode — one tab stop, arrows on either axis between the
				options — and a <code>group</code> in multiple mode, named by <code>Question.Prompt</code>
				through <code>aria-labelledby</code> in both.
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
							{#each optionsProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Question.Option</h3>
			<p class="text-sm text-muted-foreground">
				One choice. Renders a <code>Button</code> that is a <code>radio</code> or a
				<code>checkbox</code> by mode, painted <code>default</code> while selected and
				<code>outline</code> while not, with a height that follows a wrapped label.
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
							{#each optionProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Question.Input</h3>
			<p class="text-sm text-muted-foreground">
				The free-text answer. Renders the house <code>Textarea</code> bound to the root's
				<code>text</code>.
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
			<h3 class="text-base font-medium">Question.Actions</h3>
			<p class="text-sm text-muted-foreground">
				The end-aligned button row at the foot of the form. Renders a <code>div</code>.
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
			<h3 class="text-base font-medium">Question.Submit</h3>
			<p class="text-sm text-muted-foreground">
				The submit button. Renders a <code>Button</code> of <code>type="submit"</code>, disabled
				until the reader has answered.
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
				In single mode the option row follows the WAI-ARIA radio group's focus contract — one stop,
				arrows between the radios — without its selection-follows-focus rule, because the selected
				option can be cleared here.
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
