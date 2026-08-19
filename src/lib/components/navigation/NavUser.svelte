<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import { getInitials } from "$lib/shared/get-initials.js";
	import type { User } from "$lib/shared/nav.js";
	import type { Snippet } from "svelte";
	import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
	import BellIcon from "@lucide/svelte/icons/bell";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";

	/**
	 * `menu` replaces the dropdown body below the identity header — the rows are an
	 * application's account surface, so a real application overrides them. The default keeps
	 * the official block's five rows, unwired, exactly as the demo has always shown them.
	 */
	let { user, menu }: { user: User; menu?: Snippet } = $props();

	const sidebar = useSidebar();

	/**
	 * The official block renders `<Avatar.Image src="/avatars/shadcn.jpg" />` with a
	 * hardcoded "CN" fallback. That file only exists on the shadcn-svelte docs site, so a
	 * copied block requests a missing image on every load. The image renders only when the
	 * caller supplies a real `avatar` URL; the fallback derives initials from the name.
	 */
	const initials = $derived(getInitials(user.name));
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<Avatar.Root class="size-8 rounded-lg">
							{#if user.avatar}
								<Avatar.Image src={user.avatar} alt="" />
							{/if}
							<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{user.name}</span>
							<span class="truncate text-xs">{user.email}</span>
						</div>
						<ChevronsUpDownIcon class="ms-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? "bottom" : "right"}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
						<Avatar.Root class="size-8 rounded-lg">
							{#if user.avatar}
								<Avatar.Image src={user.avatar} alt="" />
							{/if}
							<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{user.name}</span>
							<span class="truncate text-xs">{user.email}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				{#if menu}
					{@render menu()}
				{:else}
					<DropdownMenu.Group>
						<DropdownMenu.Item>
							<SparklesIcon />
							Upgrade to Pro
						</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<DropdownMenu.Item>
							<BadgeCheckIcon />
							Account
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<CreditCardIcon />
							Billing
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<BellIcon />
							Notifications
						</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Item>
						<LogOutIcon />
						Log out
					</DropdownMenu.Item>
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
