/**
 * The current route, derived from `location.hash` — and the catalog it is derived FROM.
 *
 * WHY HASH ROUTING — this project is a plain Vite SPA with no server. Path-based routing
 * (`/components/badge`) needs the host to rewrite unknown paths to `index.html`;
 * deep-linking to `/components/badge` on a static host returns 404 instead. The fragment
 * never reaches the server, so `#/components/badge` survives a reload and a bookmark with
 * no configuration at all.
 *
 * WHY NOT A ROUTER LIBRARY — the whole contract is "read a string, react to a browser
 * event". `svelte-spa-router` and friends add route params, guards, nested layouts and a
 * dependency; this app has one flat list of static routes.
 *
 * WHY THE CATALOG LIVES HERE — it used to live in three places. `ROUTES` was the type-level
 * source of truth, `App.svelte`'s page map was checked against it, and `dashboard.ts` held a
 * third hand-maintained copy whose `url` was typed `string`. Renaming a slug and forgetting the
 * sidebar left `npm run check` clean and the link dead: it fell through {@link normaliseHash}
 * to {@link HOME} and silently rendered another page. Not a 404 — a wrong page that looks
 * right. {@link CATEGORIES} is now the single declaration; the routes, the route type and the
 * sidebar are all derived from it, so the three can no longer disagree.
 */

/**
 * Entries that sit ABOVE the groups: a title and a destination, no children.
 *
 * `dashboard.ts` states the rule this obeys — an entry with children is a category, not a
 * place. The page that explains what this kit IS has to be clickable, so it cannot be a group,
 * and it would be filed under `Patterns` by the ladder's first rung (it has no
 * `src/lib/components/ui/themes/` folder) if it went through the ladder at all. It does not:
 * it is hoisted, deliberately and by name, which is why rung 1's test below is written as
 * "of the routes that reach it".
 */
export const DESTINATIONS = [
	{ title: "Settings", slug: "/components/settings" },
	{ title: "Themes", slug: "/components/themes" },
	// Sizing is hoisted for the same reason Themes is: it states the control ramp and density
	// rules every group below obeys, so it belongs above the ladder rather than inside it.
	{ title: "Sizing", slug: "/components/sizing" },
] as const;

/**
 * Every component page, filed into an ORDERED ladder.
 *
 * THE ORDER IS LOAD-BEARING. These are not buckets, they are a decision procedure: a component
 * belongs to the FIRST group whose test it passes. That is what turns "it belongs in two
 * places" from a recurring argument into a lookup, and it is why `Pickers` sits above `Form
 * controls` (a Select is a form value, and would be swallowed) and `Actions` sits last ("is it
 * a button" is a tempting first question and a wrong one — checkbox, switch and half the
 * Pickers are all pressed). Moving a group up or down changes what it collects. Adding a
 * component means walking the rungs until one admits it, and adding a GROUP means deciding what
 * it steals from the groups below it. Each group carries its own admission test, stated twice:
 * in its comment, and as the `test` string the group pages render.
 *
 * The catalog was one alphabetical list of 104 entries once. Alphabetical order is neutral,
 * and a single flat list is what that neutrality costs; the ladder is the kit's own answer. A
 * Gantt page was deliberately not built.
 *
 * TITLES TRAVEL AS DATA. The slug is the kebab-cased title (`CONVENTIONS.md` §4) and that
 * direction holds for all of them, but the reverse does not: `Input OTP` and `QR code` are both
 * lost by a naive un-kebab. Deriving labels from slugs regresses two entries, so the label is
 * declared.
 */
