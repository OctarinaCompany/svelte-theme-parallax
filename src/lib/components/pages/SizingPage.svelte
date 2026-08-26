<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import * as NativeSelect from "$lib/components/ui/native-select/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import MicIcon from "@lucide/svelte/icons/mic";
	import Settings2Icon from "@lucide/svelte/icons/settings-2";
	import SlidersHorizontalIcon from "@lucide/svelte/icons/sliders-horizontal";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Sizing page — not ported from any classic surface. It documents this theme's own
	 * sizing charter: the `--control-h-*` ramp and the table density tiers that
	 * `docs/CONVENTIONS.md` §3 states normatively and §15 of the theme notes records
	 * historically. Every control below is a live component at its real rendered size — the
	 * page IS the acceptance test: if a ramp value drifts, this page shows it before any
	 * audit does.
	 *
	 * Hoisted into `DESTINATIONS` beside Themes rather than filed in the ladder, for the same
	 * reason Themes is: it explains a system the whole kit obeys, and a page that sets the
	 * rules for every group belongs above them.
	 */

	/** The ramp, as data — one row per step, the pixel value spelled out. */
	const ramp = [
		{
			size: "xs",
			px: "24px",
			token: "--control-h-xs",
			note: "micro-chrome inside groups and chips",
		},
		{ size: "sm", px: "32px", token: "--control-h-sm", note: "table and toolbar furniture" },
		{
			size: "default",
			px: "40px",
			token: "--control-h-default",
			note: "input-height — the form line",
		},
		{ size: "lg", px: "48px", token: "--control-h-lg", note: "input-height-lg — hero actions" },
	] as const;

	const densityTiers = [
		{ value: "sm", note: "40px rows, 13px body type" },
		{ value: "default", note: "56px — the uniform house row" },
		{ value: "lg", note: "76px — room for a second line" },
	] as const;

	/** Three rows are enough to show a tier; the Table page carries the full section. */
	const tierRows = [
		{ name: "Launchday", industry: "Web design", status: "Active" },
		{ name: "Medium Corporation", industry: "Publishing", status: "Active" },
		{ name: "Lyft", industry: "Transportation", status: "Paused" },
	];

	let toolbarPageSize = $state("10");
	let formPlan = $state("starter");

	const planLabel = $derived(formPlan === "starter" ? "Starter" : "Growth");
</script>

