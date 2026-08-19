<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Resizable from "$lib/components/ui/resizable/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Resizable component page, ported from shadcn-svelte's documentation
	 * (`https://shadcn-svelte.com/docs/components/resizable.md`): the horizontal group with a
	 * nested vertical one, the vertical group, and the group with a visible grip.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART — this is the (c) case, and it is a clean one. Nothing in
	 * the reference source describes a splitter, a pane group or a drag handle: the single `resiz`
	 * hit in the whole tree is `resize: none` on the textarea in the reference stylesheet,
	 * which is the opposite feature. The reference docs document 29 sections
	 * (accordion … utilities) and none of them is this. The classic framework's only divider-shaped
	 * primitive is `.vr`, and the classic theme does not restyle it either. So the component keeps
	 * shadcn's own look — a 1px `bg-border` rule with a 4px hit area — and the work below is
	 * limited to the frame around the demos, where the classic theme values do exist.
	 *
	 * The focus state is left alone for a reason rather than by omission. The classic theme deletes
	 * the classic focus glow outright (`input-btn-focus-box-shadow: none`) and shows focus by
	 * repainting the border `input-focus-border-color: primary` instead. A resize handle has
	 * no border to repaint, and shadcn's `focus-visible:ring-ring` is already painted `--ring`,
	 * which this theme carries as exactly that `primary` — so the focus COLOUR agrees with
	 * the classic theme even though the shape (a ring, not a border) has no classic precedent.
	 */

	/**
	 * The frame around each demo, which is where the classic values actually land.
	 *
	 *   rounded-lg   `--radius-lg` is `border-radius-lg: 0.5rem` in this theme, so the docs'
	 *                own `rounded-lg` resolves to a real classic radius unchanged
	 *   border       1px is `border-width`. The colour is `--border`, i.e.
	 *                `card-border-color` = `gray-200` (#EDF2F9) — the classic generic
	 *                `border-color` is `gray-300`, one step darker, and has no token here
	 *                (the same gap the Accordion page records)
	 *   max-w-md     shadcn's demo width. No classic equivalent; kept as the docs have it,
	 *                since the group's size is the thing being demonstrated
	 */
	const frame = "max-w-md rounded-lg border";

	/**
	 * A pane's contents. `p-6` is 24px, which is `spacer` — and therefore `card-spacer-x/y`,
	 * the padding the classic theme gives every card body. That the docs already chose it is a
	 * coincidence, but it is the value the classic theme would have asked for.
	 *
	 * `h-full` fills whatever the group was sized to; the group itself is `h-full w-full` from
	 * the component, so the height has to be stated somewhere outside it.
	 */
	const paneBody = "flex h-full items-center justify-center p-6";

	/** `font-weight-bold` is 600 in the classic theme, not 700 — which is `font-semibold` exactly. */
	const label = "font-semibold";

	/* ---------------------------------------------------------------------------------------
	 * The animated-handle examples. The React-ecosystem resizable wraps react-resizable-panels
	 * where this one wraps paneforge, and two renames follow from that:
	 *
	 *   - the group's `orientation` prop is `direction` here, same values, same meaning;
	 *   - The `active:` pseudo-class becomes `data-[active]:`. paneforge stamps
	 *     `data-active="pointer" | "keyboard"` on the resizer for the WHOLE drag, while CSS
	 *     `:active` lets go the moment the pointer leaves the 1px rule mid-drag — which it does
	 *     on every fast drag. The attribute is the state the pseudo-class was approximating.
	 *
	 * The pill itself is a `before:` pseudo-element painted over the rule, so no component
	 * change is involved — the house handle only occupies `after:` (its hit area).
	 * ------------------------------------------------------------------------------------ */

	/**
	 * demo 5: a 6px pill that grows on hover, and stretches to 12px with a
	 * `--primary` fill while dragging. All three fills are already tokens upstream.
	 */
	const pillHandle =
		"before:pointer-events-none before:absolute before:top-1/2 before:left-1/2 before:z-10 before:h-6 before:w-1 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-muted-foreground/25 before:transition-all before:duration-300 before:ease-[cubic-bezier(0.32,0.72,0,1)] hover:before:h-8 hover:before:bg-muted-foreground/50 data-[active]:before:h-12 data-[active]:before:w-1.5 data-[active]:before:bg-primary";

	/**
	 * demo 6: the same pill, but resting at `scale-y-75` of a taller box so hover
	 * reads as a spring release rather than a resize.
	 */
	const springPillHandle =
		"before:pointer-events-none before:absolute before:top-1/2 before:left-1/2 before:z-10 before:h-8 before:w-1 before:-translate-x-1/2 before:-translate-y-1/2 before:scale-y-75 before:rounded-full before:bg-muted-foreground/20 before:transition-all before:duration-300 before:ease-[cubic-bezier(0.32,0.72,0,1)] hover:before:scale-y-100 hover:before:bg-muted-foreground/40 data-[active]:before:h-14 data-[active]:before:w-1.5 data-[active]:before:scale-y-100 data-[active]:before:bg-primary";

	/**
	 * demo 7: the pill grows to a 80px capsule while dragging, and the rule itself
	 * tints `--primary` at 20% under it — the one example that styles the handle element, not
	 * just its pseudo-element.
	 */
	const capsuleHandle =
		"transition-colors duration-200 data-[active]:bg-primary/20 before:pointer-events-none before:absolute before:top-1/2 before:left-1/2 before:z-10 before:h-6 before:w-1 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-muted-foreground/20 before:transition-all before:duration-300 before:ease-[cubic-bezier(0.32,0.72,0,1)] hover:before:h-10 hover:before:w-1.5 hover:before:bg-muted-foreground/40 data-[active]:before:h-20 data-[active]:before:w-1.5 data-[active]:before:bg-primary";

	/**
	 * demo 8 and demo 9 share the vertical pill; the horizontal one is
	 * its transpose (h↔w) for the handle inside the vertical group, which the component cannot
	 * derive because the pill is call-site paint, not part of the handle.
	 */
	const verticalPillHandle =
		"before:pointer-events-none before:absolute before:top-1/2 before:left-1/2 before:z-10 before:h-6 before:w-1 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-muted-foreground/25 before:transition-all before:duration-300 before:ease-[cubic-bezier(0.32,0.72,0,1)] hover:before:h-10 hover:before:bg-muted-foreground/40 data-[active]:before:h-12 data-[active]:before:w-1.5 data-[active]:before:bg-primary";
	const horizontalPillHandle =
		"before:pointer-events-none before:absolute before:top-1/2 before:left-1/2 before:z-10 before:h-1 before:w-6 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-muted-foreground/25 before:transition-all before:duration-300 before:ease-[cubic-bezier(0.32,0.72,0,1)] hover:before:w-10 hover:before:bg-muted-foreground/40 data-[active]:before:h-1.5 data-[active]:before:w-12 data-[active]:before:bg-primary";

	/**
	 * demo 10 keeps the live layout in state so each pane can label itself with its
	 * own percentage. Upstream's `onLayoutChange` hands back a `Record` keyed by pane id;
	 * paneforge's hands back a `number[]` in pane order, so the two panes read index 0 and 1.
	 */
	let stateTrackedSizes = $state<{ left: number; right: number }>({ left: 30, right: 70 });
