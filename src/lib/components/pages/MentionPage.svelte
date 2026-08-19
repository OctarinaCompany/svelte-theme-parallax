<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Mention from "$lib/components/ui/mention/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Mention component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The input half is a textarea, so it takes `app.css`'s
	 * `[data-slot='textarea']` treatment; the suggestion list is a portalled overlay, so it takes
	 * `--popover` and the radius scale like every menu in the theme.
	 *
	 * The highlighter that paints the mentions inside the textarea is the one novel surface, and it
	 * uses `--accent` — the same ground the classic theme gives a hovered menu item — rather than a colour
	 * of its own.
	 */

	const users = [
		{ id: "1", name: "Olivia Martin", email: "olivia@email.com" },
		{ id: "2", name: "Isabella Nguyen", email: "isabella@email.com" },
		{ id: "3", name: "Emma Wilson", email: "emma@email.com" },
		{ id: "4", name: "Jackson Lee", email: "jackson@email.com" },
		{ id: "5", name: "William Kim", email: "will@email.com" },
	];

	const commands = [
		{ id: "1", name: "help", description: "Show available commands" },
		{ id: "2", name: "clear", description: "Clear the console" },
		{ id: "3", name: "restart", description: "Restart the application" },
		{ id: "4", name: "reload", description: "Reload the current page" },
		{ id: "5", name: "quit", description: "Exit the application" },
	];

	let commandValue = $state<string[]>([]);
	let commandInputValue = $state("");

	/** Matches commands that start with the typed term, replacing the built-in fuzzy matcher. */
	function startsWithFilter(options: string[], term: string) {
		return options.filter((option) => option.toLowerCase().startsWith(term.toLowerCase()));
	}

	/** The `data-tag` styling the MDX documents as the root's styling API. */
	const tagClass =
		"**:data-tag:rounded **:data-tag:bg-info-subtle **:data-tag:py-px **:data-tag:text-info-subtle-foreground";

	const rootProps = [
		{
			prop: "value",
			type: "string[]",
			default: "defaultValue",
			description: "The inserted mentions, in insertion order. Bindable.",
		},
		{
			prop: "defaultValue",
			type: "string[]",
			default: "[]",
			description: "Seeds the value list while uncontrolled.",
		},
		{
			prop: "onValueChange",
			type: "(value: string[]) => void",
			default: "—",
			description: "Fires with the next list whenever a mention is inserted or removed.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "defaultOpen",
			description: "Whether the popup is open. Bindable.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Seeds the open state while uncontrolled.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description: "Fires on every open/close transition.",
		},
		{
			prop: "inputValue",
			type: "string",
			default: "''",
			description: "The field text. Bindable.",
		},
		{
			prop: "onInputValueChange",
			type: "(value: string) => void",
			default: "—",
			description: "Fires with the next field text.",
		},
		{
			prop: "trigger",
			type: "string",
			default: "'@'",
			description: "The character that opens the popup when typed at a word boundary.",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "inherited",
			description: "Overrides DirectionProvider and the inherited DOM dir; mirrors the alignment.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Suppresses typing, filtering and selection everywhere.",
		},
		{
			prop: "onFilter",
			type: "(options: string[], term: string) => string[]",
			default: "—",
			description: "Replaces the built-in matcher entirely; exactMatch is ignored alongside it.",
		},
		{
			prop: "exactMatch",
			type: "boolean",
			default: "false",
			description: "Substring matching instead of fuzzy matching.",
		},
		{
			prop: "loop",
			type: "boolean",
			default: "false",
			description: "Wraps the highlight around the ends of the list.",
		},
		{
			prop: "modal",
			type: "boolean",
			default: "false",
			description: "Locks page scroll, blocks outside pointers, and makes Tab select.",
		},
		{
			prop: "readonly",
			type: "boolean",
			default: "false",
			description: "An open popup can be viewed, but nothing is inserted or removed.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "Marks the hidden form control required.",
		},
		{
			prop: "name",
			type: "string",
			default: "—",
			description: "Submits the comma-joined value list inside a form ancestor.",
		},
		{
			prop: "id",
			type: "string",
			default: "$props.id()",
			description: "Every part's id derives from it.",
		},
	];

	const partProps = [
		{
			part: "Mention.Label",
			prop: "—",
			type: "HTMLLabelAttributes",
			default: "—",
			description: "Renders a <label> wired to the field with for/id.",
		},
		{
			part: "Mention.Input",
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the field onto your own element, normally a <textarea>.",
		},
		{
			part: "Mention.Portal",
			prop: "to",
			type: "Element | string",
			default: "document.body",
			description: "Where the popup is portalled to.",
		},
		{
			part: "Mention.Portal",
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Leaves the content in place instead of portalling it.",
		},
		{
			part: "Mention.Content",
			prop: "side",
			type: "'top' | 'right' | 'bottom' | 'left'",
			default: "'bottom'",
			description: "Preferred side of the caret to render against.",
		},
		{
			part: "Mention.Content",
			prop: "align",
			type: "'start' | 'center' | 'end'",
			default: "'start'",
			description: 'Preferred alignment; mirrored under dir="rtl".',
		},
		{
			part: "Mention.Content",
			prop: "sideOffset",
			type: "number",
			default: "4",
			description: "Distance in pixels between the caret and the popup.",
		},
		{
			part: "Mention.Content",
			prop: "fitViewport",
			type: "boolean",
			default: "false",
			description: "Clamps the popup to the space the viewport actually has.",
		},
		{
			part: "Mention.Content",
			prop: "forceMount",
			type: "boolean",
			default: "false",
			description: "Keeps the popup mounted while closed.",
		},
		{
			part: "Mention.Item",
			prop: "value",
			type: "string",
			default: "—",
			description: "Required, and never an empty string.",
		},
		{
			part: "Mention.Item",
			prop: "label",
			type: "string",
			default: "value",
			description: "The text spliced into the field after the trigger.",
		},
		{
			part: "Mention.Item",
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Skipped by navigation and inert to clicks.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-state]", on: "root, input, content", when: '"open" or "closed"' },
		{ attribute: "[data-disabled]", on: "root, input, item", when: "The element is disabled" },
		{ attribute: "[data-readonly]", on: "input", when: "The root is readonly" },
		{
			attribute: "[data-tag]",
			on: "the highlighter overlay",
			when: "A run of inserted mention text",
		},
		{ attribute: "[data-side]", on: "content", when: "Resolved placement side" },
		{ attribute: "[data-align]", on: "content", when: "Resolved alignment" },
		{ attribute: "[data-pasting]", on: "content", when: "A paste is being resolved" },
		{ attribute: "[data-value]", on: "item", when: "Always — the value of the item" },
		{ attribute: "[data-selected]", on: "item", when: "The item is in the value list" },
		{ attribute: "[data-highlighted]", on: "item", when: "The item is the active descendant" },
	];

	const keyboard = [
		{ keys: "<trigger>", action: "At a word boundary, opens the popup anchored to the caret." },
		{ keys: "ArrowDown / ArrowUp", action: "Moves the highlight one visible item at a time." },
		{
			keys: "Home / End",
			action: "Highlights the first / last item. Ctrl or Cmd moves the caret.",
		},
		{ keys: "Enter", action: "Selects the highlighted item; closes when nothing is highlighted." },
		{ keys: "Escape", action: "Closes the popup; the value and the focus stay put." },
		{ keys: "Tab", action: "Closes and lets focus move — or selects, when modal." },
		{ keys: "Backspace / Delete", action: "Removes an adjacent or selected mention in one edit." },
		{
			keys: "Ctrl/Cmd + Backspace",
			action: "Removes the nearest preceding mention, skipping its trailing space.",
		},
		{
			keys: "ArrowLeft / ArrowRight",
			action: "Steps over an adjacent mention; with Ctrl or Cmd, jumps to its exact edge.",
		},
	];
