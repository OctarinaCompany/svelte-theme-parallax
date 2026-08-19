<script lang="ts">
	import type { ComponentProps, Snippet } from "svelte";
	import NavMain from "$lib/components/navigation/NavMain.svelte";
	import NavUser from "$lib/components/navigation/NavUser.svelte";
	import WorkspaceSwitcher from "$lib/components/navigation/WorkspaceSwitcher.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { sidebarFloating } from "$lib/hooks/sidebar-behaviour.svelte.js";
	import type { NavIsActive, NavItem, User, Workspace } from "$lib/shared/nav.js";

	/**
	 * The sidebar itself: three regions plus the rail.
	 *
	 * `collapsible="icon"` is what makes it shrink to an icon rail rather than slide away
	 * entirely. Accepting the rest of `Sidebar.Root`'s props keeps the component reusable
	 * (a later step can pass `side="right"` without editing it).
	 *
	 * `variant="floating"` detaches the panel from the window edges: the component insets it
	 * by `p-2` and gives the inner surface `rounded-lg` with a 1px ring, so the sidebar reads
	 * as a card like the buttons inside it. Recorded here rather than in `app.css` because it
	 * is a composition choice, not a token correction. The ring's COLOUR is corrected there:
	 * it is repointed at `--sidebar-outline`, for the reason that rule gives.
	 *
	 * NO DATA MODULE IS IMPORTED HERE ANY MORE. This file used to be the single importer of
	 * `dashboardData`, which was the right choke point while the sidebar was demo-only and the
	 * wrong one the moment it published: a registry consumer has no `dashboard.ts`. The content
	 * now arrives as props — the demo's `App.svelte`, which already owns the routing, passes its
	 * data in — and each region renders only when it has something truthful to show. The three
	 * region snippets are the escape hatches: a brand mark instead of the workspace switcher, a
	 * custom footer, without forking the file.
	 */
	let {
		ref = $bindable(null),
		collapsible = "icon",
		variant,
		user,
		workspaces,
		activeWorkspace = $bindable(),
		onActiveWorkspaceChange,
		onAddWorkspace,
		items,
		label,
		activePath,
		isActive,
		header,
		content,
		footer,
		userMenu,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		user?: User;
		workspaces?: Workspace[];
		/** Forwarded to `WorkspaceSwitcher` — bind or listen from the shell's own entry point. */
		activeWorkspace?: Workspace;
		onActiveWorkspaceChange?: (workspace: Workspace) => void;
		onAddWorkspace?: () => void;
		items?: NavItem[];
		/** Heading over the nav categories — forwarded to `NavMain`. */
		label?: string;
		activePath?: string;
		isActive?: NavIsActive;
		header?: Snippet;
		content?: Snippet;
		footer?: Snippet;
		/** Forwarded to `NavUser` as its `menu` snippet — the account dropdown's body. */
		userMenu?: Snippet;
	} = $props();

	/*
	 * The variant follows the floating flag unless a caller pins one explicitly. `floating` is
	 * still the default look (the flag reads true when unset) — the flag exists so Settings and
	 * the header dropdown can seat the rail flush against the viewport.
	 */
	const resolvedVariant = $derived(variant ?? (sidebarFloating.current ? "floating" : "sidebar"));
</script>

<Sidebar.Root bind:ref {collapsible} variant={resolvedVariant} {...restProps}>
	{#if header || workspaces?.length}
		<Sidebar.Header>
			{#if header}
				{@render header()}
			{:else if workspaces?.length}
				<WorkspaceSwitcher
					{workspaces}
					bind:activeWorkspace
					{onActiveWorkspaceChange}
					{onAddWorkspace}
				/>
			{/if}
		</Sidebar.Header>
	{/if}
	<Sidebar.Content>
		{#if content}
			{@render content()}
		{:else if items?.length}
			<NavMain {items} {label} {activePath} {isActive} />
		{/if}
	</Sidebar.Content>
	{#if footer || user}
		<Sidebar.Footer>
			{#if footer}
				{@render footer()}
			{:else if user}
				<NavUser {user} menu={userMenu} />
			{/if}
		</Sidebar.Footer>
	{/if}
	<!-- The rail is the thin strip along the sidebar's outer edge: a second way to toggle. -->
	<Sidebar.Rail />
</Sidebar.Root>
