<script lang="ts">
	import RefreshCcwIcon from "@lucide/svelte/icons/refresh-ccw";
	import { toast } from "svelte-sonner";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as TagsInput from "$lib/components/ui/tags-input/index.js";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Tags input component page.
	 *
	 * THE CLASSIC THEME DOES HAVE THIS OBJECT, AS SOMEONE ELSE'S. The reference stylesheet restyles the boxed select widget — the
	 * library the classic theme uses for tag fields — and §12 of the theme notes lists that whole vendor
	 * block among the things not ported, because this project bundles none of those libraries.
	 *
	 * So the field is the classic theme's (`app.css`'s `[data-slot='input']`) and the tags on it are not:
	 * they use the theme's secondary surface, which is `light`/gray-200 — the same ground as a
	 * `.btn-white`. That is a close relative of what the boxed widget draws, arrived at from the token set
	 * rather than copied, and it is the honest position while the vendor block stays unported.
	 */

	// --- Default -------------------------------------------------------------
	let tricks = $state<string[]>([]);

	// --- Editable ------------------------------------------------------------
	let editableTricks = $state(["Kickflip", "Heelflip", "FS 540"]);

	// --- With Validation -----------------------------------------------------
	let validatedTricks = $state<string[]>([]);

	function onInvalidTrick(value: string) {
		if (validatedTricks.length >= 6) {
			toast.error("Up to 6 tricks are allowed.");
		} else if (validatedTricks.includes(value)) {
			toast.error(`${value} already exists.`);
		} else {
			toast.error(`${value} is not a valid trick.`);
		}
	}

	// --- With Sortable -------------------------------------------------------
	// Upstream composes this example with its `Sortable` component, which is built on `@dnd-kit/core`
	// and has no counterpart in this registry yet. The reordering therefore lives entirely in this
	// page — native drag and drop for the pointer, `Alt`+`ArrowLeft`/`ArrowRight` for the keyboard —
	// while `TagsInput` keeps managing add, edit and remove exactly as it does everywhere else.
	let sortableTricks = $state(["The 900", "FS 540", "Kickflip"]);
	let draggedIndex = $state<number | null>(null);

	function moveTrick(from: number, to: number) {
		if (from === to || from < 0 || to < 0 || to >= sortableTricks.length) return;

		const next = [...sortableTricks];
		const [moved] = next.splice(from, 1);
		if (moved === undefined) return;

		next.splice(to, 0, moved);
		sortableTricks = next;
	}

	function onSortableDrop(index: number) {
		if (draggedIndex === null) return;
		moveTrick(draggedIndex, index);
		draggedIndex = null;
	}

	function onSortableKeydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		if (!event.altKey) return;
		if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

		// The highlighted tag is published as `[data-highlighted]`, so the page reads the same public
		// styling contract a consumer would target with CSS.
		const highlighted = event.currentTarget.querySelector<HTMLElement>(
			'[data-slot="tags-input-item"][data-highlighted]',
		);
		if (!highlighted) return;

		const from = sortableTricks.indexOf(highlighted.dataset.value ?? "");
		if (from === -1) return;

		moveTrick(from, event.key === "ArrowLeft" ? from - 1 : from + 1);
		event.preventDefault();
	}

	// --- API reference -------------------------------------------------------
	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "value",
			type: "string[]",
			default: "undefined",
			description:
				"Controlled tag list. Bindable — bind:value lets the tags input move your state, bind:value={get, set} keeps you authoritative.",
		},
		{
			prop: "defaultValue",
			type: "string[]",
			default: "[]",
			description: "Initial tag list when uncontrolled.",
		},
		{
			prop: "onValueChange",
			type: "(value: string[]) => void",
			default: "—",
			description: "Called whenever the tag list changes, in both modes.",
		},
		{
			prop: "onValidate",
			type: "(value: string) => boolean",
			default: "—",
			description: "Returning false rejects the candidate tag.",
		},
		{
			prop: "onInvalid",
			type: "(value: string) => void",
			default: "—",
			description: "Called for every rejection: over max, onValidate false, duplicate.",
		},
		{
			prop: "displayValue",
			type: "(value: string) => string",
			default: "(value) => value.toString()",
			description: "Render-only transform of a tag; the stored value is never transformed.",
		},
		{
			prop: "addOnPaste",
			type: "boolean",
			default: "false",
			description: "Paste splits on the delimiter instead of inserting natively.",
		},
		{
			prop: "addOnTab",
			type: "boolean",
			default: "false",
			description: "Tab with text in the input adds a tag instead of moving focus.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Suppresses every interaction.",
		},
		{
			prop: "editable",
			type: "boolean",
			default: "false",
			description: "Enables in-place editing of existing tags.",
		},
		{
			prop: "loop",
			type: "boolean",
			default: "false",
			description: "Wraps keyboard navigation from the last tag to the first and back.",
		},
		{
			prop: "blurBehavior",
			type: "'add' | 'clear' | undefined",
			default: "undefined",
			description: "Unset leaves the typed text in the input when it loses focus.",
		},
		{
			prop: "delimiter",
			type: "string",
			default: "','",
			description: "Splits pasted text; typing it also commits the tag.",
		},
		{
			prop: "max",
			type: "number",
			default: "Number.POSITIVE_INFINITY",
			description: "Cap on the number of tags.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "Form validity: an empty required list blocks submission.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "false",
			description: "Focusable and selectable, but no add, remove, clear or edit.",
		},
		{
			prop: "name",
			type: "string",
			default: "—",
			description: "Field name of the hidden form input.",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "provider → DOM [dir] → ltr",
			description: "Inverts the horizontal arrow keys.",
		},
		{
			prop: "id",
			type: "string",
			default: "$props.id()",
			description: "Root id; the input and label ids derive from it.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
	];

	const labelProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLLabelElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The label text.",
		},
	];

	const inputProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLInputElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
	];

	const itemProps: PropRow[] = [
		{
			prop: "value",
			type: "string",
			default: "— (required)",
			description: "Identifies the tag; it must be unique within the list.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables this tag only, independently of the root's disabled.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Normally an ItemText and an ItemDelete.",
		},
	];

	const itemTextProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLSpanElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "the item's displayValue",
			description: "Overrides the tag's rendered text.",
		},
	];

	const itemDeleteProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "an X icon",
			description: "Overrides the button's content.",
		},
	];

	const clearProps: PropRow[] = [
		{
			prop: "forceMount",
			type: "boolean",
			default: "false",
			description: "Keeps the button mounted while the tag list is empty.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Renders the clear button onto your own element; children is not rendered.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered element; stays null in child mode.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The button's content.",
		},
	];

	const keyboard = [
		{
			keys: "Enter",
			description:
				"Input has text: add a tag. A tag is highlighted and editable is set: enter edit mode. Inside the edit field: commit.",
		},
		{
			keys: "Escape",
			description:
				"Clear the highlight and edit mode, reset the caret. Inside the edit field: discard and re-highlight the tag.",
		},
		{
			keys: "Backspace",
			description:
				"Caret at 0: with a highlight, remove it and highlight the previous tag; with none, highlight the last tag.",
		},
		{
			keys: "Delete",
			description: "Caret at 0 with a highlight: remove it and highlight the adjacent tag.",
		},
		{
			keys: "ArrowLeft",
			description:
				'Caret at 0: move the highlight toward the start; from none, highlight the last tag. Inverted under dir="rtl".',
		},
		{
			keys: "ArrowRight",
			description:
				'Move the highlight toward the end; past the last tag the highlight clears and the caret returns to 0. Inverted under dir="rtl".',
		},
		{ keys: "Home / End", description: "With a highlight, jump to the first / last enabled tag." },
		{
			keys: "Tab",
			description:
				"addOnTab and the input has text: add a tag and stay. Otherwise move focus normally.",
		},
		{
			keys: "Any printable character",
			description: "Clears the highlight; typing continues in the input.",
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

{#snippet clearAsButton({ props }: { props: TagsInput.TagsInputClearChildProps })}
	<Button variant="outline" {...props}>
		<RefreshCcwIcon data-icon="inline-start" />
		Clear
	</Button>
{/snippet}

<DocPage title="Tags input">
	{#snippet subtitle()}
		Display a list of tags in an input field with the ability to add, edit, and remove them. See the
		<a class="text-primary underline underline-offset-3" href={href("/components/combobox")}
			>Combobox page</a
		> for how the type-to-pick components divide their roles.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<TagsInput.Root bind:value={tricks} class="w-[380px]" editable>
					<TagsInput.Label>Tricks</TagsInput.Label>
					<div
						class="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring"
					>
						{#each tricks as trick (trick)}
							<TagsInput.Item value={trick}>
								<TagsInput.ItemText />
								<TagsInput.ItemDelete />
							</TagsInput.Item>
						{/each}
						<TagsInput.Input placeholder="Add trick..." />
					</div>
					<TagsInput.Clear>
						<RefreshCcwIcon data-icon="inline-start" />
						Clear
					</TagsInput.Clear>
				</TagsInput.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Editable">
		{#snippet blurb()}
			Double-click a tag — or highlight it and press Enter — to edit it in place; pasting a
			comma-separated list adds every value at once, and the clear button is rendered as a Button
			through the child snippet.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<TagsInput.Root bind:value={editableTricks} class="w-[380px]" editable addOnPaste>
					<TagsInput.Label>Tricks</TagsInput.Label>
					<div
						class="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring"
					>
						{#each editableTricks as trick (trick)}
							<TagsInput.Item value={trick}>
								<TagsInput.ItemText />
								<TagsInput.ItemDelete />
							</TagsInput.Item>
						{/each}
						<TagsInput.Input placeholder="Add trick..." />
					</div>
					<TagsInput.Clear child={clearAsButton} />
				</TagsInput.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With validation">
		{#snippet blurb()}
			Add up to 6 tricks with at least 3 characters, excluding “ollie”; every rejection raises a
			toast.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<TagsInput.Root
					bind:value={validatedTricks}
					class="w-[380px]"
					onValidate={(value) => value.length > 2 && !value.includes("ollie")}
					onInvalid={onInvalidTrick}
					max={6}
					editable
					addOnPaste
				>
					<TagsInput.Label>Tricks</TagsInput.Label>
					<div
						class="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring data-[invalid]:border-destructive"
					>
						{#each validatedTricks as trick (trick)}
							<TagsInput.Item value={trick}>
								<TagsInput.ItemText />
								<TagsInput.ItemDelete />
							</TagsInput.Item>
						{/each}
						<TagsInput.Input placeholder="Add trick..." />
					</div>
					<p class="text-sm text-muted-foreground">
						Add up to 6 tricks with at least 3 characters, excluding “ollie”.
					</p>
				</TagsInput.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With Sortable">
		{#snippet blurb()}
			Upstream composes TagsInput with its Sortable component, which is built on @dnd-kit and has no
			counterpart here yet, so this page owns the reordering: drag a tag onto another one, or
			highlight a tag and press Alt+ArrowLeft / Alt+ArrowRight.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<TagsInput.Root
					bind:value={sortableTricks}
					class="w-[380px]"
					editable
					onkeydown={onSortableKeydown}
				>
					<TagsInput.Label>Sortable</TagsInput.Label>
					<div
						class="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring"
					>
						{#each sortableTricks as trick, index (trick)}
							<TagsInput.Item
								value={trick}
								data-value={trick}
								draggable={true}
								class="cursor-grab active:cursor-grabbing"
								ondragstart={() => (draggedIndex = index)}
								ondragover={(event: DragEvent) => event.preventDefault()}
								ondrop={() => onSortableDrop(index)}
								ondragend={() => (draggedIndex = null)}
							>
								<TagsInput.ItemText />
								<TagsInput.ItemDelete />
							</TagsInput.Item>
						{/each}
						<TagsInput.Input placeholder="Add trick..." />
					</div>
				</TagsInput.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">TagsInput.Root</h3>
			<p class="text-sm text-muted-foreground">
				The container. Every part additionally accepts <code>class</code> and the rest of its element’s
				HTML attributes.
			</p>
			{@render propsTable(rootProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">TagsInput.Label</h3>
			<p class="text-sm text-muted-foreground">
				Labels the text input through <code>for</code>, and is what makes the input's
				<code>aria-labelledby</code> appear.
			</p>
			{@render propsTable(labelProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">TagsInput.Input</h3>
			<p class="text-sm text-muted-foreground">
				The text input new tags are typed into. Its text is uncontrolled DOM state, so there is no
				value prop.
			</p>
			{@render propsTable(inputProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">TagsInput.Item</h3>
			<p class="text-sm text-muted-foreground">One rendered tag.</p>
			{@render propsTable(itemProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">TagsInput.ItemText</h3>
			<p class="text-sm text-muted-foreground">
				The tag's text, and the inline edit field while the tag is being edited.
			</p>
			{@render propsTable(itemTextProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">TagsInput.ItemDelete</h3>
			<p class="text-sm text-muted-foreground">
				Removes its tag. Not rendered while that tag is being edited.
			</p>
			{@render propsTable(itemDeleteProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">TagsInput.Clear</h3>
			<p class="text-sm text-muted-foreground">
				Removes every tag. Not rendered while the list is empty unless <code>forceMount</code> is set.
			</p>
			{@render propsTable(clearProps)}
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