export const CATEGORIES = [
	{
		/**
		 * Is there no `src/lib/components/ui/<slug>/` folder?
		 *
		 * A directory listing rather than an opinion, so nobody re-litigates it. It has to sit
		 * first: `file-upload` is a form control by every other test, and filing it as one hides
		 * the fact that it ships no component at all — its implementation is
		 * `src/lib/hooks/file-upload.svelte.ts`.
		 *
		 * Of the routes that reach the ladder. `settings`, `themes` and `sizing` also have no
		 * folders and are hoisted into {@link DESTINATIONS} above, by name.
		 */
		title: "Patterns",
		slug: "patterns",
		test: "Ships no component of its own — a page assembled from the others.",
		items: [
			{ title: "File upload", slug: "/components/file-upload" },
			{ title: "List group", slug: "/components/list-group" },
			{ title: "Page headers", slug: "/components/page-headers" },
			{ title: "Tables in cards", slug: "/components/tables-in-cards" },
			{ title: "Typography", slug: "/components/typography" },
		],
	},
	{
		/**
		 * Is the surface a calendar or a clock, or is the value a moment?
		 *
		 * Ordered as a ladder of its own rather than alphabetically: the primitive, then the
		 * filter built on it, then the scheduling surface, then the read-only display.
		 *
		 * Excludes `timeline`, which is a list of events rather than a moment, and whose parts are
		 * dot/connector/content. Admitting it would make this group a magnet for anything with a
		 * date in it, and the rung is only worth having while its test stays crisp.
		 */
		title: "Dates and time",
		slug: "dates-and-time",
		test: "The surface is a calendar or a clock, or the value is a moment.",
		items: [
			{ title: "Calendar", slug: "/components/calendar" },
			{ title: "Date selector", slug: "/components/date-selector" },
			{ title: "Event calendar", slug: "/components/event-calendar" },
			{ title: "Relative time card", slug: "/components/relative-time-card" },
		],
	},
	{
		/**
		 * Does the user choose from a set of options the component PRESENTS as a list?
		 *
		 * Above `Form controls`, or every one of these is swallowed by it; above `Overlays`, or
		 * every popup lands there instead. Excludes `dropdown-menu` and `context-menu`: those
		 * issue commands, they do not return a chosen value.
		 */
		title: "Pickers",
		slug: "pickers",
		test: "The reader chooses from a set of options the component presents as a list.",
		items: [
			{ title: "Autocomplete", slug: "/components/autocomplete" },
			{ title: "Combobox", slug: "/components/combobox" },
			{ title: "Command", slug: "/components/command" },
			{ title: "Filters", slug: "/components/filters" },
			{ title: "Language selector", slug: "/components/language-selector" },
			{ title: "Listbox", slug: "/components/listbox" },
			{ title: "Native select", slug: "/components/native-select" },
			{ title: "Select", slug: "/components/select" },
			{ title: "Tree", slug: "/components/tree" },
		],
	},
	{
		/**
		 * Does it produce or edit a value you would submit?
		 *
		 * Excludes `toggle` and `toggle-group`, whose state is application state rather than form
		 * data — they are in `Actions`. `color-picker` EDITS a colour and is here; `color-swatch`
		 * renders one and is in `Data display`.
		 */
		title: "Form controls",
		slug: "form-controls",
		test: "It produces or edits a value you would submit.",
		items: [
			{ title: "Angle slider", slug: "/components/angle-slider" },
			{ title: "Checkbox", slug: "/components/checkbox" },
			{ title: "Checkbox group", slug: "/components/checkbox-group" },
			{ title: "Color picker", slug: "/components/color-picker" },
			{ title: "Cropper", slug: "/components/cropper" },
			{ title: "Input", slug: "/components/input" },
			{ title: "Input OTP", slug: "/components/input-otp" },
			{ title: "Key value", slug: "/components/key-value" },
			{ title: "Mask input", slug: "/components/mask-input" },
			{ title: "Mention", slug: "/components/mention" },
			{ title: "Number field", slug: "/components/number-field" },
			{ title: "Phone input", slug: "/components/phone-input" },
			{ title: "Radio group", slug: "/components/radio-group" },
			{ title: "Rating", slug: "/components/rating" },
			{ title: "Segmented input", slug: "/components/segmented-input" },
			{ title: "Slider", slug: "/components/slider" },
			{ title: "Switch", slug: "/components/switch" },
			{ title: "Tags input", slug: "/components/tags-input" },
			{ title: "Textarea", slug: "/components/textarea" },
		],
	},
	{
		/**
		 * Does it HOLD a control, carry its label, description or error, and render no value of
		 * its own?
		 *
		 * This rung exists to answer a question that keeps being asked as "is Field a duplicate of
		 * Input". It is not, and the two sitting in different groups is the answer stated
		 * structurally: `field.svelte` is a `tv()` over a `<div role="group">` that imports no
		 * input primitive and renders no control, while `input.svelte` is one bare `<input>` with
		 * no label, description or error. Base UI ships Field, Fieldset, Form and Input as four
		 * first-class components for the same reason.
		 */
		title: "Form layout",
		slug: "form-layout",
		test: "It holds a control and carries its label, description or error, and renders no value of its own.",
		items: [
			{ title: "Field", slug: "/components/field" },
			{ title: "Input group", slug: "/components/input-group" },
		],
	},
	{
		/**
		 * Does it arrange, contain or reveal other content, without content of its own?
		 *
		 * The line against `Navigation` is one sentence: navigation moves you between destinations
		 * or views, these reveal content IN PLACE. That is why `accordion` and `collapsible` are
		 * here and `tabs` is not.
		 */
		title: "Layout",
		slug: "layout",
		test: "It arranges, contains or reveals other content, without content of its own.",
		items: [
			{ title: "Accordion", slug: "/components/accordion" },
			{ title: "Aspect ratio", slug: "/components/aspect-ratio" },
			{ title: "Card", slug: "/components/card" },
			{ title: "Carousel", slug: "/components/carousel" },
			{ title: "Collapsible", slug: "/components/collapsible" },
			{ title: "Compare slider", slug: "/components/compare-slider" },
			{ title: "Frame", slug: "/components/frame" },
			{ title: "Item", slug: "/components/item" },
			{ title: "Masonry", slug: "/components/masonry" },
			{ title: "Resizable", slug: "/components/resizable" },
			{ title: "Separator", slug: "/components/separator" },
		],
	},
	{
		/** Does it move the user between destinations or views, or say where they are? */
		title: "Navigation",
		slug: "navigation",
		test: "It moves the reader between destinations or views, or says where they are.",
		items: [
			{ title: "Breadcrumb", slug: "/components/breadcrumb" },
			{ title: "Menubar", slug: "/components/menubar" },
			{ title: "Navigation menu", slug: "/components/navigation-menu" },
			{ title: "Pagination", slug: "/components/pagination" },
			{ title: "Scroll spy", slug: "/components/scroll-spy" },
			{ title: "Stepper", slug: "/components/stepper" },
			{ title: "Tabs", slug: "/components/tabs" },
		],
	},
	{
		/**
		 * Does it render on a layer above the page, appearing and dismissing?
		 *
		 * Below `Pickers` and `Feedback` on purpose — a Combobox and a Sonner toast both render on
		 * a layer, and both have a better home. `action-bar` and `selection-toolbar` appear in
		 * response to context and are here; `speed-dial` is always on screen, so it is an Action.
		 * The five modal surfaces are ordered together.
		 */
		title: "Overlays",
		slug: "overlays",
		test: "It renders on a layer above the page, appearing and dismissing.",
		items: [
			{ title: "Dialog", slug: "/components/dialog" },
			{ title: "Alert dialog", slug: "/components/alert-dialog" },
			{ title: "Responsive dialog", slug: "/components/responsive-dialog" },
			{ title: "Sheet", slug: "/components/sheet" },
			{ title: "Drawer", slug: "/components/drawer" },
			{ title: "Popover", slug: "/components/popover" },
			{ title: "Hover card", slug: "/components/hover-card" },
			{ title: "Tooltip", slug: "/components/tooltip" },
			{ title: "Dropdown menu", slug: "/components/dropdown-menu" },
			{ title: "Context menu", slug: "/components/context-menu" },
			{ title: "Action bar", slug: "/components/action-bar" },
			{ title: "Selection toolbar", slug: "/components/selection-toolbar" },
			{ title: "Tour", slug: "/components/tour" },
		],
	},
	{
		/**
		 * Does it report system state — a message, a busy state, or progress?
		 *
		 * `progress` and `circular-progress` report task completion and are here; `gauge` renders a
		 * MEASURED value and is in `Data display`, which is the one place this ladder splits two
		 * components that compose (gauge is built from circular-progress). `CONVENTIONS.md` §9
		 * records that as an accepted cost.
		 *
		 * Alert, Banner and Sonner were 75 entries apart under the alphabetical list. Together,
		 * the difference between them — inline band, docked queue, transient stack — is finally
		 * statable.
		 *
		 * `loader` is a busy indicator, which is this rung's test read literally, and it is placed
		 * immediately after the `spinner` it is most easily confused with — the two are one click
		 * apart precisely because a reader who lands on one needs to be told about the other. The
		 * Loader page carries that sentence, as `ScrollerPage.svelte` does for its own pair. It is
		 * ONE route for ~128 peers rather than a route each: they share a props type, a barrel and
		 * a reduced-motion rule, and 128 sidebar entries would bury every other group in the
		 * ladder.
		 */
		title: "Feedback",
		slug: "feedback",
		test: "It reports system state — a message, a busy state, or progress.",
		items: [
			{ title: "Alert", slug: "/components/alert" },
			{ title: "Banner", slug: "/components/banner" },
			{ title: "Sonner", slug: "/components/sonner" },
			{ title: "Status", slug: "/components/status" },
			{ title: "Progress", slug: "/components/progress" },
			{ title: "Circular progress", slug: "/components/circular-progress" },
			{ title: "Spinner", slug: "/components/spinner" },
			{ title: "Loader", slug: "/components/loader" },
			{ title: "Skeleton", slug: "/components/skeleton" },
			{ title: "Empty", slug: "/components/empty" },
			{ title: "Status monitor", slug: "/components/status-monitor" },
			{ title: "FPS", slug: "/components/fps" },
		],
	},
	{
		/**
		 * Does it render information the user reads, watches or scans?
		 *
		 * The group doing the most residual work, and the first that will need splitting past
		 * roughly 130 components — `avatar`, `kbd`, `media-player` and `data-grid` share only
		 * "the user reads it". Ordering it into named runs buys that time: the table run in
		 * ascending capability (semantic markup, then the TanStack engine, then the virtualised
		 * editable grid), the identity marks, then the measured visuals.
		 */
		title: "Data display",
		slug: "data-display",
		test: "It renders information the reader reads, watches or scans.",
		items: [
			{ title: "Table", slug: "/components/table" },
			{ title: "Data table", slug: "/components/data-table" },
			{ title: "Data grid", slug: "/components/data-grid" },
			{ title: "Kanban", slug: "/components/kanban" },
			{ title: "Timeline", slug: "/components/timeline" },
			{ title: "Avatar", slug: "/components/avatar" },
			{ title: "Badge", slug: "/components/badge" },
			{ title: "Kbd", slug: "/components/kbd" },
			{ title: "Icon stack", slug: "/components/icon-stack" },
			{ title: "Icon tile", slug: "/components/icon-tile" },
			{ title: "Color swatch", slug: "/components/color-swatch" },
			{ title: "Chart", slug: "/components/chart" },
			{ title: "Gauge", slug: "/components/gauge" },
			{ title: "Code block", slug: "/components/code-block" },
			{ title: "JSON viewer", slug: "/components/json-viewer" },
			{ title: "Partition bar", slug: "/components/partition-bar" },
			{ title: "QR code", slug: "/components/qr-code" },
			{ title: "Media player", slug: "/components/media-player" },
		],
	},
	{
		/**
		 * Does it change how OTHER content behaves, having no content of its own?
		 *
		 * An admission test, not an exhaustion rule: nothing lands here by failing the rungs above.
		 * That is the whole difference between this group and the "Misc" bucket every catalogued
		 * design system eventually regrets — a component that passes no test is a component whose
		 * group is missing, and the answer is a new rung, not a dump.
		 */
		title: "Utilities",
		slug: "utilities",
		test: "It changes how OTHER content behaves, having no content of its own.",
		items: [
			{ title: "Scroll area", slug: "/components/scroll-area" },
			{ title: "Scroller", slug: "/components/scroller" },
			{ title: "Sortable", slug: "/components/sortable" },
			{ title: "Marquee", slug: "/components/marquee" },
			{ title: "Pending", slug: "/components/pending" },
			{ title: "Swap", slug: "/components/swap" },
			{ title: "Shake", slug: "/components/shake" },
			{ title: "Text gradient", slug: "/components/text-gradient" },
		],
	},
	{
		/**
		 * Does it exist to be pressed?
		 *
		 * Last, not first. "Is it a button" is the question everyone reaches for first and it is
		 * the wrong one — checkbox, switch, and half the Pickers are all pressed, and a first-rung
		 * Actions group would collect most of the catalog. Placed last, after every rung that
		 * describes what a thing IS has had its turn, it collects only the button family.
		 */
		title: "Actions",
		slug: "actions",
		test: "It exists to be pressed.",
		items: [
			{ title: "Button", slug: "/components/button" },
			{ title: "Button group", slug: "/components/button-group" },
			{ title: "Toggle", slug: "/components/toggle" },
			{ title: "Toggle group", slug: "/components/toggle-group" },
			{ title: "Speed dial", slug: "/components/speed-dial" },
			{ title: "Copy button", slug: "/components/copy-button" },
		],
	},
] as const;

