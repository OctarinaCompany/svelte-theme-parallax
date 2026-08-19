<script lang="ts">
	import MinusIcon from "@lucide/svelte/icons/minus";
	import PlusIcon from "@lucide/svelte/icons/plus";

	import * as Card from "$lib/components/ui/card/index.js";
	import * as Drawer from "$lib/components/ui/drawer/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";

	/**
	 * The Drawer component page, ported from shadcn-svelte's own documentation
	 * (https://shadcn-svelte.com/docs/components/drawer) — the "Move Goal" hero, then the
	 * capabilities the vaul-svelte port actually ships: direction, a form, snap points and
	 * nesting.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The classic edge panel is the offcanvas, and that is already
	 * ported as the Sheet — same anatomy, but driven by buttons, not by touch. The drawer is
	 * vaul's addition to the pair: a panel the finger can fling shut, with snap points and a
	 * drag handle no classic component has. With no reference-stylesheet numbers to reproduce,
	 * this page keeps the component's own surface (the popover tokens) untouched — the same
	 * position the Responsive Dialog page takes for its drawer half, which composes exactly
	 * this component below its 768px breakpoint.
	 *
	 * WHAT THE PORT SUPPORTS, read from `vaul-svelte`'s `DrawerRootProps` rather than assumed:
	 * `direction` (all four edges), `snapPoints`/`activeSnapPoint`/`fadeFromIndex` (the root
	 * wrapper makes `activeSnapPoint` bindable), `dismissible`, `modal`, and `NestedRoot`. The
	 * barrel exports no `Handle`, so `handleOnly` has nothing to grip and is not demonstrated.
	 *
	 * TWO QUIET FACTS about the wrapper, stated here so the demos below read correctly:
	 *
	 *   the grab bar   `drawer-content.svelte` renders its pill under a
	 *                  `group-data-[vaul-drawer-direction=bottom]` guard, so only the bottom
	 *                  drawer shows one. The side and top demos are expected to open bare.
	 *   the scale      `shouldScaleBackground` defaults to true, but vaul scales the element
	 *                  carrying `data-vaul-drawer-wrapper` and nothing in this app shell
	 *                  carries it — so the page behind the drawer does not shrink. Nested
	 *                  drawers still scale their PARENT, because vaul transforms the parent
	 *                  content directly; the Nested section is where the effect is visible.
	 */

	// --- Move Goal -----------------------------------------------------------
	// Upstream's numbers exactly: start at 350, step by 10, clamp to [200, 400] — the clamp is
	// what lets the steppers demonstrate their disabled state at either end.
	let goal = $state(350);

	function adjustGoal(delta: number) {
		goal = Math.max(200, Math.min(400, goal + delta));
	}

	// --- Direction -----------------------------------------------------------
	/**
	 * `direction` lives on the ROOT, not on the content — vaul needs it for drag maths, and the
	 * content only reads it back through `data-vaul-drawer-direction` to pick its edge styles.
	 * That is the opposite split from the Sheet, whose `side` prop sits on `Sheet.Content`.
	 */
	const directions = [
		{ direction: "top", label: "Top" },
		{ direction: "right", label: "Right" },
		{ direction: "bottom", label: "Bottom" },
		{ direction: "left", label: "Left" },
	] as const;

	// --- With Form -----------------------------------------------------------
	let subject = $state("");
	let message = $state("");

	// --- Snap Points ---------------------------------------------------------
	/**
	 * Seeded `null`, not `0.4`: vaul sets the active point itself when the drawer opens, and it
	 * resets to `null` on close — the binding is here to be READ, so the page can print where
	 * the drawer currently rests.
	 */
	let activeSnap = $state<number | string | null>(null);

	// --- Scrollable content ----------------------------------------------------
	/**
	 * Demo 1 repeats one lorem paragraph ten times — enough copy that the body
	 * must scroll inside the drawer's height cap. Kept as data here so the markup loops instead
	 * of pasting the paragraph ten times.
	 */
	const loremParagraph =
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor " +
		"incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud " +
		"exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure " +
		"dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. " +
		"Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt " +
		"mollit anim id est laborum.";

	/** Enough rows that the closed 40% snap visibly truncates the list. */
	const activity = [
		{ text: "Pedro Duarte moved “My Awesome Project” to Production", time: "2 min ago" },
		{ text: "Deployment preview ready for review", time: "14 min ago" },
		{ text: "Weekly usage report generated", time: "1 hr ago" },
		{ text: "Invoice #1832 was paid", time: "3 hrs ago" },
		{ text: "Two teammates accepted their invitations", time: "5 hrs ago" },
		{ text: "Nightly database backup completed", time: "9 hrs ago" },
		{ text: "API key “staging” was rotated", time: "Yesterday" },
		{ text: "Domain verification succeeded", time: "Yesterday" },
		{ text: "Storage usage crossed 80% of the plan", time: "2 days ago" },
		{ text: "Password changed from a new device", time: "3 days ago" },
	];
