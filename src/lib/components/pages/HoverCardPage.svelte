<script lang="ts">
	import CalendarDaysIcon from "@lucide/svelte/icons/calendar-days";
	import { LinkPreview as HoverCardPrimitive } from "bits-ui";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as HoverCard from "$lib/components/ui/hover-card/index.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import ZapIcon from "@lucide/svelte/icons/zap";
	import { format, formatDistanceToNow } from "date-fns";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";

	/**
	 * The Hover card component page, ported from shadcn-svelte's documentation
	 * (`https://shadcn-svelte.com/docs/components/hover-card`): the profile preview demo at the
	 * top of that page, then its `Usage` pair.
	 *
	 * THE CLASSIC THEME HAS NO HOVER CARD. The reference docs document popovers and tooltips and
	 * nothing else that opens on hover — its popovers are click-triggered
	 * (`data-bs-toggle="popover"` with no `trigger` override), and `data-bs-trigger="hover"`
	 * appears nowhere in the distribution. The single line in the reference stylesheet that acknowledges
	 * the interaction at all is
	 *
	 *   .popover:hover { visibility: visible !important; }
	 *
	 * which keeps an already-open popover alive while the pointer is inside it — the behaviour
	 * bits-ui's `openDelay` / `closeDelay` pair gives this component for free, so both are left
	 * at their defaults. There is no classic timing to port.
	 *
	 * The SURFACE, on the other hand, is `.popover` exactly, so this page reuses the values
	 * derived on the Popovers page rather than re-deriving them: `popover-padding-x/y`, the
	 * 13px `--bs-popover-font-size`, `popover-body-color`, the translucent border and the
	 * two-triangle `.popover-arrow`. The long comments live there; the short ones here name the
	 * variable and move on.
	 *
	 * TWO PROPERTIES HAVE NO ANSWER IN THE CLASSIC THEME and keep shadcn's default:
	 *
	 *   width       `popover-max-width` is 10rem and `.popover-lg` only reaches
	 *               `popover-max-width-lg: 200px`. Neither can hold an avatar beside three
	 *               lines of text, so the profile card keeps the docs' `w-80`. The `Usage`
	 *               example, which really is a label, does take the 10rem cap.
	 *   elevation   `popover-box-shadow` is `0 0 1rem rgba(18,38,63,.03)` — a soft, unoffset
	 *               halo against shadcn's `shadow-md`. Elevation is deferred repo-wide (see the
	 *               `[data-slot='card']` comment in `app.css`), and the Popovers page leaves it
	 *               alone too, so it stays consistent rather than becoming this page's exception.
	 *
	 * The docs demo loads its avatar from `github.com/sveltejs.png`. This repo makes no network
	 * requests at runtime, so it renders the initials fallback instead — which is what every
	 * other avatar in this app already does.
	 */

	/**
	 * The popover surface.
	 *
	 *   px/py       `popover-padding-x: .95rem` / `popover-padding-y: .8rem`, applied to the
	 *               popover itself — the classic theme zeroes `popover-body-padding-*`, so the box owns
	 *               the inset. shadcn's `p-4` is larger on both axes.
	 *   text-xs     `--bs-popover-font-size: 0.8125rem`, i.e. `font-size-sm`, which is what
	 *               `--text-xs` holds here; shadcn's content is `text-sm` (the 15px body size).
	 *   colour      `--bs-popover-body-color` compiles to the literal #95AAC9
	 *               (`body-secondary-color` = `gray-600`); `--muted-foreground` is that value
	 *               in light and the token that plays the role in dark.
	 *   ring        `popover-border-color` is `--bs-border-color-translucent` =
	 *               rgba(18,38,63,.175) in light, and the reference stylesheet's dark block pins it to
	 *               `black` = #12263F, which `--background` holds exactly there. shadcn's own
	 *               `ring-foreground/10` is close in light and wrong in dark.
	 *
	 * `rounded-lg` and `bg-popover` are left alone: `popover-border-radius` is
	 * `border-radius-lg` (0.5rem), which `--radius-lg` carries, and `--bs-popover-bg` is
	 * `white` / `gray-800-dark` — exactly the `--popover` token in both modes.
	 */
	const surface =
		"px-[0.95rem] py-[0.8rem] text-xs text-muted-foreground ring-foreground/[17.5%] dark:ring-background";

	/** The profile panel: `w-80` from the docs, for the reason given in the header comment. */
	const preview = cn(surface, "w-80");

	/** `popover-max-width: 10rem` — the cap the classic theme's own popovers carry. */
	const label = cn(surface, "w-auto max-w-40");

	/**
	 * The trigger is an anchor, and the classic theme's links are plain primary type with no rule
	 * anywhere: `link-color: primary`, `link-decoration: none`, `link-hover-decoration:
	 * none`. So the docs' `hover:underline` is cancelled rather than kept.
	 *
	 * `link-hover-color` is `darken(link-color, 15%)` = #1657AF. `darken()` moves lightness in
	 * HSL, which no CSS function reproduces; the 70/30 mix lands at #1F56A1 and is the same
	 * substitution the Buttons page makes for `.btn-link`.
	 *
	 * The docs outline the focus state in raw black. The classic focus ring — which the classic theme
	 * leaves at its defaults, overriding only `input-btn-focus-*` for form controls — is
	 * `--bs-focus-ring-width: 0.25rem` of `--bs-focus-ring-color: rgba(44,123,229,.25)`, i.e.
	 * `--ring` at 25%, with no offset. `outline-4` is that 0.25rem.
	 */
	const trigger =
		"rounded-sm text-primary no-underline hover:text-[color-mix(in_srgb,var(--primary)_70%,black)] hover:no-underline focus-visible:outline-4 focus-visible:outline-ring/25";

	/**
	 * THE ARROW, the same construction as the Popovers page: bits-ui's `LinkPreview` exports one
	 * (`HoverCardPrimitive.Arrow`) that the generated component does not re-export, so it is
	 * composed in from the primitive rather than by editing `ui/`. It must sit INSIDE the
	 * content — floating-ui's arrow middleware measures it against its own content box.
	 *
	 * `.popover-arrow` is a 16x8 box (`popover-arrow-width: 1rem`, `popover-arrow-height:
	 * .5rem`) holding two CSS triangles: the border colour first, then the background colour 1px
	 * higher, so the outline survives only along the two slanted edges and the join with the
	 * popover's own border stays seamless. bits-ui's default arrow is a single SVG polygon,
	 * which cannot express that; supplying `children` replaces it, and the element is sized by
	 * class because `width`/`height` go unused once it does.
	 */
	const arrow = "block h-2 w-4";

	/** `border-x-8` transparent plus `border-t-8` is a 16x8 downward triangle. */
	const arrowTriangle = "absolute size-0 border-x-8 border-x-transparent border-t-8";

	/*
	 * The sections below are the hover-card demo gallery.
	 * They exercise the same generated component as the shadcn demos above, so they keep the
	 * component's own surface — the classic `.popover` derivation up top stays scoped to the
	 * sections that came from the shadcn docs.
	 */

	/** demo 2 — one card per floating-ui side. */
	const hoverCardSides = ["top", "right", "bottom", "left"] as const;

	/**
	 * demo 7 — a live clock so the "local" row ticks while the card is open.
	 * The upstream demo re-renders every second via `setInterval`; the `$effect` below is the
	 * same wiring with its cleanup.
	 */
	let timestampNow = $state(new Date());

	$effect(() => {
		const timer = setInterval(() => (timestampNow = new Date()), 1000);
		return () => clearInterval(timer);
	});

	/** Static reference time for the "last deployed" example — two hours behind the clock. */
	const timestampReference = $derived(new Date(timestampNow.getTime() - 1000 * 60 * 120));

	/**
	 * Upstream derives the local zone label from `Intl.DateTimeFormat` at render time; the zone
	 * cannot change without a reload, so here it is computed once.
	 */
	const timestampZone =
		Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace("_", " ") || "Local";

	/**
	 * demo 8. The `Badge` variants `success`/`destructive`/`info`/`warning` are
	 * solid pills; the house soft family (`{state}-subtle`, see `docs/CONVENTIONS.md` §3) is the
	 * nearest ramp, and the demo's `size="xs"` has no counterpart — the house Badge is
	 * single-size.
	 */
	const releaseNotes: {
		version: string;
		date: string;
		tag: string;
		tagVariant: BadgeVariant;
		description: string;
	}[] = [
		{
			version: "v3.2.0",
			date: "Feb 5, 2026",
			tag: "Latest",
			tagVariant: "success-subtle",
			description:
				"Added real-time collaboration cursors, improved markdown editor performance, and fixed PDF export layout issues.",
		},
		{
			version: "v3.1.4",
			date: "Jan 22, 2026",
			tag: "Patch",
			tagVariant: "destructive-subtle",
			description:
				"Resolved a memory leak in the dashboard widgets, patched a security vulnerability in file uploads.",
		},
		{
			version: "v3.1.0",
			date: "Jan 10, 2026",
			tag: "Minor",
			tagVariant: "info-subtle",
			description:
				"Introduced API rate limiting dashboard, added webhook retry configuration, and new audit log filters.",
		},
		{
			version: "v3.0.0",
			date: "Dec 15, 2025",
			tag: "Major",
			tagVariant: "warning-subtle",
			description:
				"Complete UI redesign with new component library, migrated to edge runtime, and added multi-tenant workspace support.",
		},
	];

	let releaseNotesCurrent = $state(0);

	const releaseNotesRelease = $derived(releaseNotes[releaseNotesCurrent]);
