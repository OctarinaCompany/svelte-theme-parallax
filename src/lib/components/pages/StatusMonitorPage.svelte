<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as StatusMonitor from "$lib/components/ui/status-monitor/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	import {
		API_PERIODS,
		CHECKOUT_PERIODS,
		ROLLOUT_PERIODS,
	} from "./status-monitor-sample-periods.js";

	/**
	 * The Status monitor page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. What there is to theme is the status ramp itself: ninety bars is
	 * the densest place in the kit where `--success`, `--warning`, `--destructive` and `--muted` sit
	 * side by side at five pixels each, so it is the page that shows whether those four fills are
	 * still distinguishable when they are small — and whether `--muted` reads as "no data" rather
	 * than as a fifth state.
	 *
	 * The tooltip is where the soft family appears: the pill is `ui/status`, on its `*-subtle`
	 * ground under the walked `*-subtle-foreground` ink, sitting on the tooltip's `--foreground`
	 * surface. That is the one pairing in the theme where a subtle ground is asked to hold up
	 * against the inverse surface, so it is worth looking at in both modes.
	 */

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "periods",
			type: "readonly (StatusMonitorPeriod | null | undefined)[]",
			default: "[]",
			description:
				"The measured periods, oldest first. Padded on the left to 90 and trimmed to the newest 90.",
		},
		{
			prop: "unit",
			type: "'days' | 'hours'",
			default: "'days'",
			description:
				"What one bar stands for. Read by the legend, and by the format a `Date` timestamp takes.",
		},
		{
			prop: "title",
			type: "string",
			default: "'Application Status'",
			description:
				"The heading in the header row. Shadows the native `title` attribute, which is not forwarded.",
		},
		{
			prop: "showUptime",
			type: "boolean",
			default: "true",
			description: "Whether the header shows the uptime percentage.",
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
			description: "The parts, in the order they should stack.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is forwarded.",
		},
	];

	const periodProps = [
		{
			prop: "status",
			type: "'success' | 'warning' | 'destructive' | 'empty'",
			default: "—",
			description:
				"The state the period was measured in. Anything unrecognised falls back to `empty`.",
		},
		{
			prop: "timestamp",
			type: "string | Date",
			default: "undefined",
			description:
				"A `Date` is formatted against `unit`; a string is shown verbatim. Omit it and the tooltip shows only the state and the sentence.",
		},
		{
			prop: "info",
			type: "string",
			default: "undefined",
			description: "Replaces the built-in sentence for this status in the tooltip.",
		},
	];

	const parts = [
		{
			part: "StatusMonitor.Root",
			description:
				"The measured box. Publishes the state on context and the bar geometry as CSS custom properties.",
		},
		{
			part: "StatusMonitor.Header",
			description: "The title and uptime row, laid out at the strip's width.",
		},
		{
			part: "StatusMonitor.Track",
			description:
				"The strip: one `StatusMonitor.Bar` per visible period, plus the tooltip provider.",
		},
		{
			part: "StatusMonitor.Bar",
			description:
				"One period, as a focusable `<button>` that triggers that period's tooltip. Takes a `period` prop.",
		},
		{
			part: "StatusMonitor.Legend",
			description: "The footer naming the strip's two ends.",
		},
		{
			part: "StatusMonitor.Combined",
			description: "Header, track and legend in the default order, as one tag.",
		},
	];

	const dataAttributes = [
		{
			attribute: "[data-slot]",
			part: "every part",
			values: "status-monitor, -header, -track, -bar, -legend",
		},
		{ attribute: "[data-unit]", part: "Root", values: "days | hours" },
		{ attribute: "[data-status]", part: "Bar", values: "success | warning | destructive | empty" },
		{ attribute: "[data-state]", part: "Bar", values: "closed | delayed-open | instant-open" },
	];

	const customProperties = [
		{
			property: "--status-monitor-bar-width",
			value: "5px",
			description: "One bar's width. The track's grid columns repeat it.",
		},
		{
			property: "--status-monitor-bar-gap",
			value: "2px",
			description: "The gutter between two bars, and the track's `gap`.",
		},
		{
			property: "--status-monitor-track-width",
			value: "computed",
			description:
				"The strip's exact width for the current slot count. The header and legend are laid out at it.",
		},
	];
</script>

<DocPage title="Status monitor">
	{#snippet subtitle()}
		The uptime strip from a public status page: one bar per period, coloured by state, with a
		tooltip per bar.
	{/snippet}

	<DocSection title="Uptime timeline">
		{#snippet blurb()}
			Ninety days of an API. The strip resizes itself in steps — 90 bars, then 60, then 30 — so
			narrow the window and watch the legend follow the count it is actually showing.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<StatusMonitor.Root periods={API_PERIODS} title="API Status">
					<StatusMonitor.Header />
					<StatusMonitor.Track />
					<StatusMonitor.Legend />
				</StatusMonitor.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Hourly periods">
		{#snippet blurb()}
			<code>unit="hours"</code> relabels the legend and puts the hour into each tooltip, so ninety consecutive
			hours no longer all read as the same date.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<StatusMonitor.Combined periods={CHECKOUT_PERIODS} unit="hours" title="Checkout Health" />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sparse history">
		{#snippet blurb()}
			Six days of a new service, one of which nobody measured — it is an <code>undefined</code> in
			the array, not a status. It renders as a muted bar in place, so the strip keeps its length and
			the later days keep their slots. The missing days before the rollout are the same muted fill,
			padded on the left so the newest period still sits over <em>Current</em>. Empty periods are
			excluded from the uptime ratio, which is why six days of data still reports a percentage of
			the six.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<StatusMonitor.Combined periods={ROLLOUT_PERIODS} title="New Service Rollout" />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Without the uptime figure">
		{#snippet blurb()}
			<code>showUptime</code> set to <code>false</code> leaves the heading alone on the row — for a monitor
			embedded beside a figure that already states it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<StatusMonitor.Combined periods={API_PERIODS} title="API Status" showUptime={false} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">StatusMonitor.Root</h3>
			<p class="text-sm text-muted-foreground">
				No part takes a <code>child</code> snippet: upstream uses no <code>asChild</code>, and the
				bar's own element is already handed to the tooltip trigger.
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
			<h3 class="text-base font-medium">StatusMonitorPeriod</h3>
			<p class="text-sm text-muted-foreground">
				One entry of <code>periods</code>. Upstream's <code>normal</code> is spelled
				<code>success</code>
				here and its <code>error</code> is <code>destructive</code>, so the monitor speaks the same
				status vocabulary as Badge, Alert and Status rather than a second one of its own.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Property</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each periodProps as row (row.prop)}
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
			<p class="text-sm text-muted-foreground">
				Every part below the root reads the root's props from context and accepts no
				<code>children</code>; they are regions of one block, not a primitive kit.
			</p>
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
			<h3 class="text-base font-medium">Custom properties</h3>
			<p class="text-sm text-muted-foreground">
				Published by the root and read by the other parts, so the header, the strip and the legend
				cannot disagree about where the strip's ends are.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Property</Table.Head>
								<Table.Head>Value</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each customProperties as row (row.property)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.property}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.value}</Table.Cell>
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
