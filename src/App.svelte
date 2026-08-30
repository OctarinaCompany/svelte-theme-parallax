<script lang="ts">
	import type { Component } from "svelte";
	import { SvelteMap } from "svelte/reactivity";
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "$lib/components/ui/sonner/index.js";
	import AppShell from "$lib/components/layout/AppShell.svelte";
	import AppSidebar from "$lib/components/layout/AppSidebar.svelte";
	import BrandMark from "$lib/components/navigation/BrandMark.svelte";
	import { activeFlavor } from "$lib/hooks/flavor.svelte.js";
	import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import { dashboardData } from "$lib/data/dashboard.js";
	import {
		CATALOG_PATH,
		href,
		normalisePath,
		route,
		scrollCanvas,
		type RoutePath,
	} from "$lib/hooks/route.svelte.js";
	import { DEFAULT_THEME } from "$lib/themes/index.js";

	/**
	 * The application root: choose a page, and mount the two things that must exist exactly
	 * once for the whole app.
	 *
	 * `ModeWatcher` owns both appearance attributes on `<html>` — the `.dark` class and the
	 * `data-theme` the palettes select on; `Toaster` is the single portal every
	 * `toast()` call renders into — the Sonner page calls it, and without this the toasts are
	 * silently swallowed.
	 *
	 * The routing lives here rather than inside `AppShell` because `AppShell` is the chrome
	 * that surrounds whichever page is current — it should not have an opinion about which one
	 * that is.
	 */

	/**
	 * Every route's page, loaded on demand.
	 *
	 * WHY DYNAMIC IMPORTS — the heavier pages drag in TanStack Table, dnd-kit, two calendars,
	 * the command palette and LayerChart. Imported statically they all landed in the entry
	 * chunk, so opening any one page downloaded a megabyte of things it does not render.
	 *
	 * Typing this as `Record<RoutePath, …>` rather than an `{#if}` chain also makes the router
	 * exhaustive: adding a route to `ROUTES` without adding it here is a type error, where the
	 * old chain would have silently fallen through to whichever page came last.
	 */
	const pages: Record<RoutePath, () => Promise<{ default: Component }>> = {
		// The catalog index and the thirteen group pages, which exist because the breadcrumb
		// promises them. Every group route resolves to the SAME component: it reads the current
		// path to find its group, so thirteen near-identical page files never have to be kept in
		// step with `CATEGORIES`.
		"/components": () => import("$lib/components/pages/CatalogPage.svelte"),
		"/components/group/patterns": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/dates-and-time": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/ai-chat": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/pickers": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/form-controls": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/form-layout": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/layout": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/navigation": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/overlays": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/feedback": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/data-display": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/utilities": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/group/actions": () => import("$lib/components/pages/GroupPage.svelte"),
		"/components/accordion": () => import("$lib/components/pages/AccordionPage.svelte"),
		"/components/action-bar": () => import("$lib/components/pages/ActionBarPage.svelte"),
		"/components/alert": () => import("$lib/components/pages/AlertPage.svelte"),
		"/components/alert-dialog": () => import("$lib/components/pages/AlertDialogPage.svelte"),
		"/components/angle-slider": () => import("$lib/components/pages/AngleSliderPage.svelte"),
		"/components/aspect-ratio": () => import("$lib/components/pages/AspectRatioPage.svelte"),
		"/components/autocomplete": () => import("$lib/components/pages/AutocompletePage.svelte"),
		"/components/avatar": () => import("$lib/components/pages/AvatarPage.svelte"),
		"/components/badge": () => import("$lib/components/pages/BadgePage.svelte"),
		"/components/banner": () => import("$lib/components/pages/BannerPage.svelte"),
		"/components/breadcrumb": () => import("$lib/components/pages/BreadcrumbPage.svelte"),
		"/components/button": () => import("$lib/components/pages/ButtonPage.svelte"),
		"/components/button-group": () => import("$lib/components/pages/ButtonGroupPage.svelte"),
		"/components/calendar": () => import("$lib/components/pages/CalendarPage.svelte"),
		"/components/card": () => import("$lib/components/pages/CardPage.svelte"),
		"/components/carousel": () => import("$lib/components/pages/CarouselPage.svelte"),
		"/components/chart": () => import("$lib/components/pages/ChartPage.svelte"),
		"/components/chat-surface": () => import("$lib/components/pages/ChatSurfacePage.svelte"),
		"/components/checkbox": () => import("$lib/components/pages/CheckboxPage.svelte"),
		"/components/checkbox-group": () => import("$lib/components/pages/CheckboxGroupPage.svelte"),
		"/components/circular-progress": () =>
			import("$lib/components/pages/CircularProgressPage.svelte"),
		"/components/code-block": () => import("$lib/components/pages/CodeBlockPage.svelte"),
		"/components/collapsible": () => import("$lib/components/pages/CollapsiblePage.svelte"),
		"/components/compare-slider": () => import("$lib/components/pages/CompareSliderPage.svelte"),
		"/components/color-picker": () => import("$lib/components/pages/ColorPickerPage.svelte"),
		"/components/color-swatch": () => import("$lib/components/pages/ColorSwatchPage.svelte"),
		"/components/cropper": () => import("$lib/components/pages/CropperPage.svelte"),
		"/components/combobox": () => import("$lib/components/pages/ComboboxPage.svelte"),
		"/components/command": () => import("$lib/components/pages/CommandPage.svelte"),
		"/components/context-menu": () => import("$lib/components/pages/ContextMenuPage.svelte"),
		"/components/copy-button": () => import("$lib/components/pages/CopyButtonPage.svelte"),
		"/components/data-grid": () => import("$lib/components/pages/DataGridPage.svelte"),
		"/components/data-table": () => import("$lib/components/pages/DataTablePage.svelte"),
		"/components/conversation": () => import("$lib/components/pages/ConversationPage.svelte"),
		"/components/message": () => import("$lib/components/pages/MessagePage.svelte"),
		"/components/prompt-input": () => import("$lib/components/pages/PromptInputPage.svelte"),
		"/components/suggestion": () => import("$lib/components/pages/SuggestionPage.svelte"),
		"/components/reasoning": () => import("$lib/components/pages/ReasoningPage.svelte"),
		"/components/tool": () => import("$lib/components/pages/ToolPage.svelte"),
		"/components/chain-of-thought": () => import("$lib/components/pages/ChainOfThoughtPage.svelte"),
		"/components/task": () => import("$lib/components/pages/TaskPage.svelte"),
		"/components/confirmation": () => import("$lib/components/pages/ConfirmationPage.svelte"),
		"/components/question": () => import("$lib/components/pages/QuestionPage.svelte"),
		"/components/context-usage": () => import("$lib/components/pages/ContextUsagePage.svelte"),
		"/components/model-selector": () => import("$lib/components/pages/ModelSelectorPage.svelte"),
		"/components/date-selector": () => import("$lib/components/pages/DateSelectorPage.svelte"),
		"/components/dialog": () => import("$lib/components/pages/DialogPage.svelte"),
		"/components/drawer": () => import("$lib/components/pages/DrawerPage.svelte"),
		"/components/dropdown-menu": () => import("$lib/components/pages/DropdownMenuPage.svelte"),
		"/components/empty": () => import("$lib/components/pages/EmptyPage.svelte"),
		"/components/event-calendar": () => import("$lib/components/pages/EventCalendarPage.svelte"),
		"/components/field": () => import("$lib/components/pages/FieldPage.svelte"),
		"/components/file-upload": () => import("$lib/components/pages/FileUploadPage.svelte"),
		"/components/filters": () => import("$lib/components/pages/FiltersPage.svelte"),
		"/components/frame": () => import("$lib/components/pages/FramePage.svelte"),
		"/components/fps": () => import("$lib/components/pages/FpsPage.svelte"),
		"/components/gauge": () => import("$lib/components/pages/GaugePage.svelte"),
		"/components/hover-card": () => import("$lib/components/pages/HoverCardPage.svelte"),
		"/components/icon-stack": () => import("$lib/components/pages/IconStackPage.svelte"),
		"/components/icon-tile": () => import("$lib/components/pages/IconTilePage.svelte"),
		"/components/input": () => import("$lib/components/pages/InputPage.svelte"),
		"/components/input-group": () => import("$lib/components/pages/InputGroupPage.svelte"),
		"/components/input-otp": () => import("$lib/components/pages/InputOtpPage.svelte"),
		"/components/item": () => import("$lib/components/pages/ItemPage.svelte"),
		"/components/json-viewer": () => import("$lib/components/pages/JsonViewerPage.svelte"),
		"/components/kanban": () => import("$lib/components/pages/KanbanPage.svelte"),
		"/components/kbd": () => import("$lib/components/pages/KbdPage.svelte"),
		"/components/key-value": () => import("$lib/components/pages/KeyValuePage.svelte"),
		"/components/language-selector": () =>
			import("$lib/components/pages/LanguageSelectorPage.svelte"),
		"/components/list-group": () => import("$lib/components/pages/ListGroupPage.svelte"),
		"/components/listbox": () => import("$lib/components/pages/ListboxPage.svelte"),
		"/components/loader": () => import("$lib/components/pages/LoaderPage.svelte"),
		"/components/marquee": () => import("$lib/components/pages/MarqueePage.svelte"),
		"/components/mask-input": () => import("$lib/components/pages/MaskInputPage.svelte"),
		"/components/masonry": () => import("$lib/components/pages/MasonryPage.svelte"),
		"/components/media-player": () => import("$lib/components/pages/MediaPlayerPage.svelte"),
		"/components/mention": () => import("$lib/components/pages/MentionPage.svelte"),
		"/components/menubar": () => import("$lib/components/pages/MenubarPage.svelte"),
		"/components/native-select": () => import("$lib/components/pages/NativeSelectPage.svelte"),
		"/components/navigation-menu": () => import("$lib/components/pages/NavigationMenuPage.svelte"),
		"/components/number-field": () => import("$lib/components/pages/NumberFieldPage.svelte"),
		"/components/page-headers": () => import("$lib/components/pages/PageHeadersPage.svelte"),
		"/components/pagination": () => import("$lib/components/pages/PaginationPage.svelte"),
		"/components/partition-bar": () => import("$lib/components/pages/PartitionBarPage.svelte"),
		"/components/pending": () => import("$lib/components/pages/PendingPage.svelte"),
		"/components/phone-input": () => import("$lib/components/pages/PhoneInputPage.svelte"),
		"/components/popover": () => import("$lib/components/pages/PopoverPage.svelte"),
		"/components/progress": () => import("$lib/components/pages/ProgressPage.svelte"),
		"/components/qr-code": () => import("$lib/components/pages/QrCodePage.svelte"),
		"/components/quickstart": () => import("$lib/components/pages/QuickstartPage.svelte"),
		"/components/radio-group": () => import("$lib/components/pages/RadioGroupPage.svelte"),
		"/components/rating": () => import("$lib/components/pages/RatingPage.svelte"),
		"/components/relative-time-card": () =>
			import("$lib/components/pages/RelativeTimeCardPage.svelte"),
		"/components/resizable": () => import("$lib/components/pages/ResizablePage.svelte"),
		"/components/responsive-dialog": () =>
			import("$lib/components/pages/ResponsiveDialogPage.svelte"),
		"/components/scroll-area": () => import("$lib/components/pages/ScrollAreaPage.svelte"),
		"/components/scroll-spy": () => import("$lib/components/pages/ScrollSpyPage.svelte"),
		"/components/scroller": () => import("$lib/components/pages/ScrollerPage.svelte"),
		"/components/segmented-input": () => import("$lib/components/pages/SegmentedInputPage.svelte"),
		"/components/select": () => import("$lib/components/pages/SelectPage.svelte"),
		"/components/selection-toolbar": () =>
			import("$lib/components/pages/SelectionToolbarPage.svelte"),
		"/components/separator": () => import("$lib/components/pages/SeparatorPage.svelte"),
		"/components/settings": () => import("$lib/components/pages/SettingsPage.svelte"),
		"/components/shake": () => import("$lib/components/pages/ShakePage.svelte"),
		"/components/sheet": () => import("$lib/components/pages/SheetPage.svelte"),
		"/components/sizing": () => import("$lib/components/pages/SizingPage.svelte"),
		"/components/skeleton": () => import("$lib/components/pages/SkeletonPage.svelte"),
		"/components/slider": () => import("$lib/components/pages/SliderPage.svelte"),
		"/components/sonner": () => import("$lib/components/pages/SonnerPage.svelte"),
		"/components/sortable": () => import("$lib/components/pages/SortablePage.svelte"),
		"/components/speed-dial": () => import("$lib/components/pages/SpeedDialPage.svelte"),
		"/components/spinner": () => import("$lib/components/pages/SpinnerPage.svelte"),
		"/components/status": () => import("$lib/components/pages/StatusPage.svelte"),
		"/components/status-monitor": () => import("$lib/components/pages/StatusMonitorPage.svelte"),
		"/components/stepper": () => import("$lib/components/pages/StepperPage.svelte"),
		"/components/swap": () => import("$lib/components/pages/SwapPage.svelte"),
		"/components/switch": () => import("$lib/components/pages/SwitchPage.svelte"),
		"/components/table": () => import("$lib/components/pages/TablePage.svelte"),
		"/components/tables-in-cards": () => import("$lib/components/pages/TablesInCardsPage.svelte"),
		"/components/tabs": () => import("$lib/components/pages/TabsPage.svelte"),
		"/components/tags-input": () => import("$lib/components/pages/TagsInputPage.svelte"),
		"/components/text-gradient": () => import("$lib/components/pages/TextGradientPage.svelte"),
		"/components/textarea": () => import("$lib/components/pages/TextareaPage.svelte"),
		"/components/themes": () => import("$lib/components/pages/ThemesPage.svelte"),
		"/components/timeline": () => import("$lib/components/pages/TimelinePage.svelte"),
		"/components/toggle": () => import("$lib/components/pages/TogglePage.svelte"),
		"/components/toggle-group": () => import("$lib/components/pages/ToggleGroupPage.svelte"),
		"/components/tooltip": () => import("$lib/components/pages/TooltipPage.svelte"),
		"/components/tour": () => import("$lib/components/pages/TourPage.svelte"),
		"/components/tree": () => import("$lib/components/pages/TreePage.svelte"),
		"/components/typography": () => import("$lib/components/pages/TypographyPage.svelte"),
	};

	/**
	 * Resolved pages, kept so a second visit renders synchronously rather than flashing the
	 * skeleton again for a chunk the browser already has.
	 *
	 * `SvelteMap`, not `$state(new Map())`: `$state` does not track mutations of a built-in
	 * `Map`, so `loaded.set(...)` would store the component without ever invalidating the
	 * `$derived` below — and the skeleton would stay up forever.
	 */
	const loaded = new SvelteMap<RoutePath, Component>();

	const current = $derived(loaded.get(route.current));

	/**
	 * The route whose chunk could not be fetched, so the shell can say so instead of holding the
	 * skeleton up forever. Storing the path rather than a boolean is what lets the message clear
	 * itself: navigating anywhere else already makes the comparison below false.
	 */
	let failedPath = $state<RoutePath | null>(null);

	const loadFailed = $derived(failedPath === route.current);

	/**
	 * Key for the one-shot reload below. `sessionStorage` and not a module variable: the whole
	 * point is to survive the reload it triggers, and to be forgotten when the tab closes.
	 */
	const RELOAD_KEY = "chunk-reload-attempted";

	$effect(() => {
		const path = route.current;
		if (loaded.has(path)) return;

		let cancelled = false;
		pages[path]()
			.then((module) => {
				if (cancelled) return;
				loaded.set(path, module.default);
				try {
					sessionStorage.removeItem(RELOAD_KEY);
				} catch {
					/* storage blocked — nothing was written, so there is nothing to clear */
				}
			})
			.catch((error) => {
				if (cancelled) return;

				/*
				 * A rejected page import means the browser asked for a chunk this document's
				 * `index.html` names but the server no longer has — the file names carry a
				 * content hash, so any rebuild renames every chunk it changed and deletes the
				 * old one. A tab left open across a deploy therefore holds a manifest of dead
				 * URLs, and every navigation from it 404s.
				 *
				 * Reloading fetches a current `index.html` and fixes it outright, so that is
				 * what happens — once. The `sessionStorage` guard is what makes it once: if the
				 * fresh document fails the same way the fault is not staleness, and a second
				 * reload would only spin. In that case the message below is shown instead.
				 *
				 * With storage blocked the `sessionStorage` getter itself throws; the marker
				 * then cannot make a reload one-shot, so the catch treats the attempt as
				 * already spent and falls through to the message rather than risking a loop.
				 */
				try {
					if (!sessionStorage.getItem(RELOAD_KEY)) {
						sessionStorage.setItem(RELOAD_KEY, "1");
						location.reload();
						return;
					}
				} catch {
					/* storage blocked — fall through to the failure message */
				}

				failedPath = path;
				console.error(`Could not load the page chunk for ${path}.`, error);
			});

		// A fast back-and-forth can resolve out of order; the guard drops the stale answer.
		return () => {
			cancelled = true;
		};
	});

	/**
	 * Put the reader where the navigation says they should be — once the page is really there.
	 *
	 * THE ROUTER CANNOT DO THIS ITSELF. It knows the destination the moment the link is clicked,
	 * but the page behind it is a dynamic import: for a few hundred milliseconds the canvas holds
	 * a `Skeleton` a few hundred pixels tall, and a scroll issued then is clamped to that height
	 * and silently wrong. This effect waits for `loaded` to hold the chunk, which is the same
	 * condition that renders `<Page />`, so by the time it runs the real page is in the DOM.
	 *
	 * THE CANVAS, NOT THE WINDOW. Inside the shell the document never scrolls — `src/app.css`
	 * pins the wrapper to the viewport and makes `Sidebar.Inset`, the `<main>` `AppShell` labels
	 * `#main-content`, the one scroll container — so `window.scrollTo` would move nothing and say
	 * nothing. `scrollCanvas` resolves that element (and the document where there is no shell),
	 * so the offset the router stamped, that box's `scrollTop`, goes back onto the box it was
	 * read from.
	 *
	 * It reads `route.current` as well as `loaded`, because the thirteen group routes share ONE
	 * component: navigating between them leaves `current` identical and would never re-run an
	 * effect that only watched the component.
	 *
	 * `takePendingScroll` returns `null` for a landing this effect must not touch — a URL with a
	 * fragment, which belongs to the page's own heading scroll, and every read after the first.
	 *
	 * THEN FOCUS MOVES TO THE CANVAS. Keyboard scrolling — PageDown, Space, the arrows — starts
	 * from the focused element and walks UP to the first scrollable ancestor; it never falls back
	 * to a sibling scroller. While the document scrolled that walk always ended at the document,
	 * so focus could sit anywhere. Now the canvas is the one scroller and the rail is not inside
	 * it, so after "click a rail link, press PageDown" the walk from the link finds nothing and
	 * nothing moves — measured in Chrome. Focusing the `<main>` puts the start of that walk on the
	 * scroller itself; `AppShell` already gives it `tabindex={-1}` (for the skip link) and hides
	 * the ring, and `preventScroll` keeps the focus call from touching the offset just restored.
	 * This is also the standard SPA practice: a route change moves focus to the main content, so a
	 * screen reader announces the new page rather than staying on the link that led to it. It runs
	 * for every route change and for the first load (where `takePendingScroll` answers 0), and is
	 * skipped with the scroll on a fragment landing — `DocPage` focuses the heading there — and on
	 * repeat reads.
	 */
	$effect(() => {
		const path = route.current;
		if (!loaded.has(path)) return;

		const target = route.takePendingScroll();
		if (target === null) return;

		scrollCanvas().scrollTo({ top: target, behavior: "instant" });
		scrollCanvas().focus({ preventScroll: true });
	});