</script>

<DocPage title="Hover card">
	{#snippet subtitle()}
		For sighted users to preview content available behind a link. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/hover-card"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<HoverCard.Root>
				<HoverCard.Trigger
					href="https://github.com/sveltejs"
					target="_blank"
					rel="noreferrer noopener"
					class={trigger}
				>
					@sveltejs
				</HoverCard.Trigger>
				<!-- `sideOffset={8}` clears the arrow: `popover-arrow-height: .5rem`. -->
				<HoverCard.Content sideOffset={8} class={preview}>
					<div class="flex gap-4">
						<!--
							`size="lg"` is 2.5rem, which is `avatar-size-sm` — the classic theme's inline avatar,
							one step down from `avatar-size-base: 3rem`.

							The fallback keeps shadcn's `bg-muted text-muted-foreground`. The classic theme's
							`.avatar-title` asks for `avatar-title-bg: gray-500` (#B1C2D9) with
							`avatar-title-color: white`, and that grey has no token of its own here —
							`--chart-5` is the only one holding it, under a name that has no business on
							an avatar. Where the gallery does want `.avatar-title` (the Avatar and Empty
							pages), it rebuilds the ground from `--muted-foreground` instead; this inline
							card has no such requirement and keeps shadcn's fallback.
						-->
						<Avatar.Root size="lg">
							<Avatar.Fallback>SK</Avatar.Fallback>
						</Avatar.Root>
						<!-- `gap-1` is `popover-header-margin-bottom: .25rem`, set in the reference stylesheet. -->
						<div class="flex flex-col gap-1">
							<!--
								`.popover-header` in the classic theme's terms: `--bs-popover-header-font-size:
								0.9375rem` (`font-size-base`, i.e. `--text-sm` here) at
								`font-weight-normal` — `.popover` sets `font-weight: 400` and the dark
								block restates it on the header — in `--bs-popover-header-color`, which is
								`inherit` in light and `white` in dark. `--popover-foreground` is both.
								shadcn's demo asks for `font-semibold` instead.
							-->
							<h4 class="text-sm font-normal text-popover-foreground">@sveltejs</h4>
							<p>Cybernetically enhanced web apps.</p>
							<div class="flex items-center gap-2 pt-2">
								<!--
									The classic theme's icons are Feather webfont glyphs, so an inline one is exactly
									the surrounding font-size — `.icon > .fe` only overrides that where the
									icon is the whole component. `size-[1em]` states the same relationship.

									The docs' `opacity-70` is dropped: the icon already sits in
									`popover-body-color` with the text around it, and the classic theme never fades
									a meta icon against its own line.
								-->
								<CalendarDaysIcon class="size-[1em]" />
								<span>Joined September 2022</span>
							</div>
						</div>
					</div>
					<!-- 16 x 8 is `popover-arrow-width` / `popover-arrow-height`. -->
					<HoverCardPrimitive.Arrow class={arrow}>
						<!-- The border triangle, flush with the arrow box. -->
						<span
							class="{arrowTriangle} bottom-0 border-t-foreground/[17.5%] dark:border-t-background"
						></span>
						<!-- The background triangle, 1px higher — it hides all but the slanted edges. -->
						<span class="{arrowTriangle} bottom-px border-t-popover"></span>
					</HoverCardPrimitive.Arrow>
				</HoverCard.Content>
			</HoverCard.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Usage">
		{#snippet blurb()}
			The minimal pair — a trigger and its content. At this width the preview is a label, which is
			the only shape the classic theme's own popovers take.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<HoverCard.Root>
					<HoverCard.Trigger class={trigger}>Hover</HoverCard.Trigger>
					<HoverCard.Content sideOffset={8} class={label}>
						SvelteKit - Web development, streamlined
						<HoverCardPrimitive.Arrow class={arrow}>
							<span
								class="{arrowTriangle} bottom-0 border-t-foreground/[17.5%] dark:border-t-background"
							></span>
							<span class="{arrowTriangle} bottom-px border-t-popover"></span>
						</HoverCardPrimitive.Arrow>
					</HoverCard.Content>
				</HoverCard.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Basic hover card">
		<Card.Root>
			<Card.Content>
				<!-- demo 1 -->
				<div class="flex min-h-[100px] items-center justify-center">
					<HoverCard.Root openDelay={100} closeDelay={100}>
						<HoverCard.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" {...props}>Hover Me</Button>
							{/snippet}
						</HoverCard.Trigger>
						<HoverCard.Content>
							<div class="flex flex-col gap-1">
								<h4 class="leading-none font-medium">Hover Card</h4>
								<p class="text-muted-foreground">
									A basic hover card that appears when you hover over the trigger.
								</p>
							</div>
						</HoverCard.Content>
					</HoverCard.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Hover card with positions">
		<Card.Root>
			<Card.Content>
				<!-- demo 2 -->
				<div class="grid grid-cols-2 gap-2">
					{#each hoverCardSides as side (side)}
						<HoverCard.Root openDelay={100} closeDelay={100}>
							<HoverCard.Trigger>
								{#snippet child({ props })}
									<Button variant="outline" class="flex-1 capitalize" {...props}>
										{side}
									</Button>
								{/snippet}
							</HoverCard.Trigger>
							<HoverCard.Content {side}>
								<div class="flex flex-col gap-1">
									<h4 class="font-medium">Hover Card</h4>
									<p class="text-muted-foreground">
										This hover card appears on the {side} side of the trigger.
									</p>
								</div>
							</HoverCard.Content>
						</HoverCard.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Hover card with icon">
		<Card.Root>
			<Card.Content>
				<!--
					demo 4. The demo paints its bolt `text-amber-500`; raw palette
					colours are off the table here, and `--warning` is the classic theme's amber, so the
					icon takes the token instead.
				-->
				<div class="flex min-h-[100px] items-center justify-center">
					<HoverCard.Root openDelay={100} closeDelay={100}>
						<HoverCard.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" {...props}>Instant Deployment</Button>
							{/snippet}
						</HoverCard.Trigger>
						<HoverCard.Content class="w-80 p-3">
							<div class="flex gap-2">
								<ZapIcon aria-hidden="true" class="mt-0.5 size-4 shrink-0 text-warning" />
								<div class="flex flex-col gap-1">
									<p class="font-medium">Zero Latency Edge</p>
									<p class="leading-relaxed text-muted-foreground">
										Deploy your applications across our global edge network in seconds.
									</p>
								</div>
							</div>
						</HoverCard.Content>
					</HoverCard.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Hover card with an image and text content">
		<Card.Root>
			<Card.Content>
				<!--
					demo 5. The picsum placeholder stays: MediaPlayerPage and
					AspectRatioPage already load from that service, so it is house-approved
					in a way the demo's stock portraits are not.
				-->
				<div class="flex min-h-[100px] items-center justify-center">
					<HoverCard.Root openDelay={100} closeDelay={100}>
						<HoverCard.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" {...props}>View Image</Button>
							{/snippet}
						</HoverCard.Trigger>
						<HoverCard.Content class="w-80 overflow-hidden p-0">
							<img
								src="https://picsum.photos/1000/800?grayscale&random=1"
								alt="Generated landing page preview"
								class="aspect-video w-full object-cover"
							/>
							<div class="flex flex-col gap-1 p-3">
								<p class="font-medium">Image Overview</p>
								<p class="leading-relaxed text-muted-foreground">
									Visual overview of generated landing page.
								</p>
							</div>
						</HoverCard.Content>
					</HoverCard.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Hover card inside a dialog">
		{#snippet blurb()}
			The card portals above the dialog's overlay, so opening it inside one needs no extra wiring.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 6 -->
				<div class="flex items-center justify-center">
					<Dialog.Root>
						<Dialog.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" {...props}>Open Dialog</Button>
							{/snippet}
						</Dialog.Trigger>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>Hover Card Example</Dialog.Title>
								<Dialog.Description>
									Hover over the button below to see the hover card.
								</Dialog.Description>
							</Dialog.Header>
							<HoverCard.Root openDelay={100} closeDelay={100}>
								<HoverCard.Trigger>
									{#snippet child({ props })}
										<Button variant="outline" class="w-fit" {...props}>Hover me</Button>
									{/snippet}
								</HoverCard.Trigger>
								<HoverCard.Content>
									<div class="flex flex-col gap-1">
										<h4 class="font-medium">Hover Card</h4>
										<p class="text-muted-foreground">
											This hover card appears inside a dialog. Hover over the button to see it.
										</p>
									</div>
								</HoverCard.Content>
							</HoverCard.Root>
						</Dialog.Content>
					</Dialog.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Timestamp hover card with active relative time">
		{#snippet blurb()}
			The trigger reads as prose; the card resolves the relative time into UTC and the viewer's own
			zone, with the local row ticking live.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 7 -->
				<div class="flex min-h-[100px] items-center justify-center">
					<p class="text-sm text-muted-foreground">
						Last deployed
						<HoverCard.Root openDelay={100} closeDelay={100}>
							<HoverCard.Trigger
								class="cursor-default text-foreground underline decoration-dashed decoration-1 underline-offset-4"
							>
								{formatDistanceToNow(timestampReference, { addSuffix: true })}
							</HoverCard.Trigger>
							<HoverCard.Content class="w-78 p-0">
								<p class="px-2 py-1 font-medium text-foreground">
									{formatDistanceToNow(timestampReference, { addSuffix: true })}
								</p>
								<Separator />
								<div class="px-2 py-1.5">
									<table>
										<tbody>
											<tr>
												<td class="pr-4 pb-1.5"><Badge variant="outline">UTC</Badge></td>
												<td class="pr-6 pb-1.5">{format(timestampReference, "MMM d, yyyy")}</td>
												<td class="pb-1.5 text-muted-foreground">
													{format(timestampReference, "hh:mm:ss a")}
												</td>
											</tr>
											<tr>
												<td class="pr-4">
													<span class="rounded bg-muted px-1.5 py-0.5 font-medium">
														{timestampZone}
													</span>
												</td>
												<td class="pr-6">{format(timestampNow, "MMM d, yyyy")}</td>
												<td class="w-28 text-muted-foreground">
													{format(timestampNow, "hh:mm:ss a")}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</HoverCard.Content>
						</HoverCard.Root>
						by CI/CD pipeline.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Hover card with paginated release notes">
		{#snippet blurb()}
			The longer <code>closeDelay</code> keeps the card open while the pointer travels to its pager buttons.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 8. The demo's 24px pager buttons are `size="icon"` squeezed
					to `size-6`; the house ramp already has that square as `icon-xs`, which also
					sizes the arrows itself — so the icons carry no classes of their own.
				-->
				<div class="flex min-h-[100px] items-center justify-center">
					<HoverCard.Root openDelay={100} closeDelay={200}>
						<HoverCard.Trigger
							class="cursor-default text-sm font-medium text-primary underline decoration-dashed decoration-1 underline-offset-4"
						>
							What's new?
						</HoverCard.Trigger>
						<HoverCard.Content class="flex w-72 flex-col gap-1 px-3 pt-3 pb-2">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="font-semibold">{releaseNotesRelease.version}</span>
									<Badge variant={releaseNotesRelease.tagVariant}>{releaseNotesRelease.tag}</Badge>
								</div>
								<span class="text-muted-foreground">{releaseNotesRelease.date}</span>
							</div>
							<p class="leading-relaxed text-muted-foreground">
								{releaseNotesRelease.description}
							</p>
							<div class="flex items-center justify-between">
								<div class="flex gap-1">
									{#each releaseNotes as release, i (release.version)}
										<span
											class={cn(
												"size-1.5 rounded-full transition-colors",
												i === releaseNotesCurrent ? "bg-primary" : "bg-muted-foreground/30",
											)}
										></span>
									{/each}
								</div>
								<div class="flex gap-0.5">
									<Button
										aria-label="Previous release"
										size="icon-xs"
										variant="ghost"
										disabled={releaseNotesCurrent === 0}
										onclick={() => (releaseNotesCurrent = Math.max(0, releaseNotesCurrent - 1))}
									>
										<ArrowLeftIcon aria-hidden="true" />
									</Button>
									<Button
										aria-label="Next release"
										size="icon-xs"
										variant="ghost"
										disabled={releaseNotesCurrent === releaseNotes.length - 1}
										onclick={() =>
											(releaseNotesCurrent = Math.min(
												releaseNotes.length - 1,
												releaseNotesCurrent + 1,
											))}
									>
										<ArrowRightIcon aria-hidden="true" />
									</Button>
								</div>
							</div>
						</HoverCard.Content>
					</HoverCard.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
