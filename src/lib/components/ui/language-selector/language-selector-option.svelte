<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef } from "$lib/utils.js";

	import type { Locale } from "./language-selector.svelte.js";

	export type LanguageSelectorOptionProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** The entry this tile stands for. */
		locale: Locale;
	};
</script>

<script lang="ts">
	import * as Listbox from "$lib/components/ui/listbox/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { cn } from "$lib/utils.js";

	import { getLanguageSelectorContext } from "./language-selector.svelte.js";

	/**
	 * One tile: the native name over the English one, a check mark when it is the current locale,
	 * and a completion bar for the catalogs that report one.
	 *
	 * SELECTION IS DRIVEN FROM `onSelect`, NOT from the listbox's value. `Listbox` is a general
	 * picker and single-select there is a TOGGLE — re-picking the selected option clears the
	 * selection (`listbox.svelte.ts:370-371`), which is right for a filter and wrong for a language:
	 * an interface is always in some language, and "no language" is not a state this can produce.
	 * `onSelect` fires before the value moves and fires on every pick including a repeat, so the
	 * Content's binding can stay inert and this handler can own the whole decision.
	 */
	let {
		ref = $bindable(null),
		locale,
		class: className,
		...restProps
	}: LanguageSelectorOptionProps = $props();

	const root = getLanguageSelectorContext("<LanguageSelector.Option>");
</script>

<Listbox.Item
	bind:ref
	value={locale.code}
	onSelect={(code) => root.select(code)}
	data-slot="language-selector-option"
	class={cn(
		// `p-3` and `items-start`, over the item's own `p-4` centring: upstream's tile is 12px and
		// its check sits against the top of a two-line block rather than floating between the lines.
		"items-start p-3",
		// The chosen tile is outlined in the primary colour and tinted, which is upstream's
		// `border-primary bg-primary/5`. `ring-primary` rather than a border because the item's base
		// draws its edge as a ring — a border here would be a SECOND edge, 1px outside the first.
		"data-selected:bg-primary/5 data-selected:ring-primary",
		className,
	)}
	{...restProps}
>
	<div class="flex min-w-0 flex-col gap-0.5">
		<!--
			`lang` and `dir` on the name itself. This is the one element on the page genuinely written
			in that language: it lets a screen reader pronounce `Français` in French rather than
			spelling it in English, and lets `العربية` read right-to-left inside a left-to-right
			dialog. Neither is inherited from anywhere else, because nothing around it has switched.
		-->
		<span class="truncate text-sm font-medium" lang={locale.code} dir={locale.dir}>
			{locale.nativeName}
		</span>
		<span class="truncate text-xs text-muted-foreground">{locale.englishName}</span>
		{#if locale.completion !== undefined}
			<!--
				`aria-hidden` on the bar and the number said in words beside it. A `role="progressbar"`
				nested in a `role="option"` is announced as its own widget inside a thing that is not a
				container, and what it announces — "82%" — is the number already in the text. The
				`sr-only` word is what turns that number into a fact: 82% of WHAT is not guessable from
				a bar sitting under a language name.
			-->
			<div class="mt-1 flex items-center gap-2">
				<Progress value={locale.completion} class="h-1 min-w-0 flex-1" aria-hidden="true" />
				<span class="text-xs text-muted-foreground tabular-nums" aria-hidden="true">
					{locale.completion}%
				</span>
				<span class="sr-only">{locale.completion}% translated</span>
			</div>
		{/if}
	</div>
	<Listbox.ItemIndicator class="text-primary" />
</Listbox.Item>
