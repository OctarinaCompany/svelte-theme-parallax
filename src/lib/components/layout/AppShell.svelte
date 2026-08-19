<script lang="ts">
	import type { Snippet } from "svelte";
	import AppSidebar from "$lib/components/layout/AppSidebar.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { getStoredSidebarState } from "$lib/hooks/sidebar-state.js";

	/**
	 * The application shell: sidebar chrome plus a slot for the current page.
	 *
	 * `Sidebar.Provider` is the layout root — it owns the open/closed state, the mobile
	 * breakpoint, the Ctrl/Cmd+B shortcut, and the CSS variables the sidebar and
	 * `Sidebar.Inset` both read. Step 1's hand-written wrapper `<div>` was removed when
	 * the provider took over; background and foreground come from `@layer base` in app.css.
	 */
	type Props = {
		children?: Snippet;
		/**
		 * The sidebar itself. The default is a bare `<AppSidebar />`; a caller with content —
		 * the demo, any real application — renders its own inside the snippet, which is where
		 * the data belongs: the shell is chrome, and chrome carries no catalog.
		 */
		sidebar?: Snippet;
		/** The expanded rail's width. See the note on the provider below for why 250px. */
		sidebarWidth?: string;
	};

	let { children, sidebar, sidebarWidth = "250px" }: Props = $props();

	/**
	 * `open` is a `$bindable` prop. It must be bound, not merely passed: the provider
	 * assigns to it when the user toggles the sidebar, and without `bind:` that write
	 * would not propagate back here. Seeding it from the cookie is what makes the
	 * collapsed state survive a reload — see `getStoredSidebarState`.
	 */
	let open = $state(getStoredSidebarState());
</script>

<!--
	`--sidebar-width` defaults to 250px rather than shadcn's 16rem. The provider writes its own
	defaults into the same `style` attribute and then appends whatever is passed here, so
	this override wins without touching generated code.

	`--sidebar-width-icon` is deliberately left alone: shadcn's collapsed rail already
	renders at 64px — it adds `--spacing(4)` to the token internally — and nudging it by a
	couple of pixels would mean hardcoding a derivation against that internal calc for a
	difference nobody can see.
-->
<Sidebar.Provider bind:open style="--sidebar-width: {sidebarWidth};">
	{#if sidebar}
		{@render sidebar()}
	{:else}
		<AppSidebar />
	{/if}
	<Sidebar.Inset>
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
