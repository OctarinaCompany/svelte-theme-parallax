<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Fps } from "$lib/components/ui/fps/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The FPS component page.
	 *
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. This is a development instrument rather than a piece of a
	 * dashboard, and there is almost nothing to theme: a bordered chip on `--background/80`, and an
	 * ink that changes band with the reading.
	 *
	 * ONE SUBSTITUTION FROM UPSTREAM, and it is a real one: upstream's warning band is
	 * `text-orange-500`, a raw palette colour. It becomes `--warning-subtle-foreground`, the walked
	 * ink of the soft status family — `--warning` itself is `#f5c042`, a fill that fails contrast
	 * as type. `fps.svelte.ts` records the reasoning beside the variants.
	 *
	 * NOTHING ON THIS PAGE PRODUCES LOAD. The readings you see are whatever the browser is already
	 * doing, so on an idle page every counter reads the display's refresh rate and stays green. To
	 * see the bands change, drag a heavy page — the Chart page is the one in this kit that will do
	 * it — with a `fixed` counter running.
	 */

	let fixedEnabled = $state(false);

	const props = [
		{
			prop: "strategy",
			type: '"fixed" | "absolute"',
			default: '"fixed"',
			description:
				"`fixed` pins the chip to the viewport and portals it out of the tree; `absolute` leaves it inside its container.",
		},
		{
			prop: "position",
			type: '"top-left" | "top-right" | "bottom-left" | "bottom-right"',
			default: '"top-right"',
			description: "Which corner of the positioning context the chip parks in.",
		},
		{
			prop: "label",
			type: "string",
			default: "—",
			description: "Caption rendered muted before the number.",
		},
		{
			prop: "updateInterval",
			type: "number",
			default: "500",
			description: "How often the reading is republished, in milliseconds.",
		},
		{
			prop: "warningThreshold",
			type: "number",
			default: "30",
			description: "Below this the chip takes the warning ink.",
		},
		{
			prop: "destructiveThreshold",
			type: "number",
			default: "20",
			description: "Below this it takes the destructive ink.",
		},
		{
			prop: "portalContainer",
			type: "Element | DocumentFragment | string | null",
			default: "document.body",
			description: "Where a `fixed` chip is portalled to. Ignored when `strategy` is `absolute`.",
		},
		{
			prop: "enabled",
			type: "boolean",
			default: "true",
			description: "Render and measure at all. When false the frame loop is not started.",
		},
	];

	const frame =
		"relative flex h-56 w-full items-center justify-center rounded-md border border-border bg-muted/50";
</script>

<DocPage title="FPS">
	{#snippet subtitle()}
		A frames-per-second counter, for watching whether an interaction still runs at frame rate.
	{/snippet}

	<DocSection title="Usage">
		{#snippet blurb()}
			`absolute` keeps the counter inside the box it measures, which is what a demo wants. It is not
			the default — see the next section for why.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class={frame}>
					<Fps strategy="absolute" position="top-right" />
					<div class="flex flex-col items-center gap-1">
						<p class="text-sm">Absolute positioning</p>
						<p class="text-sm text-muted-foreground">Relative to this container, with no portal.</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Positioning strategy">
		{#snippet blurb()}
			The two strategies answer different questions. `absolute` measures a region and travels with
			it. `fixed` measures the page: it portals to `document.body` and pins to the viewport, so it
			survives scrolling and any container's `overflow`. That is the default because the usual job
			is watching the whole page — and it is behind a switch here, because a chip welded to the
			corner of the documentation is a poor houseguest.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div class={frame}>
					<Fps strategy="absolute" position="top-right" label="Absolute" />
					<p class="text-sm text-muted-foreground">Inside this container.</p>
				</div>

				<div class="flex items-center gap-2">
					<Switch id="fps-fixed" bind:checked={fixedEnabled} />
					<Label for="fps-fixed">Pin a fixed counter to the viewport</Label>
				</div>

				<!--
					`enabled` rather than an `{#if}`: it is the prop the component ships for exactly this,
					and it stops the frame loop as well as the render — an `{#if}` would too, but only by
					accident of unmounting.
				-->
				<Fps strategy="fixed" position="bottom-right" label="Fixed" enabled={fixedEnabled} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Position">
		{#snippet blurb()}
			Four corners, each relative to the nearest positioned ancestor.
		{/snippet}
		<Card.Root>
			<Card.Content class="grid gap-4 sm:grid-cols-2">
				{#each ["top-left", "top-right", "bottom-left", "bottom-right"] as const as position (position)}
					<div
						class="relative flex h-32 items-center justify-center rounded-md border border-border bg-muted/50"
					>
						<Fps strategy="absolute" {position} />
						<p class="font-mono text-xs text-muted-foreground">{position}</p>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Thresholds">
		{#snippet blurb()}
			The two thresholds pick the ink. Raised absurdly high here so the warning and destructive
			bands are visible on a machine that is comfortably hitting its refresh rate — in real use the
			defaults of 30 and 20 are the ones you want.
		{/snippet}
		<Card.Root>
			<Card.Content class="grid gap-4 sm:grid-cols-3">
				<div
					class="relative flex h-32 items-center justify-center rounded-md border border-border bg-muted/50"
				>
					<Fps strategy="absolute" position="top-right" label="Good" />
					<p class="text-xs text-muted-foreground">defaults</p>
				</div>
				<div
					class="relative flex h-32 items-center justify-center rounded-md border border-border bg-muted/50"
				>
					<Fps
						strategy="absolute"
						position="top-right"
						label="Warning"
						warningThreshold={1000}
						destructiveThreshold={20}
					/>
					<p class="text-xs text-muted-foreground">warning at 1000</p>
				</div>
				<div
					class="relative flex h-32 items-center justify-center rounded-md border border-border bg-muted/50"
				>
					<Fps
						strategy="absolute"
						position="top-right"
						label="Destructive"
						warningThreshold={2000}
						destructiveThreshold={1000}
					/>
					<p class="text-xs text-muted-foreground">destructive at 1000</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Update interval">
		{#snippet blurb()}
			How often the reading is republished. Short intervals show jitter honestly; long ones read as
			an average. The measurement itself is unaffected — every frame is counted either way.
		{/snippet}
		<Card.Root>
			<Card.Content class="grid gap-4 sm:grid-cols-3">
				{#each [100, 500, 2000] as interval (interval)}
					<div
						class="relative flex h-32 items-center justify-center rounded-md border border-border bg-muted/50"
					>
						<Fps
							strategy="absolute"
							position="top-right"
							label="{interval}ms"
							updateInterval={interval}
						/>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Props">
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
						{#each props as row (row.prop)}
							<Table.Row>
								<Table.Cell class="font-mono text-xs">{row.prop}</Table.Cell>
								<Table.Cell class="font-mono text-xs text-muted-foreground">{row.type}</Table.Cell>
								<Table.Cell class="font-mono text-xs text-muted-foreground"
									>{row.default}</Table.Cell
								>
								<Table.Cell class="text-sm">{row.description}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
