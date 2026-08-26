<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as ScrollSpy from "$lib/components/ui/scroll-spy/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import type { MouseEventHandler } from "svelte/elements";
	import { Button } from "$lib/components/ui/button/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

	/**
	 * The Scroll spy component page.
	 *
	 * THE CLASSIC FRAMEWORK HAS A SCROLLSPY AND IT HAS NO STYLE. The plugin's whole contract is toggling
	 * `.active` on whichever nav link matches the scroll position; what that class LOOKS like is
	 * the nav's business, and the classic theme adds nothing of its own.
	 *
	 * So there is nothing to port and nothing to reproduce. The active link here is
	 * `--primary`-coloured with a `--primary` rail beside it, which is the treatment the sidebar
	 * already uses for the current page — the one place in this theme where "you are here" is
	 * spelled out.
	 */

	// One scroll container per example: each `<ScrollSpy.Viewport>` publishes its element, and the
	// root tracks and scrolls that element instead of the window.
	let defaultContainer = $state<HTMLDivElement | null>(null);
	let verticalContainer = $state<HTMLDivElement | null>(null);
	let controlledContainer = $state<HTMLDivElement | null>(null);

	let controlledValue = $state("controlled-getting-started");

	const guideSections = [
		{
			value: "introduction",
			title: "Introduction",
			body: "Scroll Spy automatically updates navigation links based on scroll position.",
		},
		{
			value: "getting-started",
			title: "Getting Started",
			body: "Install the component using the CLI or copy the source code.",
		},
		{
			value: "usage",
			title: "Usage",
			body: "Compose the Root, Nav, Link, Viewport and Section parts to build your navigation.",
		},
		{
			value: "api-reference",
			title: "API Reference",
			body: "Complete API documentation for all Scroll Spy parts.",
		},
	];

	const featureSections = [
		{
			value: "overview",
			title: "Overview",
			body: "A vertical layout stacks the nav above the content.",
		},
		{ value: "features", title: "Features", body: "All the features available in this component." },
		{
			value: "installation",
			title: "Installation",
			body: "How to install and set up the component.",
		},
		{ value: "examples", title: "Examples", body: "Various examples showing different use cases." },
		{ value: "api", title: "API", body: "Complete API documentation for all components." },
	];

	const rootProps = [
		{
			prop: "value",
			type: "string",
			default: "—",
			description: "The active section id. Bindable; controlled when bound or passed.",
		},
		{
			prop: "defaultValue",
			type: "string",
			default: "—",
			description: "Seeds `value` once when the component is uncontrolled.",
		},
		{
			prop: "onValueChange",
			type: "(value: string) => void",
			default: "—",
			description: "Called on every change to a non-empty active section id.",
		},
		{
			prop: "rootMargin",
			type: "string",
			default: "`${-offset}px 0px -70% 0px`",
			description: "Passed to the IntersectionObserver; shrinks the observation band.",
		},
		{
			prop: "threshold",
			type: "number | number[]",
			default: "0.1",
			description: "Passed to the IntersectionObserver.",
		},
		{
			prop: "offset",
			type: "number",
			default: "0",
			description: "Pixels subtracted from the scroll destination. Also drives `rootMargin`.",
		},
		{
			prop: "scrollBehavior",
			type: "ScrollBehavior",
			default: '"smooth" ("auto" under reduced motion)',
			description: "How a link-triggered scroll animates.",
		},
		{
			prop: "scrollContainer",
			type: "HTMLElement | null",
			default: "null",
			description: "Element to track and scroll. `null` tracks the window.",
		},
		{
			prop: "dir",
			type: '"ltr" | "rtl"',
			default: "Resolved",
			description: 'Falls back to the nearest `<DirectionProvider>`, then the DOM, then `"ltr"`.',
		},
		{
			prop: "orientation",
			type: '"horizontal" | "vertical"',
			default: '"horizontal"',
			description: "Layout axis, published as `data-orientation` on every part.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<div>`.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last through `cn()`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the root onto your own element.",
		},
	];

	const navProps = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<nav>`.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last through `cn()`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the navigation onto your own element.",
		},
	];

	const linkProps = [
		{
			prop: "value",
			type: "string",
			default: "— (required)",
			description: 'The id of the section this link targets; becomes `href="#value"`.',
		},
		{
			prop: "onclick",
			type: "(event: MouseEvent) => void",
			default: "—",
			description: "Runs after the default navigation is suppressed, before the scroll.",
		},
		{
			prop: "ref",
			type: "HTMLAnchorElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<a>`.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last through `cn()`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the link onto your own element. `href` is omitted in this mode.",
		},
	];

	const viewportProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<div>`; hand it to `scrollContainer`.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last through `cn()`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the viewport onto your own element.",
		},
	];

	const sectionProps = [
		{
			prop: "value",
			type: "string",
			default: "— (required)",
			description: "Becomes the element `id` and registers it for tracking.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<div>`.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Passed straight through; the section carries no default classes.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the section onto your own element.",
		},
	];

	const propTables = [
		{ part: "ScrollSpy.Root", rows: rootProps },
		{ part: "ScrollSpy.Nav", rows: navProps },
		{ part: "ScrollSpy.Link", rows: linkProps },
		{ part: "ScrollSpy.Viewport", rows: viewportProps },
		{ part: "ScrollSpy.Section", rows: sectionProps },
	];

	// The two demo examples (demo 1, demo 2) render their spy anchors as
	// outline Buttons that go solid `--primary` while active, and scroll a ScrollArea rather than a
	// bare overflow div. A single-wrapper `Scrollspy` would tag children with
	// `data-scrollspy-anchor` and flips `data-active`; here the same composition goes through this
	// port's parts — `Link`'s `child` snippet renders the Button (its `data-state="active"` replaces
	// a `data-active="true"`), and `Section` registers each block for tracking. The tracked
	// scroll element is the ScrollArea's viewport, exposed by its bindable `viewportRef`.
	let basicScrollspyViewport = $state<HTMLElement | null>(null);
	let basicScrollAreaViewport = $state<HTMLElement | null>(null);

	// Distinct id ranges per demo, so the pairs of sections never
	// collide on one page.
	const basicScrollspyNav = [1, 2, 3, 4, 5].map((n) => ({
		id: `section-${n}`,
		label: `Section ${n}`,
	}));
	const basicScrollAreaNav = [1, 2, 3, 4, 5].map((n) => ({
		id: `section-${n + 5}`,
		label: `Section ${n}`,
	}));

	// `Link` types its `onclick` for the default `<a>`; in `child` mode the same handler lands on a
	// `<button>` (Button's own props want a handler valid for both elements it can render). The
	// handler only cancels the event and scrolls, so the element type is immaterial — this cast
	// records that, once, instead of at every call site.
	const asButtonProps = (props: ScrollSpy.ScrollSpyLinkChildProps) =>
		props as unknown as Omit<ScrollSpy.ScrollSpyLinkChildProps, "onclick"> & {
			onclick: MouseEventHandler<HTMLButtonElement> & MouseEventHandler<HTMLAnchorElement>;
		};

	const dataAttributes = [
		{ part: "ScrollSpy.Root", attribute: "[data-orientation]", value: '"horizontal" | "vertical"' },
		{ part: "ScrollSpy.Nav", attribute: "[data-orientation]", value: '"horizontal" | "vertical"' },
		{ part: "ScrollSpy.Link", attribute: "[data-orientation]", value: '"horizontal" | "vertical"' },
		{ part: "ScrollSpy.Link", attribute: "[data-state]", value: '"active" | "inactive"' },
		{
			part: "ScrollSpy.Viewport",
			attribute: "[data-orientation]",
			value: '"horizontal" | "vertical"',
		},
		{
			part: "ScrollSpy.Section",
			attribute: "[data-orientation]",
			value: '"horizontal" | "vertical"',
		},
	];
