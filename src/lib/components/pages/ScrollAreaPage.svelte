<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import { getInitials } from "$lib/shared/get-initials.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Scroll Area component page, ported from the shadcn-svelte documentation
	 * (https://shadcn-svelte.com/docs/components/scroll-area) — the tags hero and the
	 * horizontal strip — then demos for what the wrapper in `ui/scroll-area` adds beyond the
	 * docs: `orientation="both"`, the pass-through `type` prop, and the
	 * `scrollbarXClasses`/`scrollbarYClasses` escape hatches.
	 *
	 * WHAT THE CLASSIC THEME HAS: nothing. The classic framework never draws its own scrollbar —
	 * `.table-responsive`, `.overflow-auto` and the classic theme's `.navbar-vertical` all scroll with
	 * the native bar — so there is no reference-stylesheet section to port numbers from, and the page
	 * keeps shadcn's rendering unchanged. The nearest relative in the gallery is Scroller,
	 * which makes the opposite trade: it KEEPS the native scroll mechanics and layers edge
	 * fade cues and press-to-scroll buttons on top, where Scroll Area replaces the bar itself
	 * with an overlay it paints. The subtitle states that boundary so nobody reaches for the
	 * wrong one.
	 *
	 * The horizontal demo swaps upstream's stock-photo artworks for the team roster the Marquee
	 * page already uses: the gallery ships no remote images (`dashboard.ts` documents why for
	 * avatars — a failed request on every load), and initials always render.
	 */

	/**
	 * Upstream's hero data verbatim: fifty prerelease tags, newest first. Enough rows that a
	 * 288px viewport is guaranteed to overflow at any font setting.
	 */
	const versions = Array.from({ length: 50 }, (_, i) => `v1.2.0-beta.${50 - i}`);

	/**
	 * The Marquee page's roster, with the dashboard's own signed-in user in front — reusing
	 * people the gallery has already introduced instead of inventing an eighth cast.
	 */
	const team = [
		{ name: "Ada Lovelace", role: "Founder" },
		{ name: "Alex Johnson", role: "Frontend Developer" },
		{ name: "Sarah Chen", role: "Design Lead" },
		{ name: "Michael Rodriguez", role: "Full Stack Engineer" },
		{ name: "Emily Davis", role: "Product Manager" },
		{ name: "David Kim", role: "Senior Developer" },
		{ name: "Lisa Thompson", role: "UI/UX Designer" },
	];

	/**
	 * Access-log lines for the both-axis demo. A `<pre>` rather than `Table`, deliberately:
	 * `Table.Root` wraps every table in its own `overflow-x-auto` container, and a native
	 * scroller nested inside a Scroll Area swallows the horizontal axis before the overlay
	 * scrollbar ever engages — the same double-scrollbar trap `filters-option-list` documents.
	 * Column-padded log lines are the honest use case for an unwrapped `<pre>` anyway.
	 */
	const logLines = [
		"2026-08-10T09:14:02Z  GET    /api/orders?page=2&per_page=50&sort=-updated_at&status=fulfilled              200   18ms",
		"2026-08-10T09:14:02Z  GET    /api/orders/ord_5143/items?expand=product,customer                           200   11ms",
		"2026-08-10T09:14:05Z  POST   /api/orders/ord_5143/refunds                                                 201   64ms",
		"2026-08-10T09:14:09Z  GET    /api/customers?email=alex%40apple.com                                        200    9ms",
		"2026-08-10T09:14:11Z  PATCH  /api/customers/cus_0031                                                      200   22ms",
		"2026-08-10T09:14:15Z  GET    /api/products?category=analytics&in_stock=true&page=1&per_page=25            200   14ms",
		"2026-08-10T09:14:19Z  GET    /api/reports/revenue?from=2026-07-01&to=2026-07-31&group_by=week             200  241ms",
		"2026-08-10T09:14:23Z  POST   /api/webhooks/stripe                                                         204    7ms",
		"2026-08-10T09:14:27Z  GET    /api/orders/ord_5144                                                         404    4ms",
		"2026-08-10T09:14:31Z  PUT    /api/settings/notifications                                                  200   19ms",
		"2026-08-10T09:14:36Z  GET    /api/search?q=quarterly+invoice&scope=documents&highlight=true               200   88ms",
		"2026-08-10T09:14:40Z  DELETE /api/sessions/ses_9917                                                       204    5ms",
		"2026-08-10T09:14:44Z  GET    /api/orders?page=3&per_page=50&sort=-updated_at&status=fulfilled             200   16ms",
		"2026-08-10T09:14:48Z  GET    /healthz                                                                     200    1ms",
	];

	/** Recent activity for the always-visible demo — same people, dated around today. */
	const activity = [
		{ who: "Sarah Chen", what: "approved the Homepage Redesign handoff", when: "Aug 8, 2026" },
		{ who: "Alex Johnson", what: "pushed 14 commits to main", when: "Aug 7, 2026" },
		{ who: "Emily Davis", what: 'moved "Checkout flow" to In review', when: "Aug 6, 2026" },
		{ who: "Michael Rodriguez", what: "closed 3 issues", when: "Aug 5, 2026" },
		{ who: "Lisa Thompson", what: "updated the design tokens", when: "Aug 4, 2026" },
		{ who: "David Kim", what: "deployed v1.2.0-beta.50 to staging", when: "Aug 3, 2026" },
		{ who: "Sarah Chen", what: "commented on the pricing page", when: "Aug 2, 2026" },
		{ who: "Alex Johnson", what: 'opened "Migrate charts to LayerChart"', when: "Aug 1, 2026" },
		{ who: "Emily Davis", what: "scheduled the sprint review", when: "Jul 31, 2026" },
		{ who: "Michael Rodriguez", what: 'merged "Sidebar refactor"', when: "Jul 30, 2026" },
	];

	/**
	 * The hero's viewport element, for the Back-to-top button. The wrapper exposes
	 * `viewportRef` because bits-ui scrolls its Viewport child, never the Root — the Root is
	 * just `position: relative` chrome, so `scrollTo` on it would be a silent no-op.
	 */
	let tagsViewport = $state<HTMLElement | null>(null);

	/**
	 * What the fade and gutter demos (demo 4 and demo 5) would ideally lean on: a scroll area
	 * that publishes
	 * `--scroll-area-overflow-{x,y}-{start,end}` (px still scrollable towards each edge) on
	 * the viewport and `data-has-overflow-{x,y}` on the root, and both demos are pure CSS
	 * over that instrumentation. The registry wrapper here has none of it and must stay
	 * unmodified — but it exposes `viewportRef`, so the page measures the viewport itself
	 * and writes the same vocabulary back onto the DOM, and the demos' selectors work
	 * unchanged.
	 */
	function trackOverflow(viewport: HTMLElement): () => void {
		const root = viewport.closest<HTMLElement>("[data-slot=scroll-area]");
		const update = () => {
			const xEnd = viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft;
			const yEnd = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;
			viewport.style.setProperty(
				"--scroll-area-overflow-x-start",
				`${Math.max(viewport.scrollLeft, 0)}px`,
			);
			viewport.style.setProperty("--scroll-area-overflow-x-end", `${Math.max(xEnd, 0)}px`);
			viewport.style.setProperty(
				"--scroll-area-overflow-y-start",
				`${Math.max(viewport.scrollTop, 0)}px`,
			);
			viewport.style.setProperty("--scroll-area-overflow-y-end", `${Math.max(yEnd, 0)}px`);
			root?.toggleAttribute("data-has-overflow-x", viewport.scrollWidth > viewport.clientWidth);
			root?.toggleAttribute("data-has-overflow-y", viewport.scrollHeight > viewport.clientHeight);
		};
		update();
		viewport.addEventListener("scroll", update, { passive: true });
		const observer = new ResizeObserver(update);
		observer.observe(viewport);
		// bits-ui inserts a content sizer between the viewport and `children`; watching it
		// catches content growth the viewport's own box never reflects.
		if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
		return () => {
			viewport.removeEventListener("scroll", update);
			observer.disconnect();
		};
	}

	let fadeViewport = $state<HTMLElement | null>(null);
	let gutterViewport = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!fadeViewport) return;
		return trackOverflow(fadeViewport);
	});
	$effect(() => {
		if (!gutterViewport) return;
		return trackOverflow(gutterViewport);
	});
