<script lang="ts">
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import type { Workspace } from "$lib/shared/nav.js";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import PlusIcon from "@lucide/svelte/icons/plus";

	/**
	 * The sidebar header item and its dropdown.
	 *
	 * Called `team-switcher` in the official block; renamed here because "team" reads as
	 * a group of people, which is confusing next to the user identity in the footer.
	 *
	 * The selection is `$bindable` and REPORTED, not merely held. The block this was ported
	 * from keeps the active workspace as private state, which is fine for a decoration and
	 * useless for an application: switching told nobody. A caller can now bind it, or listen —
	 * `onActiveWorkspaceChange` fires only on a real change, per the house callback rule —
	 * while the demo keeps passing nothing and the behaviour is exactly what it was.
	 *
	 * `$bindable()` DELIBERATELY CARRIES NO FALLBACK, and the default lives in `current`
	 * below instead. Two runtime facts force the split. A `$bindable` fallback makes
	 * `bind:activeWorkspace={maybeUndefined}` THROW at mount (`props_invalid_value`, prod
	 * included), so the natural consumer — a selection that starts empty — would crash on the
	 * documented API. And the fallback compiles to a lazy derived over `workspaces[0]`, so any
	 * later `workspaces` update would silently snap the selection back to the first entry
	 * without firing the callback. A plain `?? workspaces[0]` at read time has neither failure.
	 *
	 * `onAddWorkspace` wires the row the official block ships dead. Unset, the row still
	 * renders and still does nothing — that is the demo's long-standing look — but a consumer
	 * gets a working affordance for the price of a callback.
	 */
	let {
		workspaces,
		activeWorkspace = $bindable(),
		onActiveWorkspaceChange,
		onAddWorkspace,
	}: {
		workspaces: Workspace[];
		activeWorkspace?: Workspace;
		onActiveWorkspaceChange?: (workspace: Workspace) => void;
		onAddWorkspace?: () => void;
	} = $props();

	const sidebar = useSidebar();

	/** What the trigger shows: the caller's choice, else the first entry, else nothing. */
	const current = $derived(activeWorkspace ?? workspaces[0]);

	/**
	 * The guard compares `name` — the identity the keyed `{#each}` already relies on — and
	 * NOT object identity. A `$bindable` write re-proxies its value when the caller did not
	 * bind, so the stored workspace is never `===` the raw item the `{#each}` yields, and an
	 * identity guard would be dead code: the callback would fire on re-selecting the entry
	 * already shown, which is exactly what the house rule forbids.
	 */
	function select(workspace: Workspace): void {
		if (workspace.name === current?.name) return;
		activeWorkspace = workspace;
		onActiveWorkspaceChange?.(workspace);
	}
</script>

<Sidebar.Menu>
	<!-- No workspaces, no header row: the trigger renders the selection's identity, so an
	     empty list has nothing truthful to show and would throw on `current.logo`. -->
	{#if current}
		<Sidebar.MenuItem>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Sidebar.MenuButton
							{...props}
							size="lg"
							class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div
								class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
							>
								<current.logo class="size-4" />
							</div>
							<div class="grid flex-1 text-start text-sm leading-tight">
								<span class="truncate font-medium">{current.name}</span>
								<span class="truncate text-xs">{current.plan}</span>
							</div>
							<ChevronsUpDownIcon class="ms-auto" />
						</Sidebar.MenuButton>
					{/snippet}
				</DropdownMenu.Trigger>
				<!--
					`w-(--bits-dropdown-menu-anchor-width)` makes the menu match its trigger's
					width. `side="right"` is what keeps it BESIDE the icon rail instead of on
					top of it when the sidebar is collapsed; on mobile it drops below instead.
				-->
				<DropdownMenu.Content
					class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
					align="start"
					side={sidebar.isMobile ? "bottom" : "right"}
					sideOffset={4}
				>
					<DropdownMenu.Label class="text-xs text-muted-foreground">Workspaces</DropdownMenu.Label>
					{#each workspaces as workspace, index (workspace.name)}
						<DropdownMenu.Item onSelect={() => select(workspace)} class="gap-2 p-2">
							<div class="flex size-6 items-center justify-center rounded-md border">
								<workspace.logo class="size-3.5 shrink-0" />
							</div>
							{workspace.name}
							<!-- Decorative: these hints are copied from the official block and bind nothing. -->
							<DropdownMenu.Shortcut>⌘{index + 1}</DropdownMenu.Shortcut>
						</DropdownMenu.Item>
					{/each}
					<DropdownMenu.Separator />
					<DropdownMenu.Item onSelect={() => onAddWorkspace?.()} class="gap-2 p-2">
						<div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
							<PlusIcon class="size-4" />
						</div>
						<div class="font-medium text-muted-foreground">Add workspace</div>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</Sidebar.MenuItem>
	{/if}
</Sidebar.Menu>
