<script lang="ts">
	import type { Snippet } from "svelte";
	import ContentColumn from "$lib/components/layout/ContentColumn.svelte";
	import PageHeader from "$lib/components/layout/PageHeader.svelte";
	import PageIntro from "$lib/components/layout/PageIntro.svelte";
	import CommandPalette from "$lib/components/navigation/CommandPalette.svelte";
	import {
		CATALOG_PATH,
		CATEGORIES,
		categoryByPath,
		categoryOf,
		groupPath,
		route,
	} from "$lib/hooks/route.svelte.js";

	/**
	 * The frame every page under `Components` shares: the four pieces every page repeats —
	 * the breadcrumb bar, the page gutter, the centred reading column and the intro block —
	 * assembled once here instead of being copied into every page.
	 *
	 * The breadcrumb's last step is `title`, so the trail never disagrees with the heading.
	 *
	 * The gutter is `px-3 md:px-9`. It lives here rather than in {@link ContentColumn}
	 * because the dashboard pages need the gutter without the column.
	 *
	 * `children` are the sections, wrapped in a `<div>` of their own so {@link DocSection}'s
	 * `not-first:` rule has a container where the first section really is `:first-child`.
	 */
	let {
		title,
		subtitle,
		children,
	}: {
		/** Page heading, and the last breadcrumb step. */
		title: string;
		subtitle?: Snippet;
		children: Snippet;
	} = $props();

	/**
	 * The trail, derived rather than declared.
	 *
	 * The middle step is the ladder group the current route belongs to, looked up from
	 * `CATEGORIES` — NOT a `category` prop, which would have to be threaded through a hundred
	 * pages and could then disagree with the sidebar. One declaration, two readers.
	 *
	 * EVERY STEP BUT THE LAST IS NOW A DESTINATION. It was not: the first two crumbs were plain
	 * text, on the reasoning that "Components" named no page and a ladder group is a shelf rather
	 * than a route. That was true of the SIDEBAR, where a group reveals its children and clicking
	 * it would carry two meanings — and it stays true there. It was never true of a breadcrumb,
	 * whose whole job is to be the way back up: a trail whose only live step is the one you are
	 * standing on is a picture of a hierarchy, not a hierarchy. So the index and the twelve group
	 * pages exist, reachable from here and from nowhere else.
	 *
	 * `categoryOf` returns nothing for the hoisted destinations (Themes), which belong to no group
	 * by design; those keep the two-step trail. A group page is its own last step, and the index
	 * is a single crumb — in both cases the page is the end of the trail, so it carries no `href`
	 * and renders as `Breadcrumb.Page`.
	 */
	const category = $derived(categoryOf(route.current));
	const group = $derived(CATEGORIES.find((c) => c.title === category));
	const onCatalog = $derived(route.current === CATALOG_PATH);
	const ownGroup = $derived(categoryByPath(route.current));

	const trail = $derived.by(() => {
		const root = { label: "Components", href: `#${CATALOG_PATH}` };

		if (onCatalog) return [{ label: "Components" }];
		if (ownGroup) return [root, { label: ownGroup.title }];
		if (group)
			return [root, { label: group.title, href: `#${groupPath(group.slug)}` }, { label: title }];
		return [root, { label: title }];
	});
</script>

<!--
	The palette rides in through `search` because it is the demo's: it reads this gallery's
	catalog, which the published header cannot know. The slot is the seam — one line here, and
	none of the 109 pages that render DocPage are aware the header stopped hardcoding it.
-->
<PageHeader {trail}>
	{#snippet search()}
		<CommandPalette />
	{/snippet}
</PageHeader>

<div class="px-3 pb-4 md:px-9">
	<ContentColumn>
		<PageIntro {title} {subtitle} />
		<div>
			{@render children()}
		</div>
	</ContentColumn>
</div>
