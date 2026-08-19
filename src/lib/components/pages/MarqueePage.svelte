<script lang="ts">
	import AtomIcon from "@lucide/svelte/icons/atom";
	import CodeIcon from "@lucide/svelte/icons/code";
	import ComponentIcon from "@lucide/svelte/icons/component";
	import FileCodeIcon from "@lucide/svelte/icons/file-code";
	import TriangleIcon from "@lucide/svelte/icons/triangle";
	import WindIcon from "@lucide/svelte/icons/wind";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { DirectionProvider } from "$lib/components/ui/direction-provider/index.js";
	import * as Marquee from "$lib/components/ui/marquee/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { MARQUEE_LOGO_PLATES } from "./marquee-logo-plates.js";

	/**
	 * The Marquee component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. This is the one component in the batch that needed something
	 * added to `app.css`: its six animations live in a `@theme inline` block there, and the
	 * `inline` is load-bearing — the comment beside them explains why a plain `@theme` produces a
	 * marquee that renders and never moves.
	 *
	 * Nothing else was needed. The keyframes are pure geometry, and the content is whatever the
	 * caller puts in it.
	 */

	const tricks = [
		{
			title: "Kickflip",
			description:
				"A kickflip is a trick where you kick the board forward while jumping, and then land on the board with the other foot.",
		},
		{
			title: "Heelflip",
			description:
				"A heelflip is a trick where you flip the board backwards while jumping, and then land on the board with the other foot.",
		},
		{
			title: "Tre Flip",
			description:
				"A tre flip is a trick where you flip the board sideways while jumping, and then land on the board with the other foot.",
		},
		{
			title: "FS 540",
			description:
				"A fs 540 is a trick where you flip the board 540 degrees while jumping, and then land on the board with the other foot.",
		},
		{
			title: "360 Varial McTwist",
			description:
				"A 360 varial mc twist is a trick where you flip the board 360 degrees while jumping, and then land on the board with the other foot.",
		},
	];

	// Upstream inlines six brand SVGs with hard-coded hex fills; semantic tokens only are allowed
	// here, so the same "auto-fill with small uniform items" capability is shown with Lucide glyphs
	// and the brand name kept in an `sr-only` span (divergence D-07).
	const companies = [
		{ name: "Vercel", icon: TriangleIcon },
		{ name: "Next.js", icon: ComponentIcon },
		{ name: "React", icon: AtomIcon },
		{ name: "TypeScript", icon: FileCodeIcon },
		{ name: "Tailwind", icon: WindIcon },
		{ name: "GitHub", icon: CodeIcon },
	];

	const testimonials = [
		{
			name: "Alex Johnson",
			role: "Frontend Developer",
			company: "TechCorp",
			content:
				"This component library has transformed our development workflow. The quality and attention to detail is outstanding.",
			avatar: "AJ",
		},
		{
			name: "Sarah Chen",
			role: "Design Lead",
			company: "StartupXYZ",
			content:
				"Beautiful components that are easy to customize. Our design system has never looked better.",
			avatar: "SC",
		},
		{
			name: "Michael Rodriguez",
			role: "Full Stack Engineer",
			company: "WebSolutions",
			content:
				"The accessibility features built into these components saved us weeks of development time.",
			avatar: "MR",
		},
		{
			name: "Emily Davis",
			role: "Product Manager",
			company: "InnovateLab",
			content:
				"Our team productivity increased significantly after adopting this component library.",
			avatar: "ED",
		},
		{
			name: "David Kim",
			role: "Senior Developer",
			company: "CodeCraft",
			content: "Clean, modern components with excellent TypeScript support. Highly recommended!",
			avatar: "DK",
		},
		{
			name: "Lisa Thompson",
			role: "UI/UX Designer",
			company: "DesignStudio",
			content:
				"The design tokens and theming system make it incredibly easy to maintain brand consistency.",
			avatar: "LT",
		},
	];

	const features = [
		{
			title: "RTL Support",
			description:
				"Automatic right-to-left layout support with proper animation direction and gap handling.",
		},
		{
			title: "Smooth Animation",
			description:
				"Seamless scrolling animation that adapts to text direction without any visual gaps.",
		},
		{
			title: "Auto Fill",
			description:
				"Intelligent content duplication to fill the available space for continuous scrolling.",
		},
		{
			title: "Pause on Hover",
			description:
				"Interactive animation that pauses when users hover over the content for better UX.",
		},
		{
			title: "Responsive Design",
			description:
				"Fully responsive component that works perfectly across all device sizes and orientations.",
		},
	];

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<div>`. Stays `null` in `child` mode.",
		},
		{
			prop: "side",
			type: '"left" | "right" | "top" | "bottom"',
			default: '"left"',
			description: "The direction of the marquee animation. `top`/`bottom` scroll vertically.",
		},
		{
			prop: "dir",
			type: '"ltr" | "rtl"',
			default: "_resolved_",
			description:
				'Explicit text direction. Falls back to the nearest `<DirectionProvider>`, then an ancestor `[dir]`, then `"ltr"`.',
		},
		{
			prop: "speed",
			type: "number",
			default: "50",
			description: "The speed of the animation in pixels per second. Floored at 0.001.",
		},
		{
			prop: "delay",
			type: "number",
			default: "0",
			description: "Seconds to wait before the animation starts.",
		},
		{
			prop: "loopCount",
			type: "number",
			default: "0",
			description: "0 or Infinity loop forever; any other positive number loops that many times.",
		},
		{
			prop: "gap",
			type: "string | number",
			default: '"1rem"',
			description: "Gap between items and between repetitions. A number is treated as pixels.",
		},
		{
			prop: "autoFill",
			type: "boolean",
			default: "false",
			description: "Duplicate the content until it fills the container along the scroll axis.",
		},
		{
			prop: "pauseOnHover",
			type: "boolean",
			default: "false",
			description: "Pause on pointer hover, and while focus is inside the marquee.",
		},
		{
			prop: "pauseOnKeyboard",
			type: "boolean",
			default: "true",
			description: "Make the marquee focusable and pausable with the Space key.",
		},
		{
			prop: "reverse",
			type: "boolean",
			default: "false",
			description: "Reverse the animation direction, on top of the side-derived direction.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last, so it always overrides the component classes.",
		},
		{
			prop: "style",
			type: "string",
			default: "—",
			description: "Appended after the four `--marquee-*` custom properties.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the root onto your own element. Replaces upstream `asChild`.",
		},
	];

	const contentProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the inner measured track, not the animated wrapper.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last onto both the announced track and the decorative clone.",
		},
		{
			prop: "style",
			type: "string",
			default: "—",
			description: "Declared before the four `animation-*` longhands.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Rendered `2 × multiplier` times in total, so the loop has no seam.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the announced track onto your own element. The clone still renders.",
		},
	];

	const itemProps = [
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
			description: "Merged after the base `shrink-0`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the item onto your own element. Reads no context, so it works anywhere.",
		},
	];

	const edgeProps = [
		{
			prop: "side",
			type: '"left" | "right" | "top" | "bottom"',
			default: "_required_",
			description: "Which edge the gradient is anchored to.",
		},
		{
			prop: "size",
			type: '"sm" | "default" | "lg"',
			default: '"default"',
			description: "1/6, 1/4 or 1/3 of the container along the axis implied by `side`.",
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
			description: "Render the edge onto your own element.",
		},
	];

	const dataAttributes = [
		{
			part: "Marquee.Root",
			attribute: "[data-orientation]",
			value: '"horizontal" | "vertical"',
		},
		{
			part: "Marquee.Root",
			attribute: "[data-side]",
			value: '"left" | "right" | "top" | "bottom"',
		},
		{ part: "Marquee.Root", attribute: "[data-paused]", value: "Present while paused" },
		{
			part: "Marquee.Root",
			attribute: "[data-pause-on-hover]",
			value: "Present when `pauseOnHover`",
		},
		{
			part: "Marquee.Content",
			attribute: "[data-orientation]",
			value: '"horizontal" | "vertical"',
		},
		{ part: "Marquee.Content", attribute: "[data-clone]", value: "Present on the decorative copy" },
		{ part: "Marquee.Edge", attribute: "[data-size]", value: '"default" | "sm" | "lg"' },
		{
			part: "Marquee.Edge",
			attribute: "[data-side]",
			value: '"left" | "right" | "top" | "bottom"',
		},
	];

	const cssVariables = [
		{
			variable: "--marquee-duration",
			default: "Calculated dynamically (e.g. 20s)",
			description:
				"The duration of the marquee animation in seconds. Calculated from content size and speed.",
		},
		{
			variable: "--marquee-gap",
			default: "1rem",
			description: "The gap between marquee items and repetitions.",
		},
		{
			variable: "--marquee-delay",
			default: "0s",
			description: "The delay before the marquee animation starts in seconds.",
		},
		{
			variable: "--marquee-loop-count",
			default: "infinite",
			description: "The number of times the animation repeats. A number or 'infinite'.",
		},
	];
</script>

<DocPage title="Marquee">
	{#snippet subtitle()}
		An animated scrolling component that continuously moves content horizontally or vertically, with
		hover and keyboard pausing, RTL mirroring and reduced-motion support.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<Marquee.Root aria-label="Skateboard tricks showcase" pauseOnHover pauseOnKeyboard>
					<Marquee.Content>
						{#each tricks as trick (trick.title)}
							<Marquee.Item>
								{#snippet child({ props })}
									<div
										{...props}
										class="flex w-[260px] flex-col gap-1 rounded-md border bg-card p-4 text-card-foreground shadow-sm"
									>
										<div class="text-sm leading-tight font-medium sm:text-base">{trick.title}</div>
										<span class="line-clamp-2 text-sm text-muted-foreground"
											>{trick.description}</span
										>
									</div>
								{/snippet}
							</Marquee.Item>
						{/each}
					</Marquee.Content>
					<Marquee.Edge side="left" />
					<Marquee.Edge side="right" />
				</Marquee.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Logo Showcase">
		<Card.Root>
			<Card.Content>
				<Marquee.Root autoFill>
					<Marquee.Content>
						{#each companies as company (company.name)}
							{@const Icon = company.icon}
							<Marquee.Item>
								<div class="flex size-16 items-center justify-center rounded-full bg-accent">
									<Icon class="size-6" aria-hidden="true" />
									<span class="sr-only">{company.name}</span>
								</div>
							</Marquee.Item>
						{/each}
					</Marquee.Content>
					<Marquee.Edge side="left" />
					<Marquee.Edge side="right" />
				</Marquee.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Wide Plates">
		{#snippet blurb()}
			The same auto-filled row, but with wide logo plates instead of the square tiles above. A wide
			aspect changes what holds the row together: each plate is only as wide as the wordmark it
			carries, so no two are the same size and nothing lines up on a grid. What is left doing the
			work is the <code>gap</code> — 3rem here, wide enough that two neighbours never read as one logo
			— and the vertical centring, without which the two short stacked plates would hang from the top
			of the row instead of sharing its middle. The brands are invented and the marks are drawn, so the
			row borrows neither a trademark nor a network request. Each mark keeps its own colour while the
			wordmarks answer to the theme, which is the division a real logo wall has to make too.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Marquee.Root aria-label="Customer logos" autoFill gap="3rem" pauseOnHover>
					<Marquee.Content>
						{#each MARQUEE_LOGO_PLATES as plate (plate.name)}
							<!-- The centring sits on the item rather than on the track: `marquee-content.svelte`
							     nests the first copy of the items inside the wrapper it measures and renders the
							     remaining copies beside it, so an `items-center` on the track would reach the two
							     sets differently and leave only the first copy hanging from the top. -->
							<Marquee.Item class="flex items-center">
								<!--
									The mark is a coloured image and the wordmark is DOM text, which is what lets
									the first keep a brand hue on every palette while the second still answers to
									`--foreground`. `marquee-logo-plates.ts` argues the split.

									`alt=""` because the wordmark beside it already names the brand — a second
									announcement of "Orbitwise" would be noise, so the mark is decorative here even
									though it would not be on its own.
								-->
								<div
									class="flex items-center gap-2.5"
									class:flex-col={plate.stacked}
									class:gap-2={plate.stacked}
								>
									<img
										src={plate.src}
										alt=""
										width={plate.markSize}
										height={plate.markSize}
										class="shrink-0"
									/>
									<span
										class="font-semibold whitespace-nowrap text-foreground"
										class:text-xl={!plate.stacked}
										class:text-base={plate.stacked}
									>
										{plate.name}
									</span>
								</div>
							</Marquee.Item>
						{/each}
					</Marquee.Content>
					<Marquee.Edge side="left" />
					<Marquee.Edge side="right" />
				</Marquee.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical Layout">
		<Card.Root>
			<Card.Content class="h-[400px]">
				<Marquee.Root side="bottom" class="h-[320px] max-w-sm">
					<Marquee.Content>
						{#each testimonials as testimonial (testimonial.name)}
							<Marquee.Item>
								{#snippet child({ props })}
									<div
										{...props}
										class="flex w-full flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
									>
										<div class="flex items-center gap-3">
											<div
												class="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
											>
												{testimonial.avatar}
											</div>
											<div class="flex flex-col">
												<div class="text-sm font-medium">{testimonial.name}</div>
												<div class="text-xs text-muted-foreground">
													{testimonial.role} at {testimonial.company}
												</div>
											</div>
										</div>
										<p class="text-sm leading-relaxed text-muted-foreground">
											"{testimonial.content}"
										</p>
									</div>
								{/snippet}
							</Marquee.Item>
						{/each}
					</Marquee.Content>
					<Marquee.Edge side="top" />
					<Marquee.Edge side="bottom" />
				</Marquee.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With RTL">
		{#snippet blurb()}
			— once with an explicit dir prop, once resolving the ambient direction from a
			DirectionProvider.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full flex-col gap-6">
					<Marquee.Root dir="rtl">
						<Marquee.Content>
							{#each features as feature (feature.title)}
								<Marquee.Item>
									{#snippet child({ props })}
										<div
											{...props}
											class="flex w-[280px] flex-col gap-1 rounded-md border bg-card p-4 text-card-foreground shadow-sm"
										>
											<div class="text-sm leading-tight font-medium sm:text-base">
												{feature.title}
											</div>
											<span class="line-clamp-2 text-sm text-muted-foreground">
												{feature.description}
											</span>
										</div>
									{/snippet}
								</Marquee.Item>
							{/each}
						</Marquee.Content>
						<Marquee.Edge side="left" />
						<Marquee.Edge side="right" />
					</Marquee.Root>

					<DirectionProvider dir="rtl">
						<Marquee.Root side="right">
							<Marquee.Content>
								{#each features as feature (feature.title)}
									<Marquee.Item>
										{#snippet child({ props })}
											<div
												{...props}
												class="flex w-[280px] flex-col gap-1 rounded-md border bg-card p-4 text-card-foreground shadow-sm"
											>
												<div class="text-sm leading-tight font-medium sm:text-base">
													{feature.title}
												</div>
												<span class="line-clamp-2 text-sm text-muted-foreground">
													{feature.description}
												</span>
											</div>
										{/snippet}
									</Marquee.Item>
								{/each}
							</Marquee.Content>
							<Marquee.Edge side="left" />
							<Marquee.Edge side="right" />
						</Marquee.Root>
					</DirectionProvider>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Marquee (Root)</h3>
			<p class="text-sm text-muted-foreground">
				The container that publishes the four <code>--marquee-*</code> custom properties, resolves the
				direction and owns the keyboard pause state.
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
			<h3 class="text-base font-medium">Marquee.Content</h3>
			<p class="text-sm text-muted-foreground">
				The scrolling track. Renders an announced copy and an <code>aria-hidden</code> clone so the loop
				is seamless without announcing the content twice.
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
			<h3 class="text-base font-medium">Marquee.Item</h3>
			<p class="text-sm text-muted-foreground">
				A single piece of content inside the track. Reads no context, so it also works as a plain
				<code>shrink-0</code> wrapper.
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
							{#each itemProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Marquee.Edge</h3>
			<p class="text-sm text-muted-foreground">
				A decorative gradient overlay anchored to one edge, hidden from assistive technology and
				never receiving pointer events.
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
							{#each edgeProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Data Attributes</h3>
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
							{#each dataAttributes as row (row.part + row.attribute)}
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

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CSS Variables</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Variable</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each cssVariables as row (row.variable)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.variable}</Table.Cell>
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
			<h3 class="text-base font-medium">Keyboard Interactions</h3>
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
								<Table.Cell class="font-medium">Space</Table.Cell>
								<Table.Cell>
									Pauses or resumes the marquee animation when <code>pauseOnKeyboard</code> is enabled.
								</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell class="font-medium">Tab</Table.Cell>
								<Table.Cell>
									Moves focus onto the marquee when <code>pauseOnKeyboard</code> is enabled, which
									also pauses it while <code>pauseOnHover</code> is set.
								</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
