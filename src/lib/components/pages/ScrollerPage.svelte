<script lang="ts">
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Scroller, type ScrollerTriggerMode } from "$lib/components/ui/scroller/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { getInitials } from "$lib/shared/get-initials.js";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Scroller component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The classic theme's scrolling regions are plain `overflow-auto` blocks
	 * (`.card-body` capped by an inline `max-height`, the chat pane on the reference “chat” demo page), with no
	 * affordance beyond the platform scrollbar. Nothing was needed in `app.css` either: the edge
	 * fade is an alpha mask the component carries in its own variants, and the navigation chevrons
	 * are a private part of the component.
	 *
	 * WHERE IT SITS NEXT TO SCROLL AREA. Both wrap an overflowing region, and the boundary between
	 * them is the scrollbar. Scroller keeps the browser's native scrollbar and layers affordances
	 * on top of native scrolling — an edge fade where content hides, optional auto-scroll buttons.
	 * Scroll area REPLACES the native scrollbar with its own overlay thumb and adds nothing else.
	 * Reach for Scroller when the platform scrollbar should survive; for Scroll area when it
	 * should not.
	 *
	 * The demos are deliberately constrained (`h-64`, `h-48`, `max-w-md`): every cue on this page
	 * is driven by measured overflow, so a scroller given enough room to show its content whole
	 * renders no fade and no buttons at all — correctly, but with nothing to look at.
	 */

	/**
	 * The same six people the Marquee page's testimonials use, so the gallery keeps one cast,
	 * plus two more so the list overflows `h-64` by enough to show all three mask states (top
	 * fade, both-edges fade, bottom fade) rather than a token few pixels.
	 */
	const directory = [
		{ name: "Alex Johnson", role: "Frontend Developer" },
		{ name: "Sarah Chen", role: "Design Lead" },
		{ name: "Michael Rodriguez", role: "Full Stack Engineer" },
		{ name: "Emily Davis", role: "Product Manager" },
		{ name: "David Kim", role: "Senior Developer" },
		{ name: "Lisa Thompson", role: "UI/UX Designer" },
		{ name: "James Wilson", role: "DevOps Engineer" },
		{ name: "Nora Bergstrom", role: "Support Specialist" },
	];

	/**
	 * The horizontal demo's cards. Statuses render through the subtle Badge variants rather than
	 * raw colour utilities — the "semantic tokens only" rule, and the variants exist for exactly
	 * this kind of status chip.
	 */
	const projects: { name: string; due: string; status: string; badge: BadgeVariant }[] = [
		{ name: "Homepage Redesign", due: "Due Aug 21", status: "On track", badge: "success-subtle" },
		{ name: "Mobile App Beta", due: "Due Sep 4", status: "At risk", badge: "warning-subtle" },
		{ name: "Design System Audit", due: "Due Aug 28", status: "On track", badge: "success-subtle" },
		{ name: "Checkout Flow", due: "Due Sep 12", status: "In review", badge: "info-subtle" },
		{
			name: "Onboarding Emails",
			due: "Due Aug 25",
			status: "Blocked",
			badge: "destructive-subtle",
		},
		{ name: "Analytics Dashboard", due: "Due Sep 19", status: "On track", badge: "success-subtle" },
		{ name: "API Documentation", due: "Due Oct 2", status: "In review", badge: "info-subtle" },
	];

	/** Tag chips for the hidden-scrollbar demo — short items, so `max-w-md` forces the overflow. */
	const tags = [
		"Design",
		"Development",
		"Marketing",
		"Sales",
		"Support",
		"Research",
		"Billing",
		"Analytics",
		"Integrations",
		"Documentation",
	];

	/**
	 * One column per mode, each carrying its own hint: the three modes look identical at rest —
	 * the buttons only reveal which one they are once used — so the caption has to say it.
	 */
	const triggerModes: { mode: ScrollerTriggerMode; label: string; hint: string }[] = [
		{ mode: "press", label: "Press", hint: "Hold a chevron down; release to stop." },
		{ mode: "hover", label: "Hover", hint: "Point at a chevron; it scrolls until you leave." },
		{ mode: "click", label: "Click", hint: "Each click moves one scrollStep (40px)." },
	];

	// Starts hidden so the demo opens in the state the section is named after; the switch brings
	// the native scrollbar back for comparison.
	let hideScrollbar = $state(true);
</script>

