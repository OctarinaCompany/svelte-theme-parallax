<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import SendIcon from "@lucide/svelte/icons/send";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as ModelSelector from "$lib/components/ui/model-selector/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";
	import {
		findSampleModel,
		findSampleProvider,
		MODEL_SELECTOR_SAMPLE_BROKEN_SRC,
		MODEL_SELECTOR_SAMPLE_GROUPS,
		MODEL_SELECTOR_SAMPLE_LOGOS,
	} from "./model-selector-sample-models.js";

	/**
	 * The Model selector page.
	 *
	 * Every `ModelSelector.Logo` on this page carries a `src`: the component's default points
	 * at models.dev, and the gallery must not make that request — see the header of
	 * `model-selector-sample-models.ts` for the three reasons. An application that is happy to
	 * load from models.dev drops the prop and gets the real marks.
	 */

	/* The toolbar demo: the picked model and whether its picker is open. */
	let modelId = $state("claude-sonnet-5");
	let open = $state(false);
	const selected = $derived(findSampleModel(modelId));
	const selectedProvider = $derived(findSampleProvider(modelId) ?? "anthropic");

	/* The controlled demo: the caller owns `open` and counts real transitions. */
	let controlledOpen = $state(false);
	let controlledModelId = $state("claude-opus-5");
	let transitions = $state(0);

	/* The one-shot dialog demo. */
	let dialogOpen = $state(false);
	let dialogModelId = $state("claude-haiku-5");

	const rootProps = [
		{
			prop: "open",
			type: "boolean",
			default: "false",
			description:
				"Bindable. Whether the picker is shown. A parent-driven write moves the dialog without firing `onOpenChange`.",
		},
		{
			prop: "onOpenChange",
			type: "OnChangeFn<boolean>",
			default: "—",
			description:
				"Fired once per real transition — Escape, a click outside, an item's `closeOnSelect`, a `Trigger` click — and never for a write the parent made through the binding.",
		},
		{
			prop: "onOpenChangeComplete",
			type: "OnChangeFn<boolean>",
			default: "—",
			description: "Fired by the dialog primitive once the open or close animation has finished.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The trigger and the content. The root renders no element of its own: it is the dialog primitive's context provider.",
		},
	];

	const triggerProps = [
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered button. Not populated in `child` mode.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: Record<string, unknown> }]>",
			default: "—",
			description:
				"Render the trigger onto your own element — a `Button`, typically. Spread `props` to receive `aria-haspopup`, `aria-expanded`, `data-state` and the click handler.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The button's content. Not rendered when `child` is supplied.",
		},
		{
			prop: "...restProps",
			type: "HTMLButtonAttributes",
			default: "—",
			description:
				"Every other attribute and DOM handler is spread onto the button. `type` defaults to `button`.",
		},
	];

	const contentProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the dialog content element.",
		},
		{
			prop: "title",
			type: "string",
			default: "'Model selector'",
			description:
				"The dialog's accessible name, rendered visually hidden. Screen readers announce it when the picker opens.",
		},
		{
			prop: "showCloseButton",
			type: "boolean",
			default: "false",
			description:
				"Whether the dialog's `X` renders. Off by default because in a `p-0` content it overlaps the right end of the input row; Escape and a click outside close the picker regardless.",
		},
		{
			prop: "commandProps",
			type: "Omit<ComponentProps<typeof Command.Root>, 'children' | 'child'>",
			default: "—",
			description:
				"Spread onto the command root inside: `filter`, `shouldFilter`, `loop`, `value`, `onValueChange`, `label`, `class`. Not bindable through the spread — pass `value` and `onValueChange` together.",
		},
		{
			prop: "portalProps",
			type: "WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>",
			default: "—",
			description: "Forwarded to the dialog portal — `to`, `disabled`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last onto the dialog content, so it overrides `p-0` and the width cap.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The parts of the picker: input, list, groups, items.",
		},
		{
			prop: "...restProps",
			type: "WithoutChildrenOrChild<DialogPrimitive.ContentProps>",
			default: "—",
			description:
				"Every other dialog-content prop — `onEscapeKeydown`, `onInteractOutside`, `onOpenAutoFocus`, `preventScroll` — and every attribute, spread onto the content element.",
		},
	];

	const dialogProps = [
		{
			prop: "open",
			type: "boolean",
			default: "false",
			description:
				"Bindable. Whether the dialog is shown. Follows the same one-transition rule as `Root`: a parent-driven write does not fire `onOpenChange`.",
		},
		{
			prop: "onOpenChange",
			type: "OnChangeFn<boolean>",
			default: "—",
			description:
				"Fired once per real transition, including the close an item's `closeOnSelect` performs.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				"Bindable reference to the command root inside the dialog — the element wrapping the input and the list — not to the dialog content element. The house `Command.Dialog` binds it there.",
		},
		{
			prop: "value",
			type: "string",
			default: "''",
			description: "Bindable. The command root's highlighted item value.",
		},
		{
			prop: "title",
			type: "string",
			default: "'Model selector'",
			description: "The visually hidden dialog title.",
		},
		{
			prop: "description",
			type: "string",
			default: "'Type to filter the list, then pick a model.'",
			description: "The visually hidden dialog description.",
		},
		{
			prop: "showCloseButton",
			type: "boolean",
			default: "false",
			description: "Whether the dialog's `X` renders. Inherited from the house `Command.Dialog`.",
		},
		{
			prop: "portalProps",
			type: "DialogPrimitive.PortalProps",
			default: "—",
			description: "Forwarded to the dialog portal — `to`, `disabled`.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged onto the dialog content. The house `Command.Dialog` pins it at `top-1/3`; pass `top-1/2 -translate-y-1/2` to centre it.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Required. The parts of the picker: input, list, groups, items.",
		},
		{
			prop: "...restProps",
			type: "WithoutChildrenOrChild<DialogPrimitive.RootProps> & WithoutChildrenOrChild<CommandPrimitive.RootProps>",
			default: "—",
			description:
				"The dialog root's and the command root's remaining props — `loop`, `filter`, `shouldFilter`, `onOpenChangeComplete` — spread onto both, as the house `Command.Dialog` does.",
		},
	];

	const inputProps = [
		{
			prop: "ref",
			type: "HTMLInputElement | null",
			default: "null",
			description: "Bindable reference to the `<input>`.",
		},
		{
			prop: "value",
			type: "string",
			default: "''",
			description: "Bindable. The query. The command root filters and ranks items against it.",
		},
		{
			prop: "placeholder",
			type: "string",
			default: "'Search models…'",
			description: "The empty-field hint.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged onto the `<input>`, not onto the 32px group around it — height and padding set here do not change the row.",
		},
		{
			prop: "...restProps",
			type: "CommandPrimitive.InputProps",
			default: "—",
			description: "Every other `<input>` attribute and DOM handler.",
		},
	];

	const itemProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered row.",
		},
		{
			prop: "value",
			type: "string",
			default: "—",
			description:
				"What the query is matched against, and what the command root's `value` carries when this row is highlighted. Falls back to the row's text content; give a stable one when the content is dynamic.",
		},
		{
			prop: "keywords",
			type: "string[]",
			default: "—",
			description: "Extra strings the query may match — a model's display name beside its id.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description:
				'Stamps `aria-disabled="true"` and an empty `data-disabled`, and dims the row to half opacity with pointer events off. ArrowUp, ArrowDown, Home and End skip it — the primitive\'s valid-item filter keys on `aria-disabled` — and a click or Enter on it is ignored by the primitive, so it never selects and never closes the picker.',
		},
		{
			prop: "onSelect",
			type: "() => void",
			default: "—",
			description: "Fired on Enter or a click. Runs before `closeOnSelect` closes the picker.",
		},
		{
			prop: "closeOnSelect",
			type: "boolean",
			default: "true",
			description:
				"Whether a pick closes the picker. Only acts under a `Root` or `Dialog`; under a bare `Command.Root` there is nothing to close and it is ignored.",
		},
		{
			prop: "forceMount",
			type: "boolean",
			default: "—",
			description: "Keep the row mounted whatever the query says.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, after `gap-2 rounded-lg`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The row's content — a `Logo`, a `Name`, a description, a `Shortcut`.",
		},
		{
			prop: "...restProps",
			type: "CommandPrimitive.ItemProps",
			default: "—",
			description:
				"Every other attribute is spread onto the row. `data-checked={true}` shows the command item's built-in check mark.",
		},
	];

	const logoProps = [
		{
			prop: "ref",
			type: "HTMLImageElement | null",
			default: "null",
			description: "Bindable reference to the `<img>`. `null` while the fallback is shown.",
		},
		{
			prop: "provider",
			type: "ModelProvider",
			default: "—",
			description:
				"Required. One of `MODEL_PROVIDERS` for autocompletion, or any string. Names the logo, stamps `data-provider`, and — without `src` — builds the models.dev URL.",
		},
		{
			prop: "src",
			type: "string",
			default: "modelProviderLogoUrl(provider)",
			description:
				"Replaces the models.dev URL entirely. Changing it after a failure retries with the new URL.",
		},
		{
			prop: "fallback",
			type: "Snippet<[{ provider: ModelProvider; src: string }]>",
			default: "—",
			description:
				"Rendered instead of the image once it fails to load. Without it a failed logo renders nothing.",
		},
		{
			prop: "alt",
			type: "string",
			default: "''",
			description:
				"Decorative by default — the `Name` beside it already says which model this is. Set it where the logo stands alone.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, after `size-3 dark:invert`.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLImgAttributes, 'src'>",
			default: "—",
			description:
				"Every other `<img>` attribute. `onerror` is called after the component records the failure.",
		},
	];

	const partProps = [
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
			description: "Rendered inside the element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const nameProps = [
		{
			prop: "ref",
			type: "HTMLSpanElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<span>`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, after `flex-1 truncate text-left`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The model's name.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLSpanElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the `<span>`.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "ModelSelector.Trigger", values: "model-selector-trigger" },
		{ attribute: "[data-slot]", part: "ModelSelector.Content", values: "model-selector-content" },
		{ attribute: "[data-slot]", part: "ModelSelector.Input", values: "model-selector-input" },
		{ attribute: "[data-slot]", part: "ModelSelector.Item", values: "model-selector-item" },
		{ attribute: "[data-slot]", part: "ModelSelector.Logo", values: "model-selector-logo" },
		{
			attribute: "[data-slot]",
			part: "ModelSelector.LogoGroup",
			values: "model-selector-logo-group",
		},
		{ attribute: "[data-slot]", part: "ModelSelector.Name", values: "model-selector-name" },
		{
			attribute: "[data-slot]",
			part: "ModelSelector.Dialog",
			values:
				"model-selector-dialog — on the command root inside the dialog; the dialog content keeps the house dialog-content",
		},
		{
			attribute: "[data-slot]",
			part: "List / Empty / Group / Separator / Shortcut",
			values: "command-list | command-empty | command-group | command-separator | command-shortcut",
		},
		{
			attribute: "[data-state]",
			part: "ModelSelector.Trigger, ModelSelector.Content",
			values: "open | closed",
		},
		{
			attribute: "[data-selected]",
			part: "ModelSelector.Item",
			values: "present on the highlighted row",
		},
		{
			attribute: "[data-disabled]",
			part: "ModelSelector.Item",
			values: "present (empty) on a disabled row; absent otherwise",
		},
		{
			attribute: "[aria-disabled]",
			part: "ModelSelector.Item",
			values: "true | false — what the arrow keys' valid-item filter tests",
		},
		{
			attribute: "[data-checked]",
			part: "ModelSelector.Item",
			values: "caller-stamped; `true` shows the check mark",
		},
		{ attribute: "[data-provider]", part: "ModelSelector.Logo", values: "the provider slug" },
	];

	const keyboard = [
		{
			keys: "Typing",
			description:
				"Filters the list against each item's `value` and `keywords`; the best match is highlighted.",
		},
		{
			keys: "ArrowDown / ArrowUp",
			description:
				"Highlights the next / previous enabled row. Stops at the ends unless `commandProps={{ loop: true }}`.",
		},
		{ keys: "Home / End", description: "Highlights the first / last enabled row." },
		{
			keys: "Enter",
			description:
				"Picks the highlighted row: its `onSelect` fires, then the picker closes unless `closeOnSelect` is `false`.",
		},
		{
			keys: "Escape",
			description: "Closes the picker. `onOpenChange(false)` fires; the pick is unchanged.",
		},
		{
			keys: "Ctrl + N / Ctrl + J, Ctrl + P / Ctrl + K",
			description:
				"Next / previous row — the command primitive's vim bindings, on unless `vimBindings` is `false`.",
		},
	];
</script>

<DocPage title="Model selector">
	{#snippet subtitle()}
		A dialog holding a filterable list of models, opened from a trigger that shows the current
		choice. A command palette shaped for one job: pick one model out of a few groups.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			The trigger is a <code>child</code> snippet over a ghost <code>Button</code>, the shape a
			prompt footer wants. Picking a row runs its <code>onSelect</code> and closes the picker; the disabled
			row states its reason in place of a description and cannot be reached by the arrow keys.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div
					class="flex w-full max-w-xl items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5"
				>
					<ModelSelector.Root bind:open>
						<ModelSelector.Trigger>
							{#snippet child({ props })}
								<Button variant="ghost" size="sm" {...props}>
									<ModelSelector.Logo
										provider={selectedProvider}
										src={MODEL_SELECTOR_SAMPLE_LOGOS[selectedProvider]}
									/>
									<ModelSelector.Name>{selected?.name ?? modelId}</ModelSelector.Name>
									<ChevronDownIcon data-icon="inline-end" />
								</Button>
							{/snippet}
						</ModelSelector.Trigger>
						<ModelSelector.Content>
							<ModelSelector.Input />
							<ModelSelector.List>
								<ModelSelector.Empty>No model matches.</ModelSelector.Empty>
								{#each MODEL_SELECTOR_SAMPLE_GROUPS as group (group.heading)}
									<ModelSelector.Group heading={group.heading}>
										{#each group.models as model (model.id)}
											<ModelSelector.Item
												value={model.id}
												keywords={[model.name, group.heading]}
												disabled={model.unavailable !== undefined}
												data-checked={model.id === modelId}
												onSelect={() => (modelId = model.id)}
											>
												<ModelSelector.Logo
													provider={group.provider}
													src={MODEL_SELECTOR_SAMPLE_LOGOS[group.provider]}
												/>
												<ModelSelector.Name>{model.name}</ModelSelector.Name>
												<span class="truncate text-xs text-muted-foreground">
													{model.unavailable ?? model.description}
												</span>
											</ModelSelector.Item>
										{/each}
									</ModelSelector.Group>
								{/each}
							</ModelSelector.List>
						</ModelSelector.Content>
					</ModelSelector.Root>
					<Button size="icon-sm" aria-label="Send">
						<SendIcon />
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled open state">
		{#snippet blurb()}
			Bind <code>open</code> to drive the picker from outside. A write the parent makes moves the
			dialog without firing <code>onOpenChange</code>; Escape, a click outside and a pick each fire
			it exactly once.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center gap-4">
					<Button variant="outline" onclick={() => (controlledOpen = true)}>
						Open from outside
					</Button>
					<p class="text-sm text-muted-foreground">
						open: <code>{controlledOpen}</code> · onOpenChange fired
						<code>{transitions}</code>
						{transitions === 1 ? "time" : "times"} · picked <code>{controlledModelId}</code>
					</p>
				</div>
				<ModelSelector.Root bind:open={controlledOpen} onOpenChange={() => transitions++}>
					<ModelSelector.Content title="Pick a model">
						<ModelSelector.Input placeholder="Filter by name or provider…" />
						<ModelSelector.List>
							<ModelSelector.Empty>No model matches.</ModelSelector.Empty>
							{#each MODEL_SELECTOR_SAMPLE_GROUPS as group (group.heading)}
								<ModelSelector.Group heading={group.heading}>
									{#each group.models as model (model.id)}
										<ModelSelector.Item
											value={model.id}
											keywords={[model.name, group.heading]}
											disabled={model.unavailable !== undefined}
											data-checked={model.id === controlledModelId}
											onSelect={() => (controlledModelId = model.id)}
										>
											<ModelSelector.Logo
												provider={group.provider}
												src={MODEL_SELECTOR_SAMPLE_LOGOS[group.provider]}
											/>
											<ModelSelector.Name>{model.name}</ModelSelector.Name>
											<span class="truncate text-xs text-muted-foreground">
												{model.unavailable ?? model.description}
											</span>
										</ModelSelector.Item>
									{/each}
								</ModelSelector.Group>
							{/each}
						</ModelSelector.List>
					</ModelSelector.Content>
				</ModelSelector.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="One-shot dialog">
		{#snippet blurb()}
			<code>ModelSelector.Dialog</code> is root, content and command root in one part, for a picker
			opened from code rather than from a trigger in the tree. It sits at
			<code>top-1/3</code>
			like the house command palette, and its items close it the same way.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center gap-4">
					<Button variant="outline" onclick={() => (dialogOpen = true)}>Pick a model…</Button>
					<p class="text-sm text-muted-foreground">
						picked <code>{dialogModelId}</code>
					</p>
				</div>
				<ModelSelector.Dialog bind:open={dialogOpen}>
					<ModelSelector.Input />
					<ModelSelector.List>
						<ModelSelector.Empty>No model matches.</ModelSelector.Empty>
						{#each MODEL_SELECTOR_SAMPLE_GROUPS as group, index (group.heading)}
							{#if index > 0}
								<ModelSelector.Separator />
							{/if}
							<ModelSelector.Group heading={group.heading}>
								{#each group.models as model (model.id)}
									<ModelSelector.Item
										value={model.id}
										keywords={[model.name, group.heading]}
										disabled={model.unavailable !== undefined}
										data-checked={model.id === dialogModelId}
										onSelect={() => (dialogModelId = model.id)}
									>
										<ModelSelector.Logo
											provider={group.provider}
											src={MODEL_SELECTOR_SAMPLE_LOGOS[group.provider]}
										/>
										<ModelSelector.Name>{model.name}</ModelSelector.Name>
									</ModelSelector.Item>
								{/each}
							</ModelSelector.Group>
						{/each}
					</ModelSelector.List>
				</ModelSelector.Dialog>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Logos and fallback">
		{#snippet blurb()}
			<code>ModelSelector.LogoGroup</code> overlaps several marks into one stack. A
			<code>Logo</code>
			whose image fails to load renders its <code>fallback</code> snippet, or nothing at all without
			one — never a broken-image glyph. Every logo here passes <code>src</code>, so this page makes
			no request to models.dev.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4 text-sm">
					<div class="flex items-center gap-3">
						<ModelSelector.LogoGroup>
							<ModelSelector.Logo
								provider="anthropic"
								src={MODEL_SELECTOR_SAMPLE_LOGOS.anthropic}
							/>
							<ModelSelector.Logo provider="openai" src={MODEL_SELECTOR_SAMPLE_LOGOS.openai} />
						</ModelSelector.LogoGroup>
						<span>Two providers, one stack</span>
					</div>
					<div class="flex items-center gap-3">
						<ModelSelector.Logo provider="nowhere" src={MODEL_SELECTOR_SAMPLE_BROKEN_SRC}>
							{#snippet fallback({ provider })}
								<span
									class="flex size-3 items-center justify-center rounded-full bg-muted text-[8px] font-medium text-muted-foreground uppercase"
									aria-hidden="true"
								>
									{provider.slice(0, 1)}
								</span>
							{/snippet}
						</ModelSelector.Logo>
						<span>A logo that failed, replaced by its <code>fallback</code></span>
					</div>
					<div class="flex items-center gap-3">
						<ModelSelector.Logo provider="nowhere" src={MODEL_SELECTOR_SAMPLE_BROKEN_SRC} />
						<span>The same failure with no <code>fallback</code>: nothing before this text</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		{#snippet blurb()}
			<code>List</code>, <code>Empty</code>, <code>Group</code>, <code>Separator</code> and
			<code>Shortcut</code> are the command palette's own parts re-exported unchanged — see the
			<a class="text-primary" href={href("/components/command")}>Command</a> page for their props. Everything
			else is documented here.
		{/snippet}

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">ModelSelector.Root</h3>
			<p class="text-sm text-muted-foreground">
				The dialog root. Renders no element; owns <code>open</code> and publishes it on context so
				<code>Item</code> can close the picker after a pick.
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
			<h3 class="text-base font-medium">ModelSelector.Trigger</h3>
			<p class="text-sm text-muted-foreground">
				The button that opens the picker. Renders a <code>button</code> unless a
				<code>child</code> snippet is supplied.
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
			<h3 class="text-base font-medium">ModelSelector.Content</h3>
			<p class="text-sm text-muted-foreground">
				The dialog surface. Renders the dialog content with a visually hidden title and a command
				root inside it; the input, list and items are its children.
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
			<h3 class="text-base font-medium">ModelSelector.Dialog</h3>
			<p class="text-sm text-muted-foreground">
				Root, content and command root in one part — the house <code>Command.Dialog</code> with a
				picker context around it. Renders a dialog pinned at <code>top-1/3</code>.
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
							{#each dialogProps as row (row.prop)}
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
			<h3 class="text-base font-medium">ModelSelector.Input</h3>
			<p class="text-sm text-muted-foreground">
				The search field. Renders the house command input — a 32px input group with a search addon —
				unchanged.
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
			<h3 class="text-base font-medium">ModelSelector.Item</h3>
			<p class="text-sm text-muted-foreground">
				One model. Renders a command item — a <code>div</code> with <code>role="option"</code> — that
				closes the picker after a pick.
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
			<h3 class="text-base font-medium">ModelSelector.Logo</h3>
			<p class="text-sm text-muted-foreground">
				A provider's mark. Renders a 12px lazy-loaded <code>img</code>, inverted in dark mode, or
				its <code>fallback</code> once the image has failed.
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
							{#each logoProps as row (row.prop)}
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
			<h3 class="text-base font-medium">ModelSelector.LogoGroup</h3>
			<p class="text-sm text-muted-foreground">
				A stack of logos. Renders a <code>div</code> that overlaps its <code>img</code> children by 4px,
				each rounded and ringed in the page ground.
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
							{#each partProps as row (row.prop)}
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
			<h3 class="text-base font-medium">ModelSelector.Name</h3>
			<p class="text-sm text-muted-foreground">
				The model's name. Renders a <code>span</code> that takes the row's free width and truncates.
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
							{#each nameProps as row (row.prop)}
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
				The list is the command primitive's: focus stays in the input and the keys move a highlight
				through the rows.
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
