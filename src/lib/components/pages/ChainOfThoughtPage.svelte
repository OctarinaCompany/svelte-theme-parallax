<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as ChainOfThought from "$lib/components/ui/chain-of-thought/index.js";
	import type { ChainOfThoughtStepStatus } from "$lib/components/ui/chain-of-thought/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Table from "$lib/components/ui/table/index.js";
	import { href } from "$lib/hooks/route.svelte.js";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import GitCompareIcon from "@lucide/svelte/icons/git-compare";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import PlayIcon from "@lucide/svelte/icons/play";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import SearchIcon from "@lucide/svelte/icons/search";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import type { Component } from "svelte";

	/**
	 * The Chain of thought component page.
	 *
	 * The component is a port of AI Elements' `chain-of-thought.tsx`; the header comment in
	 * `chain-of-thought.svelte` lists what diverges and why. What this page has to show is the
	 * three things a reader cannot see from the props table: that the trace is one disclosure
	 * (header, chevron and region agree), that a step's status is an ink and not a badge, and that
	 * `onOpenChange` is silent for a parent's own write.
	 */

	/** The sources the search step of the default sample found. */
	const sources = ["svelte.dev", "bits-ui.com", "tailwindcss.com"];

	/**
	 * The stages the advancing sample walks through. A real trace grows while the model works —
	 * every step is `complete` except the one it is on — so the page keeps a cursor and derives
	 * each step's status from where the cursor is, which is how a chat surface drives this.
	 */
	type Stage = { label: string; description: string; icon: Component };

	const stages: Stage[] = [
		{
			label: "Searching the documentation",
			description: "Three queries against the Svelte and Bits UI docs.",
			icon: SearchIcon,
		},
		{
			label: "Reading the Collapsible reference",
			description: "Props, data attributes and the keyboard contract.",
			icon: FileTextIcon,
		},
		{
			label: "Comparing the two disclosure patterns",
			description: "One root against a trigger and a region in separate roots.",
			icon: GitCompareIcon,
		},
		{
			label: "Writing the answer",
			description: "One Collapsible, mounted by the root.",
			icon: SparklesIcon,
		},
	];

	let activeStep = $state(1);
	const finished = $derived(activeStep >= stages.length);

	function statusOf(index: number): ChainOfThoughtStepStatus {
		if (index < activeStep) return "complete";
		if (index === activeStep) return "active";
		return "pending";
	}

	function advance(): void {
		if (!finished) activeStep += 1;
	}

	function reset(): void {
		activeStep = 0;
	}

	/**
	 * The controlled sample. `changes` counts `onOpenChange` calls, and the button beside the trace
	 * writes `open` directly — so the count moves when the header is pressed and stays put when the
	 * button is, which is the callback's whole contract made visible.
	 */
	let controlledOpen = $state(true);
	let changes = $state(0);

	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "open",
			type: "boolean | undefined",
			default: "undefined",
			description:
				"Whether the trace is expanded. Bindable. Left unset, it seeds once from `defaultOpen` and the component keeps its own state; bound, the caller's value wins and a parent write updates the disclosure without firing `onOpenChange`.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "false",
			description:
				"The initial state of an uncontrolled trace. Read once at mount; changing it later leaves the reader's choice alone.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description:
				"Fired when the header toggles the trace or a part calls `setOpen` with a value that differs from the current one. Never fired for a parent-driven write to `open`, and never for a `setOpen` equal to the current value.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, so it overrides the base classes — including the `max-w-prose` cap.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The header and the content, in that order.",
		},
		{
			prop: "...restProps",
			type: "Collapsible.RootProps",
			default: "—",
			description:
				"Every other Bits UI `Collapsible.Root` attribute and DOM handler is spread onto the rendered element — `disabled` and `onOpenChangeComplete` included. `child` is not accepted.",
		},
	];

	const headerProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
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
			description:
				'The label between the brain and the chevron. Without it the header reads "Chain of thought".',
		},
		{
			prop: "...restProps",
			type: "Collapsible.TriggerProps",
			default: "—",
			description:
				"Every other Bits UI `Collapsible.Trigger` attribute and DOM handler is spread onto the button. `child` is not accepted: the header owns its markup.",
		},
	];

	const contentProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered element. Populated whether the trace is open or closed — the region is never unmounted, only given the `hidden` attribute.",
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
			description:
				"The steps. Always in the DOM; the region carries `hidden` while the trace is closed.",
		},
		{
			prop: "forceMount",
			type: "boolean",
			default: "false",
			description:
				'Drops the `hidden` attribute Bits UI otherwise stamps on the closed region, so it stays visible with `data-state="closed"` for a caller that hides it with its own CSS. Overridden by `hiddenUntilFound`.',
		},
		{
			prop: "hiddenUntilFound",
			type: "boolean",
			default: "false",
			description:
				"Renders the closed region with `hidden=\"until-found\"`, so the browser's find-in-page can match a step's text and opens the trace when it does. Overrides `forceMount`.",
		},
		{
			prop: "...restProps",
			type: "Collapsible.ContentProps",
			default: "—",
			description:
				"Every other Bits UI `Collapsible.Content` attribute and DOM handler is spread onto the region. `child` is not accepted.",
		},
	];

	const stepProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "label",
			type: "string",
			default: "—",
			description: "Required. What the model did, set in the step's own ink beside the glyph.",
		},
		{
			prop: "description",
			type: "string",
			default: "—",
			description:
				"A second line beneath the label, always in the muted ink and one size smaller. Nothing renders when it is empty.",
		},
		{
			prop: "status",
			type: "'complete' | 'active' | 'pending'",
			default: "'complete'",
			description:
				"Where the step is in the model's work. Only the ink changes — the page's ink for `active`, the muted ink for `complete`, the muted ink at half strength for `pending` — and the value is stamped as `data-status`. An unknown runtime value normalises to `complete`.",
		},
		{
			prop: "icon",
			type: "Component",
			default: "DotIcon",
			description:
				"The glyph in the gutter, a Lucide icon component passed bare. The step sizes it to 16px; a sizing class on the icon itself is overridden.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the variant classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"What the step produced, rendered beneath the description: search results, an image, a paragraph. Wraps inside the step's body rather than widening the trace.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const searchResultsProps: PropRow[] = [
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
			description: "The results, usually `ChainOfThought.SearchResult` badges. They wrap.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const searchResultProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered element — an anchor or a span.",
		},
		{
			prop: "href",
			type: "string",
			default: "—",
			description:
				"With it the badge renders as an `<a>` and the source is a link; without it, a `<span>`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the badge classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The source: a glyph and a name. An `svg` child is sized to 12px by the Badge.",
		},
		{
			prop: "...restProps",
			type: "HTMLAnchorAttributes",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const imageProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description:
				"Bindable reference to the outer element, which holds the frame and the caption.",
		},
		{
			prop: "caption",
			type: "string",
			default: "—",
			description: "A line beneath the frame, in the muted ink. Nothing renders when it is empty.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last onto the outer element. The frame (`max-h-88 overflow-hidden rounded-md bg-muted p-3`) lives on an inner `div` and is not reachable from here; target it through `[data-slot=chain-of-thought-image-frame]`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The image, centred in a `bg-muted` frame capped at 22rem. Anything taller is clipped, not scaled.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the outer element.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "ChainOfThought", values: "chain-of-thought" },
		{ attribute: "[data-slot]", part: "ChainOfThought.Header", values: "chain-of-thought-header" },
		{
			attribute: "[data-slot]",
			part: "ChainOfThought.Content",
			values: "chain-of-thought-content",
		},
		{ attribute: "[data-slot]", part: "ChainOfThought.Step", values: "chain-of-thought-step" },
		{
			attribute: "[data-slot]",
			part: "ChainOfThought.SearchResults",
			values: "chain-of-thought-search-results",
		},
		{
			attribute: "[data-slot]",
			part: "ChainOfThought.SearchResult",
			values: "chain-of-thought-search-result",
		},
		{ attribute: "[data-slot]", part: "ChainOfThought.Image", values: "chain-of-thought-image" },
		{
			attribute: "[data-slot]",
			part: "ChainOfThought.Image (frame)",
			values: "chain-of-thought-image-frame",
		},
		{
			attribute: "[data-slot]",
			part: "ChainOfThought.Image (caption)",
			values: "chain-of-thought-image-caption",
		},
		{
			attribute: "[data-state]",
			part: "ChainOfThought, ChainOfThought.Header, ChainOfThought.Content",
			values: "open | closed",
		},
		{
			attribute: "[data-status]",
			part: "ChainOfThought.Step",
			values: "complete | active | pending",
		},
	];

	const keyboard = [
		{
			keys: "Tab",
			description: "Moves focus to the header. The steps hold no stops of their own.",
		},
		{
			keys: "Enter / Space",
			description: "Toggles the trace while the header is focused — the native button's contract.",
		},
	];
