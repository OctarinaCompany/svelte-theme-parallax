<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Empty from "$lib/components/ui/empty/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import * as Item from "$lib/components/ui/item/index.js";
	import {
		ICON_TILE_SIZES,
		ICON_TILE_VARIANTS,
		IconTile,
	} from "$lib/components/ui/icon-tile/index.js";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import ClockIcon from "@lucide/svelte/icons/clock";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import ImageIcon from "@lucide/svelte/icons/image";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";
	import PackageIcon from "@lucide/svelte/icons/package";
	import Settings2Icon from "@lucide/svelte/icons/settings-2";
	import StarIcon from "@lucide/svelte/icons/star";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Table from "$lib/components/ui/table/index.js";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Icon tile component page — its seventeen examples in the order
	 * that page gives them: demo 1 through demo 17.
	 *
	 * THE CLASSIC THEME HAS A NEAR COUNTERPART, AND IT IS THE AVATAR. `.avatar > .avatar-title` is the
	 * theme's rounded square with a tinted ground carrying an icon or two initials, and it is what
	 * the classic theme puts in the first column of a list row or at the top of a feature card
	 * (§16 of the theme notes, the Avatar row). What it does not have is the tile's second
	 * container: no classic mark draws a ring around an inset card, which is what the `frame` and
	 * `soft` variants are for. Those two are the component's own, and
	 * `$lib/components/ui/icon-tile/icon-tile.svelte` records how upstream's four CSS variables and
	 * its `::after` inner card were translated.
	 *
	 * FOUR THINGS DIVERGE FROM UPSTREAM, ALL OF THEM THIS REPOSITORY'S STANDING RULES:
	 *
	 * 1. THE ICONS ARE LIBRARY-AGNOSTIC. The demos assume an `<IconPlaceholder>`, a
	 *    documentation shim that resolves to whichever icon pack the reader picked. This repository
	 *    is Lucide throughout, so each placeholder becomes its `lucide` prop: `FolderIcon`,
	 *    `PackageIcon`, `LayoutDashboardIcon`, `GlobeIcon`, `StarIcon`, `CircleCheckIcon`,
	 *    `ImageIcon`, `Settings2Icon`, `ClockIcon`, `CircleAlertIcon`, `FileTextIcon`,
	 *    `MessageSquareIcon`.
	 *
	 * 2. THE TONE CLASSES LOSE THEIR `-foreground` HALF. Upstream tints a tile with
	 *    `text-success-foreground dark:text-success`, which reads because in its palette
	 *    `--success-foreground` is a dark, legible green. Here `--*-foreground` is the contrast
	 *    colour ON the solid fill — white for success, info and destructive, `gray-900` for
	 *    warning (`src/app.css`) — so that pairing would print white type on a pale ground. Every
	 *    tone below therefore collapses to `text-{state}`, which is exactly the pairing Badge's
	 *    `{state}-subtle` variants already use, and the `dark:` halves keep only the ground.
	 *
	 * 3. "BRAND COLORS" IS PAINTED IN TOKENS. Upstream fills those four tiles with
	 *    `bg-indigo-500`, `bg-amber-500`, `bg-emerald-600` and `bg-rose-500` plus `text-white`.
	 *    Raw palette colours are forbidden here, so the four fills are the theme's own solid
	 *    grounds. The example still demonstrates what it is for: an `elevated` tile keeps its
	 *    background-coloured ring and its shadow while the fill underneath is overridden.
	 *
	 * 4. THE `size-*` CLASSES ON TWO ICONS ARE DELIBERATE. The house rule is that a component sizes
	 *    the icons it owns. The tile does — `[&_svg:not([class*=size-])]:size-(--icon-tile-icon-size)`
	 *    — and that `:not()` is a documented escape hatch: an icon that carries its own `size-*`
	 *    opts out. "Custom sizing" is the example that exists to show it, next to the variable-based
	 *    way of doing the same thing without touching the icon.
	 */

	/** demo 6 — the three surfaces upstream shows as circles. */
	const circularTiles = [
		{ variant: "outline", label: "Outline", icon: GlobeIcon },
		{ variant: "elevated", label: "Elevated", icon: StarIcon },
		{ variant: "frame", label: "Frame", icon: CircleCheckIcon },
	] as const;

	/**
	 * demo 8 — four semantic tones on the `outline` surface. The `dark:` halves are
	 * upstream's and are load-bearing twice over: they deepen the wash where the page ground is
	 * dark, and they restate `bg-*` under the `dark:` modifier, which is what displaces the
	 * variant's own `dark:bg-input/32` (a `bg-*` utility with no modifier cannot).
	 */
	const toneTiles = [
		{
			label: "Primary",
			icon: StarIcon,
			class:
				"border-primary/10 bg-primary/10 text-primary dark:border-primary/25 dark:bg-primary/15",
		},
		{
			label: "Success",
			icon: CircleCheckIcon,
			class:
				"border-success/15 bg-success/10 text-success dark:border-success/25 dark:bg-success/15",
		},
		{
			label: "Warning",
			icon: ClockIcon,
			class:
				"border-warning/15 bg-warning/10 text-warning dark:border-warning/25 dark:bg-warning/15",
		},
		{
			label: "Destructive",
			icon: CircleAlertIcon,
			class:
				"border-destructive/15 bg-destructive/10 text-destructive dark:border-destructive/25 dark:bg-destructive/15",
		},
	];

	/**
	 * demo 15 — the `soft` variant derives every fill and border from `currentColor`,
	 * so one text colour retints the whole tile. An empty class keeps the `text-primary` default.
	 */
	const softTones = [
		{ label: "Primary", class: "" },
		{ label: "Info", class: "text-info" },
		{ label: "Success", class: "text-success" },
		{ label: "Warning", class: "text-warning" },
		{ label: "Destructive", class: "text-destructive" },
	];

	/**
	 * demo 16 — the `solid` variant is a filled tone with a contrasting glyph, so a
	 * tone is a `bg-*` plus the foreground token that goes with it. Empty keeps the primary pair.
	 */
	const solidTones = [
		{ label: "Primary", class: "" },
		{ label: "Info", class: "bg-info text-info-foreground" },
		{ label: "Success", class: "bg-success text-success-foreground" },
		{ label: "Warning", class: "bg-warning text-warning-foreground" },
		{ label: "Destructive", class: "bg-destructive text-destructive-foreground" },
	];

	/**
	 * The component's own surface, for the API reference at the foot of the page.
	 *
	 * A house component has no upstream page to defer to, so the props are written down here —
	 * read off `$lib/components/ui/icon-tile/icon-tile.svelte`, the only other place they exist.
	 */
	const iconTileProps = [
		{
			prop: "ref",
			type: "HTMLSpanElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Stays `null` in `child` mode.",
		},
		{
			prop: "variant",
			type: "'outline' | 'elevated' | 'soft' | 'solid' | 'frame'",
			default: "'outline'",
			description:
				"The tile's surface. `soft` and `solid` derive every fill from `currentColor`, so one text-colour class retints the whole tile.",
		},
		{
			prop: "size",
			type: "'xs' | 'sm' | 'default' | 'lg' | 'xl'",
			default: "'default'",
			description:
				"24 / 32 / 40 / 48 / 56px. Sets the tile, the glyph and the inset together, so the tile reads as the same object at every step.",
		},
		{
			prop: "radius",
			type: "'default' | 'full'",
			default: "'default'",
			description:
				"`full` is a circle. `default` is the theme radius clamped to a third of the tile, so a small tile does not round itself into one by accident.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the variant classes and the four variables below.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The glyph. An `svg` with no `size-*` class of its own takes `--icon-tile-icon-size`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description:
				"Render the tile onto your own element — an `<a>`, say — and spread the merged props onto it. `children` is not rendered in this mode.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes",
			default: "—",
			description: "Spread onto the element, so `id`, `aria-*` and event handlers pass through.",
		},
	];

	const iconTileVariables = [
		{
			name: "--icon-tile-size",
			default: "set by size",
			description: "The tile's width and height.",
		},
		{
			name: "--icon-tile-icon-size",
			default: "set by size",
			description: "Applied to any child svg that carries no size class of its own.",
		},
		{
			name: "--icon-tile-radius",
			default: "set by radius",
			description:
				"The corner. The inner card of `soft` and `frame` derives its own radius from this one.",
		},
		{
			name: "--icon-tile-inset",
			default: "set by size",
			description: "The gap between the outer ring and the inner card, on `soft` and `frame`.",
		},
	];

	/** demo 17, with upstream's four Tailwind hues replaced by the theme's grounds. */
	const brandTiles = [
		{ label: "Primary", icon: StarIcon, class: "bg-primary text-primary-foreground" },
		{ label: "Info", icon: MessageSquareIcon, class: "bg-info text-info-foreground" },
		{ label: "Success", icon: Settings2Icon, class: "bg-success text-success-foreground" },
		{
			label: "Destructive",
			icon: CircleAlertIcon,
			class: "bg-destructive text-destructive-foreground",
		},
	];
