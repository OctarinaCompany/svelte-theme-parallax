<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	export type CommandPaletteProps = {
		/** Merged onto the trigger, so the header can position it. */
		class?: HTMLAttributes<HTMLElement>["class"];
	};
</script>

<script lang="ts">
	import SearchIcon from "@lucide/svelte/icons/search";
	import * as Command from "$lib/components/ui/command/index.js";
	import * as Kbd from "$lib/components/ui/kbd/index.js";
	import { cn } from "$lib/utils.js";
	import { CATEGORIES, DESTINATIONS, route } from "$lib/hooks/route.svelte.js";

	/**
	 * Jump to any page in the catalog by typing part of its name.
	 *
	 * WHY THE LIST IS NOT DECLARED HERE. It is `CATEGORIES` from `route.svelte.ts`, the same single
	 * declaration the router and the sidebar read. A palette with its own copy of the catalog is a
	 * copy that goes stale — and the whole point of collapsing the three declaration sites into one
	 * was that a fourth reader should cost a `flatMap`, not another list to maintain.
	 *
	 * The group headings are the ladder's own groups, which is what makes this more than a filter:
	 * typing `cal` shows Calendar under `Dates and time`, so the palette teaches the taxonomy while
	 * it answers the question.
	 *
	 * A `Command.LinkItem` rather than an `Item` with a handler: it renders a real anchor, so
	 * middle-click and "open in new tab" keep working. `NavMain.svelte` makes the same argument for
	 * the sidebar's entries, and a palette that broke it would be the one navigation surface in the
	 * application that did.
	 */
	let { class: className }: CommandPaletteProps = $props();

	let open = $state(false);

	/**
	 * `⌘` on Apple platforms, `Ctrl` everywhere else.
	 *
	 * Read once, and guarded for a non-browser evaluation the way `route.svelte.ts` guards its own.
	 * `navigator.platform` is deprecated but is the only synchronously-readable signal that does not
	 * require `userAgentData`, which Safari does not implement — and the cost of guessing wrong is a
	 * hint that names the wrong modifier, not a broken shortcut: the handler accepts either.
	 */
	const isApple =
		typeof navigator !== "undefined" && /mac|iphone|ipad|ipod/i.test(navigator.platform);

	/**
	 * What a query is matched against: the title, plus the slug's last segment.
	 *
	 * THE SLUG EARNS ITS PLACE, the rest of the path does not. `qr-code` and `input-otp` are exactly
	 * the two names the kebab-case rule cannot round-trip — `QR code` and `Input OTP` — so without
	 * the slug, typing `qr` or `otp` finds nothing. The `/components/` prefix is stripped because
	 * every slug carries it, and a fragment of it therefore matches all 109 entries at once.
	 *
	 * The GROUP NAME is deliberately absent, having been tried and removed. Carrying it made typing
	 * a category list its members, which sounded useful and was not: the matcher scores a
	 * subsequence, not a substring, so `dates` also matched `File upload Patterns` — d from
	 * "uploaD", a-t-e-s from "pATtErnS" — and ranked it above Calendar. A find-the-page box is worth
	 * more precise than clever. The headings still group the unfiltered list, which is where they
	 * were doing real work anyway.
	 */
	function searchValue(title: string, slug: string): string {
		return `${title} ${slug.slice(slug.lastIndexOf("/") + 1)}`;
	}

	/**
	 * Score an entry against the query. Substring, never subsequence.
	 *
	 * WHY THE DEFAULT IS REPLACED. `cmdk`'s scorer matches a subsequence and always returns
	 * something, so `zzzz` resolved to `Resizable` — R-e-si-**z**-able and so on. That is fine for a
	 * command runner, where a loose tail costs nothing and the alternative is an empty palette. It
	 * is wrong for a find-the-page box, where the tail is a list of pages you did not ask for and,
	 * worse, `Command.Empty` never renders: a typo silently offers the wrong destination instead of
	 * saying it found nothing.
	 *
	 * Substring matching covers what people actually type — a prefix of a word: `cal`, `qr`, `otp`,
	 * `json`, `shak`. The cost is that a query no title contains finds nothing, which is the honest
	 * answer rather than a regression: `dates` returning only `Date selector` beats it returning
	 * thirty-three entries with `File upload` on top.
	 *
	 * The three bands rank whole-value prefixes above word prefixes above anything else, so `data`
	 * puts `Data grid` and `Data table` ahead of `Metadata`-ish middles.
	 */
	function score(value: string, search: string): number {
		const haystack = value.toLowerCase();
		const needle = search.trim().toLowerCase();
		if (!needle) return 1;

		if (haystack.startsWith(needle)) return 1;
		if (haystack.split(/[\s-]+/).some((word) => word.startsWith(needle))) return 0.8;
		return haystack.includes(needle) ? 0.5 : 0;
	}

	/** Every destination, flattened once, under the group it belongs to. */
	const groups = $derived([
		{ heading: "Overview", items: DESTINATIONS.map((d) => ({ title: d.title, slug: d.slug })) },
		...CATEGORIES.map((category) => ({
			heading: category.title,
			items: category.items.map((item) => ({ title: item.title, slug: item.slug })),
		})),
	]);

	function onkeydown(event: KeyboardEvent) {
		// Lowercased because Caps Lock reports the key as "K", which would kill the advertised
		// chord for as long as the lock is on. Shift and Alt bail instead: Ctrl+Shift+K and
		// friends are other chords (browser devtools among them), not this one mistyped.
		if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
		if (event.shiftKey || event.altKey) return;

		// The browser's own Ctrl+K focuses the address bar on some builds, so this has to claim it.
		event.preventDefault();
		open = !open;
	}
