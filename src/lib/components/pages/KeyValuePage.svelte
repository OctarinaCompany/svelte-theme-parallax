<script lang="ts">
	import ClipboardIcon from "@lucide/svelte/icons/clipboard";
	import { toast } from "svelte-sonner";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as KeyValue from "$lib/components/ui/key-value/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Key value component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The editable pair rows are built on `ui/editable`, which
	 * travelled with this component as a dependency and has no page of its own here.
	 *
	 * Both fields are inputs once they open, so they pick up `app.css`'s `[data-slot='input']`
	 * rule — the classic theme's `input-padding-y`, its border and its focus ring — and the closed state
	 * is the same text at the same size with the chrome removed.
	 */

	// --- With Validation -----------------------------------------------------
	function validateKey(key: string) {
		if (!key) return "Key is required";
		if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) return "Must be uppercase with underscores";
		return undefined;
	}

	function validateValue(value: string, key: string) {
		if (key.includes("KEY") && value.length < 10) {
			return "API keys must be at least 10 characters";
		}
		return undefined;
	}

	// --- With Form -----------------------------------------------------------
	// Upstream composes this example with `react-hook-form` + `zod`; neither has a counterpart in
	// this registry, so the same rules live in plain runes here (divergence D-12).
	let projectName = $state("");
	let envVariables = $state<KeyValue.KeyValueItemData[]>([{ id: "1", key: "", value: "" }]);
	let touched = $state(false);

	const projectNameError = $derived(projectName.trim() === "" ? "Project name is required" : null);
	const envError = $derived(
		envVariables.length === 0
			? "At least one environment variable is required"
			: envVariables.some((item) => validateKey(item.key) !== undefined)
				? "Every key must be uppercase with underscores"
				: null,
	);

	function onFormSubmit(event: SubmitEvent) {
		event.preventDefault();
		touched = true;
		if (projectNameError || envError) return;

		toast.success(JSON.stringify({ projectName, envVariables }, null, 2));
	}

	// --- API reference -------------------------------------------------------
	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "value",
			type: "KeyValueItemData[]",
			default: "undefined",
			description:
				"Controlled list of rows. Bindable — bind:value lets the list move your state, bind:value={get, set} keeps you authoritative.",
		},
		{
			prop: "defaultValue",
			type: "KeyValueItemData[]",
			default: "one empty row",
			description: "Initial rows when uncontrolled. An explicit [] is honoured as zero rows.",
		},
		{
			prop: "onValueChange",
			type: "(value: KeyValueItemData[]) => void",
			default: "—",
			description: "Called whenever the list of rows changes.",
		},
		{
			prop: "onPaste",
			type: "(event: ClipboardEvent, items: KeyValueItemData[]) => void",
			default: "—",
			description: "Called once per intercepted multi-line paste, with the parsed rows.",
		},
		{
			prop: "onAdd",
			type: "(value: KeyValueItemData) => void",
			default: "—",
			description: "Called with the newly appended row.",
		},
		{
			prop: "onRemove",
			type: "(value: KeyValueItemData) => void",
			default: "—",
			description: "Called with the removed row.",
		},
		{
			prop: "onKeyValidate",
			type: "(key: string, value: KeyValueItemData[]) => string | undefined",
			default: "—",
			description: "Validates a row key on every edit; the message marks that key invalid.",
		},
		{
			prop: "onValueValidate",
			type: "(value: string, key: string, items: KeyValueItemData[]) => string | undefined",
			default: "—",
			description: "Validates a row value on every edit; the message marks that value invalid.",
		},
		{
			prop: "maxItems",
			type: "number",
			default: "undefined",
			description: "Upper bound on rows. Add is disabled at it, and a paste is truncated to it.",
		},
		{
			prop: "minItems",
			type: "number",
			default: "0",
			description: "Lower bound on rows. Every Remove is disabled at it.",
		},
		{
			prop: "keyPlaceholder",
			type: "string",
			default: "'Key'",
			description: "Placeholder of every key field.",
		},
		{
			prop: "valuePlaceholder",
			type: "string",
			default: "'Value'",
			description: "Placeholder of every value field.",
		},
		{
			prop: "allowDuplicateKeys",
			type: "boolean",
			default: "false",
			description: "Whether two rows may hold the same non-empty key. Empty keys never collide.",
		},
		{
			prop: "enablePaste",
			type: "boolean",
			default: "true",
			description:
				"Whether multi-line clipboard text in a key field expands into one row per line.",
		},
		{
			prop: "trim",
			type: "boolean",
			default: "true",
			description: "Whether keys and values are trimmed as they are written.",
		},
		{
			prop: "stripQuotes",
			type: "boolean",
			default: "true",
			description: "Whether a parsed value wrapped in matching quotes has them removed.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Suppresses every interaction on every part.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "false",
			description: "Shows the rows but allows no add, remove, edit or paste.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "Marks the fields, and the submitted form control, required.",
		},
		{
			prop: "name",
			type: "string",
			default: "—",
			description: "Form field name. The value is submitted as JSON.stringify(rows).",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "inherited",
			description: "Reading direction; falls back to the nearest DirectionProvider, then the DOM.",
		},
		{
			prop: "id",
			type: "string",
			default: "$props.id()",
			description: "Identifier every error id derives from.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The list and the add control.",
		},
	];

	const listProps: PropRow[] = [
		{
			prop: "orientation",
			type: "'vertical' | 'horizontal'",
			default: "'vertical'",
			description: "Row layout, reported as [data-orientation].",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The row template — written once, rendered once per row.",
		},
	];

	const itemProps: PropRow[] = [
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The row's fields, remove control and error messages.",
		},
	];

	const keyInputProps: PropRow[] = [
		{
			prop: "disabled",
			type: "boolean",
			default: "the root's",
			description: "OR-ed with the root — a field can never opt out of a disabled list.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "the root's",
			description: "OR-ed with the root.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "the root's",
			description: "OR-ed with the root.",
		},
		{
			prop: "placeholder",
			type: "string",
			default: "the root's keyPlaceholder",
			description: "Overrides the list-wide key placeholder for this field.",
		},
		{
			prop: "onpaste",
			type: "(event: ClipboardEvent) => void",
			default: "—",
			description: "Runs before the built-in paste handling; preventDefault() suppresses it.",
		},
	];

	const valueInputProps: PropRow[] = [
		{
			prop: "maxRows",
			type: "number",
			default: "undefined",
			description: "Visible lines after which the field stops growing and scrolls instead.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "the root's",
			description: "OR-ed with the root.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "the root's",
			description: "OR-ed with the root.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "the root's",
			description: "OR-ed with the root.",
		},
		{
			prop: "placeholder",
			type: "string",
			default: "the root's valuePlaceholder",
			description: "Overrides the list-wide value placeholder for this field.",
		},
	];

	const removeProps: PropRow[] = [
		{
			prop: "aria-label",
			type: "string",
			default: "'Remove'",
			description: "Accessible name of the icon-only button; override it freely.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "<XIcon />",
			description: "The button's content.",
		},
		{
			prop: "onclick",
			type: "(event: MouseEvent) => void",
			default: "—",
			description: "Runs first and, matching upstream, never suppresses the removal.",
		},
	];

	const addProps: PropRow[] = [
		{
			prop: "children",
			type: "Snippet",
			default: "<PlusIcon /> Add",
			description: "The button's content.",
		},
		{
			prop: "onclick",
			type: "(event: MouseEvent) => void",
			default: "—",
			description: "Runs first and never suppresses the add.",
		},
	];

	const errorProps: PropRow[] = [
		{
			prop: "field",
			type: "'key' | 'value'",
			default: "—",
			description: "Which of the row’s two fields this message belongs to.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "the message",
			description: "Replaces the default content, which is the recorded message.",
		},
	];

	const keyboard = [
		{
			keys: "Tab",
			description:
				"Moves between key fields, value fields, remove buttons and the add button. Landing on a field opens it and selects its text.",
		},
		{
			keys: "Enter",
			description:
				"Submits the field being edited, in the value field too — it never inserts a newline.",
		},
		{
			keys: "Escape",
			description:
				"Restores the text the edit started with. The field is open exactly while it has focus, so it stays open with the restored text.",
		},
		{
			keys: "Ctrl + V",
			description:
				"Pastes. Multi-line clipboard text in a key field expands into one row per line.",
		},
	];
