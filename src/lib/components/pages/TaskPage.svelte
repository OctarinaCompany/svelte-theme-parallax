<script lang="ts">
	import type { LucideIcon } from "@lucide/svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Task from "$lib/components/ui/task/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import { TextGradient } from "$lib/components/ui/text-gradient/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";
	import BracesIcon from "@lucide/svelte/icons/braces";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import FileCodeIcon from "@lucide/svelte/icons/file-code";
	import FileTextIcon from "@lucide/svelte/icons/file-text";

	/**
	 * The Task component page.
	 *
	 * A task is the line an agent writes in a transcript to say what it DID — searched, read,
	 * ran — folded away under a one-line title so the answer beneath it stays readable. The
	 * demos are the same agent working through this repository, which keeps the filenames
	 * honest: every chip below names a file that exists.
	 */

	type TaskFile = { name: string; icon: LucideIcon };

	const searchedFiles: TaskFile[] = [
		{ name: "src/App.svelte", icon: FileCodeIcon },
		{ name: "src/lib/hooks/route.svelte.ts", icon: FileCodeIcon },
		{ name: "docs/CONVENTIONS.md", icon: FileTextIcon },
	];

	const configFiles: TaskFile[] = [
		{ name: "package.json", icon: BracesIcon },
		{ name: "components.json", icon: BracesIcon },
		{ name: "tsconfig.app.json", icon: BracesIcon },
	];

	/**
	 * The controlled demo. `triggerToggles` counts `onOpenChange` calls: the Button below writes
	 * `controlledOpen` through the binding and the counter does not move, because Bits UI fires
	 * the callback from its own setter only — a parent-driven write is not a change.
	 */
	let controlledOpen = $state(true);
	let triggerToggles = $state(0);

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				"Bindable reference to the root `div` Bits UI renders. Not populated in `child` mode.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "—",
			description:
				"Bindable open state. Left unbound, it is seeded once from `defaultOpen` and then owned by the trigger. Bound, the caller's value wins and a write through the binding opens or closes the task without firing `onOpenChange`.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "true",
			description:
				"The state the task starts in when `open` is not supplied. Read once; a later change does nothing, and it is ignored entirely once `open` is bound.",
		},
		{
			prop: "onOpenChange",
			type: "OnChangeFn<boolean>",
			default: "—",
			description:
				"Called with the new state when the trigger toggles the task — never for a parent-driven write through `bind:open`.",
		},
		{
			prop: "onOpenChangeComplete",
			type: "OnChangeFn<boolean>",
			default: "—",
			description:
				"Called with the new state once the open or close animation on `Task.Content` has finished; with no animation, right after the change.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Disables the trigger, so the task can no longer be toggled by the reader. The content keeps whatever state it had; `data-disabled` is stamped on the root, the trigger and the content.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged after `group/task`, which the chevron in `Task.Trigger` reads.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The trigger and the content. Not rendered when `child` is supplied.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: Record<string, unknown> }]>",
			default: "—",
			description:
				"Render the root onto your own element; the snippet receives the merged props (`data-slot`, `data-state`, `class`) to spread onto it. Replaces upstream's `asChild`.",
		},
		{
			prop: "...restProps",
			type: "CollapsiblePrimitive.RootProps",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the root `div`.",
		},
	];

	const triggerProps = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered `button`. Not populated in `child` mode.",
		},
		{
			prop: "title",
			type: "string",
			default: "—",
			description:
				"The label of the default rendering, between the search glyph and the chevron. Consumed, not forwarded: it never becomes the native `title` tooltip. Still required when `children` or `child` replace the default rendering, where it is otherwise ignored.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, so it overrides the base classes. The icon rule `[&_svg:not([class*='size-'])]:size-4` sizes any icon passed in `children` unless it carries a `size-*` of its own.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the default glyph, title and chevron while keeping the `button`. Supply your own `ChevronDownIcon` with `group-data-[state=open]/task:rotate-180` if the turn-over is wanted.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: Record<string, unknown> }]>",
			default: "—",
			description:
				"Render the trigger onto your own element; the snippet receives `type`, `aria-expanded`, `aria-controls`, `data-state`, the click and key handlers and `class` to spread onto it. `children` is not rendered in this mode.",
		},
		{
			prop: "...restProps",
			type: "CollapsiblePrimitive.TriggerProps",
			default: "—",
			description:
				"Every other attribute and DOM handler is spread onto the `button`. `disabled` here disables this trigger alone; `disabled` on the root disables it too.",
		},
	];

	const contentProps = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered `div`. Populated whether the task is open or closed — the panel is never unmounted, only given the `hidden` attribute. Not populated in `child` mode.",
		},
		{
			prop: "forceMount",
			type: "boolean",
			default: "false",
			description:
				'Drops the `hidden` attribute Bits UI otherwise stamps on the closed panel, so it stays visible with `data-state="closed"` for a caller that hides it with its own CSS. Overridden by `hiddenUntilFound`.',
		},
		{
			prop: "hiddenUntilFound",
			type: "boolean",
			default: "false",
			description:
				'Renders the closed panel with `hidden="until-found"`, so the browser\'s find-in-page can match text inside it and opens the task when it does.',
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, so it overrides the slide animation classes. The rail (`mt-4 border-l-2 pl-4`) lives on an inner `div` and is not reachable from here.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Rendered inside the rail. Not rendered when `child` is supplied.",
		},
		{
			prop: "child",
			type: "Snippet<[{ open: boolean; props: Record<string, unknown> }]>",
			default: "—",
			description:
				"Render the panel onto your own element; the snippet receives the current `open` state plus the merged props. The rail `div` is not rendered in this mode.",
		},
		{
			prop: "...restProps",
			type: "CollapsiblePrimitive.ContentProps",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the panel `div`.",
		},
	];

	const itemProps = [
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
			description: "Rendered inside the element; `Task.ItemFile` chips flow inline with the text.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const itemFileProps = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered element — a `span`, or an `a` when `href` is set.",
		},
		{
			prop: "variant",
			type: "BadgeVariant",
			default: "'secondary'",
			description:
				"The Badge variant the chip is painted with. Any Badge variant is accepted, so a file the agent changed can be told apart from one it read.",
		},
		{
			prop: "href",
			type: "string | null | undefined",
			default: "—",
			description:
				"Given a value, the chip renders as an `a` and the file becomes a link; the Badge's link hover applies.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged after `gap-1 font-normal`, so it overrides them and the variant classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"An icon and the filename. A direct-child `svg` is sized to 12px by the Badge; no sizing class is needed on it.",
		},
		{
			prop: "...restProps",
			type: "HTMLAnchorAttributes",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "Task", values: "task" },
		{ attribute: "[data-slot]", part: "Task.Trigger", values: "task-trigger" },
		{ attribute: "[data-slot]", part: "Task.Content", values: "task-content" },
		{ attribute: "[data-slot]", part: "Task.Item", values: "task-item" },
		{ attribute: "[data-slot]", part: "Task.ItemFile", values: "task-item-file" },
		{
			attribute: "[data-state]",
			part: "Task, Task.Trigger, Task.Content",
			values:
				"open | closed — stamped by Bits UI's Collapsible; the root's is what `group/task` exposes",
		},
		{
			attribute: "[data-disabled]",
			part: "Task, Task.Trigger, Task.Content",
			values: "present while `disabled` — stamped by Bits UI's Collapsible",
		},
		{
			attribute: "[data-starting-style]",
			part: "Task.Content",
			values: "present for one frame as the panel opens — stamped by Bits UI",
		},
		{
			attribute: "[data-ending-style]",
			part: "Task.Content",
			values: "present while the closing animation runs — stamped by Bits UI",
		},
	];

	const keyboard = [
		{
			keys: "Tab",
			description:
				"Moves focus to the trigger, a native `button`. An open panel's own focusable content follows in document order.",
		},
		{
			keys: "Enter / Space",
			description: "Toggles the task and fires `onOpenChange` with the new state.",
		},
	];
