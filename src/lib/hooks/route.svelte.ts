/**
 * The current route, derived from `location.pathname` — and the catalog it is derived FROM.
 *
 * WHY PATH ROUTING — a route is an address. `#/components/badge` was one for as long as the
 * gallery had nothing else to say about a page, and it stopped being enough the day a reader
 * wanted to link to one SECTION of one: the fragment was already spent on the route, so the
 * document had none left for an anchor. `/components/badge#sizes` gives each half the part of
 * the URL it was designed for, and hands the in-page jump back to the browser.
 *
 * WHAT IT COSTS, written down once so nobody rediscovers it. The host must answer an unknown
 * path with `index.html`: `vite dev` and `vite preview` do it out of the box, and GitHub Pages
 * does it through `404.html`. `tools/site/prerender.mjs` writes that file AND a genuine one per
 * route, so a deep link answers 200 rather than falling back at all. The second cost is the base: the site is served from
 * `/svelte-theme-parallax/` on Pages and from `/` locally, so no link may be written by hand —
 * every one goes through {@link href}, which is the only place a base and a route ever meet.
 *
 * WHY NOT A ROUTER LIBRARY — the whole contract is "read a string, react to a browser
 * event". `svelte-spa-router` and friends add route params, guards, nested layouts and a
 * dependency; this app has one flat list of static routes.
 *
 * WHY THE CATALOG LIVES HERE — it used to live in three places. `ROUTES` was the type-level
 * source of truth, `App.svelte`'s page map was checked against it, and `dashboard.ts` held a
 * third hand-maintained copy whose `url` was typed `string`. Renaming a slug and forgetting the
 * sidebar left `npm run check` clean and the link dead: it fell through {@link normalisePath}
 * to {@link HOME} and silently rendered another page. Not a 404 — a wrong page that looks
 * right. {@link CATEGORIES} is now the single declaration; the routes, the route type and the
 * sidebar are all derived from it, so the three can no longer disagree.
 */

