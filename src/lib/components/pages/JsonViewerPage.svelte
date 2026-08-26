<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as JsonViewer from "$lib/components/ui/json-viewer/index.js";
	import * as NativeSelect from "$lib/components/ui/native-select/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Toggle } from "$lib/components/ui/toggle/index.js";
	import HashIcon from "@lucide/svelte/icons/hash";
	import MousePointerClickIcon from "@lucide/svelte/icons/mouse-pointer-click";
	import PaletteIcon from "@lucide/svelte/icons/palette";
	import ScissorsIcon from "@lucide/svelte/icons/scissors";
	import { jsonViewerSampleData } from "./json-viewer-sample-data.js";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The JSON viewer page and its two demos.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. What it does have is an opinion the theme had to answer: the
	 * viewer's whole point is per-type colour, and upstream spends raw Tailwind palette colours on
	 * it — green strings, orange numbers, blue booleans, purple keys. Those are mapped onto the
	 * semantic families and, crucially, onto each family's WALKED ink rather than its raw status
	 * token; `json-viewer.svelte.ts` carries the table and the reason.
	 *
	 * The one thing to look at across the twelve palettes is whether the four inks stay
	 * distinguishable from each other and from the key colour. They are four different hues in
	 * every palette because the palettes are generated from one hue ramp, not sampled.
	 */

	/** The feature showcase's controls. */
	let showLineNumbers = $state(true);
	let showColorIndent = $state(false);
	let collapseOnDoubleClick = $state(false);
	let enableTruncation = $state(true);
	let truncationLimit = $state(3);

	/**
	 * Held as the `<select>`'s string, not as `boolean | number`: it is the value of a form control,
	 * and the viewer's prop is derived from it below.
	 */
	let initialExpansion = $state("false");

	const expansionOptions = [
		{ value: "false", label: "Collapsed" },
		{ value: "true", label: "Expand all" },
		{ value: "1", label: "Depth 1" },
		{ value: "2", label: "Depth 2" },
		{ value: "3", label: "Depth 3" },
	];

	const defaultExpanded = $derived(
		initialExpansion === "true"
			? true
			: initialExpansion === "false"
				? false
				: Number(initialExpansion),
	);

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "data",
			type: "unknown",
			default: "—",
			description:
				"The value to render. Widened from upstream's `Record<string, any>`, so a top-level array works.",
		},
		{
			prop: "truncation",
			type: "Partial<{ enabled: boolean; itemsPerArray: number }>",
			default: "{ enabled: true, itemsPerArray: 5 }",
			description:
				"Merged over the defaults. `itemsPerArray` is floored at 1. Upstream turns truncation off entirely below the mobile breakpoint, and so does this.",
		},
		{
			prop: "showLineNumbers",
			type: "boolean",
			default: "true",
			description: "The gutter. Hidden below the `sm` breakpoint whatever this says.",
		},
		{
			prop: "showColorIndent",
			type: "boolean",
			default: "false",
			description: "Cycle the indent guides through five hues by depth.",
		},
		{
			prop: "collapseOn",
			type: "'click' | 'doubleClick'",
			default: "'click'",
			description: "Which pointer gesture toggles a branch. Enter and Space toggle in both modes.",
		},
		{
			prop: "defaultExpanded",
			type: "boolean | number",
			default: "false",
			description:
				"Seed for the open set: `false` opens the root alone, `true` opens everything, a number opens down to that depth. Read once — wrap in `{#key}` to re-seed.",
		},
		{
			prop: "title",
			type: "string",
			default: "undefined",
			description:
				"The toolbar caption. It claims the `title` attribute, so the root renders no browser tooltip.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, so it overrides the built-in classes. The demos set a height here.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute is forwarded to the root element.",
		},
	];

	const parts = [
		{
			part: "JsonViewer.Root",
			description:
				"Owns the expansion set, the resolved truncation and the line count, and publishes them on context.",
		},
		{
			part: "JsonViewer.Toolbar",
			description:
				"The caption and the Expand all / Collapse all / Copy cluster, built on `ButtonGroup`.",
		},
		{
			part: "JsonViewer.LineNumbers",
			description: "The gutter. Counts rows, not visual lines — a wrapped value drifts below it.",
		},
		{
			part: "JsonViewer.Node",
			description:
				"One node, and the recursion: it imports itself. Dispatches to a branch or to a value.",
		},
		{
			part: "JsonViewer.Branch",
			description:
				"The collapsible shell an object and an array share — trigger, indent guide, closing glyph.",
		},
		{
			part: "JsonViewer.Key",
			description: "A quoted property name and its colon.",
		},
		{
			part: "JsonViewer.Value",
			description:
				"One leaf: a colour swatch, a link, a clamped long string, or a typed literal — plus the relative-time annotation on a detected date.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "every part", values: "json-viewer, json-viewer-branch, …" },
		{ attribute: "[data-kind]", part: "JsonViewer.Branch", values: "object | array" },
		{ attribute: "[data-state]", part: "JsonViewer.Branch", values: "open | closed" },
		{
			attribute: "[data-type]",
			part: "JsonViewer.Value",
			values: "string | number | boolean | null | unknown",
		},
	];

	const typeColours = [
		{ token: "string", upstream: "green-600 / green-400", mapped: "success-subtle-foreground" },
		{ token: "number", upstream: "orange-600 / orange-400", mapped: "warning-subtle-foreground" },
		{ token: "boolean", upstream: "blue-600 / blue-400", mapped: "info-subtle-foreground" },
		{ token: "null", upstream: "gray-500 / gray-400", mapped: "muted-foreground" },
		{ token: "key", upstream: "purple-600 / purple-400", mapped: "primary-subtle-foreground" },
		{
			token: "indent guides",
			upstream: "red / yellow / green / blue / purple 300 / 700",
			mapped: "destructive / warning / success / info / primary at 60%",
		},
	];
</script>

<DocPage title="JSON viewer">
	{#snippet subtitle()}
		A collapsible JSON tree with per-type colouring, expand and collapse, copy, and array
		truncation. JSON viewer parses the value it is handed and colours it by runtime type; when the
		payload is an opaque sample to read and copy rather than a tree to navigate, use
		<a class="text-primary underline underline-offset-3" href={href("/components/code-block")}
			>Code block</a
		>
		instead.
	{/snippet}

	<DocSection title="Basic">
		{#snippet blurb()}
			The default view: the root open, everything under it closed, arrays cut to five items.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<JsonViewer.Root data={jsonViewerSampleData} title="Response Data" class="h-[500px]" />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Feature showcase">
		{#snippet blurb()}
			Every prop, on one payload. The viewer sits inside a <code>{"{#key}"}</code> block, because
			<code>defaultExpanded</code> is a seed — upstream re-mounts it the same way, with a React
			<code>key</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div class="flex flex-wrap gap-2">
						<Toggle variant="outline" size="sm" bind:pressed={showLineNumbers}>
							<HashIcon data-icon="inline-start" />
							Line numbers
						</Toggle>
						<Toggle variant="outline" size="sm" bind:pressed={showColorIndent}>
							<PaletteIcon data-icon="inline-start" />
							Colour indent
						</Toggle>
						<Toggle variant="outline" size="sm" bind:pressed={collapseOnDoubleClick}>
							<MousePointerClickIcon data-icon="inline-start" />
							Double click
						</Toggle>
						<Toggle variant="outline" size="sm" bind:pressed={enableTruncation}>
							<ScissorsIcon data-icon="inline-start" />
							Smart truncation
						</Toggle>
					</div>

					<div class="flex flex-wrap items-center gap-4">
						<div class="flex items-center gap-2">
							<Label for="json-viewer-expansion" class="text-muted-foreground">
								Initial expansion
							</Label>
							<NativeSelect.Root id="json-viewer-expansion" size="sm" bind:value={initialExpansion}>
								{#each expansionOptions as option (option.value)}
									<NativeSelect.Option value={option.value}>{option.label}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
						</div>

						{#if enableTruncation}
							<div class="flex items-center gap-2">
								<Label for="json-viewer-limit" class="text-muted-foreground">Items per array</Label>
								<Input
									id="json-viewer-limit"
									type="number"
									min="1"
									class="h-8 w-16"
									value={truncationLimit}
									oninput={(event) => (truncationLimit = event.currentTarget.valueAsNumber)}
								/>
							</div>
						{/if}
					</div>

					{#key initialExpansion}
						<JsonViewer.Root
							data={jsonViewerSampleData}
							title="Feature Showcase"
							class="h-[500px]"
							{showLineNumbers}
							{showColorIndent}
							{defaultExpanded}
							collapseOn={collapseOnDoubleClick ? "doubleClick" : "click"}
							truncation={{ enabled: enableTruncation, itemsPerArray: truncationLimit }}
						/>
					{/key}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">JsonViewer.Root</h3>
			<p class="text-sm text-muted-foreground">
				The only part a caller normally renders. It publishes the state every other part reads, so
				the parts below are useful for restyling rather than for composing something new.
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
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Part</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each parts as row (row.part)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.part}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Colour mapping</h3>
			<p class="text-sm text-muted-foreground">
				Upstream paints the tree with raw palette colours, which survive exactly one theme. Each is
				mapped to the semantic family whose hue it matches — and, for the inks, to that family's
				walked <code>--{"{state}"}-subtle-foreground</code> rather than the raw status token, which is
				a fill.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Element</Table.Head>
								<Table.Head>Upstream</Table.Head>
								<Table.Head>This kit</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each typeColours as row (row.token)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.token}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.upstream}</Table.Cell>
									<Table.Cell>{row.mapped}</Table.Cell>
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
	</DocSection>
</DocPage>
