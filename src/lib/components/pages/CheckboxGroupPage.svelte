<script lang="ts">
	import FlameIcon from "@lucide/svelte/icons/flame";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as CheckboxGroup from "$lib/components/ui/checkbox-group/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	import { ShiftMultiSelect } from "./checkbox-group-shift-multi-select.svelte.js";

	/**
	 * The Checkbox group component page.
	 *
	 * NOTHING TO PAINT. The box itself is already the classic theme's — `app.css` restates its geometry and
	 * four state colours under `[data-slot='checkbox']`, ported on the Checkbox page — and what
	 * this component adds on top is behaviour: group-level validation, Space-only toggling
	 * (each enabled item is its own tab stop), and shift-click range selection.
	 *
	 * the classic `.form-check` group is a layout convention (a stack of independent inputs), not
	 * a control, so there is no grouped-checkbox object in the classic theme to measure against.
	 */

	type Trick = { label: string; value: string };

	const TRICKS: Trick[] = [
		{ label: "Kickflip", value: "kickflip" },
		{ label: "Heelflip", value: "heelflip" },
		{ label: "Tre Flip", value: "tre-flip" },
		{ label: "540 Flip", value: "540-flip" },
	];

	const GRAB_TRICKS: Trick[] = [
		{ label: "Indy", value: "indy" },
		{ label: "Stalefish", value: "stalefish" },
		{ label: "Pizza Guy", value: "pizza-guy" },
		{ label: "FS 540", value: "fs-540" },
	];

	const MULTI_TRICKS: Trick[] = [
		{ label: "Kickflip", value: "kickflip" },
		{ label: "Heelflip", value: "heelflip" },
		{ label: "Tre Flip", value: "tre-flip" },
		{ label: "Pizza Guy", value: "pizza-guy" },
		{ label: "FS 540", value: "fs-540" },
		{ label: "The 900", value: "the-900" },
	];

	let validated = $state(["stalefish", "fs-540"]);

	const multi = new ShiftMultiSelect<Trick>({
		items: MULTI_TRICKS,
		getItemValue: (trick) => trick.value,
	});

	const rootProps = [
		{
			prop: "value",
			type: "string[]",
			default: "undefined",
			description:
				"Controlled value. Bindable — `bind:value` lets the group move your state, `bind:value={get, set}` keeps you authoritative.",
		},
		{
			prop: "defaultValue",
			type: "string[]",
			default: "[]",
			description: "Initial value when uncontrolled, and the value a native form reset restores.",
		},
		{
			prop: "onValueChange",
			type: "(value: string[]) => void",
			default: "—",
			description: "Called whenever the value changes, in both modes.",
		},
		{
			prop: "onValidate",
			type: "(value: string[]) => string | string[] | true | null | undefined",
			default: "—",
			description:
				"A string or array marks the group invalid and becomes the message; true, null and undefined clear it.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables every item and takes them out of the tab order.",
		},
		{
			prop: "invalid",
			type: "boolean",
			default: "false",
			description: "Marks the group invalid independently of onValidate.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "false",
			description: "Items stay focusable but never change, and no callback fires.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "Required in a form context — satisfied by any one checked item.",
		},
		{
			prop: "name",
			type: "string",
			default: "undefined",
			description: "Field name used by every item's hidden input during form submission.",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "resolved",
			description: 'Falls back to the nearest DirectionProvider, then the DOM [dir], then "ltr".',
		},
		{
			prop: "orientation",
			type: "'vertical' | 'horizontal'",
			default: "'vertical'",
			description: "Drives the list layout and the data-orientation attribute on every part.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLAttributes<HTMLDivElement>, 'dir'>",
			default: "—",
			description: "Spread onto the element; `class` is merged last.",
		},
	];

	const labelProps = [
		{
			prop: "ref",
			type: "HTMLLabelElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLLabelAttributes, 'id'>",
			default: "—",
			description:
				"Spread onto the element. `id` is owned by the group — it is what the root's aria-labelledby points at.",
		},
	];

	const listProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the element — this is where the multi-selection demo attaches its Shift listeners.",
		},
	];

	const itemProps = [
		{
			prop: "value",
			type: "string",
			default: "— (required)",
			description: "Value of the checkbox.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables this item. A disabled group disables every item.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "Requires this checkbox in particular for the form to be valid.",
		},
		{
			prop: "name",
			type: "string",
			default: "undefined",
			description: "Field name for this item's hidden input; overrides the group's name.",
		},
		{
			prop: "indicator",
			type: "Snippet",
			default: "<CheckboxGroup.Indicator />",
			description: "Rendered inside the checkbox box.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The visible label — rendered inside the button, so it is the accessible name.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLButtonAttributes, 'value' | 'type' | 'disabled' | 'name'>",
			default: "—",
			description:
				"Spread onto the button. A caller onclick or onkeydown runs first and may preventDefault() the built-in behaviour.",
		},
	];

	const indicatorProps = [
		{
			prop: "forceMount",
			type: "boolean",
			default: "false",
			description: "Keep the indicator mounted while unchecked, for an external transition.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "the check icon",
			description: "The glyph.",
		},
		{
			prop: "ref",
			type: "HTMLSpanElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLSpanElement>",
			default: "—",
			description: "Spread onto the element.",
		},
	];

	const descriptionProps = [
		{
			prop: "announce",
			type: "boolean",
			default: "false",
			description: 'Renders aria-live="polite" so screen readers announce it on render.',
		},
		{
			prop: "hideOnError",
			type: "boolean",
			default: "false",
			description: "Removes the description while the group is invalid.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the element.",
		},
	];

	const messageProps = [
		{
			prop: "announce",
			type: "boolean",
			default: "false",
			description: 'Renders aria-live="polite" so screen readers announce it on render.',
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Fallback content, used when onValidate supplied no message of its own.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the element.",
		},
	];

	const keyboard = [
		{
			keys: "Tab",
			description: "Moves to the next item — every enabled item is its own tab stop.",
		},
		{ keys: "Space", description: "Toggles the focused item." },
		{ keys: "Enter", description: "Does nothing: no toggle, and no form submission." },
	];
