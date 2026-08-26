<script lang="ts" module>
	/**
	 * One step of the breadcrumb trail.
	 *
	 * `href` is optional because the last step is the current page: shadcn's `Breadcrumb.Page`
	 * is a `<span aria-current="page">`, not a link, so giving it a destination would offer a
	 * link to where the user already is.
	 *
	 * A step with no `href` that is NOT the last one is a heading rather than a place. Both cases
	 * are real in this application — see `DocPage.svelte`, which builds the trail — and both render
	 * as plain text, in the row and in the overflow menu alike.
	 */
	export type Crumb = {
		/** Label. Unique within the trail — it is the `{#each}` key. */
		label: string;
		/** Destination. Omitted on the final step, and on any step that is a heading. */
		href?: string;
	};
</script>

<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Drawer from "$lib/components/ui/drawer/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import {
		EMPTY_OVERFLOW_FIT_METRICS,
		computeCollapsed,
		leadWidth,
		type OverflowFitMetrics,
	} from "$lib/shared/overflow-fit.js";
	import { cn } from "$lib/utils.js";

	/**
	 * A breadcrumb trail that collapses its leading steps into a menu when the row runs out of room.
	 *
	 * WHAT THIS REPLACES, and why a media query was the wrong tool. The header used to hide every
	 * ancestor below `md` with `hidden md:block`. That is a VIEWPORT test, and the width this row
	 * actually gets is not a function of the viewport: the sidebar takes 256px expanded and 48px
	 * collapsed, and the search field takes 256px above `sm` and 32px below it. So the rule fired at
	 * the wrong moments in both directions — the whole trail vanished at 767px on a desktop with the
	 * sidebar closed, and survived at 800px with the sidebar open, where there was no room for it.
	 * It also had a cliff rather than a slope: one pixel either side of 768 was the difference
	 * between three steps and one.
	 *
	 * Worse, hiding an ancestor now DELETES NAVIGATION. Until the index and the twelve group pages
	 * existed, the first two steps were plain text and hiding them cost nothing but context. They
	 * are destinations now, and a phone was the one place you could not reach them.
	 *
	 * THE LADDER, which is measured rather than declared:
	 *
	 *   Components  ›  Layout  ›  Compare slider     everything fits
	 *        ⋯      ›  Layout  ›  Compare slider     the root is in the menu
	 *        ⋯      ›  Compare slider                every ancestor is in the menu
	 *        ⋯      ›  Compare sli…                  and now the page itself truncates
	 *
	 * Collapse before truncation, and the current page never leaves — the order every source agrees
	 * on, and the one `src/lib/shared/overflow-fit.ts` implements. A collapsed step is still
	 * reachable; a truncated label is gone.
	 *
	 * WHY THE ELLIPSIS SITS ON THE LEFT. The steps nearest the current page carry the most meaning,
	 * so the ellipsis is pushed as far towards the root as the arrangement allows. That is the
	 * common recommendation across design systems, and it is what makes the second rung above
	 * useful rather than arbitrary: `⋯ › Layout › Compare slider` still says which shelf you are on.
	 */
	let {
		trail,
		class: className,
	}: {
		/** The steps, root first. The last one is the current page. */
		trail: Crumb[];
		/** Merged onto the measured box, so the header can size it. */
		class?: HTMLAttributes<HTMLElement>["class"];
	} = $props();

	const ancestors = $derived(trail.slice(0, -1));
	const current = $derived(trail.at(-1));

	/**
	 * The overflow surface is a menu on a pointer and a drawer on a touch screen.
	 *
	 * This is the one viewport test left in the component, and it is a different question from the
	 * one above: how much ROOM the row has is a property of the layout and is measured, but how big
	 * a hit target has to be is a property of the DEVICE. shadcn's own responsive breadcrumb example
	 * splits it the same way (https://shadcn-svelte.com/docs/components/breadcrumb).
	 */
	const isMobile = new IsMobile();

	/** Whether the drawer is open. Held here so a step can close it as it navigates — see below. */
	let drawerOpen = $state(false);

	/**
	 * The measured box, and the invisible copy of the row that supplies every other number.
	 *
	 * TWO RULES MAKE THIS LOOP-FREE, and neither is optional.
	 *
	 * First, {@link slot} must be a box whose width this row's own content cannot change. The header
	 * gives it `flex-1` inside a growing group, so its width is a pure function of the bar's width —
	 * collapse a step and the slot does not move. A content-sized box here is the classic priority+
	 * oscillation: collapsing narrows the row, the narrower row re-measures, and the two states flip
	 * forever.
	 *
	 * Second, {@link mirror} renders EVERY step at natural width whatever the row is currently
	 * showing, so the widths fed to `computeCollapsed` never depend on its own answer. It costs one
	 * duplicated list; the alternative — measuring the real row and caching the widths of steps as
	 * they disappear — has no honest first frame, because at a narrow first paint the steps it needs
	 * to measure were never rendered.
	 */
	let slot: HTMLElement | null = $state(null);
	let mirror: HTMLElement | null = $state(null);

	let metrics: OverflowFitMetrics = $state.raw(EMPTY_OVERFLOW_FIT_METRICS);
	let available = $state(0);

	/**
	 * Whether anything has been measured yet — a flag, NOT `available === 0`.
	 *
	 * Zero is a width the slot really reaches, on a phone where the appearance controls leave the
	 * trail nothing, and reading it as "not measured yet" made the row render every step uncollapsed
	 * into a box of no width: a full trail, clipped, with no ellipsis to say so. The two states want
	 * opposite answers, so they get two variables.
	 */
	let measured = $state(false);

	/**
	 * Re-measure whenever the slot resizes or the trail changes.
	 *
	 * Both observed boxes are safe to observe: the slot is sized by the header and the mirror always
	 * renders everything, so neither can be resized by what this effect writes. `trail` is read
	 * eagerly because a new route can produce labels whose total width happens to match the old
	 * ones, which the observer would not report.
	 */
	$effect(() => {
		void trail;
		const slotElement = slot;
		const mirrorElement = mirror;
		if (!slotElement || !mirrorElement) return;
		if (typeof ResizeObserver === "undefined") return;

		function measure(): void {
			if (!slotElement || !mirrorElement) return;

			const width = (selector: string) =>
				mirrorElement.querySelector(selector)?.getBoundingClientRect().width ?? 0;

			metrics = {
				items: Array.from(mirrorElement.querySelectorAll('[data-measure="item"]')).map(
					(element) => element.getBoundingClientRect().width,
				),
				tail: width('[data-measure="tail"]'),
				trigger: width('[data-measure="trigger"]'),
				separator: width('[data-measure="separator"]'),
				// The mirror IS a `Breadcrumb.List`, so its gap is the real row's gap by construction —
				// including the `sm:` step, which a hard-coded number would have missed.
				gap: Number.parseFloat(getComputedStyle(mirrorElement).columnGap) || 0,
			};
			available = slotElement.getBoundingClientRect().width;
			measured = true;
		}

		const observer = new ResizeObserver(measure);
		observer.observe(slotElement);
		observer.observe(mirrorElement);
		measure();

		return () => observer.disconnect();
	});

	const collapsed = $derived(measured ? computeCollapsed(metrics, available) : 0);
	const hiddenSteps = $derived(ancestors.slice(0, collapsed));
	const shownSteps = $derived(ancestors.slice(collapsed));

	/**
	 * Roughly five characters at `text-sm`: below this the current page is a smear, not a word.
	 *
	 * A floor on legibility rather than on layout, which is why it is a number here and not a
	 * `min-w-*` on the item — a CSS minimum would push the row wider instead of changing what the row
	 * decides to draw.
	 */
	const MIN_TAIL = 40;

	/**
	 * Whether the last rung has been reached AND the page still has no room to say anything.
	 *
	 * It happens on a narrow phone, where the header's other occupants leave the trail about sixty
	 * pixels. Everything is already in the menu by then, so the separator before the page is
	 * pointing at nothing — a chevron with a blank after it, which reads as a bug rather than as a
	 * trail. Dropping it is worth more than the punctuation: the separator and its two gaps are ~34px,
	 * which is most of a word.
	 *
	 * Read off numbers already measured — no second measurement, and therefore no second chance to
	 * oscillate. It can only ever hand the page MORE room than `leadWidth` assumed, never less, so
	 * the arrangement `computeCollapsed` chose stays valid.
	 *
	 * The floor is capped at the tail's own natural width: a title shorter than `MIN_TAIL` ("Kbd",
	 * "Tabs") needs only what it measures, and demanding the full 40px would fire mid-ladder — in
	 * an arrangement `computeCollapsed` verified fits — and drop a separator the row has room for.
	 */
	const starved = $derived(
		measured &&
			collapsed > 0 &&
			leadWidth(metrics, collapsed) + Math.min(MIN_TAIL, metrics.tail) > available,
	);

	/**
	 * The accessible name of the trigger, which is the only thing that announces the collapse.
	 *
	 * `Breadcrumb.Ellipsis` carries `aria-hidden` on its own root, which swallows the `sr-only`
	 * "More" it ships inside — so a trigger wrapping it has no accessible name at all unless one is
	 * given here. The count is part of it because "some steps are hidden" is not actionable and
	 * "2 hidden steps" is.
	 */
	const triggerLabel = $derived(
		`Show ${hiddenSteps.length} hidden breadcrumb step${hiddenSteps.length === 1 ? "" : "s"}`,
	);
