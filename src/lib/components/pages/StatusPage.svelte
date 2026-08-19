<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Status from "$lib/components/ui/status/index.js";
	import { type StatusIndicatorSize, type StatusVariant } from "$lib/components/ui/status/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Status component page.
	 *
	 * THE ONE COMPONENT IN THIS BATCH WITH AN EXACT THE CLASSIC THEME COUNTERPART, and the only one that
	 * needed a rule in `app.css`.
	 *
	 * The classic theme's soft state badge is `.text-bg-{state}-subtle`: `background-color:
	 * var(--bs-{state}-bg-subtle)` with the full-strength colour as its text. It is the pill in
	 * every table row and activity feed in the theme, and this repository ports it on the
	 * Badges page as `bg-{state}-subtle text-{state}-subtle-foreground` — the ground is
	 * the classic theme's, the ink is the contrast-walked token that replaced the raw colour on
	 * 2026-08-11 (app.css §status tokens).
	 *
	 * `Status` is that same pill with an animated dot in front of it, so the two must not
	 * disagree — the same "Active" chip cannot be painted two ways depending on which component
	 * drew it. The component ships `bg-{state}/10` with a `/20` border; `app.css` restates the
	 * ground as the `-subtle` token and drops the outline, which is what the classic theme's badge has.
	 * The dot keeps the full-strength colour: it is a fill, not type.
	 */

	type Service = { name: string; status: StatusVariant; uptime: string };

	const services = $state<Service[]>([
		{ name: "API Server", status: "success", uptime: "99.9%" },
		{ name: "Cache Service", status: "warning", uptime: "98.5%" },
		{ name: "Message Queue", status: "success", uptime: "99.8%" },
		{ name: "CDN", status: "destructive", uptime: "95.2%" },
		{ name: "Email Service", status: "info", uptime: "Updating..." },
	]);

	/**
	 * The live-monitoring sample. `live` is what a real monitor list has and the component did
	 * not: a row that is not reporting — paused, decommissioned — has nothing to pulse about,
	 * and a page of dots all pinging at once is a page nobody can read.
	 */
	type Monitor = { region: string; detail: string; status: StatusVariant; live: boolean };

	const monitors: Monitor[] = [
		{ region: "us-east-1", detail: "42 ms", status: "success", live: true },
		{ region: "eu-west-1", detail: "88 ms", status: "success", live: true },
		{ region: "ap-south-1", detail: "recovering", status: "warning", live: true },
		{ region: "sa-east-1", detail: "no traffic since 14:02", status: "destructive", live: true },
		{ region: "us-west-1", detail: "decommissioned", status: "default", live: false },
	];

	const indicatorSizes: { size: StatusIndicatorSize; label: string }[] = [
		{ size: "sm", label: "sm — 6px" },
		{ size: "default", label: "default — 8px" },
		{ size: "lg", label: "lg — 12px" },
	];

	const variantGroups: { title: string; variant: StatusVariant; labels: string[] }[] = [
		{ title: "Success Variants", variant: "success", labels: ["Online", "Active", "Connected"] },
		{
			title: "Destructive Variants",
			variant: "destructive",
			labels: ["Offline", "Disconnected", "Failed"],
		},
		{ title: "Warning Variants", variant: "warning", labels: ["Away", "Busy", "Pending"] },
		{ title: "Info Variants", variant: "info", labels: ["Idle", "In Progress", "Syncing"] },
		{ title: "Default Variants", variant: "default", labels: ["Unknown", "Not Set", "N/A"] },
	];

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Not populated in `child` mode.",
		},
		{
			prop: "variant",
			type: "'default' | 'success' | 'destructive' | 'warning' | 'info'",
			default: "'default'",
			description:
				"The visual style and color theme of the status badge. An unknown runtime value normalises to `default`.",
		},
		{
			prop: "appearance",
			type: "'pill' | 'bare'",
			default: "'pill'",
			description:
				"How much chrome the status carries. `bare` drops the ground, border, radius and padding and leaves the dot and label on the page ground. An unknown runtime value normalises to `pill`.",
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
			description: "Badge content. Not rendered when `child` is supplied.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: StatusChildProps }]>",
			default: "—",
			description:
				"Render the badge onto your own element instead of the default `<div>`. Replaces upstream’s `asChild`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];

	const indicatorProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "size",
			type: "'sm' | 'default' | 'lg'",
			default: "'default'",
			description:
				"The diameter of the dot: 6px, 8px, 12px. The pill's height is unchanged at every step. An unknown runtime value normalises to `default`.",
		},
		{
			prop: "pulse",
			type: "boolean",
			default: "true",
			description:
				"Whether the halo pings. Pass `false` for a status that is not live. `prefers-reduced-motion: reduce` overrides it to `false`.",
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

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "Status", values: "status" },
		{ attribute: "[data-slot]", part: "Status.Indicator", values: "status-indicator" },
		{ attribute: "[data-slot]", part: "Status.Label", values: "status-label" },
		{
			attribute: "[data-variant]",
			part: "Status",
			values: "default | success | destructive | warning | info",
		},
		{ attribute: "[data-appearance]", part: "Status", values: "pill | bare" },
		{ attribute: "[data-size]", part: "Status.Indicator", values: "sm | default | lg" },
		{
			attribute: "[data-pulse]",
			part: "Status.Indicator",
			values: "on | off — `off` under reduced motion, whatever `pulse` says",
		},
	];
</script>

<DocPage title="Status">
	{#snippet subtitle()}
		A flexible status indicator with an animated ping effect and colour variants for displaying
		system states, user presence and service health.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center gap-2.5">
					<Status.Root variant="success">
						<Status.Indicator />
						<Status.Label>Online</Status.Label>
					</Status.Root>

					<Status.Root variant="destructive">
						<Status.Indicator />
						<Status.Label>Offline</Status.Label>
					</Status.Root>

					<Status.Root variant="warning">
						<Status.Indicator />
						<Status.Label>Away</Status.Label>
					</Status.Root>

					<Status.Root variant="info">
						<Status.Indicator />
						<Status.Label>Idle</Status.Label>
					</Status.Root>

					<Status.Root variant="default">
						<Status.Indicator />
						<Status.Label>Unknown</Status.Label>
					</Status.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Variants">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-6">
					{#each variantGroups as group (group.title)}
						<div class="flex flex-col gap-3">
							<h3 class="text-sm font-medium">{group.title}</h3>
							<div class="flex flex-wrap items-center gap-2.5">
								{#each group.labels as label, index (label)}
									<Status.Root
										variant={group.variant}
										class={index === 2 ? "hidden sm:inline-flex" : ""}
									>
										<Status.Indicator />
										<Status.Label>{label}</Status.Label>
									</Status.Root>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Text Only">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center gap-2.5">
					<Status.Root variant="success">
						<Status.Label>Active</Status.Label>
					</Status.Root>

					<Status.Root variant="destructive">
						<Status.Label>Inactive</Status.Label>
					</Status.Root>

					<Status.Root variant="warning">
						<Status.Label>Pending</Status.Label>
					</Status.Root>

					<Status.Root variant="info">
						<Status.Label>Processing</Status.Label>
					</Status.Root>

					<Status.Root variant="default">
						<Status.Label>Draft</Status.Label>
					</Status.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Service Status List">
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-md flex-col gap-2">
					{#each services as service (service.name)}
						<div class="flex items-center justify-between rounded-lg border bg-card p-3">
							<div class="flex flex-col gap-0.5">
								<span class="text-sm font-medium">{service.name}</span>
								<span class="text-xs text-muted-foreground">Uptime: {service.uptime}</span>
							</div>
							<Status.Root variant={service.status}>
								<Status.Indicator />
								<Status.Label class="capitalize">{service.status}</Status.Label>
							</Status.Root>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Live monitoring">
		{#snippet blurb()}
			A monitor list is where the ping earns its keep and where it costs the most. Give
			<code>Status.Indicator</code>
			a <code>pulse</code> of <code>false</code> to rest a row that is not reporting — paused,
			decommissioned, or simply one of fifty — and the root an <code>appearance</code> of
			<code>bare</code>
			to drop the pill so a column of monitors reads as one list instead of a stack of chips. Every dot
			rests under <code>prefers-reduced-motion: reduce</code> regardless of
			<code>pulse</code>.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-6">
					<div class="flex w-full max-w-md flex-col gap-3">
						<h3 class="text-sm font-medium">Edge regions</h3>
						{#each monitors as monitor (monitor.region)}
							<div class="flex items-center justify-between gap-4">
								<Status.Root appearance="bare" variant={monitor.status}>
									<Status.Indicator pulse={monitor.live} />
									<Status.Label>{monitor.region}</Status.Label>
								</Status.Root>
								<span class="text-sm text-muted-foreground">{monitor.detail}</span>
							</div>
						{/each}
					</div>

					<div class="flex flex-col gap-3">
						<h3 class="text-sm font-medium">Live and at rest</h3>
						<div class="flex flex-wrap items-center gap-4">
							<Status.Root variant="success">
								<Status.Indicator />
								<Status.Label>Reporting</Status.Label>
							</Status.Root>

							<Status.Root variant="default">
								<Status.Indicator pulse={false} />
								<Status.Label>Paused</Status.Label>
							</Status.Root>

							<Status.Root appearance="bare" variant="success">
								<Status.Indicator />
								<Status.Label>Reporting</Status.Label>
							</Status.Root>

							<Status.Root appearance="bare" variant="default">
								<Status.Indicator pulse={false} />
								<Status.Label>Paused</Status.Label>
							</Status.Root>
						</div>
					</div>

					<div class="flex flex-col gap-3">
						<h3 class="text-sm font-medium">Sizes</h3>
						<p class="text-sm text-muted-foreground">
							The pill keeps its height at every size: the label's line box, not the dot, sets it.
						</p>
						<div class="flex flex-wrap items-center gap-4">
							{#each indicatorSizes as item (item.size)}
								<div class="flex items-center gap-2.5">
									<Status.Root variant="info">
										<Status.Indicator size={item.size} />
										<Status.Label>Syncing</Status.Label>
									</Status.Root>

									<Status.Root appearance="bare" variant="info">
										<Status.Indicator size={item.size} />
										<Status.Label>{item.label}</Status.Label>
									</Status.Root>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Status</h3>
			<p class="text-sm text-muted-foreground">
				The badge container. Renders a <code>div</code> unless a <code>child</code> snippet is supplied.
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
			<h3 class="text-base font-medium">Status.Indicator</h3>
			<p class="text-sm text-muted-foreground">
				The pulse indicator for the status. Sized by <code>size</code>, rested by
				<code>pulse</code>.
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
							{#each indicatorProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Status.Label</h3>
			<p class="text-sm text-muted-foreground">The text label for the status.</p>
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