</script>

{#snippet flameIndicator()}
	<CheckboxGroup.Indicator>
		<FlameIcon class="size-3.5" />
	</CheckboxGroup.Indicator>
{/snippet}

{#snippet animatedIndicator()}
	<CheckboxGroup.Indicator>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="checkbox-stroke size-3.5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M4 12 9 17L20 6" />
		</svg>
	</CheckboxGroup.Indicator>
{/snippet}

<DocPage title="Checkbox Group">
	{#snippet subtitle()}
		A group of checkboxes that allows multiple selections with support for validation and
		accessibility.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			The last item swaps the default check glyph for its own through the `indicator` snippet.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CheckboxGroup.Root>
					<CheckboxGroup.Label>Select your favorite tricks</CheckboxGroup.Label>
					<CheckboxGroup.List>
						{#each TRICKS as trick (trick.value)}
							<CheckboxGroup.Item
								value={trick.value}
								indicator={trick.value === "540-flip" ? flameIndicator : undefined}
							>
								{trick.label}
							</CheckboxGroup.Item>
						{/each}
					</CheckboxGroup.List>
					<CheckboxGroup.Description>Pick as many as you can land.</CheckboxGroup.Description>
				</CheckboxGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Animated">
		{#snippet blurb()}
			The stroke keyframes live in this page's scoped style block rather than in the global
			stylesheet.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CheckboxGroup.Root>
					<CheckboxGroup.List>
						<CheckboxGroup.Item value="kickflip" indicator={animatedIndicator}>
							Kickflip
						</CheckboxGroup.Item>
						<CheckboxGroup.Item value="heelflip" indicator={animatedIndicator}>
							Heelflip
						</CheckboxGroup.Item>
					</CheckboxGroup.List>
				</CheckboxGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Horizontal">
		<Card.Root>
			<Card.Content>
				<CheckboxGroup.Root orientation="horizontal">
					<CheckboxGroup.Label>Tricks</CheckboxGroup.Label>
					<CheckboxGroup.List>
						{#each GRAB_TRICKS as trick (trick.value)}
							<CheckboxGroup.Item value={trick.value}>{trick.label}</CheckboxGroup.Item>
						{/each}
					</CheckboxGroup.List>
					<CheckboxGroup.Description>Select grab tricks</CheckboxGroup.Description>
				</CheckboxGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With Validation">
		{#snippet blurb()}
			Selecting Indy invalidates the group, which swaps the description for the message.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CheckboxGroup.Root
					bind:value={validated}
					onValidate={(value) => (value.includes("indy") ? "Indy is not allowed" : null)}
				>
					<CheckboxGroup.Label>Tricks</CheckboxGroup.Label>
					<CheckboxGroup.List>
						<CheckboxGroup.Item value="indy">Indy</CheckboxGroup.Item>
						<CheckboxGroup.Item value="stalefish">Stalefish</CheckboxGroup.Item>
						<CheckboxGroup.Item value="fs-540">FS 540</CheckboxGroup.Item>
					</CheckboxGroup.List>
					<CheckboxGroup.Description hideOnError>Select grab tricks</CheckboxGroup.Description>
					<CheckboxGroup.Message />
				</CheckboxGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Multi Selection">
		{#snippet blurb()}
			Hold Shift while focus is inside the list and click to extend the selection across a whole
			range.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CheckboxGroup.Root bind:value={() => multi.value, (next) => multi.onValueChange(next)}>
					<CheckboxGroup.Label>Tricks</CheckboxGroup.Label>
					<CheckboxGroup.Description>
						Hold Shift and click to select multiple items
					</CheckboxGroup.Description>
					<CheckboxGroup.List
						class="mt-1"
						onkeydown={multi.onShiftKeyDown}
						onkeyup={multi.onShiftKeyDown}
					>
						{#each MULTI_TRICKS as trick (trick.value)}
							<CheckboxGroup.Item value={trick.value}>{trick.label}</CheckboxGroup.Item>
						{/each}
					</CheckboxGroup.List>
				</CheckboxGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CheckboxGroup.Root</h3>
			<p class="text-sm text-muted-foreground">
				The container. Every part additionally accepts <code>class</code>,
				<code>children</code> and the rest of its element’s HTML attributes.
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
			<h3 class="text-base font-medium">CheckboxGroup.Label</h3>
			<p class="text-sm text-muted-foreground">
				Names the group through <code>aria-labelledby</code>.
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
							{#each labelProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CheckboxGroup.List</h3>
			<p class="text-sm text-muted-foreground">
				The <code>role="group"</code> container whose layout follows <code>orientation</code>.
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
							{#each listProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CheckboxGroup.Item</h3>
			<p class="text-sm text-muted-foreground">
				A <code>role="checkbox"</code> button. Its children are the accessible name, and a hidden native
				checkbox beside it carries the value into form submission and constraint validation.
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
							{#each itemProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CheckboxGroup.Indicator</h3>
			<p class="text-sm text-muted-foreground">
				The glyph inside the box. Mounted only while the item is checked, unless
				<code>forceMount</code> is set.
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
							{#each indicatorProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CheckboxGroup.Description</h3>
			<p class="text-sm text-muted-foreground">
				Optional helper text. The root points <code>aria-describedby</code> at it only while it is rendered.
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
							{#each descriptionProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CheckboxGroup.Message</h3>
			<p class="text-sm text-muted-foreground">
				The validation message. Rendered only while the group is invalid <em>and</em> there is something
				to say.
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
							{#each messageProps as row (row.prop)}
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

<style>
	/*
	 * Upstream asks consumers to extend `tailwind.config.ts` with these keyframes — a v3 instruction
	 * with no v4 equivalent, and one that belongs in a consumer's theme rather than in this repo's
	 * global stylesheet. Scoping them to the demo page keeps the animation local.
	 */
	@keyframes stroke-dashoffset {
		from {
			stroke-dashoffset: 100%;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	.checkbox-stroke {
		stroke-dasharray: 100% 100%;
		animation: stroke-dashoffset 0.2s linear forwards;
	}

	@media (prefers-reduced-motion: reduce) {
		.checkbox-stroke {
			animation: none;
		}
	}
</style>
