<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as PartitionBar from "$lib/components/ui/partition-bar/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import {
		PARTITION_BAR_SIZES,
		PARTITION_BAR_VARIANTS,
	} from "$lib/components/ui/partition-bar/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { formatBytes } from "$lib/shared/format-bytes.js";
	import {
		STORAGE_CAPACITY,
		STORAGE_SLICES,
		storageShare,
	} from "$lib/components/pages/partition-bar-storage.js";

	/**
	 * The Partition bar component page — its six examples, in the order that page gives them,
	 * with the plain first demo restated as the breakdown the component is actually for.
	 *
	 * THE CLASSIC THEME'S NEAREST MARK IS THE PROGRESS BAR (the theme notes, the Progress row: a `1rem`
	 * track), and the difference is the whole point of this component. A progress bar shows one
	 * value against a whole; a partition bar shows how the whole is divided, and hangs a label
	 * under each part's own share.
	 *
	 * FIVE THINGS DIVERGE FROM UPSTREAM:
	 *
	 * 1. THE TOTAL IS NOT COMPUTED IN JAVASCRIPT. Upstream sums its children's `num` props and
	 *    gives each segment `flex-basis: (num / total)%`. Svelte
	 *    cannot read a child's props, and it does not need to: `flex-basis: 0` plus
	 *    `flex-grow: num` divides the track in the same proportions. It also drops upstream's
	 *    overflow — percentages that sum to 100% plus a `gap` are wider than their container, while
	 *    `flex-grow` divides what is left after the gaps.
	 *
	 * 2. THE SIZE AND ALIGNMENT VALUES ARE RENAMED. `md` is `default`, the name every sized
	 *    component here uses (CONVENTIONS §3), and `left` / `right` are `start` / `end`, which keep
	 *    their meaning inside the direction provider.
	 *
	 * 3. THREE VARIANTS ARE ADDED. Upstream paints from `primary` at three opacities plus
	 *    `destructive` and `outline`; `success`, `warning` and `info` complete the house status
	 *    vocabulary, without which a used / reserved / free breakdown has no tokens to use.
	 *
	 * 4. THE LABELS ARE NOT PAINTED IN THE BAR'S COLOUR. Upstream tints each label with its own
	 *    fill; here every status label takes the contrast-walked
	 *    `*-subtle-foreground` of its status, because a fill is not an ink — `--warning` is #f5c042
	 *    (src/app.css) — and the three neutral bars label in plain `--foreground` rather than
	 *    upstream's 60% and 40% of it.
	 *
	 * 5. A SEGMENT'S `class` LANDS ON THE SEGMENT. Upstream forwards it to the coloured bar inside
	 *    the segment, which is how its custom-colours demo recolours anything at all.
	 *    That is the one thing `class` may not do here, so recolouring is a pair of named props,
	 *    `color` and `labelColor` — see the Custom colours section.
	 */

	const CHART_SERIES = [
		{ label: "Direct", visits: "6.1k", num: 6, color: "var(--chart-1)" },
		{ label: "Referral", visits: "5.2k", num: 5, color: "var(--chart-2)" },
		{ label: "Social", visits: "4.3k", num: 4, color: "var(--chart-4)" },
	];

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLUListElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "size",
			type: "'sm' | 'default' | 'lg'",
			default: "'default'",
			description: "Type scale, bar height and the space between a bar and its label.",
		},
		{
			prop: "alignment",
			type: "'start' | 'center' | 'end'",
			default: "'center'",
			description: "Where the labels sit. Every segment inherits it and may override it.",
		},
		{
			prop: "total",
			type: "number",
			default: "undefined",
			description:
				"Denominator for every segment's num, for a bar that is not meant to be full. Omitted, the segments divide the whole track between them.",
		},
		{
			prop: "gap",
			type: "number",
			default: "1",
			description: "Space between segments, in spacing steps: 1 is 4px.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the built-in classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The segments.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLUListElement>",
			default: "—",
			description:
				"Every other attribute is forwarded. A style of your own is appended after the computed gap rather than replacing it.",
		},
	];

	const segmentProps = [
		{
			prop: "ref",
			type: "HTMLLIElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "num",
			type: "number",
			default: "0",
			description:
				"This segment's share: relative to the other segments, or a fraction of the root's total when it has one.",
		},
		{
			prop: "variant",
			type: PARTITION_BAR_VARIANTS.map((variant) => `'${variant}'`).join(" | "),
			default: "'default'",
			description: "The token pair that paints the bar and its label.",
		},
		{
			prop: "alignment",
			type: "'start' | 'center' | 'end'",
			default: "the root's",
			description: "Overrides the root's alignment for this segment alone.",
		},
		{
			prop: "color",
			type: "string",
			default: "undefined",
			description:
				"Any CSS colour for the bar, overriding the variant's fill. It tints the label too unless labelColor says otherwise.",
		},
		{
			prop: "labelColor",
			type: "string",
			default: "the bar's colour",
			description:
				"Any CSS colour for the label. Set it whenever the bar's own colour is too pale to read as type, which is most of a chart palette.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, and applied to the segment itself, not to the bar inside it.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The label stack. Nothing is rendered under the bar without it.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLLIElement>",
			default: "—",
			description: "Every other attribute is forwarded, a style of your own included.",
		},
	];

	const labelProps = [
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
			description: "Merged last, so it overrides the built-in classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The name, or the measurement.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute is forwarded.",
		},
	];

	const customProperties = [
		{
			property: "--partition-bar-color",
			setBy: "Segment",
			description: "The bar's fill. Set by variant, overridden by color.",
		},
		{
			property: "--partition-bar-ink",
			setBy: "Segment",
			description: "The label's colour. Set by variant, overridden by labelColor.",
		},
		{
			property: "--partition-bar-line-size",
			setBy: "PartitionBar",
			description: "Bar height. Set by size; retune one bar by setting it in class.",
		},
		{
			property: "--partition-bar-label-gap",
			setBy: "PartitionBar",
			description: "Space between a bar and its label. Set by size.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "PartitionBar", values: "partition-bar" },
		{ attribute: "[data-slot]", part: "PartitionBar.Segment", values: "partition-bar-segment" },
		{ attribute: "[data-slot]", part: "the bar inside a segment", values: "partition-bar-line" },
		{
			attribute: "[data-slot]",
			part: "the label stack",
			values: "partition-bar-segment-label",
		},
		{
			attribute: "[data-slot]",
			part: "PartitionBar.SegmentTitle",
			values: "partition-bar-segment-title",
		},
		{
			attribute: "[data-slot]",
			part: "PartitionBar.SegmentValue",
			values: "partition-bar-segment-value",
		},
		{ attribute: "[data-size]", part: "PartitionBar", values: PARTITION_BAR_SIZES.join(" | ") },
		{
			attribute: "[data-variant]",
			part: "PartitionBar.Segment, and its bar",
			values: PARTITION_BAR_VARIANTS.join(" | "),
		},
		{ attribute: "[data-alignment]", part: "PartitionBar.Segment", values: "start | center | end" },
	];
</script>

<DocPage title="Partition bar">
	{#snippet subtitle()}
		A total split into labelled parts: one bar per part, sized by its share, with its name and
		measurement underneath.
	{/snippet}

	<DocSection title="Storage breakdown">
		{#snippet blurb()}
			The defaults, on the component's own use case: {formatBytes(STORAGE_CAPACITY, 0)} of storage in
			four slices, painted from the status tokens. Each segment's width is its own num against the others'.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<PartitionBar.Root>
					{#each STORAGE_SLICES as slice (slice.label)}
						<PartitionBar.Segment num={slice.bytes} variant={slice.variant}>
							<PartitionBar.SegmentTitle>{slice.label}</PartitionBar.SegmentTitle>
							<PartitionBar.SegmentValue>{formatBytes(slice.bytes, 0)}</PartitionBar.SegmentValue>
						</PartitionBar.Segment>
					{/each}
				</PartitionBar.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Variants">
		{#snippet blurb()}
			Every variant, at an equal share. The first five are upstream's; success, warning and info
			complete the house status vocabulary. Each carries two colours, not one: the fill for the bar,
			and an ink for the label that a name can be read at.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<PartitionBar.Root>
					{#each PARTITION_BAR_VARIANTS as variant (variant)}
						<PartitionBar.Segment num={1} {variant}>
							<PartitionBar.SegmentTitle>{variant}</PartitionBar.SegmentTitle>
							<PartitionBar.SegmentValue>12.5%</PartitionBar.SegmentValue>
						</PartitionBar.Segment>
					{/each}
				</PartitionBar.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sizes">
		{#snippet blurb()}
			One prop moves three measurements together: the type scale, the bar's height and the space
			between them.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-8">
					{#each PARTITION_BAR_SIZES as size (size)}
						<PartitionBar.Root {size}>
							<PartitionBar.Segment num={4}>
								<PartitionBar.SegmentTitle>{size}</PartitionBar.SegmentTitle>
								<PartitionBar.SegmentValue>40</PartitionBar.SegmentValue>
							</PartitionBar.Segment>
							<PartitionBar.Segment num={6} variant="secondary">
								<PartitionBar.SegmentTitle>{size}</PartitionBar.SegmentTitle>
								<PartitionBar.SegmentValue>60</PartitionBar.SegmentValue>
							</PartitionBar.Segment>
						</PartitionBar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Alignment">
		{#snippet blurb()}
			The root sets the default and a segment overrides it. These are writing-mode-relative, so a
			bar keeps the alignment its author meant when the direction flips.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<PartitionBar.Root>
					<PartitionBar.Segment num={4} alignment="start">
						<PartitionBar.SegmentTitle>Start</PartitionBar.SegmentTitle>
						<PartitionBar.SegmentValue>40</PartitionBar.SegmentValue>
					</PartitionBar.Segment>
					<PartitionBar.Segment num={2} alignment="center" variant="secondary">
						<PartitionBar.SegmentTitle>Middle</PartitionBar.SegmentTitle>
						<PartitionBar.SegmentValue>20</PartitionBar.SegmentValue>
					</PartitionBar.Segment>
					<PartitionBar.Segment num={4} alignment="end" variant="muted">
						<PartitionBar.SegmentTitle>End</PartitionBar.SegmentTitle>
						<PartitionBar.SegmentValue>40</PartitionBar.SegmentValue>
					</PartitionBar.Segment>
				</PartitionBar.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom colours">
		{#snippet blurb()}
			A chart-like component earns an escape hatch: color takes any CSS colour, here the theme's own
			chart series, and a segment on a variant sits beside them unchanged. The label follows the bar
			unless labelColor separates them — which it has to here, because a series colour chosen to be
			readable as a fill is rarely readable as type.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<PartitionBar.Root>
					{#each CHART_SERIES as series (series.label)}
						<PartitionBar.Segment
							num={series.num}
							color={series.color}
							labelColor="var(--foreground)"
						>
							<PartitionBar.SegmentTitle>{series.label}</PartitionBar.SegmentTitle>
							<PartitionBar.SegmentValue>{series.visits}</PartitionBar.SegmentValue>
						</PartitionBar.Segment>
					{/each}
					<PartitionBar.Segment num={3} variant="outline">
						<PartitionBar.SegmentTitle>Other</PartitionBar.SegmentTitle>
						<PartitionBar.SegmentValue>3.2k</PartitionBar.SegmentValue>
					</PartitionBar.Segment>
				</PartitionBar.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Width">
		{#snippet blurb()}
			The bar fills its container, so a narrower bar is a narrower container — class is for layout
			here, as everywhere.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<PartitionBar.Root class="mx-auto sm:w-[90%] md:w-[70%]">
					<PartitionBar.Segment num={3}>
						<PartitionBar.SegmentTitle>Apples</PartitionBar.SegmentTitle>
						<PartitionBar.SegmentValue>30%</PartitionBar.SegmentValue>
					</PartitionBar.Segment>
					<PartitionBar.Segment num={7} variant="secondary">
						<PartitionBar.SegmentTitle>Oranges</PartitionBar.SegmentTitle>
						<PartitionBar.SegmentValue>70%</PartitionBar.SegmentValue>
					</PartitionBar.Segment>
				</PartitionBar.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Partial totals and spacing">
		{#snippet blurb()}
			Two props upstream does not have. total makes the segments fractions of a stated whole instead
			of each other, so what is not accounted for stays empty — the used part of the same
			{formatBytes(STORAGE_CAPACITY, 0)} volume, below. gap is the space between segments, in spacing
			steps.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-8">
					<PartitionBar.Root total={STORAGE_CAPACITY} alignment="start">
						{#each STORAGE_SLICES.filter((slice) => slice.label !== "Free") as slice (slice.label)}
							<PartitionBar.Segment num={slice.bytes} variant={slice.variant}>
								<PartitionBar.SegmentTitle>{slice.label}</PartitionBar.SegmentTitle>
								<PartitionBar.SegmentValue>{storageShare(slice.bytes)}</PartitionBar.SegmentValue>
							</PartitionBar.Segment>
						{/each}
					</PartitionBar.Root>

					<PartitionBar.Root gap={4}>
						<PartitionBar.Segment num={3} variant="info">
							<PartitionBar.SegmentTitle>Widely</PartitionBar.SegmentTitle>
							<PartitionBar.SegmentValue>30%</PartitionBar.SegmentValue>
						</PartitionBar.Segment>
						<PartitionBar.Segment num={7} variant="secondary">
							<PartitionBar.SegmentTitle>Spaced</PartitionBar.SegmentTitle>
							<PartitionBar.SegmentValue>70%</PartitionBar.SegmentValue>
						</PartitionBar.Segment>
					</PartitionBar.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">PartitionBar</h3>
			<p class="text-sm text-muted-foreground">
				The root list. It renders a <code>ul</code> and provides the context every segment reads.
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
			<h3 class="text-base font-medium">PartitionBar.Segment</h3>
			<p class="text-sm text-muted-foreground">
				One part of the total: a <code>li</code> carrying the bar and, when it has children, the label
				stack under it.
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
							{#each segmentProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PartitionBar.SegmentTitle / PartitionBar.SegmentValue</h3>
			<p class="text-sm text-muted-foreground">
				The two lines of the label stack: the part's name in the variant's ink, and its measurement
				one step smaller and quieter. Both take the same props.
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
			<h3 class="text-base font-medium">Custom properties</h3>
			<p class="text-sm text-muted-foreground">
				The variants and the size ramp set these; overriding one in <code>class</code> retunes a single
				bar without a new variant.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Property</Table.Head>
								<Table.Head>Set on</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each customProperties as row (row.property)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.property}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.setBy}</Table.Cell>
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
	</DocSection>
</DocPage>
