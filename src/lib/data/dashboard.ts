/**
 * Sample data driving the dashboard sidebar.
 *
 * The official shadcn-svelte block declares this data inside `app-sidebar.svelte`'s
 * `<script module>` block. It lives in its own module here so that adding a navigation
 * entry, a workspace or a sub-item is a DATA edit — no `.svelte` file is touched.
 * That is the practice this repository exists to demonstrate.
 *
 * Everything below is fictional except the first workspace, which is this project — see the
 * note on `workspaces`.
 */

import AudioWaveformIcon from "@lucide/svelte/icons/audio-waveform";
import BlocksIcon from "@lucide/svelte/icons/blocks";
import BotIcon from "@lucide/svelte/icons/bot";
import CalendarDaysIcon from "@lucide/svelte/icons/calendar-days";
import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
import CommandIcon from "@lucide/svelte/icons/command";
import CompassIcon from "@lucide/svelte/icons/compass";
import GroupIcon from "@lucide/svelte/icons/group";
import LayersIcon from "@lucide/svelte/icons/layers";
import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
import ListChecksIcon from "@lucide/svelte/icons/list-checks";
import MousePointerClickIcon from "@lucide/svelte/icons/mouse-pointer-click";
import PaletteIcon from "@lucide/svelte/icons/palette";
import RocketIcon from "@lucide/svelte/icons/rocket";
import RulerIcon from "@lucide/svelte/icons/ruler";
import SettingsIcon from "@lucide/svelte/icons/settings";
import SlidersHorizontalIcon from "@lucide/svelte/icons/sliders-horizontal";
import TableIcon from "@lucide/svelte/icons/table";
import WrenchIcon from "@lucide/svelte/icons/wrench";
import ZapIcon from "@lucide/svelte/icons/zap";

import {
	CATEGORIES,
	DESTINATIONS,
	href,
	type CategoryTitle,
	type RoutePath,
} from "$lib/hooks/route.svelte.js";
import type { NavIcon, NavItem, User, Workspace } from "$lib/shared/nav.js";

/**
 * A destination the sidebar can point at.
 *
 * NOT `string`. The nav `url` fields were typed `string` for as long as this list was
 * hand-maintained, which meant renaming a slug and forgetting the sidebar left `npm run check`
 * clean and the link dead — it fell through `normalisePath` to `HOME` and rendered another page.
 * Tying the type to `RoutePath` makes that a compile error. Nothing is generated from a
 * `NavUrl` today except through {@link CATEGORIES}, but the entries in {@link dashboardData}
 * that are still written by hand are checked by it.
 *
 * The SHAPES live in `$lib/shared/nav.ts` — the published contract the shell components take
 * their content in — and are generic over the URL precisely so this file can instantiate them
 * at `NavUrl` while a registry consumer gets plain strings. This alias is the demo's half of
 * that bargain, which is why it stays here rather than moving with the types.
 */
/*
 * The leading `${string}` is the site base, which only exists at build time — `''` locally and
 * `/svelte-theme-parallax` on Pages — so it cannot be written into the type. The tail still has
 * to be a literal {@link RoutePath}, which is the half that catches a renamed slug.
 */
export type NavUrl = `${string}${RoutePath}`;

export type DashboardData = {
	user: User;
	workspaces: Workspace[];
	navMain: NavItem<NavUrl>[];
};

/**
 * One icon per group of the ladder.
 *
 * WHY THE ICONS LIVE HERE AND NOT IN `CATEGORIES` — the ladder is routing and taxonomy, and it
 * has no business importing a rendering library. This is the presentation half, and typing it as
 * a `Record<CategoryTitle, …>` is what keeps the two halves in step: rename a group or add a
 * thirteenth and this map fails to compile until it is answered.
 *
 * Chosen to survive the collapsed rail, where they are the ONLY thing left of an entry: legible
 * at 16px, and distinguishable from each other rather than merely apt. That is why `Layout` is
 * the grid and `Patterns` is the blocks — `layout-template` and `layout-grid` are the natural
 * pair and read as the same mark at that size. `Feedback` is the alert circle rather than a bell,
 * which `NavUser` already spends; `Actions` is the pointer rather than a cursor, which reads as
 * text selection.
 */
