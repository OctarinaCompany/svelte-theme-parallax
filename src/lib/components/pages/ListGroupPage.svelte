<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { cn } from "$lib/utils.js";
	import ClockIcon from "@lucide/svelte/icons/clock";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The List group component page.
	 *
	 * WHY THIS PAGE IS PLAIN MARKUP. shadcn-svelte has no list-group component, and neither
	 * does the classic framework in any meaningful sense: `.list-group` is a set of CSS custom properties
	 * on a `<ul>` or a `<div>` of links. There is no behaviour to wrap, so the theme is the
	 * class constants below rather than a new component — the same shape AlertPage uses.
	 *
	 * The classic theme's fourth section, "List.js", documents a third-party plugin for searchable and
	 * sortable lists rather than the list group itself, and is out of scope here.
	 */

	/**
	 * The container, which also draws every border.
	 *
	 * WHY THE BORDERS LIVE HERE. The classic framework puts a full border on each item and then removes the
	 * top one on every item after the first (`.list-group-item + .list-group-item {
	 * border-top-width: 0 }`) so adjacent hairlines do not double up. Writing that as two
	 * classes on the item — `border` plus `border-t-0` — would put two competing border-width
	 * utilities on one element, and since these strings are concatenated rather than merged
	 * through `cn()`, the winner would be decided by Tailwind's own sort order rather than by
	 * intent. Selecting children from the container states each edge exactly once.
	 *
	 * `list-group-border-color` is `gray-200` in light and `border-color-dark` in dark, which
	 * is exactly `--border` in BOTH modes — one of the few mappings in this theme needing no
	 * caveat.
	 *
	 * THE RADIUS RIDES ON THE ITEMS, as the classic framework's own `border-radius: inherit` rules put it,
	 * not on an `overflow-hidden` clip. This page first shipped the clip, and the pixel grid
	 * showed why the classic framework does not: clipping curves the fill but CUTS the item's border at the
	 * corner instead of bending it, so the first item read as square-cornered with its hairline
	 * running off the edge. Rounding the first and last child bends border and fill together.
	 */
	const group =
		"flex flex-col rounded-md [&>*]:border [&>*]:border-border [&>*+*]:border-t-0 [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md";

	/**
	 * An item: `list-group-item-padding-x: 1.25rem` / `-y: 1rem`, on `list-group-bg:
	 * transparent` so the card surface shows through.
	 */
	const item = "relative block bg-transparent px-5 py-4 text-sm";

	/**
	 * `.active`: the one place a list item takes a fill.
	 *
	 * Applied through `cn()` at the call sites, not concatenated. It contradicts {@link item}'s
	 * `bg-transparent`, and two background utilities on one unmerged element are settled by
	 * Tailwind's sort order — which here kept the transparent one and rendered white text on
	 * nothing.
	 *
	 * The border colour needs `!`: {@link group}'s `[&>*]:border-border` is an arbitrary variant
	 * whose child selector outweighs a plain utility on the item itself, and it was quietly
	 * repainting `list-group-active-border-color` (primary) grey.
	 */
	const active = "bg-primary text-primary-foreground border-primary!";

	/**
	 * `.list-group-item-action`: `list-group-action-hover-bg` is `--bs-tertiary-bg` in light
	 * and `gray-900-dark` in dark, i.e. `--accent` in both — again an exact match.
	 */
	const action = "hover:bg-accent hover:text-accent-foreground transition-colors";

	/** `.list-group-lg`: `list-group-item-padding-y-lg: spacer` (1.5rem), spelled out in full. */
	const itemLarge = "relative block bg-transparent px-5 py-6 text-sm";

	/**
	 * `.list-group-flush`: no radius and only the seam BETWEEN items — the outer box goes away
	 * so the list sits flush against whatever contains it. It replaces {@link group} rather
	 * than stacking on top of it, for the border reason explained there.
	 *
	 * The classic theme adds a rule of its own so a flush list that is not the last child keeps its
	 * closing hairline; the list below is last, so the final item drops it.
	 *
	 * `list-group-item-padding-x: 0` in this variant, which the items opt into separately.
	 */
	const flush = "flex flex-col [&>*]:border-b [&>*]:border-border [&>*:last-child]:border-b-0";

	/**
	 * The flush item is spelled out in full rather than as `item + 'px-0'` for the same reason
	 * the borders moved to the container: two padding utilities on one unmerged element is a
	 * coin toss, and this is the only difference between them.
	 */
	const flushItem = "relative block bg-transparent py-4 text-sm";

	/** `.rounded-pill` badge geometry, as derived on the Badge page. */
	const pillBadge =
		"h-auto rounded-4xl px-[0.6em] py-[0.33em] align-middle text-[76%] leading-none font-normal";

	const basic = [
		"Cras justo odio",
		"Dapibus ac facilisis in",
		"Morbi leo risus",
		"Porta ac consectetur ac",
	];

	const largeItems = [...basic, "Vestibulum at eros"];

	/**
	 * The focus example's rows. The classic theme uses photographs from its own asset folder; this repo
	 * has no avatar images — the same reason `dashboard.ts` carries no `avatar` field — so the
	 * fallback initials stand in, which is what `AvatarFallback` exists for.
	 *
	 * `wide` marks the classic theme's `.avatar-4by3`, a 4:3 box used for project thumbnails rather than
	 * the square used for people and teams.
	 */
	const focusRows = [
		{ name: "Airbnb", initials: "AB", updated: "Updated 2hr ago", wide: false },
		{ name: "Medium Corporation", initials: "MC", updated: "Updated 2hr ago", wide: false },
		{ name: "Homepage Redesign", initials: "HR", updated: "Updated 4hr ago", wide: true },
	];

	const self = href("/components/list-group");
