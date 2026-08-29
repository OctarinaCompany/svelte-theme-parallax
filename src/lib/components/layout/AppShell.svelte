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
	 *
	 * IT ALSO OWNS THE PAGE'S ONE LANDMARK ID. The `<main>` is `#main-content`, which the skip
	 * link below targets; nothing else in a document may claim that id, or the browser resolves
	 * the fragment to whichever comes first and the bypass silently stops working.
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
	<!--
		THE BYPASS. Every route opens with the same rail — a workspace switcher, the destinations,
		thirteen group triggers, the sub-links of whichever group is open and the account menu — and
		before this link a keyboard reader crossed all of it, 24 stops, on every page. WCAG 2.4.1
		(Bypass Blocks) asks for a way past content repeated across pages; this is it, and it is
		deliberately the FIRST focusable thing in the shell so that one Tab reaches it.

		It is a real anchor to a real id, not a scripted focus call: following the fragment is what
		moves the sequential focus starting point, and `tabindex="-1"` on the target is what lets
		focus actually land there — without it the link would scroll a screen reader's viewport and
		leave its cursor in the rail.

		VISUALLY HIDDEN BY POSITION, not by `sr-only`. It has to be announced and reachable at all
		times, so it stays rendered and in the accessibility tree; the translate parks it above the
		viewport and focus brings it back. `fixed`, so parking it costs no layout and cannot widen
		the shell. No transition: this is a jump, and an animated one delays the reveal for the one
		reader who needs it immediately.
	-->
	<a
		href="#main-content"
		class="fixed start-4 top-4 z-50 -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md focus:translate-y-0 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden"
	>
		Skip to content
	</a>
	{#if sidebar}
		{@render sidebar()}
	{:else}
		<AppSidebar />
	{/if}
	<!--
		`id` and `tabindex` ride through `restProps` onto the `<main>` `Sidebar.Inset` renders,
		rather than being written into that generated file: it mirrors its upstream export surface,
		and a landmark id is this shell's decision, not the CLI's.

		WHAT THIS DOES NOT YET FIX: the page header is rendered by the PAGE, so it sits INSIDE this
		`<main>` and the link lands in front of it — six more stops rather than twenty-four. A
		`<header>` inside `<main>` also maps to no `banner` landmark, and `role="banner"` is not the
		repair (ARIA in HTML does not allow it on a nested `header`, and a banner inside `main`
		would be a nested landmark). The repair is structural: the header has to be a sibling of
		`<main>`, which means the shell renders it rather than the page.
	-->
	<Sidebar.Inset id="main-content" tabindex={-1}>
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
