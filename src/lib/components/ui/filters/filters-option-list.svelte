<script lang="ts" module>
	import type { FilterFieldConfig, FilterI18nConfig, FilterOption } from "./types.js";

	export interface FiltersOptionListProps<T = unknown> {
		/** The field being edited. Read for `searchable`, `class` and `renderOptionList`. */
		field: FilterFieldConfig<T>;
		/** Every row, in render order: the first {@link selectedCount} of them are the selected ones. */
		options: FilterOption<T>[];
		/** How many leading entries of {@link options} are selected. `-1` renders one flat run. */
		selectedCount?: number;
		/** The current selection, for the checkbox state. */
		values: T[];
		/** Whether a toggle adds to the selection or replaces it. */
		multiple: boolean;
		/** Whether the field loads its options — decides which empty state is shown. */
		isAsync: boolean;
		loading: boolean;
		error: boolean;
		i18n: FilterI18nConfig;
		/** The search box contents. Owned by the caller, which also filters {@link options} by it. */
		search: string;
		/** Called with the new search box contents, only when the user actually edited them. */
		onSearchChange?: (value: string) => void;
		/** Start on the first row rather than on nothing. */
		autoHighlightFirst?: boolean;
		/** Called with the row the user picked, by click or by Enter. */
		onToggle: (option: FilterOption<T>) => void;
		/** ArrowLeft. Closes a popover; steps back out of a submenu. */
		onBack?: () => void;
	}
</script>

