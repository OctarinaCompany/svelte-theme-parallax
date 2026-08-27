<script lang="ts">
	import CopyIcon from "@lucide/svelte/icons/copy";
	import HeartIcon from "@lucide/svelte/icons/heart";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import Share2Icon from "@lucide/svelte/icons/share-2";
	import XIcon from "@lucide/svelte/icons/x";
	import { toast } from "svelte-sonner";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as SpeedDial from "$lib/components/ui/speed-dial/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Speed dial component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. It is a floating action button, which is a Material idea rather
	 * than a classic one, and the classic theme puts primary actions in the page header instead.
	 *
	 * The trigger is the theme's primary button at icon size and the actions are its secondary
	 * buttons, so the dial is built entirely out of surfaces that were already ported — nothing
	 * here is new paint.
	 */

	const SIDES = ["top", "right", "left", "bottom"] as const;

	/** Shared by every demo: the trigger rotates its `+` into an `×` as the dial opens. */
	const triggerClass =
		"transition-transform duration-200 ease-out data-[state=closed]:rotate-0 data-[state=open]:rotate-135";

	let open = $state(false);
	let externalTrigger = $state<HTMLElement | null>(null);

	const rootProps = [
		{
			prop: "open",
			type: "boolean",
			default: "undefined",
			description:
				"Controlled open state. Bindable; `onOpenChange` still fires on every transition.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Open state the dial seeds itself with when uncontrolled.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description: "Called on every open/close transition, in both modes.",
		},
		{
			prop: "side",
			type: "'top' | 'right' | 'bottom' | 'left'",
			default: "'top'",
			description:
				'Which side of the trigger the actions fan out towards. Absolute — never mirrored under `dir="rtl"`.',
		},
		{
			prop: "activationMode",
			type: "'click' | 'hover'",
			default: "'click'",
			description: "Whether the trigger opens the dial on click or on hover.",
		},
		{
			prop: "delay",
			type: "number",
			default: "250",
			description: "How long, in ms, hover must dwell before opening. Only read in hover mode.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables the trigger and suppresses every activation.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Not populated in `child` mode.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: SpeedDialChildProps }]>",
			default: "—",
			description: "Render the root onto your own element. Replaces upstream’s `asChild`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the element. A caller `onpointerdowncapture` runs before the dial’s own guard and may `preventDefault()` it.",
		},
	];

	const contentProps = [
		{
			prop: "offset",
			type: "number",
			default: "8",
			description: "Distance in px between the trigger and the content.",
		},
		{
			prop: "gap",
			type: "number",
			default: "8",
			description: "Gap in px between action items.",
		},
		{
			prop: "forceMount",
			type: "boolean",
			default: "false",
			description:
				"Keep the content mounted while closed, so an external library can own the exit.",
		},
		{
			prop: "onEscapeKeyDown",
			type: "(event: KeyboardEvent) => void",
			default: "—",
			description: "Called on `Escape` before closing. `preventDefault()` keeps the dial open.",
		},
		{
			prop: "onInteractOutside",
			type: "(event: SpeedDialInteractOutsideEvent) => void",
			default: "—",
			description:
				"Called when a pointer press lands outside the dial, carrying `detail.originalEvent`. `preventDefault()` keeps it open.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: SpeedDialContentChildProps }]>",
			default: "—",
			description: "Render the content onto your own element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the element. A caller `style` wins over every custom property below.",
		},
	];

	const actionProps = [
		{
			prop: "onSelect",
			type: "(event: SpeedDialActionSelectEvent) => void",
			default: "—",
			description:
				"Called when the action is selected, before the dial closes. `preventDefault()` keeps it open.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "undefined",
			description: "Disables the action and removes it from the `Tab` exit boundary.",
		},
		{
			prop: "id",
			type: "string",
			default: "the item’s generated id",
			description: "Overrides the id the item generates for this action.",
		},
		{
			prop: "variant / size",
			type: "ButtonVariant / ButtonSize",
			default: "'outline' / 'icon'",
			description: "Forwarded to the composed `Button`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: SpeedDialActionChildProps }]>",
			default: "—",
			description: "Render the action onto your own element.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "every part", values: "speed-dial, speed-dial-trigger, …" },
		{ attribute: "[data-state]", part: "root, trigger", values: "open | closed — tracks `open`" },
		{
			attribute: "[data-state]",
			part: "content, item",
			values: "open | closed — tracks the animation, one frame behind",
		},
		{ attribute: "[data-disabled]", part: "root", values: "present only when disabled" },
		{ attribute: "[data-orientation]", part: "content", values: "horizontal | vertical" },
		{ attribute: "[data-side]", part: "content, item", values: "top | right | bottom | left" },
	];

	const cssVariables = [
		{
			name: "--speed-dial-gap",
			part: "content",
			value: "Gap between action items. Defaults to 8px.",
		},
		{
			name: "--speed-dial-offset",
			part: "content",
			value: "Offset distance from the trigger. Defaults to 8px.",
		},
		{
			name: "--speed-dial-transform-origin",
			part: "content",
			value:
				"Corner the open/close scale grows out of, derived from `side`. It is set on the content, which is the element that transforms — not on each item.",
		},
		{
			name: "--speed-dial-animation-duration",
			part: "item",
			value: "Duration of an item’s enter/exit transition. Defaults to 200ms.",
		},
		{
			name: "--speed-dial-delay",
			part: "item",
			value: "Stagger delay: `index × 50ms` while opening, reversed while closing.",
		},
	];

	const keyboard = [
		{
			keys: "Enter, Space",
			description: "When focus is on the trigger, toggles the dial open/closed.",
		},
		{ keys: "Escape", description: "Closes the dial and returns focus to the trigger." },
		{
			keys: "Tab",
			description:
				"Moves focus between actions. Closes the dial when focus leaves the last enabled action.",
		},
		{
			keys: "Shift + Tab",
			description:
				"Moves focus to the previous action. Closes the dial when focus leaves the trigger, the first node of the composite.",
		},
	];
</script>

<DocPage title="Speed dial">
	{#snippet subtitle()}
		A floating action button that reveals a set of actions when triggered.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<SpeedDial.Root>
					<SpeedDial.Trigger class={triggerClass}>
						<PlusIcon />
					</SpeedDial.Trigger>
					<SpeedDial.Content>
						<SpeedDial.Item>
							<SpeedDial.Label class="sr-only">Share</SpeedDial.Label>
							<SpeedDial.Action onSelect={() => toast.success("Shared")}>
								<Share2Icon />
							</SpeedDial.Action>
						</SpeedDial.Item>
						<SpeedDial.Item>
							<SpeedDial.Label class="sr-only">Copy</SpeedDial.Label>
							<SpeedDial.Action onSelect={() => toast.success("Copied")}>
								<CopyIcon />
							</SpeedDial.Action>
						</SpeedDial.Item>
						<SpeedDial.Item>
							<SpeedDial.Label class="sr-only">Like</SpeedDial.Label>
							<SpeedDial.Action onSelect={() => toast.success("Liked")}>
								<HeartIcon />
							</SpeedDial.Action>
						</SpeedDial.Item>
					</SpeedDial.Content>
				</SpeedDial.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With labels">
		{#snippet blurb()}
			— visible labels next to each action.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<SpeedDial.Root>
					<SpeedDial.Trigger class={triggerClass}>
						<PlusIcon />
					</SpeedDial.Trigger>
					<SpeedDial.Content>
						<SpeedDial.Item>
							<SpeedDial.Label>Share</SpeedDial.Label>
							<SpeedDial.Action onSelect={() => toast.success("Shared")}>
								<Share2Icon />
							</SpeedDial.Action>
						</SpeedDial.Item>
						<SpeedDial.Item>
							<SpeedDial.Label>Copy</SpeedDial.Label>
							<SpeedDial.Action onSelect={() => toast.success("Copied")}>
								<CopyIcon />
							</SpeedDial.Action>
						</SpeedDial.Item>
						<SpeedDial.Item>
							<SpeedDial.Label>Like</SpeedDial.Label>
							<SpeedDial.Action onSelect={() => toast.success("Liked")}>
								<HeartIcon />
							</SpeedDial.Action>
						</SpeedDial.Item>
					</SpeedDial.Content>
				</SpeedDial.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Hover mode">
		{#snippet blurb()}
			`activationMode="hover"` opens after `delay` ms and closes shortly after the pointer leaves
			both the trigger and the content.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<SpeedDial.Root activationMode="hover" delay={300}>
					<SpeedDial.Trigger class={triggerClass}>
						<PlusIcon />
					</SpeedDial.Trigger>
					<SpeedDial.Content>
						<SpeedDial.Item>
							<SpeedDial.Label class="sr-only">Share</SpeedDial.Label>
							<SpeedDial.Action onSelect={() => toast.success("Shared")}>
								<Share2Icon />
							</SpeedDial.Action>
						</SpeedDial.Item>
						<SpeedDial.Item>
							<SpeedDial.Label class="sr-only">Copy</SpeedDial.Label>
							<SpeedDial.Action onSelect={() => toast.success("Copied")}>
								<CopyIcon />
							</SpeedDial.Action>
						</SpeedDial.Item>
						<SpeedDial.Item>
							<SpeedDial.Label class="sr-only">Like</SpeedDial.Label>
							<SpeedDial.Action onSelect={() => toast.success("Liked")}>
								<HeartIcon />
							</SpeedDial.Action>
						</SpeedDial.Item>
					</SpeedDial.Content>
				</SpeedDial.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled state">
		{#snippet blurb()}
			`bind:open` keeps the page authoritative, and `onInteractOutside` keeps the external toggle
			from closing the dial before its own click lands.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-4">
					<SpeedDial.Root bind:open>
						<SpeedDial.Trigger class={triggerClass}>
							{#if open}
								<XIcon />
							{:else}
								<PlusIcon />
							{/if}
						</SpeedDial.Trigger>
						<SpeedDial.Content
							onInteractOutside={(event) => {
								if (externalTrigger?.contains(event.detail.originalEvent.target as Node)) {
									event.preventDefault();
								}
							}}
						>
							<SpeedDial.Item>
								<SpeedDial.Label class="sr-only">Share</SpeedDial.Label>
								<SpeedDial.Action onSelect={() => toast.success("Shared")}>
									<Share2Icon />
								</SpeedDial.Action>
							</SpeedDial.Item>
							<SpeedDial.Item>
								<SpeedDial.Label class="sr-only">Copy</SpeedDial.Label>
								<SpeedDial.Action onSelect={() => toast.success("Copied")}>
									<CopyIcon />
								</SpeedDial.Action>
							</SpeedDial.Item>
							<SpeedDial.Item>
								<SpeedDial.Label class="sr-only">Like</SpeedDial.Label>
								<SpeedDial.Action onSelect={() => toast.success("Liked")}>
									<HeartIcon />
								</SpeedDial.Action>
							</SpeedDial.Item>
						</SpeedDial.Content>
					</SpeedDial.Root>
					<Button bind:ref={externalTrigger} variant="outline" onclick={() => (open = !open)}>
						Toggle
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sides">
		{#snippet blurb()}
			`side` is absolute — it is never mirrored under `dir="rtl"`.
		{/snippet}
		<Card.Root>
			<Card.Content class="min-h-96">
				<div class="grid grid-cols-2 gap-24">
					{#each SIDES as side (side)}
						<div class="flex flex-col items-center gap-2">
							<span class="text-sm text-muted-foreground capitalize">{side}</span>
							<SpeedDial.Root {side}>
								<SpeedDial.Trigger class={triggerClass}>
									<PlusIcon />
								</SpeedDial.Trigger>
								<SpeedDial.Content>
									<SpeedDial.Item>
										<SpeedDial.Label class="sr-only">Share</SpeedDial.Label>
										<SpeedDial.Action onSelect={() => toast.success("Shared")}>
											<Share2Icon />
										</SpeedDial.Action>
									</SpeedDial.Item>
									<SpeedDial.Item>
										<SpeedDial.Label class="sr-only">Copy</SpeedDial.Label>
										<SpeedDial.Action onSelect={() => toast.success("Copied")}>
											<CopyIcon />
										</SpeedDial.Action>
									</SpeedDial.Item>
									<SpeedDial.Item>
										<SpeedDial.Label class="sr-only">Like</SpeedDial.Label>
										<SpeedDial.Action onSelect={() => toast.success("Liked")}>
											<HeartIcon />
										</SpeedDial.Action>
									</SpeedDial.Item>
								</SpeedDial.Content>
							</SpeedDial.Root>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Fixed positioning">
		{#snippet blurb()}
			To pin the dial to a corner of the viewport, put the positioning classes on
			<code>SpeedDial.Root</code>, never on <code>SpeedDial.Trigger</code>. The content is
			<code>absolute</code> relative to the root, so a <code>fixed</code> trigger would leave it behind.
		{/snippet}
		<pre class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-sm"><code
				>{`<SpeedDial.Root class="fixed right-4 bottom-4">
	<SpeedDial.Trigger><PlusIcon /></SpeedDial.Trigger>
	<SpeedDial.Content><!-- actions --></SpeedDial.Content>
</SpeedDial.Root>`}</code
			></pre>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">SpeedDial.Root</h3>
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
			<h3 class="text-base font-medium">SpeedDial.Content</h3>
			<p class="text-sm text-muted-foreground">
				The <code>role="group"</code> container that fans the items out — a labelled group of
				buttons rather than a menu, since the composite traverses with <code>Tab</code> instead of
				arrow keys. Absent from the DOM while closed unless <code>forceMount</code> is set.
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
			<h3 class="text-base font-medium">SpeedDial.Action</h3>
			<p class="text-sm text-muted-foreground">
				A plain <code>role="button"</code> action (the content is a group, not a menu, so there is
				no <code>menuitem</code>), named by its sibling
				<code>SpeedDial.Label</code> through <code>aria-labelledby</code> — visible or
				<code>sr-only</code>. <code>SpeedDial.Trigger</code> takes the same
				<code>Button</code> props plus <code>disabled</code> and <code>id</code>;
				<code>SpeedDial.Item</code> and <code>SpeedDial.Label</code> take only the shared set.
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
			<h3 class="text-base font-medium">CSS variables</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Variable</Table.Head>
								<Table.Head>Set on</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each cssVariables as row (`${row.name}-${row.part}`)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.name}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.part}</Table.Cell>
									<Table.Cell>{row.value}</Table.Cell>
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