</script>

<DocPage title="Icon tile">
	{#snippet subtitle()}
		A small framed container for a single icon — the mark that leads a list row, a feature card or
		an empty state, in five surfaces, five sizes and two corner treatments.
	{/snippet}

	<DocSection title="Default icon tile">
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<IconTile aria-hidden="true">
						<FolderIcon />
					</IconTile>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Elevated icon tile">
		{#snippet blurb()}
			A muted fill inside a background-coloured ring, with a hairline shadow — the surface that
			reads as a physical chip against a card.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<IconTile variant="elevated" aria-hidden="true">
						<PackageIcon />
					</IconTile>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Framed icon tile">
		{#snippet blurb()}
			The double container: a muted ring around an inset card, drawn with an <code>::after</code>
			pseudo-element rather than a second node.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<IconTile variant="frame" aria-hidden="true">
						<LayoutDashboardIcon />
					</IconTile>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="All variants">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center justify-center gap-6">
					{#each ICON_TILE_VARIANTS as variant (variant)}
						<div class="flex flex-col items-center gap-2">
							<IconTile {variant} aria-hidden="true">
								<PackageIcon />
							</IconTile>
							<span class="text-sm text-muted-foreground">{variant}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sizes">
		{#snippet blurb()}
			Each step sets the tile, the glyph and the inner inset together, so a tile keeps its
			proportions as it scales.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-end justify-center gap-6">
					{#each ICON_TILE_SIZES as size (size)}
						<div class="flex flex-col items-center gap-2">
							<IconTile variant="elevated" {size} aria-hidden="true">
								<PackageIcon />
							</IconTile>
							<span class="text-sm text-muted-foreground">{size}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Circular tiles">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center justify-center gap-6">
					{#each circularTiles as tile (tile.label)}
						{@const TileIcon = tile.icon}
						<div class="flex flex-col items-center gap-2">
							<IconTile variant={tile.variant} size="lg" radius="full" aria-hidden="true">
								<TileIcon />
							</IconTile>
							<span class="text-sm text-muted-foreground">{tile.label}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom sizing">
		{#snippet blurb()}
			Two ways to leave the size ramp: a plain <code>size-*</code> on the tile, with the icon opting out
			of the tile's glyph size by carrying its own — or overriding the two variables the ramp sets, which
			needs nothing on the icon at all.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center justify-center gap-6">
					<IconTile variant="elevated" class="size-14" aria-hidden="true">
						<!-- `size-7` is what makes the tile's `:not([class*=size-])` rule stand down. -->
						<ImageIcon class="size-7" />
					</IconTile>
					<IconTile
						variant="elevated"
						class="[--icon-tile-icon-size:--spacing(7)] [--icon-tile-size:--spacing(14)]"
						aria-hidden="true"
					>
						<Settings2Icon />
					</IconTile>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Color tones">
		{#snippet blurb()}
			The <code>outline</code> surface tinted by hand: a token wash for the ground and border, and the
			full-strength state colour as the glyph.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center justify-center gap-6">
					{#each toneTiles as tone (tone.label)}
						{@const ToneIcon = tone.icon}
						<div class="flex flex-col items-center gap-2">
							<IconTile class={tone.class} aria-hidden="true">
								<ToneIcon />
							</IconTile>
							<span class="text-sm text-muted-foreground">{tone.label}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Text content">
		{#snippet blurb()}
			The tile holds any short node, not only an icon — initials, or a count.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center gap-3">
					<IconTile variant="elevated" class="text-xs font-medium">AK</IconTile>
					<IconTile
						variant="outline"
						radius="full"
						class="text-xs font-medium text-muted-foreground">12</IconTile
					>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="List row">
		{#snippet blurb()}
			A <code>sm</code> tile as the media column of an <code>Item</code> — the shape a list row takes
			when its leading glyph needs a ground of its own rather than sitting bare.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-sm items-center justify-center">
					<Item.Root variant="outline">
						<Item.Media>
							<IconTile variant="elevated" size="sm" aria-hidden="true">
								<FileTextIcon />
							</IconTile>
						</Item.Media>
						<Item.Content>
							<Item.Title>Quarterly report</Item.Title>
							<Item.Description>Updated 2 hours ago by Anna</Item.Description>
						</Item.Content>
					</Item.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Feature card">
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<Frame.Root class="w-full max-w-xs">
						<Frame.Panel class="flex flex-col gap-3">
							<IconTile variant="elevated" size="lg" aria-hidden="true">
								<LayoutDashboardIcon />
							</IconTile>
							<div class="flex flex-col gap-1">
								<h3 class="text-sm font-medium">Unified dashboard</h3>
								<p class="text-xs text-muted-foreground">
									Track every project, deployment and metric from a single workspace.
								</p>
							</div>
						</Frame.Panel>
					</Frame.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Empty state">
		{#snippet blurb()}
			An <code>xl</code> framed tile as <code>Empty.Media</code>, which is transparent by default
			and so leaves the tile to draw the whole mark.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<Empty.Root>
						<Empty.Header>
							<Empty.Media>
								<IconTile variant="frame" size="xl" aria-hidden="true">
									<FolderIcon />
								</IconTile>
							</Empty.Media>
							<Empty.Title>No files yet</Empty.Title>
							<Empty.Description>
								Upload a file to get started. Everything you add shows up here.
							</Empty.Description>
						</Empty.Header>
					</Empty.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Interactive tile">
		{#snippet blurb()}
			The <code>child</code> snippet renders the tile onto an element of your own — here an anchor, which
			is what makes it focusable and gives the hover and focus ring something to attach to.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<IconTile
						variant="elevated"
						class="transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					>
						{#snippet child({ props })}
							<!--
								The link points at this page's own route, not upstream's `href="#"` — a link that
								goes nowhere reads as a dead gallery. The Breadcrumb page's standing correction.
							-->
							<a href={href("/components/icon-tile")} aria-label="Open settings" {...props}>
								<Settings2Icon aria-hidden="true" />
							</a>
						{/snippet}
					</IconTile>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Status overlay">
		{#snippet blurb()}
			A status dot pinned to the tile's corner, cut out of the page with a background-coloured
			border — the same treatment the avatar's own dot gets.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<span class="relative inline-flex" aria-hidden="true">
						<IconTile variant="elevated">
							<GlobeIcon />
						</IconTile>
						<span
							class="absolute -end-0.5 -top-0.5 size-3 rounded-full border-2 border-background bg-success"
						></span>
					</span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Soft tones">
		{#snippet blurb()}
			Ground, inner card and border all come from <code>currentColor</code>, so one text colour
			retints the whole tile.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center justify-center gap-6">
					{#each softTones as tone (tone.label)}
						<div class="flex flex-col items-center gap-2">
							<IconTile variant="soft" class={tone.class} aria-hidden="true">
								<StarIcon />
							</IconTile>
							<span class="text-sm text-muted-foreground">{tone.label}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Solid tones">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center justify-center gap-6">
					{#each solidTones as tone (tone.label)}
						<div class="flex flex-col items-center gap-2">
							<IconTile variant="solid" class={tone.class} aria-hidden="true">
								<CircleCheckIcon />
							</IconTile>
							<span class="text-sm text-muted-foreground">{tone.label}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Brand colors">
		{#snippet blurb()}
			The <code>elevated</code> surface keeps its ring and shadow while the fill underneath is overridden
			— upstream reaches for a Tailwind hue here, this page for the theme's grounds.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center justify-center gap-6">
					{#each brandTiles as tile (tile.label)}
						{@const TileIcon = tile.icon}
						<div class="flex flex-col items-center gap-2">
							<IconTile variant="elevated" class={tile.class} aria-hidden="true">
								<TileIcon />
							</IconTile>
							<span class="text-sm text-muted-foreground">{tile.label}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">IconTile</h3>
			<p class="text-sm text-muted-foreground">
				The whole component. It renders a <code>&lt;span&gt;</code>, so it drops into a line of text
				or a flex row without a wrapper.
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
							{#each iconTileProps as row (row.prop)}
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
				The four values <code>size</code> and <code>radius</code> set. They are ordinary custom
				properties on the root, so a caller can override any of them through <code>class</code>
				— which is what the Custom sizing section above does.
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
							{#each iconTileVariables as row (row.name)}
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
