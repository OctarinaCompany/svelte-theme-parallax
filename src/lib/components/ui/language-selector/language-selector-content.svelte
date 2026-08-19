<script lang="ts" module>
	import type { ComponentProps, Snippet } from "svelte";

	import * as Dialog from "$lib/components/ui/dialog/index.js";

	import type { Locale } from "./language-selector.svelte.js";

	/** How many tiles a row holds from `sm` up. Below it the grid is always one column. */
	export const LANGUAGE_SELECTOR_COLUMNS = [1, 2, 3] as const;
	export type LanguageSelectorColumns = (typeof LANGUAGE_SELECTOR_COLUMNS)[number];

	/**
	 * Extended from `Dialog.Content`'s own props — see the note on the Trigger's type for why the
	 * DOM attribute types cannot stand in here.
	 *
	 * `children` is omitted rather than forwarded: the panel's contents are the catalog, and this
	 * component renders them. Use `option` to change a row.
	 */
	export type LanguageSelectorContentProps = Omit<
		ComponentProps<typeof Dialog.Content>,
		"children"
	> & {
		/**
		 * The dialog's heading.
		 * @default "Select language"
		 */
		title?: string;
		/**
		 * The line under it. Pass an empty string to drop it — the title is what accessibility
		 * requires, the description is editorial.
		 * @default "Choose your preferred language."
		 */
		description?: string;
		/**
		 * Tiles per row from `sm` up.
		 * @default 2
		 */
		columns?: LanguageSelectorColumns;
		/** Replaces the default tile, for a row of your own. Rendered once per locale. */
		option?: Snippet<[{ locale: Locale }]>;
	};
</script>

<script lang="ts">
	import * as Listbox from "$lib/components/ui/listbox/index.js";
	import { cn } from "$lib/utils.js";

	import LanguageSelectorOption from "./language-selector-option.svelte";
	import { getLanguageSelectorContext } from "./language-selector.svelte.js";

	/**
	 * The dialog: a heading, and the catalog as a grid of tiles.
	 *
	 * THE GRID IS A `Listbox`, not eight buttons — which is what upstream renders, and what this
	 * kit already has a better answer for. `CONVENTIONS.md` §2 allows a component to import another
	 * for real composition, and this is one: the whole of "choose exactly one from a list" is
	 * already implemented next door with `role="listbox"`, `aria-selected`, ONE tab stop for the
	 * group, arrow keys that walk the rendered grid on both axes (`orientation="mixed"`), typeahead,
	 * and selection on Enter or Space rather than on focus. Eight tabbable buttons would have been
	 * eight tab stops that announce nothing about being a set, in a dialog whose reader may not be
	 * able to read the labels.
	 *
	 * Selection on ACTIVATION rather than on focus is what makes closing on select safe: arrows move
	 * the highlight and nothing is applied, so a keyboard reader can walk the whole list before
	 * committing. A radio group, where focus normally selects, would have applied — and dismissed —
	 * on the first arrow press.
	 */
	let {
		ref = $bindable(null),
		title = "Select language",
		description = "Choose your preferred language.",
		columns = 2,
		class: className,
		option,
		...restProps
	}: LanguageSelectorContentProps = $props();

	const root = getLanguageSelectorContext("<LanguageSelector.Content>");

	const titleId = $props.id();

	/**
	 * Both ladders are written out as whole class names, and neither may be interpolated.
	 *
	 * Tailwind v4 finds classes by scanning source text, so `sm:grid-cols-{n}` produces a class no
	 * stylesheet contains. The panel widens with the grid for the same reason a two-column dialog is
	 * wider than a one-column one: the tile has a floor — two names and a check — below which the
	 * native name starts truncating.
	 */
	const gridClass = $derived(
		{ 1: "grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 md:grid-cols-3" }[columns],
	);
	const widthClass = $derived({ 1: "sm:max-w-sm", 2: "sm:max-w-lg", 3: "sm:max-w-2xl" }[columns]);
</script>

<Dialog.Content bind:ref class={cn(widthClass, className)} {...restProps}>
	<Dialog.Header>
		<Dialog.Title id={titleId}>{title}</Dialog.Title>
		{#if description}
			<Dialog.Description>{description}</Dialog.Description>
		{/if}
	</Dialog.Header>

	<!--
		THE BINDING'S SETTER IS INERT, on purpose. Every pick is applied by the tile's own `onSelect`
		(see `language-selector-option.svelte`), so this getter is the only thing the listbox needs:
		it renders the selection from the caller's state and never writes back. That also disarms
		single-select's toggle, which would otherwise clear the value when the current language is
		picked again.

		`max-h` and the scroll are not for the eight locales that ship: a real catalog can run to
		thirty, and a dialog is centred, so an over-tall panel grows past BOTH edges of the viewport
		with no way to reach either end. `p-1` gives the tiles' focus rings room inside the scroll
		box — a ring is drawn outside the border box and would otherwise be clipped on the first and
		last rows — and the matching negative margin keeps the panel's own gutter where it was.
	-->
	<Listbox.Root
		bind:value={() => root.value, () => {}}
		orientation="mixed"
		aria-labelledby={titleId}
		class={cn("-m-1 grid max-h-[60vh] gap-2 overflow-y-auto p-1", gridClass)}
	>
		{#each root.locales as locale (locale.code)}
			{#if option}
				{@render option({ locale })}
			{:else}
				<LanguageSelectorOption {locale} />
			{/if}
		{/each}
	</Listbox.Root>
</Dialog.Content>
