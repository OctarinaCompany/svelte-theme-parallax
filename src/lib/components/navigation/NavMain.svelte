<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import type { NavIsActive, NavItem } from "$lib/shared/nav.js";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { SvelteSet } from "svelte/reactivity";
	import { untrack } from "svelte";

	/**
	 * ACTIVE-STATE ARRIVES AS DATA, NEVER AS A ROUTER. This component used to import the demo's
	 * router and compare the item's url against the current route itself, which published fine as
	 * a gallery component and not at all as a registry one — a consumer has their own router, and
	 * this file cannot know it. So the caller answers instead: `isActive` for full control (the
	 * demo passes a normalised pathname comparison, and reactivity flows through the closure into
	 * every `$derived` below), or `activePath` for the plain-string case. `isActive` wins when
	 * both are given, because a predicate subsumes a comparison.
	 *
	 * `label` is the heading over the categories — the demo's "Components". A heading is content,
	 * so it is the caller's word, and with no label the group renders unheaded rather than
	 * inventing one.
	 */
	let {
		items,
		label,
		activePath,
		isActive,
	}: {
		items: NavItem[];
		label?: string;
		activePath?: string;
		isActive?: NavIsActive;
	} = $props();

	const active = $derived(isActive ?? ((url: string) => url === activePath));

	const sidebar = useSidebar();

	/**
	 * The two shapes in `items`, separated so each can have its own heading.
	 *
	 * Childless entries are destinations and sit above the ladder; entries with children are its
	 * groups. Splitting here rather than in the data keeps the caller's data a single ordered list.
	 */
	const destinations = $derived(items.filter((item) => !item.items?.length));
	const categories = $derived(items.filter((item) => item.items?.length));

	/**
	 * Is this entry's destination the page currently on screen?
	 *
	 * A bare `'#'` is a placeholder for a page that does not exist yet, not a destination, so
	 * it never counts as current. No entry uses one today — the eleven that did were removed
	 * with the Playground, Documentation and Settings groups — but the guard stays, because
	 * without it a single future placeholder normalises to {@link HOME} and lights up every
	 * other placeholder at once, which reads as a bug and is one.
	 *
	 * Real destinations are handed to the caller's predicate — see the props note for why the
	 * comparison is not made here.
	 *
	 * `Sidebar.MenuButton` and `Sidebar.MenuSubButton` both accept `isActive` and style
	 * `data-active` themselves, so this needs no CSS of its own.
	 */
	function isCurrent(url: string | undefined): boolean {
		if (url === undefined || url === "#") return false;
		return active(url);
	}

	/**
	 * In the icon rail, `Sidebar.MenuSub` and `Sidebar.MenuSubButton` carry
	 * `group-data-[collapsible=icon]:hidden` in the generated design system — so a collapsible
	 * has nothing left to reveal, and its trigger becomes a button that answers nothing.
	 * The sub-menu opens as a flyout beside the rail instead.
	 *
	 * Not on mobile: there the sidebar is a full-width sheet, so the collapsible works as usual.
	 */
	const useFlyout = $derived(sidebar.state === "collapsed" && !sidebar.isMobile);

	/** The group holding the page currently on screen, if any. */
	const currentCategory = $derived(
		categories.find((item) => (item.items ?? []).some((subItem) => isCurrent(subItem.url)))?.title,
	);

	/**
	 * Which groups are expanded.
	 *
	 * SEEDED BY THE ROUTE, THEN OWNED BY THE READER. There used to be a stored `defaultOpen: true`
	 * on the single `Components` group, which had one obviously right value while there was one
	 * group. With twelve there is no right stored value: all open is a 101-item wall to scroll
	 * past, all closed is a wall of nothing. So the group holding the current page opens itself.
	 *
	 * ARRIVING AT A NEW GROUP COLLAPSES THE OTHERS. Left to accumulate, twelve groups reopen the
	 * wall this grouping exists to remove — five pages browsed is sixty visible entries, which is
	 * the flat list again with extra steps. So a move to a different group resets the set rather
	 * than adding to it.
	 *
	 * BETWEEN navigations the reader owns it completely. The effect depends only on
	 * `currentCategory`, and writes without reading, so it runs when the route crosses into
	 * another group and at no other time: a group opened by hand to compare against the current
	 * one stays open, and a group closed by hand — including the current one — stays closed. An
	 * `open={…}` derived straight from the route would reopen it on the next unrelated re-render
	 * and fight them for it.
	 */
	const openCategories = new SvelteSet<string>();

	$effect(() => {
		const category = currentCategory;
		if (!category) return;

		untrack(() => {
			openCategories.clear();
			openCategories.add(category);
		});
	});
</script>

