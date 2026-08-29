<script lang="ts">
	import type { Snippet } from "svelte";
	import ContentColumn from "$lib/components/layout/ContentColumn.svelte";
	import PageHeader from "$lib/components/layout/PageHeader.svelte";
	import PageIntro from "$lib/components/layout/PageIntro.svelte";
	import CommandPalette from "$lib/components/navigation/CommandPalette.svelte";
	import ModeToggle from "$lib/components/navigation/ModeToggle.svelte";
	import RepositoryLink from "$lib/components/navigation/RepositoryLink.svelte";
	import {
		setSectionSourceContext,
		type PageSections,
		type SectionSource,
	} from "$lib/components/layout/section-source.js";
	import {
		CATALOG_PATH,
		CATEGORIES,
		categoryByPath,
		categoryOf,
		groupPath,
		href,
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
	 * standing on is a picture of a hierarchy, not a hierarchy. So the index and the thirteen group
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
		const root = { label: "Components", href: href(CATALOG_PATH) };

		if (onCatalog) return [{ label: "Components" }];
		if (ownGroup) return [root, { label: ownGroup.title }];
		if (group)
			return [root, { label: group.title, href: href(groupPath(group.slug)) }, { label: title }];
		return [root, { label: title }];
	});

	/**
	 * Every page's examples, extracted at build time and fetched on demand.
	 *
	 * LAZY, and that is the whole design. Eagerly, 1307 examples — nearly 2 MB of text nobody has
	 * asked for — would land in this component's chunk and be downloaded by every visitor. Lazily,
	 * each page's set is its own small chunk, fetched by the first press of a code control on that
	 * page and by nothing else. The same shape `LoaderPage` uses for its 128 loader sources.
	 *
	 * `?sections` is answered by `tools/site/vite-plugin-doc-sections.mjs`, which runs the
	 * compiler's parser over the page in Node. Nothing is parsed in the browser.
	 */
	const pageSections = import.meta.glob<PageSections>("$lib/components/pages/*Page.svelte", {
		query: "?sections",
		import: "default",
	});

	/**
	 * The loader for the page on screen, found the way `tools/registry/generate.mjs` finds a page
	 * file: the route's last segment with its dashes removed, matched case-insensitively against
	 * the file names. The casing of an acronym is not predictable — `InputOtpPage` beside what
	 * could as easily have been `InputOTPPage` — so the comparison is lowercased rather than
	 * reconstructed.
	 *
	 * `undefined` for the catalog index and the thirteen group pages: they render sections from a
	 * component that is not named after any route, so there is no page file to extract, and the
	 * control is simply not offered there.
	 */
	const sectionLoader = $derived.by(() => {
		const slug = route.current.split("/").at(-1) ?? "";
		const wanted = `${slug.replaceAll("-", "")}page.svelte`;
		const key = Object.keys(pageSections).find(
			(path) => (path.split("/").at(-1) ?? "").toLowerCase() === wanted,
		);
		return key ? pageSections[key] : undefined;
	});

	/**
	 * The examples for the page on screen, once fetched.
	 *
	 * Held in a plain `Map` rather than in state: the only reader is the producer below, called
	 * from a click, and caching by LOADER rather than by route means the thirteen group routes that
	 * share a component would share an entry too, if they had one.
	 */
	const loaded = new Map<unknown, PageSections>();

	setSectionSourceContext({
		get available() {
			return sectionLoader !== undefined;
		},
		get(key: string): SectionSource | Promise<SectionSource> {
			const loader = sectionLoader;
			if (!loader) throw new Error(`no extracted examples for ${route.current}`);

			const take = (sections: PageSections) => {
				const source = sections[key];
				if (!source) throw new Error(`no example extracted for "${key}" on ${route.current}`);
				return source;
			};

			// Synchronous once the page's chunk has arrived, so the pending face appears exactly
			// once per page rather than flashing on every press.
			const cached = loaded.get(loader);
			if (cached) return take(cached);

			return loader().then((sections) => {
				loaded.set(loader, sections);
				return take(sections);
			});
		},
	});

	/**
	 * How long a landing keeps correcting itself, in ms.
	 *
	 * Long enough for a `<video>` to report its dimensions and for an accordion to finish opening
	 * — the two things on this site that add height ABOVE a target after it has been scrolled to,
	 * and which without this leave the reader looking at whatever happens to be a screen further
	 * down. Short enough that it is over before anyone would want to scroll away from it.
	 */
	const SETTLE_MS = 1000;

	/**
	 * The page's own body: the box below the header that holds every section.
	 *
	 * Bound so the landing below can watch it grow. Inside the shell `<body>` cannot stand in for
	 * it — `src/app.css` pins `Sidebar.Provider`'s wrapper to `100dvh` and makes `Sidebar.Inset`
	 * the scroll container, so however much a page grows, the document's box never changes.
	 */
	let content = $state<HTMLDivElement | null>(null);

	/**
	 * The heading the address bar's fragment names, or `null`.
	 *
	 * `getElementById` and not `querySelector("#" + id)`: a section id may begin with a digit
	 * (`4-5-social-media-portrait-aspect-ratio`), which is a perfectly good id and an invalid CSS
	 * selector. This is also exactly how the browser resolves the fragment itself, so a link
	 * followed inside the page and a link opened cold can never disagree about the target.
	 */
	function fragmentHeading(): HTMLElement | null {
		const raw = window.location.hash.slice(1);
		if (!raw) return null;
		let id = raw;
		try {
			id = decodeURIComponent(raw);
		} catch {
			/* A mangled escape — take the fragment literally rather than throwing on the way in. */
		}
		return document.getElementById(id);
	}

	function scrollToHeading(heading: HTMLElement): void {
		// `scrollIntoView`, never a `scrollTo`: it scrolls whichever ancestor of the heading
		// scrolls — the shell's canvas, `[data-slot="sidebar-inset"]`, never the document — and
		// honours the `scroll-padding-top` `src/app.css` sets on that canvas to keep the sticky
		// header off the heading. A `scrollTo` would have to know both, and get both right.
		heading.scrollIntoView({ block: "start", behavior: "instant" });
	}

	/**
	 * Land on the section a deep link names, once the page is really on screen.
	 *
	 * WHY THE BROWSER CANNOT DO THIS ONE. Chrome scrolls to a fragment exactly once, when parsing
	 * ends; an element that appears later is never scrolled to, and `:target` never matches it
	 * (measured — it does not retry at `load`, whatever the specification allows). Every page here
	 * arrives through a dynamic `import()` in `App.svelte`, which resolves well after that moment,
	 * so a cold visit to `/components/button#icon` would otherwise open at the top of the page.
	 * A click on a link INSIDE the page is a different story and stays the browser's: it happens
	 * long after parsing, on an element that already exists.
	 *
	 * `route.current` is read so this survives a page swap that does not remount `DocPage`. Today
	 * `GroupPage` does remount — it keys its own body on the route — but nothing enforces that, and
	 * a mount-only effect would fail silently the day a page decided to stay put.
	 *
	 * The focus is what makes the landing exist for a screen reader, which has no viewport to
	 * notice moved; `preventScroll` keeps it from undoing the scroll that was just made.
	 */
	$effect(() => {
		route.current;

		const heading = fragmentHeading();
		if (!heading) return;

		scrollToHeading(heading);
		heading.focus({ preventScroll: true });

		/*
		 * Then keep it there while the page settles. A bounded window, and any gesture ends it
		 * early: correcting the scroll under a reader who has started scrolling themselves would
		 * be the page fighting them, which is worse than landing slightly wrong.
		 *
		 * `pointerdown` is in the list for the scrollbar, which emits none of the other three —
		 * a reader who grabs it during the window would otherwise be snapped back to the heading
		 * every time something above the target finished laying itself out.
		 */
		const controller = new AbortController();
		const observer = new ResizeObserver(() => scrollToHeading(heading));
		const stop = () => {
			observer.disconnect();
			controller.abort();
			clearTimeout(timer);
		};
		const timer = setTimeout(stop, SETTLE_MS);

		/*
		 * `content`, not `document.body`. Everything on this site that adds height ABOVE a target
		 * after it has been scrolled to — the `<video>` and the accordion `SETTLE_MS` is sized
		 * for — sits inside the page's own body, whose box grows with it in either arrangement.
		 * `<body>` was the right thing to watch while the document scrolled; inside the shell its
		 * box is the viewport's and never changes, so an observer on it fires once, on observe,
		 * and never again — the landing would then stop correcting itself with nothing to show
		 * for it. The header above `content` is sticky and fixed-height, and is not watched.
		 */
		if (content) observer.observe(content);
		for (const type of ["wheel", "touchstart", "keydown", "pointerdown"] as const) {
			window.addEventListener(type, stop, { signal: controller.signal, passive: true });
		}

		return stop;
	});

	/**
	 * Scroll for the one fragment move the browser declines to make.
	 *
	 * Back and Forward between two sections of one page fire `hashchange`, but with
	 * `history.scrollRestoration` set to `manual` — which the router sets, because the automatic
	 * kind restores onto the loading skeleton — nothing moves. A click inside the page reaches
	 * here too, after the browser has already scrolled, where this is a second instant scroll to
	 * the position already reached and therefore invisible.
	 *
	 * No focus move here, deliberately. The reader is already on the page, the browser has set the
	 * sequential focus starting point for them, and pulling focus onto the heading would take it
	 * off the control they just activated.
	 */
	$effect(() => {
		const onHashChange = () => {
			const heading = fragmentHeading();
			if (heading) scrollToHeading(heading);
		};

		window.addEventListener("hashchange", onHashChange);
		return () => window.removeEventListener("hashchange", onHashChange);
	});

	/**
	 * One element per id, checked while developing.
	 *
	 * A section's id is derived from its title, and a demo on the same page is free to use any id
	 * it likes for its own controls. When the two collide, the browser resolves the fragment to
	 * whichever comes FIRST in the document — so a section link silently lands on a checkbox — and
	 * a `<label for>` in that demo can end up naming the heading instead of its own control.
	 * Neither failure announces itself, so it is asserted here rather than discovered later.
	 */
	$effect(() => {
		if (!import.meta.env.DEV) return;
		route.current;

		const counts = new Map<string, number>();
		for (const element of document.querySelectorAll<HTMLElement>("[id]")) {
			counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
		}

		for (const [id, count] of counts) {
			if (count > 1) {
				console.error(
					`DocPage: id "${id}" is used by ${count} elements on ${route.current}. A section link resolves to the first of them.`,
				);
			}
		}
	});
</script>

<!--
	The palette rides in through `search` because it is the demo's: it reads this gallery's
	catalog, which the published header cannot know. The slot is the seam — one line here, and
	none of the 109 pages that render DocPage are aware the header stopped hardcoding it.

	`controls` is the same seam for the same reason. Overriding it means rendering the GROUP, so
	the light/dark toggle is repeated here rather than inherited: that is the slot's contract, and
	the header's own comment says so. The repository link goes first because the toggle is the
	control a reader reaches for repeatedly and belongs closest to the edge it always sits at.
-->
<PageHeader {trail}>
	{#snippet search()}
		<CommandPalette />
	{/snippet}
	{#snippet controls()}
		<RepositoryLink />
		<ModeToggle />
	{/snippet}
</PageHeader>

<div bind:this={content} class="px-3 pb-4 md:px-9">
	<ContentColumn>
		<PageIntro {title} {subtitle} />
		<div>
			{@render children()}
		</div>
	</ContentColumn>
</div>
