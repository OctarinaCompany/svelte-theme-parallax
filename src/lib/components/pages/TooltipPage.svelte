<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
	import BellIcon from "@lucide/svelte/icons/bell";
	import BoldIcon from "@lucide/svelte/icons/bold";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import ImageIcon from "@lucide/svelte/icons/image";
	import InfoIcon from "@lucide/svelte/icons/info";
	import ItalicIcon from "@lucide/svelte/icons/italic";
	import LockIcon from "@lucide/svelte/icons/lock";
	import SaveIcon from "@lucide/svelte/icons/save";
	import TagIcon from "@lucide/svelte/icons/tag";
	import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
	import UnderlineIcon from "@lucide/svelte/icons/underline";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Kbd from "$lib/components/ui/kbd/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Tooltip component page.
	 *
	 * The classic theme documents one card of four placements, so this page has no `DocSection`s.
	 */

	/** `.btn-secondary` at the base size, as derived on the Button page. */
	const trigger = cn(
		buttonVariants(),
		"h-10 rounded-md px-3 text-sm font-normal",
		"border-muted-foreground bg-muted-foreground text-primary-foreground hover:border-[color-mix(in_srgb,var(--muted-foreground)_85%,black)] hover:bg-[color-mix(in_srgb,var(--muted-foreground)_85%,black)]",
	);

	/**
	 * Only the geometry is stated here; the SURFACE is one rule in `app.css`, on
	 * `[data-slot='tooltip-content']`.
	 *
	 * The classic theme inverts the classic dark tooltip — `tooltip-bg: gray-300` with
	 * `tooltip-color: black` and `tooltip-opacity: 1` — and this page used to port that
	 * literally, which gave the app a third floating ground beside the white popovers and
	 * dropdowns. The tooltip now takes the popover's surface instead. That is a deliberate
	 * departure from the classic theme's value, recorded at the rule.
	 *
	 * What remains is the classic theme's, and shadcn already matches most of it: `tooltip-max-width:
	 * 200px` against shadcn's `max-w-xs`, and `.tooltip-inner`'s `text-align: center`. The
	 * padding and radius need nothing — `px-3 py-1.5 rounded-md text-xs` already IS
	 * `tooltip-padding-x/y`, `tooltip-border-radius` and `tooltip-font-size`.
	 */
	const content = "max-w-[200px] text-center";

	const placements = [
		{ side: "top", label: "Tooltip on top" },
		{ side: "right", label: "Tooltip on right" },
		{ side: "bottom", label: "Tooltip on bottom" },
		{ side: "left", label: "Tooltip on left" },
	] as const;

	/**
	 * Everything below the placements card is the tooltip pattern appendix. The first
	 * two examples — a basic tooltip and a grid of the four sides — are not ported: the classic
	 * card above already shows exactly that, plain text tooltips on buttons at every placement.
	 *
	 * Three standing substitutions, the same family the Filters page records at length:
	 *
	 * - Solid `success`/`info`/`warning` badges become the house `{state}-subtle` variants
	 *   (docs/CONVENTIONS.md §3), and the badge `size` prop disappears — the house Badge has
	 *   one size, so count chips keep the default pill and only their positioning classes.
	 * - `opacity-80` secondary text becomes `text-muted-foreground`. Upstream dims with opacity
	 *   because its tooltip is a dark chip with no secondary token on it; this app's tooltip takes
	 *   the popover surface (see the rule on `[data-slot='tooltip-content']` in `app.css`), where
	 *   the muted token exists and measures correctly.
	 * - Raw palette colours become status tokens (`bg-green-500` → `bg-success`,
	 *   `text-emerald-600` → `text-success`), and the stock portraits become initials
	 *   fallbacks — this repository ships no photographs, the same substitution the Filters and
	 *   Avatar pages make.
	 */
</script>

