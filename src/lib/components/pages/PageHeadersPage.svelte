<script lang="ts">
	import type { Snippet } from "svelte";
	import { Area, AreaChart } from "layerchart";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Page headers component page.
	 *
	 * `.header` is the classic theme's own component — the classic framework has nothing like it — and it is the
	 * block every application page in the theme opens with. `PageIntro.svelte` already ports
	 * its simplest form (title + subtitle + rule); this page documents the other seven.
	 *
	 * NO PHOTOGRAPHS. The classic theme's avatar and cover examples load JPEGs from its own asset
	 * folder. This repository ships no images — the same reason `dashboard.ts` carries no
	 * `avatar` field — so avatars fall back to initials and the cover image is a gradient
	 * band. Both substitutions are about the asset, not about the layout: every measurement
	 * around them is the classic theme's.
	 */

	/**
	 * `.header` itself: `header-margin-bottom: 2rem`, plus a background and a colour that
	 * only exist in dark mode.
	 *
	 * THE DARK BAND IS NOT A MISTAKE. The reference stylesheet's dark block sets `--bs-header-bg` to
	 * `black` and `--bs-header-color` to `white`, so in dark mode every header paints itself
	 * #12263F — the page background — and inside a card, which is #152E4D, that reads as a
	 * darker band. The classic theme relies on exactly this for the "Chart" variant below, which forces
	 * `data-bs-theme="dark"` on a single header to get the band while the rest of the page
	 * stays light. Reproducing it here means the Chart variant costs nothing extra.
	 */
	const header = "mb-8 dark:bg-background dark:text-foreground";

	/**
	 * `.header-body`: `padding-block: header-spacing-y` (1.5rem) and the 1px rule that closes
	 * the block. The same two values `PageIntro` carries.
	 */
	const body = "border-b py-6";

	/**
	 * `.container-fluid`, which THREE of the seven variants wrap their header body in — and the
	 * four simpler ones do not. That asymmetry is in the classic theme's markup, and it is worth 36px of
	 * horizontal inset from `md` up.
	 *
	 * READ FROM THE RENDERED PAGE, not derived. The classic framework's own `.container-fluid` is
	 * `calc(var(--bs-gutter-x) * .5)` = 12px, which is what an earlier version of this file
	 * used. The classic theme then triples it in the reference stylesheet:
	 *
	 *   *:has(.navbar-vertical:not([style*="display: none"])) ~ .main-content {
	 *     .container, .container-fluid {
	 *       @include media-breakpoint-up(md) {
	 *         padding-left: (main-content-padding-x + grid-gutter-width * .5) !important;
	 *
	 * 1.5rem + 0.75rem = **36px**, `!important`, on any page that has a vertical navbar — which
	 * is every page in this application. Below `md` the override does not apply and the classic
	 * 12px stands, hence the two steps. The classic `md` and Tailwind's are both 768px, so this
	 * is one of the few breakpoints that needs no adjustment.
	 *
	 * The rule moves with it: `.header-body` is INSIDE the container, so its border-bottom stops
	 * 36px short on both sides. The cover image is the exception — `.header-img-top` is a
	 * SIBLING of the container, so the picture bleeds to the header's full width while
	 * everything under it is inset.
	 */
	const container = "px-3 md:px-9";

	/**
	 * `.header-pretitle` is an `h6`, so it takes `h6-font-size: .625rem` (10px) from the
	 * heading scale, then adds `text-transform: uppercase`, `letter-spacing: .08em`
	 * (`--label-tracking`, the same value the table heads use) and `secondary-color`.
	 *
	 * `mb-[0.5625rem]` is the `h6` margin, `headings-margin-bottom * .5`.
	 */
	const pretitleClass =
		"mb-[0.5625rem] text-[0.625rem] font-medium tracking-label text-muted-foreground uppercase";

	/**
	 * `.header-title` is an `h1` — `1.5rem` below `md` and `h1-font-size: 1.625rem` above,
	 * one of the few responsive type steps in the whole theme — with `margin-bottom: 0`
	 * overriding the heading default. `--text-2xl` already carries `headings-letter-spacing`
	 * and `headings-line-height`, so only the `md` step needs writing out.
	 */
	const titleClass = "mb-0 text-2xl font-medium md:text-[1.625rem]";

	/**
	 * `.header-tabs`: the tabs hang off the bottom of the header body, so the underline of the
	 * active one lands ON the header's rule rather than above it. `-mb-6` is
	 * `calc(var(--bs-header-spacing-y) * -1)`, and the links repay it with `py-6`.
	 *
	 * `.nav-tabs .nav-item { margin-inline: nav-tabs-link-margin-x }` with the first and last
	 * reset — the margin is on the ITEM rather than the link so the mark is exactly as wide as
	 * the label, which is the comment the classic theme leaves on the variable.
	 */
	const tabsList = "-mb-6 flex";
	const tabItem = "mx-3 first:ml-0 last:mr-0";

	/**
	 * A tab link. The reference measures its active border at
	 * `nav-tabs-link-active-border-width: 1px`; this kit overrides that to the house mark — 5px of
	 * `primary` cut on its two top corners, the same drawing `app.css` makes for the `line`
	 * variant. Nothing shifts when the selection moves, because the mark is a pseudo-element
	 * that is always there and only changes colour.
	 *
	 * The resting colour is `nav-tabs-link-color` = `gray-600`, which `--muted-foreground`
	 * holds exactly in light mode. In dark mode `header-tabs-link-color-dark` is `white` for
	 * both the resting and the hover state, so the links stop dimming altogether.
	 *
	 * WHERE THE −1px WENT. The reference puts it on the link —
	 * `.nav-tabs .nav-link { margin-bottom: calc(var(--bs-nav-tabs-border-width) * -1) }`, measured
	 * at -1px on the classic theme's own tabs — to drop a 1px bottom border ONTO the header's rule
	 * rather than leave it a pixel above. A pseudo-element carries its own offset, so the link
	 * keeps no margin and the bar takes the −1px as `after:-bottom-px`: `tabsList`'s `-mb-6`
	 * already lands the link's bottom edge on the top of the rule, and that last pixel seats the
	 * mark across it, replacing the segment rather than doubling it.
	 */
	const tabLink =
		"relative block py-6 text-sm transition-colors text-muted-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-[5px] after:rounded-t-md after:transition-colors hover:text-foreground dark:text-foreground";

	/**
	 * Merged with `cn()` rather than concatenated: it contradicts `text-muted-foreground` above
	 * and paints the bar the base leaves unpainted, and two utilities for the same property on
	 * one unmerged element are settled by Tailwind's sort order instead of by intent.
	 */
	const tabLinkActive = "text-foreground after:bg-primary";

	/** As on the Buttons page: `btn-*` resolved. */
	const btnPrimary = cn(
		buttonVariants(),
		"h-10 rounded-md px-3 text-sm font-normal",
		"border-primary bg-primary text-primary-foreground hover:border-[color-mix(in_srgb,var(--primary)_85%,black)] hover:bg-[color-mix(in_srgb,var(--primary)_85%,black)]",
	);

	const self = href("/components/page-headers");

	/** The audience series behind the "Chart" variant, standing in for the classic theme's Chart.js demo. */
	const audience = [
		{ month: "Jan", users: 5200 },
		{ month: "Feb", users: 5900 },
		{ month: "Mar", users: 5100 },
		{ month: "Apr", users: 6800 },
		{ month: "May", users: 6200 },
		{ month: "Jun", users: 7400 },
		{ month: "Jul", users: 7100 },
		{ month: "Aug", users: 8300 },
		{ month: "Sep", users: 7900 },
		{ month: "Oct", users: 9100 },
		{ month: "Nov", users: 8600 },
		{ month: "Dec", users: 9800 },
	];

	const audienceConfig = {
		users: { label: "Users", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	/** The three figures the classic theme puts inside the chart header's tabs. */
	const audienceTabs = [
		{ label: "Users", value: "73.2k" },
		{ label: "Sessions", value: "92.1k" },
		{ label: "Bounce", value: "50.2%" },
	];

	const navTabs = ["Daily", "Weekly", "Monthly"];
	const projectTabs = ["Overview", "Files", "Reports"];
	const profileTabs = ["Posts", "Groups", "Projects", "Files", "Subscribers"];
</script>

{#snippet pretitle(text: string)}
	<h6 class={pretitleClass}>{text}</h6>
{/snippet}

{#snippet title(text: string)}
	<h1 class={titleClass}>{text}</h1>
{/snippet}

{#snippet tabs(labels: string[], activeLabel: string)}
	<ul class={tabsList}>
		{#each labels as label (label)}
			<li class={tabItem}>
				<a href={self} class={cn(tabLink, label === activeLabel && tabLinkActive)}>
					{label}
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

<!--
	The four avatars the classic theme overlaps in the "Avatar + nav" variant. `.avatar-group` shifts each
	one by a quarter of its own size (`margin-left: calc(var(--bs-avatar-size) * .25 * -1)`),
	which for the 3rem base avatar is -0.75rem.
-->
{#snippet avatarGroup(initials: string[])}
	<div class="flex -space-x-3">
		{#each initials as who (who)}
			<Avatar.Root class="size-12 ring-2 ring-card">
				<Avatar.Fallback>{who}</Avatar.Fallback>
			</Avatar.Root>
		{/each}
	</div>
{/snippet}

{#snippet demo(content: Snippet, contained: boolean)}
	<Card.Root>
		<Card.Content>
			<div class={header}>
				{#if contained}
					<div class={container}>
						<div class={body}>
							{@render content()}
						</div>
					</div>
				{:else}
					<div class={body}>
						{@render content()}
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
{/snippet}

<!--
	The variant snippets are declared HERE, at the top level of the markup, and not inside the
	`<DocSection>` they belong to. A snippet written as a direct child of a component becomes a
	PROP of that component in Svelte 5, so `{#snippet basic()}` inside `<DocSection>` is an
	attempt to pass a `basic` prop it does not accept — `svelte-check` reports exactly that.
-->
{#snippet basic()}
	{@render pretitle("Members")}
	{@render title("Dianna Smiley")}
{/snippet}

{#snippet withButton()}
	<div class="flex items-center gap-6">
		<div class="grow">
			{@render pretitle("Members")}
			{@render title("Dianna Smiley")}
		</div>
		<a href={self} class={btnPrimary}>Subscribe</a>
	</div>
{/snippet}

{#snippet withNav()}
	<!-- `align-items-end`: the tabs sit on the baseline of the header, not beside the title. -->
	<div class="flex items-end gap-6">
		<div class="grow">
			{@render pretitle("Members")}
			{@render title("Dianna Smiley")}
		</div>
		{@render tabs(navTabs, "Daily")}
	</div>
{/snippet}

{#snippet withButtonAndNav()}
	<div class="flex items-end gap-6">
		<div class="grow">
			{@render pretitle("Members")}
			{@render title("Dianna Smiley")}
		</div>
		<a href={self} class={btnPrimary}>Subscribe</a>
	</div>
	<!-- A second row, so the tabs run the full width beneath both columns. -->
	{@render tabs(navTabs, "Daily")}
{/snippet}

{#snippet withAvatars()}
	<div class="flex flex-wrap items-center gap-4">
		<!-- `.avatar-lg.avatar-4by3`: 4rem tall, and 4/3 as wide — the project thumbnail shape. -->
		<Avatar.Root class="h-16 w-[5.3333rem] shrink-0 rounded-md">
			<Avatar.Fallback>HP</Avatar.Fallback>
		</Avatar.Root>
		<div class="grow">
			{@render pretitle("Projects")}
			{@render title("Homepage")}
		</div>
		<div class="flex items-center gap-3">
			{@render avatarGroup(["DS", "AB", "AD", "CF"])}
			<button
				type="button"
				class={cn(
					buttonVariants(),
					"size-12 rounded-full p-0 text-sm font-normal",
					"border-border bg-card text-card-foreground hover:bg-accent dark:hover:bg-background",
				)}
				aria-label="Add member">+</button
			>
		</div>
	</div>
	{@render tabs(projectTabs, "Overview")}
{/snippet}

<DocPage title="Page headers">
	{#snippet subtitle()}
		The block every application page opens with: a pretitle, a title, and an optional row of
		buttons, tabs, avatars or a chart beneath them.
	{/snippet}

	<DocSection title="Basic">
		{#snippet blurb()}
			The smallest header: a preheading over a heading, and nothing else.
		{/snippet}
		{@render demo(basic, false)}
	</DocSection>

	<DocSection title="Button">
		{#snippet blurb()}
			The same header with a primary action on the right.
		{/snippet}
		{@render demo(withButton, false)}
	</DocSection>

	<DocSection title="Nav">
		{#snippet blurb()}
			The header grows a tab row along its bottom border.
		{/snippet}
		{@render demo(withNav, false)}
	</DocSection>

	<DocSection title="Button + nav">
		{#snippet blurb()}
			Action and tab row together — the full everyday header.
		{/snippet}
		{@render demo(withButtonAndNav, false)}
	</DocSection>

	<DocSection title="Avatar + nav">
		{#snippet blurb()}
			An avatar stack joins the heading, over the same tab row.
		{/snippet}
		{@render demo(withAvatars, true)}
	</DocSection>

	<DocSection title="Cover image">
		{#snippet blurb()}
			A cover image over the heading row, with an avatar bridging the two.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class={header}>
					<!--
						`.header-img-top` is `width: 100%; height: auto` on a photograph. The gradient
						below stands in for the missing asset; its height is the only invented number on
						this page.
					-->
					<div class="h-40 w-full bg-gradient-to-r from-primary to-info" aria-hidden="true"></div>
					<!--
						The container starts HERE, after the image: `.header-img-top` is a sibling of
						`.container-fluid` in the classic theme, not a child, so the picture bleeds to the header's
						full width while everything under it is inset by 12px.
					-->
					<div class={container}>
						<!--
							`mt-n5 mt-md-n6` pulls the body up over the image so the avatar straddles it.
							The classic theme's `spacers` is NOT the classic: key 5 is `spacer * 1.5` = 36px and key
							6 is `spacer * 3` = 72px, which are Tailwind's 9 and 18 exactly.
						-->
						<div class="{body} -mt-9 md:-mt-18">
							<div class="flex flex-wrap items-end gap-4">
								<!--
									`.avatar-xxl` is 8rem, and `border border-4 border-card` is the classic theme's own —
									a ring in the card colour, so the avatar punches a hole in the cover image.
								-->
								<Avatar.Root class="size-32 shrink-0 border-4 border-card">
									<Avatar.Fallback class="text-2xl">DS</Avatar.Fallback>
								</Avatar.Root>
								<div class="mb-3 grow">
									{@render pretitle("Members")}
									{@render title("Dianna Smiley")}
								</div>
								<a href={self} class="{btnPrimary} md:mb-3">Subscribe</a>
							</div>
							{@render tabs(profileTabs, "Groups")}
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Chart">
		{#snippet blurb()}
			The header stretched into a chart band under the tab row. The dark band is the header's own
			dark-mode styling, forced on for this one block.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The classic theme writes `data-bs-theme="dark"` here; the equivalent in this codebase is the
					`dark` class, since `@custom-variant dark (&:is(.dark *))` and the token block in
					app.css both key off it. Either way it is a scoped theme switch, not a colour.
				-->
				<div class="dark">
					<div class="{header} pb-9">
						<!-- The container wraps BOTH the body and the footer, so the chart is inset too. -->
						<div class={container}>
							<div class={body}>
								<div class="flex flex-wrap items-end gap-6">
									<div class="grow">
										{@render pretitle("Annual")}
										{@render title("Audience")}
									</div>
									<!--
										The classic theme stacks a pretitle and an `h3` figure inside each tab, so the tab
										row doubles as a stat strip.
									-->
									<ul class={tabsList}>
										{#each audienceTabs as tab, index (tab.label)}
											<li class={tabItem}>
												<a
													href={self}
													class={cn(tabLink, index === 0 && tabLinkActive, "text-center")}
												>
													<span class="{pretitleClass} block">{tab.label}</span>
													<span class="block text-[1.0625rem] font-medium text-foreground">
														{tab.value}
													</span>
												</a>
											</li>
										{/each}
									</ul>
								</div>
							</div>
							<!-- `.header-footer` repeats `header-spacing-y` below the rule; `.chart` is 300px. -->
							<div class="py-6">
								<Chart.Container config={audienceConfig} class="h-[300px] w-full">
									<AreaChart
										data={audience}
										x="month"
										y="users"
										series={[{ key: "users", label: "Users", color: audienceConfig.users.color }]}
										props={{ yAxis: { format: () => "" } }}
									>
										{#snippet marks({ context })}
											{#each context.series.visibleSeries as s (s.key)}
												<Area
													seriesKey={s.key}
													fillOpacity={0.2}
													line={{ class: "stroke-2" }}
													{...s.props}
												/>
											{/each}
										{/snippet}
									</AreaChart>
								</Chart.Container>
							</div>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