/** A group's title. The key an icon, or anything else per-group, is looked up by. */
export type CategoryTitle = (typeof CATEGORIES)[number]["title"];

/** A group's own slug, as it appears in {@link groupPath}. */
export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

/**
 * The catalog index — every group and everything in it.
 *
 * It exists because the breadcrumb promises it. `Components / Patterns / Page headers` reads as a
 * hierarchy, and until now the first two steps went nowhere: they were headings rendered as plain
 * text, which is honest about the sidebar (a group there reveals its children and is not a place)
 * but leaves a trail whose only live step is the one you are already on.
 */
export const CATALOG_PATH = "/components" as const;

/**
 * Where a group's own page lives.
 *
 * THREE SEGMENTS, and the third one is the point. `/components/patterns` would read better and is
 * not available: `CONVENTIONS.md` §9 states `ui/<slug>` ↔ `/components/<slug>` as an invariant
 * with named exceptions, and twelve more exceptions would hollow it out. Worse, it would be a
 * collision waiting to happen — nothing stops a future component being called `layout` or
 * `navigation`, and the day one is, a group page would silently shadow it. A component slug is
 * always one segment, so a group page that takes three can never be mistaken for one.
 */
export function groupPath<S extends CategorySlug>(slug: S): `/components/group/${S}` {
	return `/components/group/${slug}`;
}