</script>

<!--
	One step, rendered identically in the row and in the mirror so the measurement is of the real
	thing. A step with no destination is a heading: a plain span, NOT `Breadcrumb.Page`, which
	carries `aria-current="page"` and would announce two current pages in one trail.
-->
{#snippet step(crumb: Crumb)}
	{#if crumb.href}
		<Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link>
	{:else}
		<span>{crumb.label}</span>
	{/if}
{/snippet}

<!--
	The trigger, in the row and in the mirror. `props` is empty for the mirror's copy, which is never
	pressed — it is there so the button it measures is the button the row will render.
-->
{#snippet ellipsisButton(props: Record<string, unknown>)}
	<Button {...props} variant="ghost" size="icon-sm" aria-label={triggerLabel}>
		<Breadcrumb.Ellipsis />
	</Button>
{/snippet}

<div bind:this={slot} class={cn("relative", className)}>
	<Breadcrumb.Root>
		<!--
			`flex-nowrap` overrides the component's own `flex-wrap`, which is right for a breadcrumb in
			the flow of a document and wrong in a row of fixed height: the second line simply leaves the
			bar. `min-w-0` is what lets the list shrink below its content at all, and it is also what
			keeps the whole row out of the header's min-content calculation.
		-->
		<Breadcrumb.List class="min-w-0 flex-nowrap">
			{#if collapsed > 0}
				<Breadcrumb.Item class="shrink-0">
					{#if isMobile.current}
						<Drawer.Root bind:open={drawerOpen}>
							<Drawer.Trigger>
								{#snippet child({ props })}
									{@render ellipsisButton(props)}
								{/snippet}
							</Drawer.Trigger>
							<Drawer.Content>
								<Drawer.Header class="text-start">
									<Drawer.Title>Go up the trail</Drawer.Title>
									<Drawer.Description>
										The steps this trail could not fit, nearest the root first.
									</Drawer.Description>
								</Drawer.Header>
								<div class="grid gap-1 px-4 pb-6">
									{#each hiddenSteps as crumb (crumb.label)}
										{#if crumb.href}
											<!--
												The drawer closes as the step navigates. Navigating re-renders the header
												without unmounting this component, so nothing else would close it.
											-->
											<a
												href={crumb.href}
												onclick={() => (drawerOpen = false)}
												class="rounded-md px-3 py-2.5 text-base text-foreground hover:bg-accent hover:text-accent-foreground"
											>
												{crumb.label}
											</a>
										{:else}
											<span class="px-3 py-2.5 text-base text-muted-foreground">{crumb.label}</span>
										{/if}
									{/each}
								</div>
							</Drawer.Content>
						</Drawer.Root>
					{:else}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									{@render ellipsisButton(props)}
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="start">
								{#each hiddenSteps as crumb (crumb.label)}
									{#if crumb.href}
										<!-- A real anchor, so middle-click and "open in new tab" keep working — the
										     argument `CommandPalette.svelte` and `NavMain.svelte` both make. -->
										<DropdownMenu.Item>
											{#snippet child({ props })}
												<a {...props} href={crumb.href}>{crumb.label}</a>
											{/snippet}
										</DropdownMenu.Item>
									{:else}
										<DropdownMenu.Label>{crumb.label}</DropdownMenu.Label>
									{/if}
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{/if}
				</Breadcrumb.Item>
				<!-- Every separator but the last one before a starved page — see `starved` above. -->
				{#if shownSteps.length > 0 || !starved}
					<Breadcrumb.Separator class="shrink-0" />
				{/if}
			{/if}

			{#each shownSteps as crumb, index (crumb.label)}
				<Breadcrumb.Item class="shrink-0 whitespace-nowrap">{@render step(crumb)}</Breadcrumb.Item>
				{#if index < shownSteps.length - 1 || !starved}
					<Breadcrumb.Separator class="shrink-0" />
				{/if}
			{/each}

			{#if current}
				<!--
					The current page is the only step whose length is unbounded, so it is the one that
					ellipsizes. `min-w-0` on the item is what lets it: a flex child will not go below its
					content width without it.
				-->
				<Breadcrumb.Item class="min-w-0">
					<Breadcrumb.Page class="block truncate">{current.label}</Breadcrumb.Page>
				</Breadcrumb.Item>
			{/if}
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!--
		The mirror: the same list, every step, always at natural width.

		`Breadcrumb.List` rather than a hand-written `<ol>`, because a copy that drifts from the real
		row measures the wrong thing — the typography, the gap and the item padding all have to be the
		component's own. `absolute` keeps it out of the flow, so it contributes nothing to the slot's
		size and cannot be what the observer above reacts to; `w-max` lets it reach natural width
		inside a slot narrower than itself, and the header's `overflow-hidden` clips the excess.

		`invisible` (`visibility: hidden`) is doing the accessibility work on its own — it removes the
		subtree from the accessibility tree and from the tab order — and `aria-hidden` and `inert` are
		belt and braces, so that a future `visibility` change cannot quietly duplicate the whole trail
		for a screen reader. That is also why the tail may safely be a real `Breadcrumb.Page` with its
		`aria-current`: nothing reads it.
	-->
	<Breadcrumb.List
		bind:ref={mirror}
		aria-hidden="true"
		inert={true}
		class="pointer-events-none invisible absolute start-0 top-0 w-max flex-nowrap"
	>
		<Breadcrumb.Item data-measure="trigger" class="shrink-0">
			{@render ellipsisButton({})}
		</Breadcrumb.Item>
		<Breadcrumb.Separator data-measure="separator" class="shrink-0" />
		{#each ancestors as crumb (crumb.label)}
			<Breadcrumb.Item data-measure="item" class="shrink-0 whitespace-nowrap">
				{@render step(crumb)}
			</Breadcrumb.Item>
		{/each}
		{#if current}
			<Breadcrumb.Item data-measure="tail" class="shrink-0 whitespace-nowrap">
				<Breadcrumb.Page>{current.label}</Breadcrumb.Page>
			</Breadcrumb.Item>
		{/if}
	</Breadcrumb.List>
</div>
