<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Tour from "$lib/components/ui/tour/index.js";

	/**
	 * The Tour component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. A product tour is a whole interaction — spotlight, scrim, step
	 * card, focus management — rather than a component the classic framework could ship.
	 *
	 * Two theme decisions are worth naming. The step card is a popover, so it takes the surface
	 * ported on the Popovers page. The scrim around the spotlight uses `--scrim` — the classic theme's
	 * `offcanvas-backdrop-bg`, already the sheet's backdrop here — rather than a black of its
	 * own, so a tour dims the page exactly as much as a drawer does.
	 */

	// ── Default ──────────────────────────────────────────────────────────────────
	// Mirrors tour-demo.tsx: a four-step dashboard walkthrough sharing one footer.

	let defaultOpen = $state(false);

	const dashboardFeatures = [
		{ id: "tour-feature-1", title: "Analytics", body: "Track your performance metrics" },
		{ id: "tour-feature-2", title: "Projects", body: "Manage your active projects" },
		{ id: "tour-feature-3", title: "Team", body: "Collaborate with teammates" },
	];

	// ── Controlled ───────────────────────────────────────────────────────────────
	// Mirrors tour-controlled-demo.tsx: external Start/Prev/Next buttons drive the tour, and the
	// fourth target only exists from step index 2 onwards.

	let controlledOpen = $state(false);
	let controlledValue = $state(0);

	function startControlledTour() {
		controlledValue = 0;
		controlledOpen = true;
	}

	function endControlledTour() {
		controlledOpen = false;
		controlledValue = 0;
	}

	// ── API tables ───────────────────────────────────────────────────────────────

	const rootProps = [
		{
			prop: "open",
			type: "boolean",
			default: "—",
			description: "Whether the tour is showing. Bindable; controlled when bound or passed.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Seeds `open` once when the tour is uncontrolled.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description: "Called whenever the tour opens or closes.",
		},
		{
			prop: "value",
			type: "number",
			default: "—",
			description: "The active step index. Bindable, with the same controlled contract as `open`.",
		},
		{
			prop: "defaultValue",
			type: "number",
			default: "0",
			description: "Seeds `value` once when the tour is uncontrolled.",
		},
		{
			prop: "onValueChange",
			type: "(step: number) => void",
			default: "—",
			description: "Called with the next step index whenever the tour navigates.",
		},
		{
			prop: "onComplete",
			type: "() => void",
			default: "—",
			description:
				"Fires once when the visitor finishes the last step. Never paired with `onSkip`.",
		},
		{
			prop: "onSkip",
			type: "() => void",
			default: "—",
			description: "Fires once when the tour closes before its last step.",
		},
		{
			prop: "onEscapeKeyDown",
			type: "(event: KeyboardEvent) => void",
			default: "—",
			description: "Called on every `Escape`. `preventDefault()` keeps the tour open.",
		},
		{
			prop: "onPointerDownOutside",
			type: "(event: TourPointerDownOutsideEvent) => void",
			default: "—",
			description: "Pointer interaction outside the card and its target. Preventable.",
		},
		{
			prop: "onInteractOutside",
			type: "(event: TourInteractOutsideEvent) => void",
			default: "—",
			description: "Pointer or focus interaction outside the card and its target. Preventable.",
		},
		{
			prop: "onOpenAutoFocus",
			type: "(event: TourOpenAutoFocusEvent) => void",
			default: "—",
			description: "Called as focus moves into the card. Preventable.",
		},
		{
			prop: "onCloseAutoFocus",
			type: "(event: TourCloseAutoFocusEvent) => void",
			default: "—",
			description: "Called before focus returns to the pre-open element. Preventable.",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "resolved",
			description: 'Falls back to the nearest `DirectionProvider`, then the DOM, then `"ltr"`.',
		},
		{
			prop: "sideOffset",
			type: "number",
			default: "16",
			description: "Default main-axis gap between a card and its target.",
		},
		{
			prop: "alignOffset",
			type: "number",
			default: "0",
			description: "Default cross-axis gap between a card and its target.",
		},
		{
			prop: "spotlightPadding",
			type: "number",
			default: "4",
			description: "Pixels added on every edge of the target when computing the cut-out and ring.",
		},
		{
			prop: "autoScroll",
			type: "boolean",
			default: "true",
			description: "Whether a newly active step scrolls its target into view.",
		},
		{
			prop: "scrollBehavior",
			type: "ScrollBehavior",
			default: "reduced-motion aware",
			description: '`"auto"` under `prefers-reduced-motion: reduce`, otherwise `"smooth"`.',
		},
		{
			prop: "scrollOffset",
			type: "TourScrollOffset",
			default: "{ top: 100, bottom: 100, left: 0, right: 0 }",
			description: "Per-edge viewport insets used to decide whether a target is in view.",
		},
		{
			prop: "dismissible",
			type: "boolean",
			default: "true",
			description: "Whether `Escape` and outside interaction may close the tour.",
		},
		{
			prop: "modal",
			type: "boolean",
			default: "true",
			description: "Whether the tour locks background scrolling while open.",
		},
		{
			prop: "stepFooter",
			type: "Snippet",
			default: "—",
			description: "Fallback footer for every step that declares no `Tour.Footer` of its own.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the root onto your own element instead of the default `<div>`.",
		},
	];

	const stepProps = [
		{
			prop: "target",
			type: "string | HTMLElement",
			default: "— (required)",
			description: "The element this step spotlights: a CSS selector or an element.",
		},
		{
			prop: "side",
			type: "'top' | 'right' | 'bottom' | 'left'",
			default: "'bottom'",
			description: "Preferred side of the target. Flipped on collision.",
		},
		{
			prop: "sideOffset",
			type: "number",
			default: "root's `sideOffset`",
			description: "Main-axis gap between the card and its target.",
		},
		{
			prop: "align",
			type: "'start' | 'center' | 'end'",
			default: "'center'",
			description: "Preferred alignment against the target. Shifted on collision.",
		},
		{
			prop: "alignOffset",
			type: "number",
			default: "root's `alignOffset`",
			description: "Cross-axis offset from the `start` or `end` alignment.",
		},
		{
			prop: "collisionBoundary",
			type: "Element | null | (Element | null)[]",
			default: "[]",
			description: "Elements collision detection measures against.",
		},
		{
			prop: "collisionPadding",
			type: "number | Partial<Record<Side, number>>",
			default: "0",
			description: "Virtual padding around the boundary edges.",
		},
		{
			prop: "arrowPadding",
			type: "number",
			default: "0",
			description: "Padding between the arrow and the card’s edges.",
		},
		{
			prop: "sticky",
			type: "'partial' | 'always'",
			default: "'partial'",
			description: "Whether the card stays fully in view or may detach.",
		},
		{
			prop: "hideWhenDetached",
			type: "boolean",
			default: "false",
			description: "Hide the card, without unmounting it, once its target leaves view.",
		},
		{
			prop: "avoidCollisions",
			type: "boolean",
			default: "true",
			description: "Whether the card flips and shifts away from collisions.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "Recorded on the step and never read, exactly as upstream.",
		},
		{
			prop: "forceMount",
			type: "boolean",
			default: "false",
			description: "Render the card even when `target` resolves to nothing.",
		},
		{
			prop: "onStepEnter",
			type: "() => void",
			default: "—",
			description: "Called as this step becomes the active one.",
		},
		{
			prop: "onStepLeave",
			type: "() => void",
			default: "—",
			description: "Called as this step stops being the active one.",
		},
	];

	const overlayProps = [
		{
			prop: "forceMount",
			type: "boolean",
			default: "false",
			description:
				'Keep `Tour.Spotlight` / `Tour.SpotlightRing` mounted while the tour is closed, reporting `data-state="closed"`, so an exit transition can run. The ring still renders nothing until a cut-out has been measured.',
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description:
				"Merged last, so a custom border, glow or animation on `Tour.SpotlightRing` wins on conflict.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the backdrop or ring onto your own element.",
		},
	];

	const arrowProps = [
		{ prop: "width", type: "number", default: "10", description: "Arrow width in pixels." },
		{ prop: "height", type: "number", default: "5", description: "Arrow height in pixels." },
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the arrow onto your own element. Must be inside a `Tour.Step`.",
		},
	];

	const controlProps = [
		{
			prop: "format",
			type: "(current: number, total: number) => string",
			default: "`${current} / ${total}`",
			description: "`Tour.StepCounter` only. `children` overrides the formatted text entirely.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "'outline' | 'default'",
			description:
				'`Tour.Prev` and `Tour.Skip` default to `"outline"`, `Tour.Next` to `"default"`.',
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'default'",
			description: "Forwarded to `buttonVariants()` on `Tour.Prev` / `Tour.Next` / `Tour.Skip`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Replaces the control’s default content, keeping its behaviour.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Renders the control onto your own element, merged props included.",
		},
	];

	const propTables = [
		{ part: "Tour.Root", rows: rootProps },
		{ part: "Tour.Step", rows: stepProps },
		{ part: "Tour.Spotlight / Tour.SpotlightRing", rows: overlayProps },
		{ part: "Tour.Arrow", rows: arrowProps },
		{
			part: "Tour.StepCounter / Tour.Close / Tour.Prev / Tour.Next / Tour.Skip",
			rows: controlProps,
		},
	];

	const dataAttributes = [
		{ part: "Root", attribute: "data-slot", value: '"tour"' },
		{ part: "Spotlight", attribute: "data-state", value: '"open" | "closed"' },
		{ part: "SpotlightRing", attribute: "data-state", value: '"open" | "closed"' },
		{ part: "Step", attribute: "data-side", value: '"top" | "right" | "bottom" | "left"' },
		{ part: "Step", attribute: "data-align", value: '"start" | "center" | "end"' },
		{ part: "Every part", attribute: "dir", value: '"ltr" | "rtl"' },
	];

	const keyboardShortcuts = [
		{
			keys: "Escape",
			description:
				"Fires `onEscapeKeyDown`, then closes the tour unless prevented or `dismissible={false}`.",
		},
		{
			keys: "Tab",
			description: "Moves to the next control inside the step card, wrapping at the end.",
		},
		{
			keys: "Shift + Tab",
			description: "Moves to the previous control inside the step card, wrapping at the start.",
		},
		{
			keys: "Enter",
			description: "Activates the focused control (Next, Previous, Skip or Close).",
		},
		{ keys: "Space", description: "Activates the focused control." },
	];