/**
 * Every path the application renders a page for.
 *
 * Derived, never declared: {@link CATEGORIES} is the only place a route is written down, so a
 * page cannot exist in the sidebar and not in the router, or the reverse.
 */
export type RoutePath =
	| typeof CATALOG_PATH
	| `/components/group/${CategorySlug}`
	| (typeof DESTINATIONS)[number]["slug"]
	| (typeof CATEGORIES)[number]["items"][number]["slug"];

/**
 * The same set as a value, for {@link normaliseHash}'s membership test.
 *
 * `App.svelte` types its page map as `Record<RoutePath, …>`, so adding an entry to
 * {@link CATEGORIES} without adding its dynamic import there is a compile error — and removing
 * one without removing the import is too. The twelve group routes are covered by the same rule,
 * which is why they are derived here rather than listed.
 */
export const ROUTES: readonly RoutePath[] = [
	CATALOG_PATH,
	...DESTINATIONS.map((destination) => destination.slug),
	...CATEGORIES.map((category) => groupPath(category.slug)),
	...CATEGORIES.flatMap((category) => category.items.map((item) => item.slug)),
];

/** The group a group page is for, or `undefined` if this path is not one. */
export function categoryByPath(path: string): (typeof CATEGORIES)[number] | undefined {
	return CATEGORIES.find((category) => groupPath(category.slug) === path);
}

