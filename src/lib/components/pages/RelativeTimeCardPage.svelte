<script lang="ts">
	import ClockIcon from "@lucide/svelte/icons/clock";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as RelativeTimeCard from "$lib/components/ui/relative-time-card/index.js";
	import type { RelativeTimeCardChildProps } from "$lib/components/ui/relative-time-card/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Relative time card component page.
	 *
	 * THE CARD IS A HOVER CARD, and that surface is already the classic theme's: `app.css` gives
	 * `[data-slot='hover-card-content']` the same popover treatment ported on the Popovers page.
	 * So the panel arrives themed and this page adds nothing to it.
	 *
	 * The trigger is the interesting half — a time that reads "3 hours ago" and reveals the exact
	 * timestamp in several zones on hover. It is underlined in `--border` rather than coloured,
	 * because the classic theme reserves `--primary` type for links that navigate.
	 */

	// Seeded once, in the instance script: a `new Date()` written inline in the markup would be
	// re-evaluated on every render and would drift between the server render and hydration.
	const now = $state(new Date());
	const fiveMinutesAgo = $state(new Date(now.getTime() - 5 * 60 * 1000));
	const oneHourAgo = $state(new Date(now.getTime() - 60 * 60 * 1000));
	const oneDayAgo = $state(new Date(now.getTime() - 24 * 60 * 60 * 1000));
	const tomorrow = $state(new Date(now.getTime() + 24 * 60 * 60 * 1000));

	let open = $state(false);

	const rootProps = [
		{
			prop: "date",
			type: "Date | string | number",
			default: "—",
			description: "The instant to display. Required. An unparseable value renders `Invalid Date`.",
		},
		{
			prop: "timezones",
			type: "readonly string[]",
			default: "['UTC']",
			description:
				"IANA identifiers listed in the card, in order. The viewer’s own zone is always appended as one further row; duplicates are not removed.",
		},
		{
			prop: "updateInterval",
			type: "number",
			default: "1000",
			description: "How often, in ms, the relative time label is recomputed while mounted.",
		},
		{
			prop: "variant",
			type: "'default' | 'muted' | 'link'",
			default: "'default'",
			description:
				"The visual style of the trigger. An unknown runtime value normalises to `default`.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "undefined",
			description: "Controlled open state. Bindable.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Open state the component seeds itself with when uncontrolled.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description: "Called on every open/close transition, in both modes.",
		},
		{
			prop: "openDelay",
			type: "number",
			default: "500",
			description: "Delay in ms before hovering or focusing the trigger opens the card.",
		},
		{
			prop: "closeDelay",
			type: "number",
			default: "300",
			description: "Delay in ms before leaving the trigger closes the card.",
		},
		{
			prop: "side",
			type: "'top' | 'right' | 'bottom' | 'left'",
			default: "'top'",
			description: "Forwarded untouched to the card. Falls back to the hover card’s own default.",
		},
		{
			prop: "align",
			type: "'start' | 'center' | 'end'",
			default: "'center'",
			description: "Forwarded untouched to the card.",
		},
		{
			prop: "sideOffset",
			type: "number",
			default: "4",
			description: "Forwarded untouched to the card.",
		},
		{
			prop: "alignOffset",
			type: "number",
			default: "0",
			description: "Forwarded untouched to the card.",
		},
		{
			prop: "avoidCollisions",
			type: "boolean",
			default: "true",
			description: "Forwarded untouched to the card.",
		},
		{
			prop: "collisionBoundary",
			type: "Element | Element[] | null",
			default: "—",
			description: "Forwarded untouched to the card.",
		},
		{
			prop: "collisionPadding",
			type: "number | Partial<Record<Side, number>>",
			default: "0",
			description: "Forwarded untouched to the card.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the trigger. Not populated in `child` mode.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last onto the trigger, so it overrides the variant classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Trigger content, replacing the default `<time>`. Not rendered when `child` is supplied.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: RelativeTimeCardChildProps }]>",
			default: "—",
			description:
				"Render the trigger onto your own element instead of the default `<button>`. Replaces upstream’s `asChild`.",
		},
		{
			prop: "...restProps",
			type: "HTMLButtonAttributes",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the trigger.",
		},
	];

	const timezoneProps = [
		{
			prop: "date",
			type: "Date | string | number",
			default: "—",
			description: "The instant to render in this row. Required.",
		},
		{
			prop: "timezone",
			type: "string",
			default: "undefined",
			description:
				"IANA identifier of the zone. Omit it for the viewer’s own zone, which is labelled with its short UTC offset.",
		},
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
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread after `role` and `aria-label`, so a caller can supersede both — that is how the card turns each row into a `listitem`.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "trigger", values: "relative-time-card-trigger" },
		{ attribute: "[data-slot]", part: "card", values: "relative-time-card-content" },
		{ attribute: "[data-slot]", part: "relative time", values: "relative-time-card-value" },
		{ attribute: "[data-slot]", part: "rows wrapper", values: "relative-time-card-timezones" },
		{ attribute: "[data-slot]", part: "one row", values: "relative-time-card-timezone" },
		{ attribute: "[data-state]", part: "trigger, card", values: "open | closed" },
		{ attribute: "[data-variant]", part: "trigger", values: "default | muted | link" },
		{
			attribute: "[data-invalid]",
			part: "trigger",
			values: "present when `date` does not parse",
		},
		{ attribute: "[data-timezone]", part: "one row", values: "the IANA id, or the short offset" },
		{ attribute: "[data-local]", part: "one row", values: "present on the viewer’s own zone" },
	];
</script>