</script>

<DocPage title="Tour">
	{#snippet subtitle()}
		A guided tour component that highlights elements and provides step-by-step instructions to help
		users learn about your application.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			— a four-step dashboard walkthrough with one shared footer, a spotlight backdrop, a ring and
			an arrow from the second step on.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-8 p-4">
					<div class="flex flex-col items-center gap-4">
						<div class="flex flex-col items-center gap-1">
							<h2 id="tour-welcome-title" class="text-2xl font-bold">Welcome to Your Dashboard</h2>
							<p class="text-center text-muted-foreground">
								Take a quick tour to explore key features
							</p>
						</div>
						<Button id="tour-start-btn" onclick={() => (defaultOpen = true)}>Start Tour</Button>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
						{#each dashboardFeatures as feature (feature.id)}
							<div id={feature.id} class="rounded-lg border p-4 text-center">
								<h3 class="font-semibold">{feature.title}</h3>
								<p class="text-sm text-muted-foreground">{feature.body}</p>
							</div>
						{/each}
					</div>

					<Tour.Root bind:open={defaultOpen} stepFooter={sharedFooter}>
						<Tour.Portal>
							<Tour.Spotlight />
							<Tour.SpotlightRing class="rounded-lg" />

							<Tour.Step target="#tour-welcome-title" side="bottom" align="center">
								<Tour.Close />
								<Tour.Header>
									<Tour.Title>Welcome!</Tour.Title>
									<Tour.Description>
										Let's walk through the main features of your dashboard in just a few steps.
									</Tour.Description>
								</Tour.Header>
							</Tour.Step>

							<Tour.Step target="#tour-feature-1" side="top" align="center">
								<Tour.Arrow />
								<Tour.Close />
								<Tour.Header>
									<Tour.Title>Analytics Dashboard</Tour.Title>
									<Tour.Description>
										View real-time insights, track KPIs, and monitor your team's progress with
										interactive charts.
									</Tour.Description>
								</Tour.Header>
							</Tour.Step>

							<Tour.Step target="#tour-feature-2" side="top" align="center">
								<Tour.Arrow />
								<Tour.Close />
								<Tour.Header>
									<Tour.Title>Project Management</Tour.Title>
									<Tour.Description>
										Create, organize, and track projects with powerful tools for task management and
										deadlines.
									</Tour.Description>
								</Tour.Header>
							</Tour.Step>

							<Tour.Step target="#tour-feature-3" side="top" align="center" required>
								<Tour.Arrow />
								<Tour.Close />
								<Tour.Header>
									<Tour.Title>Team Collaboration</Tour.Title>
									<Tour.Description>
										Invite members, assign roles, and collaborate seamlessly. This step is required
										to continue.
									</Tour.Description>
								</Tour.Header>
							</Tour.Step>
						</Tour.Portal>
					</Tour.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled">
		{#snippet blurb()}
			— external Start / Prev / Next buttons own the state, a fourth target only appears once the
			tour reaches step 3, and the parts render inline without a portal.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-8 p-4">
					<div class="flex flex-col items-center gap-4">
						<h2 id="tour-controlled-title" class="text-2xl font-bold">Controlled Tour</h2>
						<div class="flex items-center gap-2">
							<Button id="tour-controlled-start-btn" onclick={startControlledTour}>Start</Button>
							<Button
								variant="outline"
								disabled={!controlledOpen || controlledValue === 0}
								onclick={() => (controlledValue = Math.max(0, controlledValue - 1))}
							>
								Prev
							</Button>
							<Button
								variant="outline"
								disabled={!controlledOpen || controlledValue === 3}
								onclick={() => (controlledValue = Math.min(3, controlledValue + 1))}
							>
								Next
							</Button>
						</div>
					</div>

					<div class="flex w-full flex-col gap-6">
						<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div id="tour-controlled-step-1" class="rounded-lg border p-6 text-center">
								<h3 class="font-semibold">Step 1</h3>
								<p class="text-sm text-muted-foreground">First step in our controlled tour</p>
							</div>
							<div id="tour-controlled-step-2" class="rounded-lg border p-6 text-center">
								<h3 class="font-semibold">Step 2</h3>
								<p class="text-sm text-muted-foreground">Second step with external controls</p>
							</div>
						</div>

						{#if controlledOpen && controlledValue >= 2}
							<div
								id="tour-controlled-step-3"
								class="rounded-lg border border-primary/50 bg-primary/5 p-6 text-center"
							>
								<h3 class="font-semibold">Step 3</h3>
								<p class="text-sm text-muted-foreground">Dynamic step that appears after step 2</p>
							</div>
						{/if}
					</div>

					<Tour.Root
						bind:open={controlledOpen}
						bind:value={controlledValue}
						onComplete={endControlledTour}
						onSkip={endControlledTour}
						sideOffset={16}
						alignOffset={0}
						stepFooter={sharedFooter}
					>
						<Tour.Spotlight />
						<Tour.SpotlightRing class="rounded-lg ring-2 ring-primary/50 ring-offset-2" />

						<Tour.Step target="#tour-controlled-title" side="bottom" align="center">
							<Tour.Arrow />
							<Tour.Close />
							<Tour.Header>
								<Tour.Title>Controlled Tour</Tour.Title>
								<Tour.Description>
									This tour's state is controlled externally. Notice how the step counter updates.
								</Tour.Description>
							</Tour.Header>
						</Tour.Step>

						<Tour.Step target="#tour-controlled-step-1" side="top" align="center">
							<Tour.Arrow />
							<Tour.Close />
							<Tour.Header>
								<Tour.Title>External Controls</Tour.Title>
								<Tour.Description>
									You can control this tour using the external buttons above, or use the built-in
									navigation.
								</Tour.Description>
							</Tour.Header>
						</Tour.Step>

						<!-- Overrides the root's default gap, the "Global Offset Control" example from the MDX. -->
						<Tour.Step target="#tour-controlled-step-2" side="top" align="center" sideOffset={32}>
							<Tour.Arrow />
							<Tour.Close />
							<Tour.Header>
								<Tour.Title>Second Feature</Tour.Title>
								<Tour.Description>
									The tour state is fully controlled by the parent component. Watch what happens
									next!
								</Tour.Description>
							</Tour.Header>
						</Tour.Step>

						<Tour.Step target="#tour-controlled-step-3" side="top" align="center">
							<Tour.Arrow />
							<Tour.Close />
							<Tour.Header>
								<Tour.Title>Dynamic Layout</Tour.Title>
								<Tour.Description>
									This element appeared when you reached this step, demonstrating how the tour
									handles dynamic content and layout shifts.
								</Tour.Description>
							</Tour.Header>
						</Tour.Step>
					</Tour.Root>
				</div>
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
										<Table.Cell class="font-mono text-xs">{row.type}</Table.Cell>
										<Table.Cell class="font-mono text-xs">{row.default}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{row.description}</Table.Cell>
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
									<Table.Cell class="font-mono text-xs">{row.attribute}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.value}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium tracking-tight">Keyboard interactions</h3>
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
							{#each keyboardShortcuts as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-mono text-xs">{row.keys}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>

<!-- One footer shared by every step of both examples, exactly as both upstream demos do. -->
{#snippet sharedFooter()}
	<Tour.Footer>
		<div class="flex w-full items-center justify-between">
			<Tour.StepCounter />
			<div class="flex gap-2">
				<Tour.Prev />
				<Tour.Next />
			</div>
		</div>
	</Tour.Footer>
{/snippet}