</script>

<DocPage title="Mention">
	{#snippet subtitle()}
		A text field that suggests and inserts mentions when a trigger character is typed at a word
		boundary. The popup follows the caret, and each inserted mention behaves as one atomic unit of
		text. This is the free-text half of type-to-pick: an @mention inline in prose — see the Combobox
		page for how the type-to-pick components divide their roles.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			Type @ to mention someone; the tags are styled through the data-tag attribute on the root.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Mention.Root class="max-w-[400px] {tagClass}">
					<Mention.Label>Mention users</Mention.Label>
					<Mention.Input placeholder="Type @ to mention someone...">
						{#snippet child({ props })}
							<textarea {...props} rows={3}></textarea>
						{/snippet}
					</Mention.Input>
					<Mention.Portal>
						<Mention.Content>
							{#each users as user (user.id)}
								<Mention.Item value={user.name}>
									<span class="text-sm">{user.name}</span>
									<span class="text-xs text-muted-foreground">{user.email}</span>
								</Mention.Item>
							{/each}
						</Mention.Content>
					</Mention.Portal>
				</Mention.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom Trigger">
		{#snippet blurb()}
			The popup opens on # instead of @.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Mention.Root trigger="#" class="max-w-[400px] {tagClass}">
					<Mention.Input placeholder="Type # to mention a user...">
						{#snippet child({ props })}
							<textarea {...props} rows={3}></textarea>
						{/snippet}
					</Mention.Input>
					<Mention.Portal>
						<Mention.Content>
							{#each users as user (user.id)}
								<Mention.Item value={user.name}>
									<span class="text-sm">{user.name}</span>
									<span class="text-xs text-muted-foreground">{user.email}</span>
								</Mention.Item>
							{/each}
						</Mention.Content>
					</Mention.Portal>
				</Mention.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With Custom Filter">
		{#snippet blurb()}
			A controlled slash-command palette whose onFilter keeps only the commands starting with the
			typed term.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full flex-col gap-4">
					<Mention.Root
						bind:value={commandValue}
						bind:inputValue={commandInputValue}
						trigger="/"
						onFilter={startsWithFilter}
						class="max-w-[400px] {tagClass}"
					>
						<Mention.Input placeholder="Type / to use a command...">
							{#snippet child({ props })}
								<textarea {...props} rows={3}></textarea>
							{/snippet}
						</Mention.Input>
						<Mention.Portal>
							<Mention.Content>
								{#each commands as command (command.id)}
									<Mention.Item value={command.name} label={command.name}>
										<span class="font-mono text-sm">{command.name}</span>
										<span class="text-xs text-muted-foreground">{command.description}</span>
									</Mention.Item>
								{/each}
							</Mention.Content>
						</Mention.Portal>
					</Mention.Root>
					<p class="text-sm text-muted-foreground">
						Commands: {commandValue.length > 0 ? commandValue.join(", ") : "none yet"}
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Mention.Root</h3>
			<p class="text-sm text-muted-foreground">
				The container for every part. Owns the value list, the open state, the field text, the
				mention spans and the filter. Mention tags can be styled through the <code>data-tag</code>
				attribute within the root.
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
			<h3 class="text-base font-medium">Parts</h3>
			<p class="text-sm text-muted-foreground">
				Every part also accepts <code>ref</code>, <code>class</code> and any native attribute of its
				element, and every part throws when used outside <code>Mention.Root</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Part</Table.Head>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each partProps as row (`${row.part}.${row.prop}`)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.part}</Table.Cell>
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
								<Table.Head>On</Table.Head>
								<Table.Head>Present when</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (row.attribute + row.on)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.attribute}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.on}</Table.Cell>
									<Table.Cell>{row.when}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
			<p class="text-sm text-muted-foreground">
				The popup also exposes <code>--mention-transform-origin</code>,
				<code>--mention-anchor-width</code>, <code>--mention-anchor-height</code>,
				<code>--mention-available-width</code> and <code>--mention-available-height</code>.
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Key</Table.Head>
								<Table.Head>Action</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each keyboard as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.keys}</Table.Cell>
									<Table.Cell>{row.action}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