<!--
	One snippet feeds every vertical demo on the page, so the four scrollers scroll the same
	directory and a copy edit lands everywhere at once. Declared OUTSIDE `<DocPage>`: a snippet
	written directly inside a component tag implicitly becomes a prop of that component, and
	`DocPage` declares no `directoryList` prop — out here it is plain lexical scope, visible to
	every section below.
-->
{#snippet directoryList()}
	<div class="flex flex-col gap-1">
		{#each directory as person (person.name)}
			<div class="flex items-center gap-3 rounded-md p-2">
				<div
					class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
				>
					{getInitials(person.name)}
				</div>
				<div class="flex flex-col">
					<span class="text-sm font-medium">{person.name}</span>
					<span class="text-xs text-muted-foreground">{person.role}</span>
				</div>
			</div>
		{/each}
	</div>
{/snippet}

<DocPage title="Scroller">
	{#snippet subtitle()}
		A scroll container that keeps the browser's native scrollbar and fades the edges where more
		content hides, with optional buttons that scroll on press, hover or click. Unlike
		<a class="text-primary underline underline-offset-3" href={href("/components/scroll-area")}
			>Scroll area</a
		>, which replaces the scrollbar entirely with its own thumb, Scroller only layers affordances on
		top of native scrolling.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			A vertical list capped at a fixed height. The fade tracks real overflow: at the top of the
			list only the bottom edge fades, both fade in the middle, and a list short enough to fit would
			show no fade at all. The native scrollbar stays.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Scroller class="h-64 w-full">
					{@render directoryList()}
				</Scroller>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Horizontal">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">orientation="horizontal"</code> moves the fades to the left
			and right edges and watches the other scroll axis.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Scroller orientation="horizontal" class="w-full">
					<!--
						`pb-3` keeps the native horizontal scrollbar off the cards' shadow: on Windows
						the bar takes real space inside the container rather than overlaying it.
					-->
					<div class="flex gap-4 pb-3">
						{#each projects as project (project.name)}
							<div
								class="flex w-56 shrink-0 flex-col gap-2 rounded-md border bg-card p-4 text-card-foreground shadow-sm"
							>
								<div class="flex flex-col gap-0.5">
									<span class="text-sm font-medium">{project.name}</span>
									<span class="text-xs text-muted-foreground">{project.due}</span>
								</div>
								<Badge class="self-start" variant={project.badge}>{project.status}</Badge>
							</div>
						{/each}
					</div>
				</Scroller>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Trigger modes">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">withNavigation</code> adds chevron buttons that render
			only toward hidden content — scroll a column to its end and that end's button unmounts.
			<code class="text-[87.5%] text-primary">scrollTriggerMode</code> decides how a button drives the
			scroll.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="grid gap-6 md:grid-cols-3">
					{#each triggerModes as entry (entry.mode)}
						<div class="flex flex-col gap-2">
							<div class="flex flex-col gap-1">
								<p class="text-sm font-medium">{entry.label}</p>
								<p class="text-xs text-muted-foreground">{entry.hint}</p>
							</div>
							<Scroller withNavigation scrollTriggerMode={entry.mode} class="h-48 w-full">
								{@render directoryList()}
							</Scroller>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Hidden scrollbar">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">hideScrollbar</code> removes the native scrollbar and leaves
			the fade as the only cue — the shape for chip rows and thumbnail strips, where a scrollbar under
			two lines of pills reads as noise. Toggle it to compare.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div class="flex items-center gap-2">
						<Switch id="scroller-hide-scrollbar" bind:checked={hideScrollbar} />
						<!-- `font-normal` for the same reason as the Switch page: `.form-check-label`
						     inherits the classic theme's 400 weight where shadcn's Label asks for 500. -->
						<Label for="scroller-hide-scrollbar" class="font-normal">
							Hide the native scrollbar
						</Label>
					</div>
					<!-- `max-w-md` is what makes ten short chips overflow at all inside this column. -->
					<Scroller orientation="horizontal" {hideScrollbar} class="w-full max-w-md">
						<div class="flex gap-2">
							{#each tags as tag (tag)}
								<Badge class="shrink-0" variant="secondary">{tag}</Badge>
							{/each}
						</div>
					</Scroller>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Shadow size">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">size</code> sets the depth of the fade in pixels — it
			is the <code class="text-[87.5%] text-primary">--scroll-shadow-size</code> custom property every
			mask gradient reads. The default is 40; this one dissolves across 96.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Scroller size={96} class="h-64 w-full">
					{@render directoryList()}
				</Scroller>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