<DocPage title="Tooltip">
	{#snippet subtitle()}
		Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/tooltip"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content class="flex flex-wrap gap-2">
			<!--
				One provider around all four: it owns the shared open/close timing, and the classic
				tooltips have no delay, which `delayDuration={0}` reproduces.
			-->
			<Tooltip.Provider delayDuration={0}>
				{#each placements as placement (placement.side)}
					<Tooltip.Root>
						<Tooltip.Trigger class={trigger}>{placement.label}</Tooltip.Trigger>
						<Tooltip.Content side={placement.side} class={content}>
							{placement.label}
						</Tooltip.Content>
					</Tooltip.Root>
				{/each}
			</Tooltip.Provider>
		</Card.Content>
	</Card.Root>

	<DocSection title="Tooltip with icon trigger">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button variant="ghost" size="icon" aria-label="More information" {...props}>
									<InfoIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content class="text-center">
							Additional information and help context.
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip with keyboard shortcut">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!--
					demo 4 pads the panel with `pr-1.5` by hand; the house content already
					does that itself through `has-data-[slot=kbd]:pr-1.5`, so no class is needed.
				-->
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="icon-sm" aria-label="Save" {...props}>
									<SaveIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>
							Save Changes <Kbd.Root>S</Kbd.Root>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip on notification bell with badge count">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!--
					demo 5 titles this a notification bell and labels it "Notifications" but
					renders an info glyph — the icon here follows the demo's own words instead.
				-->
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="icon" aria-label="Notifications" {...props}>
									<div class="relative">
										<BellIcon />
										<Badge variant="destructive" class="absolute -top-3.5 -right-3.5">3</Badge>
									</div>
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content class="p-3">
							<div class="flex flex-col gap-2">
								<div class="flex items-center justify-between gap-2">
									<span class="font-medium">Notifications</span>
									<Badge variant="destructive">3 new</Badge>
								</div>
								<div class="flex flex-col gap-1 text-muted-foreground">
									<p>• Sarah commented on your PR</p>
									<p>• Build #421 completed</p>
									<p>• New team member joined</p>
								</div>
								<!--
									The link points at this page's own route, not upstream's `href="#"` — the
									same substitution the Input page documents for its demo links.
								-->
								<a
									href="#/components/tooltip"
									class="flex items-center gap-1 font-medium underline underline-offset-2"
								>
									View all
									<ArrowRightIcon class="size-3.5" />
								</a>
							</div>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip with status badge">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" {...props}>System Status</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content class="p-2">
							<div class="flex flex-col gap-2">
								<div class="flex items-center justify-between gap-4">
									<span class="font-medium">API</span>
									<Badge variant="success-subtle">Operational</Badge>
								</div>
								<div class="flex items-center justify-between gap-4">
									<span class="font-medium">Database</span>
									<Badge variant="info-subtle">Operational</Badge>
								</div>
								<div class="flex items-center justify-between gap-4">
									<span class="font-medium">CDN</span>
									<Badge variant="warning-subtle">Degraded</Badge>
								</div>
								<p class="text-[10px] text-muted-foreground">Updated 2 min ago</p>
							</div>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip with icon and description">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<Tooltip.Provider>
					<p class="text-sm">
						Verified domain
						<Tooltip.Root>
							<Tooltip.Trigger
								class="align-middle text-muted-foreground"
								aria-label="Domain verification details"
							>
								<BadgeCheckIcon class="size-4 text-success" aria-hidden="true" />
							</Tooltip.Trigger>
							<Tooltip.Content>
								<Badge variant="success-subtle">Verified</Badge>
								Domain ownership has been confirmed.
							</Tooltip.Content>
						</Tooltip.Root>
					</p>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toolbar with tooltip actions">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<Tooltip.Provider>
					<div class="flex items-center gap-1">
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button variant="ghost" size="icon-sm" aria-label="Bold" {...props}>
										<BoldIcon aria-hidden="true" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Bold</Tooltip.Content>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button variant="ghost" size="icon-sm" aria-label="Italic" {...props}>
										<ItalicIcon aria-hidden="true" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Italic</Tooltip.Content>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button variant="ghost" size="icon-sm" aria-label="Underline" {...props}>
										<UnderlineIcon aria-hidden="true" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Underline</Tooltip.Content>
						</Tooltip.Root>
						<div class="flex items-center">
							<Separator orientation="vertical" class="mx-1 h-5" />
						</div>
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button variant="ghost" size="icon-sm" aria-label="Image" {...props}>
										<ImageIcon aria-hidden="true" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Insert Image</Tooltip.Content>
						</Tooltip.Root>
					</div>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip with warning badge">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="icon" aria-label="Warning" {...props}>
									<TriangleAlertIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>
							<TriangleAlertIcon class="size-4 shrink-0" />
							This action cannot be undone
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip with feature badge and upgrade link">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!--
					demo 10 gives the upgrade button a `border-border/40` edge so it does not
					fuse with a dark tooltip chip; on the popover surface here the default
					primary button already separates, so the class goes.
				-->
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="icon" aria-label="Pro feature" {...props}>
									<LockIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content class="max-w-64 p-3">
							<div class="flex flex-col gap-1.5">
								<div class="flex items-center gap-2">
									<span class="text-sm font-semibold">Advanced Analytics</span>
									<Badge variant="success-subtle">Pro</Badge>
								</div>
								<p class="text-muted-foreground">
									Unlock detailed insights, custom reports, and real-time dashboards.
								</p>
								<Button size="sm">
									Upgrade to Pro
									<ArrowRightIcon data-icon="inline-end" />
								</Button>
							</div>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip with avatar and role badge">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!--
					demo 11 captions the portrait "Emma Wilson" but its fallback still reads
					"SC" — the initials here follow the name.
				-->
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger class="rounded-full" aria-label="Emma Wilson">
							<Avatar.Root>
								<Avatar.Fallback>EW</Avatar.Fallback>
							</Avatar.Root>
						</Tooltip.Trigger>
						<Tooltip.Content class="gap-2 p-2">
							<Avatar.Root>
								<Avatar.Fallback>EW</Avatar.Fallback>
							</Avatar.Root>
							<div class="flex flex-col gap-0.5">
								<div class="flex items-center gap-1">
									<span class="font-semibold">Emma Wilson</span>
									<Badge variant="info-subtle">Admin</Badge>
								</div>
								<p class="text-muted-foreground">emma@example.com</p>
							</div>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip on disabled button with wrapper">
		{#snippet blurb()}
			A disabled button swallows pointer events, so the tooltip listens on a wrapper
			<code>span</code> instead.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex justify-center">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<span class="cursor-not-allowed" {...props}>
									<Button variant="outline" disabled>Delete Project</Button>
								</span>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>You need admin access to delete projects</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip with online status indicator">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!--
					demo 13 hand-rolls the presence dot as an absolutely positioned span;
					the house Avatar has a Badge part for exactly that, so the dot uses it and only
					restates the ground as `bg-success`.
				-->
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger class="rounded-full" aria-label="James Davis">
							<Avatar.Root>
								<Avatar.Fallback>JD</Avatar.Fallback>
								<Avatar.Badge class="bg-success" />
							</Avatar.Root>
						</Tooltip.Trigger>
						<Tooltip.Content class="gap-2 p-2">
							<Avatar.Root>
								<Avatar.Fallback>JD</Avatar.Fallback>
							</Avatar.Root>
							<div class="flex flex-col gap-0.5">
								<span class="text-sm font-medium">James Davis</span>
								<div class="flex items-center gap-1.5 text-muted-foreground">
									<span class="block size-1.5 shrink-0 rounded-full bg-success"></span>
									Online now
								</div>
							</div>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip with file info and badges">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger
							class="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
						>
							<div class="flex items-center gap-1">
								<FileTextIcon class="size-4" aria-hidden="true" />
								<span class="text-sm">report-q4.pdf</span>
							</div>
						</Tooltip.Trigger>
						<Tooltip.Content class="p-3">
							<div class="flex flex-col gap-2">
								<div class="flex items-center gap-2">
									<div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
										<FileTextIcon class="size-4 text-muted-foreground" aria-hidden="true" />
									</div>
									<div class="flex flex-col gap-0.5">
										<span class="font-medium">report-q4.pdf</span>
										<span class="text-muted-foreground">2.4 MB &middot; Uploaded 3 days ago</span>
									</div>
								</div>
								<div class="flex items-center gap-1.5">
									<Badge variant="info-subtle">PDF</Badge>
									<Badge variant="success-subtle">Verified</Badge>
								</div>
							</div>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip with label badges">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger
							class="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
						>
							<div class="flex items-center gap-1.5 text-sm">
								<TagIcon class="size-3.5" aria-hidden="true" />
								3 labels
							</div>
						</Tooltip.Trigger>
						<Tooltip.Content class="p-3">
							<div class="flex flex-col gap-2">
								<span class="font-medium">Labels</span>
								<div class="flex items-center gap-1.5">
									<Badge variant="destructive">Bug</Badge>
									<Badge variant="info-subtle">Frontend</Badge>
									<Badge variant="warning-subtle">High Priority</Badge>
								</div>
							</div>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip with action button inside">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button variant="ghost" size="icon" aria-label="Notifications" {...props}>
									<div class="relative">
										<BellIcon />
										<span class="absolute -top-1 -right-1 block size-2 rounded-full bg-destructive"
										></span>
									</div>
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>
							<div class="flex flex-col gap-1.5">
								<p class="font-medium">3 new notifications</p>
								<a href="#/components/tooltip" class="font-medium underline underline-offset-2"
									>View all &rarr;</a
								>
							</div>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
