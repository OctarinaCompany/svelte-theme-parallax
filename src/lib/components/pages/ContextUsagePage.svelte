<script lang="ts">
	import PaperclipIcon from "@lucide/svelte/icons/paperclip";
	import SendHorizontalIcon from "@lucide/svelte/icons/send-horizontal";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as ContextUsage from "$lib/components/ui/context-usage/index.js";
	import {
		formatPercent,
		formatTokens,
		formatUsd,
		usedRatio,
		type ContextCost,
		type TokenUsage,
	} from "$lib/components/ui/context-usage/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Context usage component page: AI Elements' `Context`, the percentage-and-ring button
	 * that sits in a prompt footer and opens a card of token counts and cost.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. What there is to theme is already themed: the button
	 * is the house `Button`, the ring the house `CircularProgress`, the bar the house `Progress`,
	 * and the card the house `HoverCard` — this component adds no colour of its own, and every
	 * demo below reads its look off those four pages.
	 */

	type ContextSample = {
		usedTokens: number;
		maxTokens: number;
		modelId?: string;
		usage?: TokenUsage;
		cost?: ContextCost;
	};

	/**
	 * A mid-conversation reading against a 1M-token window. The counts are disjoint — input,
	 * output and reasoning sum to `usedTokens`, and the cache figure is the share of the input
	 * served from the prompt cache — so the rows in the card add up to the header. The dollar
	 * figures are at the model's list rates at the time of writing, with cache reads at a tenth
	 * of the input rate; they are the caller's to compute, and the component prints what it is
	 * given.
	 */
	const sonnet: ContextSample = {
		usedTokens: 142_000,
		maxTokens: 1_000_000,
		modelId: "claude-sonnet-5",
		usage: {
			inputTokens: 118_400,
			outputTokens: 14_600,
			reasoningTokens: 9_000,
			cachedInputTokens: 96_000,
			totalTokens: 142_000,
		},
		cost: {
			inputUsd: 0.0448,
			outputUsd: 0.146,
			reasoningUsd: 0.09,
			cacheUsd: 0.0192,
			totalUsd: 0.3,
		},
	};

	/** The same reading from a transport that reports counts but no prices. */
	const uncosted: ContextSample = {
		usedTokens: sonnet.usedTokens,
		maxTokens: sonnet.maxTokens,
		modelId: sonnet.modelId,
		usage: sonnet.usage,
	};

	/**
	 * The edges of the ratio. `nearlyFull` is what the ring looks like just before the window
	 * closes; `overrun` is a conversation that has already passed it, which upstream would print
	 * as `120%`; `emptyWindow` is a `maxTokens` nothing has set yet, which upstream would print
	 * as `NaN%`.
	 */
	const nearlyFull: ContextSample = { usedTokens: 950_000, maxTokens: 1_000_000 };
	const overrun: ContextSample = { usedTokens: 1_200_000, maxTokens: 1_000_000 };
	const emptyWindow: ContextSample = { usedTokens: 142_000, maxTokens: 0 };

	const clampSamples: { label: string; sample: ContextSample }[] = [
		{ label: "950K of 1M", sample: nearlyFull },
		{ label: "1.2M of 1M", sample: overrun },
		{ label: "142K of 0", sample: emptyWindow },
	];

	/** Whether the toolbar sample's card is showing, bound to demonstrate `open`. */
	let toolbarOpen = $state(false);

	/**
	 * The formatters, called rather than described: every cell in the table below is the
	 * function's real output for the argument beside it.
	 */
	const formattingRows: { call: string; output: string }[] = [
		{ call: "formatTokens(950)", output: formatTokens(950) },
		{ call: "formatTokens(142000)", output: formatTokens(142_000) },
		{ call: "formatTokens(1000000)", output: formatTokens(1_000_000) },
		{ call: "formatTokens(undefined)", output: formatTokens(undefined) },
		{ call: "formatPercent(0.142)", output: formatPercent(0.142) },
		{ call: "formatPercent(0.95)", output: formatPercent(0.95) },
		{ call: "formatPercent(1)", output: formatPercent(1) },
		{ call: "formatUsd(0.3)", output: formatUsd(0.3) },
		{ call: "formatUsd(0.0448)", output: formatUsd(0.0448) },
		{ call: "formatUsd(0.00005)", output: formatUsd(0.00005) },
		{ call: "usedRatio(142000, 1000000)", output: String(usedRatio(142_000, 1_000_000)) },
		{ call: "usedRatio(1200000, 1000000)", output: String(usedRatio(1_200_000, 1_000_000)) },
		{ call: "usedRatio(142000, 0)", output: String(usedRatio(142_000, 0)) },
	];

	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLSpanElement | null",
			default: "null",
			description: "Bindable reference to the root element.",
		},
		{
			prop: "usedTokens",
			type: "number",
			default: "—",
			description:
				"Tokens currently occupying the window. Required. A non-finite value reads as `0`; a value above `maxTokens` reads as `100%`.",
		},
		{
			prop: "maxTokens",
			type: "number",
			default: "—",
			description:
				"The window's size in tokens. Required. A value that is not a finite number greater than zero makes every ratio read as `0`, never `NaN`.",
		},
		{
			prop: "usage",
			type: "TokenUsage",
			default: "—",
			description:
				"Per-kind counts for the usage rows, shaped like the AI SDK's `LanguageModelUsage`. A row whose count is missing, zero or negative renders nothing.",
		},
		{
			prop: "cost",
			type: "ContextCost",
			default: "—",
			description:
				"Per-kind dollar figures. A row shows its figure only when the matching field exists. The footer shows `totalUsd`, or the sum of the fields present when it is absent, and renders nothing when there is neither.",
		},
		{
			prop: "modelId",
			type: "string",
			default: "—",
			description:
				"The model the window belongs to. Stamped as `data-model` and carried on the state for a custom body; no default part renders it.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "false",
			description: "Whether the card is showing. Bindable; stamped as `data-state`.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description:
				"Fired when the card opens or closes itself — pointer, focus, Escape — never for a parent-driven write to `open`.",
		},
		{
			prop: "openDelay",
			type: "number",
			default: "0",
			description: "Milliseconds the pointer rests on the trigger before the card opens.",
		},
		{
			prop: "closeDelay",
			type: "number",
			default: "0",
			description: "Milliseconds after the pointer leaves before the card closes.",
		},
		{
			prop: "ignoreNonKeyboardFocus",
			type: "boolean",
			default: "—",
			description:
				"When `true`, a focus that came from a pointer does not open the card; only keyboard focus does. Forwarded to Bits UI's `LinkPreview.Root`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last onto the root, after its `inline-flex`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The trigger and the content.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLSpanElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the root element.",
		},
	];

	const triggerProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the button element.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "'ghost'",
			description: "The button's variant, as `Button` takes it.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'sm'",
			description:
				"The button's size, as `Button` takes it. Inside it the ring renders at the button's 16px icon size whatever `size` says.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last onto the button, after the variant classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the default label — the percentage beside `ContextUsage.Icon`. The button and its hover-card wiring stay.",
		},
		{
			prop: "...restProps",
			type: "ButtonProps",
			default: "—",
			description:
				"Every other `Button` prop and DOM handler, merged with the hover card's own pointer and focus handlers so a caller's `onfocus` chains after them rather than replacing them.",
		},
	];

	const iconProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the progressbar element.",
		},
		{
			prop: "size",
			type: "number",
			default: "20",
			description:
				"The ring's diameter in pixels when it stands alone. Inside `ContextUsage.Trigger` the button's icon rule renders it at 16px.",
		},
		{
			prop: "thickness",
			type: "number",
			default: "2",
			description: "The stroke width of the track and the range, in the ring's own units.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last onto the progressbar element, after `shrink-0`.",
		},
		{
			prop: "...restProps",
			type: "WithoutChildrenOrChild<CircularProgressRootProps>",
			default: "—",
			description:
				'Every other `CircularProgress.Root` prop. `value`, `min`, `max` and `aria-label` ("Model context usage") are set by the part and overridden by whatever is passed here.',
		},
	];

	const contentProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the card element.",
		},
		{
			prop: "side",
			type: "'top' | 'right' | 'bottom' | 'left'",
			default: "'top'",
			description:
				"Which side of the trigger the card opens on. Flips when it would leave the viewport.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, after the card's `min-w-60 divide-y divide-border overflow-hidden p-0`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The header, body and footer bands, in any combination.",
		},
		{
			prop: "...restProps",
			type: "ComponentProps<typeof HoverCard.Content>",
			default: "—",
			description:
				"Every other `HoverCard.Content` prop: `align`, `sideOffset`, collision handling, `portalProps` and the DOM attributes.",
		},
	];

	const bandProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered element. On ContentFooter it stays `null` while the band renders nothing.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, after the band's padding and layout classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the band's default content. For the footer, also makes it render when there is no cost.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const rowProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered element. `null` while the row renders nothing.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, after the row's `flex items-center justify-between gap-3 text-xs`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the label and the figures, and makes the row render even when its count is missing or zero.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const usageRows: { part: string; count: string; cost: string }[] = [
		{ part: "ContextUsage.InputUsage", count: "usage.inputTokens", cost: "cost.inputUsd" },
		{ part: "ContextUsage.OutputUsage", count: "usage.outputTokens", cost: "cost.outputUsd" },
		{
			part: "ContextUsage.ReasoningUsage",
			count: "usage.reasoningTokens",
			cost: "cost.reasoningUsd",
		},
		{ part: "ContextUsage.CacheUsage", count: "usage.cachedInputTokens", cost: "cost.cacheUsd" },
	];

	const dataAttributes: { attribute: string; part: string; values: string }[] = [
		{ attribute: "[data-slot]", part: "ContextUsage", values: "context-usage" },
		{ attribute: "[data-slot]", part: "ContextUsage.Trigger", values: "context-usage-trigger" },
		{ attribute: "[data-slot]", part: "ContextUsage.Icon", values: "context-usage-icon" },
		{ attribute: "[data-slot]", part: "ContextUsage.Content", values: "context-usage-content" },
		{
			attribute: "[data-slot]",
			part: "ContextUsage.ContentHeader",
			values: "context-usage-content-header",
		},
		{
			attribute: "[data-slot]",
			part: "ContextUsage.ContentBody",
			values: "context-usage-content-body",
		},
		{
			attribute: "[data-slot]",
			part: "ContextUsage.ContentFooter",
			values: "context-usage-content-footer",
		},
		{
			attribute: "[data-slot]",
			part: "ContextUsage.InputUsage and its three siblings",
			values:
				"context-usage-input-usage | context-usage-output-usage | context-usage-reasoning-usage | context-usage-cache-usage",
		},
		{
			attribute: "[data-percent]",
			part: "ContextUsage, ContextUsage.Trigger, ContextUsage.Icon",
			values: "0 – 100, the rounded share of the window in use",
		},
		{ attribute: "[data-state]", part: "ContextUsage", values: "open | closed" },
		{
			attribute: "[data-state]",
			part: "ContextUsage.Trigger, ContextUsage.Content",
			values: "open | closed — stamped by Bits UI's hover card",
		},
		{
			attribute: "[data-model]",
			part: "ContextUsage",
			values: "the `modelId` prop; absent when it is",
		},
		{
			attribute: "[data-kind]",
			part: "ContextUsage.InputUsage and its three siblings",
			values: "input | output | reasoning | cache",
		},
	];

	const keyboardRows: { key: string; description: string }[] = [
		{
			key: "Tab",
			description:
				"Focuses the trigger, which opens the card. Moving focus away closes it. With `ignoreNonKeyboardFocus`, only a keyboard focus opens it.",
		},
		{ key: "Escape", description: "Closes the card while it is open." },
	];
