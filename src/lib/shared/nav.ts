/**
 * The navigation data contract — the types the shell components take their content in.
 *
 * WHY A MODULE OF TYPES AND NOTHING ELSE. These shapes used to live in
 * `src/lib/data/dashboard.ts`, beside the demo instance that satisfies them. That was the
 * right home while the sidebar was demo-only; it stops working the moment the components are
 * published, because a registry item cannot ship `dashboard.ts` — it holds fictional data and
 * derives its entries from the demo router's catalog — yet every consumer still needs the
 * compile-checked surface: `NavMain` its `NavItem[]`, `NavUser` its `User`,
 * `WorkspaceSwitcher` its `Workspace[]`. The types are the contract, so the contract is a
 * file of its own, and `dashboard.ts` imports it like any other caller.
 *
 * GENERIC OVER THE URL. `NavItem<U extends string = string>` gives a consumer plain strings
 * while the demo instantiates `NavItem<NavUrl>` — its `#${RoutePath}` union — and keeps the
 * property this split must not lose: renaming a route still fails the demo's compile until
 * the sidebar answers. `NavItem<NavUrl>` is assignable to `NavItem<string>`, so the
 * components stay ignorant of the narrowing.
 */

import type { LucideIcon } from "@lucide/svelte";

/**
 * An icon component, rendered directly as `<item.icon />`.
 *
 * The official block types this as `any`, with the comment "this should be `Component`
 * after @lucide/svelte updates types". They have: the package now exports
 * `LucideIcon = Component<LucideProps>`, so no `any` and no eslint suppression is needed.
 * A generic `Component<SVGAttributes<SVGSVGElement>>` does NOT work — `LucideProps` widens
 * `name` to `string | undefined`, which is not assignable from the SVG attribute's
 * `string | null | undefined`.
 */
export type NavIcon = LucideIcon;

/** An organisation identity, shown in the sidebar header. Exactly one is active. */
export type Workspace = {
	/** Display name. Unique within the list — it is the `{#each}` key. */
	name: string;
	/** Sub-label shown beneath the name. */
	plan: string;
	logo: NavIcon;
};

/**
 * The identity shown in the sidebar footer.
 *
 * `avatar` is optional, and the demo leaves it unset. The official block points it at
 * `/avatars/shadcn.jpg`, a file that only exists on the shadcn-svelte docs site — copying
 * it produces a failed image request on every page load. When absent, initials are derived
 * from `name` instead.
 */
export type User = {
	name: string;
	email: string;
	/** Image URL. Absent: `NavUser` renders initials derived from `name`. */
	avatar?: string;
};

/** A child entry, visible only while its parent item is expanded. */
export type NavSubItem<U extends string = string> = {
	/** Label. Unique within its parent — it is the `{#each}` key. */
	title: string;
	url: U;
};

/** A top-level entry of the sidebar's navigation. Has children, or a destination, not both. */
export type NavItem<U extends string = string> = {
	/**
	 * Label. Unique within the group, and also used as the tooltip text when the
	 * sidebar is collapsed to icons — so it must be meaningful on its own.
	 */
	title: string;
	/**
	 * Destination — set only on entries WITHOUT `items`.
	 *
	 * An entry that has children is a category, not a place: clicking it reveals its
	 * children and nothing else. Giving it a URL too would make one click carry two
	 * meanings.
	 */
	url?: U;
	icon?: NavIcon;
	/**
	 * Children. Their presence is what makes this entry a category.
	 *
	 * There is no `defaultOpen` beside them any more. It was a stored answer to "which group
	 * starts expanded", which had exactly one right value while there was one group and no right
	 * value at all with twelve: all open is a 101-item wall, all closed is a wall of nothing.
	 * `NavMain.svelte` derives it from the current route instead — the group holding the page you
	 * are on is the group that should be open.
	 */
	items?: NavSubItem<U>[];
};

/**
 * How active-state reaches the sidebar: a predicate over an item's raw `url`, never a router.
 *
 * The components cannot import a router — the demo's is a hash router private to the gallery,
 * and a consumer's is theirs. So the caller answers "is this url the page on screen?" and the
 * components ask. The demo passes `(url) => normaliseHash(url) === route.current`; a SvelteKit
 * consumer compares against `page.url.pathname`.
 */
export type NavIsActive = (url: string) => boolean;
