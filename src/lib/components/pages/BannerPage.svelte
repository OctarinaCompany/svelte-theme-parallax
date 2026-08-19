<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Banner from "$lib/components/ui/banner/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import CheckCircleIcon from "@lucide/svelte/icons/circle-check";
	import InfoIcon from "@lucide/svelte/icons/info";

	import BannerControls from "./banner-controls.svelte";

	/**
	 * The Banner component page.
	 *
	 * THE NEAREST THE CLASSIC THEME SURFACE IS `.alert`, ported on the Alerts page — where the classic theme
	 * regenerates the classic tinted variants as SOLID fills. This page deliberately does not
	 * follow it there.
	 *
	 * An alert is an inline block inside a card; a banner is a page-width strip that can be pinned
	 * over the viewport, and a solid `success` band across the top of the window is a different
	 * and much louder object than the same colour inside a card. The component keeps its tinted
	 * treatment — `bg-card` with a flat `from-{state}/10` gradient laid over it, so the surface
	 * stays opaque and the page cannot read through a pinned banner.
	 *
	 * The tint is token-derived either way, so the palette picker still drives it.
	 */

	let open = $state(true);
	let uncontrolledOpen = $state(true);

	const rootProps = [
		{ prop: "ref", type: "HTMLDivElement | null", default: "null", bindable: true },
		{ prop: "open", type: "boolean | undefined", default: "undefined", bindable: true },
		{ prop: "defaultOpen", type: "boolean", default: "true", bindable: false },
		{ prop: "onOpenChange", type: "(open: boolean) => void", default: "—", bindable: false },
		{
			prop: "onDismiss",
			type: "() => void",
			default: "—",
			bindable: false,
			note: "queued only",
		},
		{
			prop: "variant",
			type: "'default' | 'info' | 'success' | 'warning' | 'destructive'",
			default: "'default'",
			bindable: false,
		},
		{
			prop: "priority",
			type: "number | undefined",
			default: "undefined",
			bindable: false,
			note: "queued only",
		},
		{
			prop: "duration",
			type: "number | undefined",
			default: "undefined",
			bindable: false,
			note: "queued only",
		},
		{ prop: "dismissible", type: "boolean", default: "true", bindable: false },
		{
			prop: "child",
			type: "Snippet<[{ props: BannerChildProps }]>",
			default: "—",
			bindable: false,
		},
		{ prop: "children", type: "Snippet", default: "—", bindable: false },
	];

	const queueProps = [
		{ prop: "maxVisible", type: "number", default: "1" },
		{ prop: "side", type: "'top' | 'bottom'", default: "'top'" },
		{ prop: "strategy", type: "'fixed' | 'static' | 'sticky' | 'absolute'", default: "'fixed'" },
		{ prop: "container", type: "Element | string | null", default: "undefined" },
		{ prop: "children", type: "Snippet", default: "—" },
	];

	const closeProps = [
		{ prop: "disabled", type: "boolean", default: "undefined ⇒ !dismissible" },
		{ prop: "onclick", type: "(event: MouseEvent) => void", default: "—" },
		{ prop: "children", type: "Snippet", default: "<XIcon />" },
		{ prop: "variant", type: "ButtonVariant", default: "'ghost'" },
		{ prop: "size", type: "ButtonSize", default: "'icon-sm'" },
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "Banner", values: "banner" },
		{ attribute: "[data-state]", part: "Banner", values: "open" },
		{
			attribute: "[data-variant]",
			part: "Banner",
			values: "default | info | success | warning | destructive",
		},
		{ attribute: "[data-slot]", part: "Banner.Queue container", values: "banner-container" },
		{ attribute: "[data-side]", part: "Banner.Queue container", values: "top | bottom" },
		{
			attribute: "[data-strategy]",
			part: "Banner.Queue container",
			values: "fixed | static | sticky | absolute",
		},
		{
			attribute: "[data-slot]",
			part: "Banner.Icon / Content / Title / Description / Actions / Close",
			values:
				"banner-icon | banner-content | banner-title | banner-description | banner-actions | banner-close",
		},
	];

	const errors = [
		{
			component: "Banner.Close",
			message: "`<Banner.Close>` must be used within `<Banner.Root>`.",
		},
		{
			component: "getBannersContext(name)",
			message: "`${name}` must be used within `<Banner.Queue>`.",
		},
	];
</script>

<DocPage title="Banner">
	{#snippet subtitle()}
		A notification banner that appears at the top or bottom of the viewport. Supports queuing,
		priority, and auto-dismiss. Where Alert is a bordered box in the flow of a column, this is a
		full-width strip that a <code>Banner.Queue</code> can pin over the viewport, one at a time in
		priority order; and where a Sonner toast clears itself on a timer, a banner waits to be
		dismissed — auto-dismiss is opt-in per banner, through <code>duration</code>, and read only
		inside that queue.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<div class="flex w-full flex-col gap-3">
					<Banner.Root bind:open>
						<Banner.Icon><InfoIcon /></Banner.Icon>
						<Banner.Content>
							<Banner.Title>New update available</Banner.Title>
							<Banner.Description>
								A new version of the app is available. Update now to get the latest features.
							</Banner.Description>
						</Banner.Content>
						<Banner.Actions>
							<Button size="sm">Update now</Button>
							<Banner.Close />
						</Banner.Actions>
					</Banner.Root>
					{#if !open}
						<Button onclick={() => (open = true)}>Show banner</Button>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Uncontrolled">
		{#snippet blurb()}
			defaultOpen seeds the banner once; the internal state drives every render after that.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full flex-col gap-3">
					<Banner.Root
						variant="success"
						defaultOpen={true}
						onOpenChange={(next) => (uncontrolledOpen = next)}
					>
						<Banner.Icon><CheckCircleIcon /></Banner.Icon>
						<Banner.Content>
							<Banner.Title>Changes saved</Banner.Title>
							<Banner.Description>Your changes have been saved successfully.</Banner.Description>
						</Banner.Content>
						<Banner.Actions>
							<Banner.Close />
						</Banner.Actions>
					</Banner.Root>
					<p class="text-sm text-muted-foreground">
						Last reported open state: <code>{uncontrolledOpen}</code>
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Stacked Banners">
		{#snippet blurb()}
			The queue keeps its defaults, so the banner pins itself to the top of the viewport and later
			additions wait their turn — add a few and watch the count.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex-col items-stretch justify-start gap-6">
				<Banner.Queue>
					<BannerControls />
				</Banner.Queue>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Variants">
		{#snippet blurb()}
			Every severity, side by side.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full flex-col gap-3">
					{#each Banner.BANNER_VARIANTS as variant (variant)}
						<Banner.Root {variant} defaultOpen={true} dismissible={false}>
							<Banner.Content>
								<Banner.Title class="capitalize">{variant}</Banner.Title>
							</Banner.Content>
						</Banner.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Banner</h3>
			<p class="text-sm text-muted-foreground">
				An individual banner. Usable standalone, or registered into a <code>Banner.Queue</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each rootProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Banner.Queue</h3>
			<p class="text-sm text-muted-foreground">
				The queue provider. Renders no props of its own onto a DOM element.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each queueProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Banner.Close</h3>
			<p class="text-sm text-muted-foreground">Composes the shadcn Button internally.</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each closeProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
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
			<h3 class="text-base font-medium">Errors</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Component</Table.Head>
								<Table.Head>Message</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each errors as row (row.component)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.component}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.message}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