{#snippet clockTrigger({ props }: { props: RelativeTimeCardChildProps })}
	<Button variant="outline" size="sm" {...props as Record<string, unknown>}>
		<ClockIcon data-icon="inline-start" />
		View time details
	</Button>
{/snippet}

<DocPage title="Relative Time Card">
	{#snippet subtitle()}
		A hover card that displays relative time relative to local time with timezone information.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-2">
						<span class="text-sm text-muted-foreground">Basic usage</span>
						<RelativeTimeCard.Root date={fiveMinutesAgo} />
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm text-muted-foreground">Different variants</span>
						<div class="flex items-center gap-4">
							<RelativeTimeCard.Root date={oneHourAgo} variant="default" />
							<RelativeTimeCard.Root date={oneHourAgo} variant="muted" />
							<RelativeTimeCard.Root date={oneHourAgo} variant="link" />
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm text-muted-foreground">With time in the future</span>
						<div class="flex items-center gap-4">
							<RelativeTimeCard.Root date={tomorrow} />
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm text-muted-foreground">Multiple timezones</span>
						<RelativeTimeCard.Root
							date={oneDayAgo}
							timezones={["America/New_York", "Europe/London", "Asia/Tokyo"]}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm text-muted-foreground">Custom trigger</span>
						<RelativeTimeCard.Root date={now} child={clockTrigger} />
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm text-muted-foreground">Different positions</span>
						<div class="flex items-center gap-4">
							<RelativeTimeCard.Root date={now} side="top" align="start"
								>Top Start</RelativeTimeCard.Root
							>
							<RelativeTimeCard.Root date={now} side="right" align="center">
								Right Center
							</RelativeTimeCard.Root>
							<RelativeTimeCard.Root date={now} side="bottom" align="end">
								Bottom End
							</RelativeTimeCard.Root>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Basic">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<RelativeTimeCard.Root date={fiveMinutesAgo} />
					<RelativeTimeCard.Root date={oneHourAgo} />
					<RelativeTimeCard.Root date={oneDayAgo} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Timezones">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<RelativeTimeCard.Root
						date={now}
						timezones={[
							"America/Los_Angeles",
							"America/New_York",
							"Europe/London",
							"Asia/Singapore",
							"Asia/Tokyo",
						]}
					/>
					<RelativeTimeCard.Root
						date={now}
						timezones={["America/Chicago", "Europe/Paris", "Asia/Dubai", "Australia/Sydney"]}
					/>
					<RelativeTimeCard.Root date={now} timezones={["UTC"]} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Variants">
		{#snippet blurb()}
			Upstream’s palette colours map to the semantic status tokens.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-2">
						<span class="text-sm text-muted-foreground">Style variants</span>
						<div class="flex items-center gap-4">
							<RelativeTimeCard.Root date={now} variant="default" />
							<RelativeTimeCard.Root date={now} variant="muted" />
							<RelativeTimeCard.Root date={now} variant="link" />
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm text-muted-foreground">Custom styling</span>
						<div class="flex items-center gap-4">
							<RelativeTimeCard.Root date={now} class="text-info hover:text-info/80" />
							<RelativeTimeCard.Root
								date={now}
								class="font-semibold text-success hover:text-success/80"
							/>
							<RelativeTimeCard.Root date={now} class="text-primary italic hover:text-primary/80" />
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm text-muted-foreground">Hover card positions</span>
						<div class="flex items-center gap-4">
							<RelativeTimeCard.Root date={now} side="top" align="start" sideOffset={10}>
								Top aligned
							</RelativeTimeCard.Root>
							<RelativeTimeCard.Root date={now} side="right" align="center" sideOffset={10}>
								Right aligned
							</RelativeTimeCard.Root>
							<RelativeTimeCard.Root date={now} side="bottom" align="end" sideOffset={10}>
								Bottom aligned
							</RelativeTimeCard.Root>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm text-muted-foreground">Custom trigger</span>
						<div class="flex items-center gap-4">
							<RelativeTimeCard.Root date={now} child={clockTrigger} />
							<RelativeTimeCard.Root date={now}>
								<span class="flex items-center gap-2 text-success">
									<ClockIcon class="size-4" />
									View date
								</span>
							</RelativeTimeCard.Root>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled">
		{#snippet blurb()}
			`bind:open` keeps the parent authoritative; `onOpenChange` fires on every transition.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-4">
					<RelativeTimeCard.Root date={fiveMinutesAgo} bind:open />
					<div class="flex items-center gap-3">
						<Button variant="outline" size="sm" onclick={() => (open = !open)}>
							{open ? "Close" : "Open"} the card
						</Button>
						<span class="text-sm text-muted-foreground">open: {open}</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">RelativeTimeCard</h3>
			<p class="text-sm text-muted-foreground">
				Renders the hover card root, the trigger <code>button</code> and the card. It renders no
				wrapper of its own — <code>class</code>, <code>ref</code> and every other attribute land on the
				trigger.
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
			<h3 class="text-base font-medium">RelativeTimeCard.Timezone</h3>
			<p class="text-sm text-muted-foreground">
				One labelled, accessible row for a single zone. The card renders one per
				<code>timezones</code> entry plus one for the viewer’s own zone.
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
							{#each timezoneProps as row (row.prop)}
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
							<Table.Row>
								<Table.Cell class="font-medium">Tab</Table.Cell>
								<Table.Cell>
									Focusing the trigger opens the card after <code>openDelay</code>; tabbing away
									closes it after <code>closeDelay</code>.
								</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell class="font-medium">Enter</Table.Cell>
								<Table.Cell>Opens the card immediately when it is closed.</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell class="font-medium">Escape</Table.Cell>
								<Table.Cell>Closes the card while it is open.</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
