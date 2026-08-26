<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { CATEGORIES, DESTINATIONS, groupPath, href } from "$lib/hooks/route.svelte.js";

	/**
	 * The catalog index: every group, in ladder order, with what each one admits.
	 *
	 * WHY IT EXISTS. The breadcrumb reads `Components / Patterns / Page headers` on every page, and
	 * until now its first two steps went nowhere. That is correct in the SIDEBAR — a group there
	 * reveals its children, and giving it a destination too would make one click carry two meanings
	 * — and wrong in a breadcrumb, whose whole job is to be the way back up. So this page and the
	 * twelve group pages exist, reachable from the trail and from nowhere else.
	 *
	 * IT IS THE LADDER, NOT A LIST. The groups are shown in their declared order with their
	 * admission tests, because the order is the taxonomy: a component belongs to the FIRST group
	 * whose test it passes, so `Pickers` sitting above `Form controls` is the reason a Select is
	 * not filed as a form value. A page that sorted them alphabetically would be describing
	 * something this repository does not do.
	 *
	 * The counts are derived, so this page cannot drift from `CATEGORIES` the way a hand-written
	 * index would.
	 */

	const total = $derived(
		DESTINATIONS.length + CATEGORIES.reduce((sum, category) => sum + category.items.length, 0),
	);
</script>

<DocPage title="Components">
	{#snippet subtitle()}
		Every page in the kit, filed by what it is. {total} in all, across {CATEGORIES.length} groups.
	{/snippet}

	<DocSection title="The ladder">
		{#snippet blurb()}
			Not buckets — an ordered decision procedure. A component belongs to the first group whose test
			it passes, which is what turns "it belongs in two places" from an argument into a lookup. The
			order is load-bearing: <strong>Pickers</strong> sits above
			<strong>Form controls</strong>
			or a Select would be swallowed by it, and <strong>Actions</strong> sits last because "is it a button"
			is a tempting first question and a wrong one — checkbox, switch and half the Pickers are all pressed.
		{/snippet}

		<div class="flex flex-col gap-4">
			{#each CATEGORIES as category, index (category.slug)}
				<Card.Root>
					<Card.Content class="flex flex-col gap-3">
						<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
							<span class="font-mono text-xs text-muted-foreground tabular-nums">
								{String(index + 1).padStart(2, "0")}
							</span>
							<a
								class="text-base font-medium text-primary underline underline-offset-3"
								href={href(groupPath(category.slug))}
							>
								{category.title}
							</a>
							<Badge variant="secondary">{category.items.length}</Badge>
						</div>

						<p class="text-sm text-muted-foreground">{category.test}</p>

						<!--
							The members are listed here as well as on the group page, because the index is
							where someone lands not knowing which group a thing is in — scanning twelve short
							lists is how they find it, and a page that made them open twelve pages to do that
							would be an index that indexes nothing.
						-->
						<div class="flex flex-wrap gap-x-3 gap-y-1">
							{#each category.items as item (item.slug)}
								<a class="text-sm hover:text-primary hover:underline" href={href(item.slug)}>
									{item.title}
								</a>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</DocSection>

	<DocSection title="Outside the ladder">
		{#snippet blurb()}
			An entry with children is a category, not a place — so a page that has to be clickable cannot
			be a group. These are hoisted above the twelve and sit in the sidebar as plain links.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-wrap gap-x-3 gap-y-1">
				{#each DESTINATIONS as destination (destination.slug)}
					<a class="text-sm hover:text-primary hover:underline" href={href(destination.slug)}>
						{destination.title}
					</a>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