</script>

<DocPage title="Context usage">
	{#snippet subtitle()}
		How full the model's context window is: a percentage and a ring in a prompt footer, and on hover
		or focus a card with the used-of-max figures, one row per kind of token and the call's cost.
		Built on the house
		<a class="text-primary underline underline-offset-3" href={href("/components/hover-card")}
			>Hover card</a
		>,
		<a
			class="text-primary underline underline-offset-3"
			href={href("/components/circular-progress")}>Circular progress</a
		>
		and
		<a class="text-primary underline underline-offset-3" href={href("/components/progress")}
			>Progress</a
		>.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			A reading against a 1M-token window, with counts and cost. Hover the button or focus it with
			the keyboard; the card opens above it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center py-8">
					<ContextUsage.Root {...sonnet}>
						<ContextUsage.Trigger />
						<ContextUsage.Content>
							<ContextUsage.ContentHeader />
							<ContextUsage.ContentBody>
								<ContextUsage.InputUsage />
								<ContextUsage.OutputUsage />
								<ContextUsage.ReasoningUsage />
								<ContextUsage.CacheUsage />
							</ContextUsage.ContentBody>
							<ContextUsage.ContentFooter />
						</ContextUsage.Content>
					</ContextUsage.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Without cost">
		{#snippet blurb()}
			The same counts from a transport that reports no prices. The rows drop their dollar figures
			and the footer renders nothing at all — a blank, where upstream would print <code>$0.00</code
			>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center py-8">
					<ContextUsage.Root {...uncosted}>
						<ContextUsage.Trigger />
						<ContextUsage.Content>
							<ContextUsage.ContentHeader />
							<ContextUsage.ContentBody>
								<ContextUsage.InputUsage />
								<ContextUsage.OutputUsage />
								<ContextUsage.ReasoningUsage />
								<ContextUsage.CacheUsage />
							</ContextUsage.ContentBody>
							<ContextUsage.ContentFooter />
						</ContextUsage.Content>
					</ContextUsage.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Clamping">
		{#snippet blurb()}
			The ratio lives in <code>[0, 1]</code>. A window at 95% is what the ring looks like just
			before it closes; a conversation that has overrun its window reads <code>100%</code> rather
			than <code>120%</code>; and a window of <code>0</code> tokens reads <code>0%</code> rather
			than <code>NaN%</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-start justify-center gap-8 py-6">
					{#each clampSamples as item (item.label)}
						<div class="flex flex-col items-center gap-2">
							<ContextUsage.Root {...item.sample}>
								<ContextUsage.Trigger />
								<ContextUsage.Content>
									<ContextUsage.ContentHeader />
								</ContextUsage.Content>
							</ContextUsage.Root>
							<span class="text-xs tracking-label text-muted-foreground uppercase">
								{item.label}
							</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="In a toolbar">
		{#snippet blurb()}
			Where the control lives: the footer of a prompt, beside the other <code>sm</code> controls.
			The root is <code>inline-flex</code>, so it takes the place a button would; <code>open</code>
			is bound here to show the card's state.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-3">
					<div class="flex items-center gap-2 rounded-md border border-border bg-card p-2">
						<Button variant="ghost" size="icon-sm" aria-label="Attach a file">
							<PaperclipIcon />
						</Button>
						<span class="text-xs text-muted-foreground">{sonnet.modelId}</span>
						<div class="ms-auto flex items-center gap-1">
							<ContextUsage.Root {...sonnet} bind:open={toolbarOpen}>
								<ContextUsage.Trigger />
								<ContextUsage.Content>
									<ContextUsage.ContentHeader />
									<ContextUsage.ContentBody>
										<ContextUsage.InputUsage />
										<ContextUsage.OutputUsage />
										<ContextUsage.ReasoningUsage />
										<ContextUsage.CacheUsage />
									</ContextUsage.ContentBody>
									<ContextUsage.ContentFooter />
								</ContextUsage.Content>
							</ContextUsage.Root>
							<Button size="sm">
								<SendHorizontalIcon data-icon="inline-start" />
								Send
							</Button>
						</div>
					</div>
					<p class="text-xs text-muted-foreground">
						Card {toolbarOpen ? "open" : "closed"}.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Formatting">
		{#snippet blurb()}
			The formatters the parts use, exported for a custom body or a trigger label. Every cell in the
			right column is the function's real output.
		{/snippet}
		<Card.Root>
			<Card.Content class="px-0">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Call</Table.Head>
							<Table.Head>Output</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each formattingRows as row (row.call)}
							<Table.Row>
								<Table.Cell class="font-mono text-muted-foreground">{row.call}</Table.Cell>
								<Table.Cell class="font-mono">{row.output}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-8">
			{#snippet propTable(rows: PropRow[])}
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
					</Card.Content>
				</Card.Root>
			{/snippet}

			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">ContextUsage</h3>
				<p class="text-sm text-muted-foreground">
					The root: an <code>inline-flex</code> <code>span</code> wrapping the hover card, holding the
					reading every other part derives from and stamping it as data attributes.
				</p>
				{@render propTable(rootProps)}
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">ContextUsage.Trigger</h3>
				<p class="text-sm text-muted-foreground">
					The hover card's trigger, rendered as a ghost <code>Button</code> showing the percentage
					beside <code>ContextUsage.Icon</code>.
				</p>
				{@render propTable(triggerProps)}
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">ContextUsage.Icon</h3>
				<p class="text-sm text-muted-foreground">
					The ring: a <code>CircularProgress</code> with a track and a range, no value text.
					Standing alone it is a <code>role="progressbar"</code> whose <code>aria-valuenow</code>
					tracks the window; inside
					<code>ContextUsage.Trigger</code> ARIA makes the children of <code>role="button"</code>
					presentational, so the role is dropped there and the trigger's text carries the percentage.
				</p>
				{@render propTable(iconProps)}
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">ContextUsage.Content</h3>
				<p class="text-sm text-muted-foreground">
					The card: <code>HoverCard.Content</code> with its padding removed and a rule between the bands,
					opening above the trigger.
				</p>
				{@render propTable(contentProps)}
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">ContextUsage.ContentHeader</h3>
				<p class="text-sm text-muted-foreground">
					The first band: the percentage, <code>used / max</code> in compact figures, and a
					<code>Progress</code> bar. Renders a <code>div</code>.
				</p>
				{@render propTable(bandProps)}
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">ContextUsage.ContentBody</h3>
				<p class="text-sm text-muted-foreground">
					The middle band: a padded column for the usage rows. Renders a <code>div</code>.
				</p>
				{@render propTable(bandProps)}
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">ContextUsage.ContentFooter</h3>
				<p class="text-sm text-muted-foreground">
					The last band, on the secondary ground: "Total cost" and the figure. Renders a
					<code>div</code>, or nothing when there is no cost to show.
				</p>
				{@render propTable(bandProps)}
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">
					ContextUsage.InputUsage, OutputUsage, ReasoningUsage, CacheUsage
				</h3>
				<p class="text-sm text-muted-foreground">
					One row each: a label, the count in compact figures and, when the matching cost field
					exists, the figure after a bullet. Each renders a <code>div</code>, or nothing when its
					count is missing or zero. The four share one prop surface and differ only in what they
					read:
				</p>
				<Card.Root>
					<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Part</Table.Head>
									<Table.Head>Count</Table.Head>
									<Table.Head>Cost</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each usageRows as row (row.part)}
									<Table.Row>
										<Table.Cell class="font-medium">{row.part}</Table.Cell>
										<Table.Cell class="font-mono text-muted-foreground">{row.count}</Table.Cell>
										<Table.Cell class="font-mono text-muted-foreground">{row.cost}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
				{@render propTable(rowProps)}
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
				<h3 class="text-base font-medium">Keyboard</h3>
				<p class="text-sm text-muted-foreground">
					The hover card's contract, as Bits UI's <code>LinkPreview</code> implements it. The trigger
					is a real button, so it is a tab stop.
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
								{#each keyboardRows as row (row.key)}
									<Table.Row>
										<Table.Cell class="font-medium">{row.key}</Table.Cell>
										<Table.Cell>{row.description}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</DocSection>
</DocPage>