</script>

{#snippet propsTable(rows: PropRow[])}
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
			{#each rows as row (row.prop)}
				<Table.Row>
					<Table.Cell class="font-medium">{row.prop}</Table.Cell>
					<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
					<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
					<Table.Cell>{row.description}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{/snippet}

<DocPage title="Key value">
	{#snippet subtitle()}
		A dynamic input for managing key-value pairs, with paste support and validation.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			Tab into a field to edit it in place; Add appends a row and focuses its key, Remove takes one
			away and moves focus to a neighbour.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<KeyValue.Root class="w-full max-w-lg">
					<KeyValue.List>
						<KeyValue.Item>
							<KeyValue.KeyInput />
							<KeyValue.ValueInput placeholder="Test" />
							<KeyValue.Remove />
						</KeyValue.Item>
					</KeyValue.List>
					<KeyValue.Add />
				</KeyValue.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With paste support">
		{#snippet blurb()}
			Paste a multi-line block into a key field and it expands into one row per line.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-lg flex-col gap-4">
					<div class="flex flex-col gap-2 rounded-lg border bg-muted/50 p-4">
						<div class="flex items-center gap-2">
							<ClipboardIcon class="size-4" />
							<p class="text-sm font-medium">Paste Support</p>
						</div>
						<p class="text-xs text-muted-foreground">
							Try pasting multiple lines in any of these formats:
						</p>
						<pre class="rounded bg-background p-2 text-xs">API_KEY=sk-1234567890
DATABASE_URL=postgresql://localhost
PORT=3000</pre>
					</div>
					<KeyValue.Root keyPlaceholder="KEY" valuePlaceholder="value">
						<KeyValue.List>
							<KeyValue.Item>
								<KeyValue.KeyInput class="font-mono" />
								<KeyValue.ValueInput class="font-mono" />
								<KeyValue.Remove />
							</KeyValue.Item>
						</KeyValue.List>
						<KeyValue.Add />
					</KeyValue.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With validation">
		{#snippet blurb()}
			Keys must be uppercase with underscores, values of a *KEY* row must be at least ten
			characters, and duplicate non-empty keys are flagged.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<KeyValue.Root
					class="w-full max-w-2xl"
					defaultValue={[
						{ id: "1", key: "API_KEY", value: "sk-1234567890" },
						{ id: "2", key: "invalid key", value: "" },
						{ id: "3", key: "DATABASE_URL", value: "short" },
					]}
					keyPlaceholder="KEY"
					valuePlaceholder="value"
					onKeyValidate={validateKey}
					onValueValidate={validateValue}
					allowDuplicateKeys={false}
				>
					<KeyValue.List>
						<KeyValue.Item class="flex-col items-start">
							<div class="flex w-full gap-2">
								<div class="flex flex-1 flex-col gap-1">
									<KeyValue.KeyInput class="font-mono" />
									<KeyValue.Error field="key" />
								</div>
								<div class="flex flex-1 flex-col gap-1">
									<KeyValue.ValueInput class="font-mono" />
									<KeyValue.Error field="value" />
								</div>
								<KeyValue.Remove />
							</div>
						</KeyValue.Item>
					</KeyValue.List>
					<KeyValue.Add />
				</KeyValue.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With form">
		{#snippet blurb()}
			A native &lt;form&gt; with Field and rune state stands in for react-hook-form and zod, which
			have no Svelte analogue here.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<form onsubmit={onFormSubmit} class="w-full max-w-2xl">
					<Field.FieldGroup>
						<Field.Field data-invalid={touched && projectNameError ? "" : undefined}>
							<Field.FieldLabel for="key-value-project-name">Project Name</Field.FieldLabel>
							<Input
								id="key-value-project-name"
								bind:value={projectName}
								placeholder="my-awesome-project"
							/>
							{#if touched && projectNameError}
								<Field.FieldError>{projectNameError}</Field.FieldError>
							{:else}
								<Field.FieldDescription>The name of your project</Field.FieldDescription>
							{/if}
						</Field.Field>

						<Field.Field data-invalid={touched && envError ? "" : undefined}>
							<Field.FieldLabel>Environment Variables</Field.FieldLabel>
							<KeyValue.Root
								bind:value={envVariables}
								name="envVariables"
								keyPlaceholder="KEY"
								valuePlaceholder="value"
								onKeyValidate={validateKey}
								allowDuplicateKeys={false}
							>
								<KeyValue.List>
									<KeyValue.Item class="flex-col items-start">
										<div class="flex w-full gap-2">
											<div class="flex flex-1 flex-col gap-1">
												<KeyValue.KeyInput />
												<KeyValue.Error field="key" />
											</div>
											<KeyValue.ValueInput class="flex-1" />
											<KeyValue.Remove />
										</div>
									</KeyValue.Item>
								</KeyValue.List>
								<KeyValue.Add />
							</KeyValue.Root>
							{#if touched && envError}
								<Field.FieldError>{envError}</Field.FieldError>
							{:else}
								<Field.FieldDescription>
									Add environment variables for your project. Supports pasting multiple lines in
									KEY=VALUE format.
								</Field.FieldDescription>
							{/if}
						</Field.Field>

						<div class="flex justify-end">
							<Button type="submit">Submit</Button>
						</div>
					</Field.FieldGroup>
				</form>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">KeyValue.Root</h3>
			<p class="text-sm text-muted-foreground">
				The container. Every part additionally accepts <code>ref</code>, <code>class</code> and the
				rest of its element’s HTML attributes, with the caller’s <code>class</code> merged last. It
				exposes <code>data-disabled</code>, <code>data-invalid</code> and
				<code>data-readonly</code>.
			</p>
			{@render propsTable(rootProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">KeyValue.List</h3>
			<p class="text-sm text-muted-foreground">
				The <code>role="list"</code> container. Its children are the row template: you write the row once
				and the list instantiates it per row, so each part inside reads its own row from context.
			</p>
			{@render propsTable(listProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">KeyValue.Item</h3>
			<p class="text-sm text-muted-foreground">
				One <code>role="listitem"</code> row. Carries <code>data-highlighted</code> while it is the row
				most recently added, removed-from or pasted-into.
			</p>
			{@render propsTable(itemProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">KeyValue.KeyInput</h3>
			<p class="text-sm text-muted-foreground">
				The key field, composed from <code>Editable</code> — which travelled with this component and
				lives beside it under <code>ui/editable</code>, though it has no page of its own here — so
				it opens on focus and closes on blur. <code>class</code> lands on the field wrapper; every other
				attribute lands on the control.
			</p>
			{@render propsTable(keyInputProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">KeyValue.ValueInput</h3>
			<p class="text-sm text-muted-foreground">
				The value field. Its control is a <code>&lt;textarea&gt;</code> that grows with its content,
				so pasted multi-line values wrap and — with <code>maxRows</code> — scroll.
			</p>
			{@render propsTable(valueInputProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">KeyValue.Remove</h3>
			<p class="text-sm text-muted-foreground">
				Removes its row and moves focus to the next row’s key field, or the previous row’s when the
				removed row was last. Disabled while the list is disabled, read-only, or at
				<code>minItems</code>. Inherits every <code>Button</code> prop.
			</p>
			{@render propsTable(removeProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">KeyValue.Add</h3>
			<p class="text-sm text-muted-foreground">
				Appends an empty row and opens its key field. Lives outside the list, and is disabled while
				the list is disabled, read-only, or at <code>maxItems</code>.
			</p>
			{@render propsTable(addProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">KeyValue.Error</h3>
			<p class="text-sm text-muted-foreground">
				The <code>role="alert"</code> message for one of the row’s fields. Renders nothing while
				that field is valid, and is what the field points <code>aria-describedby</code> at.
			</p>
			{@render propsTable(errorProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard Interactions</h3>
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