/**
 * Retired routes, and where they went.
 *
 * Checked BEFORE the {@link HOME} fallback, so an old bookmark lands on the page that absorbed
 * its content instead of on the front door. A permanent fixture regardless of how many pages are
 * ever merged: without it an unknown fragment silently renders whatever `HOME` happens to be,
 * which is worse than a 404 because it looks like a working page.
 *
 * `label` was retired into `field` because, once the seven demos it duplicated from the Input
 * page were de-duplicated, what remained was three sections about how a label attaches to a
 * control — which is what the Field page documents. `range-calendar` was retired into `calendar`
 * because the range PATTERNS already lived there; its own page said so. Both
 * `src/lib/components/ui/` folders are untouched, and both are still rendered — the route went,
 * not the component.
 */
const ALIASES: Readonly<Record<string, RoutePath>> = {
	"/components/label": "/components/field",
	"/components/range-calendar": "/components/calendar",
};

/**
 * Where an empty, unknown or malformed fragment lands — and so where the application opens.
 *
 * THE SETTINGS PAGE IS THE FRONT DOOR. This was `/components/accordion` for as long as the
 * sidebar was one alphabetical list, on the reasoning that "the first of them is the honest
 * front door". That reasoning was only ever load-bearing while "first" meant something, and
 * grouping the catalog ended that: the first entry of the first group became `File upload`, a
 * front door nobody chose, so HOME moved to Themes — the page that explains what the repository
 * is for. The Settings page supersedes that in turn: it sits first in the sidebar, above
 * Themes, and gathers every look-and-feel control in one place, so it is the page a visitor
 * arrives on.
 */