<script lang="ts" generics="T">
	import CheckIcon from "@lucide/svelte/icons/check";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { Separator } from "$lib/components/ui/dropdown-menu/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { cn } from "$lib/utils.js";
	import { isSameValue } from "./filters-utils.js";

	/**
	 * The option list a field's values are picked from — search box, keyboard, rows and all four
	 * empty states.
	 *
	 * UPSTREAM WRITES THIS TWICE. `SelectOptionsPopover` (the list hanging off a chip) and
	 * `FilterSubmenuContent` (the list hanging off the Add filter menu) are two ~130-line copies of
	 * the same list, and they have drifted in four places. Three of the four are reproduced as
	 * props, because they are real differences between the two surfaces:
	 *
	 *   `selectedCount`         the chip's list floats the selected options to the top under their
	 *                           own separator; the submenu's runs them in place
	 *   `onBack`                ArrowLeft closes the chip's list and steps out of the submenu
	 *   `autoHighlightFirst`    the submenu starts on row 0, the chip's list starts on nothing
	 *
	 * THE FOURTH IS A BUG AND IS NOT REPRODUCED. Only the submenu gives its listbox a `tabindex`
	 * and a key handler when `searchable: false` removes the search box; the chip's list, in the
	 * same configuration, ends up with no keyboard at all — which is precisely the configuration
	 * the first example on the page uses for `Status`. The handler is shared here, so both are
	 * navigable.
	 *
	 * A SECOND UPSTREAM BUG, in the same neighbourhood: the search box stops EVERY key from
	 * propagating, Escape and Tab included, so the chip's list cannot be dismissed from the
	 * keyboard at all — the submenu only works around it by handling Escape itself. Propagation is
	 * stopped here for the keys this list actually handles, and for printable keys, which the menu
	 * would otherwise consume as typeahead and use to move focus off the input mid-word. Escape and
	 * Tab reach the menu, and dismiss it.
	 *
	 * WHY THE ROWS ARE NOT `DropdownMenu.CheckboxItem`. Upstream's are, with `role="option"` written
	 * over the top so that the search box's `aria-activedescendant` has something valid to point at.
	 * bits-ui merges its own props AFTER the caller's, so the same override loses: the rows stay
	 * `role="menuitemcheckbox"`, and a `listbox` full of menu items is not a listbox. Rather than
	 * ship the combobox pattern with the one attribute that makes it true silently dropped, the rows
	 * are plain options — which is also what removes the second problem underneath, bits-ui's own
	 * roving focus and typeahead competing with the virtual highlight for the same arrow keys.
	 * The row's classes are `dropdown-menu-checkbox-item`'s, restated, so it still looks like what
	 * it sits among.
	 *
	 * `aria-selected` MARKS SELECTION, not the highlight. Upstream sets it from the highlight, which
	 * tells a screen reader that the row under the cursor is the chosen one; the highlight is what
	 * `aria-activedescendant` is for, and it already says it.
	 */

	/** `dropdown-menu-checkbox-item`'s own classes, for a row that is an option rather than an item. */
	const ROW =
		"relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-active:bg-accent data-active:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4";

	let {
		field,
		options,
		selectedCount = -1,
		values,
		multiple,
		isAsync,
		loading,
		error,
		i18n,
		search = $bindable(),
		onSearchChange,
		autoHighlightFirst = false,
		onToggle,
		onBack,
	}: FiltersOptionListProps<T> = $props();

	const baseId = $props.id();
	const listboxId = `${baseId}-listbox`;
	const searchable = $derived(field.searchable !== false);

	/**
	 * Whether the selected rows are floated to the top under their own separator, and — the same
	 * question one step earlier — whether this surface insets its rows at all. `-1` is the
	 * submenu, which does neither; `0` and up is the chip's list, which insets always and splits
	 * as soon as something is selected.
	 */
	const split = $derived(selectedCount > 0 && options.length > selectedCount);
	const groupClass = $derived(selectedCount >= 0 ? "px-1" : undefined);

	let highlightedIndex = $state(-1);

	/**
	 * Where the highlight lands when the list underneath it changes.
	 *
	 * Upstream splits this across two effects — one resetting to `-1` on every keystroke, one
	 * setting `0` whenever the option count changes — which overwrite each other in an order that
	 * depends on whether the count happened to move. Typing a letter that filtered nothing out
	 * therefore left the highlight somewhere different from typing one that did. One effect, one
	 * rule: the highlight goes back to the start of the list, and where the start is is the
	 * surface's own decision.
	 */
	$effect(() => {
		void search;
		const length = options.length;
		highlightedIndex = autoHighlightFirst && length > 0 ? 0 : -1;
	});

	// Keep the highlighted row in view. `block: 'nearest'` so a row already on screen does not
	// scroll, which is what makes hover-then-arrow feel continuous rather than jumping.
	$effect(() => {
		if (highlightedIndex < 0) return;
		document
			.getElementById(`${baseId}-item-${highlightedIndex}`)
			?.scrollIntoView({ block: "nearest" });
	});

	function move(delta: 1 | -1) {
		if (options.length === 0) return;
		const last = options.length - 1;
		if (delta === 1) highlightedIndex = highlightedIndex < last ? highlightedIndex + 1 : 0;
		else highlightedIndex = highlightedIndex > 0 ? highlightedIndex - 1 : last;
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				move(1);
				break;
			case "ArrowUp":
				event.preventDefault();
				move(-1);
				break;
			case "ArrowLeft": {
				// In the search box the caret comes first: only a caret already at 0 backs out of
				// the surface; anywhere else the key moves the caret — hence the bare `break`, so
				// the stop below still keeps bits-ui's own ArrowLeft from closing the submenu. The
				// non-searchable listbox has no caret and always backs out.
				const target = event.currentTarget;
				if (
					target instanceof HTMLInputElement &&
					(target.selectionStart !== 0 || target.selectionEnd !== 0)
				) {
					break;
				}
				event.preventDefault();
				onBack?.();
				break;
			}
			case "Enter": {
				if (highlightedIndex < 0) break;
				event.preventDefault();
				const option = options[highlightedIndex];
				if (option) onToggle(option);
				break;
			}
			case "Escape":
			case "Tab":
				// The two the menu owns. Everything else is stopped below so the menu's typeahead
				// never sees a letter meant for the search box.
				return;
		}
		event.stopPropagation();
	}
</script>

