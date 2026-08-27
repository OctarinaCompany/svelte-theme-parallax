<script lang="ts" module>
	import { tv } from "tailwind-variants";
	import type { Snippet } from "svelte";
	import type {
		Filter,
		FilterFieldsConfig,
		FilterI18nConfig,
		FilterSize,
		FilterVariant,
	} from "./types.js";

	/**
	 * How the chips and the Add filter button space themselves.
	 *
	 * `variant` is declared before `size`, as upstream declares it, and both would set a gap — so
	 * `size` wins the merge every time and `solid` has never once changed anything. The variant is
	 * kept as public API and left empty rather than given a gap that the next class discards; see
	 * `types.ts`.
	 */
	export const filtersVariants = tv({
		base: "flex flex-wrap items-center",
		variants: {
			variant: { solid: "", default: "" },
			size: { sm: "gap-1.5", default: "gap-2.5", lg: "gap-3.5" },
		},
		defaultVariants: { variant: "default", size: "default" },
	});

	export interface FiltersProps<T = unknown> {
		/**
		 * The active filters.
		 *
		 * Controlled, as upstream: this component never edits the array it was handed, it hands a
		 * new one to {@link onFiltersChange}. `bind:filters` is offered on top of that because a
		 * Svelte consumer expects it, and both are updated together — bind it, or listen, or do
		 * both.
		 */
		filters: Filter<T>[];
		/** The filterable fields, flat or grouped. */
		fields: FilterFieldsConfig<T>;
		/**
		 * Called with the next array whenever a filter is added, edited or removed. Named for the
		 * prop it pairs with (`bind:filters`), not upstream's bare `onChange` — the per-control
		 * `onChange` inside `types.ts` keeps upstream's name because it is scoped to one value.
		 */
		onFiltersChange?: (filters: Filter<T>[]) => void;
		class?: string;
		variant?: FilterVariant;
		size?: FilterSize;
		/** Merged over the English defaults, one level deep. */
		i18n?: Partial<FilterI18nConfig>;
		/** Whether the Add filter menu has a search box. */
		showSearchInput?: boolean;
		/** Replaces the Add filter button. Receives the menu trigger's props to spread. */
		trigger?: Snippet<[{ props: Record<string, unknown> }]>;
		/** Whether a field may be filtered on more than once. */
		allowMultiple?: boolean;
		/** Extra classes for the Add filter menu's panel. */
		menuPopupClass?: string;
		/** Whether a single keypress opens the Add filter menu. */
		enableShortcut?: boolean;
		/** The key that does it. */
		shortcutKey?: string;
		/** What the menu shows as the hint for it. */
		shortcutLabel?: string;
	}
</script>