</script>

<DocPage title="Scroll area">
	{#snippet subtitle()}
		Augments native scroll functionality for custom, cross-browser styling. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/scroll-area"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options. Scroll area replaces the scrollbar with an overlay it paints; when you
		want to keep native scrolling and only add edge fade cues or press-to-scroll buttons, use
		<a class="text-primary underline underline-offset-3" href="#/components/scroller">Scroller</a>
		instead.
	{/snippet}

	<Card.Root>
		<Card.Content class="flex flex-col items-start gap-4">
			<ScrollArea bind:viewportRef={tagsViewport} class="h-72 w-48 rounded-md border">
				<div class="p-4">
					<h4 class="mb-4 text-sm leading-none font-medium">Tags</h4>
					<!--
						The trailing Separator after the last row is upstream's markup, kept as-is:
						the list is presented as a cut-off window onto something longer, so a final
						rule reads as "more below" rather than as a dangling border.
					-->
					{#each versions as version (version)}
						<div class="text-sm">{version}</div>
						<Separator class="my-2" />
					{/each}
				</div>
			</ScrollArea>
			<Button
				variant="outline"
				size="sm"
				onclick={() => tagsViewport?.scrollTo({ top: 0, behavior: "smooth" })}
			>
				<ArrowUpIcon data-icon="inline-start" />
				Back to top
			</Button>
		</Card.Content>
	</Card.Root>

	<DocSection title="Horizontal">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">orientation="horizontal"</code> moves the scrollbar to the
			bottom edge of the viewport.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ScrollArea orientation="horizontal" class="w-full rounded-md border">
					<!--
						`w-max`, not `w-full`: a plain flex row would shrink its tiles to fit the
						viewport and nothing would ever overflow. Sizing the row to its content is
						what gives the horizontal axis something to scroll.
					-->
					<div class="flex w-max gap-4 p-4">
						{#each team as member (member.name)}
							<div class="flex w-36 shrink-0 flex-col items-center gap-2 rounded-md border p-4">
								<Avatar.Root size="lg">
									<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex flex-col items-center text-center">
									<span class="text-sm font-medium">{member.name}</span>
									<span class="text-xs text-muted-foreground">{member.role}</span>
								</div>
							</div>
						{/each}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Both axes">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">orientation="both"</code> mounts one scrollbar per axis,
			plus the corner square where they would otherwise overlap.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ScrollArea orientation="both" class="h-56 w-full rounded-md border">
					<!--
						`w-max` again, for the same reason as the horizontal strip — and see the
						`logLines` comment for why this is a `<pre>` and not a `Table`.
					-->
					<pre class="w-max p-4 font-mono text-xs leading-5">{logLines.join("\n")}</pre>
				</ScrollArea>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Always visible">
		{#snippet blurb()}
			By default bits-ui paints the bar only while the pointer is over the area (<code
				class="text-[87.5%] text-primary">type="hover"</code
			>);
			<code class="text-[87.5%] text-primary">type="always"</code> keeps it on screen.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`type` is not declared by the wrapper — it rides `restProps` onto
					`ScrollAreaPrimitive.Root`, which is why every demo above shows its bar only on
					hover: they inherit the primitive's default.
				-->
				<ScrollArea type="always" class="h-56 w-full rounded-md border">
					<div class="flex flex-col gap-3 p-4">
						{#each activity as entry (entry.who + entry.what)}
							<div class="flex items-baseline justify-between gap-4">
								<p class="text-sm">
									<span class="font-medium">{entry.who}</span>
									<span class="text-muted-foreground">{entry.what}</span>
								</p>
								<span class="shrink-0 text-xs text-muted-foreground">{entry.when}</span>
							</div>
						{/each}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Styled scrollbars">
		{#snippet blurb()}
			The wrapper's <code class="text-[87.5%] text-primary">scrollbarYClasses</code> and
			<code class="text-[87.5%] text-primary">scrollbarXClasses</code> props are the only route to the
			bars from a call site — the Scrollbar parts are rendered inside the component, not composed by the
			caller.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The hero's list again with the bar widened and the thumb tinted, under
					`type="always"` so the restyling is visible without hovering.

					`data-vertical:w-3.5`, not plain `w-3.5`: the Scrollbar's own width is
					`data-vertical:w-2.5`, whose variant compiles to class-plus-attribute and so
					outweighs a bare utility — while tailwind-merge collapses only same-modifier
					classes, so restating the modifier is what makes the override land (the same
					reasoning the Toggle page records for `aria-pressed:`). The thumb is a child the
					prop cannot reach directly, hence the child-combinator arbitrary variant; its
					selector also outweighs the thumb's own `bg-border`, so no `!` is needed.
				-->
				<ScrollArea
					type="always"
					class="h-72 w-48 rounded-md border"
					scrollbarYClasses="data-vertical:w-3.5 [&>[data-slot=scroll-area-thumb]]:bg-primary"
				>
					<div class="p-4">
						<h4 class="mb-4 text-sm leading-none font-medium">Tags</h4>
						{#each versions as version (version)}
							<div class="text-sm">{version}</div>
							<Separator class="my-2" />
						{/each}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Scroll area with fade effect">
		{#snippet blurb()}
			Edge fades that grow as content scrolls out of view, driven by the measured overflow distances
			— content only ever fades where something is actually hidden.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 4. The full pattern masks all four edges; this list only
					ever overflows vertically, so only the top and bottom masks are kept — with no
					horizontal overflow the x-axis distances would sit at 0px and those masks would
					never paint anyway. `min(--fade-size, distance)` is what collapses the fade at
					the extremes: at the very top the start distance is 0px, the mask begins at
					100%, and no fade shows. Upstream's picsum image tiles become the release list
					from its own basic demo ("demo 1", `divide-y` and all): the
					gallery ships no remote images, as the header comment records.
				-->
				<ScrollArea
					bind:viewportRef={fadeViewport}
					class="h-72 w-48 rounded-md border **:data-[slot=scroll-area-viewport]:mask-t-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-start)))] **:data-[slot=scroll-area-viewport]:mask-b-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-end)))] **:data-[slot=scroll-area-viewport]:[--fade-size:1.5rem]"
				>
					<div class="p-4">
						<h4 class="mb-4 text-sm leading-none font-medium">Releases</h4>
						<div class="flex flex-col divide-y">
							{#each versions as version (version)}
								<div class="py-2 text-sm">{version}</div>
							{/each}
						</div>
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Scroll area with scrollbar gutter">
		{#snippet blurb()}
			Conditional padding — <code class="text-[87.5%] text-primary">data-has-overflow-y:px-2.5</code
			> — reserves a gutter beside the overlay scrollbar only while there is something to scroll.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 5. The overlay bar paints on top of the content, so
					full-width tiles would slide under it; padding the Root insets the viewport
					while the bar, absolutely positioned by the primitive, stays at the Root's
					edge. The attribute is present only when the axis genuinely overflows, so a
					short list keeps its full width. Upstream leaves the bar on its hover default;
					`type="always"` here keeps it on screen so the gutter and the bar it makes room
					for are visible together — the same choice the "Always visible" section
					documents. The image tiles become the horizontal strip's roster, initials
					instead of remote images as everywhere on this page.
				-->
				<ScrollArea
					bind:viewportRef={gutterViewport}
					type="always"
					class="h-72 w-56 rounded-md border data-has-overflow-x:py-2.5 data-has-overflow-y:px-2.5"
				>
					<div class="flex w-full flex-col items-center gap-4 py-2">
						{#each team as member (member.name)}
							<div class="flex w-full shrink-0 flex-col items-center gap-2 rounded-md border p-4">
								<Avatar.Root size="lg">
									<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex flex-col items-center text-center">
									<span class="text-sm font-medium">{member.name}</span>
									<span class="text-xs text-muted-foreground">{member.role}</span>
								</div>
							</div>
						{/each}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