const CATEGORY_ICONS: Record<CategoryTitle, NavIcon> = {
	Patterns: BlocksIcon,
	"Dates and time": CalendarDaysIcon,
	"AI chat": BotIcon,
	Pickers: ListChecksIcon,
	"Form controls": SlidersHorizontalIcon,
	"Form layout": GroupIcon,
	Layout: LayoutGridIcon,
	Navigation: CompassIcon,
	Overlays: LayersIcon,
	Feedback: CircleAlertIcon,
	"Data display": TableIcon,
	Utilities: WrenchIcon,
	Actions: MousePointerClickIcon,
};

/** The same, for the childless entries that sit above the ladder. */
const DESTINATION_ICONS: Record<(typeof DESTINATIONS)[number]["title"], NavIcon> = {
	Quickstart: RocketIcon,
	Themes: PaletteIcon,
	Settings: SettingsIcon,
	Sizing: RulerIcon,
};

export const dashboardData: DashboardData = {
	user: {
		name: "Ada Lovelace",
		email: "ada@example.com",
	},
	/**
	 * THE FIRST ONE IS THE PROJECT, and the other two are the demo.
	 *
	 * The switcher is the first thing in the sidebar and therefore the first thing a visitor reads.
	 * With three invented companies in it the gallery presented as somebody's Acme dashboard and
	 * never said its own name anywhere a human looks — the word appeared once in the whole shell,
	 * inside a comment. Naming the project here costs nothing the switcher was doing: it still
	 * demonstrates itself, with two entries to switch between.
	 *
	 * `ZapIcon` because the project's own mark is a bolt (`public/favicon.svg`); the mark itself is
	 * a filtered, masked gradient built for 48px and would be mud in a 16px slot.
	 */
	workspaces: [
		{ name: "Parallax", plan: "Theme kit", logo: ZapIcon },
		{ name: "Acme Corp.", plan: "Startup", logo: AudioWaveformIcon },
		{ name: "Evil Corp.", plan: "Free", logo: CommandIcon },
	],
	/**
	 * TWELVE GROUPS AND ONE DESTINATION, GENERATED — NOT WRITTEN.
	 *
	 * This was 104 hand-maintained `{ title, url }` objects in one group called `Components`,
	 * and it was the third of three places the catalog was declared. It is now derived from
	 * `CATEGORIES` in `route.svelte.ts`, which is the only place a route is written down.
	 *
	 * The win is not that the list is shorter. It is that adding a component went from a
	 * four-step edit with one unchecked step to a three-step edit where all three are
	 * compiler-linked: a page under `components/pages/`, a line in `CATEGORIES`, and its dynamic
	 * import in `App.svelte`. Forget the import and `Record<RoutePath, …>` fails the build;
	 * there is no longer a sidebar copy to forget.
	 *
	 * There were four groups once. `Playground` held three example pages, and `Documentation`
	 * and `Settings` held eight entries that all pointed at `#` — furniture from the official
	 * `sidebar-07` block, kept while the sidebar itself was the subject. A sidebar whose entries mostly do nothing teaches a visitor to stop
	 * clicking. Those are gone; every entry below goes somewhere real.
	 */
	navMain: [
		...DESTINATIONS.map((destination) => ({
			title: destination.title,
			url: href(destination.slug),
			icon: DESTINATION_ICONS[destination.title],
		})),
		...CATEGORIES.map((category) => ({
			title: category.title,
			icon: CATEGORY_ICONS[category.title],
			items: category.items.map((item) => ({
				title: item.title,
				url: href(item.slug),
			})),
		})),
	],
};
