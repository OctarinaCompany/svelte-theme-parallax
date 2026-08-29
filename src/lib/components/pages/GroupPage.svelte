<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { CATEGORIES, categoryByPath, groupPath, href, route } from "$lib/hooks/route.svelte.js";

	/**
	 * One group of the ladder: what it admits, what it excludes, and everything filed under it.
	 *
	 * ONE COMPONENT FOR TWELVE ROUTES. `App.svelte` maps every `/components/group/*` path to this
	 * file, which reads the current route to find out which group it is. The alternative — thirteen
	 * near-identical page files — would be thirteen places to forget when a group is renamed, and the
	 * group data already lives in `CATEGORIES` where both the router and the sidebar read it.
	 *
	 * ITS PLACE IN THE LADDER IS THE HEADLINE, because that is what the group means. A group is not
	 * a folder of related things; it is a rung, and a component belongs to the FIRST rung whose test
	 * it passes. Saying "3 of 12" tells a reader why `Command` is filed under Pickers rather than
	 * Overlays: Pickers is asked first.
	 */

	const category = $derived(categoryByPath(route.current) ?? CATEGORIES[0]);
	const index = $derived(CATEGORIES.findIndex((c) => c.slug === category.slug));

	/**
	 * Widened to `number` on purpose.
	 *
	 * `CATEGORIES` is `as const`, so `items.length` is a union of the thirteen literal counts — and
	 * `=== 1` against it is a type error today, because no group currently holds exactly one. The
	 * pluralisation still has to be right the day one does, so the comparison is kept and the type
	 * is loosened rather than the branch being deleted as unreachable.
	 */
	const count: number = $derived(category.items.length);
	const previous = $derived(index > 0 ? CATEGORIES[index - 1] : undefined);
	const next = $derived(index < CATEGORIES.length - 1 ? CATEGORIES[index + 1] : undefined);
</script>

<!--
	`{#key}` on the route: the component is shared by thirteen paths, so without it Svelte reuses the
	instance and only the derived text changes — which is correct, but it also means `DocPage`'s
	intro keeps its scroll position and any future per-group state would leak between groups.
	Re-mounting on the path makes each group a fresh page, which is what the URL says it is.
-->
{#key route.current}
	<DocPage title={category.title}>
		{#snippet subtitle()}
			Rung {index + 1} of {CATEGORIES.length} in the ladder, holding {count}
			{count === 1 ? "component" : "components"}.
		{/snippet}

		<DocSection title="What it admits">
			{#snippet blurb()}
				A component belongs to the first group whose test it passes, so this one only ever sees what
				the {index}
				{index === 1 ? "rung" : "rungs"} above it did not take.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<p class="text-base">{category.test}</p>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="In this group">
			<Card.Root>
				<Card.Content class="flex flex-col gap-1">
					{#each category.items as item (item.slug)}
						<a
							class="flex items-baseline gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
							href={href(item.slug)}
						>
							<span class="font-medium">{item.title}</span>
							<span class="font-mono text-xs text-muted-foreground">{item.slug}</span>
						</a>
					{/each}
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Either side of it">
			{#snippet blurb()}
				The neighbours, because the order is the taxonomy: what sits above decides what this rung
				never sees, and what sits below only sees what this one declined.
			{/snippet}
			<div class="flex flex-wrap gap-3">
				{#if previous}
					<a href={href(groupPath(previous.slug))} class="flex-1">
						<Card.Root class="h-full transition-colors hover:border-primary">
							<Card.Content class="flex flex-col gap-1">
								<span class="text-xs text-muted-foreground">Asked before this one</span>
								<span class="font-medium">{previous.title}</span>
								<span class="text-sm text-muted-foreground">{previous.test}</span>
							</Card.Content>
						</Card.Root>
					</a>
				{/if}
				{#if next}
					<a href={href(groupPath(next.slug))} class="flex-1">
						<Card.Root class="h-full transition-colors hover:border-primary">
							<Card.Content class="flex flex-col gap-1">
								<span class="text-xs text-muted-foreground">Asked after this one</span>
								<span class="font-medium">{next.title}</span>
								<span class="text-sm text-muted-foreground">{next.test}</span>
							</Card.Content>
						</Card.Root>
					</a>
				{/if}
			</div>
		</DocSection>

		<DocSection title="All groups">
			<Card.Root>
				<Card.Content class="flex flex-wrap gap-x-3 gap-y-1">
					{#each CATEGORIES as other (other.slug)}
						{#if other.slug === category.slug}
							<Badge variant="secondary">{other.title}</Badge>
						{:else}
							<a
								class="text-sm hover:text-primary hover:underline"
								href={href(groupPath(other.slug))}
							>
								{other.title}
							</a>
						{/if}
					{/each}
				</Card.Content>
			</Card.Root>
		</DocSection>
	</DocPage>
{/key}