<!--
	The destinations, unlabelled. A heading over a list whose every entry names itself would be
	furniture — the same reason the group below carried no label while it held one entry.
-->
<Sidebar.Group>
	<Sidebar.Menu>
		{#each destinations as item (item.title)}
			<!-- No children: a destination, so a plain link. The only case that reads `item.url`. -->
			<Sidebar.MenuItem>
				<Sidebar.MenuButton tooltipContent={item.title} isActive={isCurrent(item.url)}>
					{#snippet child({ props })}
						<a href={item.url} {...props}>
							{#if item.icon}
								<item.icon />
							{/if}
							<span>{item.title}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>

<!--
	THE LABEL IS BACK. It was removed with the line "if a second group ever returns, the label
	comes back with it", when four collapsibles became one and a heading naming something other
	than that single entry stopped earning its keep. Twelve return, so it does too — and it now
	names exactly what is under it, which the old "Platform" never did. The word itself comes in
	through `label` (the demo passes "Components"), because a heading is the caller's content.
-->
<Sidebar.Group>
	{#if label}
		<Sidebar.GroupLabel>{label}</Sidebar.GroupLabel>
	{/if}
	<Sidebar.Menu>
		{#each categories as item (item.title)}
			{#if useFlyout}
				<Sidebar.MenuItem>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<!--
								Same `child` pattern as everywhere else: the trigger hands its behaviour and
								ARIA attributes to the MenuButton rather than wrapping it in a second button.
								No `tooltipContent` here — the menu's own label carries the title, and a
								tooltip would compete with the menu for the same trigger.
							-->
							{#snippet child({ props })}
								<!--
									Active when a CHILD is the current page, not the entry itself — a category
									has no destination of its own, and in the rail its children are not
									rendered, so the parent is the only thing left to carry the mark.
								-->
								<Sidebar.MenuButton
									{...props}
									isActive={(item.items ?? []).some((subItem) => isCurrent(subItem.url))}
									class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									{#if item.icon}
										<item.icon />
									{/if}
									<span>{item.title}</span>
								</Sidebar.MenuButton>
							{/snippet}
						</DropdownMenu.Trigger>
						<!--
							`side="right"` is what keeps the menu BESIDE the rail instead of over it — the
							same anchoring the header and footer menus use. Unconditional here, unlike
							theirs, because this branch never renders on mobile.

							Fixed `w-48` rather than the header's `w-(--bits-dropdown-menu-anchor-width)`:
							the anchor is a 32px icon, so matching its width would mean nothing.
						-->
						<DropdownMenu.Content class="w-48 rounded-lg" side="right" align="start" sideOffset={4}>
							<!-- A heading, not a link: an entry with children is a category, not a place. -->
							<DropdownMenu.Label>{item.title}</DropdownMenu.Label>
							{#each item.items ?? [] as subItem (subItem.title)}
								<!--
									A weight change rather than `isActive`: `DropdownMenu.Item` has no active
									variant. Its only state styling is `data-highlighted`, which is keyboard
									focus — reusing that would make the current page look permanently focused
									and fight the user's own navigation of the menu.
								-->
								<DropdownMenu.Item class={isCurrent(subItem.url) ? "font-medium" : undefined}>
									<!-- A real anchor, so middle-click and "open in new tab" keep working. -->
									{#snippet child({ props })}
										<a href={subItem.url} {...props}>{subItem.title}</a>
									{/snippet}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Sidebar.MenuItem>
			{:else}
				<!--
					`group/collapsible` names this group so the chevron below can react to the
					open state with `group-data-[state=open]/collapsible:`.
				-->
				<Collapsible.Root
					bind:open={
						() => openCategories.has(item.title),
						(value) => {
							if (value) openCategories.add(item.title);
							else openCategories.delete(item.title);
						}
					}
					class="group/collapsible"
				>
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							<Collapsible.Trigger>
								<!--
									The `child` snippet hands the trigger's behaviour and ARIA
									attributes to the MenuButton instead of wrapping it in a second
									button. Remove it and you get a <button> inside a <button>.
								-->
								{#snippet child({ props })}
									<Sidebar.MenuButton {...props}>
										{#if item.icon}
											<item.icon />
										{/if}
										<span>{item.title}</span>
										<ChevronRightIcon
											class="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
										/>
									</Sidebar.MenuButton>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each item.items ?? [] as subItem (subItem.title)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton isActive={isCurrent(subItem.url)}>
												<!-- Same pattern, so the sub-item is a real link and stays keyboard-operable. -->
												{#snippet child({ props })}
													<a href={subItem.url} {...props}>
														<span>{subItem.title}</span>
													</a>
												{/snippet}
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