</script>

<DocPage title="List group">
	{#snippet subtitle()}
		List groups are a flexible and powerful component for displaying a series of content. Modify and
		extend them to support just about any content within. <code class="text-[87.5%] text-primary"
			>.list-group</code
		>
		is a set of classes rather than a component, so what this page ports is the container: the rounded
		box, the hairline between rows, the active fill, and the classic theme's focus recolour. The row inside
		it is
		<a class="text-primary underline underline-offset-3" href={href("/components/item")}>Item</a>,
		which carries named media, content and action slots and whose default row is skinned to this
		same padding.
	{/snippet}

	<Card.Root>
		<Card.Content class="flex flex-col gap-6">
			<ul class={group}>
				<li class={cn(item, active)}>Cras justo odio</li>
				{#each basic.slice(1) as label (label)}
					<li class={item}>{label}</li>
				{/each}
				<li class="{item} flex items-center justify-between">
					Morbi leo risus
					<Badge class="{pillBadge} bg-primary text-primary-foreground">1</Badge>
				</li>
			</ul>

			<!--
				The same list as links. The classic framework calls these `.list-group-item-action`: they add a
				hover fill and a pointer, which the plain `<li>` version above deliberately does not.
			-->
			<div class={group}>
				<a href={self} class={cn(item, active)}>Cras justo odio</a>
				{#each basic.slice(1) as label (label)}
					<a href={self} class="{item} {action}">{label}</a>
				{/each}
				<a href={self} class="{item} {action} flex items-center justify-between">
					Morbi leo risus
					<Badge class="{pillBadge} bg-primary text-primary-foreground">1</Badge>
				</a>
			</div>
		</Card.Content>
	</Card.Root>

	<DocSection title="List group large">
		{#snippet blurb()}
			Increase the vertical padding of list group items.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ul class={group}>
					<li class={cn(itemLarge, active)}>Cras justo odio</li>
					{#each largeItems.slice(1) as label (label)}
						<li class={itemLarge}>{label}</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="List group focus">
		{#snippet blurb()}
			Changes the colour of the focus-marked elements to the primary colour when a list item takes
			focus. Useful for clickable items when navigating with a keyboard — tab into the list below to
			see it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class={flush}>
					{#each focusRows as row (row.name)}
						<!--
							`.list-group-focus .list-group-item:focus .text-focus` recolours a marked
							descendant on focus. Tailwind expresses the same thing with `group` on the
							focusable element and `group-focus:` on the descendant, which avoids inventing
							a `.text-focus` class that no stylesheet here defines.
						-->
						<a href={self} class="{flushItem} {action} group flex items-center gap-4">
							<Avatar.Root class="{row.wide ? 'h-12 w-16' : 'size-12'} shrink-0 rounded-md">
								<Avatar.Fallback>{row.initials}</Avatar.Fallback>
							</Avatar.Root>
							<div class="min-w-0">
								<h4
									class="mb-1 truncate text-sm font-medium transition-colors group-focus:text-primary"
								>
									{row.name}
								</h4>
								<p class="flex items-center gap-1 text-xs text-muted-foreground">
									<ClockIcon class="size-3" />
									{row.updated}
								</p>
							</div>
						</a>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