</script>

<DocPage title="Task">
	{#snippet subtitle()}
		A collapsible record of one thing an agent did — searched, read, ran — with the files it touched
		as chips underneath. Built on
		<a href={href("/components/collapsible")} class="underline underline-offset-4">Collapsible</a>,
		with the file chip drawn by
		<a href={href("/components/badge")} class="underline underline-offset-4">Badge</a>.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			<code>Task.Trigger</code> takes a <code>title</code> and draws the search glyph and the
			chevron itself. Items are plain text; a <code>Task.ItemFile</code> flows inline wherever a file
			is named.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<Task.Root class="max-w-xl">
					<Task.Trigger title="Searching the codebase" />
					<Task.Content>
						<Task.Item>Searching for "href(" across 312 files</Task.Item>
						{#each searchedFiles as file (file.name)}
							<Task.Item>
								Read
								<Task.ItemFile>
									<file.icon />
									<span>{file.name}</span>
								</Task.ItemFile>
							</Task.Item>
						{/each}
						<Task.Item>Found 3 files that concatenate the site base by hand</Task.Item>
					</Task.Content>
				</Task.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Stacked tasks">
		{#snippet blurb()}
			A transcript stacks tasks in the order they ran. Each owns its state, and
			<code>defaultOpen={"{false}"}</code> folds one away without binding anything.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<div class="flex max-w-xl flex-col gap-4">
					<Task.Root>
						<Task.Trigger title="Searching the codebase" />
						<Task.Content>
							{#each searchedFiles as file (file.name)}
								<Task.Item>
									Read
									<Task.ItemFile>
										<file.icon />
										<span>{file.name}</span>
									</Task.ItemFile>
								</Task.Item>
							{/each}
						</Task.Content>
					</Task.Root>

					<Task.Root defaultOpen={false}>
						<Task.Trigger title="Reading the configuration" />
						<Task.Content>
							{#each configFiles as file (file.name)}
								<Task.Item>
									Read
									<Task.ItemFile>
										<file.icon />
										<span>{file.name}</span>
									</Task.ItemFile>
								</Task.Item>
							{/each}
							<Task.Item>Aliases resolve through <code>$lib</code>; nothing to change</Task.Item>
						</Task.Content>
					</Task.Root>

					<Task.Root>
						<Task.Trigger title="Running svelte-check" />
						<Task.Content>
							<Task.Item>Checked 1,204 files</Task.Item>
							<Task.Item>0 errors, 0 warnings</Task.Item>
						</Task.Content>
					</Task.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Running task">
		{#snippet blurb()}
			Passing <code>children</code> to <code>Task.Trigger</code> replaces the glyph, title and
			chevron while keeping the button. A task still in progress swaps the glyph for a
			<code>Spinner</code> and shimmers its title with <code>TextGradient</code>; the chevron is
			re-added by hand so it still turns.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<Task.Root class="max-w-xl">
					<Task.Trigger title="Searching the codebase">
						<Spinner aria-hidden="true" role="presentation" />
						<TextGradient>Searching the codebase</TextGradient>
						<ChevronDownIcon
							class="transition-transform group-data-[state=open]/task:rotate-180 motion-reduce:transition-none"
						/>
					</Task.Trigger>
					<Task.Content>
						<Task.Item>Searching for "href(" across 312 files</Task.Item>
						<Task.Item>
							Read
							<Task.ItemFile>
								<FileCodeIcon />
								<span>src/App.svelte</span>
							</Task.ItemFile>
						</Task.Item>
					</Task.Content>
				</Task.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled">
		{#snippet blurb()}
			Bind <code>open</code> to drive the task from outside. The counter below increments in
			<code>onOpenChange</code>: the trigger moves it, the button does not, because a write through
			the binding is not a change the component made.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<div class="flex max-w-xl flex-col gap-4">
					<div class="flex flex-wrap items-center gap-3">
						<Button variant="outline" size="sm" onclick={() => (controlledOpen = !controlledOpen)}>
							{controlledOpen ? "Collapse" : "Expand"}
						</Button>
						<span class="text-sm text-muted-foreground">
							open: <code>{controlledOpen}</code> — toggled by the trigger {triggerToggles}
							{triggerToggles === 1 ? "time" : "times"}
						</span>
					</div>

					<Task.Root bind:open={controlledOpen} onOpenChange={() => triggerToggles++}>
						<Task.Trigger title="Searching the codebase" />
						<Task.Content>
							{#each searchedFiles as file (file.name)}
								<Task.Item>
									Read
									<Task.ItemFile>
										<file.icon />
										<span>{file.name}</span>
									</Task.ItemFile>
								</Task.Item>
							{/each}
						</Task.Content>
					</Task.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Task</h3>
			<p class="text-sm text-muted-foreground">
				The root: a Bits UI Collapsible rendered as a <code>div</code> carrying
				<code>group/task</code>, so its <code>data-state</code> is what the trigger's chevron reads. It
				holds the open state and nothing else — there is no context of its own.
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
			<h3 class="text-base font-medium">Task.Trigger</h3>
			<p class="text-sm text-muted-foreground">
				The row that toggles the task. Renders the Collapsible's <code>button</code> — with
				<code>aria-expanded</code> and <code>aria-controls</code> from Bits UI — around a search
				glyph, the <code>title</code> and a chevron that turns over while the task is open.
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
			<h3 class="text-base font-medium">Task.Content</h3>
			<p class="text-sm text-muted-foreground">
				The panel under the trigger. Renders the Collapsible's content <code>div</code> — hidden
				while closed, slid in and out otherwise — around a rail: an inner <code>div</code> with a
				2px left border that stacks the items with <code>gap-2</code>.
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
			<h3 class="text-base font-medium">Task.Item</h3>
			<p class="text-sm text-muted-foreground">
				One line of the record. Renders a <code>div</code> in <code>text-sm</code> muted ink; layout comes
				from the rail, so it carries type only.
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
			<h3 class="text-base font-medium">Task.ItemFile</h3>
			<p class="text-sm text-muted-foreground">
				A file the task touched. Renders the house <code>Badge</code> in its
				<code>secondary</code> variant with <code>gap-1 font-normal</code>, so an icon and a
				filename read as one chip.
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
							{#each itemFileProps as row (row.prop)}
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
				The trigger is a native <code>button</code>; the contract is the disclosure pattern's.
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