<DocPage title="Sizing">
	{#snippet subtitle()}
		One ladder for every sized control, chosen by <em>role</em> rather than by taste: the
		<code class="text-[87.5%] text-primary">--control-h-*</code> tokens set the pixels (<code
			class="text-[87.5%] text-primary">src/app.css</code
		>), size names stay shadcn's API, and
		<code class="text-[87.5%] text-primary">docs/CONVENTIONS.md</code> §3 states the rules. Tables
		add a second axis — three density tiers on the
		<a class="text-primary underline underline-offset-3" href={href("/components/table")}>Table</a> primitive
		— built on the same grammar. Everything on this page is a live component at its real size.
	{/snippet}

	<DocSection title="The ramp">
		{#snippet blurb()}
			Four steps, valued from the classic theme's shared <code>input-btn-*</code> derivation — a
			default button and a text field are the <em>same 40px object</em> there, which is the fact the
			whole ramp preserves. <code>sm</code> keeps the ecosystem's 32px over the classic theme's
			28.75px line-height trick; <code>xs</code> is shadcn's, with no reference analogue.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<div class="flex flex-wrap items-end gap-6">
					{#each ramp as step (step.size)}
						<div class="flex flex-col items-start gap-2">
							<Button variant="outline" size={step.size}>Button</Button>
							<div class="flex flex-col">
								<code class="text-xs text-primary">size="{step.size}"</code>
								<span class="font-mono text-xs text-muted-foreground">{step.px}</span>
							</div>
						</div>
					{/each}
				</div>
				<Table.Root density="sm" class="max-w-2xl">
					<Table.Header>
						<Table.Row>
							<Table.Head>Step</Table.Head>
							<Table.Head>Token</Table.Head>
							<Table.Head class="text-right">Value</Table.Head>
							<Table.Head>Role</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each ramp as step (step.size)}
							<Table.Row>
								<Table.Cell class="font-medium">{step.size}</Table.Cell>
								<Table.Cell><code class="text-[87.5%]">{step.token}</code></Table.Cell>
								<Table.Cell class="text-right font-mono">{step.px}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{step.note}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="One line: the form role (40px)">
		{#snippet blurb()}
			The charter's acceptance test. A text field, both selects and a default button share one seam
			with <em>no size props and no height classes</em> — every one of them reads
			<code>--control-h-default</code>. Before the charter the button sat 4px short of the field
			beside it; if these five ever misalign again, the ramp has drifted.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex max-w-2xl flex-wrap items-center gap-2">
					<Input placeholder="james@example.com" class="w-48" aria-label="Email" />
					<Select.Root type="single" bind:value={formPlan}>
						<Select.Trigger class="w-32" aria-label="Plan">{planLabel}</Select.Trigger>
						<Select.Content>
							<Select.Item value="starter" label="Starter" />
							<Select.Item value="growth" label="Growth" />
						</Select.Content>
					</Select.Root>
					<NativeSelect.Root class="w-32" aria-label="Team size">
						<NativeSelect.Option value="1">1–10</NativeSelect.Option>
						<NativeSelect.Option value="2">11–50</NativeSelect.Option>
					</NativeSelect.Root>
					<Button>Subscribe</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Furniture: the table role (32px)">
		{#snippet blurb()}
			Toolbars, facets, pagination and card-header controls take <code>sm</code> — the compact idiom shadcn
			and most design systems use for data surfaces (Carbon among them), kept deliberately. The contrast
			with the 40px form line is what lets a dense table breathe: 32 inside the table's world, 40 in the
			form's, never mixed on one seam.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex max-w-2xl flex-wrap items-center gap-2">
					<Button variant="outline" size="sm">
						<SlidersHorizontalIcon data-icon="inline-start" />
						Filter
						<Badge class="px-1.5">2</Badge>
					</Button>
					<Button variant="outline" size="sm">
						<Settings2Icon data-icon="inline-start" />
						View
					</Button>
					<Select.Root type="single" bind:value={toolbarPageSize}>
						<Select.Trigger size="sm" class="w-16" aria-label="Rows per page">
							{toolbarPageSize}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="10" label="10" />
							<Select.Item value="20" label="20" />
						</Select.Content>
					</Select.Root>
					<NativeSelect.Root size="sm" class="w-28" aria-label="Status filter">
						<NativeSelect.Option value="all">All</NativeSelect.Option>
						<NativeSelect.Option value="active">Active</NativeSelect.Option>
					</NativeSelect.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Micro-chrome (24px) and hero actions (48px)">
		{#snippet blurb()}
			<code>xs</code> lives <em>inside</em> other controls — the buttons an input group carries.
			<code>lg</code> is the 48px statement rung for standalone hero actions, and the one step that
			must never stand beside a 40px field: the reconciliation recipes that once used
			<code>lg</code> to reach 40 died with the ramp.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-wrap items-end gap-8">
				<div class="flex flex-col gap-2">
					<InputGroup.Root class="w-64">
						<InputGroup.Input placeholder="Ask anything..." aria-label="Prompt" />
						<InputGroup.Addon align="inline-end">
							<InputGroup.Button size="icon-xs" aria-label="Voice">
								<MicIcon />
							</InputGroup.Button>
							<InputGroup.Button size="icon-xs" variant="default" aria-label="Send">
								<ArrowUpIcon />
							</InputGroup.Button>
						</InputGroup.Addon>
					</InputGroup.Root>
					<span class="font-mono text-xs text-muted-foreground"
						>icon-xs — 24px, inside the group</span
					>
				</div>
				<div class="flex flex-col gap-2">
					<Button size="lg" class="w-fit">Get started</Button>
					<span class="font-mono text-xs text-muted-foreground">lg — 48px, standalone only</span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="The second axis: table density">
		{#snippet blurb()}
			Density never resizes controls — it retunes the surface <em>around</em> them, the way
			<code>Card</code>'s <code>size</code> retunes <code>--card-spacing</code>:
			<code>density</code> stamps <code>data-density</code>, tier rows in <code>app.css</code>
			set <code>--table-row-h</code>, and each tier is a floor, not a clamp. The
			<a class="text-primary underline underline-offset-3" href={href("/components/table")}
				>Table page</a
			>
			carries the full section; the
			<a
				class="text-primary underline underline-offset-3"
				href={href("/components/tables-in-cards")}>Tables in cards page</a
			> puts the switcher in a card header, Airtable-style.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				{#each densityTiers as tier (tier.value)}
					<div class="flex flex-col gap-2">
						<h3 class="text-base font-medium">
							<code class="text-[87.5%] text-primary">density="{tier.value}"</code>
							<span class="text-sm font-normal text-muted-foreground">— {tier.note}</span>
						</h3>
						<div class="max-w-2xl overflow-hidden rounded-md border">
							<Table.Root density={tier.value}>
								<Table.Header>
									<Table.Row>
										<Table.Head>Name</Table.Head>
										<Table.Head>Industry</Table.Head>
										<Table.Head>Status</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each tierRows as row (row.name)}
										<Table.Row>
											<Table.Cell class="font-medium">{row.name}</Table.Cell>
											<Table.Cell>{row.industry}</Table.Cell>
											<Table.Cell>
												<Badge
													variant={row.status === "Active" ? "success-subtle" : "warning-subtle"}
												>
													{row.status}
												</Badge>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Consuming the ramp, and departing from it">
		{#snippet blurb()}
			Size <em>names</em> are the API; the pixels live in tokens, reached two ways. Components with
			a tv size map — Button, Toggle, NumberField, SegmentedInput, Autocomplete, the Filters chips —
			consume the tokens in their variant classes (<code>h-(--control-h-default)</code>), so a
			call-site <code>h-auto</code> or
			<code>h-8</code> still wins through tailwind-merge. Fields and selects are pinned by unlayered
			<code>data-size</code>
			rules, so a departure there must state itself with
			<code>!</code> (<code>h-auto!</code>) — or better, pick the size variant that already says
			what it means.
		{/snippet}
		<Card.Root>
			<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
				<Table.Root density="sm">
					<Table.Header>
						<Table.Row>
							<Table.Head>Mechanism</Table.Head>
							<Table.Head>Covers</Table.Head>
							<Table.Head>To depart</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						<Table.Row>
							<Table.Cell class="font-medium">Token-consuming variant classes</Table.Cell>
							<Table.Cell class="text-muted-foreground">
								Button and every <code>buttonVariants()</code>-classed primitive; the tv-sized
								controls
							</Table.Cell>
							<Table.Cell
								><code class="text-[87.5%]">class="h-auto"</code> — plain utilities merge</Table.Cell
							>
						</Table.Row>
						<Table.Row>
							<Table.Cell class="font-medium">Unlayered <code>data-size</code> rules</Table.Cell>
							<Table.Cell class="text-muted-foreground">
								Input, Textarea, InputGroup, Select trigger, native select
							</Table.Cell>
							<Table.Cell
								><code class="text-[87.5%]">class="h-auto!"</code> — the stated escape</Table.Cell
							>
						</Table.Row>
						<Table.Row>
							<Table.Cell class="font-medium"
								><code class="text-[87.5%]">data-density</code> tier tokens</Table.Cell
							>
							<Table.Cell class="text-muted-foreground">
								Table rows and heads; the data grid's presets read the same ladder
							</Table.Cell>
							<Table.Cell class="text-muted-foreground"
								>tiers are floors — taller content simply wins</Table.Cell
							>
						</Table.Row>
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