{#snippet optionRow(option: FilterOption<T>, index: number)}
	{@const selected = values.some((value) => isSameValue(field, value, option.value))}
	<!--
		A `<button>` carrying `role="option"`: the row IS a control, so it should be one, and the
		override only renames what it announces as. `tabindex={-1}` keeps it out of the tab order —
		the search box holds focus and points at the active row with `aria-activedescendant`, which
		is the whole combobox pattern and would break if Tab could land here.
	-->
	<button
		type="button"
		id={`${baseId}-item-${index}`}
		role="option"
		aria-selected={selected}
		tabindex={-1}
		data-active={highlightedIndex === index ? "" : undefined}
		class={cn(ROW, option.class)}
		onmouseenter={() => (highlightedIndex = index)}
		onclick={() => onToggle(option)}
	>
		{#if option.icon}{@render option.icon(option)}{/if}
		<span class="truncate">{option.label}</span>
		{#if selected}
			<span class="pointer-events-none absolute right-2 flex items-center justify-center">
				<CheckIcon />
			</span>
		{/if}
	</button>
{/snippet}

{#if searchable}
	<!--
		The magnifier is decoration, not an affordance: `aria-hidden`, and outside the input rather
		than an `<InputGroup.Addon>`. The group primitive draws a bordered, rounded shell — right for
		the Command palette, wrong for a row that has to sit flush against the top of a popover with
		its own separator underneath. The field's own left padding moves to `pl-8` to clear it:
		`left-2` plus a `size-4` glyph ends at 24px, so 32px leaves the same 8px the icon has on its
		own left.
	-->
	<div class="relative">
		<SearchIcon
			aria-hidden="true"
			class="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground"
		/>
		<Input
			id={`${baseId}-search`}
			autocomplete="off"
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={true}
			aria-haspopup="listbox"
			aria-controls={listboxId}
			aria-activedescendant={highlightedIndex >= 0
				? `${baseId}-item-${highlightedIndex}`
				: undefined}
			placeholder={i18n.placeholders.searchField(field.label || "")}
			class="h-8 rounded-none border-0 bg-transparent! pl-8! text-sm shadow-none focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0"
			bind:value={
				() => search,
				(value) => {
					if (value === search) return;
					search = value;
					onSearchChange?.(value);
				}
			}
			onclick={(event) => event.stopPropagation()}
			onkeydown={handleKeydown}
		/>
	</div>
	<Separator />
{/if}

<div class="relative flex max-h-full">
	<!--
		The scroll cap is the smaller of 24rem and the room the menu actually has. bits-ui publishes
		that room per primitive, and the two surfaces this list serves spell it differently — a chip's
		popover is a `dropdown-menu`, a field's submenu is a `menu` — so both names are tried before
		the 24rem fallback. Getting it wrong is silent: an undefined variable makes the whole `min()`
		invalid, the cap disappears, and the panel grows until its own scrollbar appears beside the
		list's.

		The list scrolls itself rather than through `ScrollArea`. The classic theme ships no custom scrollbar,
		so a column that scrolls is a column that scrolls — the Calendar page's time column already
		says so — and nesting one scroller inside another is what produced the two scrollbars.
	-->
	<div
		id={listboxId}
		role="listbox"
		aria-label={field.label}
		aria-multiselectable={multiple}
		tabindex={searchable ? -1 : 0}
		class="flex max-h-[min(var(--bits-dropdown-menu-content-available-height,var(--bits-menu-content-available-height,24rem)),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overflow-y-auto overscroll-contain outline-hidden"
		onkeydown={searchable ? undefined : handleKeydown}
	>
		{#if isAsync && loading && options.length === 0}
			<div class="py-2 text-center text-sm text-muted-foreground">{i18n.loadingOptions}</div>
		{:else if isAsync && error}
			<div class="py-2 text-center text-sm text-muted-foreground">{i18n.errorLoadingOptions}</div>
		{:else if options.length === 0}
			<div class="py-2 text-center text-sm text-muted-foreground">{i18n.noResultsFound}</div>
		{:else if field.renderOptionList}
			{@render field.renderOptionList({ options, highlightedIndex, renderOption: optionRow })}
		{:else if split}
			<!--
				Keyed by the field's `getOptionKey` when it declares one, by index when it does not.
				Stringifying the value is not an option: two object values both stringify to
				"[object Object]", and a duplicate key is a runtime error that takes the whole list
				down. The index loses nothing here — rows are stateless buttons and the highlight
				is index-based already.
			-->
			<div class={groupClass}>
				{#each options.slice(0, selectedCount) as option, index (field.getOptionKey?.(option.value) ?? index)}
					{@render optionRow(option, index)}
				{/each}
			</div>
			<Separator class="mx-0" />
			<div class={groupClass}>
				{#each options.slice(selectedCount) as option, index (field.getOptionKey?.(option.value) ?? index)}
					{@render optionRow(option, index + selectedCount)}
				{/each}
			</div>
		{:else}
			<div class={groupClass}>
				{#each options as option, index (field.getOptionKey?.(option.value) ?? index)}
					{@render optionRow(option, index)}
				{/each}
			</div>
		{/if}
	</div>
</div>