<script lang="ts" generics="T">
	import PlusIcon from "@lucide/svelte/icons/plus";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { Button } from "$lib/components/ui/button/index.js";
	import { ButtonGroup, ButtonGroupText } from "$lib/components/ui/button-group/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Kbd } from "$lib/components/ui/kbd/index.js";
	import { cn } from "$lib/utils.js";
	import FiltersOperatorDropdown from "./filters-operator-dropdown.svelte";
	import FiltersRemoveButton from "./filters-remove-button.svelte";
	import FiltersSubmenuContent from "./filters-submenu-content.svelte";
	import FiltersValueSelector from "./filters-value-selector.svelte";
	import { setFiltersContext } from "./filters.svelte.js";
	import { mergeI18n } from "./filters-i18n.js";
	import {
		createFilter,
		fieldHasOptions,
		flattenFields,
		getFieldsMap,
		isSameValue,
	} from "./filters-utils.js";

	/**
	 * A row of filter chips, and the menu that adds one.
	 *
	 * The `Filters` root. The whole component is
	 * here is one 2 150-line file — split into the parts a Svelte reader would
	 * expect to find separately; `types.ts` records what the theme drops and why, and each file
	 * below records the decisions local to it.
	 *
	 * WHAT UPSTREAM SHIPS THAT THIS DOES NOT: `FiltersContent`, an exported component that renders
	 * the chips without the Add filter button. It reads a context that only `Filters` publishes,
	 * and `Filters` renders the chips itself and takes no children — so there is no arrangement in
	 * which `FiltersContent` renders anything but a second copy of the row already on screen. It is
	 * not ported. If the chips are ever wanted without the button, the honest shape is a prop on
	 * this component, not a second component that cannot be reached.
	 *
	 * THE ADD FILTER MENU IS FLAT. `fields` may be grouped, and every demo groups them, but
	 * the menu flattens the groups and shows no headings — upstream calls `flattenFields` on the
	 * way in. Reproduced: the groups are still what the config is written as, and a heading would
	 * be a design decision this theme has no mandate for.
	 */

	let {
		filters = $bindable(),
		fields,
		onFiltersChange,
		class: className,
		variant = "default",
		size = "default",
		i18n,
		showSearchInput = true,
		trigger,
		allowMultiple = true,
		menuPopupClass,
		enableShortcut = false,
		shortcutKey = "f",
		shortcutLabel = "F",
	}: FiltersProps<T> = $props();

	const rootId = $props.id();

	let addFilterOpen = $state(false);
	let menuSearch = $state("");
	let openSubMenu = $state<string | null>(null);
	let highlightedIndex = $state(-1);

	/** The chip whose input should take focus — set when a `text` filter is added, cleared after 1s. */
	let lastAddedFilterId = $state<string | null>(null);

	/**
	 * fieldKey → the id of the filter this menu session is building for it.
	 *
	 * Ticking three priorities in a submenu has to edit ONE filter, not add three. The map is what
	 * remembers which, and it is emptied when the menu closes so the next session starts a new one.
	 */
	let sessionFilterIds = $state<Record<string, string>>({});

	const mergedI18n = $derived(mergeI18n(i18n));
	const fieldsMap = $derived(getFieldsMap(fields));

	setFiltersContext({
		get size() {
			return size;
		},
		get variant() {
			return variant;
		},
		get i18n() {
			return mergedI18n;
		},
	});

	/** Everything the Add filter menu may list. `separator` entries and group headers are not fields. */
	const selectableFields = $derived(
		flattenFields(fields).filter((field) => {
			if (!field.key || field.type === "separator") return false;
			if (allowMultiple) return true;
			return !filters.some((filter) => filter.field === field.key);
		}),
	);

	const filteredFields = $derived(
		selectableFields.filter(
			(field) =>
				!menuSearch || (field.label?.toLowerCase().includes(menuSearch.toLowerCase()) ?? false),
		),
	);

	function emit(next: Filter<T>[]) {
		filters = next;
		onFiltersChange?.(next);
	}

	function updateFilter(filterId: string, updates: Partial<Filter<T>>) {
		emit(
			filters.map((filter) => {
				if (filter.id !== filterId) return filter;
				const updated = { ...filter, ...updates };
				// `is empty` has no value to hold, and leaving the old one would resurrect it the
				// moment the operator changed back.
				if (updates.operator === "empty" || updates.operator === "not_empty") {
					updated.values = [] as T[];
				}
				return updated;
			}),
		);
	}

	function removeFilter(filterId: string) {
		emit(filters.filter((filter) => filter.id !== filterId));
	}

	function addFilter(fieldKey: string) {
		const field = fieldsMap[fieldKey];
		if (!field?.key) return;

		const operator = field.defaultOperator || (field.type === "multiselect" ? "is_any_of" : "is");
		// A `text` filter starts with one empty string so its input renders; everything else starts
		// with nothing selected.
		const values = (field.type === "text" ? [""] : []) as T[];

		const filter = createFilter<T>(fieldKey, operator, values);
		lastAddedFilterId = filter.id;
		emit([...filters, filter]);

		addFilterOpen = false;
		menuSearch = "";
	}

	function hasSubmenu(field: (typeof selectableFields)[number]): boolean {
		return (field.type === "select" || field.type === "multiselect") && fieldHasOptions(field);
	}

	/**
	 * One toggle inside a field's submenu.
	 *
	 * Single-select adds a finished filter and closes the menu. Multiselect edits the session's
	 * filter, creating it on the first tick and deleting it again if the last one is unticked —
	 * which is what stops an empty `is any of` chip being left behind.
	 */
	function toggleFromSubmenu(fieldKey: string, value: T, isSelected: boolean) {
		const field = fieldsMap[fieldKey];
		if (!field) return;

		if (field.type !== "multiselect") {
			const filter = createFilter<T>(fieldKey, field.defaultOperator || "is", [value]);
			lastAddedFilterId = filter.id;
			emit([...filters, filter]);
			addFilterOpen = false;
			return;
		}

		const sessionId = sessionFilterIds[fieldKey];
		const session = sessionId ? filters.find((filter) => filter.id === sessionId) : undefined;
		const current = session?.values ?? [];
		const next = isSelected
			? current.filter((entry) => !isSameValue(field, entry, value))
			: [...current, value];

		if (!session) {
			const filter = createFilter<T>(fieldKey, field.defaultOperator || "is_any_of", next);
			sessionFilterIds = { ...sessionFilterIds, [fieldKey]: filter.id };
			emit([...filters, filter]);
			return;
		}

		if (next.length === 0) {
			sessionFilterIds = { ...sessionFilterIds, [fieldKey]: "" };
			emit(filters.filter((filter) => filter.id !== session.id));
			return;
		}

		emit(
			filters.map((filter) => (filter.id === session.id ? { ...filter, values: next } : filter)),
		);
	}

	function sessionValues(fieldKey: string): T[] {
		const sessionId = sessionFilterIds[fieldKey];
		if (!sessionId) return [];
		return filters.find((filter) => filter.id === sessionId)?.values ?? [];
	}

	/**
	 * The single-key shortcut.
	 *
	 * TWO GUARDS UPSTREAM DOES NOT HAVE. It tests the key alone, so with `shortcutKey="f"` the
	 * browser's own Ctrl/⌘+F never reaches the page — the menu opens instead. Modified presses are
	 * ignored here. And `contenteditable` is treated as typing, which upstream's `HTMLInputElement
	 * || HTMLTextAreaElement` test misses; a rich-text field on the same page would otherwise lose
	 * every `f` its user typed.
	 *
	 * `addFilterOpen` is read inside the handler rather than in the effect body on purpose: reading
	 * it here would re-register the listener on every open and close, for a value the handler can
	 * perfectly well read when it runs.
	 */
	$effect(() => {
		if (!enableShortcut) return;
		const key = shortcutKey.toLowerCase();

		function handleKeydown(event: KeyboardEvent) {
			if (event.key.toLowerCase() !== key) return;
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			if (addFilterOpen) return;

			const active = document.activeElement;
			if (
				active instanceof HTMLInputElement ||
				active instanceof HTMLTextAreaElement ||
				(active instanceof HTMLElement && active.isContentEditable)
			) {
				return;
			}

			event.preventDefault();
			addFilterOpen = true;
		}

		window.addEventListener("keydown", handleKeydown);
		return () => window.removeEventListener("keydown", handleKeydown);
	});

	/** The focus request expires: a chip should not steal focus a minute after it was added. */
	$effect(() => {
		if (!lastAddedFilterId) return;
		const timer = setTimeout(() => (lastAddedFilterId = null), 1000);
		return () => clearTimeout(timer);
	});

	/**
	 * Where the highlight sits. One rule, for the reason `filters-option-list.svelte` gives at
	 * length: upstream splits it across two effects that overwrite each other.
	 */
	$effect(() => {
		void menuSearch;
		const length = filteredFields.length;
		highlightedIndex = addFilterOpen && length > 0 ? 0 : -1;
	});

	$effect(() => {
		if (!addFilterOpen || highlightedIndex < 0) return;
		document
			.getElementById(`${rootId}-item-${highlightedIndex}`)
			?.scrollIntoView({ block: "nearest" });
	});

	function moveHighlight(delta: 1 | -1) {
		if (filteredFields.length === 0) return;
		const last = filteredFields.length - 1;
		if (delta === 1) highlightedIndex = highlightedIndex < last ? highlightedIndex + 1 : 0;
		else highlightedIndex = highlightedIndex > 0 ? highlightedIndex - 1 : last;
	}

	function handleMenuKeydown(event: KeyboardEvent) {
		const field = highlightedIndex >= 0 ? filteredFields[highlightedIndex] : undefined;

		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				moveHighlight(1);
				break;
			case "ArrowUp":
				event.preventDefault();
				moveHighlight(-1);
				break;
			case "ArrowRight":
				if (field && hasSubmenu(field)) {
					event.preventDefault();
					openSubMenu = field.key ?? null;
				}
				break;
			case "ArrowLeft":
				if (openSubMenu) {
					event.preventDefault();
					openSubMenu = null;
				}
				break;
			case "Enter": {
				if (!field?.key) break;
				event.preventDefault();
				if (!hasSubmenu(field)) addFilter(field.key);
				else openSubMenu = openSubMenu === field.key ? null : field.key;
				break;
			}
			case "Escape":
			case "Tab":
				// The menu's own. Left to propagate so it can dismiss itself.
				return;
		}
		event.stopPropagation();
	}