</script>

<DocPage title="Scroll Spy">
	{#snippet subtitle()}
		Navigation links that track scroll position and scroll to their section on click, with support
		for nested sections and customizable behavior.
	{/snippet}

	<DocSection title="Default (Horizontal)">
		{#snippet blurb()}
			— the viewport is the tracked scroll container.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-stretch">
				<ScrollSpy.Root
					offset={16}
					scrollContainer={defaultContainer}
					class="h-[400px] w-full border"
				>
					<ScrollSpy.Nav aria-label="Default example sections" class="w-40 border-r p-4">
						{#each guideSections as section (section.value)}
							<ScrollSpy.Link value={`default-${section.value}`}>{section.title}</ScrollSpy.Link>
						{/each}
					</ScrollSpy.Nav>
					<ScrollSpy.Viewport bind:ref={defaultContainer} class="overflow-y-auto p-4">
						{#each guideSections as section (section.value)}
							<ScrollSpy.Section value={`default-${section.value}`}>
								<h2 class="text-2xl font-bold">{section.title}</h2>
								<p class="mt-2 text-muted-foreground">{section.body}</p>
								<div class="mt-4 h-64 rounded-lg bg-accent"></div>
							</ScrollSpy.Section>
						{/each}
					</ScrollSpy.Viewport>
				</ScrollSpy.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical Orientation">
		{#snippet blurb()}
			— the nav sits above the content.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-stretch">
				<ScrollSpy.Root
					offset={10}
					orientation="vertical"
					scrollContainer={verticalContainer}
					class="h-[400px] w-full border"
				>
					<ScrollSpy.Nav aria-label="Vertical example sections" class="border-b p-4">
						{#each featureSections as section (section.value)}
							<ScrollSpy.Link value={section.value}>{section.title}</ScrollSpy.Link>
						{/each}
					</ScrollSpy.Nav>
					<ScrollSpy.Viewport bind:ref={verticalContainer} class="overflow-y-auto p-4">
						{#each featureSections as section (section.value)}
							<ScrollSpy.Section value={section.value} class="min-w-[400px]">
								<h2 class="text-2xl font-bold">{section.title}</h2>
								<p class="mt-2 text-muted-foreground">{section.body}</p>
								<div class="mt-4 h-64 rounded-lg bg-accent"></div>
							</ScrollSpy.Section>
						{/each}
					</ScrollSpy.Viewport>
				</ScrollSpy.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled">
		{#snippet blurb()}
			— the page owns the active section.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex-col items-stretch gap-4">
				<p class="text-sm text-muted-foreground">
					Active section: <span class="font-medium text-foreground">{controlledValue}</span>
				</p>
				<ScrollSpy.Root
					offset={16}
					scrollContainer={controlledContainer}
					bind:value={controlledValue}
					class="h-[400px] w-full border"
				>
					<ScrollSpy.Nav aria-label="Controlled example sections" class="w-40 border-r p-4">
						{#each guideSections as section (section.value)}
							<ScrollSpy.Link value={`controlled-${section.value}`}>{section.title}</ScrollSpy.Link>
						{/each}
					</ScrollSpy.Nav>
					<ScrollSpy.Viewport bind:ref={controlledContainer} class="overflow-y-auto p-4">
						{#each guideSections as section (section.value)}
							<ScrollSpy.Section value={`controlled-${section.value}`}>
								<h2 class="text-2xl font-bold">{section.title}</h2>
								<p class="mt-2 text-muted-foreground">{section.body}</p>
								<div class="mt-4 h-64 rounded-lg bg-accent"></div>
							</ScrollSpy.Section>
						{/each}
					</ScrollSpy.Viewport>
				</ScrollSpy.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sticky Layout">
		{#snippet blurb()}
			Mirrors the MDX example — no scrollContainer, so the window scrolls and a sticky nav stays
			visible.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-stretch">
				<ScrollSpy.Root offset={100} class="w-full">
					<ScrollSpy.Nav
						aria-label="Sticky layout example sections"
						class="sticky top-20 h-fit w-40 shrink-0"
					>
						{#each guideSections as section (section.value)}
							<ScrollSpy.Link value={`sticky-${section.value}`}>{section.title}</ScrollSpy.Link>
						{/each}
					</ScrollSpy.Nav>
					<ScrollSpy.Viewport class="pl-4">
						{#each guideSections as section (section.value)}
							<ScrollSpy.Section value={`sticky-${section.value}`}>
								<h2 class="text-2xl font-bold">{section.title}</h2>
								<p class="mt-2 text-muted-foreground">{section.body}</p>
							</ScrollSpy.Section>
						{/each}
					</ScrollSpy.Viewport>
				</ScrollSpy.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		{#each propTables as table (table.part)}
			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium tracking-tight">{table.part}</h3>
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
								{#each table.rows as row (row.prop)}
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
		{/each}

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium tracking-tight">Data attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Part</Table.Head>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>Value</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (`${row.part}-${row.attribute}`)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.part}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.attribute}</Table.Cell>
									<Table.Cell>{row.value}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<DocSection title="Basic scrollspy">
		{#snippet blurb()}
			— the button-rail treatment: the links are outline Buttons rendered through <code>Link</code
			>'s <code>child</code> snippet, solid while their section is active.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-stretch">
				<ScrollSpy.Root offset={50} scrollContainer={basicScrollspyViewport} class="w-full gap-5">
					<ScrollSpy.Nav aria-label="Basic scrollspy sections" class="w-[150px] shrink-0 gap-2.5">
						{#each basicScrollspyNav as item (item.id)}
							<ScrollSpy.Link value={item.id}>
								{#snippet child({ props })}
									<Button
										{...asButtonProps(props)}
										variant="outline"
										class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
									>
										{item.label}
									</Button>
								{/snippet}
							</ScrollSpy.Link>
						{/each}
					</ScrollSpy.Nav>
					<div class="min-w-0 grow">
						<ScrollArea class="h-[500px]" bind:viewportRef={basicScrollspyViewport}>
							<div class="flex flex-col gap-8">
								{#each basicScrollspyNav as item (item.id)}
									<ScrollSpy.Section value={item.id} class="flex flex-col gap-2.5">
										<h3 class="text-base text-foreground">{item.label}</h3>
										<div class="h-[350px] rounded-2xl bg-muted"></div>
									</ScrollSpy.Section>
								{/each}
							</div>
						</ScrollArea>
					</div>
				</ScrollSpy.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Basic scroll area">
		{#snippet blurb()}
			— the same rail laid out horizontally above the ScrollArea.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-stretch">
				<ScrollSpy.Root
					offset={50}
					orientation="vertical"
					scrollContainer={basicScrollAreaViewport}
					class="w-full gap-5"
				>
					<ScrollSpy.Nav aria-label="Basic scroll area sections" class="flex-wrap gap-2.5">
						{#each basicScrollAreaNav as item (item.id)}
							<ScrollSpy.Link value={item.id}>
								{#snippet child({ props })}
									<Button
										{...asButtonProps(props)}
										variant="outline"
										class="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
									>
										{item.label}
									</Button>
								{/snippet}
							</ScrollSpy.Link>
						{/each}
					</ScrollSpy.Nav>
					<ScrollArea class="h-[400px] w-full" bind:viewportRef={basicScrollAreaViewport}>
						<div class="flex flex-col gap-8">
							{#each basicScrollAreaNav as item (item.id)}
								<ScrollSpy.Section value={item.id} class="flex flex-col gap-2.5">
									<h3 class="text-base text-foreground">{item.label}</h3>
									<div class="h-[350px] rounded-2xl bg-muted"></div>
								</ScrollSpy.Section>
							{/each}
						</div>
					</ScrollArea>
				</ScrollSpy.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