import { documentScrollerOf } from "$lib/shared/scroll-parent.js";

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
	// Quickstart leads, because it is the only page whose content is a PREREQUISITE for the rest:
	// every other page documents something a visitor can already see, this one is what makes an
	// assistant able to build with it.
	{ title: "Quickstart", slug: "/components/quickstart" },
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
		 * Of the routes that reach the ladder. `quickstart`, `settings`, `themes` and `sizing`
		 * also have no folders and are hoisted into {@link DESTINATIONS} above, by name.
		 */
		title: "Patterns",
		slug: "patterns",
		test: "Ships no component of its own — a page assembled from the others.",
		items: [
			{ title: "Chat surface", slug: "/components/chat-surface" },
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
		 * Does it render one side of a dialogue with a model — a turn, a reasoning trace, a tool
		 * call, an approval — or collect the next one?
		 *
		 * A DOMAIN RUNG, like `Dates and time` above it, and placed this high for the same reason
		 * that one is: read against the rungs below, the family scatters. `prompt-input` and
		 * `question` are form controls by every other test, `model-selector` is a picker,
		 * `suggestion` exists to be pressed, `confirmation` reports state, `context-usage` is a
		 * measured value, and `conversation`, `message`, `reasoning`, `tool`, `task` and
		 * `chain-of-thought` arrange content. Six homes for twelve components that are only ever
		 * used together is the situation a rung exists to prevent, so the rung sits above every
		 * group that would otherwise claim one of them.
		 *
		 * The test is the DIALOGUE, not the vocabulary. The generic pieces a chat surface composes —
		 * `code-block`, `collapsible`, `scroll-area`, `textarea` — keep their homes: a code block
		 * is a code block whether or not a model wrote it. Ordered as the family is read: the
		 * transcript and its turn, then what a turn can contain, then what a turn can ask for.
		 */
		title: "AI chat",
		slug: "ai-chat",
		test: "It renders one side of a dialogue with a model — a turn, a reasoning trace, a tool call, an approval — or collects the next one.",
		items: [
			{ title: "Conversation", slug: "/components/conversation" },
			{ title: "Message", slug: "/components/message" },
			{ title: "Prompt input", slug: "/components/prompt-input" },
			{ title: "Suggestion", slug: "/components/suggestion" },
			{ title: "Reasoning", slug: "/components/reasoning" },
			{ title: "Tool", slug: "/components/tool" },
			{ title: "Chain of thought", slug: "/components/chain-of-thought" },
			{ title: "Task", slug: "/components/task" },
			{ title: "Confirmation", slug: "/components/confirmation" },
			{ title: "Question", slug: "/components/question" },
			{ title: "Context usage", slug: "/components/context-usage" },
			{ title: "Model selector", slug: "/components/model-selector" },
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
			{ title: "Code highlighter", slug: "/components/code-highlighter" },
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
 * with named exceptions, and thirteen more exceptions would hollow it out. Worse, it would be a
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
 * The same set as a value, for {@link normalisePath}'s membership test.
 *
 * `App.svelte` types its page map as `Record<RoutePath, …>`, so adding an entry to
 * {@link CATEGORIES} without adding its dynamic import there is a compile error — and removing
 * one without removing the import is too. The thirteen group routes are covered by the same rule,
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
 * ever merged: without it an unknown path silently renders whatever `HOME` happens to be,
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
 * Where an empty, unknown or malformed path lands — and so where the application opens.
 *
 * THE SETTINGS PAGE IS THE FRONT DOOR. This was `/components/accordion` for as long as the
 * sidebar was one alphabetical list, on the reasoning that "the first of them is the honest
 * front door". That reasoning was only ever load-bearing while "first" meant something, and
 * grouping the catalog ended that: the first entry of the first group became `File upload`, a
 * front door nobody chose, so HOME moved to Themes — the page that explains what the repository
 * is for. The Settings page supersedes that in turn: it gathers every look-and-feel control in
 * one place, so a visitor arrives already holding the knobs the whole gallery is about.
 *
 * IT IS NO LONGER THE FIRST SIDEBAR ENTRY, and that is deliberate rather than an oversight.
 * Quickstart took that slot because it is a prerequisite, not a destination: it is read once,
 * acted on, and never returned to, which is the opposite of what a front door should be. Being
 * first in the sidebar and being HOME stopped meaning the same thing here.
 */
export const HOME: RoutePath = "/components/settings";

/**
 * Where this application is served from, without its trailing slash.
 *
 * `''` in development and at a domain root, `'/svelte-theme-parallax'` on the GitHub Pages
 * project site. Vite substitutes `import.meta.env.BASE_URL` at build time and only when it is
 * spelled exactly like that, so nothing may destructure or alias it.
 *
 * Every ROUTE is based here and nowhere else. Two pages read `BASE_URL` directly —
 * `MediaPlayerPage` and `CropperPage`, for the sample media they load out of `public/` — because
 * a file in `public/` is not a route and has no business travelling through a route helper.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/**
 * A route as an `href` — the ONE place a base and a route are concatenated.
 *
 * Every in-app link goes through it, because the `href` attribute is not a hint to a click
 * handler: it is what the status bar shows on hover, what middle-click, `Open in new tab` and
 * `Copy link address` use, and what a crawler follows. A link that only works once JavaScript
 * has intercepted it is not a link, and the whole point of leaving the fragment was to have
 * real ones.
 *
 * The return type keeps the route visible to the type checker after the base is applied, which
 * is what lets `dashboard.ts` keep typing its nav urls against {@link RoutePath}.
 */
export function href<P extends RoutePath>(path: P): `${string}${P}` {
	return `${BASE}${path}`;
}

/**
 * Strip {@link BASE} off a pathname, or `undefined` when the path lies outside this application.
 *
 * The `undefined` is load-bearing for the click interceptor: `/svelte-theme-parallax/r/parallax-shell.json`
 * is a real file on the same origin, and a router that swallowed it would break the registry the
 * gallery documents.
 */
function stripBase(pathname: string): string | undefined {
	if (!BASE) return pathname;
	if (pathname === BASE) return "/";
	if (pathname.startsWith(`${BASE}/`)) return pathname.slice(BASE.length);
	return undefined;
}

/**
 * The route a base-less path names, or `undefined` if it names none.
 *
 * Separate from {@link normalisePath} because the callers want opposite things from a miss:
 * navigation falls back to {@link HOME}, while the click interceptor lets the request through to
 * the network rather than inventing a destination for it.
 *
 * One trailing slash is tolerated here rather than in {@link matchRoute}, because the legacy
 * fragment shim calls straight into this one: a fragment route carries no base to strip.
 */
function resolveRoute(path: string): RoutePath | undefined {
	const trimmed = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
	/*
	 * THE SITE ROOT IS AN ADDRESS THIS DEPLOYMENT PUBLISHES, so it resolves rather than
	 * reporting not-found. `/` is what `package.json`'s `homepage` names, what the repository's
	 * About box links to, and what every share of the project points at — it is the one path
	 * guaranteed to be someone's first impression.
	 *
	 * It is not in `ROUTES` and must not be: `ROUTES` is derived from the catalog, and a root
	 * entry there would need a page, a title and a place in the ladder. Nor is it an entry in
	 * `ALIASES`, which is reserved for RETIRED routes — the root was never a route that moved.
	 * It is the front door, and {@link HOME} is what stands behind it.
	 *
	 * This line is why the not-found state cannot be seeded from `matchRoute` alone: without it
	 * the root matched nothing, and the landing page of the whole gallery rendered "this page
	 * does not exist" while still answering HTTP 200 — a failure no status-code check can see.
	 */
	if (trimmed === "/") return HOME;
	if ((ROUTES as readonly string[]).includes(trimmed)) return trimmed as RoutePath;
	return ALIASES[trimmed];
}

/**
 * The route a full pathname names, or `undefined` for a path this application does not own.
 *
 * Strips the base, then hands what is left to {@link resolveRoute}.
 *
 * BOTH CALLERS GO THROUGH HERE, and that is the point. When the click interceptor and the
 * address-bar reader disagreed about a shape, `/components/button/` was the result: the reader
 * accepted it and the interceptor did not, so a link written with a trailing slash left the
 * application, hit the network and came back through the 404 fallback — a full reload where
 * every other link is instant.
 */
function matchRoute(pathname: string): RoutePath | undefined {
	const stripped = stripBase(pathname);
	return stripped === undefined ? undefined : resolveRoute(stripped);
}

/**
 * Normalise a raw `location.pathname` to a known route.
 *
 * Anything this application does not own — an unknown path, a retired one with no alias, a path
 * outside the base — resolves to {@link HOME} rather than throwing. Callers that need to tell an
 * unknown path APART from the front door read {@link RouteState.notFound} instead; this is the
 * comparison helper, and a predicate that answered `undefined` would push that branch into every
 * one of its call sites.
 */
export function normalisePath(pathname: string): RoutePath {
	return matchRoute(pathname) ?? HOME;
}

/**
 * The document title for a route, as the browser tab and a bookmark will read it.
 *
 * The catalog already holds every label — the sidebar, the command palette and the breadcrumb all
 * render it — so nothing new is declared here and nothing can drift. A group page is named by its
 * group, and the index by what it indexes.
 */
export function routeTitle(path: RoutePath): string {
	if (path === CATALOG_PATH) return "Components";
	const group = categoryByPath(path);
	if (group) return group.title;
	const destination = DESTINATIONS.find((entry) => entry.slug === path);
	if (destination) return destination.title;
	for (const category of CATEGORIES) {
		const item = category.items.find((entry) => entry.slug === path);
		if (item) return item.title;
	}
	return "Components";
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

	/*
	 * THE FRONT DOOR HAS TO RESOLVE. `/` is not in `ROUTES` and never will be, so nothing above
	 * checks it — and the one time it stopped resolving, the whole gallery's landing page
	 * rendered "this page does not exist" while still answering HTTP 200, which is invisible to
	 * every status-code check the project runs. This is the cheapest thing that would have
	 * caught it: the root is the address the About box, `package.json`'s `homepage` and every
	 * share of the project point at.
	 */
	if (resolveRoute("/") === undefined) {
		throw new Error(
			"route.svelte.ts: the site root resolves to nothing, so the landing page would render the not-found state. See the `/` case in resolveRoute.",
		);
	}

	/*
	 * A RELATIVE base is the one configuration that breaks this router silently. `base: './'`
	 * makes `href()` produce `./components/badge`, which resolves against the current directory
	 * — right on the front page and wrong on every page below it. It was the correct setting
	 * while the fragment was the route (the document path never changed), and `vite.config.ts`
	 * says so where it now sets an absolute one.
	 */
	if (BASE && !BASE.startsWith("/")) {
		throw new Error(
			`route.svelte.ts: BASE_URL must be absolute for a path router; got ${import.meta.env.BASE_URL}.`,
		);
	}
}

/**
 * The box this router scrolls and remembers: the shell's canvas, or the document when there is
 * no shell.
 *
 * THE SHELL IS THE VIEWPORT AND THE CANVAS SCROLLS. `src/app.css` pins `Sidebar.Provider`'s
 * wrapper to `100dvh` and clips it, and makes `Sidebar.Inset` — the `<main>` — the one scroll
 * container, so inside the shell the document never moves (iOS Safari collapses its toolbars
 * when the DOCUMENT scrolls, a gesture a dashboard has no use for; the stylesheet carries the
 * reasoning). Every `window.scrollY` this file read and every `window.scrollTo` it issued
 * became a no-op the day that landed: the number stays at 0 and the call moves nothing, with
 * no error anywhere.
 *
 * LOOKED UP BY ID, NOT IMPORTED. The dependency runs one way and cannot be turned round:
 * `AppShell.svelte` ships in the `parallax-shell` registry item, and `src/lib/shared/nav.ts`
 * states that a published component never imports a router — this one is private to the
 * gallery. What the shell DOES publish, to every consumer alike, is the landmark: its own
 * comment names `#main-content` as the page's one landmark id, the one the skip link targets,
 * which nothing else in a document may claim. That makes the id a contract this module can
 * rely on exactly as the skip link does, and the one thing a `.ts` module evaluated before any
 * component exists could rely on at all. Nor is `scrollParentOf` from
 * `src/lib/shared/scroll-parent.ts` the answer: it walks up from an element, and the router,
 * which stands outside every page, has none in hand.
 *
 * NEVER CACHED. The shell mounts after this module runs, and nothing stops a page swap from
 * replacing the element; a lookup per call is one `getElementById` and is never stale.
 *
 * THE FALLBACK is the document's scrolling element, for the arrangements without a shell — a
 * test, prerendering, a consumer who unlocks the document — spelled by `documentScrollerOf`
 * from `src/lib/shared/scroll-parent.ts`, the same answer `scrollParentOf` gives when nothing
 * else scrolls, for the same reason: `scrollTop` and `scrollTo` read and write the same way on
 * either answer, so the two callers below never learn which one they got.
 */
export function scrollCanvas(): HTMLElement {
	return document.getElementById("main-content") ?? documentScrollerOf(document);
}

/**
 * What this router keeps in a history entry: where the reader stood on that page.
 *
 * The number is the canvas's `scrollTop` (see {@link scrollCanvas}). The field keeps the name it
 * had while the document scrolled because it is a PERSISTED shape: entries already stamped in a
 * reader's open tabs outlive a deploy, and renaming it would send every one of them back to the
 * top of its page for the sake of a word.
 */
type RouteHistoryState = { scrollY?: number };

/**
 * A runes-based reader over the current route.
 *
 * `current` is `$state`, so every component that reads it re-renders on navigation without
 * any subscription bookkeeping. The listeners are registered once, in a constructor that runs
 * at module scope rather than in an `$effect`, because the route outlives any single component
 * — it must keep tracking even while no component happens to be reading it.
 */
class RouteState {
	/**
	 * Whether the address names nothing this application owns.
	 *
	 * THE FILE'S OWN HEADER CALLS THIS OUT: an unknown path that silently renders whatever `HOME`
	 * happens to be is "worse than a 404 because it looks like a working page". `ALIASES` answers
	 * that for a RETIRED route; this answers it for a path that never existed. `current` still
	 * resolves to `HOME` so every reader of it keeps working, and the shell renders a not-found
	 * message instead of the front door — with the address the reader typed left alone, because
	 * rewriting it would take away the one piece of evidence they have.
	 */
	notFound: boolean = $state(
		typeof window === "undefined" ? false : matchRoute(window.location.pathname) === undefined,
	);

	/** The active path, always one of {@link ROUTES}. */
	current: RoutePath = $state(
		// Guard for any non-browser evaluation (prerendering, tests, SSR added later),
		// mirroring `getStoredSidebarState`.
		typeof window === "undefined" ? HOME : normalisePath(window.location.pathname),
	);

	/**
	 * Where the page about to mount should be scrolled to, or `null` for "do not touch it".
	 *
	 * NOT `$state`: it is a message with exactly one reader — `App.svelte`, once the page's
	 * chunk has resolved — and {@link takePendingScroll} clears it as it hands it over, so a
	 * second read can never re-apply a scroll the reader has since moved away from.
	 *
	 * `null` rather than `0` is the whole design. A URL that carries a fragment belongs to the
	 * page, which scrolls to its own heading; a router that also scrolled to the top would race
	 * it, and which one won would depend on effect ordering. So the router declines the job
	 * whenever a fragment is present, and there is nothing to arbitrate.
	 */
	#pendingScroll: number | null = null;

	/**
	 * The pathname the last navigation left behind.
	 *
	 * `popstate` fires for a fragment traversal as well as a page one, and the two want opposite
	 * treatment: moving between `#sizes` and `#icon` on one page is the page's business, while
	 * moving between two pages is the router's. The event itself does not say which happened,
	 * so this remembers.
	 */
	#lastPathname = typeof window === "undefined" ? "" : window.location.pathname;

	constructor() {
		if (typeof window === "undefined") return;

		/*
		 * The browser's own restoration is switched off, and would be worse than useless if it
		 * were not. It only ever addresses the document, which inside the shell no longer
		 * scrolls — the canvas does, see `scrollCanvas` — so here it has nothing to restore; and
		 * wherever the document DOES scroll it runs the instant the history entry is activated,
		 * which on this application is while the page is still a `Skeleton` a few hundred pixels
		 * tall: the restore clamps to that, and the reader lands somewhere arbitrary once the
		 * real page mounts. `manual` says once, for both arrangements, that this router owns the
		 * job — and hands it to `App.svelte`, which does it on the canvas after the chunk resolves.
		 */
		history.scrollRestoration = "manual";
		this.#canonicalise();
		this.#retitle();
		/*
		 * Re-seed AFTER canonicalising. The field initialiser above runs before this constructor
		 * body, so on an alias or a trailing-slash arrival it captured the address as the reader
		 * typed it while `#canonicalise` has since rewritten the real one — and the first
		 * `popstate` would then compare against a string the address bar no longer holds and
		 * misjudge whether the reader stayed on the page.
		 */
		this.#lastPathname = window.location.pathname;

		/*
		 * Chrome dispatches `popstate` for a same-document fragment navigation too, so this runs
		 * on every section-anchor click as well as on Back and Forward. That is why the first
		 * thing it does is work out which of the two it was.
		 */
		window.addEventListener("popstate", (event) => {
			const samePage = window.location.pathname === this.#lastPathname;
			const stored = (event.state as RouteHistoryState | null)?.scrollY;

			this.#lastPathname = window.location.pathname;
			this.notFound = matchRoute(window.location.pathname) === undefined;
			this.current = normalisePath(window.location.pathname);
			this.#canonicalise();
			this.#retitle();

			if (window.location.hash) {
				// The page scrolls to its own heading; anything here would race it.
				this.#pendingScroll = null;
			} else if (samePage) {
				/*
				 * Back out of a section, onto the same page with no fragment. Nothing else will
				 * move the canvas — the browser's own restoration is off and there is no heading
				 * to scroll to — so without this the address bar loses `#sizes` while the reader
				 * stays parked on Sizes, and the two disagree with no way back but scrolling.
				 *
				 * Applied HERE rather than handed to the shell: the page is already mounted, so
				 * there is nothing to wait for — and `current` is about to be assigned the string
				 * it already holds, which is not a change, so no effect downstream would re-run to
				 * collect it. The position is the one stamped when the anchor was clicked; with
				 * none, the scroll is left alone rather than guessed at.
				 */
				this.#pendingScroll = null;
				if (stored !== undefined) scrollCanvas().scrollTo({ top: stored, behavior: "instant" });
			} else {
				/*
				 * A different page. `0` rather than `null` for an entry nobody stamped: only a
				 * link click stamps one, so Forward into a page you had scrolled and left by Back
				 * opens it at the top. Predictable, and the alternative — leaving the scroll where
				 * the previous page had it — shows one page at another page's offset.
				 */
				this.#pendingScroll = stored ?? 0;
			}
		});

		/*
		 * ONE listener, on `document`, rather than an `onclick` on every anchor.
		 *
		 * The gallery's links are rendered by eight different primitives — a bare `<a>`, `Button
		 * href`, `Badge href`, `Command.LinkItem`, two `Sidebar.MenuButton` child snippets,
		 * `DropdownMenu.Item`, `Breadcrumb.Link`, `NavigationMenu.Link` — and four of those live
		 * in components the registry publishes, which `shared/nav.ts` forbids from knowing a
		 * router at all. Threading a handler through their props would be a prop per primitive;
		 * delegation costs one listener and covers every page written after this one.
		 */
		document.addEventListener("click", (event) => this.#onClick(event));
	}

	/**
	 * Name the document after the page on screen.
	 *
	 * ONE TITLE FOR EVERY ROUTE was the state until the routes became addresses: four tabs open on
	 * four components all read the same words, a bookmark filed the gallery's name rather than the
	 * page's, and history was unusable for going back to something seen ten minutes ago. The label
	 * comes from the catalog, so it cannot disagree with the sidebar, the palette or the trail.
	 *
	 * `tools/site/prerender.mjs` writes the same title into each prerendered document, which is
	 * what a crawler and a link unfurler read; this is what the reader's tab reads once the page
	 * has mounted. The two must agree, and both derive from {@link routeTitle}.
	 */
	#retitle(): void {
		document.title = this.notFound
			? "Page not found · Parallax"
			: `${routeTitle(this.current)} · Parallax`;
	}

	/**
	 * Take the scroll position the page that just mounted should adopt: an offset into the
	 * canvas, which `App.svelte` applies through {@link scrollCanvas}.
	 *
	 * Returns `null` — meaning "leave the scroll alone" — for a fragment landing and for every
	 * read after the first.
	 */
	takePendingScroll(): number | null {
		const target = this.#pendingScroll;
		this.#pendingScroll = null;
		return target;
	}

	/**
	 * Turn a left click on an in-app link into a `pushState`, and leave every other click alone.
	 *
	 * The bail-outs are not defensive noise: each one is a gesture a reader makes on purpose.
	 * A modified click opens a tab or a window, `download` saves a file, a `target` names another
	 * browsing context, and a cross-origin link leaves the site. Swallowing any of them would be
	 * the router deciding it knows better than the person clicking.
	 */
	#onClick(event: MouseEvent): void {
		if (event.defaultPrevented || event.button !== 0) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

		const target = event.target;
		const anchor = target instanceof Element ? target.closest("a[href]") : null;
		if (!(anchor instanceof HTMLAnchorElement)) return;
		if (anchor.hasAttribute("download")) return;
		if (anchor.target && anchor.target !== "_self") return;
		if (anchor.relList.contains("external")) return;

		const url = new URL(anchor.href, window.location.href);
		if (url.origin !== window.location.origin) return;

		/*
		 * A fragment on the page already on screen is the BROWSER's navigation, and it does it
		 * better than this router could: it scrolls whichever ancestor of the target scrolls —
		 * the canvas, inside the shell — honouring that box's `scroll-padding-top`, sets
		 * `:target`, writes one history entry, and turns a repeat click into a replace. This is
		 * the line that makes `#section` links work, and it is also what finally makes the
		 * placeholders the upstream themes write as `href="#!"` stop navigating to the front door —
		 * though not inert: the browser still writes the fragment and spends a history entry on it,
		 * which is why the gallery's own demos point at their page instead.
		 */
		if (url.pathname === window.location.pathname && url.hash) {
			// Stamp first, though: the browser is about to push an entry, and the position the
			// reader is leaving can only be written onto the entry while it is still the current
			// one. Without this, Back out of a section has nowhere to return to.
			this.#rememberScroll();
			return;
		}

		const destination = matchRoute(url.pathname);
		if (!destination) return;

		event.preventDefault();

		/*
		 * A self-link — the demos are full of them, pointing at their own page rather than at
		 * upstream's `href="#"` — should do nothing at all, not push a duplicate entry.
		 *
		 * The `!url.hash` lets a same-route link that CARRIES a fragment through to `#navigate`,
		 * which has no way to honour it: `pushState` fires no event, and assigning `current` the
		 * string it already holds is not a change, so nothing downstream would move the reader.
		 * Nothing can reach that today — a same-page fragment is handed to the browser above, and
		 * only a NON-canonical spelling of this page's own path (a trailing slash, an alias) would
		 * arrive here instead, which `href()` cannot emit. Written down because the day something
		 * does, the symptom is an address bar that moves and a page that does not.
		 */
		if (destination === this.current && !url.hash) return;

		this.#navigate(destination, url);
	}

	/**
	 * Write the current scroll position onto the current history entry.
	 *
	 * Called immediately before anything that pushes a new entry — this router's own
	 * `pushState`, and the browser's when a same-page fragment link is left to it. A history
	 * entry's state can only be written while that entry is the current one, so the position of
	 * the page being left has to be stamped now or never.
	 *
	 * Read off the canvas, never `window.scrollY`: inside the shell the document does not scroll,
	 * and that number would stamp a 0 onto every entry — Back would then always land at the top,
	 * quietly, with nothing to point at.
	 */
	#rememberScroll(): void {
		const state: RouteHistoryState = { ...history.state, scrollY: scrollCanvas().scrollTop };
		history.replaceState(state, "");
	}

	/**
	 * Push one history entry, remembering where the reader was on the page being left.
	 *
	 * No canonicalisation is needed afterwards — {@link matchRoute} has already mapped an alias
	 * to the page that absorbed it, so the pushed address is the canonical one.
	 */
	#navigate(path: RoutePath, url: URL): void {
		this.#rememberScroll();

		history.pushState(null, "", href(path) + url.search + url.hash);
		this.#lastPathname = window.location.pathname;
		// Only a resolved route reaches here — the click interceptor lets an unknown path through
		// to the network rather than pushing it — so arriving by link always clears the flag.
		this.notFound = false;
		this.current = path;
		this.#retitle();
		this.#pendingScroll = url.hash ? null : 0;
	}

	/**
	 * Rewrite the address bar when the path resolved to something else.
	 *
	 * An alias or an unknown path renders the right page either way — but leaves the reader
	 * looking at `/components/range-calendar` above a heading that says Calendar, and copying a
	 * URL that only works because the alias table still exists. Replacing it makes the address
	 * agree with the page.
	 *
	 * The search and the fragment are carried over deliberately: `/components/label#sizes` must
	 * canonicalise to `/components/field#sizes`, not lose the anchor the reader arrived for.
	 *
	 * `history.replaceState` rather than assigning `location.pathname`: it does not reload, it
	 * does not fire a second `popstate`, and it does not add a history entry, so the reader's
	 * Back button still goes back to where they came from rather than to the stale address.
	 */
	#canonicalise() {
		// An address that names nothing is left exactly as the reader typed it: rewriting it to the
		// front door would remove the only evidence of what they actually asked for.
		if (this.notFound) return;
		const canonical = href(this.current);
		if (window.location.pathname === canonical) return;
		history.replaceState(
			history.state,
			"",
			canonical + window.location.search + window.location.hash,
		);
	}
}

