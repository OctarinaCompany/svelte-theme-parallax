<script lang="ts">
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";

	import * as Card from "$lib/components/ui/card/index.js";
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Frame component page, one section per upstream demo in the demos' order.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The reference theme notes have no frame surface at all, and the
	 * theme's nearest arrangement — a `.card` wrapping a `.list-group` — shares none of the
	 * chrome that makes a frame a frame: the recessed tray the panels sit in, the concentric
	 * inner radius, the collapsing borders of a stacked run. The component is therefore its
	 * own, ported into `$lib/components/ui/frame/`, and reaches the classic look only through
	 * the tokens in `src/app.css` (`--color-muted`, `--color-card`, `--color-border`, and the
	 * radius scale the `--frame-radius` demos below step through).
	 *
	 * WHAT THIS PAGE HAS TO MAKE VISIBLE. Frame carries no state: every part coordinates through
	 * the CSS custom properties the root publishes (`--frame-radius`, `--frame-panel-*`), so a
	 * reader who cannot see which knob moved cannot use it. The demos cover the six parts
	 * (`Root`, `Header`, `Title`, `Description`, `Panel`, `Footer`), the `stacked` and `dense`
	 * booleans, `variant="ghost"`, all four `spacing` steps and five `--frame-radius` overrides.
	 * The one thing they never show is `variant="inverse"`, which upstream demoes nowhere either;
	 * it swaps the contrast — shell on `--background`, panels on a 40% `--muted` mix — and the
	 * subtitle points at it so the variant is at least named.
	 *
	 * FOUR DIVERGENCES:
	 *
	 * 1. `c-frame-8` IS NOT PORTED. Its meta title is byte-identical to `c-frame-3`'s ("Frame
	 *    with stacked panels") and it shows the same stacked run with a third panel and
	 *    different copy — two sections under one heading, illustrating one thing twice.
	 *
	 * 2. THE `lg` AND `default` RADIUS DEMOS ARE THE SAME FRAME HERE. `c-frame-15` asks for
	 *    `--radius-lg` and `c-frame-16` for the frame's own default, `--radius-xl`; `src/app.css`
	 *    holds both at 0.5rem on purpose — the classic theme has nothing between the card radius and the
	 *    one below it. Both sections stay, because the ladder is only readable as a whole, and
	 *    each says so.
	 *
	 * 3. PANEL HEADINGS ARE `h3`, NOT `h2`. Upstream writes `<h2 class="text-sm font-semibold">`
	 *    inside a panel; on this page the DocSection title is already the `h2`, so a panel
	 *    heading is one level down. The type is unchanged.
	 *
	 * 4. THE COLLAPSIBLE CARET IS LUCIDE'S. demo 5 renders an `IconPlaceholder`, which
	 *    resolves to one glyph per icon set it supports; this repository draws Lucide, so the
	 *    caret is `chevron-right` — the same drawing the placeholder names first.
	 */

	/**
	 * `c-frame-5` mounts its collapsible `defaultOpen`. bits-ui's `open` is bindable rather than
	 * defaulted, so the initial state is state here — otherwise the panel could not be closed
	 * again.
	 */
	let collapsiblePanelOpen = $state(true);

	/**
	 * The component's own surface, for the API reference at the foot of the page.
	 *
	 * Frame is a house component with no upstream page to defer to, so the props are written
	 * down here — read off the six files in `$lib/components/ui/frame/`, which are the only
	 * other place they exist.
	 */
	const frameRootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Stays `null` in `child` mode.",
		},
		{
			prop: "variant",
			type: "'default' | 'inverse' | 'ghost'",
			default: "'default'",
			description:
				"Chrome on the shell. `inverse` swaps the shell and panel grounds; `ghost` drops the shell border, and the panel radius grows to match.",
		},
		{
			prop: "spacing",
			type: "'xs' | 'sm' | 'default' | 'lg'",
			default: "'default'",
			description:
				"The padding ladder every panel body, header and footer inside this frame reads. A container density ramp, deliberately not the `--control-h-*` control ramp.",
		},
		{
			prop: "stacked",
			type: "boolean",
			default: "false",
			description:
				"Fuse adjacent panels into one segmented block: shared borders collapse and the inner corners square off.",
		},
		{
			prop: "dense",
			type: "boolean",
			default: "false",
			description:
				"Drop the frame's own padding and pull the panels flush to its edge, so their corners align with the frame radius instead of nesting inside it.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the part's own classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The part's content.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description:
				"Render the part onto your own element and spread the merged props onto it. `children` is not rendered in this mode.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes",
			default: "—",
			description: "Spread onto the element, so `id`, `aria-*` and event handlers pass through.",
		},
	];

	const framePanelProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Stays `null` in `child` mode.",
		},
		{
			prop: "fit",
			type: "boolean",
			default: "false",
			description: "Size the panel to its content. Left off, the panel grows to fill the frame.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the part's own classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The part's content.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description:
				"Render the part onto your own element and spread the merged props onto it. `children` is not rendered in this mode.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes",
			default: "—",
			description: "Spread onto the element, so `id`, `aria-*` and event handlers pass through.",
		},
	];

	const frameSlotProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Stays `null` in `child` mode.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the part's own classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The part's content.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description:
				"Render the part onto your own element and spread the merged props onto it. `children` is not rendered in this mode.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes",
			default: "—",
			description: "Spread onto the element, so `id`, `aria-*` and event handlers pass through.",
		},
	];

	const frameVariables = [
		{
			name: "--frame-radius",
			default: "--radius-xl",
			description: "The shell's corner.",
		},
		{
			name: "--frame-gap",
			default: "3px",
			description: "The gap between separated panels.",
		},
		{
			name: "--frame-px / --frame-py",
			default: "3px",
			description: "The shell's own padding around the panels.",
		},
		{
			name: "--frame-panel-radius",
			default: "derived",
			description:
				"The panel corner, computed from the shell radius minus the padding and the border so the two curves stay concentric.",
		},
		{
			name: "--frame-panel-bg",
			default: "set by variant",
			description: "The panel ground. `inverse` is the one variant that changes it.",
		},
		{
			name: "--frame-panel-px-base and friends",
			default: "set by spacing",
			description:
				"The body, header and footer padding the spacing ladder writes; every part reads them rather than declaring its own.",
		},
	];