</script>

<svelte:window {onkeydown} />

<!--
	A button that looks like a field, which is the convention every command palette follows: a real
	`<input>` here would take focus and keystrokes that belong to the dialog's own input, and would
	promise typing that goes nowhere.

	Below `sm` it collapses to the icon alone — the header is 16 units tall and a 224px field would
	push the breadcrumb off a phone.
-->
<button
	type="button"
	onclick={() => (open = true)}
	class={cn(
		"inline-flex h-8 items-center gap-2 rounded-md border border-input bg-muted/40 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden",
		// Width is the only axis that changes: `size-8` at the small end would have to be undone at
		// the wide end, and `sm:size-auto` undoes the height with it — leaving a 24px field that
		// reads as a chip rather than as an input.
		"w-8 justify-center p-0 sm:w-64 sm:justify-start sm:ps-2.5 sm:pe-1.5",
		// 256px is what this field WANTS, not what it takes. The header holds a breadcrumb whose
		// length is the page's, and between roughly 640px and 1200px the three groups together are
		// wider than the bar — so the field has to be the one that gives, or the header pushes the
		// document into a horizontal scroll. `min-w-0` is what lets it: without it a flex item will
		// not shrink below its content.
		"min-w-0 shrink",
		className,
	)}
>
	<SearchIcon class="size-4 shrink-0" />
	<!--
		`whitespace-nowrap`, and `w-64` rather than `w-56`: at the narrower width the label wrapped
		onto a second line and pushed the button past the header's fixed height. The budget is the
		field minus the icon, the gap, the shortcut chip and the padding — about 160px, which this
		label needs all of.
	-->
	<span class="hidden truncate whitespace-nowrap sm:inline">Search components…</span>
	<span class="sr-only sm:hidden">Search components</span>
	<!-- `shrink-0`, so the shortcut chip is never what gets compressed: it is the shortest thing in
	     the field and the only part of it that teaches something. -->
	<Kbd.Group class="ms-auto hidden shrink-0 sm:flex">
		<Kbd.Root>{isApple ? "⌘" : "Ctrl"}</Kbd.Root>
		<Kbd.Root>K</Kbd.Root>
	</Kbd.Group>
</button>

<Command.Dialog
	bind:open
	title="Search components"
	description="Find a component page by name."
	filter={score}
	class="top-1/4"
>
	<Command.Input placeholder="Search components…" />
	<Command.List>
		<Command.Empty>No component matches that.</Command.Empty>
		{#each groups as group (group.heading)}
			<Command.Group heading={group.heading}>
				{#each group.items as item (item.slug)}
					<Command.LinkItem
						href="#{item.slug}"
						value={searchValue(item.title, item.slug)}
						onSelect={() => (open = false)}
					>
						<span>{item.title}</span>
						{#if route.current === item.slug}
							<span class="ms-auto text-xs text-muted-foreground">Current</span>
						{/if}
					</Command.LinkItem>
				{/each}
			</Command.Group>
		{/each}
	</Command.List>
</Command.Dialog>