</script>

<DocPage title="Drawer">
	{#snippet subtitle()}
		The touch counterpart of the Dialog and Sheet pair — a panel that slides in from an edge and can
		be dragged shut. The Responsive dialog composes it below its breakpoint. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/drawer"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<Drawer.Root>
				<Drawer.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" {...props}>Open Drawer</Button>
					{/snippet}
				</Drawer.Trigger>
				<Drawer.Content>
					<!--
						`max-w-sm` on an inner wrapper, not on the content: the panel itself must stay
						full-bleed so the drag surface and the rounded top edge span the viewport —
						only the READING measure narrows. Straight from the upstream example.
					-->
					<div class="mx-auto w-full max-w-sm">
						<Drawer.Header>
							<Drawer.Title>Move Goal</Drawer.Title>
							<Drawer.Description>Set your daily activity goal.</Drawer.Description>
						</Drawer.Header>
						<div class="p-4 pb-0">
							<div class="flex items-center justify-center gap-2">
								<!--
									`icon-sm` is the 32px square the docs build by hand with `size-8`;
									`rounded-full` is the one geometry the variant does not carry. The
									clamp disables the button at its own bound, which also exercises the
									disabled rendering without a dedicated demo.
								-->
								<Button
									variant="outline"
									size="icon-sm"
									class="shrink-0 rounded-full"
									aria-label="Decrease goal"
									disabled={goal <= 200}
									onclick={() => adjustGoal(-10)}
								>
									<MinusIcon />
								</Button>
								<div class="flex-1 text-center">
									<div class="text-7xl font-bold tracking-tighter">{goal}</div>
									<div class="text-xs text-muted-foreground uppercase">Calories/day</div>
								</div>
								<Button
									variant="outline"
									size="icon-sm"
									class="shrink-0 rounded-full"
									aria-label="Increase goal"
									disabled={goal >= 400}
									onclick={() => adjustGoal(10)}
								>
									<PlusIcon />
								</Button>
							</div>
						</div>
						<Drawer.Footer>
							<Drawer.Close>
								{#snippet child({ props })}
									<Button {...props}>Submit</Button>
								{/snippet}
							</Drawer.Close>
							<Drawer.Close>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>Cancel</Button>
								{/snippet}
							</Drawer.Close>
						</Drawer.Footer>
					</div>
				</Drawer.Content>
			</Drawer.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Direction">
		{#snippet blurb()}
			Pass <code class="text-[87.5%] text-primary">direction</code> to
			<code class="text-[87.5%] text-primary">Drawer.Root</code> to slide the panel in from
			<code class="text-[87.5%] text-primary">top</code>,
			<code class="text-[87.5%] text-primary">right</code>,
			<code class="text-[87.5%] text-primary">bottom</code> or
			<code class="text-[87.5%] text-primary">left</code>. Only the bottom drawer shows the grab bar
			— the side panels behave like a draggable Sheet.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-wrap gap-2">
				{#each directions as edge (edge.direction)}
					<Drawer.Root direction={edge.direction}>
						<Drawer.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" {...props}>{edge.label}</Button>
							{/snippet}
						</Drawer.Trigger>
						<Drawer.Content>
							<Drawer.Header>
								<Drawer.Title>{edge.label} drawer</Drawer.Title>
								<Drawer.Description>
									Drag it toward the {edge.direction} edge, or press Escape, to dismiss.
								</Drawer.Description>
							</Drawer.Header>
							<Drawer.Footer>
								<Drawer.Close>
									{#snippet child({ props })}
										<Button variant="outline" {...props}>Close</Button>
									{/snippet}
								</Drawer.Close>
							</Drawer.Footer>
						</Drawer.Content>
					</Drawer.Root>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With Form">
		{#snippet blurb()}
			A drawer holding a small form — the mobile-first alternative to putting the same fields in a
			Dialog. Fields compose from the Field primitives, exactly as they would anywhere else on a
			page.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Drawer.Root>
					<Drawer.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Contact Support</Button>
						{/snippet}
					</Drawer.Trigger>
					<Drawer.Content>
						<div class="mx-auto w-full max-w-sm">
							<Drawer.Header>
								<Drawer.Title>Contact support</Drawer.Title>
								<Drawer.Description>
									Describe the problem and we will get back to you within a day.
								</Drawer.Description>
							</Drawer.Header>
							<!--
								`px-4` matches the header's and footer's own inset; the fields carry no
								padding of their own because `Drawer.Header`/`Footer` own the vertical
								rhythm around them.
							-->
							<div class="px-4">
								<Field.FieldGroup>
									<Field.Field>
										<Field.FieldLabel for="drawer-support-subject">Subject</Field.FieldLabel>
										<Input
											id="drawer-support-subject"
											bind:value={subject}
											placeholder="Deploy fails on the Production environment"
										/>
									</Field.Field>
									<Field.Field>
										<Field.FieldLabel for="drawer-support-message">Message</Field.FieldLabel>
										<Textarea
											id="drawer-support-message"
											bind:value={message}
											placeholder="It stopped after the build step…"
										/>
										<Field.FieldDescription>
											Include the project name and a timestamp if you have one.
										</Field.FieldDescription>
									</Field.Field>
								</Field.FieldGroup>
							</div>
							<Drawer.Footer>
								<Drawer.Close>
									{#snippet child({ props })}
										<Button {...props}>Send message</Button>
									{/snippet}
								</Drawer.Close>
								<Drawer.Close>
									{#snippet child({ props })}
										<Button variant="outline" {...props}>Cancel</Button>
									{/snippet}
								</Drawer.Close>
							</Drawer.Footer>
						</div>
					</Drawer.Content>
				</Drawer.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Snap Points">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">snapPoints</code> lets the drawer rest at intermediate
			heights — here 40% and full — and
			<code class="text-[87.5%] text-primary">bind:activeSnapPoint</code> reports where it sits. The
			scrim only fades in fully at the last point (<code class="text-[87.5%] text-primary"
				>fadeFromIndex</code
			> defaults to it), and the list becomes scrollable only once the drawer is fully open.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex items-center gap-2">
				<Drawer.Root snapPoints={[0.4, 1]} bind:activeSnapPoint={activeSnap}>
					<Drawer.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Recent Activity</Button>
						{/snippet}
					</Drawer.Trigger>
					<!--
						Snap points measure their offsets against the drawer's own height, so the
						content must OWN a height instead of shrink-wrapping — `h-auto` would make
						"40% of the drawer" 40% of almost nothing. `h-full` replaces it cleanly
						(same tailwind-merge group), but the component's `mt-24` and `max-h-[80vh]`
						are written under a `data-[vaul-drawer-direction=bottom]:` prefix, which is a
						`(0,2,0)` selector; a bare `mt-0` would be `(0,1,0)` and lose regardless of
						source order. Restating the prefix puts each pair in the same merge group so
						the later class simply replaces the earlier — the same move the Sheet page
						documents for its `data-[side=…]` sizes. 94% rather than 100% keeps a sliver
						of the page visible at the top, as the upstream snap example does.
					-->
					<Drawer.Content
						class="h-full data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[94%]"
					>
						<div class="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col">
							<Drawer.Header>
								<Drawer.Title>Recent activity</Drawer.Title>
								<Drawer.Description>Drag the bar up for the full history.</Drawer.Description>
							</Drawer.Header>
							<!--
								`overflow-y-auto` looks premature while the drawer rests at 40%, but
								vaul locks inner scrolling until the LAST snap point is reached — a
								drag on the truncated list moves the drawer, not the list.
							-->
							<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
								{#each activity as entry (entry.text)}
									<div class="flex items-baseline justify-between gap-4">
										<span>{entry.text}</span>
										<span class="shrink-0 text-xs text-muted-foreground">{entry.time}</span>
									</div>
								{/each}
							</div>
						</div>
					</Drawer.Content>
				</Drawer.Root>
				<!-- `null` while closed — vaul clears the point rather than remembering it. -->
				<span class="text-sm text-muted-foreground">active snap point: {activeSnap ?? "—"}</span>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Nested">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">Drawer.NestedRoot</code> opens a second drawer over the
			first and scales the parent back as it enters — the one place the scale effect is visible here,
			since vaul transforms the parent drawer directly rather than the page wrapper.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Drawer.Root>
					<Drawer.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Open First Drawer</Button>
						{/snippet}
					</Drawer.Trigger>
					<Drawer.Content>
						<div class="mx-auto w-full max-w-sm">
							<Drawer.Header>
								<Drawer.Title>First drawer</Drawer.Title>
								<Drawer.Description>
									Open the second one and watch this panel recede behind it.
								</Drawer.Description>
							</Drawer.Header>
							<Drawer.Footer>
								<!--
									The nested root must sit INSIDE the parent's content: vaul wires the
									two through context, and that link is what drives the parent's
									scale-back transform.
								-->
								<Drawer.NestedRoot>
									<Drawer.Trigger>
										{#snippet child({ props })}
											<Button {...props}>Open Second Drawer</Button>
										{/snippet}
									</Drawer.Trigger>
									<Drawer.Content>
										<div class="mx-auto w-full max-w-sm">
											<Drawer.Header>
												<Drawer.Title>Second drawer</Drawer.Title>
												<Drawer.Description>
													Dismissing this one hands the stage back to its parent.
												</Drawer.Description>
											</Drawer.Header>
											<Drawer.Footer>
												<Drawer.Close>
													{#snippet child({ props })}
														<Button variant="outline" {...props}>Close</Button>
													{/snippet}
												</Drawer.Close>
											</Drawer.Footer>
										</div>
									</Drawer.Content>
								</Drawer.NestedRoot>
								<Drawer.Close>
									{#snippet child({ props })}
										<Button variant="outline" {...props}>Close</Button>
									{/snippet}
								</Drawer.Close>
							</Drawer.Footer>
						</div>
					</Drawer.Content>
				</Drawer.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="A basic drawer with scrollable content">
		{#snippet blurb()}
			When the body outgrows the drawer's height cap, an inner
			<code class="text-[87.5%] text-primary">overflow-y-auto</code> region scrolls while the header and
			footer stay pinned — no snap points required.
		{/snippet}
		<!--
			Ported from Demo 1. Two departures from the
			source: its `max-h-[80vh]` on the content is dropped because `drawer-content.svelte`
			already caps the bottom drawer at exactly that height, and its `no-scrollbar` utility is
			dropped because this repository defines no such class — the native scrollbar shows, which
			is the honest rendering of a scroll region anyway. Unlike the Snap Points list above,
			this body scrolls as soon as the drawer opens: without snap points vaul never locks
			inner scrolling.
		-->
		<Card.Root>
			<Card.Content>
				<Drawer.Root>
					<Drawer.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Open Drawer</Button>
						{/snippet}
					</Drawer.Trigger>
					<Drawer.Content>
						<Drawer.Header>
							<Drawer.Title>Move Goal</Drawer.Title>
							<Drawer.Description>Set your daily activity goal.</Drawer.Description>
						</Drawer.Header>
						<div class="overflow-y-auto px-4">
							{#each { length: 10 } as _, index (index)}
								<p class="mb-4 leading-normal">{loremParagraph}</p>
							{/each}
						</div>
						<Drawer.Footer>
							<Button>Submit</Button>
							<Drawer.Close>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>Cancel</Button>
								{/snippet}
							</Drawer.Close>
						</Drawer.Footer>
					</Drawer.Content>
				</Drawer.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