</script>

<DocPage title="Frame">
	{#snippet subtitle()}
		A presentational panel family: a bordered tray whose header, panels and footer share one spacing
		ladder and one radius, and whose panels can be separated, fused into a stacked run or pulled
		flush to the edge. Beyond the demos below the shell also takes
		<code class="text-[87.5%] text-primary">variant="inverse"</code>, which swaps the shell and
		panel grounds.
	{/snippet}

	<DocSection title="Basic frame">
		{#snippet blurb()}
			Every part in one frame. The header and footer sit on the shell itself — they are chrome, not
			content — and only the panel gets a surface of its own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 1 -->
				<Frame.Root class="w-full">
					<Frame.Header>
						<Frame.Title>Section header</Frame.Title>
						<Frame.Description>Description for the section</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Section title</h3>
						<p class="text-sm text-muted-foreground">Section description</p>
					</Frame.Panel>
					<Frame.Footer>
						<p class="text-sm text-muted-foreground">Section footer</p>
					</Frame.Footer>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with separated panels">
		{#snippet blurb()}
			The default run: each panel keeps its own border and radius, and the shell's ground shows
			between them.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 2 -->
				<Frame.Root class="w-full">
					<Frame.Header>
						<Frame.Title>Section header</Frame.Title>
						<Frame.Description>Description for the section</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Separated panel</h3>
						<p class="text-sm text-muted-foreground">Section description</p>
					</Frame.Panel>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Separated panel</h3>
						<p class="text-sm text-muted-foreground">Section description</p>
					</Frame.Panel>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with stacked panels">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">stacked</code> fuses adjacent panels: the gap closes, the
			shared border collapses to one line and the facing corners square off, so the run reads as a single
			segmented block.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 3 -->
				<Frame.Root stacked class="w-full">
					<Frame.Header>
						<Frame.Title>Section header</Frame.Title>
						<Frame.Description>Description for the section</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Stacked panel</h3>
						<p class="text-sm text-muted-foreground">Section description</p>
					</Frame.Panel>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Stacked panel</h3>
						<p class="text-sm text-muted-foreground">Section description</p>
					</Frame.Panel>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with stacked panels and dense style">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">dense</code> on top of
			<code class="text-[87.5%] text-primary">stacked</code>: the shell loses its own padding and
			the panels are pulled flush to its edge, so the outer corner is the frame's radius rather than
			a panel corner nested inside it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 4 -->
				<Frame.Root stacked dense class="w-full">
					<Frame.Header>
						<Frame.Title>Section header</Frame.Title>
						<Frame.Description>Description for the section</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Stacked panel</h3>
						<p class="text-sm text-muted-foreground">Section description</p>
					</Frame.Panel>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Stacked panel</h3>
						<p class="text-sm text-muted-foreground">Section description</p>
					</Frame.Panel>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with collapsible panels">
		{#snippet blurb()}
			The header doubles as the collapsible's trigger, so the whole bar is the hit area and the
			panel it opens is the frame's own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 5. The collapsible wraps header and panel together, which is what keeps
					`stacked` honest: the header is chrome either way, and the panel is the only thing
					that leaves the flow when it closes.

					`group/collapsible` reads the root's `data-state` — bits-ui puts it on the root, the
					trigger and the content alike — so the caret can turn without knowing about the
					state variable.
				-->
				<Frame.Root stacked class="w-full">
					<Collapsible.Root bind:open={collapsiblePanelOpen} class="group/collapsible">
						<Collapsible.Trigger class="w-full">
							<Frame.Header class="flex grow flex-row items-center justify-between gap-2">
								<Frame.Title>Start</Frame.Title>
								<ChevronRightIcon
									class="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
								/>
							</Frame.Header>
						</Collapsible.Trigger>
						<Collapsible.Content>
							<Frame.Panel>
								<p class="text-sm text-muted-foreground">
									Initialize run to answer a user question using uploaded files and the knowledge
									base; cite sources when relevant.
								</p>
							</Frame.Panel>
						</Collapsible.Content>
					</Collapsible.Root>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with ghost (no outer border) variant">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">ghost</code> drops the shell's border and keeps its ground,
			so the tray reads as a tint behind the panels. The panel radius follows: with no border to inset
			past, it is the frame radius less the padding alone.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 6 -->
				<Frame.Root variant="ghost" class="w-full">
					<Frame.Header>
						<Frame.Title>No Outer Border</Frame.Title>
						<Frame.Description>
							This frame uses variant="ghost" to remove the outer border.
						</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<p class="text-sm text-muted-foreground">
							The outer container of this frame has no border, only the background and panels are
							visible.
						</p>
					</Frame.Panel>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with dense layout">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">dense</code> without
			<code class="text-[87.5%] text-primary">stacked</code>: the shell keeps its border but none of
			its padding, so a single panel fills it edge to edge and the tray disappears behind it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 7 -->
				<Frame.Root dense class="w-full max-w-sm">
					<Frame.Header>
						<Frame.Title>Inventory Check</Frame.Title>
						<Frame.Description>Real-time stock monitoring</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Warehouse A</h3>
						<p class="text-sm text-muted-foreground">
							Dense mode removes outer padding for a more compact appearance.
						</p>
					</Frame.Panel>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with extra small spacing">
		{#snippet blurb()}
			First step of the spacing ladder. <code class="text-[87.5%] text-primary">spacing</code> is a padding
			density for panel bodies, headers and footers — not a control size, so it does not follow the sm/default/lg
			height ramp the buttons and inputs share.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 9 -->
				<Frame.Root spacing="xs" class="w-full max-w-xs">
					<Frame.Header>
						<Frame.Title>Project Configuration</Frame.Title>
						<Frame.Description>Adjust your environment settings</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Environment Variables</h3>
						<p class="text-sm text-muted-foreground">
							XS spacing is ideal for high-density toolbars and property panels.
						</p>
					</Frame.Panel>
					<Frame.Footer>
						<p class="text-sm text-muted-foreground">Updated 2m ago</p>
					</Frame.Footer>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with small spacing">
		<Card.Root>
			<Card.Content>
				<!-- demo 10 -->
				<Frame.Root spacing="sm" class="w-full max-w-sm">
					<Frame.Header>
						<Frame.Title>Database Overview</Frame.Title>
						<Frame.Description>Monitoring system health and performance</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Live Connections</h3>
						<p class="text-sm text-muted-foreground">
							Small spacing provides a balanced layout for sidebar widgets and secondary dashboards.
						</p>
					</Frame.Panel>
					<Frame.Footer>
						<p class="text-sm text-muted-foreground">Status: Operational</p>
					</Frame.Footer>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with default spacing">
		{#snippet blurb()}
			The step every other section on this page is drawn at, and the one the header and footer are
			tuned against: their vertical padding is deliberately tighter than the panel body's, so the
			bars read as chrome.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 11 -->
				<Frame.Root class="w-full max-w-sm">
					<Frame.Header>
						<Frame.Title>User Profile</Frame.Title>
						<Frame.Description>Manage your personal account details</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Account Security</h3>
						<p class="text-sm text-muted-foreground">
							Default spacing is the standard for primary application content and main dialogs.
						</p>
					</Frame.Panel>
					<Frame.Footer>
						<p class="text-sm text-muted-foreground">Last login: Today at 4:30 PM</p>
					</Frame.Footer>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with large spacing">
		<Card.Root>
			<Card.Content>
				<!-- demo 12 -->
				<Frame.Root spacing="lg" class="w-full max-w-sm">
					<Frame.Header>
						<Frame.Title>System Analytics</Frame.Title>
						<Frame.Description>Global traffic and usage patterns</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Performance Metrics</h3>
						<p class="text-sm text-muted-foreground">
							Large spacing creates a focused, airy feel suitable for marketing pages or empty
							states.
						</p>
					</Frame.Panel>
					<Frame.Footer>
						<p class="text-sm text-muted-foreground">View full report</p>
					</Frame.Footer>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with small border radius">
		{#snippet blurb()}
			The corner is a variable, not a variant: set
			<code class="text-[87.5%] text-primary">--frame-radius</code> on the shell and the panel radius
			follows it, staying concentric because it is derived as the frame radius less the shell's border
			and padding.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 13 -->
				<Frame.Root class="w-full max-w-sm [--frame-radius:var(--radius-sm)]">
					<Frame.Header>
						<Frame.Title>Network Diagnostics</Frame.Title>
						<Frame.Description>Analyzing real-time socket connections</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Port Status</h3>
						<p class="text-sm text-muted-foreground">
							Small radius gives a sharp, precise look, perfect for technical dashboards and data
							grids.
						</p>
					</Frame.Panel>
					<Frame.Footer>
						<p class="text-sm text-muted-foreground">Scan completed</p>
					</Frame.Footer>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with medium border radius">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">--radius-md</code> is the corner this theme's buttons, inputs
			and dropdown panels take, so a frame at this step reads as one of them.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 14 -->
				<Frame.Root class="w-full max-w-sm [--frame-radius:var(--radius-md)]">
					<Frame.Header>
						<Frame.Title>Media Library</Frame.Title>
						<Frame.Description>Manage your assets and downloads</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Storage Capacity</h3>
						<p class="text-sm text-muted-foreground">
							Medium radius is a versatile middle ground between sharp and rounded aesthetics.
						</p>
					</Frame.Panel>
					<Frame.Footer>
						<p class="text-sm text-muted-foreground">75% of 100GB used</p>
					</Frame.Footer>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with large border radius">
		{#snippet blurb()}
			Identical to the default below it under this theme:
			<code class="text-[87.5%] text-primary">--radius-lg</code> and
			<code class="text-[87.5%] text-primary">--radius-xl</code> are both 0.5rem here. The two steps are
			free to differ, which is why the section stays.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 15 -->
				<Frame.Root class="w-full max-w-sm [--frame-radius:var(--radius-lg)]">
					<Frame.Header>
						<Frame.Title>Team Collaboration</Frame.Title>
						<Frame.Description>Invite and manage workspace members</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Active Members</h3>
						<p class="text-sm text-muted-foreground">
							Large radius offers a modern, friendly appearance for social and collaborative
							interfaces.
						</p>
					</Frame.Panel>
					<Frame.Footer>
						<p class="text-sm text-muted-foreground">3 members online</p>
					</Frame.Footer>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with default border radius">
		{#snippet blurb()}
			No override at all — the baseline the four other radius sections are read against. The frame's
			own default is <code class="text-[87.5%] text-primary">--radius-xl</code>, which this theme
			holds at the card corner.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 16 -->
				<Frame.Root class="w-full max-w-sm">
					<Frame.Header>
						<Frame.Title>Default Layout</Frame.Title>
						<Frame.Description>Standard component curvature</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Standard Settings</h3>
						<p class="text-sm text-muted-foreground">
							The default radius matches the overall design system for consistent application feel.
						</p>
					</Frame.Panel>
					<Frame.Footer>
						<p class="text-sm text-muted-foreground">System default applied</p>
					</Frame.Footer>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with extra large border radius">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">--radius-2xl</code> is 1rem here — the roundest step the
			ramp offers before a corner becomes a pill.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 17 -->
				<Frame.Root class="w-full max-w-sm [--frame-radius:var(--radius-2xl)]">
					<Frame.Header>
						<Frame.Title>Creative Portfolio</Frame.Title>
						<Frame.Description>Showcasing visual art and design</Frame.Description>
					</Frame.Header>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Gallery View</h3>
						<p class="text-sm text-muted-foreground">
							2XL radius provides a very soft, organic look suitable for creative portfolios and
							landing pages.
						</p>
					</Frame.Panel>
					<Frame.Footer>
						<p class="text-sm text-muted-foreground">Browse 12 projects</p>
					</Frame.Footer>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with content-only panels">
		{#snippet blurb()}
			Header and footer are optional. Without them the shell is only the tray, and the panels carry
			everything.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 18 -->
				<Frame.Root class="w-full max-w-sm">
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Account Snapshot</h3>
						<p class="text-sm text-muted-foreground">
							Active seats, usage limits, and billing status are ready for review.
						</p>
					</Frame.Panel>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Team Activity</h3>
						<p class="text-sm text-muted-foreground">
							24 members signed in this week with no unresolved security alerts.
						</p>
					</Frame.Panel>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Frame with stacked content-only panels">
		{#snippet blurb()}
			The section above with <code class="text-[87.5%] text-primary">stacked</code> added, and the pair
			worth comparing directly: with no header or footer to anchor the run, fusing the panels is what
			makes the tray legible as a single block rather than two cards sharing a tint.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 19 -->
				<Frame.Root stacked class="w-full max-w-sm">
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Account Snapshot</h3>
						<p class="text-sm text-muted-foreground">
							Active seats, usage limits, and billing status are ready for review.
						</p>
					</Frame.Panel>
					<Frame.Panel>
						<h3 class="text-sm font-semibold">Team Activity</h3>
						<p class="text-sm text-muted-foreground">
							24 members signed in this week with no unresolved security alerts.
						</p>
					</Frame.Panel>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Frame.Root</h3>
			<p class="text-sm text-muted-foreground">
				The shell. It owns every variable the parts below read, which is why spacing and radius are
				set once here rather than per panel.
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
							{#each frameRootProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Frame.Panel</h3>
			<p class="text-sm text-muted-foreground">
				One panel inside the shell. Draws its own border, ground and radius from the shell's
				variables.
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
							{#each framePanelProps as row (row.prop)}
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
			<h3 class="text-base font-medium">
				Frame.Header, Frame.Title, Frame.Description, Frame.Footer
			</h3>
			<p class="text-sm text-muted-foreground">
				The four content parts. None takes a prop of its own — they exist to carry the shell's
				spacing and type, so their surface is the one below.
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
							{#each frameSlotProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CSS variables</h3>
			<p class="text-sm text-muted-foreground">
				Published by the root and consumed by every part. Overriding one through
				<code>class</code> on the root retunes the whole frame, which is how the radius sections above
				work.
			</p>
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
							{#each frameVariables as row (row.name)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.name}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
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