export const HOME: RoutePath = "/components/settings";

/**
 * Normalise a raw `location.hash` to a known route.
 *
 * Handles the three shapes the browser produces: `''` (no fragment), `'#'` and
 * `'#/components/badge'`. Retired paths resolve through {@link ALIASES}; anything else resolves
 * to {@link HOME} rather than throwing.
 */
export function normaliseHash(hash: string): RoutePath {
	const path = hash.replace(/^#/, "");
	if ((ROUTES as readonly string[]).includes(path)) return path as RoutePath;
	return ALIASES[path] ?? HOME;
}

/**
 * Which group a route belongs to, for the breadcrumb.
 *
 * A reverse lookup rather than a `category` prop threaded through 104 pages: the trail then
 * cannot desync from the sidebar, because both read the same declaration. Returns `undefined`
 * for the hoisted {@link DESTINATIONS}, which have no group by design — the breadcrumb renders
 * a two-step trail for those.
 */
export function categoryOf(path: RoutePath): CategoryTitle | undefined {
	for (const category of CATEGORIES) {
		if (category.items.some((item) => item.slug === path)) return category.title;
	}
	return undefined;
}

/**
 * One home per route, checked while developing.
 *
 * The ladder's whole promise is that a component is filed in exactly one place. Nothing in the
 * type system enforces it — a slug pasted into two groups type-checks fine and produces two
 * sidebar entries pointing at one page — so it is asserted here instead. Dev-only: it is a
 * guard against an editing mistake, not a runtime condition, and `import.meta.env.DEV` lets the
 * whole block drop out of the production bundle.
 */
if (import.meta.env.DEV) {
	const seen = new Set<string>();
	for (const path of ROUTES) {
		if (seen.has(path)) {
			throw new Error(
				`route.svelte.ts: ${path} is filed in more than one group. A component has one home.`,
			);
		}
		seen.add(path);
	}
}

/**
 * A runes-based reader over the current route.
 *
 * `current` is `$state`, so every component that reads it re-renders on navigation without
 * any subscription bookkeeping. The `hashchange` listener is registered once, at module
 * scope rather than in an `$effect`, because the route outlives any single component — it
 * must keep tracking even while no component happens to be reading it.
 */
class RouteState {
	/** The active path, always one of {@link ROUTES}. */
	current: RoutePath = $state(
		// Guard for any non-browser evaluation (prerendering, tests, SSR added later),
		// mirroring `getStoredSidebarState`.
		typeof window === "undefined" ? HOME : normaliseHash(window.location.hash),
	);

	constructor() {
		if (typeof window === "undefined") return;

		this.#canonicalise();

		window.addEventListener("hashchange", () => {
			this.current = normaliseHash(window.location.hash);
			this.#canonicalise();
		});
	}

	/**
	 * Rewrite the address bar when the fragment resolved to something else.
	 *
	 * An alias or an unknown path renders the right page either way — but leaves the reader
	 * looking at `#/components/range-calendar` above a heading that says Calendar, and copying
	 * a URL that only works because the alias table still exists. Replacing it makes the
	 * fragment agree with the page.
	 *
	 * `history.replaceState` rather than assigning `location.hash`: it does not fire a second
	 * `hashchange`, and it does not add a history entry, so the reader's Back button still goes
	 * back to where they came from rather than to the stale fragment.
	 */
	#canonicalise() {
		const canonical = `#${this.current}`;
		if (window.location.hash === canonical) return;
		history.replaceState(history.state, "", canonical);
	}
}

/**
 * The shared route instance.
 *
 * One per application: the browser has a single address bar, so a second instance would be
 * a second answer to a question that has one.
 */
export const route = new RouteState();