</script>

<!--
	`defaultTheme` is what a first visit gets, and what an empty `mode-watcher-theme` falls back
	to. `DEFAULT_THEME` is the single spelling of it; `index.html`'s first-paint script must carry
	the same literal — see the comment there for why that script exists at all.
-->
<ModeWatcher defaultTheme={DEFAULT_THEME} />
<Toaster />

<!--
	The demo's data and its router meet HERE, and nowhere below. `AppSidebar` takes both as
	props since the shell published: the identity/workspaces/nav content, and the one predicate
	that answers "is this url the page on screen?" — which is the entire coupling between the
	sidebar and this application's router.

	The url the sidebar holds already carries the site base, so the predicate resolves it against
	the document before comparing: `new URL` turns both an absolute and a relative href into the
	same pathname, and `normalisePath` takes the base back off.
-->
<!--
	The `crest` flavor's brand mark, declared once and handed to the sidebar only while that flavor
	is on. A snippet is a value, so the choice is made where it is PASSED rather than by wrapping
	the sidebar in an `{#if}`: `AppSidebar` falls back to the workspace switcher whenever `header`
	is undefined, so nothing published has to know this exists.

	Importing the flavor hook here is also what guarantees its attribute effect runs on every
	route, including the one that renders no page at all.
-->
{#snippet brandHeader()}
	<BrandMark />
{/snippet}

<AppShell>
	{#snippet sidebar()}
		<AppSidebar
			user={dashboardData.user}
			workspaces={dashboardData.workspaces}
			items={dashboardData.navMain}
			label="Components"
			header={activeFlavor.current === "crest" ? brandHeader : undefined}
			isActive={(url) => normalisePath(new URL(url, location.href).pathname) === route.current}
		/>
	{/snippet}
	{#if route.notFound}
		<!--
			An address that names nothing gets said so, rather than the front door rendered under a
			rewritten URL. `route.svelte.ts`'s own header calls that outcome "worse than a 404 because
			it looks like a working page"; the `ALIASES` table answers it for a route that was retired,
			and this answers it for one that never existed. The path the reader typed is still in the
			address bar — the router skips canonicalisation here — so they can see what was asked for.
		-->
		<div class="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
			<p class="text-sm font-medium">This page does not exist.</p>
			<p class="max-w-prose text-sm text-muted-foreground">
				Nothing in the gallery answers to that address. The index lists every component, and
				<kbd class="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
					>Ctrl</kbd
				>
				+
				<kbd class="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
					>K</kbd
				> searches it.
			</p>
			<a href={href(CATALOG_PATH)} class={buttonVariants({ variant: "outline" })}>
				Browse the components
			</a>
		</div>
	{:else if current}
		{@const Page = current}
		<Page />
	{:else if loadFailed}
		<!--
			Only reached when a reload has already been tried and the chunk is still missing, so
			the honest thing to report is that the page could not be fetched — not to keep
			pretending it is on its way.
		-->
		<div class="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
			<p class="text-sm font-medium">This page could not be loaded.</p>
			<p class="text-sm text-muted-foreground">
				Its code failed to download. Check your connection, then try again.
			</p>
			<Button variant="outline" onclick={() => location.reload()}>Reload</Button>
		</div>
	{:else}
		<!--
			Mirrors the shape every page renders: a header-height bar, then content. Sized from
			the same `h-16` the shared `PageHeader` uses, so the layout does not jump when the
			real page arrives.
		-->
		<div class="flex flex-1 flex-col gap-4 p-4">
			<Skeleton class="h-8 w-64" />
			<Skeleton class="min-h-96 flex-1 rounded-xl" />
		</div>
	{/if}
</AppShell>