</script>

<DocPage title="Resizable">
	{#snippet subtitle()}
		Accessible resizable panel groups and layouts, with keyboard support. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/resizable"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				The docs' opening example: a horizontal group whose right pane is itself a vertical
				group. `defaultSize` is a percentage of the parent group, so 50/50 then 25/75.
			-->
			<Resizable.PaneGroup direction="horizontal" class={frame}>
				<Resizable.Pane defaultSize={50}>
					<!--
						The one fixed height on the page. A `PaneGroup` is `h-full`, so it collapses
						unless something inside it has a height — the docs put that height on the
						first pane's body and let every other pane take `h-full` from it.
					-->
					<div class="flex h-[200px] items-center justify-center p-6">
						<span class={label}>One</span>
					</div>
				</Resizable.Pane>
				<Resizable.Handle />
				<Resizable.Pane defaultSize={50}>
					<Resizable.PaneGroup direction="vertical">
						<Resizable.Pane defaultSize={25}>
							<div class={paneBody}><span class={label}>Two</span></div>
						</Resizable.Pane>
						<Resizable.Handle />
						<Resizable.Pane defaultSize={75}>
							<div class={paneBody}><span class={label}>Three</span></div>
						</Resizable.Pane>
					</Resizable.PaneGroup>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</Card.Content>
	</Card.Root>

	<DocSection title="Vertical">
		{#snippet blurb()}
			Use the <code class="text-[87.5%] text-primary">direction</code> prop to set the direction of the
			resizable panes.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`direction="vertical"` flips the group to `flex-col` and the handle to a full-width
					1px rule, both from the component's own `data-[direction=vertical]:` classes — no
					call-site work. `min-h-[200px]` supplies the height that the horizontal demo took
					from its first pane.
				-->
				<Resizable.PaneGroup direction="vertical" class="min-h-[200px] {frame}">
					<Resizable.Pane defaultSize={25}>
						<div class={paneBody}><span class={label}>Header</span></div>
					</Resizable.Pane>
					<Resizable.Handle />
					<Resizable.Pane defaultSize={75}>
						<div class={paneBody}><span class={label}>Content</span></div>
					</Resizable.Pane>
				</Resizable.PaneGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Handle">
		{#snippet blurb()}
			Use the <code class="text-[87.5%] text-primary">withHandle</code> prop to add a grip to the handle.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`withHandle` adds a 4×24px `bg-border` grip centred on the rule. It is an inner
					element with no `class` prop of its own, so it is not reachable from here — which
					costs nothing, because the classic theme has no drag affordance to match it against.
				-->
				<Resizable.PaneGroup direction="horizontal" class="min-h-[200px] {frame}">
					<Resizable.Pane defaultSize={25}>
						<div class={paneBody}><span class={label}>Sidebar</span></div>
					</Resizable.Pane>
					<Resizable.Handle withHandle />
					<Resizable.Pane defaultSize={75}>
						<div class={paneBody}><span class={label}>Content</span></div>
					</Resizable.Pane>
				</Resizable.PaneGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Handle with animated pill indicator">
		<Card.Root>
			<Card.Content>
				<Resizable.PaneGroup direction="horizontal" class="min-h-[200px] {frame}">
					<Resizable.Pane defaultSize={30}>
						<div class={paneBody}><span class="text-sm {label}">Sidebar</span></div>
					</Resizable.Pane>
					<Resizable.Handle class={pillHandle} />
					<Resizable.Pane defaultSize={70}>
						<div class={paneBody}><span class="text-sm {label}">Content</span></div>
					</Resizable.Pane>
				</Resizable.PaneGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Handle pill with spring scale on drag">
		<Card.Root>
			<Card.Content>
				<Resizable.PaneGroup direction="horizontal" class="min-h-[200px] {frame}">
					<Resizable.Pane defaultSize={30}>
						<div class={paneBody}><span class="text-sm {label}">Sidebar</span></div>
					</Resizable.Pane>
					<Resizable.Handle class={springPillHandle} />
					<Resizable.Pane defaultSize={70}>
						<div class={paneBody}><span class="text-sm {label}">Content</span></div>
					</Resizable.Pane>
				</Resizable.PaneGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Handle with large capsule expansion on drag">
		<Card.Root>
			<Card.Content>
				<Resizable.PaneGroup direction="horizontal" class="min-h-[200px] {frame}">
					<Resizable.Pane defaultSize={35}>
						<div class={paneBody}><span class="text-sm {label}">Panel A</span></div>
					</Resizable.Pane>
					<Resizable.Handle class={capsuleHandle} />
					<Resizable.Pane defaultSize={65}>
						<div class={paneBody}><span class="text-sm {label}">Panel B</span></div>
					</Resizable.Pane>
				</Resizable.PaneGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Nested layout with animated pill handles">
		<Card.Root>
			<Card.Content>
				<Resizable.PaneGroup direction="horizontal" class="min-h-[300px] {frame}">
					<Resizable.Pane defaultSize={30} minSize={15}>
						<div class={paneBody}><span class="text-sm {label}">Nav</span></div>
					</Resizable.Pane>
					<Resizable.Handle class={verticalPillHandle} />
					<Resizable.Pane defaultSize={70}>
						<Resizable.PaneGroup direction="vertical">
							<Resizable.Pane defaultSize={25}>
								<div class={paneBody}><span class="text-sm {label}">Toolbar</span></div>
							</Resizable.Pane>
							<Resizable.Handle class={horizontalPillHandle} />
							<Resizable.Pane defaultSize={75}>
								<div class={paneBody}><span class="text-sm {label}">Editor</span></div>
							</Resizable.Pane>
						</Resizable.PaneGroup>
					</Resizable.Pane>
				</Resizable.PaneGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Three-panel layout with animated pill handles">
		<Card.Root>
			<Card.Content>
				<Resizable.PaneGroup direction="horizontal" class="min-h-[200px] {frame}">
					<Resizable.Pane defaultSize={25} minSize={15}>
						<div class={paneBody}><span class="text-sm {label}">Files</span></div>
					</Resizable.Pane>
					<Resizable.Handle class={verticalPillHandle} />
					<Resizable.Pane defaultSize={50} minSize={25}>
						<div class={paneBody}><span class="text-sm {label}">Editor</span></div>
					</Resizable.Pane>
					<Resizable.Handle class={verticalPillHandle} />
					<Resizable.Pane defaultSize={25} minSize={15}>
						<div class={paneBody}><span class="text-sm {label}">Preview</span></div>
					</Resizable.Pane>
				</Resizable.PaneGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="State-tracked resizable layout">
		{#snippet blurb()}
			The group reports every layout change, so each pane can display its own live percentage.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Resizable.PaneGroup
					direction="horizontal"
					class="min-h-[200px] {frame}"
					onLayoutChange={(layout) => {
						stateTrackedSizes = { left: layout[0] ?? 30, right: layout[1] ?? 70 };
					}}
				>
					<Resizable.Pane defaultSize={30} minSize={20}>
						<div class="flex h-full flex-col items-center justify-center gap-2 p-6">
							<span class="text-sm {label}">{Math.round(stateTrackedSizes.left)}%</span>
						</div>
					</Resizable.Pane>
					<Resizable.Handle withHandle />
					<Resizable.Pane defaultSize={70} minSize={30}>
						<div class="flex h-full flex-col items-center justify-center gap-2 p-6">
							<span class="text-sm {label}">{Math.round(stateTrackedSizes.right)}%</span>
						</div>
					</Resizable.Pane>
				</Resizable.PaneGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