</script>

<div class={cn(filtersVariants({ variant, size }), className)}>
	{#if selectableFields.length > 0}
		<DropdownMenu.Root
			open={addFilterOpen}
			onOpenChange={(open) => {
				addFilterOpen = open;
				if (open) return;
				menuSearch = "";
				openSubMenu = null;
				// Ends the session: the next visit to a multiselect submenu starts a new chip
				// rather than extending the one built last time.
				sessionFilterIds = {};
			}}
		>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					{#if trigger}
						{@render trigger({ props })}
					{:else}
						<Button {...props} variant="outline" {size}>
							<PlusIcon />
							{mergedI18n.addFilter}
						</Button>
					{/if}
				{/snippet}
			</DropdownMenu.Trigger>

			<DropdownMenu.Content align="start" class={cn("w-[220px]", menuPopupClass)}>
				{#if showSearchInput}
					<!--
						A plain search box, not a combobox. The rows under it are `DropdownMenu.Item`s, and
						bits-ui merges its own `role="menuitem"` over anything written here — so the
						`role="option"` upstream writes on them would be dropped, and a `combobox` whose
						`aria-activedescendant` points at a menu item claims a relationship that is not
						there. The chip's option list, whose rows this component does own, keeps the full
						combobox pattern; see `filters-option-list.svelte`.
					-->
					<!--
						The magnifier matches the one on the option list, and is here for the same reason it
						is there: it is the only mark that tells a borderless row at the top of a panel that
						it takes typing. Decoration, so `aria-hidden` — the field already has its own label.
					-->
					<div class="relative">
						<SearchIcon
							aria-hidden="true"
							class="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id={`${rootId}-search`}
							type="search"
							autocomplete="off"
							aria-label={mergedI18n.searchFields}
							placeholder={mergedI18n.searchFields}
							class="h-8 rounded-none border-0 bg-transparent! pl-8! text-sm shadow-none focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0"
							bind:value={menuSearch}
							onclick={(event) => event.stopPropagation()}
							onkeydown={handleMenuKeydown}
						/>
						{#if enableShortcut && shortcutLabel}
							<Kbd class="absolute top-1/2 right-2 -translate-y-1/2 border bg-background">
								{shortcutLabel}
							</Kbd>
						{/if}
					</div>
					<DropdownMenu.Separator />
				{/if}

				<div class="relative flex max-h-full">
					<!--
						The cap is the room bits-ui says the panel has, or 24rem, whichever is smaller. An
						undefined variable makes the whole `min()` invalid and the cap silently disappear,
						so the name has to be the one this primitive publishes — `dropdown-menu`, here.
					-->
					<!--
						No key handling of its own when the search box is gone, unlike the chip's option
						list. There the rows are this component's own buttons and nothing else would move
						between them; here they are bits-ui menu items, and bits-ui already drives them
						with arrow keys and typeahead. The custom highlight exists only to be driven FROM
						the search box.
					-->
					<div
						class="flex max-h-[min(var(--bits-dropdown-menu-content-available-height,24rem),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overflow-y-auto overscroll-contain outline-hidden"
					>
						{#if filteredFields.length === 0}
							<div class="py-2 text-center text-sm text-muted-foreground">
								{mergedI18n.noFieldsFound}
							</div>
						{:else}
							{#each filteredFields as field, index (field.key)}
								{@const active = highlightedIndex === index}
								{#if hasSubmenu(field)}
									<DropdownMenu.Sub
										open={openSubMenu === field.key}
										onOpenChange={(open) => {
											if (open) openSubMenu = field.key ?? null;
											else if (openSubMenu === field.key) openSubMenu = null;
										}}
									>
										<DropdownMenu.SubTrigger
											id={`${rootId}-item-${index}`}
											data-active={active ? "" : undefined}
											class="data-open:bg-accent data-open:text-accent-foreground data-active:bg-accent data-active:text-accent-foreground"
											onmouseenter={() => (highlightedIndex = index)}
										>
											{#if field.icon}{@render field.icon()}{/if}
											<span>{field.label}</span>
										</DropdownMenu.SubTrigger>
										<!--
											PORTALLED, unlike `DropdownMenu.SubContent`'s own default. A submenu renders
											as a DOM child of the panel that opened it, and this panel clips on both
											axes — `dropdown-menu-content` is `overflow-x-hidden overflow-y-auto`, and
											the scroll box above adds its own `overflow-y-auto`, which CSS resolves to
											`overflow-x: auto` on the other axis. The submenu opens to the RIGHT of
											that boundary, so every pixel of it lands outside and it is invisible.
											Portalling moves it to the body, where the only thing positioning it is
											the floating layer anchored to its trigger.
										-->
										<!--
											`sideOffset` IS THE PANEL'S PADDING PLUS THE MENU GAP: 4 + 4.

											A submenu is anchored to its trigger, not to the panel, and the trigger
											sits inside `dropdown-menu-content`'s `p-1` — so at the default offset of
											0 the submenu starts 4px SHORT of the panel's edge and slides under it.
											Paying back that 4px only makes the two flush, which is where the Menubar
											page's submenus sit and looks right there — but that page also strips the
											shadow (`shadow-none`, the classic `dropdown-box-shadow`). This menu
											keeps shadcn's elevation, and `shadow-lg` blurs 15px in every direction with
											no offset: flush against the parent, the submenu smears its own shadow across
											it and the seam reads as two panels fighting. The second 4px is the same air a
											top-level menu already takes from its trigger — `dropdown-menu-content`'s own
											`sideOffset = 4`.
										-->
										<DropdownMenu.Portal>
											<DropdownMenu.SubContent sideOffset={8} class="w-[200px]">
												<FiltersSubmenuContent
													{field}
													currentValues={sessionValues(field.key!)}
													multiple={field.type === "multiselect"}
													onToggle={(value, isSelected) =>
														toggleFromSubmenu(field.key!, value, isSelected)}
													onBack={() => (openSubMenu = null)}
												/>
											</DropdownMenu.SubContent>
										</DropdownMenu.Portal>
									</DropdownMenu.Sub>
								{:else}
									<DropdownMenu.Item
										id={`${rootId}-item-${index}`}
										data-active={active ? "" : undefined}
										class="data-active:bg-accent data-active:text-accent-foreground"
										onmouseenter={() => (highlightedIndex = index)}
										onSelect={() => field.key && addFilter(field.key)}
									>
										{#if field.icon}{@render field.icon()}{/if}
										<span>{field.label}</span>
									</DropdownMenu.Item>
								{/if}
							{/each}
						{/if}
					</div>
				</div>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{/if}

	{#each filters as filter (filter.id)}
		{@const field = fieldsMap[filter.field]}
		{#if field}
			<ButtonGroup>
				<!--
					The leading segment keeps `ButtonGroupText`'s muted ground. Repainting it to
					match its outline buttons; the classic theme's `.input-group-text` is an addon with a ground
					of its own, and the label is the one part of a chip that is not a control.
				-->
				<ButtonGroupText>
					{#if field.icon}{@render field.icon()}{/if}
					{field.label}
				</ButtonGroupText>

				<FiltersOperatorDropdown
					{field}
					operator={filter.operator}
					values={filter.values}
					onChange={(operator) => updateFilter(filter.id, { operator })}
				/>

				<FiltersValueSelector
					{field}
					values={filter.values}
					operator={filter.operator}
					onChange={(values) => updateFilter(filter.id, { values })}
					autofocus={filter.id === lastAddedFilterId}
				/>

				<FiltersRemoveButton
					label={`Remove ${field.label ?? filter.field} filter`}
					onclick={() => removeFilter(filter.id)}
				/>
			</ButtonGroup>
		{/if}
	{/each}
</div>