/**
 * Rewrite a legacy `#/components/…` address before anything reads the location.
 *
 * Every URL this gallery published before the router moved to paths has the route in the
 * fragment, and those are exactly the links people keep — a bookmark, a message, an issue. The
 * rewrite is one `replaceState`: no reload, no history entry, and the reader lands on the page
 * they asked for at the address it now has.
 *
 * The leading slash is what tells the two shapes apart and always will: a route fragment is
 * `#/components/badge`, a section fragment is `#sizes`, and no section id starts with a slash.
 *
 * It runs at module scope rather than inside {@link RouteState}, because a class field
 * initialiser — `current`, reading `location.pathname` — runs before the constructor body would
 * get the chance.
 */
function migrateLegacyHash(): void {
	if (typeof window === "undefined") return;
	const legacy = window.location.hash;
	if (!legacy.startsWith("#/")) return;
	/*
	 * `resolveRoute`, NOT `normalisePath`. The route inside a fragment was written before the base
	 * existed and carries none, so putting it through the base-stripping path would reject every
	 * one of them on the deployed site — where `stripBase` requires the prefix — and send every
	 * old link ever published to the front door. It is right in development, where the base is
	 * empty, which is exactly how it would have shipped.
	 */
	const path = resolveRoute(legacy.slice(1)) ?? HOME;
	history.replaceState(history.state, "", href(path) + window.location.search);
}

migrateLegacyHash();

/**
 * The shared route instance.
 *
 * One per application: the browser has a single address bar, so a second instance would be
 * a second answer to a question that has one.
 */
export const route = new RouteState();