</script>

<DocPage title="Chain of thought">
	{#snippet subtitle()}
		A collapsible trace of the steps a model took to reach an answer — a search, a document it read,
		a comparison, the conclusion — each carrying what it found. Chain of thought shows a model's <em
			>work</em
		>;
		<a class="text-primary underline underline-offset-3" href={href("/components/timeline")}
			>Timeline</a
		>
		is for events that happened to a system, and
		<a class="text-primary underline underline-offset-3" href={href("/components/reasoning")}
			>Reasoning</a
		> is the model's prose rather than its steps.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			Four steps under one header. The search step carries its sources as badges, the last one a
			figure the model produced; the <code>icon</code> prop swaps the gutter glyph, and the final step
			keeps the default dot.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ChainOfThought.Root defaultOpen>
					<ChainOfThought.Header />
					<ChainOfThought.Content>
						<ChainOfThought.Step
							icon={SearchIcon}
							label="Searching for disclosure patterns"
							description="Three queries, twelve results, three worth reading."
						>
							<ChainOfThought.SearchResults>
								{#each sources as source (source)}
									<ChainOfThought.SearchResult>
										<GlobeIcon />
										{source}
									</ChainOfThought.SearchResult>
								{/each}
							</ChainOfThought.SearchResults>
						</ChainOfThought.Step>
						<ChainOfThought.Step
							icon={FileTextIcon}
							label="Reading the Collapsible reference"
							description="Bits UI wires aria-expanded and aria-controls from one root."
						/>
						<ChainOfThought.Step
							icon={GitCompareIcon}
							label="Comparing one root against two"
							description="A trigger and a region in separate roots cannot point at each other."
						/>
						<ChainOfThought.Step label="Writing the answer">
							<ChainOfThought.Image
								caption="Time to first paint across the four candidate layouts, lower is better."
							>
								<svg
									viewBox="0 0 320 120"
									class="h-30 w-full text-muted-foreground"
									role="img"
									aria-label="A bar chart with four bars of decreasing height"
								>
									<line x1="24" y1="100" x2="304" y2="100" stroke="currentColor" stroke-width="1" />
									<rect x="48" y="28" width="40" height="72" fill="currentColor" opacity="0.6" />
									<rect x="112" y="44" width="40" height="56" fill="currentColor" opacity="0.5" />
									<rect x="176" y="62" width="40" height="38" fill="currentColor" opacity="0.4" />
									<rect x="240" y="76" width="40" height="24" fill="currentColor" opacity="0.3" />
								</svg>
							</ChainOfThought.Image>
						</ChainOfThought.Step>
					</ChainOfThought.Content>
				</ChainOfThought.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Step statuses">
		{#snippet blurb()}
			A status is an ink, not a badge: the active step in the page's ink, finished steps in the
			muted ink, pending ones at half strength. The connector stops at the last step.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ChainOfThought.Root defaultOpen>
					<ChainOfThought.Header>Working through it</ChainOfThought.Header>
					<ChainOfThought.Content>
						<ChainOfThought.Step
							status="complete"
							label="Complete"
							description="Done — the muted ink, read after the fact."
						/>
						<ChainOfThought.Step
							status="active"
							label="Active"
							description="Running now — the only step in the page's own ink."
						/>
						<ChainOfThought.Step
							status="pending"
							label="Pending"
							description="Not started — the muted ink at half strength."
						/>
					</ChainOfThought.Content>
				</ChainOfThought.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Advancing the active step">
		{#snippet blurb()}
			How a chat surface drives it: one cursor, and every step's status derived from where the
			cursor is. Each step plays its entrance once, when it mounts — there is no stagger.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div class="flex flex-wrap items-center gap-2">
					<Button size="sm" onclick={advance} disabled={finished}>
						<PlayIcon data-icon="inline-start" />
						Advance
					</Button>
					<Button size="sm" variant="outline" onclick={reset} disabled={activeStep === 0}>
						<RotateCcwIcon data-icon="inline-start" />
						Reset
					</Button>
					<span class="text-sm text-muted-foreground">
						{finished ? "All steps complete" : `Step ${activeStep + 1} of ${stages.length}`}
					</span>
				</div>
				<ChainOfThought.Root defaultOpen>
					<ChainOfThought.Header />
					<ChainOfThought.Content>
						{#each stages as stage, index (stage.label)}
							<ChainOfThought.Step
								icon={stage.icon}
								label={stage.label}
								description={stage.description}
								status={statusOf(index)}
							/>
						{/each}
					</ChainOfThought.Content>
				</ChainOfThought.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled">
		{#snippet blurb()}
			<code>bind:open</code> with a counter on <code>onOpenChange</code>. Press the header and the
			count moves; press the button, which writes <code>open</code> directly, and it does not — the callback
			reports the component's changes, never the parent's.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div class="flex flex-wrap items-center gap-2">
					<Button size="sm" variant="outline" onclick={() => (controlledOpen = !controlledOpen)}>
						{controlledOpen ? "Collapse from outside" : "Expand from outside"}
					</Button>
					<span class="text-sm text-muted-foreground">
						open: <code>{controlledOpen}</code> · onOpenChange fired {changes}
						{changes === 1 ? "time" : "times"}
					</span>
				</div>
				<ChainOfThought.Root bind:open={controlledOpen} onOpenChange={() => (changes += 1)}>
					<ChainOfThought.Header>Thought for 4 seconds</ChainOfThought.Header>
					<ChainOfThought.Content>
						<ChainOfThought.Step
							icon={SearchIcon}
							label="Checked the conversation for an earlier answer"
						/>
						<ChainOfThought.Step
							icon={SparklesIcon}
							label="Drafted a reply from the two relevant turns"
							status="active"
						/>
					</ChainOfThought.Content>
				</ChainOfThought.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">ChainOfThought</h3>
			<p class="text-sm text-muted-foreground">
				The root, and the one disclosure: a Bits UI <code>Collapsible.Root</code> rendered as a
				<code>div</code>, holding the open state the header toggles and the content follows.
				Publishes
				<code>ChainOfThoughtState</code> on context.
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
			<h3 class="text-base font-medium">ChainOfThought.Header</h3>
			<p class="text-sm text-muted-foreground">
				The disclosure button — a brain, the label, and a chevron that turns when the trace is open.
				Renders the root's <code>Collapsible.Trigger</code>, a <code>button</code> with
				<code>aria-expanded</code> and <code>aria-controls</code> supplied by Bits UI.
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
							{#each headerProps as row (row.prop)}
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
			<h3 class="text-base font-medium">ChainOfThought.Content</h3>
			<p class="text-sm text-muted-foreground">
				The collapsible region holding the steps, one below the other with a 12px gap. Renders the
				root's <code>Collapsible.Content</code>, a <code>div</code> that stays in the DOM and
				carries the
				<code>hidden</code> attribute while closed.
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
			<h3 class="text-base font-medium">ChainOfThought.Step</h3>
			<p class="text-sm text-muted-foreground">
				One thing the model did. Renders a <code>div</code> with a glyph in a gutter, a label, an
				optional description, and its <code>children</code> beneath them; a connector line runs from the
				glyph to the step's bottom on every step but the last.
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
							{#each stepProps as row (row.prop)}
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
			<h3 class="text-base font-medium">ChainOfThought.SearchResults</h3>
			<p class="text-sm text-muted-foreground">
				The row of sources a search step found. Renders a wrapping flex <code>div</code>.
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
							{#each searchResultsProps as row (row.prop)}
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
			<h3 class="text-base font-medium">ChainOfThought.SearchResult</h3>
			<p class="text-sm text-muted-foreground">
				One source. Renders a <code>secondary</code> Badge in regular weight — a <code>span</code>,
				or an <code>a</code> when given <code>href</code>.
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
							{#each searchResultProps as row (row.prop)}
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
			<h3 class="text-base font-medium">ChainOfThought.Image</h3>
			<p class="text-sm text-muted-foreground">
				A framed figure a step produced, with an optional caption. Renders a <code>div</code>
				holding a clipped <code>bg-muted</code> frame and, when given, a <code>p</code> beneath it.
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
							{#each imageProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Keyboard</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Keys</Table.Head>
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
